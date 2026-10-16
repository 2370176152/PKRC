/**
 * title-adapter.ts —— 场景适配器：标题 / 主菜单（`UiMode.TITLE`）
 * ---------------------------------------------------------------------------
 * 归属：前端 S6-4（场景适配）｜ 来源：F-8（接口先定，实现后填）
 * 覆盖矩阵：F-4 §一 第 1 行「标题 / 主菜单」→ F-4 §二「场景 1」
 * 承接清单：F-7 §二（本场景改版外挂 canvas 交互点）
 * 锚点树  ：90df65097b6d（v1.11.22）｜ 定位：src/input/scene-adapters/title-adapter.ts
 *
 * 状态：**桩（stub）** —— 接口签名已冻结，实现待 M5 解锁后由 S6-4 填充。
 * ---------------------------------------------------------------------------
 * @module input/scene-adapters/title
 */

import { UiMode } from "#enums/ui-mode";
import type { InteractionSpec, SceneAdapter } from "../types.js";

export class TitleAdapter implements SceneAdapter {
  readonly matrixRow = 1;
  readonly label = "标题 / 主菜单";
  readonly modes = [UiMode.TITLE] as const;

  /** 归一版 `pointerReady()`（F-7 §3.4）：visible && active && !busy && !closing && mode 命中 */
  isActive(): boolean {
    // TODO(S6-4): 见 F-4 §二「场景 1」
    return false;
  }

  /** 本场景的声明式交互条目 */
  specs(): InteractionSpec[] {
    // TODO(S6-4): 主菜单行 → {kind:"cursor", cursor:row, then:Button.ACTION}
    return [];
  }
}
