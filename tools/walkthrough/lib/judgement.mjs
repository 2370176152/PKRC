/**
 * PKRC · 走查视觉判定标准（U-11 机读产物）
 * ---------------------------------------------------------------------------
 * 归属：docs/delegation/33-UI-走查视觉判定标准.md（U-11，派单 32 §五）
 * 消费方：F-14（走查场景实现）—— import 本文件生成/校验场景断言
 *         F-15（diff 阈值调优）—— 只改 CLASS_THRESHOLDS，场景零改动
 *         E-3（A4-01 全量画面走查）—— diffVerdict() 出三态裁定
 *
 * 判据层级（O-9b）：
 *   ① 状态/数值断言（机器，最硬）→ ② 截图像素 diff（机器，定量）
 *   → ③ AI 视觉审阅（仅灰区，不得单独作通过依据）
 *
 * ⚠️ Phaser canvas 内文本不在 DOM —— canvas 类画面只用页面级断言
 *   （canvas 挂载 / 无新增异常），视觉期望全部以 A/B diff 表述。
 *   HTML 模块（legendary-popup、欢迎弹窗）才可用 DOM 文本断言。
 *
 * 与 lib/png.mjs 的 diffPng() 输出同源：
 *   { sameSize, diffRatio, hotGrid, bbox, meanAbsDiff, ... }
 *
 * 硬否决只有一条：sameSize=false（画布/缩放配置差，无 diff 意义）。
 * bbox / hotGrid 是**软信号**——bbox 是「全部差异像素的包围盒」，
 * 正常等价画面（顶部菜单 + 底部按钮各有 hinting 噪声）也会横跨全屏，
 * 因此 bbox 面积不作机器否决；分散度用 hotGrid 计数度量（spreadScore），
 * 仅作灰区 AI 审阅的输入与证据记录。
 */

export const JUDGEMENT_VERSION = 1;

/** 页面级断言三件套（canvas 场景通用；F-12 catalog 里 DOM 文本断言的修正版） */
const PAGE_ASSERTS = [
  { kind: "expr", expr: "!!document.querySelector('canvas')", expect: "canvas 已挂载", judgement: "assert" },
  { kind: "noNewErrors", expect: "未新增未捕获异常", judgement: "assert" },
];

/** HTML 模块追加断言（legendary-popup 等 DOM 渲染画面） */
const DOM_TEXT_ASSERT = (needle) => ({
  kind: "expr",
  expr: `document.body.innerText.includes(${JSON.stringify(needle)})`,
  expect: `DOM 含「${needle}」`,
  judgement: "assert",
});

/**
 * 画面五分类阈值（diffRatio = 差异像素 ÷ 总像素；png.mjs threshold=12, gridSize=40）
 * equalLine 等价线 / greyLine 灰区线
 * ⚠️ F-15 用「已知等价画面」实测误报率 <5% 后调优本表 —— 唯一调优入口
 * ⚠️ 不含 bbox 阈值：bbox 面积大 ≠ 差异分散（正常画面 hinting 也会横跨全屏），
 *    分散度由 spreadScore() 的 hotGrid 计数度量。
 */
export const CLASS_THRESHOLDS = {
  S: { label: "静态界面", equalLine: 0.005, greyLine: 0.05 },
  P: { label: "弹窗/提示", equalLine: 0.01, greyLine: 0.08 },
  H: { label: "战斗 HUD/计量条", equalLine: 0.02, greyLine: 0.10 },
  B: { label: "战斗全景", equalLine: 0.03, greyLine: 0.15 },
  A: { label: "动画演出", equalLine: 0.05, greyLine: 0.20 },
};

/**
 * 51 点逐一判定配置（与 29-F12 catalog.mjs 的 point id 一一对应）
 *   class   画面分类（S/P/H/B/A）
 *   asserts 页面级（或 DOM 级）断言；canvas 内视觉期望走 diff，不写凭空描述
 *   ai      true = 灰区预期升级 AI 审阅（A 类动画点）
 *   keyFrame true = settle 预期失败，走关键帧策略（首帧/尾帧，过程帧不判等价）
 *   blame   U-7 组件归因（不等价时的施工定位；— = 上游原生/框架）
 *   note    关键观测 / 已知风险
 */
export const JUDGEMENTS = {
  // ---- boot（3）----
  "boot.ready": { class: "B", asserts: PAGE_ASSERTS, ai: false, keyFrame: false, blame: "—", note: "canvas 挂载 ∧ 帧标准差 > 阈值 ∧ 连续 2 帧；B 版黑屏 = P0 缺陷复现，直接不过" },
  "boot.welcome-popup": { class: "P", asserts: [...PAGE_ASSERTS], ai: false, keyFrame: false, blame: "—", note: "HTML 弹窗：DOM innerText 断言可用；diff bbox 应覆盖弹窗矩形" },
  "boot.lang-select": { class: "S", asserts: PAGE_ASSERTS, ai: false, keyFrame: false, blame: "B 层 settings", note: "静态列表；B 版缺语言项 → bbox 在列表区" },

  // ---- talent（11）----
  "talent.codex": { class: "S", asserts: PAGE_ASSERTS, ai: false, keyFrame: false, blame: "C-2", note: "⚠️ 删除 F-12 原 innerText.includes('天赋') 断言（canvas 陷阱）；网格+卡片 diff" },
  "talent.shop": { class: "S", asserts: PAGE_ASSERTS, ai: false, keyFrame: false, blame: "C-2", note: "商店条目 + 价格文本" },
  "talent.acquire-toast": { class: "P", asserts: PAGE_ASSERTS, ai: false, keyFrame: false, blame: "C-2", note: "toast 出现动画 → settle 后再截；hover 态不得入图" },
  "talent.runtime-hud": { class: "H", asserts: PAGE_ASSERTS, ai: false, keyFrame: false, blame: "C-2", note: "bbox 应局限于 HUD 区域；全屏散差 = 迁移回归" },
  "talent.age.ice": { class: "B", asserts: PAGE_ASSERTS, ai: false, keyFrame: false, blame: "C-2+A-2", note: "AOE 结算 + 播报；时序抖动大，灰区到 15%" },
  "talent.age.stone": { class: "B", asserts: PAGE_ASSERTS, ai: false, keyFrame: false, blame: "C-2+A-2", note: "同上，换石器时代" },
  "talent.age.industrial": { class: "B", asserts: PAGE_ASSERTS, ai: false, keyFrame: false, blame: "C-2+A-2", note: "同上，换工业时代" },
  "talent.age.info": { class: "B", asserts: PAGE_ASSERTS, ai: false, keyFrame: false, blame: "C-2+A-2", note: "同上，换信息时代" },
  "talent.age.totem": { class: "B", asserts: PAGE_ASSERTS, ai: false, keyFrame: false, blame: "C-2+A-2", note: "同上，换图腾时代" },
  "talent.xingxiang": { class: "B", asserts: PAGE_ASSERTS, ai: false, keyFrame: false, blame: "C-2", note: "播报文本「的星象切换为【…】！」；文本区 hotGrid 可解释" },
  "talent.yijianqingyuan": { class: "B", asserts: PAGE_ASSERTS, ai: false, keyFrame: false, blame: "C-2", note: "增伤表现（buff 图标/数值）" },

  // ---- eryou（4）----
  "eryou.synthesis": { class: "S", asserts: PAGE_ASSERTS, ai: false, keyFrame: false, blame: "C-1", note: "🔴 184 锚点最大单点 UI：素材槽布局、选中态高亮逐项核对；A/B 有差优先查此处" },
  "eryou.battle": { class: "B", asserts: PAGE_ASSERTS, ai: false, keyFrame: false, blame: "C-1+A-2", note: "战斗全景 + 深渊 UI 皮肤" },
  "eryou.shop": { class: "S", asserts: PAGE_ASSERTS, ai: false, keyFrame: false, blame: "C-1", note: "商品列表" },
  "eryou.abyss-buff": { class: "H", asserts: PAGE_ASSERTS, ai: false, keyFrame: false, blame: "C-1", note: "加成数值；若能拿到 abyssAttackBuffMultiplier → 升级为数值断言" },

  // ---- pt-soudache（3）----
  "pt.start": { class: "S", asserts: PAGE_ASSERTS, ai: false, keyFrame: false, blame: "C-4", note: "改版屏幕聚集区 L405–475" },
  "pt.shop": { class: "S", asserts: PAGE_ASSERTS, ai: false, keyFrame: false, blame: "C-4+A-4", note: "34 处 M.t 集中区；文本差异 = i18n 缺 key，优先查命名空间" },
  "pt.settle": { class: "P", asserts: PAGE_ASSERTS, ai: false, keyFrame: false, blame: "C-4", note: "结算数值「每级 PT 收益按波次分档」；数值错 = 不等价（非视觉问题）" },

  // ---- jieming（3）----
  "jieming.shield": { class: "H", asserts: PAGE_ASSERTS, ai: false, keyFrame: false, blame: "C-5", note: "盾层数/图标" },
  "jieming.skill": { class: "A", asserts: PAGE_ASSERTS, ai: true, keyFrame: true, blame: "C-5", note: "settle 预期失败 → 关键帧策略；jieming-anims chunk 加载失败会在此暴露" },
  "jieming.turnorder": { class: "H", asserts: PAGE_ASSERTS, ai: false, keyFrame: false, blame: "C-5", note: "顺序条 UI（与 p5x.turnorder 同组件家族）" },

  // ---- healer / nianli（4）----
  "healer.wish": { class: "P", asserts: PAGE_ASSERTS, ai: false, keyFrame: false, blame: "C-6", note: "祈愿界面（phase 级）" },
  "healer.seaguard": { class: "B", asserts: PAGE_ASSERTS, ai: false, keyFrame: false, blame: "C-6", note: "铺层表现 + 播报" },
  "nianli.stacks": { class: "H", asserts: PAGE_ASSERTS, ai: false, keyFrame: false, blame: "C-6", note: "层数数字 hinting 敏感；位数变化（10→100）属真差异" },
  "nianli.burst": { class: "B", asserts: PAGE_ASSERTS, ai: false, keyFrame: false, blame: "C-6", note: "爆发结算 + 播报" },

  // ---- p5x（3）----
  "p5x.turnorder": { class: "H", asserts: PAGE_ASSERTS, ai: false, keyFrame: false, blame: "C-5+A-11", note: "95 种新增 hex 大头在 P5X 状态图标区 → 色差是重点" },
  "p5x.turnorder.hide": { class: "H", asserts: PAGE_ASSERTS, ai: false, keyFrame: false, blame: "C-5", note: "⚠️ 反向判定：期望 A/B 均无顺序条；B 有残留 → bbox 在原位置，不等价" },
  "p5x.effect": { class: "A", asserts: PAGE_ASSERTS, ai: true, keyFrame: true, blame: "C-5+A-11", note: "效果表现（图标+动效）" },

  // ---- callingcard / dianxin（4）----
  "callingcard.gauge": { class: "H", asserts: PAGE_ASSERTS, ai: false, keyFrame: false, blame: "C-7", note: "对标 candy-bar/party-exp-bar；填充比例" },
  "callingcard.resolve": { class: "P", asserts: PAGE_ASSERTS, ai: false, keyFrame: false, blame: "C-7", note: "解析结果" },
  "callingcard.command": { class: "S", asserts: PAGE_ASSERTS, ai: false, keyFrame: false, blame: "C-7", note: "命令菜单按钮 + 刷新逻辑" },
  "dianxin.echo": { class: "B", asserts: PAGE_ASSERTS, ai: false, keyFrame: false, blame: "C-6", note: "回响结算表现" },

  // ---- legendary-popup（2 · HTML 专项）----
  "legendary.popup": { class: "A", asserts: [...PAGE_ASSERTS, DOM_TEXT_ASSERT("传说")], ai: true, keyFrame: true, blame: "C-8 专项", note: "HTML 模块：DOM 断言可用；光环动效 → 关键帧 + AI；差异不挂 S7 账" },
  "legendary.helper": { class: "A", asserts: PAGE_ASSERTS, ai: true, keyFrame: true, blame: "C-8 专项", note: "动画过程中截图必然未稳定；首/尾帧对比" },

  // ---- misc（14）----
  "misc.constellation.codex": { class: "S", asserts: PAGE_ASSERTS, ai: false, keyFrame: false, blame: "命座数据表", note: "命之座 = 公共底座（7 系统共用）；此处差异影响面最大" },
  "misc.constellation.node": { class: "S", asserts: PAGE_ASSERTS, ai: false, keyFrame: false, blame: "命座数据表", note: "节点连线 + 等级（1/2/3/5/6 分布）" },
  "misc.super-backpack": { class: "S", asserts: PAGE_ASSERTS, ai: false, keyFrame: false, blame: "C-3", note: "背包网格" },
  "misc.challenge.select": { class: "S", asserts: PAGE_ASSERTS, ai: false, keyFrame: false, blame: "B 层 challenges-select", note: "挑战列表" },
  "misc.challenge.same-pokemon": { class: "S", asserts: PAGE_ASSERTS, ai: false, keyFrame: false, blame: "B 层", note: "开局状态" },
  "misc.challenge.suiji": { class: "S", asserts: PAGE_ASSERTS, ai: false, keyFrame: false, blame: "B 层", note: "随机化结果 → 用 --inject 固定种子才可比" },
  "misc.challenge.triple-passive": { class: "S", asserts: PAGE_ASSERTS, ai: false, keyFrame: false, blame: "B 层", note: "被动槽 ×3" },
  "misc.challenge.wu": { class: "S", asserts: PAGE_ASSERTS, ai: false, keyFrame: false, blame: "B 层", note: "开局状态" },
  "misc.terrain.chengfeng": { class: "B", asserts: PAGE_ASSERTS, ai: false, keyFrame: false, blame: "C-11", note: "场地表现 + 播报" },
  "misc.terrain.kongjian": { class: "B", asserts: PAGE_ASSERTS, ai: false, keyFrame: false, blame: "C-11", note: "场地表现 + 播报" },
  "misc.meloetta": { class: "H", asserts: PAGE_ASSERTS, ai: false, keyFrame: false, blame: "C-11", note: "节拍下限表现" },
  "misc.mew": { class: "B", asserts: PAGE_ASSERTS, ai: false, keyFrame: false, blame: "C-11", note: "效果表现" },
  "misc.manaphy": { class: "B", asserts: PAGE_ASSERTS, ai: false, keyFrame: false, blame: "C-11", note: "效果表现（与 healer.seaguard 同源，核对一致性）" },
  "misc.pt.hud": { class: "H", asserts: PAGE_ASSERTS, ai: false, keyFrame: false, blame: "C-4+A-4", note: "常驻 HUD 数值" },
};

/**
 * 三态裁定：输入 png.mjs diffPng() 的输出
 * @returns {"equivalent"|"grey"|"inequivalent"|"unknown-point"}
 *   equivalent   等价（记证据：diffRatio + hotGrid 分散度 + bbox）
 *   grey         灰区 → AI 审阅（双条件通过，不得单独裁过）
 *   inequivalent 不等价 → 逐条裁定：修复 or 挂账
 *
 * 硬否决仅 sameSize=false；diffRatio 三态与类别阈值（见 CLASS_THRESHOLDS）。
 * 分散度不参与机器裁定，由 spreadScore() 输出供 AI/证据包使用。
 */
export function diffVerdict(pointId, diffResult) {
  const j = JUDGEMENTS[pointId];
  if (!j) return "unknown-point";
  const t = CLASS_THRESHOLDS[j.class];
  if (!t) return "unknown-point";

  // C-3 尺寸一致：不同直接不等价（画布/缩放配置差）
  if (diffResult.sameSize === false) return "inequivalent";

  const r = diffResult.diffRatio ?? 0;
  if (r <= t.equalLine) return "equivalent";
  if (r <= t.greyLine) return "grey";
  return "inequivalent";
}

/**
 * 分散度软信号（不参与裁定，供灰区 AI 审阅与证据包记录）：
 *   hotCells   —— 有差异的 40px 网格数（png.mjs hotGrid，ratio>0.02，最多 40）
 *   capped     —— 是否触顶（true = 差异极度分散，疑系统性渲染差）
 *   totalCells —— 网格总数（width/40 × height/40）
 * 解读：等价画面的 hinting 噪声集中在少数文本/图标点（hotCells 小）；
 *      全屏每个格子都有差异（hotCells 触顶）= 系统性差异的强信号。
 */
export function spreadScore(diffResult) {
  const hot = Array.isArray(diffResult.hotGrid) ? diffResult.hotGrid : [];
  const w = diffResult.width ?? 0;
  const h = diffResult.height ?? 0;
  const totalCells = w > 0 && h > 0 ? Math.ceil(w / 40) * Math.ceil(h / 40) : 0;
  return { hotCells: hot.length, capped: hot.length >= 40, totalCells };
}

/** 统计（自检/报告用） */
export function judgementStats() {
  const byClass = {};
  for (const j of Object.values(JUDGEMENTS)) {
    byClass[j.class] = (byClass[j.class] ?? 0) + 1;
  }
  return { points: Object.keys(JUDGEMENTS).length, byClass, version: JUDGEMENT_VERSION };
}

export default JUDGEMENTS;
