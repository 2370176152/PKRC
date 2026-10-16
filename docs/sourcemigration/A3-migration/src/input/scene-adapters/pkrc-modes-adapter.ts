/**
 * pkrc-modes-adapter.ts —— 场景适配器：改版新增系统（18 模式）
 * ---------------------------------------------------------------------------
 * 归属：前端 S6-4/S6-5（场景适配 + 改版系统统一接入）
 * 来源：F-8（接口先定，实现后填）｜ 设计：F-7 §三 / v1 派单 02 §5.4（pkrc-modes 统一接管）
 * 覆盖矩阵：F-4 §一 第 12 行「改版新增（天赋/命座/解明/二游/PT/超级背包）」→ F-4 §二「场景 12」
 * 承接清单：F-7 §二 #19/#21/#22..#38（共 20 处外挂交互点）
 * 锚点树  ：90df65097b6d（v1.11.22）｜ 定位：src/input/scene-adapters/pkrc-modes-adapter.ts
 *
 * ⚠️ 本场景的 18 个 `UiMode` 上游**全部不存在**（V1.11.22 的 `#enums/ui-mode` 止于
 *    `CHANGE_PASSWORD_FORM`）⇒ 属改版新增；对应 handler 需 A3 新建
 *    （产物已确证类名：Eryou*×12 / Talent*×3 / Jieming / Pt*×2 / SuperBackpack）。
 *
 * 归一化要求（F-7 §3.4 / v1 §5.4）：
 *   - `pointerReady()` 三种变体 → 统一为 `isActive()`
 *   - 滑动关闭（硬判 `wasTouch`）→ `{kind:"scroll"}`（使鼠标也可滑关）
 *   - 列表上下翻 → `{kind:"scroll", delta:±1}`
 *   - **旧实现保留至验证通过再删**（v1 §5.2 灰度）
 *
 * 状态：**桩（stub）** —— 实现待 M5 解锁后由 S6-4/S6-5 填充。
 * ---------------------------------------------------------------------------
 * @module input/scene-adapters/pkrc-modes
 */

import type { InteractionSpec, PkrcUiModeId, SceneAdapter } from "../types.js";

/** 改版新增 18 模式（顺序与 F-1 §五 / types.ts `PkrcUiModeId` 一致） */
const PKRC_MODES: readonly PkrcUiModeId[] = [
  "SUPER_BACKPACK",
  "ERYOU_HELD_ITEM",
  "ERYOU_HELD_SYNTHESIS",
  "ERYOU_EVOLVE",
  "ERYOU_GUIDE",
  "ERYOU_LEVELUP",
  "ERYOU_LOBBY",
  "ERYOU_PROGRESSION",
  "ERYOU_REWARD",
  "ERYOU_SEARCH",
  "ERYOU_SYNTHESIS",
  "ERYOU_TRAINING",
  "JIEMING",
  "PT_CONSTELLATION",
  "PT_SOUDACHE_START",
  "TALENT_CODEX",
  "TALENT_SHOP",
  "TALENT_VIEWER",
];

export class PkrcModesAdapter implements SceneAdapter {
  readonly matrixRow = 12;
  readonly label = "改版新增（天赋/命座/解明/二游/PT/超级背包）";
  readonly modes = PKRC_MODES;

  /** 归一版 `pointerReady()`（F-7 §3.4）：消解产物三种变体 */
  isActive(): boolean {
    // TODO(S6-5): 归一 A/B/C 三变体为 visible && active && !busy && !closing && mode 命中
    return false;
  }

  /** 本场景的声明式交互条目（20 处外挂交互点，F-7 §二 #19..#38） */
  specs(): InteractionSpec[] {
    // TODO(S6-5):
    //   二游列表上下翻 → {kind:"scroll", delta:±1}
    //   二游行激活/取回 → {kind:"cursor", cursor:row} + {kind:"custom", fn}
    //   天赋/命座技能行、星点、分支循环、选项 → {kind:"cursor"} / {kind:"custom"}
    //   解明行选择     → {kind:"cursor", cursor:row}
    //   PT 命座星点/排序 → {kind:"cursor"} / {kind:"custom"}
    //   关闭/返回      → {kind:"button", button:Button.CANCEL}
    //   滑动关闭       → {kind:"scroll", delta}（去掉 wasTouch 硬判）
    return [];
  }
}
