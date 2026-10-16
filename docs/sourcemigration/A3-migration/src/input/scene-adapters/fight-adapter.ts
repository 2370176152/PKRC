/**
 * fight-adapter.ts —— 场景适配器：招式选择（`UiMode.FIGHT`）
 * ---------------------------------------------------------------------------
 * 归属：前端 S6-4（场景适配）｜ 来源：F-8（接口先定，实现后填）
 * 覆盖矩阵：F-4 §一 第 7 行「招式选择 Fight」
 * 承接清单：F-7 §二 #5（招式槽 / 双打左右切 / 右键招式详情）
 * 锚点树  ：90df65097b6d（v1.11.22）｜ 定位：src/input/scene-adapters/fight-adapter.ts
 *
 * 状态：**桩（stub）** —— 实现待 M5 解锁后由 S6-4 填充。
 * ---------------------------------------------------------------------------
 * @module input/scene-adapters/fight
 */

import { UiMode } from "#enums/ui-mode";
import type { InteractionSpec, SceneAdapter } from "../types.js";

export class FightAdapter implements SceneAdapter {
  readonly matrixRow = 7;
  readonly label = "招式选择 Fight";
  readonly modes = [UiMode.FIGHT] as const;

  /** 归一版 `pointerReady()`（F-7 §3.4） */
  isActive(): boolean {
    // TODO(S6-4): 见 F-4 §二「场景 7」
    return false;
  }

  /** 本场景的声明式交互条目 */
  specs(): InteractionSpec[] {
    // TODO(S6-4):
    //   招式槽点击 → {kind:"cursor", cursor:moveSlot}   （上游 setCursor fight-ui-handler.ts:295）
    //   双打左右切 → {kind:"cursor", cursor:fieldIndex ? cursor2 : cursor}
    //   右键招式详情 → {kind:"custom", fn}（上游无 onContext，须新建，见 F-4 §五）
    return [];
  }
}
