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
import type { ShotKind } from './shots.ts';
import { SPRITE } from './sprites.ts';

/** Every boss in the game. Closed. */
export const BOSS_KINDS = ['sentinel', 'harrow', 'lattice', 'shoalMother', 'redoubt', 'chorus', 'axis'] as const;

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
export const BOSS_ATTACK_KINDS = ['aimed', 'spray', 'rake', 'ring', 'wall'] as const;

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
  | { kind: 'wall'; gap: number };

/**
 * Every way a boss can STAND in a phase. Closed.
 *
 * ── WHY A MOMENT IS NOT AN IDEA, WHICH IS WHY THIS IS NOT AN ARM OF `BossAttack` ─────────────────
 *
 * ⚠️ **`docs/decisions/0150-the-uncoil-and-the-eye.md`.** Reported from play: *"the bosses need to be
 * more interactive with more varied attacks."* `reports/the-boss-vocabulary-is-one-fan-2026-08-14.md`
 * proposed `overwhelm` alongside `sweep`, `lance` and `mine` as four arms of `BossAttack` — and three
 * of those four are IDEAS, things a whole boss can be built around. **`overwhelm` is not.** A barrage
 * sized against the shield pool is a *moment* in a fight, and a boss whose every volley was
 * unavoidable would not be a fight at all. `BossAttack` says what a boss IS; this says what a phase
 * DOES, which is the axis the report's own finisher — *"a phase that says stop shooting and open"* —
 * was already asking for.
 *
 * ⚠️ **`fireEvery`, `shots` and `spread` stay on the phase rather than moving into the arms.** Two of
 * the three arms fire a fan and use all three; `bare` fires nothing and carries zeros, which is a
 * TRUE statement about it rather than a field it ignores. The alternative — `shots` and `spread`
 * duplicated across two arms so that the third need not mention them — is more type and less
 * information.
 */
export const BOSS_STANCE_KINDS = ['volley', 'overwhelm', 'bare'] as const;

/** Derived from the list, so a stance cannot exist in the union and be missing from the switch. */
export type BossStanceKind = (typeof BOSS_STANCE_KINDS)[number];

export type BossStance =
  /** The phase's fan, at the row's aim. What every phase in the game did. */
  | { kind: 'volley' }
  /**
   * The phase's fan — **and one curtain right across the lane on the step the phase opens**, with no
   * gap in it wide enough for the ship to pass through. The uncoil.
   *
   * ⚠️ **ONE curtain per phase, not a cadence, and that bound is structural rather than tuned.** A
   * phase is keyed to remaining health, so *how long the player is inside it* is a function of their
   * loadout — an unavoidable attack on a CADENCE therefore costs a well-armed player one shield and a
   * base-weapon player a dozen, and no `fireEvery` exists that is right for both. Thrown once, as the
   * phase turns over, it costs exactly **one hit to anybody**, which is what *"sized against the
   * shield pool"* has to mean when the pool is three
   * (`docs/decisions/0050-the-ship-is-one-hit-and-the-shield-is-what-stands-in-front-of-it.md`).
   *
   * ⚠️ **`gap` is a MAXIMUM spacing and not the spacing.** The curtain spans the whole lane, so the
   * count is `ceil(ACROSS_SPAN / gap)` and the real spacing is the lane divided by it — which lands a
   * shot exactly on each edge and leaves no wider hole at one end than at the other.
   * `tests/level.test.ts` holds that the spacing is narrower than the ship can fit through, in world
   * units, off the ship's own radius and the bullet's.
   */
  | { kind: 'overwhelm'; gap: number }
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
    sprite: SPRITE.boss,
    spriteHit: SPRITE.bossHit,
    radius: 11,
    health: 480,
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
      { upTo: 1, fireEvery: 90, shots: 1, spread: 0, patrolScale: 1, stance: { kind: 'volley' } },
      /*
        Half health: a three-way spread, so a player who has settled into one lane is moved out of
        it. The spread is wide enough that standing still is punished and narrow enough that there is
        always a side to leave towards.
      */
      { upTo: 0.6, fireEvery: 66, shots: 3, spread: 0.5, patrolScale: 1.4, stance: { kind: 'volley' } },
      /*
        The last third: five shots, wider, faster, and the hull itself moving at twice its opening
        speed. Every arsenal meets this phase — that is 0040's point — so it has to be survivable
        with the base weapon alone, which is exactly what the first play-test of this build measures.
      */
      { upTo: 0.3, fireEvery: 48, shots: 5, spread: 0.9, patrolScale: 2, stance: { kind: 'volley' } },
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
    sprite: SPRITE.boss2,
    spriteHit: SPRITE.boss2Hit,
    radius: 12.5,
    health: 580,
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
      { upTo: 1, fireEvery: 72, shots: 3, spread: 0.45, patrolScale: 1, stance: { kind: 'volley' } },
      { upTo: 0.7, fireEvery: 60, shots: 5, spread: 0.8, patrolScale: 1.3, stance: { kind: 'volley' } },
      { upTo: 0.4, fireEvery: 48, shots: 5, spread: 1.15, patrolScale: 1.8, stance: { kind: 'volley' } },
      /*
        The last fifth: seven shots across most of a right angle, and a hull crossing the lane at
        two and a half times its opening speed. Every arsenal meets every phase, so this has to be
        survivable with the base weapon alone — which is exactly what `tests/level.test.ts` drives.
      */
      { upTo: 0.2, fireEvery: 42, shots: 7, spread: 1.4, patrolScale: 2.5, stance: { kind: 'volley' } },
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
    sprite: SPRITE.boss3,
    spriteHit: SPRITE.boss3Hit,
    radius: 11.5,
    health: 680,
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
      { upTo: 1, fireEvery: 84, shots: 3, spread: 0.9, patrolScale: 1, stance: { kind: 'volley' } },
      { upTo: 0.66, fireEvery: 66, shots: 5, spread: 1.2, patrolScale: 1.3, stance: { kind: 'volley' } },
      { upTo: 0.33, fireEvery: 54, shots: 7, spread: 1.5, patrolScale: 1.7, stance: { kind: 'volley' } },
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
    sprite: SPRITE.boss4,
    spriteHit: SPRITE.boss4Hit,
    radius: 13,
    health: 780,
    damage: 3,
    station: 136,
    drift: 18,
    driftWavelength: 120,
    patrol: 0.62,
    shot: 'lance',
    phases: [
      { upTo: 1, fireEvery: 96, shots: 1, spread: 0, patrolScale: 1, stance: { kind: 'volley' } },
      { upTo: 0.7, fireEvery: 78, shots: 3, spread: 0.4, patrolScale: 1.5, stance: { kind: 'volley' } },
      { upTo: 0.4, fireEvery: 66, shots: 3, spread: 0.7, patrolScale: 2.1, stance: { kind: 'volley' } },
      { upTo: 0.15, fireEvery: 60, shots: 5, spread: 0.9, patrolScale: 2.8, stance: { kind: 'volley' } },
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
    sprite: SPRITE.boss5,
    spriteHit: SPRITE.boss5Hit,
    radius: 14,
    health: 880,
    damage: 3,
    station: 142,
    drift: 8,
    driftWavelength: 300,
    patrol: 0.16,
    shot: 'flak',
    phases: [
      { upTo: 1, fireEvery: 54, shots: 3, spread: 0.7, patrolScale: 1, stance: { kind: 'volley' } },
      { upTo: 0.7, fireEvery: 42, shots: 5, spread: 1, patrolScale: 1.2, stance: { kind: 'volley' } },
      { upTo: 0.4, fireEvery: 36, shots: 7, spread: 1.3, patrolScale: 1.4, stance: { kind: 'volley' } },
      { upTo: 0.15, fireEvery: 30, shots: 7, spread: 1.6, patrolScale: 1.6, stance: { kind: 'volley' } },
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
    sprite: SPRITE.boss6,
    spriteHit: SPRITE.boss6Hit,
    radius: 12.5,
    health: 980,
    damage: 3,
    station: 138,
    drift: 15,
    driftWavelength: 180,
    patrol: 0.45,
    shot: 'spit',
    phases: [
      { upTo: 1, fireEvery: 72, shots: 3, spread: 0.5, patrolScale: 1, stance: { kind: 'volley' } },
      { upTo: 0.8, fireEvery: 60, shots: 3, spread: 0.9, patrolScale: 1.3, stance: { kind: 'volley' } },
      { upTo: 0.62, fireEvery: 54, shots: 5, spread: 1.1, patrolScale: 1.6, stance: { kind: 'volley' } },
      /*
        ⚠️ **THE UNCOIL, AND IT IS THIS LEVEL'S OWN IDEA WITH THE GAPS TAKEN OUT** — 0150. Level six
        is about there being no gaps and the rake is what that means in one word; a curtain with no
        hole in it is the same sentence with nothing left to dodge. It is the first attack in the game
        the shield is FOR, and it costs exactly one of them.
      */
      { upTo: 0.46, fireEvery: 48, shots: 7, spread: 1.3, patrolScale: 2, stance: { kind: 'overwhelm', gap: 4.5 } },
      { upTo: 0.32, fireEvery: 36, shots: 7, spread: 1.6, patrolScale: 2.4, stance: { kind: 'volley' } },
      /*
        ⚠️ **THE EYE.** It has thrown everything it had and it stops: no fan, no rake, a hull still
        crossing the lane at a rung under its opening speed, and three times the damage from every
        pulse that lands. About 1.8 seconds at max weapons, which is a beat longer than the death it
        runs into — `tests/level.test.ts` holds that floor against `BOSS_DEATH_STEPS`.

        ⚠️ **The fan it is still carrying is written out and never thrown**, which is the stance
        saying so rather than the row — see `BossStance`.
      */
      { upTo: 0.18, fireEvery: 30, shots: 7, spread: 1.6, patrolScale: 1.4, stance: { kind: 'bare', damageScale: 3 } },
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
    sprite: SPRITE.boss7,
    spriteHit: SPRITE.boss7Hit,
    radius: 16,
    health: 1140,
    damage: 3,
    // The closest station in the game. `95 + 14 + 16` is 125 against 150 — the hull fills a fifth of
    // the narrowest view, which is what a last boss should cost the player in room.
    station: 134,
    drift: 14,
    driftWavelength: 200,
    patrol: 0.4,
    shot: 'lance',
    phases: [
      { upTo: 1, fireEvery: 66, shots: 3, spread: 0.6, patrolScale: 1, stance: { kind: 'volley' } },
      { upTo: 0.8, fireEvery: 54, shots: 5, spread: 0.9, patrolScale: 1.4, stance: { kind: 'volley' } },
      { upTo: 0.62, fireEvery: 48, shots: 5, spread: 1.2, patrolScale: 1.8, stance: { kind: 'volley' } },
      /*
        ⚠️ **THE UNCOIL, TIGHTER THAN LEVEL SIX'S** — 0150, `gap: 4` against the chorus's 4.5. Both
        are narrower than the ship can pass through **at the SMALLEST hurtbox the settings allow**,
        which is the bound `tests/level.test.ts` holds: an assist may make this game easier and
        `docs/decisions/0024-the-accessibility-floor-is-settings.md` permits that, but a player who
        turned one on would otherwise never find out what a shield is for. What the difference buys is
        the picture — the last boss in the game fills the lane solid.
      */
      { upTo: 0.44, fireEvery: 42, shots: 7, spread: 1.5, patrolScale: 2.2, stance: { kind: 'overwhelm', gap: 4 } },
      { upTo: 0.3, fireEvery: 36, shots: 7, spread: 1.8, patrolScale: 2.8, stance: { kind: 'volley' } },
      /*
        ⚠️ **THE EYE, AND IT IS THE LAST THING THE AUTHORED RUN ASKS FOR.** The ring stops, the stalk
        slows to half what it was chasing at, and the fight ends on a window the player has to be in
        front of rather than on a health bar reaching zero — which is the word *interactive* in
        `reports/the-boss-vocabulary-is-one-fan-2026-08-14.md` answered at its own end.
      */
      { upTo: 0.16, fireEvery: 30, shots: 7, spread: 1.8, patrolScale: 1.4, stance: { kind: 'bare', damageScale: 3 } },
    ],
  },
};
