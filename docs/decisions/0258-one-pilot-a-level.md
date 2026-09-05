# 0258 — One pilot a level

**Accepted 2026-09-06**, the same day as [0257](0257-the-arc-lands-on-the-screen.md), from
[`the-alpha-list`](../../reports/the-alpha-list-2026-09-06.md):

> *"we need less enemies (and bosses) reacting to the player. There's too many things that target
> the player and you can't learn the pattern from → let's change it so one unique enemy per level
> targets/reacts to the player and others should be on a pattern… minibosses need to be on their
> own pattern path and not actively matching the player or aiming at the player, it makes it very
> hard to dodge."*

**Amends [0073](0073-an-enemy-is-a-pilot.md)**: three shared kinds reacted, and now none does — the
reacting is the signature's. **Amends [0111](0111-a-boss-has-one-idea.md)** and
[0247](0247-a-level-has-a-mid-boss-and-a-real-one.md): no boss aims, no mid-boss stalks, one end
boss stalks, and the pair is unique over each seven rather than over fourteen. **Amends
[0110](0110-an-attack-is-a-pattern.md)** by moving where the enemies' aimed guns are, not by
changing that union; the bosses' `aimed` arm goes. **Amends
[0232](0232-each-place-has-its-own-enemy.md)**: a signature is also the place's one pilot.

## The rules

**A kind reacts to the player by how it flies — `hunt` or `circle` — or by where it points — an
`aimed` gun it fires — and in every level the only kind that reacts is the place's signature.**
`reacts` in `tests/pilot.test.ts` is the one description, and `THE REPORTED ONE` holds it over what
each level's waves send; `and every signature reacts` is the counterweight, because a level where
nothing reacts is 0073's *"one-button autopilot stick"*. Every kind sent by more than one level is
on a pattern.

| kind | was | is | why |
|---|---|---|---|
| lancer | hunt, aimed | a shallow weave, one lance straight down the lane | shared by every level; `lance/spray` is its own pair |
| warden | circle, aimed | roams the lane, a wall of one pair of spits | shared by five levels; `spit/wall` is its own pair |
| charger | loop on the ship | loop on the box's ends | see below |
| picket (the Approach) | drift, spray | hunt, spray | the lancer's hunt, at the lancer's agility |
| moth (Ember Nebula) | weave, spray | circle, aimed | the warden's orbit; the only aimed lance |
| sentry (the Labyrinth) | drift, wall | hunt across, wall | `closing` is zero, so it slides across to line up and throws its wall with the hole in front |
| spore (the Toxic Mire) | loop once | hunt, slowly | a mine that seeks |
| raptor, shard, gaze | hunt; circle, spiral; hunt, aimed | unchanged | already the pilots |

**A looper turns at the ends of the player's box, not at the ship.** `loop` in `steerEnemies`
reverses `LOOP_TURN_ROOM` inside `PLAYER_ALONG_MARGIN` and `PLAYER_LEAD`, in the camera's frame,
with `spin` carrying which way it is running; it still crosses a ship anywhere in the box, which is
the whole of what 0073 wanted from it, and the pass is now the same pass wherever the ship stands.
`THE LOOP` in `tests/pilot.test.ts` parks the ship at two distances and holds the turn to one place,
inside two hulls of the back of the box.

**No boss aims, no mid-boss stalks, and exactly one end boss stalks.** The `aimed` fan is deleted
from `BossAttack` — an arm nothing sends is a member the union cannot keep, and a boss that aimed
now fails to compile. The harrow and the axis bob; the sentinel sprays and the shoal mother throws
a wall, the phase widening each; the frost ship patrols. The eagle keeps its stalk — *less* is not
*none*, and an eagle hunts — with its darts a spray fanned by the phase, so what reacts is where it
is and not where it points. `THE MID-BOSSES` and `among the end bosses` in `tests/pilot.test.ts`;
0111's stalker guard in `tests/level.test.ts` runs over the one that is left.

**0111's *no two bosses fly and shoot the same way* holds over the mid-bosses and over the real
bosses as two sets.** Two flights and four fans is eight pairs, and fourteen rows cannot each have
one. The mid-bosses ARE their pair — the old seven, one idea each — so the pair is unique over them;
a real boss is its own attack, and `every real boss has an attack of its own` in
`tests/level.test.ts` holds a rain, a whip, beams, a spin, a cold, heads and tendrils to seven
different hulls, with the pair unique over the real seven too.

## ⚠️ What was rejected

**A per-level `reacts` override on a kind that stays reactive in its row.** A row's motion must
resolve, and a kind that hunts in one level and drifts in another is two kinds with one name — 0016
would want it as two rows, and it would be.

**Making the lancer the pilot and the signature a pattern.** The signature is the body a place
sends and no other, so *one unique enemy per level* is the signature by definition; the lancer is
in every level.

**Taking the eagle's stalk too.** *"Less enemies (and bosses) reacting"* is a ceiling, and a run in
which no hull ever knows the player is there is weather. One, and the eagle is the one that should.

## What is owed

- **A play.** Whether a lancer on a weave still teaches what a lancer taught; whether a warden's
  gate reads; whether one pilot a level is enough to keep 0073's answer standing.
- **The eagle's adds** — kites and raptors — are the eagle's attack and not a level's wave, so
  this decision's guard does not read them; the eagle's own item on the list does.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). Rows and one arm of a switch;
nothing persisted.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0258`:

| broken on purpose | went red |
|---|---|
| the lancer hunting again, so every level has two pilots | `THE REPORTED ONE: in every level, the only kind that reacts` |
| the picket holding its line again, so the Approach has no pilot | `and every signature reacts` |
| the harrow stalking again | `THE MID-BOSSES: every one flies a pattern` |
| the frost ship stalking as well as the eagle | `among the end bosses exactly one stalks` |
| the eagle on a patrol, so no boss reacts to the player at all | `among the end bosses exactly one stalks` |
| the looper turning where the ship is rather than at the back of the box | `THE LOOP: a charger turns at the back of the player's box` |

⚠️ **No probe for *a boss aiming again***: the `aimed` arm is deleted from the union, so the break
does not compile and the harness would report it STILL GREEN — 0019's own trap. The type is the
guard, and `tests/level.test.ts` holds that every arm left in the union is flown.
