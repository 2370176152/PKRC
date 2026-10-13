import re, os, sys, json

BASE = ".build-tools/anchor-apr18/pokerogue-f52a566f5215e20a0b29ec0202ea4c96dc2b87c5/src"
ANCHOR = ".build-tools/tarball-src/pokerogue-90df65097b6df76f713e6bd108afa84499e8b993/src"

def collect_named_entities(root):
    names = set()
    pat = re.compile(r'(?:^|\s)(?:export\s+)?(?:abstract\s+)?(?:class|interface|enum|type|function|const|let)\s+([A-Za-z_$][A-Za-z0-9_$]*)')
    for dirpath, _, files in os.walk(root):
        for f in files:
            if not f.endswith(('.ts','.tsx')): continue
            try:
                s = open(os.path.join(dirpath,f),encoding='utf-8',errors='ignore').read()
            except: continue
            for m in pat.finditer(s):
                names.add(m.group(1))
    return names

# 产物类名（从 .orig 提取 __vite__ 之外的 keepNames 保留名）
prod_names = set()
p = "tools/game-patcher/backup/loading-scene-By2k7Qfx.js.orig"
s = open(p,encoding='utf-8',errors='ignore').read()
# keepNames 形态: l(Class,"Name") 或 r(Class,"Name")
for m in re.finditer(r'\b[lr]\(\w+,"([A-Za-z_$][A-Za-z0-9_$]*)"\)', s):
    prod_names.add(m.group(1))

print("产物中的保留类名总数:", len(prod_names))
print()

base_names = collect_named_entities(BASE)
anchor_names = collect_named_entities(ANCHOR)
print("04-18 树命名实体:", len(base_names))
print("06-08 锚点命名实体:", len(anchor_names))
print()

in_base = prod_names & base_names
in_anchor = prod_names & anchor_names
print(f"产物类名 ∩ 04-18: {len(in_base)}  ({100*len(in_base)/max(1,len(prod_names)):.1f}%)")
print(f"产物类名 ∩ 06-08: {len(in_anchor)}  ({100*len(in_anchor)/max(1,len(prod_names)):.1f}%)")
print()

# 只出现在 anchor 不在 base 的（上游06-08新增）
only_anchor = in_anchor - in_base
only_base = in_base - in_anchor
print("产物类名中: 仅04-18有 =", len(only_base), " 仅06-08有 =", len(only_anchor))
print()
print("样例(仅04-18匹配, 支持04-18基线):", sorted(list(only_base))[:15])
print()
print("样例(仅06-08匹配):", sorted(list(only_anchor))[:15])
