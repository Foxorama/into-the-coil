# The fish asked for — 2026-09-12

A brief rather than a play-test: the Ember Nebula's end boss stops being an eagle. Asked for while the
serpent's own five items were in flight, and recorded here because chat evaporates between sessions —
[0029](../docs/decisions/0029-the-tracked-record-is-the-record.md).

## What was said

> *"if you get all the serpent stuff done, move onto the level 2 boss — one important thing is that I'm
> changing it from an eagle to a flying fish style boss as the art currently looks more fishy than
> birdy.*
>
> *use the 'pattern' of the serpent boss to improve the level 2 end boss. Don't make the serpent boss a
> hard rule, the pattern is what we want, the style is what makes the different bosses unique*
>
> *fish (level 2) boss -*
> *needs a flashy entrance*
> *needs a high class good quality art and assets for the attacks*
> *needs multiple styles of attacks*
> *needs to be attack while the adds are coming in*
> *the adds need higher quality art assets*
> *the adds need to be more interesting than a boring line of fish and a boring line of space shrimp —
> there needs to be a reason for the player to react and interact with them"*

## What is there today

| | |
|---|---|
| the level | `descent`, the second of seven, theme `nebula` |
| the boss | `hellkite` — *"the hell-spawned eagle"*, [0249](../docs/decisions/0249-the-eagle-summons.md) |
| its hull | `SPRITE.boss9`, radius 15, health 1520 |
| how it flies | `stalk` at 0.22 — **the one boss in the game that follows the player's lane** (0258) |
| what it throws | `quill` on a `rake` that sweeps (0262), and `flame` on a `whip` at two phases |
| its adds | `kite` ×3 a volley in a `vee` from the sides, then `raptor` ×2 in a `line` |
| five phases | rake → whip → summon kites → whip → summon raptors |

## What the ask means against that

- **"the art looks more fishy than birdy"** — so the fiction moves to the art rather than the art to the
  fiction, which is [0020](../docs/decisions/0020-the-fiction-transfers-the-code-does-not.md)'s own
  direction of travel: *rename it, reshape it, improve it.* It touches `boss9`'s paint, the row's name,
  the two adds, and every comment that says *eagle*.
- **"a flashy entrance"** — [0306](../docs/decisions/0306-the-serpent-coils-in.md) is the pattern and
  the machinery: an `Entrance` on the row, a path in the camera's frame that the whole animal flies,
  not-shootable and fully live. **The serpent's is a coil; a fish's must not be.**
- **"multiple styles of attacks"** — the phase table already carries `shot` and `attack` overrides
  (0248) and the `heads` round (0254) is the one mechanism for *together*. What the eagle has is two
  attacks and two summons; the serpent has four and a round.
- **"attack while the adds are coming in"** — today a `summon` volley throws adds *instead of* a fan,
  because one volley is one arm of `BossAttack`. The `heads` round is not that either: it takes turns.
  **This is the one item that needs a mechanism the game does not have.**
- **"the adds need to be more interesting than a boring line"** — the formation is `vee` and `line`
  today. A reason to react and interact is a property of what an add DOES, not of how it is arranged.

## What it is not

⚠️ **NOT THE SERPENT WITH FINS.** Asked explicitly: *"Don't make the serpent boss a hard rule, the
pattern is what we want, the style is what makes the different bosses unique."* The pattern is: an
entrance of its own, a look that changes with its phases, attacks that escalate and combine, and adds
that are a reason to move. The style is what a fish is and a snake is not — and
[0282](../docs/decisions/0282-a-mechanism-for-every-instance-makes-them-one-instance.md) is the rule
that keeps the second from collapsing into the first: *a mechanism for every instance makes them one
instance.*
