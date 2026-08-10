# 0103 — The fast layer is in front, the second tube is the second pickup, and five bosses were never hurt

**Accepted 2026-08-10.** Items 6, 7 and 10 of
[the-seventh-play-test](../../reports/the-seventh-play-test-2026-08-10.md).

**Two reported defects and a fifth pass over the sky.** The three are unrelated as features and
identical in shape: each is a rule that was right, applied through a mechanism that could not express
it — an ink authored in the wrong block, a count reached by interpolation, and a ceiling that had run
out of room four reports ago.

## The rules

**A layer's depth says which side of the game it is on, and it may not sit at the world's own rate.**
The clearance it needs is half of how much of a bullet its marks look like, on either side. That
amends [0065](0065-the-sky-is-baked-and-blitted.md)'s *strictly below 1*, which turns out to be the
special case where every layer is behind.

**Exactly one layer may be in front, and it is the one drawn as streaks.**

**An upgrade ladder's rungs are authored, never generated.** Fourth time of asking.

## What was asked for

> *"Bosses 3+ don't show any hit interaction at all."*

> *"Missile tubes don't get a second firing till like the 3rd upgrade? — upgrades for missiles should
> be 1 tube, 2 tubes, faster fire rate."*

> *"Background scroll is too slow, probably needs to be another 75% faster again."*

## Five of the seven bosses could not be hurt on screen, and it was one word each

⚠️ **`INK_OF` carried `boss3Hit` through `boss7Hit` in the `enemy` ink** — the ink their own hulls
wear. `drawKind` gives a boss and its hurt sprite **one `case` arm**, deliberately, because
`src/render/bake.ts` states the rule as *"the SAME shape in a different ink"*: same shape is what makes
a flash read as *that thing being hurt* rather than as a second object appearing. With the ink the
same as well, the two bitmaps were byte-identical and `IMPACT_FLASH_STEPS` swapped the picture for the
picture.

⚠️ **Nothing about the collision, the flash counter or the sprite selection was wrong**, which is why
three of this project's own guards over exactly that machinery were green throughout —
[0035](0035-damage-is-legible-on-the-body-that-took-it.md) has probes for all three and every one of
them still fires.

⚠️ **THE CAUSE IS WHERE THE ENTRIES WERE WRITTEN, and it is worth more than the fix.** The eleven
older hurt silhouettes live in a block of their own with the rule written above them. The five later
bosses were authored on the line under each boss's own hull — `boss3` then `boss3Hit`, five times —
which reads as *the boss and its variant* and inherits the wrong ink by proximity. A `Record<Kind,
Row>` forces the entry to exist and cannot force it to mean anything; a valid ink in the wrong place
is not a type error.

⚠️ **`tests/combat.test.ts` already held *every enemy kind has a hit sprite that is not its ordinary
one*, and it walks `ENEMIES`.** There is no boss in `ENEMIES`. The guard that would have caught this
existed, was correct, and was pointed at half the game.

### The class repair

⚠️ **`tests/legibility.test.ts` now walks every (body, hurt) pair the CONTENT declares** — enemies,
bosses, the ship row and the hull ladder — and refuses a pair that resolves to one ink. An eighth boss
is covered on the day its row exists, rather than on the day somebody remembers.

⚠️ **Asserting on the ink is not asserting on nothing, and the reason is the shared `case` arm.**
`drawKind` reads exactly two things about a kind: which arm it lands in, and `INK_OF[kind]`. With the
shape held equal on purpose, the ink is every channel there is. It compares two independently authored
table entries rather than re-deriving what `bake.ts` computes, which is
[0027](0027-measure-the-picture-not-the-model.md)'s distinction.

## The second tube waited for the third pickup, and a curve is why

⚠️ **`launchers = rung(0, MAX_LAUNCHERS, tubes)`**, and `rung` spreads a count evenly across the four
tiers: `Math.round` gives **0, 1, 1, 2, 2**. Nobody chose that. The player counted it.

⚠️ **The interpolation was not a mistuning — it was the only lever there was.** The missiles read the
PULSE's cadence list (`fireEveryAt(ship, tubes)`, one list and two indices), so a missile rate step
could only land where the pulse's did. With both of the pulse's steps spent, staggering the tubes was
the one arrangement in which all four missile tiers bought something, which is `docs/game.md`'s rule.

⚠️ **So the fix is a second list rather than a second lever.** `missilePerBeat` on `ShipRow` —
`[3, 3, 3, 4, 6]` — and the tubes become a capped count.

| tier | tubes | steps between missile volleys | what it buys |
|---|---|---|---|
| 0 | 0 | — | the ship opens with no launcher ([0056](0056-the-missile-is-earned-and-a-pickup-is-easier-to-reach.md)) |
| 1 | **1** | 40 | the second weapon arrives |
| 2 | **2** | 40 | the second tube — one pickup earlier than before |
| 3 | 2 | **30** | rate |
| 4 | 2 | **20** | rate |

⚠️ **The floor and the ceiling are both unchanged, so this is a re-ordering and not a buff.** Tier 4 is
still twenty steps and still two tubes, so the missile pool's worst case is the number it always was
and `tests/pickups.test.ts`'s pool drive is untouched. What moves is the middle: two tubes one pickup
sooner, the first rate step one pickup later.

### And `rung` is deleted, which ends a three-decision retreat

It drew the pulse cadence, the missile cadence, the barrels and the launchers.
[0093](0093-the-gun-is-on-the-grid.md) took the first three, because the usable subdivisions of a beat
are geometric and a straight line does not land on them; the comment left behind said the launchers
kept it *"because a launcher is genuinely a count."*

⚠️ **That sentence was true and was still the bug.** A launcher is a count and this INTERPOLATED it.
The rungs of an upgrade ladder have now failed to be evenly spaced four times running. **When the
fifth arrives, author the entries** — [0016](0016-a-hub-enumerates-kinds.md) is the same argument one
layer up.

### What it cost a guard, and the guard was right to object

⚠️ **`tests/pickups.test.ts` asserted the missile-to-pulse ratio is IDENTICAL at every rung, and that
was an artefact of the shared list.** One list read at two indices divides to the same number by
construction; it was not a property the ladders had. It went red the instant they were separated,
correctly, and what it had been standing over turned out to be an identity rather than a rhythm.

⚠️ **What replaces it is what a listener counts: how many pulses pass between the two streams landing
together.** At `MISSILE_BEAT_RATIO` 5 that is five volleys at four of the five rungs — and it cannot
be satisfied by moving the constant, which is the trap the first version of this whole test fell into
and [0019](0019-a-probe-must-be-seen-to-apply.md) caught inside a minute.

⚠️ **Tier 2 is the wide one and it is a real change, recorded rather than smoothed over.** There the
pulse steps and the missile does not, so the two close every **twenty** pulses — five beats — instead
of every five. Still a cross-rhythm, and a wider one. **Nobody has heard it.** It is the first thing to
listen for if *"the missile fire provided a great counter-beat"*
([0093](0093-the-gun-is-on-the-grid.md)) stops being true.

## The sky: the fifth report, and the background is out of room by measurement

⚠️ **This is the fifth pass over one sentence** — 0078, 0088, 0097, 0101, and now. Four of them moved a
number. This one cannot, and the reason is measured rather than argued.

⚠️ **`tests/budget.test.ts` derives a per-layer ceiling from what `skyField` actually bakes**, and
driven over the three layers it says:

| | thickest mark | share of the smallest bullet | ceiling | sits at |
|---|---|---|---|---|
| `skyFar` | 0.59 units | 66% | 0.671 | 0.33 |
| `skyNear` | 0.28 units | 31% | **0.845** | **0.825** |
| `skyRush` | 0.11 units | 12% | 0.939 | 0.92 |

**The near layer has 2% left in it.** ×1.75 is not a number this sky can be asked for, and
[0088](0088-the-near-sky-goes-back-and-the-whole-sky-goes-faster.md) predicted the wall in writing:
*"after those the answer is not a number — it is a different sky."*

⚠️ **AND THE TWO DOT LAYERS THEREFORE DO NOT MOVE AT ALL, WHICH IS THE PARALLAX BEING PROTECTED.** The
far layer has room to 0.671 and the near one has none, so moving the far one alone would close the 2.5
between them — the depth cue itself, and the one quantity `tests/budget.test.ts` holds specifically so
that a speed ask cannot spend it.

### So the streak layer crosses over: 0.92 → 1.61

⚠️ **Past 1 a layer is not a faster background. It is IN FRONT OF THE GAME** — it overtakes the ship
rather than trailing it, which is the one thing no amount of background speed can imitate, and is why
the answer to a fifth *make it faster* is a different place rather than a bigger number.

⚠️ **The narrowest view: 5.4 seconds to cross becomes 3.1.** The spread of rates the eye has to read
goes from 0.33–0.92 to **0.33–1.61** — nearly three times the range — and the game now sits inside
that spread rather than on top of it.

### The ceiling generalises rather than loosens

⚠️ **0065's *strictly below 1* had the geometry backwards, and it took a foreground layer to see it.**
Its argument is that at depth 1 the sky moves exactly with the world and stops being a background. That
is right about **1** and wrong about *above*: what makes a depth near 1 bad is that the mark shares its
motion signature with every bullet and enemy on the screen, so the eye loses the channel that separates
figure from ground. **Slower is a separation and faster is equally a separation.** 1 is the bad place,
not a ceiling above which safety lies.

⚠️ **So the rule becomes `|depth − 1| > share × 0.5`, and every number the old bound produced is
unchanged.** The two dot layers are still held to 0.671 and 0.845. What exists that did not is the
branch on the other side, available to a mark thin enough to earn it.

⚠️ **The clearance is what stops that being a free pass, and it is symmetric.** A foreground dot the
size of a bullet would have to reach **1.67** before it cleared, and the near layer's own field would
need **1.16**. *Put it in front* costs exactly what *put it behind* did, off the same bake.

⚠️ **AND ONLY ONE LAYER MAY CROSS, WHICH IS A SEPARATE RULE BECAUSE THE ARITHMETIC CANNOT SAY IT.** The
clearance is about one mark; a sky whose every layer had crossed would be a game played behind a
curtain — [0069](0069-the-sky-is-behind-the-game.md)'s subject arriving from the other side. The one
that crosses is the one that says *fast* by its shape, which is
[0097](0097-the-sky-has-layers-and-the-tubes-have-sides.md)'s finding and the reason a streak was drawn
at all. Held as a count and as a kind.

### One lever, on purpose

⚠️ **0101 nearly doubled the streak's LENGTH and this moves only its depth.** Two levers in two passes,
never both at once, so a sixth report is about a quantity nobody has confounded.

⚠️ **AND THE LEVER AFTER THIS ONE IS NOT IN THE SKY.** At 1.61 the streaks already overtake a world
that scrolls at 36 units a second. If *the background is slow* survives that, it is *the game is slow*
— and `SCROLL_PER_STEP` is where that lives, with every level length, spawn distance and
distance-keyed music rung hanging off it. **That is a different decision and a much larger one**,
written down here so the sixth pass does not start by reaching for a depth again.

## What this does not do

⚠️ **Nothing here touches the audio**, which is the larger half of the same play-test and is its own
decision.

⚠️ **The pickup tables are untouched, at the player's explicit instruction.** *"Levels 2 & 3 feel
incredibly slow, easy and non-interactive"* is answered by density rather than by respreading the
ladders: *"we'll be adding different weapon and missile types in future and that's how we'll change the
pickups per run later to be still rewarding and interesting."*

## Rollback

⚠️ **No irreversible surface** — [0001](0001-revertability-not-risk-rating.md). No storage key, no save
field, no cache prefix, no origin. Every change is a constant, a table entry or a guard; reverting the
commit restores the previous picture exactly, and a save written under it loads unchanged because
nothing here is serialised.
