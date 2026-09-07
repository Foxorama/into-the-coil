# 0271 — The cathedral keeps only its drum

**Accepted 2026-09-07**, from the alpha play:

> *"On the music side of things can we remove the percussion from the Ember Nebula, the only audible
> part is the high pitched tone at the moment and it sounds like a seagull making a cry that doesn't
> fit the rest of the track. It sounds great on Rime Shelf, but it doesn't fit ember nebula."*

**Amends [0134](0134-the-place-keeps-the-games-pace.md)**, which authored the two voices that go, and
completes [0172](0172-a-place-opens-with-its-own-four.md), which closed `perc` at `run` on the same
argument and stopped there.

## The rule

**Ember Nebula's `perc` is one voice: the frame drum.** The hand bells, the struck plates and the
sixteenth breath are deleted from `src/content/nebula.ts`. Nothing else moves — not the ladder, not
the mix, not `REBASE`.

## ⚠️ The report named one voice out of four, and the measurement agreed to the decibel

`scripts/weigh-heard.mjs` ranks every layer by what survives the rest of the mix. Ember Nebula's
`perc` was **the loudest thing in the place at three rungs of five**, and it had never been reported
because the two rungs where it is not are the two anybody hears first.

| rung | margin | window | peak |
|---|---|---|---|
| `push` | −5.5 | hi L | −11.6 |
| `surge` | **+2.7** | hi L | −8.3 |
| `approach` | **+5.6** | hi L | −6.1 |
| `boss` | **+6.2** | hi L | −5.8 |

The fight's next-highest peak is `toll` at −10.0, and nothing else in it clears −13.5. **A layer 4 dB
over the loudest transient in a mix of fourteen is not a percussion part, it is the tune.**

⚠️ **AND THE PLACE THE REPORT CALLS GREAT MEASURES LIKE A PERCUSSION PART.** Rime Shelf's `perc` sits
at −5.8 and −7.7 with its peak at −13.7, mid-pack at every rung. Both places were authored with the
same four-voice construction — a bell, a breath, a frame drum and a high hit — so *"great there, wrong
here"* is a claim about two things that look identical in the source.

## ⚠️ What separates them is which band the layer lives in, and it was one glide

Baked voice by voice, in the repository's own bands:

| | Ember Nebula | Rime Shelf |
|---|---|---|
| the bell | `tri 1760→1170` — **himid −41** | `tri 5200→3600` — hi −55 |
| the breath | `noise` — air −70 | `noise` — air −73 |
| the frame drum | `sine 190→108` — lowmid −41 | `sine 176→108` — lowmid −39 |
| the high hit | `tri 3520→2640` — **hi −40** | `tri 2640→2200` — hi −44 |
| **the layer** | **loudest band `hi`** | **loudest band `lowmid`** |

⚠️ **THE SEAGULL IS A CONSTRUCTION AND NOT A TIMBRE.** A struck plate falling 3520→2640 Hz over a
quarter-second, eight times in sixteen bars, is a gull by arithmetic — rare enough to read as an
event, long enough to read as a cry, and high enough that nothing in the place masks it. 0134 asked
for it in those words — *"really higher octave hits… rare and loud rather than frequent and quiet"* —
and got exactly what it specified. **The bell is the same shape an octave down**, which is why one
report covers both.

⚠️ **AND THE MIX THEN DROVE IT.** `perc` reaches gain 2.19 at `approach` in Ember Nebula against 0.90
in Rime Shelf, because [0164](0164-a-role-is-a-promise-the-mix-has-to-keep.md) solves it onto the
`pulse` role and bells are not a pulse. `REBASE` carries **7.567** here — the largest `perc` scale of
the seven places, against Rime's 1.086 — which is
[0140](0140-no-layer-is-inaudible.md)'s *a gain is not a loudness* running in the other direction:
**the solver made a bright layer loud because the arrangement asked a bell to be a drum.**

## ⚠️ Deleting percussion made the place less trebly

Which is only a paradox until you notice that of the four voices, one was below the organ.

| at `push` | before | after |
|---|---|---|
| under 300 Hz | 26.2% | **28.1%** |
| over 2 kHz | 27.9% | **23.5%** |
| spectral centre | 1636 Hz | **1499 Hz** |

That is the direction 0134's own report asked for — *"very high on the treble with no deep bassy
times"* — so the guard that decision left behind is further from red than it was.
[0147](0147-a-place-is-a-balance.md)'s absolute floor of 24% was never at risk in either direction,
and it was checked before a line was edited rather than after.

⚠️ **THE FRAME DRUM IS WHAT IS LEFT AND IT IS AUDIBLE.** With the glides gone `perc` leaves `hi`
for `lowmid L` and lands at −2.9 dB at `boss`, with `toll` 1.0 dB over it — a processional felt under
the organ rather than a part followed over it. **The alternative on the table was closing the layer
outright**, which measures fine on every guard and was rendered and listened to; it was refused by the
ear that has to live with the level, on [0027](0027-measure-the-picture-not-the-model.md)'s terms.

⚠️ **THE BREATH WENT BECAUSE IT WAS NEVER THERE.** `heardAt` returns the same ranking with and without
the sixteenth noise voice at every rung, every figure inside a tenth of a decibel — the layer's own
bake puts it at **air −70, thirty decibels under the three voices beside it**. 0140's floor cannot see
that: **that floor is per
LAYER and this is a voice inside one**, so a layer can clear it comfortably while a third of its
material is inaudible. Not generalised into a rule here — one instance is not a population, and
CLAUDE.md's *no counting guard* is the same argument one axis over.

## What it cost elsewhere, and neither was gone looking for

⚠️ **`nebula/boss/wraith` CAME OFF `STILL_ADRIFT`.** `wraith` is a `counter` in `himid R` and had been
beaten there by the bells; with them gone it clears 0164's floor, and `tests/themes.test.ts`'s second
assertion — the one that fails when a known-bad entry is fixed and not deleted — is what noticed. **A
layer removed for a report about a different layer freed a third one**, which is exactly the case that
assertion was written for: *"a known-bad list that only guards against additions is a list that stays
the same length forever."*

⚠️ **`scripts/weigh-rung.mjs` WAS PRINTING A RULE RETIRED TWICE.** Its footer said
*"tests/themes.test.ts refuses either percentage below 90"*;
[0182](0182-a-mix-number-has-no-band.md) deleted the pace ratio outright and
[0147](0147-a-place-is-a-balance.md) had already replaced the bottom ratio with an absolute floor. Six
of Ember Nebula's seven rungs read under 90% on that column today and every one is green. Fixed here
because **this decision used that instrument's output as evidence**, and
[0184](0184-the-measurement-reads-the-place.md) is the record of what an instrument stating a stale
rule costs.

## What was rejected

**Lowering `perc`'s mix rather than cutting the material.** It is one number and it fixes nothing: the
layer's loudest band stays `hi`, so a quieter seagull is a seagull further away. 0140's ordering —
*"too loud beats inaudible"* — is about which error to make when the material is right, and here the
material was the error.

**Re-voicing the plates lower instead of deleting them.** Rime Shelf already occupies that shape and
the report says it works there; a second place doing the same thing quieter is
[0147](0147-a-place-is-a-balance.md)'s sameness arriving through the material rather than through the
mix.

**No new guard.** Nothing here is an invariant — *which band a place's percussion sits in* is a
composition, and [0192](0192-a-guard-holds-an-invariant.md) asks for a change to the content that
would redden a candidate guard and be CORRECT. Every candidate had one.
