$('startBtn').click();
goView('counter', .01);
updateTweens(1);
for (let i = 0; i < 40; i++) updateCity(.12);
// frame tight on the center-left front window
camera.position.set(-5, 3.6, 10);
camTarget.set(-5, 3.6, 17);
look.yaw = look.yawT = 0; look.pitch = look.pitchT = 0;
