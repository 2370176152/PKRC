#!/usr/bin/env python3
"""A2 v3: 魔改点提取 —— 对产物全量命名实体做四分类。

目的：从 .orig 产物中，区分出：
  【S】自研系统 (Self-developed) —— 魔改者的 6 大系统 + 自研属性/标签/阶段
  【U】上游类 (Upstream)        —— 官方已有（含被重构移除的旧类）
  【T】第三方库 (Third-party)   —— phaser/material-color-jszip 等依赖
  【?】未决 (Unknown)          —— 需人工复核

输入：
  - 产物所有 JS（game/server/dist/assets/*.js）
  - 上游命名实体集合（04-18 树 src/  +  06-08 树 src/）
  - node_modules 第三方符号
输出：docs/sourcemigration/A2-魔改点清单.md + a2-classify.json
"""
import re, os, json
from pathlib import Path
from collections import defaultdict

# 仓库根目录：由脚本自身位置推导（.build-tools/ 的上一级），可移植
ROOT = str(Path(__file__).resolve().parents[1])
ASSETS = os.path.join(ROOT, "game/server/dist/assets")
TREE_0418 = os.path.join(ROOT, ".build-tools/anchor-apr18/pokerogue-f52a566f5215e20a0b29ec0202ea4c96dc2b87c5")
TREE_0608 = os.path.join(ROOT, ".build-tools/tarball-src/pokerogue-90df65097b6df76f713e6bd108afa84499e8b993")
NODE_MODULES = os.path.join(TREE_0608, "node_modules")
OUT = os.path.join(ROOT, "docs/sourcemigration")

DECL = re.compile(r'(?:^|\s)(?:export\s+)?(?:default\s+)?(?:abstract\s+)?(?:class|interface|enum|type|function|const|let)\s+([A-Za-z_$][A-Za-z0-9_$]*)')

def collect_tree(root):
    names = set()
    if not os.path.isdir(root): return names
    for r,_,fs in os.walk(root):
        if "node_modules" in r: continue
        for f in fs:
            if not f.endswith((".ts",".tsx")): continue
            try: s = open(os.path.join(r,f),encoding="utf-8",errors="ignore").read()
            except: continue
            for m in DECL.finditer(s): names.add(m.group(1))
    return names

def collect_thirdparty(root):
    """收集 node_modules 里的导出/类符号（粗粒度：所有 .d.ts/.js 顶层 name 字符串）"""
    names = set()
    # 只扫已知大依赖，避免耗时
    targets = ["phaser","@material","jszip","i18next","crypto-js","core-js","compare-versions","ajv"]
    for t in targets:
        d = os.path.join(root, t)
        if not os.path.isdir(d): continue
        for r,_,fs in os.walk(d):
            for f in fs:
                if not f.endswith((".d.ts",".js",".mjs")): continue
                # 从 d.ts 抽 class/interface/type/function/const 声明
                try: s = open(os.path.join(r,f),encoding="utf-8",errors="ignore").read(200000)
                except: continue
                for m in re.finditer(r'\b(?:declare\s+)?(?:export\s+)?(?:abstract\s+)?(?:class|interface|type|function|const|enum)\s+([A-Z][A-Za-z0-9_$]+)', s):
                    names.add(m.group(1))
    return names

print("收集上游/第三方符号集...")
up_0418 = collect_tree(os.path.join(TREE_0418,"src"))
up_0608 = collect_tree(os.path.join(TREE_0608,"src"))
tp = collect_thirdparty(NODE_MODULES)
up_all = up_0418 | up_0608
print(f"  上游 04-18: {len(up_0418)}  06-08: {len(up_0608)}  合计 {len(up_all)}")
print(f"  第三方: {len(tp)}")

# 产物全量命名实体
def collect_product():
    names = defaultdict(set)   # name -> {files}
    classnames = set()          # l(X,"Name") 保名类
    getters = set()             # get X(){return Y}
    for f in os.listdir(ASSETS):
        if not f.endswith(".js"): continue
        p = os.path.join(ASSETS, f)
        try: s = open(p,encoding="utf-8",errors="ignore").read()
        except: continue
        for m in re.finditer(r'\bl\(\w+,"([A-Za-z_$][A-Za-z0-9_$]*)"\)', s):
            classnames.add(m.group(1)); names[m.group(1)].add(f)
        for m in re.finditer(r'\br\(\w+,"([A-Za-z_$][A-Za-z0-9_$]*)"\)', s):
            classnames.add(m.group(1)); names[m.group(1)].add(f)
        for m in re.finditer(r'get ([A-Za-z_$][A-Za-z0-9_$]*)\(\)\{return [A-Za-z_$][A-Za-z0-9_$]*\}', s):
            getters.add(m.group(1)); names[m.group(1)].add(f)
    return names, classnames, getters

print("扫描产物...")
prod, prod_classnames, prod_getters = collect_product()
# 以 classnames.txt 为权威清单（2,571）
CN = os.path.join(OUT, "classnames.txt")
classnames = sorted({l.strip() for l in open(CN,encoding="utf-8") if l.strip()})
print(f"  产物保留类名: {len(prod_classnames)}   getter: {len(prod_getters)}   classnames.txt: {len(classnames)}")

# 四分类
S, U, T, Q = [], [], [], []
for n in classnames:
    if n in up_all: U.append(n)
    elif n in tp: T.append(n)
    elif n in prod_getters: Q.append(n)   # 需人工判断（多为上游 held-item 导出）
    else:
        # 启发式：拼音/自研关键词
        low = n.lower()
        selftags = ["eryou","talent","jieming","soudache","mingzuo","p5x","chengfeng","dianxin",
                    "nianli","kongjian","calliingcard","callingcard","firefighter","healer",
                    "flipstat","formblock","iceface","discourage","firstattack","dynamicbalance",
                    "passivecapsule","insurancelock"]
        if any(t in low for t in selftags): S.append(n)
        else: Q.append(n)

print()
print(f"=== 四分类结果 ===")
print(f"  【U】上游类(官方已有): {len(U)}")
print(f"  【T】第三方库: {len(T)}")
print(f"  【S】自研系统候选: {len(S)}")
print(f"  【?】未决(需人工复核): {len(Q)}")
print()
print("【S】自研候选:", S)
print()
print("【?】未决前80:", Q[:80])

out = {
  "counts": {"upstream": len(U), "thirdparty": len(T), "selfdev_candidate": len(S), "unknown": len(Q)},
  "S_selfdev": sorted(S), "T_thirdparty": sorted(T),
  "U_upstream": sorted(U), "Q_unknown": sorted(Q),
}
with open(os.path.join(OUT,"a2-classify.json"),"w",encoding="utf-8") as f:
    json.dump(out,f,ensure_ascii=False,indent=1)
print(f"\n写出: {os.path.join(OUT,'a2-classify.json')}")
