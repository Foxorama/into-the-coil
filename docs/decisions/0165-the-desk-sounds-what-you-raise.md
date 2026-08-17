# 0165 — The desk sounds what you raise

**Accepted 2026-08-18.** Amends [0137](0137-the-desk-sounds-while-the-level-stands-still.md), whose
argument was right and whose conclusion was attached to the wrong half of it.

> *"The UX is trash — it needs to pause and reset the autoplay when changing tracks. I need to be able
> to play the individual items while it's paused → there's a section for this but it's completely
> separated and offscreen from the what is sounding section, so I have to remember what is playing,
> scroll down, then click each item, then scroll back up… I also can't turn sounds on/off to hear them
> over the running track. I can open everything, but following an individual item or upping the gain
> does nothing to make it play."*

## The rules

**Stopped means the LEVEL is not playing.** A layer with no hold is silent while the transport is
stopped; `deskTarget` is the whole rule and `rig/transport.ts` owns it.

**So the loops are on the air whenever the desk holds anything above zero** — `deskSounds`, which is
the condition 0137 refused.

**The live column reads zero when the loops are off the air.** A gain is upstream of `setOn`, so a
`GainNode` is not evidence that anything is audible.

**An audition button belongs in the row it describes.** One click, in the table, per layer.

**Choosing a level stops the transport as well as rewinding it.**

## ⚠️ 0137's argument was correct and it was an argument against something else

0137 asked whether the desk was *the only thing that would sound*: every layer held, at least one
above zero. Its comment states the refusal plainly:

> ⚠️ **IT IS NOT *SOMETHING IS HELD ABOVE ZERO*, AND THAT IS THE WHOLE OF THE ARGUMENT.** A layer with
> no hold FOLLOWS the mixer, so a transport put back on the air for one dragged fader would start the
> entire piece playing — the exact thing the report asked for the opposite of.

⚠️ **Every clause of that is true, and none of it is about the condition.** It is about **layers
following a level that is not playing**. Fix the following and the condition is free — and the report
0137 was answering (*"play sounds without affecting the current run of the melody itself"*) is
answered better, in one gesture instead of the three its own comment prescribed: *"`silence
everything` then a fader is the two-click route to the same state."* Three gestures for the single
most common thing anybody does with a mixer.

## ⚠️ And the panel reported a gain into silence

Driven in a browser at `main` e61a7e9 — transport stopped, `groove`'s fader dragged up from a released
desk:

| | |
|---|---|
| `groove` **live** column | **1.55** |
| `document.body.classList` | **`mute`** |
| loops | **stopped** — `setOn(false)`, and 0119 stops the sources rather than muting them |
| audible | **nothing** |

⚠️ **THIS WAS KNOWN AND WAS THOUGHT TO BE COVERED BY GREYING THE PANEL.** `drawTransport`'s own
comment: *"A layer's own gain is upstream of `setOn`, so the live column goes on reporting `sub 0.86`
into silence whenever the loops are off — that is what `mute` greys out."* A dimmed panel is not the
same as not printing a number, and the number is the thing the column exists to be trusted about. Its
stated promise is *"read off the mixer's own `GainNode`, not modelled — so it cannot disagree with
what the speakers are doing"*, which was **nearly** true.

⚠️ **THAT IS 0126's OWN FAILURE MODE ARRIVING INSIDE 0126'S OWN INSTRUMENT**, and it is the second
time: [0154](0154-the-mix-is-authored-as-intent.md)'s toggle *"changed the readout and not one sample
of audio"*. Same class, opposite direction.

## ⚠️ The buttons were right and were on the wrong screen

[0130](0130-a-layer-can-be-heard-on-its-own.md)'s reasoning survives word for word — it is the desk
and not a second player, and moving the mixer's own faders is what makes it impossible to drift from
the game. What was wrong was only **where**: twenty-three buttons in their own section below the desk,
so using them meant remembering the state of a table that had scrolled off screen.

⚠️ **A control and the readout it moves have to be on one screen, or the instrument is asking its user
to hold the state in their head** — which is the job it was built to take off them. 0130 already found
this once, at a smaller scale, and its own comment names it: *"THE DESK COULD ALREADY DO THIS AND IT
TOOK THREE GESTURES."* The fix then was a new panel; the fix now is deleting that panel and putting a
button in the row.

## Driven, not assumed

Verified in a browser against the dev server, reading the values back off the page rather than off the
model — [0027](0027-measure-the-picture-not-the-model.md), and because a readout is exactly the thing
a headless test cannot see:

| gesture | before | after |
|---|---|---|
| stopped, one fader raised from a released desk | `mute`, silence, live says 1.55 | on air; `groove` live **2.50**, every follower **0.00**, targets unchanged |
| desk released while stopped | live columns hold their last values | off air; every live **0.00** |
| `alone` in `perc`'s own row | — | on air, `perc` **0.86**, 22 others **0.00**, 23 held, button `aria-pressed` |
| level changed while walking | walk continues from 0:00 | **stopped** at 0:00, Ember Nebula, off air |

## What this is not

⚠️ **It is not a change to the game.** Nothing under `src/` is touched; `rig/` is the instrument, and
[0126](0126-the-dashboard-is-the-instrument.md) is why it is held to the same bar anyway.

⚠️ **The live column's zero is not guarded by a test and that is deliberate.** It is a DOM read of a
Web Audio node, and the only headless version available is a source scan for `!onAir` — which is the
spellcheck-standing-in-for-a-property that `tests/dash.test.ts`'s own header records getting wrong
once: *"`rig.includes('mixOf')` — and `npm run prove` reported STILL GREEN on two of three probes,
because deleting a call site leaves the import behind."* The rule underneath it, `deskTarget`, **is**
guarded, and the column is verified by driving. A weaker guard here would be worse than none.

## Confirmed, not assumed

- The reported behaviour reproduced in a browser before anything was changed, and each of the four
  gestures re-driven after — the table above.
- `npm run typecheck` clean; `tests/dash.test.ts` green.
- Two probes, seen red, trees restored: `node scripts/prove-guard.mjs 0165`.

| broken on purpose | went red |
|---|---|
| an unheld layer following the level while the transport is stopped, which is 0137's refusal restored | `0165 — NOTHING FOLLOWS THE LEVEL WHILE THE LEVEL STANDS STILL, which is what makes the above safe` |
| the air condition back to *every layer held*, so one dragged fader is silent again | `0165 — AND SO IS ONE FADER ON ITS OWN, which is the assertion this guard used to make backwards` |
