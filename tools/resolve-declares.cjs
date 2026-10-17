// 批量反查 174 个真实依赖的产物归属：keepNames 注记 + 模块级字面量赋值
const fs = require("fs");
const S = fs.readFileSync(
  "D:/Work/Pokemon/new/game/server/dist.modder-backup-20261016/assets/loading-scene-By2k7Qfx.js",
  "utf8",
);
const NAMES = fs.readFileSync("D:/Work/Pokemon/new/.build-tools/eu-needed.txt", "utf8").trim().split("\n");

// 1) keepNames 注记：l(短名,"真名") → 这里短名本身就是我们找的名字
const rows = [];
for (const n of NAMES) {
  const esc = n.replace(/\$/g, "\\$");
  const kn = new RegExp("l\\(" + esc + ",\"([^\"]+)\"\\)");
  const m = kn.exec(S);

  // 2) 模块级字面量赋值
  let lit = null;
  const re1 = new RegExp("(?:const|let|var)\\s+" + esc + "\\s*=\\s*([^,;)\\]]{1,50})");
  const r1 = re1.exec(S);
  if (r1) lit = r1[1].trim();
  if (!lit) {
    const re2 = new RegExp("[,;{}\\s]" + esc + "\\s*=\\s*([^,;)\\]]{1,50})");
    const r2 = re2.exec(S);
    if (r2) lit = r2[1].trim();
  }

  rows.push({ name: n, keep: m ? m[1] : null, lit });
}

// 分类统计
const withKeep = rows.filter((r) => r.keep);
const withLitOnly = rows.filter((r) => !r.keep && r.lit);
const unknown = rows.filter((r) => !r.keep && !r.lit);

console.log("总计 " + rows.length);
console.log("  keepNames 命中: " + withKeep.length);
console.log("  仅字面量:      " + withLitOnly.length);
console.log("  完全未定位:    " + unknown.length);

console.log("\n════ keepNames 反查到真名的（" + withKeep.length + "）════");
for (const r of withKeep) console.log("  " + r.name.padEnd(6) + " → " + r.keep);

console.log("\n════ 仅字面量可抽（" + withLitOnly.length + "）════");
for (const r of withLitOnly) console.log("  " + r.name.padEnd(6) + " = " + r.lit.slice(0, 60));

console.log("\n════ 未定位（需按用法人工判定，" + unknown.length + "）════");
console.log("  " + unknown.map((r) => r.name).join(" "));

fs.writeFileSync(
  "D:/Work/Pokemon/new/.build-tools/declares-eryou-ui-resolved.json",
  JSON.stringify(rows, null, 2),
);
console.log("\n结构化结果 → .build-tools/declares-eryou-ui-resolved.json");