#!/usr/bin/env python3
"""分析构建产物的构建工具签名，区分 rollup vs rolldown。"""
import re
import sys

def analyze(path, label):
    with open(path, "rb") as f:
        s = f.read().decode("utf-8", errors="replace")
    head = s[:3000]
    checks = {
        "__vite__mapDeps": len(re.findall(r"__vite__mapDeps", s)),
        "name_injector_var_l": len(re.findall(r"var\s+\w+\s*=\s*Object\.defineProperty;var\s+\w+\s*=\s*\(n,s\)=>", s)),
        "Object_defineProperty": len(re.findall(r"Object\.defineProperty", s)),
        "arrow_class_extends": len(re.findall(r"=class\s+[A-Za-z_$][A-Za-z0-9_$]*\s+extends", s)),
        "l_class_name_pat": len(re.findall(r"\bl\(\w+,\"[A-Za-z0-9_]+\"\)", s)),
    }
    print(f"=== {label} ===")
    print(f"  path: {path}")
    print(f"  size: {len(s):,} bytes")
    print(f"  head: {head[:180]!r}")
    for k, v in checks.items():
        print(f"  {k}: {v}")
    # 判定
    if checks["__vite__mapDeps"] > 0 and checks["name_injector_var_l"] > 0:
        verdict = "ROLLUP (vite-rollup build, keepNames via defineProperty injector)"
    elif checks["arrow_class_extends"] > 0 and checks["name_injector_var_l"] == 0:
        verdict = "ROLLDOWN (vite 8 rolldown/oxc build)"
    else:
        verdict = "UNCLEAR"
    print(f"  VERDICT: {verdict}")
    print()
    return verdict

if __name__ == "__main__":
    for arg in sys.argv[1:]:
        if "::" in arg:
            p, l = arg.split("::", 1)
        else:
            p, l = arg, arg
        try:
            analyze(p, l)
        except Exception as e:
            print(f"ERROR {p}: {e}")
