/**
 * PKRC · F-10 自动化走查环境 · 双产物定义
 * ---------------------------------------------------------------------------
 * O-9b 裁定：走查必须**双产物对比**——
 *   A 版 = modder 原产物（game/server/dist.modder-backup-20261016/）
 *   B 版 = 自构建产物（game/server/dist/）
 * 「最可靠的期望画面就是原版跑出来的画面」，故让 A 当基准、B 当被测。
 *
 * ⚠️ A 版**资源不完整**（只有 assets/index.html/service-worker.js）——
 *    这是 A5-01 §2.4 已知限制，也是 P4-R10 的成因。此处用「叠加根」解决：
 *    A 先查自己的文件，命不中再落到 B 的资源目录，**不拷贝 825MB**。
 *    ⇒ 两版共享同一份 audio/fonts/images/pkrc/locales，差异只来自 assets/。
 */

import fs from "node:fs";
import path from "node:path";

const REPO = path.resolve(process.cwd());

/**
 * 产物定义。`roots` 为叠加查找顺序（左优先）。
 * @type {Record<string, {id:string, label:string, roots:string[], note:string}>}
 */
export const PRODUCTS = {
  A: {
    id: "A",
    label: "modder 原产物",
    roots: ["game/server/dist.modder-backup-20261016", "game/server/dist"],
    note: "基线。仅含 assets/index.html/service-worker.js，资源由 B 叠加提供。",
  },
  B: {
    id: "B",
    label: "自构建产物",
    roots: ["game/server/dist"],
    note: "被测。源码化自构建，当前标注「未验证」。",
  },
};

/**
 * 解析产物 id → 绝对叠加根数组。
 * @param {string} id "A" | "B"
 * @returns {string[]}
 */
export function resolveProductRoots(id) {
  const p = PRODUCTS[String(id).toUpperCase()];
  if (!p) throw new Error(`未知产物：${id}（可选 ${Object.keys(PRODUCTS).join(" / ")}）`);
  const abs = p.roots.map((r) => path.join(REPO, r));
  if (!fs.existsSync(abs[0])) {
    throw new Error(`产物主目录不存在：${abs[0]}（产物 ${id}）`);
  }
  // 叠加层允许缺失（例如只跑 B 时没有 A 目录），过滤掉不存在的
  return abs.filter((r) => fs.existsSync(r));
}

/**
 * 产物指纹：assets 目录下所有文件名 + 大小，用于确认「跑的是哪一版」。
 * @param {string} id
 */
export function productFingerprint(id) {
  const roots = resolveProductRoots(id);
  const assetsDir = path.join(roots[0], "assets");
  if (!fs.existsSync(assetsDir)) return { id, assets: [], count: 0 };
  const assets = fs
    .readdirSync(assetsDir)
    .sort()
    .map((f) => ({ file: f, size: fs.statSync(path.join(assetsDir, f)).size }));
  return { id, assets, count: assets.length };
}

export default PRODUCTS;
