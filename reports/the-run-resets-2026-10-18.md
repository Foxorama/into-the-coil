# The run resets — 2026-10-18

One handwritten page headed *Run Resets*, five notes, sent to be worked overnight and played in the morning. This
file reads the page, says what the code did, pressure-tests the one note that could be taken two ways, and lists
what landed. What each change decides lives in its decision.

## The ask

> *"Work this feedback overnight as well and I'll play test it all in the morning"*

## The page, as read

| # | line on the page |
|---|---|
| 1 | *"finishing a run with lives you hear a death noise when changing screens"* |
| 2 | *"ending a run on a boss → boss's remaining health shows on next run"* |
| 3 | *"new run w/out cache clear doesn't play the intro cinematic"* |
| 4 | *"end of run after all death's should essentially be a cache clear 4 the next run"* — under a struck-out *"new run should b…"* |
| 5 | *"life counter isn't correct, it should show remaining lives not total lives. ie, start at 2, 1, 0 not 3, 2, 1"* |

## What was already true

Each note was traced to its cause before anything moved.

- **1. The death noise was the finale's explosions, held and then let go.**
  - Explosions are gridded: each waits for the next sixteenth of the beat (0104). The speaker reads that beat off
    the world's step count, and the count moves only on a screen that steps.
  - After a win every screen is still, so the count stood on the step the fight ended on, off the grid five times
    in six.
  - The finale's five kills and its boss-down were asked for on that frozen beat, and nothing was heard through the
    whole outro.
  - On the title, `closeRun` set the count back to 0, which is on the grid. Everything held went off at once, on a
    screen change.
  - A game over never showed it, because its death beat keeps stepping.
- **2. The boss bar's latch was put back and the chrome was never told.**
  - The world sends the bar a value only when the value changes. `closeRun` reset its memory of the last value to
    "no boss" without telling the chrome.
  - The next run's "no boss" equalled that reset value, so nothing ever sent it again. The dead boss's fraction
    stood over the next run until the next end boss arrived.
  - 0559 warned of exactly this for latches. The health and the score are re-sent when a new run syncs; the bar
    was not.
- **3. The intro was the first flight of a visit (0513).** A flag the page kept skipped it on every later flight,
  so it came back only on a reload, which a cache clear is. Nothing in storage was involved.
- **4. Nothing saved makes a second run differ from a first, except progress.** The saved keys hold the hangar
  (ships won, fittings, shards, cosmetics), the settings and the score table. The rest of what differed lived in
  the page: the intro flag (3), the boss bar's value (2) and the speaker's held cues (1).
- **5. The counter printed `state.run.lives`, every life including the ship flown.** The icon beside it is the ship
  in the air (0430), so the last ship flew at ×1.

## Pressure-tested

**Item 4, taken literally, would delete progress.** A cache clear also wipes `itc_hangar` and `itc_settings`:
every ship won, every shard, every fitting, the chosen tier. Doing that after every game over is not what a page
headed *Run Resets* is asking, and its other four notes are each something of one run reaching into the next. So
it is read as *the next run starts as clean as a first run after a cache clear does*, with what a player has
earned kept.

Read that way, item 4 is the other four together:
- nothing of the last run is heard (1) or shown (2) in the next;
- the next run opens with the intro (3);
- the counter is right (5).

**Read and decided without asking — can be vetoed.** If the note did mean the save itself, wiping progress on a
game over is a one-line change to make, and one that cannot be taken back for a player once it ships.

## Landed

- **Item 1** — [0633](../docs/decisions/0633-a-beat-that-stands-still-holds-nothing.md): a beat that stands still
  holds nothing. A gridded cue asked for while the world is still sounds on the next step, so the finale's
  explosions are heard during the outro and nothing is left to go off on the title.
- **Item 2** — [0634](../docs/decisions/0634-the-boss-bar-goes-with-the-run.md): a run that ends with a boss bar
  up takes it down.
- **Items 3 and 4** — [0635](../docs/decisions/0635-every-flight-plays-the-intro.md): every flight plays the intro.
  It is skippable, as it was.
- **Item 5** — [0636](../docs/decisions/0636-the-counter-is-the-ships-left.md): the counter shows the ships left
  behind the one flown, ×2, ×1, ×0 on a three-life tier, on the readout and on the hangar stand's preview.

## Owed

A play in the morning:
- a win, then the title and the menus, by ear;
- a run lost to a boss, then a new run;
- a second Fly in the same tab;
- the counter through a run's deaths.
