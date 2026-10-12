# 0602 — The swift is its places' own

**Accepted 2026-10-12.** The second of the enemy-art pass [0601](0601-the-signatures-are-their-places-own.md)
opened, on the same ask: *"more level specific enemy sprites per each level and make them look better."*

## What was owed

[0446](0446-each-place-has-its-own-faces.md) drew the eight shared kinds afresh in every place and left
one out in as many words: *"the swift is still one drawing in all three places that send it."* The
Approach, Ember Nebula and Saurian Belt each fly it, and all three flew The Approach's grey chevron
in their own colours — the *same model with a different colour* 0446 was asked to end.

## The rule

**Every place whose level sends the swift authors its own outline, lit edge and paint of it.**
`SWIFT_OF` in `src/render/bake.ts`. A place that never sends one bakes The Approach's, which is a
**default and not a constant** on [0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md)'s
terms: the table is not a `Record` over every place because four of the seven would be drawing a
body nobody meets. What holds it is the guard, which reads the senders off the levels — a fourth place
that starts sending the swift is held from that day.

| place | drawn as |
|---|---|
| The Approach | the plain swept chevron [0328](0328-a-body-flies-an-arc.md) drew — a raider's interceptor |
| Ember Nebula | an **ember swift**: each wing's trailing edge burning off in three tongues, white-hot at the heart |
| Saurian Belt | a **draco**, the gliding lizard: a head on a neck, membrane wings bowed at the leading edge and scalloped between the ribs at the trailing edge, and a tail |

**Still swept back to a V**, 0328's reason for the kind: the one shape on the sheet that points. The
draco's tail fills the notch 0328 left open, which is the one liberty taken, because a lizard has a
tail. No row, sprite index, extent, hurtbox or behaviour moved.

**The draco authors its own wingbeat.** A membrane flaps from the body out, as the moth's wings do,
and the swept chevron's beat moved its tips 1.8 px — under [0410](0410-the-enemies-move.md)'s 2 px.
`SwiftBody.poses` is the row saying its own version; the others keep the swept beat.

## ⚠️ What the picture changed

- **The first draco was an aeroplane.** Straight swept wings and a straight tail off a body are a
  jet's plan view, and the sheet showed one. The leading edge bows and the trailing edge is
  scalloped now, which is what skin stretched over ribs looks like.
- **The ember swift's tongues beat 1.8 px.** Widening the FOLD did not help and made The Approach's
  worse, because a swept wing drawn in slides its tip along its own edge, and
  `tests/cycles.test.ts` rightly counts that as no motion. The SPREAD was widened instead, from 1.08
  to 1.2, which moves every swift's tips off their own edges.

## Guard

`tests/faces.test.ts` — **and every place whose level sends the swift draws its own**: every pair of
sending places' rest outlines at least 2 px apart on a 1280×720 screen, 0446's measure and 0410's
floor for *a different picture*.

## Seen to fail

[0005](0005-a-guard-must-be-seen-to-fail.md). `npm run prove 0602`:

| broken on purpose | went red |
|---|---|
| every place given The Approach's swift | `and every place whose level sends the swift draws its own` |
| Saurian Belt given Ember Nebula's swift | same |

The second is there because a guard that asked only *is this the default* would stay green over it.

## Owed

- **A play in Ember Nebula and Saurian Belt**, whether the ember swift and the draco read at speed
  through their arc. Each is one entry in `SWIFT_OF`.
- **The Approach's eight shared bodies** are the next of this pass.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). Art baked at load; nothing persisted.
