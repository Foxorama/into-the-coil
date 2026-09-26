# 0374 — The fish beats its tail

**Accepted 2026-09-26.** The flying fish's caudal fin is a body of its own, drawn in the layer behind
the hull, rooted on the peduncle and turned about it every step; the hull yaws against the beat by a
fraction of the sweep. A `Tail` is a row field, `null` on thirteen bosses; a phase's `Look` may wear a
different tail on the same root, and the grown fish does. **Builds on** [0306](0306-the-serpent-coils-in.md)
(`blit` takes an angle), [0318](0318-the-fish-is-drawn.md), [0320](0320-the-fish-kindles.md).
**Amends** 0320's guard on where the grown body reaches aft, which reads the tail now.

## The ask

> *"animation should be better"* — of the fish boss, 2026-09-26, with the intro sound and the adds.

## What the animal did before this

A hull is one bitmap, blitted (0022). What moved on the fish was its face — the pupil, the gape, the
snap (0319) — and, from half health, an ember behind it (0320). The body itself glided: on station it
was the same drawing every step, level, with nothing about it that said *swimming*. The breach turned
the whole hull to its arc (0313), which is the one thing a bitmap can do, and it did it once.

## The rule, and why a separate body rather than frames

`blit` cannot deform a bitmap, and a set of whole-hull frames for a tail beat is eight faces times two
bodies times however many poses — the price 0320 paid once for one extra body and called *the one
that costs*. The one part of a fish that has to move is the tail, so the tail is baked apart:

| | |
|---|---|
| `art` | one bitmap and its hurt twin, pivoted on the bitmap's own centre, which is where the painter puts the peduncle — so the angle `blit` already takes IS a turn about the root |
| `root` | 13.4 world units aft of the hull's centre, along the hull's heading: 0.76 of the drawing radius, where 0318's caudal fin left the body |
| `beat` | 26 steps a cycle — about two and a third beats a second, slower than a fish this size swims, because a beat the player is meant to SEE has to be slower than the ember flicker it shares a screen with |
| `sweep` | 0.42 radians each way |
| `yaw` | 0.06 radians the hull turns against it, the other way — a seventh of the sweep. The hull answering the fin is what makes the beat a swim and not a flag on a pole |

The tail lives in `bossAura`, the layer 0305 made for what is drawn BEHIND a hull, in the last slot,
so it is over the ember and under the flesh. Every slot of that pool is re-laid every step, so which
entity is the tail is a question about the count and never about identity. It wears the hull's own
hurt state, so a hit lights the whole animal (0035). The yaw is written on the hull in `layTail` and
nowhere else, and only once the entrance has handed over — a breach turns the hull to its own arc.

⚠️ **THE BODY LOST ITS FIN, AND THE STUMP IS WHAT HIDES THE JOIN.** Both outlines end in a rounded
stump past the peduncle; the fin's base is the peduncle's own width at the root, and turned the full
sweep either way its corners stay under a body that is wider there. That was measured on the outline
rather than eyeballed, because a seam beside a fin is the one thing a separate tail would reveal. The
tail's rays, its notch light and the streamer off the lower lobe moved to the tail's tile with it.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0374`:

| broken on purpose | went red |
|---|---|
| the sweep zeroed, so the tail is rooted and never beats | `THE ASKED-FOR ONE: … it BEATS` |
| the tail laid on the hull's centre rather than on the peduncle | the same |
| the hull no longer yawing against the beat | `and the hull yaws AGAINST it` |
| the tail never wearing its hurt twin | `and the tail wears the hull's own hurt` |
| the caudal fin painted back onto the body, so the fish has two tails | `and the body has no tail of its own any more` |
| the tail laid in the first slot, under the fire and overwritten by it | `and it is laid LAST in the layer behind the hull` |

**In the player's units** (0027): the guard asks how far the lobe tip travels on a 1280×720 screen —
the chord of the relative swing at 0.91 of the tail tile's radius — and refuses under twelve CSS
pixels. Two other guards moved with reasons: 0313's *level on station* reads the row's yaw as its
tolerance, and 0320's *it rose aft* reads the grown TAIL's reach, because the body no longer has one.

## What this deliberately does not do

- **No pectoral flap.** The wings and their filaments are paint on the body's bitmap; a flap is the
  whole-hull frame set this decision refused, and the tail is the part of a fish that reads as swimming.
- **It does not photograph the join.** A sprite sheet shows the tail apart from the body, and the
  bench freezes the sim; the seam is held by arithmetic on the outline and owed an eye in flight, on
  the deployed preview, with the rest of this PR.
- **Nothing on any other boss.** `tail` is `null` on thirteen rows, on `entrance`'s terms: the row
  states its version and shared code holds the arithmetic and no opinion (0282).
