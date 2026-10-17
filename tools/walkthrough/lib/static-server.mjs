/**
 * PKRC · F-10 自动化走查环境 · 零依赖静态服务器
 * ---------------------------------------------------------------------------
 * 为什么不复用 game/server/server.cjs：它 require("express")，而项目根目录
 * 没有 node_modules（express 只在 shared/runtime/node_modules 里，且绑定
 * 便携 Node 16）。走查环境要求「零依赖 + 用系统 Node 22 跑」，因此这里用
 * Node 内置 http/fs 重写一个够用的静态服务器。
 *
 * 与 server.cjs 的**有意差异**（走查专用，不影响产物行为）：
 *   - 命中目录返回 index.html；未命中的**真 404**（走查要能暴露「资源缺失」，
 *     而不是像 server.cjs 那样返回 200+ok:false —— 后者会掩盖 404）
 *   - 加了 `no-store`，避免 headless 复用缓存导致 A/B 串味
 *   - 支持可选的 `onRequest` 回调，便于统计请求（供 B-11「日志定向」对齐）
 *
 * 端口用 0（内核自选）⇒ 支持 A/B 并跑时端口隔离。
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".htm": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".cjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".wasm": "application/wasm",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".wav": "audio/wav",
  ".m4a": "audio/mp4",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".txt": "text/plain; charset=utf-8",
  ".map": "application/json; charset=utf-8",
};

function mimeFor(file) {
  return MIME[path.extname(file).toLowerCase()] || "application/octet-stream";
}

/**
 * 启动静态服务器。
 *
 * @param {string|string[]} root 静态根目录（可传数组做**覆盖叠加**：
 *        从左到右依次查找，命中即返回）。用于 A 版产物：A 只有 assets/index.html，
 *        其余资源（audio/fonts/…）落到叠加层 B，无需拷贝 825MB。
 * @param {object} [opts]
 * @param {number} [opts.port] 默认 0（内核自选）
 * @param {string} [opts.host] 默认 127.0.0.1
 * @param {boolean} [opts.spa]  未命中且接受 text/html 时回落到首个根的 index.html，默认 true
 * @param {(info:{url:string,status:number})=>void} [opts.onRequest]
 * @returns {Promise<{port:number,url:string,roots:string[],close:()=>Promise<void>,stats:{total:number,notFound:number}}>}
 */
export async function startStaticServer(root, opts = {}) {
  const roots = (Array.isArray(root) ? root : [root]).map((r) => path.resolve(r));
  for (const r of roots) {
    if (!fs.existsSync(r)) throw new Error(`静态根目录不存在：${r}`);
  }
  const host = opts.host || "127.0.0.1";
  const spa = opts.spa !== false;
  const stats = { total: 0, notFound: 0 };
  const primaryIndex = path.join(roots[0], "index.html");

  /**
   * 在叠加层里解析一个 URL 路径 → 绝对文件路径。
   * @returns {string|null}
   */
  const resolveInRoots = (urlPath) => {
    const rel = urlPath.replace(/^\/+/, "");
    for (const r of roots) {
      const candidate = path.resolve(r, rel);
      if (candidate !== r && !candidate.startsWith(r + path.sep)) continue; // 防穿越
      if (!fs.existsSync(candidate)) continue;
      const st = fs.statSync(candidate);
      if (st.isFile()) return candidate;
      if (st.isDirectory()) {
        const idx = path.join(candidate, "index.html");
        if (fs.existsSync(idx)) return idx;
      }
    }
    return null;
  };

  const server = http.createServer((req, res) => {
    let urlPath;
    try {
      urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
    } catch {
      res.writeHead(400).end("bad url");
      return;
    }

    const filePath = resolveInRoots(urlPath);
    if (filePath) {
      return sendFile(res, filePath, stats, opts);
    }

    // SPA 回落：仅在没有扩展名（前端路由）时回落到 index.html
    const hasExt = path.extname(urlPath) !== "";
    if (spa && !hasExt && fs.existsSync(primaryIndex)) {
      return sendFile(res, primaryIndex, stats, opts);
    }

    stats.notFound++;
    report(stats, opts, req.url, 404);
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" }).end("404 Not Found: " + urlPath);
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(Number.isInteger(opts.port) ? opts.port : 0, host, resolve);
  });

  const port = server.address().port;
  const url = `http://${host}:${port}/`;

  const close = () =>
    new Promise((resolve) => {
      try {
        server.closeAllConnections?.();
      } catch {
        /* ignore */
      }
      server.close(() => resolve());
    });

  return { port, url, roots, close, stats };
}

function sendFile(res, filePath, stats, opts) {
  stats.total++;
  report(stats, opts, filePath, 200);
  const stream = fs.createReadStream(filePath);
  stream.on("error", () => {
    if (!res.headersSent) res.writeHead(500).end("read error");
  });
  res.writeHead(200, {
    "content-type": mimeFor(filePath),
    "cache-control": "no-store",
    "access-control-allow-origin": "*",
  });
  stream.pipe(res);
}

function report(stats, opts, url, status) {
  try {
    opts.onRequest?.({ url, status });
  } catch {
    /* ignore */
  }
}

// 允许直接运行本文件做一次自检：node static-server.mjs <root>
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = process.argv[2] || process.cwd();
  const s = await startStaticServer(root, {});
  console.log(`[walkthrough] static server ready at ${s.url} (roots=${s.roots.join(", ")})`);
  console.log("按 Ctrl+C 退出");
}
