/**
 * 场景：脚本化键鼠输入冒烟（walkthrough:input-smoke）
 * 证明「同一操作序列」能被 F-10 驱动，且输入经 input-arbiter 仲裁
 * （复用 F-6 语义：键盘 → 鼠标的切换冷却、同帧去重）。
 * A/B 双跑时，两侧收到**完全相同的键序与坐标**。
 */
export default {
  id: "input-smoke",
  label: "脚本化键鼠输入冒烟",
  system: "输入层（F-6 语义）",
  arrival: "启动至就绪后，依次发送方向键 / Z / X / Esc 与一次画布点击，逐步截图",
  async steps(ctx) {
    const ready = await ctx.waitReady({ timeout: 30_000 });
    ctx.setReady(ready);
    ctx.check("前置：画面就绪", ready.ready, `stdDev=${ready.stats?.stdDev}`);
    if (ready.ready) await ctx.settle({ timeout: 15_000 });
    await ctx.shot("00-before-input");

    const s = ctx.session;
    const beforeErrors = s.pageErrors.length;

    // ---- 固定操作序列（两侧必须一致）----
    const sequence = [
      { kind: "key", key: "ArrowDown" },
      { kind: "key", key: "ArrowDown" },
      { kind: "key", key: "ArrowUp" },
      { kind: "key", key: "Enter" },
      { kind: "key", key: "z" },
      { kind: "key", key: "x" },
      { kind: "key", key: "Escape" },
    ];
    const inputResults = [];
    for (const step of sequence) {
      const r = await s.press(step.key);
      inputResults.push({ ...step, ...r });
      await delay(160);
    }
    // 鼠标：移到画布中心并点击（体现「设备切换」路径）
    const box = await s.evaluate(
      "JSON.stringify((()=>{const c=document.querySelector('canvas');const r=c.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}})())",
    );
    const { x, y } = JSON.parse(box);
    const mouseResult = await s.click(x, y);
    inputResults.push({ kind: "click", x, y, ...mouseResult });

    await ctx.shot("01-after-input");

    const rejected = inputResults.filter((r) => r.accepted === false);
    const detail = rejected.length
      ? `被拒 ${rejected.length} 次：` + rejected.map((r) => r.reason).join("、")
      : `共 ${inputResults.length} 个动作全部放行`;
    ctx.check("输入序列全部被仲裁放行", rejected.length === 0, detail);
    ctx.check("输入后无新未捕获异常", s.pageErrors.length === beforeErrors, `新增 ${s.pageErrors.length - beforeErrors} 条`);

    const arb = s.arbiter.snapshot();
    ctx.state.arbiter = arb;
    ctx.check("设备标记已切换（lastDevice）", !!arb.lastDevice, `lastDevice=${arb.lastDevice}`);
    ctx.state.inputSequence = inputResults;
  },
};

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
