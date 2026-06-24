# 🍗 SAUCED: Wing Shop Simulator

A fast, juicy 3D wing-shop time-management game inspired by Papa's Wingeria,
built with Three.js. Every model, texture, cartoon face, sound effect, and the
background music is generated procedurally in code. There are no asset files,
just one self-contained HTML page.

Claude Fable essentially one shotted this...

## Play

Open **`index.html`** in any modern browser. Double-clicking works, though
Three.js loads from a CDN, so you do need an internet connection. It runs on
desktop and on phones; the whole interface reflows for touch.

## How it works

You run the shop in first person from behind the counter, looking out at the
line of customers and the dining room. **Drag anywhere to look around.** Almost
everything in the shop is interactive: tap the baskets, pots, bins, dip cups,
and customers directly. Hover on desktop for a label.

1. **Counter.** Customers walk in and line up. Tap one to take their ticket.
   You can run **several orders at once**; they stack as receipt cards on the
   left. Tap a card, a waiting customer, or press `Tab` to choose which order
   you are building.
2. **Fry.** Tap a basket (or the tub of raw wings) to pile wings in, drop the
   basket into the oil, then pull it up while the cook meter is in the green
   *golden* zone. Burn them and the rating tanks. Cook a big batch to fill
   several tickets at once.
3. **Sauce.** Send a basket to the bowl, tap a pot to pour a sauce, then toss
   until the wings are fully coated. Toss by tapping the bowl, pressing `Space`,
   or flicking upward across it.
4. **Plate.** "Send to plate" moves only the wings the **selected** ticket still
   needs and leaves the rest of the saucy batch in the bowl for the next plate.
   Add the sides, dip, and garnish the ticket asks for. A neat, exact, complete
   plate earns a presentation bonus.
5. **Serve.** Accuracy and speed earn stars, tips, and perfect-streak bonuses.

Customers have **personality traits** that change how they behave: the rushed
ones fidget and tip for speed, the chill ones wait forever, foodies want the
full garnished plate and tip big, big tippers are rare and generous, and grumps
are impatient and hard to please.

Each day brings more customers and unlocks new sauces, sides, dips, and
garnishes (14 sauces in all by the late game). Spend your earnings on upgrades
like Jumbo Baskets for bulk frying, Extra Hand for another concurrent order,
Turbo Fryer, Golden Tongs, Sauce Boss, Charm School, Loyalty Cards, and Disco
Night. The shop, a how-to-play guide, and a pause menu are reachable any time
from the menu button (top right on mobile) or by pressing `Esc`. Progress
autosaves to your browser.

**Keyboard:** `1` to `4` switch stations, `Tab` cycles the selected ticket,
`Space` tosses the wings, `Esc` opens the menu.

## Development

The game ships as a single self-contained `index.html`, concatenated from the
parts in `src/`:

| part | contents |
|---|---|
| `00-head.html` | HTML, CSS, and the UI overlay markup |
| `10-core.js`   | renderer, camera and tween system, input, synth audio, particles |
| `20-env.js`    | game data plus the 3D shop (kitchen, stations, dining room, door) |
| `30-actors.js` | procedural wings, sides, garnishes, and customers |
| `40-game.js`   | orders, station logic, scoring, day cycle, and the main loop |

After editing a part, rebuild the bundle with:

```sh
./build.sh
```

`tools/shot.py` renders staged screenshots through headless Firefox for visual
checks. Note that headless Firefox never composites WebGL into its
`--screenshot` output, so the tool mirrors the rendered frame into a DOM image
first, and it disables CSS animations so elements do not freeze mid-transition.
