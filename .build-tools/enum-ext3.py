import re

# MoveId 尾部扩展示例（index 文件）
s = open('game/server/dist/assets/index-D3KKGO7Y.js', encoding='utf-8', errors='ignore').read()
m = re.search(r'\((\w+)=>\{', s)
# 找含 NIHIL_LIGHT 的 enum 定义全段
i = s.find("NIHIL_LIGHT=932")
if i > 0:
    # 往前找 enum 起始
    st = s.rfind("e[e.", 0, i - 3000)
    print("=== MoveId 扩展尾部（含 NIHIL_LIGHT / KB1..KB4 等）===")
    print(s[max(0, i - 700):i + 400].replace("\n", " "))
    print()

# 找 KB1..KB4 后面的成员
j = s.find("KB4=936")
if j > 0:
    print("=== KB1..KB4 之后 ===")
    print(s[j:j + 700].replace("\n", " "))
    print()

# 找 Ability 扩展（o.X 新技能）
print("=== 新技能/特性候选（中文名）===")
ls = open('game/server/dist/assets/loading-scene-By2k7Qfx.js', encoding='utf-8', errors='ignore').read()
for kw in ["光子喷涌", "虚无之光", "洁净光芒", "骨之极意", "念力爆发"]:
    for mm in re.finditer(re.escape(kw), ls):
        print(f"  [{kw}] ...{ls[max(0,mm.start()-60):mm.start()+80].replace(chr(10),' ')}")
        break
