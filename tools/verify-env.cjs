/*
 * PKRC · B-6 构建环境校验 / 快照
 * ---------------------------------------------------------------------------
 * 目的：让「锚点树能否从零复现构建」变成**可机器校验**的事，而不是口头经验。
 *
 * 用法（默认在仓库根执行）：
 *   <node> tools/verify-env.cjs               # 校验当前环境 vs 快照
 *   <node> tools/verify-env.cjs --snapshot    # 生成 / 更新快照
 *   <node> tools/verify-env.cjs --json        # 机器可读输出
 *   <node> tools/verify-env.cjs --anchor=<dir>  # 指定锚点树（默认取快照内记录值）
 *
 * 依赖：**零外部依赖**（D3）。只读文件系统 + JSON。
 *
 * ⚠️ 设计选择：**不使用 child_process** 去问 `node --version` / `pnpm --version`。
 *    原因有二：
 *      ① 本沙箱曾出现 spawn 可执行文件 EBUSY（见 B-2 记录）；
 *      ② 能纯读文件得到的东西就不要起进程。
 *    → 版本一律**从 package.json / lockfile / node_modules 读取**。
 *    node 版本用 `process.version`（即运行本脚本的 node），单独标注。
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
  const snap = {
    _comment:
      "PKRC 锚点树构建环境快照（B-6）。本文件由 tools/verify-env.cjs --snapshot 生成，供 tools/verify-env.cjs 校验。入库。",
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
  };
  fs.mkdirSync(path.dirname(SNAPSHOT_PATH), { recursive: true });
  fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify(snap, null, 2) + "\n", "utf8");
  process.stdout.write(`✅ 快照已写入 ${SNAPSHOT_PATH}\n`);
  process.stdout.write(
    `   node ${snap.toolchain.node} / pnpm ${snap.toolchain.pnpm} / ` +
      `vite ${snap.toolchain.vite} / rolldown ${snap.toolchain.rolldown} / ts ${snap.toolchain.typescript}\n`
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

  if (!fs.existsSync(anchor)) {
    process.stderr.write(`锚点树不存在：${anchor}\n`);
    process.exitCode = 2;
    return;
  }

  const now = collect(anchor);
  let failed = 0;
  const fail = (msg) => {
    failed++;
    out(`  ❌ ${msg}`);
  };
  const ok = (msg) => out(`  ✅ ${msg}`);

  out("PKRC 锚点树构建环境校验（B-6）");
  out("=".repeat(68));
  out(`锚点树：${now.anchor}`);
  out(`快照  ：${snap.generatedAt}`);
  out("");

  // ① 关键文件哈希 —— 环境漂移的第一信号
  out("[1/6] 关键文件哈希");
  for (const f of KEY_FILES) {
    const a = snap.files[f];
    const b = now.files[f];
    if (b === null) fail(`${f} 不存在`);
    else if (a !== b) fail(`${f} 哈希不匹配（快照 ${String(a).slice(0, 12)}… ≠ 当前 ${String(b).slice(0, 12)}…）`);
    else ok(`${f}  ${String(b).slice(0, 16)}…`);
  }

  // ② 工具链版本
  out("[2/6] 工具链版本");
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
  out("[3/6] node_modules");
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
  out("[4/6] 原生二进制");
  for (const b of NATIVE_BINDINGS) {
    const hit = (now.nativeBindings || []).find((x) => x.name === b.name);
    if (hit && hit.present) ok(`${b.name} 就位`);
    else fail(`${b.name} 缺失 —— vite 8 构建会在启动时崩`);
  }

  // ⑤ 必需目录（B-5 踩过的坑：删掉 assets/ 直接让构建失败）
  out("[5/6] 必需目录");
  for (const d of REQUIRED_DIRS) {
    const info = now.dirs[d.name];
    if (!info || !info.exists) fail(`${d.name}/ 不存在 —— ${d.why}`);
    else if (info.jsonFiles < d.minJson)
      fail(`${d.name}/ 仅 ${info.jsonFiles} 个 JSON（期望 ≥ ${d.minJson}）`);
    else ok(`${d.name}/  ${info.jsonFiles} 个 JSON`);
  }

  // ⑥ 回归护栏：降级配置不得回到根目录（否则 tsc 立挂）
  out("[6/6] 回归护栏：降级配置不在根目录");
  let guardOk = true;
  for (const f of MUST_BE_ABSENT_FROM_ROOT) {
    if (fs.existsSync(path.join(anchor, f))) {
      fail(`${f} 出现在锚点树根目录 —— tsconfig include 会扫到它，tsc 必报 TS2307`);
      guardOk = false;
    }
  }
  if (guardOk) ok(`归档路径完好（应位于 _degraded-configs/）`);

  // 汇总
  out("");
  out("-".repeat(68));
  if (failed === 0) {
    out("✅ 环境校验通过：与快照一致，可复现构建。");
    out("");
    out("复现构建：");
    out("  node node_modules/typescript/bin/tsc --noEmit     # 预期 EXIT=0");
    out("  node node_modules/vite/bin/vite.js build          # 预期 ✓ built in ~28s");
  } else {
    out(`❌ ${failed} 项未通过。`);
    out("");
    out("常见修复：");
    out("  · 关键文件哈希不符 → 用上游原文覆盖 package.json / pnpm-lock.yaml（见环境搭建文档 §三）");
    out("  · .pnpm 包数不符   → pnpm install --frozen-lockfile --ignore-scripts");
    out("  · assets/ 缺失     → mkdir -p assets（构建插件需要该目录存在）");
    process.exitCode = 1;
  }

  if (JSON_OUT) {
    process.stdout.write(
      JSON.stringify(
        { snapshot: SNAPSHOT_PATH, anchor: now.anchor, failed, current: now },
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
