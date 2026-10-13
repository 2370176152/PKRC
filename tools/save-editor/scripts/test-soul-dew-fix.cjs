// 测试: 用用户存档验证 repairModifiers 修复心之水滴
const fs = require("fs");
const path = require("path");
const CryptoJS = require("crypto-js");

const SAVE_KEY = "x0i2O7WRiANTqPmZ";
const modifierClassesJs = fs.readFileSync(path.join(__dirname, "..", "data", "modifier-classes.js"), "utf8");
const modifierExpandedJs = fs.readFileSync(path.join(__dirname, "..", "data", "modifier-expanded.js"), "utf8");

const html = fs.readFileSync(path.join(__dirname, "..", "save-editor.html"), "utf8");
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
const mainScript = scriptMatch[1];

const repairFnMatch = mainScript.match(/function repairModifiers\([^)]*\)\s*\{[\s\S]*?\n\}\s*\n/);

const combinedCode = `
${modifierClassesJs}
${modifierExpandedJs}
${repairFnMatch[0]}
`;

eval(combinedCode);

const filePath = process.argv[2];
const data = fs.readFileSync(filePath, "utf8");
const bytes = CryptoJS.AES.decrypt(data, SAVE_KEY);
const json = bytes.toString(CryptoJS.enc.Utf8);
const obj = JSON.parse(json);

console.log("=== 修复前的心之水滴 ===");
const soulDew = obj.modifiers.find(m => m.typeId === "SOUL_DEW");
if (soulDew) {
  console.log(`  className: ${soulDew.className}`);
  console.log(`  args: [${soulDew.args.join(", ")}]`);
  console.log(`  typePregenArgs: ${JSON.stringify(soulDew.typePregenArgs)}`);
  console.log(`  stackCount: ${soulDew.stackCount}`);
} else {
  console.log("  (没有心之水滴)");
}

console.log("\n=== 执行 repairModifiers ===");
const repaired = repairModifiers(obj);
console.log(`修复了 ${repaired} 个 modifier`);

console.log("\n=== 修复后的心之水滴 ===");
const soulDew2 = obj.modifiers.find(m => m.typeId === "SOUL_DEW");
if (soulDew2) {
  console.log(`  className: ${soulDew2.className}`);
  console.log(`  args: [${soulDew2.args.join(", ")}]`);
  console.log(`  typePregenArgs: ${JSON.stringify(soulDew2.typePregenArgs)}`);
  console.log(`  stackCount: ${soulDew2.stackCount}`);
}

console.log("\n=== 预期正确结构 ===");
console.log("  className: PokemonNatureWeightModifier");
console.log("  args: [pokemonId]  (1个参数)");
console.log("  isHeld: true");

const correct = soulDew2
  && soulDew2.className === "PokemonNatureWeightModifier"
  && soulDew2.args.length === 1
  && typeof soulDew2.args[0] === "number";

console.log(`\n验证结果: ${correct ? '✅ 正确' : '❌ 错误'}`);
