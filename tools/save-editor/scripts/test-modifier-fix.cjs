// 验证 createRealModifier 生成的数据结构
const fs = require("fs");
const path = require("path");

// 把所有 JS 文件内容合并到一个字符串再 eval
const modifierClassesJs = fs.readFileSync(path.join(__dirname, "..", "data", "modifier-classes.js"), "utf8");
const modifierExpandedJs = fs.readFileSync(path.join(__dirname, "..", "data", "modifier-expanded.js"), "utf8");

const html = fs.readFileSync(path.join(__dirname, "..", "save-editor.html"), "utf8");
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
const mainScript = scriptMatch[1];

// 提取 createRealModifier 函数
const createFnMatch = mainScript.match(/function createRealModifier\([^)]*\)\s*\{[\s\S]*?\n\}\s*\n/);
const repairFnMatch = mainScript.match(/function repairModifiers\([^)]*\)\s*\{[\s\S]*?\n\}\s*\n/);

// 在同一作用域执行
const combinedCode = `
${modifierClassesJs}
${modifierExpandedJs}
${createFnMatch[0]}
${repairFnMatch[0]}

const saveFiles = {
  "test.prsv": {
    data: {
      party: [
        { id: 0, species: 25, name: "皮卡丘" },
        { id: 1, species: 6, name: "喷火龙" },
      ],
      modifiers: [],
      enemyModifiers: [],
    },
    dirty: false,
  },
};
let currentFile = "test.prsv";
`;

eval(combinedCode);

console.log("=== 测试 createRealModifier 生成结果 ===\n");

const tests = [
  { type: "BASE_STAT_BOOSTER", pregen: [1], pkmIdx: 0, desc: "攻击增强剂（第一只宝可梦）" },
  { type: "BASE_STAT_BOOSTER", pregen: [3], pkmIdx: 1, desc: "特攻增强剂（第二只宝可梦）" },
  { type: "ATTACK_TYPE_BOOSTER", pregen: [10], pkmIdx: 0, desc: "木炭/火系威力（第一只宝可梦）" },
  { type: "ATTACK_TYPE_BOOSTER", pregen: [11], pkmIdx: 0, desc: "神秘水滴/水系威力（第一只宝可梦）" },
  { type: "TERA_SHARD", pregen: [10], pkmIdx: 1, desc: "火太晶碎块（第二只宝可梦）" },
  { type: "MINT", pregen: [3], pkmIdx: 0, desc: "固执薄荷（第一只宝可梦）" },
  { type: "LEFTOVERS", pregen: [], pkmIdx: 0, desc: "剩饭（普通携带物）" },
  { type: "EXP_CHARM", pregen: [], pkmIdx: null, desc: "经验护符（全局道具）" },
  { type: "SOUL_DEW", pregen: [10], pkmIdx: 0, desc: "心之水滴（第一只宝可梦）" },
];

let allPass = true;
for (const t of tests) {
  const mod = createRealModifier(t.type, t.pregen, t.pkmIdx, false);
  console.log(`${t.desc}:`);
  console.log(`  typeId: ${mod.typeId}`);
  console.log(`  className: ${mod.className}`);
  console.log(`  args: [${mod.args.join(", ")}]`);
  console.log(`  typePregenArgs: [${mod.typePregenArgs.join(", ")}]`);
  console.log();
}

// ===== 结构验证（与游戏源码对比） =====
console.log("=== 结构验证（与游戏源码对比）===\n");

const expected = {
  "BASE_STAT_BOOSTER": {
    className: "BaseStatModifier",
    argsLen: 2,  // [pokemonId, stat]
    source: "BaseStatModifier.getArgs() = [pokemonId, stat]",
  },
  "ATTACK_TYPE_BOOSTER": {
    className: "AttackTypeBoosterModifier",
    argsLen: 3,  // [pokemonId, moveType, boostPercent]
    source: "AttackTypeBoosterModifier.getArgs() = [pokemonId, moveType, boostPercent]",
  },
  "TERA_SHARD": {
    className: "TerastallizeModifier",
    argsLen: 2,  // [pokemonId, teraType]
    source: "TerastallizeModifier constructor(type, pokemonId, teraType)",
  },
  "SOUL_DEW": {
    className: "TerastallizeModifier",
    argsLen: 2,  // [pokemonId, teraType]
    source: "存档验证: SOUL_DEW args=[0, 10] 正常工作",
  },
  "MINT": {
    className: "PokemonNatureChangeModifier",
    argsLen: 2,  // [pokemonId, nature]
    source: "PokemonNatureChangeModifier constructor(type, pokemonId, nature)",
  },
  "LEFTOVERS": {
    className: "TurnHealModifier",
    argsLen: 1,  // [pokemonId]
    source: "PokemonHeldItemModifier.getArgs() = [pokemonId]",
  },
};

for (const [type, exp] of Object.entries(expected)) {
  const cls = MODIFIER_CLASSES[type];
  const pass = cls && cls.className === exp.className;
  console.log(`${type}: ${pass ? '✅' : '❌'} className=${cls?.className} (期望: ${exp.className})`);
  if (!pass) allPass = false;
}

// 验证生成的 args 长度
console.log("\n生成的 args 长度验证:");
for (const [type, exp] of Object.entries(expected)) {
  // 用第一只宝可梦测试
  const testPregen = type === "LEFTOVERS" || type === "EXP_CHARM" ? [] : [1];
  const testPkm = type === "EXP_CHARM" ? null : 0;
  const mod = createRealModifier(type, testPregen, testPkm, false);
  const pass = mod.args.length === exp.argsLen;
  console.log(`  ${type}: args.length=${mod.args.length} (期望: ${exp.argsLen}) ${pass ? '✅' : '❌'}`);
  if (!pass) allPass = false;
}

console.log(`\n总体验证: ${allPass ? '✅ 全部通过' : '❌ 有失败'}`);
