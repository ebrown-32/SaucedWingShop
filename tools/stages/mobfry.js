$('startBtn').click();
goView('fry',.01);
const b=FRYER.baskets[0];
for(let i=0;i<4;i++){const w=makeWingMesh(0xc9802f,i%2?'flat':'drum');w.position.set(rand(-.3,.3),rand(-.05,0),rand(-.36,.36));w.rotation.set(rand(-.3,.3),rand(6.28),rand(-.3,.3));w.scale.setScalar(.8);b.wingsGroup.add(w);b.wings.push(w);}
b.count=4;
updateTweens(1);
for(let i=0;i<10;i++) updateCity(.1);
