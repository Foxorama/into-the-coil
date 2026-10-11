# 0598 — The secret pilots, reviewed

**Accepted 2026-10-11.** The review asked for after the five items of
[`the-secret-pilots-planned`](../../reports/the-secret-pilots-planned-2026-10-11.md): *"do a full review of the
changes as an expert designer and expert quality analyst and review and implement changes."*

## The review

The review covered 0592–0595 as merged, read against the decisions that built them and against `CLAUDE.md`. Nine
findings came back. **Each was traced through the code before anything was changed**, and two were not defects
(below). The ones that were defects are all one class: **a mechanism that rode a neighbour's pass and took the
neighbour's terms with it.**

## What was wrong, and what it is now

| | was | is |
|---|---|---|
| **a dance and the gun** | the ram rides the gun's pool and was landed in the gun's pass, so while any ship danced the whole pool took the dance's log and gap: a ray's rings never burst, a paintball never splatted, a shuriken's ceiling fell to a third | `collideInto` takes `only`/`except` kinds: the gun's shots land at the gun's terms, and the ram in a pass of its own at its own gap |
| **a dance on a boss** | landed at the gun's weight, so the same special was 13× heavier for the ball (ram, 8) than for the Catherine ship (0.6) | the ball's ram at the gun's weight, as 0593 solved it; the dance on any other ship at the window, as the jet and a bomb are |
| **the jet's landing** | landed one step of the sweep ahead of its picture — about 4 units at the tip against a half-width of 2.2 — and not at all on its last drawn step | `landJet` lands the line `stepJet` laid (`jetLaid`/`jetLaidAt`) |
| **the jet's root** | its last place was set to this one, so it was drawn a step ahead of the muzzle at any display rate above the step's | its last place is the ship's last place, as the tether's is since 0551 |
| **the jet in a wreck** | played on from the released ship through the death beat | ends at the wreck, as the surge does |
| **the jet's ink** | `frost` — the frost ship's *this will slow you* — on the jet and its pickup's face, stroked over every bullet | a new role, `water`, the player's own (0081); stroked before the enemy shots, so every bullet stands over it (0295, 0373) |
| **the paint and the place** | 0595 checked its colours against the palette's red, but a hostile shot is the place's `foe.shot`: pink is The Approach's, Ember Nebula's and The Toxic Mire's bullet, and yellow is The Labyrinth's | each colour names the places it is left out of (`not`), argued on its own row; no place's hopper falls under two colours |
| **the crash hint** | *Crash into something N more times*: a crash a shield takes is not counted | *Lose N more lives to a crash* |

## Read and left as it is

- **Unity's bio**, *"drives none of them; rolls out in a hamster ball"*. This was read as contradicting their being
  a pilot, but it is the joke: they drive no ship; they roll.
- **The War Dance's face in `acid`**, a hostile ink. A pickup's face is not fire, and the bomb pickup's faces
  already wear meaning inks (the candle is `hazard`). 0081 is about what the player fires.

## Found, and not this review's to fix

**0541's pad guards are sensitive to load.** On #608's CI, and again locally, a probe of 0541 went red on the right
test in the whole-suite run after its filtered run stayed green. Run alone with the break, the guard reads 0 change
against 0 noise, four times out of four. Only inside `npm run prove`, with three trees driving Chromium at once,
does `samePhase` read the stand as changed when nothing reached it. The guard is measuring load as well as the pad,
which is 0044's case. **It is owed a fix in `tests/stand.ts`**, not a rerun.

## Rollback

Nothing irreversible: no key, no save field, no cache prefix.

## What guards it

`tests/dance.test.ts` (*a dance leaves the ship's own gun as it was, and weighs the same on a boss whatever the
gun*), `tests/duck.test.ts` (the jet's landing against its picture, its root, the wreck, its draw order and ink,
and every place's hopper), `tests/crashes.test.ts` and `tests/ball.test.ts` (the hint), and `tests/palette.test.ts`
(`water` placed among the meaning inks). Probes in `scripts/probes/0598-the-secret-pilots-reviewed.mjs`, one per
defect put back.

## Owed

- **A play**, of the War Dance on a boss from a ship that is not the ball, which now lands at the window's weight.
- **A look** at `water` on every place's backdrop, at the shipped camera.
- **0541's guard** under load, above.
