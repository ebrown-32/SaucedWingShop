$('startBtn').click();
curView = 'fry';
$('fryControls').classList.remove('hidden');
const b = FRYER.baskets[0];
for (let i=0;i<8;i++){
  const w = makeWingMesh(0xc9802f, i%2 ? 'flat' : 'drum');
  w.position.set(rand(-.3,.3), rand(-.05,.02), rand(-.36,.36));
  w.rotation.set(rand(-.3,.3), rand(6.28), rand(-.3,.3));
  w.scale.setScalar(.85);
  b.wingsGroup.add(w); b.wings.push(w);
}
b.count=8;
updateTweens(2);
killTweens('cam');
camera.position.set(-6.4, 3.25, -2.4);
camTarget.set(-6.4, 2.45, -0.2);
look.yaw=look.yawT=0; look.pitch=look.pitchT=0;
