/**
 * starter-select-adapter.ts —— 场景适配器：选人（`UiMode.STARTER_SELECT`，含二游/PT 入口）
 * ---------------------------------------------------------------------------
 * 归属：前端 S6-4（场景适配）｜ 来源：F-8（接口先定，实现后填）
 * 覆盖矩阵：F-4 §一 第 10 行「选人 Starter（含二游/PT）」
 * 承接清单：F-7 §二 #10/#11/#20/#21（网格 / 队伍槽 / 开始 / 二游搜索）
 * 锚点树  ：90df65097b6d（v1.11.22）｜ 定位：src/input/scene-adapters/starter-select-adapter.ts
 *
 * 状态：**桩（stub）** —— 实现待 M5 解锁后由 S6-4 填充。
 * ---------------------------------------------------------------------------
 * @module input/scene-adapters/starter-select
 */

import { UiMode } from "#enums/ui-mode";
import type { InteractionSpec, SceneAdapter } from "../types.js";

export class StarterSelectAdapter implements SceneAdapter {
  readonly matrixRow = 10;
  readonly label = "选人 Starter（含二游/PT）";
  readonly modes = [UiMode.STARTER_SELECT] as const;

  /** 归一版 `pointerReady()`（F-7 §3.4） */
  isActive(): boolean {
    // TODO(S6-4): 见 F-4 §二「场景 10」
    return false;
  }

  /** 本场景的声明式交互条目 */
  specs(): InteractionSpec[] {
    // TODO(S6-4):
    //   网格选人 → {kind:"cursor", cursor:idx}
    //     索引反算公式须与上游 calcStarterPosition() (starter-select-ui-handler.ts:237) 一致
    //   队伍槽   → {kind:"cursor", cursor:teamSlot}
    //   筛选栏   → {kind:"cursor", cursor:filterBarCursor}
    //   开始按钮 → {kind:"button", button:Button.ACTION}
    //   二游搜索 → {kind:"custom", fn}（改版新增，上游无 ERYOU，见 F-7 §二 #21）
    //   滚轮网格 → {kind:"scroll", delta} + ScrollableGridHelper.processInput()
    return [];
  }
}
