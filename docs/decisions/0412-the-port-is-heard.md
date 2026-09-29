# 0412 — The port is heard, Bo runs for the ship, and the skip waits for the game

**Accepted 2026-09-29.** Three changes to [0411](0411-the-chase-begins-at-the-port.md)'s intro, asked for
together after it was first seen. **Amends 0411** on how the intro is left: *any press skips* is
replaced by a Skip button, three keys, and a press that asks for sound.

## The ask

> *"create a pilot based on Bo from The Far Carry"*

> *"Gotta be something to do to make it have sound right?"*

> *"and add in a skip button that shows up once the game has loaded behind it (there's a 4-5sec lag
> before you can do anything on the current loading screen)"*

And, of a press-to-start card offered as the way to get sound from the first frame: *"The point is for
the video to be the loading screen itself, so that's not going to work — can we add a simulated
keypress into the video itself to trigger the sound?"*

## A simulated keypress cannot turn the sound on, and why that is not a limit this code can move

⚠️ **No browser starts audio before the person has touched the page, and an event the page makes
for itself is not the person.** A dispatched `KeyboardEvent` or a scripted `click()` is marked
untrusted and grants no user activation; that is precisely the trick the autoplay rule exists to
defeat. itch's own *Run game* click is on the outer page, and activation does not pass down into the
game's frame. So the answer given was *no*, and the card was declined for a reason that stands —
the intro IS the loading screen. What is built instead is the part the platform does allow.

## What changed

- **The pilot is Backspin Bo** — one of the four *Far Carry* golfers `docs/game.md` puts in the
  prologue, they/them, Portland's wedge player. The colours are the predecessor's roster row, read
  for this and nothing else: a purple cap with its brim forward over a dark tousled crop, a deeper
  purple polo with its collar lit, dark trousers, and the red carry bag across the back with three
  clubs out of it. `BO` in `src/content/port.ts`; the drawing in `src/render/port-bake.ts`.
- **The intro is heard, from the first real press.** Five cues of its own — `ignite`, `launch`,
  `alarm`, `door`, `step` — each the twin of a picture drawn on the same step, played by the shell as
  the intro passes the rows of `INTRO_CUES`: the engines lighting, both launches, the alarm on every
  turn of the beacon, the door, Bo's footfalls, the throttle-ups outside. Under them, the title's
  own music, which carries straight on into the title. A beat already passed is not caught up on.
- **A press is a request for sound, and is kept until it can be met.** The first unlock drains
  whatever is left of the music prewarm synchronously — five seconds of a frozen picture when it comes
  early, which is what 0411 measured and what the reported *4–5 s lag* is. So until the game behind
  the intro has loaded, a press is remembered and the sound comes on the step loading finishes; the
  platform keeps the activation the press granted, the stickiness the pad's own unlock already relies
  on. After the load, a press unlocks at once and costs nothing.
- **The Skip button appears when the game behind the intro has loaded** — `prewarmDone()`, the one
  thing a press would otherwise pay for — bottom right, fading in. Clicking it, or Enter or Space once
  it is there, or the pad's confirm, goes to the title and no further. **Escape skips at any moment**
  and asks for no sound: it is the key a cutscene is left by, and it is what the browser tests skip
  with, so they do not wait for a load they are not about.

## What it costs

- **Ready:** the Skip appears 6.2–6.4 s after the canvas measured alone, and 7.7–16.5 s while the
  whole suite ran. That is the prewarm, and making it faster — on the workers the place bakes already
  use ([0331](0331-the-heart-beats-under-it.md)) — would bring the Skip and the sound forward together.
  It is owed, and it is the prewarm's decision rather than this one's.
- **Five cue rows**, baked with the rest on the first unlock; each is under a second.
- ⚠️ **AND THE LOAD SHOWS IN THE PICTURE.** The longest gap between frames in each second of the intro,
  nothing pressed: 144–423 ms in the first (the boot), then 36–54 ms — one or two dropped frames —
  until the load finishes at about 6 s, and a steady 17–18 ms after it. The prewarm's slices are what
  the intro is stepping around. The same faster prewarm is the answer.

## Guards

`tests/intro.test.ts`: **every intro cue plays on a step that draws its twin**, and none plays
outside the intro or over the black between its shots. `tests/sound.test.ts` holds the five rows to
every rule a cue is held to, and its *no cue in the table is dead weight* reads `src/content/port.ts`
now, on the terms it reads the boss and special rows: a cue named by a row is played.

`tests/intro.browser.test.ts`: **Escape skips at once, chooses nothing and builds no sound — before
and after the load**; **the skip is not offered until the game has loaded, and then is**; **a click
on it, the pad's confirm, and Enter or Space once it is up, go to the title and choose nothing
there**; **a press before the load does not skip or freeze the picture** — the longest gap between
frames across the press, watched from before it — **and the sound comes on with the Skip, and the
intro's cues play before the title**; **a press after the load turns the sound on at once**.

Two budgets on [0245](0245-a-budget-is-sized-under-load.md)'s terms, each three times the worst
measured while the whole suite ran: `INTRO_READY_MS` in `tests/intro.ts`, 50 s against a worst load of
16.5 s; and `FROZEN_MS`, 1.9 s against a worst gap of 617 ms across a press — where the defect it is
for is the whole remaining load run on the press, 5.1 s when 0411's first build did it.

⚠️ **THE LOAD IS THE MOST LOAD-SENSITIVE NUMBER IN THE SUITE**, which is why only the intro's own tests
wait for it. A run with a dozen extra browsers alongside took it past 50 s and failed every test that
waited — including, then, the whole pad suite. So the shared skip is Escape, which HTML does not count
as the person activating the page: the pad suite uses it and is still testing a page no hand has
touched, and the pad's own skip is one test in the intro's file.

Changed, with the reason beside each: the shared skip is Escape, and waits a few frames of the title
before anything else is pressed. **And the music room's pad test lets the room take a step before pressing**,
which this decision found rather than caused: opening a screen spends the pad reader
([0055](0055-a-press-belongs-to-one-screen.md)), and the test pressed inside the
frame it clicked in, so the push was learned as held. It passed for as long as the click paid for the
music — the 3.7 s freeze let the steps run first. With the sound already built the room opened in 43 ms
and the push was lost, on this build and on 0411's alike.

## Seen to fail

[0005](0005-a-guard-must-be-seen-to-fail.md). `scripts/probes/0412-the-port-is-heard.mjs`: the door
heard before it opens; the door's row left unplayed; the skip offered from the first frame; a press
unlocking at once and freezing the picture; a press after the load only remembered; the cues never
played; Escape not skipping; Escape asking for sound; Enter's default left alone; the pad's confirm
never a skip; a Skip button that does nothing. 0411's four probes on its own skip moved here with the code they break.

## Owed

- **A listen**: the five cues are first drafts, and the alarm and the launch are the loud ones.
- **A faster prewarm**, above.
- A look at Bo at speed.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). Nothing is persisted.
