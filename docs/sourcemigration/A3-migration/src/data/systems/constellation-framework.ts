/**
 * 命座框架（Constellation Framework）—— 自研系统的公共底座
 * ---------------------------------------------------------------------------
 * 来源：game/server/dist/assets/loading-scene-By2k7Qfx.js（.orig 产物）
 * 逆向方式：l(短名,"原函数名") 反查 + 常量赋值精确定位（见 A3 报告 §3 工作流）
 * 锚点树：90df65097b6df76f713e6bd108afa84499e8b993（vite^8 树，A0 §10 决议）
 *
 * 定位：所有自研系统（NIANLI / TALENT / JIEMING / PT_SOUDACHE / P5X / HEALER ...）
 *       共用的「命座 + 节点专属 + 种族值/属性/收益加成」框架。
 *       每个系统通过 registerConstellation(species, codex, { exclusiveNodes }) 挂载。
 *
 * 产物符号对照（去混淆映射，务必逐条保留）：
 *   hI    → registerConstellation
 *   HM    → getConstellations
 *   SU    → hasExclusiveNode$1
 *   US    → constellationNodeIsExclusive
 *   vR    → constellationNodeMode
 *   OEe   → constellationChoiceOptions
 *   sa    → constellationLevel$1
 *   IEe   → constellationRefund
 *   lEe   → applyConstellationBaseStats$1
 *   SSe   → constellationBaseStatBonus
 *   TSe   → constellationTypeMultiplier
 *   LSe   → constellationGainMultiplier
 *   J1    → partyConstellationGainMultiplier
 *   j1    → applyGainMultiplier
 *   lSe   → placeholder（"待完善" 占位命座生成器）
 *
 *   常量：
 *   REe   → CONSTELLATION_CODEX_REGISTRY   (Record<speciesId, codex[]>)
 *   r0    → CONSTELLATION_EXCLUSIVE_REGISTRY (Record<speciesId, {exclusiveNodes, hooks}>)
 *   qA    → CONSTELLATION_SLOTS            (6)
 *   lU    → CONSTELLATION_REFUND_TABLE     ([2,3,4,6,8,10])
 *   nSe   → CONSTELLATION_STAT_GAIN        ({1:15,2:20,5:25})
 *   ASe   → CONSTELLATION_TYPE_MULT        (1.2)
 *   aSe   → CONSTELLATION_GAIN_MULT        (1.15)
 *   ESe   → CONSTELLATION_CHOICE_NODES     ([1,2,3,4,5])
 *   oSe   → CONSTELLATION_STAT_NODES       ([1,2,5])
 *   rSe   → CONSTELLATION_STAT_KEY_MAP     (hp/atk/... → Stat 枚举)
 *   xg    → CONSTELLATION_STAT_OPTIONS     (6 个能力选项)
 *   RSe   → CONSTELLATION_TYPE_OPTIONS     (18 个属性选项)
 *   OSe   → CONSTELLATION_CHOICE_OPTIONS   (按节点 → 选项表)
 *   ISe   → CONSTELLATION_CODEX_DEFAULT    (6 条通用命座说明)
 *
 * ⚠️ 依赖占位：STAT / PokemonType / speciesId 等需接入锚点树，见文件末尾 TODO。
 */

import type { Pokemon } from "#app/field/pokemon";
import { Stat } from "#enums/stat"; // 产物 p
import { PokemonType } from "#enums/pokemon-type"; // 产物 R

// ===========================================================================
// 1. 常量（产物符号对照见文件头）
// ===========================================================================

/** 命座槽位数（产物 qA=6） */
export const CONSTELLATION_SLOTS = 6;

/** 退点表：点亮 N 个节点消耗的总点数（产物 lU=[2,3,4,6,8,10]） */
export const CONSTELLATION_REFUND_TABLE: readonly number[] = [2, 3, 4, 6, 8, 10];

/** 通用命座的种族值加成（产物 nSe={1:15,2:20,5:25}） */
export const CONSTELLATION_STAT_GAIN: Readonly<Record<number, number>> = { 1: 15, 2: 20, 5: 25 };

/** 「属蕴」节点（3）的通用属性伤害加成（产物 ASe=1.2） */
export const CONSTELLATION_TYPE_MULT = 1.2;

/** 「财源」节点（4）的通用收益加成（产物 aSe=1.15） */
export const CONSTELLATION_GAIN_MULT = 1.15;

/** 可选「专属 or 通用」的节点（产物 ESe=[1,2,3,4,5]） */
export const CONSTELLATION_CHOICE_NODES: readonly number[] = [1, 2, 3, 4, 5];

/** 提供种族值加成的节点（产物 oSe=[1,2,5]） */
export const CONSTELLATION_STAT_NODES: readonly number[] = [1, 2, 5];

/** 节点 → Pokemon 能力字段映射（产物 rSe） */
export const CONSTELLATION_STAT_KEY_MAP: Readonly<Record<string, Stat>> = {
  hp: Stat.HP,
  atk: Stat.ATK,
  def: Stat.DEF,
  spatk: Stat.SPATK,
  spdef: Stat.SPDEF,
  spd: Stat.SPD,
};

// ===========================================================================
// 2. 命座描述（通用 6 条，产物 ISe —— 逐字保留，行为契约）
// ===========================================================================

export interface ConstellationCodexEntry {
  name: string;
  description: string;
}

/** 通用命座说明（产物 ISe，逐字） */
export const CONSTELLATION_CODEX_DEFAULT: readonly ConstellationCodexEntry[] = [
  { name: "攻性", description: "任选一项种族值 +15（第 6 命点亮后 +30）。" },
  { name: "守性", description: "任选一项种族值 +20（第 6 命点亮后 +40）。" },
  { name: "属蕴", description: "选择一个属性，该属性招式的伤害 +20%。" },
  {
    name: "财源",
    description: "选择本局PT／金币／结算PT，对应收益 +15%。队伍中每个不同种族的 4 命各计一次，可叠加。",
  },
  { name: "体格", description: "任选一项种族值 +25（第 6 命点亮后 +50）。" },
  { name: "共鸣", description: "第 1、2、5 命的通用种族值加成翻倍（该层或第 6 命选「专属」则不翻倍）。" },
];

/** 「待完善」占位命座（产物 lSe，逐字） */
export function placeholder(): ConstellationCodexEntry {
  return {
    name: "待完善",
    description: "该命座的专属效果尚在设计中，点亮后会在效果上线时自动生效。",
  };
}

// ===========================================================================
// 3. 选项表（产物品 xg / RSe / OSe）
// ===========================================================================

export interface ConstellationChoiceOption {
  value: string | PokemonType;
  label: string;
}

/** 能力选项（产物 xg） */
export const CONSTELLATION_STAT_OPTIONS: readonly ConstellationChoiceOption[] = (
  [
    ["hp", "HP"],
    ["atk", "物攻"],
    ["def", "物防"],
    ["spatk", "特攻"],
    ["spdef", "特防"],
    ["spd", "速度"],
  ] as const
).map(([value, label]) => ({ value, label }));

/** 属性选项（产物 RSe，18 项，顺序不可变） */
export const CONSTELLATION_TYPE_OPTIONS: readonly ConstellationChoiceOption[] = (
  [
    [PokemonType.NORMAL, "一般"],
    [PokemonType.FIGHTING, "格斗"],
    [PokemonType.FLYING, "飞行"],
    [PokemonType.POISON, "毒"],
    [PokemonType.GROUND, "地面"],
    [PokemonType.ROCK, "岩石"],
    [PokemonType.BUG, "虫"],
    [PokemonType.GHOST, "幽灵"],
    [PokemonType.STEEL, "钢"],
    [PokemonType.FIRE, "火"],
    [PokemonType.WATER, "水"],
    [PokemonType.GRASS, "草"],
    [PokemonType.ELECTRIC, "电"],
    [PokemonType.PSYCHIC, "超能力"],
    [PokemonType.ICE, "冰"],
    [PokemonType.DRAGON, "龙"],
    [PokemonType.DARK, "恶"],
    [PokemonType.FAIRY, "妖精"],
  ] as const
).map(([value, label]) => ({ value, label }));

/** 节点 → 通用选项表（产物 OSe） */
export const CONSTELLATION_CHOICE_OPTIONS: Readonly<Record<number, readonly ConstellationChoiceOption[]>> = {
  1: CONSTELLATION_STAT_OPTIONS,
  2: CONSTELLATION_STAT_OPTIONS,
  3: CONSTELLATION_TYPE_OPTIONS,
  4: [
    { value: "pt", label: "本局PT" },
    { value: "money", label: "金币" },
    { value: "ptSettle", label: "结算PT" },
  ],
  5: CONSTELLATION_STAT_OPTIONS,
};

// ===========================================================================
// 4. 注册表（产物 REe / r0）
// ===========================================================================

/** 专属节点钩子：由各系统提供（产物 r0[speciesId] 的其余字段） */
export interface ConstellationExclusiveHooks {
  /** 专属节点覆盖种族值加成：applyBaseStats(node, stats, level, choices) */
  applyBaseStats?(node: number, stats: number[], level: number, choices: Record<number, unknown>): void;
  /** 专属「属蕴」节点伤害倍率：typeDamageMultiplier(pokemon, level, choices) */
  typeDamageMultiplier?(pokemon: Pokemon, level: number, choices: Record<number, unknown>): number;
  /** 专属「财源」节点收益倍率：gainMultiplier(pokemon, level, choices) */
  gainMultiplier?(pokemon: Pokemon, level: number, choices: Record<number, unknown>): number;
}

export interface ConstellationRegistration extends ConstellationExclusiveHooks {
  /** 该系统哪些节点是「专属」（可被玩家选为专属效果） */
  exclusiveNodes: number[];
}

/** codex 注册表（产物 REe） */
const CONSTELLATION_CODEX_REGISTRY: Record<number, ConstellationCodexEntry[]> = {};

/** 专属注册表（产物 r0） */
const CONSTELLATION_EXCLUSIVE_REGISTRY: Record<number, ConstellationRegistration> = {};

// ===========================================================================
// 5. 框架函数（逐条对应产物实现，逻辑等价）
// ===========================================================================

/**
 * 注册系统命座（产物 hI "registerConstellation"）。
 * @param speciesId 种族 id
 * @param codex 该系统 6 条命座说明（可选）
 * @param registration 专属节点配置 + 钩子（可选）
 */
export function registerConstellation(
  speciesId: number,
  codex?: ConstellationCodexEntry[],
  registration?: ConstellationRegistration,
): void {
  if (codex) {
    CONSTELLATION_CODEX_REGISTRY[speciesId] = codex;
  }
  if (registration) {
    CONSTELLATION_EXCLUSIVE_REGISTRY[speciesId] = registration;
  }
}

/**
 * 取命座列表（产物 HM "getConstellations"）。
 * 系统注册的 codex 优先，缺项回退通用，再缺回退 placeholder。
 */
export function getConstellations(speciesId: number): ConstellationCodexEntry[] {
  const custom = CONSTELLATION_CODEX_REGISTRY[speciesId];
  return Array.from(
    { length: CONSTELLATION_SLOTS },
    (_, i) => custom?.[i] ?? CONSTELLATION_CODEX_DEFAULT[i] ?? placeholder(),
  );
}

/** 是否含专属节点（产物 SU "hasExclusiveNode$1"） */
export function hasExclusiveNode$1(speciesId: number, node: number): boolean {
  return CONSTELLATION_EXCLUSIVE_REGISTRY[speciesId]?.exclusiveNodes.includes(node) ?? false;
}

/** 节点模式：exclusive | generic（产物 vR "constellationNodeMode"） */
export function constellationNodeMode(
  speciesId: number,
  node: number,
  data?: ConstellationData,
): "exclusive" | "generic" {
  if (!hasExclusiveNode$1(speciesId, node)) {
    return "generic";
  }
  return data?.constellationModes?.[speciesId]?.[node] ?? "exclusive";
}

/** 节点是否已激活且为专属（产物 US "constellationNodeIsExclusive"） */
export function constellationNodeIsExclusive(
  speciesId: number,
  node: number,
  data?: ConstellationData,
): boolean {
  if (constellationLevel$1(data, speciesId) < node) {
    return false;
  }
  return constellationNodeMode(speciesId, node, data) === "exclusive";
}

/** 该节点的通用选项（产物 OEe "constellationChoiceOptions"） */
export function constellationChoiceOptions(
  speciesId: number,
  node: number,
  mode: "exclusive" | "generic" = constellationNodeMode(speciesId, node),
): readonly ConstellationChoiceOption[] | undefined {
  if (mode !== "exclusive") {
    return CONSTELLATION_CHOICE_NODES.includes(node) ? CONSTELLATION_CHOICE_OPTIONS[node] : undefined;
  }
  return undefined;
}

/** 读命座等级（产物 sa "constellationLevel$1"，0..6 clamp） */
export function constellationLevel$1(data: ConstellationData | undefined, speciesId: number): number {
  const level = data?.constellations?.[speciesId] ?? 0;
  return Math.max(0, Math.min(CONSTELLATION_SLOTS, level));
}

/** 退点（产物 IEe "constellationRefund"）：点亮前 level 个节点的累计消耗 */
export function constellationRefund(level: number): number {
  const n = Math.max(0, Math.min(level, CONSTELLATION_SLOTS));
  let total = 0;
  for (let i = 0; i < n; i++) {
    total += CONSTELLATION_REFUND_TABLE[i];
  }
  return total;
}

/** 通用种族值加成写入（产物 lEe "applyConstellationBaseStats$1"） */
export function applyConstellationBaseStats$1(
  stats: number[],
  speciesId: number,
  data: ConstellationData | undefined,
): void {
  const level = constellationLevel$1(data, speciesId);
  if (level <= 0) {
    return;
  }
  const choices = data?.constellationChoices?.[speciesId] ?? {};
  const registration = CONSTELLATION_EXCLUSIVE_REGISTRY[speciesId];
  // 第 6 命选「通用」→ 翻倍
  const doubled = level >= CONSTELLATION_SLOTS && constellationNodeMode(speciesId, 6, data) === "generic";

  for (const node of CONSTELLATION_STAT_NODES) {
    if (node > level) {
      continue;
    }
    if (constellationNodeMode(speciesId, node, data) === "exclusive") {
      registration?.applyBaseStats?.(node, stats, level, choices);
      continue;
    }
    const key = CONSTELLATION_STAT_KEY_MAP[choices[node] as string];
    if (key !== undefined) {
      stats[key] += CONSTELLATION_STAT_GAIN[node] * (doubled ? 2 : 1);
    }
  }
}

/** 种族值加成结果（产物 SSe "constellationBaseStatBonus"，6 维数组） */
export function constellationBaseStatBonus(speciesId: number, data: ConstellationData | undefined): number[] {
  const stats = new Array(6).fill(0);
  applyConstellationBaseStats$1(stats, speciesId, data);
  return stats;
}

/** 「属蕴」属性伤害倍率（产物 TSe "constellationTypeMultiplier"） */
export function constellationTypeMultiplier(
  type: PokemonType,
  speciesId: number,
  data: ConstellationData | undefined,
): number {
  const level = constellationLevel$1(data, speciesId);
  if (level < 3) {
    return 1;
  }
  const choices = data?.constellationChoices?.[speciesId] ?? {};
  if (constellationNodeMode(speciesId, 3, data) === "exclusive") {
    return CONSTELLATION_EXCLUSIVE_REGISTRY[speciesId]?.typeDamageMultiplier?.(undefined as unknown as Pokemon, level, choices) ?? 1;
  }
  return choices[3] === type ? CONSTELLATION_TYPE_MULT : 1;
}

/** 「财源」收益倍率（产物 LSe "constellationGainMultiplier"） */
export function constellationGainMultiplier(
  pokemon: Pokemon,
  speciesId: number,
  data: ConstellationData | undefined,
): number {
  const level = constellationLevel$1(data, speciesId);
  if (level < 4) {
    return 1;
  }
  const choices = data?.constellationChoices?.[speciesId] ?? {};
  if (constellationNodeMode(speciesId, 4, data) === "exclusive") {
    return CONSTELLATION_EXCLUSIVE_REGISTRY[speciesId]?.gainMultiplier?.(pokemon, level, choices) ?? 1;
  }
  return choices[4] === pokemon.species.speciesId ? CONSTELLATION_GAIN_MULT : 1;
}

/** 队伍总收益倍率：各不同种族 4 命之和（产物 J1 "partyConstellationGainMultiplier"） */
export function partyConstellationGainMultiplier(
  pokemon: Pokemon,
  speciesIds: number[],
  data: ConstellationData | undefined,
): number {
  let bonus = 0;
  for (const speciesId of new Set(speciesIds)) {
    bonus += constellationGainMultiplier(pokemon, speciesId, data) - 1;
  }
  return 1 + bonus;
}

/** 应用收益倍率（产物 j1 "applyGainMultiplier"，四舍五入取整） */
export function applyGainMultiplier(value: number, multiplier: number): number {
  return multiplier === 1 ? value : value + Math.round(value * (multiplier - 1));
}

// ===========================================================================
// 6. 持久化数据结构（产物 pokemon.customPokemonData / gameData 内存形态）
// ===========================================================================

/** 命座持久化数据（挂在各宝可梦上，由存档模块序列化） */
export interface ConstellationData {
  /** speciesId → 已点亮等级（0..6） */
  constellations?: Record<number, number>;
  /** speciesId → 节点 → 玩家选择的值（能力 key / 属性 / pt|money|ptSettle） */
  constellationChoices?: Record<number, Record<number, unknown>>;
  /** speciesId → 节点 → 模式覆盖（"exclusive" | "generic"） */
  constellationModes?: Record<number, Record<number, "exclusive" | "generic">>;
}

// ===========================================================================
// 7. 🗺️ 注册索引（产物 hI 调用点全量反查，A3 跨系统对照表）
// ---------------------------------------------------------------------------
// 产物中共 8 处 real 注册（hI 调用 9 次，含 1 次函数定义）。每处 =
//   for(const n of <SPECIES[]>) registerConstellation(n, <CODEX[]>, <{exclusiveNodes}>)
//   | registerConstellation(e.<SPECIES>, <CODEX[]>, <{exclusiveNodes}>)
//
// 节点常量 = 该系统 6 个命座槽的「专属可选项」位置（其余槽为通用固定项）。
//
// ┌───┬──────────────────────┬─────────────────────────┬───────────────────────────────┐
// │ # │ 系统                 │ 产品符号 (codex/reg)    │ 专属节点常量（值）            │
// ├───┼──────────────────────┼─────────────────────────┼───────────────────────────────┤
// │ 1 │ CALLINGCARD 偷心怪盗 │ PSe / _Se               │ o0=1 SEe=2 TEe=3 LEe=5 z1=6   │
// │ 2 │ MELOETTA 旋律        │ $Se / QSe               │ mw=1 PEe=2 _Ee=3 GEe=4 gEe=5 Bw=6 │
// │ 3 │ MEW 属性编织         │ gTe / HTe               │ Kw=1 xEe=2 VEe=3 kEe=4 ZEe=5 mM=6 │
// │ 4 │ MANAPHY/PHIONE 海守  │ mTe / BTe               │ JEe=1 jEe=2 zEe=3 qEe=4 ere=5 vw=6 │
// │ 5 │ DIANXIN 感电点心     │ Que / Jue               │ zm=1 Hre=2 pre=3 jw=5 Og=6    │
// │ 6 │ HEALER 治疗守护      │ $ce / Qce               │ eb=1 pU=2 Kre=3 tb=4 Wre=5 lg=6 │
// │ 7 │ NIANLI 念力          │ tPe / sPe               │ U0=1 _Re=2 Db=3 GRe=5 dg=6    │
// │ 8 │ 赤心 潜心(火)        │ P1e / _1e               │ g0=0 OOe=2 IOe=3 Pg=5 H0=6    │
// └───┴──────────────────────┴─────────────────────────┴───────────────────────────────┘
//
// 物种数组（产物）：
//   CALLINGCARD : [SPRIGATITO, MIME_JR, FENNEKIN, MISDREAVUS]           (CEe)
//   MELOETTA    : MELOETTA                                              (直接注册)
//   MEW         : MEW                                                   (直接注册)
//   MANAPHY群   : [MANAPHY, PHIONE]                                     (ww)
//   DIANXIN     : [MAGNEMITE, JOLTIK, MAREEP, TOGEDEMARU]               (mre)
//   HEALER      : [HAPPINY, MILTANK, COMFEY, INDEEDEE]                  (Vre)
//   NIANLI      : [ABRA, WYNAUT, GOTHITA, ELGYEM]                       (mRe)
//   赤心        : [VULPIX, SALANDIT, MAGBY, FUECOCO]                    (TOe)
//
// 通用节点常量（首系统复用，产物 o0=1..z1=6 邻近区）：
//   NEe=4 uEe=6（CALLINGCARD 上限用）; gm=4 ase=1 cSe=2 Ese=4 hSe=3.2 CSe=13 ...
//
// ⚠️ 注意：ERYOU 有独立分支（产物 NRe/gN，见 sfe/ife/nfe），不走 registerConstellation。
//    迁移时 ERYOU 的命座逻辑须单独还原（见 eryou-system.ts）。
// ===========================================================================

// ===========================================================================
// TODO(接入锚点 90df65097b6d)
// ---------------------------------------------------------------------------
// 1. `Stat`     ← #enums/stat（产物 p）
// 2. `PokemonType` ← #enums/pokemon-type（产物 R）
// 3. `Pokemon`  ← #app/field/pokemon（产物中 pokemon.species.speciesId）
// 4. 该框架在产物中与 ERYOU 同名函数并存（NRe/gN 版本 = ERYOU 独立分支），
//    迁移时以本文件的通用版本为准，ERYOU 分支单独处理（见 eryou-system.ts TODO）。
// 5. 与存档接线的字段名需对照 A2 清单中 `constellations` / `constellationChoices`
//    / `constellationModes` 的实存字段，A4 阶段逐条比对。
// ===========================================================================
