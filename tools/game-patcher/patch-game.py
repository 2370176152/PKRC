#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
本改版游戏（game/server/dist 发行包）的可回滚补丁工具。

由于本工程不含 TypeScript 源码，所有改动都直接作用于 Vite 产物（assets/*.js）。
本脚本用「精确字符串替换」的方式做补丁，并自带备份 / 撤销 / 状态查询。

用法（项目根目录下）：
    python tools/game-patcher/patch-game.py list        # 列出全部补丁及当前状态
    python tools/game-patcher/patch-game.py apply       # 应用全部补丁（已应用的会跳过）
    python tools/game-patcher/patch-game.py apply <id>  # 只应用某个补丁
    python tools/game-patcher/patch-game.py revert      # 撤销全部补丁（从 backup 还原被改文件）
    python tools/game-patcher/patch-game.py verify      # 语法校验被改文件（ESM）

备份：首次应用时把原文件复制到 tools/game-patcher/backup/<文件名>.orig（不会被覆盖）。
"""
import io
import os
import sys
import shutil

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))  # 项目根（tools/game-patcher/ 的上三层）
BK = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backup')               # 备份目录（锚定脚本所在目录）

# ============================================================
# 补丁清单
# ============================================================
PATCHES = [
    {
        'id': 'tera-starstorm-type',
        'file': 'game/server/dist/assets/loading-scene-By2k7Qfx.js',
        'desc': '晶光星群(TeraStarstorm)：解除「必须是太乐巴戈斯 且 必须星晶太晶化」限制，'
                '任何宝可梦使用该招式一律按【星晶属性】结算',
        'old': 'const dZ=class dZ extends bs{apply(s,i,A,a){if(s.isTerastallized&&s.hasSpecies(e.TERAPAGOS))'
               '{const r=a[0];return r.value=R.STELLAR,!0}return!1}};l(dZ,"TeraStarstormTypeAttr");',
        'new': 'const dZ=class dZ extends bs{apply(s,i,A,a){const r=a[0];if(!(r instanceof At))return!1;'
               'return r.value=R.STELLAR,!0}};l(dZ,"TeraStarstormTypeAttr");',
    },
    {
        'id': 'tera-starstorm-target',
        'file': 'game/server/dist/assets/loading-scene-By2k7Qfx.js',
        'desc': '晶光星群(TeraStarstorm) 群体化：解除全部前置条件（原为「太乐巴戈斯且太晶化中才打全体，'
                '否则仅单体 NEAR_OTHER」），改为任意宝可梦使用该招式一律命中全体敌人(ALL_NEAR_ENEMIES)',
        'old': 'new v(t.TERA_STARSTORM,R.NORMAL,B.SPECIAL,120,100,5,-1,0,9).attr(iP).attr(J5)'
               '.attr(zR,(n,s,i)=>n.hasSpecies(e.TERAPAGOS)&&n.isTerastallized?Le.ALL_NEAR_ENEMIES:Le.NEAR_OTHER).partial()',
        'new': 'new v(t.TERA_STARSTORM,R.NORMAL,B.SPECIAL,120,100,5,-1,0,9).attr(iP).attr(J5)'
               '.attr(zR,(n,s,i)=>Le.ALL_NEAR_ENEMIES).partial()',
    },
    {
        'id': 'stellar-multiplier-fixed',
        'file': 'game/server/dist/assets/loading-scene-By2k7Qfx.js',
        'desc': '星晶属性伤害倍率：由「太晶化时 2× / 否则 1×」的可变条件，'
                '改为恒定固定 2×（移除 isTerastallized 判定，即移除原有的可调分支）',
        'old': 'if(s===R.STELLAR)return this.isTerastallized?2:1;',
        'new': 'if(s===R.STELLAR)return 2;',
    },
    # ---------- 搜打撤(PT) 存档导入放行 ----------
    {
        'id': 'pt-save-import-allow',
        'file': 'game/server/dist/assets/index-D3KKGO7Y.js',
        'desc': '搜打撤(PT)存档导入总开关：把 PT_MODE_ALLOW_IMPORT_OVERRIDE 的默认值由 false 改成 true。'
                '该属性定义在 DefaultOverrides 构造函数里，随后经 `const Bj={}` 做 '
                '`Gj={...new DefaultOverrides(),...Bj}` 合并，成为全局配置对象；'
                'index 以 `Gj as O` 导出、loading-scene 以 `O as ye` 导入，故 ye === Gj。'
                '此前 loading-scene 的拦截条件为 `f.gameMode===$t.PT_SOUDACHE && '
                '!ye.PT_MODE_ALLOW_IMPORT_OVERRIDE`，其中 $t.PT_SOUDACHE=10，'
                '于是任何 gameMode=10 的 .prsv 都会被「PT搜打撤模式的存档不允许导入！」挡下；'
                '改为 true 后该条件恒为 false，主菜单「导入存档」即可正常导入 PT 存档',
        'old': 'this.PT_MODE_ALLOW_IMPORT_OVERRIDE=!1',
        'new': 'this.PT_MODE_ALLOW_IMPORT_OVERRIDE=!0',
    },
    {
        'id': 'pt-save-import-gamemode-literal',
        'file': 'game/server/dist/assets/index-D3KKGO7Y.js',
        'desc': '修正移动端存档导入补丁 Uj() 里的模式判定笔误：原代码硬编码 `m.gameMode===6`，'
                '而 6 是 HUO(火箭队) 模式、10 才是 PT_SOUDACHE，与其提示文案'
                '「PT搜打撤模式的存档不允许导入！」自相矛盾（疑似把 10 误写成十进制 6）。'
                '此分支在 Web/Electron(非 Capacitor 原生) 环境下不会执行，'
                '但一旦跑在移动端原生壳里就会拦错模式，故按枚举值改为 ===10，'
                '与 loading-scene 的 `$t.PT_SOUDACHE` 判定对齐',
        'old': 'o&&m.gameMode===6&&!Gj.PT_MODE_ALLOW_IMPORT_OVERRIDE',
        'new': 'o&&m.gameMode===10&&!Gj.PT_MODE_ALLOW_IMPORT_OVERRIDE',
    },
    {
        'id': 'tera-move-category-attr',
        'file': 'game/server/dist/assets/loading-scene-By2k7Qfx.js',
        'desc': '太晶招式类别判定(TeraMoveCategoryAttr)去太晶化条件：原逻辑仅当招式使用者'
                '处于太晶化状态时才按「攻击与特攻谁高」决定物理/特殊类别；'
                '改为无条件按双攻高低判定，使太晶招式在未太晶化时也能正确分入物理/特殊',
        'old': 'return s.isTerastallized&&s.getEffectiveStat(p.ATK',
        'new': 'return s.getEffectiveStat(p.ATK',
    },
    {
        'id': 'nihil-light-category',
        'file': 'game/server/dist/assets/loading-scene-By2k7Qfx.js',
        'desc': '归无之光(NIHIL_LIGHT)招式属性由龙(DRAGON)改为改版自定义属性 CS（PokemonType 枚举值 19，'
                '紧随 STELLAR 之后由本改版新增，普通系等招式打该属性为 2× 克制）：'
                '使其按自定义属性 CS 参与克制结算与属性一致加成，而非龙属性',
        'old': 'new v(t.NIHIL_LIGHT,R.DRAGON,B.SPECIAL,200,100,5,-1,0,9)',
        'new': 'new v(t.NIHIL_LIGHT,R.CS,B.SPECIAL,200,100,5,-1,0,9)',
    },
]


def path_of(p):
    return os.path.join(ROOT, p['file'].replace('/', os.sep))


def backup_path(p):
    return os.path.join(BK, os.path.basename(p['file']) + '.orig')


def read(p):
    return io.open(path_of(p), encoding='utf-8', errors='surrogateescape').read()


def write(p, s):
    io.open(path_of(p), 'w', encoding='utf-8', errors='surrogateescape', newline='').write(s)


def state(p):
    s = read(p)
    if p['new'] in s:
        return 'applied'
    if p['old'] in s:
        return 'not-applied'
    return 'UNKNOWN (原文未找到，可能已被其他改动影响)'


def ensure_backup(p):
    bp = backup_path(p)
    if not os.path.exists(bp):
        os.makedirs(BK, exist_ok=True)
        shutil.copy2(path_of(p), bp)
        print('  已备份 ->', os.path.relpath(bp, ROOT))
    return bp


def cmd_list():
    for p in PATCHES:
        print('[%s] %s' % (state(p).split()[0], p['id']))
        print('    文件:', p['file'])
        print('    说明:', p['desc'])
    return 0


def cmd_apply(only=None):
    rc = 0
    for p in PATCHES:
        if only and p['id'] != only:
            continue
        st = state(p)
        if st == 'applied':
            print('跳过（已应用）:', p['id'])
            continue
        if st != 'not-applied':
            print('!! 无法应用:', p['id'], '-', st)
            rc = 1
            continue
        ensure_backup(p)
        s = read(p)
        write(p, s.replace(p['old'], p['new'], 1))
        print('已应用:', p['id'])
        print('  ', p['desc'])
    return rc


def cmd_revert(only=None):
    for p in PATCHES:
        if only and p['id'] != only:
            continue
        bp = backup_path(p)
        if not os.path.exists(bp):
            print('无备份，跳过:', p['id'])
            continue
        shutil.copy2(bp, path_of(p))
        print('已还原:', p['id'])
    return 0


def cmd_verify():
    import subprocess
    rc = 0
    seen = set()
    for p in PATCHES:
        f = path_of(p)
        if f in seen:
            continue
        seen.add(f)
        tmp = f + '.check.mjs'
        shutil.copy2(f, tmp)
        try:
            r = subprocess.run(['node', '--check', tmp], capture_output=True, text=True)
            print(('OK  ' if r.returncode == 0 else 'FAIL'), os.path.basename(f))
            if r.returncode != 0:
                print(r.stderr[:800])
                rc = 1
        except FileNotFoundError:
            print('未找到 node，跳过语法校验')
        finally:
            if os.path.exists(tmp):
                os.remove(tmp)
    return rc


if __name__ == '__main__':
    args = sys.argv[1:]
    cmd = args[0] if args else 'list'
    only = args[1] if len(args) > 1 else None
    if cmd == 'list':
        sys.exit(cmd_list())
    if cmd == 'apply':
        sys.exit(cmd_apply(only))
    if cmd == 'revert':
        sys.exit(cmd_revert(only))
    if cmd == 'verify':
        sys.exit(cmd_verify())
    print(__doc__)
    sys.exit(1)
