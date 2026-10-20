/**
 * PKRC · F-12 走查用例目录（画面级清单，机读）· **F-14 升级版**
 * ---------------------------------------------------------------------------
 * 依据：O-9b「**逐系统确认全部画面**（画面级全量，不接受用『全部系统』偷换）」。
 *
 * 每个检查点（point）的四要素（F-12 验收 ②）：
 *   · arrival      —— 如何到达（文字）
 *   · route        —— **如何到达（可执行步骤）** ← F-14 新增
 *   · asserts      —— 断言什么（F-12 保留；U-11 的 `lib/judgement.mjs` 为准，见下）
 *   · judgement    —— 判定方式（assert / diff / ai），对应 O-9b 三级判据
 *
 * F-14 新增两个字段：
 *   · `route`             —— `lib/route.mjs` 的步骤数组（纯数据、A/B 同序）
 *   · `routeReliability`  —— verified（已实测）｜ derived（依代码推导，待实测）｜ unknown（暂无依据）
 *   · `gate`              —— `lib/gates.mjs` 的产物内容闸门：**这个画面在该产物里有没有可能渲染**
 *
 * ⚠️ 断言以 **`lib/judgement.mjs`（U-11 交付）为唯一权威**：
 *    U-11 明确修正了 F-12 的两处错误（canvas 内文本读不到 ⇒ 删除 `innerText.includes('天赋')` 等断言）。
 *    本目录的 `asserts` 仅作**无 U-11 条目时的兜底**。
 *
 * `reachability`（F-12 原始字段，保留）：
 *   · "verified"  —— 本环境已实测可达（有证据）
 *   · "designed"  —— 依据系统清单/代码设计，**待 A4-01 实测确认或修正**
 *
 * 被 F-10/F-14 直接消费：
 *   node tools/walkthrough/cli.mjs --scenario sys-talent --product both
 *   node tools/walkthrough/cli.mjs --scenario catalog --system talent --product both
 *   node tools/walkthrough/cli.mjs --gates        # 静态：两产物逐点闸门
 *   node tools/walkthrough/cli.mjs --validate     # 静态：目录完整性自检
 */

import { k, ks, taps, wait, settle, change, reload, note, retreat, enterBattle } from "../lib/route.mjs";

export const CATALOG_VERSION = 2;

// ---------------------------------------------------------------------------
// 断言构造糖（F-12 兜底用；权威在 lib/judgement.mjs）
// ---------------------------------------------------------------------------
const visual = (expect) => ({ kind: "visual", expect, judgement: "diff" });
const noNewErrors = (expect = "与上一检查点相比，未新增未捕获异常") => ({ kind: "noNewErrors", expect, judgement: "assert" });
const expr = (e, expect) => ({ kind: "expr", expr: e, expect, judgement: "assert" });

// ---------------------------------------------------------------------------
// 产物内容闸门（实测口径：**只用字符串字面量**，因 B 未启用 keepNames）
// ---------------------------------------------------------------------------
const GATE = {
  none: undefined,
  talentCore: { any: ["talent:talents."] },
  talentViewer: { any: ["talentViewer:"], reason: "天赋图鉴/查看器 UI 未进 bundle" },
  talentAge: { any: ["xinxiwenming"] },
  xingxiang: { any: ["xingxiang"] },
  yijian: { any: ["yijian_qingyuan"] },
  eryou: { any: ["abyss"], reason: "ERYOU 深渊系统未进 bundle（UI Handler 未接注册表）" },
  eryouUi: { any: ["二游"], reason: "ERYOU 养成界面未进 bundle" },
  pt: { any: ["搜打撤"] },
  jieming: { any: ["jieming:"] },
  healer: { any: ["healer:"], reason: "healer 系统未进 bundle" },
  nianli: { any: ["nian-li:"], reason: "nianli 系统未进 bundle（mod-init 挂账：无注册函数）" },
  p5x: { any: ["p5x_atk_up"], reason: "P5X 效果框架未进 bundle" },
  callingcard: { any: ["container_calling_card_gauge"] },
  dianxin: { any: ["shock:spatk-echo"] },
  legendary: { any: ["传说"], reason: "传说弹窗 chunk 未进 bundle" },
  constellation: { any: ["constellation:"] },
  superBackpack: { any: ["superBackpack"], reason: "超背包 modifier 未进 bundle" },
  chengfeng: { any: ["arenaTag:chengfengOnAdd"] },
  kongjian: { any: ["arenaTag:kongjian"] },
  meloetta: { any: ["meloetta:"] },
  mew: { any: ["mew:"] },
  seaguard: { any: ["海之守护"] },
  challenge: undefined, // 上游原生挑战，两产物均在
};

// ---------------------------------------------------------------------------
// 到达步骤构造糖
// ---------------------------------------------------------------------------

/**
 * 主菜单项进入：`M` 开菜单 → 下移 index 次 → 确认 → 等稳定。
 * ⚠️ 菜单条目顺序依赖存档状态（是否在 run 中），故标 derived 而非 verified。
 */
const menuItem = (index) => [
  k("m"),
  wait(500),
  ...taps("ArrowDown", index),
  k("z"),
  wait(700),
  settle(0.05, 6000),
  change(`进入主菜单第 ${index} 项`),
];

/** 战斗内点：要求已在一场战斗中（需 --inject 或 enterBattle 前置） */
const inBattle = () => [note("@requiresInject 依赖已进入战斗的存档；无注入时结果不可复现"), settle(0.05, 8000)];

/** @type {Array<{id:string,code:string,label:string,note?:string,points:Array<object>}>} */
export const CATALOG = [
  {
    id: "boot",
    code: "—",
    label: "启动 / 加载",
    note: "全部其他系统的前置；未就绪则后续点无意义。",
    points: [
      {
        id: "boot.ready",
        label: "启动就绪（非黑屏）",
        arrival: "打开根 URL，等待 canvas 挂载 + 帧内容方差 > 阈值 + 连续 2 帧",
        route: [],
        routeReliability: "verified",
        gate: GATE.none,
        keys: [],
        reachability: "verified",
        asserts: [visual("标题/加载画面正常渲染，非黑屏"), noNewErrors(), expr("!!document.querySelector('canvas')", "canvas 已挂载")],
      },
      {
        id: "boot.welcome-popup",
        label: "首次启动欢迎弹窗",
        arrival: "就绪后等待 splash 淡出，主菜单上的欢迎弹窗（中文文案）稳定",
        route: [settle(0.03, 12000), note("欢迎弹窗为 HTML 模块，可用 DOM 文本断言")],
        routeReliability: "verified",
        gate: GATE.none,
        keys: [],
        reachability: "verified",
        asserts: [
          expr("document.body.innerText.length > 0", "存在 DOM 文本（弹窗）"),
          visual("弹窗标题/按钮文案与 A 版一致"),
          noNewErrors(),
        ],
      },
      {
        id: "boot.lang-select",
        label: "语言选择界面",
        arrival: "主菜单 → 设置 → 语言（按键序列待实测补全）",
        route: [...menuItem(0), note("设置内二级菜单顺序待 A4-01 实测补全")],
        routeReliability: "derived",
        gate: GATE.none,
        keys: [],
        reachability: "designed",
        asserts: [visual("语言列表渲染"), noNewErrors()],
      },
    ],
  },
  {
    id: "talent",
    code: "TALENT",
    label: "天赋",
    note: "含年代天赋（冰河/石器/工业/信息/图腾）与星象、一剑清源。",
    points: [
      {
        id: "talent.codex",
        label: "天赋图鉴界面",
        arrival: "战斗中 → M 菜单 → 「当前天赋」（menuUiHandler:CURRENT_TALENTS）",
        route: [note("@requiresInject 需在 run 中"), ...inBattle(), ...menuItem(3), note("CURRENT_TALENTS 为 mod 追加菜单项，索引待实测校正")],
        routeReliability: "derived",
        gate: GATE.talentViewer,
        keys: [],
        reachability: "designed",
        asserts: [visual("图鉴网格 + 天赋卡片"), noNewErrors()],
      },
      {
        id: "talent.shop",
        label: "天赋商店",
        arrival: "主菜单 → 商店 → 天赋商店（showTalentShop）",
        route: [note("@requiresInject"), ...inBattle(), ...menuItem(5)],
        routeReliability: "derived",
        gate: GATE.talentCore,
        keys: [],
        reachability: "designed",
        asserts: [visual("商店条目 + 价格"), noNewErrors()],
      },
      {
        id: "talent.acquire-toast",
        label: "天赋获取提示",
        arrival: "游戏内获得天赋后弹出提示",
        route: [note("@requiresInject 需触发获取事件"), ...inBattle(), settle(0.02, 4000)],
        routeReliability: "unknown",
        gate: GATE.talentCore,
        keys: [],
        reachability: "designed",
        asserts: [visual("获取提示文本/图标"), noNewErrors()],
      },
      {
        id: "talent.runtime-hud",
        label: "战斗内天赋 HUD",
        arrival: "进入战斗，观察运行时 HUD（setTalentRuntimeHudText）",
        route: [note("@requiresInject"), ...inBattle(), note("HUD 常驻，进入战斗后直接取证")],
        routeReliability: "derived",
        gate: GATE.talentCore,
        keys: [],
        reachability: "designed",
        asserts: [visual("HUD 文本与 A 版一致"), noNewErrors()],
      },
      {
        id: "talent.age.ice",
        label: "冰河期天赋触发",
        arrival: "携带冰河期天赋进入战斗并命中（POST_TARGET）",
        route: [note("@requiresInject 携带对应天赋的存档"), ...inBattle(), k("z"), wait(900), settle(0.04, 6000)],
        routeReliability: "derived",
        gate: GATE.talentCore,
        keys: [],
        reachability: "designed",
        asserts: [visual("AOE 结算 + 播报"), noNewErrors()],
      },
      {
        id: "talent.age.stone",
        label: "石器时代天赋触发",
        arrival: "同冰河期，换石器时代",
        route: [note("@requiresInject 携带对应天赋的存档"), ...inBattle(), k("z"), wait(900), settle(0.04, 6000)],
        routeReliability: "derived",
        gate: GATE.talentCore,
        keys: [],
        reachability: "designed",
        asserts: [visual("AOE 结算 + 播报"), noNewErrors()],
      },
      {
        id: "talent.age.industrial",
        label: "工业时代天赋触发",
        arrival: "同冰河期，换工业时代",
        route: [note("@requiresInject 携带对应天赋的存档"), ...inBattle(), k("z"), wait(900), settle(0.04, 6000)],
        routeReliability: "derived",
        gate: GATE.talentCore,
        keys: [],
        reachability: "designed",
        asserts: [visual("AOE 结算 + 播报"), noNewErrors()],
      },
      {
        id: "talent.age.info",
        label: "信息时代天赋触发",
        arrival: "同冰河期，换信息时代",
        route: [note("@requiresInject 携带对应天赋的存档"), ...inBattle(), k("z"), wait(900), settle(0.04, 6000)],
        routeReliability: "derived",
        gate: GATE.talentAge,
        keys: [],
        reachability: "designed",
        asserts: [visual("AOE 结算 + 播报"), noNewErrors()],
      },
      {
        id: "talent.age.totem",
        label: "图腾时代天赋触发",
        arrival: "同冰河期，换图腾时代",
        route: [note("@requiresInject 携带对应天赋的存档"), ...inBattle(), k("z"), wait(900), settle(0.04, 6000)],
        routeReliability: "derived",
        gate: GATE.talentCore,
        keys: [],
        reachability: "designed",
        asserts: [visual("AOE 结算 + 播报"), noNewErrors()],
      },
      {
        id: "talent.xingxiang",
        label: "星象切换",
        arrival: "触发星象切换（switchXingxiang），观察播报与状态",
        route: [note("@requiresInject 星象状态需存档携带"), ...inBattle(), settle(0.04, 6000)],
        routeReliability: "unknown",
        gate: GATE.xingxiang,
        keys: [],
        reachability: "designed",
        asserts: [visual("播报文本『的星象切换为【…】！』"), noNewErrors()],
      },
      {
        id: "talent.yijianqingyuan",
        label: "一剑清源",
        arrival: "携带一剑清源天赋进入战斗",
        route: [note("@requiresInject 携带一剑清源的存档"), ...inBattle()],
        routeReliability: "derived",
        gate: GATE.yijian,
        keys: [],
        reachability: "designed",
        asserts: [visual("增伤表现"), noNewErrors()],
      },
    ],
  },
  {
    id: "eryou",
    code: "ERYOU",
    label: "二游养成（深渊）",
    note: "🔴 11 个 ERYOU UI Handler 未接 UI 模式注册表（mod-init.ts 挂账）⇒ B 版不可达。",
    points: [
      {
        id: "eryou.synthesis",
        label: "合成界面",
        arrival: "主菜单 → 二游养成 → 合成（EryouHeldSynthesisUiHandler）",
        route: [note("@requiresInject"), ...inBattle(), ...menuItem(6)],
        routeReliability: "unknown",
        gate: GATE.eryouUi,
        keys: [],
        reachability: "designed",
        asserts: [visual("合成台 + 素材槽"), noNewErrors()],
      },
      {
        id: "eryou.battle",
        label: "深渊战斗",
        arrival: "进入深渊战斗场景（EryouStartPhase）",
        route: [note("@requiresInject"), ...enterBattle()],
        routeReliability: "unknown",
        gate: GATE.eryou,
        keys: [],
        reachability: "designed",
        asserts: [visual("战斗画面 + 深渊 UI"), noNewErrors()],
      },
      {
        id: "eryou.shop",
        label: "深渊商店",
        arrival: "深渊内商店",
        route: [note("@requiresInject"), ...inBattle()],
        routeReliability: "unknown",
        gate: GATE.eryou,
        keys: [],
        reachability: "designed",
        asserts: [visual("商品列表"), noNewErrors()],
      },
      {
        id: "eryou.abyss-buff",
        label: "深渊攻击加成（abyssAttackBuffMultiplier）",
        arrival: "深渊中触发攻击加成",
        route: [note("@requiresInject"), ...inBattle()],
        routeReliability: "unknown",
        gate: GATE.eryou,
        keys: [],
        reachability: "designed",
        asserts: [visual("加成数值显示"), noNewErrors()],
      },
    ],
  },
  {
    id: "pt-soudache",
    code: "PT_SOUDACHE",
    label: "搜打撤",
    points: [
      {
        id: "pt.start",
        label: "PT 模式开始界面",
        arrival: "主菜单 → 搜打撤（PtSoudacheStartPhase）",
        route: [...menuItem(7)],
        routeReliability: "derived",
        gate: GATE.pt,
        keys: [],
        reachability: "designed",
        asserts: [visual("开始界面"), noNewErrors()],
      },
      {
        id: "pt.shop",
        label: "PT 商店",
        arrival: "PT 内商店（PtSoudacheShopPhase）",
        route: [note("@requiresInject"), ...inBattle()],
        routeReliability: "unknown",
        gate: GATE.pt,
        keys: [],
        reachability: "designed",
        asserts: [visual("商店条目"), noNewErrors()],
      },
      {
        id: "pt.settle",
        label: "PT 结算",
        arrival: "完成 PT 一轮后的结算界面",
        route: [note("@requiresInject 需完成一轮 PT"), ...inBattle(), settle(0.04, 8000)],
        routeReliability: "unknown",
        gate: GATE.pt,
        keys: [],
        reachability: "designed",
        asserts: [visual("结算数值（每级 PT 收益按波次分档）"), noNewErrors()],
      },
    ],
  },
  {
    id: "jieming",
    code: "JIEMING",
    label: "解明",
    points: [
      {
        id: "jieming.shield",
        label: "解明盾",
        arrival: "进入战斗并触发解明盾",
        route: [note("@requiresInject"), ...inBattle()],
        routeReliability: "derived",
        gate: GATE.jieming,
        keys: [],
        reachability: "designed",
        asserts: [visual("盾层数/图标"), noNewErrors()],
      },
      {
        id: "jieming.skill",
        label: "解明招式演出",
        arrival: "使用解明招式（海之守护等）",
        route: [note("@requiresInject"), ...inBattle(), k("z"), wait(1200), settle(0.02, 3000)],
        routeReliability: "derived",
        gate: GATE.jieming,
        keys: [],
        reachability: "designed",
        asserts: [visual("动画（jieming-anims chunk）"), noNewErrors()],
      },
      {
        id: "jieming.turnorder",
        label: "解明回合顺序条",
        arrival: "P5X 模式下显示回合顺序条",
        route: [note("@requiresInject P5X 模式"), ...inBattle()],
        routeReliability: "unknown",
        gate: GATE.jieming,
        keys: [],
        reachability: "designed",
        asserts: [visual("顺序条 UI"), noNewErrors()],
      },
    ],
  },
  {
    id: "healer",
    code: "HEALER",
    label: "治疗 / 守护",
    points: [
      {
        id: "healer.wish",
        label: "治疗祈愿",
        arrival: "触发 HealerWishPhase",
        route: [note("@requiresInject"), ...inBattle()],
        routeReliability: "unknown",
        gate: GATE.healer,
        keys: [],
        reachability: "designed",
        asserts: [visual("祈愿界面"), noNewErrors()],
      },
      {
        id: "healer.seaguard",
        label: "海之守护铺层",
        arrival: "战斗开始（applySeaGuardOpening）",
        route: [note("@requiresInject 进入战斗即触发"), ...inBattle(), settle(0.04, 8000)],
        routeReliability: "derived",
        gate: GATE.seaguard,
        keys: [],
        reachability: "designed",
        asserts: [visual("守护铺层表现 + 播报"), noNewErrors()],
      },
    ],
  },
  {
    id: "nianli",
    code: "NIANLI",
    label: "念力",
    note: "mod-init 挂账：nianli 无 mod 侧注册函数（纯钩子实现）。",
    points: [
      {
        id: "nianli.stacks",
        label: "念力层数 HUD",
        arrival: "战斗中获得念力层数",
        route: [note("@requiresInject"), ...inBattle()],
        routeReliability: "unknown",
        gate: GATE.nianli,
        keys: [],
        reachability: "designed",
        asserts: [visual("层数显示"), noNewErrors()],
      },
      {
        id: "nianli.burst",
        label: "念力爆发结算",
        arrival: "触发念力爆发（NianLiBurstEndPhase）",
        route: [note("@requiresInject"), ...inBattle(), settle(0.04, 6000)],
        routeReliability: "unknown",
        gate: GATE.nianli,
        keys: [],
        reachability: "designed",
        asserts: [visual("爆发结算 + 播报"), noNewErrors()],
      },
    ],
  },
  {
    id: "p5x",
    code: "P5X",
    label: "P5X 战斗",
    points: [
      {
        id: "p5x.turnorder",
        label: "P5X 回合顺序条",
        arrival: "P5X 模式下进入战斗（ensure/updateP5XTurnOrderBar）",
        route: [note("@requiresInject P5X 模式；顺序条组件未接入口（F-11 挂账）"), ...inBattle()],
        routeReliability: "unknown",
        gate: GATE.p5x,
        keys: [],
        reachability: "designed",
        asserts: [visual("顺序条 UI"), noNewErrors()],
      },
      {
        id: "p5x.turnorder.hide",
        label: "回合顺序条隐藏",
        arrival: "战斗结束（hideP5XTurnOrderBar）",
        route: [note("@requiresInject 需完成战斗"), ...inBattle(), k("z"), wait(1200), settle(0.04, 6000)],
        routeReliability: "unknown",
        gate: GATE.p5x,
        keys: [],
        reachability: "designed",
        asserts: [visual("顺序条消失"), noNewErrors()],
      },
      {
        id: "p5x.effect",
        label: "P5X 效果触发",
        arrival: "触发 applyP5XEffect",
        route: [note("@requiresInject"), ...inBattle()],
        routeReliability: "unknown",
        gate: GATE.p5x,
        keys: [],
        reachability: "designed",
        asserts: [visual("效果表现"), noNewErrors()],
      },
    ],
  },
  {
    id: "callingcard",
    code: "CALLINGCARD",
    label: "抽卡 / 呼符",
    points: [
      {
        id: "callingcard.gauge",
        label: "呼符计量条",
        arrival: "呼符累计时显示计量（container_calling_card_gauge）",
        route: [note("@requiresInject"), ...inBattle()],
        routeReliability: "unknown",
        gate: GATE.callingcard,
        keys: [],
        reachability: "designed",
        asserts: [visual("计量条 UI"), noNewErrors()],
      },
      {
        id: "callingcard.resolve",
        label: "呼符解析",
        arrival: "触发呼符结算（CallingCardResolvePhase）",
        route: [note("@requiresInject"), ...inBattle()],
        routeReliability: "unknown",
        gate: GATE.callingcard,
        keys: [],
        reachability: "designed",
        asserts: [visual("解析结果"), noNewErrors()],
      },
      {
        id: "callingcard.command",
        label: "呼符指令按钮",
        arrival: "命令菜单出现 CALLING_CARD 按钮",
        route: [note("@requiresInject"), ...inBattle(), k("z"), wait(700), settle(0.05, 5000)],
        routeReliability: "derived",
        gate: GATE.callingcard,
        keys: [],
        reachability: "designed",
        asserts: [visual("按钮 + 刷新逻辑"), noNewErrors()],
      },
    ],
  },
  {
    id: "dianxin",
    code: "DIANXIN",
    label: "点心",
    notes: undefined,
    points: [
      {
        id: "dianxin.echo",
        label: "点心回响结算",
        arrival: "触发 DianXinEchoEndPhase",
        route: [note("@requiresInject"), ...inBattle(), settle(0.04, 6000)],
        routeReliability: "unknown",
        gate: GATE.dianxin,
        keys: [],
        reachability: "designed",
        asserts: [visual("回响结算表现"), noNewErrors()],
      },
    ],
  },
  {
    id: "legendary-popup",
    code: "legendary-popup",
    label: "传说弹窗",
    note: "HTML 模块（DOM 可读）—— 唯一能用 DOM 文本断言的画面族。",
    points: [
      {
        id: "legendary.popup",
        label: "传说宝可梦弹窗",
        arrival: "遇到传说宝可梦时弹出（独立 chunk）",
        route: [note("@requiresInject 需传说遭遇存档"), ...inBattle(), settle(0.02, 4000)],
        routeReliability: "unknown",
        gate: GATE.legendary,
        keys: [],
        reachability: "designed",
        asserts: [visual("弹窗 + 光环动效"), noNewErrors()],
      },
      {
        id: "legendary.helper",
        label: "传说弹窗辅助层",
        arrival: "弹窗动画过程中",
        route: [note("@requiresInject"), ...inBattle(), settle(0.02, 3000)],
        routeReliability: "unknown",
        gate: GATE.legendary,
        keys: [],
        reachability: "designed",
        asserts: [visual("辅助层渲染"), noNewErrors()],
      },
    ],
  },
  {
    id: "misc",
    code: "—",
    label: "杂项（命座 / 超背包 / 挑战 / 场地 / 其它）",
    note: "第 11 个系统「杂项」涵盖多个独立机制，逐项单列。",
    points: [
      {
        id: "misc.constellation.codex",
        label: "命座图鉴",
        arrival: "主菜单 → 命座图鉴（PtConstellationUiHandler，未接线）",
        route: [note("@requiresInject"), ...inBattle(), ...menuItem(8)],
        routeReliability: "unknown",
        gate: GATE.constellation,
        keys: [],
        reachability: "designed",
        asserts: [visual("命座列表"), noNewErrors()],
      },
      {
        id: "misc.constellation.node",
        label: "命座节点面板",
        arrival: "选中某命座 → 节点面板（1/2/3/5/6 节点分布）",
        route: [note("@requiresInject"), ...inBattle(), ...menuItem(8), k("z"), wait(600), settle(0.05, 5000)],
        routeReliability: "unknown",
        gate: GATE.constellation,
        keys: [],
        reachability: "designed",
        asserts: [visual("节点连线 + 等级"), noNewErrors()],
      },
      {
        id: "misc.super-backpack",
        label: "超背包",
        arrival: "主菜单 → 超背包（SUPER_BACKPACK，mod 扩展模式）",
        route: [note("@requiresInject"), ...inBattle(), ...menuItem(4)],
        routeReliability: "unknown",
        gate: GATE.superBackpack,
        keys: [],
        reachability: "designed",
        asserts: [visual("背包网格"), noNewErrors()],
      },
      {
        id: "misc.challenge.select",
        label: "挑战选择",
        arrival: "新游戏 → 挑战选择",
        route: [...taps("z", 2), wait(800), ...taps("z", 1), wait(900), settle(0.05, 6000), change("进入挑战选择")],
        routeReliability: "derived",
        gate: GATE.challenge,
        keys: [],
        reachability: "designed",
        asserts: [visual("挑战列表"), noNewErrors()],
      },
      {
        id: "misc.challenge.same-pokemon",
        label: "同种宝可梦挑战",
        arrival: "选 SamePokemonChallenge 开局",
        route: [...taps("z", 2), wait(800), ...taps("z", 1), wait(900), ...taps("ArrowDown", 1), k("z"), wait(900), settle(0.05, 6000)],
        routeReliability: "derived",
        gate: GATE.challenge,
        keys: [],
        reachability: "designed",
        asserts: [visual("挑战开局状态"), noNewErrors()],
      },
      {
        id: "misc.challenge.suiji",
        label: "随机挑战",
        arrival: "选 SuijiChallenge 开局",
        route: [note("@requiresInject 随机种子需固定才可比"), ...taps("z", 2), wait(800), ...taps("z", 1), wait(900), ...taps("ArrowDown", 2), k("z"), wait(900), settle(0.05, 6000)],
        routeReliability: "derived",
        gate: GATE.challenge,
        keys: [],
        reachability: "designed",
        asserts: [visual("随机化结果"), noNewErrors()],
      },
      {
        id: "misc.challenge.triple-passive",
        label: "三被动挑战",
        arrival: "选 TriplePassiveChallenge 开局",
        route: [...taps("z", 2), wait(800), ...taps("z", 1), wait(900), ...taps("ArrowDown", 3), k("z"), wait(900), settle(0.05, 6000)],
        routeReliability: "derived",
        gate: GATE.challenge,
        keys: [],
        reachability: "designed",
        asserts: [visual("被动槽 ×3"), noNewErrors()],
      },
      {
        id: "misc.challenge.wu",
        label: "Wu 挑战",
        arrival: "选 WuChallenge 开局",
        route: [...taps("z", 2), wait(800), ...taps("z", 1), wait(900), ...taps("ArrowDown", 4), k("z"), wait(900), settle(0.05, 6000)],
        routeReliability: "derived",
        gate: GATE.challenge,
        keys: [],
        reachability: "designed",
        asserts: [visual("挑战开局状态"), noNewErrors()],
      },
      {
        id: "misc.terrain.chengfeng",
        label: "乘风场地",
        arrival: "触发 ChengfengTag",
        route: [note("@requiresInject"), ...inBattle()],
        routeReliability: "unknown",
        gate: GATE.chengfeng,
        keys: [],
        reachability: "designed",
        asserts: [visual("场地表现 + 播报"), noNewErrors()],
      },
      {
        id: "misc.terrain.kongjian",
        label: "空间场地",
        arrival: "触发 KONGJIANRoomTag",
        route: [note("@requiresInject"), ...inBattle()],
        routeReliability: "unknown",
        gate: GATE.kongjian,
        keys: [],
        reachability: "designed",
        asserts: [visual("场地表现 + 播报"), noNewErrors()],
      },
      {
        id: "misc.meloetta",
        label: "美洛耶塔节拍",
        arrival: "携带美洛耶塔进入战斗（onMeloettaWaveStart）",
        route: [note("@requiresInject 携带美洛耶塔"), ...inBattle(), settle(0.04, 8000)],
        routeReliability: "derived",
        gate: GATE.meloetta,
        keys: [],
        reachability: "designed",
        asserts: [visual("节拍下限表现"), noNewErrors()],
      },
      {
        id: "misc.mew",
        label: "梦幻",
        arrival: "触发梦幻相关效果",
        route: [note("@requiresInject"), ...inBattle()],
        routeReliability: "unknown",
        gate: GATE.mew,
        keys: [],
        reachability: "designed",
        asserts: [visual("效果表现"), noNewErrors()],
      },
      {
        id: "misc.manaphy",
        label: "海之守护（manaphy）",
        arrival: "触发 manaphy 系效果",
        route: [note("@requiresInject"), ...inBattle()],
        routeReliability: "derived",
        gate: GATE.seaguard,
        keys: [],
        reachability: "designed",
        asserts: [visual("效果表现"), noNewErrors()],
      },
      {
        id: "misc.pt.hud",
        label: "PT 运行 HUD",
        arrival: "PT 模式下的常驻 HUD",
        route: [note("@requiresInject PT 模式"), ...inBattle()],
        routeReliability: "unknown",
        gate: GATE.pt,
        keys: [],
        reachability: "designed",
        asserts: [visual("HUD 数值"), noNewErrors()],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// H-8 · 27 个原 `unknown` 点的定性（第六阶段 · 派单 37 §三）
// ---------------------------------------------------------------------------
/**
 * 依据来源（**实测反解 A 产物**，非猜测）：
 *   A 产物的 `this.handlers` 是**密集索引**数组，共 64 项：
 *     0..47 = 上游 48 个 handler；**48..63 = mod 追加的 16 个 handler**：
 *       48 TalentViewer · 49 TalentCodex · 50 SuperBackpack · 51 (未解析) · 52 Jieming
 *       53 EryouReward · 54 EryouProgression · 55 EryouLevelUp · 56 EryouEvolve
 *       57 EryouHeldItem · 58 EryouSynthesis · 59 EryouGuide · 60 EryouTraining
 *       61 EryouLobby · 62 EryouSpeciesSearch · 63 EryouHeldSynthesis
 *   A 产物的 `MenuOptions` 枚举（含 mod 追加 2 项，其余整体后移 2）：
 *     GAME_SETTINGS=0 · ACHIEVEMENTS=1 · STATS=2 · **CURRENT_TALENTS=3** · **TALENT_CODEX=4**
 *     · EGG_LIST=5 · EGG_GACHA=6 · POKEDEX=7 · MANAGE_DATA=8 · COMMUNITY=9 · SAVE_AND_QUIT=10 · LOG_OUT=11
 *     ⇒ MenuUiHandler `case 3` → `setOverlayMode(V.TALENT_VIEWER)`，`case 4` → `V.TALENT_CODEX`（且 **case 3 要求 `currentBattle`**，即仅 run 内可用）
 *   A 产物的 `UiMode` 上真实存在的 18 个 mod 键：TALENT_VIEWER/TALENT_CODEX/TALENT_SHOP/SUPER_BACKPACK/
 *     PT_CONSTELLATION/JIEMING/PT_SOUDACHE_START + ERYOU_{REWARD,PROGRESSION,LEVELUP,EVOLVE,HELD_ITEM,
 *     SYNTHESIS,GUIDE,TRAINING,LOBBY,SEARCH,HELD_SYNTHESIS}
 *   实测：**mod 没有任何自定义热键**（A 产物里 `addKey` 只有上游 SHIFT/DELETE/HOME）
 *     ⇒ 所有 mod 界面只能经「菜单 / phase / 战斗内事件」进入，无法用按键直达。
 *
 * 定性口径（H-8 验收 ①：能实测→verified；有代码依据→derived；确实到不了→unreachable + 原因）：
 *   derived      —— 有明确代码依据（战斗内被动调用 / Phase 自动进入 / 上游菜单项），
 *                   **到达由 `--inject` 的存档状态保证**（`reachProof: inject`），未逐点实测
 *   unreachable  —— 本走查框架**无法自动到达**（≠ 产品不可达）。`unreachableKind` 记原因类别：
 *                   · `ui-handler-not-wired`  依赖的 mod UiHandler 在源码化产物未接 UI 注册表，
 *                                             B 侧无该界面；A 侧存在但无源码依据可推导
 *                   · `private-cursor-index`  A 侧可达，但需 mod 私有 lobby 内游标索引，源码无该顺序
 *                   · `no-deterministic-state` 需随机/偶发状态（传说遭遇等），无确定性注入样本
 */
const ROUTE_OVERRIDES = {
  // ── 战斗内被动触发（无需导航；`--inject` 真存档即到达）────────────────────
  "talent.acquire-toast": {
    routeReliability: "derived",
    routeEvidence: "获得天赋后由 runInstantEffect/提示链自动弹出（战斗内事件，无导航）",
  },
  "talent.xingxiang": {
    routeReliability: "derived",
    routeEvidence: "switchXingxiang 触发播报（战斗内事件；星象状态由存档携带）",
  },
  "healer.wish": {
    routeReliability: "derived",
    routeEvidence: "HealerWishPhase 为已注册 Phase，战斗流程内自动进入（mod-init: registerHealerSystem）",
  },
  "nianli.stacks": {
    routeReliability: "derived",
    routeEvidence: "层数 HUD 随获得层数自动刷新（战斗内被动）",
  },
  "nianli.burst": {
    routeReliability: "derived",
    routeEvidence: "NianLiBurstEndPhase 已注册 PHASES，战斗结算自动进入",
  },
  "p5x.turnorder": {
    routeReliability: "derived",
    routeEvidence: "ensureP5XTurnOrderBar/updateP5XTurnOrderBar 由回合流程被动调用（mod-init 注：p5x 无需注册）",
  },
  "p5x.turnorder.hide": {
    routeReliability: "derived",
    routeEvidence: "hideP5XTurnOrderBar 在战斗结束时被动调用（同一被动链）",
  },
  "p5x.effect": {
    routeReliability: "derived",
    routeEvidence: "applyP5XEffect 为被动调用（mod-init 明确「效果框架被动，无需注册」）",
  },
  "callingcard.gauge": {
    routeReliability: "derived",
    routeEvidence: "container_calling_card_gauge 在呼符累计时创建（战斗内被动）",
  },
  "callingcard.resolve": {
    routeReliability: "derived",
    routeEvidence: "CallingCardResolvePhase 由 handleFightCommand 末 unshift（额外回合链，战斗内自动）",
  },
  "dianxin.echo": {
    routeReliability: "derived",
    routeEvidence: "DianXinEchoEndPhase 已注册 PHASES，战斗内自动进入",
  },
  "jieming.turnorder": {
    routeReliability: "derived",
    routeEvidence: "与 p5x.turnorder 同组件家族（顺序条被动刷新）",
  },
  "misc.terrain.chengfeng": {
    routeReliability: "derived",
    routeEvidence: "ChengfengTag 为 arena tag，触发即以 add 进场（战斗内自动）",
  },
  "misc.terrain.kongjian": {
    routeReliability: "derived",
    routeEvidence: "KONGJIANRoomTag 同上",
  },
  "misc.mew": {
    routeReliability: "derived",
    routeEvidence: "registerMewSystem/registerMewStatusProvider 已在 mod-init 接线（战斗内被动）",
  },
  "misc.pt.hud": {
    routeReliability: "derived",
    routeEvidence: "V.PT_SOUDACHE_START 由 PtSoudacheStartPhase.start() 自动 setMode ⇒ 进入 PT 模式即 HUD 在位",
  },
  // ── ERYOU 模式级（入口是 GameModes.ERYOU=12，A 产物 case 12 => 「二游模式」）──
  "eryou.battle": {
    routeReliability: "derived",
    routeEvidence: "GameModes.ERYOU=12（A 产物 GameMode.getName(): case 12 => 「二游模式」）⇒ 存档处于 ERYOU 模式即进入深渊战斗",
  },
  "eryou.abyss-buff": {
    routeReliability: "derived",
    routeEvidence: "abyssAttackBuffMultiplier 在深渊伤害计算中被被动调用（F-11 已迁）",
  },

  // ── 本框架无法自动到达（≠ 产品不可达）────────────────────────────────────
  "eryou.synthesis": {
    routeReliability: "unreachable",
    unreachableKind: "private-cursor-index",
    routeEvidence:
      "需在 ERYOU 会话内进入 V.ERYOU_SYNTHESIS / V.ERYOU_HELD_SYNTHESIS 子页；A 产物由 openEryouLobby 的游标驱动，源码化产物 ui.ts 未接线 16 个 mod handler ⇒ 无双方共有可脚本化路径",
  },
  "eryou.shop": {
    routeReliability: "unreachable",
    unreachableKind: "private-cursor-index",
    routeEvidence: "深渊商店为 ERYOU lobby 子页，需私有游标索引；同 eryou.synthesis",
  },
  "pt.shop": {
    routeReliability: "unreachable",
    unreachableKind: "private-cursor-index",
    routeEvidence: "PtSoudacheShopPhase 需在 PT 一轮中途进入，游标索引无源码依据",
  },
  "pt.settle": {
    routeReliability: "unreachable",
    unreachableKind: "private-cursor-index",
    routeEvidence: "需完整跑完一轮 PT 才进结算；单次走查无法确定性产出该状态",
  },
  "legendary.popup": {
    routeReliability: "unreachable",
    unreachableKind: "no-deterministic-state",
    routeEvidence: "传说弹窗由传说遭遇触发，遭遇内容随机；当前无可确定性注入的遭遇样本",
  },
  "legendary.helper": {
    routeReliability: "unreachable",
    unreachableKind: "no-deterministic-state",
    routeEvidence: "依赖 legendary.popup 同一随机遭遇",
  },
  "misc.constellation.codex": {
    routeReliability: "unreachable",
    unreachableKind: "ui-handler-not-wired",
    routeEvidence:
      "A 产物在 STARTER_SELECT 内以 setOverlayMode(V.PT_CONSTELLATION) 打开命座；源码化产物 PtConstellationUiHandler 未接 UI 注册表（mod-init 挂账）⇒ B 无此界面",
  },
  "misc.constellation.node": {
    routeReliability: "unreachable",
    unreachableKind: "ui-handler-not-wired",
    routeEvidence: "同 misc.constellation.codex（节点面板为同一 overlay 的子视图）",
  },
  "misc.super-backpack": {
    routeReliability: "unreachable",
    unreachableKind: "ui-handler-not-wired",
    routeEvidence:
      "A 产物 setMode(V.SUPER_BACKPACK) 只出现在特定道具使用链（Pokemon 复原/形态变化）内，无菜单入口；且 SuperBackpackUiHandler 在源码化产物未接线",
  },
};

// F-14 已定性为 derived 的点补齐「依据」（H-8：非 verified 必须可追溯）
const EVIDENCE_ONLY = {
  "boot.lang-select": "A 产物 MenuOptions 实测：GAME_SETTINGS=0（MenuUiHandler 第 0 项）→ 设置 → 显示/语言；二级子项索引未实测",
  "talent.codex": "A 产物 MenuOptions 实测：CURRENT_TALENTS=3（mod 插入项）→ MenuUiHandler case 3 => setOverlayMode(V.TALENT_VIEWER)，且 case 3 要求 currentBattle（仅 run 内可用）",
  "talent.shop": "A 产物存在 V.TALENT_SHOP，由天赋商店调用点 setMode(V.TALENT_SHOP,pool,cost,count,...) 打开；入口在 run 内天赋/商店流，具体选项索引未实测",
  "talent.runtime-hud": "setTalentRuntimeHudText 在战斗内被动刷新（A 产物 4 处调用）",
  "talent.age.ice": "年代天赋命中后按 POST_TARGET 触发 AOE 结算与播报（talent-system 被动链）",
  "talent.age.stone": "同 ice，换石器时代标记",
  "talent.age.industrial": "同 ice，换工业时代标记",
  "talent.age.info": "同 ice；A/B 均含 xinxiwenming 标记（B 3 次 ⇒ 该时代逻辑已进 bundle）",
  "talent.age.totem": "同 ice，换图腾时代标记",
  "talent.yijianqingyuan": "一剑清源增伤走伤害乘区被动计算（yijian_qingyuan 标记 A 5 / B 2）",
  "pt.start": "A 产物 PtSoudacheStartPhase.start() 内 setMode(V.PT_SOUDACHE_START) ⇒ 进入 PT 模式即达，无需额外导航",
  "jieming.shield": "解明盾由 registerJiemingShieldExpireHandler / SeaGuard 模块在战斗内加盾（mod-init 已接线）",
  "jieming.skill": "解明招式演出随招式使用被动播放（jieming-anims chunk）",
  "healer.seaguard": "applySeaGuardOpening 在战斗开始铺层（registerSeaGuardSystem 已在 mod-init 接线）",
  "callingcard.command": "呼符按钮由命令菜单在战斗内动态加入（CallingCard 额外回合链）",
  "misc.challenge.select": "上游原生 GameChallengesUiHandler（UiMode.CHALLENGE_SELECT），新游戏流程内可达；两产物均存在",
  "misc.challenge.same-pokemon": "同 select；SamePokemonChallenge 为 mod 追加挑战项",
  "misc.challenge.suiji": "同 select；SuijiChallenge 随机化需固定种子才可比（--inject）",
  "misc.challenge.triple-passive": "同 select；TriplePassiveChallenge 为 mod 追加项",
  "misc.challenge.wu": "同 select；WuChallenge 为 mod 追加项",
  "misc.meloetta": "onMeloettaWaveStart 在波次开始被动触发（registerMeloettaSystem 已接线）",
  "misc.manaphy": "manaphy 系效果在战斗内被动触发（registerSeaGuardSystem 已接线）",
};
for (const sys of CATALOG) {
  for (const pt of sys.points) {
    if (EVIDENCE_ONLY[pt.id] && !pt.routeEvidence) pt.routeEvidence = EVIDENCE_ONLY[pt.id];
  }
}

// 应用覆盖：把定性写回每个 point（保持逐点数据在 point 上，便于 H-2/E-3 消费）
for (const sys of CATALOG) {
  for (const pt of sys.points) {
    const ov = ROUTE_OVERRIDES[pt.id];
    if (ov) Object.assign(pt, ov);
  }
}

/** 定性汇总（`--validate` / `--systems` 用） */
export function routeReliabilityStats() {
  const by = { verified: 0, derived: 0, unreachable: 0, unknown: 0 };
  const unreachableKinds = {};
  for (const sys of CATALOG) {
    for (const p of sys.points) {
      by[p.routeReliability] = (by[p.routeReliability] ?? 0) + 1;
      if (p.routeReliability === "unreachable") {
        const k = p.unreachableKind ?? "unspecified";
        unreachableKinds[k] = (unreachableKinds[k] ?? 0) + 1;
      }
    }
  }
  return { by, unreachableKinds };
}

// ---------------------------------------------------------------------------
// 查询 / 统计
// ---------------------------------------------------------------------------

export function getSystem(id) {
  const s = CATALOG.find((x) => x.id === id);
  if (!s) throw new Error(`未知系统：${id}（可用 ${CATALOG.map((x) => x.id).join(" / ")}）`);
  return s;
}

export function listSystems() {
  return CATALOG.map((s) => ({
    id: s.id,
    code: s.code,
    label: s.label,
    points: s.points.length,
    derived: s.points.filter((p) => p.routeReliability === "derived").length,
    unreachable: s.points.filter((p) => p.routeReliability === "unreachable").length,
    unknown: s.points.filter((p) => p.routeReliability === "unknown").length,
  }));
}

export function allPoints() {
  return CATALOG.flatMap((s) => s.points.map((p) => ({ ...p, system: s.id })));
}

export function catalogStats() {
  const total = CATALOG.reduce((n, s) => n + s.points.length, 0);
  const verified = CATALOG.reduce((n, s) => n + s.points.filter((p) => p.reachability === "verified").length, 0);
  const byReliability = { verified: 0, derived: 0, unreachable: 0, unknown: 0 };
  for (const s of CATALOG) for (const p of s.points) byReliability[p.routeReliability] = (byReliability[p.routeReliability] ?? 0) + 1;
  const gated = CATALOG.reduce((n, s) => n + s.points.filter((p) => !!p.gate).length, 0);
  return { systems: CATALOG.length, total, verified, designed: total - verified, byReliability, gated, ungated: total - gated };
}

export default CATALOG;
