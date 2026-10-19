/*
 * PKRC · `.prsv` 编解码器回归测试（tools/test-prsv.cjs）· B-15
 * ---------------------------------------------------------------------------
 * 这个文件的价值在于**钉住算法**，而不是"跑一遍没崩"：
 *   ① 已知答案向量（固定 salt）—— 一旦 KDF / 加密模式 / padding 被改动，立刻红
 *   ② 与 **OpenSSL 3.5.7 独立实现**逐字节比对（硬编码其密文段）—— 证明不是"自洽但错"
 *   ③ 真实游戏存档（若在 .build-tools 里存在）—— 证明能解真数据；不存在则**跳过并说明**
 *   ④ `null ≠ []`、键序无关 —— 本项目高发坑，必须区分
 *
 * 运行：..\shared\runtime\node.exe tools\test-prsv.cjs
 */

"use strict";

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");

const P = require(path.join(__dirname, "prsv.cjs"));

const results = [];
const skips = [];
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
function skip(name, why) {
  skips.push({ name, why });
  process.stdout.write(`  SKIP  ${name}  —— ${why}\n`);
}

// 用于固定 salt 的向量
const ZERO_SALT = Buffer.from("0000000000000000", "hex");
const VECTOR_PLAIN = '{"k":"v"}';
/** OpenSSL 3.5.7: printf '{"k":"v"}' | openssl enc -aes-256-cbc -md md5 -k x0i2O7WRiANTqPmZ -S 0000000000000000 -base64 -A */
const VECTOR_CT_FROM_OPENSSL = "W+mczdi6LPeQ2XVdfjH+gg==";
/** 我实现的完整输出（Salted__ + salt + ct） */
const VECTOR_FULL = "U2FsdGVkX18AAAAAAAAAAFvpnM3Yuiz3kNl1XX4x/oI=";

(async function main() {
  process.stdout.write("PKRC · B-15 `.prsv` 编解码器回归测试\n");
  process.stdout.write("=".repeat(68) + "\n");

  // -------------------------------------------------------------------------
  process.stdout.write("\n── 算法正确性（三重确认）\n");

  await test("已知答案向量：固定 salt 输出固定密文", () => {
    assert.strictEqual(P.encryptPsv(VECTOR_PLAIN, { salt: ZERO_SALT }), VECTOR_FULL);
  });

  await test("与 OpenSSL 3.5.7 独立实现**逐字节一致**", () => {
    const buf = Buffer.from(P.encryptPsv(VECTOR_PLAIN, { salt: ZERO_SALT }), "base64");
    assert.strictEqual(buf.subarray(0, 8).toString("utf8"), "Salted__", "必须带 OpenSSL 头");
    assert.strictEqual(buf.subarray(8, 16).toString("hex"), ZERO_SALT.toString("hex"), "salt 必须原样写入");
    assert.strictEqual(buf.subarray(16).toString("base64"), VECTOR_CT_FROM_OPENSSL, "密文段必须与 openssl 相同");
  });

  await test("头部固定为 `U2FsdGVkX1`（= base64('Salted__')）", () => {
    for (let i = 0; i < 5; i++) assert.ok(P.encryptPsv(VECTOR_PLAIN).startsWith("U2FsdGVkX1"));
  });

  await test("随机 salt ⇒ 同一明文的两次密文**必然不同**（这是 A4-03 判据的关键）", () => {
    const a = P.encryptPsv(VECTOR_PLAIN);
    const b = P.encryptPsv(VECTOR_PLAIN);
    assert.notStrictEqual(a, b, "若相同说明 salt 被写死了");
    assert.strictEqual(P.decryptPsv(a), P.decryptPsv(b), "但解出来必须一样");
  });

  await test("固定 salt ⇒ 确定性（用于复现与向量测试）", () => {
    assert.strictEqual(
      P.encryptPsv(VECTOR_PLAIN, { salt: ZERO_SALT }),
      P.encryptPsv(VECTOR_PLAIN, { salt: ZERO_SALT })
    );
  });

  // -------------------------------------------------------------------------
  process.stdout.write("\n── 往返（含非 ASCII）\n");

  await test("ASCII 往返：encrypt → decrypt 逐字节相等", () => {
    const s = JSON.stringify({ a: 1, b: [1, 2], c: null });
    assert.strictEqual(P.decryptPsv(P.encryptPsv(s)), s);
  });

  await test("非 ASCII 往返（中文 / emoji / 换行）", () => {
    const s = JSON.stringify({ name: "宝可梦", tag: "🔥", note: "第一行\n第二行" });
    assert.strictEqual(P.decryptPsv(P.encryptPsv(s)), s);
  });

  await test("大文本往返（200 KB）", () => {
    const s = JSON.stringify({ blob: "x".repeat(200 * 1024) });
    assert.strictEqual(P.decryptPsv(P.encryptPsv(s)), s);
  });

  await test("密文首尾空白被容忍（文件常有换行）", () => {
    const c = P.encryptPsv(VECTOR_PLAIN);
    assert.strictEqual(P.decryptPsv("  " + c + "\n"), VECTOR_PLAIN);
  });

  // -------------------------------------------------------------------------
  process.stdout.write("\n── 错误路径（报错要可操作，不能静默）\n");

  await test("把 localStorage 的 base64 当 .prsv 解 ⇒ 明确报错并给出线索", () => {
    const local = P.encodeLocalStorage(VECTOR_PLAIN);
    assert.throws(
      () => P.decryptPsv(local),
      (e) => /Salted__/.test(e.message) && /localStorage/.test(e.message),
      "错误信息必须点出「你可能把 localStorage 形态当成 .prsv 了」"
    );
  });

  await test("空串 / 乱码 ⇒ 报错而不是返回空字符串", () => {
    assert.throws(() => P.decryptPsv(""), /Salted__/);
    assert.throws(() => P.decryptPsv("bm90LWEtcHJzdg=="), /Salted__/);
  });

  await test("篡改密文**不会**静默解出同一明文", () => {
    const c = Buffer.from(P.encryptPsv(VECTOR_PLAIN), "base64");
    const i = c.length - 1;
    c[i] = c[i] ^ 0xff;
    let out = null;
    try {
      out = P.decryptPsv(c.toString("base64"));
    } catch {
      out = null; // padding 校验失败也算"检测到"
    }
    assert.notStrictEqual(out, VECTOR_PLAIN, "CBC 无认证，但绝不允许改字节后还解出原文");
  });

  await test("encrypt 拒绝非字符串输入", () => {
    assert.throws(() => P.encryptPsv({ not: "a string" }), /必须是字符串/);
  });

  // -------------------------------------------------------------------------
  process.stdout.write("\n── 两种「存档形态」不可混用\n");

  await test("localStorage 形态 = btoa(encodeURIComponent(x))，与离线 encrypt() 等价", () => {
    for (const s of [VECTOR_PLAIN, '{"n":"宝可梦"}', '{"e":"🔥"}']) {
      assert.strictEqual(P.encodeLocalStorage(s), Buffer.from(encodeURIComponent(s), "utf8").toString("base64"));
      assert.strictEqual(P.decodeLocalStorage(P.encodeLocalStorage(s)), s);
    }
  });

  await test("两种形态前缀不同（JTdC… vs U2FsdGVkX1…），looksLikePsv 能区分", () => {
    assert.ok(P.looksLikePsv(P.encryptPsv(VECTOR_PLAIN)));
    assert.ok(!P.looksLikePsv(P.encodeLocalStorage(VECTOR_PLAIN)));
  });

  // -------------------------------------------------------------------------
  process.stdout.write("\n── structurallyEqual（往返判据用）\n");

  await test("键序不同不算差异", () => {
    assert.deepStrictEqual(P.structurallyEqual({ a: 1, b: 2 }, { b: 2, a: 1 }), []);
  });

  await test("null 与 [] 必须判为不同（本项目高发坑）", () => {
    const d = P.structurallyEqual({ m: null }, { m: [] });
    assert.strictEqual(d.length, 1);
    assert.ok(/null\s*≠\s*\[\]|数组\/对象不同/.test(d[0]), d[0]);
  });

  await test("数组顺序敏感、长度差异被发现", () => {
    // [1,2] vs [2,1] 两个位置都不同 ⇒ 报 2 处（如实反映，不做"整体算一处"的偷懒）
    assert.strictEqual(P.structurallyEqual([1, 2], [2, 1]).length, 2);
    assert.strictEqual(P.structurallyEqual([1], [1, 2]).length, 1);
  });

  await test("嵌套差异能定位到路径", () => {
    const d = P.structurallyEqual({ a: { b: [0, { c: 1 }] } }, { a: { b: [0, { c: 2 }] } });
    assert.strictEqual(d.length, 1);
    assert.ok(d[0].startsWith("$.a.b[1].c"), d[0]);
  });

  await test("仅一侧有的键被点名", () => {
    const d = P.structurallyEqual({ a: 1 }, { a: 1, b: 2 });
    assert.ok(d.some((x) => /仅右侧有键 b/.test(x)), JSON.stringify(d));
  });

  // -------------------------------------------------------------------------
  process.stdout.write("\n── summarize\n");

  await test("summarize 如实标注 null / 数组长度 / 对象键数", () => {
    const s = P.summarize(JSON.stringify({ a: null, b: [], c: [1, 2, 3], d: { x: 1 }, e: "str", f: 7 }));
    assert.strictEqual(s.fields.a, "null");
    assert.strictEqual(s.fields.b, "array(0)");
    assert.strictEqual(s.fields.c, "array(3)");
    assert.strictEqual(s.fields.d, "object(1)");
    assert.ok(s.fields.e.startsWith("string:"));
    assert.ok(s.fields.f.startsWith("number:"));
  });

  // -------------------------------------------------------------------------
  process.stdout.write("\n── 真实游戏存档（若存在）\n");

  const realDir = path.join(__dirname, "..", ".build-tools", "probe", "prsv-orig");
  const realFiles = fs.existsSync(realDir) ? fs.readdirSync(realDir).filter((f) => f.endsWith(".prsv")) : [];
  if (!realFiles.length) {
    skip("解真实游戏存档", "`.build-tools/probe/prsv-orig/` 无样本（该目录 gitignored，需从 PKRC.zip 提取）");
  } else {
    for (const f of realFiles.slice(0, 2)) {
      await test(`解真实存档 ${f} 并往返`, () => {
        const cipher = fs.readFileSync(path.join(realDir, f), "utf8");
        const plain = P.decryptPsv(cipher);
        assert.ok(plain.trim().startsWith("{"), "明文必须是 JSON");
        const j = JSON.parse(plain);
        assert.ok(Object.keys(j).length >= 10, `顶层字段只有 ${Object.keys(j).length} 个`);
        assert.ok(typeof j.gameVersion === "string", "应含 gameVersion");
        // 往返：再加密再解密，明文必须逐字节相等
        assert.strictEqual(P.decryptPsv(P.encryptPsv(plain)), plain);
        // 结构相等
        assert.deepStrictEqual(P.structurallyEqual(j, JSON.parse(P.decryptPsv(P.encryptPsv(plain)))), []);
        // 密文必须不同（随机 salt）
        assert.notStrictEqual(P.encryptPsv(plain), P.encryptPsv(plain));
        process.stdout.write(
          `        （${f}：${cipher.trim().length} 字符 → ${Buffer.byteLength(plain)} 字节，gameVersion=${j.gameVersion}）\n`
        );
      });
    }
  }

  // -------------------------------------------------------------------------
  const pass = results.filter((r) => r.ok).length;
  const fail = results.length - pass;
  process.stdout.write("\n" + "=".repeat(68) + "\n");
  process.stdout.write(`总计：${pass} 通过 / ${fail} 失败 / ${results.length} 项`);
  if (skips.length) process.stdout.write(`（另有 ${skips.length} 项跳过）`);
  process.stdout.write("\n");
  if (fail > 0) {
    process.stdout.write("\n失败明细：\n");
    for (const r of results.filter((x) => !x.ok)) process.stdout.write(`  · ${r.name}\n    ${r.err && r.err.message}\n`);
    process.exitCode = 1;
  }
})();
