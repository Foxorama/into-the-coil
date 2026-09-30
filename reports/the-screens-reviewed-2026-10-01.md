# The screens, reviewed — 2026-10-01

**A UX pass over the way in, the menu, the in-game readout and the pickups**, asked for as *"review
the intro and menu selection screens and icons used throughout the game, including health points,
points totals and displays and floating power pickups … suggest a list of improvements to get the
highest quality that still fits the game aesthetic and then start working on improving them."*

Looked at on `main` at `4834944` (0428/0429's score merged), 1280×720, with `scripts/shot.mjs` and
3× crops. **A queue, highest value first. Every item is built or built in part** —
[0430](../docs/decisions/0430-the-readout-counts-ships-and-shields.md),
[0431](../docs/decisions/0431-a-pickup-glows-in-what-it-offers.md),
[0433](../docs/decisions/0433-the-readout-is-one-voice.md),
[0434](../docs/decisions/0434-the-title-has-a-voice.md); what is left is marked **Open** in its row.

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
| 5 | title | the name is plain system-ui text; the badge [0427](../docs/decisions/0427-the-icon-is-the-badge.md) made is nowhere on it | **BUILT IN PART — [0434](../docs/decisions/0434-the-title-has-a-voice.md).** The wordmark, on the title and the splash. **Open**: the badge itself, which needs an image inlined into the one page (0003) or a new sidecar (0008) | small |
| 6 | title | five buttons at one weight — three tiers, Music and Pilot — so the primary action is not primary; the pickup key floats centred against a top-aligned column; half the screen is empty void | **BUILT IN PART — 0434.** Tiers primary, Music and Pilot a quieter pair under them; the key is three rows since 0432. **Open**: a live sky or a ship flying through behind the title | medium |
| 7 | title | the settings chips are small, low-contrast and far from the controls they set | **BUILT — 0434**, on the desktop; the phone's were already thumb-sized (0370). The chosen option was already told by fill, not by colour | — |
| 8 | splash | the name alone on black while the game loads, for up to seconds, with no sign it is working | **BUILT — 0434.** A light sweeping a line under the name: a sweep, because the boot does not know its own fraction | — |
| 9 | pilot | *"Pilot"* as a heading is a label, not an instruction; nothing says which golfer is flying now | **BUILT IN PART — 0434.** *Choose your pilot*. **Open**: the current pilot marked, a hover lift on the cards | small |
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
