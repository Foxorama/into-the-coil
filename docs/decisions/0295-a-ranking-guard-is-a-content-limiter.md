# 0295 — A guard that ranks every instance against every other is a content limiter

**Status:** accepted
**Supersedes in part:** [0081](0081-what-the-player-must-tell-apart-is-told-apart-by-more-than-ink.md),
[0098](0098-a-wave-plays-a-figure.md), [0035](0035-damage-is-legible-on-the-body-that-took-it.md),
[0042](0042-a-run-is-a-sequence-of-levels.md)

## The report

> *"This is a shit rule that I didn't add and it explains so much about what has been frustrating
> with the enemy fire mechanics. […] It completely ignores colours, shape, speeds, origination of
> bullet and a dozen other factors that distinguish a damaging object from each other. […] It's a
> rule that specifically makes quality worse which is entirely antithetical to everything I want to
> do with this project."*

The rule named was *every hostile bullet is drawn more than five pixels from every other*. The audit
that followed found five of the same shape, and the answer is not a better version of them.

## What was actually running

Measured with `scripts/weigh-sizes.mjs` on the 1280×720 screen every play report was made on
(7.20 px per world unit):

```
hostile bullets    8.6 → 53.3 px    flame · lance · spit · flak · quill · void · acid · frost · rock
enemy hulls       36.0 → 68.4 px    weaver … warden
```

Eight of the thirteen enemy hulls are drawn **smaller than the biggest bullet in the game**. The
weaver, at 36.0 px, is drawn to the pixel the same size as a void blast. That is the reported defect
— *"some enemy ships that look just look bullets so in some cases you can't tell what's what"* —
and it is the direct output of the rules below.

The five:

| | Where | What it forced |
|---|---|---|
| 1 | `tests/legibility.test.ts` | every hostile bullet >5 px from every other, drawn |
| 2 | `tests/legibility.test.ts` | faster ⇒ strictly smaller, across all nine |
| 3 | `tests/legibility.test.ts` | all three enemy-sent bullets share one hurtbox |
| 4 | `tests/combat.test.ts` | tougher enemy ⇒ strictly bigger, across all thirteen |
| 5 | `src/render/bake.ts` | every threat wears one ink, so size carries the load |

## Rule 1 did not merely fail to help — it caused the defect

`src/content/sprites.ts` recorded the mechanism in its own words, as a cost paid without comment.
When the eagle's quill was added, the ladder was already packed at the five-pixel minimum, so
**four bullets above it had to be moved up 0.8 units each** — the ring, the drop, the shard and the
rock — purely to make room for a tenth rung. Nothing about those four got better. They got bigger
because a spacing rule said they had to, and that is the mechanism by which the bullet ladder
climbed into the hull range.

A rule that makes the tenth item shove the ninth is not a legibility rule. It is a packing
constraint that mistakes a one-dimensional sort for the thing the player is doing.

## Rule 2 made the worst case mandatory

*The fast one is the small one*, over every hostile bullet. The flame is the quickest thing fired at
the player, and is therefore, by rule, the smallest — 8.6 px, which is the *"incredibly small and
hard to see"* half of the same report. A fireball with a trail, moving fast, was illegal.

## Rule 4 has no defensible general form

> *"Get rid of rule 4 completely, it's incredibly limiting and means we can never have smaller
> tougher enemies or larger balloon pop style enemies."*

A total ordering of extent by health forbids both, and both are ordinary shooter vocabulary. The
observation it came from was real and local — two kinds shipped at one extent with different health
and it read as inconsistency — and the repair for a local defect is to fix those two rows, not to
chain all thirteen together for ever.

## The general form

**A guard that ranks every instance of a kind against every other on a single channel is a content
limiter, not an invariant.** It fails 0192's own question — *name a change to the content that would
redden this and be correct* — because there are dozens, and every one of them is a design somebody
might want. What such a guard actually holds is *this table's current sort order*, which nothing has
ever needed held.

> *"Anything that ranks something against something else with comparing every single aspect of those
> two things is a restrictive and bad rule."*

The tell is a `for` loop over a sorted content table with a `>` inside it.

## And the replacement is not another guard

The first draft of this answer proposed two: *no hostile bullet is drawn as large as the smallest
enemy hull*, and *a floor under the smallest hostile bullet*. Both were rejected, correctly, and the
reasons are worth keeping because they are the reasons any successor will reach for them again:

- The first is the same rule in different words. It invalidates size, shape, speed, vector — and
  whether the smallest enemy hull is even on screen at the same time as the bullet it constrains.
- The second is defensible today and becomes a trap. Small hard-to-see bullets are bad *now*; they
  are a legitimate design later, and a floor makes that a fight with the suite rather than a choice.

What replaces them is two **considerations**, written into the constitution as questions to raise
rather than thresholds to clear:

1. When adding new weapons, ships, enemies, bullets, attacks or patterns, consider what else will
   share the same screen space with them.
2. When adding anything new, consider how much screen space the player has to react, and how long
   that element is on screen.

## The test for whether a rule may be hard at all

> *"Does it make sense for a rule to be hard? If yes, then it's a hard rule. If no, then it's a
> specific rule for that thing."*

Ask it of the thing, not of the category. The five rules above all failed it and none of them was ever
asked.

**Worked, on the case that produced this decision.** *Every hostile bullet is drawn more than five
pixels from every other* — does that make sense as a hard rule? No: it ignores colour, shape, speed,
vector and origin, and it forces the tenth bullet to shove the ninth. So it is not a rule at all; it
is a fact about the nine rows that happen to exist. But *fire is the same colour in every place* —
does **that** make sense as a hard rule? Yes, and for a reason specific to fire: fire is fire
everywhere, and a flame that changed hue by level would be teaching the player something untrue about
the world. So it is hard, and it is hard **about fire**, not about bullets.

The two live side by side in the same change — a hostile bullet takes its place's colour, and a flame
does not — which is what the test is for. **A rule earns hardness from the thing it is about, never
from the shape of the file it would live in.**

⚠️ **AND THE ANSWER TO A LEGIBILITY PROBLEM IS NOT ALWAYS A PICTURE.** Level one's hulls wear accents
close to what shoots at the player, and the fix considered first was to repaint them. The better one
may be **placement** — a weaver arrives when the bullets it resembles are not on screen — which costs
the art nothing and is invisible to every guard that could have been written here. *Consider what
shares the screen space* is a question about the screen at a moment, not about a table of colours.

**The word is `consider` on purpose, and it is not softness.** A threshold answers the question
before it is asked, and answering it automatically is what produced the harm this decision is about:
assume the player needs time and every attack becomes trivial to dodge; assume nothing may confuse
interaction and background flavour stops being addable; assume the play area needs marking and a
dotted line appears down the right of the screen. Enemies visible for a second, threats rising out of
the floor unannounced — those are the same failure from the other side. Both are what happens when a
question that has to be asked per case gets a standing answer.

**No guard holds either of these**, and that is the point rather than an omission — the same shape as
[0200](0200-the-tool-that-edits-must-not-lose-what-it-edits.md), which also names why.

## What is kept

Not everything comparing two things is of this class. What survives is what states a **structural**
property of one row, or a non-equality between two named things:

- Every shot kind names its own silhouette. A uniqueness rule limits no single design; it forbids two
  being literally the same bitmap, which is the defect 0081 was written from.
- No two shooting enemy kinds send the same bullet in the same pattern.
- Every hostile bullet in the table is sent by something.
- The player's own fire is never drawn in the ink of what is trying to kill it.
- A hurtbox stays between 0.25 and 0.55 of the drawing (`tests/combat.test.ts`). This is the real
  bound on an extent, and it is per row: nothing is ranked against anything.

## What this costs, honestly

Rule 5's removal frees the ink table, and `tests/legibility.test.ts` identifies a hostile bullet *by
its ink* in order to check that every hostile row is sent by something. That filter was safe while
one ink was mandated and is now a convention. It is left standing and named here rather than
quietly repaired, because the fix — a row saying whether it is hostile — is a change to the bullet
table, and this decision is about not making those by assumption.

## Related

- [0192](0192-a-guard-holds-an-invariant.md) — the question these five could not answer.
- [0027](0027-measure-the-picture-not-the-model.md) — `scripts/weigh-sizes.mjs` is the instrument
  that made the overlap visible, and nothing in the repository could state it before.
- [0028](0028-quality-is-the-constraint.md) — *after a miss, repair the class.* The class is the
  ranking guard, and there were five.
