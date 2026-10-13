import re

s = open('game/server/dist/assets/loading-scene-By2k7Qfx.js', encoding='utf-8', errors='ignore').read()

def get_fn(name, n=700):
    m = re.search(r'function ' + re.escape(name) + r'\s*\(', s)
    if m:
        # 找到匹配的闭合括号
        p = m.start()
        d = 0
        started = False
        for k in range(m.end() - 1, min(len(s), m.end() + 4000)):
            if s[k] == '{':
                d += 1; started = True
            elif s[k] == '}':
                d -= 1
                if started and d == 0:
                    return s[p:k + 1]
        return s[p:p + n]
    return None

for short, orig in [("RPe","tryGainFromSpreadMove"), ("oPe","applyNianLiOnMoveUse"),
                    ("OPe","dropRandomStat"), ("jr","nianLiNodeActive"),
                    ("nPe","nianLiDamageMultiplier"), ("APe","nianLiStatMultiplier"),
                    ("fb","gainNianLiStacks"), ("$ne","consumeAllStacks"),
                    ("SPe","onNianLiTurnStart"), ("TPe","tryNianLiEndure"),
                    ("LPe","tryNianLiBurst"), ("QH","healFromConsume")]:
    body = get_fn(short)
    print(f"### {orig}  ({short})")
    print(body.replace("\n", " ") if body else "  NOT FOUND")
    print()
