# A1.3: 验证 7 条 patch 的 old/new 串在 .orig(原始) 与 live(已打补丁) 中的命中情况
import io, os
from pathlib import Path

# 仓库根目录：由脚本自身位置推导（.build-tools/ 的上一级），可移植
ROOT = str(Path(__file__).resolve().parents[1])
BK = os.path.join(ROOT, "tools/game-patcher/backup")

PATCHES = [
    {"id":"tera-starstorm-type","file":"game/server/dist/assets/loading-scene-By2k7Qfx.js",
     "old":"const dZ=class dZ extends bs{apply(s,i,A,a){if(s.isTerastallized&&s.hasSpecies(e.TERAPAGOS)){const r=a[0];return r.value=R.STELLAR,!0}return!1}};l(dZ,\"TeraStarstormTypeAttr\");",
     "new":"const dZ=class dZ extends bs{apply(s,i,A,a){const r=a[0];if(!(r instanceof At))return!1;return r.value=R.STELLAR,!0}};l(dZ,\"TeraStarstormTypeAttr\");"},
    {"id":"tera-starstorm-target","file":"game/server/dist/assets/loading-scene-By2k7Qfx.js",
     "old":"new v(t.TERA_STARSTORM,R.NORMAL,B.SPECIAL,120,100,5,-1,0,9).attr(iP).attr(J5).attr(zR,(n,s,i)=>n.hasSpecies(e.TERAPAGOS)&&n.isTerastallized?Le.ALL_NEAR_ENEMIES:Le.NEAR_OTHER).partial()",
     "new":"new v(t.TERA_STARSTORM,R.NORMAL,B.SPECIAL,120,100,5,-1,0,9).attr(iP).attr(J5).attr(zR,(n,s,i)=>Le.ALL_NEAR_ENEMIES).partial()"},
    {"id":"stellar-multiplier-fixed","file":"game/server/dist/assets/loading-scene-By2k7Qfx.js",
     "old":"if(s===R.STELLAR)return this.isTerastallized?2:1;",
     "new":"if(s===R.STELLAR)return 2;"},
    {"id":"pt-save-import-allow","file":"game/server/dist/assets/index-D3KKGO7Y.js",
     "old":"this.PT_MODE_ALLOW_IMPORT_OVERRIDE=!1",
     "new":"this.PT_MODE_ALLOW_IMPORT_OVERRIDE=!0"},
    {"id":"pt-save-import-gamemode-literal","file":"game/server/dist/assets/index-D3KKGO7Y.js",
     "old":"o&&m.gameMode===6&&!Gj.PT_MODE_ALLOW_IMPORT_OVERRIDE",
     "new":"o&&m.gameMode===10&&!Gj.PT_MODE_ALLOW_IMPORT_OVERRIDE"},
    {"id":"tera-move-category-attr","file":"game/server/dist/assets/loading-scene-By2k7Qfx.js",
     "old":"return s.isTerastallized&&s.getEffectiveStat(p.ATK",
     "new":"return s.getEffectiveStat(p.ATK"},
    {"id":"nihil-light-category","file":"game/server/dist/assets/loading-scene-By2k7Qfx.js",
     "old":"new v(t.NIHIL_LIGHT,R.DRAGON,B.SPECIAL,200,100,5,-1,0,9)",
     "new":"new v(t.NIHIL_LIGHT,R.CS,B.SPECIAL,200,100,5,-1,0,9)"},
]

def read(p):
    return io.open(p, encoding="utf-8", errors="surrogateescape").read()

print(f"{'patch id':<34} {'old@.orig':>10} {'new@.orig':>10} {'old@live':>10} {'new@live':>10}")
print("-"*80)
allok = True
for p in PATCHES:
    live = os.path.join(ROOT, p["file"])
    orig = os.path.join(BK, os.path.basename(p["file"]) + ".orig")
    so = read(orig); sl = read(live)
    oc = so.count(p["old"]); nco = so.count(p["new"])
    lc = sl.count(p["old"]); ncl = sl.count(p["new"])
    # 期望: .orig 有 old 无 new ; live 有 new
    ok_orig = oc>=1 and nco==0
    ok_live = ncl>=1
    flag = "OK " if (ok_orig and ok_live) else "!! "
    if not (ok_orig and ok_live): allok=False
    print(f"{flag}{p['id']:<31} {oc:>10} {nco:>10} {lc:>10} {ncl:>10}")

print()
print("全部通过" if allok else "存在未通过项（见上）")
