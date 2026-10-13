// 生成 species-abilities.js: 每个宝可梦的 ability1/ability2/abilityHidden/passive
// 用法: node gen-species-abilities.cjs
const fs = require("fs");
const path = require("path");
// 上游 PokeRogue 源码树位置：默认仓库同级 pokerogue-upstream，可用环境变量 POKEROGUE_UPSTREAM 覆盖
const UPSTREAM = process.env.POKEROGUE_UPSTREAM || path.resolve(__dirname, "..", "..", "..", "..", "pokerogue-upstream");

const speciesDir = path.join(UPSTREAM, "src", "data", "balance", "species");

// 读取 SpeciesId 枚举
const speciesEnumRaw = fs.readFileSync(
  path.join(UPSTREAM, "src", "enums", "species-id.ts"),
  "utf8"
);

// 解析 SpeciesId 枚举: 形如  BULBASAUR,  或带 /** */ 注释
const speciesIdMap = {};
{
  const enumBlockMatch = speciesEnumRaw.match(/export enum SpeciesId[\s\S]*?^\}/m);
  if (!enumBlockMatch) {
    console.error("无法找到 SpeciesId 枚举");
    process.exit(1);
  }
  const body = enumBlockMatch[0];
  // 匹配每一行: NAME 或 NAME = N (可有可无逗号)
  // TS enum 规则: 第一个未赋值的默认 0, 后续未赋值是前一个+1, 显式赋值覆盖
  const re = /^\s*([A-Z0-9_]+)(?:\s*=\s*(\d+))?\s*,?$/gm;
  let m;
  let idx = 0;
  let lastVal = -1;
  while ((m = re.exec(body)) !== null) {
    const name = m[1];
    const explicit = m[2];
    if (explicit !== undefined) {
      lastVal = parseInt(explicit);
    } else {
      lastVal = lastVal + 1;
    }
    speciesIdMap[name] = lastVal;
  }
}

// 读取 AbilityId 枚举
const abilityEnumRaw = fs.readFileSync(
  path.join(UPSTREAM, "src", "enums", "ability-id.ts"),
  "utf8"
);
const abilityIdMap = {};
{
  const enumBlockMatch = abilityEnumRaw.match(/export enum AbilityId[\s\S]*?^\}/m);
  if (!enumBlockMatch) {
    console.error("无法找到 AbilityId 枚举");
    process.exit(1);
  }
  const body = enumBlockMatch[0];
  const re = /^\s*([A-Z0-9_]+)(?:\s*=\s*(\d+))?\s*,?$/gm;
  let m;
  let lastVal = -1;
  while ((m = re.exec(body)) !== null) {
    const name = m[1];
    const explicit = m[2];
    if (explicit !== undefined) {
      lastVal = parseInt(explicit);
    } else {
      lastVal = lastVal + 1;
    }
    abilityIdMap[name] = lastVal;
  }
}

// 读取所有 generation 文件
const files = fs
  .readdirSync(speciesDir)
  .filter((f) => /^generation-\d+\.ts$/.test(f))
  .sort();

// 正则: 抓取每个 species 项
// 形如:  generationXSpeciesData[SpeciesId.XXX] = { ... }
const result = {}; // speciesId(int) -> { ability1, ability2, abilityHidden, passiveForms: {formIdx: abilityId}, passiveDefault: abilityId }

for (const f of files) {
  const content = fs.readFileSync(path.join(speciesDir, f), "utf8");
  // 用正则切出每个 species 块
  // 关键标识: SpeciesId.NAME ] = {
  const blockRe = /generation\w+SpeciesData\[SpeciesId\.([A-Z0-9_]+)\]\s*=\s*\{/g;
  let blockMatch;
  while ((blockMatch = blockRe.exec(content)) !== null) {
    const speciesName = blockMatch[1];
    const startIdx = blockMatch.index + blockMatch[0].length;
    // 找到对应的闭合 } (在同层级)
    let depth = 1;
    let endIdx = startIdx;
    let inString = false;
    let stringChar = null;
    while (endIdx < content.length && depth > 0) {
      const c = content[endIdx];
      if (inString) {
        if (c === "\\") {
          endIdx += 2;
          continue;
        }
        if (c === stringChar) {
          inString = false;
        }
      } else {
        if (c === '"' || c === "'" || c === "`") {
          inString = true;
          stringChar = c;
        } else if (c === "{") {
          depth++;
        } else if (c === "}") {
          depth--;
        }
      }
      endIdx++;
    }
    const block = content.slice(startIdx, endIdx - 1);

    const speciesId = speciesIdMap[speciesName];
    if (speciesId === undefined) continue;

    // 提取 ability1/ability2/abilityHidden
    const a1 = matchAbility(block, "ability1");
    const a2 = matchAbility(block, "ability2");
    const ah = matchAbility(block, "abilityHidden");

    // 提取 passives (可能是 AbilityId.X 或 { 0: AbilityId.X, ... })
    const passives = matchPassives(block);

    result[speciesId] = {
      species: speciesName,
      ability1: a1,
      ability2: a2,
      abilityHidden: ah,
      passiveDefault: passives.default,
      passiveForms: passives.forms,
    };
  }
}

function matchAbility(block, key) {
  // 匹配  key: AbilityId.NAME,
  const re = new RegExp(`\\b${key}:\\s*AbilityId\\.([A-Z0-9_]+)`);
  const m = re.exec(block);
  if (!m) return 0; // NONE
  return abilityIdMap[m[1]] ?? 0;
}

function matchPassives(block) {
  // 1. 单一 AbilityId
  const singleRe = /\bpassives:\s*AbilityId\.([A-Z0-9_]+)/;
  const m = singleRe.exec(block);
  if (m) {
    return { default: abilityIdMap[m[1]] ?? 0, forms: {} };
  }
  // 2. { 0: AbilityId.X, ... }
  const objRe = /\bpassives:\s*\{([^}]*)\}/;
  const m2 = objRe.exec(block);
  if (m2) {
    const inner = m2[1];
    const forms = {};
    const itemRe = /(\d+):\s*AbilityId\.([A-Z0-9_]+)/g;
    let mi;
    while ((mi = itemRe.exec(inner)) !== null) {
      forms[parseInt(mi[1])] = abilityIdMap[mi[2]] ?? 0;
    }
    // 取第一个作为 default
    const firstKey = Object.keys(forms)[0];
    const def = firstKey !== undefined ? forms[firstKey] : 0;
    return { default: def, forms };
  }
  return { default: 0, forms: {} };
}

// 写入 species-abilities.js
let out = "// 自动生成: 每个 species 的 ability1/ability2/abilityHidden 和 passive\n";
out += "// 注意: abilityIndex 在存档中是 0/1/2, 对应 ability1/ability2/abilityHidden\n";
out += "// passive 是 boolean, 表示是否启用被动特性; 被动特性本身由 species 数据决定\n";
out += "const SPECIES_ABILITIES = {\n";
for (const id of Object.keys(result).map(Number).sort((a, b) => a - b)) {
  const r = result[id];
  out += `  ${id}: { /* ${r.species} */ ability1: ${r.ability1}, ability2: ${r.ability2}, abilityHidden: ${r.abilityHidden}, passiveDefault: ${r.passiveDefault}, passiveForms: ${JSON.stringify(r.passiveForms)} },\n`;
}
out += "};\n";

// 统计
const total = Object.keys(result).length;
console.log(`已生成 ${total} 个 species 的 ability 数据`);
fs.writeFileSync(path.join(__dirname, "..", "data", "species-abilities.js"), out, "utf8");
console.log("已写入 species-abilities.js");
