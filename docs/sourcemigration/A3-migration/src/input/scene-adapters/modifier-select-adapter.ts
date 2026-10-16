/**
 * modifier-select-adapter.ts —— 场景适配器：道具选择 / 商店（`UiMode.MODIFIER_SELECT`）
 * ---------------------------------------------------------------------------
 * 归属：前端 S6-4（场景适配）｜ 来源：F-8（接口先定，实现后填）
 * 覆盖矩阵：F-4 §一 第 9 行「道具选择 / 商店 Modifier」
 * 承接清单：F-7 上游 `modifier-select-ui-handler.ts`（产物无独立 pointerdown，需新增命中）
 * 锚点树  ：90df65097b6d（v1.11.22）｜ 定位：src/input/scene-adapters/modifier-select-adapter.ts
 *
 * 状态：**桩（stub）** —— 实现待 M5 解锁后由 S6-4 填充。
 * ---------------------------------------------------------------------------
 * @module input/scene-adapters/modifier-select
 */

import { UiMode } from "#enums/ui-mode";
import type { InteractionSpec, SceneAdapter } from "../types.js";

export class ModifierSelectAdapter implements SceneAdapter {
  readonly matrixRow = 9;
  readonly label = "道具选择 / 商店 Modifier";
  readonly modes = [UiMode.MODIFIER_SELECT] as const;

  /** 归一版 `pointerReady()`（F-7 §3.4） */
  isActive(): boolean {
    // TODO(S6-4): 见 F-4 §二「场景 9」
    return false;
  }

  /** 本场景的声明式交互条目 */
  specs(): InteractionSpec[] {
    // TODO(S6-4):
    //   卡片点击 → {kind:"cursor", cursor:cardIndex}   （上游 setCursor modifier-select-ui-handler.ts:537）
    //   重掷/跳过 → {kind:"cursor", cursor:1|2|3}      （注意 rerollButtonContainer.visible 判定）
    //   翻页     → {kind:"scroll", delta}
    return [];
  }
}
