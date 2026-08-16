# What the mix buries — every layer, every place, at its own best moment

**2026-08-16.** The audit `docs/decisions/0152-a-layer-is-heard-in-the-sum.md` was built to make
possible, run over all seven places so that nobody has to listen to all seven to find out.

> *"This issue definitely affects each and every single level track… The reason music has taken so
> long is because of this problem, I keep asking for different things that already exist, but aren't
> hearable."*

## How to read it

`node scripts/weigh-heard.mjs [place] [--rung=push]`. Every row is one layer at one rung:

- **out / peak** — dBFS, the only absolute numbers in the set. Both must be low before a layer is
  called quiet: RMS libels a transient.
- **down** — dB under the loudest layer sounding at that rung.
- **margin** — dB over everything else, in the best band it lives in, on the ear that favours it.
  **A ranking, not a verdict** — 0152 has the argument for why it carries no threshold.
- **under** — the single loudest thing in that window, which is the one a hand can argue with.

Below, each layer is shown at its **own best moment** in that place — the widest window it ever gets.
A layer that is buried *here* has nowhere in that place where it is the clearest thing in its band.

## ⚠️ The twenty worst

| place | layer | peak dBFS | margin | under |
|---|---|---|---|---|
| mire | **arp** | −32.5 | **−18.7** | chords +15.2 |
| rime | **arp** | −26.1 | **−17.5** | call +15.6 |
| rime | drone | −30.6 | −17.4 | auraFast +14.1 |
| nebula | drone | −23.7 | −16.6 | sub +12.0 |
| labyrinth | drone | −29.1 | −15.9 | sub +13.0 |
| mire | drone | −22.7 | −15.2 | sub +13.1 |
| saurian | drone | −27.0 | −14.1 | chords +10.8 |
| core | drone | −23.5 | −13.3 | sub +10.6 |
| core | **arp** | −23.6 | **−12.7** | lead +9.4 |
| approach | **hook** | −16.7 | **−12.6** | chords +6.8 |
| labyrinth | groove | −23.1 | −12.4 | sub +9.6 |
| labyrinth | wraith | −23.1 | −11.6 | toll +10.1 |
| approach | call | −24.3 | −11.1 | chords +8.3 |
| approach | drone | −23.6 | −10.8 | engine +6.3 |
| core | **hook** | −19.8 | **−10.5** | lead +9.1 |
| rime | frenzy | −25.7 | −10.3 | auraFast +7.3 |
| rime | dread | −21.7 | −9.9 | sub +8.0 |
| labyrinth | crash | −20.3 | −9.8 | toll +8.5 |
| rime | stomp | −20.0 | −9.8 | sub +7.5 |
| saurian | wraith | −21.7 | −9.7 | toll +4.8 |

⚠️ **`drone` appearing six times is not a defect** — it is connective tissue and is meant to be felt
rather than picked out. Every other row is a **part**: a riff, a tune, a counter-line, a cymbal.

## ⚠️ The finding: three layers are on top of everything, and they are the bed

Counted over every place-and-layer whose best window is still buried, the layer sitting on top:

| masker | times |
|---|---|
| **sub** | **21** |
| **chords** | **15** |
| **engine** | **14** |
| lead | 10 |
| toll | 9 |
| auraFast | 6 |
| crash | 6 |
| everything else | ≤ 4 each |

⚠️ **`docs/decisions/0147-a-place-is-a-balance.md` FOUND THIS AND COULD NOT SEE IT.** Its own comment
says: *"the loud part of every place was a sub, a kick, a bass and a pad, and those are the same four
sounds in all seven."* It then measured **balance** — each layer against its own place's loudest, in
mono, broadband — and rebalanced all seven against that. **A ratio cannot see masking**, so the four
sounds stayed exactly where they were and every guard went green.

## ⚠️ `arp` is the worst layer in the game, and it is not quiet

Handed the soloed file, rendered through the game's own bus at the mixer's own gain:

> *"solo-arp sounds great, but what I hear from the dashboard is solo-chords with a few other effects
> and no arp at all."*

Measured at Ember Nebula's `push`, the one rung that opens it:

| | rms dBFS | peak dBFS |
|---|---|---|
| chords | −23.3 | −9.3 |
| **arp** | **−37.1** | **−23.1** |

**13.8 dB under, on both measures, in overlapping registers.** And `arp` is the only layer in the
game that sounds at **one rung** — `MUSIC_LADDER` gives it 0.64 at `push` and zero at `run`, `surge`,
`approach`, `boss` and `bossPeak`, with `RUNG_CLOSES.surge` shutting it. Masked during its only
appearance is never heard at all, in any level, ever.

⚠️ **THAT IS WHY NO REPORT EVER NAMED IT.** 0140 says a layer that is too loud is a complaint anybody
can make after one listen, and an inaudible one produces **no report at all**. `arp` has been
authored, re-voiced in six places, and argued over in four decisions.

## What is fixed here, and what is not

**Fixed:** `ride`, in all six places that re-voice it — the envelope, not the gain. See 0152 and the
commit *The ride was never 25 milliseconds long*.

**Fixed:** the rig itself. `--solo` rendered the base composition at the ladder's gain, with no place
and no `mixOf` — so for six of the seven places it wrote the wrong material at a gain 8 dB under what
the dashboard fader beside it was reporting.

**Not fixed, and deliberately:** `arp`, `hook`, and the bed that is on top of them. Every available
lever is a number inside the rule set the player has asked to have refactored, and tuning under rules
that are about to change is the rework this whole report is about.
