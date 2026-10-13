import re
s = open('game/server/dist/assets/loading-scene-By2k7Qfx.js', encoding='utf-8', errors='ignore').read()

print("=== MoveId 扩展：新招式数据行 ===")
for mv in ["NIHIL_LIGHT", "PHOTON_GEYSER", "TERA_STARSTORM"]:
    for m in re.finditer(r'new v\(t\.' + mv + r'\)', s):
        print(f"  {mv}: ...{s[max(0,m.start()-40):m.start()+140].replace(chr(10),' ')}")
        break
    else:
        print(f"  {mv}: (未找到 new v(t.{mv}))")

print()
print("=== PokemonType.CS 使用上下文 ===")
n = 0
for m in re.finditer(r'R\.CS\b', s):
    print(f"  ...{s[max(0,m.start()-90):m.start()+60].replace(chr(10),' ')}")
    n += 1
    if n >= 6: break

print()
print("=== PokemonType.STELLAR 使用上下文 (前3) ===")
n = 0
for m in re.finditer(r'R\.STELLAR\b', s):
    print(f"  ...{s[max(0,m.start()-80):m.start()+50].replace(chr(10),' ')}")
    n += 1
    if n >= 3: break

print()
print("=== R 枚举定义（PokemonType reverse map）===")
m = re.search(r'\(R\s*=\s*\{\}\)|R\s*=\s*\{', s)
if m:
    print(s[m.start():m.start()+600].replace("\n", " "))
