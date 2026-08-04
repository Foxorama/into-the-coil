# 0020 — The fiction transfers, the code does not, and the fiction is not scripture

**Accepted 2026-08-04.** Amends the constitution's *"The predecessor"* rule, which was written before
this game had a design and turned out to forbid the design it got.

## The rule

From `C:\Golf-Stars` (*The Far Carry*): **patterns and fiction transfer; code and simulation do
not.** Fiction crosses as **raw material, not scripture** — names, details and characterisation may
be renamed, reshaped or replaced on the way. Read named files for a named reason; never browse for
inspiration.

## What the old wording said, and why it was wrong

> *Its patterns transfer; its content does not — it is a golf game, and its simulation layer is fused
> to that domain at the type level.*

The clause after the dash is the reason, and it is entirely about **code**. A `Course`, a `Lie`, a
`PlayerLoadout` are fused to golf at the type level and could never be lifted into a shooter. None of
that is true of a duck with a laser.

The word *content* was doing two jobs. Written to mean "the golf tables", it also reads as "the
characters, the biomes, the cult, the serpent" — and *Into the Coil* is by design a sequel to that
fiction. It replays *The Far Carry*'s final boss in its prologue, recruits its caddies, and takes its
biomes as level themes. Under the old wording the entire premise was a violation.

⚠️ **The rule was not being ignored; it was being read and found to forbid the obvious.** That is the
failure mode a rule with its reasoning attached is supposed to make visible, and it worked — the
reason survived the amendment unchanged, and only the word it was attached to moved.

## Why "not scripture" is in the rule rather than assumed

The predecessor is a **shipped, published game**, so its spellings carry a pull that an ordinary
reference does not: it feels like a continuity error to change one. It is not. Three renames were
already wanted before the first game file existed — the plural "Space Ducks" becoming a single Space
Duck, and personal names for characters who never had them (Lord Pembleforth the 5th, Peep, and Marty
for the Mystic Mole, who went nine caddies' worth of dialogue without one).

Stated the other way — *fiction transfers, verbatim* — every one of those would be an argument. The
predecessor's own `story-bible.md` has a naming-constraint clause of exactly that kind, and the
scaffold plan already refused to carry it forward for the same reason: it is a constraint on *that*
game, where eight shipped strings and a locked title tile depend on it. Nothing here is shipped yet.

## What still does not cross

Code. `src/sim/rpg/` is a golf simulation and stays one. The Jörmungandr fight transfers as a **design
model** — one trigger per owned weapon, phases keyed to remaining health so every arsenal meets every
phase — and not as a module; `storyFinale.ts` imports `storyShipUpgrades` and `story`, which import
the campaign, which imports the course.

The one deliberate exception is `src/sim/rng.ts`, which is a 94-line mulberry32 implementation with no
domain in it at all. It is ported verbatim on purpose.

## Consequences

- `docs/game.md` is the product definition and is tracked, unlike the working material in
  `docs/scaffold-plan.md`, `docs/machine.md` and `docs/milestones/`. A clone needs to know what the
  game is; it does not need to know which computer built it.
- **Canon:** the Warden ending. The player fought the serpent and won, and the Reseal held. The
  Herald path ends the universe, which makes for a short sequel.

## Not guarded by a test

Deliberately. The rule is about what may be read and re-used from a directory outside this
repository, and there is nothing in `src/` for a scan to see. What holds it is that it now says what
it means.
