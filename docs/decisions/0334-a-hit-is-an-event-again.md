# 0334 — A hit is an event again

**Accepted 2026-09-18.** **Amends [0278](0278-the-flash-is-a-wash.md)** — the wash keeps its strength
and gains a refractory gap. **Serves [0035](0035-damage-is-legible-on-the-body-that-took-it.md)** —
a body that is white for a whole fight is the one state in which a hit is not legible. **Builds on**
[`the-bosses-planned`](../../reports/the-bosses-planned-2026-09-16.md) item 1, which diagnosed this
and queued it first.

## The ask

> *"How's the hit register on the boss? Does the boss still show or is the hit register too opaque
> with lots of bullets?"*

## The answer, measured

`scripts/weigh-flash.mjs`, driving real fights against the gyre and reading the share of steps the
hull is drawn as `spriteHit`:

| gun | washed, before | longest unbroken wash, before | after |
|---|---|---|---|
| pulse t4 | **97%** | **28.03 s** — the whole fight | 24%, 0.05 s |
| shuriken t1 | 87% | 9.52 s | 21%, 0.05 s |
| shuriken t4 | 69% | 1.87 s | 21%, 0.05 s |
| arc t4 | 34% | 0.05 s | 17%, 0.05 s |
| pulse t1 | 37% | 0.05 s | 19%, 0.05 s |

**So: no, it did not still show.** At the design loadout the player was fighting a repaint of the
cog, not the cog — and 0332's three worn bodies, its spike and its housing had never been seen in a
fight by anybody.

## The rule

**A flash cannot be re-armed while it is on, or for a gap after it.** `Entity.flashGap`, counted down
beside `flashFor`; `flash()` in `src/sim/collide.ts` is now the one place a hit arms the picture and
it refuses while the gap runs.

**The gap is a RATIO of the flash and not a second absolute.** `FLASH_GAP_DUTY` is 2 — two gaps for
every flash — so four steps on becomes four on and eight off, whatever `flashSteps` a caller passes.
Seventeen call sites pass the first number; a second absolute here would have to be kept in step with
it by hand.

**It gates the picture and never the damage.** Every landing inside the gap takes health exactly as it
did. `THE CLAIM: a shot that lands while the target is flashing still counts` is untouched and still
green.

**The ship is deliberately not routed through it.** `wound` carries `invulnFor`, which already stops
the ship being hit again, and its recovery blink is a different signal (0035).

## ⚠️ What was rejected

**Lowering `FLASH_WASH` again.** 0278 measured a quarter as the strength at which a hit stops
registering at all, and 0.55 was chosen over the cutout on play evidence. There is no strength that is
both visible once and survivable a hundred times — the defect is the DUTY, and a duty is a second
number.

**A per-row duty.** [0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md)'s test
asks whether the output is identical for every kind, and here it should be: *a hit reads as a hit*
is a property of the game rather than of an animal. This is 0282's DEFAULT shape — shared code holds
it, a row could say otherwise, and none needs to. The report that queued this reached the same
answer.

## ⚠️ And it broke the arc within the hour

**`flashFor` was doing two jobs and one of them was invisible.** `nearestFrom` skips *a body that is
flashing* so the arc's chain cannot land twice on one enemy — the next link searches from the body it
just struck, which is the nearest thing to itself. That worked because a landing ALWAYS armed the
flash. The moment a landing stopped always arming it, the chain started finding what it had just hit:
`tests/weapons.test.ts` reported **three links stroked as one**, because two of them were
zero-length.

**So the chain's rule is now the chain's own field.** `Entity.struckIn`, set on every landing
including the ones the flash refuses, and `skipFlashing` is `skipStruck`. *Do not land twice on one
body* is about damage; *do not repaint a body that is already white* is about the picture. They
agreed for three hundred decisions, and `src/sim/entity.ts`'s own note about `spriteBase` says why
that is not a reason to share a field: **a third number is cheaper than an invariant two call sites
have to remember.** The arc's time-to-kill matrix is unchanged, because `struckIn` is the number
`flashFor` used to be for this reader.

## What is owed

- **Every art verdict that was waiting on this.** 0318–0320's fish, 0332's cog and the serpent's
  residual have never been seen in a fight. That is a play question now rather than a blocked one.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). One field on an entity and one
helper; nothing persisted.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0334`:

| broken on purpose | went red |
|---|---|
| the refractory gap never armed, so every landing re-arms the wash | `A HIT IS AN EVENT AGAIN` |
| the gap armed and never consulted | `A HIT IS AN EVENT AGAIN` |
| the gap never counted down, so a body flashes once and never again | `A HIT IS AN EVENT AGAIN` |
| the duty bought by shortening the flash itself | `a single hit still flashes for its whole window` |

⚠️ **AND THE THIRD OF THOSE FOUND A CLAIM THE GUARD HAD NOT MADE.** A refractory that never expires
reads exactly like this one from the duty side — the body is seen 99% of the time — and it is 0035's
defect restored, because only the first hit ever shows. The guard counts how many times the lit state
STARTS now, which is the distinction `an impact and a recovery are two signals` already turns on.
