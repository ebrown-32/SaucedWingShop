$('startBtn').click();
for (let n=0;n<3;n++){
  const c=makeCustomer();
  c.order={wings:6,sauce:'buffalo',side:{id:'fries',count:3},dip:'ranch',garnish:'lemon'};
  c.group.position.set(1+n,0,5); c.state='waiting'; c.entered=true; c.orderId=null;
  c.patience=70-n*15;
  G.queue.push(c);
  takeOrder();
}
G.selId = G.orders[0].id;  // select the first so it expands, others compact
goView('counter',.01);
updateTweens(1);
renderTickets(); updateHUD();
for (let i=0;i<15;i++) updateCity(.1);
const dbg=document.createElement('div');
dbg.style.cssText='position:fixed;bottom:2px;left:2px;z-index:999;background:#063;color:#fff;font:10px monospace;padding:3px';
dbg.textContent='orders='+G.orders.length+' cards='+document.querySelectorAll('#ticketCards .ticketCard').length;
document.body.appendChild(dbg);
