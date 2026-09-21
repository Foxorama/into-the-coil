# The night of 2026-09-21 — the corridor turns, Rime Shelf is ice, the Mire is a swamp, and a question about forks

**For the morning.** Asked at the end of the day: *"go full auto and get as much done overnight as you
can"*, on 4b's order — the rules, then the corridor turns per tier, then forks. What landed, what is
owed, and the one question that stopped the third step.

## What landed

| | what | where | owed |
|---|---|---|---|
| [0349](../docs/decisions/0349-the-stone-bites.md) | the stone is solid: a wall hit is one hit and pushes out; shots and blasts stop at stone; bodies burst on it and score nothing | #393, merged | a play |
| [0350](../docs/decisions/0350-the-corridor-turns.md) | the Labyrinth's corridor turns, per tier — 56 / 44 / 34 at its narrowest | #394, merged — on staging | **a play on each tier** |
| [0351](../docs/decisions/0351-rime-shelf-is-ice.md) | Rime Shelf is ice: faceted bergs, a serac cliff in aqua and slate, snow where it rained | #395, merged — on staging | **a play, and a decision about white** |
| [0352](../docs/decisions/0352-the-mire-is-a-swamp.md) | The Toxic Mire is a swamp: the canopy raised to a ceiling, drowned trees in murk, acid pools lit from within — **not the bubbles yet** | the PR carrying this line — its preview is on the PR | **a play**, above all the pools and the shoreline |

## The question that stops forks

**Forks were not built, because the plan and your numbers disagree and only you can say which wins.**

The plan said a fork's two ways should each be *at least 30 wide*. Your answer then set each tier's
*narrowest* — 56 legendary, 44 savior, 34 burn. The lane is 88 wide between the ship's clamps, and an
island needs at least a tile of stone (12) to read as stone:

| tier | two ways at the tier's narrowest, plus an island | fits in 88? |
|---|---|---|
| burn | 34 + 12 + 34 = **80** | yes |
| savior | 44 + 12 + 44 = **100** | no |
| legendary | 56 + 12 + 56 = **124** | no |

So one of:

1. **Narrowest is per way — forks on burn only.** Savior and legendary fly the same corridor with the
   islands left out. Keeps your numbers exactly; two tiers never see a fork.
2. **Narrowest is the open width, both ways together** — at a full-width fork, legendary is two ways of
   28 either side of an island of 32; savior two of 22; burn two of 17. Every tier forks, but every
   tier's ways are narrower than its corridor, and burn's 17 is about two ships as drawn.
3. **A fork has its own minimum — the plan's 30 a way — on every tier.** 30 + 12 + 30 = 72 fits in 88,
   so every tier forks at 30 a way; each tier's *narrowest* then means *narrowest outside a fork*.

**Recommended: 3.** A fork is a choice, not a squeeze, and 30 a way is still three ships across as
drawn; the per-tier numbers keep meaning what they meant for the corridor. But it reinterprets your
*legend is 56*, which is why it was not built without you.

## The question about white

*"Let's go with an off-white balanced colour for rime shelf"* — and keep the floor and the foe inks.
Those two cannot both hold: every colour the land is painted in keeps every gameplay ink at 3:1, and
the darkest ink, `void`, needs what it crosses under luminance **0.083**. An off-white is about **0.8**.
So Rime's palest ice is a pale slate at 0.076 — as far as the floor allows, which is what the handover
said to do — and it reads as the light on the ice because everything round it is darker. If it does
not read as icy enough in play, the levers are yours: a brighter `void` and `fire` (which changes every
place's picture), or the floor. 0351 has the numbers.

## What was found along the way

- **A turn was a massacre the picture could not see.** The first turning corridor lost 75 bodies to the
  stone in one flight at burn — none shot — and the guard that watches for bodies *drawn* in stone was
  green throughout, because the stone removes a body before it can be drawn. The corridor counts its
  kills now and a fixture holds them at zero; now two bodies per flight, on every tier, both from waves
  that leave the box without any corridor. Each cause was fixed and guarded; one of them was 0348's own: a flanking charger crosses its wall going *backwards*, and left its passage by the near
  end.
- **0259's probe went STILL GREEN under the full proof**: with the corridor turning, the shoal's sower
  at 3232 no longer puts a bullet on the screen in the capped walk, so its break changed nothing. Why
  was not traced. The probe is re-aimed at the sentry column at 3003 (11.3s against a 9s budget).
- **The plan said Rime Shelf had the most contrast room of the seven. It had the least** (1.09×). The
  report is corrected in place.
- **Rime's first snow was a bullet wide** — 1.9 units against a shot's 1.8 — and 0222's guard caught it.

## The machine

Worktrees left for the morning: `C:\into-the-coil-turn` (0350, merged) and
`C:\into-the-coil-rime` (0351). The earlier ones kept yesterday are untouched.
