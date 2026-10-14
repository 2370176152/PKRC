/**
 * 属性编织（MEW）—— 自研系统迁移
 * ---------------------------------------------------------------------------
 * 来源：game/server/dist/assets/loading-scene-By2k7Qfx.js（.orig 产物）@1924449 起
 * 逆向方式：`l(短名,"原函数名")` 反查 + 常量赋值精确定位（见 A3-迁移规范 §3）
 * 锚点树：90df65097b6df76f713e6bd108afa84499e8b993
 *
 * 定位：命座接入组 7 系统之一（A3-05）。物种 = 梦幻（`sN(n) === SpeciesId.MEW`）。
 *       点亮 1 命后成为【解明】角色，解锁「察觉」「洞悉」「植入」三个解明招式，
 *       以【属性编织】层数（打出效果绝佳伤害积攒）驱动。经公共底座
 *       `registerConstellation` 注册 6 个命座节点；解明招式经 `registerJiemingModule`
 *       （产物 `fEe`）挂入 JIEMING 框架；状态徽标经 `registerP5XStatusProvider`（产物 `E0`）。
 *       ⚠️ 与 MANAPHY（海之守护）共用 P5X 效果 tag `jieming:shield` 与解明框架。
 *
 * 产物符号对照（去混淆映射，务必逐条保留）：
 *   hI   → registerConstellation          （公共底座）
 *   sa   → constellationLevel$1           （公共底座）
 *   US   → constellationNodeIsExclusive   （公共底座）
 *   fEe  → registerJiemingModule          （解明框架）
 *   E0   → registerP5XStatusProvider      （P5X 状态徽标）
 *   kn   → applyP5XEffect                 （P5X 效果挂载）
 *   uE   → hasP5XEffect
 *   sL   → getJiemingTargets              （MANAPHY 系统：我方全体）
 *   z    → debugLog
 *   E    → globalScene
 *   R    → PokemonType
 *
 *   常量：
 *   Kw   → MEW_NODE.WEAVE       (=1)
 *   xEe  → MEW_NODE.SHARP       (=2)
 *   VEe  → MEW_NODE.CLARITY     (=3)
 *   kEe  → MEW_NODE.PENETRATE   (=4)
 *   ZEe  → MEW_NODE.DEEP_ROOT   (=5)
 *   mM   → MEW_NODE.PANGENE     (=6)
 *   wR   → MEW_WEAVE_MAX        (=8)
 *   dU   → MEW_WEAVE_GAIN_PER_ROUND (=2)
 *   Y0   → MEW_SKILL_WEAVE_GAIN (=2)
 *   Ar   → MEW_IMPLANT_COST     (=8)
 *   FN   → MEW_CRIT_DAMAGE_BONUS (=0.5)
 *   bEe  → MEW_CRIT_CHANCE_BONUS (=0.32)
 *   OTe  → MEW_INSIGHT_WEAKNESS_BONUS (=0.5)
 *   Bm   → MEW_INSIGHT_DEF_DOWN (=0.32)
 *   MU   → MEW_CD_REDUCE        (=4)
 *   ym   → MEW_AWARENESS_TURNS  (=3)
 *   Ose  → MEW_INSIGHT_TURNS    (=2)
 *   Ise  → MEW_IMPLANT_TURNS    (=1)
 *   lse  → MEW_AWARENESS_SHIELD_RATIO (=0.2)
 *   ITe  → MEW_AWARENESS_SHIELD_TURNS (=3)
 *   Fm/Km/Wm → 技能 id `mew-awareness` / `mew-insight` / `mew-implant`
 *   Ww/ng/XEe → tag `mew:awareness` / `mew:insight` / `mew:implant`
 *   bw   → JIEMING_SHIELD_TAG (`jieming:shield`，MANAPHY 系统共用)
 *   CTe  → MEW_IMPLANT_MULT_TABLE ([[0,0.5],[0.5,1],[1,2],[2,4],[4,6]])
 */
import { registerConstellation, type ConstellationCodexEntry } from "./constellation-framework";
import {
  JIEMING_SHIELD_TAG,
  JIEMING_MODULE_ROOT,
  registerJiemingModule,
  getJiemingTargets,
} from "./jieming-system";

// ─────────────────────────────────────────────────────────────
// 0. 依赖（上游 API，待接入锚点源码时改为真实 import）
// ─────────────────────────────────────────────────────────────
declare const globalScene: any; // 产物 `E`
declare const gameData: any; // 产物 `E.gameData`
declare const PokemonType: any; // 产物 `R`（PokemonType enum）
declare const SpeciesId: any; // 产物 `e`
declare const debugLog: (type: string, msg: string) => void; // 产物 `z`
declare const constellationLevel: (species: any, node: number) => number; // 产物 `sa`
declare const constellationNodeIsExclusive: (species: any, node: number, data?: any) => boolean; // 产物 `US`
declare const applyP5XEffect: (pokemon: any, key: string, opts: any, turns?: number) => void; // 产物 `kn`
declare const hasP5XEffect: (pokemon: any, key: string) => boolean; // 产物 `uE`
declare const registerP5XStatusProvider: (provider: (pokemon: any) => any[]) => void; // 产物 `E0`

// ─────────────────────────────────────────────────────────────
// 1. 常量（还原自产物 `wR..ITe` / `Fm..XEe` / `CTe`）
// ─────────────────────────────────────────────────────────────

/** 命座节点索引（`HTe.exclusiveNodes` 的顺序即此常量组） */
export const MEW_NODE = {
  /** 属性编织（解明角色 + 层数机制） */
  WEAVE: 1, // 产物 `Kw`
  /** 敏锐（察觉/洞悉准备时间缩短 4 次） */
  SHARP: 2, // 产物 `xEe`
  /** 明察（察觉期间全体要害概率 +32%） */
  CLARITY: 3, // 产物 `VEe`
  /** 穿透（洞悉期间弱点伤害 +0.5） */
  PENETRATE: 4, // 产物 `kEe`
  /** 深植（植入准备时间缩短 4 次） */
  DEEP_ROOT: 5, // 产物 `ZEe`
  /** 万象基因（植入改为按全体主属性） */
  PANGENE: 6, // 产物 `mM`
} as const;

/** 【属性编织】层数上限 */
export const MEW_WEAVE_MAX = 8; // 产物 `wR`
/** 每轮最多获得层数 */
export const MEW_WEAVE_GAIN_PER_ROUND = 2; // 产物 `dU`
/** 每次解明招式获得的层数 */
export const MEW_SKILL_WEAVE_GAIN = 2; // 产物 `Y0`
/** 【植入】消耗层数 */
export const MEW_IMPLANT_COST = 8; // 产物 `Ar`

/** 要害伤害加成系数 */
export const MEW_CRIT_DAMAGE_BONUS = 0.5; // 产物 `FN`
/** 3 命「明察」额外要害概率 */
export const MEW_CRIT_CHANCE_BONUS = 0.32; // 产物 `bEe`
/** 4 命「穿透」弱点伤害额外倍率 */
export const MEW_INSIGHT_WEAKNESS_BONUS = 0.5; // 产物 `OTe`
/** 「洞悉」敌方双防降低比例 */
export const MEW_INSIGHT_DEF_DOWN = 0.32; // 产物 `Bm`

/** 2/5 命冷却缩短次数 */
export const MEW_CD_REDUCE = 4; // 产物 `MU`

/** 各效果持续回合 */
export const MEW_AWARENESS_TURNS = 3; // 产物 `ym`
export const MEW_INSIGHT_TURNS = 2; // 产物 `Ose`
export const MEW_IMPLANT_TURNS = 1; // 产物 `Ise`

/** 「察觉」护盾 = 梦幻 HP × 该值 */
export const MEW_AWARENESS_SHIELD_RATIO = 0.2; // 产物 `lse`
/** 「察觉」护盾持续回合 */
export const MEW_AWARENESS_SHIELD_TURNS = 3; // 产物 `ITe`

/** 技能 id（产物 `Fm` / `Km` / `Wm`） */
export const MEW_SKILL_AWARENESS = "mew-awareness"; // 察觉
export const MEW_SKILL_INSIGHT = "mew-insight"; // 洞悉
export const MEW_SKILL_IMPLANT = "mew-implant"; // 植入

/** tag key（产物 `Ww` / `ng` / `XEe`） */
export const MEW_TAG_AWARENESS = "mew:awareness"; // 产物 `Ww`
export const MEW_TAG_INSIGHT = "mew:insight"; // 产物 `ng`
export const MEW_TAG_IMPLANT = "mew:implant"; // 产物 `XEe`

/** 【属性编织】可用种族（产物 `sN` 判定，写死 MEW） */
export const MEW_SPECIES: readonly number[] = [SpeciesId?.MEW].filter((x) => x !== undefined);

/**
 * 弱点植入倍率映射（产物 `CTe`）：
 * 原倍率 → 植入后倍率（0→0.5 / 0.5→1 / 1→2 / 2→4 / 4→6）。
 */
export const MEW_IMPLANT_MULT_TABLE: readonly (readonly [number, number])[] = [
  [0, 0.5],
  [0.5, 1],
  [1, 2],
  [2, 4],
  [4, 6],
];

/** 系统说明（产物 `gTe`，逐字保留为机读规格） */
export const MEW_CODEX: ConstellationCodexEntry[] = [
  {
    // 产物首条 `id: Hw`（= "jieming"）：解明资格标记（规范勘误 E1，见 A3-迁移规范 §8.1）。
    id: JIEMING_MODULE_ROOT,
    name: "属性编织",
    description:
      "成为【解明】角色，解锁「察觉」「洞悉」「植入」。\n" +
      `打出效果绝佳伤害时获得 1 层[属性编织]（每轮至多 ${MEW_WEAVE_GAIN_PER_ROUND} 层，上限 ${MEW_WEAVE_MAX} 层）。\n` +
      `[植入]消耗 ${MEW_IMPLANT_COST} 层。`,
  },
  {
    name: "敏锐",
    description: `【察觉】【洞悉】的准备时间各缩短 ${MEW_CD_REDUCE} 次我方行动（8 → 4）。`,
  },
  {
    name: "明察",
    description: `【察觉】期间，我方全体宝可梦的击中要害概率额外 +${pct$1(MEW_CRIT_CHANCE_BONUS)}，持续 ${MEW_AWARENESS_TURNS} 回合。`,
  },
  {
    name: "穿透",
    description: "【洞悉】期间，敌方受到的弱点伤害倍率额外 +0.5。",
  },
  {
    name: "深植",
    description: `【植入】的准备时间缩短 ${MEW_CD_REDUCE} 次我方行动（12 → 8）。`,
  },
  {
    name: "万象基因",
    description: "【植入】改为按我方全体宝可梦的主属性植入弱点。",
  },
];

/** 命座注册载荷（产物 `HTe`） */
export const MEW_CONSTELLATION_PAYLOAD = {
  exclusiveNodes: [
    MEW_NODE.WEAVE,
    MEW_NODE.SHARP,
    MEW_NODE.CLARITY,
    MEW_NODE.PENETRATE,
    MEW_NODE.DEEP_ROOT,
    MEW_NODE.PANGENE,
  ],
};

// ─────────────────────────────────────────────────────────────
// 2. 注册（产物：`hI(e.MEW,gTe,HTe)` + 两个框架 hook）
// ─────────────────────────────────────────────────────────────

/** 把【属性编织】系统注册进公共命座框架。 */
export function registerMewSystem(): void {
  for (const species of MEW_SPECIES) {
    registerConstellation(species, MEW_CODEX, MEW_CONSTELLATION_PAYLOAD);
  }
}

// ─────────────────────────────────────────────────────────────
// 3. 基础工具函数
// ─────────────────────────────────────────────────────────────

/** 产物 `pct$1` — 百分比格式化 */
export function pct$1(value: number): string {
  return `${Math.round(value * 100)}%`;
}

/** 产物 `Ag` — 层数钳制到 [0, wR] */
export function clampWeave(value: number): number {
  return Math.max(0, Math.min(MEW_WEAVE_MAX, Math.floor(value) || 0));
}

/** 产物 `lTe` — 当前回合的全局序（wave*1e4 + turn） */
export function mewRoundKey(): number {
  const battle = globalScene.currentBattle;
  return battle ? (battle.waveIndex ?? 0) * 1e4 + (battle.turn ?? 0) : -1;
}

/** 产物 `sN` — 判定种族是否为梦幻 */
export function isMewSpecies(species: number | undefined): boolean {
  return species === SpeciesId?.MEW;
}

// ─────────────────────────────────────────────────────────────
// 4. 核心函数（逐个还原自产物）
// ─────────────────────────────────────────────────────────────

/** 产物 `HR` — 判定某命座节点是否已激活 */
export function mewNodeActive(pokemon: any, node: number): boolean {
  if (!pokemon) return false;
  const rootSpecies = pokemon.species?.getRootSpeciesId();
  if (!isMewSpecies(rootSpecies)) return false;
  const data = gameData?.ptSoudacheData;
  if (constellationLevel(data, rootSpecies) < node) return false;
  return constellationNodeIsExclusive(rootSpecies, node, data);
}

/** 产物 `Yw` — 队伍中的解明主控梦幻（优先已点 1 命者） */
export function getMewPokemon(): any {
  const list = globalScene
    .getPlayerParty()
    .filter((p: any) => isMewSpecies(p.species?.getRootSpeciesId()));
  return list.find((p: any) => mewNodeActive(p, MEW_NODE.WEAVE)) ?? list[0];
}

/** 产物 `hR` — 读取当前【属性编织】层数 */
export function mewWeaveOf(pokemon: any): number {
  if (!pokemon || !isMewSpecies(pokemon.species?.getRootSpeciesId())) return 0;
  return clampWeave(pokemon.customPokemonData?.mewWeave ?? 0);
}

/** 产物 `STe` — 获得【属性编织】层数（受每轮上限约束；返回增加后的值） */
export function mewGainWeave(pokemon: any, amount: number): number {
  if (!pokemon || amount <= 0 || !isMewSpecies(pokemon.species?.getRootSpeciesId())) {
    return mewWeaveOf(pokemon);
  }
  const data = pokemon.customPokemonData;
  if (!data) return 0;
  const before = clampWeave(data.mewWeave ?? 0);
  const round = mewRoundKey();
  if (data.mewWeaveTurn !== round) {
    data.mewWeaveTurn = round;
    data.mewWeaveGained = 0;
  }
  const gained = Math.max(0, data.mewWeaveGained ?? 0);
  const roomThisRound = Math.max(0, MEW_WEAVE_GAIN_PER_ROUND - gained);
  const delta = Math.min(amount, roomThisRound, MEW_WEAVE_MAX - before);
  if (delta <= 0) return before;
  data.mewWeaveGained = gained + delta;
  data.mewWeave = before + delta;
  pokemon.updateInfo();
  debugLog(
    "battle",
    `[属性编织] ${pokemon.name} +${delta} → ${data.mewWeave}/${MEW_WEAVE_MAX}（本轮 ${data.mewWeaveGained}/${MEW_WEAVE_GAIN_PER_ROUND}）`,
  );
  return data.mewWeave;
}

/** 产物 `Sse` — 解明招式获得层数（不计每轮上限） */
export function grantWeaveFromSkill(pokemon: any, amount: number): number {
  if (!pokemon || amount <= 0 || !isMewSpecies(pokemon.species?.getRootSpeciesId())) {
    return mewWeaveOf(pokemon);
  }
  const data = pokemon.customPokemonData;
  if (!data) return 0;
  const before = clampWeave(data.mewWeave ?? 0);
  const delta = Math.min(amount, MEW_WEAVE_MAX - before);
  if (delta <= 0) return before;
  data.mewWeave = before + delta;
  pokemon.updateInfo();
  debugLog("battle", `[属性编织] ${pokemon.name} 招式获得 +${delta} → ${data.mewWeave}/${MEW_WEAVE_MAX}`);
  return data.mewWeave;
}

/** 产物 `TTe` — 消耗【植入】所需的层数 |
 *  注：产物在层数 < 8 时直接返回原值不消耗；层数足够时扣减 8。 */
export function mewConsumeWeave(pokemon: any): number {
  if (!pokemon) return 0;
  const data = pokemon.customPokemonData;
  if (!data) return 0;
  const weave = clampWeave(data.mewWeave ?? 0);
  if (weave < MEW_IMPLANT_COST) return weave;
  data.mewWeave = weave - MEW_IMPLANT_COST;
  pokemon.updateInfo();
  debugLog("battle", `[属性编织] ${pokemon.name} 消耗 ${MEW_IMPLANT_COST} 层 → ${data.mewWeave}/${MEW_WEAVE_MAX}`);
  return data.mewWeave;
}

/** 产物 `LTe` — 梦幻打出效果绝佳伤害时的获得层数钩子 */
export function onMewSuperEffectiveHit(pokemon: any): void {
  if (!pokemon?.isPlayer()) return;
  const mew = getMewPokemon();
  if (!mew || !mewNodeActive(mew, MEW_NODE.WEAVE)) return;
  const before = mewWeaveOf(mew);
  const after = mewGainWeave(mew, 1);
  if (after !== before) {
    debugLog("battle", `[属性编织] ${pokemon.name} 的效果绝佳伤害 → ${mew.name} ${before} → ${after}`);
  }
}

/** 产物 `NTe` — 要害伤害加成（察觉/洞悉各 +0.5） */
export function mewCritDamageBonus(attacker: any, target: any): number {
  let bonus = 0;
  if (attacker?.isPlayer() && hasP5XEffect(attacker, MEW_TAG_AWARENESS)) bonus += MEW_CRIT_DAMAGE_BONUS;
  if (target && hasP5XEffect(target, MEW_TAG_INSIGHT)) bonus += MEW_CRIT_DAMAGE_BONUS;
  return bonus;
}

/** 产物 `uTe` — 3 命「明察」：察觉期间全体额外要害概率 */
export function mewCritChanceBonus(pokemon: any): number {
  if (!pokemon?.isPlayer() || !hasP5XEffect(pokemon, MEW_TAG_AWARENESS)) return 0;
  const mew = getMewPokemon();
  if (!mew || !mewNodeActive(mew, MEW_NODE.CLARITY)) return 0;
  return MEW_CRIT_CHANCE_BONUS;
}

/** 产物 `cTe` — 4 命「穿透」：洞悉期间敌方额外的弱点伤害倍率 |
 *  注：产物写死 `OTe`（传参 `n` 未用），此处沿用常量。 */
export function mewWeaknessDamageBonus(target: any): number {
  if (!target || !hasP5XEffect(target, MEW_TAG_INSIGHT)) return 0;
  const mew = getMewPokemon();
  if (!mew || !mewNodeActive(mew, MEW_NODE.PENETRATE)) return 0;
  return MEW_INSIGHT_WEAKNESS_BONUS;
}

/** 产物 `hTe` — 「洞悉」期间敌方物防/特防倍率（−32%） */
export function mewDefenseMultiplier(pokemon: any, stat: number): number {
  // 产物 `p.DEF` / `p.SPDEF` 分别 = 2 / 4
  if ((stat !== 2 && stat !== 4) || !pokemon || !hasP5XEffect(pokemon, MEW_TAG_INSIGHT)) return 1;
  return 1 - MEW_INSIGHT_DEF_DOWN;
}

/** 产物 `dTe` — 植入倍率换算（查 MEW_IMPLANT_MULT_TABLE） */
export function mewImplantedMultiplier(original: number): number {
  for (const [from, to] of MEW_IMPLANT_MULT_TABLE) {
    if (Math.abs(original - from) < 1e-6) return to;
  }
  return original;
}

/** 产物 `MTe` — 被植入目标的实际效果倍率 */
export function mewImplantedEffectiveness(target: any, moveType: number, base: number): number {
  if (!target || !hasP5XEffect(target, MEW_TAG_IMPLANT)) return base;
  const types = target.customPokemonData?.mewImplantTypes;
  if (!types?.length || !types.includes(moveType)) return base;
  return mewImplantedMultiplier(base);
}

/** 产物 `UTe` — 附上护盾（梦幻 HP × 比例），并挂 `jieming:shield` |
 *  注：护盾 tag 与 MANAPHY 系统共用（`bw`）。 */
export function addMewShield(mew: any, target: any, ratio: number, turns: number): void {
  if (!mew || !target) return;
  const amount = Math.max(1, Math.floor(mew.hp * ratio));
  target.addJiemingShield(amount);
  target.updateInfo();
  applyP5XEffect(target, JIEMING_SHIELD_TAG, { turns });
  debugLog(
    "battle",
    `[属性编织] ${target.name} 获得护盾 ${amount}（梦幻 HP 的 ${Math.round(ratio * 100)}%）`,
  );
}

/** 产物 `DTe` — 定位技能目标（我方全体，回退到解明目标） */
export function allyTargets(targets: any[]): any[] {
  const list = (targets ?? []).filter((t: any) => !!t && t.isPlayer() && !t.isFainted());
  return list.length > 0 ? list : getJiemingTargets();
}

/** 产物 `Tse` — 场上存活敌方全体 |
 *  注：与 MANAPHY 系统的 `enemyTargets` 语义一致。 */
export function mewEnemyTargets(): any[] {
  return globalScene.getEnemyField().filter((p: any) => !!p && p.isActive() && !p.isFainted());
}

/** 产物 `fTe` — 血线最低的我方单位 */
export function lowestHpAlly(allies: any[]): any {
  let best: any;
  let lowest = Number.POSITIVE_INFINITY;
  for (const ally of allies) {
    const ratio = ally.getHpRatio();
    if (ratio < lowest) {
      lowest = ratio;
      best = ally;
    }
  }
  return best;
}

/** 产物 `$Ee` — 取主属性（第一属性，UNKNOWN 视为无） */
export function primaryTypeOf(pokemon: any): number | undefined {
  const type = pokemon?.getTypes?.()[0];
  return type === undefined || type === PokemonType.UNKNOWN ? undefined : type;
}

/** 产物 `PTe` — 我方全体主属性去重集合 */
export function allAllyPrimaryTypes(): number[] {
  const out: number[] = [];
  for (const ally of getJiemingTargets()) {
    const type = primaryTypeOf(ally);
    if (type !== undefined && !out.includes(type)) out.push(type);
  }
  return out;
}

// ─────────────────────────────────────────────────────────────
// 5. 解明招式表（产物 `_Te`，逐字保留 apply 逻辑与中文描述）
// ─────────────────────────────────────────────────────────────

/** 产物 `_Te` — 梦幻的三个解明招式 */
export const MEW_SKILLS = [
  {
    id: MEW_SKILL_AWARENESS,
    name: "察觉",
    cooldown: 8,
    description: `我方全体要害伤害系数+${MEW_CRIT_DAMAGE_BONUS}；血线最低的一只获得「梦幻HP×${pct$1(MEW_AWARENESS_SHIELD_RATIO)}」护盾，持续${MEW_AWARENESS_TURNS}回合；获得${MEW_SKILL_WEAVE_GAIN}层。`,
    apply: (user: any, targets: any[]) => {
      if (!user?.isPlayer()) return;
      const list = allyTargets(targets);
      if (!list.length) return;
      for (const ally of list) applyP5XEffect(ally, MEW_TAG_AWARENESS, { turns: MEW_AWARENESS_TURNS });
      const weakest = lowestHpAlly(list);
      if (weakest) addMewShield(user, weakest, MEW_AWARENESS_SHIELD_RATIO, MEW_AWARENESS_SHIELD_TURNS);
      grantWeaveFromSkill(user, MEW_SKILL_WEAVE_GAIN);
      globalScene.queueMessage(
        `【察觉】—— 我方全体要害伤害系数 +${MEW_CRIT_DAMAGE_BONUS}，${weakest?.name ?? "最危险的同伴"}被护住了。`,
      );
    },
  },
  {
    id: MEW_SKILL_INSIGHT,
    name: "洞悉",
    cooldown: 8,
    description: `敌方全体双防-${pct$1(MEW_INSIGHT_DEF_DOWN)}、受到的击中要害伤害系数+${MEW_CRIT_DAMAGE_BONUS}，持续${MEW_INSIGHT_TURNS}回合；获得${MEW_SKILL_WEAVE_GAIN}层。`,
    apply: (user: any, _targets: any[]) => {
      if (!user?.isPlayer()) return;
      const enemies = mewEnemyTargets();
      if (enemies.length) {
        for (const enemy of enemies) applyP5XEffect(enemy, MEW_TAG_INSIGHT, { turns: MEW_INSIGHT_TURNS });
        grantWeaveFromSkill(user, MEW_SKILL_WEAVE_GAIN);
        globalScene.queueMessage(
          `【洞悉】—— 敌方全体的破绽暴露了（双防 −${pct$1(MEW_INSIGHT_DEF_DOWN)}）。`,
        );
      }
    },
  },
  {
    id: MEW_SKILL_IMPLANT,
    name: "植入",
    cooldown: 12,
    needsAllyTarget: true,
    targetRequired: (pokemon: any) => !mewNodeActive(pokemon, MEW_NODE.PANGENE),
    unavailableReason: (pokemon: any) => {
      const weave = mewWeaveOf(pokemon);
      return weave < MEW_IMPLANT_COST
        ? `[属性编织]不足：${weave}/${MEW_IMPLANT_COST} —— 还需 ${MEW_IMPLANT_COST - weave} 层。`
        : undefined;
    },
    description: `消耗${MEW_IMPLANT_COST}层[属性编织]，选我方一只，按其主属性为敌方全体植入弱点，持续${MEW_IMPLANT_TURNS}回合。`,
    apply: (user: any, targets: any[]) => {
      if (!user?.isPlayer() || !isMewSpecies(user.species?.getRootSpeciesId()) || !user.customPokemonData) {
        return;
      }
      const enemies = mewEnemyTargets();
      if (!enemies.length) return;
      // 产物为 `console.log("[属性编织] 植入结算：6命=…｜当前层数=…｜敌方=…只｜传入目标=…")`
      debugLog(
        "battle",
        `[属性编织] 植入结算：6命=${mewNodeActive(user, MEW_NODE.PANGENE)}｜当前层数=${mewWeaveOf(user)}｜敌方=${enemies.length}只｜传入目标=${targets?.length ?? 0}`,
      );
      if (mewWeaveOf(user) < MEW_IMPLANT_COST) {
        globalScene.queueMessage(`[属性编织]不足 ${MEW_IMPLANT_COST} 层 —— 【植入】无法发动。`);
        return;
      }
      const pangene = mewNodeActive(user, MEW_NODE.PANGENE);
      const primary = primaryTypeOf(targets?.[0] ?? user);
      const types = pangene ? allAllyPrimaryTypes() : primary === undefined ? [] : [primary];
      if (!types.length) return;
      mewConsumeWeave(user);
      for (const enemy of enemies) {
        const data = enemy.customPokemonData;
        if (!data) continue;
        data.mewImplantTypes = [...types];
        data.mewImplantFromAll = pangene;
        enemy.turnData.moveEffectiveness = null;
        applyP5XEffect(enemy, MEW_TAG_IMPLANT, { turns: MEW_IMPLANT_TURNS });
      }
      globalScene.queueMessage("【植入】—— 敌方全体被植入了新的弱点！");
    },
  },
];

/** 产物 `GTe` — 解明招式的有效冷却（受 2/5 命缩减） */
export function mewEffectiveCooldown(pokemon: any, skillId: string): number {
  const base =
    ({ [MEW_SKILL_AWARENESS]: 8, [MEW_SKILL_INSIGHT]: 8, [MEW_SKILL_IMPLANT]: 12 } as Record<
      string,
      number
    >)[skillId] ?? 0;
  let cd = base;
  if ((skillId === MEW_SKILL_AWARENESS || skillId === MEW_SKILL_INSIGHT) && mewNodeActive(pokemon, MEW_NODE.SHARP)) {
    cd -= MEW_CD_REDUCE;
  }
  if (skillId === MEW_SKILL_IMPLANT && mewNodeActive(pokemon, MEW_NODE.DEEP_ROOT)) {
    cd -= MEW_CD_REDUCE;
  }
  return Math.max(1, cd);
}

/** 把梦幻解明模块挂入 JIEMING 框架（产物 `fEe({rootSpeciesId: e.MEW, ...})`）。 */
export function registerMewJiemingModule(): void {
  registerJiemingModule({
    rootSpeciesId: SpeciesId?.MEW,
    skills: MEW_SKILLS,
    cooldown: (pokemon: any, skill: any) => mewEffectiveCooldown(pokemon, skill.id),
    counter: {
      label: "属性编织",
      read: (pokemon: any) => ({ value: mewWeaveOf(pokemon), max: MEW_WEAVE_MAX }),
    },
  });
}

/** 产物 `E0(...)` — 注册【属性编织】状态徽标 provider。 */
export function registerMewStatusProvider(): void {
  registerP5XStatusProvider((pokemon: any) => {
    if (!pokemon?.isPlayer?.()) return [];
    const weave = mewWeaveOf(pokemon);
    if (weave <= 0) return [];
    return [
      {
        key: "mew:weave",
        texture: "p5x_buffs",
        pokemonIcon: true,
        title: `[属性编织] ${weave}/${MEW_WEAVE_MAX}`,
        description: `打出效果绝佳伤害 +1 层（每轮至多 ${MEW_WEAVE_GAIN_PER_ROUND} 层）；攒满 ${MEW_IMPLANT_COST} 层开【植入】。`,
      },
    ];
  });
}

// ─────────────────────────────────────────────────────────────
// TODO(接入锚点 90df65097b6d)：本文件依赖清单
// ─────────────────────────────────────────────────────────────
// TODO(接入锚点): globalScene / gameData → #app/global-scene
// TODO(接入锚点): PokemonType → #enums/pokemon-type；SpeciesId → #enums/species-id
// TODO(接入锚点): applyP5XEffect / hasP5XEffect → P5X 系统导出（A3-09）
// TODO(接入锚点): registerJiemingModule → JIEMING 框架导出（A3-07）
// TODO(接入锚点): registerP5XStatusProvider → P5X 框架导出（A3-09）
// TODO(接入锚点): getJiemingTargets / JIEMING_SHIELD_TAG → manaphy-system.ts 导出
// TODO(接入锚点): 把 registerMewSystem / registerMewJiemingModule / registerMewStatusProvider
//                 挂到系统初始化点（原产物靠顶层副作用执行）
// TODO(语义待确认): 产物实现含 3 处 `console.log("[属性编织] 植入结算…")` 调试日志；
//                   迁移版按 A3-规范 §5 统一改用 `debugLog("battle", ...)`（接入时确认是否保留）
// TODO(A4-验证): 「植入」的 weak 覆盖与 `moveEffectiveness` 重置时序（需要时逐项复现）
