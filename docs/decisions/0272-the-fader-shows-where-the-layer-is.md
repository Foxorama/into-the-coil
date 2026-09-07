# 0272 — The fader shows where the layer is

**Accepted 2026-09-07**, from a mix session that stopped being possible:

> *"I haven't copied it because the gain controls are really hard on the dashboard, they're all set
> to super min levels so any kind of tweak is a massive adjustment."*

**Amends [0129](0129-the-desk-holds-a-value-not-a-multiplier.md)**, which made the fader an absolute
gain, and completes the ceiling repair recorded on `DESK_CEILING` in `rig/transport.ts`, which fixed
what the fader could *reach* and never asked where anything *landed*.

## The rule

**A fader that is following the mixer sits where the mixer has the layer**, so taking one over
changes nothing until you move it. **The travel is 60 dB**, in notches of a tenth of one, with
silence at the bottom notch and `DESK_CEILING` exactly at the top.

## ⚠️ It was two defects wearing one sentence, and only one of them was the taper

**Every fader read zero because a following fader was never written to.** `syncSliders` sets a
position only for a layer that is already *held*; a layer following the mixer kept the `value="0"` it
was built with. So the first touch of any fader dropped its layer from whatever it was playing to
silence, and the drag back up was the *"massive adjustment"*. That is the half of the report that
looks like a taper problem and is not one.

**The other half is that the travel was linear over a ceiling set by one outlier.** `LOUDEST_SHIPPED`
is 4.87 and the ceiling is twice it, so 9.75 — and 531 non-zero targets sampled across the seven
levels run:

| | gain | on the linear fader | on the dB fader |
|---|---|---|---|
| min | 0.04 | 0.4% | 18.5% |
| p25 | 0.29 | 3.0% | 49.2% |
| **median** | **0.52** | **5.4%** | **57.7%** |
| p75 | 1.03 | 10.6% | 67.5% |
| p95 | 1.99 | 20.5% | 77.0% |
| max | 4.87 | 50.0% | 90.0% |

**The median layer-rung sat at 5.4% of the slider and 95% of them inside the bottom fifth.** One loud
layer set the scale for all twenty-three.

## ⚠️ Decibels, because *twice as loud* has to be one distance

A linear fader makes the same musical move a different size depending on where the layer already is.
On this one a 1 dB move is **1.67% of the travel anywhere on it**, which is the property a desk has
always had and the reason a real one is not linear either. `DESK_CEILING` keeps everything it was
derived for: it is still the top notch exactly, so a fader can still ask *what if this were twice as
loud* — [0129](0129-the-desk-holds-a-value-not-a-multiplier.md)'s absolute value is unchanged in
meaning, only in how it is reached.

**60 dB and not 100, because the bottom of a fader is for silence rather than for detail.** A layer
60 dB under the loudest thing the game plays is inaudible under any of the rest of it, so travel
spent below that buys resolution nobody can hear at the cost of resolution everybody uses.

## ⚠️ What this is really about

[0126](0126-the-dashboard-is-the-instrument.md) built the desk so a mix question could be answered by
ear instead of by rendering a file. [0130](0130-a-layer-can-be-heard-on-its-own.md) and
[0165](0165-the-desk-sounds-what-you-raise.md) each removed a gesture standing between wanting to
hear something and hearing it. **This is the same failure one layer down: the control was there, it
was reachable, and it could not be operated.** An instrument that cannot be driven is
[0027](0027-measure-the-picture-not-the-model.md)'s model in another costume — everything about it
measured correct while the thing a person actually does with it did not work.

The session that reported it went on to retune three layers of The Approach by ear in an hour.

## What is not here

**No guard.** The round trip `gainAt(faderAt(g))` is exact to half a notch and both ends are exact by
construction, but the claim worth holding — *the median layer lands in the usable middle of the
travel* — is a statement about a distribution that every mix change moves, and
[0192](0192-a-guard-holds-an-invariant.md) says name the change that would redden it and be correct.
There are many: any pass that quiets the loudest layer-rung moves the ceiling and every percentage in
the table above. That makes it a reading, not an invariant, and the numbers live here instead.
