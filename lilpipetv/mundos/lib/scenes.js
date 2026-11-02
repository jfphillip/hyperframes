// Original pixel-art scenes (135x240, shown at 8x) that evoke each game's
// setting without drawing any of its characters, logos or UI.

function rng(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hex(c) {
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mix(a, b, k) {
  const A = hex(a),
    B = hex(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(",")})`;
}
function ctxOf(id) {
  // Scenes shown only as tiles (no full-screen canvas) draw offscreen.
  const c =
    document.getElementById(id) ||
    Object.assign(document.createElement("canvas"), { width: 135, height: 240 });
  const g = c.getContext("2d");
  g.imageSmoothingEnabled = false;
  return g;
}
const R = (g, x, y, w, h, c) => {
  g.fillStyle = c;
  g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};
function sky(g, top, bottom, h = 240) {
  for (let y = 0; y < h; y++) R(g, 0, y, 135, 1, mix(top, bottom, y / h));
}
function stars(g, seed, n, maxY) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) R(g, r() * 135, r() * maxY, 1, 1, r() < 0.3 ? "#fff6c8" : "#cfd8ff");
}
function circle(g, cx, cy, rad, c) {
  for (let y = -rad; y <= rad; y++) {
    const w = Math.round(Math.sqrt(rad * rad - y * y));
    R(g, cx - w, cy + y, w * 2, 1, c);
  }
}
function palm(g, x, base, h, c) {
  for (let i = 0; i < h; i++) R(g, x + Math.round(Math.sin(i / 7) * 2), base - i, 2, 1, c);
  const tx = x + Math.round(Math.sin(h / 7) * 2),
    ty = base - h;
  [
    [-1, 0],
    [1, 0],
    [-1, 1],
    [1, 1],
    [0, -1],
  ].forEach(([dx, dy]) => {
    for (let k = 0; k < 9; k++)
      R(g, tx + dx * k, ty + dy * k * 0.6 + Math.abs(dx) * k * k * 0.06, 2, 1, c);
  });
}

const scenes = {
  ny(g) {
    sky(g, "#070c2b", "#2b3a7a");
    stars(g, 1, 60, 110);
    const r = rng(2);
    // Far skyline, then near skyline with lit windows.
    for (let x = -4; x < 135; ) {
      const w = 6 + r() * 10,
        h = 70 + r() * 70;
      R(g, x, 200 - h, w, h, "#18204a");
      x += w + 1;
    }
    for (let x = -6; x < 135; ) {
      const w = 12 + r() * 16,
        h = 50 + r() * 110;
      R(g, x, 205 - h, w, h, "#10142c");
      if (r() < 0.35) R(g, x + w / 2 - 1, 205 - h - 12, 2, 12, "#10142c");
      for (let wy = 210 - h; wy < 200; wy += 4)
        for (let wx = x + 2; wx < x + w - 2; wx += 3)
          if (r() < 0.45) R(g, wx, wy, 1, 2, r() < 0.8 ? "#ffd86b" : "#9fe0ff");
      x += w + 2;
    }
    R(g, 0, 205, 135, 35, "#0b0d1c");
    R(g, 0, 205, 135, 2, "#2a2f55");
    // Rooftop water tower.
    R(g, 96, 186, 18, 14, "#3a2a1c");
    R(g, 94, 184, 22, 3, "#2a1e14");
    R(g, 99, 200, 2, 5, "#2a1e14");
    R(g, 109, 200, 2, 5, "#2a1e14");
    // Web in the top-right corner.
    const cx = 135,
      cy = 0;
    for (let a = 0; a < 6; a++) {
      const ang = Math.PI / 2 + (a / 5) * (Math.PI / 2);
      for (let k = 0; k < 46; k++)
        R(g, cx + Math.cos(ang) * k, cy + Math.sin(ang) * k, 1, 1, "rgba(255,255,255,0.75)");
    }
    for (let ring = 10; ring <= 42; ring += 8)
      for (let a = 0; a <= 40; a++) {
        const ang = Math.PI / 2 + (a / 40) * (Math.PI / 2);
        R(g, cx + Math.cos(ang) * ring, cy + Math.sin(ang) * ring, 1, 1, "rgba(255,255,255,0.55)");
      }
  },
  gta(g) {
    sky(g, "#4a1d7a", "#ffb35e", 160);
    for (let y = 0; y < 160; y += 1)
      if (y > 100) R(g, 0, y, 135, 1, mix("#ff6a5a", "#ffc46b", (y - 100) / 60));
    circle(g, 92, 140, 22, "#ffe08a");
    for (let y = 128; y < 162; y += 5) R(g, 68, y, 50, 2, "#ff8a5a");
    const r = rng(3);
    for (let x = 0; x < 135; ) {
      const w = 8 + r() * 12,
        h = 20 + r() * 40;
      R(g, x, 165 - h, w, h, "#3b1d4a");
      x += w + 1;
    }
    R(g, 0, 160, 135, 80, "#2b2233");
    R(g, 0, 182, 135, 58, "#3a3a44");
    for (let x = 0; x < 135; x += 14) R(g, x, 208, 8, 2, "#ffd34a");
    R(g, 0, 180, 135, 2, "#bdbdc8");
    palm(g, 14, 182, 60, "#1c0f26");
    palm(g, 118, 182, 52, "#1c0f26");
    palm(g, 40, 165, 34, "#2a1638");
  },
  sims(g) {
    sky(g, "#7cc8ff", "#d8f1ff", 170);
    circle(g, 22, 30, 10, "#fff1a6");
    R(g, 0, 170, 135, 70, "#5fb444");
    const r = rng(4);
    for (let i = 0; i < 300; i++)
      R(g, r() * 135, 170 + r() * 70, 1, 1, r() < 0.5 ? "#4f9e38" : "#77c95a");
    // House.
    R(g, 28, 118, 80, 56, "#f1e1c0");
    for (let i = 0; i < 26; i++)
      R(g, 22 + i, 118 - i, 92 - i * 2, 1, i % 3 ? "#c4473b" : "#a63a30");
    R(g, 60, 146, 16, 28, "#7a4a28");
    R(g, 73, 160, 2, 2, "#ffd34a");
    [
      [36, 132],
      [86, 132],
    ].forEach(([x, y]) => {
      R(g, x, y, 16, 14, "#7fd0ff");
      R(g, x + 7, y, 2, 14, "#ffffff");
      R(g, x, y + 6, 16, 2, "#ffffff");
    });
    R(g, 64, 174, 8, 66, "#d8cfb8");
    for (let x = 0; x < 135; x += 5) if (x < 56 || x > 80) R(g, x, 180, 2, 9, "#ffffff");
    R(g, 0, 182, 56, 1, "#ffffff");
    R(g, 80, 182, 55, 1, "#ffffff");
  },
  fort(g) {
    sky(g, "#3e9cff", "#cdeeff");
    const r = rng(5);
    for (let i = 0; i < 7; i++) {
      const x = r() * 120,
        y = 20 + r() * 120,
        w = 14 + r() * 20;
      R(g, x, y, w, 4, "#ffffff");
      R(g, x + 3, y - 2, w - 6, 2, "#ffffff");
    }
    // Island far below.
    for (let y = 196; y < 240; y++) {
      const w = 60 + (y - 196) * 2.2;
      R(g, 67 - w / 2, y, w, 1, y < 200 ? "#e8d79a" : "#4fa83a");
    }
    for (let i = 0; i < 40; i++) R(g, 30 + r() * 75, 205 + r() * 30, 2, 2, "#2f7d2a");
    R(g, 0, 228, 135, 12, "#2f8fd8");
  },
  poke(g) {
    sky(g, "#86d0ff", "#e4f6ff", 150);
    R(g, 0, 150, 135, 90, "#7ccf62");
    const r = rng(6);
    for (let i = 0; i < 260; i++)
      R(g, r() * 135, 150 + r() * 90, 1, 1, r() < 0.5 ? "#6bbd52" : "#92dc78");
    // Clinic: white walls, red roof, cross sign.
    R(g, 34, 100, 70, 58, "#f6f3ee");
    R(g, 30, 92, 78, 10, "#e0453a");
    R(g, 30, 100, 78, 2, "#b5352c");
    R(g, 60, 132, 18, 26, "#7fd0ff");
    R(g, 68, 132, 2, 26, "#d8f3ff");
    // Sign with a pixel heart.
    R(g, 61, 72, 16, 16, "#ff6f91");
    R(g, 64, 76, 4, 3, "#ffffff");
    R(g, 70, 76, 4, 3, "#ffffff");
    R(g, 63, 78, 12, 3, "#ffffff");
    R(g, 65, 81, 8, 2, "#ffffff");
    R(g, 67, 83, 4, 2, "#ffffff");
    R(g, 63, 158, 12, 82, "#e8dcb0");
    // Tall grass patch.
    for (let y = 196; y < 240; y += 6)
      for (let x = 2; x < 56; x += 6) {
        R(g, x, y, 5, 6, "#2f8a2c");
        R(g, x + 1, y - 2, 1, 2, "#3fa83a");
        R(g, x + 3, y - 3, 1, 3, "#3fa83a");
      }
  },
  re(g) {
    sky(g, "#05100b", "#1e3a2a");
    const r = rng(7);
    for (let x = -4; x < 135; ) {
      const w = 12 + r() * 18,
        h = 60 + r() * 100;
      R(g, x, 210 - h, w, h, "#0d1912");
      // Broken roofline.
      for (let k = 0; k < w; k += 3) if (r() < 0.4) R(g, x + k, 210 - h - 2, 3, 2, "#0d1912");
      for (let wy = 214 - h; wy < 205; wy += 6)
        for (let wx = x + 2; wx < x + w - 2; wx += 4)
          if (r() < 0.12) R(g, wx, wy, 2, 3, r() < 0.5 ? "#7dff9c" : "#ff7a3a");
      x += w + 2;
    }
    R(g, 0, 210, 135, 30, "#0a120d");
    for (let i = 0; i < 80; i++) R(g, r() * 135, 120 + r() * 100, 2, 1, "rgba(150,255,190,0.08)");
    // Fire glow at street level.
    circle(g, 30, 214, 10, "rgba(255,110,40,0.35)");
    circle(g, 110, 216, 8, "rgba(255,110,40,0.3)");
  },
  ac(g) {
    sky(g, "#6fd6ff", "#e6fbff", 150);
    circle(g, 108, 34, 12, "#fff3a0");
    R(g, 0, 150, 135, 40, "#2fc3d6");
    const r = rng(8);
    for (let i = 0; i < 30; i++) R(g, r() * 130, 152 + r() * 34, 4, 1, "#bff6ff");
    R(g, 0, 186, 135, 54, "#f4dd9a");
    for (let i = 0; i < 120; i++) R(g, r() * 135, 188 + r() * 52, 1, 1, "#e4c97e");
    R(g, 0, 186, 135, 2, "#ffffff");
    palm(g, 20, 200, 58, "#4f8a2a");
    R(g, 16, 196, 8, 4, "#7a5a2a");
    // Tent.
    for (let i = 0; i < 26; i++)
      R(g, 90 - i, 172 + i, i * 2 + 1, 1, i % 4 < 2 ? "#ff8a3a" : "#ffb35e");
    R(g, 88, 186, 5, 12, "#7a3a1a");
  },
  er(g) {
    sky(g, "#0b0905", "#4a3a16");
    const r = rng(9);
    circle(g, 67, 150, 40, "rgba(255,200,90,0.12)");
    circle(g, 67, 150, 22, "rgba(255,210,110,0.18)");
    for (let i = 0; i < 40; i++) R(g, r() * 135, r() * 150, 1, 1, "rgba(255,220,140,0.6)");
    R(g, 0, 190, 135, 50, "#17130b");
    for (let x = 0; x < 135; x += 2)
      R(g, x, 186 + Math.round(Math.sin(x / 9) * 3), 2, 6, "#211a0e");
    // Ruined pillars.
    [
      [12, 40],
      [30, 28],
      [104, 46],
      [122, 30],
    ].forEach(([x, h]) => {
      R(g, x, 190 - h, 7, h, "#2a2416");
      R(g, x - 1, 190 - h, 9, 2, "#3a321e");
    });
  },
  star(g) {
    sky(g, "#0d0b2a", "#3a2f6a", 150);
    stars(g, 10, 50, 120);
    circle(g, 104, 28, 10, "#fff7c8");
    circle(g, 108, 25, 9, "#2a2456");
    R(g, 0, 150, 135, 90, "#3a2a1a");
    // Crop rows with sprouts.
    for (let y = 168; y < 240; y += 9) {
      R(g, 0, y, 135, 5, "#4f3620");
      for (let x = 4; x < 135; x += 7) {
        R(g, x, y - 3, 1, 3, "#5fd04a");
        R(g, x - 1, y - 3, 3, 1, "#7fe06a");
      }
    }
    // Farmhouse.
    R(g, 14, 112, 54, 40, "#8a3a2a");
    for (let i = 0; i < 18; i++) R(g, 10 + i, 112 - i, 62 - i * 2, 1, "#4a2a5a");
    R(g, 34, 132, 12, 20, "#3a2214");
    R(g, 20, 122, 9, 8, "#ffd86b");
    R(g, 52, 122, 9, 8, "#ffd86b");
    for (let x = 74; x < 135; x += 6) R(g, x, 140, 2, 12, "#7a5a3a");
    R(g, 74, 143, 61, 2, "#7a5a3a");
  },
  mc(g) {
    sky(g, "#6fbaff", "#cfeaff", 150);
    const r = rng(11);
    const grass = ["#4f9f33", "#5aae3b", "#67bd44"],
      dirt = ["#6e4628", "#7d5231", "#8c5f3a"];
    for (let x = 0; x < 135; x += 9) {
      const top = 150 + Math.round(Math.sin(x / 20) * 2) * 9;
      for (let y = top; y < 240; y += 9) {
        const pal = y === top ? grass : dirt;
        for (let py = 0; py < 9; py += 3)
          for (let px = 0; px < 9; px += 3) R(g, x + px, y + py, 3, 3, pal[Math.floor(r() * 3)]);
      }
    }
    // Blocky tree.
    for (let y = 96; y < 150; y += 9)
      for (let py = 0; py < 9; py += 3) R(g, 54, y + py, 9, 3, py % 6 ? "#5a3d1e" : "#6b4a26");
    for (let ly = 60; ly < 105; ly += 9)
      for (let lx = 32; lx < 86; lx += 9)
        for (let py = 0; py < 9; py += 3)
          for (let px = 0; px < 9; px += 3)
            R(g, lx + px, ly + py, 3, 3, ["#2b6a22", "#37802c", "#449436"][Math.floor(r() * 3)]);
  },
};

// Sprites drawn once into their own canvases.
const sprites = {
  "sp-police"(g) {
    R(g, 2, 6, 34, 8, "#f4f4f4");
    R(g, 8, 2, 20, 5, "#1a1a1a");
    R(g, 10, 3, 7, 3, "#7fc8ff");
    R(g, 19, 3, 7, 3, "#7fc8ff");
    R(g, 2, 9, 34, 2, "#1a1a1a");
    R(g, 13, 0, 5, 2, "#ff2a2a");
    R(g, 18, 0, 5, 2, "#2a6aff");
    circle(g, 9, 14, 3, "#111");
    circle(g, 29, 14, 3, "#111");
  },
  "sp-bus"(g) {
    // Hot-air balloon lifting a bus: a generic party bus.
    circle(g, 22, 14, 13, "#3fa0ff");
    for (let y = 2; y < 26; y += 4) R(g, 10, y, 24, 1, "#7fc4ff");
    R(g, 17, 27, 1, 8, "#333");
    R(g, 27, 27, 1, 8, "#333");
    R(g, 6, 35, 34, 12, "#ff9a2a");
    for (let x = 9; x < 38; x += 6) R(g, x, 37, 4, 4, "#d8f3ff");
    circle(g, 12, 48, 2, "#222");
    circle(g, 34, 48, 2, "#222");
  },
  "sp-hands"(g) {
    [
      [4, 0],
      [26, 6],
      [48, 2],
    ].forEach(([x, y]) => {
      R(g, x, y + 6, 8, 30, "#5f8a5a");
      R(g, x - 1, y, 2, 7, "#5f8a5a");
      R(g, x + 2, y - 2, 2, 8, "#5f8a5a");
      R(g, x + 5, y - 1, 2, 7, "#5f8a5a");
      R(g, x + 8, y + 2, 2, 6, "#5f8a5a");
      R(g, x, y + 20, 8, 3, "#3a2a2a");
    });
  },
  "sp-missile"(g) {
    R(g, 2, 3, 22, 4, "#d8d8d8");
    R(g, 22, 2, 4, 6, "#ff3a2a");
    R(g, 0, 0, 4, 3, "#999");
    R(g, 0, 7, 4, 3, "#999");
  },
  "sp-bag"(g) {
    circle(g, 14, 20, 12, "#e8c56a");
    R(g, 9, 4, 10, 6, "#c9a24a");
    R(g, 7, 9, 14, 2, "#7a5a2a");
    R(g, 11, 15, 6, 10, "#fff4c0");
    R(g, 13, 13, 2, 14, "#fff4c0");
  },
  "sp-boss"(g) {
    // An original armoured giant: horned helm, cape, glowing eyes.
    const c = "#0a0805";
    R(g, 22, 18, 36, 30, c);
    for (let i = 0; i < 12; i++) {
      R(g, 18 - i, 18 - i * 1.4, 4, 3, c);
      R(g, 58 + i, 18 - i * 1.4, 4, 3, c);
    }
    R(g, 28, 30, 7, 3, "#ffb03a");
    R(g, 45, 30, 7, 3, "#ffb03a");
    for (let y = 48; y < 120; y++) R(g, 40 - (y - 48) * 0.45, y, 2 * (y - 48) * 0.45 + 2, 1, c);
    R(g, 8, 52, 10, 50, c);
    R(g, 62, 52, 10, 50, c);
    R(g, 70, 20, 3, 90, "#1a140a");
  },
  "sp-log"(g) {
    R(g, 0, 0, 12, 12, "#6b4a26");
    for (let y = 0; y < 12; y += 3) R(g, 0, y, 12, 1, "#5a3d1e");
    R(g, 2, 2, 8, 8, "#b88f58");
    R(g, 4, 4, 4, 4, "#9a7442");
  },
};

export function drawAll() {
  for (const [k, fn] of Object.entries(scenes)) {
    const g = ctxOf("bg-" + k);
    fn(g);
    document.querySelectorAll(`canvas[data-tile="${k}"]`).forEach((t) => {
      const tg = t.getContext("2d");
      tg.imageSmoothingEnabled = false;
      tg.drawImage(g.canvas, 0, 60, 135, 92, 0, 0, t.width, t.height);
    });
  }
  for (const [id, fn] of Object.entries(sprites))
    document.querySelectorAll(`canvas[data-sprite="${id}"]`).forEach((c) => fn(c.getContext("2d")));
}
