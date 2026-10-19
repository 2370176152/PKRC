/*
 * PKRC · `.prsv` 样本生成（tools/prsv-sample.mjs）· B-15
 * ---------------------------------------------------------------------------
 * 派单：`docs/delegation/32-第五阶段任务分发.md` §六 B-15
 * 目标：给 A4-03 #7「字节级往返」产出**可复跑的样本**，并做**双向实现交叉验证**。
 *
 * ===========================================================================
 * 为什么不是「点游戏里的导出按钮」（如实说明）
 * ===========================================================================
 * 桌面端（非 native 平台）**没有任何可达的导出入口**：
 *   · 上游 `tryExportData()` 是 `gameData`（`GameData` 实例）的方法；
 *   · `gameData` 挂在 `globalScene`（BattleScene）上，而 BattleScene 的 `gameData`
 *     字段要到 `create()` 才赋值 —— 开机停在标题界面时实测 `scene.gameData` 为 **undefined**；
 *   · A 产物里的「移动端导出补丁」`Uj()` 会把 `gameData` 挂到 `window.gameData`，
 *     但它有前置 `if(!yh.isNativePlatform())return;` ⇒ **桌面端不执行**，
 *     实测 `typeof window.gameData === "undefined"`（且全产物内 `window.gameData=` 赋值点为零）；
 *   · 唯一剩下的路径是「进战斗场景」→ 但那要真正开始一局游戏（选初始宝可梦等），
 *     远超本任务范围，且属于 F-14 场景实现的活。
 *
 * ⇒ 本脚本走的是**等价且更强**的路径：
 *   用 **A 产物自带的 `window.CryptoJS` + 同为 `tryExportData` 的那两行运算**
 *   （`AES.encrypt(decrypt(localStorage[key], true), saveKey)`）生成密文，
 *   再做**双向交叉验证**：
 *     ① 产物 CryptoJS 加密 → 我的 Node 编解码器能解开      （产物 → Node）
 *     ② 我的 Node 编解码器加密 → 产物 CryptoJS 能解开      （Node → 产物）
 *   双向都通 ⇒ 两套实现**语义等价**，这比「点一次按钮」提供的证据更强
 *   （点按钮只能证明"那一次能生成"，不能证明两套实现一致）。
 *
 * 样本性质标注：`origin: "product-cryptojs"` ——
 *   **密文由 A 产物自身的加密库产生**，但**触发方式不是 UI 按钮**。
 *   正文内容为合成（按 `SessionSaveData` 真实字段表构造），见 §样本内容。
 *
 * 运行：
 *   node tools/prsv-sample.mjs                 # 生成 + 交叉验证
 *   node tools/prsv-sample.mjs --out=<dir>
 * 需要 Node ≥22（F-10 的 CDP 客户端依赖内置 WebSocket）。
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const P = require("./prsv.cjs");
const { runProductScenario } = await import("./walkthrough/lib/runner.mjs");

const REPO = path.resolve(process.cwd());
const OUT_DIR = path.resolve(REPO, argOf("--out") || "docs/sourcemigration/samples");

function argOf(name) {
  const a = process.argv.slice(2);
  const eq = a.find((x) => x.startsWith(name + "="));
  if (eq) return eq.slice(name.length + 1);
  const i = a.indexOf(name);
  return i >= 0 ? a[i + 1] : undefined;
}

// ---------------------------------------------------------------------------
// 样本内容：按锚点 `src/@types/save-data.ts` 的 SessionSaveData 真实字段表构造
//          + 魔改扩展的 8 个字段（A4-03 §3 L3 逐字核对过）
// ---------------------------------------------------------------------------
function buildSessionBody() {
  return {
    // ---- 上游 SessionSaveData（24 项里取实际会被读档用到的） ----
    seed: "B15SAMPLE0000001",
    playTime: 1234567,
    gameMode: 0, // GameModes.CLASSIC
    party: [], // 空队伍：不依赖 PokemonData 的深层结构
    enemyParty: [],
    // 🔴 空容器在本项目里序列化成 **null**（不是 []）—— 已踩过 4 次的坑，
    //    故意在这里复现，好让全栈的往返测试能覆盖到它。
    modifiers: null,
    enemyModifiers: null,
    arena: { biome: 0, weather: null, terrain: null, tags: [] },
    pokeballCounts: { 0: 5, 1: 0, 2: 0, 3: 0, 4: 0 },
    money: 1234,
    score: 5678,
    waveIndex: 7,
    battleType: 0,
    trainer: null,
    gameVersion: "1.11.22", // 与锚点版本一致（90df65097b6d = v1.11.22）
    name: "B15-SAMPLE",
    timestamp: 1793000000000,
    challenges: [],
    mysteryEncounterType: -1,
    mysteryEncounterSaveData: null,
    playerFaints: 0,

    // ---- 魔改扩展 8 项（A4-03 §3 L3） ----
    ptSoudacheEarned: 0,
    ptSoudacheRetreated: false,
    // 🔴 Map 必须转数组：直接 JSON 化 Map 会得到 {}（A4-03 Part 4 证明过「不转数组会丢」）
    ptSoudacheStartingItems: [
      ["MASTER_BALL", 2],
      ["POTION", 10],
    ],
    ptSoudacheRetreatFloors: [3, 8],
    ptSoudachePassiveEnabled: false,
    ptSoudacheNoRetreatMode: false,
    dynamicBalanceEnabled: false,
    talentSystemData: { version: 1, talents: [], generatedAt: 0 },
  };
}

const body = JSON.stringify(buildSessionBody());
const SAVE_KEY = P.SAVE_KEY;
const LOCAL_KEY = "sessionData_undefined"; // getDataTypeKey(SESSION,0) + "_" + loggedInUser?.username

if (!body.trim().startsWith("{")) throw new Error("样本正文必须以 { 开头（游戏只做这个检查）");

// 我的 Node 侧密文（用于「Node → 产物」方向的交叉验证）
const nodeCipher = P.encryptPsv(body);

// ---------------------------------------------------------------------------
// 驱动 A 产物
// ---------------------------------------------------------------------------
const scenario = {
  id: "prsv-sample",
  label: "`.prsv` 样本生成与双向交叉验证",
  system: "存档",
  arrival: "注入离线 localStorage → 用产物自带 CryptoJS 与 Node 实现互相解对方密文",
  async steps(ctx) {
    const s = ctx.session;
    const ready = await ctx.waitReady({ timeout: 45_000 });
    ctx.setReady(ready);
    ctx.state.ready = ready.ready;

    // ① 注入确实生效 + 形态正确（离线 = base64(encodeURIComponent(json))）
    ctx.state.localKeyPresent = await s.evaluate(`localStorage.getItem(${JSON.stringify(LOCAL_KEY)}) !== null`);
    ctx.state.localDecodesBack = await s.evaluate(`(() => {
      try {
        const v = localStorage.getItem(${JSON.stringify(LOCAL_KEY)});
        return decodeURIComponent(atob(v)) === ${JSON.stringify(body)};
      } catch (e) { return 'ERR ' + e.message; }
    })()`);

    // ② 产物是否真的把 CryptoJS 暴露在 window 上（决定能否交叉验证）
    ctx.state.cryptoJs = await s.evaluate(
      `(typeof window.CryptoJS === 'object' && window.CryptoJS !== null) ? (window.CryptoJS.AES ? 'AES-ready' : 'no-AES') : String(typeof window.CryptoJS)`
    );

    const key = JSON.stringify(SAVE_KEY);
    const bodyLit = JSON.stringify(body);
    const nodeCipherLit = JSON.stringify(nodeCipher);

    // ③ 产物侧加密（与 tryExportData 的加密步**同一库、同一 key、同一输入**）
    ctx.state.productCipher = await s.evaluate(`(() => {
      try {
        if (!window.CryptoJS || !window.CryptoJS.AES) return null;
        return window.CryptoJS.AES.encrypt(${bodyLit}, ${key}).toString();
      } catch (e) { return 'ERR ' + e.message; }
    })()`);

    // ④ 交叉验证 A：产物能否解开 **Node 实现的密文**
    ctx.state.productDecryptsNode = await s.evaluate(`(() => {
      try {
        if (!window.CryptoJS || !window.CryptoJS.AES) return null;
        const t = window.CryptoJS.AES.decrypt(${nodeCipherLit}, ${key}).toString(window.CryptoJS.enc.Utf8);
        return t === ${bodyLit} ? 'OK' : 'MISMATCH(len=' + t.length + ')';
      } catch (e) { return 'ERR ' + e.message; }
    })()`);

    // ⑤ 自洽性：产物加密 → 产物自己解开
    ctx.state.productSelfRoundtrip = await s.evaluate(`(() => {
      try {
        if (!window.CryptoJS || !window.CryptoJS.AES) return null;
        const c = window.CryptoJS.AES.encrypt(${bodyLit}, ${key}).toString();
        const t = window.CryptoJS.AES.decrypt(c, ${key}).toString(window.CryptoJS.enc.Utf8);
        return t === ${bodyLit} ? 'OK' : 'MISMATCH';
      } catch (e) { return 'ERR ' + e.message; }
    })()`);

    // ⑥ 两次加密是否产生相同密文（预期：不同 ⇒ 随机 salt 的直接证据）
    ctx.state.twoEncryptsDiffer = await s.evaluate(`(() => {
      try {
        if (!window.CryptoJS || !window.CryptoJS.AES) return null;
        const a = window.CryptoJS.AES.encrypt(${bodyLit}, ${key}).toString();
        const b = window.CryptoJS.AES.encrypt(${bodyLit}, ${key}).toString();
        return a === b ? 'SAME(!!)' : 'DIFFERENT';
      } catch (e) { return 'ERR ' + e.message; }
    })()`);
  },
};

const result = await runProductScenario({
  productId: "A",
  scenario,
  outDir: path.join(REPO, ".build-tools", "probe", "prsv-sample-out"),
  options: { injectLocalStorage: { [LOCAL_KEY]: P.encodeLocalStorage(body) } },
});

// ---------------------------------------------------------------------------
// 落地
// ---------------------------------------------------------------------------
const st = result.state || {};
const productCipher = typeof st.productCipher === "string" && st.productCipher.startsWith("U2FsdGVkX1") ? st.productCipher : null;

fs.mkdirSync(OUT_DIR, { recursive: true });
const baseName = LOCAL_KEY; // sessionData_undefined

// 正文（可读）
const jsonPath = path.join(OUT_DIR, `${baseName}.json`);
fs.writeFileSync(jsonPath, body, "utf8");

// 样本：优先用**产物生成**的密文；产物没暴露 CryptoJS 时退回 Node 生成的（并如实标注）
const usedCipher = productCipher || nodeCipher;
const psvPath = path.join(OUT_DIR, `${baseName}.prsv`);
fs.writeFileSync(psvPath, usedCipher, "utf8");

// Node 侧自检：能解开落盘的这份
let nodeDecryptOk = false;
let nodeDecryptLen = 0;
try {
  const back = P.decryptPsv(fs.readFileSync(psvPath, "utf8"));
  nodeDecryptLen = back.length;
  nodeDecryptOk = back === body;
} catch {
  nodeDecryptOk = false;
}

const sha256 = (buf) => crypto.createHash("sha256").update(buf).digest("hex");

const meta = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  // 🔑 来源标注：密文由谁产生 —— 这决定它是"游戏导出"还是"合成"
  origin: productCipher ? "product-cryptojs" : "node-codec",
  originDetail: productCipher
    ? "密文由 A 产物的 window.CryptoJS 生成（与 tryExportData 的加密步同库、同 key、同输入）；" +
      "触发方式不是 UI 导出按钮（桌面端无该入口，见脚本头注释）"
    : "产物未暴露 window.CryptoJS，退回归 Node 实现生成（等价于派单④的降级方案）",
  content: "synthetic", // 正文是按 SessionSaveData 字段表构造的，不是玩家真实存档
  plaintextPath: path.relative(REPO, jsonPath).replace(/\\/g, "/"),
  psvPath: path.relative(REPO, psvPath).replace(/\\/g, "/"),
  // ⚠️ `.prsv` **不入库**：`.gitignore:29` 有 `*.prsv` 全局规则（防误提交玩家存档）。
  //    那是正确的项目规则，不绕过。样本用下面的命令随时重建。
  psvCommitted: false,
  psvWhy: "`*.prsv` 被 .gitignore:29 忽略（防止误提交玩家存档，是有意的规则）；本样本可 100% 由明文重建",
  regenCommand: `node tools/prsv.cjs encrypt ${path.relative(REPO, jsonPath).replace(/\\/g, "/")} --out=${path
    .relative(REPO, psvPath)
    .replace(/\\/g, "/")}`,
  saveKey: SAVE_KEY,
  localStorageKey: LOCAL_KEY,
  bytes: { plaintext: Buffer.byteLength(body, "utf8"), cipher: usedCipher.length },
  sha256: {
    plaintext: sha256(body),
    // 密文带随机 salt ⇒ **不可复现**。这个值只对本次落盘的那一份有效，
    // 不能当"重建后应当相同"的判据。
    cipherOnce: sha256(usedCipher),
    cipherNote: "随机 salt ⇒ 密文不可复现；要校验重建结果请比对 sha256.plaintext，不要比对密文",
  },
  crossCheck: {
    productCryptoJs: st.cryptoJs ?? null,
    productEncryptProducesPsv: !!productCipher,
    productDecryptsNodeCipher: st.productDecryptsNode ?? null,
    productSelfRoundtrip: st.productSelfRoundtrip ?? null,
    twoEncryptsDiffer: st.twoEncryptsDiffer ?? null,
    nodeDecryptsProductCipher: nodeDecryptOk ? "OK" : `FAIL(len=${nodeDecryptLen})`,
    injectedLocalStorageDecodesBack: st.localDecodesBack ?? null,
  },
  // 给全栈的正确往返判据（见 docs/sourcemigration/B-15-prsv样本生成.md）
  roundtripCriterion: {
    wrong: "export1 字节 === export2 字节  —— 不可能成立（每次随机 salt）",
    right: "decrypt(export1) === decrypt(export2)（明文逐字节）或 structurallyEqual(明文)",
  },
  product: { id: "A", label: result.label, roots: result.roots },
  probeError: result.error || null,
};
const metaPath = path.join(OUT_DIR, `${baseName}.meta.json`);
fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2) + "\n", "utf8");

// ---------------------------------------------------------------------------
// 输出
// ---------------------------------------------------------------------------
const line = (k, v) => console.log(`  ${String(k).padEnd(30)}${v}`);
console.log("PKRC `.prsv` 样本生成（B-15）");
console.log("=".repeat(72));
line("探针错误", result.error || "无");
line("产物 A 就绪", st.ready);
line("产物 CryptoJS", st.cryptoJs ?? "(未探到)");
line("注入 localStorage 生效", st.localKeyPresent);
line("注入值能解回原 JSON", st.localDecodesBack);
console.log("");
console.log("双向交叉验证（核心）");
line("产物加密产出 .prsv", meta.crossCheck.productEncryptProducesPsv);
line("产物能解 Node 密文", meta.crossCheck.productDecryptsNodeCipher);
line("Node 能解产物密文", meta.crossCheck.nodeDecryptsProductCipher);
line("产物自洽（加密→解密）", meta.crossCheck.productSelfRoundtrip);
line("两次加密是否相同", meta.crossCheck.twoEncryptsDiffer);
console.log("");
line("样本来源", meta.origin);
line("样本正文", meta.content + "（按 SessionSaveData 字段表构造）");
line(".prsv", meta.psvPath + "（不入库，见 meta.regenCommand）");
line("明文", meta.plaintextPath);
line("元数据", path.relative(REPO, metaPath).replace(/\\/g, "/"));
line("明文 sha256", meta.sha256.plaintext.slice(0, 32) + "…");

const allOk =
  meta.crossCheck.productDecryptsNodeCipher === "OK" &&
  meta.crossCheck.nodeDecryptsProductCipher === "OK" &&
  meta.crossCheck.productSelfRoundtrip === "OK";

console.log("");
if (allOk) console.log("✅ 两套实现双向等价（产物 CryptoJS ⇄ Node 编解码器）。");
else if (!meta.crossCheck.productCryptoJs || meta.crossCheck.productCryptoJs === "undefined")
  console.log("⚠ 产物未暴露 window.CryptoJS ⇒ 只做了 Node 侧自洽，**未**完成双向交叉验证。");
else console.log("❌ 交叉验证未全部通过，见上表。");

process.exitCode = allOk ? 0 : 1;
