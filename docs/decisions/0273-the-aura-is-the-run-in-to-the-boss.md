# 0273 — The aura is the run-in to the boss

**Accepted 2026-09-07**, from a play session that finally identified it by ear:

> *"There's a weird sort of sound in the run that happens once every 1-2 secs and it sounds like a
> really light tapping, only very faintly audible and almost sounds like a bad audio artifact."*
>
> *"Embers and furnace roar? I haven't heard those ever at all… it definitely needs to be held back
> till the approach or first boss part of the sound either way, it doesn't fit and completely
> detracts from the rest of the level music."*

**Amends [0107](0107-a-level-is-a-place.md)** and reverses the placement it set.

## The rule

**`AURA_ONSET_UNITS` becomes `AURA_BUILD_UNITS`, and it counts back from the boss.** The build runs
over the last 720 units of a level — `bossAt - AURA_BUILD_UNITS` — instead of from a fixed 720 after
the opening. Same number, same twenty seconds, same *distance and not a timer*; the other end.

## ⚠️ It reverses an explicit earlier ask, by the same ear

720 was set from *"start about 15-30secs into the start of a level"*, and `tests/music.test.ts` held
exactly that: **silent at fifteen seconds, started by thirty**. It was delivered literally.

**What settles the reversal is that nobody had heard it when they asked for it.** Two measurements,
taken the evening the layer was finally named:

| where | what the aura was doing |
|---|---|
| twenty seconds in, mid-`run` | `auraFast` at **0.017** |
| at the fight | `auraSlow` **14.5 dB under the loudest** of thirteen layers |

**Audible where it means nothing, buried where it means everything.** At 0.017 what reaches the
player is Ember Nebula's ember crackle — sample-and-hold noise, *"the one thing here that is not
smooth"* by its own comment — with none of the furnace under it, over music the aura is deliberately
unrelated to: the aura loops are two bars and *"say nothing about the progression"*. A texture with
no context is exactly what gets reported as a bad audio artifact, and was.

## ⚠️ The guard changed with the reason, and it was rewritten to be about the sound

[0192](0192-a-guard-holds-an-invariant.md) — a red guard is answered by fixing the defect, changing
the guard and saying why, or deleting it, never by making it green. This is the second: the guard now
holds *silent thirty seconds in, silent halfway to the boss, silent thirty seconds out from it, and
building ten seconds out*.

**The old comment's own lesson survives the reversal.** It recorded that an earlier draft had asserted
silence at `AURA_ONSET_UNITS - 1`, which moves with the constant and left the suite green when a probe
set the onset to zero — [0027](0027-measure-the-picture-not-the-model.md)'s *a guard measuring a
quantity defined in terms of the constant it guards proves only that the code agrees with itself*.
The new assertions are at 1080 and 360 units out from the boss — thirty and ten seconds — and neither
is derived from 720.

## What this costs, named

**A longer level no longer spends longer building.** 0107's comment argued for that property
explicitly: *"a level authored longer therefore spends longer building, which is the behaviour a fixed
timer would not have."* That is gone; every level now builds over the same final twenty seconds.

The counter-argument is that this is the **boss's** aura — [0091](0091-the-boss-has-an-aura.md) — so
the boss is the honest thing to measure it from, and the level's length was never what it was about.
On every level in the game the build now opens within a few seconds of the `approach` section.

## What is still owed

**The other half of the report is not fixed.** `auraSlow` is still 14.5 dB under the loudest layer at
the fight, so the furnace is still buried where it is supposed to pay off. A ×1.7 lift of the aura's
two rows at `boss` and `bossPeak` was tried and **clips** — two headroom guards refuse it, and
[0192](0192-a-guard-holds-an-invariant.md) says the work changes rather than the guard. Making the
aura audible at the fight is a headroom problem and wants its own pass, measured rather than guessed.
