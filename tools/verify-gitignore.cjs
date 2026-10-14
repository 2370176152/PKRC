/*
 * PKRC · B-2 .gitignore 覆盖复核器（tools/verify-gitignore.cjs）
 * ---------------------------------------------------------------------------
 * 背景（派单 15 §五 B-2）：
 *   `.gitignore` 是「沉默的守卫」——写错了不会报错，只会在某次 `git add -A`
 *   之后以「数百 MB 构建产物进了仓库」或「发行版资产被漏提交」的形式爆发。
 *   第二阶段 A3-13 会引入 vite build 产物，第三阶段 A5-01 要切换 dist/，
 *   两个方向都可能被 .gitignore 坑到。
 *
 * 本脚本把 B-2 的复核结论固化为**可重复执行的断言**：
 *   - MUST_NOT_IGNORE：必须能被 git 跟踪（漏忽略 = 交付物静默丢失）
 *   - MUST_IGNORE    ：必须被忽略（漏忽略 = 中间产物进仓库）
 *   - TRACKED_SAFE   ：已跟踪文件不得被任何规则命中（防误伤）
 *
 * 设计取舍（重要）：
 *   1. **不引入依赖**（D3），且**不 spawn git**。
 *      早期版本用 `git check-ignore` 子进程，但在受限环境（沙箱/CI）
 *      下 spawn 可执行文件会 EBUSY → 脚本直接崩。故改为**纯 JS 复刻
 *      gitignore 匹配语义**，行为已与真实 git 逐条交叉校验（见
 *      docs/delegation/16-后端第二阶段交付.md §B-2 的校验记录）。
 *   2. 只实现本仓库用到的语义子集：目录后缀 `/`、前导 `/` 锚定、
 *      通配 `*`/`?`、`**` 跨目录、`!` 取反、`#` 注释。
 *      未实现：字符类 `[abc]`、转义。本仓库未使用，遇到则明确报错而非静默。
 *   3. 「父目录被排除 → 子树不可被取反复活」这条 git 硬规则**已实现**。
 *
 * 退出码：0 = 全部通过；1 = 有失败项；2 = 用法错误
 *
 * 运行：
 *   node tools/verify-gitignore.cjs
 *   node tools/verify-gitignore.cjs --json
 *   node tools/verify-gitignore.cjs --strict     # 额外要求：断言表路径必须真实存在于工作区（生产模式）
 */

"use strict";

const fs = require("fs");
const path = require("path");

const REPO_ROOT = path.resolve(__dirname, "..");
const AS_JSON = process.argv.includes("--json");
const STRICT = process.argv.includes("--strict");

// ---------------------------------------------------------------------------
// gitignore 语义实现
// ---------------------------------------------------------------------------

/** 把 glob 转成 RegExp。`**` 跨目录，`*` 不跨目录，`?` 单字符（不含 /）。 */
function globToRegExp(glob) {
  let re = "";
  let i = 0;
  while (i < glob.length) {
    const c = glob[i];
    if (c === "*") {
      if (glob[i + 1] === "*") {
        // `**`：匹配任意字符（含 /）
        re += ".*";
        i += 2;
        // 吸收 `**/` 或 `/**` 的冗余斜杠，避免出现 `.*/` 匹配不到空段
        if (glob[i] === "/") i += 1;
        continue;
      }
      re += "[^/]*";
      i += 1;
      continue;
    }
    if (c === "?") {
      re += "[^/]";
      i += 1;
      continue;
    }
    if (c === "[") {
      throw new Error(`字符类未实现：${glob}`);
    }
    if (c === "\\") {
      // 转义：取下一个字符字面量
      re += glob[i + 1] ? glob[i + 1].replace(/[.*+?^${}()|[\]\\]/g, "\\$&") : "\\\\";
      i += 2;
      continue;
    }
    re += c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    i += 1;
  }
  return new RegExp("^" + re + "$");
}

/** 解析 .gitignore 文本为规则列表（顺序即优先级，后者覆盖前者）。 */
function parseGitignore(text) {
  const rules = [];
  for (const rawLine of text.split(/\r\n|\r|\n/)) {
    const line = rawLine.replace(/^\s+|\s+$/g, "");
    if (!line || line.startsWith("#")) continue;
    let pattern = line;
    let negated = false;
    if (pattern.startsWith("!")) {
      negated = true;
      pattern = pattern.slice(1);
    }
    let dirOnly = false;
    if (pattern.endsWith("/")) {
      dirOnly = true;
      pattern = pattern.slice(0, -1);
    }
    // 去掉前导 `/`：含义是「锚定到 .gitignore 所在目录」，本脚本只处理仓库根，等价
    const anchored = pattern.startsWith("/") || pattern.includes("/");
    if (pattern.startsWith("/")) pattern = pattern.slice(1);
    rules.push({
      negated,
      dirOnly,
      anchored,
      re: globToRegExp(pattern),
      source: line,
    });
  }
  return rules;
}

/**
 * 判断相对路径是否被忽略。复刻 git 语义：
 *   - 逐级检查路径前缀（目录命中会让整棵子树被排除）
 *   - 同一级上「最后一条命中的规则」生效
 */
function isIgnored(relPath, rules, isDir) {
  const parts = relPath.split("/").filter(Boolean);
  for (let i = 1; i <= parts.length; i++) {
    const sub = parts.slice(0, i).join("/");
    const subIsDir = isDir || i < parts.length;
    let state = null; // null=无规则命中, true=忽略, false=取反
    for (const r of rules) {
      if (r.dirOnly && !subIsDir) continue;
      let hit;
      if (r.anchored) {
        hit = r.re.test(sub);
      } else {
        // 未锚定：匹配完整相对路径，或任意深度的 basename
        hit = r.re.test(sub) || r.re.test(parts[i - 1]);
      }
      if (hit) state = !r.negated;
    }
    if (i < parts.length && state === true) {
      // 父目录被排除 → git 不会descend，取反也无法复活子树
      return true;
    }
    if (i === parts.length) return state === true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// 断言表
// ---------------------------------------------------------------------------

/** 必须【不】被忽略 —— 漏忽略 = 交付物/资产静默丢失 */
const MUST_NOT_IGNORE = [
  // 第一阶段归档
  "docs/archive/phase-1/PHASE-1-归档报告.md",
  "docs/archive/phase-1/README.md",
  "docs/archive/phase-1/manifest.json",
  // 源码化调研与清单（含大体积 JSON，属交付物非中间产物）
  "docs/sourcemigration/A0-上游定位报告.md",
  "docs/sourcemigration/A1-构建复现报告.md",
  "docs/sourcemigration/A2-魔改点提取报告.md",
  "docs/sourcemigration/A2-魔改点清单.md",
  "docs/sourcemigration/A3-魔改迁移报告.md",
  "docs/sourcemigration/a2-classify.json",
  "docs/sourcemigration/a2-cn-anchors.json",
  "docs/sourcemigration/classname-map.json",
  "docs/sourcemigration/classnames.txt",
  // A3 迁移源码（第二阶段产出）
  "docs/sourcemigration/A3-migration/src/enums/extensions.ts",
  "docs/sourcemigration/A3-migration/src/data/systems/constellation-framework.ts",
  "docs/sourcemigration/A3-migration/src/data/systems/nianli-system.ts",
  // 🔴 最易被 `/dist/` 误伤：发行版资产必须始终可提交
  "game/server/dist/index.html",
  "game/server/dist/exp-sprites.json",
  "game/server/dist/starter-colors.json",
  "game/server/dist/manifest.webmanifest",
  "game/server/dist/assets/index-D3KKGO7Y.js",
  "game/server/dist/assets/index-57B56a0n.css",
  "game/server/dist/locales/zh-CN/talent.json",
  "game/server/dist/battle-anims/example.webm",
  // 依赖清单与工具
  "game/package.json",
  "game/package-lock.json",
  "game/server/server.cjs",
  "game/server/logger.cjs",
  "game/server/test-server.cjs",
  "tools/verify-lockfile.cjs",
  "tools/inventory-assets.cjs",
  // .build-tools 里的可复现脚本（例外规则，必须保持生效）
  ".build-tools/a13-patch-verify.py",
  ".build-tools/a2-classify.py",
  ".build-tools/enum-ext.py",
];

/** 必须【被】忽略 —— 漏忽略 = 中间产物/构建输出进仓库 */
const MUST_IGNORE = [
  // 上游参照树
  "upstream-pokerogue/src/ui/ui.ts",
  "upstream-pokerogue/package.json",
  // 源码化工作区中间产物（保留 .py，排除其余全部）
  ".build-tools/node24.zip",
  ".build-tools/locales.tgz",
  ".build-tools/beta-mid.ts",
  ".build-tools/br.json",
  ".build-tools/anchor/index.js",
  ".build-tools/build-src/foo.ts",
  ".build-tools/locales-x/en/common.json",
  ".build-tools/probe/out.txt",
  ".build-tools/node-v24.9.0-win-x64/node.exe",
  ".build-tools/tarball-src/src/x.ts",
  ".build-tools/evidence/x.json",
  ".build-tools/anchor-apr18/x.js",
  ".build-tools/anchor2/x.js",
  ".build-tools/probe2/x.ts",
  ".build-tools/probe-modifier-v11118.ts",
  // 第二阶段新增：A3-13 的 vite build 产物（数百 MB）
  "docs/sourcemigration/A3-migration/dist/index.html",
  "docs/sourcemigration/A3-migration/dist/assets/index-abc123.js",
  "docs/sourcemigration/A3-migration/dist/images/pokemon/x.png",
  // tsc 增量缓存
  "docs/sourcemigration/A3-migration/tsconfig.tsbuildinfo",
  "docs/sourcemigration/A3-migration/src/foo.tsbuildinfo",
  // 根级构建产物（若在根目录构建）
  "dist/index.html",
  "dist/assets/app.js",
  // Vite 缓存 / 覆盖率 / pnpm 存储
  ".vite/cache/dep.js",
  "coverage/lcov.info",
  ".pnpm-store/v3/files/x",
  // node_modules（任意深度）
  "docs/sourcemigration/A3-migration/node_modules/express/package.json",
  "node_modules/express/package.json",
  // 便携运行时与二进制资产
  "shared/runtime/node.exe",
  "shared/runtime/node_modules/express/package.json",
  "game/pokerogue-win32-x64/pokerogue.exe",
  "game/server/dist/images/pokemon/x.png",
  "game/server/dist/audio/bgm/x.ogg",
  "game/server/dist/fonts/x.ttf",
  // 第二阶段新增：B-4 发布脚本的中间/备份目录（每份约 758 MB，绝不能入库）
  "game/server/.release-staging/dist.new/index.html",
  "game/server/.release-staging/dist.new/assets/app.js",
  "game/server/backups/dist.20261026-143022/index.html",
  "game/server/backups/dist.20261026-143022/SHA256SUMS",
  "game/server/dist.old/index.html",
  "game/server/dist.rollback-20261026/index.html",
  "game/server/dist.broken/index.html",
  // 日志与杂项
  "game/logs/node-20261014-090000.log",
  "node_output.txt",
  "PKRC/game/package.json",
  // 注意：`PKRC-repo.bundle.bak` 是 `PKRC/` 的【兄弟文件】，不在其内部，
  // 因此**不**被 `PKRC/` 规则命中（已用 `git check-ignore -v` 实测确认）。
  // 它属于 MUST_NOT_IGNORE 组 —— 若想忽略它，需要单独加 `PKRC-repo.bundle.*` 规则。
];

/** 必须【不】被忽略 —— 但**当前故意不加规则**：用于锁定「兄弟文件不被父目录规则误伤」这一语义 */
const SEMANTIC_PROBES = [
  "PKRC-repo.bundle.bak",
  "PKRC-repo.bundle",
  "game/server/dist-backup/index.html",
  // B-4 新增规则的反向探针：`dist.old/` 是**精确路径分量**规则，
  // 不应命中 `dist.older/`（若改成 `dist.old*` 之类通配就会误伤 → 此探针会失败）
  "game/server/dist.older/index.html",
  // `dist.rollback-*/` 只匹配带短横线的回滚目录，不应命中 `dist.rollback2/`
  "game/server/dist.rollback2/index.html",
];

// ---------------------------------------------------------------------------
// 执行
// ---------------------------------------------------------------------------
const results = [];
let failed = 0;
const skipped = [];

const gitignorePath = path.join(REPO_ROOT, ".gitignore");
if (!fs.existsSync(gitignorePath)) {
  process.stderr.write(`找不到 .gitignore：${gitignorePath}\n`);
  process.exit(2);
}
const rules = parseGitignore(fs.readFileSync(gitignorePath, "utf8"));

function record(expectIgnored, p) {
  let actual;
  try {
    actual = isIgnored(p, rules, false);
  } catch (err) {
    skipped.push({ path: p, reason: err.message });
    return;
  }
  const ok = actual === expectIgnored;
  if (!ok) failed++;
  results.push({ path: p, expect: expectIgnored ? "ignored" : "tracked", actual: actual ? "ignored" : "tracked", ok });
}

for (const p of MUST_NOT_IGNORE) record(false, p);
for (const p of MUST_IGNORE) record(true, p);
// 语义探针：确认「兄弟路径不被父目录规则误伤」（这些路径不预期被忽略）
for (const p of SEMANTIC_PROBES) record(false, p);

// STRICT 模式：断言表里的路径应真实存在于工作区（防止断言表过期失效）
let missing = [];
if (STRICT) {
  for (const p of [...MUST_NOT_IGNORE, ...MUST_IGNORE]) {
    if (!fs.existsSync(path.join(REPO_ROOT, p))) missing.push(p);
  }
}

// ---------------------------------------------------------------------------
// 输出
// ---------------------------------------------------------------------------
if (AS_JSON) {
  process.stdout.write(
    JSON.stringify(
      {
        ok: failed === 0 && missing.length === 0,
        rules: rules.length,
        assertions: results.length,
        failed,
        skipped,
        strictMissing: missing,
        results,
      },
      null,
      2,
    ) + "\n",
  );
} else {
  const L = [];
  L.push("PKRC .gitignore 覆盖复核");
  L.push("=".repeat(68));
  L.push(`仓库    : ${REPO_ROOT}`);
  L.push(`规则数  : ${rules.length} 条`);
  L.push(`断言数  : ${results.length} 条`);
  L.push("");

  const showFail = (list, title) => {
    const bad = list.filter((r) => !r.ok);
    L.push(`${title}：${list.length - bad.length}/${list.length} 通过`);
    for (const r of bad) {
      L.push(`  ❌ ${r.path}`);
      L.push(`     期望 ${r.expect}，实际 ${r.actual}`);
    }
  };
  showFail(results.filter((r) => r.expect === "tracked"), "【必须可跟踪】归档/源码化/发行版资产/工具");
  showFail(results.filter((r) => r.expect === "ignored"), "【必须被忽略】中间产物/构建输出/二进制");

  if (skipped.length) {
    L.push("");
    L.push("【跳过】（语义未实现，非失败）：");
    for (const s of skipped) L.push(`  - ${s.path}：${s.reason}`);
  }
  if (STRICT) {
    L.push("");
    L.push(
      missing.length === 0
        ? "【STRICT】断言表路径全部存在于工作区 ✅"
        : `【STRICT】❌ 断言表路径不存在（可能规则已过期）：\n${missing.map((m) => "     " + m).join("\n")}`,
    );
  }

  L.push("");
  const passed = results.filter((r) => r.ok).length;
  L.push(`总计：通过 ${passed}，失败 ${results.length - passed}`);
  if (failed === 0 && missing.length === 0) {
    L.push("");
    L.push("✅ .gitignore 覆盖完整，无缺口、无误伤。");
  } else {
    L.push("");
    L.push("❌ 存在缺口。修复 .gitignore 后重跑本脚本。");
  }
  process.stdout.write(L.join("\n") + "\n");
}

process.exitCode = failed === 0 && missing.length === 0 ? 0 : 1;
