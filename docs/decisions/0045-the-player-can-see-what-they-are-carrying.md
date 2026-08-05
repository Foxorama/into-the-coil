# 0045 — The player can see what they are carrying

**Accepted 2026-08-06.** Both halves asked for in play, after the first run of the two-level build.

## The rule

| | |
|---|---|
| **in game** | lives and shield, top-left, shown on `playing` and nowhere else |
| **on the title** | a key: every pickup's real sprite, its name, and what it does |
| **the key's source** | `PICKUP_KINDS`, walked — never a list maintained beside it |
| **the icons** | the actual baked art, at the chrome's own resolution |
| **not in the key** | the enemies, deliberately |

## Why the upgrades get a key and the enemies do not

Asked for exactly that way: *"we don't need a key for the enemies, but knowing that the upgrades are
good pickups is important."* The asymmetry is right and worth writing down rather than treating as a
scope cut.

**An enemy announces itself by shooting at you.** The game teaches it in the only way that sticks, in
the moment, at the cost of one hit — and `docs/game.md`'s voice rule says hints are added where play
proves they are needed, never pre-emptively.

**A pickup announces nothing.** It is a small shape sitting in a lane, and crossing the lane to reach
it costs position — which is the whole point of placing them off-centre
([0041](0041-a-pickup-is-the-answer-to-what-a-death-costs.md)). A player who does not already know
the shape is good will not pay that to find out, and will conclude the game has nothing in it worth
flying for.

`tests/hud.browser.test.ts` holds the absence as well as the presence, so a future well-meaning
addition has to argue with this rather than slip past it.

## Why the key shows the real baked sprite

Because a hand-written SVG in the chrome would be **a second description of every silhouette**, and
the day an art pass changes one the key goes on showing the old shape — silently, on the one screen
whose entire job is to say what things look like. `src/content/sprites.ts` records what a second
description of that table already cost this project: an off-by-one that made every entity in the game
draw as something else.

⚠️ **It is its own bake, at its own resolution, and not the atlas the game is drawing with.** That one
is re-baked on every rotation and DPI change, and its bitmaps are the live objects the painter blits —
appending one to the DOM would take it out of the atlas.

⚠️ **28 pixels per unit rather than 12, and the difference was looked at.** At 12 the source was
barely larger than the ~20 CSS pixels it renders at, and the life icon showed visible pixel steps.
Baking well above the drawn size costs a few kilobytes once, and is exactly what
[0022](0022-frame-rate-is-a-feature.md)'s bake-and-blit pipeline is for: art that is a function of
resolution rather than a fixed asset.

## "Shield" is the ship's health, and it is the player's word

There is also a `shield` in `src/content/specials.ts` — a special that absorbs a hit — and nothing
triggers one yet.

⚠️ **If both ever exist at once, it is the SPECIAL that gets renamed.** The HUD word is the one a
player already reached for unprompted, and a readout is read far more often than a table is.

## Why the readout updates on an event and never on a frame

`src/app/frame.ts` fires `onHealth` only when the number actually moves — a few times a second at
worst — so the chrome can be ordinary DOM code rather than something that has to be cheap. A shield
readout that rewrote the DOM sixty times a second would be the one thing in the game allowed to touch
layout in the hot path.

⚠️ **The check sits BEFORE the death check, and the order is load-bearing.** After it, a respawn would
already have put the health back, and the player would never see the hit that killed them register —
which is [0036](0036-an-event-the-model-knows-about-the-picture-mentions.md) exactly: an event the
model resolves and the picture never mentions. Three bugs have already been filed against this
project as collision faults that turned out to be that.

## Two accessibility rules met in the same place

- **A filled disc against a hollow one**, not two colours.
  [0024](0024-the-accessibility-floor-is-settings.md) puts *colour never carries meaning alone* in
  the unconditional tier, and a shield readout is the most tempting place in the game to break it —
  full and empty are the same shape in two inks everywhere else in the genre.
- **The numbers are on the elements as labels.** The converse of the same rule: a row of coloured
  discs is not something a screen reader can read.

⚠️ **The first version of that first guard counted pips and called itself done**, and `npm run prove`
caught it: a probe replacing the fill difference with an opacity change stayed GREEN, because nothing
in the test had ever looked at what *spent* renders as. It now asserts the property directly — the
two states differ by **fill**, and agree on their **border colour**, which is what makes the
difference survive a palette swap.

## Confirmed, not assumed

Per [0005](0005-a-guard-must-be-seen-to-fail.md) and [0019](0019-a-probe-must-be-seen-to-apply.md).
`npm run prove 0045`:

| broken on purpose | went red |
|---|---|
| a pickup added to the table and forgotten by the key | `lists every pickup, with its name and what it does` |
| the readout rendered once and never updated | `follows the ship down as it takes hits` |
| spent shield shown as a colour change rather than a hollow pip | `shows a spent pip as EMPTY rather than as a different colour` |
| the readout left up over the title screen | `is hidden until a run starts, and shows while playing` |
| the shield readout stripped of its label, leaving a row of unreadable discs | `reports the run in words as well as in pictures` |
