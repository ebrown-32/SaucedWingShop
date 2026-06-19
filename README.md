# 🍗 SAUCED! — The 3D Wing Shop

A 3D wing-shop time-management game inspired by Papa's Wingeria, built with
Three.js. Everything — models, textures, faces, sound effects, and music — is
generated procedurally in code; there are no asset files.

## Play

Open **`index.html`** in any modern browser (double-click works — Three.js
loads from a CDN, so you need an internet connection).

### How to play

You play in first person from behind the counter, looking out at your
customers and dining room. **Drag anywhere on the screen to look around.**
Everything in the shop is clickable — hover for labels. The title screen has a
**Shop** (spend saved earnings on upgrades any time), a **How to Play**
tutorial, and **Credits**.

1. **Counter** — customers line up; click one to take their ticket. You can
   juggle **several orders at once** — they stack as cards on the left. Click a
   card (or a waiting customer, or press `Tab`) to select which order you're
   working on.
2. **Fry in bulk** — load wings into a basket, click to drop it into the oil,
   click again to pull it up in the green *golden* zone. Cook a big batch to
   fill several tickets at once.
3. **Sauce** — send a basket to the bowl, click a pot to pour, then toss (click
   the bowl, press Space, or flick upward) until fully coated.
4. **Plate smart** — "Send to plate" moves only the wings the *selected* ticket
   still needs, leaving the rest in the bowl for the next plate. Add sides, a
   dip, and a **garnish** to match. Neat, exact, complete plates earn a
   presentation bonus.
5. **Serve** — accuracy and speed earn stars, tips, and perfect-streak bonuses.

Each day brings more customers and unlocks new sauces, sides, dips, and
garnishes. Spend earnings on upgrades — Jumbo Baskets (bulk frying), Extra Hand
(more concurrent orders), Turbo Fryer, Golden Tongs, Sauce Boss, Charm School,
Loyalty Cards, Disco Night. Progress autosaves to your browser, and the whole
UI reflows for phones, tablets, and desktops.

Keyboard: `1`–`4` stations · `Tab` switch ticket · `Space` toss wings.

## Development

The game ships as a single self-contained `index.html`, concatenated from the
parts in `src/`:

| part | contents |
|---|---|
| `00-head.html` | HTML, CSS, UI overlay DOM |
| `10-core.js`   | renderer, camera/tween system, input, synth audio, particles |
| `20-env.js`    | game data + the 3D shop (kitchen, stations, dining room) |
| `30-actors.js` | procedural wings, sides, and customers |
| `40-game.js`   | orders, station logic, scoring, day cycle, main loop |

After editing a part, rebuild with:

```sh
./build.sh
```

`tools/shot.py` renders staged screenshots through headless Firefox for
visual verification (note: headless Firefox never composites WebGL into
`--screenshot`, so the tool mirrors the frame into a DOM `<img>` first).
