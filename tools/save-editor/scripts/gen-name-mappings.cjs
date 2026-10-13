// 重新生成 move-names.js 和 ability-names.js
// 正确处理 enum 里的 /* */ 块注释
const fs = require("fs");
const path = require("path");
// 上游 PokeRogue 源码树位置：默认仓库同级 pokerogue-upstream，可用环境变量 POKEROGUE_UPSTREAM 覆盖
const UPSTREAM = process.env.POKEROGUE_UPSTREAM || path.resolve(__dirname, "..", "..", "..", "..", "pokerogue-upstream");

// 去除 /* */ 块注释 和 // 行注释
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
      if (c === "\\") {
        out += next || "";
        i += 2;
        continue;
      }
      if (c === stringChar) inString = false;
      i++;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      inString = true;
      stringChar = c;
      out += c;
      i++;
      continue;
    }
    if (c === "/" && next === "*") {
      // 块注释, 跳到 */
      const end = code.indexOf("*/", i + 2);
      if (end === -1) break;
      i = end + 2;
      continue;
    }
    if (c === "/" && next === "/") {
      // 行注释, 跳到换行
      const end = code.indexOf("\n", i + 2);
      if (end === -1) break;
      i = end;
      continue;
    }
    out += c;
    i++;
  }
  return out;
}

// 解析 enum (先去注释)
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

// 把 ENUM_NAME 转成 camelCase
function toCamelCase(s) {
  return s.toLowerCase().replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
}

// 读取 i18n JSON
function loadI18n(locale, type) {
  const p = path.join(UPSTREAM, "dist", "locales", locale, `${type}.json`);
  if (!fs.existsSync(p)) {
    console.error(`找不到 ${p}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

// ========== 生成 move-names.js ==========
console.log("生成 move-names.js ...");
const moveIdMap = parseEnum(
  path.join(UPSTREAM, "src", "enums", "move-id.ts"),
  "MoveId"
);
const moveI18n = loadI18n("zh-Hans", "move");

let moveOut = "// 自动生成: MoveId -> 中文名\n";
moveOut += "// 注意: MoveId 是连续整数 (NONE=0, POUND=1, ...)\n";
moveOut += "const MOVE_NAMES = {\n";
let moveCount = 0;
for (const [name, id] of Object.entries(moveIdMap)) {
  const camelKey = toCamelCase(name);
  const entry = moveI18n[camelKey];
  let cnName = entry && entry.name ? entry.name : "";
  if (!cnName) cnName = name === "NONE" ? "未知" : name;
  moveOut += `  "${id}": "${cnName} (${name})",\n`;
  moveCount++;
}
moveOut += "};\n";
fs.writeFileSync(path.join(__dirname, "..", "data", "move-names.js"), moveOut, "utf8");
console.log(`  已生成 ${moveCount} 个 move 条目`);

// ========== 生成 ability-names.js ==========
console.log("生成 ability-names.js ...");
const abilityIdMap = parseEnum(
  path.join(UPSTREAM, "src", "enums", "ability-id.ts"),
  "AbilityId"
);
const abilityI18n = loadI18n("zh-Hans", "ability");

let abilityOut = "// 自动生成: AbilityId -> 中文名\n";
abilityOut += "// 注意: AbilityId 是连续整数 (NONE=0, STENCH=1, ...)\n";
abilityOut += "const ABILITY_NAMES = {\n";
let abilityCount = 0;
for (const [name, id] of Object.entries(abilityIdMap)) {
  const camelKey = toCamelCase(name);
  const entry = abilityI18n[camelKey];
  let cnName = entry && entry.name ? entry.name : "";
  if (!cnName) cnName = name === "NONE" ? "未知" : name;
  abilityOut += `  "${id}": "${cnName} (${name})",\n`;
  abilityCount++;
}
abilityOut += "};\n";
fs.writeFileSync(path.join(__dirname, "..", "data", "ability-names.js"), abilityOut, "utf8");
console.log(`  已生成 ${abilityCount} 个 ability 条目`);

console.log("完成!");
