# 0152 — A layer is heard in the sum, and every measurement here soloed it

**Accepted 2026-08-16.** [0140](0140-no-layer-is-inaudible.md) measured what a mix number *produces*
and found one layer nobody could hear. This measures what a layer has left **after the other twelve**,
and finds that the question 0140 answered was never the one a listener was asking.

> *"I'm not hearing ride, hook or lead at all here when playing the entire sequence."* — and, on being
> shown that `lead` measured as the clearest layer in the place: *"you were right, lead I can hear
> clearly, it's arp that I've never heard in game."*

## The rules

**A layer's audibility is measured in the mix that plays, not in isolation.**
`scripts/weigh-heard.mjs` prints it; `tests/pace.ts` owns the arithmetic as `heardAt`, on
[0029](0029-the-tracked-record-is-the-record.md)'s terms and `weigh-audition`'s.

**`bandEnergy` answers ratios within one signal and may not be used to compare two.**
`tests/spectrum.ts` now carries `bandLevels` beside it for the second question, and says which is for
which.

**A threshold is set only where the measured spread has a hole for it.** `down` has one and carries a
flag the rung computes for itself; `margin` does not and carries none.

## ⚠️ The finding: every audio measurement in this repository is of a soloed layer

`layerLevels` — the whole of 0140, and the basis of `weigh-audition`, `weigh-apart` and
[0147](0147-a-place-is-a-balance.md)'s balances — takes each layer to the loudest gain **any** rung
gives it and compares it to another layer at **its** loudest. Three things follow, and all three were
invisible:

- **It describes an arrangement no rung plays.** `hook` peaks at `surge` and `chords` at `push`; the
  ratio between those two numbers is not a moment in the music.
- **It is broadband.** A layer buried in the one band it occupies scores on the energy it has
  everywhere else.
- **It is MONO.** [0118](0118-the-mix-has-a-width.md) added `LAYER_PAN` expressly to stop layers
  masking each other, and **no number this repository has ever printed reads it.**

⚠️ **AND MASKING IS WHAT *I CANNOT HEAR IT* MEANS ONCE A GAIN IS RULED OUT.** 0118 said so in as many
words — *"two sounds in the same frequency band had nothing to separate them but level, which is why
the answer has been a gain six times running"* — and then shipped a width nothing could measure. This
is the quantity those six passes were tuning blind, and the seventh would have been too.

## ⚠️ The measurement disagreed with the ear, and the measurement was wrong

The first `heardAt` was built on `bandEnergy` and put Ember Nebula's `ride` at the **top** of the
ranking — the layer the report that produced this function names as absent, called the most audible
thing in the place.

`bandEnergy` samples six frequencies per band and multiplies by the bandwidth. That is a **density**
estimate: correct for a signal spread across the band, and wrong by the width of the band for one that
is not. Driven on equal-power tone against equal-power noise, in the band they share:

| band | `bandEnergy` | `bandLevels` |
|---|---|---|
| lowmid | −18.4 dB | 2.1 dB |
| mid | −24.2 dB | 2.0 dB |
| himid | −33.3 dB | 2.0 dB |
| hi | −40.2 dB | 1.9 dB |
| **air** | **−36.9 dB** | **1.8 dB** |

`ride` is a noise burst in `air`, the widest band there is. **The estimator was not measuring the
mix, it was measuring how noise-like each layer is** — and the error varies by 24 dB across the
bands, so it reorders. `bandLevels` is two cascaded biquads and an RMS; its residual is a constant
1.8–2.2 dB that cancels in every comparison.

⚠️ **`bandEnergy` IS NOT CHANGED.** Six guards stand on it and every one asks for a ratio within one
signal — `spectrum` divides by the signal's own loudest band, `rungShape` takes `low / total`. The
bias is in the numerator and the denominator alike and it cancels. Two functions is the honest
outcome, not a fix to one.

⚠️ **AND IT WAS CAUGHT ONLY BECAUSE THE EAR HAD ALREADY SPOKEN**, which is
[0027](0027-measure-the-picture-not-the-model.md) exactly: a play verdict is data about the picture,
and the model that contradicts it is the thing under suspicion. Had this been built before the
report it would have been shipped, believed, and tuned against.

## ⚠️ There is no threshold on `margin`, and refusing to set one is the decision

The first version flagged every layer under 0 dB and flagged **eleven of thirteen** at `push`. In a
mix of thirteen almost nothing outranks the power sum of the other twelve, so the line separated
nothing. Ranked, the spread at that rung is a continuum with no gap anywhere:

> −22.5, −17.8, −11.0, −10.7, −9.5, −8.0, −7.9, −7.7, −5.0, −4.8, −2.0, +2.1, +3.7

⚠️ **THAT IS WHAT CLAUDE.md's *no counting guard* REFUSES**, and what 0140 required of
`AUDIBLE_FLOOR_DB` before setting it: a number is defensible only where the data has a hole for it.
`down` has one — `ride` at −31.9 against a next-worst of −25.3, and at `approach` −29.7 against −19.9
— so the flag is **computed from the rung** rather than typed in, and a rung whose layers are a
continuum flags nothing. Across seven places × seven rungs it fires on exactly one layer, eleven
times: always `ride`.

## ⚠️ What it says about Ember Nebula at `push`

```
layer          gain     down    margin   window      under
perc           0.34   -18.2    -11.0   hi L      lead +8.8
ride           1.22   -31.9    -10.7   air R     hook +7.7
arp            1.66    -9.6     -5.0   hi L      lead +3.6
hook           1.63    -6.1     -4.8   himid R   lead +2.8
chords         2.00     0.0      2.1   mid R     lead -4.4
lead           0.98    -1.9      3.7   hi R      hook -5.1
```

**Three layers, three different defects, and none of them is the one that was reported.**

- **`ride` is not masked, it is absent** — 31.9 dB down, where the next quietest layer is 25.3. The
  material is a 25 ms tick where the base composition has a 260 ms wash and a bell; 0140 answered
  *"the ride needs to be 2-3× as loud"* by multiplying the tick, one line after writing that a tick
  *"puts out almost nothing, wherever it is mixed."*
- **`hook` is not quiet, it has nowhere to sit** — `down` −6.1 is healthy and mid-pack. It is sharing
  the right-hand side with `chords`, the loudest layer in the place.
- **`arp` sounds at ONE RUNG IN THE WHOLE GAME.** `MUSIC_LADDER` gives it 0.64 at `push` and zero at
  `run`, `surge`, `approach`, `boss` and `bossPeak`; `RUNG_CLOSES.surge` shuts it. Masked during its
  only appearance is **never heard at all**, which is what the player said and what no measurement
  could have found: 0140 asks whether a layer is audible *somewhere*, and `arp` has only one
  somewhere.

⚠️ **`lead` IS THE MASKER IN FOUR OF THE SIX WINDOWS ABOVE**, and the player hears it clearly. That is
the shape of the whole finding: the layers that cannot be heard are not the quiet ones, they are the
ones standing behind a layer that is doing fine.
