/*
 * PKRC · B-12 走查证据包归档与体积治理（tools/evidence-manifest.cjs）
 * ---------------------------------------------------------------------------
 * 派单：`docs/delegation/32-第五阶段任务分发.md` §六 B-12（urgent）
 * 来源约束：**O-9b** 要求所有者保留「全量证据包复核权」，但证据不能进 git（会撑爆历史）。
 * 现状：`tools/walkthrough/evidence/` 已在 `.gitignore:152`，出 git 但**留在盘上**。
 *
 * 本工具只做四件事（**不做报告** —— 那是 F-16 的活）：
 *   build    扫 evidence/ → 生成 manifest.json（机读索引）+ 打印汇总表
 *   path     按 manifest 定位任意一个画面点的绝对路径（所有者抽查用）
 *   prune    清理策略（按份数 / 按体积 / 按天数），默认 dry-run
 *   compact  体积治理：对「机器判定为一致」的画面点降采样，默认 dry-run
 *
 * 🔑 设计决策：manifest 以 **report.json 为单一事实源**，
 *    不重新扫图猜结构。理由：F-10 已经把 scenario / checks / shots / comparisons /
 *    diff 全写进 report.json 了；再扫一遍 PNG 只会造出**第二个真相**，
 *    两者一旦漂移就无法判断谁对。
 *
 * ⚠️ 关于「判定」的边界（O-9b 三级判据）：
 *    本工具只给 `machineVerdict`，含义严格限定为**机器可判的部分**：
 *      failed      —— 任一产物未就绪，或任一 check 失败   ⇒ **决定性**
 *      attention   —— 全部就绪且 checks 全过，但像素差异 > 阈值 ⇒ 需人/AI 裁定
 *      consistent  —— 全部就绪、checks 全过、差异 ≤ 阈值 ⇒ 仍由 E-3 签认
 *    **它绝不是 E-3 的最终裁定**。AI 视觉审阅不得单独作通过依据（派单 §三 E-3 ③）。
 *
 * 语法上限：Node 16 可跑（无顶层 await；PNG 编解码用动态 import 加载 ESM）。
 * 依赖：零新增（fs / path / 动态 import 仓内 png.mjs）。
 */

"use strict";

const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");

const REPO_ROOT = path.resolve(__dirname, "..");
const DEFAULT_ROOT = path.join(REPO_ROOT, "tools", "walkthrough", "evidence");
const MANIFEST_NAME = "manifest.json";
const SCHEMA_VERSION = 1;

/** F-12 的用例总量（`docs/delegation/29-F12-走查用例清单.md` 附录 A）—— 仅用于体积推算 */
const F12_POINT_TOTAL = 51;

/** 标准 run 目录名：`<scenario>-<yyyyMMdd-HHmmss>`（F-10 默认输出） */
const STD_RUN_RE = /^([a-z0-9][a-z0-9-]*)-(\d{8}-\d{6})$/i;
/** 允许被 prune 的目录名（防误删：只接受这些字符） */
const SAFE_DIR_RE = /^[A-Za-z0-9._-]+$/;

/** 像素差异阈值：超过它就不能算「机器可判一致」，需裁定 */
const DEFAULT_DIFF_THRESHOLD = 0.02; // 2%

// ---------------------------------------------------------------------------
// 参数
// ---------------------------------------------------------------------------
const rawArgv = process.argv.slice(2);
const KNOWN_CMDS = ["build", "path", "prune", "compact", "help"];
let cmd = "build";
let ARGV = rawArgv;
if (rawArgv[0] && !rawArgv[0].startsWith("-")) {
  cmd = KNOWN_CMDS.includes(rawArgv[0]) ? rawArgv[0] : "unknown";
  ARGV = rawArgv.slice(1);
} else if (rawArgv.includes("--help") || rawArgv.includes("-h")) {
  cmd = "help";
}

const flag = (n) => ARGV.includes(n);
/** 同时支持 `--k=v` 与 `--k v`（本项目已登记过的隐蔽 bug 类） */
const opt = (n) => {
  const eq = ARGV.find((a) => a.startsWith(n + "="));
  if (eq !== undefined) return eq.slice(n.length + 1);
  const i = ARGV.findIndex((a) => a === n);
  if (i >= 0 && ARGV[i + 1] !== undefined && !ARGV[i + 1].startsWith("--")) return ARGV[i + 1];
  return undefined;
};
const posArgs = ARGV.filter((a, i) => !a.startsWith("-") && (i === 0 || !ARGV[i - 1].startsWith("--")));

const JSON_OUT = flag("--json");
const lines = [];
function out(s) {
  if (!JSON_OUT) process.stdout.write(s + "\n");
  else lines.push(s);
}

function human(bytes) {
  if (!Number.isFinite(bytes)) return "?";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1073741824).toFixed(2)} GB`;
}
const pad = (s, n) => {
  s = String(s === undefined || s === null ? "-" : s);
  return s.length >= n ? s.slice(0, n) : s + " ".repeat(n - s.length);
};

// ---------------------------------------------------------------------------
// 扫描
// ---------------------------------------------------------------------------
/** 递归收集文件（相对路径 + 字节数），不跟随符号链接 */
function listFiles(root) {
  const acc = [];
  const stack = [""];
  while (stack.length) {
    const rel = stack.pop();
    const dir = rel ? path.join(root, rel) : root;
    let ents;
    try {
      ents = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of ents) {
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isSymbolicLink()) continue; // 不跟进、不统计
      if (e.isDirectory()) stack.push(r);
      else if (e.isFile()) {
        let size = 0;
        try {
          size = fs.statSync(path.join(root, r)).size;
        } catch {
          /* ignore */
        }
        acc.push({ rel: r, size });
      }
    }
  }
  return acc.sort((a, b) => (a.rel < b.rel ? -1 : 1));
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

/** 把 checks 数组折成 { pass, total } */
function checkSummary(checks) {
  if (!Array.isArray(checks)) return { pass: 0, total: 0 };
  return { pass: checks.filter((c) => c && c.pass).length, total: checks.length };
}

/**
 * 解析一个 run 目录 → run 条目。
 *
 * points 的合成方式：以 `results[*].shots[]` 为骨架（**画面点**的权威来源），
 * 再用 `comparisons[]` 按 shot 名挂上双产物 diff。
 * 单产物 run 的 comparisons 为空，此时 point 只有单侧图 —— 如实记录 `products`。
 */
function parseRun(root, entry) {
  const dir = path.join(root, entry.name);
  const files = listFiles(dir);
  const bytes = files.reduce((s, f) => s + f.size, 0);
  const pngs = files.filter((f) => f.rel.toLowerCase().endsWith(".png"));
  const pngBytes = pngs.reduce((s, f) => s + f.size, 0);
  const htmls = files.filter((f) => /\.html?$/i.test(f.rel));

  const rep = readJson(path.join(dir, "report.json"));
  const m = STD_RUN_RE.exec(entry.name);
  const run = {
    runId: entry.name,
    absDir: dir,
    bytes,
    pngBytes,
    fileCount: files.length,
    pngCount: pngs.length,
    html: htmls.map((f) => f.rel),
    reportJson: rep ? "report.json" : null,
    // 体积三大块（H-11 要的「实测 vs 估算」必须分得开，否则会把 JSON 膨胀算漏）
    reportJsonBytes: (files.find((f) => f.rel === "report.json") || { size: 0 }).size,
    // 紧凑化后的字节数 —— 用来量化 `JSON.stringify(...,null,2)` 的缩进开销
    reportJsonCompactBytes: rep ? Buffer.byteLength(JSON.stringify(rep), "utf8") : 0,
    htmlBytes: htmls.reduce((s, f) => s + f.size, 0),
    scenario: null,
    label: null,
    system: null,
    generatedAt: null,
    stamp: m ? m[2] : null,
    legacy: !m, // 不符合 `<scenario>-<yyyyMMdd-HHmmss>` 命名
    products: [],
    points: [],
    broken: null,
  };

  if (!rep) {
    run.broken = "缺少或无法解析 report.json —— 无法建立画面点索引";
    return run;
  }

  // ⚠️ F-10 的 report.json 有**两种 schema**（实测）：
  //   双产物（--product both）→ { scenario, results: { A:{...}, B:{...} }, comparisons: [...] }
  //   单产物（--product A）  → { scenario, productId:"A", label, ..., checks, shots, ... }（扁平，无 results）
  // 只认前者会让单产物 run 索引出 0 个画面点 —— 一个**半空的 manifest** 比没有更危险。
  const isSingle = !rep.results && (!!rep.productId || Array.isArray(rep.shots));
  const results = isSingle ? { [rep.productId || "?"]: rep } : rep.results || {};
  const comparisons = isSingle ? [] : rep.comparisons || [];

  run.scenario = rep.scenario && rep.scenario.id ? rep.scenario.id : null;  run.label = rep.scenario && rep.scenario.label ? rep.scenario.label : null;
  run.system = rep.scenario && rep.scenario.system ? rep.scenario.system : null;
  run.generatedAt = rep.generatedAt || null;

  run.products = Object.keys(results).sort();

  // ---------------------------------------------------------------------
  // 五态裁定（F-14 catalog 格式）
  // ---------------------------------------------------------------------
  // ⚠️ 2026-10-20 修正：F-14 把**五态裁定**写在 `results[P].state.catalog.records[]`，
  //    **不在** `comparisons` 里。早期版本只读 shots + comparisons ⇒
  //      · `unproven`（到达证明不足）被记成 consistent（**语义相反**）
  //      · `blocked` 的点没有截图 ⇒ 整个点**不可见**（f14-eryou-B2 曾索引出 0 个点）
  //    半空的 manifest 比没有更危险 —— 所有者会以为抽查过了。
  //
  // 映射（catalogVerdict → machineVerdict），有明确理由：
  //   pass        → consistent  （机器判一致，仍需 E-3 签认）
  //   fail        → failed      （决定性）
  //   blocked     → failed      （产物缺口，需归账：H-13 / L2/L3）
  //   unproven    → attention   （未证明，需裁定 —— **绝不能算 consistent**）
  //   unreachable → attention   （确实到不了，需裁定/挂账）
  const CATALOG_TO_MACHINE = {
    pass: "consistent",
    fail: "failed",
    blocked: "failed",
    unproven: "attention",
    unreachable: "attention",
  };

  /** id → 第一条（按产物序）catalog record */
  const recById = new Map();
  for (const pid of run.products) {
    const c = results[pid].state && results[pid].state.catalog;
    for (const rec of (c && c.records) || []) {
      if (rec && rec.id && !recById.has(rec.id)) recById.set(rec.id, Object.assign({ product: pid }, rec));
    }
  }

  // 画面点骨架 = shots ∪ comparisons ∪ catalog records（并集，保序）
  const shotOrder = [];
  const seen = new Set();
  const push = (id) => {
    if (id && !seen.has(id)) {
      seen.add(id);
      shotOrder.push(id);
    }
  };
  for (const pid of run.products) for (const sh of results[pid].shots || []) push(sh && sh.name);
  for (const c of comparisons) push(c && c.shot);
  for (const id of recById.keys()) push(id);

  const cmpByShot = new Map();
  for (const c of comparisons) if (c && c.shot) cmpByShot.set(c.shot, c);

  const checkByProduct = {};
  for (const pid of run.products) checkByProduct[pid] = checkSummary(results[pid].checks);
  const readyByProduct = {};
  for (const pid of run.products) readyByProduct[pid] = results[pid].ready !== false;

  for (const name of shotOrder) {
    const images = {};
    let ptBytes = 0;
    for (const pid of run.products) {
      const sh = (results[pid].shots || []).find((s) => s && s.name === name);
      if (!sh || !sh.file) continue;
      images[pid] = sh.file;
      const f = files.find((x) => x.rel === sh.file);
      if (f) ptBytes += f.size;
    }
    const c = cmpByShot.get(name);
    if (c && c.sideBySide) {
      images.compare = c.sideBySide;
      const f = files.find((x) => x.rel === c.sideBySide);
      if (f) ptBytes += f.size;
    }

    const rec = recById.get(name) || null;
    const pt = {
      id: name,
      images,
      bytes: ptBytes,
      diff: c && c.diff
        ? {
            ratio: typeof c.diff.diffRatio === "number" ? Number(c.diff.diffRatio.toFixed(6)) : null,
            meanAbsDiff: typeof c.diff.meanAbsDiff === "number" ? Number(c.diff.meanAbsDiff.toFixed(3)) : null,
            sameSize: c.diff.sameSize !== false,
            bbox: c.diff.bbox || null,
          }
        : null,
      checks: checkByProduct,
      ready: readyByProduct,
      // 五态裁定原样保留（**权威口径**，来自 F-14）
      catalogVerdict: rec ? rec.verdict || null : null,
      catalogReason: rec ? rec.reason || "" : "",
      catalogProduct: rec ? rec.product : null,
      routeReliability: rec ? rec.routeReliability || null : null,
      reachProof: rec ? rec.reachProof || null : null,
      hasShot: Object.keys(images).length > 0,
    };
    // 有 catalog 裁定就以它为准；没有才退回「机器从 checks/diff 推」
    if (rec && CATALOG_TO_MACHINE[rec.verdict]) {
      Object.assign(pt, {
        machineVerdict: CATALOG_TO_MACHINE[rec.verdict],
        verdictNote: `F-14 裁定 ${rec.verdict}${rec.reason ? "：" + rec.reason : ""}`,
        decisive: rec.verdict === "fail" || rec.verdict === "blocked",
        verdictSource: "catalog",
      });
    } else {
      Object.assign(pt, machineVerdict(pt, DEFAULT_DIFF_THRESHOLD));
      pt.verdictSource = "checks-diff";
    }
    run.points.push(pt);
  }

  const v = tallyVerdicts(run.points);
  run.machineVerdict = v.top;
  run.verdictTally = v.tally;
  run.catalogVerdictTally = tallyCatalog(run.points);
  return run;
}

/** 五态裁定分布（F-14 原样口径） */
function tallyCatalog(points) {
  const t = { pass: 0, fail: 0, blocked: 0, unproven: 0, unreachable: 0, none: 0 };
  for (const p of points) {
    if (p.catalogVerdict && t[p.catalogVerdict] !== undefined) t[p.catalogVerdict]++;
    else t.none++;
  }
  return t;
}

/**
 * 机器判定（**只覆盖能机器判的部分**，见文件头注释的边界说明）。
 * @returns {{machineVerdict:string, verdictNote:string, decisive:boolean}}
 */
function machineVerdict(pt, threshold) {
  const products = Object.keys(pt.checks || {});
  const badChecks = [];
  for (const pid of products) {
    if (pt.ready[pid] === false) badChecks.push(`${pid} 未就绪`);
    const s = pt.checks[pid];
    if (s && s.total > 0 && s.pass < s.total) badChecks.push(`${pid} 检查 ${s.pass}/${s.total}`);
  }
  if (badChecks.length) {
    return { machineVerdict: "failed", verdictNote: badChecks.join("；"), decisive: true };
  }
  const ratio = pt.diff && pt.diff.ratio !== null ? pt.diff.ratio : null;
  if (ratio !== null && ratio > threshold) {
    return {
      machineVerdict: "attention",
      verdictNote: `checks 全过，但像素差异 ${(ratio * 100).toFixed(2)}% > 阈值 ${(threshold * 100).toFixed(0)}%`,
      decisive: false,
    };
  }
  return {
    machineVerdict: "consistent",
    verdictNote: ratio === null ? "checks 全过（无对比图，像素未比）" : `checks 全过，像素差异 ${(ratio * 100).toFixed(3)}%`,
    decisive: false,
  };
}

function tallyVerdicts(points) {
  const tally = { failed: 0, attention: 0, consistent: 0 };
  for (const p of points) if (tally[p.machineVerdict] !== undefined) tally[p.machineVerdict]++;
  const top = tally.failed > 0 ? "failed" : tally.attention > 0 ? "attention" : points.length ? "consistent" : "empty";
  return { tally, top };
}

function scanRuns(root) {
  let ents;
  try {
    ents = fs.readdirSync(root, { withFileTypes: true });
  } catch (err) {
    return { runs: [], error: `无法读取证据根：${root}（${err.message}）` };
  }
  // ⚠️ 扫描要**包容**，删除才该**严格**：
  //    早期版本在这里用 SAFE_DIR_RE 过滤，结果任何非预期命名的证据目录会
  //    **静默消失**在索引外 —— 所有者以为抽查过了，其实根本没进 manifest。
  //    现在全部纳入索引，只在 run.safeName=false 时禁止 prune 删除它。
  const dirs = ents
    .filter((e) => e.isDirectory() && !e.isSymbolicLink())
    .sort((a, b) => (a.name < b.name ? -1 : 1));
  const runs = dirs.map((e) => {
    const r = parseRun(root, e);
    r.safeName = SAFE_DIR_RE.test(e.name);
    return r;
  });
  return { runs, error: null };
}

// ---------------------------------------------------------------------------
// build
// ---------------------------------------------------------------------------
function cmdBuild() {
  const root = path.resolve(opt("--root") || DEFAULT_ROOT);
  const outFile = path.resolve(opt("--out") || path.join(root, MANIFEST_NAME));
  const threshold = opt("--diff-threshold") !== undefined ? Number(opt("--diff-threshold")) : DEFAULT_DIFF_THRESHOLD;

  const { runs, error } = scanRuns(root);

  out("PKRC 走查证据索引（B-12）");
  out("=".repeat(76));
  out(`证据根：${root}`);
  out(`阈值  ：像素差异 > ${(threshold * 100).toFixed(0)}% 判 attention（机器可判的边界，不等于裁定）`);
  out("");
  if (error) {
    out(`❌ ${error}`);
    if (JSON_OUT) process.stdout.write(JSON.stringify({ ok: false, error }, null, 2) + "\n");
    process.exitCode = 2;
    return;
  }
  if (!runs.length) {
    out("（证据根下没有 run 目录 —— 先跑一次 `node tools/walkthrough/cli.mjs --scenario boot --product both`）");
  }

  // 汇总表
  out(`${pad("run", 26)}${pad("场景", 18)}${pad("点", 4)}${pad("产物", 6)}${pad("判定", 12)}${pad("体积", 10)}说明`);
  out("-".repeat(76));
  for (const r of runs) {
    const tally = r.verdictTally
      ? Object.entries(r.verdictTally).filter(([, v]) => v > 0).map(([k, v]) => `${k[0]}${v}`).join(",")
      : "-";
    const note = r.broken ? `⚠ ${r.broken}` : r.legacy ? "⚠ 非标准命名" : "";
    out(
      `${pad(r.runId, 26)}${pad(r.scenario || "-", 18)}${pad(r.points.length, 4)}` +
        `${pad(r.products.join("+") || "-", 6)}${pad(tally, 12)}${pad(human(r.bytes), 10)}${note}`
    );
  }

  const totals = {
    runs: runs.length,
    points: runs.reduce((s, r) => s + r.points.length, 0),
    pngs: runs.reduce((s, r) => s + r.pngCount, 0),
    bytes: runs.reduce((s, r) => s + r.bytes, 0),
    files: runs.reduce((s, r) => s + r.fileCount, 0),
    // 三块分开记：过 H-11 的「实测 vs 估算」时，混在一起就会把 JSON 膨胀算漏
    reportJsonBytes: runs.reduce((s, r) => s + (r.reportJsonBytes || 0), 0),
    reportJsonCompactBytes: runs.reduce((s, r) => s + (r.reportJsonCompactBytes || 0), 0),
    htmlBytes: runs.reduce((s, r) => s + (r.htmlBytes || 0), 0),
    pngOnDiskBytes: runs.reduce((s, r) => s + (r.pngBytes || 0), 0),
  };
  const tallyAll = { failed: 0, attention: 0, consistent: 0 };
  for (const r of runs) for (const p of r.points) if (tallyAll[p.machineVerdict] !== undefined) tallyAll[p.machineVerdict]++;
  const catalogAll = { pass: 0, fail: 0, blocked: 0, unproven: 0, unreachable: 0, none: 0 };
  for (const r of runs) {
    const t = r.catalogVerdictTally || {};
    for (const k of Object.keys(catalogAll)) catalogAll[k] += t[k] || 0;
  }

  // 体积推算（**给出假设，不直接抛数字**）
  const allPngs = [];
  for (const r of runs) {
    for (const p of r.points) for (const rel of Object.values(p.images)) if (/\.png$/i.test(rel)) allPngs.push(rel);
  }
  const dualRuns = runs.filter((r) => r.products.length >= 2 && r.points.length > 0);
  const measuredPointBytes = dualRuns.length
    ? dualRuns.reduce((s, r) => s + r.points.reduce((x, p) => x + p.bytes, 0), 0) /
      dualRuns.reduce((s, r) => s + r.points.length, 0)
    : null;
  // HTML 重复比：**只在「有点的 run」上算**。
  // 把没有画面点的 run 也算进来会虚高（那些 HTML 内联了图，但图没被 points 引用）。
  let htmlBytesForRatio = 0;
  let pngBytesForRatio = 0;
  for (const r of runs) {
    if (!r.points.length) continue;
    for (const h of r.html) {
      const f = path.join(r.absDir, h);
      if (fs.existsSync(f)) htmlBytesForRatio += fs.statSync(f).size;
    }
    for (const p of r.points) {
      for (const rel of Object.values(p.images)) {
        const f = path.join(r.absDir, rel);
        if (fs.existsSync(f)) pngBytesForRatio += fs.statSync(f).size;
      }
    }
  }
  const pngBytesReal = runs.reduce((s, r) => {
    let b = 0;
    for (const p of r.points) {
      for (const rel of Object.values(p.images)) {
        const f = path.join(r.absDir, rel);
        if (fs.existsSync(f)) b += fs.statSync(f).size;
      }
    }
    return s + b;
  }, 0);

  // JSON 成本（F-14 起 report.json 成为主要成本项，必须单独算）
  const runsWithPoints = runs.filter((r) => r.points.length > 0);
  const ptsInRuns = runsWithPoints.reduce((s, r) => s + r.points.length, 0);
  const jsonInRuns = runsWithPoints.reduce((s, r) => s + (r.reportJsonBytes || 0), 0);
  const jsonCompactInRuns = runsWithPoints.reduce((s, r) => s + (r.reportJsonCompactBytes || 0), 0);
  const measuredJsonPerPoint = ptsInRuns > 0 ? jsonInRuns / ptsInRuns : null;
  const jsonIndentRatio = jsonCompactInRuns > 0 ? jsonInRuns / jsonCompactInRuns : null;

  const estimate = {
    basis: {
      f12PointTotal: F12_POINT_TOTAL,
      measuredDualProductPoints: dualRuns.reduce((s, r) => s + r.points.length, 0),
      measuredPointBytes: measuredPointBytes === null ? null : Math.round(measuredPointBytes),
      measuredJsonPerPoint: measuredJsonPerPoint === null ? null : Math.round(measuredJsonPerPoint),
      jsonIndentRatio: jsonIndentRatio === null ? null : Number(jsonIndentRatio.toFixed(2)),
      htmlOverPngRatio: pngBytesForRatio > 0 ? Number((htmlBytesForRatio / pngBytesForRatio).toFixed(3)) : null,
      note:
        "measuredPointBytes = 实测「双产物单点（A+B+并排对比）」的 PNG 字节均值；" +
        "measuredJsonPerPoint = 实测「每个画面点摊到的 report.json 字节」；" +
        "jsonIndentRatio = report.json 磁盘字节 ÷ 紧凑 JSON 字节 —— 量化 `JSON.stringify(...,null,2)` 的缩进开销；" +
        "htmlOverPngRatio = report.html 字节 ÷ PNG 总字节。**F-14 起 JSON 才是主要成本项，只看 PNG 会严重低估。**",
    },
    scenarios: [],
  };
  if (measuredPointBytes !== null) {
    const pngTotal = measuredPointBytes * F12_POINT_TOTAL;
    const jsonTotal = measuredJsonPerPoint === null ? 0 : measuredJsonPerPoint * F12_POINT_TOTAL;
    const jsonCompactTotal = jsonIndentRatio ? jsonTotal / jsonIndentRatio : jsonTotal;
    const htmlTotal = pngTotal * (estimate.basis.htmlOverPngRatio || 0);
    // 治理后：一致点降采样到 1/2 线性尺寸 —— 实测聚合 27.3%（6 张 581.1KB → 158.8KB），取 0.27
    const CONSISTENT_SHARE = 0.7; // 假设：70% 的画面点最终判为一致（须由 H-2 实测替换）
    const HALF_RATIO = 0.27;
    const governedPng = pngTotal * (CONSISTENT_SHARE * HALF_RATIO + (1 - CONSISTENT_SHARE));
    estimate.scenarios = [
      { name: `${F12_POINT_TOTAL} 点 · 仅 PNG 全帧（B-12 第一版的估算口径）`, bytes: Math.round(pngTotal) },
      {
        name: `${F12_POINT_TOTAL} 点 · 实际构成（PNG + report.json + report.html）`,
        bytes: Math.round(pngTotal + jsonTotal + htmlTotal),
      },
      {
        name: `${F12_POINT_TOTAL} 点 · 若 report.json 改紧凑序列化（缩进开销 ${jsonIndentRatio ? jsonIndentRatio.toFixed(1) + "×" : "?"} 归零）`,
        bytes: Math.round(pngTotal + jsonCompactTotal + htmlTotal),
      },
      {
        name: `${F12_POINT_TOTAL} 点 · 紧凑 JSON + compact 降采样（假设 ${CONSISTENT_SHARE * 100}% 点判为一致）`,
        bytes: Math.round(governedPng + jsonCompactTotal + htmlTotal * 0.5),
      },
    ];
  }

  const naming = {
    standard: "<scenario>-<yyyyMMdd-HHmmss>（F-10 默认输出，可排序、自描述）",
    standardRuns: runs.filter((r) => !r.legacy).length,
    legacyRuns: runs.filter((r) => r.legacy).map((r) => r.runId),
    note: "非标准命名的 run 不阻断使用，但 manifest 标记 legacy:true，建议后续统一；本工具不擅自改名。",
  };

  const manifest = {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    root,
    manifestPath: outFile,
    naming,
    thresholds: { diffAttention: threshold },
    totals: Object.assign({}, totals, { machineVerdict: tallyAll }),
    estimate,
    runs: runs.map((r) => ({
      runId: r.runId,
      scenario: r.scenario,
      label: r.label,
      system: r.system,
      generatedAt: r.generatedAt,
      stamp: r.stamp,
      legacy: r.legacy,
      bytes: r.bytes,
      fileCount: r.fileCount,
      pngCount: r.pngCount,
      products: r.products,
      reportJson: r.reportJson,
      html: r.html,
      machineVerdict: r.machineVerdict || null,
      verdictTally: r.verdictTally || null,
      catalogVerdictTally: r.catalogVerdictTally || null,
      broken: r.broken,
      dir: r.runId, // 相对 root
      points: r.points,
    })),
  };

  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(manifest, null, 2) + "\n", "utf8");

  out("");
  out(`合计：${totals.runs} 个 run · ${totals.points} 个画面点 · ${totals.pngs} 张 PNG · ${human(totals.bytes)}`);
  out(
    `  构成：report.json ${human(totals.reportJsonBytes)}（紧凑化后 ${human(totals.reportJsonCompactBytes)}）· ` +
      `report.html ${human(totals.htmlBytes)} · PNG ${human(totals.pngOnDiskBytes)}`
  );
  out(`机器判定：failed ${tallyAll.failed} / attention ${tallyAll.attention} / consistent ${tallyAll.consistent}`);
  out(
    `F-14 五态：pass ${catalogAll.pass} / fail ${catalogAll.fail} / blocked ${catalogAll.blocked} / ` +
      `unproven ${catalogAll.unproven} / unreachable ${catalogAll.unreachable}` +
      (catalogAll.none ? ` / 无裁定 ${catalogAll.none}` : "")
  );
  out("");
  out("体积推算（假设已在 manifest.estimate.basis 中写明）：");
  for (const s of estimate.scenarios) out(`  · ${pad(human(s.bytes), 10)} ${s.name}`);
  if (!estimate.scenarios.length) out("  （暂无「双产物」run，无法推算单点体积 —— 先跑一次 --product both）");
  out("");
  if (naming.legacyRuns.length) out(`⚠ 非标准命名 ${naming.legacyRuns.length} 个：${naming.legacyRuns.join(", ")}`);
  out(`✅ manifest 已写入 ${outFile}`);

  if (JSON_OUT) process.stdout.write(JSON.stringify(manifest, null, 2) + "\n");
}

// ---------------------------------------------------------------------------
// path（所有者抽查）
// ---------------------------------------------------------------------------
function cmdPath() {
  const root = path.resolve(opt("--root") || DEFAULT_ROOT);
  const manifestPath = path.join(root, MANIFEST_NAME);
  const want = posArgs[0];
  if (!want) {
    out("用法：node tools/evidence-manifest.cjs path <runId>[/<pointId>] [--root=<dir>]");
    out("");
    out("  <runId>            例如 boot-A-B");
    out("  <runId>/<pointId>  例如 boot-A-B/00-boot（只给一张：A｜B｜对比）");
    process.exitCode = 2;
    return;
  }
  const man = readJson(manifestPath);
  if (!man) {
    out(`❌ 找不到 manifest：${manifestPath}`);
    out("   先跑：node tools/evidence-manifest.cjs build");
    process.exitCode = 2;
    return;
  }
  const [runId, pointId] = want.split("/");
  const run = (man.runs || []).find((r) => r.runId === runId);
  if (!run) {
    out(`❌ manifest 里没有这个 run：${runId}`);
    out(`   现有：${(man.runs || []).map((r) => r.runId).join(", ")}`);
    process.exitCode = 1;
    return;
  }
  const abs = (rel) => path.resolve(root, run.dir, rel);
  const show = (label, absPath, bytes) => {
    out(`  ${pad(label, 8)}${absPath}${bytes === undefined ? "" : `  (${human(bytes)})`}`);
  };

  out(`PKRC 证据定位（B-12）`);
  out("=".repeat(70));
  out(`run  ：${run.runId}${run.legacy ? "（⚠ 非标准命名）" : ""}`);
  out(`场景 ：${run.scenario || "-"}  ${run.label || ""}`);
  out(`系统 ：${run.system || "-"}`);
  out("");

  if (!pointId) {
    out(`画面点 ${run.points.length} 个：`);
    for (const p of run.points) {
      const d = p.diff && p.diff.ratio !== null ? `${(p.diff.ratio * 100).toFixed(2)}%` : "无对比";
      out(`  ${pad(p.id, 24)}${pad(p.machineVerdict, 12)}diff ${pad(d, 9)}${human(p.bytes)}`);
    }
    out("");
    out(`抽查某一点：node tools/evidence-manifest.cjs path ${run.runId}/<pointId>`);
    return;
  }

  const pt = run.points.find((p) => p.id === pointId);
  if (!pt) {
    out(`❌ 这个 run 里没有画面点：${pointId}`);
    out(`   现有：${run.points.map((p) => p.id).join(", ")}`);
    process.exitCode = 1;
    return;
  }
  out(`画面点：${pt.id}   机器判定：${pt.machineVerdict}（${pt.verdictNote}）`);
  out("");
  for (const [pid, rel] of Object.entries(pt.images)) {
    const f = abs(rel);
    const exists = fs.existsSync(f);
    show(pid === "compare" ? "对比图" : pid, f, exists ? fs.statSync(f).size : undefined);
    if (!exists) out(`           ⚠ 文件不存在（可能被 prune 或未生成）`);
  }
  if (pt.diff) {
    out("");
    out(`像素：差异率 ${(pt.diff.ratio * 100).toFixed(3)}% · 平均绝对差 ${pt.diff.meanAbsDiff}` +
      (pt.diff.bbox ? ` · 差异包围盒 ${pt.diff.bbox.w}×${pt.diff.bbox.h}@(${pt.diff.bbox.x},${pt.diff.bbox.y})` : ""));
  }
  out("");
  out("⚠ machineVerdict 只覆盖机器可判部分；最终裁定由 E-3 按「断言 → diff → AI」给出。");
}

// ---------------------------------------------------------------------------
// prune（清理策略）
// ---------------------------------------------------------------------------
/**
 * `yyyyMMdd-HHmmss` → epoch 毫秒。非法/缺失返回 null。
 *
 * ⚠️ 必须换算成**同一量纲**再比较：早期版本直接把 14 字的日期串和 16 字的
 *    epoch-millis 字符串做字典序比较，等于在比两种不同的东西 ——
 *    legacy（用 mtime）会**莫名其妙地排到最旧**，清理时被优先删掉。
 */
function stampToMs(stamp) {
  const m = /^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})$/.exec(String(stamp || ""));
  if (!m) return null;
  return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]).getTime();
}

/**
 * 纯函数：决定「哪些 run 可以被清理」。**与删除动作分离** ——
 * 便于单测（本沙箱禁 spawn，只能进程内测），也避免「算错了就直接删」。
 *
 * 排序键统一为 epoch 毫秒：有时间戳用时间戳，没有的退回目录 mtime。
 *
 * @returns {{doomed:string[], protectedRuns:string[], keptCount:number}}
 */
function selectPrunable(runs, opts) {
  const keep = opts.keep === undefined ? null : opts.keep;
  const maxMb = opts.maxMb === undefined ? null : opts.maxMb;
  const maxDays = opts.maxDays === undefined ? null : opts.maxDays;
  const protect = opts.protect || [];

  const keyOf = (r) => {
    const s = stampToMs(r.stamp);
    return s !== null ? s : r._mtime || 0;
  };

  const sorted = runs.slice().sort((a, b) => keyOf(a) - keyOf(b));

  const doomed = new Set();
  if (keep !== null && Number.isInteger(keep) && keep >= 0) {
    for (const r of sorted.slice(0, Math.max(0, sorted.length - keep))) doomed.add(r.runId);
  }
  if (maxMb !== null && Number.isFinite(maxMb)) {
    const limit = maxMb * 1048576;
    let total = sorted.reduce((s, r) => s + r.bytes, 0);
    for (const r of sorted) {
      if (total <= limit) break;
      doomed.add(r.runId);
      total -= r.bytes;
    }
  }
  if (maxDays !== null && Number.isFinite(maxDays)) {
    const cutoff = Date.now() - maxDays * 86400000;
    for (const r of sorted) {
      const mt = r._mtime || 0;
      if (mt && mt < cutoff) doomed.add(r.runId);
    }
  }

  const protectedRuns = sorted.filter((r) => doomed.has(r.runId) && protect.includes(r.runId)).map((r) => r.runId);
  const doomedIds = sorted
    .filter((r) => doomed.has(r.runId) && !protect.includes(r.runId))
    .map((r) => r.runId);
  return { doomed: doomedIds, protectedRuns, keptCount: sorted.length - doomedIds.length };
}

function cmdPrune() {
  const root = path.resolve(opt("--root") || DEFAULT_ROOT);
  const keep = opt("--keep") !== undefined ? Number(opt("--keep")) : null;
  const maxMb = opt("--max-mb") !== undefined ? Number(opt("--max-mb")) : null;
  const maxDays = opt("--older-than") !== undefined ? Number(opt("--older-than")) : null;
  const protect = (opt("--protect") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const commit = flag("--commit");

  if (keep === null && maxMb === null && maxDays === null) {
    out("用法：node tools/evidence-manifest.cjs prune (--keep=<n> | --max-mb=<n> | --older-than=<天>）[--commit]");
    out("");
    out("  --keep=<n>        只保留最近 n 个 run");
    out("  --max-mb=<n>      总体积超限时，从最旧的开始删到不超限");
    out("  --older-than=<n>  删除 n 天前的 run");
    out("  --protect=<id,..> 保护指定的 run（按 runId，逗号分隔）不被删除");
    out("  --commit          实际删除（**默认 dry-run**）");
    out("");
    out("安全约束：只删 evidence 根下、名字匹配 ^[A-Za-z0-9._-]+$、且含 report.json（或 A/B 子目录）的目录；");
    out("         绝不删 manifest.json，绝不越过证据根。");
    process.exitCode = 2;
    return;
  }

  const { runs, error } = scanRuns(root);
  if (error) {
    out(`❌ ${error}`);
    process.exitCode = 2;
    return;
  }
  if (!runs.length) {
    out("（没有 run 可清理）");
    return;
  }

  // 排序键：优先 runId 里的时间戳，其次 mtime（升序 = 最旧在前）
  for (const r of runs) {
    try {
      r._mtime = fs.statSync(r.absDir).mtime.getTime();
    } catch {
      r._mtime = 0;
    }
  }

  const sel = selectPrunable(runs, { keep, maxMb, maxDays, protect });
  const byId = new Map(runs.map((r) => [r.runId, r]));
  const list = sel.doomed.map((id) => byId.get(id));
  const kept = sel.protectedRuns.map((id) => byId.get(id));
  const freed = list.reduce((s, r) => s + r.bytes, 0);

  out("PKRC 证据清理（B-12）");
  out("=".repeat(70));
  out(`证据根：${root}`);
  out(`现有  ：${runs.length} 个 run · ${human(runs.reduce((s, r) => s + r.bytes, 0))}`);
  out(`待删  ：${list.length} 个 run · 可释放 ${human(freed)}`);
  if (kept.length) out(`受保护：${kept.length} 个 run 因 --protect 被保留（${kept.map((r) => r.runId).join(", ")}）`);
  out("");
  if (!list.length) {
    out("（无需清理）");
    return;
  }
  for (const r of list) out(`  🗑️ ${pad(r.runId, 26)}${pad(human(r.bytes), 10)}${r.legacy ? "⚠ 非标准命名" : ""}`);
  out("");

  if (!commit) {
    out("（dry-run，未删除。加 --commit 执行）");
    return;
  }
  let ok = 0;
  let bad = 0;
  for (const r of list) {
    // 二次防护：绝不删 evidence 根、绝不删 manifest、绝不删非证据目录
    if (!r.absDir.startsWith(root + path.sep) || path.basename(r.absDir) === MANIFEST_NAME) {
      out(`  ❌ 拒绝删除（越界或受保护）：${r.absDir}`);
      bad++;
      continue;
    }
    if (r.safeName === false) {
      out(`  ❌ 拒绝删除（目录名含不安全字符）：${r.absDir}`);
      bad++;
      continue;
    }
    if (!fs.existsSync(path.join(r.absDir, "report.json")) && !fs.existsSync(path.join(r.absDir, "A")) && !fs.existsSync(path.join(r.absDir, "B"))) {
      out(`  ❌ 拒绝删除（不像证据包）：${r.absDir}`);
      bad++;
      continue;
    }
    try {
      fs.rmSync(r.absDir, { recursive: true, force: true });
      out(`  ✅ 已删除 ${r.runId}`);
      ok++;
    } catch (err) {
      out(`  ❌ 删除失败 ${r.runId}：${err.message}`);
      bad++;
    }
  }
  out("");
  out(`完成：删除 ${ok} 个 / 拒绝或失败 ${bad} 个 / 释放约 ${human(freed)}`);
  out("ℹ️ manifest.json 未更新 —— 请重跑 `build` 刷新索引。");
  if (bad) process.exitCode = 1;
}

// ---------------------------------------------------------------------------
// compact（体积治理：只对「机器判为一致」的点降采样）
// ---------------------------------------------------------------------------
async function cmdCompact() {
  const root = path.resolve(opt("--root") || DEFAULT_ROOT);
  const ratio = opt("--ratio") !== undefined ? Number(opt("--ratio")) : 2;
  const dropHtml = flag("--drop-html");
  const commit = flag("--commit");

  if (!Number.isFinite(ratio) || ratio < 1.2) {
    out(`❌ --ratio 必须是 ≥1.2 的数（收到 ${opt("--ratio")}）`);
    process.exitCode = 2;
    return;
  }

  const { runs, error } = scanRuns(root);
  if (error) {
    out(`❌ ${error}`);
    process.exitCode = 2;
    return;
  }

  let png;
  try {
    png = await import(pathToFileURL(path.join(REPO_ROOT, "tools", "walkthrough", "lib", "png.mjs")).href);
  } catch (err) {
    out(`❌ 无法加载 PNG 编解码器（tools/walkthrough/lib/png.mjs）：${err.message}`);
    out("   compact 依赖它做降采样；若该文件缺失，请先修好 F-10 的走查环境。");
    process.exitCode = 2;
    return;
  }

  const plan = [];
  let origBytes = 0;
  let newBytes = 0;
  let htmlBytes = 0;

  for (const r of runs) {
    for (const pt of r.points) {
      // 🔑 只降采样「机器判为一致」的点：failed / attention 的全帧必须留着给人看
      if (pt.machineVerdict !== "consistent") continue;
      for (const [label, rel] of Object.entries(pt.images || {})) {
        if (!/\.png$/i.test(rel)) continue;
        const f = path.join(r.absDir, rel);
        if (!fs.existsSync(f)) continue;
        plan.push({ runId: r.runId, point: pt.id, label, file: f, rel });
        origBytes += fs.statSync(f).size;
      }
    }
    if (dropHtml) {
      for (const h of r.html) {
        const f = path.join(r.absDir, h);
        if (fs.existsSync(f)) htmlBytes += fs.statSync(f).size;
      }
    }
  }

  out("PKRC 证据体积治理（B-12 · compact）");
  out("=".repeat(72));
  out(`证据根：${root}`);
  out(`规则  ：只对 machineVerdict=consistent 的画面点降采样（线性 ÷${ratio}）；`);
  out("        failed / attention 的全帧**原样保留** —— 那是需要人看的证据。");
  out("");
  out(`待处理：${plan.length} 张 PNG${dropHtml ? ` + ${htmlBytes ? human(htmlBytes) : "0 B"} 的 report.html` : ""}`);
  if (!plan.length && !dropHtml) {
    out("（没有可降采样的点 —— 要么全是 failed/attention，要么还没跑过双产物对比）");
    return;
  }

  for (const p of plan) {
    let buf;
    let img;
    try {
      buf = fs.readFileSync(p.file);
      img = png.decodePng(buf);
    } catch (err) {
      out(`  ⚠ 跳过（解码失败）${p.rel}：${err.message}`);
      continue;
    }
    const w = Math.max(1, Math.floor(img.width / ratio));
    const h = Math.max(1, Math.floor(img.height / ratio));
    const outBuf = png.encodePng(w, h, (x, y) => {
      const sx = Math.min(img.width - 1, x * ratio);
      const sy = Math.min(img.height - 1, y * ratio);
      const i = (sy * img.width + sx) * 4;
      return [img.data[i], img.data[i + 1], img.data[i + 2], img.data[i + 3]];
    });
    p.newSize = outBuf.length;
    newBytes += outBuf.length;
    if (commit) {
      fs.writeFileSync(p.file, outBuf);
    }
    out(`  ${commit ? "✅" : "·"} ${pad(p.runId, 22)}${pad(p.point, 20)}${pad(p.label, 8)}${human(buf.length)} → ${human(outBuf.length)}`);
  }

  out("");
  out(`PNG：${human(origBytes)} → ${human(newBytes)}` + (origBytes ? `（${((newBytes / origBytes) * 100).toFixed(1)}%）` : ""));
  if (dropHtml) out(`HTML：再释放 ${human(htmlBytes)}`);
  out(`合计释放约 ${human(origBytes - newBytes + htmlBytes)}`);

  if (!commit) {
    out("");
    out("（dry-run，未改动任何文件。加 --commit 执行）");
    out("⚠️ compact **有损**：降采样后原图不可恢复。只对已裁定完成的 run 执行。");
    return;
  }
  if (dropHtml) {
    for (const r of runs) {
      for (const h of r.html) {
        const f = path.join(r.absDir, h);
        if (fs.existsSync(f)) fs.rmSync(f, { force: true });
      }
    }
    out("");
    out("ℹ️ 已删除 report.html —— 它把图片 base64 内联，与降采样后的图不再一致；");
    out("   要复核请用 `manifest.json` + `path` 子命令（F-16 的报告生成器会重建可复核报告）。");
  }
  out("");
  out("ℹ️ 请重跑 `build` 刷新 manifest（体积与文件已变）。");
}

// ---------------------------------------------------------------------------
// help
// ---------------------------------------------------------------------------
function printHelp() {
  out(
    [
      "PKRC 走查证据包索引与治理（tools/evidence-manifest.cjs）· B-12",
      "",
      "用法：",
      "  node tools/evidence-manifest.cjs build   [--root=<dir>] [--out=<file>] [--diff-threshold=0.02]",
      "  node tools/evidence-manifest.cjs path    <runId>[/<pointId>] [--root=<dir>]",
      "  node tools/evidence-manifest.cjs prune   (--keep=<n> | --max-mb=<n> | --older-than=<天>) [--protect=id,..] [--commit]",
      "  node tools/evidence-manifest.cjs compact [--ratio=2] [--drop-html] [--commit]",
      "",
      "说明：",
      "  · manifest 以 report.json 为单一事实源（不重新扫图猜结构）",
      "  · machineVerdict 只覆盖机器可判部分，**不是** E-3 的最终裁定：",
      "      failed     任一产物未就绪或任一 check 失败        （决定性）",
      "      attention  checks 全过但像素差异 > 阈值            （需裁定）",
      "      consistent checks 全过且差异 ≤ 阈值                （仍需 E-3 签认）",
      "  · prune / compact 默认 dry-run；compact 有损（降采样后原图不可恢复）",
      "",
      "参数写法：--key=value 与 --key value 均可。",
    ].join("\n")
  );
}

// ---------------------------------------------------------------------------
// 入口
// ---------------------------------------------------------------------------
if (require.main === module) {
  (async function main() {
    switch (cmd) {
      case "build":
        cmdBuild();
        break;
      case "path":
        cmdPath();
        break;
      case "prune":
        cmdPrune();
        break;
      case "compact":
        await cmdCompact();
        break;
      case "help":
        printHelp();
        break;
      default:
        out(`未知子命令：${rawArgv[0]}（可用：build / path / prune / compact / help）`);
        process.exitCode = 2;
    }
  })().catch((err) => {
    process.stderr.write(`fatal: ${err && err.stack ? err.stack : err}\n`);
    process.exitCode = 1;
  });
}

module.exports = {
  scanRuns,
  parseRun,
  machineVerdict,
  selectPrunable,
  stampToMs,
  listFiles,
  MANIFEST_NAME,
  DEFAULT_ROOT,
  STD_RUN_RE,
};
