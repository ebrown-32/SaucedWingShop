/* ============================================================
   GAME DATA
   ============================================================ */
const SAUCES = [
  { id:'bbq',       name:'Smoky BBQ',       color:0x7a3014, day:1 },
  { id:'buffalo',   name:'Classic Buffalo', color:0xd8401c, day:1 },
  { id:'honey',     name:'Honey Garlic',    color:0xd9952f, day:2 },
  { id:'teriyaki',  name:'Teriyaki Glaze',  color:0x46281a, day:3 },
  { id:'mango',     name:'Mango Habanero',  color:0xe8842a, day:4 },
  { id:'atomic',    name:'Atomic Inferno',  color:0xff2200, day:4, glow:true },
  { id:'parm',      name:'Garlic Parmesan', color:0xe8dcae, day:5 },
  { id:'lemonpep',  name:'Lemon Pepper',    color:0xd9c24a, day:6 },
  { id:'wasabi',    name:'Wasabi Rush',     color:0x86b03c, day:6, glow:true },
  { id:'maple',     name:'Maple Sriracha',  color:0xb5532a, day:7 },
  { id:'gochujang', name:'Korean Gochujang',color:0xb83018, day:8 },
  { id:'nashville', name:'Nashville Hot',   color:0xd83410, day:9, glow:true },
  { id:'sweetchili',name:'Sweet Thai Chili',color:0xd84a3a, day:10 },
  { id:'carolina',  name:'Carolina Gold',   color:0xe0a838, day:11 },
];
const SIDES = [
  { id:'fries',   name:'Crispy Fries',  color:0xf2c54a, day:1 },
  { id:'celery',  name:'Celery Sticks', color:0x9cd45e, day:2 },
  { id:'carrots', name:'Carrot Coins',  color:0xf08a2c, day:3 },
  { id:'rings',   name:'Onion Rings',   color:0xe8c87a, day:4 },
  { id:'tots',    name:'Tater Tots',    color:0xd9a24a, day:5 },
  { id:'mozz',    name:'Mozza Sticks',  color:0xe8c87a, day:7 },
  { id:'slaw',    name:'Coleslaw',      color:0xc8d96a, day:9 },
];
const DIPS = [
  { id:'none',    name:'No dip',         color:0x888888, day:1 },
  { id:'ranch',   name:'Cool Ranch',     color:0xf2efe2, day:1 },
  { id:'blue',    name:'Blue Cheese',    color:0xdfe6ee, day:1 },
  { id:'mustard', name:'Honey Mustard',  color:0xe2b53b, day:3 },
  { id:'cheese',  name:'Nacho Cheese',   color:0xf0a02c, day:5 },
  { id:'sriracha',name:'Sriracha Mayo',  color:0xe8763a, day:7 },
  { id:'aioli',   name:'Garlic Aioli',   color:0xeae2c0, day:9 },
];
// garnishes, the finishing touch that makes plating a craft
const GARNISHES = [
  { id:'none',    name:'No garnish', color:0x888888, day:1 },
  { id:'lemon',   name:'Lemon Wedge', color:0xf2e24a, day:2 },
  { id:'parsley', name:'Parsley',     color:0x4a9a3a, day:3 },
  { id:'chili',   name:'Chili Pepper',color:0xd02818, day:6 },
];
const sauceById   = id => SAUCES.find(s => s.id === id);
const sideById    = id => SIDES.find(s => s.id === id);
const dipById     = id => DIPS.find(s => s.id === id);
const garnishById = id => GARNISHES.find(s => s.id === id);

/* ============================================================
   ENVIRONMENT, the wing shop, seen from behind the counter.
   The owner works at a long prep counter (z ≈ -0.3) and looks
   out over the serving counter (z = 2.6) into the dining room.
   ============================================================ */
const M = { // shared materials
  steel:  new THREE.MeshStandardMaterial({ color:0xb8bec4, metalness:.85, roughness:.35 }),
  steelDark: new THREE.MeshStandardMaterial({ color:0x8d949c, metalness:.75, roughness:.45 }),
  wood:   new THREE.MeshStandardMaterial({ color:0x8a5a30, roughness:.7 }),
  woodDark: new THREE.MeshStandardMaterial({ color:0x5c3a1c, roughness:.75 }),
  red:    new THREE.MeshStandardMaterial({ color:0xc23b22, roughness:.55 }),
  cream:  new THREE.MeshStandardMaterial({ color:0xf2e2c4, roughness:.85 }),
  black:  new THREE.MeshStandardMaterial({ color:0x23211e, roughness:.8 }),
};
function box(w, h, d, mat, x=0, y=0, z=0, castShadow=true) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = castShadow; m.receiveShadow = true;
  return m;
}
function cyl(rt, rb, h, mat, x=0, y=0, z=0, seg=24) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

/* ---- environment reflections (metals need something to mirror) ---- */
{
  const envScene = new THREE.Scene();
  envScene.add(new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10),
    new THREE.MeshBasicMaterial({ side: THREE.BackSide, color: 0x2a2c30 })));
  const panel = (c, x, y, z, w, h) => {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: c }));
    p.position.set(x, y, z); p.lookAt(0, 0, 0);
    envScene.add(p);
  };
  panel(0xfff2dc, 0, 4.9, 0, 6, 6);     // warm ceiling glow
  panel(0xff8a4a, -4.9, 2, -2, 3, 3);   // hot accent
  panel(0x6a8ab0, 4.9, 2, 2, 3, 3);     // cool kick
  panel(0xfff8ee, 0, 1.5, 4.9, 5, 2.5); // window light
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(envScene, .04).texture;
  scene.environmentIntensity = .55;
  pmrem.dispose();
}

/* ---- lights ---- */
scene.add(new THREE.HemisphereLight(0xffe8c8, 0x33281e, .75));
const keyLight = new THREE.DirectionalLight(0xfff0dc, 1.9);
keyLight.position.set(7, 13, 7);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.left = -17; keyLight.shadow.camera.right = 17;
keyLight.shadow.camera.top = 18;   keyLight.shadow.camera.bottom = -18;
keyLight.shadow.bias = -0.0005;
scene.add(keyLight);
// warm fill over the work counter (no models, just light)
[-5, 5].forEach(x => {
  const pl = new THREE.PointLight(0xffd9a8, 9, 8, 1.8);
  pl.position.set(x, 4.3, -0.6);
  scene.add(pl);
});
// pendant lamps over the dining tables
const lampLights = [];
[[-7, 8.5], [7, 8.5], [0, 12.5]].forEach(([x, z]) => {
  const pl = new THREE.PointLight(0xffb35c, 12, 9, 1.8);
  pl.position.set(x, 4.4, z);
  scene.add(pl);
  lampLights.push(pl);
  const lamp = new THREE.Group();
  lamp.add(cyl(.02, .02, 1.6, M.black, 0, 5.6, 0));
  lamp.add(cyl(.18, .55, .5, new THREE.MeshStandardMaterial({ color:0xc23b22, roughness:.4 }), 0, 4.85, 0));
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(.13, 12, 10),
    new THREE.MeshStandardMaterial({ color:0xffe2a8, emissive:0xffc46a, emissiveIntensity:2.4 }));
  bulb.position.set(0, 4.62, 0);
  lamp.add(bulb);
  lamp.position.set(x, 0, z);
  scene.add(lamp);
});

/* ---- floor, walls ---- */
const floorTex = makeCanvas(512, 512, (g) => {
  const n = 8, s = 512/n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    g.fillStyle = (i+j)%2 ? '#cfc7b6' : '#2c2925';
    g.fillRect(i*s, j*s, s, s);
  }
  g.fillStyle = 'rgba(0,0,0,.05)';
  for (let i = 0; i < 400; i++) g.fillRect(Math.random()*512, Math.random()*512, 2, 2);
});
floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
floorTex.repeat.set(3.4, 3);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 26),
  new THREE.MeshStandardMaterial({ map: floorTex, roughness:.6 }));
floor.rotation.x = -Math.PI/2;
floor.position.set(0, 0, 4);
floor.receiveShadow = true;
scene.add(floor);

const wallMat = new THREE.MeshStandardMaterial({ color:0x4a505c, roughness:.9 });
const wallMat2 = new THREE.MeshStandardMaterial({ color:0x8a2f22, roughness:.9 });
// a solid wall panel (built in its own XY plane, extruded through `thickness`)
// with real rectangular openings cut out, these become the window reveals.
function makeWallWithHoles(w, h, thickness, holes) {
  const shape = new THREE.Shape();
  shape.moveTo(-w/2, -h/2); shape.lineTo(w/2, -h/2);
  shape.lineTo(w/2, h/2); shape.lineTo(-w/2, h/2); shape.lineTo(-w/2, -h/2);
  for (const o of holes) {
    const p = new THREE.Path();
    p.moveTo(o.x - o.w/2, o.y - o.h/2); p.lineTo(o.x + o.w/2, o.y - o.h/2);
    p.lineTo(o.x + o.w/2, o.y + o.h/2); p.lineTo(o.x - o.w/2, o.y + o.h/2);
    p.lineTo(o.x - o.w/2, o.y - o.h/2);
    shape.holes.push(p);
  }
  const geo = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false });
  geo.translate(0, 0, -thickness/2);
  const m = new THREE.Mesh(geo, wallMat);
  m.castShadow = false; m.receiveShadow = true;
  return m;
}
scene.add(box(30, 8, .4, wallMat, 0, 4, -8.2, false));            // back wall (solid)
scene.add(box(30, 2.2, .5, wallMat2, 0, 1.1, -8.15, false));
scene.add(box(30, 2.2, .5, wallMat2, 0, 1.1, 17.1, false));       // front wainscot
// front wall with three window openings (door area at x=11.5 stays solid)
const frontWall = makeWallWithHoles(30, 8, .4,
  [-11.5, -5, 5].map(x => ({ x, y: -0.4, w: 3.72, h: 2.72 })));
frontWall.position.set(0, 4, 17.2);
scene.add(frontWall);
// side walls, local x maps to world z (z = 6 and 11), so x = ±(z-4)
const leftWall = makeWallWithHoles(26, 8, .4, [6, 11].map(z => ({ x: z-4, y: -0.4, w: 3.32, h: 2.52 })));
leftWall.position.set(-14.5, 4, 4); leftWall.rotation.y = -Math.PI/2;
scene.add(leftWall);
const rightWall = makeWallWithHoles(26, 8, .4, [6, 11].map(z => ({ x: -(z-4), y: -0.4, w: 3.32, h: 2.52 })));
rightWall.position.set(14.5, 4, 4); rightWall.rotation.y = Math.PI/2;
scene.add(rightWall);
/* ---- the city outside the windows (animated canvas) ---- */
const cityCv = document.createElement('canvas');
cityCv.width = 512; cityCv.height = 352;
const cityTex = new THREE.CanvasTexture(cityCv);
cityTex.colorSpace = THREE.SRGBColorSpace;
const CITY_HORIZON = 250;
const cityState = {
  t: 0, acc: 0,
  stars: Array.from({ length: 60 }, () => [Math.random()*512, Math.random()*110, Math.random()]),
  far: [], near: [], cars: [],
};
{
  let x = 0;
  while (x < 512) { // distant skyline
    const w = 30 + Math.random()*55;
    cityState.far.push({ x, w, h: 60 + Math.random()*95 });
    x += w + 2;
  }
  x = -10;
  while (x < 512) { // near block with window grids
    const w = 46 + Math.random()*64, h = 95 + Math.random()*140;
    const cols = Math.max(2, Math.floor(w/16)), rows = Math.max(3, Math.floor(h/20));
    const lit = Array.from({ length: cols*rows }, () => Math.random() < .42 ? 1 : 0);
    cityState.near.push({
      x, w, h, cols, rows, lit, litT: lit.slice(),
      neon: Math.random() < .22 ? ['#ff4dd2', '#4dd2ff', '#ffd34d', '#7aff8a'][Math.floor(Math.random()*4)] : null,
    });
    x += w + 6 + Math.random()*14;
  }
  for (let i = 0; i < 6; i++)
    cityState.cars.push({ x: Math.random()*512, dir: i%2 ? 1 : -1, speed: 70 + Math.random()*55 });
}
function drawCity() {
  const g = cityCv.getContext('2d');
  const W = 512, H = 352, hz = CITY_HORIZON;
  const sky = g.createLinearGradient(0, 0, 0, hz);
  sky.addColorStop(0, '#141d44'); sky.addColorStop(.45, '#3a2a5e');
  sky.addColorStop(.78, '#b04a32'); sky.addColorStop(1, '#e8923a');
  g.fillStyle = sky; g.fillRect(0, 0, W, hz);
  cityState.stars.forEach(([x, y, tw]) => {
    // slow, gentle breathing twinkle rather than a hard blink
    g.fillStyle = `rgba(255,255,255,${(.35 + .3*Math.sin(cityState.t*.5 + tw*6)).toFixed(3)})`;
    g.fillRect(x, y, 1.5, 1.5);
  });
  g.shadowColor = '#f5efd8'; g.shadowBlur = 14;
  g.fillStyle = '#e9e3cc';
  g.beginPath(); g.arc(432, 54, 15, 0, 7); g.fill();
  g.shadowBlur = 0;
  g.fillStyle = '#2a2f4e';
  cityState.far.forEach(b => g.fillRect(b.x, hz - b.h, b.w, b.h));
  cityState.near.forEach(b => {
    g.fillStyle = '#181b2c';
    g.fillRect(b.x, hz - b.h, b.w, b.h);
    const cw = b.w/b.cols, ch = b.h/b.rows;
    for (let c = 0; c < b.cols; c++) for (let r = 0; r < b.rows; r++) {
      const v = b.lit[c*b.rows + r];
      if (v <= 0) continue;
      // each lit window holds a warm glow; v is an eased 0..1 brightness
      g.fillStyle = `rgba(228,188,108,${(v*.78).toFixed(3)})`;
      g.fillRect(b.x + c*cw + 3, hz - b.h + r*ch + 4, cw - 6, Math.max(3, ch - 8));
    }
    if (b.neon) { // dim rooftop neon strip
      g.shadowColor = b.neon; g.shadowBlur = 7;
      g.globalAlpha = .7;
      g.fillStyle = b.neon;
      g.fillRect(b.x + 6, hz - b.h - 6, Math.min(42, b.w - 12), 3);
      g.globalAlpha = 1; g.shadowBlur = 0;
    }
  });
  // atmospheric haze settling over the rooftops, pushes the city back
  const haze = g.createLinearGradient(0, hz - 70, 0, hz);
  haze.addColorStop(0, 'rgba(74,52,58,0)'); haze.addColorStop(1, 'rgba(120,78,70,.35)');
  g.fillStyle = haze; g.fillRect(0, hz - 70, W, 70);
  // street
  g.fillStyle = '#101016'; g.fillRect(0, hz, W, H - hz);
  g.strokeStyle = 'rgba(255,255,255,.22)'; g.lineWidth = 3; g.setLineDash([14, 12]);
  g.beginPath(); g.moveTo(0, hz + 50); g.lineTo(W, hz + 50); g.stroke();
  g.setLineDash([]);
  [60, 220, 390].forEach(x => { // streetlamps
    const gr = g.createRadialGradient(x, hz + 4, 2, x, hz + 4, 38);
    gr.addColorStop(0, 'rgba(255,205,120,.5)'); gr.addColorStop(1, 'rgba(255,205,120,0)');
    g.fillStyle = gr; g.fillRect(x - 40, hz - 36, 80, 82);
    g.fillStyle = '#0c0c12'; g.fillRect(x - 1.5, hz - 30, 3, 36);
    g.fillStyle = '#ffd9a0'; g.fillRect(x - 5, hz - 34, 10, 4);
  });
  cityState.cars.forEach(c => {
    const y = c.dir > 0 ? hz + 28 : hz + 62; // two lanes, opposite directions
    g.fillStyle = '#0a0a12';
    g.fillRect(c.x - 13, y - 6, 26, 8);
    g.fillStyle = '#9cc4e8';
    g.fillRect(c.x - 7, y - 10, 14, 5);
    g.fillStyle = '#fff2c4';
    g.fillRect(c.x + (c.dir > 0 ? 13 : -17), y - 4, 4, 4);
    g.fillStyle = '#ff4a3a';
    g.fillRect(c.x + (c.dir > 0 ? -17 : 13), y - 4, 4, 4);
  });
  cityTex.needsUpdate = true;
}
function updateCity(dt) {
  cityState.t += dt;
  // cars move every frame for smooth traffic
  cityState.cars.forEach(c => {
    c.x += c.dir*c.speed*dt;
    if (c.x > 540) c.x = -30;
    if (c.x < -30) c.x = 540;
  });
  // the window-light logic stays slow & gentle, on its own timer
  cityState.acc += dt;
  if (cityState.acc >= .14) {
    const step = cityState.acc;
    cityState.acc = 0;
    if (Math.random() < .12) { // one window changes its mind every few seconds
      const b = pick(cityState.near);
      const i = Math.floor(Math.random()*b.litT.length);
      b.litT[i] = b.litT[i] > .5 ? 0 : 1;
    }
    for (const b of cityState.near) // then it fades over ~1.5s, no hard blink
      for (let i = 0; i < b.lit.length; i++) {
        const d = b.litT[i] - b.lit[i];
        if (d) b.lit[i] = Math.abs(d) < .04 ? b.litT[i] : b.lit[i] + Math.sign(d)*Math.min(Math.abs(d), step/1.5);
      }
  }
  // redraw the canvas every frame on desktop (smooth traffic); throttle to
  // ~22fps on mobile to spare the GPU the texture re-upload each frame
  cityState.drawAcc = (cityState.drawAcc || 0) + dt;
  if (!IS_MOBILE || cityState.drawAcc >= .045) { cityState.drawAcc = 0; drawCity(); }
}
drawCity();
const winMat = new THREE.MeshStandardMaterial({ map: cityTex, emissive:0xffffff, emissiveMap: cityTex, emissiveIntensity:.55 });
// soft glass sheen: faint reflected light streaks + a cool tint, the giveaway
// that you're looking through a pane rather than at an open hole in the wall
const glassTex = makeCanvas(256, 256, (g) => {
  g.clearRect(0, 0, 256, 256);
  g.fillStyle = 'rgba(150,180,210,0.05)'; g.fillRect(0, 0, 256, 256); // tint
  g.save();
  g.translate(128, 128); g.rotate(-0.5); g.translate(-128, -128);
  const streak = (x, w, a) => {
    const gr = g.createLinearGradient(x, 0, x + w, 0);
    gr.addColorStop(0, 'rgba(255,255,255,0)');
    gr.addColorStop(.5, `rgba(255,255,255,${a})`);
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(x, -120, w, 500);
  };
  streak(40, 34, .13); streak(96, 14, .09);
  g.restore();
  // top-down brightening, like sky glancing off the glass
  const v = g.createLinearGradient(0, 0, 0, 256);
  v.addColorStop(0, 'rgba(190,210,235,.12)'); v.addColorStop(.5, 'rgba(255,255,255,0)');
  g.fillStyle = v; g.fillRect(0, 0, 256, 256);
});
const glassMat = new THREE.MeshStandardMaterial({
  map: glassTex, transparent: true, opacity: .9, depthWrite: false,
  metalness: .1, roughness: .08, side: THREE.DoubleSide,
  emissive: 0x223044, emissiveIntensity: .25,
});
const muntinMat = new THREE.MeshStandardMaterial({ color: 0x2a2018, roughness: .6 });
const frameMat = new THREE.MeshStandardMaterial({ color: 0x4a3624, roughness: .7 });
// fills a wall opening: the city view sits deep in the reveal, the glass +
// muntins are recessed behind the wall face, and the trim sits flush. The
// group origin is the room-side wall face; local +z points into the room,
// so local -z is "into the wall" on every orientation.
function addWindow(x, y, z, w, h, rotY) {
  const grp = new THREE.Group();
  grp.position.set(x, y, z);
  grp.rotation.y = rotY;
  const city = new THREE.Mesh(new THREE.PlaneGeometry(w, h), winMat);
  city.position.z = -.36;                 // far back in the reveal
  grp.add(city);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(w, h), glassMat);
  glass.position.z = -.07;                // recessed pane
  grp.add(glass);
  const bar = .05;
  grp.add(box(bar, h, bar*1.4, muntinMat, 0, 0, -.06));   // vertical muntin
  grp.add(box(w, bar, bar*1.4, muntinMat, 0, 0, -.06));   // horizontal muntin
  // flush trim: lapped over the opening edge, extending back into the wall so
  // it never sticks out into the room
  const fb = .17, fz = -.07;
  grp.add(box(w + fb*2, fb, .2, frameMat, 0, h/2 + fb/2, fz));   // top
  grp.add(box(w + fb*2, fb, .2, frameMat, 0, -h/2 - fb/2, fz));  // bottom
  grp.add(box(fb, h + fb*2, .2, frameMat, -w/2 - fb/2, 0, fz));  // left
  grp.add(box(fb, h + fb*2, .2, frameMat, w/2 + fb/2, 0, fz));   // right
  scene.add(grp);
}
// front-wall windows, room face is z = 17.0
[-11.5, -5, 5].forEach(x => addWindow(x, 3.6, 17.0, 3.6, 2.6, Math.PI));
// side-wall windows, room faces are x = ∓14.3
[6, 11].forEach(z => addWindow(-14.3, 3.6, z, 3.2, 2.4, Math.PI/2));
[6, 11].forEach(z => addWindow(14.3, 3.6, z, 3.2, 2.4, -Math.PI/2));

/* ---- neon sign (front wall, facing the kitchen) ---- */
const neonTex = makeCanvas(1024, 256, (g) => {});
function drawNeon() {
  const g = neonTex.image.getContext('2d');
  g.clearRect(0, 0, 1024, 256);
  g.font = '120px "Bungee", "Arial Black", sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.shadowColor = '#ff5d2a'; g.shadowBlur = 45;
  g.lineWidth = 9; g.strokeStyle = '#ffb35c';
  g.strokeText('SAUCED!', 512, 132);
  g.shadowBlur = 18; g.fillStyle = '#fff0d0';
  g.fillText('SAUCED!', 512, 132);
  neonTex.needsUpdate = true;
}
drawNeon();
const neonMat = new THREE.MeshBasicMaterial({ map: neonTex, transparent: true });
const neon = new THREE.Mesh(new THREE.PlaneGeometry(8, 2), neonMat);
neon.position.set(0, 5.9, 16.9);
neon.rotation.y = Math.PI;
scene.add(neon);
scene.add(box(8.6, 2.3, .15, M.black, 0, 5.9, 17.0, false));
const neonLight = new THREE.PointLight(0xff7a3a, 18, 14, 1.6);
neonLight.position.set(0, 5.5, 14.5);
scene.add(neonLight);

/* ---- menu boards flanking the neon ---- */
const menuTex = makeCanvas(512, 640, (g) => {});
function drawMenu() {
  const g = menuTex.image.getContext('2d');
  g.fillStyle = '#1c1a17'; g.fillRect(0, 0, 512, 640);
  g.strokeStyle = '#c9a06b'; g.lineWidth = 10; g.strokeRect(12, 12, 488, 616);
  g.fillStyle = '#ffc14d'; g.font = '44px "Bungee", Arial';
  g.textAlign = 'center';
  g.fillText('MENU', 256, 84);
  g.font = '700 32px "Space Grotesk", Arial';
  g.fillStyle = '#f2e2c4';
  ['Wings ......... $1.40', 'Sides ........... $0.80', 'Dips ............. $1.00', '', 'Toss it. Sauce it.', 'Love it.'].forEach((s, i) =>
    g.fillText(s, 256, 170 + i*74));
  menuTex.needsUpdate = true;
}
drawMenu();
// canvas text draws before webfonts arrive, redraw once they do
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { drawNeon(); drawMenu(); });
const menuMat = new THREE.MeshStandardMaterial({ map: menuTex, roughness:.9 });
[-8.3, 8.3].forEach(x => {
  const menu = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 3.25), menuMat);
  menu.position.set(x, 4.7, 16.9);
  menu.rotation.y = Math.PI;
  scene.add(menu);
});

/* ---- counters ---- */
// back shelf counter (behind the owner, decorative)
scene.add(box(22, 1.5, 2.2, M.steelDark, 0, .75, -6.2));
scene.add(box(22.2, .12, 2.4, M.steel, 0, 1.56, -6.2));
[[-7.5, 0], [-3, 1], [2, 0], [6.5, 1]].forEach(([x, v]) => { // clutter
  scene.add(box(1.1, .7, .9, v ? M.red : M.cream, x, 1.97, -6.3));
  scene.add(cyl(.3, .3, .5, M.steel, x+1.4, 1.87, -6.2));
});
// the work counter where everything happens
scene.add(box(22, 1.5, 3.0, M.steelDark, 0, .75, -0.3));
scene.add(box(22.2, .12, 3.2, M.steel, 0, 1.56, -0.3));
/* ---- front serving counter ---- */
scene.add(box(11, 1.3, 1.6, M.wood, 0, .65, 2.6));
scene.add(box(11.4, .14, 2, M.woodDark, 0, 1.37, 2.6));
scene.add(box(11, .45, .1, M.red, 0, 1.0, 3.42)); // accent stripe
// stools at the counter
[-4, -2.6, 2.6, 4].forEach(x => {
  scene.add(cyl(.32, .32, .1, M.red, x, 1.05, 4.3));
  scene.add(cyl(.06, .09, 1, M.steelDark, x, .5, 4.3));
});

/* ---- dining tables ----
   kept in the back dining area (z >= 9.5, x <= 7) so they never sit in the
   customer flow: the queue/wait zone hugs the counter (z < 7.5) and the
   entrance lane runs down the right side (x > 9.5). */
[[-7.5, 9.8], [7, 10.5], [-8, 13.5], [0, 13], [5.5, 14]].forEach(([x, z]) => {
  scene.add(cyl(1.15, 1.15, .1, M.red, x, 1.5, z));
  scene.add(cyl(.09, .14, 1.5, M.steelDark, x, .75, z));
  [[1.6, 0], [-1.6, 0], [0, 1.6], [0, -1.6]].forEach(([dx, dz]) => {
    scene.add(cyl(.3, .3, .08, M.cream, x+dx, .82, z+dz));
    scene.add(cyl(.05, .07, .8, M.steelDark, x+dx, .4, z+dz));
  });
});
// potted plants in corners (clear of the entrance lane)
[[-13, 2.5], [13, 2.5], [-13, 15.5], [-2, 15.8]].forEach(([x, z]) => {
  scene.add(cyl(.4, .3, .6, new THREE.MeshStandardMaterial({ color:0xb05a2a, roughness:.8 }), x, .3, z));
  const leaves = new THREE.Mesh(new THREE.SphereGeometry(.62, 10, 8),
    new THREE.MeshStandardMaterial({ color:0x4a7a2c, roughness:.9, flatShading:true }));
  leaves.position.set(x, 1.1, z); leaves.castShadow = true;
  scene.add(leaves);
});

/* ============================================================
   FRY STATION (work counter, x ≈ -6.4)
   ============================================================ */
const FRYER = { baskets: [] };
{
  const fx = -6.4, fz = -0.3;
  scene.add(box(3.4, .9, 2.3, M.steel, fx, 2, fz));
  scene.add(box(3.5, .3, 2.4, M.steelDark, fx, 2.5, fz));
  [-.9, -.3, .3, .9].forEach(dx => scene.add(cyl(.09, .09, .1, M.red, fx+dx, 2.5, fz-1.2)));
  const oilMat = new THREE.MeshStandardMaterial({ color:0xd89a30, roughness:.12, metalness:.1, emissive:0x6a4210, emissiveIntensity:.5 });
  [-0.82, 0.82].forEach((dx) => {
    scene.add(box(1.3, .5, 1.5, M.steelDark, fx+dx, 2.4, fz));
    const oil = new THREE.Mesh(new THREE.PlaneGeometry(1.14, 1.34), oilMat.clone());
    oil.rotation.x = -Math.PI/2;
    oil.position.set(fx+dx, 2.56, fz);
    scene.add(oil);
    // basket: low wire walls + rim + handle, open top so wings show
    const bGroup = new THREE.Group();
    const wire = new THREE.MeshStandardMaterial({ color:0xaab2b8, metalness:.9, roughness:.3, transparent:true, opacity:.62 });
    const bottom = new THREE.Mesh(new THREE.BoxGeometry(.95, .05, 1.1), wire);
    bottom.position.y = -.15;
    bGroup.add(bottom);
    [[0,.56,.95,0],[0,-.56,.95,0],[.5,0,0,1.1],[-.5,0,0,1.1]].forEach(([x,z,w,d]) => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(w||.05, .32, d||.05), wire);
      wall.position.set(x, 0, z);
      bGroup.add(wall);
    });
    const rim = new THREE.Mesh(new THREE.BoxGeometry(1.04, .06, 1.18), M.steel);
    rim.position.y = .16; bGroup.add(rim);
    const handle = cyl(.035, .035, .8, M.black, 0, .42, -.85);
    handle.rotation.x = -Math.PI/2.8;
    bGroup.add(handle);
    const wingsGroup = new THREE.Group();
    wingsGroup.position.y = .02;
    bGroup.add(wingsGroup);
    // downY chosen so wings straddle the oil surface (y≈2.56): bottoms submerge
    // (hidden by the opaque oil), tops poke out, they read as actually frying.
    const upY = 3.3, downY = 2.55;
    bGroup.position.set(fx+dx, upY, fz);
    scene.add(bGroup);
    FRYER.baskets.push({
      group: bGroup, wingsGroup, wings: [], cook: 0, lowered: false, count: 0,
      upY, downY, oilPos: new THREE.Vector3(fx+dx, 2.56, fz), oilY: 2.56, bubbleT: 0,
    });
  });
  // raw wing tub beside the fryer
  scene.add(box(1.2, .5, 1.2, new THREE.MeshStandardMaterial({ color:0xd9e2e8, roughness:.5 }), fx-2.6, 1.81, fz+.1));
  FRYER.tubPos = new THREE.Vector3(fx-2.6, 2.06, fz+.1);
  for (let i = 0; i < 6; i++) {
    const w = makeWingMesh(0xe8a89b);
    w.position.set(fx-2.6+rand(-.32,.32), 2.08, fz+.1+rand(-.32,.32));
    w.rotation.y = rand(Math.PI*2);
    w.scale.setScalar(.85);
    scene.add(w);
  }
}

/* ============================================================
   SAUCE STATION (work counter, x ≈ 0)
   ============================================================ */
const SAUCE_ST = { pots: {}, bowl: null, wingsGroup: null, liquid: null, selected: null };
{
  const sx = 0, sz = -0.9; // bowl close to the owner, pots along the far edge
  const pts = [];
  for (let i = 0; i <= 9; i++) {
    const t = i/9;
    pts.push(new THREE.Vector2(.18 + t*.85, t*t*.62));
  }
  const bowl = new THREE.Mesh(new THREE.LatheGeometry(pts, 28),
    new THREE.MeshStandardMaterial({ color:0xc8ced4, metalness:.9, roughness:.25, side:THREE.DoubleSide }));
  bowl.position.set(sx, 1.6, sz);
  bowl.castShadow = true; bowl.receiveShadow = true;
  scene.add(bowl);
  SAUCE_ST.bowl = bowl;
  registerClick(bowl, () => tossWings(),
    () => curView === 'sauce', () => G.bowl.count ? 'Toss! (or flick up)' : 'Sauce bowl',
    { dragToss: true });
  const liquid = new THREE.Mesh(new THREE.CircleGeometry(.78, 24),
    new THREE.MeshStandardMaterial({ color:0xd8401c, roughness:.18 }));
  liquid.rotation.x = -Math.PI/2;
  liquid.position.set(sx, 1.78, sz);
  liquid.visible = false;
  scene.add(liquid);
  SAUCE_ST.liquid = liquid;
  const wingsGroup = new THREE.Group();
  wingsGroup.position.set(sx, 1.82, sz);
  scene.add(wingsGroup);
  SAUCE_ST.wingsGroup = wingsGroup;
  // pots are laid out in up to two rows so the growing roster always fits
  const POT_R = .27, ROW_N = 7, COL = .66;
  SAUCES.forEach((s, i) => {
    const row = Math.floor(i / ROW_N), col = i % ROW_N;
    const rowLen = Math.min(ROW_N, SAUCES.length - row*ROW_N);
    const px = sx + (col - (rowLen-1)/2)*COL;
    const pz = 0.85 - row*0.62;
    const pot = new THREE.Group();
    pot.add(cyl(.26, .23, .4, M.steel, 0, .2, 0));
    const liq = new THREE.Mesh(new THREE.CircleGeometry(.23, 18),
      new THREE.MeshStandardMaterial({
        color: s.color, roughness:.2,
        emissive: s.glow ? s.color : 0x000000, emissiveIntensity: s.glow ? .55 : 0,
      }));
    liq.rotation.x = -Math.PI/2; liq.position.y = .41;
    pot.add(liq);
    const tag = new THREE.Mesh(new THREE.BoxGeometry(.3, .13, .03),
      new THREE.MeshStandardMaterial({ color: s.color, roughness:.5 }));
    tag.position.set(0, .16, -.25); // face the owner
    pot.add(tag);
    const spoon = cyl(.022, .022, .45, M.woodDark, .1, .52, 0);
    spoon.rotation.z = .4;
    pot.add(spoon);
    pot.position.set(px, 1.62, pz);
    pot.userData.baseY = 1.62;
    scene.add(pot);
    SAUCE_ST.pots[s.id] = pot;
    registerClick(pot, () => uiSelectSauce(s.id),
      () => curView === 'sauce' && pot.visible, `Pour ${s.name}`);
  });
}

/* ============================================================
   BUILD STATION (work counter, x ≈ 6.4)
   ============================================================ */
const BUILD_ST = { plateGroup: null, wingsGroup: null, sidesGroup: null, dipGroup: null,
                   garnishGroup: null, bins: {}, cups: {}, trays: {} };
{
  const bx = 6.4, bz = -0.9;
  const plateGroup = new THREE.Group();
  plateGroup.add(cyl(1.05, .75, .12, new THREE.MeshStandardMaterial({ color:0xf2ece0, roughness:.35 }), 0, 0, 0, 32));
  const plateRim = new THREE.Mesh(new THREE.TorusGeometry(1.0, .07, 10, 32),
    new THREE.MeshStandardMaterial({ color:0xc23b22, roughness:.4 }));
  plateRim.rotation.x = Math.PI/2; plateRim.position.y = .06;
  plateGroup.add(plateRim);
  const wingsGroup = new THREE.Group(); plateGroup.add(wingsGroup);
  const sidesGroup = new THREE.Group(); plateGroup.add(sidesGroup);
  const dipGroup = new THREE.Group();  plateGroup.add(dipGroup);
  const garnishGroup = new THREE.Group(); plateGroup.add(garnishGroup);
  plateGroup.position.set(bx - 0.2, 1.68, bz);
  scene.add(plateGroup);
  Object.assign(BUILD_ST, { plateGroup, wingsGroup, sidesGroup, dipGroup, garnishGroup, home: plateGroup.position.clone() });
  registerClick(dipGroup, () => uiSetDip('none'),
    () => curView === 'build' && curPlate().dip !== 'none', 'Remove dip');
  registerClick(garnishGroup, () => uiSetGarnish('none'),
    () => curView === 'build' && curPlate().garnish && curPlate().garnish !== 'none', 'Remove garnish');

  // side bins, a centered grid behind the plate (grows to two rows)
  const sPerRow = 4;
  SIDES.forEach((s, i) => {
    const row = Math.floor(i / sPerRow), col = i % sPerRow;
    const rowLen = Math.min(sPerRow, SIDES.length - row*sPerRow);
    const px = bx + (col - (rowLen-1)/2)*1.02;
    const pz = 0.95 - row*0.72;
    const bin = new THREE.Group();
    bin.add(box(.85, .38, .72, M.steelDark, 0, .19, 0));
    bin.add(box(.72, .17, .58, new THREE.MeshStandardMaterial({ color:s.color, roughness:.7 }), 0, .4, 0));
    for (let k = 0; k < 5; k++) {
      const p = makeSidePiece(s.id);
      p.position.set(rand(-.26,.26), .48, rand(-.2,.2));
      p.rotation.y = rand(Math.PI*2); p.scale.setScalar(.78);
      bin.add(p);
    }
    bin.position.set(px, 1.62, pz);
    scene.add(bin);
    BUILD_ST.bins[s.id] = bin;
    registerClick(bin, () => uiAddSide(s.id),
      () => curView === 'build' && bin.visible, () => `${s.name} +1`);
  });
  // dip cups, right of the plate, in short columns
  DIPS.filter(d => d.id !== 'none').forEach((d, i) => {
    const col = Math.floor(i / 3), row = i % 3;
    const cup = makeDipCup(d);
    cup.position.set(bx + 2.35 + col*0.55, 1.62, -1.05 + row*0.62);
    scene.add(cup);
    BUILD_ST.cups[d.id] = cup;
    registerClick(cup, () => uiSetDip(d.id),
      () => curView === 'build' && cup.visible, `${d.name} dip`);
  });
  // garnish caddy, left of the plate, the finishing touch
  GARNISHES.filter(gn => gn.id !== 'none').forEach((gn, i) => {
    const tray = new THREE.Group();
    tray.add(cyl(.2, .17, .1, M.steel, 0, .05, 0));
    const pile = makeGarnishPiece(gn.id);
    pile.position.y = .1; pile.scale.setScalar(1.15);
    tray.add(pile);
    tray.position.set(bx - 2.55, 1.62, -1.05 + i*0.6);
    scene.add(tray);
    BUILD_ST.trays[gn.id] = tray;
    registerClick(tray, () => uiSetGarnish(gn.id),
      () => curView === 'build' && tray.visible, `${gn.name} garnish`);
  });
}

/* ---- disco ball (upgrade) ---- */
const disco = new THREE.Group();
{
  const ball = new THREE.Mesh(new THREE.SphereGeometry(.7, 18, 14),
    new THREE.MeshStandardMaterial({ color:0xe8eef4, metalness:1, roughness:.12, flatShading:true }));
  ball.castShadow = true;
  disco.add(ball);
  disco.add(cyl(.02, .02, 1.4, M.black, 0, 1.05, 0));
  disco.position.set(0, 6, 8);
  disco.visible = false;
  scene.add(disco);
}
const discoLights = [new THREE.PointLight(0xff4dd2, 0, 16, 1.2), new THREE.PointLight(0x4d9fff, 0, 16, 1.2)];
discoLights[0].position.set(-6, 5, 6);
discoLights[1].position.set(6, 5, 6);
discoLights.forEach(l => scene.add(l));

/* ---- entrance door, in the front wall ---- */
const DOOR_POS = new THREE.Vector3(11.5, 0, 15.6);
scene.add(box(2.6, 4.6, .3, M.woodDark, 11.5, 2.3, 17.05, false));
const doorSignTex = makeCanvas(256, 128, (g) => {
  g.fillStyle = '#f2e2c4'; g.fillRect(0,0,256,128);
  g.fillStyle = '#9c3a16'; g.font = '52px "Bungee", Arial';
  g.textAlign = 'center'; g.fillText('OPEN', 128, 86);
});
const doorSign = new THREE.Mesh(new THREE.PlaneGeometry(1.3, .65),
  new THREE.MeshStandardMaterial({ map: doorSignTex }));
doorSign.position.set(11.5, 3.4, 16.85);
doorSign.rotation.y = Math.PI;
scene.add(doorSign);
