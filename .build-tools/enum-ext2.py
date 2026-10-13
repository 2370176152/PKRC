import re, glob, os

print("=== PokemonType 枚举定义（找含 STELLAR 的 enum reverse-map）===")
for f in glob.glob('game/server/dist/assets/*.js'):
    s = open(f, encoding='utf-8', errors='ignore').read()
    # 找形如 (X=>{X[X.NORMAL=0]="NORMAL"...})(X||{}) 且含 STELLAR
    for m in re.finditer(r'\((\w+)=>\{[^}]{40,4000}\}\)\((\w+)\|\|\{\}\)', s):
        body = m.group(0)
        if "STELLAR" in body and "NORMAL" in body:
            print(f"[{os.path.basename(f)}] {body[:900]}")
            print()
            break

print()
print("=== 找 CS= 常量（PokemonType.CS 值）===")
for f in glob.glob('game/server/dist/assets/*.js'):
    s = open(f, encoding='utf-8', errors='ignore').read()
    for m in re.finditer(r'\.CS\s*=\s*(\d+)', s):
        print(f"[{os.path.basename(f)}] ...{s[max(0,m.start()-120):m.start()+40]}")
        break

print()
print("=== MoveId 新招式：搜索所有文件 new <X>(<Y>.NIHIL_LIGHT ===")
for mv in ["NIHIL_LIGHT", "PHOTON_GEYSER", "TERA_STARSTORM", "NIHIL"]:
    print(f"-- {mv} --")
    for f in glob.glob('game/server/dist/assets/*.js'):
        s = open(f, encoding='utf-8', errors='ignore').read()
        n = 0
        for m in re.finditer(re.escape(mv), s):
            print(f"   [{os.path.basename(f)}] ...{s[max(0,m.start()-70):m.start()+90].replace(chr(10),' ')}")
            n += 1
            if n >= 2: break
