# 0036 — An event the model knows about, the picture mentions

**Accepted 2026-08-05.** From a play-test asking for a destruct animation, and from three reports in
a row whose common shape only became visible once they were lined up.

## The rule

**If the model knows something happened, the screen says so.** Not *how* — that is art, and it is
tuned by a hand. But an event that the simulation resolves and the picture never mentions is a bug
the player will report as a different bug, every time, and correctly.

## The evidence is three reports and one shape

| report | what was said | what was missing |
|---|---|---|
| [combat legibility](../../reports/combat-legibility-2026-08-05.md) | *"I thought it was a bug that bullets hit an enemy and the enemy didn't get destroyed"* | a survived hit had no picture |
| [enemy silhouettes](../../reports/enemy-silhouettes-2026-08-05.md) | *"sometimes they looked like they just disappeared"* | a death had no picture |
| [enemy legibility](../../reports/enemy-legibility-2026-08-05.md) | *"sometimes they'd get hit… other times they appeared to just die straight away"* | a *second* hit had no picture, because the first one's flash was still running |

Every one was reported as a *collision* bug. In all three the collision was correct, every assertion
was green, and what was wrong was that a true event was never drawn. That is
[0027](0027-measure-the-picture-not-the-model.md) — *measure the picture, not the model* — arriving
from a direction 0027 does not cover: its own subject is a picture that **moves wrongly**, and this
is a picture that is **silent**.

⚠️ **A silent event is worse than a wrong one**, because a wrong one is visibly wrong. A silent one
sends the player looking for the bug in the mechanic that did work.

## What landed

**A destruct burst.** A pooled scatter of shards from the point of death, with per-fragment speeds
and lifetimes, retiring on their own timer rather than waiting for the camera. Measured on the
shipped page: 64 → 46 → 19 → 14 → 2 → 0 blits per 50ms, so the tail thins rather than switching off.

⚠️ **It was asked for as a diagnostic before an effect**, and that framing is the right one: *"it's
going to help a lot with future testing, identifying hits or whether things mysteriously disappear,
debris lasting time"*. It makes three previously-identical pictures distinguishable —
*it died*, *it drifted off the edge*, and *the collision missed and it is still there* — and it puts
a visible clock on the screen for how long anything lasts.

**The budget was already written for it.** 0022's worst-case scene is *~150 enemy bullets, ~80
player projectiles, ~40 enemies, ~200 particles*. The particle share had been unclaimed and
`mount.ts` said so rather than quietly redistributing it. Debris claims exactly that 200; the total
is 471 and the 500-entity frame budget has not moved.

**The ship blinks yellow again.** It briefly went white when the flash was generalised from the ship
to everything, and a play-test asked for the yellow back. It is the better answer for a reason worth
recording: the ship's blink means *you cannot be hurt right now* and an enemy's flash means *this
just was*, and those are opposite meanings. One ink for both is one channel carrying two things,
which is what [0024](0024-the-accessibility-floor-is-settings.md) exists to prevent — and it also
retires, without a third sprite, the hypothesis
[0035](0035-damage-is-legible-on-the-body-that-took-it.md) flagged and declined to build on.

## Three things the code decides that are easy to get backwards

**A death position is recorded BEFORE the release.** `Pool.releaseAt` swaps the last live item into
the freed slot, so a released slot is the next thing `spawn` hands out — read the corpse afterwards
and you get whatever moved into the hole, or whatever was spawned into it two lines later.

**`sim/` reports the death and does not act on it.** `collideInto` fills a pre-allocated `Deaths` log
and returns; `src/app/frame.ts` decides that a death is worth eight fragments. That is
[0015](0015-the-layer-ladder.md) rather than taste: `sim/` may import `brand` and nothing else, so it
cannot know what debris is. An out-parameter rather than a returned array because the alternative
allocates on the densest step of the game, and rather than a callback because a callback is a closure
in the same place plus a way to tell `sim/` what to do.

**Debris is cosmetic because it is in no PAIRING, not because its radius is zero.** Reach is the sum
of two radii, so a zero-radius fragment inside the ship still overlaps. What makes it inert is that
`collideInto` and `collideIntoOne` take the two sides they may test as arguments — a pool nobody
passes can never touch anything. The test drives the real frame with every fragment parked on top of
the ship rather than asserting the radius.

**And `lifeFor: 0` means no lifetime, not "expire now."** Every ship, enemy and shot leaves it at
zero; only debris counts down. The alternative — `-1` for immortal — puts a sentinel in a field that
is otherwise a plain count.

## Rejected: fading the fragments out

The obvious polish, and it needs an alpha on `blit`.
[0022](0022-frame-rate-is-a-feature.md) warns that the painter interface must not grow a verb that
hides work, and while `globalAlpha` is cheap, the seam is currently *model and state in, pixels out,
one verb*. A spread of lifetimes buys most of the same read — the burst thins rather than vanishing —
for no change to the interface at all. If fading is wanted later it is a painter decision with its own
argument, not a thing to smuggle in behind a particle effect.

## Rejected: clearing debris on a restart

`restart` empties the enemies and both shot pools and deliberately leaves the debris. The burst
marking where the ship died is the clearest signal in the game that a run has ended, and wiping it on
the same step deletes the explanation along with the cause.

## What this deliberately does not decide

**How a death should look.** Eight fragments, 0.35–1.15 units per step, 18–34 steps of life: every
one is a starting point and nothing asserts one, on the same terms `src/sim/flight.ts` sets for
`SHIP_SPEED`. What is guarded is that a death produces debris, in the right place, that goes away on
its own.

**A miss still draws nothing**, so a near miss and a wide miss look the same. Named in
`reports/enemy-legibility-2026-08-05.md` and left, because unlike the three above nobody has yet
reported it as something else.

---

## Confirmed, not assumed

Per [0005](0005-a-guard-must-be-seen-to-fail.md) and [0019](0019-a-probe-must-be-seen-to-apply.md),
declared in `scripts/probes/0036-debris.mjs`.

⚠️ They started out inside 0035's probe file, because the two decisions guard one surface — and
`tests/prove-guard.test.ts` refused it: a decision that carries a *"Confirmed, not assumed"* table
must have a probe file of its own, or `npm run prove 0036` re-runs nothing and the table is a claim
about a session nobody can repeat. The guard was right and the file was split.

| broken on purpose | went red |
|---|---|
| a death leaving nothing behind, so the screen cannot tell dying from vanishing | `an enemy that dies leaves fragments where it died` |
| the death position never recorded, so a burst lands wherever the log was last left | `an enemy that dies leaves fragments where it died` |
| debris waiting for the camera to cull it rather than retiring on its own timer | `the fragments retire themselves, without the camera having to pass them` |
| the burst drawing from the spawn stream, so blowing something up rebuilds the level after it | `the burst rolls on its own stream, so an explosion cannot move a wave` |
| the ship blinking to the same ink an enemy flashes | `every enemy kind has a hit sprite that is not its ordinary one` |
| the baking order and the blit index disagreeing, so every entity draws as the wrong thing | `every kind blits at the index its baking order gives it` |

⚠️ **The stream guard was written twice, and the first version was a tautology the harness caught.**
It drained a stream the test had constructed itself and checked the other had not moved — which
proves `Rng.stream()` returns independent streams, a thing `tests/rng.test.ts` already owns, and says
nothing about which stream the *game* reaches for. The second version drives the real frame until a
burst has actually happened and requires the spawn stream to be exactly where an untouched world's
is. **That is the third assertion in two sittings that was green against the implementation it
existed to reject**, and all three were found the same way.

⚠️ **A near-miss worth recording because no probe would have caught it.** `SPRITE_KINDS` is the
baking order and `SPRITE` is the blit index, and they are two descriptions of one fact that nothing
type-checks — adding `debris` to the middle of one list and the end of the other made every entity in
the game draw as something else. Caught by reading, and now held by
`tests/combat.test.ts`: every kind blits at the index its baking order gives it.
