# 0285 — The mouth is alive

**Accepted 2026-09-09**, from the second play of the chain —
[`the-chain-played`](../../reports/the-chain-played-2026-09-09.md):

> *"getting better, there's a weird green bit in the mouth, no forked tongue or anything."*
>
> *"it also needs to be aggresively moving is mouth to watch the player's ship moving — the body is
> animated now which is good, but it still feels like a non-interactive wall object rather than a
> living space serpent trying to battle the player."*

**Follows [0284](0284-the-head-is-a-serpents.md)**, which drew the skull this animates.

## The rules

**A face is a frame, and which frame is the fight's.** `blit` cannot rotate and cannot deform, so a
jaw that opens is a second drawing — the same conclusion `src/content/exhaust.ts` reached for a
flame. What a creature's faces ARE is content, on its row; *when* it wears each one is the fight's,
in `wearFace`. 0282's split, applied to a face.

**Which jaw a mark belongs to is authored, never deduced from where it sits.**

**A snap answers the player; a tell answers the fight.** The two throws of a jaw go opposite ways
from rest, and only the one that means *a volley is coming* is information the player is owed.

## ⚠️ The bug that was the whole of the containment failure, and it was a predicate

The four teeth are in the silhouette rather than painted in the gap — 0284's rule, because a mark
standing in the notch is a solid mark over a hole. Swinging the jaw therefore has to swing the two
teeth standing ON it and leave alone the two hanging FROM the skull above it. The first pass decided
that from height: *the lower jaw is the part below the bite line*.

⚠️ **A HANGING FANG'S TIP IS PAST THE BITE LINE AND ITS ROOT IS NOT.** So half of each upper tooth
swung with the lower jaw and half stayed with the jaw it grows out of, and the teeth tore out through
the roof of the mouth — reported by `tests/accents.test.ts` as sub-pixel containment failures on the
gape frame **and on that frame only**, which is the tell, because it is the only frame where the jaw
has moved.

⚠️ **AND IT WAS CHASED FOR HALF A DAY AS A TUNING PROBLEM.** The painted white inside each tooth was
shrunk toward the tooth's centroid, and the shrink factor was moved up and down against two floors it
could not satisfy at once: at 0.62 a tooth was 0.22px outside its hull on the open face, and at 0.5 it
was 0.30px outside AND 2.42px across on the shut one, against the 2.5 below which a mark is not drawn
faintly but not drawn at all. **Neither floor was the constraint.** Once membership of a jaw was
authored rather than deduced, the original 0.62 passed both with room.

⚠️ **THE SHAPE OF THE MISTAKE IS THE ONE WORTH KEEPING.** A quantity was tuned against a symptom for
several hours because the symptom was numeric and arrived from a guard. What the guard was reporting
was a geometry fault, and the number it reported was the size of that fault rather than the size of
the margin. **A floor that cannot be satisfied from either side is not a floor that needs moving.**

## ⚠️ `LORD_HULLS` again, and this time its own comment said it did not

The fourth time a serpent sprite has baked in the generic foe skin. 0283's body did it, 0285's four
extra faces did it, and `boss8Shut` did it again on the first sheet it appeared on — a grey head with
a red eye. Every time it is the same bug: a list of *which sprites belong to a place's real boss*,
written out by hand, that somebody has to remember to extend.

⚠️ **AND THE COMMENT ABOVE IT ALREADY SAID ALL OF THIS**, in this repository's own words, written one
PR earlier: *"what is asked is what sprites does this row mention, not which fields did somebody
remember."* Underneath it, six face fields were named one at a time. **A paragraph promising a
mechanism is not the mechanism**, and the promise is worse than nothing because it is read as
discharged. It walks `Object.values(row.face)` now, which is what *walked* was always supposed to
mean; every field of a `Face` and a `Chain` is a sprite index and nothing else is, which is what makes
that safe.

## ⚠️ The snap, and why it is the player's doing rather than a clock's

The report is not *the mouth does not move* — it moved, on the volley tell. It is *"a non-interactive
wall object rather than a living space serpent trying to battle the player."* A jaw worked on a timer
answers the first reading and not the second: it is the same animation at the same moment for every
player and every run, which is exactly what
[0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md) calls a constant wearing a
mechanism's clothes.

⚠️ **SO THE SNAP IS ARMED BY THE SHIP CROSSING IN FRONT OF THE HEAD.** A pilot who cuts across is
bitten at; a pilot who holds a lane is watched and never snapped at; and neither of them sees the
animation the other does. The side is *committed* rather than sampled — it only changes once the ship
is clear of the head's own width, the same distance the pupil already tracks — so a ship drifting on
the centreline is an animal watching rather than a jaw chattering.

⚠️ **AND THE TELL OUTRANKS THE SNAP, WHICH IS A FIGHT RULE AND NOT AN ART ONE.** The gape means *a
volley is coming*. A snap that could be read as a gape is a tell that fires on nothing, and a tell
that fires on nothing is a tell the player stops reading — so the snap turns the jaw the OTHER way.
Shut, rest, agape is a ladder the eye reads at a glance; two degrees of open is not. The serpent still
flies the pattern its row authors: [0258](0258-one-pilot-a-level.md) holds exactly one boss in the
game that follows the player's lane and it is the eagle, so what reacts here is the face.

## What is held, and where

| Claim | Where |
|---|---|
| the head snaps at a ship that crosses it, and a ship that holds its lane is only watched | `tests/serpent.test.ts`, driven |
| the snap and the strike throw the jaw opposite ways from rest | `tests/accents.test.ts`, in CSS pixels² |
| how far each throw moves the picture | `tests/authored.ts`, `0285-throw` — advisory |

⚠️ **THE DIRECTION IS AN INVARIANT AND THE DISTANCE IS NOT.** A snap that opens the mouth is a bug
however the skull is drawn, so that fails hard. *Each throw moves a twentieth of the skull's area* was
a hard floor for one commit and was reasoned rather than measured — it came out at 2.9% and 2.7%,
against a photograph in which the snap is plainly visible. The swing is a rotation about a hinge, so
where the hinge sits decides how much area a readable throw sweeps, and a skull redrawn with a lower
one would redden it and be right: [0192](0192-a-guard-holds-an-invariant.md)'s own admission test,
answered by demoting it rather than by moving the number until it went quiet.

## ⚠️ What the jaw cannot do, which is geometry rather than taste

The snap stops short of sealed. The hinge sits high and behind the teeth, so the standing fangs rise
toward the roof of the mouth faster than the chin does, and a turn wide enough to close the front
drives them out through the top of the head — measured, the rear tooth crosses the roof at 0.55
radians. The snap is 0.42 and the mouth reads as a hard line rather than a seam. Closing it properly
means re-authoring the skull around a lower hinge, which is a separate change to a separate thing.

## Also here, from the same report

**The mouth is red.** *"There's a weird green bit in the mouth."* It was `skin.lit` at 0.55 filling
the gape, reasoned from the predecessor's lit gullet — and the predecessor's is lit because that
serpent breathes venom. This one's mouth is a mouth.

**There is a forked tongue**, on the wide face only: on the shut one it would be a tongue behind
closed teeth, and on the resting one it would be permanently out, which is a lizard rather than a
snake tasting the air.

⚠️ **AND THE TONGUE RIDES THE LOWER JAW WHOLE**, because a tongue lies on the floor of a mouth. Run
through the same bite-line test the mouth interior uses, it came apart exactly as the fangs did — root
swinging, tips not — and photographed as a crimson spike out through the side of the snout. **The
mouth interior and the tongue are the only two marks on this skull that are not in one jaw**, and only
the first of them actually spans the gap.

## What is still owed on this animal

The body is short and squat: *"it should be long enough to stretch off the screen for a serpent — I
mean add more segments, not stretch out the segments that are there."* That is its own change, and it
reopens two numbers that were argued elsewhere: `tests/budget.test.ts`'s 500-entity worst case
([0022](0022-frame-rate-is-a-feature.md)) and `tests/level.test.ts`'s rule that a boss fits on the
screen, which a serpent whose tail leaves the leading edge is meant to break.
