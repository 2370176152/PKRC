/*
 * PKRC · B-3 资产管线回归测试
 * ---------------------------------------------------------------------------
 * 覆盖 tools/asset-pipeline.cjs 的三处**易退化逻辑**：
 *
 *   ① 参数解析：`--k=v` 与 `--k v` 两种写法都要认
 *      （历史上只认空格形式，导致文档里的 `--dist=xxx` 被静默忽略）
 *   ② measure()：必须区分「目录」与「文件」，目录不计入零字节
 *      （`find -size 0` 会把目录算成 0 字节，是经典的排查陷阱）
 *   ③ checkSpritePairs()：必须按 json **内容**判依赖、按 images/pokemon **全域**索引
 *      （按文件名配对会误报 palette 型 json；按同目录索引会误报跨目录引用）
 *
 * 运行（便携 Node v16，无新依赖）：
 *   ..\shared\runtime\node.exe tools\test-asset-pipeline.cjs
 *
 * 设计原则：不引入测试框架（D3），用 node:assert + 手写 runner。
 * 用 require 直接调用内部函数（不 spawn 子进程 —— 本沙箱 spawn 会 EBUSY）。
 */

"use strict";

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");

const MOD = path.join(__dirname, "asset-pipeline.cjs");
const pipeline = require(MOD);

// ---------------------------------------------------------------------------
// 迷你 runner
// ---------------------------------------------------------------------------
const results = [];
async function test(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
    process.stdout.write(`  PASS  ${name}\n`);
  } catch (err) {
    results.push({ name, ok: false, err });
    process.stdout.write(`  FAIL  ${name}\n        ${err.message}\n`);
  }
}

function tmpDir(tag) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `pkrc-ap-${tag}-`));
}

/** 在临时目录里造文件；spec 形如 {"a/b.png": 123}，值为字节数 */
function makeFiles(root, spec) {
  for (const rel of Object.keys(spec)) {
    const full = path.join(root, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, Buffer.alloc(spec[rel], 0x41));
  }
}

// ---------------------------------------------------------------------------
// ① 参数解析
// ---------------------------------------------------------------------------
async function suiteArgs() {
  process.stdout.write("\n[1/4] 参数解析（opt / flag）\n");

  // opt 依赖进程 argv，无法直接改。这里用「同款实现」做行为验证：
  // 事实上 pipeline.parseOpt 读的是本进程 argv，故只能验 flag 类断言。
  await test("parseOpt 是函数且可调用", () => {
    assert.strictEqual(typeof pipeline.parseOpt, "function");
  });

  await test("parseOpt 对不存在的选项返回 undefined（未提供 ≠ 空串）", () => {
    const v = pipeline.parseOpt("--this-option-does-not-exist");
    assert.strictEqual(v, undefined, "未提供的选项必须返回 undefined 以便调用方 || DEFAULT 兜底");
  });

  await test("parseFlag 对不存在的 flag 返回 false", () => {
    assert.strictEqual(pipeline.parseFlag("--nope-not-here"), false);
  });

  // 用真实 CLI 端到端验证等号形式（唯一可靠办法是起子进程，但沙箱 EBUSY，
  // 所以退而求其次：源码文本断言，确保等号分支存在且未被删掉）
  await test("源码含等号形式解析分支（防回归）", () => {
    const src = fs.readFileSync(MOD, "utf8");
    assert.ok(
      src.includes('a.startsWith(name + "=")'),
      "opt() 必须保留 --key=value 的解析分支；删掉会让文档里的 --dist=xxx 静默失效"
    );
    assert.ok(
      src.includes("argv[i + 1]"),
      "opt() 必须保留空格形式 --key value 的解析分支"
    );
  });
}

// ---------------------------------------------------------------------------
// ② measure：目录 vs 文件
// ---------------------------------------------------------------------------
async function suiteMeasure() {
  process.stdout.write("\n[2/4] measure() 目录/文件区分\n");

  await test("空目录不计入 files，也不计入 zero", () => {
    const d = tmpDir("m1");
    fs.mkdirSync(path.join(d, "empty-sub"), { recursive: true });
    const m = pipeline.measure(d);
    assert.strictEqual(m.files, 0, "目录不应被算作文件");
    assert.strictEqual(m.zero.length, 0, "目录不应被算作零字节文件");
    fs.rmSync(d, { recursive: true, force: true });
  });

  await test("零字节【文件】才计入 zero；正常目录混在其中不误报", () => {
    const d = tmpDir("m2");
    makeFiles(d, { "a/ok.png": 10, "a/sub/inner.png": 20 });
    fs.mkdirSync(path.join(d, "a", "female"), { recursive: true });
    fs.writeFileSync(path.join(d, "a", "1.shell"), ""); // 真·零字节文件
    const m = pipeline.measure(d);
    assert.strictEqual(m.files, 3, "应为 3 个文件（ok.png / inner.png / 1.shell）");
    assert.strictEqual(m.zero.length, 1, "只有 1.shell 是零字节");
    assert.ok(m.zero[0].endsWith("1.shell"));
    fs.rmSync(d, { recursive: true, force: true });
  });

  await test("字节统计只累计文件大小", () => {
    const d = tmpDir("m3");
    makeFiles(d, { "x.png": 100, "y.png": 25 });
    const m = pipeline.measure(d);
    assert.strictEqual(m.bytes, 125);
    fs.rmSync(d, { recursive: true, force: true });
  });
}

// ---------------------------------------------------------------------------
// ③ checkSpritePairs
// ---------------------------------------------------------------------------
async function suitePairs() {
  process.stdout.write("\n[3/4] checkSpritePairs() 语义判定\n");

  await test("atlas 型：textures[].image 存在的 png → 无 dangling", () => {
    const d = tmpDir("p1");
    makeFiles(d, { "back/1.png": 50 });
    fs.writeFileSync(
      path.join(d, "back", "1.json"),
      JSON.stringify({ textures: [{ image: "1.png" }] })
    );
    const r = pipeline.checkSpritePairs(d);
    assert.strictEqual(r.atlas, 1);
    assert.strictEqual(r.dangling.length, 0);
    fs.rmSync(d, { recursive: true, force: true });
  });

  await test("atlas 型：声明了不存在的 png → 记 dangling", () => {
    const d = tmpDir("p2");
    makeFiles(d, { "back/1.png": 50 });
    fs.writeFileSync(
      path.join(d, "back", "1.json"),
      JSON.stringify({ textures: [{ image: "missing.png" }] })
    );
    const r = pipeline.checkSpritePairs(d);
    assert.strictEqual(r.dangling.length, 1);
    assert.strictEqual(r.dangling[0].image, "missing.png");
    fs.rmSync(d, { recursive: true, force: true });
  });

  await test("palette 型（无 textures 数组）→ 计 palette，绝不报 dangling", () => {
    const d = tmpDir("p3");
    // 这是实测的上游真实结构：variant/*.json 是颜色映射
    fs.writeFileSync(
      path.join(d, "1.json"),
      JSON.stringify({ "1": { "317373": "6e034e" } })
    );
    const r = pipeline.checkSpritePairs(d);
    assert.strictEqual(r.palette, 1, "palette 型必须单独计数");
    assert.strictEqual(r.atlas, 0);
    assert.strictEqual(r.dangling.length, 0, "palette 型与 png 无关，不得报缺失");
    fs.rmSync(d, { recursive: true, force: true });
  });

  await test("跨目录引用：variant/x.json 声明上一级的图 → 不算 dangling", () => {
    const d = tmpDir("p4");
    // 注意：variant/18-mega.png 不存在，但 images/pokemon/18-mega.png 存在
    makeFiles(d, { "18-mega.png": 50, "variant/10-342.json": 0 });
    fs.writeFileSync(
      path.join(d, "variant", "10-342.json"),
      JSON.stringify({ textures: [{ image: "18-mega.png" }] })
    );
    const r = pipeline.checkSpritePairs(d);
    assert.strictEqual(
      r.dangling.length,
      0,
      "上游 atlas 的 image 可跨目录引用，全域索引必须能找到"
    );
    fs.rmSync(d, { recursive: true, force: true });
  });

  await test("image 字段无 .png 扩展名 → 计 noExtRefs，不报 dangling", () => {
    const d = tmpDir("p5");
    fs.writeFileSync(
      path.join(d, "1.json"),
      JSON.stringify({ textures: [{ image: "887-mega" }] })
    );
    const r = pipeline.checkSpritePairs(d);
    assert.strictEqual(r.noExtRefs, 1);
    assert.strictEqual(r.dangling.length, 0);
    fs.rmSync(d, { recursive: true, force: true });
  });

  await test("零字节 json → 跳过，不计 atlas/palette，不计 dangling", () => {
    const d = tmpDir("p6");
    fs.writeFileSync(path.join(d, "broken.json"), "");
    const r = pipeline.checkSpritePairs(d);
    assert.strictEqual(r.atlas, 0);
    assert.strictEqual(r.palette, 0);
    assert.strictEqual(r.dangling.length, 0, "空壳 json 归零字节检测负责，不应在此报错");
    fs.rmSync(d, { recursive: true, force: true });
  });

  await test("非法 json → 记 unparsable，不抛异常", () => {
    const d = tmpDir("p7");
    fs.writeFileSync(path.join(d, "bad.json"), "{not valid json");
    const r = pipeline.checkSpritePairs(d);
    assert.strictEqual(r.unparsable.length, 1);
    fs.rmSync(d, { recursive: true, force: true });
  });

  await test("不存在的目录 → 返回空结果，不抛异常", () => {
    const r = pipeline.checkSpritePairs(path.join(os.tmpdir(), "pkrc-not-exist-" + Date.now()));
    assert.strictEqual(r.atlas, 0);
    assert.strictEqual(r.dangling.length, 0);
  });
}

// ---------------------------------------------------------------------------
// ④ 被 require 时不应执行 CLI（否则测试会意外触发整个 verify 扫描）
// ---------------------------------------------------------------------------
async function suiteImportSafety() {
  process.stdout.write("\n[4/4] 导入安全性\n");

  await test("require 本模块不会设置 process.exitCode", () => {
    // 若 main() 被执行，verify 会因 18 个零字节文件把 exitCode 设为 1
    assert.notStrictEqual(
      process.exitCode,
      1,
      "被 require 时不应运行 CLI（require.main 判断必须生效）"
    );
  });

  await test("导出常量结构正确", () => {
    assert.deepStrictEqual(pipeline.EXPECTED_TOP, [
      "assets",
      "audio",
      "battle-anims",
      "fonts",
      "images",
      "locales",
    ]);
    assert.strictEqual(pipeline.UPSTREAM.assetsRepo, "pagefaultgames/pokerogue-assets");
    assert.strictEqual(pipeline.UPSTREAM.pokerogueRef, "90df65097b6d");
  });
}

// ---------------------------------------------------------------------------
// 主流程
// ---------------------------------------------------------------------------
(async function main() {
  process.stdout.write("PKRC · B-3 资产管线回归测试\n");
  process.stdout.write("=".repeat(68) + "\n");

  await suiteArgs();
  await suiteMeasure();
  await suitePairs();
  await suiteImportSafety();

  const pass = results.filter((r) => r.ok).length;
  const fail = results.length - pass;
  process.stdout.write("\n" + "=".repeat(68) + "\n");
  process.stdout.write(`总计：${pass} 通过 / ${fail} 失败 / ${results.length} 项\n`);
  if (fail > 0) {
    process.stdout.write("\n失败明细：\n");
    for (const r of results.filter((x) => !x.ok)) {
      process.stdout.write(`  · ${r.name}\n    ${r.err && r.err.message}\n`);
    }
    process.exitCode = 1;
  }
})();
