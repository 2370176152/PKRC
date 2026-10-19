/*
 * PKRC · B-7 发布脚本回归测试（tools/test-release.cjs）
 * ---------------------------------------------------------------------------
 * 依据：`docs/delegation/18-B4-发布脚本设计.md`（方案 B）+ `27-第四阶段任务分发.md` §五 B-7
 * 验收：①暂存+原子切换+备份(SHA256)+自动回滚 ②六条失败路径全覆盖
 *      ③dry-run 可验证 ④与 B-9 合并管线对接
 *
 * 为什么自造一个「能过全量校验」的夹具（full fixture）：
 *   release.cjs 的步骤 ③ **直接复用** asset-pipeline 的 `verifyDist`（14 类表驱动）。
 *   只有造出 14 类都达标的 dist，才能证明「全绿 happy path」真的走得通。
 *   夹具约 1.2k 个小文件（locales 100 / images 1000 / audio 100 / battle-anims 10
 *   / fonts 2 / pkrc 1 / assets 3 / 其余文件类），内容都是占位字节 ——
 *   `verifyDist` 看的是**文件数与字节数**，内容真伪由真实 dist 的 verify 覆盖（见 B-9 报告）。
 *
 * 为什么用「打桩 fs.renameSync」测 F4/F5：
 *   真实 rename 失败（EPERM / 跨卷 / 被占用）无法在进程内稳定复现，沙箱也不许 spawn
 *   子进程。打桩注入是**唯一**能确定性覆盖「rename 抛错后现场是否完好」的办法。
 *   release.cjs 与测试 `require` 的是同一个 fs 模块对象，故补丁必然生效。
 *
 * 运行（便携 Node v16，无新依赖）：
 *   ..\shared\runtime\node.exe tools\test-release.cjs
 */

"use strict";

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");

const R = require(path.join(__dirname, "release.cjs"));

// ---------------------------------------------------------------------------
// 迷你 runner（与 test-asset-pipeline.cjs 同款：不引框架，D3）
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

// ---------------------------------------------------------------------------
// 夹具
// ---------------------------------------------------------------------------
const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), "pkrc-release-"));
let seq = 0;
function tmp(tag = "t") {
  const d = path.join(ROOT, `${tag}-${++seq}`);
  fs.mkdirSync(d, { recursive: true });
  return d;
}

/** 写文件（自动建父目录）；content 省略时写一个内容非空的占位 */
function wf(root, rel, content) {
  const full = path.join(root, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content === undefined ? "x" : content);
}
/** 批量造 N 个占位文件（verifyDist 只数文件数，不看内容） */
function wfN(root, rel, n, tag = "f") {
  for (let i = 0; i < n; i++) wf(root, `${rel}/${tag}${String(i).padStart(5, "0")}.bin`, "x");
}

/** 造一个「像 dist」的旧目标（有 index.html；另带 assets/ 以便验证备份清单范围） */
function oldDist(dir, marker = "OLD-CONTENT") {
  fs.mkdirSync(dir, { recursive: true });
  wf(dir, "index.html", `<!doctype html><html><body>${marker}</body></html>`);
  wf(dir, "assets/old.js", `/* ${marker} */`);
  wf(dir, "OLD-MARKER.txt", marker);
  return dir;
}
/** 目标是否仍是「旧产物」（据此断言「绝不触碰目标」） */
function isOldDist(dir, marker = "OLD-CONTENT") {
  const p = path.join(dir, "OLD-MARKER.txt");
  return fs.existsSync(p) && fs.readFileSync(p, "utf8") === marker;
}

/** 最小构建产物（index.html + assets/）；brokenRef=true 时引用一个不存在的 js */
function tinyBuild(dir, { brokenRef = false } = {}) {
  const link = brokenRef ? '<script src="./assets/missing.js"></script>' : "";
  wf(dir, "index.html", `<!doctype html><html><head>${link}</head><body>TINY</body></html>`);
  wf(dir, "assets/app.js", "console.log(1);");
  return dir;
}
/** 最小资产源（只有 images，远达不到 verifyDist 的类下限 → 用来造 F3） */
function tinyAsset(dir) {
  wf(dir, "images/1.png", "PNG");
  return dir;
}

/** F1~F6 通用的一组目录 */
function mkF(tag) {
  const d = tmp(tag);
  return { d, build: tinyBuild(path.join(d, "build")), asset: tinyAsset(path.join(d, "asset")), target: oldDist(path.join(d, "dist")) };
}
/** 组装 publish 参数 */
function argsF(f, extra = [], over = {}) {
  return [
    `--target=${over.target || f.target}`,
    `--build-dir=${over.buildDir || f.build}`,
    `--asset-dir=${over.assetDir || f.asset}`,
    `--staging=${over.staging || path.join(f.d, "st")}`,
    `--backup-dir=${over.backupDir || path.join(f.d, "bk")}`,
  ].concat(extra);
}

/** 调用 publish 并取回本次新增的日志行（LOG 会跨用例累积，用长度切片） */
async function pub(argv) {
  const before = R.getLog().length;
  R.setArgv(argv);
  const res = await R.cmdPublish();
  return { res, log: R.getLog().slice(before) };
}

/** 全量夹具：14 类资源全部达标，能让 verifyDist 判 ok=true */
let FULL = null;
function full() {
  if (FULL) return FULL;
  const base = path.join(ROOT, "FULL");
  const build = path.join(base, "build");
  const asset = path.join(base, "asset");

  // 构建产物：index.html(≥500B) + assets/(≥3) ；index.html 的两条引用都必须真实存在
  const pad = `<!-- ${"p".repeat(600)} -->`;
  wf(
    build,
    "index.html",
    '<!doctype html>\n<html lang="zh-Hans">\n<head>\n<meta charset="utf-8">\n<title>PKRC B-7 fixture</title>\n' +
      '<script type="module" src="./assets/app.js"></script>\n' +
      '<link rel="stylesheet" href="./assets/app.css">\n' +
      `${pad}\n</head>\n<body>fixture</body>\n</html>\n`,
  );
  wf(build, "assets/app.js", "console.log('app');");
  wf(build, "assets/app.css", "body{}");
  wf(build, "assets/vendor-ab12cd.js", "var v=1;");

  // 资产源：每类都刚好达到或超过 verifyDist 的下限
  wf(asset, "locales/en/menu.json", JSON.stringify({ hello: "Hello" }));
  wfN(asset, "locales/en", 99, "key"); //   1+99 = 100（下限 100）
  wfN(asset, "images", 1000, "img"); //  下限 1000
  wfN(asset, "audio", 100, "sfx"); //   下限 100
  wfN(asset, "battle-anims", 10, "anim"); //  下限 10
  wfN(asset, "fonts", 2, "font"); //   下限 2
  wf(asset, "manifest.webmanifest", JSON.stringify({ icons: [{ src: "logo128.png" }, { src: "logo512.png" }] }));
  wf(asset, "logo128.png", "P128");
  wf(asset, "logo512.png", "P512");
  wf(asset, "starter-colors.json", JSON.stringify({ c: 1 }));
  wf(asset, "exp-sprites.json", JSON.stringify({ e: 1 }));
  wf(asset, "service-worker.js", "self.addEventListener('install',()=>{});");
  wf(asset, "pkrc/config/input-config.json", JSON.stringify({ input: 1 }));

  FULL = { build, asset };
  return FULL;
}

// ---------------------------------------------------------------------------
// ① 参数解析
// ---------------------------------------------------------------------------
async function suiteArgs() {
  process.stdout.write("\n── 参数解析（--k=v 与 --k v 并存）\n");

  await test("opt 支持 --k=v（等号形式）", () => {
    R.setArgv(["--build-dir=/a/b", "--commit"]);
    assert.strictEqual(R.opt("--build-dir"), "/a/b");
    assert.strictEqual(R.flag("--commit"), true);
  });

  await test("opt 支持 --k v（空格形式）", () => {
    R.setArgv(["--build-dir", "/a/b"]);
    assert.strictEqual(R.opt("--build-dir"), "/a/b");
  });

  await test("布尔 flag 不会吞掉后面的取值", () => {
    R.setArgv(["--commit", "--keep", "2"]);
    assert.strictEqual(R.flag("--commit"), true);
    assert.strictEqual(R.opt("--keep"), "2");
  });

  await test("取值选项后面紧跟另一个 -- 选项时返回 undefined（不得把选项名当值）", () => {
    R.setArgv(["--build-dir", "--commit"]);
    assert.strictEqual(R.opt("--build-dir"), undefined);
  });

  await test("未提供的选项返回 undefined / false（便于 ?? 默认值）", () => {
    R.setArgv([]);
    assert.strictEqual(R.opt("--nope"), undefined);
    assert.strictEqual(R.flag("--nope"), false);
  });
}

// ---------------------------------------------------------------------------
// ② server.cjs 兜底响应识别
// ---------------------------------------------------------------------------
async function suiteFallback() {
  process.stdout.write("\n── 「未命中兜底响应」识别（server.cjs 有意行为）\n");

  const J = (body) => ({ headers: { "content-type": "application/json; charset=utf-8" }, body });
  const H = (body) => ({ headers: { "content-type": "text/html; charset=utf-8" }, body });

  await test("识别 200 + {ok:false} 的兜底响应", () => {
    assert.strictEqual(R.isFallbackNotFound(J('{"ok":false,"message":"File not found"}')), true);
  });

  await test("正常 JSON（ok:true）不被误判", () => {
    assert.strictEqual(R.isFallbackNotFound(J('{"ok":true}')), false);
  });

  await test("HTML 响应不被判为兜底（真实页面）", () => {
    assert.strictEqual(R.isFallbackNotFound(H("<html></html>")), false);
  });

  await test("JSON content-type 但体不是 JSON 时不抛异常", () => {
    assert.strictEqual(R.isFallbackNotFound(J("not json at all")), false);
  });

  await test("缺 headers / 空体不抛异常", () => {
    assert.strictEqual(R.isFallbackNotFound({}), false);
    assert.strictEqual(R.isFallbackNotFound({ headers: {}, body: "" }), false);
  });
}

// ---------------------------------------------------------------------------
// ③ F1 预检失败
// ---------------------------------------------------------------------------
async function suitePreflight() {
  process.stdout.write("\n── F1 预检失败（必须中止，且绝不触碰目标 / 不建暂存）\n");

  async function expectF1(name, mutate) {
    await test(name, async () => {
      const f = mkF("f1");
      let argv;
      const extraDirs = [];
      {
        // mutate 返回完整 argv；同时可记录需要额外断言的目录
        argv = mutate(f, extraDirs);
      }
      const { res } = await pub(argv);
      assert.strictEqual(res.code, 2, "F1 的退出码必须是 2");
      assert.strictEqual(res.report.step, "preflight");
      assert.ok(res.report.errors.length > 0, "必须列出失败原因");
      assert.ok(isOldDist(f.target), "F1 绝不允许触碰目标");
      assert.ok(!fs.existsSync(path.join(f.d, "st")), "F1 不该创建暂存目录");
      assert.ok(!fs.existsSync(path.join(f.d, "bk")), "F1 不该创建备份目录");
    });
  }

  await expectF1("缺 --build-dir", (f) =>
    [`--target=${f.target}`, `--asset-dir=${f.asset}`, `--staging=${path.join(f.d, "st")}`, `--backup-dir=${path.join(f.d, "bk")}`],
  );

  await expectF1("缺 --asset-dir", (f) =>
    [`--target=${f.target}`, `--build-dir=${f.build}`, `--staging=${path.join(f.d, "st")}`, `--backup-dir=${path.join(f.d, "bk")}`],
  );

  await expectF1("--build-dir 缺 index.html", (f) => {
    const bad = path.join(f.d, "no-html");
    fs.mkdirSync(path.join(bad, "assets"), { recursive: true });
    return argsF(f, [], { buildDir: bad });
  });

  await expectF1("--build-dir 缺 assets/", (f) => {
    const bad = path.join(f.d, "no-assets");
    wf(bad, "index.html", "<html></html>");
    return argsF(f, [], { buildDir: bad });
  });

  await expectF1("--asset-dir 不存在", (f) => argsF(f, [], { assetDir: path.join(f.d, "ghost") }));

  await expectF1("--target 不存在", (f) => argsF(f, [], { target: path.join(f.d, "ghost-target") }));

  await expectF1("--target 不像 dist（无 index.html）", (f) => {
    const bad = path.join(f.d, "not-dist");
    fs.mkdirSync(bad, { recursive: true });
    wf(bad, "whatever.txt", "x");
    return argsF(f, [], { target: bad });
  });

  await expectF1("--build-dir 与 --target 相同（边读边删护栏）", (f) => argsF(f, [], { buildDir: f.target }));

  await expectF1("--asset-dir 位于 --target 之内（边读边删护栏）", (f) => argsF(f, [], { assetDir: path.join(f.target, "asset") }));

  await expectF1("--backup-dir 位于 --target 之内（会被 ④ 的 rename 一并搬走）", (f) =>
    argsF(f, [], { backupDir: path.join(f.target, "backups") }),
  );

  await expectF1("--staging 位于 --target 之内（会被 ④ 的 rename 一并搬走）", (f) => argsF(f, [], { staging: path.join(f.target, "st") }));

  await expectF1("--backup-mode 非法", (f) => argsF(f, ["--backup-mode=bogus"]));

  await expectF1("--hash 非法", (f) => argsF(f, ["--hash=bogus"]));

  await expectF1("--keep 非整数", (f) => argsF(f, ["--keep=abc"]));

  await expectF1("--keep 为负数", (f) => argsF(f, ["--keep=-1"]));
}

// ---------------------------------------------------------------------------
// ④ F2 组装失败
// ---------------------------------------------------------------------------
async function suiteAssemble() {
  process.stdout.write("\n── F2 组装失败\n");

  await test("暂存无法写入（父路径是文件）→ 中止、清暂存、不触碰目标", async () => {
    const f = mkF("f2");
    const blocker = path.join(f.d, "blocker");
    fs.writeFileSync(blocker, "I am a file, not a dir");
    const { res } = await pub(argsF(f, [], { staging: path.join(blocker, "sub") }));
    assert.strictEqual(res.code, 1, "F2 的退出码是 1（不是 2）");
    assert.strictEqual(res.report.step, "assemble");
    assert.ok(isOldDist(f.target), "F2 绝不允许触碰目标");
    assert.ok(!fs.existsSync(path.join(f.d, "bk")), "F2 不该走到备份");
  });

  await test("F2 与 F3 的分工：② 只报「拷贝抛错」，合格判定归 ③（② 已关 selfCheck）", async () => {
    const f = mkF("f2b");
    const blocker = path.join(f.d, "blocker");
    fs.writeFileSync(blocker, "file");
    const { res, log } = await pub(argsF(f, ["--no-verify"], { staging: path.join(blocker, "sub") }));
    assert.strictEqual(res.report.step, "assemble", "拷贝抛错 → ② 失败");
    assert.ok(log.some((l) => /F2 组装失败/.test(l)));
    assert.ok(!log.some((l) => /F3 校验失败/.test(l)), "② 失败时不该出现 ③ 的判定（两处不得各报一次）");
  });
}

// ---------------------------------------------------------------------------
// ⑤ F3 校验失败
// ---------------------------------------------------------------------------
async function suiteVerify() {
  process.stdout.write("\n── F3 校验失败\n");

  await test("类不全（最小资产源）→ 中止、**保留暂存**供分析、不触碰目标", async () => {
    const f = mkF("f3");
    const { res } = await pub(argsF(f)); // 不带 --no-verify
    assert.strictEqual(res.code, 1);
    assert.strictEqual(res.report.step, "verify");
    assert.ok(res.report.failures.length > 0, "必须列出不合格项");
    assert.ok(isOldDist(f.target), "F3 绝不允许触碰目标");
    assert.ok(fs.existsSync(path.join(f.d, "st", "dist.new")), "F3 必须保留暂存产物供分析");
    assert.ok(!fs.existsSync(path.join(f.d, "bk")), "F3 不该走到备份");
  });

  await test("index.html 引用缺失 → 被 verifyDist 拦下（③ 复用 B-9 的判据）", async () => {
    const d = tmp("f3b");
    const build = tinyBuild(path.join(d, "build"), { brokenRef: true });
    const target = oldDist(path.join(d, "dist"));
    const { res } = await pub([
      `--target=${target}`,
      `--build-dir=${build}`,
      `--asset-dir=${tinyAsset(path.join(d, "asset"))}`,
      `--staging=${path.join(d, "st")}`,
      `--backup-dir=${path.join(d, "bk")}`,
    ]);
    assert.strictEqual(res.code, 1);
    assert.strictEqual(res.report.step, "verify");
    assert.ok(
      res.report.failures.some((x) => /引用不存在/.test(x)),
      `failures 必须包含「引用不存在」，实际：${JSON.stringify(res.report.failures)}`,
    );
    assert.ok(isOldDist(target));
  });

  await test("--no-verify 会跳过 ③ 并给出明确警告（不静默）", async () => {
    const f = mkF("f3c");
    const { res, log } = await pub(argsF(f, ["--no-verify", "--commit"]));
    // 类不全但跳过校验 → 会被 ⑦ 冒烟拦下（引用/内容层面），总之不应是「verify」步失败
    assert.notStrictEqual(res.report.step, "verify");
    assert.ok(log.some((l) => /--no-verify 跳过/.test(l)), "必须显式告警");
  });
}

// ---------------------------------------------------------------------------
// ⑥ F4 / F5 rename 失败（打桩注入）
// ---------------------------------------------------------------------------
async function suiteRename() {
  process.stdout.write("\n── F4 / F5 rename 失败（打桩 fs.renameSync 注入）\n");

  await test("F4 第一次 rename（备份）失败 → 目标未被移动，现场完好", async () => {
    const f = mkF("f4");
    const real = fs.renameSync;
    let calls = 0;
    fs.renameSync = function () {
      calls++;
      const e = new Error("EPERM: injected rename failure");
      e.code = "EPERM";
      throw e;
    };
    let out;
    try {
      out = await pub(argsF(f, ["--no-verify", "--commit"]));
    } finally {
      fs.renameSync = real;
    }
    assert.strictEqual(calls, 1, "应只在备份那一次 rename 上失败");
    assert.strictEqual(out.res.code, 1);
    assert.strictEqual(out.res.report.step, "backup");
    assert.ok(isOldDist(f.target), "rename 是原子的 → 目标必须原封不动");
  });

  await test("F5 第二次 rename（切换）失败 → 自动把备份换回目标", async () => {
    const f = mkF("f5");
    const real = fs.renameSync;
    let calls = 0;
    fs.renameSync = function (a, b) {
      calls++;
      if (calls === 2) {
        const e = new Error("EINVAL: injected switch failure");
        e.code = "EINVAL";
        throw e;
      }
      return real(a, b);
    };
    let out;
    try {
      out = await pub(argsF(f, ["--no-verify", "--commit"]));
    } finally {
      fs.renameSync = real;
    }
    assert.strictEqual(calls, 3, "备份 / 切换(失败) / 恢复 共 3 次 rename");
    assert.strictEqual(out.res.code, 1);
    assert.strictEqual(out.res.report.step, "switch");
    assert.strictEqual(out.res.report.restored, true, "必须报告已恢复");
    assert.ok(isOldDist(f.target), "目标应恢复为旧产物");
  });

  await test("F5 连「恢复」也失败 → 明确报「需要人工介入」并给出旧产物位置（不丢现场）", async () => {
    const f = mkF("f5b");
    const real = fs.renameSync;
    let calls = 0;
    fs.renameSync = function (a, b) {
      calls++;
      if (calls >= 2) throw new Error("EIO: injected");
      return real(a, b);
    };
    let out;
    try {
      out = await pub(argsF(f, ["--no-verify", "--commit"]));
    } finally {
      fs.renameSync = real;
    }
    assert.strictEqual(out.res.code, 1);
    assert.strictEqual(out.res.report.step, "switch");
    assert.ok(out.res.report.restoreError, "必须报告恢复失败的原始错误");
    assert.ok(fs.existsSync(out.res.report.backupDir), "旧产物必须仍在备份目录里（现场没丢）");
    assert.ok(isOldDist(out.res.report.backupDir), "备份里就是完整旧产物");
    assert.ok(out.log.some((l) => /人工介入/.test(l)), "必须显式提示需要人工介入");
  });
}

// ---------------------------------------------------------------------------
// ⑦ F6 冒烟失败 → 自动回滚
// ---------------------------------------------------------------------------
async function suiteSmoke() {
  process.stdout.write("\n── F6 冒烟失败 → 自动回滚\n");

  await test("smokeTest 直接调用：引用缺失必须判失败（不能被 200 兜底蒙混）", async () => {
    const d = tmp("f6s");
    const dist = tinyBuild(path.join(d, "dist"), { brokenRef: true });
    const s = await R.smokeTest(dist, 10000);
    assert.strictEqual(s.ok, false);
    const bad = s.checks.find((c) => /missing\.js/.test(c.what));
    assert.ok(bad, "必须有一条针对 missing.js 的检查");
    assert.strictEqual(bad.ok, false, "缺失引用必须判 false");
    process.stdout.write(`        （servedBy=${s.servedBy}, status=${bad.status}${bad.note ? ", " + bad.note : ""}）\n`);
  });

  await test("smokeTest 直接调用：完好的 dist 必须判通过", async () => {
    const d = tmp("f6ok");
    const dist = tinyBuild(path.join(d, "dist"));
    const s = await R.smokeTest(dist, 10000);
    assert.strictEqual(s.ok, true, JSON.stringify(s.checks));
    process.stdout.write(`        （servedBy=${s.servedBy}）\n`);
  });

  await test("F6 冒烟失败 → 自动回滚：目标恢复旧产物、坏产物留证、备份已换回", async () => {
    const d = tmp("f6");
    const build = tinyBuild(path.join(d, "build"), { brokenRef: true });
    const target = oldDist(path.join(d, "dist"));
    const { res, log } = await pub([
      `--target=${target}`,
      `--build-dir=${build}`,
      `--asset-dir=${tinyAsset(path.join(d, "asset"))}`,
      `--staging=${path.join(d, "st")}`,
      `--backup-dir=${path.join(d, "bk")}`,
      "--no-verify", // 故意跳过 ③，专测 ⑦→⑧ 这条链
      "--commit",
    ]);
    assert.strictEqual(res.code, 1, "冒烟失败必须是非零退出码");
    assert.strictEqual(res.report.step, "smoke");
    assert.strictEqual(res.report.rolledBack, true);
    assert.ok(isOldDist(target), "目标必须已回滚为旧产物");
    assert.ok(fs.existsSync(res.report.brokenDir), "坏产物必须留证");
    assert.ok(fs.existsSync(path.join(res.report.brokenDir, "index.html")), "坏产物里有 index.html");
    assert.ok(!fs.existsSync(res.report.backupDir), "备份已被 rename 回目标（不再是备份目录）");
    assert.ok(log.some((l) => /自动回滚/.test(l)));
  });
}

// ---------------------------------------------------------------------------
// ⑧ dry-run 与 happy path
// ---------------------------------------------------------------------------
async function suiteHappy() {
  process.stdout.write("\n── dry-run 与全绿 happy path\n");

  await test("dry-run：不触碰目标、不建备份，但真实组装+校验暂存（先验后发）", async () => {
    const F = full();
    const d = tmp("dry");
    const target = oldDist(path.join(d, "dist"));
    const { res, log } = await pub([
      `--target=${target}`,
      `--build-dir=${F.build}`,
      `--asset-dir=${F.asset}`,
      `--staging=${path.join(d, "st")}`,
      `--backup-dir=${path.join(d, "bk")}`,
    ]);
    assert.strictEqual(res.code, 0, "dry-run 必须成功退出");
    assert.strictEqual(res.report.step, "dry-run");
    assert.strictEqual(res.report.hashMode, "critical", "默认清单范围是 critical");
    assert.ok(isOldDist(target), "dry-run 绝不能触碰目标");
    assert.ok(!fs.existsSync(path.join(d, "bk")), "dry-run 不该创建备份目录");
    const staged = path.join(d, "st", "dist.new");
    assert.ok(fs.existsSync(staged), "dry-run 应真实组装出暂存产物");
    assert.ok(fs.existsSync(path.join(staged, "audio")), "暂存产物应是完整的 14 类");
    assert.ok(log.some((l) => /dry-run/.test(l)) && log.some((l) => /真实执行/.test(l)), "必须说明 dry-run 的真实写入范围");
  });

  await test("happy path：备份 + 原子切换 + 冒烟 + 收尾，且 SHA256SUMS 可核对", async () => {
    const F = full();
    const d = tmp("happy");
    const target = oldDist(path.join(d, "dist"), "OLD-CONTENT");
    const bkRoot = path.join(d, "bk");
    // 预置两份备份：一份「本工具命名」（受 --keep 管理）、一份「不属于本工具」（绝不能删）
    oldDist(path.join(bkRoot, "dist.20200101-010101"), "ANCIENT");
    oldDist(path.join(bkRoot, "dist.modder-backup-20261016"), "MODDER");

    const { res } = await pub([
      `--target=${target}`,
      `--build-dir=${F.build}`,
      `--asset-dir=${F.asset}`,
      `--staging=${path.join(d, "st")}`,
      `--backup-dir=${bkRoot}`,
      "--hash=critical",
      "--keep=1",
      "--commit",
    ]);

    assert.strictEqual(res.code, 0, "happy path 必须全绿");
    assert.strictEqual(res.report.step, "done");
    assert.strictEqual(res.report.smoke.ok, true, "冒烟必须通过");

    // 目标已被换成新产物
    assert.ok(!fs.existsSync(path.join(target, "OLD-MARKER.txt")), "旧标记必须已消失（真的换了）");
    assert.ok(fs.existsSync(path.join(target, "index.html")));
    assert.ok(fs.readFileSync(path.join(target, "index.html"), "utf8").includes("PKRC B-7 fixture"));
    for (const rel of ["assets/app.js", "audio", "images", "pkrc/config/input-config.json", "service-worker.js"]) {
      assert.ok(fs.existsSync(path.join(target, rel)), `新产物缺少 ${rel}`);
    }

    // 备份 = 完整旧产物 + SHA256SUMS
    const bk = res.report.backupDir;
    assert.ok(isOldDist(bk, "OLD-CONTENT"), "备份必须是切换前的旧产物");
    assert.ok(fs.existsSync(path.join(bk, "index.html")));
    const sums = path.join(bk, "SHA256SUMS");
    assert.ok(fs.existsSync(sums), "备份必须带 SHA256SUMS");

    // SHA256SUMS 内容可核对（sha256sum -c 兼容：64位hex + 两个空格 + 相对路径）
    const body = fs.readFileSync(sums, "utf8").split("\n").filter((l) => l && !l.startsWith("#"));
    assert.ok(body.length > 0, "清单不能为空");
    for (const line of body.slice(0, 8)) {
      const m = /^([0-9a-f]{64}) {2}(.+)$/.exec(line);
      assert.ok(m, `行格式必须是「64位hex + 两个空格 + 相对路径」：${line}`);
      const full2 = path.join(bk, m[2]);
      assert.ok(fs.existsSync(full2), `清单里的文件必须存在：${m[2]}`);
      const h = crypto.createHash("sha256").update(fs.readFileSync(full2)).digest("hex");
      assert.strictEqual(h, m[1], `sha256 必须匹配：${m[2]}`);
    }
    // critical 范围 = 表里 type:"file" 的类 + 标了 sha256 的目录类（assets / pkrc）；
    // 备份是**旧产物**，所以这里验的是旧产物自带的 assets/old.js
    assert.ok(body.some((l) => /  index\.html$/.test(l)), "critical 应含 index.html");
    assert.ok(body.some((l) => /  assets\/old\.js$/.test(l)), "critical 应含 assets/**");
    assert.ok(!body.some((l) => /  audio\//.test(l)), "critical 不应含大资产目录 audio/");
    assert.ok(!body.some((l) => /  images\//.test(l)), "critical 不应含大资产目录 images/");
    assert.ok(!body.some((l) => /  OLD-MARKER\.txt$/.test(l)), "非资源类的顶层散件不入 critical 清单");

    // 收尾：--keep=1 只删「本工具命名」的最旧一份
    assert.ok(!fs.existsSync(path.join(bkRoot, "dist.20200101-010101")), "--keep=1 应删掉最旧的受管备份");
    assert.ok(fs.existsSync(path.join(bkRoot, "dist.modder-backup-20261016")), "**回滚依据绝不能删**");

    process.stdout.write(`        （smoke servedBy=${res.report.smoke.servedBy}，备份 ${body.length} 条校验和）\n`);
  });

  await test("happy path 走的是产品服务（server.cjs）而不是降级迷你服务器", async () => {
    const F = full();
    const d = tmp("real-server");
    const target = oldDist(path.join(d, "dist"));
    const { res } = await pub([
      `--target=${target}`,
      `--build-dir=${F.build}`,
      `--asset-dir=${F.asset}`,
      `--staging=${path.join(d, "st")}`,
      `--backup-dir=${path.join(d, "bk")}`,
      "--keep=0",
      "--commit",
    ]);
    assert.strictEqual(res.code, 0);
    assert.strictEqual(
      res.report.smoke.servedBy,
      "server.cjs",
      "冒烟必须跑在产品服务上；若为 mini 说明 express 解析失败（降级会掩盖真实行为）",
    );
  });
}

// ---------------------------------------------------------------------------
// ⑨ rollback
// ---------------------------------------------------------------------------
async function suiteRollback() {
  process.stdout.write("\n── rollback（手动回退）\n");

  await test("--last --commit：换回备份，回退前的产物保留为 dist.rollback-*", async () => {
    const d = tmp("rb");
    const target = oldDist(path.join(d, "dist"), "NEWER");
    const bkRoot = path.join(d, "bk");
    oldDist(path.join(bkRoot, "dist.20260101-010101"), "OLDER");
    R.setArgv([`--target=${target}`, `--backup-dir=${bkRoot}`, `--staging=${path.join(d, "st")}`, "--last", "--commit"]);
    const res = await R.cmdRollback();
    assert.strictEqual(res.code, 0);
    assert.ok(isOldDist(target, "OLDER"), "目标应变成备份内容");
    assert.ok(fs.existsSync(path.join(res.report.rollbackDir, "OLD-MARKER.txt")), "回退前的产物必须留证");
    assert.ok(isOldDist(res.report.rollbackDir, "NEWER"));
    assert.ok(!fs.existsSync(path.join(bkRoot, "dist.20260101-010101")), "备份已被换走");
  });

  await test("拒绝「不像 dist」的备份（无 index.html），且不触碰目标", async () => {
    const d = tmp("rb2");
    const target = oldDist(path.join(d, "dist"), "NEWER");
    const bk = path.join(d, "bk", "dist.20260101-010101");
    fs.mkdirSync(bk, { recursive: true });
    wf(bk, "junk.txt", "junk");
    R.setArgv([`--target=${target}`, `--backup-dir=${path.join(d, "bk")}`, `--staging=${path.join(d, "st")}`, `--to=${bk}`, "--commit"]);
    const res = await R.cmdRollback();
    assert.strictEqual(res.code, 1);
    assert.ok(isOldDist(target, "NEWER"), "拒绝时必须原封不动");
  });

  await test("备份不存在 → 报错且不动目标", async () => {
    const d = tmp("rb3");
    const target = oldDist(path.join(d, "dist"), "NEWER");
    R.setArgv([
      `--target=${target}`,
      `--backup-dir=${path.join(d, "bk")}`,
      `--staging=${path.join(d, "st")}`,
      `--to=${path.join(d, "bk", "dist.20260101-010101")}`,
      "--commit",
    ]);
    const res = await R.cmdRollback();
    assert.strictEqual(res.code, 1);
    assert.ok(isOldDist(target, "NEWER"));
  });

  await test("未给 --to / --last → 打印用法（code 2），不动目标", async () => {
    const d = tmp("rb4");
    const target = oldDist(path.join(d, "dist"), "NEWER");
    R.setArgv([`--target=${target}`, `--backup-dir=${path.join(d, "bk")}`]);
    const res = await R.cmdRollback();
    assert.strictEqual(res.code, 2);
    assert.ok(isOldDist(target, "NEWER"));
  });

  await test("dry-run（无 --commit）：只打印计划，不落盘", async () => {
    const d = tmp("rb5");
    const target = oldDist(path.join(d, "dist"), "NEWER");
    const bkRoot = path.join(d, "bk");
    oldDist(path.join(bkRoot, "dist.20260101-010101"), "OLDER");
    R.setArgv([`--target=${target}`, `--backup-dir=${bkRoot}`, `--staging=${path.join(d, "st")}`, "--last"]);
    const res = await R.cmdRollback();
    assert.strictEqual(res.code, 0);
    assert.ok(isOldDist(target, "NEWER"), "dry-run 不能回退");
    assert.ok(!fs.existsSync(path.join(d, "st")), "dry-run 不该建暂存目录");
    assert.ok(fs.existsSync(path.join(bkRoot, "dist.20260101-010101")), "备份应原封不动");
  });

  await test("--last 在没有任何匹配备份时明确报错", async () => {
    const d = tmp("rb6");
    const target = oldDist(path.join(d, "dist"), "NEWER");
    const bkRoot = path.join(d, "bk");
    fs.mkdirSync(path.join(bkRoot, "dist.modder-backup-20261016"), { recursive: true });
    R.setArgv([`--target=${target}`, `--backup-dir=${bkRoot}`, "--last"]);
    const res = await R.cmdRollback();
    assert.strictEqual(res.code, 1, "非本工具命名的目录不算备份");
    assert.ok(isOldDist(target, "NEWER"));
  });

  await test("回滚是「精确恢复」：随备份回迁的 SHA256SUMS 必须被清掉（B-14 演练实测 38041→38042）", async () => {
    const d = tmp("rb-manifest");
    // ① 我们自己写的清单 → 应删
    const ours = path.join(d, "ours");
    fs.mkdirSync(ours, { recursive: true });
    fs.writeFileSync(path.join(ours, "SHA256SUMS"), "# PKRC release backup\n# files: 1\nabc  x\n");
    assert.strictEqual(R.removeRestoredManifest(ours, () => {}), true);
    assert.ok(!fs.existsSync(path.join(ours, "SHA256SUMS")), "自己写的清单必须删掉");

    // ② 产物自带的同名文件（首行不是我们的标记）→ 绝不删
    const theirs = path.join(d, "theirs");
    fs.mkdirSync(theirs, { recursive: true });
    fs.writeFileSync(path.join(theirs, "SHA256SUMS"), "deadbeef  asset.png\n");
    assert.strictEqual(R.removeRestoredManifest(theirs, () => {}), false);
    assert.ok(fs.existsSync(path.join(theirs, "SHA256SUMS")), "不能误删产物自带的同名文件");

    // ③ 没有该文件 → 返回 false，不抛异常
    const empty = path.join(d, "empty");
    fs.mkdirSync(empty, { recursive: true });
    assert.strictEqual(R.removeRestoredManifest(empty, () => {}), false);
  });

  await test("写入边界：publish 只动 target/staging/backup 三个根，存档哨兵零改动（D5）", async () => {
    const f = mkF("scope");
    const saves = path.join(f.d, "saves");
    wf(saves, "player.prsv", "SAVE-DATA");
    const before = fs.statSync(path.join(saves, "player.prsv"));

    const { res } = await pub(argsF(f, ["--no-verify", "--commit"]));
    assert.strictEqual(res.code, 0, "本用例只关心「动了哪些目录」，先确保发布本身成功");
    assert.strictEqual(res.report.hashMode, "critical", "默认清单范围必须是 critical（full 实测要 168 s）");

    assert.deepStrictEqual(fs.readdirSync(saves), ["player.prsv"], "存档目录必须零改动");
    assert.strictEqual(fs.readFileSync(path.join(saves, "player.prsv"), "utf8"), "SAVE-DATA");
    const after = fs.statSync(path.join(saves, "player.prsv"));
    assert.strictEqual(after.size, before.size);
    assert.strictEqual(after.mtimeMs, before.mtimeMs, "存档文件的 mtime 都不该被碰");
  });
}

// ---------------------------------------------------------------------------
// ⑩ list / pruneBackups 的「只删自己人」安全性
// ---------------------------------------------------------------------------
async function suiteListPrune() {
  process.stdout.write("\n── list / pruneBackups 的「只删自己人」安全性\n");

  await test("BACKUP_NAME_RE 只认 dist.<yyyyMMdd-HHmmss>", () => {
    assert.ok(R.BACKUP_NAME_RE.test("dist.20260101-010101"));
    for (const bad of [
      "dist.modder-backup-20261016",
      "dist.broken-20260103-030303",
      "dist.rollback-20260103-030303",
      "dist.new",
      "dist.20260101-0101",
      "dist.20260101-010101.bak",
      "backups",
    ]) {
      assert.ok(!R.BACKUP_NAME_RE.test(bad), `不该匹配：${bad}`);
    }
  });

  await test("pruneBackups 绝不删除非本工具命名的目录", () => {
    const d = tmp("prune");
    const bk = path.join(d, "bk");
    const managed = ["dist.20260101-010101", "dist.20260102-020202"];
    const aliens = ["dist.modder-backup-20261016", "dist.broken-20260103-030303", "dist.rollback-20260104-040404"];
    for (const n of managed.concat(aliens)) oldDist(path.join(bk, n), n);

    const removed = R.pruneBackups(bk, 1, () => {});
    assert.deepStrictEqual(removed, ["dist.20260101-010101"], "只应删最旧的受管备份");
    assert.ok(fs.existsSync(path.join(bk, "dist.20260102-020202")), "最近的受管备份要保留");
    for (const n of aliens) assert.ok(fs.existsSync(path.join(bk, n)), `绝不能删 ${n}`);
  });

  await test("--keep=0 → 不清理任何备份", () => {
    const d = tmp("prune0");
    const bk = path.join(d, "bk");
    for (const n of ["dist.20260101-010101", "dist.20260102-020202", "dist.20260103-030303"]) oldDist(path.join(bk, n), n);
    const removed = R.pruneBackups(bk, 0, () => {});
    assert.deepStrictEqual(removed, []);
    assert.strictEqual(fs.readdirSync(bk).length, 3);
  });

  await test("cmdList 标注「不受 --keep 管理」的目录", async () => {
    const d = tmp("list");
    const target = oldDist(path.join(d, "dist"));
    const bk = path.join(d, "bk");
    oldDist(path.join(bk, "dist.20260101-010101"), "A");
    oldDist(path.join(bk, "dist.modder-backup-20261016"), "M");
    R.startCapture();
    R.setArgv([`--target=${target}`, `--backup-dir=${bk}`]);
    const res = await R.cmdList();
    const cap = R.stopCapture();
    const text = cap.join("\n");
    assert.strictEqual(res.code, 0);
    assert.ok(/dist\.20260101-010101/.test(text));
    assert.ok(/dist\.modder-backup-20261016/.test(text));
    assert.ok(/不受 --keep 管理/.test(text), "必须显式标注不受管目录");
    assert.ok(/共 2 份/.test(text));
  });

  await test("cmdList 在备份根不存在时优雅退出", async () => {
    const d = tmp("list2");
    R.startCapture();
    R.setArgv([`--target=${path.join(d, "dist")}`, `--backup-dir=${path.join(d, "nope")}`]);
    const res = await R.cmdList();
    const cap = R.stopCapture();
    assert.strictEqual(res.code, 0);
    assert.ok(/尚未发布过/.test(cap.join("\n")));
  });
}

// ---------------------------------------------------------------------------
// ⑪ 工具函数
// ---------------------------------------------------------------------------
async function suiteHelpers() {
  process.stdout.write("\n── 工具函数\n");

  await test("stamp 格式为 yyyyMMdd-HHmmss", () => {
    assert.strictEqual(R.stamp(new Date(2026, 0, 2, 3, 4, 5)), "20260102-030405");
    assert.ok(/^\d{8}-\d{6}$/.test(R.stamp()));
  });

  await test("sameVolume 按卷根比较", () => {
    assert.strictEqual(R.sameVolume("D:/a/b", "D:/c"), true);
    assert.strictEqual(R.sameVolume("D:/a", "C:/a"), false);
    assert.strictEqual(R.sameVolume("/x/a", "/y/b"), true);
  });

  await test("looksLikeDist 以 index.html 为判据", () => {
    const d = tmp("ld");
    assert.strictEqual(R.looksLikeDist(d), false);
    wf(d, "index.html", "<html></html>");
    assert.strictEqual(R.looksLikeDist(d), true);
  });

  await test("spaceProbe：可写目录返回 ok 且不留探针文件", () => {
    const d = tmp("sp");
    const r = R.spaceProbe(d, 2);
    assert.strictEqual(r.ok, true, r.msg);
    assert.deepStrictEqual(fs.readdirSync(d), [], "探针文件必须删掉");
  });

  await test("spaceProbe：不可写路径返回 ok=false 而不是抛异常", () => {
    const d = tmp("sp2");
    const blocker = path.join(d, "blk");
    fs.writeFileSync(blocker, "file");
    const r = R.spaceProbe(path.join(blocker, "sub"), 1);
    assert.strictEqual(r.ok, false);
    assert.ok(typeof r.msg === "string" && r.msg.length > 0);
  });

  await test("hashTree critical 只覆盖 assets/** 与文件类；full 覆盖全部", () => {
    const d = tmp("ht");
    wf(d, "index.html", "<html></html>");
    wf(d, "assets/app.js", "x");
    wf(d, "audio/a.mp3", "x");
    wf(d, "images/i.png", "x");
    wf(d, "pkrc/config/input-config.json", "{}");

    const crit = R.hashTree(d, "critical");
    const critRels = crit.entries.map((e) => e.rel);
    assert.ok(critRels.includes("index.html"));
    assert.ok(critRels.includes("assets/app.js"));
    assert.ok(critRels.includes("pkrc/config/input-config.json"), "文件类资源应在 critical 范围内");
    assert.ok(!critRels.some((r) => r.startsWith("audio/")), "大资产目录不应在 critical 内");
    assert.ok(!critRels.some((r) => r.startsWith("images/")), "大资产目录不应在 critical 内");

    const all = R.hashTree(d, "full");
    const allRels = all.entries.map((e) => e.rel);
    assert.strictEqual(allRels.length, 5);
    assert.ok(allRels.includes("audio/a.mp3") && allRels.includes("images/i.png"));
    assert.ok(all.entries.every((e) => /^[0-9a-f]{64}$/.test(e.hash)));
  });

  await test("critical 范围由资源类表的 sha256 标记驱动（不是硬编码目录名）", () => {
    const P = require(path.join(__dirname, "asset-pipeline.cjs"));
    const flagged = P.RESOURCE_CLASSES.filter((c) => c.sha256)
      .map((c) => c.id)
      .sort();
    assert.deepStrictEqual(flagged, ["assets", "pkrc"], "只该标「体积小且不可再生」的两类");
  });

  await test("writeSumsFile 产出 sha256sum -c 兼容格式（# 开头为注释行）", () => {
    const d = tmp("sums");
    wf(d, "a.txt", "hello");
    const hash = crypto.createHash("sha256").update(fs.readFileSync(path.join(d, "a.txt"))).digest("hex");
    const f = R.writeSumsFile(d, [{ rel: "a.txt", hash, size: 5 }], { mode: "full" });
    assert.strictEqual(f, path.join(d, "SHA256SUMS"));
    const lines = fs.readFileSync(f, "utf8").split("\n").filter(Boolean);
    assert.ok(lines.every((l) => l.startsWith("#") || /^[0-9a-f]{64} {2}.+$/.test(l)), "行格式不合法");
    assert.ok(lines.some((l) => l.startsWith("# files: 1")));
    assert.ok(lines.some((l) => l === `${hash}  a.txt`));
  });

  await test("listFiles 返回排序的正斜杠相对路径", () => {
    const d = tmp("lf");
    wf(d, "b/x.txt", "x");
    wf(d, "a.txt", "x");
    wf(d, "a/y/z.txt", "x");
    assert.deepStrictEqual(R.listFiles(d), ["a.txt", "a/y/z.txt", "b/x.txt"]);
  });

  await test("copyTree 递归拷贝", () => {
    const d = tmp("ct");
    const src = path.join(d, "src");
    const dst = path.join(d, "dst");
    wf(src, "a/b/c.txt", "deep");
    R.copyTree(src, dst);
    assert.strictEqual(fs.readFileSync(path.join(dst, "a/b/c.txt"), "utf8"), "deep");
  });
}

// ---------------------------------------------------------------------------
// 主流程
// ---------------------------------------------------------------------------
(async function main() {
  process.stdout.write("PKRC · B-7 发布脚本回归测试\n");
  process.stdout.write("=".repeat(68) + "\n");
  process.stdout.write(`临时根目录：${ROOT}\n`);

  R.setQuiet(true); // 静默被测脚本的控制台输出（日志仍可 getLog/startCapture 取回）

  await suiteArgs();
  await suiteFallback();
  await suitePreflight();
  await suiteAssemble();
  await suiteVerify();
  await suiteRename();
  await suiteSmoke();
  await suiteHappy();
  await suiteRollback();
  await suiteListPrune();
  await suiteHelpers();

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
