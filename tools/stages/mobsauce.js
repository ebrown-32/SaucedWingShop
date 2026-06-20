$('startBtn').click();
const c=makeCustomer();c.order={wings:8,sauce:'buffalo',side:null,dip:'none',garnish:'none'};c.group.position.set(1,0,5);c.state='waiting';c.entered=true;c.orderId=null;G.queue.push(c);takeOrder();
goView('sauce',.01);
G.bowl={count:8,cook:1,sauce:'buffalo',coat:.6,types:Array.from({length:8},(_,i)=>i%2?'flat':'drum')};fillBowlWings();updateSauceUI();renderTickets();
updateTweens(1);
for(let i=0;i<10;i++) updateCity(.1);
