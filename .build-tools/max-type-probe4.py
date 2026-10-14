import re, glob, os
files = glob.glob('game/server/dist/assets/*.js')
print("=== 找 form>=0&&form<=N 校验（Arceus/Silvally 招式属性）===")
for f in files:
    s = open(f, encoding='utf-8', errors='ignore').read()
    for m in re.finditer(r'>=\s*0\s*&&\s*[A-Za-z_$][\w$]*\s*<=\s*\d+', s):
        print(f"  [{os.path.basename(f)}] ...{s[max(0,m.start()-70):m.start()+110].replace(chr(10),' ')}")
print()
print("=== 统计 <=18 / <=19 出现 ===")
for f in files:
    s = open(f, encoding='utf-8', errors='ignore').read()
    print(f"  [{os.path.basename(f)}] <=18:{len(re.findall(r'<=18', s))}  <=19:{len(re.findall(r'<=19', s))}")
print()
print("=== 找 R.STELLAR 附近的 <= 判定 ===")
for f in files:
    s = open(f, encoding='utf-8', errors='ignore').read()
    for m in re.finditer(r'<=[^;]{0,70}R\.STELLAR|R\.STELLAR[^;]{0,70}<=', s):
        print(f"  [{os.path.basename(f)}] ...{s[max(0,m.start()-60):m.start()+90].replace(chr(10),' ')}")
