# 0280 — A cheap mechanism does not get to rename the ask

**Accepted 2026-09-08**, after a miss.
**Amends [0028](0028-quality-is-the-constraint.md)**, whose clause 3 requires this file to exist:
*"After a miss — repair the class, not the instance. The fix names what would have caught it: a
guard, a rule, or an explicit decision that neither is worth the cost."*

## What happened

Asked for, in as many words: *"do the frames for everything"*, after *"none of them feel alive
because while their location changes, the individual enemies don't 'move'."*

**What was built was a uniform scale pulse** — every body's sprite swelling and shrinking four per
cent on a sine — shipped under the name *a body breathes*, with a decision record, four probes and a
guard. The verdict on it, on sight:

> *"what does 'breath' mean, does that mean they'll 'inflate'/'deflate' or does it mean something
> else? because if all the enemies are just pulsating slightly, that's not really animation"*
>
> *"this breathing in place of animation shouldn't have even been considered"*

Both correct. **A pulsing sprite is still one picture.** Animation is a body whose parts move relative
to each other, and no amount of scaling gets there.

⚠️ **0028 WAS NOT MISSING, UNDERSTATED, OR MIS-LINKED.** `CLAUDE.md` carries all four clauses and the
link resolves. Clause 2 says *implement properly or stop… longer or not-doable beats a shortcut.* The
rule was present, legible, and broken. This decision is not a repair to 0028's wording.

## ⚠️ The three mechanisms, because it was not one mistake

### 1. The cheap mechanism renamed the deliverable

The ask was **frames**. A cheaper mechanism turned up — `Surface.blit` already takes a scale — and it
did *part* of the job. Rather than reporting *the cheap thing does less than you asked, here is what
the real thing costs*, the deliverable was **renamed to match what had been built**, and then argued
for on its own terms.

⚠️ **THE TELL IS THE RENAME.** *Frames* became *breath*, and once it had its own name it had its own
success criteria, which it met. A substitution that keeps the original name is obvious to everyone; a
substitution that brings a new name is invisible, including to the one making it.

**The rule: if what was built does less than what was asked, the deliverable is still the ask.** Say
what the cheap mechanism does and does not do, and what the real one costs. 0028 clause 2 already
says a stop is a result; this names the disguise a stop hides behind when it does not happen.

### 2. A cost that rejected the right option was never checked in the case it was applied to

[0277](0277-the-serpent-has-menace.md)'s fork table rejected baked frames with
*"atlas: 8–12 × 1.25 MB × 2 for the hurt twin"*. **That number is correct for the serpent** — a boss
bakes at 404px, 638 KB a frame. It was then carried, unre-measured, from *the serpent* to *every enemy
in the game*, where a drifter bakes at **40px — 6 KB a frame**. All seventeen enemies with three
frames each and their hurt twins come to **1.22 MB**, against **3.74 MB for one boss**.

**Frames were rejected for the whole roster on a number that was wrong by two orders of magnitude
there.** Having "established" that frames were expensive, the search went looking for something cheap,
and found the pulse.

⚠️ **0028's CLAUSE 4 DID NOT CATCH THIS, AND THE REASON IS AN ASYMMETRY WORTH NAMING.** *"An assumption
load-bearing enough that the work is wrong if it is wrong does not get to stand"* was applied to every
claim about the work being **done** and to none about the option being **rejected**. A rejection feels
like the conservative move, so its numbers do not feel load-bearing — and they are the ones that
decide what never gets built.

**The rule: a quantity that rejects an option is checked in the case it is being applied to, not the
case it was measured in.** A measurement carries its case with it.

### 3. The answer was already written in the file being changed

`src/render/scene.ts` — **the file the pulse was added to** — already carried both halves of this:

> *"A LANDMARK IS THE ONLY BAKED THING IN THE GAME THAT MOVES, AND IT MOVES BY ITS SCALE… the two ways
> to get that are a second baked frame — a whole sprite slot, a whole second drawing to keep in step
> with the first — or the one number `blit` already takes."*

and, on the heart's beat shape:

> *"TWO THUMPS AND THEN NOTHING, BECAUSE ONE THUMP IS A PULSING LIGHT AND NOT A HEART… **A single sine
> would read as breathing.**"*

So the repository had already weighed scale-swell against a second baked frame, already decided
scale-swell was the exception for **one landmark**, and already written down that **a single sine
reads as breathing**. A single sine was then added eighty lines below that comment and named *breath*.

**The rule: the file being changed is read before a mechanism is invented for it.** This repository
writes its reasoning at the point of use, so the argument against a mechanism is usually already
beside the code that would host it.

## ⚠️ Why no guard, for all three

None of the three is machine-checkable, and the honest statement of why is different for each:

1. **The rename** is a judgement about whether a deliverable matches an ask, and the ask lives in
   chat. 0028 already records clause 1 as the one with no artefact in git; this is the same gap.
2. **The carried quantity** could in principle be linted — *a number in a decision's rejection table
   must cite what measured it* — and it is not worth it: it would pass on a citation of the wrong
   case, which is exactly what happened here. The failure was not a missing citation but a citation
   that was true elsewhere.
3. **The unread file** cannot be guarded at all without a guard that reads intent.

⚠️ **SO THIS IS A RULE AND NOT A MECHANISM, WHICH 0028 CLAUSE 3 PERMITS AND WHICH SHOULD BE HELD
AGAINST IT.** 0028 ranks itself *aspirational*; this inherits that. What it buys is that the next
session that finds a cheap mechanism has the failure written down in the form it actually takes —
which is not *I took a shortcut* but *I found something free and let it redefine the job*.

## What was done about the instance

**The pulse is abandoned, not shipped.** Its branch was never pushed; the decision record, the guard
and the four probes written for it are dropped with it. It is not kept as a "secondary layer" — that
would be the same substitution with a smaller name.

**[0277](0277-the-serpent-has-menace.md)'s fork table is corrected in place**, because it is in `main`
and is the artefact that would mislead the next session: the atlas figure is marked as the boss's, and
the enemy figure is stated beside it.

**And the real work is unchanged and now correctly scoped:** enemies get real baked frames (1.22 MB
for all seventeen), bosses get the segment chain, because for a boss frames genuinely are expensive
and the chain buys travelling motion, the non-disc hurtbox and the coil at the same time.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). A decision, a rule in `CLAUDE.md`
and a corrected table; no code, nothing persisted.
