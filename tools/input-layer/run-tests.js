#!/usr/bin/env node
/**
 * run-tests.js —— F-3 测试入口（无需 pnpm / 无第三方依赖）
 * 用法：node tools/input-layer/run-tests.js
 *
 * 存在意义：A0 未完成、pnpm 未安装、上游未 clone 时，本目录仍可独立验证。
 * 待 M5 源码化后，本测试应迁移为 vitest 并置于 src/input/__tests__/。
 */

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

const suites = ["gesture-resolver.test.js"];

let failed = 0;
for (const suite of suites) {
  console.log(`\n▶ ${suite}`);
  const r = spawnSync(process.execPath, [join(here, suite)], { stdio: "inherit" });
  if (r.status !== 0) failed++;
}

console.log("\n" + "=".repeat(60));
if (failed === 0) {
  console.log("✅ 全部测试套件通过");
} else {
  console.log(`❌ ${failed} 个套件失败`);
  process.exitCode = 1;
}
