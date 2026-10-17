/**
 * PKRC · F-10 自动化走查环境 · 运行器
 * ---------------------------------------------------------------------------
 * 把「场景 + 产物」跑成**可复核的证据包**：
 *   · 单产物：启动 → 就绪 → 执行场景步骤 → 截图 + 断言 + 诊断
 *   · 双产物：A/B 各跑一遍（同场景 / 同存档 / 同操作序列）→ 逐张并排 + 像素 diff
 *
 * 判定层级（严格按 O-9b，优先级从高到低）：
 *   ① 状态/数值断言（session.evaluate / 页面诊断）—— 机器可判
 *   ② 截图像素 diff —— 机器可判（差异率 + 热区）
 *   ③ AI 视觉审阅 —— 仅灰色地带；**本运行器不自动产出 ③ 的结论**
 *
 * 「就绪」判定用**客观信号**（帧内容方差 > 阈值），不依赖任何一端独有的全局变量，
 * 这样 A/B 两侧用同一把尺子。
 */

import fs from "node:fs";
import path from "node:path";
import { startStaticServer } from "./static-server.mjs";
import { launchBrowser } from "./browser.mjs";
import { CdpConnection } from "./cdp.mjs";
import { PageSession } from "./session.mjs";
import { decodePng, diffPng, sideBySide } from "./png.mjs";
import { PRODUCTS, resolveProductRoots, productFingerprint } from "./products.mjs";

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * 帧内容统计（亮度标准差）——用于「画面是否真有内容」的客观判据。
 * 黑屏 / 纯色 → 标准差≈0；真实画面 → 显著大于 0。
 */
export function imageStats(img) {
  const { width, height, data } = img;
  const step = 4; // 抽样加速
  let n = 0;
  let sum = 0;
  let sumSq = 0;
  const colors = new Set();
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const o = (y * width + x) * 4;
      const lum = 0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2];
      sum += lum;
      sumSq += lum * lum;
      n++;
      if (colors.size < 4096) colors.add((data[o] >> 3) * 4096 + (data[o + 1] >> 3) * 64 + (data[o + 2] >> 3));
    }
  }
  const mean = sum / n;
  const variance = Math.max(0, sumSq / n - mean * mean);
  return { mean: +mean.toFixed(2), stdDev: +Math.sqrt(variance).toFixed(2), distinctColors: colors.size, samples: n };
}

/**
 * 等待画面「真有内容」。
 *
 * 判据（三者同时满足，且需连续 stableFrames 帧）：
 *   ① 游戏 canvas 已挂载（`document.querySelector("canvas")`）
 *      —— 早期只有触摸控件 DOM，没有 canvas；不查这一项会把「预启动遮罩」
 *         误判为「就绪」（实测 A 版会在 ~340ms 处误触发）。
 *   ② 帧亮度标准差 > minStdDev —— 排除黑屏/纯色。
 *   ③ 连续 N 帧都满足 —— 排除瞬态过渡帧。
 *
 * @param {PageSession} session
 * @param {object} [opts]
 */
export async function waitForVisualReady(session, opts = {}) {
  const timeout = opts.timeout ?? 30_000;
  const interval = opts.interval ?? 600;
  const minStdDev = opts.minStdDev ?? 8;
  const stableFrames = opts.stableFrames ?? 2;
  const started = Date.now();
  let consecutive = 0;
  let last = null;
  while (Date.now() - started < timeout) {
    const canvasOk = await session.evaluate("!!document.querySelector('canvas')").catch(() => false);
    const png = await session.screenshot();
    let stats;
    try {
      stats = imageStats(decodePng(png));
    } catch {
      stats = { stdDev: 0, distinctColors: 0 };
    }
    last = { png, stats, canvasOk };
    if (canvasOk && stats.stdDev > minStdDev) {
      consecutive++;
      if (consecutive >= stableFrames) {
        return { ready: true, elapsedMs: Date.now() - started, ...last };
      }
    } else {
      consecutive = 0;
    }
    await delay(interval);
  }
  return { ready: false, elapsedMs: Date.now() - started, ...last };
}

/**
 * 等待画面「稳定」——连续两帧变化率低于阈值。
 * 走查要的是**确定性捕获点**：启动后先有 splash 淡入淡出、再进标题，
 * 若在过渡帧截图，A/B 对比就失去意义。此函数把捕获点钉在稳定帧上。
 *
 * @param {PageSession} session
 * @param {object} [opts]
 */
export async function waitForStableFrame(session, opts = {}) {
  const timeout = opts.timeout ?? 15_000;
  const interval = opts.interval ?? 400;
  const maxDiffRatio = opts.maxDiffRatio ?? 0.02;
  const deadline = Date.now() + timeout;
  let prev = await session.screenshot();
  let lastDiff = null;
  while (Date.now() < deadline) {
    await delay(interval);
    const cur = await session.screenshot();
    try {
      const d = diffPng(prev, cur, { threshold: opts.threshold ?? 12 });
      lastDiff = d.diffRatio;
      if (d.diffRatio <= maxDiffRatio) return { stable: true, png: cur, diffRatio: d.diffRatio, elapsedMs: timeout - (deadline - Date.now()) };
    } catch {
      /* 解码失败：继续等 */
    }
    prev = cur;
  }
  return { stable: false, png: prev, diffRatio: lastDiff, elapsedMs: timeout };
}

/**
 * 跑一个产物 + 一个场景。
 *
 * @param {object} args
 * @param {string} args.productId
 * @param {object} args.scenario
 * @param {string} args.outDir  证据输出目录
 * @param {object} [args.options] { bootTimeoutMs, readyTimeoutMs, injectLocalStorage, minStdDev }
 * @returns {Promise<object>} 产物结果
 */
export async function runProductScenario({ productId, scenario, outDir, options = {} }) {
  const roots = resolveProductRoots(productId);
  const productOut = path.join(outDir, productId);
  fs.mkdirSync(productOut, { recursive: true });

  const server = await startStaticServer(roots, {});
  const browser = await launchBrowser({});
  const cdp = await CdpConnection.connect(browser.wsUrl);

  /** @type {Array<{name:string, file:string, stats:object}>} */
  const shots = [];
  const checks = [];
  const logs = [];

  const ctx = {
    product: productId,
    session: null,
    options,
    log: (m) => logs.push(String(m)),
    check: (name, pass, detail) => checks.push({ name, pass: !!pass, detail: detail ?? "" }),
    point: (name, pass, detail) => checks.push({ name, pass: !!pass, detail: detail ?? "", point: true }),
    shot: async (name) => {
      const png = await ctx.session.screenshot();
      const file = `${name}.png`;
      fs.writeFileSync(path.join(productOut, file), png);
      shots.push({ name, file: `${productId}/${file}`, stats: safeStats(png) });
      return png;
    },
    waitReady: async (o = {}) =>
      waitForVisualReady(ctx.session, { timeout: options.readyTimeoutMs ?? 30_000, minStdDev: options.minStdDev, ...o }),
    settle: async (o = {}) => waitForStableFrame(ctx.session, o),
    setReady: (r) => {
      ctx._ready = r;
    },
    get state() {
      return ctx._state;
    },
    _ready: null,
    _state: {},
  };

  const result = {
    productId,
    label: PRODUCTS[productId]?.label,
    roots,
    fingerprint: productFingerprint(productId),
    ready: false,
    readyMs: null,
    readyStats: null,
    bootShotStats: null,
    checks,
    shots,
    logs,
    diagnostics: null,
    serverStats: null,
    error: null,
  };

  try {
    const session = await PageSession.open(cdp, {
      url: server.url,
      label: productId,
      injectLocalStorage: options.injectLocalStorage,
    });
    ctx.session = session;

    await scenario.steps(ctx);

    if (ctx._ready) {
      result.ready = ctx._ready.ready;
      result.readyMs = ctx._ready.elapsedMs;
      result.readyStats = ctx._ready.stats;
    }
    result.state = ctx._state;

    result.diagnostics = session.diagnostics();
    await session.close();
  } catch (err) {
    result.error = err && err.message ? err.message : String(err);
    if (ctx.session) {
      try {
        result.diagnostics = ctx.session.diagnostics();
      } catch {
        /* ignore */
      }
    }
  }

  result.serverStats = server.stats;

  try {
    cdp.close();
  } catch {
    /* ignore */
  }
  await browser.close();
  await server.close();

  // 落盘单产物结果
  fs.writeFileSync(path.join(productOut, "result.json"), JSON.stringify(result, null, 2));
  return result;
}

function safeStats(png) {
  try {
    return imageStats(decodePng(png));
  } catch {
    return null;
  }
}

/**
 * 双产物对比：跑 A、跑 B，逐张并排 + diff。
 */
export async function runDualScenario({ scenario, outDir, options = {} }) {
  fs.mkdirSync(outDir, { recursive: true });
  const compareDir = path.join(outDir, "_compare");
  fs.mkdirSync(compareDir, { recursive: true });

  const results = {};
  for (const id of ["A", "B"]) {
    results[id] = await runProductScenario({ productId: id, scenario, outDir, options });
  }

  // 逐张对比（同名 shot）
  const comparisons = [];
  const namesA = new Set(results.A.shots.map((s) => s.name));
  const namesB = new Set(results.B.shots.map((s) => s.name));
  const common = [...namesA].filter((n) => namesB.has(n));

  for (const name of common) {
    const pa = path.join(outDir, "A", `${name}.png`);
    const pb = path.join(outDir, "B", `${name}.png`);
    if (!fs.existsSync(pa) || !fs.existsSync(pb)) continue;
    const bufA = fs.readFileSync(pa);
    const bufB = fs.readFileSync(pb);
    let d = null;
    try {
      d = diffPng(bufA, bufB, { threshold: options.diffThreshold ?? 12 });
    } catch (err) {
      d = { error: err.message };
    }
    const sbs = (() => {
      try {
        return sideBySide(bufA, bufB);
      } catch {
        return null;
      }
    })();
    const sbsFile = `${name}--A-B.png`;
    if (sbs) fs.writeFileSync(path.join(compareDir, sbsFile), sbs);
    comparisons.push({
      shot: name,
      diff: d,
      sideBySide: sbs ? `_compare/${sbsFile}` : null,
    });
  }

  return { scenario: scenarioMeta(scenario), results, comparisons, generatedAt: new Date().toISOString() };
}

export function scenarioMeta(scenario) {
  return { id: scenario.id, label: scenario.label, system: scenario.system, arrival: scenario.arrival };
}

export { delay };
export { PRODUCTS };
