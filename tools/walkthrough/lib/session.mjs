/**
 * PKRC · F-10 自动化走查环境 · 页面会话层
 * ---------------------------------------------------------------------------
 * 一个 PageSession = 一个浏览器标签页 + 一组诊断收集器。负责走查需要的一切：
 *   · 导航与「就绪」等待
 *   · 脚本化键鼠输入（**复用 F-6 的 input-arbiter 语义**做设备仲裁）
 *   · 截图（PNG buffer）
 *   · 状态/数值断言（Runtime.evaluate）
 *   · 存档注入（localStorage，页面脚本执行**之前**写入 ⇒ 直达目标场景）
 *   · 诊断：控制台错误 / 未捕获异常 / 网络失败（**走查发现缺口的核心证据**）
 *
 * 依赖：仅 lib/cdp.mjs + Node 内置。input-arbiter 从 tools/input-layer 复用。
 */

import { InputArbiter, DEVICE } from "../../input-layer/input-arbiter.js";

/** 走查中视为「已知噪声」的 URL（不参与失败判定），默认空 */
const DEFAULT_IGNORED_URL_PATTERNS = [];

export class PageSession {
  /**
   * @param {import('./cdp.mjs').CdpConnection} cdp
   * @param {string} sessionId
   * @param {object} [opts]
   */
  constructor(cdp, sessionId, opts = {}) {
    this.cdp = cdp;
    this.sessionId = sessionId;
    this.label = opts.label || "page";
    /** @type {string[]} */
    this.consoleErrors = [];
    /** @type {string[]} */
    this.pageErrors = [];
    /** @type {Array<{url:string, status:number}>} */
    this.httpErrors = [];
    /** @type {Array<{url:string, error:string}>} */
    this.networkFailures = [];
    /** @type {string[]} 浏览器日志（Log.entryAdded） */
    this.browserLogs = [];
    this._ignore = [...DEFAULT_IGNORED_URL_PATTERNS, ...(opts.ignoreUrls || [])];
    this._frameId = 0;
    /** 设备仲裁：复用 F-6 语义（键鼠切换冷却 / 同帧去重 / 键盘完全控制权） */
    this.arbiter = new InputArbiter(opts.arbiterConfig, { enabled: true });
    this._unsubs = [];
    this._closed = false;
  }

  /**
   * 打开一个新标签页并导航到目标 URL。
   * @param {import('./cdp.mjs').CdpConnection} cdp
   * @param {object} opts
   * @param {string} opts.url
   * @param {string} [opts.label]
   * @param {Record<string,string>} [opts.injectLocalStorage] 页面脚本执行前写入的 localStorage
   * @param {number} [opts.readyTimeoutMs]
   */
  static async open(cdp, opts) {
    const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
    const session = new PageSession(cdp, sessionId, opts);
    session.targetId = targetId;
    await session._init();
    if (opts.injectLocalStorage && Object.keys(opts.injectLocalStorage).length) {
      await session.injectLocalStorage(opts.injectLocalStorage);
    }
    await session.goto(opts.url, { readyTimeoutMs: opts.readyTimeoutMs });
    return session;
  }

  async _init() {
    const sid = this.sessionId;
    await this.cdp.send("Page.enable", {}, sid);
    await this.cdp.send("Runtime.enable", {}, sid);
    await this.cdp.send("Log.enable", {}, sid);
    await this.cdp.send("Network.enable", {}, sid);
    // 让页面认为自己是「桌面 Chrome」，避免被判定为爬虫/移动端而走不同分支
    await this.cdp.send("Emulation.setDeviceMetricsOverride", {
      width: 1280,
      height: 720,
      deviceScaleFactor: 1,
      mobile: false,
    }, sid);

    this._unsubs.push(
      this.cdp.on("Runtime.consoleAPICalled", (p, s) => {
        if (s !== sid) return;
        const text = p.args.map((a) => a.value ?? a.description ?? a.type).join(" ");
        if (p.type === "error" || p.type === "assert") this.consoleErrors.push(text);
      }),
      this.cdp.on("Runtime.exceptionThrown", (p, s) => {
        if (s !== sid) return;
        const d = p.exceptionDetails;
        const desc = d?.exception?.description || d?.text || "(unknown)";
        this.pageErrors.push(desc);
      }),
      this.cdp.on("Log.entryAdded", (p, s) => {
        if (s !== sid) return;
        if (p.entry.level === "error") this.browserLogs.push(p.entry.text);
      }),
      this.cdp.on("Network.responseReceived", (p, s) => {
        if (s !== sid) return;
        const status = p.response.status;
        if (status >= 400 && !this._isIgnored(p.response.url)) {
          this.httpErrors.push({ url: p.response.url, status });
        }
      }),
      this.cdp.on("Network.loadingFailed", (p, s) => {
        if (s !== sid) return;
        // aborted 通常是 SPA 正常行为，不计
        if (p.canceled || p.errorText === "net::ERR_ABORTED") return;
        this.networkFailures.push({ url: p.url || "(blocked)", error: p.errorText });
      }),
    );
  }

  _isIgnored(url) {
    return this._ignore.some((pat) => url.includes(pat));
  }

  /** 在页面脚本执行前注入 localStorage（存档注入的落点） */
  async injectLocalStorage(map) {
    const source =
      "(() => { try { const m = " +
      JSON.stringify(map) +
      "; for (const k of Object.keys(m)) localStorage.setItem(k, m[k]); } catch(e){} })();";
    const { identifier } = await this.cdp.send(
      "Page.addScriptToEvaluateOnNewDocument",
      { source },
      this.sessionId,
    );
    this._injectedScriptId = identifier;
    return identifier;
  }

  /** 导航并等待 load 事件 */
  async goto(url, opts = {}) {
    const loaded = this.cdp.waitForEvent(
      "Page.loadEventFired",
      (_p, s) => s === this.sessionId,
      opts.readyTimeoutMs ?? 40_000,
    );
    await this.cdp.send("Page.navigate", { url }, this.sessionId);
    await loaded;
    return this;
  }

  /**
   * 轮询页面表达式直到真值（就绪判定 / 状态等待）。
   * @param {string} expression JS 表达式（返回真值即视为满足）
   * @param {object} [opts]
   * @param {number} [opts.timeout]
   * @param {number} [opts.interval]
   * @param {string} [opts.desc]
   */
  async waitFor(expression, opts = {}) {
    const timeout = opts.timeout ?? 30_000;
    const interval = opts.interval ?? 250;
    const deadline = Date.now() + timeout;
    let lastValue;
    while (Date.now() < deadline) {
      const r = await this.evaluate(expression);
      lastValue = r;
      if (r) return r;
      await delay(interval);
    }
    throw new Error(
      `waitFor 超时（${timeout}ms）${opts.desc ? "：" + opts.desc : ""}\n  表达式：${expression}\n  最后值：${JSON.stringify(lastValue)}`,
    );
  }

  /**
   * 求值表达式。
   * @param {string} expression
   * @param {object} [opts]
   * @param {boolean} [opts.awaitPromise] 默认 true
   */
  async evaluate(expression, opts = {}) {
    const res = await this.cdp.send(
      "Runtime.evaluate",
      {
        expression,
        returnByValue: true,
        awaitPromise: opts.awaitPromise !== false,
      },
      this.sessionId,
    );
    if (res.exceptionDetails) {
      const d = res.exceptionDetails;
      throw new Error(`evaluate 抛出：${d.exception?.description || d.text}`);
    }
    return res.result.value;
  }

  /** 截图 → PNG Buffer */
  async screenshot() {
    const shot = await this.cdp.send("Page.captureScreenshot", { format: "png", fromSurface: true }, this.sessionId);
    return Buffer.from(shot.data, "base64");
  }

  // ---------------------------------------------------------------------
  // 输入：CDP Input 域 + input-arbiter 仲裁
  // ---------------------------------------------------------------------

  /** 下一个帧号（用于同帧去重判定） */
  _nextFrame() {
    return ++this._frameId;
  }

  /**
   * 发送一个动作给 arbiter 仲裁，返回是否放行。
   * @param {"keyboard"|"mouse"|"touch"|"gamepad"} device
   * @param {string} [key]
   */
  _arbitrate(device, key) {
    return this.arbiter.submit({ device, frameId: this._nextFrame(), at: Date.now(), key });
  }

  /**
   * 键盘按下+抬起（走查最常用）。
   * @param {string} key  CDP 键名，如 "Enter" / "ArrowDown" / "z"
   */
  async press(key, opts = {}) {
    const decision = this._arbitrate(DEVICE.KEYBOARD, key);
    if (!decision.accept) {
      this.arbiter.endFrame();
      return { accepted: false, reason: decision.reason };
    }
    await this.keyDown(key, opts);
    await delay(opts.holdMs ?? 40);
    await this.keyUp(key, opts);
    this.arbiter.endFrame();
    return { accepted: true };
  }

  async keyDown(key) {
    await this.cdp.send(
      "Input.dispatchKeyEvent",
      { type: "keyDown", key, code: codeFor(key), windowsVirtualKeyCode: vkFor(key), nativeVirtualKeyCode: vkFor(key), text: textFor(key) },
      this.sessionId,
    );
  }

  async keyUp(key) {
    await this.cdp.send(
      "Input.dispatchKeyEvent",
      { type: "keyUp", key, code: codeFor(key), windowsVirtualKeyCode: vkFor(key), nativeVirtualKeyCode: vkFor(key) },
      this.sessionId,
    );
  }

  /** 设置键盘「按住」状态（供 arbiter 的 keyboardKeepsFullControl 用） */
  setKeyboardHeld(held) {
    this.arbiter.setKeyboardHeld(held);
  }

  /**
   * 鼠标点击（左键）。
   */
  async click(x, y, opts = {}) {
    const decision = this._arbitrate(DEVICE.MOUSE);
    if (!decision.accept) {
      this.arbiter.endFrame();
      return { accepted: false, reason: decision.reason };
    }
    await this.cdp.send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y }, this.sessionId);
    await this.cdp.send(
      "Input.dispatchMouseEvent",
      { type: "mousePressed", x, y, button: "left", buttons: 1, clickCount: 1 },
      this.sessionId,
    );
    await delay(opts.holdMs ?? 30);
    await this.cdp.send(
      "Input.dispatchMouseEvent",
      { type: "mouseReleased", x, y, button: "left", buttons: 0, clickCount: 1 },
      this.sessionId,
    );
    this.arbiter.endFrame();
    return { accepted: true };
  }

  /** 页面内诊断快照（供证据包） */
  diagnostics() {
    return {
      label: this.label,
      consoleErrors: this.consoleErrors,
      pageErrors: this.pageErrors,
      httpErrors: this.httpErrors,
      networkFailures: this.networkFailures,
      browserLogs: this.browserLogs,
      arbiter: this.arbiter.snapshot(),
    };
  }

  async close() {
    if (this._closed) return;
    this._closed = true;
    for (const off of this._unsubs) {
      try {
        off();
      } catch {
        /* ignore */
      }
    }
    try {
      if (this.targetId) await this.cdp.send("Target.closeTarget", { targetId: this.targetId });
    } catch {
      /* ignore */
    }
  }
}

// ---------------------------------------------------------------------------
// CDP 键名映射（覆盖走查用到的键：WASD / ZXCV / 方向键 / 回车 / Esc / 数字）
// ---------------------------------------------------------------------------

const VK = {
  ArrowUp: 38, ArrowDown: 40, ArrowLeft: 37, ArrowRight: 39,
  Enter: 13, Escape: 27, Space: 32, Tab: 9, Backspace: 8,
  Shift: 16, Control: 17, Alt: 18,
  Digit1: 49, Digit2: 50, Digit3: 51, Digit4: 52,
  F1: 112, F2: 113, F3: 114, F4: 115, F5: 116,
};

function vkFor(key) {
  if (VK[key] !== undefined) return VK[key];
  if (/^[a-zA-Z]$/.test(key)) return key.toUpperCase().charCodeAt(0);
  if (/^[0-9]$/.test(key)) return key.charCodeAt(0);
  return 0;
}

function codeFor(key) {
  if (/^[a-zA-Z]$/.test(key)) return "Key" + key.toUpperCase();
  if (/^[0-9]$/.test(key)) return "Digit" + key;
  return key;
}

function textFor(key) {
  if (/^[a-zA-Z0-9]$/.test(key)) return key;
  if (key === "Space") return " ";
  return "";
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export { delay };
export default PageSession;
