import re
s = open('game/server/dist/assets/loading-scene-By2k7Qfx.js', encoding='utf-8', errors='ignore').read()
calls = list(re.finditer(r'\bhI\(', s))
print(f'hI 调用总数: {len(calls)}\n')
en_re = re.compile(r'\{exclusiveNodes:\[([^\]]*)\]\}')
for i, m in enumerate(calls):
    seg = s[max(0, m.start() - 3600):m.start() + 140]
    en = list(en_re.finditer(seg))
    nodearr = en[-1].group(1) if en else '?'
    tail = seg[-170:].replace("\n", " ")
    print(f'[{i}] nodes=[{nodearr}]')
    print(f'     tail: ...{tail}')
    print()
