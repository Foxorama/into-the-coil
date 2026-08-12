# 0130 — A layer can be heard on its own, in one click

**Accepted 2026-08-12.** The music half of the panel
[0126](0126-the-dashboard-is-the-instrument.md) built for the cues.

> *"The music dashboard needs to let me play music components as well as the 'every sound in the
> game', so I can hear them individually without needing to have the main theme playing."*

## The rule

**Every one of the twenty-three layers is a button, and one click puts that layer alone on the desk
at the loudest this place ever takes it.** Clicking it again, or *everything back*, hands the mixer
its mix back.

⚠️ **THE LOUDEST RATHER THAN THE CURRENT VALUE, AND THAT IS THE ENTIRE DESIGN DECISION.** *What does
this layer sound like* is a question about the material; *what is it doing right now* is what the
**live** column already answers, off the `GainNode`. `loudestGain` walks `MUSIC_LEVELS` through the
game's own `targetGain`, so the number in the fader is the rung, the place's multiplier and the
aura's ceiling — not a listening level invented in the rig.

⚠️ **The aura's pair are taken at a boss at arm's length**, which is the only honest reading of
*loudest* for two layers whose gain is a distance the player steers
([0091](0091-the-boss-has-an-aura.md)).

## ⚠️ The desk could already do this, and *three gestures* is what was wrong with it

[0129](0129-the-desk-holds-a-value-not-a-multiplier.md) made the faders absolute precisely so a
closed layer could be dragged up. What it left was a **three-gesture** answer: click the layer's name
to solo, find its fader, drag it up — because `solo` pins the others at silence and leaves the
survivor **at whatever the ladder says**, and fourteen of the twenty-three are closed at any given
rung. So the common case of *what does `frenzy` sound like* was: click, hear nothing, work out why,
drag.

⚠️ **The cue panel beside it has been one click a sound since 0126**, and the report is asking for
parity. A panel you have to remember the technique for is a panel that gets read rather than used —
which is the same argument 0126 made against opening a music question in a `.wav`.

## ⚠️ It is the mixer's own faders and NOT a second player

The obvious build is a `BufferSourceNode` per button pointed at the destination, and it is wrong
here:

- it would **bypass `MUSIC_GAIN`, the bus shaper and the duck**, so a button would play something the
  game never plays;
- it would be a second description of *what a layer sounds like*, in the one tool whose central claim
  is that it has none — [0116](0116-the-rig-plays-the-level.md) records **two** verdicts taken from a
  rig that had come apart from the game.

Moving faders that already exist costs no node, no allocation and no drift, and the layer stays
exactly **in phase** with the piece, because it never left it.

⚠️ **The loops therefore have to be on the air, and the button starts them.**
[0119](0119-off-stops-the-loops.md) makes a paused dashboard *stop* the sources rather than mute
them, so a fader written into a stopped transport writes into nothing. What the report asked not to
hear is the rest of the piece — and every other fader at zero is what answers that, not a stopped
transport.

⚠️ **A change of place re-states the audition**, because *the loudest this place takes it* is a
different number in Ember Nebula from level one, over
[0128](0128-a-place-plays-its-own-material.md)'s different material.

## ⚠️ Which button is lit is DERIVED from the desk, never remembered

A remembered `alone` variable goes stale the instant a fader is dragged, and the panel would then be
lighting a claim the mixer is no longer honouring — the class of defect this whole dashboard exists
to remove, arriving in its own chrome. `aloneOn()` reads the holds: exactly one layer above zero and
every other pinned at zero, or nothing.

The copy-out says it in one line for the same reason — an audition holds all twenty-three, and a
paste that was twenty-two lines of `arp 0.00` would bury the one fact in it.

## What is guarded, and what is deliberately not

| | |
|---|---|
| the value the button puts in the fader equals the game's own tables | ✅ `tests/dash.test.ts`, composed from `MUSIC_LADDER` and `mixOf` rather than from `targetGain`, so it cannot agree with itself |
| **no layer is unreachable — all twenty-three, in all seven places** | ✅ and it doubles as a live dead-layer check |
| it reaches past the rung, which is why it is not the ladder's own value | ✅ over the ten layers `run` closes |
| the click, the DOM, the `AudioParam` write | ❌ needs a browser — **driven instead**, and the run is below |

⚠️ **`scripts/probes/0130-heard-alone.mjs` breaks it the way anybody would build it wrong** — the
audition reading the rung on screen — and the guard was seen to go red.

## What was driven, since a browser is what the untested half needs

`npm run dash`, `descent` (Ember Nebula), transport **stopped**, driven through the page:

| | read back |
|---|---|
| clicking `frenzy` — closed at `run`, and the rung on screen was `run` | loops back on the air, `frenzy` **live 0.92** with `target 0.00` beside it, and the other twenty-two live at zero |
| clicking it again | 0 held, nothing lit, every fader following the mixer |
| `drone` auditioned, then the place changed to The Approach | 0.74 → **0.55**, still lit: 0.55 × Ember Nebula's `drone` 1.35 is the difference |
| dragging another layer's fader while `drone` was lit | the button went dark on its own — nothing is alone any more, and nothing remembered otherwise |

⚠️ **`target 0.00` beside `live 0.92` is the whole feature in one row.** That is a layer the ladder
has closed, sounding, with the readout telling the truth about both.

⚠️ **The fader reads 56 where the hold is 0.55**, because the desk's gain slider steps in twos. The
hold is the value that is written and **live** is what confirms it; a one-part-in-two-hundred
rounding in the widget is not worth a finer step on twenty-three sliders.

## The cost

Three files in `rig/`, one exported function, no new node and nothing in `src/`. The shipped page is
byte-identical — `vite.config.ts` has one entry and it is not this page
([0003](0003-single-file-build.md)).
