#!/usr/bin/env node
/**
 * PKRC · F-10 自动化走查环境 · CLI 入口
 * ---------------------------------------------------------------------------
 * 用法：
 *   node tools/walkthrough/cli.mjs --list
 *   node tools/walkthrough/cli.mjs --systems
 *   node tools/walkthrough/cli.mjs --scenario boot --product B
 *   node tools/walkthrough/cli.mjs --scenario boot --product both   # A｜B 双产物对比（O-9b）
 *   node tools/walkthrough/cli.mjs --scenario catalog --system talent --product both
 *   node tools/walkthrough/cli.mjs --scenario input-smoke --product both --strict
 *
 * 选项：
 *   --scenario <id>   场景 id（默认 boot）
 *   --system  <id>    catalog 场景的系统 id（见 --systems）
 *   --product  <id>   A | B | both（默认 B）
 *   --out <dir>       证据输出目录（默认 tools/walkthrough/evidence/<scenario>-<ts>）
 *   --inject <file>   存档注入：JSON 文件（{ localStorage 键值对 }）或直接 JSON 串
 *   --timeout <ms>    就绪等待上限（默认 30000）
 *   --strict          任一检查项失败即退出码 1
 *   --quiet           只输出结论
 *   --list            列出场景 ｜ --systems  列出 F-12 走查目录
 *
 * 这是 O-9 授权的**唯一验收路径**：A4-01 / A4-04 直接消费本命令产出的证据包。
 */

import fs from "node:fs";
import path from "node:path";
import { runProductScenario, runDualScenario, scenarioMeta } from "./lib/runner.mjs";
import { listScenarios, getScenario } from "./scenarios/index.mjs";
import { listSystems, catalogStats } from "./scenarios/catalog.mjs";
import { writeHtmlReport } from "./lib/report.mjs";

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  console.log(fs.readFileSync(new URL(import.meta.url), "utf8").split("*/")[0].replace(/^\/\*\*?/, ""));
  process.exit(0);
}

if (args.list) {
  console.log("可用场景：");
  for (const s of listScenarios()) console.log(`  ${s.id.padEnd(14)} ${s.system.padEnd(22)} ${s.label}`);
  console.log("\n（`catalog` 场景需配 --system，见 --systems）");
  process.exit(0);
}

if (args.systems) {
  const st = catalogStats();
  console.log(`F-12 走查目录：${st.systems} 组 / ${st.total} 个画面点（verified ${st.verified} · designed ${st.designed}）\n`);
  console.log("  --system <id>      代号          点数  名称");
  for (const s of listSystems()) {
    console.log(`  ${s.id.padEnd(18)} ${String(s.code).padEnd(14)} ${String(s.points).padStart(3)}   ${s.label}`);
  }
  process.exit(0);
}

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
  `node tools/walkthrough/cli.mjs --scenario ${scenarioId} --product ${product}` +
  (args.inject ? ` --inject ${args.inject}` : "") +
  ` --out ${path.relative(process.cwd(), outDir).replace(/\\/g, "/")}`;

log(`场景：${scenarioId}「${scenario.label}」 ｜ 产物：${product}`);
log(`证据目录：${outDir}`);
log("");

let report;
let htmlPath;
let failed = 0;

if (product === "both") {
  report = await runDualScenario({ scenario, outDir, options });
  htmlPath = path.join(outDir, "report.html");
  writeHtmlReport(report, outDir, htmlPath);

  for (const id of ["A", "B"]) {
    const r = report.results[id];
    log(`── 产物 ${id}（${r.label}）`);
    log(`   就绪：${r.ready ? "是" : "否"}${r.readyMs != null ? `（${r.readyMs}ms）` : ""}`);
    if (r.error) log(`   ⚠️ 运行错误：${r.error}`);
    for (const c of r.checks) {
      if (!c.pass) failed++;
      log(`   ${c.pass ? "✓" : "✗"} ${c.name}${c.detail ? " — " + c.detail : ""}`);
    }
  }
  log("");
  log("── 像素对比");
  for (const c of report.comparisons) {
    const d = c.diff || {};
    log(`   ${c.shot}: 差异率 ${d.error ? "N/A" : (d.diffRatio * 100).toFixed(2) + "%"}${d.bbox ? " 包围盒 " + JSON.stringify(d.bbox) : ""}`);
  }
  fs.writeFileSync(path.join(outDir, "report.json"), JSON.stringify(report, null, 2));
} else {
  const r = await runProductScenario({ productId: product.toUpperCase(), scenario, outDir, options });
  report = { scenario: scenarioMeta(scenario), generatedAt: new Date().toISOString(), ...r };
  htmlPath = path.join(outDir, `report-${product.toUpperCase()}.html`);
  writeHtmlReport(report, outDir, htmlPath);

  log(`── 产物 ${r.productId}（${r.label}）`);
  log(`   就绪：${r.ready ? "是" : "否"}${r.readyMs != null ? `（${r.readyMs}ms）` : ""}`);
  if (r.error) log(`   ⚠️ 运行错误：${r.error}`);
  for (const c of r.checks) {
    if (!c.pass) failed++;
    log(`   ${c.pass ? "✓" : "✗"} ${c.name}${c.detail ? " — " + c.detail : ""}`);
  }
  fs.writeFileSync(path.join(outDir, "report.json"), JSON.stringify(report, null, 2));
}

log("");
log(`证据包：${outDir}`);
log(`  · 报告（HTML，可逐张复核）：${path.relative(process.cwd(), htmlPath).replace(/\\/g, "/")}`);
log(`  · 报告（机读 JSON）：${path.relative(process.cwd(), path.join(outDir, "report.json")).replace(/\\/g, "/")}`);
log(`可复跑命令：\n  ${reproducible}`);

if (failed > 0) log(`\n⚠️ 共 ${failed} 项检查未通过（详见报告）`);

if (args.strict && failed > 0) process.exit(1);
process.exit(0);

// ---------------------------------------------------------------------------

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
