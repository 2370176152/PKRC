/*
 * PKRC · B-13 通用回归一键化（tools/verify-all.cjs）
 * ---------------------------------------------------------------------------
 * 派单：`docs/delegation/32-第五阶段任务分发.md` §六 B-13（high，供 E-6 直接调用）
 *
 * 干什么：把散落的 7 套测试收敛成一条命令，任一失败即整体非零退出 + 汇总表。
 *
 * 为什么用**子进程**而不是进程内 require：
 *   ① 各套件自带 mini-runner 并设置 `process.exitCode`、打印自己的格式 ——
 *      进程内跑会互相污染状态（exitCode / 全局变量），且测不出"这套件真的独立能跑"；
 *   ② 子进程能拿到**真实退出码**与**真实耗时**，还能隔离崩溃（某套件 OOM/抛未捕获异常
 *      不会拖死 runner）。
 *   ⚠️ 本环境实测 `spawnSync` 可用（`status` 正确回传）；项目早期记录过的
 *      "spawn 可执行文件 EBUSY" 不适用于当前环境。若将来被禁，本工具会
 *      **明确报基础设施错误**（`spawn error: EBUSY`），不会伪装成"通过"。
 *
 * 🔑 解释器策略（**每条套件钉死它该用的 Node**，这是本工具最重要的设计）：
 *   本项目同时存在三个 Node（运行期 16 / 构建期 24 / 走查期 ≥22）。
 *   服务层的契约是「跑在**运行期 Node 16** 上」，所以必须用 `shared/runtime/node.exe` 跑，
 *   用 Node 24 跑它会**测不出** Node 16 语法问题。
 *   输入层是 ESM（`import`），Node 16 直接 SyntaxError ⇒ 必须 ≥22。
 *   ⇒ 不搞"随便找个 node 跑全部"，那样这个工具就只能证明"某处能跑"。
 *
 * 用法：
 *   <node> tools/verify-all.cjs                  # 跑全部
 *   <node> tools/verify-all.cjs --list           # 列出套件与解释器
 *   <node> tools/verify-all.cjs --only=server,input
 *   <node> tools/verify-all.cjs --skip=release
 *   <node> tools/verify-all.cjs --verbose        # 成功也打印套件输出
 *   <node> tools/verify-all.cjs --json           # 机读（供 E-6 / CI）
 *   <node> tools/verify-all.cjs --timeout=600    # 单套件超时（秒，默认 300）
 *
 * 语法上限：Node 16 可跑。依赖：零新增（fs / path / child_process）。
 */

"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const REPO_ROOT = path.resolve(__dirname, "..");
const RUNTIME_NODE = path.join(REPO_ROOT, "shared", "runtime", "node.exe");
const BUILD_NODE = path.join(REPO_ROOT, ".build-tools", "node-v24.9.0-win-x64", "node.exe");

// ---------------------------------------------------------------------------
// 参数
// ---------------------------------------------------------------------------
const ARGV = process.argv.slice(2);
const flag = (n) => ARGV.includes(n);
const opt = (n) => {
  const eq = ARGV.find((a) => a.startsWith(n + "="));
  if (eq !== undefined) return eq.slice(n.length + 1);
  const i = ARGV.findIndex((a) => a === n);
  if (i >= 0 && ARGV[i + 1] !== undefined && !ARGV[i + 1].startsWith("--")) return ARGV[i + 1];
  return undefined;
};
const list = (n) =>
  (opt(n) || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

const JSON_OUT = flag("--json");
const VERBOSE = flag("--verbose");
const TIMEOUT_MS = (opt("--timeout") ? Number(opt("--timeout")) : 300) * 1000;

const lines = [];
function out(s) {
  if (!JSON_OUT) process.stdout.write(s + "\n");
  else lines.push(s);
}
const pad = (s, n) => {
  s = String(s === undefined || s === null ? "-" : s);
  return s.length >= n ? s.slice(0, n) : s + " ".repeat(n - s.length);
};

// ---------------------------------------------------------------------------
// 套件表
// ---------------------------------------------------------------------------
/**
 * 每项字段：
 *   id        命令行里用的短名
 *   name      汇总表里的名字
 *   required  派单 §六 B-13 / §九 E-6 点名的五项为 true（契约）
 *   node      "runtime"(16) | "esm"(≥22)
 *   file      入口文件（相对仓库根）
 *   cwd       工作目录（相对仓库根）
 *   env       额外环境变量
 *   min       项数下限（**不许静默减少**；新增测试不必改，删测试必须改）
 *   countRe   从 stdout 提取项数的正则（各套件格式不同，如实适配）
 *   countAll  true = 把所有匹配相加（输入层分两个子套件打印）
 */
const SUITES = [
  {
    id: "server",
    name: "服务层 server.cjs",
    required: true,
    node: "runtime",
    file: "game/server/test-server.cjs",
    cwd: "game/server",
    env: { NODE_PATH: path.join(REPO_ROOT, "shared", "runtime", "node_modules") },
    min: 44, // 派单写的是 35（第一阶段口径）；B-11 加了 9 项 ⇒ 实际 44
    countRe: /总计\s*(\d+)\s*项/,
  },
  {
    id: "input",
    name: "输入层 input-layer",
    required: true,
    node: "esm",
    file: "tools/input-layer/run-tests.js",
    cwd: ".",
    min: 69,
    countRe: /全部通过：(\d+)\s*项/g,
    countAll: true,
  },
  {
    id: "gitignore",
    name: "gitignore 覆盖",
    required: true,
    node: "runtime",
    file: "tools/verify-gitignore.cjs",
    cwd: ".",
    min: 83,
    countRe: /总计：通过\s*(\d+)/,
  },
  {
    id: "lockfile",
    name: "依赖锁定",
    required: true,
    node: "runtime",
    file: "tools/verify-lockfile.cjs",
    cwd: ".",
    min: 11,
    countRe: /总计\s*(\d+)\s*项/,
  },
  {
    id: "release",
    name: "发布脚本",
    required: true,
    node: "runtime",
    file: "tools/test-release.cjs",
    cwd: ".",
    min: 62,
    countRe: /总计：(\d+)\s*通过/,
  },
  {
    id: "assets",
    name: "资产管线",
    required: false,
    node: "runtime",
    file: "tools/test-asset-pipeline.cjs",
    cwd: ".",
    min: 42,
    countRe: /总计：(\d+)\s*通过/,
  },
  {
    id: "evidence",
    name: "证据索引",
    required: false,
    node: "runtime",
    file: "tools/test-evidence-manifest.cjs",
    cwd: ".",
    min: 23,
    countRe: /总计：(\d+)\s*通过/,
  },
  {
    // 自身自测：证明「失败一定会被判失败」。不递归 —— 它跑的是注入的假脚本，
    // 不会再调 verify-all 本身。
    id: "verifyall",
    name: "回归门禁自测",
    required: false,
    node: "runtime",
    file: "tools/test-verify-all.cjs",
    cwd: ".",
    min: 13,
    countRe: /总计：(\d+)\s*通过/,
  },
  {
    // .prsv 编解码器（B-15）：已知答案向量 + OpenSSL 逐字节比对。
    // 真实存档用例在 .build-tools 不存在时按 skip 处理，故项数下限取不含真实样本的 21。
    id: "prsv",
    name: "prsv 编解码",
    required: false,
    node: "runtime",
    file: "tools/test-prsv.cjs",
    cwd: ".",
    min: 21,
    countRe: /总计：(\d+)\s*通过/,
  },
];

// ---------------------------------------------------------------------------
// 解释器解析
// ---------------------------------------------------------------------------
function nodeMajor(exe) {
  try {
    const r = spawnSync(exe, ["--version"], { encoding: "utf8", timeout: 20000 });
    if (r.error) return null;
    const m = /^v(\d+)\./.exec(String(r.stdout || "").trim());
    return m ? Number(m[1]) : null;
  } catch {
    return null;
  }
}

/** 解析出「每条套件该用哪个 node」。失败返回 {error}，由调用方决定怎么报。 */
function resolveInterpreters() {
  const map = {};
  const notes = [];

  // runtime：运行期 Node 16 —— 服务层契约就是它
  if (fs.existsSync(RUNTIME_NODE)) {
    map.runtime = RUNTIME_NODE;
    const v = nodeMajor(RUNTIME_NODE);
    notes.push(`runtime = ${path.relative(REPO_ROOT, RUNTIME_NODE).replace(/\\/g, "/")}（node ${v === null ? "?" : v}）`);
  } else {
    notes.push(`runtime = 缺失（${RUNTIME_NODE}）`);
  }

  // esm：需要 ≥22 的解释器。优先当前解释器，其次构建期 Node
  const candidates = [process.execPath, BUILD_NODE].filter((p) => p && fs.existsSync(p));
  let esm = null;
  for (const c of candidates) {
    const v = nodeMajor(c);
    if (v !== null && v >= 22) {
      esm = c;
      notes.push(`esm = ${path.relative(REPO_ROOT, c).replace(/\\/g, "/")}（node ${v}）`);
      break;
    }
  }
  if (esm) map.esm = esm;
  else notes.push("esm = 未找到 node ≥22（输入层是 ESM，Node 16 跑不了）");

  return { map, notes };
}

// ---------------------------------------------------------------------------
// 跑一套
// ---------------------------------------------------------------------------
function runSuite(s, interp) {
  // 允许绝对路径入口（测试注入用；正常套件都是仓库相对路径）
  const entry = path.isAbsolute(s.file) ? s.file : path.join(REPO_ROOT, s.file);
  const cwd = s.cwd && path.isAbsolute(s.cwd) ? s.cwd : path.resolve(REPO_ROOT, s.cwd || ".");
  const nodeExe = interp[s.node];
  const base = { id: s.id, name: s.name, required: s.required, nodeKind: s.node };

  if (!nodeExe) {
    return Object.assign(base, {
      status: "error",
      ms: 0,
      count: null,
      min: s.min,
      exit: null,
      error: `缺少 ${s.node} 解释器`,
      stdout: "",
      stderr: "",
    });
  }
  if (!fs.existsSync(entry)) {
    return Object.assign(base, {
      status: "error",
      ms: 0,
      count: null,
      min: s.min,
      exit: null,
      error: `入口文件不存在：${s.file}`,
      stdout: "",
      stderr: "",
    });
  }

  const env = Object.assign({}, process.env, s.env || {});
  const t0 = Date.now();
  const r = spawnSync(nodeExe, [entry], {
    cwd,
    env,
    encoding: "utf8",
    timeout: TIMEOUT_MS,
    maxBuffer: 64 * 1024 * 1024,
  });
  const ms = Date.now() - t0;

  if (r.error) {
    return Object.assign(base, {
      status: "error",
      ms,
      count: null,
      min: s.min,
      exit: null,
      error: `无法启动子进程：${r.error.code || r.error.message}`,
      stdout: r.stdout || "",
      stderr: r.stderr || "",
    });
  }

  const stdout = r.stdout || "";
  const stderr = r.stderr || "";
  let count = null;
  if (s.countRe) {
    const re = new RegExp(s.countRe.source, s.countRe.flags);
    if (s.countAll) {
      let total = 0;
      let hit = false;
      let m;
      while ((m = re.exec(stdout)) !== null) {
        total += Number(m[1]);
        hit = true;
      }
      count = hit ? total : null;
    } else {
      const m = re.exec(stdout);
      count = m ? Number(m[1]) : null;
    }
  }

  let status;
  if (r.signal) status = "timeout";
  else if (r.status !== 0) status = "fail";
  else if (count !== null && Number.isFinite(s.min) && count < s.min) status = "shrink"; // 项数减少 = 静默删测试
  else status = "pass";

  return Object.assign(base, { status, ms, count, min: s.min, exit: r.status, error: null, stdout, stderr });
}

// ---------------------------------------------------------------------------
// 主流程
// ---------------------------------------------------------------------------
function main() {
  const only = list("--only");
  const skip = list("--skip");

  if (flag("--help") || flag("-h")) {
    out(
      [
        "PKRC 通用回归（tools/verify-all.cjs）· B-13",
        "",
        "用法：",
        "  <node> tools/verify-all.cjs               跑全部套件（任一失败即非零退出）",
        "  <node> tools/verify-all.cjs --list        列出套件与所用解释器",
        "  <node> tools/verify-all.cjs --only=server,release",
        "  <node> tools/verify-all.cjs --skip=release",
        "  <node> tools/verify-all.cjs --verbose     成功也打印套件输出",
        "  <node> tools/verify-all.cjs --json        机读输出",
        "  <node> tools/verify-all.cjs --timeout=600 单套件超时（秒，默认 300）",
        "",
        "解释器策略（关键）：",
        "  服务层 → shared/runtime/node.exe（Node 16，运行期契约）",
        "  输入层 → node ≥22（ESM + globalThis.WebSocket 生态）",
        "  其余   → shared/runtime/node.exe（Node 16）",
        "",
        "判定：exit≠0 → fail；项数 < min → shrink（防静默删测试）；spawn 失败 → error",
      ].join("\n")
    );
    return 0;
  }

  const interp = resolveInterpreters();
  let selected = SUITES.filter((s) => (only.length ? only.includes(s.id) : true) && !skip.includes(s.id));

  if (only.length) {
    const unknown = only.filter((id) => !SUITES.some((s) => s.id === id));
    if (unknown.length) {
      process.stderr.write(`未知套件：${unknown.join(", ")}（可用：${SUITES.map((s) => s.id).join(", ")}）\n`);
      return 2;
    }
  }

  if (flag("--list")) {
    out("PKRC 通用回归 · 套件清单");
    out("=".repeat(80));
    out(`${pad("id", 12)}${pad("名字", 22)}${pad("解释器", 10)}${pad("下限", 6)}${pad("契约", 6)}入口`);
    out("-".repeat(80));
    for (const s of SUITES) {
      out(
        `${pad(s.id, 12)}${pad(s.name, 22)}${pad(s.node, 10)}${pad(s.min, 6)}${pad(s.required ? "★必需" : "可选", 6)}${s.file}`
      );
    }
    out("");
    out("解释器：");
    for (const n of interp.notes) out(`  · ${n}`);
    return 0;
  }

  if (!selected.length) {
    process.stderr.write("（没有选中任何套件）\n");
    return 2;
  }

  out("PKRC 通用回归（B-13）");
  out("=".repeat(80));
  for (const n of interp.notes) out(`解释器  ${n}`);
  out(`超时    ${TIMEOUT_MS / 1000}s/套件    共 ${selected.length} 套件`);
  out("");

  const results = [];
  for (const s of selected) {
    process.stdout.write(JSON_OUT ? "" : `▶ ${s.name} … `);
    const r = runSuite(s, interp.map);
    results.push(r);
    if (!JSON_OUT) {
      const tag =
        r.status === "pass"
          ? "✅"
          : r.status === "shrink"
            ? `⚠ 项数 ${r.count} < ${r.min}`
            : r.status === "timeout"
              ? "⏱ 超时"
              : r.status === "error"
                ? `⚠ ${r.error}`
                : `❌ exit ${r.exit}`;
      process.stdout.write(`${tag}  ${r.count === null ? "-" : `${r.count} 项`}  ${(r.ms / 1000).toFixed(1)}s\n`);
    }
    // 失败时把套件输出打出来 —— 否则只有一行"失败"，无法定位
    if (!JSON_OUT && r.status !== "pass" && r.status !== "shrink") {
      const body = (r.stdout + r.stderr).trim();
      if (body) {
        const tail = body.split("\n").slice(-40).join("\n");
        process.stdout.write(`  ┌─ ${s.id} 输出（末 40 行）\n`);
        for (const l of tail.split("\n")) process.stdout.write(`  │ ${l}\n`);
        process.stdout.write("  └─\n");
      }
    } else if (!JSON_OUT && VERBOSE) {
      const body = (r.stdout + r.stderr).trim();
      if (body) for (const l of body.split("\n")) process.stdout.write(`  │ ${l}\n`);
    }
  }

  // 汇总
  const bad = results.filter((r) => r.status !== "pass");
  const reqIds = new Set(SUITES.filter((s) => s.required).map((s) => s.id));
  const reqSelected = results.filter((r) => reqIds.has(r.id));
  const reqBad = reqSelected.filter((r) => r.status !== "pass");
  const totalCount = results.reduce((s, r) => s + (r.count || 0), 0);
  const totalMs = results.reduce((s, r) => s + r.ms, 0);

  out("");
  out("=".repeat(80));
  out("汇总");
  out("-".repeat(80));
  out(`${pad("id", 12)}${pad("名字", 22)}${pad("结果", 10)}${pad("项数", 6)}${pad("下限", 6)}${pad("耗时", 9)}说明`);
  out("-".repeat(80));
  for (const r of results) {
    const tag =
      r.status === "pass" ? "PASS" : r.status === "shrink" ? "SHRINK" : r.status === "timeout" ? "TIMEOUT" : r.status === "error" ? "ERROR" : "FAIL";
    out(
      `${pad(r.id, 12)}${pad(r.name, 22)}${pad(tag, 10)}${pad(r.count === null ? "-" : r.count, 6)}` +
        `${pad(r.min, 6)}${pad((r.ms / 1000).toFixed(1) + "s", 9)}` +
        (r.status === "shrink" ? `⚠ 项数减少（不许静默删测试）` : r.error ? r.error : "")
    );
  }
  out("-".repeat(80));
  out(`合计：${totalCount} 项 · 耗时 ${(totalMs / 1000).toFixed(1)}s`);
  out(
    `契约五项：${reqSelected.length - reqBad.length}/${reqSelected.length} 通过` +
      (reqBad.length ? `（失败：${reqBad.map((r) => r.id).join(", ")}）` : "")
  );
  out("");

  if (bad.length) {
    out(`❌ ${bad.length} 套件未通过：${bad.map((r) => r.id).join(", ")}`);
    out("   逐条修好再提交 —— 这个工具存在的意义就是「不许跳过」。");
  } else {
    out("✅ 全部通过。");
  }

  if (JSON_OUT) {
    process.stdout.write(
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          ok: bad.length === 0,
          totals: { count: totalCount, ms: totalMs, suites: results.length },
          contractual: { total: reqSelected.length, bad: reqBad.map((r) => r.id) },
          interpreters: interp.map,
          suites: results.map((r) => ({
            id: r.id,
            name: r.name,
            required: r.required,
            nodeKind: r.nodeKind,
            status: r.status,
            exit: r.exit,
            count: r.count,
            min: r.min,
            ms: r.ms,
            error: r.error,
            // 不输出完整 stdout（可能很大）；出错时给末 40 行
            outputTail: r.status === "pass" ? null : (r.stdout + r.stderr).trim().split("\n").slice(-40).join("\n"),
          })),
        },
        null,
        2
      ) + "\n"
    );
  }

  return bad.length ? 1 : 0;
}

if (require.main === module) {
  process.exitCode = main();
}

module.exports = { SUITES, resolveInterpreters, runSuite };
