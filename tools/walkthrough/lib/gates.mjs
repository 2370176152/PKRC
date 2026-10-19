/**
 * PKRC · F-14 · 产物内容闸门（gate）—— 「这个画面在**这个产物里**有没有可能渲染出来」
 * ---------------------------------------------------------------------------
 * 为什么需要它（E-3 / A4-01 的直接痛点）：
 *   走查要「11 系统 × 全部画面 × 双产物」。但 B（自构建）大量 mod 界面**根本没进 bundle**
 *   （tree-shake 掉了，因为 mod UI Handler 未接 UI 模式注册表 —— 见 `mod-init.ts` 末尾挂账）。
 *   若不做任何前置判定，「走查不过」会与「迁移缺口」混为一谈，
 *   既无法定性（P5-R3），也会把 A4-01 的时间浪费在注定黑屏的点上。
 *
 * 🔴 关键方法学（实测得出，勿踩）：
 *   **B 产物未启用 keepNames** —— 实测 `MenuUiHandler` / `TitleUiHandler` / `SettingsUiHandler`
 *   等上游类名在 B 中全部计数为 0，而在 A 中各为 1~3。
 *   ⇒ 任何「按标识符名 grep 产物」的探测在 B 上**恒为假**，必须只用**字符串字面量**
 *     （中文文案 / i18n key / 资源 key），这些在压缩后仍然完整保留。
 *
 * 使用：
 *   const corpus = productCorpus("B");
 *   evaluateGate(corpus, { any: ["healer:"], reason: "治疗系统未进 bundle" });
 *   → { present:false, kind:"absent", reason:"产物 B 中缺失标记：healer:", hits:{...} }
 */

import fs from "node:fs";
import path from "node:path";
import { resolveProductRoots } from "./products.mjs";

/** @type {Map<string, {productId:string, files:Array<{file:string,size:number}>, text:string, bytes:number}>} */
const corpusCache = new Map();

/** 只收主 bundle（index-*.js 是枚举/存档小 chunk，一并收；过小的空壳跳过） */
const BUNDLE_RE = /^(?:loading-scene|index)-.*\.js$/;
const MIN_BUNDLE_BYTES = 4096;

/**
 * 读取某产物的 JS 语料。
 *
 * 🔴 **只读该产物自己的根目录（roots[0]）**，不读叠加根。
 *   叠加根是给静态服务器做「A 缺资源时落到 B」用的（P4-R10），
 *   但那是**运行期资源**语义 —— 若把 B 的 JS 也读进 A 的语料，
 *   A 的探测结果会被 B 的代码污染（A 缺的东西可能在 B 里找到而误判「存在」）。
 *   产物指纹（`productFingerprint`）也只看 roots[0]，此处保持一致。
 *
 * @param {"A"|"B"} productId
 */
export function productCorpus(productId) {
  const key = String(productId).toUpperCase();
  if (corpusCache.has(key)) return corpusCache.get(key);

  const roots = resolveProductRoots(key);
  const own = roots[0]; // ⚠️ 只取该产物自己的根
  const assets = path.join(own, "assets");

  /** @type {string[]} */
  const picked = [];
  if (fs.existsSync(assets)) {
    for (const f of fs.readdirSync(assets).sort()) {
      if (!BUNDLE_RE.test(f)) continue;
      const abs = path.join(assets, f);
      const st = fs.statSync(abs);
      if (st.size < MIN_BUNDLE_BYTES) continue;
      picked.push(abs);
    }
  }

  let text = "";
  for (const abs of picked) text += fs.readFileSync(abs, "utf8") + "\n";

  const corpus = {
    productId: key,
    root: own,
    files: picked.map((abs) => ({ file: path.basename(abs), size: fs.statSync(abs).size })),
    bytes: text.length,
    text,
  };
  corpusCache.set(key, corpus);
  return corpus;
}

/** 子串计数（比正则快且不会被特殊字符坑） */
export function countMarker(corpus, marker) {
  if (!marker) return 0;
  let n = 0;
  let i = 0;
  for (;;) {
    const at = corpus.text.indexOf(marker, i);
    if (at === -1) return n;
    n++;
    i = at + marker.length;
  }
}

/**
 * 判定一个 gate 在该产物中是否成立。
 *
 * gate 形状：
 *   { any?: string[], all?: string[], reason?: string, disabled?: boolean }
 *   · any  —— **至少一个**命中即视为「功能存在」
 *   · all  —— **全部**命中才视为存在（用于「主逻辑 + 特效」双条件）
 *   · disabled —— 已判定永久不可行（如 UI 组件 61 的 L3 挂账），直接 blocked/infeasible
 *
 * @returns {{present:boolean, kind:"present"|"absent"|"infeasible"|"ungated", reason:string, hits:Record<string,number>, missing:string[]}}
 */
export function evaluateGate(corpus, gate) {
  if (!gate) return { present: true, kind: "ungated", reason: "未声明 gate（默认可达）", hits: {}, missing: [] };
  if (gate.disabled) {
    return { present: false, kind: "infeasible", reason: gate.reason || "已判定永久不可行（L3 挂账）", hits: {}, missing: [] };
  }

  const any = Array.isArray(gate.any) ? gate.any : [];
  const all = Array.isArray(gate.all) ? gate.all : [];
  if (!any.length && !all.length) {
    return { present: true, kind: "ungated", reason: "gate 未给出标记（视为可透传）", hits: {}, missing: [] };
  }

  /** @type {Record<string, number>} */
  const hits = {};
  for (const m of any) hits[m] = countMarker(corpus, m);
  for (const m of all) if (!(m in hits)) hits[m] = countMarker(corpus, m);

  const allOk = all.every((m) => hits[m] > 0);
  const anyOk = any.length === 0 || any.some((m) => hits[m] > 0);
  const missing = [
    ...all.filter((m) => hits[m] === 0),
    ...(anyOk ? [] : any.slice()),
  ];

  if (allOk && anyOk) {
    const found = Object.keys(hits).filter((m) => hits[m] > 0);
    return { present: true, kind: "present", reason: `标记命中（${found.join(" / ")}）`, hits, missing: [] };
  }
  return {
    present: false,
    kind: "absent",
    reason: `产物 ${corpus.productId} 中缺失标记：${missing.join(" / ") || "（未声明）"}${gate.reason ? " —— " + gate.reason : ""}`,
    hits,
    missing,
  };
}

/**
 * 批量探测：对 catalog 每个系统汇总 gate 结果（供 `cli --gates` 与 E-3 规划用）。
 * @param {Array<object>} catalog
 * @param {"A"|"B"} productId
 */
export function probeCatalog(catalog, productId) {
  const corpus = productCorpus(productId);
  return catalog.map((sys) => {
    const points = sys.points.map((pt) => {
      const g = evaluateGate(corpus, pt.gate);
      return { id: pt.id, label: pt.label, present: g.present, kind: g.kind, reason: g.reason, hits: g.hits };
    });
    const present = points.filter((p) => p.present).length;
    return {
      system: sys.id,
      label: sys.label,
      total: points.length,
      present,
      blocked: points.length - present,
      points,
    };
  });
}

/** 汇总统计 */
export function summarizeProbe(probe) {
  const total = probe.reduce((n, s) => n + s.total, 0);
  const present = probe.reduce((n, s) => n + s.present, 0);
  return { systems: probe.length, total, present, blocked: total - present };
}

export default evaluateGate;
