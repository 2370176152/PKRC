import re, glob, os
files = glob.glob('game/server/dist/assets/*.js')
print("=== 精确统计 <=18 / <=19（数字边界）===")
for f in files:
    s = open(f, encoding='utf-8', errors='ignore').read()
    c18 = len(re.findall(r'<=18(?![0-9])', s))
    c19 = len(re.findall(r'<=19(?![0-9])', s))
    if c18 or c19:
        print(f"  [{os.path.basename(f)}] <=18:{c18}  <=19:{c19}")
print()
print("=== 找 SILVALLY 附近判定（Arceus/Silvally 招式属性）===")
for f in files:
    s = open(f, encoding='utf-8', errors='ignore').read()
    for m in re.finditer(r'SILVALLY', s):
        seg = s[max(0, m.start()-200):m.start()+300]
        if 'ATK' in seg or '<=' in seg or 'STELLAR' in seg:
            print(f"  [{os.path.basename(f)}] ...{seg.replace(chr(10),' ')}")
            print()
