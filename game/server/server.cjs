/*
 * PKRC · S1 服务层
 * ---------------------------------------------------------------------------
 * 本文件由原 ~60 行脚本重构为「服务工厂」，目的有三个：
 *   ① S7：Electron 主进程内嵌服务（startServer({port:0})）
 *   ② 排错：--serve-only / --dev 在无 Electron 环境下定位问题
 *   ③ 日志：把 stdout/stderr 从黑框搬进 game/logs/，并给启动器一个错误信号
 *
 * 设计依据：docs/delegation/03-后端工程师-派单.md §2
 * 硬约束（详见 docs/tech-stack-decision.md）：
 *   - 【向后兼容】无参数启动必须与改造前**逐字节等价**：端口 8000、静态目录 ./dist
 *   - 【D3】不得新增运行时依赖（Express 4 + Node 内置模块，仅此而已）
 *   - 【优雅关闭】close() 返回的 Promise 必定 resolve（带超时保护）
 *
 * B-11（第四阶段，2026-10-16）追加的**纯增量**能力，用于自动化走查（F-10/A4-01/A4-04）：
 *   - `--ready-file=<path>`：listen 成功后原子写一个 JSON 就绪信号（含**实际端口**）
 *   - `GET /__pkrc/health`：保留命名空间下的只读探活端点
 *   - `--log-dir` 已可指向走查证据目录（logger 自动建目录，无需改动）
 *   ⇒ 三者都**不改变**任何既有路径的行为；不带这些参数时与改造前完全一致。
 *
 * 与原实现的**已知行为差异**（有意为之，均已登记）：
 *   | 项 | 原实现 | 现实现 | 理由 |
 *   |---|---|---|---|
 *   | 端口被占用 | 抛 EADDRINUSE，进程崩溃（日志在黑框里，用户看不到） | 记 ERROR 日志 + 非 0 退出码 + 明确的修复建议 | 派单 §2.4 明确要求"不得静默换端口" |
 *   | 未命中路径 | 200 + `{ok:false}` | **保持 200 + `{ok:false}`** | 见下方 catchAll 注释——这是有意保留的历史行为 |
 *   | 静态目录默认 | `__dirname/dist` | 同上（默认值不变） | 向后兼容 |
 */

"use strict";

const express = require("express");
const http = require("http");
const path = require("path");
const fs = require("fs");
const { createLogger } = require("./logger.cjs");

/** 原实现的默认值，**不可修改**（向后兼容） */
const DEFAULT_PORT = 8000;
const DEFAULT_STATIC_DIR = path.join(__dirname, "dist");
const DEFAULT_LOG_DIR = path.join(__dirname, "..", "logs");
/** close() 的超时保护：Electron 退出不能被残留 keep-alive 连接拖死 */
const CLOSE_TIMEOUT_MS = 3000;

/**
 * B-11 · 保留命名空间下的健康端点。
 *
 * 为什么用 `__pkrc/` 前缀：兜底路由 `app.get("*")` 对**任意**未命中路径返回
 * `200 + {ok:false}`（有意保留的历史行为）。若健康端点用普通路径（如 `/health`），
 * 一旦前端某天真的要请求 `/health`，就会撞上这个保留路径 —— 用一个前端不可能用的
 * 前缀可以彻底避免语义冲突，且**不改变**任何既有路径的行为。
 */
const HEALTH_PATH = "/__pkrc/health";

/** 就绪文件的格式版本；驱动方（headless browser / CI / release.cjs）据此判读 */
const READY_FILE_VERSION = 1;

// ---------------------------------------------------------------------------
// 参数解析
// ---------------------------------------------------------------------------

/**
 * 解析命令行参数。**不依赖任何第三方 argv 库**（D3）。
 *
 * 支持（`--k=v` 与 `--k v` **两种写法都认**）：
 *   --serve-only          只起服务，不拉起 Electron
 *   --no-open             起服务 + Electron，但不自动开浏览器
 *   --dev                 控制台保留输出 + DEBUG 级别日志
 *   --static-dir=<path>   静态目录（默认 ./dist）
 *   --port=<n>            等价于 PORT 环境变量（环境变量优先，见 resolvePort）
 *   --keep=<n>            日志保留份数
 *   --log-dir=<path>      日志目录
 *   --ready-file=<path>   【B-11】启动就绪后写一个 JSON 信号文件（供自动化等待）
 *   --no-ready-file       【B-11】显式关闭就绪文件
 *   --help / -h           打印帮助
 *
 * ⚠️ 为什么**必须**同时认空格形式（2026-10-16 补）：
 *    原实现只认 `--k=v`。文档里写的全是等号形式，所以一直没暴露。但这正是项目
 *    已登记过的一类隐蔽 bug ——「文档写等号、代码只认空格」（或反之）会导致参数
 *    **被静默忽略并 fallback 到默认值**，表面上还"成功"了。
 *    取值型选项统一走 `VALUE_OPTS`，两种写法共用同一条取值路径。
 *    纯布尔选项（--serve-only 等）不吃下一个参数，避免误吞。
 *
 * @param {string[]} argv  通常传 process.argv.slice(2)
 */
function parseArgs(argv = []) {
  const out = {
    serveOnly: false,
    noOpen: false,
    dev: false,
    help: false,
    staticDir: undefined,
    port: undefined,
    keep: undefined,
    logDir: undefined,
    readyFile: undefined,
  };

  /** 需要**取值**的选项（只有这些才允许吞掉下一个 argv） */
  const VALUE_OPTS = new Set(["--static-dir", "--port", "--keep", "--log-dir", "--ready-file"]);

  for (let i = 0; i < argv.length; i++) {
    const raw = argv[i];
    if (!raw || raw[0] !== "-") continue;
    const eq = raw.indexOf("=");
    const key = eq === -1 ? raw : raw.slice(0, eq);
    let val = eq === -1 ? undefined : raw.slice(eq + 1);
    // 空格形式：`--k v`。仅对取值型选项生效，且下一项不得是另一个选项。
    if (eq === -1 && VALUE_OPTS.has(key) && argv[i + 1] !== undefined && argv[i + 1].charAt(0) !== "-") {
      val = argv[i + 1];
      i++;
    }

    switch (key) {
      case "--serve-only":
        out.serveOnly = true;
        break;
      case "--no-open":
        out.noOpen = true;
        break;
      case "--dev":
        out.dev = true;
        break;
      case "--help":
      case "-h":
        out.help = true;
        break;
      case "--static-dir":
        if (!val) throw new Error("--static-dir 需要值，例如 --static-dir=./dist");
        out.staticDir = val;
        break;
      case "--port":
        if (!val || !Number.isInteger(Number(val))) throw new Error("--port 需要整数");
        out.port = Number(val);
        break;
      case "--keep":
        if (!val || !Number.isInteger(Number(val))) throw new Error("--keep 需要整数");
        out.keep = Number(val);
        break;
      case "--log-dir":
        // `--log-dir=` （显式空值）= 禁用文件日志，只输出到控制台
        out.logDir = val ? val : null;
        break;
      case "--ready-file":
        // 三态语义与 --log-dir 一致：未给 = undefined；`--ready-file=` 显式空值 = 禁用
        out.readyFile = val ? val : null;
        break;
      case "--no-ready-file":
        out.readyFile = null;
        break;
      default:
        // 未知参数不致命：可能是全栈的启动器透传参数。记下来但继续。
        break;
    }
  }
  return out;
}

const HELP = `PKRC Express 静态服务 · S1

用法：node server.cjs [选项]

选项：
  --serve-only          只起服务，不拉起 Electron（排错 / 远程访问 / CI）
  --no-open             起服务 + Electron，但不自动打开浏览器
  --dev                 保留控制台输出 + DEBUG 级别日志
  --static-dir=<path>   静态目录（默认 ./dist）
  --port=<n>            监听端口（默认 8000；PORT 环境变量优先级更高）
  --log-dir=<path>      日志目录（默认 ../logs；目录不存在会自动创建）
  --keep=<n>            日志保留份数（默认 10）
  --ready-file=<path>   启动就绪后写 JSON 信号文件（供 headless browser / CI 等待）
  --no-ready-file       显式关闭就绪文件
  -h, --help            显示本帮助

环境变量：
  PORT                  监听端口，优先级高于 --port（向后兼容原语义）

示例：
  node server.cjs                          # 默认：8000 + ./dist
  PORT=8100 node server.cjs                # 监听 8100
  node server.cjs --serve-only --dev       # 只起服务，详细日志
  node server.cjs --static-dir=./other-dist

  # B-11 走查/自动化：固定端口 + 日志定向 + 就绪信号
  node server.cjs --serve-only --port=8099 --static-dir=./dist \\
                  --log-dir=../../tools/walkthrough/evidence/<场景>/logs \\
                  --ready-file=../../tools/walkthrough/evidence/<场景>/ready.json
  # 就绪探测（服务起来后）：
  #   curl -s http://127.0.0.1:8099/__pkrc/health
`;

/**
 * 端口优先级：PORT 环境变量 > --port > 默认 8000。
 * 原实现只读 process.env.PORT，此处**不得改变该语义**——所以环境变量优先。
 */
function resolvePort(cliPort) {
  const envPort = process.env.PORT;
  if (envPort !== undefined && envPort !== "") {
    const n = Number(envPort);
    if (Number.isInteger(n) && n >= 0 && n <= 65535) return n;
    // 显式告警但不静默回退到 8000：静默回退会让 Electron 指向错误地址
    throw new Error(`PORT 环境变量非法：${JSON.stringify(envPort)}`);
  }
  if (Number.isInteger(cliPort)) return cliPort;
  return DEFAULT_PORT;
}

// ---------------------------------------------------------------------------
// Express 应用工厂
// ---------------------------------------------------------------------------

function fileExists(filePath) {
  return new Promise((resolve) => {
    fs.access(filePath, fs.constants.F_OK, (err) => resolve(!err));
  });
}

/**
 * 创建 Express 应用（**不监听**）。单机启动与 Electron 内嵌共用同一份路由逻辑。
 *
 * @param {{ staticDir?: string, logger?: import('./logger.cjs').Logger }} [opts]
 * @returns {import('express').Express}
 */
function createApp(opts = {}) {
  const staticDir = path.resolve(opts.staticDir || DEFAULT_STATIC_DIR);
  const logger = opts.logger || createLogger({ logDir: null, silent: true });
  const app = express();

  app.disable("x-powered-by");
  app.locals.startedAt = Date.now();
  app.locals.port = null; // startServer 监听成功后回填（createApp 阶段还不知道端口）

  // ---- 0. 健康端点（B-11）-------------------------------------------------
  // 注册在静态资源**之前**，以保证 `__pkrc/` 命名空间不被 dist 里的同名文件占用。
  // 语义：纯只读探活，不触碰 dist；这是自动化「等待服务就绪」的最简判据。
  //
  // ⚠️ 它**不**改变兜底路由的行为：`/__pkrc/health` 之外的所有路径照旧走
  //    `200 + {ok:false}` 的原有语义（详见下方 catchAll 注释）。
  app.get(HEALTH_PATH, (_req, res) => {
    res.json({
      ok: true,
      app: "pkrc-server",
      pid: process.pid,
      node: process.version,
      port: app.locals.port,
      staticDir: app.locals.staticDir,
      startedAt: new Date(app.locals.startedAt).toISOString(),
      uptimeMs: Date.now() - app.locals.startedAt,
    });
  });

  // ---- 1. 静态资源 --------------------------------------------------------
  app.use(express.static(staticDir));

  // ---- 2. 请求日志（替代原实现里的空 res.on("finish") 占位） ----------------
  // 原实现这里是 `res.on("finish", () => { /* 注释掉的 console.log */ })`，
  // 等价于什么都不做。现在真的记一条，但只在 dev 级别下才输出，
  // 避免正常运行时被 825MB 资产的成百上千条请求刷屏。
  app.use((req, res, next) => {
    const startedAt = process.hrtime.bigint();
    res.on("finish", () => {
      const ms = Number(process.hrtime.bigint() - startedAt) / 1e6;
      // 静态资源命中（2xx/304）走 debug；异常状态走 warn
      const level = res.statusCode >= 400 ? "warn" : "debug";
      logger[level](`${req.method} ${req.originalUrl} -> ${res.statusCode} ${ms.toFixed(1)}ms`);
    });
    next();
  });

  // ---- 3. 兜底路由 --------------------------------------------------------
  // ⚠️ 行为快照（有意保留，请勿"顺手修正"）：
  //   原实现对**任意**未命中路径返回 `200 + {ok:false}`，**不是 404**。
  //   前端可能依赖「拿到 JSON 且 ok=false」这一判定来做路由回退，
  //   直接改成 404 会让 `res.json()` 之外的调用方拿到 HTML 错误页 → 解析炸掉。
  //   → 因此本实现逐字保持原语义。若要改为 404，需前端确认后再动。
  app.get("*", async (req, res, next) => {
    try {
      // 防目录穿越：resolve 后必须仍在 staticDir 内
      const requested = path.resolve(staticDir, "." + path.posix.normalize(req.path));
      if (requested !== staticDir && !requested.startsWith(staticDir + path.sep)) {
        logger.warn(`路径穿越尝试：${req.path}`);
        return res.status(400).json({ ok: false, message: "Invalid path" });
      }

      const exists = await fileExists(requested);
      if (!exists) {
        return res.json({ ok: false, message: "File not found" });
      }
      return res.sendFile(path.join(staticDir, "index.html"));
    } catch (error) {
      return next(error);
    }
  });

  // ---- 4. 错误处理 --------------------------------------------------------
  app.use((err, req, res, _next) => {
    logger.error(`请求处理失败：${req.method} ${req.originalUrl}`, err);
    if (res.headersSent) return;
    res.status(500).send("Something went wrong!");
  });

  app.locals.staticDir = staticDir;
  return app;
}

// ---------------------------------------------------------------------------
// 启动 / 关闭
// ---------------------------------------------------------------------------

/**
 * B-11 · 写「就绪信号」文件。
 *
 * 为什么用**文件**而不是只靠日志/HTTP：驱动方（headless browser、CI、shell）
 * 需要在「服务已 listen 完毕」这一刻被唤醒，且要能拿到**实际端口**（`--port=0`
 * 时是内核分配的）。轮询 HTTP 有竞态（端口未知），解析日志太脆弱
 * （依赖日志格式，且日志可能被禁用）。一次原子写文件是最稳的握手。
 *
 * 失败时**不抛错**：就绪信号是辅助能力，不能因为它拖垮服务启动。
 *
 * @param {string|null|undefined} filePath
 * @param {object} payload
 * @returns {string|null} 实际写入路径；未写返回 null
 */
function writeReadyFile(filePath, payload) {
  if (!filePath) return null;
  try {
    const abs = path.resolve(filePath);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    // 先写临时文件再 rename：避免驱动方读到**写了一半**的 JSON
    const tmp = `${abs}.tmp-${process.pid}`;
    fs.writeFileSync(tmp, JSON.stringify(payload, null, 2), "utf8");
    fs.renameSync(tmp, abs);
    return abs;
  } catch {
    return null;
  }
}

/**
 * 启动服务。
 *
 * @param {object} [opts]
 * @param {number} [opts.port]          端口；**0 = 动态端口**（S7 Electron 内嵌场景）
 * @param {string} [opts.staticDir]
 * @param {object} [opts.logger]
 * @param {string} [opts.host]
 * @param {string} [opts.readyFile]     就绪后写 JSON 信号文件（B-11）
 * @param {string} [opts.tag]           就绪文件里的用途标签（如 "walkthrough"）
 * @returns {Promise<{port:number, host:string, url:string, readyFile:string|null, close:()=>Promise<void>, server:import('http').Server, app:import('express').Express}>}
 */
async function startServer(opts = {}) {
  const logger = opts.logger || createLogger({ logDir: null, silent: true });
  const host = opts.host || "127.0.0.1";
  // 注意：这里不能直接用 resolvePort(opts.port)，因为 S7 传的是 {port:0}，
  // 而 resolvePort 会在 PORT 环境变量存在时覆盖它。S7 场景必须走显式端口。
  const port = Number.isInteger(opts.port) ? opts.port : resolvePort(undefined);
  const app = createApp({ staticDir: opts.staticDir, logger });
  const server = http.createServer(app);

  // keep-alive 连接会让 close() 挂住，进而卡死 Electron 退出
  server.keepAliveTimeout = 5000;
  server.headersTimeout = 10000;

  await new Promise((resolve, reject) => {
    const onError = (err) => {
      server.removeListener("listening", onListening);
      reject(err);
    };
    const onListening = () => {
      server.removeListener("error", onError);
      resolve();
    };
    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(port, host);
  });

  // 从 server.address() 读真实端口 —— port=0 时拿到的是内核分配值
  const actualPort = server.address().port;
  app.locals.port = actualPort; // 供 /__pkrc/health 使用
  const url = `http://${host === "0.0.0.0" ? "localhost" : host}:${actualPort}/`;
  logger.info(`server listening on ${url} (static: ${app.locals.staticDir})`);

  // ---- B-11 就绪信号 ------------------------------------------------------
  const readyFile = writeReadyFile(opts.readyFile, {
    version: READY_FILE_VERSION,
    ok: true,
    tag: opts.tag || null,
    pid: process.pid,
    node: process.version,
    host,
    port: actualPort,
    url,
    healthPath: HEALTH_PATH,
    staticDir: app.locals.staticDir,
    logFile: logger.currentLogPath() || null,
    startedAt: new Date(app.locals.startedAt).toISOString(),
  });
  if (readyFile) logger.info(`ready file: ${readyFile}`);

  let closed = false;
  const close = () =>
    new Promise((resolve) => {
      if (closed) return resolve();
      closed = true;
      // 就绪文件在关闭时删除：驱动方据此判断「服务已不在」。
      // ⚠️ 硬杀（SIGKILL / 任务管理器）不会走到这里 → 残留文件可能过时，
      //    驱动方应**同时**用 pid liveness 或 /__pkrc/health 复核（已写入文档）。
      if (readyFile) {
        try {
          fs.unlinkSync(readyFile);
        } catch {
          /* 已被删或不可写，忽略 */
        }
      }
      // 超时保护：3s 内无论如何都要 resolve，绝不让 Electron 卡在退出上
      const timer = setTimeout(() => {
        logger.warn(`close() 超时 ${CLOSE_TIMEOUT_MS}ms，强制释放端口`);
        try {
          server.closeAllConnections?.();
        } catch {
          /* Node <18.2 无此 API，忽略 */
        }
        resolve();
      }, CLOSE_TIMEOUT_MS);
      timer.unref?.();

      server.close(() => {
        clearTimeout(timer);
        logger.info("server closed");
        resolve();
      });
      // 主动断开空闲 keep-alive 连接，否则 close() 回调迟迟不来
      try {
        server.closeIdleConnections?.();
      } catch {
        /* 同上 */
      }
    });

  return { port: actualPort, host, url, readyFile, close, server, app };
}

// ---------------------------------------------------------------------------
// CLI 入口
// ---------------------------------------------------------------------------

async function main(argv = process.argv.slice(2)) {
  let args;
  try {
    args = parseArgs(argv);
  } catch (err) {
    process.stderr.write(`${err.message}\n\n${HELP}`);
    return 2;
  }

  if (args.help) {
    process.stdout.write(HELP);
    return 0;
  }

  const logger = createLogger({
    // 三态语义：undefined = 未指定（用默认目录）；null = 显式禁用（--log-dir=）；字符串 = 自定义目录
    // ⚠️ 不能用 `args.logDir || DEFAULT_LOG_DIR`，那会把 null 静默折回默认目录，
    //    导致 `--log-dir=`（用户明确要求禁用）失效。
    logDir: args.logDir === undefined ? DEFAULT_LOG_DIR : args.logDir,
    keep: args.keep,
    dev: args.dev,
    scope: "server",
    // --dev 时日志同时进控制台和文件；生产时也保留控制台（进程被 VBS 隐藏，无副作用）
    silent: false,
  });

  logger.info(`PKRC server starting (node ${process.version})`);

  let port;
  try {
    port = resolvePort(args.port);
  } catch (err) {
    logger.error(err.message);
    // B-11：失败也要**留下就绪信号**（ok:false），否则驱动方会一直等到超时，
    // 无法区分「起来但崩了」与「压根没起」。
    writeReadyFile(args.readyFile, { version: READY_FILE_VERSION, ok: false, stage: "port", error: err.message, pid: process.pid });
    return 2;
  }

  // 端口被占用时**明确报错**并给出修复建议，不静默换端口（派单 §2.4）
  let handle;
  try {
    handle = await startServer({
      port,
      staticDir: args.staticDir,
      logger,
      readyFile: args.readyFile,
      tag: "cli",
    });
  } catch (err) {
    if (err && err.code === "EADDRINUSE") {
      logger.error(
        `EADDRINUSE: 端口 ${port} 已被占用。` +
          `请关闭占用该端口的进程，或运行 game\\free-port.bat，` +
          `或用 PORT=<其他端口> 重新启动。`,
      );
    } else if (err && err.code === "EACCES") {
      logger.error(`EACCES: 无权绑定端口 ${port}（<1024 的端口需要管理员权限）`);
    } else {
      logger.error("服务启动失败", err);
    }
    logger.info(`日志文件：${logger.currentLogPath() || "(未启用)"}`);
    writeReadyFile(args.readyFile, {
      version: READY_FILE_VERSION,
      ok: false,
      stage: "listen",
      error: err && err.code ? `${err.code}: ${err.message}` : String(err && err.message ? err.message : err),
      port,
      pid: process.pid,
      logFile: logger.currentLogPath() || null,
    });
    return 1;
  }

  if (logger.currentLogPath()) {
    logger.info(`日志文件：${logger.currentLogPath()}`);
  }

  // 独立进程模式下才自己管生命周期；被 require 时不接管（S7 场景）
  let shuttingDown = false;
  const shutdown = async (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info(`收到 ${signal}，正在关闭服务…`);
    await handle.close();
    logger.info(`本次运行 hasError=${logger.hasError()}`);
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));

  // 未捕获异常：记日志 + 非 0 退出（启动器据此弹窗）
  process.on("uncaughtException", (err) => {
    logger.error("uncaughtException", err);
    process.exit(1);
  });
  process.on("unhandledRejection", (reason) => {
    logger.error("unhandledRejection", reason);
    process.exit(1);
  });

  if (!args.serveOnly && !args.noOpen) {
    // 全栈的启动器负责拉起 Electron；此处只在**显式**要求时提示，
    // 避免"服务端擅自启动 Electron"造成双开。
    logger.debug("未指定 --serve-only：Electron 外壳由 start-game.bat / 启动.vbs 负责");
  }

  return 0;
}

module.exports = {
  createApp,
  startServer,
  writeReadyFile,
  parseArgs,
  resolvePort,
  DEFAULT_PORT,
  DEFAULT_STATIC_DIR,
  DEFAULT_LOG_DIR,
  CLOSE_TIMEOUT_MS,
  HEALTH_PATH,
  READY_FILE_VERSION,
};

// 仅在直接运行本文件时执行 CLI；被 require 时（S7 / 单测）不执行。
if (require.main === module) {
  main()
    .then((code) => {
      if (code !== 0) process.exitCode = code;
    })
    .catch((err) => {
      process.stderr.write(`fatal: ${err && err.stack ? err.stack : err}\n`);
      process.exitCode = 1;
    });
}
