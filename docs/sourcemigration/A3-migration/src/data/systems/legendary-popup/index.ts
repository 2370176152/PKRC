/**
 * legendary-popup 公共入口（独立 chunk 的对外 API）
 * ---------------------------------------------------------------------------
 * 来源：game/server/dist/assets/legendary-popup-helper-oMGPOaoa.js（.orig 独立 helper chunk）
 *       + 主 chunk 的 `x = new p`（单例）
 * 逆向方式：`r(短名,"原名")` 反查（helper chunk 用 `r` 作 keepNames 包装）
 * 锚点树：90df65097b6df76f713e6bd108afa84499e8b993
 *
 * 定位：传说弹窗的**对外唯一入口**。产物把「设备性能判定 + 懒加载 + 时长控制」
 *       放在 1.5 KB 的 helper chunk 里，把「渲染器 + 配置 + 样式」放在 322 KB 的
 *       主 chunk 里，主 chunk 由 helper **动态 import** 按需加载。
 *
 * 产物符号对照（helper chunk）：
 *   m    → DEFAULT_CONFIG            （performanceMode/enabled/mobileDuration/desktopDuration）
 *   t    → popupConfig               （可被覆盖的运行时配置）
 *   c    → cachedModule               （懒加载缓存）
 *   s    → isMobileDevice
 *   p    → detectDevicePerformance
 *   h    → shouldUseSimplifiedAnimation
 *   b    → showLegendaryPopup
 *   f    → vite `__vitePreload`（迁移时改用标准动态 import）
 *
 * 拆分策略（见 A3-10 记录）：
 *   本目录 = 产物两个 chunk 的合并迁移目标：
 *     index.ts（本文件，等价 helper chunk）  → 对外 API
 *     legendary-popup-manager.ts              → 渲染器逻辑
 *     legendary-config.ts                     → 128 KB 配置/称号数据
 *     legendary-popup-styles.ts               → 181 KB CSS
 */

// ─────────────────────────────────────────────────────────────
// 1. 配置（产物 helper chunk `m` / `t`）
// ─────────────────────────────────────────────────────────────

/** 弹窗性能模式 */
export type LegendaryPopupPerformanceMode =
  | "auto"
  | "high_performance"
  | "high_quality";

/** 设备性能档 */
export type LegendaryPopupDeviceTier = "high" | "medium" | "low";

/** 默认配置（产物 `m`） */
export const DEFAULT_CONFIG = {
  performanceMode: "auto" as LegendaryPopupPerformanceMode,
  enabled: true,
  mobileDuration: 3000,
  desktopDuration: 2500,
};

/** 运行时配置（产物 `t`，`{...DEFAULT_CONFIG}`） */
export let popupConfig = { ...DEFAULT_CONFIG };

/** 覆盖运行时配置（产物未提供 setter，此处为迁移便利补充；不改变默认行为） */
export function configureLegendaryPopup(partial: Partial<typeof DEFAULT_CONFIG>): void {
  popupConfig = { ...popupConfig, ...partial };
}

// ─────────────────────────────────────────────────────────────
// 2. 设备判定（产物 `s` / `p` / `h`）
// ─────────────────────────────────────────────────────────────

/** 产物 `s` — 是否移动端（UA 判定） */
export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/** 产物 `p` — 设备性能档（按 CPU 核数 + 设备内存） */
export function detectDevicePerformance(): LegendaryPopupDeviceTier {
  const cores = navigator.hardwareConcurrency || 2;
  const memory = (navigator as any).deviceMemory || 4;
  if (isMobileDevice()) {
    if (cores >= 8 && memory >= 6) return "high";
    if (cores >= 4 && memory >= 4) return "medium";
    return "low";
  }
  if (cores >= 8 && memory >= 8) return "high";
  if (cores >= 4 && memory >= 4) return "medium";
  return "low";
}

/** 产物 `h` — 是否使用简化动画（`high_performance` 强制简化 / `high_quality` 强制完整） */
export function shouldUseSimplifiedAnimation(): boolean {
  const mode = popupConfig.performanceMode;
  if (mode === "high_performance") return true;
  if (mode === "high_quality") return false;
  return isMobileDevice() || detectDevicePerformance() === "low";
}

// ─────────────────────────────────────────────────────────────
// 3. 懒加载入口（产物 `b` = showLegendaryPopup，`c` = 模块缓存）
// ─────────────────────────────────────────────────────────────

/** 懒加载缓存（产物 `c`） */
let cachedModule: { legendaryPopup: any } | null = null;

/**
 * 产物 `b` — 显示传说弹窗。
 *
 * 产物实现用 vite `__vitePreload(() => import("./legendary-popup-CYOZDx4m.js"), …)`；
 * 迁移版改用**标准动态 import**（打包器会自动生成 preload 包装与 `__vite__mapDeps`）。
 *
 * ⚠️ 动态 import 的目标是**本目录的 manager 模块**；打包时会被再次拆为独立 chunk
 *    （这正是「独立 chunk 可构建」的落点）。
 *
 * @param key        传说弹窗键（物种中文名 / 标识）
 * @param name       展示名
 * @param speciesId  物种 id
 */
export async function showLegendaryPopup(key: string, name: any, speciesId?: any): Promise<void> {
  if (!popupConfig.enabled) {
    console.log("[传说弹窗] 已禁用，跳过显示");
    return;
  }
  try {
    const module_ = cachedModule || (await loadLegendaryPopupModule());
    if (!cachedModule) cachedModule = module_;
    const { legendaryPopup } = module_;
    const simplified = shouldUseSimplifiedAnimation();
    legendaryPopup.show(key, name, speciesId, simplified);
    const duration = simplified ? popupConfig.mobileDuration : popupConfig.desktopDuration;
    setTimeout(() => {
      legendaryPopup.close();
    }, duration);
    console.log(`[传说弹窗] 显示: ${key}, 简化模式: ${simplified}, 时长: ${duration}ms`);
  } catch (err) {
    console.error("[传说弹窗] 显示失败:", err);
  }
}

/**
 * 懒加载主模块并返回单例。
 * 注：产物 helper 里单例 `x = new p` 定义在主 chunk；这里延迟到首次加载时构造，
 *     语义等价（都是「进程内单例 + 首次使用时初始化」）。
 */
async function loadLegendaryPopupModule(): Promise<{ legendaryPopup: any }> {
  const { LegendaryPopupManager } = await import("./legendary-popup-manager.js");
  return { legendaryPopup: new LegendaryPopupManager() };
}

// ─────────────────────────────────────────────────────────────
// TODO(接入锚点 90df65097b6d)：本文件依赖清单
// ─────────────────────────────────────────────────────────────
// TODO(接入锚点): `"#enums/species-id"`（legendary-config 用）→ 锚点树枚举
// TODO(接入锚点): `navigator.deviceMemory` 非标准 API（仅 Chromium）→ 已按产物 `||4` 兜底
// TODO(接入锚点): 产物主 chunk 的 `window.globalScene`（pauseGame 用）→ 上游全局
// TODO(接入锚点): 调用点（传说宝可梦登场）需改为 `showLegendaryPopup(...)`
// TODO(A4-验证): 简化动画阈值（CPU/内存档位）与产物一致
// TODO(A4-验证): 弹窗时长（mobile 3000 / desktop 2500）与关闭时序
