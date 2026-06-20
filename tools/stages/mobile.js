$('startBtn').click();
const c = makeCustomer();
c.order = { wings:6, sauce:'buffalo', side:{id:'fries',count:3}, dip:'ranch', garnish:'lemon' };
c.group.position.set(2,0,5); c.state='waiting'; c.entered=true; c.orderId=null;
G.queue.push(c);
takeOrder();
for (let i=0;i<240;i++){ G.orders.forEach(o=>o.cust.update(.016)); updateTweens(.016); }
goView('sauce',.01);
G.bowl={count:8,cook:1,sauce:'buffalo',coat:.6}; fillBowlWings();
updateSauceUI(); renderTickets();
updateTweens(1);
for (let i=0;i<20;i++) updateCity(.1);
