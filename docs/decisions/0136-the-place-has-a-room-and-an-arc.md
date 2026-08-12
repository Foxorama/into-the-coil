# 0136 — The place has a room, and an arc that ends in the fire

**Accepted 2026-08-13.** [0134](0134-the-place-keeps-the-games-pace.md) gave Ember Nebula the game's
pace. This gives it space and a shape.

> *"It still needs more reverb and higher octaves for the opening, push and surge. The sky background
> for this nebula is going to be the Eagle Nebula and the Pillars of Creation — so the music track
> needs to be suitably awe inspiring to match that background. And then it's going to be fading into
> fiery red and brimstone, so the boss needs to drop from the high octaves down into the lower tones
> of hellfire and menace. So like Up, Up, Up, drop, sharp Down for the boss, and under cutting the
> tones is that sharp percussive beat that increases the tempo with each transition so that we've got
> a really fast tempo for the boss."*

## ⚠️ The synthesiser had no reverb, and every reach for one had been sustain

**This is the finding.** Asked twice now for *more reverb*, and every lever this project had used was a
longer note, a slower attack or a lower decay constant. **A held note is a held note.** What says
*large room* is the same note arriving again, later, darker, from somewhere else — and nothing here
could do that.

`addRoom` is a Schroeder reverb baked into the finished loop: three feedback combs into two allpass
diffusers, wrapped, with `air` per layer on the theme.

| | |
|---|---|
| **a post-pass over the loop, not a per-note render** | proportional to LENGTH rather than to synthesis — **170 ms across twenty-one layers**, against the 4.4 s the notes already cost. Re-rendering each note three times would have been fifteen seconds |
| **it wraps** | on exactly the terms a note does; a tail that stopped at the end of the buffer is a gap at the same instant every loop |
| **per layer and not over the bus** | the drums want a short room or the pulse turns to mud and the choir wants a long one. A single wet control makes the one that matters impossible |

### ⚠️ Two things were wrong before it worked, and both were measurements

**Three combs sharing one buffer are one feedback loop, not three.** The first version wrote every tap
back into the signal all of them were reading, so the whole thing only decayed while their gains
*summed* below one — each was capped near 0.3 and the tail was gone in 600 ms. Independent delay lines
are stable at 0.84 apiece: a tail of about two seconds.

**And combs alone are a comb FILTER.** Measured over a sustained pad — which is exactly what this place
is made of — the room *cancelled*: energy fell a hair and the peak dropped 5%, because a delayed copy
of a held tone subtracts as often as it adds. A listener would have got a hollow metallic colour on the
choir. Two allpass diffusers are the missing half of a Schroeder reverb, and the guard now measures
`wet − dry` rather than the total for the same reason: **on sustained material a reverb can be plainly
audible while the summed RMS moves one percent.**

## The arc: Up, Up, Up, drop, sharp Down

Held over **where the notes are**, gain-weighted, in Hz:

| | run | push | surge | approach | boss |
|---|---|---|---|---|---|
| **Ember Nebula** | 132 | **197** | **221** | **210** | **178** |
| level one | 112 | 161 | 197 | 206 | 195 |

⚠️ **`hook` is nearly the whole arc, because it is the only layer the ladder opens at `push` and
`surge` and closes at `approach`.** Its top rank climbs to a fourth octave over the pedalboard — 0136's
*higher octave hits* — and its absence is what makes the approach a drop rather than a gain change.
The fight then falls 15% as `frenzy`, `wraith` and the aura's crackle each drop an octave and the mix
leans on them.

⚠️ **The drop is a drop in SPACE as well as in register.** `stomp` has no room at all and `frenzy`
almost none, where the choir sings in a cathedral — so the boss arrives somewhere *close*. Nothing in
this game could say that before, because there was never a reverb to take away.

## ⚠️ The spectral centroid is the wrong instrument, and it was tried first

It moved **five hertz** while an octave of material moved, because it is dominated by whichever layers
are loudest and continuous. Worse, it **argues against the other half of the same report**: sharp
percussion is broadband noise, so a boss that correctly drops an octave in its tones measures *higher*
on a centroid than the section before it. Tuning against it would have meant taking the fast metal back
out.

`pitchOf` reads the content — a step is a semitone over `MUSIC_ROOT` and an octave is a field — so it
sees what was written, with no audio at all. **The centroid is still printed** by
`scripts/weigh-rung.mjs`, beside the pitch, so the next hand can see the two disagree rather than
rediscovering it.

## The accelerating percussion

The tempo cannot move ([0093](0093-the-gun-is-on-the-grid.md)) and a layer plays one loop — so the
acceleration is carried by **which layers a rung opens**, which the ladder already decides:

| rung | grid | layer |
|---|---|---|
| `run` | eighths | `engine`'s breath and off-beat |
| `push` | sixteenths | `ride`, now a sharp tick where it was a bowed shimmer |
| `surge` | sixteenths + a thud | `drive` |
| `boss` | **thirty-seconds** | `stomp`'s chain — the fastest thing in the game, by a factor of two |

## What is guarded

| | |
|---|---|
| **a room adds energy and not peak, and decays** | ✅ measured as `wet − dry`, over a real sustained layer |
| **the arc climbs, drops and falls sharply into the fight** | ✅ a shape and not a value, so [0034](0034-a-threat-is-absolute-and-a-pool-is-the-pairing.md) holds |
| pace and bottom against the base | ✅ 0134's floors, still green at 102–118% and 93–107% |
| nothing clips at any rung | ✅ 0134's fix, now over this place's own audio |

⚠️ **THE ARC GUARD WAS TOO WEAK AND THE PROBE FOUND IT — the second decision running.** It said
`approach < surge` with no magnitude, and pulling the organ's top rank to a third still left a
one-percent fall, so the guard passed on an arc that had flattened.
[0019](0019-a-probe-must-be-seen-to-apply.md) doing the more valuable half of its job; the drop has a
size on it now, and today's is 5% against a bound of 3%.

## ⚠️ And the dashboard was lying, which is the worst shape a dev tool can have

> *"Sound dashboard hasn't been updated with the new sounds/tracks?"*

Two things were true and only one of them was this branch not having merged. **A vite hot update
re-runs the module and leaves every baked buffer exactly where it was**: `prewarmAudio` returns early
once the set exists (deliberately, 0102), the dashboard's `loopsByPlace` is a live cache, and
`MusicOut`'s `AudioBuffer`s were copied at unlock. So editing a composition updated the page, printed
the new layer list, and **went on playing the audio it synthesised when the tab was opened.**

⚠️ **It does not fail — it reports confidently on a build that no longer exists.** That is
[0027](0027-measure-the-picture-not-the-model.md)'s subject wearing the instrument's own clothes, and
`docs/machine.md` already records an hour lost to *establish which build a report is about* in the
other channel. `rig/dash.ts` forces a full reload on any hot update now; it costs the four-second bake
it was avoiding, once per edit.

## ⚠️ `revoicedBy` and `bakedBy` stopped being the same set, and everything asked the wrong one

Before this decision, *plays its own notes* and *sounds different from the base* were one sentence. A
place can now state `air` for a layer it does **not** re-voice — same notes, different buffer.
`bakePlace` at a level boundary (0133) and the dashboard's cache were both asking `revoicedBy`, so
such a layer would have shared the base's **dry** array and the room would simply never have arrived.

⚠️ **Silently, with every guard green**, because nothing asserts about a layer a place did not claim.
Ember Nebula gives air only to layers it also re-voices, so nothing was wrong — **this is the trap
closed before the first place walks into it**, and `bakedBy` is set arithmetic, so keeping it closed
costs nothing.

## What the room cost the mix

⚠️ **The nebula's multipliers came down 6% across the board**, which changes no balance — a uniform
scale cancels in every ratio the pace and arc guards measure — and buys **7.5–10.6% of pre-shaper
margin** where there had been 0.2%.

⚠️ **THE POST-SHAPER PEAK HIDES THAT ENTIRELY AND I MISREAD IT ONCE.** `saturate` compresses hard near
unity, so a 6% cut to the summed input moves the measured peak from 0.998 to 0.994 and looks like it
did nothing. **The quantity with margin in it is the sum reaching the shaper**, not the peak leaving
it — the clip guard's own bound is really about the former, since `saturate(x) > 1` exactly when
`x > 1`.

## Rollback

None owed — [0001](0001-revertability-not-risk-rating.md). A bake-time pass, a content field and
content. No storage key, no save schema, no cache prefix, and nothing in a frame.

## What is owed

**A listen, and it is the only thing that can settle any of this.** Every number here is a model
quantity ([0027](0027-measure-the-picture-not-the-model.md)) and the brief is *awe*. `npm run dash`,
level `descent`, the rung buttons. The specific question: does the room read as a building, or as a
wash over the top of the tune?
