// 生成 modifier-expanded.js: 将生成器类型展开为具体可选项
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

// 解析 TypeScript 枚举，返回 { name: value } 映射
function parseEnum(filePath, enumName) {
  const raw = fs.readFileSync(filePath, "utf8");
  const clean = stripComments(raw);
  const match = clean.match(new RegExp(`export enum ${enumName}\\s*\\{([\\s\\S]*?)\\}`));
  const result = {};
  if (!match) return result;
  const body = match[1];
  let nextValue = 0;
  const entries = body.split(",");
  for (const entry of entries) {
    const trimmed = entry.trim();
    if (!trimmed) continue;
    const eqMatch = trimmed.match(/^(\w+)\s*=\s*(-?\d+)/);
    if (eqMatch) {
      const name = eqMatch[1];
      const val = parseInt(eqMatch[2], 10);
      result[name] = val;
      nextValue = val + 1;
    } else {
      const nameMatch = trimmed.match(/^(\w+)/);
      if (nameMatch) {
        result[nameMatch[1]] = nextValue;
        nextValue++;
      }
    }
  }
  return result;
}

const natureEnum = parseEnum(path.join(UPSTREAM, "src", "enums", "nature.ts"), "Nature");
const typeEnum = parseEnum(path.join(UPSTREAM, "src", "enums", "pokemon-type.ts"), "PokemonType");

// 读取 i18n 数据
const modifierTypeJson = JSON.parse(fs.readFileSync(path.join(UPSTREAM, "dist", "locales", "zh-Hans", "modifier-type.json"), "utf8"));
const natureJson = JSON.parse(fs.readFileSync(path.join(UPSTREAM, "dist", "locales", "zh-Hans", "nature.json"), "utf8"));

// 读取正确的 className 映射
const MODIFIER_CLASSES = {};
const classesContent = fs.readFileSync(path.join(__dirname, "..", "data", "modifier-classes.js"), "utf8");
const classRegex = /"(\w+)":\s*\{\s*className:\s*"(\w+)"[^}]*\}/g;
let cm;
while ((cm = classRegex.exec(classesContent)) !== null) {
  MODIFIER_CLASSES[cm[1]] = cm[2];
}

function enumToCamel(s) {
  return s.toLowerCase().replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

// 属性中文名
const typeNamesZh = {
  NORMAL: "一般", FIGHTING: "格斗", FLYING: "飞行", POISON: "毒",
  GROUND: "地面", ROCK: "岩石", BUG: "虫", GHOST: "幽灵",
  STEEL: "钢", FIRE: "火", WATER: "水", GRASS: "草",
  ELECTRIC: "电", PSYCHIC: "超能力", ICE: "冰", DRAGON: "龙",
  DARK: "恶", FAIRY: "妖精", STELLAR: "星晶",
};

// 按 enum value 排序的 nature 名列表
const natureNames = Object.entries(natureEnum)
  .sort((a, b) => a[1] - b[1])
  .map(([name]) => name);

// ===== 构建展开选项 =====
const expanded = [];

// 1. 薄荷 (MINT) - 25种性格
for (let i = 0; i < natureNames.length; i++) {
  const nat = natureNames[i];
  const camelKey = enumToCamel(nat);
  const zhName = natureJson[camelKey] || nat;
  expanded.push({
    baseTypeId: "MINT",
    typePregenArgs: [i],
    name: `${zhName}薄荷`,
    description: `将一只宝可梦的性格改为${zhName}并永久解锁该性格。`,
    className: MODIFIER_CLASSES["MINT"] || "PokemonNatureChangeModifier",
    isHeld: false,
  });
}

// 2. 太晶碎块 (TERA_SHARD) - 18种普通 + 星晶 = 19种
// 排除 UNKNOWN(-1) 和 CURSE_TYPE
const teraTypeNames = Object.entries(typeEnum)
  .filter(([name, val]) => name !== "UNKNOWN" && name !== "CURSE_TYPE" && val >= 0)
  .sort((a, b) => a[1] - b[1])
  .map(([name]) => name);

for (const typ of teraTypeNames) {
  const typeId = typeEnum[typ];
  const zhName = typeNamesZh[typ] || typ;
  expanded.push({
    baseTypeId: "TERA_SHARD",
    typePregenArgs: [typeId],
    name: `${zhName}太晶碎块`,
    description: `将宝可梦的太晶属性变为${zhName}。`,
    className: MODIFIER_CLASSES["TERA_SHARD"] || "TerastallizeModifier",
    isHeld: false,
  });
}

// 3. 基础属性提升 (BASE_STAT_BOOSTER) - 6种
const baseStatItems = modifierTypeJson["BaseStatBoosterItem"] || {};
const statOrder = ["HP", "ATK", "DEF", "SPATK", "SPDEF", "SPD"];
const statItemKeys = ["hp_up", "protein", "iron", "calcium", "zinc", "carbos"];
const statZhNames = { HP: "HP", ATK: "攻击", DEF: "防御", SPATK: "特攻", SPDEF: "特防", SPD: "速度" };

for (let i = 0; i < statOrder.length; i++) {
  const stat = statOrder[i];
  const itemKey = statItemKeys[i];
  const zhName = baseStatItems[itemKey] || `${stat}增强剂`;
  const statZh = statZhNames[stat];
  expanded.push({
    baseTypeId: "BASE_STAT_BOOSTER",
    typePregenArgs: [i],
    name: zhName,
    description: `增加10%持有者的${statZh}，个体值越高堆叠上限越高。`,
    className: MODIFIER_CLASSES["BASE_STAT_BOOSTER"] || "BaseStatModifier",
    isHeld: true,
  });
}

// 4. 招式类型威力提升 (ATTACK_TYPE_BOOSTER) - 18种
const atkTypeItems = modifierTypeJson["AttackTypeBoosterItem"] || {};
const atkTypeItemKeys = Object.keys(atkTypeItems);
// AttackTypeBoosterItem 的顺序与 PokemonType 中 NORMAL..FAIRY 一致 (共18种, 不含 STELLAR)
const atkTypeOrder = Object.entries(typeEnum)
  .filter(([name, val]) => name !== "UNKNOWN" && name !== "CURSE_TYPE" && name !== "STELLAR" && val >= 0)
  .sort((a, b) => a[1] - b[1])
  .map(([name]) => name);

for (let i = 0; i < atkTypeItemKeys.length; i++) {
  const itemKey = atkTypeItemKeys[i];
  const typ = atkTypeOrder[i];
  const typeId = typeEnum[typ];
  if (typeId === undefined) continue;
  const zhName = atkTypeItems[itemKey] || `${typeNamesZh[typ] || typ}宝石`;
  const zhType = typeNamesZh[typ] || typ;
  expanded.push({
    baseTypeId: "ATTACK_TYPE_BOOSTER",
    typePregenArgs: [typeId],
    name: zhName,
    description: `一只宝可梦的${zhType}系招式威力提升20%。`,
    className: MODIFIER_CLASSES["ATTACK_TYPE_BOOSTER"] || "AttackTypeBoosterModifier",
    isHeld: true,
  });
}

// 生成文件
let out = "// 自动生成: 展开后的生成器类型具体选项\n";
out += "// 每个选项: { baseTypeId, typePregenArgs, name, description, className, isHeld }\n";
out += "const MODIFIER_EXPANDED = [\n";
for (const item of expanded) {
  const escName = item.name.replace(/"/g, '\\"');
  const escDesc = item.description.replace(/"/g, '\\"');
  out += `  { baseTypeId: "${item.baseTypeId}", typePregenArgs: [${item.typePregenArgs.join(", ")}], name: "${escName}", description: "${escDesc}", className: "${item.className}", isHeld: ${item.isHeld} },\n`;
}
out += "];\n";

fs.writeFileSync(path.join(__dirname, "..", "data", "modifier-expanded.js"), out, "utf8");
console.log(`已生成 ${expanded.length} 个展开选项`);
console.log(`  薄荷: ${natureNames.length} 种`);
console.log(`  太晶碎块: ${teraTypeNames.length} 种`);
console.log(`  基础属性增强剂: ${statOrder.length} 种`);
console.log(`  属性威力道具: ${atkTypeItemKeys.length} 种`);
