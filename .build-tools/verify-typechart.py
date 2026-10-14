import re, subprocess, os, json

SRC = r'D:/Work/Pokemon/new/.build-tools/tarball-src/pokerogue-90df65097b6df76f713e6bd108afa84499e8b993/src/data/type.ts'
txt = open(SRC, encoding='utf-8').read()

# 提取 getTypeChartMultiplier 函数体
i = txt.find('function getTypeChartMultiplier')
p = txt.find('{', i)
d = 0; started = False; end = None
for k in range(p, len(txt)):
    if txt[k] == '{': d += 1; started = True
    elif txt[k] == '}':
        d -= 1
        if started and d == 0:
            end = k + 1; break
fn = txt[i:end]

types = ["UNKNOWN","NORMAL","FIGHTING","FLYING","POISON","GROUND","ROCK","BUG","GHOST","STEEL",
         "FIRE","WATER","GRASS","ELECTRIC","PSYCHIC","ICE","DRAGON","DARK","FAIRY","STELLAR","CS"]
val = {"UNKNOWN":-1,"NORMAL":0,"FIGHTING":1,"FLYING":2,"POISON":3,"GROUND":4,"ROCK":5,"BUG":6,
       "GHOST":7,"STEEL":8,"FIRE":9,"WATER":10,"GRASS":11,"ELECTRIC":12,"PSYCHIC":13,"ICE":14,
       "DRAGON":15,"DARK":16,"FAIRY":17,"STELLAR":18,"CS":19}

# 把 PokemonType.X 换成数值
js = re.sub(r'PokemonType\.([A-Z_]+)', lambda m: str(val[m.group(1)]), fn)
js = js.replace('(attackType: PokemonType, defType: PokemonType): SingleTypeDamageMultiplier', '(attackType, defType)')
js = re.sub(r':\s*SingleTypeDamageMultiplier', '', js)
js = re.sub(r'\(attackType:\s*number,\s*defType:\s*number\)', '(attackType, defType)', js)

# 包一层并输出 CS 行 + 与产物对照
out = js + "\n\nconst names=" + json.dumps(types) + ";\n" + \
      "const V={UNKNOWN:-1,NORMAL:0,FIGHTING:1,FLYING:2,POISON:3,GROUND:4,ROCK:5,BUG:6,GHOST:7,STEEL:8,FIRE:9,WATER:10,GRASS:11,ELECTRIC:12,PSYCHIC:13,ICE:14,DRAGON:15,DARK:16,FAIRY:17,STELLAR:18,CS:19};\n" + \
      "console.log('CS as ATTACKER vs each defender:');\n" + \
      "for(const n of names){if(n==='UNKNOWN')continue;console.log('  CS -> '+n+' = '+getTypeChartMultiplier(V.CS,V[n]));}\n" + \
      "console.log('CS as DEFENDER:');\n" + \
      "for(const n of names){if(n==='UNKNOWN')continue;console.log('  '+n+' -> CS = '+getTypeChartMultiplier(V[n],V.CS));}\n" + \
      "console.log('STELLAR defender = '+getTypeChartMultiplier(V.NORMAL,V.STELLAR));\n"

open('/tmp/typechk.js','w',encoding='utf-8').write(out)
r = subprocess.run(['node','/tmp/typechk.js'], capture_output=True, text=True)
print(r.stdout)
print(r.stderr[:600])
