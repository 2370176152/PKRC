#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
A3-04 全招式形态逐字段比对（AttackMove / StatusMove / SelfStatusMove）。
用于证明「招式表差异=0」。

产物形态:
  AttackMove      : new v(t.MOVE,R.TYPE,B.CAT,pw,ac,pp,ch,pr,gen)
  StatusMove      : new Ke(t.MOVE,R.TYPE,ac,pp,ch,pr,gen)
  SelfStatusMove  : new ut(t.MOVE,R.TYPE,ac,pp,ch,pr,gen)
  ChargingStatusMove 等其它形态在产物中如有出现会被记为 unparsed_prod
源码形态:
  new AttackMove(MoveId.X, PokemonType.T, MoveCategory.C, pw,ac,pp,ch,pr,gen)
  new StatusMove(MoveId.X, PokemonType.T, ac,pp,ch,pr,gen)
  new SelfStatusMove(MoveId.X, PokemonType.T, ac,pp,ch,pr,gen)
"""
import re, sys, json

PROD = r'D:/Work/Pokemon/new/game/server/dist/assets/loading-scene-By2k7Qfx.js'
SRC  = r'D:/Work/Pokemon/new/.build-tools/tarball-src/pokerogue-90df65097b6df76f713e6bd108afa84499e8b993/src/data/moves/move.ts'

# ---- product regexes ----
P_ATK = re.compile(r'new v\(t\.([A-Z0-9_]+),R\.([A-Za-z0-9_]+),B\.([A-Za-z0-9_]+),(-?\d+),(-?\d+),(-?\d+),(-?\d+),(-?\d+),(\d+)\)')
P_ST  = re.compile(r'new Ke\(t\.([A-Z0-9_]+),R\.([A-Za-z0-9_]+),(-?\d+),(-?\d+),(-?\d+),(-?\d+),(\d+)\)')
P_SST = re.compile(r'new ut\(t\.([A-Z0-9_]+),R\.([A-Za-z0-9_]+),(-?\d+),(-?\d+),(-?\d+),(-?\d+),(\d+)\)')
# ChargingAttackMove(`GA`) / ChargingSelfStatusMove(`$K`)
P_CATK = re.compile(r'new GA\(t\.([A-Z0-9_]+),R\.([A-Za-z0-9_]+),B\.([A-Za-z0-9_]+),(-?\d+),(-?\d+),(-?\d+),(-?\d+),(-?\d+),(\d+)\)')
P_CSST = re.compile(r'new \$K\(t\.([A-Z0-9_]+),R\.([A-Za-z0-9_]+),(-?\d+),(-?\d+),(-?\d+),(-?\d+),(\d+)\)')
# ---- source regexes ----
TYPE_RE_S = r'(?:PokemonType|Type)'
S_ATK = re.compile(r'new AttackMove\(MoveId\.([A-Za-z0-9_]+),\s*' + TYPE_RE_S + r'\.([A-Za-z0-9_]+),\s*MoveCategory\.([A-Za-z0-9_]+),'
                   r'\s*(-?\d+),\s*(-?\d+),\s*(-?\d+),\s*(-?\d+),\s*(-?\d+),\s*(\d+)\)')
S_ST  = re.compile(r'new StatusMove\(MoveId\.([A-Za-z0-9_]+),\s*' + TYPE_RE_S + r'\.([A-Za-z0-9_]+),'
                   r'\s*(-?\d+),\s*(-?\d+),\s*(-?\d+),\s*(-?\d+),\s*(\d+)\)')
S_SST = re.compile(r'new SelfStatusMove\(MoveId\.([A-Za-z0-9_]+),\s*' + TYPE_RE_S + r'\.([A-Za-z0-9_]+),'
                   r'\s*(-?\d+),\s*(-?\d+),\s*(-?\d+),\s*(-?\d+),\s*(\d+)\)')
S_CATK = re.compile(r'new ChargingAttackMove\(MoveId\.([A-Za-z0-9_]+),\s*' + TYPE_RE_S + r'\.([A-Za-z0-9_]+),\s*MoveCategory\.([A-Za-z0-9_]+),'
                    r'\s*(-?\d+),\s*(-?\d+),\s*(-?\d+),\s*(-?\d+),\s*(-?\d+),\s*(\d+)\)')
S_CSST = re.compile(r'new ChargingSelfStatusMove\(MoveId\.([A-Za-z0-9_]+),\s*' + TYPE_RE_S + r'\.([A-Za-z0-9_]+),'
                    r'\s*(-?\d+),\s*(-?\d+),\s*(-?\d+),\s*(-?\d+),\s*(\d+)\)')


def parse_atk(text, rx):
    out = {}
    for m in rx.finditer(text):
        g = m.groups()
        rec = {'form': 'ATK', 'type': g[1].upper(), 'cat': g[2].upper()}
        for i, k in enumerate(['power', 'ac', 'pp', 'ch', 'pr', 'gen']):
            rec[k] = int(g[3 + i])
        out[g[0]] = rec
    return out


def parse_st(text, rx, form, cat='STATUS'):
    out = {}
    for m in rx.finditer(text):
        g = m.groups()
        rec = {'form': form, 'type': g[1].upper(), 'cat': cat, 'power': -1}
        for i, k in enumerate(['ac', 'pp', 'ch', 'pr', 'gen']):
            rec[k] = int(g[2 + i])
        out[g[0]] = rec
    return out


def load_all(text, atk, st, sst, catk, csst, is_prod):
    d = {}
    d.update(parse_st(text, csst, 'CSST'))   # ChargingSelfStatusMove
    d.update(parse_st(text, sst, 'SST'))     # SelfStatusMove
    d.update(parse_st(text, st, 'ST'))
    d.update(parse_atk(text, catk))          # ChargingAttackMove
    d.update(parse_atk(text, atk))
    return d


def strip_block_comments(s):
    """去掉 /* ... */ 块注释（锚点用 /* Unused */ 包裹未启用招式）。"""
    return re.sub(r'/\*.*?\*/', '', s, flags=re.S)


def main():
    prod_txt = open(PROD, encoding='utf-8', errors='ignore').read()
    src_raw = open(SRC, encoding='utf-8').read()
    src_txt = strip_block_comments(src_raw)
    prod = load_all(prod_txt, P_ATK, P_ST, P_SST, P_CATK, P_CSST, True)
    src = load_all(src_txt, S_ATK, S_ST, S_SST, S_CATK, S_CSST, False)

    from collections import Counter
    print("产物招式数:", len(prod), dict(Counter(v['form'] for v in prod.values())))
    print("源码招式数:", len(src), dict(Counter(v['form'] for v in src.values())))

    FIELDS = ['type', 'cat', 'power', 'ac', 'pp', 'ch', 'pr', 'gen']
    common = sorted(set(prod) & set(src))
    only_prod = sorted(set(prod) - set(src))
    only_src = sorted(set(src) - set(prod))

    diffs = []
    for mid in common:
        p, s = prod[mid], src[mid]
        d = {k: (p[k], s[k]) for k in FIELDS if p[k] != s[k]}
        if d:
            diffs.append((mid, p['form'], s['form'], d))

    print(f"\n共有={len(common)}  仅产物={len(only_prod)}  仅源码={len(only_src)}")
    print(f"\n=== 全字段差异 ({len(diffs)}) ===")
    for mid, pf, sf, d in diffs:
        detail = "  ".join(f"{k}:{a}->{b}" for k, (a, b) in d.items())
        tag = "" if pf == sf else f"  [{pf}vs{sf}]"
        print(f"  {mid:26s} {detail}{tag}")

    print(f"\n=== 仅产物有 ({len(only_prod)}) ===")
    for x in only_prod:
        p = prod[x]
        print(f"  {x:26s} form={p['form']} type={p['type']} cat={p['cat']} pw={p['power']} ac={p['ac']} pp={p['pp']} ch={p['ch']} pr={p['pr']} gen={p['gen']}")
    print(f"\n=== 仅源码有 ({len(only_src)}) ===")
    print("  " + ", ".join(only_src))

    json.dump({"diffs": [(m, pf, sf, d) for m, pf, sf, d in diffs],
               "only_prod": {x: prod[x] for x in only_prod},
               "only_src": only_src},
              open(r'D:/Work/Pokemon/new/.build-tools/a3-04-movediff-all.json', 'w', encoding='utf-8'),
              ensure_ascii=False, indent=1)
    print("\n已写出 .build-tools/a3-04-movediff-all.json")


if __name__ == '__main__':
    main()
