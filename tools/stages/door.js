$('startBtn').click();
const c = makeCustomer();
c.order = genOrder(); c.group.position.set(11.3,0,14.8); c.group.rotation.y=Math.PI; c.state='entering';
G.queue.push(c);
openDoor();
updateTweens(0.5); // door mid-swing
// frame the doorway directly
curView='counter';
killTweens('cam');
camera.position.set(7.5, 3.2, 9.5);
camTarget.set(11.5, 2.2, 17);
look.yaw=look.yawT=0; look.pitch=look.pitchT=0;
for (let i=0;i<20;i++) updateCity(.1);
