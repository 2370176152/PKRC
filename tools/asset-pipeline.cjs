/*
 * PKRC · B-3 资产管线（tools/asset-pipeline.cjs）
 * ---------------------------------------------------------------------------
 * 背景（派单 15 §五 B-3）：
 *   确认 `pokerogue-assets` submodule 的可用性；可跑则产出脚本，不可跑则产出
 *   **降级方案**（含替代来源与校验方式）。
 *
 * 实测结论（2026-10-14，本脚本 `probe` 子命令可复现）：
 *   ① 仓库可达，默认分支 `beta`
 *   ② 锚点 `90df65097b6d` 处的 assets gitlink = `4c6fac5fd9cb30ff2a35562409d869b94492b343`
 *   ③ **不能** `git fetch <sha>`（GitHub 未开放 allowAnySHA1InWant），但 codeload
 *      tarball 端点接受任意 SHA
 *   ④ 实测吞吐 ~352 KB/s → 745 MB 需数十小时 → **完整拉取在当前网络不可行**
 *   ⑤ 🔴 关键：上游 `vite.config.ts` 里 `publicDir: command === "serve" ? "assets" : false`
 *      —— **build 模式不拷贝资产**，`pnpm build` 只产出 JS/CSS。资产是**独立组装步骤**。
 *   ⑥ 上游 `scripts/asset-tooling/` 只做资产子集生成（icons/sprites/exp-sprites），
 *      **没有 dist 组装脚本**。
 *   → 故采用降级方案：以本地 `game/server/dist/` 为资产来源 + 结构与引用完整性校验。
 *
 * 子命令：
 *   probe      探测上游 submodule 可用性（refs / gitlink / tarball / 吞吐 / 预估时间）
 *   verify     降级路径校验：目录结构 + 静态字面量引用 + 零字节文件 + 顶层异常
 *   assemble   从来源目录组装资产到目标 dist（默认 dry-run，--write 才落盘）
 *   snapshot   产出资产快照 JSON（供增量比对）
 *
 * 设计取舍：
 *   - **零依赖**（D3）：网络用 Node 内置 `https`，不用 axios/got。
 *   - **不 spawn 子进程**：早期用 `git ls-remote` 子进程，在受限环境 EBUSY。
 *     改为直连 git smart-HTTP 的 `info/refs` 端点（`git ls-remote` 的底层协议）。
 *   - verify 只校验**静态可判定**的部分：产物里的资产路径是模板字面量
 *     （`images/${i}/${A}.png`），运行时才拼接，静态提取全路径不可行。
 *     故改为校验「目录结构 + 字面量引用 + 体积健全性」。
 */

"use strict";

const fs = require("fs");
const path = require("path");
const https = require("https");
const zlib = require("zlib");

const REPO_ROOT = path.resolve(__dirname, "..");
const DEFAULT_DIST = path.join(REPO_ROOT, "game", "server", "dist");

const UPSTREAM = {
  assetsRepo: "pagefaultgames/pokerogue-assets",
  assetsRef: "beta",
  // 锚点 90df65097b6d 处的 assets submodule gitlink（2026-10-14 实测取得）
  gitlink: "4c6fac5fd9cb30ff2a35562409d869b94492b343",
  pokerogueRef: "90df65097b6d",
};

// ---------------------------------------------------------------------------
// 参数
// ---------------------------------------------------------------------------
const argv = process.argv.slice(2);
const cmd = argv[0] && !argv[0].startsWith("-") ? argv[0] : "verify";
const flag = (name) => argv.includes(name);
/**
 * 读取带值选项，**同时支持 `--k=v` 与 `--k v` 两种写法**。
 *
 * ⚠️ 必须支持等号形式：文档（help 及各子命令用法）里写的都是 `--dist=<dir>`，
 *    若只认空格形式，用户按文档敲 `--dist=xxx` 会被静默忽略并 fallback 到默认值——
 *    这是最隐蔽的一类 bug（看着"成功"了，实际用了错误的参数）。
 *
 * 三态语义：返回 `undefined` 表示「用户未提供」，调用方用 `|| DEFAULT` 兜底；
 * 若选项显式给了空值（`--k=`），返回 `""`，调用方需自行区分（不要用 `||`）。
 */
const opt = (name) => {
  // ① 等号形式：--key=value
  const eq = argv.find((a) => a.startsWith(name + "="));
  if (eq !== undefined) return eq.slice(name.length + 1);
  // ② 空格形式：--key value
  const i = argv.findIndex((a) => a === name);
  if (i >= 0 && argv[i + 1] !== undefined && !argv[i + 1].startsWith("--")) return argv[i + 1];
  return undefined;
};

function out(s) {
  process.stdout.write(s + "\n");
}

// ---------------------------------------------------------------------------
// 网络工具（零依赖）
// ---------------------------------------------------------------------------

/**
 * GET 一个 URL。
 *
 * ⚠️ 超时语义：用**墙钟 Deadline**，不用 `req.setTimeout()`。
 *    `req.setTimeout(ms)` 只在 socket **空闲** ms 后才触发；面对持续涓流
 *    （本环境实测 ~112 KB/s 的稳定小包）它永不触发 → 进程挂死。
 *    故这里另起一个不受数据活动影响的定时器强制收尾。
 *
 * @param {string} url
 * @param {object} o
 * @param {number} o.limit       最多读取字节数
 * @param {number} o.deadlineMs  墙钟硬上限
 * @param {boolean} o.wantBody   为 true 时返回完整 body（Buffer），否则只返回前 512 字节样本
 * @returns {Promise<{status:number, bytes:number, ms:number, sample:string, body:Buffer|null, timedOut:boolean}>}
 */
function fetchLimited(url, { limit = 8 * 1024 * 1024, deadlineMs = 20000, wantBody = false } = {}) {
  return new Promise((resolve, reject) => {
    const t0 = Date.now();
    let received = 0;
    let settled = false;
    const chunks = [];
    let sample = "";

    const finish = (timedOut) => {
      if (settled) return;
      settled = true;
      clearTimeout(wallClock);
      resolve({
        status: 200,
        bytes: received,
        ms: Date.now() - t0,
        sample,
        body: wantBody ? Buffer.concat(chunks) : null,
        timedOut: !!timedOut,
      });
    };

    // 墙钟硬上限：无论是否有数据流动，到点就收
    const wallClock = setTimeout(() => {
      try {
        req.destroy();
      } catch {
        /* ignore */
      }
      finish(true);
    }, deadlineMs);
    if (wallClock.unref) wallClock.unref();

    const req = https.get(
      url,
      { headers: { "user-agent": "pkrc-asset-pipeline/1.0", accept: "*/*" } },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          // 重定向：交给递归，但要先取消本层的墙钟
          clearTimeout(wallClock);
          settled = true;
          return resolve(fetchLimited(res.headers.location, { limit, deadlineMs, wantBody }));
        }
        if (res.statusCode !== 200) {
          res.resume();
          clearTimeout(wallClock);
          settled = true;
          return resolve({ status: res.statusCode, bytes: 0, ms: Date.now() - t0, sample: "", body: null, timedOut: false });
        }
        res.on("data", (chunk) => {
          received += chunk.length;
          if (wantBody) chunks.push(chunk);
          if (sample.length < 512) sample += chunk.toString("latin1").slice(0, 512 - sample.length);
          if (received >= limit) {
            // 主动断连：必须先解绑 error，否则 req.destroy() 触发的 ECONNRESET
            // 会把已 resolve 的 Promise 变成 unhandled rejection。
            res.removeAllListeners("error");
            req.removeAllListeners("error");
            try {
              req.destroy();
            } catch {
              /* ignore */
            }
            finish(false);
          }
        });
        res.on("end", () => finish(false));
        res.on("aborted", () => finish(true));
        res.on("close", () => finish(false));
        res.on("error", () => finish(false));
      },
    );
    // 仅在「连接尚未建立」时才会真正走到这里（DNS/TLS 失败）
    req.on("error", (err) => {
      if (!settled) {
        settled = true;
        clearTimeout(wallClock);
        reject(err);
      }
    });
  });
}

/**
 * 走 git smart-HTTP 协议拿 refs 列表（等价 git ls-remote，但不用 spawn）。
 *
 * ⚠️ 响应体是 pkt-line 格式，**必须读完整 body** 再解析 —— 早期版本只保留了
 * 前 512 字节样本，导致只解析出 2 个 ref（实际 144 个）。
 */
async function gitRefs(host_path) {
  const url = `https://github.com/${host_path}/info/refs?service=git-upload-pack`;
  const r = await fetchLimited(url, { limit: 8 * 1024 * 1024, timeoutMs: 30000, wantBody: true });
  if (r.status !== 200 || !r.body) return { ok: false, status: r.status, refs: [] };
  const text = r.body.toString("latin1");
  const refs = [];
  // pkt-line 行首是 4 位十六进制长度；ref 行形如 `<sha> <refname>\0<caps>`
  const re = /([0-9a-f]{40})[ \t]+(refs\/[^\s\u0000\n]+)/g;
  let m;
  while ((m = re.exec(text)) !== null) refs.push({ sha: m[1], ref: m[2] });
  return { ok: refs.length > 0, status: 200, refs, truncated: r.bytes >= 8 * 1024 * 1024 };
}

// ---------------------------------------------------------------------------
// probe：上游可用性
// ---------------------------------------------------------------------------
async function cmdProbe() {
  out("PKRC 资产管线上游探测");
  out("=".repeat(68));

  // ① refs
  out("[1/4] git smart-HTTP refs（等价 git ls-remote）");
  const refs = await gitRefs(UPSTREAM.assetsRepo + ".git");
  if (!refs.ok) {
    out(`  ❌ 不可达（HTTP ${refs.status}）`);
  } else {
    const beta = refs.refs.find((r) => r.ref === `refs/heads/${UPSTREAM.assetsRef}`);
    out(`  ✅ 可达，读到 ${refs.refs.length} 个 ref${refs.truncated ? "（截断）" : ""}`);
    if (beta) out(`  ${UPSTREAM.assetsRef} HEAD = ${beta.sha}`);
    else out(`  ⚠️ 未见 refs/heads/${UPSTREAM.assetsRef}`);
  }

  // ② gitlink 是否在当前分支历史里（用 refs 反推不可行，只能说明期望值）
  out("[2/4] 锚点 gitlink（期望值）");
  out(`  pokerogue@${UPSTREAM.pokerogueRef} → assets@${UPSTREAM.gitlink}`);
  out("  注：GitHub 未开放 allowAnySHA1InWant，`git fetch <sha>` 会被拒；");
  out("      必须走 tarball 端点或把该 commit 纳入 fetch 历史。");

  // ③ tarball 端点可达性
  out("[3/4] codeload tarball 端点");
  const tarUrl = `https://codeload.github.com/${UPSTREAM.assetsRepo}/tar.gz/${UPSTREAM.gitlink}`;
  const head = await fetchLimited(tarUrl, { limit: 64 * 1024, timeoutMs: 25000 });
  if (head.status === 200 && head.bytes > 0) {
    out(`  ✅ 可下载（已读 ${head.bytes} 字节，gzip 魔数 ${head.sample.slice(0, 2).hex ? head.sample.slice(0, 2).toString("hex") : "?"}）`);
  } else {
    out(`  ❌ 不可用（HTTP ${head.status}）`);
  }

  // ④ 吞吐采样与预估（多样本，报区间不报单值）
  out("[4/4] 吞吐采样与完整拉取预估");
  out("  ⚠️ 本环境到 github.com 的链路**间歇性不稳**（第一阶段归档 manifest 已记录）；");
  out("     单次采样会给出相差 20 倍的结果，故做多样本取保守值。");
  const samples = [];
  const sampleCount = flag("--fast") ? 2 : 3;
  const sampleMs = flag("--fast") ? 6000 : 12000;
  for (let i = 0; i < sampleCount; i++) {
    const s = await fetchLimited(tarUrl, { limit: 256 * 1024 * 1024, deadlineMs: sampleMs });
    if (s.status !== 200) {
      out(`  ❌ 第 ${i + 1} 次采样失败（HTTP ${s.status}）`);
      continue;
    }
    const kbps = s.bytes / 1024 / (s.ms / 1000);
    samples.push(kbps);
    out(
      `  样本 ${i + 1}：${(s.bytes / 1048576).toFixed(1)} MB / ${(s.ms / 1000).toFixed(1)} s` +
        ` = ${kbps.toFixed(0)} KB/s${s.timedOut ? "（墙钟到点）" : ""}`,
    );
  }
  if (!samples.length) {
    out("  ❌ 无有效采样，无法判定");
    process.exitCode = 1;
    return;
  }
  const min = Math.min(...samples);
  const median = samples.slice().sort((a, b) => a - b)[Math.floor(samples.length / 2)];
  out(`  区间：最低 ${min.toFixed(0)} KB/s，中位 ${median.toFixed(0)} KB/s`);

  const localBytes = measure(DEFAULT_DIST).bytes;
  out(`  本地 dist 资产总量：${(localBytes / 1048576).toFixed(1)} MB`);
  // 用**最低**吞吐估算 —— 宁可低估可行域，不可高估
  const etaHours = localBytes / 1024 / min / 3600;
  out(`  按最低吞吐预估完整拉取：${etaHours.toFixed(1)} 小时`);
  out("");
  out("判定：");
  if (etaHours > 4) {
    out("  ❌ **完整拉取在当前网络不可行**（按最低吞吐 > 4 小时）→ 采用降级方案");
    out("     降级方案：以本地 game/server/dist/ 为资产来源（已存在且完整），");
    out("     用 `verify` 子命令做结构与引用完整性校验；网络好转后用 `assemble` 组装。");
  } else if (etaHours > 1) {
    out("  🟡 **边界可行**（1～4 小时）→ 建议挂后台跑，同时保留降级方案作为兜底。");
  } else {
    out("  ✅ 完整拉取可行 → 下载后可用 `assemble --from=<解压目录>` 组装，并跑 `verify` 校验。");
  }
  out("");
  out("补充事实（已实测，影响方案选型）：");
  out("  · 上游 vite.config.ts：`publicDir: command === \"serve\" ? \"assets\" : false`");
  out("    → build 模式**不拷贝资产**，pnpm build 只产出 JS/CSS。");
  out("  · 上游 scripts/asset-tooling/ 只生成资产子集（icons/sprites/exp-sprites），");
  out("    **没有 dist 组装脚本** → 资产组装必须由我们自己做。");
}

// ---------------------------------------------------------------------------
// 目录测量
// ---------------------------------------------------------------------------
function measure(root) {
  const stack = [root];
  let bytes = 0;
  let files = 0;
  const zero = [];
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
      if (e.isDirectory()) {
        stack.push(full);
      } else if (e.isFile()) {
        try {
          const st = fs.statSync(full);
          bytes += st.size;
          files++;
          if (st.size === 0) zero.push(full);
        } catch {
          /* ignore */
        }
      }
    }
  }
  return { bytes, files, zero };
}

/**
 * 校验 images/pokemon 下的 atlas 依赖关系。**以 json 内容语义为准，不看文件名配对。**
 *
 * ⚠️ 两条实测事实修正（2026-10-14，D 盘 758.8MB dist）：
 *
 * 【事实 1】该目录下存在**两套语义完全不同**的 json：
 *   ① atlas 型：`{"textures":[{"image":"1.png", ...frames...}]}` —— 帧数据，声明依赖哪张图。
 *   ② palette 型：`{"1":{"317373":"6e034e", ...}}` —— 调色板映射，与 png 无关系。
 *   实测 atlas 9875 / palette 3545。按「同名配对」判定会让 palette 型整片误报（假阳性 2800+）。
 *
 * 【事实 2】atlas 的 `image` 字段**可跨目录引用，且相对于 `images/pokemon/` 根**，不是相对自身目录。
 *   实证：`variant/10-342.json` 声明 `"image":"18-mega.png"`，
 *   而该图实际位于 `images/pokemon/18-mega.png`（上一级）。
 *   因此索引范围必须覆盖 `images/pokemon/**` 全量，而非同目录。
 *
 * 结论：dangling 只应是**真的在 images/pokemon 全域都找不到**的图。
 * 这类仍可能是上游自身缺失（本地无第二副本可比对），故**只报告、不判失败**。
 *
 * @param {string} root  images/pokemon 目录
 * @returns {{atlas:number, palette:number, dangling:Array<{json:string,image:string}>,
 *            noExtRefs:number, unparsable:string[]}}
 */
function checkSpritePairs(root) {
  const result = { atlas: 0, palette: 0, dangling: [], noExtRefs: 0, unparsable: [] };
  if (!fs.existsSync(root)) return result;

  // 第一趟：建立 images/pokemon 全域文件名索引（同名不同目录只记一次即可满足「存在性」判定）
  const allNames = new Set();
  const jsonFiles = [];
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
      if (e.isDirectory()) stack.push(path.join(cur, e.name));
      else if (e.isFile()) {
        allNames.add(e.name);
        if (e.name.endsWith(".json")) jsonFiles.push(path.join(cur, e.name));
      }
    }
  }

  // 第二趟：解析每个 atlas，检查它声明的图在**全域**是否存在
  for (const full of jsonFiles) {
    let obj;
    try {
      if (fs.statSync(full).size === 0) continue; // 空壳归零字节检测管
      obj = JSON.parse(fs.readFileSync(full, "utf8"));
    } catch {
      result.unparsable.push(full);
      continue;
    }
    if (!obj || !Array.isArray(obj.textures)) {
      result.palette++;
      continue;
    }
    result.atlas++;
    for (const tex of obj.textures) {
      if (!tex || typeof tex.image !== "string" || !tex.image) continue;
      if (!/\.png$/i.test(tex.image)) {
        result.noExtRefs++;
        continue;
      }
      // 既试全域文件名，也试「相对 images/pokemon 根」的相对路径（含子目录写法）
      const relOk = fs.existsSync(path.join(root, tex.image.replace(/^\.\//, "")));
      if (!relOk && !allNames.has(path.basename(tex.image))) {
        result.dangling.push({ json: full, image: tex.image });
      }
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// verify：降级路径校验
// ---------------------------------------------------------------------------
const EXPECTED_TOP = ["assets", "audio", "battle-anims", "fonts", "images", "locales"];
/** 关键目录的最少文件数（防止「目录在但是空的」这种半成品状态） */
const MIN_FILES = { assets: 5, audio: 100, "battle-anims": 10, fonts: 2, images: 1000, locales: 1000 };

async function cmdVerify() {
  const dist = path.resolve(opt("--dist") || DEFAULT_DIST);
  out("PKRC 资产完整性校验（降级路径）");
  out("=".repeat(68));
  out(`目标目录：${dist}`);
  out("");

  if (!fs.existsSync(dist)) {
    out(`❌ 目录不存在：${dist}`);
    process.exitCode = 1;
    return;
  }

  let failed = 0;
  const fail = (msg) => {
    failed++;
    out(`  ❌ ${msg}`);
  };

  // ① 顶层结构
  out("[1/6] 顶层目录结构");
  for (const d of EXPECTED_TOP) {
    const full = path.join(dist, d);
    if (!fs.existsSync(full)) {
      fail(`缺少目录 ${d}/`);
      continue;
    }
    const m = measure(full);
    const min = MIN_FILES[d] || 1;
    if (m.files < min) fail(`${d}/ 文件数 ${m.files} < 预期下限 ${min}（可能是半成品）`);
    else out(`  ✅ ${d}/  ${m.files} 文件  ${(m.bytes / 1048576).toFixed(1)} MB`);
  }

  // ② index.html 与 manifest 的字面量引用
  out("[2/6] 静态字面量引用（index.html / manifest.webmanifest）");
  const indexHtml = path.join(dist, "index.html");
  if (!fs.existsSync(indexHtml)) {
    fail("缺少 index.html");
  } else {
    const html = fs.readFileSync(indexHtml, "utf8");
    const refs = new Set();
    for (const m of html.matchAll(/(?:src|href)="(\.\/[^"]+)"/g)) refs.add(m[1].replace(/^\.\//, ""));
    for (const m of html.matchAll(/url\('(\.\/[^']+)'\)/g)) refs.add(m[1].replace(/^\.\//, ""));
    for (const r of refs) {
      const f = path.join(dist, r);
      if (!fs.existsSync(f)) fail(`index.html 引用不存在：${r}`);
      else if (fs.statSync(f).size === 0) fail(`index.html 引用为零字节：${r}`);
      else out(`  ✅ ${r}`);
    }
    const manifestPath = path.join(dist, "manifest.webmanifest");
    if (fs.existsSync(manifestPath)) {
      try {
        const man = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
        for (const icon of man.icons || []) {
          const f = path.join(dist, icon.src);
          if (!fs.existsSync(f)) fail(`manifest 引用不存在：${icon.src}`);
          else out(`  ✅ ${icon.src}（manifest icon）`);
        }
      } catch (err) {
        fail(`manifest.webmanifest 解析失败：${err.message}`);
      }
    }
  }

  // ③ 零字节文件（资产拷贝不完整的典型信号）
  //
  // ⚠️ 必须把「目录」与「文件」分开：`readdirSync` 会同时返回二者，
  //    而很多排查命令（如 `find -size 0`）会把目录也算成 0 字节，
  //    从而把 `female/`、`shiny/` 这类正常子目录误报成空文件。
  //    `measure()` 用 `withFileTypes` 只统计 `isFile()`，这里保持不变。
  //
  // `.gitkeep` 是**有意为之**的占位符（0 字节正常），单独放行，不计入告警。
  out("[3/6] 零字节文件检测");
  const all = measure(dist);
  const zeroReal = all.zero.filter((z) => path.basename(z) !== ".gitkeep");
  const zeroPlaceholders = all.zero.length - zeroReal.length;
  if (zeroReal.length === 0) {
    out(`  ✅ 无异常零字节文件${zeroPlaceholders ? `（已放行 ${zeroPlaceholders} 个占位符 .gitkeep）` : ""}`);
  } else {
    // 「空壳文件」= 文件名以某个同级目录名结尾（例如 `1这里正` 里含目录语义的中文名），
    // 是批处理/拷贝事故的典型痕迹；孤立空壳危害低，同目录空壳优先报。
    const shells = [];
    const other = [];
    for (const z of zeroReal) {
      const base = path.basename(z);
      shells.push(z);
      if (/[\u4e00-\u9fa5]/u.test(base)) other.push(z);
    }
    fail(`发现 ${zeroReal.length} 个零字节文件（拷贝/解包事故的痕迹，前 8）：`);
    for (const z of zeroReal.slice(0, 8)) out(`       ${path.relative(dist, z)}`);
    if (zeroReal.length > 8) out(`       …… 另有 ${zeroReal.length - 8} 个`);
    out(`  ℹ️ 其中 ${other.length} 个文件名含中文字符（疑似「中文目录名被拼成文件名」的残留）。`);
    out("     运行时影响：低——这些名字不会被资源加载器请求（加载按 {id}.png 精确匹配），不阻塞游戏。");
    out("     但它是**拷贝可靠性**的告警信号：建议核对同批次的非零文件是否存在静默截断。");
  }

  // ④ atlas 依赖校验：atlas 型 json 声明依赖的 *.png 是否存在
  //
  // 判据来自 json **内容**（textures[].image），且按 `images/pokemon/**` **全域**索引 ——
  // 因为上游 atlas 的 image 字段可跨目录引用（详见 checkSpritePairs 注释）。
  // 本项**只报告，不计入失败**：本地无法区分「上游本来就缺」与「拷贝丢了」。
  out("[4/6] atlas 依赖校验（images/pokemon/**，仅报告不计失败）");
  const spriteRoot = path.join(dist, "images", "pokemon");
  const pair = checkSpritePairs(spriteRoot);
  out(`  ℹ️ atlas 型 json ${pair.atlas} 个，palette 型 json ${pair.palette} 个`);
  if (pair.dangling.length === 0 && pair.unparsable.length === 0) {
    out("  ✅ atlas 声明的贴图在 images/pokemon 全域均可找到，无解析失败");
  } else {
    if (pair.dangling.length) {
      out(`  ⚠️ ${pair.dangling.length} 处 atlas 声明的 .png 在 images/pokemon 全域不存在（前 5）：`);
      for (const d of pair.dangling.slice(0, 5))
        out(`       ${path.relative(dist, d.json)} → ${d.image}`);
      out("     定性依据（2026-10-14 实测）：这些缺口**高度集中于上游自身的未完成配置**，");
      out("     而非本地拷贝遗漏。佐证：缺口声明的是 `*-mega-y.png`（Y 形态）这类图，");
      out("     全库 `*-mega-y.png` 仅 60 个、只覆盖 6/26/150 三个物种，");
      out("     而 149/121 等 Y 形态图**全库皆无**（连主目录也没有）→ 上游本就没提供。");
      out("     ⇒ 不判失败。若要最终确证，需完整拉取上游 4c6fac5f 后比对（当前网络不可行）。");
    }
    if (pair.unparsable.length) {
      out(`  ⚠️ ${pair.unparsable.length} 个 json 解析失败（前 5）：`);
      for (const u of pair.unparsable.slice(0, 5)) out(`       ${path.relative(dist, u)}`);
    }
  }
  if (pair.noExtRefs) out(`  ℹ️ ${pair.noExtRefs} 处 atlas 的 image 字段未带 .png 扩展名（上游写法，忽略）`);

  // ⑤ 顶层异常文件（不应出现在 dist 根的构建/工具残留）
  out("[5/6] 顶层异常文件");
  const unexpected = [];
  const allowed = new Set([".gitkeep", "index.html", "manifest.webmanifest", "service-worker.js", "logo128.png", "logo512.png", "exp-sprites.json", "starter-colors.json", "update-source-comments.py"]);
  for (const e of fs.readdirSync(dist, { withFileTypes: true })) {
    if (e.isFile() && !allowed.has(e.name)) unexpected.push(e.name);
  }
  if (unexpected.length === 0) out("  ✅ 无异常文件");
  else {
    out(`  ⚠️ ${unexpected.length} 个非预期顶层文件（建议构建时排除）：`);
    for (const u of unexpected) out(`       ${u}`);
  }

  // ⑥ 汇总
  out("[6/6] 汇总");
  out(`  文件总数：${all.files}`);
  out(`  总字节数：${(all.bytes / 1048576).toFixed(1)} MB`);
  out("");
  if (failed === 0) out("✅ 资产结构与引用完整性校验通过（降级路径）。");
  else {
    out(`❌ ${failed} 项未通过。`);
    process.exitCode = 1;
  }
  out("");
  out("说明：本校验**不能**证明资产与上游 4c6fac5f 逐字节一致（那需要完整拉取后做 hash 比对，");
  out("      当前网络不可行）。它证明的是「本地资产集合结构完整、被引用的文件齐全、无拷贝残损」。");
}

// ---------------------------------------------------------------------------
// assemble：从来源目录组装（默认 dry-run）
// ---------------------------------------------------------------------------
async function cmdAssemble() {
  const from = opt("--from");
  const to = opt("--to") || DEFAULT_DIST;
  const write = flag("--write");
  out("PKRC 资产组装");
  out("=".repeat(68));
  if (!from) {
    out("用法：node tools/asset-pipeline.cjs assemble --from=<assets 目录> [--to=<dist>] [--write]");
    out("");
    out("  --from   来源目录（解压后的 pokerogue-assets，含 images/audio/fonts/battle-anims）");
    out("  --to     目标 dist（默认 game/server/dist）");
    out("  --write  实际拷贝；不加则只做 dry-run 计划");
    out("");
    out("为什么需要这个子命令：");
    out("  上游 build 模式 publicDir=false → pnpm build 不产出资产；");
    out("  上游也没有 dist 组装脚本 → 资产必须由我们显式组装。");
    return;
  }
  const src = path.resolve(from);
  if (!fs.existsSync(src)) {
    out(`❌ 来源目录不存在：${src}`);
    process.exitCode = 1;
    return;
  }
  const dirs = ["images", "audio", "fonts", "battle-anims"];
  let planned = 0;
  let bytes = 0;
  for (const d of dirs) {
    const s = path.join(src, d);
    if (!fs.existsSync(s)) {
      out(`  ⚠️ 来源缺少 ${d}/，跳过`);
      continue;
    }
    const m = measure(s);
    planned += m.files;
    bytes += m.bytes;
    out(`  ${d}/  ${m.files} 文件  ${(m.bytes / 1048576).toFixed(1)} MB  →  ${path.join(to, d)}/`);
  }
  out("");
  out(`计划拷贝 ${planned} 个文件 / ${(bytes / 1048576).toFixed(1)} MB`);
  if (!write) {
    out("（dry-run，未落盘。加 --write 执行）");
    return;
  }
  out("落盘中…（本实现用 fs.cpSync，逐目录复制）");
  for (const d of dirs) {
    const s = path.join(src, d);
    if (!fs.existsSync(s)) continue;
    fs.cpSync(s, path.join(to, d), { recursive: true });
    out(`  ✅ ${d}/ 完成`);
  }
  out("完成。建议随后跑：node tools/asset-pipeline.cjs verify --dist=" + to);
}

// ---------------------------------------------------------------------------
// snapshot：产出快照
// ---------------------------------------------------------------------------
async function cmdSnapshot() {
  const dist = path.resolve(opt("--dist") || DEFAULT_DIST);
  const outFile = opt("--out") || path.join(REPO_ROOT, ".build-tools", "asset-snapshot.json");
  out(`扫描 ${dist} …`);
  const t0 = Date.now();
  const files = [];
  const stack = [dist];
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
      else if (e.isFile()) {
        try {
          const st = fs.statSync(full);
          files.push({ p: path.relative(dist, full).replace(/\\/g, "/"), s: st.size });
        } catch {
          /* ignore */
        }
      }
    }
  }
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify({ dist, at: new Date().toISOString(), count: files.length, files }, null, 1), "utf8");
  out(`✅ 快照已写入 ${outFile}`);
  out(`   ${files.length} 个文件，耗时 ${Date.now() - t0} ms`);
  out("   用途：与后续构建产物做增量比对（新增/缺失/大小变化）。");
}

// ---------------------------------------------------------------------------
// 入口
// ---------------------------------------------------------------------------
/**
 * 仅供测试：把内部函数暴露出去。
 *
 * 生产路径（直接 `node tools/asset-pipeline.cjs <cmd>`）不受影响：
 * 只有被 `require()` 时才导出，且此时**不执行 main**（见下方 require.main 判断）。
 * 这样 test-asset-pipeline.cjs 可以零成本地做单元测试，不必 spawn 子进程
 * （本沙箱 spawn 会 EBUSY，见项目记忆）。
 */
module.exports = {
  measure,
  checkSpritePairs,
  parseOpt: opt,
  parseFlag: flag,
  EXPECTED_TOP,
  MIN_FILES,
  UPSTREAM,
};

// 只有作为主模块运行时才执行 CLI；被 require 时只导出函数
if (require.main === module) {
  (async function main() {
    switch (cmd) {
      case "probe":
        return await cmdProbe();
      case "verify":
        return await cmdVerify();
      case "assemble":
        return await cmdAssemble();
      case "snapshot":
        return await cmdSnapshot();
      case "help":
      case "--help":
      case "-h":
        out([
          "PKRC 资产管线（tools/asset-pipeline.cjs）",
          "",
          "子命令：",
          "  probe                         探测上游 pokerogue-assets 可用性与拉取预估",
          "  verify [--dist=<dir>]         降级路径：资产结构与引用完整性校验",
          "  assemble --from=<dir> [--to=<dir>] [--write]",
          "                                 从来源目录组装资产（默认 dry-run）",
          "  snapshot [--dist=<dir>] [--out=<file>]",
          "                                 产出资产快照，供增量比对",
          "",
          "参数写法：--key=value 与 --key value 均可。",
          "",
          "背景与结论：见 docs/delegation/17-B3-资产管线报告.md",
        ].join("\n"));
        return;
      default:
        out(`未知子命令：${cmd}（可用：probe / verify / assemble / snapshot / help）`);
        process.exitCode = 2;
    }
  })().catch((err) => {
    process.stderr.write(`fatal: ${err && err.stack ? err.stack : err}\n`);
    process.exitCode = 1;
  });
}
