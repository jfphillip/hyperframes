// Blocky village for "El Jugador Promedio": original pixel textures, a plaza
// with the rank altar, houses, Pipe's hut and potato farm, and the cast.
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
const LEAF = ["#1f5418", "#2b6a22", "#37802c", "#449436", "#52a540"];
const lf = clusterField(21);
const leaves = pixelTex(16, 16, 21, (x, y) => pal(LEAF, lf(x, y)));
const log = pixelTex(16, 16, 22, (x, y) =>
  x % 4 === 0 ? "#3e2914" : pal(["#5a3d1e", "#664624", "#72502a"], df(x, y)),
);
const M = (map, extra = {}) => new THREE.MeshLambertMaterial({ map, ...extra });

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
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
const scene = new THREE.Scene();
scene.fog = new THREE.Fog("#d8e6d2", 20, 60);
const camera = new THREE.PerspectiveCamera(50, 1080 / 1920, 0.05, 150);

scene.add(new THREE.HemisphereLight("#cfe8ff", "#6b5a3a", 1.0));
const sun = new THREE.DirectionalLight("#ffe0a8", 3.0);
sun.position.set(9, 10, 8);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.bias = -0.0008;
Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 40 });
scene.add(sun);

const box = new THREE.BoxGeometry(1, 1, 1);
// Static cubes are batched per material into instanced meshes (flushed at the end
// of this module): hundreds of separate cubes are far too slow to render here.
const batches = new Map();
function batch(mat, matrix) {
  if (!batches.has(mat)) batches.set(mat, []);
  batches.get(mat).push(matrix);
}
function block(mat, x, y, z) {
  batch(mat, new THREE.Matrix4().makeTranslation(x, y, z));
}
// Move a group's unit-cube children into the batches (after it is placed).
function bake(group) {
  group.updateMatrixWorld(true);
  const cubes = group.children.filter((m) => m.isMesh && m.geometry === box);
  cubes.forEach((m) => {
    batch(m.material, m.matrixWorld.clone());
    group.remove(m);
  });
}
function flushBatches() {
  for (const [mat, list] of batches) {
    const im = new THREE.InstancedMesh(box, mat, list.length);
    list.forEach((mx, i) => im.setMatrixAt(i, mx));
    im.castShadow = im.receiveShadow = true;
    scene.add(im);
  }
}

// Ground: grass everywhere, a gravel plaza and paths.
const groundTop = grassTop.clone();
groundTop.repeat.set(80, 80);
groundTop.needsUpdate = true;
const ground = new THREE.Mesh(new THREE.BoxGeometry(80, 1, 80), [
  M(dirt),
  M(dirt),
  M(groundTop),
  M(dirt),
  M(dirt),
  M(dirt),
]);
ground.position.set(0, -0.5, 0);
ground.receiveShadow = true;
scene.add(ground);

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

// ---------- village ----------
const cobble = pixelTex(16, 16, 60, (x, y, r) => (r() < 0.18 ? "#4f4f55" : pal(STONE, sf(x, y))));
const gravel = pixelTex(16, 16, 61, (x, y, r) =>
  pal(["#8a8580", "#9a948d", "#7a7570", "#a9a39b"], r()),
);
const roofTex = pixelTex(16, 16, 62, (x, y) =>
  y % 4 === 3 ? "#2a1b10" : pal(["#4a3020", "#553826", "#5f402b"], pf(x, y)),
);
const cobbleMat = M(cobble),
  plankMat = M(planks),
  roofMat = M(roofTex),
  logMat2 = M(log);
const windowMat = new THREE.MeshBasicMaterial({ color: "#ffcf6a" });

// Gravel plaza (radius ~4.5) and paths.
const gravelTex = gravel.clone();
gravelTex.repeat.set(10, 10);
gravelTex.needsUpdate = true;
const plaza = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 4.6, 0.04, 8), M(gravelTex));
plaza.position.y = 0.02;
plaza.receiveShadow = true;
scene.add(plaza);
function path(x0, z0, x1, z1) {
  const len = Math.hypot(x1 - x0, z1 - z0);
  const t = gravel.clone();
  t.repeat.set(2, len);
  t.needsUpdate = true;
  const p = new THREE.Mesh(new THREE.BoxGeometry(2, 0.03, len), M(t));
  p.position.set((x0 + x1) / 2, 0.015, (z0 + z1) / 2);
  p.rotation.y = Math.atan2(x1 - x0, z1 - z0);
  p.receiveShadow = true;
  scene.add(p);
}
path(0, 4, 0, 18);
path(4, 0, 11, 7);
path(-4, 0, -14, 0);
path(0, -4, 0, -14);

// Houses: plank walls, log corners, cobble base, stepped roof, a hinged door facing the plaza.
const doors = [];
function house(cx, cz, face, w = 5, d = 5, h = 4) {
  const g = new THREE.Group();
  const add = (mat, x, y, z) => {
    const m = new THREE.Mesh(box, mat);
    m.position.set(x, y, z);
    m.castShadow = m.receiveShadow = true;
    g.add(m);
    return m;
  };
  const hw = (w - 1) / 2,
    hd = (d - 1) / 2;
  for (let x = -hw; x <= hw; x++)
    for (let z = -hd; z <= hd; z++) {
      const edge = Math.abs(x) === hw || Math.abs(z) === hd;
      if (!edge) continue;
      for (let y = 0; y < h; y++) {
        const corner = Math.abs(x) === hw && Math.abs(z) === hd;
        if (z === hd && x === 0 && y < 2) continue; // doorway
        const win = !corner && y === 2 && (x === hw || x === -hw) && z === 0;
        add(corner ? logMat2 : y === 0 ? cobbleMat : win ? windowMat : plankMat, x, y + 0.5, z);
      }
    }
  for (let s = 0; s < 3; s++) {
    const r = new THREE.Mesh(new THREE.BoxGeometry(w + 1 - s * 2, 0.5, d + 1 - s * 2), roofMat);
    r.position.y = h + 0.25 + s * 0.5;
    r.castShadow = true;
    g.add(r);
  }
  const door = new THREE.Group();
  const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2, 0.1), M(planks));
  leaf.position.set(0.45, 1, 0);
  door.add(leaf);
  door.position.set(-0.45, 0, hd + 0.45);
  g.add(door);
  g.position.set(cx, 0, cz);
  g.rotation.y = face;
  scene.add(g);
  bake(g);
  doors.push(door);
  return g;
}
const houses = [
  house(-8.5, -6, Math.atan2(8.5, 6)),
  house(8.5, -6.5, Math.atan2(-8.5, 6.5)),
  house(-9.5, 4.5, Math.atan2(9.5, -4.5)),
  house(-3, -11, Math.atan2(3, 11)),
  house(4.5, -11.5, Math.atan2(-4.5, 11.5)),
  house(-7, 11, Math.atan2(7, -11)),
];

// Lantern posts around the plaza (their lights matter at night).
const lanternLights = [];
const lanternMat = new THREE.MeshBasicMaterial({ color: "#ffcc66" });
[
  [4, 4],
  [-4, 4],
  [4, -4],
  [-4, -4],
].forEach(([x, z]) => {
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.4, 0.18), logMat2);
  post.position.set(x, 1.2, z);
  post.castShadow = true;
  const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), lanternMat);
  lamp.position.set(x, 2.5, z);
  scene.add(post, lamp);
  const l = new THREE.PointLight("#ffb24a", 0, 9, 1);
  l.position.set(x, 2.6, z);
  scene.add(l);
  lanternLights.push(l);
});

// Outskirts trees.
[
  [-15, -14, 5],
  [14, -15, 4],
  [-17, 9, 4],
  [17, 4, 5],
  [-13, 17, 4],
  [20, 16, 4],
  [-21, -3, 5],
  [6, -19, 4],
].forEach(([x, z, h]) => tree(x, z, h));

// ---------- the rank altar ----------
const altar = new THREE.Group();
const base = new THREE.Mesh(new THREE.BoxGeometry(3, 0.5, 3), cobbleMat);
base.position.y = 0.25;
const ped = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), M(stone));
ped.position.y = 1.0;
altar.add(base, ped);
altar.traverse((m) => m.isMesh && (m.castShadow = m.receiveShadow = true));
const crystalMat = new THREE.MeshBasicMaterial({ color: "#8fe8ff" });
const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.32), crystalMat);
crystal.position.y = 1.95;
altar.add(crystal);
const crystalLight = new THREE.PointLight("#8fe8ff", 2, 6, 1);
crystalLight.position.y = 2.0;
altar.add(crystalLight);
scene.add(altar);

// Pixel letters (5x7) for the rank stones.
const GLYPH = {
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
};
const RANK_COLOR = {
  S: "#ffd23f",
  A: "#c77dff",
  B: "#4da3ff",
  C: "#5fd068",
  D: "#4dd8ff",
  F: "#a08a6a",
  X: "#6d6d72",
};
function stoneTex(letter, gray) {
  const col = gray ? RANK_COLOR.X : RANK_COLOR[letter];
  return pixelTex(
    16,
    20,
    70 + letter.charCodeAt(0) + (gray ? 100 : 0),
    (x, y, r) => {
      if (x === 0 || y === 0 || x === 15 || y === 19) return "#2e2e33";
      const gx = x - 5,
        gy = y - 6;
      if (gx >= 0 && gx < 5 && gy >= 0 && gy < 7 && GLYPH[letter][gy][gx] === "1") return col;
      return pal(gray ? ["#5a5a60", "#626268", "#55555b"] : ["#7a7a82", "#85858d", "#70707a"], r());
    },
    false,
  );
}
const stoneGeo = new THREE.BoxGeometry(0.5, 0.62, 0.12);
function rankStone(letter) {
  const lit = M(stoneTex(letter, false), { emissive: RANK_COLOR[letter], emissiveIntensity: 0.25 });
  const gray = M(stoneTex(letter, true));
  const side = M(stone);
  const m = new THREE.Mesh(stoneGeo, [side, side, side, side, lit, side]);
  m.castShadow = true;
  m.userData = {
    lit,
    gray,
    letter,
    setGray(g) {
      m.material[4] = g ? gray : lit;
    },
  };
  return m;
}
// The board: ten posts in an arc behind the altar, one stone per pro.
const BOARD = ["S", "S", "S", "S", "A", "A", "A", "B", "C", "C"];
const boardStones = BOARD.map((letter, i) => {
  const ang = Math.PI * (0.18 + (0.64 * i) / (BOARD.length - 1));
  const x = Math.cos(ang) * 3.2,
    z = -Math.sin(ang) * 2.2 - 0.6;
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.2, 0.16), logMat2);
  post.position.set(x, 0.6, z);
  post.castShadow = true;
  scene.add(post);
  const s = rankStone(letter);
  s.position.set(x, 1.55, z);
  s.rotation.y = Math.atan2(-x, 3 - z) * 0.6;
  scene.add(s);
  return s;
});
// Stones that float above the pedestal when someone is ranked.
const floatStones = { S: rankStone("S"), A: rankStone("A"), F: rankStone("F"), D: rankStone("D") };
Object.values(floatStones).forEach((s) => {
  s.visible = false;
  scene.add(s);
});

// ---------- Pipe's hut and potato farm ----------
const hut = new THREE.Group();
{
  const add = (mat, x, y, z) => {
    const m = new THREE.Mesh(box, mat);
    m.position.set(x, y, z);
    m.castShadow = m.receiveShadow = true;
    hut.add(m);
  };
  for (let x = -2; x <= 2; x++)
    for (let z = -2; z <= 2; z++) {
      if (Math.abs(x) !== 2 && Math.abs(z) !== 2) continue;
      for (let y = 0; y < 3; y++) {
        if (z === 2 && x === 0 && y < 2) continue;
        const corner = Math.abs(x) === 2 && Math.abs(z) === 2;
        add(corner ? logMat2 : y === 0 ? cobbleMat : plankMat, x, y + 0.5, z);
      }
    }
  const roof = new THREE.Mesh(new THREE.BoxGeometry(6, 0.5, 6), roofMat);
  roof.position.y = 3.25;
  roof.castShadow = true;
  hut.add(roof);
  const floorT = planks.clone();
  floorT.repeat.set(3, 3);
  floorT.needsUpdate = true;
  const floor = new THREE.Mesh(new THREE.BoxGeometry(3, 0.04, 3), M(floorT));
  floor.position.y = 0.02;
  floor.receiveShadow = true;
  hut.add(floor);
}
hut.position.set(12, 0, 9);
scene.add(hut);
bake(hut);
const hutRoof = hut.children.find(
  (m) => m.geometry && m.geometry.parameters && m.geometry.parameters.width === 6,
);
const hutDoor = new THREE.Group();
{
  const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2, 0.1), M(planks));
  leaf.position.set(0.45, 1, 0);
  leaf.castShadow = true;
  hutDoor.add(leaf);
  hutDoor.position.set(12 - 0.45, 0, 9 + 2.45);
  scene.add(hutDoor);
}
const hutLight = new THREE.PointLight("#ffb24a", 0, 6, 1);
hutLight.position.set(12, 2.4, 9);
scene.add(hutLight);
// Farm rows in front of the hut, with potato sprouts.
const soil = pixelTex(16, 16, 63, (x, y, r) =>
  y % 8 < 2 ? "#3a2412" : pal(["#5a3a1e", "#6a4424", "#4f321a"], r()),
);
const soilT = soil.clone();
soilT.repeat.set(5, 3);
soilT.needsUpdate = true;
const farm = new THREE.Mesh(new THREE.BoxGeometry(5, 0.06, 3), M(soilT));
farm.position.set(12, 0.03, 13.5);
farm.receiveShadow = true;
scene.add(farm);
const sproutTex = pixelTex(
  16,
  16,
  64,
  (x, y) => {
    if (x === 7 && y > 6) return "#3f8f2c";
    if (y > 2 && y < 9 && Math.abs(x - 7) + Math.abs(y - 6) < 5)
      return y < 6 ? "#7fe06a" : "#5fd04a";
    return null;
  },
  false,
);
const sproutMat = new THREE.MeshLambertMaterial({
  map: sproutTex,
  transparent: true,
  alphaTest: 0.5,
  side: THREE.DoubleSide,
});
const sprouts = [];
for (let r = 0; r < 3; r++)
  for (let c = 0; c < 5; c++) {
    const g = new THREE.Group();
    for (let k = 0; k < 2; k++) {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.6), sproutMat);
      p.position.y = 0.3;
      p.rotation.y = Math.PI / 4 + (k * Math.PI) / 2;
      g.add(p);
    }
    g.position.set(10 + c, 0.06, 12.5 + r);
    scene.add(g);
    sprouts.push(g);
  }

// ---------- the cast ----------
const KZ = {
  skin: "#e8c6a8",
  skinD: "#cfa98a",
  hair: "#d9dde6",
  hairD: "#aeb4c2",
  arm: "#2a2833",
  armD: "#1c1a24",
  trim: "#3fd6c6",
};
function kaizenFace(mood) {
  const k = KZ;
  return pixelTex(8, 8, 120, (x, y) => {
    if (y === 0) return x % 2 ? k.hair : k.hairD;
    if (y === 1) return x === 0 || x === 7 || x === 3 ? k.hair : k.skin;
    if (y === 2)
      return mood === "smug" && (x === 1 || x === 2 || x === 5 || x === 6) ? "#4a3a3a" : k.skin;
    if (y === 3) return x === 1 || x === 5 ? "#ffffff" : x === 2 || x === 6 ? k.trim : k.skin;
    if (y === 4) return x === 3 || x === 4 ? k.skinD : k.skin;
    if (y === 5) {
      if (mood === "smug") return x >= 4 && x <= 5 ? "#7a3a3a" : k.skin;
      if (mood === "sad") return x >= 2 && x <= 5 ? "#5a3030" : k.skin;
      return x >= 3 && x <= 4 ? "#3a1010" : k.skin;
    }
    if (y === 6)
      return mood === "shock" && (x === 3 || x === 4)
        ? "#3a1010"
        : mood === "sad" && (x === 2 || x === 5)
          ? "#5a3030"
          : k.skin;
    return k.skinD;
  });
}
function kaizenSkin() {
  const k = KZ;
  return {
    faces: {
      happy: kaizenFace("smug"),
      smug: kaizenFace("smug"),
      shock: kaizenFace("shock"),
      sad: kaizenFace("sad"),
    },
    headSide: pixelTex(8, 8, 121, (x, y) => (y < 3 ? (x % 2 ? k.hair : k.hairD) : k.skin)),
    headBack: pixelTex(8, 8, 122, (x, y) => (y < 6 ? (x % 2 ? k.hair : k.hairD) : k.skinD)),
    headTop: pixelTex(8, 8, 123, (x, y) => ((x + y) % 2 ? k.hair : k.hairD)),
    torsoFront: pixelTex(8, 12, 124, (x, y) => {
      if (y === 0 || x === 0 || x === 7) return k.armD;
      if ((x === 3 || x === 4) && y > 1 && y < 9) return k.trim;
      if (y === 4) return k.trim;
      if (y === 10) return "#111";
      return y > 10 ? k.armD : k.arm;
    }),
    torsoBack: pixelTex(8, 12, 125, (x, y) =>
      y === 10 ? "#111" : x === 3 || x === 4 ? k.armD : k.arm,
    ),
    torsoSide: pixelTex(4, 12, 126, (x, y) => (y === 4 ? k.trim : k.arm)),
    arm: pixelTex(4, 12, 127, (x, y) =>
      y > 9 ? k.skin : y === 2 || y === 9 ? k.trim : x === 3 ? k.armD : k.arm,
    ),
    leg: pixelTex(4, 12, 128, (x, y) =>
      y > 9 ? "#111" : y === 4 ? k.trim : x === 3 ? k.armD : k.arm,
    ),
    flat: k.arm,
  };
}
// Pros: helmeted armour in assorted colours, visor shows the eyes.
function proSkin(seed, metal, metalD, skinTone) {
  const face = pixelTex(8, 8, 130 + seed, (x, y) => {
    if (y < 3 || x === 0 || x === 7) return y === 2 && x > 0 && x < 7 ? metalD : metal;
    if (y === 3) return x === 2 || x === 5 ? "#1a1a1a" : skinTone;
    if (y === 5) return x >= 3 && x <= 4 ? "#7a3a3a" : skinTone;
    return y > 5 ? metalD : skinTone;
  });
  const solid = (s, w, h, dark) =>
    pixelTex(w, h, 140 + seed + s, (x, y) => (dark(x, y) ? metalD : metal));
  return {
    faces: { happy: face, shock: face },
    headSide: solid(1, 8, 8, (_x, y) => y === 3),
    headBack: solid(2, 8, 8, (x, y) => y === 6),
    headTop: solid(3, 8, 8, (x) => x === 3 || x === 4),
    torsoFront: solid(4, 8, 12, (x, y) => y === 3 || y === 10 || x === 0 || x === 7),
    torsoBack: solid(5, 8, 12, (x, y) => y === 10),
    torsoSide: solid(6, 4, 12, (x, y) => y === 10),
    arm: pixelTex(4, 12, 150 + seed, (x, y) => (y > 9 ? skinTone : y === 3 ? metalD : metal)),
    leg: solid(7, 4, 12, (x, y) => y === 5 || y > 10),
    flat: metal,
  };
}
const PRO_PALETTE = [
  ["#c9ccd2", "#8d9099", "#e0b48c"],
  ["#f2c94c", "#b8902a", "#c98f6e"],
  ["#7fd8e6", "#3f9fb0", "#f0c8a8"],
  ["#d9534f", "#9a2f2b", "#a8724f"],
  ["#9b6bd6", "#6a43a0", "#e0b48c"],
  ["#5fbf5f", "#3a8a3a", "#8a5a3a"],
];
const pipe = makeChar(pipeSkin());
const kaizen = makeChar(kaizenSkin());
const pros = [];
for (let i = 0; i < 12; i++) {
  const [m, d, s] = PRO_PALETTE[i % PRO_PALETTE.length];
  pros.push(makeChar(proSkin(i, m, d, s)));
}
[pipe, kaizen, ...pros].forEach((c) => (c.group.rotation.order = "YXZ"));

// The Evaluator: a tall featureless silhouette, never fully lit.
const evalMat = new THREE.MeshBasicMaterial({ color: "#050505", fog: false });
const evaluator = new THREE.Group();
[
  [0, 1.75, 0, 0.55, 1.6, 0.3],
  [0, 2.9, 0, 0.5, 0.7, 0.45],
  [-0.42, 1.55, 0, 0.16, 1.9, 0.16],
  [0.42, 1.55, 0, 0.16, 1.9, 0.16],
  [-0.15, 0.5, 0, 0.18, 1.0, 0.2],
  [0.15, 0.5, 0, 0.18, 1.0, 0.2],
].forEach(([x, y, z, w, h, d]) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), evalMat);
  m.position.set(x, y, z);
  evaluator.add(m);
});
evaluator.visible = false;
scene.add(evaluator);

// Torches the pros carry when they leave.
const torchFlameMat = new THREE.MeshBasicMaterial({ color: "#ffb03a" });
const heldTorches = pros.map(() => {
  const t = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), torchFlameMat);
  t.visible = false;
  scene.add(t);
  return t;
});

flushBatches();

export {
  THREE,
  scene,
  camera,
  renderer,
  sun,
  mulberry32,
  clamp,
  lerp,
  smooth,
  easeOutBack,
  prog,
  M,
  pixelTex,
  pal,
  box,
  burst,
  bursts,
  renderBursts,
  dustMat,
  sparkMat,
  clouds,
  cloudX,
  doors,
  houses,
  lanternLights,
  altar,
  crystal,
  crystalMat,
  crystalLight,
  boardStones,
  floatStones,
  rankStone,
  hut,
  hutRoof,
  hutDoor,
  hutLight,
  sprouts,
  pipe,
  kaizen,
  pros,
  evaluator,
  heldTorches,
  RANK_COLOR,
};
