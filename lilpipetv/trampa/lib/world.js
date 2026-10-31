// Blocky world for LilPipeTv shorts: original pixel textures, house with a secret
// painting door, a pit trap, and two rigged characters. Imported by each short.
import * as THREE from "./three.module.js";

// ---------- helpers ----------
function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, k) => a + (b - a) * k;
const smooth = (k) => k * k * (3 - 2 * k);
const easeOutBack = (k) => {
  const c1 = 2.2,
    c3 = c1 + 1;
  return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2);
};
const prog = (t, a, b) => clamp((t - a) / (b - a), 0, 1);

// ---------- pixel textures (original, procedural, 16px grid) ----------
function finish(c, repeat = false) {
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
function pixelTex(w, h, seed, fn, repeat = true) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d");
  const r = mulberry32(seed);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const col = fn(x, y, r);
      if (!col) continue;
      g.fillStyle = col;
      g.fillRect(x, y, 1, 1);
    }
  return finish(c, repeat);
}
// Clustered noise: 2x2-ish patches, like hand-painted block art.
function clusterField(seed, w = 16, h = 16) {
  const r = mulberry32(seed);
  const coarse = [];
  for (let i = 0; i < 64; i++) coarse.push(r());
  const fine = [];
  for (let i = 0; i < w * h; i++) fine.push(r());
  return (x, y) => 0.65 * coarse[((y >> 1) % 8) * 8 + ((x >> 1) % 8)] + 0.35 * fine[y * w + x];
}
const pal = (arr, v) => arr[Math.min(arr.length - 1, Math.floor(v * arr.length))];
const GRASS = ["#3f8f2c", "#4d9f33", "#5aae3b", "#67bd44", "#77cc4f"];
const DIRT = ["#5c3a20", "#6e4628", "#7d5231", "#8c5f3a", "#9a6c44"];
const gf = clusterField(11),
  df = clusterField(13);
const grassTop = pixelTex(16, 16, 11, (x, y) => pal(GRASS, gf(x, y)));
const grassSide = pixelTex(16, 16, 12, (x, y) => {
  const lip = 3 + ((x * 5 + 3) % 7 < 3 ? 1 : 0) + (x % 5 === 0 ? 1 : 0);
  if (y < lip) return pal(GRASS, gf(x, y + 3));
  return pal(DIRT, df(x, y));
});
const dirt = pixelTex(16, 16, 13, (x, y) => pal(DIRT, df(x, y)));
const STONE = ["#6f7076", "#7e7f86", "#8c8d94", "#999aa1", "#a7a8af"];
const sf = clusterField(14);
const stone = pixelTex(16, 16, 14, (x, y) => {
  const row = Math.floor(y / 8);
  const off = row % 2 ? 8 : 0;
  const bx = (x + off) % 16;
  const ly = y % 8;
  if (ly === 7 || bx === 15) return "#4b4b51"; // mortar
  if (ly === 0 || bx === 0) return "#b6b7be"; // lit edge
  if (ly === 6 || bx === 14) return "#66676d"; // shadow edge
  return pal(STONE, sf(x, y));
});
const PLANK = ["#8f6a3a", "#9e7643", "#ad834c", "#bb9157", "#c69c60"];
const pf = clusterField(15);
const planks = pixelTex(16, 16, 15, (x, y) => {
  const ly = y % 4;
  if (ly === 3) return "#5a3d1e";
  if (ly === 0) return "#c9a165";
  const seam = Math.floor(y / 4) % 2 ? 4 : 11;
  if (x === seam) return "#6d4a26";
  return pal(PLANK, pf(x, y) * 0.8 + (x % 3 === 0 ? 0.1 : 0));
});
const signTex = pixelTex(16, 16, 16, (x, y) => {
  if (x === 0 || y === 0 || x === 15 || y === 15) return "#5a3d1e";
  if ((y === 5 || y === 8 || y === 11) && x > 2 && x < 13 - (y === 11 ? 4 : 0)) return "#2b1d10";
  return pal(["#c29b62", "#caa46b", "#d3ae75"], pf(x, y));
});
// Original pixel painting: sunset over block hills.
const painting = pixelTex(16, 32, 17, (x, y, r) => {
  if (x === 0 || y === 0 || x === 15 || y === 31) return "#3b2410";
  if (x === 1 || y === 1 || x === 14 || y === 30) return "#8b5a2b";
  const sx = x - 10,
    sy = y - 12;
  if (sx * sx + sy * sy < 9) return y < 12 ? "#fff1a8" : "#ffd65c";
  const hill = 17 + Math.round(2 * Math.sin(x * 0.9));
  if (y > 24) return r() < 0.5 ? "#2f7d32" : "#2a7030";
  if (y > hill) return r() < 0.5 ? "#3f8f3a" : "#4a9b43";
  if (y < 7) return "#3b3f9c";
  if (y < 11) return "#7b4fb3";
  if (y < 15) return "#e0619a";
  return "#ff9a52";
});
// Chest: dark outline, plank bands, latch.
const chestTex = (withLatch, seed) =>
  pixelTex(16, 16, seed, (x, y) => {
    if (x === 0 || x === 15 || y === 0 || y === 15) return "#24160a";
    if (y === 5 || y === 6) return y === 5 ? "#24160a" : "#3b2410";
    if (withLatch && x >= 7 && x <= 8 && y >= 4 && y <= 8)
      return y === 8 || x === 8 ? "#8d8d8d" : "#d9d9d9";
    if (y % 4 === 2 && y > 6) return "#6b4318";
    return pal(["#8a5422", "#9a6029", "#a96d31", "#b77a3a"], pf(x, y));
  });
const chestFront = chestTex(true, 18),
  chestSide = chestTex(false, 27);
const gold = pixelTex(16, 16, 19, (x, y) => {
  if (x === 0 || y === 0) return "#fff8b8";
  if (x === 15 || y === 15) return "#b88310";
  if (x === y || x === y + 1) return "#fff2a0";
  return pal(["#e9b822", "#f2c92a", "#f8d74a", "#fbe063"], sf(x, y));
});
const gem = pixelTex(16, 16, 20, (x, y) => {
  if (x === 0 || y === 0) return "#d4fff6";
  if (x === 15 || y === 15) return "#127a68";
  if (x === y) return "#c8fff4";
  return pal(["#2fcfb0", "#3fd9bb", "#57e6c9", "#74f2d8"], sf(x, y));
});
const LEAF = ["#1f5418", "#2b6a22", "#37802c", "#449436", "#52a540"];
const lf = clusterField(21);
const leaves = pixelTex(16, 16, 21, (x, y) => pal(LEAF, lf(x, y)));
const log = pixelTex(16, 16, 22, (x, y) =>
  x % 4 === 0 ? "#3e2914" : pal(["#5a3d1e", "#664624", "#72502a"], df(x, y)),
);
// Flowers and tall grass (cross sprites).
const sprite = (seed, fn) => pixelTex(16, 16, seed, fn, false);
const tallGrass = sprite(40, (x, y, r) => {
  const blade = [2, 5, 7, 10, 13].find((b) => Math.abs(x - b) < 1 && y > 3 + ((b * 3) % 6));
  return blade !== undefined ? pal(GRASS, r()) : null;
});
const flower = (seed, petal, center) =>
  sprite(seed, (x, y) => {
    if (x === 7 && y > 7) return "#3f8f2c";
    if (y === 11 && (x === 6 || x === 8)) return "#4d9f33";
    const dx = x - 7,
      dy = y - 5;
    if (dx === 0 && dy === 0) return center;
    if (Math.abs(dx) + Math.abs(dy) <= 2) return petal;
    return null;
  });
const flowers = [
  flower(41, "#e8423c", "#2b1d10"),
  flower(42, "#f5d33a", "#e08a1a"),
  flower(43, "#b77be0", "#f5e6ff"),
  flower(44, "#ffffff", "#f5d33a"),
];

const M = (map, extra = {}) => new THREE.MeshLambertMaterial({ map, ...extra });
const grassMats = [M(grassSide), M(grassSide), M(grassTop), M(dirt), M(grassSide), M(grassSide)];

// ---------- scene ----------
const canvas = document.getElementById("world");
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
  preserveDrawingBuffer: true,
});
renderer.setPixelRatio(1);
renderer.setSize(1080, 1920, false);
renderer.setClearColor(0x000000, 0);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
const scene = new THREE.Scene();
scene.fog = new THREE.Fog("#d8e6d2", 20, 60);
const camera = new THREE.PerspectiveCamera(50, 1080 / 1920, 0.05, 150);

scene.add(new THREE.HemisphereLight("#cfe8ff", "#6b5a3a", 1.0));
const sun = new THREE.DirectionalLight("#ffe0a8", 3.0);
sun.position.set(9, 10, 8);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.bias = -0.0008;
Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 40 });
scene.add(sun);

const box = new THREE.BoxGeometry(1, 1, 1);
function block(mat, x, y, z) {
  const m = new THREE.Mesh(box, mat);
  m.position.set(x, y, z);
  m.castShadow = m.receiveShadow = true;
  scene.add(m);
  return m;
}

// Ground with a hidden pit trap right in front of the door (cell x=0, z=1).
const groundTop = grassTop.clone();
groundTop.repeat.set(60, 60);
groundTop.needsUpdate = true;
const gMats = [M(dirt), M(dirt), M(groundTop), M(dirt), M(dirt), M(dirt)];
function slab(x0, x1, z0, z1) {
  const g = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, 1, z1 - z0), gMats);
  g.position.set((x0 + x1) / 2, -0.5, (z0 + z1) / 2);
  g.receiveShadow = true;
  scene.add(g);
}
slab(-30, 30, -30, 0.5);
slab(-30, 30, 3.5, 30);
slab(-30, -1.5, 0.5, 3.5);
slab(2.5, 30, 0.5, 3.5);
const dirtMat = M(dirt),
  stoneBlockMat = M((() => pixelTex(16, 16, 70, (x, y) => pal(STONE, sf(x, y))))());
const pitBlocks = {};
for (let x = -1; x <= 2; x++)
  for (let z = 1; z <= 3; z++) {
    if (x === 0 && z === 1) continue;
    pitBlocks[x + ":" + z] = block(grassMats, x, -0.5, z);
    const depth = x === 2 ? 1 : 7;
    for (let y = 1; y <= depth; y++) block(y < 3 ? dirtMat : stoneBlockMat, x, -0.5 - y, z);
  }
for (let y = 1; y <= 7; y++) block(y < 3 ? dirtMat : stoneBlockMat, 0, -0.5 - y, 0);
const trapCover = block(grassMats, 0, -0.5, 1);
const water = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshLambertMaterial({
    color: "#2f7fd8",
    transparent: true,
    opacity: 0.78,
    emissive: "#0b2a55",
  }),
);
water.position.set(0, -6.6, 1);
scene.add(water);
const rg = mulberry32(5);
for (let i = 0; i < 22; i++) {
  const x = Math.round(rg() * 24 - 12),
    z = Math.round(rg() * 12 + 2);
  if (Math.abs(x) < 4 && z < 8) continue;
  if (x > -6 && x < -3 && z < 6) continue;
  block(grassMats, x, 0.5, z);
}
// Distant terraced block mountains (fogged), like the references' skyline.
const mountainMats = ["#4f8f3a", "#5c9c42", "#6f8f76", "#8a9a8c"].map(
  (c) => new THREE.MeshLambertMaterial({ color: c }),
);
function mountain(cx, cz, layers, base, seed) {
  const r = mulberry32(seed);
  for (let i = 0; i < layers; i++) {
    const w = base * (1 - i / layers) + 1;
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(w + r() * 2, 1.4, w * 0.8 + r() * 2),
      mountainMats[i > layers * 0.65 ? 3 : i > layers * 0.45 ? 2 : i % 2],
    );
    m.position.set(cx + (r() - 0.5) * 1.5, i * 1.4 + 0.7, cz + (r() - 0.5) * 1.5);
    scene.add(m);
  }
}
mountain(-16, -34, 14, 22, 61);
mountain(10, -40, 18, 26, 62);
mountain(30, -30, 10, 16, 63);
mountain(-36, -26, 9, 14, 64);

// Trees.
const logMat = M(log),
  leafMat = M(leaves);
function tree(x, z, h) {
  for (let y = 0; y < h; y++) block(logMat, x, y + 0.5, z);
  for (let dx = -2; dx <= 2; dx++)
    for (let dz = -2; dz <= 2; dz++)
      for (let dy = 0; dy < 2; dy++) {
        if (Math.abs(dx) === 2 && Math.abs(dz) === 2) continue;
        block(leafMat, x + dx, h - 0.5 + dy, z + dz);
      }
  [
    [0, 0],
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ].forEach(([dx, dz]) => block(leafMat, x + dx, h + 1.5, z + dz));
}
tree(-7, -2, 4);
tree(7, -1, 5);
tree(-11, 6, 4);
tree(12, 8, 4);
tree(-14, -10, 5);
tree(15, -9, 4);
tree(-4.5, 3.5, 4); // the friend's hiding spot

// Flat translucent clouds.
const cloudMat = new THREE.MeshBasicMaterial({
  color: "#fffbe8",
  fog: false,
  transparent: true,
  opacity: 0.88,
});
const cloudX = [-8, 6, 16, -18, 2];
const clouds = [];
[
  [-8, 14, -14, 6],
  [6, 15, -18, 8],
  [16, 13, -10, 5],
  [-18, 16, -20, 7],
  [2, 18, -26, 9],
].forEach(([x, y, z, w]) => {
  const c = new THREE.Mesh(new THREE.BoxGeometry(w, 0.8, 3), cloudMat);
  c.position.set(x, y, z);
  scene.add(c);
  clouds.push(c);
});

// Flowers and tall grass in front of the house (path kept clear).
const spriteGeo = new THREE.PlaneGeometry(0.8, 0.8);
const rf = mulberry32(9);
const spriteMats = [tallGrass, ...flowers].map(
  (map) =>
    new THREE.MeshLambertMaterial({
      map,
      transparent: true,
      alphaTest: 0.5,
      side: THREE.DoubleSide,
    }),
);
for (let i = 0; i < 70; i++) {
  const x = rf() * 14 - 7,
    z = rf() * 7 + 0.6;
  if (x > -1.8 && x < 3.4 && z < 4.4) continue;
  if (x > -5.6 && x < -3.4 && z > 2.4 && z < 4.6) continue;
  const mat = spriteMats[rf() < 0.55 ? 0 : 1 + Math.floor(rf() * 4)];
  for (let k = 0; k < 2; k++) {
    const p = new THREE.Mesh(spriteGeo, mat);
    p.position.set(Math.round(x * 2) / 2, 0.4, Math.round(z * 2) / 2);
    p.rotation.y = Math.PI / 4 + k * (Math.PI / 2);
    scene.add(p);
  }
}

// House: stone front wall (front face z=0), room behind.
const stoneMat = M(stone),
  plankMat = M(planks);
const wallBlocks = {};
for (let x = -3; x <= 3; x++)
  for (let y = 0; y < 4; y++) wallBlocks[x + ":" + y] = block(stoneMat, x, y + 0.5, -0.5);
for (let z = -1; z >= -6; z--)
  for (let y = 0; y < 4; y++) {
    block(stoneMat, -3, y + 0.5, z - 0.5);
    block(stoneMat, 3, y + 0.5, z - 0.5);
  }
for (let x = -2; x <= 2; x++) for (let y = 0; y < 4; y++) block(stoneMat, x, y + 0.5, -6.5);
for (let x = -3; x <= 3; x++) for (let z = 0; z >= -6; z--) block(plankMat, x, 4.5, z - 0.5);
// Roof trim and corner logs for a nicer silhouette.
for (let x = -4; x <= 4; x++) block(logMat, x, 4.5, 0.5);
const floorTex = planks.clone();
floorTex.repeat.set(5, 6);
floorTex.needsUpdate = true;
const floor = new THREE.Mesh(new THREE.BoxGeometry(5, 0.02, 6), M(floorTex));
floor.position.set(0, 0.011, -3.5);
floor.receiveShadow = true;
scene.add(floor);

// Front torches.
const torchLights = [];
function torch(x, y, z, light) {
  const stick = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.5, 0.12), M(log));
  stick.position.set(x, y, z);
  const flame = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.16, 0.16),
    new THREE.MeshBasicMaterial({ color: "#ffcf4a" }),
  );
  flame.position.set(x, y + 0.32, z);
  scene.add(stick, flame);
  if (light) {
    const pl = new THREE.PointLight("#ffb347", 6, 9, 1);
    pl.position.set(x * 0.85, y + 0.4, z);
    scene.add(pl);
    torchLights.push(pl);
  }
}
torch(-1.4, 2.6, 0.12, false);
torch(1.4, 2.6, 0.12, false);
torch(-2.45, 2.2, -3, true);
torch(2.45, 2.2, -3, true);

// Secret room: chest + loot.
const cF = M(chestFront),
  cS = M(chestSide);
const chest = new THREE.Group();
const chestBase = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 0.9), [cS, cS, cS, cS, cF, cS]);
chestBase.position.y = 0.3;
const lid = new THREE.Group();
const lidMesh = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.25, 0.9), cS);
lidMesh.position.set(0, 0.125, 0.45);
lid.add(lidMesh);
lid.position.set(0, 0.6, -0.45);
const glow = new THREE.Mesh(
  new THREE.BoxGeometry(0.8, 0.02, 0.8),
  new THREE.MeshBasicMaterial({ color: "#ffe27a" }),
);
glow.position.y = 0.59;
chest.add(chestBase, lid, glow);
chest.position.set(0, 0, -5);
scene.add(chest);
const goldMat = M(gold, { emissive: "#5a4100" }),
  gemMat = M(gem, { emissive: "#0b4a3d" });
const loot = [];
[
  [-1.6, 0.5, -5.4, goldMat],
  [-1.6, 1.5, -5.4, goldMat],
  [-1.0, 0.5, -5.5, gemMat],
  [1.4, 0.5, -5.3, goldMat],
  [1.8, 0.5, -4.4, gemMat],
  [-1.8, 0.5, -4.3, goldMat],
].forEach(([x, y, z, m]) => {
  const b = block(m, x, y, z);
  b.userData.base = y - 0.5;
  loot.push(b);
});
const roomFill = new THREE.PointLight("#ffd27a", 0, 7, 1);
roomFill.position.set(0, 1.4, -4.4);
scene.add(roomFill);

// Signs and painting.
const signMat = M(signTex);
const signGeo = new THREE.BoxGeometry(0.86, 0.56, 0.08);
const signA = new THREE.Mesh(signGeo, signMat);
const signB = new THREE.Mesh(signGeo, signMat);
signA.castShadow = signB.castShadow = true;
scene.add(signA, signB);
const paintMat = new THREE.MeshLambertMaterial({ map: painting });
const pl = M(planks);
const paint = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 0.06), [pl, pl, pl, pl, paintMat, pl]);
paint.castShadow = true;
scene.add(paint);

// Crack overlay + particles.
const crackMat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false });
const crack = new THREE.Mesh(new THREE.BoxGeometry(1.01, 1.01, 1.01), crackMat);
crack.visible = false;
scene.add(crack);
const partGeo = new THREE.BoxGeometry(0.14, 0.14, 0.14);
function burst(seed, origin, t0, mat, n, speed) {
  const r = mulberry32(seed);
  const ps = [];
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(partGeo, mat);
    m.visible = false;
    scene.add(m);
    ps.push({
      m,
      p: [
        origin[0] + (r() - 0.5) * 0.6,
        origin[1] + (r() - 0.5) * 0.6,
        origin[2] + 0.3 + r() * 0.3,
      ],
      v: [(r() - 0.5) * speed, 1.5 + r() * speed, 0.6 + r() * speed * 0.6],
      spin: r() * 8,
      life: 0.7 + r() * 0.4,
    });
  }
  return { t0, ps };
}
const dustMat = new THREE.MeshLambertMaterial({ color: "#e8e2d4" });
const sparkMat = new THREE.MeshBasicMaterial({ color: "#fff3a0" });
const bursts = [];
function renderBursts(t) {
  for (const b of bursts) {
    const dt = t - b.t0;
    for (const q of b.ps) {
      const alive = dt >= 0 && dt < q.life;
      q.m.visible = alive;
      if (!alive) continue;
      const y = q.p[1] + q.v[1] * dt - 4.9 * dt * dt;
      q.m.position.set(q.p[0] + q.v[0] * dt, Math.max(0.07, y), q.p[2] + q.v[2] * dt);
      q.m.rotation.set(q.spin * dt, q.spin * dt * 0.7, 0);
      q.m.scale.setScalar(Math.max(0.01, 1 - smooth(dt / q.life)));
    }
  }
}

// ---------- characters (8x8 head, 8x12 torso, 4x12 limbs) ----------
// Pipe: LilPipeTv's own skin. Friend: an original design (backwards cap, red hoodie, jeans).
const PIPE = {
  skin: "#c98f6e",
  skinD: "#b07a5b",
  skinL: "#d9a283",
  hair: "#2a1c12",
  hairL: "#3b2818",
};
function pipeFace(mood) {
  const { skin, skinD, hair, hairL } = PIPE;
  return pixelTex(8, 8, 50, (x, y, r) => {
    if (y < 2) return r() < 0.3 ? hairL : hair;
    if (y === 2)
      return x === 0 || x === 7
        ? hair
        : mood === "smirk" && (x === 1 || x === 2)
          ? "#3a2a1a"
          : skin;
    if (y === 3) return x === 1 || x === 2 || x === 5 || x === 6 ? "#f2a33a" : "#121212";
    if (y === 4)
      return x === 1 || x === 2 || x === 5 || x === 6
        ? "#c9741c"
        : x === 0 || x === 7
          ? skinD
          : skin;
    if (y === 5) return x === 3 || x === 4 ? skinD : skin;
    if (y === 6) {
      if (mood === "shock") return x >= 3 && x <= 4 ? "#3a1010" : skin;
      if (mood === "smirk") return x >= 4 && x <= 5 ? "#a4584a" : skin;
      return x >= 2 && x <= 5 ? "#a4584a" : skin;
    }
    if (y === 7 && mood === "shock") return x >= 3 && x <= 4 ? "#3a1010" : skinD;
    return skinD;
  });
}
function pipeSkin() {
  const { skin, skinD, skinL, hair, hairL } = PIPE;
  return {
    faces: { happy: pipeFace("happy"), shock: pipeFace("shock"), smirk: pipeFace("smirk") },
    headSide: pixelTex(8, 8, 51, (x, y, r) =>
      y < 3 || (y < 5 && x > 4) ? (r() < 0.3 ? hairL : hair) : y === 3 ? "#121212" : skin,
    ),
    headBack: pixelTex(8, 8, 52, (x, y, r) => (y < 6 ? (r() < 0.3 ? hairL : hair) : skinD)),
    headTop: pixelTex(8, 8, 53, (x, y, r) => (r() < 0.3 ? hairL : hair)),
    torsoFront: pixelTex(8, 12, 54, (x, y) => {
      if (y === 10) return x === 3 || x === 4 ? "#6b6b6b" : "#151515";
      if (y === 11) return "#e6e6ea";
      if (y === 2 && (x === 2 || x === 5)) return "#a4584a";
      if (y === 3 && x !== 0 && x !== 7) return x === 3 || x === 4 ? skin : skinD;
      if ((y === 5 || y === 7) && x > 1 && x < 6) return skinD;
      if (y > 4 && y < 10 && (x === 3 || x === 4) && (x + y) % 2 === 0) return skinD;
      if (x === 0 || x === 7) return skinD;
      return y < 2 ? skinL : skin;
    }),
    torsoBack: pixelTex(8, 12, 55, (x, y) =>
      y === 10 ? "#151515" : y === 11 ? "#e6e6ea" : x === 3 || x === 4 ? skinD : skin,
    ),
    torsoSide: pixelTex(4, 12, 56, (x, y) => (y === 10 ? "#151515" : y === 11 ? "#e6e6ea" : skin)),
    arm: pixelTex(4, 12, 58, (x, y) => (y === 11 || x === 3 ? skinD : x === 0 ? skinL : skin)),
    leg: pixelTex(4, 12, 57, (x, y) =>
      y < 5
        ? y === 4
          ? "#c9c9cf"
          : x === 0
            ? "#d4d4da"
            : "#ececf0"
        : y === 11 || x === 3
          ? skinD
          : skin,
    ),
    flat: skin,
  };
}
const FR = {
  skin: "#e3b08a",
  skinD: "#c9946f",
  red: "#d63a32",
  redD: "#a82a24",
  redL: "#ec5a4f",
  cap: "#1d1d22",
  hair: "#1a1410",
  jean: "#2f4466",
  jeanD: "#24344f",
};
function friendFace(mood) {
  const f = FR;
  return pixelTex(8, 8, 80, (x, y) => {
    if (y < 2) return f.cap;
    if (y === 2) return x === 0 || x === 7 ? f.hair : f.skin;
    if (y === 3) {
      if (mood === "shock") return x === 1 || x === 2 || x === 5 || x === 6 ? "#ffffff" : f.skin;
      return x === 1 || x === 5 ? "#ffffff" : x === 2 || x === 6 ? "#4a2a14" : f.skin;
    }
    if (y === 4 && mood === "shock")
      return x === 1 || x === 2 || x === 5 || x === 6
        ? x === 2 || x === 5
          ? "#111"
          : "#fff"
        : f.skin;
    if (y === 5) return x === 3 || x === 4 ? f.skinD : f.skin;
    if (y === 6) {
      if (mood === "shock") return x >= 2 && x <= 5 ? "#3a1010" : f.skin;
      if (mood === "grin")
        return x >= 1 && x <= 6 ? (x === 1 || x === 6 ? "#7a2a1a" : "#ffffff") : f.skin;
      return x >= 3 && x <= 4 ? "#7a2a1a" : f.skin;
    }
    if (y === 7 && mood === "shock") return x >= 2 && x <= 5 ? "#3a1010" : f.skinD;
    return f.skinD;
  });
}
function friendSkin() {
  const f = FR;
  return {
    faces: { happy: friendFace("happy"), shock: friendFace("shock"), grin: friendFace("grin") },
    headSide: pixelTex(8, 8, 81, (x, y) => (y < 2 ? f.cap : y < 4 && x > 3 ? f.hair : f.skin)),
    headBack: pixelTex(8, 8, 82, (x, y) =>
      y < 2 ? f.cap : y === 2 ? (x > 1 && x < 6 ? "#e8e8e8" : f.cap) : y < 6 ? f.hair : f.skinD,
    ),
    headTop: pixelTex(8, 8, 83, (x, y) => (y > 5 && x > 1 && x < 6 ? "#2c2c33" : f.cap)),
    torsoFront: pixelTex(8, 12, 84, (x, y) => {
      if (y < 2 && x > 2 && x < 5) return f.skin;
      if ((x === 3 || x === 4) && y >= 2) return x === 3 ? "#f0f0f0" : f.redD;
      if (y === 2 && (x === 2 || x === 5)) return "#f0f0f0";
      if (y > 6 && y < 10 && x > 0 && x < 7 && x !== 3 && x !== 4) return f.redD;
      return x === 0 || x === 7 ? f.redD : y < 2 ? f.redL : f.red;
    }),
    torsoBack: pixelTex(8, 12, 85, (x, y) => (y < 3 && x > 1 && x < 6 ? f.redD : f.red)),
    torsoSide: pixelTex(4, 12, 86, () => f.red),
    arm: pixelTex(4, 12, 87, (x, y) =>
      y > 9 ? f.skin : y === 9 ? "#f0f0f0" : x === 3 ? f.redD : f.red,
    ),
    leg: pixelTex(4, 12, 88, (x, y) =>
      y > 9 ? (y === 11 ? "#e6e6e6" : "#3a3a40") : x === 3 ? f.jeanD : f.jean,
    ),
    flat: f.red,
  };
}
// Rig (box order: +x, -x, +y, -y, +z front, -z back).
function makeChar(skin) {
  const group = new THREE.Group();
  const part = (w, h, d, mats, x, y, z, pivotTop = false) => {
    const g = new THREE.Group();
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats);
    mesh.castShadow = true;
    mesh.position.y = pivotTop ? -h / 2 : 0;
    g.add(mesh);
    g.position.set(x, y, z);
    group.add(g);
    return g;
  };
  const flat = new THREE.MeshLambertMaterial({ color: skin.flat });
  const hS = M(skin.headSide);
  const faceMat = M(skin.faces.happy);
  const head = part(
    0.5,
    0.5,
    0.5,
    [hS, hS, M(skin.headTop), flat, faceMat, M(skin.headBack)],
    0,
    1.55,
    0,
  );
  const tS = M(skin.torsoSide);
  part(0.5, 0.75, 0.25, [tS, tS, flat, flat, M(skin.torsoFront), M(skin.torsoBack)], 0, 0.925, 0);
  const aM = M(skin.arm),
    lM = M(skin.leg);
  const armL = part(0.24, 0.72, 0.24, aM, -0.37, 1.29, 0, true);
  const armR = part(0.24, 0.72, 0.24, aM, 0.37, 1.29, 0, true);
  const legL = part(0.25, 0.62, 0.25, lM, -0.125, 0.6, 0, true);
  const legR = part(0.25, 0.62, 0.25, lM, 0.125, 0.6, 0, true);
  group.scale.setScalar(0.95);
  scene.add(group);
  const setFace = (mood) => {
    if (faceMat.map !== skin.faces[mood]) {
      faceMat.map = skin.faces[mood];
      faceMat.needsUpdate = true;
    }
  };
  const reset = () => {
    group.position.set(0, 0, 0);
    group.rotation.set(0, 0, 0);
    [head, armL, armR, legL, legR].forEach((p) => p.rotation.set(0, 0, 0));
    group.visible = true;
    setFace("happy");
  };
  return { group, head, armL, armR, legL, legR, setFace, reset };
}
const pipe = makeChar(pipeSkin());
const friend = makeChar(friendSkin());

// Stone button inside, right of the doorway; held gold block; glint star.
const button = new THREE.Mesh(
  new THREE.BoxGeometry(0.3, 0.2, 0.14),
  new THREE.MeshLambertMaterial({ map: stone }),
);
button.position.set(1, 1.25, -1.07);
scene.add(button);
const heldGold = new THREE.Mesh(box, goldMat);
heldGold.scale.setScalar(0.5);
heldGold.castShadow = true;
scene.add(heldGold);
const starTex = pixelTex(
  16,
  16,
  90,
  (x, y) => {
    const dx = Math.abs(x - 7.5),
      dy = Math.abs(y - 7.5);
    if ((dx < 1 && dy < 7) || (dy < 1 && dx < 7)) return "#ffffff";
    if (dx < 2 && dy < 2) return "#fff6c0";
    return null;
  },
  false,
);
const star = new THREE.Mesh(
  new THREE.PlaneGeometry(0.5, 0.5),
  new THREE.MeshBasicMaterial({
    map: starTex,
    transparent: true,
    alphaTest: 0.3,
    depthTest: false,
    fog: false,
  }),
);
star.renderOrder = 10;
scene.add(star);

export {
  THREE,
  scene,
  camera,
  renderer,
  mulberry32,
  clamp,
  lerp,
  smooth,
  easeOutBack,
  prog,
  wallBlocks,
  signA,
  signB,
  paint,
  chest,
  lid,
  glow,
  loot,
  roomFill,
  torchLights,
  clouds,
  cloudX,
  burst,
  bursts,
  renderBursts,
  stoneMat,
  dustMat,
  sparkMat,
  pipe,
  friend,
  button,
  heldGold,
  star,
  trapCover,
  water,
  pitBlocks,
  block,
  M,
  pixelTex,
  pal,
  grassMats,
  dirtMat,
  stoneBlockMat,
  goldMat,
  planks,
  log,
  stone,
};
