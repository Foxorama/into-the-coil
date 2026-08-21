# 0190 — A place owns what it kills, and the ship is the constant

**Accepted 2026-08-21.** Seven of the fourteen cues may be re-voiced per place. **Saurian Belt is the
first level in the game whose enemies do not die the same way as everybody else's.**

> *"I'll also need the dashboard updated so I can do the same thing for enemy deaths, boss attacks,
> ship attacks — guns and missiles — and have space for different sounding enemy deaths per level and
> different attacks etc per level."*

## The rule

**`PLACE_CUES` names the seven a place may re-voice, and a place states `layers` rather than a row.**
`THEMES[place].cues` is `voices` one channel over: same shape, same fallback, and a cue a place does
not name is the base composition's, byte for byte.

## ⚠️ The measurement was one grep

`src/content/cues.ts` contained **zero** references to a theme. `CUES` is one flat table, `bakeCues`
took a rate and nothing else, and `bakeCues` ran **once** where the music has had `bakePlace` since
[0128](0128-a-place-plays-its-own-material.md). A drifter dying in Rime Shelf and one dying in the
Saurian Belt were the same 24 kB of audio.

⚠️ **THE MECHANISM IT RIDES ALREADY EXISTED, WHICH IS MOST OF WHY THIS IS SMALL.**
[0133](0133-the-place-is-baked-at-the-boundary.md)'s boundary bake walks a job list at every level break and hands
the mixer a set where everything the place does not state is the **same array**; `setLoops` compares
by identity. The cues go in that same job list and come out of that same callback. There is no second
schedule, no second slice budget and no second seam.

## ⚠️ The ship is the constant and the place is what changes around it

`pulse`, `missile`, `bomb`, `shield`, `death`, `pickup` and `chime` are **not** in `PLACE_CUES`. A gun
whose report changed with the biome would make the one instrument the player carries between places
into a property of the place, and [0093](0093-the-gun-is-on-the-grid.md) and
[0104](0104-the-gun-plays-a-figure.md) both assume it never does.

⚠️ **AND A PLACE STATES `layers`, NOT A `CueRow`, WHICH IS WHY THERE IS NO SECOND GUARD.** `twin` is
[0024](0024-the-accessibility-floor-is-settings.md)'s unconditional tier, `hold` is a flam, `duck` is
the music getting out of the way, `figure` is [0104](0104-the-gun-plays-a-figure.md)'s grid, `air` is
a send on a node the place never touches. **None of them is what a Saurian enemy death sounds like**,
and making the override a voice list makes changing them *unrepresentable* instead of refused —
[0016](0016-a-hub-enumerates-kinds.md)'s own preference, and one fewer table to keep honest.

## ⚠️ What Saurian Belt actually got

| | |
|---|---|
| `kill` | a bone snap, a darkening noise body, **a throat**, a dry rattle, a low thump |
| `threat` | a spit — a falling band with a throat under it, where the base has two falling tones and a laser |

⚠️ **THE THROAT IS THE ONE GESTURE A LISTENER WILL NAME, AND IT IS THE ONLY PITCHED EXPLOSION IN THE
GAME.** Every `kill`, `blast` and `bomb` in `src/content/cues.ts` is filtered noise, because that is
what an explosion is. A creature is not: it is a note that collapses. A saw falling a ninth in 190 ms
with the filter closing behind it is a roar being cut off, and `inKey` puts both ends of the fall on
degrees of this place's own scale so a chain of deaths is in tune with the floor —
[0099](0099-the-cues-are-in-the-key.md) still holds.

## ⚠️ The first hand-authored cue in the game was unguarded, and widening the guard caught it

⚠️ **EVERY CUE GUARD READ `CUES`**, so the moment a place could re-voice one, the newest and least
tested audio in the repository was the only audio nothing checked. [0089](0089-a-cue-has-a-body.md)'s
body guard and [0179](0179-an-explosion-ends-low.md)'s fall guard both loop over places now, with
`undefined` — the base composition — as a real case rather than a defensive default.

⚠️ **AND IT FIRED ON THE FIRST RUN, ON THE WRONG LAYER.** This cue was authored with the throat as its
body and **no noise body at all**. 0089 reads *the loudest noise layer* and asks whether it darkens
and whether the box is filtered out of it — and every clause passed against the four-millisecond
**SNAP**, because a crack is also short, filtered and high-passed. **It would have shipped green on an
assertion about a part it is not about.** A probe cannot catch that: the guard fires, on the wrong
quantity, which is [0027](0027-measure-the-picture-not-the-model.md)'s distinction arriving in the cue
channel. The fix is material — a real noise body under the throat — and it is better material anyway:
a thing made of meat coming apart is a thump *and* a roar.

## ⚠️ The route is the break nothing else sees

⚠️ **A `cueLayersOf` THAT IGNORED THE PLACE WOULD HAVE PASSED EVERYTHING.** `cuedBy` reads the table,
the empty-list check reads the table, and the widened cue guards would have measured the base's
explosion seven times and reported seven passes. A place would state its own enemy death, the decision
would describe it, and the player would hear the base composition. That is
[0162](0162-a-place-has-its-own-ladder.md)'s own lesson in a third table — *"not a guard that cannot
fail, but a code path nothing can drive"* — and the assertion that catches it exists for its probe to
hit.

## What this does not do

⚠️ **THE DASHBOARD STILL CANNOT DRIVE A CUE, AND THAT WAS THE OTHER HALF OF THE ASK.** Its entire cue
panel is an on/off button per kind: no fader, no audition, no paste. **This decision makes the content
per-place; nothing yet makes it drivable**, so Saurian Belt's death is the first cue in the game
authored by hand against guards and never once heard by a person before it shipped. That is the wrong
way round — [0126](0126-the-dashboard-is-the-instrument.md) — and it is the next piece of work rather
than an oversight, on the player's own sequencing.

⚠️ **`scripts/hear.mjs` TAKES A `--place` AND `scripts/weigh-cue.mjs` DOES NOT.** The first was
going to be left as a debt beside the second, and it should not have been:
[0184](0184-the-measurement-reads-the-place.md) is the record of what an instrument reading the wrong
table costs — six mix decisions made against a phantom — and this is the one instrument that can
answer *what does it actually sound like* rather than *does it pass*.
`node scripts/hear.mjs --only=kill,threat --place=saurian` writes the WAV.

⚠️ **`weigh-cue` IS STILL BASE-ONLY AND IS THE REMAINING DEBT.** It is 0179's own instrument — the
one that found an enemy death whose centre of gravity ROSE 22.5 dB — and it cannot be pointed at the
newest explosion in the game. The suite covers the same property per place now, so this is a hand's
reach rather than a hole in the guards, and it is named so the next session does not assume the
number it prints is about the place it is working on.

⚠️ **AND NO OTHER PLACE STATES A CUE.** Six of the seven still sound the base composition's fourteen,
exactly as six of the seven still open all nineteen music layers —
[0189](0189-a-place-is-what-it-does-not-play.md). The mechanism is one level deep in both channels.
