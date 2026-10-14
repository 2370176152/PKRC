import re, glob, os
files = glob.glob('game/server/dist/assets/*.js')
print("=== <=19 出现点上下文 ===")
for f in files:
    s = open(f, encoding='utf-8', errors='ignore').read()
    for m in re.finditer(r'<=19', s):
        print(f"  [{os.path.basename(f)}] ...{s[max(0,m.start()-140):m.start()+80].replace(chr(10),' ')}")
        print()
print("=== pe(19) 特查 ===")
for f in files:
    s = open(f, encoding='utf-8', errors='ignore').read()
    for m in re.finditer(r'pe\(19\)', s):
        print(f"  [{os.path.basename(f)}] ...{s[max(0,m.start()-120):m.start()+60].replace(chr(10),' ')}")
