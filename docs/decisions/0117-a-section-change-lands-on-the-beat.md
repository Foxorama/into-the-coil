# 0117 — A section change lands on a downbeat, and not one ever has

**Accepted 2026-08-11.** The fix for what
[0116](0116-the-rig-plays-the-level.md) measured and deliberately left.

**It supersedes nothing and changes no number.** Every gain, every rung and every distance is exactly
what it was. What moves is **when** a change is heard.

## The rules

**A rung change ramps from the next bar line, on the loops' own clock.** `anchorAudio` is position
zero of every layer, so the grid moves with a rephase ([0094](0094-in-time-is-not-in-phase.md)) rather
than against it.

**The aura is not quantised.** It tracks a gap the player steers ([0091](0091-the-boss-has-an-aura.md)),
and a dread that waited for the downbeat would report where they were.

**A layer whose destination has not moved is not written.** `setLevel` runs every frame; rewriting a
ramp in progress stalls it until the next bar.

**What to write, when, and whether at all is one exported function.** `levelWrites`, because a guard
cannot reach a loop inside a closure over an `AudioContext`.

## What was wrong, in one argument

```
gains[layer].gain.setTargetAtTime(target, ctx.currentTime, RAMP_SECONDS / 3);
```

The ramp began at the instant a frame noticed the camera had crossed a distance. 0116 measured where
that lands: **twenty-seven of the game's twenty-eight rung changes are mid-bar**, and the exception is
an accident of `bossAt: 4320` dividing evenly. `bossPeak` is keyed to boss health
([0113](0113-there-is-one-composition-and-seven-levels.md)), so it cannot land on a bar except by
coincidence.

⚠️ **A CHANGE HEARD AWAY FROM THE BEAT IS NOT HEARD AS A CHANGE.** It reads as the mix wobbling —
which is [0114](0114-the-fight-is-a-different-piece.md)'s *"there is only a very subtle difference in
the sound between push and surge"*, **reported twice and answered twice by raising something.** 0114
said in as many words that the next attempt must not be another gain. This is the first one that is
not.

Measured through `hear.mjs --level=approach`, before and after:

| rung | the game decides | beat | the music moves | beat |
|---|---|---|---|---|
| `push` | 42.00s | 1.00 | **43.20s** | **0.00** |
| `surge` | 92.00s | 2.00 | **92.80s** | **0.00** |
| `approach` | 108.06s | 2.16 | **108.80s** | **0.00** |
| `boss` | 118.63s | 0.56 | **120.00s** | **0.00** |
| `bossPeak` | 128.52s | 1.29 | **129.60s** | **0.00** |

**5 of 5 boundaries still fall mid-bar where the camera puts them; 0 of 5 are heard there.**

## The two things it would have been easy to get wrong

⚠️ **QUANTISING THE AURA TOO.** It is one fewer special case and it looks like consistency. It is the
defect applied to the one layer that must not have it: the aura is a distance the player is flying,
and its ramp is already a quarter of a level change's for that reason.

⚠️ **REWRITING EVERY LAYER EVERY FRAME, WHICH MAKES THE FIX WORSE THAN THE DEFECT.** `setTargetAtTime`
holds its value until its start time. Re-issuing a ramp that is halfway through pins it at the value
it has reached until the *next* bar, then resumes — so a smooth build becomes **a staircase in
bar-sized steps**, and every guard about the ladder stays green because every target is correct. The
write-only-on-change gate is correctness, not a saving.

## What a coincidence became

⚠️ **`RAMP_SECONDS` IS 1.6 AND A BAR IS 1.6.** That was luck until today and is load-bearing now:
`setTargetAtTime` is within 5% after three time constants and the tau is a third of the ramp, so a
change that starts on a downbeat **has arrived by the next one**. A ramp longer than its bar would
still be moving when the following bar landed. `tests/music.test.ts` holds the relation rather than
either number.

## The instrument had to be fixed in the same breath

⚠️ **THE RIG MODELLED THE RAMP ITSELF, SO IT WOULD HAVE GONE ON DRAWING THE OLD BEHAVIOUR** — the
third drift of the kind [0116](0116-the-rig-plays-the-level.md) is named for, inside the decision that
named it. `scripts/hear.mjs` asks `levelWrites` now.

⚠️ **AND THE PRINTED TABLE WOULD HAVE LIED ABOUT THE FIX.** It reported where the *rung* turns over,
which is still mid-bar twenty-seven times out of twenty-eight and always will be — the camera crosses
a distance wherever it likes. **Two columns now**, because *where the game decides* and *where the
player hears it* are two different claims and only the second was ever the defect.

## What was rejected

**Quantising to the phrase.** Musically the strongest boundary, and 25.6 seconds long — it would eat
two and a half of `approach`'s 10.6. **Four bars** is 6.4s and eats 60% of the same rung. A bar costs
at most 1.6s, which is 15% of the shortest rung and about 58 world units.

**Moving `PUSH_UNITS` and `SURGE_UNITS` to land on bars.** It would make the boundaries land on the
beat for one level and one scroll rate, and silently stop the day either moved — the class of fix that
agrees with itself. It is also the wrong shape: a section boundary wants to be a musical position, and
those are distances. **That tension is real and belongs to the transport**, not here.

**Shortening `RAMP_SECONDS` so the change is a cut.** Untested by ear, and 0114 has the standing
warning about reaching for a number. The bar line may be the whole of it; if it is not, the next
attempt has an instrument to be judged against.

## Confirmed, not assumed

| broken on purpose | went red |
|---|---|
| the ramp started when the frame noticed rather than on the next downbeat, which is what it always did | `THE REPORTED ONE: every layer that carries the arrangement moves on a bar line` |
| the aura quantised too, so the dread reports where the player was rather than where they are | `AND THE AURA IS NOT QUANTISED, because it is tracking something the player steers` |
| every layer rewritten every frame, so a ramp in progress is stalled at each bar line | `THE STAIR-STEP: a layer whose destination has not moved is not rewritten` |
| the bar grid measured from the context clock rather than from the loops’ own anchor | `THE GRID: the next bar is on the music’s own clock, never on the wall` |

⚠️ **A FIFTH PROBE WAS STRANDED BY THIS WORK AND `prove` REFUSED THE WHOLE RUN BEFORE COPYING A
TREE.** 0116's ramp-constant probe anchored on `hear.mjs`'s import block, and this decision added one
name to it. That is [0019](0019-a-probe-must-be-seen-to-apply.md) working, and a lesson about where an
anchor goes: **not in a list that grows.** It is anchored on `busOf` now.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). No storage key, no save schema, no
cache prefix, no origin. It changes the timing of a gain ramp and nothing else; a player on the old
build and a player on the new one hear the same arrangement in the same order.
