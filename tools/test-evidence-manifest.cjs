/*
 * PKRC · B-12 证据索引与治理回归测试（tools/test-evidence-manifest.cjs）
 * ---------------------------------------------------------------------------
 * 重点守住三类**易退化**逻辑：
 *   ① `report.json` 的**两种 schema**（双产物 results:{A,B} / 单产物扁平）
 *      —— 第一版只认前者，导致 4/6 个 run 索引出 0 个画面点（半空 manifest 比没有更危险）
 *   ② `machineVerdict` 的三档判定与 decisive 位
 *      —— 不许把「机器判不了」的情况说成通过（O-9b：AI 不得单独作通过依据）
 *   ③ `selectPrunable` 的清理选择（keep / maxMb / maxDays / protect）
 *      —— 算错了就直接删证据，必须有纯函数级用例
 *
 * 运行：..\shared\runtime\node.exe tools\test-evidence-manifest.cjs
 * 不引测试框架（D3）；用 require 直接调内部函数（沙箱禁 spawn）。
 */

"use strict";

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");

const M = require(path.join(__dirname, "evidence-manifest.cjs"));

// ---------------------------------------------------------------------------
// 迷你 runner
// ---------------------------------------------------------------------------
const results = [];
async function test(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
    process.stdout.write(`  PASS  ${name}\n`);
  } catch (err) {
    results.push({ name, ok: false, err });
    process.stdout.write(`  FAIL  ${name}\n        ${err.message}\n`);
  }
}

const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), "pkrc-evman-"));
let seq = 0;
function tmpRoot(tag) {
  const d = path.join(ROOT, `${tag}-${++seq}`);
  fs.mkdirSync(d, { recursive: true });
  return d;
}
function wf(root, rel, content) {
  const f = path.join(root, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, content === undefined ? "x" : content);
}

/** 双产物 report.json */
function dualReport({ shots = ["00-a"], aChecks = [], bChecks = [], aReady = true, bReady = true, diff = null }) {
  const mk = (name) => ({ name, pass: true });
  return {
    scenario: { id: "boot", label: "启动", system: "启动 / 加载" },
    generatedAt: "2026-10-19T00:00:00.000Z",
    results: {
      A: { productId: "A", ready: aReady, checks: aChecks.length ? aChecks : [{ name: mk("x").name, pass: true }], shots: shots.map((s) => ({ name: s, file: `A/${s}.png` })) },
      B: { productId: "B", ready: bReady, checks: bChecks.length ? bChecks : [{ name: "x", pass: true }], shots: shots.map((s) => ({ name: s, file: `B/${s}.png` })) },
    },
    comparisons: diff
      ? shots.map((s) => ({ shot: s, diff: { diffRatio: diff, meanAbsDiff: 1.5, bbox: { x: 0, y: 0, w: 10, h: 10 } }, sideBySide: `_compare/${s}--A-B.png` }))
      : [],
  };
}

/** 单产物 report.json（**扁平**结构：无 results 包装） */
function singleReport({ productId = "A", shots = ["00-a"], checks = [{ name: "x", pass: true }], ready = true }) {
  return {
    scenario: { id: "catalog", label: "画面级全量走查", system: "多系统" },
    generatedAt: "2026-10-19T00:00:00.000Z",
    productId,
    ready,
    checks,
    shots: shots.map((s) => ({ name: s, file: `${productId}/${s}.png` })),
  };
}

/** 造一个 run 目录（含占位 PNG） */
function mkRun(root, name, report, imgScale = 1) {
  const dir = path.join(root, name);
  wf(dir, "report.json", JSON.stringify(report, null, 2));
  for (const pid of Object.keys(report.results || {}).length ? Object.keys(report.results) : [report.productId || "A"]) {
    for (const sh of (report.results ? report.results[pid].shots : report.shots) || []) {
      wf(dir, sh.file, "P".repeat(100 * imgScale));
    }
  }
  for (const c of report.comparisons || []) if (c.sideBySide) wf(dir, c.sideBySide, "C".repeat(100 * imgScale));
  wf(dir, "report.html", "H".repeat(200));
  return dir;
}

// ---------------------------------------------------------------------------
// ① schema 兼容（本任务踩到的真 bug）
// ---------------------------------------------------------------------------
async function suiteSchema() {
  process.stdout.write("\n── report.json 的两种 schema\n");

  await test("双产物（results:{A,B}）能索引出画面点与差异", () => {
    const root = tmpRoot("dual");
    mkRun(root, "boot-20261019-010101", dualReport({ shots: ["00-a", "01-b"], diff: 0.53 }));
    const { runs, error } = M.scanRuns(root);
    assert.strictEqual(error, null);
    assert.strictEqual(runs.length, 1);
    const r = runs[0];
    assert.deepStrictEqual(r.products, ["A", "B"]);
    assert.strictEqual(r.points.length, 2, "两个 shot 应产出两个画面点");
    const p = r.points[0];
    assert.strictEqual(p.images.A, "A/00-a.png");
    assert.strictEqual(p.images.B, "B/00-a.png");
    assert.strictEqual(p.images.compare, "_compare/00-a--A-B.png", "并排对比图必须挂上");
    assert.strictEqual(p.diff.ratio, 0.53);
  });

  await test("单产物（扁平 productId + 顶层 shots）**也必须**索引出画面点", () => {
    const root = tmpRoot("single");
    mkRun(root, "catalog-boot-A", singleReport({ shots: ["boot.ready", "boot.lang-select"] }));
    const { runs } = M.scanRuns(root);
    assert.strictEqual(runs.length, 1);
    const r = runs[0];
    assert.deepStrictEqual(r.products, ["A"]);
    assert.strictEqual(r.points.length, 2, "单产物 run 索引为空 ⇒ 半空 manifest（曾经的 bug）");
    assert.strictEqual(r.points[0].images.A, "A/boot.ready.png");
    assert.strictEqual(r.points[0].diff, null, "单产物没有对比图，diff 必须为 null 而不是伪造 0");
  });

  await test("report.json 缺失时标记 broken、不抛异常、仍统计体积", () => {
    const root = tmpRoot("broken");
    const dir = path.join(root, "zzz-broken");
    wf(dir, "A/shot.png", "XXXX");
    const { runs } = M.scanRuns(root);
    assert.strictEqual(runs.length, 1);
    assert.ok(/report\.json/.test(runs[0].broken), "应说明缺 report.json");
    assert.strictEqual(runs[0].points.length, 0);
    assert.ok(runs[0].bytes > 0, "体积仍要统计（清理决策需要）");
  });

  await test("非标准命名的 run 被纳入索引但标 legacy:true（不静默丢弃）", () => {
    const root = tmpRoot("legacy");
    mkRun(root, "boot-A-B", dualReport({}));
    mkRun(root, "boot-20261019-010101", dualReport({}));
    mkRun(root, "含中文的名字", dualReport({}));
    const { runs } = M.scanRuns(root);
    assert.strictEqual(runs.length, 3, "扫描要包容：不能被 SAFE_DIR_RE 静默过滤掉");
    const byId = Object.fromEntries(runs.map((r) => [r.runId, r]));
    assert.strictEqual(byId["boot-A-B"].legacy, true);
    assert.strictEqual(byId["boot-20261019-010101"].legacy, false);
    assert.strictEqual(byId["含中文的名字"].safeName, false, "不安全名仍要标记（供 prune 拒绝）");
  });

  await test("标准命名解析出 stamp（用于清理排序）", () => {
    const root = tmpRoot("stamp");
    mkRun(root, "boot-20261019-010101", dualReport({}));
    const r = M.scanRuns(root).runs[0];
    assert.strictEqual(r.stamp, "20261019-010101");
    assert.strictEqual(r.scenario, "boot");
  });
}

// ---------------------------------------------------------------------------
// ② machineVerdict
// ---------------------------------------------------------------------------
async function suiteVerdict() {
  process.stdout.write("\n── machineVerdict（只判机器能判的，不冒充裁定）\n");

  const P = (over) =>
    Object.assign(
      { images: {}, diff: null, checks: { A: { pass: 8, total: 8 } }, ready: { A: true } },
      over
    );

  await test("产物未就绪 → failed 且 decisive（决定性）", () => {
    const v = M.machineVerdict(P({ ready: { A: true, B: false }, checks: { A: { pass: 8, total: 8 }, B: { pass: 8, total: 8 } } }), 0.02);
    assert.strictEqual(v.machineVerdict, "failed");
    assert.strictEqual(v.decisive, true);
    assert.ok(/B 未就绪/.test(v.verdictNote));
  });

  await test("任一 check 失败 → failed 且 decisive", () => {
    const v = M.machineVerdict(P({ checks: { A: { pass: 7, total: 8 } } }), 0.02);
    assert.strictEqual(v.machineVerdict, "failed");
    assert.strictEqual(v.decisive, true);
    assert.ok(/7\/8/.test(v.verdictNote));
  });

  await test("checks 全过但像素差异 > 阈值 → attention（非决定性，需裁定）", () => {
    const v = M.machineVerdict(P({ diff: { ratio: 0.53 } }), 0.02);
    assert.strictEqual(v.machineVerdict, "attention");
    assert.strictEqual(v.decisive, false, "像素差异不能单独判定失败/通过");
    assert.ok(/53\.00%/.test(v.verdictNote));
  });

  await test("checks 全过且差异 ≤ 阈值 → consistent（仍非决定性）", () => {
    const v = M.machineVerdict(P({ diff: { ratio: 0.001 } }), 0.02);
    assert.strictEqual(v.machineVerdict, "consistent");
    assert.strictEqual(v.decisive, false, "consistent 仍需 E-3 签认");
  });

  await test("无对比图时不得把 diff 当成 0（必须显式说明未比像素）", () => {
    const v = M.machineVerdict(P({ diff: null }), 0.02);
    assert.strictEqual(v.machineVerdict, "consistent");
    assert.ok(/无对比图/.test(v.verdictNote), `实际：${v.verdictNote}`);
  });

  await test("阈值边界：刚好等于阈值不算 attention（> 才是）", () => {
    const v = M.machineVerdict(P({ diff: { ratio: 0.02 } }), 0.02);
    assert.strictEqual(v.machineVerdict, "consistent");
  });
}

// ---------------------------------------------------------------------------
// ③ selectPrunable
// ---------------------------------------------------------------------------
async function suitePrune() {
  process.stdout.write("\n── selectPrunable（清理选择，纯函数）\n");

  const mk = (id, bytes, stamp, mtime) => ({ runId: id, bytes, stamp: stamp || null, _mtime: mtime || 0 });
  // stamp 用 2026-01-01/02/03，legacy 用「2026-01-04 的 mtime」⇒ 排序 = a, b, c, legacy-x
  const DAY4 = new Date(2026, 0, 4).getTime();
  const runs = [
    mk("a-20260101-000000", 100, "20260101-000000"),
    mk("b-20260102-000000", 200, "20260102-000000"),
    mk("c-20260103-000000", 300, "20260103-000000"),
    mk("legacy-x", 400, null, DAY4),
  ];

  await test("--keep=2 → 删最旧的 2 个", () => {
    const s = M.selectPrunable(runs, { keep: 2 });
    assert.deepStrictEqual(s.doomed, ["a-20260101-000000", "b-20260102-000000"]);
  });

  await test("--keep=0 → 全删（显式清空语义）", () => {
    const s = M.selectPrunable(runs, { keep: 0 });
    assert.strictEqual(s.doomed.length, 4);
  });

  await test("--protect 钉住的 run 一定不删", () => {
    const s = M.selectPrunable(runs, { keep: 2, protect: ["a-20260101-000000"] });
    assert.ok(!s.doomed.includes("a-20260101-000000"), "受保护的不该在待删列表");
    assert.deepStrictEqual(s.protectedRuns, ["a-20260101-000000"]);
    assert.deepStrictEqual(s.doomed, ["b-20260102-000000"]);
  });

  await test("--max-mb 从最旧开始删到不超限", () => {
    // 总 1000 B；限 400 B ⇒ 需删到 ≤400：删 a(100)→900，删 b(200)→700，删 c(300)→400
    const s = M.selectPrunable(runs, { maxMb: 400 / 1048576 });
    assert.deepStrictEqual(s.doomed, ["a-20260101-000000", "b-20260102-000000", "c-20260103-000000"]);
  });

  await test("--max-mb 已满足时不删任何东西", () => {
    const s = M.selectPrunable(runs, { maxMb: 1 });
    assert.deepStrictEqual(s.doomed, []);
  });

  await test("排序优先用 runId 内时间戳；无时间戳的退回 mtime", () => {
    const mixed = [mk("legacy-new", 10, null, 9e12), mk("z-20200101-000000", 10, "20200101-000000", 1)];
    const s = M.selectPrunable(mixed, { keep: 1 });
    // 有时间戳的更旧 ⇒ 应被删；legacy 靠 mtime（更大）排在新
    assert.deepStrictEqual(s.doomed, ["z-20200101-000000"]);
  });

  await test("无任何条件 → 不删（避免误以为默认会清空）", () => {
    const s = M.selectPrunable(runs, {});
    assert.deepStrictEqual(s.doomed, []);
  });
}

// ---------------------------------------------------------------------------
// ④ 杂项
// ---------------------------------------------------------------------------
async function suiteMisc() {
  process.stdout.write("\n── 杂项\n");

  await test("STD_RUN_RE：只认 <scenario>-<yyyyMMdd-HHmmss>", () => {
    assert.ok(M.STD_RUN_RE.test("boot-20261019-010101"));
    assert.ok(M.STD_RUN_RE.test("input-smoke-20261019-010101"));
    assert.ok(!M.STD_RUN_RE.test("boot-A-B"));
    assert.ok(!M.STD_RUN_RE.test("boot-20261019-0101"));
    assert.ok(!M.STD_RUN_RE.test("20261019-010101"));
  });

  await test("listFiles 返回排序的 {rel,size}（正斜杠）且不越界", () => {
    const d = tmpRoot("lf");
    wf(d, "b/x.png", "xx");
    wf(d, "a.png", "x");
    const files = M.listFiles(d);
    assert.deepStrictEqual(files.map((f) => f.rel), ["a.png", "b/x.png"]);
    assert.deepStrictEqual(files.map((f) => f.size), [1, 2]);
  });

  await test("stampToMs：yyyyMMdd-HHmmss → epoch；非法返回 null", () => {
    assert.strictEqual(M.stampToMs("20260101-000000"), new Date(2026, 0, 1, 0, 0, 0).getTime());
    assert.strictEqual(M.stampToMs("boot-A-B"), null);
    assert.strictEqual(M.stampToMs(null), null);
    assert.strictEqual(M.stampToMs("20260101-0000"), null);
  });

  await test("证据根不存在时返回 error 而不是抛异常", () => {
    const { runs, error } = M.scanRuns(path.join(ROOT, "definitely-not-here"));
    assert.deepStrictEqual(runs, []);
    assert.ok(/无法读取证据根/.test(error));
  });

  await test("manifest 文件名为 manifest.json（prune 的受保护名单依赖它）", () => {
    assert.strictEqual(M.MANIFEST_NAME, "manifest.json");
  });
}

// ---------------------------------------------------------------------------
// 主流程
// ---------------------------------------------------------------------------
(async function main() {
  process.stdout.write("PKRC · B-12 证据索引与治理回归测试\n");
  process.stdout.write("=".repeat(68) + "\n");
  process.stdout.write(`临时根：${ROOT}\n`);

  await suiteSchema();
  await suiteVerdict();
  await suitePrune();
  await suiteMisc();

  const pass = results.filter((r) => r.ok).length;
  const fail = results.length - pass;
  process.stdout.write("\n" + "=".repeat(68) + "\n");
  process.stdout.write(`总计：${pass} 通过 / ${fail} 失败 / ${results.length} 项\n`);
  if (fail > 0) {
    process.stdout.write("\n失败明细：\n");
    for (const r of results.filter((x) => !x.ok)) {
      process.stdout.write(`  · ${r.name}\n    ${r.err && r.err.message}\n`);
    }
    process.exitCode = 1;
  }
})();
