# 0356 — The tuned tier is Savior, and the outer tiers are a margin from it

**Accepted 2026-09-22.** PR 2 of [`the-tiers-planned`](../../reports/the-tiers-planned-2026-09-22.md).
**Supersedes [0047](0047-difficulty-is-a-tier-and-the-easy-one-is-the-content.md)'s *why the easiest
tier multiplies nothing*** and leaves the rest of 0047 standing, with a pointer in it. Builds on
[0355](0355-a-tier-opens-on-a-shell.md), which put the baseline where this needs it.

## The ask

> *"Legend difficulty should be playable by anyone and they should be able to have fun. Saviour
> difficulty should be the difficulty saviour is now and that's the optimised difficulty. Burn
> difficulty should be way harder than saviour by about the same margin that legend is easier than
> saviour. The difficulty plan needs to encompass future difficulty increases/changes as well so that
> I don't have to go through and rejig it with every change I make to saviour difficulty."*
>
> *"But we also need to make the bullets, enemies etc easier on legend on top of the shield changes."*

## The rule

**`SAVIOR` is the only multiplier row anyone edits.** `MARGIN` is one number per axis, and each tier
is Savior moved one margin per step it stands from Savior in `DIFFICULTY_KINDS`: Legend `÷`, Burn `×`,
`fireGap` the other way because it is a gap (`HARDER`). **A pin is a literal an outer tier states
instead of the derivation**, in `PINNED`, with the measurement beside it — the derivation is the
default and not a constant ([0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md)).
Lives, the shell and the corridor are per-row literals and ride no margin.

`Multipliers` is its own interface and `MultiplierAxis` is its keys, so a seventh axis without a
margin, a direction and a line in the derivation does not compile.

**The content is still authored at one and still the baseline** — `AUTHORED`, from 0355, which every
fixture and `--difficulty=authored` stands on. What 0047 protected survives: one baseline, and every
tier a stated departure from it. What changed is that the baseline is no longer a tier anybody plays.

| axis | Savior | margin | Legend | Burn | Burn before |
|---|---|---|---|---|---|
| `toughness` | 1.6 | 1.6 | **1** | 2.56 | 2.2 |
| `fireGap` | 0.78 | 1.4 | 1.092 | 0.5571 | 0.5 |
| `closing` | 1.2 | 1.25 | 0.96 | 1.5 | 1.4 |
| `shotSpeed` | 1.15 | 1.25 | 0.92 | 1.4375 | 1.3 |
| `aggression` | 1.3 | 1.5 | 0.8667 | **1.8, pinned** (1.95 derived) | 1.7 |
| `crowd` | 1.15 | 1.15 | **1** | **1.2, pinned** (1.3225 derived) | 1.2 |

Derived values are rounded to four places: Savior × margin is 2.5600000000000005 on Burn's
toughness, and `toughnessFor` rounds up.

## Rejected

- **Re-basing the content so that Savior is all ones.** Folding 1.6 into every authored health
  re-rounds every small body, and folding 0.78 into every cadence takes all of them off the grid
  [0096](0096-the-enemies-play-along.md) protects — `fireGapFor` exists so the one multiplier in the
  game is snapped once, at spawn.
- **One scalar margin for every axis.** Tidier, and it fails twice: under Savior's own 1.6, a
  `toughness` margin moves only bosses (`Math.ceil` leaves every one-to-three-health body where it
  is), and `crowd` has a measured ceiling on Burn.
- **The plan's `closing` margin of 1.3.** Refused by a play report rather than by taste:
  [0105](0105-a-body-is-on-screen-long-enough-to-answer.md) holds nothing on screen for less than
  1.8 s at the hardest tier, and 1.3 put Burn at 1.56, where the charger has 1.78 s. At 1.25 Burn is
  1.5. `tests/pilots.test.ts` said so on the first run.

## The two pins, and what each measured

**`crowd` at 1.2** carries its measurement over from 0047's row: 1.3 took room from ten fights of
fourteen, and 1.5 left the frost ship's opening with no answer for 2% of the phase.

**`aggression` at 1.8** is new, and it was found by running the plan's own instrument before trusting
the number. `scripts/weigh-boss.mjs --difficulty=burn`, every boss: volans with the arc **never died**
at the derived 1.95 — 2,094 adds called in ten minutes, standing between the arc and the boss. Swept
with everything else derived:

| Burn `aggression` | volans, arc, median |
|---|---|
| 1.7 (Burn before) | 132 s |
| 1.8 | 158 s |
| 1.87 | 307 s |
| 1.95 (derived) | never |

A cliff rather than a slope, which is [0260](0260-a-boss-is-fought-to-the-end.md)'s *a boss is fought
to the end* broken on one gun — so the pin sits short of it. Holding toughness at the old 2.2 did not
bring the fight back; holding closing did not either; aggression alone did. Legend keeps the whole
margin.

⚠️ **Medusa never dies to the shuriken on Burn, and that is not this decision's.** It never did at
the old Burn numbers either (and takes 590 s at Savior); it is filed as its own task.

## What the instruments say the outer tiers are

Measured with the pins in, ship parked and unhittable, missiles silenced, gun tier 4 — median seconds
to kill (`scripts/weigh-boss.mjs`) and hits a second on the parked ship (`scripts/weigh-threat.mjs`):

| boss, gun | Legend s | Savior s | Burn s | Savior hits/s | Burn hits/s |
|---|---|---|---|---|---|
| jormungandr, pulse | 80 | 130 | 209 | 0.24 | 0.35 |
| volans, arc | 40 | 69 | 158 | 0.14 | 0.14 |
| volans, shuriken | 10 | 16 | 25 | 0.25 | 0.20 |
| quetzal, pulse | 66 | 103 | 168 | 0.13 | 0.25 |
| gyre, pulse | 48 | 72 | 109 | 0.30 | 0.28 |
| hoarfrost, pulse | 91 | 146 | 232 | 1.03 | 1.28 |
| hydra, arc | 47 | 75 | 118 | 0.39 | 0.58 |
| medusa, arc | 59 | 103 | 174 | 0.07 | 0.23 |

**Legend's fights run about 0.6 of Savior's and Burn's about 1.6**, on every boss and gun of the
twenty-one. **Burn is more threatening than Savior on seventeen of them, level on one, and LESS on
three** — gyre with pulse and arc, volans with the shuriken — because a phase is a fraction of the
boss's health, so a tougher boss spends longer in its gentler opening phases and the average falls.
That is a property of what toughness does to a phased fight rather than of this margin, and it is
said here so a play that finds gyre's fight on Burn no worse than Savior's has its explanation.

⚠️ **The spit is faster than the ship on Burn, as it already was.** `SHOTS.spit` at 1.4 × 1.4375 is
about 2.0 against a ship at 1.7; at the old 1.3 it was 1.82, also faster. Whether a shot you cannot
outrun is unfair or learnable is the play's question.

## The guards, and that each was seen to fail

`tests/difficulty.test.ts`, four breaks in `scripts/probes/0356-*.mjs`, each red:

| broken on purpose | went red |
|---|---|
| Burn given a literal toughness that no pin states, so Savior no longer carries it | `on every axis not pinned, each tier is the one before it moved by one margin` |
| the tiers derived from Legend rather than from Savior | `the tuned tier is exactly SAVIOR` |
| a margin of one, so an axis stops separating the tiers | `every margin moves its axis, the harder way` |
| a pin ignored by the derivation | `and every pin is what the row says` |

The first is the rejig the ask forbids, written the way it would actually happen — a number typed onto
the outer row — and the neighbour guard is the one that catches it; the ordering guards stay green over
it, because 2.2 is still between 1.6 and anything above.

**Deleted, with this decision as the reason** ([0192](0192-a-guard-holds-an-invariant.md)): *"the
easiest tier is the content — multiplies nothing at all"*. **Re-pointed at `AUTHORED`:** *"leaves every
body it touches at the numbers its own row states"*, *"the baseline puts exactly the authored row on the
field"*, and the boss-escalation guard's base tier. **Re-anchored:** 0047's *easiest tier given a
multiplier* now breaks `AUTHORED`; 0270's *the middle tier sending less* now breaks the `crowd` margin,
because Legend is derived from Savior and lowering Savior lowers Legend with it; 0270's *easiest tier
scaling what arrives* now breaks `AUTHORED`.

⚠️ **AND THE FULL PROOF FOUND ONE STILL GREEN IN ANOTHER DECISION'S FILE, which only it could.**
0259's *the sentry reloading at 90 again* stopped reddening 0110's thirty-bullet guard, because that
guard reads the hardest tier's fire gap and Burn's derived 0.557 is gentler than the old 0.5 — at 90
the sentry now puts under thirty up. The rule did not move; the tier that binds it did. Measured
against the guard, 84 stays green and 78 puts 31 up, so the probe breaks at 78 now and says why.

⚠️ **No probe for *a seventh axis with no margin*.** That break fails `tsc`, and the proof harness runs
vitest, which strips types unchecked — a probe would report STILL GREEN over a real guard that lives
in `npm run check`.

## Owed

The three plays in the report, and then the margins move and nothing else. **If a play says Savior
itself is wrong, Savior's row moves and the outer tiers follow**; the neighbour guard is what proves
that still holds after each such edit. The pins do not follow, which is their cost and why each says
what it holds.

No rollback note: no storage key, save schema, cache prefix or origin is touched.
