# The arrangement solves, and the places collapse

**2026-08-16.** What [0154](../docs/decisions/0154-the-mix-is-authored-as-intent.md) produces, run
over every place and every rung — including the one result that stops it being wired in.

## What was asked for

> *"Let's refactor the whole music rules and definitions in the repo because it's messy, complicated
> and causing rework and restrictions that I don't want."*

And the reason, from the same session:

> *"The reason music has taken so long is because of this problem, I keep asking for different things
> that already exist, but aren't hearable."*

## The mechanism works

`node scripts/weigh-solve.mjs`. Seven places, six rungs, every layer solved onto its role's target:

**Zero layers out of their role's spacing. The worst error anywhere is 0.00 dB.**

Ember Nebula at `push`, at the same summed level the ladder already produced:

| layer | role | gain | margin |
|---|---|---|---|
| **hook** | part | 1.63 → **2.89** | −4.8 → **+2.4** |
| call | counter | 1.29 → 2.18 | −8.0 → −2.6 |
| arp | counter | 1.66 → 2.25 | −5.0 → −2.6 |
| chords | counter | 2.00 → 1.33 | +2.1 → −2.6 |
| ride | pulse | 1.22 → 1.23 | −3.9 → −6.6 |
| sub | bed | 0.85 → 0.30 | −2.0 → −9.6 |
| drone | air | 0.44 → 0.49 | −17.8 → −13.6 |

The riff becomes the thing you follow. The hymn comes **up** 4.5 dB and the choir comes **down** 3.6
to meet it. The bed drops 9 dB and finally sits under both.

⚠️ **60 OF THE SOLVED GAINS ARE PAST `MIX_CEILING`**, which `mixOf` silently clamps to. Sixty mixes
the old rules could not express, and could not report refusing.

## ⚠️ The blocker: a global arrangement collapses the seven places together

Measured as [0147](../docs/decisions/0147-a-place-is-a-balance.md) measures it — the RMS difference
between two places' balances, at the closest pair:

| rung | shipped | solved |
|---|---|---|
| run | 3.3 dB | **2.5** |
| push | 4.0 dB | **1.7** |
| surge | 3.8 dB | **1.0** |
| approach | 4.0 dB | **0.9** |
| boss | 3.5 dB | **1.3** |

**0147 requires no two places within 3 dB. The solved mix fails at every rung**, and at `approach`
the closest pair is four times closer than it ships today.

⚠️ **THAT IS 0147's OWN DEFECT ARRIVING THROUGH ITS REPLACEMENT** — *"level 4, 5, 6 were pretty bland
and very similar to the other levels, it didn't feel like I'd travelled somewhere else in the
galaxy."* Two promotions per place cannot hold seven places apart when everything else is solved from
one table.

## Three ways out, none chosen

1. **More promotions per place.** Cheapest and least interesting: it walks back toward 0147's 259
   numbers one line at a time.
2. **Per-place target margins.** A place holds a wider or narrower spread between its roles — four
   numbers instead of thirty-seven, and a real character difference: a place whose parts sit close
   together is dense, one whose parts sit far apart is stark.
3. **Let places differ by MATERIAL rather than by balance.**
   [0148](../docs/decisions/0148-a-place-has-its-own-notes.md) already gave every place its own notes
   and its own mode. 0147's balance-differentiation was a workaround from when six places shared one
   composition, **and that has not been true for four decisions.** It is genuinely possible that
   balance should be global and 0147's 3 dB floor is now measuring the wrong thing.

⚠️ **THE THIRD IS THE INTERESTING ONE AND IT IS ALSO THE RISKIEST**, because it retires a guard rather
than satisfying it, and the report that guard was written for is the one nobody wants to receive
again. It wants an ear on the rendered files before anyone argues it on paper.

## What to listen to

`node scripts/hear-solved.mjs <place> --rung=<rung>` writes the shipped and solved mixes as **stereo**
files through the game's own bus — 0118's width is the axis the whole finding is about, and no
rendered file in this project had ever used it.

Rendered for this report:

| file | the layers that move most |
|---|---|
| `nebula-push-{shipped,solved}` | sub −9.1, hook +5.0, perc +4.9, engine −4.7, call +4.5 |
| `nebula-boss-{shipped,solved}` | ride −9.5, dread +6.9, drone +6.3, crash −4.5 |
| `core-surge-{shipped,solved}` | ride +10.7, hook +9.4, sub −7.4, engine −6.3 |

⚠️ **`core-surge` IS THE ONE TO DISTRUST.** Its movements are the largest anywhere — a 10.7 dB lift on
the ride and a 7.4 dB cut on the sub — and if the solve has made any place thin, that is where it
will be audible first.

## What is not done

**Nothing is wired into the game.** `MUSIC_LADDER` and `mixOf` are untouched and still decide every
gain the player hears; `npm test` is 1052 green because nothing the game runs has changed. The
arrangement is content the rig reads, the solve is two scripts, and the guards hold the table's
invariants — but the mixer has not been handed any of it, and should not be until the collapse above
has an answer and an ear has been on the files.
