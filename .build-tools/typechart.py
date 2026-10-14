import re
s = open('game/server/dist/assets/loading-scene-By2k7Qfx.js', encoding='utf-8', errors='ignore').read()

# 找含 "switch(s){case R.NORMAL:" 的函数完整体
i = s.find('switch(s){case R.NORMAL:')
# 向前找 function
p = s.rfind('function ', 0, i)
# 向后花括号配平
d = 0; started = False; end = None
for k in range(p, min(len(s), p+9000)):
    if s[k] == '{':
        d += 1; started = True
    elif s[k] == '}':
        d -= 1
        if started and d == 0:
            end = k+1
            break
body = s[p:end]
print("长度:", len(body))
print(body)
print()
print("=== 尾随的 l(...) ===")
print(s[end:end+80])
