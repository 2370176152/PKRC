/**
 * NIANLI（念力）系统 —— A3 迁移样板
 *
 * 逆向来源：game/server/dist/assets/loading-scene-By2k7Qfx.js @3625255 起
 * 依据：产物内嵌机读规格 `tPe` / `sPe` + 常量组 `U0..dg` + 函数组 `MI/iPe/jr/D0/Mg/...`
 *
 * 【迁移原则】本文件为「产物 → TS 等价重写」的样板：
 *   1. 每个产物函数 `f` 对应一个导出的 TS 函数，命名还原为 `l(f,"原名")` 中的原名
 *   2. 常量组逐个还原并加注释
 *   3. 中文串原样保留（它们是行为契约 + A4 验收锚点）
 *   4. 依赖的上游 API 用 `@ts-expect-error TODO` 标注（待接入锚点源码时细化 import）
 *
 * 【系统规格（产物内嵌，逐字保留）】
 *   念力     : 全体敌人招式（地震、放电不算）获得1层[念力]（每回合1次，上限2层）。
 *              超能系单体攻击消耗全部：每层使本次伤害+30%。
 *              对敌方变化招式消耗全部：每层令其随机一项能力−2级。
 *   溢念     : 每次获得[念力]时，自身双攻 +20%，持续 2 回合；重复获得会刷新持续时间。
 *   念之意志 : 每轮获得1层[念力]。每波次首次受到致命伤害时保留1点生命，并再获得1层[念力]。
 *   心念相通 : 沿用通用命座：本局PT／金币／结算PT 三选一，+15%（每只不同种族各计一次，可叠加）。
 *   念之回响 : 每次消耗[念力]时，回复我方当前血量百分比最低的一只宝可梦，回复量为其最大生命的 11% × 消耗层数。
 *   念力爆发 : [念力]上限3层；全体敌人招式获得2层。每轮首次满3层时，对随机敌人追加「光子喷涌」。
 *              该攻击不消耗[念力]，按3层结算伤害与命座效果。
 */

// ─────────────────────────────────────────────────────────────
// 0. 依赖（上游 API，待接入锚点源码时改为真实 import）
// ─────────────────────────────────────────────────────────────
// 说明：以下符号来自产物打包上下文，此处按语义命名占位，
//       A3 接入 `90df65097b6d` 源码时逐个替换为真实 import。
declare const globalScene: any; // 产物 `E`
declare const gameData: any; // 产物 `E.gameData`
declare const gameMode: any; // 产物 `E.gameMode`
declare const Stat: any; // 产物 `p`（Stat enum）
declare const PokemonType: any; // 产物 `R`（PokemonType enum）
declare const MoveCategory: any; // 产物 `B`
declare const MoveId: any; // 产物 `t`
declare const BattlerTagType: any; // 产物 `Zne` 为数值
declare const SpeciesId: any; // 产物 `e`
declare const battleMessage: (type: string, msg: string) => void; // 产物 `z`
// 上游函数占位
declare function constellationNodeIsExclusive(species: any, node: number, data?: any): boolean; // `US`
declare function constellationLevel(species: any, node: number): number; // `sa`
declare function addBattlerTag(pokemon: any, tag: string, opts?: any): void; // `kn`
declare function hasBattlerTag(pokemon: any, tag: string): boolean; // `uE`
declare function unshiftPhase(phase: any): void; // `E.unshiftPhase`
declare function StatStageChangePhase(battlerIndex: number, selfTarget: boolean, stats: number[], stages: number): any; // `Vt`
declare function applyHealTo(pokemon: any, amount: number): void; // `lPe`
// 阶段/招式构造器（产物 `fA` / `BF` / `Ot`）
declare const AddExtraTurnPhase: any; // 产物 `fA`（追加额外回合的阶段）
declare const ToggleAutoAttackPhase: any; // 产物 `BF`（爆发结束阶段 `f6` 的包装）
declare const Move: any; // 产物 `Ot`（Move 构造器：new Ot(id, pp, maxPp, isAuto)）

// ─────────────────────────────────────────────────────────────
// 1. 常量（还原自产物 `U0..dg` / `kfe..jfe` / `Xne`）
// ─────────────────────────────────────────────────────────────

/** 命座节点索引（`sPe.exclusiveNodes` 的顺序即此常量组） */
export const NIANLI_NODE = {
  /** 念力（基础层数机制） */
  BASE: 1, // 产物 `U0`
  /** 溢念（双攻 +20% buff） */
  OVERFLOW: 2, // 产物 `_Re`
  /** 念之意志（每轮 +1 层 / 保命） */
  WILL: 3, // 产物 `Db`
  /** 念之回响（消耗时回血，产物 `QH` 用 `GRe`） */
  ECHO: 5, // 产物 `GRe`
  /** 念力爆发（上限 3 层 + 光子喷涌） */
  BURST: 6, // 产物 `dg`
} as const;

/** 层数上限 */
export const NIANLI_MAX_DEFAULT = 2; // 产物 `kfe`
export const NIANLI_MAX_BURST = 3; // 产物 `FD`

/** 效果系数 */
export const NIANLI_DAMAGE_PER_STACK = 0.3; // 产物 `Zfe`
export const NIANLI_HEAL_PER_STACK = 0.11; // 产物 `Xfe`
export const NIANLI_ATK_BONUS = 0.2; // 产物 `$fe`

/** 群体招式每回合获得层数 */
export const NIANLI_SPREAD_GAIN_DEFAULT = 1; // 产物 `Qfe`
export const NIANLI_SPREAD_GAIN_BURST = 2; // 产物 `Jfe`

/** 溢念 buff 持续回合 */
export const NIANLI_OVERFLOW_TURNS = 2; // 产物 `jfe`
/** 溢念 buff 的 BattlerTag 标识 */
export const NIANLI_OVERFLOW_TAG = "nian-li:overflow"; // 产物 `gRe`

/** 变化招式消耗时随机降能力的阶数 */
export const NIANLI_STAT_DROP = -2; // 产物 `Zne`

/** 降低时随机挑选的能力集合（产物 `Xne = Sw`，待接入时展开） */
// TODO(接入锚点): 展开 `Sw` 的真实成员（Stat 的哪几项）
export const NIANLI_DROPPABLE_STATS: readonly number[] = [
  Stat?.ATK,
  Stat?.DEF,
  Stat?.SPATK,
  Stat?.SPDEF,
  Stat?.SPD,
].filter((x) => x !== undefined);

/**
 * 群体招式的目标类型集合（产物 `dSe = new Set([Le.ALL_NEAR_ENEMIES, Le.ALL_ENEMIES])`）。
 * ⚠️ Todo：需用锚点 `#enums/move-target` 核对；产物中地震/放电被中文规格显式排除，
 *    可能是 dSe 之外另有 moveId 黑名单（A4 阶段核实）。
 */
export const NIANLI_SPREAD_TARGETS: readonly number[] = [
  /* MoveTarget.ALL_NEAR_ENEMIES */ 0,
  /* MoveTarget.ALL_ENEMIES */ 0,
]; // TODO(接入锚点): 替换为真实 MoveTarget 枚举值

/** 【念力】可用的种族（产物 `mRe`） */
export const NIANLI_SPECIES: readonly number[] = [
  SpeciesId?.ABRA,
  SpeciesId?.WYNAUT,
  SpeciesId?.GOTHITA,
  SpeciesId?.ELGYEM,
].filter((x) => x !== undefined);

/** 系统说明（产物 `tPe`，逐字保留为机读规格） */
export const NIANLI_CODEX = [
  {
    name: "念力",
    description:
      "全体敌人招式（地震、放电不算）获得1层[念力]（每回合1次，上限2层）。\n" +
      "超能系单体攻击消耗全部：每层使本次伤害+30%。\n" +
      "对敌方变化招式消耗全部：每层令其随机一项能力−2级。",
  },
  {
    name: "溢念",
    description:
      "每次获得[念力]时，自身双攻 +20%，持续 2 回合；重复获得会刷新持续时间。",
  },
  {
    name: "念之意志",
    description:
      "每轮获得1层[念力]。\n每波次首次受到致命伤害时保留1点生命，并再获得1层[念力]。",
  },
  {
    name: "心念相通",
    description:
      "沿用通用命座：本局PT／金币／结算PT 三选一，+15%（每只不同种族各计一次，可叠加）。",
  },
  {
    name: "念之回响",
    description:
      "每次消耗[念力]时，回复我方当前血量百分比最低的一只宝可梦，回复量为其最大生命的 11% × 消耗层数。",
  },
  {
    name: "念力爆发",
    description:
      "[念力]上限3层；全体敌人招式获得2层。\n每轮首次满3层时，对随机敌人追加「光子喷涌」。\n" +
      "该攻击不消耗[念力]，按3层结算伤害与命座效果。",
  },
] as const;

/** 命座注册载荷（产物 `sPe`） */
export const NIANLI_CONSTELLATION_PAYLOAD = {
  exclusiveNodes: [
    NIANLI_NODE.BASE,
    NIANLI_NODE.OVERFLOW,
    NIANLI_NODE.WILL,
    NIANLI_NODE.ECHO,
    NIANLI_NODE.BURST,
  ],
};

// ─────────────────────────────────────────────────────────────
// 2. 核心函数（逐个还原自产物）
// ─────────────────────────────────────────────────────────────

/** 产物 `MI` — 读取自定义宝可梦数据的 `customPokemonData` 字段 */
export function nianLiDataOf(pokemon: any): any {
  return pokemon == null ? undefined : pokemon.customPokemonData;
}

/** 产物 `iPe` — 判定种族是否属于【念力】体系 */
export function isNianLiSpecies(species: number): boolean {
  return NIANLI_SPECIES.includes(species);
}

/** 产物 `jr` — 判定某命座节点是否已激活（限【念力】种族 + PT 存档节点） */
export function nianLiNodeActive(pokemon: any, node: number): boolean {
  const rootSpecies = pokemon.species.getRootSpeciesId();
  if (!isNianLiSpecies(rootSpecies)) return false;
  return constellationNodeIsExclusive(rootSpecies, node, gameData?.ptSoudacheData);
}

/** 产物 `D0` — 读取当前念力层数（经 claMP） */
export function nianLiStacksOf(pokemon: any): number {
  const data = nianLiDataOf(pokemon);
  return data ? nianLiClamp(pokemon, data.nianLiStacks ?? 0) : 0;
}

/** 产物 `Mg` — 当前层数上限（爆发节点激活则 3，否则 2） */
export function nianLiMaxFor(pokemon: any): number {
  return nianLiNodeActive(pokemon, NIANLI_NODE.BURST)
    ? NIANLI_MAX_BURST
    : NIANLI_MAX_DEFAULT;
}

/** 产物 `BRe` — 层数钳制到 [0, max] */
export function nianLiClamp(pokemon: any, value: number): number {
  return Math.max(0, Math.min(nianLiMaxFor(pokemon), Math.floor(value) || 0));
}

/** 产物 `nPe` — 超能系单体攻击的伤害倍率（每层 +30%） */
export function nianLiDamageMultiplier(pokemon: any, move: any): number {
  if (
    !pokemon?.isPlayer() ||
    move.category === MoveCategory.STATUS ||
    move.type !== PokemonType.PSYCHIC ||
    !/* isSingleTargetAttack */ isNianLiSingleTargetMove(move) ||
    /* isBlocked */ isNianLiBlocked(pokemon, move) ||
    !nianLiNodeActive(pokemon, NIANLI_NODE.BASE)
  ) {
    return 1;
  }
  const stacks = nianLiStacksOf(pokemon);
  return stacks <= 0 ? 1 : 1 + NIANLI_DAMAGE_PER_STACK * stacks;
}

/** 产物 `APe` — 溢念 buff 的双攻（ATK/SPATK）倍率 */
export function nianLiStatMultiplier(pokemon: any, stat: number): number {
  if (stat !== Stat.ATK && stat !== Stat.SPATK) return 1;
  return hasBattlerTag(pokemon, NIANLI_OVERFLOW_TAG) ? 1 + NIANLI_ATK_BONUS : 1;
}

/** 产物 `aPe` — 当前回合的全局序（wave*1e4 + turn） */
export function currentTurn(): number {
  const battle = globalScene.currentBattle;
  return battle ? (battle.waveIndex ?? 0) * 10000 + (battle.turn ?? 0) : -1;
}

/** 产物 `EPe` — 当前行动序（P5X 模式用 actionCounter，否则用 turn） */
export function currentActionCounter(): number {
  const battle = globalScene.currentBattle;
  if (!battle) return -1;
  const counter = gameMode?.isP5X
    ? (battle.p5xActionCounter ?? -1)
    : (battle.turn ?? -1);
  return (battle.waveIndex ?? 0) * 10000 + counter;
}

/** 产物 `rPe` — 活着的敌方单位 */
export function activeEnemies(): any[] {
  return globalScene
    .getEnemyField()
    .filter((p: any) => !!p && p.isActive() && !p.isFainted());
}

/** 产物 `fb` — 获得念力层数；返回实际增加量。附带触发：溢念 buff / 爆发检测 */
export function gainNianLiStacks(pokemon: any, amount: number): number {
  const data = nianLiDataOf(pokemon);
  if (!data || amount <= 0) return 0;
  const before = nianLiStacksOf(pokemon);
  const after = nianLiClamp(pokemon, before + amount);
  if (after === before) return 0;

  data.nianLiStacks = after;
  battleMessage(
    "battle",
    `[念力] ${pokemon.name} 获得 ${after - before} 层[念力] → ${after}/${nianLiMaxFor(pokemon)}`,
  );

  // 溢念：刷新 +20% 双攻 buff
  if (nianLiNodeActive(pokemon, NIANLI_NODE.OVERFLOW)) {
    addBattlerTag(pokemon, NIANLI_OVERFLOW_TAG, { turns: NIANLI_OVERFLOW_TURNS });
  }
  refreshBattleInfo(pokemon);

  // 首次满层 → 触发爆发
  if (before < NIANLI_MAX_BURST && after >= NIANLI_MAX_BURST) {
    tryNianLiBurst(pokemon);
  }
  return after - before;
}

/** 产物 `$ne` — 消耗全部层数；返回消耗量 */
export function consumeAllNianLiStacks(pokemon: any): number {
  const data = nianLiDataOf(pokemon);
  if (!data) return 0;
  const stacks = nianLiStacksOf(pokemon);
  if (stacks <= 0) return 0;
  data.nianLiStacks = 0;
  battleMessage("battle", `[念力] ${pokemon.name} 消耗 ${stacks} 层[念力]`);
  refreshBattleInfo(pokemon);
  return stacks;
}

/** 产物 `Pb` — 刷新战斗信息面板 */
export function refreshBattleInfo(pokemon: any): void {
  if (pokemon?.getBattleInfo()) pokemon.updateInfo();
}

/** 产物 `RPe` — 群体招式每回合限一次的获得层数 */
export function tryGainFromSpreadMove(pokemon: any): void {
  const data = nianLiDataOf(pokemon);
  if (!data) return;
  const counter = currentActionCounter();
  if (data.nianLiGainTurn === counter) return; // 每回合 1 次
  data.nianLiGainTurn = counter;
  const gain = nianLiNodeActive(pokemon, NIANLI_NODE.BURST)
    ? NIANLI_SPREAD_GAIN_BURST
    : NIANLI_SPREAD_GAIN_DEFAULT;
  gainNianLiStacks(pokemon, gain);
}

// 注：applyNianLiOnMoveUse（产物 `oPe`）的精确实现见本文件 §3「招式钩子 / 回合钩子」。

/** 产物 `OPe` — 随机降低一项能力 2 级 */
export function dropRandomStat(target: any): void {
  if (!target || target.isFainted()) return;
  const stat =
    NIANLI_DROPPABLE_STATS[
      Math.floor(Math.random() * NIANLI_DROPPABLE_STATS.length)
    ];
  unshiftPhase(StatStageChangePhase(target.getBattlerIndex(), false, [stat], NIANLI_STAT_DROP));
  battleMessage(
    "battle",
    `[念力] ${target.name} 的能力等级被[念力]压低 ${-NIANLI_STAT_DROP} 阶`,
  );
}

// ─────────────────────────────────────────────────────────────
// 3. 招式钩子 / 回合钩子（逐字还原自产物，2026-10-13 精确提取）
// ─────────────────────────────────────────────────────────────

/** 产物 `pRe` — 判定是否为「单体攻击招式」（非变化类） */
export function isNianLiSingleTargetMove(move: any): boolean {
  // 产物语义：category !== STATUS（单体性由调用方 oPe 的目标过滤保证）
  return move?.category !== MoveCategory.STATUS;
}

/**
 * 产物 `qfe` — 判定是否为「群体敌人招式（地震、放电不算）」。
 * 产物实现（`qfe(s)`）经 `dSe = new Set([ALL_NEAR_ENEMIES, ALL_ENEMIES])` 过滤目标类型。
 */
export function isNianLiSpreadMove(move: any): boolean {
  // 产物 `qfe`：move.target ∈ {ALL_NEAR_ENEMIES, ALL_ENEMIES}
  // 注意：地震(EARTHQUAKE)/放电(DISCHARGE) 虽为全体，但产物通过 target 集合之外的白名单排除；
  //       A4 阶段需用真实 MoveTarget 枚举核对 dSe 成员（见下方 NIANLI_SPREAD_TARGETS）。
  return NIANLI_SPREAD_TARGETS.includes(move?.target);
}

/** 产物 `sS` — 判定招式是否被念力系统屏蔽（如光子喷涌自身的自动攻击标记） */
export function isNianLiBlocked(pokemon: any, move: any): boolean {
  // 产物 oPe 中 `sS(n,s)` 与 isPlayer/自动攻击互斥；语义 = 「本招式由念力自动追加」
  return move?.id === MoveId.PHOTON_GEYSER && !!nianLiDataOf(pokemon)?.nianLiAutoAttack;
}

/**
 * 产物 `oPe` `applyNianLiOnMoveUse(pokemon, move, targets)` —— 招式使用主钩子。
 * 分支（逐字对应产物）：
 *   1) 自动攻击标记 → 若打出光子喷涌则回响(FD=3 层)
 *   2) 未激活基础节点 → 直接返回
 *   3) 对敌方变化招式（ePe）→ 消耗全部 + 逐层随机降能力，并触发回响
 *   4) 超能系单体攻击 → 消耗全部，触发回响
 *   5) 群体招式 或被屏蔽 → 由 tryGainFromSpreadMove 尝试获得层数
 */
export function applyNianLiOnMoveUse(pokemon: any, move: any, targets?: any[]): void {
  if (!pokemon?.isPlayer()) return;
  const data = nianLiDataOf(pokemon);
  if (!data) return;

  // ① 自动攻击（满层爆发追加的光子喷涌）
  if (data.nianLiAutoAttack) {
    if (move.id === MoveId.PHOTON_GEYSER) {
      healFromConsume(pokemon, NIANLI_MAX_BURST); // 产物 QH(n, FD)
    }
    return;
  }
  // ② 未点「念力」基础节点 → 不参与
  if (!nianLiNodeActive(pokemon, NIANLI_NODE.BASE)) return;

  // ③ 对敌方变化招式：消耗全部 → 每层随机降 2 级 + 回响
  const enemyTargets = (targets ?? []).filter((t) => !!t && !t.isPlayer() && !t.isFainted());
  if (isNianLiStatusMoveAgainstEnemy(move, enemyTargets)) {
    const consumed = consumeAllNianLiStacks(pokemon);
    if (consumed > 0) {
      const target = enemyTargets[0];
      for (let i = 0; i < consumed; i++) dropRandomStat(target);
      healFromConsume(pokemon, consumed);
    }
    return;
  }
  // ④ 超能系单体攻击：消耗全部 + 回响
  if (move.type === PokemonType.PSYCHIC && isNianLiSingleTargetMove(move) && !isNianLiBlocked(pokemon, move)) {
    const consumed = consumeAllNianLiStacks(pokemon);
    if (consumed > 0) healFromConsume(pokemon, consumed);
    return;
  }
  // ⑤ 群体招式
  if (isNianLiSpreadMove(move) || isNianLiBlocked(pokemon, move)) {
    tryGainFromSpreadMove(pokemon);
  }
}

/** 产物 `ePe` — 是否为「对敌方使用的变化招式」 */
export function isNianLiStatusMoveAgainstEnemy(move: any, enemyTargets: any[]): boolean {
  return move?.category === MoveCategory.STATUS && enemyTargets.length > 0;
}

/**
 * 产物 `QH` `healFromConsume(pokemon, stacks)` —— 念之回响：
 * 回复我方当前血量百分比最低者，量为「最大生命 × 11% × 消耗层数」（至少 1）。
 */
export function healFromConsume(pokemon: any, stacks: number): void {
  if (stacks <= 0 || !nianLiNodeActive(pokemon, NIANLI_NODE.ECHO)) return;
  const ally = lowestHpRatioAlly$1();
  if (!ally) return;
  const amount = Math.max(1, Math.floor(ally.getMaxHp() * NIANLI_HEAL_PER_STACK * stacks));
  applyHealTo(ally, amount);
  battleMessage(
    "battle",
    `[念力] 5 命回响：消耗 ${stacks} 层 → 回复 ${ally.name} ${amount} 点生命`,
  );
}

/** 产物 `IPe` — 我方当前血量百分比最低且未濒死的宝可梦 */
export function lowestHpRatioAlly$1(): any {
  return (globalScene.getPlayerParty() as any[])
    .filter((p) => !!p && !p.isFainted())
    .reduce<any>(
      (best, p) => (best == null || p.getHpRatio() < best.getHpRatio() ? p : best),
      undefined,
    );
}

/** 产物 `tryNianLiBurst` `LPe` —— 满层爆发：对随机敌人追加一次光子喷涌（不消耗层数）。 */
export function tryNianLiBurst(pokemon: any): void {
  const data = nianLiDataOf(pokemon);
  if (!data || !nianLiNodeActive(pokemon, NIANLI_NODE.BURST)) return;
  const turn = currentTurn();
  if (data.nianLiBurstTurn === turn) return; // 每轮 1 次
  const enemies = activeEnemies();
  if (!enemies.length) return;
  const target = enemies[globalScene.randBattleSeedInt(enemies.length)];
  data.nianLiBurstTurn = turn;
  data.nianLiAutoAttack = true;
  pokemon.turnData.extraTurns++;
  globalScene.unshiftPhase(
    new (AddExtraTurnPhase as any)(pokemon.getBattlerIndex(), [target.getBattlerIndex()], new (Move as any)(MoveId.PHOTON_GEYSER, 0, 0, true)),
    new (ToggleAutoAttackPhase as any)(pokemon),
  );
  battleMessage(
    "battle",
    `[念力] ${pokemon.name} 满层爆发 → 对 ${target.name} 追加「光子喷涌」（不消耗[念力]）`,
  );
}

/** 产物 `f6` — 爆发结束阶段（恢复 nianLiAutoAttack = false） */
export class NianLiBurstEndPhase {
  constructor(private readonly pokemon: any) {}
  start(): boolean {
    const data = nianLiDataOf(this.pokemon);
    if (data) data.nianLiAutoAttack = false;
    return true;
  }
}

// ─────────────────────────────────────────────────────────────
// 4. 回合钩子（产物 `SPe` / `TPe`，2026-10-13 精确提取）
// ─────────────────────────────────────────────────────────────

/** 产物 `SPe` `onNianLiTurnStart()` — 每轮开始：所有已点「念之意志」的我方各 +1 层 */
export function onNianLiTurnStart(): void {
  for (const pokemon of globalScene.getPlayerParty()) {
    if (!pokemon || pokemon.isFainted()) continue;
    if (nianLiNodeActive(pokemon, NIANLI_NODE.WILL)) {
      gainNianLiStacks(pokemon, 1);
    }
  }
}

/**
 * 产物 `TPe` `tryNianLiEndure(pokemon)` — 「念之意志」保命：
 * 每波次首次受到致命伤害时保留 1 点生命并再获得 1 层[念力]。
 * @returns 是否触发保命
 */
export function tryNianLiEndure(pokemon: any): boolean {
  if (!pokemon?.isPlayer() || !nianLiNodeActive(pokemon, NIANLI_NODE.WILL)) return false;
  const data = nianLiDataOf(pokemon);
  if (!data) return false;
  const wave = globalScene.currentBattle?.waveIndex ?? -1;
  if (data.nianLiEndureWave === wave) return false; // 本波已触发过
  data.nianLiEndureWave = wave;
  battleMessage(
    "battle",
    `[念力] ${pokemon.name} 触发 3 命「念之意志」保命（本波首次）`,
  );
  gainNianLiStacks(pokemon, 1);
  return true;
}
