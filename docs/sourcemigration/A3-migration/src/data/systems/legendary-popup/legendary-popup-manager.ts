/**
 * legendary-popup 弹窗管理器（独立 chunk 拆分：逻辑）
 * ---------------------------------------------------------------------------
 * 来源：game/server/dist/assets/legendary-popup-CYOZDx4m.js（.orig 独立 chunk）
 * 逆向方式：`c(短名,"原名")` 反查（该 chunk 用 `c` 作 keepNames 包装）
 * 锚点树：90df65097b6df76f713e6bd108afa84499e8b993
 *
 * 定位：传说宝可梦登场时的**全屏弹窗**渲染器（纯 DOM，与 Phaser 无关）：
 *       `init`（建容器）→ `injectStyles`（注入 CSS）→ `show`（渲染配置 + 动画）
 *       → `pauseGame`/`resumeGame`（暂停游戏）→ `close`（淡出复位）。
 *
 * 产物符号对照：
 *   p    → LegendaryPopupManager
 *   x    → legendaryPopup（单例，见 index.ts）
 *   f    → getLegendaryConfig（已拆到 ./legendary-config）
 *   c    → keepNames 包装（迁移时省略）
 *
 * 拆分策略（见 A3-10 记录）：
 *   · `legendary-popup-styles.ts`（181 KB CSS）—— 从本文件 `injectStyles` 拆出；
 *   · `legendary-config.ts`（128 KB 模板/称号数据）—— 从产物 `f` 拆出；
 *   · 本文件只保留**逻辑**，靠 import 拼装。
 *
 * ⚠️ 本文件由产物**逐字提取**（仅做类名/引用重命名 + CSS 外置），请勿手工排版。
 */
import { getLegendaryConfig } from "./legendary-config";
import { LEGENDARY_POPUP_STYLES } from "./legendary-popup-styles";

/** 产物 `p` — 传说弹窗管理器 */
export class LegendaryPopupManager{
  /** 弹窗根容器（产物 `this.container`） */
  private container: HTMLDivElement | null = null;
  /** 注入的 `<style>` 元素（产物 `this.styleElement`） */
  private styleElement: HTMLStyleElement | null = null;
  /** 暂停前的游戏速度（产物 `this.previousGameSpeed`） */
  private previousGameSpeed = 1;
  /** 是否已暂停（产物 `this.isPaused`） */
  private isPaused = false;

  constructor(){this.container=null,this.styleElement=null,this.previousGameSpeed=1,this.isPaused=!1}init(){this.container||(this.container=document.createElement("div"),this.container.id="legendary-popup-container",this.container.style.cssText=`
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 10000;
      pointer-events: none;
      display: none;
    `,document.body.appendChild(this.container),this.injectStyles())}injectStyles(){this.styleElement||(this.styleElement=document.createElement("style"),this.styleElement.textContent=LEGENDARY_POPUP_STYLES,document.head.appendChild(this.styleElement))}pauseGame(){try{const i=(window as any).globalScene;if(!i)return;this.previousGameSpeed=i.gameSpeed||1,i.gameSpeed=0,i.scene&&i.scene.pause&&i.scene.pause(),this.isPaused=!0,console.log(`[传说弹窗] 游戏已暂停，原速度: ${this.previousGameSpeed}`)}catch(i){console.error("[传说弹窗] 暂停游戏失败:",i)}}resumeGame(){try{if(!this.isPaused)return;const i=(window as any).globalScene;if(!i)return;i.gameSpeed=this.previousGameSpeed,i.scene&&i.scene.resume&&i.scene.resume(),this.isPaused=!1,console.log(`[传说弹窗] 游戏已恢复，速度: ${this.previousGameSpeed}`)}catch(i){console.error("[传说弹窗] 恢复游戏失败:",i)}}show(i,a,g,n=!1){if(this.init(),!this.container)return;this.pauseGame();const s=getLegendaryConfig(i,g);this.container.innerHTML="",this.container.style.display="block";const t=document.createElement("div");t.className="legendary-popup",n?(t.style.border=`2px solid ${s.borderColor}`,t.style.boxShadow=`0 0 20px ${s.glowColor}`,t.classList.add("mobile-optimized")):(t.style.border=`4px solid ${s.borderColor}`,t.style.boxShadow=`0 0 40px ${s.glowColor}, 0 0 80px ${s.glowColor}`);const l=document.createElement("div");if(l.className="legendary-popup-bg",l.style.background=s.bgGradient,t.appendChild(l),n){const r=document.createElement("div");r.className="legendary-popup-animation mobile-simple",r.innerHTML=`
        <div class="simple-glow"></div>
        <div class="simple-particle p1"></div>
        <div class="simple-particle p2"></div>
        <div class="simple-particle p3"></div>
      `,t.appendChild(r)}else{const r=document.createElement("div");r.className="legendary-popup-animation",r.innerHTML=s.animation,t.appendChild(r)}const d=document.createElement("div");d.className="legendary-popup-content",d.innerHTML=`
      <div class="legendary-popup-title">${s.title}</div>
      <div class="legendary-popup-subtitle">${s.subtitle}</div>
      <div class="legendary-popup-name">${i}</div>
    `,t.appendChild(d),this.container.appendChild(t),setTimeout(()=>{t.classList.add("show")},n?20:50),console.log(`[传说弹窗] 显示: ${i}, 移动端: ${n}, 配置:`,s)}close(){if(!this.container)return;const i=this.container.querySelector(".legendary-popup");i?(i.classList.remove("show"),setTimeout(()=>{this.container&&(this.container.style.display="none",this.container.innerHTML=""),this.resumeGame()},300)):this.resumeGame(),console.log("[传说弹窗] 关闭")}}
