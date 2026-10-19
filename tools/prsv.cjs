/*
 * PKRC · `.prsv` 编解码器（tools/prsv.cjs）· B-15
 * ---------------------------------------------------------------------------
 * 派单：`docs/delegation/32-第五阶段任务分发.md` §六 B-15
 * 用途：给 A4-03 #7「存档字节级往返」提供**不依赖浏览器 / 不依赖 crypto-js** 的编解码，
 *       让全栈能在 Node 里直接读、写、验 `.prsv`。
 *
 * ===========================================================================
 * 🔴 事实基线（2026-10-19 从锚点源码核实，推翻两处既有说法）
 * ===========================================================================
 *
 * 【事实 1】`.prsv` = **纯 AES**，全代码库**没有 BlowFish**
 *   锚点 `src/system/game-data.ts:1359 tryExportData()`：
 *       const encryptedData = AES.encrypt(data, saveKey);
 *       const blob = new Blob([encryptedData.toString()], { type: "text/json" });
 *       link.download = `${dataKey}.prsv`;
 *   `saveKey` 来自 `src/constants.ts:56` = "x0i2O7WRiANTqPmZ"。
 *   `grep -rln "BlowFish|blowfish" src/` → **零命中**。
 *   ⇒ `A4-03-存档往返验证报告.md` §5 的「`.prsv` 层 = BlowFish（产物符号 qo/FI）」
 *     是**误读压缩符号**；按它去「提取 BlowFish 函数体」会扑空。
 *
 * 【事实 2】localStorage 里的存档**不是 AES**（离线模式下）
 *   锚点 `src/utils/data.ts:47`：
 *       export function encrypt(data, bypassLogin) {
 *         if (bypassLogin) return btoa(encodeURIComponent(data));   // ← 离线：只是 base64
 *         return AES.encrypt(data, saveKey).toString();             // ← 在线：AES
 *       }
 *   ⇒ 「导出」这一步**永远**做 AES（无论是否离线），而「落 localStorage」离线时只做 base64。
 *     这解释了一个常见困惑：为什么拿到的 `.prsv` 是 `U2FsdGVkX1…` 而 localStorage 里是 `JTdC…`。
 *
 * 【事实 3】❗**逐字节相等在数学上不可能**
 *   `CryptoJS.AES.encrypt(passphrase)` 用 OpenSSL KDF：每次调用生成**随机 8 字节 salt**，
 *   密文前缀固定为 `Salted__`。同一份明文两次加密 ⇒ **密文不同**。
 *   ⇒ A4-03 §5 的补验路径①「解密→重新序列化→加密，断言**逐字节等价**」**永远不可能通过**。
 *     正确的往返判据见本文件末尾 §判据。
 *
 * ===========================================================================
 * §判据（给 A4-03 #7 的正确写法）
 * ===========================================================================
 *   ❌ 错：export1.bytes === export2.bytes                （随机 salt，必然不等）
 *   ✅ 对：decrypt(export1) === decrypt(export2)          （明文逐字节相等）
 *   ✅ 对：JSON.parse(decrypt(x)) 深比较（字段级，与 A4-03 Part 1~4 已有口径一致）
 *   ✅ 对：structurallyEqual(decrypt(a), decrypt(b))  —— 本文件提供，用于忽略 JSON 键序
 *
 * 语法上限：Node 16 可跑。依赖：零新增（只用 `crypto`）。
 */

"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

/** 上游 `src/constants.ts:56` 的 saveKey（CryptoJS passphrase） */
const SAVE_KEY = "x0i2O7WRiANTqPmZ";

/** CryptoJS `Salted__` 头的 base64 表示 —— 所有 `.prsv` 都以它开头 */
const SALTED_B64 = "U2FsdGVkX1";
const SALTED_BYTES = Buffer.from("Salted__", "utf8");

/**
 * OpenSSL `EVP_BytesToKey`（MD5，1 轮，无 salt 前缀派生）。
 * CryptoJS 的 `AES.encrypt(data, passphrase)` 用的就是这套 —— 必须逐字节一致，
 * 否则产物无法被游戏解出来。
 *
 * @param {Buffer} passBytes
 * @param {Buffer} salt
 * @param {number} keyLen
 * @param {number} ivLen
 */
function evpBytesToKey(passBytes, salt, keyLen, ivLen) {
  const parts = [];
  let prev = Buffer.alloc(0);
  let total = 0;
  const need = keyLen + ivLen;
  while (total < need) {
    prev = crypto.createHash("md5").update(Buffer.concat([prev, passBytes, salt])).digest();
    parts.push(prev);
    total += prev.length;
  }
  const all = Buffer.concat(parts);
  return { key: all.subarray(0, keyLen), iv: all.subarray(keyLen, keyLen + ivLen) };
}

/**
 * 加密明文 → CryptoJS 兼容的 `.prsv` 文本。
 *
 * @param {string} plaintext  必须是合法 JSON 文本（游戏的 tryExportData 也要求 charAt(0)==='{'）
 * @param {object} [o]
 * @param {string} [o.key]    passphrase，默认 SAVE_KEY
 * @param {Buffer} [o.salt]   **仅测试用**：固定 salt 以复现同一密文（生产不要传）
 * @returns {string} base64（`U2FsdGVkX1…`）
 */
function encryptPsv(plaintext, o = {}) {
  const key = o.key || SAVE_KEY;
  if (typeof plaintext !== "string") throw new TypeError("plaintext 必须是字符串");
  const salt = o.salt && o.salt.length === 8 ? o.salt : crypto.randomBytes(8);
  const { key: k, iv } = evpBytesToKey(Buffer.from(key, "utf8"), salt, 32, 16);
  const cipher = crypto.createCipheriv("aes-256-cbc", k, iv);
  const ct = Buffer.concat([cipher.update(Buffer.from(plaintext, "utf8")), cipher.final()]);
  return Buffer.concat([SALTED_BYTES, salt, ct]).toString("base64");
}

/**
 * 解密 `.prsv` 文本 → 明文。
 * @param {string} cipherText base64（可含首尾空白）
 * @param {object} [o]
 * @param {string} [o.key]
 * @returns {string}
 */
function decryptPsv(cipherText, o = {}) {
  const key = o.key || SAVE_KEY;
  const buf = Buffer.from(String(cipherText).trim(), "base64");
  if (buf.length < 16 || !buf.subarray(0, 8).equals(SALTED_BYTES)) {
    throw new Error("不是 `.prsv` 格式：缺少 `Salted__` 头（是不是把 localStorage 的 base64 当成 .prsv 了？）");
  }
  const salt = buf.subarray(8, 16);
  const ct = buf.subarray(16);
  const { key: k, iv } = evpBytesToKey(Buffer.from(key, "utf8"), salt, 32, 16);
  const d = crypto.createDecipheriv("aes-256-cbc", k, iv);
  return Buffer.concat([d.update(ct), d.final()]).toString("utf8");
}

/** 粗判是否 `.prsv`（只看头，不验证能否解出） */
function looksLikePsv(text) {
  return String(text).trim().startsWith(SALTED_B64);
}

// ---------------------------------------------------------------------------
// 离线 localStorage 形态（bypassLogin=true）
// ---------------------------------------------------------------------------
/**
 * 复刻 `encrypt(data, bypassLogin=true)` = `btoa(encodeURIComponent(data))`。
 * ⚠️ 这是**未加密**的，只是 base64 —— 不要把它当成 `.prsv`。
 */
function encodeLocalStorage(plaintext) {
  return Buffer.from(encodeURIComponent(String(plaintext)), "utf8").toString("base64");
}

/** 复刻 `decrypt(data, bypassLogin=true)` = `decodeURIComponent(atob(data))` */
function decodeLocalStorage(value) {
  return decodeURIComponent(Buffer.from(String(value).trim(), "base64").toString("utf8"));
}

// ---------------------------------------------------------------------------
// 工具
// ---------------------------------------------------------------------------
/**
 * 结构相等比较（忽略 JSON 键序，但**区分**数组顺序与 null/空数组）。
 *
 * 为什么不用 JSON.stringify 比对：键序不同会导致假不等；
 * 而 `null` 与 `[]` 必须区分（本项目已踩过 4 次「null ≠ []」的坑）。
 */
function structurallyEqual(a, b, pathStr = "$") {
  const diffs = [];
  (function walk(x, y, p) {
    if (x === y) return;
    if (x === null || y === null) {
      if (x !== y) diffs.push(`${p}: ${JSON.stringify(x)} ≠ ${JSON.stringify(y)}`);
      return;
    }
    const tx = typeof x;
    const ty = typeof y;
    if (tx !== ty) {
      diffs.push(`${p}: 类型不同 ${tx} ≠ ${ty}`);
      return;
    }
    if (tx !== "object") {
      if (x !== y) diffs.push(`${p}: ${JSON.stringify(x)} ≠ ${JSON.stringify(y)}`);
      return;
    }
    const ax = Array.isArray(x);
    const ay = Array.isArray(y);
    if (ax !== ay) {
      diffs.push(`${p}: 数组/对象不同（⚠ null≠[] 是本项目高发坑）`);
      return;
    }
    if (ax) {
      if (x.length !== y.length) diffs.push(`${p}: 数组长度 ${x.length} ≠ ${y.length}`);
      for (let i = 0; i < Math.min(x.length, y.length); i++) walk(x[i], y[i], `${p}[${i}]`);
      return;
    }
    const kx = Object.keys(x).sort();
    const ky = Object.keys(y).sort();
    const onlyX = kx.filter((k) => !ky.includes(k));
    const onlyY = ky.filter((k) => !kx.includes(k));
    if (onlyX.length) diffs.push(`${p}: 仅左侧有键 ${onlyX.join(",")}`);
    if (onlyY.length) diffs.push(`${p}: 仅右侧有键 ${onlyY.join(",")}`);
    for (const k of kx) if (ky.includes(k)) walk(x[k], y[k], `${p}.${k}`);
  })(a, b, pathStr);
  return diffs;
}

/** 存档大体形状摘要（给报告/排查用，不解释业务含义） */
function summarize(plaintext) {
  const j = JSON.parse(plaintext);
  const out = { topLevelKeys: Object.keys(j).sort(), fields: {} };
  for (const [k, v] of Object.entries(j)) {
    if (v === null) out.fields[k] = "null";
    else if (Array.isArray(v)) out.fields[k] = `array(${v.length})`;
    else if (typeof v === "object") out.fields[k] = `object(${Object.keys(v).length})`;
    else out.fields[k] = `${typeof v}:${String(v).slice(0, 24)}`;
  }
  return out;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
const ARGV = process.argv.slice(2);
const flag = (n) => ARGV.includes(n);
const opt = (n) => {
  const eq = ARGV.find((a) => a.startsWith(n + "="));
  if (eq !== undefined) return eq.slice(n.length + 1);
  const i = ARGV.findIndex((a) => a === n);
  if (i >= 0 && ARGV[i + 1] !== undefined && !ARGV[i + 1].startsWith("--")) return ARGV[i + 1];
  return undefined;
};
const posArgs = ARGV.filter((a, i) => !a.startsWith("-") && (i === 0 || !ARGV[i - 1].startsWith("--")));
const cmd = posArgs[0] || "help";

function printHelp() {
  process.stdout.write(
    [
      "PKRC `.prsv` 编解码器（tools/prsv.cjs）· B-15",
      "",
      "用法：",
      "  node tools/prsv.cjs inspect <file.prsv>         # 解出明文并打印字段摘要",
      "  node tools/prsv.cjs decrypt <file.prsv> [--out=<x.json>]",
      "  node tools/prsv.cjs encrypt <x.json>   [--out=<x.prsv>]",
      "  node tools/prsv.cjs roundtrip <file.prsv>       # 往返验证（见下）",
      "  node tools/prsv.cjs local <sessionData_*.txt>   # 解离线 localStorage 形态（base64）",
      "",
      "roundtrip 做什么：",
      "  a) decrypt → encrypt → decrypt          明文逐字节相等？",
      "  b) 两次 encrypt 的**密文是否相同**      → 预期 **不同**（随机 salt），并解释为什么",
      "  c) structurallyEqual(明文1, 明文2)      字段级一致？",
      "",
      "🔴 关键事实：`.prsv` = AES(明文, \"x0i2O7WRiANTqPmZ\")，每次加密的 salt 随机",
      "   ⇒ **字节级相等不可能**，正确判据是「解密后明文相等」。详见文件头注释。",
    ].join("\n")
  );
}

function readText(f) {
  return fs.readFileSync(f, "utf8");
}

function main() {
  if (cmd === "help" || flag("--help") || flag("-h")) return printHelp(), 0;

  if (cmd === "inspect") {
    const f = posArgs[1];
    if (!f) return process.stderr.write("用法：inspect <file.prsv>\n"), 2;
    const txt = readText(f);
    if (!looksLikePsv(txt)) {
      process.stderr.write(`❌ 不是 .prsv：${f}（前缀 ${txt.slice(0, 16)}…）\n`);
      return 1;
    }
    const plain = decryptPsv(txt);
    const sum = summarize(plain);
    process.stdout.write(`文件    ：${f}\n`);
    process.stdout.write(`密文长度：${txt.trim().length} 字符（base64）\n`);
    process.stdout.write(`明文长度：${Buffer.byteLength(plain, "utf8")} 字节\n`);
    process.stdout.write(`合法 JSON：${plain.trim().startsWith("{") ? "是" : "否"}\n`);
    process.stdout.write(`顶层字段 ${sum.topLevelKeys.length} 个：${sum.topLevelKeys.join(", ")}\n`);
    process.stdout.write("\n字段形状：\n");
    for (const k of sum.topLevelKeys) process.stdout.write(`  ${k.padEnd(26)}${sum.fields[k]}\n`);
    return 0;
  }

  if (cmd === "decrypt") {
    const f = posArgs[1];
    if (!f) return process.stderr.write("用法：decrypt <file.prsv> [--out=x.json]\n"), 2;
    const plain = decryptPsv(readText(f));
    const out = opt("--out");
    if (out) {
      fs.writeFileSync(out, plain, "utf8");
      process.stdout.write(`✅ 明文已写入 ${out}（${Buffer.byteLength(plain)} 字节）\n`);
    } else {
      process.stdout.write(plain + "\n");
    }
    return 0;
  }

  if (cmd === "encrypt") {
    const f = posArgs[1];
    if (!f) return process.stderr.write("用法：encrypt <x.json> [--out=x.prsv]\n"), 2;
    const plain = readText(f);
    if (!plain.trim().startsWith("{")) {
      process.stderr.write("❌ 明文不是以 { 开头 —— 游戏的 tryExportData 会拒绝（它只做 charAt(0)==='{' 的检查）\n");
      return 1;
    }
    const psv = encryptPsv(plain);
    const out = opt("--out");
    if (out) {
      fs.writeFileSync(out, psv, "utf8");
      process.stdout.write(`✅ 已写入 ${out}（${psv.length} 字符）\n`);
    } else {
      process.stdout.write(psv + "\n");
    }
    return 0;
  }

  if (cmd === "roundtrip") {
    const f = posArgs[1];
    if (!f) return process.stderr.write("用法：roundtrip <file.prsv>\n"), 2;
    const src = readText(f);
    const p1 = decryptPsv(src);
    const e1 = encryptPsv(p1);
    const p2 = decryptPsv(e1);
    const e2 = encryptPsv(p1);
    const p3 = decryptPsv(e2);

    process.stdout.write("PKRC `.prsv` 往返验证（B-15）\n");
    process.stdout.write("=".repeat(64) + "\n");
    process.stdout.write(`源文件        ：${f}\n`);
    process.stdout.write(`源密文长度    ：${src.trim().length}\n`);
    process.stdout.write(`明文长度      ：${Buffer.byteLength(p1, "utf8")} 字节\n\n`);

    let ok = true;
    const c1 = p1 === p2;
    process.stdout.write(`(a) 解密 → 加密 → 解密，明文逐字节相等：${c1 ? "✅" : "❌"}\n`);
    if (!c1) ok = false;

    const c2 = e1.trim() === e2.trim();
    process.stdout.write(
      `(b) 两次加密的密文相同？：${c2 ? "⚠ 相同（salt 被固定了？）" : "不同 ✅（预期，随机 salt）"}\n`
    );
    if (c2) {
      process.stdout.write("     ⇒ 若你认为应该相同，那是把「字节级相等」当判据了 —— 见文件头 §事实 3\n");
    }

    const p3ok = p3 === p1;
    process.stdout.write(`(c) 第二次加密后仍能解回同一明文：${p3ok ? "✅" : "❌"}\n`);
    if (!p3ok) ok = false;

    let diffs = [];
    try {
      diffs = structurallyEqual(JSON.parse(p1), JSON.parse(p3));
    } catch (e) {
      diffs = [`解析失败：${e.message}`];
      ok = false;
    }
    process.stdout.write(`(d) 结构相等（忽略键序，区分 null/[]）：${diffs.length === 0 ? "✅" : `❌ ${diffs.length} 处差异`}\n`);
    for (const d of diffs.slice(0, 10)) process.stdout.write(`     · ${d}\n`);
    if (diffs.length) ok = false;

    process.stdout.write("\n" + "-".repeat(64) + "\n");
    process.stdout.write(
      ok
        ? "✅ 格式层往返通过。注意：**密文永远不相等**是设计使然，不要把字节比对当判据。\n"
        : "❌ 往返失败。\n"
    );
    return ok ? 0 : 1;
  }

  if (cmd === "local") {
    const f = posArgs[1];
    if (!f) return process.stderr.write("用法：local <sessionData_*.txt>\n"), 2;
    const plain = decodeLocalStorage(readText(f));
    process.stdout.write(plain + "\n");
    return 0;
  }

  process.stderr.write(`未知子命令：${cmd}（可用：inspect / decrypt / encrypt / roundtrip / local / help）\n`);
  return 2;
}

if (require.main === module) {
  process.exitCode = main();
}

module.exports = {
  SAVE_KEY,
  evpBytesToKey,
  encryptPsv,
  decryptPsv,
  looksLikePsv,
  encodeLocalStorage,
  decodeLocalStorage,
  structurallyEqual,
  summarize,
};
