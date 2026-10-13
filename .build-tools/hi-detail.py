import re
s = open('game/server/dist/assets/loading-scene-By2k7Qfx.js', encoding='utf-8', errors='ignore').read()

# 系统注册: (数组名, codex名, reg名, 尾注释)
targets = [
    ("CEe", "PSe", "_Se", "CALLINGCARD/偷心怪盗"),
    (None, "$Se", "QSe", "MELOETTA/旋律"),   # hI(e.MELOETTA,...)
    (None, "gTe", "HTe", "MEW/基因"),        # hI(e.MEW,...)
    ("ww", "mTe", "BTe", "MANAPHY+PHIONE/海之守护"),
    ("mre", "Que", "Jue", "DIANXIN/感电点心"),
    ("Vre", "$ce", "Qce", "HEALER/治疗守护"),
    ("mRe", "tPe", "sPe", "NIANLI/念力"),
    ("TOe", "P1e", "_1e", "赤心/潜心"),
]

def find_def(name):
    """找 const/let/var name= 或 name=[ 定义"""
    m = re.search(r'(?:const|let|var)\s+' + re.escape(name) + r'\s*=\s*', s)
    if not m:
        m = re.search(r'(?<![\w$])' + re.escape(name) + r'\s*=\s*\[', s)
    if not m:
        return None, None
    # 从 = 之后取一段
    p = m.end()
    return m.start(), s[p:p+320].replace("\n", " ")

def node_vals(names):
    out = []
    for nm in names:
        m = re.search(r'(?<![\w$])' + re.escape(nm) + r'\s*=\s*(\d+)', s)
        out.append(f"{nm}={m.group(1) if m else '?'}")
    return out

print("=" * 70)
for arr, codex, reg, label in targets:
    print(f"### {label}")
    if arr:
        st, txt = find_def(arr)
        print(f"  species[{arr}] = {txt[:200] if txt else 'NOT FOUND'}")
    # 节点常量
    st2, txt2 = find_def(reg)
    if txt2:
        nodes = re.search(r'exclusiveNodes:\[([^\]]*)\]', txt2)
        if nodes:
            nl = [x.strip() for x in nodes.group(1).split(",")]
            print(f"  {reg}.exclusiveNodes = [{', '.join(node_vals(nl))}]")
    print()
