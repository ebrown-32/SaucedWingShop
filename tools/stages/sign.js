$('startBtn').click();
goView('counter', .01);
look.yaw=look.yawT=0; look.pitch=look.pitchT=.12; // glance up at the sign
updateTweens(1);
for (let i=0;i<20;i++) updateCity(.1);
