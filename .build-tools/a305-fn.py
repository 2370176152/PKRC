#!/usr/bin/env python3
"""A3-05 detail dump: for each of 7 systems, dump codex + species array + all named fns referenced
   in the hI(pt, codex, hooks) registration, plus all Chinese strings in the region. """
import re, sys, json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
s = (ROOT / "game/server/dist/assets/loading-scene-By2k7Qfx.js").read_text(encoding="utf-8", errors="ignore")

namemap = {m.group(1): m.group(2) for m in re.finditer(r'\bl\((\w+),"([A-Za-z_$][A-Za-z0-9_$]*)"\)', s)}

def get_fn(short):
    """extract `function short(...)` or `class short ...` or `short=...` body via brace balance."""
    for pat in [rf'\bfunction\s+{re.escape(short)}\s*\(', rf'\bclass\s+{re.escape(short)}\b', rf'\b{re.escape(short)}\s*=\s*\(', rf'\b{re.escape(short)}\s*=\s*function']:
        m = re.search(pat, s)
        if not m: continue
        start = m.start()
        # find first { after
        i = s.find('{', m.end()-1)
        if i < 0: continue
        depth=0; j=i
        while j < len(s):
            if s[j]=='{': depth+=1
            elif s[j]=='}':
                depth-=1
                if depth==0: break
            j+=1
        return s[start:j+1]
    return None

def dump(short, label):
    body = get_fn(short)
    print(f"===== {label}: {short} (原名 {namemap.get(short,'?')}) =====")
    if body is None:
        print("  !! not found as fn/class")
        # try const
        m = re.search(rf'\b(?:const|let|var)\s+{re.escape(short)}\s*=\s*(.{{0,400}})', s)
        if m: print("  const =", m.group(1)[:400])
    else:
        print(body[:3000])
    print()

if __name__ == "__main__":
    for arg in sys.argv[1:]:
        if ":" in arg:
            sh, lb = arg.split(":",1)
        else:
            sh, lb = arg, arg
        dump(sh, lb)
