#!/usr/bin/env python3
"""A2 v2: 把产物中的类名反查到候选源码树的具体文件位置。

修正点（vs v1）：
- 参考树可指定（默认 04-18，因 A0§5A 证明 modder base ≈ 04-18）
- 同时跑 04-18 与 06-08 两个候选，输出「只在一个树命中」的差异，
  用于区分「上游旧类」与「真·魔改新增」
- 修正正则：支持 export default class / 顶层缩进声明 / 多行

用法:
  python a2-classname-map.py [treeA_root] [treeB_root]
"""
import re
import os
import sys
import json
from pathlib import Path
from collections import defaultdict

# 仓库根目录：由脚本自身位置推导（.build-tools/ 的上一级），可移植
ROOT = str(Path(__file__).resolve().parents[1])
DEFAULT_A = os.path.join(ROOT, ".build-tools/anchor-apr18/pokerogue-f52a566f5215e20a0b29ec0202ea4c96dc2b87c5/src")
DEFAULT_B = os.path.join(ROOT, ".build-tools/tarball-src/pokerogue-90df65097b6df76f713e6bd108afa84499e8b993/src")
CLASSNAMES = os.path.join(ROOT, "docs/sourcemigration/classnames.txt")
OUT_DIR = os.path.join(ROOT, "docs/sourcemigration")

DECL_PATTERNS = [
    (r"\b(?:export\s+)?(?:default\s+)?abstract\s+class\s+([A-Za-z_$][A-Za-z0-9_$]*)", "class"),
    (r"\b(?:export\s+)?(?:default\s+)?class\s+([A-Za-z_$][A-Za-z0-9_$]*)", "class"),
    (r"\b(?:export\s+)?interface\s+([A-Za-z_$][A-Za-z0-9_$]*)", "interface"),
    (r"\b(?:export\s+)?const\s+enum\s+([A-Za-z_$][A-Za-z0-9_$]*)", "enum"),
    (r"\b(?:export\s+)?enum\s+([A-Za-z_$][A-Za-z0-9_$]*)", "enum"),
    (r"\b(?:export\s+)?type\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*[=<]", "type"),
    (r"\b(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][A-Za-z0-9_$]*)", "function"),
    (r"\b(?:export\s+)?const\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*(?:async\s*)?(?:\(|function|[A-Za-z_$])", "const"),
]

def scan(root):
    decl_map = defaultdict(list)
    if not os.path.isdir(root):
        raise SystemExit(f"目录不存在: {root}")
    for r, _, files in os.walk(root):
        for fn in files:
            if not fn.endswith(".ts"):
                continue
            p = os.path.join(r, fn)
            rel = os.path.relpath(p, root).replace("\\", "/")
            try:
                lines = open(p, encoding="utf-8", errors="replace").read().splitlines()
            except Exception:
                continue
            for ln, line in enumerate(lines, 1):
                st = line.strip()
                if st.startswith("//") or st.startswith("*") or st.startswith("/*"):
                    continue
                for pat, kind in DECL_PATTERNS:
                    for m in re.finditer(pat, line):
                        decl_map[m.group(1)].append((rel, ln, kind))
    return decl_map

def run(name, root, names):
    decl = scan(root)
    found = {n: decl[n] for n in names if n in decl}
    missing = [n for n in names if n not in decl]
    print(f"[{name}] {root.split('/')[-2]}")
    print(f"  源码命名实体: {len(decl)}  命中: {len(found)}  未命中: {len(missing)}")
    return found, set(missing), decl

def main():
    treeA = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_A
    treeB = sys.argv[2] if len(sys.argv) > 2 else DEFAULT_B
    names = sorted({l.strip() for l in open(CLASSNAMES, encoding="utf-8") if l.strip()})
    print(f"待查 classnames: {len(names)}\n")

    fA, missA, declA = run("04-18", treeA, names)
    print()
    fB, missB, declB = run("06-08", treeB, names)
    print()

    # 差异分类
    both = set(fA) & set(fB)
    onlyA = set(fA) - set(fB)   # 只在 04-18 有（上游后来删除/重构的旧类）
    onlyB = set(fB) - set(fA)   # 只在 06-08 有（上游后来新增的类）
    neither = set(names) - set(fA) - set(fB)  # 两树都没有 => 真·魔改新增

    print("=== 差异分类 ===")
    print(f"两树都命中: {len(both)}")
    print(f"仅 04-18 命中 (上游后来移除的旧类): {len(onlyA)}")
    print(f"仅 06-08 命中 (上游后来新增的类): {len(onlyB)}")
    print(f"两树都未命中 (真·魔改新增/自研): {len(neither)}")
    print()

    out = {
        "reference_04_18": treeA,
        "reference_06_08": treeB,
        "counts": {
            "total": len(names),
            "hit_both": len(both),
            "hit_only_04_18": len(onlyA),
            "hit_only_06_08": len(onlyB),
            "hit_neither": len(neither),
        },
        "only_04_18": sorted(onlyA),
        "only_06_08": sorted(onlyB),
        "neither_真魔改新增": sorted(neither),
        "map_04_18": {n: [[rel, ln, k] for rel, ln, k in v] for n, v in fA.items()},
        "map_06_08": {n: [[rel, ln, k] for rel, ln, k in v] for n, v in fB.items()},
    }
    p = f"{OUT_DIR}/classname-map.json"
    with open(p, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    print(f"写出: {p}")

    # 可读版：重点输出「真·魔改新增」清单
    p2 = f"{OUT_DIR}/classname-map.txt"
    with open(p2, "w", encoding="utf-8") as f:
        f.write("# A2 类名反查（v2，双参考树）\n\n")
        f.write(f"参考树 A (04-18): {treeA}\n")
        f.write(f"参考树 B (06-08): {treeB}\n\n")
        f.write(f"| 指标 | 值 |\n|---|---|\n")
        f.write(f"| 待查类名 | {len(names)} |\n")
        f.write(f"| 两树都命中 | {len(both)} |\n")
        f.write(f"| 仅 04-18 命中 | {len(onlyA)} |\n")
        f.write(f"| 仅 06-08 命中 | {len(onlyB)} |\n")
        f.write(f"| **两树都未命中（真·魔改新增候选）** | **{len(neither)}** |\n\n")
        f.write("## 仅 04-18 命中（上游后来移除/重构的旧类）\n")
        for n in sorted(onlyA):
            f.write(f"- {n}\n")
        f.write("\n## 仅 06-08 命中（上游后来新增的类）\n")
        for n in sorted(onlyB):
            f.write(f"- {n}\n")
        f.write("\n## 两树都未命中 → 真·魔改新增/自研系统候选\n")
        for n in sorted(neither):
            f.write(f"- {n}\n")
    print(f"写出: {p2}")

if __name__ == "__main__":
    main()
