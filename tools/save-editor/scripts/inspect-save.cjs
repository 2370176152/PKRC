const fs = require("fs");
const CryptoJS = require("crypto-js");

const filePath = process.argv[2];
const SAVE_KEY = "x0i2O7WRiANTqPmZ";
const data = fs.readFileSync(filePath, "utf8");
try {
  const bytes = CryptoJS.AES.decrypt(data, SAVE_KEY);
  const json = bytes.toString(CryptoJS.enc.Utf8);
  const obj = JSON.parse(json);
  console.log("modifiers:");
  if (obj.modifiers) {
    obj.modifiers.forEach((m, i) => {
      console.log(`  [${i}] typeId=${m.typeId} className=${m.className} args=${JSON.stringify(m.args)} typePregenArgs=${JSON.stringify(m.typePregenArgs)} stackCount=${m.stackCount} player=${m.player}`);
    });
  }
  console.log("\nenemyModifiers:", obj.enemyModifiers ? obj.enemyModifiers.length : 0);
  if (obj.enemyModifiers && obj.enemyModifiers.length > 0) {
    obj.enemyModifiers.forEach((m, i) => {
      console.log(`  [${i}] typeId=${m.typeId} className=${m.className} args=${JSON.stringify(m.args)} typePregenArgs=${JSON.stringify(m.typePregenArgs)} stackCount=${m.stackCount}`);
    });
  }
} catch (e) {
  console.log("AES ERR:", e.message);
  // 尝试 base64
  try {
    const decoded = decodeURIComponent(Buffer.from(data.trim(), "base64").toString("utf-8"));
    const obj = JSON.parse(decoded);
    console.log("base64 OK");
    console.log("modifiers:", obj.modifiers ? obj.modifiers.length : 0);
    if (obj.modifiers) {
      obj.modifiers.forEach((m, i) => {
        console.log(`  [${i}] typeId=${m.typeId} className=${m.className} args=${JSON.stringify(m.args)} typePregenArgs=${JSON.stringify(m.typePregenArgs)} stackCount=${m.stackCount}`);
      });
    }
  } catch (e2) {
    console.log("base64 ERR:", e2.message);
  }
}
