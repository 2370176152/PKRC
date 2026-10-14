/**
 * 海之守护（MANAPHY 群）—— 自研系统迁移
 * ---------------------------------------------------------------------------
 * 来源：game/server/dist/assets/loading-scene-By2k7Qfx.js（.orig 产物）@1924514 起
 * 逆向方式：`l(短名,"原函数名")` 反查 + 常量赋值精确定位（见 A3-迁移规范 §3）
 * 锚点树：90df65097b6df76f713e6bd108afa84499e8b993
 *
 * 定位：命座接入组 7 系统之一（A3-05）。物种 = 玛纳霏 / 霏欧纳（`ww`）。核心是
 *       「【海之守护】层数 → 双防/双攻加成」+ 打击/追光附盾 + 6 命满层增伤，
 *       并作为**缺省解明模块**提供三个解明招式（精神补充 / 精神屏障 / 黎明的泡沫）。
 *
 * ⚠️ A3-07 收敛：原 A3-05 临时寄放于本文件的**解明框架公共设施**（模块注册表、
 *    招式查询、冷却、共享加成、结算阶段等）已迁出至 `jieming-system.ts`。
 *    本文件仅保留【海之守护】专属逻辑 + 三个内建解明招式，并在末尾以
 *    「deprecation shim」再导出被迁走的符号（供 A3-05 既有引用平滑过渡）。
 *
 * 产物符号对照（去混淆映射，务必逐条保留）：
 *   hI   → registerConstellation        （公共底座）
 *   Kl   → jiemingNodeActive            （已移至 jieming-system）
 *   wTe  → isSeaGuardSpecies            （已移至 jieming-system）
 *   DE   → getJiemingPokemon            （已移至 jieming-system）
 *   R0   → seaGuardLayersOf
 *   WTe  → seaGuardMaxFor
 *   vTe  → applySeaGuardBonuses
 *   UU   → addSeaGuard
 *   YTe  → removeSeaGuard
 *   xTe  → seaGuardFinaleDamageMultiplier
 *   JTe  → applySeaGuardOpening
 *   jTe  → trySeaGuardLighting
 *   zTe  → trySeaGuardChase
 *   nT   → addShield
 *   qTe  → shieldAmountFrom
 *   sLe  → restorePp
 *   Lse  → boost
 *   v0   → pct
 *   fEe  → registerJiemingModule        （已移至 jieming-system）
 *   Nw   → registerP5XEffectExpireHandler
 *   E0   → registerP5XStatusProvider
 *   kn   → applyP5XEffect
 *   E    → globalScene
 *   z    → debugLog
 *   p    → Stat
 *
 *   常量：
 *   JEe  → MANAPHY_NODE.SEA_GUARD       (=1)
 *   jEe  → MANAPHY_NODE.PUPPETEER       (=2)
 *   zEe  → MANAPHY_NODE.LIGHTING        (=3)
 *   qEe  → MANAPHY_NODE.COMPOSURE       (=4)
 *   ere  → MANAPHY_NODE.CHASE           (=5)
 *   vw   → MANAPHY_NODE.NO_CURTAIN      (=6)
 *   tre  → SEA_GUARD_MAX_LAYERS         (=6)
 *   FTe  → SEA_GUARD_DEF_PER_LAYER      (=0.04)
 *   sre  → SEA_GUARD_ATK_THRESHOLD      (=4)
 *   KTe  → SEA_GUARD_ATK_PER_LAYER      (=0.03)
 *   bTe  → SEA_GUARD_FINALE_DAMAGE      (=1.2)
 *   VTe/kTe → LIGHTING_HP_THRESHOLD / LIGHTING_SHIELD_RATIO
 *   XTe/$Te/QTe → CHASE_SHIELD_RATIO / CHASE_SHIELD_TURNS / CHASE_POWER_THRESHOLD
 *   Nse/use/cse → DAWN_BUBBLE_BONUS_LAYER / SOOTHING_SONG_PP_RESTORE / CONTROL_BLOCK_CHARGES
 *   sO/GI → JIEMING_SHIELD_RATIOS / JIEMING_SHIELD_TURNS
 *   wm   → JIEMING_SKILLS               （内建解明招式，本文件）
 */
import { registerConstellation, type ConstellationCodexEntry } from "./constellation-framework";
import {
  JIEMING_MODULE_ROOT,
  JIEMING_SEA_GUARD_SPECIES,
  JIEMING_ROSTER,
  JIEMING_MODULE_NAME,
  JIEMING_SHIELD_TAG,
  SHIELD_EXPIRE_LAYER_COST,
  JIEMING_BUILTIN_SKILL_ID,
  BUILTIN_PUPPETEER_CD_REDUCE,
  BUILTIN_COMPOSURE_CD_REDUCE,
  jiemingNodeActive,
  isSeaGuardSpecies,
  isJiemingSpecies,
  getJiemingPokemon,
  getJiemingTargets,
  setDefaultJiemingSkills,
  type JiemingSkill,
} from "./jieming-system";

// ─────────────────────────────────────────────────────────────
// 0. 依赖（上游 API，待接入锚点源码时改为真实 import）
// ─────────────────────────────────────────────────────────────
declare const globalScene: any; // 产物 `E`
declare const gameMode: any; // 产物 `E.gameMode`
declare const Stat: any; // 产物 `p`
declare const SpeciesId: any; // 产物 `e`
declare const debugLog: (type: string, msg: string) => void; // 产物 `z`
declare const applyP5XEffect: (pokemon: any, key: string, opts: any, turns?: number) => void; // 产物 `kn`
declare const registerP5XStatusProvider: (provider: (pokemon: any) => any[]) => void; // 产物 `E0`
declare const registerP5XEffectExpireHandler: (key: string, handler: (pokemon: any) => void) => void; // 产物 `Nw`
declare const StatStageChangePhase: any; // 产物 `Vt`（`new Vt(battlerIndex, quiet, stats, stages)`）

// ─────────────────────────────────────────────────────────────
// 1. 常量（还原自产物 `JEe..vw` / `tre..QTe` / `sO` / `GI`）
// ─────────────────────────────────────────────────────────────

/** 命座节点索引（`BTe.exclusiveNodes` 的顺序即此常量组） */
export const MANAPHY_NODE = {
  /** 海之守护（解明角色 + 层数机制） */
  SEA_GUARD: 1, // 产物 `JEe`
  /** 提线之人（精神补充/屏障冷却各 −2） */
  PUPPETEER: 2, // 产物 `jEe`
  /** 打光（同伴 HP 首次 ≤30% 时附盾，每场 1 次） */
  LIGHTING: 3, // 产物 `zEe`
  /** 主演的从容（黎明的泡沫冷却 −3） */
  COMPOSURE: 4, // 产物 `qEe`
  /** 追光（同伴使用威力 ≥80 招式后附盾） */
  CHASE: 5, // 产物 `ere`
  /** 永不谢幕（6 层时伤害 +20%，护盾到期不扣层） */
  NO_CURTAIN: 6, // 产物 `vw`
} as const;

/** 【海之守护】层数上限 */
export const SEA_GUARD_MAX_LAYERS = 6; // 产物 `tre`
/** 每层双防加成 */
export const SEA_GUARD_DEF_PER_LAYER = 0.04; // 产物 `FTe`
/** 双攻加成起始层数（≥4 层） */
export const SEA_GUARD_ATK_THRESHOLD = 4; // 产物 `sre`
/** 每层双攻加成 */
export const SEA_GUARD_ATK_PER_LAYER = 0.03; // 产物 `KTe`
/** 6 命「永不谢幕」满层伤害倍率 */
export const SEA_GUARD_FINALE_DAMAGE = 1.2; // 产物 `bTe`

/** 3 命「打光」触发血线 / 护盾比例 |
 *  注：产物 `ZTe`（=3）用于打光护盾持续（与「黎明的泡沫」持续同值 3）。 */
export const LIGHTING_HP_THRESHOLD = 0.3; // 产物 `VTe`
export const LIGHTING_SHIELD_RATIO = 0.28; // 产物 `kTe`

/** 5 命「追光」护盾比例 / 持续 / 触发威力阈值 */
export const CHASE_SHIELD_RATIO = 0.16; // 产物 `XTe`
export const CHASE_SHIELD_TURNS = 2; // 产物 `$Te`
export const CHASE_POWER_THRESHOLD = 80; // 产物 `QTe`

/** 「黎明的泡沫」在 ≥4 层时额外获得护盾比例 */
export const DAWN_BUBBLE_BONUS_LAYER = 4; // 产物 `Nse`
/** 「精神补充」回复 PP 点数 */
export const SOOTHING_SONG_PP_RESTORE = 3; // 产物 `use`
/** 「精神屏障」附加的【控制抵挡】层数 */
export const CONTROL_BLOCK_CHARGES = 2; // 产物 `cse`

/** 解明护盾比例表（产物 `sO`） */
export const JIEMING_SHIELD_RATIOS = {
  soothingSong: 0.3, // 精神补充
  intersectingDance: 1, // 精神屏障
  dawnBubble: 0.8, // 黎明的泡沫
  dawnBubbleBonus: 1.2, // 黎明的泡沫（≥4 层额外）
} as const;

/** 解明护盾持续回合表（产物 `GI`） */
export const JIEMING_SHIELD_TURNS = {
  soothingSong: 2, // 精神补充
  intersectingDance: 3, // 精神屏障
  dawnBubble: 3, // 黎明的泡沫
} as const;

/** 解明招式 id（产物 `Ym` / `ALe` / `vm`；别名至 `jieming-system` 的内建 id 表） */
export const JIEMING_SKILL_SOOTHING_SONG = JIEMING_BUILTIN_SKILL_ID.SOOTHING_SONG; // 精神补充
export const JIEMING_SKILL_INTERSECTING_DANCE = JIEMING_BUILTIN_SKILL_ID.INTERSECTING_DANCE; // 精神屏障
export const JIEMING_SKILL_DAWN_BUBBLE = JIEMING_BUILTIN_SKILL_ID.DAWN_BUBBLE; // 黎明的泡沫

/** 「提线之人」「主演的从容」冷却缩短次数（别名至 `jieming-system` 的内建缩减） */
export const PUPPETEER_CD_REDUCE = BUILTIN_PUPPETEER_CD_REDUCE; // 产物 `iLe`
export const COMPOSURE_CD_REDUCE = BUILTIN_COMPOSURE_CD_REDUCE; // 产物 `nLe`

/** 【海之守护】可用种族（产物 `ww`；别名至 `jieming-system` 花名册） */
export const SEA_GUARD_SPECIES: readonly number[] = JIEMING_SEA_GUARD_SPECIES;

/** 全部【解明】物种（产物 `GO = [...ww, MELOETTA, MEW]`；别名至 `jieming-system`） */
export const JIEMING_SPECIES: readonly number[] = JIEMING_ROSTER;

/** 系统说明（产物 `mTe`，逐字保留为机读规格） */
export const SEA_GUARD_CODEX: ConstellationCodexEntry[] = [
  {
    // 产物首条 `id: Hw`（= "jieming"）：解明资格标记（规范勘误 E1，见 A3-迁移规范 §8.1）。
    id: JIEMING_MODULE_ROOT,
    name: "海之守护",
    description:
      "成为【解明】角色，解锁「精神补充」「精神屏障」「黎明的泡沫」。\n" +
      "每层【海之守护】+4%双防，4层起每层+3%双攻（至多6层）。\n" +
      "【开演之时】战斗开始时我方全体+1层。",
  },
  {
    name: "提线之人",
    description: "【意识 2 · 提线之人】「精神补充」「精神屏障」的准备时间各缩短 2 次我方行动。",
  },
  {
    name: "打光",
    description:
      "【意识 3 · 打光】任意同伴 HP 首次降至 30% 或以下时，立刻为其附上护盾（解明物防的 28%），持续 3 轮。\n" +
      "每场战斗仅触发 1 次。",
  },
  {
    name: "主演的从容",
    description: "【意识 4 · 主演的从容】「黎明的泡沫」的准备时间缩短 3 次我方行动。",
  },
  {
    name: "追光",
    description:
      "【意识 5 · 追光】任意同伴使用威力 ≥ 80 的招式（神通法 / 大招）后，立刻为其附上护盾（解明物防的 16%），持续 2 轮。",
  },
  {
    name: "永不谢幕",
    description:
      "【意识 6 · 永不谢幕】同伴的【海之守护】达到 6 层（上限）时，其造成的伤害 +20%；\n" +
      "护盾到期不再扣除层数。",
  },
];

/** 命座注册载荷（产物 `BTe`） */
export const SEA_GUARD_CONSTELLATION_PAYLOAD = {
  exclusiveNodes: [
    MANAPHY_NODE.SEA_GUARD,
    MANAPHY_NODE.PUPPETEER,
    MANAPHY_NODE.LIGHTING,
    MANAPHY_NODE.COMPOSURE,
    MANAPHY_NODE.CHASE,
    MANAPHY_NODE.NO_CURTAIN,
  ],
};

// ─────────────────────────────────────────────────────────────
// 2. 注册（产物：`for(const n of ww)hI(n,mTe,BTe)`）
// ─────────────────────────────────────────────────────────────

/** 把【海之守护】系统注册进公共命座框架（对玛纳霏/霏欧纳各注册一次）。 */
export function registerSeaGuardSystem(): void {
  for (const species of SEA_GUARD_SPECIES) {
    registerConstellation(species, SEA_GUARD_CODEX, SEA_GUARD_CONSTELLATION_PAYLOAD);
  }
}

// ─────────────────────────────────────────────────────────────
// 3. 小工具（产物 `v0` / `Lse` / `sLe`）
// ─────────────────────────────────────────────────────────────

/** 产物 `v0` — 百分比格式化 */
export function pct(value: number): string {
  return `${Math.round(value * 100)}%`;
}

/** 产物 `Lse` "boost" — 施加能力等级变化阶段 */
export function boost(pokemon: any, stats: number[], stages: number): void {
  globalScene.unshiftPhase(new StatStageChangePhase(pokemon.getBattlerIndex(), true, stats, stages));
}

/** 产物 `sLe` — 回复招式 PP */
export function restorePp(pokemon: any, amount: number): void {
  for (const move of pokemon.getMoveset()) {
    if (move && move.ppUsed > 0) move.ppUsed = Math.max(0, move.ppUsed - amount);
  }
}

// ─────────────────────────────────────────────────────────────
// 4. 【海之守护】核心函数（产物 `R0` / `WTe` / `vTe` / `UU` / `YTe`）
// ─────────────────────────────────────────────────────────────

/** 产物 `R0` — 读取【海之守护】层数 */
export function seaGuardLayersOf(pokemon: any): number {
  return pokemon?.seaGuardLayers ?? 0;
}

/** 产物 `WTe` — 【海之守护】层数上限 |
 *  注：产物为常量函数，返回值写死 `tre`。 */
export function seaGuardMaxFor(): number {
  return SEA_GUARD_MAX_LAYERS;
}

/** 产物 `vTe` — 依据层数刷新双防/双攻加成比例 */
export function applySeaGuardBonuses(pokemon: any): void {
  const layers = seaGuardLayersOf(pokemon);
  pokemon.seaGuardDefRatio = layers * SEA_GUARD_DEF_PER_LAYER;
  pokemon.seaGuardAtkRatio = layers >= SEA_GUARD_ATK_THRESHOLD ? layers * SEA_GUARD_ATK_PER_LAYER : 0;
}

/** 产物 `UU` — 增减【海之守护】层数 */
export function addSeaGuard(pokemon: any, delta: number): void {
  if (!pokemon) return;
  const max = seaGuardMaxFor();
  pokemon.seaGuardLayers = Math.max(0, Math.min(max, seaGuardLayersOf(pokemon) + delta));
  applySeaGuardBonuses(pokemon);
  pokemon.updateInfo();
}

/** 产物 `YTe` — 减少【海之守护】层数 */
export function removeSeaGuard(pokemon: any, delta: number): void {
  addSeaGuard(pokemon, -delta);
}

/** 产物 `xTe` — 6 命「永不谢幕」满层伤害倍率 */
export function seaGuardFinaleDamageMultiplier(pokemon: any): number {
  if (!pokemon) return 1;
  const jieming = getJiemingPokemon();
  if (!jieming || !jiemingNodeActive(jieming, MANAPHY_NODE.NO_CURTAIN)) return 1;
  return seaGuardLayersOf(pokemon) >= SEA_GUARD_MAX_LAYERS ? SEA_GUARD_FINALE_DAMAGE : 1;
}

/** 产物 `JTe` — 每波次开始：1 命「开演之时」我方全体 +1 层 */
export function applySeaGuardOpening(): void {
  const jieming = getJiemingPokemon();
  if (!jieming || !jiemingNodeActive(jieming, MANAPHY_NODE.SEA_GUARD)) return;
  const wave = globalScene.currentBattle?.waveIndex ?? -1;
  if (jieming.customPokemonData.seaGuardOpenedWave !== wave) {
    jieming.customPokemonData.seaGuardOpenedWave = wave;
    for (const ally of getJiemingTargets()) addSeaGuard(ally, 1);
    globalScene.queueMessage("海之守护随浪而至 —— 我方全体获得 1 层【海之守护】。");
  }
}

/** 产物 `jTe` — 3 命「打光」：同伴 HP 首次 ≤30% 时附盾 */
export function trySeaGuardLighting(pokemon: any): void {
  if (!pokemon?.isPlayer() || pokemon.isFainted()) return;
  const jieming = getJiemingPokemon();
  if (!jieming || !jiemingNodeActive(jieming, MANAPHY_NODE.LIGHTING) || pokemon === jieming) return;
  if (pokemon.getHpRatio() > LIGHTING_HP_THRESHOLD) return;
  const wave = globalScene.currentBattle?.waveIndex ?? -1;
  if (jieming.customPokemonData.seaGuardLowHpWave === wave) return;
  jieming.customPokemonData.seaGuardLowHpWave = wave;
  addShield(jieming, pokemon, LIGHTING_SHIELD_RATIO, 3);
  globalScene.queueMessage(`追光灯打到 ${pokemon.name} 身上 —— 【打光】的护盾张开了！`);
}

/** 产物 `zTe` — 5 命「追光」：同伴使用威力 ≥80 招式后附盾 */
export function trySeaGuardChase(pokemon: any, power: number): void {
  if (!pokemon?.isPlayer() || pokemon.isFainted()) return;
  const jieming = getJiemingPokemon();
  if (!jieming || !jiemingNodeActive(jieming, MANAPHY_NODE.CHASE) || pokemon === jieming) return;
  if (power < CHASE_POWER_THRESHOLD) return;
  const battle = globalScene.currentBattle;
  const counter = gameMode?.isP5X ? (battle?.p5xActionCounter ?? -1) : (battle?.turn ?? -1);
  const actionKey = (battle?.waveIndex ?? 0) * 1e4 + counter;
  if (pokemon.customPokemonData?.seaGuardChaseAction === actionKey) return;
  pokemon.customPokemonData.seaGuardChaseAction = actionKey;
  addShield(jieming, pokemon, CHASE_SHIELD_RATIO, CHASE_SHIELD_TURNS);
  globalScene.queueMessage(`追光追随 ${pokemon.name} 的余韵 —— 【追光】的护盾张开了！`);
}

// ─────────────────────────────────────────────────────────────
// 4b. 损伤管线守卫（产物在调用点用 `try{...}catch(e){console.error(...)}` 包裹，
//     日志串属本系统 → 迁移为带降级日志的安全包装）
// ─────────────────────────────────────────────────────────────

/** 打光结算守卫（产物调用点：`try{jTe(this)}catch(e){console.error("[解明] 打光结算失败:",e)}`） */
export function safeTrySeaGuardLighting(pokemon: any): void {
  try {
    trySeaGuardLighting(pokemon);
  } catch (err) {
    console.error("[解明] 打光结算失败:", err);
  }
}

/** 追光结算守卫（产物调用点：`try{zTe(s,r)}catch(e){console.error("[解明] 追光结算失败:",e)}`） */
export function safeTrySeaGuardChase(pokemon: any, power: number): void {
  try {
    trySeaGuardChase(pokemon, power);
  } catch (err) {
    console.error("[解明] 追光结算失败:", err);
  }
}

/** 永不谢幕增伤守卫（产物调用点：`try{f=xTe(s)}catch(e){console.error("[解明] 永不谢幕增伤计算失败:",e)}`） */
export function safeSeaGuardFinaleDamageMultiplier(pokemon: any): number {
  try {
    return seaGuardFinaleDamageMultiplier(pokemon);
  } catch (err) {
    console.error("[解明] 永不谢幕增伤计算失败:", err);
    return 1;
  }
}

// ─────────────────────────────────────────────────────────────
// 5. 护盾（产物 `nT` / `qTe` / `Nw(bw,...)`）
// ─────────────────────────────────────────────────────────────

/** 产物 `nT` — 附加解明护盾（按解明物防 × 比例），并挂 `jieming:shield` |
 *  注：`rounds` 参数产物用 `{rounds: A}` 传入。 */
export function addShield(jieming: any, target: any, ratio: number, rounds: number): void {
  target.addJiemingShield(shieldAmountFrom(jieming, ratio));
  target.updateInfo();
  applyP5XEffect(target, JIEMING_SHIELD_TAG, { rounds });
  const active = getJiemingPokemon();
  const noCurtain = active ? jiemingNodeActive(active, MANAPHY_NODE.NO_CURTAIN) : false;
  target.jiemingShieldSeaGuardCost =
    !noCurtain && seaGuardLayersOf(target) >= SEA_GUARD_ATK_THRESHOLD ? SHIELD_EXPIRE_LAYER_COST : 0;
}

/** 产物 `qTe` — 护盾量 = 解明物防 × 比例（至少 1） */
export function shieldAmountFrom(jieming: any, ratio: number): number {
  return Math.max(1, Math.floor(jieming.getEffectiveStat(Stat.DEF) * ratio));
}

/** 产物 `Nw(bw, ...)` — 解明护盾过期处理（清盾 + 扣层） */
export function registerJiemingShieldExpireHandler(): void {
  registerP5XEffectExpireHandler(JIEMING_SHIELD_TAG, (pokemon: any) => {
    pokemon.setJiemingShield(0);
    const cost = pokemon.jiemingShieldSeaGuardCost ?? 0;
    if (cost > 0) removeSeaGuard(pokemon, cost);
    pokemon.jiemingShieldSeaGuardCost = 0;
    pokemon.updateInfo();
  });
}

// ─────────────────────────────────────────────────────────────
// 6. 内建解明招式表（产物 `wm`，逐字保留 apply 逻辑与中文描述）
// ─────────────────────────────────────────────────────────────

/** 产物 `wm` — 海之守护的三个解明招式（解明框架的**缺省模块**） */
export const JIEMING_SKILLS: JiemingSkill[] = [
  {
    id: JIEMING_SKILL_SOOTHING_SONG,
    name: "精神补充",
    cooldown: 8,
    description: `我方全体获得解明宝可梦物防 ${pct(JIEMING_SHIELD_RATIOS.soothingSong)} 的护盾，持有 ${JIEMING_SHIELD_TURNS.soothingSong} 回合；回复所有招式 ${SOOTHING_SONG_PP_RESTORE} 点 PP，并各获得 1 层【海之守护】。`,
    apply: (user: any, targets: any[]) => {
      for (const target of targets) {
        addShield(user, target, JIEMING_SHIELD_RATIOS.soothingSong, JIEMING_SHIELD_TURNS.soothingSong);
        restorePp(target, SOOTHING_SONG_PP_RESTORE);
        addSeaGuard(target, 1);
      }
    },
  },
  {
    id: JIEMING_SKILL_INTERSECTING_DANCE,
    name: "精神屏障",
    cooldown: 8,
    needsAllyTarget: true,
    description: `我方单体获得解明宝可梦物防 ${pct(JIEMING_SHIELD_RATIOS.intersectingDance)} 的护盾，持有 ${JIEMING_SHIELD_TURNS.intersectingDance} 回合；并获得 2 层【海之守护】与 ${CONTROL_BLOCK_CHARGES} 层【控制抵挡】（每层抵消一次畏缩 / 着迷 / 麻痹 / 睡眠 / 冰冻；并立即解除目标身上已有的同类控制，每解除一个同样消耗 1 层）。`,
    apply: (user: any, targets: any[]) => {
      const target = targets[0] ?? user;
      addShield(user, target, JIEMING_SHIELD_RATIOS.intersectingDance, JIEMING_SHIELD_TURNS.intersectingDance);
      addSeaGuard(target, 2);
      target.controlBlockCharges += CONTROL_BLOCK_CHARGES;
      const cleared = target.clearControlEffects();
      if (cleared > 0) {
        globalScene.queueMessage(`【控制抵挡】解除了 ${target.name} 身上的 ${cleared} 个控制效果！`);
      }
      target.updateInfo();
    },
  },
  {
    id: JIEMING_SKILL_DAWN_BUBBLE,
    name: "黎明的泡沫",
    cooldown: 12,
    description: `我方全体获得解明宝可梦物防 ${pct(JIEMING_SHIELD_RATIOS.dawnBubble)} 的护盾，持有 ${JIEMING_SHIELD_TURNS.dawnBubble} 回合，物防 / 特防 +1；【海之守护】≥${DAWN_BUBBLE_BONUS_LAYER} 层时额外获得物防 ${pct(JIEMING_SHIELD_RATIOS.dawnBubbleBonus)} 的护盾，物攻 / 特攻 +1。`,
    apply: (user: any, targets: any[]) => {
      for (const target of targets) {
        const layers = seaGuardLayersOf(target);
        addShield(user, target, JIEMING_SHIELD_RATIOS.dawnBubble, JIEMING_SHIELD_TURNS.dawnBubble);
        boost(target, [Stat.DEF, Stat.SPDEF], 1);
        if (layers >= DAWN_BUBBLE_BONUS_LAYER) {
          addShield(user, target, JIEMING_SHIELD_RATIOS.dawnBubbleBonus, JIEMING_SHIELD_TURNS.dawnBubble);
          boost(target, [Stat.ATK, Stat.SPATK], 1);
        }
      }
    },
  },
];

/**
 * 把三个内建招式登记为解明框架的**缺省模块**（产物：MANAPHY 未调用 `fEe`，
 * 由 `tL` 的兜底值 `wm` 承担；此处用提供者钩子等价实现）。
 */
export function registerSeaGuardJiemingModule(): void {
  setDefaultJiemingSkills(() => JIEMING_SKILLS);
}

// ─────────────────────────────────────────────────────────────
// 7. 解明框架设施的再导出（deprecation shim）
// ---------------------------------------------------------------------------
// A3-05 曾把这些设施的**实现**放在本文件；A3-07 已迁至 `jieming-system.ts`。
// 此处仅再导出，保证 A3-05 既有引用不破；**新代码请直接从 `jieming-system` 导入**。
// ─────────────────────────────────────────────────────────────

export {
  playerField,
  getJiemingTargets,
  getJiemingPokemon,
  isJiemingEligible,
  isJiemingRosterSpeciesId,
  hasJiemingConstellation,
  jiemingNodeActive,
  isSeaGuardSpecies,
  isJiemingSpecies,
  getJiemingCounterFor,
  getJiemingSkillsFor,
  getActiveJiemingSkills,
  findJiemingSkill,
  effectiveCooldown,
  isSkillReady,
  getJiemingButtonState,
  skillCooldownRemaining,
  getUserCooldowns,
  markSkillUsed,
  armJiemingCooldowns,
  tickJiemingCooldownsByAllyAction,
  consumeShieldBreakBonuses,
  buildJiemingShareBonus,
  applyJiemingShare,
  refreshJiemingShare,
  JIEMING_SHARE_RATIO,
  JIEMING_SHARE_STATS,
  JIEMING_MODULE_NAME,
  JIEMING_NODE,
  JIEMING_MODULE_ROOT,
} from "./jieming-system";

// ─────────────────────────────────────────────────────────────
// TODO(接入锚点 90df65097b6d)：本文件依赖清单
// ─────────────────────────────────────────────────────────────
// TODO(接入锚点): globalScene / gameMode → #app/global-scene
// TODO(接入锚点): Stat → #enums/stat；SpeciesId → #enums/species-id
// TODO(接入锚点): applyP5XEffect / registerP5XEffectExpireHandler → P5X 系统导出（A3-09）
// TODO(接入锚点): `boost`（`Lse`）应改为调用 `#phases/stat-stage-change-phase` 的
//                 StatStageChangePhase（当前为占位调用，见 §4）
// TODO(接入锚点): 把 registerSeaGuardSystem / registerSeaGuardJiemingModule /
//                 registerJiemingShieldExpireHandler 挂到系统初始化点
// TODO(A4-验证): `addShield` 的 `{rounds}` 与 `addMewShield` 的 `{turns}` 参数命名差异
//                （产物两处确实不同），需按真实 P5X 效果接口确认
