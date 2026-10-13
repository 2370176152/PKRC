// 生成 modifier-names.js: typeId -> 中文名
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

// 读取 modifier-type.ts, 提取 modifierTypeInitObj 中的 TYPE_ID
const mtPath = path.join(UPSTREAM, "src", "modifier", "modifier-type.ts");
const mtRaw = fs.readFileSync(mtPath, "utf8");
const mtClean = stripComments(mtRaw);

// 找到 modifierTypeInitObj = Object.freeze({ ... })
const objMatch = mtClean.match(/const\s+modifierTypeInitObj\s*=\s*Object\.freeze\(\{([\s\S]*?)\n\}\);/);
if (!objMatch) {
  console.error("无法找到 modifierTypeInitObj");
  process.exit(1);
}
const body = objMatch[1];

// 提取 TYPE_ID: (每行形如 "  TYPE_ID: () => new ...")
const typeIds = [];
const re = /^\s*([A-Z0-9_]+)\s*:\s*\(\)\s*=>/gm;
let m;
while ((m = re.exec(body)) !== null) {
  typeIds.push(m[1]);
}

// 读取 modifier-type.json
const mtJsonPath = path.join(UPSTREAM, "dist", "locales", "zh-Hans", "modifier-type.json");
const mtJson = JSON.parse(fs.readFileSync(mtJsonPath, "utf8"));
const mtData = mtJson.ModifierType || {};

// 读取 pokeball.json
const pbJsonPath = path.join(UPSTREAM, "dist", "locales", "zh-Hans", "pokeball.json");
const pbJson = JSON.parse(fs.readFileSync(pbJsonPath, "utf8"));

// 读取 voucher.json
const vcJsonPath = path.join(UPSTREAM, "dist", "locales", "zh-Hans", "voucher.json");
const vcJson = JSON.parse(fs.readFileSync(vcJsonPath, "utf8"));

// 从 modifier-type.json 直接取 typeId 对应的 name
function getName(typeId) {
  // 1. 直接在 mtData 里
  if (mtData[typeId] && mtData[typeId].name) {
    return mtData[typeId].name;
  }
  // 2. pokeball: POKEBALL/GREAT_BALL/...
  if (typeId === "POKEBALL") return pbJson.POKEBALL?.name || "精灵球";
  if (typeId === "GREAT_BALL") return pbJson.GREAT_BALL?.name || "超级球";
  if (typeId === "ULTRA_BALL") return pbJson.ULTRA_BALL?.name || "高级球";
  if (typeId === "ROGUE_BALL") return pbJson.ROGUE_BALL?.name || "肉鸽球";
  if (typeId === "MASTER_BALL") return pbJson.MASTER_BALL?.name || "大师球";
  if (typeId === "GOLDEN_POKEBALL") return mtData.GOLDEN_POKEBALL?.name || "黄金精灵球";
  if (typeId === "SILVER_POKEBALL") return "白银精灵球";
  // 3. voucher
  if (typeId === "VOUCHER") return vcJson.VOUCHER?.name || "兑换券";
  if (typeId === "VOUCHER_PLUS") return vcJson.VOUCHER_PLUS?.name || "中级扭蛋券";
  if (typeId === "VOUCHER_PREMIUM") return vcJson.VOUCHER_PREMIUM?.name || "高级扭蛋券";
  // 4. 生成器类: typeName 直接显示
  if (typeId === "EVOLUTION_ITEM") return "进化道具";
  if (typeId === "RARE_EVOLUTION_ITEM") return "稀有进化道具";
  if (typeId === "FORM_CHANGE_ITEM") return "形态变更道具";
  if (typeId === "RARE_FORM_CHANGE_ITEM") return "稀有形态变更道具";
  if (typeId === "SPECIES_STAT_BOOSTER") return "专属属性提升道具";
  if (typeId === "RARE_SPECIES_STAT_BOOSTER") return "稀有专属属性提升道具";
  if (typeId === "TEMP_STAT_STAGE_BOOSTER") return "战斗属性阶段提升道具";
  if (typeId === "BASE_STAT_BOOSTER") return "基础属性提升道具";
  if (typeId === "ATTACK_TYPE_BOOSTER") return "招式类型威力提升道具";
  if (typeId === "MINT") return "薄荷";
  if (typeId === "MYSTICAL_ROCK") return "神秘石块";
  if (typeId === "TERA_SHARD") return "太晶碎块";
  if (typeId === "BERRY") return "树果";
  if (typeId === "TM_COMMON") return "招式学习器(普通)";
  if (typeId === "TM_GREAT") return "招式学习器(好)";
  if (typeId === "TM_ULTRA") return "招式学习器(高级)";
  if (typeId === "MYSTERY_ENCOUNTER_SHUCKLE_JUICE") return "壶壶果汁";
  return typeId; // fallback
}

let out = "// 自动生成: Modifier typeId -> 中文名\n";
out += "// 注意: typeId 是 modifierTypeInitObj 的 key\n";
out += "const MODIFIER_NAMES = {\n";
let count = 0;
for (const tid of typeIds) {
  const cn = getName(tid);
  out += `  "${tid}": "${cn}",\n`;
  count++;
}
out += "};\n";
fs.writeFileSync(path.join(__dirname, "..", "data", "modifier-names.js"), out, "utf8");
console.log(`已生成 ${count} 个 modifier 条目`);
