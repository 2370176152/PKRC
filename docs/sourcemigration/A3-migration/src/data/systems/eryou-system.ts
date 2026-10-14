/**
 * 二游养成（ERYOU）—— 自研系统迁移（数据/规则/AI/阶段层）
 * ---------------------------------------------------------------------------
 * 来源：game/server/dist/assets/loading-scene-By2k7Qfx.js（.orig 产物）
 * 逆向方式：`l(短名,"原函数名")` 反查 + 常量赋值精确定位（见 A3-迁移规范 §3）
 * 锚点树：90df65097b6df76f713e6bd108afa84499e8b993
 *
 * 定位：**最大工作量系统**（110 个 keepNames）。二游式「养成 + 深渊 + 地牢 + 配队 +
 *       合成 + 进化 + 抽奖」多层结构。**不复用公共命座框架**，自带独立分支
 *       （`NRe` / `gN` / `sfe` / `ife` / `nfe`）。
 *
 * ⚠️ 本文件 = **数据/规则/AI/阶段层**（91 个符号，35 KB）。
 *    UI 层（20 个 Handler/组件，89 KB，含 `EryouSynthesisUiHandler`）单列于 `eryou-ui.ts`。
 *
 * ⚠️ 主体由产物**逐字提取**（定义名还原为原名 + 底部补短名别名 + 参数可选化以容错
 *    JS 的少参调用），请勿手工排版。外部依赖以上方 `declare` 占位。
 */

// ─────────────────────────────────────────────────────────────
// 1. ERYOU 独立命座分支（产物 `gN` / `NRe` / `sfe` / `ife` / `nfe`）
// ---------------------------------------------------------------------------
// ⚠️ 与公共底座 `constellation-framework.ts` **不是同一套**：
//     · `sfe`(`constellationLevel`) 多了 `Number.isFinite` + `Math.floor`；
//     · `nfe`(`applyConstellationBaseStats`) 遍历写死 `[1,2,5]`，且**传空 choices `{}`**；
//     · 注册表 `NRe` **在产物中从未被赋值** → 独立分支当前为**空实现**（`ife` 恒 false）。
// ─────────────────────────────────────────────────────────────

/** 命座槽位数（产物 `gN`=6） */
export const ERYOU_CONSTELLATION_SLOTS = 6;
/** 独立分支常量短名别名 */
const gN = ERYOU_CONSTELLATION_SLOTS;

/** ERYOU 独立命座注册表（产物 `NRe`，产物中为空对象） */
export const ERYOU_CONSTELLATION_REGISTRY: Record<number, { exclusiveNodes: number[]; applyBaseStats?: (...a: any[]) => void }> = {};
const NRe = ERYOU_CONSTELLATION_REGISTRY;

// ─────────────────────────────────────────────────────────────
// 2. 外部依赖占位（上游 API；接入锚点时替换为真实 import）
// ─────────────────────────────────────────────────────────────
declare let $ae: any;
declare let $ge: any;
declare let $h: any;
declare let $t: any;
declare let AEe: any;
declare let AOe: any;
declare let Aae: any;
declare let Afe: any;
declare let At: any;
declare let B: any;
declare let BA: any;
declare let BCe: any;
declare let BERRY: any;
declare let BO: any;
declare let Bl: any;
declare let CGe: any;
declare let CM: any;
declare let DN: any;
declare let DOe: any;
declare let Doe: any;
declare let Dw: any;
declare let E: any;
declare let EHe: any;
declare let EN: any;
declare let ERYOU: any;
declare let Fae: any;
declare let Fe: any;
declare let Fh: any;
declare let G: any;
declare let GO: any;
declare let GR: any;
declare let GT: any;
declare let Gae: any;
declare let GameOverPhase: any;
declare let Ge: any;
declare let Gs: any;
declare let Gw: any;
declare let HE: any;
declare let HP: any;
declare let Hs: any;
declare let Ht: any;
declare let IHe: any;
declare let IU: any;
declare let Ie: any;
declare let Il: any;
declare let Ir: any;
declare let Is: any;
declare let J: any;
declare let JO: any;
declare let JS: any;
declare let Jge: any;
declare let Jt: any;
declare let KCe: any;
declare let KI: any;
declare let KM: any;
declare let Kae: any;
declare let Kt: any;
declare let L$: any;
declare let L0: any;
declare let L0e: any;
declare let Le: any;
declare let Lie: any;
declare let Lo: any;
declare let Lr: any;
declare let M: any;
declare let MGe: any;
declare let Ma: any;
declare let Mm: any;
declare let Mt: any;
declare let Nd: any;
declare let Nle: any;
declare let O0e: any;
declare let OCe: any;
declare let OLe: any;
declare let Oe: any;
declare let Ot: any;
declare let PT: any;
declare let Pa: any;
declare let Pe: any;
declare let Pn: any;
declare let Pw: any;
declare let Qge: any;
declare let Qte: any;
declare let R: any;
declare let RN: any;
declare let Ri: any;
declare let SH: any;
declare let SO: any;
declare let Sb: any;
declare let TCe: any;
declare let TE: any;
declare let UB: any;
declare let UOe: any;
declare let Ui: any;
declare let Unknown: any;
declare let V: any;
declare let V1: any;
declare let VN: any;
declare let W: any;
declare let W$: any;
declare let Wae: any;
declare let X: any;
declare let Xge: any;
declare let Xl: any;
declare let YR: any;
declare let Yae: any;
declare let Yge: any;
declare let Ys: any;
declare let Z: any;
declare let Z1: any;
declare let ZRe: any;
declare let Ze: any;
declare let Zge: any;
declare let Zl: any;
declare let Zt: any;
declare let _C: any;
declare let _ae: any;
declare let _e: any;
declare let _w: any;
declare let aHe: any;
declare let abilityIndex: any;
declare let abyss: any;
declare let abyssFirstClear: any;
declare let abyssFirstClearAnchor: any;
declare let abyssFirstClearWeek: any;
declare let abyssUnlocked: any;
declare let afterYou: any;
declare let ai: any;
declare let aoeDown: any;
declare let apply: any;
declare let at: any;
declare let attack: any;
declare let attribute: any;
declare let bO: any;
declare let bae: any;
declare let baseline: any;
declare let battle: any;
declare let battlerTags: any;
declare let bg: any;
declare let bge: any;
declare let bo: any;
declare let boe: any;
declare let breakthroughMaterials: any;
declare let buff: any;
declare let c0e: any;
declare let candy: any;
declare let ceil: any;
declare let co: any;
declare let common: any;
declare let constructor: any;
declare let count: any;
declare let crit: any;
declare let critBoostOnAdd: any;
declare let dA: any;
declare let dO: any;
declare let dS: any;
declare let damage: any;
declare let de: any;
declare let decodeURIComponent: any;
declare let defense: any;
declare let dm: any;
declare let dungeon: any;
declare let dungeonType: any;
declare let dungeonUnlocks: any;
declare let ee: any;
declare let en: any;
declare let encodeURIComponent: any;
declare let end: any;
declare let eryou: any;
declare let evasion: any;
declare let evolutionGenes: any;
declare let extraPresetTeams: any;
declare let f0: any;
declare let fOe: any;
declare let finish: any;
declare let firstClear: any;
declare let fle: any;
declare let floor: any;
declare let fm: any;
declare let fo: any;
declare let focusTarget: any;
declare let from: any;
declare let gender: any;
declare let gene: any;
declare let gle: any;
declare let goldCandy: any;
declare let hA: any;
declare let hGe: any;
declare let hasTerrain: any;
declare let hasWeather: any;
declare let held: any;
declare let heldItem: any;
declare let heldItemAssignments: any;
declare let heldItems: any;
declare let hl: any;
declare let hle: any;
declare let ho: any;
declare let hpRatio: any;
declare let iae: any;
declare let iconAtlas: any;
declare let iconFrame: any;
declare let id: any;
declare let ie: any;
declare let ignoreAssaultVest: any;
declare let ignorePP: any;
declare let ii: any;
declare let isRealMove: any;
declare let item: any;
declare let itemId: any;
declare let items: any;
declare let jL: any;
declare let jge: any;
declare let jt: any;
declare let jte: any;
declare let jy: any;
declare let kE: any;
declare let kN: any;
declare let kh: any;
declare let kind: any;
declare let kn: any;
declare let kp: any;
declare let l: any;
declare let legacy: any;
declare let length: any;
declare let level: any;
declare let levelMoves: any;
declare let mB: any;
declare let mCe: any;
declare let master: any;
declare let material: any;
declare let me: any;
declare let mechanism: any;
declare let mh: any;
declare let minLevel: any;
declare let mo: any;
declare let move: any;
declare let moveTriggers: any;
declare let moveset: any;
declare let mr: any;
declare let ms: any;
declare let nHe: any;
declare let name: any;
declare let nature: any;
declare let ne: any;
declare let next: any;
declare let nextLabel: any;
declare let number: any;
declare let oHe: any;
declare let object: any;
declare let on: any;
declare let onClose: any;
declare let onNext: any;
declare let onRetry: any;
declare let p: any;
declare let pC: any;
declare let pCe: any;
declare let ph: any;
declare let physicalDown: any;
declare let pokemon: any;
declare let pokemonId: any;
declare let pokemonNameWithAffix: any;
declare let pr: any;
declare let presetTeam: any;
declare let presetTeamIndex: any;
declare let primaryTargetSelect: any;
declare let probe: any;
declare let probes: any;
declare let pt: any;
declare let push: any;
declare let pushMaterial: any;
declare let qge: any;
declare let qs: any;
declare let rA: any;
declare let rHe: any;
declare let rarity: any;
declare let repeat: any;
declare let replaced: any;
declare let sS: any;
declare let sae: any;
declare let savedMoveset: any;
declare let score: any;
declare let selfCost: any;
declare let selfHpRatio: any;
declare let selfSideTags: any;
declare let session: any;
declare let singleDown: any;
declare let specialDown: any;
declare let species: any;
declare let start: any;
declare let startAnimation: any;
declare let startRun: any;
declare let stellar: any;
declare let stone: any;
declare let string: any;
declare let structuredClone: any;
declare let t: any;
declare let target: any;
declare let targetName: any;
declare let targets: any;
declare let teraType: any;
declare let tier: any;
declare let title: any;
declare let to: any;
declare let total: any;
declare let trigger: any;
declare let turnInWave: any;
declare let type: any;
declare let typeDown: any;
declare let typeId: any;
declare let types: any;
declare let ultra: any;
declare let unlockText: any;
declare let unlockedAfter: any;
declare let unlockedEggMoves: any;
declare let unlockedRestricted: any;
declare let uo: any;
declare let vL: any;
declare let version: any;
declare let vs: any;
declare let weekly: any;
declare let wge: any;
declare let woe: any;
declare let xv: any;
declare let yCe: any;
declare let yl: any;
declare let z: any;
declare let zA: any;

// ─────────────────────────────────────────────────────────────
// 3. 系统实现（产物逐字提取）
// ─────────────────────────────────────────────────────────────

export function eryouSessionLabel(n?){if(!n||n.kind!=="dungeon"&&n.kind!=="abyss")return null;const s=Number.isFinite(n.level)?Math.max(1,Math.trunc(n.level)):1;if(n.kind==="abyss")return`深渊 第${s}层`;const i=n.dungeonType?Gae[n.dungeonType]:void 0;return i?`${n.dungeonType===Is.MATERIAL&&n.attribute!==void 0?`${_ae(n.attribute)}·`:""}${i}·难度${s}`:`副本·难度${s}`}

export function eryouWaveLabel(n?){return`第${Number.isFinite(n)?Math.max(1,Math.trunc(n)):1}波`}

export function isEryouBannedSpecies(n?){var i;if(bg.length===0)return!1;if(bg.includes(n))return!0;const s=(i=ms.find(A=>A.speciesId===n))==null?void 0:i.getRootSpeciesId();return s!==void 0&&bg.includes(s)}

export function createDefaultEryouData(){const n=new Date;return{version:1,candy:0,goldCandy:0,breakthroughMaterials:{},evolutionGenes:{},heldItems:{},heldItemAssignments:{},pokemon:{},presetTeam:[],extraPresetTeams:Array.from({length:hl-1},()=>[]),presetTeamIndex:0,dungeonUnlocks:{},abyssUnlocked:1,abyssFirstClear:{},abyssFirstClearWeek:qL(n),abyssFirstClearAnchor:k1(n),unlockedRestricted:[]}}

export function normalizeEryouData(n?){const s=Dm();n.version=typeof n.version=="number"?n.version:s.version,n.candy=typeof n.candy=="number"?n.candy:0,n.goldCandy=typeof n.goldCandy=="number"?n.goldCandy:0,(!n.breakthroughMaterials||typeof n.breakthroughMaterials!="object")&&(n.breakthroughMaterials={}),(!n.evolutionGenes||typeof n.evolutionGenes!="object")&&(n.evolutionGenes={}),(!n.heldItems||typeof n.heldItems!="object")&&(n.heldItems={}),(!n.heldItemAssignments||typeof n.heldItemAssignments!="object")&&(n.heldItemAssignments={}),(!n.pokemon||typeof n.pokemon!="object")&&(n.pokemon={}),Array.isArray(n.presetTeam)||(n.presetTeam=[]),Array.isArray(n.extraPresetTeams)||(n.extraPresetTeams=[]);for(let i=0;i<hl-1;i++)Array.isArray(n.extraPresetTeams[i])||(n.extraPresetTeams[i]=[]);n.extraPresetTeams.length=hl-1,n.presetTeamIndex=Number.isFinite(n.presetTeamIndex)?Math.min(Math.max(Math.trunc(n.presetTeamIndex),0),hl-1):0,(!n.dungeonUnlocks||typeof n.dungeonUnlocks!="object")&&(n.dungeonUnlocks={}),n.abyssUnlocked=typeof n.abyssUnlocked=="number"?n.abyssUnlocked:1,(!n.abyssFirstClear||typeof n.abyssFirstClear!="object")&&(n.abyssFirstClear={}),n.abyssFirstClearWeek=typeof n.abyssFirstClearWeek=="string"&&n.abyssFirstClearWeek?n.abyssFirstClearWeek:qL(),(typeof n.abyssFirstClearAnchor!="number"||!Number.isFinite(n.abyssFirstClearAnchor))&&(n.abyssFirstClearAnchor=Jae(n.abyssFirstClearWeek)??k1()),Array.isArray(n.unlockedRestricted)||(n.unlockedRestricted=[]);for(const i of Object.values<any>(n.pokemon)){if(!i)continue;(typeof i.level!="number"||i.level<BA)&&(i.level=BA);const A=fo.length;(typeof i.breakthroughs!="number"||!Number.isFinite(i.breakthroughs))&&(i.breakthroughs=0),i.breakthroughs=Math.min(Math.max(Math.trunc(i.breakthroughs),0),A)}return n}

export function getEryouMoveset(n?,s?){var a,r;const i=(r=(a=n==null?void 0:n.pokemon)==null?void 0:a[s])==null?void 0:r.moveset;if(!Array.isArray(i))return null;const A=i.filter(O=>typeof O=="number"&&O>0);return A.length?A:null}

export function setEryouMoveset(n?,s?,i?){pr(n,s).moveset=i.filter(A=>typeof A=="number")}

export function getEryouWeekKey(n=new Date){const s=new Date(n.getTime()+IU);s.getUTCHours()<4&&s.setUTCDate(s.getUTCDate()-1);const i=new Date(Date.UTC(s.getUTCFullYear(),s.getUTCMonth(),s.getUTCDate())),A=(i.getUTCDay()+6)%7;i.setUTCDate(i.getUTCDate()-A+3);const a=i.getUTCFullYear(),r=new Date(Date.UTC(a,0,4));r.setUTCDate(r.getUTCDate()-(r.getUTCDay()+6)%7+3);const O=1+Math.round((i.getTime()-r.getTime())/(7*fm));return`${a}-W${String(O).padStart(2,"0")}`}

export function getEryouWeekAnchor(n=new Date){const s=new Date(n.getTime()+IU);s.getUTCHours()<4&&s.setUTCDate(s.getUTCDate()-1);const i=new Date(Date.UTC(s.getUTCFullYear(),s.getUTCMonth(),s.getUTCDate())),A=(i.getUTCDay()+6)%7;return i.setUTCDate(i.getUTCDate()-A),i.getTime()+4*60*60*1e3-IU}

export function parseEryouWeekKeyAnchor(n?){const s=/^(\d{4})-W(\d{1,2})$/.exec(String(n));if(!s)return null;const i=Number(s[1]),A=Number(s[2]);if(!Number.isFinite(i)||!Number.isFinite(A)||A<1||A>53)return null;const a=new Date(Date.UTC(i,0,4));return a.getTime()-(a.getUTCDay()+6)%7*fm+(A-1)*7*fm+4*60*60*1e3-IU}

export function normalizeEryouSession(n?){if(!n||n.kind!=="abyss"&&n.kind!=="dungeon")return null;const s=n.kind==="abyss"?Ma:YR.length;return Number.isFinite(n.level)?(n.level=Math.min(Math.max(Math.trunc(n.level),1),s),Array.isArray(n.mechanisms)||(n.mechanisms=[]),n):null}

export function getEryouRunSeed(n?){return n.kind==="abyss"&&_w(n.level)?`eryou-abyss-weekly-${qL()}-L${Math.trunc(n.level)}`:`${Date.now()}${dS(12)}`}

export function getEryouEnemyLevels(n?){var a,r;const s=E.eryouSession;if(!((a=E.gameMode)!=null&&a.isEryou)||!s)return null;if(s.kind==="abyss"){const O=Z1(s.level);if(!O){const T=yl[0];return new Array(6).fill(T.levelRange[0])}const[I,S]=O.levelRange;return new Array(6).fill(null).map((T,L)=>Gw(s.level,n,"level",L,I,S))}const i=Math.min(Math.max(s.level,1),YR.length),A=(r=YR[i-1])==null?void 0:r.waves[Math.min(Math.max(n,1),3)-1];return A?A.levels.slice(0,6):null}

export function getEryouEnemySpecies(n?,s=0){var r;const i=E.eryouSession;if(!((r=E.gameMode)!=null&&r.isEryou)||!i)return null;if(i.kind==="abyss"){const O=Z1(i.level);if(!O)return null;const I=i.level>=6,S=ms.filter(T=>!(!(T!=null&&T.speciesId)||T.baseTotal<O.minBst||!I&&ph(T)));return S.length?S[Gw(i.level,n,"species",s,0,S.length-1)]:null}const A=gle(n);if(!A)return null;let a=hle(A);if(i.dungeonType===Is.MATERIAL&&i.attribute!==void 0){const O=i.attribute,I=a.filter(S=>S.type1===O||S.type2===O);I.length?a=I:console.warn(`[ERYOU] 材料本属性 ${O} 在本难度池无对应宝可梦，回落全池`)}return a.length?a[bO(0,a.length-1)]:null}

export function applyEryouAbyssBuffs(n?,s=0){var r,O;const i=E.eryouSession;if(!((r=E.gameMode)!=null&&r.isEryou)||(i==null?void 0:i.kind)!=="abyss")return;const A=Z1(i.level);let a=!1;if(A&&A.buffCount>0){const I=((O=E.currentBattle)==null?void 0:O.waveIndex)??0,S=["attack","defense","evasion","crit"],T=[];for(let L=0;L<A.buffCount;L++){const h=S[Gw(i.level,I,"buff",s*8+L,0,S.length-1)];T.push({kind:h,tier:A.buffTier}),h==="evasion"?n.setStatStage(p.EVA,Math.min(6,n.getStatStage(p.EVA)+A.buffTier+1)):h==="crit"&&(a||(a=!0,E.queueMessage(M.t("battlerTags:critBoostOnAdd",{pokemonNameWithAffix:ie(n)}))))}n.customPokemonData&&(n.customPokemonData.eryouAbyssBuffs=T)}gw(n)&&n.updateInfo(),sEe(n)}

export function applyEryouDungeonPanelBuffs(n?){gw(n)&&n.updateInfo()}

export function syncEryouAbyssBuffBadges(n?){var i;const s=(i=n.customPokemonData)==null?void 0:i.eryouAbyssBuffs;if(s!=null&&s.length)for(const A of s)try{kn(n,`eryou-abyss:${A.kind}:${A.tier}`,{})}catch(a){console.error("[ERYOU] 深渊 buff 图标挂载失败:",a)}}

export function restoreEryouAbyssSummonBuffs(n?){var i;const s=(i=n.customPokemonData)==null?void 0:i.eryouAbyssBuffs;if(s!=null&&s.length){for(const A of s)A.kind==="evasion"&&n.setStatStage(p.EVA,Math.min(6,n.getStatStage(p.EVA)+A.tier+1));sEe(n)}}

export function getEryouAbyssCritStageBonus(n?){var s,i,A;try{if(!((s=E.gameMode)!=null&&s.isEryou)||n.isPlayer())return 0;const a=(A=(i=n.customPokemonData)==null?void 0:i.eryouAbyssBuffs)==null?void 0:A.find(r=>r.kind==="crit");return a?a.tier+1:0}catch(a){return console.error("[ERYOU] 深渊要害档位读取失败:",a),0}}

export function reapplyEryouEnemyPanelBuffs(n?,s?){var i,A;try{if(!((i=E.gameMode)!=null&&i.isEryou)||n.isPlayer())return!1;const a=E.eryouSession;if(!a||!Number.isFinite(n.hp)||n.hp<=0||s!==void 0&&!(Number.isFinite(s)&&s>0))return!1;if(a.kind==="dungeon"){const T=Dw(a.level);if(T===1)return!1;const L=n.stats[p.HP];return Qte(n,T,L,s),z("battle",`[ERYOU] 副本难度 ${a.level} 敌方面板：HP ${L} → ${n.stats[p.HP]}（血量 ×${T}）`),!0}if(a.kind!=="abyss")return!1;const r=bae(a.level);let O=1,I=r.bulkMult;for(const T of((A=n.customPokemonData)==null?void 0:A.eryouAbyssBuffs)??[])T.kind==="attack"?O*=$ae(T.tier):T.kind==="defense"&&(I*=2+T.tier);if(O===1&&I===1)return!1;const S=n.stats[p.HP];return O!==1&&(n.stats[p.ATK]=Math.max(1,Math.floor(n.stats[p.ATK]*O)),n.stats[p.SPATK]=Math.max(1,Math.floor(n.stats[p.SPATK]*O))),I!==1&&(n.stats[p.DEF]=Math.max(1,Math.floor(n.stats[p.DEF]*I)),n.stats[p.SPDEF]=Math.max(1,Math.floor(n.stats[p.SPDEF]*I)),Qte(n,I,S,s)),z("battle",`[ERYOU] 深渊 ${a.level} 层敌方面板：攻 ×${O}、坦度 ×${I}、HP ${S} → ${n.stats[p.HP]}`),!0}catch(a){return console.error("[ERYOU] 敌方面板乘区施加失败:",a),!1}}

export function getEryouAbyssEnemyDamageMultiplier(n?){var s;try{if(!n||n.isPlayer()||!((s=E.gameMode)!=null&&s.isEryou))return 1;const i=E.eryouSession;return(i==null?void 0:i.kind)!=="abyss"?1:bae(i.level).dmgMult}catch{return 1}}

export function rollEryouAbyssMechanisms(){var a;const n=E.eryouSession;if(!((a=E.gameMode)!=null&&a.isEryou)||(n==null?void 0:n.kind)!=="abyss")return[];const s=Z1(n.level);if(!s||s.mechanismCount<=0)return[];if(_w(n.level)){const r=[qL(),Math.trunc(n.level),"mechanism"];return fle(r,dm,s.mechanismCount).map((O,I)=>{const S:any={id:O.id};if(O.id==="typeDown"){const T=dO();S.type=T[Pw([...r,"type",I],0,T.length-1)]}return S})}const i=[...dm],A=[];for(let r=0;r<Math.min(s.mechanismCount,i.length);r++){const O=bO(0,i.length-1),[I]=i.splice(O,1),S:any={id:I.id};if(I.id==="typeDown"){const T=dO();S.type=T[bO(0,T.length-1)]}A.push(S)}return A}

export function describeEryouMechanism(n?){const s=dm.find(i=>i.id===n.id);return s?s.desc(n.type):n.id}

export function getEryouAbyssMechanismMultiplier(n?,s?){var a,r;const i=E.eryouSession;if(!((a=E.gameMode)!=null&&a.isEryou)||(i==null?void 0:i.kind)!=="abyss"||!((r=i.mechanisms)!=null&&r.length)||!n.isPlayer())return 1;let A=1;for(const O of i.mechanisms)switch(O.id){case"typeDown":O.type!==void 0&&s.type===O.type&&(A*=RN.typeDown);break;case"physicalDown":s.category===B.PHYSICAL&&(A*=RN.physicalDown);break;case"specialDown":s.category===B.SPECIAL&&(A*=RN.specialDown);break;case"singleDown":!jte.includes(s.moveTarget)&&!sS(n,s)&&(A*=RN.singleDown);break;case"aoeDown":(jte.includes(s.moveTarget)||sS(n,s))&&(A*=RN.aoeDown);break}return A}

export function isEryouContext(){var n,s,i;return!!((s=(n=E)==null?void 0:n.gameMode)!=null&&s.isEryou||(i=E)!=null&&i.eryouSession)}

export function clampEryouSpeed(n?){return Math.min(n,AEe)}

export function enterEryouSpeedCap(){E&&(BO===null&&(BO=E.gameSpeed||1),E.gameSpeed=EEe(BO))}

export function enforceEryouSpeedCap(){!E||!aEe()||(BO===null&&(BO=E.gameSpeed||1),E.gameSpeed=EEe(E.gameSpeed))}

export function exitEryouSpeedCap(){E&&BO!==null&&(E.gameSpeed=BO,BO=null)}

export function eryouFormItemId(n?){return`${UB}${en[n].toLowerCase()}`}

export function isEryouFormItemId(n?){return _S(n)!==null}

export function formChangeItemFromEryouId(n?){if(!n||!n.startsWith(UB))return null;const s=n.slice(UB.length);return s?OCe(s):null}

export function eryouFormItemPool(n?){return TCe.filter(s=>s.tier===n)}

export function eryouFormItemModifierType(n?){const s=new mo(n);return s.id=coe(n),s}

export function eryouHeldItemId(n?){var i;const s=(i=n.getPregenArgs)==null?void 0:i.call(n);return s?GT+n.id+":"+encodeURIComponent(JSON.stringify(s)):n.id}

export function eryouHeldItemBaseId(n?){if(!n.startsWith(GT))return n;const s=n.slice(GT.length),i=s.indexOf(":");return i<=0?s:s.slice(0,i)}

export function resolveEryouHeldItem(n?,s=[]){const i=_S(n);if(i!==null)return cCe(i);let A=n,a;if(n.startsWith(GT)){const I=n.indexOf(":",GT.length);if(I<0)return null;A=n.slice(GT.length,I);try{a=JSON.parse(decodeURIComponent(n.slice(I+1)))}catch{return null}if(!Array.isArray(a))return null}A==="BERRY"&&!a&&(a=[Kt.SITRUS]);const r=ZRe(A);if(!r)return null;const O=bo(r);return O instanceof on?O.generateType(s,a):O}

export function clampEryouTeamIndex(n?){return Number.isFinite(n)?Math.min(Math.max(Math.trunc(n),0),hl-1):0}

export function eryouTeamName(n?){return`队伍 ${u0(n)+1}`}

export function eryouTeamAt(n?,s?){const i=u0(s);return i===0?(Array.isArray(n.presetTeam)||(n.presetTeam=[]),n.presetTeam):(Array.isArray(n.extraPresetTeams)||(n.extraPresetTeams=[]),Array.isArray(n.extraPresetTeams[i-1])||(n.extraPresetTeams[i-1]=[]),n.extraPresetTeams[i-1])}

export function setEryouTeamAt(n?,s?,i?){const A=xr(n,s);A.length=0,A.push(...KM(i))}

export function activeEryouTeamIndex(n?){return u0(n.presetTeamIndex)}

export function activeEryouTeam(n?){return xr(n,WI(n))}

export function selectActiveEryouTeam(n?,s?){n.presetTeamIndex=u0(s)}

export function getEditingEryouTeamIndex(){return Doe}

export function setEditingEryouTeamIndex(n?){Doe=u0(n)}

export function isEryouBannedForm(n?,s?){return mCe.includes(n)&&!!s&&pCe.includes(s)}

export function isEryouBannedMove(n?){return yCe.includes(n)}

export function isEryouReplacedMove(n?){return BCe(n)||poe(n)}

export function revertEryouBannedForm(n?){var i,A;const s=(i=n==null?void 0:n.getFormKey)==null?void 0:i.call(n);return!n||!Hoe((A=n.species)==null?void 0:A.speciesId,s)?!1:(n.changeForm(new Oe(n.species.speciesId,s,"",new Fh,!0)),!0)}

export function buildEryouMoveset(n?){const s=n.size??KCe,i=n.minLevel,A=l(h=>typeof h=="number"&&h>t.NONE&&!!Fe[h]&&!poe(h),"isRealMove"),a=(n.levelMoves??[]).filter(h=>h[0]>0&&A(h[1])),r=a.filter(h=>h[0]<=n.level).map(h=>h[1]),O=a.filter(h=>h[0]<=i).map(h=>h[1]),I=(n.unlockedEggMoves??[]).filter(A),S=(n.savedMoveset??[]).filter(A),T=[],L=l(h=>{T.length<s&&!T.includes(h)&&T.push(h)},"push");return S.forEach(L),I.forEach(L),r.slice(-s).forEach(L),O.forEach(L),a.forEach(h=>L(h[1])),T}

export function sanitizeEryouMoveset(n?,s?,i?){const A=[],a=[...n],r=a.map((S,T)=>zse(S)?T:-1).filter(S=>S>=0);if(!r.length)return{moveset:a,replaced:A};const O=new Set(a),I=(s??[]).filter(S=>S[0]>0&&S[0]<=i).map(S=>S[1]).filter(S=>S!==t.NONE&&!zse(S)&&!O.has(S));for(const S of r){if(!I.length)continue;const T=I.splice(E.randBattleSeedInt(I.length),1)[0];A.push({from:a[S],to:T}),a[S]=T}return{moveset:a,replaced:A}}

export function resolveEryouIdentity(n?,s?,i?,A?){const a=s.ability??n.abilityIndex??A.abilityIndex,r=Number.isInteger(a)&&a>=0&&a<=2&&i.getAbility(a)?a:0,O=s.nature??n.nature??A.nature,I=Number.isInteger(O)&&O>=0&&O<25?O:0,S=i.malePercent===null?at.GENDERLESS:s.female!==void 0?s.female?at.FEMALE:at.MALE:n.gender===at.MALE||n.gender===at.FEMALE?n.gender:Math.random()*100<i.malePercent?at.MALE:at.FEMALE,T=[i.type1,i.type2].filter(h=>h!=null),L=s.tera!==void 0&&T.includes(s.tera)?s.tera:i.type1;return n.abilityIndex=r,n.nature=I,n.gender=S,{abilityIndex:r,nature:I,gender:S,teraType:L}}

export const EryouStartPhase =class O3 extends ii{constructor(s,i){super(),this.session=s,this.repeatSlot=i}start(){super.start();const s=E.gameData.getEryouData(),i=dCe(s);if(!i.filter(r=>!GO.includes(r)).length){E.clearPhaseQueue(),E.ui.showText("本局出战的队伍是空的：先去二游大厅，确认一支队伍 →「编队」加人，再「选择」它下本！",null,()=>{var r;E.clearPhaseQueue(),E.pushPhase(new Pa),(r=E.getCurrentPhase())==null||r.end()});return}const a=l(r=>{var C,d,U;if(E.clearPhaseQueue(),r===-1)return E.pushPhase(new Pa),this.end();E.sessionSlotId=r,f0(),L0(),E.gameMode=kh($t.ERYOU),E.eryouSession=jae(this.session)??this.session,E.eryouSession.rewardId=`${Date.now()}-${dS(16)}`,Vle(),this.session.kind==="abyss"&&(this.session.mechanisms=Kle());const O=_le(this.session);E.setSeed(O),E.resetSeed(0),E.money=0;const I=E.getPlayerParty(),S=[],T=[];for(const D of i){const f=pr(s,D),P=Ze(f.selectedForm),_=EN(),G=_[D]??_[P.speciesId]??{},m=gde(f,G,P,{abilityIndex:E.gameData.getStarterSpeciesDefaultAbilityIndex(P),nature:E.gameData.getSpeciesDefaultNature(P)}),y=E.addPlayerPokemon(P,Math.max(f.level,BA),m.abilityIndex,0,m.gender,!!G.shiny,void 0,void 0,m.nature);y.teraType=m.teraType,y.customPokemonData??(y.customPokemonData=new Ui);const Y=G,W=y.customPokemonData;Y.ptPassiveAbilityId!==void 0&&Y.ptPassiveAbilityId!==-1&&(W.ptPassiveAbilityId=Y.ptPassiveAbilityId,W.passive=Y.ptPassiveAbilityId),Y.ptTraitAbilityId!==void 0&&Y.ptTraitAbilityId!==-1&&(W.ptTraitAbilityId=Y.ptTraitAbilityId,W.ptTraitOverrideIndex=Y.ptTraitOverrideIndex??0);const $=E.gameData.ptSoudacheData;(C=$==null?void 0:$.bloodlineSlots)!=null&&C[D]&&((d=$.bloodlineAbilities)!=null&&d[D])&&(W.bloodlinePassive=$.bloodlineAbilities[D]),W.constellationLevel=((U=$==null?void 0:$.constellations)==null?void 0:U[D])??0,y.setVisible(!1);const te=E.gameData.starterData[D],J=te==null?void 0:te.moveset,ne=Qae(s,D)??(Array.isArray(J)&&typeof J[0]=="number"?J:null),ee=Math.max(f.level,BA),Ie=y.getLevelMoves(1,!0,!1,!0).filter(Te=>Te[0]>0),de=(E.gameData.getEffectiveEggMoves(D)??[]).filter((Te,se)=>((te==null?void 0:te.eggMoves)??0)&1<<se),me=WCe({savedMoveset:ne,levelMoves:Ie,level:ee,unlockedEggMoves:de,minLevel:BA}),Pe=YCe(me,Ie,ee);Pe.replaced.length&&console.log(`[ERYOU] ${y.name} 的 Z 招式已替换：${Pe.replaced.map(Te=>`${t[Te.from]} → ${t[Te.to]}`).join("、")}`),Pe.moveset.length?y.moveset=Pe.moveset.map(Te=>new Ot(Te)):(console.warn(`[ERYOU] ${y.name} 自动配招为空（升级表异常），退回撞击`),y.moveset=[new Ot(t.TACKLE)]),FCe(y)&&console.warn("[ERYOU] 检测到被禁用的形态（小智的皮卡丘 / 搭档 / 柳伯的小山猪 / 柳伯的信使鸟），已回退成普通形态"),((te==null?void 0:te.passiveAttr)??0)^(Pn.ENABLED|Pn.UNLOCKED)||(y.passive=!0),I.push(y),S.push(y.loadAssets());const ce=s.heldItemAssignments[D];ce&&T.push({pokemonId:y.id,itemId:ce})}const L=[X.MEGA_BRACELET().withIdFromFunc(X.MEGA_BRACELET).newModifier(),X.DYNAMAX_BAND().withIdFromFunc(X.DYNAMAX_BAND).newModifier(),X.TERA_ORB().withIdFromFunc(X.TERA_ORB).newModifier()].filter(D=>D!==null);for(const{pokemonId:D,itemId:f}of T)try{const P=I.find(y=>y.id===D);if(!P)continue;const _=_S(f),G=N0(f,I);if(!G)throw new Error("Unknown held item: "+f);const m=G.newModifier(P);m&&L.push(m)}catch(P){console.warn(`[ERYOU] 持有物 ${f} 发放失败:`,P)}for(const D of L)E.addModifier(D,!0,!1,!1,!0);E.updateModifiers(!0,!0),OLe();const h=E.gameData.saveSystem().then(D=>{if(!D)throw new Error("养成数据保存失败")});Promise.all([...S,h]).then(()=>{var D;if(E.time.delayedCall(500,()=>E.playBgm()),E.newArena(E.gameMode.getStartingBiome()),E.arena.resetUltraRareTrainerStatus(),E.newBattle(),E.arena.init(),E.sessionPlayTime=0,E.lastSavePlayTime=0,(D=this.session.mechanisms)!=null&&D.length)for(const f of this.session.mechanisms)E.queueMessage(`深渊特殊机制：${Wle(f)}`);E.pushPhase(new Zl(!1)),this.end()}).catch(D=>{console.error("[ERYOU] 开局失败:",D),E.clearPhaseQueue(),E.ui.showText("开局数据未能保存或加载，请返回标题后重试。",null,()=>{E.clearPhaseQueue(),E.pushPhase(new Pa),this.end()})})},"startRun");this.repeatSlot!==void 0?(E.ui.resetModeChain(),E.ui.setMode(V.MESSAGE),E.ui.clearText(),E.ui.fadeIn(250),a(this.repeatSlot)):E.ui.setMode(V.SAVE_SLOT,$h.SAVE,a)}}

export function setPendingEryouRun(n?){JS=n}

export function isEryouHeldItemType(n?){return n instanceof jt||n instanceof JO||n instanceof mo}

export function eryouHeldItemPoolForTierLevel(n?){return boe(Sb[n])}

export function eryouHeldTierKeyOf(n?){for(const s of Lo)if(Sb[s].includes(n))return s;return null}

export function isEryouHeldItemExcluded(n?){return woe.has(n)}

export function rollEryouHeldTier(n?,s?,i?){const A=Sb[n];if(A)for(const a of A)L0e(a,s[n].count,s[n].chance,i)}

export function rollEryouRewards(n?){const s=[],i=Number.isFinite(n.level)?Math.trunc(n.level):1,A=Math.min(Math.max(i,1),TE);if(n.kind==="abyss"){const a=yl[Math.min(Math.max(n.level,1),yl.length)-1];if(!a)return s;const r=E.gameData.getEryouData();mh(r);const I=!r.abyssFirstClear[n.level]?a.firstClearStones:Nle(n.level);return I>0&&s.push({kind:"stone",name:"觉醒石",count:I}),s}switch(n.dungeonType){case Is.MATERIAL:{const a=Fae[A-1];if(!a)return s;const r=n.attribute??R.NORMAL,O=O0e(r),I=l((T,L,h=1)=>{var d;if(!L||L[0]===0&&L[1]===0||Math.random()>=h)return;const C=bO(L[0],L[1]);C<=0||s.push({kind:"material",name:`${O}之突破·${dA[T]}`,count:C,typeId:r,rarity:T,iconAtlas:"types",iconFrame:(d=R[r])==null?void 0:d.toLowerCase()})},"pushMaterial");I(hA.WHITE,a.white),I(hA.BLUE,a.blue,a.blueChance??1),I(hA.PURPLE,a.purple,a.purpleChance??1),I(hA.GOLD,a.gold,a.goldChance??1);const S=bO(a.gene[0],a.gene[1]);S>0&&s.push({kind:"gene",name:`${O}之进化基因`,count:S,typeId:r,iconAtlas:"types",iconFrame:"stellar"});break}case Is.EXP:{const a=Kae[A-1];a.candy>0&&s.push({kind:"candy",name:"神奇糖果",count:a.candy,iconAtlas:"items",iconFrame:X.RARE_CANDY().iconImage}),a.goldCandy>0&&s.push({kind:"goldCandy",name:"黄金糖果",count:a.goldCandy,iconAtlas:"items",iconFrame:X.RARE_CANDY().iconImage});break}case Is.PT:{const a=Wae[A-1],r=Math.round(a*(1+(Math.random()*2-1)*Mm));s.push({kind:"pt",name:"PT",count:r});break}case Is.HELD_ITEM:{const a=Yae[A-1];Z0("common",a,s),Z0("super",a,s),Z0("ultra",a,s),Z0("master",a,s);break}}return s}

export async function grantEryouRewards(n?,s?){var T,L;const i=E.gameData,A=i.getEryouData(),a=n.rewardId??(n.rewardId="legacy-"+E.sessionSlotId+"-"+E.waveSeed+"-"+n.kind+"-"+n.level);if((T=A.rewardedRuns)!=null&&T.includes(a))return!1;if(SH.has(A))throw new Error("奖励正在保存，请稍后重试。");SH.add(A);const r=structuredClone(A),O=i.pt,I=(L=i.ptSoudacheData)==null?void 0:L.juexingStoneCount,S=structuredClone(i.gameStats);try{mh(A);for(const C of s)switch(C.kind){case"candy":A.candy+=C.count;break;case"goldCandy":A.goldCandy+=C.count;break;case"material":if(C.typeId!==void 0&&C.rarity!==void 0){const d=kE(C.typeId,C.rarity);A.breakthroughMaterials[d]=(A.breakthroughMaterials[d]||0)+C.count}break;case"gene":if(C.typeId!==void 0){const d=Bl(C.typeId);A.evolutionGenes[d]=(A.evolutionGenes[d]||0)+C.count}break;case"heldItem":C.itemId&&(A.heldItems[C.itemId]=(A.heldItems[C.itemId]||0)+C.count);break;case"pt":i.addPt(C.count);break;case"stone":i.ptSoudacheData&&(i.ptSoudacheData.juexingStoneCount=(i.ptSoudacheData.juexingStoneCount||0)+C.count);break}let h=!1;if(n.kind==="abyss")h=!A.abyssFirstClear[n.level],A.abyssFirstClear[n.level]=!0,A.abyssUnlocked=Math.max(A.abyssUnlocked,Math.min(n.level+1,yl.length));else if(n.dungeonType){const C=V1(n.dungeonType,n.dungeonType===Is.MATERIAL?n.attribute:void 0);A.dungeonUnlocks[C]=Math.max(A.dungeonUnlocks[C]||1,Math.min(n.level+1,TE))}if(A.rewardedRuns=[...A.rewardedRuns??[],a].slice(-128),!await i.saveSystem())throw new Error("奖励保存失败，已撤回，可重试。");return h}catch(h){for(const C of Object.keys(A))delete A[C];Object.assign(A,r),i.pt=O,i.ptSoudacheData&&(i.ptSoudacheData.juexingStoneCount=I),Object.assign(i.gameStats,S);try{await i.saveSystem()}catch{}throw h}finally{SH.delete(A)}}

export function eryouRepeatRun(n?,s?,i=!1){const A=s.level+(i?1:0);return!Number.isInteger(A)||A<1?null:s.kind==="abyss"?A>Ma||A>kN(n)||!VN(n)?null:{kind:"abyss",level:A}:!s.dungeonType||!Object.values<any>(Is).includes(s.dungeonType)||s.dungeonType===Is.MATERIAL&&(s.attribute===void 0||!Number.isInteger(s.attribute)||s.attribute<0||s.attribute>17)||A>TE||A>SO(n,s.dungeonType,s.attribute)?null:{kind:"dungeon",dungeonType:s.dungeonType,attribute:s.attribute,level:A}}

export class EryouRewardPhase extends ii{async start(){super.start();const s=E.eryouSession;if(!E.gameMode.isEryou||!s){const{GameOverPhase:D}=await GR(async()=>{const{GameOverPhase:f}=await Promise.resolve().then(()=>Lie);return{GameOverPhase:f}},void 0,import.meta.url);return E.pushPhase(new D(!0)),this.end()}const i=this.items??(this.items=N0e(s)),A=E.gameData.getEryouData(),a=s.kind==="dungeon"&&s.dungeonType?V1(s.dungeonType,s.dungeonType===Is.MATERIAL?s.attribute:void 0):null,r=s.kind==="abyss"?A.abyssUnlocked:a?A.dungeonUnlocks[a]||1:0;let O;try{O=await u0e(s,i)}catch(D){E.ui.setMode(V.MESSAGE).then(()=>E.ui.showText(String(D),null,()=>{this.start()},null,!0));return}const I=E.gameData.getEryouData(),S=s.kind==="abyss"?I.abyssUnlocked:a?I.dungeonUnlocks[a]||1:0,T=S>r?s.kind==="abyss"?`已解锁 深渊第 ${Math.min(S,Ma)} 层`:`已解锁 难度 ${S}`:void 0,L=`${MT(s)??(s.kind==="abyss"?`深渊 第${s.level}层`:`${c0e[s.dungeonType??Is.EXP]} 难度${s.level}`)} 通关奖励`,h=Mie(I,s),C=Mie(I,s,!0);console.log("[ERYOU] 奖励弹窗动作:",{repeat:h,next:C,session:s,unlockedAfter:S});let d=!1;const U=l(async D=>{if(d)return;d=!0,mde(D??null);const[{GameOverPhase:f},{EryouStartPhase:P}]=await Promise.all([GR(()=>Promise.resolve().then(()=>Lie),void 0,import.meta.url),GR(()=>Promise.resolve().then(()=>mB),void 0,import.meta.url)]);E.pushPhase(new f(!0,D?new P(D,E.sessionSlotId):void 0)),this.end()},"finish");E.ui.setOverlayMode(V.ERYOU_REWARD,{title:L,items:i,firstClear:s.kind==="abyss"&&O,unlockText:T,onClose:l(()=>U(),"onClose"),onRetry:h?()=>U(h):void 0,onNext:C?()=>U(C):void 0,nextLabel:s.kind==="abyss"?"下一层":"下一难度"})}end(){super.end()}}

export const EryouEvolvePhase =class WV extends ii{constructor(s,i,A){super(),this.rootId=s,this.option=i,this.fromSpeciesId=A}start(){super.start();const s=E.gameData.getEryouData(),i=pr(s,this.rootId),A=Ze(this.fromSpeciesId??i.selectedForm),a=A.malePercent!==null?Math.random()*100<A.malePercent?at.MALE:at.FEMALE:at.GENDERLESS,r=E.addPlayerPokemon(A,Math.max(i.level,1),0,0,a,!1,void 0);r.setVisible(!1),E.getPlayerParty().push(r);let O=!1;const I=l(()=>{O||(O=!0,console.log("[ERYOU] 开始播放进化动画:",this.option.evoName),E.pushPhase(new Xl(r,this.option.entry,i.level)),E.pushPhase(new jy(this.rootId,this.option,r)),this.end())},"startAnimation");r.loadAssets().then(I).catch(S=>{console.warn("[ERYOU] 进化资源加载失败，照常播放动画：",S),I()}),E.time.delayedCall(1200,I)}}

export const EryouEvolveDonePhase =class YV extends ii{constructor(s,i,A){super(),this.rootId=s,this.option=i,this.tempPokemon=A}start(){super.start();try{const s=E.gameData.getEryouData(),i=pr(s,this.rootId);i.unlockedForms.includes(this.option.evoSpeciesId)||i.unlockedForms.push(this.option.evoSpeciesId),i.selectedForm=this.option.evoSpeciesId,E.gameData.saveSystem()}catch(s){console.warn("[ERYOU] 进化收尾保存失败：",s)}try{const s=E.getPlayerParty(),i=s.indexOf(this.tempPokemon);i>-1&&s.splice(i,1),this.tempPokemon.destroy()}catch(s){console.warn("[ERYOU] 进化收尾清理失败（不影响进化结果）：",s)}E.ui.showText(`进化为 ${this.option.evoName}！已解锁该形态，之后可在养成界面里继续升级。`,null,()=>{E.ui.clearText(),E.ui.getMessageHandler().clearText(),E.ui.resetModeChain(),E.ui.setMode(V.STARTER_SELECT,()=>{},{eryou:!0})})}}

export function eryouBaseStats(n?,s?,i?){const A=Ze(n).baseStats.slice(0);return s!==void 0&&nfe(A,s,i),A}

export function eryouPanelStats(n?,s?,i?,A?,a?){const r=afe(n,A,a);return Ir.map(O=>{const I=Math.floor((2*r[O]+Afe)*s*.01);if(O===p.HP)return I+s+10;let S=I+5;const T=jL(i,O);return T!==1&&(S=Math.max(Math[T>1?"ceil":"floor"](S*T),1)),S})}

export function isEryouAllyProtectMove(n?){return hGe.includes(n)}

export function isEryouTauntMove(n?){return CGe.includes(n)}

export function isEryouAllySelfBuffMove(n?){return MGe.includes(n)}

export function isEryouAllyTargetableSelfMove(n?){return tOe(n)||sOe(n)}

export const EryouShellTrapDelayAttr =class lX extends Ht{constructor(){super(!0,{trigger:Gs.HIT})}apply(s,i,A,a){var O;if(!((O=E.gameMode)!=null&&O.isEryou)||!super.apply(s,i,A,a))return!1;const r=E.currentBattle;return r.p5xNextRoundDelayed.includes(s.getBattlerIndex())||(r.delayP5XTargetToLast(s.getBattlerIndex()),E.queueMessage(`${ie(s)} 的陷阱甲壳余波：下一轮最后出手！`)),!0}}

export const EryouRetaliatePowerAttr =class SX extends Ri{apply(s,i,A,a){var S;if(!((S=E.gameMode)!=null&&S.isEryou))return!1;const r=a[0];if(!(r instanceof At))return!1;const O=E.currentBattle.p5xPreviousActorIndex;if(O==null)return!1;const I=E.getField()[O];return!I||I.isPlayer()===s.isPlayer()?!1:(r.value*=2,!0)}}

export const AfterYouAttr =class qX extends Ht{apply(s,i,A,a){var O;if((O=E.gameMode)!=null&&O.isEryou)return E.queueMessage(`${ie(i)} 将在下一轮最先出手！`),E.currentBattle.delayP5XTargetToFirst(i.getBattlerIndex()),!0;E.queueMessage(M.t("moveTriggers:afterYou",{targetName:ie(i)}));const r=E.findPhase(I=>I.pokemon===i);return r&&E.tryRemovePhase(I=>I.pokemon===i)&&E.prependToPhase(new Hs(i,[...r.targets],r.move,r.isFollowUp(),r.shouldIgnorePp(),r.isReflected(),r.isForcedLast(),r.shouldIgnoreAssaultVest()),Hs),!0}}

export function isSpreadEnemyTargetInEryou(n?){return n===void 0?!1:AOe.has(n)||n===Le.ALL_NEAR_OTHERS||n===Le.ALL_OTHERS}

export function markEryouPrimaryTargetSelect(n?,s?,i?){var A,a;return!((a=(A=E)==null?void 0:A.gameMode)!=null&&a.isEryou)||!n.isPlayer()||!i.multiple||i.targets.length<=1||!GGe(s)?i:{...i,primaryTargetSelect:!0}}

export function classifyEryouStatusMove(n?){if(n.category!==B.STATUS)return Ys.UNKNOWN;if(tOe(n.id)||n.hasAttr(zA))return Ys.PROTECT;if(n.hasAttr(Il))return Ys.HAZARD;const s=n.getAttrs(qs);if(s.length)return s.some(r=>UOe.includes(r.tagType))?Ys.SCREEN:s.some(r=>r.tagType===_e.TAILWIND)?Ys.TAILWIND:Ys.UNKNOWN;if(n.hasAttr(uo)||n.hasAttr(co))return Ys.FIELD_SET;if(n.hasAttr(pC))return Ys.LEECH_SEED;if(n.hasAttr(_C))return Ys.SUBSTITUTE;const i=n.getAttrs(Mt);if(i.length)return i.every(r=>r.selfTarget)?Ys.SELF_STATUS:Ys.STATUS_EFFECT;const A=n.getAttrs(Ge);if(A.length)return A.every(r=>r.selfTarget)?Ys.SELF_BUFF:A.every(r=>!r.selfTarget)?Ys.DEBUFF:Ys.UNKNOWN;const a=n.getAttrs(rA);return a.length?a.every(r=>r.selfTarget)?Ys.SELF_HEAL:Ys.ALLY_HEAL:n.getAttrs(Zt).some(r=>r.tagType===Z.TAUNT)?Ys.TAUNT:Ys.UNKNOWN}

export function scoreEryouStatusMove(n?,s?){const{target:i}=s;switch(n){case Ys.SELF_HEAL:return s.selfHpRatio<.3?95:s.selfHpRatio<.5?70:s.selfHpRatio<.65?45:0;case Ys.SELF_STATUS:return s.selfHpRatio<.35?60:0;case Ys.ALLY_HEAL:return i.hpRatio>=.5?0:i.hpRatio<.3?65:55;case Ys.SELF_BUFF:{if(s.turnInWave>=3||s.selfHpRatio<.5)return 0;let A=0;return s.turnInWave<=1&&s.selfHpRatio>=.6?A=80:s.turnInWave===2&&s.selfHpRatio>=.75&&(A=55),s.selfCost?Math.max(0,A-15):A}case Ys.DEBUFF:return i.debuffStacks>=3||i.hpRatio<.3?10:i.threatRank===0?70:55;case Ys.STATUS_EFFECT:return i.hasStatus||i.statusBlocked||i.hasSubstitute||i.hpRatio<.35?10:i.threatRank===0?72:58;case Ys.FIELD_SET:return s.hasWeather||s.hasTerrain||s.selfHpRatio<.35?0:s.turnInWave>=2?20:60;case Ys.SCREEN:return s.selfSideTags.some(A=>UOe.includes(A))||s.selfHpRatio<.35||s.turnInWave>=3?0:55;case Ys.TAILWIND:return s.selfSideTags.includes(_e.TAILWIND)||s.selfHpRatio<.35||s.turnInWave>=2?0:55;case Ys.HAZARD:return 0;case Ys.PROTECT:return 0;case Ys.SUBSTITUTE:return s.selfHpRatio<.6||s.turnInWave>=2?0:45;case Ys.TAUNT:return s.turnInWave>=3?0:i.usedStatusRecently?70:s.turnInWave<=1?40:0;case Ys.LEECH_SEED:return i.seeded||i.hasSubstitute||i.hpRatio<=.5?0:55;default:return 0}}

export function eryouAiTierForDungeon(n?){return DOe(wge,n)}

export function eryouAiTierForAbyss(n?){return DOe(bge,n)}

export function getEryouAiTier(){var s,i;if(!((i=(s=E)==null?void 0:s.gameMode)!=null&&i.isEryou))return ho.OFF;const n=E.eryouSession;return n?n.kind==="abyss"?Vge(n.level):xge(n.level):ho.OFF}

export function eryouFocusScore(n?){const s=1-iae(n),i=iae(n)<=Zge?1:0;return DN.SUPPORT*Nd(n.support)+DN.THREAT*Nd(n.threat)+DN.LOW_HP*s+DN.NEAR_DEATH*i+(n.actedThisRound?-12:DN.UNACTED)}

export function pickEryouFocusTarget(n?){let s=null,i=Number.NEGATIVE_INFINITY;for(const A of n){if(A.hp<=0)continue;const a=zge(A);(a>i||a===i&&s!==null&&A.battlerIndex<s.battlerIndex)&&(s=A,i=a)}return s?s.battlerIndex:null}

export function chooseEryouRefinement(n?){const{tier:s,baseline:i,focusTarget:A}=n;if(s<=ho.OFF)return null;const a=n.targets.filter(I=>I.hp>0);if(!a.length)return null;const r=n.probes.find(I=>I.move===i.move);if(!r)return null;const O=i.targets.length?i.targets[0]:null;if(r.damaging){const I=CM(r,a).filter(S=>KI(r,S.battlerIndex)>=vL(S));if(I.length){if(O!==null&&I.some(L=>L.battlerIndex===O)||r.spread)return null;let T=I[0];for(const L of I)Aae({target:L},{target:T},A)&&(T=L);return z("ai",`[二游战术AI] 击杀纠正：${t[i.move]} 改打 ${Jt[T.battlerIndex]}`),{move:i.move,targets:[T.battlerIndex]}}}if(s>=ho.BASIC){let I=null;for(const S of n.probes)if(!(!S.damaging||S.accuracy*100<Jge)&&!jge.includes(S.move))for(const T of CM(S,a))KI(S,T.battlerIndex)<vL(T)||Aae({target:T},I,A)&&(I={probe:S,target:T});if(I)return z("ai",`[二游战术AI] 收人头：改出 ${t[I.probe.move]} 打 ${Jt[I.target.battlerIndex]}`),{move:I.probe.move,targets:I.probe.spread?[...I.probe.hitTargets]:[I.target.battlerIndex]}}if(s>=ho.TACTICAL&&r.damaging&&!r.spread&&a.length>=2){const I=KI(r,O)*r.accuracy;let S=null;for(const T of n.probes){if(!T.damaging||!T.spread)continue;let L=0;for(const h of CM(T,a))L+=KI(T,h.battlerIndex);L*=T.accuracy,L>0&&(!S||L>S.total)&&(S={probe:T,total:L})}if(S&&S.total>=I*Xge)return z("ai",`[二游战术AI] 群攻补正：${t[S.probe.move]} 合计 ${Math.round(S.total)} > ${Math.round(I)}（单体）`),{move:S.probe.move,targets:[...S.probe.hitTargets]}}if(s>=ho.TACTICAL&&A!==null&&r.damaging&&!r.spread){const I=a.find(S=>S.battlerIndex===A);if(I&&O!==A){const S=KI(r,A),T=KI(r,O),L=s>=ho.HUNT&&!I.actedThisRound?Qge:$ge;if(S>0&&S>=T*L)return z("ai",`[二游战术AI] 集火：${t[i.move]} 改打 ${Jt[A]}（${S} vs ${T}）`),{move:i.move,targets:[A]}}}if(r.damaging&&r.hitTargets.length>0&&qge(r,O)<=0){let I=null;for(const S of n.probes)if(S.damaging)for(const T of CM(S,a)){const L=KI(S,T.battlerIndex)*S.accuracy;if(L<=0)continue;(!I||T.battlerIndex===A&&I.target.battlerIndex!==A||T.battlerIndex!==A&&I.target.battlerIndex!==A&&L>I.damage)&&(I={probe:S,target:T,damage:L})}if(I)return z("ai",`[二游战术AI] 免疫纠正：改出 ${t[I.probe.move]}`),{move:I.probe.move,targets:I.probe.spread?[...I.probe.hitTargets]:[I.target.battlerIndex]}}return null}

export function simulateEryouDamage(n?,s?,i?){var A;try{const a=i.hasAttr(mr)||!!n.getTag(Z.ALWAYS_CRIT),r=s.getAttackDamage(n,i,!((A=s.battleData)!=null&&A.abilityRevealed),!1,!1,!1,a,!0);return r.cancelled?0:Math.max(0,r.damage)}catch{return 0}}

export function selectEryouStatusDecision(n?,s?,i?,A?,a?,r?,O?){var h;for(const C of i)if(C.damaging){for(const d of a)if(!(d.hp<=0||!C.hitTargets.includes(d.battlerIndex))&&(C.minDamage[d.battlerIndex]??0)>=vL(d))return null}const I=E.arena,S=[...A].sort((C,d)=>(r.get(d.getBattlerIndex())??0)-(r.get(C.getBattlerIndex())??0)),T=(n.isPlayer()?E.getPlayerField():E.getEnemyField()).filter(C=>!!C&&C.isActive(!0)&&!C.isFainted());let L=null;for(const C of s){const d=C.getMove(),U=Wge(d);if(U===Ys.UNKNOWN||U===Ys.PROTECT||U===Ys.HAZARD)continue;const D=new Set(Lr(n,d.id).targets);let f=kp,P=null;if(rHe(U)){const m=O!==null?A.find(W=>W.getBattlerIndex()===O):void 0,y=m&&D.has(m.getBattlerIndex())?m:S.find(W=>D.has(W.getBattlerIndex()));if(!y)continue;const Y=S.findIndex(W=>W.getBattlerIndex()===y.getBattlerIndex());f=IHe(n,y,d,Y<0?99:Y),P=[y.getBattlerIndex()]}else if(U===Ys.ALLY_HEAL){const m=T.filter(y=>D.has(y.getBattlerIndex())).sort((y,Y)=>y.getHpRatio()-Y.getHpRatio())[0];if(!m)continue;f={...kp,hpRatio:m.getHpRatio()},P=[m.getBattlerIndex()]}else{const m=n.getNextTargets(d.id);if(!m.length)continue;P=m,f={...kp,hpRatio:n.getHpRatio()}}if(!P)continue;const _={selfHpRatio:n.getHpRatio(),turnInWave:Math.max(0,(((h=n.battleSummonData)==null?void 0:h.turnCount)??1)-1),selfCost:oHe(d),hasWeather:!!(I!=null&&I.weather),hasTerrain:!!(I!=null&&I.terrain),selfSideTags:EHe(n),target:f},G=vge(U,_);G>=Yge&&(!L||G>L.score)&&(L={move:d.id,targets:P,score:G,kind:U})}return L?(z("ai",`[二游战术AI] 改走变化招：${t[L.move]}（${L.kind}，时机分 ${L.score}）`),{move:L.move,targets:L.targets}):null}

export function refineEryouEnemyMove(n?,s?){const i=kge();if(n.isPlayer())return null;const A=fOe(n);if(!A.length||(s.targets??[]).includes(Jt.ATTACKER))return null;const a=n.getMoveset().filter(D=>!!D&&D.isUsable(n));if(!a.length)return null;const r=a.map(D=>nHe(n,D,A));if(!r.some(D=>D.move===s.move))return null;const O=E.currentBattle,I=(O==null?void 0:O.p5xActedOrder)??[],S=aHe(n),T=(HE==null?void 0:HE.threats)??new Map,L=A.map(D=>xv(D,T,I)),h=lHe(n,a,r,A,L,T,S);if(h&&!(h.move===s.move&&sae(h.targets,s.targets)))return{move:h.move,targets:h.targets,ignorePP:h.move===s.move?s.ignorePP:void 0,ignoreAssaultVest:h.move===s.move?s.ignoreAssaultVest:void 0};if(i<=ho.OFF)return null;const C=[...s.targets??[]],d=eHe({tier:i,baseline:{move:s.move,targets:C},probes:r,targets:L,focusTarget:S});if(!d||d.move===s.move&&sae(d.targets,C))return null;const U=d.move===s.move;return{move:d.move,targets:d.targets,ignorePP:U?s.ignorePP:void 0,ignoreAssaultVest:U?s.ignoreAssaultVest:void 0}}

export function constellationLevel(n?,s?){var A;const i=((A=n==null?void 0:n.constellations)==null?void 0:A[s])??0;return Number.isFinite(i)?Math.max(0,Math.min(gN,Math.floor(i))):0}

export function hasExclusiveNode(n?,s?){var i;return((i=NRe[n])==null?void 0:i.exclusiveNodes.includes(s))??!1}

export function applyConstellationBaseStats(n?,s?,i?){var r;const A=sfe(i,s),a=NRe[s];for(const O of[1,2,5])O<=A&&ife(s,O)&&((r=a==null?void 0:a.applyBaseStats)==null||r.call(a,O,n,A,{}))}

// ─────────────────────────────────────────────────────────────
// 4. 产物短名别名（供提取体内部交叉引用）
// ─────────────────────────────────────────────────────────────
const Dm = createDefaultEryouData;
const EEe = clampEryouSpeed;
const FCe = revertEryouBannedForm;
const GGe = isSpreadEnemyTargetInEryou;
const Hoe = isEryouBannedForm;
const Jae = parseEryouWeekKeyAnchor;
const Kle = rollEryouAbyssMechanisms;
const MT = eryouSessionLabel;
const Mie = eryouRepeatRun;
const N0 = resolveEryouHeldItem;
const N0e = rollEryouRewards;
const O3 = EryouStartPhase;
const Qae = getEryouMoveset;
const SX = EryouRetaliatePowerAttr;
const Vge = eryouAiTierForAbyss;
const Vle = enterEryouSpeedCap;
const WCe = buildEryouMoveset;
const WI = activeEryouTeamIndex;
const WV = EryouEvolvePhase;
const Wge = classifyEryouStatusMove;
const Wle = describeEryouMechanism;
const YCe = sanitizeEryouMoveset;
const YV = EryouEvolveDonePhase;
const Z0 = rollEryouHeldTier;
const _S = formChangeItemFromEryouId;
const _le = getEryouRunSeed;
const aEe = isEryouContext;
const afe = eryouBaseStats;
const cCe = eryouFormItemModifierType;
const coe = eryouFormItemId;
const dCe = activeEryouTeam;
const eHe = chooseEryouRefinement;
const gde = resolveEryouIdentity;
const gw = reapplyEryouEnemyPanelBuffs;
const ife = hasExclusiveNode;
const jae = normalizeEryouSession;
const k1 = getEryouWeekAnchor;
const kge = getEryouAiTier;
const lHe = selectEryouStatusDecision;
const lX = EryouShellTrapDelayAttr;
const mde = setPendingEryouRun;
const nfe = applyConstellationBaseStats;
const poe = isEryouBannedMove;
const qL = getEryouWeekKey;
const qX = AfterYouAttr;
const sEe = syncEryouAbyssBuffBadges;
const sOe = isEryouAllySelfBuffMove;
const sfe = constellationLevel;
const tOe = isEryouAllyProtectMove;
const u0 = clampEryouTeamIndex;
const u0e = grantEryouRewards;
const vge = scoreEryouStatusMove;
const xge = eryouAiTierForDungeon;
const xr = eryouTeamAt;
const zge = eryouFocusScore;
const zse = isEryouReplacedMove;


// ─────────────────────────────────────────────────────────────
// TODO(接入锚点 90df65097b6d)：本文件依赖清单
// ─────────────────────────────────────────────────────────────
// TODO(接入锚点): 上述 `declare` 块中约 300 个短名 → 上游真实模块（globalScene / 枚举 /
//                 Phase / Modifier / 工具函数）；接入时逐个替换为 import。
// TODO(接入锚点): `ERYOU_CONSTELLATION_REGISTRY`（产物 `NRe`）在产物中未被赋值；
//                 若真实玩法需要注册，须由 ERYOU 数据初始化点填充。
// TODO(接入锚点): 4 个 Phase（EryouStart/Reward/Evolve/EvolveDone）挂到阶段注册表。
// TODO(A4-验证): 独立命座分支 `nfe` 传空 `choices` 的行为（与公共底座的差异）。
// TODO(A4-验证): 周键 / 深渊机制 / 速度上限的边界条件。
