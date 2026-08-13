# 0147 — A place is a balance, and the band was ±3 dB

**Accepted 2026-08-14.** [0146](0146-three-more-places-and-two-after-them.md) wrote five whole
compositions and the player heard all five.

> *"Level 3 sounds incredibly similar to level 2, I'm not getting saurian or robot or techno or
> eurobeat vibes at all. Definitely no lasers and roar at the boss. Level 4, 5, 6 were pretty bland
> and very similar to the other levels, it didn't feel like I'd travelled somewhere else in the
> galaxy."*

## The rule

**A theme states a BALANCE, not a tint over a shared one.** `MIX_FLOOR` and `MIX_CEILING` go from
`0.5`/`1.45` — a ±3 dB window — to `0.22`/`2.6`, about ±8 dB and −13. What kept the mix safe is no
longer a narrow band but five properties, held per place in `tests/themes.test.ts`.

## ⚠️ The material was different and the balance was identical, and only one of those is audible

`node scripts/weigh-apart.mjs`, written for this and printing what nothing here measured:

| | |
|---|---|
| loudest layer, in **all seven** places | `sub` |
| the top of every mix | a sub, a kick, a bass and a pad |
| the bottom third of every mix | `call`, `frenzy`, `wraith`, `arp`, `crash`, `hook`, `ride` — at **−15 to −30 dB** |
| how far apart the seven sat | **1.9 to 6.0 dB** |

⚠️ **THE MEASUREMENT PREDICTS THE REPORT, WHICH IS HOW IT IS KNOWN TO BE THE RIGHT ONE.** The three
closest pairs in the table were Labyrinth/Mire at 1.9 dB, Mire/Rime at 2.5 and Labyrinth/Rime at 2.7 —
**levels 4, 5 and 6**, which is exactly and only the set the report calls interchangeable. The
furthest pair involved level 7, which the report calls *"really nice"*.

⚠️ **AND *"no lasers and roar at the boss"* IS LITERALLY TRUE.** Saurian Belt's lasers measured **21 dB
under its own kick** and its roar 20 dB under. Both cleared
[0140](0140-no-layer-is-inaudible.md)'s −33 dB floor by a comfortable margin, because *can this be
heard at all* and *is this what anybody hears* are different questions and only the first had a guard.

## ⚠️ Two mechanisms caused it and neither was the notes

**1. THE ±3 dB BAND.** `MUSIC_LADDER` is one arrangement for seven places and a theme could move a
layer by at most +3 dB. So the arrangement won, every time, by construction. **This is
[0113](0113-there-is-one-composition-and-seven-levels.md)'s own failure one level up**: 0128 and 0132
gave each place its own MATERIAL and left the BALANCE shared, and a listener hears the balance first.

**2. A FLOOR THAT BECAME A TARGET.** [0134](0134-the-place-keeps-the-games-pace.md) required a place
to hold at least 90% of the base's energy under 300 Hz. Four of 0146's five places hit that floor
while being written, and **all four were answered the same way — raise the sub, raise the kick, raise
the groove.** A guard written to stop one place being thin made every later place bass-led.

⚠️ **`CLAUDE.md`'s *no counting guard* is this shape one axis over**, and the note under it says every
proposed ceiling *"flagged its healthy file as loudly as its sick one"*. This is the same thing from
below: a floor everything is tuned down to is a target, and a target is a sameness.

## What replaces the band

| guard | what it refuses |
|---|---|
| the bus does not clip, per place per rung | *(unchanged, and it is what bounds the whole thing)* |
| **no two places within 3 dB of each other's balance** | the reported defect, stated as a number |
| **no place's quietest third below −15 dB** | a place that keeps its character in a whisper |
| every rung arrives: `run < push < surge`, `boss > approach` | a wide band selling back one of 0102's four climbs |
| the share under 300 Hz is a **band**, 28%–55%, absolute | 0134's defect at one end, and *more bass* as the universal answer at the other |

⚠️ **MORE STRUCTURE, NOT LESS — the same trade [0120](0120-a-rung-may-close-a-layer.md) made** when it
took 0090's additive rule away. A ±3 dB window was a property of nothing; these are properties of the
thing the report is about.

## ⚠️ `approach` is no longer required to be the neutral row, because its reason went

`tests/themes.test.ts` required level one's mix to be *exactly* empty so the other six were *"read
against something"*. That was sound while the only available comparison was against the base — and
0147 compares places **to each other**, so the ruler is no longer one row.

⚠️ **HOLDING IT NEUTRAL HAD A COST NOBODY HAD NOTICED.** Level one was the one place that could not
answer *"there are still some gain and some overlap issues for level 1 and 2 to sort out"* with the
lever every other place has: its quietest third measured **−18 dB**, and the table it would have been
fixed in was the table it was forbidden to use. It now sits at −11.7.

## ⚠️ A guard was written, run, and deleted the same hour

The first draft of *every rung arrives* asserted a straight climb through all five rungs. **The base
ladder fails it**: `approach` closes `groove` and `hook` and sums *below* `surge` by 1.3%, which
[0136](0136-the-place-has-a-room-and-an-arc.md) calls a drop by name.

⚠️ **A guard the shipped design fails is a guard measuring the wrong quantity** —
[0044](0044-an-intermittent-guard-is-measuring-the-wrong-thing.md) arriving at the moment of writing
rather than three weeks later. Worse, 0136's *drop* is about **where the notes sit**, which `pitchOf`
measures and a sum of gains cannot see; asserting the gain version would have been fitting a bound to
a 1.3% accident and then tuning five places against it.

## What the numbers are now

| | before | after |
|---|---|---|
| closest two places | 1.9 dB | **3.2 dB** |
| furthest two places | 6.0 dB | 4.4 dB |
| worst quietest third | −22.3 dB | **−15.0 dB** |
| level one's quietest third | −18.0 dB | **−11.7 dB** |

⚠️ **THE SPREAD NARROWED AT THE TOP AND THAT IS THE POINT.** Places used to differ by cutting things
into inaudibility; they now differ by which layers are at the top, which is what the two new guards
pull against each other to produce. **A place cannot be distinctive by being empty.**

## The three named asks, and what each got

1. **A heartbeat for the Black Heart's boss** — asked for by name. `stomp` gains a two-thump figure at
   96 Hz falling to 24, under the blast beat, replacing a floor tom that said nothing the blast was
   not already saying. The Labyrinth uses the same figure in `sub` for the opposite picture.
2. **Level seven opens quiet** — it summed **5.78** against the other six at 6.2–8.5, the thinnest
   opening in the game. It is **7.46** now, and the weight went on `groove`, `chords` and `call`,
   which all close before or at the fight and therefore cost nothing at the rung the clipping guard
   measures.
3. **Higher tempo for level seven** — `drive` goes to **thirty-seconds**, the same figure at twice the
   picking rate. [0093](0093-the-gun-is-on-the-grid.md) fixes the beat at 24 sim steps and the gun,
   the enemies and the phase-lock all ride it, so what rises is subdivision — 0102's finding, and what
   a listener calls faster.

## What is NOT changed

⚠️ **Not one note of any composition, except level seven's `drive` and its heartbeat.** The report was
about balance and the fix is balance; changing material in the same pass would make the next verdict
unattributable, which is [0109](0109-a-death-is-a-drum.md)'s standing rule.

⚠️ **The ladder, the rungs, the distances, `MUSIC_GAIN`, `MUSIC_DRIVE`.** Untouched.

## ⚠️ What is owed

**A listen, and it is the only thing that settles this.** Every number above is a model quantity —
[0027](0027-measure-the-picture-not-the-model.md) — and `apartBy` is a **proxy** for *sounds like
somewhere else*, chosen because it predicted this report. **If the next round says two places at 4 dB
still sound alike, the threshold is not the thing to move — the proxy is wrong and needs replacing.**

**And *"no saurian or robot or techno or eurobeat vibes"* is only half-answered.** The floor, the
offbeat hat, the trance arp and the hoover are now at the top of that place's mix instead of 17 dB
under it. Whether the material itself reads as the genre is a question this pass deliberately did not
touch, and it is the next thing to ask after a listen.
