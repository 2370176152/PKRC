/**
 * 场景：画面级全量走查（由 F-12 的 catalog 驱动）
 * ---------------------------------------------------------------------------
 * 一个系统 = 一次会话：boot 一次，然后**顺序**遍历该系统的所有画面点
 * （到达 → 稳定 → 截图 → 断言）。比「一个点一个浏览器」高效得多，
 * 也保证同一系统内各点的**前置状态一致**。
 *
 * 用法：node tools/walkthrough/cli.mjs --scenario catalog --system talent --product both
 */
import { getSystem, listSystems, catalogStats } from "./catalog.mjs";

export default {
  id: "catalog",
  label: "画面级全量走查（按系统）",
  system: "多系统（F-12 catalog）",
  arrival: "按 catalog 逐点到达 → 等稳定 → 截图 → 断言；同一会话内顺序执行",
  async steps(ctx) {
    const systemId = ctx.options.system;
    if (!systemId) {
      throw new Error(
        "catalog 场景需要 --system <id>；可用：" +
          listSystems()
            .map((s) => `${s.id}(${s.points}点)`)
            .join(" / "),
      );
    }
    const sys = getSystem(systemId);
    const stats = catalogStats();
    ctx.log(`系统 ${sys.id}（${sys.label}）共 ${sys.points.length} 个画面点；catalog 合计 ${stats.total} 点（verified ${stats.verified} / designed ${stats.designed}）`);

    const ready = await ctx.waitReady({ timeout: 30_000 });
    ctx.setReady(ready);
    ctx.check(`前置：产物启动就绪`, ready.ready, `stdDev=${ready.stats?.stdDev}`);
    if (!ready.ready) {
      ctx.log("产物未就绪 ⇒ 该系统的画面点无法遍历（这本身就是要报告的结果）");
      ctx.check(`${sys.id}：画面点可遍历`, false, "前置未满足，全部点为「未验证」");
      return;
    }
    await ctx.settle({ timeout: 15_000 });

    let pointPass = 0;
    let pointFail = 0;
    for (const pt of sys.points) {
      const errsBefore = ctx.session.pageErrors.length;
      // 到达
      for (const k of pt.keys || []) {
        await ctx.session.press(k);
        await delay(200);
      }
      // 稳定（失败不致命：某些画面本身就是动画）
      let settle = { stable: false, diffRatio: null };
      try {
        settle = await ctx.settle({ timeout: 6000, maxDiffRatio: 0.04 });
      } catch {
        /* ignore */
      }
      await ctx.shot(pt.id);

      // 断言
      const details = [];
      let pass = true;
      for (const a of pt.asserts || []) {
        try {
          if (a.kind === "noNewErrors") {
            const added = ctx.session.pageErrors.length - errsBefore;
            if (added > 0) {
              pass = false;
              details.push(`新增异常 ${added}`);
            }
          } else if (a.kind === "expr") {
            const v = await ctx.session.evaluate(a.expr);
            if (!v) {
              pass = false;
              details.push(`断言未过：${a.expr}`);
            }
          } else if (a.kind === "visual") {
            details.push("已录图");
          }
        } catch (err) {
          pass = false;
          details.push(`断言异常：${err.message}`);
        }
      }
      details.push(`稳定性 ${settle.stable ? ((settle.diffRatio ?? 0) * 100).toFixed(2) + "%" : "未稳定"}`);
      details.push(pt.reachability === "verified" ? "可达性：已验证" : "可达性：**待实测确认**");
      ctx.point(`[${sys.id}] ${pt.label}`, pass, details.join("；"));
      if (pass) pointPass++;
      else pointFail++;
    }
    ctx.state.catalog = { system: sys.id, points: sys.points.length, pass: pointPass, fail: pointFail };
    ctx.check(`${sys.id}：全部画面点检查通过`, pointFail === 0, `通过 ${pointPass} / ${sys.points.length}`);
  },
};

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
