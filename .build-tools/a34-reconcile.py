#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
A3-04 招式数值收口（全形态）：把锚点源码 move.ts 对齐到产物(.orig)，使逐字段比对「差异=0」。

覆盖三种招式的构造形态：
  AttackMove      : 产物 new v(t.X,R.T,B.C,...)   源码 new AttackMove(MoveId.X, PokemonType.T, MoveCategory.C, ...)
  StatusMove      : 产物 new Ke(t.X,R.T,...)      源码 new StatusMove(MoveId.X, PokemonType.T, ...)
  SelfStatusMove  : 产物 new ut(t.X,R.T,...)      源码 new SelfStatusMove(MoveId.X, PokemonType.T, ...)
源码中类型枚举允许 `PokemonType.X` 或 `Type.X` 两种写法。

用法: python a34-reconcile.py [--apply]
"""
import re, sys, json
from collections import Counter

PROD = r'D:/Work/Pokemon/new/game/server/dist/assets/loading-scene-By2k7Qfx.js'
SRC  = r'D:/Work/Pokemon/new/.build-tools/tarball-src/pokerogue-90df65097b6df76f713e6bd108afa84499e8b993/src/data/moves/move.ts'

TYPE_RE_S = r'(?:PokemonType|Type)'  # 源码类型枚举的两种写法

P_ATK = re.compile(r'new v\(t\.([A-Z0-9_]+),R\.([A-Za-z0-9_]+),B\.([A-Za-z0-9_]+),(-?\d+),(-?\d+),(-?\d+),(-?\d+),(-?\d+),(\d+)\)')
P_ST  = re.compile(r'new Ke\(t\.([A-Z0-9_]+),R\.([A-Za-z0-9_]+),(-?\d+),(-?\d+),(-?\d+),(-?\d+),(\d+)\)')
P_SST = re.compile(r'new ut\(t\.([A-Z0-9_]+),R\.([A-Za-z0-9_]+),(-?\d+),(-?\d+),(-?\d+),(-?\d+),(\d+)\)')

S_ATK = re.compile(r'new AttackMove\(MoveId\.([A-Za-z0-9_]+),\s*' + TYPE_RE_S + r'\.([A-Za-z0-9_]+),\s*MoveCategory\.([A-Za-z0-9_]+),'
                   r'\s*(-?\d+),\s*(-?\d+),\s*(-?\d+),\s*(-?\d+),\s*(-?\d+),\s*(\d+)\)(,?)')
S_ST  = re.compile(r'new StatusMove\(MoveId\.([A-Za-z0-9_]+),\s*' + TYPE_RE_S + r'\.([A-Za-z0-9_]+),'
                   r'\s*(-?\d+),\s*(-?\d+),\s*(-?\d+),\s*(-?\d+),\s*(\d+)\)(,?)')
S_SST = re.compile(r'new SelfStatusMove\(MoveId\.([A-Za-z0-9_]+),\s*' + TYPE_RE_S + r'\.([A-Za-z0-9_]+),'
                   r'\s*(-?\d+),\s*(-?\d+),\s*(-?\d+),\s*(-?\d+),\s*(\d+)\)(,?)')

FIELDS = ['type', 'cat', 'power', 'ac', 'pp', 'ch', 'pr', 'gen']


def parse_atk(text, rx):
    out = {}
    for m in rx.finditer(text):
        g = m.groups()
        rec = {'form': 'ATK', 'type': g[1].upper(), 'cat': g[2].upper()}
        for i, k in enumerate(['power', 'ac', 'pp', 'ch', 'pr', 'gen']):
            rec[k] = int(g[3 + i])
        out[g[0]] = rec
    return out


def parse_st(text, rx, form):
    out = {}
    for m in rx.finditer(text):
        g = m.groups()
        rec = {'form': form, 'type': g[1].upper(), 'cat': 'STATUS', 'power': -1}
        for i, k in enumerate(['ac', 'pp', 'ch', 'pr', 'gen']):
            rec[k] = int(g[2 + i])
        out[g[0]] = rec
    return out


def load(text, is_prod):
    d = {}
    d.update(parse_st(text, P_SST if is_prod else S_SST, 'SST'))
    d.update(parse_st(text, P_ST if is_prod else S_ST, 'ST'))
    d.update(parse_atk(text, P_ATK if is_prod else S_ATK))
    return d


def build_repl(rx, form, changes):
    """返回一个 sub 回调：仅改写 changes 命中的招式。"""
    def cb(m):
        mid = m.group(1)
        if mid not in changes:
            return m.group(0)
        g = list(m.groups())
        p = changes[mid]
        if form == 'ATK':
            # g: 0=MOVE 1=TYPE 2=CAT 3=power 4=ac 5=pp 6=ch 7=pr 8=gen
            idx = {'power': 3, 'ac': 4, 'pp': 5, 'ch': 6, 'pr': 7, 'gen': 8}
            if 'type' in p: g[1] = p['type'][0]
            if 'cat' in p: g[2] = p['cat'][0]
            for k, i in idx.items():
                if k in p: g[i] = str(p[k][0])
            line = (f"new AttackMove(MoveId.{g[0]}, PokemonType.{g[1].upper()}, MoveCategory.{g[2]}, "
                    f"{g[3]}, {g[4]}, {g[5]}, {g[6]}, {g[7]}, {g[8]})")
        else:
            # g: 0=MOVE 1=TYPE 2=ac 3=pp 4=ch 5=pr 6=gen
            idx = {'ac': 2, 'pp': 3, 'ch': 4, 'pr': 5, 'gen': 6}
            if 'type' in p: g[1] = p['type'][0]
            for k, i in idx.items():
                if k in p: g[i] = str(p[k][0])
            cls = 'StatusMove' if form == 'ST' else 'SelfStatusMove'
            line = (f"new {cls}(MoveId.{g[0]}, PokemonType.{g[1].upper()}, "
                    f"{g[2]}, {g[3]}, {g[4]}, {g[5]}, {g[6]})")
        parts = []
        for k, lbl in [('power', 'power'), ('ac', 'acc'), ('pp', 'pp'), ('ch', 'chance'), ('pr', 'priority'),
                       ('type', 'type'), ('cat', 'category'), ('gen', 'gen')]:
            if k in p:
                new, old = p[k]
                parts.append(f"{lbl} {old}->{new}")
        return f"{line}{g[-1]} // PKRC(A3-04): {', '.join(parts)}"
    return cb


def main():
    apply = '--apply' in sys.argv
    prod_txt = open(PROD, encoding='utf-8', errors='ignore').read()
    src_txt = open(SRC, encoding='utf-8').read()
    prod = load(prod_txt, True)
    src = load(src_txt, False)
    print("产物招式数:", len(prod), dict(Counter(v['form'] for v in prod.values())))
    print("源码招式数:", len(src), dict(Counter(v['form'] for v in src.values())))

    common = sorted(set(prod) & set(src))
    only_prod = sorted(set(prod) - set(src))
    only_src = sorted(set(src) - set(prod))

    diffs = {}
    for mid in common:
        p, s = prod[mid], src[mid]
        d = {k: (p[k], s[k]) for k in FIELDS if p[k] != s[k]}
        if d:
            diffs[mid] = d

    print(f"\n共有={len(common)}  仅产物={len(only_prod)}  仅源码={len(only_src)}")
    print(f"\n=== 全字段差异 ({len(diffs)}) ===")
    for mid, d in diffs.items():
        detail = "  ".join(f"{k}:{a[0]}->{a[1]}" for k, a in d.items())
        print(f"  {mid:26s} {detail}")

    if not apply:
        print("\n[report] 未写文件。")
        return

    # 注意源码类型枚举写法：优先保留原写法。这里统一用 PokemonType（Type 是别名，等价）
    new_txt = src_txt
    for rx, form in [(S_ATK, 'ATK'), (S_ST, 'ST'), (S_SST, 'SST')]:
        new_txt = rx.sub(build_repl(rx, form, diffs), new_txt)
    open(SRC, 'w', encoding='utf-8', newline='\n').write(new_txt)
    print(f"\n已写回 {SRC}，涉及招式 {len(diffs)} 个")


if __name__ == '__main__':
    main()
