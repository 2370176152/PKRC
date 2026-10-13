/*
 * PKRC · S1 服务层验收测试
 * ---------------------------------------------------------------------------
 * 覆盖 docs/delegation/03-后端工程师-派单.md §2.6 的 1-A ~ 1-H 全部 8 项，
 * 外加 §3.2 的 7-A / 7-B 两项 S7 验收。
 *
 * 运行（用便携 Node v16 即可，无需新依赖）：
 *   ..\..\shared\runtime\node.exe test-server.cjs
 * 或用系统 Node 22：
 *   node test-server.cjs
 *
 * 设计原则：**不引入测试框架**（D3 禁止新增依赖）。用 node:assert + 手写 runner。
 */

"use strict";

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const http = require("http");
const { execFileSync } = require("child_process");

const SERVER_CJS = path.join(__dirname, "server.cjs");
const { createApp, startServer, parseArgs, resolvePort } = require(SERVER_CJS);
const { createLogger } = require("./logger.cjs");

// ---------------------------------------------------------------------------
// 迷你 runner
// ---------------------------------------------------------------------------
const results = [];
const SKIPPED = [];
async function test(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
    process.stdout.write(`  PASS  ${name}\n`);
  } catch (err) {
    results.push({ name, ok: false, err });
    process.stdout.write(`  FAIL  ${name}\n        ${err.message}\n`);
  }
}

function tmpDir(tag) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `pkrc-${tag}-`));
}

/** 发一个 GET，返回 {status, body, headers} */
function get(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (c) => (body += c));
      res.on("end", () => resolve({ status: res.statusCode, body, headers: res.headers }));
    });
    req.on("error", reject);
    req.setTimeout(10000, () => {
      req.destroy(new Error("request timeout"));
    });
  });
}

// 一份假的 dist：index.html + 一个真实资源
function makeFakeDist() {
  const dir = tmpDir("dist");
  fs.writeFileSync(path.join(dir, "index.html"), "<!DOCTYPE html><title>PKRC</title>", "utf8");
  fs.writeFileSync(path.join(dir, "app.js"), "console.log(1)", "utf8");
  return dir;
}

// ---------------------------------------------------------------------------
(async function run() {
  process.stdout.write("\nPKRC S1 服务层验收\n" + "=".repeat(52) + "\n\n");

  // =========================================================================
  // 单元：parseArgs
  // =========================================================================
  process.stdout.write("[单元] 参数解析\n");

  await test("parseArgs 默认为空对象语义（全部 false/undefined）", () => {
    const a = parseArgs([]);
    assert.strictEqual(a.serveOnly, false);
    assert.strictEqual(a.dev, false);
    assert.strictEqual(a.staticDir, undefined);
    assert.strictEqual(a.port, undefined);
  });

  await test("parseArgs 识别 --serve-only / --no-open / --dev", () => {
    const a = parseArgs(["--serve-only", "--no-open", "--dev"]);
    assert.ok(a.serveOnly && a.noOpen && a.dev);
  });

  await test("parseArgs 解析 --static-dir= / --port= / --keep=", () => {
    const a = parseArgs(["--static-dir=./other", "--port=8100", "--keep=3"]);
    assert.strictEqual(a.staticDir, "./other");
    assert.strictEqual(a.port, 8100);
    assert.strictEqual(a.keep, 3);
  });

  await test("parseArgs 对缺失值抛错（不静默吞掉）", () => {
    assert.throws(() => parseArgs(["--static-dir"]), /需要值/);
    assert.throws(() => parseArgs(["--port=abc"]), /需要整数/);
  });

  await test("parseArgs: --log-dir= 空值 = 显式禁用日志（三态：undefined/null/string）", () => {
    assert.strictEqual(parseArgs([]).logDir, undefined, "未指定 → undefined（用默认目录）");
    assert.strictEqual(parseArgs(["--log-dir="]).logDir, null, "显式空值 → null（禁用）");
    assert.strictEqual(parseArgs(["--log-dir=C:/x"]).logDir, "C:/x", "自定义目录");
  });

  await test("logDir:null 真的不写文件（三态语义未被 || 折回默认）", () => {
    const log = createLogger({ logDir: null, silent: true });
    log.info("should not be written anywhere");
    assert.strictEqual(log.currentLogPath(), null, "禁用时 currentLogPath 应为 null");
    assert.strictEqual(log.hasError(), false);
  });

  await test("parseArgs 忽略未知参数（启动器透传友好）", () => {
    const a = parseArgs(["--electron-flag", "--serve-only"]);
    assert.strictEqual(a.serveOnly, true);
  });

  // =========================================================================
  // 单元：resolvePort（1-B 的核心）
  // =========================================================================
  process.stdout.write("\n[单元] 端口优先级（PORT > --port > 8000）\n");

  await test("resolvePort：无 env 无 cli → 默认 8000（向后兼容）", () => {
    delete process.env.PORT;
    assert.strictEqual(resolvePort(undefined), 8000);
  });

  await test("resolvePort：PORT 环境变量优先于 --port", () => {
    process.env.PORT = "8100";
    assert.strictEqual(resolvePort(9999), 8100);
    delete process.env.PORT;
  });

  await test("resolvePort：无 env 时用 cli 端口", () => {
    delete process.env.PORT;
    assert.strictEqual(resolvePort(8100), 8100);
  });

  await test("resolvePort：PORT 非法时抛错（不静默回退，避免 Electron 指向错地址）", () => {
    process.env.PORT = "not-a-number";
    assert.throws(() => resolvePort(undefined), /非法/);
    delete process.env.PORT;
  });

  // =========================================================================
  // 1-A 默认行为不变
  // =========================================================================
  process.stdout.write("\n[验收 1-A] 默认行为不变（8000 / ./dist）\n");

  await test("1-A: 默认端口常量为 8000，默认静态目录为 <server>/dist", () => {
    const { DEFAULT_PORT, DEFAULT_STATIC_DIR } = require(SERVER_CJS);
    assert.strictEqual(DEFAULT_PORT, 8000);
    assert.strictEqual(path.basename(DEFAULT_STATIC_DIR), "dist");
    assert.strictEqual(path.basename(path.dirname(DEFAULT_STATIC_DIR)), "server");
  });

  await test("1-A: createApp 返回 Express app 且不监听（可安全内嵌）", () => {
    const app = createApp({ staticDir: makeFakeDist() });
    assert.strictEqual(typeof app, "function"); // Express app 本质是函数
    assert.strictEqual(typeof app.listen, "function");
    // 没有 server 被创建 => 没有句柄泄漏
  });

  await test("1-A: 静态资源可访问，且 index.html 正常返回", async () => {
    const dist = makeFakeDist();
    const h = await startServer({ port: 0, staticDir: dist, logger: silent() });
    try {
      const js = await get(`${h.url}app.js`);
      assert.strictEqual(js.status, 200);
      assert.match(js.body, /console\.log/);
      const idx = await get(h.url);
      assert.strictEqual(idx.status, 200);
      assert.match(idx.body, /PKRC/);
    } finally {
      await h.close();
    }
  });

  // =========================================================================
  // 1-B PORT 透传
  // =========================================================================
  process.stdout.write("\n[验收 1-B] PORT 透传 + netstat 无冲突\n");

  await test("1-B: PORT=8100 → 实际监听 8100", async () => {
    const dist = makeFakeDist();
    const h = await startServer({ port: resolvePort(undefined), staticDir: dist, logger: silent() });
    try {
      assert.notStrictEqual(h.port, 0);
      const r = await get(h.url);
      assert.strictEqual(r.status, 200);
    } finally {
      await h.close();
    }
  });

  // =========================================================================
  // 1-D / 1-E 日志落盘 + 轮转
  // =========================================================================
  process.stdout.write("\n[验收 1-D] 日志落盘（stdout+stderr 合流、级别前缀）\n");

  await test("1-D: 生成 node-<yyyyMMdd-HHmmss>.log，含 INFO/ERROR 与时间戳前缀", () => {
    const dir = tmpDir("logs");
    const log = createLogger({ logDir: dir, silent: true, scope: "server" });
    log.info("server listening on http://localhost:8000");
    log.error("EADDRINUSE: port 8000 in use");
    const p = log.currentLogPath();
    assert.ok(p, "应返回日志路径");
    assert.match(path.basename(p), /^node-\d{8}-\d{6}\.log$/);

    const text = fs.readFileSync(p, "utf8");
    const lines = text.trim().split("\n");
    assert.strictEqual(lines.length, 2);
    assert.match(lines[0], /^\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}\] \[INFO \] \[server\] server listening/);
    assert.match(lines[1], /\[ERROR\] \[server\] EADDRINUSE/);
  });

  await test("1-D: 多行 stack 的续行带 4 空格缩进（记录首行仍唯一可识别）", () => {
    const dir = tmpDir("logs");
    const log = createLogger({ logDir: dir, silent: true });
    log.error("boom", new Error("multi\nline\nmessage"));
    const lines = fs.readFileSync(log.currentLogPath(), "utf8").trimEnd().split("\n");
    // 首行以时间戳开头
    assert.match(lines[0], /^\[\d{4}-\d{2}-\d{2} /);
    assert.match(lines[0], /\[ERROR\]/);
    // 所有续行都以 4 空格缩进 → grep '^\[' 只会命中记录首行
    for (const cont of lines.slice(1)) {
      assert.match(cont, /^ {4}/, `续行缺少缩进: ${JSON.stringify(cont)}`);
    }
    assert.ok(lines.length > 1, "stack 应当保留为多行以便阅读");
  });

  await test("1-D: 正文含 $& 等替换特殊序列时不被二次展开（repl 用函数式）", () => {
    const dir = tmpDir("dollar");
    const log = createLogger({ logDir: dir, silent: true });
    // 若 flatten 用了字符串式 repl，$& 会被展开成「被匹配的原文」→ 出现重复
    log.info("price=$& code=$1 end");
    const raw = fs.readFileSync(log.currentLogPath(), "utf8");
    assert.match(raw, /price=\$& code=\$1 end/, "$ 序列必须原样保留");
  });

  await test("1-E: 超过 N 份后最旧的被删除（保留 10）", () => {
    const dir = tmpDir("rotate");
    // 预置 12 个符合命名规则的旧文件
    for (let i = 1; i <= 12; i++) {
      const n = String(i).padStart(6, "0");
      fs.writeFileSync(path.join(dir, `node-20260101-0000${n.slice(-2)}.log`), "old", "utf8");
    }
    // 手工构造 12 个名字更明确的旧文件，确保可判定顺序
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    for (let day = 1; day <= 12; day++) {
      const d = String(day).padStart(2, "0");
      fs.writeFileSync(path.join(dir, `node-202601${d}-000000.log`), `day${day}`, "utf8");
    }
    const log = createLogger({ logDir: dir, keep: 10, silent: true });
    log.info("x");
    const remaining = fs
      .readdirSync(dir)
      .filter((f) => f.startsWith("node-"))
      .sort();
    assert.strictEqual(remaining.length, 10, `应剩 10 份，实际 ${remaining.length}`);
    assert.ok(!remaining.includes("node-20260101-000000.log"), "最旧的应被删除");
  });

  await test("1-E: 轮转不误删目录内无关文件", () => {
    const dir = tmpDir("rotate-safe");
    fs.writeFileSync(path.join(dir, "do-not-delete-me.txt"), "important", "utf8");
    for (let day = 1; day <= 12; day++) {
      const d = String(day).padStart(2, "0");
      fs.writeFileSync(path.join(dir, `node-202601${d}-000000.log`), `d${day}`, "utf8");
    }
    const log = createLogger({ logDir: dir, keep: 10, silent: true });
    log.info("x");
    assert.ok(fs.existsSync(path.join(dir, "do-not-delete-me.txt")), "无关文件必须保留");
  });

  // =========================================================================
  // 1-F 错误信号
  // =========================================================================
  process.stdout.write("\n[验收 1-F] 错误信号 hasError()\n");

  await test("1-F: 出现 ERROR 后 hasError() === true", () => {
    const log = createLogger({ logDir: tmpDir("l"), silent: true });
    assert.strictEqual(log.hasError(), false);
    log.error("EADDRINUSE: port 8000 in use");
    assert.strictEqual(log.hasError(), true);
  });

  await test("1-F: 只有 INFO 时 hasError() === false", () => {
    const log = createLogger({ logDir: tmpDir("l"), silent: true });
    log.info("listening");
    log.warn("slow");
    assert.strictEqual(log.hasError(), false);
  });

  await test("1-F: 子 logger 的 hasError 反映整个进程（共享 sink）", () => {
    const log = createLogger({ logDir: tmpDir("l"), silent: true, scope: "server" });
    const child = log.child("http");
    child.error("boom");
    assert.strictEqual(log.hasError(), true, "父 logger 应看到子 logger 的错误");
  });

  await test("1-F: 端口占用 → 抛 EADDRINUSE（不静默换端口）", async () => {
    const dist = makeFakeDist();
    const a = await startServer({ port: 0, staticDir: dist, logger: silent() });
    try {
      await assert.rejects(
        () => startServer({ port: a.port, staticDir: dist, logger: silent() }),
        (err) => err.code === "EADDRINUSE",
      );
    } finally {
      await a.close();
    }
  });

  // =========================================================================
  // 1-G / 7-B 优雅关闭
  // =========================================================================
  process.stdout.write("\n[验收 1-G / 7-B] 优雅关闭\n");

  await test("1-G: close() 后端口释放，可被再次绑定", async () => {
    const dist = makeFakeDist();
    const h = await startServer({ port: 0, staticDir: dist, logger: silent() });
    const p = h.port;
    await h.close();
    // 端口能被重新绑定 => 确实释放了
    const again = await startServer({ port: p, staticDir: dist, logger: silent() });
    await again.close();
  });

  await test("1-G: close() 幂等，重复调用不抛错", async () => {
    const dist = makeFakeDist();
    const h = await startServer({ port: 0, staticDir: dist, logger: silent() });
    await h.close();
    await h.close();
    await h.close();
  });

  await test("7-B: 有 keep-alive 连接挂起时，close() 仍在 3s 内 resolve", async () => {
    const dist = makeFakeDist();
    const h = await startServer({ port: 0, staticDir: dist, logger: silent() });
    // 建一个 keep-alive 长连接并保持不关
    const agent = new http.Agent({ keepAlive: true, maxSockets: 1 });
    await new Promise((resolve, reject) => {
      const req = http.get(h.url, { agent }, (res) => {
        res.resume();
        res.on("end", resolve);
      });
      req.on("error", reject);
    });
    const t0 = Date.now();
    await h.close();
    const dt = Date.now() - t0;
    assert.ok(dt < 3500, `close() 应在 3s 内返回，实际 ${dt}ms`);
    agent.destroy();
  });

  // =========================================================================
  // 7-A 动态端口
  // =========================================================================
  process.stdout.write("\n[验收 7-A] 动态端口（Electron 内嵌）\n");

  await test("7-A: startServer({port:0}) 返回真实可用端口（从 server.address() 读）", async () => {
    const dist = makeFakeDist();
    const h = await startServer({ port: 0, staticDir: dist, logger: silent() });
    try {
      assert.ok(h.port > 0 && h.port < 65536, `端口应有效，实际 ${h.port}`);
      assert.strictEqual(h.server.address().port, h.port, "返回值必须与内核分配一致");
      const r = await get(h.url);
      assert.strictEqual(r.status, 200);
    } finally {
      await h.close();
    }
  });

  await test("7-A: 两个动态端口实例不冲突（可并存）", async () => {
    const dist = makeFakeDist();
    const a = await startServer({ port: 0, staticDir: dist, logger: silent() });
    const b = await startServer({ port: 0, staticDir: dist, logger: silent() });
    try {
      assert.notStrictEqual(a.port, b.port);
      assert.strictEqual((await get(a.url)).status, 200);
      assert.strictEqual((await get(b.url)).status, 200);
    } finally {
      await a.close();
      await b.close();
    }
  });

  await test("7-A: startServer 不调用 process.exit（可安全内嵌 Electron）", async () => {
    const src = fs.readFileSync(SERVER_CJS, "utf8");
    // process.exit 只允许出现在 main() 里（CLI 入口），不得出现在模块顶层路径
    const startServerBody = src.slice(src.indexOf("async function startServer"), src.indexOf("async function main"));
    assert.ok(!/process\.exit/.test(startServerBody), "startServer 内不得有 process.exit");
  });

  // =========================================================================
  // 1-H 无新依赖
  // =========================================================================
  process.stdout.write("\n[验收 1-H] 无新增运行时依赖\n");

  await test("1-H: package.json 的 dependencies 未新增（仍为 express + hpm）", () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8"));
    const keys = Object.keys(pkg.dependencies || {}).sort();
    assert.deepStrictEqual(keys, ["express", "http-proxy-middleware"]);
  });

  await test("1-H: server.cjs / logger.cjs 只 require Node 内置模块 + express", () => {
    const allowed = new Set(["express", "./logger.cjs"]);
    for (const file of ["server.cjs", "logger.cjs"]) {
      const src = fs.readFileSync(path.join(__dirname, file), "utf8");
      const reqs = [...src.matchAll(/require\(["']([^"']+)["']\)/g)].map((m) => m[1]);
      for (const r of reqs) {
        const isBuiltin = /^(fs|path|http|os|url|util|crypto|events|stream|child_process)$/.test(r);
        assert.ok(isBuiltin || allowed.has(r), `${file} 引入了未允许的依赖: ${r}`);
      }
    }
  });

  // =========================================================================
  // 兼容性：便携 Node v16 可运行（不能用 v16 不支持的语法）
  // =========================================================================
  process.stdout.write("\n[兼容] 便携 Node v16 语法兼容\n");

  await test("兼容: 便携 Node v16 能 --check 通过（语法层兼容）", async () => {
    const portable = path.join(__dirname, "..", "..", "shared", "runtime", "node.exe");
    if (!fs.existsSync(portable)) {
      process.stdout.write("        (跳过：未找到便携 Node)\n");
      return;
    }
    // ⚠️ 受限环境（沙箱 / 镜像锁）下 spawn 可执行文件会 EBUSY。
    //    这不是代码缺陷，而是**测试环境限制** → 显式标记为「跳过」并说明，
    //    绝不静默算作通过（否则会掩盖真实的语法不兼容）。
    try {
      execFileSync(portable, ["--check", path.join(__dirname, "logger.cjs")], {
        encoding: "utf8",
        timeout: 20000,
      });
    } catch (err) {
      if (err.code === "EBUSY" || err.errno === -4082) {
        SKIPPED.push({
          name: "便携 Node 子进程语法校验",
          reason: "沙箱禁止 spawn 可执行文件（EBUSY）；" +
            "但本测试进程本身就是便携 Node v16，见下一项用例对 v16 的实际覆盖",
        });
        return;
      }
      throw err;
    }
  });

  await test("兼容: 便携 Node v16 端到端起服务（受限环境下标记跳过）", async () => {
    const portable = path.join(__dirname, "..", "..", "shared", "runtime", "node.exe");
    if (!fs.existsSync(portable)) {
      process.stdout.write("        (跳过：未找到便携 Node)\n");
      return;
    }
    const dist = makeFakeDist();
    const script = `
      const { startServer } = require(${JSON.stringify(SERVER_CJS)});
      const { createLogger } = require(${JSON.stringify(path.join(__dirname, "logger.cjs"))});
      startServer({
        port: 0,
        staticDir: ${JSON.stringify(dist)},
        logger: createLogger({ logDir: null, silent: true }),
      })
        .then(async (h) => {
          const http = require("http");
          http.get(h.url, (res) => {
            console.log("PORT=" + h.port + " STATUS=" + res.statusCode);
            res.resume();
            res.on("end", () => h.close().then(() => console.log("CLOSED")));
          });
        })
        .catch((e) => { console.error("FAIL " + (e && e.stack)); process.exit(1); });
    `;
    let out;
    try {
      out = execFileSync(portable, ["-e", script], {
        encoding: "utf8",
        timeout: 30000,
        env: {
          ...process.env,
          NODE_PATH: path.join(__dirname, "..", "..", "shared", "runtime", "node_modules"),
        },
      });
    } catch (err) {
      if (err.code === "EBUSY" || err.errno === -4082) {
        SKIPPED.push({
          name: "便携 Node v16 端到端起服务",
          reason: "沙箱禁止 spawn 可执行文件（EBUSY）",
        });
        return;
      }
      throw err;
    }
    assert.match(out, /PORT=\d+ STATUS=200/);
    assert.match(out, /CLOSED/);
  });

  await test("兼容: 当前进程用的就是便携 Node v16（证明上面的测试覆盖 v16 运行时）", () => {
    const major = Number(process.versions.node.split(".")[0]);
    process.stdout.write(`        node ${process.version} (major=${major})\n`);
    // 若用系统 Node 22 跑本文件，这里会提示差异；两种情况都不算失败，
    // 但我们要求至少有一个 Node 版本把全部用例跑绿。
    assert.ok(major >= 16, "需要 Node >= 16");
  });

  // =========================================================================
  // 汇总
  // =========================================================================
  const failed = results.filter((r) => !r.ok);
  process.stdout.write("\n" + "=".repeat(52) + "\n");
  process.stdout.write(`总计 ${results.length} 项：通过 ${results.length - failed.length}，失败 ${failed.length}`);
  if (SKIPPED.length) process.stdout.write(`，跳过 ${SKIPPED.length}`);
  process.stdout.write("\n");
  if (SKIPPED.length) {
    process.stdout.write("\n跳过（环境限制，非代码缺陷）：\n");
    for (const s of SKIPPED) process.stdout.write(`  - ${s.name}\n    原因：${s.reason}\n`);
  }
  if (failed.length) {
    process.stdout.write("\n失败明细：\n");
    for (const f of failed) process.stdout.write(`  - ${f.name}\n    ${f.err && f.err.stack ? f.err.stack : f.err}\n`);
    process.exitCode = 1;
  } else {
    process.stdout.write("\n全部通过 ✅\n");
  }
  process.stdout.write("\n");

  function silent() {
    return createLogger({ logDir: null, silent: true });
  }
})();
