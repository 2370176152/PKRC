/**
 * scene-adapters/index.ts —— 场景适配器汇总（S6-4 / S6-5 注册表入口）
 * ---------------------------------------------------------------------------
 * 归属：前端 S6-4（场景适配）｜ 来源：F-8（接口先定，实现后填）
 * 锚点树  ：90df65097b6d（v1.11.22）｜ 定位：src/input/scene-adapters/index.ts
 *
 * 说明：本文件把 13 个适配器（12 核心 + 1 上游复用）汇总为注册表初始集合，
 *       由 `src/input/interaction-registry.ts`（S6-4 实现）消费。
 *
 * 状态：**桩（stub）** —— 适配器实现待 M5 解锁后填充；本汇总表结构即最终形态。
 * ---------------------------------------------------------------------------
 * @module input/scene-adapters
 */

import type { SceneAdapter } from "../types.js";

import { CommandAdapter } from "./command-adapter.js";
import { FightAdapter } from "./fight-adapter.js";
import { MenuAdapter } from "./menu-adapter.js";
import { ModalAdapter } from "./modal-adapter.js";
import { ModifierSelectAdapter } from "./modifier-select-adapter.js";
import { PartyAdapter } from "./party-adapter.js";
import { PokedexAdapter } from "./pokedex-adapter.js";
import { PkrcModesAdapter } from "./pkrc-modes-adapter.js";
import { StarterSelectAdapter } from "./starter-select-adapter.js";
import { SummaryAdapter } from "./summary-adapter.js";
import { SuperBackpackAdapter } from "./super-backpack-adapter.js";
import { TargetSelectAdapter } from "./target-select-adapter.js";
import { TitleAdapter } from "./title-adapter.js";

export {
  CommandAdapter,
  FightAdapter,
  MenuAdapter,
  ModalAdapter,
  ModifierSelectAdapter,
  PartyAdapter,
  PokedexAdapter,
  PkrcModesAdapter,
  StarterSelectAdapter,
  SummaryAdapter,
  SuperBackpackAdapter,
  TargetSelectAdapter,
  TitleAdapter,
};

/**
 * 全部场景适配器。
 *
 * 前 12 项 = v1 覆盖矩阵 12 场景（F-4 §一 第 1..12 行）；
 * 第 13 项 = 模态族（上游已有，F-4 补录行）。
 */
export const SCENE_ADAPTERS: readonly SceneAdapter[] = [
  new TitleAdapter(), // row 1
  new MenuAdapter(), // row 2
  new PartyAdapter(), // row 3
  new SummaryAdapter(), // row 4
  new SuperBackpackAdapter(), // row 5
  new CommandAdapter(), // row 6
  new FightAdapter(), // row 7
  new TargetSelectAdapter(), // row 8
  new ModifierSelectAdapter(), // row 9
  new StarterSelectAdapter(), // row 10
  new PokedexAdapter(), // row 11
  new PkrcModesAdapter(), // row 12
  new ModalAdapter(), // row 13（上游复用）
];

/** 按覆盖矩阵行号取适配器（S6-4 逐格验收辅助） */
export function getAdapterByRow(row: number): SceneAdapter | undefined {
  return SCENE_ADAPTERS.find((a) => a.matrixRow === row);
}
