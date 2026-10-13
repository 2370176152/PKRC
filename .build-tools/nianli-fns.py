import re

s = open('game/server/dist/assets/loading-scene-By2k7Qfx.js', encoding='utf-8', errors='ignore').read()

# 从 NIANLI 区段（sPe 定义处）往后取 25000 字符，找所有 l(Var,"name") 命名的函数
i = s.find('sPe={exclusiveNodes:[U0,_Re,Db,GRe,dg]}')
seg = s[i:i + 30000]

print("=== NIANLI 区段函数 (l(短名,\"名\")) ===")
for m in re.finditer(r'l\((\w+),"([^"]+)"\)', seg):
    print(f"  {m.group(2):38s} <- {m.group(1)}")

print()
print("=== 区段内中文串所在函数 ===")
# 找含特定中文的片段
for kw in ["地震", "放电", "光子喷涌", "念力", "消耗", "随机一项能力"]:
    for m in re.finditer(re.escape(kw), seg):
        ctx = seg[max(0, m.start() - 130):m.start() + 60].replace("\n", " ")
        print(f"  [{kw}] ...{ctx}")
        break
