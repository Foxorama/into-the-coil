# 0487 — The storm is lightning

**Accepted 2026-10-04.** Item 9 of [`the-bosses-look-planned`](../../reports/the-bosses-look-planned-2026-10-04.md),
its 1.2. The serpent's lightning-phase aura was one 44-unit tile a node, twenty-six nodes and the head, each with three glows
and four tongues and, on five frames of six, a jagged bolt **baked into the tile**
([0305](0305-the-serpent-darkens.md), [0310](0310-the-storm-runs-the-whole-body.md)). Three things read badly.
Twenty-seven overlapping tiles of the same tongues were noise. A bolt in a tile is only ever inside its own tile,
so the storm never ran *along* the body as 0310 asked. And where the tiles overlapped, the violet piled up into a slab.

## The rule

**The lightning is stroked along the body, node to node.** `Aura.storm` on the row: at most `bolts` alive at once,
each running over `span` nodes, re-rolled every `every` steps from its own stream (`bodyBoltRng`, on 0021's
terms) and lit for the first `lit` steps of each. The serpent's is three bolts over two to five nodes, re-rolled
every twelve steps and lit for ten. 0310's *five of six* is kept as the share of a bolt's life it is lit, and
the crackle crawls as each bolt lands somewhere new. The bolts are staggered on their first roll, so they never land together.

The table is fixed (`BODY_BOLT_SLOTS`, four slots of `BODY_BOLT_FIELDS`), laid by `layAura` and stroked by
`paintBodyBolts`. The painter strokes through each node where the renderer draws it this frame, with two jagged vertices a
link swung off the line by at most 0.45 of the node's girth. It uses the one bolt verb ([0233](0233-a-weapon-is-a-kind-and-a-pickup-cycles.md)), in the
enemy's ink. Nothing grows: the bolts pool stays at 42, which the storm's columns already fill, and nothing allocates.

**Under it, a soft glow and one tongue.** A storm node is the haze at 0.55 of its weight and one tongue where it
had four, with no bolt baked in. Its six frames run at six steps where the flames ran at three. The void phase's
aura is as it was.

**Not done: the flare as a bolt.** The plan proposed that the strike's warning become *a bolt from the crown that
reaches the horn tips*. That needs the horns' tips as points on the moving head, and the crown flare
([0310](0310-the-storm-runs-the-whole-body.md)) already warns the strike on the bolt's own clock. It is kept,
and the bolt version waits on whether the play still asks.

## Consider the screen

The lightning phase already warns columns down the lane at the ship, and a bolt on the animal must never be read
as one coming for it. Colour cannot carry that ([0024](0024-the-accessibility-floor-is-settings.md)), so the body
bolts run only between nodes of the body, never out from the head, and the guard holds them on it in pixels. At most four
more strokes a frame, in the phase that strokes the most.

## Guards

`tests/serpent.test.ts`:

- **THE REPORTED ONE, DRIVEN**: in two seconds of the lightning phase every node of the body has had lightning on it,
  no bolt is alight on fewer than a sixth of steps, and the void phase never crackles. This replaces 0310's *five of six
  frames carry a stroke*, which counted strokes baked into frames.
- **and the red lightning flickers**: every bolt the storm uses is lit at some step and dark at another, and no aura
  frame of either phase strokes anything. This replaces 0305's frame count on the same claims.
- **THE CONSIDERED ONE, IN PIXELS** (*0487 — the storm is lightning*): at a 1280×720 screen, every vertex of every body bolt is within its
  nearest node's girth, every one is in the enemy's hand, and no step strokes more than the table holds.

0248's *THE PICTURE* counted hostile strokes as the rain's, and the body bolts are hostile too. It now empties the
table before it draws, because it measures the rain.

Re-anchored: 0310's two probes and 0305's lightning probe, on the row's storm and the frame's
`layBodyBolts`, with their claims unchanged. 0026's on the import line `paintBodyBolts` joined.

## Seen to fail

[0005](0005-a-guard-must-be-seen-to-fail.md). `node scripts/prove-guard.mjs 0487`:

| broken on purpose | went red |
|---|---|
| every body bolt from the first node | `THE REPORTED ONE, DRIVEN` |
| every body bolt lit for its whole life | `and the red lightning flickers` |
| a body bolt jagged past the body | `THE CONSIDERED ONE, IN PIXELS` |
| a body bolt in the player's hand | `THE CONSIDERED ONE, IN PIXELS` |

## Owed

- **A play of the Approach's boss at its last third.** Does it read as lightning on the animal? Is the haze now
  too faint? Its weight is one number (0.55).
- **The roots** (the plan's 1.1) are next.

## Rollback

⚠️ **None owed** — [0001](0001-revertability-not-risk-rating.md). Art, content and the frame; nothing persisted.
