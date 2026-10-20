#!/usr/bin/env python3
"""
一次性：把 I-3 的 L2 台账（446 项）做逐条分类。

输入：`.build-tools/resid-not-in-src.txt`（506 个「产物有、src 无」的符号）
输出：`.build-tools/l2-ledger.json` + 控制台摘要

派单 40 · I-3 要求：
  「L2 台账 446 项逐条（归属 / 复现路径 / 窗口）—— 🔴 不允许「~291 其余」整块」

分类判定（按优先级）：
  1. 域归属：关键词规则（eryou/talent/menghuo/squad/p5x…）
  2. 上游已有对应：在新树 src 里能找到同名或强相关符号 ⇒ 判「上游已覆盖」（不是真未迁）
  3. 其余：按语义二级拆分（存档/序列化 · 战斗计算 · UI 文案 · 初始化 …）

只在 .build-tools/ 一次性使用，不落 tools/（派单 40 铁律）。
"""
import json
import os
import re
import subprocess

ROOT = os.path.dirname(__file__)
REPO = os.path.dirname(ROOT)
ANCHOR = os.path.join(ROOT, "tarball-src", "pokerogue-90df65097b6df76f713e6bd108afa84499e8b993")
SRC = os.path.join(ANCHOR, "src")
RESID = os.path.join(ROOT, "resid-not-in-src.txt")

symbols = [l.strip() for l in open(RESID, encoding="utf-8") if l.strip()]
print(f"载入残差符号 {len(symbols)} 个")

# ── 域规则（顺序即优先级；命中即停） ──
DOMAIN_RULES = [
    ("Eryou 养成", r"eryou|candy|breakthrough|gene|abyss|dungeonKind|presetTeam|heldItem|goldCandy|stoneCount|restricted", "中（宿主在 eryou-ui.ts，需先接线）"),
    ("天赋/时代", r"talent|xingxiang|menghuo|dengjia|shengming|shiqishidai|bingheqi|gongyegeming|xinxiwenming|tuteng|guardian|zican|tongxing|shimeng|yijian|busizishen", "中（talent-system 已迁主体，剩边缘）"),
    ("五行/特性", r"wuxing|element|bloodline|bloodlust|undying|bugYan|bug_yan|qi_|_qi", "中"),
    ("squad", r"squad|UnitCard|unitCard", "中"),
    ("P5X/守卫", r"p5x|P5X|jirachi|gardevoir|infernape", "低"),
    ("PT 搜打撤", r"ptSoudache|PtSoudache|retreat|Retreat|savePokemon|Soudache", "低（I-2 已补地基）"),
    ("命座/解明", r"constellation|Constellation|jieming|Jieming|codex|Codex", "中"),
    ("抽卡/呼符", r"callingcard|CallingCard|gauge|Gauge|voucher|Voucher", "中"),
    ("治疗/念力/感电/点心", r"healer|Healer|nianli|NianLi|dianxin|DianXin|seaguard|SeaGuard", "低"),
    ("存档/序列化", r"serialize|Serialize|toJSON|fromJSON|saveData|SaveData|migrate|Migrate|version|Version", "低"),
    ("UI 文案/布局", r"UiHandler|uiHandler|Text|Label|Sprite|Icon|Container|Zone|Cursor|Hud|HUD", "低（多属 L3）"),
    ("初始化/注册", r"^init|^register|^setup|^initialize|^create.*Table|^build.*Table", "低"),
    ("战斗计算", r"damage|Damage|crit|Crit|stab|Stab|multiplier|Multiplier|stat|Stat|accuracy|Accuracy|effectiveness|Effectiveness", "低"),
]

# ── 上游已有对应：在新树 src 里搜同名（区分大小写，全词） ──
print("构建 src 符号索引 …")
src_names = set()
for dirpath, _dirs, files in os.walk(SRC):
    for fn in files:
        if not fn.endswith(".ts"):
            continue
        p = os.path.join(dirpath, fn)
        try:
            txt = open(p, encoding="utf-8").read()
        except UnicodeDecodeError:
            continue
        src_names.update(re.findall(r"[A-Za-z_$][\w$]{2,}", txt))
print(f"src 标识符 {len(src_names)} 个")

rows = []
for sym in symbols:
    domain, window = "其余（未归类）", "待勘察"
    for name, pat, win in DOMAIN_RULES:
        if re.search(pat, sym):
            domain, window = name, win
            break
    upstream = sym in src_names
    rows.append({
        "symbol": sym,
        "domain": domain,
        "upstreamHasSameName": upstream,
        "verdict": "上游已有同名实现（非真未迁）" if upstream else "真未迁 / 需人工确认",
        "window": window,
    })

# ── 汇总 ──
from collections import Counter
by_domain = Counter(r["domain"] for r in rows)
upstream_cnt = sum(1 for r in rows if r["upstreamHasSameName"])

print("\n=== 域分布 ===")
for d, c in by_domain.most_common():
    print(f"  {d:<24} {c}")
print(f"\n上游已有同名实现：{upstream_cnt} / {len(rows)}")
print(f"仍需人工确认（真未迁）：{len(rows) - upstream_cnt}")

out = os.path.join(ROOT, "l2-ledger.json")
json.dump({
    "generatedAt": "2026-10-20",
    "source": "resid-not-in-src.txt",
    "total": len(rows),
    "byDomain": dict(by_domain),
    "upstreamSameName": upstream_cnt,
    "rows": rows,
}, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"\n已写 {out}")
