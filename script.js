import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// ---------- Guest name from link: ?guest=Sharma%20Family ----------
const guest = new URLSearchParams(location.search).get('guest');
if (guest) {
  ['introGuest', 'heroGuest'].forEach((id) => {
    const el = document.getElementById(id);
    el.textContent = `Dear ${guest.slice(0, 60)},`;
    el.classList.remove('hidden');
  });
}

// ---------- Three.js setup ----------
const canvas = document.getElementById('bg');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
// reflections so gold actually shines
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.z = 12;

scene.add(new THREE.AmbientLight(0xffffff, 0.7));
const light = new THREE.PointLight(0xffd88a, 80, 60);
light.position.set(4, 5, 10);
scene.add(light);

const isMobile = window.innerWidth < 600;
const GOLD = '#d4a64a', GOLD_L = '#f3d98b', MAROON = '#7a1230';

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function ornateFrame(g, w, h) {
  g.strokeStyle = GOLD; g.lineWidth = 10; g.strokeRect(20, 20, w - 40, h - 40);
  g.lineWidth = 3; g.strokeRect(42, 42, w - 84, h - 84);
  g.fillStyle = GOLD;
  [[42, 42], [w - 42, 42], [42, h - 42], [w - 42, h - 42]].forEach(([x, y]) => {
    g.beginPath(); g.arc(x, y, 14, 0, Math.PI * 2); g.fill();
  });
}

// ---------- Golden rings (shown after opening) ----------
const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4a64a, metalness: 1, roughness: 0.25, emissive: 0x3a2400 });
const ringGeo = new THREE.TorusGeometry(1.4, 0.18, 32, 120);
const rings = new THREE.Group();
const ring1 = new THREE.Mesh(ringGeo, goldMat);
const ring2 = new THREE.Mesh(ringGeo, goldMat);
ring1.position.x = -0.9; ring2.position.x = 0.9; ring2.rotation.y = Math.PI / 2.5;
rings.add(ring1, ring2);
rings.position.set(0, 3, -6);
rings.scale.setScalar(0.001);
scene.add(rings);

// ---------- Falling petals ----------
const petalShape = new THREE.Shape();
petalShape.moveTo(0, 0);
petalShape.bezierCurveTo(0.25, 0.25, 0.25, 0.6, 0, 0.8);
petalShape.bezierCurveTo(-0.25, 0.6, -0.25, 0.25, 0, 0);
const petalGeo = new THREE.ShapeGeometry(petalShape);
const petalMats = [0xc2185b, 0xe53950, 0xff9800, 0xffc107, 0xf8bbd0].map(
  (c) => new THREE.MeshStandardMaterial({ color: c, side: THREE.DoubleSide, roughness: 0.6 })
);
const petals = [];
for (let i = 0; i < (isMobile ? 60 : 130); i++) {
  const p = new THREE.Mesh(petalGeo, petalMats[i % petalMats.length]);
  resetPetal(p, true);
  p.userData = {
    spin: new THREE.Vector3(Math.random() * 0.03, Math.random() * 0.03, Math.random() * 0.03),
    speed: 0.01 + Math.random() * 0.02, sway: Math.random() * Math.PI * 2,
  };
  scene.add(p);
  petals.push(p);
}
function resetPetal(p, randomY) {
  p.position.set((Math.random() - 0.5) * 30, randomY ? (Math.random() - 0.5) * 20 : 11, (Math.random() - 0.5) * 12 - 2);
  p.scale.setScalar(0.3 + Math.random() * 0.4);
}

// ---------- Sparkles ----------
const sparkPos = new Float32Array(600 * 3).map(() => (Math.random() - 0.5) * 40);
const sparkGeo = new THREE.BufferGeometry();
sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
const sparks = new THREE.Points(sparkGeo, new THREE.PointsMaterial({
  color: 0xf3d98b, size: 0.07, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false,
}));
scene.add(sparks);

// ---------- Diyas (light up as you scroll) ----------
const glowTex = canvasTex(128, 128, (g) => {
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, 'rgba(255,220,120,1)'); r.addColorStop(0.3, 'rgba(255,140,30,0.6)'); r.addColorStop(1, 'rgba(255,80,0,0)');
  g.fillStyle = r; g.fillRect(0, 0, 128, 128);
});
const DIYA_COUNT = isMobile ? 5 : 9;
const diyaGroup = new THREE.Group();
diyaGroup.visible = false;
scene.add(diyaGroup);
const bowlGeo = new THREE.LatheGeometry(
  [[0, 0], [0.25, 0.02], [0.42, 0.12], [0.5, 0.26], [0.46, 0.28], [0.36, 0.16], [0, 0.12]].map(([x, y]) => new THREE.Vector2(x, y)), 24
);
const bowlMat = new THREE.MeshStandardMaterial({ color: 0xb5562b, roughness: 0.6, metalness: 0.2, emissive: 0x2a0800 });
const rimMat = new THREE.MeshStandardMaterial({ color: 0xd4a64a, metalness: 1, roughness: 0.3 });
const flameGeo = new THREE.SphereGeometry(0.1, 16, 12);
flameGeo.translate(0, 0.1, 0);
const flameMat = new THREE.MeshBasicMaterial({ color: 0xffc34d });
function makeDiya() {
  const d = new THREE.Group();
  d.add(new THREE.Mesh(bowlGeo, bowlMat));
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.03, 8, 32), rimMat);
  rim.rotation.x = Math.PI / 2; rim.position.y = 0.27;
  d.add(rim);
  const flame = new THREE.Mesh(flameGeo, flameMat);
  flame.position.set(0.3, 0.26, 0);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  glow.position.set(0.3, 0.4, 0);
  d.add(flame, glow);
  d.userData = { flame, glow, lit: 0, phase: Math.random() * 10 };
  return d;
}
function flickerDiya(d, t, target) {
  const u = d.userData;
  u.lit += (target - u.lit) * 0.06;
  const flick = 1 + Math.sin(t * 12 + u.phase) * 0.08 + Math.sin(t * 23 + u.phase) * 0.05;
  u.flame.scale.set(u.lit * flick * 0.9, u.lit * flick * 1.6, u.lit * flick * 0.9);
  u.glow.scale.setScalar(u.lit * (1.4 + Math.sin(t * 8 + u.phase) * 0.1));
  u.glow.material.opacity = u.lit * 0.9;
}
const diyas = [];
const gateDiyas = [];
for (let i = 0; i < DIYA_COUNT; i++) {
  const d = makeDiya();
  diyaGroup.add(d);
  diyas.push(d);
}
function layoutDiyas() {
  const dist = camera.position.z - 2;
  const halfH = dist * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const halfW = halfH * camera.aspect;
  const spread = Math.min(6, halfW - 0.7);
  diyaGroup.position.set(0, -halfH + 0.35, 2);
  diyas.forEach((d, i) => d.position.set(-spread + (2 * spread * i) / (DIYA_COUNT - 1), 0, 0));
}
layoutDiyas();

// ---------- Royal palace gate intro ----------
const gate = new THREE.Group();
scene.add(gate);
const goldGate = new THREE.MeshStandardMaterial({ color: 0xd4a64a, metalness: 1, roughness: 0.28, emissive: 0x2a1800 });
const DOOR_W = 2, DOOR_H = 5; // arch springs at y=5, peaks at y=7
let leftDoor, rightDoor, doorGlow, doorLight;

function doorTexture(mirror) {
  return canvasTex(512, 1792, (g, w, h) => {
    // canvas y is flipped vs shape y: shape y 0..7 -> canvas h..0
    const grd = g.createLinearGradient(0, 0, w, 0);
    grd.addColorStop(0, '#5a0c22'); grd.addColorStop(0.5, '#8c1638'); grd.addColorStop(1, '#5a0c22');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    if (mirror) { g.translate(w, 0); g.scale(-1, 1); }
    g.strokeStyle = GOLD; g.fillStyle = GOLD;
    // carved panels
    g.lineWidth = 8;
    const panels = [[60, 1080, 360, 560], [60, 560, 360, 440]];
    panels.forEach(([x, y, pw, ph]) => {
      g.strokeRect(x, y, pw, ph);
      g.lineWidth = 3; g.strokeRect(x + 18, y + 18, pw - 36, ph - 36); g.lineWidth = 8;
      // mandala motif
      const cx = x + pw / 2, cy = y + ph / 2;
      for (let r = 30; r <= 110; r += 40) { g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke(); }
      for (let i = 0; i < 12; i++) {
        const ang = (i / 12) * Math.PI * 2;
        g.beginPath(); g.ellipse(cx + Math.cos(ang) * 70, cy + Math.sin(ang) * 70, 22, 9, ang, 0, Math.PI * 2); g.fill();
      }
    });
    // studs
    for (let y = 120; y < h - 60; y += 110) for (let x = 30; x < w; x += 452) {
      g.beginPath(); g.arc(x, y, 12, 0, Math.PI * 2); g.fill();
    }
    // knocker ring near the centre edge
    g.lineWidth = 10;
    g.beginPath(); g.arc(w - 70, 1000, 40, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.arc(w - 70, 950, 14, 0, Math.PI * 2); g.fill();
  });
}

function buildGate() {
  // Doors: each half of an arched doorway, hinge at local x = 0
  const leftShape = new THREE.Shape();
  leftShape.moveTo(0, 0); leftShape.lineTo(DOOR_W, 0); leftShape.lineTo(DOOR_W, 7);
  leftShape.absarc(DOOR_W, DOOR_H, 2, Math.PI / 2, Math.PI, false); leftShape.lineTo(0, 0);
  const rightShape = new THREE.Shape();
  rightShape.moveTo(0, 0); rightShape.lineTo(0, DOOR_H);
  rightShape.absarc(-DOOR_W, DOOR_H, 2, 0, Math.PI / 2, false); rightShape.lineTo(-DOOR_W, 0); rightShape.lineTo(0, 0);
  const ext = { depth: 0.12, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2, curveSegments: 32 };

  const lt = doorTexture(false); lt.repeat.set(1 / DOOR_W, 1 / 7);
  const rt = doorTexture(true); rt.repeat.set(1 / DOOR_W, 1 / 7); rt.offset.set(1, 0);
  const doorMat = (t) => new THREE.MeshStandardMaterial({ map: t, roughness: 0.55, metalness: 0.25 });

  leftDoor = new THREE.Mesh(new THREE.ExtrudeGeometry(leftShape, ext), [doorMat(lt), goldGate]);
  leftDoor.position.set(-DOOR_W, 0, 0);
  rightDoor = new THREE.Mesh(new THREE.ExtrudeGeometry(rightShape, ext), [doorMat(rt), goldGate]);
  rightDoor.position.set(DOOR_W, 0, 0);
  gate.add(leftDoor, rightDoor);

  // Gold arched frame
  const frame = new THREE.Shape();
  frame.moveTo(-2.9, -0.3); frame.lineTo(2.9, -0.3); frame.lineTo(2.9, 7.6);
  frame.quadraticCurveTo(2.9, 8.6, 0, 9.3); frame.quadraticCurveTo(-2.9, 8.6, -2.9, 7.6); frame.lineTo(-2.9, -0.3);
  const hole = new THREE.Path();
  hole.moveTo(-2.02, 0); hole.lineTo(-2.02, DOOR_H); hole.absarc(0, DOOR_H, 2.02, Math.PI, 0, true);
  hole.lineTo(2.02, 0); hole.lineTo(-2.02, 0);
  frame.holes.push(hole);
  const frameMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(frame, { depth: 0.35, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, curveSegments: 32 }), goldGate);
  frameMesh.position.z = -0.1;
  gate.add(frameMesh);

  // Kalash on top
  const kalash = new THREE.Mesh(new THREE.LatheGeometry(
    [[0, 0], [0.35, 0.1], [0.45, 0.4], [0.3, 0.7], [0.15, 0.8], [0.22, 0.95], [0.05, 1.3], [0, 1.4]].map(([x, y]) => new THREE.Vector2(x, y)), 32), goldGate);
  kalash.position.set(0, 9.2, 0.1);
  gate.add(kalash);

  // Pillars
  [-3.25, 3.25].forEach((x) => {
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 8, 24), goldGate);
    pillar.position.set(x, 3.7, 0.1);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.4, 24, 16), goldGate);
    cap.position.set(x, 7.9, 0.1);
    gate.add(pillar, cap);
  });

  // Marigold toran: a sagging garland + hanging strands
  const beads = [];
  for (let i = 0; i <= 40; i++) {
    const x = -2.9 + (5.8 * i) / 40;
    beads.push([x, 7.3 - 0.5 * Math.sin((Math.PI * i) / 20) ** 2, 0.5]);
  }
  for (let sx = -2.4; sx <= 2.41; sx += 0.8) for (let j = 1; j <= 6; j++) beads.push([sx, 7.2 - j * 0.2, 0.5]);
  const bead = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.12, 1), new THREE.MeshStandardMaterial({ roughness: 0.8 }), beads.length);
  const m = new THREE.Matrix4(), c = new THREE.Color();
  beads.forEach(([x, y, z], i) => {
    bead.setMatrixAt(i, m.makeTranslation(x, y, z));
    bead.setColorAt(i, c.set(i % 3 === 0 ? 0xffc107 : i % 3 === 1 ? 0xff8f00 : 0xd84315));
  });
  gate.add(bead);

  // Light waiting behind the doors
  const inner = new THREE.Shape();
  inner.moveTo(-2, 0); inner.lineTo(-2, DOOR_H); inner.absarc(0, DOOR_H, 2, Math.PI, 0, true); inner.lineTo(2, 0);
  const innerMesh = new THREE.Mesh(new THREE.ShapeGeometry(inner, 32), new THREE.MeshBasicMaterial({ color: 0xffe9a8 }));
  innerMesh.position.z = -0.6;
  gate.add(innerMesh);
  doorGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0 }));
  doorGlow.position.set(0, 3.5, 0.5);
  doorGlow.scale.setScalar(2);
  gate.add(doorGlow);
  doorLight = new THREE.PointLight(0xffc870, 0, 30);
  doorLight.position.set(0, 3.5, 1.5);
  gate.add(doorLight);

  // Diyas at the gate
  [-4.1, -3.55, 3.55, 4.1].forEach((x, i) => {
    const d = makeDiya();
    d.position.set(x, 0, 1.2 + (i % 2) * 0.4);
    d.scale.setScalar(1.3);
    d.userData.lit = 1;
    gate.add(d);
    gateDiyas.push(d);
  });
}

// ---------- Particle names above the gate ----------
let nameParticles;
async function buildNameParticles() {
  // don't wait forever on slow networks
  await Promise.race([document.fonts.load('170px "Great Vibes"').catch(() => {}), new Promise((r) => setTimeout(r, 2500))]);
  const W = 1200, H = 260;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
  const label = 'Simran ♥ Parul';
  let fs = 170;
  g.font = `${fs}px "Great Vibes", cursive`;
  while (g.measureText(label).width > W - 60 && fs > 60) g.font = `${(fs -= 10)}px "Great Vibes", cursive`;
  g.fillText(label, W / 2, H / 2);
  const data = g.getImageData(0, 0, W, H).data;
  const targets = [];
  const step = isMobile ? 5 : 4;
  for (let y = 0; y < H; y += step) for (let x = 0; x < W; x += step) {
    if (data[(y * W + x) * 4 + 3] > 128) targets.push((x / W - 0.5) * 7.2, (0.5 - y / H) * (7.2 * H / W), 0);
  }
  const n = targets.length / 3;
  const pos = new Float32Array(n * 3).map(() => (Math.random() - 0.5) * 30);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  nameParticles = new THREE.Points(geo, new THREE.PointsMaterial({
    color: 0xe0a83a, size: isMobile ? 0.085 : 0.07, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  nameParticles.userData = { targets: new Float32Array(targets), vel: null };
  nameParticles.position.set(0, 10.9, 0.5);
  nameParticles.userData.born = performance.now();
  gate.add(nameParticles);
}

function layoutGate() {
  const halfH = camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const halfW = halfH * camera.aspect;
  // leave room at the bottom for the button, top for the heading
  const sc = Math.min(1, (halfW * 2) / 9.8, (halfH * 2 - 5) / 12.4);
  gate.scale.setScalar(sc);
  gate.position.set(0, -halfH + 3.4, 0);
}

buildGate();
buildNameParticles();
layoutGate();

// ---------- Fireworks ----------
const fireworks = [];
function spawnFirework(x = (Math.random() - 0.5) * 14, y = 1 + Math.random() * 5) {
  const N = isMobile ? 90 : 160;
  const pos = new Float32Array(N * 3);
  const vel = [];
  for (let i = 0; i < N; i++) {
    pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = -4;
    const v = new THREE.Vector3().randomDirection().multiplyScalar(0.06 + Math.random() * 0.06);
    vel.push(v);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const color = new THREE.Color().setHSL([0.08, 0.12, 0.95, 0.9, 0.0, 0.55][Math.floor(Math.random() * 6)], 1, 0.6);
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({
    color, size: 0.14, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  pts.userData.vel = vel;
  scene.add(pts);
  fireworks.push(pts);
}
function updateFireworks() {
  for (let f = fireworks.length - 1; f >= 0; f--) {
    const fw = fireworks[f];
    const arr = fw.geometry.attributes.position.array;
    fw.userData.vel.forEach((v, i) => {
      arr[i * 3] += v.x; arr[i * 3 + 1] += v.y; arr[i * 3 + 2] += v.z;
      v.y -= 0.0015; v.multiplyScalar(0.975);
    });
    fw.geometry.attributes.position.needsUpdate = true;
    fw.material.opacity -= 0.012;
    if (fw.material.opacity <= 0) {
      scene.remove(fw); fw.geometry.dispose(); fw.material.dispose();
      fireworks.splice(f, 1);
    }
  }
}
let showUntil = 0;
function celebrate(ms = 5000) {
  showUntil = Math.max(showUntil, performance.now() + ms);
}
setInterval(() => { if (performance.now() < showUntil && fireworks.length < 8) spawnFirework(); }, 350);

// ---------- Interaction ----------
const mouse = { x: 0, y: 0 };
window.addEventListener('pointermove', (e) => {
  mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
  mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
});

let opened = false, openStart = 0;
const clock = new THREE.Clock();
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();
  const now = performance.now();

  // Gate intro
  let camControlled = false;
  if (gate.visible) {
    gateDiyas.forEach((d) => flickerDiya(d, t, 1));
    if (nameParticles) {
      const arr = nameParticles.geometry.attributes.position.array;
      const { targets, vel } = nameParticles.userData;
      if (!vel) {
        // time-based so it forms in ~2.5s even on slow phones
        const f = Math.min(1, (now - nameParticles.userData.born) / 2500);
        const pull = f < 1 ? 0.02 + f * 0.1 : 0.2;
        for (let i = 0; i < arr.length; i++) {
          arr[i] += (targets[i] - arr[i]) * pull;
          if (i % 3 === 1) arr[i] += Math.sin(t * 2 + i) * 0.002; // shimmer
        }
      } else {
        for (let i = 0; i < arr.length; i++) { arr[i] += vel[i]; vel[i] *= 0.97; }
        nameParticles.material.opacity = Math.max(0, nameParticles.material.opacity - 0.012);
      }
      nameParticles.geometry.attributes.position.needsUpdate = true;
    }
    if (opened) {
      camControlled = true;
      const k = (now - openStart) / 1000;
      const doorT = easeInOut(Math.min(k / 1.8, 1));
      leftDoor.rotation.y = doorT * Math.PI * 0.6;
      rightDoor.rotation.y = -doorT * Math.PI * 0.6;
      doorGlow.material.opacity = doorT;
      doorGlow.scale.setScalar(2 + doorT * 9);
      doorLight.intensity = doorT * 120;
      // walk through the doorway
      const doorCentre = gate.position.y + 3.2 * gate.scale.x;
      const walk = easeInOut(Math.min(Math.max((k - 1.4) / 1.8, 0), 1));
      camera.position.set(camera.position.x * (1 - walk), THREE.MathUtils.lerp(0, doorCentre, walk), 12 - walk * 12.5);
      camera.lookAt(0, THREE.MathUtils.lerp(0, doorCentre, walk), -10);
    }
  }

  // Rings appear after open, drift with scroll
  if (opened && now - openStart > 2600) {
    const s = rings.scale.x + (1 - rings.scale.x) * 0.04;
    rings.scale.setScalar(s);
  }
  rings.rotation.y = t * 0.4;
  rings.rotation.x = Math.sin(t * 0.5) * 0.3;
  const scrollMax = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const scrollF = Math.min(window.scrollY / scrollMax, 1);
  rings.position.y += (3 + scrollF * 6 - rings.position.y) * 0.05;

  petals.forEach((p) => {
    p.position.y -= p.userData.speed;
    p.position.x += Math.sin(t + p.userData.sway) * 0.008;
    p.rotation.x += p.userData.spin.x;
    p.rotation.y += p.userData.spin.y;
    p.rotation.z += p.userData.spin.z;
    if (p.position.y < -11) resetPetal(p, false);
  });

  // Diyas: more light up the further you scroll
  if (diyaGroup.visible) {
    const litCount = 1 + Math.round(scrollF * (DIYA_COUNT - 1));
    diyas.forEach((d, i) => flickerDiya(d, t, i < litCount ? 1 : 0));
  }

  updateFireworks();

  sparks.rotation.y = t * 0.02;
  sparks.material.opacity = 0.6 + Math.sin(t * 2) * 0.2;

  if (!camControlled) {
    camera.position.x += (mouse.x * 1.2 - camera.position.x) * 0.03;
    camera.position.y += (-mouse.y * 0.8 - camera.position.y) * 0.03;
    camera.lookAt(0, 0, 0);
  }

  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  layoutDiyas();
  layoutGate();
});

// ---------- Open invitation ----------
const intro = document.getElementById('intro');
const main = document.getElementById('main');
const musicBtn = document.getElementById('musicBtn');

// Put a shehnai / wedding song as music.mp3 in this folder (optional)
const music = new Audio('music.mp3');
music.loop = true;
music.volume = 0.5;

const flash = document.getElementById('flash');
function openInvite() {
  if (opened || !leftDoor) return;
  opened = true;
  openStart = performance.now();
  intro.classList.add('gone');
  music.play().then(() => musicBtn.classList.add('playing')).catch(() => {});
  if (nameParticles) {
    nameParticles.userData.vel = new Float32Array(nameParticles.geometry.attributes.position.count * 3).map(() => (Math.random() - 0.5) * 0.25);
  }
  setTimeout(() => flash.classList.add('on'), 2600);
  setTimeout(() => {
    gate.visible = false;
    camera.position.set(0, 0, 12);
    intro.remove();
    main.classList.remove('hidden');
    musicBtn.classList.remove('hidden');
    diyaGroup.visible = true;
    openStart = performance.now() - 2600; // rings start growing now
    flash.classList.remove('on');
    petals.forEach((p) => (p.userData.speed *= 3));
    setTimeout(() => petals.forEach((p) => (p.userData.speed /= 3)), 2500);
    celebrate(2500);
  }, 3400);
}
document.getElementById('openBtn').addEventListener('click', openInvite);

// Tap on the gate opens it too
const raycaster = new THREE.Raycaster();
canvas.addEventListener('click', (e) => {
  if (opened) return;
  raycaster.setFromCamera(new THREE.Vector2((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1), camera);
  if (raycaster.intersectObject(gate, true).length) openInvite();
});

musicBtn.addEventListener('click', () => {
  if (music.paused) music.play().then(() => musicBtn.classList.add('playing')).catch(() => {});
  else { music.pause(); musicBtn.classList.remove('playing'); }
});

document.getElementById('celebrateBtn').addEventListener('click', () => celebrate(4000));

// ---------- Countdown ----------
const weddingDate = new Date('2026-11-25T20:00:00+05:30').getTime();
const cd = Object.fromEntries(['d', 'h', 'm', 's'].map((k) => [k, document.getElementById(k)]));
function tick() {
  const diff = Math.max(0, weddingDate - Date.now());
  cd.d.textContent = Math.floor(diff / 86400000);
  cd.h.textContent = Math.floor((diff / 3600000) % 24);
  cd.m.textContent = Math.floor((diff / 60000) % 60);
  cd.s.textContent = Math.floor((diff / 1000) % 60);
}
tick();
setInterval(tick, 1000);

// ---------- Save the Date (.ics with all events) ----------
const EVENTS = [
  ['Satsang', '20261123T063000Z', '20261123T093000Z', 'Aggarwal Sabha, Gummat, Jammu'],
  ['Mehandi', '20261124T143000Z', '20261124T173000Z', 'Aggarwal Sabha, Gummat, Jammu'],
  ['Saant', '20261125T013000Z', '20261125T043000Z', 'Aggarwal Sabha, Gummat, Jammu'],
  ['Reception of Barat', '20261125T143000Z', '20261125T180000Z', 'Dev Banquet Hall, Domana, Jammu'],
];
document.getElementById('icsBtn').addEventListener('click', () => {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//SimranParul//Wedding//EN'];
  EVENTS.forEach(([name, start, end, loc], i) => {
    lines.push('BEGIN:VEVENT', `UID:simran-parul-${i}@wedding`, 'DTSTAMP:20260926T000000Z',
      `DTSTART:${start}`, `DTEND:${end}`, `SUMMARY:${name} - Simran & Parul Wedding`,
      `LOCATION:${loc.replace(/,/g, '\\,')}`,
      'BEGIN:VALARM', 'TRIGGER:-PT3H', 'ACTION:DISPLAY', `DESCRIPTION:${name}`, 'END:VALARM', 'END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  const url = URL.createObjectURL(new Blob([lines.join('\r\n')], { type: 'text/calendar' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: 'Simran-Parul-Wedding.ics' });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

// ---------- Scroll reveal + fireworks at Barat / RSVP ----------
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add('show');
    if (e.target.matches('.highlight, .rsvp')) celebrate(4000);
  });
}, { threshold: 0.3 });
document.querySelectorAll('.reveal, .card.highlight').forEach((s) => io.observe(s));

// ---------- Ganesh ji video ----------
// Paste your video link here (YouTube / YouTube Shorts / Google Drive / direct .mp4)
const GANESH_VIDEO_URL = 'public/ganesh.mp4';
const VIDEO_PORTRAIT = true; // true if the video is vertical (9:16)

const videoBox = document.getElementById('videoBox');
if (VIDEO_PORTRAIT) videoBox.classList.add('portrait');
if (!GANESH_VIDEO_URL) document.getElementById('posterText').textContent = 'Video coming soon 🙏';

function videoEmbed(url) {
  const yt = url.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/);
  if (yt) return { type: 'iframe', src: `https://www.youtube.com/embed/${yt[1]}?autoplay=1&rel=0&playsinline=1` };
  const drive = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([\w-]+)/);
  if (drive) return { type: 'iframe', src: `https://drive.google.com/file/d/${drive[1]}/preview` };
  return { type: 'video', src: url };
}

// Ganesh ji photo shown before the video starts and after it ends
const GANESH_IMG = 'https://images.unsplash.com/photo-1607604760190-ec9ccc12156e?q=80&w=774&auto=format&fit=crop';
const ganeshImg = new Image();
ganeshImg.onload = () => {
  document.getElementById('videoPlay').style.setProperty('--gimg', `url("${GANESH_IMG}")`);
  document.getElementById('videoPlay').classList.add('has-img');
};
ganeshImg.src = GANESH_IMG;

function showEndScreen(onReplay) {
  const end = document.createElement('div');
  end.className = 'video-end';
  if (ganeshImg.complete && ganeshImg.naturalWidth) end.style.setProperty('--gimg', `url("${GANESH_IMG}")`);
  end.innerHTML = `<span class="end-om">ॐ</span>
    <p class="end-text">॥ गणपति बप्पा मोरया ॥</p>
    <button class="gold-btn small">↻ Replay</button>`;
  end.querySelector('button').addEventListener('click', () => { end.remove(); onReplay(); });
  videoBox.appendChild(end);
}

function playGaneshVideo() {
  if (!GANESH_VIDEO_URL) return;
  // pause background music so the video's audio is heard
  const wasPlaying = !music.paused;
  music.pause(); musicBtn.classList.remove('playing');
  const { type, src } = videoEmbed(GANESH_VIDEO_URL);
  let el;
  if (type === 'iframe') {
    el = Object.assign(document.createElement('iframe'), { src, allowFullscreen: true });
    el.allow = 'autoplay; encrypted-media; fullscreen; picture-in-picture';
  } else {
    el = Object.assign(document.createElement('video'), { src, controls: true, autoplay: true, playsInline: true });
    el.addEventListener('ended', () => {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      if (wasPlaying) music.play().then(() => musicBtn.classList.add('playing')).catch(() => {});
      showEndScreen(() => { el.currentTime = 0; el.play(); });
    });
  }
  videoBox.replaceChildren(el);
}
document.getElementById('videoPlay').addEventListener('click', playGaneshVideo);

// ---------- Couple photo: 3D tilt + shine ----------
const frame = document.getElementById('coupleFrame');
const stage = frame.parentElement;
function tilt(x, y) {
  frame.style.transform = `rotateY(${x * 14}deg) rotateX(${-y * 14}deg)`;
  frame.style.setProperty('--sx', `${50 + x * 60}%`);
  frame.style.setProperty('--sy', `${50 + y * 60}%`);
}
stage.addEventListener('pointermove', (e) => {
  const r = stage.getBoundingClientRect();
  tilt((e.clientX - r.left) / r.width - 0.5, (e.clientY - r.top) / r.height - 0.5);
});
stage.addEventListener('pointerleave', () => tilt(0, 0));
// phone: gently tilt with device motion
window.addEventListener('deviceorientation', (e) => {
  if (e.gamma == null) return;
  tilt(Math.max(-0.5, Math.min(0.5, e.gamma / 60)), Math.max(-0.5, Math.min(0.5, (e.beta - 45) / 60)));
});
