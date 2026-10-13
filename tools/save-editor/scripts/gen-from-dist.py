#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
从【改版本体】重新生成存档修改器的数据表（species-names / move-names / ability-names / move-info）。

背景：原修改器的数据表是从官方 PokeRogue 源码生成的，缺少改版新增的物种/招式/特性。
本脚本直接从改版发行目录（game/server/dist）逆向提取枚举 + zh-CN 本地化，生成与本体完全一致的表。

用法（项目根目录下执行）：
    python tools/save-editor/scripts/gen-from-dist.py

依赖：仅标准库。
输出（写入 tools/save-editor/data/ 下同名文件；历史版本备份在 tools/save-editor/backups/original/）：
    species-names.js  move-names.js  ability-names.js  move-info.js
"""
import re
import io
import os
import json

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
EDITOR_DIR = os.path.dirname(SCRIPT_DIR)                 # tools/save-editor
ROOT = os.path.dirname(os.path.dirname(EDITOR_DIR))      # 项目根
DIST = os.path.join(ROOT, 'game', 'server', 'dist')
OUT = os.path.join(EDITOR_DIR, 'data')
BAK = os.path.join(EDITOR_DIR, 'backups', 'original')
LOCA = os.path.join(DIST, 'locales', 'zh-CN')

# 承载枚举的分片（按需在 assets 里自动定位）
def find_asset(*markers):
    assets = os.path.join(DIST, 'assets')
    for fn in sorted(os.listdir(assets)):
        if not fn.endswith('.js'):
            continue
        s = io.open(os.path.join(assets, fn), encoding='utf-8', errors='ignore').read()
        if all(m in s for m in markers):
            return s
    raise SystemExit('未找到包含 %s 的脚本分片' % (markers,))


SP = find_asset('n[n.BULBASAUR=1]')
IDX = find_asset('POUND=1', 'STENCH=1')

ENUM_RE = re.compile(r'(\w)\[(\w)\.([A-Za-z0-9_]+)=(-?\d+)\]="\3"')


def enum_at(text, first_member):
    m = re.search(r'\w\[\w\.%s=(-?\d+)\]="%s"' % (first_member, first_member), text)
    if not m:
        return {}
    j = m.start()
    start = text.rfind('=((', 0, j)
    start = start if start >= 0 else max(0, j - 200)
    end = text.find('))(', j)
    d = {}
    for mm in ENUM_RE.finditer(text[start:end]):
        if mm.group(1) == mm.group(2):
            d[mm.group(3)] = int(mm.group(4))
    return d


# 性格名会混入物种枚举尾部，需剔除
NATURE_NOISE = {
    'HARDY', 'LONELY', 'BRAVE', 'ADAMANT', 'NAUGHTY', 'BOLD', 'DOCILE', 'RELAXED', 'IMPISH',
    'LAX', 'TIMID', 'HASTY', 'SERIOUS', 'JOLLY', 'NAIVE', 'MODEST', 'MILD', 'QUIET', 'BASHFUL',
    'RASH', 'CALM', 'GENTLE', 'SASSY', 'CAREFUL', 'QUIRKY',
}

species = {k: v for k, v in enum_at(SP, 'BULBASAUR').items() if v >= 1 and k not in NATURE_NOISE}
moves = {k: v for k, v in enum_at(IDX, 'POUND').items() if k not in ('NORMAL', 'ABBREVIATED')}
abil = {k: v for k, v in enum_at(IDX, 'STENCH').items() if not (k == 'NONE' and v != 0)}

pok = json.load(io.open(os.path.join(LOCA, 'pokemon.json'), encoding='utf-8'))
mov = json.load(io.open(os.path.join(LOCA, 'move.json'), encoding='utf-8'))
abi = json.load(io.open(os.path.join(LOCA, 'ability.json'), encoding='utf-8'))


def camel(u):
    p = u.split('_')
    return p[0].lower() + ''.join(x.capitalize() for x in p[1:])


def old_keys(path):
    try:
        s = io.open(path, encoding='utf-8').read()
    except OSError:
        return {}
    return {int(m.group(1)): m.group(2) for m in re.finditer(r'"(\d+)": "(.*?)"', s)}


# ---------- species-names.js ----------
merged = {}
for name, sid in sorted(species.items(), key=lambda kv: kv[1]):
    nm = pok.get(name.lower())
    if nm is not None:
        merged[sid] = nm
kept = 0
for sid, nm in old_keys(os.path.join(BAK, 'species-names.js')).items():
    if sid not in merged:            # 并集：保留改版枚举已移除、老存档可能仍在用的历史形变 ID
        merged[sid] = nm
        kept += 1
lines = ['const SPECIES_NAMES = {']
items = sorted(merged.items())
for i, (sid, nm) in enumerate(items):
    lines.append('  "%d": "%s"%s' % (sid, nm, '' if i == len(items) - 1 else ','))
lines.append('};')
io.open(os.path.join(OUT, 'species-names.js'), 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
print('species-names.js ->', len(merged), '(+%d legacy)' % kept)


def gen_name_table(enum, locale, varname, header1, header2, out_name):
    o = [header1, header2, 'const %s = {' % varname]
    for name, i in sorted(enum.items(), key=lambda kv: kv[1]):
        e = locale.get(camel(name)) or {}
        cn = (e.get('name') or '').strip() or ('未知' if name == 'NONE' else name)
        o.append('  "%d": "%s (%s)",' % (i, cn, name))
    o.append('};')
    io.open(os.path.join(OUT, out_name), 'w', encoding='utf-8').write('\n'.join(o) + '\n')
    print(out_name, '->', len(enum), 'entries')


gen_name_table(moves, mov, 'MOVE_NAMES',
               '// 自动生成: MoveId -> 中文名',
               '// 注意: MoveId 是连续整数 (NONE=0, POUND=1, ...)', 'move-names.js')
gen_name_table(abil, abi, 'ABILITY_NAMES',
               '// 自动生成: AbilityId -> 中文名',
               '// 注意: AbilityId 是连续整数 (NONE=0, STENCH=1, ...)', 'ability-names.js')

# ---------- move-info.js ----------
# 招式初始化块位于承载物种枚举的分片（loading-scene）中，形如 push(new v(MoveId.POUND,Type.NORMAL,...), ...)
anchor = re.search(r'new \w+\(\w+\.POUND,', SP)
if not anchor:
    raise SystemExit('未找到招式初始化块')
i = anchor.start()
op = SP.index('(', SP.rindex('push(', 0, i))   # 外层 push( 的括号
depth = 0
for k in range(op, len(SP)):
    if SP[k] == '(':
        depth += 1
    elif SP[k] == ')':
        depth -= 1
        if depth == 0:
            end = k
            break
body = SP[op + 1:end]


def split_top(s):
    out, cur, d = [], '', 0
    for c in s:
        if c in '([':
            d += 1; cur += c
        elif c in ')]':
            d -= 1; cur += c
        elif c == ',' and d == 0:
            out.append(cur); cur = ''
        else:
            cur += c
    if cur:
        out.append(cur)
    return [x.strip() for x in out]


stats = {}
for part in split_top(body):
    m = re.match(r'new [\w$]+\(', part)      # 混淆后的类名可能含 $（如 $K）
    if not m:
        continue
    o2 = part.index('(')
    d2 = 0
    for k in range(o2, len(part)):
        if part[k] == '(':
            d2 += 1
        elif part[k] == ')':
            d2 -= 1
            if d2 == 0:
                c2 = k
                break
    a = split_top(part[o2 + 1:c2])
    mid = re.match(r'[\w$]+\.(\w+)$', a[0])
    if not mid or len(a) < 7:
        continue
    nm = mid.group(1)
    typ = a[1].split('.', 1)[1] if '.' in a[1] else a[1]
    if len(a) >= 9:                                   # AttackMove: id,type,cat,power,acc,pp,chance,prio,gen
        cat, power, acc, pp = a[2].split('.', 1)[-1], a[3], a[4], a[5]
    else:                                             # StatusMove: id,type,acc,pp,chance,prio,gen
        cat, power, acc, pp = 'STATUS', '', a[2], a[3]
    strip = lambda x: '' if (x is None or x.strip() == '-1') else x.strip()
    stats[nm] = dict(type=typ, category=cat, power=strip(power), accuracy=strip(acc), pp=strip(pp))

o = ['// 自动生成: moveId -> { name, effect, type, power, accuracy, pp, category }', 'const MOVE_INFO = {']
by_id = {v: k for k, v in moves.items()}
n = 0
for mid in range(0, max(moves.values()) + 1):
    nm = by_id.get(mid)
    if not nm:
        continue
    e = mov.get(camel(nm)) or {}
    name = e.get('name') or nm
    effect = re.sub(r'\s+', ' ', (e.get('effect') or '').replace('\n', ' ')).strip()
    s = stats.get(nm, {})
    esc = lambda x: x.replace('"', '\\"')
    o.append('  %d: { name: "%s", effect: "%s", type: "%s", power: "%s", accuracy: "%s", pp: "%s", category: "%s" },'
             % (mid, esc(name), esc(effect), s.get('type', ''), s.get('power', ''), s.get('accuracy', ''), s.get('pp', ''), s.get('category', '')))
    n += 1
o.append('};')
io.open(os.path.join(OUT, 'move-info.js'), 'w', encoding='utf-8').write('\n'.join(o) + '\n')
print('move-info.js ->', n, 'entries')
print('完成。')
