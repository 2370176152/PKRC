// 生成 modifier-classes.js: typeId -> { className, isHeld, argsCount }
// 通过 typeId → ModifierType 子类 → newModifierFunc 中的 modifier 类名 建立链路
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

const mtPath = path.join(UPSTREAM, "src", "modifier", "modifier-type.ts");
const mtRaw = fs.readFileSync(mtPath, "utf8");
const mtClean = stripComments(mtRaw);

// 步骤 1: 从 modifierTypeInitObj 提取所有 typeId 位置
const objMatch = mtClean.match(/const\s+modifierTypeInitObj\s*=\s*Object\.freeze\(\{([\s\S]*?)\n\}\);/);
if (!objMatch) {
  console.error("无法找到 modifierTypeInitObj");
  process.exit(1);
}
const body = objMatch[1];

// 提取所有 typeId 的位置 (不要求 new ModifierType)
const typeIdPositions = [];
const reTypeId = /^\s*([A-Z0-9_]+)\s*:\s*\(\)\s*=>/gm;
let m;
while ((m = reTypeId.exec(body)) !== null) {
  typeIdPositions.push({ id: m[1], start: m.index, headerEnd: m.index + m[0].length });
}

// 同时提取 typeId → ModifierType 子类名 (用于步骤 2 回退)
const typeIdToModTypeClass = {};
const reTypeIdModType = /^\s*([A-Z0-9_]+)\s*:\s*\(\)\s*=>\s*new\s+([A-Z]\w*ModifierType(?:Generator)?)/gm;
let mtm;
while ((mtm = reTypeIdModType.exec(body)) !== null) {
  typeIdToModTypeClass[mtm[1]] = mtm[2];
}

// 步骤 2: 从 modifier-type.ts 提取 ModifierType 子类 → modifier 类名
// 每个 ModifierType 子类的构造函数中会调用 new XxxModifier(
const modTypeClassToModifier = {};
// 找到所有 class XxxModifierType 的定义, 然后在类体中搜索 new XxxModifier(
const classDefRe = /export class (\w+(?:ModifierType|ModifierTypeGenerator))\s*(?:extends\s+\w+\s*)?\{([\s\S]*?)\n\}/g;
let cdm;
while ((cdm = classDefRe.exec(mtClean)) !== null) {
  const className = cdm[1];
  const classBody = cdm[2];
  // 搜索 new XxxModifier( (排除 ModifierType/ModifierTypeGenerator)
  const newModRe = /new\s+([A-Z]\w*Modifier)\s*\(/g;
  let nm;
  while ((nm = newModRe.exec(classBody)) !== null) {
    const cn = nm[1];
    if (cn.endsWith("ModifierType") || cn.endsWith("ModifierTypeGenerator")) continue;
    if (cn === "ModifierType") continue;
    modTypeClassToModifier[className] = cn;
    break;
  }
}

// 步骤 3: 读取 modifier.ts 类继承关系, 判断是否携带物
const modPath = path.join(UPSTREAM, "src", "modifier", "modifier.ts");
const modRaw = fs.readFileSync(modPath, "utf8");
const modClean = stripComments(modRaw);
const classExtends = {};
const classRe = /export class (\w+)\s+extends\s+(\w+)/g;
let cm;
while ((cm = classRe.exec(modClean)) !== null) {
  classExtends[cm[1]] = cm[2];
}

function isHeldItemClass(className) {
  let cur = className;
  let depth = 0;
  while (cur && depth < 20) {
    if (cur === "PokemonHeldItemModifier") return true;
    cur = classExtends[cur];
    depth++;
  }
  return false;
}

// 提取构造函数参数个数 (除 type)
const constructorArgs = {};
const constrRe = /export class (\w+(?:Modifier|AccessModifier))[\s\S]*?constructor\(([^)]*)\)/g;
let cam;
while ((cam = constrRe.exec(modClean)) !== null) {
  const className = cam[1];
  const params = cam[2].split(",").map(s => s.trim()).filter(Boolean);
  constructorArgs[className] = Math.max(0, params.length - 1);
}

// 步骤 4: 建立 typeId → modifier 类名 映射
// 从 modifierTypeInitObj 中每个 typeId 的块内搜索 new XxxModifier(
const typeIdToBlockModifier = {};
for (let i = 0; i < typeIdPositions.length; i++) {
  const { id, headerEnd } = typeIdPositions[i];
  const blockEnd = i + 1 < typeIdPositions.length ? typeIdPositions[i + 1].start : body.length;
  const block = body.slice(headerEnd, blockEnd);
  const newModRe = /new\s+([A-Z]\w*Modifier)\s*\(/g;
  let nm;
  while ((nm = newModRe.exec(block)) !== null) {
    const cn = nm[1];
    if (cn.endsWith("ModifierType") || cn.endsWith("ModifierTypeGenerator")) continue;
    if (cn === "ModifierType") continue;
    typeIdToBlockModifier[id] = cn;
    break;
  }
}

const result = {};
for (const { id } of typeIdPositions) {
  // 优先从块内搜索, 其次从 ModifierType 子类定义搜索
  const modTypeClass = typeIdToModTypeClass[id];
  const modifierClass = typeIdToBlockModifier[id]
    || (modTypeClass ? (modTypeClassToModifier[modTypeClass] || "PersistentModifier") : "PersistentModifier");
  const isHeld = modifierClass !== "PersistentModifier" ? isHeldItemClass(modifierClass) : false;
  const argsCount = modifierClass !== "PersistentModifier" ? (constructorArgs[modifierClass] || 0) : 0;
  result[id] = {
    className: modifierClass,
    isHeld: isHeld,
    argsCount: argsCount,
  };
}

// 写入 modifier-classes.js
let out = "// 自动生成: typeId -> { className, isHeld, argsCount }\n";
out += "// isHeld: 是否为携带物 (PokemonHeldItemModifier 子类), 需要 pokemonId 作为 args[0]\n";
out += "// argsCount: 构造函数除 type 外的参数个数\n";
out += "const MODIFIER_CLASSES = {\n";
for (const id of Object.keys(result)) {
  const r = result[id];
  out += `  "${id}": { className: "${r.className}", isHeld: ${r.isHeld}, argsCount: ${r.argsCount} },\n`;
}
out += "};\n";
fs.writeFileSync(path.join(__dirname, "..", "data", "modifier-classes.js"), out, "utf8");

const total = Object.keys(result).length;
const heldCount = Object.values(result).filter(r => r.isHeld).length;
const noClassCount = Object.values(result).filter(r => r.className === "PersistentModifier").length;
console.log(`已生成 ${total} 个 typeId 的 className 映射`);
console.log(`携带物: ${heldCount} 个, 未匹配到类名: ${noClassCount} 个`);

console.log("\n携带物列表:");
Object.entries(result).filter(([_, r]) => r.isHeld).forEach(([id, r]) => {
  console.log(`  ${id}: ${r.className} (args: ${r.argsCount})`);
});

console.log("\n未匹配类名:");
Object.entries(result).filter(([_, r]) => r.className === "PersistentModifier").forEach(([id]) => {
  console.log(`  ${id} (ModifierType类: ${typeIdToModTypeClass[id]})`);
});
