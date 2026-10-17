/**
 * 场景：存档注入能力（walkthrough:save-inject）
 * 证明 F-10 具备「**在页面脚本执行之前**写入 localStorage」的能力 ——
 * 这是走查直达目标场景的关键：真实存档（`data_<user>` / `settings` /
 * `mappingConfigs` / session 键）与本次探针走的是**同一条通道**
 * （`Page.addScriptToEvaluateOnNewDocument`）。
 *
 * 本场景用哨兵键验证通道，并确认注入**不干扰**游戏正常启动
 * （避免"为了注入把游戏搞挂"的假阴性）。
 */
export default {
  id: "save-inject",
  label: "存档注入通道验证",
  system: "启动 / 存档",
  arrival: "导航前注入哨兵键值；页面加载后回读，并确认游戏仍正常启动",
  async steps(ctx) {
    const s = ctx.session;

    // 回读哨兵：能读到 ⇒ 注入确在页面脚本之前生效
    const sentinel = await s.evaluate("localStorage.getItem('__wt_probe__')");
    ctx.check("注入在页面脚本前生效", sentinel === "ok", `回读值 = ${JSON.stringify(sentinel)}`);

    const allKeys = await s.evaluate("JSON.stringify(Object.keys(localStorage))");
    ctx.state.localStorageKeys = JSON.parse(allKeys || "[]");
    ctx.check("localStorage 可枚举", Array.isArray(ctx.state.localStorageKeys), `现有 ${ctx.state.localStorageKeys.length} 个键`);

    // 注入不得破坏启动
    const ready = await ctx.waitReady({ timeout: 30_000 });
    ctx.setReady(ready);
    await ctx.shot("00-after-inject");
    ctx.check("注入后游戏仍能启动", ready.ready, `stdDev=${ready.stats?.stdDev}`);
    ctx.check("注入后无未捕获异常", s.pageErrors.length === 0, s.pageErrors.slice(0, 2).map((e) => String(e).split("\n")[0]).join(" ｜ "));
  },
};
