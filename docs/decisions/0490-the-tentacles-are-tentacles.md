# 0490 — The tentacles are tentacles

**Accepted 2026-10-04.** Item 10 of [`the-bosses-look-planned`](../../reports/the-bosses-look-planned-2026-10-04.md),
its 7.3. The plan's diagnosis: five tentacles of eight capsule lengths each, laid on a **straight line** from root to tip
with a sideways sine added ([0403](0403-the-tentacles-pull-out-of-the-heart.md)). The wave moved only across the lane,
and the lengths were rods turned to the next one. It read as a chain of rods wiggling.

## The rule

**The wave runs across the arm and down it.** Each slack tentacle swings across its own line from root to tip,
`Tendrils.waves` half-waves at once (1.5): an S that travels, its swing growing to the tip, with a second harmonic at twice
the rate to curl it. A held volley still straightens every arm onto its beam's root ([0403](0403-the-tentacles-pull-out-of-the-heart.md)).

**The tips alight before a laser leaves them.** `Tendrils.lit`: in the last twenty steps of a beam's warning, the last three
lengths of every tentacle wear `tendrilLit`, the same length with its core charged. This is read off the beams already in
the air, as the serpent's crown flare is, never a timer of its own. The line down the lane says where; this says *now*,
at the thing it comes out of.

**Frilled oral arms under the bell.** `Tendrils.frills`: four ruffled ribbons of the bell's glass, rooted on its rim
between the tentacles. They hang down the lane behind the bell (the aura layer) and sway slower than the tentacles wave.
Pictures, in no pairing. *"A medusa has both, and the frill is what makes a jellyfish read."*

## What the plan asked for and this does not do

- **Twelve lengths a tentacle.** Twenty more lengths is twenty more entities against 0022's worst case, which is already
  full ([0286](0286-a-serpent-runs-off-the-screen.md)'s line). The share 0022 names as sheddable is the particles',
  and `tests/flares.test.ts` prices their fullest moment at 148.9 of the 149 they have. Twelve would be bought with a
  boss's explosion, or by reopening 0022, which the budget test says is a conversation about WebGL. So it stays eight. The
  curve is the wave's, and at an S and a half eight lengths draw it without a kink.
- **Drag** (each length lagging the bell's across velocity). The bell is socketed: it holds the lane's middle and does not
  slide (`socket`, [0400](0400-the-heart-is-the-room.md)), so a lag would have nothing to answer.

## Consider the screen

The lasers are warned along their path ([0388](0388-the-laser-is-jagged.md)), and the lit tips are at the root of that
warning, never past it. The arms stay within the bell's rim and hang down the lane over its own shadow. Nothing they do
reaches toward the ship.

## Guards

`tests/medusa.test.ts`, *0490 — the tentacles are tentacles*:

- **THE ASK, IN LANE UNITS**: sampled through one beat with no volley held, a tentacle crosses its own line, more than
  half a unit each side, on more than half of the samples.
- **THE TIPS ALIGHT, DRIVEN**: through a volley, every tip is lit exactly on the steps a beam's warning is in its last
  twenty, read as the step begins, and at no other step.
- **THE FRILLS**: four arms laid, each within the bell's rim, never turned past its sway, and swaying.

## Seen to fail

[0005](0005-a-guard-must-be-seen-to-fail.md). `node scripts/prove-guard.mjs 0490`:

| broken on purpose | went red |
|---|---|
| a wave too long to bend the arm | `THE ASK, IN LANE UNITS` |
| the tips never charged | `THE TIPS ALIGHT, DRIVEN` |
| the tips alight for the whole warning | `THE TIPS ALIGHT, DRIVEN` |
| the frilled arms never laid | `THE FRILLS` |

0403's six probes all go red as before.

## Owed

- **A play of the Black Heart**: do the arms read as a jellyfish, and do the frills read as frills or as froth?
- **The glow by health** (the plan's 7.4) is next.

## Rollback

⚠️ **None owed** — [0001](0001-revertability-not-risk-rating.md). Art, content and the frame; nothing persisted.
