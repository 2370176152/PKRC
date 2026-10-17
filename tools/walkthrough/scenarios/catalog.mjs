/**
 * PKRC · F-12 走查用例目录（画面级清单，机读）
 * ---------------------------------------------------------------------------
 * 依据：O-9b「**逐系统确认全部画面**（画面级全量，不接受用『全部系统』偷换）」。
 *
 * 每个检查点（point）包含四要素（F-12 验收 ②）：
 *   · arrival      —— 如何到达（文字 + 可执行 keys）
 *   · asserts      —— 断言什么（状态/数值 / 视觉 / 不得新增异常）
 *   · expect       —— 期望结果
 *   · judgement    —— 判定方式（assert / diff / ai），对应 O-9b 三级判据
 *
 * `reachability`：
 *   · "verified"  —— 本环境已实测可达（有证据）
 *   · "designed"  —— 依据系统清单/代码设计，**待 A4-01 实测确认或修正**
 *
 * 被 F-10 直接消费：`node tools/walkthrough/cli.mjs --scenario catalog --system <id>`
 */

export const CATALOG_VERSION = 1;

/** 断言构造糖 */
const visual = (expect) => ({ kind: "visual", expect, judgement: "diff" });
const noNewErrors = (expect = "与上一检查点相比，未新增未捕获异常") => ({ kind: "noNewErrors", expect, judgement: "assert" });
const expr = (e, expect) => ({ kind: "expr", expr: e, expect, judgement: "assert" });

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
        keys: [],
        reachability: "verified",
        asserts: [visual("标题/加载画面正常渲染，非黑屏"), noNewErrors(), expr("!!document.querySelector('canvas')", "canvas 已挂载")],
      },
      {
        id: "boot.welcome-popup",
        label: "首次启动欢迎弹窗",
        arrival: "就绪后等待 splash 淡出，主菜单上的欢迎弹窗（中文文案）稳定",
        keys: [],
        reachability: "verified",
        asserts: [
          expr("document.body.innerText.length > 0", "存在 DOM 文本（弹窗）"),
          visual("弹窗标题/按钮文案与 A 版一致"),
          noNewErrors(),
        ],
      },
      { id: "boot.lang-select", label: "语言选择界面", arrival: "主菜单 → 设置 → 语言（按键序列待实测补全）", keys: [], reachability: "designed", asserts: [visual("语言列表渲染"), noNewErrors()] },
    ],
  },
  {
    id: "talent",
    code: "TALENT",
    label: "天赋",
    note: "含年代天赋（冰河/石器/工业/信息/图腾）与星象、一剑清源。当前有 24 处 declare 悬空（见 P0 清单）。",
    points: [
      { id: "talent.codex", label: "天赋图鉴界面", arrival: "主菜单 → 天赋图鉴", keys: [], reachability: "designed", asserts: [visual("图鉴网格 + 天赋卡片"), expr("document.body.innerText.includes('天赋')", "界面含『天赋』字样"), noNewErrors()] },
      { id: "talent.shop", label: "天赋商店", arrival: "主菜单 → 商店 → 天赋商店（showTalentShop）", keys: [], reachability: "designed", asserts: [visual("商店条目 + 价格"), noNewErrors()] },
      { id: "talent.acquire-toast", label: "天赋获取提示", arrival: "游戏内获得天赋后弹出提示", keys: [], reachability: "designed", asserts: [visual("获取提示文本/图标"), noNewErrors()] },
      { id: "talent.runtime-hud", label: "战斗内天赋 HUD", arrival: "进入战斗，观察右上/角落运行时 HUD（setTalentRuntimeHudText）", keys: [], reachability: "designed", asserts: [visual("HUD 文本与 A 版一致"), noNewErrors()] },
      { id: "talent.age.ice", label: "冰河期天赋触发", arrival: "携带冰河期天赋进入战斗并命中（POST_TARGET）", keys: [], reachability: "designed", asserts: [visual("AOE 结算 + 播报"), noNewErrors()] },
      { id: "talent.age.stone", label: "石器时代天赋触发", arrival: "同冰河期，换石器时代", keys: [], reachability: "designed", asserts: [visual("AOE 结算 + 播报"), noNewErrors()] },
      { id: "talent.age.industrial", label: "工业时代天赋触发", arrival: "同冰河期，换工业时代", keys: [], reachability: "designed", asserts: [visual("AOE 结算 + 播报"), noNewErrors()] },
      { id: "talent.age.info", label: "信息时代天赋触发", arrival: "同冰河期，换信息时代", keys: [], reachability: "designed", asserts: [visual("AOE 结算 + 播报"), noNewErrors()] },
      { id: "talent.age.totem", label: "图腾时代天赋触发", arrival: "同冰河期，换图腾时代", keys: [], reachability: "designed", asserts: [visual("AOE 结算 + 播报"), noNewErrors()] },
      { id: "talent.xingxiang", label: "星象切换", arrival: "触发星象切换（switchXingxiang），观察播报与状态", keys: [], reachability: "designed", asserts: [visual("播报文本『的星象切换为【…】！』"), noNewErrors()] },
      { id: "talent.yijianqingyuan", label: "一剑清源", arrival: "携带一剑清源天赋进入战斗", keys: [], reachability: "designed", asserts: [visual("增伤表现"), noNewErrors()] },
    ],
  },
  {
    id: "eryou",
    code: "ERYOU",
    label: "二游养成（深渊）",
    points: [
      { id: "eryou.synthesis", label: "合成界面", arrival: "主菜单 → 二游养成 → 合成（EryouSynthesisUiHandler）", keys: [], reachability: "designed", asserts: [visual("合成台 + 素材槽"), noNewErrors()] },
      { id: "eryou.battle", label: "深渊战斗", arrival: "进入深渊战斗场景", keys: [], reachability: "designed", asserts: [visual("战斗画面 + 深渊 UI"), noNewErrors()] },
      { id: "eryou.shop", label: "深渊商店", arrival: "深渊内商店", keys: [], reachability: "designed", asserts: [visual("商品列表"), noNewErrors()] },
      { id: "eryou.abyss-buff", label: "深渊攻击加成（abyssAttackBuffMultiplier）", arrival: "深渊中触发攻击加成", keys: [], reachability: "designed", asserts: [visual("加成数值显示"), noNewErrors()] },
    ],
  },
  {
    id: "pt-soudache",
    code: "PT_SOUDACHE",
    label: "搜打撤",
    points: [
      { id: "pt.start", label: "PT 模式开始界面", arrival: "主菜单 → 搜打撤（PtSoudacheStartPhase）", keys: [], reachability: "designed", asserts: [visual("开始界面"), noNewErrors()] },
      { id: "pt.shop", label: "PT 商店", arrival: "PT 内商店（PtSoudacheShopPhase）", keys: [], reachability: "designed", asserts: [visual("商店条目"), noNewErrors()] },
      { id: "pt.settle", label: "PT 结算", arrival: "完成 PT 一轮后的结算界面", keys: [], reachability: "designed", asserts: [visual("结算数值（每级 PT 收益按波次分档）"), noNewErrors()] },
    ],
  },
  {
    id: "jieming",
    code: "JIEMING",
    label: "解明",
    points: [
      { id: "jieming.shield", label: "解明盾", arrival: "进入战斗并触发解明盾", keys: [], reachability: "designed", asserts: [visual("盾层数/图标"), noNewErrors()] },
      { id: "jieming.skill", label: "解明招式演出", arrival: "使用解明招式（海之守护等）", keys: [], reachability: "designed", asserts: [visual("动画（jieming-anims chunk）"), noNewErrors()] },
      { id: "jieming.turnorder", label: "解明回合顺序条", arrival: "P5X 模式下显示回合顺序条", keys: [], reachability: "designed", asserts: [visual("顺序条 UI"), noNewErrors()] },
    ],
  },
  {
    id: "healer",
    code: "HEALER",
    label: "治疗 / 守护",
    points: [
      { id: "healer.wish", label: "治疗祈愿", arrival: "触发 HealerWishPhase", keys: [], reachability: "designed", asserts: [visual("祈愿界面"), noNewErrors()] },
      { id: "healer.seaguard", label: "海之守护铺层", arrival: "战斗开始（`applySeaGuardOpening`）", keys: [], reachability: "designed", asserts: [visual("守护铺层表现 + 播报"), noNewErrors()] },
    ],
  },
  {
    id: "nianli",
    code: "NIANLI",
    label: "念力",
    points: [
      { id: "nianli.stacks", label: "念力层数 HUD", arrival: "战斗中获得念力层数", keys: [], reachability: "designed", asserts: [visual("层数显示"), noNewErrors()] },
      { id: "nianli.burst", label: "念力爆发结算", arrival: "触发念力爆发（NianLiBurstEndPhase）", keys: [], reachability: "designed", asserts: [visual("爆发结算 + 播报"), noNewErrors()] },
    ],
  },
  {
    id: "p5x",
    code: "P5X",
    label: "P5X 战斗",
    points: [
      { id: "p5x.turnorder", label: "P5X 回合顺序条", arrival: "P5X 模式下进入战斗（ensureP5XTurnOrderBar/updateP5XTurnOrderBar）", keys: [], reachability: "designed", asserts: [visual("顺序条 UI"), noNewErrors()] },
      { id: "p5x.turnorder.hide", label: "回合顺序条隐藏", arrival: "战斗结束（hideP5XTurnOrderBar）", keys: [], reachability: "designed", asserts: [visual("顺序条消失"), noNewErrors()] },
      { id: "p5x.effect", label: "P5X 效果触发", arrival: "触发 applyP5XEffect", keys: [], reachability: "designed", asserts: [visual("效果表现"), noNewErrors()] },
    ],
  },
  {
    id: "callingcard",
    code: "CALLINGCARD",
    label: "抽卡 / 呼符",
    points: [
      { id: "callingcard.gauge", label: "呼符计量条", arrival: "呼符累计时显示计量（CallingCardGauge）", keys: [], reachability: "designed", asserts: [visual("计量条 UI"), noNewErrors()] },
      { id: "callingcard.resolve", label: "呼符解析", arrival: "触发呼符结算（CallingCardResolvePhase）", keys: [], reachability: "designed", asserts: [visual("解析结果"), noNewErrors()] },
      { id: "callingcard.command", label: "呼符指令按钮", arrival: "命令菜单出现 CALLING_CARD 按钮", keys: [], reachability: "designed", asserts: [visual("按钮 + 刷新逻辑"), noNewErrors()] },
    ],
  },
  {
    id: "dianxin",
    code: "DIANXIN",
    label: "点心",
    points: [
      { id: "dianxin.echo", label: "点心回响结算", arrival: "触发 DianXinEchoEndPhase", keys: [], reachability: "designed", asserts: [visual("回响结算表现"), noNewErrors()] },
    ],
  },
  {
    id: "legendary-popup",
    code: "legendary-popup",
    label: "传说弹窗",
    points: [
      { id: "legendary.popup", label: "传说宝可梦弹窗", arrival: "遇到传说宝可梦时弹出（独立 chunk）", keys: [], reachability: "designed", asserts: [visual("弹窗 + 光环动效"), noNewErrors()] },
      { id: "legendary.helper", label: "传说弹窗辅助层", arrival: "弹窗动画过程中", keys: [], reachability: "designed", asserts: [visual("辅助层渲染"), noNewErrors()] },
    ],
  },
  {
    id: "misc",
    code: "—",
    label: "杂项（命座 / 超背包 / 挑战 / 场地 / 其它）",
    note: "第 11 个系统「杂项」涵盖多个独立机制，逐项单列。",
    points: [
      { id: "misc.constellation.codex", label: "命座图鉴", arrival: "主菜单 → 命座图鉴（codex 首条 id='jieming'）", keys: [], reachability: "designed", asserts: [visual("命座列表"), noNewErrors()] },
      { id: "misc.constellation.node", label: "命座节点面板", arrival: "选中某命座 → 节点面板（1/2/3/5/6 节点分布）", keys: [], reachability: "designed", asserts: [visual("节点连线 + 等级"), noNewErrors()] },
      { id: "misc.super-backpack", label: "超背包", arrival: "主菜单 → 超背包（SUPER_BACKPACK，mod 扩展模式）", keys: [], reachability: "designed", asserts: [visual("背包网格"), noNewErrors()] },
      { id: "misc.challenge.select", label: "挑战选择", arrival: "新游戏 → 挑战选择", keys: [], reachability: "designed", asserts: [visual("挑战列表"), noNewErrors()] },
      { id: "misc.challenge.same-pokemon", label: "同种宝可梦挑战", arrival: "选 SamePokemonChallenge 开局", keys: [], reachability: "designed", asserts: [visual("挑战开局状态"), noNewErrors()] },
      { id: "misc.challenge.suiji", label: "随机挑战", arrival: "选 SuijiChallenge 开局", keys: [], reachability: "designed", asserts: [visual("随机化结果"), noNewErrors()] },
      { id: "misc.challenge.triple-passive", label: "三被动挑战", arrival: "选 TriplePassiveChallenge 开局", keys: [], reachability: "designed", asserts: [visual("被动槽 ×3"), noNewErrors()] },
      { id: "misc.challenge.wu", label: "Wu 挑战", arrival: "选 WuChallenge 开局", keys: [], reachability: "designed", asserts: [visual("挑战开局状态"), noNewErrors()] },
      { id: "misc.terrain.chengfeng", label: "乘风场地", arrival: "触发 ChengfengTag", keys: [], reachability: "designed", asserts: [visual("场地表现 + 播报"), noNewErrors()] },
      { id: "misc.terrain.kongjian", label: "空间场地", arrival: "触发 KONGJIANRoomTag", keys: [], reachability: "designed", asserts: [visual("场地表现 + 播报"), noNewErrors()] },
      { id: "misc.meloetta", label: "美洛耶塔节拍", arrival: "携带美洛耶塔进入战斗（onMeloettaWaveStart）", keys: [], reachability: "designed", asserts: [visual("节拍下限表现"), noNewErrors()] },
      { id: "misc.mew", label: "梦幻", arrival: "触发梦幻相关效果", keys: [], reachability: "designed", asserts: [visual("效果表现"), noNewErrors()] },
      { id: "misc.manaphy", label: "海之守护（manaphy）", arrival: "触发 manaphy 系效果", keys: [], reachability: "designed", asserts: [visual("效果表现"), noNewErrors()] },
      { id: "misc.pt.hud", label: "PT 运行 HUD", arrival: "PT 模式下的常驻 HUD", keys: [], reachability: "designed", asserts: [visual("HUD 数值"), noNewErrors()] },
    ],
  },
];

export function getSystem(id) {
  const s = CATALOG.find((x) => x.id === id);
  if (!s) throw new Error(`未知系统：${id}（可用 ${CATALOG.map((x) => x.id).join(" / ")}）`);
  return s;
}

export function listSystems() {
  return CATALOG.map((s) => ({ id: s.id, code: s.code, label: s.label, points: s.points.length }));
}

export function catalogStats() {
  const total = CATALOG.reduce((n, s) => n + s.points.length, 0);
  const verified = CATALOG.reduce((n, s) => n + s.points.filter((p) => p.reachability === "verified").length, 0);
  return { systems: CATALOG.length, total, verified, designed: total - verified };
}

export default CATALOG;
