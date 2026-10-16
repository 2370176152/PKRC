/**
 * types.ts —— S6 输入层共享契约（类型层）
 * ---------------------------------------------------------------------------
 * 归属：前端 S6（v2 看板 S6-4）｜ 来源：F-7 §3.3（设计签名冻结）｜ 形态：F-8
 *
 * 文件头 5 要素：
 *   ① 系统名    ：输入层 · 共享契约（命中区 / 交互语义 / 适配器接口）
 *   ② 来源      ：**新写**（非产物迁移 —— 无对应产物 chunk / 无压缩符号可对照）
 *   ③ 逆向方式  ：不适用（S6 新增源码）
 *   ④ 锚点树    ：.build-tools/tarball-src/pokerogue-90df65097b6df76f713e6bd108afa84499e8b993（v1.11.22）
 *   ⑤ 定位      ：src/input/types.ts
 *
 * 设计约束：只用**上游概念**（`UiMode` / `Button`），不造自造名词（派单 02 §五 ②）。
 * ---------------------------------------------------------------------------
 * @module input/types
 */

import type { Button } from "#enums/buttons";
import type { UiMode } from "#enums/ui-mode";

/** 命中区（世界坐标矩形；`bounds()` 惰性求值，随滚动变化） */
export interface HitBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** 交互语义（对齐 v1 派单 02 §5.1 的建议 ActionSpec） */
export type InteractionAction =
  /** 推荐路径：直接复用上游「模式白名单 / 音效 / 振动 / disableMenu」全部判定 */
  | { kind: "button"; button: Button }
  /** 命中即 `setCursor`，可选再触发一个 Button */
  | { kind: "cursor"; cursor: number; then?: Button }
  /** 列表翻页（滚轮 / 上下翻） */
  | { kind: "scroll"; delta: number }
  /** 兜底：改版系统内部动作（S6-5 归一为前三种者优先） */
  | { kind: "custom"; fn: () => void };

/** 一条**声明式**交互条目（F-7 §3.1 ④ 注册表的元素） */
export interface InteractionSpec {
  /** 稳定 id，用于灰度与调试（如 "party.slot.2"） */
  id: string;
  /** 惰性命中区（每次命中判定时求值，支持滚动） */
  bounds(): HitBox;
  action: InteractionAction;
  /** 灰度优先级：大者先命中（用于旧实现共存期，v1 §5.2） */
  priority?: number;
  /** 运行时可禁用（对齐 v1 §5.5 3-D 禁用元素） */
  enabled?(): boolean;
}

/**
 * 改版新增 `UiMode` 的「待接入」字符串标识（产物共 18 个改版模式）。
 *
 * 上游 `#enums/ui-mode` 尚无这些成员（V1.11.22 止于 `CHANGE_PASSWORD_FORM`）；
 * 迁移期由 A3 各系统以 `declare const UiMode: any` 占位引用。
 *
 * TODO(接入锚点 90df65097b6d): A4-00 接入后这些成员应并入 `#enums/ui-mode`，
 *   届时本类型应替换为对应的 `UiMode` 成员引用（见 F-1 §五）。
 */
export type PkrcUiModeId =
  // 超级背包（改造上游背包 → 独立模式）
  | "SUPER_BACKPACK"
  // 二游养成（11）
  | "ERYOU_HELD_ITEM"
  | "ERYOU_HELD_SYNTHESIS"
  | "ERYOU_EVOLVE"
  | "ERYOU_GUIDE"
  | "ERYOU_LEVELUP"
  | "ERYOU_LOBBY"
  | "ERYOU_PROGRESSION"
  | "ERYOU_REWARD"
  | "ERYOU_SEARCH"
  | "ERYOU_SYNTHESIS"
  | "ERYOU_TRAINING"
  // 解明（1）
  | "JIEMING"
  // PT（2）
  | "PT_CONSTELLATION"
  | "PT_SOUDACHE_START"
  // 天赋（3）
  | "TALENT_CODEX"
  | "TALENT_SHOP"
  | "TALENT_VIEWER";

/** 场景标识 = 上游 `UiMode` ∪ 改版新增模式标识 */
export type SceneMode = UiMode | PkrcUiModeId;

/**
 * 场景适配器契约 —— F-8 的 13 个适配器（12 核心 + 1 上游复用）都实现它。
 *
 * ⚠️ 相比 F-7 §3.3 的设计签名，此处把单数 `mode` 细化为复数 `modes`
 *    （一个适配器可覆盖多个 `UiMode`，如「菜单与设置」覆盖 MENU + SETTINGS_* + OPTION_SELECT）。
 */
export interface SceneAdapter {
  /** 对应 F-4 覆盖矩阵行号（1..13）；供 S6-4 逐格勾选定位 */
  readonly matrixRow: number;
  /** 人类可读场景名（与 F-4 §一 矩阵一致） */
  readonly label: string;
  /** 本适配器覆盖的全部 `UiMode` / 改版模式标识 */
  readonly modes: readonly SceneMode[];
  /**
   * 当前是否可交互。
   * 归一改版三种 `pointerReady()` 变体（F-7 §3.4）为统一语义：
   * `visible && active && !busy && !closing && 当前 mode 命中本适配器`
   */
  isActive(): boolean;
  /** 返回本场景的全部声明式交互条目 */
  specs(): InteractionSpec[];
}
