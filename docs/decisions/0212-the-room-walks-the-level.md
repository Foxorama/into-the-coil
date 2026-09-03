# 0212 — The room walks the level, and one sentence outlived its fact

**Accepted 2026-09-03.** The day after [0210](0210-the-title-plays-the-music.md) shipped the music
room, and it is that decision's own *what is owed* — **a listen** — coming back with a defect
attached.

> *"let's first investigate why the ingame music sounds different from the music that plays in the
> music menu section of the game. then can we update the music menu section of the game so that it
> has a scrolling background to match the level/sound being played, has an indication of which track
> is being played when play all is selected and has a indication of how far along that track it's
> being played."*

## The rule

**The music room auditions a LEVEL, not a rung.** A camera of its own walks the place's own
`sections` script at the game's own scroll rate, and `musicLevelFor` — the run's function, unchanged
— is what turns that position into a rung. The room decides nothing a level has already decided.

**The readout is the walk.** Which place, which section, how far through, what is next. Every one of
those is the same position the camera is at, so a bar that disagreed with the music would have to be
a bug in one number rather than a drift between two.

**The room is the one panelled screen that does not dim.** `dims: false` is what lets the place
scroll past behind it; `.itc-music-panel` carries its own translucent backing, which is the half of a
dim that was ever doing work on this screen.

## ⚠️ Why it sounded different: `run` was 90% of a level and is now 29%

**Nothing here could check the report**, so `scripts/weigh-room.mjs` was written first — the
instrument before the tuning, on [0126](0126-the-dashboard-is-the-instrument.md)'s terms. It reads
the room's rung and a run's rungs off the tables the game plays from and reports the gap in
`apartBy`'s dB, which [0147](0147-a-place-is-a-balance.md) had already calibrated: **1.9 dB** between
the two places a play-test called interchangeable, **6.0 dB** between the two it called different
worlds.

```
── The Approach (approach) ──
the room plays run: 9 layers, 118 notes a bar

rung        layers  notes/bar   apart from the room   held in a level
run            9       118              0.0 dB      35s   29%
push          13       188              3.6 dB      36s   30%  audibly apart
surge         14       172              4.6 dB      30s   26%  audibly apart
approach      14       139              3.5 dB      18s   15%  audibly apart
boss          14       182              4.3 dB      the fight  audibly apart
bossPeak      14       182              4.7 dB      the fight  audibly apart

never heard at the old fixed rung, heard in a run: arp, ride, hook, drive,
toll, crash, dread, lead, counter, stomp, frenzy, wraith
```

Across all seven places:

- The room sounded **8–9 layers**; a run reaches **12–15**. **Twelve to thirteen layers were never
  heard in the room at all** — including `lead`, which
  [0154](0154-the-mix-is-authored-as-intent.md) defines as *the thing you follow*, and `hook`,
  `dread`, `toll`, `crash`, `stomp`, `frenzy` and `wraith`.
- Pace: the room ran 118–163 notes a bar against a run's 188–244 — **30–50% less dense**.
- **71% of a level's travel** (84s of 119s) sat at a balance ≥1.9 dB from the room's, before the
  fight, which has no length in that table at all.
- Three cases were past the *different worlds* mark: Ember Nebula's `boss` at **6.3 dB**, The
  Labyrinth's `surge` at **6.2**, The Toxic Mire's `surge` at **7.5**. **The room was further from
  what a player plays than one place is from another.**
- The Black Heart was worst: `run` is **17%** of its level.

⚠️ **AND THE CAUSE WAS A SENTENCE THAT OUTLIVED ITS FACT.** 0210 justified the fixed rung as *"the
rung a level spends most of its length at"*, and that was **true when it was first written down**:
`musicLevelFor`'s own header records `run` covering *"about 160 seconds of a 176-second level"* before
[0102](0102-the-music-goes-somewhere.md) put five rungs inside a level, and
[0158](0158-a-level-says-where-its-sections-open.md) then gave every level a four-entry script. By
the time 0210 quoted it the number was 17–30%.

⚠️ **THE FIX IS NOT A DIFFERENT CONSTANT, AND THAT IS THE WHOLE LESSON.** A room that names *any*
rung is a second opinion about the shape of a level, and this one was wrong inside a fortnight of
being written. The class of defect is **a derived fact copied into a comment and then relied upon**;
the repair is to ask the question rather than remember the answer.

## What each asked-for thing turned out to be

None of the three is a decoration once the room walks:

| asked for | what it is |
|---|---|
| *"a scrolling background to match the level/sound being played"* | the place's own sky, at the camera the walk is at — `src/render/scene.ts` already took the camera as an argument, so there is no second painter |
| *"an indication of how far along that track it's being played"* | the walk's position over `auditionLength`, with a tick per section off the level's own script |
| *"which track is being played when play all is selected"* | the place the walk is in, and the one it moves to when it ends |

And the seek came out of it rather than being added to it: a place is about three minutes, so a bar
that shows a position is a bar that should accept one.

## The one number the room invents, and the curve under it

**A fight has no length.** Every other boundary in the walk is a distance the level states;
`AUDITION_FIGHT_UNITS` is **two phrases**, one for each of the fight's two rungs
([0113](0113-there-is-one-composition-and-seven-levels.md)), because `PHRASE_SECONDS` is the length
at which every layer's pattern has come round.

⚠️ **A STRAIGHT HEALTH LINE FROM 1 TO 0 GAVE `boss` ELEVEN SECONDS.** `BOSS_PEAK_HEALTH` is **0.78**
— not the half its own header still claims — so a linear fall crosses it a fifth of the way in, and
the arrival the room exists to let somebody hear was over before a single pattern had come round.
**The defect was in the curve, not in the constant**: the boss now loses its first slice over one
phrase and the rest over the next, so the split lands at the halfway mark and
`musicLevelFor` is still the only thing deciding what a rung is.

⚠️ **It was caught by reading a printout, and `tests/music.test.ts` now holds it in SECONDS.** A guard
written in units would have been checking that a constant equals itself, which is
[0027](0027-measure-the-picture-not-the-model.md)'s own subject.

## The camera is borrowed and put back

The room drives `world.cameraAlong`, `landmarks` and `levelOrigin`, and restores all of them on the
way out. [0068](0068-a-run-over-is-a-continue.md)'s resume deliberately does not go through
`startLevel`, so a camera left where a walk finished would be a run opening in the middle of a level
with the empty opening stretch [0043](0043-a-weapon-is-a-budget-and-a-level-opens-empty.md) reserves
already spent.

⚠️ **Nothing in `src/` reads the restored value, which is exactly why it needs a guard.** What a kept
camera looks like is the title screen's star field drawn from three thousand units along — a picture,
and `tests/room.browser.test.ts` compares two screenshots taken with the same bake history to see it.

## ⚠️ Three defects that only an eye or a picture could find

1. **The readout was laid out over its own `hidden` attribute.** `hidden` is a User Agent rule of
   `display: none`, so the author's `display: flex` beat it and **the room opened with an empty
   outlined bar under the heading**. The element was in the DOM, was marked hidden, and said so to
   `element.hidden`, to the accessibility tree and to every query about it. Caught by looking at the
   screen on the first run.
2. **The layout guard had never seen the room with its readout up.** `showOnly` shows a screen by
   adding a class, and the readout appears only when something plays — so every viewport was being
   checked against a room 64px shorter than the one a listener sees. `fillTheRoom` closes it, driving
   the block to its widest content off the content tables. **This is 0210's own invisible-screen bug
   from the other side**: a thing correctly hidden that the guard could not see and reported on
   happily.
3. **`setPointerCapture` was ordered ahead of the seek.** It throws `NotFoundError` for a
   `pointerId` that is not an active pointer, which would have made a press on the bar do nothing at
   all. **No observed failure came from this** — it was found by reading the order while chasing a
   seek that turned out to be a race in the test — and it is written down because *the enhancement
   ate the feature* is a shape worth recognising.

⚠️ **AND ONE OF THIS SESSION'S MEASUREMENTS WAS ITSELF A PAUSED PAGE.** The walk read 0.1% after
eight seconds in the in-app browser and looked like a stalled feature; the pane hides itself between
tool calls and `requestAnimationFrame` stops with it. **A rate measured against a clock the page is
not running on is not a measurement**, which is why the headline assertion moved into
`tests/room.browser.test.ts` where a real Chromium draws every frame.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0212` — [0005](0005-a-guard-must-be-seen-to-fail.md),
[0019](0019-a-probe-must-be-seen-to-apply.md).

| broken on purpose | went red |
|---|---|
| the music room dimming again, which paints the space colour over the place it auditions | `the screens that show the scene through them are the two that say so` |
| the room back on one fixed rung, which is 0210 as it shipped and the reported defect | `agrees with a run at every section boundary` |
| the fight on a linear health curve, so BOSS_PEAK_HEALTH lands a fifth of the way in | `holds each rung of the fight for a whole phrase` |
| the readout laid out over its own hidden attribute, so the room opens showing an empty bar | `advances at a second of music per second of watching` |
| the run camera left where the walk finished, because the room never puts it back | `leaves the run's camera where it found it` |
| the walk stopped advancing, so the room is a still picture the model calls correct | `advances at a second of music per second of watching` |

⚠️ **A SEVENTH PROBE WAS WRITTEN, WENT GREEN, AND WAS DELETED RATHER THAN INFLATED.** It put the
readout on a fixed 2.5rem gap to see the layout guard refuse the shortest phone, and the guard held —
because the room has about **120px of vertical slack** on a 480×320 landscape display, measured
directly (panel 162px with the readout hidden, 232px with it filled, content spanning 57–258 of 320).
**No plausible single change to this readout overflows that**, so the honest record is the number
rather than a break enlarged until it fired. `fillTheRoom`'s effect is proven by that same
measurement, and it earns its keep against the change that eventually does.

## What is owed

**A listen, again, and this time there is something specific to listen for.** Every figure above is a
model quantity — dB of balance, notes a bar, layers open. What was reported is that two things sounded
different, and what is claimed here is that they no longer do. **No assertion in this repository can
hear that.**

⚠️ **AND THE ROOM IS NOW THE INSTRUMENT `docs/state-of-play.md` HAS BEEN ASKING FOR.** *"A play-test
on the SEQUENCE, not on any one place"* — [0211](0211-every-place-has-its-own-structure.md)'s seven
skies were each judged alone, at a fixed camera, in the bench. *Play all* is seven places in the
run's own order, scrolling at the run's own rate, for about twenty minutes. That was not the goal and
it is the more valuable half.
