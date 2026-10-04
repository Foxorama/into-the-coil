# 0519 — The beast lights thrice

**Accepted 2026-10-05.** Found by the flash meter ([0457](0457-the-flash-cap-is-measured.md)), measuring
`main` before the loud pass that decision owes. Amends [0486](0486-the-neck-bends.md)'s *the whole animal
flashes as one*.

## What was found

`node scripts/weigh-flashes.mjs` on `main`, 1280×720, vivid, 4-pixel cells — every scenario under the cap but
one:

| | worst second | peak area |
|---|---|---|
| hydra at 15%, under the arc | **7 to 9 flashes** (15 to 18 transitions), three runs | 13.4–13.9% |
| hydra at 50% | 0 flashes | 10.7–11.2% |
| everything else | at most 1 flash | |

[0024](0024-the-accessibility-floor-is-settings.md)'s cap is three general flashes in any one second, and it
is the one item of the floor that is not a setting. This was over it on every run.

**What was flashing**, from the canvas itself, step by step: the whole animal — body, every neck, every
collar, every head and the tail — in its pale hurt twin for a step, then in colour, then pale again, about
every third step. Lit, the animal at five heads is an eighth of the screen, over WCAG's general-flash area of
11.1%. At 50% it has fewer heads and sits on the line.

**Why**: 0486 made the animal flash as one, lighting every piece whenever *any* piece's `flashFor` is on.
Each piece keeps [0334](0334-a-hit-is-an-event-again.md)'s duty — four steps on, eight off — but a duty is per body.
The arc lands on the hull and five heads in turn, each free to flash on its own schedule, and the OR of six
duties is a strobe. 0486 was written after 0457 measured `main`, so nothing had weighed it.

## The rule

**A many-headed boss keeps its own flash, and it lights at most three times a second.** `layNecks` lights the
animal when a piece is struck and the animal is free to light, for one impact's length
(`IMPACT_FLASH_STEPS`), then holds it dark until a third of a second has passed since it lit
(`BEAST_RELIGHT_STEPS`, 20 steps). The body's sprite follows the animal both ways: before, the hull's own
flash showed it lit while the rest was dark.

Each piece's own `flashFor` is untouched. The wash's gap (0334) and the shed (0480) read it as an event on
*that* body, and they still do.

### Why a third of a second and not 0334's duty

0334's duty was set for legibility, *"seen two thirds of the time under any gun,"* and 0457 refused to trade it
for a reading from a coarse instrument. This is not that trade. The reading is at 4-pixel cells and repeats,
and the duty is not what failed: the animal escaped it by being six bodies. The cap is WCAG's own number — no
more than three flashes in a second — so the animal relights on that and on nothing tighter. Lit for four
steps in every twenty, it is seen in colour four fifths of the time, more than 0334 asks.

### Why only the hydra

The rule rides `layNecks`, which only a boss with necks runs. No other scenario on the meter reached the general
area: outside the hydra the largest area changing together was 9.3%, the pterodactyl at 50%. A boss that grows past it later
will show on the meter, and its flash is then that boss's to answer
([0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md)).

## After

The same meter, the same scenarios, two runs:

| | worst second | peak area |
|---|---|---|
| hydra at 15% | 2 flashes (4 and 5 transitions) | 13.3–13.4% |
| hydra at 50% | 0 | 10.7% |
| hydra at 100% | 0 | 7.4% |

## Guards

`tests/hydra.test.ts`, *0519 — the beast lights at most three times a second*, **in seconds**: the hydra at
five heads, a different piece struck every step through `strike` (so each piece's own duty refuses what it
would), for four seconds. In every one-second window the animal turns lit or dark at most six times, and it does
light.

An invariant ([0192](0192-a-guard-holds-an-invariant.md)): no change to the content could redden it and be
correct, because the cap is the floor.

## Seen to fail

[0005](0005-a-guard-must-be-seen-to-fail.md). `scripts/probes/0519-the-beast-lights-thrice.mjs` removes the
animal's gap, so any struck piece relights it: red, 10 transitions in the worst second. 0486's *body not lit
by a hit on a head* probe is re-anchored on the body's new line, breaking the same thing — the body lit only
by its own hit — and is still red.

## Owed

- **A play of the hydra at five heads.** The hit feedback on the whole animal is a third as frequent as it
  was. Each hit still counts, and the arc still shows where it lands.
- **The loud pass 0457 owes**, which this was measured ahead of.

## Rollback

⚠️ **None owed** — [0001](0001-revertability-not-risk-rating.md). Nothing persisted.
