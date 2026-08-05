# Two levels, played — 2026-08-06

The first play-test of a build with a run in it: a title screen, three lives, six enemy kinds, two
authored levels of about three minutes each, pickups, and a unique boss at the end of each.

**Verdict: *"it's playing really good at the moment, excellent baseline."*** Four findings came back
with it. All four are fixed; this file is the evidence, and the rules they produced are in
[0043](../docs/decisions/0043-a-weapon-is-a-budget-and-a-level-opens-empty.md) and
[0045](../docs/decisions/0045-the-player-can-see-what-they-are-carrying.md).

---

## 1. The opening row of enemies was on top of the player

> *"The initial row of enemies is too close to the player. The initial first screen should have no
> enemies so that the player can orient themselves and test out the ship speed and controls."*

Both levels opened with a wave at `at: 60`, which is inside the view on every device — the ship flies
at 40, and the narrowest lookahead is 150.

**Fixed at 300**, which is past `MAX_ALONG_SPAN` and therefore off screen on the widest device as
well as the narrowest.

⚠️ **A 16:9 player gets about four seconds of quiet and a 21:9 player about two**, and no level can
author that difference away: a wider screen sees further, which is the trade
[0023](../docs/decisions/0023-the-long-axis-is-the-scroll-axis.md) makes to keep the dodge lane
identical.

## 2. The weapon stuttered at a full loadout — and it was pool exhaustion

> *"If you get too many weapon upgrades the weapon fire seems to get to two streams of bullets are
> continuous and the other streams slow down and it's a bit weird."*

Measured before anything was changed, by driving the real frame with hand-built loadouts:

| spreads | rapids | barrels | fireEvery | peak in flight | steps at the cap, of 900 |
|---|---|---|---|---|---|
| 0 | 0 | 1 | 9 | 12 | 0 |
| 2 | 2 | 3 | 5 | 66 | 0 |
| 5 | 5 | 6 | 4 | **80** | **284** |
| 11 | 10 | 12 | 4 | **80** | **280** |

The pool was 80. At a full loadout it stayed full for a third of every run, and `fireShip` spawns a
fan in order and returns on the first refusal — so the **early barrels always fired and the later
ones did not.** That is the asymmetry the player saw, and it follows from spawn order rather than
from anything about rendering or timing.

⚠️ **Four numbers had to agree and none of them knew about the others**: barrels, fire floor, shot
lifetime, pool size. `barrels × life / fireEvery ≤ pool` is the whole of it.

**Five barrels was tried and rejected on a measurement**: exactly 100 in flight against a pool of
100, which is no headroom at all. Four gives 80 against 100.

Also found here, and fixed in the same change: a player shot used to live until the leading cull —
**80 units past the furthest edge of the furthest screen**, so about a third of every bullet's life
was spent where nobody could see it, holding the slot the next volley needed.

## 3. No readout of lives or shield

> *"In game we need a life and shield tracker icons so the player has a clue."*

Nothing on screen said how many lives were left or how much damage the ship could still take.

## 4. Nothing said what a pickup was for

> *"On the intro starting screen we need a quick user key of what each upgrade does. We don't need a
> key for the enemies, but knowing that the upgrades are good pickups is important."*

The asymmetry is the interesting half and is kept in
[0045](../docs/decisions/0045-the-player-can-see-what-they-are-carrying.md): an enemy announces
itself by shooting at you, and a pickup announces nothing — it is a small shape in a lane, and
crossing the lane to reach it costs position.

---

## A guard failure that was called flaky, and was not

Not from the play-test — from the harness — but it belongs with this round because the fix landed in
it.

`tests/frame.browser.test.ts`'s *moves — the frame after is not the frame before* failed once during
`npm run prove`. The first response written down was *"that browser failure was flaky"*, with no
investigation. The player refused it:

> *"There is no flaky — tests can be brittle on purpose, but if there's a flaky test, let's test that
> better. Flaky is an escape excuse."*

**The first theory was aliasing**, and it was wrong. Auto-fire has a period of nine steps (150ms) and
the test sampled 600ms apart — exactly four periods — on an opening screen that had just been
emptied, so the only moving thing was a periodic bullet stream. Elegant, and it would have made the
emptied opening the cause.

Driven sixty times:

| sample gap | identical frames |
|---|---|
| 600ms — four fire periods | **0 of 6** |
| 130ms — not a multiple | 1 of 6 |

The renderer interpolates between steps by a wall-clock fraction
([0022](../docs/decisions/0022-frame-rate-is-a-feature.md)), so drawn positions never quantise to the
step and the picture is not periodic at all.

**The real cause: the test measured wall clock and meant frames.** `npm run prove` runs the suite once
per probe — 172 vitest invocations — so the machine is saturated and a headless page's
`requestAnimationFrame` is starved. 600ms elapses, the loop barely advances, the canvas is unchanged.
Nothing about the game was wrong, and **the load that exposed it was this project's own harness.**

Replaced with sampling on consecutive animation frames, taken inside the page:

| state | result |
|---|---|
| frozen — all four frames identical | **5 of 5** |
| playing — some frame differs | **5 of 5** |

The rule is [0044](../docs/decisions/0044-an-intermittent-guard-is-measuring-the-wrong-thing.md).

⚠️ **Had the fix gone in on the aliasing theory it would have "worked"** — any change to the sampling
interval makes the symptom rarer — and the actual fault, a guard that cannot survive its own harness,
would still be there.

## And a cost that was traced rather than accepted

CI's `test` job went from ~5m to ~10m when the readout guards landed. Two of them each waited ~12s for
the fixture to be hit — a direct consequence of finding 1, which emptied the opening screen.

⚠️ **A wait inside a suite is multiplied by the number of probes naming that suite**, because
`npm run prove` runs the whole file each time. It is a per-probe cost, not a per-test one. The two
guards observe the same event, so they now wait for it once: the suite is **15s, down from 27s**, and
CI is back to ~8m.

## What this build still has not been asked

Recorded in `docs/state-of-play.md`, which holds the questions; this file holds the answers that came
back. The largest one outstanding: **nothing on screen says how much boss is left**, by decision —
[0040](../docs/decisions/0040-a-level-is-a-script-and-a-boss-is-its-clock.md).
