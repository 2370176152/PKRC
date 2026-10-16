/**
 * command-adapter.ts —— 场景适配器：战斗指令（`UiMode.COMMAND`）
 * ---------------------------------------------------------------------------
 * 归属：前端 S6-4（场景适配）｜ 来源：F-8（接口先定，实现后填）
 * 覆盖矩阵：F-4 §一 第 6 行「战斗指令 Command」（右键「查看信息」）
 * 承接清单：F-7 上游 `command-ui-handler.ts`（产物无独立 pointerdown，需新增命中）
 * 锚点树  ：90df65097b6d（v1.11.22）｜ 定位：src/input/scene-adapters/command-adapter.ts
 *
 * 状态：**桩（stub）** —— 实现待 M5 解锁后由 S6-4 填充。
 * ---------------------------------------------------------------------------
 * @module input/scene-adapters/command
 */

import { UiMode } from "#enums/ui-mode";
import type { InteractionSpec, SceneAdapter } from "../types.js";

export class CommandAdapter implements SceneAdapter {
  readonly matrixRow = 6;
  readonly label = "战斗指令 Command";
  readonly modes = [UiMode.COMMAND] as const;

  /** 归一版 `pointerReady()`（F-7 §3.4） */
  isActive(): boolean {
    // TODO(S6-4): 见 F-4 §二「场景 6」
    return false;
  }

  /** 本场景的声明式交互条目 */
  specs(): InteractionSpec[] {
    // TODO(S6-4):
    //   指令按钮 → {kind:"cursor", cursor:Command.FIGHT|POKEMON|TERA…}
    //   查看信息（右键）→ {kind:"custom", fn}（上游无 onContext，须新建，见 F-4 §五）
    //   注：上游 setCursor(command-ui-handler.ts:219) 已存在，鼠标只需调用它
    return [];
  }
}
