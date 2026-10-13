// 验证 move-names.js 和 ability-names.js 的映射是否正确
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

function parseEnum(filePath, enumName) {
  const raw = fs.readFileSync(filePath, "utf8");
  const cleaned = stripComments(raw);
  const blockMatch = cleaned.match(new RegExp(`export enum ${enumName}[\\s\\S]*?^\\}`, "m"));
  if (!blockMatch) {
    console.error(`无法找到 ${enumName} 枚举`);
    process.exit(1);
  }
  const body = blockMatch[0];
  const re = /^\s*([A-Z0-9_]+)(?:\s*=\s*(\d+))?\s*,?$/gm;
  let m;
  let lastVal = -1;
  const map = {};
  while ((m = re.exec(body)) !== null) {
    const name = m[1];
    const explicit = m[2];
    if (explicit !== undefined) {
      lastVal = parseInt(explicit);
    } else {
      lastVal = lastVal + 1;
    }
    map[name] = lastVal;
  }
  return map;
}

// 解析 MoveId
const moveIdMap = parseEnum(
  path.join(UPSTREAM, "src", "enums", "move-id.ts"),
  "MoveId"
);
// 反向: id -> name
const moveIdReverse = {};
for (const [name, id] of Object.entries(moveIdMap)) {
  moveIdReverse[id] = name;
}

// 读取 move-names.js
const moveNamesRaw = fs.readFileSync(path.join(__dirname, "..", "data", "move-names.js"), "utf8");
const moveNamesMatch = moveNamesRaw.match(/const MOVE_NAMES = \{([\s\S]*)\};/);
if (!moveNamesMatch) {
  console.error("无法解析 move-names.js");
  process.exit(1);
}
const moveNamesBody = moveNamesMatch[1];
const moveNames = {};
const moveRe = /"(\d+)":\s*"([^"]+)"/g;
let mm;
while ((mm = moveRe.exec(moveNamesBody)) !== null) {
  moveNames[parseInt(mm[1])] = mm[2];
}

// 验证 move-names.js
let moveErrors = 0;
for (const [idStr, label] of Object.entries(moveNames)) {
  const id = parseInt(idStr);
  // 提取英文名 (在括号里)
  const parenMatch = label.match(/\(([A-Z0-9_]+)\)/);
  if (!parenMatch) continue;
  const expectedName = parenMatch[1];
  const actualName = moveIdReverse[id];
  if (expectedName !== actualName) {
    console.log(`[技能] ID ${id}: move-names.js 说 ${expectedName}, 但 MoveId enum 说 ${actualName}`);
    moveErrors++;
  }
}

// 解析 AbilityId
const abilityIdMap = parseEnum(
  path.join(UPSTREAM, "src", "enums", "ability-id.ts"),
  "AbilityId"
);
const abilityIdReverse = {};
for (const [name, id] of Object.entries(abilityIdMap)) {
  abilityIdReverse[id] = name;
}

// 读取 ability-names.js
const abilityNamesRaw = fs.readFileSync(path.join(__dirname, "..", "data", "ability-names.js"), "utf8");
const abilityNamesMatch = abilityNamesRaw.match(/const ABILITY_NAMES = \{([\s\S]*)\};/);
if (!abilityNamesMatch) {
  console.error("无法解析 ability-names.js");
  process.exit(1);
}
const abilityNames = {};
const abilityRe = /"(\d+)":\s*"([^"]+)"/g;
let am;
while ((am = abilityRe.exec(abilityNamesMatch[1])) !== null) {
  abilityNames[parseInt(am[1])] = am[2];
}

// 验证 ability-names.js
let abilityErrors = 0;
for (const [idStr, label] of Object.entries(abilityNames)) {
  const id = parseInt(idStr);
  const parenMatch = label.match(/\(([A-Z0-9_]+)\)/);
  if (!parenMatch) continue;
  const expectedName = parenMatch[1];
  const actualName = abilityIdReverse[id];
  if (expectedName !== actualName) {
    console.log(`[特性] ID ${id}: ability-names.js 说 ${expectedName}, 但 AbilityId enum 说 ${actualName}`);
    abilityErrors++;
  }
}

console.log(`\n=== 验证结果 ===`);
console.log(`技能映射错误: ${moveErrors} 个`);
console.log(`特性映射错误: ${abilityErrors} 个`);
console.log(`MoveId 枚举成员数: ${Object.keys(moveIdMap).length}`);
console.log(`move-names.js 条目数: ${Object.keys(moveNames).length}`);
console.log(`AbilityId 枚举成员数: ${Object.keys(abilityIdMap).length}`);
console.log(`ability-names.js 条目数: ${Object.keys(abilityNames).length}`);
