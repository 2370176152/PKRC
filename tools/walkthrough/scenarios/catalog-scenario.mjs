/**
 * 场景：画面级全量走查（由 F-12 catalog + F-14 route/gate + U-11 judgement 驱动）
 * ---------------------------------------------------------------------------
 * 一个系统 = 一次会话：boot 一次，然后**顺序**遍历该系统的所有画面点。
 *
 * F-14 的三处升级（相对 F-12 版本）：
 *   ① **真正导航**：用 `lib/route.mjs` 的步骤数组到达，而不是「什么都不做直接截图」。
 *   ② **闸门前置**：先查 `lib/gates.mjs` —— 该画面在本产物里有没有实现。
 *      未实现 ⇒ 记 `blocked`（迁移缺口，进台账），**不当成走查失败**。
 *   ③ **多态裁定**：pass / fail / unproven / unreached / unreachable / blocked —— 替代原来的二元 pass/fail。
 *
 * 裁定口径（务必与 P5-R3 / P5-R5 对齐）：
 *   blocked    产物里没有这个画面的代码（gate 未命中）→ 迁移缺口，**不是**走查结论
 *   unreached  gate 命中，但 route 没能证明「到达」（画面没变化 / 步骤报错）→ 待 A4-01 补路径
 *   unproven   route 跑完且断言过，但**到达证明不充分**（只有「画面变了」这种弱证明，
 *              或断言只有页面级 canvas/异常）⇒ **不能声称已走查该画面**，须 A4-01 用强证据确认
 *   fail       到达了，但断言不过 / 新增未捕获异常 → 真缺陷，逐条裁定
 *   pass       到达**有强证据**（DOM 断言或已实测 verified）+ 断言过
 *
 * 为什么必须单独有 `unproven`（最容易造假的地方）：
 *   Phaser canvas 里的文本读不到（U-11 已记），所以「按了几下键 + 画面变了」并不等于
 *   「到了那个界面」。若把它记成 pass，就等于用「弱证明」冒充「已走查」——
 *   这正是 O-8「可编译 ≠ 功能等价」的同类错误。
 *
 * 用法：
 *   node tools/walkthrough/cli.mjs --scenario catalog --system talent --product both
 *   node tools/walkthrough/cli.mjs --scenario sys-talent --product both     # 同一逻辑的按系统别名
 */
import { getSystem, listSystems, catalogStats } from "./catalog.mjs";
import { runRoute } from "../lib/route.mjs";
import { productCorpus, evaluateGate } from "../lib/gates.mjs";
import { JUDGEMENTS } from "../lib/judgement.mjs";

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

export const VERDICTS = ["pass", "fail", "unproven", "unreached", "blocked"];

/**
 * 注入的是**真存档**吗？
 * 只有真正的存档键（`data_*` / `sessionData` / `mappingConfigs` / `settings`）才能
 * 保证「游戏起来就在那个场景」。仅注入哨兵键（如 `--inject '{"__wt_probe__":"ok"}'`）
 * **不构成到达证明** —— 那只是验证了注入通道，游戏仍停在标题页。
 */
const SAVE_KEY_RE = /^(data_|sessionData|mappingConfigs|settings)/;
function hasRealSaveInject(map) {
  if (!map || typeof map !== "object") return false;
  return Object.keys(map).some((k) => SAVE_KEY_RE.test(k));
}

/**
 * 到达证明强度，从强到弱：
 *   inject        通过 `--inject` 注入「已处于该场景」的存档 ⇒ 到达由存档状态保证
 *                 （这是 A4-01 的**正常形态**；前提是存档确实在该场景，须与存档来源一并记入证据）
 *   dom           页面可读断言命中（仅 HTML 模块，如 legendary-popup）
 *   weak          只有「画面变了」这类弱证明
 *   none-verified 无导航但已实测可达（如 boot.ready：打开即到位）
 *   none          什么都没有
 */
function reachProofOf(route, reliability, hasInject) {
  const isInjectBased = Array.isArray(route) && route.some((s) => s && s.t === "note" && String(s.msg).startsWith("@requiresInject"));
  if (isInjectBased && hasInject) return "inject";
  if (!Array.isArray(route) || route.length === 0) {
    return reliability === "verified" ? "none-verified" : "none";
  }
  if (route.some((s) => s && s.t === "waitFor")) return "dom";
  if (route.some((s) => s && s.t === "change")) return "weak";
  return reliability === "verified" ? "none-verified" : "none";
}

/**
 * 走一个系统的全部画面点。
 * @param {object} ctx runner 上下文
 * @param {string} systemId
 */
export async function walkSystem(ctx, systemId) {
  const sys = getSystem(systemId);
  const stats = catalogStats();
  ctx.log(`系统 ${sys.id}（${sys.label}）共 ${sys.points.length} 个画面点；catalog 合计 ${stats.total} 点`);

  // ── 闸门：先看该产物有没有这些画面的实现 ─────────────────────────────
  const corpus = productCorpus(ctx.product);
  ctx.log(`产物 ${ctx.product} 语料：${corpus.files.map((f) => `${f.file}(${f.size}B)`).join(" + ")}，共 ${corpus.bytes} 字符`);

  const gated = sys.points.map((pt) => ({ pt, gate: evaluateGate(corpus, pt.gate) }));
  const blockedCount = gated.filter((x) => !x.gate.present).length;
  // 信息性汇总：blocked 是**迁移缺口**（进台账），不是走查失败 ⇒ 用 check(…, true, …) 只留证据
  ctx.check(
    `[${sys.id}] 闸门：${sys.points.length - blockedCount}/${sys.points.length} 点在本产物中有实现`,
    true,
    blockedCount === 0 ? "全部命中" : `⛔ ${blockedCount} 点无实现 ⇒ 逐点记 blocked（迁移缺口，非走查失败）`,
  );

  // ── 启动就绪 ─────────────────────────────────────────────────────────
  const ready = await ctx.waitReady({ timeout: 30_000 });
  ctx.setReady(ready);
  ctx.check(`前置：产物启动就绪`, ready.ready, `stdDev=${ready.stats?.stdDev}`);
  if (!ready.ready) {
    ctx.log("产物未就绪 ⇒ 无法遍历任何画面点（这本身就是要报告的结果）");
    for (const { pt, gate } of gated) {
      if (gate.present) {
        ctx.point(`[${sys.id}] ${pt.label}`, false, "前置未满足：产物启动未就绪");
      } else {
        ctx.blocked(`[${sys.id}] ${pt.label}`, `blocked：${gate.reason}`);
      }
    }
    ctx.state.catalog = {
      system: sys.id,
      label: sys.label,
      ready: false,
      total: sys.points.length,
      counts: tally(gated.map((g) => ({ verdict: g.gate.present ? "fail" : "blocked" }))),
      records: gated.map(({ pt, gate }) => ({
        id: pt.id,
        label: pt.label,
        verdict: gate.present ? "fail" : "blocked",
        reason: gate.present ? "产物启动未就绪" : gate.reason,
        class: JUDGEMENTS[pt.id]?.class ?? null,
        reachProof: null,
      })),
    };
    return;
  }
  await ctx.settle({ timeout: 15_000 });

  // ── 逐点 ─────────────────────────────────────────────────────────────
  /** @type {Array<object>} */
  const records = [];
  for (const { pt, gate } of gated) {
    const j = JUDGEMENTS[pt.id] || null;
    const asserts = j?.asserts ?? pt.asserts ?? [];

    if (!gate.present) {
      ctx.blocked(`[${sys.id}] ${pt.id} ${pt.label}`, `blocked：${gate.reason}${j ? ` ｜ 类别 ${j.class}` : ""}`);
      records.push({ id: pt.id, label: pt.label, verdict: "blocked", reason: gate.reason, class: j?.class ?? null, ai: !!j?.ai, keyFrame: !!j?.keyFrame });
      continue;
    }

    // H-8：已明确定性为「本框架不可自动到达」的点 —— 不去假装能到
    if (pt.routeReliability === "unreachable") {
      const reason = `已定性不可自动到达（${pt.unreachableKind}）：${pt.routeEvidence}`;
      ctx.blocked(`[${sys.id}] ${pt.id} ${pt.label}`, `unreachable：${pt.unreachableKind}`);
      records.push({
        id: pt.id,
        label: pt.label,
        verdict: "unreachable",
        reason,
        unreachableKind: pt.unreachableKind,
        class: j?.class ?? null,
        ai: !!j?.ai,
        keyFrame: !!j?.keyFrame,
        reachProof: "none",
      });
      continue;
    }

    const errsBefore = ctx.session.pageErrors.length;

    // 到达
    const route = Array.isArray(pt.route) ? pt.route : [];
    const hasInject = hasRealSaveInject(ctx.options && ctx.options.injectLocalStorage);
    const proof = reachProofOf(route, pt.routeReliability, hasInject);
    let reach = { ok: true, reason: "", failedAt: null, steps: [] };
    if (route.length) {
      reach = await runRoute(ctx, route, { url: ctx.url });
    }

    if (!reach.ok) {
      // 到达失败：仍截图留证（这张图是「没到达」的证据，不是该画面的证据）
      try {
        await ctx.shot(`${pt.id}__unreached`);
      } catch {
        /* ignore */
      }
      ctx.point(`[${sys.id}] ${pt.id} ${pt.label}`, false, `unreached（route 第 ${reach.failedAt} 步）：${reach.reason}`);
      records.push({
        id: pt.id,
        label: pt.label,
        verdict: "unreached",
        reason: reach.reason,
        failedAt: reach.failedAt,
        routeReliability: pt.routeReliability,
        reachProof: proof,
        class: j?.class ?? null,
        ai: !!j?.ai,
        keyFrame: !!j?.keyFrame,
      });
      continue;
    }

    // 稳定 + 截图（动画类不因 settle 失败而判错 —— U-11 的 keyFrame 策略）
    let settleInfo = { stable: false, diffRatio: null };
    try {
      settleInfo = await ctx.settle({ timeout: j?.keyFrame ? 3000 : 6000, maxDiffRatio: 0.04 });
    } catch {
      /* ignore */
    }
    await ctx.shot(pt.id);

    // 断言
    const details = [];
    let pass = true;
    for (const a of asserts) {
      try {
        if (a.kind === "noNewErrors") {
          const added = ctx.session.pageErrors.length - errsBefore;
          if (added > 0) {
            pass = false;
            details.push(`新增未捕获异常 ${added}：${String(ctx.session.pageErrors[errsBefore]).split("\n")[0]}`);
          }
        } else if (a.kind === "expr") {
          const v = await ctx.session.evaluate(a.expr);
          if (!v) {
            pass = false;
            details.push(`断言未过：${a.expr}`);
          }
        } else if (a.kind === "visual") {
          details.push("已录图（视觉判定走 A/B diff）");
        }
      } catch (err) {
        pass = false;
        details.push(`断言异常：${err.message}`);
      }
    }

    // 到达证明强度 —— 决定能不能称「已走查这个画面」
    const strongReach = proof === "dom" || proof === "inject" || proof === "none-verified" || pt.routeReliability === "verified";
    if (j?.keyFrame && !settleInfo.stable) details.push("keyFrame：动画点不要求稳定");
    else details.push(`稳定性 ${settleInfo.stable ? ((settleInfo.diffRatio ?? 0) * 100).toFixed(2) + "%" : "未稳定"}`);
    details.push(`到达证明 ${proof}`);
    if (j) details.push(`U-11 类别 ${j.class}${j.ai ? "·灰区送 AI" : ""}`);

    if (!pass) {
      ctx.point(`[${sys.id}] ${pt.id} ${pt.label}`, false, details.join("；"));
      records.push({
        id: pt.id,
        label: pt.label,
        verdict: "fail",
        reason: details.filter((d) => d.startsWith("断言") || d.startsWith("新增")).join("；"),
        class: j?.class ?? null,
        ai: !!j?.ai,
        keyFrame: !!j?.keyFrame,
        routeReliability: pt.routeReliability,
        reachProof: proof,
        settle: settleInfo,
      });
      continue;
    }

    if (!strongReach) {
      details.push("⚠️ 到达未证实（弱证明）—— 不得据此声称该画面已走查，须 A4-01 用强证据确认");
      ctx.point(`[${sys.id}] ${pt.id} ${pt.label}`, true, details.join("；"));
      records.push({
        id: pt.id,
        label: pt.label,
        verdict: "unproven",
        reason: `route 可靠性 ${pt.routeReliability} + 到达证明 ${proof}（画面变化不足以证明到了目标界面）`,
        class: j?.class ?? null,
        ai: !!j?.ai,
        keyFrame: !!j?.keyFrame,
        routeReliability: pt.routeReliability,
        reachProof: proof,
        settle: settleInfo,
      });
      continue;
    }

    ctx.point(`[${sys.id}] ${pt.id} ${pt.label}`, true, details.join("；"));
    records.push({
      id: pt.id,
      label: pt.label,
      verdict: "pass",
      reason: "",
      class: j?.class ?? null,
      ai: !!j?.ai,
      keyFrame: !!j?.keyFrame,
      routeReliability: pt.routeReliability,
      reachProof: proof,
      settle: settleInfo,
    });
  }

  const counts = tally(records);
  ctx.state.catalog = { system: sys.id, label: sys.label, ready: true, total: sys.points.length, counts, records };
  ctx.check(
    `[${sys.id}] 走查完成（pass ${counts.pass} / fail ${counts.fail} / unproven ${counts.unproven} / unreached ${counts.unreached} / unreachable ${counts.unreachable} / blocked ${counts.blocked}）`,
    counts.fail === 0 && counts.unreached === 0,
    `blocked = 产物无该画面（迁移缺口，进 L2/L3）；unreachable = 已定性不可自动到达（H-8）；unproven = 到达未证实（须 A4-01 补强）；三者均不计走查失败`,
  );
}

function tally(records) {
  const c = { pass: 0, fail: 0, unproven: 0, unreached: 0, unreachable: 0, blocked: 0 };
  for (const r of records) c[r.verdict] = (c[r.verdict] ?? 0) + 1;
  return c;
}

export default {
  id: "catalog",
  label: "画面级全量走查（按系统）",
  system: "多系统（F-12 catalog + F-14 route/gate + U-11 judgement）",
  arrival: "按 catalog 逐点：闸门判定 → route 导航 → 等稳定 → 截图 → 断言；同一会话内顺序执行",
  async steps(ctx) {
    const systemId = ctx.options.system;
    if (!systemId) {
      throw new Error(
        "catalog 场景需要 --system <id>；可用：" + listSystems().map((s) => `${s.id}(${s.points}点)`).join(" / "),
      );
    }
    await walkSystem(ctx, systemId);
  },
};
