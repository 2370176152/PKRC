/*
 * PKRC · B-13 回归一键化自身的测试（tools/test-verify-all.cjs）
 * ---------------------------------------------------------------------------
 * 为什么这个文件必须存在：
 *   `verify-all.cjs` 的价值全在**判定**上。如果它在套件失败时仍返回 0，
 *   那么 E-6（A5-02 共用回归）拿它当门禁就是**假的通过**。
 *   一个「从不失败的门禁」比没有门禁更危险。
 *   所以这里用注入的假脚本，逐条证明四种判定都真的会触发：
 *     pass   —— exit 0 且项数 ≥ min
 *     fail   —— exit ≠ 0
 *     shrink —— exit 0 但项数 < min（静默删测试）
 *     error  —— 入口不存在 / 缺解释器 / 无法 spawn
 *
 * 运行：..\shared\runtime\node.exe tools\test-verify-all.cjs
 */

"use strict";

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");

const V = require(path.join(__dirname, "verify-all.cjs"));

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

const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), "pkrc-verifyall-"));
let seq = 0;
function script(body) {
  const f = path.join(ROOT, `s${++seq}.cjs`);
  fs.writeFileSync(f, body, "utf8");
  return f;
}

/** 造一条套件定义（node 用 runtime，即当前跑本测试的解释器） */
function suite(file, min, countRe, extra) {
  return Object.assign(
    {
      id: "fake",
      name: "假套件",
      required: true,
      node: "runtime",
      file,
      cwd: ".",
      min,
      countRe,
    },
    extra || {}
  );
}

(async function main() {
  process.stdout.write("PKRC · B-13 回归一键化自测\n");
  process.stdout.write("=".repeat(68) + "\n");

  const interp = V.resolveInterpreters();
  const RE = /总计：(\d+)\s*通过/;

  await test("resolveInterpreters 至少解析出 runtime，并给出每条解释器说明", () => {
    assert.ok(interp.map.runtime, "runtime 必须可用（shared/runtime/node.exe）");
    assert.ok(Array.isArray(interp.notes) && interp.notes.length >= 1);
    assert.ok(interp.notes.some((n) => /runtime/.test(n)));
  });

  await test("pass：exit 0 且项数 ≥ min", () => {
    const f = script('console.log("总计：5 通过 / 0 失败 / 5 项");');
    const r = V.runSuite(suite(f, 5, RE), interp.map);
    assert.strictEqual(r.status, "pass", `实际 ${r.status}（${r.error || ""}）`);
    assert.strictEqual(r.count, 5);
    assert.strictEqual(r.exit, 0);
  });

  await test("fail：exit ≠ 0 → status=fail（哪怕输出里项数够）", () => {
    const f = script('console.log("总计：5 通过 / 1 失败 / 5 项");process.exitCode=1;');
    const r = V.runSuite(suite(f, 1, RE), interp.map);
    assert.strictEqual(r.status, "fail");
    assert.strictEqual(r.exit, 1);
  });

  await test("shrink：exit 0 但项数 < min → 判 shrink（防静默删测试）", () => {
    const f = script('console.log("总计：2 通过 / 0 失败 / 2 项");');
    const r = V.runSuite(suite(f, 5, RE), interp.map);
    assert.strictEqual(r.status, "shrink", "项数减少必须被抓住，不能当通过");
    assert.strictEqual(r.count, 2);
    assert.strictEqual(r.min, 5);
  });

  await test("shrink：项数解析不出来（null）时**不**误判为 shrink", () => {
    // 输出格式变了 → count=null。此时不能当"项数不足"，否则一次无关的文案改动就会误报
    const f = script('console.log("测试跑完了，但格式变了");');
    const r = V.runSuite(suite(f, 5, RE), interp.map);
    assert.strictEqual(r.status, "pass", "解析不到项数只应记为 null，不应判失败");
    assert.strictEqual(r.count, null);
  });

  await test("error：入口文件不存在", () => {
    const r = V.runSuite(suite(path.join(ROOT, "nope.cjs"), 1, RE), interp.map);
    assert.strictEqual(r.status, "error");
    assert.ok(/入口文件不存在/.test(r.error));
  });

  await test("error：缺对应解释器时明确报错而不是静默跳过", () => {
    const f = script('console.log("x");');
    const r = V.runSuite(suite(f, 1, RE, { node: "definitely-missing" }), { runtime: interp.map.runtime });
    assert.strictEqual(r.status, "error");
    assert.ok(/缺少 definitely-missing 解释器/.test(r.error));
  });

  await test("countAll：多个「全部通过：N 项」累加（输入层的实际格式）", () => {
    const f = script('console.log("全部通过：38 项");console.log("全部通过：31 项");');
    const s = suite(f, 69, /全部通过：(\d+)\s*项/g, { countAll: true });
    const r = V.runSuite(s, interp.map);
    assert.strictEqual(r.count, 69, `实际 ${r.count}`);
    assert.strictEqual(r.status, "pass");
  });

  await test("countAll：累加后低于 min 仍判 shrink", () => {
    const f = script('console.log("全部通过：10 项");console.log("全部通过：5 项");');
    const s = suite(f, 69, /全部通过：(\d+)\s*项/g, { countAll: true });
    const r = V.runSuite(s, interp.map);
    assert.strictEqual(r.count, 15);
    assert.strictEqual(r.status, "shrink");
  });

  await test("cwd 生效：套件在子目录里跑也能定位到入口", () => {
    const sub = path.join(ROOT, "sub");
    fs.mkdirSync(sub, { recursive: true });
    const f = path.join(sub, "t.cjs");
    fs.writeFileSync(f, 'console.log("cwd=" + require("path").basename(process.cwd()));console.log("总计：1 通过 / 0 失败 / 1 项");');
    const r = V.runSuite(suite(f, 1, RE, { cwd: sub }), interp.map);
    assert.strictEqual(r.status, "pass");
    assert.ok(/cwd=sub/.test(r.stdout), `实际输出：${r.stdout}`);
  });

  await test("环境变量注入生效（服务层依赖 NODE_PATH）", () => {
    const f = script('console.log("NP=" + (process.env.PKRC_TEST_ENV || ""));console.log("总计：1 通过 / 0 失败 / 1 项");');
    const r = V.runSuite(suite(f, 1, RE, { env: { PKRC_TEST_ENV: "injected" } }), interp.map);
    assert.ok(/NP=injected/.test(r.stdout), `实际输出：${r.stdout}`);
  });

  await test("契约五项都在 SUITES 里且标了 required", () => {
    const reqIds = V.SUITES.filter((s) => s.required).map((s) => s.id).sort();
    assert.deepStrictEqual(reqIds, ["gitignore", "input", "lockfile", "release", "server"]);
  });

  await test("每条套件都声明了 min 与 countRe（否则 shrink 检测形同虚设）", () => {
    for (const s of V.SUITES) {
      assert.ok(Number.isFinite(s.min), `${s.id} 缺 min`);
      assert.ok(s.countRe instanceof RegExp, `${s.id} 缺 countRe`);
      assert.ok(["runtime", "esm"].includes(s.node), `${s.id} 的 node 非法：${s.node}`);
    }
  });

  const pass = results.filter((r) => r.ok).length;
  const fail = results.length - pass;
  process.stdout.write("\n" + "=".repeat(68) + "\n");
  process.stdout.write(`总计：${pass} 通过 / ${fail} 失败 / ${results.length} 项\n`);
  if (fail > 0) {
    process.stdout.write("\n失败明细：\n");
    for (const r of results.filter((x) => !x.ok)) process.stdout.write(`  · ${r.name}\n    ${r.err && r.err.message}\n`);
    process.exitCode = 1;
  }
})();
