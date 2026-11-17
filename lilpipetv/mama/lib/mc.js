// Minecraft-look renderer for LilPipeTv shorts. It draws with the real game
// textures the user downloaded from their own copy (assets/mc, kept out of git):
// block materials with biome tint, the player model with 64x64 skin UVs, skins
// painted from each character's design, and the bitmap game font.
import * as THREE from "./three.module.js";
import { FONTMAP } from "./fontmap.js";

export { THREE };

const loader = new THREE.TextureLoader();
export function loadTex(path) {
  return new Promise((resolve, reject) =>
    loader.load(
      path,
      (t) => {
        t.magFilter = THREE.NearestFilter;
        t.minFilter = THREE.NearestFilter;
        t.colorSpace = THREE.SRGBColorSpace;
        resolve(t);
      },
      undefined,
      reject,
    ),
  );
}
export function loadImg(path) {
  return new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = path;
  });
}

// ---------- blocks ----------
const GRASS_TINT = "#91bd59"; // plains biome
const FOLIAGE_TINT = "#77ab2f";
export async function blockMaterials(dir) {
  const names = [
    "grass_block_top",
    "grass_block_side",
    "dirt",
    "stone",
    "cobblestone",
    "oak_log",
    "oak_log_top",
    "oak_leaves",
    "oak_planks",
    "diamond_block",
    "lava_still",
  ];
  const t = {};
  await Promise.all(names.map(async (n) => (t[n] = await loadTex(`${dir}/${n}.png`))));
  const L = (map, extra = {}) => new THREE.MeshLambertMaterial({ map, ...extra });
  const grassTop = L(t.grass_block_top, { color: GRASS_TINT });
  const side = L(t.grass_block_side);
  const dirt = L(t.dirt);
  const logSide = L(t.oak_log),
    logTop = L(t.oak_log_top);
  t.lava_still.repeat.set(1, 1 / 20);
  return {
    tex: t,
    grass: [side, side, grassTop, dirt, side, side],
    dirt,
    stone: L(t.stone),
    cobble: L(t.cobblestone),
    planks: L(t.oak_planks),
    diamond: L(t.diamond_block),
    log: [logSide, logSide, logTop, logTop, logSide, logSide],
    leaves: L(t.oak_leaves, {
      color: FOLIAGE_TINT,
      transparent: true,
      alphaTest: 0.5,
      side: THREE.DoubleSide,
    }),
    lava: new THREE.MeshBasicMaterial({ map: t.lava_still }),
    grassTop,
  };
}
// Lava is a 20-frame vertical strip, two game ticks per frame.
export function lavaFrame(tex, t) {
  tex.offset.y = 1 - ((Math.floor(t * 10) % 20) + 1) / 20;
}

// Static cubes batched per material into instanced meshes.
export class Blocks {
  constructor(scene) {
    this.scene = scene;
    this.map = new Map();
    this.geo = new THREE.BoxGeometry(1, 1, 1);
  }
  add(mat, x, y, z) {
    if (!this.map.has(mat)) this.map.set(mat, []);
    this.map.get(mat).push(new THREE.Matrix4().makeTranslation(x, y, z));
  }
  flush() {
    for (const [mat, list] of this.map) {
      const im = new THREE.InstancedMesh(this.geo, mat, list.length);
      list.forEach((m, i) => im.setMatrixAt(i, m));
      im.castShadow = im.receiveShadow = true;
      this.scene.add(im);
    }
  }
}

// ---------- the player model ----------
// Face order of a BoxGeometry: +x, -x, +y, -y, +z, -z. A player faces +z, so
// +x is their left side and -x their right side.
function boxUV(geo, u, v, w, h, d) {
  const R = {
    px: [u + d + w, v + d, d, h], // left side
    nx: [u, v + d, d, h], // right side
    py: [u + d, v, w, d], // top
    ny: [u + d + w, v, w, d], // bottom
    pz: [u + d, v + d, w, h], // front
    nz: [u + 2 * d + w, v + d, w, h], // back
  };
  const uv = geo.attributes.uv;
  ["px", "nx", "py", "ny", "pz", "nz"].forEach((f, i) => {
    const [x, y, ww, hh] = R[f];
    const u0 = x / 64,
      u1 = (x + ww) / 64,
      v0 = 1 - y / 64,
      v1 = 1 - (y + hh) / 64;
    const flipY = f === "ny";
    uv.setXY(i * 4 + 0, u0, flipY ? v1 : v0);
    uv.setXY(i * 4 + 1, u1, flipY ? v1 : v0);
    uv.setXY(i * 4 + 2, u0, flipY ? v0 : v1);
    uv.setXY(i * 4 + 3, u1, flipY ? v0 : v1);
  });
  uv.needsUpdate = true;
}
const PX = 1 / 16;
function limb(mat, u, v, w, h, d, pivotTop) {
  const g = new THREE.Group();
  const geo = new THREE.BoxGeometry(w * PX, h * PX, d * PX);
  boxUV(geo, u, v, w, h, d);
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true;
  if (pivotTop) m.position.y = (-h * PX) / 2;
  g.add(m);
  return g;
}
export function makePlayer(skinCanvas) {
  const tex = new THREE.CanvasTexture(skinCanvas);
  tex.magFilter = tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshLambertMaterial({ map: tex, transparent: true, alphaTest: 0.5 });
  const group = new THREE.Group();
  const head = limb(mat, 0, 0, 8, 8, 8, false);
  head.children[0].position.y = 4 * PX;
  head.position.y = 24 * PX;
  const body = limb(mat, 16, 16, 8, 12, 4, false);
  body.position.y = 18 * PX;
  const armR = limb(mat, 40, 16, 4, 12, 4, true);
  armR.position.set(-6 * PX, 24 * PX, 0);
  const armL = limb(mat, 32, 48, 4, 12, 4, true);
  armL.position.set(6 * PX, 24 * PX, 0);
  const legR = limb(mat, 0, 16, 4, 12, 4, true);
  legR.position.set(-2 * PX, 12 * PX, 0);
  const legL = limb(mat, 16, 48, 4, 12, 4, true);
  legL.position.set(2 * PX, 12 * PX, 0);
  group.add(head, body, armR, armL, legR, legL);
  group.rotation.order = "YXZ";
  const parts = { head, body, armR, armL, legR, legL };
  const reset = () => {
    group.position.set(0, 0, 0);
    group.rotation.set(0, 0, 0);
    group.scale.setScalar(1);
    Object.values(parts).forEach((p) => p.rotation.set(0, 0, 0));
    group.visible = true;
  };
  return { group, ...parts, mat, reset };
}
// A lone first-person arm (the right arm of a skin).
export function makeArm(skinCanvas) {
  const tex = new THREE.CanvasTexture(skinCanvas);
  tex.magFilter = tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  return limb(new THREE.MeshLambertMaterial({ map: tex }), 40, 16, 4, 12, 4, true);
}

// ---------- skins (64x64, painted from each character's design) ----------
// paint(part, face, x, y, w, h) returns a colour for each pixel of each face.
export function paintSkin(paint) {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  const parts = {
    head: [0, 0, 8, 8, 8],
    body: [16, 16, 8, 12, 4],
    armR: [40, 16, 4, 12, 4],
    armL: [32, 48, 4, 12, 4],
    legR: [0, 16, 4, 12, 4],
    legL: [16, 48, 4, 12, 4],
  };
  for (const [part, [u, v, w, h, d]] of Object.entries(parts)) {
    const faces = {
      right: [u, v + d, d, h],
      front: [u + d, v + d, w, h],
      left: [u + d + w, v + d, d, h],
      back: [u + 2 * d + w, v + d, w, h],
      top: [u + d, v, w, d],
      bottom: [u + d + w, v, w, d],
    };
    for (const [face, [x0, y0, fw, fh]] of Object.entries(faces))
      for (let y = 0; y < fh; y++)
        for (let x = 0; x < fw; x++) {
          const col = paint(part, face, x, y, fw, fh);
          if (!col) continue;
          g.fillStyle = col;
          g.fillRect(x0 + x, y0 + y, 1, 1);
        }
  }
  return c;
}
// Small deterministic noise for skin shading.
export function hash(a, b, c = 0) {
  let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// ---------- the bitmap game font ----------
const fontCache = {};
async function fontSheets(dir) {
  if (fontCache.ready) return fontCache;
  for (const [file, def] of Object.entries(FONTMAP)) {
    const img = await loadImg(`${dir}/${file}`);
    const cols = def.chars[0].length;
    const cw = img.width / cols,
      ch = img.height / def.chars.length;
    const c = document.createElement("canvas");
    c.width = img.width;
    c.height = img.height;
    const g = c.getContext("2d");
    g.drawImage(img, 0, 0);
    const data = g.getImageData(0, 0, img.width, img.height).data;
    def.chars.forEach((row, ry) =>
      [...row].forEach((chr, rx) => {
        if (chr === "\u0000" || fontCache[chr]) return;
        let w = 0;
        for (let x = 0; x < cw; x++)
          for (let y = 0; y < ch; y++)
            if (data[((ry * ch + y) * img.width + rx * cw + x) * 4 + 3] > 0) w = Math.max(w, x + 1);
        fontCache[chr] = {
          img: c,
          sx: rx * cw,
          sy: ry * ch,
          cw,
          ch,
          w: chr === " " ? 3 : w,
          ascent: def.ascent,
        };
      }),
    );
  }
  fontCache.ready = true;
  return fontCache;
}
// Draw text into a canvas element at `scale` game pixels, with the game's shadow.
export async function drawText(
  canvas,
  text,
  { dir, scale = 4, color = "#ffffff", shadow = true, align = "left" },
) {
  const F = await fontSheets(dir);
  const glyphs = [...text].map((c) => F[c] || F["?"]);
  const width = glyphs.reduce((a, g) => a + g.w + 1, 0) + 1;
  const height = 12;
  canvas.width = Math.ceil(width * scale) + scale;
  canvas.height = height * scale + scale;
  const g = canvas.getContext("2d");
  g.imageSmoothingEnabled = false;
  const tmp = document.createElement("canvas");
  tmp.width = width + 1;
  tmp.height = height + 1;
  const tg = tmp.getContext("2d");
  const paintPass = (col, off) => {
    tg.clearRect(0, 0, tmp.width, tmp.height);
    tg.globalCompositeOperation = "source-over";
    let x = 0;
    for (const gl of glyphs) {
      tg.drawImage(gl.img, gl.sx, gl.sy, gl.cw, gl.ch, x, 9 - gl.ascent, gl.cw, gl.ch);
      x += gl.w + 1;
    }
    tg.globalCompositeOperation = "source-in";
    tg.fillStyle = col;
    tg.fillRect(0, 0, tmp.width, tmp.height);
    g.drawImage(tmp, off * scale, off * scale, tmp.width * scale, tmp.height * scale);
  };
  if (shadow) paintPass(shadeOf(color), 1);
  paintPass(color, 0);
  canvas.dataset.align = align;
  return canvas;
}
function shadeOf(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) >> 2,
    gg = ((n >> 8) & 255) >> 2,
    b = (n & 255) >> 2;
  return `rgb(${r},${gg},${b})`;
}
