import re, glob, os
files = glob.glob('game/server/dist/assets/*.js')
print("=== 找 form<=N && !==STELLAR 校验（MAX_POKEMON_TYPE 内联候选）===")
for f in files:
    s = open(f, encoding='utf-8', errors='ignore').read()
    for m in re.finditer(r'[^=<>!]{0,40}<=\s*1[89]\s*&&\s*[^&]{0,60}STELLAR', s):
        print(f"  [{os.path.basename(f)}] ...{s[max(0,m.start()-60):m.start()+90].replace(chr(10),' ')}")
print()
print("=== 找 randSeedInt(N) 且 N 附近有 STELLAR 语义（teraType 随机）===")
for f in files:
    s = open(f, encoding='utf-8', errors='ignore').read()
    for m in re.finditer(r'randSeedInt\(\s*1[89]\s*\)', s):
        print(f"  [{os.path.basename(f)}] ...{s[max(0,m.start()-90):m.start()+40].replace(chr(10),' ')}")
print()
print("=== 找 Object.values(R) 类型列表函数 ===")
for f in files:
    s = open(f, encoding='utf-8', errors='ignore').read()
    for m in re.finditer(r'Object\.values\((R|at|[A-Za-z]+)\)\.filter\(s=>typeof s=="number"\)', s):
        print(f"  [{os.path.basename(f)}] ...{s[max(0,m.start()-80):m.start()+200].replace(chr(10),' ')}")
