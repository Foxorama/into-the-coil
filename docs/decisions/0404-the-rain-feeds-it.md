# 0404 — The rain feeds it

**Accepted 2026-09-28.** A moon jelly that drifts into the jellyfish, its bell or any tentacle, is taken
back into it and heals it by a twentieth of its health. The rain falls crown up, in six glows. **A boss
can heal**, and a heal over a phase's line is that phase again. **Amends
[0255](0255-the-jellyfish-opens.md)'s moon jelly.**

## The ask

> 9. the falling jellyfish need to be rotated so that they are correctly dropping down and need to be a
>    different colour to the boss jellyfish and they should randomly have a range of glowing colours as
>    they fall down (reds, blues, greens).
> 10. If a falling jellyfish hits the boss, the boss regains 5% health and the jellyfish disappears ->
>     this includes if they hit a tentacle.

Two questions went back, and were answered. Which way up: *"bell up, sinking"*, with the dome on top
and the fringe hanging under it. And a heal that carries the health back over the last fifth's line:
*"the bell closes again."*

## The rules

**A fall may `feed`.** `Fall`'s `body` arm takes `feeds`, a share of the boss's full health. `feedBoss`
runs after the stone and before any pairing. Every body of the fall's kind that overlaps the hull or a
body of the animal (`bossBody`, the tentacles) is gone on that step, in a burst where it met it. The
hull gets its share back, never past full. A beaten boss is not fed.

**A heal over a phase's line is that phase again.** `phaseFor` reads health, and the transition already
fired on any change of phase rather than on an advance. The comment that said a boss could not heal now
says one can, and the bell shutting gets the same burst and cue as any other phase turning over, because
the player must see it ([0036](0036-an-event-the-model-knows-about-the-picture-mentions.md)). A worn
body goes back to the row's (0402).

**Crown up.** Every body is baked crown to `−x`, and `rainBodies` turns a falling one a quarter, so the
crown is up the screen and the fringe hangs under it.

**Six glows** — crimson, rose, azure, cyan, emerald, lime — none of them the boss's violet. `EnemyRow.tints`
lists them, each with its own hurt twin. A falling body takes one **by a hash of where it formed, not a
draw**, so no stream a level already spends ([0021](0021-one-stream-per-concern.md)) moves by one. A
palette with no hue keeps its own skin.

## What it changes about the fight

The rain is the player's to shoot twice over: once because it hurts, and once because it feeds. A jelly
left alone near the animal is five percent of a long fight. In the last fifth it can shut the heart
away again.

## The guards, and that each was seen to fail

`scripts/probes/0404-the-rain-feeds-it.mjs`, in `tests/medusa.test.ts`:

| guard | the break |
|---|---|
| *a moon jelly that drifts into the jellyfish is gone, and gives it back a twentieth* | the feed never called |
| *and one that drifts into a tentacle feeds it too* | the tentacles left out of the overlap |
| *a heal over the last fifth's line shuts the bell* | the heal capped under the phase's line |
| *every jelly falls crown up, in one of its glows, and a fall wears more than one* | no quarter turn; every jelly the first glow |

## Not held by any guard

**How often the rain reaches the animal in a real fight, and whether five percent is the right bite.**
That is the fight's length moving, which [0386](0386-every-phase-is-fought-for-as-long.md) measured
before any of this existed. Owed a play and, if it drags, a re-band.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md).
