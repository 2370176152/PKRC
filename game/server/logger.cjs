/*
 * PKRC · S1 日志模块
 * ---------------------------------------------------------------------------
 * 设计依据：docs/delegation/03-后端工程师-派单.md §2.3
 * 硬约束（见 docs/tech-stack-decision.md · D3）：**不得引入任何新运行时依赖**。
 *   因此本模块只用 Node 内置模块（fs / path / os），不依赖 winston / pino 等。
 *
 * 契约（与全栈的接口，冻结后需双方确认）：
 *   logger.hasError()        -> boolean     本次运行是否出现过 ERROR
 *   logger.currentLogPath()  -> string      当前日志文件绝对路径
 *   logger.info/warn/error/debug(msg, meta)
 *   logger.child(scope)      -> Logger      带作用域前缀的子 logger
 *   logger.close()           -> Promise<void>
 *
 * 设计取舍：
 *   1. **同步写入（appendFileSync）**——服务层日志量极低（启动 + 少量请求），
 *      同步写换来「进程崩溃时日志不丢」。异步流会在崩溃时丢失尾部日志，
 *      而尾部恰恰是排错最需要的部分。代价是每行一次 syscall，量级可忽略。
 *   2. **stdout + stderr 合流到单文件**——按派单 §2.3 要求，避免两文件时间线错位。
 *   3. **轮转按文件数（N=10）而非按大小**——单次运行一个文件，天然按天/次切分。
 *   4. **失败静默降级**——日志写不进去（磁盘满/只读 fs）绝不能拖垮服务启动。
 */

"use strict";

const fs = require("fs");
const path = require("path");

/** 默认保留的日志文件份数 */
const DEFAULT_KEEP = 10;

const LEVELS = {
  DEBUG: { label: "DEBUG", rank: 10 },
  INFO: { label: "INFO ", rank: 20 },
  WARN: { label: "WARN ", rank: 30 },
  ERROR: { label: "ERROR", rank: 40 },
};

/** 与全栈约定的时间戳格式：yyyyMMdd-HHmmss */
function stamp(date = new Date()) {
  const p = (n, w = 2) => String(n).padStart(w, "0");
  return (
    `${date.getFullYear()}${p(date.getMonth() + 1)}${p(date.getDate())}` +
    `-${p(date.getHours())}${p(date.getMinutes())}${p(date.getSeconds())}`
  );
}

/** 与全栈约定的日志行时间格式：yyyy-MM-dd HH:mm:ss.SSS */
function lineTime(date = new Date()) {
  const p = (n, w = 2) => String(n).padStart(w, "0");
  return (
    `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())} ` +
    `${p(date.getHours())}:${p(date.getMinutes())}:${p(date.getSeconds())}.` +
    `${p(date.getMilliseconds(), 3)}`
  );
}

/**
 * 把任意值安全地转成单行文本。
 * 关键：**必须把换行压平**，否则多行 stack 会破坏「一行一条日志」的格式契约，
 * 也会让 grep 排错时定位到错误的行首。
 */
function stringify(value) {
  if (value === undefined) return "";
  if (value === null) return "null";
  if (typeof value === "string") return value;
  if (value instanceof Error) return `${value.name}: ${value.message}\n${value.stack || ""}`;
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

/**
 * 压平：把 `stringify` 产出的**所有**换行替换为「换行 + 4 空格缩进」。
 * stack 仍可读，且**每条日志的首行都以 `[` 开头**，续行都以 4 空格开头。
 *
 * ⚠️ 两个必须注意的顺序/转义陷阱：
 *   ① 必须**先 stringify 再 flatten**。反过来的话，stringify 内部新插入的换行
 *      会漏网 → 续行不带缩进 → 无法与记录首行区分。
 *   ② `String.replace(pat, repl)` 中 repl 里的 `$` 是特殊符号（`$&`/`$1`/`$\``）。
 *      若日志正文含 `$&` 等序列会被二次展开 —— 所以用**函数式 repl** 规避。
 *
 * 记录边界契约（供排错脚本依赖）：
 *   记录首行 = /^\[\d{4}-\d{2}-\d{2} /
 *   续行     = /^ {4}/
 */
function flatten(text) {
  return String(text).replace(/\r\n|\r|\n/g, () => "\n    ");
}

/**
 * 落盘写入器。把「写文件」这件事从 Logger 里拆出来，便于：
 *   ① opts.logDir === null 时整体禁用（--dev 只想看控制台）
 *   ② 单测里注入假的 sink
 */
class FileSink {
  constructor(opts) {
    this.dir = opts.dir;
    this.keep = Number.isFinite(opts.keep) ? opts.keep : DEFAULT_KEEP;
    this.filePath = null;
    this.enabled = false;
    this._error = null;
  }

  /** 建立日志目录与本次运行的文件。失败则永久降级为禁用，不抛错。 */
  open() {
    try {
      fs.mkdirSync(this.dir, { recursive: true });
      this.filePath = path.join(this.dir, `node-${stamp()}.log`);
      // 直接创建文件：即使本次运行没有任何日志（如 --help），也应留下痕迹
      fs.appendFileSync(this.filePath, "", "utf8");
      this.enabled = true;
      this._rotate();
      return this.filePath;
    } catch (err) {
      this._error = err;
      this.enabled = false;
      this.filePath = null;
      return null;
    }
  }

  /**
   * 轮转：保留最近 keep 份。
   * 只删「匹配本模块命名规则」的文件，绝不删目录内其他内容——避免误删用户放进去的东西。
   */
  _rotate() {
    if (!Number.isFinite(this.keep) || this.keep <= 0) return;
    try {
      const entries = fs
        .readdirSync(this.dir)
        .filter((name) => /^node-\d{8}-\d{6}\.log$/.test(name))
        .sort(); // 时间戳定长字典序 == 时间序
      const excess = entries.length - this.keep;
      for (let i = 0; i < excess; i++) {
        try {
          fs.unlinkSync(path.join(this.dir, entries[i]));
        } catch {
          /* 单个删除失败不应影响启动 */
        }
      }
    } catch {
      /* 目录读不到就算了，日志功能降级不影响服务 */
    }
  }

  write(line) {
    if (!this.enabled || !this.filePath) return;
    try {
      fs.appendFileSync(this.filePath, line + "\n", "utf8");
    } catch (err) {
      // 写失败（磁盘满等）→ 降级并记录一次，避免每行都抛异常刷屏
      this.enabled = false;
      this._error = err;
    }
  }
}

class Logger {
  /**
   * @param {object} opts
   * @param {FileSink|null} opts.sink
   * @param {string} opts.scope       作用域前缀，如 "server"
   * @param {number} opts.minRank     最低输出级别 rank
   * @param {boolean} opts.console    是否同时输出到控制台
   * @param {boolean} opts.color      控制台是否着色（仅 TTY 场景有意义）
   */
  constructor(opts) {
    this.sink = opts.sink || null;
    this.scope = opts.scope || "";
    this.minRank = opts.minRank ?? LEVELS.INFO.rank;
    this.console = opts.console !== false;
    this.color = !!opts.color;
    this._hasError = false;
  }

  _emit(level, message, meta) {
    const now = new Date();
    if (level.rank >= LEVELS.ERROR.rank) this._hasError = true;
    if (level.rank < this.minRank) return;

    const scoped = this.scope ? `[${this.scope}] ` : "";
    // 先 stringify（可能引入换行），再 flatten（压平全部换行）
    const body = flatten(stringify(message));
    const extra = meta === undefined ? "" : ` ${flatten(stringify(meta))}`;
    const line = `[${lineTime(now)}] [${level.label}] ${scoped}${body}${extra}`;

    if (this.sink) this.sink.write(line);
    if (this.console) {
      const stream = level.rank >= LEVELS.ERROR.rank ? process.stderr : process.stdout;
      try {
        stream.write(line + "\n");
      } catch {
        /* 控制台管道可能已关闭，忽略 */
      }
    }
  }

  debug(message, meta) {
    this._emit(LEVELS.DEBUG, message, meta);
  }
  info(message, meta) {
    this._emit(LEVELS.INFO, message, meta);
  }
  warn(message, meta) {
    this._emit(LEVELS.WARN, message, meta);
  }
  error(message, meta) {
    this._emit(LEVELS.ERROR, message, meta);
  }

  /** 派生带作用域的子 logger，共享同一个 sink（因此 hasError 是全局的） */
  child(scope) {
    const self = this;
    const sub = new Logger({
      sink: this.sink,
      scope: this.scope ? `${this.scope}:${scope}` : scope,
      minRank: this.minRank,
      console: this.console,
      color: this.color,
    });
    // 让 hasError 反映整个进程，而不是某个子 logger
    Object.defineProperty(sub, "_hasError", {
      get: () => self._hasError,
      set: (v) => {
        if (v) self._hasError = true;
      },
    });
    return sub;
  }

  /** 供启动器判断是否需要弹错误提示 */
  hasError() {
    return this._hasError;
  }

  /** 当前日志文件绝对路径；日志被禁用时为 null */
  currentLogPath() {
    return this.sink && this.sink.filePath ? this.sink.filePath : null;
  }
}

/**
 * 创建 logger。
 *
 * @param {object} [opts]
 * @param {string|null} [opts.logDir]  日志目录；传 null 表示不写文件（仅控制台）
 * @param {number} [opts.keep]         保留份数，默认 10
 * @param {boolean} [opts.dev]         开发模式：输出 DEBUG、控制台更啰嗦
 * @param {boolean} [opts.silent]      完全静默（CI / 单测用）
 * @param {string} [opts.scope]
 * @returns {Logger}
 */
function createLogger(opts = {}) {
  const keep = Number.isFinite(opts.keep) ? opts.keep : DEFAULT_KEEP;

  // dev 模式：日志更详细
  const minRank = opts.dev ? LEVELS.DEBUG.rank : LEVELS.INFO.rank;

  let sink = null;
  if (opts.logDir !== null && opts.logDir !== false) {
    sink = new FileSink({ dir: opts.logDir, keep });
    sink.open();
  }

  return new Logger({
    sink,
    scope: opts.scope || "",
    minRank,
    console: !opts.silent,
    color: !!opts.color,
  });
}

module.exports = { createLogger, Logger, FileSink, LEVELS, stamp, lineTime, DEFAULT_KEEP };
