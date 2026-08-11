# 0123 — A rung changes the notes, and that is what makes it a section

**Accepted 2026-08-12.** The player ranked four section changes by how clearly they read, against the
build carrying [0117](0117-a-section-change-lands-on-the-beat.md) to
[0122](0122-the-kick-goes-under-the-music.md).

**It amends [0102](0102-the-music-goes-somewhere.md)'s monotonic density and
[0120](0120-a-rung-may-close-a-layer.md)'s layer count**, both of which turned out to be
[0090](0090-the-music-is-four-loops.md)'s additive rule wearing different clothes.

## The rules

**Every rung replaces at least a quarter of the notes still playing**, which is what a listener hears
as a section.

**No rung is thinner than the level's opening.** A floor, not a staircase — so a rung may strip back.

**The fight opens at its full arrangement.** The leitmotif arrives with the boss.

## The ranking is a measurement

| transition | notes changed, as a share of the bed | reported |
|---|---|---|
| `run` → `push` | **60%** | *"good, it's clear and easy to tell what's happening"* |
| `push` → `surge` | **13%** | *"far too subtle… only one change and it's soft and underneath"* |
| `surge` → `approach` | **2%** | *"isn't noticeable at all, but it does slowly build"* |
| `approach` → `boss` | **130%** | *"noticeable"* |

⚠️ **THE ORDERING IS EXACT.** Two were heard and two were not, and the boundary sits between 13% and
60%. A four-point ranking cannot say more than that, so the floor is 25% and it is stated in the unit
the ranking was given in.

⚠️ **AND *"only one change"* WAS LITERALLY TRUE.** At `surge`, `drive` arrived at −6.4 dB and `crash`
at −15.8 and `counter` at −20. The player heard `drive` and could not hear the other two.

⚠️ **`counter` WAS A GAIN THAT LIED.** [0114](0114-the-fight-is-a-different-piece.md) raised it to
1.05 saying it *"leads its own rung"* — but 1.05 is a **ladder multiplier**, and the layer's own note
gain was **0.088** against the bell's 0.3. The third time in this arc a ladder number has been
mistaken for loudness.

## Loudness does not predict it, and that is the finding

Measured on the summed, shaped bus — the one the player actually hears:

| transition | the arrival ADDS | reported |
|---|---|---|
| `run` → `push` | +0.60 dB | heard |
| `push` → `surge` | +0.09 dB | not heard |
| `surge` → `approach` | **+0.52 dB** | **not heard** |
| `approach` → `boss` | +0.22 dB | heard |

⚠️ **`approach` ADDED MORE THAN `surge` AND WAS NOTICED LESS.** What a listener hears as a section is
how much of the *material* changed. Two sustained layers arriving over a bed that keeps playing is
exactly *"not noticeable at all, but it does slowly build"* — **the player described the mechanism
before it was measured.**

⚠️ **THE FIRST VERSION OF THIS MEASUREMENT WAS WRONG AND WAS USED TO CHOOSE A GAIN.** It saturated
each layer alone; the bus saturates the sum, so every arrival was understated and doubling the bell
appeared to buy 0.8 dB. [0027](0027-measure-the-picture-not-the-model.md) inside the instrument for
the fourth time in this project's history, and it was caught because the number disagreed with the
arithmetic.

## What was in the way was a guard, again

⚠️ **`each rung strikes MORE NOTES A BAR than the one below` FORCES EVERY RUNG TO ADD.** So nothing
can ever be taken away — **0090's additive rule surviving one level down, in notes rather than in
layers.** 0120 removed it for layers and this reimposed it. 0120's own *"opens more than it closes"*
did the same thing a third time.

⚠️ **A STRIP-BACK BEFORE THE DROP IS WHAT THE GENRE THIS GAME NAMES ACTUALLY DOES**, and all three
rules made it illegal.

What the level does now:

| rung | churn | density vs `run` |
|---|---|---|
| `push` | 60% | 1.60× |
| `surge` | **37%** | 1.46× |
| `approach` | **30%** | **1.18×** |
| `boss` | 72% | 1.54× |

**Build, strip, drop.** `surge` takes the sixteenths away as the counter-melody arrives; `approach`
takes the riff and the bass line away and leaves a bell over a thinning bed; the boss slams back with
different material. Density never falls below the opening, so 0102's *"the music goes somewhere"* is
kept as the thing it always meant.

## The fight opens at the wall

> *"The boss music itself gets good around phase 3 of the boss — this is where the boss music should
> be starting."*

⚠️ **0114 HELD `wraith` BACK ON PURPOSE** — *"one that arrives when the boss is half dead is a
payoff."* The player has now heard that and asked for the payoff at the door.

⚠️ **AND THE FIGHT IS FAR TOO SHORT TO HOLD TWO RUNGS.** Measured: at max weapons on `savior` the
**whole fight is 4.6 seconds** on level one and 12.9 on level seven, and `bossPeak` opens at 78%
health — so 0114's *sparse arrival* lasted **one second**, against its own rule that a rung shorter
than a handful of `RAMP_SECONDS` is a wobble rather than a section. **Nothing guarded it**, because
that rule was written about a DISTANCE and the fight is a health fraction.

## What was NOT done, and it is the larger half

⚠️ **THE BOSS DYING TOO FAST IS REPORTED, MEASURED, AND NOT FIXED HERE.** At `savior`:

| | max weapons | no upgrades |
|---|---|---|
| `sentinel` | **4.6 s** | 32.0 s |
| `axis` | **12.9 s** | 89.6 s |

⚠️ **A HEALTH NUMBER CANNOT FIX BOTH ENDS, BECAUSE THE WEAPON LADDER IS A 6.9× SPREAD** — 7.5 dps
bare against 52.0 maxed. Trebling `sentinel` to make it an end-of-level boss at max weapons makes it a
96-second grind for a player who just died and lost their upgrades
([0085](0085-a-death-does-not-cost-the-bombs.md)). **That is a choice between two players and it is
the player's to make, not a number to pick quietly.** The measurement is here so it starts from one.

**The `savior` shot cadence is likewise untouched** — reported as *"a fraction too fast"*, and it
belongs with the health question rather than ahead of it.

## Confirmed, not assumed

| broken on purpose | went red |
|---|---|
| a rung that replaces almost nothing, which is what `surge` and `approach` were | `THE REPORTED ONE: every rung replaces a real share of what is playing` |
| the boss made a smaller change than a rung below it | `and the fight is the largest change in the piece, because it is the arrival` |
| the leitmotif held back to `bossPeak`, so the fight opens sparse | `AND THE FIGHT OPENS AT ITS FULL ARRANGEMENT, which is where the player said it gets good` |
| the level stripped back below its own opening on the way to the boss | `and each rung strikes MORE NOTES A BAR than the one below, which is what *pace* is` |

⚠️ **SEVEN PROBES WERE STRANDED BY THE LADDER ROWS CHANGING** and `prove` refused the run before
copying a tree. **They anchor on rows of twenty-three numbers**, which is the brittle-anchor
anti-pattern this session has now hit four times —
[0119](0119-off-stops-the-loops.md) and [0121](0121-a-wave-dies-together.md) each hit it once.
A row is a list that grows, and an anchor does not go in one.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). Gains, two closure lists and three
guards. No storage key, no save schema, no cache prefix, no origin.
