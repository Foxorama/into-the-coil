# 0235 — A seeker hunts the nearest body

**Accepted 2026-09-05.** The third of the three new weapons asked for that day, and the second
`MissileKind` — the row that gives [0233](0233-a-weapon-is-a-kind-and-a-pickup-cycles.md)'s missile
pickup something to cycle to:

> *"add in a new missile type — homing missiles. Same powerup change as weapon power ups, the missile
> upgrade cycles between missile type and if a player collects a diff missile type they start from
> level 1 on that missile type. Homing missiles do a bit less damage than regular missiles; home into
> the nearest target when fired (any direction)."*

## The rules

**The seeker is a `MissileKind` with the `homing` guidance.** The same tubes, the same clock, the same
cue as the straight missile; what differs is the shot and a `seek` on the row — the most it turns
toward its target per step. A missile pickup showing the seeker's face switches the tubes and starts
their ladder again at one rung, exactly as a gun does.

**A seeker is worth two pulses, between the pulse's one and the missile's three**, held as the order
and not the number. The third pulse is what pays for the guidance.

**It hunts the nearest body on the screen, every step, any direction.** `seek` rotates the missile's
own velocity — less the scroll rate, on 0034's terms — toward the nearest enemy or the boss by at most
`seekTurn`, and puts it back at the length it had, so a seeker coming about is the same missile
pointed elsewhere and not a slower one. The pop it left the tube with is its first heading, which is
why a pair fans before it converges. Nothing beyond the view is a target.

**The turn is copied onto the missile at launch**, so a switch of tubes leaves the missiles in the
air hunting, and a straight missile carries zero and never enters the hunt.

## ⚠️ What was rejected

**Locking the target at launch.** A pool swaps its last slot into a released one, so an index kept
across steps follows the wrong body the moment anything dies; and *nearest* changing under a missile
is what a hunt looks like. The search is bounded by the pool and allocation-free.

**A turn radius.** The missile's speed is the shot row's; a radius would be a second number that had
to agree with it. A rate does not.

**Art on the ship for the tubes.** The player asked for the ship to wear its *weapon*; the tubes are
the same tubes. The seeker has its own silhouette — swept fins and an eye — and the pickup's second
face has a reticle through the chevron, which is enough to tell the stream that hunts from the one
that does not.

## What is owed

- **An eye on a pair coming about**, at the shipped camera: whether thirty-five steps to reverse
  reads as hunting or as lost.
- **The balance** of two against three, which is a hand's.

⚠️ **Played, and the balance was the report** — [0246](0246-a-seeker-hunts-on-the-screen.md):
*"way too strong … 15-20 on screen at a time."* The hunt is bounded by the screen as a box rather
than by a reach, and by a fuse; *any direction* still holds inside a second and a half.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). A row, a guidance and a field on
the entity; nothing persisted.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0235`:

| broken on purpose | went red |
|---|---|
| the seeker's turn authored to zero | `THE HUNT: a seeker turns` |
| the hunt refusing any body behind the missile | `a body BEHIND the ship is reached` |
| the turn costing speed | `turns without slowing` |
| the seeker worth as much as the straight missile | `is worth less than the straight missile` |
| the seekers' pickup face given the straight missile's chevron | `THE FACES: the weapon pickup offers every gun` |
