# 0381 — The fish is bigger, and its tail is one animal

**Accepted 2026-09-27.** The flying fish is drawn 50 units across where it was 42 — a fifth bigger,
300 CSS pixels on a 1280×720 screen where it was 252 — with every face, both tails and the ember
scaled with it and the hurtbox grown in proportion. The tail's base reaches forward under the body
and the body's stump stops inside it, so the join is a curve drawn over flesh; the beat is slower and
shallower, and the hull no longer yaws. **Amends** [0374](0374-the-fish-beats-its-tail.md).

## The ask

> *"the graphic for it needs to be a bit bigger as well — and the animation is… a bit funky and
> weird, we could keep it, but it's definitely not a high quality boss at the moment and that applies
> to everything from visuals and animation etc"* — 2026-09-27, on the fight 0373–0375 shipped.

## What was photographed before anything moved

Eight frames of one beat on the bench at three times the pixel density, seventy milliseconds apart —
offset from the beat's own period on [0313](0313-the-fish-breaches.md)'s lesson about round seconds.
What they showed: the body's stump ran on past the fin's root as a rounded knob, and the fin pivoted
on the knob's end like a flap pinned to it. The hull turned a few degrees against the fin each beat,
which at 42 units on a starfield read as the picture wobbling rather than a body flexing. That is
*funky and weird* in two parts, and a third that no photograph shows: two and a half beats a second
is a small fish's tail, not a boss's.

## The rule

| | was | is | why |
|---|---|---|---|
| the hull's tile | 42 | 50 | *a bit bigger*; the faces, the hurt twins and the ember's tile (46 → 54) in proportion, one box for the animal (0319, 0320) |
| the hurtbox | 15 | 18 | the same share of the drawing it always was — a bigger fish is not an easier one to hit |
| the tail's tile | 24 | 28 | the same proportion to the hull |
| the fin's base | at its root | reaching 0.27 of its radius forward under the body | the join is under flesh; see below |
| the body's stump | to 0.85 of the radius | to 0.80 | inside the fin's base, so what shows at the peduncle is the body's curve over the fin |
| the beat | 26 steps, 0.42 rad | 32 steps, 0.34 rad | under two beats a second, and a flying fish glides more than it swims |
| the yaw | 0.06 rad | 0 | a rigid picture turning against its tail wobbles |

⚠️ **THE JOIN IS MEASURED ON THE OUTLINES AND NOT EYEBALLED**, because a seam beside a fin is the one
thing a separate tail reveals: at the stump's aft end the fin's outline is wider than the stump, and
the fin's base corners, turned the row's full sweep either way about the root, stay under a body that
is wider there. Photographed after, the fin emerges from the peduncle as one shape at every phase of
the beat.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0381`:

| broken on purpose | went red |
|---|---|
| the fish drawn at its old size again | `THE ASKED-FOR ONE: the fish is drawn a fifth bigger than it was` |
| the hurtbox not grown with the drawing | the same |
| the body's stump run out past the fin's base again, so the knob shows beside the fin | `and the join is under the flesh` |
| the fin's base pulled back behind its root, so the stump ends beside it | the same |

0374's *the hull yaws AGAINST it* is gone and its probe with it — a break of a line that multiplies
by zero proves nothing — and its place is *the hull holds its heading*: less than a hundredth of a
degree on station over two beats, while the fin sweeps its full arc.

## What this deliberately does not do

- **No wing animation.** The pectorals and their filaments are paint on the body's bitmap, and a
  flap is the whole-hull frame set 0374 refused. If the play still calls the animal stiff, that is the
  next drawing and its own decision.
- **It does not resize any other boss.** *A bit bigger* was said of the fish.
