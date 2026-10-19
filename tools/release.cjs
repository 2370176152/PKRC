/*
 * PKRC · B-7 发布脚本（tools/release.cjs）
 * ---------------------------------------------------------------------------
 * 设计依据：`docs/delegation/18-B4-发布脚本设计.md`（方案 B：暂存 + 原子切换 + 备份）
 * 派单依据：`docs/delegation/27-第四阶段任务分发.md` §五 B-7
 *
 * 核心事实（B-4 已实测确认）：
 *   ① Electron 外壳是 Nativefier 打包的「指向 http://localhost:8000/ 的浏览器」
 *      ⇒ 它**不加载本地文件**，只发 HTTP
 *   ② 便携 Node（启动.vbs / start-game.bat / --serve-only）与 Electron
 *      **共用** `game/server/server.cjs` + `game/server/dist/`
 *      ⇒ **「发布」= 替换 `game/server/dist/`**，两条路径自动同时生效
 *   ③ 新产物 = 「构建产物（assets/ index.html）」+「资产源（images/ audio/ …）」
 *      ⇒ 组装必须显式包含「资产并入」这一步（上游 build 不产资产）
 *
 * 与 B-4 设计的一处**实现选择**（不是语义偏离，已登记）：
 *   B-4 的 ④备份 用「拷贝」。本实现用 **rename**（`--backup-mode=move`，默认）：
 *     · 收益：省掉一次 750 MB / 38k 文件的拷贝（实测约 4 分钟），也不额外占盘
 *     · 代价：备份目录必须与 target **同卷**（脚本会显式校验；跨卷时退回 `copy`）
 *     · 安全性不变：B-4 的「⑤ 原子切换 = 两次 rename」照旧成立 ——
 *       第一次 rename 同时完成「备份」与「挪走旧的」，第二次 rename 放上新的
 *
 * 六条失败路径（B-4 §3.2 要求全覆盖，实测见 §七 报告）：
 *   F1 预检失败        → 中止，**不碰 target**
 *   F2 组装失败        → 中止，清掉暂存的 dist.new
 *   F3 校验失败        → 中止，**保留暂存供分析**，不碰 target
 *   F4 第一次 rename 失败 → target 未被移动（重命名是原子的）
 *   F5 第二次 rename 失败 → 把备份 rename 回 target（尽力恢复）
 *   F6 冒烟失败        → target→dist.broken-<ts>，备份→target（自动回滚）
 *
 * 硬约束：零新增依赖（D3）· Node 16 语法 · **不 spawn 子进程**（沙箱 EBUSY，
 *         故组装/校验/冒烟全部进程内复用 asset-pipeline.cjs 与 server.cjs）
 */

"use strict";

const fs = require("fs");
const path = require("path");
const http = require("http");
const crypto = require("crypto");
const Module = require("module");

const REPO_ROOT = path.resolve(__dirname, "..");
const DEFAULT_TARGET = path.join(REPO_ROOT, "game", "server", "dist");
const SERVER_CJS = path.join(REPO_ROOT, "game", "server", "server.cjs");

/** 备份目录名必须严格匹配这个模式才允许被 `--keep` 清理（防误删） */
const BACKUP_NAME_RE = /^dist\.\d{8}-\d{6}$/;

// ---------------------------------------------------------------------------
// 参数
// ---------------------------------------------------------------------------
const KNOWN_CMDS = ["publish", "rollback", "list", "help"];
const rawArgv = process.argv.slice(2);
let cmd = "publish";
/**
 * 当前生效的参数（子命令之后的那些）。
 *
 * 设为**可变**并导出 `setArgv`，是为了让 `tools/test-release.cjs` 能在**进程内**
 * 用不同参数反复调用 `cmdPublish` / `cmdRollback`（本沙箱禁止 spawn 子进程，
 * 只能同进程测试）。CLI 行为完全不变：仍然只解析一次 `process.argv`。
 */
let ARGV = rawArgv;
if (rawArgv[0] && !rawArgv[0].startsWith("-")) {
  if (KNOWN_CMDS.includes(rawArgv[0])) {
    cmd = rawArgv[0];
    ARGV = rawArgv.slice(1);
  } else {
    cmd = "unknown";
    ARGV = rawArgv.slice(1);
  }
} else if (rawArgv.includes("--help") || rawArgv.includes("-h")) {
  cmd = "help";
}

/** 测试专用：替换当前参数（只影响之后的调用） */
function setArgv(a) {
  ARGV = Array.isArray(a) ? a.slice() : [];
}

const flag = (name) => ARGV.includes(name);
/**
 * 读取带值选项，**同时支持 `--k=v` 与 `--k v`**。
 * 这是本项目已登记过的一类隐蔽 bug：文档写等号、代码只认空格（或反之）
 * 会让参数被静默忽略并 fallback 到默认值，表面上还"成功"了。
 */
const opt = (name) => {
  const eq = ARGV.find((a) => a.startsWith(name + "="));
  if (eq !== undefined) return eq.slice(name.length + 1);
  const i = ARGV.findIndex((a) => a === name);
  if (i >= 0 && ARGV[i + 1] !== undefined && !ARGV[i + 1].startsWith("--")) return ARGV[i + 1];
  return undefined;
};

/** 日志同时进控制台与内存（内存那份用于写发布报告） */
const LOG = [];
let QUIET = false;
let CAPTURE = null;
/** 测试专用：静默控制台。日志仍进 LOG，可用 getLog() 取回 */
function setQuiet(v) {
  QUIET = !!v;
}
function getLog() {
  return LOG.slice();
}
/** 测试专用：捕获输出文本（cmdList / printHelp 只走 out，不进 LOG） */
function startCapture() {
  CAPTURE = [];
  return CAPTURE;
}
function stopCapture() {
  const c = CAPTURE || [];
  CAPTURE = null;
  return c;
}
function out(s) {
  if (CAPTURE) CAPTURE.push(s);
  if (!QUIET) process.stdout.write(s + "\n");
}
function log(s) {
  LOG.push(s);
  out(s);
}

// ---------------------------------------------------------------------------
// 小工具
// ---------------------------------------------------------------------------
function stamp(d = new Date()) {
  const p = (n, w = 2) => String(n).padStart(w, "0");
  return (
    `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}` +
    `-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
  );
}

function human(bytes) {
  if (!Number.isFinite(bytes)) return "?";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1073741824).toFixed(2)} GB`;
}

/** 递归列文件（相对路径，正斜杠），排序稳定 */
function listFiles(root) {
  const acc = [];
  const stack = [root];
  while (stack.length) {
    const cur = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(cur, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      const full = path.join(cur, e.name);
      if (e.isDirectory()) stack.push(full);
      else if (e.isFile()) acc.push(path.relative(root, full).replace(/\\/g, "/"));
    }
  }
  return acc.sort();
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

/**
 * 生成备份校验清单。
 *
 * 为什么用 SHA256 而不是大小：大小相同但内容不同是典型的静默损坏
 * （B-3 发现的 18 个零字节文件已证明「只看大小」不够）。
 *
 * @param {string} root
 * @param {"full"|"critical"} mode
 *   full     —— 全量（759 MB 顺序读，实测约 20 s）
 *   critical —— 只哈希**体积小且不可再生**的部分：
 *               `RESOURCE_CLASSES` 里 `type:"file"` 的类，加上显式标了
 *               `sha256:true` 的目录类（`assets/` 构建产物、`pkrc/` 手工配置）。
 *               大资产（images / audio / battle-anims / fonts / locales）
 *               用「文件数 + 字节数」足以发现损伤，逐文件哈希不值当。
 *
 *   ⚠️ 范围由**资源类表**决定，不在本函数里硬编码目录名 —— 否则新增资源类时
 *      清单会静默漏掉它（一个漏检的清单比没有清单更危险）。
 */
function hashTree(root, mode) {
  const pipeline = require("./asset-pipeline.cjs");
  let rels;
  if (mode === "critical") {
    const set = new Set();
    for (const spec of pipeline.RESOURCE_CLASSES) {
      if (spec.type === "file") {
        if (fs.existsSync(path.join(root, spec.id))) set.add(spec.id);
      } else if (spec.sha256) {
        const dir = path.join(root, spec.id);
        if (!fs.existsSync(dir)) continue;
        for (const f of listFiles(dir)) set.add(`${spec.id}/${f}`);
      }
    }
    rels = [...set].sort();
  } else {
    rels = listFiles(root);
  }
  const t0 = Date.now();
  const entries = rels.map((rel) => {
    const full = path.join(root, rel);
    return { rel, size: fs.statSync(full).size, hash: sha256File(full) };
  });
  return { entries, ms: Date.now() - t0, mode };
}

/** 写 `SHA256SUMS`（兼容 `sha256sum -c`；`#` 开头的行被 coreutils 忽略） */
function writeSumsFile(dir, entries, meta) {
  const lines = [
    `# PKRC release backup`,
    `# created: ${new Date().toISOString()}`,
    `# files: ${entries.length}`,
    `# mode: ${meta.mode}`,
  ];
  for (const e of entries) lines.push(`${e.hash}  ${e.rel}`);
  const file = path.join(dir, "SHA256SUMS");
  fs.writeFileSync(file, lines.join("\n") + "\n", "utf8");
  return file;
}

/**
 * 磁盘余量探测。Node 16 **没有** `fs.statfs`（18.15+ 才有），
 * 所以不能直接读剩余空间 —— 改为「写入探测」：真写一个 probe 文件再删掉。
 * 这比臆测一个数字诚实：它直接回答「这个目录还能不能放下 N MB」。
 */
function spaceProbe(dir, megabytes) {
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (err) {
    return { ok: false, msg: `无法创建目录：${err.message}` };
  }
  const probe = path.join(dir, `.space-probe-${process.pid}`);
  const chunk = Buffer.alloc(1024 * 1024, 0x41); // 1 MB
  let fd = null;
  try {
    fd = fs.openSync(probe, "w");
    for (let i = 0; i < megabytes; i++) fs.writeSync(fd, chunk);
    fs.closeSync(fd);
    fd = null;
    fs.unlinkSync(probe);
    return { ok: true, msg: `写入探测通过（${megabytes} MB）` };
  } catch (err) {
    try {
      if (fd !== null) fs.closeSync(fd);
    } catch {
      /* ignore */
    }
    try {
      fs.unlinkSync(probe);
    } catch {
      /* ignore */
    }
    return { ok: false, msg: `写入探测失败：${err.message}` };
  }
}

/** 两个路径是否在同一个卷（rename 跨卷会失败） */
function sameVolume(a, b) {
  return path.parse(path.resolve(a)).root.toLowerCase() === path.parse(path.resolve(b)).root.toLowerCase();
}

/** 目录是否像一个 dist（有 index.html） */
function looksLikeDist(dir) {
  return fs.existsSync(path.join(dir, "index.html"));
}

// ---------------------------------------------------------------------------
// 冒烟测试（进程内起服务，不 spawn）
// ---------------------------------------------------------------------------
/**
 * 让 express 可被 `require("express")` 解析到。
 *
 * 背景：项目的运行期依赖装在 `shared/runtime/node_modules`（便携 Node 专用），
 * 仓库根**没有** node_modules。`NODE_PATH` 只在进程启动时被读取，所以要在运行中
 * 追加路径，必须调用 `Module._initPaths()` 让它重算 module.paths。
 *
 * ⚠️ `Module._initPaths` 是 Node 的内部 API。这里做了三重保护：
 *   ① 只在环境里确实没有该路径时才调用；
 *   ② 用 try/catch 包住，失败就退回内置迷你静态服务器（见 startMiniServer）；
 *   ③ 冒烟结果里显式记录「用哪个服务器跑的」，不隐瞒降级。
 */
function ensureModulePaths() {
  const nm = path.join(REPO_ROOT, "shared", "runtime", "node_modules");
  if (!fs.existsSync(nm)) return false;
  const parts = (process.env.NODE_PATH || "").split(path.delimiter).filter(Boolean);
  if (parts.includes(nm)) return true;
  process.env.NODE_PATH = [nm, ...parts].join(path.delimiter);
  try {
    Module._initPaths();
    return true;
  } catch {
    return false;
  }
}

/** 加载产品服务模块（加载失败返回 null，由调用方决定降级策略） */
function loadProductServer() {
  ensureModulePaths();
  try {
    const mod = require(SERVER_CJS);
    if (mod && typeof mod.startServer === "function") return { mod, error: null };
    return { mod: null, error: "server.cjs 未导出 startServer" };
  } catch (err) {
    return { mod: null, error: err.message };
  }
}

/**
 * 内置迷你静态服务器（**兜底**，仅当产品服务不可加载时使用）。
 *
 * 它只做一件事：把 dist 的文件按原样吐出来，用于验证「引用齐全」。
 * 它**不复制** server.cjs 的行为（例如未命中返回 `200 + {ok:false}` 的历史语义）——
 * 因此冒烟结果里会标注 `servedBy: "mini"`，让读者知道这次没走产品路径。
 */
function startMiniServer(root) {
  const MIME = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".webmanifest": "application/manifest+json; charset=utf-8",
    ".png": "image/png",
    ".ttf": "font/ttf",
    ".mp3": "audio/mpeg",
  };
  const server = http.createServer((req, res) => {
    const rel = decodeURIComponent((req.url || "/").split("?")[0]).replace(/^\/+/, "");
    const candidate = rel === "" ? "index.html" : rel;
    const full = path.resolve(root, candidate);
    if (!full.startsWith(path.resolve(root))) {
      res.writeHead(400).end("bad path");
      return;
    }
    if (!fs.existsSync(full) || !fs.statSync(full).isFile()) {
      res.writeHead(404).end("not found");
      return;
    }
    res.writeHead(200, { "content-type": MIME[path.extname(full).toLowerCase()] || "application/octet-stream" });
    fs.createReadStream(full).pipe(res);
  });
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const port = server.address().port;
      resolve({
        url: `http://127.0.0.1:${port}/`,
        close: () => new Promise((r) => server.close(() => r())),
        servedBy: "mini",
      });
    });
  });
}

/** 发一个 GET，返回 {status, body, headers} */
function get(url, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (c) => (body += c));
      res.on("end", () => resolve({ status: res.statusCode, body, headers: res.headers }));
    });
    req.on("error", reject);
    req.setTimeout(timeoutMs, () => req.destroy(new Error("request timeout")));
  });
}

/**
 * 识别产品服务（server.cjs）的「未命中兜底响应」。
 *
 * ⚠️ 上游/PKRC 有意保留的行为：未命中路径返回 `200 + {"ok":false,"message":"File not found"}`，
 *    **不是 404**（前端可能依赖该判定，`game/server/server.cjs` 中有显著注释）。
 *    因此冒烟测试**只能适配它，不能改它** —— 否则会把 200 当成「引用可达」，
 *    让缺失的 JS/CSS 被静默放过，⑧ 的自动回滚就永远触发不了。
 */
function isFallbackNotFound(r) {
  const headers = (r && r.headers) || {};
  if (!/json/i.test(String(headers["content-type"] || ""))) return false;
  try {
    const j = JSON.parse(String((r && r.body) || ""));
    return !!j && j.ok === false;
  } catch {
    return false;
  }
}

/**
 * 冒烟：起服务 → GET / → 校验 index.html 引用的资源可达。
 *
 * 为什么用**独立端口（0=内核自选）**：用户可能正在游戏（8000 被占用）。
 * 为什么校验引用而非只探活：只 `GET /` 返回 200 不能说明 JS 能加载。
 *
 * @returns {Promise<{ok:boolean, servedBy:string, base:string, checks:Array<object>, error:string|null}>}
 */
async function smokeTest(target, timeoutMs) {
  const loaded = loadProductServer();
  let handle = null;
  let servedBy = "";
  let note = "";
  if (loaded.mod) {
    const loggerMod = require(path.join(REPO_ROOT, "game", "server", "logger.cjs"));
    handle = await loaded.mod.startServer({
      port: 0,
      staticDir: target,
      logger: loggerMod.createLogger({ logDir: null, silent: true }),
    });
    servedBy = "server.cjs";
  } else {
    handle = await startMiniServer(target);
    servedBy = "mini";
    note = `产品服务不可加载（${loaded.error}）→ 已退回内置迷你服务器，本次冒烟**未**走产品路径`;
  }

  const checks = [];
  try {
    const root = await get(handle.url, timeoutMs);
    const isHtml = /text\/html/.test(String(root.headers["content-type"] || ""));
    checks.push({ what: "GET /", url: handle.url, status: root.status, ok: root.status === 200 && isHtml });
    if (root.status === 200 && isHtml) {
      const refs = new Set();
      for (const m of root.body.matchAll(/(?:src|href)="(\.\/[^"]+)"/g)) refs.add(m[1].replace(/^\.\//, ""));
      for (const m of root.body.matchAll(/url\('(\.\/[^']+)'\)/g)) refs.add(m[1].replace(/^\.\//, ""));
      for (const ref of refs) {
        const r = await get(handle.url + ref, timeoutMs);
        const fallback = isFallbackNotFound(r);
        checks.push({
          what: `GET /${ref}`,
          url: handle.url + ref,
          status: r.status,
          ok: (r.status === 200 || r.status === 304) && !fallback,
          ...(fallback ? { note: "命中「未落盘兜底」响应 200+ok:false（等价于缺失）" } : {}),
        });
      }
    }
  } catch (err) {
    checks.push({ what: "smoke", url: handle.url, status: 0, ok: false, error: err.message });
  } finally {
    await handle.close();
  }

  return { ok: checks.length > 0 && checks.every((c) => c.ok), servedBy, base: handle.url, checks, error: loaded.error, note };
}

// ---------------------------------------------------------------------------
// publish
// ---------------------------------------------------------------------------
async function cmdPublish() {
  const target = path.resolve(opt("--target") || DEFAULT_TARGET);
  const stagingRoot = path.resolve(opt("--staging") || path.join(path.dirname(target), ".release-staging"));
  const stagingNew = path.join(stagingRoot, "dist.new");
  const backupRoot = path.resolve(opt("--backup-dir") || path.join(path.dirname(target), "backups"));
  const buildDir = opt("--build-dir") ? path.resolve(opt("--build-dir")) : null;
  const assetDir = opt("--asset-dir") ? path.resolve(opt("--asset-dir")) : null;
  const keep = opt("--keep") !== undefined ? Number(opt("--keep")) : 3;
  const commit = flag("--commit");
  const doVerify = !flag("--no-verify");
  const doSmoke = !flag("--skip-smoke");
  const backupMode = (opt("--backup-mode") || "move").toLowerCase();
  // 默认 critical：实测（2026-10-16，game/server/dist 38,062 文件 / 756.9 MB）
  //   critical =   18 条 / 0.4 s      full = 38,062 条 / 167.9 s
  // 大资产已被 verifyDist 用「文件数 + 字节数」判过损伤，为了它们多等 2 分 48 秒
  // 在每次发布上都不划算；要「全量审计」显式 --hash=full。
  const hashMode = (opt("--hash") || "critical").toLowerCase();
  const localesFrom = opt("--locales-from") || null;
  const localeConflict = opt("--locale-conflict") || "overlay";
  const reportPath = opt("--report") || null;

  const t0 = Date.now();
  log("PKRC 发布（B-7 · B-4 方案 B：暂存 + 原子切换 + 备份）");
  log("=".repeat(68));
  log(`执行模式：${commit ? "**--commit（会真的改文件）**" : "dry-run（默认，只打印计划）"}`);
  log(`发布目标：${target}`);
  log(`构建产物：${buildDir || "(未提供)"}`);
  log(`资产源　：${assetDir || "(未提供)"}`);
  log(`暂存目录：${stagingNew}`);
  log(`备份根　：${backupRoot}`);
  log(`备份方式：${backupMode}（move=rename，省一次全量拷贝；copy=跨卷时用）`);
  log(`校验清单：${hashMode}（critical≈0.4s 覆盖不可再生的小件；full≈168s 覆盖 756MB）`);
  log("");

  // ---- ① 预检 ------------------------------------------------------------
  const fails = [];
  const warns = [];
  log("[1/9] 预检");

  if (!buildDir) fails.push("必须给 --build-dir=<构建产物目录>");
  else {
    if (!fs.existsSync(path.join(buildDir, "index.html"))) fails.push(`--build-dir 缺少 index.html：${buildDir}`);
    if (!fs.existsSync(path.join(buildDir, "assets"))) fails.push(`--build-dir 缺少 assets/：${buildDir}`);
  }
  if (!assetDir) fails.push("必须给 --asset-dir=<资产源目录>");
  else if (!fs.existsSync(assetDir)) fails.push(`--asset-dir 不存在：${assetDir}`);
  if (!fs.existsSync(target)) fails.push(`目标不存在：${target}`);
  else if (!looksLikeDist(target)) fails.push(`目标不像 dist（无 index.html）：${target}`);

  // 安全护栏：绝不能把源当目标（那会一边读一边删）
  for (const [name, src] of [
    ["--build-dir", buildDir],
    ["--asset-dir", assetDir],
  ]) {
    if (!src) continue;
    const a = path.resolve(src);
    if (a === target) fails.push(`${name} 与 --target 相同（会边读边删）：${a}`);
    else if (target.startsWith(a + path.sep)) fails.push(`--target 位于 ${name} 之内（会边读边删）：${target}`);
    else if (a.startsWith(target + path.sep)) fails.push(`${name} 位于 --target 之内（会边读边删）：${a}`);
  }
  // 暂存 / 备份根绝不能位于 target 之内：
  //   步骤 ④ 会把 target **整个 rename 走**，位于其内的暂存产物会被一并搬走，
  //   备份目录更会变成「自己搬进自己里面」——必然失败且现场混乱。
  for (const [name, p] of [
    ["--staging", stagingRoot],
    ["--backup-dir", backupRoot],
  ]) {
    if (p === target || p.startsWith(target + path.sep)) {
      fails.push(`${name} 位于 --target 之内（会被步骤 ④ 的 rename 一并搬走）：${p}`);
    }
  }
  // 同卷要求（rename 原子性的前提）
  if (!sameVolume(stagingNew, target)) warns.push(`暂存目录与目标不同卷 —— rename 会退化/失败：${stagingNew}`);
  if (backupMode === "move" && !sameVolume(backupRoot, target)) {
    fails.push(`--backup-mode=move 要求备份根与目标同卷（否则退回 --backup-mode=copy）：${backupRoot}`);
  }
  if (!["move", "copy"].includes(backupMode)) fails.push(`--backup-mode 只能是 move / copy（收到 ${backupMode}）`);
  if (!["full", "critical"].includes(hashMode)) fails.push(`--hash 只能是 full / critical（收到 ${hashMode}）`);
  if (!Number.isInteger(keep) || keep < 0) fails.push(`--keep 必须是非负整数（收到 ${opt("--keep")}）`);

  // 磁盘写入探测（暂存 + 备份峰值约 2× dist）
  let probe = { ok: true, msg: "未执行" };
  if (fails.length === 0) {
    probe = spaceProbe(stagingRoot, 256);
    if (!probe.ok) warns.push(`暂存目录写入探测异常（${probe.msg}）—— 余量可能不足`);
  }

  if (fails.length) {
    for (const f of fails) log(`  ❌ ${f}`);
    log("");
    log("⇒ F1 预检失败：中止，**未触碰目标**。");
    return { code: 2, report: { step: "preflight", errors: fails }, reportPath };
  }
  for (const w of warns) log(`  ⚠️ ${w}`);
  log(`  ✅ 预检通过（磁盘 ${probe.msg}）`);
  log("");

  // ---- ② 组装到暂存 ------------------------------------------------------
  log("[2/9] 组装 → 暂存目录");
  const pipeline = require("./asset-pipeline.cjs");
  const pre = pipeline.planMerge({
    to: stagingNew,
    mode: "replace",
    buildDir,
    assetSrc: assetDir,
    localesFrom,
    localeConflict,
    forceReplace: true,
    only: null,
  });
  if (pre.errors.length) {
    for (const e of pre.errors) log(`  ❌ ${e}`);
    log("");
    log("⇒ F2 组装前的策略校验失败：中止，**未触碰目标**。");
    return { code: 2, report: { step: "assemble-plan", errors: pre.errors }, reportPath };
  }
  for (const w of pre.warnings) log(`  ⚠️ ${w.replace(/\n/g, "\n  ")}`);
  // 清理上一次可能的残留（stagingNew 由 replace 模式整体重建，但顶层先清干净）
  try {
    fs.rmSync(stagingNew, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
  // ⚠️ 这里**关掉** runMergePlan 的合并后自检（selfCheck:false）：
  //   「产物是否合格」这件事只由步骤 ③ 的 verifyDist 判一次。
  //   两处各判一次会造成误导性双报（② 报「组装失败」，③ 根本没机会跑），
  //   而 ② 的失败其实只是「类不全」——那是 ③ 的职责。
  //   关掉之后，② 的失败只剩一种含义：**某个拷贝真的抛错了**。
  const asm = pipeline.runMergePlan(pre, {
    commit: true,
    log: (m) => log(m),
    selfCheck: false,
    // B-16：剔除打包残留（.zip/.psd/…）。E-5 会从同一个发行包重新并资产，
    // 不在合并期过滤的话「删一次」等于没删。
    pruneResidue: true,
  });
  if (asm.failed) {
    log("");
    log("⇒ F2 组装失败（某个拷贝抛错）：已清掉本次暂存产物，**未触碰目标**。");
    try {
      fs.rmSync(stagingNew, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
    return { code: 1, report: { step: "assemble", done: asm.done }, reportPath };
  }
  let staged = pipeline.measure(stagingNew);
  log(`  ✅ 暂存产物：${staged.files} 文件 / ${human(staged.bytes)}`);
  log("");

  // ---- ③ 校验暂存产物 ----------------------------------------------------
  log("[3/9] 校验暂存产物（[1/6] 类表 + 引用可达 + 零字节）");
  if (doVerify) {
    const v = pipeline.verifyDist(stagingNew, { atlas: false }); // atlas 扫描约 1 分钟且从不参与失败判定
    for (const c of v.classes) {
      if (!c.ok) log(`  ❌ ${c.id}：${c.failReason}`);
    }
    log(`  ${v.classes.length - v.classesBad.length}/${v.classes.length} 类就位；引用 ${v.refs.ok.length} 条全部可达；零字节 ${v.zeroReal.length}`);
    if (!v.ok) {
      for (const f of v.failures) log(`  ❌ ${f}`);
      log("");
      log("⇒ F3 校验失败：中止，**保留暂存产物供分析**，未触碰目标。");
      log(`   暂存产物在：${stagingNew}`);
      return { code: 1, report: { step: "verify", failures: v.failures }, reportPath };
    }
    log("  ✅ 校验通过");
  } else {
    log("  ⚠️ 已用 --no-verify 跳过（**不推荐**：会把未校验的产物推上线）");
  }
  log("");

  // dry-run 到此为止
  if (!commit) {
    log("[4/9]~[9/9] 备份 / 原子切换 / 冒烟 / 回滚 / 收尾 —— dry-run 不执行");
    log("");
    log(`ℹ️ 注意：步骤 ②③ 是**真实执行**的（暂存产物已落盘：${stagingNew}，${staged.files} 文件）。`);
    log("   dry-run 只跳过 ④~⑨ —— 目的是「先真组真校，再决定要不要动线上」，");
    log("   所以它会写**暂存目录**，但**绝不触碰 target**。");
    log("");
    log("计划（--commit 时执行）：");
    log(`  ④ 备份：${target}  →(rename)  ${path.join(backupRoot, `dist.${stamp()}`)} + SHA256SUMS(${hashMode})`);
    log(`  ⑤ 原子切换：${stagingNew}  →(rename)  ${target}`);
    log("  ⑥ 清理：move 方式无 target.old 需要清理");
    log(`  ⑦ 冒烟：进程内起服务（端口 0）→ GET / → 校验 ${"index.html"} 引用`);
    log(`  ⑧ 失败则自动回滚：${target} → dist.broken-<ts>，备份 → ${target}`);
    log(`  ⑨ 收尾：按 --keep=${keep} 清理旧备份`);
    log("");
    log("（dry-run，未落盘。加 --commit 执行）");
    return { code: 0, report: { step: "dry-run", hashMode, backupMode, staged }, reportPath };
  }

  // ---- ④ 备份（= 第一次 rename）-----------------------------------------
  log("[4/9] 备份旧产物");
  try {
    fs.mkdirSync(backupRoot, { recursive: true });
  } catch (err) {
    log(`  ❌ 无法创建备份根：${err.message}`);
    log("     ⇒ 未触碰目标。");
    return { code: 1, report: { step: "backup", error: err.message }, reportPath };
  }
  const backupDir = path.join(backupRoot, `dist.${stamp()}`);
  if (fs.existsSync(backupDir)) {
    log(`  ❌ 备份目录已存在（同一秒内重复发布？）：${backupDir}`);
    return { code: 1, report: { step: "backup", error: "backup dir exists" }, reportPath };
  }

  let backupMade = false;
  if (backupMode === "move") {
    try {
      fs.renameSync(target, backupDir); // 第一次 rename：同时完成「备份」与「挪走旧的」
      backupMade = true;
      log(`  ✅ 已 rename 为备份：${backupDir}`);
    } catch (err) {
      log(`  ❌ F4 备份失败：${err.message}`);
      log("     ⇒ rename 是原子操作，目标**未被移动**，现场完好。");
      return { code: 1, report: { step: "backup", error: err.message }, reportPath };
    }
  } else {
    try {
      copyTree(target, backupDir);
      backupMade = true;
      log(`  ✅ 已拷贝为备份：${backupDir}`);
    } catch (err) {
      log(`  ❌ F4 备份失败（空间不足？）：${err.message}`);
      try {
        fs.rmSync(backupDir, { recursive: true, force: true });
      } catch {
        /* ignore */
      }
      log("     ⇒ 目标**未被触碰**，现场完好。");
      return { code: 1, report: { step: "backup", error: err.message }, reportPath };
    }
  }

  // 备份校验和（失败只告警：清单是"锦上添花"，不该阻断发布）
  let sums = null;
  try {
    const h = hashTree(backupDir, hashMode);
    sums = writeSumsFile(backupDir, h.entries, { mode: h.mode });
    log(`  ✅ SHA256SUMS 已生成：${h.entries.length} 条（${h.mode}，耗时 ${(h.ms / 1000).toFixed(1)} s）`);
  } catch (err) {
    log(`  ⚠️ SHA256SUMS 生成失败（不阻断）：${err.message}`);
  }
  log("");

  // ---- ⑤ 原子切换（第二次 rename）--------------------------------------
  log("[5/9] 原子切换");
  try {
    fs.renameSync(stagingNew, target);
    log(`  ✅ ${stagingNew} → ${target}`);
  } catch (err) {
    log(`  ❌ F5 切换失败：${err.message}`);
    log("     ⇒ 正在尽力恢复（把备份 rename 回目标）…");
    try {
      if (backupMode === "move") fs.renameSync(backupDir, target);
      else {
        fs.rmSync(target, { recursive: true, force: true });
        fs.renameSync(backupDir, target);
      }
      removeRestoredManifest(target, log);
      log("     ✅ 已恢复。目标仍是旧产物。");
    } catch (err2) {
      log("     ❌❌ 恢复也失败！**需要人工介入**：");
      log(`        旧产物仍在：${backupDir}`);
      log(`        手动恢复：把上面这个目录 rename 成 ${target}`);
      return { code: 1, report: { step: "switch", error: err.message, restoreError: err2.message, backupDir }, reportPath };
    }
    return { code: 1, report: { step: "switch", error: err.message, restored: true }, reportPath };
  }
  log("");

  // ---- ⑥ 清理 -----------------------------------------------------------
  log("[6/9] 清理中间态");
  log("  ℹ️ move 方式下没有 target.old 需要清理（B-4 的 ⑥ 在此实现下自然消失）");
  log("");

  // ---- ⑦ 冒烟 -----------------------------------------------------------
  log("[7/9] 切换后冒烟测试");
  let smoke = { ok: true, checks: [], servedBy: "-", note: "" };
  if (doSmoke) {
    try {
      smoke = await smokeTest(target, 15000);
      for (const c of smoke.checks)
        log(`  ${c.ok ? "✅" : "❌"} ${c.what} → ${c.status}${c.note ? ` — ${c.note}` : ""}${c.error ? ` (${c.error})` : ""}`);
      log(`  服务来源：${smoke.servedBy}${smoke.note ? ` — ${smoke.note}` : ""}`);
    } catch (err) {
      smoke = { ok: false, checks: [], servedBy: "-", note: "", error: err.message };
      log(`  ❌ 冒烟过程异常：${err.message}`);
    }
  } else {
    log("  ⚠️ 已用 --skip-smoke 跳过（**不推荐**：把未验证产物推上线）");
  }
  log("");

  if (!smoke.ok) {
    // ---- ⑧ 自动回滚 ----
    log("[8/9] ❗ 冒烟失败 → 自动回滚");
    const brokenDir = path.join(stagingRoot, `dist.broken-${stamp()}`);
    try {
      fs.renameSync(target, brokenDir);
      if (backupMode === "move") fs.renameSync(backupDir, target);
      else copyTree(backupDir, target);
      // 两种模式下 SHA256SUMS 都会跟着回到 target ⇒ 清掉，保证"回滚 = 精确恢复"
      removeRestoredManifest(target, log);
      log(`  ✅ 已回滚：问题产物保留在 ${brokenDir}；目标已恢复为旧产物。`);
      log("  现场未丢，可据此分析。");
      return {
        code: 1,
        report: { step: "smoke", smoke, rolledBack: true, brokenDir, backupDir, sums },
        reportPath,
      };
    } catch (err) {
      log(`  ❌❌ F6 回滚失败：${err.message}`);
      log("     **需要人工介入**：");
      log(`       旧产物备份：${backupDir}`);
      log(`       当前目标　：${target}（可能是坏产物）`);
      log(`       手动恢复：把备份 rename 成 ${target}`);
      return { code: 1, report: { step: "smoke-rollback", error: err.message, backupDir, brokenDir }, reportPath };
    }
  }
  log("  ✅ 冒烟通过");
  log("");

  // ---- ⑨ 收尾 -----------------------------------------------------------
  log("[9/9] 收尾：清理旧备份");
  const pruned = pruneBackups(backupRoot, keep, (m) => log(`  ${m}`));
  log("");

  const durationMs = Date.now() - t0;
  log("=".repeat(68));
  log("✅ 发布完成");
  log(`  目标：${target}（${staged.files} 文件 / ${human(staged.bytes)}）`);
  log(`  备份：${backupDir}`);
  log(`  耗时：${(durationMs / 1000).toFixed(1)} s`);
  log("");
  log("Electron 外壳的人工确认清单（脚本无法驱动 GUI）：");
  log("  1. 双击 game\\启动.vbs，确认静默启动（无错误弹窗）");
  log("  2. Electron 窗口打开后，游戏能过加载场景");
  log("  3. 确认 nativefier.json 的 targetUrl 仍是 http://localhost:8000/");

  return {
    code: 0,
    report: {
      step: "done",
      target,
      backupDir,
      sums,
      staged,
      smoke,
      pruned,
      durationMs,
      hashMode,
      backupMode,
      verify: doVerify,
    },
    reportPath,
  };
}

/** 递归拷贝（copy 模式的备份 / 恢复用） */
function copyTree(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  fs.cpSync(src, dst, { recursive: true });
}

/**
 * 回滚把「备份」换回「目标」之后，备份目录里那份 `SHA256SUMS` 会**跟着回到线上**。
 *
 * 它不是构建产物的一部分 ⇒ 必须删掉，否则「回滚」就不是**精确恢复**而是
 * 「恢复 + 多一个文件」（B-14 演练实测：38,041 → 38,042）。
 *
 * 只删**我们自己写的那份** —— 靠首行标记识别（`# PKRC release backup`），
 * 绝不误删产物自带的同名文件。
 *
 * @returns {boolean} 是否删除了
 */
function removeRestoredManifest(dir, logFn) {
  const f = path.join(dir, "SHA256SUMS");
  try {
    if (!fs.existsSync(f)) return false;
    const head = fs.readFileSync(f, "utf8").split("\n")[0] || "";
    if (head.indexOf("# PKRC release backup") !== 0) return false;
    fs.rmSync(f, { force: true });
    if (logFn) logFn("  🧹 已移除随备份回迁的 SHA256SUMS（它不是产物的一部分，保留就不是精确恢复了）");
    return true;
  } catch {
    return false;
  }
}

/**
 * 按 --keep 清理旧备份。
 *
 * ⚠️ **只删严格匹配 `dist.<yyyyMMdd-HHmmss>` 的目录**。
 * 绝不使用通配符/前缀匹配 —— `game/server/` 下还有
 * `dist.modder-backup-20261016`（回滚依据！）这类不能碰的目录。
 */
function pruneBackups(backupRoot, keep, logFn) {
  if (!Number.isInteger(keep) || keep <= 0) {
    logFn(`  ℹ️ --keep=${keep}：不自动清理（0 = 保留全部）`);
    return [];
  }
  let names;
  try {
    names = fs
      .readdirSync(backupRoot, { withFileTypes: true })
      .filter((e) => e.isDirectory() && BACKUP_NAME_RE.test(e.name))
      .map((e) => e.name)
      .sort();
  } catch {
    logFn("  ℹ️ 备份目录不可读，跳过清理");
    return [];
  }
  const excess = names.length - keep;
  const removed = [];
  for (let i = 0; i < excess; i++) {
    try {
      fs.rmSync(path.join(backupRoot, names[i]), { recursive: true, force: true });
      removed.push(names[i]);
      logFn(`  🗑️ 已删除旧备份 ${names[i]}`);
    } catch (err) {
      logFn(`  ⚠️ 删除 ${names[i]} 失败：${err.message}`);
    }
  }
  logFn(`  ℹ️ 备份 ${names.length} 份，保留最近 ${keep} 份，删除 ${removed.length} 份`);
  return removed;
}

// ---------------------------------------------------------------------------
// rollback
// ---------------------------------------------------------------------------
async function cmdRollback() {
  const target = path.resolve(opt("--target") || DEFAULT_TARGET);
  const stagingRoot = path.resolve(opt("--staging") || path.join(path.dirname(target), ".release-staging"));
  const backupRoot = path.resolve(opt("--backup-dir") || path.join(path.dirname(target), "backups"));
  const commit = flag("--commit");

  let backupDir = opt("--to") ? path.resolve(opt("--to")) : null;
  if (!backupDir && flag("--last")) {
    const names = fs
      .readdirSync(backupRoot, { withFileTypes: true })
      .filter((e) => e.isDirectory() && BACKUP_NAME_RE.test(e.name))
      .map((e) => e.name)
      .sort();
    if (!names.length) {
      out(`❌ ${backupRoot} 下没有匹配的备份`);
      return { code: 1 };
    }
    backupDir = path.join(backupRoot, names[names.length - 1]);
  }
  if (!backupDir) {
    out("用法：node tools/release.cjs rollback (--to=<备份目录> | --last) [--commit]");
    out("");
    out("  --to=<dir>   指定备份目录（game/server/backups/dist.<时间戳>）");
    out("  --last       取最近一份备份");
    out("  --target     发布目标（默认 game/server/dist）");
    out("  --commit     实际执行（默认 dry-run）");
    out("");
    out("语义：把当前 target **改名**为 dist.rollback-<ts>（保留现场），再把备份换回 target。");
    out("     ⚠️ 回滚只回退**文件产物**，不回退存档（.prsv 冻结，发布流程绝不触碰存档）。");
    return { code: 2 };
  }

  out("PKRC 手动回滚");
  out("=".repeat(68));
  out(`备份目录：${backupDir}`);
  out(`目标　　：${target}`);
  out("");

  if (!fs.existsSync(backupDir)) {
    out(`❌ 备份不存在：${backupDir}`);
    return { code: 1 };
  }
  if (!looksLikeDist(backupDir)) {
    out(`❌ 备份不像 dist（无 index.html）：${backupDir} —— 拒绝用它覆盖目标`);
    return { code: 1 };
  }
  if (!fs.existsSync(target)) {
    out(`❌ 目标不存在：${target}`);
    return { code: 1 };
  }
  if (!sameVolume(backupDir, target)) {
    out("❌ 备份与目标不同卷 —— rename 无法原子完成，请手动处理");
    return { code: 1 };
  }

  const rollbackDir = path.join(stagingRoot, `dist.rollback-${stamp()}`);
  out(`计划：${target} →(rename) ${rollbackDir}`);
  out(`      ${backupDir} →(rename) ${target}`);
  out("");
  if (!commit) {
    out("（dry-run，未落盘。加 --commit 执行）");
    return { code: 0 };
  }

  try {
    fs.mkdirSync(stagingRoot, { recursive: true });
  } catch (err) {
    out(`❌ 无法创建暂存根：${err.message}`);
    return { code: 1 };
  }
  try {
    fs.renameSync(target, rollbackDir);
  } catch (err) {
    out(`❌ 无法挪走当前目标：${err.message}`);
    return { code: 1 };
  }
  try {
    fs.renameSync(backupDir, target);
  } catch (err) {
    out(`❌ 换回备份失败：${err.message} —— 正在尽力恢复…`);
    try {
      fs.renameSync(rollbackDir, target);
      out("✅ 已恢复原状（目标未改变）");
    } catch (err2) {
      out(`❌❌ **需要人工介入**：原目标在 ${rollbackDir}，备份在 ${backupDir}`);
      return { code: 1, report: { error: err.message, restoreError: err2.message } };
    }
    return { code: 1 };
  }
  // 备份里那份 SHA256SUMS 会跟着回到线上 ⇒ 清掉（回滚必须是精确恢复）
  removeRestoredManifest(target, (m) => out(m));
  out("✅ 回滚完成");
  out(`  当前目标 = 备份内容：${target}`);
  out(`  回滚前的产物保留在：${rollbackDir}`);  return { code: 0, report: { backupDir, rollbackDir } };
}

// ---------------------------------------------------------------------------
// list
// ---------------------------------------------------------------------------
async function cmdList() {
  const target = path.resolve(opt("--target") || DEFAULT_TARGET);
  const backupRoot = path.resolve(opt("--backup-dir") || path.join(path.dirname(target), "backups"));
  const wantSizes = flag("--sizes");

  out("PKRC 备份清单");
  out("=".repeat(68));
  out(`目标：${target}`);
  out(`备份根：${backupRoot}`);
  out("");
  if (!fs.existsSync(backupRoot)) {
    out("（备份根本不存在 —— 尚未发布过）");
    return { code: 0 };
  }
  const dirs = fs
    .readdirSync(backupRoot, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
  if (!dirs.length) {
    out("（无备份）");
    return { code: 0 };
  }
  const pipeline = require("./asset-pipeline.cjs");
  for (const name of dirs) {
    const full = path.join(backupRoot, name);
    const managed = BACKUP_NAME_RE.test(name);
    const sums = path.join(full, "SHA256SUMS");
    let info = "无 SHA256SUMS";
    if (fs.existsSync(sums)) {
      const lines = fs.readFileSync(sums, "utf8").split("\n").filter((l) => l && !l.startsWith("#"));
      info = `SHA256SUMS ${lines.length} 条`;
    }
    let size = "";
    if (wantSizes) {
      const m = pipeline.measure(full);
      size = `  ${m.files} 文件 ${human(m.bytes)}`;
    }
    out(`  ${managed ? "·" : "⚠"} ${name.padEnd(24)} ${info}${size}${managed ? "" : "   ← 不受 --keep 管理（不会自动清理）"}`);
  }
  out("");
  out(`共 ${dirs.length} 份（其中 ${dirs.filter((d) => BACKUP_NAME_RE.test(d)).length} 份受 --keep 管理）`);
  return { code: 0 };
}

// ---------------------------------------------------------------------------
// help
// ---------------------------------------------------------------------------
function printHelp() {
  out(
    [
      "PKRC 发布脚本（tools/release.cjs）· B-7 · 方案 B：暂存 + 原子切换 + 备份",
      "",
      "用法：",
      "  node tools/release.cjs publish --build-dir=<构建产物> --asset-dir=<资产源> [--commit]",
      "  node tools/release.cjs rollback (--to=<备份> | --last) [--commit]",
      "  node tools/release.cjs list [--sizes]",
      "",
      "publish 选项：",
      "  --build-dir=<dir>   构建产物（必填；含 assets/ index.html locales/）",
      "  --asset-dir=<dir>   资产源（必填；含 images/ audio/ fonts/ battle-anims/ …）",
      "  --target=<dir>      发布目标（默认 game/server/dist）",
      "  --staging=<dir>     暂存根（默认 <target 同级>/.release-staging）",
      "  --backup-dir=<dir>  备份根（默认 <target 同级>/backups）",
      "  --backup-mode=move|copy  备份方式（默认 move=rename，需同卷；跨卷用 copy）",
      "  --keep=<n>          保留最近 n 份备份（默认 3；0=不清理）",
      "  --hash=full|critical  SHA256 清单范围（**默认 critical**）；",
      "                      critical = 表里 type:file 的类 + assets/ + pkrc/（实测 18 条 / 0.4 s）",
      "                      full     = 全量（实测 38062 条 / 167.9 s / 756.9 MB）",
      "  --locales-from=build|asset|union  locales 双源策略（见 B-9 文档 §五）",
      "  --locale-conflict=overlay|base    同 key 不同值的胜者（默认 overlay=保留 mod 文本）",
      "  --commit            实际执行（**无此 flag 一律 dry-run**）",
      "  --no-verify         跳过暂存产物校验（不推荐）",
      "  --skip-smoke        跳过切换后冒烟测试（不推荐）",
      "  --report=<file>     把本次发布报告写成 JSON",
      "",
      "参数写法：--key=value 与 --key value 均可。",
      "",
      "⚠️ 回滚只回退「文件产物」，**不回退存档**（.prsv 冻结，发布流程不触碰存档）。",
      "背景与设计：docs/delegation/18-B4-发布脚本设计.md",
    ].join("\n"),
  );
}

// ---------------------------------------------------------------------------
// 入口
// ---------------------------------------------------------------------------
// ⚠️ 必须用 require.main 判断：测试要 `require()` 本模块来单测内部函数
//    （本沙箱 spawn 子进程会 EBUSY，只能用进程内测试），此时**不得**执行 CLI。
if (require.main === module) {
  (async function main() {
    let res;
    switch (cmd) {
      case "publish":
        res = await cmdPublish();
        break;
      case "rollback":
        res = await cmdRollback();
        break;
      case "list":
        res = await cmdList();
        break;
      case "help":
        printHelp();
        res = { code: 0 };
        break;
      default:
        out(`未知子命令：${rawArgv[0]}（可用：publish / rollback / list / help）`);
        res = { code: 2 };
    }
    if (res && res.reportPath && res.report) {
      try {
        const data = Object.assign({}, res.report, {
          at: new Date().toISOString(),
          command: cmd,
          argv: rawArgv,
          log: LOG,
        });
        fs.mkdirSync(path.dirname(path.resolve(res.reportPath)), { recursive: true });
        fs.writeFileSync(path.resolve(res.reportPath), JSON.stringify(data, null, 2), "utf8");
        out(`\n发布报告已写入：${path.resolve(res.reportPath)}`);
      } catch (err) {
        out(`\n⚠️ 发布报告写入失败：${err.message}`);
      }
    }
    if (res && res.code) process.exitCode = res.code;
  })().catch((err) => {
    process.stderr.write(`fatal: ${err && err.stack ? err.stack : err}\n`);
    process.exitCode = 1;
  });
}

module.exports = {
  // 子命令（测试在进程内直接调用）
  cmdPublish,
  cmdRollback,
  cmdList,
  printHelp,
  // 测试辅助
  setArgv,
  setQuiet,
  getLog,
  startCapture,
  stopCapture,
  opt,
  flag,
  // 可单测的纯/近纯函数
  smokeTest,
  isFallbackNotFound,
  removeRestoredManifest,
  pruneBackups,
  hashTree,
  spaceProbe,
  writeSumsFile,
  listFiles,
  sameVolume,
  looksLikeDist,
  stamp,
  BACKUP_NAME_RE,
  copyTree,
};
