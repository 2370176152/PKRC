/*
 * PKRC · S8b-1 资产清点器（只读）
 * ---------------------------------------------------------------------------
 * 用途：为 docs/tech-stack-decision.md §C-3 与 S8b-1「资产获取清单」提供**可复现的实测数据**。
 *
 * 原则：**严禁修改任何文件**。本脚本只做 stat / readdir / 少量 MagickNumber 探测。
 *
 * 运行：
 *   ..\..\shared\runtime\node.exe inventory-assets.cjs
 *   ..\..\shared\runtime\node.exe inventory-assets.cjs --json > assets.json
 *
 * 输出：分区大小、文件数、顶层条目、以及「疑似魔改新增」的目录。
 */

"use strict";

const fs = require("fs");
const path = require("path");

// tools/ 目录 → 仓库根需要回退 1 层（tools/.. = new/）
const REPO_ROOT = path.resolve(__dirname, "..");
const DIST = path.join(REPO_ROOT, "game", "server", "dist");
const AS_JSON = process.argv.includes("--json");

/** 递归求「字节数 + 文件数」。用显式栈避免深目录递归爆栈。 */
function measure(root) {
  const stack = [root];
  let bytes = 0;
  let files = 0;
  let dirs = 0;
  const maxMtime = { v: 0, path: null };
  const minMtime = { v: Infinity, path: null };

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
        dirs++;
        stack.push(full);
      } else if (e.isFile()) {
        try {
          const st = fs.statSync(full);
          bytes += st.size;
          files++;
          if (st.mtimeMs > maxMtime.v) {
            maxMtime.v = st.mtimeMs;
            maxMtime.path = full;
          }
          if (st.mtimeMs < minMtime.v) {
            minMtime.v = st.mtimeMs;
            minMtime.path = full;
          }
        } catch {
          /* 忽略读不到的文件 */
        }
      }
    }
  }
  return { bytes, files, dirs, newest: maxMtime, oldest: minMtime };
}

function human(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(2)} GB`;
}

function iso(ms) {
  if (!ms) return "-";
  return new Date(ms).toISOString().slice(0, 19).replace("T", " ");
}

// ---------------------------------------------------------------------------
// 分区定义：按「AGPL Corresponding Source 义务」分组，而非仅按目录
// ---------------------------------------------------------------------------
const SECTIONS = [
  { key: "assets", dir: "assets", cls: "code", src: "Vite 构建产物（含魔改补丁）", license: "AGPL-3.0" },
  { key: "locales", dir: "locales", cls: "text", src: "pagefaultgames/pokerogue-locales（外置 submodule）", license: "AGPL-3.0" },
  { key: "images", dir: "images", cls: "binary", src: "pagefaultgames/pokerogue-assets（外置 submodule）+ 魔改新增", license: "见下（混合）" },
  { key: "audio", dir: "audio", cls: "binary", src: "pagefaultgames/pokerogue-assets", license: "Nintendo/GF 素材版权" },
  { key: "battle-anims", dir: "battle-anims", cls: "binary", src: "pagefaultgames/pokerogue-assets", license: "同上" },
  { key: "fonts", dir: "fonts", cls: "binary", src: "上游 public/fonts（字体各自许可）", license: "逐字体确认" },
];

const report = { generatedAt: new Date().toISOString(), dist: DIST, total: null, sections: [], rootFiles: [], modifiedAdditions: [], warnings: [] };

if (!fs.existsSync(DIST)) {
  console.error(`找不到 dist 目录：${DIST}`);
  process.exit(1);
}

// 总分
report.total = measure(DIST);

// 分区
for (const s of SECTIONS) {
  const full = path.join(DIST, s.dir);
  if (!fs.existsSync(full)) {
    report.sections.push({ ...s, exists: false });
    continue;
  }
  const m = measure(full);
  // 顶层条目（给「获取路径」用）
  let top = [];
  try {
    top = fs.readdirSync(full).slice(0, 200);
  } catch {
    /* ignore */
  }
  report.sections.push({
    ...s,
    exists: true,
    bytes: m.bytes,
    human: human(m.bytes),
    files: m.files,
    dirs: m.dirs,
    topLevelCount: top.length,
    topLevelSample: top.slice(0, 12),
    newest: iso(m.newest.v),
    oldest: iso(m.oldest.v),
  });
}

// dist 根目录下的散文件
try {
  for (const e of fs.readdirSync(DIST, { withFileTypes: true })) {
    if (e.isFile()) {
      const st = fs.statSync(path.join(DIST, e.name));
      report.rootFiles.push({ name: e.name, size: st.size, human: human(st.size) });
    }
  }
} catch {
  /* ignore */
}

// ---------------------------------------------------------------------------
// 魔改新增探测（启发式，需人工确认）
// 判据：目录/文件名不在上游 assets 仓库的常见命名中，或与 PKRC 基线仓库不一致
// ---------------------------------------------------------------------------
const SUSPECT_PATTERNS = [
  /mingzuo/i, // 命之座（docs 已确认魔改新增）
  /jieming/i, // 解明
  /eryou/i, // 二游
  /talent/i, // 天赋（注意：locales 侧 talent.json 已确认魔改）
  /soudache/i, // PT 搜打撤
  /constellation/i, // 星座/命座
];

const imagesDir = path.join(DIST, "images");
if (fs.existsSync(imagesDir)) {
  for (const e of fs.readdirSync(imagesDir, { withFileTypes: true })) {
    if (SUSPECT_PATTERNS.some((re) => re.test(e.name))) {
      const m = e.isDirectory() ? measure(path.join(imagesDir, e.name)) : { bytes: fs.statSync(path.join(imagesDir, e.name)).size, files: 1 };
      report.modifiedAdditions.push({
        kind: "dir-or-file",
        parent: "images/",
        name: e.name,
        bytes: m.bytes,
        human: human(m.bytes),
        files: m.files,
        note: "疑似魔改新增美术资产 —— 来源与授权需人工确认（不可假定为上游素材）",
      });
    }
  }
}

// locales 侧魔改新增（有明确的 talent/eryou 等命名）
const localesZh = path.join(DIST, "locales", "zh-CN");
if (fs.existsSync(localesZh)) {
  for (const f of fs.readdirSync(localesZh)) {
    if (SUSPECT_PATTERNS.some((re) => re.test(f))) {
      const st = fs.statSync(path.join(localesZh, f));
      report.modifiedAdditions.push({
        kind: "locale-file",
        parent: "locales/zh-CN/",
        name: f,
        bytes: st.size,
        human: human(st.size),
        files: 1,
        note: "魔改新增系统的 i18n 文案（上游 locales 无此 key）",
      });
    }
  }
}

// 本地 locales vs 上游：文件名口径差异（A0-3 的关键证据）
report.localeNote = {
  localLangDirs: fs.existsSync(path.join(DIST, "locales")) ? fs.readdirSync(path.join(DIST, "locales")).filter((d) => /^[a-z]{2}(-[A-Za-z0-9]+)?$/.test(d)) : [],
  zhDirName: fs.existsSync(path.join(DIST, "locales", "zh-CN")) ? "zh-CN" : fs.existsSync(path.join(DIST, "locales", "zh-Hans")) ? "zh-Hans" : "(未知)",
};

// ---------------------------------------------------------------------------
// 输出
// ---------------------------------------------------------------------------
if (AS_JSON) {
  process.stdout.write(JSON.stringify(report, null, 2) + "\n");
} else {
  const L = [];
  L.push("PKRC 资产清点报告（只读）");
  L.push("=".repeat(72));
  L.push(`生成时间 : ${report.generatedAt}`);
  L.push(`dist 路径: ${report.dist}`);
  L.push(`总计     : ${report.total.files} 文件 / ${human(report.total.bytes)}`);
  L.push(`时间跨度 : ${iso(report.total.oldest.v)} ~ ${iso(report.total.newest.v)}`);
  L.push("");
  L.push("分区明细");
  L.push("-".repeat(72));
  L.push(pad("分区", 14) + pad("大小", 11) + pad("文件", 8) + pad("AGPL 义务", 12) + "来源");
  for (const s of report.sections) {
    if (!s.exists) {
      L.push(pad(s.key, 14) + pad("(不存在)", 11));
      continue;
    }
    const obligation = s.cls === "code" ? "必须提供" : s.cls === "text" ? "必须提供" : "视情况";
    L.push(pad(s.key, 14) + pad(s.human, 11) + pad(String(s.files), 8) + pad(obligation, 12) + s.src);
  }
  L.push("");
  L.push("dist 根目录散文件");
  L.push("-".repeat(72));
  for (const f of report.rootFiles) L.push(`  ${pad(f.human, 11)} ${f.name}`);
  L.push("");
  L.push("疑似魔改新增（需人工确认来源与授权）");
  L.push("-".repeat(72));
  if (!report.modifiedAdditions.length) L.push("  (未探测到)");
  for (const m of report.modifiedAdditions) {
    L.push(`  ${pad(m.human, 11)} ${m.parent}${m.name}`);
    L.push(`              ${m.note}`);
  }
  L.push("");
  L.push("locales 版本特征（A0-2 的版本锁定依据）");
  L.push("-".repeat(72));
  L.push(`  中文本地化目录名 : ${report.localeNote.zhDirName}`);
  L.push(`  语言目录 (${report.localeNote.localLangDirs.length}) : ${report.localeNote.localLangDirs.join(" ")}`);
  process.stdout.write(L.join("\n") + "\n");
}

function pad(s, w) {
  s = String(s);
  // 中文按 2 宽计算，保证表格对齐
  let width = 0;
  for (const ch of s) width += /[\u4e00-\u9fa5\uff00-\uffef]/.test(ch) ? 2 : 1;
  return s + " ".repeat(Math.max(1, w - width));
}
