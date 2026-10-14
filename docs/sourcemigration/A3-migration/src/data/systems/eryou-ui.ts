/**
 * 二游养成（ERYOU）—— UI 层（独立文件）
 * ---------------------------------------------------------------------------
 * 来源：game/server/dist/assets/loading-scene-By2k7Qfx.js（.orig 产物）
 * 逆向方式：`l(短名,"原函数名")` 反查
 * 锚点树：90df65097b6df76f713e6bd108afa84499e8b993
 *
 * 定位：ERYOU 的 **UI 层**（20 个 Handler / 组件，89 KB）。数据/规则/AI/阶段层见
 *       `eryou-system.ts`（本文件 import 其 9 个符号）。
 *
 * 产物符号对照：
 *   Mn/_s/Aoe/Dhe           → eryouWindow / eryouText / eryouCursor / eryouSelectFrame（基础绘制）
 *   p2/m2/B2/y2             → EryouBar / EryouBattlePanel / EryouList / EryouButton（组件）
 *   A1                      → EryouSubScreenHandler（子屏基类）
 *   yV/vV/wV/bV/xV/VV/kV/ZV/XV/$V/QV
 *                           → EryouReward / Progression / LevelUp / Evolve / HeldItem /
 *                             **Synthesis** / Guide / Training / Lobby / HeldSynthesis /
 *                             SpeciesSearch  UiHandler
 *
 * ⚠️ 主体由产物**逐字提取**（定义名还原为原名 + 参数可选化），请勿手工排版。
 */
import {
  activeEryouTeamIndex as WI,
  eryouPanelStats as yne,
  eryouTeamAt as xr,
  eryouTeamName as OE,
  formChangeItemFromEryouId as _S,
  getEditingEryouTeamIndex as dl,
  isEryouFormItemId as $se,
  resolveEryouHeldItem as N0,
  selectActiveEryouTeam as MCe,
} from "./eryou-system";

// ─────────────────────────────────────────────────────────────
// 外部依赖占位（上游 API；接入锚点时替换为真实 import）
// ─────────────────────────────────────────────────────────────
declare let $: any;
declare let $l: any;
declare let $s: any;
declare let A1: any;
declare let AL: any;
declare let AM: any;
declare let Aoe: any;
declare let ArrowDown: any;
declare let ArrowUp: any;
declare let BA: any;
declare let BI: any;
declare let Ba: any;
declare let Bl: any;
declare let Bne: any;
declare let Bse: any;
declare let CN: any;
declare let Cl: any;
declare let Cr: any;
declare let DB: any;
declare let Dde: any;
declare let Dhe: any;
declare let E: any;
declare let EF: any;
declare let EM: any;
declare let EN: any;
declare let ERYOU: any;
declare let ET: any;
declare let Efe: any;
declare let Enter: any;
declare let Eoe: any;
declare let Esc: any;
declare let Escape: any;
declare let F: any;
declare let FS: any;
declare let Fi: any;
declare let Fne: any;
declare let GCe: any;
declare let GD: any;
declare let GO: any;
declare let HCe: any;
declare let Hae: any;
declare let Hans: any;
declare let IB: any;
declare let Iie: any;
declare let Is: any;
declare let Je: any;
declare let Jo: any;
declare let Jse: any;
declare let KA: any;
declare let KE: any;
declare let KU: any;
declare let LR: any;
declare let Lo: any;
declare let Loe: any;
declare let Lv: any;
declare let M: any;
declare let MB: any;
declare let MEGA: any;
declare let MRe: any;
declare let Ma: any;
declare let Mde: any;
declare let Mn: any;
declare let Moe: any;
declare let Ng: any;
declare let Noe: any;
declare let Ns: any;
declare let OB: any;
declare let OU: any;
declare let Ofe: any;
declare let Oo: any;
declare let P5X: any;
declare let PCe: any;
declare let PT: any;
declare let PT$: any;
declare let PageDown: any;
declare let PageUp: any;
declare let Phaser: any;
declare let Poe: any;
declare let QS: any;
declare let Qse: any;
declare let R: any;
declare let RU: any;
declare let Rfe: any;
declare let Rie: any;
declare let SN: any;
declare let SO: any;
declare let Sfe: any;
declare let Sie: any;
declare let Sn: any;
declare let Soe: any;
declare let TE: any;
declare let Ti: any;
declare let Tie: any;
declare let Toe: any;
declare let Type: any;
declare let Um: any;
declare let V: any;
declare let VH: any;
declare let VN: any;
declare let VS: any;
declare let Vr: any;
declare let Wi: any;
declare let Wne: any;
declare let X: any;
declare let XN: any;
declare let Xa: any;
declare let Xr: any;
declare let YI: any;
declare let Yi: any;
declare let Z: any;
declare let ZO: any;
declare let Ze: any;
declare let _Ce: any;
declare let _D: any;
declare let _de: any;
declare let _oe: any;
declare let _s: any;
declare let aM: any;
declare let abyss: any;
declare let action: any;
declare let activeTeam: any;
declare let add: any;
declare let addActionRow: any;
declare let addDetailText: any;
declare let after: any;
declare let all: any;
declare let aoe: any;
declare let apply: any;
declare let applyFilter: any;
declare let assignedHere: any;
declare let attribute: any;
declare let autoComplete: any;
declare let available: any;
declare let bI: any;
declare let bM: any;
declare let bS: any;
declare let back: any;
declare let battle: any;
declare let before: any;
declare let beginSearch: any;
declare let bindWheel: any;
declare let bl: any;
declare let br: any;
declare let breakthrough: any;
declare let breakthroughMaterials: any;
declare let buff: any;
declare let buildAbyss: any;
declare let buildDungeon: any;
declare let buildMain: any;
declare let buildRootList: any;
declare let buildRows: any;
declare let button: any;
declare let cRe: any;
declare let canScroll: any;
declare let chainRestrictionReason: any;
declare let chanceSummary: any;
declare let choose: any;
declare let clear: any;
declare let clearDetail: any;
declare let clearStackedEryouScreens: any;
declare let cleared: any;
declare let close: any;
declare let closeSelf: any;
declare let closeTeamPrompt: any;
declare let compositionend: any;
declare let compositionstart: any;
declare let confirm: any;
declare let confirmPromptOption: any;
declare let constellationLevel: any;
declare let constructor: any;
declare let currentActions: any;
declare let cursor: any;
declare let cycleMaterial: any;
declare let dA: any;
declare let dI: any;
declare let dO: any;
declare let darkHeight: any;
declare let data: any;
declare let db: any;
declare let describeItem: any;
declare let detail: any;
declare let difficultyAt: any;
declare let dna_splicers: any;
declare let doBreakthrough: any;
declare let doEvolve: any;
declare let doLevelUp: any;
declare let drawPanel: any;
declare let dt: any;
declare let dungeon: any;
declare let dungeonRow: any;
declare let dungeonType: any;
declare let efe: any;
declare let empty: any;
declare let enabled: any;
declare let endSearch: any;
declare let ensureEntries: any;
declare let entryById: any;
declare let eo: any;
declare let eryou: any;
declare let evolve: any;
declare let exp: any;
declare let fB: any;
declare let fde: any;
declare let fhe: any;
declare let fo: any;
declare let foe: any;
declare let fontSize: any;
declare let formIndex: any;
declare let frame: any;
declare let fs: any;
declare let gCe: any;
declare let gD: any;
declare let gN: any;
declare let gO: any;
declare let gae: any;
declare let gamepad: any;
declare let gap: any;
declare let gene: any;
declare let getCursor: any;
declare let goBack: any;
declare let goe: any;
declare let guardPointer: any;
declare let guide: any;
declare let hN: any;
declare let have: any;
declare let header: any;
declare let headerFontSize: any;
declare let headerHeight: any;
declare let height: any;
declare let heightOf: any;
declare let held: any;
declare let heldItem: any;
declare let heldItemAvailable: any;
declare let heldItemIcon: any;
declare let heldItemName: any;
declare let high: any;
declare let highlightAction: any;
declare let hint: any;
declare let hl: any;
declare let hp: any;
declare let hs: any;
declare let icon: any;
declare let id: any;
declare let invalidateEntries: any;
declare let isOpen: any;
declare let item: any;
declare let itemName: any;
declare let items: any;
declare let jE: any;
declare let jieming: any;
declare let jo: any;
declare let jse: any;
declare let kE: any;
declare let kH: any;
declare let kN: any;
declare let key: any;
declare let keyHint: any;
declare let keydown: any;
declare let kind: any;
declare let l: any;
declare let lH: any;
declare let label: any;
declare let lan: any;
declare let lang: any;
declare let leave: any;
declare let left: any;
declare let length: any;
declare let level: any;
declare let levelNameOf: any;
declare let lfe: any;
declare let lie: any;
declare let lineSpacing: any;
declare let list: any;
declare let lobby: any;
declare let locked: any;
declare let low: any;
declare let lw: any;
declare let mI: any;
declare let mU: any;
declare let main: any;
declare let markFormItem: any;
declare let matchesQuery: any;
declare let maxLength: any;
declare let maxLines: any;
declare let maxScrollTop: any;
declare let medium: any;
declare let message: any;
declare let mh: any;
declare let move: any;
declare let moveCursor: any;
declare let ms: any;
declare let nA: any;
declare let name: any;
declare let nearestSelectable: any;
declare let need: any;
declare let noe: any;
declare let none: any;
declare let notifyChanged: any;
declare let number: any;
declare let ofe: any;
declare let off: any;
declare let oie: any;
declare let onChanged: any;
declare let onConfirm: any;
declare let onDragEnd: any;
declare let onDragMove: any;
declare let onDragStart: any;
declare let onInputKey: any;
declare let onPointerDown: any;
declare let onPointerUp: any;
declare let onRowPointer: any;
declare let onSelect: any;
declare let onSelectionChanged: any;
declare let onSwipeEnd: any;
declare let onSwipeStart: any;
declare let open: any;
declare let openConstellation: any;
declare let openEvolvePanel: any;
declare let openHeldItemPanel: any;
declare let openPage: any;
declare let openTeamPrompt: any;
declare let option: any;
declare let overlay_exp: any;
declare let pI: any;
declare let pageReason: any;
declare let panelAdd: any;
declare let panelBar: any;
declare let panelHeight: any;
declare let panelItemIcon: any;
declare let panelNeedRow: any;
declare let panelNeedRowAt: any;
declare let panelParagraph: any;
declare let panelPips: any;
declare let panelSpecies: any;
declare let panelStatTable: any;
declare let panelText: any;
declare let panelTypeBadge: any;
declare let panelWidth: any;
declare let paragraph: any;
declare let party_slot_hp_bar: any;
declare let party_slot_hp_overlay: any;
declare let ph: any;
declare let pick: any;
declare let placeholder: any;
declare let pointerReady: any;
declare let pointerdown: any;
declare let pointermove: any;
declare let pointerup: any;
declare let pointerupoutside: any;
declare let pokemonInfo: any;
declare let pr: any;
declare let previewNature: any;
declare let processInput: any;
declare let processPromptInput: any;
declare let progression: any;
declare let putIn: any;
declare let px: any;
declare let qDe: any;
declare let qT: any;
declare let rH: any;
declare let rO: any;
declare let rb: any;
declare let re: any;
declare let refresh: any;
declare let refuse: any;
declare let render: any;
declare let renderAbyssDetail: any;
declare let renderAbyssSummary: any;
declare let renderAll: any;
declare let renderDetail: any;
declare let renderDungeonDetail: any;
declare let renderEvolvePanel: any;
declare let renderFooter: any;
declare let renderHeader: any;
declare let renderHeldItemPanel: any;
declare let renderHint: any;
declare let renderList: any;
declare let renderMainDetail: any;
declare let renderPage: any;
declare let renderPlan: any;
declare let renderPrompt: any;
declare let renderRewards: any;
declare let renderSlots: any;
declare let renderTeam: any;
declare let requirementSummary: any;
declare let reset: any;
declare let resize: any;
declare let returnToProgression: any;
declare let reward: any;
declare let rewardLines: any;
declare let rfe: any;
declare let rie: any;
declare let right: any;
declare let rightCap: any;
declare let roe: any;
declare let rootId: any;
declare let rootIdOfSelected: any;
declare let row: any;
declare let rowHeight: any;
declare let rows: any;
declare let run: any;
declare let runSynthesis: any;
declare let saveAndRefresh: any;
declare let scale: any;
declare let screen: any;
declare let screenTitle: any;
declare let scrollBy: any;
declare let search: any;
declare let searchText: any;
declare let select_cursor: any;
declare let select_cursor_highlight: any;
declare let selectable: any;
declare let selectedFormSpecies: any;
declare let selectedRoot: any;
declare let setCursor: any;
declare let setDragEnabled: any;
declare let setEnabled: any;
declare let setFocus: any;
declare let setRatio: any;
declare let setRows: any;
declare let setup: any;
declare let show: any;
declare let slot: any;
declare let slots: any;
declare let species: any;
declare let speciesId: any;
declare let spellCheck: any;
declare let startCursor: any;
declare let startEvolution: any;
declare let state: any;
declare let stateFontSize: any;
declare let stateStyle: any;
declare let steps: any;
declare let stock: any;
declare let stones: any;
declare let string: any;
declare let stripLabelArea: any;
declare let switchForm: any;
declare let synthesis: any;
declare let synthesize: any;
declare let team: any;
declare let team$: any;
declare let teamAt: any;
declare let teamEntries: any;
declare let teamIndexOf: any;
declare let text: any;
declare let textchange: any;
declare let tfe: any;
declare let to: any;
declare let toggleTeamMember: any;
declare let total: any;
declare let transform: any;
declare let trial: any;
declare let trough: any;
declare let troughLeft: any;
declare let turn: any;
declare let type: any;
declare let typeName: any;
declare let types: any;
declare let uA: any;
declare let uCe: any;
declare let uRe: any;
declare let unknown: any;
declare let updateQuery: any;
declare let useAdvancedWrap: any;
declare let useHandCursor: any;
declare let visibleCountFrom: any;
declare let w: any;
declare let wN: any;
declare let wO: any;
declare let wheel: any;
declare let width: any;
declare let wordWrap: any;
declare let wr: any;
declare let x: any;
declare let xS: any;
declare let xl: any;
declare let xn: any;
declare let xs: any;
declare let y: any;
declare let yI: any;
declare let yse: any;
declare let zE: any;
declare let za: any;
declare let zh: any;
declare let zo: any;


// ─────────────────────────────────────────────────────────────
// UI 实现（产物逐字提取）
// ─────────────────────────────────────────────────────────────

function eryouWindow(n?,s?,i?,A?,a?){return dt(n,s,i,A,!1,!1,0,0,a)}

function eryouText(n?,s?,i="",A=F.WINDOW,a=Je.body,r:any={}){const O=re(n,s,i,A,{fontSize:`${a}px`,...r});return O.setOrigin(0,0),O}

function eryouCursor(){return E.add.image(0,0,"cursor").setOrigin(0,.5)}

function eryouSelectFrame(n?,s?,i?,A?,a=!1){return E.add.nineslice(n,s,a?"select_cursor_highlight":"select_cursor",void 0,i,A,6,6,6,6).setOrigin(0,0)}

const EryouBar =class p2 extends Phaser.GameObjects.Container{constructor(s,i,A,a="hp"){super(E,s,i),this.kind=a,this.barWidth=Math.max(8,A);const r=OB("party_slot_hp_bar","eryou-trough",14,0,84,6);this.trough=E.add.nineslice(0,0,"party_slot_hp_bar",r,this.barWidth,6,2,2,2,2).setOrigin(0,0),this.fill=a==="exp"?E.add.image(2,2,"overlay_exp").setOrigin(0,0):E.add.image(2,2,"party_slot_hp_overlay","high").setOrigin(0,0),this.add([this.trough,this.fill])}setRatio(s){const i=Number.isFinite(s)?Math.max(0,Math.min(1,s)):0,A=this.barWidth-4;if(this.kind!=="exp"){const a=this.kind==="need"?i>=1?"high":i>=.5?"medium":"low":i>.5?"high":i>.25?"medium":"low";this.fill.setFrame(a)}return this.fill.setVisible(i>0),this.fill.setDisplaySize(Math.max(.5,A*i),this.kind==="exp"?2:3),this}}

class EryouBattlePanel extends Phaser.GameObjects.Container{constructor(s,i,A,a=1,r=.6){super(E,0,0),this.pixelScale=a,this.texWidth=0,this.texHeight=0,this.texLeft=0,this.spec=fhe[s];const{key:O,left:I,right:S,troughLeft:T}=this.spec,L=OB(O,"eryou-left",I,Bse,T-I,yse),h=OB(O,"eryou-right",T,Bse,S-T+1,yse);this.leftPart=E.add.nineslice(0,0,O,L,16,18,SN,1,rH,FS).setOrigin(0,0),this.rightPart=E.add.nineslice(0,0,O,h,32,18,2,this.rightCap(),rH,FS).setOrigin(0,0),this.add([this.leftPart,this.rightPart]),this.resize(i,A,r)}rightCap(){return this.spec.right-this.spec.troughRight+2}resize(s,i,A=.6){const a=this.pixelScale;this.texWidth=Math.max(SN+1+2+this.rightCap()+4,Math.round(s/a)),this.texHeight=Math.max(rH+FS,Math.round(i/a));const r=2+this.rightCap()+4,O=Math.max(r,Math.min(this.texWidth-SN-1,Math.round(this.texWidth*A)));return this.texLeft=this.texWidth-O,this.leftPart.setSize(this.texLeft,this.texHeight).setScale(a),this.rightPart.setSize(O,this.texHeight).setScale(a).setPosition(this.texLeft*a,0),this}trough(s=!1){const i=this.pixelScale,A=this.texWidth-this.texLeft-2-this.rightCap(),a=this.texHeight-FS+(s?3:4);return{x:(this.texLeft+2)*i,y:a*i,width:A*i,height:(s?4:2)*i}}stripLabelArea(){const s=this.pixelScale;return{x:(SN+1)*s,y:(this.texHeight-FS+3)*s,width:Math.max(0,this.texLeft-SN-2)*s,height:4*s}}darkHeight(){return(this.texHeight-FS+2)*this.pixelScale}panelWidth(){return this.texWidth*this.pixelScale}panelHeight(){return this.texHeight*this.pixelScale}}

const EryouList =class B2 extends Phaser.GameObjects.Container{constructor(s,i,A,a,r:any={}){super(E,s,i),this.listWidth=A,this.listHeight=a,this.rows=[],this.cursorIndex=0,this.scrollTop=0,this.rowObjects=[],this.pointerGuard=new mU,this.dragLastY=0,this.dragEnabled=!0,this.opts={rowHeight:r.rowHeight??12.5,headerHeight:r.headerHeight??9,fontSize:r.fontSize??Je.row,headerFontSize:r.headerFontSize??Je.tiny,stateFontSize:r.stateFontSize??Je.small,onSelect:r.onSelect,onConfirm:r.onConfirm},this.cursorObj=Aoe(),this.scrollBar=new Xr(A-4,0,4,a,1),this.scrollBar.setDraggable(I=>{const S=Math.max(0,Math.min(this.maxScrollTop(),I));S!==this.scrollTop&&(this.scrollTop=S,this.render(!1))}),this.add([this.cursorObj,this.scrollBar]);const O=E.add.zone(0,0,A,a).setOrigin(0,0).setInteractive();this.bindWheel(O),this.addAt(O,0),E.input.on("pointerdown",this.onDragStart,this),E.input.on("pointermove",this.onDragMove,this),E.input.on("pointerup",this.onDragEnd,this),E.input.on("pointerupoutside",this.onDragEnd,this)}bindWheel(s){s.on("wheel",(i,A,a)=>{var r;this.visible&&((r=this.parentContainer)!=null&&r.visible)&&this.scrollBy(a>0?1:-1)})}setDragEnabled(s){return this.dragEnabled=s,s||(this.dragPointerId=void 0),this}onDragStart(s){if(!this.dragEnabled||this.dragPointerId!==void 0||!this.canScroll())return;const i=this.getLocalPoint(s.worldX,s.worldY);i.x<0||i.x>this.listWidth||i.y<0||i.y>this.listHeight||i.x>this.listWidth-9||(this.dragPointerId=s.id,this.dragLastY=i.y)}onDragMove(s){if(s.id!==this.dragPointerId)return;const i=this.getLocalPoint(s.worldX,s.worldY),A=this.opts.rowHeight,a=Math.trunc((i.y-this.dragLastY)/A);a&&(this.dragLastY+=a*A,this.scrollBy(-a))}onDragEnd(s){s.id===this.dragPointerId&&(this.dragPointerId=void 0)}canScroll(){var s;return this.visible&&!!((s=this.parentContainer)!=null&&s.visible)&&this.rows.length>this.visibleCountFrom(this.scrollTop)}setRows(s,i=this.cursorIndex){return this.rows=s,this.cursorIndex=this.nearestSelectable(Math.max(0,Math.min(i,s.length-1)),1),this.render(),this}getCursor(){return this.cursorIndex}guardPointer(s=noe){this.pointerGuard.arm(s)}selectable(s){const i=this.rows[s];return!!i&&(i.kind??"row")==="row"}nearestSelectable(s,i){if(!this.rows.length)return 0;for(let A=0;A<this.rows.length;A++){const a=(s+A*i+this.rows.length*2)%this.rows.length;if(this.selectable(a))return a}return s}move(s){var A,a;if(!this.rows.some((r,O)=>this.selectable(O)))return!1;const i=this.nearestSelectable(this.cursorIndex+s,s);return i===this.cursorIndex?!1:(this.cursorIndex=i,this.render(),(a=(A=this.opts).onSelect)==null||a.call(A,i),!0)}setCursor(s){return!this.selectable(s)||s===this.cursorIndex?!1:(this.cursorIndex=s,this.render(),!0)}heightOf(s){return(s.kind??"row")==="row"?this.opts.rowHeight:s.kind==="header"?this.opts.headerHeight:this.opts.rowHeight/2}visibleCountFrom(s){let i=0,A=0;for(let a=s;a<this.rows.length&&(i+=this.heightOf(this.rows[a]),!(i>this.listHeight));a++)A++;return Math.max(1,A)}scrollBy(s){const i=this.maxScrollTop(),A=Math.max(0,Math.min(i,this.scrollTop+s));A!==this.scrollTop&&(this.scrollTop=A,this.render(!1))}maxScrollTop(){let s=0;for(let i=this.rows.length-1;i>=0;i--)if(s+=this.heightOf(this.rows[i]),s>this.listHeight)return i+1;return 0}render(s=!0){var O;for(const I of this.rowObjects)I.destroy();if(this.rowObjects.length=0,s){for(this.cursorIndex<this.scrollTop&&(this.scrollTop=this.cursorIndex);this.cursorIndex>=this.scrollTop+this.visibleCountFrom(this.scrollTop)&&this.scrollTop<this.rows.length-1;)this.scrollTop++;for(;this.scrollTop>0&&((O=this.rows[this.scrollTop-1])==null?void 0:O.kind)==="header"&&this.cursorIndex<this.scrollTop+this.visibleCountFrom(this.scrollTop-1);)this.scrollTop--}const i=this.visibleCountFrom(this.scrollTop),A=this.rows.length>i,a=this.listWidth-(A?7:3);this.scrollBar.setVisible(A),A&&(this.scrollBar.setTotalRows(Math.max(this.rows.length,i+1)),this.scrollBar.setScrollCursor(this.scrollTop));let r=0;this.cursorObj.setVisible(!1);for(let I=this.scrollTop;I<this.scrollTop+i&&I<this.rows.length;I++){const S=this.rows[I],T=S.kind??"row",L=this.heightOf(S);if(T==="header"){const h=_s(2,r+1,S.label,F.SUMMARY_GOLD,this.opts.headerFontSize);Ti(h,S.label,a-2),this.add(h),this.rowObjects.push(h)}else if(T==="row"){const h=I===this.cursorIndex,C=S.enabled===!1?F.SUMMARY_GRAY:h?F.SUMMARY_GOLD:F.WINDOW,d=S.state?_s(a,r+L/2,S.state,S.enabled===!1?F.SUMMARY_GRAY:S.stateStyle??F.WINDOW,this.opts.stateFontSize).setOrigin(1,.5):null,U=d?Math.min(d.displayWidth,(a-9)*.55):0;d&&(Ti(d,S.state??"",U),this.add(d),this.rowObjects.push(d));let D=9;if(S.icon&&E.textures.exists(S.icon.key)){const _=E.add.sprite(D+6,r+L/2,S.icon.key,S.icon.frame).setScale(S.icon.scale??.4);S.enabled===!1&&_.setAlpha(.5),this.add(_),this.rowObjects.push(_),D+=14}const f=_s(D,r+L/2,S.label,C,this.opts.fontSize).setOrigin(0,.5);Ti(f,S.label,a-D-U-(d?2:0));const P=E.add.zone(0,r,a,L).setOrigin(0,0).setInteractive({useHandCursor:!0});P.on("pointerdown",()=>this.onRowPointer(I)),this.bindWheel(P),this.add([f,P]),this.rowObjects.push(f,P),h&&(this.cursorObj.setPosition(1.5,r+L/2).setVisible(!0),this.bringToTop(this.cursorObj))}r+=L}}onRowPointer(s){var i,A,a,r;if(!(!this.visible||!this.pointerGuard.pass()||!this.selectable(s))){if(s!==this.cursorIndex){this.cursorIndex=s,this.render(!1),(A=(i=this.opts).onSelect)==null||A.call(i,s);return}(r=(a=this.opts).onConfirm)==null||r.call(a,s)}}}

const EryouButton =class y2 extends Phaser.GameObjects.Container{constructor(s,i,A,a,r,O,I=Je.small){super(E,s,i),this.frame=Mn(0,0,A,a),this.label=_s(A/2,a/2,r,F.WINDOW,I).setOrigin(.5,.5),Ti(this.label,r,A-6),this.focusFrame=Dhe(1,1,A-2,a-2).setVisible(!1),this.hit=E.add.zone(0,0,A,a).setOrigin(0,0).setInteractive({useHandCursor:!0}),this.hit.on("pointerdown",O),this.add([this.frame,this.label,this.focusFrame,this.hit])}setFocus(s){return this.focusFrame.setVisible(s),this}setEnabled(s){return this.label.setAlpha(s?1:.45),this}}

class EryouSubScreenHandler extends Yi{constructor(s){super(s),this.message="",this.rootId=0,this.cursor=0,this.closing=!1,this.currentRows=[],this.swipeStartX=0,this.swipeStartY=0}keyHint(){return"↑↓ 选择　Z / 回车 确认　X / Esc 返回"}species(){var s;try{const A=((s=E.gameData.getEryouData().pokemon[this.rootId])==null?void 0:s.selectedForm)??this.rootId;return Ze(A)??Ze(this.rootId)}catch{return Ze(this.rootId)}}setup(){this.container=E.add.container(0,0),this.container.setName(`eryou-screen-${this.mode!==null?this.mode:"?"}`),this.container.setVisible(!1),E.uiContainer.add(this.container);const s=E.add.rectangle(0,0,hs,xs,0,1).setOrigin(0,0);s.setInteractive(new Phaser.Geom.Rectangle(0,0,hs,xs),Phaser.Geom.Rectangle.Contains),this.container.add([s,Mn(0,0,hs,cRe),Mn(0,XN,ET,bM),Mn(ET,XN,hs-ET,bM),Mn(0,hN,hs,xs-hN)]),this.titleText=_s(7,4.5,"",F.WINDOW,Je.title),this.resText=_s(hs-40,6,"",F.MONEY,Je.small).setOrigin(1,0);const i=new wr(hs-36,3,33,16,"返回",()=>{this.isOpen()&&this.close()});this.container.add([this.titleText,this.resText,i]),this.list=new bl(4,XN+4,ET-8,bM-8,{onSelect:l(A=>{this.cursor=A,this.message="",this.onSelectionChanged(),this.getUi().playSelect(),this.render()},"onSelect"),onConfirm:l(A=>{this.isOpen()&&(this.cursor=A,this.confirm())},"onConfirm")}),this.panel=E.add.container(0,0),this.container.add([this.list,this.panel]),this.nodeTitle=_s(7,hN+3.5,"",F.SUMMARY_GOLD,Je.body),this.nodeState=_s(hs-7,hN+4,"",F.WINDOW,Je.small).setOrigin(1,0),this.nodeDesc=_s(7,hN+14,"",F.WINDOW,Je.tiny+2,{wordWrap:{width:(hs-14)*6,useAdvancedWrap:!0},maxLines:3}),this.hintText=_s(hs-7,xs-9.5,"",F.WINDOW,Je.tiny).setOrigin(1,0).setAlpha(.75),this.container.add([this.nodeTitle,this.nodeState,this.nodeDesc,this.hintText]),E.input.on("pointerdown",this.onSwipeStart,this),E.input.on("pointerup",this.onSwipeEnd,this),this.keyGuard=new ZO}show(s){const i=s[0];return!i||typeof i.rootId!="number"?!1:(super.show(s),this.rootId=i.rootId,this.onChanged=i.onChanged,this.onClosed=i.onClosed,this.constellationFactory=i.constellation,this.cursor=Math.max(0,i.startCursor??0),this.message="",this.closing=!1,this.swipePointerId=void 0,this.keyGuard.arm(),this.container.setVisible(!0),E.uiContainer.bringToTop(this.container),this.list.guardPointer(),this.render(),!0)}clear(){super.clear(),this.swipePointerId=void 0,this.container.setVisible(!1),this.panel.removeAll(!0)}onSwipeStart(s){this.swipePointerId=void 0,!(!s.wasTouch||!this.isOpen())&&(this.swipePointerId=s.id,this.swipeStartX=s.x,this.swipeStartY=s.y)}onSwipeEnd(s){const i=this.swipePointerId===s.id;if(this.swipePointerId=void 0,!i||!s.wasTouch||!this.isOpen())return;const A=s.x-this.swipeStartX,a=s.y-this.swipeStartY;A<=-130&&Math.abs(A)>Math.abs(a)*1.5&&this.close()}isOpen(){return this.active&&this.container.visible&&!this.closing&&this.getUi().getMode()===this.mode}rows(){return this.buildRows()}onSelectionChanged(){}previewNature(){const s=E.gameData.getEryouData().pokemon[this.rootId],A=(EN()[this.rootId]??({} as any)).nature??(s==null?void 0:s.nature)??E.gameData.getSpeciesDefaultNature(Ze(this.rootId));return Number.isInteger(A)&&A>=0&&A<25?A:0}heldItemIcon(s){var i;if(s)try{const A=_S(s);return A!==null?rb(A):(i=N0(s,E.getPlayerParty()))==null?void 0:i.iconImage}catch{return}}panelAdd(s){return this.panel.add(s),s}panelText(s,i,A,a=F.WINDOW,r=Je.small,O=$s.width-s){const I=this.panelAdd(_s($s.x+s,$s.y+i,A,a,r));return O>0&&Ti(I,A,O),I}panelParagraph(s,i,A,a=Je.tiny,r=F.WINDOW,O=$s.width-s,I){return this.panelAdd(_s($s.x+s,$s.y+i,A,r,a,{wordWrap:{width:O*6,useAdvancedWrap:!0},...I?{maxLines:I}:{}})).displayHeight}panelSpecies(s,i,A,a=1,r=-1){return this.panelAdd(roe($s.x+s,$s.y+i,A,r,a))}panelBar(s,i,A,a,r="hp"){return this.panelAdd(new gO($s.x+s,$s.y+i,A,r).setRatio(a))}panelPips(s,i,A,a,r=.8,O=8){const I=this.panelAdd(E.add.container($s.x+s,$s.y+i).setScale(r));aoe(I,0,0,A,a,O)}panelTypeBadge(s,i,A,a=.5){const r=IB($s.x+s,$s.y+i,A,a);r&&this.panelAdd(r)}panelItemIcon(s,i,A,a=.5){const r=Eoe($s.x+s,$s.y+i,A,a);return r&&this.panelAdd(r),!!r}panelNeedRow(s,i,A,a,r=$s.width){this.panelText(2,s,i,F.WINDOW,Je.tiny,r*.5);const O=A>=a;return this.panelText(r-2,s,`${A} / ${a}`,O?F.SUMMARY_GREEN:F.SUMMARY_RED,Je.tiny,0).setOrigin(1,0),this.panelBar(2,s+8,r-4,a>0?A/a:1,"need"),s+16}panelStatTable(s,i,A,a=2,r=$s.width-s){const O=r/a;A.forEach((I,S)=>{const T=s+S%a*O,L=i+Math.floor(S/a)*9;this.panelText(T,L,I.label,F.SUMMARY_GRAY,Je.tiny,16);const h=I.after-I.before,C=h===0?`${I.before}`:`${I.before}→${I.after}`;this.panelText(T+15,L,C,F.WINDOW,Je.tiny,O-30),h!==0&&this.panelText(T+O-2,L,`${h>0?"+":""}${h}`,h>0?F.SUMMARY_GREEN:F.SUMMARY_RED,Je.tiny,0).setOrigin(1,0)})}render(){var a;if(!((a=this.container)!=null&&a.visible))return;const s=E.gameData.getEryouData();Ti(this.titleText,`${this.screenTitle()} · ${this.species().name}`,hs-140),Ti(this.resText,`糖 ${s.candy}　金糖 ${s.goldCandy}　PT ${E.gameData.pt}`,104);const i=this.rows();this.currentRows=i,this.cursor>=i.length&&(this.cursor=Math.max(0,i.length-1)),this.list.setRows(i.map(r=>({label:r.label,state:r.state,stateStyle:r.stateStyle,enabled:r.enabled})),this.cursor),this.cursor=this.list.getCursor(),this.panel.removeAll(!0);const A=i[this.cursor];Ti(this.nodeTitle,A?A.label:"",hs*.6),Ti(this.nodeState,(A==null?void 0:A.state)??"",hs*.36),this.nodeDesc.setText(this.message||(A?A.detail:"")),Ti(this.hintText,this.keyHint(),hs-14),this.drawPanel(A,i),this.getUi().getMode()===this.mode&&E.uiContainer.bringToTop(this.container)}confirm(){const s=this.currentRows[this.cursor]??this.rows()[this.cursor];if(!s||s.enabled===!1){this.getUi().playError();return}const i=s.run();this.message=i,this.getUi().playSelect(),this.render()}notifyChanged(s){var i;(i=this.onChanged)==null||i.call(this,s)}refresh(){this.isOpen()&&(this.keyGuard.arm(),this.list.guardPointer(),this.render())}close(){this.closing||(this.closing=!0,this.getUi().revertMode().then(()=>{var i;const s=this.getUi().getHandler();s instanceof A1&&s!==this&&s.refresh(),(i=this.onClosed)==null||i.call(this)}))}processInput(s){if(!this.isOpen()||this.keyGuard.isBlocked(s))return!1;const i=this.getUi(),A=this.currentRows.length?this.currentRows:this.rows();switch(s){case w.UP:case w.DOWN:{if(!A.length)return!1;const a=this.list.move(s===w.UP?-1:1);return a||i.playError(),a}case w.ACTION:case w.SUBMIT:return A.length?(this.confirm(),!0):(i.playError(),!1);case w.CANCEL:return this.close(),!0;default:return!1}}}

const EryouRewardUiHandler =class yV extends Yi{constructor(){super(V.ERYOU_REWARD),this.config=null,this.closed=!1,this.actions=[],this.actionCursor=0}setup(){this.container=E.add.container(0,0),this.container.setName("eryou-reward"),this.container.setVisible(!1),E.uiContainer.add(this.container);const s=E.add.rectangle(0,0,hs,xs,0,.55);s.setOrigin(0,0),s.setInteractive(new Phaser.Geom.Rectangle(0,0,hs,xs),Phaser.Geom.Rectangle.Contains),this.container.add(s),this.frame=Mn((hs-Jo)/2,14,Jo,150),this.container.add(this.frame),this.titleText=_s(hs/2,20,"",F.WINDOW,Je.title).setOrigin(.5,0),this.firstClearText=_s(hs/2,33,"",F.SUMMARY_GOLD,Je.small).setOrigin(.5,0),this.rowsContainer=E.add.container((hs-Jo)/2+12,46),this.actionContainer=E.add.container((hs-Jo)/2+6,0),this.keyGuard=new ZO,this.unlockText=_s(hs/2,0,"",F.SUMMARY_GREEN,Je.small).setOrigin(.5,0),this.hintText=_s(hs/2,0,"←→ 选择　确认执行　取消返回",F.WINDOW,Je.tiny).setOrigin(.5,0).setAlpha(.75),this.container.add([this.titleText,this.firstClearText,this.rowsContainer,this.unlockText,this.actionContainer,this.hintText])}show(s){return s!=null&&s.length?(super.show(s),this.config=s[0],this.closed=!1,this.actionCursor=0,this.keyGuard.arm(),this.renderRewards(),this.container.setVisible(!0),E.uiContainer.bringToTop(this.container),this.getUi().playSelect(),!0):!1}renderRewards(){this.rowsContainer.removeAll(!0);const s=this.config;Ti(this.titleText,s.title,Jo-12),this.firstClearText.setText(s.firstClear?"本周首通奖励！":"");const i=s.firstClear?46:36;this.rowsContainer.setY(i);const A=s.items.length?s.items:[];A.length||this.rowsContainer.add(_s(Jo/2-12,0,"这次没有掉落（重复挑战按概率掉落）",F.WINDOW,Je.small).setOrigin(.5,0)),A.forEach((S,T)=>{var f;const L=T*Bne;let h=0;if(S.kind==="gene"&&((f=E.textures.get("items"))==null?void 0:f.has("dna_splicers")))this.rowsContainer.add(E.add.sprite(6,L+5,"items","dna_splicers").setScale(.4)),h=18;else if(S.iconAtlas&&S.iconFrame)try{const P=S.iconAtlas==="types"?xn("types"):S.iconAtlas,_=E.textures.exists(P)?P:S.iconAtlas,G=E.add.sprite(6,L+5,_,S.iconFrame);G.setScale(S.iconAtlas==="types"?.5:.55),this.rowsContainer.add(G),h=18}catch{h=0}const d=qDe(S),U=_s(h,L,d,F.WINDOW,Je.body);Ti(U,d,Jo-24-h-40);const D=_s(Jo-24,L,`×${S.count}`,F.MONEY,Je.body).setOrigin(1,0);this.rowsContainer.add([U,D])});const a=i+Math.max(1,A.length)*Bne;this.unlockText.setText(s.unlockText??"").setY(a+2);const r=a+(s.unlockText?13:2);this.actionContainer.removeAll(!0),this.actionContainer.setY(r+2);const O=[{label:"返回标题",run:s.onClose},{label:"再次挑战",run:s.onRetry},{label:s.nextLabel??"下一难度",run:s.onNext}];this.actions=O.map((S,T)=>{const L=new wr(T*68,0,66,16,S.label,()=>this.choose(T));return L.setEnabled(!!S.run),this.actionContainer.add(L),{...S,button:L}}),this.highlightAction(),this.hintText.setY(r+22);const I=Math.min(xs-20,r-14+37);this.frame.setSize(Jo,Math.max(60,I))}processInput(s){if(!this.pointerReady()||this.keyGuard.isBlocked(s))return!1;if(s===w.LEFT||s===w.RIGHT||s===w.UP||s===w.DOWN){const i=s===w.LEFT||s===w.UP?-1:1;for(let A=0;A<this.actions.length&&(this.actionCursor=(this.actionCursor+i+this.actions.length)%this.actions.length,!this.actions[this.actionCursor].run);A++);return this.highlightAction(),this.getUi().playSelect(),!0}return s===w.ACTION||s===w.SUBMIT||s===w.CANCEL?(this.choose(s===w.CANCEL?0:this.actionCursor),!0):!1}pointerReady(){return this.active&&this.container.visible}highlightAction(){this.actions.forEach((s,i)=>s.button.setFocus(i===this.actionCursor))}choose(s){var A;if(this.closed||!this.pointerReady())return;const i=(A=this.actions[s])==null?void 0:A.run;if(!i){this.getUi().playError();return}this.closed=!0,this.container.setVisible(!1),E.ui.revertMode(),i()}clear(){super.clear(),this.container.setVisible(!1),this.config=null}}

class EryouProgressionUiHandler extends Yi{constructor(){super(V.ERYOU_PROGRESSION),this.listRows=[],this.detailTexts=[],this.actionRows=[],this.sprite=null,this.roots=[],this.state="list",this.listCursor=0,this.actionCursor=0,this.subCursor=0,this.scrollTop=0,this.message=""}setup(){this.container=E.add.container(0,0),this.container.setName("eryou-progression"),this.container.setVisible(!1),E.uiContainer.add(this.container);const s=E.add.rectangle(0,0,bS,VH,724766,.98);s.setOrigin(0,0),s.setInteractive(new Phaser.Geom.Rectangle(0,0,bS,VH),Phaser.Geom.Rectangle.Contains),this.container.add(s);const i=re(6,4,"养成 · 预选队伍",F.WINDOW,{fontSize:"58px"});this.resText=re(bS-6,4,"",F.MONEY,{fontSize:"48px"}),this.resText.setOrigin(1,0);const A=re(bS-6,16,"返回",F.WINDOW,{fontSize:"48px"});A.setOrigin(1,0),A.setAlpha(.8);const a=E.add.zone(bS-34,14,34,12).setOrigin(0,0);a.setInteractive({useHandCursor:!0}),a.on("pointerdown",()=>{if(this.pointerReady()){if(this.state==="heldItem"||this.state==="evolve"){this.state="list",this.message="",this.refresh();return}this.closeSelf()}}),this.container.add([i,this.resText,A,a]),this.container.add(dt(pI-3,nA-3,106,Cr*mI+6));const r=re(pI+40,nA-12,"▲",F.WINDOW,{fontSize:"44px"}),O=re(pI+40,nA+Cr*mI+4,"▼",F.WINDOW,{fontSize:"44px"}),I=E.add.zone(pI+28,nA-14,40,12).setOrigin(0,0),S=E.add.zone(pI+28,nA+Cr*mI+2,40,12).setOrigin(0,0);I.setInteractive({useHandCursor:!0}),S.setInteractive({useHandCursor:!0}),I.on("pointerdown",()=>{this.pointerReady()&&(this.listCursor=Math.max(0,this.listCursor-Cr),this.refresh())}),S.on("pointerdown",()=>{this.pointerReady()&&(this.listCursor=Math.min(this.roots.length-1,this.listCursor+Cr),this.refresh())}),this.container.add([r,O,I,S]);for(let T=0;T<Cr;T++){const L=re(pI,nA+T*mI,"",F.WINDOW,{fontSize:"44px"});L.setInteractive({useHandCursor:!0}),L.on("pointerdown",()=>{if(!this.pointerReady())return;const h=this.scrollTop+T;h<this.roots.length&&(this.listCursor=h,this.state="list",this.refresh(),this.getUi().playSelect())}),this.listRows.push(L),this.container.add(L)}this.cursorGfx=E.add.graphics(),this.actionCursorGfx=E.add.graphics(),this.container.add([this.cursorGfx,this.actionCursorGfx]),this.container.add(dt(jE-3,nA-3,bS-jE-3,Cr*mI+6)),this.messageText=re(6,VH-14,"",F.WINDOW,{fontSize:"44px"}),this.container.add(this.messageText)}show(s){return this.buildRootList(),this.state="list",this.listCursor=0,this.scrollTop=0,this.message="点选宝可梦查看操作；▲▼ 翻页",this.container.setVisible(!0),this.refresh(),!0}clear(){this.container.setVisible(!1),this.clearDetail()}pointerReady(){return this.active&&this.container.visible}buildRootList(){const s=E.gameData.getEryouData();this.roots=ms.filter(i=>(i==null?void 0:i.speciesId)&&!fs[i.speciesId]).filter(i=>!ph(i)||s.unlockedRestricted.includes(i.getRootSpeciesId())).sort((i,A)=>i.speciesId-A.speciesId)}get selectedRoot(){return this.roots[this.listCursor]??null}rootIdOfSelected(){return this.selectedRoot?this.selectedRoot.getRootSpeciesId():0}selectedFormSpecies(s){var A;if(!s)return null;const i=(A=E.gameData.getEryouData().pokemon[s])==null?void 0:A.selectedForm;return!i||i===s?null:Ze(i)??null}chainRestrictionReason(s){const i=this.selectedRoot;return!s||!i||i.speciesId!==s||E.gameData.getEryouData().unlockedRestricted.includes(s)||!Um(i,this.selectedFormSpecies(s))?null:GO.includes(s)?"解明位未解锁：需解命命座/活动道具":"出战位未解锁：需解命命座/活动道具"}refresh(){const s=E.gameData.getEryouData();this.resText.setText(`糖×${s.candy} 金糖×${s.goldCandy} PT×${E.gameData.pt}`),this.renderList(),this.renderDetail(),this.messageText.setText(this.message)}renderList(){this.listCursor<this.scrollTop&&(this.scrollTop=this.listCursor),this.listCursor>=this.scrollTop+Cr&&(this.scrollTop=this.listCursor-Cr+1);const s=E.gameData.getEryouData();this.cursorGfx.clear();for(let i=0;i<Cr;i++){const A=this.scrollTop+i,a=this.listRows[i];if(A>=this.roots.length){a.setText("");continue}const r=this.roots[A],O=r.getRootSpeciesId(),I=s.pokemon[O],S=xr(s,dl()).indexOf(O),T=GO.includes(O);let L="";S>-1&&(L=T?" [解]":` [战${S+1}]`),a.setText(`${r.name} Lv.${(I==null?void 0:I.level)??1}${L}`),A===this.listCursor&&this.state==="list"&&(this.cursorGfx.fillStyle(4876954,.5),this.cursorGfx.fillRect(pI-3,nA+i*mI-1,106,mI))}}clearDetail(){for(const s of this.detailTexts)s.destroy();this.detailTexts=[];for(const s of this.actionRows)s.destroy();this.actionRows=[],this.actionCursorGfx.clear(),this.sprite&&(this.sprite.destroy(),this.sprite=null)}addDetailText(s,i,A,a=F.WINDOW,r="42px"){const O=re(s,i,A,a,{fontSize:r});return this.detailTexts.push(O),this.container.add(O),O}addActionRow(s,i,A,a=!0){const r=re(jE+56,s,i,F.WINDOW,{fontSize:"42px"});a||r.setAlpha(.45),r.setInteractive({useHandCursor:!0}),r.on("pointerdown",()=>{this.pointerReady()&&a&&A()}),this.actionRows.push(r),this.container.add(r)}currentActions(){const s=E.gameData.getEryouData(),i=this.rootIdOfSelected();if(!i)return[];const A=pr(s,i),a=[],r=wN(A,1);a.push({label:l(()=>`升级+1（糖${r.candyUnits} PT${r.pt}）`,"label"),run:l(()=>this.doLevelUp(1),"run"),enabled:l(()=>r.actualSteps>0,"enabled")});const O=wN(A,10);if(a.push({label:l(()=>`升级+${O.actualSteps||10}（糖${O.candyUnits} PT${O.pt}）`,"label"),run:l(()=>this.doLevelUp(10),"run"),enabled:l(()=>O.actualSteps>0,"enabled")}),Ng(A)){const C=xl(A,i),d=C.materials.map(U=>`${dA[U.rarity]}×${U.count}`).join(" ");a.push({label:l(()=>`突破！（${d} PT${C.pt}）`,"label"),run:l(()=>this.doBreakthrough(),"run"),enabled:l(()=>!0,"enabled")})}MB(A).length>0&&a.push({label:l(()=>"进化…","label"),run:l(()=>this.openEvolvePanel(),"run"),enabled:l(()=>!0,"enabled")}),A.unlockedForms.length>1&&a.push({label:l(()=>`形态切换（当前：${Ze(A.selectedForm).name}）`,"label"),run:l(()=>{const C=A.unlockedForms.indexOf(A.selectedForm);A.selectedForm=A.unlockedForms[(C+1)%A.unlockedForms.length],this.saveAndRefresh(`已选用 ${Ze(A.selectedForm).name} 进本`)},"run"),enabled:l(()=>!0,"enabled")});const S=s.heldItemAssignments[i];a.push({label:l(()=>`持有物：${S?this.heldItemName(S):"（未携带）"}`,"label"),run:l(()=>this.openHeldItemPanel(),"run"),enabled:l(()=>!0,"enabled")});const T=dl(),L=xr(s,T).includes(i),h=!L&&!!this.chainRestrictionReason(i);return a.push({label:l(()=>L?`移出${OE(T)}`:h?`加入${OE(T)}（受限）`:`加入${OE(T)}`,"label"),run:l(()=>this.toggleTeamMember(),"run"),enabled:l(()=>!0,"enabled")}),a.push({label:l(()=>"重置养成（返还全部）","label"),run:l(()=>{Loe(s,i,A),this.saveAndRefresh("已重置，糖/材料/PT 全额返还")},"run"),enabled:l(()=>A.level>1||A.breakthroughs>0,"enabled")}),a}renderDetail(){this.clearDetail();const s=this.selectedRoot;if(!s)return;const i=E.gameData.getEryouData(),A=s.getRootSpeciesId(),a=pr(i,A);try{const I=Ze(a.selectedForm);this.sprite=E.add.sprite(jE+22,nA+34,I.getIconAtlasKey(),I.getIconId(!1)),this.sprite.setScale(1.6),this.container.add(this.sprite)}catch{this.sprite=null}const r=wO(a.breakthroughs);if(this.addDetailText(jE+46,nA+6,`${s.name}`,F.WINDOW,"48px"),this.addDetailText(jE+46,nA+18,`Lv.${a.level} / 上限 ${r}`,F.WINDOW,"42px"),this.addDetailText(jE+46,nA+28,`突破 ${a.breakthroughs}/7`,F.WINDOW,"42px"),this.state==="heldItem"){this.renderHeldItemPanel();return}if(this.state==="evolve"){this.renderEvolvePanel();return}const O=this.currentActions();this.actionCursor=Math.min(this.actionCursor,Math.max(O.length-1,0)),O.forEach((I,S)=>{const T=nA+46+S*10;this.addActionRow(T,I.label(),()=>I.run(),I.enabled())}),this.state==="action"&&O.length&&(this.actionCursorGfx.fillStyle(4876954,.5),this.actionCursorGfx.fillRect(jE+52,nA+44+this.actionCursor*10,140,10))}heldItemName(s){return Xa(s)}heldItemAvailable(s){const i=E.gameData.getEryouData(),A=i.heldItems[s]||0,a=Object.values<any>(i.heldItemAssignments).filter(r=>r===s).length;return A-a}renderHeldItemPanel(){const s=E.gameData.getEryouData(),i=this.rootIdOfSelected();this.addDetailText(jE+46,nA+40,"选择要携带的持有物：",F.WINDOW,"42px");const A=Object.keys(s.heldItems).filter(r=>this.heldItemAvailable(r)>0||s.heldItemAssignments[i]===r);this.subCursor=Math.min(this.subCursor,A.length);const a=A.map(r=>({label:`${this.heldItemName(r)}（可分配 ${this.heldItemAvailable(r)}）${s.heldItemAssignments[i]===r?" ✓":""}`,run:l(()=>{if(this.heldItemAvailable(r)<=0&&s.heldItemAssignments[i]!==r){this.saveAndRefresh("这件持有物已分给其他宝可梦");return}s.heldItemAssignments[i]=r,this.state="list",this.saveAndRefresh(`已携带 ${this.heldItemName(r)}`)},"run")}));a.push({label:"卸下持有物",run:l(()=>{delete s.heldItemAssignments[i],this.state="list",this.saveAndRefresh("已卸下持有物")},"run")}),a.slice(0,8).forEach((r,O)=>{this.addActionRow(nA+52+O*10,r.label,r.run)}),this.state==="heldItem"&&(this.actionCursorGfx.fillStyle(4876954,.5),this.actionCursorGfx.fillRect(jE+52,nA+50+Math.min(this.subCursor,7)*10,140,10))}renderEvolvePanel(){const s=E.gameData.getEryouData(),i=this.rootIdOfSelected(),A=pr(s,i),a=MB(A);this.subCursor=Math.min(this.subCursor,Math.max(a.length-1,0)),this.addDetailText(jE+46,nA+40,"选择进化分支：",F.WINDOW,"42px"),a.forEach((r,O)=>{const I=r.geneCost.map(T=>`${this.typeName(T.type)}基因×${T.count}`).join(" "),S=r.meetsLevel?"":"（等级不足）";this.addActionRow(nA+52+O*12,`${r.evoName}：${I} PT${r.pt}${S}`,()=>this.doEvolve(r),r.meetsLevel)}),this.state==="evolve"&&a.length&&(this.actionCursorGfx.fillStyle(4876954,.5),this.actionCursorGfx.fillRect(jE+52,nA+50+this.subCursor*12,140,10))}typeName(s){return M.t(`pokemonInfo:Type.${R[s]}`)}doLevelUp(s){const i=E.gameData.getEryouData(),A=pr(i,this.rootIdOfSelected()),a=wN(A,s);if(a.actualSteps===0){this.saveAndRefresh("已到当前等级上限，需要先突破");return}if(!Soe(i,a)){this.saveAndRefresh(`资源不足（需糖${a.candyUnits}单位 / PT${a.pt}）`);return}A.level+=a.actualSteps,this.saveAndRefresh(`升到 Lv.${A.level}（整条进化链共享等级）`)}doBreakthrough(){const s=E.gameData.getEryouData(),i=this.rootIdOfSelected(),A=pr(s,i),a=xl(A,i),r=Toe(s,a);if(r){this.saveAndRefresh(r);return}A.breakthroughs++,this.saveAndRefresh(`突破成功！等级上限提升到 ${wO(A.breakthroughs)}`)}doEvolve(s){const i=E.gameData.getEryouData(),A=this.rootIdOfSelected();pr(i,A);const a=Noe(i,s);if(a){this.saveAndRefresh(a);return}E.gameData.saveSystem(),this.container.setVisible(!1),E.ui.revertMode(),E.pushPhase(new _D(A,s))}toggleTeamMember(){const s=E.gameData.getEryouData(),i=this.rootIdOfSelected(),A=dl(),a=xr(s,A),r=a.indexOf(i);if(r>-1){a.splice(r,1),this.saveAndRefresh(`已移出${OE(A)}`);return}const O=GO.includes(i),I=this.chainRestrictionReason(i);if(I){this.saveAndRefresh(I);return}const S=a.filter(L=>GO.includes(L)).length,T=a.length-S;if(O){if(S>=1){this.saveAndRefresh("解明位已有宝可梦（最多 1 只）");return}}else if(T>=efe){this.saveAndRefresh("出战位已满（最多 4 只）");return}if(a.length>=tfe){this.saveAndRefresh("预选队伍已满");return}O?a.push(i):a.splice(T,0,i),this.saveAndRefresh(O?`已加入${OE(A)}（解明位）`:`已加入${OE(A)}（出战 ${T+1}/4）`)}openHeldItemPanel(){this.state="heldItem",this.subCursor=0,this.message="点选持有物（一件只能给一只宝可梦）；点「返回」回主面板",this.refresh()}openEvolvePanel(){this.state="evolve",this.subCursor=0,this.message="点选进化分支；点「返回」回主面板",this.refresh()}saveAndRefresh(s){E.gameData.saveSystem(),this.message=s,this.refresh()}closeSelf(){this.container.setVisible(!1),E.ui.revertMode()}processInput(s){switch(E.gameData.getEryouData(),this.state){case"list":if(s===w.UP)return this.listCursor=(this.listCursor-1+this.roots.length)%this.roots.length,this.refresh(),!0;if(s===w.DOWN)return this.listCursor=(this.listCursor+1)%this.roots.length,this.refresh(),!0;if(s===w.LEFT)return this.listCursor=Math.max(0,this.listCursor-Cr),this.refresh(),!0;if(s===w.RIGHT)return this.state="action",this.actionCursor=0,this.refresh(),!0;if(s===w.ACTION||s===w.SUBMIT)return this.state="action",this.actionCursor=0,this.refresh(),!0;break;case"action":{const i=this.currentActions();if(s===w.UP)return this.actionCursor=(this.actionCursor-1+i.length)%i.length,this.refresh(),!0;if(s===w.DOWN)return this.actionCursor=(this.actionCursor+1)%i.length,this.refresh(),!0;if(s===w.LEFT)return this.state="list",this.refresh(),!0;if(s===w.ACTION||s===w.SUBMIT){const A=i[this.actionCursor];return A&&A.enabled()&&A.run(),!0}break}case"heldItem":case"evolve":if(s===w.CANCEL)return this.state="list",this.message="",this.refresh(),!0;break}return s===w.CANCEL?(this.closeSelf(),!0):!1}}

const EryouLevelUpUiHandler =class wV extends $l{constructor(){super(V.ERYOU_LEVELUP),this.resetArmed=!1,this.rowKinds=[]}screenTitle(){return"养成 · 升级与突破"}onSelectionChanged(){this.resetArmed=!1}apply(s){return s.ok?(E.gameData.saveSystem(),this.notifyChanged(s.message)):this.getUi().playError(),s.message}buildRows(){const s=E.gameData.getEryouData(),i=this.rootId,A=KA(s,i),a=AL(A),r=[],O=[];for(const S of[1,10]){const T=DB(s,i,S),L=KU(s)>=T.candyUnits&&E.gameData.pt>=T.pt;r.push({label:T.actualSteps>0&&T.actualSteps<S?`升级 +${T.actualSteps}（到上限）`:`升级 +${S}`,state:T.actualSteps===0?"已到上限":`糖${T.candyUnits} PT${T.pt}`,stateStyle:T.actualSteps>0&&!L?F.SUMMARY_RED:F.WINDOW,detail:T.actualSteps===0?`已经顶到当前等级上限 Lv.${a}，先突破才能继续升级。`:`升 ${T.actualSteps} 级：糖 ${T.candyUnits} 单位 + PT ${T.pt}。普通糖不够时自动用黄金糖（1 颗 = ${RU} 单位）找零。整条进化链共享等级。`,enabled:T.actualSteps>0,run:l(()=>this.apply(foe(s,i,S)),"run")}),O.push({kind:"level",steps:S})}fB(s,i)?r.push({label:"突破",state:this.requirementSummary(s,i),stateStyle:F.SUMMARY_GOLD,detail:`花掉材料 + PT，等级上限 ${a} → ${wO(A.breakthroughs+1)}（当前已突破 ${A.breakthroughs}/7）。
需要：${Qse(s,i)}`,run:l(()=>this.apply(Poe(s,i)),"run")}):A.breakthroughs>=fo.length?r.push({label:"突破（已满）",state:`7/7 · Lv.${a} 封顶`,detail:`已经突破到上限（${fo.length} 次，Lv.${a}）。该宝可梦的等级与突破都练满了。`,enabled:!1,run:l(()=>"","run")}):r.push({label:"突破",state:`需 Lv.${a}`,detail:`等级练到当前上限 Lv.${a} 并备齐材料后才能突破。
下一档需要：${Qse(s,i)}`,enabled:!1,run:l(()=>"","run")}),O.push({kind:"breakthrough"}),r.push({label:"一键升级 / 突破",state:A.level>=qT?"已满级":"资源用尽即停",detail:"连续升级，到当前上限时自动突破，再继续升级；按正常规则消耗糖果、突破材料与 PT。达到 Lv.100 或资源不足时停止，保留已完成的养成并显示停止原因。",enabled:A.level<qT,run:l(()=>this.apply(_Ce(s,i)),"run")}),O.push({kind:"all"});const I=OU(BA,A.level);return r.push({label:this.resetArmed?"重置养成（再按一次）":"重置养成",state:this.resetArmed?"确认重置":"全额返还",stateStyle:this.resetArmed?F.SUMMARY_RED:F.WINDOW,detail:`等级回到 Lv.${BA}、突破清零、形态还原为初始形态；返还升级花费 糖 ${I.candyUnits} 单位 + PT ${I.pt}，已花的突破材料、进化基因及对应 PT 也全额返还。`,enabled:A.level>BA||A.breakthroughs>0||A.unlockedForms.length>1,run:l(()=>this.resetArmed?(this.resetArmed=!1,this.apply(gCe(s,i))):(this.resetArmed=!0,"再按一次确认，重置这只宝可梦的养成（全额返还）。"),"run")}),O.push({kind:"reset"}),this.rowKinds=O,r}requirementSummary(s,i){const A=xl(KA(s,i),i);return`${A.materials.map(r=>`${dA[r.rarity]}${Vr(r.type)}×${r.count}`).join(" ")}${A.pt?` + PT${A.pt}`:""}`}drawPanel(){const s=E.gameData.getEryouData(),i=KA(s,this.rootId),A=AL(i),a=this.species(),r=this.rowKinds[this.cursor]??{kind:"level",steps:1};if(this.panelSpecies(12,9,a,.75),this.panelText(26,1,a.name,F.WINDOW,Je.small,80),r.kind==="all"){this.panelText(26,10,`Lv.${i.level} → 最多 Lv.100`,F.MONEY,Je.small,140),this.panelPips(2,27,7,i.breakthroughs,.8,8.5),this.panelParagraph(2,40,`当前突破 ${i.breakthroughs}/7
自动升级 → 突破 → 继续升级
按正常费用扣款，资源不足即停止。
普通糖不足时使用黄金糖并找零。`,Je.tiny);return}if(r.kind==="level"){const I=DB(s,this.rootId,r.steps??1),S=i.level+I.actualSteps;this.panelText(26,10,I.actualSteps?`Lv.${i.level} → Lv.${S}`:`Lv.${i.level}（已到上限）`,F.MONEY,Je.small,90),this.panelText($s.width-2,2,`上限 ${A}`,F.WINDOW,Je.tiny,0).setOrigin(1,0),this.panelBar(118,12,$s.width-120,S/A,"exp");const T=this.previewNature(),L=yne(a.speciesId,i.level,T,this.rootId,E.gameData.ptSoudacheData),h=yne(a.speciesId,S,T,this.rootId,E.gameData.ptSoudacheData);this.panelText(2,22,`基础面板（个体 15 · ${za(T)}）`,F.SUMMARY_GOLD,Je.tiny),this.panelStatTable(2,31,uRe.map((d,U)=>({label:d,before:L[U],after:h[U]})),2);let C=60;C=this.panelNeedRow(C,"糖果（单位，含黄金糖）",KU(s),I.candyUnits),this.panelNeedRow(C,"PT",E.gameData.pt,I.pt);return}if(r.kind==="breakthrough"){const I=i.breakthroughs>=fo.length;if(this.panelText(26,10,I?`上限 Lv.${A}（已满）`:`上限 ${A} → ${wO(i.breakthroughs+1)}`,F.MONEY,Je.small,90),this.panelPips(120,11,7,i.breakthroughs,.8,8.5),I){this.panelParagraph(2,24,"七次突破全部完成，等级上限 Lv.100。",Je.small);return}const S=xl(i,this.rootId);let T=23;i.level<A&&(this.panelText(2,T,`先把等级练到 Lv.${A}（现在 Lv.${i.level}）`,F.SUMMARY_RED,Je.tiny),T+=10);for(const L of S.materials){const h=s.breakthroughMaterials[kE(L.type,L.rarity)]||0;T=this.panelNeedRow(T,`${Vr(L.type)}突破材料·${dA[L.rarity]}`,h,L.count)}S.pt>0&&this.panelNeedRow(T,"PT",E.gameData.pt,S.pt);return}const O=OU(BA,i.level);this.panelText(26,10,`Lv.${i.level} → Lv.${BA}`,F.MONEY,Je.small,90),this.panelParagraph(2,24,`突破 ${i.breakthroughs} → 0　形态 ${i.unlockedForms.length} → 1
返还升级花费：糖 ${O.candyUnits} 单位、PT ${O.pt}
突破材料、进化基因与对应 PT：按实际花费全额返还`,Je.tiny),this.resetArmed&&this.panelText(2,70,"再按一次确认重置；移动光标即取消。",F.SUMMARY_RED,Je.small)}}

const EryouEvolveUiHandler =class bV extends $l{constructor(){super(V.ERYOU_EVOLVE),this.rowTargets=[]}screenTitle(){return"养成 · 进化与形态"}buildRows(){const s=E.gameData.getEryouData(),i=KA(s,this.rootId),A=[],a=[];for(const O of _oe(s,this.rootId)){const I=O.stage>=2?Hae:gae;A.push({label:`进化为 ${O.evoName}`,state:O.meetsLevel?`PT${O.pt}`:`需 Lv.${I}`,stateStyle:O.meetsLevel?F.SUMMARY_GOLD:F.SUMMARY_GRAY,detail:`需要：${PCe(s,O)}
等级要求 Lv.${I}${O.meetsLevel?"（已满足）":`（现在 Lv.${i.level}）`}${O.wasItemEvolution?"；原为道具进化，基因 +2":""}。进化后形态保留，可继续升级。`,enabled:O.meetsLevel,run:l(()=>this.startEvolution(s,O),"run")}),a.push({kind:"evolve",speciesId:O.evoSpeciesId,formIndex:-1,option:O})}if(i.unlockedForms.length>1)for(const O of i.unlockedForms){const I=Ze(O),S=i.selectedForm===O;A.push({label:`使用形态：${I.name}`,state:S?"使用中":"切换",stateStyle:S?F.SUMMARY_GOLD:F.WINDOW,detail:S?"这只宝可梦正在使用这个形态。等级 / 突破 / 招式都不受形态切换影响。":`把出战形态切换为 ${I.name}：等级、突破、招式都不变，只有外观、属性与种族值换成这个形态。`,enabled:!S,run:l(()=>this.switchForm(i,O,I.name),"run")}),a.push({kind:"switch",speciesId:O,formIndex:-1})}const r=uCe(this.rootId);if(r){const O=Ze(i.selectedForm??this.rootId);for(const I of Moe(O,r.item))A.push({label:`变身形态：${I.name}`,state:"携带后",detail:`这只正携带「${r.name}」。带着它进入副本时，会自动变成 ${I.name}（MEGA / 原始回归 / 石板形态都是这样生效的）。想换别的形态，去「持有物」页换一件道具即可。`,enabled:!1,run:l(()=>"","run")}),a.push({kind:"transform",speciesId:I.speciesId,formIndex:I.formIndex,name:I.name})}return A.length||(A.push({label:"暂时没有可进化的形态",detail:"这条进化链没有后续形态，或已全部解锁。把等级练到 20 / 50 级并解锁前置形态后，这里才会出现进化分支。",enabled:!1,run:l(()=>"","run")}),a.push({kind:"none",speciesId:0,formIndex:-1})),this.rowTargets=a,A}switchForm(s,i,A){return s.selectedForm=i,E.gameData.saveSystem(),this.notifyChanged(`已切换为 ${A}`),`已切换为 ${A}`}startEvolution(s,i){if(this.closing)return"";const A=GCe(s,this.rootId,i);if(!A.ok)return this.getUi().playError(),A.message;const a=KA(s,this.rootId),r=a.selectedForm??this.rootId;a.unlockedForms.includes(i.evoSpeciesId)||a.unlockedForms.push(i.evoSpeciesId),a.selectedForm=i.evoSpeciesId,E.gameData.saveSystem(),this.notifyChanged(A.message),this.closing=!0,this.clearStackedEryouScreens(),E.ui.resetModeChain(),E.ui.setMode(V.MESSAGE);try{E.clearPhaseQueue(),E.pushPhase(new _D(this.rootId,i,r)),E.shiftPhase()}catch(O){console.error("[ERYOU] 进化动画启动失败（进化结果已生效）：",O),this.returnToProgression()}return A.message}clearStackedEryouScreens(){var i;const s=[V.ERYOU_EVOLVE,V.ERYOU_LEVELUP,V.ERYOU_HELD_ITEM,V.ERYOU_SYNTHESIS,V.ERYOU_TRAINING,V.ERYOU_SEARCH,V.STARTER_SELECT];for(const A of s)(i=E.ui.handlers[A])==null||i.clear()}returnToProgression(){this.clearStackedEryouScreens(),E.ui.resetModeChain(),E.ui.setMode(V.STARTER_SELECT,()=>{},{eryou:!0})}drawPanel(s){var L;const i=E.gameData.getEryouData(),A=i.pokemon[this.rootId],a=Ze((A==null?void 0:A.selectedForm)??this.rootId),r=this.rowTargets[this.cursor],O=r&&r.speciesId?Ze(r.speciesId):null;if(!O||r.kind==="none"){this.panelSpecies($s.width/2,24,a,1.2),this.panelText($s.width/2,44,a.name,F.WINDOW,Je.small,0).setOrigin(.5,0),this.panelParagraph(4,58,(s==null?void 0:s.detail)??"",Je.tiny);return}this.panelSpecies(30,18,a,1),this.panelText($s.width/2,12,"→",F.WINDOW,Je.title,0).setOrigin(.5,0),this.panelSpecies($s.width-30,18,O,1,r.kind==="transform"?r.formIndex:-1),this.panelText(30,33,a.name,F.WINDOW,Je.tiny,0).setOrigin(.5,0),this.panelText($s.width-30,33,r.name??O.name,F.SUMMARY_GOLD,Je.tiny,0).setOrigin(.5,0),dI(O.speciesId).forEach((h,C)=>this.panelTypeBadge($s.width-48+C*18,42,h,.5));const I=a.baseStats,S=r.kind==="transform"&&r.formIndex>=0?((L=O.forms[r.formIndex])==null?void 0:L.baseStats)??O.baseStats:O.baseStats,T=l(h=>h.reduce((C,d)=>C+d,0),"total");if(this.panelText(2,51,`种族值 ${T(I)} → ${T(S)}`,F.SUMMARY_GOLD,Je.tiny,90),this.panelStatTable(2,60,uRe.map((h,C)=>({label:h,before:I[C],after:S[C]})),3),r.kind==="evolve"&&r.option){const h=r.option.geneCost,C=$s.width/2-3,d=l(U=>i.evolutionGenes[Bl(h[U].type)]||0,"have");this.panelNeedRowAt(2,80,`${Vr(h[0].type)}进化基因`,d(0),h[0].count,C),h[1]?(this.panelNeedRowAt($s.width/2+1,80,`${Vr(h[1].type)}进化基因`,d(1),h[1].count,C),this.panelNeedRowAt(2,93,"PT",E.gameData.pt,r.option.pt,$s.width-4,!0)):this.panelNeedRowAt($s.width/2+1,80,"PT",E.gameData.pt,r.option.pt,C)}else r.kind==="switch"?this.panelText(2,82,"切换不花费任何资源，等级 / 突破 / 招式保持不变。",F.WINDOW,Je.tiny):r.kind==="transform"&&this.panelText(2,82,"携带变身道具进本自动变身；这里只展示，不会改动存档。",F.WINDOW,Je.tiny)}panelNeedRowAt(s,i,A,a,r,O,I=!1){this.panelText(s,i,A,F.WINDOW,Je.tiny,O*.55),this.panelText(s+O,i,`${a} / ${r}`,a>=r?F.SUMMARY_GREEN:F.SUMMARY_RED,Je.tiny,0).setOrigin(1,0),I||this.panelBar(s,i+8,O,r>0?a/r:1,"need")}}

class EryouHeldItemUiHandler extends $l{constructor(){super(V.ERYOU_HELD_ITEM),this.query="",this.searchInput=null,this.searchFrame=null,this.rowItems=[],this.itemNames=new Map,this.composing=!1}screenTitle(){return"养成 · 持有物"}setup(){var i,A;super.setup(),this.searchFrame=Mn(4,xs-32,312,18).setVisible(!1),this.container.add(this.searchFrame);const s=lw(8,xs-30,1800,84,F.TOOLTIP_CONTENT,{type:"text",maxLength:40,placeholder:"输入名字过滤…（回车结束）",spellCheck:!1,autoComplete:"off"});s.setOrigin(0,0),s.setVisible(!1),(A=(i=s.node)==null?void 0:i.setAttribute)==null||A.call(i,"lang","zh-CN"),this.container.add(s),s.on("textchange",()=>{this.composing||this.updateQuery()}),s.node.addEventListener("compositionstart",()=>{this.composing=!0}),s.node.addEventListener("compositionend",()=>{this.composing=!1,this.updateQuery()}),s.on("keydown",(a,r)=>{(r.key==="Enter"||r.key==="Escape")&&!r.isComposing&&!this.composing&&r.keyCode!==229&&(r.preventDefault(),r.stopPropagation(),this.endSearch())}),this.searchInput=s}show(s){var i,A,a,r,O;return this.query="",this.itemNames.clear(),this.composing=!1,(i=this.searchInput)==null||i.setText(""),(A=this.searchInput)==null||A.setBlur(),(a=this.searchInput)==null||a.setVisible(!1),(r=this.searchFrame)==null||r.setVisible(!1),(O=E.input.keyboard)==null||O.enableGlobalCapture(),super.show(s)}clear(){var s,i,A,a;this.composing=!1,(s=this.searchInput)==null||s.setBlur(),(i=this.searchInput)==null||i.setVisible(!1),(A=this.searchFrame)==null||A.setVisible(!1),(a=E.input.keyboard)==null||a.enableGlobalCapture(),super.clear()}beginSearch(){var i,A;const s=this.searchInput;return s&&((i=E.input.keyboard)==null||i.disableGlobalCapture(),(A=this.searchFrame)==null||A.setVisible(!0),s.setVisible(!0),s.setFocus(),this.render()),""}endSearch(){var s,i,A,a;this.updateQuery(),(s=this.searchInput)==null||s.setBlur(),(i=this.searchInput)==null||i.setVisible(!1),(A=this.searchFrame)==null||A.setVisible(!1),(a=E.input.keyboard)==null||a.enableGlobalCapture(),super.refresh(),this.render()}updateQuery(){var i;const s=((i=this.searchInput)==null?void 0:i.text)??"";s!==this.query&&(this.query=s,this.cursor=0,this.message="",this.render())}itemName(s){let i=this.itemNames.get(s);if(!i){const A=this.markFormItem(s,Xa(s));i={label:A,searchText:Efe(A,s)},this.itemNames.set(s,i)}return i}render(){var i,A,a,r;super.render();const s=!!((i=this.searchInput)!=null&&i.isFocused);(A=this.nodeTitle)==null||A.setVisible(!s),(a=this.nodeState)==null||a.setVisible(!s),(r=this.nodeDesc)==null||r.setVisible(!s)}markFormItem(s,i){return $se(s)?`${ofe}${i}`:i}apply(s){return s.ok?(E.gameData.saveSystem(),this.notifyChanged(s.message)):this.getUi().playError(),s.message}keyHint(){var s;return(s=this.searchInput)!=null&&s.isFocused?"输入名字过滤　回车 / Esc 结束输入":"↑↓ 选择　Z / 回车 携带或卸下　X / Esc 返回"}buildRows(){var S,T,L;const s=E.gameData.getEryouData(),i=this.rootId,A=s.heldItemAssignments[i],a=[],r=[];a.push({label:this.query?`搜索：${this.query}`:"搜索名字…",state:(S=this.searchInput)!=null&&S.isFocused?"输入中":"按 Z 输入",detail:(T=this.searchInput)!=null&&T.isFocused?"直接打字即可过滤列表；回车结束输入（过滤结果保留）。":"持有物多了以后用它按名字过滤；下面那行可以清空关键字。",run:l(()=>this.beginSearch(),"run")}),r.push(null),this.query&&(a.push({label:"清除搜索",state:this.query,detail:"清掉关键字，恢复完整列表。",run:l(()=>{var h;return this.query="",(h=this.searchInput)==null||h.setText(""),this.render(),"已清除搜索"},"run")}),r.push(null));const O=new Map;for(const h of Object.values<any>(s.heldItemAssignments))O.set(h,(O.get(h)??0)+1);const I=Object.keys(s.heldItems).map(h=>{const C=s.heldItems[h]||0,d=O.get(h)??0;return{id:h,available:C-d,assignedHere:A===h}}).filter(h=>h.available>0||h.assignedHere).map(h=>({...h,...this.itemName(h.id)})).filter(h=>rfe(h.searchText,this.query)).sort((h,C)=>h.assignedHere===C.assignedHere?h.label.localeCompare(C.label,"zh-Hans-CN"):h.assignedHere?-1:1);a[0].state=(L=this.searchInput)!=null&&L.isFocused?`输入中 · ${I.length} 项`:`${I.length} 项 · 按 Z 搜索`;for(const h of I){const C=$se(h.id)?`
${Rfe}`:"";a.push({label:h.label,state:h.assignedHere?"携带中":`可分配 ${h.available}`,stateStyle:h.assignedHere?F.SUMMARY_GOLD:F.WINDOW,detail:(h.assignedHere?"这只宝可梦正携带它。再次确认会卸下。":"分配给这只宝可梦；一件持有物同时只能给一只。")+C,run:l(()=>this.apply(Jse(s,i,h.assignedHere?null:h.id)),"run")}),r.push(h.id)}return A&&(a.push({label:"卸下持有物",state:this.markFormItem(A,Xa(A)),detail:"把当前携带的持有物收回库存，可以再分给别的宝可梦。",run:l(()=>this.apply(Jse(s,i,null)),"run")}),r.push(A)),I.length||(a.push({label:this.query?`没有匹配「${this.query}」`:"还没有可分配的持有物",detail:this.query?"换个关键字，或者用上面的「清除搜索」。":"去「持有物本」刷几件回来，这里就能分配了。",enabled:!1,run:l(()=>"","run")}),r.push(null)),this.rowItems=r,a}processInput(s){var i;return(i=this.searchInput)!=null&&i.isFocused?!1:super.processInput(s)}describeItem(s){var i;try{const A=N0(s,E.getPlayerParty());return((i=A==null?void 0:A.getDescription)==null?void 0:i.call(A))??""}catch{return""}}drawPanel(){const s=E.gameData.getEryouData(),i=s.heldItemAssignments[this.rootId],A=this.species();this.panelSpecies(12,9,A,.75),this.panelText(26,1,A.name,F.WINDOW,Je.small,90);const a=this.panelItemIcon(118,0,this.heldItemIcon(i),.5);this.panelText(a?135:118,2,i?"携带中":"未携带",i?F.SUMMARY_GOLD:F.SUMMARY_GRAY,Je.tiny,50),this.panelText(26,10,i?this.markFormItem(i,Xa(i)):"（没有携带持有物）",F.MONEY,Je.tiny,$s.width-28);const r=this.rowItems[this.cursor];if(!r){const L=Object.values<any>(s.heldItems??({} as any)).reduce((h,C)=>h+(Number(C)||0),0);this.panelParagraph(2,26,`二游库存：${Object.keys(s.heldItems??({} as any)).length} 种、共 ${L} 件。
持有物来自「持有物本」，变身道具（MEGA 石 / 石板等）也在其中。`,Je.tiny);return}const O=this.panelItemIcon(2,24,this.heldItemIcon(r),.75);this.panelText(O?28:2,27,this.markFormItem(r,Xa(r)),F.SUMMARY_GOLD,Je.small,$s.width-30);const I=s.heldItems[r]||0,S=Object.entries(s.heldItemAssignments??({} as any)).filter(([,L])=>L===r).map(([L])=>{var h;return Ze(((h=s.pokemon[Number(L)])==null?void 0:h.selectedForm)??Number(L)).name});this.panelText(2,46,`库存 ${I} 件 · 已分配 ${S.length} · 可分配 ${Math.max(0,I-S.length)}`,F.WINDOW,Je.tiny),this.panelBar(2,55,$s.width-4,I>0?(I-S.length)/I:0,"hp"),S.length&&this.panelText(2,62,`持有者：${S.join("、")}`,F.WINDOW,Je.tiny);const T=this.describeItem(r);T&&this.panelParagraph(2,S.length?72:63,T,Je.tiny,F.WINDOW,$s.width-4,S.length?3:4)}}

const EryouSynthesisUiHandler =class VV extends $l{constructor(){super(V.ERYOU_SYNTHESIS),this.rowInfo=[]}screenTitle(){return"养成 · 材料合成"}apply(s){return s.ok?(E.gameData.saveSystem(),this.notifyChanged(s.message)):this.getUi().playError(),s.message}stock(s,i){return dA.map((A,a)=>s.breakthroughMaterials[kE(i,a)]||0)}buildRows(){const s=E.gameData.getEryouData(),i=this.rootId,A=[],a=[];for(const r of dI(i)){const O=Vr(r),I=goe(s,i).filter(T=>T.type===r),S=I.some(T=>T.have>=KE);A.push({label:`一键合成 · ${O}`,state:S?"白→金":"材料不足",stateStyle:S?F.SUMMARY_GOLD:F.WINDOW,detail:`把${O}材料从最低档一路合到合不动（白→蓝→紫→金，每级 ${KE} 换 1）。合成有损（${KE} 个才换 1 个），只用来回收溢出的低级材料。`,enabled:S,run:l(()=>this.apply(jse(s,r)),"run")}),a.push({type:r});for(const T of I){const L=dA[T.from],h=dA[T.to],C=Math.floor(T.have/T.cost);A.push({label:`${O}：${L} → ${h}`,state:C>0?`可合成 ×${C}`:`${T.have}/${T.cost}`,stateStyle:C>0?F.SUMMARY_GOLD:F.WINDOW,detail:`消耗 ${L}色×${T.cost}，换成 ${h}色×1（单向不可逆，换不回来）。现有：${L}×${T.have}　${h}×${T.haveTarget}`,enabled:T.canSynthesize,run:l(()=>this.apply(HCe(s,T.type,T.from)),"run")}),a.push({type:r,option:T})}}return A.length||(A.push({label:"没有可合成的材料属性",detail:"材料合成按属性划分，只有自己属性的材料能用于突破。",enabled:!1,run:l(()=>"","run")}),a.push({type:0})),this.rowInfo=a,A}drawPanel(){const s=E.gameData.getEryouData(),i=this.rowInfo[this.cursor];if(!i)return;const A=i.type,a=this.stock(s,A);let r=a.slice();if(i.option)i.option.canSynthesize&&(r[i.option.from]-=i.option.cost,r[i.option.to]+=1);else{const L={...s,breakthroughMaterials:{...s.breakthroughMaterials}};jse(L,A),r=this.stock(L,A)}this.panelTypeBadge(2,1,A,.5),this.panelText(20,0,`${Vr(A)} · 突破材料库存`,F.SUMMARY_GOLD,Je.small,$s.width-22);const O=r.some((L,h)=>L!==a[h]);dA.forEach((L,h)=>{const C=12+h*11;this.panelText(2,C,`${L}色`,F.WINDOW,Je.small,22);const d=r[h]-a[h];this.panelText(26,C,O&&d!==0?`${a[h]} → ${r[h]}`:`${a[h]}`,F.WINDOW,Je.small,70),d!==0&&this.panelText(100,C,`${d>0?"+":""}${d}`,d>0?F.SUMMARY_GREEN:F.SUMMARY_RED,Je.small,30)}),this.panelText(2,57,`合成比例 ${KE} → 1（单向）`,F.SUMMARY_GRAY,Je.tiny);const I=KA(s,this.rootId),S=xl(I,this.rootId).materials.filter(L=>L.type===A);if(!S.length){this.panelText(2,70,"下一次突破不需要这个属性的材料。",F.WINDOW,Je.tiny);return}this.panelText(2,68,`下一次突破（第 ${I.breakthroughs+1} 次）需要：`,F.WINDOW,Je.tiny);let T=77;for(const L of S.slice(0,2))T=this.panelNeedRow(T,`${dA[L.rarity]}色${Vr(A)}材料（合成后）`,r[L.rarity],L.count)}}

const EryouGuideUiHandler =class kV extends Yi{constructor(){super(V.ERYOU_GUIDE),this.page=0,this.swipeStartX=0,this.swipeStartY=0,this.closing=!1}setup(){this.container=E.add.container(0,0),this.container.setName("eryou-guide"),this.container.setVisible(!1),E.uiContainer.add(this.container);const s=E.add.rectangle(0,0,hs,xs,0,1).setOrigin(0,0);s.setInteractive(new Phaser.Geom.Rectangle(0,0,hs,xs),Phaser.Geom.Rectangle.Contains),this.container.add([s,Mn(0,0,hs,jo),Mn(0,jo,zo,xs-jo),Mn(zo,jo,hs-zo,xs-jo)]),this.container.add(_s(7,4.5,Ofe,F.WINDOW,Je.title)),this.pageText=_s(hs-40,6,"",F.WINDOW,Je.small).setOrigin(1,0);const i=new wr(hs-36,3,33,16,"返回",()=>{this.isOpen()&&this.close()});this.container.add([this.pageText,i]),this.index=new bl(4,jo+4,zo-8,xs-jo-8,{fontSize:Je.tiny+4,rowHeight:10,onSelect:l(a=>{this.page=a,this.getUi().playSelect(),this.renderPage()},"onSelect"),onConfirm:l(()=>this.turn(1),"onConfirm")}),this.index.setRows(bI.map(a=>({label:a.title}))),this.container.add(this.index),this.pageTitleText=_s(zo+7,jo+4,"",F.SUMMARY_GOLD,Je.body),this.bodyText=_s(zo+7,jo+17,"",F.WINDOW,Je.tiny,{lineSpacing:10,wordWrap:{width:(hs-zo-14)*6,useAdvancedWrap:!0}});const A=_s(zo+7,xs-11,"↑↓ 选章节　←→ 翻页　X / Esc 或从右向左滑动：返回",F.WINDOW,Je.tiny-4).setAlpha(.7);Ti(A,A.text,hs-zo-14),this.container.add([this.pageTitleText,this.bodyText,A]),E.input.on("pointerdown",this.onPointerDown,this),E.input.on("pointerup",this.onPointerUp,this),this.keyGuard=new ZO}isOpen(){return this.active&&this.container.visible&&!this.closing&&this.getUi().getMode()===V.ERYOU_GUIDE}onPointerDown(s){this.swipePointerId=void 0,!(!s.wasTouch||!this.isOpen())&&(this.swipePointerId=s.id,this.swipeStartX=s.x,this.swipeStartY=s.y)}onPointerUp(s){const i=this.swipePointerId===s.id;if(this.swipePointerId=void 0,!i||!s.wasTouch||!this.isOpen())return;const A=s.x-this.swipeStartX,a=s.y-this.swipeStartY;if(A<=-Fne&&Math.abs(A)>Math.abs(a)){this.close();return}Math.abs(a)>=Fne&&Math.abs(a)>Math.abs(A)&&this.turn(a<0?1:-1)}turn(s){const i=bI.length,A=Math.min(Math.max(this.page+s,0),i-1);if(A===this.page){this.getUi().playError();return}this.page=A,this.index.setCursor(A),this.getUi().playSelect(),this.renderPage()}renderPage(){const s=bI[this.page];s&&(this.pageTitleText.setText(kH(s.title)),this.bodyText.setText(s.lines.map(kH).join(`
`)),this.pageText.setText(`第 ${this.page+1} / ${bI.length} 页`))}show(s){return super.show(s),this.page=0,this.closing=!1,this.swipePointerId=void 0,this.keyGuard.arm(),this.index.setRows(bI.map(i=>({label:kH(i.title)})),0),this.index.guardPointer(),this.container.setVisible(!0),E.uiContainer.bringToTop(this.container),this.renderPage(),!0}clear(){var s;super.clear(),(s=this.container)==null||s.setVisible(!1)}close(){this.closing||(this.closing=!0,this.getUi().revertMode().then(()=>{var i;const s=this.getUi().getHandler();(i=s.refresh)==null||i.call(s)}))}processInput(s){if(!this.isOpen()||this.keyGuard.isBlocked(s))return!1;switch(s){case w.UP:case w.DOWN:return this.index.move(s===w.UP?-1:1)?!0:(this.getUi().playError(),!1);case w.LEFT:return this.turn(-1),!0;case w.RIGHT:case w.ACTION:case w.SUBMIT:return this.turn(1),!0;case w.CANCEL:return this.close(),!0;default:return!1}}}

const EryouTrainingUiHandler =class ZV extends $l{constructor(){super(V.ERYOU_TRAINING),this.opening=!1}screenTitle(){return"养成"}openPage(s,i=0){return this.opening||(this.opening=!0,this.getUi().setOverlayMode(s,{rootId:this.rootId,startCursor:i,onChanged:l(A=>this.notifyChanged(A),"onChanged")}).finally(()=>{this.opening=!1})),""}openConstellation(){if(this.opening||!this.constellationFactory)return"";const s=this.constellationFactory(()=>{this.notifyChanged("命之座已更新"),this.refresh()});return s?(this.opening=!0,this.getUi().setOverlayMode(V.PT_CONSTELLATION,s).finally(()=>{this.opening=!1}),""):(this.getUi().playError(),"命座数据还没准备好，请稍后再试。")}constellationLevel(){var i,A;const s=((A=(i=E.gameData.ptSoudacheData)==null?void 0:i.constellations)==null?void 0:A[this.rootId])??0;return Math.max(0,Math.min(gN,Math.floor(s)))}buildRows(){var C;const s=E.gameData.getEryouData(),i=KA(s,this.rootId),A=AL(i),a=DB(s,this.rootId,1),r=a.actualSteps>0&&KU(s)>=a.candyUnits&&E.gameData.pt>=a.pt,O=_oe(s,this.rootId),I=O.filter(d=>d.meetsLevel).length,S=goe(s,this.rootId).filter(d=>d.canSynthesize).length,T=s.heldItemAssignments[this.rootId],L=fB(s,this.rootId)?"可突破":i.breakthroughs>=fo.length?"已满 7/7":`${i.breakthroughs}/7 · 需 Lv.${A}`,h=[{label:"升级",state:`Lv.${i.level}/${A}`,stateStyle:r?F.SUMMARY_GOLD:F.WINDOW,detail:a.actualSteps===0?"已到当前等级上限，先突破才能继续升级。":`用糖果与 PT 升级，整条进化链共享等级。下一级需要 糖 ${a.candyUnits} 单位 + PT ${a.pt}。`,run:l(()=>this.openPage(V.ERYOU_LEVELUP),"run")},{label:"突破",state:L,stateStyle:fB(s,this.rootId)?F.SUMMARY_GOLD:F.WINDOW,detail:"等级正好顶到上限时，消耗本属性突破材料与 PT，等级上限 +10（共 7 次）。",run:l(()=>this.openPage(V.ERYOU_LEVELUP,2),"run")},{label:"进化与形态",state:O.length?`${O.length} 个分支${I?"":" · 等级不足"}`:i.unlockedForms.length>1?`形态 ${i.unlockedForms.length}`:"无可进化",stateStyle:I?F.SUMMARY_GOLD:F.WINDOW,detail:"花进化基因与 PT 解锁新形态（一段 Lv.20 / 二段 Lv.50），已解锁的形态之间可以自由切换。",run:l(()=>this.openPage(V.ERYOU_EVOLVE),"run")},{label:"合成材料",state:S?`可合成 ${S} 档`:"材料不足",stateStyle:S?F.SUMMARY_GOLD:F.WINDOW,detail:"把溢出的低级突破材料合成上级（5 个同级换 1 个，白→蓝→紫→金，单向不可逆）。",run:l(()=>this.openPage(V.ERYOU_SYNTHESIS),"run")},{label:"持有物",state:T?Xa(T):"未携带",detail:"分配二游库存里的持有物与变身道具；一件同时只能给一只，卸下即放回库存。",run:l(()=>this.openPage(V.ERYOU_HELD_ITEM),"run")}];if(this.constellationFactory){const d=this.constellationLevel();h.push({label:"命之座",state:`${d}/${gN}`,detail:`用觉醒石按顺序点亮专属命座（持有 ${((C=E.gameData.ptSoudacheData)==null?void 0:C.juexingStoneCount)??0} 颗）。${br(this.rootId)?"解明位至少需要 1 命。":""}`,run:l(()=>this.openConstellation(),"run")})}return h}drawPanel(){const s=E.gameData.getEryouData(),i=KA(s,this.rootId),A=AL(i),a=this.species();this.panelSpecies(22,20,a,1.1),dI(a.speciesId).forEach((L,h)=>this.panelTypeBadge(4+h*18,38,L,.5)),this.panelText(44,2,a.name,F.WINDOW,Je.body,$s.width-46);const r=dl(),O=xr(s,r).indexOf(this.rootId),I=OE(r);this.panelText(44,13,O<0?`${I} · 未编入`:br(this.rootId)?`${I} · 解明位`:`${I} · 出战 ${O+1}`,O<0?F.SUMMARY_GRAY:F.SUMMARY_BLUE,Je.tiny),this.panelText(44,24,`Lv.${i.level} / 上限 ${A}`,F.MONEY,Je.small),this.panelText($s.width-2,25,`最高 ${qT}`,F.SUMMARY_GRAY,Je.tiny,0).setOrigin(1,0),this.panelBar(44,34,$s.width-46,i.level/A,"exp"),this.panelText(2,48,`突破 ${i.breakthroughs}/7`,F.WINDOW,Je.small,44),this.panelPips(46,49.5,7,i.breakthroughs,.9,9);const S=s.heldItemAssignments[this.rootId],T=this.panelItemIcon(1,62,this.heldItemIcon(S),.5);if(this.panelText(T?18:2,64,S?`携带：${Xa(S)}`:"携带：无",S?F.WINDOW:F.SUMMARY_GRAY,Je.tiny),this.constellationFactory){const L=this.constellationLevel();this.panelText(2,79,`命座 ${L}/${gN}`,F.WINDOW,Je.small,44),this.panelPips(46,80.5,gN,L,.9,9)}this.panelParagraph(2,92,`已解锁形态 ${i.unlockedForms.length} 个`,Je.tiny,F.SUMMARY_GRAY)}}

const EryouLobbyUiHandler =class XV extends Yi{constructor(){super(V.ERYOU_LOBBY),this.controller=null,this.page="main",this.dungeonType=Is.EXP,this.materialType=R.NORMAL,this.entries=[],this.message="",this.mainCursor=0,this.busy=!1,this.promptTeam=null,this.promptCursor=0,this.swipeStartX=0,this.swipeStartY=0}setup(){this.container=E.add.container(0,0).setName("eryou-lobby").setVisible(!1),E.uiContainer.add(this.container);const s=E.add.rectangle(0,0,hs,xs,0,1).setOrigin(0,0);s.setInteractive(new Phaser.Geom.Rectangle(0,0,hs,xs),Phaser.Geom.Rectangle.Contains),this.container.add([s,Mn(0,0,hs,uA),Mn(0,uA,GD,xs-uA),Mn(Ba,uA,zE,xs-uA-xS),Mn(Ba,xs-xS,zE,xS)]),this.titleText=_s(7,4.5,"",F.WINDOW,Je.title),this.resourceBox=E.add.container(0,0),this.backButton=new wr(hs-36,3,33,16,"返回",()=>{this.isOpen()&&this.goBack()}),this.hintText=_s(Ba+6,xs-xS+4.5,"",F.WINDOW,Je.tiny),this.detail=E.add.container(0,0),this.promptBox=E.add.container(0,0).setVisible(!1),this.list=new bl(4,uA+5,GD-8,xs-uA-10,{onSelect:l(()=>{this.promptTeam===null&&(this.message="",this.renderDetail(),this.getUi().playSelect())},"onSelect"),onConfirm:l(i=>this.confirm(i),"onConfirm")}),this.container.add([this.titleText,this.resourceBox,this.backButton,this.hintText,this.detail,this.list,this.promptBox]),E.input.on("pointerdown",this.onSwipeStart,this),E.input.on("pointerup",this.onSwipeEnd,this),this.keyGuard=new ZO}show(s){var I;const i=s[0];if(!i)return!1;super.show(s),this.controller=i,this.busy=!1,this.message="",this.swipePointerId=void 0,this.keyGuard.arm();const A=E.gameData.getEryouData();mh(A),aM===null&&(aM=Rie(A,dO()).type??dO()[0]),this.materialType=aM;const a=(I=s[1])==null?void 0:I.focus;this.page="main",this.closeTeamPrompt(),this.buildMain();const r=a?this.entries.findIndex(S=>S.id===a):-1,O=`team${WI(A)}`;return this.mainCursor=r>=0?r:this.entries.findIndex(S=>S.id===O),this.mainCursor<0&&(this.mainCursor=0),this.list.setRows(this.entries,this.mainCursor),this.list.guardPointer(),this.container.setVisible(!0),E.uiContainer.bringToTop(this.container),this.renderAll(),!0}clear(){super.clear(),this.container.setVisible(!1),this.swipePointerId=void 0,this.closeTeamPrompt(),this.detail.removeAll(!0)}isOpen(){return this.active&&this.container.visible&&!this.busy&&this.getUi().getMode()===V.ERYOU_LOBBY}data(){return E.gameData.getEryouData()}stones(){var s;return((s=E.gameData.ptSoudacheData)==null?void 0:s.juexingStoneCount)??0}teamAt(s){const i=xr(this.data(),s);return{battle:i.filter(A=>!br(A)).slice(0,Cl),jieming:i.find(br)??null}}activeTeam(){return this.teamAt(WI(this.data()))}teamIndexOf(s){const i=s==null?void 0:s.id;if(typeof i!="string"||!i.startsWith("team"))return null;const A=Number(i.slice(4));return Number.isInteger(A)&&A>=0&&A<hl?A:null}buildMain(){const s=this.data(),i=Rie(s,dO()),A=VN(s),r=EF(s).reduce((I,S)=>I+S.available,0),O=l(I=>{const S=I===Is.MATERIAL?i.difficulty:SO(s,I);return{id:I,label:lH(I),state:`难度 ${S}/${TE}`}},"dungeonRow");this.entries=[{kind:"header",label:"准备"},...this.teamEntries(s),{id:"guide",label:"玩法说明",state:`${bI.length} 页`},{id:"synthesis",label:"持有物合成",state:`${Oo} 件换 1 件`,stateStyle:r>=Oo?F.SUMMARY_GOLD:void 0},{kind:"header",label:"副本 · 每场 3 波"},...rie.map(O),{kind:"header",label:"挑战"},{id:"abyss",label:"深渊",state:A?`第 ${kN(s)}/${Ma} 层`:"未解锁",enabled:A},{id:"trial",label:"P5X 体验局",state:"经典流程"},{kind:"header",label:"联机 · 同一 Wi-Fi"},{id:"lan",label:"局域网对战",state:"暂未开放"},{kind:"gap",label:""},{id:"back",label:"返回标题"}]}teamEntries(s){const i=WI(s);return Array.from({length:hl},(A,a)=>{const r=xr(s,a).filter(O=>!br(O)).length;return{id:`team${a}`,label:a===i?`${OE(a)} ★`:OE(a),state:`出战 ${r}/${Cl}`,stateStyle:a===i?F.SUMMARY_GOLD:void 0}})}buildDungeon(){const s=this.data(),i=SO(s,this.dungeonType,this.materialType),A=[];for(let a=1;a<=TE;a++){const r=oie(i,a);A.push({label:`难度 ${a}`,state:r==="cleared"?"已通关":r==="open"?"可挑战":"未解锁",stateStyle:r==="open"?F.SUMMARY_GOLD:F.WINDOW,enabled:r!=="locked"})}A.push({kind:"gap",label:""},{id:"back",label:"返回大厅"}),this.entries=A}buildAbyss(){const s=this.data(),i=[];for(let A=1;A<=Ma;A++){const a=lie(s,A);i.push({label:`第 ${A} 层`,state:a.unlocked?a.firstClearClaimed?"本周已首通":`首通 石×${a.firstClearStones}`:"未解锁",stateStyle:a.unlocked&&!a.firstClearClaimed?F.SUMMARY_GOLD:F.WINDOW,enabled:a.unlocked})}i.push({id:"back",label:"返回大厅"}),this.entries=i}difficultyAt(s){let i=0;for(let A=0;A<=s&&A<this.entries.length;A++)(this.entries[A].kind??"row")==="row"&&this.entries[A].id===void 0&&i++;return i}renderAll(){this.renderHeader(),this.renderDetail()}renderHeader(){const s=this.page==="main"?"二游模式 · 大厅":this.page==="abyss"?"二游模式 · 深渊":`二游模式 · ${this.dungeonType===Is.MATERIAL?`${Wne(this.materialType)}·`:""}${lH(this.dungeonType)}`;Ti(this.titleText,s,112),this.resourceBox.removeAll(!0);const i=this.data(),A=`糖 ${i.candy}　金糖 ${i.goldCandy}　PT ${E.gameData.pt}　觉醒石 ${this.stones()}`,a=_s(hs-40,6,A,F.MONEY,Je.small).setOrigin(1,0);Ti(a,A,hs-40-122),this.resourceBox.add(a)}add(s){return this.detail.add(s),s}text(s,i,A,a=F.WINDOW,r=Je.body,O=zE-12){const I=this.add(_s(Ba+s,uA+i,A,a,r));return O>0&&Ti(I,A,O),I}paragraph(s,i,A,a=Je.small,r=F.WINDOW,O=zE-12){return this.add(_s(Ba+s,uA+i,A,r,a,{wordWrap:{width:O*6,useAdvancedWrap:!0}})).displayHeight}renderDetail(){this.detail.removeAll(!0);const s=this.entries[this.list.getCursor()];this.page==="main"?this.renderMainDetail(s):this.page==="dungeon"?this.renderDungeonDetail(s):this.renderAbyssDetail(s),this.message&&(this.add(Mn(Ba+3,xs-xS-19,zE-6,17)).setName("lobby-message"),this.text(8,xs-xS-uA-14.5,this.message,F.SUMMARY_GOLD,Je.small,zE-16))}renderMainDetail(s){const i=this.data(),A=this.teamIndexOf(s);if(A!==null){this.renderTeam(A);return}switch(s==null?void 0:s.id){case"guide":{this.text(6,5,"玩法说明",F.SUMMARY_GOLD,Je.body),bI.forEach((a,r)=>{const O=r<8?0:1;this.text(8+O*100,18+r%8*11.5,a.title,F.WINDOW,Je.small,92)}),this.hint("确认：打开玩法说明（↑↓ / 左右翻页）");return}case"lan":{this.text(6,5,"局域网对战 · 暂未开放",F.SUMMARY_GOLD,Je.body),this.paragraph(6,18,"功能开发中。"),this.text(6,52,"我方出战：",F.WINDOW,Je.tiny),this.text(40,52,OE(WI(i)),F.MONEY,Je.tiny),this.hint("确认：查看说明");return}case"synthesis":{const a=EF(i),r=a.reduce((O,I)=>O+I.available,0);this.text(6,5,"持有物合成 · 5 件回炉换 1 件",F.SUMMARY_GOLD,Je.body),this.text(6,17,`可投入 ${r} 件（库存 − 正被携带）。5 件同球级必定出同球级。`,F.WINDOW,Je.tiny),[...Lo].reverse().forEach((O,I)=>{const S=a.filter(h=>h.level===O),T=S.reduce((h,C)=>h+C.available,0),L=30+I*11;this.text(8,L,LR[O],T>0?F.WINDOW:F.SUMMARY_GRAY,Je.small,62),this.text(76,L,`${T} 件可投入 · ${S.length} 种`,F.MONEY,Je.tiny,110)}),this.paragraph(6,78,`5 件同球级回炉：有概率升一档（普通 50% / 超级 35% / 高级 15%，大师已到顶只能洗牌）；掺 1 件低一档的材料，升级与同级概率各 −${Math.round(db*100)}%，省下的概率会掉一档。`),this.hint("确认：打开合成界面");return}case Is.MATERIAL:{this.text(6,5,"材料本 · 突破材料与进化基因",F.SUMMARY_GOLD,Je.body),this.text(6,17,"每个属性单独解锁难度；下方为各属性已解锁的最高难度。",F.WINDOW,Je.tiny),dO().forEach((r,O)=>{const I=O%3,S=Math.floor(O/3),T=8+I*66,L=30+S*16,h=IB(Ba+T,uA+L,r,.5);h&&this.add(h);const C=SO(i,Is.MATERIAL,r);this.text(T+19,L-.5,`${C}/${TE}`,C>1?F.SUMMARY_GOLD:F.WINDOW,Je.small,40)}),this.hint("确认：进入材料本（←→ 切换属性，↑↓ 选难度）");return}case Is.EXP:case Is.HELD_ITEM:case Is.PT:{const a=s.id,r=SO(i,a);this.text(6,5,`${lH(a)} · 已解锁难度 ${r}/${TE}`,F.SUMMARY_GOLD,Je.body),this.add(new gO(Ba+8,uA+19,zE-16,"exp").setRatio(r/TE)),this.text(6,28,`难度 ${r} 的通关奖励：`,F.WINDOW,Je.small),this.rewardLines(8,40,Iie(a,r)),this.hint("确认：选择难度（↑↓ 选，Z 开始）");return}case"abyss":this.renderAbyssSummary();return;case"trial":this.text(6,5,"P5X 体验局",F.SUMMARY_GOLD,Je.body),this.paragraph(6,18,`开始一局与「新游戏 → P5X 四对六」相同的经典流程（速度制 4 打 6、第 5 位解明）。
二游的养成等级、预选队伍、副本奖励都不参与这一局。`),this.hint("确认：开始 P5X 体验局");return;case"back":this.text(6,5,"返回标题",F.SUMMARY_GOLD,Je.body),this.paragraph(6,18,"回到标题菜单。二游的养成数据都已即时保存。"),this.hint("确认：返回标题");return}}hint(s){Ti(this.hintText,s,zE-12)}rewardLines(s,i,A){return A.forEach((a,r)=>{this.text(s,i+r*11,a.label,F.WINDOW,Je.small,120),this.text(s+124,i+r*11,a.amount,F.MONEY,Je.small,36),a.chance&&this.text(s+160,i+r*11,a.chance,F.SUMMARY_GRAY,Je.tiny,36)}),i+A.length*11}renderTeam(s){const i=this.data(),A=this.teamAt(s),a=s===WI(i);this.text(6,4,`${OE(s)} · 4 出战 + 1 解明${a?" ★ 本局出战":""}`,F.SUMMARY_GOLD,Je.body);const r=[0,1,2,3].map(S=>A.battle[S]??null);r.push(A.jieming),r.forEach((S,T)=>{const h=Ba+4+T*39.5+(T===4?2:0),C=uA+16,d=h+37/2;if(this.add(Mn(h,C,37,58)),this.add(_s(d,C+2.5,T===4?"解明":`出战 ${T+1}`,T===4?F.SUMMARY_BLUE:F.WINDOW,Je.tiny).setOrigin(.5,0)),S===null){this.add(_s(d,C+26,"空",F.SUMMARY_GRAY,Je.body).setOrigin(.5,0));return}const U=i.pokemon[S],D=(U==null?void 0:U.level)??BA,f=(U==null?void 0:U.breakthroughs)??0,P=Ze((U==null?void 0:U.selectedForm)??S);this.add(roe(d,C+21,P,-1,.75));const _=this.add(_s(d,C+32,P.name,F.WINDOW,Je.tiny).setOrigin(.5,0));Ti(_,P.name,33),this.add(_s(d,C+40.5,`Lv.${D}/${wO(f)}`,F.MONEY,Je.tiny).setOrigin(.5,0));const G=E.add.container(h+3,C+50.5).setScale(.62);aoe(G,0,0,7,f,7.4),this.add(G)});const O=Object.entries(i.heldItemAssignments??({} as any)).filter(([S])=>xr(i,s).includes(Number(S))),I=[];A.battle.length?I.push(`队伍已就绪：出战 ${A.battle.length}/${Cl}，${A.jieming?"解明 1/1":"解明位空着（可选）"}。`):I.push("这队还没有出战宝可梦：确认 →「编队」，到选人界面里加入。"),I.push(a?"副本 / 深渊就用这队出战。":"这队还不是本局出战：确认 →「选择」才轮到它下本。"),I.push(O.length?`携带：${O.map(([S,T])=>{var L;return`${Ze(((L=i.pokemon[Number(S)])==null?void 0:L.selectedForm)??Number(S)).name}·${Xa(T)}`}).join("，")}`:"携带：这队里还没有分配持有物。"),this.paragraph(6,78,I.join(`
`),Je.tiny),this.hint("确认：弹出「编队 / 选择」　↑↓ 上下换队伍")}renderAbyssSummary(){const s=this.data();if(this.text(6,5,"深渊 · 每层 10 波",F.SUMMARY_GOLD,Je.body),!VN(s)){const a=Mde(s);this.paragraph(6,18,`解锁条件：任意副本通关难度 ${QS-1}。
当前各副本最高已解锁到难度 ${a}（通关难度 4 后会解锁难度 5）。`),this.add(new gO(Ba+8,uA+44,zE-16,"need").setRatio((a-1)/(QS-1))),this.text(6,52,`进度 ${Math.min(a-1,QS-1)}/${QS-1}`,F.WINDOW,Je.tiny),this.hint("未解锁：先去副本通关难度 4");return}const i=kN(s),A=_de(s);this.text(6,18,`已解锁 第 ${i}/${Ma} 层`,F.WINDOW,Je.small),this.add(new gO(Ba+8,uA+29,zE-16,"exp").setRatio(i/Ma)),this.text(6,35,`本周首通 ${A}/${Ma} 层 · 持有觉醒石 ×${this.stones()}`,F.WINDOW,Je.small),this.add(new gO(Ba+8,uA+46,zE-16,"hp").setRatio(1-A/Ma)),this.paragraph(6,53,`首通奖励每周一 04:00（北京时间）刷新，距离下次刷新还有 ${Tie(Sie())}。
6 层起每周固定阵容 / 强化 / 机制；9~10 层开局公示特殊机制。`,Je.tiny),this.hint("确认：选择层数")}renderDungeonDetail(s){const i=this.data(),A=this.dungeonType,a=SO(i,A,this.materialType);let r=4;if(A===Is.MATERIAL){this.text(6,r,"◀",F.SUMMARY_GOLD,Je.body,0);const T=IB(Ba+15,uA+r+.5,this.materialType,.5);T&&this.add(T),this.text(34,r,"▶",F.SUMMARY_GOLD,Je.body,0);const L=E.add.zone(Ba+3,uA+r-1,12,12).setOrigin(0,0).setInteractive({useHandCursor:!0}),h=E.add.zone(Ba+31,uA+r-1,12,12).setOrigin(0,0).setInteractive({useHandCursor:!0});L.on("pointerdown",()=>this.isOpen()&&this.cycleMaterial(-1)),h.on("pointerdown",()=>this.isOpen()&&this.cycleMaterial(1)),this.add(L),this.add(h);const C=dA.map((d,U)=>`${d}${i.breakthroughMaterials[kE(this.materialType,U)]||0}`).join(" ");this.text(50,r+1,`持有 ${C} 基因${i.evolutionGenes[Bl(this.materialType)]||0}`,F.WINDOW,Je.tiny,zE-56),r+=13}if((s==null?void 0:s.id)==="back"){this.paragraph(6,r+2,"回到大厅。"),this.hint("确认：返回大厅");return}const O=Math.max(1,this.difficultyAt(this.list.getCursor())),I=oie(a,O),S=Dde(O);if(this.text(6,r,`难度 ${O} · ${I==="cleared"?"已通关":I==="open"?"可挑战":"未解锁"}`,I==="locked"?F.SUMMARY_GRAY:F.SUMMARY_GOLD,Je.body),r+=12,this.text(6,r,`敌人：${S.waveCount} 波 × 6 只 · 种族值 ${S.bst[0]}~${S.bst[1]>=9999?"不限":S.bst[1]} · ${S.stages}${S.restricted?" · 会出神兽/幻兽/异兽":""}`,F.WINDOW,Je.tiny),r+=9,S.hpMult!==1&&(this.text(6,r,`敌方 buff：血量 ×${S.hpMult}（面板上限，血条同步 ×${S.hpMult}）`,F.SUMMARY_GOLD,Je.tiny),r+=9),this.text(6,r,S.waves.map(T=>`第${T.index}波 ${fde(T.levels)}`).join("　"),F.WINDOW,Je.tiny),r+=11,this.text(6,r,"通关奖励（每次）：",F.WINDOW,Je.small),r=this.rewardLines(8,r+11,Iie(A,O,A===Is.MATERIAL?Wne(this.materialType):"")),A===Is.EXP)this.text(6,r+1,`持有：糖果 ${i.candy} · 黄金糖果 ${i.goldCandy}`,F.WINDOW,Je.tiny);else if(A===Is.PT)this.text(6,r+1,`持有：PT ${E.gameData.pt}`,F.WINDOW,Je.tiny);else if(A===Is.HELD_ITEM){const T=Object.values<any>(i.heldItems??({} as any)).reduce((L,h)=>L+(Number(h)||0),0);this.text(6,r+1,`持有：持有物 ${T} 件（${Object.keys(i.heldItems??({} as any)).length} 种）`,F.WINDOW,Je.tiny)}I==="locked"?this.hint(`未解锁：先通关难度 ${O-1}`):this.activeTeam().battle.length?this.hint(`确认：开始挑战（选择存档槽后进入）${A===Is.MATERIAL?"　←→ 切换属性":""}`):this.hint("本局出战的那支队还没编人：大厅里确认队伍 →「编队 / 选择」")}renderAbyssDetail(s){if((s==null?void 0:s.id)==="back"){this.paragraph(6,6,"回到大厅。"),this.hint("确认：返回大厅");return}const i=this.data(),A=this.list.getCursor()+1,a=lie(i,A);this.text(6,4,`深渊 第 ${A} 层 · ${a.waveCount} 波 · ${a.unlocked?"已解锁":"未解锁"}`,a.unlocked?F.SUMMARY_GOLD:F.SUMMARY_GRAY,Je.body);const r=[`敌人等级 Lv.${a.levelRange[0]===a.levelRange[1]?a.levelRange[0]:`${a.levelRange[0]}~${a.levelRange[1]}`}${a.minBst?` · 种族值 ≥ ${a.minBst}`:""}`,`强化：${a.buffText}`,`特殊机制：${a.mechanismText}`,`阵容：${a.weeklyFixed?"本周固定（全网同一套，周一 04:00 更换）":"每局随机"}`];let O=16+this.paragraph(6,16,r.join(`
`),Je.tiny)+2;this.text(6,O,`首通奖励：觉醒石 ×${a.firstClearStones}　${a.firstClearClaimed?"本周已领取":"本周可领取"}`,a.firstClearClaimed?F.WINDOW:F.SUMMARY_GOLD,Je.small),O+=11,this.text(6,O,`重复挑战：${a.repeatText}`,F.WINDOW,Je.small),O+=11,this.text(6,O,`首通刷新：${Tie(Sie())}后 · 持有觉醒石 ×${this.stones()}`,F.WINDOW,Je.tiny),a.unlocked?this.activeTeam().battle.length?this.hint("确认：开始挑战（选择存档槽后进入）"):this.hint("本局出战的那支队还没编人：大厅里确认队伍 →「编队 / 选择」"):this.hint(A>1?`未解锁：先通关第 ${A-1} 层`:"未解锁：先通关任意副本难度 4")}openPage(s,i?){this.page=s,this.message="",this.keyGuard.arm(),s==="main"?this.buildMain():s==="dungeon"?this.buildDungeon():this.buildAbyss();let A=i;if(A===void 0)if(s==="dungeon"){const a=SO(this.data(),this.dungeonType,this.materialType);A=this.entries.findIndex(r=>r.label===`难度 ${a}`)}else s==="abyss"?A=kN(this.data())-1:A=this.mainCursor;this.list.setRows(this.entries,Math.max(0,A)),this.list.guardPointer(),this.renderAll()}cycleMaterial(s){const i=dO(),A=i.indexOf(this.materialType);this.materialType=i[(A+s+i.length)%i.length],aM=this.materialType;const a=this.list.getCursor();this.buildDungeon(),this.list.setRows(this.entries,a),this.message="",this.renderAll(),this.getUi().playSelect()}refuse(s){this.message=s,this.getUi().playError(),this.renderDetail()}confirm(s){if(!this.isOpen()||!this.controller)return;const i=this.entries[s];if(!i||(i.kind??"row")!=="row")return;if(i.id==="back"){this.goBack();return}if(this.page==="main"){this.mainCursor=s;const a=this.teamIndexOf(i);if(a!==null){this.openTeamPrompt(a);return}switch(i.id){case"guide":this.getUi().playSelect(),this.list.setDragEnabled(!1),this.controller.openGuide();return;case"trial":this.leave(()=>{var r;return(r=this.controller)==null?void 0:r.startTrial()});return;case"lan":this.leave(()=>{var r;return(r=this.controller)==null?void 0:r.openLanRoom()});return;case"synthesis":this.leave(()=>{var r;return(r=this.controller)==null?void 0:r.openHeldItemSynthesis()});return;case"abyss":if(!VN(this.data())){this.refuse(`深渊未解锁：先通关任意副本难度 ${QS-1}。`);return}this.getUi().playSelect(),mh(this.data()),this.openPage("abyss");return;default:i.id&&rie.includes(i.id)&&(this.getUi().playSelect(),this.dungeonType=i.id,this.openPage("dungeon"));return}}if(i.enabled===!1){this.refuse(this.page==="abyss"?"这一层还没解锁：先通关上一层。":"这个难度还没解锁：先通关上一档难度。");return}if(!this.activeTeam().battle.length){this.refuse("本局出战的那支队里没有出战宝可梦：确认任意队伍 →「编队」去加，再「选择」它下本。");return}if(this.page==="dungeon"){const a=this.difficultyAt(s),r={kind:"dungeon",dungeonType:this.dungeonType,attribute:this.dungeonType===Is.MATERIAL?this.materialType:void 0,level:a};this.leave(()=>{var O;return(O=this.controller)==null?void 0:O.startRun(r)});return}const A=s+1;this.leave(()=>{var a;return(a=this.controller)==null?void 0:a.startRun({kind:"abyss",level:A})})}openTeamPrompt(s){this.promptTeam=s,this.promptCursor=0,this.keyGuard.arm(),this.getUi().playSelect(),this.renderPrompt()}closeTeamPrompt(){var s;this.promptTeam=null,this.promptCursor=0,this.promptBox.removeAll(!0),this.promptBox.setVisible(!1),(s=this.list)==null||s.setDragEnabled(!0)}renderPrompt(){this.promptBox.removeAll(!0);const s=this.promptTeam;if(s===null){this.promptBox.setVisible(!1);return}const i=s===WI(this.data()),A=E.add.rectangle(0,0,hs,xs,0,.55).setOrigin(0,0).setInteractive(new Phaser.Geom.Rectangle(0,0,hs,xs),Phaser.Geom.Rectangle.Contains);A.on("pointerdown",()=>{this.isOpen()&&this.promptTeam!==null&&this.closeTeamPrompt()}),this.promptBox.add(A);const a=150,r=84,O=(hs-a)/2,I=(xs-r)/2-4;this.promptBox.add(Mn(O,I,a,r)),this.promptBox.add(_s(O+a/2,I+3,`${OE(s)}${i?"（★ 本局出战）":""}`,F.SUMMARY_GOLD,Je.body).setOrigin(.5,0));const S=[{label:"编队",hint:"进选人界面编辑这一队"},{label:"选择",hint:"下本（副本 / 深渊）用这一队"}],T=96,L=17,h=O+(a-T)/2,C=I+16,d=L+2;S.forEach((U,D)=>{const f=D===this.promptCursor,P=new wr(h,C+D*d,T,L,U.label,()=>{this.isOpen()&&this.confirmPromptOption(D)});P.setFocus(f),f&&(P.label.setColor(Ns(F.SUMMARY_GOLD,!1,E.uiTheme)),P.label.setShadowColor(Ns(F.SUMMARY_GOLD,!0,E.uiTheme))),this.promptBox.add(P)}),this.promptBox.add(Aoe().setPosition(h-7,C+this.promptCursor*d+L/2)),this.promptBox.add(_s(O+a/2,I+57,S[this.promptCursor].hint,F.WINDOW,Je.tiny).setOrigin(.5,0)),this.promptBox.add(_s(O+a/2,I+68,"Z 确认 · X / 点空白返回",F.SUMMARY_GRAY,Je.tiny).setOrigin(.5,0)),this.promptBox.setVisible(!0),this.container.bringToTop(this.promptBox),this.list.setDragEnabled(!1)}confirmPromptOption(s){const i=this.promptTeam;if(i!==null){if(s===1){MCe(this.data(),i),E.gameData.saveSystem(),this.closeTeamPrompt(),this.message=`已选择${OE(i)}：副本 / 深渊都用它出战`,this.refresh(),this.getUi().playSelect();return}this.closeTeamPrompt(),this.leave(()=>{var A;return(A=this.controller)==null?void 0:A.openTraining(i)})}}processPromptInput(s){switch(s){case w.UP:case w.DOWN:return this.promptCursor=(this.promptCursor+1)%2,this.getUi().playSelect(),this.renderPrompt(),!0;case w.ACTION:case w.SUBMIT:return this.confirmPromptOption(this.promptCursor),!0;case w.CANCEL:return this.closeTeamPrompt(),!0;default:return!0}}leave(s?){this.busy=!0,this.getUi().playSelect(),s()}goBack(){if(this.page!=="main"){const s=this.page==="dungeon"?this.dungeonType:"abyss";this.page="main",this.buildMain();const i=this.entries.findIndex(A=>A.id===s);this.openPage("main",i>=0?i:this.mainCursor),this.getUi().playSelect();return}this.controller&&this.leave(()=>{var s;return(s=this.controller)==null?void 0:s.back()})}refresh(){if(!this.container.visible)return;this.keyGuard.arm(),this.list.setDragEnabled(!0);const s=this.list.getCursor();this.page==="main"?this.buildMain():this.page==="dungeon"?this.buildDungeon():this.buildAbyss(),this.list.setRows(this.entries,s),this.list.guardPointer(),this.renderAll()}onSwipeStart(s){this.swipePointerId=void 0,!(!s.wasTouch||!this.isOpen())&&(this.swipePointerId=s.id,this.swipeStartX=s.x,this.swipeStartY=s.y)}onSwipeEnd(s){const i=this.swipePointerId===s.id;if(this.swipePointerId=void 0,!i||!s.wasTouch||!this.isOpen())return;const A=s.x-this.swipeStartX,a=s.y-this.swipeStartY;A<=-130&&Math.abs(A)>Math.abs(a)*1.5&&this.goBack()}processInput(s){if(!this.isOpen()||this.keyGuard.isBlocked(s))return!1;if(this.promptTeam!==null)return this.processPromptInput(s);switch(s){case w.UP:case w.DOWN:{const i=this.list.move(s===w.UP?-1:1);return i||this.getUi().playError(),i}case w.LEFT:case w.RIGHT:return this.page==="dungeon"&&this.dungeonType===Is.MATERIAL?(this.cycleMaterial(s===w.LEFT?-1:1),!0):!1;case w.ACTION:case w.SUBMIT:return this.confirm(this.list.getCursor()),!0;case w.CANCEL:return this.goBack(),!0;default:return!1}}}

class EryouHeldSynthesisUiHandler extends Yi{constructor(){super(V.ERYOU_HELD_SYNTHESIS),this.message="",this.closing=!1,this.onBack=null,this.pointerGuard=new mU,this.slots=[],this.rows=[],this.entries=[],this.entriesLoaded=!1,this.swipeStartX=0,this.swipeStartY=0}setup(){this.container=E.add.container(0,0).setName("eryou-held-synthesis").setVisible(!1),E.uiContainer.add(this.container);const s=E.add.rectangle(0,0,hs,xs,0,1).setOrigin(0,0);s.setInteractive(new Phaser.Geom.Rectangle(0,0,hs,xs),Phaser.Geom.Rectangle.Contains),this.container.add([s,Mn(0,0,hs,eo),Mn(0,eo,gD,xs-eo),Mn(to,eo,rO,xs-eo-VS),Mn(to,xs-VS,rO,VS)]),this.titleText=_s(7,4.5,"",F.WINDOW,Je.title),this.resText=_s(hs-40,6,"",F.MONEY,Je.small).setOrigin(1,0);const i=new wr(hs-36,3,33,16,"返回",()=>{this.isOpen()&&this.close()});this.hintText=_s(to+6,xs-VS+4.5,"",F.WINDOW,Je.tiny),this.detail=E.add.container(0,0),this.list=new bl(4,eo+5,gD-8,xs-eo-10,{onSelect:l(()=>{this.message="",this.render(),this.getUi().playSelect()},"onSelect"),onConfirm:l(A=>this.confirm(A),"onConfirm")}),this.container.add([this.titleText,this.resText,i,this.hintText,this.detail,this.list]),E.input.on("pointerdown",this.onSwipeStart,this),E.input.on("pointerup",this.onSwipeEnd,this),this.keyGuard=new ZO}show(s){const i=s[0];return i!=null&&i.onBack?(super.show(s),this.onBack=i.onBack,this.closing=!1,this.message="",this.slots=Array.from({length:Oo},()=>null),this.swipePointerId=void 0,this.rows=[],this.list.setRows([],0),this.invalidateEntries(),this.keyGuard.arm(),this.pointerGuard.arm(),this.container.setVisible(!0),E.uiContainer.bringToTop(this.container),this.list.guardPointer(),this.render(),!0):!1}clear(){super.clear(),this.container.setVisible(!1),this.swipePointerId=void 0,this.onBack=null,this.closing=!1,this.detail.removeAll(!0)}isOpen(){return this.active&&this.container.visible&&!this.closing&&this.getUi().getMode()===V.ERYOU_HELD_SYNTHESIS}render(){var r,O;if(!((r=this.container)!=null&&r.visible))return;const s=this.ensureEntries(),i=s.reduce((I,S)=>I+S.stock,0);Ti(this.titleText,"二游模式 · 持有物合成",hs-140),Ti(this.resText,`持有物 ${i} 件`,96);const A=(O=this.rows[this.list.getCursor()])==null?void 0:O.key;this.rows=this.buildRows(s);const a=A?this.rows.findIndex(I=>I.key===A):-1;this.list.setRows(this.rows.map(I=>({kind:I.kind,label:I.label,state:I.state,stateStyle:I.stateStyle,enabled:I.enabled,icon:I.icon})),a>=0?a:this.list.getCursor()),this.detail.removeAll(!0),this.renderSlots(),this.renderPlan(),this.renderFooter()}data(){return E.gameData.getEryouData()}ensureEntries(){return this.entriesLoaded||(this.entries=EF(this.data()),this.entriesLoaded=!0),this.entries}invalidateEntries(){this.entriesLoaded=!1}entryById(s){return this.entries.find(i=>i.id===s)}buildRows(s){const i=YI(this.slots),A=MRe(this.slots).length,a=[];a.push({key:"synthesize",label:"合成",state:i.ready?this.chanceSummary(i):i.reason,stateStyle:i.ready?F.SUMMARY_GOLD:F.WINDOW,enabled:i.ready,run:l(()=>this.runSynthesis(),"run")}),a.push({key:"clear",label:"清空材料",state:A?`${A} 件`:"空",enabled:A>0,run:l(()=>{this.slots=this.slots.map(()=>null),this.message="已把材料放回库存"},"run")}),a.push({kind:"header",key:"header-slots",label:`合成框 ${A}/${Oo}`}),this.slots.forEach((O,I)=>{const S=O?this.entryById(O):void 0,T=O?(S==null?void 0:S.label)??Xa(O):`槽 ${I+1} · 空`;a.push({key:`slot-${I}`,label:O?`槽 ${I+1} · ${T}`:T,state:O?this.levelNameOf(S):"空槽",icon:S!=null&&S.iconFrame?{key:"items",frame:S.iconFrame,scale:.4}:void 0,enabled:!!O,run:O?()=>{this.slots[I]=null,this.message=`已取回 ${T}`}:void 0})});for(const O of[...Lo].reverse()){const I=s.filter(T=>T.level===O);if(!I.length)continue;const S=I.reduce((T,L)=>T+L.available,0);a.push({kind:"header",key:`header-${O}`,label:`库存 · ${LR[O]}（可投入 ${S}）`});for(const T of I){const L=this.slots.filter(C=>C===T.id).length,h=T.available-L;a.push({key:`item-${T.id}`,label:T.label,state:T.available>0?L?`已放 ${L} · 余 ${h}`:`可投入 ${T.available}`:"已被携带",stateStyle:h>0?F.WINDOW:F.SUMMARY_GRAY,icon:T.iconFrame?{key:"items",frame:T.iconFrame,scale:.4}:void 0,enabled:h>0,run:l(()=>this.putIn(T),"run")})}}const r=s.filter(O=>O.level===null);if(r.length){a.push({kind:"header",key:"header-unknown",label:"其他（判不出球级）"});for(const O of r)a.push({key:`item-${O.id}`,label:O.label,state:`${O.stock} 件`,enabled:!1})}return s.length||a.push({kind:"row",key:"empty",label:"还没有持有物",state:"去持有物本刷",enabled:!1}),a.push({kind:"gap",key:"gap",label:""}),a.push({key:"back",label:"返回大厅",run:l(()=>this.close(),"run")}),a}levelNameOf(s){return s!=null&&s.level?LR[s.level]:"球级未知"}renderSlots(){const s=YI(this.slots);this.slots.forEach((i,A)=>{const a=to+6+A*(BI+Sfe),r=eo+4,O=i?this.entryById(i):void 0,I=!!(O!=null&&O.level)&&O.level===s.targetLevel;if(this.add(Mn(a,r,BI,yI)),!i){this.add(_s(a+BI/2,r+yI/2,"空",F.SUMMARY_GRAY,Je.small).setOrigin(.5,.5));return}const S=Eoe(a+BI/2-6,r+4,O==null?void 0:O.iconFrame,.5);S&&this.add(S);const T=(O==null?void 0:O.label)??Xa(i),L=this.add(_s(a+BI/2,r+20,T,I?F.SUMMARY_GOLD:F.WINDOW,Je.tiny).setOrigin(.5,0));Ti(L,T,BI-3);const h=E.add.zone(a,r,BI,yI).setOrigin(0,0).setInteractive({useHandCursor:!0});h.on("pointerdown",()=>{this.isOpen()&&this.pointerGuard.pass()&&(this.slots[A]=null,this.message=`已取回 ${T}`,this.getUi().playSelect(),this.render())}),this.add(h)})}renderPlan(){const s=YI(this.slots),i=s.materials.length,A=AM(s.upgradeChance),a=AM(s.sameLevelChance);let r=yI+7;this.panelText(6,r,`合成框 ${i}/${Oo}`,F.WINDOW,Je.small),s.targetLevel&&this.panelText(rO-6,r,`目标 ${LR[s.targetLevel]}`,F.SUMMARY_GOLD,Je.small,0,!0),r+=11;const O=i===Oo,I=s.upgradeLevel?O?`升级 ${A}% → ${LR[s.upgradeLevel]}`:"升级 —（放满 5 件后判定）":"已是最高档：只洗牌，不升级";this.panelText(6,r,I,O&&s.upgradeLevel&&A>0?F.SUMMARY_GOLD:F.WINDOW,Je.body),this.add(new gO(to+6,eo+r+10,rO-12,"need").setRatio(O?s.upgradeChance:0)),r=yI+36;const S=s.ready?s.fallbackLevel?`同级 ${a}%　掉档 → ${LR[s.fallbackLevel]}`:`同级 ${a}%（最低档：不会掉档）`:s.reason;this.panelText(6,r,S,s.ready?F.WINDOW:F.SUMMARY_RED,Je.tiny),r=yI+46,this.panelText(6,r,"5 件同球级才有升级率：普通 50% / 超级 35% / 高级 15%（大师已到顶）。",F.SUMMARY_GRAY,Je.tiny),r=yI+56,this.panelText(6,r,`每掺 1 件低一档：升级与同级各 −${Math.round(db*100)}%，省下的概率掉一档。`,F.SUMMARY_GRAY,Je.tiny)}chanceSummary(s){const i=AM(s.upgradeChance);return s.upgradeLevel&&i>0?`升级 ${i}%`:`同级 ${AM(s.sameLevelChance)}%`}renderFooter(){const s=YI(this.slots),i=s.materials.length,A=xs-VS-39,a=new wr(to+6,A,96,17,"合成",()=>{this.isOpen()&&this.pointerGuard.pass()&&this.runSynthesis()&&this.getUi().playSelect()});a.setEnabled(s.ready);const r=new wr(to+108,A,60,17,"清空",()=>{this.isOpen()&&this.pointerGuard.pass()&&(this.slots=this.slots.map(()=>null),this.message="已把材料放回库存",this.getUi().playSelect(),this.render())});if(r.setEnabled(i>0),this.add(a),this.add(r),this.message){const O=xs-VS-20,I=Mn(to+3,O,rO-6,16);I.setName("synthesis-message"),this.add(I);const S=this.add(_s(to+8,O+2.5,this.message,F.SUMMARY_GOLD,Je.small));Ti(S,this.message,rO-16)}Ti(this.hintText,"↑↓ 选择　Z / 回车 放入或取出　点格子也能取回　X / Esc 返回",rO-12)}add(s){return this.detail.add(s),s}panelText(s,i,A,a=F.WINDOW,r=Je.small,O=rO-12-s,I=!1){const S=this.add(_s(to+s,eo+i,A,a,r));return I&&S.setOrigin(1,0),O>0&&Ti(S,A,O),S}putIn(s){const i=this.slots.indexOf(null);if(i<0)return this.message=`合成框已经满了（${Oo}/${Oo}）：先取出一件，或直接点「合成」`,this.getUi().playError(),!1;const A=this.slots.filter(a=>a===s.id).length;return s.available-A<=0?(this.message=`${s.label} 可投入的已经全在合成框里了`,this.getUi().playError(),!1):(this.slots[i]=s.id,this.message="",!0)}runSynthesis(){const s=YI(this.slots);if(!s.ready)return this.message=s.reason||"还不能合成",this.getUi().playError(),this.render(),!1;const i=lfe(this.data(),this.slots);return i.ok?(this.slots=this.slots.map(()=>null),this.message=i.message,this.invalidateEntries(),E.gameData.saveSystem(),this.render(),!0):(this.message=i.message,this.getUi().playError(),this.render(),!1)}confirm(s){if(!this.isOpen())return;const i=this.rows[s];if(i!=null&&i.run){if(i.enabled===!1){this.message=this.pageReason(i),this.getUi().playError(),this.render();return}if(i.run()===!1){this.render();return}this.getUi().playSelect(),this.render()}}pageReason(s){return s.key==="synthesize"?YI(this.slots).reason:s.key.startsWith("slot-")?"这个槽是空的：先从左下的库存里放一件进来。":s.key.startsWith("item-")?"这件持有物正被宝可梦携带：先去「持有物」页卸下，才能当材料。":s.key==="empty"?"库存里还没有持有物：先去「持有物本」刷几件。":"这一项现在不可用。"}close(){if(!this.isOpen())return;this.closing=!0,this.getUi().playSelect();const s=this.onBack;this.onBack=null,s?s():this.getUi().setMode(V.TITLE)}processInput(s){if(!this.isOpen()||this.keyGuard.isBlocked(s))return!1;switch(s){case w.UP:case w.DOWN:{const i=this.list.move(s===w.UP?-1:1);return i||this.getUi().playError(),i}case w.ACTION:case w.SUBMIT:return this.confirm(this.list.getCursor()),!0;case w.CANCEL:return this.close(),!0;default:return!1}}onSwipeStart(s){this.swipePointerId=void 0,!(!s.wasTouch||!this.isOpen())&&(this.swipePointerId=s.id,this.swipeStartX=s.x,this.swipeStartY=s.y)}onSwipeEnd(s){const i=this.swipePointerId===s.id;if(this.swipePointerId=void 0,!i||!s.wasTouch||!this.isOpen())return;const A=s.x-this.swipeStartX,a=s.y-this.swipeStartY;A<=-130&&Math.abs(A)>Math.abs(a)*1.5&&this.close()}}

class EryouSpeciesSearchUiHandler extends Yi{constructor(){super(V.ERYOU_SEARCH),this.input=null,this.args=null,this.matches=[],this.query="",this.closing=!1}setup(){var a,r;this.container=E.add.container(0,0).setName("eryou-species-search").setVisible(!1),E.uiContainer.add(this.container);const s=E.add.rectangle(0,0,hs,xs,0,.55).setOrigin(0,0);s.setInteractive(new Phaser.Geom.Rectangle(0,0,hs,xs),Phaser.Geom.Rectangle.Contains),this.container.add([s,Mn(Sn.x,Sn.y,Sn.width,Sn.height)]),this.container.add(_s(Sn.x+7,Sn.y+4,"搜索宝可梦",F.SUMMARY_GOLD,Je.body)),this.countText=_s(Sn.x+Sn.width-42,Sn.y+5,"",F.WINDOW,Je.small).setOrigin(1,0);const i=new wr(Sn.x+Sn.width-37,Sn.y+3,32,14,"关闭",()=>this.isOpen()&&this.close());this.container.add([this.countText,i]),this.container.add(Mn(Sn.x+5,Sn.y+18,Sn.width-10,16));const A=lw(Sn.x+9,Sn.y+19.5,(Sn.width-18)*6,84,F.TOOLTIP_CONTENT,{type:"text",maxLength:16,placeholder:"输入编号或名字，即时筛选",spellCheck:!1,autoComplete:"off"});A.setOrigin(0,0),(r=(a=A.node)==null?void 0:a.setAttribute)==null||r.call(a,"lang","zh-CN"),A.on("textchange",()=>{this.query=A.text??"",this.applyFilter()}),A.on("keydown",(O,I)=>this.onInputKey(I)),this.container.add(A),this.input=A,this.list=new bl(Sn.x+6,Sn.y+37,Sn.width-12,Sn.height-37-15,{fontSize:Je.small,stateFontSize:Je.tiny,rowHeight:12,onSelect:l(()=>this.getUi().playSelect(),"onSelect"),onConfirm:l(O=>this.pick(O),"onConfirm")}),this.hintText=_s(Sn.x+7,Sn.y+Sn.height-12,"",F.WINDOW,Je.tiny),this.container.add([this.list,this.hintText]),this.keyGuard=new ZO}show(s){var A,a;const i=s[0];return i!=null&&i.candidates?(super.show(s),this.args=i,this.closing=!1,this.query="",this.keyGuard.arm(),(A=this.input)==null||A.setText(""),this.container.setVisible(!0),E.uiContainer.bringToTop(this.container),this.applyFilter(i.currentId),this.list.guardPointer(),(a=E.input.keyboard)==null||a.disableGlobalCapture(),window.setTimeout(()=>{var r;this.isOpen()&&((r=this.input)==null||r.setFocus())},60),this.renderHint(),!0):!1}clear(){var s,i;super.clear(),(s=this.input)==null||s.setBlur(),(i=E.input.keyboard)==null||i.enableGlobalCapture(),this.container.setVisible(!1),this.args=null}isOpen(){return this.active&&this.container.visible&&!this.closing&&this.getUi().getMode()===V.ERYOU_SEARCH}matchesQuery(s,i){if(!i)return!0;const A=i.replace(/^#/,"");if(/^\d+$/.test(A))return String(s.speciesId).startsWith(String(Number(A)))||String(s.speciesId).padStart(4,"0").includes(A);const a=i.toLowerCase();return s.name.toLowerCase().includes(a)||s.key.toLowerCase().includes(a)}applyFilter(s?){var O;const i=((O=this.args)==null?void 0:O.candidates)??[],A=this.query.trim();this.matches=i.filter(I=>this.matchesQuery(I,A));const a=this.matches.map(I=>({label:`${String(I.speciesId).padStart(4,"0")}  ${I.name}`,state:I.state,enabled:!I.restricted,icon:{key:I.iconKey,frame:I.iconFrame,scale:.36}}));a.length||a.push({kind:"header",label:`没有匹配「${A}」的宝可梦，换个编号或名字试试`});const r=s!==void 0?this.matches.findIndex(I=>I.speciesId===s):0;this.list.setRows(a,Math.max(0,r)),Ti(this.countText,A?`匹配 ${this.matches.length} / ${i.length}`:`全部 ${i.length} 只`,110)}renderHint(){Ti(this.hintText,"输入即筛选　↑↓ / 滚轮 选择　回车 / 点两下 定位　Esc 清空 / 关闭",Sn.width-14)}pick(s){var a;if(!this.isOpen())return;const i=this.matches[s];if(!i){this.getUi().playError();return}const A=(a=this.args)==null?void 0:a.onPick;this.closing=!0,this.getUi().playSelect(),this.getUi().revertMode().then(()=>A==null?void 0:A(i.speciesId))}close(){this.closing||(this.closing=!0,this.getUi().revertMode())}moveCursor(s){const i=s>0?1:-1;let A=!1;for(let a=0;a<Math.abs(s);a++)A=this.list.move(i)||A;A||this.getUi().playError()}onInputKey(s){var i;if(!(!this.isOpen()||s.isComposing))switch(s.key){case"ArrowUp":case"ArrowDown":s.preventDefault(),this.moveCursor(s.key==="ArrowUp"?-1:1);break;case"PageUp":case"PageDown":s.preventDefault(),this.moveCursor(s.key==="PageUp"?-EM:EM);break;case"Enter":s.preventDefault(),this.pick(this.list.getCursor());break;case"Escape":s.preventDefault(),this.query?((i=this.input)==null||i.setText(""),this.query="",this.applyFilter()):this.close();break}}processInput(s){var i;if(!this.isOpen()||this.keyGuard.isBlocked(s)||(i=this.input)!=null&&i.isFocused&&E.inputMethod!=="gamepad")return!1;switch(s){case w.UP:case w.DOWN:return this.moveCursor(s===w.UP?-1:1),!0;case w.LEFT:case w.RIGHT:return this.moveCursor(s===w.LEFT?-EM:EM),!0;case w.ACTION:case w.SUBMIT:return this.pick(this.list.getCursor()),!0;case w.CANCEL:return this.close(),!0;default:return!1}}}


// ─────────────────────────────────────────────────────────────
// TODO(接入锚点 90df65097b6d)：本文件依赖清单
// ─────────────────────────────────────────────────────────────
// TODO(接入锚点): 上述 `declare` 块中的短名 → 上游 UI 基类 / 组件 / 场景 / 枚举。
// TODO(接入锚点): 11 个 UI Handler 挂到 UI 模式注册表（`EryouSynthesisUiHandler` 等）。
// TODO(A4-验证): 各 Handler 的按键 / 光标 / 分页行为。
