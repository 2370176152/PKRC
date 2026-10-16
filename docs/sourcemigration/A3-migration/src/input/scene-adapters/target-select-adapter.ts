/**
 * target-select-adapter.ts —— 场景适配器：目标选择（`UiMode.TARGET_SELECT`）
 * ---------------------------------------------------------------------------
 * 归属：前端 S6-4（场景适配）｜ 来源：F-8（接口先定，实现后填）
 * 覆盖矩阵：F-4 §一 第 8 行「目标选择 Target」
 * 承接清单：F-7 上游 `target-select-ui-handler.ts`（产物无独立 pointerdown，需新增命中）
 * 锚点树  ：90df65097b6d（v1.11.22）｜ 定位：src/input/scene-adapters/target-select-adapter.ts
 *
 * 状态：**桩（stub）** —— 实现待 M5 解锁后由 S6-4 填充。
 * ---------------------------------------------------------------------------
 * @module input/scene-adapters/target-select
 */

import { UiMode } from "#enums/ui-mode";
import type { InteractionSpec, SceneAdapter } from "../types.js";

export class TargetSelectAdapter implements SceneAdapter {
  readonly matrixRow = 8;
  readonly label = "目标选择 Target";
  readonly modes = [UiMode.TARGET_SELECT] as const;

  /** 归一版 `pointerReady()`（F-7 §3.4） */
  isActive(): boolean {
    // TODO(S6-4): 见 F-4 §二「场景 8」
    return false;
  }

  /** 本场景的声明式交互条目 */
  specs(): InteractionSpec[] {
    // TODO(S6-4):
    //   目标点击 → {kind:"cursor", cursor:battlerIndex}
    //     （上游 setCursor target-select-ui-handler.ts:141 / resetCursor:80；仅命中 targets 内）
    return [];
  }
}
