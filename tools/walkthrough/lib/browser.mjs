/**
 * PKRC · F-10 自动化走查环境 · headless browser 启动器
 * ---------------------------------------------------------------------------
 * 零依赖：直接 spawn 系统 Chromium 内核（Edge / Chrome），通过
 * `--remote-debugging-port` 暴露 CDP。**不依赖 playwright / puppeteer**。
 *
 * 关键设计：
 *   1. 端口用 `0`（内核自选）——浏览器会把选中的端口写进 user-data-dir 下的
 *      `DevToolsActivePort`（首行 = 端口，次行 = ws 路径）。这样：
 *      · 不占固定端口 ⇒ 支持 A/B 双产物**并跑**（P4-R10 需要的端口隔离）
 *      · 不依赖事先探测空闲端口（避免竞态）
 *   2. user-data-dir 独立 ⇒ A/B 两份产物各自的 localStorage 天然隔离，
 *      存档注入互不污染。
 *   3. 默认 `--headless=new`；如需肉眼核对可 `headless:false`。
 *
 * 沙箱注记：本环境允许 spawn 浏览器进程（已实测 Edg/155 可起 + 暴露 CDP）。
 * 但**不允许 node→node spawn**，所以本模块只 spawn 浏览器，不 spawn Node 子进程。
 */

import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

/** Windows 上常见的 Chromium 内核位置（按优先级） */
const WIN_BROWSER_CANDIDATES = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
];

/** 非 Windows 兜底（本项目当前只在 Windows 上跑，保留以防迁移） */
const NIX_BROWSER_CANDIDATES = [
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
];

/**
 * 解析浏览器可执行文件路径。
 * 优先级：显式参数 > 环境变量 PKRC_BROWSER > 系统常见路径。
 * @param {string} [explicit]
 * @returns {string|null}
 */
export function findBrowserExecutable(explicit) {
  const candidates = [explicit, process.env.PKRC_BROWSER, ...WIN_BROWSER_CANDIDATES, ...NIX_BROWSER_CANDIDATES];
  for (const c of candidates) {
    if (c && existsSync(c)) return c;
  }
  return null;
}

/**
 * 启动一个 headless 浏览器实例并等待 CDP 就绪。
 *
 * @param {object} [opts]
 * @param {string} [opts.executable]  浏览器路径（默认自动探测）
 * @param {boolean} [opts.headless]   默认 true
 * @param {string} [opts.userDataDir] 默认 mkdtemp
 * @param {string[]} [opts.args]      额外 Chromium 参数
 * @param {number} [opts.readyTimeoutMs] 等待 CDP 就绪的上限，默认 20s
 * @returns {Promise<{
 *   wsUrl: string, port: number, userDataDir: string, executable: string,
 *   proc: import('node:child_process').ChildProcess,
 *   close: () => Promise<void>, cleanup: () => void
 * }>}
 */
export async function launchBrowser(opts = {}) {
  const executable = findBrowserExecutable(opts.executable);
  if (!executable) {
    throw new Error(
      "未找到 Chromium 内核浏览器。请安装 Edge/Chrome，或用环境变量 PKRC_BROWSER 指定可执行文件路径。",
    );
  }

  const userDataDir = opts.userDataDir || mkdtempSync(path.join(tmpdir(), "pkrc-wt-"));
  const ownsDataDir = !opts.userDataDir;

  const args = [
    ...(opts.headless === false ? [] : ["--headless=new"]),
    "--remote-debugging-port=0",
    `--user-data-dir=${userDataDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-background-networking",
    "--disable-extensions",
    "--disable-sync",
    "--disable-translate",
    "--mute-audio",
    // 走查要「同一份东西跑两次」⇒ 关掉一切会引入非确定性差异的开关
    "--force-color-profile=srgb",
    "--force-device-scale-factor=1",
    "--hide-scrollbars",
    "--window-size=1280,720",
    // Phaser 在无 GPU 环境下走 Canvas/SwiftShader；不指定 --disable-gpu 以免 WebGL 上下文创建失败
    ...(opts.args || []),
    "about:blank",
  ];

  const proc = spawn(executable, args, {
    stdio: ["ignore", "ignore", "pipe"],
    windowsHide: true,
  });

  // 收集 stderr 便于诊断启动失败
  let stderrBuf = "";
  proc.stderr?.on("data", (d) => {
    stderrBuf += d.toString();
    if (stderrBuf.length > 8000) stderrBuf = stderrBuf.slice(-8000);
  });

  // ⚠️ Windows 上 msedge.exe / chrome.exe 是**启动器存根**：
  //    它会立刻退出（code 0），真实浏览器由子进程承载并继续运行。
  //    因此**不能**把「进程退出」当作启动失败 —— 只以「DevToolsActivePort 出现
  //    + /json/version 可达」为就绪判据。清理走 profile 匹配（见 killByProfile）。
  let exited = false;
  let exitInfo = null;
  proc.on("exit", (code, signal) => {
    exited = true;
    exitInfo = { code, signal };
  });

  const portFile = path.join(userDataDir, "DevToolsActivePort");
  const deadline = Date.now() + (opts.readyTimeoutMs ?? 20_000);
  let port = null;
  while (Date.now() < deadline) {
    if (existsSync(portFile)) {
      try {
        const first = readFileSync(portFile, "utf8").split(/\r?\n/)[0].trim();
        const parsed = Number(first);
        if (Number.isInteger(parsed) && parsed > 0) {
          port = parsed;
          break;
        }
      } catch {
        /* 文件可能正在写，下一轮再试 */
      }
    }
    await delay(100);
  }

  if (port === null) {
    const hint = exited ? `（启动器已退出 code=${exitInfo?.code} signal=${exitInfo?.signal}）` : "（启动器仍在运行）";
    killByProfile(userDataDir);
    throw new Error(
      `等待 CDP 端口就绪超时（${opts.readyTimeoutMs ?? 20_000}ms）${hint}。stderr:\n${stderrBuf}`,
    );
  }

  // 从 /json/version 拿 browser 级 webSocketDebuggerUrl
  const wsUrl = await resolveBrowserWsUrl(port, deadline);

  const cleanup = () => {
    try {
      proc.kill();
    } catch {
      /* ignore */
    }
    // 启动器存根已死也不会遗留：按 profile 目录匹配真实浏览器进程并杀掉
    killByProfile(userDataDir);
    if (ownsDataDir) {
      try {
        rmSync(userDataDir, { recursive: true, force: true });
      } catch {
        /* Windows 上文件锁可能让删除失败，忽略 */
      }
    }
  };

  const close = async () => {
    // 礼貌关闭优先：CDP Browser.close 由调用方通过连接执行；此处兜底强杀
    cleanup();
    // 等一会儿确认端口释放
    const killDeadline = Date.now() + 3000;
    while (Date.now() < killDeadline) {
      try {
        await fetchWithTimeout(`http://127.0.0.1:${port}/json/version`, 500);
      } catch {
        break; // 已不可达 ⇒ 关闭成功
      }
      await delay(100);
    }
  };

  return { wsUrl, port, userDataDir, executable, proc, close, cleanup };
}

/**
 * 按 `--user-data-dir=<dir>` 匹配并强杀残留浏览器进程（Windows 专用兜底）。
 * 用 PowerShell 的 CIM 查询；失败时静默（清理是 best-effort）。
 * 注意：只杀**命令行里带本 profile 路径**的进程，不误伤用户正在用的浏览器。
 * @param {string} userDataDir
 */
export function killByProfile(userDataDir) {
  if (process.platform !== "win32") return;
  try {
    // Windows 路径里的反斜杠在 WMI LIKE 中是普通字符，直接用即可
    const needle = userDataDir.replace(/'/g, "''");
    const ps =
      `Get-CimInstance Win32_Process -Filter "Name='msedge.exe' OR Name='chrome.exe'"` +
      ` | Where-Object { $_.CommandLine -like '*${needle}*' }` +
      ` | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }`;
    spawnSync("powershell", ["-NoProfile", "-NonInteractive", "-Command", ps], {
      stdio: "ignore",
      windowsHide: true,
      timeout: 10_000,
    });
  } catch {
    /* best-effort */
  }
}

/**
 * 轮询 /json/version，取出 browser 级 ws 地址。
 * 端口就绪后该端点通常立刻可用，但仍做短轮询以防竞态。
 */
async function resolveBrowserWsUrl(port, deadline) {
  let lastErr = null;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) {
        const json = await res.json();
        if (json.webSocketDebuggerUrl) return json.webSocketDebuggerUrl;
      }
    } catch (err) {
      lastErr = err;
    }
    await delay(100);
  }
  throw new Error(`无法从 CDP 拿到 browser ws 地址（port ${port}）：${lastErr?.message ?? "unknown"}`);
}

async function fetchWithTimeout(url, timeoutMs) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export { delay };
