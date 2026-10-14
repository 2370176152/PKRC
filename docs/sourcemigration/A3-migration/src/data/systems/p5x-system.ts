/**
 * P5X 战斗（P5X）—— 自研系统迁移
 * ---------------------------------------------------------------------------
 * 来源：game/server/dist/assets/loading-scene-By2k7Qfx.js（.orig 产物）
 *       @849831（效果核心）/ @1575871（状态图标）/ @2075599（规则）/ @4449711（IV）
 * 逆向方式：`l(短名,"原函数名")` 反查 + 常量赋值精确定位（见 A3-迁移规范 §3）
 * 锚点树：90df65097b6df76f713e6bd108afa84499e8b993
 *
 * 定位：P5X（Persona 5 X 联动）战斗模式 = 「4 打 6 + 第 5 位解明不上场」。
 *       核心是一套**通用回合效果框架**（`p5xEffects`）：
 *         · 效果以 key 挂在 `pokemon.p5xEffects`，带 `rounds`（轮）/ `turns`（回合）双计时；
 *         · 过期经注册表 `Lw` 回调（`registerP5XEffectExpireHandler`）；
 *         · 每轮由 `settleP5XRoundEffects` 统一推进（**幂等**：同一 `battle.turn` 只结算一次）；
 *         · 另含 `vuln:` / `resist:` 前缀的**承伤倍率**效果与**状态图标注册表**。
 *       解明 / 天赋 / 命座各系统均通过本框架挂效果（`kn` / `Nw` / `E0`）。
 *
 * 产物符号对照（去混淆映射，务必逐条保留）：
 *   Lw   → P5X_EFFECT_EXPIRE_HANDLERS      （过期回调注册表 Map）
 *   Nw   → registerP5XEffectExpireHandler
 *   uE   → hasP5XEffect
 *   kn   → applyP5XEffect
 *   uw   → clearP5XEffect
 *   kIe  → expireP5XEffect
 *   Cae  → tickEffects                      （私有：按字段递减 + 汇总过期）
 *   ZIe  → tickP5XEffectsByRound
 *   hae  → tickP5XEffectsByTurn
 *   cw   → settleP5XRoundEffects
 *   Yte/vte → settleP5XRoundEffects 的幂等游标
 *   wte  → P5X_VULN_PREFIX ("vuln:")
 *   om   → P5X_RESIST_PREFIX ("resist:")
 *   XIe  → getIncomingDamageMultiplier
 *   $Ie  → resistId
 *   ko   → formatP5XEffectRemaining
 *   zae  → p5xStatusIconDescription
 *   $te  → P5X_STATUS_ICON_REGISTRY
 *   qae  → findP5XStatusIcon
 *   eEe  → P5X_STATUS_PROVIDERS
 *   E0   → registerP5XStatusProvider
 *   tEe  → getP5XCustomStatusIndicators
 *   nN   → isP5XRestrictedTierSpecies
 *   GB   → isP5XFieldable
 *   Fde  → isP5XConsumableHeldItem
 *   yde  → getConsumableClasses
 *   c0   → p5xTryUseConsumableThisWave
 *   Kde  → markP5XConsumableUsedThisWave
 *   Wde  → resetP5XConsumableUseThisWave
 *   Yoe  → getUsedConsumableIds
 *   aae  → applyP5XIvs
 *   uHe  → P5X_DEFAULT_IV                 (=15)
 *   ffe/fl/aN/Bfe/IF/PRe → 回合顺序条（UI 层，见 §6）
 */
import { hasJiemingConstellation } from "./jieming-system";

// ─────────────────────────────────────────────────────────────
// 0. 依赖（上游 API，待接入锚点源码时改为真实 import）
// ─────────────────────────────────────────────────────────────
declare const globalScene: any; // 产物 `E`
declare const debugLog: (type: string, ...args: any[]) => void; // 产物 `z`

// ─────────────────────────────────────────────────────────────
// 1. 核心效果框架（产物 `Lw` / `Nw` / `uE` / `kn` / `uw` / `kIe` / `Cae`）
// ─────────────────────────────────────────────────────────────

/**
 * 单条 P5X 效果（产物 `pokemon.p5xEffects[key]` 的值）。
 * `rounds` = 剩余轮数，`turns` = 剩余回合数；两者任一 > 0 则效果保留。
 */
export interface P5XEffect {
  /** 剩余轮数（可选） */
  rounds?: number;
  /** 剩余回合数（可选） */
  turns?: number;
  /** 应用时的可选附加参数（产物 `kn` 的第三参） */
  [key: string]: unknown;
}

/** 应用效果的选项（产物 `kn` 的第三参） */
export interface ApplyP5XEffectOptions {
  /** 目标轮数（取较大值刷新） */
  rounds?: number;
  /** 目标回合数（取较大值刷新） */
  turns?: number;
  /** 过期回调（同时写入全局注册表） */
  onExpire?: (pokemon: any, info: { byRound: boolean }) => void;
  /** 其他透传字段 */
  [key: string]: unknown;
}

/** 过期回调签名 */
export type P5XEffectExpireHandler = (pokemon: any, info: { byRound: boolean }) => void;

/** 过期回调注册表（产物 `Lw`） */
const P5X_EFFECT_EXPIRE_HANDLERS = new Map<string, P5XEffectExpireHandler>();

/** 产物 `Nw` — 注册某效果 key 的过期回调 */
export function registerP5XEffectExpireHandler(key: string, handler: P5XEffectExpireHandler): void {
  P5X_EFFECT_EXPIRE_HANDLERS.set(key, handler);
}

/** 产物 `uE` — 是否持有某效果 */
export function hasP5XEffect(pokemon: any, key: string): boolean {
  return !!pokemon?.p5xEffects?.[key];
}

/** 产物 `kn` — 应用/刷新效果（`rounds`/`turns` 取较大值；可顺带注册过期回调） */
export function applyP5XEffect(pokemon: any, key: string, options: ApplyP5XEffectOptions): void {
  if (!pokemon) return;
  if (!pokemon.p5xEffects) pokemon.p5xEffects = {};
  const existing = pokemon.p5xEffects[key];
  if (existing) {
    if (options.rounds !== undefined) existing.rounds = Math.max(existing.rounds ?? 0, options.rounds);
    if (options.turns !== undefined) existing.turns = Math.max(existing.turns ?? 0, options.turns);
  } else {
    pokemon.p5xEffects[key] = { rounds: options.rounds, turns: options.turns };
  }
  if (options.onExpire) P5X_EFFECT_EXPIRE_HANDLERS.set(key, options.onExpire);
  pokemon.updateInfo();
  globalScene?.events?.emit?.("p5xEffectApplied", pokemon, key, pokemon.p5xEffects[key]);
}

/** 产物 `uw` — 立即清除效果（**不触发**过期回调） */
export function clearP5XEffect(pokemon: any, key: string): void {
  if (pokemon?.p5xEffects?.[key]) {
    delete pokemon.p5xEffects[key];
    pokemon.updateInfo();
  }
}

/** 产物 `kIe` — 效果过期（清除 + 触发回调） */
export function expireP5XEffect(pokemon: any, key: string, byRound: boolean): void {
  if (pokemon?.p5xEffects?.[key]) {
    delete pokemon.p5xEffects[key];
    P5X_EFFECT_EXPIRE_HANDLERS.get(key)?.(pokemon, { byRound });
  }
}

/** 产物 `Cae` 「tickEffects」— 按字段递减并汇总过期（私有） */
function tickEffects(pokemon: any, field: "rounds" | "turns", byRound: boolean): void {
  const effects = pokemon?.p5xEffects;
  if (!effects) return;
  const expired: string[] = [];
  for (const [key, effect] of Object.entries<P5XEffect>(effects)) {
    if (effect[field] === undefined) continue;
    effect[field] = Math.max(0, (effect[field] as number) - 1);
    if (!((effect.rounds ?? 0) > 0) && !((effect.turns ?? 0) > 0)) expired.push(key);
  }
  if (expired.length) {
    for (const key of expired) expireP5XEffect(pokemon, key, byRound);
    if (pokemon?.getBattleInfo()) pokemon.updateInfo();
  }
}

/** 产物 `ZIe` — 按**轮**推进效果 */
export function tickP5XEffectsByRound(pokemon: any): void {
  tickEffects(pokemon, "rounds", true);
}

/** 产物 `hae` — 按**回合**推进效果 */
export function tickP5XEffectsByTurn(pokemon: any): void {
  tickEffects(pokemon, "turns", false);
}

/** `settleP5XRoundEffects` 的幂等游标（产物 `Yte` / `vte`） */
let settleBattleRef: any = null;
let settleBattleTurn = -1;

/** 产物 `cw` — 每轮结算全场 P5X 效果（同一 `battle` + `turn` 只结算一次） */
export function settleP5XRoundEffects(): void {
  const battle = globalScene.currentBattle;
  if (!battle) return;
  if (settleBattleRef === battle && settleBattleTurn === battle.turn) return;
  settleBattleRef = battle;
  settleBattleTurn = battle.turn;
  for (const pokemon of globalScene.getField()) {
    if (pokemon) tickP5XEffectsByRound(pokemon);
  }
}

// ─────────────────────────────────────────────────────────────
// 2. 承伤倍率（产物 `wte` / `om` / `XIe` / `$Ie`）
// ─────────────────────────────────────────────────────────────

/** 「易伤」效果 key 前缀（产物 `wte`，后缀为百分比数值） */
export const P5X_VULN_PREFIX = "vuln:";
/** 「减伤」效果 key 前缀（产物 `om`，后缀为百分比数值） */
export const P5X_RESIST_PREFIX = "resist:";

/** 产物 `XIe` — 承伤倍率（累乘所有 `vuln:` / `resist:` 效果） */
export function getIncomingDamageMultiplier(pokemon: any): number {
  const effects = pokemon?.p5xEffects;
  if (!effects) return 1;
  let multiplier = 1;
  for (const key of Object.keys(effects)) {
    if (key.startsWith(P5X_VULN_PREFIX)) {
      multiplier *= 1 + (Number.parseFloat(key.slice(P5X_VULN_PREFIX.length)) || 0);
    } else if (key.startsWith(P5X_RESIST_PREFIX)) {
      multiplier *= 1 - (Number.parseFloat(key.slice(P5X_RESIST_PREFIX.length)) || 0);
    }
  }
  return multiplier;
}

/** 产物 `$Ie` — 构造「减伤」效果 key */
export function resistId(ratio: number): string {
  return `${P5X_RESIST_PREFIX}${ratio}`;
}

// ─────────────────────────────────────────────────────────────
// 3. 状态图标（产物 `ko` / `zae` / `$te` / `qae` / `E0` / `tEe`）
// ─────────────────────────────────────────────────────────────

/** 产物 `ko` — 格式化剩余时长（「剩余 N 回合」「剩余 N 轮」） */
export function formatP5XEffectRemaining(effect: P5XEffect | undefined): string {
  if (!effect) return "";
  const parts: string[] = [];
  if (effect.turns) parts.push(`剩余 ${effect.turns} 回合`);
  if (effect.rounds) parts.push(`剩余 ${effect.rounds} 轮`);
  return parts.join("、");
}

/** 状态图标定义（产物 `$te` 的条目形态） */
export interface P5XStatusIcon {
  /** 图标纹理名 */
  texture: string;
  /** 标题 */
  title: string;
  /** 描述（字符串或按效果动态生成） */
  description: string | ((effect: P5XEffect) => string);
  /** 是否显示宝可梦小图标 */
  pokemonIcon?: boolean;
}

/** 产物 `zae` — 取图标描述（支持函数式描述） */
export function p5xStatusIconDescription(icon: P5XStatusIcon, effect: P5XEffect): string {
  return typeof icon.description === "function" ? icon.description(effect) : icon.description;
}

/** 产物 `$te` — P5X 状态图标注册表（中文串逐字保留） */
export const P5X_STATUS_ICON_REGISTRY: Readonly<Record<string, P5XStatusIcon>> = {
  "shock:electrified": {
    texture: "p5x_shock",
    title: "感电",
    description: (effect) => {
      const remaining = formatP5XEffectRemaining(effect);
      return `受电属性伤害×1.3；被击中要害时要害倍率+1.5。${remaining ? `\n${remaining}。` : ""}`;
    },
  },
  "shock:spatk": {
    texture: "p5x_spatk_up",
    title: "特攻提升 +30%",
    description: (effect) => {
      const remaining = formatP5XEffectRemaining(effect);
      return remaining ? `特攻 +30%，${remaining}。` : "特攻 +30%。";
    },
  },
  "shock:spatk-echo": {
    texture: "p5x_spatk_up",
    title: "特攻提升 +30%",
    description: (effect) => {
      const remaining = formatP5XEffectRemaining(effect);
      return remaining ? `特攻 +30%，${remaining}。` : "特攻 +30%。";
    },
  },
  "nian-li:overflow": {
    texture: "p5x_atk_up",
    title: "念力外溢：双攻 +20%",
    description: (effect) => {
      const remaining = formatP5XEffectRemaining(effect);
      return `双攻×1.2（获得[念力]时刷新）。${remaining ? `\n${remaining}。` : ""}`;
    },
  },
  "chiXin:window": {
    texture: "p5x_buffs",
    pokemonIcon: true,
    title: "[潜心] 窗口",
    description: (effect) => {
      const remaining = formatP5XEffectRemaining(effect);
      return `全队火属性伤害×1.3，自身物攻/特攻+1阶。${remaining ? `\n${remaining}。` : ""}`;
    },
  },
  "meloetta:song": {
    texture: "p5x_atk_up",
    title: "音律：双攻提升",
    description: (effect) => {
      const remaining = formatP5XEffectRemaining(effect);
      return `双攻加算「美洛耶塔对应属性×10%」。${remaining ? `\n${remaining}。` : ""}`;
    },
  },
  "meloetta:dance": {
    texture: "p5x_buffs",
    title: "悦动：全属性强化",
    description: (effect) => {
      const remaining = formatP5XEffectRemaining(effect);
      return `全属性提升（8%+消耗节拍数×4%）。${remaining ? `\n${remaining}。` : ""}`;
    },
  },
  "meloetta:defdown:": {
    texture: "p5x_def_down",
    title: "旋律：双防下降",
    description: "双防下降（每4个[节拍]降10%）。",
  },
  "mew:awareness": {
    texture: "p5x_crit_up",
    title: "察觉：要害强化",
    description: (effect) => {
      const remaining = formatP5XEffectRemaining(effect);
      return `全队要害伤害系数+0.5（1.5→2.0）。${remaining ? `\n${remaining}。` : ""}`;
    },
  },
  "mew:insight": {
    texture: "p5x_def_down",
    title: "洞悉：双防下降",
    description: (effect) => {
      const remaining = formatP5XEffectRemaining(effect);
      return `双防-32%、受到的要害伤害系数+0.5。${remaining ? `\n${remaining}。` : ""}`;
    },
  },
  "mew:implant": {
    texture: "p5x_weak_hint",
    title: "植入：弱点追加",
    description: "被植入属性的克制倍率提高一档（1→2、2→4…）。",
  },
  "healer:chant": {
    texture: "constellation_chant",
    title: "圣咏",
    description: "每次出招后额外奶最低血者，并回 5 点 PP。",
  },
  "healer:guard": {
    texture: "constellation_guard",
    title: "守护",
    description: "受到的伤害 −15%。",
  },
  "healer:cleanse": {
    texture: "constellation_cleanse",
    title: "净化余韵",
    description: "已解除 1 个异常，1 回合内受到的伤害 −15%。",
  },
  "eryou-abyss:attack:": {
    texture: "p5x_atk_up",
    title: "深渊·攻击强化",
    description: `物攻 / 特攻面板 ×1.2（6~7 层）、×1.3（8~9 层）、×1.4（10 层），不加成速度。\n本层档位由「层数」决定，整波有效。`,
  },
  "eryou-abyss:defense:": {
    texture: "p5x_def_up",
    title: "深渊·防御强化",
    description: `物防 / 特防 / 血量上限 ×2（7 层）、×3（8~9 层）、×4（10 层）。\n本层档位由「层数」决定，整波有效。`,
  },
  "eryou-abyss:evasion:": {
    texture: "p5x_eva_up",
    title: "深渊·闪避强化",
    description: `闪避能力等级 +1（7 层）、+2（8~9 层）、+3（10 层）。\n命中判定按标准 (3±n)/3 走，整波有效。`,
  },
  "eryou-abyss:crit:": {
    texture: "p5x_crit_up",
    title: "深渊·要害强化",
    description: `要害阶段 +1（7 层，要害率 1/8）、+2（8~9 层，1/2）、+3（10 层，必中要害）。\n整波有效。`,
  },
};

/** 产物 `qae` — 按 key 查图标（含 `xxx:` 前缀族兜底） */
export function findP5XStatusIcon(key: string): P5XStatusIcon | undefined {
  const direct = P5X_STATUS_ICON_REGISTRY[key];
  if (direct) return direct;
  for (const [registryKey, icon] of Object.entries(P5X_STATUS_ICON_REGISTRY)) {
    if (registryKey.endsWith(":") && key.startsWith(registryKey)) return icon;
  }
  return undefined;
}

/** 自定义状态标提供者（产物 `eEe`） */
const P5X_STATUS_PROVIDERS: ((pokemon: any) => any[])[] = [];

/** 产物 `E0` — 注册自定义状态标提供者 */
export function registerP5XStatusProvider(provider: (pokemon: any) => any[]): void {
  P5X_STATUS_PROVIDERS.push(provider);
}

/** 产物 `tEe` — 汇总所有提供者的自定义状态标（异常隔离） */
export function getP5XCustomStatusIndicators(pokemon: any): any[] {
  const out: any[] = [];
  for (const provider of P5X_STATUS_PROVIDERS) {
    try {
      out.push(...provider(pokemon));
    } catch (err) {
      console.error("[P5X 状态标] 自定义提供者失败:", err);
    }
  }
  return out;
}

// ─────────────────────────────────────────────────────────────
// 4. P5X 规则（产物 `nN` / `GB` / `Fde` / `c0` / `Kde` / `Wde` / `Yoe` / `aae`）
// ─────────────────────────────────────────────────────────────

/** 产物 `nN` — 是否「传说/亚传说/幻兽/悖论种」（P5X 禁用上位 Tier） */
export function isP5XRestrictedTierSpecies(species: any): boolean {
  if (!species) return false;
  return !!(species.legendary || species.subLegendary || species.mythical || species.species === "Paradox Pokémon");
}

/**
 * 产物 `GB` — 是否可在 P5X 上场（非 P5X 恒 true）。
 * 注：依赖 `hasJiemingConstellation`（解明角色不上场）→ 引 `jieming-system`。
 */
export function isP5XFieldable(pokemon: any): boolean {
  if (!globalScene.gameMode?.isP5X) return true;
  if (!pokemon) return false;
  return !hasJiemingConstellation(pokemon) && !isP5XRestrictedTierSpecies(pokemon.species);
}

/** 产物 `yde` — 消耗品道具类列表（运行期注入） */
declare function getConsumableClasses(): any[]; // 产物 `yde`

/** 产物 `Fde` — 是否为消耗品持有物 */
export function isP5XConsumableHeldItem(item: any): boolean {
  return getConsumableClasses().some((cls: any) => item instanceof cls);
}

/** 产物 `Yoe` — 读取（并惰性初始化）本场已用药的消耗品 id 列表 */
export function getUsedConsumableIds(pokemon: any): string[] {
  if (!pokemon.battleData) pokemon.resetBattleData();
  return (pokemon.battleData.p5xUsedConsumableIds ??= []);
}

/** 产物 `c0` — 本波尝试使用消耗品（P5X 下每波每种一次，返回是否可用） */
export function p5xTryUseConsumableThisWave(pokemon: any, item: any): boolean {
  if (!globalScene.gameMode?.isP5X || !pokemon) return true;
  const id = item?.type?.id;
  if (!id) return true;
  if (!pokemon.battleData) pokemon.resetBattleData();
  const used = (pokemon.battleData.p5xUsedConsumableIds ??= []);
  if (used.includes(id)) return false;
  used.push(id);
  return true;
}

/** 产物 `Kde` — 标记某消耗品本波已用 */
export function markP5XConsumableUsedThisWave(pokemon: any, item: any): void {
  if (!globalScene.gameMode?.isP5X || !pokemon) return;
  const id = item?.type?.id;
  if (!id) return;
  const used = getUsedConsumableIds(pokemon);
  if (!used.includes(id)) used.push(id);
}

/** 产物 `Wde` — 撤销某消耗品的「本波已用」标记（返回是否有撤销） */
export function resetP5XConsumableUseThisWave(pokemon: any, id: string): boolean {
  if (!globalScene.gameMode?.isP5X || !pokemon || !id) return false;
  const used = getUsedConsumableIds(pokemon);
  const index = used.indexOf(id);
  if (index === -1) return false;
  used.splice(index, 1);
  return true;
}

/** 产物 `uHe` — P5X 默认个体值（=15） */
export const P5X_DEFAULT_IV = 15;

/** 产物 `aae` — P5X 模式下强制个体值全 15（非 P5X 原样返回） */
export function applyP5XIvs(ivs: number[]): number[] {
  return globalScene?.gameMode?.isP5X ? new Array(6).fill(P5X_DEFAULT_IV) : ivs;
}

// ─────────────────────────────────────────────────────────────
// 5. 上场 / 换人 / 持有物 守卫（产物内联于 SwitchSummonPhase / SummonPhase / Modifier）
// ---------------------------------------------------------------------------
// 产物把 P5X 守卫内联在上游阶段与 Modifier 校验里（均以 `GB` 判定）。
// 集中登记，供各调用点在「接入锚点」阶段引用。
// ─────────────────────────────────────────────────────────────

/** 产物 `SummonPhase.preSummon` 守卫 — 返回 `true` 表示「跳过召唤（该位置留空）」 */
export function p5xPreSummonGuard(pokemon: any, isPlayer: boolean): boolean {
  if (isPlayer && pokemon && !isP5XFieldable(pokemon)) {
    console.warn(`[P5X] ${pokemon.name} 不允许上场，跳过召唤（该位置留空）`);
    return true;
  }
  return false;
}

/** 产物 `SwitchSummonPhase` 守卫 — 返回 `true` 表示「中止本次换人」 */
export function p5xSwitchGuard(pokemon: any, isPlayer: boolean): boolean {
  if (isPlayer && pokemon && !isP5XFieldable(pokemon)) {
    console.error(`[P5X] ${pokemon.name} 不允许上场，已中止本次换人`);
    return true;
  }
  return false;
}

/** 产物 `SummonPhase` 后备为空（P5X 专属路径）—— 输出警告并结束 */
export function p5xWarnNoReserve(): void {
  console.warn("[P5X] 没有可上场的替补，该位置留空");
}

/** 产物 `Modifier` 持有物上限校验（P5X 每只限 1 个） */
export function p5xHeldItemLimitMessage(pokemon: any): string {
  return `${pokemon.name}已经携带了持有物（P5X 只能携带 1 个）`;
}

/** 产物 `[P5X 状态标]` 图标图集回退日志（UI 层渲染） */
export const P5X_STATUS_ICON_LOGS = {
  atlasMissing: (atlas: string) => `[P5X 状态标] 找不到图标图集 ${atlas}，退回纹理图标`,
  frameMissing: (atlas: string, frame: string) => `[P5X 状态标] 图集 ${atlas} 里没有帧 ${frame}`,
} as const;

/** 产物菜单项（P5X 体验局 = 经典流程） */
export const P5X_TRIAL_MODE_LABEL = "P5X 体验局";
/** 产物 P5X 体验局开始确认文案 */
export const P5X_TRIAL_START_CONFIRM = "确认：开始 P5X 体验局";

// ─────────────────────────────────────────────────────────────
// 6. 回合顺序条（产物 `ffe` / `fl` / `aN` / `Bfe` / `IF` / `PRe`）—— UI 层
// ---------------------------------------------------------------------------
// 产物为 P5X 的「回合顺序条」HUD（显示出手顺序 + 焦点 + 详情）。
// 属 UI 层，归前端 UI 任务；本文件仅登记符号以便锚点闭合（见 A3-09 记录 §归属台账）。
// ─────────────────────────────────────────────────────────────

/** 产物 `ffe` — 取回合顺序条状态（UI 层） */
export const getP5XHudOrderState = Symbol.for("getP5XHudOrderState");
/** 产物 `fl` — 设置回合顺序焦点（UI 层） */
export const setP5XTurnOrderFocus = Symbol.for("setP5XTurnOrderFocus");
/** 产物 `aN` — 隐藏回合顺序详情（UI 层） */
export const hideP5XTurnOrderDetail = Symbol.for("hideP5XTurnOrderDetail");
/** 产物 `Bfe` — 确保回合顺序条存在（UI 层） */
export const ensureP5XTurnOrderBar = Symbol.for("ensureP5XTurnOrderBar");
/** 产物 `IF` — 隐藏回合顺序条（UI 层） */
export const hideP5XTurnOrderBar = Symbol.for("hideP5XTurnOrderBar");
/** 产物 `PRe` — 更新回合顺序条（UI 层） */
export const updateP5XTurnOrderBar = Symbol.for("updateP5XTurnOrderBar");

// ─────────────────────────────────────────────────────────────
// TODO(接入锚点 90df65097b6d)：本文件依赖清单
// ─────────────────────────────────────────────────────────────
// TODO(接入锚点): globalScene → #app/global-scene
// TODO(接入锚点): `pokemon.p5xEffects` / `pokemon.battleData` → #app/field/pokemon
//                 （`p5xEffects` / `p5xUsedConsumableIds` 为新增字段，A4-03 须核对存档）
// TODO(接入锚点): `getConsumableClasses` / `resetBattleData` / `getBattleInfo` / `updateInfo`
//                 → Pokemon 实例方法
// TODO(接入锚点): 上场守卫落点 → #phases/summon-phase、#phases/switch-summon-phase
// TODO(接入锚点): 持有物上限落点 → #modifier/modifier-type 的候选校验
// TODO(接入锚点): 回合顺序条 6 个函数 → UI handler（前端任务）
// TODO(接入锚点): `settleP5XRoundEffects` 挂到回合推进钩子；`tickP5XEffectsByTurn` 挂到招式结算
// TODO(A4-验证): `settleP5XRoundEffects` 的幂等游标（`battle` + `turn`）
// TODO(A4-验证): `applyP5XEffect` 的 `rounds`/`turns` 「取较大值」刷新语义
// TODO(A4-验证): `vuln:` / `resist:` 前缀解析（`parseFloat` 失败时按 0）
// TODO(A4-验证): `p5xUsedConsumableIds` 是否随存档持久化（A4-03）
