$('startBtn').click();
const c = makeCustomer();
c.order = genOrder(); c.group.position.copy(DOOR_POS); c.state='entering'; c.entered=false; c.orderId=null;
G.queue.push(c);
openDoor();
// partway through entering so the door is mid-swing and customer near the door
for (let i=0;i<60;i++){ c.update(.016); updateTweens(.016); }
goView('counter', .01);
updateTweens(1);
for (let i=0;i<20;i++) updateCity(.1);
