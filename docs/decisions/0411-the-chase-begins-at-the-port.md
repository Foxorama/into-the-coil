# 0411 — The chase begins at the port

**Accepted 2026-09-29.** The page opens on an intro: the Viper blasts out of the spaceport, a pilot
runs out of the bar to the blue fighter and goes after her, and the title comes up when they are gone.
This is Phase E of [the overnight plan](../../reports/the-overnight-plan-2026-09-19.md) — *"a game intro
loading movie"* — which said not to build it blind; the ask below is the storyboard it was waiting for.

## The ask

> *"a loading intro animation screen. I think it starts at a spaceport (use the Far Carry's spaceport
> as inspiration). One ship looking like the Viper's Coil blasts off into space and then another pilot
> runs out of the bar and to their own spaceship (the blue in game one) and blasts off into space
> chasing after the other ship."*

## What crossed from the predecessor, and what did not

The Far Carry's spaceport was read for this, and only that file: `storySpaceport.ts` in the
predecessor. **It is a room, not a field of pads** — the clubhouse aboard the Mothership, a hangar bay
open to the stars on one side, *The Parrot's Perch* on the other, a warm lamp over a deck. That shape
is what crossed, turned into a side section because this game has one view
([0031](0031-landscape-is-the-shipped-orientation.md)). The bar's sign is a neon parrot rather than
its name, since `docs/game.md`'s voice puts no word on the screen nobody asked for.

**The Viper is Venoma Krait**, the predecessor's Coil prodigy and recurring rival. Her ship is new —
a racer built as a serpent, with a snake's head for a prow, fangs, acid glass and a fin curled over its
back — in the livery the predecessor gave the Coil's own *Wyrm-Ship*: dark green, acid glass, a violet
flame. Those colours ride `VIPER` in `src/content/port.ts`, because no ink of this game's palette means
them. **The blue fighter is the one the player flies**, drawn by the same `paintShip` and `SHIP_HULL`,
baked at hangar size rather than blitted up.

## The storyboard

Two shots, every time in steps from the first frame (`BEATS`):

| from | what is on screen |
|---|---|
| 0.0 s | the hangar fades up out of black: the bar, its neon and its window, the two ships riding their pad beams, the bay open to the stars |
| 1.2 s | the Viper's engine lights |
| 2.0 s | she lifts off her pad |
| 2.7 s | full burn, and she is through the bay a second later |
| 4.1 s | the bay's alarm beacons start to turn |
| 4.7 s | the bar's door slides back and its light spills onto the deck |
| 5.1 s | the pilot runs out — flight suit, the fighter's blue helmet, a golf bag across the back |
| 7.1 s | they leap for the cockpit and drop in; the canopy catches the light |
| 7.8 s | the fighter's engines light, it lifts, and at 9.1 s it goes |
| 10.1 s | the hangar fades to black as the fighter clears the bay |
| 10.9 s | outside: the station's flank with the bay lit in it, the Viper ahead, the fighter coming out after her; the stars gather speed |
| 13.7 s | she opens her throttle and leaves the frame |
| 14.5 s | the fighter goes after her |
| 16.0 s | the stars fade to black, and at 16.6 s the title comes up |

## How it is built

- **Its own screen**, `intro`, first in `SCREEN_KINDS` and the initial screen. No heading, no actions,
  `steps: false`, and a `timeout` whose `then` is the title — so it leaves on its own clock and the
  player never has to press anything. That is the part of
  [0340](0340-the-coil-is-a-route.md)'s play report that applies to a picture before the first choice:
  no button, no panel, nothing to dismiss.
- **Any press skips it, to the title and no further.** `src/app/mount.ts` listens in the capture phase
  beside the audio unlock, and the pad skips on a move or a confirm. **The first build started a run
  from a skip**: the skip focuses the title's first tier, and the platform activates a focused button
  on the `keypress` that follows Enter's keydown. An activation key that skips has its default
  cancelled; no other key does, so a reload pressed during the intro is still a reload.
- **Its own atlas.** `src/render/port-bake.ts` bakes the port when the intro comes up (or is resized
  or turned back from portrait) and `CanvasSurface.setAtlas` swaps it in; it is dropped when the intro
  ends. It is not rows in `src/content/sprites.ts`, because the game's atlas is re-baked on every
  change of place ([0195](0195-a-place-has-its-own-sky.md)) and nobody will stand in this room
  again.
- **A pure function of one clock.** `src/render/port.ts` draws the picture at `steps + alpha`, the move
  [0213](0213-the-room-is-a-flythrough.md) made for the music room: nothing accumulates, so the renderer
  interpolates for free and a test can ask for any moment. It is on the hot list, and allocates nothing.
- **World units, authored in the narrowest view.** A wider screen sees more stars past the bay;
  nothing stretches ([0023](0023-the-long-axis-is-the-scroll-axis.md)).
- **A flame is baked in a box twice its ship's**, at the ship's radius. A sprite's frame ends 1.19
  hull radii behind its centre, and a burn is longer: the first photographs showed every glow sliced
  down a straight edge.

## What it does not do

[0280](0280-a-cheap-mechanism-does-not-rename-the-ask.md) — said rather than renamed:

- **It is silent.** No browser plays sound before a gesture
  ([0072](0072-a-cue-is-baked-and-played.md)), and a page that has just loaded has had none. A score
  under it would be heard only by a player who had already pressed something, which is a player who
  has skipped it.
- **It plays on every load.** It is one press to skip. A once-per-install intro would need a storage
  key, which is an irreversible surface ([0001](0001-revertability-not-risk-rating.md)) and a decision
  of its own.
- **The pilot is nobody yet.** The roster is one ship with no character on it (`src/content/ships.ts`),
  so the pilot is a flight suit and a golf bag rather than a golfer the player picked.

## What it costs

- **Boot:** not measurable in the time to the first frame. Seven alternating loads each: `main`
  835 ms against this 809 ms at 1280×720, and 824 against 811 ms at 1920×1080 at a pixel ratio of 2.
- **Memory:** 10.7 MB of bitmaps at 720p and 29.7 MB at the bake's resolution cap, held while the
  intro is up and dropped when it ends.
- **The frame:** at most 106 blits, at the widest screen, and no allocation (`tests/budget.test.ts`).
- **The handover:** the title came up 17.3–17.8 s after the canvas measured alone, and 17.6–20.3 s
  while the whole suite ran, against 16.6 s of steps.

⚠️ **A SKIP DOES NOT UNLOCK THE SOUND, AND THE FIRST BUILD'S DID.** The first unlock drains whatever
is left of the music prewarm synchronously
([0157](0157-the-prewarm-was-scheduled-one-note-at-a-time.md)). With the skip as the first gesture, a
skip 0.3 s in took 5.1 s to bring the title up — a frozen picture right after a press, which reads as
a hang — and every browser test that skipped paid it too, which is how the layout suite found it by
timing out. So the unlock refuses the intro (`src/app/mount.ts`), and the first press on the title
unlocks, as before this decision. Measured after: **a skip brings the title up in 0.02–0.1 s at any
moment of the intro; a player who watched it through reaches the HUD 0.11–0.15 s after choosing a
tier; one who skipped at once, 4.9–5.1 s** — the cost the tier press already had, unchanged. The
second is the prewarm cover the overnight plan named as a reason for the intro to exist; the third is
the prewarm's own question.

## Guards

`tests/intro.test.ts` draws the picture into a surface that records every blit, at the widest screen
— [0027](0027-measure-the-picture-not-the-model.md)'s units:

- **the intro opens the page, has no panel, steps nothing, and leaves for the title on its own clock**;
- **its beats run in the order they are written**;
- **it opens out of black and ends in it**, so the title comes up out of the dark — **and is never
  dark in the middle of a shot**;
- **every piece it bakes is drawn at some moment of it**;
- **the Viper is through the bay before the bar door opens**, **the fighter is through it before the
  hangar fades**, and **both ships are off the widest screen before the last fade** — each in pixels,
  from where the hull's tail landed;
- **the fighter never covers the pilot** — the first build ran the pilot under the wing, where they
  vanished — **and the pilot goes from the run into the leap without a jump**.

`tests/intro.browser.test.ts`: the page draws the intro with no panel over it and brings the title up
by itself, inside 61 s — a budget on [0245](0245-a-budget-is-sized-under-load.md)'s terms, three times
the worst handover measured while the whole suite ran; **a skip builds no sound**, counted as audio
contexts built, and the first press on the title then builds one; **Space, Enter and a click each skip
to the title and choose nothing there**.

Changed, with the reason beside each: `tests/menu.test.ts`'s *a screen that does not dim never carries
a countdown* is scoped to screens with a panel — a countdown is only ever written into one, so the
intro's timeout is its length and never a readout. `tests/run.test.ts` opens on the intro. Every
browser test that uses the title now skips the intro first, with Shift, through `tests/intro.ts` — but
the pad suite skips with the pad, because a key hands the page a gesture a pad-only player never has,
and the pad's own unlock then succeeds mid-test; and the sound suite's *no audio before anybody touches
it* opens without skipping at all.

## Seen to fail

[0005](0005-a-guard-must-be-seen-to-fail.md). `scripts/probes/0411-the-chase-begins-at-the-port.mjs`:
the page opening on the title; the fighter running before she has; the last fade taken out; the hangar
fading from the launch; the beacons never drawn; the Viper crawling off her pad; the fighter too slow
for the bay; the fighter holding station until the dark; the fighter drawn over the pilot; the leap
starting from the pad; the painter building an array a frame; the frame clearing in place of drawing;
the skip unlocking the sound; Enter's default left alone; a key and a click that do not skip.

## Owed

- **A play and a look**, on the branch preview: whether the beats are paced right, whether the Viper
  reads as the Viper, and whether seventeen seconds is too long for something seen on every load.
- **The tier press's freeze after an early skip**, above — older than this decision, and the prewarm's.
- **Its score**, if one is wanted, and it would be heard only from the second viewing on.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). Nothing is persisted; a revert opens the
page on the title again.
