/**
 * 走查场景注册表。
 * F-12（走查用例设计）产出的 catalog 会逐步扩充到这里。
 */
import boot from "./boot.mjs";
import inputSmoke from "./input-smoke.mjs";
import saveInject from "./save-inject.mjs";
import catalog from "./catalog-scenario.mjs";

/** @type {Record<string, object>} */
export const SCENARIOS = {
  boot,
  "input-smoke": inputSmoke,
  "save-inject": saveInject,
  catalog,
};

export function getScenario(id) {
  const s = SCENARIOS[id];
  if (!s) throw new Error(`未知场景：${id}（可选 ${Object.keys(SCENARIOS).join(" / ")}）`);
  return s;
}

export function listScenarios() {
  return Object.values(SCENARIOS).map((s) => ({ id: s.id, label: s.label, system: s.system }));
}
