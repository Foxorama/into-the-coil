# 0187 — The kick is the pulse, and the arrangement said it was furniture

**Accepted 2026-08-20.** Two layers change role at every rung; fourteen gains follow. **Five entries
come off the known-adrift list, and the role they now clear is three decibels harder than the one they
were failing.**

> *"There's definitely still issues with loudness on the existing drone layers and things like that…
> like sub and engine in a lot of places are barely audible as well."*

## The rule

**`sub` and `engine` are `pulse` at every rung**, in every place. The bed is `chords` and `groove`.

## ⚠️ Every guard was green, and the arrangement is why

`ARRANGEMENT` said the kick and the kit were a **`bed`**, and `ROLE_MARGIN_DB` says a bed is **9 dB
under everything** — the table's own words are *a bed you feel*. So the mix was faithfully delivering
an arrangement that asked for exactly what the player could not hear, and
[0164](0164-a-role-is-a-promise-the-mix-has-to-keep.md)'s floor had nothing to complain about.

Measured at `push`, before:

| place | `sub` | `engine` | what was over it in the low window |
|---|---|---|---|
| The Approach | −33.2 dBFS | −28.8 | `auraSlow` +7.0 |
| Ember Nebula | −27.0 | −30.2 | `chords` +8.7 |
| The Labyrinth | −35.5 | −33.2 | `auraSlow` +10.3 |
| Rime Shelf | −32.8 | −33.1 | `chords` +9.0 |
| The Toxic Mire | −24.6 | −32.3 | `call` +7.0 |
| The Black Heart | −32.7 | −28.6 | `drive` +8.7 |

⚠️ **THE FIVE NUMBERS IN `ROLE_MARGIN_DB` DID NOT MOVE.** What changed is which role these two layers
have. 0164's own header calls those five *"a hand's guess… the absolute values want an ear and have
not had one yet"*; the ear has now spoken about the **table**, not the numbers.

## ⚠️ Three places had already worked around it by hand, which is the transferable part

`PROMOTES` — the per-place deviation [0155](0155-a-place-follows-its-own-instrument.md) built —
contained:

```
saurian: { engine: 'pulse', … }
core:    { engine: 'pulse', … }
mire:    { sub: 'pulse', engine: 'pulse' }   // "the whole bottom steps up out of the bed"
```

**Three places independently lifted the kick or the kit out of the bed**, and one wrote the reason in
its own comment. Nobody read the three together. Making it global turned all three into no-ops, and
`tests/arrangement.test.ts` caught every one on the next run — *a promotion that promotes nothing is
a line of documentation wearing a mix decision's clothes*, which is the second time that guard has
said so.

⚠️ **A WORKAROUND WRITTEN THREE TIMES IS A TABLE THAT IS WRONG.** That is the finding, and it is the
same shape as [0184](0184-the-measurement-reads-the-place.md)'s — a line written twice, one copy
fixed — one level up: a deviation written three times, none of them read as evidence about the
default.

## What it cost

**Fourteen lifts across five places**, computed from each deficit rather than guessed, converged in
one pass:

| place | lifts |
|---|---|
| The Labyrinth | `sub` 1.04 → 2.03 at `surge`, 1.10 → 2.29 at `approach`, and again at both fight rungs; `engine` at two rungs |
| The Black Heart | `sub` 1.12 → **2.67** at `boss` |
| Ember Nebula, Saurian Belt, Rime Shelf | one rung each |

⚠️ **PER RUNG AND NOT PER PLACE, BECAUSE THE PROBLEM IS.** `run` and `push` were already inside the
new role everywhere; every failure was at `surge` and above, where the layers pile up. A place-wide
`mix` lift would have raised the kick in the two rungs that did not need it —
[0162](0162-a-place-has-its-own-ladder.md)'s lever, for the third decision running.

⚠️ **THE GUARD IS THE FORCING FUNCTION AND THAT IS WHAT A ROLE IS FOR.** 0164 fails until the mix
delivers what the arrangement claims. Changing the claim is one line; the fourteen that follow are
what makes it true.

## What it measures

| | before | after |
|---|---|---|
| adrift across all seven places | 44 | **38** |
| `sub` entries adrift | 6 | **1** — and against a role 3 dB harder |
| `engine` entries adrift | 0 | **0**, same |
| known-adrift entries deleted | — | **5** |

## ⚠️ What was tried and refused

**Highpassing the sustained bottom.** Six to eight sustained voices under 160 Hz sound at once in
every place — `sub`'s own held note, `drone`, `dread`, the aura, chord pads, all sine waves inside one
octave. Saurian Belt is at **3 to 4** after 0185 and 0186, and is the place the player says works.

Capping `drone` and `auraSlow` at 140 and 110 Hz bought the kick **1.0 to 1.7 dB** — and pushed
`drone` **25 entries adrift**, because cutting its bottom guts it against its own `air` role. So the
pile is real, it is measured, and it is not fixed by filtering: it needs each layer's job re-decided,
which is a larger question than this decision. **Reverted, and named here so the next attempt starts
from the measurement rather than the idea.**

## What is guarded

| | |
|---|---|
| `sub` and `engine` reach the pulse, in every place at every rung | ✅ 0164 |
| a promotion promotes something | ✅ `tests/arrangement.test.ts`, which caught all three no-ops |
| every layer a rung sounds is named in the arrangement exactly once | ✅ unchanged |
| the bus does not clip with the kick lifted | ✅ |
| **the role change itself** | ❌ **and it is a gap, not a choice — below** |

## ⚠️ Nothing catches this being undone, and the probe found that out

The first break written for this decision put `sub` and `engine` back in the bed. **The suite stayed
GREEN** — [0019](0019-a-probe-must-be-seen-to-apply.md) doing the more valuable half of its job.

⚠️ **0164 REFUSES A LAYER TOO QUIET FOR ITS ROLE AND HAS NOTHING TO SAY ABOUT A ROLE TOO EASY FOR ITS
LAYER.** It is one-directional by construction, so any decision that moves a layer to a gentler role
can be reverted without a guard noticing — and the state this decision is fixing is exactly that
state. **The honest fix is a second direction on 0164** — a layer more than a role ABOVE the one it
was given means the arrangement is under-claiming — and it is a new assertion over all seven places,
which is its own decision and not a line in this one.

Both breaks that ship are about what the role change **cost**: the fourteen lifts that make the claim
true, and the per-place workaround it made redundant.

## ⚠️ This is a model and the verdict is an ear

[0027](0027-measure-the-picture-not-the-model.md). What is claimed is that the arrangement now says
the drums are something you follow, and that the mix delivers it. Whether the kick **reads** as the
pulse is not a thing any number here can answer. `npm run dash`.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). No storage key, no save field, no
cache prefix, no origin. Two content tables and one list; a revert is `git revert`.
