#!/usr/bin/env python3
"""从产物中提取指定标识符（函数/类）的完整代码片段。"""
import re, sys, os
from pathlib import Path

# 仓库根目录：由脚本自身位置推导（.build-tools/ 的上一级），可移植
ROOT = str(Path(__file__).resolve().parents[1])
ASSETS = os.path.join(ROOT, "game/server/dist/assets")

def find_defs(s, name):
    """找到 name 的定义位置。
    魔改者形态： function 短名(...){...} l(短名,"原函数名")  或  class 短名 ... l(短名,"原名")
    """
    out = []
    for m in re.finditer(r'\bl\((\w+),"'+re.escape(name)+r'"\)', s):
        var = m.group(1)
        # 找最近的 function var( 或 class var
        fm = None
        for fm in re.finditer(r'\bfunction\s+'+re.escape(var)+r'\s*\(', s[:m.start()]):
            pass
        if fm: out.append(("function:"+var, fm.start()))
        cm = None
        for cm in re.finditer(r'\bclass\s+'+re.escape(var)+r'\b', s[:m.start()]):
            pass
        if cm and (fm is None or cm.start() > fm.start()):
            out.append(("class:"+var, cm.start()))
        if fm is None and cm is None:
            # var 赋值形态
            am = None
            for am in re.finditer(r'\b'+re.escape(var)+r'\s*=\s*(?:async\s*)?(?:function|\()', s[:m.start()]):
                pass
            if am: out.append(("assign:"+var, am.start()))
    return out

def extract(path, name, maxlen=1400):
    s = open(path, encoding="utf-8", errors="ignore").read()
    defs = find_defs(s, name)
    if not defs: return None
    kind, pos = defs[0]
    return kind, s[pos:pos+maxlen]

if __name__ == "__main__":
    name = sys.argv[1]
    for f in ["loading-scene-By2k7Qfx.js","index-D3KKGO7Y.js","legendary-popup-CYOZDx4m.js"]:
        p = os.path.join(ASSETS, f)
        r = extract(p, name)
        if r:
            print(f"=== {name}  in {f}  [{r[0]}] ===")
            print(r[1])
            print()
