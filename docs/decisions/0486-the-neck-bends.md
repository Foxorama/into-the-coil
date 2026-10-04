# 0486 — The neck bends

**Accepted 2026-10-04.** Item 8 of [`the-bosses-look-planned`](../../reports/the-bosses-look-planned-2026-10-04.md),
its 6.1, *"the heads do not blend into the body"*. [0464](0464-the-hydra-is-one-beast.md) fixed the root and
left four seams:

1. **the head–neck joint**: each head was its own sprite with its own closed outline, sat on a neck tip 0.085 r
   wide. It turned up to 0.6 rad after the ship while the neck behind it was one rigid bitmap;
2. **neck on neck**: five necks, each with a full outline, overlapping past the body's edge;
3. **the necks did not flash**: head and body had hurt twins and necks and collars did not, so every hit lit a white
   head and a white body with coloured necks between;
4. **the rise**: for the second a neck rises the collar is off and the outline crosses it.

## The rule

**A neck is two bones, and the upper one is the head's.** The neck bends at a knuckle. Below it, the neck's
drawing is turned about its root as before, now drawn only to a knot past the knuckle. Above it, **the upper
neck is drawn into the head's own bitmap**, at the angle the neck stands at rest, and the head turns about the
knuckle carrying it. The head can never turn against its neck, because the neck it turns with is itself. Where
the knuckle is, and the run from it to the head, is `src/content/necks.ts`, which both the bake and the frame
read. The frame may not reach the baker, and the heart's arteries (`src/content/veins.ts`) are the precedent.

**One outline round the head and its upper neck.** The head's outline and the upper neck's two edges are
joined into one line. It runs out along the neck's back to where it meets the skull, round the skull the long way, and
back down the throat. A flesh skull's curve is sampled into a polygon first (`curvePoints`), so the join and
both its washes go straight through the same vertices. Smoothing the joined line rounded the throat
differently from the skull and stood a wash 1.5 px past it. The upper neck swells by 0.6 toward the throat. Its far
end fades into the lower neck, outline and all, on the collar's terms (0464).

**The knuckle**: two thirds of the way up, or nearer the root on a neck so short that two thirds would be inside
its head. It must be at least the skull's radius and three units from the head's centre. Since the ice's neck grew
(below), that only moves the ice's knuckle, one knot down; it is the backstop for a neck drawn shorter.

**The ice head has more neck.** Played on the first photographs: *"the ice head needs more neck on the hydra."* Its
reach goes 28.5 → 36. Along its old heading that put its skull into the fish's, so it is turned from −0.86π to −0.835π,
into the gap between the serpent's head above and the fish's below. Head to head it is about fifteen units from
each, against eighteen and twenty before: the cluster is as tight as it was.

**The heads' colours run down, and the body's do not climb.** Played on the same photographs: *"it should be
more that the head colours blend into each other and the body as opposed to the body blending into the necks."*
0464 laid the body's flesh up each neck's root, so the Mire's skin climbed every neck. That fade is gone. A neck
is its head's colours all the way to its root, and the collar, drawn over the body, carries them out onto the
chest. It now fades over ten units inside the body's outline instead of four. Where five roots crowd the shoulders,
the collars' fades lie over one another and the colours mix. 0464's collar fields that served only the crossfade
(`livery`, `light`) are gone with it. No guard holds this: what it changes is a colour judged on the picture, and
the photographs are the evidence.

**The bend**: `Necks.bend`, 1.2 rad. A head looks at the ship as it always has, as far as the knuckle bends
from its lower neck. At rest that is never, since the look is 0.6. During a rise it is what brings the head up facing the fight.
The first draft carried the head round with its rising neck. It came up nose-down in the acid, and the frost
it threw left from under the lane and was culled on the spot, which `THE HEADS TAKE TURNS` caught.

**The whole animal flashes as one.** Necks and collars have hurt twins (`artHit`, `collarHit` on the row,
required). Whatever lights any piece of the hydra lights every piece in the picture: the body, every head,
every lower neck, every collar and the tail. Each body's own `flashFor` is untouched, because the wash's gap
and the shed ([0334](0334-a-hit-is-an-event-again.md), [0480](0480-damage-sheds.md)) read it
as an event on that body.

**Back to front.** The necks are laid most upright first, so one reaching forward lies over one rising behind it
on every step, whichever grew first. The plan's contact shadow at each collar was not added. Fixed order plus one
outline round each head and neck answered the overlap on the bench, and the shadow waits on whether the play still asks.

**The rise (seam 4) is not addressed.** The collar still comes on in the rise's last tenth (0464).

## Consider the screen

The heads stand where they stood at rest, because the joint is solved so a head turned nought is exactly where a
straight neck put it. As a head looks after the ship it now swings about its knuckle, up to 0.6 rad of a ten-to-
eighteen-unit run, so its mouth moves with its look as it never did. Every head's attack still leaves its own mouth
(`EVERY HEAD'S ATTACK LEAVES ITS OWN MOUTH`), and `tests/crowd.test.ts` and `tests/stuck.test.ts` are green over
every phase of the fight. The head tiles grow from 31 to 58 units to carry their necks, drawn at the same world
size (`HYDRA_SKULL`). There are ten more bitmaps, the twins, and no pool grows: the upper neck rides in the head's
own blit.

## Guards

`tests/hydra.test.ts`, *0486 — the neck bends*:

- **THE ASK, IN PIXELS**: traced at a 1280×720 screen, every head's bitmap is one outline. The way back from the head's
  centre toward its knuckle is inside it at 30, 55 and 80 % of the run.
- **THE HEAD TURNS WITH ITS NECK, DRIVEN**: flown from the step every neck is born, rising and risen, each head stands
  exactly its upper run from its knuckle along its own turn, and is bent no further from its lower neck than `bend`.
  The plan's *"the head's turn equals the upper neck's turn on every step"*, which is true by construction once the
  upper neck is the head's. So what is held is that the head is where its own neck puts it.
- **IN WORLD UNITS**: every neck bends where it has left the body, and far enough behind its head that a neck shows.
- **THE WHOLE ANIMAL FLASHES AS ONE**: one head hit, and the body, every head, neck and collar and the tail wear
  their twins. Every piece's twin is its own.
- **BACK TO FRONT**: the necks are laid most upright first.

0464's two tests found a neck and a collar by the sprite it wore. They now find them by `spriteBase`, what it is,
because a lit neck wears its twin. 0384's probe *every neck carrying the first head* is re-anchored on the head's new line.

## Seen to fail

[0005](0005-a-guard-must-be-seen-to-fail.md). `node scripts/prove-guard.mjs 0486`:

| broken on purpose | went red |
|---|---|
| the head's bitmap the skull alone | `THE ASK, IN PIXELS` |
| the head stood where a straight neck would put it | `THE HEAD TURNS WITH ITS NECK, DRIVEN` |
| no limit on the bend at the knuckle | `THE HEAD TURNS WITH ITS NECK, DRIVEN` |
| the body not lit by a hit on a head | `THE WHOLE ANIMAL FLASHES AS ONE` |
| a head lit only by its own hit | `THE WHOLE ANIMAL FLASHES AS ONE` |
| the necks laid in the order they grew | `BACK TO FRONT` |
| the knuckle with no clearance from the skull | `IN WORLD UNITS: every neck bends where it has left the body` |

0384's nine and 0464's six probes all go red as before.

## Owed

- **A play of the Mire's boss.** Does a head looking after the ship now read as a neck bending? Does the joint read as one?
  The plan asked for a sketch of the joint from the player before building, and this was built without one. The
  photographs are the question.
- **The contact shadow and seam 4**, if the play still asks.

## Rollback

⚠️ **None owed** — [0001](0001-revertability-not-risk-rating.md). Art, content and the frame; nothing persisted.
