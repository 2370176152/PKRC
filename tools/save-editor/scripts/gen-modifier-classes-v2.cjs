// 正确生成 modifier-classes.js: 从 modifier-type.ts 中提取每个 typeId 的实际 Modifier 类名
const fs = require("fs");
const path = require("path");
// 上游 PokeRogue 源码树位置：默认仓库同级 pokerogue-upstream，可用环境变量 POKEROGUE_UPSTREAM 覆盖
const UPSTREAM = process.env.POKEROGUE_UPSTREAM || path.resolve(__dirname, "..", "..", "..", "..", "pokerogue-upstream");

function stripComments(code) {
  let out = "";
  let i = 0;
  let inString = false;
  let stringChar = null;
  while (i < code.length) {
    const c = code[i];
    const next = code[i + 1];
    if (inString) {
      out += c;
      if (c === "\\") { out += next || ""; i += 2; continue; }
      if (c === stringChar) inString = false;
      i++; continue;
    }
    if (c === '"' || c === "'" || c === "`") { inString = true; stringChar = c; out += c; i++; continue; }
    if (c === "/" && next === "*") {
      const end = code.indexOf("*/", i + 2);
      if (end === -1) break;
      i = end + 2; continue;
    }
    if (c === "/" && next === "/") {
      const end = code.indexOf("\n", i + 2);
      if (end === -1) break;
      i = end; continue;
    }
    out += c; i++;
  }
  return out;
}

const srcPath = path.join(UPSTREAM, "src", "modifier", "modifier-type.ts");
const raw = fs.readFileSync(srcPath, "utf8");
const clean = stripComments(raw);

// 提取 modifierTypeInitObj 对象的内容
const initObjMatch = clean.match(/const modifierTypeInitObj\s*=\s*Object\.freeze\(\{([\s\S]*?)\n\}\)\s*;/);
if (!initObjMatch) {
  console.error("找不到 modifierTypeInitObj");
  // 输出前 100 字符调试
  console.log("clean 前 300 字符:", clean.substring(0, 300));
  const alt = clean.match(/modifierTypeInitObj[^=]*=[^=]*\{/);
  if (alt) console.log("找到部分匹配:", alt[0]);
  process.exit(1);
}
const initObjBody = initObjMatch[1];

// 解析每个 key: value 对
// 用简单的大括号计数来分割
const entries = [];
let depth = 0;
let currentKey = null;
let currentValue = "";
let lines = initObjBody.split("\n");
let inEntry = false;

for (const line of lines) {
  // 匹配新的 key: 开头（顶级深度）
  const keyMatch = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*:\s*\(\)\s*=>\s*/);
  if (keyMatch && depth === 0) {
    if (currentKey) {
      entries.push({ key: currentKey, value: currentValue.trim() });
    }
    currentKey = keyMatch[1];
    currentValue = line.substring(keyMatch[0].length);
    // 计算这一行的深度变化
    for (const c of currentValue) {
      if (c === "{" || c === "(") depth++;
      if (c === "}" || c === ")") depth--;
    }
    inEntry = true;
  } else if (inEntry) {
    currentValue += "\n" + line;
    for (const c of line) {
      if (c === "{" || c === "(") depth++;
      if (c === "}" || c === ")") depth--;
    }
    if (depth === 0) {
      // 这一条可能结束了（但要注意可能后面还有 , 或链式调用）
      // 简单处理：如果深度为 0 且行尾是 , 则这一条结束
      if (line.trim().endsWith(",")) {
        entries.push({ key: currentKey, value: currentValue.trim().replace(/,$/, "") });
        currentKey = null;
        currentValue = "";
        inEntry = false;
      }
    }
  }
}
if (currentKey) {
  entries.push({ key: currentKey, value: currentValue.trim().replace(/,$/, "") });
}

// 从每个条目中提取 modifier 类名
function extractModifierClass(value, key) {
  // 方法1: 找 PokemonHeldItemModifierType 的第三个参数 new XXXModifier(
  const heldItemMatch = value.match(/new PokemonHeldItemModifierType\s*\(/);
  if (heldItemMatch) {
    // 找第三个参数里的 new XXXModifier
    // 格式: new PokemonHeldItemModifierType("...", "item_name", (type, args) => new XXXModifier(...), ...)
    // 找 factory 函数里的 new
    const factoryMatch = value.match(/\(\s*type\s*,\s*args\s*\)\s*=>\s*new\s+(\w+)/);
    if (factoryMatch) return factoryMatch[1];
    // 也可能只有一个参数
    const factoryMatch2 = value.match(/\(\s*type\s*\)\s*=>\s*new\s+(\w+)/);
    if (factoryMatch2) return factoryMatch2[1];
  }

  // 方法2: 找 new XXXModifierType 形式的直接构造
  // 例如: new MoneyRewardModifierType(...) → 找对应的 modifier 类
  // 这些需要从 modifier.ts 中找对应关系, 先记为 ModifierType 类名 (需要后处理)
  const directTypeMatch = value.match(/^\s*new\s+(\w+ModifierType)\s*\(/);
  if (directTypeMatch) return directTypeMatch[1];

  // 方法3: ModifierTypeGenerator (生成器)
  if (value.includes("ModifierTypeGenerator")) {
    // 找生成器内部的 new XXXModifierType
    const genTypeMatch = value.match(/return\s+new\s+(\w+ModifierType)\s*\(/);
    if (genTypeMatch) return genTypeMatch[1];
    return "ModifierTypeGenerator";
  }

  return null;
}

// 先提取所有 type 类名
const results = {};
for (const entry of entries) {
  const cls = extractModifierClass(entry.value, entry.key);
  const isGenerator = entry.value.includes("ModifierTypeGenerator");
  results[entry.key] = {
    typeClass: cls,
    isGenerator,
  };
}

// 现在找 Modifier 类名
// 策略: 从 modifier.ts 中找 "class XXXModifier extends"，然后建立 ModifierType → Modifier 的映射
// 实际上更简单的方法：从代码模式推断
// PokemonHeldItemModifierType 的第三个参数直接给了 modifier 类名 ✓
// 其他类型需要手动映射或从代码找

// 从 modifier.ts 提取所有 Modifier 类
const modifierPath = path.join(UPSTREAM, "src", "modifier", "modifier.ts");
const modifierRaw = fs.readFileSync(modifierPath, "utf8");
const modifierClean = stripComments(modifierRaw);
const modifierClassRegex = /export\s+class\s+(\w+Modifier)\s+extends\s+(\w+)/g;
const modifierClasses = {};
let m;
while ((m = modifierClassRegex.exec(modifierClean)) !== null) {
  modifierClasses[m[1]] = m[2];
}

console.log(`找到 ${Object.keys(modifierClasses).length} 个 Modifier 类`);

// 对于每个 typeId，尝试找到对应的 modifier 类名
// 已知的映射模式：
// - PokemonHeldItemModifierType 的第三个参数直接给出 ✓
// - 其他类型：通过命名约定匹配（去掉 Type 后缀）
//   例如：MoneyRewardModifierType → MoneyRewardModifier

function guessModifierClass(typeClass) {
  if (!typeClass) return null;
  // 直接去掉末尾的 Type
  if (typeClass.endsWith("ModifierType")) {
    const candidate = typeClass.replace(/ModifierType$/, "Modifier");
    if (modifierClasses[candidate]) return candidate;
  }
  return null;
}

const finalResults = {};
for (const [key, info] of Object.entries(results)) {
  let modifierClass = null;
  let typeClass = info.typeClass;

  if (typeClass && typeClass !== "ModifierTypeGenerator") {
    // 如果是 PokemonHeldItemModifierType 类型，则 typeClass 是从 factory 提取的，已经是 Modifier 类名
    if (modifierClasses[typeClass]) {
      // 已经是 Modifier 类名（从 factory 提取的）
      modifierClass = typeClass;
      // typeClass 需要另外找
      // 从 value 中找 new XXXModifierType
      const entry = entries.find(e => e.key === key);
      if (entry) {
        const tcMatch = entry.value.match(/new\s+(\w+ModifierType)\s*\(/);
        if (tcMatch) typeClass = tcMatch[1];
      }
    } else {
      // typeClass 是 ModifierType 类名，猜测 Modifier 类名
      modifierClass = guessModifierClass(typeClass);
    }
  }

  finalResults[key] = {
    className: modifierClass || "PersistentModifier",
    typeClass: typeClass || "UnknownModifierType",
    isGenerator: info.isGenerator,
  };
}

// 从存档中已知的正确映射来验证和修正
const knownCorrect = {
  LEFTOVERS: "TurnHealModifier",
  WIDE_LENS: "PokemonMoveAccuracyBoosterModifier",
  MULTI_LENS: "PokemonMultiHitModifier",
  EXP_SHARE: "ExpShareModifier",
  SUPER_EXP_CHARM: "ExpBoosterModifier",
  EXP_CHARM: "ExpBoosterModifier",
  CANDY_JAR: "LevelIncrementBoosterModifier",
  SHELL_BELL: "HitHealModifier",
  LOCK_CAPSULE: "LockModifierTiersModifier",
  MAX_LURE: "DoubleBattleChanceBoosterModifier",
  LURE: "DoubleBattleChanceBoosterModifier",
  GOLDEN_POKEBALL: "ExtraModifierModifier",
  SOUL_DEW: "PokemonNatureWeightModifier",
  BERRY: "BerryModifier",
  BASE_STAT_BOOSTER: "BaseStatModifier",
  ATTACK_TYPE_BOOSTER: "AttackTypeBoosterModifier",
  ENEMY_DAMAGE_REDUCTION: "EnemyDamageReducerModifier",
  TEMP_STAT_STAGE_BOOSTER: "TempStatStageBoosterModifier",
  MYSTERY_ENCOUNTER_MACHO_BRACE: "PokemonIncrementingStatModifier",
  GRIP_CLAW: "ContactHeldItemTransferChanceModifier",
  MINI_BLACK_HOLE: "TurnHeldItemTransferModifier",
  MINT: "PokemonNatureChangeModifier",
  TERA_SHARD: "TerastallizeModifier",
  TERA_ORB: "TerastallizeAccessModifier",
  BERRY_POUCH: "PreserveBerryModifier",
  SHINY_CHARM: "ShinyRateBoosterModifier",
  CATCHING_CHARM: "CriticalCatchChanceBoosterModifier",
};

let corrected = 0;
for (const [key, correctClass] of Object.entries(knownCorrect)) {
  if (finalResults[key] && finalResults[key].className !== correctClass) {
    finalResults[key].className = correctClass;
    corrected++;
  }
}

// 分类
const categories = {
  held: new Set(),     // 携带物
  pokemon: new Set(),  // 非携带的宝可梦相关
  global: new Set(),   // 全局道具
  generator: new Set(), // 生成器
};

// 判断携带物: className extends PokemonHeldItemModifier
function isHeldModifier(className) {
  // 从 modifierClasses 中找继承链
  let current = className;
  let visited = new Set();
  while (current && !visited.has(current)) {
    visited.add(current);
    if (current === "PokemonHeldItemModifier") return true;
    current = modifierClasses[current];
  }
  return false;
}

for (const [key, info] of Object.entries(finalResults)) {
  if (info.isGenerator) {
    categories.generator.add(key);
  }
  // 判断是否为携带物: 两种情况
  // 1. typeClass 是 PokemonHeldItemModifierType (直接携带物类型)
  // 2. modifier 类继承自 PokemonHeldItemModifier (生成器生成的携带物 modifier)
  const isHeldType = info.typeClass === "PokemonHeldItemModifierType";
  const isHeldByClass = isHeldModifier(info.className);
  if (isHeldType || isHeldByClass) {
    categories.held.add(key);
  }
}
// These modifier types subclass PokemonHeldItemModifierType indirectly, so their
// specific type classes are not recognized by the direct-name check above.
categories.held.add("GRIP_CLAW");
categories.held.add("MINI_BLACK_HOLE");

// 生成文件
let out = "// 自动生成: modifier 类型映射 (typeId -> { className, isHeld, isGenerator, typeClass })\n";
out += "const MODIFIER_CLASSES = {\n";
for (const [key, info] of Object.entries(finalResults)) {
  const isHeld = categories.held.has(key);
  out += `  "${key}": { className: "${info.className}", isHeld: ${isHeld}, isGenerator: ${info.isGenerator}, typeClass: "${info.typeClass}" },\n`;
}
out += "};\n";

fs.writeFileSync(path.join(__dirname, "..", "data", "modifier-classes.js"), out, "utf8");

console.log(`\n已生成 ${Object.keys(finalResults).length} 个类型映射`);
console.log(`  携带物: ${categories.held.size} 种`);
console.log(`  生成器: ${categories.generator.size} 种`);
console.log(`  从已知存档修正: ${corrected} 个`);

// 输出几个验证
console.log("\n验证:");
for (const k of ["LEFTOVERS", "SHELL_BELL", "BASE_STAT_BOOSTER", "ATTACK_TYPE_BOOSTER", "TERA_SHARD", "MINT", "SOUL_DEW", "BERRY"]) {
  const r = finalResults[k];
  if (r) console.log(`  ${k}: className=${r.className}, isHeld=${categories.held.has(k)}, isGen=${r.isGenerator}`);
}
