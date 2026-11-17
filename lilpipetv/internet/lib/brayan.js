// Brayan, the overconfident friend (original design from the LilPipeTv scripts):
// lime green t-shirt, backwards red cap, big square eyes, one-block brows.
export function makeBrayan(V) {
  const { THREE, pixelTex } = V;
  const BR = {
    skin: "#d9a07a",
    skinD: "#c08a66",
    shirt: "#8fe03a",
    shirtD: "#6cbf22",
    cap: "#d63a32",
    capD: "#a82a24",
    pants: "#3a4a6a",
  };
  function brayanFace(mood) {
    return pixelTex(8, 8, 950 + mood.length, (x, y) => {
      if (y === 0) return BR.cap;
      if (y === 1) return x < 6 ? BR.capD : BR.cap; // backwards brim shadow
      if (y === 2) {
        if (mood === "wink" && x >= 5 && x <= 6) return "#3a2214";
        return x === 1 || x === 2 || x === 5 || x === 6 ? "#3a2214" : BR.skin; // one-block brows
      }
      if (y === 3 || y === 4) {
        const eye = x === 1 || x === 2 || x === 5 || x === 6;
        if (!eye) return BR.skin;
        if (mood === "wink" && x >= 5) return y === 4 ? "#3a2214" : BR.skin;
        if (mood === "sleepy") return y === 4 ? "#3a2214" : BR.skin;
        if (mood === "scared") return y === 3 ? "#ffffff" : x === 2 || x === 5 ? "#111" : "#ffffff";
        return (x === 2 || x === 6) && y === 4 ? "#111" : "#ffffff";
      }
      if (y === 5) return BR.skin;
      if (y === 6) {
        if (mood === "scared") return x >= 2 && x <= 5 ? "#3a1010" : BR.skin;
        if (mood === "eat") return x >= 3 && x <= 4 ? "#c49a54" : BR.skin;
        return x >= 1 && x <= 6 ? (x === 1 || x === 6 ? "#7a2a1a" : "#ffffff") : BR.skin; // big grin
      }
      return mood === "scared" && x >= 2 && x <= 5 ? "#3a1010" : BR.skinD;
    });
  }
  const brayanSkin = {
    faces: {
      happy: brayanFace("happy"),
      wink: brayanFace("wink"),
      scared: brayanFace("scared"),
      eat: brayanFace("eat"),
      sleepy: brayanFace("sleepy"),
    },
    headSide: pixelTex(8, 8, 960, (x, y) => (y < 2 ? BR.cap : BR.skin)),
    headBack: pixelTex(8, 8, 961, (x, y) =>
      y < 2 ? BR.cap : y < 4 && x > 1 && x < 6 ? BR.capD : "#3a2214",
    ),
    headTop: pixelTex(8, 8, 962, (x, y) => (y > 5 && x > 1 && x < 6 ? BR.capD : BR.cap)),
    torsoFront: pixelTex(8, 12, 963, (x, y) =>
      y > 9 ? BR.pants : x === 0 || x === 7 ? BR.shirtD : BR.shirt,
    ),
    torsoBack: pixelTex(8, 12, 964, (x, y) => (y > 9 ? BR.pants : BR.shirt)),
    torsoSide: pixelTex(4, 12, 965, (x, y) => (y > 9 ? BR.pants : BR.shirtD)),
    arm: pixelTex(4, 12, 966, (x, y) => (y < 4 ? BR.shirt : x === 3 ? BR.skinD : BR.skin)),
    leg: pixelTex(4, 12, 967, (x, y) => (y > 10 ? "#2a2a2a" : x === 3 ? "#2c3a55" : BR.pants)),
    flat: BR.shirt,
  };
  const brayan = V.makeChar(brayanSkin);
  brayan.group.rotation.order = "YXZ";
  // Iron pickaxe in the right hand.
  const flat = (c) => new THREE.MeshLambertMaterial({ color: c });
  const pick = new THREE.Group();
  [
    [0.07, 0.9, 0.07, "#6b4a26", -1.0],
    [0.09, 0.1, 0.6, "#d9dde6", -1.42],
  ].forEach(([w, h, d, c, y]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), flat(c));
    m.position.y = y;
    m.castShadow = true;
    pick.add(m);
  });
  brayan.armR.add(pick);
  return { brayan, pick };
}
