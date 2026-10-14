/**
 * 蓄雷（DIANXIN）—— 自研系统迁移
 * ---------------------------------------------------------------------------
 * 来源：game/server/dist/assets/loading-scene-By2k7Qfx.js（.orig 产物）@2115359 起
 * 逆向方式：`l(短名,"原函数名")` 反查 + 常量赋值精确定位（见 A3-迁移规范 §3）
 * 锚点树：90df65097b6df76f713e6bd108afa84499e8b993
 *
 * 定位：命座接入组 7 系统之一（A3-05）。物种 = 小磁怪 / 电电虫 / 咩利羊 / 托戈德玛尔
 *       （`mre`）。核心机制为【感电】（受电伤 ×1.3、要害倍率 +1.5）与「回响」
 *       （单体招式命中后追加释放一次同一招式）。经公共底座 `registerConstellation`
 *       注册 6 个命座节点（`exclusiveNodes` 覆盖 1/2/3/5/6）。
 *
 * 产物符号对照（去混淆映射，务必逐条保留）：
 *   hI   → registerConstellation        （公共底座）
 *   sa   → constellationLevel$1         （公共底座）
 *   vR   → constellationNodeMode        （公共底座）
 *   uE   → hasP5XEffect
 *   kn   → applyP5XEffect
 *   uw   → clearP5XEffect
 *   sS   → isMoveDynamicallySpread      （上游：招式是否动态群体化）
 *   Hs   → MovePhase                    （产物 `new Hs(...)`）
 *   sB   → DianXinEchoEndPhase（产物 `L2`）
 *   z    → debugLog
 *   E    → globalScene
 *   R    → PokemonType
 *   B    → MoveCategory
 *   Le   → MoveTarget
 *   p    → Stat
 *   nB   → CallingCardResolvePhase（CALLINGCARD 系统的阶段，与本系统无关但同区域）
 *
 *   常量：
 *   zm   → DIANXIN_NODE.SHOCK        (=1)
 *   Hre  → DIANXIN_NODE.ECHO         (=2)
 *   pre  → DIANXIN_NODE.NET          (=3)
 *   jw   → DIANXIN_NODE.PUNISH       (=5)
 *   Og   → DIANXIN_NODE.TEN_THOUSAND (=6)
 *   wue  → SHOCK_CHANCE              (=0.42)
 *   bue  → SHOCK_CHANCE_FULL         (=1)
 *   Pse  → SHOCK_TURNS               (=3)
 *   xue  → SHOCK_INCOMING_MULT       (=1.3)
 *   Vue  → SHOCK_INCOMING_MULT_TEN_THOUSAND (=1.2)
 *   kue  → SHOCK_CRIT_BONUS          (=1.5)
 *   Zue  → SHOCK_CRIT_BONUS_THOUSAND (=0.5)
 *   _se  → SHOCK_SPATK_BUFF_PER_STACK(=0.3)
 *   Gse  → SHOCK_SPATK_BUFF_TURNS    (=2)
 *   gse  → SHOCK_SPATK_ECHO_TURNS    (=3)
 *   Xue  → PUNISH_DAMAGE_RATIO       (=0.2)
 *   $ue  → SHOCK_SPEED_MULT          (=0.8)
 *   qm/eB/tB → 效果 tag `shock:electrified` / `shock:spatk` / `shock:spatk-echo`
 */
import { registerConstellation, type ConstellationCodexEntry } from "./constellation-framework";

// ─────────────────────────────────────────────────────────────
// 0. 依赖（上游 API，待接入锚点源码时改为真实 import）
// ─────────────────────────────────────────────────────────────
declare const globalScene: any; // 产物 `E`
declare const gameData: any; // 产物 `E.gameData`
declare const PokemonType: any; // 产物 `R`（PokemonType enum）
declare const MoveCategory: any; // 产物 `B`（MoveCategory enum）
declare const MoveTarget: any; // 产物 `Le`（MoveTarget enum）
declare const Stat: any; // 产物 `p`
declare const SpeciesId: any; // 产物 `e`
declare const debugLog: (type: string, msg: string) => void; // 产物 `z`
declare const constellationLevel: (species: any, node: number) => number; // 产物 `sa`
declare const constellationNodeMode: (species: any, node: number, data?: any) => string; // 产物 `vR`
declare const applyP5XEffect: (pokemon: any, key: string, opts: any) => void; // 产物 `kn`
declare const hasP5XEffect: (pokemon: any, key: string) => boolean; // 产物 `uE`
declare const clearP5XEffect: (pokemon: any, key: string) => void; // 产物 `uw`
declare const isMoveDynamicallySpread: (user: any, move: any) => boolean; // 产物 `sS`（上游：动态群体化）
declare const MovePhase: any; // 产物 `Hs`（`new Hs(user, targets, move, ...)`）

// ─────────────────────────────────────────────────────────────
// 1. 常量（还原自产物 `zm..$ue` / `qm..tB`）
// ─────────────────────────────────────────────────────────────

/** 命座节点索引（`Jue.exclusiveNodes` 的顺序即此常量组） */
export const DIANXIN_NODE = {
  /** 蓄雷（感电基础机制） */
  SHOCK: 1, // 产物 `zm`
  /** 回响（单体招式命中后追加一次） */
  ECHO: 2, // 产物 `Hre`
  /** 雷网（攻击感电目标时改为群体） */
  NET: 3, // 产物 `pre`
  /** 雷鸣不休（沿用通用命座） */
  GENERIC: 4, // 产物 `NEe`（非 exclusive）
  /** 雷罚（感电目标反噬 + 减速） */
  PUNISH: 5, // 产物 `jw`
  /** 万钧（感电必中 + 电伤/要害加成） */
  TEN_THOUSAND: 6, // 产物 `Og`
} as const;

/** 【感电】触发概率 */
export const SHOCK_CHANCE = 0.42; // 产物 `wue`
export const SHOCK_CHANCE_FULL = 1; // 产物 `bue`（6 命「万钧」）

/** 【感电】持续回合 */
export const SHOCK_TURNS = 3; // 产物 `Pse`

/** 受电属性伤害倍率 */
export const SHOCK_INCOMING_MULT = 1.3; // 产物 `xue`
export const SHOCK_INCOMING_MULT_TEN_THOUSAND = 1.2; // 产物 `Vue`（6 命额外）

/** 击中感电目标时要害倍率加成 */
export const SHOCK_CRIT_BONUS = 1.5; // 产物 `kue`
export const SHOCK_CRIT_BONUS_TEN_THOUSAND = 0.5; // 产物 `Zue`（6 命额外）

/** 「感电」目标被攻击时攻击方特攻加成（每段 30%） */
export const SHOCK_SPATK_BUFF_PER_STACK = 0.3; // 产物 `_se`
/** 攻击感电目标后的特攻 buff 持续 |
 *  注：产物 2 命回响命中同目标为 3 回合（`gse`）、1 命命中感电为 2 回合（`Gse`）。 */
export const SHOCK_SPATK_BUFF_TURNS = 2; // 产物 `Gse`
export const SHOCK_SPATK_ECHO_TURNS = 3; // 产物 `gse`

/** 5 命「雷罚」反噬伤害比例（较高一攻 × 20%） */
export const PUNISH_DAMAGE_RATIO = 0.2; // 产物 `Xue`
/** 5 命「雷罚」感电目标速度倍率 */
export const SHOCK_SPEED_MULT = 0.8; // 产物 `$ue`

/** 【感电】可用种族（产物 `mre`） */
export const DIANXIN_SPECIES: readonly number[] = [
  SpeciesId?.MAGNEMITE, // 小磁怪
  SpeciesId?.JOLTIK, // 电电虫
  SpeciesId?.MAREEP, // 咩利羊
  SpeciesId?.TOGEDEMARU, // 托戈德玛尔
].filter((x) => x !== undefined);

/** 效果 tag（产物 `qm` / `eB` / `tB`） */
export const SHOCK_TAG_ELECTRIFIED = "shock:electrified"; // 产物 `qm`
export const SHOCK_TAG_SPATK = "shock:spatk"; // 产物 `eB`
export const SHOCK_TAG_SPATK_ECHO = "shock:spatk-echo"; // 产物 `tB`

/** 群体招式的目标类型集合（产物 `tce`） */
export const SPREAD_TARGETS: readonly number[] = [
  MoveTarget?.ALL_NEAR_ENEMIES,
  MoveTarget?.ALL_ENEMIES,
].filter((x) => x !== undefined);

/** 系统说明（产物 `Que`，逐字保留为机读规格） */
export const DIANXIN_CODEX: ConstellationCodexEntry[] = [
  {
    name: "蓄雷",
    description:
      "自身电属性单体招式（非全体敌人招式）命中后42%使目标[感电]；\n" +
      "多段只判末段。打[感电]目标者特攻+30%（2回合）。\n" +
      "[感电]持续3回合：受电属性伤害×1.3、要害倍率+1.5。",
  },
  {
    name: "回响",
    description:
      "自身单体招式（不含全体敌人招式）命中后，随机对敌方再释放一次同一招式\n" +
      "（不吃亲子爱／多重镜）。打中同一目标则自身特攻+30%（3回合）。\n" +
      "每轮最多触发1次。",
  },
  {
    name: "雷网",
    description: "攻击[感电]目标时，自身单体招式变为群体招式，命中全体敌人。\n这一次群攻同样会触发[回响]。",
  },
  {
    name: "雷鸣不休",
    description: "沿用通用命座：本局PT／金币／结算PT 三选一，+15%（每只不同种族各计一次，可叠加）。",
  },
  {
    name: "雷罚",
    description:
      "[感电]敌人每次出招（含变化招式）时反噬自身，\n" +
      "受到其物攻／特攻较高一项20%的伤害；\n" +
      "[感电]敌人的出手顺序速度改为×0.8（感电期间每轮生效）。",
  },
  {
    name: "万钧",
    description:
      "[感电]触发概率提升至100%。\n" +
      "自身攻击[感电]目标时电属性伤害额外×1.2；\n" +
      "自身电属性招式击中[感电]目标要害时倍率再+0.5。",
  },
];

/** 命座注册载荷（产物 `Jue`） */
export const DIANXIN_CONSTELLATION_PAYLOAD = {
  exclusiveNodes: [
    DIANXIN_NODE.SHOCK,
    DIANXIN_NODE.ECHO,
    DIANXIN_NODE.NET,
    DIANXIN_NODE.PUNISH,
    DIANXIN_NODE.TEN_THOUSAND,
  ],
};

// ─────────────────────────────────────────────────────────────
// 2. 注册（产物：`for(const n of mre)hI(n,Que,Jue)`）
// ─────────────────────────────────────────────────────────────

/** 把【蓄雷】系统注册进公共命座框架（对每个可用种族各注册一次）。 */
export function registerDianXinSystem(): void {
  for (const species of DIANXIN_SPECIES) {
    registerConstellation(species, DIANXIN_CODEX, DIANXIN_CONSTELLATION_PAYLOAD);
  }
}

// ─────────────────────────────────────────────────────────────
// 3. 核心函数（逐个还原自产物）
// ─────────────────────────────────────────────────────────────

/** 产物 `jue` — 判定种族是否属于【蓄雷】体系 */
export function isDianXinSpecies(species: number): boolean {
  return DIANXIN_SPECIES.includes(species);
}

/** 产物 `yO` — 判定某命座节点是否已激活 */
export function dianXinNodeActive(pokemon: any, node: number): boolean {
  const rootSpecies = pokemon.species.getRootSpeciesId();
  if (!isDianXinSpecies(rootSpecies)) return false;
  const data = gameData?.ptSoudacheData;
  if (constellationLevel(data, rootSpecies) < node) return false;
  return constellationNodeMode(rootSpecies, node, data) === "exclusive";
}

/** 产物 `Bre` — 我方场上是否存在已点亮某节点的单位 */
export function anyPlayerFieldHasNode(node: number): boolean {
  return globalScene
    .getPlayerParty()
    .some((p: any) => p?.isActive(true) && !p.isFainted() && dianXinNodeActive(p, node));
}

/** 产物 `AN` — 判定目标是否处于【感电】 */
export function isElectrified(pokemon: any): boolean {
  return hasP5XEffect(pokemon, SHOCK_TAG_ELECTRIFIED);
}

/** 产物 `zue` — 给目标挂上【感电】 |
 *  注：产物先清 tag 再挂（幂等刷新持续回合）。 */
export function applyElectrified(target: any, source: any): void {
  clearP5XEffect(target, SHOCK_TAG_ELECTRIFIED);
  applyP5XEffect(target, SHOCK_TAG_ELECTRIFIED, { turns: SHOCK_TURNS });
  target.updateInfo();
  debugLog(
    "battle",
    `[感电] ${target.name} 被${source ? `${source.name} ` : ""}挂上【感电】（${SHOCK_TURNS} 回合）`,
  );
}

/** 产物 `que` — 记录本次出招上下文（供命中结算时使用） */
export function recordDianXinMoveContext(pokemon: any, move: any): void {
  if (!pokemon.isPlayer()) return;
  const data = pokemon.customPokemonData;
  if (!data) return;
  data.dianXinPendingMoveId = move.id;
  data.dianXinPendingType = move.type;
  data.dianXinPendingSingle = !isSpreadMove$1(move) && !isMoveDynamicallySpread(pokemon, move);
}

/** 产物 `ece` — 取出并清空出招上下文 */
export function consumeMoveContext(pokemon: any): any {
  const data = pokemon.customPokemonData;
  if (
    !data ||
    data.dianXinPendingMoveId === undefined ||
    data.dianXinPendingMoveId < 0
  ) {
    return undefined;
  }
  const context = {
    moveId: data.dianXinPendingMoveId,
    type: data.dianXinPendingType ?? PokemonType.NORMAL,
    single: !!data.dianXinPendingSingle,
  };
  data.dianXinPendingMoveId = undefined;
  data.dianXinPendingType = undefined;
  data.dianXinPendingSingle = false;
  return context;
}

/** 产物 `yre` — 是否为群体招式 |
 *  注：产物名 `isSpreadMove$1`，与 CHIXIN 的 `isSpreadMove` 区分。 */
export function isSpreadMove$1(move: any): boolean {
  return SPREAD_TARGETS.includes(move.moveTarget);
}

// ── 「回响」重入保护（产物 `Ig` / `zw` / `qw` 模块级状态）──
let ECHO_RUNNING = false;
let ECHO_USER: any = null;
let ECHO_TARGET: any = null;

const NO_CHANGE = { changed: false };

/** 产物 `sce` — 是否正在执行「回响」追加释放 |
 *  注：产物名 `isDianXinEchoRunning`。 */
export function isDianXinEchoRunning(): boolean {
  return ECHO_RUNNING;
}

/**
 * 产物 `ice` — 命中结算主钩子。
 * 分支（逐字对应产物）：
 *   1) 若正在回响 → 命中同一目标则给攻击方特攻 buff，直接返回
 *   2) 目标已感电 或 攻击方点亮 1 命 → 继续
 *   3) 目标已感电 → 给攻击方特攻 +30%（2 回合）
 *   4) 1 命：电属性单体招式命中 → 按概率给目标挂【感电】
 *   5) 2 命：单体招式 → 尝试触发「回响」
 */
export function applyDianXinOnHit(
  pokemon: any,
  target: any,
  isAttack: boolean,
): { changed: boolean } {
  if (!pokemon.isPlayer() || pokemon === target) return NO_CHANGE;
  if (ECHO_RUNNING) {
    if (pokemon === ECHO_USER && target === ECHO_TARGET) grantSpatkEchoBuff(pokemon);
    return NO_CHANGE;
  }
  const electrified = isElectrified(target);
  if (!electrified && !dianXinNodeActive(pokemon, DIANXIN_NODE.SHOCK)) return NO_CHANGE;

  let changed = false;
  if (electrified) changed = grantSpatkBuff(pokemon) || changed;

  const context = consumeMoveContext(pokemon);
  if (!context) return { changed };

  if (
    !electrified &&
    dianXinNodeActive(pokemon, DIANXIN_NODE.SHOCK) &&
    context.single &&
    context.type === PokemonType.ELECTRIC &&
    isAttack
  ) {
    const chance = dianXinNodeActive(pokemon, DIANXIN_NODE.TEN_THOUSAND) ? SHOCK_CHANCE_FULL : SHOCK_CHANCE;
    if (globalScene.randBattleSeedInt(1000) < Math.round(chance * 1000)) {
      applyElectrified(target, pokemon);
      changed = true;
    }
  }
  if (context.single && tryDianXinEcho(pokemon, target, context.moveId)) changed = true;
  return { changed };
}

/** 产物 `nce` — 攻击感电目标时给攻击方特攻 +30%（2 回合） */
export function grantSpatkBuff(pokemon: any): boolean {
  const already = hasP5XEffect(pokemon, SHOCK_TAG_SPATK);
  applyP5XEffect(pokemon, SHOCK_TAG_SPATK, { turns: SHOCK_SPATK_BUFF_TURNS });
  pokemon.updateInfo();
  if (!already) {
    debugLog(
      "battle",
      `[感电] ${pokemon.name} 攻击感电目标 → 自身特攻 +30%（${SHOCK_SPATK_BUFF_TURNS} 回合）`,
    );
  }
  return !already;
}

/** 产物 `Ace` — 回响命中同一目标时给攻击方特攻 +30%（3 回合） */
export function grantSpatkEchoBuff(pokemon: any): boolean {
  const already = hasP5XEffect(pokemon, SHOCK_TAG_SPATK_ECHO);
  applyP5XEffect(pokemon, SHOCK_TAG_SPATK_ECHO, { turns: SHOCK_SPATK_ECHO_TURNS });
  pokemon.updateInfo();
  if (!already) {
    debugLog(
      "battle",
      `[感电] ${pokemon.name} 回响命中同一目标 → 自身特攻 +30%（${SHOCK_SPATK_ECHO_TURNS} 回合）`,
    );
  }
  return !already;
}

/** 产物 `ace` — 2 命「回响」：随机对敌方追加释放一次同一招式（每轮 1 次） */
export function tryDianXinEcho(pokemon: any, target: any, moveId: number): boolean {
  if (!dianXinNodeActive(pokemon, DIANXIN_NODE.ECHO)) return false;
  const data = pokemon.customPokemonData;
  if (!data) return false;
  const battle = globalScene.currentBattle;
  const roundKey = (battle?.waveIndex ?? 0) * 1e4 + (battle?.turn ?? -1);
  if (data.dianXinEchoRound === roundKey || moveId < 0) return false;
  const enemies = globalScene.getEnemyField().filter((e: any) => !!e && e.isActive() && !e.isFainted());
  if (!enemies.length) return false;
  const move = pokemon.getMoveset().find((m: any) => m?.moveId === moveId);
  if (!move) return false;
  const chosen = enemies[globalScene.randBattleSeedInt(enemies.length)];
  data.dianXinEchoRound = roundKey;
  ECHO_USER = pokemon;
  ECHO_TARGET = target;
  ECHO_RUNNING = true;
  globalScene.unshiftPhase(new MovePhase(pokemon, [chosen.getBattlerIndex()], move, false, true, false, false, false), new DianXinEchoEndPhase());
  debugLog("battle", `[感电] ${pokemon.name} 回响 → 追加释放「${move.getName()}」`);
  return true;
}

/** 产物 `L2` — 「回响」结束阶段（清除重入保护） */
export class DianXinEchoEndPhase {
  start(): boolean {
    ECHO_RUNNING = false;
    ECHO_USER = null;
    ECHO_TARGET = null;
    return true;
  }
}

/** 产物 `Ece` — 特攻倍率（1 命/2 命 buff 各 +30%） */
export function dianXinSpatkMultiplier(pokemon: any): number {
  const effects = pokemon.p5xEffects;
  if (!effects) return 1;
  let bonus = 0;
  if (effects[SHOCK_TAG_SPATK]) bonus += SHOCK_SPATK_BUFF_PER_STACK;
  if (effects[SHOCK_TAG_SPATK_ECHO]) bonus += SHOCK_SPATK_BUFF_PER_STACK;
  return 1 + bonus;
}

/** 产物 `rce` — 受电属性伤害倍率（感电目标 ×1.3；6 命再 ×1.2） */
export function dianXinIncomingMultiplier(attacker: any, target: any, moveType: number): number {
  if (moveType !== PokemonType.ELECTRIC || !isElectrified(target)) return 1;
  let mult = SHOCK_INCOMING_MULT;
  if (dianXinNodeActive(attacker, DIANXIN_NODE.TEN_THOUSAND)) mult *= SHOCK_INCOMING_MULT_TEN_THOUSAND;
  return mult;
}

/** 产物 `oce` — 击中感电目标时的要害倍率加成 */
export function dianXinCritBonus(attacker: any, target: any, moveType: number): number {
  if (!isElectrified(target)) return 0;
  let bonus = SHOCK_CRIT_BONUS;
  if (moveType === PokemonType.ELECTRIC && dianXinNodeActive(attacker, DIANXIN_NODE.TEN_THOUSAND)) {
    bonus += SHOCK_CRIT_BONUS_TEN_THOUSAND;
  }
  return bonus;
}

/** 产物 `Rce` — 5 命「雷罚」：感电目标速度倍率 |
 *  注：需求场上有点亮 5 命的蓄雷单位（`Bre(jw)`），而不是目标自身。 */
export function dianXinSpeedMultiplier(pokemon: any): number {
  return isElectrified(pokemon) && anyPlayerFieldHasNode(DIANXIN_NODE.PUNISH) ? SHOCK_SPEED_MULT : 1;
}

/** 产物 `Oce` — 5 命「雷罚」反噬伤害（较高一攻 × 20%） */
export function dianXinPunishDamage(pokemon: any): number {
  const atk = Math.max(pokemon.getEffectiveStat(Stat.ATK), pokemon.getEffectiveStat(Stat.SPATK));
  return Math.max(1, Math.floor(atk * PUNISH_DAMAGE_RATIO));
}

// ── 5 命「雷罚」重入保护（产物 `EH` 模块级状态）──
let PUNISH_RUNNING = false;

/** 产物 `Ice` — 5 命「雷罚」：感电敌人出招时反噬自身 */
export function tryDianXinPunish(pokemon: any): boolean {
  if (PUNISH_RUNNING || pokemon.isPlayer() || !isElectrified(pokemon) || !anyPlayerFieldHasNode(DIANXIN_NODE.PUNISH)) {
    return false;
  }
  PUNISH_RUNNING = true;
  try {
    const damage = dianXinPunishDamage(pokemon);
    pokemon.damageAndUpdate(damage);
    debugLog("battle", `[感电] ${pokemon.name} 出手反噬 ${damage}`);
    return true;
  } finally {
    PUNISH_RUNNING = false;
  }
}

// ─────────────────────────────────────────────────────────────
// TODO(接入锚点 90df65097b6d)：本文件依赖清单
// ─────────────────────────────────────────────────────────────
// TODO(接入锚点): globalScene / gameData → #app/global-scene
// TODO(接入锚点): PokemonType / MoveCategory / MoveTarget / Stat / SpeciesId → #enums/*
// TODO(接入锚点): applyP5XEffect / hasP5XEffect / clearP5XEffect → P5X 系统导出（A3-09）
// TODO(接入锚点): isMoveDynamicallySpread (产物 `sS`) → 上游招式效果模块
// TODO(接入锚点): MovePhase (产物 `Hs`) → #phases/move-phase
// TODO(接入锚点): 把 registerDianXinSystem 挂到系统初始化点
// TODO(A4-验证): 「回响」追加释放的 `MovePhase` 参数（产物为 8 参数：`user, targets, move, false, true, false, false, false`）
// TODO(A4-验证): 3 命「雷网」将单体招式转为群体（产物依赖上游 `sS` 动态群体化）能否在源码复现
