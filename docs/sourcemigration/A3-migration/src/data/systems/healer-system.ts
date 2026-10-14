/**
 * 生命的余响（HEALER）—— 自研系统迁移
 * ---------------------------------------------------------------------------
 * 来源：game/server/dist/assets/loading-scene-By2k7Qfx.js（.orig 产物）@2144010 起
 * 逆向方式：`l(短名,"原函数名")` 反查 + 常量赋值精确定位（见 A3-迁移规范 §3）
 * 锚点树：90df65097b6df76f713e6bd108afa84499e8b993
 *
 * 定位：命座接入组 7 系统之一（A3-05）。物种 = 小福蛋 / 大奶罐 / 保母虫 / 爱管侍
 *       （`Vre`）。核心是「伤害招式转治疗」+【生机】层数（满 3 层进【圣咏】）+
 *       治疗溢出转护盾 + 5 命【祈愿】救起队友。经公共底座 `registerConstellation`
 *       注册 6 个命座节点（`exclusiveNodes` 覆盖 1/2/3/4/5/6）。
 *
 * 产物符号对照（去混淆映射，务必逐条保留）：
 *   hI   → registerConstellation        （公共底座）
 *   sa   → constellationLevel$1         （公共底座）
 *   US   → constellationNodeIsExclusive （公共底座）
 *   vo   → healerDataOf                 （= customPokemonData）
 *   z    → debugLog
 *   E    → globalScene
 *   p    → Stat
 *   Se   → StatusEffect
 *   Z    → BattlerTagType
 *   B    → MoveCategory
 *   Le   → MoveTarget
 *   mi   → PokemonHealPhase
 *   PIe  → setHealerConversionTargetProvider（上游：治疗转换目标提供者）
 *
 *   常量：
 *   eb   → HEALER_NODE.CHANT       (=1)
 *   pU   → HEALER_NODE.ECHO        (=2)
 *   Kre  → HEALER_NODE.CLEANSE     (=3)
 *   tb   → HEALER_NODE.BOND        (=4)
 *   Wre  → HEALER_NODE.WISH        (=5)
 *   lg   → HEALER_NODE.RESONANCE   (=6)
 *   Mce  → VIGOR_MAX_BASE          (=3)
 *   Uce  → VIGOR_MAX_RESONANCE     (=5)
 *   nL   → VIGOR_CHANT_THRESHOLD   (=3)
 *   Dce  → HEAL_BASE_RATIO         (=0.35)
 *   fce  → HEAL_PER_VIGOR          (=0.12)
 *   Pce  → HEAL_PER_VIGOR_SIX      (=0.2)
 *   _ce  → SHIELD_FROM_OVERFLOW    (=0.5)
 *   Gce  → SHIELD_CAP_RATIO        (=0.8)
 *   pse  → CLEANSE_TURNS           (=1)
 *   gce  → LOSS_BONUS_PER_10       (=0.15) → 实际每 10% 损失 +8%（`$re` 用 Hce=0.1）
 *   Hce  → LOSS_BONUS_STEP         (=0.1)
 *   pce  → LOSS_BONUS_PER_STEP     (=0.08)
 *   mce  → LOSS_BONUS_MAX          (=0.4)
 *   Bce  → WISH_REVIVE_HP_RATIO    (=2)
 *   yce  → WISH_REVIVE_HP_MIN      (=1)
 *   mse  → GUARD_TURNS             (=2)
 *   Fce  → SPREAD_HEAL_MULT        (=0.5)
 *   Yre  → CHANT_PP_RESTORE        (=5)
 *   Kce  → CONVERT_DENOM           (=100)
 *   Wce  → CONVERT_SINGLE_RATIO    (=0.65)
 *   Yce  → CONVERT_SPREAD_RATIO    (=0.3)
 *   aB/bce/xce/wre → tag `healer:chant` / `healer:guard` / `healer:cleanse` / `healer:shield`
 *                                            + `vre`（`$Ie(gce)` = 治疗 buff tag）
 *   Xce  → CLEANSABLE_STATUSES
 *   Nhe  → CONVERT_SPREAD_TARGETS
 */
import { registerConstellation, type ConstellationCodexEntry } from "./constellation-framework";
import {
  getJiemingPokemon,
  getJiemingTargets,
  findJiemingSkill,
  isSkillReady,
  markSkillUsed,
  JiemingResolvePhase,
} from "./jieming-system";

// ─────────────────────────────────────────────────────────────
// 0. 依赖（上游 API，待接入锚点源码时改为真实 import）
// ─────────────────────────────────────────────────────────────
declare const globalScene: any; // 产物 `E`
declare const gameMode: any; // 产物 `E.gameMode`
declare const Stat: any; // 产物 `p`
declare const StatusEffect: any; // 产物 `Se`
declare const BattlerTagType: any; // 产物 `Z`
declare const MoveCategory: any; // 产物 `B`
declare const MoveTarget: any; // 产物 `Le`
declare const SpeciesId: any; // 产物 `e`
declare const debugLog: (type: string, msg: string) => void; // 产物 `z`
declare const constellationLevel: (species: any, node: number) => number; // 产物 `sa`
declare const constellationNodeIsExclusive: (species: any, node: number, data?: any) => boolean; // 产物 `US`
declare const PokemonHealPhase: any; // 产物 `mi`
declare const isMoveDynamicallySpread: (user: any, move: any) => boolean; // 产物 `sS`
declare const setHealerConversionTargetProvider: (
  provider: (user: any, move: any) => { targets: number[]; multiple: boolean } | undefined,
) => void; // 产物 `PIe`

// ─────────────────────────────────────────────────────────────
// 1. 常量（还原自产物 `eb..Yre` / `Xce` / `Nhe`）
// ─────────────────────────────────────────────────────────────

/** 命座节点索引（`Qce.exclusiveNodes` 的顺序即此常量组） */
export const HEALER_NODE = {
  /** 圣咏的起点（伤害转治疗 + 生机） */
  CHANT: 1, // 产物 `eb`
  /** 温柔的余响（治疗溢出转护盾） */
  ECHO: 2, // 产物 `pU`
  /** 净化之息（治疗命中解除异常 + 减伤） */
  CLEANSE: 3, // 产物 `Kre`
  /** 共鸣的羁绊（按已损失生命加成治疗量） */
  BOND: 4, // 产物 `tb`
  /** 不灭的祈愿（5 命救起队友） */
  WISH: 5, // 产物 `Wre`
  /** 生命的共鸣（上限 3→5、治疗加成翻倍、圣咏转全体） */
  RESONANCE: 6, // 产物 `lg`
} as const;

/** 【生机】层数上限 */
export const VIGOR_MAX_BASE = 3; // 产物 `Mce`
export const VIGOR_MAX_RESONANCE = 5; // 产物 `Uce`
/** 进入【圣咏】所需层数 */
export const VIGOR_CHANT_THRESHOLD = 3; // 产物 `nL`

/** 治疗量公式系数（产物 `ihe`） */
export const HEAL_BASE_RATIO = 0.35; // 产物 `Dce`
export const HEAL_PER_VIGOR = 0.12; // 产物 `fce`
export const HEAL_PER_VIGOR_SIX = 0.2; // 产物 `Pce`

/** 治疗溢出转护盾比例 / 护盾上限（自生特防 × 比例） */
export const SHIELD_FROM_OVERFLOW = 0.5; // 产物 `_ce`
export const SHIELD_CAP_RATIO = 0.8; // 产物 `Gce`

/** 净化效果持续回合 */
export const CLEANSE_TURNS = 1; // 产物 `pse`
/** 3 命「净化之息」的减伤比例（1 回合） |
 *  注：产物 `gce`（=0.15）同时作为减伤 tag 的强度与「共鸣的羁绊」步长。 */
export const CLEANSE_DAMAGE_REDUCE = 0.15; // 产物 `gce`

/** 4 命「共鸣的羁绊」按已损失生命加成 */
export const LOSS_BONUS_STEP = 0.1; // 产物 `Hce`（每 10%）
export const LOSS_BONUS_PER_STEP = 0.08; // 产物 `pce`
export const LOSS_BONUS_MAX = 0.4; // 产物 `mce`

/** 5 命【祈愿】救起 HP = 自生特防 × 200% */
export const WISH_REVIVE_HP_RATIO = 2; // 产物 `Bce`
export const WISH_REVIVE_HP_MIN = 1; // 产物 `yce`
/** 5 命【祈愿】全队减伤持续回合 */
export const GUARD_TURNS = 2; // 产物 `mse`

/** 6 命「生命的共鸣」：伤害转治疗群体为单人的 50% */
export const SPREAD_HEAL_MULT = 0.5; // 产物 `Fce`

/** 【圣咏】触发时回复的 PP 点数 |
 *  注：产物 `Yre`（=5）用于 `Ehe(S, Yre)` 回 PP。 */
export const CHANT_PP_RESTORE = 5; // 产物 `Yre`

/** 伤害转治疗换算系数（产物 `Lhe`） */
export const CONVERT_DENOM = 100; // 产物 `Kce`
export const CONVERT_SINGLE_RATIO = 0.65; // 产物 `Wce`
export const CONVERT_SPREAD_RATIO = 0.3; // 产物 `Yce`

/** 效果 tag（产物 `aB` / `bce` / `xce` / `vre` / `wre`） |
 *  注：`vre` 为 `$Ie(gce)` 的产物变量名，此处统一按语义命名。 */
export const HEALER_TAG_CHANT = "healer:chant"; // 产物 `aB`
export const HEALER_TAG_GUARD = "healer:guard"; // 产物 `bce`
export const HEALER_TAG_CLEANSE = "healer:cleanse"; // 产物 `xce`
export const HEALER_TAG_SHIELD = "healer:shield"; // 产物 `wre`
export const HEALER_TAG_CLEANSE_REDUCE = "healer:cleanse-reduce"; // 产物 `vre`

/** 可被「净化之息」解除的异常（产物 `Xce`） */
export const CLEANSABLE_STATUSES: readonly any[] = [
  StatusEffect?.POISON,
  StatusEffect?.TOXIC,
  StatusEffect?.PARALYSIS,
  StatusEffect?.BURN,
  StatusEffect?.FREEZE,
  StatusEffect?.SLEEP,
].filter((x) => x !== undefined);

/** 伤害转治疗的群体目标集合（产物 `Nhe`） */
export const CONVERT_SPREAD_TARGETS: readonly number[] = [
  MoveTarget?.ALL_NEAR_ENEMIES,
  MoveTarget?.ALL_ENEMIES,
  MoveTarget?.ALL_NEAR_OTHERS,
  MoveTarget?.ALL_OTHERS,
].filter((x) => x !== undefined);

/** 【生命的余响】可用种族（产物 `Vre`） */
export const HEALER_SPECIES: readonly number[] = [
  SpeciesId?.HAPPINY, // 小福蛋
  SpeciesId?.MILTANK, // 大奶罐
  SpeciesId?.COMFEY, // 保母虫
  SpeciesId?.INDEEDEE, // 爱管侍
].filter((x) => x !== undefined);

/** 系统说明（产物 `$ce`，逐字保留为机读规格） */
export const HEALER_CODEX: ConstellationCodexEntry[] = [
  {
    name: "圣咏的起点",
    description:
      "伤害招式转治疗：单体回最大生命×威力×0.65%（你选人）；\n" +
      "群体各×0.3%，对敌零伤害。命中我方+1层【生机】\n" +
      "（每回合1次、每轮≤2层）。满3层【圣咏】：出招奶最低血者+5PP。",
  },
  {
    name: "温柔的余响",
    description: "治疗的溢出部分，50% 转为护盾（上限 自生特防×80%），持续 3 轮。",
  },
  {
    name: "净化之息",
    description:
      "治疗命中我方时（满血也算），解除其 1 个异常（中毒/剧毒/麻痹/灼烧/冰冻/睡眠），\n" +
      "并使其 1 回合内受到的伤害 −15%。",
  },
  {
    name: "共鸣的羁绊",
    description: "治疗量按目标已损失生命提升：每损失 10% 生命，治疗量 +8%（最多 +40%）。",
  },
  {
    name: "不灭的祈愿",
    description:
      "解锁指令按钮【祈愿】：【生机】≥3 且有队友倒下时亮起。\n" +
      "按下消耗全部【生机】与本回合行动，救起一名队友（回复 自生特防×200%）。\n" +
      "全队 2 回合受伤 −15%，每波一次。",
  },
  {
    name: "生命的共鸣",
    description:
      "【生机】上限 3→5；每层治疗加成 +12%→+20%。\n" +
      "【圣咏】改为治疗我方全体，单人为原值的 50%。",
  },
];

/** 命座注册载荷（产物 `Qce`） */
export const HEALER_CONSTELLATION_PAYLOAD = {
  exclusiveNodes: [
    HEALER_NODE.CHANT,
    HEALER_NODE.ECHO,
    HEALER_NODE.CLEANSE,
    HEALER_NODE.BOND,
    HEALER_NODE.WISH,
    HEALER_NODE.RESONANCE,
  ],
};

// ─────────────────────────────────────────────────────────────
// 2. 注册（产物：`for(const n of Vre)hI(n,$ce,Qce)`）
// ─────────────────────────────────────────────────────────────

/** 把【生命的余响】系统注册进公共命座框架（对每个可用种族各注册一次）。 */
export function registerHealerSystem(): void {
  for (const species of HEALER_SPECIES) {
    registerConstellation(species, HEALER_CODEX, HEALER_CONSTELLATION_PAYLOAD);
  }
}

// ─────────────────────────────────────────────────────────────
// 3. 核心工具函数
// ─────────────────────────────────────────────────────────────

/** 产物 `vo` — 读取自定义宝可梦数据（= customPokemonData） */
export function healerDataOf(pokemon: any): any {
  return pokemon?.customPokemonData;
}

/** 产物 `kre` — 判定种族是否属于【生命的余响】体系 */
export function isHealerSpecies(species: number): boolean {
  return HEALER_SPECIES.includes(species);
}

/** 产物 `bre` — 当前回合数（`turn`） */
export function currentTurn$1(): number {
  return globalScene?.currentBattle?.turn ?? -1;
}

/** 产物 `Vce` — 当前回合的全局序（wave*1e4 + turn） */
export function currentRoundKey$1(): number {
  const battle = globalScene?.currentBattle;
  return battle ? (battle.waveIndex ?? 0) * 1e4 + (battle.turn ?? -1) : -1;
}

/** 产物 `Zre` — 当前行动序（P5X 模式用 actionCounter，否则用 turn） */
export function currentActionKey$1(): number {
  const battle = globalScene?.currentBattle;
  if (!battle) return -1;
  const counter = gameMode?.isP5X ? (battle.p5xActionCounter ?? -1) : (battle.turn ?? -1);
  return (battle.waveIndex ?? 0) * 1e4 + counter;
}

/** 产物 `EB` — 当前波次号 */
export function currentWave$1(): number {
  return globalScene?.currentBattle?.waveIndex ?? -1;
}

/** 产物 `T0` — 我方队伍全体（非空） */
export function playerParty(): any[] {
  return (globalScene?.getPlayerParty?.() ?? []).filter((p: any) => !!p);
}

/** 产物 `Sg` — 是否被上「回复禁止」类 BattlerTag */
export function isHealBlocked(pokemon: any): boolean {
  return !!pokemon?.getTag?.(BattlerTagType.HEAL_BLOCK);
}

/** 产物 `Jre` — 队伍中已点亮某节点的治疗单位 */
export function findHealerWithNode(node: number): any {
  return playerParty().find((p: any) => !p.isFainted() && healerNodeActive(p, node));
}

// ─────────────────────────────────────────────────────────────
// 4. 命座判定
// ─────────────────────────────────────────────────────────────

/** 产物 `Jce` — 读取宝可梦的命座等级（非治疗体系返回 0） */
export function healerLevelOf(pokemon: any): number {
  const rootSpecies = pokemon?.species?.getRootSpeciesId?.();
  if (rootSpecies === undefined || !isHealerSpecies(rootSpecies)) return 0;
  return constellationLevel(globalScene?.gameData?.ptSoudacheData, rootSpecies);
}

/** 产物 `vr` — 判定某命座节点是否已激活 */
export function healerNodeActive(pokemon: any, node: number): boolean {
  const rootSpecies = pokemon?.species?.getRootSpeciesId?.();
  if (rootSpecies === undefined || !isHealerSpecies(rootSpecies)) return false;
  return constellationNodeIsExclusive(rootSpecies, node, globalScene?.gameData?.ptSoudacheData);
}

// ─────────────────────────────────────────────────────────────
// 5. 【生机】与【圣咏】
// ─────────────────────────────────────────────────────────────

/** 产物 `wo` — 读取【生机】层数（经钳制） */
export function healerVigorStacksOf(pokemon: any): number {
  const data = healerDataOf(pokemon);
  return data ? healerVigorClamp(pokemon, data.healerVigor ?? 0) : 0;
}

/** 产物 `S0` — 当前【生机】上限（6 命则 5） */
export function healerVigorMaxFor(pokemon: any): number {
  return healerNodeActive(pokemon, HEALER_NODE.RESONANCE) ? VIGOR_MAX_RESONANCE : VIGOR_MAX_BASE;
}

/** 产物 `Xre` — 层数钳制到 [0, max] */
export function healerVigorClamp(pokemon: any, value: number): number {
  return Math.max(0, Math.min(healerVigorMaxFor(pokemon), Math.floor(value) || 0));
}

/** 产物 `jce` — 是否处于【圣咏】（≥3 层） */
export function inHealerChant(pokemon: any): boolean {
  return healerVigorStacksOf(pokemon) >= VIGOR_CHANT_THRESHOLD;
}

/** 产物 `sb` — 同步【圣咏】tag（与层数一致） */
export function syncHealerChant(pokemon: any): void {
  if (inHealerChant(pokemon)) {
    applyP5XEffectRaw(pokemon, HEALER_TAG_CHANT, {});
  } else {
    clearBattlerTag(pokemon, HEALER_TAG_CHANT);
  }
}

/** 产物 `zce` — 回合内按层数同步【圣咏】状态（返回是否发生变化） */
export function syncHealerChantFromStacks(pokemon: any): boolean {
  if (!pokemon?.isPlayer?.() || !pokemon?.isOnField?.() || !gameMode?.isEryou || !healerNodeActive(pokemon, HEALER_NODE.CHANT)) {
    return false;
  }
  const should = healerVigorStacksOf(pokemon) >= VIGOR_CHANT_THRESHOLD;
  const has = hasBattlerTag(pokemon, HEALER_TAG_CHANT);
  if (should === has) return false;
  syncHealerChant(pokemon);
  return true;
}

/** 产物 `qce` — 获得【生机】层数；返回实际增加量 */
export function gainHealerVigor(pokemon: any, amount: number): number {
  const data = healerDataOf(pokemon);
  if (!data || amount <= 0) return 0;
  const before = healerVigorStacksOf(pokemon);
  const after = healerVigorClamp(pokemon, before + amount);
  if (after === before) return 0;
  data.healerVigor = after;
  syncHealerChant(pokemon);
  pokemon.updateInfo();
  debugLog("battle", "[生命的余响] " + pokemon.name + " 获得 " + (after - before) + " 层【生机】 → " + after + "/" + healerVigorMaxFor(pokemon));
  return after - before;
}

/** 产物 `ehe` — 消耗全部【生机】（退出【圣咏】） */
export function consumeHealerVigor(pokemon: any): number {
  const data = healerDataOf(pokemon);
  if (!data) return 0;
  const before = healerVigorStacksOf(pokemon);
  data.healerVigor = 0;
  syncHealerChant(pokemon);
  pokemon.updateInfo();
  debugLog("battle", "[生命的余响] " + pokemon.name + " 消耗全部 " + before + " 层【生机】（退出【圣咏】）");
  return before;
}

// ─────────────────────────────────────────────────────────────
// 6. 护盾
// ─────────────────────────────────────────────────────────────

/** 产物 `kce` — 读取目标身上由某治疗单位挂的护盾条目 */
export function healerShieldEntryOf(target: any, healerId: number): any {
  const entries = healerDataOf(target)?.healerShieldEntries;
  return Array.isArray(entries) ? entries.find((e: any) => e?.healerId === healerId) : undefined;
}

/** 产物 `Zce` — 取得（或惰性创建）目标身上由某治疗单位挂的护盾条目 */
export function healerShieldEntryFor(target: any, healerId: number): any {
  const data = healerDataOf(target);
  if (!data) return undefined;
  if (!Array.isArray(data.healerShieldEntries)) data.healerShieldEntries = [];
  const entries = data.healerShieldEntries;
  let entry = entries.find((e: any) => e?.healerId === healerId);
  if (!entry) {
    entry = { healerId, amount: 0, expireRound: -1 };
    entries.push(entry);
  }
  return entry;
}

/** 产物 `xre` — 护盾到期处理（扣减 shied 池 + 记录日志） |
 *  注：产物作为 `Nw(wre, xre)` 的过期回调。 */
export function onHealerShieldExpire(target: any): void {
  const data = healerDataOf(target);
  const entries = data?.healerShieldEntries;
  if (!entries?.length) return;
  const now = currentTurn$1();
  const expired = entries
    .filter((e: any) => (e?.expireRound ?? 0) <= now)
    .sort((a: any, b: any) => a.expireRound - b.expireRound);
  let removed = 0;
  for (const entry of expired) {
    const current = target.getJiemingShield?.() ?? 0;
    const take = Math.min(current, Math.max(0, entry.amount));
    if (take > 0) {
      target.setJiemingShield(current - take);
      removed += take;
    }
    const idx = entries.indexOf(entry);
    if (idx >= 0) entries.splice(idx, 1);
  }
  if (removed > 0) {
    if (target.getBattleInfo?.()) target.updateInfo();
    debugLog("battle", "[生命的余响] 2 命护盾到期：" + target.name + " -" + removed + "（池内剩 " + (target.getJiemingShield?.() ?? 0) + "）");
  }
  if (entries.length) applyP5XEffectRaw(target, HEALER_TAG_SHIELD, { rounds: 1, onExpire: onHealerShieldExpire });
}

/** 产物 `the` — 护盾上限（自生特防 × 80%） */
export function healerShieldCap(spdef: number): number {
  return Math.max(0, Math.floor(Math.max(0, spdef) * SHIELD_CAP_RATIO));
}

/** 产物 `she` — 溢出转护盾量（溢出量 × 50%） */
export function healerShieldFromOverflow(overflow: number): number {
  return Math.max(0, Math.floor(Math.max(0, overflow) * SHIELD_FROM_OVERFLOW));
}

/** 产物 `rhe` — 治疗溢出转护盾（2 命「温柔的余响」） |
 *  注：护盾池按治疗单位 id 隔离。 */
export function applyHealerOverflowShield(target: any, overflow: number, _unused: any): number {
  if (!(overflow > 0) || !gameMode?.isEryou || !target?.isPlayer?.() || target.isFainted()) return 0;
  const healer = findHealerWithNode(HEALER_NODE.ECHO);
  if (!healer || healer.isFainted() || !healerNodeActive(healer, HEALER_NODE.ECHO)) return 0;
  const cap = healerShieldCap(healer.getEffectiveStat(Stat.SPDEF));
  const add = healerShieldFromOverflow(overflow);
  if (add <= 0) return 0;
  const healerId = healer.id ?? -1;
  const entry = healerShieldEntryOf(target, healerId);
  const current = Math.max(0, entry?.amount ?? 0);
  const total = Math.min(cap, current + add);
  const gained = Math.max(0, total - current);
  if (gained <= 0) return 0;
  const slot = entry ?? healerShieldEntryFor(target, healerId);
  if (slot) {
    slot.amount = total;
    slot.expireRound = Math.max(slot.expireRound ?? -1, currentTurn$1() + 3);
  }
  target.addJiemingShield(gained);
  applyP5XEffectRaw(target, HEALER_TAG_SHIELD, { rounds: 1, onExpire: onHealerShieldExpire });
  if (target.getBattleInfo?.()) target.updateInfo();
  debugLog("battle", "[生命的余响] " + target.name + " 治疗溢出 " + overflow + " → 护盾 +" + gained + "（上限 " + cap + "）");
  return gained;
}

// ─────────────────────────────────────────────────────────────
// 7. 治疗 / 净化 / 减伤
// ─────────────────────────────────────────────────────────────

/** 产物 `ihe` — 治疗量公式 |
 *  注：`six`（6 命）改用 `Pce`，`hpRatio` 经 `$re` 加成，`spread` 再 ×0.5。 */
export function healerHealValue(
  spdef: number,
  vigor: number,
  opts: { six?: boolean; hpRatio?: number; spread?: boolean } = {},
): number {
  const vigorFactor = 1 + (opts.six ? HEAL_PER_VIGOR_SIX : HEAL_PER_VIGOR) * Math.max(0, vigor);
  const lossFactor = 1 + healerLossBonus(opts.hpRatio ?? 1);
  let value = Math.max(0, spdef) * HEAL_BASE_RATIO * vigorFactor * lossFactor;
  if (opts.spread) value *= SPREAD_HEAL_MULT;
  return Math.max(1, Math.round(value));
}

/** 产物 `$re` — 4 命「共鸣的羁绊」：按已损失生命加成治疗量 |
 *  注：`hpRatio` 为当前生命比，`1-hpRatio` 为已损失比。 */
export function healerLossBonus(hpRatio: number): number {
  const loss = 1 - (Number.isFinite(hpRatio) ? Math.min(1, Math.max(0, hpRatio)) : 1);
  const steps = Math.floor(loss / LOSS_BONUS_STEP + 1e-9);
  return Math.min(LOSS_BONUS_MAX, Math.max(0, steps) * LOSS_BONUS_PER_STEP);
}

/** 产物 `nhe` — 【祈愿】救起的 HP（自生特防 × 200%，至少 1） */
export function healerWishReviveHp(spdef: number, targetMaxHp: number): number {
  const raw = Math.round(Math.max(0, spdef) * WISH_REVIVE_HP_RATIO);
  return Math.max(WISH_REVIVE_HP_MIN, Math.min(Math.max(1, targetMaxHp), raw));
}

/** 产物 `Ahe` — 血量百分比最低的队友（排除自身/濒死/回复禁止） */
export function lowestHpRatioAlly$2(pokemon: any): any {
  let best: any;
  let lowest = Number.POSITIVE_INFINITY;
  for (const ally of playerParty()) {
    if (ally === pokemon || ally.isFainted() || isHealBlocked(ally)) continue;
    const ratio = ally.hp / Math.max(1, ally.getMaxHp());
    if (ratio < lowest) {
      lowest = ratio;
      best = ally;
    }
  }
  return best;
}

/** 产物 `Qre` — 已濒死的队友 */
export function faintedTeammates(): any[] {
  return playerParty().filter((p: any) => p.isFainted());
}

/** 产物 `ahe` — 给目标治疗 |
 *  注：在场目标优先走 `PokemonHealPhase`，否则直接 `heal`。 */
export function healPokemon(healer: any, target: any, amount: number, queuePhase = true): number {
  if (amount <= 0 || target.isFainted()) return 0;
  const battlerIndex = target.getBattlerIndex?.() ?? -1;
  if (target.isOnField() && battlerIndex >= 0) {
    const missing = Math.max(0, target.getMaxHp() - target.hp);
    const showOverflow = missing > 0 || !!findHealerWithNode(HEALER_NODE.ECHO);
    globalScene.unshiftPhase(new PokemonHealPhase(battlerIndex, amount, null, showOverflow, queuePhase));
    return Math.min(amount, missing);
  }
  const healed = target.heal(amount);
  target.updateInfo?.();
  return healed;
}

/** 产物 `Ehe` — 回复招式 PP（优先回复消耗最多的招式） */
export function restoreHealerPp(pokemon: any, amount = CHANT_PP_RESTORE): number {
  if (!pokemon || !(amount > 0) || !gameMode?.isEryou) return 0;
  const moveset = pokemon.getMoveset?.() ?? [];
  const used: { move: any; index: number }[] = [];
  for (let i = 0; i < moveset.length; i++) {
    const move = moveset[i];
    if (move && move.ppUsed > 0) used.push({ move, index: i });
  }
  used.sort((a, b) => a.move.getPpRatio() - b.move.getPpRatio() || a.index - b.index);
  let remaining = Math.floor(amount);
  let restored = 0;
  for (const { move } of used) {
    if (remaining <= 0) break;
    const take = Math.min(remaining, move.ppUsed);
    move.ppUsed = Math.max(0, move.ppUsed - take);
    remaining -= take;
    restored += take;
  }
  if (restored > 0) {
    pokemon.updateInfo();
    debugLog("battle", "[生命的余响] " + pokemon.name + " 回复 " + restored + " 点 PP");
  }
  return restored;
}

/** 产物 `ohe` — 3 命「净化之息」：解除一个异常 + 挂减伤 tag */
export function applyHealerCleanse(target: any): boolean {
  if (!target || target.isFainted()) return false;
  let cleansed = false;
  const status = target.status?.effect;
  if (status !== undefined && CLEANSABLE_STATUSES.includes(status)) {
    target.resetStatus();
    cleansed = true;
  }
  applyP5XEffectRaw(target, HEALER_TAG_CLEANSE, { turns: CLEANSE_TURNS });
  applyP5XEffectRaw(target, HEALER_TAG_CLEANSE_REDUCE, { turns: CLEANSE_TURNS });
  return cleansed;
}

/** 产物 `Rhe` — 5 命【祈愿】全队减伤（2 回合） */
export function grantHealerGuard(): void {
  for (const pokemon of playerParty()) {
    if (pokemon.isFainted()) continue;
    applyP5XEffectRaw(pokemon, HEALER_TAG_GUARD, { turns: GUARD_TURNS });
    applyP5XEffectRaw(pokemon, HEALER_TAG_CLEANSE_REDUCE, { turns: GUARD_TURNS });
  }
}

// ─────────────────────────────────────────────────────────────
// 8. 5 命【祈愿】
// ─────────────────────────────────────────────────────────────

const WISH_USED = new WeakMap<any, number>();

/** 产物 `zre` — 当前 battle 对象（作为 Wish 使用记录的 key） */
export function currentBattleKey(): any {
  const battle = globalScene?.currentBattle;
  return battle && typeof battle === "object" ? battle : undefined;
}

/** 产物 `Ohe` — 本波次是否已用过【祈愿】 */
export function healerWishUsedThisWave(): boolean {
  const key = currentBattleKey();
  return key ? WISH_USED.get(key) === currentWave$1() : false;
}

/** 产物 `Ihe` — 标记本波次已用【祈愿】 */
export function markHealerWishUsed(pokemon: any): void {
  const key = currentBattleKey();
  if (key) WISH_USED.set(key, currentWave$1());
  const data = healerDataOf(pokemon);
  if (data) data.healerWishWave = currentWave$1();
}

/** 产物 `Tg` — 是否可提供治疗资源（点亮 1 命 + 在场 + Eryou 模式） */
export function healerResourceAvailable(pokemon: any): boolean {
  if (!pokemon?.isPlayer?.() || pokemon.isFainted() || !pokemon?.isOnField?.() || !gameMode?.isEryou) {
    return false;
  }
  return healerNodeActive(pokemon, HEALER_NODE.CHANT);
}

/** 产物 `qre` — 【生机】仪表状态 */
export function healerVigorGaugeState(pokemon: any): {
  visible: boolean;
  segments: number;
  lit: number;
  chant: boolean;
  thresholdSegment: number;
} {
  const available = healerResourceAvailable(pokemon);
  const segments = available && pokemon ? healerVigorMaxFor(pokemon) : 0;
  const stacks = available && pokemon ? healerVigorStacksOf(pokemon) : 0;
  return {
    visible: available,
    segments,
    lit: Math.max(0, Math.min(segments, stacks)),
    chant: available && stacks >= VIGOR_CHANT_THRESHOLD,
    thresholdSegment: VIGOR_CHANT_THRESHOLD,
  };
}

/** 产物 `eoe` — 【祈愿】是否就绪 */
export function healerWishReady(pokemon: any): boolean {
  if (!healerResourceAvailable(pokemon) || !healerNodeActive(pokemon, HEALER_NODE.WISH)) return false;
  if (healerVigorStacksOf(pokemon) < VIGOR_CHANT_THRESHOLD || healerWishUsedThisWave()) return false;
  return faintedTeammates().length > 0;
}

/** 产物 `lhe` — 【祈愿】按钮文案 */
export function healerWishButtonLabel(pokemon: any): string {
  return healerVigorStacksOf(pokemon) + "/" + healerVigorMaxFor(pokemon);
}

/** 产物 `She` — 消耗【生机】并记录本波已用【祈愿】 */
export function consumeHealerWish(pokemon: any): number {
  if (!healerDataOf(pokemon)) return 0;
  const consumed = consumeHealerVigor(pokemon);
  markHealerWishUsed(pokemon);
  return consumed;
}

/** 产物 `The` — 救起一名队友（回复 自生特防 × 200%）并全队减伤 */
export function reviveHealerAlly(healer: any, target: any): number {
  const spdef = healer.getEffectiveStat(Stat.SPDEF);
  const amount = healerWishReviveHp(spdef, target.getMaxHp());
  target.resetTurnData?.();
  target.resetStatus?.();
  const healed = Math.max(0, target.heal(amount));
  grantHealerGuard();
  target.updateInfo?.();
  globalScene.queueMessage?.(target.name + " 被【祈愿】唤醒，回复 " + healed + " 点生命！", 0, true);
  debugLog("battle", "[生命的余响] 5 命【祈愿】：" + healer.name + " → " + target.name + " 回复 " + healed + " 点生命");
  return healed;
}

// ─────────────────────────────────────────────────────────────
// 9. 伤害转治疗
// ─────────────────────────────────────────────────────────────

/** 产物 `Lhe` — 伤害转治疗的量（`maxHp × power / 100 × 比例`） */
export function healerConvertHealValue(
  targetMaxHp: number,
  power: number,
  spread = false,
  extra = 1,
): number {
  const value =
    (Math.max(0, targetMaxHp) * Math.max(0, power) * (spread ? CONVERT_SPREAD_RATIO : CONVERT_SINGLE_RATIO) * Math.max(0, extra)) /
    CONVERT_DENOM;
  return value > 0 ? Math.max(1, Math.floor(value + 1e-9)) : 0;
}

/** 产物 `toe` — 是否为群体化招式（目标集合 或 动态群体化） */
export function isHealerConvertSpreadMove(pokemon: any, move: any): boolean {
  return CONVERT_SPREAD_TARGETS.includes(move.moveTarget) || isMoveDynamicallySpread(pokemon, move);
}

/** 产物 `ib` — 是否应拦截伤害（非变化类招式） */
export function shouldHealerBlockDamage(pokemon: any, move: any): boolean {
  if (!pokemon || !move || !healerResourceAvailable(pokemon)) return false;
  return move.category !== MoveCategory.STATUS;
}

/** 产物 `nb` — 是否应转换为治疗（伤害类且威力 > 0） */
export function shouldHealerConvertMove(pokemon: any, move: any): boolean {
  if (!shouldHealerBlockDamage(pokemon, move) || !move) return false;
  return move.power > 0;
}

/** 产物 `uhe` — 伤害转治疗主入口 |
 *  注：威力 ≤ 0 的伤害招式会打日志且两者都不做。 */
export function applyHealerDamageMoveInterception(pokemon: any, move: any, targets: any[]): number {
  if (!shouldHealerBlockDamage(pokemon, move)) return 0;
  if (shouldHealerConvertMove(pokemon, move)) return applyHealerMoveConversion(pokemon, move, targets);
  debugLog("battle", "[生命的余响] " + move.name + "：伤害招式但威力 ≤ 0（" + move.power + "）→ 既不转换也不造成伤害");
  return 0;
}

/** 产物 `Ab` — 场上可治疗的我方全体 */
export function fieldAlliesForHeal(): any[] {
  return (globalScene?.getPlayerField?.() ?? []).filter((p: any) => !!p && !p.isFainted() && !isHealBlocked(p));
}

/** 产物 `soe` — 场上血量百分比最低的我方 */
export function lowestHpRatioFieldAlly(): any {
  let best: any;
  let lowest = Number.POSITIVE_INFINITY;
  for (const ally of fieldAlliesForHeal()) {
    const ratio = ally.hp / Math.max(1, ally.getMaxHp());
    if (ratio < lowest) {
      lowest = ratio;
      best = ally;
    }
  }
  return best;
}

/** 产物 `che` — 执行伤害转治疗（单体/群体分支） */
export function applyHealerMoveConversion(pokemon: any, move: any, targets: any[]): number {
  if (!shouldHealerConvertMove(pokemon, move)) return 0;
  const spread = isHealerConvertSpreadMove(pokemon, move);
  const power = Math.max(0, move.power ?? 0);
  const bondActive = healerNodeActive(pokemon, HEALER_NODE.BOND);
  const vigor = healerVigorStacksOf(pokemon);
  const livingTargets = (targets ?? []).filter(
    (t: any) => !!t && t.isPlayer() && !t.isFainted() && t.isActive() && !isHealBlocked(t),
  );
  const targetsToHeal = spread
    ? fieldAlliesForHeal()
    : livingTargets.length
      ? [livingTargets[0]]
      : [lowestHpRatioFieldAlly()].filter((t) => !!t);
  let total = 0;
  for (const target of targetsToHeal) {
    const ratio = target.hp / Math.max(1, target.getMaxHp());
    const amount = healerConvertHealValue(
      target.getMaxHp(),
      power,
      spread,
      bondActive ? 1 + healerLossBonus(ratio) : 1,
    );
    total += healOne(pokemon, target, vigor, { amountOverride: amount });
  }
  debugLog("battle", "[生命的余响] 招式转治疗：" + move.name + "（威力 " + power + (spread ? "，群体" : "，单体") + "）→ " + targetsToHeal.length + " 名队友，实收 " + total);
  return total;
}

/** 产物 `ioe` — 治疗单个目标（含 3 命净化 + 圣咏触发） */
export function healOne(
  healer: any,
  target: any,
  vigor: number,
  opts: { amountOverride?: number; spread?: boolean } = {},
): number {
  const six = healerNodeActive(healer, HEALER_NODE.RESONANCE);
  const spdef = healer.getEffectiveStat(Stat.SPDEF);
  const ratio = target.hp / Math.max(1, target.getMaxHp());
  const bondActive = healerNodeActive(healer, HEALER_NODE.BOND);
  const amount = opts.amountOverride ?? healerHealValue(spdef, vigor, { six, hpRatio: bondActive ? ratio : 1, spread: opts.spread });
  if (healerNodeActive(healer, HEALER_NODE.CLEANSE)) applyHealerCleanse(target);
  const healed = healPokemon(healer, target, amount);
  gainVigorOnHeal(healer);
  debugLog("battle", "[生命的余响] " + healer.name + " → " + target.name + " 回复 " + amount + "（【生机】" + vigor + "，实收 " + healed + "）");
  return healed;
}

/** 产物 `Che` — 治疗命中时获得【生机】（1 回合 1 次、1 轮 ≤2 层） */
export function gainVigorOnHeal(pokemon: any): void {
  const data = healerDataOf(pokemon);
  if (!data) return;
  const actionKey = currentActionKey$1();
  if (data.healerVigorAction === actionKey) return; // 本回合已获得
  const roundKey = currentRoundKey$1();
  if (data.healerVigorRoundKey !== roundKey) {
    data.healerVigorRoundKey = roundKey;
    data.healerVigorRoundGain = 0;
  }
  if ((data.healerVigorRoundGain ?? 0) >= 2) return; // 本回合 ≤2 层
  data.healerVigorAction = actionKey;
  const gained = gainHealerVigor(pokemon, 1);
  if (gained > 0) data.healerVigorRoundGain = (data.healerVigorRoundGain ?? 0) + gained;
}

/** 产物 `hhe` — 出招钩子 B：满 3 层【圣咏】时治疗（6 命转全体） */
export function applyHealerOnMoveUse(healer: any, move: any, _targets: any[]): void {
  if (!healerResourceAvailable(healer)) return;
  const data = healerDataOf(healer);
  if (!data) return;
  const actionKey = currentActionKey$1();
  if (data.healerChantAction === actionKey) return;
  const vigor = healerVigorStacksOf(healer);
  if (vigor < VIGOR_CHANT_THRESHOLD) return;
  const six = healerNodeActive(healer, HEALER_NODE.RESONANCE);
  const targetsToHeal = six
    ? playerParty().filter((p: any) => !p.isFainted() && !isHealBlocked(p))
    : [lowestHpRatioAlly$2(healer)].filter((p) => !!p);
  if (!targetsToHeal.length) return;
  for (const target of targetsToHeal) healOne(healer, target, vigor, { spread: six });
  data.healerChantAction = actionKey;
  for (const target of targetsToHeal) restoreHealerPp(target, CHANT_PP_RESTORE);
  debugLog("battle", "[生命的余响] 触发 B（圣咏）：" + move.name + " → " + targetsToHeal.length + " 名队友（【生机】" + vigor + "）");
}

// ─────────────────────────────────────────────────────────────
// 10. 状态徽标 / 转换目标提供者（产物 `E0` / `PIe`）
// ─────────────────────────────────────────────────────────────

/** 产物 `E0(...)` — 注册【生机】状态徽标 provider。 */
export function registerHealerStatusProvider(registerP5XStatusProvider: (p: (pokemon: any) => any[]) => void): void {
  const VIGOR_HINT = "治疗命中我方+1层（每回合1次）；满3层进【圣咏】。";
  registerP5XStatusProvider((pokemon: any) => {
    if (!pokemon?.isPlayer?.()) return [];
    const stacks = healerVigorStacksOf(pokemon);
    if (stacks <= 0) return [];
    return [
      {
        key: "healer:vigor",
        texture: "constellation_vigor",
        title: "【生机】" + stacks + "/" + healerVigorMaxFor(pokemon),
        description: VIGOR_HINT,
      },
    ];
  });
}

/** 产物 `PIe(...)` — 注册治疗转换的目标提供者（把对敌招式重定向为我方目标） */
export function registerHealerConversionTargetProvider(): void {
  setHealerConversionTargetProvider((user: any, move: any) => {
    try {
      if (!user?.isPlayer?.()) return undefined;
    } catch {
      return undefined;
    }
    if (!move || !shouldHealerConvertMove(user, move)) return undefined;
    if (!user.isPlayer) return undefined;
    const allies = fieldAlliesForHeal().filter((a: any) => a.isPlayer?.());
    if (!allies.length) return undefined;
    if (isHealerConvertSpreadMove(user, move)) {
      return { targets: [(lowestHpRatioFieldAlly() ?? allies[0]).getBattlerIndex()], multiple: false };
    }
    return { targets: allies.map((a: any) => a.getBattlerIndex()), multiple: false };
  });
}

// ─────────────────────────────────────────────────────────────
// 11. 【祈愿】阶段（产物 `rB` = `HealerWishPhase`）
// ─────────────────────────────────────────────────────────────

/** 产物 `rB` — 5 命【祈愿】执行阶段 |
 *  注：`hooks.openAllySelect` / `sendOutRevivedAlly` / `reopenCommand` 为上游 UI 接口。 */
export class HealerWishPhase {
  constructor(private readonly pokemon: any, private readonly hooks: any) {}

  start(): void {
    const pokemon = this.pokemon;
    if (!pokemon || pokemon.isFainted()) return;
    if (!faintedTeammates().length) {
      this.hooks.reopenCommand(pokemon);
      return;
    }
    this.hooks.openAllySelect(pokemon, (index: number) => {
      const target = globalScene.getPlayerParty?.()[index];
      if (target?.isFainted()) {
        reviveHealerAlly(pokemon, target);
        Promise.resolve(this.hooks.sendOutRevivedAlly?.(target)).then(() => undefined);
        return;
      }
      debugLog("battle", "[生命的余响] 5 命【祈愿】：目标已不处于濒死，回滚本回合行动");
      this.hooks.reopenCommand(pokemon);
    });
  }
}

// ─────────────────────────────────────────────────────────────
// 12. 解明技能结算阶段（产物 `oB` = `JiemingResolvePhase`）
// ---------------------------------------------------------------------------
// 该类是**解明框架**的统一结算阶段（非 HEALER 专属），A3-07 已收敛到
// `jieming-system.ts`。此处再导出，保证既有引用不破。
// ─────────────────────────────────────────────────────────────

export { JiemingResolvePhase } from "./jieming-system";

// ─────────────────────────────────────────────────────────────
// 13. 过桥工具（统一 tag / 解明对象访问；接入锚点后替换为真实 API）
// ─────────────────────────────────────────────────────────────

/** 应用 P5X 效果（产物 `kn`） */
declare const applyP5XEffect: (pokemon: any, key: string, opts: any) => void; // 产物 `kn`
/** 判断 P5X 效果（产物 `uE`） */
declare const hasP5XEffect: (pokemon: any, key: string) => boolean; // 产物 `uE`
/** 清除 P5X 效果（产物 `uw`） */
declare const clearP5XEffect: (pokemon: any, key: string) => void; // 产物 `uw`
/** 应用 BattlerTag（产物 `kn` 的 BattlerTag 版本，语义化命名） */
declare function applyBattlerTag(pokemon: any, tag: string, opts?: any): void;
/** 判断 BattlerTag */
declare function hasBattlerTag(pokemon: any, tag: string): boolean;
/** 移除 BattlerTag */
declare function clearBattlerTag(pokemon: any, tag: string): void;

/** 统一处理 P5X 效果的薄封装（产物中 `kn` 同时用于 BattlerTag 与 P5X 效果） */
function applyP5XEffectRaw(pokemon: any, key: string, opts: any): void {
  applyP5XEffect(pokemon, key, opts);
}

// ─────────────────────────────────────────────────────────────
// TODO(接入锚点 90df65097b6d)：本文件依赖清单
// ─────────────────────────────────────────────────────────────
// TODO(接入锚点): globalScene / gameMode → #app/global-scene
// TODO(接入锚点): Stat / StatusEffect / BattlerTagType / MoveCategory / MoveTarget / SpeciesId → #enums/*
// TODO(接入锚点): PokemonHealPhase → #phases/pokemon-heal-phase
// TODO(接入锚点): isMoveDynamicallySpread (产物 `sS`) → 上游招式效果模块
// TODO(接入锚点): setHealerConversionTargetProvider (产物 `PIe`) → 上游伤害管线钩子
// TODO(接入锚点): getJiemingPokemon / getJiemingTargets / findJiemingSkill / isSkillReady /
//                 markSkillUsed / getJiemingCounterFor → manaphy-system.ts（A3-05）导出，
//                 A3-07 收敛到 jieming-system.ts
// TODO(接入锚点): applyP5XEffect / hasP5XEffect / clearP5XEffect → P5X 系统（A3-09）
// TODO(接入锚点): 把 registerHealerSystem / registerHealerStatusProvider /
//                 registerHealerConversionTargetProvider 挂到系统初始化点
// TODO(A4-验证): `healer:shield` 过期回调 `onHealerShieldExpire` 的 `{rounds:1}` 重挂循环
// TODO(A4-验证): `gainVigorOnHeal` 的「每回合 1 次 + 每轮 ≤2 层」双重门控
// TODO(A4-验证): 【祈愿】阶段的「目标已不处于濒死 → 回滚本回合行动」分支
