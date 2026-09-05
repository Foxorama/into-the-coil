# 0251 — The volcanoes belch

**Accepted 2026-09-05**, the same night as [0250](0250-the-quetzal-screams.md), the second half of
the Saurian Belt's real boss, from the brief's afterthought in
[`the-bosses-asked`](../../reports/the-bosses-asked-2026-09-05.md):

> *"I also forgot, for the saurian belt new end boss, I want volcanoes in the background that belch
> for big chunks of volcanic rock that rain down and the player has to dodge as well as all the
> other boss stuff i asked for there"*

**Amends [0247](0247-a-level-has-a-mid-boss-and-a-real-one.md)**: the quetzal's row is now the
whole of the fight the brief described. **Extends [0151](0151-the-gap-you-have-to-reach.md)**: a
second thing a boss owns beside its phases.

## The rules

**A fall is a volley from the sky, on the row and not on a phase.** `BossRow.fall` is `{ shot,
every, count }` or `null`, required on every row as `uncoil` is. Every `every` steps — the tier's
own gap over it, as a phase's cadence takes it — `count` of the shot are put at the top edge of
the lane, each somewhere along the box the ship can fly in on a stream of its own (0021), falling
straight across the lane at the shot's speed and riding the camera along it. *"As well as all the
other boss stuff"* is the whole shape: it is read beside the uncoil in `driveBoss`, so it runs
through every phase, through the brace and through the beams, and `THE BELCH, DRIVEN` in
`tests/volcano.test.ts` holds that the same belch arrives whole, at the wings and at the mouth. The
first waits the fall's own gap after the boss arrives, so the arrival is the boss's.

**The rock is a bullet, and it is the biggest and slowest one.** It goes into `enemyShots`, hurts
as any shot hurts (for two: a rock is not a bullet) and is shot down as any shot is, so it is a row
in `src/content/shots.ts` held to every rule a hostile bullet is held to. 0098's trade put the fast
bullet small and the slow one big; the rock is that trade's far end — 6.5 units drawn, a fifteenth
of the lane, falling at under half the ship's speed, two and a half seconds to cross. Its hurtbox
is a third of its drawing, inside `tests/combat.test.ts`'s band. `speed` is how fast it *falls*:
a fall is the one shot in the game that travels the short axis, which is what the sky's rule for
hostile bullets already allows for a body thrown across.

**A rock retires on its own life.** A body riding the camera never reaches the along cull and there
is no across cull; a rock that had fallen through the bottom of the lane would go on falling under
the screen for ever, one pool slot each. Its life is the lane plus its own width at its own speed,
and a step over.

**The picture is the edge it came over.** The volcano that belched it is the level's own landmark,
behind — the belt places three (0224), and the third is on the screen through the fight. What the
step adds is embers at the top edge over each rock as it comes in (0036), in the debris the player
already reads as *something happened here*, and the enemies' own cue rather than the boss's: the
rock is the sky's and not the hull's. The rock itself is a lump — seven corners, the one bullet
with corners that is not a ring, a drop or a dart — filled in the `fire` ink and then mostly
covered in a dark bevel, so what reads is black rock with a hot rim and one hot crack: the light
coming out of it, which is the volcano's own argument. A grey of its own would fail the floor every
meaning ink is held to on the dark places.

## The figures

| what | value |
|---|---|
| the belch | two rocks every 90 steps, before the tier's gap |
| the rock | 6.5 units drawn, hurtbox 2.2, damage 2, falls at 0.7 a step |
| a crossing | 2.4 s at the base tier |
| the embers | five per rock, at the top edge |

## ⚠️ What was rejected

**A hazard on the level rather than the boss.** The rocks are the fight's — *"as well as all the
other boss stuff"* — and a level-owned rain would fall on the mid-boss's fight and the waves too. If
a place wants weather of its own it is a different decision.

**The volcano animated to belch.** A landmark is a baked bitmap that moves by its scale (0203), and
a second frame is a whole atlas slot for one mountain's mouth opening. The embers at the edge say
where the rock came from; whether they say it well enough is owed to an eye.

**A rock that is not in `enemyShots`.** A body of its own pool would need its own pairing, its own
cull and its own painter for the sake of not being called a bullet; the rules a hostile bullet is
held to are the rules that make a rock fair.

## What is owed

- **An eye on the belch at the shipped camera**: whether five embers at the edge read as *the
  volcano did that*, and whether the rock reads as rock rather than as a big flame.
- **The rain's density.** Two rocks a second and a half is a first number under the lasers; the
  brief's *"big chunks"* is answered by the size and not by the count.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). Content, a row field, a shot kind
and a burst count; nothing persisted.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0251`:

| broken on purpose | went red |
|---|---|
| the rock made the quickest bullet while still the biggest | `THE ROCK` |
| the fall never read, so the row's rock never falls | `THE BELCH, DRIVEN` |
| the rocks falling a whole view up the lane | `THE BELCH, DRIVEN` |
| the first belch on the arrival step | `and the first rock waits` |
| a rock given no life, so it rides under the screen for ever | `and a rock retires below the lane` |
| the rock hitting for nothing | `and a rock hurts the ship` |
| the embers not thrown, so a rock appears from nowhere | `THE PICTURE` |
