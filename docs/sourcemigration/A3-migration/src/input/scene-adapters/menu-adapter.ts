/**
 * menu-adapter.ts —— 场景适配器：菜单与设置（`MENU` / `SETTINGS*` / `OPTION_SELECT`）
 * ---------------------------------------------------------------------------
 * 归属：前端 S6-4（场景适配）｜ 来源：F-8（接口先定，实现后填）
 * 覆盖矩阵：F-4 §一 第 2 行「菜单与设置」→ F-4 §二「场景 2」
 * 承接清单：F-7 §二 #7/#8/#14（设置下拉、选项开关、菜单行）
 * 锚点树  ：90df65097b6d（v1.11.22）｜ 定位：src/input/scene-adapters/menu-adapter.ts
 *
 * 状态：**桩（stub）** —— 实现待 M5 解锁后由 S6-4 填充。
 * ---------------------------------------------------------------------------
 * @module input/scene-adapters/menu
 */

import { UiMode } from "#enums/ui-mode";
import type { InteractionSpec, SceneAdapter } from "../types.js";

export class MenuAdapter implements SceneAdapter {
  readonly matrixRow = 2;
  readonly label = "菜单与设置（各子页）";
  readonly modes = [
    UiMode.MENU,
    UiMode.MENU_OPTION_SELECT,
    UiMode.SETTINGS,
    UiMode.SETTINGS_DISPLAY,
    UiMode.SETTINGS_AUDIO,
    UiMode.SETTINGS_GAMEPAD,
    UiMode.SETTINGS_KEYBOARD,
    UiMode.GAMEPAD_BINDING,
    UiMode.KEYBOARD_BINDING,
    UiMode.OPTION_SELECT,
  ] as const;

  /** 归一版 `pointerReady()`（F-7 §3.4） */
  isActive(): boolean {
    // TODO(S6-4): 见 F-4 §二「场景 2」
    return false;
  }

  /** 本场景的声明式交互条目 */
  specs(): InteractionSpec[] {
    // TODO(S6-4): 菜单行 / 设置行 → {kind:"cursor"}；开关类 → {kind:"cursor", then:Button.SUBMIT}
    //             下拉（containers/dropdown.ts）→ {kind:"custom", fn:() => dropdown.toggleOptionState(i)}
    return [];
  }
}
