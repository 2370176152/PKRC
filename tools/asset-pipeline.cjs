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
 * B-9 追加（第四阶段，2026-10-16）：
 *   merge      「构建产物 + 资产源」合并管线（默认 dry-run；--mode=replace|fill）
 *   manifest   产出 dist 清单 JSON（逐类文件数/字节/零字节 + 关键文件 SHA256；可 --compare 比对）
 *   verify     已**增强**：改为由 RESOURCE_CLASSES 表驱动，覆盖全部 14 类资源
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
const crypto = require("crypto");

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
// B-9 · 资源类表 —— 「构建产物 + 资产源」合并管线的契约
// ---------------------------------------------------------------------------
/**
 * `kind` 决定「这一类由谁提供」，是 merge 管线唯一的选源依据：
 *
 *   build —— vite 构建产出。文件名带内容 hash，**每次构建都变** → 必须来自构建产物。
 *   asset —— 来自 `pokerogue-assets` 子模块。构建期由
 *            `plugins/vite/vite-minify-json-plugin.ts` 把 `<root>/assets/**`
 *            拷进 `dist/**`（JSON 顺手 minify），`<root>/locales/**` 拷进
 *            `dist/locales/**`。
 *   mod   —— PKRC 魔改自有，上游与 assets 子模块都没有。
 *   both  —— 两边都可能有；优先取构建产物（更新鲜），退回资产源。
 *
 * ⚠️ 为什么不是 `publicDir`：
 *    上游 `vite.config.ts` 是 `publicDir: command === "serve" ? "assets" : false`
 *    —— build 模式**不**走 publicDir。真正把资产搬进 dist 的是上面那个插件
 *    （`apply: "build"` + `enforce: "post"`）。**这一条是 B-9 存在的全部理由**：
 *    本地 `assets/` 子模块是降级项（只拉了 2 个 masterlist），于是构建产物天然不完整，
 *    必须由本管线把「资产源」合并进来。
 *
 * ⚠️ 来源归属的**诚实标注**：
 *    `manifest.webmanifest` / `logo128.png` / `logo512.png` 归为 asset 是**推断**
 *    （本地 assets 子模块不完整，无法实证其属于该子模块）。反证：锚点树构建产物
 *    `dist/` 里**没有**这三个文件，而本地 `assets/` 里也没有 —— 一致。
 *    另注：原始 mod 仓库 `PKRC/game/server/dist/` 跟踪了 `manifest.webmanifest`
 *    `starter-colors.json` `service-worker.js` `exp-sprites.json` 但**未**跟踪 `logo*`。
 *
 * ⚠️⚠️ `locales` 的双源冲突（2026-10-16 实测，**必须提请决策**）：
 *
 *    上游插件把 `<root>/locales`（locales 子模块）minify 进 `dist/locales`；
 *    而 mod 发行版里那份 `dist/locales` 是**另一棵树**。实测差异：
 *
 *      | 来源 | 文件数 | 语言目录命名 |
 *      |---|---|---|
 *      | 构建产物（锚点 locales 子模块） | **1737** | `ca` / `es-419` …（上游 main 命名） |
 *      | 资产源（mod 发行版）            | **1138** | `ca-ES` / …（旧版上游命名） |
 *
 *    两者**语言目录名都不同**（`ca` vs `ca-ES`）⇒ 不是版本新旧问题，是**两套命名**。
 *    谁正确取决于「迁移后的代码找的是哪套 key」，这属于 **A4/A5 的功能等价判定**，
 *    不是后端能单方面决定的。
 *
 *    ⇒ 本管线的处置：**默认 prefer = 资产源**（= 保持当前发行版内容不变），
 *      并在 `merge` 时**大声告警**；要改成构建产物必须显式 `--locales-from=build`。
 *      这样 B-9 不会**静默**改变运行期内容（第四阶段的纪律：不引入未验证变更）。
 *
 * ---------------------------------------------------------------------------
 * 资源类表是**唯一事实源**：`verifyDist` 的 [1/6] 判定、`planMerge` 的取源策略、
 * `merge` 的合并后自检、以及 `release.cjs` 备份清单的 critical 范围，全部读它。
 * 字段：
 *   id / type(dir|file) / required / minFiles / minBytes / desc / reason
 *     —— 参与 verifyDist 的合格判定（缺失 / 空 / 文件数下限 / 字节下限 / 类型不符）
 *   kind: build | asset | mod | both
 *     —— **决定从哪一侧取源**：build = 构建产物；asset / mod = 资产源；both = 双源
 *   prefer（仅 both 类）—— 无显式覆盖时的默认取源侧
 *   sha256（可选，仅目录类）—— 是否纳入备份校验清单的 critical 范围；
 *     只标「体积小且不可再生」者（assets 构建产物 / pkrc 手工配置）。
 *     大资产（images/audio/battle-anims/fonts/locales）靠文件数+字节数判损伤。
 */
const RESOURCE_CLASSES = [
  {
    id: "assets",
    kind: "build",
    type: "dir",
    required: true,
    minFiles: 3,
    sha256: true, // 体积小且不可再生（每次构建都变）→ 入备份校验清单
    desc: "JS/CSS 构建产物（文件名带内容 hash）",
    reason: "每次构建都变，只能来自构建产物",
  },
  {
    id: "index.html",
    kind: "build",
    type: "file",
    required: true,
    minBytes: 500,
    desc: "入口页（引用 assets/ 下带 hash 的文件）",
    reason: "构建期生成，引用带 hash 的 bundle",
  },
  {
    id: "locales",
    kind: "both",
    type: "dir",
    required: true,
    minFiles: 100,
    // ⚠️ 保守默认 = 资产源。理由见下方「locales 的双源冲突」注释块。
    prefer: "asset",
    desc: "i18n JSON（构建期由 locales 子模块 minify 而来）",
    reason: "构建产物与资产源**结构性不同**（见文档 §locales 双源冲突），默认不替换运行期内容",
  },
  {
    id: "images",
    kind: "asset",
    type: "dir",
    required: true,
    minFiles: 1000,
    desc: "精灵贴图 / atlas / palette",
    reason: "assets 子模块内容，构建不生成",
  },
  {
    id: "audio",
    kind: "asset",
    type: "dir",
    required: true,
    minFiles: 100,
    desc: "BGM / 音效",
    reason: "assets 子模块内容，构建不生成",
  },
  {
    id: "battle-anims",
    kind: "asset",
    type: "dir",
    required: true,
    minFiles: 10,
    desc: "战斗动画 JSON",
    reason: "assets 子模块内容，构建不生成",
  },
  {
    id: "fonts",
    kind: "asset",
    type: "dir",
    required: true,
    minFiles: 2,
    desc: "字体",
    reason: "assets 子模块内容，构建不生成",
  },
  {
    id: "manifest.webmanifest",
    kind: "asset",
    type: "file",
    required: true,
    desc: "PWA manifest（引用 logo128 / logo512）",
    reason: "非构建产出（见上方「来源归属的诚实标注」）",
  },
  {
    id: "logo128.png",
    kind: "asset",
    type: "file",
    required: true,
    desc: "PWA 图标 128×128",
    reason: "同上",
  },
  {
    id: "logo512.png",
    kind: "asset",
    type: "file",
    required: true,
    desc: "PWA 图标 512×512",
    reason: "同上",
  },
  {
    id: "starter-colors.json",
    kind: "asset",
    type: "file",
    required: true,
    desc: "初始宝可梦配色表（运行时读取）",
    reason: "assets 子模块内容",
  },
  {
    id: "exp-sprites.json",
    kind: "asset",
    type: "file",
    required: true,
    desc: "经验条精灵坐标表（asset-tooling 产物）",
    reason: "assets 子模块内容",
  },
  {
    id: "service-worker.js",
    kind: "mod",
    type: "file",
    required: true,
    desc: "Service Worker（PKRC 自有，仅 install 钩子）",
    reason: "上游 assets 子模块与锚点树根都没有，属魔改自有",
  },
  {
    id: "pkrc",
    kind: "mod",
    type: "dir",
    required: true,
    minFiles: 1,
    sha256: true, // 手工配置（F-6/F-10 输入层依赖），体积小、不可再生 → 入备份校验清单
    desc: "PKRC 输入层配置（pkrc/config/input-config.json）",
    reason: "魔改自有，F-6/F-10 的输入层依赖它",
  },
];

/** 允许出现在 dist 根、但不属于任何资源类的文件（占位符与已知工具残留） */
const ALLOWED_EXTRA_TOP = [
  ".gitkeep", // 占位符（0 字节正常）
  "update-source-comments.py", // 已知上游工具脚本残留（B-3 已登记）
];

/**
 * **打包残留**：作者交付的压缩包被解压进 `dist/` 后没删掉的原件。
 *
 * 实证（B-16，2026-10-19）：`images/mingzuo.zip`（193,753 B）与
 * `images/mingzuo/`（7 张 PNG）在原始发行包 `PKRC.zip` 里**同时存在** ——
 * 作者把美术交付的压缩包解压后忘了删原件。运行期只按 `images/mingzuo/*.png`
 * 取图，**整个 dist 的 js/json/html/css 里搜不到 `mingzuo` 这个字符串**，
 * 故压缩包是纯残留。
 *
 * ⚠️ 为什么要在**合并期**处理而不只是删一次：
 *    E-5（A5-01b）会从同一个发行包重新并资产 ⇒ 只删一次等于没删，
 *    下次发布会把它带回来。故 planMerge/runMergePlan 侧做过滤。
 */
const PACKAGING_RESIDUE_RE = /\.(zip|rar|7z|psd|bak|old|orig|tmp|swp)$/i;

/** 递归找打包残留（相对路径数组） */
function findResidue(root) {
  const hits = [];
  const stack = [""];
  while (stack.length) {
    const rel = stack.pop();
    const dir = rel ? path.join(root, rel) : root;
    let ents;
    try {
      ents = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of ents) {
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) stack.push(r);
      else if (e.isFile() && PACKAGING_RESIDUE_RE.test(e.name)) hits.push(r);
    }
  }
  return hits.sort();
}

/**
 * 删除打包残留（在合并产物上执行）。
 *
 * 判定比 `findResidue()` 更宽一档（B-14 演练暴露的第二类残渣）：
 *   ② **零字节 + 无扩展名** 的文件。
 *   实证：原始发行包 `PKRC.zip` 的 `server/dist/images/pokemon/**` 下有 18 个
 *   0 字节、无扩展名、文件名为中文的文件（`1这里正` / `这里背` / `1这里背` …）。
 *   判定依据两条同时成立：① 加载器按 `{id}.png` 精确匹配 ⇒ 无扩展名文件永不被加载；
 *                          ② 0 字节 ⇒ 不含任何数据。⇒ 必然是作者拷贝事故的残渣。
 *
 *   ⚠️ 为什么**只在这里**放宽、而不改 `findResidue()`：
 *      `findResidue()` 供 `verifyDist` 报告用，那里零字节文件要作为**失败项**暴露
 *      （`zeroReal`），不能降级成"可自动清理的残留"。职责分开：
 *      **verify 负责把问题顶出来，merge 负责把能安全清掉的清掉。**
 *
 * @returns {string[]} 被删除的相对路径
 */
function pruneResidue(root, logFn) {
  const hits = findResidue(root);
  const removed = [];
  const seen = new Set(hits);

  // 追加：零字节 + 无扩展名（排除 .gitkeep 占位符）
  const stack = [""];
  while (stack.length) {
    const rel = stack.pop();
    const dir = rel ? path.join(root, rel) : root;
    let ents;
    try {
      ents = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of ents) {
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) {
        stack.push(r);
        continue;
      }
      if (!e.isFile() || seen.has(r)) continue;
      if (e.name === ".gitkeep") continue;
      if (/\.[a-z0-9]+$/i.test(e.name)) continue; // 有扩展名 → 交给 verify 判
      let size = -1;
      try {
        size = fs.statSync(path.join(root, r)).size;
      } catch {
        continue;
      }
      if (size === 0) {
        hits.push(r);
        seen.add(r);
      }
    }
  }

  hits.sort();
  for (const rel of hits) {
    try {
      fs.rmSync(path.join(root, rel), { force: true });
      removed.push(rel);
      if (logFn) logFn(`  🧹 剔除打包残留 ${rel}`);
    } catch (err) {
      if (logFn) logFn(`  ⚠️ 剔除失败 ${rel}：${err.message}`);
    }
  }
  return removed;
}

/**
 * locales 语言目录**别名表**：mod 发行版命名 → 上游现行命名。
 *
 * 依据（不是猜的）：锚点树 `src/i18n.ts` 的 `supportedLngs` 明确列的是
 * `zh-Hans` / `zh-Hant` / `ca`，而语言的设置项
 * （`src/system/settings/settings-language.ts`）也是
 * `changeLocaleHandler("zh-Hans")` / `("zh-Hant")`。
 * 而 mod 发行的 locales 目录是 `zh-CN` / `zh-TW` / `ca-ES`。
 *
 * ⇒ 这三对是**同一语言在两套命名下的名字**，不是不同语言。
 *   只有实测确认的才放进这张表 —— 不做猜测性映射。
 */
const LOCALE_ALIAS = {
  "zh-CN": "zh-Hans",
  "zh-TW": "zh-Hant",
  "ca-ES": "ca",
};

/** 按 id 取资源类定义 */
function classSpec(id) {
  for (const c of RESOURCE_CLASSES) if (c.id === id) return c;
  return null;
}

/**
 * 统计某一个资源类在给定根目录下的实际规模。
 * 文件类与目录类分开处理：对文件调 `measure()` 会因 `readdirSync` 抛错而返回 0。
 *
 * @param {string} root   dist 根目录
 * @param {object} spec   RESOURCE_CLASSES 的一项
 * @returns {{present:boolean, files:number, bytes:number, zero:number, ok:boolean, failReason:string|null}}
 */
function measureClass(root, spec) {
  const full = path.join(root, spec.id);
  if (!fs.existsSync(full)) {
    return { present: false, files: 0, bytes: 0, zero: 0, ok: false, failReason: "缺失" };
  }
  let files = 0;
  let bytes = 0;
  let zero = 0;
  if (spec.type === "file") {
    let st;
    try {
      st = fs.statSync(full);
    } catch (err) {
      return { present: false, files: 0, bytes: 0, zero: 0, ok: false, failReason: `stat 失败：${err.message}` };
    }
    if (!st.isFile()) {
      return { present: true, files: 0, bytes: 0, zero: 0, ok: false, failReason: "类型不符（期望文件）" };
    }
    files = 1;
    bytes = st.size;
    zero = st.size === 0 ? 1 : 0;
  } else {
    const m = measure(full);
    files = m.files;
    bytes = m.bytes;
    zero = m.zero.length;
  }

  let ok = true;
  let failReason = null;
  if (files === 0) {
    ok = false;
    failReason = "存在但为空";
  } else if (spec.type === "file" && bytes === 0) {
    // 单个文件类出现零字节 = 明确的损伤（拷贝事故的典型痕迹），直接判不合格
    ok = false;
    failReason = "零字节文件";
  } else if (spec.type === "dir" && Number.isFinite(spec.minFiles) && files < spec.minFiles) {
    ok = false;
    failReason = `文件数 ${files} < 下限 ${spec.minFiles}（半成品）`;
  } else if (spec.type === "file" && Number.isFinite(spec.minBytes) && bytes < spec.minBytes) {
    ok = false;
    failReason = `字节数 ${bytes} < 下限 ${spec.minBytes}（疑似截断）`;
  }
  return { present: true, files, bytes, zero, ok, failReason };
}


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

/**
 * 结构化完整性校验（B-7 发布门禁的进程内入口）。
 *
 * 为什么把「算」与「打印」分开：
 *   release.cjs 必须在**不 spawn 子进程**的前提下复用同一套判据
 *   （本沙箱 spawn 可执行文件会 EBUSY，见项目记忆）。把判据抽成纯函数，
 *   人读的 `verify` 子命令与机器读的发布门禁就**不可能漂移**。
 *   —— 「同一件事有两个实现」是本项目反复踩过的坑，此处从结构上避免。
 *
 * @param {string} dist
 * @param {object} [opts]
 * @param {boolean} [opts.atlas=true] 是否做 atlas 依赖扫描。发布门禁可关掉它 ——
 *        它要解析 1.3 万个 JSON（约 1 分钟），而结论**从不参与失败判定**
 *        （B-3 已定性为上游自身缺口），放在发布的关键路径上纯属浪费时间。
 * @returns {object} 结构化结果；`failures` 为空即通过
 */
function verifyDist(dist, opts = {}) {
  const doAtlas = opts.atlas !== false;
  const r = {
    ok: false,
    dist,
    exists: fs.existsSync(dist),
    classes: [],
    classesBad: [],
    refs: { ok: [], missing: [], zero: [], manifestMissing: [], manifestError: null },
    zeroReal: [],
    zeroPlaceholders: 0,
    atlas: null,
    extras: [],
    residue: [],
    totals: { files: 0, bytes: 0 },
    failures: [],
  };
  if (!r.exists) {
    r.failures.push(`目录不存在：${dist}`);
    return r;
  }

  // ① 14 类资源（表驱动）
  for (const spec of RESOURCE_CLASSES) {
    const m = measureClass(dist, spec);
    r.classes.push({
      id: spec.id,
      kind: spec.kind,
      type: spec.type,
      files: m.files,
      bytes: m.bytes,
      zero: m.zero,
      ok: m.ok,
      failReason: m.failReason,
    });
    if (!m.ok) {
      r.classesBad.push(spec.id);
      r.failures.push(`${spec.id}（${spec.kind}）：${m.failReason}`);
    }
  }

  // ② index.html / manifest 的字面量引用
  const indexHtml = path.join(dist, "index.html");
  if (!fs.existsSync(indexHtml)) {
    r.failures.push("缺少 index.html");
  } else {
    const html = fs.readFileSync(indexHtml, "utf8");
    const refs = new Set();
    for (const m of html.matchAll(/(?:src|href)="(\.\/[^"]+)"/g)) refs.add(m[1].replace(/^\.\//, ""));
    for (const m of html.matchAll(/url\('(\.\/[^']+)'\)/g)) refs.add(m[1].replace(/^\.\//, ""));
    for (const ref of refs) {
      const f = path.join(dist, ref);
      if (!fs.existsSync(f)) {
        r.refs.missing.push(ref);
        r.failures.push(`index.html 引用不存在：${ref}`);
      } else if (fs.statSync(f).size === 0) {
        r.refs.zero.push(ref);
        r.failures.push(`index.html 引用为零字节：${ref}`);
      } else {
        r.refs.ok.push(ref);
      }
    }
    const manifestPath = path.join(dist, "manifest.webmanifest");
    if (fs.existsSync(manifestPath)) {
      try {
        const man = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
        for (const icon of man.icons || []) {
          if (!fs.existsSync(path.join(dist, icon.src))) {
            r.refs.manifestMissing.push(icon.src);
            r.failures.push(`manifest 引用不存在：${icon.src}`);
          }
        }
      } catch (err) {
        r.refs.manifestError = err.message;
        r.failures.push(`manifest.webmanifest 解析失败：${err.message}`);
      }
    }
  }

  // ③ 零字节文件
  const all = measure(dist);
  r.totals = { files: all.files, bytes: all.bytes };
  r.zeroReal = all.zero.filter((z) => path.basename(z) !== ".gitkeep");
  r.zeroPlaceholders = all.zero.length - r.zeroReal.length;
  if (r.zeroReal.length) {
    r.failures.push(`发现 ${r.zeroReal.length} 个零字节文件`);
  }

  // ④ atlas 依赖（只报告不计失败）
  r.atlas = doAtlas ? checkSpritePairs(path.join(dist, "images", "pokemon")) : null;
  r.atlasSkipped = !doAtlas;

  // ⑤ 顶层异常文件（只报告不计失败）
  const allowed = new Set(ALLOWED_EXTRA_TOP.concat(RESOURCE_CLASSES.filter((c) => c.type === "file").map((c) => c.id)));
  for (const e of fs.readdirSync(dist, { withFileTypes: true })) {
    if (e.isFile() && !allowed.has(e.name)) r.extras.push(e.name);
  }

  r.ok = r.failures.length === 0;

  // ⑥ 打包残留（**只报告不计失败**）：作者交付包解压后遗留的 .zip/.psd/…
  //    运行期从不引用它们，属整洁性问题而非功能问题 —— 故不做成失败项，
  //    但必须让它可见（否则「校验通过」会掩盖一堆垃圾文件）。
  r.residue = findResidue(dist);

  return r;
}

async function cmdVerify() {
  const dist = path.resolve(opt("--dist") || DEFAULT_DIST);
  out("PKRC 资产完整性校验（降级路径）");
  out("=".repeat(68));
  out(`目标目录：${dist}`);
  out("");

  const r = verifyDist(dist);
  if (!r.exists) {
    out(`❌ 目录不存在：${dist}`);
    process.exitCode = 1;
    return;
  }

  // ① 顶层资源类（B-9：由 RESOURCE_CLASSES 表驱动，覆盖全部 14 类）
  //
  // 为什么不再用写死的 EXPECTED_TOP：那只有 6 个目录，会漏掉
  // pkrc / logo* / manifest.webmanifest / starter-colors.json / exp-sprites.json
  // / service-worker.js —— 而这几个恰恰是 A5-01 §2.4 限制 #1 点名要求「就位」的。
  // 一个漏检的校验器比没有校验器更危险（会给出虚假的「通过」）。
  out("[1/6] 顶层资源类（RESOURCE_CLASSES 表驱动）");
  for (const c of r.classes) {
    if (!c.ok) out(`  ❌ ${c.id}（${c.kind}）：${c.failReason}`);
    else {
      const size = c.type === "dir" ? `${c.files} 文件  ${(c.bytes / 1048576).toFixed(1)} MB` : `${c.bytes} B`;
      out(`  ✅ ${c.id.padEnd(24)} ${c.kind.padEnd(6)} ${size}`);
    }
  }
  out(`  —— ${r.classes.length} 类中 ${r.classes.length - r.classesBad.length} 类就位`);

  // ② 静态字面量引用
  out("[2/6] 静态字面量引用（index.html / manifest.webmanifest）");
  for (const ref of r.refs.ok) out(`  ✅ ${ref}`);
  for (const m of r.refs.missing) out(`  ❌ index.html 引用不存在：${m}`);
  for (const z of r.refs.zero) out(`  ❌ index.html 引用为零字节：${z}`);
  for (const m of r.refs.manifestMissing) out(`  ❌ manifest 引用不存在：${m}`);
  if (r.refs.manifestError) out(`  ❌ manifest.webmanifest 解析失败：${r.refs.manifestError}`);

  // ③ 零字节文件（资产拷贝不完整的典型信号）
  //
  // ⚠️ 必须把「目录」与「文件」分开：`readdirSync` 会同时返回二者，
  //    而很多排查命令（如 `find -size 0`）会把目录也算成 0 字节，
  //    从而把 `female/`、`shiny/` 这类正常子目录误报成空文件。
  //    `measure()` 用 `withFileTypes` 只统计 `isFile()`，这里保持不变。
  //
  // `.gitkeep` 是**有意为之**的占位符（0 字节正常），单独放行，不计入告警。
  out("[3/6] 零字节文件检测");
  if (r.zeroReal.length === 0) {
    out(`  ✅ 无异常零字节文件${r.zeroPlaceholders ? `（已放行 ${r.zeroPlaceholders} 个占位符 .gitkeep）` : ""}`);
  } else {
    const other = r.zeroReal.filter((z) => /[\u4e00-\u9fa5]/u.test(path.basename(z)));
    out(`  ❌ 发现 ${r.zeroReal.length} 个零字节文件（拷贝/解包事故的痕迹，前 8）：`);
    for (const z of r.zeroReal.slice(0, 8)) out(`       ${path.relative(dist, z)}`);
    if (r.zeroReal.length > 8) out(`       …… 另有 ${r.zeroReal.length - 8} 个`);
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
  const pair = r.atlas;
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
  if (r.extras.length === 0) out("  ✅ 无异常文件");
  else {
    out(`  ⚠️ ${r.extras.length} 个非预期顶层文件（建议构建时排除）：`);
    for (const u of r.extras) out(`       ${u}`);
  }
  // 打包残留（B-16）：只报告不计失败 —— 运行期从不引用，属整洁性问题
  if (r.residue && r.residue.length) {
    out(`  ⚠️ ${r.residue.length} 个打包残留（作者交付包解压后未删的原件，建议剔除）：`);
    for (const u of r.residue) out(`       ${u}`);
    out("       ⇒ `merge` 会默认剔除；`--keep-residue` 可关闭");
  } else {
    out("  ✅ 无打包残留（.zip/.psd/.bak/…）");
  }

  // ⑥ 汇总
  out("[6/6] 汇总");
  out(`  文件总数：${r.totals.files}`);
  out(`  总字节数：${(r.totals.bytes / 1048576).toFixed(1)} MB`);
  out("");
  if (r.ok) out("✅ 资产结构与引用完整性校验通过（降级路径）。");
  else {
    out(`❌ ${r.failures.length} 项未通过。`);
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
// B-9 · merge：「构建产物 + 资产源」合并管线
// ---------------------------------------------------------------------------
/**
 * 两种模式，语义严格不同：
 *
 *   --mode=replace（默认）—— 组装一份**新的** dist（B-7 发布脚本的组装步）
 *     · 每个类都从「该类的来源根」整份覆盖到目标
 *     · 目录类**先删后拷**：`assets/` 的文件名带 hash，不删会残留旧 hash，
 *       导致 `index.html` 引用与磁盘内容不一致、排查困难
 *     · 护栏：目标已存在且非空时必须显式 `--force-replace`
 *       （防止误把运行中的 dist 当暂存目录）
 *
 *   --mode=fill —— **就地补全**（A5-01b 的资源补全步）
 *     · 只补**缺失**的文件，**从不覆盖、从不删除** → 天然幂等、无需回滚
 *     · 只处理 kind 为 asset / mod 的类；`build` 类（assets/ index.html）拒绝，
 *       因为构建产物必须来自构建，不能靠拷贝
 *     · 资产源缺省 = 目标自身（就地自查自补）
 *
 * 默认 dry-run；要落盘必须显式 `--commit`。这与 B-3 `assemble` 的约定一致：
 * 破坏性工具必须「显式确认」。
 */
/**
 * 合并计划 —— **选源策略的唯一实现**（纯函数：不打印、不落盘、不设 exitCode）。
 *
 * 为什么要抽出来：B-7 发布脚本必须在**不 spawn 子进程**的前提下复用同一套策略
 * （沙箱 spawn 可执行文件会 EBUSY）。若 release.cjs 自己再写一份「哪类从哪来」，
 * 两份实现必然漂移 —— 而漂移的后果是「发布产物与校验产物不是同一套规则」，
 * 这是最难查的一类问题。所以策略只有这一份，`merge` 子命令与 `release.cjs` 都调它。
 *
 * @param {object} opts
 * @param {string} opts.to
 * @param {"replace"|"fill"} opts.mode
 * @param {string|null} [opts.buildDir]
 * @param {string|null} [opts.assetSrc]   fill 模式缺省 = to（就地）
 * @param {string|null} [opts.localesFrom] "build"|"asset"|"union"|null
 * @param {string} [opts.localeConflict]  "overlay"|"base"
 * @param {boolean} [opts.forceReplace]
 * @param {string[]|null} [opts.only]
 * @returns {{to:string, mode:string, buildDir:string|null, assetSrc:string|null,
 *            localesFrom:string|null, localeConflict:string,
 *            selected:object[], plan:object[], errors:string[], warnings:string[]}}
 */
function planMerge(opts) {
  const to = path.resolve(opts.to);
  const mode = opts.mode;
  const buildDir = opts.buildDir ? path.resolve(opts.buildDir) : null;
  const assetSrc = opts.assetSrc ? path.resolve(opts.assetSrc) : mode === "fill" ? to : null;
  const localesFrom = opts.localesFrom ? String(opts.localesFrom).toLowerCase() : null;
  const localeConflict = opts.localeConflict ? String(opts.localeConflict).toLowerCase() : "overlay";
  const forceReplace = !!opts.forceReplace;
  const only = opts.only || null;

  const errors = [];
  const warnings = [];
  const fail = (m) => errors.push(m);

  if (mode !== "replace" && mode !== "fill") {
    fail(`未知模式：${mode}（可用 replace / fill）`);
    return { to, mode, buildDir, assetSrc, localesFrom, localeConflict, selected: [], plan: [], errors, warnings };
  }
  if (localesFrom && !["build", "asset", "union"].includes(localesFrom)) {
    fail(`localesFrom 只能是 build / asset / union（收到 ${localesFrom}）`);
  }
  if (!["overlay", "base"].includes(localeConflict)) {
    fail(`localeConflict 只能是 overlay / base（收到 ${localeConflict}）`);
  }

  // ---- 预检 --------------------------------------------------------------
  if (mode === "replace") {
    if (!buildDir) fail("--mode=replace 必须给 --build-dir=<构建产物目录>");
    else if (!fs.existsSync(path.join(buildDir, "index.html"))) fail(`--build-dir 缺少 index.html：${buildDir}`);
    else if (!fs.existsSync(path.join(buildDir, "assets"))) fail(`--build-dir 缺少 assets/：${buildDir}`);
    if (!assetSrc) fail("--mode=replace 必须给 --asset-source=<资产源目录>");
    if (assetSrc && !fs.existsSync(assetSrc)) fail(`--asset-source 不存在：${assetSrc}`);
    if (fs.existsSync(to)) {
      let population = 0;
      try {
        population = fs.readdirSync(to).length;
      } catch {
        /* ignore */
      }
      if (population > 0 && !forceReplace) {
        fail(
          `目标已存在且非空（${population} 项）：${to}\n` +
            "    replace 模式会**删除并整体覆盖**目录类。若确认这就是暂存目录，请加 --force-replace；\n" +
            "    若想就地补全现有 dist，请改用 --mode=fill。",
        );
      }
    }
  } else {
    if (!fs.existsSync(to)) fail(`--mode=fill 的目标必须已存在：${to}`);
    if (assetSrc && !fs.existsSync(assetSrc)) fail(`--asset-source 不存在：${assetSrc}`);
    if (buildDir) fail("--mode=fill 不接受 --build-dir（构建产物必须经由构建产出，不能拷贝补全）");
  }

  const selected = RESOURCE_CLASSES.filter((c) => (only ? only.includes(c.id) : true));
  if (only) {
    const unknown = only.filter((id) => !classSpec(id));
    if (unknown.length) fail(`--only 含未知资源类：${unknown.join(", ")}`);
  }
  if (only && mode === "fill") {
    const buildIds = selected.filter((c) => c.kind === "build").map((c) => c.id);
    if (buildIds.length) fail(`--mode=fill 不能处理构建产物类：${buildIds.join(", ")}`);
  }

  // ---- 制定计划 ----------------------------------------------------------
  const plan = [];
  for (const spec of selected) {
    const row = { id: spec.id, kind: spec.kind, type: spec.type, desc: spec.desc };

    if (mode === "fill" && spec.kind === "build") {
      row.action = "reject";
      row.note = "构建产物，fill 模式不处理";
      plan.push(row);
      continue;
    }
    if (mode === "fill" && spec.kind === "both") {
      row.action = "reject";
      row.note = "构建产物优先，fill 模式不处理";
      plan.push(row);
      continue;
    }

    // 选源根
    let srcRoot = null;
    if (spec.kind === "build") srcRoot = buildDir;
    else if (spec.kind === "asset" || spec.kind === "mod") srcRoot = assetSrc;
    else if (spec.kind === "both") {
      // 双源类（目前只有 locales）：由 spec.prefer + 显式覆盖决定
      const override = spec.id === "locales" ? localesFrom : null;
      const prefer = override || spec.prefer || "build";
      const buildHas = !!buildDir && fs.existsSync(path.join(buildDir, spec.id));
      const assetHas = !!assetSrc && fs.existsSync(path.join(assetSrc, spec.id));
      srcRoot = prefer === "asset" ? (assetHas ? assetSrc : buildHas ? buildDir : null) : buildHas ? buildDir : assetHas ? assetSrc : null;
      row.sourceChoice = prefer;
      row.bothAvailable = buildHas && assetHas;
    }

    row.srcRoot = srcRoot;
    if (!srcRoot) {
      row.action = "missing-source";
      row.note = "未提供来源根";
      plan.push(row);
      continue;
    }
    const srcPath = path.join(srcRoot, spec.id);
    const dstPath = path.join(to, spec.id);
    row.src = srcPath;
    row.dst = dstPath;

    if (!fs.existsSync(srcPath)) {
      row.action = "missing-source";
      row.note = "来源根下不存在";
      plan.push(row);
      continue;
    }
    // 同路径（就地补全：源=目标）→ 无可做
    if (path.resolve(srcPath) === path.resolve(dstPath)) {
      row.action = "same-path";
      row.note = "源与目标同一路径（就地模式）";
      plan.push(row);
      continue;
    }
    row.action = mode === "replace" ? "replace" : "fill";

    // locales + union：不是「拷贝某一个源」，而是「两源合成」
    if (spec.id === "locales" && localesFrom === "union") {
      if (mode === "fill") {
        row.action = "reject";
        row.note = "union 需要写整棵树，fill 模式不处理";
      } else if (!buildDir || !assetSrc) {
        row.action = "missing-source";
        row.note = "union 需要同时提供 --build-dir 与 --asset-source";
      } else {
        row.action = "union";
        row.src = path.join(buildDir, spec.id) + "  ⊕  " + path.join(assetSrc, spec.id);
        row.dst = path.join(to, spec.id);
        row.note = "基座=构建产物，overlay=资产源，key 级并集";
      }
    }

    // 双源类的**结构性告警**：不做静默替换。
    if (row.bothAvailable && row.sourceChoice === "asset" && !localesFrom) {
      const dl = compareLocaleTrees(path.join(buildDir, spec.id), path.join(assetSrc, spec.id));
      if (dl.differs) {
        warnings.push(
          `${spec.id} 在「构建产物」与「资产源」两处**结构不同** → 本次采用【资产源】（保持发行版现状）。\n` +
            `      构建产物：${dl.buildFiles} 文件，语言目录 ${dl.buildLangs} 个（${dl.buildSample}）\n` +
            `      资产源　：${dl.assetFiles} 文件，语言目录 ${dl.assetLangs} 个（${dl.assetSample}）\n` +
            `      仅构建产物有：${dl.onlyBuildLangs.join(", ") || "（无）"}\n` +
            `      仅资产源有　：${dl.onlyAssetLangs.join(", ") || "（无）"}\n` +
            `      ⇒ 两棵树**都不完整**（详见 docs/sourcemigration/B-9-资源补全管线.md §locales）。\n` +
            `        当前代码来自锚点，supportedLngs 用的是 ${dl.buildLangs} 个目录那套命名；\n` +
            `        而 mod 自有文本（talent* 等命名空间与上千条 key）只在资产源里。\n` +
            `        推荐：--locales-from=union（基座=构建产物 + overlay=资产源，key 级并集）\n` +
            `        该选择会**改变运行期内容**，须由 A4/A5 裁定并留走查证据。`,
        );
      }
    }
    plan.push(row);
  }

  return { to, mode, buildDir, assetSrc, localesFrom, localeConflict, selected, plan, errors, warnings };
}

/**
 * 执行合并计划（落盘）。与 `planMerge` 分离，便于「同一计划被两个入口执行」。
 *
 * @param {ReturnType<typeof planMerge>} pre
 * @param {object} [o]
 * @param {boolean} [o.commit]
 * @param {(msg:string)=>void} [o.log]
 * @param {boolean} [o.selfCheck=true]
 *   合并后是否自检「本次选中的类是否就位」。
 *   `cmdMerge` 需要它（那是它唯一的合格判定）；
 *   `release.cjs` **关掉它**，因为发布流程由步骤 ③ 的 `verifyDist` 统一判定，
 *   否则「类不全」会在两步各报一次，且 ③ 会被 ② 提前掐断。
 *   关掉后 `failed` 只剩一个含义：**某个拷贝真的抛错了**。
 * @returns {{done:Array<object>, check:Array<object>|null, failed:boolean}}
 */
function runMergePlan(pre, o = {}) {
  const log = o.log || (() => {});
  const commit = !!o.commit;
  const selfCheck = o.selfCheck !== false; // 默认开，保持既有行为
  const done = [];
  let failed = false;

  for (const r of pre.plan) {
    if (r.action !== "replace" && r.action !== "fill" && r.action !== "union") continue;
    if (!commit) {
      done.push({ id: r.id, action: r.action, applied: false });
      continue;
    }
    try {
      if (r.action === "replace") {
        fs.rmSync(r.dst, { recursive: true, force: true });
        fs.mkdirSync(path.dirname(r.dst), { recursive: true });
        fs.cpSync(r.src, r.dst, { recursive: true });
        done.push({ id: r.id, action: "replace", applied: true });
        log(`  ✅ ${r.id} 已覆盖`);
      } else if (r.action === "union") {
        const stats = unionLocales(path.join(pre.buildDir, r.id), path.join(pre.assetSrc, r.id), r.dst, {
          conflict: pre.localeConflict,
        });
        done.push({ id: r.id, action: "union", applied: true, stats });
        log(`  ✅ ${r.id} 并集完成：${stats.langs} 语言 / ${stats.files} 文件`);
        log(`     基座侧独有 key 补入 ${stats.fromBase} 条；overlay（mod）侧独有 key 补入 ${stats.fromOverlay} 条`);
        log(`     两侧同 key 不同值 ${stats.conflicts} 处 → 【${stats.conflictWinner === "overlay" ? "保留 mod 文本" : "采用上游文案"}】`);
      } else {
        const added = copyMissing(r.src, r.dst);
        done.push({ id: r.id, action: "fill", applied: true, added });
        log(`  ✅ ${r.id} 补齐 ${added} 个缺失文件`);
      }
    } catch (err) {
      done.push({ id: r.id, action: r.action, applied: false, error: err.message });
      log(`  ❌ ${r.id} 失败：${err.message}`);
      failed = true;
    }
  }

  let check = null;
  if (selfCheck && commit && fs.existsSync(pre.to)) {
    check = pre.selected.map((spec) => {
      const m = measureClass(pre.to, spec);
      return { id: spec.id, ok: m.ok, files: m.files, failReason: m.failReason };
    });
    if (check.some((c) => !c.ok)) failed = true;
  }

  // 打包残留过滤（**显式 opt-in**：`o.pruneResidue === true`，不做隐式删除）
  //   B-16 实证：E-5 会从同一个发行包重新并资产 ⇒ 只删一次等于没删。
  let residue = [];
  if (o.pruneResidue === true && commit && fs.existsSync(pre.to)) {
    residue = pruneResidue(pre.to, log);
    if (residue.length) done.push({ id: "(packaging-residue)", action: "prune", removed: residue });
  }

  return { done, check, failed, residue };
}

async function cmdMerge() {
  const toRaw = opt("--to") || DEFAULT_DIST;
  const modeRaw = (opt("--mode") || (flag("--fill") ? "fill" : "replace")).toLowerCase();
  const commit = flag("--commit");
  const wantJson = flag("--json");
  const onlyRaw = opt("--only");
  const only = onlyRaw
    ? onlyRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : null;
  const assetSrcRaw = opt("--asset-source");

  // 计划与执行分离：策略由 planMerge 唯一实现（release.cjs 复用同一份）
  const pre = planMerge({
    to: toRaw,
    mode: modeRaw,
    buildDir: opt("--build-dir"),
    assetSrc: assetSrcRaw,
    localesFrom: opt("--locales-from"),
    localeConflict: opt("--locale-conflict"),
    forceReplace: flag("--force-replace"),
    only,
  });
  const to = pre.to;
  const buildDir = pre.buildDir;
  const assetSrc = pre.assetSrc;
  const errors = pre.errors;
  const warnings = pre.warnings;
  const selected = pre.selected;
  const plan = pre.plan;

  // ---- 输出计划 ----------------------------------------------------------
  if (!wantJson) {
    out("PKRC 资源合并管线（B-9）");
    out("=".repeat(68));
    out(`目标：${to}`);
    out(`模式：${modeRaw}${commit ? "（--commit，将落盘）" : "（dry-run）"}`);
    if (buildDir) out(`构建产物：${buildDir}`);
    if (assetSrc) out(`资产源：${assetSrc}${!assetSrcRaw && modeRaw === "fill" ? "（缺省=目标自身）" : ""}`);
    out("");
  }
  if (errors.length) {
    if (!wantJson) {
      out("❌ 预检未通过：");
      for (const e of errors) out(`   · ${e}`);
    } else {
      out(JSON.stringify({ ok: false, mode: modeRaw, error: "preflight", errors }, null, 2));
    }
    process.exitCode = 2;
    return;
  }

  if (!wantJson) {
    out("计划：");
    for (const r of plan) {
      const tag =
        r.action === "same-path"
          ? "＝ 就地（源即目标）"
          : r.action === "missing-source"
            ? "⚠ 无来源"
            : r.action === "reject"
              ? "— 跳过"
              : r.action === "replace"
                ? "→ 整体覆盖"
                : r.action === "union"
                  ? "⊕ 两源并集"
                  : "＋ 仅补缺失";
      out(`  ${r.id.padEnd(22)} ${tag.padEnd(18)} ${r.note || ""}${r.sourceChoice ? `  [源=${r.sourceChoice}]` : ""}`);
    }
    out("");
    if (warnings.length) {
      out("⚠️ 告警（不中止，但必须由人裁定）：");
      for (const w of warnings) out(`  · ${w}`);
      out("");
    }
  }

  // ---- 执行 --------------------------------------------------------------
  // 执行逻辑由 runMergePlan 唯一实现（release.cjs 复用同一份）
  // `pruneResidue` 默认开（B-16）：剔除 .zip/.psd 等打包残留；`--keep-residue` 关闭
  const exec = runMergePlan(pre, {
    commit,
    log: wantJson ? null : (m) => out(m),
    pruneResidue: !flag("--keep-residue"),
  });
  const done = exec.done;
  if (exec.failed) process.exitCode = 1;

  // ---- 合并后自检 --------------------------------------------------------
  // ⚠️ 只自检**本次选中**的类：带 --only 时若仍按全表报「缺失」，会把
  //    「你本来就没让它处理」误报成「合并失败」。范围外的类单独说明。
  const check = exec.check;
  const outOfScope = RESOURCE_CLASSES.filter((c) => !selected.includes(c)).map((c) => c.id);
  if (check && !wantJson) {
    const bad = check.filter((c) => !c.ok);
    out("");
    out(`合并后自检（本次选中 ${check.length} 类）：${check.length - bad.length}/${check.length} 类就位`);
    for (const b of bad) out(`  ❌ ${b.id}：${b.failReason}`);
    if (outOfScope.length) out(`  ℹ️ 范围外未检查：${outOfScope.join(", ")}`);
    if (bad.length) {
      out("  ℹ️ 缺的类若属于「资产源本身没有」，说明资产源不完整 —— 需先补资产源。");
    }
  }

  if (wantJson) {
    out(
      JSON.stringify(
        {
          ok: errors.length === 0 && (process.exitCode || 0) === 0,
          mode: modeRaw,
          commit,
          to,
          selected: selected.map((c) => c.id),
          outOfScope,
          warnings,
          plan,
          done,
          check,
        },
        null,
        2,
      ),
    );
  } else {
    out("");
    if (!commit) out("（dry-run，未落盘。加 --commit 执行）");
    // 就地模式的实用提示：缺省源 = 目标自身 ⇒ 永远没有可补的东西，
    // 只能当「自检」。要真补，必须给一个**另一份**资产源（如原始 mod 发行目录）。
    if (modeRaw === "fill" && !assetSrcRaw) {
      out("ℹ️ fill 模式未给 --asset-source：源=目标自身，只能自检、无从补起。");
      out("   要真正补全，请指向**另一份**资产源，例如原始发行目录：");
      out("   --asset-source=<含 images/audio/fonts/... 的目录>");
    }
  }
}

/**
 * 比较两棵 locales 树的**结构**（不比对内容）。
 *
 * 只取「文件数 + 顶层语言目录名集合」两个维度 —— 这正是实测发现的差异所在
 * （1737 文件 / `ca` vs 1138 文件 / `ca-ES`）。逐文件 diff 会淹没在
 * minify 与行尾差异里，反而看不清「两套命名」这个真正的问题。
 *
 * @returns {{differs:boolean, buildFiles:number, assetFiles:number,
 *            buildLangs:number, assetLangs:number,
 *            onlyBuildLangs:string[], onlyAssetLangs:string[],
 *            buildSample:string, assetSample:string}}
 */
function compareLocaleTrees(buildLocales, assetLocales) {
  const langs = (root) => {
    if (!fs.existsSync(root)) return [];
    return fs
      .readdirSync(root, { withFileTypes: true })
      .filter((e) => e.isDirectory() && !e.name.startsWith("."))
      .map((e) => e.name)
      .sort();
  };
  const bl = langs(buildLocales);
  const al = langs(assetLocales);
  const bSet = new Set(bl);
  const aSet = new Set(al);
  const bFiles = fs.existsSync(buildLocales) ? measure(buildLocales).files : 0;
  const aFiles = fs.existsSync(assetLocales) ? measure(assetLocales).files : 0;
  const onlyBuildLangs = bl.filter((x) => !aSet.has(x));
  const onlyAssetLangs = al.filter((x) => !bSet.has(x));
  return {
    differs: bFiles !== aFiles || onlyBuildLangs.length > 0 || onlyAssetLangs.length > 0,
    buildFiles: bFiles,
    assetFiles: aFiles,
    buildLangs: bl.length,
    assetLangs: al.length,
    onlyBuildLangs,
    onlyAssetLangs,
    buildSample: bl.slice(0, 6).join(" "),
    assetSample: al.slice(0, 6).join(" "),
  };
}

/**
 * locales **并集**构建：以「构建产物（锚点）」为基座，把 mod 发行版独有的内容补进来。
 *
 * 为什么需要它（2026-10-16 实测结论）：
 *   两棵 locales 树**都不完整**，且缺陷互补：
 *
 *   | 维度 | 构建产物（锚点） | 资产源（mod 发行版） |
 *   |---|---|---|
 *   | 语言目录 | **28**（`zh-Hans` / `zh-Hant` / `ca`）✅ 匹配代码 | 17（`zh-CN` / `zh-TW` / `ca-ES`）❌ 不在 supportedLngs 里 |
 *   | 共享命名空间内 mod 多出的 key | — | **en 707 / zh 968** |
 *   | mod 独有命名空间 | — | `talent.json` `talent-codex.json` `talent-tag.json` `biome.json` |
 *
 *   ⇒ 只取构建产物 = **丢 4 个魔改命名空间 + 上千条魔改文本**
 *   ⇒ 只取资产源 = **14 个受支持语言无目录**，且中文目录名代码根本不会请求
 *   ⇒ 正解是并集：**基座用构建产物**（语言目录名对、上游文本新），
 *      **overlay 用资产源**（补回魔改 key 与命名空间），语言目录名按 LOCALE_ALIAS 归位。
 *
 * 冲突策略（**默认 overlay 获胜 = 保留 mod 文本**）：
 *
 *   实测冲突共 5499 处，性质分三类（2026-10-16 抽样确认）：
 *     ① **排版约定**：上游把 `\n$`（换行+分页）统一成 `$`。数量最大，纯格式。
 *     ② **真实改写**：如 `battle.json#pokemonCaught`
 *        anchor「太好了！捉到{{pokemonName}}了！」 vs mod「{{pokemonName}}被抓住了！」
 *     ③ **键形变更**：上游把 i18next 扁平键 `desc_default` / `gen_1` 改成**嵌套对象**
 *        `descDefault` / `gen:{1:…}` ⇒ 这类不是冲突，而是两边各有对方没有的 key。
 *
 *   ⇒ 默认 **overlay（mod）获胜** 的理由与 O-9b 直接相关：
 *     O-9b 的判据是「以 modder 原产物为期望画面」。若让上游文本覆盖 5499 条，
 *     A/B 对比会凭空多出海量文本差异，把真正的迁移缺陷淹没在噪声里。
 *     保留 mod 文本 = 让 A/B 只差分**代码**造成的差异。
 *     反过来（`--locale-conflict=base`）会让上游较新文案生效 —— 那是**产品决策**，
 *     不是管线能替使用者定的，故不做默认。
 *
 * @param {string} baseDir    基座 locales（构建产物）
 * @param {string} overlayDir overlay locales（资产源，含 mod 自有 key 与文本）
 * @param {string} outDir     输出目录（会被整体重建）
 * @param {object} [opts]
 * @param {"overlay"|"base"} [opts.conflict="overlay"] 同 key 不同值时的胜者
 * @returns {{langs:number, files:number, addedNamespaces:number,
 *            fromOverlay:number, fromBase:number, conflicts:number,
 *            conflictWinner:string, perLang:Array<object>}}
 */
function unionLocales(baseDir, overlayDir, outDir, opts = {}) {
  const winner = opts.conflict === "base" ? "base" : "overlay";
  const langsOf = (root) =>
    fs.existsSync(root)
      ? fs
          .readdirSync(root, { withFileTypes: true })
          .filter((e) => e.isDirectory() && !e.name.startsWith("."))
          .map((e) => e.name)
      : [];
  const readNs = (root, lang) => {
    const d = path.join(root, lang);
    const m = new Map();
    if (!fs.existsSync(d)) return m;
    for (const f of fs.readdirSync(d)) {
      if (!f.endsWith(".json")) continue;
      try {
        m.set(f, JSON.parse(fs.readFileSync(path.join(d, f), "utf8")));
      } catch {
        /* 坏 JSON 跳过（归零字节/解析检测管） */
      }
    }
    return m;
  };

  const baseLangs = langsOf(baseDir);
  const overlayLangs = langsOf(overlayDir);
  /** 目标语言集合 = 基座语言 ∪ (overlay 语言经别名归位) */
  const targetLangs = new Set(baseLangs);
  for (const l of overlayLangs) targetLangs.add(LOCALE_ALIAS[l] || l);

  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  const stat = { langs: 0, files: 0, addedNamespaces: 0, fromOverlay: 0, fromBase: 0, conflicts: 0, conflictWinner: winner, perLang: [] };

  for (const lang of [...targetLangs].sort()) {
    // 反查该目标语言在 overlay 里对应的源语言名（可能多对一，取第一个命中）
    const overlayLang = overlayLangs.includes(lang) ? lang : overlayLangs.find((l) => LOCALE_ALIAS[l] === lang);
    const baseNs = readNs(baseDir, lang);
    const overNs = overlayLang ? readNs(overlayDir, overlayLang) : new Map();
    const nsNames = new Set([...baseNs.keys(), ...overNs.keys()]);

    const outLangDir = path.join(outDir, lang);
    fs.mkdirSync(outLangDir, { recursive: true });
    let fromOverlay = 0;
    let fromBase = 0;
    let conflicts = 0;

    for (const ns of nsNames) {
      const b = baseNs.get(ns);
      const o = overNs.get(ns);
      let merged;
      if (b && o) {
        // 两侧都有：先放「胜者」，再把败者独有的 key 补进来（key 级并集）
        const win = winner === "base" ? b : o;
        const lose = winner === "base" ? o : b;
        merged = Object.assign({}, win);
        for (const k of Object.keys(lose)) {
          if (!(k in merged)) {
            merged[k] = lose[k];
            if (winner === "base") fromOverlay++;
            else fromBase++;
          } else if (JSON.stringify(merged[k]) !== JSON.stringify(lose[k])) {
            conflicts++; // 胜者保留，计数留痕
          }
        }
      } else if (b) {
        merged = b;
        fromBase += Object.keys(b).length;
      } else {
        merged = o;
        fromOverlay += Object.keys(o).length;
        stat.addedNamespaces++;
      }
      fs.writeFileSync(path.join(outLangDir, ns), JSON.stringify(merged), "utf8");
      stat.files++;
    }
    stat.langs++;
    stat.fromOverlay += fromOverlay;
    stat.fromBase += fromBase;
    stat.conflicts += conflicts;
    stat.perLang.push({ lang, overlayLang: overlayLang || null, fromOverlay, fromBase, conflicts });
  }
  return stat;
}

/**
 * 把 src 下**目标缺失**的文件拷进 dst（从不覆盖、从不删除）。
 * 目录类逐层递归；文件类看目标是否已存在。
 *
 * @returns {number} 实际拷贝的文件数
 */
function copyMissing(src, dst) {
  const st = fs.statSync(src);
  if (st.isFile()) {
    if (fs.existsSync(dst)) return 0;
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
    return 1;
  }
  let n = 0;
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    n += copyMissing(path.join(src, e.name), path.join(dst, e.name));
  }
  return n;
}

// ---------------------------------------------------------------------------
// B-9 · manifest：dist 清单（可存档、可比对）
// ---------------------------------------------------------------------------
/**
 * 产出清单 JSON：
 *   - `classes[]`：逐类的 kind / 类型 / 文件数 / 字节 / 零字节 / 下限 / 是否合格
 *   - `sha256`   ：**关键文件**的 SHA256（`assets/**` 全部 + 其余文件类）；
 *                  目录类（images/audio/…）**不做**逐文件 hash —— 那是几十万次读，
 *                  且它们不随构建变化，用文件数+字节数足以发现损伤
 *   - `extras[]` ：顶层非资源类文件
 *   - `compare`  ：给了 `--compare=<旧清单>` 时，输出新增/缺失/大小变化
 *
 * 为什么 hash 只覆盖关键文件：B-4 §3.4 已论证 —— 758MB 全量 SHA256 约 3~8 秒虽可接受，
 * 但发布是低频操作、清单是高频比对物；清单要能秒级生成才有比对价值。
 */
async function cmdManifest() {
  const dist = path.resolve(opt("--dist") || DEFAULT_DIST);
  const outFile = opt("--out") || null;
  const compareFile = opt("--compare") || null;
  const wantJson = flag("--json");

  if (!fs.existsSync(dist)) {
    out(`❌ 目录不存在：${dist}`);
    process.exitCode = 1;
    return;
  }

  const classes = RESOURCE_CLASSES.map((spec) => {
    const m = measureClass(dist, spec);
    return {
      id: spec.id,
      kind: spec.kind,
      type: spec.type,
      required: spec.required,
      minFiles: spec.minFiles || null,
      minBytes: spec.minBytes || null,
      present: m.present,
      files: m.files,
      bytes: m.bytes,
      zero: m.zero,
      ok: m.ok,
      failReason: m.failReason,
    };
  });

  // 关键文件 SHA256：assets/** 全量 + 其余「文件类」资源
  const sha256 = {};
  const classIds = new Set(RESOURCE_CLASSES.map((c) => c.id));
  for (const spec of RESOURCE_CLASSES) {
    if (spec.type !== "file") continue;
    const f = path.join(dist, spec.id);
    if (!fs.existsSync(f)) continue;
    try {
      sha256[spec.id] = { size: fs.statSync(f).size, sha256: sha256File(f) };
    } catch {
      /* ignore */
    }
  }
  const assetsDir = path.join(dist, "assets");
  if (fs.existsSync(assetsDir)) {
    for (const e of fs.readdirSync(assetsDir, { withFileTypes: true })) {
      if (!e.isFile()) continue;
      const f = path.join(assetsDir, e.name);
      try {
        sha256[`assets/${e.name}`] = { size: fs.statSync(f).size, sha256: sha256File(f) };
      } catch {
        /* ignore */
      }
    }
  }

  const extras = [];
  for (const e of fs.readdirSync(dist, { withFileTypes: true })) {
    if (!e.isFile()) continue;
    if (classIds.has(e.name)) continue;
    extras.push({ name: e.name, size: fs.statSync(path.join(dist, e.name)).size, allowed: ALLOWED_EXTRA_TOP.includes(e.name) });
  }

  const totals = { files: 0, bytes: 0, zero: 0 };
  for (const c of classes) {
    totals.files += c.files;
    totals.bytes += c.bytes;
    totals.zero += c.zero;
  }

  const report = {
    tool: "tools/asset-pipeline.cjs manifest",
    at: new Date().toISOString(),
    dist: path.relative(REPO_ROOT, dist).replace(/\\/g, "/"),
    classes,
    sha256,
    extras,
    totals,
    summary: {
      classes: classes.length,
      ok: classes.filter((c) => c.ok).length,
      requiredMissing: classes.filter((c) => c.required && !c.ok).map((c) => c.id),
    },
  };

  if (compareFile) {
    report.compare = diffManifests(compareFile, report);
  }

  if (outFile) {
    const abs = path.resolve(outFile);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, JSON.stringify(report, null, 2), "utf8");
    out(`✅ 清单已写入 ${abs}`);
  }

  if (wantJson) {
    out(JSON.stringify(report, null, 2));
  } else {
    out("PKRC dist 清单（B-9）");
    out("=".repeat(68));
    out(`目标：${report.dist}`);
    out("");
    out("  " + "资源类".padEnd(24) + "来源".padEnd(8) + "文件数".padStart(9) + "字节".padStart(14) + "  状态");
    for (const c of classes) {
      out(
        "  " +
          c.id.padEnd(24) +
          c.kind.padEnd(8) +
          String(c.files).padStart(9) +
          String(c.bytes).padStart(14) +
          "  " +
          (c.ok ? "✅" : `❌ ${c.failReason}`),
      );
    }
    out("");
    out(`  合计：${totals.files} 文件 / ${(totals.bytes / 1048576).toFixed(1)} MB / 零字节 ${totals.zero}`);
    out(`  就位：${report.summary.ok}/${report.summary.classes} 类`);
    out(`  关键文件 SHA256：${Object.keys(sha256).length} 个`);
    if (extras.length) {
      out("");
      out("  顶层非资源类文件：");
      for (const x of extras) out(`    ${x.allowed ? "ℹ️ 已知" : "⚠️ 未登记"}  ${x.name}  ${x.size} B`);
    }
    if (report.compare) {
      out("");
      out(`比对基线：${report.compare.baseline}`);
      out(`  类级：新增 ${report.compare.classesAdded.length} · 缺失 ${report.compare.classesMissing.length}`);
      out(`  关键文件：新增 ${report.compare.filesAdded.length} · 缺失 ${report.compare.filesMissing.length} · 变更 ${report.compare.filesChanged.length}`);
      for (const f of report.compare.filesChanged.slice(0, 10)) out(`    ~ ${f}`);
    }
    if (report.summary.requiredMissing.length) {
      out("");
      out(`❌ 必需资源类未就位：${report.summary.requiredMissing.join(", ")}`);
      process.exitCode = 1;
    }
  }
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

/** 比对两份清单（旧 → 新），只报「类」「关键文件」两级差异 */
function diffManifests(baselinePath, current) {
  const result = {
    baseline: path.relative(REPO_ROOT, path.resolve(baselinePath)).replace(/\\/g, "/"),
    classesAdded: [],
    classesMissing: [],
    classesChanged: [],
    filesAdded: [],
    filesMissing: [],
    filesChanged: [],
  };
  let base = null;
  try {
    base = JSON.parse(fs.readFileSync(path.resolve(baselinePath), "utf8"));
  } catch (err) {
    result.error = `基线不可读：${err.message}`;
    return result;
  }

  const bc = new Map((base.classes || []).map((c) => [c.id, c]));
  const cc = new Map(current.classes.map((c) => [c.id, c]));
  for (const [id, c] of cc) {
    if (!bc.has(id)) {
      result.classesAdded.push(id);
      continue;
    }
    const b = bc.get(id);
    if (b.files !== c.files || b.bytes !== c.bytes) {
      result.classesChanged.push({ id, files: [b.files, c.files], bytes: [b.bytes, c.bytes] });
    }
  }
  for (const id of bc.keys()) if (!cc.has(id)) result.classesMissing.push(id);

  const bs = base.sha256 || {};
  const cs = current.sha256;
  for (const k of Object.keys(cs)) {
    if (!(k in bs)) result.filesAdded.push(k);
    else if (bs[k].sha256 !== cs[k].sha256) result.filesChanged.push(k);
  }
  for (const k of Object.keys(bs)) if (!(k in cs)) result.filesMissing.push(k);
  return result;
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
  measureClass,
  verifyDist,
  planMerge,
  runMergePlan,
  checkSpritePairs,
  copyMissing,
  compareLocaleTrees,
  unionLocales,
  diffManifests,
  sha256File,
  parseOpt: opt,
  parseFlag: flag,
  EXPECTED_TOP,
  MIN_FILES,
  UPSTREAM,
  RESOURCE_CLASSES,
  ALLOWED_EXTRA_TOP,
  PACKAGING_RESIDUE_RE,
  findResidue,
  pruneResidue,
  LOCALE_ALIAS,
  classSpec,
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
      case "merge":
        return await cmdMerge();
      case "manifest":
        return await cmdManifest();
      case "help":
      case "--help":
      case "-h":
        out([
          "PKRC 资产管线（tools/asset-pipeline.cjs）",
          "",
          "子命令：",
          "  probe                         探测上游 pokerogue-assets 可用性与拉取预估",
          "  verify [--dist=<dir>]         降级路径：14 类资源 + 引用 + 零字节完整性校验",
          "  assemble --from=<dir> [--to=<dir>] [--write]",
          "                                 从来源目录组装资产（默认 dry-run）",
          "  snapshot [--dist=<dir>] [--out=<file>]",
          "                                 产出资产快照，供增量比对",
          "",
          "  ---- B-9（第四阶段）----",
          "  merge --build-dir=<dir> --asset-source=<dir> --to=<dir> [--commit] [--force-replace]",
          "        [--mode=replace|fill] [--only=a,b] [--locales-from=build|asset|union] [--json]",
          "                                 「构建产物 + 资产源」合并管线（默认 dry-run）",
          "                                 replace = 整体覆盖（发布前组装，需 --force-replace 才允许覆盖非空目标）",
          "                                 fill    = 只补缺失、不覆盖不删除（A5-01b 就地补全）",
          "                                 --locales-from 默认 asset（保持发行版现状，会告警）；",
          "                                   union = 基座用构建产物 + overlay 用资产源做 key 级并集（推荐）",
          "                                 --locale-conflict=overlay|base（默认 overlay=保留 mod 文本，见文档）",
          "  manifest [--dist=<dir>] [--out=<file>] [--compare=<旧清单>] [--json]",
          "                                 dist 清单：逐类规模 + 关键文件 SHA256（可比对）",
          "",
          "参数写法：--key=value 与 --key value 均可。",
          "",
          "背景与结论：见 docs/delegation/17-B3-资产管线报告.md · docs/sourcemigration/B-9-资源补全管线.md",
        ].join("\n"));
        return;
      default:
        out(`未知子命令：${cmd}（可用：probe / verify / assemble / snapshot / merge / manifest / help）`);
        process.exitCode = 2;
    }
  })().catch((err) => {
    process.stderr.write(`fatal: ${err && err.stack ? err.stack : err}\n`);
    process.exitCode = 1;
  });
}
