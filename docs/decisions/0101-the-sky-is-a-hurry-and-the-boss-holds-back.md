# 0101 — The sky is a hurry, and the boss holds back

**Accepted 2026-08-10.** Items 1 and 2 of
[the-sixth-play-test](../../reports/the-sixth-play-test-2026-08-10.md).

**Fourth pass over the sky's speed; first over where a boss stands.** Both are the same shape: a
number sized against a screen that has since changed, and a bound that only ever pushed one way.

## The rules

**A mark may move at the world's rate, less half of how much of a bullet it looks like.** That
replaces *only a streak may pass two thirds* — the ceiling is about a mark's SIZE, not its shape.

**A boss leaves the player more than half the screen at the NEAR end of its swing.** Held on
`station − drift − radius`, which is the quantity the player judges.

## What was asked for

> *"OK well, the sky moves a bit faster, but it still needs to move much more faster."*

> *"The bosses come too far into the screen, they come into 50% and then basically float at that level
> and it doesn't give the player enough space to respond."*

## The sky: depth ran out of ceiling, and length has none

⚠️ **Every previous answer to this report moved a depth**, and depth stops at 1: at 1 the sky moves
exactly with the world and is not a background ([0065](0065-the-sky-is-baked-and-blitted.md)). The
streak layer was already at 0.92 of that.

⚠️ **A LONGER STREAK READS AS FASTER AT THE SAME RATE.** It is the smear a fast thing leaves, so more
of it is more speed — which is why every game that wants to look quick draws them long rather than
merely draws them fast. **6–13 units → 11–24**, and it is the only lever in this decision with no
ceiling over it.

⚠️ **Paid for in count**, because nearly twice the length is nearly twice the ink per mark: fifteen
marks became **twelve**. Fewer and longer is what fast looks like; more and longer is a curtain, and
that is a probe.

## And the two dot layers move for the first time since 0088

⚠️ **0097 answered a report about the fast layer being INVISIBLE and left the dots alone, correctly.**
This report is about the ones it left. With the near layer visible again the dots are most of what the
player is watching, and they were still at the rates 0088 set.

⚠️ **× 11/8 on both, so 0078's ratio survives a fourth time.** `4/3 × 3/2 × 11/8 = 2.75` against what
0065 shipped, and `tests/budget.test.ts` holds the product rather than the total for the third time.

| | depth | crosses the narrowest view in |
|---|---|---|
| `skyFar` | 0.24 → **0.33** | 20.6s → **15.0s** |
| `skyNear` | 0.6 → **0.825** | 8.2s → **6.0s** |
| `skyRush` | 0.85 → **0.92** | 5.8s → **5.4s**, at nearly twice the length |

## The ceiling is re-derived rather than relaxed

⚠️ **0097 held *whichever layers are above two thirds are exactly the streak layers*, which is an
exception list wearing a rule's clothes** — and the next report was *"much more faster"* about the two
layers the exception excluded.

⚠️ **The honest rule underneath was always about SIZE.** [0069](0069-the-sky-is-behind-the-game.md)'s
subject is a background dot the size of a bullet moving fast enough to be mistaken for one. A dot a
third of that size is not that thing, whatever its shape. So:

**`depth < 1 − (thickness ÷ smallest bullet) × 0.5`**

At two thirds of a bullet the ceiling is two thirds — 0069's number arriving as a consequence rather
than as a constant. At an eighth of a bullet it is 0.94. It cannot reach 1, because a mark of no size
is not a mark, and 0065's absolute is still asserted separately.

## The bosses: the report is measuring the near end of the swing

⚠️ **`station − drift − radius` is the closest a hull's trailing edge ever comes, and five of the
seven were inside half the screen:**

| | trailing edge | of the 177.8-unit view |
|---|---|---|
| axis | 65 | **37%** |
| harrow | 67.5 | **38%** |
| shoalMother | 79 | 44% |
| redoubt | 83 | 47% |
| chorus | 87.5 | 49% |
| sentinel | 95 | 53% |
| lattice | 95.5 | 54% |

⚠️ **Every station was sized against a narrowest view of 150 units and
[0080](0080-the-box-is-the-screen-and-the-screen-is-16-9.md) made it 177.8.** Not one moved. A number
that meant *as far forward as the hull can go* came to mean *the middle of the screen*.

⚠️ **`tests/level.test.ts` said so, in as many words, for two months**: *"every boss has 28 more units
of room it did not have."* It was written into the guard that loosened the FORWARD bound and nothing
ever spent it — because nothing held the near end at all except *do not land on the ship's start*.

⚠️ **So the floor is the guard, at 55% rather than 50%.** The report names the number it observed, and
a floor exactly at the complaint permits the complaint. The seven now sit between 58% and 67%.

⚠️ **They have converged to a fifteen-unit band, and that is the screen rather than a preference.**
With a floor at 55% and the leading edge still on the narrowest screen, that is all the room there is.
What makes a boss unique is its drift, its wavelength, its patrol, its hull, its phases and — since
[0098](0098-a-wave-plays-a-figure.md) — its bullet. It was never the station.

## AND MOVING THE BOSSES BROKE THE MUSIC, WHICH IS 0092's GUARD EARNING ITSELF

⚠️ **[0092](0092-the-mix-is-a-hand-and-the-aura-was-a-curve.md) wrote its two aura guards off `BOSSES`
and the player's box, and said why**: *"neither can be satisfied by moving `AURA_FAR_UNITS` to meet
it."* Pushing every station twenty units forward moves the player's **defensive** position twenty
units further from the boss — and that position is exactly what the second guard measures. At the old
range the aura at the back of the box fell to **0.049** of its ceiling, which is the defect 0092 is
named for, arriving from a change about screen space.

⚠️ **And the two bounds became mutually unsatisfiable, which took solving rather than nudging.** The
midpoint bound needs an exponent above 1.32; the back-of-the-box bound needed one below 1.22. There is
no such number at a span of 106 — the span itself had to grow.

| | at half the range | at the back of the box |
|---|---|---|
| `FAR` 124, curve 1.6 — shipped | 0.330 | **0.049** |
| `FAR` 132, any exponent | 0.33–0.39 | **0.049–0.078** |
| **`FAR` 145, curve 1.5** | **0.354** | **0.120** |

⚠️ **So *silent* is now somewhere the player cannot reach, and that is 0092's own fix taken one step
further.** 0092 raised `FAR` because the top fifth of the reachable span was silent and *"a boundary
the player cannot feel"* is not a boundary. At 145 the aura is at 0.041 of its ceiling at the furthest
the player can get — present, nearly gone, never off.

## Confirmed, not assumed

Per [0005](0005-a-guard-must-be-seen-to-fail.md) and [0019](0019-a-probe-must-be-seen-to-apply.md),
declared in `scripts/probes/0101-sky-hurry-and-boss-holds-back.mjs`.

| broken on purpose | went red |
|---|---|
| the streaks shortened back to what 0097 drew | `0097 — and a streak stays a streak, because a short one is a fast dot` |
| the streak count put back at the new length, so the fast layer is a curtain | `and the near layer is the quiet one, on every count that buys attention` |
| the back layer given the near layer's rate, with marks two thirds of a bullet wide | `is still behind the game, which is the ceiling 0065 set` |
| the last boss put back at the station it shipped with, 37% into the screen | `0101 — and it leaves the player more than half the screen, at the NEAR end of the swing` |
| the aura's range left at 0092's value while every boss moved forward | `0092 — THE DEFECT: a player who backs off to dodge is still inside the aura` |

⚠️ **The third one only bites under the new arithmetic.** Under 0097's exception list it would have
been caught for not being a streak; under *a mark may move less half of how much of a bullet it looks
like* it is caught because its marks are fat, which is the reason that always mattered.

⚠️ **The fifth is a break in a different channel from its decision**, which is the first time that has
happened here: a screen-space change reddening a sound guard.

## What this does not settle

**Whether the sky is fast enough.** Fourth pass. What is left is the alpha, the count, and a
`SCROLL_PER_STEP` the player has twice called *fine* — so if it comes back, the answer is the camera,
and 0097 already said so.

**Whether a fifteen-unit band is enough room for seven bosses to feel different.** It is a real
narrowing and it is stated rather than hidden; the other six axes are what carry them now.

**Whether the aura's new shape is right.** The curve has moved twice in three decisions and both times
to satisfy a guard rather than an ear. Nobody has heard 1.5.

## Rollback

**None.** No storage key, no save field, no service-worker cache prefix, no origin — three depths, a
length, a count, seven stations and two aura constants.
[0001](0001-revertability-not-risk-rating.md).
