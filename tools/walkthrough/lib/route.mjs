/**
 * PKRC · F-14 · 「到达」步骤 DSL（route）
 * ---------------------------------------------------------------------------
 * F-12 的 catalog 只写了「如何到达」的**文字描述**（`arrival`）与空 `keys: []`，
 * 而 `catalog-scenario` 之前只能「boot 一次 → 依次截图」，**并没有真正导航**。
 * 本模块把「到达」变成**可执行、可复用、可 A/B 逐字节同序**的步骤数组。
 *
 * 设计要点
 *  · **纯数据**：route 是对象数组，不含闭包 ⇒ 可 JSON 化、可被 A/B 两侧跑同一份。
 *  · **可证伪**：`change()` 步骤要求「画面相对上次基线确实变了」，
 *    避免「什么都没发生却截了张图」被当成到达。
 *  · **零新依赖**：只用 session / ctx 已有能力 + png.mjs 的 diffPng。
 *
 * 步骤类型
 *   { t:"key",    key, holdMs? }   按键（经 input-arbiter 仲裁）
 *   { t:"wait",   ms }             固定等待
 *   { t:"waitFor",expr,desc?,timeout? }  轮询页面表达式至真值（DOM 可用时最强判据）
 *   { t:"settle", maxDiffRatio?,timeout? }  等画面稳定（连续两帧变化率 ≤ 阈值）
 *   { t:"shot",   name }            中间取证截图
 *   { t:"click",  x, y }            鼠标点击
 *   { t:"reload" }                 重新导航回根 URL（点间复位）
 *   { t:"change", desc? }           **要求画面相对基线发生变化**（到达弱证明）
 *   { t:"note",   msg }             纯注释（执行时写日志）
 *
 * 为什么「到达」只能是弱证明：
 *   Phaser canvas 内的文本**不在 DOM**（U-11 已记），页面无法读到「当前是哪个界面」；
 *   游戏又不暴露模块作用域内的全局对象。因此除 DOM 模块（legendary-popup 等）外，
 *   「是否到达」只能由 ①画面发生变化 + ②稳定帧 共同佐证，最终仍以 A/B diff 裁定。
 *   这一点必须在报告里如实标注，不得把「弱证明」写成「已确认到达」。
 */

import { diffPng } from "./png.mjs";

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// 构造器（让 catalog 读起来像自然语言）
// ---------------------------------------------------------------------------

/** 单键 */
export const k = (key, holdMs = 60) => ({ t: "key", key, holdMs });

/** 一串键（字符串自动包装；也接受已构造的步骤对象） */
export const ks = (...items) => items.map((x) => (typeof x === "string" ? k(x) : x));

/** 同键连按 n 次 */
export const taps = (key, n) => Array.from({ length: n }, () => k(key));

/** 固定等待 */
export const wait = (ms) => ({ t: "wait", ms });

/** 轮询表达式（仅 DOM 可达的东西；canvas 文本读不到） */
export const waitFor = (expr, desc, timeout = 15_000) => ({ t: "waitFor", expr, desc, timeout });

/** 等画面稳定 */
export const settle = (maxDiffRatio = 0.04, timeout = 8000) => ({ t: "settle", maxDiffRatio, timeout });

/** 中间取证 */
export const shot = (name) => ({ t: "shot", name });

/** 重新导航复位 */
export const reload = () => ({ t: "reload" });

/** 要求画面发生变化（弱到达证明） */
export const change = (desc) => ({ t: "change", desc });

/** 注释 */
export const note = (msg) => ({ t: "note", msg });

/**
 * 「退回主菜单」惯例动作：连按取消键（x）+ 稳定。
 * PokéRogue 的取消键在默认绑定下是 `x`（与 F-13 的 S6 键位一致）。
 */
export const retreat = (times = 3) => [...taps("x", times), settle(0.05, 4000)];

/**
 * 「进入一场战斗」的最小序列（标题 → 确认 → 存档槽 → 确认 → 新手选择 → 确认）。
 * ⚠️ 强依赖存档状态；无 `--inject` 时结果不可复现，故标 `requiresInject`。
 */
export const enterBattle = () => [
  ...taps("z", 2),
  wait(600),
  ...taps("z", 1),
  wait(900),
  ...taps("z", 1),
  wait(1200),
  settle(0.05, 8000),
];

// ---------------------------------------------------------------------------
// 执行器
// ---------------------------------------------------------------------------

/**
 * 顺序执行一条 route。
 *
 * @param {object} ctx runner 提供的上下文（session / settle / shot / log / state）
 * @param {Array<object>} route
 * @param {object} [opts] { url, threshold, changeThreshold }
 * @returns {Promise<{ok:boolean, failedAt:number|null, reason:string, steps:object[], baseline:boolean}>}
 */
export async function runRoute(ctx, route, opts = {}) {
  const steps = [];
  const threshold = opts.threshold ?? 12;
  const changeThreshold = opts.changeThreshold ?? 0.004;

  /** @type {Buffer|null} */
  let baseline = null;
  let usedChange = false;

  const fail = (i, reason) => ({ ok: false, failedAt: i, reason, steps, baseline: usedChange });

  for (let i = 0; i < route.length; i++) {
    const s = route[i];
    if (!s || typeof s.t !== "string") {
      steps.push({ i, t: "?", ok: false, note: "非法步骤" });
      return fail(i, "非法步骤（缺 t）");
    }

    try {
      switch (s.t) {
        case "note":
          ctx.log(`· ${s.msg}`);
          steps.push({ i, t: "note", ok: true });
          break;

        case "key": {
          const r = await ctx.session.press(s.key, { holdMs: s.holdMs });
          if (r && r.accepted === false) {
            // arbiter 拒绝（同帧去重/设备冷却）不是失败，但要留痕
            steps.push({ i, t: "key", key: s.key, ok: true, note: `仲裁未放行：${r.reason || "?"}` });
          } else {
            steps.push({ i, t: "key", key: s.key, ok: true });
          }
          await delay(s.holdMs ? 30 : 60);
          break;
        }

        case "wait":
          await delay(s.ms);
          steps.push({ i, t: "wait", ms: s.ms, ok: true });
          break;

        case "waitFor": {
          const v = await ctx.session.waitFor(s.expr, { timeout: s.timeout, desc: s.desc });
          steps.push({ i, t: "waitFor", ok: true, value: v });
          break;
        }

        case "settle": {
          const r = await ctx.settle({ timeout: s.timeout, maxDiffRatio: s.maxDiffRatio });
          steps.push({ i, t: "settle", ok: true, stable: r.stable, diffRatio: r.diffRatio });
          break;
        }

        case "shot": {
          const png = await ctx.shot(s.name);
          if (png && !usedChange) baseline = png;
          steps.push({ i, t: "shot", name: s.name, ok: true });
          break;
        }

        case "click": {
          const r = await ctx.session.click(s.x, s.y);
          steps.push({ i, t: "click", ok: true, accepted: r?.accepted !== false });
          await delay(120);
          break;
        }

        case "reload": {
          if (!opts.url) return fail(i, "route 含 reload，但运行器未提供 url");
          await ctx.session.goto(opts.url, { readyTimeoutMs: 30_000 });
          baseline = null;
          steps.push({ i, t: "reload", ok: true });
          break;
        }

        case "change": {
          usedChange = true;
          const cur = await ctx.session.screenshot();
          if (!baseline) {
            baseline = cur;
            steps.push({ i, t: "change", ok: true, note: "首次建立基线，未判定" });
            break;
          }
          const d = diffPng(baseline, cur, { threshold });
          const changed = (d.diffRatio ?? 0) > changeThreshold;
          steps.push({ i, t: "change", ok: changed, diffRatio: d.diffRatio, desc: s.desc });
          if (!changed) {
            return fail(i, `画面未变化（diff=${((d.diffRatio ?? 0) * 100).toFixed(2)}%，阈值 ${(changeThreshold * 100).toFixed(2)}%）${s.desc ? "：" + s.desc : ""}`);
          }
          baseline = cur;
          break;
        }

        default:
          steps.push({ i, t: s.t, ok: false, note: "未知步骤类型" });
          return fail(i, `未知步骤类型：${s.t}`);
      }
    } catch (err) {
      const msg = err && err.message ? err.message : String(err);
      steps.push({ i, t: s.t, ok: false, error: msg });
      return fail(i, `${s.t} 失败：${msg}`);
    }
  }

  return { ok: true, failedAt: null, reason: "", steps, baseline: usedChange };
}

/** 该 route 是否用了「弱到达证明」（change 步骤） */
export function hasChangeProof(route) {
  return Array.isArray(route) && route.some((s) => s && s.t === "change");
}

/** 该 route 需要存档注入才可复现 */
export function requiresInject(route) {
  return Array.isArray(route) && route.some((s) => s && s.t === "note" && String(s.msg).startsWith("@requiresInject"));
}

export default runRoute;
