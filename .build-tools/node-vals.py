import re
s = open('game/server/dist/assets/loading-scene-By2k7Qfx.js', encoding='utf-8', errors='ignore').read()

# 所有节点常量
node_names = set("""o0 SEe TEe LEe z1 mw PEe _Ee GEe gEe Bw Kw xEe VEe kEe ZEe mM
JEe jEe zEe qEe ere vw zm Hre pre jw Og eb pU Kre tb Wre lg
U0 _Re Db GRe dg g0 OOe IOe Pg H0 NEe uEe""".split())

print("=== 节点常量值 ===")
for nm in sorted(node_names):
    m = re.search(r'(?<![\w$])' + re.escape(nm) + r'\s*=\s*(\d+)', s)
    print(f"  {nm} = {m.group(1) if m else '?'}")

print()
print("=== MELOETTA 注册 ($Se / QSe) ===")
m = re.search(r'(?<![\w$])\$Se\s*=', s)
print(s[m.start():m.start()+180].replace("\n", " ") if m else "NOT FOUND")

print()
print("=== MEW 注册 (gTe / HTe) ===")
m = re.search(r'(?<![\w$])gTe\s*=', s)
print(s[m.start():m.start()+180].replace("\n", " ") if m else "NOT FOUND")

print()
print("=== 通用节点常量区 (o0..z1 附近) ===")
m = re.search(r'(?<![\w$])o0\s*=', s)
print(s[m.start():m.start()+220].replace("\n", " ") if m else "NOT FOUND")
