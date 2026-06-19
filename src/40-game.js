/* ============================================================
   GAME STATE
   ============================================================ */
const SAVE_KEY = 'sauced-save-v2';
const UPGRADES = [
  { id:'fastfry',  name:'Turbo Fryer',   desc:'Cranks the oil. Wings cook 30% faster.', cost:45 },
  { id:'tongs',    name:'Golden Tongs',  desc:'Forgiving grip, wider perfect-cook window.', cost:70 },
  { id:'bigbasket',name:'Jumbo Baskets', desc:'16 wings a basket for serious bulk batches.', cost:85 },
  { id:'sauceboss',name:'Sauce Boss',    desc:'Fewer tosses to drench a batch.', cost:65 },
  { id:'slots',    name:'Extra Hand',    desc:'One more ticket on the rail at a time.', cost:95 },
  { id:'charm',    name:'Charm School',  desc:'Folks wait 35% longer without grumbling.', cost:60 },
  { id:'loyal',    name:'Loyalty Cards', desc:'Regulars tip +12% on every total.', cost:110 },
  { id:'disco',    name:'Disco Night',   desc:'Lights up, mood up, tips up 15%.', cost:130 },
];
const G = {
  state:'title', day:1, money:0, streak:0, served:0, customersToday:5,
  queue:[], leaving:[], orders:[], selId:null, spawned:0, spawnT:1.5,
  bowl:{ count:0, cook:0, sauce:null, coat:0 },
  upgrades:{}, dayEarnings:0, dayStarSum:0, serving:false, bestCombo:0,
};
const unlockedSauces   = () => SAUCES.filter(s => s.day <= G.day);
const unlockedSides    = () => SIDES.filter(s => s.day <= G.day);
const unlockedDips      = () => DIPS.filter(s => s.day <= G.day);
const unlockedGarnishes = () => GARNISHES.filter(s => s.day <= G.day && s.id !== 'none');
const fmt$ = v => '$' + v.toFixed(2);
const hex = c => '#' + c.toString(16).padStart(6, '0');
function blankPlate() { return { wings:0, cook:0, sauce:null, coat:0, sides:{}, dip:'none', garnish:'none' }; }
function maxOrders() {
  let n = 3;                  // juggle a few from day one
  if (G.day >= 4) n++;
  if (G.day >= 8) n++;
  if (G.upgrades.slots) n++;
  return Math.min(n, 6);
}
const basketCap = () => G.upgrades.bigbasket ? 16 : 12;

function saveGame() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ day: G.day, money: G.money, upgrades: G.upgrades, bestCombo: G.bestCombo }));
  } catch(e) {}
}
function loadGame() {
  try {
    const d = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (d && d.day) { G.day = d.day; G.money = d.money || 0; G.upgrades = d.upgrades || {}; G.bestCombo = d.bestCombo || 0; return true; }
  } catch(e) {}
  return false;
}

/* ============================================================
   ORDERS — multiple at once
   ============================================================ */
let orderSeq = 0;
const DUMMY_PLATE = blankPlate();
const selOrder = () => G.orders.find(o => o.id === G.selId) || null;
const curPlate = () => { const o = selOrder(); return o ? o.plate : DUMMY_PLATE; };

function genOrder() {
  const wingChoices = [4, 6];
  if (G.day >= 2) wingChoices.push(8);
  if (G.day >= 5) wingChoices.push(10);
  if (G.day >= 7) wingChoices.push(12);
  return {
    wings: pick(wingChoices),
    sauce: pick(unlockedSauces()).id,
    side: rand() < .82 ? { id: pick(unlockedSides()).id, count: randi(2, Math.min(3 + Math.floor(G.day/2), 6)) } : null,
    dip: rand() < .7 ? pick(unlockedDips().filter(d => d.id !== 'none')).id : 'none',
    garnish: (G.day >= 2 && unlockedGarnishes().length && rand() < .2 + G.day*.03)
      ? pick(unlockedGarnishes()).id : 'none',
  };
}
function orderText(o) {
  const s = sauceById(o.sauce);
  let t = `${o.wings} <b>${s.name}</b> wings`;
  if (o.side) t += `, ${o.side.count} ${sideById(o.side.id).name.toLowerCase()}`;
  if (o.dip !== 'none') t += `, ${dipById(o.dip).name.toLowerCase()} dip`;
  if (o.garnish !== 'none') t += `, ${garnishById(o.garnish).name.toLowerCase()}`;
  return t + '!';
}
// progress of a plate against a requirement → { rows:[{ok,html,prog}], done }
function reqProgress(req, p) {
  const chip = c => `<span class="chip" style="background:${hex(c)}"></span>`;
  const rows = [];
  const sc = sauceById(req.sauce);
  const wingsOk = p.wings === req.wings && p.sauce === req.sauce && p.coat >= .95;
  rows.push({ ok: wingsOk, html: `${chip(sc.color)}${req.wings} ${sc.name} wings`, prog: `${p.wings}/${req.wings}` });
  if (req.side) {
    const sd = sideById(req.side.id), got = p.sides[req.side.id] || 0;
    rows.push({ ok: got === req.side.count, html: `${chip(sd.color)}${req.side.count} ${sd.name}`, prog: `${got}/${req.side.count}` });
  }
  if (req.dip !== 'none') {
    const dp = dipById(req.dip);
    rows.push({ ok: p.dip === req.dip, html: `${chip(dp.color)}${dp.name} dip`, prog: p.dip === req.dip ? '✓' : '·' });
  }
  if (req.garnish !== 'none') {
    const gn = garnishById(req.garnish);
    rows.push({ ok: p.garnish === req.garnish, html: `${chip(gn.color)}${gn.name}`, prog: p.garnish === req.garnish ? '✓' : '·' });
  }
  return { rows, done: rows.every(r => r.ok) };
}

/* ---- ticket rail (one card per active order) ---- */
function renderTickets() {
  const rail = $('ticketRail');
  rail.innerHTML = '';
  G.orders.forEach(o => {
    const { rows, done } = reqProgress(o.req, o.plate);
    const card = document.createElement('div');
    card.className = 'ticketCard' + (o.id === G.selId ? ' sel' : '') + (done ? ' ready' : '');
    card.dataset.id = o.id;
    card.innerHTML = `
      <div class="tcHead"><b>${o.cust.name}</b>${done ? '<span class="tcReady">READY</span>' : ''}</div>
      <div class="tcPat"><i style="width:${o.cust.patience}%"></i></div>
      <div class="tcRows">${rows.map(r =>
        `<div class="tcRow ${r.ok ? 'ok' : ''}">${r.html}<span class="tcProg">${r.prog}</span></div>`).join('')}</div>`;
    card.onclick = () => selectOrder(o.id);
    rail.appendChild(card);
  });
  rail.classList.toggle('show', G.orders.length > 0);
}
function selectOrder(id) {
  if (G.selId === id) return;
  G.selId = id;
  AudioFX.click();
  renderTickets();
  renderPlate(selOrder());
  updateSauceUI();
}

/* ============================================================
   CUSTOMER FLOW
   ============================================================ */
const QUEUE_SLOTS = [
  new THREE.Vector3(2.2, 0, 4.5),
  new THREE.Vector3(4.2, 0, 5.8),
  new THREE.Vector3(6.0, 0, 7.3),
  new THREE.Vector3(7.6, 0, 9.0),
  new THREE.Vector3(9.0, 0, 10.8),
];
const WAIT_SLOTS = [
  new THREE.Vector3(-1.6, 0, 4.4),
  new THREE.Vector3(-3.4, 0, 4.5),
  new THREE.Vector3(-5.2, 0, 4.7),
  new THREE.Vector3(-1.8, 0, 6.2),
  new THREE.Vector3(-3.8, 0, 6.3),
  new THREE.Vector3(-5.8, 0, 6.4),
];
function spawnCustomer() {
  const c = makeCustomer();
  c.group.position.copy(DOOR_POS);
  c.order = genOrder();
  c.patience = 100;
  c.orderId = null;
  G.queue.push(c);
  registerClick(c.group, () => {
    if (c.orderId != null) selectOrder(c.orderId);
    else if (G.queue[0] === c && c.state === 'waiting') takeOrder();
  }, () => curView === 'counter' && (c.orderId != null ||
       (G.queue[0] === c && c.state === 'waiting' && G.orders.length < maxOrders())),
     () => c.orderId != null ? `${c.name}'s ticket` : `Take ${c.name}'s order`);
  AudioFX.ding();
  sendQueueToSlots();
}
function sendQueueToSlots() {
  G.queue.forEach((c, i) => {
    const slot = QUEUE_SLOTS[Math.min(i, QUEUE_SLOTS.length-1)];
    c.state = 'walking';
    c.moveTo(slot, () => {
      c.state = i === 0 ? 'waiting' : 'queued';
      c.faceToward(new THREE.Vector3(0, 0, 0));
      c.setExpression(i === 0 ? 'neutral' : 'neutral');
    });
  });
}
function takeOrder() {
  const c = G.queue[0];
  if (!c || c.state !== 'waiting') return;
  if (G.orders.length >= maxOrders()) { showToast('Whoa, hands full! Clear a ticket first.', 'bad'); return; }
  G.queue.shift();
  const o = { id: ++orderSeq, cust: c, req: c.order, plate: blankPlate() };
  c.orderId = o.id;
  c.state = 'awaitFood';
  c.setExpression('happy');
  G.orders.push(o);
  const slot = WAIT_SLOTS[(G.orders.length-1) % WAIT_SLOTS.length];
  c.moveTo(slot, () => c.faceToward(new THREE.Vector3(0, 0, 0)));
  AudioFX.click(); AudioFX.pop();
  showBubble(c, `"${orderText(c.order)}"`, 5);
  G.selId = o.id;
  renderTickets();
  renderPlate(o);
  sendQueueToSlots();
  showToast("Ticket's up! Hit the fryers.", 'good');
}
let bubbleCust = null, bubbleTimer = 0;
function showBubble(cust, html, secs = 4) {
  bubbleCust = cust;
  $('bubble').innerHTML = html;
  $('bubble').classList.add('show');
  bubbleTimer = secs;
}

/* ============================================================
   FRY STATION LOGIC
   ============================================================ */
const fryUI = [];
function buildFryUI() {
  const root = $('fryControls');
  root.innerHTML = '';
  fryUI.length = 0;
  const cards = [];
  FRYER.baskets.forEach((b, i) => {
    const card = document.createElement('div');
    card.className = 'panel basketCard';
    card.innerHTML = `
      <h4>BASKET ${i ? 'B' : 'A'}</h4>
      <div class="meter"><div class="zone"></div><div class="fill"></div><div class="needle"></div></div>
      <div class="cookState">empty</div>
      <div class="btnrow">
        <button class="sbtn" data-a="add">+2 WINGS</button>
        <button class="sbtn" data-a="drop">DROP</button>
        <button class="sbtn" data-a="send">TO SAUCE</button>
      </div>`;
    const ui = {
      fill: card.querySelector('.fill'), zone: card.querySelector('.zone'),
      needle: card.querySelector('.needle'), state: card.querySelector('.cookState'),
      add: card.querySelector('[data-a=add]'), drop: card.querySelector('[data-a=drop]'),
      send: card.querySelector('[data-a=send]'),
    };
    ui.add.onclick = () => addWings(b);
    ui.drop.onclick = () => toggleBasket(b, ui);
    ui.send.onclick = () => sendToSauce(b);
    fryUI[i] = ui; // indexed by basket so the cook loop can find it
    cards.push({ card, x: b.group.position.x });
    registerClick(b.group, () => toggleBasket(b, ui), () => curView === 'fry',
      () => b.lowered ? 'Raise the basket' : b.count ? 'Drop into the oil' : 'Fryer basket (add wings first)');
  });
  // the fry camera faces +z, so larger world-x renders further LEFT on screen.
  cards.sort((a, b) => b.x - a.x).forEach(c => root.appendChild(c.card));
}
function addWings(b) {
  if (b.count >= basketCap()) { showToast("That basket's packed tight!", 'bad'); return; }
  if (b.count > 0 && b.cook > .25) { showToast("Those are already sizzlin'!", 'bad'); return; }
  for (let i = 0; i < 2; i++) {
    const w = makeWingMesh();
    w.position.set(rand(-.28,.28), rand(-.07,.0), rand(-.34,.34));
    w.rotation.set(rand(-.25,.25), rand(Math.PI*2), rand(-.25,.25));
    w.scale.setScalar(.8);
    w.userData.baseY = w.position.y;
    w.userData.baseRotZ = w.rotation.z;
    w.userData.phase = rand(Math.PI*2);
    b.wingsGroup.add(w);
    b.wings.push(w);
    popIn(w, .8, .35);
  }
  b.count += 2;
  AudioFX.plop();
}
function toggleBasket(b, ui) {
  b.lowered = !b.lowered;
  const y = b.lowered ? b.downY : b.upY;
  tween(.45, k => { b.group.position.y = lerp(b.group.position.y, y, k); }, { ease: Ease.outBack });
  if (b.lowered && b.count > 0) {
    AudioFX.splat();
    burstSplat(b.oilPos.clone().setY(b.oilY + .12), 0xe8b84a, 8);
  } else {
    AudioFX.whoosh();
    if (b.count > 0 && b.cook > .15) {
      for (let i = 0; i < 8; i++) spawnParticle({
        pos: b.oilPos.clone().setY(b.oilY).add(new THREE.Vector3(rand(-.4,.4), 0, rand(-.5,.5))),
        vel: new THREE.Vector3(rand(-.2,.2), rand(-.3,-1.1), rand(-.2,.2)),
        life: rand(.4,.7), size: rand(.04,.09), color: 0xe8b84a, gravity: 7, opacity:.9,
      });
      burstSteam(b.oilPos.clone().setY(b.oilY + .25), 5);
    }
  }
  if (ui) ui.drop.textContent = b.lowered ? 'RAISE' : 'DROP';
  const anyFrying = FRYER.baskets.some(x => x.lowered && x.count > 0);
  anyFrying ? AudioFX.sizzleOn() : AudioFX.sizzleOff();
}
function sendToSauce(b) {
  if (b.count === 0) { showToast('Nothing in that basket to send.', 'bad'); return; }
  if (b.lowered) { showToast('Pull the basket up first!', 'bad'); return; }
  if (G.bowl.count > 0) { showToast("Bowl's still loaded, plate those first.", 'bad'); return; }
  G.bowl = { count: b.count, cook: b.cook, sauce: null, coat: 0 };
  b.wings.forEach(w => b.wingsGroup.remove(w));
  burstSteam(b.group.position, 5);
  b.wings = []; b.count = 0; b.cook = 0;
  fillBowlWings();
  AudioFX.whoosh(); AudioFX.plop();
  showToast(`${G.bowl.count} wings in the bowl. Sauce 'em up!`, 'good');
  goView('sauce');
  updateSauceUI();
}
const bowlWings = [];
function fillBowlWings() {
  bowlWings.forEach(w => SAUCE_ST.wingsGroup.remove(w));
  bowlWings.length = 0;
  for (let i = 0; i < G.bowl.count; i++) {
    const w = makeWingMesh();
    const a = i/G.bowl.count*Math.PI*2;
    const r = i % 2 ? .42 : .2;
    w.position.set(Math.cos(a)*r, .06 + (i%3)*.07, Math.sin(a)*r);
    w.rotation.y = rand(Math.PI*2);
    w.scale.setScalar(.78);
    styleWing(w, G.bowl.cook, null, 0);
    SAUCE_ST.wingsGroup.add(w);
    bowlWings.push(w);
    popIn(w, .78, .4);
  }
}

/* ============================================================
   SAUCE STATION LOGIC
   ============================================================ */
function uiSelectSauce(id) {
  if (G.bowl.count === 0) { showToast('Fry some wings first!', 'bad'); return; }
  const s = sauceById(id);
  Object.values(SAUCE_ST.pots).forEach(p => { p.scale.setScalar(1); p.position.y = p.userData.baseY; });
  const pot = SAUCE_ST.pots[id];
  pot.scale.setScalar(1.12);
  tween(.4, k => { pot.position.y = pot.userData.baseY + Math.sin(k*Math.PI)*.22; }, { ease: t=>t });
  if (G.bowl.sauce !== id) {
    G.bowl.sauce = id;
    G.bowl.coat = 0;
    SAUCE_ST.liquid.visible = true;
    SAUCE_ST.liquid.material.color.set(s.color);
    SAUCE_ST.liquid.material.emissive.set(s.glow ? s.color : 0x000000);
    SAUCE_ST.liquid.material.emissiveIntensity = s.glow ? .4 : 0;
    burstSplat(SAUCE_ST.bowl.position.clone().add(new THREE.Vector3(0, .6, 0)), s.color, 12);
    AudioFX.splat();
    bowlWings.forEach(w => styleWing(w, G.bowl.cook, null, 0));
  }
  updateSauceUI();
}
function tossWings() {
  if (G.bowl.count === 0) { showToast('Empty bowl. Go fry a batch.', 'bad'); return; }
  if (!G.bowl.sauce) { showToast('Pick a sauce, tap a pot to pour.', 'bad'); return; }
  const s = sauceById(G.bowl.sauce);
  const gain = G.upgrades.sauceboss ? rand(.26, .34) : rand(.16, .23);
  G.bowl.coat = clamp(G.bowl.coat + gain, 0, 1);
  AudioFX.whoosh();
  setTimeout(() => AudioFX.splat(), 120);
  tween(.4, k => { SAUCE_ST.bowl.rotation.z = Math.sin(k*Math.PI*3)*.16*(1-k); }, { ease: t=>t });
  bowlWings.forEach(w => {
    const h = rand(.4, .9), spin = rand(-6, 6);
    const x0 = w.position.x;
    tween(rand(.35,.5), k => {
      w.position.y = .06 + Math.sin(k*Math.PI)*h;
      w.rotation.x += spin*.016;
      w.position.x = x0 + Math.sin(k*Math.PI)*rand(-.04,.04);
    }, { ease: t=>t });
    styleWing(w, G.bowl.cook, s, G.bowl.coat);
  });
  burstSplat(SAUCE_ST.bowl.position.clone().add(new THREE.Vector3(0, .7, 0)), s.color, 8);
  updateSauceUI();
  if (G.bowl.coat >= 1) { AudioFX.ding(); showToast('Drenched. Beautiful.', 'good', 1600); }
}
function updateSauceUI() {
  const c = G.bowl;
  $('coatBar').style.width = (c.coat*100) + '%';
  $('coatTxt').textContent = c.count === 0 ? 'Empty bowl'
    : !c.sauce ? `${c.count} wings, pick a sauce`
    : `${c.count} wings · ${Math.round(c.coat*100)}% ${sauceById(c.sauce).name}`;
  const o = selOrder();
  $('toPlateBtn').textContent = o
    ? `TO ${o.cust.name.toUpperCase()}'S PLATE`
    : 'TO PLATE';
}
// transfer wings from the bowl onto the SELECTED order's plate — only what that
// order still needs, so a big saucy batch can be split across several plates.
function sendToPlate() {
  const o = selOrder();
  if (!o) { showToast('Grab a ticket first!', 'bad'); return; }
  if (G.bowl.count === 0) { showToast("Bowl's empty.", 'bad'); return; }
  const p = o.plate;
  if (p.wings > 0 && p.sauce !== G.bowl.sauce) {
    showToast(`That plate's already got ${p.sauce ? sauceById(p.sauce).name : 'plain'} wings.`, 'bad'); return;
  }
  const need = Math.max(0, o.req.wings - p.wings);
  if (need === 0) { showToast(`${o.cust.name}'s plate is stacked already.`, 'bad'); return; }
  const move = Math.min(G.bowl.count, need);
  // plate inherits the batch's cook/sauce/coat (weighted toward the worse coat)
  if (p.wings === 0) { p.cook = G.bowl.cook; p.sauce = G.bowl.sauce; p.coat = G.bowl.coat; }
  else { p.coat = Math.min(p.coat, G.bowl.coat); p.cook = (p.cook + G.bowl.cook)/2; }
  p.wings += move;
  G.bowl.count -= move;
  if (G.bowl.count <= 0) {
    bowlWings.forEach(w => SAUCE_ST.wingsGroup.remove(w));
    bowlWings.length = 0;
    G.bowl = { count:0, cook:0, sauce:null, coat:0 };
    SAUCE_ST.liquid.visible = false;
  } else {
    fillBowlWings(); // re-lay the leftover wings
  }
  AudioFX.plop(); AudioFX.pop();
  renderPlate(o); renderTickets();
  goView('build');
  updateSauceUI();
  showToast(G.bowl.count > 0
    ? `Plated ${move}. ${G.bowl.count} saucy ones still in the bowl.`
    : `${move} wings up for ${o.cust.name}!`, 'good');
}
function trashBowl() {
  if (G.bowl.count === 0) return;
  bowlWings.forEach(w => SAUCE_ST.wingsGroup.remove(w));
  bowlWings.length = 0;
  G.bowl = { count:0, cook:0, sauce:null, coat:0 };
  SAUCE_ST.liquid.visible = false;
  burstSteam(SAUCE_ST.bowl.position, 4);
  AudioFX.buzz();
  showToast('Dumped the bowl.', '', 1400);
  updateSauceUI();
}

/* ============================================================
   BUILD STATION LOGIC — operates on the selected order's plate
   ============================================================ */
function uiAddSide(id) {
  const o = selOrder();
  if (!o) { showToast('Grab a ticket first!', 'bad'); return; }
  const cur = o.plate.sides[id] || 0;
  if (cur >= 10) return;
  o.plate.sides[id] = cur + 1;
  AudioFX.pop();
  renderPlate(o); renderTickets();
  bumpPlate();
}
function uiSetDip(id) {
  const o = selOrder();
  if (!o) { if (id !== 'none') showToast('Pick an order ticket first!', 'bad'); return; }
  o.plate.dip = id;
  AudioFX.click();
  renderPlate(o); renderTickets();
}
function uiSetGarnish(id) {
  const o = selOrder();
  if (!o) { if (id !== 'none') showToast('Pick an order ticket first!', 'bad'); return; }
  o.plate.garnish = id;
  AudioFX.click();
  renderPlate(o); renderTickets();
  bumpPlate();
}
function clearPlate() {
  const o = selOrder();
  if (!o) return;
  o.plate = blankPlate();
  burstSteam(BUILD_ST.plateGroup.position, 4);
  AudioFX.buzz();
  renderPlate(o); renderTickets();
}
function bumpPlate() {
  const g = BUILD_ST.plateGroup;
  tween(.3, k => { g.scale.setScalar(1 + Math.sin(k*Math.PI)*.05); }, { ease: t=>t });
}
// rebuild the 3D plate from a plate's data (also used when switching tickets)
function renderPlate(o) {
  const W = BUILD_ST;
  W.wingsGroup.clear(); W.sidesGroup.clear(); W.dipGroup.clear(); W.garnishGroup.clear();
  if (!o) return;
  const p = o.plate;
  const sauce = p.sauce ? sauceById(p.sauce) : null;
  for (let i = 0; i < p.wings; i++) {
    const w = makeWingMesh();
    const a = i/Math.max(1, p.wings)*Math.PI*2 - Math.PI/2;
    const r = p.wings > 7 ? (i % 2 ? .66 : .36) : .5;
    w.position.set(Math.cos(a)*r, .16 + (i % 2)*.04, Math.sin(a)*r*.8);
    w.rotation.y = -a + Math.PI/2;
    w.scale.setScalar(.92);
    styleWing(w, p.cook, sauce, p.coat);
    W.wingsGroup.add(w);
  }
  let si = 0;
  for (const id in p.sides) for (let k = 0; k < p.sides[id]; k++) {
    const pc = makeSidePiece(id);
    const a = si*0.52 + 2.0;
    pc.position.set(Math.cos(a)*.82, .12, Math.sin(a)*.82);
    pc.rotation.y = rand(Math.PI*2);
    W.sidesGroup.add(pc); si++;
  }
  if (p.dip !== 'none') {
    const cup = makeDipCup(dipById(p.dip));
    cup.position.set(.62, .06, .5);
    W.dipGroup.add(cup);
  }
  if (p.garnish && p.garnish !== 'none') {
    const gp = makeGarnishPiece(p.garnish);
    gp.position.set(-.05, .26, -.2);
    gp.scale.setScalar(1.15);
    W.garnishGroup.add(gp);
  }
}

/* ============================================================
   SERVE + SCORING
   ============================================================ */
function serve() {
  const o = selOrder();
  if (!o) { showToast('No ticket up. Take an order first.', 'bad'); return; }
  if (o.plate.wings === 0) { showToast('Empty plate, load it up!', 'bad'); return; }
  if (G.serving) return;
  G.serving = true;
  goView('counter');
  AudioFX.ding();
  const target = o.cust.group.position.clone().add(new THREE.Vector3(0, 1.5, -1.4));
  const start = BUILD_ST.plateGroup.position.clone();
  tween(1.1, k => {
    BUILD_ST.plateGroup.position.lerpVectors(start, target, k);
    BUILD_ST.plateGroup.position.y = lerp(start.y, target.y, k) + Math.sin(k*Math.PI)*1.3;
  }, { ease: Ease.inOut, onDone: () => setTimeout(() => evaluateServe(o), 320) });
}
function evaluateServe(o) {
  const c = o.cust, req = o.req, p = o.plate;
  const lines = [];
  const wingDiff = Math.abs(p.wings - req.wings);
  const wingScore = Math.max(0, 1 - wingDiff*.22);
  lines.push(`${wingDiff === 0 ? '✓' : '✗'} Wings: ${p.wings}/${req.wings}`);

  const win = G.upgrades.tongs ? .42 : .3;
  let cookScore = Math.max(0, 1 - Math.abs(p.cook - 1)/win);
  if (p.cook > 1.3) cookScore = Math.min(cookScore, .1);
  if (p.cook < .5) cookScore = Math.min(cookScore, .15);
  lines.push(`${cookScore > .75 ? '✓' : '✗'} Cook: ${p.cook < .6 ? 'raw!' : p.cook < .85 ? 'undercooked' : p.cook <= 1.12 ? 'golden perfection' : p.cook <= 1.3 ? 'overdone' : 'burnt!'}`);

  const sauceMatch = p.sauce === req.sauce;
  const sauceScore = sauceMatch ? .4 + .6*p.coat : (p.sauce ? .2 : .05);
  lines.push(`${sauceMatch && p.coat > .9 ? '✓' : '✗'} Sauce: ${p.sauce ? sauceById(p.sauce).name : 'none'} (${Math.round(p.coat*100)}%)${sauceMatch ? '' : ', wanted ' + sauceById(req.sauce).name}`);

  let sideScore = 1, sidesExact = true;
  const extraSides = Object.keys(p.sides).filter(k => !req.side || k !== req.side.id)
    .reduce((a, k) => a + p.sides[k], 0);
  if (req.side) {
    const got = p.sides[req.side.id] || 0;
    sidesExact = got === req.side.count && extraSides === 0;
    sideScore = Math.max(0, 1 - Math.abs(got - req.side.count)*.25 - extraSides*.2);
    lines.push(`${sidesExact ? '✓' : '✗'} ${sideById(req.side.id).name}: ${got}/${req.side.count}`);
  } else if (extraSides > 0) {
    sideScore = .4; sidesExact = false;
    lines.push(`✗ Sides: none were ordered`);
  }

  const dipScore = p.dip === req.dip ? 1 : 0;
  if (req.dip !== 'none' || p.dip !== 'none')
    lines.push(`${dipScore ? '✓' : '✗'} Dip: ${dipById(p.dip).name}${dipScore ? '' : ', wanted ' + dipById(req.dip).name}`);

  const garnScore = p.garnish === req.garnish ? 1 : (req.garnish === 'none' ? .4 : 0);
  if (req.garnish !== 'none' || p.garnish !== 'none')
    lines.push(`${p.garnish === req.garnish ? '✓' : '✗'} Garnish: ${garnishById(p.garnish).name}${p.garnish === req.garnish ? '' : ', wanted ' + garnishById(req.garnish).name}`);

  // presentation rewards a complete, exact, neat plate
  const neat = [wingDiff === 0, p.coat > .9 && sauceMatch, sidesExact, dipScore === 1, p.garnish === req.garnish];
  const presScore = neat.reduce((a, b) => a + (b ? 1 : 0), 0) / neat.length;

  const total = .16*wingScore + .25*cookScore + .26*sauceScore + .12*sideScore
              + .07*dipScore + .06*garnScore + .08*presScore;
  const stars = total >= .93 ? 5 : total >= .8 ? 4 : total >= .62 ? 3 : total >= .42 ? 2 : total >= .22 ? 1 : 0;

  const base = (1.4*req.wings + .8*(req.side ? req.side.count : 0)
    + (req.dip !== 'none' ? 1 : 0) + (req.garnish !== 'none' ? .6 : 0)) * (G.upgrades.loyal ? 1.12 : 1);
  const patMult = .5 + .5*(c.patience/100);
  const tip = base * .5 * total * patMult * (G.upgrades.disco ? 1.15 : 1) * (presScore >= 1 ? 1.25 : 1);
  const pay = base*Math.max(.25, total*.85 + .15) + tip;
  G.money += pay; G.dayEarnings += pay; G.dayStarSum += stars;

  const head = worldToScreen(c.headPos());
  moneyPop(head.x, head.y - 40, '+' + fmt$(pay));
  const starStr = '★'.repeat(stars) + '☆'.repeat(5-stars);
  if (stars >= 5) {
    c.setExpression('starry'); c.jumpJoy();
    burstConfetti(c.headPos(), 40); burstStars(c.headPos(), 10);
    AudioFX.fanfare(); bigBanner('PERFECT! ' + starStr);
    G.streak++;
    if (G.streak >= 2) { showToast(`${G.streak}× perfect streak! +${fmt$(G.streak)} bonus`, 'good'); G.money += G.streak; }
    G.bestCombo = Math.max(G.bestCombo, G.streak);
  } else if (stars >= 4) {
    c.setExpression('happy'); c.jumpJoy(); burstStars(c.headPos(), 6); AudioFX.jingle();
    bigBanner(starStr, '#8fe388'); G.streak = 0;
  } else if (stars >= 3) {
    c.setExpression('neutral'); AudioFX.chaching(); bigBanner(starStr, '#e8c9a8'); G.streak = 0;
  } else if (stars >= 2) {
    c.setExpression('grumpy'); AudioFX.sad(); bigBanner(starStr, '#e8a87a'); G.streak = 0;
  } else {
    c.setExpression('angry'); c.shakeAnger(); AudioFX.buzz(); bigBanner(starStr + ' YUCK!', '#ff8a70'); G.streak = 0;
  }
  AudioFX.chaching();
  showToast(lines.join('<br>'), stars >= 4 ? 'good' : stars >= 3 ? '' : 'bad', 4200);
  showBubble(c, stars >= 4 ? pick(['"These are unreal!"','"Best wings in the city!"','"I\'m telling everyone."','"Crispy little miracles."']) :
             stars >= 3 ? pick(['"Solid. Thanks, chef."','"That hit the spot."','"Good stuff."']) :
             pick(['"...the heck is this?"','"My grandma fries better."','"I waited for THIS?"','"Yikes."']), 2.5);

  setTimeout(() => {
    // remove order, send customer off
    G.orders = G.orders.filter(x => x.id !== o.id);
    c.orderId = null;
    c.state = 'leaving';
    c.moveTo(DOOR_POS, () => { c.dispose(); G.leaving.splice(G.leaving.indexOf(c), 1); });
    G.leaving.push(c);
    // pick another order to show, reset the plate prop home
    G.selId = G.orders.length ? G.orders[0].id : null;
    tweenVec(BUILD_ST.plateGroup.position, BUILD_ST.home, .7, { ease: Ease.outBack });
    renderPlate(selOrder());
    renderTickets();
    G.served++;
    G.serving = false;
    updateHUD();
    if (G.served >= G.customersToday && G.orders.length === 0) setTimeout(endDay, 1600);
  }, 1700);
}

/* ============================================================
   DAY CYCLE
   ============================================================ */
function startDay() {
  G.state = 'day';
  G.served = 0; G.spawned = 0; G.dayEarnings = 0; G.dayStarSum = 0; G.streak = 0;
  G.orders = []; G.selId = null; G.bowl = { count:0, cook:0, sauce:null, coat:0 };
  G.customersToday = Math.min(5 + Math.floor(G.day*1.5), 16);
  G.spawnT = 1;
  buildStationUI();
  refreshUnlockVisibility();
  renderTickets(); renderPlate(null);
  updateHUD();
  goView('counter');
  bigBanner(`DAY ${G.day}: WE'RE OPEN!`);
  AudioFX.jingle();
  if (G.upgrades.disco) { disco.visible = true; discoLights.forEach(l => l.intensity = 30); }
}
function endDay() {
  G.state = 'dayend';
  saveGame();
  const avg = G.served ? G.dayStarSum/G.served : 0;
  $('dayEndTitle').textContent = `Day ${G.day} complete!`;
  $('dayStars').textContent = '★'.repeat(Math.round(avg)) + '☆'.repeat(5-Math.round(avg));
  $('dayStats').innerHTML = `
    <div class="statline"><span>Customers served</span><b>${G.served}</b></div>
    <div class="statline"><span>Today's earnings</span><b style="color:#8fe388">${fmt$(G.dayEarnings)}</b></div>
    <div class="statline"><span>Average rating</span><b>${avg.toFixed(1)} ★</b></div>
    <div class="statline"><span>Total money</span><b style="color:#8fe388">${fmt$(G.money)}</b></div>
    <div class="statline"><span>Best perfect streak</span><b>×${G.bestCombo}</b></div>`;
  renderUpgrades();
  $('dayEnd').classList.remove('hidden');
  AudioFX.fanfare();
}
function renderUpgrades(gridId = 'upGrid') {
  const grid = $(gridId);
  grid.innerHTML = '';
  UPGRADES.forEach(u => {
    const owned = G.upgrades[u.id];
    const card = document.createElement('div');
    card.className = 'upCard' + (owned ? ' owned' : '');
    card.innerHTML = `<b>${u.name}</b><small>${u.desc}</small>
      <button class="sbtn" ${owned || G.money < u.cost ? 'disabled' : ''}>
        ${owned ? '✓ Owned' : 'Buy: ' + fmt$(u.cost)}</button>`;
    if (!owned) card.querySelector('button').onclick = () => {
      if (G.money < u.cost) return;
      G.money -= u.cost;
      G.upgrades[u.id] = true;
      AudioFX.chaching();
      saveGame(); renderUpgrades(gridId); updateHUD();
      if ($('shopMoney')) $('shopMoney').textContent = fmt$(G.money);
      showToast(`${u.name}, unlocked!`, 'good');
    };
    grid.appendChild(card);
  });
}
$('nextDayBtn').onclick = () => {
  G.day++;
  saveGame();
  $('dayEnd').classList.add('hidden');
  const newStuff = [...SAUCES, ...SIDES, ...DIPS, ...GARNISHES].filter(x => x.day === G.day);
  if (newStuff.length) showToast('NEW on the menu: <b>' + newStuff.map(x => x.name).join(', ') + '</b>!', 'good', 4200);
  startDay();
};

/* ============================================================
   UI WIRING
   ============================================================ */
function buildStationUI() {
  buildFryUI();
  updateSauceUI();
}
function refreshUnlockVisibility() {
  SAUCES.forEach(s => { SAUCE_ST.pots[s.id].visible = s.day <= G.day; });
  SIDES.forEach(s => { BUILD_ST.bins[s.id].visible = s.day <= G.day; });
  DIPS.filter(d => d.id !== 'none').forEach(d => { BUILD_ST.cups[d.id].visible = d.day <= G.day; });
  GARNISHES.filter(g => g.id !== 'none').forEach(g => { if (BUILD_ST.trays[g.id]) BUILD_ST.trays[g.id].visible = g.day <= G.day; });
}
function updateHUD() {
  $('dayLabel').textContent = G.day;
  $('servedLabel').textContent = `${G.served}/${G.customersToday}`;
  $('moneyLabel').textContent = fmt$(G.money);
  $('ordersLabel').textContent = `${G.orders.length}/${maxOrders()}`;
  $('streakPill').classList.toggle('on', G.streak >= 2);
  $('streakLabel').textContent = G.streak;
}
const HINTS = {
  counter: 'Tap a customer in line to take their order. Tap a seated one to work their ticket.',
  fry: "Drop a basket, then yank it up while the meter's sitting in the green.",
  sauce: "Pour a pot, toss till they're drenched, then send 'em to your ticket.",
  build: 'Pick a ticket, pile on the sides, dip and garnish, then send it out hot.',
};
function onViewChanged(name) {
  document.querySelectorAll('#stationNav button').forEach(b =>
    b.classList.toggle('active', b.dataset.view === name));
  $('fryControls').classList.toggle('hidden', name !== 'fry');
  $('sauceControls').classList.toggle('hidden', name !== 'sauce');
  $('buildControls').classList.toggle('hidden', name !== 'build');
  const names = { counter:'THE COUNTER', fry:'FRY STATION', sauce:'SAUCE STATION', build:'PLATING' };
  if (G.state === 'day' && names[name]) {
    $('stationName').textContent = names[name];
    $('stationName').classList.add('show');
    $('hint').textContent = HINTS[name] || '';
    $('hint').classList.add('show');
    clearTimeout(onViewChanged._t);
    onViewChanged._t = setTimeout(() => {
      $('stationName').classList.remove('show');
      $('hint').classList.remove('show');
    }, 2800);
  }
}
document.querySelectorAll('#stationNav button').forEach(b =>
  b.onclick = () => { AudioFX.init(); AudioFX.click(); goView(b.dataset.view); });
addEventListener('keydown', e => {
  if (G.state !== 'day') return;
  const views = { Digit1:'counter', Digit2:'fry', Digit3:'sauce', Digit4:'build' };
  if (views[e.code]) goView(views[e.code]);
  if (e.code === 'Space' && curView === 'sauce') { e.preventDefault(); tossWings(); }
  // tab cycles selected order
  if (e.code === 'Tab' && G.orders.length) {
    e.preventDefault();
    const i = G.orders.findIndex(o => o.id === G.selId);
    selectOrder(G.orders[(i+1) % G.orders.length].id);
  }
});
$('tossBtn').onclick = tossWings;
$('toPlateBtn').onclick = sendToPlate;
$('trashBowlBtn').onclick = trashBowl;
$('serveBtn').onclick = serve;
$('trashPlateBtn').onclick = clearPlate;
$('takeOrderBtn').onclick = takeOrder;

/* ---- main menu navigation ---- */
function openMenuScreen(id) {
  AudioFX.init(); AudioFX.click();
  if (id === 'menuShop') { renderUpgrades('shopGrid'); $('shopMoney').textContent = fmt$(G.money); }
  $('titleScreen').classList.add('hidden');
  $(id).classList.remove('hidden');
}
$('menuShopBtn').onclick = () => openMenuScreen('menuShop');
$('menuHelpBtn').onclick = () => openMenuScreen('menuHelp');
$('menuCreditsBtn').onclick = () => openMenuScreen('menuCredits');
document.querySelectorAll('.menuBack').forEach(b => b.onclick = () => {
  AudioFX.click();
  $(b.dataset.menu).classList.add('hidden');
  $('titleScreen').classList.remove('hidden');
});

/* title screen */
const hasSave = loadGame();
if (hasSave) {
  $('startBtn').textContent = `CONTINUE, DAY ${G.day}`;
  $('newGameBtn').classList.remove('hidden');
}
$('startBtn').onclick = () => { AudioFX.init(); $('titleScreen').classList.add('hidden'); startDay(); };
$('newGameBtn').onclick = () => {
  localStorage.removeItem(SAVE_KEY);
  G.day = 1; G.money = 0; G.upgrades = {}; G.bestCombo = 0;
  AudioFX.init();
  $('titleScreen').classList.add('hidden');
  startDay();
};

/* ============================================================
   MAIN LOOP
   ============================================================ */
const COOK_TIME = () => G.upgrades.fastfry ? 6.3 : 9;
let titleAngle = .65, lastT = 0, railTimer = 0;
renderer.setAnimationLoop((t) => {
  const dt = Math.min(.05, (t - lastT)/1000 || .016);
  lastT = t;
  updateTweens(dt);
  updateParticles(dt);

  G.queue.forEach(c => c.update(dt));
  G.leaving.forEach(c => c.update(dt));
  G.orders.forEach(o => o.cust.update(dt));

  if (G.state === 'title') {
    titleAngle += dt*.07;
    camera.position.set(Math.sin(titleAngle)*12, 7.2, Math.cos(titleAngle)*9 + 5.5);
    camTarget.set(0, 2.2, 1);
  }
  if (G.state === 'day') {
    // spawn customers
    if (G.spawned < G.customersToday) {
      G.spawnT -= dt;
      if (G.spawnT <= 0 && G.queue.length < QUEUE_SLOTS.length) {
        spawnCustomer();
        G.spawned++;
        G.spawnT = clamp(rand(7, 12) - G.day*.3, 3.5, 12);
      }
    }
    const decay = G.upgrades.charm ? .65 : 1;
    // queue patience
    G.queue.forEach((c) => {
      if (c.state === 'waiting' || c.state === 'queued')
        c.patience = Math.max(6, c.patience - dt*1.0*decay);
      if (c.patience < 40 && c.state !== 'walking') c.setExpression('grumpy');
    });
    // waiting-for-food patience (each active order)
    if (!G.serving) G.orders.forEach(o => {
      o.cust.patience = Math.max(6, o.cust.patience - dt*.7*decay);
      if (o.cust.patience < 35) o.cust.setExpression('grumpy');
    });
    // refresh ticket-rail patience bars a few times a second
    railTimer += dt;
    if (railTimer > .25) {
      railTimer = 0;
      document.querySelectorAll('#ticketRail .ticketCard').forEach(card => {
        const o = G.orders.find(x => x.id == card.dataset.id);
        if (o) { const bar = card.querySelector('.tcPat i'); if (bar) bar.style.width = o.cust.patience + '%'; }
      });
    }
    // take-order button floats over the front customer when a slot is free
    const first = G.queue[0];
    const canTake = first && first.state === 'waiting' && G.orders.length < maxOrders();
    const showBtn = canTake && curView === 'counter';
    $('takeOrderBtn').classList.toggle('show', !!showBtn);
    if (showBtn) {
      const s = worldToScreen(first.headPos());
      $('takeOrderBtn').style.left = s.x + 'px';
      $('takeOrderBtn').style.top = (s.y - 96) + 'px';
    }
    document.querySelector('[data-view=counter]').classList.toggle('alert', !!(canTake && curView !== 'counter'));
    // speech bubble follows its customer
    if ($('bubble').classList.contains('show') && bubbleCust) {
      const s = worldToScreen(bubbleCust.headPos());
      $('bubble').style.left = s.x + 'px';
      $('bubble').style.top = (s.y - 16) + 'px';
      bubbleTimer -= dt;
      if (bubbleTimer <= 0) $('bubble').classList.remove('show');
    }
    // fryer
    FRYER.baskets.forEach((b, i) => {
      const frying = b.lowered && b.count > 0;
      if (frying) {
        b.cook = Math.min(1.5, b.cook + dt/COOK_TIME());
        b.bubbleT -= dt;
        if (b.bubbleT <= 0) {
          b.bubbleT = .07;
          const ww = pick(b.wings);
          const bx = b.group.position.x + ww.position.x + rand(-.12,.12);
          const bz = b.group.position.z + ww.position.z + rand(-.12,.12);
          spawnParticle({
            pos: new THREE.Vector3(bx, b.oilY, bz),
            vel: new THREE.Vector3(rand(-.1,.1), rand(.4,.9), rand(-.1,.1)),
            life: rand(.2,.45), size: rand(.04,.1), color: 0xf2cf7a, opacity:.85,
          });
          if (Math.random() < .35) burstSteam(new THREE.Vector3(bx, b.oilY + .04, bz), 1);
        }
        if (b.cook > 1.3 && Math.random() < .05)
          spawnParticle({ pos: b.oilPos.clone(), vel: new THREE.Vector3(0, 1.2, 0),
            life: 1.2, size: .4, color: 0x444444, opacity: .4, grow: .6 });
      }
      b.wings.forEach(w => {
        styleWing(w, b.cook, null, 0);
        const ph = w.userData.phase || 0;
        if (frying) {
          w.position.y = w.userData.baseY + Math.sin(t*.006 + ph)*.028 + .006;
          w.rotation.z = w.userData.baseRotZ + Math.sin(t*.0045 + ph*1.3)*.14;
        } else if (w.userData.baseY !== undefined) {
          w.position.y += (w.userData.baseY - w.position.y)*.2;
          w.rotation.z += (w.userData.baseRotZ - w.rotation.z)*.2;
        }
      });
      const ui = fryUI[i];
      if (ui && curView === 'fry') {
        const lo = G.upgrades.tongs ? .79 : .85, hi = G.upgrades.tongs ? 1.21 : 1.12;
        ui.zone.style.left = (lo/1.5*100) + '%';
        ui.zone.style.width = ((hi-lo)/1.5*100) + '%';
        ui.fill.style.width = (b.cook/1.5*100) + '%';
        ui.needle.style.left = (b.cook/1.5*100) + '%';
        ui.state.textContent = b.count === 0 ? 'empty'
          : !b.lowered && b.cook === 0 ? `${b.count} raw wings ready`
          : b.cook < .85 ? 'cooking…'
          : b.cook <= 1.12 ? '✨ GOLDEN, PULL IT!'
          : b.cook <= 1.3 ? '⚠ getting dark!'
          : '🔥 BURNT!';
        ui.state.style.color = b.cook > 1.12 && b.count ? '#ff8a70' : '#ffc14d';
      }
    });
  }
  updateCity(dt);
  neonMat.opacity = .92 + Math.sin(t*.004)*.05 + (Math.random() < .012 ? -.4 : 0);
  neonLight.intensity = 16 + Math.sin(t*.004)*3;
  lampLights.forEach((l, i) => l.intensity = 11 + Math.sin(t*.002 + i*2)*1.2);
  if (disco.visible) {
    disco.rotation.y = t*.001;
    discoLights.forEach((l, i) => {
      l.intensity = 26 + Math.sin(t*.005 + i*Math.PI)*18;
      l.position.x = Math.sin(t*.0012 + i*Math.PI)*8;
    });
  }
  updateCamera(dt);
  renderer.render(scene, camera);
});
// render one frame immediately so the scene shows the instant the page loads
camera.position.set(Math.sin(titleAngle)*12, 7.2, Math.cos(titleAngle)*9 + 5.5);
camera.lookAt(0, 2.2, 1);
renderer.render(scene, camera);
