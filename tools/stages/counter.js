$('startBtn').click();
const c = makeCustomer();
c.order = genOrder(); c.patience = 85;
c.group.position.set(0, 0, 4.35);
c.state = 'waiting';
G.queue.push(c);
const c2 = makeCustomer();
c2.group.position.set(2.4, 0, 5.6); c2.state = 'queued';
G.queue.push(c2);
takeOrder();
for (let i = 0; i < 400; i++) { G.active.update(.016); updateTweens(.016); updateParticles(.016); }
goView('counter', .01);
updateTweens(1);
for (let i = 0; i < 30; i++) updateCity(.1);
