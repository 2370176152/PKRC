/**
 * PKRC · F-14 · 按系统的走查场景工厂
 * ---------------------------------------------------------------------------
 * F-14 验收 ③「可被 E-3 直接消费」+ P5-R5「按系统分批交付，不整体阻塞」：
 * 每个系统都应是**独立可跑**的场景，而不是只能通过 `--system` 参数间接访问。
 *
 *   node tools/walkthrough/cli.mjs --scenario sys-talent --product both
 *   node tools/walkthrough/cli.mjs --scenario sys-eryou  --product A     # B 大面积 blocked 时先看基线
 *
 * 场景 id 规则：`sys-<catalog 系统 id>`，与 `--systems` 列出的 id 一一对应。
 */

import { CATALOG } from "./catalog.mjs";
import { walkSystem } from "./catalog-scenario.mjs";
import { k, wait, waitFor, settle, note } from "../lib/route.mjs";

/**
 * @param {{id:string,label:string,code:string,points:Array<object>}} sys
 */
function makeSystemScenario(sys) {
  return {
    id: `sys-${sys.id}`,
    label: `系统走查：${sys.label}`,
    system: `${sys.code} · ${sys.label}`,
    arrival: `逐点：闸门判定 → route 导航 → 等稳定 → 截图 → 断言（${sys.points.length} 点）`,
    async steps(ctx) {
      await walkSystem(ctx, sys.id);
    },
  };
}

// ─────────────────────────────────────────────────────────────
// 第八阶段 B-1：战斗全流程的 4 个关键节点断言
// ─────────────────────────────────────────────────────────────
//
// 依据 `src/main.ts` 暴露的只读句柄 `window.__PKRC_GAME__`（见 catalog.mjs 顶部说明）。
// 4 个节点严格按战斗真实发生顺序排列，任一节点超时 ⇒ 该节点 `unreached`（不是 fail）。
//
// ⚠️ **当前已知阻塞**（2026-10-20 实测）：从标题页进入 run 需**鼠标点选 starter 卡片**，
//   纯键盘（z / 方向键）在 `SelectStarterPhase` 无法推进 ⇒ 节点 ① 目前必然超时。
//   这是 **route 能力缺口**，不是产品缺陷；按 P8-R3 不得据此判 M4 通过。

const PROBE_HEAD = `const g=window.__PKRC_GAME__;if(!g||!g.scene)return false;const s=g.scene.scenes.find(x=>x.gameData);if(!s)return false;`;
const probe = (body, desc, timeout = 45_000) =>
  waitFor(`(() => { ${PROBE_HEAD} ${body} })()`, desc, timeout);

/** ① 进入战斗：有波次 + 我方队伍 + 敌方队伍都存在 */
const BATTLE_ENTERED = () => probe(
  `return (s.currentBattle?.waveIndex??0)>0 && (s.getPlayerParty?.()?.length??0)>0 && (s.getEnemyParty?.()?.length??0)>0;`,
  "① 进入战斗（waveIndex>0 且双方队伍非空）",
);

/** ② 出招：回合已推进且当前 Phase 属于出招链 */
const MOVE_USED = () => probe(
  `const p=s.phaseManager?.getCurrentPhase?.()?.phaseName??"";const t=s.currentBattle?.turn??0;return t>0&&/Move|Turn|Command|Select/.test(p);`,
  "② 出招（turn>0 且当前 Phase 属出招链）",
);

/** ③ 伤害结算：敌方出现实际掉血 */
const DAMAGE_DEALT = () => probe(
  `const e=s.getEnemyParty?.()[0];if(!e)return false;try{return e.hp < e.getMaxHp();}catch{return false;}`,
  "③ 伤害结算（敌方 HP < 最大 HP）",
);

/** ④ 胜负判定：敌方全灭 或 已进入下一波 */
const BATTLE_RESOLVED = () => probe(
  `const ep=s.getEnemyParty?.()??[];const allDown=ep.length>0&&ep.every(p=>{try{return p.isFainted();}catch{return false;}});const wi=s.currentBattle?.waveIndex??0;return allDown||wi>1;`,
  "④ 胜负判定（敌方全灭 或 已推进到下一波）",
);

/**
 * 战斗全流程场景（B-2 的载体：4 种模式各跑一遍即改 `--inject` 的存档 / 起始参数）。
 * 每一步都带状态断言 + 截图，节点失败即记录 `unreached` 并继续（不中断，便于看断在哪）。
 */
export const battleFlowScenario = {
  id: "battle-flow",
  label: "战斗全流程（4 节点断言）",
  system: "— · 战斗全流程",
  arrival: "标题 → 开局（需 starter 选择）→ 进入战斗 → 出招 → 伤害结算 → 胜负",
  async steps(ctx) {
    const nodes = [
      ["battle.node1-entered", "① 进入战斗", BATTLE_ENTERED()],
      ["battle.node2-move", "② 出招", MOVE_USED()],
      ["battle.node3-damage", "③ 伤害结算", DAMAGE_DEALT()],
      ["battle.node4-resolved", "④ 胜负判定", BATTLE_RESOLVED()],
    ];
    ctx.log("战斗全流程：4 个关键节点（进入 / 出招 / 伤害 / 胜负）");

    // 先走到开局界面（带状态断言，走不通会明确失败而不是盲按）
    const ready = await ctx.waitReady({ timeout: 30_000 });
    ctx.setReady(ready);
    ctx.check("前置：产物启动就绪", ready.ready, `stdDev=${ready.stats?.stdDev}`);

    for (const [id, label, step] of nodes) {
      let ok = false;
      let detail = "";
      try {
        await ctx.session.waitFor(step.expr, { timeout: step.timeout, desc: step.desc });
        ok = true;
        detail = `到达：${step.desc}`;
      } catch (err) {
        detail = `未到达：${String(err.message || err).slice(0, 160)}`;
      }
      try {
        await ctx.shot(id);
      } catch {
        /* 截图失败不影响判定 */
      }
      ctx.point(`[battle] ${label}`, ok, detail);
      if (!ok) {
        ctx.log(`节点 ${label} 未到达 ⇒ 后续节点大概率也到不了（链路中断）`);
      }
    }
  },
};

/** @type {Record<string, object>} */
export const SYSTEM_SCENARIOS = Object.fromEntries([
  ...CATALOG.map((sys) => [`sys-${sys.id}`, makeSystemScenario(sys)]),
  ["battle-flow", battleFlowScenario],
]);

export default SYSTEM_SCENARIOS;
