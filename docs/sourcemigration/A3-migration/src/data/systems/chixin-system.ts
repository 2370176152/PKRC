/**
 * 潜心（CHIXIN，卡面名「赤心」）—— 自研系统迁移
 * ---------------------------------------------------------------------------
 * 来源：game/server/dist/assets/loading-scene-By2k7Qfx.js（.orig 产物）@4378000 起
 * 逆向方式：`l(短名,"原函数名")` 反查 + 常量赋值精确定位（见 A3-迁移规范 §3）
 * 锚点树：90df65097b6df76f713e6bd108afa84499e8b993
 *
 * 定位：命座接入组 7 系统之一（A3-05）。物种 = 六尾 / 夜盗火蜥 / 鸭嘴宝宝 / 呆火鳄
 *       （`TOe`）。核心是「火伤攒【潜心】计数」（弱点命中 +1、每次行动至多 +4、
 *       [燃烧]敌人每只每轮 +1 至多 +2），满 4 点进入【潜心】窗口（双攻 +1 阶、
 *       全队火伤 ×1.3），窗口结束时按 2 命【余温未散】回血，并可 3 命【不灭美焰】
 *       保命。经公共底座 `registerConstellation` 注册 5 个命座节点
 *       （`exclusiveNodes` 覆盖 1/2/3/5/6 —— 无 4 命，4 命走通用命座）。
 *
 * 产物符号对照（去混淆映射，务必逐条保留）：
 *   hI   → registerConstellation        （公共底座）
 *   sa   → constellationLevel$1         （公共底座）
 *   vR   → constellationNodeMode        （公共底座）
 *   uE   → hasP5XEffect
 *   kn   → applyP5XEffect
 *   Nw   → registerP5XEffectExpireHandler
 *   Vt   → StatStageChangePhase         （产物 `new Vt(...)`）
 *   z    → debugLog
 *   E    → globalScene
 *   R    → PokemonType
 *   Se   → StatusEffect
 *   Le   → MoveTarget
 *   p    → Stat
 *   ie   → getPokemonNameWithAffix
 *   vo   → customPokemonData（通过 `n.customPokemonData` 访问）
 *
 *   常量：
 *   g0   → CHIXIN_NODE.BURST          (=1)
 *   OOe  → CHIXIN_NODE.WARMTH         (=2)
 *   IOe  → CHIXIN_NODE.UNDYING        (=3)
 *   Pg   → CHIXIN_NODE.FIRE_UNREST    (=5)
 *   H0   → CHIXIN_NODE.PERFECT_FINALE (=6)
 *   lOe  → ENTER_THRESHOLD            (=4)
 *   r1e  → EXIT_CONSUME               (=4)
 *   o1e  → MAX_BASE                   (=4)
 *   SOe  → MAX_FINALE                 (=8)
 *   R1e  → GAIN_WEAKNESS              (=1)
 *   O1e  → GAIN_WEAKNESS_FINALE       (=2)
 *   I1e  → GAIN_BURN_EXTRA            (=1)（弱点 + 燃烧时追加）
 *   l1e  → GAIN_PER_ACTION_CAP        (=4)
 *   S1e  → BURN_GAIN_PER_ROUND_CAP    (=2)
 *   Yv   → WINDOW_ROUNDS              (=2)
 *   T1e  → COOLDOWN_ROUNDS            (=1)
 *   L1e  → COOLDOWN_ROUNDS_FINALE     (=0)
 *   N1e  → FIRE_POWER_MULT            (=1.3)
 *   u1e  → TARGETED_LOW_HP_MULT       (=1.3)
 *   c1e  → TARGETED_LOW_HP_RATIO      (=0.5)
 *   h1e  → SPREAD_ENEMY_ATK_DOWN_MULT (=1.2)（5 命：群攻时伤害额外 ×1.2）
 *   C1e  → STAGE_GAIN_CAP             (=1)（进入时双攻各 +1 阶）
 *   jAe  → STAT_STAGE_MAX             (=6)
 *   zAe  → SPREAD_STAT_STAGE_DOWN     (=-1)
 *   d1e  → FINALE_PER_STACK_BONUS     (=0.1)
 *   M1e  → PURSUIT_HITS               (=2)
 *   U1e  → PURSUIT_DAMAGE_RATIO       (=0.35)
 *   D1e  → WARMTH_ATK_RATIO           (=0.4)（2 命：最低血队友回自身 40% 物攻）
 *   f1e  → WARMTH_SELF_HP_RATIO       (=0.25)（2 命：自身回 25% 最大 HP）
 *   _g   → CHIXIN_WINDOW_TAG          (="chiXin:window")
 *   W1e  → SPREAD_TARGETS             (=Set[ALL_NEAR_ENEMIES, ALL_ENEMIES])
 */
import { registerConstellation, type ConstellationCodexEntry } from "./constellation-framework";

// ─────────────────────────────────────────────────────────────
// 0. 依赖（上游 API，待接入锚点源码时改为真实 import）
// ─────────────────────────────────────────────────────────────
declare const globalScene: any; // 产物 `E`
declare const PokemonType: any; // 产物 `R`（PokemonType enum）
declare const StatusEffect: any; // 产物 `Se`（StatusEffect enum）
declare const MoveTarget: any; // 产物 `Le`（MoveTarget enum）
declare const Stat: any; // 产物 `p`（Stat enum）
declare const debugLog: (type: string, msg: string) => void; // 产物 `z`
declare const constellationLevel: (data: any, species: any) => number; // 产物 `sa`
declare const constellationNodeMode: (species: any, node: number, data: any) => string; // 产物 `vR`
declare const hasP5XEffect: (pokemon: any, key: string) => boolean; // 产物 `uE`
declare const applyP5XEffect: (pokemon: any, key: string, opts: any) => void; // 产物 `kn`
declare const registerP5XEffectExpireHandler: (key: string, handler: (pokemon: any) => void) => void; // 产物 `Nw`
declare const StatStageChangePhase: any; // 产物 `Vt`（`new Vt(battlerIndex, quiet, stats, stages)`）

// ─────────────────────────────────────────────────────────────
// 1. 常量（还原自产物 `g0.._g`）
// ─────────────────────────────────────────────────────────────

/** 命座节点索引（`_1e.exclusiveNodes` 的顺序即此常量组 —— 注意无 4 命） */
export const CHIXIN_NODE = {
  /** 潜心（火伤攒计数，满 4 进入【潜心】） */
  BURST: 1, // 产物 `g0`
  /** 余温未散（窗口结束回血 + 最低血队友回血） */
  WARMTH: 2, // 产物 `OOe`
  /** 不灭美焰（每场首次致命伤害保 1 HP + 立即进【潜心】） */
  UNDYING: 3, // 产物 `IOe`
  /** 忘我境界（火伤必命中要害 + 每轮追击 + 弱点额外 ×1.2） */
  FIRE_UNREST: 5, // 产物 `Pg`
  /** 完美谢幕（上限 4→8、+2/次、冷却 0、每点全队火伤 +10%） */
  PERFECT_FINALE: 6, // 产物 `H0`
} as const;

/** 进入【潜心】所需计数 */
export const ENTER_THRESHOLD = 4; // 产物 `lOe`
/** 窗口结束时消耗计数 */
export const EXIT_CONSUME = 4; // 产物 `r1e`
/** 计数上限（基准 / 6 命） */
export const MAX_BASE = 4; // 产物 `o1e`
export const MAX_FINALE = 8; // 产物 `SOe`

/** 弱点命中获得计数（基准 / 6 命） */
export const GAIN_WEAKNESS = 1; // 产物 `R1e`
export const GAIN_WEAKNESS_FINALE = 2; // 产物 `O1e`
/** 弱点并燃烧时追加计数 */
export const GAIN_BURN_EXTRA = 1; // 产物 `I1e`
/** 每次行动计数上限（门控，每轮重置） */
export const GAIN_PER_ACTION_CAP = 4; // 产物 `l1e`
/** [燃烧]敌人供层：每只每轮 +1，至多 +2 */
export const BURN_GAIN_PER_ROUND_CAP = 2; // 产物 `S1e`

/** 窗口持续轮数（含进入轮剩余 + 下一整轮） */
export const WINDOW_ROUNDS = 2; // 产物 `Yv`
/** 冷却轮数（基准 / 6 命） */
export const COOLDOWN_ROUNDS = 1; // 产物 `T1e`
export const COOLDOWN_ROUNDS_FINALE = 0; // 产物 `L1e`

/** 全队火属性招式威力系数 */
export const FIRE_POWER_MULT = 1.3; // 产物 `N1e`
/** 单体火招打半血以下目标的额外系数 */
export const TARGETED_LOW_HP_MULT = 1.3; // 产物 `u1e`
export const TARGETED_LOW_HP_RATIO = 0.5; // 产物 `c1e`
/** 5 命：火属性群攻命中时伤害额外系数 */
export const SPREAD_ENEMY_ATK_DOWN_MULT = 1.2; // 产物 `h1e`
/** 进入窗口时自身双攻提升阶数上限 */
export const STAGE_GAIN_CAP = 1; // 产物 `C1e`
/** 能力等级上限（+6） */
export const STAT_STAGE_MAX = 6; // 产物 `jAe`
/** 群攻削弱：目标双攻 -1 阶 */
export const SPREAD_STAT_STAGE_DOWN = -1; // 产物 `zAe`
/** 6 命：每点计数使全队火伤 +10% */
export const FINALE_PER_STACK_BONUS = 0.1; // 产物 `d1e`

/** 5 命追击：段数与每段伤害比例（较高一攻 × 比例） */
export const PURSUIT_HITS = 2; // 产物 `M1e`
export const PURSUIT_DAMAGE_RATIO = 0.35; // 产物 `U1e`

/** 2 命【余温未散】：最低血队友回自身物攻比例 / 自身回最大 HP 比例 */
export const WARMTH_ATK_RATIO = 0.4; // 产物 `D1e`
export const WARMTH_SELF_HP_RATIO = 0.25; // 产物 `f1e`

/** 【潜心】窗口效果 tag（P5X 效果键） */
export const CHIXIN_WINDOW_TAG = "chiXin:window"; // 产物 `_g`
/** 群攻目标集合（用于判断招式是否群体化） */
export const SPREAD_TARGETS: Set<any> = new Set([
  MoveTarget.ALL_NEAR_ENEMIES,
  MoveTarget.ALL_ENEMIES,
]); // 产物 `W1e`

// ─────────────────────────────────────────────────────────────
// 2. 物种
// ─────────────────────────────────────────────────────────────

/** 本命座归属物种（六尾 / 夜盗火蜥 / 鸭嘴宝宝 / 呆火鳄） */
export const CHIXIN_SPECIES: number[] = [
  SpeciesId.VULPIX, // 产物 `e.VULPIX`
  SpeciesId.SALANDIT, // 产物 `e.SALANDIT`
  SpeciesId.MAGBY, // 产物 `e.MAGBY`
  SpeciesId.FUECOCO, // 产物 `e.FUECOCO`
]; // 产物 `TOe`

// ─────────────────────────────────────────────────────────────
// 3. 命座图鉴（中文串逐字保留，见规范 §7）
// ─────────────────────────────────────────────────────────────

export const CHIXIN_CODEX: ConstellationCodexEntry[] = [
  {
    name: "潜心",
    description: `火伤攒[潜心]：弱点+1、每次行动至多+4；[燃烧]敌人每只每轮+1（至多+2）。
满4点进[潜心]（本轮剩余+下一整轮，冷却1轮）：自身双攻+1阶、全队火伤×1.3。
结束时消耗4点；[潜心]中火属性群攻使目标双攻-1阶、单体打半血以下×1.3。`,
  },
  {
    name: "余温未散",
    description: `[潜心]结束时，血量最低的我方单位（含自身）回复自身40%物攻的HP；
自身再回复25%最大HP。`,
  },
  {
    name: "不灭美焰",
    description:
      "每场战斗首次受到致命伤害时保留 1 点 HP、免疫当回合后续伤害，并立即进入[潜心]；这一次[潜心]不占用节奏门控（下一轮仍可正常触发）。",
  },
  {
    name: "艳火不休",
    description:
      "沿用通用命座：本局PT／金币／结算PT 三选一，+15%（每只不同种族各计一次，可叠加）。",
  },
  {
    name: "忘我境界",
    description: `[潜心]期间：自身火属性招式必定命中要害；
火伤后每轮1次追加2段固定伤害（较高一攻×35%，随机单体）；
火属性招式命中弱点时伤害额外×1.2。`,
  },
  {
    name: "完美谢幕",
    description: `[潜心]计数上限4→8；火伤改为获得2点计数；冷却1轮→0轮；
[潜心]期间每1点计数使全队火伤+10%（最多8点=+80%）。`,
  },
]; // 产物 `P1e`

// ─────────────────────────────────────────────────────────────
// 4. 注册载荷（`exclusiveNodes` 覆盖 1/2/3/5/6 —— 无 4 命）
// ─────────────────────────────────────────────────────────────

export const CHIXIN_CONSTELLATION_PAYLOAD = {
  exclusiveNodes: [
    CHIXIN_NODE.BURST,
    CHIXIN_NODE.WARMTH,
    CHIXIN_NODE.UNDYING,
    CHIXIN_NODE.FIRE_UNREST,
    CHIXIN_NODE.PERFECT_FINALE,
  ],
}; // 产物 `_1e`

// ─────────────────────────────────────────────────────────────
// 5. 模块级状态
// ─────────────────────────────────────────────────────────────

/** 类型倍率查询函数（由外部注入；默认恒为 1） */
let typeMultiplierImpl: (moveType: any, defType: any) => number = () => 1; // 产物 `LOe`

export function injectChiXinTypeMultiplier(fn: (moveType: any, defType: any) => number): void {
  typeMultiplierImpl = fn;
} // 产物 `G1e`

/** 追击重入标志（防止追击触发追击） */
let pursuitRunning = false; // 产物 `XM`
/** 命中结算默认返回（无计数变化） */
const NO_STACK_CHANGE = { stacksChanged: false }; // 产物 `cM`

// ─────────────────────────────────────────────────────────────
// 6. 基础查询
// ─────────────────────────────────────────────────────────────

/** 是否本命座物种 */
export function isChiXinSpecies(speciesId: any): boolean {
  return CHIXIN_SPECIES.includes(speciesId);
} // 产物 `NOe`

/** 指定命座节点是否处于生效（exclusive）状态 */
export function chiXinNodeActive(pokemon: any, node: number): boolean {
  const root = pokemon.species.getRootSpeciesId();
  if (!isChiXinSpecies(root)) return false;
  const data = globalScene.gameData?.ptSoudacheData;
  if (constellationLevel(data, root) < node) return false;
  return constellationNodeMode(root, node, data) === "exclusive";
} // 产物 `XE`

/** 当前计数上限（6 命 8 点，否则 4 点） */
export function chiXinMaxFor(pokemon: any): number {
  return chiXinNodeActive(pokemon, CHIXIN_NODE.PERFECT_FINALE) ? MAX_FINALE : MAX_BASE;
} // 产物 `Gg`

/** 计数夹取 */
export function clampChiXin(value: number, max: number): number {
  return Math.max(0, Math.min(max, Math.floor(value) || 0));
} // 产物 `vv`

/** 读取【潜心】计数 */
export function chiXinStacksOf(pokemon: any): number {
  return pokemon?.customPokemonData?.chiXinStacks ?? 0;
} // 产物 `gl`

/** 是否处于【潜心】窗口 */
export function inChiXin(pokemon: any): boolean {
  return hasP5XEffect(pokemon, CHIXIN_WINDOW_TAG);
} // 产物 `AI`

/** 当前「行动键」（波次 ×1e4 + P5X 行动计数 / 回合） */
export function currentActionKey(): number {
  const battle = globalScene.currentBattle;
  if (!battle) return -1;
  const tick = globalScene.gameMode?.isP5X ? battle.p5xActionCounter : (battle.turn ?? -1);
  return (battle.waveIndex ?? 0) * 1e4 + tick;
} // 产物 `g1e`

/** 当前回合序数 */
export function currentRound(): number {
  return globalScene.currentBattle?.turn ?? -1;
} // 产物 `Yb`

/** 当前轮键（波次 ×1e4 + 回合） */
export function currentRoundKey(): number {
  const battle = globalScene.currentBattle;
  return battle ? (battle.waveIndex ?? 0) * 1e4 + (battle.turn ?? 0) : -1;
} // 产物 `H1e`

/** 当前波次 */
export function currentWave(): number {
  return globalScene.currentBattle?.waveIndex ?? -1;
} // 产物 `uOe`

/** 刷新面板】
 */
export function refreshInfo(pokemon: any): void {
  pokemon.updateInfo();
} // 产物 `gg`

// ─────────────────────────────────────────────────────────────
// 7. 双攻阶数（进入窗口时 +1 / 结束 / 保命时回滚）
// ─────────────────────────────────────────────────────────────

/** 本次可提升的双攻阶数（受 +6 与上限门控） */
export function chiXinStageGainFor(pokemon: any): number {
  const atkRoom = STAT_STAGE_MAX - pokemon.getStatStage(Stat.ATK);
  const spatkRoom = STAT_STAGE_MAX - pokemon.getStatStage(Stat.SPATK);
  return Math.max(0, Math.min(STAGE_GAIN_CAP, atkRoom, spatkRoom));
} // 产物 `p1e`

/** 提升双攻并记录本次提升量 */
export function grantChiXinStatStage(pokemon: any): void {
  const gain = chiXinStageGainFor(pokemon);
  pokemon.customPokemonData.chiXinStageGain = gain;
  if (gain <= 0) {
    debugLog("battle", `[潜心] ${pokemon.name} 攻/特攻已到上限，本窗口不再提升`);
    return;
  }
  globalScene.unshiftPhase(
    new StatStageChangePhase(pokemon.getBattlerIndex(), true, [Stat.ATK, Stat.SPATK], gain),
  );
} // 产物 `cOe`

/** 回滚本次提升的双攻阶数 */
export function revokeChiXinStatStage(pokemon: any): void {
  const gain = pokemon.customPokemonData?.chiXinStageGain ?? 0;
  pokemon.customPokemonData.chiXinStageGain = 0;
  if (gain <= 0 || !pokemon.isOnField()) return;
  globalScene.unshiftPhase(
    new StatStageChangePhase(pokemon.getBattlerIndex(), true, [Stat.ATK, Stat.SPATK], -gain),
  );
} // 产物 `m1e`

// ─────────────────────────────────────────────────────────────
// 8. 计数增减
// ─────────────────────────────────────────────────────────────

/** 增减【潜心】计数（夹取到上限），返回是否发生变化 */
export function addChiXinStacks(pokemon: any, delta: number): boolean {
  const data = pokemon?.customPokemonData;
  if (!data || delta === 0) return false;
  const max = chiXinMaxFor(pokemon);
  const before = clampChiXin(data.chiXinStacks ?? 0, max);
  const after = clampChiXin(before + delta, max);
  if (after === before) return false;
  data.chiXinStacks = after;
  debugLog("battle", `[潜心] ${pokemon.name} 计数 ${before} → ${after}/${max}`);
  return true;
} // 产物 `wv`

/** 退出窗口时消耗计数 */
export function spendChiXinStacks(pokemon: any): boolean {
  return addChiXinStacks(pokemon, -EXIT_CONSUME);
} // 产物 `B1e`

/** 若已跨「行动键」则重置本次行动计数（每次行动至多 +4 的门控） */
export function resetActionGainIfNeeded(pokemon: any): void {
  const data = pokemon.customPokemonData;
  if (!data) return;
  const key = currentActionKey();
  if (data.chiXinGainAction !== key) {
    data.chiXinGainAction = key;
    data.chiXinGainCount = 0;
  }
} // 产物 `y1e`

// ─────────────────────────────────────────────────────────────
// 9. 进入窗口
// ─────────────────────────────────────────────────────────────

/** 尝试进入【潜心】窗口（满阈值 + 冷却期外 + 未处于窗口） */
export function tryEnterChiXin(pokemon: any): boolean {
  if (!chiXinNodeActive(pokemon, CHIXIN_NODE.BURST) || inChiXin(pokemon)) return false;
  const data = pokemon.customPokemonData;
  if (!data || chiXinStacksOf(pokemon) < ENTER_THRESHOLD) return false;
  const round = currentRound();
  const wave = currentWave();
  // 同一波内、尚未越过冷却轮 → 拒绝
  if (wave === (data.chiXinReadyWave ?? -1) && round < (data.chiXinReadyRound ?? -1)) return false;
  const cooldown = chiXinNodeActive(pokemon, CHIXIN_NODE.PERFECT_FINALE)
    ? COOLDOWN_ROUNDS_FINALE
    : COOLDOWN_ROUNDS;
  data.chiXinReadyWave = wave;
  data.chiXinReadyRound = round + WINDOW_ROUNDS + cooldown;
  applyP5XEffect(pokemon, CHIXIN_WINDOW_TAG, { rounds: WINDOW_ROUNDS });
  grantChiXinStatStage(pokemon);
  globalScene.queueMessage(`${pokemon.name} 进入了【潜心】！全队火属性招式威力提升。`);
  debugLog("battle", `[潜心] ${pokemon.name} 进入【潜心】（计数 ${chiXinStacksOf(pokemon)}）`);
  refreshInfo(pokemon);
  return true;
} // 产物 `F1e`

// ─────────────────────────────────────────────────────────────
// 10. 窗口结束钩子（2 命【余温未散】+ 消耗计数）
// ─────────────────────────────────────────────────────────────

/** 当前场上血量最低的我方单位 */
export function lowestHpRatioAlly(): any {
  const party = globalScene.getPlayerParty().filter((p: any) => p.isActive() && !p.isFainted());
  if (!party.length) return undefined;
  return party.reduce((best: any, cur: any) =>
    cur.hp / Math.max(1, cur.getMaxHp()) < best.hp / Math.max(1, best.getMaxHp()) ? cur : best,
  );
} // 产物 `K1e`

/**
 * 【潜心】窗口过期回调（产物 `Nw(_g, cb)` 注册）：
 * 消耗计数 → 回滚双攻 → 2 命回血 → 刷新。
 */
export function onChiXinWindowExpire(pokemon: any): void {
  spendChiXinStacks(pokemon);
  revokeChiXinStatStage(pokemon);
  if (chiXinNodeActive(pokemon, CHIXIN_NODE.WARMTH)) {
    const maxHp = pokemon.getMaxHp();
    const selfHeal = Math.max(0, Math.floor(maxHp * WARMTH_SELF_HP_RATIO));
    if (selfHeal > 0 && !pokemon.isFainted() && pokemon.hp < maxHp) {
      pokemon.hp = Math.min(maxHp, pokemon.hp + selfHeal);
    }
    const ally = lowestHpRatioAlly();
    if (ally && ally.hp < ally.getMaxHp()) {
      const heal = Math.max(1, Math.floor(pokemon.getEffectiveStat(Stat.ATK) * WARMTH_ATK_RATIO));
      ally.hp = Math.min(ally.getMaxHp(), ally.hp + heal);
      ally.updateInfo();
    }
    debugLog("battle", "[潜心] 2 命「余温未散」触发");
  }
  debugLog("battle", `[潜心] ${pokemon.name} 窗口结束，消耗 ${EXIT_CONSUME} 层`);
  refreshInfo(pokemon);
}

// ─────────────────────────────────────────────────────────────
// 11. 招式上下文与倍率
// ─────────────────────────────────────────────────────────────

/** 招式是否群体化（目标为群攻枚举） */
export function isSpreadMove(move: any): boolean {
  return SPREAD_TARGETS.has(move.moveTarget);
} // 产物 `hOe`

/** 记录本次行动的招式上下文（属性 / 是否群攻） */
export function recordChiXinMoveContext(user: any, move: any): void {
  if (!user.isPlayer()) return;
  const data = user.customPokemonData;
  if (!data) return;
  data.chiXinPendingType = move.type;
  data.chiXinPendingSpread = isSpreadMove(move);
} // 产物 `Y1e`

/** 消费本次行动的招式上下文 */
export function consumeChiXinMoveContext(user: any): { type: number; spread: boolean } | undefined {
  const data = user.customPokemonData;
  if (!data || data.chiXinPendingType === undefined || data.chiXinPendingType < 0) return undefined;
  const ctx = { type: data.chiXinPendingType, spread: !!data.chiXinPendingSpread };
  data.chiXinPendingType = undefined;
  data.chiXinPendingSpread = false;
  return ctx;
} // 产物 `v1e`

/** 场上处于【潜心】窗口的我方单位 */
export function chiXinHolders(): any[] {
  return globalScene
    .getPlayerParty()
    .filter((p: any) => isChiXinSpecies(p.species.getRootSpeciesId()) && inChiXin(p));
} // 产物 `w1e`

/** 场上已激活 1 命（可攒计数）的我方单位 */
export function chiXinCountGainers(): any[] {
  return globalScene
    .getPlayerParty()
    .filter((p: any) => p.isActive(true) && chiXinNodeActive(p, CHIXIN_NODE.BURST));
} // 产物 `b1e`

/** 全队火属性招式威力倍率（基准 ×1.3；6 命再按最高计数 ×(1 + 计数×10%)） */
export function chiXinFirePowerMultiplier(user: any): number {
  if (!user.isPlayer()) return 1;
  const holders = chiXinHolders();
  if (!holders.length) return 1;
  let mult = FIRE_POWER_MULT;
  const best = holders.reduce((a: any, b: any) => (chiXinStacksOf(a) >= chiXinStacksOf(b) ? a : b));
  if (chiXinNodeActive(best, CHIXIN_NODE.PERFECT_FINALE)) {
    const stacks = Math.min(chiXinStacksOf(best), MAX_FINALE);
    mult *= 1 + stacks * FINALE_PER_STACK_BONUS;
  }
  return mult;
} // 产物 `x1e`

/** 单体火招打半血以下目标、以及 5 命群攻的额外倍率 */
export function chiXinTargetedMoveMultiplier(
  user: any,
  target: any,
  move: any,
  spread: boolean,
): number {
  if (!user.isPlayer() || !inChiXin(user)) return 1;
  let mult = 1;
  if (
    move.type === PokemonType.FIRE &&
    !isSpreadMove(move) &&
    target.hp / Math.max(1, target.getMaxHp()) < TARGETED_LOW_HP_RATIO
  ) {
    mult *= TARGETED_LOW_HP_MULT;
  }
  if (spread && chiXinNodeActive(user, CHIXIN_NODE.FIRE_UNREST)) {
    mult *= SPREAD_ENEMY_ATK_DOWN_MULT;
  }
  return mult;
} // 产物 `V1e`

/** 5 命：处于【潜心】时火属性招式是否必定命中要害 */
export function chiXinAlwaysCrit(user: any, move: any): boolean {
  if (!user.isPlayer() || move.type !== PokemonType.FIRE || !inChiXin(user)) return false;
  return chiXinNodeActive(user, CHIXIN_NODE.FIRE_UNREST);
} // 产物 `k1e`

/** 目标是否被指定属性克制 */
export function isSuperEffectiveAgainst(target: any, moveType: any): boolean {
  return target.getTypes().some((t: any) => typeMultiplierImpl(moveType, t) > 1);
} // 产物 `Z1e`

// ─────────────────────────────────────────────────────────────
// 12. 命中结算主入口
// ─────────────────────────────────────────────────────────────

/**
 * 火属性招式命中后的【潜心】结算（产物 `X1e`）：
 * ①燃烧供层；②弱点计数（每动作门控）；③群攻削弱目标双攻；④5 命追击。
 */
export function applyChiXinOnHit(user: any, target: any): { stacksChanged: boolean } {
  if (!user.isPlayer()) return NO_STACK_CHANGE;
  const ctx = consumeChiXinMoveContext(user);
  if (!ctx || ctx.type !== PokemonType.FIRE) return NO_STACK_CHANGE;
  const gainers = chiXinCountGainers();
  if (!gainers.length || pursuitRunning) return NO_STACK_CHANGE;

  const roundKey = currentRoundKey();
  const isWeak = isSuperEffectiveAgainst(target, ctx.type);
  let burnCount: number | null = null;
  let changed = false;

  for (const mon of gainers) {
    const data = mon.customPokemonData;
    if (!data) continue;
    resetActionGainIfNeeded(mon);
    let monChanged = false;

    // ① [燃烧]敌人供层（每轮每只 +1，至多 +2）
    if (data.chiXinBurnRound !== roundKey) {
      data.chiXinBurnRound = roundKey;
      if (burnCount === null) {
        burnCount = globalScene
          .getEnemyField()
          .filter(
            (f: any) =>
              !!f && f.isActive() && !f.isFainted() && f.status?.effect === StatusEffect.BURN,
          ).length;
      }
      const burnGain = Math.min(burnCount, BURN_GAIN_PER_ROUND_CAP);
      if (burnGain > 0) {
        monChanged = addChiXinStacks(mon, burnGain) || monChanged;
        debugLog("battle", `[潜心] 燃烧供层 ${mon.name} +${burnGain}（场上 ${burnCount} 只燃烧）`);
      }
    }

    // ② 弱点计数（每动作至多 +4）
    let gain = chiXinNodeActive(mon, CHIXIN_NODE.PERFECT_FINALE)
      ? GAIN_WEAKNESS_FINALE
      : GAIN_WEAKNESS;
    if (isWeak) gain += GAIN_BURN_EXTRA;
    const room = Math.max(0, GAIN_PER_ACTION_CAP - (data.chiXinGainCount ?? 0));
    const applied = Math.min(gain, room);
    data.chiXinGainCount = (data.chiXinGainCount ?? 0) + applied;
    if (applied > 0) monChanged = addChiXinStacks(mon, applied) || monChanged;

    if (monChanged) {
      refreshInfo(mon);
      changed = true;
      tryEnterChiXin(mon);
    }
  }

  // ③ 【潜心】中火属性群攻 → 目标双攻 -1 阶
  if (ctx.spread && inChiXin(user) && !target.isFainted()) {
    globalScene.unshiftPhase(
      new StatStageChangePhase(
        target.getBattlerIndex(),
        false,
        [Stat.ATK, Stat.SPATK],
        SPREAD_STAT_STAGE_DOWN,
      ),
    );
    debugLog("battle", `[潜心] 群攻削弱 ${target.name} 攻/特攻 ${SPREAD_STAT_STAGE_DOWN} 阶`);
  }

  // ④ 5 命：每轮 1 次追击
  const data = user.customPokemonData;
  if (
    data &&
    chiXinNodeActive(user, CHIXIN_NODE.FIRE_UNREST) &&
    inChiXin(user) &&
    data.chiXinPursuitRound !== roundKey
  ) {
    data.chiXinPursuitRound = roundKey;
    runChiXinPursuit(user);
    changed = true;
  }

  return { stacksChanged: changed };
} // 产物 `X1e`

// ─────────────────────────────────────────────────────────────
// 13. 5 命追击
// ─────────────────────────────────────────────────────────────

/** 单段追击：随机一名存活敌人，受较高一攻 ×35% 固定伤害 */
export function dealChiXinPursuit(user: any): void {
  const enemies = globalScene.getEnemyField().filter((f: any) => !!f && f.isActive() && !f.isFainted());
  if (!enemies.length) return;
  const target = enemies[globalScene.randBattleSeedInt(enemies.length)];
  if (target.isFainted()) return;
  const power = Math.max(user.getEffectiveStat(Stat.ATK), user.getEffectiveStat(Stat.SPATK));
  const damage = Math.max(1, Math.floor(power * PURSUIT_DAMAGE_RATIO));
  target.damageAndUpdate(damage);
  debugLog("battle", `[潜心] 追击 → ${target.name}（${damage}）`);
} // 产物 `$1e`

/** 追击 2 段（带重入门控） */
export function runChiXinPursuit(user: any): void {
  if (pursuitRunning) return;
  pursuitRunning = true;
  try {
    for (let i = 0; i < PURSUIT_HITS; i++) dealChiXinPursuit(user);
  } finally {
    pursuitRunning = false;
  }
} // 产物 `Q1e`

// ─────────────────────────────────────────────────────────────
// 14. 3 命【不灭美焰】保命
// ─────────────────────────────────────────────────────────────

/**
 * 保命（产物 `J1e`）：每波首次受到致命伤时保留 1 HP，
 * 立即进入【潜心】（不占门控：`chiXinReadyRound` 不写冷却）。
 */
export function tryChiXinEndure(pokemon: any): boolean {
  if (!pokemon.isPlayer() || !chiXinNodeActive(pokemon, CHIXIN_NODE.UNDYING)) return false;
  const data = pokemon.customPokemonData;
  if (!data) return false;
  const wave = globalScene.currentBattle?.waveIndex ?? -1;
  if (data.chiXinEndureWave === wave) return false;
  data.chiXinEndureWave = wave;
  data.chiXinGuardTurn = currentRound();
  data.chiXinStacks = clampChiXin(ENTER_THRESHOLD, chiXinMaxFor(pokemon));
  if (!inChiXin(pokemon)) {
    applyP5XEffect(pokemon, CHIXIN_WINDOW_TAG, { rounds: WINDOW_ROUNDS });
    grantChiXinStatStage(pokemon);
    globalScene.queueMessage(`${pokemon.name} 撑住了致命一击，并进入了【潜心】！`);
  }
  debugLog("battle", `[潜心] ${pokemon.name} 3 命保命触发，立即进入【潜心】（不占门控）`);
  refreshInfo(pokemon);
  return true;
} // 产物 `J1e`

/** 是否处于保命保护回合（免疫当回合后续伤害） */
export function isChiXinGuarded(pokemon: any): boolean {
  const data = pokemon.customPokemonData;
  if (!data || data.chiXinGuardTurn === undefined || data.chiXinGuardTurn < 0) return false;
  return data.chiXinEndureWave === currentWave() && data.chiXinGuardTurn === currentRound();
} // 产物 `j1e`

// ─────────────────────────────────────────────────────────────
// 15. 注册入口
// ─────────────────────────────────────────────────────────────

/** 为 4 个归属物种注册本命座（全部走公共底座 `registerConstellation`） */
export function registerChiXinSystem(): void {
  for (const speciesId of CHIXIN_SPECIES) {
    registerConstellation(speciesId, CHIXIN_CODEX, CHIXIN_CONSTELLATION_PAYLOAD);
  }
}

/** 挂载窗口过期回调（产物：`Nw(_g, cb)`） */
export function registerChiXinWindowExpireHandler(): void {
  registerP5XEffectExpireHandler(CHIXIN_WINDOW_TAG, onChiXinWindowExpire);
}

// ─────────────────────────────────────────────────────────────
// 需要未接入的物种枚举（占位；接入锚点后改由 `#enums/species-id` 提供）
// ─────────────────────────────────────────────────────────────
declare const SpeciesId: any; // 产物 `e`

// ─────────────────────────────────────────────────────────────
// TODO(接入锚点 90df65097b6d)：本文件依赖清单
// ─────────────────────────────────────────────────────────────
// TODO(接入锚点): globalScene / gameData → #app/global-scene
// TODO(接入锚点): PokemonType / StatusEffect / MoveTarget / Stat / SpeciesId → #enums/*
// TODO(接入锚点): StatStageChangePhase → #phases/stat-stage-change-phase
// TODO(接入锚点): hasP5XEffect / applyP5XEffect / registerP5XEffectExpireHandler → P5X 系统（A3-09）
// TODO(接入锚点): getRootSpeciesId / getStatStage / getEffectiveStat / updateInfo 为 Pokemon 实例方法
// TODO(接入锚点): 把 registerChiXinSystem / registerChiXinWindowExpireHandler 挂到系统初始化点，
//                 并把 injectChiXinTypeMultiplier 接到上游 `typeMultiplierImpl` 注入点
// TODO(接入锚点): 3 命【不灭美焰】的「免疫当回合后续伤害」需在上游伤害管线接入 isChiXinGuarded
// TODO(接入锚点): applyChiXinOnHit / chiXinFirePowerMultiplier / chiXinTargetedMoveMultiplier /
//                 chiXinAlwaysCrit / recordChiXinMoveContext 需挂到上游招式命中/伤害计算钩子
// TODO(A4-验证): `applyChiXinOnHit` 的「燃烧供层每轮每只 +1、至多 +2」与「弱点每动作至多 +4」双重门控
// TODO(A4-验证): `tryEnterChiXin` 的「同一波内冷却轮」判断（`chiXinReadyWave/Round`）
// TODO(A4-验证): 3 命保命后「不占门控」—— `tryChiXinEndure` 未写 `chiXinReadyRound` 的副作用
// TODO(A4-验证): 5 命追击 2 段的 `pursuitRunning` 重入门控
// TODO(语义待确认): 4 命走通用命座（`艳火不休`），未包含在 `exclusiveNodes` 中，与产物一致
