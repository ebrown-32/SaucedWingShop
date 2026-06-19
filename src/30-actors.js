/* ============================================================
   WINGS, SIDES, DIP CUPS
   ============================================================ */
const COOK_STOPS = [ // cook value → color
  { t: 0,    c: new THREE.Color(0xe8a89b) },  // raw
  { t: .55,  c: new THREE.Color(0xe0b06a) },  // blonde
  { t: 1,    c: new THREE.Color(0xc9802f) },  // golden ✓
  { t: 1.18, c: new THREE.Color(0x7a4a1e) },  // dark
  { t: 1.35, c: new THREE.Color(0x3a2814) },  // charcoal
];
function cookColor(cook) {
  for (let i = 0; i < COOK_STOPS.length-1; i++) {
    const a = COOK_STOPS[i], b = COOK_STOPS[i+1];
    if (cook <= b.t) return a.c.clone().lerp(b.c, clamp((cook-a.t)/(b.t-a.t), 0, 1));
  }
  return COOK_STOPS[COOK_STOPS.length-1].c.clone();
}
function makeWingMesh(color = 0xe8a89b) {
  const meat = new THREE.MeshStandardMaterial({ color, roughness:.62 });
  const boneMat = new THREE.MeshStandardMaterial({ color:0xf4ecdc, roughness:.45 });
  const g = new THREE.Group();
  if (Math.random() < .55) {
    // drumette: plump teardrop with the bone poking out the narrow end
    const prof = [[0,0],[.105,.012],[.15,.07],[.168,.15],[.155,.24],[.115,.32],[.07,.38],[.048,.42],[.001,.45]];
    const body = new THREE.Mesh(
      new THREE.LatheGeometry(prof.map(p => new THREE.Vector2(p[0], p[1])), 16), meat);
    body.rotation.z = -Math.PI/2;       // lay it on its side, fat end at -x
    body.position.x = -.22;
    body.scale.set(1, .94, 1.07);       // slightly squashed, not perfectly round
    body.castShadow = true;
    g.add(body);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.026, .032, .12, 8), boneMat);
    shaft.rotation.z = Math.PI/2;
    shaft.position.set(.27, 0, 0);
    shaft.castShadow = true;
    const knobA = new THREE.Mesh(new THREE.SphereGeometry(.04, 8, 6), boneMat);
    knobA.position.set(.33, .024, 0);
    const knobB = knobA.clone();
    knobB.position.set(.33, -.024, .01);
    g.add(shaft, knobA, knobB);
  } else {
    // wingette (flat): one slim, flattened, tapered segment of meat with two
    // thin bones poking out the joint end and a small knuckle at the tip end
    const prof = [[.025,0],[.05,.02],[.08,.08],[.092,.17],[.086,.28],[.068,.39],[.05,.47],[.028,.54],[.001,.575]];
    const body = new THREE.Mesh(
      new THREE.LatheGeometry(prof.map(p => new THREE.Vector2(p[0], p[1])), 16), meat);
    body.rotation.z = -Math.PI/2;          // length along x, joint end toward -x
    body.position.x = -.28;
    body.scale.set(.56, 1, 1.16);          // flatten top-to-bottom, a touch wide
    body.castShadow = true;
    g.add(body);
    // a subtle "valley" between the two bones, like a real wingette
    [-.055, .055].forEach((zz, k) => {
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.016, .023, .19, 7), boneMat);
      shaft.rotation.z = Math.PI/2;
      shaft.position.set(-.19, -.008, zz);
      shaft.castShadow = true;
      const knob = new THREE.Mesh(new THREE.SphereGeometry(.03, 8, 6), boneMat);
      knob.position.set(-.31, -.006, zz - k*.006);  // the two elbow ends offset slightly
      g.add(shaft, knob);
    });
    const tip = new THREE.Mesh(new THREE.SphereGeometry(.02, 8, 6), boneMat);
    tip.position.set(.29, 0, 0);
    g.add(tip);
  }
  g.userData.mat = meat;
  return g;
}
// apply cook + sauce coat to a wing's material
function styleWing(wing, cook, sauce, coat) {
  const base = cookColor(cook);
  const m = wing.userData.mat;
  if (sauce && coat > 0) {
    const sc = new THREE.Color(sauce.color);
    m.color.copy(base.lerp(sc, clamp(coat, 0, 1)*.92));
    m.roughness = lerp(.62, .18, clamp(coat, 0, 1));
    if (sauce.glow) { m.emissive.set(sauce.color); m.emissiveIntensity = .3*coat; }
  } else {
    m.color.copy(base);
    m.roughness = .62;
    m.emissive.set(0); m.emissiveIntensity = 0;
  }
}
function makeSidePiece(id) {
  const g = new THREE.Group();
  if (id === 'fries') {
    const mat = new THREE.MeshStandardMaterial({ color:0xf2c54a, roughness:.6 });
    for (let i = 0; i < 5; i++) {
      const f = new THREE.Mesh(new THREE.BoxGeometry(.05, .42, .05), mat);
      f.position.set(rand(-.07,.07), .18, rand(-.07,.07));
      f.rotation.set(rand(-.3,.3), rand(Math.PI), rand(-.3,.3));
      f.castShadow = true;
      g.add(f);
    }
  } else if (id === 'celery') {
    const c = new THREE.Mesh(new THREE.BoxGeometry(.09, .07, .5),
      new THREE.MeshStandardMaterial({ color:0x9cd45e, roughness:.7 }));
    c.castShadow = true;
    const inner = new THREE.Mesh(new THREE.BoxGeometry(.05, .02, .5),
      new THREE.MeshStandardMaterial({ color:0xd4eea8, roughness:.7 }));
    inner.position.y = .035;
    g.add(c, inner);
  } else if (id === 'carrots') {
    const mat = new THREE.MeshStandardMaterial({ color:0xf08a2c, roughness:.65 });
    for (let i = 0; i < 3; i++) {
      const c = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, .05, 12), mat);
      c.position.set(i*.12-.12, .03+i*.015, rand(-.04,.04));
      c.rotation.x = rand(-.3,.3);
      c.castShadow = true;
      g.add(c);
    }
  } else if (id === 'tots') {
    const mat = new THREE.MeshStandardMaterial({ color:0xd9a24a, roughness:.62 });
    for (let i = 0; i < 3; i++) {
      const c = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, .13, 10), mat);
      c.position.set(rand(-.08,.08), .07, rand(-.08,.08));
      c.rotation.set(rand(-.4,.4), rand(Math.PI), rand(-.4,.4));
      c.castShadow = true;
      g.add(c);
    }
  } else if (id === 'mozz') {
    const mat = new THREE.MeshStandardMaterial({ color:0xe8c87a, roughness:.55 });
    const s = new THREE.Mesh(new THREE.CapsuleGeometry(.055, .32, 5, 9), mat);
    s.rotation.z = Math.PI/2 - .3; s.position.y = .06; s.castShadow = true;
    g.add(s);
  } else if (id === 'slaw') {
    const mat = new THREE.MeshStandardMaterial({ color:0xe8e6cc, roughness:.75 });
    const carrot = new THREE.MeshStandardMaterial({ color:0xf08a2c, roughness:.7 });
    for (let i = 0; i < 7; i++) {
      const sh = new THREE.Mesh(new THREE.BoxGeometry(.03, .02, .18), i % 3 ? mat : carrot);
      sh.position.set(rand(-.13,.13), .04 + rand(0,.04), rand(-.1,.1));
      sh.rotation.y = rand(Math.PI);
      g.add(sh);
    }
  } else { // onion rings
    const r = new THREE.Mesh(new THREE.TorusGeometry(.16, .055, 8, 18),
      new THREE.MeshStandardMaterial({ color:0xe8c87a, roughness:.55 }));
    r.rotation.x = Math.PI/2 - .25;
    r.position.y = .06;
    r.castShadow = true;
    g.add(r);
  }
  return g;
}
function makeGarnishPiece(id) {
  const g = new THREE.Group();
  if (id === 'lemon') {
    const wedge = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, .07, 14, 1, false, 0, Math.PI/2.2),
      new THREE.MeshStandardMaterial({ color:0xf2e24a, roughness:.45 }));
    wedge.rotation.x = -Math.PI/2; wedge.position.y = .035; wedge.castShadow = true;
    const rind = new THREE.Mesh(new THREE.TorusGeometry(.16, .022, 6, 10, Math.PI/2.2),
      new THREE.MeshStandardMaterial({ color:0xe8d020, roughness:.5 }));
    rind.rotation.x = -Math.PI/2; rind.position.y = .035;
    g.add(wedge, rind);
  } else if (id === 'parsley') {
    const mat = new THREE.MeshStandardMaterial({ color:0x3a8a2e, roughness:.8, flatShading:true });
    for (let i = 0; i < 4; i++) {
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(.07, 6, 5), mat);
      leaf.position.set(rand(-.08,.08), .07 + rand(0,.05), rand(-.08,.08));
      leaf.scale.set(1, .6, 1);
      leaf.castShadow = true;
      g.add(leaf);
    }
  } else if (id === 'chili') {
    const pepper = new THREE.Mesh(new THREE.CapsuleGeometry(.04, .2, 5, 9),
      new THREE.MeshStandardMaterial({ color:0xd02818, roughness:.4 }));
    pepper.rotation.z = Math.PI/2 - .4; pepper.position.y = .05; pepper.castShadow = true;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .07, 5),
      new THREE.MeshStandardMaterial({ color:0x4a8a2e, roughness:.7 }));
    stem.position.set(-.11, .09, 0); stem.rotation.z = .5;
    g.add(pepper, stem);
  }
  return g;
}
function makeDipCup(dip) {
  const g = new THREE.Group();
  g.add(cyl(.2, .15, .24, new THREE.MeshStandardMaterial({ color:0xffffff, roughness:.4 }), 0, .12, 0));
  const top = new THREE.Mesh(new THREE.CircleGeometry(.175, 18),
    new THREE.MeshStandardMaterial({ color: dip.color, roughness:.3 }));
  top.rotation.x = -Math.PI/2; top.position.y = .245;
  g.add(top);
  return g;
}

/* ============================================================
   CUSTOMERS
   ============================================================ */
const FACES = {};
['happy','neutral','grumpy','wow','angry','starry'].forEach(expr => {
  FACES[expr] = makeCanvas(128, 128, (g) => {
    g.clearRect(0, 0, 128, 128);
    g.fillStyle = '#241410'; g.strokeStyle = '#241410';
    g.lineWidth = 7; g.lineCap = 'round';
    const eye = (x) => {
      if (expr === 'starry') {
        g.font = '34px serif'; g.textAlign = 'center'; g.fillText('⭐', x, 62);
      } else if (expr === 'angry') {
        g.beginPath(); g.arc(x, 56, 9, 0, 7); g.fill();
        g.beginPath(); g.moveTo(x-14, 36); g.lineTo(x+12, 46); g.stroke(); // brow
      } else if (expr === 'grumpy') {
        g.beginPath(); g.moveTo(x-11, 52); g.lineTo(x+11, 52); g.stroke(); // squint
      } else if (expr === 'wow') {
        g.beginPath(); g.arc(x, 54, 11, 0, 7); g.fill();
        g.fillStyle = '#fff'; g.beginPath(); g.arc(x+4, 50, 4, 0, 7); g.fill();
        g.fillStyle = '#241410';
      } else {
        g.beginPath(); g.arc(x, 54, 8, 0, 7); g.fill();
      }
    };
    eye(40); eye(88);
    g.beginPath();
    if (expr === 'happy')      { g.arc(64, 78, 22, .15*Math.PI, .85*Math.PI); }
    else if (expr === 'starry'){ g.arc(64, 74, 26, .1*Math.PI, .9*Math.PI); }
    else if (expr === 'wow')   { g.arc(64, 92, 12, 0, Math.PI*2); }
    else if (expr === 'neutral'){ g.moveTo(48, 92); g.lineTo(80, 92); }
    else                       { g.arc(64, 110, 22, 1.15*Math.PI, 1.85*Math.PI); } // frown
    g.stroke();
    if (expr === 'angry') { // steam mark
      g.fillStyle = '#c23b22'; g.font = '900 30px Arial'; g.fillText('💢', 96, 30);
    }
  });
});
['happy','neutral','grumpy','wow','angry','starry'].forEach(k => { FACES[k].needsUpdate = true; });

const CUSTOMER_NAMES = ['Benny','Greta','Marco','Suki','Dale','Priya','Olive','Chuck','Mabel','Rex',
  'Twyla','Gus','Nina','Fitz','Cora','Bruno','Hazel','Sven','Lola','Ernie','Wanda','Kip'];
const SKIN_TONES = [0xf2c79c, 0xe2a878, 0xc4885a, 0x9c6a42, 0x7a4e2e, 0xf2d4b0];
const SHIRT_COLORS = [0x4a90d9, 0xd94a6a, 0x4ab06a, 0xe8a23a, 0x8a5ad9, 0x3ac4c4, 0xd9d04a, 0xe86a3a];

function makeCustomer() {
  const g = new THREE.Group();
  const skin = pick(SKIN_TONES), shirt = pick(SHIRT_COLORS);
  const chunky = rand() < .35, tall = rand(0.92, 1.12);
  const skinMat = new THREE.MeshStandardMaterial({ color: skin, roughness:.7 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: shirt, roughness:.75 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: pick([0x3a3a4a, 0x5a4632, 0x2c4a5a]), roughness:.8 });

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(chunky ? .52 : .4, .62, 6, 14), shirtMat);
  body.position.y = 1.18; body.castShadow = true;
  g.add(body);
  [-.18, .18].forEach(x => {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(.13, .4, 4, 10), pantsMat);
    leg.position.set(x, .42, 0); leg.castShadow = true;
    g.add(leg);
  });
  [-1, 1].forEach(s => {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(.1, .42, 4, 10), shirtMat);
    arm.position.set(s*(chunky ? .6 : .5), 1.25, 0);
    arm.rotation.z = s*.25; arm.castShadow = true;
    g.add(arm);
  });
  const head = new THREE.Mesh(new THREE.SphereGeometry(.42, 18, 14), skinMat);
  head.position.y = 2.12; head.castShadow = true;
  g.add(head);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(.62, .62),
    new THREE.MeshBasicMaterial({ map: FACES.neutral, transparent: true }));
  face.position.set(0, 2.14, .39);
  g.add(face);
  // headwear
  const hw = pick(['cap','cap','beanie','hair','hair','none']);
  const hatColor = pick(SHIRT_COLORS);
  if (hw === 'cap') {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(.43, 14, 8, 0, Math.PI*2, 0, Math.PI/2.4),
      new THREE.MeshStandardMaterial({ color: hatColor, roughness:.7 }));
    cap.position.y = 2.2;
    const brim = new THREE.Mesh(new THREE.BoxGeometry(.4, .05, .34),
      new THREE.MeshStandardMaterial({ color: hatColor, roughness:.7 }));
    brim.position.set(0, 2.34, .45);
    g.add(cap, brim);
  } else if (hw === 'beanie') {
    const b = new THREE.Mesh(new THREE.SphereGeometry(.44, 14, 8, 0, Math.PI*2, 0, Math.PI/2.6),
      new THREE.MeshStandardMaterial({ color: hatColor, roughness:.95 }));
    b.position.y = 2.18; g.add(b);
    const pom = new THREE.Mesh(new THREE.SphereGeometry(.1, 8, 8),
      new THREE.MeshStandardMaterial({ color:0xf2ece0, roughness:.95 }));
    pom.position.y = 2.62; g.add(pom);
  } else if (hw === 'hair') {
    const h = new THREE.Mesh(new THREE.SphereGeometry(.45, 14, 10, 0, Math.PI*2, 0, Math.PI/2.1),
      new THREE.MeshStandardMaterial({ color: pick([0x2c1c10, 0x6a4424, 0xd9c46a, 0xb04a2a, 0x44464a]), roughness:.95 }));
    h.position.y = 2.16; h.scale.set(1, 1.06, 1);
    g.add(h);
  }
  g.scale.setScalar(tall);
  scene.add(g);

  const cust = {
    group: g, face, name: pick(CUSTOMER_NAMES),
    walkTarget: null, onArrive: null, speed: rand(2.0, 2.6), walkT: 0,
    patience: 100, order: null, state: 'entering',
    setExpression(e) { face.material.map = FACES[e] || FACES.neutral; face.material.needsUpdate = true; },
    headPos() { return g.localToWorld(new THREE.Vector3(0, 2.75, 0)); },
    moveTo(p, onArrive) { this.walkTarget = p.clone(); this.onArrive = onArrive || null; },
    faceToward(p) {
      const d = Math.atan2(p.x - g.position.x, p.z - g.position.z);
      tween(.3, k => { g.rotation.y = lerpAngle(g.rotation.y, d, k); });
    },
    jumpJoy() {
      tween(.55, k => { g.position.y = Math.abs(Math.sin(k*Math.PI*2))*.45; }, { ease: t=>t });
    },
    shakeAnger() {
      tween(.6, k => { g.rotation.z = Math.sin(k*Math.PI*6)*.09*(1-k); }, { ease: t=>t });
    },
    update(dt) {
      if (this.walkTarget) {
        const d = this.walkTarget.clone().sub(g.position); d.y = 0;
        const dist = d.length();
        if (dist < .08) {
          g.position.x = this.walkTarget.x; g.position.z = this.walkTarget.z;
          g.position.y = 0;
          this.walkTarget = null;
          const cb = this.onArrive; this.onArrive = null;
          cb && cb();
        } else {
          d.normalize();
          g.position.addScaledVector(d, Math.min(this.speed*dt, dist));
          g.rotation.y = lerpAngle(g.rotation.y, Math.atan2(d.x, d.z), .15);
          this.walkT += dt*10;
          g.position.y = Math.abs(Math.sin(this.walkT))*.08;
        }
      }
    },
    dispose() { removeClickable(g); scene.remove(g); },
  };
  return cust;
}
function lerpAngle(a, b, t) {
  let d = (b - a) % (Math.PI*2);
  if (d > Math.PI) d -= Math.PI*2;
  if (d < -Math.PI) d += Math.PI*2;
  return a + d*t;
}
