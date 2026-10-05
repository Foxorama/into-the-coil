# 0533 — The nova is three rings

**Accepted 2026-10-05.** A play-test note on [0447](0447-the-ward-is-a-third-trigger.md)'s nova, the
ray's ward special. Moves the frame budget on [0153](0153-desktop-is-the-target.md)'s terms, as 0447 did.

## The ask

> *"Ray gun special bomb — needs to travel slightly slower and needs two slightly smaller inner rings
> for visual effect."*

## The rule

**The nova grows 2.9 units a step where it grew 3.5, and two thinner rings travel inside it, each a
band and a gap behind the one outside it. They are a picture: only the outer ring lands, and the nova
reaches exactly as far as it did.**

| | was | is |
|---|---|---|
| **its speed** | 3.5 units a step: the lane's height (120) in 0.55 s, the reference view's far corner from the ship's station in 0.95 s | 2.9, a sixth slower: the lane's height in 0.67 s, the far corner in 1.15 s; the nova closes, its last inner ring gone, at 1.25 s |
| **its rings** | one | three: the edge, one 10 units behind it drawn at 0.85, one 19 behind at 0.7 (`Nova.rings`, on the row). An inner ring is laid once it is clear of the ship's own radius, so they leave the ship one after another |
| **what lands** | the ring | the outer ring, unchanged: shots its band touches, a body once as it crosses, a boss once. An inner ring strikes, pops and reaches nothing |
| **its reach** | it closed the step its edge passed the view's far corner by a piece | the same last landing; it stays open until the innermost ring has left the view, and lands nothing in those steps |
| **its pool** | 40 | 180 |
| **the worst case** | 746 | 886 |

## Why it is built the way it is

**Slower by a sixth, and the reach did not move with it.** *"Slightly"*: 3.5 to 2.9 is 17%, about a
tenth of a second longer to cross the lane and a fifth of one longer on the screen. The nova's reach was
never its lifetime — it closes when its edge is past every corner of the view — so slowing it changes
when it gets somewhere and not where it gets to.

**The inner rings are the outer ring's pieces, smaller.** The ring is already one baked piece of band
laid round the radius (0447); an inner ring is the same piece drawn at a `swell`, the per-entity size a
chain's body and a blade already use, so there is no new sprite and nothing new is stroked. The spacing
shrinks with the piece: half a piece apart is what makes two triangle windows sum to an even band, and
a smaller piece is a shorter one. The first photograph of them, enlarged, shows three even bands
narrowing inward with a dark line between each.

**Ten and nineteen behind**, because the band is about seven units of glow across: ten leaves a dark
line between the edge and the first ring, and nine more between the first and the second, which is
narrower. At the radius the nova spends most of its time at — past a hundred — that is a ring a tenth
smaller and one a fifth smaller, which is *"slightly"*.

**A picture and nothing else.** Everything an inner ring passes, the outer ring has already crossed:
the radius only grows. The one thing it can pass untouched is a shot fired from inside the ring after
the edge went by, in the three to seven steps before an inner ring reaches it — see *Owed*.

**The edge stops landing where it always did.** The rings keep the nova open about seven steps longer,
until the innermost has left the view; without a gate the edge would go on striking what waits beyond
the view's leading corner in those steps. It lands while its previous radius was within the far corner
plus a piece — exactly the steps a single ring was open for.

**The pool, and forty was already short.** 0447 sized the nova's pool at the ship's station: about
thirty pieces, forty with headroom. Pressed from forward of the station one ring laid fifty, and the
pool cut it short — a ring with a gap in it, which nothing guarded. Measured over the lane on both the
reference and the widest view, three rings lay at most 161; the pool is 180, the shots' tenth of
headroom, and `CAPACITY` totals 886 against the worst case. A hundred and forty more blits of one baked
bitmap, for the second a charge is spent, on a desktop target.

**Under the flash cap.** `scripts/weigh-flashes.mjs --only=nova`, thrown as often as the game allows
for eight seconds: no general flashes either side of the change, peak changing area 4.0% before and
3.4% after (the cap's area is 11.1%). The rings are thin bands, not a filled area, and 0375's gap was
never theirs.

## Rollback

⚠️ **None owed** — [0001](0001-revertability-not-risk-rating.md). No storage key, save field or shipped
surface moves: the nova is run state, and the run is not saved.

## What guards it

`tests/ward.test.ts`: every piece lies on the radius that lands or on one of the row's inner rings at
its own distance and size, and every inner ring the row names is drawn; **the nova reaches no farther**
— a body beyond the edge's last landing, ahead of the view, is untouched though the edge grows past it
while the rings keep the nova open; and **the pool never fills**, swept over the lane on both views.
The seconds the ring is on screen are still held between 0.4 and 1.5. Probes in
`scripts/probes/0533-the-nova-is-three-rings.mjs`. `tests/budget.test.ts`'s worst case moved with the
pool, and `scripts/probes/0286-a-serpent-runs-off-the-screen.mjs` was re-anchored on it.

## Owed

- **A play on the preview**: whether 2.9 reads as *slightly slower*, and whether the three rings read
  as one burst with an echo rather than as three things that each pop.
- **Whether an inner ring passing over a shot it does not pop reads as a miss** — 0036's question. The
  window is a shot fired inside the burst within seven steps of the edge passing; if a play reports it,
  the answer is the inner rings popping shots on their band, which costs no damage.
