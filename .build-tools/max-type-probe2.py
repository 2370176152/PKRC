import re, glob, os
files = glob.glob('game/server/dist/assets/*.js')
print("=== 产物中所有 STELLAR 出现点 ===")
for f in files:
    s = open(f, encoding='utf-8', errors='ignore').read()
    for m in re.finditer(r'R\.STELLAR|[A-Za-z]+\.STELLAR', s):
        print(f"  [{os.path.basename(f)}] ...{s[max(0,m.start()-70):m.start()+70].replace(chr(10),' ')}")
print()
print("=== Arceus/Silvally form 校验（找 formIndex 与 <=）===")
for f in files:
    s = open(f, encoding='utf-8', errors='ignore').read()
    for m in re.finditer(r'formIndex[^;]{0,80}<=', s):
        print(f"  [{os.path.basename(f)}] ...{s[max(0,m.start()-60):m.start()+120].replace(chr(10),' ')}")
print()
print("=== MAX_POKEMON_TYPE 候选：值为 18 或 19 的独立常量 ===")
for f in files:
    s = open(f, encoding='utf-8', errors='ignore').read()
    for m in re.finditer(r'(maxPokemonType|MaxPokemonType|MAX_TYPE)', s):
        print(f"  [{os.path.basename(f)}] ...{s[max(0,m.start()-60):m.start()+60].replace(chr(10),' ')}")
