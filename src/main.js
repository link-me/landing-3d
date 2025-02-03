import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const app = document.getElementById('app');
const fpsEl = document.getElementById('fps');
const objsEl = document.getElementById('objects');
const themeBtn = document.getElementById('theme');
const ctaBtn = document.getElementById('cta');

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
app.appendChild(renderer.domElement);

// Scene & Camera
const scene = new THREE.Scene();
scene.background = new THREE.Color('#0e0f12');

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0.8, 0.9, 2.2);

// Lights
const hemi = new THREE.HemisphereLight(0xffffff, 0x202030, 0.9);
const dir = new THREE.DirectionalLight(0xffffff, 1.0);
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

// Hero object: a smooth torus knot with subtle glow
const matPrimary = new THREE.MeshStandardMaterial({
  color: new THREE.Color('#3aa0ff'),
  roughness: 0.3,
  metalness: 0.6,
  emissive: new THREE.Color('#0a1a2a'),
  emissiveIntensity: 0.35,
});
const hero = new THREE.Mesh(new THREE.TorusKnotGeometry(0.6, 0.22, 200, 24), matPrimary);
hero.rotation.set(0.3, -0.3, 0);
root.add(hero);

// Secondary objects: small orbs orbiting around
const orbMat = new THREE.MeshStandardMaterial({ color: '#ffd166', roughness: 0.6, metalness: 0.2 });
const orbs = [];
for (let i = 0; i < 8; i++) {
  const r = 1.4 + Math.random() * 0.35;
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.06, 24, 24), orbMat);
  m.position.set(Math.cos(i) * r, 0.25 + (Math.sin(i * 1.3) * 0.25), Math.sin(i) * r);
  root.add(m);
  orbs.push({ mesh: m, speed: 0.6 + Math.random() * 0.8, angle: Math.random() * Math.PI * 2, radius: r });
}

// Background: starfield points
const starGeo = new THREE.BufferGeometry();
const starCount = 800;
const positions = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
  const ix = i * 3;
  const r = 30 * Math.random() + 10;
  const a = Math.random() * Math.PI * 2;
  const y = (Math.random() - 0.5) * 8;
  positions[ix] = Math.cos(a) * r;
  positions[ix + 1] = y;
  positions[ix + 2] = Math.sin(a) * r;
}
starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
const starMat = new THREE.PointsMaterial({ color: '#6c7a89', size: 0.02, sizeAttenuation: true });
const stars = new THREE.Points(starGeo, starMat);
scene.add(stars);

// Parallax on scroll
let scrollY = 0;
window.addEventListener('scroll', () => {
  scrollY = window.scrollY || document.documentElement.scrollTop || 0;
});

// Theme toggle
let isDark = true;
function applyTheme() {
  if (isDark) {
    scene.background = new THREE.Color('#0e0f12');
    matPrimary.color.set('#3aa0ff');
    starMat.color.set('#6c7a89');
    document.body.style.background = '#0e0f12';
    document.body.style.color = '#e8e8ea';
  } else {
    scene.background = new THREE.Color('#f5f6f8');
    matPrimary.color.set('#0d6efd');
    starMat.color.set('#a0a8b8');
    document.body.style.background = '#f5f6f8';
    document.body.style.color = '#111';
  }
}
applyTheme();
themeBtn.addEventListener('click', () => { isDark = !isDark; applyTheme(); });

// CTA scroll
ctaBtn.addEventListener('click', () => {
  const el = document.getElementById('info');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
});

// Resize
function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
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
  // Main hero animation
  hero.rotation.x += 0.0025;
  hero.rotation.y += 0.0035;
  // Orbs circular movement
  orbs.forEach((o) => {
    o.angle += 0.01 * o.speed;
    o.mesh.position.x = Math.cos(o.angle) * o.radius;
    o.mesh.position.z = Math.sin(o.angle) * o.radius;
    o.mesh.position.y = 0.25 + Math.sin(o.angle * 2.0) * 0.2;
  });
  // Parallax based on scroll
  const py = Math.min(scrollY / window.innerHeight, 1.0);
  camera.position.y = 0.9 + py * 0.6;
  camera.position.z = 2.2 + py * 0.8;

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
