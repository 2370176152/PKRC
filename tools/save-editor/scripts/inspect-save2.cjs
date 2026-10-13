const fs = require("fs");
const CryptoJS = require("crypto-js");

const SAVE_KEY = "x0i2O7WRiANTqPmZ";
const filePath = process.argv[2];
const data = fs.readFileSync(filePath, "utf8");

try {
  const bytes = CryptoJS.AES.decrypt(data, SAVE_KEY);
  const json = bytes.toString(CryptoJS.enc.Utf8);
  const obj = JSON.parse(json);

  console.log("=== 队伍宝可梦 ===");
  if (obj.party) {
    obj.party.forEach((p, i) => {
      console.log(`  [${i}] id=${p.id}, species=${p.species}, name=${p.name}`);
    });
  }

  console.log("\n=== 玩家道具 (modifiers) ===");
  if (obj.modifiers) {
    obj.modifiers.forEach((m, i) => {
      console.log(`  [${i}] typeId=${m.typeId}`);
      console.log(`      className=${m.className}`);
      console.log(`      args=${JSON.stringify(m.args)}`);
      console.log(`      typePregenArgs=${JSON.stringify(m.typePregenArgs)}`);
      console.log(`      stackCount=${m.stackCount}`);
      console.log(`      player=${m.player}`);
    });
  }

  console.log("\n=== 分析: 每个宝可梦的携带物 ===");
  if (obj.party && obj.modifiers) {
    obj.party.forEach((p, pi) => {
      const held = obj.modifiers.filter(m => m.args && m.args.length > 0 && m.args[0] === p.id && typeof m.args[0] === 'number');
      console.log(`  宝可梦[${pi}] id=${p.id} (${p.name}):`);
      if (held.length === 0) {
        console.log(`    (无)`);
      } else {
        held.forEach(m => {
          console.log(`    ${m.typeId} (args=${JSON.stringify(m.args)})`);
        });
      }
    });
  }
} catch (e) {
  console.log("ERR:", e.message);
}
