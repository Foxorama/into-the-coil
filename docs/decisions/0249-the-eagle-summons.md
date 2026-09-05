# 0249 — The eagle summons

**Accepted 2026-09-05**, the same day as [0248](0248-the-serpent-strikes.md), the second of the real
bosses' own decisions, from [`the-bosses-asked`](../../reports/the-bosses-asked-2026-09-05.md):

> *"the end boss of Ember Nebula is going to be some hell-spawned demon space eagle thing that throws
> out whips of fire and summons hordes of flying kites and raptors as adds at various points
> throughout the fight."*

**Amends [0247](0247-a-level-has-a-mid-boss-and-a-real-one.md)**: the eagle's row is the fight the
brief described. **Amends [0098](0098-a-wave-plays-a-figure.md)** once more: a boss may send a body,
not only a bullet.

## The rules

**A whip is a lash, not a fan.** The `whip` attack throws the phase's shots along an arc of `sweep`
radians centred down the lane, every one on the same step, with the tip `reach` times faster than
the root — so the line of them bows out as it flies and the player reads a curve of fire cracking
across the lane. The bullet is the `flame`: the smallest and quickest in the game, on 0098's rule the
other way round from the serpent's blasts, in the `fire` ink — vermilion, redder than the player's
amber `bullet` and yellower than `enemy`'s pink-red, held to every floor a meaning ink is held to.
`THE WHIP` in `tests/eagle.test.ts` drives one volley and holds that every shot is a flame, that
each is faster than the one before it, and that the first and last leave in different directions
across the lane.

**A summons is an attack that throws nothing.** The `summon` attack puts `count` of `enemy` on the
field at the leading edge in `formation` on every volley — a horde is many calls, not one — and
throws no bullet. `stepBoss` has no enemy pool and no rows, so the volley is an ask: the count rides
the boss's own `turnsLeft`, a field nothing else reads on a boss, and the frame answers it on the
same step with `summonAdds`, which places the adds exactly as a leading wave is placed, with the
same parities and no roll. `THE SUMMONS` drives a volley at half health and one at the end and holds
that the enemy pool gains the phase's count of its kind, ahead of the ship and on the screen, and
again on the next volley.

**The kite is Ember Nebula's horde, and no level sends it.** A new enemy kind: one hit, one bite,
quick, weaving hard — a diamond with a forked tail, which is what tells it from the drifter's
diamond at twenty pixels. Its time on the screen at the hardest tier clears 0105's floor; its
extent sits under the moth's and the raptor's. `THE KITE` holds it small, quick, unarmed and
unauthored: a body the eagle calls and nothing else does.

**Five phases, alternating what it throws with what it sends.** Darts at where the player is while
whole; at three quarters a whip of five flames; at half, two kites a volley in a vee; at a third a
whip of seven, wider; at the last sixth a raptor a volley, which hunts. *"At various points
throughout the fight"* — the points are the phases, and the escalation rules still read every row.

## The figures

| phase | at | attack | every |
|---|---|---|---|
| whole | 100% | one dart at the ship | 78 steps |
| three quarters | 75% | a whip of five flames, 1.1 radians wide, tip 1.9× the root | 66 |
| half | 50% | two kites in a vee at the leading edge | 60 |
| a third | 33% | a whip of seven, 1.4 radians wide | 54 |
| the last sixth | 16% | a raptor at the leading edge | 48 |

The smallest thing that can kill the player is the flame at 0.66 — the most a 1.2-unit drawing may
carry (`tests/combat.test.ts`) and still above the far stars' largest mark (`tests/sky.test.ts`,
whose typed band moves from 1.8 to 1.32 with it).

## ⚠️ What was rejected

**A whip as a beam or a sweep over steps.** A lash that took several steps to unfurl would need
per-step state on the boss; a fan with graded speeds is the same picture from one volley, and it is
the picture the player dodges.

**Summoning from the boss's own body.** Adds that appear at the hull appear on top of a player
fighting it; the leading edge is where every wave arrives and the place the player already watches.

**The flame in the `bullet` ink.** The ship's own fire is never in the ink of the things trying to
kill it (0081), and orange is the player's.

**A summons that counts as `shots`.** The count is the attack's, so the escalation guards can go on
reading `shots` as the fan's; `bare` carries a fan it never throws on the same terms.

## What is owed

- **An eye on the whip at the shipped camera**: whether five flames at graded speeds read as one
  lash, and whether a kite's forked tail reads at twenty pixels.
- **The horde's size.** Two kites a second at half health is a first number; *"hordes"* may want
  more, and the enemy pool is the ceiling.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). Content, two attack arms, an enemy
kind and an ink; nothing persisted.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0249`:

| broken on purpose | went red |
|---|---|
| the whip's tip no faster than its root, so the lash is a fan | `THE WHIP: one volley is a lash` |
| the flame drawn in the player's own bullet ink | `THE WHIP: one volley is a lash` |
| the summons never answered, so a volley calls nobody | `THE SUMMONS: a volley at half health` |
| the adds placed at the camera rather than at the leading edge | `THE SUMMONS: a volley at half health` |
| the kite given a gun, so the horde is a wall of bullets | `THE KITE: Ember Nebula's horde` |
