# 0183 — A cue is limited rather than refused, and a place's dread is its own

**Accepted 2026-08-20.** Three ceilings named by the player, removed three different ways — one
replaced by a bus, one by a per-place field, one by nothing at all.

> *"Let's remove the max voices, aura level ceiling and the low band ceiling and keep the no-hard-cut
> for now."*

## The rules

**No cue is refused for being fifth.** `MAX_VOICES` is gone; every cue the game asks for on a step is
heard. What keeps the bus inside full scale is `limit` — a `WaveShaperNode` between the master gain
and the speaker, identity below `CUE_LIMIT` and asymptotic above it.

**How far a level's own build may open the aura is a property of the place.** `AURA_LEVEL_CEILING` is
gone; `THEMES[place].aura` is required, and the seven places state 0.40 to 0.60.

**Nothing bounds how much of a place lives under 300 Hz from above.** The floor stays.

## ⚠️ Each one needed a different answer, and that is the finding

[0182](0182-a-mix-number-has-no-band.md) removed five walls by deleting them, because each had
something better already measuring its subject. **Not one of these three was that.** A removal is
only free when the property the wall stood for is held somewhere else; when it is not, *delete it* and
*keep it* are both wrong and the work is to find the third thing.

| ceiling | what it was really holding | what replaced it |
|---|---|---|
| `MAX_VOICES` = 4 | two jobs — bound the allocation, keep the sum inside full scale | `hold` already bounded the first; a **limiter on the bus** does the second |
| `AURA_LEVEL_CEILING` = 0.55 | the fight must arrive somewhere the level has not been | a **per-place field**, bounded by the ratio that states the property |
| low band ≤ 0.55 | *more bass* must not be the answer to every question | **nothing** — it is a claim about seven places and two guards already compare them |

## ⚠️ The voice cap was doing two jobs and neither one needed a number

**The allocation.** `tests/budget.test.ts` lists `src/app/sound.ts` as deliberately cold because a
one-shot `AudioBufferSourceNode` cannot be pooled, and the cap was what bounded it. **`hold` already
did**: no cue's is under two steps, so a kind that sounded this step cannot sound again on it and the
worst case is `CUE_KINDS.length`. That bound is **read off the table** — it moves when the table does,
which a typed 4 chosen when there were fewer rows never would have.

**The level.** Every cue and the room's return meet at `master`; the sum of all fourteen peaks is
**1.92 of full scale** after `MASTER_GAIN`, so something has to catch it. A shaper catches it *and
plays the cue*; a cap catches it by **silencing an event the game decided was worth telling the player
about**.

⚠️ **`saturate` IS RIGHT THERE AND IS THE WRONG TOOL, WHICH IS WORTH THE PARAGRAPH.** It is normalised
at unity and is therefore an **upward** compressor — slope at zero `k / tanh(k)`, which at the music
bus's own drive is **2.82**. Reusing it here would lift every quiet cue by 9 dB and rewrite a balance
[0092](0092-the-mix-is-a-hand-and-the-aura-was-a-curve.md) took two reports to settle. `limit` starts
its knee at a threshold and leaves the bottom alone, which is what makes *nothing the old cap allowed
is touched* a property rather than a hope: **the four loudest cues at once come out bit-identical.**

⚠️ **AND IT IS STATELESS, ON `saturate`'s OWN ARGUMENT.** A `DynamicsCompressorNode` has an attack and
a release a headless guard cannot model, so the guard holding the bus would have to be weakened to
admit one.

## ⚠️ The aura ceiling could not be deleted, and a probe written in July is why

`scripts/probes/0091-aura.mjs` has driven this constant to 1 since
[0107](0107-a-level-is-a-place.md) and reddened `0107 — and nothing but a BOSS ever takes it to the
top`. **The regression a literal deletion ships was already written down and already demonstrated**:
the level-long build reaches full before the fight, so
[0091](0091-the-boss-has-an-aura.md)'s *as it gets closer to the player* has nothing left to say and
every boss fight loses its proximity movement.

⚠️ **SO WHAT CAME OFF IS THE GLOBAL, NOT THE MECHANISM.** One hand's answer stood for seven places;
now each states its own and the probe drives level one's. **Seven identical values would have been the
constant reached a longer way round** — `rungIn`'s own header, one table over: *a mechanism no data
exercises is guarded by nothing.*

| | | |
|---|---|---|
| Rime Shelf | **0.40** | ice is still, and its threat is the one that arrives without warning |
| Saurian Belt | **0.45** | a dancefloor does not do slow dread; the fight is the arrival |
| The Approach | **0.55** | the reference, and the number all seven used to be |
| The Toxic Mire | **0.58** | the mire seeps — it reaches you before you reach it |
| Ember Nebula, The Labyrinth, The Black Heart | **0.60** | a build, a hunt, and the place the run is travelling towards |

⚠️ **AND THE BOUND ON THE FIELD IS THE PROPERTY, NOT A NUMBER.** `tests/music.test.ts` holds, per
place and per aura layer, that the fight tops out **more than 1.8×** what the level's own build
reached. That limits a place to about **0.63** today — stated rather than glossed. A place that wants
more must also raise its own `boss` row, which [0162](0162-a-place-has-its-own-ladder.md) already
permits, and the argument for it gets made.

## ⚠️ The low ceiling is the only one that goes to nothing, and it is the one that was asked for twice

It was written so *more bass* could not be the answer to every question — a real failure, and **a
claim about seven places rather than about any one of them.** What it forbade in practice is a place
that is deliberately bass-led, and [0181](0181-the-floor-has-a-bottom.md) had been handed *"deeper
eurobeat notes"* about a place two days earlier.

**What it was protecting is held by the guards that compare places**: no two within 3 dB of each
other's profile, and [0172](0172-a-place-opens-with-its-own-four.md)'s no two with the same four
layers on top at `run`. Seven bass-led places fail both. **One is now allowed to be.**

## ⚠️ And an instrument had drifted, which this found on the way past

`scripts/weigh-mix.mjs` claimed *the arithmetic is the guard's, not a second opinion* and had stopped
being true three ways: its low floor read **0.28** where [0176](0176-the-re-based-mix-is-the-mix.md)
re-derived the guard's to 0.24, so it reported **eleven THIN rungs the suite is green over**; its
`arc` table printed verdicts for the two guards 0182 deleted; and its clip column is a raw-sum proxy
that reads over 100% on rungs the real shaper passes. Corrected, and the proxy is **labelled** rather
than removed. It now flags exactly the two exceptions the guards name.

⚠️ **[0116](0116-the-rig-plays-the-level.md)'s OWN SUBJECT, FOUND WITHOUT LOOKING FOR IT** — an
instrument describing a game nobody plays. Reading it was a step in this work, not the point of it.

## What is guarded

| | |
|---|---|
| every cue asked for on a step is heard | ✅ `tests/sound.test.ts` |
| the whole table at once stays inside full scale, through the shaper with the browser's clamp | ✅ |
| the densest instant the old cap allowed passes through **unchanged** | ✅ identity below `CUE_LIMIT` |
| the curve is monotonic and bounded | ✅ |
| a step's voices are still bounded — every `hold` is at least two steps | ✅ over the table, not the number |
| every place states an aura ceiling, and they are not all the same | ✅ `tests/music.test.ts` |
| the fight tops out 1.8× the level's own build, **per place** | ✅ |
| a place has a bottom | ✅ floor kept |
| **how much bottom a place may have** | ❌ **on purpose** |

## ⚠️ What was deliberately not done

**The no-hard-cut stays**, by name: [0171](0171-a-boundary-is-a-build.md) still forbids a boundary
that delivers every arrival at one instant, in every place. It answered *"the transitions doesn't
actually transition, it just jumps"* and the player kept it.

**The seven aura values are a hand's first authoring and want an ear.** They are the one part of this
that changes what the game sounds like, and nothing here is a measurement of whether they are right —
`npm run dash`. The clip guard, 0164's role floor and `weigh-adrift`'s count (**54, unmoved**) all say
they broke nothing.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). No storage key, no save field, no
service-worker cache prefix, no origin. The limiter is a node in a graph built at context creation and
the aura field is content; a revert is `git revert` and nothing else.
