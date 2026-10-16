/*
 * PKRC · B-6/B-10 构建环境 + 走查环境校验 / 快照
 * ---------------------------------------------------------------------------
 * 目的：让「锚点树能否从零复现构建」和「F-10 走查环境能否从零复现」变成
 *       **可机器校验**的事，而不是口头经验。
 *
 * 用法（默认在仓库根执行）：
 *   <node> tools/verify-env.cjs               # 校验当前环境 vs 快照
 *   <node> tools/verify-env.cjs --snapshot    # 生成 / 更新快照
 *   <node> tools/verify-env.cjs --json        # 机器可读输出
 *   <node> tools/verify-env.cjs --anchor=<dir>  # 指定锚点树（默认取快照内记录值）
 *   <node> tools/verify-env.cjs --wt-only     # 只校验走查环境（证据机不必装锚点树）
 *
 * ⚠️ 本脚本必须用**能跑走查的那个 Node**（≥22）执行，否则 [7/7] 的
 *    `WebSocket` 能力检查会失败 —— 那不是环境坏，是解释器选错了。
 *
 * 依赖：**零外部依赖**（D3）。只读文件系统 + JSON。
 *
 * ⚠️ 设计选择：**不使用 child_process** 去问 `node --version` / `pnpm --version`。
 *    原因有三：
 *      ① 本沙箱曾出现 spawn 可执行文件 EBUSY（见 B-2 记录）；
 *      ② 能纯读文件得到的东西就不要起进程；
 *      ③ Windows 上 `msedge.exe` / `chrome.exe` 是**启动器存根**——
 *         `--version` 无输出（B-10 实测：EXIT=0、零输出），spawn 根本问不出来。
 *    → 版本一律**从 package.json / lockfile / node_modules / 安装目录名读取**。
 *      node 版本用 `process.version`（即运行本脚本的 node），单独标注。
 *      浏览器版本用 `Application/<x.y.z.w>/` 目录名 —— 这是**唯一**可靠的零 spawn 来源。
 *
 * 语法上限：遵守项目约定（Node 16 可跑）。禁顶层 await、structuredClone、findLast。
 */

"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// ---------------------------------------------------------------------------
// 常量
// ---------------------------------------------------------------------------
const REPO_ROOT = path.resolve(__dirname, "..");

/** 默认锚点树路径（相对仓库根） */
const DEFAULT_ANCHOR = path.join(
  ".build-tools",
  "tarball-src",
  "pokerogue-90df65097b6df76f713e6bd108afa84499e8b993"
);

/** 快照文件（**入库**，供他人校验） */
const SNAPSHOT_PATH = path.join(REPO_ROOT, "docs", "sourcemigration", "构建环境快照.json");

/**
 * 参与哈希比对的**关键文件**（相对锚点树根）。
 * 只列「改了就说明环境漂移」的文件，不列全量源码。
 */
const KEY_FILES = ["package.json", "pnpm-lock.yaml", "vite.config.ts", "tsconfig.json"];

/**
 * 必需存在的**原生二进制**（rolldown 的 Windows 绑定）。
 * 缺了它 vite 8 构建会在启动时崩，而 `pnpm install` 不一定报错（optionalDependencies 语义）。
 */
const NATIVE_BINDINGS = [
  {
    name: "rolldown (win32-x64)",
    dir: path.join(
      "node_modules", ".pnpm",
      "@rolldown+binding-win32-x64-msvc@1.0.0-rc.17", "node_modules",
      "@rolldown", "binding-win32-x64-msvc"
    ),
    mustContainSuffix: ".node",
  },
];

/**
 * 必需存在的目录（**可为空，但必须存在**）。
 * 背景：`minify-public-json-files` 插件对 `assets/` 与 `locales/` 做 `fs.readdirSync`，
 *       目录不存在会抛 ENOENT 让构建**失败**。这是 B-5 踩过的坑。
 */
const REQUIRED_DIRS = [
  { name: "assets", why: "json 压缩插件 readdirSync 目标；缺目录 → 构建 ENOENT", minJson: 0 },
  { name: "locales", why: "同上；且需含语言包 JSON", minJson: 1000 },
];

/**
 * 「必须不在锚点树根目录」的文件 —— 回归护栏。
 *
 * 背景：vite 7 时代的降级配置依赖已被移除的 `vite-tsconfig-paths`；
 * 它们若回到根目录，`tsc` 会因 tsconfig `include: ["*.ts", ...]` 立刻报 TS2307。
 * B-5 已将它们归档到 `_degraded-configs/`，这里防止有人误搬回来。
 */
const MUST_BE_ABSENT_FROM_ROOT = ["vite.config.a313.ts", "vite.config.rollup.ts"];

// ---------------------------------------------------------------------------
// 走查环境（F-10）—— B-10 新增
// ---------------------------------------------------------------------------
/**
 * 为什么走查环境要单独校验：
 *   构建环境的失效是**响亮**的（tsc/vite 立刻报错）；
 *   走查环境的失效是**安静**的（浏览器找不到、Node 没有 WebSocket ⇒ 跑不起来或空跑）。
 *   安静失效更需要机器校验。
 *
 * 三个必要条件：
 *   ① 运行器 Node ≥ 22（`globalThis.WebSocket` 从 Node 22 起内置；
 *      `shared/runtime/node.exe` 是 16.16.0，**不能**用来跑走查）；
 *   ② 一个 Chromium 内核浏览器（Edge 或 Chrome，headless 可用）；
 *   ③ A / B 两个产物目录存在（O-9b 要求双产物对比）。
 */
const WT_DIR = path.join(REPO_ROOT, "tools", "walkthrough");

/** 走查运行器所需的最低 Node 主版本（依据：globalThis.WebSocket 内置起点） */
const WT_MIN_NODE_MAJOR = 22;

/**
 * A/B 产物根（相对仓库根）。
 * ⚠️ 这里是 `tools/walkthrough/lib/products.mjs` 的**契约副本**，用于校验前置条件。
 *    两份不一致时以 products.mjs 为准（那里是运行时真源），本表只做存在性检查。
 */
const WT_PRODUCTS = [
  { id: "A", label: "modder 原产物", rel: "game/server/dist.modder-backup-20261016" },
  { id: "B", label: "自构建产物", rel: "game/server/dist" },
];

/** 走查依赖的**仓内**模块（非 npm 包） */
const WT_LOCAL_DEPS = [
  { rel: "tools/input-layer/input-arbiter.js", why: "input-smoke 场景复用 F-6 的键鼠仲裁语义" },
];

/** 兜底浏览器候选（当无法从 browser.mjs 提取时使用） */
const BROWSER_FALLBACK = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
];

/**
 * 从 `tools/walkthrough/lib/browser.mjs` **原文**提取候选路径数组 —— 单一事实源。
 * 这样浏览器安装位置换了、或加了新候选，只需改 browser.mjs，本校验自动跟随，不会漂移。
 * @returns {{list:string[], from:string|null}}
 */
function browserCandidates() {
  try {
    const src = fs.readFileSync(path.join(WT_DIR, "lib", "browser.mjs"), "utf8");
    const block = src.match(/WIN_BROWSER_CANDIDATES\s*=\s*\[([\s\S]*?)\]/);
    if (block) {
      const list = [...block[1].matchAll(/["']([^"']+)["']/g)].map((m) => m[1]);
      if (list.length) return { list, from: "tools/walkthrough/lib/browser.mjs" };
    }
  } catch (e) {
    /* 落到兜底 */
  }
  return { list: BROWSER_FALLBACK, from: null };
}

/** 四段式版本号降序比较 */
function cmpVersionDesc(a, b) {
  const pa = String(a).split(".").map(Number);
  const pb = String(b).split(".").map(Number);
  for (let i = 0; i < 4; i++) {
    const x = pa[i] || 0;
    const y = pb[i] || 0;
    if (x !== y) return y - x;
  }
  return 0;
}

/**
 * 读浏览器版本 —— **零 spawn**。
 *
 * Chromium 系在 Windows 上把真实二进制放在 `.../Application/<x.y.z.w>/` 下设版本子目录，
 * 而 `Application/msedge.exe` 只是个启动器存根（`--version` 零输出，实测）。
 * ⇒ 版本号只能从**目录名**读。
 */
function browserVersion(file) {
  const appDir = path.dirname(file.replace(/\//g, path.sep));
  try {
    const v = fs
      .readdirSync(appDir, { withFileTypes: true })
      .filter((e) => e.isDirectory() && /^\d+\.\d+\.\d+\.\d+$/.test(e.name))
      .map((e) => e.name)
      .sort(cmpVersionDesc)[0];
    return v || null;
  } catch (e) {
    return null;
  }
}

/**
 * 扫描 `tools/walkthrough/**\/*.mjs` 的 import 说明符，验证**零 npm 依赖**。
 *
 * 为什么这条必须机器校验：「零依赖」正是 F-10 能在没有包管理器的项目里跑起来的原因
 * （playwright / puppeteer 装不进来）。一旦有人写了个 `import x from "some-npm-pkg"`，
 * 走查会在别人机器上直接挂，而且**只在跑的时候**才挂。
 *
 * 局限（如实）：只看**直接** import，不递归解析被引入的仓内文件。
 */
function walkthroughImports() {
  const files = [];
  (function walk(dir) {
    let ents;
    try {
      ents = fs.readdirSync(dir, { withFileTypes: true });
    } catch (e) {
      return;
    }
    for (const e of ents) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.isFile() && full.endsWith(".mjs")) files.push(full);
    }
  })(WT_DIR);

  const builtin = new Set();
  const relative = new Set();
  const external = [];
  for (const f of files) {
    let src;
    try {
      src = fs.readFileSync(f, "utf8");
    } catch (e) {
      continue;
    }
    const specs = new Set();
    for (const m of src.matchAll(/\bfrom\s*["']([^"']+)["']/g)) specs.add(m[1]);
    for (const m of src.matchAll(/\bimport\s*\(\s*["']([^"']+)["']\s*\)/g)) specs.add(m[1]);
    for (const m of src.matchAll(/^[ \t]*import\s*["']([^"']+)["']/gm)) specs.add(m[1]);
    for (const s of specs) {
      if (s.startsWith("node:")) builtin.add(s);
      else if (s.startsWith(".") || s.startsWith("/")) relative.add(s);
      else external.push({ file: path.relative(REPO_ROOT, f).replace(/\\/g, "/"), spec: s });
    }
  }
  return {
    mjsFiles: files.length,
    builtin: [...builtin].sort(),
    relative: [...relative].sort(),
    external,
  };
}

/** 采集走查环境 */
function collectWalkthrough() {
  const bc = browserCandidates();
  const tried = [];
  let found = null;
  const envOverride = process.env.PKRC_BROWSER || null;
  // ⚠️ 显式指定但不存在 —— 单独记下来。
  //    `lib/browser.mjs` 的候选顺序是 [explicit, PKRC_BROWSER, ...默认] 且**逐个试到第一个存在的**，
  //    所以指定错了它会**静默回退**到系统默认浏览器。
  //    后果：你以为在测 Chrome，实际测的是 Edge，证据包的来源标签是错的。
  //    这正是本项目反复踩过的那类「静默 fallback」bug，校验器必须把它顶出来。
  let envOverrideMissing = null;
  if (envOverride && !fs.existsSync(envOverride.replace(/\\/g, "/"))) envOverrideMissing = envOverride;

  for (const c of [envOverride, ...bc.list]) {
    if (!c) continue;
    const norm = c.replace(/\\/g, "/");
    const exists = fs.existsSync(norm);
    tried.push({ path: norm, exists, source: c === envOverride ? "PKRC_BROWSER" : "default" });
    if (exists) {
      found = { path: norm, source: c === envOverride ? "PKRC_BROWSER" : "default" };
      break;
    }
  }

  const runnerMajor = Number(process.version.replace(/^v/, "").split(".")[0]);
  return {
    runner: {
      node: process.version.replace(/^v/, ""),
      minNodeMajor: WT_MIN_NODE_MAJOR,
      majorOk: runnerMajor >= WT_MIN_NODE_MAJOR,
      hasWebSocket: typeof globalThis.WebSocket === "function",
      hasFetch: typeof globalThis.fetch === "function",
    },
    browser: {
      found: found ? found.path : null,
      source: found ? found.source : null,
      envOverride,
      envOverrideMissing,
      sourceOfCandidates: bc.from,
      version: found ? browserVersion(found.path) : null,
      tried,
    },
    imports: walkthroughImports(),
    localDeps: WT_LOCAL_DEPS.map((d) => ({
      rel: d.rel,
      why: d.why,
      exists: fs.existsSync(path.join(REPO_ROOT, d.rel)),
    })),
    dirs: WT_PRODUCTS.map((p) => ({
      id: p.id,
      label: p.label,
      rel: p.rel,
      exists: fs.existsSync(path.join(REPO_ROOT, p.rel)),
    })),
  };
}

// ---------------------------------------------------------------------------
// 工具
// ---------------------------------------------------------------------------
const argv = process.argv.slice(2);
const flag = (name) => argv.includes(name);
const opt = (name) => {
  const eq = argv.find((a) => a.startsWith(name + "="));
  if (eq !== undefined) return eq.slice(name.length + 1);
  const i = argv.findIndex((a) => a === name);
  if (i >= 0 && argv[i + 1] !== undefined && !argv[i + 1].startsWith("--")) return argv[i + 1];
  return undefined;
};

const JSON_OUT = flag("--json");
const lines = [];
function out(s) {
  if (!JSON_OUT) process.stdout.write(s + "\n");
  else lines.push(s);
}

function sha256(file) {
  try {
    return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
  } catch (e) {
    return null;
  }
}

/** 读 package.json 的 version 字段（纯 fs，不起进程） */
function pkgVersion(dir) {
  try {
    const p = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8"));
    return p.version || null;
  } catch (e) {
    return null;
  }
}

/**
 * 在 node_modules/.pnpm 下按**包名**找目录。
 *
 * pnpm 的包目录名格式是 `名字@版本` 或 `名字@版本_peer后缀`（如
 * `vite@8.0.10_@types+node@24.12.2_esbuild@0.27.3_yaml@2.8.3`），
 * 所以必须按 `名字@` 前缀匹配，不能精确拼字符串。
 *
 * ⚠️ 传参是**裸包名**（如 "rolldown"），不要自带 `@` —— 早期版本传了 `"rolldown@"`
 *    导致拼成 `rolldown@@` 匹配不到，`rolldown` 版本恒为 null。
 */
function findPnpmPkg(nodeModules, pkgName) {
  const base = path.join(nodeModules, ".pnpm");
  let entries;
  try {
    entries = fs.readdirSync(base);
  } catch (e) {
    return null;
  }
  const hit = entries.filter((e) => e.startsWith(pkgName + "@"));
  return hit.length ? path.join(base, hit[0]) : null;
}

/** 统计目录内（递归）指定后缀的文件数 */
function countFiles(root, suffix) {
  let n = 0;
  const stack = [root];
  while (stack.length) {
    const cur = stack.pop();
    let ents;
    try {
      ents = fs.readdirSync(cur, { withFileTypes: true });
    } catch (e) {
      continue;
    }
    for (const e of ents) {
      const full = path.join(cur, e.name);
      if (e.isDirectory()) stack.push(full);
      else if (e.isFile() && (!suffix || e.name.endsWith(suffix))) n++;
    }
  }
  return n;
}

// ---------------------------------------------------------------------------
// 采集：读锚点树当前环境
// ---------------------------------------------------------------------------
function collect(anchor) {
  const nm = path.join(anchor, "node_modules");
  let declaredPnpm = null;
  try {
    declaredPnpm = JSON.parse(fs.readFileSync(path.join(anchor, "package.json"), "utf8")).packageManager;
  } catch (e) {
    /* ignore */
  }
  let declaredNode = null;
  try {
    declaredNode = JSON.parse(fs.readFileSync(path.join(anchor, "package.json"), "utf8")).engines;
  } catch (e) {
    /* ignore */
  }

  const data = {
    anchor: anchor.replace(/\\/g, "/"),
    toolchain: {
      // node 用「运行本脚本的 node」，因为它就是实际执行校验/构建的那个解释器
      node: process.version.replace(/^v/, ""),
      nodeEngines: declaredNode && declaredNode.node ? declaredNode.node : null,
      pnpm: declaredPnpm ? declaredPnpm.replace(/^pnpm@/, "") : null,
      vite: pkgVersion(path.join(nm, "vite")),
      typescript: pkgVersion(path.join(nm, "typescript")),
      rolldown: null,
    },
    files: {},
    dirs: {},
    nativeBindings: [],
    nodeModules: {},
  };

  // rolldown 在 .pnpm 下（带 peer 后缀），按包名前缀查找
  const rl = findPnpmPkg(nm, "rolldown");
  if (rl) data.toolchain.rolldown = pkgVersion(path.join(rl, "node_modules", "rolldown"));

  for (const f of KEY_FILES) data.files[f] = sha256(path.join(anchor, f));

  try {
    data.nodeModules.topLevelEntries = fs.readdirSync(nm).length;
  } catch (e) {
    data.nodeModules.topLevelEntries = null;
  }
  try {
    data.nodeModules.pnpmPackages = fs.readdirSync(path.join(nm, ".pnpm")).length;
  } catch (e) {
    data.nodeModules.pnpmPackages = null;
  }

  for (const d of REQUIRED_DIRS) {
    const full = path.join(anchor, d.name);
    const exists = fs.existsSync(full);
    data.dirs[d.name] = {
      exists,
      jsonFiles: exists ? countFiles(full, ".json") : 0,
    };
  }

  for (const b of NATIVE_BINDINGS) {
    const full = path.join(anchor, b.dir);
    let ok = false;
    try {
      ok = fs.readdirSync(full).some((f) => f.endsWith(b.mustContainSuffix));
    } catch (e) {
      ok = false;
    }
    data.nativeBindings.push({ name: b.name, present: ok });
  }

  return data;
}

// ---------------------------------------------------------------------------
// 子命令：--snapshot
// ---------------------------------------------------------------------------
function cmdSnapshot(anchor) {
  const data = collect(anchor);
  const wt = collectWalkthrough();
  const snap = {
    _comment:
      "PKRC 环境快照（B-6 构建环境 + B-10 走查环境）。本文件由 tools/verify-env.cjs --snapshot 生成，" +
      "供 tools/verify-env.cjs 校验。入库。",
    generatedAt: new Date().toISOString(),
    upstreamAnchor: {
      repo: "pagefaultgames/pokerogue",
      commit: "90df65097b6d",
      note:
        "锚点树的 package.json 曾被 A1 人为降级（vite ^8.0.10 → ^7.3.1 并加 vite-tsconfig-paths）；" +
        "B-5 已复原为上游原文。可用 raw.githubusercontent.com 按 commit 取回。",
      sourceUrls: {
        "package.json":
          "https://raw.githubusercontent.com/pagefaultgames/pokerogue/90df65097b6d/package.json",
        "pnpm-lock.yaml":
          "https://raw.githubusercontent.com/pagefaultgames/pokerogue/90df65097b6d/pnpm-lock.yaml",
      },
    },
    toolchain: data.toolchain,
    files: data.files,
    nodeModules: data.nodeModules,
    nativeBindings: data.nativeBindings,
    dirs: data.dirs,
    walkthrough: wt,
  };
  fs.mkdirSync(path.dirname(SNAPSHOT_PATH), { recursive: true });
  fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify(snap, null, 2) + "\n", "utf8");
  process.stdout.write(`✅ 快照已写入 ${SNAPSHOT_PATH}\n`);
  process.stdout.write(
    `   构建：node ${snap.toolchain.node} / pnpm ${snap.toolchain.pnpm} / ` +
      `vite ${snap.toolchain.vite} / rolldown ${snap.toolchain.rolldown} / ts ${snap.toolchain.typescript}\n`
  );
  process.stdout.write(
    `   走查：node ${wt.runner.node}（WebSocket=${wt.runner.hasWebSocket ? "有" : "无"}）/ ` +
      `浏览器 ${wt.browser.found ? path.basename(wt.browser.found) + " " + (wt.browser.version || "?") : "未找到"} / ` +
      `产物 ${wt.dirs.filter((d) => d.exists).length}/${wt.dirs.length} / ` +
      `mjs ${wt.imports.mjsFiles} 个（npm 依赖 ${wt.imports.external.length} 处）\n`
  );
}

// ---------------------------------------------------------------------------
// 子命令：校验
// ---------------------------------------------------------------------------
function cmdVerify(anchor) {
  let snap;
  try {
    snap = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, "utf8"));
  } catch (e) {
    process.stderr.write(`找不到或无法解析快照：${SNAPSHOT_PATH}\n`);
    process.stderr.write("先跑：node tools/verify-env.cjs --snapshot\n");
    process.exitCode = 2;
    return;
  }

  // `--wt-only`：只校验走查环境。
  // 用途：一台只负责跑走查的机器（A4-01/A4-04 的证据机）不需要锚点树与 node_modules，
  //       不该被「锚点树不存在」挡住。
  const wtOnly = flag("--wt-only");

  if (!wtOnly && !fs.existsSync(anchor)) {
    process.stderr.write(`锚点树不存在：${anchor}\n`);
    process.stderr.write("  （只校验走查环境请加 --wt-only）\n");
    process.exitCode = 2;
    return;
  }

  const now = wtOnly ? { anchor: "(跳过)" } : collect(anchor);
  let failed = 0;
  const fail = (msg) => {
    failed++;
    out(`  ❌ ${msg}`);
  };
  const ok = (msg) => out(`  ✅ ${msg}`);

  out("PKRC 环境校验（B-6 构建环境 + B-10 走查环境）");
  out("=".repeat(68));
  out(`模式  ：${wtOnly ? "仅走查环境（--wt-only）" : "构建环境 + 走查环境"}`);
  out(`锚点树：${now.anchor}`);
  out(`快照  ：${snap.generatedAt}`);
  out("");

  if (wtOnly) {
    const wt = verifyWalkthrough(snap, fail, ok);
    return finishVerify(snap, { anchor: "(跳过)", walkthrough: wt }, failed, "wt");
  }

  // ① 关键文件哈希 —— 环境漂移的第一信号
  out("[1/7] 关键文件哈希");
  for (const f of KEY_FILES) {
    const a = snap.files[f];
    const b = now.files[f];
    if (b === null) fail(`${f} 不存在`);
    else if (a !== b) fail(`${f} 哈希不匹配（快照 ${String(a).slice(0, 12)}… ≠ 当前 ${String(b).slice(0, 12)}…）`);
    else ok(`${f}  ${String(b).slice(0, 16)}…`);
  }

  // ② 工具链版本
  out("[2/7] 工具链版本");
  for (const k of ["vite", "rolldown", "typescript"]) {
    const a = snap.toolchain[k];
    const b = now.toolchain[k];
    if (a === b) ok(`${k} ${b}`);
    else fail(`${k} 版本不符：快照 ${a} ≠ 当前 ${b}`);
  }
  // node 只在信息层面比对：快照记录的 node 未必是当前运行的这个
  if (snap.toolchain.node !== now.toolchain.node) {
    out(`  ℹ️ node 当前 ${now.toolchain.node}（快照记录 ${snap.toolchain.node}）—— 建议用 ${snap.toolchain.node} 复现`);
  } else {
    ok(`node ${now.toolchain.node}`);
  }
  if (snap.toolchain.pnpm !== now.toolchain.pnpm) {
    out(`  ℹ️ pnpm 声明 ${now.toolchain.pnpm}（快照 ${snap.toolchain.pnpm}）`);
  } else {
    ok(`pnpm ${now.toolchain.pnpm}（package.json 声明）`);
  }

  // ③ node_modules 规模
  //
  // ⚠️ 语义（实测教训）：**「少」才是问题，「多」是良性漂移**。
  //    pnpm 默认**不清理** `.pnpm` 里的孤儿包：A1 降级 vite 7 时代留下的
  //    `vite@7.3.1` / `vite-tsconfig-paths` 等条目会一直躺在 `.pnpm`，
  //    使计数虚高（实测 358），而**从零重装**得到的是 lockfile 的忠实结果（346）。
  //    → 因此仅在「当前 < 快照」时判失败（说明没装全），「当前 > 快照」只提示。
  out("[3/7] node_modules");
  const aN = snap.nodeModules || {};
  const bN = now.nodeModules || {};
  if (bN.pnpmPackages === null || bN.pnpmPackages === undefined) {
    fail(`node_modules/.pnpm 不存在 —— 未安装依赖（跑 pnpm install --frozen-lockfile --ignore-scripts）`);
  } else if (aN.pnpmPackages !== null && aN.pnpmPackages !== undefined && bN.pnpmPackages < aN.pnpmPackages) {
    fail(
      `.pnpm 包数 ${bN.pnpmPackages} < 快照 ${aN.pnpmPackages} —— 依赖可能没装全`
    );
  } else if (aN.pnpmPackages !== null && aN.pnpmPackages !== undefined && bN.pnpmPackages > aN.pnpmPackages) {
    ok(`.pnpm 包数 ${bN.pnpmPackages}（快照 ${aN.pnpmPackages}）`);
    out(`  ℹ️ 多出 ${bN.pnpmPackages - aN.pnpmPackages} 个 —— 通常是 .pnpm 里的历史孤儿包（pnpm 不自动清理），无害`);
    out(`     想归零：删掉 node_modules 后重装（pnpm install --frozen-lockfile --ignore-scripts）`);
  } else {
    ok(`.pnpm 包数 ${bN.pnpmPackages}`);
  }
  out(`  ℹ️ 顶层条目 ${bN.topLevelEntries}（快照 ${aN.topLevelEntries}）`);

  // ④ 原生二进制 —— 缺了它构建会崩，但 pnpm install 不一定报错
  out("[4/7] 原生二进制");
  for (const b of NATIVE_BINDINGS) {
    const hit = (now.nativeBindings || []).find((x) => x.name === b.name);
    if (hit && hit.present) ok(`${b.name} 就位`);
    else fail(`${b.name} 缺失 —— vite 8 构建会在启动时崩`);
  }

  // ⑤ 必需目录（B-5 踩过的坑：删掉 assets/ 直接让构建失败）
  out("[5/7] 必需目录");
  for (const d of REQUIRED_DIRS) {
    const info = now.dirs[d.name];
    if (!info || !info.exists) fail(`${d.name}/ 不存在 —— ${d.why}`);
    else if (info.jsonFiles < d.minJson)
      fail(`${d.name}/ 仅 ${info.jsonFiles} 个 JSON（期望 ≥ ${d.minJson}）`);
    else ok(`${d.name}/  ${info.jsonFiles} 个 JSON`);
  }

  // ⑥ 回归护栏：降级配置不得回到根目录（否则 tsc 立挂）
  out("[6/7] 回归护栏：降级配置不在根目录");
  let guardOk = true;
  for (const f of MUST_BE_ABSENT_FROM_ROOT) {
    if (fs.existsSync(path.join(anchor, f))) {
      fail(`${f} 出现在锚点树根目录 —— tsconfig include 会扫到它，tsc 必报 TS2307`);
      guardOk = false;
    }
  }
  if (guardOk) ok(`归档路径完好（应位于 _degraded-configs/）`);

  // ⑦ 走查环境（F-10）—— B-10 新增
  now.walkthrough = verifyWalkthrough(snap, fail, ok);

  return finishVerify(snap, now, failed, "all");
}

/**
 * [7/7] 走查环境校验（F-10）。
 *
 * @returns {object} 本次采集到的走查环境（供 JSON 输出）
 */
function verifyWalkthrough(snap, fail, ok) {
  const now = collectWalkthrough();
  const was = (snap && snap.walkthrough) || {};

  out("[7/7] 走查环境（F-10 · O-9 唯一授权的 GUI 实测路径）");

  // ① 运行器 Node 能力
  if (!now.runner.majorOk) {
    fail(
      `运行器 Node 是 ${now.runner.node}，低于走查要求的 ${now.runner.minNodeMajor} —— ` +
        `globalThis.WebSocket 从 Node 22 起才内置，CDP 客户端起不来`
    );
    out(`     ⇒ 换上 Node ≥ ${now.runner.minNodeMajor} 再跑本脚本与 tools/walkthrough/cli.mjs`);
    out("       ⚠️ shared/runtime/node.exe（16.16.0）**不能**用来跑走查，它只服务运行期");
  } else if (!now.runner.hasWebSocket || !now.runner.hasFetch) {
    fail(`Node ${now.runner.node} 缺少 globalThis.WebSocket / globalThis.fetch`);
  } else {
    ok(`运行器 node ${now.runner.node}（WebSocket ✓ / fetch ✓）`);
  }
  if (was.runner && was.runner.node && was.runner.node !== now.runner.node) {
    out(`  ℹ️ 快照记录的走查 Node 是 ${was.runner.node}，当前 ${now.runner.node}`);
  }

  // ② 浏览器
  if (now.browser.envOverrideMissing) {
    fail(`PKRC_BROWSER 指向的文件不存在：${now.browser.envOverrideMissing}`);
    out("     ⇒ browser.mjs 会**静默回退**到系统默认浏览器；你以为跑的是指定的那个，");
    out("       实际跑的是别的 —— 证据包会挂错来源。改对路径，或 unset PKRC_BROWSER。");
  }
  if (!now.browser.found) {
    fail("未找到 Chromium 内核浏览器（Edge / Chrome）—— 走查根本起不来");
    out("     ⇒ 装 Edge 或 Chrome，或用 PKRC_BROWSER=<exe 绝对路径> 指定");
    for (const t of now.browser.tried) out(`       试过：${t.path}`);
  } else {
    ok(
      `浏览器 ${now.browser.found}` +
        (now.browser.version ? `（${now.browser.version}）` : "（版本未读到）") +
        `  [来源：${now.browser.source}]`
    );
    if (now.browser.sourceOfCandidates) {
      out(`  ℹ️ 候选路径取自 ${now.browser.sourceOfCandidates}（单一事实源，不会与本校验漂移）`);
    } else {
      out("  ⚠️ 未能从 browser.mjs 提取候选路径，已退回内置兜底清单");
    }
    if (was.browser && was.browser.version && now.browser.version && was.browser.version !== now.browser.version) {
      out(`  ℹ️ 浏览器版本变了：快照 ${was.browser.version} → 当前 ${now.browser.version}`);
      out("     渲染细节可能随之变化 ⇒ 新旧证据包的像素差异率**不可直接比**");
    }
  }

  // ③ 零 npm 依赖（F-10 能跑起来的根本原因）
  if (now.imports.external.length) {
    fail(`走查代码引用了 ${now.imports.external.length} 处 npm 依赖 —— 「零依赖」被破坏`);
    for (const e of now.imports.external.slice(0, 8)) out(`       ${e.file}  →  ${e.spec}`);
    out("     ⇒ 本项目没有包管理器（playwright/puppeteer 装不进来），必须只用 node: 内置模块");
  } else {
    ok(
      `零 npm 依赖（扫描 ${now.imports.mjsFiles} 个 .mjs：node: 内置 ${now.imports.builtin.length} 种 + 相对路径 ${now.imports.relative.length} 种）`
    );
  }

  // ④ 仓内依赖 + A/B 产物
  for (const d of now.localDeps) {
    if (d.exists) ok(`仓内依赖就位 ${d.rel}`);
    else fail(`仓内依赖缺失 ${d.rel} —— ${d.why}`);
  }
  for (const d of now.dirs) {
    if (d.exists) ok(`产物 ${d.id}（${d.label}）就位：${d.rel}`);
    else
      fail(
        `产物 ${d.id}（${d.label}）缺失：${d.rel}` +
          (d.id === "A" ? "（A 是 O-9b 双产物对比的基准，缺它只能跑单产物）" : "")
      );
  }

  return now;
}

/**
 * 汇总 + JSON 输出。
 * @param {object} snap 快照
 * @param {object} ctx  当前环境（JSON 输出的 current 字段）
 * @param {number} failed 失败项数
 * @param {"all"|"wt"} mode 校验范围
 */
function finishVerify(snap, ctx, failed, mode) {
  out("");
  out("-".repeat(68));
  if (failed === 0) {
    if (mode === "wt") {
      out("✅ 走查环境校验通过：可复现 F-10 走查。");
      out("");
      out("复现走查（Node ≥22）：");
      out("  node tools/walkthrough/selftest.mjs                              # 自检 19/19");
      out("  node tools/walkthrough/cli.mjs --scenario boot --product both     # ★ A｜B 对比");
    } else {
      out("✅ 环境校验通过：与快照一致，可复现构建 **且** 可复现走查。");
      out("");
      out("复现构建（用构建期 Node 24）：");
      out("  node node_modules/typescript/bin/tsc --noEmit     # 预期 EXIT=0");
      out("  node node_modules/vite/bin/vite.js build          # 预期 ✓ built in ~28s");
      out("");
      out("复现走查（用走查期 Node ≥22，**不是** shared/runtime/node.exe）：");
      out("  node tools/walkthrough/selftest.mjs                              # 自检 19/19");
      out("  node tools/walkthrough/cli.mjs --scenario boot --product both     # ★ A｜B 对比");
    }
  } else {
    out(`❌ ${failed} 项未通过。`);
    out("");
    out("常见修复：");
    out("  · 关键文件哈希不符 → 用上游原文覆盖 package.json / pnpm-lock.yaml（见环境搭建文档 §三）");
    out("  · .pnpm 包数不符   → pnpm install --frozen-lockfile --ignore-scripts");
    out("  · assets/ 缺失     → mkdir -p assets（构建插件需要该目录存在）");
    out("  · 走查 Node 太低   → 换 Node ≥ 22 运行（shared/runtime/node.exe 是 16，不能用于走查）");
    out("  · 浏览器未找到     → 装 Edge/Chrome，或 PKRC_BROWSER=<exe 绝对路径>");
    out("  · A 产物缺失       → game/server/dist.modder-backup-20261016（O-9b 对比基准）");
    process.exitCode = 1;
  }

  if (JSON_OUT) {
    process.stdout.write(
      JSON.stringify(
        { snapshot: SNAPSHOT_PATH, mode, failed, current: ctx },
        null,
        2
      ) + "\n"
    );
  }
}

// ---------------------------------------------------------------------------
// 入口
// ---------------------------------------------------------------------------
(function main() {
  const anchorArg = opt("--anchor");
  let anchor = anchorArg ? path.resolve(REPO_ROOT, anchorArg) : path.join(REPO_ROOT, DEFAULT_ANCHOR);

  // 未显式指定时，优先采用快照里记录的锚点路径（防止仓库搬迁后失效）
  if (!anchorArg && fs.existsSync(SNAPSHOT_PATH)) {
    try {
      const s = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, "utf8"));
      if (s.anchor) anchor = path.resolve(REPO_ROOT, s.anchor);
    } catch (e) {
      /* ignore */
    }
  }

  if (flag("--snapshot")) return cmdSnapshot(anchor);
  return cmdVerify(anchor);
})();
