#!/usr/bin/env python3
"""A3-05: 定位 9 处 hI( 命座注册调用，反查 (系统名, 物种数组, codex, hooks) 与 `l()` 原名。"""
import re, json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CHUNK = ROOT / "game/server/dist/assets/loading-scene-By2k7Qfx.js"
s = CHUNK.read_text(encoding="utf-8", errors="ignore")

# name map: l(short,"orig")
namemap = {m.group(1): m.group(2) for m in re.finditer(r'\bl\((\w+),"([A-Za-z_$][A-Za-z0-9_$]*)"\)', s)}
print(f"keepNames 条目: {len(namemap)}")

# hI( calls
calls = list(re.finditer(r'\bhI\(', s))
print(f"hI 调用: {len(calls)}\n")

en_re = re.compile(r'\{exclusiveNodes:\[([^\]]*)\]\}')

for i, m in enumerate(calls):
    pos = m.start()
    # the hI call itself: hI(args)
    tail = s[pos:pos+200].split(");")[0] + ")"
    # walk back to find {exclusiveNodes:[...]} nearest before
    seg = s[max(0, pos-6000):pos]
    en = list(en_re.finditer(seg))
    nodes = en[-1].group(1) if en else '?'
    nodes_list = [n.strip() for n in nodes.split(",") if n.strip()]
    # find the *loop var* / species array: look for `for(const X of Y)hI(` right before
    loop = None
    lm = re.search(r'for\(const (\w+) of (\w+)\)$', seg[-120:])
    if lm:
        loop = (lm.group(1), lm.group(2))
    elif re.search(r'hI\(e\.(\w+),', s[pos:pos+80]):
        loop = ("(direct)", re.search(r'hI\(e\.(\w+),', s[pos:pos+80]).group(1))
    else:
        # direct e.X form
        dm = re.search(r'hI\((\w+)\.(\w+),', s[pos:pos+80])
        if dm:
            loop = ("(direct)", dm.group(2))
    # args of hI
    args = re.match(r'hI\(([^)]*)\)', s[pos:])
    args_s = args.group(1) if args else '?'
    print(f"[{i}] {tail}")
    print(f"    nodes = {nodes_list}")
    print(f"    loop  = {loop}")
    print(f"    args  = {args_s}")
    # resolve names for nodes
    print(f"    node#  = {[namemap.get(x,x) for x in nodes_list]}")
    print()

# dump species arrays referenced by loops
print("=== 物种数组 / 系统枚举 ===")
for var in ["CEe","ww","mre","Vre","mRe","TOe","PSe","_Se","$Se","QSe","gTe","HTe","mTe","BTe","Que","Jue","$ce","Qce","tPe","sPe","P1e","_1e","o0","SEe","TEe","LEe","z1","mw","PEe","_Ee","GEe","gEe","Bw","Kw","xEe","VEe","kEe","ZEe","mM","zm","Hre","pre","jw","Og","eb","pU","Kre","tb","Wre","lg","U0","_Re","Db","GRe","dg","g0","OOe","IOe","Pg","H0"]:
    for m in re.finditer(r'\b(?:const|let|var) '+var+r'\s*=\s*(.{0,160})', s):
        print(f"{var} = {m.group(1)[:160]}")
        break
