# 0254 — The hydra grows heads

**Accepted 2026-09-06**, after [0253](0253-the-frost-ship-chills.md), the sixth of the real bosses'
own decisions, from [`the-bosses-asked`](../../reports/the-bosses-asked-2026-09-05.md):

> *"toxic mire needs a hydra boss, at 80, 60, 40, 20% it spawns an extra head, the first head fires
> acid blasts, the second head adds flame ball attacks, the third head fires laser bolts, the 4th
> head fires frost attacks and the last head fires out void blasts"*

**Amends [0247](0247-a-level-has-a-mid-boss-and-a-real-one.md)**: the hydra's row is the fight the
brief described. **Amends [0248](0248-the-serpent-strikes.md)**: a phase names what it throws, and
now it may name several things and the order they take.

## The rules

**A head is a shot and an attack of its own, and the heads take turns.** The `heads` attack is a
list of `Head` — `{ shot, attack }` — and one volley throws one head: the k-th volley of the fight
is the k-th head's attack with the k-th head's shot, round and round, the count riding the boss's
`firePhase` (the field 0110 named for *where in its turn a body has got to*). Every earlier head
stays in the list as a phase grows one, so *"adds"* is cumulative; and the phase's quickening
cadence is what keeps each head's own turn from slowing as the round lengthens. `THE HEADS TAKE
TURNS, DRIVEN` in `tests/hydra.test.ts` throws six volleys at five heads and holds that they are
acid, flame, the laser, frost, void and acid again, and three at two heads alternate.

**Five heads in five kinds, and every kind already existed.** Acid sprayed (0248); flame sprayed
(0249); a laser, which is a beam (0250) from a side head, nine units off the hull's centre; a wall
of frost (0253); a ring of void. The hydra was the reason four of those inks were written as
meaning inks rather than as one boss's colour — each of its heads is *this will burn you*, *this
will take you*, *this will slow you* — and this decision spends them. `THE LASER HEAD` holds that
the beam leaves the side of the hull and not the middle.

**A head is any attack but `heads` or `rake`, by type.** The first would be a round inside a
round; the second shares `firePhase`, the field the round counts on. `Exclude` on the union says
so at compile time, and `THE FIVE HEADS` walks the table for it anyway.

**`throwAttack` is a function.** The tail of `stepBoss` — every arm of `BossAttack` and the
`never` that closes it — is cut off at the point where the gate ends and the throw begins, so a
head's attack is the same function called again with that head's shot. The cut moves no line of
any arm.

## The figures

| phase | heads | cadence |
|---|---|---|
| whole | acid, sprayed in three | 72 steps |
| 80% | + flame, sprayed | 66 |
| 60% | + a laser from a side head: 0.4 s warning, 0.4 s held, 6 wide | 60 |
| 40% | + a wall of frost, four either side | 54 |
| 20% | + a ring of six void | 48 |

At five heads a head's turn comes round every four seconds.

## ⚠️ What was rejected

**Every head at once.** Five attacks in one step is one burst wearing five inks, and the player
reads none of them; five attacks in turn are five attacks. The cost is that the round slows each
head — which the cadence pays for, and the figure above bounds.

**A second attack slot on the phase.** *"Adds"* is not two; it is one more each fifth, and a fixed
number of slots is the phase table growing parameters — the thing `src/content/bosses.ts` opens by
refusing.

**A head drawn.** The hull is one bitmap (0022) and a phase changes what a boss does, not how it
looks (0111); five heads in five inks are what the player sees grow.

## What is owed

- **An eye on the round at the shipped camera**: whether five kinds in four seconds read as one
  creature with five heads or as five bosses taking turns.
- **The hydra's laser ink.** A beam strokes in the enemy's hostile ink (0250); the hydra's is its
  third head's and would want its own, which is a `setBolt` colour per bolt kind.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). Content, one attack arm, one
function cut from another; nothing persisted.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0254`:

| broken on purpose | went red |
|---|---|
| the turn never advanced, so the first head throws every volley | `THE HEADS TAKE TURNS, DRIVEN` |
| a head's shot ignored, so every head throws the row's acid | `THE HEADS TAKE TURNS, DRIVEN` |
| the round not going round, so the sixth volley has no head | `THE HEADS TAKE TURNS, DRIVEN` |
| the 80% phase authored with the first head only | `THE FIVE HEADS` |
| the laser head's beam authored from the middle of the hull | `THE LASER HEAD` |
