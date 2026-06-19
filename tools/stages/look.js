$('startBtn').click();
const c = makeCustomer();
c.order = genOrder(); c.group.position.set(0,0,4.35); c.state='waiting';
G.queue.push(c);
goView('counter', .01);
updateTweens(1);
// player has dragged to glance right toward the entrance door
look.yaw = look.yawT = .85;
look.pitch = look.pitchT = .08;
