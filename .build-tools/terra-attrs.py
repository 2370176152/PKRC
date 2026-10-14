import re
s = open('game/server/dist/assets/loading-scene-By2k7Qfx.js', encoding='utf-8', errors='ignore').read()

def get_class(orig):
    """通过 l(Var,"orig") 反查短名，再取 class 完整体（花括号配平）"""
    m = re.search(r'l\((\w+),"'+re.escape(orig)+r'"\)', s)
    if not m:
        return None
    var = m.group(1)
    # 向前找 class var
    cm = None
    for cm in re.finditer(r'\bclass\s+'+re.escape(var)+r'\b', s[:m.start()]):
        pass
    if not cm:
        return None
    p = cm.start()
    d = 0; started = False
    for k in range(p, min(len(s), p+4000)):
        if s[k] == '{':
            d += 1; started = True
        elif s[k] == '}':
            d -= 1
            if started and d == 0:
                # 加上结尾的 l(...) 声明
                tail = s[k+1:k+1+len(',l('+var+',"'+orig+'");')]
                return s[p:k+1] + '  <<<  ' + tail
    return s[p:p+1600]

for name in ["TeraStarstormTypeAttr", "TeraMoveCategoryAttr", "VariableMoveTypeAttr"]:
    print("="*70)
    print("### " + name)
    print(get_class(name) or "(not found)")
    print()
