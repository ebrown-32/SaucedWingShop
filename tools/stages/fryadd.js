$('startBtn').click();
goView('fry',.01);
// simulate tapping the wing tub / basket several times
for(let i=0;i<4;i++) addWingsToAvailable();
updateTweens(1);
const a=FRYER.baskets[0], b=FRYER.baskets[1];
const dbg=document.createElement('div');
dbg.style.cssText='position:fixed;bottom:2px;left:2px;z-index:999;background:#063;color:#fff;font:11px monospace;padding:4px';
dbg.textContent='basketA.count='+a.count+' basketB.count='+b.count+' tubClickable='+(FRYER.tub?'yes':'no');
document.body.appendChild(dbg);
