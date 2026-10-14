/**
 * 搜打撤（PT_SOUDACHE）—— 自研系统迁移
 * ---------------------------------------------------------------------------
 * 来源：game/server/dist/assets/loading-scene-By2k7Qfx.js（.orig 产物）
 *       @2417580（StartPhase）/ @3391062（ShopPhase）/ @2556226（RetreatPhase）
 *       @2520984（isPt250Boss）/ @3887736（权重）/ @1564117（ptPerLevel）
 *       game/server/dist/assets/index-D3KKGO7Y.js（存档/覆盖项，见 §6）
 * 逆向方式：`l(短名,"原函数名")` 反查 + 常量赋值精确定位（见 A3-迁移规范 §3）
 * 锚点树：90df65097b6df76f713e6bd108afa84499e8b993
 *
 * 定位：**涉及存档的最高风险系统**（A3-08）。三层：
 *       ① 持久数据 `gameData.ptSoudacheData`（跨局：库存 / 觉醒石 / 命座 / 每日先手）；
 *       ② 运行态 `globalScene.ptSoudache*`（本局：已赚 PT / 待付 / 待保存 / 撤退层）；
 *       ③ 单局存档 `SessionSaveData` 的 PT 扩展字段（撤离时写入历史）。
 *       三个阶段：`PtSoudacheStartPhase`（开场）→ `PtSoudacheShopPhase`（PT 商店）
 *       → `PtSoudacheRetreatPhase`（保存次数 + 撤离结算）。
 *
 * ⚠️ **存档字段清单**（A4-03 前置）单列于
 *    `docs/sourcemigration/A3-08-存档字段清单.md`；本文件 §2 为实现侧镜像。
 *
 * 产物符号对照（去混淆映射，务必逐条保留）：
 *   l3   → PtSoudacheStartPhase
 *   pV   → PtSoudacheShopPhase
 *   k3   → PtSoudacheRetreatPhase
 *   WM   → isPt250Boss
 *   MN   → reducedWeightInPtSoudache
 *   Tle  → ptPerLevel
 *   xw   → applyPtMultiplier
 *   pSe  → inPtTalentMode
 *   DS   → getActiveChallenge            （区间挑战当前项）
 *   rg   → playerPartyRootSpecies
 *   ore  → settlePendingChallengeReward  （区间挑战兜底结算）
 *   vl   → getDynamicBalanceManager
 *   $t   → GameModes                     （PT_SOUDACHE=10）
 *   X    → ModifierType（商店条目 type）
 *   K    → ModifierTier（LUXURY/MASTER/ROGUE/ULTRA/GREAT/COMMON）
 *   V    → UiMode
 *   E    → globalScene
 *   z    → debugLog
 *   M    → i18next
 *   j1   → applyGainMultiplier           （公共底座）
 *   J1   → partyConstellationGainMultiplier（公共底座）
 *   Pa   → TitlePhase                    （撤离后回标题）
 *   qn/mR/OL/RL/oL → Pokemon/Modifier/Arena/Trainer/Challenge 的存档序列化器
 */
import { GameModes } from "#enums/game-modes"; // 产物 `$t`
import { applyGainMultiplier, partyConstellationGainMultiplier } from "./constellation-framework";

// ─────────────────────────────────────────────────────────────
// 0. 依赖（上游 API，待接入锚点源码时改为真实 import）
// ─────────────────────────────────────────────────────────────
declare const globalScene: any; // 产物 `E`
declare const debugLog: (type: string, ...args: any[]) => void; // 产物 `z`
declare const i18next: any; // 产物 `M`
declare const UiMode: any; // 产物 `V`
declare const ModifierType: any; // 产物 `X`
declare const ModifierTier: any; // 产物 `K`
declare const Phase: any; // 产物 `ii`（Phase 基类）
declare const TitlePhase: any; // 产物 `Pa`
declare const getActiveChallenge: () => any; // 产物 `DS`
declare const playerPartyRootSpecies: () => number[]; // 产物 `rg`
declare const settlePendingChallengeReward: () => number; // 产物 `ore`
declare const getDynamicBalanceManager: () => any; // 产物 `vl`
declare const getTalentManager: () => any; // 产物 `Ci`
declare const getStarterDataList: () => any[]; // 产物 `ms`
/** 产物 `qn`/`mR`/`OL`/`RL`/`oL` — 存档序列化器 */
declare const serializePokemon: (pokemon: any) => any;
declare const serializeModifier: (modifier: any, forPlayer?: boolean) => any;
declare const serializeArena: (arena: any) => any;
declare const serializeTrainer: (trainer: any) => any;
declare const serializeChallenge: (challenge: any) => any;

// ─────────────────────────────────────────────────────────────
// 1. 常量（还原自产物）
// ─────────────────────────────────────────────────────────────

/** 每级 PT 收益（产物 `Tle`，按波次分档） */
export function ptPerLevel(waveIndex: number): number {
  if (waveIndex < 30) return 100;
  if (waveIndex < 40) return 150;
  if (waveIndex < 50) return 250;
  if (waveIndex < 60) return 400;
  if (waveIndex < 70) return 600;
  if (waveIndex < 80) return 900;
  if (waveIndex < 90) return 1400;
  return 2000;
}

/** 各「区间」保存单只宝可梦次数的价格（产物 `k3.askSaveUsage` 内联表，$a$ 为区间 index） */
export const PT_SAVE_PRICE_BY_INTERVAL: readonly number[] = [
  100, 200, 400, 800, 1500, 4000, 9000, 18000, 30000,
];

/** 被动服务价格（全队本局可用，产物内联 `T=15e3`） */
export const PT_PASSIVE_SERVICE_PRICE = 15000;
/** 全局被动解锁价格（单只，全模式可用，产物内联 `D=3e4`） */
export const PT_GLOBAL_PASSIVE_PRICE = 30000;
/** 保险锁道具 id（携带时免费保存，产物字符串 `"BAOXIAN"`） */
export const PT_INSURANCE_ITEM_ID = "BAOXIAN";
/** 护符金币道具 id（撤离 PT +20%/个，产物字符串 `"AMULET_COIN"`） */
export const PT_AMULET_COIN_ITEM_ID = "AMULET_COIN";
/** 区间挑战「增幅」道具花费（产物内联 `ptCost:5e3`） */
export const PT_CHALLENGE_BOOST_COST = 5000;

/** PT 商店条目（产物 `pV.showShop` 的 `O` 表，逐字保留名称与价格） */
export const PT_SHOP_CATALOG: readonly {
  type: string;
  tier: string;
  price: number;
  name: string;
  maxStack: number;
}[] = [
  { type: "AMULET_COIN", tier: "LUXURY", price: 6000, name: "护符金币", maxStack: 1 },
  { type: "GOLDEN_PUNCH", tier: "LUXURY", price: 6000, name: "黄金拳头", maxStack: 1 },
  { type: "BAOXIAN", tier: "LUXURY", price: 3000, name: "保险锁", maxStack: 1 },
  { type: "SHINY_CHARM", tier: "MASTER", price: 3000, name: "闪光护符", maxStack: 1 },
  { type: "CATCHING_CHARM", tier: "MASTER", price: 3000, name: "捕捉护符", maxStack: 1 },
  { type: "HEALING_CHARM", tier: "MASTER", price: 3000, name: "治疗护符", maxStack: 1 },
  { type: "CANDY_JAR", tier: "MASTER", price: 3000, name: "糖果罐", maxStack: 1 },
  { type: "BERRY_POUCH", tier: "MASTER", price: 3000, name: "树果袋", maxStack: 1 },
  { type: "MASTER_BALL", tier: "MASTER", price: 3000, name: "大师球", maxStack: 99 },
  { type: "EVIOLITE", tier: "MASTER", price: 3000, name: "进化辉石", maxStack: 1 },
  { type: "EXP_CHARM", tier: "ROGUE", price: 1500, name: "经验护符", maxStack: 1 },
  { type: "EXP_SHARE", tier: "ROGUE", price: 1500, name: "学习装置", maxStack: 1 },
  { type: "WIDE_LENS", tier: "ROGUE", price: 1500, name: "广角镜", maxStack: 4 },
  { type: "MEGA_BRACELET", tier: "ROGUE", price: 1500, name: "Mega手环", maxStack: 1 },
  { type: "DYNAMAX_BAND", tier: "ROGUE", price: 1500, name: "极巨腕带", maxStack: 1 },
  { type: "LEFTOVERS", tier: "ROGUE", price: 1500, name: "吃剩的东西", maxStack: 3 },
  { type: "SHELL_BELL", tier: "ROGUE", price: 1500, name: "贝壳之铃", maxStack: 3 },
  { type: "SCOPE_LENS", tier: "ROGUE", price: 1500, name: "焦点镜", maxStack: 3 },
  { type: "QUICK_CLAW", tier: "ROGUE", price: 1500, name: "先制之爪", maxStack: 3 },
  { type: "SOUL_DEW", tier: "ROGUE", price: 1500, name: "心之水滴", maxStack: 10 },
  { type: "GRIP_CLAW", tier: "ULTRA", price: 1500, name: "紧缠钩爪", maxStack: 5 },
  { type: "ULTRA_BALL", tier: "ULTRA", price: 800, name: "高级球", maxStack: 99 },
  { type: "ROGUE_BALL", tier: "ULTRA", price: 800, name: "肉鸽球", maxStack: 99 },
  { type: "GREAT_BALL", tier: "GREAT", price: 400, name: "超级球", maxStack: 99 },
  { type: "SOOTHE_BELL", tier: "GREAT", price: 400, name: "安抚之铃", maxStack: 10 },
  { type: "POKEBALL", tier: "COMMON", price: 200, name: "精灵球", maxStack: 99 },
];

/** 商店分档标题（产物 `pV.showShop` 的 switch，逐字保留） */
export const PT_TIER_LABEL: Readonly<Record<string, string>> = {
  LUXURY: "论外级别",
  MASTER: "大师球级",
  ROGUE: "肉鸽球级",
  ULTRA: "高级球级",
  GREAT: "超级球级",
  COMMON: "普通球级",
};

// ─────────────────────────────────────────────────────────────
// 2. 存档数据结构（**A4-03 前置**；清单见 A3-08-存档字段清单.md）
// ─────────────────────────────────────────────────────────────

/**
 * 持久数据（产物 `gameData.ptSoudacheData`，跨局保留）。
 * 初始化：产物 `initPtSoudacheData()`。
 */
export interface PtSoudacheData {
  /** 各物种持有次数（-1 = 无限次）；键为 rootSpeciesId */
  pokemonInventory: Record<number, number>;
  /** 已解锁蛋招式：`speciesId` → 招式 id 列表 */
  eggMovesUnlocked: Record<number, string[]>;
  /** 已解锁被动：`speciesId` → passive id */
  passivesUnlocked: Record<number, string>;
  /** PT 余额（持久） */
  ptBalance: number;
  /** 借用的宝可梦 */
  borrowedPokemon: Record<string, unknown>;
  /** 觉醒石数量 */
  juexingStoneCount: number;
  /** 命座等级：`speciesId` → 等级 */
  constellations: Record<number, number>;
  /** 命座选择：`speciesId` → 节点 → 选择值 */
  constellationChoices: Record<number, Record<number, unknown>>;
  /** 命座模式：`speciesId` → 节点 → "exclusive" | "generic" */
  constellationModes: Record<number, Record<number, "exclusive" | "generic">>;
  /** 存档版本（当前 1） */
  version: number;
  /** 每日先手 seed 日期（YYYY-MM-DD） */
  dailyStarterDate: string;
  /** 每日先手 6 只 */
  dailyStarters: number[];
  /** 区间挑战状态（可选） */
  intervalChallenge?: unknown;
}

/** 产物的每日先手候选池（`getDailyStarters` 内联表） */
export const DAILY_STARTER_POOL: readonly number[] = [
  1, 4, 7, 152, 155, 158, 252, 255, 258, 387, 390, 393, 495, 498, 501, 650, 653, 656, 722, 725, 728, 810, 813, 816, 906, 909, 912,
];

/** 产物 `initPtSoudacheData()` — 初始化持久数据（已存在则仅补 daily 字段） */
export function initPtSoudacheData(): PtSoudacheData {
  const inventory: Record<number, number> = {};
  for (const speciesId of playerPartyRootSpecies()) inventory[speciesId] = 0;
  return {
    pokemonInventory: inventory,
    eggMovesUnlocked: {},
    passivesUnlocked: {},
    ptBalance: 0,
    borrowedPokemon: {},
    juexingStoneCount: 0,
    constellations: {},
    constellationChoices: {},
    constellationModes: {},
    version: 1,
    dailyStarterDate: "",
    dailyStarters: [],
    intervalChallenge: undefined,
  };
}

/**
 * 单局存档的 PT 扩展字段（产物 `PtSoudacheRetreatPhase.getRetreatHistoryEntry()`
 * 写入 `SessionSaveData`）。**A4-03 往返校验须覆盖以下字段。**
 */
export interface PtSoudacheSessionSaveFields {
  /** 本局已赚 PT */
  ptSoudacheEarned: number;
  /** 标记「已撤离」 */
  ptSoudacheRetreated: boolean;
  /** 本局起始道具（商店购买结果） */
  ptSoudacheStartingItems: [string, number][];
  /** 已撤退层记录 */
  ptSoudacheRetreatFloors: number[];
  /** 本局被动服务已解锁 */
  ptSoudachePassiveEnabled: boolean;
  /** 死战不退模式 */
  ptSoudacheNoRetreatMode: boolean;
  /** 动态平衡已启用 */
  dynamicBalanceEnabled: boolean;
  /** 天赋系统数据快照（撤离时从 TalentManagerV2 抽取） */
  talentSystemData?: unknown;
}

// ─────────────────────────────────────────────────────────────
// 3. 阶段一：开场（产物 `l3` = PtSoudacheStartPhase）
// ─────────────────────────────────────────────────────────────

/** 产物 `l3` — 搜打撤开场阶段：播放菜单 BGM 并切到「搜打撤开始」界面 */
export class PtSoudacheStartPhase extends Phase {
  start(): void {
    super.start();
    globalScene.playBgm("menu");
    globalScene.ui.setMode(UiMode.PT_SOUDACHE_START);
  }
}

// ─────────────────────────────────────────────────────────────
// 4. 阶段二：PT 商店（产物 `pV` = PtSoudacheShopPhase）
// ─────────────────────────────────────────────────────────────

/** 产物 `pV` — PT 商店阶段：购买起始道具 / 被动服务 / 全局被动 */
export class PtSoudacheShopPhase extends Phase {
  private purchasedItems: Map<string, number>;
  private readonly onComplete: (items: Map<string, number>) => void;
  private readonly selectedSpeciesId: number;

  constructor(onComplete: (items: Map<string, number>) => void, selectedSpeciesId = 0) {
    super();
    this.purchasedItems = new Map();
    this.onComplete = onComplete;
    this.selectedSpeciesId = selectedSpeciesId;
  }

  start(): void {
    super.start();
    const pending = globalScene.ptSoudachePendingStartingItems;
    if (pending) this.purchasedItems = new Map(pending);
    this.showShop();
  }

  /** 展示商店（产物 `pV.showShop`；`cursor` 为恢复的光标位置） */
  showShop(cursor?: number): void {
    const ui = globalScene.ui;
    const pt = globalScene.gameData.pt || 0;
    const spent = globalScene.ptSoudachePendingSpent ?? 0;
    const available = Math.max(0, pt - spent);
    const catalog = PT_SHOP_CATALOG;
    const options: any[] = [];

    options.push({ label: `PT ${pt} / 可用 ${available} / 待付 ${spent}`, handler: () => true, keepOpen: true });

    const passiveEnabled = !!globalScene.ptSoudachePassiveEnabled || !!globalScene.ptSoudachePendingPassiveService;
    const servicePrice = PT_PASSIVE_SERVICE_PRICE;
    options.push({ label: "本局服务", handler: () => true, keepOpen: true });
    if (passiveEnabled) {
      options.push({ label: "  [已购] 被动服务", handler: () => true, keepOpen: true });
    } else {
      options.push({
        label: `  被动服务 ${servicePrice}PT`,
        handler: () => {
          const inner = globalScene.ui;
          inner.setOverlayMode(UiMode.CONFIRM, () => {
            const cur = globalScene.gameData.pt || 0;
            const curSpent = globalScene.ptSoudachePendingSpent ?? 0;
            if (Math.max(0, cur - curSpent) < servicePrice) {
              inner.revertMode().then(() => {
                inner.showText(i18next.t("partyUiHandler:ptInsufficient", { price: servicePrice }), undefined, () => {
                  inner.showText(i18next.t("partyUiHandler:ptSoudacheShopTitle", { pt: cur }), 0);
                }, 1500);
              });
              return true;
            }
            globalScene.ptSoudachePendingSpent = curSpent + servicePrice;
            globalScene.ptSoudachePendingPassiveService = true;
            globalScene.playSound("se/buy");
            inner.revertMode().then(() => {
              inner.showText("成功解锁被动服务！本局所有宝可梦均可使用被动技能。", undefined, () => {
                inner.clearText();
                inner.revertMode().then(() => this.showShop(cursor ?? 2));
              }, 800);
            });
            return true;
          }, () => {
            inner.revertMode();
            return false;
          });
          return true;
        },
        keepOpen: true,
      });
    }

    // 单只全局被动解锁（选中了先手时）
    if (this.selectedSpeciesId > 0) {
      const starter = getStarterDataList()[this.selectedSpeciesId - 1];
      const speciesId = starter?.speciesId ?? this.selectedSpeciesId;
      const starterData = globalScene.gameData.starterData[speciesId];
      const alreadyUnlocked = !!starterData?.passiveAttr;
      const price = PT_GLOBAL_PASSIVE_PRICE;
      if (!alreadyUnlocked) {
        const name = starter?.name || "当前宝可梦";
        if (!passiveEnabled) options.push({ label: "全局被动", handler: () => true, keepOpen: true });
        options.push({
          label: `  ${name} 被动 ${price}PT`,
          handler: () => {
            const inner = globalScene.ui;
            inner.setOverlayMode(UiMode.CONFIRM, () => {
              const cur = globalScene.gameData.pt || 0;
              if (cur < price) {
                inner.revertMode().then(() => {
                  inner.showText(i18next.t("partyUiHandler:ptInsufficient", { price }), undefined, () => {
                    inner.showText(i18next.t("partyUiHandler:ptSoudacheShopTitle", { pt: cur }), 0);
                  }, 1500);
                });
                return true;
              }
              globalScene.gameData.addPt(-price);
              const data = globalScene.gameData.starterData[speciesId];
              if (data) data.passiveAttr |= 3;
              globalScene.gameData.saveSystem();
              globalScene.playSound("se/buy");
              inner.revertMode().then(() => {
                inner.showText(`成功解锁 ${name} 的被动技能（全模式可用）！`, undefined, () => {
                  inner.clearText();
                  this.showShop(cursor ?? 2);
                }, 800);
              });
              return true;
            }, () => {
              inner.revertMode();
              return false;
            });
            return true;
          },
          keepOpen: true,
        });
      }
    }

    let lastTier: string | null = null;
    catalog.forEach((item) => {
      if (item.tier !== lastTier) {
        const label = PT_TIER_LABEL[item.tier] ?? "";
        if (label) options.push({ label, handler: () => true, keepOpen: true });
        lastTier = item.tier;
      }
      const owned = this.purchasedItems.get(item.type) || 0;
      const suffix = owned > 0 ? ` (${owned}/${item.maxStack})` : "";
      const soldOut = owned >= item.maxStack ? " [已售罄]" : "";
      options.push({
        label: `  ${item.name} - ${item.price}PT${suffix}${soldOut}`,
        handler: () => {
          const handler = ui.getHandler();
          const pos = handler?.fullCursor ?? cursor ?? 0;
          return this.handlePurchase(item, owned, pos);
        },
        keepOpen: true,
      });
    });

    options.push({ label: "----------------", handler: () => true, keepOpen: true });
    options.push({
      label: "关闭",
      handler: () => {
        ui.clearText();
        ui.setMode(UiMode.MESSAGE).then(() => {
          this.onComplete(this.purchasedItems);
          this.end();
        });
        return true;
      },
    });

    ui.setOverlayMode(UiMode.OPTION_SELECT, { options, yOffset: 47, maxOptions: 8, startCursor: cursor ?? 0 });
    ui.showText(i18next.t("partyUiHandler:ptSoudacheShopTitle", { pt }), 0);
  }

  /** 购买（产物 `pV.handlePurchase`） */
  handlePurchase(item: { type: string; price: number; name: string; maxStack: number }, owned: number, cursor = 0): boolean {
    const ui = globalScene.ui;
    if (owned >= item.maxStack) {
      ui.showText(`${item.name}已达到最大携带数量！`, undefined, () => {
        ui.showText(i18next.t("partyUiHandler:ptSoudacheShopTitle", { pt: globalScene.gameData.pt || 0 }), 0);
      }, 1500, false);
      return false;
    }
    ui.showText(`确定购买 ${item.name}（${item.price}PT）吗？`, undefined, () => {
      ui.setOverlayMode(
        UiMode.CONFIRM,
        () => {
          const pt = globalScene.gameData.pt || 0;
          const spent = globalScene.ptSoudachePendingSpent ?? 0;
          if (Math.max(0, pt - spent) < item.price) {
            ui.revertMode().then(() => {
              ui.showText(i18next.t("partyUiHandler:ptInsufficient", { price: item.price }), undefined, () => {
                ui.showText(i18next.t("partyUiHandler:ptSoudacheShopTitle", { pt }), 0);
              }, 1500, false);
            });
            return true;
          }
          globalScene.ptSoudachePendingSpent = spent + item.price;
          this.purchasedItems.set(item.type, owned + 1);
          globalScene.ptSoudachePendingStartingItems = new Map(this.purchasedItems);
          globalScene.playSound("se/buy");
          ui.revertMode().then(() => {
            ui.showText(`成功购买 ${item.name}！`, undefined, () => {
              const handler = ui.getHandler();
              const pos = handler?.fullCursor ?? cursor;
              ui.showText("", 0);
              ui.clearText();
              ui.revertModes().then(() => this.showShop(pos));
            }, 800, false);
          });
          return true;
        },
        () => {
          ui.revertMode();
          ui.showText(i18next.t("partyUiHandler:ptSoudacheShopTitle", { pt: globalScene.gameData.pt || 0 }), 0);
          return false;
        },
        null,
        null,
        1,
        750,
      );
    }, true);
    return true;
  }

  /** 单只被动解锁（产物 `pV.handlePassiveUnlock`） */
  handlePassiveUnlock(price: number, cursor = 0): boolean {
    const ui = globalScene.ui;
    const starter = getStarterDataList()[this.selectedSpeciesId - 1];
    const name = starter?.name || "当前宝可梦";
    ui.showText(`确定解锁 ${name} 的被动技能（${price}PT）吗？`, undefined, () => {
      ui.setOverlayMode(UiMode.CONFIRM, () => {
        const pt = globalScene.gameData.pt || 0;
        if (pt < price) {
          ui.revertMode().then(() => {
            ui.showText(i18next.t("partyUiHandler:ptInsufficient", { price }), undefined, () => {
              ui.showText(i18next.t("partyUiHandler:ptSoudacheShopTitle", { pt }), 0);
            }, 1500, false);
          });
          return true;
        }
        globalScene.gameData.addPt(-price);
        globalScene.playSound("se/buy");
        ui.revertMode().then(() => {
          ui.showText(`成功解锁 ${name} 的被动技能！`, undefined, () => {
            const handler = ui.getHandler();
            const pos = handler?.fullCursor ?? cursor;
            ui.showText("", 0);
            ui.clearText();
            ui.revertModes().then(() => this.showShop(pos));
          }, 800, false);
        });
        return true;
      }, () => {
        ui.revertMode();
        ui.showText(i18next.t("partyUiHandler:ptSoudacheShopTitle", { pt: globalScene.gameData.pt || 0 }), 0);
        return false;
      }, null, null, 1, 750);
    }, true);
    return true;
  }
}

// ─────────────────────────────────────────────────────────────
// 5. 阶段三：保存次数 + 撤离（产物 `k3` = PtSoudacheRetreatPhase）
// ─────────────────────────────────────────────────────────────

/** 产物 `k3` — 撤离阶段：先询问是否保存队伍次数，再结算撤离 PT */
export class PtSoudacheRetreatPhase extends Phase {
  start(): void {
    super.start();
    debugLog("pt", "[PtSoudacheRetreat] Phase started");
    debugLog("pt", "[PtSoudacheRetreat] Current wave:", globalScene.currentBattle.waveIndex);
    debugLog("pt", "[PtSoudacheRetreat] isPtSoudache:", globalScene.gameMode.isPtSoudache);
    debugLog("pt", "[PtSoudacheRetreat] hasDynamicBalance:", globalScene.gameMode.hasDynamicBalance);
    if (!globalScene.gameData.ptSoudacheData) {
      console.error("[PT搜打撤] ptSoudacheData未初始化，正在初始化...");
      globalScene.gameData.applyDailyStarters();
    }
    debugLog("pt", "[PtSoudacheRetreat] ptSoudacheData exists:", !!globalScene.gameData.ptSoudacheData);
    debugLog("pt", "[PtSoudacheRetreat] pokemonInventory exists:", !!globalScene.gameData.ptSoudacheData?.pokemonInventory);
    const earned = globalScene.ptSoudacheEarned || 0;
    debugLog("pt", "[PtSoudacheRetreat] Earned PT:", earned);
    this.askSaveUsage(earned);
  }

  /** 询问是否花费 PT 保存队伍中宝可梦的持有次数（产物 `k3.askSaveUsage`） */
  askSaveUsage(earned: number): void {
    debugLog("pt", "[PtSoudacheRetreat] askSaveUsage called, earnedPt:", earned);
    const party = globalScene.getPlayerParty();
    const waveIndex = globalScene.currentBattle.waveIndex;
    const interval = Math.floor((waveIndex - 1) / 30);
    const pricePerMon = PT_SAVE_PRICE_BY_INTERVAL[interval] ?? PT_SAVE_PRICE_BY_INTERVAL[PT_SAVE_PRICE_BY_INTERVAL.length - 1];
    const inventory = globalScene.gameData.ptSoudacheData?.pokemonInventory || {};
    debugLog("pt", "[PtSoudacheRetreat] Party size:", party.length);
    debugLog("pt", "[PtSoudacheRetreat] Wave index:", waveIndex);
    debugLog("pt", "[PtSoudacheRetreat] Interval index:", interval);
    debugLog("pt", "[PtSoudacheRetreat] Price per pokemon:", pricePerMon);
    debugLog("pt", "[PtSoudacheRetreat] Inventory:", inventory);

    const eligible = party.filter((mon: any) => {
      const root = mon.species.getRootSpeciesId();
      if (inventory[root] === -1) return false;
      return !mon.getHeldItems().some((item: any) => item.type.id === PT_INSURANCE_ITEM_ID);
    });
    const insuredCount = party.filter((mon: any) => {
      const root = mon.species.getRootSpeciesId();
      if (inventory[root] === -1) return false;
      return mon.getHeldItems().some((item: any) => item.type.id === PT_INSURANCE_ITEM_ID);
    }).length;
    const cost = eligible.length * pricePerMon;
    const totalToSave = eligible.length + insuredCount;

    if (totalToSave > 0) {
      const prompt =
        cost > 0
          ? `是否花费 ${cost} PT 保存当前队伍的 ${totalToSave} 只宝可梦次数？\n(每只 ${pricePerMon} PT，第${interval + 1}区间 保存花费pt会随着区间增加)${
              insuredCount > 0 ? `\n其中 ${insuredCount} 只携带保险锁的宝可梦免费保存` : ""
            }\n`
          : `是否保存当前队伍的 ${totalToSave} 只宝可梦次数？\n(全部携带保险锁，免费保存)`;
      globalScene.ui.showText(`${prompt}\n保存后下次使用将不消耗次数\n\n【注意】保存次数后要立即撤离，否则保存失败！`, null, () => {
        globalScene.ui.setOverlayMode(UiMode.CONFIRM, () => {
          const freshParty = globalScene.getPlayerParty();
          const inv = globalScene.gameData.ptSoudacheData?.pokemonInventory || {};
          const toSave = freshParty.filter((mon: any) => {
            const root = mon.species.getRootSpeciesId();
            if (inv[root] === -1) return false;
            return !mon.getHeldItems().some((item: any) => item.type.id === PT_INSURANCE_ITEM_ID);
          });
          const totalCost = toSave.length * pricePerMon;
          const pt = globalScene.gameData.pt || 0;
          debugLog("pt", `[PT搜打撤] 确认保存 - 当前队伍: ${freshParty.length}只, 需保存: ${toSave.length}只, 花费: ${totalCost}PT`);
          if (pt < totalCost) {
            globalScene.ui.revertMode().then(() => {
              globalScene.ui.showText(`PT不足！需要 ${totalCost} PT，当前只有 ${pt} PT`, null, () => {
                globalScene.ui.clearText();
                globalScene.ui.setMode(UiMode.MESSAGE).then(() => this.askRetreat(earned, false));
              }, 1500);
            });
            return true;
          }
          globalScene.gameData.addPt(-totalCost);
          if (!globalScene.gameData.ptSoudacheData) {
            console.error("[PT搜打撤] ptSoudacheData未初始化！");
            globalScene.ui.revertMode();
            globalScene.ui.setMode(UiMode.MESSAGE).then(() => this.askRetreat(earned, false));
            return true;
          }
          const savedMap = new Map<number, number>();
          let savedCount = 0;
          for (const mon of freshParty) {
            const root = mon.species.getRootSpeciesId();
            const inv2 = globalScene.gameData.ptSoudacheData.pokemonInventory;
            const cur = inv2[root] ?? 0;
            const insured = mon.getHeldItems().some((item: any) => item.type.id === PT_INSURANCE_ITEM_ID);
            if (cur !== -1) {
              inv2[root] = (inv2[root] || 0) + 1;
              savedCount++;
              if (!insured) savedMap.set(root, 1);
              debugLog("pt", `[PT搜打撤] 保存 ${mon.species.name} 次数${insured ? "（保险锁，免费，彩蛋：结算时还会再增加一次）" : ""}，当前库存: ${inv2[root]}`);
            } else {
              debugLog("pt", `[PT搜打撤] ${mon.species.name} 为无限次数，无需保存`);
            }
          }
          globalScene.ptSoudachePendingSave = { pokemonMap: savedMap, ptCost: totalCost };
          globalScene.gameData.saveSystem();
          globalScene.ui.revertMode();
          globalScene.ui.showText(`成功保存 ${savedCount} 只宝可梦的次数！`, null, () => {
            debugLog("pt", "[PT搜打撤] 保存成功提示显示完毕，准备询问撤离");
            globalScene.ui.clearText();
            globalScene.ui.setMode(UiMode.MESSAGE).then(() => this.askRetreat(earned, true));
          }, 1500);
          return true;
        }, () => {
          globalScene.ui.revertMode().then(() => {
            globalScene.ui.clearText();
            globalScene.ui.setMode(UiMode.MESSAGE).then(() => this.askRetreat(earned, false));
          });
          return true;
        });
      });
    } else {
      this.askRetreat(earned, false);
    }
  }

  /** 询问是否撤离（产物 `k3.askRetreat`） */
  askRetreat(earned: number, saved: boolean): void {
    const amuletCount = globalScene
      .findModifiers((m: any) => m.type.id === PT_AMULET_COIN_ITEM_ID)
      .reduce((sum: number, m: any) => sum + m.stackCount, 0);
    let total = earned;
    if (amuletCount > 0) total = earned + Math.floor(earned * 0.2 * amuletCount);
    const prompt = saved
      ? `确定要撤离吗？（已保存宝可梦次数,取消撤离返还pt）\n撤离后将获得 ${total} PT\n此操作无法撤销！\n\n(按钮将在3秒后激活...)`
      : `确定要撤离吗？\n撤离后将获得 ${total} PT\n此操作无法撤销！\n\n(按钮将在3秒后激活...)`;
    globalScene.ui.showText(prompt, null, () => {
      globalScene.ui.setOverlayMode(
        UiMode.CONFIRM,
        () => {
          this.handleRetreat(earned, saved);
          return true;
        },
        () => {
          globalScene.ui.revertMode().then(() => {
            if (globalScene.ui.clearText(), saved && globalScene.ptSoudachePendingSave) {
              const pending = globalScene.ptSoudachePendingSave;
              const refundPt = pending.ptCost;
              const inventory = globalScene.gameData.ptSoudacheData.pokemonInventory;
              for (const [rootId, count] of pending.pokemonMap.entries()) {
                if (inventory[rootId] !== -1 && inventory[rootId] > 0) {
                  inventory[rootId] = (inventory[rootId] || 1) - count;
                  debugLog("pt", `[PT搜打撤] 退还 rootId=${rootId} 次数，新库存=${inventory[rootId]}`);
                }
              }
              globalScene.gameData.addPt(refundPt);
              globalScene.ptSoudachePendingSave = null;
              globalScene.gameData.saveSystem();
              debugLog("pt", `[PT搜打撤] 取消撤离，退还 ${refundPt} PT 和宝可梦次数`);
            }
            globalScene.ui.setMode(UiMode.MESSAGE).then(() => this.end());
          });
          return true;
        },
        null,
        null,
        19,
        3000,
      );
    });
  }

  /** 执行撤离结算（产物 `k3.handleRetreat`） */
  handleRetreat(earned: number, saved: boolean): void {
    if (saved && globalScene.ptSoudachePendingSave) {
      debugLog("pt", "[PT搜打撤] 撤离确认，清除临时标记");
      globalScene.ptSoudachePendingSave = null;
    }
    const party = globalScene.getPlayerParty();
    globalScene.gameData.settlePtSoudacheInventory(party, true);
    const waveIndex = globalScene.currentBattle.waveIndex;
    this.awardRetreatRibbons(waveIndex);
    const challengeBonus = settlePendingChallengeReward();
    let base = earned;
    if (challengeBonus > 0) {
      base += challengeBonus;
      debugLog("pt", `[PT区间挑战] 撤离兜底结算：获得 ${challengeBonus} PT`);
    }
    let total = base;
    if (base > 0) {
      const amuletCount = globalScene
        .findModifiers((m: any) => m.type.id === PT_AMULET_COIN_ITEM_ID)
        .reduce((sum: number, m: any) => sum + m.stackCount, 0);
      if (amuletCount > 0) {
        const bonus = Math.floor(base * 0.2 * amuletCount);
        total = base + bonus;
        debugLog("pt", `[PT搜打撤] 护符金币加成: ${amuletCount}个 x20% = +${bonus}PT，总计: ${total}PT`);
      }
      if (globalScene.ptSoudacheNoRetreatMode) {
        const bonus = Math.floor(total * 0.5);
        total += bonus;
        debugLog("pt", `[PT搜打撤] 死战不退模式加成: +50% = +${bonus}PT，最终总计: ${total}PT`);
      }
      const withConstellation = applyGainMultiplier(
        total,
        partyConstellationGainMultiplier("ptSettle", playerPartyRootSpecies(), globalScene.gameData?.ptSoudacheData),
      );
      if (withConstellation !== total) {
        debugLog("pt", `[PT搜打撤] 命之座结算加成: ${total} → ${withConstellation}PT`);
      }
      globalScene.gameData.addPt(withConstellation);
      globalScene.gameData.saveSystem();
    }
    this.getRetreatHistoryEntry(total).then((entry: any) => {
      globalScene.gameData.saveRunHistory(entry, true);
    });
    globalScene.ui.revertMode().then(() => {
      globalScene.ui.showText(i18next.t("partyUiHandler:ptSoudacheRetreatSuccess", { earned: total }), null, () => {
        globalScene.gameData.deleteSession(globalScene.sessionSlotId).then(() => {
          // 重置所有 PT 运行态
          globalScene.ptSoudacheEarned = 0;
          globalScene.ptSoudachePassiveEnabled = false;
          globalScene.ptSoudacheNoRetreatMode = false;
          globalScene.ptSoudacheRetreatFloors = [];
          globalScene.ptSoudacheStartingItems = new Map();
          globalScene.ptSoudachePendingSave = null;
          globalScene.gameMode.hasDynamicBalance = false;
          getDynamicBalanceManager().disable();
          globalScene.disableMenu = true;
          globalScene.fadeOutBgm(1500, true);
          const active = globalScene.getField().filter((p: any) => p?.isActive(true));
          active.forEach((p: any) => p.hideInfo());
          globalScene.ui.fadeOut(1500).then(() => {
            active.forEach((p: any) => p.setVisible(false));
            globalScene.ui.clearText();
            globalScene.clearPhaseQueue();
            globalScene.reset(false, false);
            globalScene.disableMenu = false;
            globalScene.ui.setMode(UiMode.MESSAGE).then(() => {
              globalScene.ui.resetModeChain();
              globalScene.pushPhase(new TitlePhase());
              this.end();
            });
          });
        });
      }, 2000);
    });
  }

  /** 构造撤离历史条目（产物 `k3.getRetreatHistoryEntry`，含 SessionSaveData 的 PT 扩展字段） */
  async getRetreatHistoryEntry(earned: number): Promise<any> {
    const session = await globalScene.gameData.getSession(globalScene.sessionSlotId);
    let talentSystemData: unknown;
    try {
      const manager = getTalentManager();
      if (manager) {
        const acquired = manager.getAcquiredTalents();
        const history = manager.getHistory();
        talentSystemData = {
          acquiredTalents: Array.from(acquired.entries()).map(([, entry]: any) => ({
            talentId: entry.talentId,
            stacks: entry.stacks,
            acquiredWave: entry.acquiredWave,
            refreshPtSpent: entry.refreshPtSpent,
          })),
          history: history.map((h: any) => ({
            talentId: h.talentId,
            talentName: h.talentName,
            wave: h.wave,
            refreshPtSpent: h.refreshPtSpent,
            timestamp: h.timestamp,
          })),
          refreshCount: manager.getRefreshCount(),
          pityCounter: manager.getPityCounter(),
        };
        debugLog("pt", "[撤离结算] 保存天赋系统数据到历史记录");
        debugLog("pt", "  已获得天赋数量:", acquired.size);
        debugLog("pt", "  天赋历史条目数:", history.length);
      }
    } catch (err) {
      console.warn("[撤离结算] 获取天赋系统数据失败:", err);
    }
    return {
      seed: globalScene.seed,
      playTime: globalScene.sessionPlayTime,
      gameMode: globalScene.gameMode.modeId,
      party: globalScene.getPlayerParty().map((p: any) => serializePokemon(p)),
      enemyParty: globalScene.getEnemyParty().map((p: any) => serializePokemon(p)),
      modifiers: session ? session.modifiers : globalScene.findModifiers(() => true).map((m: any) => serializeModifier(m, true)),
      enemyModifiers: session ? session.enemyModifiers : globalScene.findModifiers(() => true, false).map((m: any) => serializeModifier(m, false)),
      arena: serializeArena(globalScene.arena),
      pokeballCounts: globalScene.pokeballCounts,
      money: Math.floor(globalScene.money),
      score: globalScene.score,
      waveIndex: globalScene.currentBattle.waveIndex,
      battleType: globalScene.currentBattle.battleType,
      trainer: globalScene.currentBattle.trainer ? serializeTrainer(globalScene.currentBattle.trainer) : null,
      gameVersion: globalScene.game.config.gameVersion,
      timestamp: new Date().getTime(),
      challenges: globalScene.gameMode.challenges.map((c: any) => serializeChallenge(c)),
      mysteryEncounterType: globalScene.currentBattle.mysteryEncounter?.encounterType ?? -1,
      mysteryEncounterSaveData: globalScene.mysteryEncounterSaveData,
      playerFaints: globalScene.arena.playerFaints,
      // —— PT 扩展字段（A4-03 必查）——
      ptSoudacheEarned: globalScene.ptSoudacheEarned || 0,
      ptSoudacheRetreated: true,
      ptSoudacheStartingItems: session?.ptSoudacheStartingItems || [],
      ptSoudacheRetreatFloors: session?.ptSoudacheRetreatFloors || [],
      ptSoudachePassiveEnabled: session?.ptSoudachePassiveEnabled || false,
      ptSoudacheNoRetreatMode: session?.ptSoudacheNoRetreatMode || false,
      dynamicBalanceEnabled: session?.dynamicBalanceEnabled || false,
      talentSystemData,
    };
  }

  /** 撤离绶带（产物 `k3.awardRetreatRibbons`，本体为空实现） */
  awardRetreatRibbons(_waveIndex: number): void {
    globalScene.getPlayerParty();
  }
}

// ─────────────────────────────────────────────────────────────
// 6. 判定与倍率（产物 `WM` / `MN` / `xw` / `pSe`）
// ─────────────────────────────────────────────────────────────

/** 产物 `WM` — 是否为 250 波 BOSS（搜打撤专属波） */
export function isPt250Boss(): boolean {
  return !!globalScene.gameMode?.isPtSoudache && globalScene.currentBattle?.waveIndex === 250;
}

/** 产物 `MN` — 搜打撤模式下的道具权重压缩器 |
 *  注：`daoguan`（道馆）+ 非搜打撤 + wave≥250 → 权重 0；搜打撤 → 压缩为 10%（至少 1）。 */
export function reducedWeightInPtSoudache(baseWeight: number, reduced?: number): (modifierType: any, option: any) => number {
  return (_modifierType: any, _option: any) => {
    try {
      const mode = globalScene?.gameMode;
      const wave = globalScene?.currentBattle?.waveIndex;
      if (!mode || wave === undefined) {
        console.warn("[reducedWeightInPtSoudache] gameMode或currentWave未定义，返回默认权重");
        return baseWeight;
      }
      if (mode.daoguan && !mode.isPtSoudache && wave >= 250) return 0;
      if (mode.isPtSoudache) {
        const weight = reduced !== undefined ? reduced : Math.max(1, Math.floor(baseWeight * 0.1));
        console.log("[reducedWeightInPtSoudache] PT搜打撤模式，权重:", baseWeight, "->", weight);
        return weight;
      }
      return baseWeight;
    } catch (err) {
      console.error("[reducedWeightInPtSoudache] 权重计算失败:", err);
      return baseWeight;
    }
  };
}

/** 产物 `xw` — 应用 PT 倍率（区间挑战 `ptMultiplier` × 命座收益加成） */
export function applyPtMultiplier(value: number): number {
  if (!globalScene.gameMode.isPtSoudache) return value;
  const challenge = getActiveChallenge();
  const multiplier = challenge?.ptMultiplier ?? 1;
  const scaled = multiplier === 1 ? value : Math.floor(value * multiplier);
  return applyGainMultiplier(
    scaled,
    partyConstellationGainMultiplier("pt", playerPartyRootSpecies(), globalScene.gameData?.ptSoudacheData),
  );
}

/** 产物 `pSe` — 是否处于「PT 搜打撤 + 动态平衡」模式（天赋模式） */
export function inPtTalentMode(): boolean {
  const mode = globalScene.gameMode;
  return !!mode?.isPtSoudache && !!mode?.hasDynamicBalance;
}

// ─────────────────────────────────────────────────────────────
// 7. 存档导入守卫（A3-03 挂账的 2 条补丁，落点：index chunk / overrides）
// ---------------------------------------------------------------------------
// 产物 `index-D3KKGO7Y.js` 中「PT 存档导入」开关与守卫：
//   · `pt-save-import-allow`：`DefaultOverrides.PT_MODE_ALLOW_IMPORT_OVERRIDE`
//       `!1 → !0`（允许导入 PT 存档）；
//   · `pt-save-import-gamemode-literal`：导入界面守卫
//       `m.gameMode===6 → ===10`（修正为 `GameModes.PT_SOUDACHE`；6 是 `HUO`，系笔误）。
// 二者均属 modder 新增代码（上游无 PT 模式），故随本系统迁移。
// ─────────────────────────────────────────────────────────────

/** 产物 `DefaultOverrides.PT_MODE_ALLOW_IMPORT_OVERRIDE`（补丁置 `true`） */
export const PT_MODE_ALLOW_IMPORT_OVERRIDE = true;

/**
 * 产物存档导入界面的 PT 守卫（补丁 `gameMode===6 → ===10`）。
 * @returns 若返回 `true` 表示「拒绝导入」，调用方应提示并中断。
 */
export function refusePtSaveImportImport(): boolean {
  // 产物：`o && m.gameMode === 10 && !PT_MODE_ALLOW_IMPORT_OVERRIDE`
  // 由于 override 恒为 true，此分支实际恒为 false（允许导入）。
  return !PT_MODE_ALLOW_IMPORT_OVERRIDE;
}

/** 产物拒绝导入时的提示文案（逐字保留） */
export const PT_SAVE_IMPORT_REFUSED_MESSAGE = `PT搜打撤模式的存档不允许导入！\n请使用游戏内的撤离功能保存PT。`;

/** 产物 `GameModes.PT_SOUDACHE`（=10；用于补丁 `pt-save-import-gamemode-literal`） */
export const PT_SOUDACHE_GAME_MODE = GameModes.PT_SOUDACHE;

// ─────────────────────────────────────────────────────────────
// 8. 开局 / 通关 / 撤离点 / 守门员 触发点（产物内联日志集中登记）
// ---------------------------------------------------------------------------
// 产物把下列日志内联在开局应用道具 / 通关结算 / 撤离点检查 / 守门员 AI 等调用点。
// 集中登记以保证锚点闭合，由各调用点在「接入锚点」阶段引用。
// ─────────────────────────────────────────────────────────────

/** 开场与道具应用（产物内联） */
export const PT_STARTUP_LOGS = {
  emptyParty: "PT搜打撤模式：party[0] 为 undefined!",
  emptyPartyApply: "PT搜打撤模式：队伍为空，无法应用道具",
  applyItems: "PT搜打撤模式 - 开始应用道具",
  firstInit: "[PT搜打撤] 首次初始化数据",
  missingItemType: (key: string) => `PT搜打撤模式：未找到道具类型映射: ${key}`,
  dailyInfiniteStarters: "[PT搜打撤] 今日无限次数御三家:",
  dailyDateChanged: "[PT搜打撤] 检测到日期变化，清除昨日无限次数御三家:",
  popupFailed: "[PT搜打撤] 弹窗显示失败:",
  destroyTrainerSprite: "[PT搜打撤] 销毁训练家精灵",
} as const;

/** 通关结算（产物内联） */
export const PT_CLEAR_LOGS = {
  clearSave: (partyCount: number, needSave: number, cost: number) =>
    `[PT搜打撤] 通关保存 - 当前队伍: ${partyCount}只, 需保存: ${needSave}只, 花费: ${cost}PT`,
  clearAmuletBonus: (count: number, bonus: number, total: number) =>
    `[PT搜打撤] 通关护符金币加成: ${count}个 x20% = +${bonus}PT，总计: ${total}PT`,
  clearConfirm: "[PT搜打撤] 通关确认，清除临时标记",
  isPtMode: "[通关结算] 是否PT搜打撤模式:",
  saveData: "=== 保存PT搜打撤数据 ===",
  gainedPt: (gain: number, total: number) => `✅ 获得 ${gain}PT，本局共获得: ${total}PT`,
  gainedPtUi: (gain: number) => `获得 ${gain}PT！（本局共获得`,
} as const;

/** 撤离点（产物内联，`[Retreat]` 前缀） */
export const PT_RETREAT_POINT_LOGS = {
  trigger: (name: string) => `[Retreat] PT撤离点触发: ${name}`,
  dynamicBalanceTrigger: (name: string) => `[Retreat] 动态平衡撤离点触发: ${name}`,
  noRetreatSkip: "[Retreat] 死战不退模式：跳过撤离点检查",
  retreatPoint: "撤离点:",
  retreatSuccess: "撤离成功",
} as const;

/** 守门员 Boss（产物内联） */
export const PT_GUARDIAN_LOGS = {
  addBoss: "搜打撤：新增 守门员 Boss ",
  specialMove: (name: string, move: string) => `[守门员AI] ${name} 特殊出招: ${move}`,
} as const;

/** 特殊宝可梦触发（产物内联） */
export const PT_SPECIAL_ENCOUNTER_LOG = (speciesName: string) => `[PT搜打撤] 🌟 特殊触发！遇到特殊宝可梦: ${speciesName}`;

/** 开局设置界面文案（产物内联，UI 层） */
export const PT_UI_TEXT = {
  startSetup: "PT搜打撤 - 开局设置",
  noRetreatDescription: `是否开启死战不退模式？\n开启后：所有撤离点消失，\n通关结算PT额外增加50%`,
} as const;

/** 产物 `GameData.applyDailyStarters()` 的今日先手判定（日期变化则清空） */
export function shouldResetDailyStarters(currentDate: string, savedDate: string): boolean {
  return currentDate !== savedDate;
}

// ─────────────────────────────────────────────────────────────
// TODO(接入锚点 90df65097b6d)：本文件依赖清单
// ─────────────────────────────────────────────────────────────
// TODO(接入锚点): globalScene → #app/global-scene；Phase / TitlePhase → #phases/*
// TODO(接入锚点): GameModes → #enums/game-modes（PT_SOUDACHE=10 由 A3-02 枚举扩展提供）
// TODO(接入锚点): ModifierType / ModifierTier → #modifier/modifier-type
// TODO(接入锚点): getActiveChallenge / playerPartyRootSpecies / settlePendingChallengeReward /
//                 getDynamicBalanceManager / getStarterDataList → 上游对应模块
// TODO(接入锚点): serializePokemon / serializeModifier / serializeArena / serializeTrainer /
//                 serializeChallenge → 存档序列化器
// TODO(接入锚点): 把 PtSoudacheStartPhase / ShopPhase / RetreatPhase 挂到阶段注册表
// TODO(接入锚点): `PtSoudacheData` 的持久化落点 → `#system/game-data`（存档模块）
// TODO(接入锚点): 2 条导入补丁落点 → `src/overrides.ts` + 存档导入 UI handler
// TODO(A4-验证): 撤离结算的全链路 PT 加成（护符金币 20%/个 → 死战不退 +50% → 命座收益）
// TODO(A4-验证): 保存/取消撤离的次数退还算术（`pokemonMap` 与库存 -1 语义）
// TODO(A4-验证): 移动端/桌面端守卫一致性（补丁 `gameMode===10`）
