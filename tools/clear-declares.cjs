/**
 * declare 海清理 · 步骤 1：探测真实依赖
 * ---------------------------------------------------------------------------
 * 用法：
 *   node tools/clear-declares.cjs <相对锚点树的 src 路径>
 * 例：
 *   node tools/clear-declares.cjs data/systems/eryou-ui.ts
 *
 * 原理：**删掉 declare 行再让 tsc 报错**。
 *   - 报 `TS2304 Cannot find name 'X'` ⇒ X 是**真实外部依赖**（须 resolve）
 *   - 不报错 ⇒ X 是**产物局部变量被误捕**（D 类，直接删，不用管）
 * 比人工判读可靠：单字母名（`a`/`C`/`i`…）在产物里是压缩后的局部变量，
 * 逐条看会误判成全局依赖。
 *
 * 输出：真实依赖名单（含出现次数），供 resolve 阶段使用。
 * ⚠️ 本脚本**只探测不修改**；真正的删除需人工确认后执行。
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ANCHOR = path.resolve(
  __dirname,
  "..",
  ".build-tools",
  "tarball-src",
  "pokerogue-90df65097b6df76f713e6bd108afa84499e8b993",
);
const TARGET = process.argv[2];
if (!TARGET) {
  console.error("用法: node tools/clear-declares.cjs <src 相对路径>");
  process.exit(1);
}
const abs = path.join(ANCHOR, "src", TARGET);
if (!fs.existsSync(abs)) {
  console.error("文件不存在:", abs);
  process.exit(1);
}

const isDeclare = (line) => /^\s*declare\s+(let|const|function)\s+/.test(line);
const src = fs.readFileSync(abs, "utf8");
const lines = src.split("\n");
const declareNames = [...new Set(lines.filter(isDeclare).map((l) => l.match(/declare\s+(?:let|const|function)\s+([A-Za-z0-9_$]+)/)[1]))];

if (declareNames.length === 0) {
  console.log("该文件无 declare 行，无需清理。");
  process.exit(0);
}

console.log("declare 行数:", lines.filter(isDeclare).length, "／ 去重后:", declareNames.length);

const backup = abs + ".declares-backup";
fs.copyFileSync(abs, backup);
console.log("已备份 →", path.relative(ANCHOR, backup));

// 临时删掉 declare 行
fs.writeFileSync(abs, lines.filter((l) => !isDeclare(l)).join("\n"));

// 跑 tsc，收集该文件的 TS2304
let out = "";
try {
  out = execFileSync(path.join(ANCHOR, "node_modules", ".bin", "tsc"), ["--noEmit"], {
    cwd: ANCHOR,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
} catch (e) {
  out = (e.stdout || "") + (e.stderr || "");
}

// 还原
fs.copyFileSync(backup, abs);

const fileRe = new RegExp("^" + ("src/" + TARGET).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\(", "m");
const needed = new Map();
for (const line of out.split("\n")) {
  if (!fileRe.test(line)) continue;
  const m = line.match(/Cannot find name '([^']+)'/);
  if (m) needed.set(m[1], (needed.get(m[1]) || 0) + 1);
}

const real = [...needed.keys()];
const fake = declareNames.filter((n) => !needed.has(n));

console.log("\n════ 真实外部依赖（" + real.length + "）════");
console.log(real.sort().join(" "));
console.log("\n════ D 类误捕·直接删（" + fake.length + "）════");
console.log(fake.join(" "));

const listPath = path.join(__dirname, "..", ".build-tools", `declares-${path.basename(TARGET)}.txt`);
fs.mkdirSync(path.dirname(listPath), { recursive: true });
fs.writeFileSync(
  listPath,
  [
    `# ${TARGET} declare 海清理清单（由 tools/clear-declares.cjs 生成）`,
    `# declare 行数 ${lines.filter(isDeclare).length}／去重 ${declareNames.length}`,
    "",
    `## 真实外部依赖（${real.length}）— 须 resolve`,
    ...[...needed.entries()].sort((a, b) => b[1] - a[1]).map(([n, c]) => `  ${n}\t(${c} 处)`),
    "",
    `## D 类误捕·直接删（${fake.length}）— 产物局部变量`,
    "  " + fake.join(" "),
  ].join("\n"),
);
console.log("\n清单已写入", listPath);
console.log("文件已还原（tsc 探测是只读操作）。");