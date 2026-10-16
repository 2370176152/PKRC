#!/usr/bin/env node
/**
 * verify-ts.mjs —— F-6 / F-8 验收脚本（TS 形态类型检查 + 69 项断言同构迁移验证）
 * ---------------------------------------------------------------------------
 * 归属：前端 F-6 + F-8
 *   ① F-6：证明「JS → TS」是**加类型、零逻辑改动**
 *   ② F-8：证明 13 个场景适配器桩「tsc 零错误」
 *
 * 两步（**全程进程内**，不 spawn 子进程 —— 规避沙箱 node→node EBUSY）：
 *   ① 类型检查：全量（纯逻辑 + 测试 + 适配器）取 PreEmit 诊断 → 必须 0 错误
 *                （适配器经 `#enums/*` 别名解析到锚点树真实枚举）
 *   ② 同构迁移：仅纯逻辑 + 测试编译到临时目录 → 动态 import 执行 → 69/69
 *
 * 工具链取自锚点树 node_modules（typescript 6.0.3 / @types/node），
 * 不新增任何依赖，可在离线环境运行。
 *
 * 用法：node tools/input-layer/verify-ts.mjs
 * ---------------------------------------------------------------------------
 */

import { createRequire } from "node:module";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..", "..");
const require = createRequire(import.meta.url);

const ANCHOR =
  ".build-tools/tarball-src/pokerogue-90df65097b6df76f713e6bd108afa84499e8b993";
const ANCHOR_DIR = join(repoRoot, ANCHOR);
const INPUT_SRC = join(repoRoot, "docs/sourcemigration/A3-migration/src/input");
const TMP = join(here, ".tmp-verify");

// F-6：纯逻辑 + 测试（零外部依赖，可编译执行）
const LOGIC_FILES = [
  join(INPUT_SRC, "gesture-resolver.ts"),
  join(INPUT_SRC, "input-arbiter.ts"),
];
const TEST_FILES = [
  join(INPUT_SRC, "__tests__/gesture-resolver.test.ts"),
  join(INPUT_SRC, "__tests__/input-arbiter.test.ts"),
];
// F-8：共享契约 + 13 个场景适配器（经 `#enums/*` 引用上游枚举）
const ADAPTER_FILES = [
  join(INPUT_SRC, "types.ts"),
  join(INPUT_SRC, "scene-adapters/index.ts"),
  join(INPUT_SRC, "scene-adapters/title-adapter.ts"),
  join(INPUT_SRC, "scene-adapters/menu-adapter.ts"),
  join(INPUT_SRC, "scene-adapters/party-adapter.ts"),
  join(INPUT_SRC, "scene-adapters/summary-adapter.ts"),
  join(INPUT_SRC, "scene-adapters/super-backpack-adapter.ts"),
  join(INPUT_SRC, "scene-adapters/command-adapter.ts"),
  join(INPUT_SRC, "scene-adapters/fight-adapter.ts"),
  join(INPUT_SRC, "scene-adapters/target-select-adapter.ts"),
  join(INPUT_SRC, "scene-adapters/modifier-select-adapter.ts"),
  join(INPUT_SRC, "scene-adapters/starter-select-adapter.ts"),
  join(INPUT_SRC, "scene-adapters/pokedex-adapter.ts"),
  join(INPUT_SRC, "scene-adapters/pkrc-modes-adapter.ts"),
  join(INPUT_SRC, "scene-adapters/modal-adapter.ts"),
];

const ALL_FILES = [...LOGIC_FILES, ...TEST_FILES, ...ADAPTER_FILES];

// --------------------------- 前置检查 ---------------------------
for (const f of ALL_FILES) {
  if (!existsSync(f)) {
    console.error(`❌ 缺少文件：${f}`);
    process.exit(2);
  }
}

let ts;
try {
  ts = require(join(ANCHOR_DIR, "node_modules/typescript"));
} catch (e) {
  console.error(`❌ 无法加载锚点树的 typescript：${ANCHOR_DIR}/node_modules/typescript`);
  console.error(`   ${e instanceof Error ? e.message : String(e)}`);
  console.error("   （F-6/F-8 只依赖 tsc，不依赖 B-5 的 vite 环境）");
  process.exit(2);
}

/** 编译选项（与线上 tsconfig 的语义对齐） */
const BASE_OPTIONS = {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  strict: true,
  skipLibCheck: true,
  noEmit: true,
  types: ["node"],
  typeRoots: [join(ANCHOR_DIR, "node_modules/@types")],
  forceConsistentCasingInFileNames: true,
  // TS 6 起 baseUrl 被标记弃用（仅告警→错误）；此处显式静音以保留 paths 解析
  ignoreDeprecations: "6.0",
  // 上游 `#enums/*` 别名 → 锚点树真实枚举（与根 tsconfig 的 paths 对齐）
  baseUrl: ANCHOR_DIR,
  paths: {
    "#enums/*": ["./src/enums/*.ts"],
    "#app/*": ["./src/*.ts"],
    "#ui/*": [
      "./src/ui/battle-info/*.ts",
      "./src/ui/containers/*.ts",
      "./src/ui/handlers/*.ts",
      "./src/ui/settings/*.ts",
      "./src/ui/utils/*.ts",
      "./src/ui/*.ts",
    ],
    "#utils/*": ["./src/utils/*.ts"],
  },
};

function formatDiagnostics(diags) {
  return ts.formatDiagnosticsWithColorAndContext(diags, {
    getCanonicalFileName: (f) => f,
    getCurrentDirectory: () => repoRoot,
    getNewLine: () => "\n",
  });
}

// --------------------------- 步骤 ① 类型检查（F-6 + F-8） ---------------------------
console.log("▶ 步骤 ①：类型检查（--noEmit --strict，含 F-8 的 13 个适配器桩）");
const checkProgram = ts.createProgram(ALL_FILES, BASE_OPTIONS);
const diags = ts.getPreEmitDiagnostics(checkProgram);
if (diags.length > 0) {
  process.stdout.write(formatDiagnostics(diags));
  console.error(`❌ 类型检查未通过（${diags.length} 条诊断）—— 不符合「类型定义完整」`);
  process.exit(1);
}
console.log("   ✅ 类型检查通过（0 错误）\n");

// --------------------------- 步骤 ② 编译 + 运行（F-6 纯逻辑） ---------------------------
console.log("▶ 步骤 ②：编译到临时目录并运行（69 项断言同构迁移）");
rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });

const EMIT_FILES = [...LOGIC_FILES, ...TEST_FILES];
const emitProgram = ts.createProgram(EMIT_FILES, {
  ...BASE_OPTIONS,
  noEmit: false,
  rootDir: INPUT_SRC,
  outDir: TMP,
});
const emitResult = emitProgram.emit();
if (emitResult.emitSkipped) {
  console.error("❌ 编译失败（emitSkipped）");
  process.exit(1);
}
const emitDiags = ts.getPreEmitDiagnostics(emitProgram);
if (emitDiags.length > 0) {
  process.stdout.write(formatDiagnostics(emitDiags));
  console.error("❌ 编译报错");
  process.exit(1);
}

// 产物是 ESM(.js)，需 package.json 指明 module 类型
writeFileSync(join(TMP, "package.json"), JSON.stringify({ type: "module" }, null, 2) + "\n");

const suites = ["__tests__/gesture-resolver.test.js", "__tests__/input-arbiter.test.js"];
let suiteFailures = 0;

for (const suite of suites) {
  console.log(`\n── ${suite} ──`);
  process.exitCode = 0;
  try {
    // 测试文件为顶层即执行的脚本；import 即运行，失败时置 process.exitCode=1
    await import(pathToFileURL(join(TMP, suite)).href);
  } catch (e) {
    console.error(`   ❌ 运行异常：${e instanceof Error ? e.stack ?? e.message : String(e)}`);
    suiteFailures++;
    continue;
  }
  if (process.exitCode && process.exitCode !== 0) suiteFailures++;
}

// --------------------------- 汇总 ---------------------------
rmSync(TMP, { recursive: true, force: true });
process.exitCode = 0;

console.log("\n" + "=".repeat(60));
if (suiteFailures === 0) {
  console.log("✅ F-6 / F-8 验收通过：类型检查 0 错误（含 13 个适配器桩）；断言套件全过（预期合计 69 项）");
} else {
  console.log(`❌ 验收失败：${suiteFailures} 个套件未通过`);
  process.exitCode = 1;
}
console.log("=".repeat(60));
