import re, sys, os

def sig(path):
    s = open(path, encoding='utf-8', errors='ignore').read()
    return {
        "size": len(s),
        "__vite__mapDeps": len(re.findall(r"__vite__mapDeps", s)),
        "defineProperty_name_injector": len(re.findall(r"var\s+\w+\s*=\s*Object\.defineProperty;var\s+\w+\s*=\s*\(n,s\)=>", s)),
        "arrow_class_extends (rolldown特征)": len(re.findall(r"=class\s+[A-Za-z_$][A-Za-z0-9_$]*\s+extends", s)),
        "l(Class,\"Name\") keepNames": len(re.findall(r"\bl\(\w+,\"[A-Za-z0-9_]+\"\)", s)),
        "r(Class,\"Name\") keepNames": len(re.findall(r"\br\(\w+,\"[A-Za-z0-9_]+\"\)", s)),
        "_mergeNamespaces": s.count("_mergeNamespaces"),
    }

files = sys.argv[1:]
for f in files:
    if not os.path.exists(f):
        print(f"[MISSING] {f}")
        continue
    r = sig(f)
    print(f"=== {f} ===")
    print(f"  size                : {r['size']:,}")
    print(f"  __vite__mapDeps     : {r['__vite__mapDeps']}")
    print(f"  name_injector       : {r['defineProperty_name_injector']}")
    print(f"  arrow_class_extends : {r['arrow_class_extends (rolldown特征)']}")
    print(f"  l(Class,\"Name\")      : {r['l(Class,\"Name\") keepNames']}")
    print(f"  r(Class,\"Name\")      : {r['r(Class,\"Name\") keepNames']}")
    print(f"  _mergeNamespaces    : {r['_mergeNamespaces']}")
    print()
