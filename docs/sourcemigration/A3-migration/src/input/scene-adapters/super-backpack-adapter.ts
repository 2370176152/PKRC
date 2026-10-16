/**
 * super-backpack-adapter.ts —— 场景适配器：道具 / 背包（`SUPER_BACKPACK` / `BALL`）
 * ---------------------------------------------------------------------------
 * 归属：前端 S6-4（场景适配）｜ 来源：F-8（接口先定，实现后填）
 * 覆盖矩阵：F-4 §一 第 5 行「道具 / 背包 Bag」
 * 承接清单：F-7 §二 #4（行选择 / 拖拽排序 / 右键快速使用）
 * 锚点树  ：90df65097b6d（v1.11.22）｜ 定位：src/input/scene-adapters/super-backpack-adapter.ts
 *
 * ⚠️ 上游**不存在** `SUPER_BACKPACK` 模式与对应 handler（V1.11.22 的 `#enums/ui-mode`
 *    止于 `CHANGE_PASSWORD_FORM`；`src/ui/handlers/` 无 super-backpack-ui-handler.ts）
 *    ⇒ 属改版新增，A3 需新建文件（见 F-7 §二 #4 / F-5 §4.2）。
 *    ⚠️ 勘误：F-1 §五 曾把 `SUPER_BACKPACK` 误列为「上游原有」，实际为改版新增。
 *
 * 状态：**桩（stub）** —— 实现待 M5 解锁后由 S6-4 填充。
 * ---------------------------------------------------------------------------
 * @module input/scene-adapters/super-backpack
 */

import { UiMode } from "#enums/ui-mode";
import type { InteractionSpec, SceneAdapter } from "../types.js";

export class SuperBackpackAdapter implements SceneAdapter {
  readonly matrixRow = 5;
  readonly label = "道具 / 背包 Bag";
  readonly modes = [UiMode.BALL, "SUPER_BACKPACK"] as const;

  /** 归一版 `pointerReady()`（F-7 §3.4） */
  isActive(): boolean {
    // TODO(S6-4): 见 F-4 §二「场景 5」
    return false;
  }

  /** 本场景的声明式交互条目 */
  specs(): InteractionSpec[] {
    // TODO(S6-4):
    //   行选择   → {kind:"cursor", cursor:rowIndex}
    //   拖拽排序 → {kind:"scroll", delta}
    //   右键快速使用 → {kind:"custom", fn}（上游无 onContext，须新建，见 F-4 §五）
    return [];
  }
}
