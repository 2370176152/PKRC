/**
 * 解明动画（jieming-anims）—— 独立产物 chunk 的迁移占位模块
 * ---------------------------------------------------------------------------
 * 来源：game/server/dist/assets/jieming-anims-D_uicwAh.js（.orig 独立 chunk）
 * 逆向方式：`c(短名,"原函数名")` 反查（该 chunk 用的包装名为 `c`，非 `l`）
 * 锚点树：90df65097b6df76f713e6bd108afa84499e8b993
 *
 * 定位：解明技能（精神补充 / 精神屏障 / 黎明的泡沫 / 音律 / 旋律 / 悦动 /
 *       察觉 / 洞悉 / 植入）的**演出动画脚本**。产物中它被 vite 拆为独立 chunk，
 *       主 chunk 的 `JiemingResolvePhase`（`f2`）经 `__vite__mapDeps` 动态加载：
 *
 *         GR(async () => {
 *           const { playJiemingSkillAnim } = await import("./jieming-anims-D_uicwAh.js");
 *           return { playJiemingSkillAnim };
 *         }, __vite__mapDeps([0, 1, 2]), import.meta.url)
 *           .then(({ playJiemingSkillAnim }) => playJiemingSkillAnim(user, skill, targets))
 *           .catch(err => console.warn("[解明] 动画播放异常，跳过动画直接结算", err))
 *           .then(() => { skill.apply(user, targets); ... });
 *
 * 接入路径说明（A3-07 交付项 ③）：
 *   1. 本文件 = **占位**。真实动画脚本（约 327 KB，含 Phaser 时间轴 + 帧脚本）尚未迁移；
 *      A3-13 用真实 chunk 源码替换本文件实现，**导出名保持不变**（`playJiemingSkillAnim`）。
 *   2. 调用方 `JiemingResolvePhase.start()` 用 `await import("./jieming-anims.js")` 动态引入；
 *      占位实现为 **no-op resolve**，使"动画异常 → 跳过动画直接结算"路径在无动画时行为等价
 *      （与产物 `.catch(...)` 分支一致）。
 *   3. vite 打包时该动态 import 会被再次拆为独立 chunk；`__vite__mapDeps` 由打包器自动生成，
 *      源码中**无需**手写（占位阶段直接写标准动态 import 即可）。
 *
 * 产物符号对照（去混淆映射）：
 *   n0   → getJiemingAnimScripts     （技能 id → 动画脚本表）
 *   k0   → ensureJiemingAnimLoaded   （按需加载动画资源）
 *   $0   → playJiemingSkillAnim      （对外唯一导出：播放一套解明技演出）
 *   T0   → playAnimSegment           （播放单个动画段）
 *   E0   → resolveSegmentAnchors     （解析段锚点坐标）
 *   I0   → buildJiemingAnimContext   （构造动画上下文 user/skill/targets）
 *
 * ⚠️ 本文件为**占位模块**，不做真实演出；替换它的全部逻辑属于 A3-13 / A4 的动画迁移。
 */

// ─────────────────────────────────────────────────────────────
// 类型契约（与产物 chunk 的运行时形态一致）
// ─────────────────────────────────────────────────────────────

/** 解明技能（调用方传入；与 `jieming-system.ts` 的 `JiemingSkill` 结构一致） */
export interface JiemingAnimSkill {
  id: string;
  name: string;
  [key: string]: unknown;
}

/** 动画脚本条目（产物 `n0()` 的表项） */
export interface JiemingAnimScript {
  /** 动画资源名 */
  anim: string;
  /** 可选触发条件：返回真才播放该段 */
  onlyIf?: (context: unknown) => boolean;
}

// ─────────────────────────────────────────────────────────────
// 产物函数（占位实现；A3-13 替换为真实逻辑）
// ─────────────────────────────────────────────────────────────

/**
 * 产物 `n0` — 取解明动画脚本表（技能 id → 脚本段数组）。
 * TODO(接入锚点): A3-13 迁移真实脚本表（含各技能的时间轴 + 帧配置）。
 */
export function getJiemingAnimScripts(): Record<string, JiemingAnimScript[]> {
  return {};
}

/**
 * 产物 `k0` — 确保某动画资源已加载（Phaser `load`）。
 * TODO(接入锚点): A3-13 接入真实资源加载（`globalScene.load.*`）。
 */
export async function ensureJiemingAnimLoaded(_anim: string): Promise<void> {
  // 占位：无资源可加载
}

/**
 * 产物 `E0` — 解析动画段锚点坐标。
 * TODO(接入锚点): A3-13 迁移真实锚点解析。
 */
export function resolveSegmentAnchors(): number[] {
  return [];
}

/**
 * 产物 `I0` — 构造动画上下文。
 * TODO(接入锚点): A3-13 迁移真实上下文构造。
 */
export function buildJiemingAnimContext(user: unknown, skill: unknown, targets: unknown[]): unknown {
  return { user, skill, targets };
}

/**
 * 产物 `T0` — 播放单个动画段。
 * TODO(接入锚点): A3-13 迁移真实段播放（Phaser 补间）。
 */
export async function playAnimSegment(_script: JiemingAnimScript, _context: unknown): Promise<void> {
  // 占位：无演出
}

/**
 * 产物 `$0` — **对外唯一导出**：播放一套解明技演出。
 *
 * 产物形态：`async function $0(user, skill, targets)` ——
 * 取该技能的脚本段，逐个 `ensureJiemingAnimLoaded` 后播放；无脚本则直接返回。
 *
 * 占位行为：**立即 resolve**（等价于"无动画 → 直接进入结算"，
 * 与产物 `.catch(... console.warn ...)` 的降级路径殊途同归）。
 *
 * @param user    施放者（解明主控单位）
 * @param skill   解明技能（含 `id` / `name`）
 * @param targets 目标数组
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function playJiemingSkillAnim(
  _user: unknown,
  _skill: JiemingAnimSkill,
  _targets: unknown[],
): Promise<void> {
  // TODO(接入锚点): A3-13 替换为真实演出（脚本段过滤 → 资源加载 → 逐段播放）
}

// ─────────────────────────────────────────────────────────────
// TODO(接入锚点 90df65097b6d)：本文件依赖清单
// ─────────────────────────────────────────────────────────────
// TODO(接入锚点): 本模块在产物中依赖 `#app/global-scene`（`E`）与 Phaser；
//                 真实迁移（A3-13）时补 import。
// TODO(A4-验证): 三个解明系（MANAPHY群 / MELOETTA / MEW）各技能的动画脚本 id
//                 需与 `jieming-system.ts` 的 `JiemingSkill.id` 逐一对齐。
