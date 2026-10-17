/**
 * 场景：启动 → 画面就绪（walkthrough:boot）
 * 这是所有其他场景的前置：先证明「产物能启动并渲染出内容」。
 */
export default {
  id: "boot",
  label: "启动 → 画面就绪",
  system: "启动 / 加载",
  arrival: "打开根 URL，等待客户端 boot 完成；再等画面稳定（连续两帧变化率 <2%）后截图",
  async steps(ctx) {
    const ready = await ctx.waitReady({ timeout: 30_000 });
    ctx.setReady(ready);
    ctx.check("画面就绪（非黑屏）", ready.ready, `帧亮度标准差 ${ready.stats?.stdDev}（阈值 8），用时 ${ready.elapsedMs}ms`);

    // 稳定捕获点：splash 过渡结束后再截图，保证 A/B 可比
    const settled = ready.ready ? await ctx.settle({ timeout: 15_000 }) : { stable: false, diffRatio: null };
    ctx.state.settle = { stable: settled.stable, diffRatio: settled.diffRatio };
    await ctx.shot("00-boot");
    ctx.check(
      "捕获点已稳定（连续帧变化率 ≤2%）",
      settled.stable,
      settled.stable ? `帧间变化率 ${((settled.diffRatio ?? 0) * 100).toFixed(2)}%` : "超时未稳定（以最后一帧为准）",
    );

    ctx.check("帧内容非单色", (ready.stats?.distinctColors ?? 0) > 8, `distinctColors=${ready.stats?.distinctColors}`);

    const s = ctx.session;
    ctx.check(
      "无未捕获异常",
      s.pageErrors.length === 0,
      s.pageErrors.slice(0, 3).map((e) => String(e).split("\n")[0]).join(" ｜ "),
    );
    ctx.check("无控制台 error", s.consoleErrors.length === 0, s.consoleErrors.slice(0, 3).join(" ｜ "));
    ctx.check("无 5xx 服务器错误", s.httpErrors.filter((e) => e.status >= 500).length === 0);

    // 缺失资源（信息性）：走查要暴露「资源补全」缺口（B-9 / A5-01b）
    const missingUrls = s.httpErrors.filter((e) => e.status === 404).map((e) => e.url);
    ctx.state.missingResources = missingUrls;
    ctx.check(
      "无缺失资源（404）",
      missingUrls.length === 0,
      `缺失 ${missingUrls.length} 项` + (missingUrls.length ? "，例：" + missingUrls.slice(0, 3).map(shortUrl).join("、") : ""),
    );

    ctx.check("DOM 已挂载 canvas", await s.evaluate("!!document.querySelector('canvas')"));
  },
};

function shortUrl(u) {
  try {
    return new URL(u).pathname;
  } catch {
    return u;
  }
}
