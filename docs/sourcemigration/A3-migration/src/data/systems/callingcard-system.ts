/**
 * 偷心怪盗（CALLINGCARD）—— 自研系统迁移
 * ---------------------------------------------------------------------------
 * 来源：game/server/dist/assets/loading-scene-By2k7Qfx.js（.orig 产物）@1876923 起
 * 逆向方式：`l(短名,"原函数名")` 反查 + 常量赋值精确定位（见 A3-迁移规范 §3）
 * 锚点树：90df65097b6df76f713e6bd108afa84499e8b993
 *
 * 定位：命座接入组 7 系统之一（A3-05）。物种为「捣蛋小妖系 / 吸盘魔偶 / 火狐狸 / 梦妖」
 *       （`CEe`），点亮 1 命后成为【偷心怪盗】角色：对残血敌人造成伤害积攒【预告信】，
 *       满 4（6）层消耗进入一次自身额外回合。经公共底座 `registerConstellation`
 *       注册 6 个命座节点的 codex 与 hooks（`exclusiveNodes` 覆盖 1/2/3/5/6）。
 *
 * 产物符号对照（去混淆映射，务必逐条保留）：
 *   hI   → registerConstellation        （公共底座，来自 constellation-framework.ts）
 *   sa   → constellationLevel$1         （公共底座）
 *   vR   → constellationNodeMode        （公共底座）
 *   US   → constellationNodeIsExclusive （公共底座）
 *   Z    → pokemon.battleMessage/debugLogger `z`
 *   E    → globalScene
 *   返回 `E` 的辅助：`Fl` → callingCardNodeActive
 *
 *   常量：
 *   o0   → CALLINGCARD_NODE.PREVIEW_LETTER  (=1)
 *   SEe  → CALLINGCARD_NODE.PREPARATION     (=2)
 *   TEe  → CALLINGCARD_NODE.FAITH           (=3)
 *   LEe  → CALLINGCARD_NODE.TECHNIQUE       (=5)
 *   z1   → CALLINGCARD_NODE.FORECAST        (=6)
 *   NEe  → CALLINGCARD_MAX_BASE             (=4)
 *   uEe  → CALLINGCARD_MAX_FORECAST         (=6)
 *   gm   → CALLINGCARD_EXTRA_TURN_THRESHOLD (=4)
 *   ase  → CALLINGCARD_GAIN_PER_HIT         (=1)
 *   cSe  → CALLINGCARD_GAIN_ON_KO           (=2)
 *   Ese  → CALLINGCARD_GAIN_ON_ENDURE       (=4)
 *   hSe  → CALLINGCARD_SPREAD_POWER_MULT    (=3.2)
 *   CSe  → CALLINGCARD_SPREAD_POWER_MULT_TALENT (=13)
 *   dSe  → CALLINGCARD_SPREAD_TARGETS       (Set[ALL_NEAR_ENEMIES, ALL_ENEMIES])
 *   MSe  → CALLINGCARD_STAT_STAGE_MULT      (=2)
 *   USe  → CALLINGCARD_HEAL_ON_HIT_RATIO    (=0.5)
 */
import { registerConstellation, type ConstellationCodexEntry } from "./constellation-framework";

// ─────────────────────────────────────────────────────────────
// 0. 依赖（上游 API，待接入锚点源码时改为真实 import）
// ─────────────────────────────────────────────────────────────
// 说明：以下符号来自产物打包上下文，此处按语义命名占位；
//       A3 接入 `90df65097b6d` 源码时逐个替换为真实 import。
declare const globalScene: any; // 产物 `E`
declare const gameMode: any; // 产物 `E.gameMode`
declare const gameData: any; // 产物 `E.gameData`
declare const MoveTarget: any; // 产物 `Le`（MoveTarget enum）
declare const SpeciesId: any; // 产物 `e`（SpeciesId enum）
declare const debugLog: (type: string, msg: string) => void; // 产物 `z`
declare const constellationLevel: (species: any, node: number) => number; // 产物 `sa`
declare const constellationNodeMode: (species: any, node: number, data?: any) => string; // 产物 `vR`

// ─────────────────────────────────────────────────────────────
// 1. 常量（还原自产物 `o0..USe`）
// ─────────────────────────────────────────────────────────────

/** 命座节点索引（`_Se.exclusiveNodes` 的顺序即此常量组） */
export const CALLINGCARD_NODE = {
  /** 偷心怪盗（基础层数机制 / 额外回合） */
  PREVIEW_LETTER: 1, // 产物 `o0`
  /** 怪盗的准备（额外回合内造成伤害后回血 50%） */
  PREPARATION: 2, // 产物 `SEe`
  /** 怪盗的信念（每波首次保命 + 4 层） */
  FAITH: 3, // 产物 `TEe`
  /** 盗亦有道（沿用通用命座：PT/金币/结算PT 三选一 +15%） */
  GENERIC: 4, // 产物 `NEe`（非 exclusive，仅占位）
  /** 怪盗的技巧（额外回合内必中要害） */
  TECHNIQUE: 5, // 产物 `LEe`
  /** 怪盗预告信（不要求半血，上限 4→6） */
  FORECAST: 6, // 产物 `z1`
} as const;

/** 【预告信】层数上限 */
export const CALLINGCARD_MAX_BASE = 4; // 产物 `NEe`
export const CALLINGCARD_MAX_FORECAST = 6; // 产物 `uEe`

/** 进入额外回合所需的【预告信】层数 */
export const CALLINGCARD_EXTRA_TURN_THRESHOLD = 4; // 产物 `gm`

/** 获得【预告信】层数 */
export const CALLINGCARD_GAIN_PER_HIT = 1; // 产物 `ase`
export const CALLINGCARD_GAIN_ON_KO = 2; // 产物 `cSe`
export const CALLINGCARD_GAIN_ON_ENDURE = 4; // 产物 `Ese`（3 命保命时）

/** 额外回合内群体招式威力倍率（普通 / PT 天赋模式） */
export const CALLINGCARD_SPREAD_POWER_MULT = 3.2; // 产物 `hSe`
export const CALLINGCARD_SPREAD_POWER_MULT_TALENT = 13; // 产物 `CSe`

/** 额外回合内强化/弱化等级变化倍率 */
export const CALLINGCARD_STAT_STAGE_MULT = 2; // 产物 `MSe`

/** 2 命「怪盗的准备」额外回合内造成伤害后的回血比例 */
export const CALLINGCARD_HEAL_ON_HIT_RATIO = 0.5; // 产物 `USe`

/** 群体招式的目标类型集合（产物 `dSe`） */
export const CALLINGCARD_SPREAD_TARGETS: readonly number[] = [
  MoveTarget?.ALL_NEAR_ENEMIES,
  MoveTarget?.ALL_ENEMIES,
].filter((x) => x !== undefined);

/** 【偷心怪盗】可用的种族（产物 `CEe`） */
export const CALLINGCARD_SPECIES: readonly number[] = [
  SpeciesId?.SPRIGATITO, // 捣蛋小妖
  SpeciesId?.MIME_JR, // 吸盘魔偶（幼体）
  SpeciesId?.FENNEKIN, // 火狐狸
  SpeciesId?.MISDREAVUS, // 梦妖
].filter((x) => x !== undefined);

/** 系统说明（产物 `PSe`，逐字保留为机读规格） */
export const CALLINGCARD_CODEX: ConstellationCodexEntry[] = [
  {
    name: "偷心怪盗",
    description:
      "对半血以下敌人造成伤害得1层[预告信]、击败得2层（上限4层）；\n" +
      "同一目标每回合只结算1次。消耗4层进入一次自身额外回合（敌方不动）；\n" +
      "回合内群攻威力×320%（PT天赋×1300%）、全部强化／弱化等级变化×2。",
  },
  {
    name: "怪盗的准备",
    description: "额外回合内造成伤害后，回复自身最大生命的 50%。",
  },
  {
    name: "怪盗的信念",
    description:
      "每波次首次被击败时保留 1 点生命、免疫当回合后续伤害，并获得 4 层[预告信]。",
  },
  {
    name: "盗亦有道",
    description:
      "沿用通用命座：本局PT／金币／结算PT 三选一，+15%（每只不同种族各计一次，可叠加）。",
  },
  {
    name: "怪盗的技巧",
    description: "额外回合内，攻击必定击中要害。",
  },
  {
    name: "怪盗预告信",
    description:
      "[偷心怪盗]不再要求敌方半血，造成伤害即可获得[预告信]；[预告信]上限由 4 层提升到 6 层。",
  },
];

/** 命座注册载荷（产物 `_Se`） */
export const CALLINGCARD_CONSTELLATION_PAYLOAD = {
  exclusiveNodes: [
    CALLINGCARD_NODE.PREVIEW_LETTER,
    CALLINGCARD_NODE.PREPARATION,
    CALLINGCARD_NODE.FAITH,
    CALLINGCARD_NODE.TECHNIQUE,
    CALLINGCARD_NODE.FORECAST,
  ],
};

// ─────────────────────────────────────────────────────────────
// 2. 注册（产物 `for(const n of CEe)hI(n,PSe,_Se)`）
// ─────────────────────────────────────────────────────────────

/** 把【偷心怪盗】系统注册进公共命座框架（对每个可用种族各注册一次）。 */
export function registerCallingCardSystem(): void {
  for (const species of CALLINGCARD_SPECIES) {
    registerConstellation(species, CALLINGCARD_CODEX, CALLINGCARD_CONSTELLATION_PAYLOAD);
  }
}

// ─────────────────────────────────────────────────────────────
// 3. 核心函数（逐个还原自产物）
// ─────────────────────────────────────────────────────────────

/** 产物 `DSe` — 某只宝可梦的【预告信】上限（是否点亮 6 命） */
export function callingCardMax(pokemon: any): number {
  return callingCardNodeActive(pokemon, CALLINGCARD_NODE.FORECAST)
    ? CALLINGCARD_MAX_FORECAST
    : CALLINGCARD_MAX_BASE;
}

/** 产物 `eL` — 同上；`Fl(n, z1)` 的等价写法（保留两个产物入口） */
export function callingCardMaxFor(pokemon: any): number {
  return callingCardNodeActive(pokemon, CALLINGCARD_NODE.FORECAST)
    ? CALLINGCARD_MAX_FORECAST
    : CALLINGCARD_MAX_BASE;
}

/** 产物 `fSe` — 是否已点亮 6 命「怪盗预告信」 */
export function callingCardRelaxed(pokemon: any): boolean {
  return callingCardNodeActive(pokemon, CALLINGCARD_NODE.FORECAST);
}

/** 产物 `cEe` — 是否满足进入额外回合的条件（点亮 1 命 + 层数达阈值） */
export function canEnterCallingCardTurnFor(pokemon: any, stacks: number): boolean {
  return (
    callingCardNodeActive(pokemon, CALLINGCARD_NODE.PREVIEW_LETTER) &&
    stacks >= CALLINGCARD_EXTRA_TURN_THRESHOLD
  );
}

/** 产物 `hEe` — 层数钳制到 [0, max] */
export function clampCallingCards(pokemon: any, value: number, max = callingCardMax(pokemon)): number {
  return Math.max(0, Math.min(max, Math.floor(value) || 0));
}

/** 产物 `GSe` — 单次命中可获得的【预告信】层数 */
export function callingCardGainForHit(
  pokemon: any,
  hpRatio: number,
  isFainted: boolean,
): number {
  if (!callingCardNodeActive(pokemon, CALLINGCARD_NODE.PREVIEW_LETTER)) return 0;
  if (isFainted) return CALLINGCARD_GAIN_ON_KO;
  if (callingCardRelaxed(pokemon) || hpRatio < 0.5) return CALLINGCARD_GAIN_PER_HIT;
  return 0;
}

/** 产物 `gSe` — 单次命中可获得的增量（扣除该目标本回合已结算的次数） */
export function callingCardGainDelta(
  pokemon: any,
  hpRatio: number,
  isFainted: boolean,
  alreadyGained: number,
): number {
  const gain = callingCardGainForHit(pokemon, hpRatio, isFainted);
  return Math.max(0, gain - alreadyGained);
}

/** 产物 `dEe` — 判定种族是否属于【偷心怪盗】体系 */
export function isCallingCardSpecies(species: number): boolean {
  return CALLINGCARD_SPECIES.includes(species);
}

/** 产物 `q1` — 读取当前【预告信】层数（经钳制） */
export function callingCardLevelOf(pokemon: any): number {
  const rootSpecies = pokemon.species.getRootSpeciesId();
  if (!isCallingCardSpecies(rootSpecies)) return 0;
  return constellationLevel(gameData?.ptSoudacheData, rootSpecies);
}

/**
 * 产物 `Fl` — 判定某命座节点是否已激活。
 * ⚠️ 与公共底座 `constellationNodeIsExclusive` 语义一致，此处保留产物入口名，
 *    接入锚点时可直接改为调用底座函数。
 */
export function callingCardNodeActive(pokemon: any, node: number): boolean {
  const rootSpecies = pokemon.species.getRootSpeciesId();
  if (!isCallingCardSpecies(rootSpecies)) return false;
  const data = gameData?.ptSoudacheData;
  if (constellationLevel(data, rootSpecies) < node) return false;
  return constellationNodeMode(rootSpecies, node, data) === "exclusive";
}

/** 产物 `eg` — 是否处于【偷心怪盗】额外回合 */
export function inCallingCardExtraTurn(): boolean {
  return !!globalScene.callingCardExtraTurn;
}

/** 产物 `HSe` — 5 命「怪盗的技巧」：额外回合内攻击必定击中要害 */
export function callingCardAlwaysCrit(pokemon: any): boolean {
  if (!inCallingCardExtraTurn() || !pokemon.isPlayer()) return false;
  return callingCardNodeActive(pokemon, CALLINGCARD_NODE.TECHNIQUE);
}

/** 产物 `pSe` — 是否处于 PT 天赋模式（难度动态平衡） */
export function inPtTalentMode(): boolean {
  const mode = globalScene.gameMode;
  return !!mode?.isPtSoudache && !!mode?.hasDynamicBalance;
}

/** 产物 `mSe` — 额外回合内群体招式威力倍率 */
export function callingCardSpreadPowerMultiplier(pokemon: any, move: any): number {
  if (
    !inCallingCardExtraTurn() ||
    !pokemon.isPlayer() ||
    !CALLINGCARD_SPREAD_TARGETS.includes(move.moveTarget) ||
    !callingCardNodeActive(pokemon, CALLINGCARD_NODE.PREVIEW_LETTER)
  ) {
    return 1;
  }
  return inPtTalentMode()
    ? CALLINGCARD_SPREAD_POWER_MULT_TALENT
    : CALLINGCARD_SPREAD_POWER_MULT;
}

/** 产物 `BSe` — 当前回合的全局序（wave*1e4 + turn） */
export function currentRoundKey$2(): number {
  const battle = globalScene.currentBattle;
  return battle ? (battle.waveIndex ?? 0) * 1e4 + (battle.turn ?? 0) : -1;
}

/** 产物 `MEe` — 当前行动序（P5X 模式用 actionCounter，否则用 turn） */
export function currentActionKey$2(): number {
  const battle = globalScene.currentBattle;
  if (!battle) return -1;
  const turn = globalScene.gameMode?.isP5X
    ? (battle.p5xActionCounter ?? -1)
    : (battle.turn ?? -1);
  return (battle.waveIndex ?? 0) * 1e4 + turn;
}

/**
 * 产物 `ySe` — 3 命「怪盗的信念」保命：
 * 每波次首次受到致命伤害时保留 1 点生命、免疫当回合后续伤害，并获得 4 层[预告信]。
 * @returns 是否触发保命
 */
export function tryCallingCardEndure(pokemon: any): boolean {
  if (!pokemon.isPlayer() || !callingCardNodeActive(pokemon, CALLINGCARD_NODE.FAITH)) {
    return false;
  }
  const data = pokemon.customPokemonData;
  if (!data) return false;
  const wave = globalScene.currentBattle?.waveIndex ?? -1;
  if (data.callingCardEndureWave === wave) return false; // 本波已触发过
  data.callingCardEndureWave = wave;
  data.callingCardGuardTurn = currentActionKey$2();
  data.callingCards = clampCallingCards(
    pokemon,
    (data.callingCards ?? 0) + CALLINGCARD_GAIN_ON_ENDURE,
    callingCardMaxFor(pokemon),
  );
  debugLog(
    "battle",
    `[偷心怪盗] ${pokemon.name} 触发 3 命「怪盗的信念」保命（本波首次），获得 ${CALLINGCARD_GAIN_ON_ENDURE} 层[预告信]`,
  );
  return true;
}

/** 产物 `FSe` — 是否处于 3 命保命的「免疫当回合后续伤害」窗口 */
export function isCallingCardGuarded(pokemon: any): boolean {
  const data = pokemon.customPokemonData;
  if (!data || data.callingCardGuardTurn === undefined || data.callingCardGuardTurn < 0) {
    return false;
  }
  return data.callingCardGuardTurn === currentActionKey$2();
}

/** 产物 `KSe` — 强化/弱化等级变化倍率（额外回合内 ×2） */
export function callingCardStatStageMultiplier(): number {
  return inCallingCardExtraTurn() ? CALLINGCARD_STAT_STAGE_MULT : 1;
}

const EMPTY_ON_HIT_RESULT = { heal: 0, stacksChanged: false };

/**
 * 产物 `YSe` — 命中结算主钩子。
 * 分支（逐字对应产物）：
 *   1) 1 命：对残血敌人造成伤害 → 每个目标每回合限 1 次获得层数
 *   2) 2 命：额外回合内造成伤害后 → 按最大生命 50% 回血
 */
export function applyCallingCardOnHit(pokemon: any, target: any): {
  heal: number;
  stacksChanged: boolean;
} {
  const data = pokemon.customPokemonData;
  if (!data) return EMPTY_ON_HIT_RESULT;
  let stacksChanged = false;
  const level = callingCardLevelOf(pokemon);

  // ① 1 命：获得【预告信】（同目标每回合 1 次）
  if (callingCardNodeActive(pokemon, CALLINGCARD_NODE.PREVIEW_LETTER)) {
    const round = currentRoundKey$2();
    if (data.callingCardGainTurn !== round) {
      data.callingCardGainTurn = round;
      data.callingCardGainTargets = {};
    }
    const targetIndex = target.getBattlerIndex();
    const already = data.callingCardGainTargets[targetIndex] ?? 0;
    const delta = callingCardGainDelta(
      pokemon,
      target.hp / Math.max(1, target.getMaxHp()),
      target.isFainted(),
      already,
    );
    if (delta > 0) {
      const before = data.callingCards ?? 0;
      const after = clampCallingCards(pokemon, before + delta, callingCardMaxFor(pokemon));
      data.callingCardGainTargets[targetIndex] = already + delta;
      if (after !== before) {
        data.callingCards = after;
        stacksChanged = true;
        debugLog(
          "battle",
          `[偷心怪盗] ${pokemon.name} 获得 ${after - before} 层[预告信] → ${after}/${callingCardMaxFor(pokemon)}`,
        );
      }
    }
  }

  // ② 2 命：额外回合内造成伤害后的回血
  let heal = 0;
  if (
    callingCardNodeActive(pokemon, CALLINGCARD_NODE.PREPARATION) &&
    inCallingCardExtraTurn() &&
    !pokemon.isFainted()
  ) {
    const maxHp = pokemon.getMaxHp();
    if (pokemon.hp < maxHp) {
      heal = Math.max(0, Math.floor(maxHp * CALLINGCARD_HEAL_ON_HIT_RATIO));
    }
  }
  return { heal, stacksChanged };
}

// ─────────────────────────────────────────────────────────────
// TODO(接入锚点 90df65097b6d)：本文件依赖清单
// ─────────────────────────────────────────────────────────────
// TODO(接入锚点): resolve `declare const globalScene` → `import { globalScene } from "#app/global-scene"`
// TODO(接入锚点): resolve `declare const gameMode` / `gameData` → `globalScene.gameMode` / `globalScene.gameData`
// TODO(接入锚点): resolve `MoveTarget` → `import { MoveTarget } from "#enums/move-target"`
// TODO(接入锚点): resolve `SpeciesId` → `import { SpeciesId } from "#enums/species-id"`
// TODO(接入锚点): resolve `debugLog` → 产物 `z`（上游 battle message / debug logger）
// TODO(接入锚点): resolve `constellationLevel` / `constellationNodeMode`
//                 → 公共底座 constellation-framework.ts 的导出
// TODO(接入锚点): 把 `registerCallingCardSystem()` 挂到系统初始化点（原产物靠顶层副作用执行）
// TODO(A4-验证): 额外回合的进入/结束流程（产物 `CallingCardResolvePhase` / `CallingCardEndPhase`，
//                即本文件未迁移的 `nB` / `AB` 两个 Phase 类）需在 A4 逐项验证
// TODO(A4-验证): 「同一目标每回合只结算1次」的 `callingCardGainTargets` 存档字段往返一致性
