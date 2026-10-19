/*
 * PKRC · B-14 发布脚本端到端演练（tools/drill-release.mjs）
 * ---------------------------------------------------------------------------
 * 派单：`docs/delegation/32-第五阶段任务分发.md` §六 B-14（high，10-22~10-26）
 * 验收：①用真实产物跑「暂存 → 校验 → 备份(SHA256) → 原子切换 → 冒烟」
 *       ②故意注入一条失败路径并验证自动回滚生效
 *       ③产出演练记录（含耗时与产物校验和）
 *
 * ===========================================================================
 * 🔑 演练设计（为什么这么排）
 * ===========================================================================
 * 绝不能拿**线上** `game/server/dist` 当演练目标 —— 那等于替 E-5（A5-01b）把切换做了。
 * 所以目标是一个**沙箱目录**，真实产物从两个真实来源组装：
 *     --build-dir = 锚点树的真实构建输出（.build-tools/tarball-src/<anchor>/dist）
 *     --asset-dir = 线上 dist（它是目前唯一含全部 14 类资源的真实资产树）
 *
 * 两次演练：
 *   演练 A（真实规模 · 全绿）：沙箱目标 ← 真实产物（约 750 MB / 38k 文件）
 *        ⇒ 证明「暂存 → 校验 → 备份 → 原子切换 → 冒烟」在真实数据上走得通，并测真实耗时
 *   演练 B（失败注入 · 回滚）：目标换成一个**故意坏掉的小产物**（index.html 引用不存在的 js）
 *        ⇒ 冒烟必然失败 ⇒ 验证自动回滚把**750 MB 的真实产物**换回来
 *
 *   ⚠️ 演练 B 之所以不用再复制 750 MB：`--backup-mode=move` 的备份是 **rename**，
 *      所以「用大目标 + 小新产物」就能在 O(1) 磁盘开销下做真实规模的回滚演练。
 *
 * 安全：本脚本只操作 `game/server/.release-staging/drill/` 这一个沙箱根，
 *       结束前校验所有路径都在该根之内；默认演练完**清理**（用 --keep 保留）。
 *
 * 运行：node tools/drill-release.mjs [--keep] [--json=<out.json>]
 * 需要 Node ≥22（仅因本文件用 ESM + 顶层 await；release.cjs 本身仍是 Node 16）。
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const REPO = path.resolve(process.cwd());
const NODE = path.join(REPO, "shared", "runtime", "node.exe"); // 运行期 Node 16
const RELEASE = path.join(REPO, "tools", "release.cjs");
const ANCHOR_DIST = path.join(
  REPO,
  ".build-tools",
  "tarball-src",
  "pokerogue-90df65097b6df76f713e6bd108afa84499e8b993",
  "dist"
);
const LIVE_DIST = path.join(REPO, "game", "server", "dist");
const DRILL_DIR_NAME = (() => {
  const eq = process.argv.find((a) => a.startsWith("--dir="));
  if (eq) return eq.slice("--dir=".length);
  const i = process.argv.indexOf("--dir");
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : "drill";
})();
const DRILL_ROOT = path.join(REPO, "game", "server", ".release-staging", DRILL_DIR_NAME);

const argv = process.argv.slice(2);
const KEEP = argv.includes("--keep");
const JSON_OUT = (() => {
  const i = argv.findIndex((a) => a === "--json");
  const eq = argv.find((a) => a.startsWith("--json="));
  if (eq) return path.resolve(REPO, eq.slice("--json=".length));
  return i >= 0 && argv[i + 1] ? path.resolve(REPO, argv[i + 1]) : null;
})();

// ---------------------------------------------------------------------------
// 小工具
// ---------------------------------------------------------------------------
function wf(root, rel, content) {
  const f = path.join(root, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, content);
}
function measure(root) {
  let files = 0;
  let bytes = 0;
  const stack = [""];
  while (stack.length) {
    const rel = stack.pop();
    const dir = rel ? path.join(root, rel) : root;
    let es;
    try {
      es = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of es) {
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) stack.push(r);
      else if (e.isFile()) {
        files++;
        try {
          bytes += fs.statSync(path.join(root, r)).size;
        } catch {
          /* ignore */
        }
      }
    }
  }
  return { files, bytes };
}
const human = (b) =>
  b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : b < 1073741824 ? `${(b / 1048576).toFixed(1)} MB` : `${(b / 1073741824).toFixed(2)} GB`;

/** 断言：路径必须在演练沙箱根之内（防止误删/误改沙箱外的东西） */
function assertInside(p, what) {
  const abs = path.resolve(p);
  if (!abs.startsWith(DRILL_ROOT + path.sep) && abs !== DRILL_ROOT) {
    throw new Error(`${what} 不在演练沙箱内，拒绝操作：${abs}`);
  }
}

/** 跑一次 publish，返回 {exit, ms, report, tail} */
function publish(tag, args, reportPath) {
  const t0 = Date.now();
  const r = spawnSync(NODE, [RELEASE, "publish", ...args, `--report=${reportPath}`], {
    cwd: REPO,
    encoding: "utf8",
    timeout: 20 * 60 * 1000,
    maxBuffer: 64 * 1024 * 1024,
  });
  const ms = Date.now() - t0;
  let report = null;
  try {
    report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
  } catch {
    report = null;
  }
  const out = (r.stdout || "") + (r.stderr || "");
  return { tag, exit: r.status, ms, report, tail: out.trim().split("\n").slice(-6).join("\n"), error: r.error ? String(r.error.message) : null };
}

const checks = [];
function check(name, pass, detail) {
  checks.push({ name, pass: !!pass, detail: detail ?? "" });
  console.log(`  ${pass ? "✅" : "❌"} ${name}${detail ? `  —— ${detail}` : ""}`);
}

// ---------------------------------------------------------------------------
// 主流程
// ---------------------------------------------------------------------------
console.log("PKRC 发布脚本端到端演练（B-14）");
console.log("=".repeat(76));

for (const [label, p] of [
  ["锚点构建产物 --build-dir", ANCHOR_DIST],
  ["线上 dist --asset-dir", LIVE_DIST],
]) {
  if (!fs.existsSync(p)) {
    console.error(`❌ ${label} 不存在：${p}`);
    process.exit(2);
  }
  const m = measure(p);
  console.log(`   ${label.padEnd(26)}${m.files} 文件 / ${human(m.bytes)}`);
}

// 沙箱必须是全新的：**不擅自删除非空目录**
// （踩过的坑：上一次中断留下的 162 MB / 23k 文件，`fs.rmSync` 在这台机器上要跑 8 分钟以上，
//   看起来像"演练卡住了"。破坏性操作不该藏在"演练"命令里，所以这里直接拒绝。）
if (fs.existsSync(DRILL_ROOT) && fs.readdirSync(DRILL_ROOT).length > 0) {
  console.error(`❌ 演练沙箱已存在且非空：${path.relative(REPO, DRILL_ROOT).replace(/\\/g, "/")}`);
  console.error("   → 换一个沙箱名：--dir=drill-<日期>");
  console.error("   → 或手动清理后重跑（本脚本**不会**擅自删非空目录）");
  process.exit(2);
}
assertInside(DRILL_ROOT, "沙箱根");
fs.mkdirSync(DRILL_ROOT, { recursive: true });

const target = path.join(DRILL_ROOT, "dist");
const staging = path.join(DRILL_ROOT, "staging");
const backups = path.join(DRILL_ROOT, "backups");

// 沙箱目标：一个「像 dist」的旧产物（会被演练 A 整体换掉）
wf(target, "index.html", "<!doctype html><html><body>DRILL-OLD</body></html>");
wf(target, "OLD-MARKER.txt", "DRILL-OLD");
const oldTarget = measure(target);

// =========================================================================
// 演练 A：真实规模 · 全绿
// =========================================================================
console.log("");
console.log("演练 A —— 真实规模（暂存 → 校验 → 备份 → 原子切换 → 冒烟）");
console.log("-".repeat(76));

const A = publish(
  "A",
  [
    `--target=${target}`,
    `--build-dir=${ANCHOR_DIST}`,
    `--asset-dir=${LIVE_DIST}`,
    `--staging=${staging}`,
    `--backup-dir=${backups}`,
    "--keep=3",
    "--commit",
  ],
  path.join(DRILL_ROOT, "report-A.json")
);

const newTarget = fs.existsSync(target) ? measure(target) : { files: 0, bytes: 0 };
check("演练 A 退出码 0", A.exit === 0, `exit=${A.exit}${A.error ? " err=" + A.error : ""}`);
check("演练 A 到达 done 步", A.report && A.report.step === "done", A.report ? `step=${A.report.step}` : "无报告");
check("暂存产物 14 类就位且已校验", !!(A.report && A.report.verify), "verify 未跳过");
check("切换后冒烟通过", !!(A.report && A.report.smoke && A.report.smoke.ok), A.report?.smoke ? `servedBy=${A.report.smoke.servedBy}` : "");
check("新产物是真实规模（>1000 文件 / >100 MB）", newTarget.files > 1000 && newTarget.bytes > 100 * 1048576, `${newTarget.files} 文件 / ${human(newTarget.bytes)}`);
check("旧产物标记已被换走", !fs.existsSync(path.join(target, "OLD-MARKER.txt")), "");

const backupDirA = A.report?.backupDir || null;
const sumsA = backupDirA ? path.join(backupDirA, "SHA256SUMS") : null;
const sumsLines = sumsA && fs.existsSync(sumsA) ? fs.readFileSync(sumsA, "utf8").split("\n").filter((l) => l && !l.startsWith("#")).length : 0;
check("备份存在且含 SHA256SUMS", !!sumsA && fs.existsSync(sumsA), sumsA ? `${sumsLines} 条校验和` : "无");
check("备份内容 = 被换走的旧产物", !!(backupDirA && fs.existsSync(path.join(backupDirA, "OLD-MARKER.txt"))), backupDirA || "");
if (A.report?.sums) console.log(`     SHA256SUMS 文件：${A.report.sums}`);

// =========================================================================
// 演练 B：失败注入 · 自动回滚（目标 = 刚换上的 750 MB 真实产物）
// =========================================================================
console.log("");
console.log("演练 B —— 失败注入（坏产物 ⇒ 冒烟失败 ⇒ 自动回滚到真实产物）");
console.log("-".repeat(76));

const brokenBuild = path.join(DRILL_ROOT, "broken-build");
wf(brokenBuild, "index.html", '<!doctype html><html><head><script src="./assets/missing.js"></script></head><body>BROKEN</body></html>');
wf(brokenBuild, "assets/app.js", "console.log('app');");
const tinyAsset = path.join(DRILL_ROOT, "tiny-asset");
wf(tinyAsset, "images/1.png", "PNG");

const beforeB = measure(target);

const B = publish(
  "B",
  [
    `--target=${target}`,
    `--build-dir=${brokenBuild}`,
    `--asset-dir=${tinyAsset}`,
    `--staging=${staging}`,
    `--backup-dir=${backups}`,
    "--no-verify", // 故意跳过 ③，好让失败发生在 ⑦ 冒烟 ⇒ 专测 ⑧ 回滚
    "--commit",
  ],
  path.join(DRILL_ROOT, "report-B.json")
);

const afterB = fs.existsSync(target) ? measure(target) : { files: 0, bytes: 0 };
check("演练 B 退出码非 0", B.exit !== 0, `exit=${B.exit}`);
check("失败发生在冒烟步（step=smoke）", !!(B.report && B.report.step === "smoke"), B.report ? `step=${B.report.step}` : "无报告");
check("自动回滚已生效（rolledBack=true）", !!(B.report && B.report.rolledBack === true), "");
check(
  "目标已恢复为真实产物（文件数回到回滚前）",
  afterB.files === beforeB.files && afterB.bytes === beforeB.bytes,
  `${beforeB.files}→${afterB.files} 文件 / ${human(afterB.bytes)}`
);
const brokenDir = B.report?.brokenDir || null;
check("坏产物已留证（dist.broken-*）", !!(brokenDir && fs.existsSync(brokenDir)), brokenDir || "");
check("坏产物里确实是那份坏的", !!(brokenDir && fs.existsSync(path.join(brokenDir, "index.html")) && !fs.existsSync(path.join(brokenDir, "audio"))), "");
check("备份已被换回目标（不再是备份目录）", !!(B.report?.backupDir && !fs.existsSync(B.report.backupDir)), B.report?.backupDir || "");

// =========================================================================
// 记录
// =========================================================================
const record = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  sandbox: path.relative(REPO, DRILL_ROOT).replace(/\\/g, "/"),
  inputs: {
    buildDir: path.relative(REPO, ANCHOR_DIST).replace(/\\/g, "/"),
    assetDir: path.relative(REPO, LIVE_DIST).replace(/\\/g, "/"),
    note: "真实来源：锚点构建输出 + 线上 dist（目前唯一含全部 14 类的资产树）。**未触碰线上 dist**。",
  },
  drillA: {
    purpose: "真实规模全绿：暂存 → 校验 → 备份(SHA256) → 原子切换 → 冒烟",
    exit: A.exit,
    ms: A.ms,
    wallSec: Number((A.ms / 1000).toFixed(1)),
    step: A.report?.step ?? null,
    product: { files: newTarget.files, bytes: newTarget.bytes },
    smoke: A.report?.smoke ? { ok: A.report.smoke.ok, servedBy: A.report.smoke.servedBy, checks: A.report.smoke.checks.length } : null,
    backupDir: backupDirA ? path.relative(REPO, backupDirA).replace(/\\/g, "/") : null,
    sha256SumsEntries: sumsLines,
    stageMs: {
      assembleAndVerify: A.report?.durationMs ?? null,
      note: "durationMs 是脚本内自测总耗时；wallSec 是含进程启动的墙钟",
    },
  },
  drillB: {
    purpose: "失败注入（坏 index.html 引用缺失 js，跳过 ③）⇒ 冒烟失败 ⇒ 自动回滚",
    exit: B.exit,
    ms: B.ms,
    wallSec: Number((B.ms / 1000).toFixed(1)),
    step: B.report?.step ?? null,
    rolledBack: B.report?.rolledBack ?? null,
    brokenDir: brokenDir ? path.relative(REPO, brokenDir).replace(/\\/g, "/") : null,
    restored: { files: afterB.files, bytes: afterB.bytes },
  },
  checks,
  allPass: checks.every((c) => c.pass),
  cleanup: KEEP ? "kept" : "removed",
};
if (JSON_OUT) {
  fs.mkdirSync(path.dirname(JSON_OUT), { recursive: true });
  fs.writeFileSync(JSON_OUT, JSON.stringify(record, null, 2) + "\n", "utf8");
}

console.log("");
console.log("=".repeat(76));
console.log(`演练 A：${record.drillA.wallSec}s · ${newTarget.files} 文件 / ${human(newTarget.bytes)} · 冒烟 ${A.report?.smoke?.servedBy ?? "-"}`);
console.log(`演练 B：${record.drillB.wallSec}s · step=${record.drillB.step} · rolledBack=${record.drillB.rolledBack}`);
console.log(`检查项：${checks.filter((c) => c.pass).length}/${checks.length} 通过`);
if (JSON_OUT) console.log(`记录：${path.relative(REPO, JSON_OUT).replace(/\\/g, "/")}`);

if (!KEEP) {
  assertInside(DRILL_ROOT, "沙箱根");
  const freed = fs.existsSync(DRILL_ROOT) ? measure(DRILL_ROOT) : { files: 0, bytes: 0 };
  fs.rmSync(DRILL_ROOT, { recursive: true, force: true });
  console.log(`已清理演练沙箱（释放 ${human(freed.bytes)}，${freed.files} 文件）。加 --keep 可保留。`);
} else {
  console.log(`沙箱保留：${path.relative(REPO, DRILL_ROOT).replace(/\\/g, "/")}`);
}

const ok = record.allPass;
console.log(ok ? "\n✅ 演练全部通过。" : "\n❌ 有检查项未通过。");
process.exitCode = ok ? 0 : 1;
