/**
 * PKRC · F-10 自动化走查环境 · PNG 解码 + 像素 diff（零依赖）
 * ---------------------------------------------------------------------------
 * 为什么要自己解码：O-9b 的判据②是「截图像素 diff（差异率 + 差异热区）」。
 * 项目无包管理器，故用 Node 内置 `zlib` 手写 PNG 解码（PNG = zlib(IDAT) + 逐行过滤）。
 *
 * 覆盖范围：8/16 位、色彩类型 0/2/3/4/6（灰度/RGB/调色板/灰度+A/RGBA）。
 * CDP 的 Page.captureScreenshot 产出 8 位 RGBA 或 RGB，必在覆盖内。
 */

import zlib from "node:zlib";

const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/**
 * 解码 PNG → { width, height, data: Uint8ClampedArray(RGBA) }
 * @param {Buffer} buf
 */
export function decodePng(buf) {
  if (!buf.subarray(0, 8).equals(PNG_SIG)) {
    throw new Error("不是合法 PNG（签名不符）");
  }
  let offset = 8;
  let ihdr = null;
  const idat = [];
  let palette = null;
  let trns = null;

  while (offset < buf.length) {
    const length = buf.readUInt32BE(offset);
    const type = buf.toString("ascii", offset + 4, offset + 8);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;

    if (type === "IHDR") {
      ihdr = {
        width: buf.readUInt32BE(dataStart),
        height: buf.readUInt32BE(dataStart + 4),
        bitDepth: buf[dataStart + 8],
        colorType: buf[dataStart + 9],
        compression: buf[dataStart + 10],
        filter: buf[dataStart + 11],
        interlace: buf[dataStart + 12],
      };
    } else if (type === "PLTE") {
      palette = buf.subarray(dataStart, dataEnd);
    } else if (type === "tRNS") {
      trns = buf.subarray(dataStart, dataEnd);
    } else if (type === "IDAT") {
      idat.push(buf.subarray(dataStart, dataEnd));
    } else if (type === "IEND") {
      break;
    }

    offset = dataEnd + 4; // 跳过 length 后的 4 字节 CRC
  }

  if (!ihdr) throw new Error("PNG 缺少 IHDR");
  if (ihdr.interlace !== 0) throw new Error("不支持隔行扫描（interlaced）PNG");

  const channelsFor = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };
  const channels = channelsFor[ihdr.colorType];
  if (channels === undefined) throw new Error(`不支持的色彩类型 ${ihdr.colorType}`);

  const raw = zlib.inflateSync(Buffer.concat(idat));
  const bitDepth = ihdr.bitDepth;
  const bitsPerPixel = channels * bitDepth;
  const bpp = Math.ceil(bitsPerPixel / 8);
  // 每行字节数（含 1 字节过滤类型），按位深对齐到字节
  const rowBytes = Math.ceil((ihdr.width * bitsPerPixel) / 8);

  const unfiltered = unfilter(raw, ihdr.height, rowBytes, bpp);

  // 转 RGBA8
  const out = new Uint8ClampedArray(ihdr.width * ihdr.height * 4);
  const needs16to8 = bitDepth === 16;
  const bytesPerSample = bitDepth / 8;

  for (let y = 0; y < ihdr.height; y++) {
    const rowStart = y * rowBytes;
    for (let x = 0; x < ihdr.width; x++) {
      const o = (y * ihdr.width + x) * 4;
      let r, g, b, a = 255;

      if (ihdr.colorType === 3) {
        // 调色板
        const idx = bitDepth === 8 ? unfiltered[rowStart + x] : readBits(unfiltered, rowStart, x, bitDepth);
        if (!palette || idx * 3 + 2 >= palette.length) throw new Error("PLTE 索引越界");
        r = palette[idx * 3];
        g = palette[idx * 3 + 1];
        b = palette[idx * 3 + 2];
        if (trns && idx < trns.length) a = trns[idx];
      } else if (ihdr.colorType === 0 || ihdr.colorType === 4) {
        const s = sample(unfiltered, rowStart, x, channels, bytesPerSample, needs16to8, 0);
        r = g = b = s;
        if (ihdr.colorType === 4) a = sample(unfiltered, rowStart, x, channels, bytesPerSample, needs16to8, 1);
      } else {
        r = sample(unfiltered, rowStart, x, channels, bytesPerSample, needs16to8, 0);
        g = sample(unfiltered, rowStart, x, channels, bytesPerSample, needs16to8, 1);
        b = sample(unfiltered, rowStart, x, channels, bytesPerSample, needs16to8, 2);
        if (ihdr.colorType === 6) a = sample(unfiltered, rowStart, x, channels, bytesPerSample, needs16to8, 3);
      }

      out[o] = r;
      out[o + 1] = g;
      out[o + 2] = b;
      out[o + 3] = a;
    }
  }

  return { width: ihdr.width, height: ihdr.height, data: out };
}

function sample(row, rowStart, x, channels, bytesPerSample, needs16to8, channelIdx) {
  const byteIdx = rowStart + (x * channels + channelIdx) * bytesPerSample;
  if (bytesPerSample === 1) return row[byteIdx];
  // 16 位 → 取高字节（等价 >>8）
  return needs16to8 ? row[byteIdx] : row[byteIdx];
}

function readBits(row, rowStart, x, bitDepth) {
  const bitPos = x * bitDepth;
  const byteIdx = rowStart + (bitPos >> 3);
  const shift = 8 - bitDepth - (bitPos & 7);
  return (row[byteIdx] >> shift) & ((1 << bitDepth) - 1);
}

/** 逐行反过滤 */
function unfilter(raw, height, rowBytes, bpp) {
  const out = new Uint8Array(height * rowBytes);
  let pos = 0;
  for (let y = 0; y < height; y++) {
    const filterType = raw[pos++];
    const rowStart = y * rowBytes;
    const prevStart = (y - 1) * rowBytes;
    for (let i = 0; i < rowBytes; i++) {
      const x = raw[pos++];
      const a = i >= bpp ? out[rowStart + i - bpp] : 0;
      const b = y > 0 ? out[prevStart + i] : 0;
      const c = y > 0 && i >= bpp ? out[prevStart + i - bpp] : 0;
      let recon;
      switch (filterType) {
        case 0:
          recon = x;
          break;
        case 1:
          recon = x + a;
          break;
        case 2:
          recon = x + b;
          break;
        case 3:
          recon = x + ((a + b) >> 1);
          break;
        case 4:
          recon = x + paeth(a, b, c);
          break;
        default:
          throw new Error(`未知 PNG 过滤类型 ${filterType}`);
      }
      out[rowStart + i] = recon & 0xff;
    }
  }
  return out;
}

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

/**
 * 两张 PNG 的像素差异。
 *
 * @param {Buffer} bufA
 * @param {Buffer} bufB
 * @param {object} [opts]
 * @param {number} [opts.threshold] 单通道差异阈值（0-255），低于此视为「渲染噪声」，默认 12
 * @param {number} [opts.gridSize]  热区网格边长（px），默认 40
 * @returns {{
 *   width:number, height:number, sameSize:boolean,
 *   diffPixels:number, totalPixels:number, diffRatio:number,
 *   meanAbsDiff:number, hotGrid:Array<{x:number,y:number,ratio:number}>,
 *   bbox:{x:number,y:number,w:number,h:number}|null
 * }}
 */
export function diffPng(bufA, bufB, opts = {}) {
  const threshold = opts.threshold ?? 12;
  const gridSize = opts.gridSize ?? 40;
  const a = decodePng(bufA);
  const b = decodePng(bufB);

  // 尺寸不同 ⇒ 以最小公共区域比较，并标记 sameSize=false
  const width = Math.min(a.width, b.width);
  const height = Math.min(a.height, b.height);
  const sameSize = a.width === b.width && a.height === b.height;

  let diffPixels = 0;
  let sumAbs = 0;
  const cols = Math.ceil(width / gridSize);
  const rows = Math.ceil(height / gridSize);
  const gridCount = new Float64Array(cols * rows);
  const gridTotal = new Float64Array(cols * rows);
  let bx0 = Infinity, by0 = Infinity, bx1 = -Infinity, by1 = -Infinity;

  for (let y = 0; y < height; y++) {
    const gy = (y / gridSize) | 0;
    for (let x = 0; x < width; x++) {
      const oa = (y * a.width + x) * 4;
      const ob = (y * b.width + x) * 4;
      const dr = Math.abs(a.data[oa] - b.data[ob]);
      const dg = Math.abs(a.data[oa + 1] - b.data[ob + 1]);
      const db2 = Math.abs(a.data[oa + 2] - b.data[ob + 2]);
      const da = Math.abs(a.data[oa + 3] - b.data[ob + 3]);
      const d = dr + dg + db2 + da;
      sumAbs += d;
      const gidx = gy * cols + ((x / gridSize) | 0);
      gridTotal[gidx]++;
      if (Math.max(dr, dg, db2, da) > threshold) {
        diffPixels++;
        gridCount[gidx]++;
        if (x < bx0) bx0 = x;
        if (y < by0) by0 = y;
        if (x > bx1) bx1 = x;
        if (y > by1) by1 = y;
      }
    }
  }

  const hotGrid = [];
  for (let gy = 0; gy < rows; gy++) {
    for (let gx = 0; gx < cols; gx++) {
      const idx = gy * cols + gx;
      if (gridTotal[idx] === 0) continue;
      const ratio = gridCount[idx] / gridTotal[idx];
      if (ratio > 0.02) hotGrid.push({ x: gx * gridSize, y: gy * gridSize, ratio: +ratio.toFixed(4) });
    }
  }
  hotGrid.sort((p, q) => q.ratio - p.ratio);

  const totalPixels = width * height;
  return {
    width,
    height,
    sameSize,
    sizeA: [a.width, a.height],
    sizeB: [b.width, b.height],
    diffPixels,
    totalPixels,
    diffRatio: totalPixels ? diffPixels / totalPixels : 0,
    meanAbsDiff: totalPixels ? sumAbs / (totalPixels * 4) : 0,
    hotGrid: hotGrid.slice(0, 40),
    bbox: diffPixels ? { x: bx0, y: by0, w: bx1 - bx0 + 1, h: by1 - by0 + 1 } : null,
  };
}

/** 生成并排对比图的 PNG（左 A / 右 B / 中间 2px 红色分隔） */
export function sideBySide(bufA, bufB) {
  const a = decodePng(bufA);
  const b = decodePng(bufB);
  const gap = 2;
  const width = a.width + gap + b.width;
  const height = Math.max(a.height, b.height);
  const out = encodePng(width, height, (x, y) => {
    if (x < a.width) {
      const o = (y * a.width + x) * 4;
      if (y < a.height) return [a.data[o], a.data[o + 1], a.data[o + 2], 255];
      return [0, 0, 0, 255];
    }
    if (x < a.width + gap) return [255, 0, 0, 255];
    const bx = x - a.width - gap;
    const o = (y * b.width + bx) * 4;
    if (y < b.height) return [b.data[o], b.data[o + 1], b.data[o + 2], 255];
    return [0, 0, 0, 255];
  });
  return out;
}

/**
 * 极简 PNG 编码器（仅 8 位 RGBA，filter 0）——用于产出并排图。
 * @param {number} width
 * @param {number} height
 * @param {(x:number,y:number)=>[number,number,number,number]} pixelFn
 */
export function encodePng(width, height, pixelFn) {
  const rowBytes = width * 4;
  const raw = Buffer.alloc((rowBytes + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (rowBytes + 1)] = 0; // filter type 0
    const rowStart = y * (rowBytes + 1) + 1;
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixelFn(x, y);
      const o = rowStart + x * 4;
      raw[o] = r;
      raw[o + 1] = g;
      raw[o + 2] = b;
      raw[o + 3] = a;
    }
  }
  const idat = zlib.deflateSync(raw, { level: 6 });

  const chunks = [PNG_SIG];
  chunks.push(makeChunk("IHDR", ihdrData(width, height)));
  chunks.push(makeChunk("IDAT", idat));
  chunks.push(makeChunk("IEND", Buffer.alloc(0)));
  return Buffer.concat(chunks);
}

function ihdrData(width, height) {
  const b = Buffer.alloc(13);
  b.writeUInt32BE(width, 0);
  b.writeUInt32BE(height, 4);
  b[8] = 8; // bit depth
  b[9] = 6; // color type RGBA
  b[10] = 0;
  b[11] = 0;
  b[12] = 0;
  return b;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])) >>> 0, 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
