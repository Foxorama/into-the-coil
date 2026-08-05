# 0035 — Damage is legible on the body that took it, and a kind is told by its silhouette

**Accepted 2026-08-05.** From a play-test —
[`reports/combat-legibility-2026-08-05.md`](../../reports/combat-legibility-2026-08-05.md).
[0034](0034-a-threat-is-absolute-and-a-pool-is-the-pairing.md) is written-once and is not edited;
this is the follow-up it earned within the hour.

## The rules

| | |
|---|---|
| a survived hit | **shows on the body that took it**, whatever body that is |
| the flash | **the same silhouette in the `impact` ink** — never a new shape, never a removed blit |
| `impact` | **its own ink role**, not a shade of `hazard` |
| which kind a thing is | **carried by silhouette**, with colour reinforcing and never carrying it alone |
| the selection | **the sim writes `sprite`**; the painter draws what it is handed |

## The bug was an asymmetry, not an omission

0034 landed a hit flash and described it in general terms — *"a second baked sprite of the same
silhouette in a different ink, selected by the sim"* — and then applied it to exactly one body,
because at that moment the ship was the only thing in the game that could be hurt without dying.

Every enemy had two health. So the first shot to land on **anything**, every time, removed a bullet
and changed nothing else on screen: pixel-for-pixel what a shot passing straight through looks like.
It was reported as a collision bug, which is what it looked like.

⚠️ **Nothing caught it, and the reason is worth keeping.** The model was right, the collision was
right, `tests/combat.test.ts` proved a shot is spent by arriving and a target loses health, and every
one of those assertions was green. The defect was that a true event had no representation — which is
[0027](0027-measure-the-picture-not-the-model.md)'s subject arriving from a direction it had not
been seen from before. Its two prior cases were a picture that did not move and a control that
under-delivered; this one is a picture that never showed a thing the model had correctly done.

**A rule that is general and an implementation that is not will read as correct in review**, because
the prose describes the general thing. The way this class gets caught is that the flash now belongs
to `Body` rather than to the ship: a new kind of thing that can be hurt fails to compile until it has
said what it looks like when it is.

## Three changes, and the cheapest does the most

**A `flashFor` counter on the entity, and a `spriteHit` on the body.** `stepEntities` derives
`sprite` from the two every step, for every pool, which is the one place it can be done once rather
than per-caller.

**A silhouette per enemy kind.** `drifter` keeps the diamond — symmetrical, pointing nowhere, which
is what it does. `lancer` gets an arrowhead with its nose back down the lane at the player, because
it closes and it aims, and the pointy end being the dangerous end is a convention this genre already
taught everybody.

**`drifter` down to one health.** The harmless enemy now dies to one shot, so *"it did not die"*
becomes a fact about the lancer specifically — the one that looks different. This is one number, it
needed no code, and it removes the confusing case rather than annotating it.

⚠️ **The ask was the icons; the icons alone would not have fixed the reading.** Two enemies of
different shapes that both eat a shot silently still look like a collision bug. Worth recording
because the report named one cause and there were two, and shipping only what was asked for would
have left the reported symptom in place.

## `impact` is a role, and `hazard` was already taken

The ship's flash borrowed `hazard`, which was free because no hazard exists yet. `docs/game.md` has
asteroids in the vocabulary, so it will not stay free — and at that point *this just took damage* and
*this will hurt you* would be the same colour.
[0024](0024-the-accessibility-floor-is-settings.md) is explicit that colour must not carry meaning
alone; two meanings sharing one colour is the same failure with the sign flipped.

`Ink` is a closed union over a `Record`, so adding the role failed to build until both palettes
answered it, and `tests/palette.test.ts` holds the contrast floor against `space` for the new one
exactly as for the other seven. It is near-white in both: **a flash reads as an impact because it is
briefly louder than everything around it, not because of its hue** — which is also what makes it
survive the colour-blind case without a second idea.

It is deliberately **not** added to `MUST_NOT_BE_CONFUSED`. That table's own comment says every pair
added constrains every palette forever and a palette of seven mutually-separated inks is a palette
of greys. `impact` is transient and lands on a silhouette the player already knows.

## Rejected: a painter branch on "is this thing flashing"

One line in `paintScene`, no `spriteBase`, no third number on the entity. Rejected on the same
grounds 0034 rejected it for the ship: `src/render/scene.ts` draws what it is handed, and choosing
between two bitmaps is a decision. The cost is a derived field and it is paid once.

## Rejected: swapping `sprite` and `spriteHit` in place

Avoids the third number by keeping an invariant — `sprite` is the hit one exactly while
`flashFor > 0` — maintained at two call sites that must both remember. Rejected: an entity is plain
numbers in a pre-allocated pool, so a third number costs nothing measurable, and an implicit
invariant across two files costs a bug the first time a third caller appears.

## Rejected: making the flash a variant index the sim could compute

`sprite + 1` for the hit twin, with the atlas laid out in `(kind, variant)` pairs — which is
0022's own vocabulary, and tempting for that reason. Rejected because `sim/` may import `brand` and
nothing else ([0015](0015-the-layer-ladder.md)), so the offset would have to be threaded in as an
argument to keep the layer honest, and an argument that must always be `1` is a constant wearing a
parameter. Carrying the actual index on the body says the same thing with nothing to get wrong.

## What this deliberately does not decide

**Whether the ship flashes solid or blinks.** It is lit for the whole invulnerable window now, which
carries two messages on one signal; the version before it blinked. Neither has been played against
the other and it is a question for a hand, not for this file.

**Whether the lancer's nose reads at speed.** About 21 pixels of silhouette at phone scale, and no
instrument here can judge it.

**Where enemies enter from.** Everything arrives at the leading edge because the proof scene has one
spawn rule and there is no wave table. `across`-edge entry is *cheaper* to author than leading-edge —
`across` is a fixed 100 units fully visible on every device, so an entity just outside it is
off-screen identically everywhere. It lands with waves, as a table edit. The report names the one
real gap that comes with it: there is no `across` cull.

---

## Confirmed, not assumed

Per [0005](0005-a-guard-must-be-seen-to-fail.md) and [0019](0019-a-probe-must-be-seen-to-apply.md),
declared in `scripts/probes/0035-legibility.mjs`.

| broken on purpose | went red |
|---|---|
| the flash never set on a survivor, which is the shipped bug exactly | `THE ONE: a survivor is drawn differently on the step it is hit` |
| the flash never cleared, so a hit enemy changes colour permanently instead of flashing | `goes back to itself afterwards, so the flash is an event and not a state` |
| the sprite selection dropped, so the counter runs and nothing is drawn from it | `THE ONE: a survivor is drawn differently on the step it is hit` |
| both enemy kinds pointed back at one sprite, which is what shipped | `no two enemy kinds share a sprite` |
| a hit sprite set to the body's ordinary one, which passes a `Record` and shows nothing | `every enemy kind has a hit sprite that is not its ordinary one` |
| the recovery blink folded into the impact flash, so a state is shown as one long colour change | `an impact and a recovery are two signals, and the second one pulses` |
| the tougher enemy drawn at the same size as the harmless one, which is what shipped | `the enemy that takes more killing is drawn bigger` |
| `impact` pointed back at `hazard`, so a hit and a hazard become one colour | `clears WCAG AA against the background, in every palette` |

⚠️ **One of those guards was written wrong twice and `npm run prove` said STILL GREEN both times.**
The blink assertion first checked that two distinct sprites appeared across the invulnerable window —
which a solid flash that ends also does — and then that the sprite changed more than once, which a
solid flash also does, once in and once out. What separates a pulse from a flash is how many times
the lit state *starts*. Both earlier versions measured something real and neither measured this, and
neither would have been noticed without a probe: the test was green against the exact implementation
it existed to reject. This is [0019](0019-a-probe-must-be-seen-to-apply.md) doing the thing it was
written for, twice in one sitting.

## What has no guard

**That the flash is long enough to see, or that the lancer's nose is big enough to read.** Both are
picture questions about quantities in pixels and milliseconds, and 0027 refuses a threshold on an
unvalidated one — a guard on either would defend whatever number happened to ship. They go back to a
hand, which is where this decision came from.

---

## Both open questions came back answered, and both answers were "no"

**Added 2026-08-05**, within the hour.
[`reports/enemy-silhouettes-2026-08-05.md`](../../reports/enemy-silhouettes-2026-08-05.md). The
section above named two things it was leaving to a hand; the hand returned both, and neither was the
way this file guessed.

### The lancer's nose did not read, and one screenshot would have said so

*"The diamond shapes took two shots to take down … sometimes they'd get hit, go white, then need a
second shot and other times they appeared to just die straight away."*

The behaviour described is **correct**: a drifter dies to one shot and never flashes, a lancer takes
two and flashes between. It reads as random only if the two cannot be told apart — and they could
not, because the five-sided arrowhead rendered at shipping size as a small mushy lump that looked
like *a slightly smaller diamond*.

| | |
|---|---|
| shape | **a plain triangle**. Three points against four survives twenty pixels; five points with a 0.25r notch do not |
| size | **7 units against 5.5**, and the size is doing more work than the shape |
| hurtbox | 3.2, up from 2.6 |

⚠️ **Size carries toughness and needs no learning at all.** Two enemies of different shapes at the
same size still make *"how many shots does this take"* something to memorise instead of something to
see. `tests/combat.test.ts` holds the ordering — the enemy that survives more hits is drawn bigger —
as an ordering and never as a ratio, because a ratio is a picture quantity nobody has validated.

### An impact and a recovery are two signals

*"I think the previous ship flash was better than the new one."* Correct, and the reasoning that
replaced it was wrong in a nameable way: **an impact is an event and wants to be solid and brief; a
recovery is a state, and a state that does not pulse looks like a colour change.** Folding them into
one number was not the job — the job was generalising the flash to enemies — and a generalisation
that changes behaviour at the site it started from is two changes, of which the second was never
argued.

Both are back and both are generic: anything with `invulnFor` blinks, anything with `flashFor`
flashes, and no branch anywhere names the ship.

### What this cost, and the habit rather than the guard

⚠️ **`scripts/trace-frame.mjs` could not have caught either.** It traces *motion* — where a thing was
drawn, per frame — and has three bugs to its name. Both of these are about **form**: what a shape
looks like at the size it ships at. 0027 is about measuring the picture and it did not prevent this,
because the picture it teaches you to measure is the moving kind.

No guard is proposed. A test cannot look at a triangle and say whether it reads as one, and pretending
otherwise is exactly the unvalidated threshold 0027 refuses. What is worth carrying is the trigger:
**when a change is about what something looks like rather than where it moves, take the picture
before shipping it.** It cost one throwaway script and about a minute, and it answered in one image a
question that two rounds of reasoning had got wrong — including the round in this very file that
wrote down *"no instrument here can judge it"* and shipped anyway.
