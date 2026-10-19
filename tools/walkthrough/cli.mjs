#!/usr/bin/env node
/**
 * PKRC · F-10 / F-14 自动化走查环境 · CLI 入口
 * ---------------------------------------------------------------------------
 * 用法：
 *   node tools/walkthrough/cli.mjs --list
 *   node tools/walkthrough/cli.mjs --systems                 # 列 F-12 走查目录（含 route 可靠性分布）
 *   node tools/walkthrough/cli.mjs --validate                # 🔹 静态自检：目录完整性（不启浏览器）
 *   node tools/walkthrough/cli.mjs --gates [--product both]  # 🔹 静态：两产物逐点闸门（不启浏览器）
 *
 *   node tools/walkthrough/cli.mjs --scenario boot --product B
 *   node tools/walkthrough/cli.mjs --scenario boot --product both   # A｜B 双产物对比（O-9b）
 *   node tools/walkthrough/cli.mjs --scenario sys-talent --product both   # 按系统走查（F-14）
 *   node tools/walkthrough/cli.mjs --scenario catalog --system talent --product both
 *   node tools/walkthrough/cli.mjs --scenario input-smoke --product both --strict
 *
 * 选项：
 *   --scenario <id>   场景 id（默认 boot）；`sys-<系统>` = 按系统走查
 *   --system  <id>    catalog 场景的系统 id（见 --systems）
 *   --product  <id>   A | B | both（默认 B）
 *   --out <dir>       证据输出目录（默认 tools/walkthrough/evidence/<scenario>-<ts>）
 *   --inject <file>   存档注入：JSON 文件（{ localStorage 键值对 }）或直接 JSON 串
 *   --timeout <ms>    就绪等待上限（默认 30000）
 *   --strict          任一检查项失败即退出码 1
 *   --quiet           只输出结论
 *   --list            列出场景 ｜ --systems  列出 F-12 走查目录
 *   --validate        静态自检（F-14 验收 ①）
 *   --gates           静态闸门探测（F-14：产物里到底有没有这些画面）
 *
 * 这是 O-9 授权的**唯一验收路径**：A4-01 / A4-04 直接消费本命令产出的证据包。
 */

import fs from "node:fs";
import path from "node:path";
import { runProductScenario, runDualScenario, scenarioMeta } from "./lib/runner.mjs";
import { listScenarios, getScenario, SCENARIOS } from "./scenarios/index.mjs";
import { CATALOG, listSystems, catalogStats, allPoints } from "./scenarios/catalog.mjs";
import { probeCatalog, summarizeProbe, productCorpus } from "./lib/gates.mjs";
import { JUDGEMENTS, judgementStats } from "./lib/judgement.mjs";
import { writeHtmlReport } from "./lib/report.mjs";

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  console.log(fs.readFileSync(new URL(import.meta.url), "utf8").split("*/")[0].replace(/^\/\*\*?/, ""));
  process.exit(0);
}

if (args.list) {
  console.log("可用场景：");
  for (const s of listScenarios()) console.log(`  ${s.id.padEnd(20)} ${s.system.padEnd(30)} ${s.label}`);
  console.log("\n（`catalog` 场景需配 --system，见 --systems；`sys-*` 为按系统别名）");
  process.exit(0);
}

if (args.systems) {
  const st = catalogStats();
  console.log(`F-12 走查目录：${st.systems} 组 / ${st.total} 个画面点（verified ${st.verified} · designed ${st.designed}）`);
  console.log(`route 可靠性：verified ${st.byReliability.verified} · derived ${st.byReliability.derived} · unknown ${st.byReliability.unknown}`);
  console.log(`闸门：${st.gated} 点已声明 gate · ${st.ungated} 点无 gate（默认可达）\n`);
  console.log("  --system <id>      代号          点数  derived unknown  场景 id            名称");
  for (const s of listSystems()) {
    console.log(
      `  ${s.id.padEnd(18)} ${String(s.code).padEnd(14)} ${String(s.points).padStart(3)}  ${String(s.derived).padStart(7)} ${String(s.unknown).padStart(7)}  ${("sys-" + s.id).padEnd(18)} ${s.label}`,
    );
  }
  process.exit(0);
}

// ---------------------------------------------------------------------------
// --validate：目录完整性静态自检（F-14 验收 ①「覆盖全部可截图点」，不启浏览器）
// ---------------------------------------------------------------------------
if (args.validate) {
  const problems = [];
  const warn = [];
  const points = allPoints();

  // 1) id 唯一
  const seen = new Set();
  for (const p of points) {
    if (seen.has(p.id)) problems.push(`重复的 point id：${p.id}`);
    seen.add(p.id);
  }

  // 2) 每个点必有 route（数组）+ routeReliability
  const RELIABILITY = new Set(["verified", "derived", "unknown"]);
  for (const p of points) {
    if (!Array.isArray(p.route)) problems.push(`${p.id}：缺 route 数组`);
    else if (p.route.length === 0 && p.routeReliability !== "verified") {
      problems.push(`${p.id}：route 为空，但 routeReliability=${p.routeReliability}（非 verified 的空 route 等于「假实现」）`);
    }
    if (!RELIABILITY.has(p.routeReliability)) problems.push(`${p.id}：routeReliability 非法（${p.routeReliability}）`);
    if (!p.arrival) problems.push(`${p.id}：缺 arrival 描述`);
  }

  // 3) U-11 判定条目双向对齐
  const jKeys = Object.keys(JUDGEMENTS);
  for (const p of points) if (!JUDGEMENTS[p.id]) problems.push(`${p.id}：U-11（lib/judgement.mjs）无对应判定条目`);
  for (const key of jKeys) if (!seen.has(key)) problems.push(`${key}：U-11 有条目，但 catalog 无此画面点（孤儿判定）`);

  // 4) 每个系统都有独立场景
  for (const sys of CATALOG) {
    if (!SCENARIOS[`sys-${sys.id}`]) problems.push(`系统 ${sys.id}：缺按系统场景 sys-${sys.id}`);
  }

  // 5) 无 gate 的点给个提示（不阻断）
  for (const p of points) if (!p.gate) warn.push(`${p.id}：未声明 gate（默认可达 —— 若实际不可达，走查会记 unreached）`);

  const st = catalogStats();
  const js = judgementStats();
  console.log("== F-14 目录静态自检 ==");
  console.log(`画面点：${st.total}（系统 ${st.systems}）｜ U-11 判定条目：${js.points}`);
  console.log(`路由可靠性：verified ${st.byReliability.verified} · derived ${st.byReliability.derived} · unknown ${st.byReliability.unknown}`);
  console.log(`闸门覆盖：${st.gated}/${st.total} 点已声明`);
  console.log(`按系统场景：${CATALOG.filter((s) => SCENARIOS[`sys-${s.id}`]).length}/${CATALOG.length}`);
  console.log("");
  if (warn.length) {
    console.log(`提示（${warn.length}）：`);
    for (const w of warn) console.log("  · " + w);
    console.log("");
  }
  if (problems.length) {
    console.error(`❌ 不通过：${problems.length} 项`);
    for (const p of problems) console.error("  ✗ " + p);
    process.exit(1);
  }
  console.log("✅ 通过：目录完整（覆盖全部可截图点 · 每点有可执行 route · 与 U-11 判定一一对应 · 每系统有独立场景）");
  process.exit(0);
}

// ---------------------------------------------------------------------------
// --gates：静态闸门探测（不启浏览器；直接读产物 JS）
// ---------------------------------------------------------------------------
if (args.gates) {
  const which = args.product && args.product !== "both" ? [String(args.product).toUpperCase()] : ["A", "B"];
  const probes = {};
  for (const id of which) probes[id] = probeCatalog(CATALOG, id);

  console.log("== 产物闸门探测（该画面在产物里有没有实现）==");
  for (const id of which) {
    const c = productCorpus(id);
    const s = summarizeProbe(probes[id]);
    console.log(`\n产物 ${id}：${c.files.map((f) => `${f.file}(${(f.size / 1024 / 1024).toFixed(1)}MB)`).join(" + ")}`);
    console.log(`  可渲染 ${s.present}/${s.total} · 阻塞 ${s.blocked}`);
  }

  const header = ["系统".padEnd(20), "点数".padStart(4), ...which.map((id) => `可渲染(${id})`.padStart(12))].join(" ");
  console.log("\n" + header);
  console.log("-".repeat(header.length + 6));
  for (let i = 0; i < CATALOG.length; i++) {
    const sys = CATALOG[i];
    const cells = which.map((id) => {
      const row = probes[id][i];
      return `${row.present}/${row.total}`.padStart(12);
    });
    console.log([sys.id.padEnd(20), String(sys.points.length).padStart(4), ...cells].join(" "));
  }

  // 逐点明细（只在单产物时打，避免刷屏）
  if (which.length === 1) {
    const id = which[0];
    console.log(`\n== 产物 ${id} 逐点 ==`);
    for (const row of probes[id]) {
      for (const p of row.points) {
        console.log(`  ${p.present ? "✓" : "⛔"} ${p.id.padEnd(32)} ${p.reason}`);
      }
    }
  }
  process.exit(0);
}

// ---------------------------------------------------------------------------
// 运行场景
// ---------------------------------------------------------------------------
const scenarioId = args.scenario || "boot";
const product = (args.product || "B").toString().toLowerCase();
const scenario = getScenario(scenarioId);
const ts = timestamp();
const outDir = path.resolve(args.out || path.join("tools/walkthrough/evidence", `${scenarioId}-${ts}`));
fs.mkdirSync(outDir, { recursive: true });

const options = { readyTimeoutMs: args.timeout ?? 30_000 };
if (args.system) options.system = args.system;
if (args.inject) options.injectLocalStorage = loadInject(args.inject);

const reproducible =
  `node tools/walkthrough/cli.mjs --scenario ${scenarioId} --product ${product === "both" ? "both" : product.toUpperCase()}` +
  (args.system ? ` --system ${args.system}` : "") +
  (args.inject ? ` --inject ${args.inject}` : "") +
  ` --out ${path.relative(process.cwd(), outDir).replace(/\\/g, "/")}`;

log(`场景：${scenarioId}「${scenario.label}」 ｜ 产物：${product.toUpperCase()}`);
log(`证据目录：${outDir}`);
log("");

let report;
let htmlPath;
let failed = 0;
let blocked = 0;

/** 统计一个产物结果的通过/失败/阻塞 */
function tallyChecks(checks) {
  let f = 0;
  let b = 0;
  for (const c of checks) {
    if (c.blocked) b++;
    else if (!c.pass) f++;
  }
  return { f, b };
}

if (product === "both") {
  report = await runDualScenario({ scenario, outDir, options });
  htmlPath = path.join(outDir, "report.html");
  writeHtmlReport(report, outDir, htmlPath);

  for (const id of ["A", "B"]) {
    const r = report.results[id];
    const t = tallyChecks(r.checks);
    failed += t.f;
    blocked += t.b;
    log(`── 产物 ${id}（${r.label}）`);
    log(`   就绪：${r.ready ? "是" : "否"}${r.readyMs != null ? `（${r.readyMs}ms）` : ""}`);
    if (r.error) log(`   ⚠️ 运行错误：${r.error}`);
    for (const c of r.checks) {
      const mark = c.blocked ? "⛔" : c.pass ? "✓" : "✗";
      log(`   ${mark} ${c.name}${c.detail ? " — " + c.detail : ""}`);
    }
  }
  log("");
  log("── 像素对比");
  for (const c of report.comparisons) {
    const d = c.diff || {};
    log(`   ${c.shot}: 差异率 ${d.error ? "N/A" : (d.diffRatio * 100).toFixed(2) + "%"}${d.bbox ? " 包围盒 " + JSON.stringify(d.bbox) : ""}`);
  }
  fs.writeFileSync(path.join(outDir, "report.json"), JSON.stringify(report, null, 2));
  printCatalogSummary(report);
} else {
  const r = await runProductScenario({ productId: product.toUpperCase(), scenario, outDir, options });
  report = { scenario: scenarioMeta(scenario), generatedAt: new Date().toISOString(), ...r };
  htmlPath = path.join(outDir, `report-${product.toUpperCase()}.html`);
  writeHtmlReport(report, outDir, htmlPath);

  const t = tallyChecks(r.checks);
  failed += t.f;
  blocked += t.b;
  log(`── 产物 ${r.productId}（${r.label}）`);
  log(`   就绪：${r.ready ? "是" : "否"}${r.readyMs != null ? `（${r.readyMs}ms）` : ""}`);
  if (r.error) log(`   ⚠️ 运行错误：${r.error}`);
  for (const c of r.checks) {
    const mark = c.blocked ? "⛔" : c.pass ? "✓" : "✗";
    log(`   ${mark} ${c.name}${c.detail ? " — " + c.detail : ""}`);
  }
  fs.writeFileSync(path.join(outDir, "report.json"), JSON.stringify(report, null, 2));
  printCatalogSummary(report);
}

log("");
log(`证据包：${outDir}`);
log(`  · 报告（HTML，可逐张复核）：${path.relative(process.cwd(), htmlPath).replace(/\\/g, "/")}`);
log(`  · 报告（机读 JSON）：${path.relative(process.cwd(), path.join(outDir, "report.json")).replace(/\\/g, "/")}`);
log(`可复跑命令：\n  ${reproducible}`);

if (failed > 0) log(`\n⚠️ 共 ${failed} 项检查未通过（详见报告）`);
if (blocked > 0) log(`⛔ 共 ${blocked} 项 blocked（该画面在本产物中无实现 ⇒ 迁移缺口，不计走查失败）`);

if (args.strict && failed > 0) process.exit(1);
process.exit(0);

// ---------------------------------------------------------------------------

/** catalog 四态裁定小结 */
function printCatalogSummary(rep) {
  const states = rep.results ? [rep.results.A, rep.results.B].filter(Boolean) : [rep];
  for (const s of states) {
    const cat = s.state?.catalog;
    if (!cat || !cat.counts) continue;
    const c = cat.counts;
    log("");
    log(`── 四态裁定 · ${s.productId} · 系统 ${cat.system}（${cat.label || ""}）`);
    log(`   pass ${c.pass} ｜ fail ${c.fail} ｜ unproven ${c.unproven ?? 0} ｜ unreached ${c.unreached} ｜ blocked ${c.blocked}（合计 ${cat.total ?? "-"}）`);
    for (const r of cat.records || []) {
      if (r.verdict === "pass") continue;
      log(`   · ${r.verdict.padEnd(9)} ${r.id}${r.reason ? " — " + r.reason : ""}`);
    }
  }
}

function parseArgs(argv) {
  const out = {};
  const camel = (s) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  for (let i = 0; i < argv.length; i++) {
    const raw = argv[i];
    if (!raw.startsWith("--")) continue;
    const eq = raw.indexOf("=");
    if (eq !== -1) {
      out[camel(raw.slice(2, eq))] = raw.slice(eq + 1);
    } else {
      const key = camel(raw.slice(2));
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith("--")) {
        out[key] = next;
        i++;
      } else {
        out[key] = true;
      }
    }
  }
  return out;
}

function loadInject(spec) {
  if (spec === true) throw new Error("--inject 需要一个文件路径或 JSON 串");
  if (fs.existsSync(spec)) return JSON.parse(fs.readFileSync(spec, "utf8"));
  return JSON.parse(spec);
}

function timestamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function log(m) {
  if (!args.quiet) console.log(m);
}
