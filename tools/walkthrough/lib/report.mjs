/**
 * PKRC · F-10 · 证据报告生成（自包含 HTML，图片以 base64 内联）
 * 产出物是给**项目所有者复核**用的：可逐张查看 A|B 并排与 diff 结论。
 */

import fs from "node:fs";
import path from "node:path";

function esc(s) {
  return String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
}

function imgTag(file, outDir, caption) {
  const abs = path.join(outDir, file);
  if (!fs.existsSync(abs)) return `<div class="missing">缺失：${esc(file)}</div>`;
  const b64 = fs.readFileSync(abs).toString("base64");
  return `<figure><img src="data:image/png;base64,${b64}" alt="${esc(caption)}"/><figcaption>${esc(caption)}</figcaption></figure>`;
}

function checksTable(checks) {
  const rows = checks
    .map((c) => {
      const mark = c.blocked ? "⛔" : c.pass ? "✅" : "❌";
      const cls = c.blocked ? "blocked" : c.pass ? "pass" : "fail";
      return `<tr class="${cls}"><td>${mark}</td><td>${esc(c.name)}</td><td>${esc(c.detail)}</td></tr>`;
    })
    .join("");
  return `<table class="checks"><thead><tr><th>结果</th><th>检查项</th><th>说明</th></tr></thead><tbody>${rows}</tbody></table>`;
}

/** F-14 四态裁定表（pass / fail / blocked / unreached） */
function catalogBlock(productResult) {
  const cat = productResult?.state?.catalog;
  if (!cat || !cat.records) return "";
  const c = cat.counts || {};
  let html = `<h3>四态裁定 · 系统 <code>${esc(cat.system)}</code></h3>`;
  html += `<p>pass <b>${c.pass ?? 0}</b> ｜ fail <b>${c.fail ?? 0}</b> ｜ unproven <b>${c.unproven ?? 0}</b> ｜ unreached <b>${c.unreached ?? 0}</b> ｜ blocked <b>${c.blocked ?? 0}</b></p>`;
  html += `<p class="meta">blocked = 该画面在本产物中无实现（迁移缺口，进 L2/L3 台账，<b>不计走查失败</b>）；unproven = route 跑完但到达证明不足（弱证明），<b>不得据此声称已走查</b>，须 A4-01 补强证据；unreached = route 明确失败（待补路径）。</p>`;
  const rows = cat.records
    .map((r) => {
      const cls = r.verdict === "pass" ? "pass" : r.verdict === "blocked" ? "blocked" : "fail";
      const mark = { pass: "✅", fail: "❌", blocked: "⛔", unreached: "🚧", unproven: "❔" }[r.verdict] ?? "?";
      return `<tr class="${cls}"><td>${mark}</td><td><code>${esc(r.id)}</code></td><td>${esc(r.label)}</td><td>${esc(r.verdict)}</td><td>${esc(r.class ?? "-")}</td><td>${esc(r.reachProof ?? "-")}</td><td>${esc(r.reason ?? "")}</td></tr>`;
    })
    .join("");
  html += `<table class="checks"><thead><tr><th></th><th>画面点</th><th>名称</th><th>裁定</th><th>U-11 类别</th><th>到达证明</th><th>说明</th></tr></thead><tbody>${rows}</tbody></table>`;
  return html;
}

function diagBlock(d) {
  if (!d) return "<p>（无诊断数据）</p>";
  const list = (arr, fmt) => (arr.length ? `<ul>${arr.slice(0, 20).map((x) => `<li>${esc(fmt(x))}</li>`).join("")}${arr.length > 20 ? `<li>…共 ${arr.length} 条</li>` : ""}</ul>` : "<p class='ok'>无</p>");
  return `
    <h4>未捕获异常（${d.pageErrors.length}）</h4>${list(d.pageErrors, (e) => String(e).split("\n")[0])}
    <h4>控制台 error（${d.consoleErrors.length}）</h4>${list(d.consoleErrors, (e) => e)}
    <h4>HTTP 错误（${d.httpErrors.length}）</h4>${list(d.httpErrors, (e) => e.status + " " + e.url)}
    <h4>网络失败（${d.networkFailures.length}）</h4>${list(d.networkFailures, (e) => e.error + " " + e.url)}`;
}

/**
 * @param {object} report  runDualScenario / runProductScenario 的结果（或其包装）
 * @param {string} outDir
 * @param {string} htmlPath
 */
export function writeHtmlReport(report, outDir, htmlPath) {
  const isDual = !!report.results;
  const title = isDual
    ? `走查报告 · 场景「${report.scenario.label}」· A｜B 双产物对比`
    : `走查报告 · 场景「${report.scenario.label}」· 产物 ${report.productId}`;

  let body = "";

  if (isDual) {
    const { results, comparisons, scenario } = report;
    body += `<p class="meta">场景 <code>${esc(scenario.id)}</code> · 系统 <b>${esc(scenario.system)}</b> · 到达方式：${esc(scenario.arrival)}</p>`;
    body += `<p class="meta">生成时间 ${esc(report.generatedAt)}</p>`;

    body += `<h2>一、结论速览</h2>`;
    body += comparisonSummary(comparisons, results);

    body += `<h2>二、产物信息</h2><table class="checks"><thead><tr><th>产物</th><th>说明</th><th>assets 数</th><th>就绪</th><th>就绪耗时</th></tr></thead><tbody>`;
    for (const id of ["A", "B"]) {
      const r = results[id];
      body += `<tr><td><b>${id}</b></td><td>${esc(r.label)}</td><td>${esc(r.fingerprint.count)}</td><td>${r.ready ? "✅" : "❌"}</td><td>${r.readyMs ?? "-"}ms</td></tr>`;
    }
    body += `</tbody></table>`;

    body += `<h2>三、并排对比与像素 diff</h2>`;
    for (const c of comparisons) {
      const d = c.diff || {};
      body += `<h3>截图点：<code>${esc(c.shot)}</code></h3>`;
      if (d.error) {
        body += `<p class="fail">diff 失败：${esc(d.error)}</p>`;
      } else {
        body += `<p>差异率 <b>${(d.diffRatio * 100).toFixed(2)}%</b> · 差异像素 ${d.diffPixels}/${d.totalPixels} · 平均绝对差 ${d.meanAbsDiff?.toFixed(2)} · 尺寸 ${d.sizeA?.join("×")} vs ${d.sizeB?.join("×")}</p>`;
        if (d.bbox) body += `<p>差异包围盒：${JSON.stringify(d.bbox)}</p>`;
      }
      if (c.sideBySide) body += imgTag(c.sideBySide, outDir, `${c.shot} — 左 A（modder 原产物）｜右 B（自构建产物）`);
    }

    body += `<h2>四、逐产物检查与诊断</h2>`;
    for (const id of ["A", "B"]) {
      const r = results[id];
      body += `<h3>产物 ${id} — ${esc(r.label)}</h3>`;
      if (r.error) body += `<p class="fail">运行错误：${esc(r.error)}</p>`;
      body += checksTable(r.checks);
      body += catalogBlock(r);
      body += diagBlock(r.diagnostics);
      for (const s of r.shots) body += imgTag(s.file, outDir, `${id} · ${s.name}`);
    }
  } else {
    const r = report;
    body += `<p class="meta">场景 <code>${esc(r.scenario?.id)}</code> · 产物 <b>${esc(r.productId)}</b> ${esc(r.label)}</p>`;
    if (r.error) body += `<p class="fail">运行错误：${esc(r.error)}</p>`;
    body += `<h2>检查项</h2>${checksTable(r.checks)}`;
    body += catalogBlock(r);
    body += `<h2>诊断</h2>${diagBlock(r.diagnostics)}`;
    body += `<h2>截图</h2>`;
    for (const s of r.shots) body += imgTag(s.file, outDir, `${s.name}（stdDev=${s.stats?.stdDev}）`);
  }

  const html = `<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="utf-8"/>
<title>${esc(title)}</title>
<style>
  :root{color-scheme:light}
  body{font:14px/1.6 system-ui,"Segoe UI","Microsoft YaHei",sans-serif;max-width:1180px;margin:0 auto;padding:24px;background:#fff;color:#1a1a1a}
  h1{font-size:20px;border-bottom:2px solid #da3838;padding-bottom:8px}
  h2{font-size:16px;margin-top:28px;border-left:4px solid #da3838;padding-left:8px}
  h3{font-size:14px;margin-top:18px;color:#333}
  h4{font-size:13px;margin:10px 0 4px;color:#555}
  code{background:#f2f2f2;padding:1px 5px;border-radius:3px;font-family:Consolas,monospace}
  table{border-collapse:collapse;width:100%;margin:8px 0}
  th,td{border:1px solid #e2e2e2;padding:6px 8px;text-align:left;vertical-align:top}
  th{background:#fafafa}
  tr.pass td:first-child{color:#137333}
  tr.fail{background:#fff5f5}
  tr.fail td:first-child{color:#c5221f}
  tr.blocked{background:#fffbe6}
  tr.blocked td:first-child{color:#8a6d00}
  .meta{color:#666}
  .ok{color:#137333}
  .fail{color:#c5221f;font-weight:600}
  .missing{color:#c5221f;border:1px dashed #c5221f;padding:8px;border-radius:4px}
  figure{margin:12px 0;border:1px solid #e2e2e2;border-radius:6px;padding:8px;background:#fafafa}
  figure img{max-width:100%;display:block;border-radius:4px}
  figcaption{color:#666;font-size:12px;margin-top:6px}
  ul{margin:4px 0 4px 18px;padding:0}
  li{font-family:Consolas,monospace;font-size:12px;word-break:break-all}
</style></head><body>
<h1>${esc(title)}</h1>
${body}
<hr/><p class="meta">本报告由 <code>tools/walkthrough/cli.mjs</code> 生成 · 判据优先级：状态/数值断言 → 像素 diff → AI 视觉审阅（AI 审阅不得单独作通过依据）</p>
</body></html>`;

  fs.writeFileSync(htmlPath, html);
  return htmlPath;
}

function comparisonSummary(comparisons, results) {
  const rows = comparisons
    .map((c) => {
      const d = c.diff || {};
      const verdict = d.error ? "diff 失败" : d.diffRatio > 0.02 ? "存在差异（需裁定）" : "等价";
      const cls = d.error || d.diffRatio > 0.02 ? "fail" : "pass";
      return `<tr class="${cls}"><td><code>${esc(c.shot)}</code></td><td>${d.error ? "-" : (d.diffRatio * 100).toFixed(2) + "%"}</td><td>${esc(verdict)}</td></tr>`;
    })
    .join("");
  const readyA = results.A?.ready ? "✅" : "❌";
  const readyB = results.B?.ready ? "✅" : "❌";
  return `<p>启动就绪：A ${readyA} ｜ B ${readyB}</p>
  <table class="checks"><thead><tr><th>截图点</th><th>像素差异率</th><th>判定</th></tr></thead><tbody>${rows}</tbody></table>
  <p class="meta">⚠️ 像素差异 >2% 仅表示「需要人工/AI 裁定」，不等于「缺陷」；真实缺陷以①状态断言为准。</p>`;
}
