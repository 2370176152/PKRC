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
// B-9 ① 资源类表与 measureClass
// ---------------------------------------------------------------------------
async function suiteResourceClasses() {
  process.stdout.write("\n[B-9] 资源类表 / measureClass\n");

  await test("RESOURCE_CLASSES 覆盖派单 27 §五 B-9 ② 点名的全部资源", () => {
    const ids = pipeline.RESOURCE_CLASSES.map((c) => c.id);
    for (const need of [
      "audio",
      "battle-anims",
      "fonts",
      "pkrc",
      "images",
      "logo128.png",
      "logo512.png",
      "manifest.webmanifest",
      "starter-colors.json",
      "assets",
      "index.html",
      "locales",
      "service-worker.js",
      "exp-sprites.json",
    ]) {
      assert.ok(ids.includes(need), `资源类表缺少 ${need}`);
    }
  });

  await test("每个资源类都有 kind / type / required（merge 选源的必要字段）", () => {
    for (const c of pipeline.RESOURCE_CLASSES) {
      assert.ok(["build", "asset", "mod", "both"].includes(c.kind), `${c.id} 的 kind 非法：${c.kind}`);
      assert.ok(["dir", "file"].includes(c.type), `${c.id} 的 type 非法：${c.type}`);
      assert.strictEqual(typeof c.required, "boolean", `${c.id} 缺 required`);
    }
  });

  await test("只有 locales 是双源（both）且默认偏好资产源（不静默改运行期内容）", () => {
    const both = pipeline.RESOURCE_CLASSES.filter((c) => c.kind === "both");
    assert.strictEqual(both.length, 1);
    assert.strictEqual(both[0].id, "locales");
    assert.strictEqual(both[0].prefer, "asset", "locales 默认必须保守（asset），见文件头「locales 双源冲突」");
  });

  await test("measureClass：文件类按字节判下限，目录类按文件数判下限", () => {
    const dir = tmpDir("mc");
    // 目录类
    makeFiles(dir, { "images/a.png": 10, "images/b.png": 20 });
    const specDir = { id: "images", type: "dir", minFiles: 3 };
    const m1 = pipeline.measureClass(dir, specDir);
    assert.strictEqual(m1.present, true);
    assert.strictEqual(m1.files, 2);
    assert.strictEqual(m1.ok, false, "2 < 下限 3 应判不合格");
    assert.ok(/下限 3/.test(m1.failReason));

    // 文件类：字节不足
    fs.writeFileSync(path.join(dir, "index.html"), "x", "utf8");
    const specFile = { id: "index.html", type: "file", minBytes: 500 };
    const m2 = pipeline.measureClass(dir, specFile);
    assert.strictEqual(m2.files, 1);
    assert.strictEqual(m2.ok, false);
    assert.ok(/下限 500/.test(m2.failReason));

    // 缺失
    const m3 = pipeline.measureClass(dir, { id: "audio", type: "dir", minFiles: 1 });
    assert.strictEqual(m3.present, false);
    assert.strictEqual(m3.ok, false);

    // 类型不符：期望文件但给了目录
    const m4 = pipeline.measureClass(dir, { id: "images", type: "file" });
    assert.strictEqual(m4.ok, false);
    assert.ok(/类型不符/.test(m4.failReason));
  });

  await test("measureClass：单文件类出现零字节 → 直接判不合格（拷贝事故的典型痕迹）", () => {
    const dir = tmpDir("mc2");
    fs.writeFileSync(path.join(dir, "logo128.png"), Buffer.alloc(0));
    const m = pipeline.measureClass(dir, { id: "logo128.png", type: "file" });
    assert.strictEqual(m.zero, 1);
    assert.strictEqual(m.ok, false, "0 字节文件必须判不合格");
    assert.ok(/零字节/.test(m.failReason));
  });
}

// ---------------------------------------------------------------------------
// B-9 ② copyMissing：只补缺失，永不覆盖/删除
// ---------------------------------------------------------------------------
async function suiteCopyMissing() {
  process.stdout.write("\n[B-9] copyMissing（就地补全的语义基石）\n");

  await test("copyMissing 只补缺失文件，返回补的个数", () => {
    const src = tmpDir("cm-src");
    const dst = tmpDir("cm-dst");
    makeFiles(src, { "fonts/a.ttf": 10, "fonts/b.ttf": 20, "fonts/sub/c.ttf": 30 });
    makeFiles(dst, { "fonts/a.ttf": 10 });
    const n = pipeline.copyMissing(path.join(src, "fonts"), path.join(dst, "fonts"));
    assert.strictEqual(n, 2, "只应补 b.ttf 与 sub/c.ttf");
    assert.ok(fs.existsSync(path.join(dst, "fonts/b.ttf")));
    assert.ok(fs.existsSync(path.join(dst, "fonts/sub/c.ttf")));
  });

  await test("copyMissing **绝不覆盖**已存在文件（保护运行中产物）", () => {
    const src = tmpDir("cm-src2");
    const dst = tmpDir("cm-dst2");
    makeFiles(src, { "starter-colors.json": 99 }); // 内容全 A
    fs.writeFileSync(path.join(dst, "starter-colors.json"), "KEEP-ME", "utf8");
    const n = pipeline.copyMissing(path.join(src, "starter-colors.json"), path.join(dst, "starter-colors.json"));
    assert.strictEqual(n, 0);
    assert.strictEqual(fs.readFileSync(path.join(dst, "starter-colors.json"), "utf8"), "KEEP-ME");
  });

  await test("copyMissing **绝不删除**目标里源没有的文件", () => {
    const src = tmpDir("cm-src3");
    const dst = tmpDir("cm-dst3");
    makeFiles(src, { "pkrc/a.json": 5 });
    makeFiles(dst, { "pkrc/old.json": 5 });
    pipeline.copyMissing(path.join(src, "pkrc"), path.join(dst, "pkrc"));
    assert.ok(fs.existsSync(path.join(dst, "pkrc/old.json")), "目标独有文件必须保留");
  });
}

// ---------------------------------------------------------------------------
// B-9 ③ locales 双源：结构比较 + 并集
// ---------------------------------------------------------------------------
async function suiteLocales() {
  process.stdout.write("\n[B-9] locales 双源（比较 / 并集）\n");

  await test("LOCALE_ALIAS 只声明实测确认的三对别名", () => {
    assert.deepStrictEqual(pipeline.LOCALE_ALIAS, {
      "zh-CN": "zh-Hans",
      "zh-TW": "zh-Hant",
      "ca-ES": "ca",
    });
  });

  await test("compareLocaleTrees：能识别「文件数不同」与「语言目录名不同」", () => {
    const root = tmpDir("loc-cmp");
    const b = path.join(root, "build");
    const a = path.join(root, "asset");
    makeFiles(b, { "en/common.json": 10, "zh-Hans/common.json": 10, "ca/common.json": 10 });
    makeFiles(a, { "en/common.json": 10, "zh-CN/common.json": 10, "ca-ES/common.json": 10 });
    const d = pipeline.compareLocaleTrees(b, a);
    assert.strictEqual(d.differs, true);
    assert.deepStrictEqual(d.onlyBuildLangs.sort(), ["ca", "zh-Hans"]);
    assert.deepStrictEqual(d.onlyAssetLangs.sort(), ["ca-ES", "zh-CN"]);
  });

  await test("compareLocaleTrees：两棵树一致时报 differs=false", () => {
    const root = tmpDir("loc-cmp2");
    const b = path.join(root, "b");
    const a = path.join(root, "a");
    makeFiles(b, { "en/x.json": 3 });
    makeFiles(a, { "en/x.json": 3 });
    assert.strictEqual(pipeline.compareLocaleTrees(b, a).differs, false);
  });

  await test("unionLocales：语言目录按别名归位（zh-CN→zh-Hans），不产出 zh-CN", () => {
    const root = tmpDir("loc-union");
    const base = path.join(root, "base");
    const over = path.join(root, "over");
    const out = path.join(root, "out");
    makeFiles(base, { "en/a.json": 10, "zh-Hans/a.json": 10 });
    makeFiles(over, { "en/a.json": 10, "zh-CN/a.json": 10 });
    const st = pipeline.unionLocales(base, over, out);
    const langs = fs.readdirSync(out).sort();
    assert.deepStrictEqual(langs, ["en", "zh-Hans"], "zh-CN 必须被归位成 zh-Hans");
    assert.strictEqual(st.langs, 2);
  });

  await test("unionLocales：key 级并集 —— 两侧独有的 key 都保留", () => {
    const root = tmpDir("loc-union2");
    const base = path.join(root, "base");
    const over = path.join(root, "over");
    const out = path.join(root, "out");
    fs.mkdirSync(path.join(base, "en"), { recursive: true });
    fs.mkdirSync(path.join(over, "en"), { recursive: true });
    fs.writeFileSync(path.join(base, "en", "a.json"), JSON.stringify({ shared: "B", onlyBase: "B" }), "utf8");
    fs.writeFileSync(path.join(over, "en", "a.json"), JSON.stringify({ shared: "O", onlyOverlay: "O" }), "utf8");
    pipeline.unionLocales(base, over, out);
    const merged = JSON.parse(fs.readFileSync(path.join(out, "en", "a.json"), "utf8"));
    assert.deepStrictEqual(Object.keys(merged).sort(), ["onlyBase", "onlyOverlay", "shared"]);
    assert.strictEqual(merged.onlyBase, "B");
    assert.strictEqual(merged.onlyOverlay, "O");
  });

  await test("unionLocales：默认 overlay 获胜（保留 mod 文本，A/B 对比才不被文案噪声污染）", () => {
    const root = tmpDir("loc-union3");
    const base = path.join(root, "base");
    const over = path.join(root, "over");
    const out = path.join(root, "out");
    fs.mkdirSync(path.join(base, "en"), { recursive: true });
    fs.mkdirSync(path.join(over, "en"), { recursive: true });
    fs.writeFileSync(path.join(base, "en", "a.json"), JSON.stringify({ k: "ANCHOR" }), "utf8");
    fs.writeFileSync(path.join(over, "en", "a.json"), JSON.stringify({ k: "MOD" }), "utf8");
    const st = pipeline.unionLocales(base, over, out);
    assert.strictEqual(JSON.parse(fs.readFileSync(path.join(out, "en", "a.json"), "utf8")).k, "MOD");
    assert.strictEqual(st.conflicts, 1);
    assert.strictEqual(st.conflictWinner, "overlay");
  });

  await test("unionLocales：--locale-conflict=base 时上游文案获胜（可切换）", () => {
    const root = tmpDir("loc-union4");
    const base = path.join(root, "base");
    const over = path.join(root, "over");
    const out = path.join(root, "out");
    fs.mkdirSync(path.join(base, "en"), { recursive: true });
    fs.mkdirSync(path.join(over, "en"), { recursive: true });
    fs.writeFileSync(path.join(base, "en", "a.json"), JSON.stringify({ k: "ANCHOR" }), "utf8");
    fs.writeFileSync(path.join(over, "en", "a.json"), JSON.stringify({ k: "MOD" }), "utf8");
    const st = pipeline.unionLocales(base, over, out, { conflict: "base" });
    assert.strictEqual(JSON.parse(fs.readFileSync(path.join(out, "en", "a.json"), "utf8")).k, "ANCHOR");
    assert.strictEqual(st.conflictWinner, "base");
  });

  await test("unionLocales：mod 独有命名空间文件被完整补入并计入 addedNamespaces", () => {
    const root = tmpDir("loc-union5");
    const base = path.join(root, "base");
    const over = path.join(root, "over");
    const out = path.join(root, "out");
    makeFiles(base, { "en/common.json": 10 });
    fs.mkdirSync(path.join(over, "en"), { recursive: true });
    fs.writeFileSync(path.join(over, "en", "talent.json"), JSON.stringify({ a: "1", b: "2" }), "utf8");
    const st = pipeline.unionLocales(base, over, out);
    assert.strictEqual(st.addedNamespaces, 1);
    assert.ok(fs.existsSync(path.join(out, "en", "talent.json")), "mod 独有命名空间必须补入");
    assert.strictEqual(st.fromOverlay, 2);
  });

  await test("unionLocales：坏 JSON 被跳过而不中断整棵树的合成", () => {
    const root = tmpDir("loc-union6");
    const base = path.join(root, "base");
    const over = path.join(root, "over");
    const out = path.join(root, "out");
    fs.mkdirSync(path.join(base, "en"), { recursive: true });
    fs.mkdirSync(path.join(over, "en"), { recursive: true });
    fs.writeFileSync(path.join(base, "en", "good.json"), JSON.stringify({ a: 1 }), "utf8");
    fs.writeFileSync(path.join(base, "en", "bad.json"), "{not json", "utf8");
    const st = pipeline.unionLocales(base, over, out);
    assert.ok(fs.existsSync(path.join(out, "en", "good.json")));
    assert.ok(!fs.existsSync(path.join(out, "en", "bad.json")), "坏 JSON 不应出现在输出里");
    assert.strictEqual(st.files, 1);
  });
}

// ---------------------------------------------------------------------------
// B-9 ④ 清单比对
// ---------------------------------------------------------------------------
async function suiteManifest() {
  process.stdout.write("\n[B-9] 清单比对（diffManifests）\n");

  await test("diffManifests：识别关键文件新增/缺失/变更", () => {
    const dir = tmpDir("mf");
    const basePath = path.join(dir, "base.json");
    fs.writeFileSync(
      basePath,
      JSON.stringify({
        classes: [{ id: "assets", files: 10, bytes: 100 }],
        sha256: { "index.html": { sha256: "aaa" }, "assets/gone.js": { sha256: "bbb" } },
      }),
      "utf8",
    );
    const cur = {
      classes: [{ id: "assets", files: 11, bytes: 110 }],
      sha256: { "index.html": { sha256: "ccc" }, "assets/new.js": { sha256: "ddd" } },
    };
    const d = pipeline.diffManifests(basePath, cur);
    assert.deepStrictEqual(d.filesAdded, ["assets/new.js"]);
    assert.deepStrictEqual(d.filesMissing, ["assets/gone.js"]);
    assert.deepStrictEqual(d.filesChanged, ["index.html"]);
    assert.strictEqual(d.classesChanged.length, 1);
  });

  await test("diffManifests：基线不可读时返回 error 而不抛异常", () => {
    const d = pipeline.diffManifests(path.join(os.tmpdir(), "definitely-not-here-xyz.json"), { classes: [], sha256: {} });
    assert.ok(d.error, "应带 error 字段");
    assert.deepStrictEqual(d.filesAdded, []);
  });
}

// ---------------------------------------------------------------------------
// 主流程
// ---------------------------------------------------------------------------
(async function main() {
  process.stdout.write("PKRC · B-3/B-9 资产管线回归测试\n");
  process.stdout.write("=".repeat(68) + "\n");

  await suiteArgs();
  await suiteMeasure();
  await suitePairs();
  await suiteImportSafety();
  await suiteResourceClasses();
  await suiteCopyMissing();
  await suiteLocales();
  await suiteManifest();

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
