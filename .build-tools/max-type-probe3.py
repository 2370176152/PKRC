import re, glob, os
files = glob.glob('game/server/dist/assets/*.js')
print("=== 产物中 teraType 赋值（weird-dream 等价物）===")
for f in files:
    s = open(f, encoding='utf-8', errors='ignore').read()
    for m in re.finditer(r'teraType\s*=', s):
        print(f"  [{os.path.basename(f)}] ...{s[max(0,m.start()-90):m.start()+60].replace(chr(10),' ')}")
print()
print("=== 产物中 Arceus/Silvally 招式属性判定（form<=N）===")
for f in files:
    s = open(f, encoding='utf-8', errors='ignore').read()
    for m in re.finditer(r'ARCEUS', s):
        seg = s[max(0,m.start()-40):m.start()+400]
        if '<=' in seg and 'form' in seg.lower():
            print(f"  [{os.path.basename(f)}] ...{seg.replace(chr(10),' ')}")
            break
print()
print("=== pe(18)/pe(19) 统计 ===")
for f in files:
    s = open(f, encoding='utf-8', errors='ignore').read()
    c18 = len(re.findall(r'pe\(18\)', s))
    c19 = len(re.findall(r'pe\(19\)', s))
    print(f"  [{os.path.basename(f)}] pe(18)={c18}  pe(19)={c19}")
