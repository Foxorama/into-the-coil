# 0386 — Every phase is fought for as long

**Accepted 2026-09-27.** Where an end boss's phases turn is solved so each is fought for about the same
time. Quetzal, Volans, the hoarfrost and Medusa are re-banded from `scripts/solve-phase-bands.mjs`; the
gyre, the hydra and the serpent keep the shares they were asked for, which already fight even.
`scripts/weigh-boss.mjs` stops a fight at the kill.

## The ask

> fight definitely feels too fast near the end, it's supposed to be 20% increments, but it feels like
> each increment goes faster, similar for a couple of other bosses

Asked of the hydra after [0385](0385-the-hydra-is-bigger-and-sprays-harder.md). When asked how to answer
it across the game: *"Equal time per phase"* — every phase about as long as the others, rather than every
band the same share of the bar.

## What was measured

Every end boss flown by every gun from `scripts/weigh-boss.mjs`'s fifteen held places, the best of them
split at the phase boundaries. Seconds a phase, pulse, before this:

| boss | bands | seconds |
|---|---|---|
| Quetzal | 34 33 17 16 | 41, 41, 18, 18 |
| Medusa | 25 25 20 10 20 | 19, 20, 15, **8**, 20 |
| Volans | 28 26 24 22 | 11, 11, 10, **17** — and 25 on the arc |
| the hoarfrost | 30 25 25 20 | 46, 43, 42, 33 |
| the serpent | 30 30 40 | 19, 21, 27 |
| the gyre | 25 25 25 25 | 12, 12, 12, 12 |
| the hydra | 20 20 20 20 20 | 12, 11, 11, 11, 11 |

**The four that were uneven were authored that way.** A band of health is a length of fight only if the
boss takes damage at the same rate in every phase, and Quetzal's last two phases were half-bands.

**The hydra is even for the pulse and the arc, and not for the shuriken**, which ran 7.1, 6.4, 4.3,
4.0 and 3.7 seconds across its five. A blade lands once per flash wherever it is (0234 —
`src/sim/collide.ts`'s `landIn` is the blade's own), so this is not a blade billing several heads at
once. Five heads are more area for a coil of blades to cross while a pulse aimed at one head lands the
same in any phase, which fits — **not measured**, and the gyre below says it is not the whole of it.
**No band answers both guns**, and the
two that fight it evenly are the two the band would have to be wrong for. The gyre's first phase is
the same shape on the shuriken alone — 5.3 seconds and then 3.5, 3.3, 3.3 — on a hull that neither
moves nor changes size, so it is not area there; **why is not established**, and it is owed before the
shuriken is tuned against any boss.

## What changed

- **Solved:** Quetzal to 25 25 25 25, Volans to 31 25 29 15, the hoarfrost to 26 25 24 25, Medusa to
  19 21 20 19 21. Each band is set so the three guns' average share of the fight is the same in every
  phase — averaged as shares of each gun's own fight, because an average of rates let the fastest gun
  outvote the others. Flown again on the new bands, the pulse runs 30, 30, 30, 29 on Quetzal and 15, 16,
  15, 15, 23 on Medusa, whose last phase is `open` at double damage in a window the pulse is poorest at
  finding; the arc runs 10, 11, 11, 11, 11 there.
- **Not moved:** the gyre (its wheel rises at the quarters, [0332](0332-the-gyre-is-set-into-the-wall.md)),
  the hydra (a head a fifth, [0254](0254-the-hydra-grows-heads.md)) and the serpent (the ball below four
  tenths, [0365](0365-the-serpent-is-shorter.md)). The solver reports
  them and would move them; the shares were asked for, two of them fight even, and the serpent's long
  phase is its last, which is the opposite of the report.
- **The bar's notches move with the bands** (`src/app/chrome.ts` cuts one at every `upTo`), so on the
  four re-banded fights they are no longer evenly spaced — they say where the turn comes, which is what
  they are for.

## The instrument was wrong about the end, and is not now

`flyFight` counted a fight as over when the boss pool emptied. When the gyre's hull dies another of its
bodies is copied into the pool's first slot and stays for eight and a half seconds at six tenths of the
hull's health, so the fight came back as its second phase again at the end: its fourth phase read as
twenty seconds and the first solve cut its band to six percent. It now reports `killed`, the first step
that slot holds another kind, holds nothing, or holds more health than the hull had — a pool copies a
body into the slot that emptied, so the slot is the same object either way — and counts no phase after it.

## Not held by any guard

**That the phases are even.** A phase's length is a property of the gun as much as the boss, as the hydra
shows, and a guard would have to choose a gun or an average of them and would then pin a boss whose
climax is meant to be short — the change that reddens it correctly is a design choice. The solver is the
instrument and prints every boss; re-run it after anything that changes what the guns land.

**Also not answered by bands: a special.** A thrown special lands a share of the boss's *full* health —
five to ten percent ([0372](0372-a-death-keeps-the-ladders.md)) — so two or three held for the end
empty a fifth of the bar each time. That is the player spending what they saved, and no band moves it.

No rollback note: no storage key, save schema, cache prefix or origin is touched.
