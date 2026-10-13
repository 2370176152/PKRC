// 生成 move-info.js: moveId -> { name, effect, type, power, accuracy, pp, category }
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

// 步骤 1: 从 move-id.ts 提取 MoveId 枚举 (id -> 枚举名, 如 1 -> POUND)
const midPath = path.join(UPSTREAM, "src", "enums", "move-id.ts");
const midRaw = fs.readFileSync(midPath, "utf8");
const midClean = stripComments(midRaw);
const enumMatch = midClean.match(/export enum MoveId\s*\{([\s\S]*?)\}/);
if (!enumMatch) {
  console.error("无法找到 MoveId 枚举");
  process.exit(1);
}
const enumBody = enumMatch[1];
// 解析枚举: 每行一个名字, 第一个是 NONE=0, 后面递增
const moveEnumNames = [];
const moveNameToId = {};
const lines = enumBody.split("\n");
for (const line of lines) {
  const m = line.match(/^\s*(\w+)/);
  if (m) {
    moveNameToId[m[1]] = moveEnumNames.length;
    moveEnumNames.push(m[1]);
  }
}
// moveEnumNames[0] = NONE, moveEnumNames[1] = POUND, ...

// 步骤 2: 从 move.json 提取 name 和 effect
// move.json 的 key 是驼峰名 (如 pound, karateChop)
const moveJsonPath = path.join(__dirname, "..", "locales", "zh-Hans", "move.json");
const moveJson = JSON.parse(fs.readFileSync(moveJsonPath, "utf8"));

// 枚举名 (如 POUND) -> 驼峰名 (如 pound)
function enumToCamel(s) {
  // POUND -> pound, KARATE_CHOP -> karateChop
  return s.toLowerCase().replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

// 步骤 3: 从 move.ts 的 initMoves() 解析 type, power, accuracy, pp, category
const moveTsPath = path.join(UPSTREAM, "src", "data", "moves", "move.ts");
const moveTsRaw = fs.readFileSync(moveTsPath, "utf8");
const moveTsClean = stripComments(moveTsRaw);

// 找到 initMoves 函数
const initMovesMatch = moveTsClean.match(/export function initMoves\(\)\s*\{([\s\S]*?)\n\}/);
if (!initMovesMatch) {
  console.error("无法找到 initMoves 函数");
  process.exit(1);
}
const initMovesBody = initMovesMatch[1];

// 解析每个 new XxxMove(...) 调用
// 因为有嵌套括号和方法链, 需要手动解析
function parseMoveConstructors(body) {
  const results = {}; // enumName -> { type, category, power, accuracy, pp }
  let pos = 0;

  while (pos < body.length) {
    // 查找 new 关键字
    const newIdx = body.indexOf("new ", pos);
    if (newIdx === -1) break;

    // 检查是否是 Move 类
    const afterNew = body.substring(newIdx + 4);
    const classMatch = afterNew.match(/^(\w+Move)\s*\(/);
    if (!classMatch) {
      pos = newIdx + 4;
      continue;
    }

    const className = classMatch[1];
    // 只处理我们关心的类
    const validClasses = ["AttackMove", "ChargingAttackMove", "StatusMove", "SelfStatusMove", "ChargingSelfStatusMove"];
    if (!validClasses.includes(className)) {
      pos = newIdx + 4 + classMatch[0].length;
      continue;
    }

    // 找到括号内的内容 (处理嵌套括号)
    const parenStart = newIdx + 4 + classMatch[0].length - 1; // 位置在 '('
    let depth = 0;
    let parenEnd = -1;
    for (let i = parenStart; i < body.length; i++) {
      if (body[i] === "(") depth++;
      else if (body[i] === ")") {
        depth--;
        if (depth === 0) {
          parenEnd = i;
          break;
        }
      }
    }
    if (parenEnd === -1) {
      pos = newIdx + 4;
      continue;
    }

    const argsStr = body.substring(parenStart + 1, parenEnd);
    // 分割顶层参数 (不分割嵌套括号内的逗号)
    const args = [];
    let currentArg = "";
    let argDepth = 0;
    for (let i = 0; i < argsStr.length; i++) {
      const c = argsStr[i];
      if (c === "(") argDepth++;
      else if (c === ")") argDepth--;
      else if (c === "," && argDepth === 0) {
        args.push(currentArg.trim());
        currentArg = "";
        continue;
      }
      currentArg += c;
    }
    if (currentArg.trim()) args.push(currentArg.trim());

    // 解析 MoveId
    const moveIdMatch = args[0]?.match(/MoveId\.(\w+)/);
    if (!moveIdMatch) {
      pos = parenEnd + 1;
      continue;
    }
    const enumName = moveIdMatch[1];

    let type = "";
    let category = "";
    let power = "";
    let accuracy = "";
    let pp = "";

    // 解析 type
    const typeMatch = args[1]?.match(/PokemonType\.(\w+)/);
    if (typeMatch) type = typeMatch[1];

    if (className === "AttackMove" || className === "ChargingAttackMove") {
      // AttackMove: id, type, category, power, accuracy, pp, chance, priority, generation
      const catMatch = args[2]?.match(/MoveCategory\.(\w+)/);
      if (catMatch) category = catMatch[1];
      power = args[3]?.trim() || "";
      accuracy = args[4]?.trim() || "";
      pp = args[5]?.trim() || "";
    } else {
      // StatusMove / SelfStatusMove / ChargingSelfStatusMove:
      // id, type, accuracy, pp, chance, priority, generation
      category = "STATUS";
      power = "";
      accuracy = args[2]?.trim() || "";
      pp = args[3]?.trim() || "";
    }

    // 处理特殊值
    if (power === "-1") power = "";
    if (accuracy === "-1") accuracy = "";

    results[enumName] = { type, category, power, accuracy, pp };
    pos = parenEnd + 1;
  }

  return results;
}

const moveStats = parseMoveConstructors(initMovesBody);
console.log(`从 move.ts 解析到 ${Object.keys(moveStats).length} 个技能数据`);

// 生成映射
let out = "// 自动生成: moveId -> { name, effect, type, power, accuracy, pp, category }\n";
out += "const MOVE_INFO = {\n";
let count = 0;
let withEffect = 0;
let withType = 0;
for (let id = 0; id < moveEnumNames.length; id++) {
  const enumName = moveEnumNames[id];
  const camelKey = enumToCamel(enumName);
  const jsonEntry = moveJson[camelKey] || {};
  const name = jsonEntry.name || enumName;
  let effect = jsonEntry.effect || "";
  if (effect) {
    effect = effect.replace(/\n/g, " ").replace(/\s+/g, " ").trim();
    withEffect++;
  }

  // 从 moveStats 获取 type, power, accuracy, pp, category
  const stats = moveStats[enumName] || {};
  let type = stats.type || "";
  let power = stats.power || "";
  let accuracy = stats.accuracy || "";
  let pp = stats.pp || "";
  let category = stats.category || "";

  if (type) withType++;

  // 转义双引号
  const escName = name.replace(/"/g, '\\"');
  const escEffect = effect.replace(/"/g, '\\"');
  out += `  ${id}: { name: "${escName}", effect: "${escEffect}", type: "${type}", power: "${power}", accuracy: "${accuracy}", pp: "${pp}", category: "${category}" },\n`;
  count++;
}
out += "};\n";
fs.writeFileSync(path.join(__dirname, "..", "data", "move-info.js"), out, "utf8");
console.log(`已生成 ${count} 个技能信息, 有描述: ${withEffect}, 有属性: ${withType}`);
