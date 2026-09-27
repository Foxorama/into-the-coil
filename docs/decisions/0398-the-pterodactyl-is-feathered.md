# 0398 — The pterodactyl is feathered

**Accepted 2026-09-27.** The Saurian Belt's end boss is redrawn: a feathered body with a cannon on
each shoulder and one in its throat, its wings a layer of their own beating behind it. Its first stage
throws feathered quills off both wings; its wing lasers leave the shoulder cannons; its mouth laser
leaves the throat cannon with the beak open; and each stage's face lights what is about to fire.

## The ask

> let's work on the pteradactyl at the end of level 3 - we haven't uplifted the art or animation or
> attacks there at all. It needs feathers, lazer cannon when it opens it's mouth to fire, shoulder
> mounted lazers for when it fires/two and three etc. The initial bullet firing needs to be shooting
> feathered quills from it's wings rather than tiny bullet shapped things now

## What it was

[0264](0264-the-real-bosses-are-drawn.md)'s drawing: one polygon with the beak, crest and wings in it,
three plates a wing and an eye; no face. It sprayed 1.9-unit lances from its centre, and its wing
lasers left the wingtips, eighteen units out, from nothing drawn there.

## What changed

**The body** (`boss10`, still 44 units, hurtbox unmoved) is the head, neck, torso, a talon either
side, a fanned tail — and the cannon pods. It is covered in rows of contour feathers, staggered and
shrinking aft, with a plumed crest over the nape.

**Faces.** Its eye follows the ship (`up`, `down`). `gape` is a face per stage: nothing in the first
(the quills come off the wings, and a beak that opened for them would lie), the shoulder cannons lit
in the second, the beak open on the throat cannon in the third, both in the last. `wearFace` now also
holds the gape **while a laser is on the screen** (`holdFor`, the brace [0250](0250-the-quetzal-screams.md)
already stands the hull in), so the beak stays open through the whole warning and beam rather than
shutting on the step the line appears.

**The wings beat.** `quetzalWing0–7` are eight frames of a wingbeat in the layer behind the hull —
the aura layer the fish's fire is drawn in, turned to its hull — so the animal flaps without eight
copies of every face. They are long feathered wings: an arm and a swept hand, coverts along both, and
a band of flight feathers — six pointed primaries and five rounded secondaries. **`Aura` may now
author `hurt` frames**, worn while the hull is lit, because a wing is flesh and a flame is not: a hit
that lit the animal minus its wings would be [0374](0374-the-fish-beats-its-tail.md)'s tail defect
again. Each stage beats faster (5, 4, 4, 3 steps a frame).

**The shoulder cannons are where the beams leave.** Their muzzles are drawn at 0.6 of the radius —
eleven units — so the wing beams' `from` is ±11 where it was ±18. In the last stage that closes the
two gaps between its three beams from thirteen units to six: threadable and uncertain, with open lane
either side of the braced hull for a player who would rather go round. Widths, timings and cadence
are unchanged.

**Quills.** A new shot, `quill`: a flight feather, point first, 5.6 units long with a hurtbox a
quarter of that, where the lance was 1.9. A body three times the size at the lance's speed would be
more to dodge in less time, so it flies at 1.3 against the lance's 1.6. **A spray may name `from`** —
places on the hull, each throwing its own fan with the volley's shots dealt out between them — and
the first stage throws four, two off each wing at the wrist.

## The guards, and that each was seen to fail

`scripts/probes/0398-the-pterodactyl-is-feathered.mjs`, every break red:

| guard (`tests/quetzal.test.ts`) | the break |
|---|---|
| *THE QUILLS*: every shot of the first stage is a quill, from further across than the hurtbox, off both wings; at least 30 px long on a 1280×720 screen | the spray from the centre; the quill drawn at the lance's size |
| *THE SHOULDER CANNONS*: every non-mouth beam leaves within half a unit of the muzzle as drawn | the shoulders back at 18 |
| *THE TELL IS THE BODY*: for every step a laser is on the screen, the stage's gape face is worn | the `holdFor` clause removed |
| *THE WINGS BEAT*: six or more frames a second, never none, and a hit lights them | the hurt set ignored |

0304's, 0310's and 0373's probes were re-anchored on the two lines this moved and are still red.

## Not held by any guard

**Whether it reads as feathered, and whether the wingbeat reads as flight at speed.** Photographed on
the bench in every stage; the beat is frames the pane freezes. Owed a play.

No rollback note: no storage key, save schema, cache prefix or origin is touched.
