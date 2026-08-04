# 0030 — Input is actions, the arsenal is a list, and none of it needs a new layer

**Accepted 2026-08-04.** Discharges the input half of
[0024](0024-the-accessibility-floor-is-settings.md)'s floor — *actions-not-keys* — and the code
constraint `docs/game.md` states as *the arsenal is a list, never a slot*.

## The rule

**Input is named actions bound to keys, never keys read directly.** The model is told *what was
asked for*, never *what was pressed*.

**The arsenal is a list. The bindings are a budget.** Those are two different numbers and conflating
them is the failure the rule exists to prevent:

| | shape | today |
|---|---|---|
| the arsenal | `Special[]` — unbounded | authored two |
| the bindings | a closed action union | two special triggers |

A ship does not have a `special1` and a `special2` field. It has a list, and the binding budget says
how many of that list currently have a trigger. **Raising the budget adds a row to a table; it
changes no type and no save.**

## Where it lives, and why that is not a new directory

`CLAUDE.md` says a new directory under `src/` is a decision. This decision is that **there isn't
one** — the ladder in [0015](0015-the-layer-ladder.md) already has three correct homes, and the work
of this decision was finding out that the obvious answer was wrong.

| piece | layer | why there |
|---|---|---|
| `Intent` — what the ship is asked to do this step | `sim` | it is what the fixed step consumes, and what a replay would record. Below the shell, input is an argument like time and randomness |
| the action union, and the default bindings | `content` | rows over a closed union, which is [0016](0016-a-hub-enumerates-kinds.md)'s definition of the layer |
| device listeners, and keys → actions | `app` | the only layer granted `dom` |

### The obvious answer, and why it fails

`tests/layering.test.ts` already lists input under `app` — *"the shell: boot, the rAF loop, input,
audio, wiring"* — so `src/app/input.ts` looks like the whole answer, and a new `src/input/` layer
looks like the alternative. Both are wrong, for the same reason.

**Rebindable input means the binding table is persisted and configurable.** 0024 puts
actions-not-keys in the unconditional floor, so bindings are settings, settings are saved, and
`save` may import `brand`, `sim`, `content`, `state` — **never `app`**. A binding table in the shell
is a binding table that cannot be saved without widening the arrow, and
[0015](0015-the-layer-ladder.md) says the fix for that is never to widen the row.

A new `src/input/` layer would have worked and is still refused: it would sit between `sim` and
`content` holding one table, duplicating what `content` is *for*, and a layer is the most expensive
thing this project can add — every row in `LAYERS` is a permanent constraint on six other rows.

So the split above is not a compromise. `Intent` in `sim` is what makes a stage playable headlessly
from a recorded input trace, which is the property `sim` exists to have.

## What an action is, and what it is not

Actions are **continuous** or **momentary**, and the difference is not cosmetic:

- `alongMinus` / `alongPlus` / `acrossMinus` / `acrossPlus` — held. Resolve to an axis in −1…1.
- `special1` / `special2` — **edge-triggered**. A special fires on the press, not on the hold.

⚠️ **The edge is read in `app` and delivered as a count, not a boolean.** A special pressed twice
between two fixed steps must fire twice or the input is lossy at low frame rates, and a boolean
cannot say so. This is the same class of bug as reading the clock instead of being handed `dt`.

**There is no `fire` action, and there must never be one.** The base weapon and every upgrade to it
fire themselves unconditionally — `docs/game.md` and `src/sim/assist.ts` both already say so, and
`tests/assist.test.ts` holds it. An action named `fire` would be the first step back toward a game
about holding a button.

## Why the budget is two, and why two is not in a type

Two authored specials is a **content** scope: enough that the arsenal is visibly a list rather than
a slot, few enough that the first playable does not need a weapon-cycling UI.

⚠️ **Actions-not-keys forces the action set to be finite, and that is the seam.** A binding UI needs
a named thing to bind, so `special1` and `special2` are real named actions — while the arsenal they
point into is not finite. The seam is stated rather than hidden: **the i-th binding triggers the i-th
owned special, and a special owned past the last binding is unreachable.**

That is a **content and UX problem when it arrives** — add a third binding, or add cycling — and
explicitly **not** a shape change.

**What is asserted today, precisely:** an `Intent` built with a budget *smaller* than the bound
actions drops the unreachable presses without crashing and without disturbing the reachable ones,
and `SPECIAL_BINDINGS` is derived from the table rather than written as a literal beside it. That is
the seam, tested from the only end that currently exists.

⚠️ **The other end is owed and is not claimed here.** *"A ship carrying three specials still models
three and still saves three"* cannot be asserted, because there is no ship, no arsenal and no save
yet. It is the test to write in the commit that introduces one, and until then this rule is held by
the type not existing rather than by a guard.

## Rejected: a per-weapon binding

One action per weapon *kind* — `bomb`, `shield`, `heavy` — reads more natural and was rejected
because it puts content in the binding table. A pickup would then ship a new action, every existing
save would need a binding for it, and a rebinding screen would grow a row per weapon in the game.
Positional bindings over an ordered arsenal cost one row each and never change.

## Rejected: reading the intent inside `sim`'s step from a device abstraction

`step(state, dt, input)` where `input` is an interface the shell implements. Rejected: an interface
is a thing that can be asked a question mid-step, and the answer could differ between two calls in
one step. A **plain immutable `Intent` value, sampled once per step**, cannot. Same argument
[0015](0015-the-layer-ladder.md) makes for time being an argument rather than a call.

## What has no guard

The binding *budget* is guarded — the arsenal-of-three test above is the point of the whole decision.
What is not guarded is whether the chosen two specials are *fun*, which is
[0027](0027-measure-the-picture-not-the-model.md)'s territory and needs the instrument, not a test.

⚠️ **Not verified: none of this has been played.** The edge-count claim is reasoned from the fixed
step in [0025](0025-the-frame-budget-is-counted-not-timed.md) and is asserted in a test at 4 presses
per step; it has not been felt by a hand on a keyboard. What would settle it is the first playable
build, and that is owed rather than assumed.
