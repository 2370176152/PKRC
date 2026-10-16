/**
 * party-adapter.ts —— 场景适配器：队伍（`UiMode.PARTY`）
 * ---------------------------------------------------------------------------
 * 归属：前端 S6-4（场景适配）｜ 来源：F-8（接口先定，实现后填）
 * 覆盖矩阵：F-4 §一 第 3 行「队伍 Party」（点/拖/悬停/焦点/滚轮/右键 六列全开）
 * 承接清单：F-7 §二 #1/#2/#3（选项 / 槽位 / 取消）+ 全局拖拽
 * 锚点树  ：90df65097b6d（v1.11.22）｜ 定位：src/input/scene-adapters/party-adapter.ts
 *
 * 状态：**桩（stub）** —— 实现待 M5 解锁后由 S6-4 填充。
 * ---------------------------------------------------------------------------
 * @module input/scene-adapters/party
 */

import { UiMode } from "#enums/ui-mode";
import type { InteractionSpec, SceneAdapter } from "../types.js";

export class PartyAdapter implements SceneAdapter {
  readonly matrixRow = 3;
  readonly label = "队伍 Party";
  readonly modes = [UiMode.PARTY] as const;

  /** 归一版 `pointerReady()`（F-7 §3.4） */
  isActive(): boolean {
    // TODO(S6-4): 见 F-4 §二「场景 3」
    return false;
  }

  /** 本场景的声明式交互条目 */
  specs(): InteractionSpec[] {
    // TODO(S6-4):
    //   槽位点击   → {kind:"cursor", cursor:slotIndex}          （上游 setCursor ↑ ui.ts:471）
    //   选项菜单   → {kind:"cursor", cursor:optionsCursor, then:Button.ACTION}
    //   取消/返回  → {kind:"button", button:Button.CANCEL}
    //   道具换位   → {kind:"scroll", delta}（拖拽，F-3 gesture-resolver 的 drag）
    //   右键快速查看 → {kind:"custom", fn}（上游无 onContext，须新建，见 F-4 §五）
    return [];
  }
}
