# 0597 — The title track plays in the menu

**Accepted 2026-10-11.** Item 5 of [`the-secret-pilots-planned`](../../reports/the-secret-pilots-planned-2026-10-11.md).

## The ask

From the handwritten page: *"title → menu music"*. Read as **the title track carried on into the menu**. The
title track is a whole piece (`src/content/title-track.ts`) that only the album played: the game's title screen
looped two bars of the shared composition.

## The rule

**Every screen that is not part of a run plays the title track round, in place of the two-bar bed.** That means
the title, the hangar, Cosmo's, the settings and How to play. A run hands the music back to the run's own at a
bar, and the title takes over again at a bar when the player comes back.

| | |
|---|---|
| **when** | `titleWanted` in `src/app/music.ts`: off a run, no place being auditioned (0210: the room plays the place), and the sound on |
| **the parts** | `bakeTitlePart` / `titleNotes`: the album's own render, each part on its own stream, its room at its `air`, scaled to its `db` |
| **the levels** | `titleMoves` in `src/content/title-track.ts`: the score as moves, written on each part's gain one pass at a time |
| **the mixer** | `makeMusicOut` gains a run bus and a title bus in front of its master: `setTitle`, `title(wanted)`, `hasTitle` |
| **the bake** | `bakeTitle` in `src/app/sound.ts`, on the layer workers where there are any (`useTitleBaker`) |

## Why it is built the way it is

**One render, so the menu and the album are one mix.** The parts' levels were `TARGET_DB` in
`scripts/album.mjs`. They are now each part's `db`, and the album bakes through the game's `bakeTitlePart` and
reads the score through `titleMoves`. The album's render was byte-identical before and after this change
(`cmp` on the two WAVs). The menu therefore plays the samples the album was mixed on, and nothing keeps a second
copy of a level.

**Its own seven loops, not the run's layers re-voiced as a place.** A place is twenty-seven layers on rungs
driven by a camera. The title is seven parts on a bar clock, its levels set by a score. Folding it into the
ladder would mean a rung per section and a camera that does not exist off a run. A bus of its own is two gains.

**Held on the menu and let go in a run.** The title is 16.9 MB at 44.1 kHz. Held for the process, it would sit
beside every place a run loads, and The Black Heart's peak is already 141 MB of the 145 MB a place may hold
(`tests/sound.test.ts`, 0331). So the menu bakes it each time it is come back to, on the workers, and the run's
bed plays until it lands, as it did on the title for the game's whole life before this. Beside the largest place
any level loads (The Black Heart, 88.6 MB) the menu holds 105.5 MB. **With the sound *Off* nothing is held**:
the speaker is muted rather than torn down (0119), so the bake would otherwise run for a player who chose
silence.

**Hand-overs land on a bar of the run's own grid** (0117). The title starts at the run's next bar, so either
piece hands over to the other on a downbeat both of them have. The score opens on its drone and pad rising out of
silence over a bar, so the title's bus simply opens and the run's falls away beneath it over that bar. Going into
a run, the reverse takes the next bar and the one after it.

**Every pass restarts its loops.** The score is 72 bars and the lead's loop is 16, so a lead left running would
enter the second pass half way through its theme. Each pass is written half way through the one before it,
seven sources and their levels at once, which is one write a minute rather than a scheduler.

**What the menu does not do that the album does: the coda.** The album plays the score once and strikes a chord.
The menu plays it round: from the last section, everything falls back to the opening's drone and pad over the
opening section's own one bar. That is the score's own rule for that section, applied to a join the album never
has. Whether it is heard as a breath or as a cut is for the ear (*Owed*).

## Rollback

Nothing irreversible: no storage key, no save field, no cache prefix. Reverting puts the two-bar bed back on the
title.

## What guards it

- `tests/title-menu.test.ts` covers:
  - the score read as the album reads it;
  - each part baked to its `db`, measured on the bus;
  - the mixer taking over at a bar, playing a pass at a time and handing back at a bar, with the buffers let
    go — driven through a fake context, the buses found by following a source down the graph;
  - silence with the sound off;
  - `titleWanted` over every screen;
  - the memory budget beside the largest place.
- `tests/sound.browser.test.ts` covers the built page baking the title on a menu once, playing it, letting it go
  for *Off*, and bringing it back with the sound.
- Probes in `scripts/probes/0597-the-title-track-plays-in-the-menu.mjs`.

## Owed

- **The ear**, on the built game:
  - the take-over on the title;
  - the hand-back into a run;
  - the join where the score goes round, which the album never plays.
- **How long the menu plays the bed before the title lands**, measured on a desktop. It is the workers' bake of
  96 seconds of audio.
