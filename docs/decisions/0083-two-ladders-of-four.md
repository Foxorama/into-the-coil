# 0083 — Two ladders of four

**Accepted 2026-08-08**, the day after [0082](0082-a-pickup-is-rare-and-says-what-it-is.md) and
before it had been played through.

**Amends [0082](0082-a-pickup-is-rare-and-says-what-it-is.md)** — the taxonomy, the density and the
death scatter — and closes the *"which powerups did we end up with"* question that prompted it.

## The rule

**Four pickup kinds. Two of them are upgrade ladders of exactly four tiers, and the tier count is a
constant the cadences are derived from.**

| kind | a tier buys | tiers | per level |
|---|---|---|---|
| **`weapon`** | a barrel **and** a fire-rate step | 4 | 4 |
| **`missile`** | a tube **and** a rate step, max 2 tubes | 4 | 2 |
| **`shield`** | one hit that never reaches the hull, capped at 3 | — | 2 |
| **`bomb`** | charges for the arsenal, uncapped | — | 1 |

**Nine a level**, and the nine is derived: capping the guns is four, tier 2 on the missiles is two,
and *"a couple of additional shields/bombs"* is the remaining three.

## What was asked for

> *"we should have shields / missiles / weapons / bombs as upgrades"*

> *"there should be 4 tiers for weapons, 4 tiers for missiles, max of 3 shields, unlimited bombs"*

> *"the player should be able to cap weapons before the first boss and have tier 2 on missiles and
> then have 2 shields per level plus a bomb. So we need 9 upgrades per level to start with."*

> *"I want weapons and missiles as separate upgrades because we're going to add different types of
> weapons and missiles and that's where the cycling will come into it."*

> *"weapon upgrades - upgrade barrels and fire speed; missile upgrades - add missile tubes and upgrade
> missile speed -> max of two tubes and 4 speed rate"*

And, after playing 0082:

> *"tested the 50% on death and it's too punishing, let's make 100% for weapons and missiles, but no
> shields spawn on death"*

And, on the two glyphs:

> *"can we rotate the shield one so the point is pointing to the bottom of the screen so it actually
> looks like a shield? and rotate bomb so that the point side is at the top?"*

## Why the merge is being half-undone one day later

⚠️ **It is not a correction, and saying so matters because the diff looks like one.** 0082 merged four
upgrade kinds into one `weapon` on the ask's literal words — *"rapid fire/rapid missiles rapid whatever
else we add need to be combined into one power up."* That merge was right for what it was answering:
four faces was the *"too many varieties"* complaint.

**What 0083 knows that 0082 did not is what is coming.** *"We're going to add different types of
weapons and missiles and that's where the cycling will come into it."* A pickup that will one day be
*one of several guns* needs a kind that means **the gun**; one that will be *one of several missile
racks* needs a kind that means **the tubes**. Merging them leaves one kind that would have to alternate
between two unrelated families.

⚠️ **So the cycle 0082 deleted is coming back, one level down.** It will alternate between weapon
TYPES rather than between pickup kinds, which is the version 0052's *"which one a player gets is a
matter of when they reach it"* was always a better argument for: a choice between two guns is a real
choice, where a choice between *a gun* and *a shield* is a coin toss on a premium piece.

⚠️ **Four kinds is available now because the involution is gone.** 0052's `CYCLE` forced an even count
and 0082 removed it; three worked, four works, and the next one will not be constrained either.

## The tier count is a constant, and it used to be an accident

⚠️ **`UPGRADE_TIERS = 4`, and every cadence is interpolated across it.** The old ladder multiplied each
cadence by a fraction and stopped at a floor, so *how many tiers is a weapon* was whatever
`round(9 × 0.78ⁿ) ≥ 4` happened to produce. **That was three**, with nothing anywhere saying so and no
guard able to notice when a tuned base changed it.

| rung | pulse gap | barrels | missile gap | tubes |
|---|---|---|---|---|
| 0 | 9 | 1 | 45 | 0 |
| 1 | 8 | 2 | 39 | 1 |
| 2 | 7 | 3 | 33 | 1 |
| 3 | 5 | 3 | 26 | 2 |
| 4 | **4** (the floor) | **4** (the cap) | **20** (the floor) | **2** (the cap) |

⚠️ **The floors are now reached EXACTLY at tier 4**, where a multiplicative ladder always stopped
short — it refuses the rung that would cross, so the fastest a fully-upgraded ship ever fired was
whatever the last legal multiply produced.

⚠️ **Four tiers over a barrel range of 1→4 means one tier buys rate alone, and that is forced.**
`MAX_BARRELS` is a pool budget, measured: `barrels × PLAYER_SHOT_LIFE / FASTEST_FIRE ≤ pool`, and five
barrels is exactly 100 against a pool of 100 — the stutter bug 0041 already fixed once. The ask's
*four tiers* and the pool's *four barrels* are different fours. Same for the missiles: four tiers over
two tubes means two tiers buy rate alone.

⚠️ **Every tier must still change something**, which is `docs/game.md`'s rule and the thing rounding
threatens. `tests/missiles.test.ts` walks the ladders tier by tier rather than trusting the
arithmetic.

⚠️ **`RAPID_FACTOR` and `MISSILE_FACTOR` are gone.** Their difference had a job — *"a missile is worth
three pulses, so the same factor on both would let the pulse stop mattering"* — which was true when one
pickup advanced both weapons at once. They are two pickups again, so what balances them is how many of
each a level offers: four against two, authored in `src/content/levels.ts`, where a play-test can
argue with it.

## What the split makes newly possible

⚠️ **The bomb conversion is PER LADDER, and that is what makes *"unlimited bombs"* true.** A fifth
weapon pickup becomes a charge while the missiles are still climbing, and the other way round — so
neither ladder's ceiling can turn the other's pickups into dead ones. `effectOf` takes the upgrade
list rather than the resolved weapon for exactly this reason: a `Weapon` cannot tell a maxed pulse
from an empty missile rack.

⚠️ **The hull tier counts the LADDERS, not the list.** `gun + tubes` and it was `upgrades.length` —
the same number until a ladder caps, at which point a list would climb the hull for a pickup that
changed no part of the ship.

## The scatter goes back to everything

⚠️ **0082's 50% coin lasted one play-test.** *"Too punishing."* The filter is **deleted rather than set
to 1**, because a coin that always comes up heads is a mechanism nothing can test — its probe would go
STILL GREEN, and [0019](0019-a-probe-must-be-seen-to-apply.md) is explicit that an unfalsifiable guard
is worse than none.

⚠️ **What survives the deletion is `scatterRing`'s explicit `count`**, which was written for the filter
and is worth keeping without it: the ring is spaced over the pieces that actually reach the field
rather than over the ones the death took, so a truncating pool leaves a smaller ring instead of a
gappy one.

⚠️ **Shields were never scatterable and now there is a guard saying so.** *"But no shields spawn on
death."* A shield lives on the ship's `health` ([0050](0050-the-ship-is-one-hit-and-the-shield-is-what-stands-in-front-of-it.md))
rather than in the upgrade list, so `scatterUpgrades`' signature is the guarantee — and *true because
of a type* stops being obvious the moment somebody widens the type, which **this decision just did**,
taking `UpgradeKind` from one member to two.

⚠️ **And the density guard went slack when this landed.** With six upgrade pickups a level instead of
three, the worst unarmed stretch is the run from the last one to the boss; 0041's probe used to remove
a middle weapon and no longer reddens anything, because the missiles sit in the gaps. Its break is now
the LAST upgrade in the level, which is the defect the guard is actually about.

## The two glyphs, and one of them needed a second pass

| | before | now |
|---|---|---|
| `pickupShield` | pointing +x — *"like everything else, so the taper is the nose"* | **tapering to a point at the bottom**, which is what a shield is |
| `bomb` and `pickupBomb` | a fin trailing at -x | **a fuse at the top** |

⚠️ **The shield's old orientation was wrong twice over.** A pickup is not a body that flies, so it has
no nose; and the second bake it was avoiding does not exist, because
[0031](0031-landscape-is-the-shipped-orientation.md) dropped portrait. What it cost was the one pickup
whose meaning a player already owns — lying on its side it is a pennant, which is what the picture
showed. **It is now the only sprite in the atlas deliberately not drawn along +x**, and that is written
where the drawing is.

⚠️ **The bomb's rotation moves the THROWN bomb too, deliberately.** Turning only the pickup would have
split the one drawing the two kinds share, and that sharing is the reason a player needs no teaching:
*the thing on the ground is the thing on the button.* A fuse reads on both; a fin read on neither.

⚠️ **AND THE ROTATION ALONE ACHIEVED NOTHING A PLAYER COULD SEE, which only the screenshot said.** The
turned shape put a 0.22r nub on a 0.78r disc — under two pixels at the title key's icon size — so the
bomb still read as a plain green dot beside three shapes that read fine. The model had rotated and the
picture had not, which is [0027](0027-measure-the-picture-not-the-model.md) in one image. The disc is
now 0.6r with the spike reaching r over a narrower base.

## Confirmed, not assumed

Per [0005](0005-a-guard-must-be-seen-to-fail.md) and [0019](0019-a-probe-must-be-seen-to-apply.md).
0083's own breaks live in `scripts/probes/0082-taxonomy.mjs` alongside the decision they amend, because
they break the same mechanisms and a second file over one subject is the drift
[0029](0029-the-tracked-record-is-the-record.md) is about.

⚠️ **Nine probes across six decisions were stranded by this change** — 0041 (twice), 0051, 0056, 0081
(twice) and 0082 (twice) — and `anchorFailures` reported all nine before a suite ran. Three assertions
were **inverted rather than repaired**, and that is worth reading before assuming one is a mistake:

| guard | 0082 said | 0083 says |
|---|---|---|
| the upgrade rung | *one pickup moves BOTH weapons* | *a weapon pickup never touches the missiles* |
| the scatter | *gives back about half* | *gives back every upgrade, on every seed* |
| the launcher count | 2 tubes at rung 4 of a shared ladder | 2 tubes at tier 3 of the missile ladder |

Each was the correct guard for the taxonomy it was written against. **A guard tied to a decision
inverts when the decision does**, and the alternative — a guard loose enough to survive both — is a
guard that holds neither.

**403 probes, all red.** 0083's own six:

| broken on purpose | went red |
|---|---|
| the tier count moved without the levels, so a level can no longer cap the guns | `THE TARGET: a level offers exactly enough weapons to cap the guns` |
| the rungs flattened, so every tier resolves to the base ship | `THE TIERS: each ladder is exactly UPGRADE_TIERS long` |
| the ladder one rung short, so a maxed ship never reaches its own floor | `THE FLOORS: the last tier lands exactly on them` |
| the bomb conversion asked about the whole list, so a full gun ladder caps the missiles too | `an upgrade pickup taken at its cap becomes a bomb charge` |
| a filter put back on the scatter, so a death keeps half of what it took | `THE COST OF DYING: gives back every upgrade, on every seed` |
| a shield admitted to the scatter, so a death puts armour back on the field | `and never throws a shield, because a shield was never in the list` |

### Two more guards had stopped reaching their own subject, and the pattern now has four instances

⚠️ **The hull clamp.** `climbs with the upgrade list` walked twenty of `UPGRADE_KINDS[0]` and asserted
the tier never passes `MAX_HULL_TIER`. One ladder caps at four tiers, so the most a single kind can
contribute is a hull of exactly two — **the clamp**. The probe deleted the clamp and the suite stayed
green. It now walks both ladders, which is the only loadout in the game that can reach the ceiling,
and asserts that a fully upgraded ship *does* arrive at the last hull — because a range that never
reaches a bound is a range that cannot test it.

⚠️ **`THE FLOORS`, which was written an hour earlier in this same change.** It is named *the last tier
lands exactly on them* and it asserted `toBeLessThan(base)` — true of any ladder at all. The probe
shortened the ladder by a rung and this stayed green while seven missile tests around it went red. It
asserts equality now, which is why `FASTEST_FIRE`, `MISSILE_FASTEST`, `MAX_BARRELS` and
`MAX_LAUNCHERS` are exported: naming a bound is legitimate when the bound is a *separate* constant
with its own reason, and it is the only way to say *reaches* rather than *approaches*.

⚠️ **FOUR OF THESE IN TWO DAYS — 0056, 0081, and now these two — AND THEY ARE ONE SHAPE.** When a
change moves a bound, the guards that stop working are **the ones that scan a range the bound now
truncates.** They do not fail; they stop arriving. The tell is a loop with a literal ceiling (`n <= 20`,
`30 upgrades`, *whichever pickup came to hand*) written when that ceiling was comfortably past
everything. `npm test` cannot see any of it and a full `npm run prove` sees all of it, which is the
strongest argument yet for the rule `docs/state-of-play.md` already carries: **run the whole proof
before pushing a change to a shared constant.**

## What this does not settle

**Whether nine is right.** *"Then I'll test and we'll cut back or add based on that."* The count, the
tier spacing and the two-after-the-cap shape are all a hand's to judge, and the levels are authored so
that changing the budget is a change to one list per level rather than to the ladder.

**Whether four weapon tiers is the difficulty dial's four.** *"Dial starts at 1… increases when the
player gets their first weapon power up… should be difficulty 4 or so"* at the boss. Four weapon
pickups is four notches from 1, which overshoots by one; three undershot. Worth settling when the dial
lands (chunk 6) rather than guessing here.

**Whether the hull ladder still fits.** `UPGRADES_PER_TIER` is 2 over three hulls, and a run can now
reach eight upgrade tiers — so the last hull arrives at four, which is inside level one again. That
number was validated by hand against a density two changes ago.
