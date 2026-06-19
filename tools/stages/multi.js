$('startBtn').click();
// spawn three customers and take all their orders
for (let n = 0; n < 3; n++) {
  const c = makeCustomer();
  c.order = { wings: 6, sauce: 'buffalo', side: { id:'fries', count:3 }, dip:'ranch', garnish:'lemon' };
  c.group.position.copy(DOOR_POS);
  c.patience = 80 - n*10;
  c.orderId = null;
  G.queue.push(c);
}
sendQueueToSlots();
for (let i = 0; i < 500; i++) { G.queue.forEach(c=>c.update(.016)); G.orders.forEach(o=>o.cust.update(.016)); updateTweens(.016); }
takeOrder();
for (let i = 0; i < 300; i++) { G.queue.forEach(c=>c.update(.016)); G.orders.forEach(o=>o.cust.update(.016)); updateTweens(.016); }
takeOrder();
for (let i = 0; i < 300; i++) { G.queue.forEach(c=>c.update(.016)); G.orders.forEach(o=>o.cust.update(.016)); updateTweens(.016); }
updateHUD();
goView('counter', .01);
updateTweens(1);
for (let i = 0; i < 30; i++) updateCity(.1);
