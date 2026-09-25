# 0374 — The storm and the whirlpool

**Accepted 2026-09-26.** The arc's special is the **storm**. It is thrown to the bomb's reach, and
where its fuse runs out it strikes the six nearest bodies on the screen, chains twice from each, and
throws a flicker of bolts across the screen for half a second. The shuriken's special is the
**whirlpool**: three spiral arms of eight big blades opened ahead of the ship. It turns and grows,
lands on a boss again and again, and is gone once none of it can be on the screen.

This is the third of four changes on one ask
([`the-arsenal-planned`](../../reports/the-arsenal-planned-2026-09-26.md)), after
[0372](0372-a-death-keeps-the-ladders.md) and [0373](0373-a-special-is-the-guns-own.md).

## The ask

> *"lightning-gun - fires a glowing lightning flickering projectile forward that explodes into a
> massive lightning blast that sends lightning flickering all across the screen and chains twice for
> each hit"*
>
> *"shuriken cannon - fires a huge shuriken in a whirlpool shape that gets progressively bigger, the
> radius needs to be large enough that it lasts until every part of the whirlpool arc will no longer
> be on screen, it can hit bosses multiple times as it whirlpools around"*

## The rule

**A special row is exactly one of four shapes**, and `tests/bombs.test.ts` holds that every row is
one:
- a **blast** (`shot` + `becomes`), the bomb;
- a **storm** (`shot` + `storm`);
- a **surge**, 0373's overdrive and hunt;
- a **whirlpool** (`whirl`).

A thrown body carries which special it is (`reset`'s `kind`), so `stepBombs` reads that special's own
row rather than the bomb's.

**The storm is the arc's targeting, all of it.** `nearestFrom` finds its targets, so only a body
whose whole hull is on the screen is struck (0257), nothing is struck through stone (0349), and
nothing is struck twice by one storm.
- **Strikes.** It makes `strikes` of them, each to the nearest body anywhere on the screen.
- **Chains.** Each strike chains on to `chains` more within `reach`. There is one generation: a
  chain that chained again would be a search of the whole field from every body it reached.
- **Damage.** A body takes `damage`. A boss is struck once per storm, for the larger of that and
  `bossShare` of its full health (0372's shape), multiplied by the window.
- **Flicker.** `flicker` bolts go to random places on the screen, renewed every bolt's lifetime for
  `flickerSteps`, on their own `stormRng` stream. Where a cosmetic bolt goes must not move where the
  arc's next link lands (0021).
- **The flash cap.** It is thin strokes, not a change of the screen's brightness, which is what
  0024's cap is about. It is lit for most of those steps, with a one-step gap between generations,
  and that gap is the flicker.

**The whirlpool is its own pool, placed by hand and never culled.** A blade that swings off the edge
swings back on, and `stepEntities`' cull would take it for good.
- **Its shape.** Every step it turns by `spin` and grows by `grow`, about a centre held `ahead` of
  the ship in the camera.
- **Landing.** It lands as a blade does: never spent, once per flash per blade. Nothing else steps
  its pool, so it counts each blade's landing gate down itself.
- **Stone.** A blade whose centre is in stone lands on nothing while it is there, and is not
  destroyed, because its arm comes round again (0349).
- **Its end.** It closes when its innermost blade's inside edge is past the farthest corner of the
  view: *"until every part of the whirlpool arc will no longer be on screen."*
- **Death.** It survives the death of the ship that opened it, where a bomb does not, because it
  cannot hurt the ship.

## What was measured, and what that changed

What one special takes off each boss at Savior, from 60 and 100 units short of the hull:

| boss | bomb | storm | whirlpool |
|---|---|---|---|
| jormungandr | 5.0% | 5.0% | 3.6–10.1% |
| volans | 5.0% | 5.0% | 4.4–6.3% |
| quetzal | 5.0% | 5.0% | 4.0–6.3% |
| gyre | 5.0% | 5.0% | 8.0–9.2% |
| hoarfrost | 5.0% | 5.0% | 2.8–5.1% |
| hydra | 5.0% | 5.0% | 3.5–5.1% |
| medusa | 5.0% | 5.0% | 4.0–4.7% |

The ask gives neither special a number, so both were set against the bomb's twentieth.

**The first whirlpool was a picture with holes in it.** At a gap of 7 and a twist of 0.35, the blades
along an arm stood eleven units apart, wider than a blade. A body between two blades was measured
never to come within nine units of any of them, and was never touched. The arms are now gap 5 and
twist 0.25, with each blade swelled to 2.2 times the gun's own. Before that, it took 1–3% off a boss
over three seconds. It now grows at 0.7 a step, lasts three to four seconds, and lands 4 per
landing.

**The first storm ball was a hollow ring.** The glass ink it was lit with is dark.
`scripts/shot-sheet.mjs` showed it, and it now has a lit core and four translucent forks. The forks
are translucent because 0227 holds solid paint to the hull.

## What it costs

- **The entity ceiling is 614, and it was 560.** The storm's worst moment is thirty bolts: six
  strikes, twelve chains and a flicker of eight that overlaps its renewal by a step. The whirlpool is
  twenty-four blades. Both are the player's own fire on the one moment they spend a charge, on a
  desktop target, on 0364's terms: thirty strokes and twenty-four blits. The particle share was not
  touched.
- **The storm does not feed a void.** The arc's link is eaten by a void on its line (0292); the
  storm's strikes are not, because a void eating a screen-clearing bolt would be the player's charge
  spent on an enemy bullet. Flagged here in case play says otherwise.
- **The storm sounds like the arc, and the whirlpool like the blades** (`zap` and `throw`).
- **The cues a surge, a storm and a whirlpool deserve of their own are owed together.**

## Confirmed, not assumed

Every probe in `scripts/probes/0374-the-storm-and-the-whirlpool.mjs` breaks one claim and was seen to
turn its guard red under `npm run prove 0374`:

| break | guard |
|---|---|
| the arc's overflow a bomb again | THE ASK |
| a storm that never chains | strikes the nearest bodies, chains once from each |
| a storm that strikes the same body again | … and lands each strike once |
| a storm that lands a flat strike on a boss | lands its share on a boss, once |
| the flicker never renewed | flickers across the screen for as long as the row says |
| the whirlpool never stepped | opens with every blade, turns and grows |
| a blade that lands once and never again | lands on the same body again and again |
| the whirlpool in no collision pairing | the same |
| the whirlpool closed while part of it is on the screen | and is gone once none of it can be on the screen, and not before |

**Two of these guards were first written so they could not fail, and the full proof said STILL
GREEN.**
- *Lands again and again* asked for more than two landings, which twenty-four blades landing once
  each pass. It now asks for more landings than there are blades.
- *Gone once none of it can be on the screen* compared the closing step with the last step a blade
  was seen, and closing always comes after that. It now asks whether a blade was on the screen on
  the step before it closed.

Re-anchored where the lines they hang on moved: 0229, 0233, 0286, 0372 and 0373. The storm's leading
edge is named `leading` and the whirlpool's cue is heard where it opens, so 0257's and 0234's anchors
stay unique to the code they break.
