# 0418 — The heart lets go: the finale, who was in the Viper, and the music leaving the run

**Accepted 2026-09-29.** When the last boss dies the game cuts to a finale: the jellyfish melts off the
heart, the heart bursts, and the Viper is inside it — with one of the golfers who was not chosen in
her cockpit, who says so, and the one who came for them answers. Then the two ships leave together,
and the victory screen comes up. **And the music leaves the run when the run is over**: the title and
the victory screen no longer go on playing the last level's.

## The ask

> *"let's also do a closing video, after the boss on level 7 is beaten it cuts to a video of the
> jellyfish melting away and the heart exploding, inside is the viper ship and it's free'd and you can
> see inside the ship and it's a random one of the characters that wasn't chosen, they have a speech
> bubble voice line about being saved and then both ships fly off together into space. the random
> rescued character slot needs to fit for other characters as well when we add more playable
> characters. the chosen character does a voice line relatable to their character. in Golf-Stars they
> all have characters, so give me a random selection of lines that each character could say when
> rescued as well"*

> *"there's also a music bug where the last level music doesn't stop till you start a new run or go to
> the music settings, so we'll need some victory music playing and that stops when you go to the title
> and let's the title music start again"*

Asked, and answered: **the golfer in the Viper was Venoma's captive all along, and the heart took
her**; the voices are **speech bubbles with a blip per syllable in each golfer's own pitch**; and the
finale is **followed by the victory screen**.

## What changed

- **`outro`**, a screen on the intro's terms — no panel, nothing stepped, a picture on its own clock
  (`src/render/finale.ts`, hot) — that expires into `victory`. `src/state/root.ts`'s agreement sends a
  finished run there instead of to `victory`. Its atlas is the port's pieces, then its own
  (`src/render/finale-bake.ts`), then the game's, by 0416's `withTheGame`: the ships, flames, surges and
  trails are the intro's, and the jellyfish (`boss14Open`), the heart and the sky are the last place's.
- **Four shots, in `src/content/finale.ts`**: the heart, as she melts off it in drips and it beats
  faster with nothing on it, then bursts into shards with the Viper where it was, lighting; the Viper's
  canopy, close, with the found golfer's select-screen portrait behind the glass; the fighter's, with
  the chosen one's; and the two ships side by side until they open up — surging on their launches —
  and are gone. 21 seconds.
- **The close-ups stand from the screen's edges** — the Viper's from the near side, the fighter's from
  the far one — so each hull runs off its own edge on every screen; the first photograph placed them in
  the narrowest view and the fighter's stopped in mid-air on a wider one.
- **Who was in the Viper is `rescuable(chosen)`**: every golfer but the one flying, walked off
  `GOLFER_KINDS`, so a fifth golfer is in the pool the moment it is a row. The predecessor picked its
  boss partner the same way. The shell draws a seed when the finale starts (0021: the shell draws the
  seed) and picks who, and one line each, once.
- **The lines ride the golfer's row** — `saved`, `saving`, and a `voice` — so a golfer cannot be added
  without authoring both (0282). Five each, written from the predecessor's lore for them: Feather's
  wind and the feather in her cap, Huang-Woo's ear for a strike and the Gwangalli hook, Larry's carry,
  kids, kelpie and road train, Bo's backspin and coffee.
- **The voice is one cue, `talk`, played at the golfer's `voice` as a playback rate** — a new optional
  argument through `Speaker.play` and `AudioOut.sound`, which sets the rate on the buffer source that
  exists anyway. Its twin is `words-appear`: the bubble gains its letters on the same step.
- **The bubble is the chrome's** (`setBubble`): the whole line set from the start with the unsaid part
  invisible, so it never reflows; placed by the shell at the speaker's mouth in canvas pixels.
- **Skip is a row fact, `skips`**, on the intro and the finale, and goes where the row's timeout goes.
  The intro still waits for loading before a key may skip it; the finale may be skipped at once, and
  says so on entry, since a player who pressed past the intro early never saw its Skip made ready.
- **The bench plays it**: `rig/bench.html?finale&pilot=larry` clears every level through the game's own
  verbs and lets the reducer bring it up, on `?cross=`'s terms.

## The music, and why it was stuck

The mixer has two inputs and the off-run path set only one. The MIX dropped to the title's `calm` rung
correctly; the MATERIAL — which place's baked loops are loaded — was chosen from `run.level` on every
screen, and `placeFor` holds the last place once a run is past the roster. `run.level` is reset only
when a run begins, so the victory screen and the title played `calm` over The Black Heart's own drone,
pipes and kit — the place that re-voices all three layers `calm` opens, which is why it was so plain
there. The music room fixed it by auditioning something else; a new run by resetting the level.

**Now a screen says whether it is part of a run (`inRun`)**, and `musicPlaceFor` in `src/app/music.ts`
answers the room's audition, then the run's place on a screen in a run, then `approach` — the title's —
everywhere else. The finale is in the run: it is heard in the place the boss died in, at `calm`. The
same stickiness after a run-over is gone with it.

## What it does not do

[0280](0280-a-cheap-mechanism-does-not-rename-the-ask.md) — said rather than renamed. **There is no
victory piece yet.** The ask was *"victory music playing"*, and what is built is the half of it that was
a bug: the last level's music no longer plays over the victory screen and the title, and the title's
comes back. A piece of its own is a composition, and a piece that is not a place — the music is keyed by
`ThemeKind` from the bake to the hand-over — so it is its own change, next.

## Guards

`tests/finale.test.ts`, in pixels and seconds:

- **the finale's row**: no panel, nothing stepped, skippable, and expiring into the victory screen;
- **who was in the Viper is any golfer but the one flying, for every golfer** — walked, so a fifth is held;
- **every golfer has lines both ways, each short enough to type out and still be up a second and a
  half before its shot ends**, and **every golfer has a voice of their own**;
- **a voice blips on letters and never on spaces, at least once a word**;
- **the jellyfish is there and then gone, dripping as she goes; the heart is there until it bursts into
  shards; the Viper appears on the burst, where the heart was**;
- **each close-up's hull reaches its own side of the screen on the narrowest screen and the widest**;
- **both ships are off the widest screen before the picture goes**, and it opens and ends in the veil;
- **every cue plays on a step that draws its twin**;
- **the music**: off a run every screen plays `approach` after a finished run, in one the run's place,
  the finale the last place, and an audition wins.

Changed, with the reasons beside them: `tests/run.test.ts` and `tests/travel.test.ts` for a finished run
going to the finale; the test worlds for the new field; `tests/budget.test.ts`'s lists.

## Seen to fail

[0005](0005-a-guard-must-be-seen-to-fail.md). `scripts/probes/0418-the-heart-lets-go.mjs`: the run going
straight to victory; no Skip; the chosen golfer found in their own rescue; lines too slow to read;
blips on spaces; two golfers with one voice; the jellyfish outlasting her melt; the Viper out before the
burst; a close-up placed for the narrowest screen; ships too slow to leave; a launch with no surge;
and the title playing the last level after a win. Re-anchored, breaking what they broke: 0063's and
0340's screen rows, 0104's `emit`, and 0412's skip key.

## Owed

- A look at the four shots, and a listen to the voices against their bubbles.
- **The victory piece.**

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). Nothing is persisted.
