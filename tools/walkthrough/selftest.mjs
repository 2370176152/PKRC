/**
 * PKRC · F-10 · 自检（零依赖、可复跑）
 * 覆盖：PNG 编解码往返、像素 diff 正确性、input-arbiter 复用、产物叠加解析。
 * 运行：node tools/walkthrough/selftest.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { decodePng, diffPng, encodePng, sideBySide } from "./lib/png.mjs";
import { InputArbiter, DEVICE } from "../input-layer/input-arbiter.js";
import { PRODUCTS, resolveProductRoots } from "./lib/products.mjs";

let pass = 0;
let fail = 0;
function ok(cond, msg) {
  if (cond) {
    pass++;
    console.log(`  ✓ ${msg}`);
  } else {
    fail++;
    console.log(`  ✗ ${msg}`);
  }
}

console.log("[1] PNG 编解码往返");
{
  const W = 64, H = 32;
  const png = encodePng(W, H, (x, y) => [x % 256, (y * 3) % 256, 128, 255]);
  const dec = decodePng(png);
  ok(dec.width === W && dec.height === H, `尺寸往返 ${dec.width}x${dec.height}`);
  let pixelsOk = true;
  for (const [x, y] of [[0, 0], [10, 5], [63, 31], [32, 16]]) {
    const o = (y * W + x) * 4;
    if (dec.data[o] !== x % 256 || dec.data[o + 1] !== (y * 3) % 256 || dec.data[o + 2] !== 128) pixelsOk = false;
  }
  ok(pixelsOk, "采样点像素往返一致");
}

console.log("[2] 像素 diff：已知差异区域");
{
  const W = 100, H = 100;
  const base = decodePng(encodePng(W, H, () => [0, 0, 0, 255]));
  // B 版在 [10..29]x[10..29] 画白块（20x20 = 400 px）
  const bPng = encodePng(W, H, (x, y) => (x >= 10 && x < 30 && y >= 10 && y < 30 ? [255, 255, 255, 255] : [0, 0, 0, 255]));
  const aPng = encodePng(W, H, () => [0, 0, 0, 255]);
  const d = diffPng(aPng, bPng, { threshold: 12, gridSize: 20 });
  ok(d.diffPixels === 400, `差异像素 = ${d.diffPixels}（预期 400）`);
  ok(Math.abs(d.diffRatio - 0.04) < 1e-9, `差异率 = ${d.diffRatio}（预期 0.04）`);
  ok(d.bbox && d.bbox.x === 10 && d.bbox.y === 10 && d.bbox.w === 20 && d.bbox.h === 20, `包围盒 ${JSON.stringify(d.bbox)}`);
  ok(base.width === 100, "基准解码正常");
}
{
  const aPng = encodePng(50, 50, () => [10, 10, 10, 255]);
  const bPng = encodePng(50, 50, () => [14, 10, 10, 255]); // 差 4 < 阈值 12
  const d = diffPng(aPng, bPng, { threshold: 12 });
  ok(d.diffPixels === 0, "低于阈值的差异被当作渲染噪声（diffPixels=0）");
}

console.log("[3] 并排图生成");
{
  const a = encodePng(30, 20, () => [255, 0, 0, 255]);
  const b = encodePng(30, 20, () => [0, 255, 0, 255]);
  const sbs = sideBySide(a, b);
  const d = decodePng(sbs);
  ok(d.width === 62 && d.height === 20, `并排尺寸 ${d.width}x${d.height}（预期 62x20）`);
  ok(d.data[0] === 255 && d.data[1] === 0, "左半为 A（红）");
  const rx = (30 + 1) * 4;
  ok(d.data[rx] === 255 && d.data[rx + 1] === 0, "中间分隔为红");
}

console.log("[4] 复用 F-6 input-arbiter 语义");
{
  const arb = new InputArbiter(undefined, { enabled: true });
  const r1 = arb.submit({ device: DEVICE.KEYBOARD, frameId: 1, at: 1000 });
  ok(r1.accept === true, "键盘首帧放行");
  const r2 = arb.submit({ device: DEVICE.KEYBOARD, frameId: 1, at: 1001 });
  ok(r2.accept === false && r2.reason === "frame-dup", "同帧同键去重生效（frame-dup）");
  // 切鼠标：默认冷却 120ms ⇒ 立刻切应被拒
  const r3 = arb.submit({ device: DEVICE.MOUSE, frameId: 2, at: 1010 });
  ok(r3.accept === false && r3.reason === "switch-cooldown", "键→鼠切换冷却生效（switch-cooldown）");
  const r4 = arb.submit({ device: DEVICE.MOUSE, frameId: 3, at: 2000 });
  ok(r4.accept === true, "超过冷却窗口后放行");
  ok(arb.snapshot().lastDevice === "mouse", "lastDevice 更新为 mouse");
}

console.log("[5] 双产物叠加根解析");
{
  const rootsB = resolveProductRoots("B");
  ok(rootsB.length >= 1 && rootsB[0].endsWith(path.join("game", "server", "dist")), `B 主根 = ${rootsB[0]}`);
  const rootsA = resolveProductRoots("A");
  ok(rootsA.length === 2, "A 为叠加根（自身 + B 资源层），实际 " + rootsA.length);
  ok(PRODUCTS.A.id === "A" && PRODUCTS.B.id === "B", "产物定义齐备");
}

console.log("[6] 真实证据截图对比（若存在）");
{
  const dir = path.resolve("tools/walkthrough/evidence/boot-A-B");
  const pa = path.join(dir, "A", "00-boot.png");
  const pb = path.join(dir, "B", "00-boot.png");
  if (fs.existsSync(pa) && fs.existsSync(pb)) {
    const d = diffPng(fs.readFileSync(pa), fs.readFileSync(pb), { threshold: 12 });
    ok(d.diffPixels > 0, `A/B 启动画面存在差异：${(d.diffRatio * 100).toFixed(1)}% 像素不同`);
    console.log(`     A 尺寸 ${d.sizeA.join("x")} · B 尺寸 ${d.sizeB.join("x")} · 热区 ${d.hotGrid.length} 块`);
  } else {
    console.log("  - 尚无可比证据（先跑 `node tools/walkthrough/cli.mjs --scenario boot --product both`），跳过");
  }
}

console.log(`\n${"─".repeat(50)}\n自检：通过 ${pass} 项 / 失败 ${fail} 项\n${"─".repeat(50)}`);
process.exitCode = fail ? 1 : 0;
