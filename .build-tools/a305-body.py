#!/usr/bin/env python3
"""A3-05: extract full function/const bodies by product short-name.
   Usage: python a305-body.py CEe   (dumps const), or MSe (dumps fn)
   Also: python a305-body.py --region POS_BEFORE POS_AFTER   dump raw region.
"""
import re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
s = (ROOT / "game/server/dist/assets/loading-scene-By2k7Qfx.js").read_text(encoding="utf-8", errors="ignore")
namemap = {m.group(1): m.group(2) for m in re.finditer(r'\bl\((\w+),"([A-Za-z_$][A-Za-z0-9_$]*)"\)', s)}

def find_fn(shorts):
    out = []
    for short in shorts:
        found = None
        for pat in [rf'\bfunction\s+{re.escape(short)}\s*\(',
                    rf'\basync\s+function\s+{re.escape(short)}\s*\(',
                    rf'\bclass\s+{re.escape(short)}\b']:
            m = re.search(pat, s)
            if m:
                i = s.find('{', m.end()-1)
                depth=0; j=i
                while j < len(s):
                    if s[j]=='{': depth+=1
                    elif s[j]=='}':
                        depth-=1
                        if depth==0: break
                    j+=1
                found = (short, s[m.start():j+1])
                break
        if found is None:
            m = re.search(rf'\b(?:const|let|var)\s+{re.escape(short)}\s*=\s*(.)', s)
            if m:
                # balance for arrays/objects
                i = m.start(1); 
                if s[i] in '[{(':
                    close = {'[':']','{':'}','(':')'}[s[i]]
                    depth=0; j=i
                    while j < len(s):
                        if s[j]==s[i]: depth+=1
                        elif s[j]==close:
                            depth-=1
                            if depth==0: break
                        j+=1
                    found = (short, s[m.start():j+1])
                else:
                    # till ;
                    j = s.find(';', i)
                    found = (short, s[m.start():min(j+1, m.start()+4000)])
        if found:
            nm = namemap.get(short, '?')
            out.append(f"// ===== {short}  (原名: {nm}) =====\n{found[1]}")
        else:
            out.append(f"// ===== {short}  NOT FOUND =====")
    return "\n\n".join(out)

if __name__ == "__main__":
    if sys.argv[1] == "--region":
        a, b = int(sys.argv[2]), int(sys.argv[3])
        print(s[a:b])
    elif sys.argv[1] == "--anchor":
        needle = sys.argv[2]
        i = s.find(needle)
        print(f"pos={i}")
        print(s[max(0,i-200):i+200] if i>=0 else "not found")
    else:
        print(find_fn(sys.argv[1:]))
