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

/** @type {Record<string, object>} */
export const SYSTEM_SCENARIOS = Object.fromEntries(
  CATALOG.map((sys) => [`sys-${sys.id}`, makeSystemScenario(sys)]),
);

export default SYSTEM_SCENARIOS;
