/**
 * summary-adapter.ts —— 场景适配器：宝可梦摘要（`UiMode.SUMMARY`）
 * ---------------------------------------------------------------------------
 * 归属：前端 S6-4（场景适配）｜ 来源：F-8（接口先定，实现后填）
 * 覆盖矩阵：F-4 §一 第 4 行「宝可梦摘要 Summary」
 * 承接清单：F-7 §二 #6（页签 / 招式行 / 返回 / 翻页）
 * 锚点树  ：90df65097b6d（v1.11.22）｜ 定位：src/input/scene-adapters/summary-adapter.ts
 *
 * 状态：**桩（stub）** —— 实现待 M5 解锁后由 S6-4 填充。
 * ---------------------------------------------------------------------------
 * @module input/scene-adapters/summary
 */

import { UiMode } from "#enums/ui-mode";
import type { InteractionSpec, SceneAdapter } from "../types.js";

export class SummaryAdapter implements SceneAdapter {
  readonly matrixRow = 4;
  readonly label = "宝可梦摘要 Summary";
  readonly modes = [UiMode.SUMMARY] as const;

  /** 归一版 `pointerReady()`（F-7 §3.4） */
  isActive(): boolean {
    // TODO(S6-4): 见 F-4 §二「场景 4」
    return false;
  }

  /** 本场景的声明式交互条目 */
  specs(): InteractionSpec[] {
    // TODO(S6-4):
    //   页签点击   → {kind:"cursor", cursor:page}               （上游 setCursor(page) summary-ui-handler.ts:694）
    //   招式行点击 → {kind:"cursor", cursor:moveCursor}
    //   返回       → {kind:"button", button:Button.CANCEL}
    //   滚轮翻页   → {kind:"scroll", delta}
    return [];
  }
}
