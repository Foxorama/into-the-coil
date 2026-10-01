# The night of 2026-10-01

What was asked at bedtime, where each piece is, and what is owed. Merging is the player's; nothing
here was merged.

## Where to play each thing

Previews sit behind Cloudflare Access.

| what | branch | preview | PR |
|---|---|---|---|
| the feedback on the roster, and the ward | `the-roster` | https://the-roster.into-the-coil.pages.dev | [#462](https://github.com/Foxorama/into-the-coil/pull/462) |
| the backdrop set deeper | `the-backdrop-is-deeper` | https://the-backdrop-is-deeper.into-the-coil.pages.dev | [#463](https://github.com/Foxorama/into-the-coil/pull/463), closed until #462 lands |
| each place's own enemies | `each-place-has-its-own-faces` | https://each-place-has-its-own-faces.into-the-coil.pages.dev | none yet |

⚠️ **Only one PR may be open at a time** —
[0033](../docs/decisions/0033-a-branch-starts-at-main.md),
[0075](../docs/decisions/0075-the-serialisation-is-checked.md). #463 was opened while #462 was open,
CI refused both, and #463 was closed so #462 could go green. The other two branches start at `main`.
After #462 merges, each is re-based in turn and opened one at a time.

## The asks, in order

| the ask | where it went |
|---|---|
| CI failed | It was the stranded probes: [0441](../docs/decisions/0441-a-pilot-flies-their-own-ship.md)'s third commit on #462. |
| side-view Firebird and estate, weapons on the hood, missile turrets on the roof | `the-roster` — [0441](../docs/decisions/0441-a-pilot-flies-their-own-ship.md), *Drawn from above — except the two cars* |
| the caddie side-on in the intro, lifting out of the hangar and tilting to top-down | `the-roster` — [0444](../docs/decisions/0444-the-intro-is-the-pilots.md) |
| Venoma's run removed from the intro | `the-roster` — [0444](../docs/decisions/0444-the-intro-is-the-pilots.md) |
| the caddie's ray in four-shot bursts | `the-roster` — [0442](../docs/decisions/0442-the-ray-gun.md), *four rings, then a breath* |
| the shield pickup was not rotating with the void | Correct: that change had not been built yet. It is now [0447](../docs/decisions/0447-the-ward-is-a-third-trigger.md) on `the-roster`. The shield pickup cycles shield, void and nova. E/X is the third button, and the nova ring is the caddie's. Burn's opening void and its mid-boss ward pickup are in, and the void is redrawn as a turning swirl. |
| Ember Nebula's and level 1's nebula feel too close | `the-backdrop-is-deeper` — 0445, on that branch |
| thematic enemy sprites per level | `each-place-has-its-own-faces` — 0446, on that branch: the eight shared kinds redrawn for each of the six later places |

## Owed

- **A play of each preview.** The cars and the saucer's tilt are on `the-roster`. The ward is there
  too: its third button under a thumb, whether the nova reads at speed, and whether the turning void
  reads as a swirl. Each of the 48 new enemy bodies is yours to veto.
- **The ear** on the nova's cue, which is new.
- **The pillars' size.** They now read as haze, but they are still the full height of the screen. If
  they still feel close, the next lever is their scale, which reverses your own
  [0346](../docs/decisions/0346-the-pillars-fill-the-sky.md) ask, so it is yours to call.
- **The swift** is still one drawing everywhere, and each kind's animation timing is per kind, not
  per place (0446's own owed list).
- **The proof found two of the guards' own defects** on #462, both fixed with their reasons beside
  them:
  - The binding-budget probe's break had become the true count.
  - The sound-off guard could pass before the run had fired a shot.
