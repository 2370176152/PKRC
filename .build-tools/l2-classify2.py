#!/usr/bin/env python3
"""
一次性：L2 台账逐条判定（I-3）。

判据（在 A 产物里取每个符号的出现上下文，检测 mod 特征）：
  · 上下文含 mod 数据标识（ptSoudache / eryou / talentSystem / constellation / callingcard /
    squad / p5x / superBackpack / bloodline / guardian）⇒ **mod 自研，真未迁**
  · 上下文只含上游标识（pokemon / arena / battle / trainer / biome / modifier）
    ⇒ **旧上游遗留，新上游已重构删改，无需迁**
  · 上下文取不到（一次性引用 / 纯字符串）⇒ 待人工

输出：`.build-tools/l2-ledger2.json`（逐条）+ 控制台摘要。
只在 .build-tools/ 一次性使用。
"""
import json
import os
import re
from collections import Counter, defaultdict

ROOT = os.path.dirname(__file__)
REPO = os.path.dirname(ROOT)
PRODUCT = os.path.join(REPO, "game", "server", "dist.modder-backup-20261016", "assets",
                       "loading-scene-By2k7Qfx.js")
RESID = os.path.join(ROOT, "resid-not-in-src.txt")

CASES = 800  # 每个符号取多少字符上下文

MOD_TOKENS = [
    "ptSoudache", "PtSoudache", "eryou", "Eryou", "talentSystem", "talentCodex", "constellation",
    "Constellation", "callingcard", "CallingCard", "squad", "Squad", "p5x", "P5X", "superBackpack",
    "SuperBackpack", "bloodline", "guardian", "Guardian", "jieming", "Jieming", "healer", "nianli",
    "dianxin", "chixin", "mew", "xingxiang", "menghuo", "juexing", "JUEXING", "BAOXIAN",
]
UPSTREAM_TOKENS = [
    "Pokemon", "pokemon", "arena", "Arena", "battle", "Battle", "trainer", "Trainer", "biome",
    "Biome", "modifier", "Modifier", "move", "Move", "ability", "Ability", "species", "Species",
]

symbols = [l.strip() for l in open(RESID, encoding="utf-8") if l.strip()]
text = open(PRODUCT, encoding="utf-8", errors="replace").read()
print(f"残差 {len(symbols)} 个 · 产物 {len(text)} 字符")

# 域规则（较宽，先粗分再靠上下文修正）
DOMAINS = [
    ("Eryou 养成", r"eryou|Eryou|candy|Candy|breakthrough|Breakthrough|abyss|Abyss|presetTeam|heldItem|dungeon|Dungeon|goldCandy|restricted|Restricted|gene|Gene"),
    ("天赋/时代", r"talent|Talent|xingxiang|Xingxiang|menghuo|dengjia|shengming|shiqishidai|bingheqi|gongyegeming|xinxiwenming|tuteng|zican|tongxing|shimeng|yijian|busizishen|age|Age"),
    ("五行/血脉", r"wuxing|element|bloodline|bloodlust|undying|BugYan|bugYan"),
    ("squad", r"squad|Squad|UnitCard"),
    ("P5X/守卫", r"p5x|P5X|guardian|Guardian|jirachi|gardevoir|infernape"),
    ("PT 搜打撤", r"ptSoudache|PtSoudache|Soudache|retreat|Retreat|savePokemon|SavePokemon"),
    ("命座/解明", r"constellation|Constellation|jieming|Jieming|codex|Codex"),
    ("抽卡/呼符", r"callingcard|CallingCard|gauge|Gauge|voucher|Voucher"),
    ("治疗/念力/感电/点心", r"healer|Healer|nianli|NianLi|dianxin|DianXin|seaguard|SeaGuard|echo|Echo"),
    ("存档/序列化", r"serialize|Serialize|toJSON|fromJSON|saveData|SaveData|migrate|Migrate"),
    ("UI", r"Ui|ui|Text|Label|Sprite|Icon|Container|Zone|Cursor|Hud|HUD|Button|Panel|Bar$|Bar[A-Z]"),
    ("初始化/注册", r"^init|^Init|^register|^setup|^initialize|^create|^build|^make|^load|^reset"),
]


def domain_of(sym):
    for name, pat in DOMAINS:
        if re.search(pat, sym):
            return name
    return "战斗/系统（其他）"


rows = []
for sym in symbols:
    # 取所有出现位置的上下文，合并判定
    ctxs = []
    for m in re.finditer(r"\b" + re.escape(sym) + r"\b", text):
        ctxs.append(text[max(0, m.start() - CASES // 2): m.start() + CASES // 2])
        if len(ctxs) >= 4:
            break
    blob = "\n".join(ctxs)
    mod_hits = sum(blob.count(t) for t in MOD_TOKENS)
    up_hits = sum(blob.count(t) for t in UPSTREAM_TOKENS)
    if not ctxs:
        verdict = "待人工（产物无整词命中）"
    elif mod_hits > 0 and mod_hits >= up_hits:
        verdict = "mod 自研 · 真未迁"
    elif up_hits > mod_hits:
        verdict = "旧上游遗留 · 无需迁"
    else:
        verdict = "待人工（上下文无特征）"
    rows.append({
        "symbol": sym,
        "domain": domain_of(sym),
        "occurrences": len(ctxs),
        "modHits": mod_hits,
        "upstreamHits": up_hits,
        "verdict": verdict,
    })

bd = Counter(r["domain"] for r in rows)
bv = Counter(r["verdict"] for r in rows)
print("\n=== 判定分布 ===")
for v, c in bv.most_common():
    print(f"  {v:<26} {c}")
print("\n=== 域分布 ===")
for d, c in bd.most_common():
    print(f"  {d:<22} {c}")

print("\n=== 域 × 判定 ===")
cross = defaultdict(Counter)
for r in rows:
    cross[r["domain"]][r["verdict"]] += 1
for d, c in bd.most_common():
    print(f"  {d:<22} " + " · ".join(f"{k.split(' · ')[0]}={v}" for k, v in cross[d].most_common()))

out = os.path.join(ROOT, "l2-ledger2.json")
json.dump({"total": len(rows), "byDomain": dict(bd), "byVerdict": dict(bv),
           "cross": {d: dict(c) for d, c in cross.items()}, "rows": rows},
          open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"\n已写 {out}")
