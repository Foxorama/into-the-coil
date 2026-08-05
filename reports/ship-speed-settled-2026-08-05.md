# Step 1 resolves to no change, and half the threat model has never threatened

**2026-08-05.** The tuning pass
[`reports/drag-feel-2026-08-05.md`](drag-feel-2026-08-05.md) deferred three things onto, taken
against the merged combat slice on staging. **`SHIP_SPEED` and `SCROLL_PER_STEP` are settled at 1.7
and 0.6 and are not moving.**

## The verdict

> *"I'd currently say the difficulty level is intro > 50% of the first level. Very easy to dodge and
> fly around, but requires active choice and concentration — only time I got hit was when I
> accidentally flew over an enemy ship. This is probably a good starting difficulty for us to build
> on with adding more enemy types, more waves, bosses and increasing level difficulty. Especially
> with special weapons, weapon upgrades and all that factored in."*

That is a **placement on a curve**, not a complaint, and it is the answer step 1 existed to get. A
first level that demands attention and rarely kills is what this genre opens with.

## The numbers it was taken against

Measured off the real frame at 844×390, not divided by hand.

| | |
|---|---|
| `SHIP_SPEED` 1.7 | 102 units/s · 398 px/s |
| `SCROLL_PER_STEP` 0.6 | 36 units/s · 140 px/s |
| cross the full dodge lane | ~0.86s |
| the field replaces itself every | 6.0s |
| drifter: far edge → the ship | 4.9s |
| lancer: far edge → the ship | 3.1s |
| aimed shot from half a screen | arrives in 0.93s |
| room the ship can cover in that | **95% of the lane** |
| room it actually needs to clear | **2.9%** |

## What is settled, and what that unlocks

**`SHIP_SPEED` is the reference the rest of the game is authored against**, and it now has a hand
behind it rather than a genre guess. Everything the ordering said was waiting on it is released:

| | |
|---|---|
| ship inertia | step 2, unblocked. Still its own decision, still reverses `flight.ts`'s *"response is immediate"* |
| `DRAG_GAIN` | step 3, still after inertia |
| the scroll rate | settled with `SHIP_SPEED`, as one knob with two halves |
| level content | safe to author — the constants underneath it will not move |

⚠️ **This does not freeze the scroll rate per level.** A later, deeper level running faster is
ordinary escalation and nothing here forbids it —
[0023](../docs/decisions/0023-the-long-axis-is-the-scroll-axis.md) fixes the dodge lane and clamps
the lookahead, not the rate. What is settled is the **baseline**, and `SHIP_SPEED` specifically:
moving that re-opens every number downstream of it, which is the whole reason the ordering put it
first.

## The thing inside the verdict that was not asked about

> *"the only time I got hit was when I accidentally flew over an enemy ship."*

⚠️ **Every hit in the session was CONTACT. Not one enemy shot landed.**

That is not luck, it is the 95%-versus-2.9% line above: an attentive player has roughly thirty times
the room they need to leave the line of an aimed shot. So the difficulty being endorsed here is
**positional** — navigating a field of bodies — and the *bullet* half of the threat model contributed
nothing to it.

Which matters, because `docs/game.md` describes the opposite: *"the skill is in surviving the
onslaught"*, and the Jörmungandr fight it is modelled on is a bullet fight. Two consequences worth
stating before content is authored on top:

- **`spit`'s speed and `lancer`'s fire rate have never been felt.** They are still the reasoned
  starting points 0034 shipped. They were not validated by this session; they were *bypassed* by it.
- **Contact is currently the primary threat and shots are decoration**, which is inverted for the
  genre. Ramming costs 2 of 5 health; a shot that never arrives costs nothing.

Neither is a `SHIP_SPEED` problem and neither re-opens step 1. Both are **content-layer** numbers —
volume, cadence, angle, speed — and the honest place to settle them is a wave that actually puts
shots in the air, not another pass over the flight constants.

⚠️ **Named here rather than fixed here**, because the fix is more shots and better-placed shots,
which is the wave table that does not exist yet. Turning up `spit` in isolation would be tuning a
number against a scene that was never designed to test it — the failure the ordering exists to
prevent, one layer down.

---

## What this closes

The trigger named in `reports/drag-feel-2026-08-05.md` is fully discharged. Of the three deferrals it
put on one build: the scroll rate is settled, `DRAG_GAIN` is released to step 3, and ship inertia is
released to step 2 with a settled reference underneath it.
