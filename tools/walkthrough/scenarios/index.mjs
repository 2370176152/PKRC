/**
 * 走查场景注册表。
 * F-12（用例设计）→ F-14（场景实现）：catalog 的 12 个系统各有一个独立场景 `sys-<id>`。
 */
import boot from "./boot.mjs";
import inputSmoke from "./input-smoke.mjs";
import saveInject from "./save-inject.mjs";
import catalog from "./catalog-scenario.mjs";
import { SYSTEM_SCENARIOS } from "./system-scenario.mjs";

/** @type {Record<string, object>} */
export const SCENARIOS = {
  // 基础设施场景（F-10）
  boot,
  "input-smoke": inputSmoke,
  "save-inject": saveInject,
  // 目录驱动器（需 --system）
  catalog,
  // F-14：12 个按系统场景（sys-boot / sys-talent / …）
  ...SYSTEM_SCENARIOS,
};

export function getScenario(id) {
  const s = SCENARIOS[id];
  if (!s) throw new Error(`未知场景：${id}（可选 ${Object.keys(SCENARIOS).join(" / ")}）`);
  return s;
}

export function listScenarios() {
  return Object.values(SCENARIOS).map((s) => ({ id: s.id, label: s.label, system: s.system }));
}
