/**
 * What waits at the end of a level.
 *
 * A `Record` over a closed union, per `docs/decisions/0016-a-hub-enumerates-kinds.md`, and one entry
 * long — `docs/game.md` says **every boss is unique**, which makes this a table that grows one
 * authored row at a time rather than a type that grows parameters.
 *
 * ── THE PHASE MODEL, WHICH IS THE PRODUCT DEFINITION'S ─────────────────────────────────────────
 *
 * `docs/game.md`: *"The Jörmungandr model is the baseline: phases keyed to remaining health, so every
 * arsenal meets every phase, and a heavier loadout shortens the fight without trivialising it."*
 * Keyed to remaining HEALTH and not to elapsed time, and that is the load-bearing half: a player who
 * is doing well arrives at the hard phase sooner, and a player who is struggling is not also being
 * hurried. Nothing about a phase depends on how long the fight has run.
 *
 * ⚠️ **A phase is a change in what the boss DOES, not in what it looks like.** Three silhouettes were
 * the first plan and are rejected in `src/content/sprites.ts` — rate, spread and speed are legible in
 * motion, at full frame rate, and cost no second art pass. The gap that leaves is real and named
 * there: nothing says how much boss is left.
 */

import type { Body } from '../sim/entity.ts';
import type { EnemyKind } from './enemies.ts';
import type { FormationKind } from './formations.ts';
import type { ShotKind } from './shots.ts';
import { SPRITE } from './sprites.ts';

/**
 * The `kind` a bolt in the bolts pool carries when it is the serpent's lightning rather than the
 * arc's link — `docs/decisions/0248-the-serpent-strikes.md`. The painter reads it to stroke the
 * warning line and then the strike in the enemy's ink; the frame reads it to hurt the ship on the
 * step the strike lands. Every other bolt carries zero.
 */
export const RAIN_BOLT_KIND = 1;

/**
 * The `kind` a bolt carries when it is the pterodactyl's laser —
 * `docs/decisions/0250-the-quetzal-screams.md`. A beam down the lane from the hull: a warning line
 * for the attack's `warning` steps, then a straight hostile stroke that hurts for as long as it is
 * held rather than on one step. The bolt's `holdFor` is the strike's own steps and its `radius` is
 * its half-width across the lane.
 */
export const BEAM_BOLT_KIND = 2;

/**
 * Every boss in the game. Closed.
 *
 * ⚠️ **SEVEN MID-BOSSES AND SEVEN END BOSSES, IN THAT ORDER, EACH TOUGHER THAN THE LAST** —
 * `docs/decisions/0247-a-level-has-a-mid-boss-and-a-real-one.md`. The first seven were the run's
 * end bosses until the seventh play-test: *"change the current bosses to have about 50% less
 * health and then be mid-level bosses and add in the actual real bosses."* They are the
 * mid-bosses now, at half their health, and the seven after them are the real ones, one per place.
 * `tests/level.test.ts` reads this list as an ordering of fights and holds that each is tougher
 * than the one before, so a row's place here is a claim.
 */
export const BOSS_KINDS = [
  'sentinel',
  'harrow',
  'lattice',
  'shoalMother',
  'redoubt',
  'chorus',
  'axis',
  'jormungandr',
  'hellkite',
  'quetzal',
  'gyre',
  'hoarfrost',
  'hydra',
  'medusa',
] as const;

/** Derived from the list, so a boss cannot exist in the union and be missing from the table. */
export type BossKind = (typeof BOSS_KINDS)[number];

/**
 * Every way a boss's hull can fly. Closed.
 *
 * ── SEVEN SILHOUETTES ON ONE BEHAVIOUR, AND THE PROJECT SAID SO IN WRITING FIRST ────────────────
 *
 * ⚠️ **`docs/decisions/0111-a-boss-has-one-idea.md`.** Reported from play: *"level 4 (or it might have
 * been 5) was the only boss with a different attack. The rest of them either had thick or thin
 * bullets and that was the only difference."*
 *
 * ⚠️ **IT IS AN ACCURATE READING OF THE TABLE AND `docs/state-of-play.md` PREDICTED IT.**
 * `stepBoss` was one behaviour — track a drifting station, slide across the lane, reverse at the
 * edges — and a phase only scaled the slide. What this table varied was `station`, `drift`, `patrol`,
 * `shot` and the phase numbers, and
 * `docs/decisions/0101-the-sky-is-a-hurry-and-the-boss-holds-back.md` drove all seven stations into a
 * fifteen-unit band. Two axes were left that the player can actually see: the bullet, and the fan.
 *
 * ⚠️ **EVERY ARM IS ON THE `across` AXIS AND NONE TOUCHES `along`, WHICH IS A SCOPE DECISION.** Six
 * assertions in `tests/level.test.ts` are written about where a hull settles and how much screen it
 * leaves at the near end of its swing — 0061 and 0101 — and a movement that changed its distance
 * from the player would either break them or force them to be loosened. *"Up/down motion"* is what
 * was asked for and it is the axis those guards do not hold.
 */
export const BOSS_MOVE_KINDS = ['patrol', 'bob', 'stalk'] as const;

/** Derived from the list, so a movement cannot exist in the union and be missing from the switch. */
export type BossMoveKind = (typeof BOSS_MOVE_KINDS)[number];

export type BossMove =
  /**
   * Slides across the lane at a constant rate and reverses at the edges. What every boss did.
   *
   * ⚠️ **It stays, and on 0073's own terms.** A field where every hull reacts to the player reads as
   * one fight with seven skins; something that flies a fixed path is what makes the ones that do not
   * mean anything. The phase still scales it, which is the escalation this arm already had.
   */
  | { kind: 'patrol' }
  /**
   * Rises and falls across the lane on a sine — **the up-and-down the report asked for by name.**
   *
   * ⚠️ **A function of the CAMERA and not of a step count**, exactly as the along-axis drift already
   * is: a shape in the world can be authored against and a wobble in time cannot, and the fight has
   * to be the same fight on a machine dropping frames. `wavelength` is world units of camera per
   * complete cycle.
   *
   * ⚠️ **The phase scales the RATE by scaling the wavelength**, not the amplitude — a later phase
   * that swung wider would put the hull off the lane, and `across` is a fixed hundred units on every
   * device (0023). Faster over the same span is what escalation means here.
   */
  | { kind: 'bob'; amplitude: number; wavelength: number }
  /**
   * Tracks the ship's lane, slowly.
   *
   * ⚠️ **The one arm that reacts to the player**, and it is the boss half of
   * `docs/decisions/0073-an-enemy-is-a-pilot.md`'s `hunt`. `agility` is world units per step, before
   * the phase's own scale — so a fight against this one is a fight to get out from in front of it,
   * where a patrol is a fight to be somewhere it is not going.
   */
  | { kind: 'stalk'; agility: number };

/**
 * Every way a boss's volley can be shaped. Closed.
 *
 * ⚠️ **THE COUNT AND THE SPREAD STILL COME FROM THE PHASE, WHICH IS WHAT MAKES THIS CHEAP.** A boss
 * already widens its fan as its health falls — *"spray attack that increases number of bullets as
 * health goes down"* is `phases[].shots` and it has been in this table since 0040. **What was missing
 * is that the fan was centred on the SHIP**, and a spread centred on the player reads as one shot
 * with error bars rather than as a wall to move through. This union says where the fan points; the
 * phase still says how wide and how many.
 *
 * ⚠️ **It is deliberately NOT `src/content/enemies.ts`'s `Attack`.** That one carries its own counts,
 * because an enemy's volley is a property of its row; a boss's is a property of its PHASE, and
 * sharing the type would mean either duplicating the counts or reaching for a phase from a row. Two
 * unions with one vocabulary is the honest shape, and `docs/decisions/0110-an-attack-is-a-pattern.md`
 * is where the vocabulary is argued.
 */
export const BOSS_ATTACK_KINDS = ['aimed', 'spray', 'rake', 'ring', 'wall', 'rain', 'whip', 'summon', 'beam'] as const;

/** Derived from the list, so an attack cannot exist in the union and be missing from the switch. */
export type BossAttackKind = (typeof BOSS_ATTACK_KINDS)[number];

export type BossAttack =
  /** The fan, centred on the ship. What all seven did. */
  | { kind: 'aimed' }
  /** The fan, centred on the lane — a pattern the player reads rather than a spread that follows. */
  | { kind: 'spray' }
  /**
   * The fan, centred on the lane, turning by `turn` radians every volley.
   *
   * ⚠️ **The turn is carried on the entity's `firePhase`**, the field 0110 added for the spinner —
   * one description of *where in its turn a body has got to*, used by both.
   */
  | { kind: 'rake'; turn: number }
  /**
   * The phase's shots spread evenly around the whole circle rather than across `spread`.
   *
   * ⚠️ **The one attack whose escalation is legible without the player counting.** More shots is a
   * denser ring, and a ring's gaps are visible from anywhere on the screen — which is what makes a
   * boss that barely moves a damage race rather than a stalemate.
   */
  | { kind: 'ring' }
  /**
   * A row of shots across the lane, all travelling down it, with a hole where the hull is.
   *
   * ⚠️ **`gap` is world units between neighbours and the phase's `shots` is the number EITHER SIDE**,
   * which is the convention `src/content/enemies.ts` states once for the sower. The hole is the hull's
   * own width, so the safe place is directly in front of a thing that is 23 units across — which is a
   * very different proposition from a sower's 6.
   */
  | { kind: 'wall'; gap: number }
  /**
   * Lightning from the top of the screen — `docs/decisions/0248-the-serpent-strikes.md`. Asked
   * for: *"a space lightning bolt attack that rains down from the top of the screen, it'll need
   * warning lines."*
   *
   * ⚠️ **A COLUMN, NOT A BULLET.** Each volley picks `shots` places along the lane inside the box
   * the ship can fly in, draws a warning line down each for `warning` steps, and then strikes: a
   * bolt from the top edge of the lane to the bottom, hurting a ship within `halfWidth` of it on
   * the step it lands. The bolt is the arc's own picture, stroked in the enemy's ink; nothing is
   * spawned into `enemyShots`, because a line across the whole lane is not a body.
   *
   * ⚠️ **THE WARNING IS THE WHOLE OF WHAT MAKES IT FAIR.** *"Is this unfair, or is this a learnable
   * strategy?"* A strike with no warning is the first; a line the player has three quarters of a
   * second to leave is the second. `tests/serpent.test.ts` holds that nothing hurts before the
   * warning has run.
   */
  | { kind: 'rain'; warning: number; halfWidth: number }
  /**
   * A whip of fire — `docs/decisions/0249-the-eagle-summons.md`. Asked for: *"throws out whips of
   * fire."* The phase's `shots` thrown at once along an arc of `sweep` radians centred down the
   * lane, the tip `reach` times faster than the root, so the line of them bows out as it flies: a
   * lash cracking across the lane rather than a fan. The phase's bullet is the flame.
   */
  | { kind: 'whip'; sweep: number; reach: number }
  /**
   * A summons — 0249. Asked for: *"summons hordes of flying kites and raptors as adds at various
   * points throughout the fight."* Each volley puts `count` of `enemy` on the field at the leading
   * edge in `formation`, and throws nothing else: the adds are the attack. The phase's `shots`
   * and `spread` are carried and unused, on `bare`'s own terms — the escalation rules read them.
   */
  | { kind: 'summon'; enemy: EnemyKind; count: number; formation: FormationKind }
  /**
   * Lasers — `docs/decisions/0250-the-quetzal-screams.md`. Asked for: *"a flying pterodactyl with
   * lasers mounted on its wings and it opens its mouth to fire a huge laser blast."*
   *
   * ⚠️ **A BEAM, NOT A BULLET, AND IT IS HELD.** One beam per entry of `from` — an across offset
   * from the hull's centre, in world units, so the wings are two entries and the mouth is one at
   * zero — each a bolt in the arc's pool running from the hull down the lane to the trailing edge
   * of the screen. It warns for `warning` steps as a thin line, then strikes for `hold` steps,
   * hurting a ship within `halfWidth` of it across the lane on ANY step it is held — the serpent's
   * lightning lands once; a laser is a wall for as long as it is on.
   *
   * ⚠️ **THE HULL BRACES, AND THE PAUSE IS ON TOP OF THE BEAM.** A beam is fixed across the lane
   * where it was fired, so a hull that went on patrolling would slide away from its own lasers;
   * it holds still for the warning and the hold, and the phase's `fireEvery` is the flight between
   * one volley's end and the next volley — otherwise a phase whose beam outlasts its cadence is a
   * hull that never moves again. The beam's root stays on the hull along the lane as it drifts.
   *
   * The phase's `shots` and `spread` are carried and unused, on `summon`'s terms.
   */
  | { kind: 'beam'; warning: number; hold: number; halfWidth: number; from: readonly number[] };

/**
 * Every way a boss can STAND in a phase. Closed.
 *
 * ⚠️ **IT HELD THREE ARMS AND NOW HOLDS TWO** — `docs/decisions/0151-the-gap-you-have-to-reach.md`.
 * `overwhelm` was one of them for a day and is now `Uncoil` below, on the ROW: the play-test asked
 * for a curtain that repeats *"at every 10% damage reduction below 50%"*, and a thing that happens at
 * fixed fractions of a health bar is not a thing a phase can say. Every attempt to express it here
 * merged the escalating fans underneath it into one phase, which is the escalation this table exists
 * to carry.
 *
 * ⚠️ **`fireEvery`, `shots` and `spread` stay on the phase rather than moving into the arms.**
 * `volley` fires a fan and uses all three; `bare` fires nothing and carries them anyway, which is
 * what makes it hold to the same escalation rules as everything else — see below.
 */
export const BOSS_STANCE_KINDS = ['volley', 'bare'] as const;

/** Derived from the list, so a stance cannot exist in the union and be missing from the switch. */
export type BossStanceKind = (typeof BOSS_STANCE_KINDS)[number];

export type BossStance =
  /** The phase's fan, at the row's aim. What every phase in the game did. */
  | { kind: 'volley' }
  /**
   * It stops shooting and opens. The eye.
   *
   * ⚠️ **The one phase that is a RELIEF, and it is the last one or it is a bug.** Everything else in
   * the table escalates — `tests/level.test.ts` refuses a phase that fires slower or throws less than
   * the one before it — and a boss that stopped shooting and then started again would be exactly the
   * *"boss that eases off as it dies"* that guard exists to catch. So this arm may appear once, at
   * the end, and the guard is scoped to the run of phases in front of it rather than widened.
   *
   * ⚠️ **`damageScale` multiplies what the player's shots take off it**, so the window is a moment
   * that ENDS the fight rather than a lull the fight continues through.
   *
   * ⚠️ **A bare row still carries the fan and the cadence it WOULD have thrown, and zeroing them was
   * the first draft.**
   * `src/app/boss.ts` returns before the fire gate on this arm, so the stance is what silences the
   * boss — and a row of zeros beside it is a second description of the same fact, which is the shape
   * `docs/decisions/0017-the-state-is-slices.md` refuses everywhere else. It is also the more
   * dangerous of the two to lean on: the zeros are what a hand copying a volley row would get wrong,
   * and `scripts/probes/0150-the-uncoil-and-the-eye.mjs` records that the guard could not tell the
   * difference until they came out.
   *
   * ⚠️ **And it pays a second time: the row stays inside BOTH escalation rules with no exemption.**
   * `tests/level.test.ts` wants a phase that throws no less than the one before it, and
   * `tests/difficulty.test.ts` wants one that fires STRICTLY faster on every tier — a zeroed row
   * would have needed carving out of two guards written for different reasons, which is the shape
   * `docs/decisions/0148-a-place-has-its-own-notes.md` is the standing warning about.
   */
  | { kind: 'bare'; damageScale: number };

/**
 * The uncoil: a curtain right across the lane with one hole in it, thrown again and again as the
 * boss's health falls.
 *
 * ── WHY IT IS ON THE ROW AND NOT ON A PHASE, AND WHY IT HAS A HOLE ──────────────────────────────
 *
 * ⚠️ **`docs/decisions/0151-the-gap-you-have-to-reach.md`.** Reported from play against 0150's
 * version, which had no hole and was thrown once: *"it was good, but needed a way to dodge it and
 * also needed to happen more than once per boss… needs to fire off at every 10% damage reduction
 * below 50%."*
 *
 * ⚠️ **A trigger at fixed fractions of a health bar is not something a PHASE can say.** 0150 hung the
 * curtain on a phase transition, and every way of expressing *every 10% below 50%* in the phase table
 * merges the four escalating fans underneath it into one long phase. So the boss owns this and the
 * phases are untouched by it.
 *
 * ⚠️ **AND THE HOLE IS IN A FIXED PLACE, WHICH IS THE WHOLE OF WHAT MAKES IT A CHALLENGE.** A first
 * draft opened it near the ship, and that is the version the play-test refused: *"a static hole in the
 * wall is a pattern the player needs to learn, a variable hole that spawns close to the ship negates
 * the entire difficulty of the obstacle… there's not really a point in that wall challenge at all."*
 * The player's own line for what is allowed to be hard is **is this unfair, or is this a learnable
 * strategy** — and a wall whose hole is always in the same place is the second one.
 *
 * ⚠️ **WHERE IT MAY SIT IS A MEASUREMENT, AND IT IS THE ONLY THING THE FIRST DRAFT GOT RIGHT.** The
 * curtain is in the air for 39 to 75 steps depending on the boss and the tier, and in the worst of
 * those — the axis at `burn` — the ship covers **59.5 units** from a standing start at the lane edge.
 * So a hole may be anywhere the ship can reach from the far wall in that time and nowhere else, which
 * `tests/level.test.ts` drives from both edges at the real inertia rather than computing.
 */
export interface Uncoil {
  /** Health fraction at or below which the boss starts throwing it. */
  from: number;
  /** Health lost between one curtain and the next, as a fraction of full health. */
  every: number;
  /**
   * Maximum spacing between neighbouring shots, in world units.
   *
   * ⚠️ **A CEILING on the spacing and not the spacing.** The curtain spans the whole lane, so the
   * count is `ceil(ACROSS_SPAN / gap)` and the real spacing is the lane divided by it — which lands a
   * shot on each edge and leaves every hole the same width. Stepping outward by `gap` until the lane
   * runs out leaves a wider one at whichever end the arithmetic stopped on, and a second hole nobody
   * authored is the whole attack undone.
   */
  gap: number;
  /**
   * Where the hole opens, in world units across the lane. **The same place every time.**
   *
   * ⚠️ **IT DOES NOT FOLLOW THE SHIP, AND A DRAFT THAT DID WAS REFUSED FROM PLAY.** *"A variable hole
   * that spawns close to the ship negates the entire difficulty of the obstacle."* This number is the
   * pattern the player learns, and it is the only reason the wall is a challenge rather than a
   * formality — `tests/level.test.ts` drives two curtains from two ship positions and refuses a hole
   * that moved between them.
   *
   * ⚠️ **Bounded by what the ship can cross from the FAR WALL while the curtain is in the air**, which
   * is what keeps it on the learnable side of the player's own line rather than the unfair one. At
   * the hardest tier against the fastest bullet that is 59.5 units, so the band is narrow and the two
   * bosses sit at different ends of it.
   */
  at: number;
  /**
   * How wide the hole is, in world units.
   *
   * ⚠️ **Wide enough to fly through at the STANDARD hurtbox**, which is the one number here that an
   * assist may only ever improve — `docs/decisions/0024-the-accessibility-floor-is-settings.md`.
   */
  hole: number;
}

/**
 * A fall: bodies that rain on the lane from the top of the screen while a boss is on the field —
 * `docs/decisions/0251-the-volcanoes-belch.md`.
 *
 * ⚠️ **A BELCH IS A VOLLEY FROM THE SKY, AND THE ROCK IS A BULLET.** Every `every` steps, `count` of
 * `shot` are put at the top edge of the lane, each somewhere along the box the ship can fly in,
 * falling straight down it at the shot's own speed and riding the camera. They go into
 * `enemyShots` and hurt as any shot hurts, so the rock is a row in `src/content/shots.ts` held to
 * every rule a hostile bullet is held to — the biggest and the slowest of them, on 0098's trade.
 * The volcano that belched it is the level's own landmark, behind; the picture of the belch is
 * embers at the edge the rock came in over (0036).
 */
export interface Fall {
  /** What falls. A hostile shot, sent by this and nothing else. */
  shot: ShotKind;
  /** Steps between belches, before the tier's own gap scales it. */
  every: number;
  /** How many fall in one belch. */
  count: number;
}

export interface BossPhase {
  /**
   * Active while remaining health is at or below this fraction of the row's full `health`.
   *
   * Phases are ordered from full to empty and the ACTIVE one is the last whose `upTo` still covers
   * the current fraction — so the first row's `upTo` must be `1`, or a boss at full health is in no
   * phase at all. `tests/level.test.ts` holds that.
   */
  upTo: number;
  /** Steps between volleys. Read by every stance except `bare`, which does not fire at all. */
  fireEvery: number;
  /** Shots per volley, spread evenly about the aim. */
  shots: number;
  /** Total angular spread of a volley, in radians. Ignored when `shots` is 1. */
  spread: number;
  /** Multiplier on the row's `patrol`, so a phase can change how fast it slides across the lane. */
  patrolScale: number;
  /**
   * What the boss does in this phase beyond throwing its fan.
   *
   * ⚠️ **Required rather than defaulted to `volley`**, on `src/content/enemies.ts`'s own terms for
   * `attack` and this file's for `move`: a phase without one is a decision somebody did not make,
   * and `docs/decisions/0016-a-hub-enumerates-kinds.md` says the table is the guard.
   */
  stance: BossStance;
  /**
   * The shot this phase throws instead of the row's, or `null` for the row's — 0248.
   *
   * ⚠️ **A PHASE CHANGES WHAT A BOSS DOES, AND SINCE 0248 THAT INCLUDES WHAT IT THROWS.** The serpent
   * throws acid, then void, then lightning; the hydra grows a head with its own shot at every
   * fifth. `null` rather than optional, on the same terms as `uncoil`: a phase that keeps the row's
   * shot is a decision somebody made.
   */
  shot: ShotKind | null;
  /** The attack this phase fires instead of the row's, or `null` for the row's — 0248. */
  attack: BossAttack | null;
}

export interface BossRow extends Body {
  /**
   * Where it settles, in world units ahead of the camera's trailing edge.
   *
   * ⚠️ **It holds station in the CAMERA's frame**, like everything else the player watches move —
   * `docs/decisions/0034-a-threat-is-absolute-and-a-pool-is-the-pairing.md`. A boss parked in world
   * coordinates would slide off the back of the screen at the scroll rate, which is precisely the
   * bug that made every off-lane enemy shot miss.
   *
   * ── EVERY ONE OF THESE MOVED FORWARD, AND THE NUMBER THEY WERE SIZED AGAINST IS WHY ─────────────
   *
   * ⚠️ **`docs/decisions/0101-the-sky-is-a-hurry-and-the-boss-holds-back.md`.** Reported from play:
   * *"the bosses come too far into the screen, they come into 50% and then basically float at that
   * level and it doesn't give the player enough space to respond."*
   *
   * ⚠️ **Every station here was chosen against a narrowest view of 150 units, and
   * `docs/decisions/0080-the-box-is-the-screen-and-the-screen-is-16-9.md` made it 177.8.** Not one of
   * them moved. So a number that used to mean *as far forward as the hull can go* came to mean *the
   * middle of the screen* — and `tests/level.test.ts` said so in as many words, *"every boss has 28
   * more units of room it did not have"*, for two months without anybody spending it.
   *
   * ⚠️ **What the player is judging is the NEAR end of the swing, not the station.** A boss's closest
   * approach is `station − drift − radius`, and five of the seven were inside half the screen — the
   * axis reached **37%**. The report's *"50%"* is the measurement, and the guard that now exists is a
   * floor on that quantity rather than on this one.
   *
   * ⚠️ **The seven have converged to a narrow band and that is the screen rather than a preference.**
   * With a floor at 55% and the leading edge still on the narrowest screen, the room a station may
   * live in is about fifteen units wide. What makes a boss unique is its drift, its wavelength, its
   * patrol, its hull, its phases and — since 0098 — its bullet. It was never this number.
   */
  station: number;
  /**
   * How far either side of its station it drifts along the lane, in world units.
   *
   * ── WHY A BOSS NEEDED ONE ───────────────────────────────────────────────────────────────────────
   *
   * Reported from play: *"when a boss reaches mid screen, it just goes up/down and there's no longer
   * any flowing movement."* The scroll never stops — the camera advances every step of the fight —
   * but everything the player can SEE stops moving along it, because the boss holds one distance and
   * nothing else is left on the field. The picture the player gets is a still one with a sprite
   * sliding up and down it. `docs/decisions/0061-a-boss-keeps-flying.md`.
   *
   * ⚠️ **A shape in the world, as a function of the camera** — the same argument
   * `src/content/enemies.ts` makes for the weave and `src/app/frame.ts` makes for the shield shell: a
   * wobble in time cannot be authored against, and a fight that plays differently on a machine
   * dropping frames is not a fight anybody can be asked to learn.
   *
   * ⚠️ **A PHASE DOES NOT SCALE IT, unlike `patrol`.** The forward bound is the NARROWEST view any
   * device gets, and a later phase that swung further would put a quarter of the hull off the screen —
   * on a phone, in the phase the player is least able to afford it. `tests/level.test.ts` holds the
   * bound rather than the value.
   */
  drift: number;
  /** World units of camera per complete drift cycle. Ignored when `drift` is `0`. */
  driftWavelength: number;
  /** World units per step it slides across the lane, before a phase scales it. */
  patrol: number;
  /**
   * What it fires.
   *
   * ⚠️ **SEVEN BOSSES USED TO NAME ONE ROW, WHICH IS HALF OF A PLAY REPORT** —
   * `docs/decisions/0098-a-wave-plays-a-figure.md`: *"all the enemy bullets are exactly the same."*
   * They are now spread over the three, and the pairing is a rule rather than a rotation: **the
   * faster a boss's cadence, the slower its bullet.** `redoubt` fires every thirty steps at its last
   * phase, so it throws the fat slow one and the fight is a pattern to move through; `shoalMother`
   * *"fires little and hits hard"*, so it throws the dart. `docs/game.md` says every boss is unique
   * and this is the cheapest axis of it that had never been used.
   */
  shot: ShotKind;
  /**
   * How the hull flies across the lane. One arm of `BossMove`, carrying its own parameters.
   *
   * ⚠️ **Required rather than defaulted to `patrol`**, so an eighth boss is a decision about what the
   * fight IS rather than a field somebody left out — `docs/decisions/0016-a-hub-enumerates-kinds.md`,
   * and the same rule `src/content/enemies.ts` states for `attack`.
   */
  move: BossMove;
  /** How its volley is shaped. The phase still says how many shots and how wide. */
  attack: BossAttack;
  /**
   * The curtain it throws as its health falls, or `null` if it does not.
   *
   * ⚠️ **Required rather than optional**, on the same terms as `move` and `attack`: a boss without
   * one is a decision somebody made, and `undefined` is a decision somebody forgot —
   * `docs/decisions/0016-a-hub-enumerates-kinds.md`.
   */
  uncoil: Uncoil | null;
  /**
   * What falls on the lane from the top of the screen through the whole fight, or `null`.
   *
   * ⚠️ **On the ROW and not on a phase, on `uncoil`'s own terms** — 0251. *"Volcanoes in the
   * background that belch big chunks of volcanic rock that rain down and the player has to dodge
   * as well as all the other boss stuff"* — *as well as* is the whole shape: it runs beside every
   * phase, through the brace and through the beams, and a phase table cannot say that. Required
   * rather than optional, as `uncoil` is.
   */
  fall: Fall | null;
  /** Full health to empty. The first entry must cover a full-health boss. */
  phases: readonly BossPhase[];
}

export const BOSSES: Record<BossKind, BossRow> = {
  /**
   * The first thing in the game that is bigger than the lane's patience.
   *
   * ⚠️ **The name claims no biome, and that is deliberate.** `docs/game.md` themes levels on the
   * fourteen *Far Carry* biomes and names none of them here; picking one would mean going to the
   * predecessor for material, which `CLAUDE.md` allows only for a named file and a named reason —
   * *"never browse it for inspiration."* Theming this to a biome is owed with the level roster, and
   * a rename is a one-line table edit.
   *
   * ⚠️ **150 health is a PLAY-TEST NUMBER**, on the same terms as `SHIP_SPEED` and `STARTING_LIVES`.
   * At the base weapon's rate it is roughly half a minute of well-aimed fire, which is a guess about
   * a fight nobody has had yet. Nothing asserts on it.
   */
  /*
    ⚠️ **THE TEACHER, AND IT IS DELIBERATELY THE ONE THAT DID NOT CHANGE** — 0111. A player meets
    their first boss knowing nothing; what a fan centred on the ship teaches is *this thing is looking
    at me*, and every pattern below is read against that. A game whose FIRST boss fired somewhere else
    would have nothing to make the sixth one strange.
  */
  sentinel: {
    move: { kind: 'patrol' },
    attack: { kind: 'aimed' },
    uncoil: null,
    fall: null,
    sprite: SPRITE.boss,
    spriteHit: SPRITE.bossHit,
    radius: 11,
    // Half of 480 — a mid-boss since 0247.
    health: 240,
    damage: 3,
    // Far enough forward that the whole hull is on screen on the narrowest view the clamp allows,
    // and far enough back that the player is not fighting it at the very edge of their reach.
    station: 138,
    /*
      ⚠️ **14, which is the most the narrowest view leaves room for.** `120 + 14 + 11` is 145 against
      a 150-unit view — the whole hull stays on screen on a 3:2 laptop at the forward end of every
      swing. It is also 28 units of travel, which against a 22-unit hull is a body visibly moving
      rather than breathing.
    */
    drift: 14,
    // About six seconds a cycle at the scroll rate. Slower than the patrol, so the two do not beat
    // against each other into a figure the player reads as one rhythm.
    driftWavelength: 220,
    patrol: 0.32,
    shot: 'spit',
    phases: [
      /*
        ⚠️ **The opening phase is deliberately readable.** A single aimed shot every 1.5 seconds is
        slower than a turret, and it is the phase in which the player learns where the boss's hull
        ends — which is the one thing a 26-unit sprite makes genuinely hard to judge.
      */
      { upTo: 1, fireEvery: 90, shots: 1, spread: 0, patrolScale: 1, stance: { kind: 'volley' }, shot: null, attack: null },
      /*
        Half health: a three-way spread, so a player who has settled into one lane is moved out of
        it. The spread is wide enough that standing still is punished and narrow enough that there is
        always a side to leave towards.

        ⚠️ **TWO PHASES, NOT THREE — 0247.** At half its health the fight is seven seconds at max
        weapons, and `tests/level.test.ts` refuses a phase under three; the old last third is folded
        into this one, which is what a mid-boss is: the same idea, said once.
      */
      { upTo: 0.5, fireEvery: 54, shots: 5, spread: 0.9, patrolScale: 2, stance: { kind: 'volley' }, shot: null, attack: null },
    ],
  },
  /**
   * Level two's boss, and it is a different fight rather than the same one with bigger numbers.
   *
   * ⚠️ **`docs/game.md`: every boss is unique — its own attacks, its own effects, its own
   * escalation.** What makes this one different is not that it has more health: it **stands closer**,
   * **moves faster than the player can comfortably track**, and opens with a spread rather than
   * earning one. The sentinel teaches a player to find a lane and hold it; this one exists to take
   * that lane away.
   *
   * ⚠️ 220 health and four phases are PLAY-TEST NUMBERS, on the same terms as everything else here.
   * Nothing asserts on them.
   */
  /*
    ⚠️ **ITS ROW ALREADY SAID *TAKE THE LANE AWAY* AND NOW ITS FLYING DOES** — 0111. It tracks the
    ship's lane instead of sweeping a fixed path, and then sprays down the lane rather than at the
    ship: it comes to where you are and fills where you were going. The two halves say one thing,
    which is what the phrase *one idea* means here.
  */
  harrow: {
    move: { kind: 'stalk', agility: 0.24 },
    attack: { kind: 'spray' },
    uncoil: null,
    fall: null,
    sprite: SPRITE.boss2,
    spriteHit: SPRITE.boss2Hit,
    radius: 12.5,
    // Half of 580 — a mid-boss since 0247.
    health: 290,
    damage: 3,
    // Closer than the sentinel's 120, which is most of what makes it feel like a different fight:
    // the player has less room in front of them and less warning on everything it throws.
    station: 136,
    /*
      Wider than the sentinel's and it still clears the narrowest view by a comfortable margin —
      `100 + 20 + 12.5` is 132.5 against 150 — because standing closer buys the room the sentinel
      spent on being further out. A bigger swing at a shorter wavelength is the same *takes the lane
      away* this row is built around: it closes on the player and backs off inside four seconds.
    */
    drift: 20,
    driftWavelength: 150,
    patrol: 0.42,
    shot: 'lance',
    phases: [
      // No gentle opening. It starts where the sentinel's second phase ended.
      { upTo: 1, fireEvery: 72, shots: 3, spread: 0.45, patrolScale: 1, stance: { kind: 'volley' }, shot: null, attack: null },
      /*
        The last half: seven shots across most of a right angle, and a hull crossing the lane at
        two and a half times its opening speed. Every arsenal meets every phase, so this has to be
        survivable with the base weapon alone — which is exactly what `tests/level.test.ts` drives.

        ⚠️ **TWO PHASES, NOT FOUR — 0247.** Nine seconds at max weapons at half its health leaves
        room for two phases of three; the two middle rungs are folded into these.
      */
      { upTo: 0.5, fireEvery: 48, shots: 7, spread: 1.4, patrolScale: 2.5, stance: { kind: 'volley' }, shot: null, attack: null },
    ],
  },

  /**
   * Level three's boss, and its fight is the level's own idea turned on the player.
   *
   * ⚠️ **It stands FURTHER OUT than either of the two before it and swings widest.** Level three is
   * about the sides of the lane, so its boss is the one that occupies them: a slow hull at long range
   * crossing almost the whole of its allowance, which makes the safe lane a thing that moves.
   *
   * ⚠️ Every number here is a play-test number, on the same terms as the sentinel's 150. Nothing
   * asserts on one.
   */
  /*
    ⚠️ **THE LEVEL IS ABOUT THE SIDES OF THE LANE AND SO IS THE WALL** — 0111. A slow hull at long
    range laying a row of shots with a hole in it makes the safe lane a place rather than a direction,
    and the hole travels because the hull does. It is the sower's attack at four times the scale, and
    the difference is that a sower is 6 units wide and this is 23.
  */
  lattice: {
    move: { kind: 'patrol' },
    attack: { kind: 'wall', gap: 15 },
    uncoil: null,
    fall: null,
    sprite: SPRITE.boss3,
    spriteHit: SPRITE.boss3Hit,
    radius: 11.5,
    // Half of 680 — the labyrinth's mid-boss since 0247, moved from the saurian belt's end.
    health: 340,
    damage: 3,
    /*
      ⚠️ **The furthest station any hull can have, and the guard is what said where that is.** The
      first draft put it at 130 with a 16-unit drift, which is 130 + 16 + 11.5 = 157.5 against a
      150-unit view — seven and a half units of boss off the narrowest screen at the far end of
      every swing. It was written up as deliberate and measured as wrong, which is exactly why a
      station is not a number anybody gets to pick by feel.
      `docs/decisions/0061-a-boss-keeps-flying.md` holds that assertion.
    */
    station: 140,
    drift: 15,
    driftWavelength: 260,
    patrol: 0.5,
    shot: 'flak',
    phases: [
      // Wide and slow from the start: the shots are the lane-taking, not the hull.
      { upTo: 1, fireEvery: 84, shots: 3, spread: 0.9, patrolScale: 1, stance: { kind: 'volley' }, shot: null, attack: null },
      { upTo: 0.66, fireEvery: 66, shots: 5, spread: 1.2, patrolScale: 1.3, stance: { kind: 'volley' }, shot: null, attack: null },
      { upTo: 0.33, fireEvery: 54, shots: 7, spread: 1.5, patrolScale: 1.7, stance: { kind: 'volley' }, shot: null, attack: null },
    ],
  },
  /**
   * Level four's boss. The level is about speed, so this is the one that moves.
   *
   * ⚠️ **The fastest patrol in the game and the shortest drift wavelength**, which together make a
   * hull that crosses the lane and comes back inside three seconds. It fires little and hits hard:
   * what threatens the player is where it IS, not what leaves it.
   */
  /*
    ⚠️ **THE ONE THE REPORT REMEMBERED, AND IT KEEPS ITS AIM** — 0111: *"level 4 (or it might have
    been 5) was the only boss with a different attack."* What made it different was that it fires
    little and hits hard, and that is untouched. What it gains is the up-and-down the same report asked
    for by name: a hull rising and falling across the lane while it throws darts at where you are.
  */
  shoalMother: {
    move: { kind: 'bob', amplitude: 26, wavelength: 150 },
    attack: { kind: 'aimed' },
    uncoil: null,
    fall: null,
    sprite: SPRITE.boss4,
    spriteHit: SPRITE.boss4Hit,
    radius: 13,
    // Half of 780 — the saurian belt's mid-boss since 0247, moved from the labyrinth's end.
    health: 390,
    damage: 3,
    station: 136,
    drift: 18,
    driftWavelength: 120,
    patrol: 0.62,
    shot: 'lance',
    phases: [
      // Three phases, not four — 0247: twelve seconds at max weapons at half its health.
      { upTo: 1, fireEvery: 96, shots: 1, spread: 0, patrolScale: 1, stance: { kind: 'volley' }, shot: null, attack: null },
      { upTo: 0.66, fireEvery: 78, shots: 3, spread: 0.5, patrolScale: 1.6, stance: { kind: 'volley' }, shot: null, attack: null },
      { upTo: 0.33, fireEvery: 60, shots: 5, spread: 0.9, patrolScale: 2.8, stance: { kind: 'volley' }, shot: null, attack: null },
    ],
  },
  /**
   * Level five's boss. The level is about things that will not go away, and neither will this.
   *
   * ⚠️ **The slowest hull in the game and the heaviest.** It barely patrols; what it does is fire,
   * constantly and widely, from a station close enough that the shots arrive with little warning. The
   * fight is a damage race rather than a dance, which is the opposite reading from level four's.
   */
  /*
    ⚠️ **IT BARELY MOVES, SO WHAT IT SENDS HAS TO BE THE FIGHT** — 0111. A ring is the one attack
    whose escalation is visible from anywhere on the screen: more shots is a denser circle, and the
    gaps close as its health falls without the player ever counting anything. That is a damage race
    with a clock on it rather than a stalemate.
  */
  redoubt: {
    move: { kind: 'patrol' },
    attack: { kind: 'ring' },
    uncoil: null,
    fall: null,
    sprite: SPRITE.boss5,
    spriteHit: SPRITE.boss5Hit,
    radius: 14,
    // Half of 880 — a mid-boss since 0247.
    health: 440,
    damage: 3,
    station: 142,
    drift: 8,
    driftWavelength: 300,
    patrol: 0.16,
    shot: 'flak',
    phases: [
      // Three phases, not four — 0247: fourteen seconds at max weapons at half its health.
      { upTo: 1, fireEvery: 54, shots: 3, spread: 0.7, patrolScale: 1, stance: { kind: 'volley' }, shot: null, attack: null },
      { upTo: 0.7, fireEvery: 42, shots: 5, spread: 1, patrolScale: 1.2, stance: { kind: 'volley' }, shot: null, attack: null },
      { upTo: 0.4, fireEvery: 30, shots: 7, spread: 1.6, patrolScale: 1.6, stance: { kind: 'volley' }, shot: null, attack: null },
    ],
  },
  /**
   * Level six's boss. The level is about there being no gaps, and this is the fight with none.
   *
   * ⚠️ **Five phases, and every one of them changes both halves at once.** The other bosses escalate
   * along one axis at a time; this one moves faster AND fires wider at every step, so there is no
   * stretch of it that rewards the same answer twice.
   */
  /*
    ⚠️ **THE LEVEL WITH NO GAPS, AND A RAKE IS WHAT THAT MEANS IN ONE WORD** — 0111. The fan turns
    every volley, so there is no stretch of the lane that stays safe and no answer that works twice;
    the hull bobs underneath it, so the sweep does not even start from the same place. It is the fight
    this row was already described as being and never was.
  */
  chorus: {
    move: { kind: 'bob', amplitude: 22, wavelength: 110 },
    attack: { kind: 'rake', turn: 0.55 },
    /*
      ⚠️ **THIS LEVEL'S OWN IDEA WITH ONE HOLE PUNCHED IN IT** — 0151. Level six is about there being
      no gaps and the rake is what that means in one word; a curtain across the whole lane is the same
      sentence, and the single hole is the answer the play-test asked for — *"it was good, but needed
      a way to dodge it."*

      ⚠️ **ITS HOLE IS HARD OVER TO ONE SIDE, AND ITS SLOW BULLET IS WHAT PAYS FOR THAT.** The `spit`
      is in the air 58 to 75 steps, in which the ship crosses the whole playable lane — so this is the
      one of the two that can put its hole a long committed journey away and still be reachable from
      the far wall. Level six is about there being no gaps; the one gap it leaves is nowhere near the
      middle.
    */
    // ⚠️ From 0.7 rather than 0.5 since 0247: at half the health the eye opens at 0.36, and a
    // curtain is not thrown to a bared boss, so the four notches the fight throws sit above it.
    uncoil: { from: 0.7, every: 0.1, gap: 4.5, at: 26, hole: 14 },
    fall: null,
    sprite: SPRITE.boss6,
    spriteHit: SPRITE.boss6Hit,
    radius: 12.5,
    // Half of 980 — a mid-boss since 0247.
    health: 490,
    damage: 3,
    station: 138,
    drift: 15,
    driftWavelength: 180,
    patrol: 0.45,
    shot: 'spit',
    phases: [
      // Three fans and the eye, not five and the eye — 0247: fifteen seconds at max weapons at half
      // its health, and a phase under three of them is not a phase.
      { upTo: 1, fireEvery: 72, shots: 3, spread: 0.5, patrolScale: 1, stance: { kind: 'volley' }, shot: null, attack: null },
      { upTo: 0.78, fireEvery: 54, shots: 5, spread: 1.1, patrolScale: 1.6, stance: { kind: 'volley' }, shot: null, attack: null },
      { upTo: 0.57, fireEvery: 36, shots: 7, spread: 1.6, patrolScale: 2.4, stance: { kind: 'volley' }, shot: null, attack: null },
      /*
        ⚠️ **THE EYE.** It has thrown everything it had and it stops: no fan, no rake, a hull still
        crossing the lane at a rung under its opening speed, and three times the damage from every
        pulse that lands. About 1.8 seconds at max weapons, which is a beat longer than the death it
        runs into — `tests/level.test.ts` holds that floor against `BOSS_DEATH_STEPS`. At half the
        health that is a third of the bar rather than a fifth (0247).

        ⚠️ **The fan it is still carrying is written out and never thrown**, which is the stance
        saying so rather than the row — see `BossStance`.
      */
      { upTo: 0.36, fireEvery: 30, shots: 7, spread: 1.6, patrolScale: 1.4, stance: { kind: 'bare', damageScale: 3 }, shot: null, attack: null },
    ],
  },
  /**
   * The last boss of the authored run.
   *
   * ⚠️ **It is not the hardest of these by every measure, and that is deliberate.** `redoubt` fires
   * faster and `shoalMother` moves faster; what this one does is refuse to be either — it is the
   * biggest hull, at the closest station, with the longest health bar, and its escalation is the
   * whole of what the run has taught, in order. `docs/game.md` puts a final boss at the end of eight
   * levels; there are seven, so this is the end of what is authored rather than the end of the game.
   */
  /*
    ⚠️ **IT FOLLOWS YOU AND FILLS THE SCREEN, WHICH IS THE TWO HARDEST THINGS THE RUN TAUGHT AT ONCE**
    — 0111. The harrow tracks the player and the redoubt encircles them; the last boss does both, from
    the closest station in the game, over five phases. Its ring gets denser every phase, so the gaps a
    player was surviving in close while the hull they are trying to leave is following them.

    ⚠️ **A first draft gave it the harrow's own pair and `tests/level.test.ts` refused it** — *no two
    bosses fly the same way AND shoot the same way* — which is the guard doing the whole of what it
    exists for on the row most likely to be written by analogy.
  */
  axis: {
    move: { kind: 'stalk', agility: 0.2 },
    attack: { kind: 'ring' },
    /*
      ⚠️ **THE TIGHTEST CURTAIN, AND ITS HOLE IS NEAR THE MIDDLE BECAUSE IT HAS TO BE.** A `lance`
      crosses the gap in 39 steps at the hardest tier where the chorus's `spit` takes 58, and 39 steps
      buys the ship **59.5 units** from a standing start — so the last boss in the game is the one
      whose hole has the least room to be anywhere. 58 leaves the far wall 52 units away against that
      59.5, which is the margin, and `tests/level.test.ts` drives it from both edges.

      ⚠️ **It is still the harder of the two and the numbers say why**: the player has 19 fewer steps
      to read the curtain and cross to it, through a denser wall, from a hull that is chasing them.
    */
    uncoil: { from: 0.5, every: 0.1, gap: 4, at: 58, hole: 12 },
    fall: null,
    sprite: SPRITE.boss7,
    spriteHit: SPRITE.boss7Hit,
    radius: 16,
    // Half of 1140 — the black heart's mid-boss since 0247.
    health: 570,
    damage: 3,
    // The closest station in the game. `95 + 14 + 16` is 125 against 150 — the hull fills a fifth of
    // the narrowest view, which is what a last boss should cost the player in room.
    station: 134,
    drift: 14,
    driftWavelength: 200,
    patrol: 0.4,
    shot: 'lance',
    phases: [
      // Three rings and the eye, not five and the eye — 0247: seventeen seconds at max weapons at
      // half its health.
      { upTo: 1, fireEvery: 66, shots: 3, spread: 0.6, patrolScale: 1, stance: { kind: 'volley' }, shot: null, attack: null },
      { upTo: 0.8, fireEvery: 48, shots: 5, spread: 1.2, patrolScale: 1.8, stance: { kind: 'volley' }, shot: null, attack: null },
      { upTo: 0.6, fireEvery: 36, shots: 7, spread: 1.8, patrolScale: 2.8, stance: { kind: 'volley' }, shot: null, attack: null },
      /*
        ⚠️ **THE EYE, AND IT WAS THE LAST THING THE AUTHORED RUN ASKED FOR.** The ring stops, the
        stalk slows to half what it was chasing at, and the fight ends on a window the player has to
        be in front of rather than on a health bar reaching zero — which is the word *interactive*
        in `reports/the-boss-vocabulary-is-one-fan-2026-08-14.md` answered at its own end. Since
        0247 the run's last eye is the jellyfish's; this is the black heart's mid-boss, and its eye
        opens at a third of the bar so it still outlasts the death it runs into.
      */
      { upTo: 0.32, fireEvery: 30, shots: 7, spread: 1.8, patrolScale: 1.4, stance: { kind: 'bare', damageScale: 3 }, shot: null, attack: null },
    ],
  },

  /*
    ── THE REAL BOSSES — 0247 ──────────────────────────────────────────────────────────────────────

    ⚠️ **SEVEN END BOSSES, ONE PER PLACE, AND EVERY ONE OF THEM A FIRST ITERATION.** Asked for in the
    seventh play-test, each by name with its own attacks — a serpent with acid, void and lightning
    from the sky; a demon eagle with whips of fire and summoned hordes; a pterodactyl with lasers on
    its wings; a spinning wall; a frost ship that slows the player; a hydra that grows a head at
    every fifth of its health; a jellyfish with a black heart in it. *"These'll be first iteration of
    the bosses, let's see how good we can get them, but I expect we'll need to refine and improve
    them."* This table gives each its hull, its station, its flight, its fan and its phases on the
    vocabulary the game has; the attacks the game has no word for yet — a beam, a rain with warning
    lines, a whip, a summons, a slow, a head — are each their own decision, on their own boss, and
    `docs/decisions/0247-a-level-has-a-mid-boss-and-a-real-one.md` lists them.

    ⚠️ **Every station + drift + radius is 149 or under**, which is the whole hull on the narrowest
    view at the far end of every swing (0061); every near end is past 55% of the screen (0101). The
    biggest hulls in the game buy that with the smallest drifts.

    ⚠️ **No pair of flight and fan repeats across all fourteen**, which `tests/level.test.ts` holds:
    eight pairs were free after the first seven and these take seven of them.
  */
  /**
   * The Approach's end: the serpent.
   *
   * ⚠️ **The one the game is named for** — `docs/game.md`: *"the Jörmungandr fight from The Far
   * Carry … made into a shooter."* It rises and falls across the whole lane and lays a wall, which
   * is the shape a body that size crossing in front of you is. Owed: acid blasts, void blasts, and
   * the lightning that rains from the top of the screen with warning lines.
   */
  /*
    ⚠️ **THREE PHASES, THREE WEAPONS — 0248.** *"Acid blast attacks, void blast attacks and then a
    space lightning bolt attack that rains down from the top of the screen."* A wall of acid across
    the lane while it is whole; a spray of void down the lane once it is hurt; and, at the last
    third, lightning: three columns a volley inside the box the ship flies in, each with a
    three-quarter-second warning line, each hurting a ship within four units on the step it lands.
    The row's `shot` and `attack` are the first phase's; the phases say what changes.
  */
  jormungandr: {
    move: { kind: 'bob', amplitude: 24, wavelength: 200 },
    attack: { kind: 'wall', gap: 12 },
    uncoil: null,
    fall: null,
    sprite: SPRITE.boss8,
    spriteHit: SPRITE.boss8Hit,
    radius: 16,
    health: 700,
    damage: 3,
    station: 128,
    drift: 5,
    driftWavelength: 240,
    patrol: 0.3,
    shot: 'acid',
    phases: [
      { upTo: 1, fireEvery: 84, shots: 2, spread: 0, patrolScale: 1, stance: { kind: 'volley' }, shot: null, attack: null },
      { upTo: 0.66, fireEvery: 66, shots: 3, spread: 0.8, patrolScale: 1.3, stance: { kind: 'volley' }, shot: 'void', attack: { kind: 'spray' } },
      { upTo: 0.33, fireEvery: 54, shots: 3, spread: 0, patrolScale: 1.6, stance: { kind: 'volley' }, shot: 'void', attack: { kind: 'rain', warning: 45, halfWidth: 4 } },
    ],
  },
  /**
   * The Ember Nebula's end: the hell-spawned eagle — 0249.
   *
   * ⚠️ **FIVE PHASES, AND THE FIGHT ALTERNATES BETWEEN WHAT IT THROWS AND WHAT IT SENDS.** It opens
   * throwing darts at where the player is; at three quarters it whips — five flames along an arc,
   * the tip quicker than the root; at half it calls kites, two a volley, in a vee at the leading
   * edge; at a third it whips again, seven wide; and at the last sixth it calls raptors, one a
   * volley, which hunt. *"Hordes of flying kites and raptors as adds at various points throughout
   * the fight"* — the points are the phases.
   */
  hellkite: {
    move: { kind: 'stalk', agility: 0.22 },
    attack: { kind: 'aimed' },
    uncoil: null,
    fall: null,
    sprite: SPRITE.boss9,
    spriteHit: SPRITE.boss9Hit,
    radius: 15,
    health: 760,
    damage: 3,
    station: 129,
    drift: 5,
    driftWavelength: 180,
    patrol: 0.4,
    shot: 'lance',
    phases: [
      { upTo: 1, fireEvery: 78, shots: 1, spread: 0, patrolScale: 1, stance: { kind: 'volley' }, shot: null, attack: null },
      { upTo: 0.75, fireEvery: 66, shots: 5, spread: 0, patrolScale: 1.3, stance: { kind: 'volley' }, shot: 'flame', attack: { kind: 'whip', sweep: 1.1, reach: 0.9 } },
      { upTo: 0.5, fireEvery: 60, shots: 5, spread: 0, patrolScale: 1.5, stance: { kind: 'volley' }, shot: null, attack: { kind: 'summon', enemy: 'kite', count: 2, formation: 'vee' } },
      { upTo: 0.33, fireEvery: 54, shots: 7, spread: 0, patrolScale: 1.8, stance: { kind: 'volley' }, shot: 'flame', attack: { kind: 'whip', sweep: 1.4, reach: 0.9 } },
      { upTo: 0.16, fireEvery: 48, shots: 7, spread: 0, patrolScale: 2.2, stance: { kind: 'volley' }, shot: null, attack: { kind: 'summon', enemy: 'raptor', count: 1, formation: 'line' } },
    ],
  },
  /**
   * The Saurian Belt's end: the pterodactyl — 0250.
   *
   * ⚠️ **FOUR PHASES, AND FROM THE SECOND IT STOPS TO FIRE.** It opens flying fast and spraying
   * lances; at two thirds it braces and fires from both wingtips — two thin beams down the lane,
   * eighteen units either side of the hull, which is where the wings are drawn; at a third it opens
   * its mouth — one beam, four times as wide, straight down the lane from the hull; and at the
   * last sixth all three at once. *"Lasers mounted on its wings and it opens its mouth to fire a
   * huge laser blast."* Between beams it flies, and each phase's flight is shorter than the last.
   * Owed, in `docs/decisions/0250-the-quetzal-screams.md`: the volcanoes in its backdrop belching
   * rock that rains on the lane.
   */
  quetzal: {
    move: { kind: 'patrol' },
    attack: { kind: 'spray' },
    uncoil: null,
    // The volcanoes — 0251: two rocks every second and a half, from the top of the screen, through
    // the whole fight.
    fall: { shot: 'rock', every: 90, count: 2 },
    sprite: SPRITE.boss10,
    spriteHit: SPRITE.boss10Hit,
    radius: 15,
    health: 820,
    damage: 3,
    station: 128,
    drift: 6,
    driftWavelength: 160,
    patrol: 0.55,
    shot: 'lance',
    phases: [
      { upTo: 1, fireEvery: 72, shots: 3, spread: 0.5, patrolScale: 1, stance: { kind: 'volley' }, shot: null, attack: null },
      // The wings: 0.3 s of warning, 0.4 s of beam, three units wide each.
      { upTo: 0.66, fireEvery: 60, shots: 3, spread: 0.5, patrolScale: 1.5, stance: { kind: 'volley' }, shot: null, attack: { kind: 'beam', warning: 18, hold: 24, halfWidth: 1.5, from: [-18, 18] } },
      // The mouth: half a second of warning, half a second of beam, twelve units wide.
      { upTo: 0.33, fireEvery: 54, shots: 5, spread: 0.9, patrolScale: 2, stance: { kind: 'volley' }, shot: null, attack: { kind: 'beam', warning: 30, hold: 30, halfWidth: 6, from: [0] } },
      // Everything: the mouth and both wings, on the mouth's timing, each five units wide — three of
      // them narrower than the mouth alone, because three of them are what cover the lane.
      { upTo: 0.16, fireEvery: 48, shots: 7, spread: 1.3, patrolScale: 2.4, stance: { kind: 'volley' }, shot: null, attack: { kind: 'beam', warning: 30, hold: 30, halfWidth: 2.5, from: [-18, 0, 18] } },
    ],
  },
  /**
   * The Labyrinth's end: the gyre — the lattice, upgraded.
   *
   * ⚠️ **The ask, word for word:** *"an upgraded version of the current end boss of saurian belt —
   * the upgrades are that it will spin and that the bullet walls will have the bullets closer
   * together — the spaceship gaps will be the same size, but the bullet gaps will be close so you
   * can't fit through them."* The curtain is the second half of that today: the tightest uncoil in
   * the game, its hole the ship's width. The spin — walls thrown at every angle so the gap is
   * diagonal, vertical and horizontal in turn — is owed, and the rake is its stand-in.
   */
  gyre: {
    move: { kind: 'patrol' },
    attack: { kind: 'rake', turn: 0.4 },
    uncoil: { from: 0.5, every: 0.1, gap: 3, at: 26, hole: 14 },
    fall: null,
    sprite: SPRITE.boss11,
    spriteHit: SPRITE.boss11Hit,
    radius: 14,
    health: 880,
    damage: 3,
    station: 130,
    drift: 5,
    driftWavelength: 220,
    patrol: 0.45,
    shot: 'flak',
    phases: [
      { upTo: 1, fireEvery: 78, shots: 3, spread: 0.7, patrolScale: 1, stance: { kind: 'volley' }, shot: null, attack: null },
      { upTo: 0.7, fireEvery: 66, shots: 5, spread: 1, patrolScale: 1.3, stance: { kind: 'volley' }, shot: null, attack: null },
      { upTo: 0.4, fireEvery: 54, shots: 7, spread: 1.4, patrolScale: 1.7, stance: { kind: 'volley' }, shot: null, attack: null },
    ],
  },
  /**
   * The Rime Shelf's end: the frost ship.
   *
   * It tracks the player's lane and lays a wall across it. Owed: frost bolts and frost blasts, the
   * cold that slows and freezes a ship that comes too close, and its adds.
   */
  hoarfrost: {
    move: { kind: 'stalk', agility: 0.18 },
    attack: { kind: 'wall', gap: 10 },
    uncoil: null,
    fall: null,
    sprite: SPRITE.boss12,
    spriteHit: SPRITE.boss12Hit,
    radius: 13,
    health: 940,
    damage: 3,
    station: 131,
    drift: 5,
    driftWavelength: 260,
    patrol: 0.3,
    shot: 'flak',
    phases: [
      { upTo: 1, fireEvery: 84, shots: 2, spread: 0, patrolScale: 1, stance: { kind: 'volley' }, shot: null, attack: null },
      { upTo: 0.7, fireEvery: 72, shots: 3, spread: 0, patrolScale: 1.2, stance: { kind: 'volley' }, shot: null, attack: null },
      { upTo: 0.4, fireEvery: 60, shots: 4, spread: 0, patrolScale: 1.5, stance: { kind: 'volley' }, shot: null, attack: null },
      { upTo: 0.15, fireEvery: 54, shots: 4, spread: 0, patrolScale: 1.9, stance: { kind: 'volley' }, shot: null, attack: null },
    ],
  },
  /**
   * The Toxic Mire's end: the hydra.
   *
   * ⚠️ **A head at every fifth of its health — 80, 60, 40 and 20 per cent — and every head is a
   * phase.** The ask gives each head its own attack: acid, then flame, then laser bolts, then
   * frost, then void. Today a head is one more shot in the spray; the five kinds of shot are owed,
   * one per head.
   */
  hydra: {
    move: { kind: 'bob', amplitude: 18, wavelength: 220 },
    attack: { kind: 'spray' },
    uncoil: null,
    fall: null,
    sprite: SPRITE.boss13,
    spriteHit: SPRITE.boss13Hit,
    radius: 16,
    health: 1000,
    damage: 3,
    station: 128,
    drift: 5,
    driftWavelength: 240,
    patrol: 0.3,
    shot: 'spit',
    phases: [
      { upTo: 1, fireEvery: 72, shots: 1, spread: 0, patrolScale: 1, stance: { kind: 'volley' }, shot: null, attack: null },
      { upTo: 0.8, fireEvery: 66, shots: 2, spread: 0.4, patrolScale: 1.2, stance: { kind: 'volley' }, shot: null, attack: null },
      { upTo: 0.6, fireEvery: 60, shots: 3, spread: 0.7, patrolScale: 1.4, stance: { kind: 'volley' }, shot: null, attack: null },
      { upTo: 0.4, fireEvery: 54, shots: 4, spread: 1, patrolScale: 1.6, stance: { kind: 'volley' }, shot: null, attack: null },
      { upTo: 0.2, fireEvery: 48, shots: 5, spread: 1.3, patrolScale: 1.8, stance: { kind: 'volley' }, shot: null, attack: null },
    ],
  },
  /**
   * The Black Heart's end: the jellyfish, with the heart pulsing inside it.
   *
   * ⚠️ **It opens at the end, and that is the ask** — *"final phase will be the jellyfish opening
   * up and the black heart spewing forth a rain of void blasts."* The bared window is the opening;
   * the rain of void, the tendrils that pulse lightning, and the moon jellies that fall on the
   * player are owed. Its ring gets denser as it dies and its curtain is the tendrils' stand-in.
   */
  medusa: {
    move: { kind: 'bob', amplitude: 14, wavelength: 260 },
    attack: { kind: 'ring' },
    uncoil: { from: 0.5, every: 0.1, gap: 4, at: 50, hole: 13 },
    fall: null,
    sprite: SPRITE.boss14,
    spriteHit: SPRITE.boss14Hit,
    radius: 17,
    health: 1100,
    damage: 3,
    station: 127,
    drift: 5,
    driftWavelength: 300,
    patrol: 0.24,
    shot: 'spit',
    phases: [
      { upTo: 1, fireEvery: 66, shots: 4, spread: 0, patrolScale: 1, stance: { kind: 'volley' }, shot: null, attack: null },
      { upTo: 0.75, fireEvery: 54, shots: 6, spread: 0, patrolScale: 1.3, stance: { kind: 'volley' }, shot: null, attack: null },
      { upTo: 0.5, fireEvery: 48, shots: 8, spread: 0, patrolScale: 1.6, stance: { kind: 'volley' }, shot: null, attack: null },
      { upTo: 0.3, fireEvery: 42, shots: 10, spread: 0, patrolScale: 2, stance: { kind: 'volley' }, shot: null, attack: null },
      // The opening: a sixth of the bar at three times the damage is 1.8 s at max weapons, past the
      // death it runs into (0150's floor).
      { upTo: 0.16, fireEvery: 36, shots: 10, spread: 0, patrolScale: 1.2, stance: { kind: 'bare', damageScale: 3 }, shot: null, attack: null },
    ],
  },
};
