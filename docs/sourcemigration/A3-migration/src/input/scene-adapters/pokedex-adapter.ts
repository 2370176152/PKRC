/**
 * pokedex-adapter.ts —— 场景适配器：图鉴（`POKEDEX` / `POKEDEX_PAGE` / `POKEDEX_SCAN`）
 * ---------------------------------------------------------------------------
 * 归属：前端 S6-4（场景适配）｜ 来源：F-8（接口先定，实现后填）
 * 覆盖矩阵：F-4 §一 第 11 行「图鉴 Pokedex」
 * 承接清单：F-7 §二 #12/#13/#16（列表 / 返回 / 筛选 / 滚轮）
 * 锚点树  ：90df65097b6d（v1.11.22）｜ 定位：src/input/scene-adapters/pokedex-adapter.ts
 *
 * 状态：**桩（stub）** —— 实现待 M5 解锁后由 S6-4 填充。
 * ---------------------------------------------------------------------------
 * @module input/scene-adapters/pokedex
 */

import { UiMode } from "#enums/ui-mode";
import type { InteractionSpec, SceneAdapter } from "../types.js";

export class PokedexAdapter implements SceneAdapter {
  readonly matrixRow = 11;
  readonly label = "图鉴 Pokedex";
  readonly modes = [UiMode.POKEDEX, UiMode.POKEDEX_PAGE, UiMode.POKEDEX_SCAN] as const;

  /** 归一版 `pointerReady()`（F-7 §3.4） */
  isActive(): boolean {
    // TODO(S6-4): 见 F-4 §二「场景 11」
    return false;
  }

  /** 本场景的声明式交互条目 */
  specs(): InteractionSpec[] {
    // TODO(S6-4):
    //   列表点击 → {kind:"cursor", cursor:idx}   （pokedex-ui-handler.ts，含 scrollCursor 还原）
    //   返回     → {kind:"button", button:Button.CANCEL}
    //   筛选栏   → {kind:"cursor", cursor:filterBarCursor}
    //   滚轮     → {kind:"scroll", delta} + ScrollableGridHelper.processInput()
    return [];
  }
}
