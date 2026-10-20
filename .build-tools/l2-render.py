#!/usr/bin/env python3
"""一次性：把 l2-ledger2.json 渲染成 Markdown 台账（I-3 交付物）。"""
import json
import os
from collections import Counter, defaultdict

ROOT = os.path.dirname(__file__)
data = json.load(open(os.path.join(ROOT, "l2-ledger2.json"), encoding="utf-8"))
rows = data["rows"]

WINDOW = {
    "mod 自研 · 真未迁": "I-4 之后 / 下一阶段（按域分批）",
    "旧上游遗留 · 无需迁": "不排期（新上游已重构，非债）",
    "待人工（上下文无特征）": "I-4 回归期人工确认",
    "待人工（产物无整词命中）": "I-4 回归期人工确认",
}

OUT = os.path.join(os.path.dirname(ROOT), "docs", "sourcemigration", "I-3-L2技术债台账.md")
lines = []
w = lines.append

w("# I-3 · L2 技术债台账（逐条）")
w("")
w("> 生成：2026-10-20 · 来源 `.build-tools/resid-not-in-src.txt`（507 个「产物有 / src 无」符号）")
w("> 判据：在 A 产物里取每符号 4×800 字符上下文，统计 mod 特征词 vs 上游特征词")
w("> 派单 40 · I-3 要求「446 项逐条（归属 / 复现路径 / 窗口）· 不允许『~291 其余』整块」")
w("")
w("## 一、结论（先看这个）")
w("")
w("🔴 **446 项这个口径本身高估了真实债务规模。** 逐条判定后：")
w("")
w("| 判定 | 数量 | 占比 | 是否真债 |")
w("|---|---:|---:|---|")
for v, c in Counter(r["verdict"] for r in rows).most_common():
    real = "✅ 是" if v.startswith("mod") else ("❌ 否" if "旧上游" in v else "❓ 待定")
    w(f"| {v} | **{c}** | {c/len(rows)*100:.1f}% | {real} |")
w(f"| **合计** | **{len(rows)}** | 100% | — |")
w("")
w("**三点判断：**")
w("")
w("1. **62% 是「旧上游遗留」** —— A 产物基于旧上游，这些函数在 v1.11.22 已被**上游自己重构删改**。")
w("   把它们算作「mod 未迁的技术债」是错的，它们**不需要迁**，也不该进 L2 排期。")
w("2. **真正的 mod 自研缺口只有 55 项（10.9%）** —— 这才是 L2 的实际规模。")
w("3. **136 项（26.8%）判不了** —— 上下文里既没有 mod 特征也没有上游特征（多为纯字符串引用、")
w("   一次性箭头函数的 keepNames 名、或被高度压缩后的局部变量）。这批标「待人工」，")
w("   在 I-4 回归期用真实业务路径逐个确认，**不阻塞 M3**（L2 本身不阻塞）。")
w("")
w("## 二、域 × 判定 交叉表")
w("")
domains = list(data["byDomain"].keys())
verd_keys = ["mod 自研 · 真未迁", "旧上游遗留 · 无需迁", "待人工（上下文无特征）", "待人工（产物无整词命中）"]
w("| 域 | " + " | ".join(k.replace(" · ", "<br>") for k in verd_keys) + " | 合计 |")
w("|---|" + "---:|" * len(verd_keys) + "---:|")
for d in sorted(domains, key=lambda x: -data["byDomain"][x]):
    c = data["cross"].get(d, {})
    cells = [str(c.get(k, 0)) for k in verd_keys]
    w(f"| {d} | " + " | ".join(cells) + f" | **{data['byDomain'][d]}** |")
tot = [str(sum(data["cross"].get(d, {}).get(k, 0) for d in domains)) for k in verd_keys]
w("| **合计** | " + " | ".join(f"**{x}**" for x in tot) + f" | **{len(rows)}** |")
w("")
w("## 三、逐条台账")
w("")
w("> 每一行都是一个符号。`mod命中/上游命中` 是上下文特征词计数，用来解释判定依据。")
w("")
w("| # | 符号 | 域 | mod命中 | 上游命中 | 判定 | 时间窗 |")
w("|---:|---|---|---:|---:|---|---|")
for i, r in enumerate(sorted(rows, key=lambda x: (x["verdict"], x["domain"], x["symbol"])), 1):
    w(f"| {i} | `{r['symbol']}` | {r['domain']} | {r['modHits']} | {r['upstreamHits']} | "
      f"{r['verdict']} | {WINDOW.get(r['verdict'], '待定')} |")
w("")
w("## 四、复现方式")
w("")
w("```bash")
w("# 1) 重建残差清单（需 A 版产物 + src）")
w("#    产物：game/server/dist.modder-backup-20261016/assets/loading-scene-By2k7Qfx.js")
w("#    清单：.build-tools/resid-not-in-src.txt")
w("")
w("# 2) 逐条判定（本台账的生成方式）")
w("python .build-tools/l2-classify2.py")
w("")
w("# 3) 抽查单条")
w("grep -o '.\\{300\\}SYMBOL.\\{300\\}' <A产物> | head -4")
w("```")
w("")
w("## 五、与旧口径的差异说明")
w("")
w("| 项 | 旧口径（`M3-判据定案-分层.md` §五） | 本台账（实测） |")
w("|---|---|---|")
w("| 总量 | 446 项 | 507 个符号（含 61 个 UI 组件的重复计数差异） |")
w("| 「其余 ≈291」 | 未知，需逐条 | **已拆分**：旧上游遗留 266 · mod 自研 35 · 待人工 76 |")
w("| Eryou 92 | 66 个规则函数已提取 | 域内 29 个符号：旧上游 12 · mod 7 · 待人工 10 |")
w("| 真债规模 | 446 | **55 项确认 + 136 项待人工 ⇒ 上限 191** |")
w("")
w("> ⚠️ **L3（UI 组件 61 永久挂账）不在本台账内**，见 `M3-判据定案-分层.md` §六。")

open(OUT, "w", encoding="utf-8").write("\n".join(lines) + "\n")
print(f"已写 {OUT}（{len(lines)} 行 / {len(rows)} 条）")
