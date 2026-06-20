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
// type: 'drum' | 'flat' | undefined (random). The chosen type is stored on the
// mesh so a wing keeps its shape all the way from the basket to the plate.
function makeWingMesh(color = 0xe8a89b, type) {
  const meat = new THREE.MeshStandardMaterial({ color, roughness:.62 });
  const boneMat = new THREE.MeshStandardMaterial({ color:0xf4ecdc, roughness:.45 });
  const g = new THREE.Group();
  const wtype = type || (Math.random() < .55 ? 'drum' : 'flat');
  if (wtype === 'drum') {
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
    // wingette (flat): a meatier flattened segment with two bones poking out the
    // joint end and a small knuckle at the tip end. Plump, not paper-thin.
    const prof = [[.03,0],[.07,.02],[.105,.09],[.125,.19],[.118,.30],[.097,.42],[.07,.50],[.04,.56],[.001,.59]];
    const body = new THREE.Mesh(
      new THREE.LatheGeometry(prof.map(p => new THREE.Vector2(p[0], p[1])), 16), meat);
    body.rotation.z = -Math.PI/2;          // length along x, joint end toward -x
    body.position.x = -.29;
    body.scale.set(.76, 1, 1.04);          // flattened, but with real thickness
    body.castShadow = true;
    g.add(body);
    // two bones with a subtle valley of meat between them
    [-.06, .06].forEach((zz, k) => {
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.017, .024, .2, 7), boneMat);
      shaft.rotation.z = Math.PI/2;
      shaft.position.set(-.2, -.01, zz);
      shaft.castShadow = true;
      const knob = new THREE.Mesh(new THREE.SphereGeometry(.032, 8, 6), boneMat);
      knob.position.set(-.33, -.008, zz - k*.006);  // the two elbow ends offset slightly
      g.add(shaft, knob);
    });
    const tip = new THREE.Mesh(new THREE.SphereGeometry(.022, 8, 6), boneMat);
    tip.position.set(.3, 0, 0);
    g.add(tip);
  }
  g.userData.mat = meat;
  g.userData.wtype = wtype;
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
  'Twyla','Gus','Nina','Fitz','Cora','Bruno','Hazel','Sven','Lola','Ernie','Wanda','Kip',
  'Dot','Hank','Roz','Vic','Pearl','Moe','Jin','Esme','Tariq','Bex','Otto','Coral'];
const SKIN_TONES = [0xf2c79c, 0xe2a878, 0xc4885a, 0x9c6a42, 0x7a4e2e, 0xf2d4b0, 0xd99a6a, 0x8a5a38];
const SHIRT_COLORS = [0x4a90d9, 0xd94a6a, 0x4ab06a, 0xe8a23a, 0x8a5ad9, 0x3ac4c4, 0xd9d04a, 0xe86a3a,
  0xe85a8a, 0x6a8ad9, 0x2c9c6a, 0xb0563a];
const HAIR_COLORS = [0x2c1c10, 0x6a4424, 0xd9c46a, 0xb04a2a, 0x44464a, 0x1a1410, 0x8a8f98, 0xc9744a];
const PANTS_COLORS = [0x3a3a4a, 0x5a4632, 0x2c4a5a, 0x44403a, 0x4a3a52];

// personality archetypes, with traits that change patience, pace and tips
const TRAITS = [
  { id:'regular', label:'Regular',    patience:1.0,  speed:1.0,  tip:1.0,  w:4 },
  { id:'rushed',  label:'In a Hurry', patience:0.55, speed:1.6,  tip:1.15, w:3, accent:0xff6a3a, restless:true, greet:["Make it quick?","I'm on the clock!","Fast as you can!"] },
  { id:'chill',   label:'Chill',      patience:1.8,  speed:0.8,  tip:0.85, w:3, accent:0x4ab0d9, greet:["No rush, friend.","Whenever you're ready.","All good, take your time."] },
  { id:'foodie',  label:'Foodie',     patience:0.95, speed:1.0,  tip:1.5,  w:2, accent:0x9a5ad9, glasses:true, greet:["Make it beautiful.","I know my wings.","Presentation matters."] },
  { id:'bigtip',  label:'Big Tipper', patience:1.15, speed:1.05, tip:1.9,  w:1, accent:0xffc14d, fancy:true, greet:["Keep the change, chief.","Treat yourself after.","Money's no object."] },
  { id:'grump',   label:'Grump',      patience:0.72, speed:0.85, tip:0.9,  w:2, accent:0x8a8f98, grumpy:true, greet:["This better be good.","Don't mess it up.","Hmph."] },
];
function pickTrait() {
  const total = TRAITS.reduce((a, t) => a + t.w, 0);
  let r = rand(total);
  for (const t of TRAITS) { r -= t.w; if (r <= 0) return t; }
  return TRAITS[0];
}
// body archetypes for silhouette variety
const BUILDS = [
  { name:'kid',   p:.12, scale:0.64, bodyR:.36, len:.46, headR:.42, armR:.085 },
  { name:'round', p:.26, scale:1.0,  bodyR:.57, len:.56, headR:.45, armR:.115 },
  { name:'tall',  p:.24, scale:1.14, bodyR:.38, len:.74, headR:.39, armR:.092 },
  { name:'avg',   p:.38, scale:0.98, bodyR:.43, len:.64, headR:.42, armR:.1 },
];
function pickBuild() {
  let r = rand(1);
  for (const b of BUILDS) { r -= b.p; if (r <= 0) return b; }
  return BUILDS[BUILDS.length-1];
}

function makeCustomer() {
  const g = new THREE.Group();
  const trait = pickTrait();
  const B = pickBuild();
  const skin = pick(SKIN_TONES);
  // big tippers / accent traits sometimes wear their signature color
  const shirt = (trait.accent && rand() < .6) ? trait.accent : pick(SHIRT_COLORS);
  const hairColor = pick(HAIR_COLORS);
  const skinMat = new THREE.MeshStandardMaterial({ color: skin, roughness:.7 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: shirt, roughness:.78 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: pick(PANTS_COLORS), roughness:.82 });
  const hairMat = new THREE.MeshStandardMaterial({ color: hairColor, roughness:.95 });
  const darkMat = new THREE.MeshStandardMaterial({ color:0x1a1814, roughness:.5, metalness:.2 });

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(B.bodyR, B.len, 6, 14), shirtMat);
  body.position.y = .92 + B.len/2; body.castShadow = true;
  g.add(body);
  // little collar so the shirt reads as clothing
  const collar = new THREE.Mesh(new THREE.TorusGeometry(B.bodyR*.55, .05, 6, 14), shirtMat);
  collar.rotation.x = Math.PI/2; collar.position.y = .92 + B.len - .02;
  g.add(collar);
  const legGap = B.bodyR*.45;
  [-legGap, legGap].forEach(x => {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(B.bodyR*.3, .42*B.scale, 4, 10), pantsMat);
    leg.position.set(x, .42*B.scale, 0); leg.castShadow = true;
    g.add(leg);
    const shoe = new THREE.Mesh(new THREE.CapsuleGeometry(B.bodyR*.3, .12, 4, 8), darkMat);
    shoe.rotation.x = Math.PI/2; shoe.position.set(x, .08, .07); shoe.castShadow = true;
    g.add(shoe);
  });
  const arms = [];
  [-1, 1].forEach(s => {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(B.armR, .44, 4, 10), shirtMat);
    arm.position.set(s*(B.bodyR + B.armR + .02), .96 + B.len/2, 0);
    arm.rotation.z = s*.22; arm.castShadow = true;
    g.add(arm); arms.push(arm);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(B.armR*1.05, 8, 6), skinMat);
    hand.position.set(s*(B.bodyR + B.armR + .12), .72 + B.len/2 - .1, 0);
    g.add(hand);
  });
  const headY = .92 + B.len + B.headR + .04;
  const head = new THREE.Mesh(new THREE.SphereGeometry(B.headR, 18, 14), skinMat);
  head.position.y = headY; head.castShadow = true;
  g.add(head);
  // ears
  [-1, 1].forEach(s => {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(B.headR*.22, 8, 6), skinMat);
    ear.position.set(s*B.headR*.95, headY, 0); ear.scale.set(.6, 1, .8);
    g.add(ear);
  });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(B.headR*1.5, B.headR*1.5),
    new THREE.MeshBasicMaterial({ map: trait.grumpy ? FACES.grumpy : FACES.neutral, transparent: true }));
  face.position.set(0, headY + .02, B.headR*.93);
  g.add(face);

  // ---- hair / headwear ----
  const hw = trait.fancy ? 'tophat'
    : pick(['cap','cap','beanie','bun','hairShort','hairShort','hairLong','bald','sunhat']);
  const hatColor = trait.accent || pick(SHIRT_COLORS);
  const capMat = new THREE.MeshStandardMaterial({ color: hatColor, roughness:.7 });
  if (hw === 'cap') {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(B.headR*1.04, 14, 8, 0, Math.PI*2, 0, Math.PI/2.4), capMat);
    cap.position.y = headY + B.headR*.2;
    const brim = new THREE.Mesh(new THREE.BoxGeometry(B.headR*.95, .05, B.headR*.8), capMat);
    brim.position.set(0, headY + B.headR*.5, B.headR*1.05);
    g.add(cap, brim);
  } else if (hw === 'beanie') {
    const b = new THREE.Mesh(new THREE.SphereGeometry(B.headR*1.06, 14, 8, 0, Math.PI*2, 0, Math.PI/2.6), capMat);
    b.position.y = headY + B.headR*.12; g.add(b);
    const pom = new THREE.Mesh(new THREE.SphereGeometry(.1, 8, 8),
      new THREE.MeshStandardMaterial({ color:0xf2ece0, roughness:.95 }));
    pom.position.y = headY + B.headR*1.1; g.add(pom);
  } else if (hw === 'bun') {
    const h = new THREE.Mesh(new THREE.SphereGeometry(B.headR*1.08, 14, 10, 0, Math.PI*2, 0, Math.PI/1.9), hairMat);
    h.position.y = headY + B.headR*.06; g.add(h);
    const bun = new THREE.Mesh(new THREE.SphereGeometry(B.headR*.42, 10, 8), hairMat);
    bun.position.set(0, headY + B.headR*.95, -B.headR*.5); g.add(bun);
  } else if (hw === 'hairShort') {
    const h = new THREE.Mesh(new THREE.SphereGeometry(B.headR*1.06, 14, 10, 0, Math.PI*2, 0, Math.PI/2.0), hairMat);
    h.position.y = headY + B.headR*.05; h.scale.set(1, 1.05, 1); g.add(h);
  } else if (hw === 'hairLong') {
    const h = new THREE.Mesh(new THREE.SphereGeometry(B.headR*1.06, 14, 10, 0, Math.PI*2, 0, Math.PI/1.7), hairMat);
    h.position.y = headY + B.headR*.04; g.add(h);
    const back = new THREE.Mesh(new THREE.CapsuleGeometry(B.headR*.6, B.headR*1.1, 5, 9), hairMat);
    back.position.set(0, headY - B.headR*.5, -B.headR*.75); g.add(back);
  } else if (hw === 'sunhat') {
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(B.headR*1.7, B.headR*1.7, .04, 18), capMat);
    brim.position.y = headY + B.headR*.5;
    const top = new THREE.Mesh(new THREE.SphereGeometry(B.headR*.95, 12, 8, 0, Math.PI*2, 0, Math.PI/2.4), capMat);
    top.position.y = headY + B.headR*.5; g.add(brim, top);
  } else if (hw === 'tophat') {
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(B.headR*1.4, B.headR*1.4, .04, 18), darkMat);
    brim.position.y = headY + B.headR*.55;
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(B.headR*.95, B.headR*.95, B.headR*1.4, 16), darkMat);
    tube.position.y = headY + B.headR*1.25;
    const band = new THREE.Mesh(new THREE.CylinderGeometry(B.headR*.97, B.headR*.97, .1, 16),
      new THREE.MeshStandardMaterial({ color: hatColor, roughness:.6 }));
    band.position.y = headY + B.headR*.66; g.add(brim, tube, band);
  } else { // bald, give a faint hair ring
    const ring = new THREE.Mesh(new THREE.TorusGeometry(B.headR*.78, B.headR*.13, 6, 14), hairMat);
    ring.rotation.x = Math.PI/2; ring.position.y = headY - B.headR*.15; g.add(ring);
  }

  // glasses
  if (trait.glasses || rand() < .22) {
    const lensMat = new THREE.MeshStandardMaterial({ color:0x222222, roughness:.3, metalness:.4 });
    [-1, 1].forEach(s => {
      const lens = new THREE.Mesh(new THREE.TorusGeometry(B.headR*.28, .025, 6, 12), lensMat);
      lens.position.set(s*B.headR*.42, headY + .02, B.headR*1.0); // in front of the face plane
      g.add(lens);
    });
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(B.headR*.3, .03, .03), lensMat);
    bridge.position.set(0, headY + .02, B.headR*1.0); g.add(bridge);
  }
  // beard (skip kids)
  if (B.name !== 'kid' && rand() < .25) {
    const beard = new THREE.Mesh(new THREE.SphereGeometry(B.headR*.8, 12, 8, 0, Math.PI*2, Math.PI*.55, Math.PI*.5), hairMat);
    beard.position.set(0, headY - B.headR*.32, B.headR*.32); beard.scale.set(1, .9, .7);
    g.add(beard);
  }

  g.scale.setScalar(B.scale);
  scene.add(g);

  const baseSpeed = rand(2.0, 2.6) * trait.speed;
  const cust = {
    group: g, face, arms, name: pick(CUSTOMER_NAMES),
    trait, build: B.name,
    walkTarget: null, onArrive: null, speed: baseSpeed, walkT: 0, idleT: rand(6.28),
    patience: 100, patienceRate: 1/trait.patience, tipMul: trait.tip,
    order: null, state: 'entering', entered: false,
    _path: null, _pathFirst: null, _pathDone: null,
    setExpression(e) { face.material.map = FACES[e] || FACES.neutral; face.material.needsUpdate = true; },
    greetLine() { return trait.greet ? '"' + pick(trait.greet) + '"' : null; },
    // anchor a bit above the crown of the head, so bubbles/buttons clear the face
    headPos() { return g.localToWorld(new THREE.Vector3(0, headY + B.headR + .35, 0)); },
    moveTo(p, onArrive) { this.walkTarget = p.clone(); this.onArrive = onArrive || null; },
    // walk a sequence of waypoints; onFirst fires when the first one is reached
    movePath(points, onArrive, onFirst) {
      this._path = points.slice();
      this._pathFirst = onFirst || null;
      this._pathDone = onArrive || null;
      this._stepPath();
    },
    _stepPath() {
      const p = this._path.shift();
      this.moveTo(p, () => {
        if (this._pathFirst) { this._pathFirst(); this._pathFirst = null; }
        if (this._path && this._path.length) this._stepPath();
        else { const cb = this._pathDone; this._pathDone = null; this._path = null; cb && cb(); }
      });
    },
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
          g.rotation.z = 0;
        }
      } else if (this.state === 'waiting' || this.state === 'queued') {
        // idle personality: a gentle sway, restless folks fidget faster
        this.idleT += dt;
        const rate = trait.restless ? 5.5 : 1.3;
        g.rotation.z = Math.sin(this.idleT*rate)*(trait.restless ? .035 : .018);
        g.position.y = trait.restless ? Math.abs(Math.sin(this.idleT*rate))*.025 : 0;
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
