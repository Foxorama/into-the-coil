# 0211 — Every place has its own structure, and the seam rules became a field

**Accepted 2026-09-02.** Finishes the arc [0203](0203-the-rule-was-never-about-size.md) opened, and
pays the debt [0208](0208-the-mire-reaches-down.md) recorded: *a third place promotes the two
theme-gated functions to a table.* Five places at once made it a third, a fourth and a fifth.

> *"crank out the rest of the level backdrops… remember that each level is a deeper step further into
> the galaxy and we want each level to be a distinct and unique section of space"*

## Seven shapes, each read from that place's own character first

The one-line description in `SKY_STYLE_OF` turned out to be the brief every time — the geometry was
written after it, never before:

| place | what its own row says | what it draws |
|---|---|---|
| The Approach | *open space, weather with no direction to it* | a lit horizon: the world being left |
| Ember Nebula | dust in front of light (0207) | dark lanes across the sky |
| Saurian Belt | *tumbling rock: knots of debris with clear lanes* | angular chunks, gathered in knots |
| The Labyrinth | *long structure going past* | corridor walls, dark with a lit edge |
| Rime Shelf | *shards in drifts, all lying the same way* | slivers sharing one lean |
| The Toxic Mire | *the mire SEEPS… reaches you first* (0208) | growth hanging into the lane |
| The Black Heart | *nearly empty, and what is left is drawn one way* | sparse streaks, all converging |

⚠️ **THE APPROACH GETS ONE MARK AND THE BLACK HEART GETS NINE THIN ONES, ON PURPOSE.** The first
level is the baseline the other six deviate from, so a busy sky there spends the contrast between
*ordinary space* and everywhere after it; the last level's character is absence, and what says where
you are is that the few marks left all agree about where they are going. *A deeper step further in*
is a claim about the sequence, so two of the seven are quiet by design.

## The rule

**A place's structure is a row in `STRUCTURE_OF`, a `Record` over `ThemeKind`** —
[0016](0016-a-hub-enumerates-kinds.md)'s shape. Two theme-gated functions each returning `[]` for six
places was honest at two and a guess about the other five.

**Each mark declares which seam rule it takes.** Three decisions' worth of argument became one field:

| | |
|---|---|
| [0206](0206-the-tile-wraps-round.md) | a mark is drawn again at ±`size`, because the copy carries its shape |
| [0207](0207-the-eagle-has-lanes.md) | a mark that **spans** the tile must also arrive where it left |
| [0208](0208-the-mire-reaches-down.md) | a mark that does not span it takes the first rule — **while it stays local** |

`crosses` says which, one painter obeys it, and one guard holds it for all seven at once. **The
fourth author no longer has to discover that there were two rules.**

## ⚠️ Dark-over-light is a contrast measurement, and here it makes the opposite call

0207 and 0208 both drew in the space colour because
[0196](0196-the-backdrop-is-rounded-out.md) measured Ember Nebula and The Toxic Mire at about a third
of the headroom the others have. **The Approach has the most room and the thinnest gas** — so a
silhouette had nothing to be a silhouette against, and its horizon came out *invisible* in the bench
with every guard green.

`lit` is that same measurement making the other call. A place may be lit only where the contrast
budget says it can afford to be. The Labyrinth splits the difference: a dark body with a **lit rim**,
which is [0204](0204-a-landmark-is-lit-by-the-place-it-stands-in.md)'s own language for the Pillars —
one line of light costs almost nothing and is what makes a dark shape legible against thin gas.

## ⚠️ What the probes caught, and it is the same lesson twice

1. **A guard that counted shapes instead of comparing them.** The distinctness guard fingerprinted a
   place as *how many marks, crossing or local, filled or stroked*. `npm run prove` handed Ember
   Nebula The Labyrinth's own wall generator and **it stayed green** — because The Labyrinth also
   emits a lit rim per wall, so the totals differed while the walls were byte-identical. It now
   compares the marks' coordinates, which is what the player sees.
2. **A seam check that read the wrong end of a filled shape.** A crossing polygon closes along an
   edge, so its last point is a corner rather than the far end of the line, and The Approach's
   horizon — which is periodic — was reported as stepping. It now compares the heights the mark
   touches at each edge.

Both are [0027](0027-measure-the-picture-not-the-model.md) aimed at a guard: the measurement agreed
with itself and not with the thing.

## The costs, named

- **0207's and 0208's probes are retired**, and `npm run prove` is what insisted on it: one could no
  longer be applied (the theme-gated function it edited is gone) and the other named a test that this
  decision renamed. Their claims — a lane arrives where it left, a frond stays local, a place's
  structure is its own — are all broken by 0211's probes now, **against the same lines, in the shared
  helper the code moved into**. Re-anchoring would have left two probes making the identical edit for
  the identical guard.

  ⚠️ **A decision whose probe is retired is not a decision whose claim is unproven**, and the
  difference is worth stating: 0207 and 0208 still hold, and what changed is that the code they
  describe is now one table that one probe reaches.
- **Whether any of the seven looks right is not guarded**, on the argument 0204 and
  [0161](0161-the-shape-of-a-level-is-not-guarded.md) both make. Every one was checked in the bench
  ([0205](0205-the-bench-jumps-to-where-the-thing-is.md)) and **The Approach and The Labyrinth were
  both invisible on the first pass** with the full suite green.
- **A play-test is owed on the sequence**, not on any one place. *A deeper step further in* is a claim
  about seven skies in order, and nothing here has been seen in order by anybody.
