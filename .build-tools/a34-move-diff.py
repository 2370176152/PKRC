#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
A3-04 招式数值比对：产物(.orig) vs 锚点源码。
产物形态: new v(t.MOVE,R.TYPE,B.CAT,power,acc,pp,chance,priority,gen)
源码形态: new AttackMove(MoveId.MOVE, PokemonType.TYPE, MoveCategory.CAT, power, acc, pp, chance, priority, gen)
只比对 type/category/power/accuracy（PP 单列，因被 mod 系统改）。
"""
import re, os, json

PROD = r'D:/Work/Pokemon/new/game/server/dist/assets/loading-scene-By2k7Qfx.js'
SRC  = r'D:/Work/Pokemon/new/.build-tools/tarball-src/pokerogue-90df65097b6df76f713e6bd108afa84499e8b993/src/data/moves/move.ts'

CAT = {'0': 'PHYSICAL', '1': 'SPECIAL', '2': 'STATUS'}  # MoveCategory: 0=PHYSICAL? 需与源码核对
# 产物 B.* 是枚举对象，实际是 B.PHYSICAL/B.SPECIAL/B.STATUS 常量名

prod_txt = open(PROD, encoding='utf-8', errors='ignore').read()
src_txt = open(SRC, encoding='utf-8').read()

prod = {}
# new v(t.X,R.Y,B.CAT,power,acc,pp,chance,priority,gen)
for m in re.finditer(
    r'new v\(t\.([A-Z0-9_]+),R\.([A-Z0-9_]+),B\.([A-Z0-9_]+),(-?\d+),(-?\d+),(-?\d+),(-?\d+),(-?\d+),(\d+)\)',
    prod_txt):
    mid, typ, cat, pw, ac, pp, ch, pr, gen = m.groups()
    prod[mid] = dict(type=typ, cat=cat, power=int(pw), acc=int(ac), pp=int(pp),
                     chance=int(ch), priority=int(pr), gen=int(gen))

src = {}
for m in re.finditer(
    r'new AttackMove\(MoveId\.([A-Z0-9_]+),\s*PokemonType\.([A-Z0-9_]+),\s*MoveCategory\.([A-Z0-9_]+),\s*(-?\d+),\s*(-?\d+),\s*(-?\d+),\s*(-?\d+),\s*(-?\d+),\s*(\d+)\)',
    src_txt):
    mid, typ, cat, pw, ac, pp, ch, pr, gen = m.groups()
    src[mid] = dict(type=typ, cat=cat, power=int(pw), acc=int(ac), pp=int(pp),
                    chance=int(ch), priority=int(pr), gen=int(gen))

print(f"产物招式数: {len(prod)}   源码招式数: {len(src)}")
print()

# 比对共有招式
common = sorted(set(prod) & set(src))
only_prod = sorted(set(prod) - set(src))
only_src = sorted(set(src) - set(prod))

diff_power_acc = []
diff_pp = []
for mid in common:
    p, s = prod[mid], src[mid]
    if (p['type'] != s['type']) or (p['cat'] != s['cat']) or (p['power'] != s['power']) or (p['acc'] != s['acc']):
        diff_power_acc.append((mid, p, s))
    if p['pp'] != s['pp']:
        diff_pp.append((mid, p['pp'], s['pp']))

print(f"=== 类型/类别/威力/命中 差异 ({len(diff_power_acc)}) ===")
for mid, p, s in diff_power_acc:
    print(f"  {mid:22s} 产物[{p['type']},{p['cat']},{p['power']},{p['acc']}]  源[{s['type']},{s['cat']},{s['power']},{s['acc']}]")
print()
print(f"=== PP 差异 ({len(diff_pp)}) ===")
for mid, pp_p, pp_s in diff_pp:
    print(f"  {mid:22s} 产物PP={pp_p}  源PP={pp_s}")
print()
print(f"=== 仅产物有 ({len(only_prod)}) ===")
print("  " + ", ".join(only_prod))
print()
print(f"=== 仅源码有 ({len(only_src)}) ===")
print("  " + ", ".join(only_src))

json.dump(dict(diff_power_acc=[(a, b, c) for a, b, c in diff_power_acc],
               diff_pp=diff_pp, only_prod=only_prod, only_src=only_src),
          open(r'D:/Work/Pokemon/new/.build-tools/a3-04-movediff.json', 'w', encoding='utf-8'),
          ensure_ascii=False, indent=1)
print("\n已写出 .build-tools/a3-04-movediff.json")
