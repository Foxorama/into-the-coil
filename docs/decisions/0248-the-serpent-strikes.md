# 0248 — The serpent strikes

**Accepted 2026-09-05**, the same day as [0247](0247-a-level-has-a-mid-boss-and-a-real-one.md),
the first of the real bosses' own decisions, from
[`the-bosses-asked`](../../reports/the-bosses-asked-2026-09-05.md):

> *"Jormungandr (there's some notes around it somewhere) with acid blast attacks, void blast
> attacks and then a space lightning bolt attack that rains down from the top of the screen, it'll
> need warning lines."*

**Amends [0247](0247-a-level-has-a-mid-boss-and-a-real-one.md)**: the serpent's row is the fight
the brief described, not a stand-in. **Amends [0111](0111-a-boss-has-one-idea.md)**: a phase may
change what a boss throws and how. **Amends [0098](0098-a-wave-plays-a-figure.md)**: a boss may
introduce a bullet of its own.

## The rules

**A phase says what it throws.** `BossPhase.shot` and `BossPhase.attack` are a `ShotKind` and a
`BossAttack` or `null`; `null` is the row's, and a phase that keeps the row's is a decision made
(0016). `stepBoss` fires the phase's attack with the phase's bullet. The serpent throws a wall of
acid while it is whole, a spray of void once it is hurt, and lightning at its last third — three
weapons in one fight, which is the whole of what the brief asked of every real boss.

**Acid and void are shots of their own, in inks of their own.** `acid` and `void` join `SHOTS` and
`Ink`: a drop and a ring, the two biggest bullets in the game and the two slowest, on 0098's rule
that the bigger a bullet is drawn the slower it goes — acid 5 units at 0.8 a step, void 4.2 at
0.9, both under `flak`. Their hurtboxes are their own (1.5 and 1.2 against every enemy bullet's
0.9), on purpose: a blast is bigger to hit as well as to see, and `tests/combat.test.ts` holds each
inside its drawing. The vivid palette gives acid a sour lime and void a hot violet, far from `ally`'s
lavender on saturation; the high-contrast palette pure green and deep violet. Both clear every floor
`tests/palette.test.ts` holds a meaning ink to.

**Lightning falls in columns, and every column warns first.** The `rain` attack: a volley picks
`shots` places along the lane inside the box the ship can fly in, on the fight's own random
stream (`rainRng`, 0021), and puts a bolt in the arc's own pool for each — `RAIN_BOLT_KIND`, from
the top edge of the lane to the bottom, its life the row's `warning` plus the strike's eight
steps. For the warning the painter strokes a straight, thin, dim line in the enemy's ink; for the
strike, the arc's own jagged bolt with its points and twig, hostile. On the one step the warning
runs out, a ship within `halfWidth` of the column along the lane is hurt through `wound` — the
same three lines every collision pairing shares now — and a ship already lit is not hurt twice.
Nothing is spawned into `enemyShots`: a line across the whole lane is not a body.

**The warning is what makes it fair.** *"Is this unfair, or is this a learnable strategy?"* Forty-five
steps is three quarters of a second: long enough to leave a line, short enough that three columns
a volley are a threat. `THE RAIN` in `tests/serpent.test.ts` holds it in the player's unit — a ship
parked under a column is untouched for at least half a second and IS struck when the line becomes
lightning — and `THE PICTURE` holds that the warning is drawn dim and the strike bright, both in
the enemy's hand.

**The bolt verb takes a hand.** `Surface.bolt` gains `hostile`; the canvas keeps a second glow and
core, set with the palette like the first, so a stroke per frame costs a branch and never a string.

## The figures

| phase | at | attack | bullet | cadence |
|---|---|---|---|---|
| whole | 100% | a wall across the lane, two blasts either side | acid, 1 hit, 1.5 hurtbox | every 84 steps |
| hurt | 66% | a spray down the lane, three wide | void, 2 hits, 1.2 hurtbox | every 66 |
| the last third | 33% | three columns of lightning, three-quarter-second warning, four units either side | — | every 54 |

## ⚠️ What was rejected

**A lightning bolt as a fast bullet from the top edge.** A body falling down the lane is dodged
across; the ask is *from the top of the screen*, which on this lane is the across edge, and a
strike that spans the lane is dodged along — a different question to the walls and the sprays,
which is what a third weapon is for.

**Warning lines drawn as bullets.** The bolt verb already draws a line the picture owns; a warning
made of `enemyShots` would be things the ship can be hit by while being warned.

**One ink for both blasts.** *"All the enemy bullets are exactly the same"* was the report 0098
answered; the serpent's three weapons in one colour would be that report at one boss.

## What is owed

- **An eye on the lightning at the shipped camera**: whether a line down the whole lane reads as
  a warning or as a wall, and whether three quarters of a second is a warning at all under fire.
- **The notes in the predecessor** — *"there's some notes around it somewhere"*. `CLAUDE.md` opens
  it for a named file and a named reason; the name is not known yet.
- **A thunder cue.** The strike sounds as `bossShot`; a crack of its own is a cue and a decision.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). Content, two fields on a phase,
a verb's flag and a pairing; nothing persisted.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0248`:

| broken on purpose | went red |
|---|---|
| the phase's shot ignored, so the serpent throws acid in every phase | `THE THREE WEAPONS: acid while whole` |
| the void blast drawn in the enemy's bullet ink | `THE ACID AND THE VOID: two shots of their own` |
| the warning authored to nothing, so the lightning lands the step its line appears | `THE RAIN: a volley draws its warning lines first` |
| the strike landing on nobody | `THE RAIN: a volley draws its warning lines first` |
| the columns falling a whole view up the lane, beyond the ship's box | `THE RAIN: a volley draws its warning lines first` |
| the strike's half-width the whole view | `and a ship elsewhere on the lane is not touched` |
| the lightning stroked in the player's own bolt inks | `THE PICTURE: the warning is drawn dim` |

And 0098's guard, rescoped rather than widened: every hostile bullet in the table is sent by an
enemy, a boss's row or a boss's phase; the enemies still send three kinds; the shared hurtbox is
the enemies' bullets'.
