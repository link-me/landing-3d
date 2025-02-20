import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const app = document.getElementById('app');
const fpsEl = document.getElementById('fps');
const objsEl = document.getElementById('objects');
const ctaBtn = document.getElementById('cta');
const matrixBtn = document.getElementById('matrixBtn');
const logEl = document.getElementById('log');
const matrixCanvas = document.getElementById('matrix');
const mctx = matrixCanvas.getContext('2d');

function log(msg) {
  if (!logEl) return;
  const t = new Date().toISOString().replace('T',' ').split('.')[0];
  logEl.textContent += `[${t}] ${msg}\n`;
  logEl.scrollTop = logEl.scrollHeight;
}

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
app.appendChild(renderer.domElement);

// Scene & Camera
const scene = new THREE.Scene();
scene.background = new THREE.Color('#0b0f0a');

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0.8, 0.9, 2.2);

// Lights
const hemi = new THREE.HemisphereLight(0xbfffd9, 0x102015, 0.9);
const dir = new THREE.DirectionalLight(0xcffff0, 1.0);
dir.position.set(3, 3, 2);
scene.add(hemi, dir);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.minDistance = 1.2;
controls.maxDistance = 5.0;

// Root group
const root = new THREE.Group();
scene.add(root);

// Central Matrix Core — glass cube + neon wireframe + glyph sprites
const coreGroup = new THREE.Group();
root.add(coreGroup);
const coreSize = 0.9;
const coreBox = new THREE.BoxGeometry(coreSize, coreSize, coreSize);
const coreWire = new THREE.EdgesGeometry(coreBox);
const coreLineMat = new THREE.LineBasicMaterial({ color: '#00ff88', transparent: true, opacity: 0.9 });
const coreLines = new THREE.LineSegments(coreWire, coreLineMat);
coreGroup.add(coreLines);
const coreGlassMat = new THREE.MeshPhysicalMaterial({
  transmission: 0.85,
  thickness: 0.2,
  roughness: 0.15,
  metalness: 0.1,
  clearcoat: 0.4,
  clearcoatRoughness: 0.2,
  ior: 1.4,
  color: new THREE.Color('#0f3022'),
  emissive: new THREE.Color('#072815'),
  emissiveIntensity: 0.2,
});
const coreGlass = new THREE.Mesh(new THREE.BoxGeometry(coreSize * 0.92, coreSize * 0.92, coreSize * 0.92), coreGlassMat);
coreGroup.add(coreGlass);
const coreLight = new THREE.PointLight(0x00ff88, 0.9, 3.5);
coreGroup.add(coreLight);
const glyphSprites = [];
for (let i = 0; i < 16; i++) {
  const sm = new THREE.SpriteMaterial({ map: makeGlyphTexture(), color: '#00ff88', transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending });
  const sp = new THREE.Sprite(sm);
  sp.scale.set(0.18, 0.18, 0.18);
  coreGroup.add(sp);
  glyphSprites.push(sp);
}

// (removed) torus-knot hero per request; keep material for theme toggling
const matPrimary = new THREE.MeshStandardMaterial({
  color: new THREE.Color('#22cc88'),
  roughness: 0.3,
  metalness: 0.6,
  emissive: new THREE.Color('#072815'),
  emissiveIntensity: 0.45,
});

// (removed) secondary orbiting spheres per request

// Background: 3D Matrix rain (columns of green glyph-like points)
const columns = 120;
const perColumn = 20;
const codeCount = columns * perColumn;
const codeGeo = new THREE.BufferGeometry();
const codePositions = new Float32Array(codeCount * 3);
const codeColors = new Float32Array(codeCount * 3);
const pointColumn = new Uint16Array(codeCount);
const pointIndex = new Uint16Array(codeCount);
const speeds = new Float32Array(codeCount);
const areaRadius = 28;
const minY = -12, maxY = 12;
for (let c = 0; c < columns; c++) {
  const angle = (c / columns) * Math.PI * 2;
  const x = Math.cos(angle) * (areaRadius + (Math.random() - 0.5) * 6);
  const z = Math.sin(angle) * (areaRadius + (Math.random() - 0.5) * 6);
  for (let s = 0; s < perColumn; s++) {
    const i = c * perColumn + s;
    const ix = i * 3;
    codePositions[ix] = x + (Math.random() - 0.5) * 0.6;
    codePositions[ix + 1] = minY + Math.random() * (maxY - minY);
    codePositions[ix + 2] = z + (Math.random() - 0.5) * 0.6;
    // initial dim color, leader will be brightened on tick
    codeColors[ix] = 0.06; codeColors[ix + 1] = 0.5; codeColors[ix + 2] = 0.28;
    pointColumn[i] = c; pointIndex[i] = s;
    speeds[i] = 0.02 + Math.random() * 0.06;
  }
}
codeGeo.setAttribute('position', new THREE.BufferAttribute(codePositions, 3));
codeGeo.setAttribute('color', new THREE.BufferAttribute(codeColors, 3));
const codeMat = new THREE.PointsMaterial({ size: 0.055, sizeAttenuation: true, vertexColors: true });
codeMat.color = new THREE.Color('#00ff88');
codeMat.transparent = true;
codeMat.alphaTest = 0.08;
codeMat.depthWrite = false;
function makeGlyphTexture() {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  const ctx = c.getContext('2d');
  ctx.clearRect(0,0,64,64);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.shadowColor = '#00ff88'; ctx.shadowBlur = 14;
  ctx.fillStyle = '#00ff88';
  ctx.font = 'bold 44px monospace';
  const chars = ['0','1','ア','ネ','ソ'];
  const ch = chars[Math.floor(Math.random() * chars.length)];
  ctx.fillText(ch, 32, 36);
  const tex = new THREE.CanvasTexture(c);
  tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  return tex;
}
codeMat.map = makeGlyphTexture();
const codePoints = new THREE.Points(codeGeo, codeMat);
scene.add(codePoints);

// Parallax on scroll
let scrollY = 0;
window.addEventListener('scroll', () => {
  scrollY = window.scrollY || document.documentElement.scrollTop || 0;
});

// Theme (fixed dark)
let matrixActive = false;
function applyTheme() {
  scene.background = new THREE.Color('#0b0f0a');
  matPrimary.color.set('#22cc88');
  codeMat.color.set('#00ff88');
  document.body.style.background = '#0b0f0a';
  document.body.style.color = '#e6f6e6';
}
applyTheme();

// CTA scroll
ctaBtn.addEventListener('click', () => {
  const el = document.getElementById('info');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
  log('CTA scroll to info');
});

// Matrix mode overlay
const mChars = '01MNQWERTYUIOPASDFGHJKLZXCVB'.split('');
const fontSize = 14;
let drops = [];
function sizeMatrix() {
  matrixCanvas.width = window.innerWidth;
  matrixCanvas.height = window.innerHeight;
  drops = Array(Math.ceil(matrixCanvas.width / fontSize)).fill(0);
}
sizeMatrix();
function drawMatrix() {
  if (!matrixActive) return;
  mctx.fillStyle = 'rgba(0,0,0,0.08)';
  mctx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);
  mctx.fillStyle = '#00ff88';
  mctx.font = `${fontSize}px monospace`;
  for (let i = 0; i < drops.length; i++) {
    const text = mChars[Math.floor(Math.random() * mChars.length)];
    mctx.fillText(text, i * fontSize, drops[i] * fontSize);
    if (drops[i] * fontSize > matrixCanvas.height && Math.random() > 0.975) drops[i] = 0;
    drops[i]++;
  }
  requestAnimationFrame(drawMatrix);
}
function toggleMatrix() {
  matrixActive = !matrixActive;
  matrixCanvas.style.opacity = matrixActive ? '0.85' : '0';
  if (matrixActive) {
    dir.color.set('#ccfff0'); hemi.color.set('#aaffdd'); codeMat.color.set('#00ff88');
    // speed up rain subtly
    for (let i = 0; i < speeds.length; i++) speeds[i] *= 1.25;
    coreLight.intensity = 1.2; coreLineMat.opacity = 1.0;
    drawMatrix();
    log('Matrix mode ON');
  } else {
    dir.color.set('#cffff0'); hemi.color.set('#bfffd9'); codeMat.color.set('#00ff88');
    coreLight.intensity = 0.9; coreLineMat.opacity = 0.9;
    mctx.clearRect(0, 0, matrixCanvas.width, matrixCanvas.height);
    log('Matrix mode OFF');
  }
}
if (matrixBtn) matrixBtn.addEventListener('click', toggleMatrix);

// Resize
function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  sizeMatrix();
}
window.addEventListener('resize', onResize);

// Metrics
let last = performance.now();
let frames = 0;
let fps = 0;
function updateMetrics(now) {
  frames++;
  const dt = now - last;
  if (dt >= 500) { // update twice a second
    fps = Math.round((frames * 1000) / dt);
    fpsEl.textContent = `FPS: ${fps}`;
    objsEl.textContent = `Objects: ${scene.children.length}`;
    frames = 0;
    last = now;
  }
}

// Tick
const clock = new THREE.Clock();
function tick(now) {
  const t = clock.getElapsedTime();
  // (removed) hero rotation
  // (removed) orbs animation
  // 3D matrix rain animation
  // move points downward, brighten leader per column
  // Reset simple dim color
  for (let i = 0; i < codeCount; i++) {
    const ix = i * 3;
    codePositions[ix + 1] -= speeds[i];
    if (codePositions[ix + 1] < minY) codePositions[ix + 1] = maxY;
    codeColors[ix] = 0.06; codeColors[ix + 1] = 0.5; codeColors[ix + 2] = 0.28;
  }
  // find leader in each column: highest y
  for (let c = 0; c < columns; c++) {
    let leaderI = -1; let leaderY = -Infinity;
    for (let s = 0; s < perColumn; s++) {
      const i = c * perColumn + s; const y = codePositions[i * 3 + 1];
      if (y > leaderY) { leaderY = y; leaderI = i; }
    }
    if (leaderI >= 0) {
      const ix = leaderI * 3;
      codeColors[ix] = 0.12; codeColors[ix + 1] = 1.0; codeColors[ix + 2] = 0.48;
    }
  }
  codeGeo.attributes.position.needsUpdate = true;
  codeGeo.attributes.color.needsUpdate = true;
  // Parallax based on scroll
  const py = Math.min(scrollY / window.innerHeight, 1.0);
  camera.position.y = 0.9 + py * 0.6;
  camera.position.z = 2.2 + py * 0.8;

  // Central Matrix Core animation
  coreGroup.rotation.y += 0.004;
  coreGroup.rotation.x = Math.sin(t * 0.2) * 0.08;
  const ringR = 0.28 + Math.sin(t * 0.6) * 0.04;
  for (let i = 0; i < glyphSprites.length; i++) {
    const sp = glyphSprites[i];
    const phase = t * 0.8 + i * ((Math.PI * 2) / glyphSprites.length);
    sp.position.set(Math.cos(phase) * ringR, Math.sin(phase * 1.3) * 0.18, Math.sin(phase) * ringR);
    sp.material.opacity = 0.6 + 0.4 * Math.max(0, Math.sin(phase * 2.0));
  }

  // Flying pills animation — orbit pivots with pill-pill collisions
  if (orbitA && orbitB) {
    // advance angles
    orbitA.angleY += orbitA.omegaY;
    orbitB.angleY += orbitB.omegaY;
    orbitA.pivot.rotation.y = orbitA.angleY;
    orbitB.pivot.rotation.y = orbitB.angleY;
    // precession
    orbitA.pivot.rotation.x = Math.sin(t * 0.9) * 0.15 + 0.35;
    orbitB.pivot.rotation.z = Math.cos(t * 0.8) * 0.12 - 0.1;
    // apply short vertical kick offsets with damping
    const KICK_DAMP = 0.9;
    orbitA.yOffset = Math.max(Math.min(orbitA.yOffset + orbitA.yVel, 0.22), -0.22);
    orbitB.yOffset = Math.max(Math.min(orbitB.yOffset + orbitB.yVel, 0.22), -0.22);
    orbitA.yVel *= KICK_DAMP; orbitB.yVel *= KICK_DAMP;

    // integrate local collision offsets with damping (impulse-based correction)
    const OFFSET_DAMP = 0.94;
    if (!orbitA.offset) orbitA.offset = new THREE.Vector3();
    if (!orbitB.offset) orbitB.offset = new THREE.Vector3();
    if (!orbitA.vel) orbitA.vel = new THREE.Vector3();
    if (!orbitB.vel) orbitB.vel = new THREE.Vector3();
    orbitA.vel.multiplyScalar(OFFSET_DAMP);
    orbitB.vel.multiplyScalar(OFFSET_DAMP);
    // limit free offset velocity to avoid tunneling
    const VEL_MAX = 0.045;
    if (orbitA.vel.length() > VEL_MAX) orbitA.vel.setLength(VEL_MAX);
    if (orbitB.vel.length() > VEL_MAX) orbitB.vel.setLength(VEL_MAX);
    orbitA.offset.add(orbitA.vel);
    orbitB.offset.add(orbitB.vel);
    // enforce strict orbit: no radial (X) offset/velocity towards core
    orbitA.offset.x = 0; orbitB.offset.x = 0;
    orbitA.vel.x = 0; orbitB.vel.x = 0;
    const clampOffset = (v) => { const max = 0.25; if (v.length() > max) v.setLength(max); };
    clampOffset(orbitA.offset); clampOffset(orbitB.offset);

    // compose final local positions: strict orbit radius on X, offsets only in Y/Z
    redPill.position.set(orbitA.radius, orbitA.yOffset + orbitA.offset.y, orbitA.offset.z);
    bluePill.position.set(orbitB.radius, orbitB.yOffset + orbitB.offset.y, orbitB.offset.z);

    // pill-pill collision in world space with realistic impulse response
    const PILL_RADIUS = 0.16;
    const RESTITUTION = 0.85; // bounciness (0..1)
    const FRICTION = 0.25;    // tangential friction for spin/omega coupling
    const posA = new THREE.Vector3();
    const posB = new THREE.Vector3();
    redPill.getWorldPosition(posA);
    bluePill.getWorldPosition(posB);
    const delta = posB.clone().sub(posA);
    const dist = delta.length();
    const minDist = PILL_RADIUS * 2;
    const n = delta.clone().normalize();
    // estimate tangential velocities from angular velocities and add local offset velocities (pivot space -> world)
    const axisA = new THREE.Vector3(0, 1, 0).applyQuaternion(orbitA.pivot.quaternion);
    const axisB = new THREE.Vector3(0, 1, 0).applyQuaternion(orbitB.pivot.quaternion);
    const pivotPosA = new THREE.Vector3(); orbitA.pivot.getWorldPosition(pivotPosA);
    const pivotPosB = new THREE.Vector3(); orbitB.pivot.getWorldPosition(pivotPosB);
    const tanDirA = axisA.clone().cross(posA.clone().sub(pivotPosA)).normalize();
    const tanDirB = axisB.clone().cross(posB.clone().sub(pivotPosB)).normalize();
    const vTanA = tanDirA.multiplyScalar(orbitA.omegaY * orbitA.radius);
    const vTanB = tanDirB.multiplyScalar(orbitB.omegaY * orbitB.radius);
    const vOffA = orbitA.vel.clone().applyQuaternion(orbitA.pivot.quaternion);
    const vOffB = orbitB.vel.clone().applyQuaternion(orbitB.pivot.quaternion);
    const vA_world = vTanA.clone().add(vOffA);
    const vB_world = vTanB.clone().add(vOffB);

    if (dist < minDist) {
      const invQA = orbitA.pivot.quaternion.clone().invert();
      const invQB = orbitB.pivot.quaternion.clone().invert();
      // Always resolve penetration by positional correction (never skip due to cooldown)
      for (let iter = 0; iter < 4; iter++) {
        redPill.getWorldPosition(posA);
        bluePill.getWorldPosition(posB);
        const d2 = posB.clone().sub(posA);
        const dist2 = d2.length();
        if (dist2 >= minDist - 1e-4) break;
        const n2 = d2.clone().normalize();
        const pen2 = minDist - dist2;
        const correction = n2.clone().multiplyScalar(pen2 * 0.5);
        const corrA_local = correction.clone().multiplyScalar(-1).applyQuaternion(invQA);
        const corrB_local = correction.clone().applyQuaternion(invQB);
        // keep radial offset zero
        corrA_local.x = 0; corrB_local.x = 0;
        orbitA.offset.add(corrA_local);
        orbitB.offset.add(corrB_local);
        redPill.position.set(orbitA.radius, orbitA.yOffset + orbitA.offset.y, orbitA.offset.z);
        bluePill.position.set(orbitB.radius, orbitB.yOffset + orbitB.offset.y, orbitB.offset.z);
      }

      // Compute approach and apply impulse only if cooldown allows
      redPill.getWorldPosition(posA);
      bluePill.getWorldPosition(posB);
      const nNow = posB.clone().sub(posA).normalize();
      const vRelNow = vA_world.clone().sub(vB_world);
      const vRel_n = vRelNow.dot(nNow);
      if (vRel_n < 0 && orbitA.cooldown <= 0 && orbitB.cooldown <= 0) {
        const mA = 1.0, mB = 1.0;
        const J = -(1 + RESTITUTION) * vRel_n / (1 / mA + 1 / mB);
        const dVnA_world = nNow.clone().multiplyScalar(-J / mA);
        const dVnB_world = nNow.clone().multiplyScalar(J / mB);
        const dVnA_local = dVnA_world.clone().applyQuaternion(invQA);
        const dVnB_local = dVnB_world.clone().applyQuaternion(invQB);
        orbitA.vel.add(dVnA_local);
        orbitB.vel.add(dVnB_local);

        // Tangential friction impulse limited by mu * J
        const vRel_t = vRelNow.clone().sub(nNow.clone().multiplyScalar(vRel_n));
        const vRel_t_len = vRel_t.length();
        if (vRel_t_len > 1e-6) {
          const tDir = vRel_t.clone().multiplyScalar(1 / vRel_t_len);
          const Jt = Math.min(FRICTION * Math.abs(J), vRel_t_len * 0.5);
          const dVtA_world = tDir.clone().multiplyScalar(-Jt / mA);
          const dVtB_world = tDir.clone().multiplyScalar(Jt / mB);
          const dVtA_local = dVtA_world.clone().applyQuaternion(invQA);
          const dVtB_local = dVtB_world.clone().applyQuaternion(invQB);
          orbitA.vel.add(dVtA_local);
          orbitB.vel.add(dVtB_local);
          // Couple friction to angular velocity along orbit tangents
          const dOmegaA = dVtA_world.dot(tanDirA) / Math.max(orbitA.radius, 1e-6);
          const dOmegaB = dVtB_world.dot(tanDirB) / Math.max(orbitB.radius, 1e-6);
          orbitA.omegaY += dOmegaA;
          orbitB.omegaY += dOmegaB;
          const spinK = 0.06;
          orbitA.spinKick = (orbitA.spinKick || 0) + Jt * spinK;
          orbitB.spinKick = (orbitB.spinKick || 0) + Jt * spinK;
        }

        // Visual vertical kick
        const KICK = 0.10;
        orbitA.yVel -= KICK;
        orbitB.yVel += KICK;

        // Start cooldown for impulse only (not for positional correction)
        orbitA.cooldown = 6; orbitB.cooldown = 6;
      }
    } else {
      // Cooldown decays when not overlapping
      orbitA.cooldown = Math.max(orbitA.cooldown - 1, 0);
      orbitB.cooldown = Math.max(orbitB.cooldown - 1, 0);
    }

    // Spin and glow modulation by pseudo-charge
    const chargeRed = 1.0 + 0.3 * Math.sin(t * 1.6);
    const chargeBlue = 1.0 + 0.3 * Math.cos(t * 1.4);
    // decay spinKick and apply extra spin from collision tangential impulses
    orbitA.spinKick = (orbitA.spinKick || 0) * 0.9;
    orbitB.spinKick = (orbitB.spinKick || 0) * 0.9;
    redPill.rotation.y += 0.02 + orbitA.spinKick * 0.02;
    redPill.rotation.x += 0.015 + orbitA.spinKick * 0.015;
    bluePill.rotation.y += 0.018 + orbitB.spinKick * 0.02;
    bluePill.rotation.x += 0.02 + orbitB.spinKick * 0.015;
    redGlow.intensity = 0.6 * chargeRed;
    blueGlow.intensity = 0.6 * chargeBlue;
  }

  controls.update();
  renderer.render(scene, camera);
  updateMetrics(now);
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

// Initial render
onResize();
renderer.render(scene, camera);

console.log('3D Landing initialized');
log('3D Landing initialized');

// Admin form handling (restored)
const adminForm = document.getElementById('admin-form');
const formStatus = document.getElementById('form-status');
if (adminForm) {
  adminForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('name')?.value.trim();
    const email = document.getElementById('email')?.value.trim();
    const role = document.getElementById('role')?.value;
    const message = document.getElementById('message')?.value.trim();
    const access = document.getElementById('access')?.value.trim();

    const errs = [];
    if (!name) errs.push('Name required');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.push('Valid email required');
    if (!role) errs.push('Role required');
    if (!message) errs.push('Message required');
    if (!access || access.length < 6) errs.push('Access key ≥ 6 chars');

    if (errs.length) {
      if (formStatus) formStatus.textContent = 'Error: ' + errs.join(', ');
      log('Form', 'Validation failed: ' + errs.join('; '));
      return;
    }

    if (formStatus) formStatus.textContent = 'Submitting…';
    log('Form', `Submitting: ${name} <${email}> role=${role}`);

    setTimeout(() => {
      if (formStatus) formStatus.textContent = 'Submitted successfully (demo)';
      log('Form', 'Submission ok (demo only).');
      adminForm.reset();
    }, 600);
  });
}

// Flying 3D pills (red/blue) — pivoted orbits without visible rings
const redPillMat = new THREE.MeshStandardMaterial({ color: '#ff3366', emissive: '#22000a', emissiveIntensity: 0.35, metalness: 0.4, roughness: 0.4 });
const bluePillMat = new THREE.MeshStandardMaterial({ color: '#3366ff', emissive: '#000a22', emissiveIntensity: 0.35, metalness: 0.4, roughness: 0.4 });
const redPill = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.26, 8, 16), redPillMat);
const bluePill = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.26, 8, 16), bluePillMat);
const redGlow = new THREE.PointLight(0xff3366, 0.7, 2.5);
const blueGlow = new THREE.PointLight(0x3366ff, 0.7, 2.5);
redPill.add(redGlow); bluePill.add(blueGlow);

function makePivotOrbit(radius, tiltEuler, omegaY) {
  const pivot = new THREE.Group();
  pivot.rotation.copy(tiltEuler);
  root.add(pivot);
  return {
    pivot,
    radius,
    angleY: 0,
    omegaY,
    yOffset: 0,
    yVel: 0,
    cooldown: 0,
    offset: new THREE.Vector3(0, 0, 0),
    vel: new THREE.Vector3(0, 0, 0),
    spinKick: 0,
  };
}

const orbitA = makePivotOrbit(Math.max(coreSize * 0.7 + 0.25, 0.85), new THREE.Euler(0.35, 0.0, 0.15), 0.012);
const orbitB = makePivotOrbit(Math.max(coreSize * 0.7 + 0.35, 1.05), new THREE.Euler(-0.25, 0.6, -0.1), -0.009);

// Place pills on orbit pivots (offset by radius along local X)
redPill.position.set(orbitA.radius, 0, 0);
bluePill.position.set(orbitB.radius, 0, 0);
orbitA.pivot.add(redPill);
orbitB.pivot.add(bluePill);
