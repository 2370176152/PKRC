/**
 * PKRC · F-10 自动化走查环境 · 极简 CDP 客户端
 * ---------------------------------------------------------------------------
 * 为什么自己写：项目根目录没有包管理器（无 package.json / pnpm），且 F-10 要求
 * 「零依赖、可复跑」。Node 22 起内置 `globalThis.WebSocket`（undici 实现），
 * 因此可以直接讲 Chrome DevTools Protocol，无需 playwright / puppeteer。
 *
 * 职责边界：只做「信令」——连接、发送命令、派发事件、按 sessionId 路由。
 * 不关心「走查」语义（那是 session.mjs / runner.mjs 的事）。
 *
 * 协议要点（CDP 1.3）：
 *   - 命令  : { id, method, params, sessionId? }
 *   - 回复  : { id, result } | { id, error }
 *   - 事件  : { method, params, sessionId? }
 *   - Target.attachToTarget({flatten:true}) 返回 sessionId，
 *     之后把 sessionId 挂在命令上即可操作该 page，无需再开一层 WebSocket。
 */

/** CDP 调用超时兜底（毫秒）——防止某条命令永久挂起拖死整个走查 */
const DEFAULT_TIMEOUT_MS = 30_000;

/**
 * 一个到浏览器（browser endpoint）的 CDP 连接。
 *
 * 使用：
 *   const cdp = await CdpConnection.connect(wsUrl);
 *   const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
 *   await cdp.send("Page.navigate", { url }, sessionId);
 */
export class CdpConnection {
  /** @param {WebSocket} ws */
  constructor(ws) {
    this._ws = ws;
    /** @type {Map<number, {resolve:Function, reject:Function, timer:any, method:string}>} */
    this._pending = new Map();
    /** @type {Map<string, Set<Function>>} */
    this._listeners = new Map();
    this._nextId = 1;
    this._closed = false;

    ws.addEventListener("message", (ev) => this._onMessage(ev.data));
    ws.addEventListener("close", () => this._onClose("websocket closed"));
    ws.addEventListener("error", (ev) => this._onClose("websocket error: " + (ev?.message ?? "")));
  }

  /**
   * @param {string} wsUrl  形如 ws://127.0.0.1:<port>/devtools/browser/<uuid>
   * @returns {Promise<CdpConnection>}
   */
  static async connect(wsUrl) {
    const ws = new WebSocket(wsUrl);
    // 部分环境 WebSocket 已存在但尚未 open，需要显式 await open 事件
    if (ws.readyState !== WebSocket.OPEN) {
      await new Promise((resolve, reject) => {
        const onOpen = () => {
          cleanup();
          resolve();
        };
        const onErr = (ev) => {
          cleanup();
          reject(new Error("CDP 连接失败：" + (ev?.message ?? "unknown")));
        };
        const cleanup = () => {
          ws.removeEventListener("open", onOpen);
          ws.removeEventListener("error", onErr);
        };
        ws.addEventListener("open", onOpen);
        ws.addEventListener("error", onErr);
      });
    }
    return new CdpConnection(ws);
  }

  get closed() {
    return this._closed;
  }

  /**
   * 发送一条 CDP 命令并等待回复。
   * @param {string} method
   * @param {object} [params]
   * @param {string} [sessionId]  传了则作用于该 target 会话
   * @param {number} [timeoutMs]
   * @returns {Promise<any>} result
   */
  send(method, params = {}, sessionId, timeoutMs = DEFAULT_TIMEOUT_MS) {
    if (this._closed) return Promise.reject(new Error(`CDP 已关闭，无法发送 ${method}`));
    const id = this._nextId++;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this._pending.delete(id);
        reject(new Error(`CDP 命令超时（${timeoutMs}ms）：${method}`));
      }, timeoutMs);
      // timer 不应阻止进程退出
      timer.unref?.();
      this._pending.set(id, { resolve, reject, timer, method });
      try {
        this._ws.send(JSON.stringify(payload));
      } catch (err) {
        clearTimeout(timer);
        this._pending.delete(id);
        reject(err);
      }
    });
  }

  /**
   * 订阅 CDP 事件。
   * @param {string} method  事件名，如 "Page.loadEventFired"；"*" 表示全部
   * @param {(params:any, sessionId:string|undefined)=>void} handler
   * @returns {()=>void} 取消订阅
   */
  on(method, handler) {
    if (!this._listeners.has(method)) this._listeners.set(method, new Set());
    this._listeners.get(method).add(handler);
    return () => this._listeners.get(method)?.delete(handler);
  }

  /**
   * 等待某个 CDP 事件（一次性）。可传谓词过滤。
   * @param {string} method
   * @param {(params:any, sessionId:string|undefined)=>boolean} [predicate]
   * @param {number} [timeoutMs]
   */
  waitForEvent(method, predicate, timeoutMs = DEFAULT_TIMEOUT_MS) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        off();
        reject(new Error(`等待事件超时（${timeoutMs}ms）：${method}`));
      }, timeoutMs);
      timer.unref?.();
      const off = this.on(method, (params, sessionId) => {
        if (predicate && !predicate(params, sessionId)) return;
        clearTimeout(timer);
        off();
        resolve({ params, sessionId });
      });
    });
  }

  _onMessage(raw) {
    let msg;
    try {
      msg = JSON.parse(typeof raw === "string" ? raw : String(raw));
    } catch {
      return; // 非 JSON 帧直接忽略
    }

    if (msg.id !== undefined) {
      const entry = this._pending.get(msg.id);
      if (!entry) return;
      this._pending.delete(msg.id);
      clearTimeout(entry.timer);
      if (msg.error) {
        entry.reject(new Error(`CDP 错误 [${entry.method}]：${msg.error.message}（code ${msg.error.code}）`));
      } else {
        entry.resolve(msg.result);
      }
      return;
    }

    if (msg.method) {
      const sets = [this._listeners.get(msg.method), this._listeners.get("*")];
      for (const set of sets) {
        if (!set) continue;
        for (const fn of [...set]) {
          try {
            fn(msg.params, msg.sessionId);
          } catch {
            /* 监听器异常不影响主流程 */
          }
        }
      }
    }
  }

  _onClose(reason) {
    if (this._closed) return;
    this._closed = true;
    for (const [, entry] of this._pending) {
      clearTimeout(entry.timer);
      entry.reject(new Error(`CDP 连接中断（${reason}），命令 ${entry.method} 未完成`));
    }
    this._pending.clear();
  }

  close() {
    if (this._closed) return;
    this._closed = true;
    try {
      this._ws.close();
    } catch {
      /* ignore */
    }
  }
}

export default CdpConnection;
