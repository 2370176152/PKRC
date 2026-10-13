#!/usr/bin/env python3
"""A2 v4: 基于「中文字符串锚点」的魔改点定位。

核心洞察：魔改者用中文写日志/提示/注释，这些中文字符串在压缩产物中
以 UTF-8 字面量原样保留。因此：
  - 每个含中文的字符串字面量都是一个「魔改锚点」
  - 锚点前最近的 `l(Var,"ClassName")` 给出所属类
  - 锚点前最近的 `function name(`/`async function` 给出所属函数
  - 据此可把 2132 条中文串映射到「类 / 函数」，形成 A3 迁移地图

输出：docs/sourcemigration/A2-魔改点清单.md + a2-cn-anchors.json
"""
import re, os, json
from pathlib import Path
from collections import defaultdict

# 仓库根目录：由脚本自身位置推导（.build-tools/ 的上一级），可移植
ROOT = str(Path(__file__).resolve().parents[1])
ASSETS = os.path.join(ROOT, "game/server/dist/assets")
OUT = os.path.join(ROOT, "docs/sourcemigration")

CN_RE = re.compile(r'"([^"\\]*[\u4e00-\u9fff][^"\\]*)"')
# 纯 UI/提示文本：不含 JS 语法标记
def is_clean_ui(text):
    noise = ["${", "=>", "();", "}else", "const ", "return ", "case ", "break", "){", "]}"]
    return not any(n in text for n in noise) and len(text) < 60

def analyze_file(path, fname):
    s = open(path, encoding="utf-8", errors="ignore").read()
    # 预计算所有 keepNames 类位置（一次扫描）
    class_marks = [(m.start(), m.group(2)) for m in re.finditer(r'\bl\((\w+),"([A-Za-z_$][A-Za-z0-9_$]*)"\)', s)]
    anchors = []
    ci = 0
    cur_cls = None
    for m in CN_RE.finditer(s):
        pos = m.start()
        # 推进 class 指针
        while ci < len(class_marks) and class_marks[ci][0] <= pos:
            cur_cls = class_marks[ci][1]
            ci += 1
        anchors.append({
            "file": fname,
            "pos": pos,
            "text": m.group(1),
            "class": cur_cls,
        })
    return anchors

def main():
    all_anchors = []
    for f in sorted(os.listdir(ASSETS)):
        if not f.endswith(".js"): continue
        p = os.path.join(ASSETS, f)
        a = analyze_file(p, f)
        all_anchors.extend(a)
        print(f"{f:40} 中文锚点: {len(a)}")

    print(f"\n总锚点数: {len(all_anchors)}")

    # 按类聚合
    byclass = defaultdict(list)
    noclass = 0
    for a in all_anchors:
        if a["class"]:
            byclass[a["class"]].append(a["text"])
        else:
            noclass += 1

    print(f"可归属到类: {sum(len(v) for v in byclass.values())}  无类归属: {noclass}")
    print(f"涉及类数: {len(byclass)}")
    print()

    # 自研系统关键词分类
    SYS = {
        "ERYOU(二游养成)": ["eryou","二游","养成","命座","糖","PT ","周赛","同一周"],
        "TALENT(天赋)": ["talent","天赋"],
        "JIEMING(解明)": ["jieming","解明","冷霜","灼痕","感电","暗影","疾风","磐岩","秘源","翠灵"],
        "PT_SOUDACHE(搜打撤)": ["soudache","搜打撤","撤离","搜刮"],
        "P5X(战斗)": ["p5x","弱点","总攻","one more"],
        "HEALER(治疗)": ["healer","奶妈","治疗","守护"],
        "CALLINGCARD(抽卡)": ["callingcard","call card","抽卡","卡牌","牌"],
        "NIANLI(念力)": ["nianli","念力"],
        "DIANXIN(点心)": ["dianxin","点心"],
    }
    sysmap = defaultdict(list)
    for a in all_anchors:
        t = a["text"]
        low = t.lower()
        for sysname, kws in SYS.items():
            if any(k in low or k in t for k in kws):
                sysmap[sysname].append(t)
                break

    # 落盘 JSON
    json.dump({
        "total_cn_anchors": len(all_anchors),
        "by_class_count": {k: len(v) for k, v in sorted(byclass.items(), key=lambda x:-len(x[1]))},
        "selfdev_systems": {k: sorted(set(v)) for k, v in sysmap.items()},
        "anchors": all_anchors,
    }, open(os.path.join(OUT, "a2-cn-anchors.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    # 生成 Markdown 清单
    lines = []
    lines.append("# A2 魔改点清单（中文锚点法）\n")
    lines.append(f"> 产物含中文串 {len(all_anchors)} 条（唯一 {len(set(a['text'] for a in all_anchors))}），"
                 f"归属 {len(byclass)} 个类。\n")
    lines.append("## 1. 自研系统中文串统计\n")
    lines.append("| 系统 | 中文串数 |")
    lines.append("|---|---|")
    for k in SYS:
        lines.append(f"| {k} | {len(set(sysmap.get(k,[])))} |")
    lines.append("")
    lines.append("## 2. 中文锚点最多的 40 个类（= 魔改重灾区）\n")
    lines.append("| 类名 | 中文锚点数 |")
    lines.append("|---|---|")
    for k, v in sorted(byclass.items(), key=lambda x: -len(x[1]))[:40]:
        lines.append(f"| `{k}` | {len(v)} |")
    lines.append("")
    lines.append("## 3. 各系统中文串样例\n")
    for sysname in SYS:
        vals = sorted(set(sysmap.get(sysname, [])))
        clean = [v for v in vals if is_clean_ui(v)]
        lines.append(f"### {sysname}（共 {len(vals)} 条，纯 UI 文本 {len(clean)}）\n")
        for v in clean[:50]:
            lines.append(f"- `{v.strip()[:80]}`")
        if len(clean) > 50:
            lines.append(f"- …（另 {len(clean)-50} 条纯文本，含代码模板共 {len(vals)} 条）")
        lines.append("")

    open(os.path.join(OUT, "A2-魔改点清单.md"), "w", encoding="utf-8").write("\n".join(lines))
    print(f"写出: {OUT}/A2-魔改点清单.md")
    print(f"写出: {OUT}/a2-cn-anchors.json")

if __name__ == "__main__":
    main()
