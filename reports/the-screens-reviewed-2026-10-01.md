# The screens, reviewed — 2026-10-01

**A UX pass over the way in, the menu, the in-game readout and the pickups**, asked for as *"review
the intro and menu selection screens and icons used throughout the game, including health points,
points totals and displays and floating power pickups … suggest a list of improvements to get the
highest quality that still fits the game aesthetic and then start working on improving them."*

Looked at on `main` at `4834944` (0428/0429's score merged), 1280×720, with `scripts/shot.mjs` and
3× crops. **A queue, highest value first. Items 1–4 and 10 are built** —
[0430](../docs/decisions/0430-the-readout-counts-ships-and-shields.md),
[0431](../docs/decisions/0431-a-pickup-glows-in-what-it-offers.md),
[0433](../docs/decisions/0433-the-readout-is-one-voice.md); the rest are proposals, and several touch
a decision that would have to be amended rather than worked around.

## What the aesthetic is

Flat, bright vector sprites with one dark outline, on a deep navy void; one cyan ink for everything
that is the player's, gold for the score, the enemy's ink for the boss. The menus are system-ui text
in the cyan on outlined boxes. **The in-game art is well past the menus**: the ships, the places and
the new score read as a finished game, and the screens around them read as a scaffold. Most of the
list below is closing that gap without inventing a second style.

## The queue

| # | where | what is wrong | proposal | cost |
|---|---|---|---|---|
| 1 | readout, field | the lives icon was a green **plus** (reads as *health*); shields were **discs** (the bullet's shape); the shell was three small **rings** (read as beads, not a shield) | **BUILT — 0430.** Ship `×N`; shield glyphs filled/hollow; a honeycomb deflector of one plate per shield | — |
| 2 | readout | the icons are framed three ways: the ship and the bomb are bare silhouettes, the missile stack wears the **pickup bubble** — which on the field means *fly into me* (0236) | **BUILT — 0433.** Every readout icon bare, at one optical size | — |
| 3 | readout | a lost shield or life **changes silently**: a class toggles and nothing moves ([0036](../docs/decisions/0036-an-event-the-model-knows-about-the-picture-mentions.md)'s shape, in the chrome) | **BUILT — 0433.** A lost shield flares and drops, a gained one pops, a lost life shakes the ship | — |
| 4 | readout | two type systems on one screen: counts in system-ui 600, the score in its own gold display digits | **BUILT — 0433.** The counts in the score's weight with fixed-width figures | — |
| 5 | title | the name is plain system-ui text; the badge [0427](../docs/decisions/0427-the-icon-is-the-badge.md) made is nowhere on it | a logo lockup: the badge beside a display-weight wordmark, with the coil's own gradient | medium |
| 6 | title | five buttons at one weight — three tiers, Music and Pilot — so the primary action is not primary; the pickup key floats centred against a top-aligned column; half the screen is empty void | tiers as one primary group, Music and Pilot as secondary; the key as a titled card aligned to the column; the attract sky (or a ship flying through) behind it | medium |
| 7 | title | the settings chips are small, low-contrast and far from the controls they set | a larger row with the selected state marked by shape as well as fill (0024), and touch-sized targets | small |
| 8 | splash | the name alone on black while the game loads, for up to seconds, with no sign it is working | a progress line or the coil turning under the name, tied to what the boot is actually waiting on | small |
| 9 | pilot | *"Pilot"* as a heading is a label, not an instruction; nothing says which golfer is flying now | *"Choose your pilot"*; the current pilot marked; a hover lift on the cards | small |
| 10 | field | the pickup bubble is a dark disc with a grey hairline, which reads as a UI button more than as something to collect | **BUILT — 0431.** A full-strength pickup-ink ring, a second ring and the glow in the offered ink, and a breath on `swell`. The bob was not needed: pickups already drift ([0087](../docs/decisions/0087-a-pickup-never-parks.md)) | — |

## Asked for after the review

- **The key cycles** — [0432](../docs/decisions/0432-the-key-cycles.md). One row per pickup, turning
  through its faces at the field's pace. BUILT.
- **Desktop and phone menus, and tap buttons on a phone.** Both already exist and were checked on an
  844×390 touch context: the phone title is its own layout under a 460px-tall container
  ([0370](../docs/decisions/0370-the-title-fits-the-hand.md)), and a touch screen gets a disc per
  trigger — the gun's bomb and the tubes' surge — up the right edge
  ([0060](../docs/decisions/0060-a-trigger-is-a-place-on-the-glass.md)); a desktop without touch gets
  neither. **Open**: on a phone the discs and the readout's two stack counts say the same number
  twice, in a corner where width is scarce.

## Not looked at

The boss bar, the level-clear splash and the run-over screen, the music room, the travel scene and
the finale's bubbles. None of them was in the ask.
