# 0145 — The gun makes room

**Accepted 2026-08-13.** The single-lever change [0109](0109-a-death-is-a-drum.md) recorded as
**owed**, arriving with the verdict that authorises it.

> *"For both melodies we need to reduce the bullet/missile gain slightly and lift the gain on the
> other sounds."*

## The rule

**Neither auto-weapon may be as loud as any cue that marks something the player did or suffered.** The
pulse and the missile go to **0.24**; `kill`, `hit`, `shield`, `bomb`, `pickup`, `chime` and `threat`
come up about **1 dB**.

## ⚠️ The weapons were never louder per event — they are on almost all the time

Measured across the table, the pulse is **mid-rank by peak** (−10.4 dB, eighth of fourteen). What makes
it dominate is not level but **occupancy**: 0.064 s at up to fifteen a second, which 0109 measured as
sounding **96% of the time** at the weapon cap.

⚠️ **NOTHING IN THE TABLE MEASURED A CUE AGAINST ANOTHER CUE.** Every existing guard holds a cue against
the length ceiling, against the bed, or against the clip rails — so a sound that occupies the field
continuously and masks every event in it was green everywhere. What is held now is an **order**, not a
level.

⚠️ **`threat` IS DELIBERATELY OUTSIDE THE ORDER.** It is a telegraph — a thing about to happen — not an
outcome, and it is frequent for the same reason the gun is. Holding the gun under it would be asking a
warning to shout. It is lifted with the others and not used as a bound.

## What it measured, before and after

`node scripts/hear.mjs --play`, the music against the cues:

| take | before | after |
|---|---|---|
| a level opening, tier 0 | +12.5 dB | +12.6 |
| mid level, tier 2 | +8.8 | **+9.8** |
| the surge, maxed | +7.7 | **+9.0** |
| the boss arrives, maxed | +6.8 | **+7.7** |
| the boss at its peak, maxed | +6.9 | **+7.8** |

⚠️ **THE MOVE IS ~1 dB WHERE THE GUNS ARE FIRING AND ~0 AT TIER ZERO**, which is the shape of the ask
rather than a blanket cut: the weapons come down, the events come up, and at low tier the two cancel.
Peak also falls — 0.954 → 0.924 at the loudest take — so the change buys headroom rather than spending
it.

## What is NOT changed

⚠️ **The weapons still reach below the bed's fundamental**, which is the other half 0109 measured and
parked: the pulse falls to `inKey(-7)`, 27.5 Hz. **That is a pitch question and this was a gain
question**, and the report asked for the second. Changing both at once is what makes the next verdict
unattributable — 0109's own argument, still standing, and still owed.

⚠️ **The four loudest cues are untouched** — `bossDown`, `death`, `blast`, `bossShot`. They are events a
player can count on one hand per level; they were never what masked anything, and raising them is what
would have spent the headroom this change just bought.

## ⚠️ The magnitudes are a hand's guess and the direction is not

*"Slightly"* is the word in the report, and −1.9 dB on the weapons with +1 dB on the events is one
reading of it. The ORDER the guard holds is the durable half; the exact values are
[0092](0092-the-mix-is-a-hand-and-the-aura-was-a-curve.md)'s *a mix number is an ear*, and the
before-and-after table above is what a listener can say went too far.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). Nine gain literals in a table the game
synthesises at load. No storage key, no save field, no cache prefix.
