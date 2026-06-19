import * as THREE from 'three';

/* ============================================================
   CORE, renderer, camera, tweens, input, audio, particles
   ============================================================ */
const $ = id => document.getElementById(id);
const rand = (a=1, b) => b === undefined ? Math.random()*a : a + Math.random()*(b-a);
const randi = (a, b) => Math.floor(rand(a, b+1));
const pick = arr => arr[Math.floor(Math.random()*arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b-a)*t;

const renderer = new THREE.WebGLRenderer({ canvas: $('c'), antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.3;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1c1008);
scene.fog = new THREE.Fog(0x1c1008, 30, 60);

const camera = new THREE.PerspectiveCamera(46, innerWidth/innerHeight, 0.1, 100);
camera.position.set(0, 7, 18);
const camTarget = new THREE.Vector3(0, 2, 0);

function resize() {
  camera.aspect = innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
}
addEventListener('resize', resize); resize();

/* ---------- tween system ---------- */
const tweens = [];
const Ease = {
  outCubic: t => 1 - Math.pow(1-t, 3),
  outBack:  t => { const s = 1.7; t -= 1; return t*t*((s+1)*t + s) + 1; },
  inOut:    t => t < .5 ? 2*t*t : 1 - Math.pow(-2*t+2, 2)/2,
  outElastic: t => t === 0 ? 0 : t === 1 ? 1 : Math.pow(2,-10*t) * Math.sin((t*10-.75)*(2*Math.PI/3)) + 1,
};
function tween(dur, onUpdate, { ease = Ease.outCubic, onDone, delay = 0, tag } = {}) {
  const tw = { t: -delay, dur, onUpdate, ease, onDone, dead: false, tag };
  tweens.push(tw);
  return tw;
}
function killTweens(tag) {
  tweens.forEach(tw => { if (tw.tag === tag) tw.dead = true; });
}
function tweenVec(v, to, dur, opts = {}) {
  const from = v.clone();
  return tween(dur, k => v.lerpVectors(from, to, k), opts);
}
function updateTweens(dt) {
  for (let i = tweens.length-1; i >= 0; i--) {
    const tw = tweens[i];
    if (tw.dead) { tweens.splice(i,1); continue; }
    tw.t += dt;
    if (tw.t < 0) continue;
    const k = clamp(tw.t/tw.dur, 0, 1);
    tw.onUpdate(tw.ease(k));
    if (k >= 1) { tweens.splice(i,1); tw.onDone && tw.onDone(); }
  }
}
// springy pop-in for a mesh
function popIn(obj, scale=1, dur=.5) {
  obj.scale.setScalar(.01);
  tween(dur, k => obj.scale.setScalar(scale*k), { ease: Ease.outBack });
}

/* ---------- camera views (owner POV, facing the dining room) ---------- */
const VIEWS = {
  title:   { pos: new THREE.Vector3(12, 7.5, 14),  tgt: new THREE.Vector3(0, 2.4, 0) },
  counter: { pos: new THREE.Vector3(0, 3.8, -1.5), tgt: new THREE.Vector3(0, 1.85, 6) },
  fry:     { pos: new THREE.Vector3(-6.4, 5.5, -4.9), tgt: new THREE.Vector3(-6.4, 1.9, -0.1) },
  sauce:   { pos: new THREE.Vector3(0, 4.5, -3.6), tgt: new THREE.Vector3(0, 1.4, 0) },
  build:   { pos: new THREE.Vector3(6.4, 4.5, -3.6), tgt: new THREE.Vector3(6.35, 1.4, 0) },
};
let curView = 'title';
// free-look: drag the canvas to glance around the shop from where you stand
const look = { yaw: 0, pitch: 0, yawT: 0, pitchT: 0 };
function goView(name, dur = .85) {
  if (!VIEWS[name]) return;
  curView = name;
  const v = VIEWS[name];
  killTweens('cam');
  tweenVec(camera.position, v.pos, dur, { ease: Ease.inOut, tag: 'cam' });
  tweenVec(camTarget, v.tgt, dur, { ease: Ease.inOut, tag: 'cam' });
  look.yawT = 0; look.pitchT = 0;
  onViewChanged(name); // defined in game logic
}
const _lookDir = new THREE.Vector3();
function updateCamera(dt) {
  const k = Math.min(1, dt*9);
  look.yaw = lerp(look.yaw, look.yawT, k);
  look.pitch = lerp(look.pitch, look.pitchT, k);
  _lookDir.subVectors(camTarget, camera.position);
  const horiz = Math.hypot(_lookDir.x, _lookDir.z);
  const yaw = Math.atan2(_lookDir.x, _lookDir.z) + look.yaw;
  const pitch = clamp(Math.atan2(_lookDir.y, horiz) + look.pitch, -1.25, 1.25);
  const cp = Math.cos(pitch);
  camera.lookAt(
    camera.position.x + Math.sin(yaw)*cp*10,
    camera.position.y + Math.sin(pitch)*10,
    camera.position.z + Math.cos(yaw)*cp*10);
}

function worldToScreen(v3) {
  const v = v3.clone().project(camera);
  return { x: (v.x*.5+.5)*innerWidth, y: (-v.y*.5+.5)*innerHeight, behind: v.z > 1 };
}

/* ---------- clickable 3D objects + free-look input ---------- */
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const clickables = []; // { mesh, onClick, enabled(), label, dragToss }
function registerClick(mesh, onClick, enabled = () => true, label = null, opts = {}) {
  clickables.push({ mesh, onClick, enabled, label, dragToss: !!opts.dragToss });
}
function removeClickable(mesh) {
  const i = clickables.findIndex(c => c.mesh === mesh);
  if (i >= 0) clickables.splice(i, 1);
}
function pickClickable(clientX, clientY) {
  pointer.set((clientX/innerWidth)*2-1, -(clientY/innerHeight)*2+1);
  raycaster.setFromCamera(pointer, camera);
  for (const c of clickables) {
    if (!c.enabled() || !c.mesh.visible) continue;
    if (raycaster.intersectObject(c.mesh, true).length) return c;
  }
  return null;
}
const drag = { down: false, x: 0, y: 0, moved: false, hit: null, tossY: 0 };
addEventListener('pointerdown', e => {
  if (e.target !== $('c')) return;
  drag.down = true; drag.moved = false;
  drag.x = e.clientX; drag.y = e.clientY; drag.tossY = e.clientY;
  drag.hit = pickClickable(e.clientX, e.clientY);
});
addEventListener('pointermove', e => {
  if (drag.down) {
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 6) return;
    if (drag.hit && drag.hit.dragToss) {
      // flicking upward over the bowl tosses the wings
      if (drag.tossY - e.clientY > 55) { drag.hit.onClick(); drag.tossY = e.clientY + 25; }
      drag.moved = true;
      return;
    }
    drag.moved = true;
    look.yawT = clamp(look.yawT - dx*.0042, -1.45, 1.45);
    look.pitchT = clamp(look.pitchT + dy*.0035, -.7, .55);
    drag.x = e.clientX; drag.y = e.clientY;
  } else if (e.target === $('c')) {
    // hover feedback for clickable things in the shop
    const hit = pickClickable(e.clientX, e.clientY);
    $('c').style.cursor = hit ? 'pointer' : 'grab';
    const hl = $('hoverLabel');
    if (hit && hit.label) {
      hl.textContent = typeof hit.label === 'function' ? hit.label() : hit.label;
      hl.style.display = 'block';
      hl.style.left = e.clientX + 'px';
      hl.style.top = e.clientY + 'px';
    } else hl.style.display = 'none';
  }
});
addEventListener('pointerup', e => {
  if (drag.down && !drag.moved && drag.hit && drag.hit.enabled()) drag.hit.onClick();
  drag.down = false; drag.hit = null;
});

/* ---------- canvas texture helpers ---------- */
function makeCanvas(w, h, draw) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  draw(cv.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
const softCircleTex = makeCanvas(64, 64, (g) => {
  const gr = g.createRadialGradient(32,32,2, 32,32,30);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0,0,64,64);
});
const starTex = makeCanvas(64, 64, (g) => {
  g.translate(32,34); g.fillStyle = '#ffd34d';
  g.shadowColor = '#ff9d00'; g.shadowBlur = 8;
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i%2 ? 11 : 26, a = i/10*Math.PI*2 - Math.PI/2;
    g[i ? 'lineTo' : 'moveTo'](Math.cos(a)*r, Math.sin(a)*r);
  }
  g.closePath(); g.fill();
});

/* ---------- particles ---------- */
const particles = [];
function spawnParticle({ pos, vel, life = 1, size = .2, color = 0xffffff, tex = softCircleTex,
                         gravity = 0, drag = 1, grow = 0, opacity = .9 }) {
  const m = new THREE.Sprite(new THREE.SpriteMaterial({
    map: tex, color, transparent: true, opacity, depthWrite: false,
  }));
  m.position.copy(pos);
  m.scale.setScalar(size);
  scene.add(m);
  particles.push({ m, vel: vel.clone(), life, maxLife: life, gravity, drag, grow, baseOp: opacity });
}
function updateParticles(dt) {
  for (let i = particles.length-1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    if (p.life <= 0) {
      scene.remove(p.m); p.m.material.dispose();
      particles.splice(i,1); continue;
    }
    p.vel.y -= p.gravity*dt;
    p.vel.multiplyScalar(Math.pow(p.drag, dt*60));
    p.m.position.addScaledVector(p.vel, dt);
    const k = p.life/p.maxLife;
    p.m.material.opacity = p.baseOp*k;
    if (p.grow) p.m.scale.addScalar(p.grow*dt);
  }
}
function burstSteam(pos, n = 3) {
  for (let i = 0; i < n; i++) spawnParticle({
    pos: pos.clone().add(new THREE.Vector3(rand(-.3,.3), 0, rand(-.3,.3))),
    vel: new THREE.Vector3(rand(-.2,.2), rand(.8,1.6), rand(-.2,.2)),
    life: rand(.8,1.6), size: rand(.25,.5), color: 0xfff4e0, opacity: .35, grow: .5,
  });
}
function burstSplat(pos, color, n = 10) {
  for (let i = 0; i < n; i++) spawnParticle({
    pos: pos.clone(), color,
    vel: new THREE.Vector3(rand(-1.6,1.6), rand(1,3.2), rand(-1.6,1.6)),
    life: rand(.3,.7), size: rand(.08,.22), gravity: 9, opacity: .95,
  });
}
function burstStars(pos, n = 8) {
  for (let i = 0; i < n; i++) spawnParticle({
    pos: pos.clone(), tex: starTex,
    vel: new THREE.Vector3(rand(-2,2), rand(1.5,4), rand(-2,2)),
    life: rand(.6,1.1), size: rand(.25,.5), gravity: 4, opacity: 1,
  });
}
function burstConfetti(pos, n = 36) {
  for (let i = 0; i < n; i++) spawnParticle({
    pos: pos.clone().add(new THREE.Vector3(rand(-1,1), rand(0,1), rand(-1,1))),
    color: pick([0xff5d5d, 0xffd34d, 0x7ed957, 0x5dc8ff, 0xd98cff]),
    vel: new THREE.Vector3(rand(-2.5,2.5), rand(2,6), rand(-2.5,2.5)),
    life: rand(.9,1.8), size: rand(.1,.2), gravity: 6, drag: .98, opacity: 1,
  });
}

/* ---------- audio (all synthesized) ---------- */
const AudioFX = {
  ctx: null, master: null, musicGain: null, muted: false,
  noiseBuf: null, sizzleSrc: null, sizzleGain: null, musicTimer: null, step: 0,
  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.master = this.ctx.createGain();
    this.master.gain.value = .85;
    this.master.connect(this.ctx.destination);
    const len = this.ctx.sampleRate;
    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random()*2-1;
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = .14;
    this.musicGain.connect(this.master);
    this.startMusic();
  },
  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : .85;
  },
  tone(freq, dur = .15, { type = 'sine', vol = .3, slide = 0, when = 0 } = {}) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + when;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq+slide), t+dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(.0001, t+dur);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t+dur+.05);
  },
  noise(dur = .2, { freq = 2000, q = 1, vol = .3, type = 'bandpass', when = 0 } = {}) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + when;
    const s = this.ctx.createBufferSource(); s.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(.0001, t+dur);
    s.connect(f); f.connect(g); g.connect(this.master);
    s.start(t); s.stop(t+dur+.05);
  },
  click()  { this.tone(880, .06, { type:'triangle', vol:.15 }); },
  pop()    { this.tone(420, .09, { type:'square', vol:.12, slide:300 }); },
  plop()   { this.tone(260, .14, { type:'sine', vol:.3, slide:-140 }); this.noise(.08, { freq:900, vol:.1 }); },
  whoosh() { this.noise(.28, { freq:1200, q:.6, vol:.25 }); },
  splat()  { this.noise(.16, { freq:500, q:.8, vol:.3 }); this.tone(180, .12, { vol:.2, slide:-80 }); },
  ding()   { this.tone(1318, .5, { type:'sine', vol:.25 }); this.tone(1318*2, .4, { vol:.08 }); },
  buzz()   { this.tone(110, .35, { type:'sawtooth', vol:.22 }); this.tone(104, .35, { type:'sawtooth', vol:.22 }); },
  chaching() {
    this.tone(1244, .1, { type:'square', vol:.12 });
    this.tone(1568, .35, { type:'square', vol:.12, when:.08 });
    this.noise(.25, { freq:6000, vol:.12, when:.05 });
  },
  jingle() {
    [523, 659, 784, 1046].forEach((f, i) => this.tone(f, .22, { type:'triangle', vol:.2, when: i*.09 }));
  },
  fanfare() {
    [523, 659, 784, 1046, 1318, 1568].forEach((f, i) => this.tone(f, .3, { type:'triangle', vol:.22, when: i*.08 }));
    this.noise(.6, { freq:7000, vol:.08, when:.3 });
  },
  sad() { [392, 330, 262].forEach((f, i) => this.tone(f, .3, { type:'triangle', vol:.18, when: i*.16 })); },
  sizzleOn() {
    if (!this.ctx || this.sizzleSrc) return;
    const s = this.ctx.createBufferSource(); s.buffer = this.noiseBuf; s.loop = true;
    const f = this.ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 3500;
    const g = this.ctx.createGain(); g.gain.value = .07;
    s.connect(f); f.connect(g); g.connect(this.master);
    s.start();
    this.sizzleSrc = s; this.sizzleGain = g;
  },
  sizzleOff() {
    if (this.sizzleSrc) {
      this.sizzleGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime+.4);
      const src = this.sizzleSrc;
      setTimeout(() => src.stop(), 500);
      this.sizzleSrc = null;
    }
  },
  // chill kitchen groove, 8-step loop
  startMusic() {
    if (this.musicTimer) return;
    const bass = [110, 0, 110, 131, 0, 98, 110, 0];
    const stepDur = .24;
    let next = this.ctx.currentTime + .1;
    const sched = () => {
      while (next < this.ctx.currentTime + .4) {
        const i = this.step % 8;
        const when = next - this.ctx.currentTime;
        if (bass[i]) {
          const t = this.ctx.currentTime + when;
          const o = this.ctx.createOscillator(), g = this.ctx.createGain();
          o.type = 'triangle'; o.frequency.value = bass[i];
          g.gain.setValueAtTime(.5, t); g.gain.exponentialRampToValueAtTime(.001, t+.2);
          o.connect(g); g.connect(this.musicGain); o.start(t); o.stop(t+.25);
        }
        if (i % 2 === 0) { // hat
          const t = this.ctx.currentTime + when;
          const s = this.ctx.createBufferSource(); s.buffer = this.noiseBuf;
          const f = this.ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 8000;
          const g = this.ctx.createGain();
          g.gain.setValueAtTime(i % 4 === 0 ? .12 : .05, t);
          g.gain.exponentialRampToValueAtTime(.001, t+.05);
          s.connect(f); f.connect(g); g.connect(this.musicGain);
          s.start(t); s.stop(t+.08);
        }
        this.step++; next += stepDur;
      }
    };
    this.musicTimer = setInterval(sched, 120);
  },
};
$('muteBtn').addEventListener('click', () => {
  AudioFX.init();
  AudioFX.setMuted(!AudioFX.muted);
  $('muteBtn').classList.toggle('muted', AudioFX.muted);
});

/* ---------- UI helpers ---------- */
function showToast(msg, kind = '', dur = 2600) {
  const el = document.createElement('div');
  el.className = 'toast ' + kind;
  el.innerHTML = msg;
  $('toasts').appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .4s'; }, dur);
  setTimeout(() => el.remove(), dur+450);
}
function moneyPop(screenX, screenY, txt) {
  const el = document.createElement('div');
  el.className = 'moneyPop';
  el.textContent = txt;
  el.style.left = screenX+'px'; el.style.top = screenY+'px';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1500);
}
function bigBanner(txt, color = '#ffd34d') {
  const el = $('bigBanner');
  el.textContent = txt;
  el.style.color = color;
  el.classList.remove('show');
  void el.offsetWidth; // restart animation
  el.classList.add('show');
}
