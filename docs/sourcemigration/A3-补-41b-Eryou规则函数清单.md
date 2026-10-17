# Eryou 规则函数 66 个 — 产物实现提取结果

> 提取脚本：`.build-tools/a4/extract-eryou66.cjs`（66/66 成功，共 13349 字符）

| # | 真名 | 短名 | 产物@ | 字符 | 副作用 | 一次读字节数 |
|---:|---|---|---:|---:|---|---|
| 1 | `formChangeTargetsFor` | `Moe` | 2286408 | 21 | 无 | "function Moe(n,s,i={}" |
| 2 | `geneKey` | `Bl` | 1563830 | 28 | 无 | "function Bl(n){return`${n}`}" |
| 3 | `dungeonName` | `lH` | 2374007 | 29 | 无 | "function lH(n){return Gae[n]}" |
| 4 | `isSquadStatusPanelOpen` | `whe` | 2205972 | 32 | 无 | "function whe(){return DR!==null}" |
| 5 | `progressOf` | `KA` | 2288448 | 32 | 无 | "function KA(n,s){return pr(n,s)}" |
| 6 | `breakthroughKey` | `kE` | 1563771 | 35 | 无 | "function kE(n,s){return`${n}:${s}`}" |
| 7 | `toggleSquadStatusPanel` | `vse` | 2205847 | 36 | 无 | "function vse(n){bh(DR===n?\"none\":n)}" |
| 8 | `canBreakthroughNow` | `fB` | 2290239 | 36 | 无 | "function fB(n,s){return Ng(KA(n,s))}" |
| 9 | `evolutionOptions` | `_oe` | 2291435 | 37 | 无 | "function _oe(n,s){return MB(KA(n,s))}" |
| 10 | `scrollSquadStatusPanel` | `wse` | 2206036 | 40 | 无 | "function wse(n){return DR?(NB(n),!0):!1}" |
| 11 | `levelUpCostPreview` | `DB` | 2289948 | 40 | 无 | "function DB(n,s,i){return wN(KA(n,s),i)}" |
| 12 | `filledMaterials` | `MRe` | 3492456 | 40 | 无 | "function MRe(n){return n.filter(s=>!!s)}" |
| 13 | `isRestrictedChain` | `Um` | 1569418 | 42 | 无 | "function Um(n,s){return ph(n)||!!s&&ph(s)}" |
| 14 | `levelCapOfProgress` | `AL` | 2288499 | 42 | 无 | "function AL(n){return wO(n.breakthroughs)}" |
| 15 | `candyUnitsAvailable` | `KU` | 2280841 | 45 | 无 | "function KU(n){return n.candy+n.goldCandy*RU}" |
| 16 | `dungeonUnlockKey` | `V1` | 1573260 | 49 | 无 | "function V1(n,s){return s!==void 0?`${n}:${s}`:n}" |
| 17 | `formChangeItemLabel` | `hoe` | 2285304 | 49 | 无 | "function hoe(n){return Eb(n)??en[n]??`变身道具 ${n}`}" |
| 18 | `formChangeItemOfName` | `OCe` | 2284767 | 54 | 无 | "function OCe(n){return uoe.get(n.toUpperCase())??null}" |
| 19 | `dungeonDifficultyState` | `oie` | 2370321 | 61 | 无 | "function oie(n,s){return s<n?\"cleared\":s===n?\"open\":\"locked\"" |
| 20 | `materialStock` | `Vh` | 2292400 | 62 | 无 | "function Vh(n,s,i){return n.breakthroughMaterials[kE(s,i)]||" |
| 21 | `hasNoEvolutionLine` | `cle` | 1569631 | 65 | 无 | "function cle(n){var s;return!((s=wt[n])!=null&&s.length)&&!f" |
| 22 | `formChangeItemSource` | `Coe` | 2285672 | 65 | 无 | "function Coe(n){return{item:n,id:coe(n),name:hoe(n),tier:ICe" |
| 23 | `msUntilWeeklyRefresh` | `Sie` | 2373723 | 66 | 无 | "function Sie(n=new Date){return Math.max(0,k1(n)+Gde-n.getTi" |
| 24 | `onFormChanged` | `VSe` | 1884545 | 67 | 无 | "function VSe(n){UEe(n),console.log(`动态回合顺序: ${n.name}形态改变，检查" |
| 25 | `candyUnitsPerLevel` | `Sle` | 1563933 | 78 | 无 | "function Sle(n){return n<30?2:n<40?3:n<50?5:n<60?8:n<70?12:n" |
| 26 | `levelUpCost` | `OU` | 1564149 | 95 | 无 | "function OU(n,s){let i=0,A=0;for(let a=n;a<s;a++)i+=Sle(a),A" |
| 27 | `addMaterial` | `Goe` | 2292485 | 99 | 无 | "function Goe(n,s,i,A){const a=kE(s,i);n.breakthroughMaterial" |
| 28 | `canBreakthrough` | `Ng` | 2281597 | 102 | 无 | "function Ng(n){return n.breakthroughs<fo.length&&lle.include" |
| 29 | `allMaterialTypes` | `dO` | 1570228 | 109 | 无 | "function dO(){return Object.values(R).filter(s=>typeof s==\"n" |
| 30 | `tryPayLevelUp` | `Soe` | 2281315 | 118 | 有 | "function Soe(n,s){return s.pt>0&&E.gameData.pt<s.pt||!oCe(n," |
| 31 | `evolutionStageOf` | `fw` | 1569486 | 119 | 无 | "function fw(n){let s=0,i=n;const A=new Set;for(;fs[i]&&!A.ha" |
| 32 | `tierOfFormChangeItem` | `ICe` | 2285382 | 120 | 无 | "function ICe(n){const s=Eb(n)??\"\";return s.includes(\"石板\")?K." |
| 33 | `isRestrictedSpecies` | `ph` | 1569266 | 124 | 无 | "function ph(n){return ule.includes(n.speciesId)||!!(n.legend" |
| 34 | `getOrCreateProgress` | `pr` | 1572779 | 126 | 无 | "function pr(n,s){return n.pokemon[s]||(n.pokemon[s]={level:B" |
| 35 | `getDungeonEnemyHpMult` | `Dw` | 1565867 | 141 | 无 | "function Dw(n){var i;const s=Number.isFinite(n)?Math.min(Mat" |
| 36 | `heldItemLabel` | `Xa` | 2291720 | 141 | 有 | "function Xa(n){var i;const s=_S(n);if(s!==null)return hoe(s)" |
| 37 | `materialBestDifficulty` | `Rie` | 2370414 | 146 | 无 | "function Rie(n,s){let i={type:null,difficulty:1};for(const A" |
| 38 | `weeklyPickUnique` | `fle` | 1575570 | 155 | 无 | "function fle(n,s,i){const A=[...s],a=[];for(let r=0;r<Math.m" |
| 39 | `dungeonUnlockedDifficulty` | `SO` | 2370131 | 155 | 无 | "function SO(n,s,i){const A=V1(s,s===Is.MATERIAL?i:void 0),a=" |
| 40 | `levelUpCostFor` | `wN` | 2281122 | 169 | 无 | "function wN(n,s){const i=wO(n.breakthroughs),A=Math.max(0,Ma" |
| 41 | `trySpendCandyUnits` | `oCe` | 2280915 | 180 | 无 | "function oCe(n,s){if(s<=0)return!0;if(KU(n)<s)return!1;const" |
| 42 | `synthesisOptions` | `goe` | 2292605 | 197 | 无 | "function goe(n,s){const i=[];for(const A of dI(s))for(const " |
| 43 | `evolutionCostWithStock` | `PCe` | 2290664 | 206 | 有 | "function PCe(n,s){const i=s.geneCost.map(a=>{const r=n.evolu" |
| 44 | `applyHpPanelMult` | `Qte` | 1582390 | 231 | 无 | "function Qte(n,s,i,A){const a=Math.max(1,Math.floor(i*s));if" |
| 45 | `breakthroughRequirementWithStock` | `Qse` | 2290376 | 246 | 有 | "function Qse(n,s){const i=xl(KA(n,s),s),A=i.materials.map(r=" |
| 46 | `heldItemLevelOf` | `dRe` | 3491603 | 251 | 无 | "function dRe(n){var O;hRe();const s=Uoe(n),i=xI==null?void 0" |
| 47 | `assignHeldItem` | `Jse` | 2292027 | 256 | 无 | "function Jse(n,s,i){return i?n.heldItemAssignments[s]===i?wE" |
| 48 | `synthesizeAll` | `jse` | 2293103 | 276 | 无 | "function jse(n,s){const i=[];for(const A of ob){let a=0;for(" |
| 49 | `refreshAbyssWeeklyFirstClear` | `mh` | 1574457 | 278 | 无 | "function mh(n,s=new Date){const i=qL(s),A=k1(s),a=typeof n.a" |
| 50 | `currentDungeonWaveConfig` | `gle` | 1579848 | 287 | 有 | "function gle(n){var r;const s=E.eryouSession;if(!s||s.kind!=" |
| 51 | `levelUpAndBreakthroughAll` | `_Ce` | 2291093 | 307 | 无 | "function _Ce(n,s){const i=KA(n,s),A=i.level,a=i.breakthrough" |
| 52 | `rollHeldItems` | `L0e` | 2540213 | 315 | 无 | "function L0e(n,s,i,A){if(!(s<=0||i<=0))for(let a=0;a<s;a++){" |
| 53 | `tryPayEvolution` | `Noe` | 2284272 | 317 | 有 | "function Noe(n,s){for(const i of s.geneCost){const A=n.evolu" |
| 54 | `dungeonEnemyInfo` | `Dde` | 2372129 | 324 | 无 | "function Dde(n){const s=YR[Math.min(Math.max(Math.trunc(n),1" |
| 55 | `synthesisEntries` | `EF` | 3492084 | 346 | 无 | "function EF(n){hRe();const s=[];for(const A of Object.keys(n" |
| 56 | `tryPayBreakthrough` | `Toe` | 2282212 | 368 | 有 | "function Toe(n,s){for(const i of s.materials){const A=n.brea" |
| 57 | `getDungeonSpeciesPool` | `hle` | 1569742 | 375 | 无 | "function hle(n){const s=`${n.bst[0]}-${n.bst[1]}|${n.stages." |
| 58 | `heldItemPoolForTier` | `boe` | 2539452 | 375 | 无 | "function boe(n){const s=new Map;for(const i of n){const A=fL" |
| 59 | `breakthroughRequirement` | `xl` | 2281723 | 456 | 无 | "function xl(n,s){if(!n||n.breakthroughs>=fo.length)return{ma" |
| 60 | `refundEvolutions` | `RCe` | 2282608 | 464 | 有 | "function RCe(n,s,i){const A=i.unlockedForms.slice();for(cons" |
| 61 | `ensureDetailPanel` | `Pfe` | 3539840 | 507 | 有 | "function Pfe(){if(EA&&!Cg(EA)&&(EA.setVisible(!1),EA=null,Io" |
| 62 | `evolutionOptionsFor` | `MB` | 2283728 | 515 | 无 | "function MB(n){const s=[],i=new Set;for(const A of n.unlocke" |
| 63 | `resetProgress` | `Loe` | 2283098 | 608 | 有 | "function Loe(n,s,i){const A=OU(BA,i.level);n.candy+=A.candyU" |
| 64 | `planSynthesis` | `YI` | 3492520 | 759 | 无 | "function YI(n){const s=MRe(n),i=Math.max(0,Oo-s.length),A={m" |
| 65 | `synthesizeHeldItems` | `lfe` | 3493388 | 869 | 无 | "function lfe(n,s){const i=YI(s);if(!i.ready||!i.targetLevel)" |
| 66 | `dungeonRewardPreview` | `Iie` | 2371106 | 966 | 无 | "function Iie(n,s,i=\"\"){const A=Math.min(Math.max(Math.trunc(" |

**合计** 66 个，13349 字符。
