/**
 * legendary-popup 弹窗样式（独立 chunk 拆分：CSS）
 * ---------------------------------------------------------------------------
 * 来源：game/server/dist/assets/legendary-popup-CYOZDx4m.js（.orig 独立 chunk）
 *       产物 `LegendaryPopupManager.injectStyles()` 中的 `<style>` 模板串。
 * 逆向方式：`c(短名,"原名")` 反查（该 chunk 用 `c` 作 keepNames 包装）
 * 锚点树：90df65097b6df76f713e6bd108afa84499e8b993
 *
 * 拆分策略（见 A3-10 记录）：把 181 KB 的 CSS 从 Manager 中拆出为独立模块，
 * 既是「chunk 拆分」的落点，也避免 Manager 文件被样式淹没。
 *
 * ⚠️ 本文件由产物**逐字提取**，请勿手工排版（改动会破坏与产物的字节等价性）。
 */

/** 产物 `injectStyles` 的样式表内容（逐字） */
export const LEGENDARY_POPUP_STYLES = `
      /* 基础弹窗样式 - 全屏版 */
      .legendary-popup {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        transform: scale(0.9);
        border-radius: 0;
        overflow: hidden;
        opacity: 0;
        transition: all 0.4s ease-out;
        box-shadow: 0 0 100px rgba(0, 0, 0, 0.9);
      }

      .legendary-popup.show {
        opacity: 1;
        transform: scale(1);
      }

      .legendary-popup-bg {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 1;
      }

      .legendary-popup-content {
        position: relative;
        z-index: 3;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: 40px;
      }

      .legendary-popup-title {
        font-size: 72px;
        font-weight: bold;
        color: #ffffff;
        text-shadow: 
          0 0 30px rgba(0, 0, 0, 1),
          0 0 60px rgba(0, 0, 0, 0.9),
          0 0 90px rgba(0, 0, 0, 0.8);
        margin-bottom: 30px;
        font-family: 'Arial Black', sans-serif;
        letter-spacing: 8px;
        animation: titlePulse 3s ease-in-out infinite;
      }

      @keyframes titlePulse {
        0%, 100% { transform: scale(1); filter: brightness(1); }
        50% { transform: scale(1.05); filter: brightness(1.3); }
      }

      .legendary-popup-subtitle {
        font-size: 36px;
        color: #f0f0f0;
        text-shadow: 
          0 0 20px rgba(0, 0, 0, 0.9),
          0 0 40px rgba(0, 0, 0, 0.7);
        font-family: 'Arial', sans-serif;
        letter-spacing: 4px;
      }

      .legendary-popup-name {
        font-size: 48px;
        font-weight: bold;
        color: #ffffff;
        text-shadow: 
          0 0 30px rgba(0, 0, 0, 1),
          0 0 60px rgba(0, 0, 0, 0.9);
        margin-top: 20px;
        font-family: 'Arial Black', sans-serif;
        letter-spacing: 6px;
      }

      /* 动画层 */
      .legendary-popup-animation {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 2;
        overflow: hidden;
      }

      /* 移动端优化样式 */
      .legendary-popup.mobile-optimized {
        transition: all 0.3s ease-out;
      }

      .legendary-popup.mobile-optimized .legendary-popup-title {
        font-size: 56px;
        animation: none;
        text-shadow: 0 0 25px rgba(0, 0, 0, 1);
        margin-bottom: 20px;
      }

      .legendary-popup.mobile-optimized .legendary-popup-subtitle {
        font-size: 28px;
        text-shadow: 0 0 18px rgba(0, 0, 0, 0.9);
        margin-bottom: 15px;
      }

      .legendary-popup.mobile-optimized .legendary-popup-name {
        font-size: 42px;
        text-shadow: 0 0 25px rgba(0, 0, 0, 1);
        font-weight: 900;
      }

      /* 移动端简化动画 */
      .legendary-popup-animation.mobile-simple {
        pointer-events: none;
      }

      .simple-glow {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 300px;
        height: 300px;
        margin: -150px 0 0 -150px;
        background: radial-gradient(circle, rgba(255, 255, 255, 0.3), transparent);
        border-radius: 50%;
        animation: simpleGlowPulse 2s ease-in-out infinite;
      }

      @keyframes simpleGlowPulse {
        0%, 100% { transform: scale(1); opacity: 0.3; }
        50% { transform: scale(1.2); opacity: 0.5; }
      }

      .simple-particle {
        position: absolute;
        width: 8px;
        height: 8px;
        background: rgba(255, 255, 255, 0.6);
        border-radius: 50%;
        animation: simpleFloat 3s ease-in-out infinite;
      }

      .simple-particle.p1 {
        left: 30%;
        top: 30%;
        animation-delay: 0s;
      }

      .simple-particle.p2 {
        left: 70%;
        top: 50%;
        animation-delay: 1s;
      }

      .simple-particle.p3 {
        left: 50%;
        top: 70%;
        animation-delay: 2s;
      }

      @keyframes simpleFloat {
        0%, 100% { transform: translateY(0); opacity: 0.4; }
        50% { transform: translateY(-30px); opacity: 0.8; }
      }

      /* 通用动画 - 增强版 */
      @keyframes fadeInOut {
        0%, 100% { opacity: 0.6; }
        50% { opacity: 1; }
      }

      @keyframes pulseGlow {
        0%, 100% { transform: scale(1); opacity: 0.7; filter: brightness(1); }
        50% { transform: scale(1.15); opacity: 1; filter: brightness(1.4); }
      }

      /* 火山场景 - 固拉多 - 增强熔岩特效 */
      @keyframes lavaFlow {
        0% { transform: translateY(100%); opacity: 0; }
        20% { opacity: 0.95; }
        70% { opacity: 0.85; }
        100% { transform: translateY(-50%); opacity: 0; }
      }
      .lava-flow {
        position: absolute;
        bottom: 0;
        width: 100%;
        height: 60%;
        background: linear-gradient(to top, 
          rgba(255, 60, 0, 0.98),
          rgba(255, 100, 0, 0.95),
          rgba(230, 115, 0, 0.9),
          rgba(240, 138, 0, 0.7),
          rgba(255, 150, 50, 0.4),
          transparent);
        opacity: 0;
        animation: lavaFlow 3s ease-out infinite;
        filter: blur(4px) brightness(1.3);
        box-shadow: 
          0 -30px 80px rgba(214, 62, 0, 0.8),
          0 -60px 120px rgba(230, 115, 0, 0.5);
      }
      .lava-1 { left: 0; animation-delay: 0s; }
      .lava-2 { left: 33%; animation-delay: 1s; }
      .lava-3 { left: 66%; animation-delay: 2s; }

      @keyframes smokeRise {
        0% { transform: translateY(0) scale(1); opacity: 0.8; }
        50% { opacity: 0.9; }
        100% { transform: translateY(-100%) scale(2.5); opacity: 0; }
      }
      .volcano-smoke {
        position: absolute;
        bottom: 0;
        width: 120px;
        height: 120px;
        background: radial-gradient(circle, 
          rgba(100, 40, 20, 0.9),
          rgba(80, 30, 15, 0.8),
          rgba(60, 20, 10, 0.6),
          transparent);
        border-radius: 50%;
        animation: smokeRise 4s ease-out infinite;
        box-shadow: 
          0 0 40px rgba(60, 20, 10, 0.7),
          inset 0 0 30px rgba(120, 50, 30, 0.5);
      }
      .smoke-1 { left: 20%; animation-delay: 0s; }
      .smoke-2 { left: 50%; animation-delay: 1.3s; }
      .smoke-3 { left: 80%; animation-delay: 2.6s; }

      /* 海洋场景 - 盖欧卡 */
      @keyframes waveMove {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
      .ocean-wave {
        position: absolute;
        bottom: 0;
        width: 200%;
        height: 60%;
        background: linear-gradient(to top, rgba(20, 100, 180, 0.8), transparent);
        animation: waveMove 6s linear infinite;
      }
      .wave-1 { animation-delay: 0s; }
      .wave-2 { animation-delay: 2s; opacity: 0.7; }
      .wave-3 { animation-delay: 4s; opacity: 0.5; }

      @keyframes lightningFlash {
        0%, 88%, 100% { opacity: 0; transform: scaleY(0); }
        89% { opacity: 0; transform: scaleY(1); }
        90%, 92% { opacity: 1; transform: scaleY(1); }
        93%, 95% { opacity: 0.8; transform: scaleY(1); }
        96% { opacity: 0; transform: scaleY(1); }
      }
      .lightning-bolt {
        position: absolute;
        width: 3px;
        height: 100%;
        background: linear-gradient(to bottom, #ffffff, #4db8ff, transparent);
        animation: lightningFlash 5s ease-in-out infinite;
        box-shadow: 0 0 10px #4db8ff;
      }
      .bolt-1 { left: 30%; animation-delay: 0s; }
      .bolt-2 { left: 70%; animation-delay: 2.5s; }

      /* 天空场景 - 裂空座 */
      @keyframes sunPulse {
        0%, 100% { transform: scale(1); opacity: 0.8; }
        50% { transform: scale(1.3); opacity: 1; }
      }
      .sun-ray {
        position: absolute;
        left: 50%;
        top: 20%;
        width: 150px;
        height: 150px;
        margin: -75px 0 0 -75px;
        background: radial-gradient(circle, rgba(255, 220, 100, 0.6), transparent);
        border-radius: 50%;
        animation: sunPulse 3s ease-in-out infinite;
      }

      @keyframes rayRotate {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      .ray-beam {
        position: absolute;
        left: 50%;
        top: 20%;
        width: 300px;
        height: 3px;
        margin-top: -1.5px;
        background: linear-gradient(to right, transparent, rgba(255, 220, 100, 0.8), transparent);
        transform-origin: left center;
        animation: rayRotate 8s linear infinite;
      }
      .beam-1 { animation-delay: 0s; }
      .beam-2 { animation-delay: 2s; }
      .beam-3 { animation-delay: 4s; }

      /* 念力场景 - 超梦 */
      @keyframes starTwinkle {
        0%, 100% { opacity: 0.5; transform: scale(0.8); filter: brightness(1); }
        50% { opacity: 1; transform: scale(1.3); filter: brightness(1.6); }
      }
      .psychic-star {
        position: absolute;
        width: 20px;
        height: 20px;
        background: radial-gradient(circle, rgba(200, 150, 255, 0.8), transparent);
        border-radius: 50%;
        animation: starTwinkle 2s ease-in-out infinite;
      }
      .star-1 { left: 20%; top: 20%; animation-delay: 0s; }
      .star-2 { left: 70%; top: 40%; animation-delay: 0.7s; }
      .star-3 { left: 40%; top: 70%; animation-delay: 1.4s; }

      /* 细胞场景 - 梦幻 */
      @keyframes cellFloat {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-20px); }
      }
      .cell-particle {
        position: absolute;
        width: 15px;
        height: 15px;
        background: radial-gradient(circle, rgba(255, 182, 193, 0.8), transparent);
        border-radius: 50%;
        animation: cellFloat 3s ease-in-out infinite;
      }

      /* 电击场景 - 雷公/闪电鸟 */
      @keyframes energyPulse {
        0% { transform: scale(1); opacity: 0.6; }
        50% { transform: scale(1.5); opacity: 1; }
        100% { transform: scale(2); opacity: 0; }
      }
      .thunder-bolt, .electric-spark {
        position: absolute;
        width: 4px;
        height: 100%;
        background: linear-gradient(to bottom, #f4e44d, #f4e44d, transparent);
        animation: lightningFlash 2s ease-in-out infinite;
        box-shadow: 0 0 15px #f4e44d;
      }

      /* 时间齿轮 - 帝牙卢卡 */
      @keyframes gearRotate {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      .time-gear {
        position: absolute;
        width: 80px;
        height: 80px;
        border: 6px solid rgba(100, 149, 237, 0.6);
        border-radius: 50%;
        animation: gearRotate 10s linear infinite;
      }
      .time-gear::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 70%;
        height: 4px;
        background: rgba(100, 149, 237, 0.6);
        transform: translate(-50%, -50%);
      }
      .gear-1 { left: 20%; top: 30%; }
      .gear-2 { left: 70%; top: 50%; animation-direction: reverse; }

      /* 空间裂缝 - 帕路奇亚 */
      @keyframes portalWarp {
        0%, 100% { transform: scale(0.8) rotate(0deg); opacity: 0.5; }
        50% { transform: scale(1.2) rotate(180deg); opacity: 1; }
      }
      .space-portal {
        position: absolute;
        width: 100px;
        height: 100px;
        border: 3px solid rgba(218, 154, 218, 0.8);
        border-radius: 50%;
        animation: portalWarp 4s ease-in-out infinite;
      }
      .portal-1 { left: 25%; top: 30%; animation-delay: 0s; }
      .portal-2 { left: 65%; top: 60%; animation-delay: 2s; }

      /* 创世之光 - 阿尔宙斯 */
      @keyframes ringExpand {
        0% { transform: scale(0); opacity: 1; filter: brightness(1.5); }
        50% { opacity: 0.9; filter: brightness(1.3); }
        100% { transform: scale(2.5); opacity: 0; filter: brightness(1); }
      }
      .divine-ring {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 120px;
        height: 120px;
        margin: -60px 0 0 -60px;
        border: 3px solid rgba(255, 255, 255, 0.8);
        border-radius: 50%;
        animation: ringExpand 3s ease-out infinite;
      }
      .ring-1 { animation-delay: 0s; }
      .ring-2 { animation-delay: 1s; }
      .ring-3 { animation-delay: 2s; }

      @keyframes lightRotate {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      .light-beam {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 400px;
        height: 2px;
        background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.8), transparent);
        transform-origin: left center;
        animation: lightRotate 6s linear infinite;
      }

      /* 通用特效 - 增强火焰粒子 */
      .fire-particle {
        position: absolute;
        width: 40px;
        height: 40px;
        background: radial-gradient(circle, 
          rgba(255, 255, 150, 1),
          rgba(255, 200, 100, 0.95),
          rgba(255, 140, 0, 0.9),
          rgba(255, 100, 0, 0.7),
          transparent);
        border-radius: 50%;
        animation: smokeRise 2s ease-out infinite;
        box-shadow: 
          0 0 50px rgba(255, 140, 0, 0.9),
          0 0 80px rgba(255, 100, 0, 0.6);
        filter: brightness(1.5);
      }

      .ice-crystal {
        position: absolute;
        width: 15px;
        height: 15px;
        background: linear-gradient(45deg, rgba(135, 206, 250, 0.8), rgba(176, 224, 230, 0.5));
        clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
        animation: starTwinkle 2s ease-in-out infinite;
      }

      .shadow-tendril {
        position: absolute;
        bottom: 0;
        width: 60px;
        height: 100px;
        background: radial-gradient(ellipse at bottom, rgba(0, 0, 0, 0.8), transparent);
        animation: smokeRise 3s ease-out infinite;
      }

      /* 冰霜特效 - 水君/急冻鸟 */
      @keyframes iceFlow {
        0% { transform: translateY(100%) rotate(0deg); opacity: 0; }
        50% { opacity: 0.8; }
        100% { transform: translateY(-50%) rotate(180deg); opacity: 0; }
      }
      .ice-stream {
        position: absolute;
        bottom: 0;
        width: 100%;
        height: 40%;
        background: linear-gradient(to top, rgba(135, 206, 250, 0.6), transparent);
        animation: iceFlow 4s ease-out infinite;
      }

      @keyframes auroraWave {
        0% { transform: translateX(-100%); opacity: 0.3; }
        50% { opacity: 0.8; }
        100% { transform: translateX(100%); opacity: 0.3; }
      }
      .aurora-light {
        position: absolute;
        top: 0;
        width: 200%;
        height: 80%;
        background: linear-gradient(90deg, 
          transparent,
          rgba(135, 206, 250, 0.3),
          rgba(176, 224, 230, 0.3),
          transparent
        );
        animation: auroraWave 8s ease-in-out infinite;
      }

      /* 圣火特效 - 凤王 */
      @keyframes sacredFire {
        0% { transform: scale(1) rotate(0deg); opacity: 0.6; }
        50% { transform: scale(1.3) rotate(180deg); opacity: 1; }
        100% { transform: scale(1) rotate(360deg); opacity: 0.6; }
      }
      .sacred-flame {
        position: absolute;
        width: 100px;
        height: 100px;
        background: radial-gradient(circle, rgba(218, 106, 58, 0.8), transparent);
        border-radius: 50%;
        animation: sacredFire 3s ease-in-out infinite;
      }

      @keyframes featherFall {
        0% { transform: translateY(-100%) rotate(0deg); opacity: 0; }
        50% { opacity: 1; }
        100% { transform: translateY(100%) rotate(360deg); opacity: 0; }
      }
      .rainbow-feather, .fire-feather, .frozen-feather {
        position: absolute;
        width: 30px;
        height: 40px;
        clip-path: polygon(50% 0%, 80% 30%, 100% 100%, 50% 85%, 0% 100%, 20% 30%);
        animation: featherFall 6s ease-in-out infinite;
      }
      .rainbow-feather {
        background: linear-gradient(135deg, 
          rgba(255, 0, 0, 0.6),
          rgba(255, 165, 0, 0.6),
          rgba(255, 255, 0, 0.6),
          rgba(0, 255, 0, 0.6),
          rgba(0, 0, 255, 0.6),
          rgba(75, 0, 130, 0.6),
          rgba(238, 130, 238, 0.6)
        );
      }
      .fire-feather {
        background: linear-gradient(135deg, rgba(218, 106, 58, 0.8), rgba(186, 90, 49, 0.6));
      }
      .frozen-feather {
        background: linear-gradient(135deg, rgba(135, 206, 250, 0.8), rgba(176, 224, 230, 0.6));
      }

      /* 森林特效 - 雪拉比 */
      @keyframes leafFloat {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        50% { transform: translateY(-30px) rotate(180deg); }
      }
      .forest-leaf {
        position: absolute;
        width: 20px;
        height: 30px;
        background: linear-gradient(135deg, rgba(106, 218, 106, 0.8), rgba(58, 170, 58, 0.6));
        clip-path: polygon(50% 0%, 100% 40%, 80% 100%, 50% 90%, 20% 100%, 0% 40%);
        animation: leafFloat 4s ease-in-out infinite;
      }

      @keyframes timeRipple {
        0% { transform: scale(0); opacity: 1; }
        100% { transform: scale(3); opacity: 0; }
      }
      .time-ripple {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 80px;
        height: 80px;
        margin: -40px 0 0 -40px;
        border: 2px solid rgba(106, 218, 106, 0.6);
        border-radius: 50%;
        animation: timeRipple 3s ease-out infinite;
      }

      /* 龙之特效 - 莱希拉姆/捷克罗姆 */
      @keyframes dragonFlame {
        0% { transform: translateX(-10%) scale(1); opacity: 0.7; }
        50% { transform: translateX(10%) scale(1.2); opacity: 1; }
        100% { transform: translateX(-10%) scale(1); opacity: 0.7; }
      }
      .white-flame, .black-lightning {
        position: absolute;
        width: 120px;
        height: 120px;
        border-radius: 50%;
        animation: dragonFlame 2s ease-in-out infinite;
      }
      .white-flame {
        background: radial-gradient(circle, rgba(255, 240, 230, 0.8), transparent);
      }
      .black-lightning {
        background: radial-gradient(circle, rgba(50, 50, 80, 0.8), transparent);
      }

      @keyframes electricArc {
        0%, 100% { opacity: 0; transform: scaleY(0); }
        50% { opacity: 1; transform: scaleY(1); }
      }
      .electric-arc {
        position: absolute;
        width: 4px;
        height: 100%;
        background: linear-gradient(to bottom, rgba(100, 149, 237, 0.9), transparent);
        animation: electricArc 1.5s ease-in-out infinite;
        box-shadow: 0 0 10px rgba(100, 149, 237, 0.8);
      }

      /* 日月特效 - 索尔迦雷欧/露奈雅拉 */
      @keyframes solarFlare {
        0% { transform: scale(1) rotate(0deg); opacity: 0.8; }
        50% { transform: scale(1.5) rotate(180deg); opacity: 1; }
        100% { transform: scale(1) rotate(360deg); opacity: 0.8; }
      }
      .solar-corona {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 200px;
        height: 200px;
        margin: -100px 0 0 -100px;
        background: radial-gradient(circle, rgba(255, 200, 100, 0.3), transparent);
        border-radius: 50%;
        animation: solarFlare 4s ease-in-out infinite;
      }

      @keyframes lunarPhase {
        0% { transform: scale(1); opacity: 0.5; }
        50% { transform: scale(1.2); opacity: 1; }
        100% { transform: scale(1); opacity: 0.5; }
      }
      .lunar-crescent {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 150px;
        height: 150px;
        margin: -75px 0 0 -75px;
        background: radial-gradient(circle at 30% 30%, transparent 40%, rgba(150, 150, 200, 0.6) 50%);
        border-radius: 50%;
        animation: lunarPhase 3s ease-in-out infinite;
      }

      /* 剑盾特效 - 苍响/藏玛然特 */
      @keyframes swordSlash {
        0% { transform: translateX(-100%) rotate(-45deg); opacity: 0; }
        50% { opacity: 1; }
        100% { transform: translateX(100%) rotate(-45deg); opacity: 0; }
      }
      .sword-beam {
        position: absolute;
        top: 50%;
        width: 300px;
        height: 4px;
        background: linear-gradient(to right, transparent, rgba(100, 149, 237, 0.9), transparent);
        animation: swordSlash 2s ease-out infinite;
        box-shadow: 0 0 10px rgba(100, 149, 237, 0.8);
      }

      @keyframes shieldPulse {
        0%, 100% { transform: scale(1); opacity: 0.6; }
        50% { transform: scale(1.3); opacity: 1; }
      }
      .shield-barrier {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 180px;
        height: 180px;
        margin: -90px 0 0 -90px;
        border: 4px solid rgba(220, 100, 100, 0.7);
        border-radius: 50%;
        animation: shieldPulse 2.5s ease-in-out infinite;
      }

      /* 暗影特效 - 达克莱伊/骑拉帝纳 */
      @keyframes darkVoid {
        0% { transform: scale(1); opacity: 0.8; }
        50% { transform: scale(1.5); opacity: 0.4; }
        100% { transform: scale(2); opacity: 0; }
      }
      .dark-sphere {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 150px;
        height: 150px;
        margin: -75px 0 0 -75px;
        background: radial-gradient(circle, rgba(20, 20, 40, 0.9), transparent);
        border-radius: 50%;
        animation: darkVoid 3s ease-out infinite;
      }

      @keyframes shadowWave {
        0% { transform: translateY(0); opacity: 0.3; }
        50% { transform: translateY(-50px); opacity: 0.7; }
        100% { transform: translateY(-100px); opacity: 0; }
      }
      .nightmare-shadow {
        position: absolute;
        bottom: 0;
        width: 100px;
        height: 150px;
        background: radial-gradient(ellipse at bottom, rgba(0, 0, 0, 0.9), transparent);
        animation: shadowWave 3s ease-out infinite;
      }

      /* 超空间特效 - 究极异兽 */
      @keyframes dimensionRift {
        0%, 100% { transform: scaleX(1); opacity: 0.6; }
        50% { transform: scaleX(1.5); opacity: 1; }
      }
      .dimension-crack {
        position: absolute;
        left: 50%;
        top: 0;
        width: 3px;
        height: 100%;
        margin-left: -1.5px;
        background: linear-gradient(to bottom, 
          rgba(160, 144, 208, 0.8),
          rgba(192, 176, 224, 0.6),
          transparent
        );
        animation: dimensionRift 2s ease-in-out infinite;
        box-shadow: 0 0 15px rgba(160, 144, 208, 0.8);
      }

      @keyframes wormhole {
        0% { transform: rotate(0deg) scale(1); opacity: 0.7; }
        100% { transform: rotate(360deg) scale(1.3); opacity: 0; }
      }
      .wormhole-ring {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 100px;
        height: 100px;
        margin: -50px 0 0 -50px;
        border: 3px solid rgba(160, 144, 208, 0.8);
        border-radius: 50%;
        animation: wormhole 3s linear infinite;
      }

      /* 古代/未来特效 - 悖论宝可梦 */
      @keyframes ancientPower {
        0% { transform: translateY(100%) rotate(0deg); opacity: 0; }
        50% { opacity: 0.8; }
        100% { transform: translateY(-50%) rotate(180deg); opacity: 0; }
      }
      .ancient-rune {
        position: absolute;
        width: 40px;
        height: 40px;
        background: radial-gradient(circle, rgba(200, 100, 50, 0.7), transparent);
        border-radius: 50%;
        animation: ancientPower 4s ease-out infinite;
      }

      @keyframes futureTech {
        0%, 100% { opacity: 0.4; }
        50% { opacity: 1; }
      }
      .cyber-grid {
        position: absolute;
        width: 100%;
        height: 100%;
        background-image: 
          linear-gradient(rgba(100, 149, 237, 0.2) 1px, transparent 1px),
          linear-gradient(90deg, rgba(100, 149, 237, 0.2) 1px, transparent 1px);
        background-size: 50px 50px;
        animation: futureTech 2s ease-in-out infinite;
      }

      /* 通用粒子效果 */
      @keyframes particleFloat {
        0% { transform: translate(0, 0); opacity: 0; }
        50% { opacity: 1; }
        100% { transform: translate(var(--tx, 0), var(--ty, -100px)); opacity: 0; }
      }
      .energy-particle {
        position: absolute;
        width: 8px;
        height: 8px;
        background: radial-gradient(circle, rgba(255, 255, 255, 0.9), transparent);
        border-radius: 50%;
        animation: particleFloat 3s ease-out infinite;
      }

      /* 光环效果 */
      @keyframes haloRotate {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      .divine-halo {
        position: absolute;
        left: 50%;
        top: 30%;
        width: 150px;
        height: 20px;
        margin: -10px 0 0 -75px;
        border: 3px solid rgba(255, 215, 0, 0.6);
        border-radius: 50%;
        animation: haloRotate 8s linear infinite;
        transform-style: preserve-3d;
      }
              .divine-halo {
        position: absolute;
        left: 50%;
        top: 30%;
        width: 150px;
        height: 20px;
        margin: -10px 0 0 -75px;
        border: 3px solid rgba(255, 215, 0, 0.6);
        border-radius: 50%;
        animation: haloRotate 8s linear infinite;
        transform-style: preserve-3d;
      }

      /* 风暴特效 - 龙卷云/雷电云/土地云 */
      @keyframes tornadoSpin {
        0% { transform: translateY(100%) rotate(0deg); opacity: 0; }
        50% { opacity: 0.8; }
        100% { transform: translateY(-100%) rotate(720deg); opacity: 0; }
      }
      .tornado-spiral {
        position: absolute;
        bottom: 0;
        width: 80px;
        height: 200px;
        background: linear-gradient(to top, rgba(150, 170, 180, 0.7), transparent);
        clip-path: polygon(40% 100%, 35% 50%, 30% 20%, 50% 0%, 70% 20%, 65% 50%, 60% 100%);
        animation: tornadoSpin 4s ease-out infinite;
      }

      @keyframes hurricaneRotate {
        0% { transform: rotate(0deg) scale(1); opacity: 0.5; }
        100% { transform: rotate(360deg) scale(1.5); opacity: 0; }
      }
      .hurricane-force, .wind-fury {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 150px;
        height: 150px;
        margin: -75px 0 0 -75px;
        border: 3px solid rgba(150, 170, 180, 0.6);
        border-radius: 50%;
        animation: hurricaneRotate 3s linear infinite;
      }

      /* 雷电特效增强 */
      @keyframes thunderStrike {
        0%, 95%, 100% { opacity: 0; transform: scaleY(0); }
        96%, 97% { opacity: 1; transform: scaleY(1); }
      }
      .thunder-wave {
        position: absolute;
        width: 5px;
        height: 100%;
        background: linear-gradient(to bottom, #f4e44d, #e6d749, transparent);
        animation: thunderStrike 3s ease-in-out infinite;
        box-shadow: 0 0 20px #f4e44d, 0 0 40px #f4e44d;
      }

      @keyframes plasmaExplosion {
        0% { transform: scale(0); opacity: 1; }
        100% { transform: scale(3); opacity: 0; }
      }
      .lightning-fury {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 80px;
        height: 80px;
        margin: -40px 0 0 -40px;
        background: radial-gradient(circle, rgba(244, 228, 77, 0.8), transparent);
        border-radius: 50%;
        animation: plasmaExplosion 2s ease-out infinite;
      }

      /* 大地特效 - 土地云 */
      @keyframes earthquakeShake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-3px); }
        75% { transform: translateX(3px); }
      }
      .tectonic-shift, .ground-crack {
        position: absolute;
        bottom: 0;
        width: 100%;
        height: 5px;
        background: linear-gradient(to right, 
          transparent,
          rgba(139, 90, 43, 0.8),
          rgba(160, 100, 50, 0.6),
          transparent
        );
        animation: earthquakeShake 0.5s ease-in-out infinite;
      }

      @keyframes rockRise {
        0% { transform: translateY(100%); opacity: 0; }
        50% { opacity: 0.8; }
        100% { transform: translateY(-50%); opacity: 0; }
      }
      .earth-pillar {
        position: absolute;
        bottom: 0;
        width: 60px;
        height: 100px;
        background: linear-gradient(to top, rgba(139, 90, 43, 0.8), transparent);
        animation: rockRise 3s ease-out infinite;
      }

      /* ========== 哲尔尼亚斯 - 生命树场景 ========== */
      
      /* 生命树主干 */
      .life-tree-trunk {
        position: absolute;
        left: 50%;
        bottom: 0;
        width: 80px;
        height: 250px;
        margin-left: -40px;
        background: linear-gradient(to top,
          rgba(101, 67, 33, 0.95),
          rgba(120, 80, 50, 0.9),
          rgba(90, 60, 35, 0.85));
        clip-path: polygon(40% 0%, 60% 0%, 70% 100%, 30% 100%);
        box-shadow: 
          0 0 60px rgba(120, 200, 100, 0.6),
          inset -10px 0 30px rgba(80, 50, 30, 0.6);
        animation: treeGrow 3s ease-out infinite;
      }
      
      @keyframes treeGrow {
        0%, 100% { transform: scaleY(0.98); filter: brightness(1); }
        50% { transform: scaleY(1.02); filter: brightness(1.2); }
      }
      
      /* 生命树枝干 */
      .life-tree-branch {
        position: absolute;
        width: 150px;
        height: 10px;
        background: linear-gradient(90deg,
          transparent,
          rgba(101, 67, 33, 0.9),
          rgba(120, 80, 50, 0.85),
          transparent);
        transform-origin: left center;
        box-shadow: 0 0 30px rgba(120, 200, 100, 0.5);
      }
      .branch-1 { left: 50%; top: 30%; transform: rotate(-35deg); animation: branchSway 4s ease-in-out infinite; }
      .branch-2 { left: 50%; top: 40%; transform: rotate(30deg); animation: branchSway 3.5s ease-in-out infinite 0.5s; }
      .branch-3 { left: 50%; top: 50%; transform: rotate(-40deg); animation: branchSway 4.5s ease-in-out infinite 1s; }
      .branch-4 { left: 50%; top: 60%; transform: rotate(35deg); animation: branchSway 4s ease-in-out infinite 1.5s; }
      
      @keyframes branchSway {
        0%, 100% { transform: rotate(var(--rotation, 0deg)); }
        50% { transform: rotate(calc(var(--rotation, 0deg) + 5deg)); }
      }
      
      /* 发光的树叶 */
      .glowing-leaf {
        position: absolute;
        width: 30px;
        height: 40px;
        background: radial-gradient(ellipse,
          rgba(150, 255, 150, 0.95),
          rgba(100, 220, 100, 0.9),
          rgba(80, 180, 80, 0.7));
        clip-path: polygon(50% 0%, 80% 30%, 100% 100%, 50% 85%, 0% 100%, 20% 30%);
        animation: leafGlow 3s ease-in-out infinite;
        box-shadow: 
          0 0 40px rgba(120, 255, 120, 0.9),
          0 0 70px rgba(100, 220, 100, 0.6);
        filter: brightness(1.3);
      }
      @keyframes leafGlow {
        0%, 100% { transform: scale(1) rotate(0deg); filter: brightness(1.2); }
        50% { transform: scale(1.15) rotate(10deg); filter: brightness(1.6); }
      }
      .leaf-1 { left: 30%; top: 25%; animation-delay: 0s; }
      .leaf-2 { left: 65%; top: 30%; animation-delay: 0.4s; }
      .leaf-3 { left: 25%; top: 38%; animation-delay: 0.8s; }
      .leaf-4 { left: 70%; top: 42%; animation-delay: 1.2s; }
      .leaf-5 { left: 28%; top: 50%; animation-delay: 1.6s; }
      .leaf-6 { left: 68%; top: 55%; animation-delay: 2s; }
      .leaf-7 { left: 32%; top: 62%; animation-delay: 2.4s; }
      .leaf-8 { left: 63%; top: 65%; animation-delay: 2.8s; }
      
      /* 生命果实 */
      .life-fruit {
        position: absolute;
        width: 35px;
        height: 35px;
        background: radial-gradient(circle at 35% 35%,
          rgba(255, 220, 100, 1),
          rgba(255, 180, 80, 0.95),
          rgba(240, 150, 60, 0.9));
        border-radius: 50%;
        animation: fruitPulse 2.5s ease-in-out infinite;
        box-shadow: 
          0 0 50px rgba(255, 200, 100, 1),
          0 0 90px rgba(255, 180, 80, 0.8),
          inset -5px -5px 20px rgba(220, 140, 50, 0.6);
      }
      @keyframes fruitPulse {
        0%, 100% { transform: scale(1); box-shadow: 0 0 50px rgba(255, 200, 100, 1), 0 0 90px rgba(255, 180, 80, 0.8); }
        50% { transform: scale(1.2); box-shadow: 0 0 80px rgba(255, 220, 120, 1), 0 0 140px rgba(255, 200, 100, 0.9); }
      }
      .fruit-1 { left: 42%; top: 35%; animation-delay: 0s; }
      .fruit-2 { left: 53%; top: 48%; animation-delay: 0.8s; }
      .fruit-3 { left: 48%; top: 58%; animation-delay: 1.6s; }
      
      /* 彩虹鹿角光芒 */
      .rainbow-antler-glow {
        position: absolute;
        left: 50%;
        top: 20%;
        width: 200px;
        height: 200px;
        margin: -100px 0 0 -100px;
        background: conic-gradient(from 0deg,
          rgba(255, 0, 0, 0.4),
          rgba(255, 165, 0, 0.4),
          rgba(255, 255, 0, 0.4),
          rgba(0, 255, 0, 0.4),
          rgba(0, 0, 255, 0.4),
          rgba(75, 0, 130, 0.4),
          rgba(238, 130, 238, 0.4),
          rgba(255, 0, 0, 0.4));
        border-radius: 50%;
        animation: rainbowRotate 6s linear infinite;
        filter: blur(20px);
      }
      @keyframes rainbowRotate {
        0% { transform: rotate(0deg) scale(1); opacity: 0.6; }
        50% { transform: rotate(180deg) scale(1.2); opacity: 0.9; }
        100% { transform: rotate(360deg) scale(1); opacity: 0.6; }
      }
      .glow-1 { animation-delay: 0s; }
      .glow-2 { animation-delay: 3s; }
      
      /* 生命粒子上升 */
      .life-particle {
        position: absolute;
        width: 15px;
        height: 15px;
        background: radial-gradient(circle,
          rgba(180, 255, 180, 1),
          rgba(140, 220, 140, 0.9),
          transparent);
        border-radius: 50%;
        animation: particleRise 4s ease-out infinite;
        box-shadow: 0 0 30px rgba(160, 255, 160, 0.9);
      }
      @keyframes particleRise {
        0% { transform: translateY(100px) scale(0.5); opacity: 0; }
        20% { opacity: 1; }
        80% { opacity: 0.8; }
        100% { transform: translateY(-200px) scale(1); opacity: 0; }
      }
      .particle-1 { left: 35%; bottom: 0; animation-delay: 0s; }
      .particle-2 { left: 45%; bottom: 0; animation-delay: 0.7s; }
      .particle-3 { left: 55%; bottom: 0; animation-delay: 1.4s; }
      .particle-4 { left: 65%; bottom: 0; animation-delay: 2.1s; }
      .particle-5 { left: 40%; bottom: 0; animation-delay: 2.8s; }
      .particle-6 { left: 60%; bottom: 0; animation-delay: 3.5s; }
      
      /* 生长的藤蔓 */
      .growing-vine {
        position: absolute;
        bottom: 0;
        width: 8px;
        height: 200px;
        background: linear-gradient(to top,
          rgba(80, 150, 80, 0.9),
          rgba(100, 180, 100, 0.8),
          rgba(120, 200, 120, 0.6),
          transparent);
        animation: vineGrow 5s ease-out infinite;
        box-shadow: 0 0 20px rgba(100, 180, 100, 0.6);
      }
      @keyframes vineGrow {
        0% { transform: scaleY(0); opacity: 0; }
        50% { opacity: 1; }
        100% { transform: scaleY(1); opacity: 0.9; }
      }
      .vine-1 { left: 20%; animation-delay: 0s; }
      .vine-2 { left: 50%; animation-delay: 1.7s; }
      .vine-3 { left: 80%; animation-delay: 3.3s; }
      
      /* 花朵绽放 */
      .blooming-flower {
        position: absolute;
        width: 40px;
        height: 40px;
        background: radial-gradient(circle,
          rgba(255, 182, 193, 1),
          rgba(255, 160, 180, 0.9),
          rgba(255, 140, 160, 0.6),
          transparent);
        border-radius: 50%;
        animation: flowerBloom 3s ease-out infinite;
        box-shadow: 0 0 40px rgba(255, 180, 190, 0.9);
      }
      .blooming-flower::before,
      .blooming-flower::after {
        content: '';
        position: absolute;
        width: 100%;
        height: 100%;
        background: inherit;
        border-radius: 50%;
      }
      .blooming-flower::before { transform: rotate(45deg); }
      .blooming-flower::after { transform: rotate(90deg); }
      
      @keyframes flowerBloom {
        0% { transform: scale(0) rotate(0deg); opacity: 0; }
        50% { transform: scale(1) rotate(180deg); opacity: 1; }
        100% { transform: scale(1.1) rotate(360deg); opacity: 0.9; }
      }
      .flower-1 { left: 15%; bottom: 15%; animation-delay: 0s; }
      .flower-2 { left: 75%; bottom: 20%; animation-delay: 0.8s; }
      .flower-3 { left: 25%; bottom: 10%; animation-delay: 1.6s; }
      .flower-4 { left: 85%; bottom: 12%; animation-delay: 2.4s; }
      
      /* 妖精之光 */
      .fairy-sparkle {
        position: absolute;
        width: 25px;
        height: 25px;
        background: 
          linear-gradient(45deg, transparent 40%, rgba(255, 255, 255, 1) 50%, transparent 60%),
          linear-gradient(-45deg, transparent 40%, rgba(255, 255, 255, 1) 50%, transparent 60%);
        animation: fairyTwinkle 2s ease-in-out infinite;
        filter: blur(2px);
      }
      @keyframes fairyTwinkle {
        0%, 100% { transform: scale(0) rotate(0deg); opacity: 0; }
        50% { transform: scale(1.3) rotate(180deg); opacity: 1; }
      }
      .sparkle-1 { left: 20%; top: 25%; animation-delay: 0s; }
      .sparkle-2 { left: 75%; top: 35%; animation-delay: 0.5s; }
      .sparkle-3 { left: 30%; top: 55%; animation-delay: 1s; }
      .sparkle-4 { left: 80%; top: 60%; animation-delay: 1.5s; }
      
      /* 生命能量波动 */
      .life-energy-wave {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 300px;
        height: 300px;
        margin: -150px 0 0 -150px;
        border: 3px solid rgba(150, 255, 150, 0.7);
        border-radius: 50%;
        animation: energyPulse 3s ease-out infinite;
        box-shadow: 
          0 0 60px rgba(120, 255, 120, 0.8),
          inset 0 0 80px rgba(150, 255, 150, 0.4);
      }
      @keyframes energyPulse {
        0% { transform: scale(0); opacity: 1; }
        100% { transform: scale(2); opacity: 0; }
      }
      
      /* 大地掌控光环 */
      .geomancy-aura {
        position: absolute;
        width: 100%;
        height: 100%;
        background: radial-gradient(ellipse at 50% 60%,
          rgba(120, 255, 120, 0.3),
          rgba(100, 220, 100, 0.2),
          transparent 60%);
        animation: auraBreath 4s ease-in-out infinite;
      }
      @keyframes auraBreath {
        0%, 100% { opacity: 0.5; transform: scale(1); }
        50% { opacity: 0.9; transform: scale(1.05); }
      }

      /* ========== 固拉多 - 火山爆发场景 ========== */
      
      /* 火山主体 */
      .volcano-mountain {
        position: absolute;
        left: 50%;
        bottom: 0;
        width: 400px;
        height: 280px;
        margin-left: -200px;
        background: linear-gradient(to top,
          rgba(80, 40, 20, 0.95),
          rgba(100, 50, 25, 0.9),
          rgba(120, 60, 30, 0.85));
        clip-path: polygon(50% 0%, 100% 100%, 0% 100%);
        box-shadow: 
          0 0 80px rgba(255, 100, 0, 0.7),
          inset 0 -50px 80px rgba(255, 80, 0, 0.5);
        animation: mountainRumble 2s ease-in-out infinite;
      }
      @keyframes mountainRumble {
        0%, 100% { transform: translateY(0) scale(1); }
        50% { transform: translateY(-5px) scale(1.01); }
      }
      
      /* 火山口 */
      .volcano-crater {
        position: absolute;
        left: 50%;
        top: 20%;
        width: 120px;
        height: 60px;
        margin-left: -60px;
        background: radial-gradient(ellipse,
          rgba(255, 150, 0, 1),
          rgba(255, 100, 0, 0.95),
          rgba(255, 60, 0, 0.9),
          rgba(200, 40, 0, 0.8));
        border-radius: 50%;
        animation: craterGlow 1.5s ease-in-out infinite;
        box-shadow: 
          0 0 100px rgba(255, 100, 0, 1),
          0 0 150px rgba(255, 80, 0, 0.8),
          inset 0 0 60px rgba(255, 200, 100, 0.6);
        filter: brightness(1.5);
      }
      @keyframes craterGlow {
        0%, 100% { transform: scale(1); filter: brightness(1.3); }
        50% { transform: scale(1.1); filter: brightness(1.8); }
      }
      
      /* 岩浆喷发 */
      .lava-eruption {
        position: absolute;
        left: 50%;
        bottom: 40%;
        width: 80px;
        height: 200px;
        margin-left: -40px;
        background: linear-gradient(to top,
          rgba(255, 80, 0, 1),
          rgba(255, 120, 20, 0.95),
          rgba(255, 160, 40, 0.8),
          rgba(255, 200, 80, 0.5),
          transparent);
        animation: lavaErupt 2s ease-out infinite;
        box-shadow: 
          0 0 80px rgba(255, 100, 0, 1),
          0 0 140px rgba(255, 80, 0, 0.8);
        filter: brightness(1.6) blur(5px);
      }
      @keyframes lavaErupt {
        0% { transform: translateY(100px) scaleY(0); opacity: 0; }
        30% { opacity: 1; }
        100% { transform: translateY(-200px) scaleY(1.5); opacity: 0; }
      }
      .eruption-1 { animation-delay: 0s; margin-left: -50px; }
      .eruption-2 { animation-delay: 1s; margin-left: -30px; }
      
      /* 岩浆喷泉 */
      .lava-fountain {
        position: absolute;
        left: 50%;
        bottom: 40%;
        width: 40px;
        height: 150px;
        margin-left: -20px;
        background: linear-gradient(to top,
          rgba(255, 255, 150, 1),
          rgba(255, 200, 100, 0.95),
          rgba(255, 150, 50, 0.8),
          transparent);
        animation: fountainSpray 1.8s ease-out infinite;
        box-shadow: 
          0 0 60px rgba(255, 220, 100, 1),
          0 0 100px rgba(255, 180, 80, 0.9);
        filter: brightness(1.8);
      }
      @keyframes fountainSpray {
        0% { transform: translateY(50px) scaleY(0); opacity: 0; }
        20% { opacity: 1; }
        70% { opacity: 0.9; }
        100% { transform: translateY(-180px) scaleY(1.3); opacity: 0; }
      }
      .fountain-1 { animation-delay: 0.3s; margin-left: -25px; }
      .fountain-2 { animation-delay: 1.2s; margin-left: -15px; }
      
      /* 熔岩流动 */
      .molten-lava-stream {
        position: absolute;
        bottom: 0;
        width: 150px;
        height: 120px;
        background: linear-gradient(135deg,
          rgba(255, 80, 0, 0.98),
          rgba(255, 120, 20, 0.95),
          rgba(255, 160, 40, 0.9),
          rgba(240, 140, 30, 0.7),
          transparent);
        animation: lavaStreamFlow 4s ease-out infinite;
        box-shadow: 
          0 -20px 80px rgba(255, 100, 0, 0.9),
          0 -40px 120px rgba(255, 80, 0, 0.6);
        filter: blur(8px) brightness(1.4);
      }
      @keyframes lavaStreamFlow {
        0% { transform: translateY(150px) scaleY(0); opacity: 0; }
        30% { opacity: 1; }
        100% { transform: translateY(0) scaleY(1); opacity: 0.95; }
      }
      .stream-1 { left: 25%; animation-delay: 0s; }
      .stream-2 { left: 50%; animation-delay: 1.3s; }
      .stream-3 { left: 70%; animation-delay: 2.6s; }
      
      /* 火山岩飞溅 */
      .flying-rock {
        position: absolute;
        width: 30px;
        height: 30px;
        background: radial-gradient(circle,
          rgba(150, 80, 40, 1),
          rgba(120, 60, 30, 0.9),
          rgba(100, 50, 25, 0.7));
        border-radius: 50%;
        clip-path: polygon(30% 0%, 70% 10%, 90% 40%, 80% 80%, 40% 95%, 10% 70%, 5% 30%);
        animation: rockFly 3s ease-out infinite;
        box-shadow: 
          0 0 40px rgba(255, 120, 0, 0.8),
          inset -5px -5px 15px rgba(80, 40, 20, 0.7);
      }
      @keyframes rockFly {
        0% { transform: translate(0, 200px) rotate(0deg) scale(0.3); opacity: 0; }
        20% { opacity: 1; }
        80% { opacity: 0.8; }
        100% { transform: translate(var(--tx, 100px), var(--ty, -250px)) rotate(360deg) scale(1); opacity: 0; }
      }
      .rock-1 { left: 45%; bottom: 40%; --tx: -120px; --ty: -300px; animation-delay: 0s; }
      .rock-2 { left: 52%; bottom: 40%; --tx: 80px; --ty: -280px; animation-delay: 0.6s; }
      .rock-3 { left: 48%; bottom: 40%; --tx: -150px; --ty: -250px; animation-delay: 1.2s; }
      .rock-4 { left: 50%; bottom: 40%; --tx: 120px; --ty: -290px; animation-delay: 1.8s; }
      .rock-5 { left: 46%; bottom: 40%; --tx: 0px; --ty: -320px; animation-delay: 2.4s; }
      
      /* 岩浆火花 */
      .lava-spark {
        position: absolute;
        width: 20px;
        height: 20px;
        background: radial-gradient(circle,
          rgba(255, 255, 200, 1),
          rgba(255, 200, 100, 0.95),
          rgba(255, 150, 50, 0.8),
          transparent);
        border-radius: 50%;
        animation: sparkFly 2.5s ease-out infinite;
        box-shadow: 
          0 0 40px rgba(255, 220, 100, 1),
          0 0 70px rgba(255, 180, 80, 0.8);
        filter: brightness(1.7);
      }
      @keyframes sparkFly {
        0% { transform: translate(0, 150px) scale(0.2); opacity: 0; }
        15% { opacity: 1; }
        85% { opacity: 0.7; }
        100% { transform: translate(var(--sx, 80px), var(--sy, -200px)) scale(0.8); opacity: 0; }
      }
      .spark-1 { left: 48%; bottom: 35%; --sx: -100px; --sy: -220px; animation-delay: 0s; }
      .spark-2 { left: 51%; bottom: 35%; --sx: 90px; --sy: -210px; animation-delay: 0.3s; }
      .spark-3 { left: 49%; bottom: 35%; --sx: -70px; --sy: -230px; animation-delay: 0.6s; }
      .spark-4 { left: 52%; bottom: 35%; --sx: 110px; --sy: -200px; animation-delay: 0.9s; }
      .spark-5 { left: 47%; bottom: 35%; --sx: -120px; --sy: -190px; animation-delay: 1.2s; }
      .spark-6 { left: 53%; bottom: 35%; --sx: 60px; --sy: -240px; animation-delay: 1.5s; }
      .spark-7 { left: 46%; bottom: 35%; --sx: -85px; --sy: -215px; animation-delay: 1.8s; }
      .spark-8 { left: 54%; bottom: 35%; --sx: 95px; --sy: -225px; animation-delay: 2.1s; }
      
      /* 浓烟滚滚 */
      .thick-volcano-smoke {
        position: absolute;
        width: 150px;
        height: 150px;
        background: radial-gradient(circle,
          rgba(60, 30, 20, 0.95),
          rgba(80, 40, 25, 0.9),
          rgba(100, 50, 30, 0.7),
          transparent);
        border-radius: 50%;
        animation: thickSmoke 5s ease-out infinite;
        box-shadow: 
          0 0 60px rgba(80, 40, 25, 0.8),
          inset 0 0 50px rgba(120, 60, 35, 0.5);
      }
      @keyframes thickSmoke {
        0% { transform: translate(0, 100px) scale(0.5); opacity: 0; }
        20% { opacity: 0.95; }
        80% { opacity: 0.8; }
        100% { transform: translate(var(--smx, 50px), -300px) scale(2.5); opacity: 0; }
      }
      .smoke-1 { left: 45%; bottom: 38%; --smx: -60px; animation-delay: 0s; }
      .smoke-2 { left: 52%; bottom: 38%; --smx: 70px; animation-delay: 1.2s; }
      .smoke-3 { left: 48%; bottom: 38%; --smx: -45px; animation-delay: 2.4s; }
      .smoke-4 { left: 50%; bottom: 38%; --smx: 55px; animation-delay: 3.6s; }
      
      /* 地面裂缝 */
      .ground-fissure {
        position: absolute;
        bottom: 0;
        width: 100%;
        height: 8px;
        background: linear-gradient(90deg,
          transparent,
          rgba(255, 100, 0, 0.9),
          rgba(255, 80, 0, 0.95),
          rgba(255, 60, 0, 0.9),
          transparent);
        animation: fissureGlow 2s ease-in-out infinite;
        box-shadow: 
          0 0 40px rgba(255, 100, 0, 0.9),
          0 -10px 60px rgba(255, 80, 0, 0.7);
      }
      @keyframes fissureGlow {
        0%, 100% { opacity: 0.7; filter: brightness(1.2); }
        50% { opacity: 1; filter: brightness(1.8); }
      }
      .fissure-1 { transform: skewX(-15deg); animation-delay: 0s; }
      .fissure-2 { transform: skewX(20deg); animation-delay: 0.7s; opacity: 0.8; }
      .fissure-3 { transform: skewX(-10deg); animation-delay: 1.4s; opacity: 0.6; }
      
      /* 岩浆光芒 */
      .magma-glow {
        position: absolute;
        left: 50%;
        bottom: 30%;
        width: 300px;
        height: 300px;
        margin-left: -150px;
        background: radial-gradient(circle,
          rgba(255, 150, 50, 0.6),
          rgba(255, 100, 20, 0.5),
          rgba(255, 80, 0, 0.3),
          transparent);
        animation: magmaPulse 2s ease-in-out infinite;
        filter: blur(30px);
      }
      @keyframes magmaPulse {
        0%, 100% { transform: scale(1); opacity: 0.6; }
        50% { transform: scale(1.3); opacity: 0.95; }
      }
      
      /* 热浪扭曲 */
      .heat-distortion {
        position: absolute;
        width: 100%;
        height: 100%;
        background: linear-gradient(180deg,
          transparent,
          rgba(255, 150, 80, 0.1),
          rgba(255, 120, 50, 0.15),
          rgba(255, 100, 30, 0.2));
        animation: heatWave 3s ease-in-out infinite;
        filter: blur(15px);
      }
      @keyframes heatWave {
        0%, 100% { opacity: 0.4; transform: scaleY(1); }
        50% { opacity: 0.7; transform: scaleY(1.05); }
      }
      
      /* 火焰冲击波 */
      .fire-shockwave {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 350px;
        height: 350px;
        margin: -175px 0 0 -175px;
        border: 4px solid rgba(255, 120, 0, 0.8);
        border-radius: 50%;
        animation: shockwaveExpand 3s ease-out infinite;
        box-shadow: 
          0 0 80px rgba(255, 100, 0, 0.9),
          0 0 140px rgba(255, 80, 0, 0.6),
          inset 0 0 100px rgba(255, 150, 50, 0.4);
      }
      @keyframes shockwaveExpand {
        0% { transform: scale(0); opacity: 1; filter: brightness(1.8); }
        100% { transform: scale(2.5); opacity: 0; filter: brightness(1); }
      }

      /* ========== 盖欧卡 - 原始海洋场景 ========== */
      
      /* 深海海床 */
      .ocean-floor {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 200px;
        background: linear-gradient(to top,
          rgba(0, 20, 60, 0.95),
          rgba(0, 30, 80, 0.8),
          rgba(0, 40, 100, 0.5),
          transparent);
        animation: floorWave 6s ease-in-out infinite;
      }
      @keyframes floorWave {
        0%, 100% { opacity: 0.8; }
        50% { opacity: 1; }
      }
      
      /* 深海海沟 */
      .deep-sea-trench {
        position: absolute;
        bottom: 0;
        left: 30%;
        width: 40%;
        height: 150px;
        background: linear-gradient(to top,
          rgba(0, 0, 20, 0.98),
          rgba(0, 10, 40, 0.7),
          transparent);
        border-radius: 50% 50% 0 0;
        animation: trenchDark 5s ease-in-out infinite;
      }
      @keyframes trenchDark {
        0%, 100% { opacity: 0.9; transform: scaleX(1); }
        50% { opacity: 1; transform: scaleX(1.1); }
      }
      
      /* 巨型海啸浪 */
      .mega-tsunami-wave {
        position: absolute;
        bottom: 0;
        width: 600px;
        height: 350px;
        background: linear-gradient(135deg,
          transparent 0%,
          rgba(0, 100, 200, 0.6) 30%,
          rgba(0, 150, 255, 0.85) 60%,
          rgba(100, 200, 255, 0.95) 90%,
          rgba(200, 240, 255, 1) 100%);
        clip-path: path('M 0,350 Q 150,250 300,200 T 600,150 L 600,350 Z');
        animation: tsunamiRise 4s ease-in-out infinite;
        box-shadow: 
          0 -20px 80px rgba(0, 150, 255, 0.7),
          0 -40px 120px rgba(0, 100, 200, 0.5);
        filter: blur(3px);
      }
      @keyframes tsunamiRise {
        0% { transform: translateY(100%) scaleY(0.5); opacity: 0; }
        50% { opacity: 1; }
        100% { transform: translateY(-50px) scaleY(1.2); opacity: 0.9; }
      }
      .wave-1 { left: -100px; animation-delay: 0s; }
      .wave-2 { left: 10%; animation-delay: 1s; }
      .wave-3 { right: 10%; animation-delay: 2s; }
      
      /* 海啸浪尖 */
      .tsunami-crest {
        position: absolute;
        top: 20%;
        width: 300px;
        height: 80px;
        background: linear-gradient(90deg,
          transparent,
          rgba(200, 240, 255, 0.9),
          rgba(255, 255, 255, 1),
          rgba(200, 240, 255, 0.9),
          transparent);
        border-radius: 50%;
        animation: crestRoll 3s ease-in-out infinite;
        box-shadow: 0 0 60px rgba(255, 255, 255, 0.8);
        filter: blur(5px);
      }
      @keyframes crestRoll {
        0% { transform: translateX(-100%) rotate(0deg); opacity: 0; }
        50% { opacity: 1; }
        100% { transform: translateX(200%) rotate(360deg); opacity: 0; }
      }
      .crest-1 { animation-delay: 0s; }
      .crest-2 { animation-delay: 1.5s; }
      
      /* 巨大漩涡 */
      .giant-whirlpool {
        position: absolute;
        width: 250px;
        height: 250px;
        background: conic-gradient(
          from 0deg,
          transparent,
          rgba(0, 80, 160, 0.8) 30%,
          rgba(0, 120, 200, 0.9) 60%,
          transparent);
        border-radius: 50%;
        animation: whirlpoolSpin 3s linear infinite;
        box-shadow: 
          inset 0 0 80px rgba(0, 50, 100, 0.9),
          0 0 100px rgba(0, 100, 200, 0.6);
      }
      @keyframes whirlpoolSpin {
        0% { transform: rotate(0deg) scale(0.8); opacity: 0; }
        50% { opacity: 1; }
        100% { transform: rotate(360deg) scale(1.2); opacity: 0; }
      }
      .vortex-1 { left: 20%; top: 40%; animation-delay: 0s; }
      .vortex-2 { right: 20%; top: 50%; animation-delay: 1s; }
      .vortex-3 { left: 50%; top: 30%; animation-delay: 2s; }
      
      /* 水龙卷 */
      .water-tornado {
        position: absolute;
        width: 120px;
        height: 400px;
        background: linear-gradient(to top,
          rgba(0, 100, 200, 0.9),
          rgba(0, 150, 255, 0.8),
          rgba(100, 200, 255, 0.6),
          rgba(200, 240, 255, 0.3),
          transparent);
        clip-path: polygon(40% 0%, 60% 0%, 70% 100%, 30% 100%);
        animation: tornadoTwist 4s ease-in-out infinite;
        box-shadow: 
          0 0 60px rgba(0, 150, 255, 0.8),
          0 0 100px rgba(0, 100, 200, 0.5);
        filter: blur(8px);
      }
      @keyframes tornadoTwist {
        0% { transform: translateY(100%) rotate(0deg) scaleY(0.5); opacity: 0; }
        50% { opacity: 1; }
        100% { transform: translateY(-20%) rotate(720deg) scaleY(1.5); opacity: 0; }
      }
      .tornado-1 { left: 15%; animation-delay: 0.5s; }
      .tornado-2 { right: 15%; animation-delay: 2s; }
      
      /* 强大洋流 */
      .powerful-current {
        position: absolute;
        width: 400px;
        height: 60px;
        background: linear-gradient(90deg,
          transparent,
          rgba(0, 120, 220, 0.7),
          rgba(50, 180, 255, 0.85),
          rgba(0, 120, 220, 0.7),
          transparent);
        border-radius: 50%;
        animation: currentFlow 5s linear infinite;
        box-shadow: 0 0 40px rgba(50, 180, 255, 0.6);
        filter: blur(10px);
      }
      @keyframes currentFlow {
        0% { transform: translateX(-100%); opacity: 0; }
        50% { opacity: 0.9; }
        100% { transform: translateX(200%); opacity: 0; }
      }
      .current-1 { top: 30%; animation-delay: 0s; }
      .current-2 { top: 50%; animation-delay: 1.2s; }
      .current-3 { top: 70%; animation-delay: 2.4s; }
      .current-4 { top: 60%; animation-delay: 3.6s; }
      
      /* 巨大水球 */
      .massive-water-sphere {
        position: absolute;
        width: 150px;
        height: 150px;
        background: radial-gradient(circle,
          rgba(100, 200, 255, 1),
          rgba(50, 150, 255, 0.9),
          rgba(0, 100, 200, 0.6),
          transparent);
        border-radius: 50%;
        animation: waterSpherePulse 3s ease-in-out infinite;
        box-shadow: 
          0 0 80px rgba(100, 200, 255, 0.8),
          inset 0 0 60px rgba(200, 240, 255, 0.5);
      }
      @keyframes waterSpherePulse {
        0%, 100% { transform: scale(0.8) translateY(0); opacity: 0.7; }
        50% { transform: scale(1.2) translateY(-20px); opacity: 1; }
      }
      .sphere-1 { left: 10%; top: 25%; animation-delay: 0s; }
      .sphere-2 { right: 10%; top: 35%; animation-delay: 1s; }
      .sphere-3 { left: 50%; top: 45%; animation-delay: 2s; }
      
      /* 水柱 */
      .hydro-pillar {
        position: absolute;
        left: 50%;
        bottom: 0;
        width: 100px;
        height: 400px;
        margin-left: -50px;
        background: linear-gradient(to top,
          rgba(50, 150, 255, 1),
          rgba(100, 200, 255, 0.95),
          rgba(150, 220, 255, 0.8),
          rgba(200, 240, 255, 0.5),
          transparent);
        animation: pillarBlast 3s ease-out infinite;
        box-shadow: 
          0 0 80px rgba(100, 200, 255, 1),
          0 0 150px rgba(50, 150, 255, 0.8);
        filter: blur(5px) brightness(1.3);
      }
      @keyframes pillarBlast {
        0% { transform: translateY(100%) scaleY(0); opacity: 0; }
        30% { opacity: 1; }
        100% { transform: translateY(-50%) scaleY(1.5); opacity: 0; }
      }
      .pillar-1 { animation-delay: 0s; margin-left: -70px; }
      .pillar-2 { animation-delay: 1.5s; margin-left: -30px; }
      
      /* 暴风云 */
      .storm-cloud {
        position: absolute;
        top: 0;
        width: 300px;
        height: 100px;
        background: radial-gradient(ellipse,
          rgba(20, 30, 60, 0.95),
          rgba(30, 50, 80, 0.85),
          rgba(40, 60, 90, 0.6),
          transparent);
        border-radius: 50%;
        animation: cloudDrift 8s ease-in-out infinite;
        filter: blur(15px);
      }
      @keyframes cloudDrift {
        0% { transform: translateX(-50px); opacity: 0.6; }
        50% { transform: translateX(50px); opacity: 1; }
        100% { transform: translateX(-50px); opacity: 0.6; }
      }
      .cloud-1 { left: 10%; animation-delay: 0s; }
      .cloud-2 { left: 40%; animation-delay: 2.5s; }
      .cloud-3 { right: 10%; animation-delay: 5s; }
      
      /* 海洋闪电 */
      .ocean-lightning {
        position: absolute;
        top: 5%;
        width: 8px;
        height: 300px;
        background: linear-gradient(to bottom,
          rgba(255, 255, 255, 1),
          rgba(150, 200, 255, 0.95),
          rgba(100, 150, 255, 0.9),
          rgba(50, 100, 200, 0.7),
          transparent);
        animation: lightningStrike 4s ease-out infinite;
        box-shadow: 
          0 0 60px rgba(255, 255, 255, 1),
          0 0 100px rgba(150, 200, 255, 0.8);
        filter: brightness(2);
        clip-path: polygon(
          45% 0%, 55% 0%,
          48% 30%, 52% 30%,
          40% 35%, 60% 35%,
          47% 60%, 53% 60%,
          45% 90%, 55% 90%,
          50% 100%, 50% 100%
        );
      }
      @keyframes lightningStrike {
        0%, 90%, 100% { opacity: 0; }
        91%, 93%, 95% { opacity: 1; }
        92%, 94%, 96% { opacity: 0.3; }
      }
      .bolt-1 { left: 20%; animation-delay: 0s; }
      .bolt-2 { left: 40%; animation-delay: 0.8s; }
      .bolt-3 { left: 60%; animation-delay: 1.6s; }
      .bolt-4 { left: 80%; animation-delay: 2.4s; }
      .bolt-5 { left: 50%; animation-delay: 3.2s; }
      
      /* 始源脉冲环 */
      .origin-pulse-ring {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 400px;
        height: 400px;
        margin: -200px 0 0 -200px;
        border: 6px solid rgba(0, 150, 255, 0.9);
        border-radius: 50%;
        animation: pulseRingExpand 3s ease-out infinite;
        box-shadow: 
          0 0 80px rgba(0, 150, 255, 0.9),
          inset 0 0 60px rgba(100, 200, 255, 0.5);
      }
      @keyframes pulseRingExpand {
        0% { transform: scale(0); opacity: 1; }
        100% { transform: scale(2); opacity: 0; }
      }
      .ring-1 { animation-delay: 0s; }
      .ring-2 { animation-delay: 1s; }
      .ring-3 { animation-delay: 2s; }
      
      /* 原始能量 */
      .primordial-energy {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 300px;
        height: 300px;
        margin: -150px 0 0 -150px;
        background: radial-gradient(circle,
          rgba(0, 200, 255, 0.8),
          rgba(0, 150, 255, 0.5),
          rgba(0, 100, 200, 0.3),
          transparent);
        border-radius: 50%;
        animation: energyGlow 4s ease-in-out infinite;
        box-shadow: 0 0 150px rgba(0, 150, 255, 0.9);
      }
      @keyframes energyGlow {
        0%, 100% { transform: scale(0.9); opacity: 0.6; filter: brightness(1); }
        50% { transform: scale(1.1); opacity: 1; filter: brightness(1.5); }
      }
      
      /* 水花飞溅 */
      .water-splash {
        position: absolute;
        width: 80px;
        height: 80px;
        background: radial-gradient(circle,
          rgba(200, 240, 255, 1),
          rgba(150, 220, 255, 0.9),
          rgba(100, 200, 255, 0.6),
          transparent);
        border-radius: 50%;
        animation: splashFly 2.5s ease-out infinite;
        box-shadow: 0 0 40px rgba(200, 240, 255, 0.8);
        filter: blur(5px);
      }
      @keyframes splashFly {
        0% { transform: translate(0, 100px) scale(0.3); opacity: 0; }
        30% { opacity: 1; }
        100% { transform: translate(var(--splashX, 80px), var(--splashY, -150px)) scale(1.2); opacity: 0; }
      }
      .splash-1 { left: 30%; bottom: 30%; --splashX: -100px; --splashY: -180px; animation-delay: 0s; }
      .splash-2 { left: 50%; bottom: 30%; --splashX: 90px; --splashY: -160px; animation-delay: 0.4s; }
      .splash-3 { left: 70%; bottom: 30%; --splashX: -80px; --splashY: -170px; animation-delay: 0.8s; }
      .splash-4 { left: 40%; bottom: 30%; --splashX: 100px; --splashY: -150px; animation-delay: 1.2s; }
      .splash-5 { left: 60%; bottom: 30%; --splashX: -110px; --splashY: -160px; animation-delay: 1.6s; }
      .splash-6 { left: 45%; bottom: 30%; --splashX: 70px; --splashY: -190px; animation-delay: 2s; }
      
      /* 深海气泡 */
      .deep-sea-bubble {
        position: absolute;
        bottom: 0;
        width: 50px;
        height: 50px;
        background: radial-gradient(circle,
          rgba(150, 220, 255, 0.8),
          rgba(100, 200, 255, 0.6),
          rgba(50, 150, 255, 0.3),
          transparent);
        border-radius: 50%;
        animation: bubbleRise 5s ease-in infinite;
        box-shadow: 
          inset -10px -10px 20px rgba(200, 240, 255, 0.6),
          0 0 30px rgba(100, 200, 255, 0.4);
      }
      @keyframes bubbleRise {
        0% { transform: translateY(0) scale(0.5); opacity: 0; }
        20% { opacity: 0.8; }
        100% { transform: translateY(-600px) scale(1.2); opacity: 0; }
      }
      .bubble-1 { left: 15%; animation-delay: 0s; }
      .bubble-2 { left: 30%; animation-delay: 1s; }
      .bubble-3 { left: 50%; animation-delay: 2s; }
      .bubble-4 { left: 70%; animation-delay: 3s; }
      .bubble-5 { left: 85%; animation-delay: 4s; }
      
      /* 潮汐墙 */
      .tidal-wall {
        position: absolute;
        left: 0;
        bottom: 0;
        width: 100%;
        height: 500px;
        background: linear-gradient(to top,
          rgba(0, 80, 160, 0.95),
          rgba(0, 120, 200, 0.85),
          rgba(50, 150, 255, 0.7),
          rgba(100, 200, 255, 0.4),
          transparent);
        animation: tidalRise 6s ease-in-out infinite;
        box-shadow: 0 -30px 100px rgba(0, 150, 255, 0.7);
      }
      @keyframes tidalRise {
        0%, 100% { transform: translateY(50%); opacity: 0.6; }
        50% { transform: translateY(0); opacity: 1; }
      }
      
      /* 水压炮 */
      .hydro-pump-blast {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 200px;
        height: 80px;
        margin: -40px 0 0 -100px;
        background: linear-gradient(90deg,
          rgba(100, 200, 255, 1),
          rgba(150, 220, 255, 0.95),
          rgba(200, 240, 255, 0.9),
          transparent);
        animation: hydroBlast 2s ease-out infinite;
        box-shadow: 0 0 80px rgba(100, 200, 255, 1);
        filter: blur(10px) brightness(1.5);
      }
      @keyframes hydroBlast {
        0% { transform: translateX(-200px) scaleX(0); opacity: 0; }
        30% { opacity: 1; }
        100% { transform: translateX(300px) scaleX(2); opacity: 0; }
      }
      
      /* 海洋主权 */
      .ocean-sovereignty {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background: radial-gradient(circle at center,
          transparent 30%,
          rgba(0, 100, 200, 0.3) 60%,
          rgba(0, 150, 255, 0.5) 100%);
        animation: sovereignPulse 5s ease-in-out infinite;
      }
      @keyframes sovereignPulse {
        0%, 100% { opacity: 0.5; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.05); }
      }
      
      /* 原始回归光芒 */
      .primal-reversion-glow {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 500px;
        height: 500px;
        margin: -250px 0 0 -250px;
        background: radial-gradient(circle,
          rgba(0, 200, 255, 0.7),
          rgba(0, 150, 255, 0.4),
          transparent);
        border-radius: 50%;
        animation: primalGlow 4s ease-in-out infinite;
        box-shadow: 0 0 200px rgba(0, 150, 255, 0.9);
      }
      @keyframes primalGlow {
        0%, 100% { transform: scale(0.8) rotate(0deg); opacity: 0.4; }
        50% { transform: scale(1.2) rotate(180deg); opacity: 1; }
      }

      /* ========== 烈空座 - 天空龙卷场景 ========== */
      
      /* 天空之柱底座 */
      .sky-pillar-base {
        position: absolute;
        left: 50%;
        bottom: 0;
        width: 300px;
        height: 200px;
        margin-left: -150px;
        background: linear-gradient(to top,
          rgba(60, 80, 100, 0.95),
          rgba(70, 90, 110, 0.85),
          rgba(80, 100, 120, 0.7));
        clip-path: polygon(30% 100%, 70% 100%, 60% 0%, 40% 0%);
        box-shadow: 0 0 60px rgba(80, 120, 140, 0.6);
        animation: pillarVibrate 4s ease-in-out infinite;
      }
      @keyframes pillarVibrate {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }
      
      /* 天空之柱塔 */
      .sky-pillar-tower {
        position: absolute;
        left: 50%;
        width: 150px;
        height: 350px;
        margin-left: -75px;
        background: linear-gradient(to top,
          rgba(70, 90, 120, 0.95),
          rgba(80, 110, 140, 0.9),
          rgba(90, 130, 160, 0.8),
          rgba(100, 150, 180, 0.6));
        clip-path: polygon(35% 100%, 65% 100%, 55% 0%, 45% 0%);
        box-shadow: 
          0 0 40px rgba(100, 150, 180, 0.7),
          inset 0 0 30px rgba(120, 170, 200, 0.4);
        animation: towerSway 5s ease-in-out infinite;
      }
      @keyframes towerSway {
        0%, 100% { transform: rotate(-1deg); }
        50% { transform: rotate(1deg); }
      }
      .tower-1 { bottom: 200px; animation-delay: 0s; opacity: 0.95; }
      .tower-2 { bottom: 400px; animation-delay: 0.5s; opacity: 0.85; width: 120px; margin-left: -60px; }
      .tower-3 { bottom: 550px; animation-delay: 1s; opacity: 0.75; width: 100px; margin-left: -50px; height: 200px; }
      
      /* 柱周云朵 */
      .pillar-cloud {
        position: absolute;
        width: 200px;
        height: 80px;
        background: radial-gradient(ellipse,
          rgba(200, 220, 240, 0.8),
          rgba(150, 180, 210, 0.6),
          transparent);
        border-radius: 50%;
        animation: cloudFloat 6s ease-in-out infinite;
        filter: blur(12px);
      }
      @keyframes cloudFloat {
        0%, 100% { transform: translateX(-30px); opacity: 0.6; }
        50% { transform: translateX(30px); opacity: 1; }
      }
      .cloud-1 { left: 20%; top: 40%; animation-delay: 0s; }
      .cloud-2 { right: 20%; top: 50%; animation-delay: 2s; }
      
      /* 巨大龙卷风 */
      .mega-dragon-tornado {
        position: absolute;
        bottom: 0;
        width: 200px;
        height: 600px;
        background: conic-gradient(
          from 0deg,
          rgba(80, 150, 180, 0.9),
          rgba(100, 170, 200, 0.8),
          rgba(120, 190, 220, 0.7),
          rgba(80, 150, 180, 0.9));
        clip-path: polygon(30% 0%, 70% 0%, 90% 100%, 10% 100%);
        animation: dragonTornadoSpin 3s linear infinite;
        box-shadow: 
          0 0 100px rgba(100, 170, 200, 0.8),
          inset 0 0 80px rgba(150, 210, 240, 0.5);
        filter: blur(8px);
      }
      @keyframes dragonTornadoSpin {
        0% { transform: rotate(0deg) scale(1); opacity: 0.8; }
        50% { opacity: 1; }
        100% { transform: rotate(360deg) scale(1.1); opacity: 0.8; }
      }
      .tornado-1 { left: 10%; animation-delay: 0s; }
      .tornado-2 { left: 50%; animation-delay: 1s; }
      .tornado-3 { right: 10%; animation-delay: 2s; }
      
      /* 龙卷碎片 */
      .tornado-debris {
        position: absolute;
        width: 40px;
        height: 40px;
        background: rgba(120, 120, 140, 0.8);
        clip-path: polygon(30% 0%, 70% 20%, 80% 80%, 20% 100%, 0% 40%);
        animation: debrisSwirl 4s ease-out infinite;
        box-shadow: 0 0 20px rgba(100, 100, 120, 0.6);
      }
      @keyframes debrisSwirl {
        0% { transform: translate(0, 600px) rotate(0deg); opacity: 0; }
        50% { opacity: 1; }
        100% { transform: translate(var(--debrisX, 100px), var(--debrisY, -300px)) rotate(720deg); opacity: 0; }
      }
      .debris-1 { left: 20%; bottom: 0; --debrisX: 80px; --debrisY: -400px; animation-delay: 0s; }
      .debris-2 { left: 40%; bottom: 0; --debrisX: -90px; --debrisY: -450px; animation-delay: 1s; }
      .debris-3 { left: 60%; bottom: 0; --debrisX: 70px; --debrisY: -420px; animation-delay: 2s; }
      .debris-4 { left: 80%; bottom: 0; --debrisX: -100px; --debrisY: -380px; animation-delay: 3s; }
      
      /* 巨大流星 */
      .giant-meteor {
        position: absolute;
        width: 100px;
        height: 100px;
        background: radial-gradient(circle,
          rgba(255, 200, 100, 1),
          rgba(255, 150, 50, 0.95),
          rgba(255, 100, 0, 0.8),
          rgba(200, 80, 20, 0.5));
        border-radius: 50%;
        clip-path: polygon(40% 0%, 100% 30%, 80% 80%, 30% 100%, 0% 60%, 20% 20%);
        animation: meteorFall 4s ease-in infinite;
        box-shadow: 
          0 0 80px rgba(255, 150, 50, 1),
          0 0 120px rgba(255, 100, 0, 0.8);
        filter: brightness(1.5);
      }
      @keyframes meteorFall {
        0% { transform: translate(-200px, -300px) rotate(0deg) scale(0.3); opacity: 0; }
        20% { opacity: 1; }
        80% { opacity: 0.9; }
        100% { transform: translate(var(--meteorX, 300px), var(--meteorY, 400px)) rotate(180deg) scale(1.2); opacity: 0; }
      }
      .meteor-1 { animation-delay: 0s; --meteorX: 250px; --meteorY: 450px; }
      .meteor-2 { animation-delay: 1s; --meteorX: 350px; --meteorY: 400px; }
      .meteor-3 { animation-delay: 2s; --meteorX: 200px; --meteorY: 480px; }
      .meteor-4 { animation-delay: 3s; --meteorX: 320px; --meteorY: 420px; }
      
      /* 流星爆炸 */
      .meteor-explosion {
        position: absolute;
        width: 150px;
        height: 150px;
        background: radial-gradient(circle,
          rgba(255, 255, 200, 1),
          rgba(255, 200, 100, 0.9),
          rgba(255, 150, 50, 0.7),
          transparent);
        border-radius: 50%;
        animation: explosionBlast 2s ease-out infinite;
        box-shadow: 0 0 100px rgba(255, 200, 100, 1);
        filter: brightness(2);
      }
      @keyframes explosionBlast {
        0% { transform: scale(0); opacity: 1; }
        100% { transform: scale(3); opacity: 0; }
      }
      .explosion-1 { left: 30%; top: 40%; animation-delay: 1.8s; }
      .explosion-2 { right: 30%; top: 50%; animation-delay: 3.8s; }
      
      /* 炽热尾迹 */
      .blazing-trail {
        position: absolute;
        width: 300px;
        height: 40px;
        background: linear-gradient(90deg,
          rgba(255, 200, 100, 1),
          rgba(255, 150, 50, 0.9),
          rgba(255, 100, 0, 0.7),
          transparent);
        border-radius: 50%;
        animation: trailStreak 3s ease-out infinite;
        box-shadow: 0 0 60px rgba(255, 150, 50, 0.9);
        filter: blur(8px);
      }
      @keyframes trailStreak {
        0% { transform: translate(-400px, -200px) rotate(-45deg) scaleX(0); opacity: 0; }
        30% { opacity: 1; }
        100% { transform: translate(var(--trailX, 300px), var(--trailY, 300px)) rotate(-45deg) scaleX(1); opacity: 0; }
      }
      .trail-1 { animation-delay: 0.2s; --trailX: 280px; --trailY: 320px; }
      .trail-2 { animation-delay: 1.2s; --trailX: 350px; --trailY: 280px; }
      .trail-3 { animation-delay: 2.2s; --trailX: 250px; --trailY: 350px; }
      .trail-4 { animation-delay: 0.8s; --trailX: 320px; --trailY: 300px; }
      .trail-5 { animation-delay: 1.8s; --trailX: 290px; --trailY: 330px; }
      .trail-6 { animation-delay: 2.8s; --trailX: 310px; --trailY: 310px; }
      
      /* 臭氧护盾 */
      .ozone-shield {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 400px;
        height: 400px;
        margin: -200px 0 0 -200px;
        border: 3px solid rgba(100, 200, 220, 0.7);
        border-radius: 50%;
        animation: shieldRotate 8s linear infinite;
        box-shadow: 
          0 0 60px rgba(100, 200, 220, 0.6),
          inset 0 0 40px rgba(150, 220, 240, 0.3);
      }
      @keyframes shieldRotate {
        0% { transform: rotate(0deg); opacity: 0.6; }
        50% { opacity: 1; }
        100% { transform: rotate(360deg); opacity: 0.6; }
      }
      .shield-1 { animation-delay: 0s; }
      .shield-2 { animation-delay: 2.5s; width: 450px; height: 450px; margin: -225px 0 0 -225px; }
      .shield-3 { animation-delay: 5s; width: 350px; height: 350px; margin: -175px 0 0 -175px; }
      
      /* 臭氧粒子 */
      .ozone-particle {
        position: absolute;
        width: 20px;
        height: 20px;
        background: radial-gradient(circle,
          rgba(150, 220, 240, 1),
          rgba(100, 200, 220, 0.8),
          transparent);
        border-radius: 50%;
        animation: particleOrbit 6s linear infinite;
        box-shadow: 0 0 30px rgba(150, 220, 240, 0.8);
      }
      @keyframes particleOrbit {
        0% { transform: rotate(0deg) translateX(200px) rotate(0deg); opacity: 0.7; }
        50% { opacity: 1; }
        100% { transform: rotate(360deg) translateX(200px) rotate(-360deg); opacity: 0.7; }
      }
      .particle-1 { left: 50%; top: 50%; animation-delay: 0s; }
      .particle-2 { left: 50%; top: 50%; animation-delay: 1.2s; }
      .particle-3 { left: 50%; top: 50%; animation-delay: 2.4s; }
      .particle-4 { left: 50%; top: 50%; animation-delay: 3.6s; }
      .particle-5 { left: 50%; top: 50%; animation-delay: 4.8s; }
      
      /* 龙之能量球 */
      .dragon-energy-sphere {
        position: absolute;
        width: 120px;
        height: 120px;
        background: radial-gradient(circle,
          rgba(100, 200, 255, 1),
          rgba(80, 180, 240, 0.9),
          rgba(60, 160, 220, 0.6),
          transparent);
        border-radius: 50%;
        animation: dragonEnergyPulse 3s ease-in-out infinite;
        box-shadow: 
          0 0 80px rgba(100, 200, 255, 0.9),
          inset 0 0 40px rgba(150, 220, 255, 0.6);
      }
      @keyframes dragonEnergyPulse {
        0%, 100% { transform: scale(0.9); opacity: 0.7; }
        50% { transform: scale(1.2); opacity: 1; }
      }
      .sphere-1 { left: 20%; top: 30%; animation-delay: 0s; }
      .sphere-2 { right: 20%; top: 40%; animation-delay: 1s; }
      .sphere-3 { left: 50%; top: 25%; animation-delay: 2s; }
      
      /* 龙之鳞片 */
      .dragon-scale {
        position: absolute;
        width: 60px;
        height: 80px;
        background: linear-gradient(135deg,
          rgba(80, 180, 200, 0.9),
          rgba(100, 200, 220, 0.8),
          rgba(120, 220, 240, 0.6));
        clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
        animation: scaleFloat 4s ease-in-out infinite;
        box-shadow: 0 0 40px rgba(100, 200, 220, 0.7);
        filter: brightness(1.3);
      }
      @keyframes scaleFloat {
        0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.7; }
        50% { transform: translateY(-50px) rotate(180deg); opacity: 1; }
      }
      .scale-1 { left: 25%; top: 50%; animation-delay: 0s; }
      .scale-2 { left: 60%; top: 45%; animation-delay: 1.3s; }
      .scale-3 { left: 75%; top: 55%; animation-delay: 2.6s; }
      
      /* 画龙点睛光束 */
      .dragon-ascent-beam {
        position: absolute;
        left: 50%;
        bottom: 0;
        width: 120px;
        height: 700px;
        margin-left: -60px;
        background: linear-gradient(to top,
          rgba(100, 220, 255, 1),
          rgba(120, 230, 255, 0.95),
          rgba(150, 240, 255, 0.85),
          rgba(180, 250, 255, 0.6),
          transparent);
        animation: ascentBeam 4s ease-out infinite;
        box-shadow: 
          0 0 100px rgba(120, 230, 255, 1),
          0 0 180px rgba(100, 220, 255, 0.8);
        filter: blur(5px) brightness(1.6);
      }
      @keyframes ascentBeam {
        0% { transform: translateY(100%) scaleY(0); opacity: 0; }
        50% { opacity: 1; }
        100% { transform: translateY(-20%) scaleY(1.3); opacity: 0; }
      }
      
      /* 龙之波动波纹 */
      .dragon-pulse-wave {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 350px;
        height: 350px;
        margin: -175px 0 0 -175px;
        border: 5px solid rgba(100, 200, 255, 0.8);
        border-radius: 50%;
        animation: pulseWaveExpand 3s ease-out infinite;
        box-shadow: 0 0 80px rgba(100, 200, 255, 0.8);
      }
      @keyframes pulseWaveExpand {
        0% { transform: scale(0); opacity: 1; }
        100% { transform: scale(2.5); opacity: 0; }
      }
      .wave-1 { animation-delay: 0s; }
      .wave-2 { animation-delay: 1s; }
      .wave-3 { animation-delay: 2s; }
      
      /* MEGA进化光环 */
      .mega-evolution-aura {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 450px;
        height: 450px;
        margin: -225px 0 0 -225px;
        background: radial-gradient(circle,
          rgba(100, 255, 200, 0.7),
          rgba(80, 220, 180, 0.5),
          transparent);
        border-radius: 50%;
        animation: megaAuraGlow 4s ease-in-out infinite;
        box-shadow: 0 0 150px rgba(100, 255, 200, 0.9);
      }
      @keyframes megaAuraGlow {
        0%, 100% { transform: scale(0.9) rotate(0deg); opacity: 0.5; }
        50% { transform: scale(1.1) rotate(180deg); opacity: 1; }
      }
      
      /* MEGA石光芒 */
      .mega-stone-glow {
        position: absolute;
        left: 50%;
        top: 40%;
        width: 60px;
        height: 60px;
        margin: -30px 0 0 -30px;
        background: radial-gradient(circle,
          rgba(255, 255, 255, 1),
          rgba(200, 255, 200, 0.9),
          rgba(100, 255, 200, 0.6),
          transparent);
        border-radius: 50%;
        animation: megaStoneShine 2s ease-in-out infinite;
        box-shadow: 0 0 100px rgba(200, 255, 200, 1);
        filter: brightness(2);
      }
      @keyframes megaStoneShine {
        0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.8; }
        50% { transform: scale(1.3) rotate(180deg); opacity: 1; }
      }
      
      /* 三角洲气流 */
      .delta-stream-wind {
        position: absolute;
        left: 0;
        top: 30%;
        width: 100%;
        height: 100px;
        background: linear-gradient(90deg,
          transparent,
          rgba(150, 220, 240, 0.6),
          rgba(100, 200, 220, 0.8),
          rgba(150, 220, 240, 0.6),
          transparent);
        animation: windFlow 5s linear infinite;
        filter: blur(15px);
      }
      @keyframes windFlow {
        0% { transform: translateX(-100%); opacity: 0; }
        50% { opacity: 1; }
        100% { transform: translateX(100%); opacity: 0; }
      }
      
      /* 气闸领域 */
      .air-lock-field {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background: radial-gradient(circle at center,
          transparent 40%,
          rgba(100, 200, 220, 0.2) 70%,
          rgba(80, 180, 200, 0.4) 100%);
        animation: airLockPulse 6s ease-in-out infinite;
      }
      @keyframes airLockPulse {
        0%, 100% { opacity: 0.4; transform: scale(1); }
        50% { opacity: 0.8; transform: scale(1.05); }
      }
      
      /* 神速尾迹 */
      .extreme-speed-trail {
        position: absolute;
        width: 400px;
        height: 30px;
        background: linear-gradient(90deg,
          transparent,
          rgba(200, 240, 255, 0.9),
          rgba(255, 255, 255, 1),
          rgba(200, 240, 255, 0.9),
          transparent);
        animation: speedTrail 1.5s ease-out infinite;
        box-shadow: 0 0 60px rgba(255, 255, 255, 0.9);
        filter: blur(10px);
      }
      @keyframes speedTrail {
        0% { transform: translateX(-100%) translateY(var(--speedY, 200px)); opacity: 0; }
        50% { opacity: 1; }
        100% { transform: translateX(200%) translateY(var(--speedY, 200px)); opacity: 0; }
      }
      
      /* 天空霸主光环 */
      .sky-lord-corona {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 600px;
        height: 600px;
        margin: -300px 0 0 -300px;
        background: radial-gradient(circle,
          transparent 50%,
          rgba(100, 220, 255, 0.5) 70%,
          rgba(80, 200, 240, 0.7) 85%,
          transparent 100%);
        border-radius: 50%;
        animation: coronaExpand 5s ease-in-out infinite;
        box-shadow: 0 0 200px rgba(100, 220, 255, 0.8);
      }
      @keyframes coronaExpand {
        0%, 100% { transform: scale(0.95) rotate(0deg); opacity: 0.5; }
        50% { transform: scale(1.05) rotate(360deg); opacity: 1; }
      }

      /* ========== 基拉祈 - 千年彗星星空场景 ========== */
      
      /* 星空层 */
      .starfield-layer {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-image: 
          radial-gradient(2px 2px at 20% 30%, white, transparent),
          radial-gradient(2px 2px at 60% 70%, white, transparent),
          radial-gradient(1px 1px at 50% 50%, white, transparent),
          radial-gradient(1px 1px at 80% 10%, white, transparent),
          radial-gradient(2px 2px at 90% 60%, white, transparent),
          radial-gradient(1px 1px at 33% 80%, white, transparent);
        background-size: 200% 200%;
        animation: starfieldTwinkle 8s ease-in-out infinite;
      }
      @keyframes starfieldTwinkle {
        0%, 100% { opacity: 0.6; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.05); }
      }
      .layer-1 { animation-delay: 0s; }
      .layer-2 { animation-delay: 2.5s; opacity: 0.8; }
      .layer-3 { animation-delay: 5s; opacity: 0.7; }
      
      /* 巨大千年彗星 */
      .giant-millennium-comet {
        position: absolute;
        width: 150px;
        height: 150px;
        background: radial-gradient(circle,
          rgba(255, 255, 255, 1),
          rgba(200, 200, 255, 0.95),
          rgba(150, 150, 255, 0.85),
          rgba(100, 100, 200, 0.6),
          transparent);
        border-radius: 50%;
        animation: cometGlow 3s ease-in-out infinite;
        box-shadow: 
          0 0 120px rgba(200, 200, 255, 1),
          0 0 180px rgba(150, 150, 255, 0.8);
        filter: brightness(1.8);
      }
      @keyframes cometGlow {
        0%, 100% { transform: scale(1); opacity: 0.9; }
        50% { transform: scale(1.15); opacity: 1; }
      }
      .comet-1 { left: 20%; top: 15%; animation-delay: 0s; }
      .comet-2 { right: 25%; top: 25%; animation-delay: 1.5s; }
      
      /* 彗星核心 */
      .comet-nucleus {
        position: absolute;
        width: 80px;
        height: 80px;
        background: radial-gradient(circle,
          rgba(255, 255, 255, 1),
          rgba(255, 255, 200, 0.95),
          rgba(200, 200, 255, 0.8),
          transparent);
        border-radius: 50%;
        animation: nucleusPulse 2s ease-in-out infinite;
        box-shadow: 
          0 0 80px rgba(255, 255, 255, 1),
          inset 0 0 40px rgba(255, 255, 200, 0.8);
        filter: brightness(2);
      }
      @keyframes nucleusPulse {
        0%, 100% { transform: scale(0.9); }
        50% { transform: scale(1.1); }
      }
      .nucleus-1 { left: 20%; top: 15%; animation-delay: 0s; }
      .nucleus-2 { right: 25%; top: 25%; animation-delay: 1.5s; }
      
      /* 巨大彗星尾迹 */
      .massive-comet-tail {
        position: absolute;
        width: 500px;
        height: 120px;
        background: linear-gradient(90deg,
          rgba(200, 200, 255, 0.95),
          rgba(150, 150, 255, 0.85),
          rgba(100, 100, 200, 0.6),
          rgba(80, 80, 180, 0.3),
          transparent);
        border-radius: 50%;
        animation: tailFlow 4s ease-out infinite;
        box-shadow: 0 0 100px rgba(150, 150, 255, 0.8);
        filter: blur(15px);
      }
      @keyframes tailFlow {
        0% { transform: scaleX(0.5); opacity: 0; }
        50% { opacity: 1; }
        100% { transform: scaleX(1.5); opacity: 0.7; }
      }
      .tail-1 { left: 20%; top: 15%; animation-delay: 0s; }
      .tail-2 { right: 25%; top: 25%; animation-delay: 1.5s; }
      .tail-3 { left: 15%; top: 20%; animation-delay: 3s; }
      
      /* 尾迹闪光 */
      .tail-sparkle {
        position: absolute;
        width: 30px;
        height: 30px;
        background: radial-gradient(circle,
          rgba(255, 255, 255, 1),
          rgba(200, 200, 255, 0.8),
          transparent);
        border-radius: 50%;
        animation: sparkleFlash 2s ease-in-out infinite;
        box-shadow: 0 0 60px rgba(255, 255, 255, 1);
        filter: brightness(2);
      }
      @keyframes sparkleFlash {
        0%, 100% { opacity: 0.5; transform: scale(0.8); }
        50% { opacity: 1; transform: scale(1.2); }
      }
      .sparkle-1 { left: 25%; top: 18%; animation-delay: 0s; }
      .sparkle-2 { right: 28%; top: 28%; animation-delay: 0.5s; }
      .sparkle-3 { left: 22%; top: 22%; animation-delay: 1s; }
      .sparkle-4 { right: 30%; top: 30%; animation-delay: 1.5s; }
      
      /* 流星许愿星 */
      .shooting-star {
        position: absolute;
        width: 4px;
        height: 4px;
        background: white;
        border-radius: 50%;
        box-shadow: 
          0 0 10px rgba(255, 255, 255, 1),
          -100px 0 50px rgba(200, 200, 255, 0.6);
        animation: shootingStar 3s linear infinite;
      }
      @keyframes shootingStar {
        0% { transform: translate(-100px, -100px); opacity: 0; }
        10% { opacity: 1; }
        90% { opacity: 1; }
        100% { transform: translate(800px, 600px); opacity: 0; }
      }
      .star-1 { left: 10%; top: 10%; animation-delay: 0s; }
      .star-2 { left: 30%; top: 5%; animation-delay: 0.8s; }
      .star-3 { left: 50%; top: 8%; animation-delay: 1.6s; }
      .star-4 { left: 70%; top: 12%; animation-delay: 2.4s; }
      .star-5 { left: 20%; top: 15%; animation-delay: 0.4s; }
      .star-6 { left: 60%; top: 10%; animation-delay: 1.2s; }
      .star-7 { left: 80%; top: 8%; animation-delay: 2s; }
      .star-8 { left: 40%; top: 12%; animation-delay: 2.8s; }
      .star-9 { left: 25%; top: 6%; animation-delay: 0.6s; }
      .star-10 { left: 75%; top: 14%; animation-delay: 2.2s; }
      
      /* 宇宙星尘 */
      .cosmic-stardust {
        position: absolute;
        width: 150px;
        height: 150px;
        background: radial-gradient(circle,
          rgba(180, 180, 255, 0.6),
          rgba(150, 150, 255, 0.4),
          rgba(120, 120, 200, 0.2),
          transparent);
        border-radius: 50%;
        animation: stardustFloat 6s ease-in-out infinite;
        filter: blur(20px);
      }
      @keyframes stardustFloat {
        0%, 100% { transform: translate(0, 0); opacity: 0.5; }
        50% { transform: translate(50px, -50px); opacity: 0.8; }
      }
      .dust-1 { left: 15%; top: 35%; animation-delay: 0s; }
      .dust-2 { right: 20%; top: 45%; animation-delay: 1s; }
      .dust-3 { left: 40%; top: 55%; animation-delay: 2s; }
      .dust-4 { right: 35%; top: 60%; animation-delay: 3s; }
      .dust-5 { left: 60%; top: 40%; animation-delay: 4s; }
      .dust-6 { right: 50%; top: 50%; animation-delay: 5s; }
      
      /* 许愿标签 */
      .wish-tag {
        position: absolute;
        width: 60px;
        height: 80px;
        background: linear-gradient(135deg,
          rgba(255, 255, 200, 0.9),
          rgba(255, 255, 150, 0.8),
          rgba(255, 220, 100, 0.7));
        clip-path: polygon(0% 0%, 100% 0%, 100% 80%, 50% 100%, 0% 80%);
        animation: tagWave 3s ease-in-out infinite;
        box-shadow: 0 0 40px rgba(255, 255, 200, 0.8);
      }
      @keyframes tagWave {
        0%, 100% { transform: rotate(-5deg) translateY(0); }
        50% { transform: rotate(5deg) translateY(-10px); }
      }
      .tag-1 { left: 30%; top: 50%; animation-delay: 0s; }
      .tag-2 { left: 45%; top: 48%; animation-delay: 0.4s; }
      .tag-3 { left: 55%; top: 52%; animation-delay: 0.8s; }
      .tag-4 { left: 70%; top: 50%; animation-delay: 1.2s; }
      .tag-5 { left: 35%; top: 55%; animation-delay: 1.6s; }
      .tag-6 { left: 60%; top: 55%; animation-delay: 2s; }
      .tag-7 { left: 50%; top: 58%; animation-delay: 2.4s; }
      
      /* 宇宙能量环 */
      .cosmic-energy-ring {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 400px;
        height: 400px;
        margin: -200px 0 0 -200px;
        border: 4px solid rgba(180, 180, 255, 0.8);
        border-radius: 50%;
        animation: cosmicRingPulse 4s ease-out infinite;
        box-shadow: 
          0 0 80px rgba(180, 180, 255, 0.8),
          inset 0 0 60px rgba(200, 200, 255, 0.5);
      }
      @keyframes cosmicRingPulse {
        0% { transform: scale(0.5) rotate(0deg); opacity: 1; }
        100% { transform: scale(2) rotate(180deg); opacity: 0; }
      }
      .ring-1 { animation-delay: 0s; }
      .ring-2 { animation-delay: 1.3s; }
      .ring-3 { animation-delay: 2.6s; }
      
      /* 宇宙力量光环 */
      .cosmic-power-aura {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 500px;
        height: 500px;
        margin: -250px 0 0 -250px;
        background: radial-gradient(circle,
          rgba(180, 180, 255, 0.6),
          rgba(150, 150, 255, 0.4),
          transparent);
        border-radius: 50%;
        animation: cosmicAuraGlow 5s ease-in-out infinite;
        box-shadow: 0 0 180px rgba(180, 180, 255, 0.9);
      }
      @keyframes cosmicAuraGlow {
        0%, 100% { transform: scale(0.9); opacity: 0.5; }
        50% { transform: scale(1.1); opacity: 1; }
      }
      
      /* 星座连线 */
      .constellation-line {
        position: absolute;
        width: 200px;
        height: 4px;
        background: linear-gradient(90deg,
          transparent,
          rgba(200, 200, 255, 0.8),
          transparent);
        animation: constellationGlow 4s ease-in-out infinite;
        box-shadow: 0 0 20px rgba(200, 200, 255, 0.6);
      }
      @keyframes constellationGlow {
        0%, 100% { opacity: 0.5; }
        50% { opacity: 1; }
      }
      .line-1 { left: 20%; top: 30%; transform: rotate(30deg); animation-delay: 0s; }
      .line-2 { right: 25%; top: 40%; transform: rotate(-45deg); animation-delay: 1.3s; }
      .line-3 { left: 35%; top: 60%; transform: rotate(60deg); animation-delay: 2.6s; }
      
      /* 星座星 */
      .constellation-star {
        position: absolute;
        width: 25px;
        height: 25px;
        background: radial-gradient(circle,
          rgba(255, 255, 255, 1),
          rgba(200, 200, 255, 0.8),
          transparent);
        border-radius: 50%;
        animation: constellationTwinkle 3s ease-in-out infinite;
        box-shadow: 0 0 50px rgba(255, 255, 255, 0.9);
      }
      @keyframes constellationTwinkle {
        0%, 100% { transform: scale(0.8); opacity: 0.7; }
        50% { transform: scale(1.2); opacity: 1; }
      }
      .con-star-1 { left: 20%; top: 28%; animation-delay: 0s; }
      .con-star-2 { left: 30%; top: 35%; animation-delay: 0.8s; }
      .con-star-3 { right: 25%; top: 38%; animation-delay: 1.6s; }
      .con-star-4 { right: 35%; top: 45%; animation-delay: 2.4s; }
      
      /* 千年愿望能量 */
      .millennium-wish-power {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 350px;
        height: 350px;
        margin: -175px 0 0 -175px;
        background: radial-gradient(circle,
          rgba(255, 255, 200, 0.8),
          rgba(255, 255, 150, 0.5),
          transparent);
        border-radius: 50%;
        animation: wishPowerExpand 6s ease-in-out infinite;
        box-shadow: 0 0 200px rgba(255, 255, 200, 1);
      }
      @keyframes wishPowerExpand {
        0%, 100% { transform: scale(0.8) rotate(0deg); opacity: 0.4; }
        50% { transform: scale(1.2) rotate(360deg); opacity: 1; }
      }
      
      /* 愿望实现之光 */
      .wish-granting-light {
        position: absolute;
        left: 50%;
        top: 0;
        width: 200px;
        height: 100%;
        margin-left: -100px;
        background: linear-gradient(to bottom,
          rgba(255, 255, 255, 1),
          rgba(255, 255, 200, 0.8),
          rgba(255, 255, 150, 0.5),
          transparent);
        animation: lightBeam 5s ease-in-out infinite;
        box-shadow: 0 0 150px rgba(255, 255, 255, 1);
        filter: blur(20px) brightness(1.5);
      }
      @keyframes lightBeam {
        0%, 100% { opacity: 0.3; transform: scaleY(0.8); }
        50% { opacity: 0.9; transform: scaleY(1.2); }
      }
      
      /* 破灭之愿球 */
      .doom-desire-sphere {
        position: absolute;
        left: 50%;
        top: 20%;
        width: 100px;
        height: 100px;
        margin-left: -50px;
        background: radial-gradient(circle,
          rgba(255, 200, 100, 1),
          rgba(255, 150, 50, 0.9),
          rgba(200, 100, 50, 0.6),
          transparent);
        border-radius: 50%;
        animation: doomSphereCharge 4s ease-in-out infinite;
        box-shadow: 
          0 0 100px rgba(255, 200, 100, 1),
          inset 0 0 50px rgba(255, 255, 200, 0.8);
      }
      @keyframes doomSphereCharge {
        0%, 100% { transform: scale(0.9); opacity: 0.8; }
        50% { transform: scale(1.2); opacity: 1; }
      }
      
      /* 破灭之愿爆炸 */
      .doom-desire-explosion {
        position: absolute;
        left: 50%;
        top: 20%;
        width: 200px;
        height: 200px;
        margin: -100px 0 0 -100px;
        background: radial-gradient(circle,
          rgba(255, 255, 200, 1),
          rgba(255, 200, 100, 0.8),
          rgba(255, 150, 50, 0.5),
          transparent);
        border-radius: 50%;
        animation: doomExplosion 6s ease-out infinite;
        box-shadow: 0 0 200px rgba(255, 200, 100, 1);
        filter: brightness(2);
      }
      @keyframes doomExplosion {
        0%, 70% { transform: scale(0); opacity: 0; }
        80% { transform: scale(1.5); opacity: 1; }
        100% { transform: scale(3); opacity: 0; }
      }
      
      /* 银河漩涡 */
      .galactic-spiral {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 600px;
        height: 600px;
        margin: -300px 0 0 -300px;
        background: conic-gradient(
          from 0deg,
          transparent,
          rgba(150, 150, 255, 0.3) 30%,
          rgba(180, 180, 255, 0.5) 50%,
          rgba(150, 150, 255, 0.3) 70%,
          transparent);
        border-radius: 50%;
        animation: spiralRotate 10s linear infinite;
        box-shadow: inset 0 0 100px rgba(180, 180, 255, 0.5);
      }
      @keyframes spiralRotate {
        0% { transform: rotate(0deg); opacity: 0.5; }
        50% { opacity: 0.8; }
        100% { transform: rotate(360deg); opacity: 0.5; }
      }
      
      /* 星云云团 */
      .nebula-cloud {
        position: absolute;
        width: 300px;
        height: 200px;
        background: radial-gradient(ellipse,
          rgba(180, 150, 255, 0.6),
          rgba(150, 120, 255, 0.4),
          rgba(120, 100, 200, 0.2),
          transparent);
        border-radius: 50%;
        animation: nebulaFloat 8s ease-in-out infinite;
        filter: blur(30px);
      }
      @keyframes nebulaFloat {
        0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.4; }
        50% { transform: translate(50px, -30px) scale(1.1); opacity: 0.7; }
      }
      .cloud-1 { left: 10%; top: 40%; animation-delay: 0s; }
      .cloud-2 { right: 15%; top: 50%; animation-delay: 4s; }

      /* ========== 代欧奇希斯 - 宇宙病毒场景 ========== */
      
      /* 深空虚空 */
      .deep-space-void {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background: radial-gradient(circle at center,
          rgba(20, 5, 40, 0.95),
          rgba(10, 2, 30, 0.98),
          rgba(5, 0, 20, 1));
        animation: voidPulse 6s ease-in-out infinite;
      }
      @keyframes voidPulse {
        0%, 100% { opacity: 0.9; }
        50% { opacity: 1; }
      }
      
      /* 远方星辰 */
      .distant-stars {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-image: 
          radial-gradient(1px 1px at 15% 25%, rgba(200, 150, 255, 0.8), transparent),
          radial-gradient(1px 1px at 45% 35%, rgba(180, 130, 255, 0.7), transparent),
          radial-gradient(1px 1px at 75% 45%, rgba(160, 110, 255, 0.6), transparent),
          radial-gradient(1px 1px at 25% 65%, rgba(200, 150, 255, 0.8), transparent),
          radial-gradient(1px 1px at 85% 75%, rgba(180, 130, 255, 0.7), transparent);
        animation: distantTwinkle 5s ease-in-out infinite;
      }
      @keyframes distantTwinkle {
        0%, 100% { opacity: 0.6; }
        50% { opacity: 1; }
      }
      .layer-1 { animation-delay: 0s; }
      .layer-2 { animation-delay: 2.5s; }
      
      /* 巨大陨石载体 */
      .giant-meteor-carrier {
        position: absolute;
        left: 50%;
        top: 30%;
        width: 250px;
        height: 250px;
        margin-left: -125px;
        background: radial-gradient(circle,
          rgba(120, 80, 140, 0.95),
          rgba(100, 60, 120, 0.9),
          rgba(80, 40, 100, 0.8),
          rgba(60, 30, 80, 0.6));
        border-radius: 50%;
        clip-path: polygon(30% 0%, 70% 5%, 95% 30%, 90% 70%, 60% 95%, 20% 90%, 5% 60%, 10% 25%);
        animation: meteorFloat 6s ease-in-out infinite;
        box-shadow: 
          0 0 100px rgba(140, 80, 200, 0.9),
          inset -20px -20px 60px rgba(60, 30, 80, 0.8);
      }
      @keyframes meteorFloat {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        50% { transform: translateY(-30px) rotate(5deg); }
      }
      
      /* 陨石裂缝 */
      .meteor-cracks {
        position: absolute;
        left: 50%;
        top: 30%;
        width: 200px;
        height: 8px;
        margin-left: -100px;
        background: linear-gradient(90deg,
          transparent,
          rgba(160, 80, 240, 1),
          rgba(140, 60, 220, 0.8),
          transparent);
        animation: crackGlow 3s ease-in-out infinite;
        box-shadow: 0 0 40px rgba(160, 80, 240, 1);
        filter: brightness(1.5);
      }
      @keyframes crackGlow {
        0%, 100% { opacity: 0.7; }
        50% { opacity: 1; }
      }
      .crack-1 { transform: rotate(30deg); animation-delay: 0s; }
      .crack-2 { transform: rotate(90deg); animation-delay: 1s; }
      .crack-3 { transform: rotate(150deg); animation-delay: 2s; }
      
      /* 病毒发光核心 */
      .virus-glow-core {
        position: absolute;
        left: 50%;
        top: 30%;
        width: 150px;
        height: 150px;
        margin: -75px 0 0 -75px;
        background: radial-gradient(circle,
          rgba(180, 80, 255, 1),
          rgba(160, 60, 240, 0.9),
          rgba(140, 40, 220, 0.7),
          transparent);
        border-radius: 50%;
        animation: virusCoreGlow 2s ease-in-out infinite;
        box-shadow: 
          0 0 150px rgba(180, 80, 255, 1),
          inset 0 0 80px rgba(200, 100, 255, 0.8);
        filter: brightness(1.8);
      }
      @keyframes virusCoreGlow {
        0%, 100% { transform: scale(1); opacity: 0.9; }
        50% { transform: scale(1.2); opacity: 1; }
      }
      
      /* 巨大DNA螺旋 */
      .massive-dna-helix {
        position: absolute;
        left: 50%;
        width: 120px;
        height: 600px;
        margin-left: -60px;
        background: repeating-linear-gradient(
          45deg,
          rgba(160, 80, 240, 0.8) 0px,
          rgba(140, 60, 220, 0.7) 20px,
          transparent 20px,
          transparent 40px);
        animation: helixRotate 8s linear infinite;
        box-shadow: 0 0 80px rgba(160, 80, 240, 0.8);
        filter: blur(3px);
      }
      @keyframes helixRotate {
        0% { transform: translateY(0) rotate(0deg); opacity: 0.7; }
        50% { opacity: 1; }
        100% { transform: translateY(-50px) rotate(360deg); opacity: 0.7; }
      }
      .helix-1 { animation-delay: 0s; }
      .helix-2 { animation-delay: 2.6s; margin-left: -80px; }
      .helix-3 { animation-delay: 5.2s; margin-left: -40px; }
      
      /* DNA碱基对 */
      .dna-base-pair {
        position: absolute;
        left: 50%;
        width: 100px;
        height: 10px;
        margin-left: -50px;
        background: linear-gradient(90deg,
          rgba(160, 80, 240, 0.9),
          rgba(180, 100, 255, 1),
          rgba(160, 80, 240, 0.9));
        animation: basePairFloat 4s ease-in-out infinite;
        box-shadow: 0 0 30px rgba(180, 100, 255, 0.9);
        border-radius: 5px;
      }
      @keyframes basePairFloat {
        0%, 100% { transform: translateX(-20px) rotate(-5deg); }
        50% { transform: translateX(20px) rotate(5deg); }
      }
      .pair-1 { top: 15%; animation-delay: 0s; }
      .pair-2 { top: 25%; animation-delay: 0.6s; }
      .pair-3 { top: 35%; animation-delay: 1.2s; }
      .pair-4 { top: 45%; animation-delay: 1.8s; }
      .pair-5 { top: 55%; animation-delay: 2.4s; }
      .pair-6 { top: 65%; animation-delay: 3s; }
      
      /* 宇宙伽马射线 */
      .cosmic-gamma-ray {
        position: absolute;
        width: 10px;
        height: 100%;
        background: linear-gradient(to bottom,
          rgba(180, 80, 255, 1),
          rgba(160, 60, 240, 0.9),
          rgba(140, 40, 220, 0.7),
          transparent);
        animation: gammaRayFlash 3s ease-out infinite;
        box-shadow: 
          0 0 80px rgba(180, 80, 255, 1),
          0 0 120px rgba(160, 60, 240, 0.8);
        filter: brightness(2);
      }
      @keyframes gammaRayFlash {
        0%, 80%, 100% { opacity: 0; }
        85%, 90%, 95% { opacity: 1; }
        87%, 92% { opacity: 0.3; }
      }
      .ray-1 { left: 15%; animation-delay: 0s; }
      .ray-2 { left: 35%; animation-delay: 0.8s; }
      .ray-3 { left: 55%; animation-delay: 1.6s; }
      .ray-4 { left: 75%; animation-delay: 2.4s; }
      .ray-5 { left: 85%; animation-delay: 3.2s; }
      
      /* 辐射波 */
      .radiation-wave {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 400px;
        height: 400px;
        margin: -200px 0 0 -200px;
        border: 3px solid rgba(160, 80, 240, 0.8);
        border-radius: 50%;
        animation: radiationExpand 4s ease-out infinite;
        box-shadow: 0 0 80px rgba(160, 80, 240, 0.9);
      }
      @keyframes radiationExpand {
        0% { transform: scale(0.5); opacity: 1; }
        100% { transform: scale(2.5); opacity: 0; }
      }
      .wave-1 { animation-delay: 0s; }
      .wave-2 { animation-delay: 1.3s; }
      .wave-3 { animation-delay: 2.6s; }
      
      /* 形态变换水晶 */
      .form-change-crystal {
        position: absolute;
        width: 80px;
        height: 100px;
        background: linear-gradient(135deg,
          rgba(180, 80, 255, 0.95),
          rgba(160, 60, 240, 0.9),
          rgba(140, 40, 220, 0.8));
        clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
        animation: crystalShine 3s ease-in-out infinite;
        box-shadow: 
          0 0 60px rgba(180, 80, 255, 0.9),
          inset 0 0 40px rgba(200, 100, 255, 0.6);
        filter: brightness(1.4);
      }
      @keyframes crystalShine {
        0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.8; }
        50% { transform: scale(1.15) rotate(180deg); opacity: 1; }
      }
      .crystal-attack { left: 15%; top: 25%; animation-delay: 0s; }
      .crystal-defense { right: 15%; top: 30%; animation-delay: 0.8s; }
      .crystal-speed { left: 20%; top: 65%; animation-delay: 1.6s; }
      .crystal-normal { right: 20%; top: 70%; animation-delay: 2.4s; }
      
      /* 水晶碎片 */
      .crystal-shard {
        position: absolute;
        width: 30px;
        height: 40px;
        background: linear-gradient(135deg,
          rgba(180, 100, 255, 0.9),
          rgba(160, 80, 240, 0.8),
          rgba(140, 60, 220, 0.7));
        clip-path: polygon(50% 0%, 100% 40%, 80% 100%, 20% 100%, 0% 40%);
        animation: shardFloat 4s ease-in-out infinite;
        box-shadow: 0 0 40px rgba(180, 100, 255, 0.8);
      }
      @keyframes shardFloat {
        0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.7; }
        50% { transform: translateY(-50px) rotate(180deg); opacity: 1; }
      }
      .shard-1 { left: 18%; top: 28%; animation-delay: 0.2s; }
      .shard-2 { right: 18%; top: 33%; animation-delay: 1s; }
      .shard-3 { left: 23%; top: 68%; animation-delay: 1.8s; }
      .shard-4 { right: 23%; top: 73%; animation-delay: 2.6s; }
      
      /* 病毒粒子 */
      .virus-particle {
        position: absolute;
        width: 40px;
        height: 40px;
        background: radial-gradient(circle,
          rgba(180, 80, 255, 1),
          rgba(160, 60, 240, 0.8),
          rgba(140, 40, 220, 0.5),
          transparent);
        border-radius: 50%;
        animation: virusParticleFloat 5s ease-in-out infinite;
        box-shadow: 
          0 0 60px rgba(180, 80, 255, 0.9),
          inset 0 0 30px rgba(200, 100, 255, 0.6);
      }
      @keyframes virusParticleFloat {
        0%, 100% { transform: translate(0, 0); opacity: 0.6; }
        50% { transform: translate(var(--vx, 50px), var(--vy, -50px)); opacity: 1; }
      }
      .particle-1 { left: 25%; top: 40%; --vx: 40px; --vy: -40px; animation-delay: 0s; }
      .particle-2 { right: 25%; top: 45%; --vx: -50px; --vy: -45px; animation-delay: 0.6s; }
      .particle-3 { left: 35%; top: 55%; --vx: 45px; --vy: 50px; animation-delay: 1.2s; }
      .particle-4 { right: 35%; top: 50%; --vx: -40px; --vy: 55px; animation-delay: 1.8s; }
      .particle-5 { left: 45%; top: 35%; --vx: 35px; --vy: -60px; animation-delay: 2.4s; }
      .particle-6 { right: 45%; top: 60%; --vx: -55px; --vy: 40px; animation-delay: 3s; }
      .particle-7 { left: 55%; top: 45%; --vx: 60px; --vy: -35px; animation-delay: 3.6s; }
      .particle-8 { right: 55%; top: 55%; --vx: -45px; --vy: 60px; animation-delay: 4.2s; }
      
      /* 北极光 */
      .aurora-borealis {
        position: absolute;
        width: 100%;
        height: 200px;
        background: linear-gradient(90deg,
          transparent,
          rgba(140, 80, 220, 0.6),
          rgba(160, 100, 240, 0.8),
          rgba(180, 120, 255, 0.7),
          rgba(160, 100, 240, 0.6),
          rgba(140, 80, 220, 0.5),
          transparent);
        animation: auroraWave 8s ease-in-out infinite;
        filter: blur(20px);
      }
      @keyframes auroraWave {
        0%, 100% { transform: translateY(0) scaleY(1); opacity: 0.5; }
        50% { transform: translateY(-30px) scaleY(1.2); opacity: 0.9; }
      }
      .aurora-1 { top: 20%; animation-delay: 0s; }
      .aurora-2 { top: 40%; animation-delay: 2.6s; }
      .aurora-3 { top: 60%; animation-delay: 5.2s; }
      
      /* 念力爆发核心 */
      .psycho-boost-core {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 200px;
        height: 200px;
        margin: -100px 0 0 -100px;
        background: radial-gradient(circle,
          rgba(255, 150, 255, 1),
          rgba(200, 100, 255, 0.95),
          rgba(180, 80, 255, 0.8),
          transparent);
        border-radius: 50%;
        animation: psychoBoostCharge 4s ease-in-out infinite;
        box-shadow: 
          0 0 200px rgba(200, 100, 255, 1),
          inset 0 0 100px rgba(255, 150, 255, 0.8);
        filter: brightness(1.8);
      }
      @keyframes psychoBoostCharge {
        0%, 100% { transform: scale(0.8); opacity: 0.7; }
        50% { transform: scale(1.3); opacity: 1; }
      }
      
      /* 念力爆发环 */
      .psycho-boost-ring {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 350px;
        height: 350px;
        margin: -175px 0 0 -175px;
        border: 5px solid rgba(200, 100, 255, 0.9);
        border-radius: 50%;
        animation: psychoRingBlast 3s ease-out infinite;
        box-shadow: 
          0 0 100px rgba(200, 100, 255, 1),
          inset 0 0 60px rgba(255, 150, 255, 0.6);
      }
      @keyframes psychoRingBlast {
        0% { transform: scale(0.5); opacity: 1; }
        100% { transform: scale(3); opacity: 0; }
      }
      .ring-1 { animation-delay: 0s; }
      .ring-2 { animation-delay: 1s; }
      .ring-3 { animation-delay: 2s; }
      
      /* 念力爆发光束 */
      .psycho-boost-beam {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 150px;
        height: 100%;
        margin-left: -75px;
        background: linear-gradient(to bottom,
          rgba(255, 150, 255, 1),
          rgba(200, 100, 255, 0.9),
          rgba(180, 80, 255, 0.7),
          transparent);
        animation: boostBeam 5s ease-out infinite;
        box-shadow: 0 0 150px rgba(200, 100, 255, 1);
        filter: blur(15px) brightness(2);
      }
      @keyframes boostBeam {
        0%, 100% { opacity: 0; transform: scaleY(0); }
        50% { opacity: 1; transform: scaleY(1.2); }
      }
      
      /* 再生领域 */
      .regeneration-field {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background: radial-gradient(circle at center,
          transparent 30%,
          rgba(140, 60, 220, 0.3) 60%,
          rgba(160, 80, 240, 0.5) 100%);
        animation: regenPulse 6s ease-in-out infinite;
      }
      @keyframes regenPulse {
        0%, 100% { opacity: 0.4; transform: scale(1); }
        50% { opacity: 0.8; transform: scale(1.05); }
      }
      
      /* 突变光环 */
      .mutation-aura {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 550px;
        height: 550px;
        margin: -275px 0 0 -275px;
        background: radial-gradient(circle,
          rgba(180, 80, 255, 0.6),
          rgba(160, 60, 240, 0.4),
          transparent);
        border-radius: 50%;
        animation: mutationGlow 5s ease-in-out infinite;
        box-shadow: 0 0 220px rgba(180, 80, 255, 0.9);
      }
      @keyframes mutationGlow {
        0%, 100% { transform: scale(0.9) rotate(0deg); opacity: 0.5; }
        50% { transform: scale(1.1) rotate(180deg); opacity: 1; }
      }
      
      /* 外星病毒核心 */
      .alien-virus-core {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 300px;
        height: 300px;
        margin: -150px 0 0 -150px;
        background: radial-gradient(circle,
          rgba(200, 80, 255, 0.9),
          rgba(180, 60, 240, 0.7),
          rgba(160, 40, 220, 0.5),
          transparent);
        border-radius: 50%;
        animation: alienCoreRotate 8s linear infinite;
        box-shadow: 
          0 0 180px rgba(200, 80, 255, 1),
          inset 0 0 100px rgba(220, 100, 255, 0.7);
      }
      @keyframes alienCoreRotate {
        0% { transform: rotate(0deg) scale(1); opacity: 0.8; }
        50% { opacity: 1; }
        100% { transform: rotate(360deg) scale(1.1); opacity: 0.8; }
      }
      
      /* 地外能量 */
      .extraterrestrial-energy {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background: radial-gradient(circle at 50% 50%,
          transparent 40%,
          rgba(140, 60, 220, 0.4) 70%,
          rgba(160, 80, 240, 0.6) 90%,
          rgba(180, 100, 255, 0.8) 100%);
        animation: extraEnergyPulse 7s ease-in-out infinite;
      }
      @keyframes extraEnergyPulse {
        0%, 100% { opacity: 0.3; transform: scale(1) rotate(0deg); }
        50% { opacity: 0.7; transform: scale(1.05) rotate(180deg); }
      }

      /* ========== 雷吉洛克 - 岩石巨人场景 ========== */
      
      /* 巨大岩石巨人身体 */
      .giant-rock-body {
        position: absolute;
        left: 50%;
        bottom: 0;
        width: 300px;
        height: 400px;
        margin-left: -150px;
        background: linear-gradient(to top,
          rgba(120, 100, 80, 0.95),
          rgba(140, 120, 100, 0.9),
          rgba(160, 140, 120, 0.85));
        clip-path: polygon(40% 0%, 60% 0%, 70% 100%, 30% 100%);
        box-shadow: 
          0 0 80px rgba(120, 100, 80, 0.7),
          inset 0 -50px 60px rgba(80, 60, 40, 0.6);
        animation: rockBodyFloat 4s ease-in-out infinite;
      }
      @keyframes rockBodyFloat {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-20px); }
      }
      
      /* 岩石手臂 */
      .rock-arm {
        position: absolute;
        width: 100px;
        height: 150px;
        background: linear-gradient(135deg,
          rgba(140, 120, 100, 0.95),
          rgba(120, 100, 80, 0.9),
          rgba(100, 80, 60, 0.85));
        clip-path: polygon(30% 0%, 70% 0%, 100% 100%, 0% 100%);
        animation: armSwing 3s ease-in-out infinite;
      }
      @keyframes armSwing {
        0%, 100% { transform: rotate(-10deg); }
        50% { transform: rotate(10deg); }
      }
      .arm-left { left: 20%; bottom: 25%; animation-delay: 0s; transform-origin: top right; }
      .arm-right { right: 20%; bottom: 25%; animation-delay: 1.5s; transform-origin: top left; }
      
      /* 岩石腿 */
      .rock-leg {
        position: absolute;
        width: 80px;
        height: 120px;
        background: linear-gradient(to top,
          rgba(100, 80, 60, 0.95),
          rgba(120, 100, 80, 0.9));
        clip-path: polygon(20% 0%, 80% 0%, 90% 100%, 10% 100%);
      }
      .leg-left { left: 40%; bottom: 0; animation: legMove 2s ease-in-out infinite; }
      .leg-right { right: 40%; bottom: 0; animation: legMove 2s ease-in-out infinite 1s; }
      @keyframes legMove {
        0%, 100% { transform: scaleY(1); }
        50% { transform: scaleY(0.95); }
      }
      
      /* 巨石落下 */
      .massive-boulder {
        position: absolute;
        width: 100px;
        height: 100px;
        background: radial-gradient(circle,
          rgba(140, 120, 100, 1),
          rgba(120, 100, 80, 0.95),
          rgba(100, 80, 60, 0.8));
        border-radius: 50%;
        clip-path: polygon(30% 0%, 70% 10%, 90% 40%, 85% 75%, 55% 95%, 25% 90%, 10% 60%, 15% 25%);
        animation: boulderFall 3s ease-in infinite;
        box-shadow: 0 0 60px rgba(120, 100, 80, 0.8);
      }
      @keyframes boulderFall {
        0% { transform: translateY(-800px) rotate(0deg); opacity: 0; }
        20% { opacity: 1; }
        100% { transform: translateY(600px) rotate(360deg); opacity: 0; }
      }
      .boulder-1 { left: 15%; animation-delay: 0s; }
      .boulder-2 { left: 40%; animation-delay: 0.8s; }
      .boulder-3 { left: 65%; animation-delay: 1.6s; }
      .boulder-4 { right: 15%; animation-delay: 2.4s; }
      
      /* 巨石阴影 */
      .boulder-shadow {
        position: absolute;
        bottom: 0;
        width: 80px;
        height: 20px;
        background: radial-gradient(ellipse, rgba(0, 0, 0, 0.6), transparent);
        animation: shadowGrow 3s ease-in infinite;
      }
      @keyframes shadowGrow {
        0%, 100% { transform: scale(0.5); opacity: 0; }
        50% { transform: scale(1); opacity: 0.8; }
      }
      .shadow-1 { left: 15%; animation-delay: 0s; }
      .shadow-2 { left: 40%; animation-delay: 0.8s; }
      .shadow-3 { left: 65%; animation-delay: 1.6s; }
      .shadow-4 { right: 15%; animation-delay: 2.4s; }
      
      /* 地震裂缝 */
      .earthquake-crack {
        position: absolute;
        bottom: 0;
        width: 100%;
        height: 10px;
        background: linear-gradient(90deg,
          transparent,
          rgba(80, 40, 20, 0.9),
          rgba(100, 60, 30, 0.8),
          transparent);
        animation: crackExpand 2s ease-out infinite;
      }
      @keyframes crackExpand {
        0% { transform: scaleX(0); opacity: 0; }
        50% { opacity: 1; }
        100% { transform: scaleX(1); opacity: 0.8; }
      }
      .crack-1 { animation-delay: 0s; transform: skewX(-20deg); }
      .crack-2 { animation-delay: 0.4s; transform: skewX(15deg); }
      .crack-3 { animation-delay: 0.8s; transform: skewX(-10deg); }
      .crack-4 { animation-delay: 1.2s; transform: skewX(25deg); }
      .crack-5 { animation-delay: 1.6s; transform: skewX(-15deg); }
      
      /* 地面破碎 */
      .ground-shatter {
        position: absolute;
        bottom: 0;
        width: 150px;
        height: 100px;
        background: radial-gradient(ellipse,
          rgba(100, 80, 60, 0.8),
          rgba(80, 60, 40, 0.5),
          transparent);
        animation: shatterPulse 3s ease-out infinite;
      }
      @keyframes shatterPulse {
        0% { transform: scale(0); opacity: 0; }
        50% { transform: scale(1); opacity: 1; }
        100% { transform: scale(1.5); opacity: 0; }
      }
      .shatter-1 { left: 25%; animation-delay: 0s; }
      .shatter-2 { left: 50%; animation-delay: 1s; }
      .shatter-3 { right: 25%; animation-delay: 2s; }
      
      /* 岩石风暴粒子 */
      .rock-storm-particle {
        position: absolute;
        width: 40px;
        height: 40px;
        background: radial-gradient(circle,
          rgba(140, 120, 100, 0.9),
          rgba(100, 80, 60, 0.6),
          transparent);
        clip-path: polygon(40% 0%, 60% 20%, 80% 40%, 70% 70%, 40% 90%, 20% 70%, 10% 40%, 30% 20%);
        animation: stormParticleSwirl 4s ease-in-out infinite;
      }
      @keyframes stormParticleSwirl {
        0% { transform: translate(0, 600px) rotate(0deg); opacity: 0; }
        50% { opacity: 1; }
        100% { transform: translate(var(--stormX, 100px), var(--stormY, -400px)) rotate(720deg); opacity: 0; }
      }
      .particle-1 { left: 20%; --stormX: 80px; --stormY: -450px; animation-delay: 0s; }
      .particle-2 { left: 35%; --stormX: -90px; --stormY: -420px; animation-delay: 0.5s; }
      .particle-3 { left: 50%; --stormX: 70px; --stormY: -480px; animation-delay: 1s; }
      .particle-4 { left: 65%; --stormX: -100px; --stormY: -410px; animation-delay: 1.5s; }
      .particle-5 { left: 80%; --stormX: 60px; --stormY: -460px; animation-delay: 2s; }
      .particle-6 { left: 25%; --stormX: -80px; --stormY: -440px; animation-delay: 2.5s; }
      .particle-7 { left: 60%; --stormX: 95px; --stormY: -425px; animation-delay: 3s; }
      .particle-8 { left: 75%; --stormX: -75px; --stormY: -455px; animation-delay: 3.5s; }
      
      /* 远古符文 */
      .ancient-rock-rune {
        position: absolute;
        width: 60px;
        height: 60px;
        background: radial-gradient(circle,
          rgba(180, 140, 100, 0.9),
          rgba(140, 100, 60, 0.7),
          transparent);
        clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
        animation: runeGlow 3s ease-in-out infinite;
        box-shadow: 0 0 50px rgba(180, 140, 100, 0.8);
      }
      @keyframes runeGlow {
        0%, 100% { opacity: 0.6; filter: brightness(1); }
        50% { opacity: 1; filter: brightness(1.5); }
      }
      .rune-1 { left: 15%; top: 30%; animation-delay: 0s; }
      .rune-2 { right: 15%; top: 35%; animation-delay: 0.4s; }
      .rune-3 { left: 25%; top: 55%; animation-delay: 0.8s; }
      .rune-4 { right: 25%; top: 60%; animation-delay: 1.2s; }
      .rune-5 { left: 50%; top: 25%; animation-delay: 1.6s; }
      .rune-6 { left: 35%; top: 70%; animation-delay: 2s; }
      .rune-7 { right: 35%; top: 50%; animation-delay: 2.4s; }
      
      /* 符文光圈 */
      .rune-glow-circle {
        position: absolute;
        width: 100px;
        height: 100px;
        border: 3px solid rgba(180, 140, 100, 0.7);
        border-radius: 50%;
        animation: circleExpand 4s ease-out infinite;
      }
      @keyframes circleExpand {
        0% { transform: scale(0); opacity: 1; }
        100% { transform: scale(2.5); opacity: 0; }
      }
      .circle-1 { left: 15%; top: 30%; animation-delay: 0s; }
      .circle-2 { right: 15%; top: 35%; animation-delay: 1.3s; }
      .circle-3 { left: 50%; top: 25%; animation-delay: 2.6s; }
      
      /* 尖石攻击 */
      .stone-edge-spike {
        position: absolute;
        bottom: 0;
        width: 60px;
        height: 200px;
        background: linear-gradient(to top,
          rgba(140, 120, 100, 1),
          rgba(120, 100, 80, 0.9),
          rgba(100, 80, 60, 0.7),
          transparent);
        clip-path: polygon(50% 0%, 70% 40%, 60% 100%, 40% 100%, 30% 40%);
        animation: spikeRise 2s ease-out infinite;
        box-shadow: 0 0 40px rgba(120, 100, 80, 0.7);
      }
      @keyframes spikeRise {
        0% { transform: translateY(100%); opacity: 0; }
        50% { opacity: 1; }
        100% { transform: translateY(0); opacity: 0.9; }
      }
      .spike-1 { left: 20%; animation-delay: 0s; }
      .spike-2 { left: 40%; animation-delay: 0.4s; }
      .spike-3 { left: 60%; animation-delay: 0.8s; }
      .spike-4 { left: 80%; animation-delay: 1.2s; }
      .spike-5 { left: 50%; animation-delay: 1.6s; }
      
      /* 岩石护甲 */
      .rock-armor-layer {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 300px;
        height: 300px;
        margin: -150px 0 0 -150px;
        border: 4px solid rgba(140, 120, 100, 0.7);
        border-radius: 50%;
        animation: armorRotate 8s linear infinite;
      }
      @keyframes armorRotate {
        0% { transform: rotate(0deg); opacity: 0.6; }
        50% { opacity: 1; }
        100% { transform: rotate(360deg); opacity: 0.6; }
      }
      .layer-1 { animation-delay: 0s; }
      .layer-2 { animation-delay: 2.6s; width: 350px; height: 350px; margin: -175px 0 0 -175px; }
      .layer-3 { animation-delay: 5.2s; width: 400px; height: 400px; margin: -200px 0 0 -200px; }
      
      /* 砂尘暴 */
      .sandstorm-dust {
        position: absolute;
        width: 30px;
        height: 30px;
        background: radial-gradient(circle,
          rgba(180, 160, 140, 0.7),
          rgba(140, 120, 100, 0.5),
          transparent);
        border-radius: 50%;
        animation: dustSwirl 5s ease-in-out infinite;
      }
      @keyframes dustSwirl {
        0%, 100% { transform: translate(0, 0) rotate(0deg); opacity: 0.4; }
        50% { transform: translate(var(--dustX, 60px), var(--dustY, -80px)) rotate(360deg); opacity: 0.9; }
      }
      .dust-1 { left: 20%; top: 40%; --dustX: 70px; --dustY: -90px; animation-delay: 0s; }
      .dust-2 { left: 45%; top: 50%; --dustX: -80px; --dustY: -70px; animation-delay: 1s; }
      .dust-3 { left: 70%; top: 35%; --dustX: 65px; --dustY: -100px; animation-delay: 2s; }
      .dust-4 { left: 30%; top: 65%; --dustX: -75px; --dustY: -85px; animation-delay: 3s; }
      .dust-5 { right: 25%; top: 55%; --dustX: 90px; --dustY: -75px; animation-delay: 4s; }
      
      /* 岩石爆炸 */
      .rock-blast-explosion {
        position: absolute;
        width: 150px;
        height: 150px;
        background: radial-gradient(circle,
          rgba(180, 140, 100, 1),
          rgba(140, 100, 60, 0.8),
          rgba(100, 60, 30, 0.5),
          transparent);
        border-radius: 50%;
        animation: blastExpand 3s ease-out infinite;
      }
      @keyframes blastExpand {
        0% { transform: scale(0); opacity: 1; }
        100% { transform: scale(3); opacity: 0; }
      }
      .explosion-1 { left: 30%; top: 40%; animation-delay: 0s; }
      .explosion-2 { right: 30%; top: 50%; animation-delay: 1.5s; }
      
      /* 巨岩能量 */
      .golem-ancient-power {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 400px;
        height: 400px;
        margin: -200px 0 0 -200px;
        background: radial-gradient(circle,
          rgba(180, 140, 100, 0.6),
          rgba(140, 100, 60, 0.4),
          transparent);
        border-radius: 50%;
        animation: ancientPowerGlow 5s ease-in-out infinite;
      }
      @keyframes ancientPowerGlow {
        0%, 100% { transform: scale(0.9); opacity: 0.5; }
        50% { transform: scale(1.1); opacity: 1; }
      }
      
      /* 岩石能量场 */
      .rock-energy-field {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background: radial-gradient(circle at center,
          transparent 40%,
          rgba(120, 100, 80, 0.3) 70%,
          rgba(140, 120, 100, 0.5) 100%);
        animation: fieldPulse 6s ease-in-out infinite;
      }
      @keyframes fieldPulse {
        0%, 100% { opacity: 0.4; }
        50% { opacity: 0.8; }
      }
      
      /* 恒定身躯光环 */
      .clear-body-aura {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 500px;
        height: 500px;
        margin: -250px 0 0 -250px;
        border: 3px solid rgba(180, 140, 100, 0.6);
        border-radius: 50%;
        animation: bodyAuraRotate 10s linear infinite;
      }
      @keyframes bodyAuraRotate {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      /* 究极异兽特殊效果 */
      @keyframes jellyPulse {
        0%, 100% { transform: translateY(0) scale(1); }
        50% { transform: translateY(-20px) scale(1.1); }
      }
      .jellyfish-tentacle {
        position: absolute;
        bottom: 20%;
        width: 40px;
        height: 150px;
        background: linear-gradient(to bottom, rgba(160, 144, 208, 0.6), transparent);
        border-radius: 50%;
        animation: jellyPulse 3s ease-in-out infinite;
      }

      @keyframes muscleBulge {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.3); }
      }
      .muscle-flex, .power-pose {
        position: absolute;
        width: 80px;
        height: 80px;
        background: radial-gradient(circle, rgba(220, 60, 80, 0.6), transparent);
        border-radius: 50%;
        animation: muscleBulge 1s ease-in-out infinite;
      }

      @keyframes elegantDance {
        0% { transform: translateX(-100%) rotateY(0deg); opacity: 0; }
        50% { opacity: 1; transform: rotateY(180deg); }
        100% { transform: translateX(100%) rotateY(360deg); opacity: 0; }
      }
      .elegant-stride {
        position: absolute;
        top: 50%;
        width: 200%;
        height: 100px;
        background: linear-gradient(90deg, transparent, rgba(208, 160, 255, 0.5), transparent);
        animation: elegantDance 4s linear infinite;
      }

      @keyframes pheromoneCloud {
        0% { transform: scale(0); opacity: 0.8; }
        100% { transform: scale(4); opacity: 0; }
      }
      .pheromone-wave {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 100px;
        height: 100px;
        margin: -50px 0 0 -50px;
        background: radial-gradient(circle, rgba(224, 192, 255, 0.4), transparent);
        border-radius: 50%;
        animation: pheromoneCloud 4s ease-out infinite;
      }

      /* 电缆/能量特效 - 电束木 */
      @keyframes wirePulse {
        0%, 100% { opacity: 0.3; }
        50% { opacity: 1; }
      }
      .electric-wire {
        position: absolute;
        width: 5px;
        height: 100%;
        background: linear-gradient(to bottom, rgba(250, 250, 150, 0.8), transparent);
        animation: wirePulse 2s ease-in-out infinite;
        box-shadow: 0 0 15px rgba(250, 250, 150, 0.6);
      }

      @keyframes energySurge {
        0%, 100% { transform: scaleY(0); opacity: 0; }
        50% { transform: scaleY(1); opacity: 1; }
      }
      .power-surge {
        position: absolute;
        left: 50%;
        bottom: 0;
        width: 120px;
        height: 100%;
        margin-left: -60px;
        background: linear-gradient(to top, rgba(250, 250, 150, 0.5), transparent);
        transform-origin: bottom;
        animation: energySurge 2s ease-in-out infinite;
      }

      /* 风暴特效 - 风系传说 */
      @keyframes windBlow {
        0% { transform: translateX(-100%) skewX(-10deg); opacity: 0; }
        50% { opacity: 0.6; }
        100% { transform: translateX(100%) skewX(-10deg); opacity: 0; }
      }
      .wind-gust {
        position: absolute;
        top: 30%;
        width: 150%;
        height: 40px;
        background: linear-gradient(90deg, transparent, rgba(200, 230, 240, 0.4), transparent);
        animation: windBlow 2s ease-in-out infinite;
      }

      @keyframes tornadoSpin {
        0% { transform: rotate(0deg) scaleY(1); }
        100% { transform: rotate(360deg) scaleY(1.2); }
      }
      .tornado-spiral {
        position: absolute;
        left: 50%;
        bottom: 0;
        width: 80px;
        height: 200px;
        margin-left: -40px;
        background: linear-gradient(to top, rgba(180, 210, 230, 0.5), transparent);
        clip-path: polygon(40% 0%, 60% 0%, 80% 100%, 20% 100%);
        animation: tornadoSpin 2s linear infinite;
      }

      /* 大地特效 - 地系传说 */
      @keyframes quakeShake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
      }
      .ground-crack {
        position: absolute;
        bottom: 0;
        width: 100%;
        height: 3px;
        background: linear-gradient(90deg, 
          transparent,
          rgba(139, 90, 43, 0.8),
          transparent
        );
        animation: quakeShake 0.5s ease-in-out infinite;
      }

      @keyframes rockFall {
        0% { transform: translateY(-100%) rotate(0deg); opacity: 0; }
        70% { opacity: 1; }
        100% { transform: translateY(100%) rotate(180deg); opacity: 0; }
      }
      .rock-debris {
        position: absolute;
        width: 30px;
        height: 30px;
        background: radial-gradient(circle, rgba(120, 80, 50, 0.8), transparent);
        clip-path: polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%);
        animation: rockFall 3s ease-in infinite;
      }

      /* 海洋深层特效 */
      @keyframes bubbleRise {
        0% { transform: translateY(100%) scale(0.5); opacity: 0; filter: brightness(1); }
        20% { opacity: 0.9; filter: brightness(1.3); }
        50% { opacity: 0.95; filter: brightness(1.4); }
        80% { opacity: 0.7; filter: brightness(1.2); }
        100% { transform: translateY(-100%) scale(1.2); opacity: 0; filter: brightness(1); }
      }
      .water-bubble {
        position: absolute;
        width: 30px;
        height: 30px;
        background: radial-gradient(circle at 30% 30%, rgba(200, 230, 255, 0.6), rgba(150, 200, 255, 0.3));
        border-radius: 50%;
        animation: bubbleRise 4s ease-out infinite;
      }

      @keyframes currentFlow {
        0% { transform: translateX(0) translateY(0); }
        50% { transform: translateX(30px) translateY(-20px); }
        100% { transform: translateX(0) translateY(0); }
      }
      .ocean-current {
        position: absolute;
        width: 100px;
        height: 80px;
        background: radial-gradient(ellipse, rgba(100, 180, 240, 0.3), transparent);
        animation: currentFlow 4s ease-in-out infinite;
      }

      /* 星空特效 */
      @keyframes starfield {
        0% { transform: translateY(-100%); opacity: 0; }
        50% { opacity: 1; }
        100% { transform: translateY(100%); opacity: 0; }
      }
      .star-particle {
        position: absolute;
        width: 3px;
        height: 3px;
        background: rgba(255, 255, 255, 0.9);
        border-radius: 50%;
        box-shadow: 0 0 4px rgba(255, 255, 255, 0.8);
        animation: starfield 6s linear infinite;
      }

      /* 闪光效果 */
      @keyframes sparkle {
        0%, 100% { transform: scale(0) rotate(0deg); opacity: 0; filter: brightness(1); }
        50% { transform: scale(1.2) rotate(180deg); opacity: 1; filter: brightness(1.8); }
      }
      .sparkle-effect {
        position: absolute;
        width: 20px;
        height: 20px;
        background: 
          linear-gradient(45deg, transparent 40%, white 50%, transparent 60%),
          linear-gradient(-45deg, transparent 40%, white 50%, transparent 60%);
        animation: sparkle 1.5s ease-in-out infinite;
      }

      /* 极光效果增强 */
      @keyframes auroraPulse {
        0%, 100% { opacity: 0.3; transform: translateY(0); }
        50% { opacity: 0.8; transform: translateY(-20px); }
      }
      .aurora-wave {
        position: absolute;
        width: 100%;
        height: 150px;
        background: linear-gradient(180deg,
          rgba(0, 255, 200, 0.2),
          rgba(100, 150, 255, 0.2),
          rgba(255, 100, 200, 0.2)
        );
        animation: auroraPulse 4s ease-in-out infinite;
        filter: blur(20px);
      }

      /* 能量场 */
      @keyframes energyField {
        0%, 100% { transform: scale(1); opacity: 0.4; }
        50% { transform: scale(1.1); opacity: 0.8; }
      }
      .energy-field {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 300px;
        height: 300px;
        margin: -150px 0 0 -150px;
        border: 2px solid rgba(100, 200, 255, 0.5);
        border-radius: 50%;
        animation: energyField 3s ease-in-out infinite;
      }

      /* 脉冲波 */
      @keyframes pulseWave {
        0% { transform: scale(0); opacity: 1; }
        100% { transform: scale(2.5); opacity: 0; }
      }
      .pulse-wave {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 100px;
        height: 100px;
        margin: -50px 0 0 -50px;
        border: 3px solid rgba(255, 255, 255, 0.6);
        border-radius: 50%;
        animation: pulseWave 2s ease-out infinite;
      }

      /* 螺旋效果 */
      @keyframes spiralRotate {
        0% { transform: rotate(0deg) scale(0.5); opacity: 0; }
        50% { opacity: 1; }
        100% { transform: rotate(720deg) scale(1.5); opacity: 0; }
      }
      .spiral-effect {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 60px;
        height: 60px;
        margin: -30px 0 0 -30px;
        border: 3px solid rgba(255, 200, 100, 0.7);
        border-radius: 50%;
        border-right-color: transparent;
        border-bottom-color: transparent;
        animation: spiralRotate 3s ease-out infinite;
      }

      /* 流星效果 */
      @keyframes meteor {
        0% { transform: translate(-100px, -100px); opacity: 0; }
        10% { opacity: 1; }
        90% { opacity: 1; }
        100% { transform: translate(100px, 100px); opacity: 0; }
      }
      .meteor-trail {
        position: absolute;
        width: 100px;
        height: 2px;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.9), transparent);
        animation: meteor 3s ease-in infinite;
        box-shadow: 0 0 8px rgba(255, 255, 255, 0.6);
      }

      /* 宇宙尘埃 */
      @keyframes dustFloat {
        0%, 100% { transform: translate(0, 0); opacity: 0.3; }
        50% { transform: translate(var(--dust-x, 20px), var(--dust-y, -30px)); opacity: 0.8; }
      }
      .cosmic-dust {
        position: absolute;
        width: 4px;
        height: 4px;
        background: rgba(200, 200, 255, 0.6);
        border-radius: 50%;
        animation: dustFloat 6s ease-in-out infinite;
      }

      /* 魔法阵 */
      @keyframes magicCircle {
        0% { transform: rotate(0deg); opacity: 0.5; }
        100% { transform: rotate(360deg); opacity: 0.8; }
      }
      .magic-circle {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 200px;
        height: 200px;
        margin: -100px 0 0 -100px;
        border: 2px solid rgba(150, 100, 255, 0.6);
        border-radius: 50%;
        animation: magicCircle 10s linear infinite;
      }
      .magic-circle::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 80%;
        height: 80%;
        margin: -40% 0 0 -40%;
        border: 2px solid rgba(150, 100, 255, 0.4);
        border-radius: 50%;
      }

      /* 通用场景类 */
      .volcano-scene, .ocean-scene, .sky-scene, .psychic-scene,
      .dream-scene, .electric-scene, .fire-scene, .ice-scene,
      .forest-scene, .dragon-scene, .cosmic-scene, .shadow-scene,
      .dimension-scene, .ancient-scene, .future-scene, .mewtwo-scene,
      .mew-scene, .raikou-scene, .entei-scene, .suicune-scene,
      .ho-oh-scene, .lugia-scene, .celebi-scene, .groudon-scene,
      .kyogre-scene, .rayquaza-scene, .jirachi-scene, .deoxys-scene,
      .dialga-scene, .palkia-scene, .giratina-scene, .arceus-scene {
        position: absolute;
        width: 100%;
        height: 100%;
        overflow: hidden;
      }

      /* ========== 专属宝可梦特效 ========== */

      /* 超梦专属 - 增强念力特效 */
      .psychic-sphere {
        position: absolute;
        width: 120px;
        height: 120px;
        background: radial-gradient(circle at 35% 35%, 
          rgba(220, 180, 255, 0.95),
          rgba(180, 140, 230, 0.85),
          rgba(155, 123, 199, 0.7),
          rgba(130, 100, 180, 0.4),
          transparent);
        border-radius: 50%;
        animation: pulseGlow 2s ease-in-out infinite;
        box-shadow: 
          0 0 50px rgba(180, 140, 230, 0.9),
          0 0 100px rgba(155, 123, 199, 0.6),
          inset 0 0 40px rgba(220, 180, 255, 0.5);
        filter: brightness(1.3);
      }
      .sphere-1 { left: 20%; top: 30%; animation-delay: 0s; }
      .sphere-2 { left: 70%; top: 50%; animation-delay: 0.7s; }
      .sphere-3 { left: 45%; top: 70%; animation-delay: 1.4s; }

      .mind-wave {
        position: absolute;
        left: 50%;
        width: 200px;
        height: 5px;
        background: linear-gradient(90deg, 
          transparent, 
          rgba(220, 180, 255, 0.9),
          rgba(180, 140, 230, 0.95),
          rgba(220, 180, 255, 0.9),
          transparent);
        animation: pulseWave 2.5s ease-out infinite;
        box-shadow: 
          0 0 30px rgba(180, 140, 230, 0.8),
          0 0 60px rgba(155, 123, 199, 0.5);
        filter: blur(2px) brightness(1.4);
      }
      .wave-1 { top: 30%; animation-delay: 0s; }
      .wave-2 { top: 50%; animation-delay: 0.8s; }
      .wave-3 { top: 70%; animation-delay: 1.6s; }

      .psychic-ripple {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 150px;
        height: 150px;
        margin: -75px 0 0 -75px;
        border: 4px solid rgba(200, 160, 255, 0.9);
        border-radius: 50%;
        animation: ringExpand 3s ease-out infinite;
        box-shadow: 
          0 0 30px rgba(180, 140, 230, 0.8),
          0 0 60px rgba(155, 123, 199, 0.5),
          inset 0 0 40px rgba(200, 160, 255, 0.4);
      }
      .ripple-1 { animation-delay: 0s; }
      .ripple-2 { animation-delay: 1.5s; }

      .dna-helix {
        position: absolute;
        left: 50%;
        width: 8px;
        height: 100%;
        background: linear-gradient(to bottom, 
          rgba(220, 180, 255, 0.9),
          rgba(180, 140, 230, 0.8),
          rgba(155, 123, 199, 0.6),
          transparent);
        animation: spiralRotate 4s linear infinite;
        box-shadow: 
          0 0 25px rgba(180, 140, 230, 0.7),
          0 0 50px rgba(155, 123, 199, 0.4);
        filter: brightness(1.3);
      }
      .helix-1 { margin-left: -20px; }
      .helix-2 { margin-left: 20px; animation-delay: 2s; }

      /* 梦幻专属 - 增强梦幻特效 */
      .pink-bubble {
        position: absolute;
        width: 90px;
        height: 90px;
        background: radial-gradient(circle at 30% 30%, 
          rgba(255, 240, 250, 0.98),
          rgba(255, 210, 230, 0.9),
          rgba(248, 187, 208, 0.8),
          rgba(240, 98, 146, 0.5),
          transparent);
        border-radius: 50%;
        animation: bubbleRise 5s ease-out infinite;
        box-shadow: 
          0 0 40px rgba(248, 187, 208, 0.9),
          0 0 70px rgba(240, 98, 146, 0.6),
          inset -10px -10px 30px rgba(255, 255, 255, 0.6),
          inset 10px 10px 30px rgba(240, 150, 180, 0.4);
        filter: brightness(1.2);
      }
      .bubble-1 { left: 15%; bottom: 0; animation-delay: 0s; }
      .bubble-2 { left: 40%; bottom: 0; animation-delay: 1.2s; }
      .bubble-3 { left: 65%; bottom: 0; animation-delay: 2.4s; }
      .bubble-4 { left: 85%; bottom: 0; animation-delay: 3.6s; }

      .dream-particle {
        position: absolute;
        width: 25px;
        height: 25px;
        background: radial-gradient(circle, 
          rgba(255, 245, 250, 1),
          rgba(252, 228, 236, 0.95),
          rgba(248, 200, 220, 0.7),
          transparent);
        border-radius: 50%;
        animation: particleFloat 4s ease-out infinite;
        box-shadow: 
          0 0 20px rgba(252, 228, 236, 0.9),
          0 0 40px rgba(248, 187, 208, 0.6);
        filter: brightness(1.4);
      }
      .particle-1 { left: 25%; top: 20%; --tx: 30px; --ty: -80px; animation-delay: 0s; }
      .particle-2 { left: 60%; top: 40%; --tx: -40px; --ty: -70px; animation-delay: 1.3s; }
      .particle-3 { left: 80%; top: 60%; --tx: 20px; --ty: -60px; animation-delay: 2.6s; }

      .playful-ring {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 120px;
        height: 120px;
        margin: -60px 0 0 -60px;
        border: 4px solid rgba(255, 210, 230, 0.9);
        border-radius: 50%;
        animation: spiralRotate 5s ease-in-out infinite;
        box-shadow: 
          0 0 30px rgba(248, 187, 208, 0.8),
          0 0 60px rgba(240, 98, 146, 0.5),
          inset 0 0 30px rgba(255, 230, 240, 0.4);
      }
      .ring-1 { animation-delay: 0s; }
      .ring-2 { animation-delay: 2.5s; transform: scale(0.7); }

      .sparkle-trail {
        position: absolute;
        width: 150px;
        height: 6px;
        background: linear-gradient(90deg, 
          transparent, 
          rgba(255, 240, 250, 0.95),
          rgba(252, 228, 236, 0.98),
          rgba(255, 240, 250, 0.95),
          transparent);
        animation: meteor 4s ease-in infinite;
        box-shadow: 
          0 0 30px rgba(252, 228, 236, 0.9),
          0 0 60px rgba(248, 187, 208, 0.6);
        filter: brightness(1.5);
      }
      .trail-1 { left: 10%; top: 20%; animation-delay: 0s; }
      .trail-2 { left: 60%; top: 60%; animation-delay: 2s; }

      /* 雷公/电击场景 - 增强雷电特效 */
      .thunder-cloud {
        position: absolute;
        width: 150px;
        height: 100px;
        background: radial-gradient(ellipse, 
          rgba(80, 110, 160, 0.9),
          rgba(50, 70, 120, 0.8),
          rgba(30, 50, 90, 0.5),
          transparent);
        border-radius: 50%;
        animation: cellFloat 3s ease-in-out infinite;
        box-shadow: 
          0 0 40px rgba(50, 70, 120, 0.7),
          inset 0 0 30px rgba(100, 130, 180, 0.5);
      }
      .cloud-1 { left: 20%; top: 10%; animation-delay: 0s; }
      .cloud-2 { left: 60%; top: 15%; animation-delay: 1.5s; }

      .lightning-strike {
        position: absolute;
        width: 10px;
        height: 100%;
        background: linear-gradient(to bottom, 
          #ffffff, 
          #ffffff,
          #8ed4ff, 
          #4db8ff, 
          rgba(77, 184, 255, 0.5),
          transparent);
        animation: lightningFlash 2s ease-in-out infinite;
        box-shadow: 
          0 0 50px #4db8ff,
          0 0 100px rgba(77, 184, 255, 0.8),
          0 0 150px rgba(77, 184, 255, 0.5);
        filter: brightness(1.8) blur(1px);
      }
      .strike-1 { left: 25%; animation-delay: 0s; }
      .strike-2 { left: 50%; animation-delay: 0.7s; }
      .strike-3 { left: 75%; animation-delay: 1.4s; }

      .thunder-roar, .voltage-surge, .volt-switch {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 250px;
        height: 250px;
        margin: -125px 0 0 -125px;
        background: radial-gradient(circle, 
          rgba(120, 170, 220, 0.7),
          rgba(74, 123, 167, 0.5),
          rgba(50, 90, 140, 0.3),
          transparent);
        border-radius: 50%;
        animation: energyField 2s ease-in-out infinite;
        box-shadow: 
          0 0 60px rgba(74, 123, 167, 0.6),
          inset 0 0 50px rgba(120, 170, 220, 0.4);
      }

      /* 炎帝/火焰场景 */
      .flame-eruption {
        position: absolute;
        bottom: 0;
        width: 100%;
        height: 60%;
        background: linear-gradient(to top, rgba(218, 106, 58, 0.6), transparent);
        animation: lavaFlow 3s ease-out infinite;
      }

      .sacred-ember {
        position: absolute;
        width: 25px;
        height: 25px;
        background: radial-gradient(circle, rgba(255, 140, 0, 0.9), transparent);
        border-radius: 50%;
        animation: smokeRise 3s ease-out infinite;
      }

      .heat-shimmer, .magma-pulse {
        position: absolute;
        width: 100%;
        height: 100%;
        background: radial-gradient(circle, rgba(218, 106, 58, 0.2), transparent);
        animation: auroraPulse 3s ease-in-out infinite;
      }

      /* 水君/冰霜场景 */
      .north-wind {
        position: absolute;
        width: 150%;
        height: 50px;
        background: linear-gradient(90deg, transparent, rgba(135, 206, 250, 0.4), transparent);
        animation: windBlow 3s ease-in-out infinite;
      }

      .crystal-formation, .pure-stream {
        position: absolute;
        width: 40px;
        height: 60px;
        background: linear-gradient(135deg, rgba(135, 206, 250, 0.7), transparent);
        clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
        animation: starTwinkle 2.5s ease-in-out infinite;
      }

      /* 凤王/洛奇亚专属 */
      .sacred-light {
        position: absolute;
        left: 50%;
        top: 20%;
        width: 150px;
        height: 150px;
        margin: -75px 0 0 -75px;
        background: radial-gradient(circle, rgba(255, 215, 100, 0.5), transparent);
        animation: solarFlare 3s ease-in-out infinite;
      }

      .ocean-blessing, .sea-guardian {
        position: absolute;
        bottom: 0;
        width: 200%;
        height: 70%;
        background: linear-gradient(to top, rgba(70, 130, 180, 0.5), transparent);
        animation: waveMove 8s linear infinite;
      }


      /* 默认场景 */
      .default-scene {
        position: absolute;
        width: 100%;
        height: 100%;
        background: radial-gradient(circle at 50% 50%, rgba(102, 126, 234, 0.2), transparent);
        animation: pulseGlow 3s ease-in-out infinite;
      }

      /* ========== 第一批：2代传说专属 ========== */
      
      /* 炎帝专属 - 增强火焰特效 */
      .fire-mane {
        position: absolute;
        width: 90px;
        height: 120px;
        background: linear-gradient(45deg, 
          rgba(255, 240, 100, 0.98),
          rgba(255, 180, 50, 0.95),
          rgba(255, 140, 0, 0.9),
          rgba(255, 69, 0, 0.7),
          rgba(200, 50, 0, 0.4));
        clip-path: polygon(50% 0%, 80% 50%, 50% 100%, 20% 50%);
        animation: sacredFire 2s ease-in-out infinite;
        box-shadow: 
          0 0 60px rgba(255, 140, 0, 0.9),
          0 0 100px rgba(255, 69, 0, 0.7),
          inset 0 0 40px rgba(255, 200, 100, 0.6);
        filter: brightness(1.4);
      }
      .mane-1 { left: 30%; top: 20%; animation-delay: 0s; }
      .mane-2 { left: 60%; top: 25%; animation-delay: 1s; }

      .ember-spark {
        position: absolute;
        width: 30px;
        height: 30px;
        background: radial-gradient(circle, 
          rgba(255, 255, 200, 1),
          rgba(255, 220, 120, 0.95),
          rgba(255, 200, 100, 0.9),
          rgba(255, 150, 50, 0.6),
          transparent);
        border-radius: 50%;
        animation: sparkle 1.5s ease-in-out infinite;
        box-shadow: 
          0 0 40px rgba(255, 200, 100, 1),
          0 0 70px rgba(255, 140, 0, 0.8);
        filter: brightness(1.5);
      }
      .spark-1 { left: 20%; top: 30%; animation-delay: 0s; }
      .spark-2 { left: 50%; top: 50%; animation-delay: 0.5s; }
      .spark-3 { left: 75%; top: 40%; animation-delay: 1s; }

      .heat-wave {
        position: absolute;
        width: 100%;
        height: 80px;
        background: linear-gradient(90deg, 
          transparent, 
          rgba(255, 180, 50, 0.7),
          rgba(255, 140, 0, 0.8),
          rgba(255, 180, 50, 0.7),
          transparent);
        animation: windBlow 2.5s ease-in-out infinite;
        box-shadow: 0 0 50px rgba(255, 140, 0, 0.6);
        filter: blur(3px);
      }

      .volcanic-power {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 300px;
        height: 300px;
        margin: -150px 0 0 -150px;
        background: radial-gradient(circle, 
          rgba(255, 120, 50, 0.6),
          rgba(255, 69, 0, 0.5),
          rgba(200, 50, 0, 0.3),
          transparent);
        animation: energyField 2.5s ease-in-out infinite;
        box-shadow: 
          0 0 80px rgba(255, 69, 0, 0.7),
          inset 0 0 60px rgba(255, 140, 0, 0.4);
      }

      /* 水君专属 - 增强冰水特效 */
      .pure-water {
        position: absolute;
        width: 80px;
        height: 100px;
        background: linear-gradient(135deg, 
          rgba(220, 240, 255, 0.98),
          rgba(180, 220, 255, 0.95),
          rgba(135, 206, 250, 0.9),
          rgba(100, 170, 230, 0.7),
          rgba(70, 130, 180, 0.5));
        clip-path: polygon(50% 0%, 70% 30%, 100% 100%, 50% 85%, 0% 100%, 30% 30%);
        animation: bubbleRise 4s ease-out infinite;
        box-shadow: 
          0 0 50px rgba(135, 206, 250, 0.9),
          0 0 90px rgba(100, 170, 230, 0.6),
          inset 0 0 40px rgba(220, 240, 255, 0.7);
        filter: brightness(1.3);
      }
      .water-1 { left: 15%; bottom: 0; animation-delay: 0s; }
      .water-2 { left: 50%; bottom: 0; animation-delay: 1.3s; }
      .water-3 { left: 80%; bottom: 0; animation-delay: 2.6s; }

      .crystal-ribbon {
        position: absolute;
        width: 150px;
        height: 8px;
        background: linear-gradient(90deg, 
          transparent, 
          rgba(220, 240, 255, 0.95),
          rgba(200, 230, 255, 0.98),
          rgba(176, 224, 230, 0.95),
          rgba(150, 210, 240, 0.9),
          transparent);
        animation: windBlow 3.5s ease-in-out infinite;
        box-shadow: 
          0 0 30px rgba(176, 224, 230, 0.9),
          0 0 60px rgba(135, 206, 250, 0.6);
        filter: brightness(1.4);
      }
      .ribbon-1 { top: 30%; animation-delay: 0s; }
      .ribbon-2 { top: 60%; animation-delay: 1.7s; }

      .purification-aura {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 250px;
        height: 250px;
        margin: -125px 0 0 -125px;
        border: 5px solid rgba(180, 220, 255, 0.9);
        border-radius: 50%;
        animation: pulseGlow 3.5s ease-in-out infinite;
        box-shadow: 
          0 0 50px rgba(135, 206, 250, 0.8),
          0 0 100px rgba(100, 170, 230, 0.5),
          inset 0 0 60px rgba(200, 230, 255, 0.4);
      }

      /* 凤王专属 */
      .rainbow-beam {
        position: absolute;
        left: 50%;
        width: 250px;
        height: 5px;
        background: linear-gradient(90deg, 
          rgba(255, 0, 0, 0.6),
          rgba(255, 165, 0, 0.6),
          rgba(255, 255, 0, 0.6),
          rgba(0, 255, 0, 0.6),
          rgba(0, 0, 255, 0.6),
          rgba(75, 0, 130, 0.6)
        );
        transform-origin: left center;
        animation: lightRotate 8s linear infinite;
      }
      .beam-1 { top: 30%; animation-delay: 0s; }
      .beam-2 { top: 60%; animation-delay: 4s; }

      .rebirth-flame {
        position: absolute;
        left: 50%;
        top: 40%;
        width: 120px;
        height: 120px;
        margin: -60px 0 0 -60px;
        background: radial-gradient(circle, rgba(255, 140, 0, 0.6), transparent);
        animation: solarFlare 3s ease-in-out infinite;
      }

      .eternal-flame {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 200px;
        height: 200px;
        margin: -100px 0 0 -100px;
        background: radial-gradient(circle, rgba(255, 215, 0, 0.3), transparent);
        animation: pulseGlow 4s ease-in-out infinite;
      }

      /* 洛奇亚专属 */
      .ocean-deep {
        position: absolute;
        bottom: 0;
        width: 100%;
        height: 80%;
        background: linear-gradient(to top, rgba(25, 25, 112, 0.6), transparent);
        animation: waveMove 10s linear infinite;
      }
      .deep-1 { animation-delay: 0s; }
      .deep-2 { animation-delay: 5s; opacity: 0.6; }

      .silver-wing {
        position: absolute;
        width: 70px;
        height: 50px;
        background: radial-gradient(ellipse, rgba(192, 192, 192, 0.7), transparent);
        clip-path: polygon(0% 50%, 50% 0%, 100% 50%, 50% 100%);
        animation: featherFall 7s ease-in-out infinite;
      }
      .wing-1 { left: 20%; top: -10%; animation-delay: 0s; }
      .wing-2 { left: 50%; top: -10%; animation-delay: 2.3s; }
      .wing-3 { left: 75%; top: -10%; animation-delay: 4.6s; }

      .whirlpool {
        position: absolute;
        left: 50%;
        width: 150px;
        height: 150px;
        margin-left: -75px;
        border: 3px solid rgba(70, 130, 180, 0.6);
        border-radius: 50%;
        animation: spiralRotate 4s linear infinite;
      }
      .vortex-1 { top: 30%; animation-delay: 0s; }
      .vortex-2 { top: 60%; animation-delay: 2s; }

      .aeroblast-wave {
        position: absolute;
        left: 50%;
        width: 300px;
        height: 3px;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent);
        transform-origin: left center;
        animation: swordSlash 2.5s ease-out infinite;
      }

      /* 时拉比专属 */
      .green-leaf {
        position: absolute;
        width: 25px;
        height: 35px;
        background: linear-gradient(135deg, rgba(34, 139, 34, 0.8), rgba(144, 238, 144, 0.6));
        clip-path: polygon(50% 0%, 100% 40%, 80% 100%, 50% 90%, 20% 100%, 0% 40%);
        animation: leafFloat 5s ease-in-out infinite;
      }
      .leaf-1 { left: 25%; top: 20%; animation-delay: 0s; }
      .leaf-2 { left: 55%; top: 40%; animation-delay: 1.6s; }
      .leaf-3 { left: 75%; top: 60%; animation-delay: 3.2s; }

      .life-energy {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 180px;
        height: 180px;
        margin: -90px 0 0 -90px;
        background: radial-gradient(circle, rgba(144, 238, 144, 0.4), transparent);
        animation: pulseGlow 3s ease-in-out infinite;
      }

      .time-portal {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 120px;
        height: 120px;
        margin: -60px 0 0 -60px;
        border: 3px solid rgba(106, 218, 106, 0.7);
        border-radius: 50%;
        animation: holeOpen 4s ease-in-out infinite;
      }

      /* ========== 第二批：3代传说专属 ========== */

      /* 盖欧卡专属 - 增强海洋特效 */
      .tidal-wave {
        position: absolute;
        bottom: 0;
        width: 250%;
        height: 70%;
        background: linear-gradient(to top, 
          rgba(30, 144, 255, 0.95), 
          rgba(65, 170, 255, 0.7),
          rgba(100, 190, 255, 0.4),
          transparent);
        animation: waveMove 7s linear infinite;
        box-shadow: 0 -20px 60px rgba(30, 144, 255, 0.6);
      }
      .wave-1 { animation-delay: 0s; }
      .wave-2 { animation-delay: 2.3s; opacity: 0.85; }
      .wave-3 { animation-delay: 4.6s; opacity: 0.7; }

      .water-sphere {
        position: absolute;
        width: 120px;
        height: 120px;
        background: radial-gradient(circle at 30% 30%, 
          rgba(200, 240, 255, 0.95), 
          rgba(100, 180, 240, 0.8),
          rgba(50, 140, 220, 0.6),
          transparent);
        border-radius: 50%;
        animation: bubbleRise 5s ease-out infinite;
        box-shadow: 
          0 0 30px rgba(100, 180, 240, 0.8),
          inset 0 0 40px rgba(255, 255, 255, 0.4);
      }
      .sphere-1 { left: 25%; bottom: 0; animation-delay: 0s; }
      .sphere-2 { left: 70%; bottom: 0; animation-delay: 2.5s; }

      .storm-lightning {
        position: absolute;
        width: 8px;
        height: 100%;
        background: linear-gradient(to bottom, 
          #ffffff, 
          #8ed4ff, 
          #4db8ff, 
          rgba(77, 184, 255, 0.3));
        animation: lightningFlash 3s ease-in-out infinite;
        box-shadow: 
          0 0 40px #4db8ff,
          0 0 80px rgba(77, 184, 255, 0.6),
          0 0 120px rgba(77, 184, 255, 0.3);
        filter: brightness(1.5);
      }
      .bolt-1 { left: 30%; animation-delay: 0s; }
      .bolt-2 { left: 70%; animation-delay: 1.5s; }

      .origin-pulse {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 280px;
        height: 280px;
        margin: -140px 0 0 -140px;
        border: 5px solid rgba(100, 200, 255, 0.9);
        border-radius: 50%;
        animation: pulseWave 3s ease-out infinite;
        box-shadow: 
          0 0 40px rgba(100, 200, 255, 0.8),
          0 0 80px rgba(30, 144, 255, 0.5),
          inset 0 0 60px rgba(100, 200, 255, 0.3);
      }

      .primordial-sea {
        position: absolute;
        width: 100%;
        height: 100%;
        background: radial-gradient(ellipse at bottom, 
          rgba(25, 25, 112, 0.7),
          rgba(30, 60, 150, 0.5),
          rgba(40, 80, 180, 0.3),
          transparent);
        animation: auroraPulse 4s ease-in-out infinite;
      }

      /* 烈空座专属 */
      .sky-pillar {
        position: absolute;
        width: 8px;
        height: 100%;
        background: linear-gradient(to bottom, rgba(106, 173, 90, 0.7), transparent);
        animation: pulseGlow 3s ease-in-out infinite;
      }
      .pillar-1 { left: 35%; animation-delay: 0s; }
      .pillar-2 { left: 65%; animation-delay: 1.5s; }

      .dragon-tornado {
        position: absolute;
        left: 50%;
        bottom: 0;
        width: 100px;
        height: 250px;
        margin-left: -50px;
        background: linear-gradient(to top, rgba(106, 173, 90, 0.5), transparent);
        clip-path: polygon(40% 0%, 60% 0%, 80% 100%, 20% 100%);
        animation: tornadoSpin 3s linear infinite;
      }
      .tornado-1 { animation-delay: 0s; }
      .tornado-2 { animation-delay: 1.5s; transform: scale(0.7); }

      .ozone-layer {
        position: absolute;
        top: 0;
        width: 100%;
        height: 100px;
        background: linear-gradient(to bottom, rgba(173, 216, 230, 0.4), transparent);
        animation: auroraPulse 5s ease-in-out infinite;
      }
      .layer-1 { animation-delay: 0s; }
      .layer-2 { animation-delay: 2.5s; }

      .mega-aura {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 300px;
        height: 300px;
        margin: -150px 0 0 -150px;
        border: 3px solid rgba(106, 173, 90, 0.6);
        border-radius: 50%;
        animation: ringExpand 3.5s ease-out infinite;
      }

      /* 基拉祈专属 */
      .star-dust {
        position: absolute;
        width: 12px;
        height: 12px;
        background: radial-gradient(circle, rgba(255, 240, 150, 0.9), transparent);
        border-radius: 50%;
        animation: particleFloat 5s ease-out infinite;
      }
      .dust-1 { left: 20%; top: 10%; --tx: 40px; --ty: -60px; animation-delay: 0s; }
      .dust-2 { left: 60%; top: 30%; --tx: -30px; --ty: -70px; animation-delay: 1.6s; }
      .dust-3 { left: 80%; top: 50%; --tx: 20px; --ty: -50px; animation-delay: 3.2s; }

      .wish-ribbon {
        position: absolute;
        width: 100px;
        height: 5px;
        background: linear-gradient(90deg, transparent, rgba(255, 223, 127, 0.8), transparent);
        animation: windBlow 4s ease-in-out infinite;
      }
      .ribbon-1 { top: 35%; left: 10%; animation-delay: 0s; }
      .ribbon-2 { top: 65%; left: 50%; animation-delay: 2s; }

      .millennium-wish {
        position: absolute;
        left: 50%;
        top: 40%;
        width: 150px;
        height: 150px;
        margin: -75px 0 0 -75px;
        background: radial-gradient(circle, rgba(255, 223, 127, 0.4), transparent);
        animation: solarFlare 4s ease-in-out infinite;
      }

      /* 代欧奇希斯专属 */
      .space-aurora {
        position: absolute;
        width: 100%;
        height: 120px;
        background: linear-gradient(180deg,
          rgba(255, 100, 100, 0.2),
          rgba(200, 100, 255, 0.2),
          rgba(100, 200, 255, 0.2)
        );
        animation: auroraPulse 5s ease-in-out infinite;
        filter: blur(15px);
      }
      .aurora-1 { top: 0; animation-delay: 0s; }
      .aurora-2 { top: 40%; animation-delay: 2.5s; }

      .form-crystal {
        position: absolute;
        width: 30px;
        height: 30px;
        background: linear-gradient(45deg, rgba(255, 90, 70, 0.8), rgba(255, 140, 120, 0.6));
        clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
        animation: diamondShine 2.5s ease-in-out infinite;
      }
      .crystal-1 { left: 25%; top: 25%; animation-delay: 0s; }
      .crystal-2 { left: 70%; top: 60%; animation-delay: 1.2s; }

      .meteor-virus {
        position: absolute;
        left: 50%;
        top: 30%;
        width: 100px;
        height: 100px;
        margin: -50px 0 0 -50px;
        background: radial-gradient(circle, rgba(255, 50, 50, 0.6), transparent);
        animation: pulseGlow 2s ease-in-out infinite;
      }

      .psycho-boost {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 250px;
        height: 250px;
        margin: -125px 0 0 -125px;
        border: 3px solid rgba(255, 90, 70, 0.6);
        border-radius: 50%;
        animation: ringExpand 3s ease-out infinite;
      }

      /* ========== 第三批：4代传说专属 ========== */

      /* 帝牙卢卡专属 */
      .temporal-wave {
        position: absolute;
        width: 100%;
        height: 4px;
        background: linear-gradient(90deg, transparent, rgba(100, 149, 237, 0.8), transparent);
        animation: pulseWave 3.5s ease-out infinite;
      }

      .clock-hand {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 120px;
        height: 4px;
        margin-top: -2px;
        background: linear-gradient(to right, transparent, rgba(100, 149, 237, 0.9), transparent);
        transform-origin: left center;
        animation: lightRotate 20s linear infinite;
      }
      .hand-1 { animation-delay: 0s; }
      .hand-2 { animation-delay: 10s; width: 80px; }

      .time-distortion {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 180px;
        height: 180px;
        margin: -90px 0 0 -90px;
        background: radial-gradient(circle, rgba(100, 149, 237, 0.3), transparent);
        animation: portalWarp 5s ease-in-out infinite;
      }
      .distortion-1 { animation-delay: 0s; }
      .distortion-2 { animation-delay: 2.5s; transform: scale(0.6); }

      .roar-of-time {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 300px;
        height: 300px;
        margin: -150px 0 0 -150px;
        border: 4px solid rgba(100, 149, 237, 0.6);
        border-radius: 50%;
        animation: ringExpand 4s ease-out infinite;
      }

      .adamant-orb {
        position: absolute;
        left: 50%;
        top: 30%;
        width: 60px;
        height: 60px;
        margin: -30px 0 0 -30px;
        background: radial-gradient(circle, rgba(100, 149, 237, 0.9), transparent);
        border-radius: 50%;
        animation: pulseGlow 2.5s ease-in-out infinite;
      }

      /* 帕路奇亚专属 */
      .space-rift {
        position: absolute;
        width: 4px;
        height: 100%;
        background: linear-gradient(to bottom, rgba(218, 154, 218, 0.9), transparent);
        animation: dimensionRift 3s ease-in-out infinite;
        box-shadow: 0 0 20px rgba(218, 154, 218, 0.7);
      }
      .rift-1 { left: 25%; animation-delay: 0s; }
      .rift-2 { left: 50%; animation-delay: 1s; }
      .rift-3 { left: 75%; animation-delay: 2s; }

      .spatial-wave {
        position: absolute;
        width: 100%;
        height: 4px;
        background: linear-gradient(90deg, transparent, rgba(218, 154, 218, 0.8), transparent);
        animation: pulseWave 3.5s ease-out infinite;
      }

      .space-distortion {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 200px;
        height: 200px;
        margin: -100px 0 0 -100px;
        background: radial-gradient(ellipse, rgba(218, 154, 218, 0.3), transparent);
        animation: portalWarp 5s ease-in-out infinite;
      }

      .spacial-rend {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 320px;
        height: 320px;
        margin: -160px 0 0 -160px;
        border: 4px solid rgba(218, 154, 218, 0.6);
        border-radius: 50%;
        animation: ringExpand 4s ease-out infinite;
      }

      .lustrous-orb {
        position: absolute;
        left: 50%;
        top: 30%;
        width: 60px;
        height: 60px;
        margin: -30px 0 0 -30px;
        background: radial-gradient(circle, rgba(218, 154, 218, 0.9), transparent);
        border-radius: 50%;
        animation: pulseGlow 2.5s ease-in-out infinite;
      }

      /* 骑拉帝纳专属 */
      .antimatter-sphere {
        position: absolute;
        width: 80px;
        height: 80px;
        background: radial-gradient(circle, rgba(80, 40, 80, 0.8), transparent);
        border-radius: 50%;
        animation: darkVoid 3.5s ease-out infinite;
      }
      .sphere-1 { left: 30%; top: 25%; animation-delay: 0s; }
      .sphere-2 { left: 65%; top: 55%; animation-delay: 1.7s; }

      .distortion-world {
        position: absolute;
        width: 100%;
        height: 100%;
        background: radial-gradient(ellipse at center, rgba(60, 20, 60, 0.3), transparent);
        animation: portalWarp 6s ease-in-out infinite;
      }
      .world-1 { animation-delay: 0s; }
      .world-2 { animation-delay: 3s; transform: scale(0.7); }

      .ghostly-aura {
        position: absolute;
        width: 150px;
        height: 150px;
        background: radial-gradient(circle, rgba(120, 80, 120, 0.4), transparent);
        animation: shadowWave 4s ease-out infinite;
      }
      .aura-1 { left: 20%; top: 30%; animation-delay: 0s; }
      .aura-2 { left: 70%; top: 60%; animation-delay: 2s; }

      .shadow-force {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 280px;
        height: 280px;
        margin: -140px 0 0 -140px;
        border: 4px solid rgba(80, 40, 80, 0.7);
        border-radius: 50%;
        animation: ringExpand 4.5s ease-out infinite;
      }

      .griseous-orb {
        position: absolute;
        left: 50%;
        top: 30%;
        width: 70px;
        height: 70px;
        margin: -35px 0 0 -35px;
        background: radial-gradient(circle, rgba(80, 40, 80, 0.9), transparent);
        border-radius: 50%;
        animation: pulseGlow 2.5s ease-in-out infinite;
      }

      /* 阿尔宙斯专属 */
      .omnipotent-power {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 350px;
        height: 350px;
        margin: -175px 0 0 -175px;
        background: radial-gradient(circle, rgba(255, 255, 255, 0.2), transparent);
        animation: energyField 4s ease-in-out infinite;
      }

      .genesis-particle {
        position: absolute;
        width: 20px;
        height: 20px;
        background: radial-gradient(circle, rgba(255, 255, 255, 0.9), transparent);
        border-radius: 50%;
        animation: particleFloat 5s ease-out infinite;
      }

      .judgment-ray {
        position: absolute;
        left: 50%;
        top: 20%;
        width: 350px;
        height: 4px;
        background: linear-gradient(to right, transparent, rgba(255, 215, 0, 0.9), transparent);
        transform-origin: left center;
        animation: lightRotate 10s linear infinite;
      }

      .multitype-aura {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 400px;
        height: 400px;
        margin: -200px 0 0 -200px;
        border: 4px solid rgba(255, 215, 0, 0.5);
        border-radius: 50%;
        animation: ringExpand 5s ease-out infinite;
      }

      /* ========== 第四批：5代及更多传说宝可梦 ========== */

      /* 雷希拉姆/捷克罗姆/酋雷姆专属 */
      .blue-flare, .fusion-flare, .turboblaze, .bolt-strike, .fusion-bolt, .teravolt {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 200px;
        height: 200px;
        margin: -100px 0 0 -100px;
        background: radial-gradient(circle, rgba(255, 200, 150, 0.5), transparent);
        animation: energyField 3s ease-in-out infinite;
      }

      .glaciate, .dna-splicers {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 150px;
        height: 150px;
        margin: -75px 0 0 -75px;
        background: radial-gradient(circle, rgba(150, 200, 255, 0.6), transparent);
        animation: pulseGlow 2.5s ease-in-out infinite;
      }

      /* 比克提尼/美洛耶塔/盖诺赛克特 */
      .v-create, .aria-aura, .pirouette-spin, .relic-song {
        position: absolute;
        width: 120px;
        height: 120px;
        background: radial-gradient(circle, rgba(255, 180, 100, 0.6), transparent);
        animation: sacredFire 2.5s ease-in-out infinite;
      }

      .cyborg-aura, .ancient-tech, .techno-blast {
        position: absolute;
        width: 100%;
        height: 100%;
        background: radial-gradient(ellipse, rgba(150, 80, 180, 0.3), transparent);
        animation: energyField 3.5s ease-in-out infinite;
      }

      /* 土地云专属 */
      .ground-force, .abundance-aura {
        position: absolute;
        bottom: 0;
        width: 100%;
        height: 40%;
        background: linear-gradient(to top, rgba(139, 90, 43, 0.6), transparent);
        animation: quakeShake 0.8s ease-in-out infinite;
      }

      /* 6代传说 */
      .geomancy, .eternal-life, .oblivion-wing, .death-embrace {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 250px;
        height: 250px;
        margin: -125px 0 0 -125px;
        background: radial-gradient(circle, rgba(200, 150, 255, 0.4), transparent);
        animation: pulseGlow 3.5s ease-in-out infinite;
      }

      .complete-form, .ecosystem-balance {
        position: absolute;
        width: 100%;
        height: 100%;
        background: radial-gradient(ellipse, rgba(106, 173, 106, 0.3), transparent);
        animation: cellFloat 4s ease-in-out infinite;
      }

      /* 7代传说 */
      .sunsteel-strike, .full-metal-body, .moongeist-beam, .shadow-shield {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 200px;
        height: 200px;
        margin: -100px 0 0 -100px;
        background: radial-gradient(circle, rgba(255, 200, 100, 0.5), transparent);
        animation: solarFlare 3s ease-in-out infinite;
      }

      .photon-geyser, .light-devourer {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 300px;
        height: 300px;
        margin: -150px 0 0 -150px;
        background: radial-gradient(circle, rgba(255, 255, 255, 0.3), transparent);
        animation: energyField 3.5s ease-in-out infinite;
      }

      .soul-stealing, .spectral-thief {
        position: absolute;
        width: 100%;
        height: 100%;
        background: radial-gradient(ellipse, rgba(80, 40, 120, 0.4), transparent);
        animation: shadowWave 4s ease-out infinite;
      }

      /* 8代传说 */
      .intrepid-sword, .crowned-sword, .dauntless-shield, .crowned-shield {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 250px;
        height: 250px;
        margin: -125px 0 0 -125px;
        border: 4px solid rgba(100, 149, 237, 0.6);
        border-radius: 50%;
        animation: shieldPulse 3s ease-in-out infinite;
      }

      .infinity-form, .eternamax, .dynamax-cannon {
        position: absolute;
        width: 100%;
        height: 100%;
        background: radial-gradient(ellipse, rgba(150, 50, 150, 0.3), transparent);
        animation: portalWarp 5s ease-in-out infinite;
      }

      .glacial-lance, .astral-barrage {
        position: absolute;
        width: 4px;
        height: 100%;
        background: linear-gradient(to bottom, rgba(200, 230, 255, 0.8), transparent);
        animation: lightningFlash 2.5s ease-in-out infinite;
      }

      /* 9代传说 */
      .collision-course, .orichalcum-pulse, .electro-drift, .hadron-engine {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 280px;
        height: 280px;
        margin: -140px 0 0 -140px;
        background: radial-gradient(circle, rgba(255, 150, 100, 0.4), transparent);
        animation: energyField 3s ease-in-out infinite;
      }

      /* 三神鸟专属 */
      .voltage-pulse, .thunder-legend, .absolute-zero, .ice-legend, .sky-attack, .fire-legend {
        position: absolute;
        width: 150px;
        height: 150px;
        background: radial-gradient(circle, rgba(200, 200, 255, 0.6), transparent);
        animation: pulseGlow 2.5s ease-in-out infinite;
      }

      /* 三神柱专属 */
      .golem-power, .clear-body, .ice-beam-ancient, .flash-cannon {
        position: absolute;
        width: 100px;
        height: 100px;
        background: radial-gradient(circle, rgba(150, 150, 150, 0.7), transparent);
        animation: rockFall 3s ease-in infinite;
      }

      .crush-grip, .slow-start, .continent-move {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 300px;
        height: 300px;
        margin: -150px 0 0 -150px;
        background: radial-gradient(circle, rgba(200, 200, 200, 0.3), transparent);
        animation: pulseGlow 4s ease-in-out infinite;
      }

      /* 卡璞守护神 */
      .electric-surge, .psychic-surge, .grassy-surge, .misty-surge, .nature-guardian {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 220px;
        height: 220px;
        margin: -110px 0 0 -110px;
        border: 3px solid rgba(255, 200, 150, 0.6);
        border-radius: 50%;
        animation: pulseGlow 3s ease-in-out infinite;
      }

      /* 无限宝可梦 */
      .levitate-aura, .psychic-aura {
        position: absolute;
        width: 100%;
        height: 100%;
        background: radial-gradient(ellipse, rgba(200, 100, 200, 0.3), transparent);
        animation: cellFloat 4s ease-in-out infinite;
      }

      /* 究极异兽 */
      .parasitic-aura, .ultra-space, .blood-drain, .beauty-aura, .hypnosis-glow,
      .heavy-slam, .leaf-blade, .gluttony-aura {
        position: absolute;
        width: 150px;
        height: 150px;
        background: radial-gradient(circle, rgba(160, 144, 208, 0.6), transparent);
        animation: wormhole 3s linear infinite;
      }

      /* 幻之宝可梦 */
      .diamond-storm, .mega-evolution, .unbound-power, .steam-eruption,
      .water-absorb, .fleur-cannon, .volt-absorb, .double-iron-bash, .iron-defense {
        position: absolute;
        width: 120px;
        height: 120px;
        background: radial-gradient(circle, rgba(255, 192, 203, 0.6), transparent);
        animation: sparkle 2s ease-in-out infinite;
      }

      /* 风云雷电云 */
      .hurricane-force, .defiant-wind, .defiant-storm {
        position: absolute;
        width: 100%;
        height: 60px;
        background: linear-gradient(90deg, transparent, rgba(180, 210, 230, 0.5), transparent);
        animation: windBlow 2s ease-in-out infinite;
      }

      /* 特殊技能效果 */
      .genesis-wave, .omnipotent-aura, .prince-aura, .eternal-darkness,
      .seed-flare, .sky-forme-wind, .reversed-gravity {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 250px;
        height: 250px;
        margin: -125px 0 0 -125px;
        background: radial-gradient(circle, rgba(255, 255, 255, 0.3), transparent);
        animation: pulseGlow 3.5s ease-in-out infinite;
      }

      /* 心灵交换等特殊效果 */
      .heart-swap {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 100px;
        height: 100px;
        margin: -50px 0 0 -50px;
        background: radial-gradient(circle, rgba(255, 192, 203, 0.7), transparent);
        animation: heartBeat 2s ease-in-out infinite;
      }

      /* ========== 缺失的专属class - 紧急补充 ========== */

      /* 玛纳霏专属 */
      .ocean-ripple {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 200px;
        height: 200px;
        margin: -100px 0 0 -100px;
        border: 3px solid rgba(51, 153, 255, 0.6);
        border-radius: 50%;
        animation: ringExpand 4s ease-out infinite;
      }

      .water-crown {
        position: absolute;
        left: 50%;
        top: 20%;
        width: 80px;
        height: 80px;
        margin: -40px 0 0 -40px;
        background: radial-gradient(circle, rgba(51, 153, 255, 0.8), transparent);
        clip-path: polygon(50% 0%, 65% 35%, 100% 35%, 70% 60%, 80% 100%, 50% 75%, 20% 100%, 30% 60%, 0% 35%, 35% 35%);
        animation: pulseGlow 3s ease-in-out infinite;
      }

      .jellyfish-glow {
        position: absolute;
        width: 60px;
        height: 80px;
        background: radial-gradient(ellipse at top, rgba(100, 180, 255, 0.7), transparent);
        border-radius: 50% 50% 40% 40%;
        animation: cellFloat 4s ease-in-out infinite;
      }
      .glow-1 { left: 25%; top: 40%; animation-delay: 0s; }
      .glow-2 { left: 70%; top: 50%; animation-delay: 2s; }

      .deep-sea-bubble {
        position: absolute;
        width: 40px;
        height: 40px;
        background: radial-gradient(circle at 30% 30%, rgba(200, 230, 255, 0.7), rgba(150, 200, 255, 0.4));
        border-radius: 50%;
        animation: bubbleRise 5s ease-out infinite;
      }

      /* 达克莱伊专属 */
      .nightmare-mist {
        position: absolute;
        width: 100px;
        height: 100px;
        background: radial-gradient(circle, rgba(26, 26, 45, 0.7), transparent);
        border-radius: 50%;
        animation: smokeRise 5s ease-out infinite;
      }

      .shadow-claw {
        position: absolute;
        width: 60px;
        height: 80px;
        background: linear-gradient(135deg, rgba(0, 0, 0, 0.8), transparent);
        clip-path: polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%);
        animation: shadowWave 3s ease-out infinite;
      }

      /* 谢米专属 */
      .flower-bloom {
        position: absolute;
        width: 50px;
        height: 50px;
        background: radial-gradient(circle, rgba(255, 182, 193, 0.8), transparent);
        clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
        animation: leafFloat 4s ease-in-out infinite;
      }

      .grass-aura {
        position: absolute;
        width: 100%;
        height: 100%;
        background: radial-gradient(ellipse, rgba(144, 238, 144, 0.2), transparent);
        animation: auroraPulse 4s ease-in-out infinite;
      }

      /* 5代龙系专属 */
      .white-fire, .black-thunder, .ice-crystal-aura {
        position: absolute;
        width: 120px;
        height: 120px;
        background: radial-gradient(circle, rgba(255, 240, 230, 0.6), transparent);
        border-radius: 50%;
        animation: dragonFlame 3s ease-in-out infinite;
      }

      .truth-flame, .ideal-thunder, .freeze-shock {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 250px;
        height: 250px;
        margin: -125px 0 0 -125px;
        background: radial-gradient(circle, rgba(255, 200, 150, 0.3), transparent);
        animation: energyField 3.5s ease-in-out infinite;
      }

      /* 比克提尼专属 */
      .victory-star, .v-aura {
        position: absolute;
        width: 60px;
        height: 60px;
        background: radial-gradient(circle, rgba(255, 200, 100, 0.9), transparent);
        clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
        animation: starTwinkle 2s ease-in-out infinite;
      }

      /* 美洛耶塔专属 */
      .musical-note {
        position: absolute;
        width: 30px;
        height: 40px;
        background: radial-gradient(circle, rgba(255, 192, 203, 0.8), transparent);
        animation: particleFloat 4s ease-out infinite;
      }

      .melody-wave {
        position: absolute;
        width: 100%;
        height: 3px;
        background: linear-gradient(90deg, transparent, rgba(255, 192, 203, 0.7), transparent);
        animation: pulseWave 3s ease-out infinite;
      }

      /* 盖诺赛克特专属 */
      .plasma-cannon {
        position: absolute;
        left: 50%;
        top: 30%;
        width: 80px;
        height: 80px;
        margin: -40px 0 0 -40px;
        background: radial-gradient(circle, rgba(150, 80, 180, 0.8), transparent);
        animation: pulseGlow 2s ease-in-out infinite;
      }

      /* 土地云专属 */
      .earth-tremor {
        position: absolute;
        bottom: 0;
        width: 100%;
        height: 5px;
        background: linear-gradient(90deg, transparent, rgba(139, 90, 43, 0.8), transparent);
        animation: quakeShake 0.5s ease-in-out infinite;
      }

      .sand-storm {
        position: absolute;
        width: 20px;
        height: 20px;
        background: radial-gradient(circle, rgba(194, 178, 128, 0.7), transparent);
        animation: particleFloat 3s ease-out infinite;
      }

    `;
