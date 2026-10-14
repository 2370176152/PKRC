/*
 * PKRC · B-1 依赖锁定校验器（tools/verify-lockfile.cjs）
 * ---------------------------------------------------------------------------
 * 背景（派单 15 §五 B-1）：
 *   `game/package.json` 原用 `^4.19.2` / `^3.0.0`。在**离线便携环境**下，
 *   `^` 意味着「任何 4.x 都可被安装」→ 若 node_modules 与 manifest 不同步，
 *   行为会静默漂移；而无 lockfile 时甚至无法发现漂移。
 *
 * 本脚本做**三向一致性**校验：
 *   ① manifest  →  无浮动符（`^` / `~` / `x` / `*`），必须是精确版本
 *   ② manifest  ↔  lockfile  内嵌 manifest 完全一致（否则 `npm ci` 直接拒绝执行）
 *   ③ manifest  ↔  实际安装的 node_modules（若存在）
 *
 * 退出码：0 = 全部通过；1 = 有失败项；2 = 用法/环境错误
 *
 * 运行：
 *   node tools/verify-lockfile.cjs                 # 校验默认位置（game/）
 *   node tools/verify-lockfile.cjs --json          # 机器可读输出
 *   node tools/verify-lockfile.cjs --dir=game      # 指定 manifest 所在目录
 *   node tools/verify-lockfile.cjs --node-modules=shared/runtime/node_modules
 *
 * 设计取舍：
 *   - **不引入依赖**（D3）：只用 Node 内置 fs/path。semver  ranges 的判定
 *     用一条宽松正则（只抓浮动符），不做完整 semver 解析——本项目只有 2 个直接依赖，
 *     引入 semver 库属于杀鸡用牛刀。
 *   - **只读**：绝不修改任何文件，失败时给出明确的修复命令。
 */

"use strict";

const fs = require("fs");
const path = require("path");

const REPO_ROOT = path.resolve(__dirname, "..");

// ---------------------------------------------------------------------------
// 参数
// ---------------------------------------------------------------------------
const argv = process.argv.slice(2);
const opts = { json: false, dir: "game", nodeModules: null, quiet: false };
for (const a of argv) {
  if (a === "--json") opts.json = true;
  else if (a === "--quiet" || a === "-q") opts.quiet = true;
  else if (a.startsWith("--dir=")) opts.dir = a.slice(6);
  else if (a.startsWith("--node-modules=")) opts.nodeModules = a.slice(15);
  else if (a === "--help" || a === "-h") {
    process.stdout.write(
      [
        "依赖锁定校验器",
        "",
        "用法：node tools/verify-lockfile.cjs [选项]",
        "",
        "选项：",
        "  --json                     机器可读输出",
        "  --dir=<path>               manifest 所在目录（默认 game）",
        "  --node-modules=<path>      实际安装目录（默认 <dir>/../shared/runtime/node_modules）",
        "  -q, --quiet                只输出失败项",
        "  -h, --help                 显示帮助",
        "",
      ].join("\n"),
    );
    process.exit(0);
  }
}

const manifestDir = path.resolve(REPO_ROOT, opts.dir);
const manifestPath = path.join(manifestDir, "package.json");
const lockPath = path.join(manifestDir, "package-lock.json");
const nodeModulesDir = opts.nodeModules
  ? path.resolve(REPO_ROOT, opts.nodeModules)
  : path.resolve(manifestDir, "..", "shared", "runtime", "node_modules");

// ---------------------------------------------------------------------------
// 结果收集
// ---------------------------------------------------------------------------
const results = [];
let failedCount = 0;

function check(name, ok, detail, fix) {
  results.push({ name, ok: !!ok, detail: detail || "", fix: fix || "" });
  if (!ok) failedCount++;
  return ok;
}

function info(name, detail) {
  results.push({ name, ok: true, detail: detail || "", fix: "", kind: "info" });
}

// ---------------------------------------------------------------------------
// ① manifest 存在且可解析
// ---------------------------------------------------------------------------
let manifest = null;
try {
  manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  check("manifest 可解析", true, path.relative(REPO_ROOT, manifestPath));
} catch (err) {
  check("manifest 可解析", false, `${path.relative(REPO_ROOT, manifestPath)}: ${err.message}`);
}

const DEP_KINDS = ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"];

/** 抓浮动版本符。注意：只匹配「开头」的符，避免误伤 scope 包名里的字符。 */
function floatingRange(v) {
  if (typeof v !== "string") return "非字符串";
  if (/^[\^~]/.test(v)) return "以 ^ 或 ~ 开头";
  if (/^\d|[xX*]/.test(v) === false && /[xX*]/.test(v)) return "含 x/X/* 通配";
  if (v === "*" || v === "" || v === "latest") return "无约束";
  if (/\s/.test(v) && !/^\d/.test(v)) return "疑似范围表达式";
  return null;
}

if (manifest) {
  let depTotal = 0;
  for (const kind of DEP_KINDS) {
    const deps = manifest[kind];
    if (!deps) continue;
    for (const [name, range] of Object.entries(deps)) {
      depTotal++;
      const why = floatingRange(range);
      check(
        `${kind}.${name} = ${JSON.stringify(range)} 为精确版本`,
        !why,
        why || "精确版本",
        `改为 "4.19.2" 这类精确版本；同步更新 package-lock.json 的 packages[""].${kind}`,
      );
    }
  }
  if (depTotal === 0) {
    info("依赖数量", "manifest 未声明任何依赖（可能无需锁定）");
  }
}

// ---------------------------------------------------------------------------
// ② manifest ↔ lockfile 内嵌 manifest 一致
// ---------------------------------------------------------------------------
let lock = null;
if (fs.existsSync(lockPath)) {
  try {
    lock = JSON.parse(fs.readFileSync(lockPath, "utf8"));
    check("lockfile 可解析", true, path.relative(REPO_ROOT, lockPath));
  } catch (err) {
    check("lockfile 可解析", false, `${err.message}`);
  }
} else {
  check(
    "lockfile 存在",
    false,
    `未找到 ${path.relative(REPO_ROOT, lockPath)}`,
    "在 game/ 下执行 npm install --package-lock-only 生成（不落 node_modules）",
  );
}

if (manifest && lock) {
  const rootPkg = lock.packages && lock.packages[""];
  if (!rootPkg) {
    check("lockfile 含根条目", false, '缺少 lock.packages[""]');
  } else {
    // npm ci 的判据：lockfile 根条目的依赖集合必须与 manifest 完全一致
    for (const kind of DEP_KINDS) {
      const m = manifest[kind] || {};
      const l = rootPkg[kind] || {};
      const mKeys = Object.keys(m).sort();
      const lKeys = Object.keys(l).sort();
      const sameKeys = mKeys.length === lKeys.length && mKeys.every((k, i) => k === lKeys[i]);
      const sameVals = sameKeys && mKeys.every((k) => m[k] === l[k]);
      if (mKeys.length === 0 && lKeys.length === 0) continue;
      check(
        `lockfile 内嵌 manifest 的 ${kind} 与 package.json 一致`,
        sameVals,
        sameVals
          ? `${mKeys.length} 项一致`
          : `package.json={${mKeys.map((k) => `${k}@${m[k]}`).join(", ")}} vs lock={${lKeys
              .map((k) => `${k}@${l[k]}`)
              .join(", ")}}`,
        "手工同步两处，或重跑 npm install --package-lock-only",
      );
    }

    // 每个直接依赖都必须被 lockfile 锁定到某个具体版本
    for (const [name, range] of Object.entries(manifest.dependencies || {})) {
      const entry = lock.packages[`node_modules/${name}`];
      check(
        `lockfile 锁定 ${name}`,
        !!entry && !!entry.version,
        entry ? `${name}@${entry.version}` : "lockfile 中无此包",
        "重跑 npm install --package-lock-only",
      );
      if (entry && entry.version) {
        check(
          `${name} 锁定版本满足 manifest 约束`,
          satisfies(entry.version, range),
          `manifest=${range} lock=${entry.version}`,
          "若确实要升级，先改 manifest 再重生成 lockfile",
        );
      }
    }
  }

  // lockfileVersion：npm 7+ 为 3；版本过老会导致 npm ci 行为差异
  info("lockfileVersion", String(lock.lockfileVersion));

  // registry 提示：本项目曾用 npmmirror，需在文档中显式记录（可复现性）
  const registries = new Set();
  for (const p of Object.values(lock.packages || {})) {
    if (p && typeof p.resolved === "string") {
      const m = p.resolved.match(/^(https?:\/\/[^/]+)/);
      if (m) registries.add(m[1]);
    }
  }
  if (registries.size) {
    info("lockfile 使用的 registry", [...registries].join(", "));
  }
}

// ---------------------------------------------------------------------------
// ③ manifest ↔ 实际安装（便携 node_modules，若存在）
// ---------------------------------------------------------------------------
if (fs.existsSync(nodeModulesDir)) {
  info("已安装目录", `${path.relative(REPO_ROOT, nodeModulesDir)}（存在，执行比对）`);
  if (lock && lock.packages) {
    // 只校验**直接依赖**：传递依赖由 lockfile 负责，全量比对在离线便携环境下
    // 意义有限（且 node_modules 与 lockfile 的树结构可能因平台而异）。
    for (const [name, range] of Object.entries((manifest && manifest.dependencies) || {})) {
      const pkgJson = path.join(nodeModulesDir, name, "package.json");
      if (!fs.existsSync(pkgJson)) {
        check(`已安装 ${name}`, false, "node_modules 中不存在", "参见 game/README-启动.md 排错");
        continue;
      }
      let installed = null;
      try {
        installed = JSON.parse(fs.readFileSync(pkgJson, "utf8"));
      } catch {
        /* ignore */
      }
      const v = installed && installed.version;
      const locked = lock.packages[`node_modules/${name}`];
      check(
        `${name} 已安装版本 = lockfile 锁定版本`,
        !!v && !!locked && v === locked.version,
        `installed=${v} locked=${locked && locked.version}`,
        "便携 node_modules 与 lockfile 不同步；按 game/README-启动.md 重新装配",
      );
    }
  }
} else {
  info(
    "已安装目录",
    `${path.relative(REPO_ROOT, nodeModulesDir)}（不存在，跳过安装比对）—— 便携环境未装配 node_modules`,
  );
}

// ---------------------------------------------------------------------------
// 输出
// ---------------------------------------------------------------------------
function print() {
  if (opts.json) {
    process.stdout.write(
      JSON.stringify(
        {
          ok: failedCount === 0,
          checked: results.filter((r) => r.kind !== "info").length,
          failed: failedCount,
          results,
        },
        null,
        2,
      ) + "\n",
    );
    return;
  }

  const L = [];
  L.push("PKRC 依赖锁定校验");
  L.push("=".repeat(64));
  L.push(`manifest : ${path.relative(REPO_ROOT, manifestPath)}`);
  L.push(`lockfile : ${fs.existsSync(lockPath) ? path.relative(REPO_ROOT, lockPath) : "(不存在)"}`);
  L.push(`node_modules : ${path.relative(REPO_ROOT, nodeModulesDir)}${fs.existsSync(nodeModulesDir) ? "" : " (不存在)"}`);
  L.push("");

  for (const r of results) {
    if (r.kind === "info") {
      if (!opts.quiet) L.push(`  ·     ${r.name}: ${r.detail}`);
      continue;
    }
    const mark = r.ok ? "PASS" : "FAIL";
    L.push(`  ${mark}  ${r.name}`);
    if (!r.ok || !opts.quiet) L.push(`        ${r.detail}`);
    if (!r.ok && r.fix) L.push(`        修复: ${r.fix}`);
  }

  L.push("");
  const checked = results.filter((r) => r.kind !== "info").length;
  L.push(`总计 ${checked} 项：通过 ${checked - failedCount}，失败 ${failedCount}`);
  if (failedCount === 0) {
    L.push("");
    L.push("✅ 依赖已精确锁定，manifest / lockfile / node_modules 三向一致。");
    L.push("   可以安全执行 npm ci（离线环境下不会拉到意外版本）。");
  } else {
    L.push("");
    L.push("❌ 存在不一致。修复后重跑本脚本。");
    L.push("   注意：改 package.json 后必须同步 package-lock.json 的 packages[\"\"].dependencies，");
    L.push("   否则 npm ci 会以「lock file does not match package.json」拒绝执行。");
  }
  process.stdout.write(L.join("\n") + "\n");
}

print();
process.exitCode = failedCount === 0 ? 0 : 1;

// ---------------------------------------------------------------------------
// 极简 satisfies：只支持「精确版本」「^x.y.z」「~x.y.z」三种本项目会用到的形态。
// 不做完整 semver（D3：不引依赖）。无法判定时返回 true（不误报）。
//
// ⚠️ 关键语义区分（曾被反向测试抓到）：
//   - `4.19.2`（无前缀）= **精确** → 只有全等才满足
//   - `^4.19.2`        = 允许 4.x.x 且 >= 4.19.2
//   - `~4.19.2`        = 允许 4.19.x 且 >= 4.19.2
// 若把无前缀当成 `^`，manifest 写 4.19.2 而 lockfile 漂到 4.21.2 时会漏报。
// ---------------------------------------------------------------------------
function satisfies(version, range) {
  if (typeof range !== "string" || typeof version !== "string") return false;
  if (range === version) return true;

  const r = range.match(/^([\^~]?)(\d+)(?:\.(\d+|[xX*]))?(?:\.(\d+|[xX*]))?/);
  const m = version.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!r || !m) return true; // 形态不认识 → 不误报
  const [, prefix, rmaj, rmin, rpat] = r;
  const [maj, min, pat] = [Number(m[1]), Number(m[2]), Number(m[3])];

  // 无前缀且三段齐全 → 精确版本，上面已判过全等，走到这里就是不等
  if (prefix === "" && rmin !== undefined && rpat !== undefined) return false;

  if (Number(rmaj) !== maj) return false;
  if (rmin === undefined || /[xX*]/.test(rmin)) return true; // `4` 或 `4.x` → 只看主版本
  if (Number(rmin) > min) return false;
  if (prefix === "~" && Number(rmin) !== min) return false;
  if (rpat === undefined || /[xX*]/.test(rpat)) return true;
  if (prefix === "~") return Number(rpat) <= pat;
  if (Number(rmin) === min && Number(rpat) > pat) return false;
  return true;
}
