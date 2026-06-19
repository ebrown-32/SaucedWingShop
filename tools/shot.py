#!/usr/bin/env python3
"""Dev tool: screenshot the game in headless Firefox.

Headless FF never composites the WebGL canvas into --screenshot output,
so we inject a snippet that stages a scene, renders once, and mirrors the
drawing buffer into a DOM <img> (z-index above canvas, below UI overlays).

Usage: python3 tools/shot.py <name> <staging-js-file-or-inline>
"""
import subprocess, sys, tempfile, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
name, stage = sys.argv[1], sys.argv[2]
if os.path.exists(stage):
    stage = open(stage).read()

src = open(os.path.join(ROOT, 'index.html')).read()
marker = '''
try {
  renderer.setAnimationLoop(null);
  %s
  updateCamera(0);
  renderer.render(scene, camera);
  const img = document.createElement('img');
  img.src = renderer.domElement.toDataURL('image/png');
  img.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;z-index:1;';
  document.body.appendChild(img);
} catch (err) {
  const eb = document.createElement('div');
  eb.style.cssText = 'position:fixed;top:0;left:0;z-index:9999;background:#a00;color:#fff;font:12px monospace;padding:6px;white-space:pre-wrap;';
  eb.textContent = 'STAGE ERR: ' + err.message + '\\n' + err.stack;
  document.body.appendChild(eb);
}
''' % stage
src = src.replace("</script>\n</body>", marker + "</script>\n</body>")
# headless screenshots freeze CSS animations at frame 0; pin everything to end state
src = src.replace("</head>", "<style>*{animation:none !important; transition:none !important}</style></head>")

page = f'/tmp/sauced-shot-{name}.html'
open(page, 'w').write(src)
prof = tempfile.mkdtemp()
out = f'/tmp/shot-{name}.png'
subprocess.run(['/Applications/Firefox.app/Contents/MacOS/firefox', '--headless',
                '--profile', prof, '--window-size=1280,800',
                '--screenshot', out, 'file://' + page],
               capture_output=True, timeout=90)
print(out)
