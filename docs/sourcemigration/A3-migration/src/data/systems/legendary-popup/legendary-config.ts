/**
 * legendary-popup 传说配置表（独立 chunk 拆分：数据）
 * ---------------------------------------------------------------------------
 * 来源：game/server/dist/assets/legendary-popup-CYOZDx4m.js（.orig 独立 chunk）
 * 逆向方式：`c(短名,"原名")` 反查
 * 锚点树：90df65097b6df76f713e6bd108afa84499e8b993
 *
 * 定位：传说宝可梦 → 弹窗配置（`bgGradient` 背景渐变 + `animation` 动画 HTML 片段
 *       + `title` / `borderColor` / `glowColor`）。共 128 KB 模板数据，
 *       覆盖约 100 只传说/幻兽/异兽/悖论种。
 *
 * 产物符号对照：
 *   f    → getLegendaryConfig
 *   e    → SpeciesId（从主 chunk 导入）
 *   c    → keepNames 包装（迁移时省略）
 *
 * ⚠️ 本文件由产物**逐字提取**，请勿手工排版。
 */
import { SpeciesId } from "#enums/species-id";

/** 产物短名别名（config 体逐字引用 `e`） */
const e = SpeciesId;

/** 传说弹窗配置（产物 `getLegendaryConfig` 的返回值） */
export interface LegendaryPopupConfig {
  bgGradient: string;
  animation: string;
  title?: string;
  borderColor?: string;
  glowColor?: string;
  [key: string]: unknown;
}

/** 产物 `f` — 按「物种中文名 / speciesId」取传说弹窗配置（逐字提取） */
export function getLegendaryConfig(o,i){const a=o.toLowerCase();return a.includes("超梦")||i===e.MEWTWO?{bgGradient:"linear-gradient(180deg, #000000 0%, #0a0520 10%, #1a0d2e 30%, #2d1b4e 50%, #6b4c9a 80%, #9d7bc7 100%)",animation:`
        <div class="mewtwo-scene">
          <div class="psychic-sphere sphere-1"></div>
          <div class="psychic-sphere sphere-2"></div>
          <div class="psychic-sphere sphere-3"></div>
          <div class="psychic-sphere sphere-4"></div>
          <div class="psychic-sphere sphere-5"></div>
          <div class="mind-wave wave-1"></div>
          <div class="mind-wave wave-2"></div>
          <div class="mind-wave wave-3"></div>
          <div class="mind-wave wave-4"></div>
          <div class="psychic-ripple ripple-1"></div>
          <div class="psychic-ripple ripple-2"></div>
          <div class="psychic-ripple ripple-3"></div>
          <div class="dna-helix helix-1"></div>
          <div class="dna-helix helix-2"></div>
          <div class="dna-helix helix-3"></div>
          <div class="power-surge surge-1"></div>
          <div class="power-surge surge-2"></div>
          <div class="telekinesis-force force-1"></div>
          <div class="telekinesis-force force-2"></div>
          <div class="psychic-storm"></div>
          <div class="mind-control"></div>
          <div class="genetic-code code-1"></div>
          <div class="genetic-code code-2"></div>
          <div class="screen-distortion"></div>
        </div>
      `,borderColor:"#6b4c9a",glowColor:"#b87bff",title:"最强基因",subtitle:"念力觉醒 • 基因突破 • 意念操控",animationDuration:3e3}:a.includes("梦幻")||i===e.MEW?{bgGradient:"linear-gradient(180deg, #ffffff 0%, #ffe0f0 10%, #fce4ec 30%, #f8bbd0 50%, #f48fb1 70%, #f06292 90%, #ec407a 100%)",animation:`
        <div class="mew-scene">
          <div class="pink-bubble bubble-1"></div>
          <div class="pink-bubble bubble-2"></div>
          <div class="pink-bubble bubble-3"></div>
          <div class="pink-bubble bubble-4"></div>
          <div class="pink-bubble bubble-5"></div>
          <div class="pink-bubble bubble-6"></div>
          <div class="dream-particle particle-1"></div>
          <div class="dream-particle particle-2"></div>
          <div class="dream-particle particle-3"></div>
          <div class="dream-particle particle-4"></div>
          <div class="dream-particle particle-5"></div>
          <div class="dream-particle particle-6"></div>
          <div class="playful-ring ring-1"></div>
          <div class="playful-ring ring-2"></div>
          <div class="playful-ring ring-3"></div>
          <div class="sparkle-trail trail-1"></div>
          <div class="sparkle-trail trail-2"></div>
          <div class="sparkle-trail trail-3"></div>
          <div class="sparkle-trail trail-4"></div>
          <div class="rainbow-aura"></div>
          <div class="transform-flash flash-1"></div>
          <div class="transform-flash flash-2"></div>
          <div class="genetic-memory"></div>
        </div>
      `,borderColor:"#f48fb1",glowColor:"#ffd0e8",title:"幻之始祖",subtitle:"纯真梦幻 • 万能基因 • 无限可能",animationDuration:3e3}:a.includes("雷公")||i===e.RAIKOU?{bgGradient:"linear-gradient(180deg, #000000 0%, #0d1b2a 20%, #1b2a4a 40%, #2c4a7c 70%, #4a7ba7 100%)",animation:`
        <div class="raikou-scene">
          <div class="thunder-cloud cloud-1"></div>
          <div class="thunder-cloud cloud-2"></div>
          <div class="thunder-cloud cloud-3"></div>
          <div class="thunder-cloud cloud-4"></div>
          <div class="lightning-strike strike-1"></div>
          <div class="lightning-strike strike-2"></div>
          <div class="lightning-strike strike-3"></div>
          <div class="lightning-strike strike-4"></div>
          <div class="lightning-strike strike-5"></div>
          <div class="electric-spark spark-1"></div>
          <div class="electric-spark spark-2"></div>
          <div class="electric-spark spark-3"></div>
          <div class="electric-spark spark-4"></div>
          <div class="electric-spark spark-5"></div>
          <div class="electric-spark spark-6"></div>
          <div class="thunder-roar roar-1"></div>
          <div class="thunder-roar roar-2"></div>
          <div class="voltage-surge"></div>
          <div class="electric-field"></div>
          <div class="thunder-fang fang-1"></div>
          <div class="thunder-fang fang-2"></div>
        </div>
      `,borderColor:"#4a7ba7",glowColor:"#8ec5ff",title:"雷鸣传说",subtitle:"迅雷奔腾 • 电光石火 • 雷霆万钧",animationDuration:3e3}:a.includes("炎帝")||i===e.ENTEI?{bgGradient:"linear-gradient(180deg, #1a0000 0%, #2d1810 20%, #5d2810 40%, #9d4820 70%, #cd6840 90%, #ff8855 100%)",animation:`
        <div class="entei-scene">
          <div class="sacred-flame flame-1"></div>
          <div class="sacred-flame flame-2"></div>
          <div class="sacred-flame flame-3"></div>
          <div class="sacred-flame flame-4"></div>
          <div class="fire-mane mane-1"></div>
          <div class="fire-mane mane-2"></div>
          <div class="fire-mane mane-3"></div>
          <div class="ember-spark spark-1"></div>
          <div class="ember-spark spark-2"></div>
          <div class="ember-spark spark-3"></div>
          <div class="ember-spark spark-4"></div>
          <div class="ember-spark spark-5"></div>
          <div class="ember-spark spark-6"></div>
          <div class="heat-wave wave-1"></div>
          <div class="heat-wave wave-2"></div>
          <div class="volcanic-power"></div>
          <div class="eruption-roar"></div>
          <div class="magma-armor"></div>
          <div class="flame-charge"></div>
        </div>
      `,borderColor:"#9d4820",glowColor:"#ffaa70",title:"圣火之兽",subtitle:"火山怒吼 • 大地震颤 • 圣火燎原",animationDuration:3e3}:a.includes("水君")||i===e.SUICUNE?{bgGradient:"linear-gradient(180deg, #ffffff 0%, #e0f0ff 10%, #c0e0f8 30%, #3498db 60%, #5dade2 90%, #85c8f0 100%)",animation:`
        <div class="suicune-scene">
          <div class="pure-water water-1"></div>
          <div class="pure-water water-2"></div>
          <div class="pure-water water-3"></div>
          <div class="pure-water water-4"></div>
          <div class="north-wind wind-1"></div>
          <div class="north-wind wind-2"></div>
          <div class="north-wind wind-3"></div>
          <div class="crystal-ribbon ribbon-1"></div>
          <div class="crystal-ribbon ribbon-2"></div>
          <div class="crystal-ribbon ribbon-3"></div>
          <div class="aurora-light light-1"></div>
          <div class="aurora-light light-2"></div>
          <div class="aurora-light light-3"></div>
          <div class="purification-aura"></div>
          <div class="ice-mirror mirror-1"></div>
          <div class="ice-mirror mirror-2"></div>
          <div class="hydro-pump"></div>
          <div class="blizzard-veil"></div>
        </div>
      `,borderColor:"#3498db",glowColor:"#d0f0ff",title:"净化之水",subtitle:"北风守护 • 清泉流淌 • 极光守护",animationDuration:3e3}:a.includes("凤王")||a.includes("凤凰")||i===e.HO_OH?{bgGradient:"linear-gradient(180deg, #ff0000 0%, #ff6b35 15%, #f7931e 30%, #fdc830 45%, #00ff00 60%, #0099ff 75%, #8e44ad 90%, #ff00ff 100%)",animation:`
        <div class="ho-oh-scene">
          <div class="rainbow-feather feather-1"></div>
          <div class="rainbow-feather feather-2"></div>
          <div class="rainbow-feather feather-3"></div>
          <div class="rainbow-feather feather-4"></div>
          <div class="rainbow-feather feather-5"></div>
          <div class="rainbow-feather feather-6"></div>
          <div class="rainbow-feather feather-7"></div>
          <div class="sacred-fire fire-1"></div>
          <div class="sacred-fire fire-2"></div>
          <div class="sacred-fire fire-3"></div>
          <div class="rainbow-beam beam-1"></div>
          <div class="rainbow-beam beam-2"></div>
          <div class="rainbow-beam beam-3"></div>
          <div class="rebirth-flame flame-1"></div>
          <div class="rebirth-flame flame-2"></div>
          <div class="eternal-flame"></div>
          <div class="phoenix-aura"></div>
          <div class="sacred-ash"></div>
          <div class="rainbow-ring ring-1"></div>
          <div class="rainbow-ring ring-2"></div>
        </div>
      `,borderColor:"#f7931e",glowColor:"#fff0a0",title:"虹之勇者",subtitle:"七彩神鸟 • 永恒圣火 • 浴火重生",animationDuration:3e3}:a.includes("洛奇亚")||i===e.LUGIA?{bgGradient:"linear-gradient(180deg, #000033 0%, #0c1c36 20%, #1a3c5a 40%, #2874a6 70%, #5dade2 100%)",animation:`
        <div class="lugia-scene">
          <div class="ocean-deep deep-1"></div>
          <div class="ocean-deep deep-2"></div>
          <div class="ocean-deep deep-3"></div>
          <div class="silver-wing wing-1"></div>
          <div class="silver-wing wing-2"></div>
          <div class="silver-wing wing-3"></div>
          <div class="silver-wing wing-4"></div>
          <div class="silver-wing wing-5"></div>
          <div class="whirlpool vortex-1"></div>
          <div class="whirlpool vortex-2"></div>
          <div class="whirlpool vortex-3"></div>
          <div class="aeroblast-wave wave-1"></div>
          <div class="aeroblast-wave wave-2"></div>
          <div class="aeroblast-wave wave-3"></div>
          <div class="guardian-aura"></div>
          <div class="tidal-surge surge-1"></div>
          <div class="tidal-surge surge-2"></div>
          <div class="psychic-wave"></div>
          <div class="ocean-spirit"></div>
        </div>
      `,borderColor:"#2874a6",glowColor:"#90d0ff",title:"海之守护",subtitle:"银翼飞翔 • 深海镇魂 • 神圣守护",animationDuration:3e3}:a.includes("时拉比")||a.includes("雪拉比")||i===e.CELEBI?{bgGradient:"linear-gradient(180deg, #0a1a0a 0%, #1e5128 25%, #2d7c3f 50%, #4e9f5e 75%, #76c893 100%)",animation:`
        <div class="celebi-scene">
          <div class="forest-light light-1"></div>
          <div class="forest-light light-2"></div>
          <div class="forest-light light-3"></div>
          <div class="forest-light light-4"></div>
          <div class="forest-light light-5"></div>
          <div class="time-ripple ripple-1"></div>
          <div class="time-ripple ripple-2"></div>
          <div class="time-ripple ripple-3"></div>
          <div class="time-ripple ripple-4"></div>
          <div class="green-leaf leaf-1"></div>
          <div class="green-leaf leaf-2"></div>
          <div class="green-leaf leaf-3"></div>
          <div class="green-leaf leaf-4"></div>
          <div class="green-leaf leaf-5"></div>
          <div class="green-leaf leaf-6"></div>
          <div class="life-energy energy-1"></div>
          <div class="life-energy energy-2"></div>
          <div class="time-portal portal-1"></div>
          <div class="time-portal portal-2"></div>
          <div class="nature-blessing"></div>
          <div class="temporal-shift"></div>
        </div>
      `,borderColor:"#4e9f5e",glowColor:"#a0f0c0",title:"时空旅者",subtitle:"森林守护 • 时光倒流 • 自然祝福",animationDuration:3e3}:a.includes("固拉多")||i===e.GROUDON?{bgGradient:"linear-gradient(180deg, #0a0000 0%, #2a0a00 20%, #4a1a00 40%, #8a3a00 60%, #ca5a00 80%, #ff8a20 100%)",animation:`
        <div class="volcano-scene">
          <!-- 火山主体 -->
          <div class="volcano-mountain"></div>
          <div class="volcano-crater"></div>
          
          <!-- 岩浆喷发 -->
          <div class="lava-eruption eruption-1"></div>
          <div class="lava-eruption eruption-2"></div>
          <div class="lava-fountain fountain-1"></div>
          <div class="lava-fountain fountain-2"></div>
          
          <!-- 熔岩流动 -->
          <div class="molten-lava-stream stream-1"></div>
          <div class="molten-lava-stream stream-2"></div>
          <div class="molten-lava-stream stream-3"></div>
          
          <!-- 火山岩飞溅 -->
          <div class="flying-rock rock-1"></div>
          <div class="flying-rock rock-2"></div>
          <div class="flying-rock rock-3"></div>
          <div class="flying-rock rock-4"></div>
          <div class="flying-rock rock-5"></div>
          
          <!-- 火花和余烬 -->
          <div class="lava-spark spark-1"></div>
          <div class="lava-spark spark-2"></div>
          <div class="lava-spark spark-3"></div>
          <div class="lava-spark spark-4"></div>
          <div class="lava-spark spark-5"></div>
          <div class="lava-spark spark-6"></div>
          <div class="lava-spark spark-7"></div>
          <div class="lava-spark spark-8"></div>
          
          <!-- 浓烟滚滚 -->
          <div class="thick-volcano-smoke smoke-1"></div>
          <div class="thick-volcano-smoke smoke-2"></div>
          <div class="thick-volcano-smoke smoke-3"></div>
          <div class="thick-volcano-smoke smoke-4"></div>
          
          <!-- 地面裂缝 -->
          <div class="ground-fissure fissure-1"></div>
          <div class="ground-fissure fissure-2"></div>
          <div class="ground-fissure fissure-3"></div>
          
          <!-- 岩浆光芒 -->
          <div class="magma-glow"></div>
          <div class="heat-distortion"></div>
          
          <!-- 火焰冲击波 -->
          <div class="fire-shockwave"></div>
        </div>
      `,borderColor:"#ca5a00",glowColor:"#ff8a20",title:"原始固拉多",subtitle:"大陆创造 • 火山之怒",animationDuration:3e3}:a.includes("盖欧卡")||i===e.KYOGRE?{bgGradient:"linear-gradient(180deg, #000020 0%, #001040 10%, #002060 25%, #003080 45%, #0050b0 70%, #0070e0 90%, #00a0ff 100%)",animation:`
        <div class="kyogre-scene">
          <!-- 深海海床 -->
          <div class="ocean-floor"></div>
          <div class="deep-sea-trench"></div>
          
          <!-- 巨型海浪 -->
          <div class="mega-tsunami-wave wave-1"></div>
          <div class="mega-tsunami-wave wave-2"></div>
          <div class="mega-tsunami-wave wave-3"></div>
          <div class="tsunami-crest crest-1"></div>
          <div class="tsunami-crest crest-2"></div>
          
          <!-- 狂暴漩涡 -->
          <div class="giant-whirlpool vortex-1"></div>
          <div class="giant-whirlpool vortex-2"></div>
          <div class="giant-whirlpool vortex-3"></div>
          <div class="water-tornado tornado-1"></div>
          <div class="water-tornado tornado-2"></div>
          
          <!-- 海洋洋流 -->
          <div class="powerful-current current-1"></div>
          <div class="powerful-current current-2"></div>
          <div class="powerful-current current-3"></div>
          <div class="powerful-current current-4"></div>
          
          <!-- 水球和水柱 -->
          <div class="massive-water-sphere sphere-1"></div>
          <div class="massive-water-sphere sphere-2"></div>
          <div class="massive-water-sphere sphere-3"></div>
          <div class="hydro-pillar pillar-1"></div>
          <div class="hydro-pillar pillar-2"></div>
          
          <!-- 暴风雨闪电 -->
          <div class="storm-cloud cloud-1"></div>
          <div class="storm-cloud cloud-2"></div>
          <div class="storm-cloud cloud-3"></div>
          <div class="ocean-lightning bolt-1"></div>
          <div class="ocean-lightning bolt-2"></div>
          <div class="ocean-lightning bolt-3"></div>
          <div class="ocean-lightning bolt-4"></div>
          <div class="ocean-lightning bolt-5"></div>
          
          <!-- 始源之力 -->
          <div class="origin-pulse-ring ring-1"></div>
          <div class="origin-pulse-ring ring-2"></div>
          <div class="origin-pulse-ring ring-3"></div>
          <div class="primordial-energy"></div>
          
          <!-- 水花飞溅 -->
          <div class="water-splash splash-1"></div>
          <div class="water-splash splash-2"></div>
          <div class="water-splash splash-3"></div>
          <div class="water-splash splash-4"></div>
          <div class="water-splash splash-5"></div>
          <div class="water-splash splash-6"></div>
          
          <!-- 海底气泡 -->
          <div class="deep-sea-bubble bubble-1"></div>
          <div class="deep-sea-bubble bubble-2"></div>
          <div class="deep-sea-bubble bubble-3"></div>
          <div class="deep-sea-bubble bubble-4"></div>
          <div class="deep-sea-bubble bubble-5"></div>
          
          <!-- 特殊技能效果 -->
          <div class="tidal-wall"></div>
          <div class="hydro-pump-blast"></div>
          <div class="ocean-sovereignty"></div>
          <div class="primal-reversion-glow"></div>
        </div>
      `,borderColor:"#0050b0",glowColor:"#00d0ff",title:"原始盖欧卡",subtitle:"海洋创造 • 始源之海 • 天降暴雨",animationDuration:3e3}:a.includes("烈空坐")||a.includes("裂空座")||i===e.RAYQUAZA?{bgGradient:"linear-gradient(180deg, #000010 0%, #0a1a30 10%, #152845 25%, #1f3c5a 45%, #2a5a75 65%, #3d7c95 85%, #5faab8 100%)",animation:`
        <div class="rayquaza-scene">
          <!-- 天空之柱 -->
          <div class="sky-pillar-base"></div>
          <div class="sky-pillar-tower tower-1"></div>
          <div class="sky-pillar-tower tower-2"></div>
          <div class="sky-pillar-tower tower-3"></div>
          <div class="pillar-cloud cloud-1"></div>
          <div class="pillar-cloud cloud-2"></div>
          
          <!-- 巨大龙卷风 -->
          <div class="mega-dragon-tornado tornado-1"></div>
          <div class="mega-dragon-tornado tornado-2"></div>
          <div class="mega-dragon-tornado tornado-3"></div>
          <div class="tornado-debris debris-1"></div>
          <div class="tornado-debris debris-2"></div>
          <div class="tornado-debris debris-3"></div>
          <div class="tornado-debris debris-4"></div>
          
          <!-- 超大流星 -->
          <div class="giant-meteor meteor-1"></div>
          <div class="giant-meteor meteor-2"></div>
          <div class="giant-meteor meteor-3"></div>
          <div class="giant-meteor meteor-4"></div>
          <div class="meteor-explosion explosion-1"></div>
          <div class="meteor-explosion explosion-2"></div>
          
          <!-- 流星尾迹 -->
          <div class="blazing-trail trail-1"></div>
          <div class="blazing-trail trail-2"></div>
          <div class="blazing-trail trail-3"></div>
          <div class="blazing-trail trail-4"></div>
          <div class="blazing-trail trail-5"></div>
          <div class="blazing-trail trail-6"></div>
          
          <!-- 臭氧层 -->
          <div class="ozone-shield shield-1"></div>
          <div class="ozone-shield shield-2"></div>
          <div class="ozone-shield shield-3"></div>
          <div class="ozone-particle particle-1"></div>
          <div class="ozone-particle particle-2"></div>
          <div class="ozone-particle particle-3"></div>
          <div class="ozone-particle particle-4"></div>
          <div class="ozone-particle particle-5"></div>
          
          <!-- 龙之能量 -->
          <div class="dragon-energy-sphere sphere-1"></div>
          <div class="dragon-energy-sphere sphere-2"></div>
          <div class="dragon-energy-sphere sphere-3"></div>
          <div class="dragon-scale scale-1"></div>
          <div class="dragon-scale scale-2"></div>
          <div class="dragon-scale scale-3"></div>
          
          <!-- 画龙点睛 -->
          <div class="dragon-ascent-beam"></div>
          <div class="dragon-pulse-wave wave-1"></div>
          <div class="dragon-pulse-wave wave-2"></div>
          <div class="dragon-pulse-wave wave-3"></div>
          
          <!-- MEGA进化光芒 -->
          <div class="mega-evolution-aura"></div>
          <div class="mega-stone-glow"></div>
          
          <!-- 气流效果 -->
          <div class="delta-stream-wind"></div>
          <div class="air-lock-field"></div>
          <div class="extreme-speed-trail"></div>
          
          <!-- 天空霸主光环 -->
          <div class="sky-lord-corona"></div>
        </div>
      `,borderColor:"#2a5a75",glowColor:"#70e0ff",title:"天空之龙",subtitle:"超古代调停者 • 画龙点睛 • 流星毁灭",animationDuration:3e3}:a.includes("基拉祈")||i===e.JIRACHI?{bgGradient:"linear-gradient(180deg, #000008 0%, #0a0a20 10%, #1a1a40 25%, #2d2d60 45%, #4a4a85 70%, #6868a8 90%, #8888cc 100%)",animation:`
        <div class="jirachi-scene">
          <!-- 星空背景 -->
          <div class="starfield-layer layer-1"></div>
          <div class="starfield-layer layer-2"></div>
          <div class="starfield-layer layer-3"></div>
          
          <!-- 巨大千年彗星 -->
          <div class="giant-millennium-comet comet-1"></div>
          <div class="giant-millennium-comet comet-2"></div>
          <div class="comet-nucleus nucleus-1"></div>
          <div class="comet-nucleus nucleus-2"></div>
          
          <!-- 彗星尾迹 -->
          <div class="massive-comet-tail tail-1"></div>
          <div class="massive-comet-tail tail-2"></div>
          <div class="massive-comet-tail tail-3"></div>
          <div class="tail-sparkle sparkle-1"></div>
          <div class="tail-sparkle sparkle-2"></div>
          <div class="tail-sparkle sparkle-3"></div>
          <div class="tail-sparkle sparkle-4"></div>
          
          <!-- 许愿星 -->
          <div class="shooting-star star-1"></div>
          <div class="shooting-star star-2"></div>
          <div class="shooting-star star-3"></div>
          <div class="shooting-star star-4"></div>
          <div class="shooting-star star-5"></div>
          <div class="shooting-star star-6"></div>
          <div class="shooting-star star-7"></div>
          <div class="shooting-star star-8"></div>
          <div class="shooting-star star-9"></div>
          <div class="shooting-star star-10"></div>
          
          <!-- 星尘 -->
          <div class="cosmic-stardust dust-1"></div>
          <div class="cosmic-stardust dust-2"></div>
          <div class="cosmic-stardust dust-3"></div>
          <div class="cosmic-stardust dust-4"></div>
          <div class="cosmic-stardust dust-5"></div>
          <div class="cosmic-stardust dust-6"></div>
          
          <!-- 许愿标签（眼睛上的标签） -->
          <div class="wish-tag tag-1"></div>
          <div class="wish-tag tag-2"></div>
          <div class="wish-tag tag-3"></div>
          <div class="wish-tag tag-4"></div>
          <div class="wish-tag tag-5"></div>
          <div class="wish-tag tag-6"></div>
          <div class="wish-tag tag-7"></div>
          
          <!-- 宇宙能量 -->
          <div class="cosmic-energy-ring ring-1"></div>
          <div class="cosmic-energy-ring ring-2"></div>
          <div class="cosmic-energy-ring ring-3"></div>
          <div class="cosmic-power-aura"></div>
          
          <!-- 星座连线 -->
          <div class="constellation-line line-1"></div>
          <div class="constellation-line line-2"></div>
          <div class="constellation-line line-3"></div>
          <div class="constellation-star con-star-1"></div>
          <div class="constellation-star con-star-2"></div>
          <div class="constellation-star con-star-3"></div>
          <div class="constellation-star con-star-4"></div>
          
          <!-- 千年愿望能量 -->
          <div class="millennium-wish-power"></div>
          <div class="wish-granting-light"></div>
          
          <!-- 破灭之愿 -->
          <div class="doom-desire-sphere"></div>
          <div class="doom-desire-explosion"></div>
          
          <!-- 星空漩涡 -->
          <div class="galactic-spiral"></div>
          <div class="nebula-cloud cloud-1"></div>
          <div class="nebula-cloud cloud-2"></div>
        </div>
      `,borderColor:"#6868a8",glowColor:"#c8c8ff",title:"千年愿星",subtitle:"星愿实现 • 七日沉眠 • 破灭之愿",animationDuration:3500}:a.includes("代欧奇希斯")||a.includes("迪奥西斯")||i===e.DEOXYS?{bgGradient:"linear-gradient(180deg, #050010 0%, #0d0225 10%, #18024a 25%, #280870 45%, #4a1098 65%, #6a28c0 85%, #9050e8 100%)",animation:`
        <div class="deoxys-scene">
          <!-- 太空背景 -->
          <div class="deep-space-void"></div>
          <div class="distant-stars layer-1"></div>
          <div class="distant-stars layer-2"></div>
          
          <!-- 巨大陨石 -->
          <div class="giant-meteor-carrier"></div>
          <div class="meteor-cracks crack-1"></div>
          <div class="meteor-cracks crack-2"></div>
          <div class="meteor-cracks crack-3"></div>
          <div class="virus-glow-core"></div>
          
          <!-- DNA螺旋 -->
          <div class="massive-dna-helix helix-1"></div>
          <div class="massive-dna-helix helix-2"></div>
          <div class="massive-dna-helix helix-3"></div>
          <div class="dna-base-pair pair-1"></div>
          <div class="dna-base-pair pair-2"></div>
          <div class="dna-base-pair pair-3"></div>
          <div class="dna-base-pair pair-4"></div>
          <div class="dna-base-pair pair-5"></div>
          <div class="dna-base-pair pair-6"></div>
          
          <!-- 宇宙射线 -->
          <div class="cosmic-gamma-ray ray-1"></div>
          <div class="cosmic-gamma-ray ray-2"></div>
          <div class="cosmic-gamma-ray ray-3"></div>
          <div class="cosmic-gamma-ray ray-4"></div>
          <div class="cosmic-gamma-ray ray-5"></div>
          <div class="radiation-wave wave-1"></div>
          <div class="radiation-wave wave-2"></div>
          <div class="radiation-wave wave-3"></div>
          
          <!-- 形态变换水晶 -->
          <div class="form-change-crystal crystal-attack"></div>
          <div class="form-change-crystal crystal-defense"></div>
          <div class="form-change-crystal crystal-speed"></div>
          <div class="form-change-crystal crystal-normal"></div>
          <div class="crystal-shard shard-1"></div>
          <div class="crystal-shard shard-2"></div>
          <div class="crystal-shard shard-3"></div>
          <div class="crystal-shard shard-4"></div>
          
          <!-- 病毒粒子 -->
          <div class="virus-particle particle-1"></div>
          <div class="virus-particle particle-2"></div>
          <div class="virus-particle particle-3"></div>
          <div class="virus-particle particle-4"></div>
          <div class="virus-particle particle-5"></div>
          <div class="virus-particle particle-6"></div>
          <div class="virus-particle particle-7"></div>
          <div class="virus-particle particle-8"></div>
          
          <!-- 极光能量 -->
          <div class="aurora-borealis aurora-1"></div>
          <div class="aurora-borealis aurora-2"></div>
          <div class="aurora-borealis aurora-3"></div>
          
          <!-- 念力爆发 -->
          <div class="psycho-boost-core"></div>
          <div class="psycho-boost-ring ring-1"></div>
          <div class="psycho-boost-ring ring-2"></div>
          <div class="psycho-boost-ring ring-3"></div>
          <div class="psycho-boost-beam"></div>
          
          <!-- 重生再生 -->
          <div class="regeneration-field"></div>
          <div class="mutation-aura"></div>
          
          <!-- 宇宙病毒核心 -->
          <div class="alien-virus-core"></div>
          <div class="extraterrestrial-energy"></div>
        </div>
      `,borderColor:"#4a1098",glowColor:"#b070ff",title:"宇宙病毒",subtitle:"DNA变异 • 四形态变换 • 念力爆发",animationDuration:3e3}:a.includes("帝牙卢卡")||i===e.DIALGA?{bgGradient:"linear-gradient(180deg, #0d1b2e 0%, #1e3a5a 30%, #3d5a7a 70%, #5d7a9a 100%)",animation:`
        <div class="dialga-scene">
          <div class="time-gear gear-1"></div>
          <div class="time-gear gear-2"></div>
          <div class="time-gear gear-3"></div>
          <div class="temporal-wave wave-1"></div>
          <div class="temporal-wave wave-2"></div>
          <div class="temporal-wave wave-3"></div>
          <div class="clock-hand hand-1"></div>
          <div class="clock-hand hand-2"></div>
          <div class="time-distortion distortion-1"></div>
          <div class="time-distortion distortion-2"></div>
          <div class="roar-of-time"></div>
          <div class="adamant-orb"></div>
        </div>
      `,borderColor:"#3d5a7a",glowColor:"#5d7a9a",title:"时间之神",subtitle:"时光掌控 • 时之咆哮",animationDuration:2500}:a.includes("帕路奇亚")||i===e.PALKIA?{bgGradient:"linear-gradient(180deg, #1a0d2e 0%, #3a2d5e 30%, #5a4d7e 70%, #7a6d9e 100%)",animation:`
        <div class="palkia-scene">
          <div class="space-rift rift-1"></div>
          <div class="space-rift rift-2"></div>
          <div class="space-rift rift-3"></div>
          <div class="spatial-wave wave-1"></div>
          <div class="spatial-wave wave-2"></div>
          <div class="spatial-wave wave-3"></div>
          <div class="dimension-portal portal-1"></div>
          <div class="dimension-portal portal-2"></div>
          <div class="space-distortion distortion-1"></div>
          <div class="space-distortion distortion-2"></div>
          <div class="spacial-rend"></div>
          <div class="lustrous-orb"></div>
        </div>
      `,borderColor:"#5a4d7e",glowColor:"#7a6d9e",title:"空间之神",subtitle:"次元掌控 • 亚空裂斩",animationDuration:2500}:a.includes("骑拉帝纳")||i===e.GIRATINA?{bgGradient:"linear-gradient(180deg, #0a0a0a 0%, #1a1a2a 30%, #2a2a4a 70%, #3a3a6a 100%)",animation:`
        <div class="giratina-scene">
          <div class="shadow-tendril tendril-1"></div>
          <div class="shadow-tendril tendril-2"></div>
          <div class="shadow-tendril tendril-3"></div>
          <div class="antimatter-sphere sphere-1"></div>
          <div class="antimatter-sphere sphere-2"></div>
          <div class="distortion-world world-1"></div>
          <div class="distortion-world world-2"></div>
          <div class="ghostly-aura aura-1"></div>
          <div class="ghostly-aura aura-2"></div>
          <div class="reversed-gravity"></div>
          <div class="shadow-force"></div>
          <div class="griseous-orb"></div>
        </div>
      `,borderColor:"#3a3a6a",glowColor:"#5a5a8a",title:"反转之神",subtitle:"破坏秩序 • 暗影强袭",animationDuration:2500}:a.includes("阿尔宙斯")||i===e.ARCEUS?{bgGradient:"linear-gradient(180deg, #d4af37 0%, #f4cf5f 30%, #fff68f 60%, #ffffff 100%)",animation:`
        <div class="arceus-scene">
          <div class="divine-ring ring-1"></div>
          <div class="divine-ring ring-2"></div>
          <div class="divine-ring ring-3"></div>
          <div class="creation-light light-1"></div>
          <div class="creation-light light-2"></div>
          <div class="creation-light light-3"></div>
          <div class="judgement-ray ray-1"></div>
          <div class="judgement-ray ray-2"></div>
          <div class="type-plate plate-1"></div>
          <div class="type-plate plate-2"></div>
          <div class="genesis-wave"></div>
          <div class="omnipotent-aura"></div>
        </div>
      `,borderColor:"#d4af37",glowColor:"#f4cf5f",title:"创世之神",subtitle:"万物起源 • 制裁光砾",animationDuration:3e3}:a.includes("玛纳霏")||i===e.MANAPHY?{bgGradient:"linear-gradient(180deg, #001845 0%, #003d7f 30%, #0066cc 70%, #3399ff 100%)",animation:`
        <div class="manaphy-scene">
          <div class="ocean-ripple ripple-1"></div>
          <div class="ocean-ripple ripple-2"></div>
          <div class="ocean-ripple ripple-3"></div>
          <div class="water-crown crown-1"></div>
          <div class="water-crown crown-2"></div>
          <div class="jellyfish-glow glow-1"></div>
          <div class="jellyfish-glow glow-2"></div>
          <div class="deep-sea-bubble bubble-1"></div>
          <div class="deep-sea-bubble bubble-2"></div>
          <div class="heart-swap"></div>
          <div class="prince-aura"></div>
        </div>
      `,borderColor:"#0066cc",glowColor:"#3399ff",title:"沧海王子",subtitle:"深海守护 • 心灵交换",animationDuration:2500}:a.includes("达克莱伊")||a.includes("达库莱伊")||i===e.DARKRAI?{bgGradient:"linear-gradient(180deg, #000000 0%, #0d0d1a 30%, #1a1a2d 70%, #2d2d4a 100%)",animation:`
        <div class="darkrai-scene">
          <div class="nightmare-shadow shadow-1"></div>
          <div class="nightmare-shadow shadow-2"></div>
          <div class="nightmare-shadow shadow-3"></div>
          <div class="dark-void void-1"></div>
          <div class="dark-void void-2"></div>
          <div class="nightmare-mist mist-1"></div>
          <div class="nightmare-mist mist-2"></div>
          <div class="nightmare-mist mist-3"></div>
          <div class="shadow-claw claw-1"></div>
          <div class="shadow-claw claw-2"></div>
          <div class="eternal-darkness"></div>
        </div>
      `,borderColor:"#1a1a2d",glowColor:"#2d2d4a",title:"噩梦之神",subtitle:"黑暗降临 • 暗黑洞",animationDuration:2500}:a.includes("谢米")||i===e.SHAYMIN?{bgGradient:"linear-gradient(180deg, #c7f0bd 0%, #a8dba8 30%, #79bd9a 70%, #5a9978 100%)",animation:`
        <div class="shaymin-scene">
          <div class="flower-field field-1"></div>
          <div class="flower-field field-2"></div>
          <div class="flower-bloom bloom-1"></div>
          <div class="flower-bloom bloom-2"></div>
          <div class="flower-bloom bloom-3"></div>
          <div class="gracidea-flower flower-1"></div>
          <div class="gracidea-flower flower-2"></div>
          <div class="gratitude-sparkle sparkle-1"></div>
          <div class="gratitude-sparkle sparkle-2"></div>
          <div class="seed-flare"></div>
          <div class="sky-forme-wind"></div>
        </div>
      `,borderColor:"#79bd9a",glowColor:"#a8dba8",title:"感恩之花",subtitle:"花海绽放 • 种子闪光",animationDuration:2500}:a.includes("雷希拉姆")||a.includes("莱希拉姆")||i===e.RESHIRAM?{bgGradient:"linear-gradient(180deg, #2d1810 0%, #5d3830 30%, #9d6850 70%, #cd9870 100%)",animation:`
        <div class="reshiram-scene">
          <div class="white-flame flame-1"></div>
          <div class="white-flame flame-2"></div>
          <div class="white-flame flame-3"></div>
          <div class="truth-aura aura-1"></div>
          <div class="truth-aura aura-2"></div>
          <div class="noble-fire fire-1"></div>
          <div class="noble-fire fire-2"></div>
          <div class="sacred-wing wing-1"></div>
          <div class="sacred-wing wing-2"></div>
          <div class="blue-flare"></div>
          <div class="fusion-flare"></div>
          <div class="turboblaze"></div>
        </div>
      `,borderColor:"#9d6850",glowColor:"#cd9870",title:"真实之龙",subtitle:"白炎灼烧 • 真理永恒",animationDuration:2500}:a.includes("捷克罗姆")||a.includes("泽克罗姆")||i===e.ZEKROM?{bgGradient:"linear-gradient(180deg, #0a0a1a 0%, #1a1a3a 30%, #2a2a5a 70%, #4a4a7a 100%)",animation:`
        <div class="zekrom-scene">
          <div class="black-lightning bolt-1"></div>
          <div class="black-lightning bolt-2"></div>
          <div class="black-lightning bolt-3"></div>
          <div class="ideal-aura aura-1"></div>
          <div class="ideal-aura aura-2"></div>
          <div class="electric-wing wing-1"></div>
          <div class="electric-wing wing-2"></div>
          <div class="thunder-storm storm-1"></div>
          <div class="thunder-storm storm-2"></div>
          <div class="bolt-strike"></div>
          <div class="fusion-bolt"></div>
          <div class="teravolt"></div>
        </div>
      `,borderColor:"#2a2a5a",glowColor:"#4a4a7a",title:"理想之龙",subtitle:"黑雷降临 • 理想不灭",animationDuration:2500}:a.includes("酋雷姆")||a.includes("捷克罗姆")||i===e.KYUREM?{bgGradient:"linear-gradient(180deg, #b3e5fc 0%, #81d4fa 30%, #4fc3f7 70%, #29b6f6 100%)",animation:`
        <div class="kyurem-scene">
          <div class="ice-crystal crystal-1"></div>
          <div class="ice-crystal crystal-2"></div>
          <div class="ice-crystal crystal-3"></div>
          <div class="ice-crystal crystal-4"></div>
          <div class="frozen-wind wind-1"></div>
          <div class="frozen-wind wind-2"></div>
          <div class="blizzard-storm storm-1"></div>
          <div class="blizzard-storm storm-2"></div>
          <div class="ice-shard shard-1"></div>
          <div class="ice-shard shard-2"></div>
          <div class="glaciate"></div>
          <div class="dna-splicers"></div>
        </div>
      `,borderColor:"#4fc3f7",glowColor:"#81d4fa",title:"冰封之龙",subtitle:"极寒冰冻 • DNA融合",animationDuration:2500}:a.includes("比克提尼")||a.includes("维库提尼")||i===e.VICTINI?{bgGradient:"linear-gradient(180deg, #ff6b35 0%, #ff8c42 30%, #ffa94d 70%, #ffc168 100%)",animation:`
        <div class="victini-scene">
          <div class="v-flame flame-1"></div>
          <div class="v-flame flame-2"></div>
          <div class="v-flame flame-3"></div>
          <div class="victory-star star-1"></div>
          <div class="victory-star star-2"></div>
          <div class="victory-star star-3"></div>
          <div class="victory-aura aura-1"></div>
          <div class="victory-aura aura-2"></div>
          <div class="infinite-energy energy-1"></div>
          <div class="infinite-energy energy-2"></div>
          <div class="v-create"></div>
        </div>
      `,borderColor:"#ff8c42",glowColor:"#ffa94d",title:"胜利之星",subtitle:"V字火焰 • 无限能量",animationDuration:2500}:a.includes("美洛耶塔")||a.includes("梅洛耶塔")||i===e.MELOETTA?{bgGradient:"linear-gradient(180deg, #fce4ec 0%, #f8bbd0 30%, #f48fb1 70%, #ec407a 100%)",animation:`
        <div class="meloetta-scene">
          <div class="music-note note-1"></div>
          <div class="music-note note-2"></div>
          <div class="music-note note-3"></div>
          <div class="music-note note-4"></div>
          <div class="melody-wave wave-1"></div>
          <div class="melody-wave wave-2"></div>
          <div class="dance-ribbon ribbon-1"></div>
          <div class="dance-ribbon ribbon-2"></div>
          <div class="aria-aura"></div>
          <div class="pirouette-spin"></div>
          <div class="relic-song"></div>
        </div>
      `,borderColor:"#f48fb1",glowColor:"#f8bbd0",title:"旋律宝可梦",subtitle:"古老之歌 • 形态变换",animationDuration:2500}:a.includes("盖诺赛克特")||a.includes("基诺赛克特")||i===e.GENESECT?{bgGradient:"linear-gradient(180deg, #1a0d2e 0%, #3a2d5e 30%, #6a4d8e 70%, #9a6dbe 100%)",animation:`
        <div class="genesect-scene">
          <div class="plasma-cannon cannon-1"></div>
          <div class="plasma-cannon cannon-2"></div>
          <div class="techno-blast blast-1"></div>
          <div class="techno-blast blast-2"></div>
          <div class="drive-cassette cassette-1"></div>
          <div class="drive-cassette cassette-2"></div>
          <div class="mechanical-wing wing-1"></div>
          <div class="mechanical-wing wing-2"></div>
          <div class="cyborg-aura"></div>
          <div class="ancient-tech"></div>
        </div>
      `,borderColor:"#6a4d8e",glowColor:"#9a6dbe",title:"究极改造",subtitle:"等离子炮 • 古代科技",animationDuration:2500}:a.includes("土地云")||i===e.LANDORUS?{bgGradient:"linear-gradient(180deg, #8b4513 0%, #a0522d 30%, #cd853f 70%, #daa520 100%)",animation:`
        <div class="landorus-scene">
          <div class="earth-power power-1"></div>
          <div class="earth-power power-2"></div>
          <div class="sandstorm storm-1"></div>
          <div class="sandstorm storm-2"></div>
          <div class="fertile-soil soil-1"></div>
          <div class="fertile-soil soil-2"></div>
          <div class="crop-blessing blessing-1"></div>
          <div class="crop-blessing blessing-2"></div>
          <div class="ground-force"></div>
          <div class="abundance-aura"></div>
        </div>
      `,borderColor:"#cd853f",glowColor:"#daa520",title:"丰穰之神",subtitle:"大地之力 • 五谷丰登",animationDuration:2e3}:a.includes("哲尔尼亚斯")||i===e.XERNEAS?{bgGradient:"linear-gradient(180deg, #0a1a0a 0%, #1a3a2a 20%, #2a5a4a 40%, #4a7a6a 60%, #6a9a8a 80%, #8abaaa 100%)",animation:`
        <div class="xerneas-scene">
          <!-- 巨大生命树主干 -->
          <div class="life-tree-trunk"></div>
          <div class="life-tree-branch branch-1"></div>
          <div class="life-tree-branch branch-2"></div>
          <div class="life-tree-branch branch-3"></div>
          <div class="life-tree-branch branch-4"></div>
          
          <!-- 发光的树叶 -->
          <div class="glowing-leaf leaf-1"></div>
          <div class="glowing-leaf leaf-2"></div>
          <div class="glowing-leaf leaf-3"></div>
          <div class="glowing-leaf leaf-4"></div>
          <div class="glowing-leaf leaf-5"></div>
          <div class="glowing-leaf leaf-6"></div>
          <div class="glowing-leaf leaf-7"></div>
          <div class="glowing-leaf leaf-8"></div>
          
          <!-- 生命果实 -->
          <div class="life-fruit fruit-1"></div>
          <div class="life-fruit fruit-2"></div>
          <div class="life-fruit fruit-3"></div>
          
          <!-- 彩虹鹿角光芒 -->
          <div class="rainbow-antler-glow glow-1"></div>
          <div class="rainbow-antler-glow glow-2"></div>
          
          <!-- 生命粒子上升 -->
          <div class="life-particle particle-1"></div>
          <div class="life-particle particle-2"></div>
          <div class="life-particle particle-3"></div>
          <div class="life-particle particle-4"></div>
          <div class="life-particle particle-5"></div>
          <div class="life-particle particle-6"></div>
          
          <!-- 地面生长的藤蔓 -->
          <div class="growing-vine vine-1"></div>
          <div class="growing-vine vine-2"></div>
          <div class="growing-vine vine-3"></div>
          
          <!-- 花朵绽放 -->
          <div class="blooming-flower flower-1"></div>
          <div class="blooming-flower flower-2"></div>
          <div class="blooming-flower flower-3"></div>
          <div class="blooming-flower flower-4"></div>
          
          <!-- 妖精之光 -->
          <div class="fairy-sparkle sparkle-1"></div>
          <div class="fairy-sparkle sparkle-2"></div>
          <div class="fairy-sparkle sparkle-3"></div>
          <div class="fairy-sparkle sparkle-4"></div>
          
          <!-- 生命能量波动 -->
          <div class="life-energy-wave"></div>
          <div class="geomancy-aura"></div>
        </div>
      `,borderColor:"#4a7a6a",glowColor:"#6aaa8a",title:"生命之神",subtitle:"永恒生命 • 生命之树",animationDuration:3e3}:a.includes("伊裴尔塔尔")||i===e.YVELTAL?{bgGradient:"linear-gradient(180deg, #1a0000 0%, #3a0a0a 30%, #6a1a1a 70%, #9a2a2a 100%)",animation:`
        <div class="yveltal-scene">
          <div class="death-wing wing-1"></div>
          <div class="death-wing wing-2"></div>
          <div class="death-wing wing-3"></div>
          <div class="dark-aura aura-1"></div>
          <div class="dark-aura aura-2"></div>
          <div class="life-drain drain-1"></div>
          <div class="life-drain drain-2"></div>
          <div class="destruction-wave wave-1"></div>
          <div class="destruction-wave wave-2"></div>
          <div class="oblivion-wing"></div>
          <div class="death-embrace"></div>
        </div>
      `,borderColor:"#6a1a1a",glowColor:"#9a2a2a",title:"破坏之神",subtitle:"死亡之翼 • 湮灭一切",animationDuration:2500}:a.includes("基格尔德")||a.includes("吉格尔德")||i===e.ZYGARDE?{bgGradient:"linear-gradient(180deg, #1a2d1a 0%, #2d4d2d 30%, #4d7d4d 70%, #6dad6d 100%)",animation:`
        <div class="zygarde-scene">
          <div class="cell-swarm swarm-1"></div>
          <div class="cell-swarm swarm-2"></div>
          <div class="cell-swarm swarm-3"></div>
          <div class="core-crystal core-1"></div>
          <div class="core-crystal core-2"></div>
          <div class="earth-guardian guardian-1"></div>
          <div class="earth-guardian guardian-2"></div>
          <div class="thousand-arrows arrow-1"></div>
          <div class="thousand-arrows arrow-2"></div>
          <div class="complete-form"></div>
          <div class="ecosystem-balance"></div>
        </div>
      `,borderColor:"#4d7d4d",glowColor:"#6dad6d",title:"秩序监管",subtitle:"细胞汇聚 • 生态平衡",animationDuration:2500}:a.includes("索尔迦雷欧")||i===e.SOLGALEO?{bgGradient:"linear-gradient(180deg, #ff8c00 0%, #ffa500 30%, #ffd700 70%, #fffacd 100%)",animation:`
        <div class="solgaleo-scene">
          <div class="sun-ray ray-1"></div>
          <div class="sun-ray ray-2"></div>
          <div class="sun-ray ray-3"></div>
          <div class="sun-ray ray-4"></div>
          <div class="solar-flare flare-1"></div>
          <div class="solar-flare flare-2"></div>
          <div class="cosmic-lion lion-1"></div>
          <div class="cosmic-lion lion-2"></div>
          <div class="radiant-sun sun-1"></div>
          <div class="sunsteel-strike"></div>
          <div class="full-metal-body"></div>
        </div>
      `,borderColor:"#ffa500",glowColor:"#ffd700",title:"日食之兽",subtitle:"吞噬太阳 • 流星闪耀",animationDuration:2500}:a.includes("露奈雅拉")||i===e.LUNALA?{bgGradient:"linear-gradient(180deg, #191970 0%, #4b0082 30%, #8a2be2 70%, #9370db 100%)",animation:`
        <div class="lunala-scene">
          <div class="moon-wing wing-1"></div>
          <div class="moon-wing wing-2"></div>
          <div class="moon-wing wing-3"></div>
          <div class="crescent-moon moon-1"></div>
          <div class="crescent-moon moon-2"></div>
          <div class="lunar-beam beam-1"></div>
          <div class="lunar-beam beam-2"></div>
          <div class="starry-night night-1"></div>
          <div class="starry-night night-2"></div>
          <div class="moongeist-beam"></div>
          <div class="shadow-shield"></div>
        </div>
      `,borderColor:"#8a2be2",glowColor:"#9370db",title:"月蚀之兽",subtitle:"邀引月亮 • 幻影守护",animationDuration:2500}:a.includes("奈克洛兹玛")||i===e.NECROZMA?{bgGradient:"linear-gradient(180deg, #000000 0%, #1a1a2a 30%, #8a7a5a 70%, #ffd700 100%)",animation:`
        <div class="necrozma-scene">
          <div class="prism-laser laser-1"></div>
          <div class="prism-laser laser-2"></div>
          <div class="prism-laser laser-3"></div>
          <div class="light-absorb absorb-1"></div>
          <div class="light-absorb absorb-2"></div>
          <div class="crystal-body body-1"></div>
          <div class="crystal-body body-2"></div>
          <div class="ultra-burst burst-1"></div>
          <div class="ultra-burst burst-2"></div>
          <div class="photon-geyser"></div>
          <div class="light-devourer"></div>
        </div>
      `,borderColor:"#8a7a5a",glowColor:"#ffd700",title:"光辉大神",subtitle:"吞噬光明 • 棱镜激光",animationDuration:2500}:a.includes("玛夏多")||a.includes("玛莎多")||i===e.MARSHADOW?{bgGradient:"linear-gradient(180deg, #0a0a0a 0%, #1a1a2a 30%, #2a2a4a 70%, #3a3a6a 100%)",animation:`
        <div class="marshadow-scene">
          <div class="shadow-punch punch-1"></div>
          <div class="shadow-punch punch-2"></div>
          <div class="shadow-punch punch-3"></div>
          <div class="ghost-flame flame-1"></div>
          <div class="ghost-flame flame-2"></div>
          <div class="spirit-shackle shackle-1"></div>
          <div class="spirit-shackle shackle-2"></div>
          <div class="shadow-mimic mimic-1"></div>
          <div class="shadow-mimic mimic-2"></div>
          <div class="soul-stealing"></div>
          <div class="spectral-thief"></div>
        </div>
      `,borderColor:"#2a2a4a",glowColor:"#4a4a6a",title:"影之引导",subtitle:"暗影拳击 • 窃取灵魂",animationDuration:2500}:a.includes("苍响")||i===e.ZACIAN?{bgGradient:"linear-gradient(180deg, #1e3a8a 0%, #3b5998 30%, #6b88b8 70%, #9bb8d8 100%)",animation:`
        <div class="zacian-scene">
          <div class="sacred-sword sword-1"></div>
          <div class="sacred-sword sword-2"></div>
          <div class="sacred-sword sword-3"></div>
          <div class="behemoth-blade blade-1"></div>
          <div class="behemoth-blade blade-2"></div>
          <div class="royal-aura aura-1"></div>
          <div class="royal-aura aura-2"></div>
          <div class="warrior-spirit spirit-1"></div>
          <div class="warrior-spirit spirit-2"></div>
          <div class="intrepid-sword"></div>
          <div class="crowned-sword"></div>
        </div>
      `,borderColor:"#6b88b8",glowColor:"#9bb8d8",title:"剑之勇者",subtitle:"巨兽利刃 • 百战不殆",animationDuration:2e3}:a.includes("藏玛然特")||a.includes("藏马然特")||i===e.ZAMAZENTA?{bgGradient:"linear-gradient(180deg, #8b0000 0%, #a52a2a 30%, #cd5c5c 70%, #f08080 100%)",animation:`
        <div class="zamazenta-scene">
          <div class="sacred-shield shield-1"></div>
          <div class="sacred-shield shield-2"></div>
          <div class="sacred-shield shield-3"></div>
          <div class="behemoth-bash bash-1"></div>
          <div class="behemoth-bash bash-2"></div>
          <div class="guardian-aura aura-1"></div>
          <div class="guardian-aura aura-2"></div>
          <div class="protector-spirit spirit-1"></div>
          <div class="protector-spirit spirit-2"></div>
          <div class="dauntless-shield"></div>
          <div class="crowned-shield"></div>
        </div>
      `,borderColor:"#cd5c5c",glowColor:"#f08080",title:"盾之勇者",subtitle:"巨兽重壁 • 坚不可摧",animationDuration:2e3}:a.includes("无极汰那")||i===e.ETERNATUS?{bgGradient:"linear-gradient(180deg, #1a0033 0%, #330066 30%, #660099 70%, #9900cc 100%)",animation:`
        <div class="eternatus-scene">
          <div class="poison-core core-1"></div>
          <div class="poison-core core-2"></div>
          <div class="eternabeam beam-1"></div>
          <div class="eternabeam beam-2"></div>
          <div class="dynamax-energy energy-1"></div>
          <div class="dynamax-energy energy-2"></div>
          <div class="cosmic-poison poison-1"></div>
          <div class="cosmic-poison poison-2"></div>
          <div class="infinity-form"></div>
          <div class="eternamax"></div>
        </div>
      `,borderColor:"#660099",glowColor:"#9900cc",title:"无限宝可梦",subtitle:"极巨能量 • 无尽威胁",animationDuration:2500}:a.includes("蕾冠王")||i===e.CALYREX?{bgGradient:"linear-gradient(180deg, #4a2860 0%, #6a4880 30%, #8a68a0 70%, #aa88c0 100%)",animation:`
        <div class="calyrex-scene">
          <div class="psychic-crown crown-1"></div>
          <div class="psychic-crown crown-2"></div>
          <div class="royal-decree decree-1"></div>
          <div class="royal-decree decree-2"></div>
          <div class="mind-control control-1"></div>
          <div class="mind-control control-2"></div>
          <div class="king-aura aura-1"></div>
          <div class="king-aura aura-2"></div>
          <div class="glacial-lance"></div>
          <div class="astral-barrage"></div>
        </div>
      `,borderColor:"#8a68a0",glowColor:"#aa88c0",title:"冠之雪原",subtitle:"王之威严 • 统御万物",animationDuration:2500}:a.includes("故勒顿")||a.includes("古勒顿")||i===e.KORAIDON?{bgGradient:"linear-gradient(180deg, #8b0000 0%, #cd5c5c 30%, #ff6347 70%, #ff8c69 100%)",animation:`
        <div class="koraidon-scene">
          <div class="ancient-flame flame-1"></div>
          <div class="ancient-flame flame-2"></div>
          <div class="ancient-flame flame-3"></div>
          <div class="primal-roar roar-1"></div>
          <div class="primal-roar roar-2"></div>
          <div class="prehistoric-power power-1"></div>
          <div class="prehistoric-power power-2"></div>
          <div class="territorial-mark mark-1"></div>
          <div class="territorial-mark mark-2"></div>
          <div class="collision-course"></div>
          <div class="orichalcum-pulse"></div>
        </div>
      `,borderColor:"#ff6347",glowColor:"#ff8c69",title:"朱红之龙",subtitle:"古代之力 • 大地奔驰",animationDuration:2e3}:a.includes("密勒顿")||a.includes("米莱顿")||i===e.MIRAIDON?{bgGradient:"linear-gradient(180deg, #00008b 0%, #4169e1 30%, #6495ed 70%, #87ceeb 100%)",animation:`
        <div class="miraidon-scene">
          <div class="plasma-ring ring-1"></div>
          <div class="plasma-ring ring-2"></div>
          <div class="plasma-ring ring-3"></div>
          <div class="electric-drive drive-1"></div>
          <div class="electric-drive drive-2"></div>
          <div class="cyber-energy energy-1"></div>
          <div class="cyber-energy energy-2"></div>
          <div class="future-tech tech-1"></div>
          <div class="future-tech tech-2"></div>
          <div class="electro-drift"></div>
          <div class="hadron-engine"></div>
        </div>
      `,borderColor:"#6495ed",glowColor:"#87ceeb",title:"紫蓝之龙",subtitle:"未来科技 • 电能驱动",animationDuration:2e3}:a.includes("闪电鸟")||i===e.ZAPDOS?{bgGradient:"linear-gradient(180deg, #000000 0%, #0a0a1a 20%, #1a1a3a 40%, #2a3a5a 60%, #4a6a8a 80%, #6a9aba 100%)",animation:`
        <div class="zapdos-scene">
          <!-- 巨大雷云 -->
          <div class="massive-storm-cloud cloud-1"></div>
          <div class="massive-storm-cloud cloud-2"></div>
          <div class="massive-storm-cloud cloud-3"></div>
          
          <!-- 闪电网络 -->
          <div class="mega-lightning bolt-1"></div>
          <div class="mega-lightning bolt-2"></div>
          <div class="mega-lightning bolt-3"></div>
          <div class="mega-lightning bolt-4"></div>
          <div class="mega-lightning bolt-5"></div>
          <div class="mega-lightning bolt-6"></div>
          <div class="mega-lightning bolt-7"></div>
          <div class="mega-lightning bolt-8"></div>
          
          <!-- 电弧连锁 -->
          <div class="electric-arc-chain arc-1"></div>
          <div class="electric-arc-chain arc-2"></div>
          <div class="electric-arc-chain arc-3"></div>
          
          <!-- 电浆球 -->
          <div class="plasma-sphere sphere-1"></div>
          <div class="plasma-sphere sphere-2"></div>
          <div class="plasma-sphere sphere-3"></div>
          
          <!-- 雷鸟羽毛 -->
          <div class="thunder-feather t-feather-1"></div>
          <div class="thunder-feather t-feather-2"></div>
          <div class="thunder-feather t-feather-3"></div>
          <div class="thunder-feather t-feather-4"></div>
          <div class="thunder-feather t-feather-5"></div>
          
          <!-- 电光闪烁 -->
          <div class="electric-spark e-spark-1"></div>
          <div class="electric-spark e-spark-2"></div>
          <div class="electric-spark e-spark-3"></div>
          <div class="electric-spark e-spark-4"></div>
          <div class="electric-spark e-spark-5"></div>
          <div class="electric-spark e-spark-6"></div>
          
          <!-- 雷暴冲击波 -->
          <div class="thunder-shockwave"></div>
          <div class="electric-field"></div>
          
          <!-- 全屏闪光 -->
          <div class="screen-flash"></div>
        </div>
      `,borderColor:"#4a6a8a",glowColor:"#f4e44d",title:"传说之雷",subtitle:"雷电交加 • 风暴降临 • 万雷天牢",animationDuration:3e3}:a.includes("急冻鸟")||i===e.ARTICUNO?{bgGradient:"linear-gradient(180deg, #ffffff 0%, #e0f0ff 10%, #c0e0ff 30%, #90c0e0 50%, #60a0d0 70%, #3080c0 90%, #205090 100%)",animation:`
        <div class="articuno-scene">
          <!-- 巨型冰晶 -->
          <div class="mega-ice-crystal crystal-1"></div>
          <div class="mega-ice-crystal crystal-2"></div>
          <div class="mega-ice-crystal crystal-3"></div>
          <div class="mega-ice-crystal crystal-4"></div>
          <div class="mega-ice-crystal crystal-5"></div>
          
          <!-- 暴风雪 -->
          <div class="blizzard-layer layer-1"></div>
          <div class="blizzard-layer layer-2"></div>
          <div class="blizzard-layer layer-3"></div>
          
          <!-- 冰柱从天而降 -->
          <div class="falling-icicle icicle-1"></div>
          <div class="falling-icicle icicle-2"></div>
          <div class="falling-icicle icicle-3"></div>
          <div class="falling-icicle icicle-4"></div>
          <div class="falling-icicle icicle-5"></div>
          <div class="falling-icicle icicle-6"></div>
          
          <!-- 冰霜羽毛 -->
          <div class="frost-feather f-feather-1"></div>
          <div class="frost-feather f-feather-2"></div>
          <div class="frost-feather f-feather-3"></div>
          <div class="frost-feather f-feather-4"></div>
          <div class="frost-feather f-feather-5"></div>
          
          <!-- 雪花粒子 -->
          <div class="snowflake snow-1"></div>
          <div class="snowflake snow-2"></div>
          <div class="snowflake snow-3"></div>
          <div class="snowflake snow-4"></div>
          <div class="snowflake snow-5"></div>
          <div class="snowflake snow-6"></div>
          <div class="snowflake snow-7"></div>
          <div class="snowflake snow-8"></div>
          
          <!-- 极光 -->
          <div class="northern-lights aurora-1"></div>
          <div class="northern-lights aurora-2"></div>
          <div class="northern-lights aurora-3"></div>
          
          <!-- 冰霜波纹 -->
          <div class="frost-wave"></div>
          <div class="ice-field"></div>
          
          <!-- 冰封效果 -->
          <div class="freeze-screen"></div>
        </div>
      `,borderColor:"#60a0d0",glowColor:"#e0f0ff",title:"传说之冰",subtitle:"冰雪风暴 • 极地冰封 • 绝对零度",animationDuration:3e3}:a.includes("火焰鸟")||i===e.MOLTRES?{bgGradient:"linear-gradient(180deg, #1a0000 0%, #3a0a00 10%, #6a2a0a 30%, #aa5a2a 50%, #da8a4a 70%, #ffaa60 90%, #ffcc80 100%)",animation:`
        <div class="moltres-scene">
          <!-- 凤凰火焰翼 -->
          <div class="phoenix-wing p-wing-1"></div>
          <div class="phoenix-wing p-wing-2"></div>
          <div class="phoenix-wing p-wing-3"></div>
          <div class="phoenix-wing p-wing-4"></div>
          
          <!-- 火焰旋涡 -->
          <div class="fire-tornado tornado-1"></div>
          <div class="fire-tornado tornado-2"></div>
          
          <!-- 烈焰羽毛 -->
          <div class="blaze-feather b-feather-1"></div>
          <div class="blaze-feather b-feather-2"></div>
          <div class="blaze-feather b-feather-3"></div>
          <div class="blaze-feather b-feather-4"></div>
          <div class="blaze-feather b-feather-5"></div>
          <div class="blaze-feather b-feather-6"></div>
          
          <!-- 火焰粒子 -->
          <div class="fire-ember ember-1"></div>
          <div class="fire-ember ember-2"></div>
          <div class="fire-ember ember-3"></div>
          <div class="fire-ember ember-4"></div>
          <div class="fire-ember ember-5"></div>
          <div class="fire-ember ember-6"></div>
          <div class="fire-ember ember-7"></div>
          <div class="fire-ember ember-8"></div>
          
          <!-- 火焰波纹 -->
          <div class="flame-ring ring-1"></div>
          <div class="flame-ring ring-2"></div>
          <div class="flame-ring ring-3"></div>
          
          <!-- 火焰喷射 -->
          <div class="fire-blast blast-1"></div>
          <div class="fire-blast blast-2"></div>
          <div class="fire-blast blast-3"></div>
          
          <!-- 烈焰光环 -->
          <div class="inferno-aura"></div>
          <div class="heat-haze"></div>
          
          <!-- 全屏火光 -->
          <div class="fire-flash"></div>
        </div>
      `,borderColor:"#aa5a2a",glowColor:"#ffaa60",title:"传说之炎",subtitle:"烈焰焚天 • 浴火重生 • 不死火鸟",animationDuration:3e3}:a.includes("雷吉洛克")||i===e.REGIROCK?{bgGradient:"linear-gradient(180deg, #2a1a0a 0%, #4a3a2a 15%, #6a5a4a 35%, #8a7a6a 60%, #aa9a8a 85%, #cac0b0 100%)",animation:`
        <div class="regirock-scene">
          <!-- 巨大岩石巨人身体 -->
          <div class="giant-rock-body"></div>
          <div class="rock-arm arm-left"></div>
          <div class="rock-arm arm-right"></div>
          <div class="rock-leg leg-left"></div>
          <div class="rock-leg leg-right"></div>
          
          <!-- 巨石落下 -->
          <div class="massive-boulder boulder-1"></div>
          <div class="massive-boulder boulder-2"></div>
          <div class="massive-boulder boulder-3"></div>
          <div class="massive-boulder boulder-4"></div>
          <div class="boulder-shadow shadow-1"></div>
          <div class="boulder-shadow shadow-2"></div>
          <div class="boulder-shadow shadow-3"></div>
          <div class="boulder-shadow shadow-4"></div>
          
          <!-- 地震裂缝 -->
          <div class="earthquake-crack crack-1"></div>
          <div class="earthquake-crack crack-2"></div>
          <div class="earthquake-crack crack-3"></div>
          <div class="earthquake-crack crack-4"></div>
          <div class="earthquake-crack crack-5"></div>
          <div class="ground-shatter shatter-1"></div>
          <div class="ground-shatter shatter-2"></div>
          <div class="ground-shatter shatter-3"></div>
          
          <!-- 岩石风暴 -->
          <div class="rock-storm-particle particle-1"></div>
          <div class="rock-storm-particle particle-2"></div>
          <div class="rock-storm-particle particle-3"></div>
          <div class="rock-storm-particle particle-4"></div>
          <div class="rock-storm-particle particle-5"></div>
          <div class="rock-storm-particle particle-6"></div>
          <div class="rock-storm-particle particle-7"></div>
          <div class="rock-storm-particle particle-8"></div>
          
          <!-- 远古符文 -->
          <div class="ancient-rock-rune rune-1"></div>
          <div class="ancient-rock-rune rune-2"></div>
          <div class="ancient-rock-rune rune-3"></div>
          <div class="ancient-rock-rune rune-4"></div>
          <div class="ancient-rock-rune rune-5"></div>
          <div class="ancient-rock-rune rune-6"></div>
          <div class="ancient-rock-rune rune-7"></div>
          <div class="rune-glow-circle circle-1"></div>
          <div class="rune-glow-circle circle-2"></div>
          <div class="rune-glow-circle circle-3"></div>
          
          <!-- 尖石攻击 -->
          <div class="stone-edge-spike spike-1"></div>
          <div class="stone-edge-spike spike-2"></div>
          <div class="stone-edge-spike spike-3"></div>
          <div class="stone-edge-spike spike-4"></div>
          <div class="stone-edge-spike spike-5"></div>
          
          <!-- 岩石护甲 -->
          <div class="rock-armor-layer layer-1"></div>
          <div class="rock-armor-layer layer-2"></div>
          <div class="rock-armor-layer layer-3"></div>
          
          <!-- 砂尘暴 -->
          <div class="sandstorm-dust dust-1"></div>
          <div class="sandstorm-dust dust-2"></div>
          <div class="sandstorm-dust dust-3"></div>
          <div class="sandstorm-dust dust-4"></div>
          <div class="sandstorm-dust dust-5"></div>
          
          <!-- 岩石爆炸 -->
          <div class="rock-blast-explosion explosion-1"></div>
          <div class="rock-blast-explosion explosion-2"></div>
          
          <!-- 巨岩能量 -->
          <div class="golem-ancient-power"></div>
          <div class="rock-energy-field"></div>
          <div class="clear-body-aura"></div>
        </div>
      `,borderColor:"#8a7a6a",glowColor:"#d0c0a0",title:"岩石神柱",subtitle:"远古巨岩 • 恒久不变 • 大地之力",animationDuration:3e3}:a.includes("雷吉艾斯")||i===e.REGICE?{bgGradient:"linear-gradient(180deg, #e0f0ff 0%, #c0e0ff 15%, #a0d0ff 35%, #80b0e0 60%, #6090c0 85%, #4070a0 100%)",animation:`
        <div class="regice-scene">
          <!-- 巨大冰山 -->
          <div class="giant-iceberg"></div>
          <div class="iceberg-peak peak-1"></div>
          <div class="iceberg-peak peak-2"></div>
          <div class="iceberg-peak peak-3"></div>
          <div class="ice-layer layer-1"></div>
          <div class="ice-layer layer-2"></div>
          <div class="ice-layer layer-3"></div>
          
          <!-- 冰川 -->
          <div class="massive-glacier glacier-1"></div>
          <div class="massive-glacier glacier-2"></div>
          <div class="glacier-crack crack-1"></div>
          <div class="glacier-crack crack-2"></div>
          <div class="glacier-crack crack-3"></div>
          
          <!-- 冰柱从天而降 -->
          <div class="falling-icicle icicle-1"></div>
          <div class="falling-icicle icicle-2"></div>
          <div class="falling-icicle icicle-3"></div>
          <div class="falling-icicle icicle-4"></div>
          <div class="falling-icicle icicle-5"></div>
          <div class="icicle-shatter shatter-1"></div>
          <div class="icicle-shatter shatter-2"></div>
          <div class="icicle-shatter shatter-3"></div>
          
          <!-- 暴风雪 -->
          <div class="blizzard-snowflake flake-1"></div>
          <div class="blizzard-snowflake flake-2"></div>
          <div class="blizzard-snowflake flake-3"></div>
          <div class="blizzard-snowflake flake-4"></div>
          <div class="blizzard-snowflake flake-5"></div>
          <div class="blizzard-snowflake flake-6"></div>
          <div class="blizzard-snowflake flake-7"></div>
          <div class="blizzard-snowflake flake-8"></div>
          <div class="snow-storm-wind wind-1"></div>
          <div class="snow-storm-wind wind-2"></div>
          <div class="snow-storm-wind wind-3"></div>
          
          <!-- 极寒冰晶 -->
          <div class="absolute-zero-crystal crystal-1"></div>
          <div class="absolute-zero-crystal crystal-2"></div>
          <div class="absolute-zero-crystal crystal-3"></div>
          <div class="absolute-zero-crystal crystal-4"></div>
          <div class="ice-crystal-particle particle-1"></div>
          <div class="ice-crystal-particle particle-2"></div>
          <div class="ice-crystal-particle particle-3"></div>
          <div class="ice-crystal-particle particle-4"></div>
          <div class="ice-crystal-particle particle-5"></div>
          
          <!-- 冰冻符文 -->
          <div class="frozen-ancient-rune rune-1"></div>
          <div class="frozen-ancient-rune rune-2"></div>
          <div class="frozen-ancient-rune rune-3"></div>
          <div class="frozen-ancient-rune rune-4"></div>
          <div class="frozen-ancient-rune rune-5"></div>
          <div class="frozen-ancient-rune rune-6"></div>
          <div class="frozen-ancient-rune rune-7"></div>
          <div class="ice-rune-circle circle-1"></div>
          <div class="ice-rune-circle circle-2"></div>
          <div class="ice-rune-circle circle-3"></div>
          
          <!-- 冰光束 -->
          <div class="ice-beam-ray beam-1"></div>
          <div class="ice-beam-ray beam-2"></div>
          <div class="ice-beam-ray beam-3"></div>
          
          <!-- 霜冻雾气 -->
          <div class="frost-mist mist-1"></div>
          <div class="frost-mist mist-2"></div>
          <div class="frost-mist mist-3"></div>
          <div class="frost-mist mist-4"></div>
          
          <!-- 冰封领域 -->
          <div class="frozen-domain"></div>
          <div class="ice-age-field"></div>
          <div class="clear-ice-body"></div>
          <div class="eternal-ice-aura"></div>
        </div>
      `,borderColor:"#6090c0",glowColor:"#c0e0ff",title:"冰山神柱",subtitle:"极寒之冰 • 永冻不化 • 绝对零度",animationDuration:3e3}:a.includes("雷吉斯奇鲁")||i===e.REGISTEEL?{bgGradient:"linear-gradient(180deg, #d0d0e0 0%, #b0b0c0 15%, #9090a0 35%, #707080 60%, #505060 85%, #303040 100%)",animation:`
        <div class="registeel-scene">
          <!-- 钢铁堡垒 -->
          <div class="steel-fortress"></div>
          <div class="metal-wall wall-1"></div>
          <div class="metal-wall wall-2"></div>
          <div class="metal-wall wall-3"></div>
          <div class="fortress-gate"></div>
          
          <!-- 巨大齿轮 -->
          <div class="giant-gear gear-1"></div>
          <div class="giant-gear gear-2"></div>
          <div class="giant-gear gear-3"></div>
          <div class="gear-teeth teeth-1"></div>
          <div class="gear-teeth teeth-2"></div>
          
          <!-- 金属板块 -->
          <div class="metal-plate plate-1"></div>
          <div class="metal-plate plate-2"></div>
          <div class="metal-plate plate-3"></div>
          <div class="metal-plate plate-4"></div>
          <div class="armor-segment segment-1"></div>
          <div class="armor-segment segment-2"></div>
          <div class="armor-segment segment-3"></div>
          
          <!-- 激光炮 -->
          <div class="laser-cannon cannon-1"></div>
          <div class="laser-cannon cannon-2"></div>
          <div class="laser-beam beam-1"></div>
          <div class="laser-beam beam-2"></div>
          <div class="laser-beam beam-3"></div>
          
          <!-- 金属粒子 -->
          <div class="metal-particle particle-1"></div>
          <div class="metal-particle particle-2"></div>
          <div class="metal-particle particle-3"></div>
          <div class="metal-particle particle-4"></div>
          <div class="metal-particle particle-5"></div>
          <div class="metal-particle particle-6"></div>
          
          <!-- 钢铁符文 -->
          <div class="steel-rune rune-1"></div>
          <div class="steel-rune rune-2"></div>
          <div class="steel-rune rune-3"></div>
          <div class="steel-rune rune-4"></div>
          <div class="steel-rune rune-5"></div>
          <div class="steel-rune rune-6"></div>
          <div class="steel-rune rune-7"></div>
          <div class="metal-rune-circle circle-1"></div>
          <div class="metal-rune-circle circle-2"></div>
          
          <!-- 电弧 -->
          <div class="electric-arc arc-1"></div>
          <div class="electric-arc arc-2"></div>
          <div class="electric-arc arc-3"></div>
          
          <!-- 钢铁护盾 -->
          <div class="iron-shield shield-1"></div>
          <div class="iron-shield shield-2"></div>
          <div class="iron-shield shield-3"></div>
          
          <!-- 加农炮 -->
          <div class="flash-cannon-blast"></div>
          <div class="cannon-charge"></div>
          
          <!-- 金属光泽 -->
          <div class="metal-shine shine-1"></div>
          <div class="metal-shine shine-2"></div>
          <div class="metal-shine shine-3"></div>
          
          <!-- 钢铁能量场 -->
          <div class="steel-energy-field"></div>
          <div class="clear-metal-body"></div>
          <div class="indestructible-aura"></div>
        </div>
      `,borderColor:"#707080",glowColor:"#c0c0d0",title:"钢铁神柱",subtitle:"合金之躯 • 坚不可摧 • 钢铁意志",animationDuration:3e3}:a.includes("雷吉奇卡斯")||a.includes("雷吉奇卡")?{bgGradient:"linear-gradient(180deg, #d4c4a4 0%, #b4a484 30%, #948464 70%, #746444 100%)",animation:`
        <div class="regigigas-scene">
          <div class="continental-pillar pillar-1"></div>
          <div class="continental-pillar pillar-2"></div>
          <div class="tectonic-power power-1"></div>
          <div class="tectonic-power power-2"></div>
          <div class="ancient-king king-1"></div>
          <div class="ancient-king king-2"></div>
          <div class="crush-grip"></div>
          <div class="slow-start"></div>
          <div class="continent-move"></div>
        </div>
      `,borderColor:"#948464",glowColor:"#b4a484",title:"圣柱之王",subtitle:"牵引大陆 • 创世巨神",animationDuration:2500}:a.includes("卡璞")&&a.includes("鸣鸣")?{bgGradient:"linear-gradient(180deg, #d4a430 0%, #e4b450 30%, #f4c470 70%, #ffd490 100%)",animation:`
        <div class="tapu-koko-scene">
          <div class="electric-totem totem-1"></div>
          <div class="electric-totem totem-2"></div>
          <div class="island-thunder thunder-1"></div>
          <div class="island-thunder thunder-2"></div>
          <div class="tribal-mask mask-1"></div>
          <div class="tribal-mask mask-2"></div>
          <div class="electric-surge"></div>
          <div class="nature-guardian"></div>
        </div>
      `,borderColor:"#f4c470",glowColor:"#ffd490",title:"美乐美乐",subtitle:"雷电守护 • 电气场地",animationDuration:2e3}:a.includes("卡璞")&&a.includes("蝶蝶")?{bgGradient:"linear-gradient(180deg, #e08090 0%, #f090a0 30%, #ffa0b0 70%, #ffb0c0 100%)",animation:`
        <div class="tapu-lele-scene">
          <div class="psychic-scale scale-1"></div>
          <div class="psychic-scale scale-2"></div>
          <div class="psychic-scale scale-3"></div>
          <div class="fairy-dust dust-1"></div>
          <div class="fairy-dust dust-2"></div>
          <div class="healing-pollen pollen-1"></div>
          <div class="healing-pollen pollen-2"></div>
          <div class="psychic-surge"></div>
          <div class="nature-guardian"></div>
        </div>
      `,borderColor:"#ffa0b0",glowColor:"#ffb0c0",title:"阿卡拉岛",subtitle:"精神守护 • 精神场地",animationDuration:2e3}:a.includes("卡璞")&&a.includes("哞哞")?{bgGradient:"linear-gradient(180deg, #9d5030 0%, #bd7050 30%, #dd9070 70%, #fdb090 100%)",animation:`
        <div class="tapu-bulu-scene">
          <div class="grass-horn horn-1"></div>
          <div class="grass-horn horn-2"></div>
          <div class="nature-power power-1"></div>
          <div class="nature-power power-2"></div>
          <div class="wooden-bell bell-1"></div>
          <div class="wooden-bell bell-2"></div>
          <div class="grassy-surge"></div>
          <div class="nature-guardian"></div>
        </div>
      `,borderColor:"#dd9070",glowColor:"#fdb090",title:"乌拉乌拉",subtitle:"草木守护 • 青草场地",animationDuration:2e3}:a.includes("卡璞")&&a.includes("鳍鳍")?{bgGradient:"linear-gradient(180deg, #5060a0 0%, #6070b0 30%, #7080c0 70%, #8090d0 100%)",animation:`
        <div class="tapu-fini-scene">
          <div class="mist-veil veil-1"></div>
          <div class="mist-veil veil-2"></div>
          <div class="purifying-water water-1"></div>
          <div class="purifying-water water-2"></div>
          <div class="ocean-current current-1"></div>
          <div class="ocean-current current-2"></div>
          <div class="misty-surge"></div>
          <div class="nature-guardian"></div>
        </div>
      `,borderColor:"#7080c0",glowColor:"#8090d0",title:"波尼岛",subtitle:"雾水守护 • 薄雾场地",animationDuration:2e3}:a.includes("拉帝亚斯")||i===e.LATIAS?{bgGradient:"linear-gradient(180deg, #ffe0f0 0%, #ffc0e0 15%, #ffa0d0 35%, #ff80c0 60%, #ff60b0 85%, #ff4090 100%)",animation:`
        <div class="latias-scene">
          <!-- 心灵感应波 -->
          <div class="telepathy-wave wave-1"></div>
          <div class="telepathy-wave wave-2"></div>
          <div class="telepathy-wave wave-3"></div>
          <div class="telepathy-wave wave-4"></div>
          <div class="telepathy-ripple ripple-1"></div>
          <div class="telepathy-ripple ripple-2"></div>
          <div class="telepathy-ripple ripple-3"></div>
          
          <!-- 念力光球 -->
          <div class="psychic-light-sphere sphere-1"></div>
          <div class="psychic-light-sphere sphere-2"></div>
          <div class="psychic-light-sphere sphere-3"></div>
          <div class="psychic-light-sphere sphere-4"></div>
          <div class="mind-orb orb-1"></div>
          <div class="mind-orb orb-2"></div>
          <div class="mind-orb orb-3"></div>
          
          <!-- 飘浮羽毛 -->
          <div class="floating-psychic-feather feather-1"></div>
          <div class="floating-psychic-feather feather-2"></div>
          <div class="floating-psychic-feather feather-3"></div>
          <div class="floating-psychic-feather feather-4"></div>
          <div class="floating-psychic-feather feather-5"></div>
          <div class="floating-psychic-feather feather-6"></div>
          <div class="floating-psychic-feather feather-7"></div>
          <div class="floating-psychic-feather feather-8"></div>
          
          <!-- 雾球 -->
          <div class="massive-mist-ball ball-1"></div>
          <div class="massive-mist-ball ball-2"></div>
          <div class="massive-mist-ball ball-3"></div>
          <div class="mist-explosion explosion-1"></div>
          <div class="mist-explosion explosion-2"></div>
          
          <!-- 视觉共享光线 -->
          <div class="sight-sharing-beam beam-1"></div>
          <div class="sight-sharing-beam beam-2"></div>
          <div class="sight-sharing-beam beam-3"></div>
          <div class="sight-connection-line line-1"></div>
          <div class="sight-connection-line line-2"></div>
          
          <!-- 心灵粒子 -->
          <div class="mind-particle particle-1"></div>
          <div class="mind-particle particle-2"></div>
          <div class="mind-particle particle-3"></div>
          <div class="mind-particle particle-4"></div>
          <div class="mind-particle particle-5"></div>
          <div class="mind-particle particle-6"></div>
          <div class="mind-particle particle-7"></div>
          <div class="mind-particle particle-8"></div>
          
          <!-- 心灵之眼 -->
          <div class="psychic-eye eye-1"></div>
          <div class="psychic-eye eye-2"></div>
          <div class="eye-glow glow-1"></div>
          <div class="eye-glow glow-2"></div>
          
          <!-- 念力冲击波 -->
          <div class="psychic-shockwave shock-1"></div>
          <div class="psychic-shockwave shock-2"></div>
          <div class="psychic-shockwave shock-3"></div>
          
          <!-- 飘浮光环 -->
          <div class="levitate-ring ring-1"></div>
          <div class="levitate-ring ring-2"></div>
          <div class="levitate-ring ring-3"></div>
          
          <!-- 心灵感应网络 -->
          <div class="telepathy-network"></div>
          <div class="mental-connection"></div>
          <div class="empathy-aura"></div>
        </div>
      `,borderColor:"#ff80c0",glowColor:"#ffc0e0",title:"红色飞龙",subtitle:"心灵感应 • 雾球攻击 • 视觉共享",animationDuration:3e3}:a.includes("拉帝欧斯")||i===e.LATIOS?{bgGradient:"linear-gradient(180deg, #e0f0ff 0%, #c0e0ff 15%, #a0d0ff 35%, #80c0ff 60%, #60b0ff 85%, #4090ff 100%)",animation:`
        <div class="latios-scene">
          <!-- 超高速飞行轨迹 -->
          <div class="supersonic-trail trail-1"></div>
          <div class="supersonic-trail trail-2"></div>
          <div class="supersonic-trail trail-3"></div>
          <div class="supersonic-trail trail-4"></div>
          <div class="supersonic-trail trail-5"></div>
          <div class="speed-blur blur-1"></div>
          <div class="speed-blur blur-2"></div>
          <div class="speed-blur blur-3"></div>
          
          <!-- 音速突破波 -->
          <div class="sonic-boom-wave boom-1"></div>
          <div class="sonic-boom-wave boom-2"></div>
          <div class="sonic-boom-wave boom-3"></div>
          <div class="sound-barrier-break break-1"></div>
          <div class="sound-barrier-break break-2"></div>
          
          <!-- 龙之波动 -->
          <div class="dragon-pulse-energy pulse-1"></div>
          <div class="dragon-pulse-energy pulse-2"></div>
          <div class="dragon-pulse-energy pulse-3"></div>
          <div class="dragon-pulse-energy pulse-4"></div>
          <div class="dragon-pulse-ring ring-1"></div>
          <div class="dragon-pulse-ring ring-2"></div>
          <div class="dragon-pulse-ring ring-3"></div>
          
          <!-- 洁净光芒 -->
          <div class="luster-purge-beam beam-1"></div>
          <div class="luster-purge-beam beam-2"></div>
          <div class="luster-purge-beam beam-3"></div>
          <div class="luster-explosion explosion-1"></div>
          <div class="luster-explosion explosion-2"></div>
          <div class="purifying-light light-1"></div>
          <div class="purifying-light light-2"></div>
          
          <!-- 气流涡旋 -->
          <div class="air-current-vortex vortex-1"></div>
          <div class="air-current-vortex vortex-2"></div>
          <div class="air-current-vortex vortex-3"></div>
          <div class="wind-spiral spiral-1"></div>
          <div class="wind-spiral spiral-2"></div>
          
          <!-- 飞行羽毛 -->
          <div class="blue-speed-feather feather-1"></div>
          <div class="blue-speed-feather feather-2"></div>
          <div class="blue-speed-feather feather-3"></div>
          <div class="blue-speed-feather feather-4"></div>
          <div class="blue-speed-feather feather-5"></div>
          <div class="blue-speed-feather feather-6"></div>
          <div class="blue-speed-feather feather-7"></div>
          
          <!-- 速度粒子 -->
          <div class="velocity-particle particle-1"></div>
          <div class="velocity-particle particle-2"></div>
          <div class="velocity-particle particle-3"></div>
          <div class="velocity-particle particle-4"></div>
          <div class="velocity-particle particle-5"></div>
          <div class="velocity-particle particle-6"></div>
          <div class="velocity-particle particle-7"></div>
          <div class="velocity-particle particle-8"></div>
          
          <!-- 念力视线 -->
          <div class="psychic-sight sight-1"></div>
          <div class="psychic-sight sight-2"></div>
          <div class="telepathy-link link-1"></div>
          <div class="telepathy-link link-2"></div>
          
          <!-- 飘浮能量 -->
          <div class="levitate-energy-field"></div>
          <div class="infinite-speed-aura"></div>
          <div class="dragon-spirit-essence"></div>
        </div>
      `,borderColor:"#60b0ff",glowColor:"#c0e0ff",title:"蓝色飞龙",subtitle:"超高速 • 洁净光芒 • 龙之威严",animationDuration:3e3}:a.includes("虚吾伊德")||i===e.NIHILEGO?{bgGradient:"linear-gradient(180deg, #e0d0f0 0%, #c0b0e0 30%, #a090d0 70%, #8070c0 100%)",animation:`
        <div class="nihilego-scene">
          <div class="jellyfish-tentacle tentacle-1"></div>
          <div class="jellyfish-tentacle tentacle-2"></div>
          <div class="jellyfish-tentacle tentacle-3"></div>
          <div class="neurotoxin toxin-1"></div>
          <div class="neurotoxin toxin-2"></div>
          <div class="crystal-body body-1"></div>
          <div class="crystal-body body-2"></div>
          <div class="parasitic-aura"></div>
          <div class="ultra-space"></div>
        </div>
      `,borderColor:"#a090d0",glowColor:"#c0b0e0",title:"UB:寄生",subtitle:"神经毒素 • 寄生侵蚀",animationDuration:2e3}:a.includes("爆肌蚊")||i===e.BUZZWOLE?{bgGradient:"linear-gradient(180deg, #8b0000 0%, #a52a2a 30%, #dc143c 70%, #ff6347 100%)",animation:`
        <div class="buzzwole-scene">
          <div class="muscle-flex flex-1"></div>
          <div class="muscle-flex flex-2"></div>
          <div class="power-pose pose-1"></div>
          <div class="power-pose pose-2"></div>
          <div class="mosquito-wing wing-1"></div>
          <div class="mosquito-wing wing-2"></div>
          <div class="blood-drain"></div>
          <div class="beast-boost"></div>
        </div>
      `,borderColor:"#dc143c",glowColor:"#ff6347",title:"UB:膨胀",subtitle:"爆裂肌肉 • 力量炫耀",animationDuration:2e3}:a.includes("费洛美螂")||i===e.PHEROMOSA?{bgGradient:"linear-gradient(180deg, #f0e0ff 0%, #e0c0ff 30%, #d0a0ff 70%, #c080ff 100%)",animation:`
        <div class="pheromosa-scene">
          <div class="elegant-stride stride-1"></div>
          <div class="elegant-stride stride-2"></div>
          <div class="pheromone-wave wave-1"></div>
          <div class="pheromone-wave wave-2"></div>
          <div class="speed-blur blur-1"></div>
          <div class="speed-blur blur-2"></div>
          <div class="beauty-aura"></div>
          <div class="beast-boost"></div>
        </div>
      `,borderColor:"#d0a0ff",glowColor:"#e0c0ff",title:"UB:美丽",subtitle:"极致优雅 • 闪电速度",animationDuration:2e3}:a.includes("电束木")||i===e.XURKITREE?{bgGradient:"linear-gradient(180deg, #1a1a0a 0%, #3a3a1a 30%, #6a6a3a 70%, #9a9a5a 100%)",animation:`
        <div class="xurkitree-scene">
          <div class="electric-wire wire-1"></div>
          <div class="electric-wire wire-2"></div>
          <div class="electric-wire wire-3"></div>
          <div class="power-surge surge-1"></div>
          <div class="power-surge surge-2"></div>
          <div class="lightning-tree tree-1"></div>
          <div class="lightning-tree tree-2"></div>
          <div class="hypnosis-glow"></div>
          <div class="beast-boost"></div>
        </div>
      `,borderColor:"#6a6a3a",glowColor:"#9a9a5a",title:"UB:闪电",subtitle:"电力树木 • 能量吸收",animationDuration:2e3}:a.includes("铁火辉夜")||a.includes("辉夜")||i===e.CELESTEELA?{bgGradient:"linear-gradient(180deg, #4a5a6a 0%, #6a7a8a 30%, #8a9aaa 70%, #aabaca 100%)",animation:`
        <div class="celesteela-scene">
          <div class="rocket-flame flame-1"></div>
          <div class="rocket-flame flame-2"></div>
          <div class="bamboo-steel steel-1"></div>
          <div class="bamboo-steel steel-2"></div>
          <div class="missile-launch launch-1"></div>
          <div class="missile-launch launch-2"></div>
          <div class="heavy-slam"></div>
          <div class="beast-boost"></div>
        </div>
      `,borderColor:"#8a9aaa",glowColor:"#aabaca",title:"UB:利刃",subtitle:"钢铁竹子 • 火箭升空",animationDuration:2e3}:a.includes("纸御剑")||i===e.KARTANA?{bgGradient:"linear-gradient(180deg, #d0e0f0 0%, #b0c0e0 30%, #90a0d0 70%, #7080c0 100%)",animation:`
        <div class="kartana-scene">
          <div class="paper-blade blade-1"></div>
          <div class="paper-blade blade-2"></div>
          <div class="paper-blade blade-3"></div>
          <div class="origami-fold fold-1"></div>
          <div class="origami-fold fold-2"></div>
          <div class="razor-leaf leaf-1"></div>
          <div class="razor-leaf leaf-2"></div>
          <div class="leaf-blade"></div>
          <div class="beast-boost"></div>
        </div>
      `,borderColor:"#90a0d0",glowColor:"#b0c0e0",title:"UB:斩击",subtitle:"纸之利刃 • 折纸剑士",animationDuration:2e3}:a.includes("恶食大王")||i===e.GUZZLORD?{bgGradient:"linear-gradient(180deg, #0a0a1a 0%, #1a1a3a 30%, #2a2a5a 70%, #3a3a7a 100%)",animation:`
        <div class="guzzlord-scene">
          <div class="dark-void void-1"></div>
          <div class="dark-void void-2"></div>
          <div class="giant-maw maw-1"></div>
          <div class="giant-maw maw-2"></div>
          <div class="consume-all consume-1"></div>
          <div class="consume-all consume-2"></div>
          <div class="gluttony-aura"></div>
          <div class="beast-boost"></div>
        </div>
      `,borderColor:"#2a2a5a",glowColor:"#3a3a7a",title:"UB:大胃王",subtitle:"吞噬一切 • 无尽饥饿",animationDuration:2e3}:a.includes("蒂安希")||i===e.DIANCIE?{bgGradient:"linear-gradient(180deg, #ffb6c1 0%, #ffc0cb 30%, #ffd1dc 70%, #ffe4e1 100%)",animation:`
        <div class="diancie-scene">
          <div class="diamond-shine shine-1"></div>
          <div class="diamond-shine shine-2"></div>
          <div class="diamond-shine shine-3"></div>
          <div class="crystal-formation formation-1"></div>
          <div class="crystal-formation formation-2"></div>
          <div class="sparkle-aura aura-1"></div>
          <div class="sparkle-aura aura-2"></div>
          <div class="diamond-storm"></div>
          <div class="mega-evolution"></div>
        </div>
      `,borderColor:"#ffd1dc",glowColor:"#ffe4e1",title:"钻石公主",subtitle:"钻石风暴 • 华丽变身",animationDuration:2500}:a.includes("胡帕")||i===e.HOOPA?{bgGradient:"linear-gradient(180deg, #6a3a7a 0%, #8a5a9a 30%, #aa7aba 70%, #ca9ada 100%)",animation:`
        <div class="hoopa-scene">
          <div class="dimensional-ring ring-1"></div>
          <div class="dimensional-ring ring-2"></div>
          <div class="dimensional-ring ring-3"></div>
          <div class="hyperspace-hole hole-1"></div>
          <div class="hyperspace-hole hole-2"></div>
          <div class="mischief-aura aura-1"></div>
          <div class="mischief-aura aura-2"></div>
          <div class="unbound-power"></div>
        </div>
      `,borderColor:"#aa7aba",glowColor:"#ca9ada",title:"超魔神",subtitle:"次元光环 • 解放形态",animationDuration:2500}:a.includes("波尔凯尼恩")||i===e.VOLCANION?{bgGradient:"linear-gradient(180deg, #5a3a2a 0%, #7a5a4a 30%, #aa8a6a 70%, #daba9a 100%)",animation:`
        <div class="volcanion-scene">
          <div class="steam-blast blast-1"></div>
          <div class="steam-blast blast-2"></div>
          <div class="volcano-water water-1"></div>
          <div class="volcano-water water-2"></div>
          <div class="fire-water-mix mix-1"></div>
          <div class="fire-water-mix mix-2"></div>
          <div class="steam-eruption"></div>
          <div class="water-absorb"></div>
        </div>
      `,borderColor:"#aa8a6a",glowColor:"#daba9a",title:"蒸汽宝可梦",subtitle:"火水交融 • 蒸汽爆炸",animationDuration:2500}:a.includes("玛机雅娜")||i===e.MAGEARNA?{bgGradient:"linear-gradient(180deg, #9a8a7a 0%, #baaaa0 30%, #dacac0 70%, #faeae0 100%)",animation:`
        <div class="magearna-scene">
          <div class="gear-rotate gear-1"></div>
          <div class="gear-rotate gear-2"></div>
          <div class="gear-rotate gear-3"></div>
          <div class="clockwork-heart heart-1"></div>
          <div class="clockwork-heart heart-2"></div>
          <div class="soul-heart soul-1"></div>
          <div class="soul-heart soul-2"></div>
          <div class="fleur-cannon"></div>
        </div>
      `,borderColor:"#dacac0",glowColor:"#faeae0",title:"人造宝可梦",subtitle:"灵魂之心 • 花朵加农炮",animationDuration:2500}:a.includes("捷拉奥拉")||i===e.ZERAORA?{bgGradient:"linear-gradient(180deg, #1a2a4a 0%, #2a4a6a 30%, #4a6a8a 70%, #6a8aaa 100%)",animation:`
        <div class="zeraora-scene">
          <div class="plasma-fist fist-1"></div>
          <div class="plasma-fist fist-2"></div>
          <div class="electric-claw claw-1"></div>
          <div class="electric-claw claw-2"></div>
          <div class="electric-claw claw-3"></div>
          <div class="lightning-speed speed-1"></div>
          <div class="lightning-speed speed-2"></div>
          <div class="volt-absorb"></div>
        </div>
      `,borderColor:"#4a6a8a",glowColor:"#6a8aaa",title:"雷电宝可梦",subtitle:"等离子拳 • 闪电速度",animationDuration:2e3}:a.includes("美录")||i===e.MELTAN||i===e.MELMETAL?{bgGradient:"linear-gradient(180deg, #7a7a8a 0%, #9a9aaa 30%, #bababc 70%, #dadadc 100%)",animation:`
        <div class="melmetal-scene">
          <div class="liquid-metal metal-1"></div>
          <div class="liquid-metal metal-2"></div>
          <div class="hex-nut nut-1"></div>
          <div class="hex-nut nut-2"></div>
          <div class="hex-nut nut-3"></div>
          <div class="double-iron-bash"></div>
          <div class="iron-defense"></div>
        </div>
      `,borderColor:"#bababc",glowColor:"#dadadc",title:"钢铁宝可梦",subtitle:"液态金属 • 双倍铁拳",animationDuration:2e3}:a.includes("龙卷云")||i===e.TORNADUS?{bgGradient:"linear-gradient(180deg, #3a5a6a 0%, #5a7a8a 30%, #7a9aaa 70%, #9ababc 100%)",animation:`
        <div class="tornadus-scene">
          <div class="tornado-spiral spiral-1"></div>
          <div class="tornado-spiral spiral-2"></div>
          <div class="wind-fury fury-1"></div>
          <div class="wind-fury fury-2"></div>
          <div class="hurricane-force"></div>
          <div class="defiant-wind"></div>
        </div>
      `,borderColor:"#7a9aaa",glowColor:"#9ababc",title:"旋风之神",subtitle:"暴风之怒 • 飓风之力",animationDuration:1800}:a.includes("雷电云")||i===e.THUNDURUS?{bgGradient:"linear-gradient(180deg, #2a3a5a 0%, #4a5a7a 30%, #6a7a9a 70%, #8a9aba 100%)",animation:`
        <div class="thundurus-scene">
          <div class="thunder-wave wave-1"></div>
          <div class="thunder-wave wave-2"></div>
          <div class="lightning-fury fury-1"></div>
          <div class="lightning-fury fury-2"></div>
          <div class="volt-switch"></div>
          <div class="defiant-storm"></div>
        </div>
      `,borderColor:"#6a7a9a",glowColor:"#8a9aba",title:"雷鸣之神",subtitle:"闪电之怒 • 伏特替换",animationDuration:1800}:a.includes("帝牙卢卡")?{bgGradient:"linear-gradient(180deg, #4060c0 0%, #5080d0 30%, #60a0e0 70%, #70b0f0 100%)",animation:`
        <div class="dialga-scene">
          <div class="time-gear gear-1"></div>
          <div class="time-gear gear-2"></div>
          <div class="temporal-wave wave-1"></div>
          <div class="temporal-wave wave-2"></div>
          <div class="clock-hand hand-1"></div>
          <div class="clock-hand hand-2"></div>
          <div class="time-distortion distortion-1"></div>
          <div class="time-distortion distortion-2"></div>
          <div class="roar-of-time"></div>
          <div class="adamant-orb"></div>
        </div>
      `,borderColor:"#5080d0",glowColor:"#70b0f0",title:"时间之神",subtitle:"时之咆哮 • 时空操控",animationDuration:2500}:a.includes("帕路奇亚")?{bgGradient:"linear-gradient(180deg, #c060a0 0%, #d080b0 30%, #e0a0c0 70%, #f0b0d0 100%)",animation:`
        <div class="palkia-scene">
          <div class="space-portal portal-1"></div>
          <div class="space-portal portal-2"></div>
          <div class="space-rift rift-1"></div>
          <div class="space-rift rift-2"></div>
          <div class="space-rift rift-3"></div>
          <div class="spatial-wave wave-1"></div>
          <div class="spatial-wave wave-2"></div>
          <div class="space-distortion"></div>
          <div class="spacial-rend"></div>
          <div class="lustrous-orb"></div>
        </div>
      `,borderColor:"#d080b0",glowColor:"#f0b0d0",title:"空间之神",subtitle:"亚空裂斩 • 空间操控",animationDuration:2500}:a.includes("骑拉帝纳")?{bgGradient:"linear-gradient(180deg, #1a1a2a 0%, #2a2a3a 30%, #3a3a4a 70%, #4a4a5a 100%)",animation:`
        <div class="giratina-scene">
          <div class="dark-sphere sphere-1"></div>
          <div class="dark-sphere sphere-2"></div>
          <div class="antimatter-sphere sphere-1"></div>
          <div class="antimatter-sphere sphere-2"></div>
          <div class="distortion-world world-1"></div>
          <div class="distortion-world world-2"></div>
          <div class="ghostly-aura aura-1"></div>
          <div class="ghostly-aura aura-2"></div>
          <div class="shadow-force"></div>
          <div class="griseous-orb"></div>
        </div>
      `,borderColor:"#3a3a4a",glowColor:"#6a6a7a",title:"反转之神",subtitle:"暗影强袭 • 反转世界",animationDuration:2500}:a.includes("阿尔宙斯")?{bgGradient:"linear-gradient(180deg, #f0f0e0 0%, #e0e0d0 30%, #d0d0c0 70%, #c0c0b0 100%)",animation:`
        <div class="arceus-scene">
          <div class="divine-ring ring-1"></div>
          <div class="divine-ring ring-2"></div>
          <div class="divine-ring ring-3"></div>
          <div class="light-beam"></div>
          <div class="omnipotent-power"></div>
          <div class="genesis-particle particle-1"></div>
          <div class="genesis-particle particle-2"></div>
          <div class="genesis-particle particle-3"></div>
          <div class="judgment-ray"></div>
          <div class="multitype-aura"></div>
        </div>
      `,borderColor:"#d0d0c0",glowColor:"#ffffff",title:"创世之神",subtitle:"制裁光砾 • 创世降临",animationDuration:3e3}:a.includes("雷吉奇卡斯")?{bgGradient:"linear-gradient(180deg, #d4c4a4 0%, #b4a484 30%, #948464 70%, #746444 100%)",animation:`
        <div class="regigigas-scene">
          <div class="giant-pillar pillar-1"></div>
          <div class="giant-pillar pillar-2"></div>
          <div class="tectonic-shift"></div>
          <div class="continental-crush"></div>
          <div class="crush-grip"></div>
          <div class="slow-start"></div>
          <div class="continent-move"></div>
        </div>
      `,borderColor:"#948464",glowColor:"#c4b494",title:"圣柱之王",subtitle:"捏碎 • 慢启动",animationDuration:2500}:a.includes("克雷色利亚")||i===e.CRESSELIA?{bgGradient:"linear-gradient(180deg, #f0c0e0 0%, #e0a0d0 30%, #d080c0 70%, #c060b0 100%)",animation:`
        <div class="cresselia-scene">
          <div class="lunar-crescent"></div>
          <div class="dream-mist mist-1"></div>
          <div class="dream-mist mist-2"></div>
          <div class="dream-mist mist-3"></div>
          <div class="moon-light light-1"></div>
          <div class="moon-light light-2"></div>
          <div class="healing-wish"></div>
          <div class="lunar-dance"></div>
        </div>
      `,borderColor:"#d080c0",glowColor:"#f0c0e0",title:"新月之神",subtitle:"新月之舞 • 美梦守护",animationDuration:2200}:a.includes("达克莱伊")?{bgGradient:"linear-gradient(180deg, #0a0a1a 0%, #1a1a2a 30%, #2a2a3a 70%, #3a3a4a 100%)",animation:`
        <div class="darkrai-scene">
          <div class="dark-sphere sphere-1"></div>
          <div class="dark-sphere sphere-2"></div>
          <div class="nightmare-shadow shadow-1"></div>
          <div class="nightmare-shadow shadow-2"></div>
          <div class="nightmare-shadow shadow-3"></div>
          <div class="nightmare-mist mist-1"></div>
          <div class="nightmare-mist mist-2"></div>
          <div class="shadow-claw"></div>
          <div class="dark-void"></div>
        </div>
      `,borderColor:"#2a2a3a",glowColor:"#4a4a6a",title:"噩梦之神",subtitle:"暗黑洞 • 噩梦缠身",animationDuration:2200}:a.includes("玛娜菲")?{bgGradient:"linear-gradient(180deg, #4080d0 0%, #50a0e0 30%, #60c0f0 70%, #70d0ff 100%)",animation:`
        <div class="manaphy-scene">
          <div class="ocean-ripple ripple-1"></div>
          <div class="ocean-ripple ripple-2"></div>
          <div class="ocean-ripple ripple-3"></div>
          <div class="water-crown"></div>
          <div class="jellyfish-glow glow-1"></div>
          <div class="jellyfish-glow glow-2"></div>
          <div class="deep-sea-bubble bubble-1"></div>
          <div class="deep-sea-bubble bubble-2"></div>
          <div class="deep-sea-bubble bubble-3"></div>
          <div class="heart-swap"></div>
        </div>
      `,borderColor:"#60c0f0",glowColor:"#70d0ff",title:"海洋王子",subtitle:"心灵互换 • 深海守护",animationDuration:2200}:a.includes("霏欧纳")||i===e.PHIONE?{bgGradient:"linear-gradient(180deg, #60a0d0 0%, #70b0e0 30%, #80c0f0 70%, #90d0ff 100%)",animation:`
        <div class="phione-scene">
          <div class="water-bubble bubble-1"></div>
          <div class="water-bubble bubble-2"></div>
          <div class="water-bubble bubble-3"></div>
          <div class="water-bubble bubble-4"></div>
          <div class="ocean-current current-1"></div>
          <div class="ocean-current current-2"></div>
          <div class="cute-swim"></div>
        </div>
      `,borderColor:"#80c0f0",glowColor:"#90d0ff",title:"深海精灵",subtitle:"海洋嬉戏 • 水流之舞",animationDuration:2e3}:a.includes("谢米")?{bgGradient:"linear-gradient(180deg, #80d060 0%, #90e070 30%, #a0f080 70%, #b0ff90 100%)",animation:`
        <div class="shaymin-scene">
          <div class="flower-bloom bloom-1"></div>
          <div class="flower-bloom bloom-2"></div>
          <div class="flower-bloom bloom-3"></div>
          <div class="flower-bloom bloom-4"></div>
          <div class="flower-bloom bloom-5"></div>
          <div class="grass-aura"></div>
          <div class="forest-leaf leaf-1"></div>
          <div class="forest-leaf leaf-2"></div>
          <div class="seed-flare"></div>
          <div class="sky-forme-wind"></div>
        </div>
      `,borderColor:"#a0f080",glowColor:"#b0ff90",title:"感谢宝可梦",subtitle:"种子闪光 • 花海祝福",animationDuration:2200}:a.includes("由克希")||i===e.UXIE?{bgGradient:"linear-gradient(180deg, #f0d060 0%, #f0e070 30%, #f0f080 70%, #f0ff90 100%)",animation:`
        <div class="uxie-scene">
          <div class="knowledge-sphere sphere-1"></div>
          <div class="knowledge-sphere sphere-2"></div>
          <div class="wisdom-light light-1"></div>
          <div class="wisdom-light light-2"></div>
          <div class="memory-erase"></div>
          <div class="lake-guardian"></div>
        </div>
      `,borderColor:"#f0f080",glowColor:"#ffff90",title:"知识之神",subtitle:"智慧之湖 • 记忆抹消",animationDuration:2e3}:a.includes("艾姆利多")||i===e.MESPRIT?{bgGradient:"linear-gradient(180deg, #f060a0 0%, #f070b0 30%, #f080c0 70%, #f090d0 100%)",animation:`
        <div class="mesprit-scene">
          <div class="emotion-wave wave-1"></div>
          <div class="emotion-wave wave-2"></div>
          <div class="emotion-wave wave-3"></div>
          <div class="feeling-heart heart-1"></div>
          <div class="feeling-heart heart-2"></div>
          <div class="lake-guardian"></div>
        </div>
      `,borderColor:"#f080c0",glowColor:"#ff90d0",title:"情感之神",subtitle:"情感之湖 • 心灵共鸣",animationDuration:2e3}:a.includes("亚克诺姆")||i===e.AZELF?{bgGradient:"linear-gradient(180deg, #6060f0 0%, #7070f0 30%, #8080f0 70%, #9090f0 100%)",animation:`
        <div class="azelf-scene">
          <div class="willpower-aura aura-1"></div>
          <div class="willpower-aura aura-2"></div>
          <div class="determination-beam beam-1"></div>
          <div class="determination-beam beam-2"></div>
          <div class="lake-guardian"></div>
        </div>
      `,borderColor:"#8080f0",glowColor:"#9090ff",title:"意志之神",subtitle:"意志之湖 • 决心之力",animationDuration:2e3}:a.includes("席多蓝恩")||i===e.HEATRAN?{bgGradient:"linear-gradient(180deg, #c04020 0%, #d06030 30%, #e08040 70%, #f0a050 100%)",animation:`
        <div class="heatran-scene">
          <div class="lava-flow lava-1"></div>
          <div class="lava-flow lava-2"></div>
          <div class="volcano-smoke smoke-1"></div>
          <div class="volcano-smoke smoke-2"></div>
          <div class="fire-particle particle-1"></div>
          <div class="fire-particle particle-2"></div>
          <div class="fire-particle particle-3"></div>
          <div class="magma-storm"></div>
          <div class="flash-fire"></div>
        </div>
      `,borderColor:"#e08040",glowColor:"#f0a050",title:"火山宝可梦",subtitle:"岩浆风暴 • 引火特性",animationDuration:2200}:a.includes("莱希拉姆")?{bgGradient:"linear-gradient(180deg, #f0f0e0 0%, #e0e0d0 30%, #d0d0c0 70%, #c0c0b0 100%)",animation:`
        <div class="reshiram-scene">
          <div class="white-flame flame-1"></div>
          <div class="white-flame flame-2"></div>
          <div class="white-fire fire-1"></div>
          <div class="white-fire fire-2"></div>
          <div class="truth-flame"></div>
          <div class="blue-flare"></div>
          <div class="fusion-flare"></div>
          <div class="turboblaze"></div>
        </div>
      `,borderColor:"#d0d0c0",glowColor:"#f0f0e0",title:"白色真理",subtitle:"青焰 • 真实之焰",animationDuration:2500}:a.includes("捷克罗姆")?{bgGradient:"linear-gradient(180deg, #0a0a1a 0%, #1a1a2a 30%, #2a2a3a 70%, #3a3a4a 100%)",animation:`
        <div class="zekrom-scene">
          <div class="black-lightning lightning-1"></div>
          <div class="black-lightning lightning-2"></div>
          <div class="black-thunder thunder-1"></div>
          <div class="black-thunder thunder-2"></div>
          <div class="ideal-thunder"></div>
          <div class="bolt-strike"></div>
          <div class="fusion-bolt"></div>
          <div class="teravolt"></div>
        </div>
      `,borderColor:"#2a2a3a",glowColor:"#5a5a7a",title:"黑色理想",subtitle:"雷击 • 理想之雷",animationDuration:2500}:a.includes("酋雷姆")?{bgGradient:"linear-gradient(180deg, #c0e0f0 0%, #a0c0e0 30%, #80a0d0 70%, #6080c0 100%)",animation:`
        <div class="kyurem-scene">
          <div class="ice-crystal-aura aura-1"></div>
          <div class="ice-crystal-aura aura-2"></div>
          <div class="freeze-shock"></div>
          <div class="glaciate"></div>
          <div class="dna-splicers"></div>
          <div class="absolute-zero"></div>
        </div>
      `,borderColor:"#80a0d0",glowColor:"#c0e0f0",title:"冰龙宝可梦",subtitle:"冰封世界 • DNA融合",animationDuration:2500}:a.includes("比克提尼")?{bgGradient:"linear-gradient(180deg, #ffd060 0%, #ffe070 30%, #fff080 70%, #ffff90 100%)",animation:`
        <div class="victini-scene">
          <div class="victory-star star-1"></div>
          <div class="victory-star star-2"></div>
          <div class="victory-star star-3"></div>
          <div class="v-create"></div>
          <div class="v-aura"></div>
          <div class="victory-light"></div>
        </div>
      `,borderColor:"#fff080",glowColor:"#ffff90",title:"V字胜利",subtitle:"V热焰 • 胜利之星",animationDuration:2200}:a.includes("凯路迪欧")||i===e.KELDEO?{bgGradient:"linear-gradient(180deg, #50a0d0 0%, #60b0e0 30%, #70c0f0 70%, #80d0ff 100%)",animation:`
        <div class="keldeo-scene">
          <div class="sacred-sword sword-1"></div>
          <div class="sacred-sword sword-2"></div>
          <div class="water-blade blade-1"></div>
          <div class="water-blade blade-2"></div>
          <div class="secret-sword"></div>
          <div class="resolute-forme"></div>
        </div>
      `,borderColor:"#70c0f0",glowColor:"#80d0ff",title:"圣剑士",subtitle:"神秘之剑 • 觉悟形态",animationDuration:2200}:a.includes("美洛耶塔")?{bgGradient:"linear-gradient(180deg, #f0a0c0 0%, #f0b0d0 30%, #f0c0e0 70%, #f0d0f0 100%)",animation:`
        <div class="meloetta-scene">
          <div class="musical-note note-1"></div>
          <div class="musical-note note-2"></div>
          <div class="musical-note note-3"></div>
          <div class="melody-wave wave-1"></div>
          <div class="melody-wave wave-2"></div>
          <div class="aria-aura"></div>
          <div class="pirouette-spin"></div>
          <div class="relic-song"></div>
        </div>
      `,borderColor:"#f0c0e0",glowColor:"#f0d0f0",title:"音乐女神",subtitle:"古老之歌 • 舞步形态",animationDuration:2200}:a.includes("盖诺赛克特")?{bgGradient:"linear-gradient(180deg, #605070 0%, #706080 30%, #807090 70%, #9080a0 100%)",animation:`
        <div class="genesect-scene">
          <div class="plasma-cannon"></div>
          <div class="cyborg-aura"></div>
          <div class="ancient-tech tech-1"></div>
          <div class="ancient-tech tech-2"></div>
          <div class="techno-blast"></div>
          <div class="download-upgrade"></div>
        </div>
      `,borderColor:"#807090",glowColor:"#9080a0",title:"等离子炮",subtitle:"科技冲击 • 下载特性",animationDuration:2200}:a.includes("勾帕路翁")||i===e.COBALION?{bgGradient:"linear-gradient(180deg, #6080a0 0%, #7090b0 30%, #80a0c0 70%, #90b0d0 100%)",animation:`
        <div class="cobalion-scene">
          <div class="steel-aura aura-1"></div>
          <div class="steel-aura aura-2"></div>
          <div class="iron-head"></div>
          <div class="sacred-sword"></div>
          <div class="justified-boost"></div>
        </div>
      `,borderColor:"#80a0c0",glowColor:"#90b0d0",title:"钢铁战士",subtitle:"神圣之剑 • 正义之心",animationDuration:2e3}:a.includes("代拉基翁")||i===e.TERRAKION?{bgGradient:"linear-gradient(180deg, #a08060 0%, #b09070 30%, #c0a080 70%, #d0b090 100%)",animation:`
        <div class="terrakion-scene">
          <div class="rock-aura aura-1"></div>
          <div class="rock-aura aura-2"></div>
          <div class="stone-edge"></div>
          <div class="sacred-sword"></div>
          <div class="justified-boost"></div>
        </div>
      `,borderColor:"#c0a080",glowColor:"#d0b090",title:"岩石战士",subtitle:"神圣之剑 • 正义之心",animationDuration:2e3}:a.includes("毕力吉翁")||i===e.VIRIZION?{bgGradient:"linear-gradient(180deg, #60c080 0%, #70d090 30%, #80e0a0 70%, #90f0b0 100%)",animation:`
        <div class="virizion-scene">
          <div class="grass-aura aura-1"></div>
          <div class="grass-aura aura-2"></div>
          <div class="leaf-blade"></div>
          <div class="sacred-sword"></div>
          <div class="justified-boost"></div>
        </div>
      `,borderColor:"#80e0a0",glowColor:"#90f0b0",title:"草原战士",subtitle:"神圣之剑 • 正义之心",animationDuration:2e3}:a.includes("伊裴尔塔尔")?{bgGradient:"linear-gradient(180deg, #1a0000 0%, #2a0a0a 30%, #3a1a1a 70%, #4a2a2a 100%)",animation:`
        <div class="yveltal-scene">
          <div class="death-wing wing-1"></div>
          <div class="death-wing wing-2"></div>
          <div class="dark-aura-field"></div>
          <div class="oblivion-wing"></div>
          <div class="life-drain drain-1"></div>
          <div class="life-drain drain-2"></div>
          <div class="destruction-sphere"></div>
        </div>
      `,borderColor:"#3a1a1a",glowColor:"#6a3a3a",title:"破坏之神",subtitle:"死亡之翼 • 湮灭之光",animationDuration:2500}:a.includes("基格尔德")?{bgGradient:"linear-gradient(180deg, #2a4a2a 0%, #3a5a3a 30%, #4a6a4a 70%, #5a7a5a 100%)",animation:`
        <div class="zygarde-scene">
          <div class="cell-particle particle-1"></div>
          <div class="cell-particle particle-2"></div>
          <div class="cell-particle particle-3"></div>
          <div class="cell-particle particle-4"></div>
          <div class="cell-particle particle-5"></div>
          <div class="core-glow core-1"></div>
          <div class="core-glow core-2"></div>
          <div class="order-aura"></div>
          <div class="thousand-arrows"></div>
          <div class="complete-forme"></div>
        </div>
      `,borderColor:"#4a6a4a",glowColor:"#6a8a6a",title:"秩序之神",subtitle:"千箭齐发 • 完全形态",animationDuration:2500}:a.includes("蒂安希")?{bgGradient:"linear-gradient(180deg, #ffc0e0 0%, #ffd0f0 30%, #ffe0ff 70%, #fff0ff 100%)",animation:`
        <div class="diancie-scene">
          <div class="diamond-crystal crystal-1"></div>
          <div class="diamond-crystal crystal-2"></div>
          <div class="diamond-crystal crystal-3"></div>
          <div class="diamond-storm"></div>
          <div class="mega-sparkle sparkle-1"></div>
          <div class="mega-sparkle sparkle-2"></div>
          <div class="mega-sparkle sparkle-3"></div>
          <div class="princess-aura"></div>
        </div>
      `,borderColor:"#ffe0ff",glowColor:"#fff0ff",title:"钻石公主",subtitle:"钻石风暴 • 超进化",animationDuration:2200}:a.includes("胡帕")?{bgGradient:"linear-gradient(180deg, #4a3060 0%, #5a4070 30%, #6a5080 70%, #7a6090 100%)",animation:`
        <div class="hoopa-scene">
          <div class="ring-portal portal-1"></div>
          <div class="ring-portal portal-2"></div>
          <div class="ring-portal portal-3"></div>
          <div class="hyperspace-hole"></div>
          <div class="unbound-arm arm-1"></div>
          <div class="unbound-arm arm-2"></div>
          <div class="magician-trick"></div>
        </div>
      `,borderColor:"#6a5080",glowColor:"#8a70a0",title:"恶作剧宝可梦",subtitle:"异次元洞 • 解放形态",animationDuration:2200}:a.includes("波尔凯尼恩")?{bgGradient:"linear-gradient(180deg, #c06040 0%, #d07050 30%, #e08060 70%, #f09070 100%)",animation:`
        <div class="volcanion-scene">
          <div class="steam-cloud cloud-1"></div>
          <div class="steam-cloud cloud-2"></div>
          <div class="steam-cloud cloud-3"></div>
          <div class="steam-eruption"></div>
          <div class="water-absorb"></div>
          <div class="dual-type-power"></div>
        </div>
      `,borderColor:"#e08060",glowColor:"#f09070",title:"蒸汽宝可梦",subtitle:"蒸汽喷发 • 水火双属",animationDuration:2200}:a.includes("索尔迦雷欧")?{bgGradient:"linear-gradient(180deg, #f0d060 0%, #f0e070 30%, #f0f080 70%, #f0ff90 100%)",animation:`
        <div class="solgaleo-scene">
          <div class="sun-core"></div>
          <div class="solar-flare flare-1"></div>
          <div class="solar-flare flare-2"></div>
          <div class="sunsteel-strike"></div>
          <div class="full-metal-body"></div>
          <div class="cosmic-lion"></div>
        </div>
      `,borderColor:"#f0f080",glowColor:"#ffff90",title:"日之传说",subtitle:"流星闪冲 • 全金属身体",animationDuration:2500}:a.includes("露奈雅拉")?{bgGradient:"linear-gradient(180deg, #1a0a3a 0%, #2a1a4a 30%, #3a2a5a 70%, #4a3a6a 100%)",animation:`
        <div class="lunala-scene">
          <div class="moon-core"></div>
          <div class="lunar-wing wing-1"></div>
          <div class="lunar-wing wing-2"></div>
          <div class="moongeist-beam"></div>
          <div class="shadow-shield"></div>
          <div class="cosmic-bat"></div>
        </div>
      `,borderColor:"#3a2a5a",glowColor:"#6a5a8a",title:"月之传说",subtitle:"暗影之光 • 幽灵之盾",animationDuration:2500}:a.includes("奈克洛兹玛")?{bgGradient:"linear-gradient(180deg, #0a0a0a 0%, #1a1a2a 30%, #2a2a4a 70%, #3a3a6a 100%)",animation:`
        <div class="necrozma-scene">
          <div class="prism-armor"></div>
          <div class="light-absorption absorb-1"></div>
          <div class="light-absorption absorb-2"></div>
          <div class="photon-geyser"></div>
          <div class="ultra-burst"></div>
          <div class="blinding-one"></div>
        </div>
      `,borderColor:"#2a2a4a",glowColor:"#5a5a7a",title:"光辉大神",subtitle:"光子喷涌 • 究极爆发",animationDuration:2800}:a.includes("卡璞")&&a.includes("鸣鸣")||i===e.TAPU_KOKO?{bgGradient:"linear-gradient(180deg, #f0d040 0%, #f0e050 30%, #f0f060 70%, #f0ff70 100%)",animation:`
        <div class="tapu-koko-scene">
          <div class="electric-surge"></div>
          <div class="guardian-aura"></div>
          <div class="shell-close"></div>
          <div class="natures-madness"></div>
        </div>
      `,borderColor:"#f0f060",glowColor:"#ffff70",title:"守护神",subtitle:"自然之怒 • 电气制造者",animationDuration:2e3}:a.includes("卡璞")&&a.includes("蝶蝶")||i===e.TAPU_LELE?{bgGradient:"linear-gradient(180deg, #ffa0c0 0%, #ffb0d0 30%, #ffc0e0 70%, #ffd0f0 100%)",animation:`
        <div class="tapu-lele-scene">
          <div class="psychic-surge"></div>
          <div class="guardian-aura"></div>
          <div class="shell-close"></div>
          <div class="natures-madness"></div>
        </div>
      `,borderColor:"#ffc0e0",glowColor:"#ffd0f0",title:"守护神",subtitle:"自然之怒 • 精神制造者",animationDuration:2e3}:a.includes("卡璞")&&a.includes("哞哞")||i===e.TAPU_BULU?{bgGradient:"linear-gradient(180deg, #c06040 0%, #d07050 30%, #e08060 70%, #f09070 100%)",animation:`
        <div class="tapu-bulu-scene">
          <div class="grassy-surge"></div>
          <div class="guardian-aura"></div>
          <div class="shell-close"></div>
          <div class="natures-madness"></div>
        </div>
      `,borderColor:"#e08060",glowColor:"#f09070",title:"守护神",subtitle:"自然之怒 • 青草制造者",animationDuration:2e3}:a.includes("卡璞")&&a.includes("鳍鳍")||i===e.TAPU_FINI?{bgGradient:"linear-gradient(180deg, #a060c0 0%, #b070d0 30%, #c080e0 70%, #d090f0 100%)",animation:`
        <div class="tapu-fini-scene">
          <div class="misty-surge"></div>
          <div class="guardian-aura"></div>
          <div class="shell-close"></div>
          <div class="natures-madness"></div>
        </div>
      `,borderColor:"#c080e0",glowColor:"#d090f0",title:"守护神",subtitle:"自然之怒 • 薄雾制造者",animationDuration:2e3}:a.includes("玛机雅娜")?{bgGradient:"linear-gradient(180deg, #c0a0c0 0%, #d0b0d0 30%, #e0c0e0 70%, #f0d0f0 100%)",animation:`
        <div class="magearna-scene">
          <div class="soul-heart"></div>
          <div class="gear-mechanism gear-1"></div>
          <div class="gear-mechanism gear-2"></div>
          <div class="fleur-cannon"></div>
          <div class="original-color"></div>
        </div>
      `,borderColor:"#e0c0e0",glowColor:"#f0d0f0",title:"人造宝可梦",subtitle:"花朵加农炮 • 魂心",animationDuration:2200}:a.includes("玛夏多")?{bgGradient:"linear-gradient(180deg, #2a2a3a 0%, #3a3a4a 30%, #4a4a5a 70%, #5a5a6a 100%)",animation:`
        <div class="marshadow-scene">
          <div class="shadow-sneak"></div>
          <div class="spectral-thief"></div>
          <div class="soul-stealing-fist"></div>
          <div class="technician-aura"></div>
        </div>
      `,borderColor:"#4a4a5a",glowColor:"#7a7a8a",title:"影子宝可梦",subtitle:"灵魂盗取 • 魂断七星腿",animationDuration:2200}:a.includes("泽拉奥拉")?{bgGradient:"linear-gradient(180deg, #f0d040 0%, #f0e050 30%, #f0f060 70%, #f0ff70 100%)",animation:`
        <div class="zeraora-scene">
          <div class="plasma-fist"></div>
          <div class="volt-absorb"></div>
          <div class="lightning-speed speed-1"></div>
          <div class="lightning-speed speed-2"></div>
          <div class="electric-aura"></div>
        </div>
      `,borderColor:"#f0f060",glowColor:"#ffff70",title:"奔雷宝可梦",subtitle:"等离子闪电拳 • 蓄电",animationDuration:2200}:a.includes("美录坦")?{bgGradient:"linear-gradient(180deg, #a0a0a0 0%, #b0b0b0 30%, #c0c0c0 70%, #d0d0d0 100%)",animation:`
        <div class="meltan-scene">
          <div class="liquid-metal metal-1"></div>
          <div class="liquid-metal metal-2"></div>
          <div class="metal-drop drop-1"></div>
          <div class="metal-drop drop-2"></div>
          <div class="magnet-pull"></div>
        </div>
      `,borderColor:"#c0c0c0",glowColor:"#e0e0e0",title:"螺帽宝可梦",subtitle:"液态金属 • 磁力吸引",animationDuration:2e3}:a.includes("美录梅塔")?{bgGradient:"linear-gradient(180deg, #606060 0%, #707070 30%, #808080 70%, #909090 100%)",animation:`
        <div class="melmetal-scene">
          <div class="double-iron-bash"></div>
          <div class="giant-metal-body"></div>
          <div class="iron-fist-power"></div>
          <div class="gmax-meltdown"></div>
        </div>
      `,borderColor:"#808080",glowColor:"#a0a0a0",title:"钢铁巨神",subtitle:"双铁双拳 • 铁拳特性",animationDuration:2500}:a.includes("龙卷云")?{bgGradient:"linear-gradient(180deg, #60c060 0%, #70d070 30%, #80e080 70%, #90f090 100%)",animation:`
        <div class="tornadus-scene">
          <div class="tornado tornado-1"></div>
          <div class="tornado tornado-2"></div>
          <div class="wind-blast blast-1"></div>
          <div class="wind-blast blast-2"></div>
          <div class="hurricane-force"></div>
          <div class="prankster-aura"></div>
          <div class="therian-forme"></div>
        </div>
      `,borderColor:"#80e080",glowColor:"#90f090",title:"暴风之神",subtitle:"暴风 • 恶作剧之心",animationDuration:2200}:a.includes("雷电云")?{bgGradient:"linear-gradient(180deg, #6060c0 0%, #7070d0 30%, #8080e0 70%, #9090f0 100%)",animation:`
        <div class="thundurus-scene">
          <div class="thunder-bolt bolt-1"></div>
          <div class="thunder-bolt bolt-2"></div>
          <div class="electric-storm storm-1"></div>
          <div class="electric-storm storm-2"></div>
          <div class="wild-charge"></div>
          <div class="prankster-aura"></div>
          <div class="therian-forme"></div>
        </div>
      `,borderColor:"#8080e0",glowColor:"#9090f0",title:"雷霆之神",subtitle:"雷电 • 恶作剧之心",animationDuration:2200}:a.includes("土地云")?{bgGradient:"linear-gradient(180deg, #c08040 0%, #d09050 30%, #e0a060 70%, #f0b070 100%)",animation:`
        <div class="landorus-scene">
          <div class="earth-power power-1"></div>
          <div class="earth-power power-2"></div>
          <div class="ground-quake quake-1"></div>
          <div class="ground-quake quake-2"></div>
          <div class="sandsear-storm"></div>
          <div class="intimidate-aura"></div>
          <div class="therian-forme"></div>
        </div>
      `,borderColor:"#e0a060",glowColor:"#f0b070",title:"大地之神",subtitle:"大地神力 • 威吓",animationDuration:2200}:a.includes("苍响")?{bgGradient:"linear-gradient(180deg, #4080d0 0%, #5090e0 30%, #60a0f0 70%, #70b0ff 100%)",animation:`
        <div class="zacian-scene">
          <div class="sacred-sword-glow"></div>
          <div class="behemoth-blade"></div>
          <div class="crowned-sword"></div>
          <div class="intrepid-slash"></div>
          <div class="hero-aura aura-1"></div>
          <div class="hero-aura aura-2"></div>
          <div class="fairy-steel-shine"></div>
        </div>
      `,borderColor:"#60a0f0",glowColor:"#70b0ff",title:"剑之英雄",subtitle:"巨兽斩 • 不挠之剑",animationDuration:2500}:a.includes("藏玛然特")?{bgGradient:"linear-gradient(180deg, #d04040 0%, #e05050 30%, #f06060 70%, #ff7070 100%)",animation:`
        <div class="zamazenta-scene">
          <div class="sacred-shield-glow"></div>
          <div class="behemoth-bash"></div>
          <div class="crowned-shield"></div>
          <div class="defensive-stance"></div>
          <div class="hero-aura aura-1"></div>
          <div class="hero-aura aura-2"></div>
          <div class="fighting-steel-shine"></div>
        </div>
      `,borderColor:"#f06060",glowColor:"#ff7070",title:"盾之英雄",subtitle:"巨兽弹 • 不屈之盾",animationDuration:2500}:a.includes("无极汰那")?{bgGradient:"linear-gradient(180deg, #6020a0 0%, #7030b0 30%, #8040c0 70%, #9050d0 100%)",animation:`
        <div class="eternatus-scene">
          <div class="dynamax-cannon"></div>
          <div class="eternabeam"></div>
          <div class="infinity-energy energy-1"></div>
          <div class="infinity-energy energy-2"></div>
          <div class="poison-core"></div>
          <div class="eternamax-form"></div>
          <div class="wishing-star star-1"></div>
          <div class="wishing-star star-2"></div>
        </div>
      `,borderColor:"#8040c0",glowColor:"#9050d0",title:"巨兽宝可梦",subtitle:"无极光束 • 极巨化之力",animationDuration:2800}:a.includes("萨戮德")?{bgGradient:"linear-gradient(180deg, #c0c0e0 0%, #d0d0f0 30%, #e0e0ff 70%, #f0f0ff 100%)",animation:`
        <div class="calyrex-scene">
          <div class="psychic-crown"></div>
          <div class="king-aura"></div>
          <div class="glacial-lance"></div>
          <div class="astral-barrage"></div>
          <div class="ice-rider"></div>
          <div class="shadow-rider"></div>
          <div class="unnerve-field"></div>
        </div>
      `,borderColor:"#e0e0ff",glowColor:"#f0f0ff",title:"冰山之王",subtitle:"冰雪长矛 • 紧张感",animationDuration:2500}:a.includes("雪暴马")||i===e.GLASTRIER?{bgGradient:"linear-gradient(180deg, #c0e0f0 0%, #d0f0ff 30%, #e0f0ff 70%, #f0f0ff 100%)",animation:`
        <div class="glastrier-scene">
          <div class="ice-hooves hooves-1"></div>
          <div class="ice-hooves hooves-2"></div>
          <div class="glacial-lance"></div>
          <div class="frost-breath"></div>
          <div class="chilling-neigh"></div>
        </div>
      `,borderColor:"#e0f0ff",glowColor:"#f0f0ff",title:"冰马宝可梦",subtitle:"冰雪长矛 • 苍白嘶鸣",animationDuration:2200}:a.includes("灵幽马")||i===e.SPECTRIER?{bgGradient:"linear-gradient(180deg, #3a2a4a 0%, #4a3a5a 30%, #5a4a6a 70%, #6a5a7a 100%)",animation:`
        <div class="spectrier-scene">
          <div class="shadow-hooves hooves-1"></div>
          <div class="shadow-hooves hooves-2"></div>
          <div class="astral-barrage"></div>
          <div class="phantom-force"></div>
          <div class="grim-neigh"></div>
        </div>
      `,borderColor:"#5a4a6a",glowColor:"#7a6a8a",title:"幽灵马宝可梦",subtitle:"星碎之击 • 漆黑嘶鸣",animationDuration:2200}:a.includes("武道熊师")||i===e.URSHIFU?{bgGradient:"linear-gradient(180deg, #606060 0%, #707070 30%, #808080 70%, #909090 100%)",animation:`
        <div class="urshifu-scene">
          <div class="wicked-blow"></div>
          <div class="surging-strikes"></div>
          <div class="unseen-fist"></div>
          <div class="gmax-one-blow"></div>
          <div class="gmax-rapid-flow"></div>
          <div class="fighting-spirit"></div>
        </div>
      `,borderColor:"#808080",glowColor:"#a0a0a0",title:"拳法宝可梦",subtitle:"暗冥强击 • 看穿拳",animationDuration:2200}:a.includes("萨戮德")||i===e.KUBFU?{bgGradient:"linear-gradient(180deg, #a08060 0%, #b09070 30%, #c0a080 70%, #d0b090 100%)",animation:`
        <div class="kubfu-scene">
          <div class="training-aura"></div>
          <div class="martial-arts"></div>
          <div class="focus-energy"></div>
          <div class="inner-focus"></div>
        </div>
      `,borderColor:"#c0a080",glowColor:"#d0b090",title:"拳法学徒",subtitle:"武道修行 • 精神力",animationDuration:2e3}:a.includes("雷吉艾勒奇")||i===e.REGIELEKI?{bgGradient:"linear-gradient(180deg, #f0f040 0%, #f0f050 30%, #f0f060 70%, #f0f070 100%)",animation:`
        <div class="regieleki-scene">
          <div class="electron-sphere sphere-1"></div>
          <div class="electron-sphere sphere-2"></div>
          <div class="thunder-cage"></div>
          <div class="electric-surge"></div>
          <div class="transistor-boost"></div>
        </div>
      `,borderColor:"#f0f060",glowColor:"#ffff70",title:"电子宝可梦",subtitle:"电气笼罩 • 晶体管",animationDuration:2200}:a.includes("雷吉铎拉戈")||i===e.REGIDRAGO?{bgGradient:"linear-gradient(180deg, #60c040 0%, #70d050 30%, #80e060 70%, #90f070 100%)",animation:`
        <div class="regidrago-scene">
          <div class="dragon-orb"></div>
          <div class="dragon-energy energy-1"></div>
          <div class="dragon-energy energy-2"></div>
          <div class="dragon-energy energy-3"></div>
          <div class="dragons-maw"></div>
        </div>
      `,borderColor:"#80e060",glowColor:"#90f070",title:"龙玉宝可梦",subtitle:"龙之颚 • 龙之力",animationDuration:2200}:a.includes("扎鲁德")||i===e.ZARUDE?{bgGradient:"linear-gradient(180deg, #408040 0%, #509050 30%, #60a060 70%, #70b070 100%)",animation:`
        <div class="zarude-scene">
          <div class="vine-whip whip-1"></div>
          <div class="vine-whip whip-2"></div>
          <div class="jungle-healing"></div>
          <div class="leaf-blade"></div>
          <div class="dark-aura"></div>
        </div>
      `,borderColor:"#60a060",glowColor:"#70b070",title:"恶猿宝可梦",subtitle:"丛林治疗 • 叶刃",animationDuration:2200}:a.includes("故勒顿")?{bgGradient:"linear-gradient(180deg, #d04040 0%, #e05050 30%, #f06060 70%, #ff7070 100%)",animation:`
        <div class="koraidon-scene">
          <div class="ancient-engine"></div>
          <div class="collision-course"></div>
          <div class="titan-wings wing-1"></div>
          <div class="titan-wings wing-2"></div>
          <div class="primal-power"></div>
          <div class="orichalcum-pulse"></div>
        </div>
      `,borderColor:"#f06060",glowColor:"#ff7070",title:"古代悖谬",subtitle:"冲撞航线 • 绯红脉冲",animationDuration:2500}:a.includes("眷恋云")||i===e.ENAMORUS?{bgGradient:"linear-gradient(180deg, #f0a0c0 0%, #f0b0d0 30%, #f0c0e0 70%, #f0d0f0 100%)",animation:`
        <div class="enamorus-scene">
          <div class="love-aura aura-1"></div>
          <div class="love-aura aura-2"></div>
          <div class="springtide-storm"></div>
          <div class="fairy-wind wind-1"></div>
          <div class="fairy-wind wind-2"></div>
          <div class="cute-charm"></div>
          <div class="therian-forme"></div>
        </div>
      `,borderColor:"#f0c0e0",glowColor:"#f0d0f0",title:"眷恋之神",subtitle:"春潮风暴 • 迷人之躯",animationDuration:2200}:a.includes("古简蜗")||i===e.WO_CHIEN?{bgGradient:"linear-gradient(180deg, #406040 0%, #507050 30%, #608060 70%, #709070 100%)",animation:`
        <div class="wo-chien-scene">
          <div class="tablet-curse"></div>
          <div class="dark-grass-aura"></div>
          <div class="ruinous-vessel"></div>
          <div class="giga-drain"></div>
        </div>
      `,borderColor:"#608060",glowColor:"#709070",title:"灾兽・蜗",subtitle:"灾祸之器 • 竹简诅咒",animationDuration:2200}:a.includes("古剑豹")||i===e.CHIEN_PAO?{bgGradient:"linear-gradient(180deg, #c0e0f0 0%, #d0f0ff 30%, #e0f0ff 70%, #f0f0ff 100%)",animation:`
        <div class="chien-pao-scene">
          <div class="sword-curse"></div>
          <div class="dark-ice-aura"></div>
          <div class="ruinous-sword"></div>
          <div class="ice-spinner"></div>
        </div>
      `,borderColor:"#e0f0ff",glowColor:"#f0f0ff",title:"灾兽・豹",subtitle:"灾祸之剑 • 宝剑诅咒",animationDuration:2200}:a.includes("古鼎鹿")||i===e.TING_LU?{bgGradient:"linear-gradient(180deg, #806040 0%, #907050 30%, #a08060 70%, #b09070 100%)",animation:`
        <div class="ting-lu-scene">
          <div class="vessel-curse"></div>
          <div class="dark-ground-aura"></div>
          <div class="ruinous-vessel"></div>
          <div class="earthquake"></div>
        </div>
      `,borderColor:"#a08060",glowColor:"#b09070",title:"灾兽・鹿",subtitle:"灾祸之器 • 玉鼎诅咒",animationDuration:2200}:a.includes("古玉鱼")||i===e.CHI_YU?{bgGradient:"linear-gradient(180deg, #c04040 0%, #d05050 30%, #e06060 70%, #f07070 100%)",animation:`
        <div class="chi-yu-scene">
          <div class="bead-curse"></div>
          <div class="dark-fire-aura"></div>
          <div class="ruinous-beads"></div>
          <div class="lava-plume"></div>
        </div>
      `,borderColor:"#e06060",glowColor:"#f07070",title:"灾兽・鱼",subtitle:"灾祸之珠 • 宝珠诅咒",animationDuration:2200}:a.includes("斯魔罗哥")||i===e.GIMMIGHOUL?{bgGradient:"linear-gradient(180deg, #c0a060 0%, #d0b070 30%, #e0c080 70%, #f0d090 100%)",animation:`
        <div class="gimmighoul-scene">
          <div class="coin-treasure coin-1"></div>
          <div class="coin-treasure coin-2"></div>
          <div class="coin-treasure coin-3"></div>
          <div class="ghost-gold"></div>
        </div>
      `,borderColor:"#e0c080",glowColor:"#f0d090",title:"宝藏宝可梦",subtitle:"金币收集 • 幽灵守护",animationDuration:2e3}:a.includes("赛富豪")||i===e.GHOLDENGO?{bgGradient:"linear-gradient(180deg, #f0d060 0%, #f0e070 30%, #f0f080 70%, #f0ff90 100%)",animation:`
        <div class="gholdengo-scene">
          <div class="golden-body"></div>
          <div class="coin-shower coin-1"></div>
          <div class="coin-shower coin-2"></div>
          <div class="coin-shower coin-3"></div>
          <div class="make-it-rain"></div>
          <div class="good-as-gold"></div>
        </div>
      `,borderColor:"#f0f080",glowColor:"#ffff90",title:"黄金宝可梦",subtitle:"黄金爆击 • 黄金之躯",animationDuration:2200}:a.includes("桃歹郎")||i===e.PECHARUNT?{bgGradient:"linear-gradient(180deg, #8040a0 0%, #9050b0 30%, #a060c0 70%, #b070d0 100%)",animation:`
        <div class="pecharunt-scene">
          <div class="toxic-chain"></div>
          <div class="poison-puppet"></div>
          <div class="malignant-chain"></div>
          <div class="shadow-shell"></div>
        </div>
      `,borderColor:"#a060c0",glowColor:"#b070d0",title:"幻之宝可梦",subtitle:"邪毒锁链 • 毒傀儡",animationDuration:2200}:{bgGradient:"linear-gradient(180deg, #4a5568 0%, #2d3748 100%)",animation:'<div class="default-scene"></div>',borderColor:"#667eea",glowColor:"#764ba2",title:"传说宝可梦",subtitle:"强大的存在",animationDuration:2e3}}
