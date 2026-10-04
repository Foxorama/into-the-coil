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

// The lane's width, so a breach's surface is the edge of the lane rather than a second opinion about
// where that is — 0313. `src/content/sprites.ts` already reads it from here; the ladder allows it.
import { ACROSS_SPAN } from '../sim/camera.ts';
import type { Body } from '../sim/entity.ts';
// What an attack SOUNDS like is on the row that authors the attack — 0308. A sibling in this layer,
// exactly as `src/content/themes.ts` already reads it to re-voice a place's own cues.
import type { CueKind } from './cues.ts';
import type { EnemyKind } from './enemies.ts';
import type { FormationKind } from './formations.ts';
import type { ShotKind } from './shots.ts';
import type { ThemeKind } from './themes.ts';
import { QUETZAL_DOWNSTROKE, QUETZAL_WING_HEAD, SPRITE, VOLANS_FIRE_HEAD } from './sprites.ts';
import { WEAPONS, type WeaponKind } from './weapons.ts';

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
 * The slots in the table of bolts a storm runs along a body — `docs/decisions/0487-the-storm-is-lightning.md`.
 * A fixed table, so nothing grows in the frame, and the most any row's `Aura.storm.bolts` may ask for.
 */
export const BODY_BOLT_SLOTS = 4;

/** The most nodes one body bolt may run over — 0487, so the painter's buffer is sized once. */
export const BODY_BOLT_SPAN = 6;

/** The fields a body bolt keeps in the table: from node, to node, seed, age, and whether it is lit. */
export const BODY_BOLT_FIELDS = 5;

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
  'volans',
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
export const BOSS_MOVE_KINDS = ['patrol', 'bob', 'stalk', 'socket', 'wade'] as const;

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
  | {
      kind: 'patrol';
      /**
       * Steps to slow into a reversal or a beam's brace, and to come back up to speed out of either —
       * `docs/decisions/0483-the-pterodactyl-flies.md`. Absent, it reverses and stops in one step, as
       * every patroller did.
       *
       * ⚠️ **A RATE OF CHANGE AND NOT A CURVE**: the hull gains or loses at most `top / ease` a step,
       * turns early enough that its stopping distance meets the edge, and starts slowing for a beam
       * `ease` steps before the volley that throws one — so the brace finds it already still.
       */
      ease?: number;
    }
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
  /*
    ⚠️ **AND `rear` IS THE ALONG HALF OF IT, SO THE HULL SWEEPS AN ARC RATHER THAN A LINE — 0289.**
    Reported: *"can we give it more motion, like have it rear back a bit rather than just have the
    head go up and down?"* World units, phase-locked to the bob's own angle a quarter turn behind it:
    the hull is furthest UP-LANE as it crosses the middle of the lane rising, and furthest down-lane —
    nearest the player — as it crosses going the other way. One cycle of the bob is one withdrawal and
    one strike.

    ⚠️ **IT IS ON THE ROW AND EVERY BOBBING BOSS STATES ITS OWN, INCLUDING THE FOUR THAT STATE ZERO.**
    A default here would make *this animal rears* a property of the mechanism rather than of the
    animal, which is `docs/decisions/0282-a-mechanism-for-every-instance-makes-them-one-instance.md`'s
    whole subject — and a rearing harrow is a decision somebody should have to write down.

    ⚠️ **A HULL THAT LUNGES HAS TO STAND FURTHER BACK, AND THAT IS NOT A DETAIL.** 0101 holds every
    boss out of the player's half at the NEAR end of its swing, so a rear is subtracted there along
    with the drift: the serpent's station moved 114 → 130 to buy this, and at 14 units of rear it
    still only reaches 58% of the narrowest screen. `tests/level.test.ts` holds all three ends.
  */
  | { kind: 'bob'; amplitude: number; wavelength: number; rear: number }
  /**
   * Tracks the ship's lane, slowly.
   *
   * ⚠️ **The one arm that reacts to the player**, and it is the boss half of
   * `docs/decisions/0073-an-enemy-is-a-pilot.md`'s `hunt`. `agility` is world units per step, before
   * the phase's own scale — so a fight against this one is a fight to get out from in front of it,
   * where a patrol is a fight to be somewhere it is not going.
   */
  | { kind: 'stalk'; agility: number }
  /**
   * Set into the place and held there — `docs/decisions/0332-the-gyre-is-set-into-the-wall.md`.
   *
   * ⚠️ **ASKED FOR**: *"when it appears on screen I want it 'locked' into the background like a cog
   * set into an image."* It closes on `at` across the lane at the row's `patrol`, and once it is
   * there it stops: no slide, no reversal, and the row's `drift` is zero beside it so it does not
   * move along the lane either. A boss that holds one place is the one arrangement in which the
   * PLACE can be what moves, which is what a cog set into a wall looks like when the wall scrolls.
   *
   * ⚠️ **`seat` IS THE HOUSING IT IS SET INTO**, drawn behind the hull in the layer the serpent's
   * aura already uses. Without it the hull is a boss that stopped moving; with it the hull is
   * mounted in something — and the difference between those two is the whole of the ask.
   *
   * ⚠️ **IT IS STILL AN ARM ON `across` AND IT STILL DOES NOT TOUCH `along`**, which is what keeps
   * 0061's and 0101's six station assertions meaning what they say. What makes this one hold station
   * along the lane too is a `drift` of zero on its row, which is the field that already says so.
   *
   * ⚠️ **AND A HULL THAT DOES NOT MOVE IS A HULL THE PLAYER CAN ALWAYS HIT.** That is the trade
   * taken rather than an oversight: what this fight asks of the player is the wall, and `tests/level.test.ts`'s
   * *a boss swings across the lane* is scoped to the arms that claim to.
   *
   * ⚠️ **`throb`, AND A SEAT WITH ONE BEATS — 0400.** The share of its size the seat swells by on a
   * heartbeat at full strength: the Black Heart's heart is the seat of its fight, and *"you can see the
   * heart beating behind it"* is the ask. It beats to the heart the player HEARS (`Entity.throb`, read
   * against the music's clock by the painter), so it is picture and never touches the sim. Absent is a
   * housing, which does not beat.
   */
  | { kind: 'socket'; at: number; seat: number; throb?: number }
  /**
   * Stands in the floor — `docs/decisions/0384-the-hydra-stands-in-the-acid.md`.
   *
   * ⚠️ **ASKED FOR**: *"a hydra that has its lower body in the acid pools, the top half of its body and
   * tail sitting above the acid pools."* The hull's centre is held `sink` above the shore under it
   * (`src/sim/corridor.ts`'s face) — so as the camera carries it along the rolling bank it wades,
   * rising and falling with the ground rather than floating over it — and heaves `heave` units on a
   * sine `wavelength` steps long, which is breathing and not a patrol. With no floor under it the lane's
   * bottom edge stands in for the shore.
   *
   * ⚠️ **`pool` IS THE ACID IT STANDS IN**, half its width along the lane: the bank under it is drawn
   * as acid rather than mud for that stretch (`BankRow.pool`), so the body goes down into acid, which
   * is the ask, and not behind a bank of earth.
   *
   * ⚠️ **ON `across` ALONE, AS EVERY ARM IS**, so 0061's and 0101's station assertions still mean what
   * they say; its `drift` stays the row's.
   */
  | { kind: 'wade'; sink: number; heave: number; wavelength: number; pool: number };

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
export const BOSS_ATTACK_KINDS = [
  'spray',
  'lob',
  'rake',
  'sweep',
  'ring',
  'wall',
  'rain',
  'whip',
  'breaker',
  'summon',
  'beam',
  'heads',
] as const;

/** Derived from the list, so an attack cannot exist in the union and be missing from the switch. */
export type BossAttackKind = (typeof BOSS_ATTACK_KINDS)[number];

/**
 * One jagged beam's path — `docs/decisions/0453-the-laser-fans-out.md`, in lane units. `lean` is how
 * far outward its far end stands from its root (a fan), `outward` and `inward` how deep its knots swing
 * on either side of that leaning line. Every number is the row's: the shape is the boss's character.
 */
export type BeamPath = { readonly lean: number; readonly outward: number; readonly inward: number };

/** A row's zigzag — 0453: how many knots its beams turn at, and one path per root in `from`'s order. */
export type BeamJag = { readonly knots: number; readonly paths: readonly BeamPath[] };

/*
  ── `aimed` WAS THE FIRST ARM — the fan centred on the ship, what all seven did — AND 0258 DELETED IT ─

  *"Minibosses need to be on their own pattern path and not… aiming at the player… we need less
  enemies (and bosses) reacting to the player."* No boss aims now; the one that reacts does it by
  where it flies (the fish's stalk). An arm nothing sends is a member the union cannot keep —
  `tests/level.test.ts` holds that every arm is flown — so it is gone rather than left dispatchable,
  and a boss that aimed would fail to compile. `docs/decisions/0258-one-pilot-a-level.md`.
*/
export type BossAttack =
  /**
   * The fan, centred on the lane — a pattern the player reads rather than a spread that follows.
   *
   * `from` throws it out of more than one place — `docs/decisions/0398-the-pterodactyl-is-feathered.md`:
   * each entry an `[along, across]` offset from the row's muzzle (the hull's centre where it names none,
   * turned with the hull since 0452), and each throws its own fan of the
   * volley's shots dealt out between them, so a pair of wings throwing four throws two a wing. Absent is
   * the one place every other spray leaves from.
   */
  | { kind: 'spray'; from?: readonly (readonly [number, number])[] }
  /**
   * ONE shot, straight down the lane, whatever the phase's fan says — `docs/decisions/0311-the-acid-and-the-void-come-as-one-ball.md`.
   *
   * ⚠️ **THE ONLY ARM THAT DOES NOT SPEND `phase.shots`, AND THAT IS WHY IT EXISTS.** Every other one
   * here takes its count from the phase, because a phase widening its fan as health falls is the
   * escalation this table was built for (0040). A ball the player is meant to SHOOT is the opposite
   * kind of object: its difficulty is its thirty points of appetite and the ground it covers when it
   * bursts, and three of them at once is not a harder version of one, it is ninety points of shooting
   * the player cannot finish and three explosions they cannot all be away from.
   *
   * ⚠️ **SO THE COUNT IS ONE BY CONSTRUCTION RATHER THAN BY A ROW SAYING `shots: 1`.** The phase's
   * three are still read by the head beside this one, and a `spray` here would have thrown three balls
   * — which is what `ring` would have done too, and was the first thing tried.
   */
  | { kind: 'lob' }
  /**
   * The fan, centred on the lane, turning by `turn` radians every volley.
   *
   * ⚠️ **The turn is carried on the entity's `firePhase`**, the field 0110 added for the spinner —
   * one description of *where in its turn a body has got to*, used by both.
   *
   * ⚠️ **`arc` BOUNDS THE SWEEP, AND WITHOUT IT THE FAN GOES ALL THE WAY ROUND —
   * `docs/decisions/0317-the-pressure-comes-forward.md`.** `firePhase` accumulates without limit, so a
   * `turn` of 0.5 walks the centre through a **whole circle every thirteen volleys**: the fan spends
   * most of its life pointing sideways and backwards, at nothing, and *down the lane* is one volley in
   * thirteen. Flown, that is why the fish landed **0.02 hits a second** on a parked ship and why
   * neither more shots nor a tighter spread moved it — density cannot help a fan that is aimed away.
   *
   * ⚠️ **PRESENT, THE CENTRE OSCILLATES WITHIN `arc` RADIANS OF THE LANE** — `sin` of the same
   * `firePhase`, so the sweep slows at the ends and turns round, which is what a rake DOES and what
   * *"a fan of quills that rakes across the lane"* says in 0262's own prose.
   *
   * ⚠️ **ABSENT, IT IS THE FULL ROTATION IT ALWAYS WAS.** The gyre rakes too, and a silent change to
   * another boss's fight is not this decision's to make — 0282's default shape, and the gyre's own
   * play-test can ask for it.
   */
  | { kind: 'rake'; turn: number; arc?: number }
  /*
    ── `serpentine` WAS HERE — 0290's wave of acid — AND 0304 TOOK IT BACK OUT ────────────────────

    *"For phase 1 can we have it shoot a forward arc of 5 globes"*: the serpent's opening phase is a
    plain `spray` now, and its later acid is the `sweep` below. Nothing else threw a wave, and an arm
    nothing sends is a member the union cannot keep (`tests/level.test.ts`), so it is gone rather than
    left dispatchable. `docs/decisions/0304-the-serpent-sprays.md`.
  */
  /**
   * A spray whose aim turns WHILE it is thrown — `docs/decisions/0304-the-serpent-sprays.md`.
   *
   * ⚠️ **ASKED FOR**: *"a spray starting from 60 degrees (so it will be shooting down behind it)
   * then arcing around and finishing at 30 degrees (so it will be shooting up behind it)."*
   *
   * ⚠️ **OVER TIME, NOT AT ONCE, WHICH IS THE WHOLE OF WHAT MAKES IT A SPRAY.** Every other arm here
   * leaves the hull on one step. This one throws `globes` shots, one every `every` steps, from the
   * mouth where it is on that step, its heading turning evenly from `from` to `to` — a hose swung
   * round, so the stream is an arm curling through the air rather than a fan. The hull goes on flying
   * while it sprays, and the arm bends with the bob.
   *
   * ⚠️ **HEADINGS IN THE WORLD'S FRAME, WHERE `π` IS STRAIGHT DOWN THE LANE AT THE PLAYER** — every
   * arm of `throwAttack` uses it. `0` is straight up-lane, behind the hull; `π/2` is across-plus, the
   * bottom of the landscape screen. `to` is greater than `from`, so the aim turns through across-plus,
   * then down the lane, then across-minus: down, forward, up.
   *
   * ⚠️ **THE COUNT IS THE ATTACK'S AND NOT THE PHASE'S**, on the terms 0290 argued for the wave this
   * replaces: the phase's `shots` is handed to every head of a round, and the lightning is one of them.
   *
   * ⚠️ **AND THE NEXT VOLLEY WAITS FOR IT**, on `beam`'s terms: the gate adds the spray's own steps to
   * the cadence, so `fireEvery` is the rest between one spray ending and the next volley — otherwise a
   * phase whose spray outlasts its cadence throws its next head into the middle of it.
   */
  | { kind: 'sweep'; from: number; to: number; globes: number; every: number }
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
   * A breaker — `docs/decisions/0315-the-fish-throws-a-breaker.md`: a wave coming up off the near edge
   * of the lane, where the fish flicked its tail through it.
   *
   * ⚠️ **THE ONE ATTACK IN THE GAME THAT DOES NOT LEAVE THE HULL**, and that is the whole of what it
   * adds. Every other arm here is a fan, a lash, a rain or a beam FROM the boss, so the player's
   * question is always *where is it pointing* — this one comes up from underneath them, over a `span`
   * of lane centred on the hull, and the question is *where is it happening.* A breaching fish and a
   * wave off the same edge are one animal's idea, which is 0313's own reason for the entrance.
   *
   * ⚠️ **IT BOWS, AND `ends` IS WHAT MAKES IT A WAVE RATHER THAN A RANK.** The middle of the line
   * rises at `rise` and the outermost at `ends` of that, so the crest leads and the shoulders trail —
   * the whip's bow (0249) turned through ninety degrees and made a property of the LINE rather than of
   * the order it was thrown in. All of them leave on the same step.
   *
   * ⚠️ **THE DODGE IS ALONG THE LANE AND NOT ACROSS IT**, which is the axis every other attack leaves
   * alone: the wave covers `span` of lane and nothing else, so the answer is to be somewhere the fish
   * is not, rather than in a gap inside what it threw.
   */
  /*
    ⚠️ **AND SINCE 0380 IT MAY ROAM AND WARN.** Reported: *"the second stage attack that fires upward
    covers the right side of the screen and completely misses the player, it should 'spawn' at random
    places along the bottom of the screen and fire upward so that the player has to actively move
    forward/backward to dodge it."* `roams` draws the wave's centre from the fish's own stream, anywhere
    the NARROWEST view can show the whole span; `warning` is how many steps the spines stand in the
    edge, tips showing, before they rise — a wave from a random place with no tell is unfair rather than
    learnable. Both optional, on 0282's terms: absent is 0315's wave, centred on the hull, unwarned.
  */
  | { kind: 'breaker'; span: number; rise: number; ends: number; roams?: boolean; warning?: number }
  /**
   * A summons — 0249. Asked for: *"summons hordes of flying kites and raptors as adds at various
   * points throughout the fight."* Each volley puts `count` of `enemy` on the field at the leading
   * edge in `formation`, and throws nothing else: the adds are the attack. The phase's `shots`
   * and `spread` are carried and unused, on `bare`'s own terms — the escalation rules read them.
   */
  /*
    ⚠️ **AND WHERE FROM — 0262.** *"The adds marched in gently from the left side in a single file,
    they didn't swoop or dive bomb or do anything interesting."* `from: 'lead'` is 0249's leading
    edge; `from: 'sides'` puts the horde in from the across edges instead — a flanking wave's entry,
    alternating sides a volley — so a kite that dives (its row's hunt) comes at the ship across the
    lane rather than down it. `docs/decisions/0262-the-eagle-throws-quills.md`.
  */
  /*
    ⚠️ **AND HOW MANY MAY STAND — 0270.** `count` is the call; `standing` is the most of that kind
    the summons will keep on the field, so a volley tops the horde up rather than adding to it. It is
    NOT spelled `upTo`, which is the field a PHASE keys itself to health by — two meanings of one word
    on one line of the table below is the kind of reading error `src/content/sprites.ts` records the
    cost of. There was
    no ceiling at all, and the one that appeared to exist was the entity pool: measured over the frost
    ship's summon phase the adds peaked at **26 on the easiest tier and 40 on the hardest**, and 40 is
    `CAPACITY.enemies` in `src/app/mount.ts` — so what bounded the horde was `src/sim/pool.ts` running
    out, which also silently drops the volley after it. Reported: *"the adds target the player, you
    can't find the safe spot in the pattern of the explosive ice shards because there is no safe spot
    with the other attacks."*
    `docs/decisions/0270-a-shattering-volley-is-counted-in-shards.md`.

    ⚠️ **A CEILING ON WHAT IS STANDING, NOT A BUDGET FOR THE FIGHT.** A total would make a phase that
    ran long a phase that went quiet, and 0151 already argues why a fight's pressure may not be a
    function of how long the player takes. Topping up means the horde is the same size whether the
    player kills them fast or ignores them — what killing them buys is that the NEXT call lands.

    ⚠️ **The tier scales it** (`crowdFor`), so the authored number is the Legendary one.
  */
  | { kind: 'summon'; enemy: EnemyKind; count: number; formation: FormationKind; from: SummonFrom; standing: number }
  /**
   * Lasers — `docs/decisions/0250-the-quetzal-screams.md`. Asked for: *"a flying pterodactyl with
   * lasers mounted on its wings and it opens its mouth to fire a huge laser blast."*
   *
   * ⚠️ **A BEAM, NOT A BULLET, AND IT IS HELD.** One beam per entry of `from` — a root, `[along,
   * across]` from the row's muzzle in world units, so the shoulders are two entries and the throat is
   * one — each a bolt in the arc's pool running from its root down the lane to the trailing edge
   * of the screen.
   *
   * ⚠️ **A ROOT IS A POINT, NOT AN ACROSS — `docs/decisions/0452-a-boss-fires-from-its-guns.md`.**
   * Reported: *"the pteradactyl boss fires it lasers from the wrong spot, they don't fire from the end
   * of the cannons or from it's mouth."* `from` was an across offset alone, so every root was level
   * with the hull's centre: the shoulder beams began seven units behind their barrels' ends and the
   * throat's ten behind its cannon, over the chest. Where along the lane a root is belongs to the
   * thing it comes out of, which is the row's to say. It warns for `warning` steps as a thin line, then strikes for `hold` steps,
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
   *
   * ⚠️ **`jag`, AND A BEAM WITH ONE IS A ZIGZAG — 0388.** A new random zigzag every beam, warned along
   * the path it will burn. Absent is straight.
   *
   * ⚠️ **AND SINCE 0453 THE ROW SAYS EACH BEAM'S PATH, NOT ONE SWING FOR ALL OF THEM.** *"Wider peaks and
   * lows so that they spread out more"*, and then a shape for every count: one beam central with long
   * deep legs; two whose middle never touches and whose outsides reach; three and five as fans. One
   * number a row could say none of that. `knots` is how many the row's beams turn at — fewer is longer
   * legs — and `paths` is one `BeamPath` per root, in `from`'s order: how far its far end `lean`s out,
   * and how deep it swings `outward` and `inward`. Outward is the side of the hull its root is on;
   * a root on the centre line has no outside, and swings `outward` towards larger across.
   *
   * ⚠️ **`together`, AND A VOLLEY WITH IT IS ONE ZIGZAG LAID DOWN EVERY ROOT — 0403.** *"The lasers fire
   * from the tentacles is a jagged formation like the updated pteradactyl and hydra, there's still 5
   * that fire, but they need to be jagged so that there's a safe gap."* Five beams each jagged their
   * own way close on each other wherever two knots swing inward, and the gap between them is whatever
   * the dice left. One seed for the volley puts the same knots on every beam: they bend as one, and
   * across the lane two neighbours stay their spacing apart. ⚠️ **Across the lane is not where a ship
   * is hurt** — 0453 measured the room beside a steep leg, which is less, and found 0403's twelve knots
   * left less than a ship of it; the jellyfish's fan is shaped to keep it, and `tests/medusa.test.ts`
   * flies the volleys and measures. Absent is a seed a beam, which is the pterodactyl's and the hydra's.
   */
  | { kind: 'beam'; warning: number; hold: number; halfWidth: number; from: readonly (readonly [number, number])[]; jag?: BeamJag; together?: boolean }
  /**
   * The hydra's heads — `docs/decisions/0254-the-hydra-grows-heads.md`. Asked for: *"at 80, 60,
   * 40, 20% it spawns an extra head, the first head fires acid blasts, the second head adds flame
   * ball attacks, the third head fires laser bolts, the 4th head fires frost attacks and the last
   * head fires out void blasts."*
   *
   * ⚠️ **ONE HEAD A VOLLEY, ROUND AND ROUND.** Each head is a shot and an attack of its own; the
   * k-th volley of the fight is the k-th head's, and a phase that grows a head grows the round.
   * *"Adds"* is cumulative: every head stays in play, and the phase's quickening cadence is what
   * keeps each head's own turn from slowing as the round lengthens. Every head at once would be
   * one burst wearing five inks; every head in turn is five attacks the player reads one at a time.
   *
   * ⚠️ **A head is any attack but `heads` or `rake`**, by type: the first would be a round inside a
   * round, and the second shares `firePhase`, the field the round counts on.
   */
  | { kind: 'heads'; heads: readonly Head[]; grow?: Grow };

/**
 * A round that throws one head more often as the bar falls — `docs/decisions/0365-the-serpent-is-shorter.md`.
 *
 * ⚠️ **ASKED**: *"for the final phase with the combined orbs, add additional orb fire at every 10% of
 * health"* — read, when asked, as the ball coming round more often at each mark. Every `every` of the
 * bar below the phase's own `upTo`, the head at `head` is thrown one more time in the round, next to
 * itself: the serpent's ball and strike go ball, strike → ball, ball, strike → and so on.
 *
 * ⚠️ **ON THE ROUND AND NOT FOUR PHASES, AND FOUR PHASES WERE BUILT FIRST.** The hydra grows its heads
 * with phases (0254), and that works because its bands are a fifth of the bar. A tenth of the serpent's
 * is **2.4 s at the quickest gun**, and a phase in this table means *a change the player sees*: three
 * guards that hold that — a phase is seen for three seconds, fires quicker than the one before, and
 * throws a mark of its own — went red at once, which is what a thing that is not a phase looks like
 * when it is written as one. `Uncoil` (0151) is the same answer to the same shape: *a thing that happens
 * at fixed fractions of a health bar is not a thing a phase can say.*
 *
 * ⚠️ **OPTIONAL, ON 0282's TERMS**: absent is a round that does not grow, which is every round but one
 * today, and shared code holds that fallback rather than every row spelling `null`.
 */
export interface Grow {
  /** How much of the bar between one more throw and the next, from the phase's own `upTo` down. */
  every: number;
  /** Which head is thrown once more at each mark — an index into the round's `heads`. */
  head: number;
}

/**
 * Where a summons puts its adds — 0262: the leading edge, or the across edges in turn.
 *
 * ⚠️ **OR OUT OF THE BOSS'S OWN MOUTH — `docs/decisions/0373-the-fish-spits-its-adds.md`.** Asked
 * for: *"adds should fly out of its mouth to attack the player."* A `mouth` call puts the adds at the
 * hull's snout, thrown down the lane at the player in a fan, with the jaw open before they leave and
 * a spray at the mouth as they do — so the horde is a thing the boss DOES, on the screen, rather than
 * a wave that happens to arrive while it fights. The other two edges are still the other bosses'.
 */
export type SummonFrom = 'lead' | 'sides' | 'mouth';

/**
 * Where a lord's fragment leaves it — `docs/decisions/0514-the-fish-sheds-off-its-flanks.md`.
 *
 * `facing` is 0480's: off the rim turned to the ship, where its fire lands, flying at the ship.
 * `flank` is off a side, a quarter to three-eighths of a turn round from the ship, flying out and away
 * from it.
 *
 * ⚠️ **THE FISH IS WHY THERE ARE TWO.** It stalks the ship's lane face-on, so its rim turned to the
 * ship is its mouth, and 0373 made the mouth the place its adds come out of. Five embers a second
 * leaving the jaw at the player read as adds, tiny ones that never fire — *"the adds it spits out of
 * its mouth are now weirdly tiny and no longer fire bullets"* — while the real kites and minnows were
 * unchanged. A boss whose face is not a door keeps `facing`.
 */
export type ShedFrom = 'facing' | 'flank';

/** One of the hydra's heads — 0254: what it throws, and how. */
export interface Head {
  shot: ShotKind;
  attack: Exclude<BossAttack, { kind: 'heads' } | { kind: 'rake' }>;
  /**
   * What this head SOUNDS like, or absent for `bossShot` — `docs/decisions/0308-the-attacks-are-heard.md`.
   *
   * ⚠️ **REPORTED**: *"sounds for all the attacks need to be massively buffed."* Half of that sentence
   * is level and is answered in `src/content/cues.ts`; the other half is the word *all* — the serpent's
   * acid, its void and its lightning made one noise, which is
   * [0282](../../docs/decisions/0282-a-mechanism-for-every-instance-makes-them-one-instance.md)'s tell
   * exactly: *a mechanism whose output is identical for every kind.*
   *
   * ⚠️ **OPTIONAL, WHICH IS 0282's DEFAULT SHAPE AND NOT A FIELD SOMEBODY FORGOT.** *No row can forget
   * it is an argument for a DEFAULT, never for a CONSTANT* — so the fallback is in `src/app/boss.ts`
   * and a head with something to say says it. Eleven of the hydra's and the serpent's heads name one;
   * a boss whose attacks are all one kind of violence is entitled to one sound for them.
   *
   * ⚠️ **ON THE HEAD AND NOT ON THE SHOT ROW, BECAUSE THE LIGHTNING PROVES IT CANNOT BE THE SHOT.**
   * The serpent's `rain` head throws `void` — the bolt takes its damage from that row — so a cue keyed
   * to the bullet would make thunder sound like a void blast. What the player hears is the ATTACK.
   */
  cue?: CueKind;
  /**
   * Extra steps of quiet after this head's volley, before the round moves on to the next — absent is
   * none. `docs/decisions/0322-the-ball-is-worth-shooting.md`.
   *
   * ⚠️ **REPORTED**: *"the void balls [need] to be spaced out slightly more between the acid sprays."*
   *
   * ⚠️ **AND `fireEvery` CANNOT SAY IT, WHICH IS THE WHOLE REASON THIS FIELD EXISTS.** A `sweep` pushes
   * the cadence out to its own length (`src/app/boss.ts`), so on any tier whose `fireGap` takes the
   * phase's gap below the spray's sixty steps the next head lands **on the spray's last globe** — at
   * `burn` the serpent's void arrived the instant the acid stopped, and no value of `fireEvery` moved it,
   * because the spray's hold is a floor and the cadence is what it floors. Measured at all three tiers in
   * the decision. What the phase says is *how often the round comes round*; what a head says here is *how
   * much air this head gets*, and only the second one composes with a hold.
   *
   * ⚠️ **ON THE HEAD, NOT ON THE PHASE, ON 0282's TERMS**: a round of three where one head wants room and
   * two do not is a thing this table has to be able to say. The gap belongs to the head that was thrown,
   * so it is *the pause after the acid* rather than *the phase is slower* — which are different fights.
   *
   * ⚠️ **AND IT IS PUT ON THE FIRE GRID like every other cadence** (0096), so the volley after a gap still
   * lands on the lattice a dozen bodies are already firing on.
   */
  gap?: number;
}

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
export const BOSS_STANCE_KINDS = ['volley', 'bare', 'open'] as const;

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
  | { kind: 'bare'; damageScale: number }
  /**
   * It opens AND goes on throwing — `docs/decisions/0255-the-jellyfish-opens.md`. Asked for:
   * *"final phase will be the jellyfish opening up and the black heart spewing forth a rain of
   * void blasts."*
   *
   * ⚠️ **NOT A RELIEF, WHICH IS THE WHOLE DIFFERENCE FROM `bare`.** The bared window stops shooting
   * and is the fight ending on something other than a bar reaching zero; this is the fight getting
   * harder and shorter at once — the heart is exposed, and it is what is shooting. `damageScale`
   * multiplies what the player's shots take off it exactly as `bare`'s does; the fan is thrown as
   * `volley` throws it. It sits inside every escalation rule with nothing carved out, and the one
   * rule written for `bare` — once, at the end — does not read it, because it is not a window.
   */
  | { kind: 'open'; damageScale: number };

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
/**
 * Every way a curtain can stand — 0252, and **eight of them since
 * `docs/decisions/0332-the-gyre-is-set-into-the-wall.md`.** Closed, and in the order a spinning wall
 * takes them: one eighth of a turn apart, going round from the leading edge toward the far one.
 *
 * ── THE ORDER IS A COMPASS, AND THAT IS THE WHOLE OF WHAT THE PLAYER READS ──────────────────────
 *
 * ⚠️ **ASKED FOR**: *"it currently has 8 points so it'll turn 1/8th every fire and the wall comes
 * from that direction it's pointing when it next comes."* So the k-th stance is an EDGE of the
 * screen — the one the cog's spike is aimed at — and the wall comes in over it:
 *
 * | k | the spike points at | the wall |
 * |---|---|---|
 * | 0 | the leading edge | `across` — a line across the lane at the hull, thrown down it |
 * | 1 | leading + far corner | `backslant` — that line leaning, its far-edge end at the hull |
 * | 2 | the far edge | `alongFar` — a line along the lane outside it, falling toward the near edge |
 * | 3 | trailing + far corner | `rakeFar` — that line raked, so it crosses from the trailing end first |
 * | 4 | the trailing edge | `astern` — a line across the lane behind the camera, coming up it |
 * | 5 | trailing + near corner | `rakeNear` — the near-edge line raked, crossing from the trailing end |
 * | 6 | the near edge | `alongNear` — a line along the lane outside it, falling toward the far edge |
 * | 7 | leading + near corner | `slant` — the across line leaning, its near-edge end at the hull |
 *
 * `across`, `slant` and `backslant` are 0252's, unchanged; `alongNear` is 0252's `along`, renamed
 * now that there is one at each edge.
 *
 * ⚠️ **THE FOUR CORNERS LEAN OR RAKE, AND NONE OF THEM TRAVELS CORNER TO CORNER.** A wall that
 * arrives everywhere at once along a 45° line has to start outside the field at both ends, and the
 * lane's cull is forty units past its edge — 0252 measured that and it has not moved. What a corner
 * gets instead is the adjacent edge's own wall, tilted toward the corner named, so that the corner
 * is where its crossing BEGINS. Every one of the eight still spans an entire axis of the field, so
 * there is no corner of the lane any of them leaves standing.
 *
 * ⚠️ **AND THE LEAN IS 100 UNITS WHERE THERE IS ROOM AND 30 WHERE THERE IS NOT.** `slant` and
 * `backslant` lean a whole lane's width because they are thrown down the lane and the leading cull
 * is 280 units out; the rakes tilt thirty units into the margin because `EDGE_MARGIN` is forty and
 * the shots would otherwise be culled on the step they were thrown. The numbers differ because the
 * field's two axes do.
 */
export const CURTAIN_STANCES = [
  'across',
  'backslant',
  'alongFar',
  'rakeFar',
  'astern',
  'rakeNear',
  'alongNear',
  'slant',
] as const;

/** Derived from the list, so a stance cannot exist in the union and be missing from the switch. */
export type CurtainStance = (typeof CURTAIN_STANCES)[number];

/**
 * The gyre's hole for each way its wall stands — `atBy` on its row.
 *
 * ⚠️ **A HOLE PER STANCE — 0501**: *"I want the holes to be in different positions to keep the player
 * actively moving around the screen."* Each wall's hole is far from the last one's: the walls across
 * the lane swap edges (the backslant's 31 runs from the far edge, so it opens at 89 across), and the
 * four along the lane swap ends, the front at three fifths of the line and the back at a quarter.
 * Every one is where it was last fight, so the pattern is still the one 0151 says the player learns.
 */
const GYRE_HOLES: Readonly<Record<CurtainStance, number>> = { across: 31, backslant: 31, alongFar: 75, rakeFar: 30, astern: 89, rakeNear: 75, alongNear: 30, slant: 89 };

/**
 * Where a wall standing this way leaves its hole, as a share of the lane in `at`'s units — the row's
 * own place for that stance, or `at` — 0501. The one reader, so the thrower, the instruments and the
 * guards cannot disagree about where the hole is.
 */
export function holeAt(uncoil: Uncoil, stance: CurtainStance): number {
  return uncoil.atBy?.[stance] ?? uncoil.at;
}

export interface Uncoil {
  /** Health fraction at or below which the boss starts throwing it. */
  from: number;
  /** Health lost between one curtain and the next, as a fraction of full health. */
  every: number;
  /**
   * How the gap between curtains SHRINKS as the fight goes on, or `null` for a wall that keeps one
   * cadence — `docs/decisions/0332-the-gyre-is-set-into-the-wall.md`.
   *
   * ⚠️ **ASKED FOR**: *"the walls and turns come faster as it gets more hurt."*
   *
   * ⚠️ **AND IT IS STILL COUNTED IN HEALTH RATHER THAN IN STEPS, WHICH IS 0151's WHOLE ARGUMENT.**
   * *"Fire off at every 10% damage reduction"* bills every arsenal the same; a `fireEvery` would bill
   * a base-weapon player three times what it bills one at the design loadout, because they stand
   * inside each phase three times as long. A gap that shrinks in health shrinks in SECONDS too, for
   * anyone whose damage is roughly steady — which is what *faster* means to the player — without
   * charging the slower gun for being slow.
   *
   * ⚠️ **`least` IS WHAT MAKES IT TERMINATE.** A gap multiplied by `by` every curtain converges, and
   * a converging series that never reaches the health bar's end throws an unbounded number of walls
   * at it. The floor is the closest together two curtains may ever stand, and `uncoilsBy` walks the
   * ladder rather than inverting it, so the two numbers can be read straight off the row.
   */
  quicken: { by: number; least: number } | null;
  /**
   * The fewest steps that may stand between one curtain and the next —
   * `docs/decisions/0333-a-wall-arrives-whole.md`.
   *
   * ⚠️ **THE HEALTH LADDER SAYS *WHICH* WALL AND THIS SAYS *NOT YET*.** 0151's count is keyed to
   * health and stays keyed to health: a notch the damage has reached is a wall the boss OWES, and it
   * is thrown on the first step this gap allows. Nothing is skipped and nothing is re-ordered, so the
   * spinning hull still ticks one point per wall (0332) — what changes is that a gun fast enough to
   * cross four notches in a second no longer puts four walls in the air at once.
   *
   * ⚠️ **AND THE REASON IS THE POOL, MEASURED RATHER THAN FEARED.** `enemyShots` holds 150 and the
   * gyre's longest wall is 45 shots; three walls and a fan do not fit, so `throwCurtain`'s *a curtain
   * that will not fit is dropped rather than grown* fired — and a wall missing half its shots is not
   * a wall with the hole the player learned, it is a fan. Driven over every gun at every tier before
   * this field existed, **53% of all wall shots never reached the field** under a shuriken at four
   * rungs and thirteen of seventeen walls arrived broken. The decision has the table.
   *
   * ⚠️ **IT IS A FLOOR AND NEVER A CADENCE.** A boss whose health is not falling throws nothing,
   * however long it waits — which is the difference between this and the `fireEvery` 0151 refused.
   */
  apart: number;
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
   * Where the hole stands on each way the wall can stand, as `at` does, or `null` for `at` on every one —
   * `docs/decisions/0501-the-hole-moves-with-the-wall.md`.
   *
   * ⚠️ **ASKED FOR, OVER 0151**: *"I want the holes to be in different positions to keep the player
   * actively moving around the screen."* The hole was one share of every line, and on a spinning wall
   * that put four of the eight holes about forty units ahead of the camera's trailing edge, where the
   * ship already sits. A hole per stance is still FIXED — the k-th wall's hole is where it was last
   * fight — so it is still the pattern 0151 says the player learns; what changes is that learning it
   * means flying it.
   *
   * ⚠️ **A DEFAULT AND NOT A CONSTANT** — 0282. A wall that does not turn authors none and every wall it
   * throws uses `at`; `holeAt` is the one reader.
   */
  atBy: Readonly<Record<CurtainStance, number>> | null;
  /**
   * Whether the curtain turns an eighth between one throw and the next — 0252, **and the hull turns
   * with it since 0332.** `false` for a wall that always stands across the lane.
   *
   * ⚠️ **THE SPIN IS THE GYRE'S UPGRADE, WORD FOR WORD** — `docs/decisions/0252-the-gyre-spins.md`:
   * *"it'll spin and create diagonal, vertical and horizontal gaps to fly through."* The k-th
   * curtain of a fight takes the k-th of `CURTAIN_STANCES`, round and round. `at` and `hole` are
   * read along the line wherever it stands, so the hole is still one place, learned once.
   *
   * ⚠️ **AND IT IS EIGHT STANCES AND A HULL THAT SHOWS WHICH — 0332.** *"When it fires a wall, it
   * ticks around like a cog to point in the next direction."* The cog's spike is aimed at the edge
   * the NEXT wall comes in over, all the way through the gap between two walls, which is what makes
   * a wall from behind something the player was told about rather than something that happened to
   * them. 0252 refused *the hull drawn turning* on the grounds that `blit` cannot rotate; it can
   * since [0306](0306-the-serpent-coils-in.md), so the refusal's reason is gone.
   *
   * ⚠️ **EIGHT STANCES AND NOT AN ANGLE, BECAUSE THE LANE HAS EDGES.** A wall at an arbitrary angle
   * that arrives everywhere at once must start as far above the lane as it is slanted, and the
   * across cull is forty units out — the first draft was an angle, and its diagonal lost its top
   * third on the step it was thrown. `CURTAIN_STANCES` has what the eight do instead.
   *
   * ⚠️ **The FIRST curtain always stands across the lane**, whatever this says, which is what keeps
   * every guard in `tests/level.test.ts` that reads a curtain by its `across` honest: they all drive
   * the first notch.
   */
  spin: boolean;
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
export const FALL_KINDS = ['shot', 'body'] as const;

/** Derived from the list, so a fall cannot exist in the union and be missing from the switch. */
export type FallKind = (typeof FALL_KINDS)[number];

/**
 * ⚠️ **A FALL IS A SHOT OR A BODY SINCE 0255**, and it starts at a share of the health. The
 * volcanoes' rock is a shot (0251); the jellyfish's moon jellies are bodies —
 * `docs/decisions/0255-the-jellyfish-opens.md`: *"lots of moon jelly adds that rain down onto the
 * screen and player."* A body is put at the top edge as a rock is and falls at its own closing
 * speed, steering for a place past the across cull the way a flanker steers for its lane (0048)
 * so it sinks straight out, and is an enemy in every other respect. `from` is the health fraction at or below which the fall runs,
 * `1` for one that runs from the first step.
 */
export type Fall =
  | {
      kind: 'shot';
      /** What falls. A hostile shot, sent by this and nothing else. */
      shot: ShotKind;
      /** Steps between belches, before the tier's own gap scales it. */
      every: number;
      /** How many fall in one belch. */
      count: number;
      /** Health fraction at or below which it falls. */
      from: number;
    }
  | {
      kind: 'body';
      /** What falls. An enemy, sent by this and by no level. */
      enemy: EnemyKind;
      every: number;
      count: number;
      from: number;
      /**
       * The share of the boss's full health a body gives back when it drifts into the boss — its hull
       * or any body of it — and is gone, or absent for a fall that is only a hazard — 0404.
       *
       * ⚠️ **ASKED FOR**: *"if a falling jellyfish hits the boss, the boss regains 5% health and the
       * jellyfish disappears -> this includes if they hit a tentacle."* So the rain is the player's to
       * shoot twice over: once because it hurts, and once because it feeds. And a heal that carries the
       * health back over a phase's line is that phase again (`phaseFor` reads health, and the player
       * chose it): the bell shuts while it is fed past its last fifth.
       */
      feeds?: number;
    };

/**
 * The chill: what a boss's hull does to a ship that comes too close —
 * `docs/decisions/0253-the-frost-ship-chills.md`. Asked for: *"if you get too close it will slow
 * you down and freeze you."*
 *
 * ⚠️ **IT SCALES THE ASK, NOT THE VELOCITY.** The ship has mass (0037): its velocity approaches
 * what the stick asks by a fixed fraction a step, and a scale on the velocity every step would
 * compound with that into a crawl no number here describes. Scaling the stick's ask by `slow`
 * makes the slowed ship exactly a ship whose top speed is `slow` of its own, with its own mass.
 * A frozen ship's ask is nothing, and it coasts to the scroll rate as any released stick does.
 *
 * ⚠️ **ON THE ROW, on `uncoil`'s and `fall`'s terms**: the cold is the hull's through every phase,
 * and a phase table cannot say that. `null` on every row but the frost ship's.
 */
export interface Chill {
  /** How far from the hull's centre the cold reaches at the start of a pulse, in world units. */
  radius: number;
  /**
   * How far it has swollen to at the top of a pulse — 0459.
   *
   * ⚠️ **ASKED FOR**: *"it needs to slowly increase in a pulse every 10 secs so that it takes up most
   * of the screen, then flickers out and restarts. It's pretty at the moment but has no game effect
   * at all as it's too small."* The cold grows from `radius` to this over `swell` steps, draws back to
   * `radius` over `retract`, and rests there for what is left of the pulse — 0471. The model and the
   * picture both read `chillRadiusAt`, so the slow is exactly as wide as what is drawn on every step.
   *
   * ⚠️ **NO LONGER A STROBE AND A WRAP — 0471.** *"The aura pulses out and then just resets like
   * it's a bug, it should pulse out, retract and pulse again like a proper pulse."* 0459's pulse
   * strobed at its top and then jumped from nothing back to `radius` on one step; nothing on the
   * screen moved the cold back in, so it read as a reset.
   */
  reach: number;
  /** Steps from one pulse's start to the next — 0459. */
  pulse: number;
  /** Steps the cold takes to swell from `radius` to `reach` — 0471. */
  swell: number;
  /** Steps it takes to draw back from `reach` to `radius`; the rest of the pulse it rests — 0471. */
  retract: number;
  /** What is left of the stick's ask inside it: `0.5` is half speed. */
  slow: number;
  /** Steps inside it before the ship freezes. */
  freezeAfter: number;
  /** Steps the freeze lasts, during which the stick asks for nothing. */
  frozenFor: number;
  /**
   * What the cold looks like — `docs/decisions/0399-the-frost-is-crystal.md`: the layers laid behind
   * the hull, bottom first, each swelled so its edge is `radius` and turned `spin` radians a step.
   *
   * ⚠️ **ASKED FOR**: *"it does currently slow the ship now, but there's no actually visible aura"* —
   * 0036's class again: an event the model resolves and the picture never mentions. The puffs at the
   * ship said *you are slowed* after the fact; nothing said *here is where you will be*.
   *
   * ⚠️ **REQUIRED, NOT OPTIONAL**, because a cold nobody can see is the defect this answers: a second
   * cold hull authors its own field or does not compile. And on 0282's terms it is this row's — the
   * layers, their order and how fast each turns are what make it this ship's cold, and the frame holds
   * the arithmetic and no opinion.
   */
  field: readonly ChillLayer[];
  /**
   * The flakes, as patches of a fixed size riding rings on the radius — 0481.
   *
   * ⚠️ **ASKED FOR**: *"it gets bigger, but just on scale size which is why it looks so weird, it's scaled
   * up for the pulse so the snowflakes and stuff in it get huge, rather than it increase in size
   * organically."* The field's layers are swelled to the radius, which is right for a mist and wrong for
   * a snowflake: 0399's three rings of flakes went from 46 to 108 and every flake grew 2.3 times with
   * them. A patch is drawn at the size it was baked whatever the radius, and rides out on its ring as
   * the cold swells, so the field thins toward its edge as breath does.
   */
  rings: readonly ChillRing[];
}

/** One ring of a cold's flakes — 0481: `count` patches at `at` of the radius, turned `spin` a step. */
export interface ChillRing {
  sprite: number;
  /** Where on the radius, as a share of it. */
  at: number;
  count: number;
  /** Radians a step, signed: the inner ring the quicker, so the cold is a vortex (0399). */
  spin: number;
}

/**
 * How far the cold reaches `clock` steps into its fight — 0459, 0471.
 *
 * ⚠️ **ONE FUNCTION FOR THE SLOW AND THE DRAWING**, because a pulse is a moving edge, and an edge the
 * model and the picture each computed would be two edges by the first tuning pass. A smoothstep from
 * `radius` out to `reach` over `swell`, the same back over `retract`, and `radius` until the pulse
 * ends — so the edge starts, turns and lands gently and never jumps.
 */
export function chillRadiusAt(chill: Chill, clock: number): number {
  const t = clock % chill.pulse;
  const ease = (s: number): number => chill.radius + (chill.reach - chill.radius) * s * s * (3 - 2 * s);
  if (t < chill.swell) return ease(t / chill.swell);
  if (t < chill.swell + chill.retract) return ease(1 - (t - chill.swell) / chill.retract);
  return chill.radius;
}

/** One layer of a cold's field — 0399: a bitmap, and how far it turns each step. */
export interface ChillLayer {
  sprite: number;
  /** Radians a step, signed — the way it turns is the way the cold swirls. */
  spin: number;
}

/**
 * The body a boss drags behind its head — `docs/decisions/0283-the-serpent-is-a-chain.md`.
 *
 * ⚠️ **`null` ON THIRTEEN ROWS, AND THAT IS THE POINT RATHER THAN A GAP.** A hull that fills its own
 * box IS its own body; a serpent is a ribbon, and a ribbon is the one thing a single baked bitmap
 * cannot be — `src/render/scene.ts`: *"`blit` cannot rotate"*, so a boxed sprite can wave once, at
 * bake time, for ever. Reported twice: *"it's a static image that bounces up and down"*, and
 * *"there's no movement to the sprite itself, it's a flat static image that isn't alive."*
 *
 * ⚠️ **EVERY NUMBER ABOUT THIS ANIMAL IS ON ITS OWN ROW, WHICH IS
 * [0282](../../docs/decisions/0282-a-mechanism-for-every-instance-makes-them-one-instance.md)'s
 * RULE.** `src/app/frame.ts` holds the arithmetic and holds no opinion: the girths, the length, the
 * wave and the lag below are what make this animal a serpent rather than the shape of a chain. A
 * second boss with a chain would author a different creature out of the same code, and if it cannot,
 * this type is wrong.
 *
 * ⚠️ **AND THE BODY IS THE ANATOMY, NOT THE DECORATION.** *"The creature should have the functional
 * body shape of a creature — the 'design' should then enhance and accompany it."* `girth` is the
 * animal's cross-section down its length and nothing else; the scales, the ridge and the aura are
 * painted onto whatever shape it describes, in `src/render/bake.ts`.
 */
export interface Chain {
  /**
   * Which bitmap one node of this body is drawn as, and its hurt twin.
   *
   * ⚠️ **ON THE ROW, BECAUSE A SECOND CREATURE WITH A CHAIN IS A DIFFERENT CREATURE** — 0282. It is
   * also what puts the body in `LORD_HULLS` (`src/render/bake.ts`), so it wears its place's own skin
   * rather than the generic foe's: the first bake of this had a venom-green skull towing a row of
   * pink discs, because the head was a lord's hull and its body was not on any list.
   */
  sprite: number;
  spriteHit: number;
  /**
   * The animal's cross-section at each node, head-end first, in world units of DIAMETER.
   *
   * ⚠️ **A SNAKE HAS A NECK, AND THAT IS THE FIRST TWO ENTRIES.** 0277 measured the thing that made
   * every earlier serpent read as a worm: a profile falling monotonically from the skull, so the
   * thickest part of the animal was the part touching the head. A leech. These rise from the neck to
   * a midriff and then fall away to a whip, which is the cross-section of a snake.
   *
   * ⚠️ **The length of this array is the number of segments**, so a pool has to be able to hold it —
   * `tests/level.test.ts` holds that against `CAPACITY.bossBody` rather than leaving it to arithmetic
   * in somebody's head.
   */
  girth: readonly number[];
  /**
   * How far up-lane of the head's centre the first node sits, in world units.
   *
   * ⚠️ **WITHOUT IT THE NECK IS INSIDE THE SKULL, AND THE GUARD SAID SO BEFORE THE SHEET COULD.**
   * The first draft started the body at the head's own centre, so the first two points of the spine
   * were the same point — a joint with no length, which measured as a bend radius of **0.13 of its
   * own girth** and would have drawn as a neck buried in the middle of the face.
   *
   * ⚠️ **IT IS THE SKULL'S OWN HALF-LENGTH, and it is authored rather than derived from the sprite.**
   * `src/content/` cannot see how the head is drawn (0015 points the arrow the other way), and a
   * number derived from `SPRITE_EXTENT` would be a claim about the drawing rather than about the
   * animal. What it has to be is *where the head ends*, and a hand can see that on the sheet.
   */
  neck: number;
  /**
   * How far apart two nodes stand, as a share of the diameter between them.
   *
   * ⚠️ **UNDER A HALF, BECAUSE THE BODY IS DRAWN AS OVERLAPPING DISCS AND THE UNION IS THE ANIMAL.**
   * A disc is the one silhouette that is the same at every angle, which is what lets it be laid along
   * a curve a bitmap cannot turn to meet; what stops a row of them reading as beads is that each
   * covers more than half of the one behind it, so the visible edge is the envelope rather than a
   * scallop.
   *
   * ⚠️ **AND IT SETS THE LENGTH.** The body runs `Σ step × (girth[i] + girth[i+1]) / 2`, so a thick
   * stretch spaces its nodes further apart than a whip does — which is the same statement as *the
   * overlap is constant along the animal*.
   */
  step: number;
  /** How far a node swings across the lane at the tail, in world units — the wave's amplitude. */
  sway: number;
  /**
   * How far the travelling wave runs before it repeats, in world units ALONG the body.
   *
   * ⚠️ **WORLD UNITS AND NOT NODES, WHICH THE GUARD FOUND.** Nodes are spaced by their own girth, so
   * a whip-thin tail packs three times as many of them into a unit of lane as the midriff does — and
   * a wave counted per node ran three times faster there and kinked the tail at **0.44 of its own
   * girth** while the midriff stayed smooth. A wave travelling along a body has one spatial
   * frequency, and this is it.
   */
  wavelength: number;
  /** Radians the wave advances each step. Bigger is a faster undulation, not a faster animal. */
  rate: number;
  /**
   * Steps of lag per world unit down the body, so a turn travels along it rather than arriving at it.
   *
   * ⚠️ **THIS IS WHAT MAKES IT FOLLOW RATHER THAN SLIDE.** Without it the whole body is a rigid
   * offset from the head and a boss changing lane drags its body sideways like a plank. With it, a
   * node reads where the head's lane was `offset × lag` steps ago and the animal flows into its own
   * turn.
   *
   * ⚠️ **PER WORLD UNIT AND NOT PER NODE, FOR THE SAME REASON `wavelength` IS.** Per node, the tail's
   * closely-spaced nodes each sampled the head three steps further back than the last — and the head
   * bobs at three quarters of a unit a step, so adjacent tail nodes ended up two units apart across a
   * gap one unit long. That is a shear rather than a curve, and the bend guard measured it.
   */
  lag: number;
  /**
   * The share of a hit on the body that is spent on the head — `docs/decisions/0307-the-serpent-is-armoured.md`.
   * `1` is a body that is all one animal, as 0283 built it; `0` is armour, and the skull is the only
   * place it can be hurt.
   *
   * ⚠️ **ON THE ROW AND NOT IN THE FRAME, BECAUSE WHETHER A CREATURE'S FLANK IS SOFT IS THE
   * CREATURE** — [0282](../../docs/decisions/0282-a-mechanism-for-every-instance-makes-them-one-instance.md).
   * A second animal with a chain could be all belly.
   *
   * ⚠️ **AND A BODY THAT TAKES NOTHING DOES NOT FLASH.** The hurt twin says *that hurt*
   * ([0035](../../docs/decisions/0035-damage-is-legible-on-the-body-that-took-it.md)); on a flank that
   * took nothing it would be the picture saying HIT while the model says miss, which is
   * [0036](../../docs/decisions/0036-an-event-the-model-knows-about-the-picture-mentions.md) pointed
   * the other way. A shot still stops on it — armour is not a hole — and sparks where it glances.
   */
  hurt: number;
}

/**
 * The faces a boss's head wears — `docs/decisions/0285-the-mouth-is-alive.md`.
 *
 * ⚠️ **`null` ON THIRTEEN ROWS, ON `chain`'s OWN TERMS.** A hull that fills its own box has no face
 * to move; a creature does. Reported of the serpent: *"it needs to be aggressively moving its mouth
 * to watch the player's ship moving… it still feels like a non-interactive wall object rather than a
 * living space serpent trying to battle the player."*
 *
 * ⚠️ **FRAMES, BECAUSE `blit` CANNOT ROTATE OR DEFORM.** A jaw that opens is a second drawing —
 * `src/content/exhaust.ts` reached the same conclusion for a flame, and
 * [0280](../../docs/decisions/0280-a-cheap-mechanism-does-not-rename-the-ask.md) reached it for every
 * enemy in the game after a scale-pulse was shipped in place of animation.
 *
 * ⚠️ **AND THE ROW NAMES THEM RATHER THAN THE FRAME PICKING THEM OFF A LIST** — 0282. A second
 * creature with a face wears its own, and if it cannot, this type is wrong.
 */
export interface Face {
  /** Jaw part-open, looking down its own lane. What it wears between strikes. */
  rest: number;
  restHit: number;
  /** The same silhouette, pupil up-lane and down-lane of its own centre. Both share `restHit`. */
  up: number;
  down: number;
  /** Jaw wide and the tongue out: what it wears in the steps before a volley leaves. */
  gape: number;
  gapeHit: number;
  /**
   * Jaw closed: what it wears for the few steps after the ship crosses in front of it — 0285.
   *
   * ⚠️ **A SNAP IS NOT A TELL AND MUST NOT BE READ AS ONE.** It turns the jaw the OTHER way from
   * `gape`, so the two are a ladder either side of `rest` rather than two degrees of the same thing.
   */
  shut: number;
  shutHit: number;
  /**
   * How far across the lane the ship must be before the eye follows it and the side it is on changes,
   * in world units — 0478. Absent is `FACE_LOOK` in `src/app/frame.ts`, which every face wore until
   * then.
   */
  look?: number;
  /**
   * Steps after a snap before another can be armed — 0478. Absent is none, which every face had until
   * then. Played on the fish: *"i think it's just the mouth is animated a bit too fast"* — a stalker
   * crosses its own centreline constantly, so its jaw snapped every time it did.
   */
  biteRest?: number;
}

/**
 * The aura a creature burns with — `docs/decisions/0305-the-serpent-darkens.md`.
 *
 * ⚠️ **ASKED FOR**: *"a dark aura, kind of like a super saiyan aura, but dark blue and purple energy"*,
 * and at the lightning phase *"a super saiyan red lightning flicker through the aura."* Energy rising
 * off the whole animal, not a glow round one sprite.
 *
 * ⚠️ **ONE FLAME BEHIND EVERY NODE OF THE CHAIN AND ONE BEHIND THE HEAD, IN A LAYER OF ITS OWN.** Painted
 * into the node's bitmap it would sit over the node beside it — a pool draws in index order, and each
 * node covers the one behind — so the flames would smear across the flesh they are meant to rise off.
 * A layer drawn before the body puts every flame behind every node, which is where an aura is.
 *
 * ⚠️ **FRAMES, BECAUSE `blit` CANNOT DEFORM** — `src/content/exhaust.ts`'s answer for a flame. Node
 * `k` shows `frames[(⌊t / hold⌋ + k × stride) % n]` on step `t`, so the flicker runs down the body
 * rather than the whole animal blinking at once.
 *
 * ⚠️ **ON THE PHASE'S LOOK, SO ONLY WHAT AUTHORS ONE HAS ONE** — 0282: every number about this animal
 * is on its own row, and the frame holds the arithmetic and no opinion.
 */
export interface Aura {
  /** The bitmaps it flickers through, in order. */
  frames: readonly number[];
  /** Steps each frame is held before the next. */
  hold: number;
  /** How many frames on the flicker is from one node of the body to the next. */
  stride: number;
  /**
   * How big the head's flame is, as the girth of body it would crown — world units of diameter.
   *
   * ⚠️ **A GIRTH AND NOT A SCALE, SO THE HEAD'S FLAME AND A NODE'S ARE ONE MEASURE.** A node's flame
   * is drawn at the node's own girth; the head has none, so the row says what girth its skull reads as.
   */
  head: number;
  /**
   * What the HEAD's flame wears instead while a strike is coming, or absent — 0310.
   *
   * ⚠️ **ASKED FOR**: *"the horns need to grow and .5sec before the lightning attack happens, they need to
   * flare with red lightning."* The growth is the faces' own drawing; this is the flare.
   *
   * ⚠️ **THE HEAD'S FLAME ALONE, AND THAT IS THE WHOLE ECONOMY OF IT.** A flaring variant of all seven
   * faces and their hurt twins is sixteen more bakes of the widest sprite in the game, for a state that
   * lasts thirty steps. The aura already carries one flame for the skull, in a layer drawn before the
   * body, so a flare is three tiles and no new faces — and the horns are swept back off the crown, so what
   * shows from behind the head is exactly the arc between their tips.
   *
   * ⚠️ **OPTIONAL, ON 0282's DEFAULT TERMS**: an aura that does not flare says nothing, and the void
   * phase's does not — it has no strike to warn about.
   */
  flare?: readonly number[];
  /**
   * What the frames wear while the body they are behind is hurt, frame for frame, or absent —
   * `docs/decisions/0398-the-pterodactyl-is-feathered.md`.
   *
   * ⚠️ **A FLAME DOES NOT FLASH AND A WING DOES.** 0035's rule is that a hit lights the body that took
   * it, and a fire round the animal is not its body — so the fish's and the serpent's leave this out. The
   * pterodactyl's wings are flesh laid in this layer so that they can beat, and a hit that lit the
   * animal minus its wings would be the tail's defect over again (0374).
   */
  hurt?: readonly number[];
  /**
   * How much faster the beat runs while the hull climbs, and slower while it dives, as a share of
   * `hold`'s rate at full patrol speed — `docs/decisions/0483-the-pterodactyl-flies.md`. Absent, the
   * beat is the step clock alone.
   *
   * ⚠️ **CLIMB IS TOWARD `across` ZERO**, the top of the desktop screen (0153): a climbing bird works and
   * a diving one glides. The beat is a phase carried on the world rather than a clock divided, so a
   * change of rate never jumps a frame.
   */
  climb?: number;
  /**
   * How far the body rises and falls across the lane with the beat, in world units, and the share of
   * the beat that is the downstroke — `docs/decisions/0485-the-pterodactyl-is-plumed.md`. Absent, the
   * body does not move with what it wears.
   *
   * ⚠️ **THE BODY RISES ON THE DOWNSTROKE**, which is what makes a flap read as flight, and it is the
   * model's body that moves — the picture says what the model does (0036). It heaves by the slide's
   * share of top speed, so a hull braced for its beams is still and its roots stay on its guns.
   */
  heave?: { by: number; down: number };
  /**
   * Lightning stroked along the body rather than baked into each node's flame —
   * `docs/decisions/0487-the-storm-is-lightning.md`. At most `bolts` alive at once, each running node to
   * node over `span` nodes, re-rolled every `every` steps from its own stream and lit for `lit` of them, so
   * the crackle walks the animal. Absent, the aura is its frames alone.
   *
   * ⚠️ **A BOLT BAKED IN A TILE IS ONLY EVER INSIDE ITS TILE**, so 0310's *"across the whole body"* was never
   * what the picture did: twenty-seven separate sparks. A bolt stroked from node to node is one thing that
   * runs down the animal.
   */
  storm?: { bolts: number; span: readonly [number, number]; every: number; lit: number };
}

/**
 * What a phase makes a creature LOOK like — 0305.
 *
 * ⚠️ **THE FILE'S OPENING NOTE SAYS A PHASE CHANGES WHAT A BOSS DOES AND NOT WHAT IT LOOKS LIKE, AND
 * IT IS ABOUT A DIFFERENT THING.** Three silhouettes for three phases were refused as the way to say
 * *how much boss is left*, because a hull that changes shape costs a second art pass and says
 * nothing a rate and a spread do not. This is the player asking for the look itself: *"when the void
 * blast phase starts it needs to look more menacing and have a dark aura… and it's horns grow
 * longer."* And 0036 has wanted the phase change to be something the picture keeps saying since 0111
 * — the burst says it once; the horns and the aura say it for as long as the phase lasts.
 */
export interface Look {
  /** The faces the head wears in this phase — the horns are in the drawing. */
  face: Face;
  /** The aura it burns with in this phase, or `null`. */
  aura: Aura | null;
  /**
   * The tail it beats in this phase, where the phase's body has a different one — 0374. Absent is the
   * row's own tail, on `rear`'s and `escort`'s argument: only the phase that grew a body says so.
   */
  tail?: TailArt;
}

/**
 * The drawing of a tail — `docs/decisions/0374-the-fish-beats-its-tail.md`: one bitmap and its hurt
 * twin, pivoted on the bitmap's own centre, which is where the painter puts the peduncle.
 */
export interface TailArt {
  sprite: number;
  spriteHit: number;
}

/**
 * A tail that beats behind the hull — `docs/decisions/0374-the-fish-beats-its-tail.md`.
 *
 * ── THE ONE PART OF A BAKED ANIMAL THAT CAN MOVE WITHOUT A SECOND HULL ─────────────────────────
 *
 * Asked for: *"animation should be better."* A hull is one bitmap and `blit` cannot deform it (0022),
 * so what a swimming fish costs is the same answer an aura and a flame already have: a body of its
 * own in the layer drawn behind the hull, placed every step. The tail is that body. `blit` has taken
 * an angle since 0306, so a caudal fin is ONE drawing turned about its root rather than a set of
 * frames — and the hull yaws against it by a fraction of the sweep, which is what makes the beat a
 * swim and not a flag.
 *
 * ⚠️ **ON THE ROW AND NULL ON THIRTEEN OTHERS, ON `entrance`'s TERMS** — 0282: every number about
 * this animal is on its own row, and shared code holds the arithmetic and no opinion.
 */
export interface Tail {
  /** What is drawn — a phase's `look` may wear a different one on the same root. */
  art: TailArt;
  /** How far aft of the hull's centre the tail is rooted, in world units. Positive is up-lane. */
  root: number;
  /** Steps one beat takes, there and back. */
  beat: number;
  /** How far the tail swings each side of the hull's own heading, in radians. */
  sweep: number;
  /** How far the HULL yaws against the beat, in radians — a fraction of `sweep`, the other way. */
  yaw: number;
}

/**
 * One neck of a many-headed animal and the head on it — `docs/decisions/0384-the-hydra-stands-in-the-acid.md`.
 *
 * ⚠️ **A NECK IS ONE DRAWING TURNED ABOUT ITS ROOT, ON THE TAIL'S TERMS (0374)**, and it is a picture:
 * it is drawn behind the hull, in the layer the aura and the tail use, and it has no hurtbox. The HEAD
 * is a body — it is shot, what lands on it reaches the hull (`Necks.hurt`), flying into it costs the
 * ship a hit, and its mouth is where its attack leaves. A neck the size of this one as a chain of discs
 * would be forty bodies against a pool of twenty-six (`src/app/mount.ts`), and a disc on a long
 * neck's centre would be a hurtbox that disagreed with its picture everywhere but the middle.
 */
export interface Neck {
  /** Where it leaves the hull, world units from the hull's centre. */
  root: { along: number; across: number };
  /** Its heading at rest, radians in the world: `π` straight down the lane at the player, `−π/2` straight up the screen. */
  angle: number;
  /** How far the head's centre stands from the root, in world units — the neck's drawn length. */
  reach: number;
  /**
   * The neck's drawing, rooted on the bitmap's centre and running along its `+x` to its knuckle — and its
   * hurt twin. Since `docs/decisions/0486-the-neck-bends.md` the neck above the knuckle is the head's.
   *
   * ⚠️ **A TWIN, BECAUSE THE WHOLE ANIMAL FLASHES AS ONE.** The head and the body had theirs and the necks
   * and collars had none, so every hit lit a white head and a white body with coloured necks between.
   */
  art: number;
  artHit: number;
  /**
   * The neck's root drawn again IN FRONT of the hull — `docs/decisions/0464-the-hydra-is-one-beast.md`.
   * Placed where the neck is and turned as it is, so the two are one picture: what it adds is that the
   * body's outline no longer crosses the neck where it leaves the body. A picture, in no pairing. And its
   * hurt twin, on `artHit`'s terms (0486).
   */
  collar: number;
  collarHit: number;
  /**
   * The head, and its hurt twin. Drawn snout to `−x`, as every head in the game is — and since 0486 with
   * its upper neck in the same bitmap, so the head turns about the neck's knuckle carrying it.
   */
  head: number;
  headHit: number;
  /** The head's hurtbox, in world units. */
  radius: number;
  /** How far ahead of the head's centre its mouth is, along the way it faces. */
  mouth: number;
  /**
   * Whose colours the neck and the head are painted in — the place whose lord the head is drawn after.
   * *"Neck needs to be coloured for the new head"*: a fish's neck in the fish's reds, and so on.
   */
  livery: ThemeKind;
  /** The aura this head burns with, or absent for one that burns with nothing. */
  aura?: Aura;
}

/**
 * The necks a hydra grows — 0384, and 0254's *"a head a fifth"* made a thing the player sees.
 *
 * ⚠️ **NECK `k` GROWS WITH PHASE `k`**, so the phase table is the one statement of when a head appears
 * and `heads` in that phase's attack is the one statement of what it throws: the round's slot `k` fires
 * from neck `k`'s mouth. `tests/hydra.test.ts` holds that there are as many necks as phases.
 */
export interface Necks {
  /** In the order they grow. */
  necks: readonly Neck[];
  /** How far a neck sways each side of its rest, in radians, and the steps one sway takes. */
  sway: number;
  beat: number;
  /** Steps a new neck takes to rise up out of the acid into its place. */
  rise: number;
  /** How much of a hit on a head reaches the hull — 1 for all of it. */
  hurt: number;
  /** How far a head may turn from the lane's axis to look at the ship, in radians. */
  look: number;
  /**
   * How far a head may turn from its lower neck at the knuckle, in radians — `docs/decisions/0486-the-neck-bends.md`.
   * At rest the look is well inside it. While a neck swings up out of the acid it is what keeps the head
   * coming up facing the fight rather than nose-down in the stuff with its mouth under the lane.
   */
  bend: number;
  /**
   * The whole animal catching fire from one head — `docs/decisions/0389-the-hydra-catches-fire.md`, or
   * absent for a boss whose aura stays on the head that owns it.
   *
   * ⚠️ **ASKED FOR**: *"all the heads need to get their flaming aura when the last head emerges and the
   * aura needs to travel down the neck and merge into a combined aura that covers the whole body and tail
   * as well."* When neck `from` has risen — the head whose `aura` it is — every head burns with that aura;
   * over `travel` steps the fire runs down each neck, head first; and then each of `spots`, a place on the
   * body or the tail from the hull's centre with a flame `size` across in lane units, lights `gap` steps
   * after the one before, in the order listed. Spots are the row's because the body is the row's.
   */
  blaze?: { from: number; travel: number; gap: number; spots: readonly { along: number; across: number; size: number }[] };
}

/**
 * A jellyfish's tentacles — `docs/decisions/0403-the-tentacles-pull-out-of-the-heart.md`.
 *
 * ⚠️ **ASKED FOR**: *"when the player gets to the screen, the jellyfish tentacles need to 'pull out' from
 * the background where the arteries of the heart are and start waving around"*, *"the lazes fire from
 * the tentacles"*, and — asked whether a tentacle stings — *"they sting"*. Each tentacle is `nodes`
 * bodies in `bossBody`, laid every step down a curve from its `root` on the bell's rim to its `tip`,
 * waving across the lane; a hit on one is the row's `hurt` share on the hull, as a hydra's head's is, and
 * the ship that touches one is hurt as it would be by the hull.
 *
 * ⚠️ **THEY PULL OUT OF THE HEART'S ARTERIES.** On the step the fight's camera comes to rest the tentacles
 * lie along the vessels that run into the heart (`src/content/veins.ts`'s `ARTERIES`, tentacle `k` along
 * artery `k`), and over `draw` steps they peel off them into their hanging places. **They do not sting
 * while they are pulling out** — a tentacle sweeping out of the background across the ship would be a hit
 * nobody could see coming. They can be shot, as the bell over the heart already can.
 *
 * ⚠️ **AND A TENTACLE FIRES FROM ITS TIP.** Beam `k` of a volley leaves from the tip at rest (`tips[k]`);
 * while the boss holds a volley the tentacles straighten into their rest over `brace` steps, so the laser
 * and the thing it comes out of are in the same place. `tests/medusa.test.ts` holds the beams' roots to
 * the tips.
 */
export interface Tendrils {
  /** Where each leaves the bell's rim, `[along, across]` from the hull's centre. */
  roots: readonly (readonly [number, number])[];
  /** Where each tip hangs at rest, across the lane from the hull's centre — beam `k`'s root is tip `k`. */
  tips: readonly number[];
  /** How far down the lane from the hull's centre every tip hangs, in world units — a negative number. */
  reach: number;
  /** Lengths of tentacle each is drawn and hit as. */
  nodes: number;
  sprite: number;
  spriteHit: number;
  /** A length's hurtbox at the root, and the share of it at the tip. */
  radius: number;
  taper: number;
  /** How far the tip waves each side of its rest, in lane units, and the steps one wave takes. */
  sway: number;
  beat: number;
  /** Steps a tentacle takes to peel out of its artery into its place. */
  draw: number;
  /** Steps a tentacle takes to straighten when a volley is held, and to go slack after. */
  brace: number;
  /** How much of a hit on a tentacle reaches the hull — 1 for all of it. */
  hurt: number;
  /**
   * What a length near the tip wears while a laser is about to leave it — `docs/decisions/0490-the-tentacles-are-tentacles.md`:
   * the charge, lit in the last `charge` steps of a beam's warning, on the last `lit` lengths of each tentacle.
   * The line down the lane already warns where; this says *now*, at the thing it comes out of.
   */
  lit: { sprite: number; charge: number; lengths: number };
  /**
   * How many half-waves run down a tentacle at once — 0490. One and a little was a rod waving from its root;
   * two is an S that travels, which is what a tentacle in water does.
   */
  waves: number;
  /**
   * The frilled oral arms under the bell, or absent — 0490: shorter, ruffled, laid behind the bell as pictures
   * (they sting nothing) and swaying slowly. *"A medusa has both, and the frill is what makes a jellyfish
   * read."* Each is a `sprite` rooted at `[along, across]` from the hull's centre and hanging down the lane.
   */
  frills?: { sprite: number; roots: readonly (readonly [number, number])[]; sway: number; beat: number };
}

/**
 * A creature reared back on its own neck — `docs/decisions/0309-the-serpent-rears-back.md`.
 *
 * ⚠️ **ASKED FOR**: *"at the lightning phase, the serpent needs to rear back with it's head and upper
 * body, keeping the rest of it's body off screen."*
 *
 * ⚠️ **AND THE SECOND HALF OF THAT SENTENCE IS ALREADY TRUE, WHICH IS WHAT DECIDED THE FIRST.**
 * Measured on the narrowest view the clamp allows, at the far end of the bob: the head plus **five of
 * twenty-six nodes** is on the screen — about **25 world units** of a body that is 134 long, with the
 * tail at 283 against a screen 178 wide. So *keeping the rest off screen* is not a thing to arrange, it
 * is a constraint: the rear happens in the neck, because the neck is all there is to see.
 *
 * ⚠️ **A POSTURE AND A WITHDRAWAL, BECAUSE ONE ALONE IS NOT A REAR.** `stand` and `lunge` move the
 * animal back; `arch` and `span` bend what is left in front of the player. A withdrawal alone is a boss
 * that repositioned, and a bow alone is a boss doing neck exercises where it stood.
 *
 * ⚠️ **AND THE ARCH IS BOUNDED BY THE ANIMAL'S OWN SPINE, WHICH IS WHY IT IS NOT BIGGER.** 0283's bend
 * rule — no turn tighter than 1.5 of the local girth — caps a half-sine bow over `span` at about
 * `span² / 163` world units of `arch`, and the sway is already spending part of that budget. Over the
 * span the screen allows, a dramatic bow is anatomically impossible for a body eleven units thick;
 * `tests/serpent.test.ts` drives the bend through the reared phase and the decision has the numbers.
 * **What carries the read instead is the skull, which TURNS** — and that is not a field here, because a
 * head faces the way its own neck leaves it, which is arithmetic rather than a choice.
 */
export interface Rear {
  /** Extra world units of station it holds, so the whole swing moves away from the player. */
  stand: number;
  /**
   * What it scales the bob's own `rear` by — 0289's lunge. `0` stops the strike altogether.
   *
   * ⚠️ **IT IS HOW THE NEAR END MOVES WITHOUT THE FAR END LEAVING THE SCREEN.** 0101 measures a boss at
   * `station − drift − rear − radius`; the leading edge measures it at `station + drift + rear + half a
   * skull`. Standing back moves both ends, and a hull that stops lunging moves only the near one — so the
   * two together buy the player twenty units of room while the head stays where it can be seen.
   */
  lunge: number;
  /** How far across the lane the neck bows, in world units, at the crest of the bow. */
  arch: number;
  /** How far behind the skull the bow runs, in world units. Zero at the skull and zero again here. */
  span: number;
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
   * What the creature looks like in this phase instead of what its row draws, or `null` — 0305.
   *
   * ⚠️ **`null` on every phase but the serpent's last two**, and required on the terms `shot` and
   * `attack` are: a phase that keeps the row's look is a decision somebody made. A hull that fills its
   * own box has no face to change (`face` is `null` on its row), so for thirteen bosses this is `null`
   * by construction rather than by omission.
   */
  look: Look | null;
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
  /**
   * What this phase's volley SOUNDS like, or absent for `bossShot` — 0308. `Head.cue` has the argument.
   *
   * ⚠️ **A PHASE AND NOT THE ROW, BECAUSE WHAT A BOSS THROWS IS A PHASE'S** — 0248 put `shot` and
   * `attack` here for that reason, and the sound of an attack cannot live further away than the attack
   * does. A phase whose attack is `heads` does not read this: each head names its own, because the
   * round is what makes them tellable apart in the first place.
   */
  cue?: CueKind;
  /**
   * How it rears in this phase, or absent for standing as it always does — 0309.
   *
   * ⚠️ **OPTIONAL, WHERE `look`, `shot` AND `attack` BESIDE IT ARE REQUIRED WITH AN EXPLICIT `null`.**
   * That convention is right where a field is a decision every author has to make; this one is
   * `docs/decisions/0282-a-mechanism-for-every-instance-makes-them-one-instance.md`'s default shape
   * instead — *"no row can forget it" is an argument for a DEFAULT, never for a CONSTANT* — and the
   * reason is measured rather than aesthetic: adding a field to every phase line in this file would
   * re-anchor the probes of 0040, 0124, 0248, 0254, 0261 and 0304, which all `find` a whole phase line.
   * A required field whose value is `null` forty-odd times buys nothing and spends six probes.
   */
  rear?: Rear;
  /**
   * A horde that arrives DURING this phase rather than instead of a volley, or absent for a phase that
   * calls nobody — `docs/decisions/0314-the-shoal-comes-in-while-it-fights.md`.
   *
   * ⚠️ **THE ONE ITEM IN THE FISH'S BRIEF THAT NEEDED A MECHANISM THE GAME DID NOT HAVE.** Asked for:
   * *"needs to be attack while the adds are coming in."* A `summon` is an arm of `BossAttack`, so the
   * volley that calls a horde is the volley that throws nothing — the adds ARE the attack, and a phase
   * table has no way to say *as well as*. This is the way to say it: its own cadence, running beside
   * whatever the phase throws, exactly as the row's `fall` runs beside every phase (0251).
   *
   * ⚠️ **OPTIONAL, ON `rear`'s OWN ARGUMENT** — a required field here would re-anchor every probe that
   * `find`s a whole phase line, which is six of them for nothing.
   */
  escort?: Escort;
  /**
   * A leap the phase makes on a clock of its own — 0380: the boss dives out through the near edge of
   * the lane and flies its `entrance` again, unshootable and fully live, then arrives as every boss
   * does. Optional, on `escort`'s argument: only the phase that leaps says so, and a row with no
   * entrance has nothing to fly — `tests/volans.test.ts` holds that the one that carries it has one.
   */
  leap?: Leap;
  /**
   * The bitmaps the HULL wears in this phase instead of the row's, or absent for the row's —
   * `docs/decisions/0332-the-gyre-is-set-into-the-wall.md`.
   *
   * ⚠️ **ASKED FOR**: *"upscale the graphics and have it change as it gets more damaged."* A body
   * that breaks up as its health falls, which is the thing this file's opening note says a phase does
   * NOT do — and that note is about a different thing, exactly as 0305's `look` is. Three silhouettes
   * were refused as a way of saying *how much boss is left* while they cost a second art pass and
   * said nothing a rate and a spread do not; **this is the player asking for the damage itself**, and
   * 0036 has wanted the phase change to be something the picture keeps saying since 0111.
   *
   * ⚠️ **`look` BESIDE IT CANNOT CARRY THIS AND THAT IS NOT AN OVERSIGHT.** A `Look` is a `Face` and
   * an `Aura` — a jaw that moves and a fire that burns — which is what a creature with a head has.
   * A hull that fills its own box has `face: null` on its row and no jaw to wear, so what it changes
   * is the one bitmap it has. Two fields because they are two facts, per
   * `docs/decisions/0282-a-mechanism-for-every-instance-makes-them-one-instance.md`.
   *
   * ⚠️ **THE EXTENT MAY NOT CHANGE BETWEEN THEM**, which `tests/gyre.test.ts` holds: a boss that grew
   * or shrank its own box at a health threshold would hand back what four phases had taught about
   * where its edge is, at the rung the player can least afford it — 0320's own finding on the fish.
   *
   * ⚠️ **OPTIONAL, ON `rear`'s AND `escort`'s ARGUMENT** — a required field here would re-anchor every
   * probe that `find`s a whole phase line, which is six of them for nothing.
   */
  hull?: { rest: number; hit: number };
  /**
   * The pinwheel this phase opens with, or absent — `docs/decisions/0336-the-wheel-comes-off-its-post.md`.
   *
   * ⚠️ **ASKED FOR**: *"at 75%, 50%, 25% health the cog pops out and spins in a circle like the
   * fireworks on fence posts, spraying fire in a pinwheel style over 360° for a second or two."*
   *
   * ⚠️ **ON THE PHASE AND NOT ON THE ROW, WHICH IS WHAT THE ASK'S OWN NUMBERS DECIDED.** Three
   * health shares and three phase boundaries are the same three numbers or they are two ladders that
   * will drift; this row's phases were moved to 0.75, 0.5 and 0.25 so that **a wheel IS a phase
   * turning over**. What comes back after the spray is a body more broken and more alight, which is
   * the thing 0111 has wanted a phase change to say since it was written.
   *
   * ⚠️ **OPTIONAL, ON `rear`'s AND `escort`'s ARGUMENT** — a required field here would re-anchor
   * every probe that `find`s a whole phase line.
   */
  wheel?: Wheel;
}

/**
 * A pinwheel: the hull rising out of its seat, spraying a turning spoke of fire, and sinking back —
 * `docs/decisions/0336-the-wheel-comes-off-its-post.md`.
 *
 * ⚠️ **IT RISES TOWARD THE CAMERA AND NOT DOWN THE LANE.** *"A turret popping up"* is a move on the
 * axis the game does not have, and `swell` is how this one says it: the hull is drawn bigger and
 * **collides bigger by exactly the same factor**, because a body drawn a fifth larger than it hurts
 * is 0036's own defect. It costs no lane room, so nothing 0101 holds about how much screen a boss
 * leaves is spent on it — and a lunge down the lane would have spent all of it.
 *
 * ⚠️ **THE SPRAY IS A SPOKE THAT TURNS, NOT A RING THAT EXPANDS.** A ring is `BossAttack`'s own arm
 * and the jellyfish throws one; what a Catherine wheel does is emit from a point that is going round,
 * so the shots lie on a spiral and the gaps between the arms are the way through. `arms` is how many
 * spokes, `turns` how far round they go over the `spray`, and `every` how often a shot leaves each.
 *
 * ⚠️ **AND THE HULL SPINS WITH IT, WHICH COSTS THE TELL FOR A SECOND AND IS WORTH IT.** 0332's spike
 * names the edge the next wall comes in over; while the wheel runs there is no reading it, because
 * the player is not reading it — they are dodging. It swings back to the right point afterwards, which
 * gives the tell a beat of its own to arrive on.
 */
export interface Wheel {
  /** Steps it takes to rise out of the seat, spray, and sink back. */
  rise: number;
  spray: number;
  sink: number;
  /** How much bigger it is at full rise — drawn AND collided. */
  swell: number;
  /** Radians a step the hull spins while the wheel is up. */
  spin: number;
  /** How many spokes the spray leaves from. */
  arms: number;
  /** Steps between one shot leaving each spoke and the next. */
  every: number;
  /** Full turns the spokes sweep over `spray`. */
  turns: number;
  /** What it throws. */
  shot: ShotKind;
}

/**
 * The fire a hull carries once it is hurt — `docs/decisions/0336-the-wheel-comes-off-its-post.md`.
 *
 * ⚠️ **ASKED FOR**: *"updated damage graphics for it as it gets hurt and set on fire."*
 *
 * ⚠️ **IT IS THE SEAT'S OWN LAYER, WHICH 0335 SAID HELD ONE THING.** *A boss has an aura or a seat
 * and never both* was true when it was written and is the thing this changes: a cog burning in a
 * socket needs the housing AND the flames, and they are both *what is drawn behind the hull*. The
 * seat takes the first slot and the flames follow it, which is the order they are drawn in.
 *
 * ⚠️ **AND BEHIND IS WHERE FIRE ON A DISC BELONGS.** The cog is opaque and fifty-two units across, so
 * flames behind it show exactly at the rim — licking out from the edges of something burning from the
 * inside, which is what a machine on fire looks like from above.
 *
 * ⚠️ **HOW MANY OF THEM IS THE ESCALATION.** `most` stand round the hull at the end and `least` at
 * `from`, and the count runs between them as the bar falls — so the fire is something the player
 * watches take hold rather than a state that switches on.
 */
/**
 * A wreck: a hull that comes out of its wall and falls instead of exploding —
 * `docs/decisions/0337-the-gyre-falls-out-of-the-wall.md`.
 *
 * ⚠️ **ASKED FOR**: *"when it dies, instead of exploding, have it fall out of the wall and crash down
 * into the floor, and then the far right wall opens so the player can fly onwards."*
 *
 * ⚠️ **DOWN IS `across`, WHICH IS THE ONLY DOWN A TOP-DOWN GAME HAS.** The room has a floor — the
 * wall along the far edge of the lane — and the cog falls to it, accelerating and tumbling, and stops
 * where its own rim meets it. Nothing else in the game accelerates: every speed in this file is a
 * rate a row states, because a fight has to be the same fight on every machine. **A death is the one
 * place that does not matter**, and a thing falling is the one picture that needs it.
 *
 * ⚠️ **AND IT IS STILL IN THE BOSS'S POOL, WHICH IS WHY `driveBoss` HAD TO LEARN THE WORD *BEATEN*.**
 * A wreck is the hull, not a replacement for it — the same bitmap, the same size, the fire it caught
 * still burning on it.
 *
 * ⚠️ **AND SINCE 0475 IT IS A TARGET, WITH HEALTH OF ITS OWN.** 0337 made it one that nothing could
 * shoot; the player asked for the opposite — *"I want this to be killable as a first in game
 * achievement — it should take 1 bomb, 1 missile upgrade and full autofire to completely kill it."*
 * Killing it bursts it and opens the room at once, so the kill is also the quick way out.
 */
export interface Wreck {
  /** Across units per step per step it falls, once it is out of its seat. */
  gravity: number;
  /** Radians a step it tumbles as it goes. */
  tumble: number;
  /** The bitmap it wears once it has come to rest on the floor, and the same lit by a hit — 0475. */
  wreckage: number;
  wreckageHit: number;
  /** Steps it lies there before the room begins to open. */
  settle: number;
  /**
   * What it takes to kill, as a share of the boss's full health at the tier — 0475, scaled by the
   * tier's `toughness` like everything else that can be shot. The window to do it in is the fall, the
   * settle and the room opening, and `tests/gyre.test.ts` holds it at Savior, the tuned tier (0356),
   * against the loadout the player named.
   *
   * ⚠️ **THE LINE IS DRAWN AT SAVIOR AND MOVES WITH THE TIER, AND THAT WAS MEASURED.** The gun and the
   * tubes do not scale with a tier and the bomb does (0372), so no one share draws the player's line on
   * all three: at this one Legend's gun kills it alone and nothing named kills it on Burn. Sized on the
   * authored health instead, Legend's smaller bomb left it unkillable on the EASIEST tier. 0475's table
   * has both, and which the achievement wants is the player's.
   */
  health: number;
}

/** A row's wreck's health in points over the fight's `full`, and nought for a row with none — 0475. */
export function wreckHealth(row: { wreck: Wreck | null }, full: number): number {
  return row.wreck === null ? 0 : row.wreck.health * full;
}

export interface Burn {
  /** The health share at or below which it catches. */
  from: number;
  /** The bitmaps it flickers through, in order. */
  frames: readonly number[];
  /** Steps each frame is held. */
  hold: number;
  /** How many flames at `from`, and how many when the bar is empty. */
  least: number;
  most: number;
  /** How far from the hull's centre they stand, in world units. */
  radius: number;
}

/**
 * An escort: a horde a phase keeps calling while it fights — 0314.
 *
 * ⚠️ **EVERY FIELD BUT `every` IS `summon`'s, AND THAT IS DELIBERATE RATHER THAN LAZY.** *Who, how
 * many, in what shape, from where, and how many may stand* is a question about a horde and not about
 * the thing that called it, and the answer three decisions arrived at — 0249, 0262's flanking entry and
 * 0270's ceiling — is the one this wants too. `summonAdds` is one description of putting a horde on the
 * field; this is a second CALLER of it rather than a second copy.
 *
 * ⚠️ **`every` IS WHAT A SUMMONS DOES NOT HAVE**, because a summons happens on the phase's own volley
 * clock. An escort has to run on a clock of its own or it is a summons again — and a clock of its own
 * is the whole of what *while* means.
 */
/**
 * A leap — 0380: *"we need a new stage 3 and four"*, and the one thing a flying fish does that no
 * other boss can is leave the lane and come back over it. The phase's clock, not the volley's, so the
 * fight goes on throwing between leaps.
 *
 * ⚠️ **ITS OWN FLIGHT SINCE 0478, FROM THE STATION AND BACK ONTO IT.** 0380 flew the row's `entrance`
 * again: a straight dive at one speed to a point ahead of the screen, the breach, and then the ordinary
 * arrival crawling back in from beyond the leading edge — about four seconds, a second and a half of
 * it with no fish on the screen. Played: *"the jumpy animation feels a bit weird"*, which it was: two
 * other things glued together. Now an eased dive from where the fish is into the near edge, `arcs`
 * leaps out through it down the lane, and one curve back up the lane onto the place it left — on the
 * screen the whole way, and never handed to the arrival. `src/app/frame.ts`'s `driveLeap` flies it.
 */
export interface Leap {
  /**
   * Steps from the stage opening to its first leap, before the tier scales it. Shorter than `every`,
   * so a stage a capped gun ends in four seconds still leaps once — measured with `weigh-boss`: a
   * shuriken reached the fish's last stage at 11 s and ended it at 15, inside a six-second interval.
   */
  first: number;
  /** Steps between leaps after the first, before the tier scales it. */
  every: number;
  /** Steps of the dive from the station into the near edge, eased out of rest. */
  dive: number;
  /** How far past the edge each arc crests, in world units, one an arc in the order they are flown. */
  arcs: readonly number[];
  /** The along each arc covers, down the lane, in world units. */
  span: number;
  /** World units of along a step through the arcs — a thrown body's constant horizontal speed (0313). */
  speed: number;
  /** How far under the edge it runs between arcs, in world units — less than its radius, so it shows. */
  depth: number;
  /** Steps of the curve back up the lane onto the station, eased into rest. */
  back: number;
}

export interface Escort {
  /** The body it calls. */
  enemy: EnemyKind;
  /** How many each call puts on the field, before the ceiling below. */
  count: number;
  /** The shape they arrive in. */
  formation: FormationKind;
  /** Which edge they come in over — `summon`'s own axis, alternating a call — or the boss's own mouth (0373). */
  from: SummonFrom;
  /** The most of that kind the escort keeps standing, scaled by the tier — 0270's ceiling. */
  standing: number;
  /** Steps between calls, before the tier scales it. */
  every: number;
}

export interface BossRow extends Body {
  /**
   * What beating it is worth — 0428. Flat: the streak multiplies a wave and never a boss, so a fight
   * is worth the same however the level went before it. Every row authors its own, deeper is more.
   */
  points: number;
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
   *
   * ⚠️ **AND EVERY ONE WAS MULTIPLIED BY 1.2 — `docs/decisions/0364-the-view-zooms-out.md` — SO THE
   * SAME MISTAKE WAS NOT MADE TWICE.** The zoom took the narrowest view from 177.8 to 213.3; left
   * where they were, the stations would have slid towards the player on the glass exactly as they did
   * after 0080, and the sentinel's near end fell to 53% of the screen on the first run. Scaled, each
   * boss sits where it sat on the screen, and its fire has a fifth further to come.
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
   * How far the hull leans into its slide across the lane, in radians at full patrol speed, or absent
   * for a hull that faces down the lane whatever it does — `docs/decisions/0483-the-pterodactyl-flies.md`.
   *
   * ⚠️ **THE NOSE POINTS WHERE IT IS GOING**: the lean is the velocity's share of the phase's top
   * speed, so it eases with the move and is level at a brace. Whatever is laid off the hull's turn —
   * its wings, its fire, its muzzles — leans with it.
   */
  bank?: number;
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
  /** The cold its hull carries, or `null` — 0253. Required, on `uncoil`'s and `fall`'s terms. */
  chill: Chill | null;
  /**
   * Where its shots leave the hull, in world units from the hull's centre — `null` is the centre.
   *
   * ⚠️ **REPORTED FROM PLAY: *"the acid blasts and voids currently originate from the back half of
   * the body."*** They did, and for every boss: every arm of `throwAttack` spawned at
   * `(boss.along, boss.across)`. On a hull that fills its own box that is close enough to a muzzle
   * to pass; on a serpent, whose skull is at the far down-lane end of the widest sprite in the game,
   * it is twenty-seven units behind the mouth and reads as the body coughing.
   *
   * ⚠️ **`null` IS AN ANSWER RATHER THAN A PLACEHOLDER**, and it was on thirteen rows that had a face
   * until 0452. A gyre throws from its own axis, a ring of eyes from its pupil and a frost ship from its
   * heart; the centre is where those shots belong. A hull with its mouth, its eye or its prongs at one
   * end says where — `docs/decisions/0452-a-boss-fires-from-its-guns.md`: *"do a full pass and make
   * sure that bullets and attacks fire from the right place."* The serpent's own `null` was the one that
   * said its centre was its mouth, and the picture had the acid leaving its cheek.
   *
   * ⚠️ **A POINT IN THE SPRITE'S FRAME, TURNED WITH THE HULL — 0452.** Every hull is baked facing
   * down-lane, so unturned a point in the sprite's frame is a point in the world's; but a hull has
   * carried a turn since 0306 (the serpent rears, an entrance banks, the fish swims up the lane), and
   * a muzzle that stayed put while the head turned would leave the face it belongs to.
   * `muzzleAlongOf` in `src/app/boss.ts` turns it.
   */
  muzzle: { along: number; across: number } | null;
  /**
   * The body it drags behind its head, or `null` — 0283. Required, on `uncoil`'s and `fall`'s terms.
   *
   * ⚠️ **`null` on thirteen of the fourteen.** A boss with one is a creature whose hull is a ribbon;
   * everything else in the game is a hull that fills its own box, and giving those a chain would be
   * the mistake 0282 is named for.
   */
  chain: Chain | null;
  /** The faces its head wears, or `null` — 0285. Required, on `chain`s own terms. */
  face: Face | null;
  /**
   * How it comes onto the field before the fight begins, or `null` for the arrival every boss has —
   * `docs/decisions/0306-the-serpent-coils-in.md`. Required, on `uncoil`'s terms.
   */
  entrance: Entrance | null;
  /**
   * The tail it beats behind its hull, or `null` for a hull that is one drawing —
   * `docs/decisions/0374-the-fish-beats-its-tail.md`. Required, on `entrance`'s terms.
   */
  tail: Tail | null;
  /**
   * Its tentacles — 0403. Absent for a boss with none, on `necks`' terms below: only the animal that
   * has them says so.
   */
  tendrils?: Tendrils;
  /**
   * The necks it grows, a head on each — `docs/decisions/0384-the-hydra-stands-in-the-acid.md`.
   * Absent for a boss with one head or none, which is fourteen of them.
   *
   * ⚠️ **OPTIONAL, ON 0282's DEFAULT TERMS**, as `hull` and `leap` on a phase are: only the animal that
   * grows heads says so, and a required `null` on fourteen rows is a field for its own sake.
   */
  necks?: Necks;
  /**
   * The room this fight happens in, or `null` for a fight the level scrolls straight through —
   * `docs/decisions/0335-the-fight-happens-in-a-room.md`.
   *
   * ⚠️ **ASKED FOR**: *"I want the cog to be part of the wall and stationary on arrival, and the
   * background map to have walls on the top, bottom and right side to represent labyrinth walls, and
   * the background map to stop moving — you've found the boss and are fighting it in a specific
   * room."*
   *
   * ⚠️ **THE CAMERA COMES TO REST, WHICH IS THE WHOLE MECHANISM AND THE REST IS PICTURE.** Everything
   * in this game holds station in the camera's frame (0034), so a camera that stops is a world that
   * stops: the sky stops, the landmarks stop, the hull that was tracking `camera + station` stops
   * with them, and the ship goes on flying its box because its box is the camera's too. Nothing has
   * to be told to stand still.
   *
   * ⚠️ **AND NOTHING THAT KEEPS TIME IS THE CAMERA.** `w.steps` is the sim's own clock and
   * `src/app/frame.ts` says in as many words that the camera *is a distance that equals a time, not a
   * time* — the gun's phase, the music's beat and the fight's own rungs are all on `steps`, and
   * `musicLevelFor` answers `boss` off the hull being on the field rather than off any distance. That
   * was the risk in this and it was checked before a line was written.
   *
   * ⚠️ **REQUIRED, ON `uncoil`'s TERMS**: a boss the level scrolls past is a decision somebody made.
   */
  room: Room | null;
  /**
   * The fire it catches as it is hurt, or `null` — 0336. Required, on `uncoil`'s and `room`'s terms.
   */
  burn: Burn | null;
  /**
   * What it does instead of exploding, or `null` for the burst every other boss dies in — 0337.
   * Required, on `uncoil`'s and `room`'s terms.
   */
  wreck: Wreck | null;
  /**
   * The fragment it sheds when a hit lands, or `null` for none — 0480.
   *
   * ⚠️ **ASKED FOR, THREE TIMES IN ONE PLAY**: *"no damage shows on the boss."* The flash says a hit
   * landed and the bar says how much is left; nothing between them said *this animal is hurt*. A
   * fragment of what it is made of is thrown from where the ship's fire meets it each time a hit arms
   * the flash, so under any gun it sheds as often as it flashes and no more.
   *
   * ⚠️ **REQUIRED, AND EVERY ROW SAYS ITS OWN** —
   * `docs/decisions/0282-a-mechanism-for-every-instance-makes-them-one-instance.md`: shared code holds
   * the throw, and the default is nothing. The seven real bosses each shed what they are; the mid-bosses
   * shed nothing until someone draws what they would.
   *
   * ⚠️ **AND WHERE IT LEAVES FROM IS THE ROW'S TOO — 0514.** `from` is `ShedFrom`'s.
   */
  shed: { sprite: number; from: ShedFrom } | null;
  /**
   * What a gun's hit on THIS boss is worth, where it is not the gun's own `bossWeight` — 0372.
   *
   * ⚠️ **OPTIONAL, ON 0282's DEFAULT SHAPE.** The gun's row says what it is worth on a boss and
   * `gunWeightOn` falls back to it; a boss authors an entry only where the gun's answer is wrong for
   * this animal. The serpent is the first: the lightning was already its quickest gun, and at the
   * arc's 1.5 a player carrying tier three to it killed it in 24 s, under its floor.
   */
  gunWeights?: Partial<Record<WeaponKind, number>>;
  /** Full health to empty. The first entry must cover a full-health boss. */
  phases: readonly BossPhase[];
}

/** What `gun` is worth on `boss`: the boss's own entry, or the gun's row — 0372. */
export function gunWeightOn(boss: BossRow, gun: WeaponKind): number {
  return boss.gunWeights?.[gun] ?? WEAPONS[gun].bossWeight;
}

/**
 * How far down the lane, toward the ship, the animal reaches from its centre — 0476: its radius, or
 * its tentacles where they hang further. What the aura's gap is measured to (0092): the boss is heard
 * from the nearest part of it.
 *
 * ⚠️ **ONLY THE JELLYFISH'S ANSWER MOVES.** It went back from 152 to 190 so nothing could fly behind
 * it, and measured to the bell alone its aura at the back of the box fell to 0.04 of its ceiling —
 * under the tenth `tests/music.test.ts` holds as *attenuated, not muted*. Its tentacles hang forty units
 * toward the ship; measured to them it is 0.14. Every other row has no tendrils, so its gap is its hull.
 */
export function reachDownLane(boss: BossRow): number {
  // `reach` is an along offset, and down the lane toward the ship is negative.
  return boss.tendrils === undefined ? boss.radius : Math.max(boss.radius, -boss.tendrils.reach);
}

/**
 * A room: the place a fight happens, and the camera stopping in it — 0335.
 *
 * ── THE CAMERA COMES TO REST AT AN AUTHORED DISTANCE, AND THE HULL FOLLOWS IT ────────────────────
 *
 * ⚠️ **`stand` IS WHERE THE CAMERA STOPS, MEASURED BACK FROM THE FIGHT'S OWN DISTANCE.** The level
 * places the fight at a camera distance (`bossAt`, or the mid-boss's `at`); this says how far short
 * of it the camera comes to rest. Everything else falls out: the hull is pulled to `camera +
 * station` and the camera has stopped, so the hull stops; the ship's box is measured from the camera,
 * so the room is exactly the box the player can fly in.
 *
 * ⚠️ **AND IT DECELERATES OVER `settle` RATHER THAN STOPPING DEAD** —
 * `docs/decisions/0215-a-transition-is-a-shape-not-an-instant.md`, which is about a mix and is the
 * same claim about a camera: the biggest arrival in the game landing as a step is the defect that
 * decision is named for. A half-cosine over `settle` world units is the shape, and it runs the other
 * way when the fight ends, so the room is something the player leaves rather than something that is
 * taken away.
 *
 * ⚠️ **THE WALLS ARE A PLACE AND NOT AN OVERLAY.** They stand at world positions and arrive by
 * scrolling in, like everything else the level places — so there is no moment at which a wall appears
 * on a screen it was not already approaching. `mouth` is how far behind the resting camera the room's
 * open side is; the far wall is the forward edge of the player's own box, which is why the ship
 * cannot reach it.
 */
/**
 * A piece of scenery laid in a room — `docs/decisions/0488-the-roots-are-roots.md`, where it was first the
 * world tree's roots, and any room's since: the heart's chamber is one (0489). Scenery: it
 * collides with nothing (0335's walls are the picture of a bound the ship already has), and it is drawn
 * under every body (0459: nothing the player has to see is behind scenery).
 */
export interface RoomPiece {
  /** The piece's drawing. */
  sprite: number;
  /** Where its centre stands, in world units from the resting camera's trailing edge, and across the lane. */
  along: number;
  across: number;
  /** How it is turned, in radians. */
  turn: number;
  /** Whether it is the far wall, which withdraws off the screen once the fight is over (0337). */
  far: boolean;
  /**
   * Whether it stands only for the boss's arrival — the knot a serpent coils in round — and sinks into the
   * dark once the fight begins, because a root in the open lane for the whole fight is a thing that looks
   * solid and is not (0036).
   */
  entrance: boolean;
}

export interface Room {
  /** World units short of the fight's own distance the camera comes to rest. */
  stand: number;
  /**
   * Steps the deceleration into that rest takes, and the acceleration out of it.
   *
   * ⚠️ **STEPS AND NOT WORLD UNITS, WHICH A DRIVE HAD TO SAY.** A ramp written against the distance
   * REMAINING is a first-order approach: the rate goes to zero as the gap does and the camera
   * converges without ever landing. Measured, it crept at three ten-thousandths of a unit a step and
   * never arrived — and `scripts/weigh-bullets.mjs`, which walks a level until the camera reaches the
   * fight, stood still for its whole six-minute cap. A ramp over steps ends.
   */
  settle: number;
  /**
   * How far behind the resting camera the room's open side sits, in world units.
   *
   * ⚠️ **NEGATIVE IS IN FRONT OF IT — 0459**: the side walls then start part of the way across the
   * screen at rest, so they frame its far side and not the whole of it. The serpent's roots are.
   */
  mouth: number;
  /**
   * The bitmap the walls are tiled from, or `null` for a room with none — 0400.
   *
   * ⚠️ **ASKED FOR**: *"the boss fight needs to be similar to the labyrinth in that it's a stationary
   * screen, no walls."* What makes a room is the camera coming to rest; the walls are what made the
   * Labyrinth's one a labyrinth, and the Black Heart is not one. A room with no walls lays nothing for
   * the painter (`w.room` stays `null`) and has nothing to part, so it states `opens: 0`.
   */
  wall: number | null;
  /**
   * Or the pieces it is framed by, placed rather than tiled — 0488. Absent, the room is its `wall` alone.
   */
  pieces?: readonly RoomPiece[];
  /**
   * Steps the far wall takes to part once the fight is over — 0337.
   *
   * ⚠️ **ASKED FOR**: *"and then the far right wall opens so the player can fly onwards."* It parts
   * from the middle outward, and the camera comes back up on the same number — so the room lets go
   * of the player and the level starts moving in one gesture rather than two.
   *
   * ⚠️ **WITH NO WRECK IT PARTS ON THE DEATH ITSELF — 0459**, because nothing has to land first and the
   * camera comes back up on that step: a far wall that stayed shut would scroll into the ship.
   */
  opens: number;
}

/**
 * Every shape an entrance can be. Closed — `docs/decisions/0016-a-hub-enumerates-kinds.md`.
 *
 * ⚠️ **ONE KIND UNTIL 0313, AND THE SECOND ONE IS WHY THIS IS A UNION AND NOT A PARAMETER.**
 * `docs/decisions/0313-the-fish-breaches.md`: *"Don't make the serpent boss a hard rule, the pattern
 * is what we want, the style is what makes the different bosses unique."* A coil with enough knobs on
 * it to also be a leap is the shape
 * `docs/decisions/0282-a-mechanism-for-every-instance-makes-them-one-instance.md` is named for — the
 * tell is a mechanism whose output is the same picture for every kind. A snake coils and a fish leaps,
 * and those are two paths rather than two settings of one.
 */
export const ENTRANCE_KINDS = ['coil', 'breach'] as const;

/** Derived from the list, so an entrance cannot exist in the union and be missing from the switch. */
export type EntranceKind = (typeof ENTRANCE_KINDS)[number];

/**
 * An entrance: a flight the boss makes onto the field before it arrives as every boss does — 0306,
 * and a second kind since 0313.
 *
 * ⚠️ **ASKED FOR**: *"can we make it fly onto screen, do a coil, fly off and then enter where it is
 * now?"* — and, asked whether it is part of the fight: *"Not-shootable, fully live - there's needs to
 * be a gap in the center of the screen. Players can learn the pattern to avoid the damage from being
 * hit by it and there's a music tone to alert of it's arrival."* Asked again for the fish, in one
 * line: *"needs a flashy entrance."*
 *
 * ⚠️ **A PATH IN THE CAMERA'S FRAME, AND THE WHOLE ANIMAL FLIES IT** — whichever kind it is. Every
 * node of a body is where the head was a body-length ago, so the animal follows its own path rather
 * than swinging round a pivot: the one time in the fight its body FOLLOWS the head, because the one
 * time the head travels (`src/app/frame.ts`'s `layChain` has why it is placed the rest of the fight).
 *
 * ⚠️ **UNTOUCHABLE BY THE PLAYER'S FIRE AND HURTING ON CONTACT** — the frame's, not the row's: it is
 * what an entrance IS, and a row that wanted otherwise would be a different decision.
 *
 * ⚠️ **AND EVERY KIND OWES THE PLAYER A PLACE TO BE**, which is *"players can learn the pattern to
 * avoid the damage"* and is held per boss, off the flight, in world units the lane is measured in
 * (0027) — the coil's is the hole in its middle, and the breach's is the far side of the lane.
 */
export type Entrance =
  /**
   * A coil — 0306. In from the spawn point along the coil's top edge, round it the way a hand turns
   * from the top toward the player — trailing side, bottom, leading side — `turns` times, and
   * straight on along the tangent it leaves by until the tail is off the screen.
   *
   * ⚠️ **THE CENTRE IS LEFT OPEN, AND THAT IS THE ASK RATHER THAN A SIDE-EFFECT.** A coil round the
   * middle of the screen with a hole in it is a pattern a player learns to sit inside; `radius` less
   * the thickest girth is how wide that hole is, and `tests/serpent.test.ts` measures it off the flight.
   */
  | {
      kind: 'coil';
      /** The coil's centre: world units ahead of the camera's trailing edge, and across the lane. */
      centre: { along: number; across: number };
      /** The coil's radius to the spine, in world units. Its tightest bend, so at least 1.5 girths. */
      radius: number;
      /** How many times round it goes before it peels away. */
      turns: number;
      /** World units of path a step. */
      speed: number;
    }
  /**
   * A breach — 0313: the flying fish coming up through the near edge of the lane, skipping across the
   * screen in `leaps` arcs that each go higher than the last, and going back down through it.
   *
   * ⚠️ **EACH LEAP IS A BALLISTIC ARC AND `speed` IS ITS ALONG SPEED, NOT ITS PATH SPEED.** The
   * parabola through the edge, the crest and the edge again over one `span` of along — which is what a
   * thrown body's path IS when its horizontal speed is constant. What that buys is the thing that
   * makes a leap read as one: fastest where it leaves and re-enters, slowest at the top. A sine
   * leaves the edge with no across speed at all, so the animal slides out instead of bursting out.
   *
   * ⚠️ **THE FAR SIDE OF THE LANE IS THE PLACE TO BE, AND `height` × `rise` IS WHAT SETS IT.** The
   * tallest crest is the last one, and the band between it and the far edge is the one stretch of the
   * lane the hull never reaches. `tests/volans.test.ts` measures it off the flight and parks a live
   * ship in it, exactly as the coil's hole is measured.
   *
   * ⚠️ **THERE IS NO SURFACE DRAWN IN THIS PLACE, AND THAT WAS CHECKED.** `src/content/themes.ts` says
   * `ground: null` for the nebula — *"In space, and the Pillars are the proof."* So `surface` is the
   * edge of the lane and nothing more; what says the fish went THROUGH something is the spray of
   * embers at the crossing, which is 0251's own picture at the other edge.
   */
  | {
      kind: 'breach';
      /** The across it breaks through, in world units: the lane's near edge. */
      surface: number;
      /** Where the first leap starts, in world units ahead of the camera's trailing edge. */
      from: number;
      /** How many times it comes out. */
      leaps: number;
      /** The along one leap covers, in world units. */
      span: number;
      /** How far past `surface` the FIRST leap crests, in world units. */
      height: number;
      /** What each leap multiplies the last one's crest by. */
      rise: number;
      /** World units of ALONG a step — see above. */
      speed: number;
    };

/**
 * How far up-lane a chain's tail reaches from its head, in world units.
 *
 * ⚠️ **ONE DESCRIPTION, BECAUSE THREE THINGS NEED IT AND THEY MUST NOT DISAGREE.** `src/app/frame.ts`
 * lays the nodes out with it, `tests/level.test.ts` asks whether the whole animal is on the narrowest
 * screen with it, and the row's own comment quotes it. `src/content/sprites.ts` records what three
 * hand-kept descriptions of one fact cost the last time.
 */
export function chainReach(chain: Chain): number {
  let along = chain.neck;
  for (let i = 0; i + 1 < chain.girth.length; i++) along += chain.step * (chain.girth[i]! + chain.girth[i + 1]!) * 0.5;
  return along;
}

/**
 * The fish's own faces, worn on its own body — 0319, and named here because 0320 needs them twice.
 *
 * ⚠️ **THE ROW POINTS AT THIS AND SO DOES THE FIRST STAGE OF THE MORPH**, which is the whole economy
 * of `Look`: a phase that changes only what burns AROUND the animal names the animal's own face and
 * spends nothing. Written out twice instead, the two would drift the first time a mouth moved.
 */
const VOLANS_FACE: Face = {
  rest: SPRITE.boss9,
  restHit: SPRITE.boss9Hit,
  up: SPRITE.boss9Up,
  down: SPRITE.boss9Down,
  gape: SPRITE.boss9Gape,
  gapeHit: SPRITE.boss9GapeHit,
  shut: SPRITE.boss9Shut,
  shutHit: SPRITE.boss9ShutHit,
  // A stalker crosses its own centreline constantly: a wider band and a rest between snaps — 0478.
  look: 12,
  biteRest: 45,
};

/**
 * Eight frames of the fish's own fire — 0320, wound round it as ribbons since
 * `docs/decisions/0395-the-fish-wears-its-fire.md`. Its inks are the nebula's, not the serpent's violet.
 */
const EMBER: readonly number[] = [
  SPRITE.volansEmber0,
  SPRITE.volansEmber1,
  SPRITE.volansEmber2,
  SPRITE.volansEmber3,
  SPRITE.volansEmber4,
  SPRITE.volansEmber5,
  SPRITE.volansEmber6,
  SPRITE.volansEmber7,
];

/**
 * ── THE FISH KINDLES — 0320 ────────────────────────────────────────────────────────────────────
 *
 * Asked: *"We need the boss to change/morph between phases."*
 * [0305](../../docs/decisions/0305-the-serpent-darkens.md) answered that for the serpent with grown
 * horns and a dark aura. This is the same sentence answered in the fish's own terms — it is a
 * creature of the Ember Nebula, and what escalation looks like on it is **fire**.
 *
 * ⚠️ **TWO STAGES, AND THE FIRST ONE IS FREE.** `KINDLED` is the row's own face with an aura behind
 * it: no new drawing of the animal at all. `ABLAZE` is the one that costs, and it costs once.
 *
 * ⚠️ **`stride` IS 1 AND MEANS NOTHING HERE, WHICH IS NOT A DEFECT.** It is how far the flicker walks
 * from one node of a chain to the next, and the fish has no chain — `layAura` gives a chainless boss
 * exactly one flame. A field that does nothing on one instance is what a shared type looks like when
 * [0282](../../docs/decisions/0282-a-mechanism-for-every-instance-makes-them-one-instance.md) is
 * being followed; the alternative is two `Aura` types that drift.
 */
/** The fish's tail, and the one its grown body wears — 0374. Pivoted on the peduncle by the painter. */
const VOLANS_TAIL: TailArt = { sprite: SPRITE.volansTail, spriteHit: SPRITE.volansTailHit };
const VOLANS_TAIL_BARBED: TailArt = { sprite: SPRITE.volansTailBarbed, spriteHit: SPRITE.volansTailBarbedHit };

/** The same eight frames white-hot — 0380: the ember's painter in its core inks, for the last stage. */
const BLAZE: readonly number[] = [
  SPRITE.volansBlaze0,
  SPRITE.volansBlaze1,
  SPRITE.volansBlaze2,
  SPRITE.volansBlaze3,
  SPRITE.volansBlaze4,
  SPRITE.volansBlaze5,
  SPRITE.volansBlaze6,
  SPRITE.volansBlaze7,
];

const KINDLED: Look = {
  face: VOLANS_FACE,
  // A frame every four steps: slower than the serpent's three, because one flame flickering alone
  // reads as a lamp with a loose bulb where twenty-seven read as weather. The crown's girth grew
  // with the hull in 0381 (42 → 50 across), in the same proportion.
  // ⚠️ **THE SAME GIRTH AS *ABLAZE* SINCE 0395**: the ribbons are drawn round the animal at one size,
  // so a smaller crown would sink them under the flesh. What the first stage keeps is the slower beat.
  aura: { frames: EMBER, hold: 4, stride: 1, head: VOLANS_FIRE_HEAD.ember },
};

/** The grown body's eight faces — 0320: fins risen, worn from the second stage on. */
const BARBED_FACE: Face = {
  rest: SPRITE.boss9Barbed,
  restHit: SPRITE.boss9BarbedHit,
  up: SPRITE.boss9BarbedUp,
  down: SPRITE.boss9BarbedDown,
  gape: SPRITE.boss9BarbedGape,
  gapeHit: SPRITE.boss9BarbedGapeHit,
  shut: SPRITE.boss9BarbedShut,
  shutHit: SPRITE.boss9BarbedShutHit,
  look: 12,
  biteRest: 45,
};

const ABLAZE: Look = {
  face: BARBED_FACE,
  // Bigger and quicker, and the same six frames: what changed is the row's numbers, which is where a
  // difference between two instances of one mechanism belongs.
  aura: { frames: EMBER, hold: 3, stride: 1, head: VOLANS_FIRE_HEAD.ember },
  // And the tail lobes drawn out with the fins — 0374: the grown body's own caudal fin, on the same root.
  tail: VOLANS_TAIL_BARBED,
};

/**
 * White-hot — 0380: the fourth stage. The grown body and its tail, the same flame in the ember's core
 * inks, the crown bigger again and the flicker at two steps a frame. One fire at a higher temperature,
 * which is what a stage after *ablaze* has left to be, and it costs six bakes and no drawing of the
 * animal.
 */
const BLAZING: Look = {
  face: BARBED_FACE,
  aura: { frames: BLAZE, hold: 2, stride: 1, head: VOLANS_FIRE_HEAD.blaze },
  tail: VOLANS_TAIL_BARBED,
};

/*
  ── THE PTERODACTYL'S BODY, FACES AND WINGS — `docs/decisions/0398-the-pterodactyl-is-feathered.md` ──

  ⚠️ **ONE FACE A STAGE, AND WHAT DIFFERS IS THE TELL.** `wearFace` puts on `gape` before a volley and
  while a laser is on the hull: so the stage that fires the shoulder cannons gapes with the cannons lit,
  the stage that fires the mouth opens its beak on the throat cannon, and the last does both. The first
  stage throws quills off its wings and its tell is the wings' own beat, so its `gape` is its rest —
  a beak that opened for a volley that did not come out of it would be the lie 0319's guard refuses.
*/
const QUETZAL_REST = { rest: SPRITE.boss10, restHit: SPRITE.boss10Hit, up: SPRITE.boss10Up, down: SPRITE.boss10Down, shut: SPRITE.boss10, shutHit: SPRITE.boss10Hit } as const;
const QUETZAL_FACE: Face = { ...QUETZAL_REST, gape: SPRITE.boss10, gapeHit: SPRITE.boss10Hit };
const QUETZAL_SHOULDERS: Face = { ...QUETZAL_REST, gape: SPRITE.boss10Charged, gapeHit: SPRITE.boss10ChargedHit };
const QUETZAL_MOUTH: Face = { ...QUETZAL_REST, gape: SPRITE.boss10Gape, gapeHit: SPRITE.boss10GapeHit };
const QUETZAL_EVERYTHING: Face = { ...QUETZAL_REST, gape: SPRITE.boss10GapeCharged, gapeHit: SPRITE.boss10GapeChargedHit };

/** Eight frames of a wingbeat, and the same eight lit by a hit — 0398. */
const QUETZAL_WINGS: readonly number[] = [
  SPRITE.quetzalWing0,
  SPRITE.quetzalWing1,
  SPRITE.quetzalWing2,
  SPRITE.quetzalWing3,
  SPRITE.quetzalWing4,
  SPRITE.quetzalWing5,
  SPRITE.quetzalWing6,
  SPRITE.quetzalWing7,
  SPRITE.quetzalWing8,
  SPRITE.quetzalWing9,
  SPRITE.quetzalWing10,
  SPRITE.quetzalWing11,
];
const QUETZAL_WINGS_HIT: readonly number[] = [
  SPRITE.quetzalWing0Hit,
  SPRITE.quetzalWing1Hit,
  SPRITE.quetzalWing2Hit,
  SPRITE.quetzalWing3Hit,
  SPRITE.quetzalWing4Hit,
  SPRITE.quetzalWing5Hit,
  SPRITE.quetzalWing6Hit,
  SPRITE.quetzalWing7Hit,
  SPRITE.quetzalWing8Hit,
  SPRITE.quetzalWing9Hit,
  SPRITE.quetzalWing10Hit,
  SPRITE.quetzalWing11Hit,
];

/** The wings beating at `hold` steps a frame — quicker each stage, which is the animal working harder. */
// Half as fast again on the climb and half as fast on the dive — 0483: the bird works up and glides down.
// And the body a unit and a half up on every downstroke — 0485.
const beating = (hold: number): Aura => ({ frames: QUETZAL_WINGS, hurt: QUETZAL_WINGS_HIT, hold, stride: 1, head: QUETZAL_WING_HEAD, climb: 0.5, heave: { by: 1.5, down: QUETZAL_DOWNSTROKE } });

/**
 * Where the shoulder cannons' muzzles are, across the lane from the hull's centre — 0398:
 * `QUETZAL_CANNON` in `src/render/bake.ts`, 0.6 of the 44-unit drawing's radius. The row's wing beams
 * leave from here; `tests/quetzal.test.ts` holds the two numbers together.
 */
const SHOULDER = 11;

/**
 * And how far down the lane of the hull's centre those muzzles are — 0452: the barrels' square ends,
 * 0.4 of the drawing's radius forward. Before it the beams left level with the centre, seven units
 * behind the barrels they were drawn coming out of.
 */
const SHOULDER_AHEAD = -7.4;

/**
 * Where the throat cannon is, down the lane of the hull's centre — 0452: `QUETZAL_THROAT`, the bore the
 * beak opens on, 0.54 of the drawing's radius forward. The mouth's beam leaves it and runs out between
 * the open beak.
 */
const THROAT_AHEAD = -10;

/** The three roots a beam can leave, `[along, across]` from the hull's centre — 0452. */
const LEFT_CANNON = [SHOULDER_AHEAD, -SHOULDER] as const;
const RIGHT_CANNON = [SHOULDER_AHEAD, SHOULDER] as const;
const THROAT = [THROAT_AHEAD, 0] as const;

/*
  ⚠️ **THE PTERODACTYLS' ZIGZAGS, ONE SHAPE A COUNT — `docs/decisions/0453-the-laser-fans-out.md`.**
  *"Wider peaks and lows so that they spread out more."* Twelve knots was a leg every dozen units down a
  beam of a hundred and fifty, so even an eighteen-unit swing read as a straight beam with a fringe on
  it; five or six knots is a leg the length of a ship's reaction, and every swing is deeper.
*/

/**
 * One beam — *"centralised path over all, but the jagged high and low bits should spread out longer so
 * it's harder to dodge."* The throat's: no lean, deep and the same either side, on five long legs.
 */
const QUETZAL_ONE: BeamJag = { knots: 5, paths: [{ lean: 0, outward: 30, inward: 30 }] };

/**
 * Two beams — *"the center of the two attacks shouldn't touch, but the outside jagged path should be
 * longer to cover more screen."* Each swings deep on its own side and barely inward: eleven out, a
 * half-width of 1.5 and an inward swing of six leaves the centre line three and a half clear of either,
 * which is a ship's hurtbox and more (`tests/quetzal.test.ts` holds it).
 */
const QUETZAL_PAIR: BeamJag = {
  knots: 6,
  paths: [
    { lean: 0, outward: 24, inward: 6 },
    { lean: 0, outward: 24, inward: 6 },
  ],
};

/**
 * Three beams — *"a fan pattern where the center attack behaves like now, the two outside attacks are
 * angled a bit more diagonally outwards and have a jagged path like when there's only two."* The centre
 * is the swing of seven it had, on the new legs; the shoulders are the pair's path, leaning out.
 */
const QUETZAL_FAN: BeamJag = {
  knots: 6,
  paths: [
    { lean: 30, outward: 24, inward: 6 },
    { lean: 0, outward: 7, inward: 7 },
    { lean: 30, outward: 24, inward: 6 },
  ],
};

/** The hydra's pterodactyl head fires one beam, so it is the one-beam shape, on its narrower beam. */
const HYDRA_LANCE: BeamJag = { knots: 5, paths: [{ lean: 0, outward: 24, inward: 24 }] };

/** Where a quill leaves each wing, `[along, across]` — 0398: at the wrist, the wing's leading edge. */
const WINGS: readonly (readonly [number, number])[] = [
  [-3, -20],
  [-3, 20],
];

/**
 * Where the jellyfish's tentacles hang at rest, across the lane from its centre — 0403: fanned wider
 * than the bell, because a laser leaves each tip and the room between two neighbours is the room the
 * player has. Eleven was tried first, and photographed, the beams' glow closed most of each gap on the
 * screen even where the hurtbox left it open. ⚠️ *Thirteen apart less two half-widths is nine lane units
 * at every point* was said here until 0453 measured it to the nearest leg: across the lane, yes; beside a
 * steep leg, less than a ship. `MEDUSA_FAN` below is what keeps the room now.
 */
const MEDUSA_TIPS = [-26, -13, 0, 13, 26] as const;

/** How far down the lane from its centre the tips hang, and where the roots leave the bell's rim. */
const MEDUSA_REACH = 40;
const MEDUSA_RIM = -10.8;

/**
 * Where its lasers leave, one a tip, `[along, across]` from its centre — 0452: the tips' own reach down
 * the lane, which `beamRootOf` added to every beam of a row with tentacles until a beam's root could
 * say its own along.
 */
const MEDUSA_LASERS = MEDUSA_TIPS.map((tip) => [-MEDUSA_REACH, tip] as const);

/**
 * Five beams — 0453: *"a fan pattern where the inner two are angled but more contained path and the
 * other two have a more deeper jagged penetration on the outside."* The middle tip keeps the swing it
 * had; the inner two lean out and swing modestly; the outer two lean further and swing deep outside.
 *
 * ⚠️ **NO BEAM SWINGS IN FURTHER THAN THE ONE INSIDE IT SWINGS OUT ON THE SAME KNOT, OR THE GAP CLOSES.**
 * The volley is one seed (`together`, 0403 — *"so that there's a safe gap"*), so neighbours turn on the
 * same knots to the same side; across the lane the room between them is their spacing, plus how much
 * further apart their leans have got, plus the difference in their swings on that side — which never
 * goes below the spacing while each inward swing is no deeper than its inner neighbour's swing towards
 * it. `tests/quetzal.test.ts` measures the gap a ship has, at its own along, beam by beam.
 */
const MEDUSA_FAN: BeamJag = {
  knots: 5,
  paths: [
    { lean: 32, outward: 22, inward: 4 },
    { lean: 14, outward: 12, inward: 5 },
    { lean: 0, outward: 7, inward: 7 },
    { lean: 14, outward: 12, inward: 5 },
    { lean: 32, outward: 22, inward: 4 },
  ],
};

/** The later, longer volley: the same fan, every swing and lean a little wider, as its 9 was to its 7. */
const MEDUSA_WIDE_FAN: BeamJag = {
  knots: 5,
  paths: [
    { lean: 36, outward: 26, inward: 4 },
    { lean: 16, outward: 14, inward: 6 },
    { lean: 0, outward: 9, inward: 9 },
    { lean: 16, outward: 14, inward: 6 },
    { lean: 36, outward: 26, inward: 4 },
  ],
};

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
    points: 5000,
    move: { kind: 'patrol' },
    // A spray since 0258 — *"minibosses need to be on their own pattern path and not actively
    // matching the player or aiming at the player."* One shot straight down the lane, then the fan.
    attack: { kind: 'spray' },
    uncoil: null,
    fall: null,
    chill: null,
    // The tip of its prow — 0452: a hull with no gun drawn fires from its nose, as the fighter does
    // (0448). From the centre the fan was drawn coming out through the cockpit.
    muzzle: { along: -10.9, across: 0 },
    chain: null,
    face: null,
    entrance: null,
    tail: null,
    room: null,
    burn: null,
    wreck: null,
    shed: null,
    sprite: SPRITE.boss,
    spriteHit: SPRITE.bossHit,
    radius: 11,
    // A mid-boss since 0247, which halved 480 to 240; solved to its level's seconds by
    // `scripts/solve-mid-health.mjs` against `MID_BOSS_SECONDS` since 0269.
    // 42 from 83 — re-solved after 0364's zoom put it a fifth further off (`scripts/solve-mid-health.mjs`,
    // which overshoots both ways here, so the last step is read between its two passes).
    // 120 from 42 — 0406: solved at the loadout the run carries in (`carriedAt`), two weapon rungs here.
    // 211 from 120 — 0441: every ship opens on its whole gun, so the fighter's pulse met it at the cap
    // and fought it for 10 s against the level's 17; re-solved by the same script.
    // 262 from 211 — 0452: main already fought it for 14.3 s, and the volley leaving its prow took
    // 0.6 s more off, past the guard's three; re-solved by the same script, the other six left in band.
    // 153 from 262 — 0472: solved at the tuned tier, where 262 fought for 26 s; two passes.
    // 174 from 153 — 0503: the level closed up by a tenth and 153 fought for 15.4 s against 17; the
    // solver's 169 read 16.5, and its second pass, 174, reads 17.0.
    health: 174,
    damage: 3,
    // Far enough forward that the whole hull is on screen on the narrowest view the clamp allows,
    // and far enough back that the player is not fighting it at the very edge of their reach.
    station: 166,
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
        ── THREE PHASES ON THE SERPENT'S TEMPO — 0269 ─────────────────────────────────────────────

        ⚠️ **Every mid-boss is three phases now**, and the pacing — `fireEvery` and `patrolScale` — is
        the real boss of its own level, so a mid-boss reads as a preview of what waits at the end of
        it. The sentinel takes jormungandr's three; where a real boss has five rows its mid-boss takes
        2, 4 and 5, and where it has three there is no opening to skip.

        ⚠️ **The FAN stays the creature's own.** `shots` and `spread` are this hull's silhouette in
        bullets rather than its tempo — medusa fires ten at a spread of zero because it throws RINGS,
        and copying that onto a boss with no ring is ten bullets in a line. So the mid-boss's own ramp
        is re-spread over three phases and started a third of the way up it: *"slightly tougher at the
        start."*

        ⚠️ **The opening phase used to be deliberately readable** — one aimed shot every 1.5 seconds,
        the phase in which a player learns where a 26-unit hull ends. It opens at two now, which is
        the cost of a shorter fight and is the thing to watch first when this is played.
      */
      { upTo: 1, fireEvery: 84, shots: 2, spread: 0.3, patrolScale: 1, stance: { kind: 'volley' }, look: null, shot: null, attack: null },
      { upTo: 0.66, fireEvery: 66, shots: 4, spread: 0.6, patrolScale: 1.3, stance: { kind: 'volley' }, look: null, shot: null, attack: null },
      { upTo: 0.33, fireEvery: 54, shots: 5, spread: 0.9, patrolScale: 1.6, stance: { kind: 'volley' }, look: null, shot: null, attack: null },
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
    points: 6000,
    // A bob since 0258: a mid-boss flies a pattern. It stalked at 0.24 from 0111.
    move: { kind: 'bob', amplitude: 22, wavelength: 140, rear: 0 },
    attack: { kind: 'spray' },
    uncoil: null,
    fall: null,
    chill: null,
    // The tip of its middle prong — 0452. The fan left the spine, twelve units back, and was drawn
    // crossing the hull before it reached any of the three things it is built round.
    muzzle: { along: -12.6, across: 0 },
    chain: null,
    face: null,
    entrance: null,
    tail: null,
    room: null,
    burn: null,
    wreck: null,
    shed: null,
    sprite: SPRITE.boss2,
    spriteHit: SPRITE.boss2Hit,
    radius: 12.5,
    // A mid-boss since 0247, which halved 580 to 290; solved to its level's seconds since 0269.
    // 66 from 65 — re-solved after 0364's zoom (`scripts/solve-mid-health.mjs`).
    // 277 from 66 — 0406: solved at the loadout the run carries in (`carriedAt`), which is the cap.
    // 168 from 277 — 0472: solved at the tuned tier, where 277 fought for 29 s; two passes.
    health: 168,
    damage: 3,
    // Closer than the sentinel's 120, which is most of what makes it feel like a different fight:
    // the player has less room in front of them and less warning on everything it throws.
    station: 163,
    /*
      Wider than the sentinel's and it still clears the narrowest view by a comfortable margin —
      `100 + 20 + 12.5` is 132.5 against 150 — because standing closer buys the room the sentinel
      spent on being further out. A bigger swing at a shorter wavelength is the same *takes the lane
      away* this row is built around: it closes on the player and backs off inside four seconds.
    */
    drift: 20,
    driftWavelength: 150,
    patrol: 0.42,
    // The fish's quill, as its place's raiders throw — 0473, from the lance every place shared.
    shot: 'quill',
    phases: [
      // No gentle opening. It starts where the sentinel's second phase ended.
      // Three phases on the fish's tempo — 0269: volans is a five-row ladder, so its 2nd, 4th and
      // 5th are what the harrow paces to. The weave and the fan are the harrow's own.
      { upTo: 1, fireEvery: 66, shots: 4, spread: 0.75, patrolScale: 1.3, stance: { kind: 'volley' }, look: null, shot: null, attack: null },
      { upTo: 0.66, fireEvery: 54, shots: 6, spread: 1.1, patrolScale: 1.8, stance: { kind: 'volley' }, look: null, shot: null, attack: null },
      /*
        The last half: seven shots across most of a right angle, and a hull crossing the lane at
        two and a half times its opening speed. Every arsenal meets every phase, so this has to be
        survivable with the base weapon alone — which is exactly what `tests/level.test.ts` drives.

        ⚠️ **TWO PHASES, NOT FOUR — 0247.** Nine seconds at max weapons at half its health leaves
        room for two phases of three; the two middle rungs are folded into these.
      */
      { upTo: 0.33, fireEvery: 48, shots: 7, spread: 1.4, patrolScale: 2.2, stance: { kind: 'volley' }, look: null, shot: null, attack: null },
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
    points: 8000,
    move: { kind: 'patrol' },
    attack: { kind: 'wall', gap: 15 },
    uncoil: null,
    fall: null,
    chill: null,
    muzzle: null,
    chain: null,
    face: null,
    entrance: null,
    tail: null,
    room: null,
    burn: null,
    wreck: null,
    shed: null,
    sprite: SPRITE.boss3,
    spriteHit: SPRITE.boss3Hit,
    radius: 11.5,
    // The labyrinth's mid-boss since 0247, moved from the saurian belt's end; 0247 halved 680 to 340
    // and 0269 solved it to its level's seconds. ⚠️ **The lowest health of the seven and it was the
    // LONGEST fight in the game at 340** — the lattice patrols at 0.5, so most of what is fired at it
    // arrives where it was. Health was never what made this one hard.
    // 48 from 38 — re-solved after 0326, on this file's own rule that the number is the solver's: with
    // the seen window in, the shoal's waves around the fight fire later and absorb less of the ship's
    // fire on its way to the hull, and the fight came in at 16 s against the 20 its level asks.
    // 32 from 48 — re-solved after 0364: a fifth further off and patrolling a lane a fifth wider, so
    // less of what is fired at it lands, and at 48 the fight ran 52 s against 20. See `patrol`.
    // 187 from 32 — 0406: solved at the loadout the run carries in (`carriedAt`), which is the cap.
    // 101 from 187 — 0472: solved at the tuned tier, where 187 fought for 56 s. Scanned by hand rather
    // than by the solver's ratio, which did not converge: the fight steps with the walls' clock — 97
    // fights for 16.5 s, 99 for 22.6, 101 for 19.4.
    // ⚠️ Left at 101 by 0503, which closed the level up: it fights for 18.1 s now, and the scan around it
    // still steps — 103 for 18.5, 105 to 109 for 21.6, 111 for 18.8 — and 105's 1.6 s over is no
    // nearer 20 than 101's 1.9 under to be worth a move across the cliff.
    health: 101,
    damage: 3,
    /*
      ⚠️ **The furthest station any hull can have, and the guard is what said where that is.** The
      first draft put it at 130 with a 16-unit drift, which is 130 + 16 + 11.5 = 157.5 against a
      150-unit view — seven and a half units of boss off the narrowest screen at the far end of
      every swing. It was written up as deliberate and measured as wrong, which is exactly why a
      station is not a number anybody gets to pick by feel.
      `docs/decisions/0061-a-boss-keeps-flying.md` holds that assertion.
    */
    station: 168,
    drift: 15,
    driftWavelength: 260,
    // 0.6 from 0.5 — 0364. It patrols the whole lane, and the lane grew by a fifth, so at 0.5 each
    // crossing took a fifth longer and the fight became a count of crossings: 23 health fought for
    // 15 s and 24 for 26, with nothing between. A fifth faster is the crossing it had.
    patrol: 0.6,
    // The gyre's cog, as its place's raiders throw — 0473, from the slab every place shared.
    shot: 'cog',
    phases: [
      // Wide and slow from the start: the shots are the lane-taking, not the hull.
      // Three phases on the gyre's tempo — 0269. The gyre is a three-row ladder, so there is no
      // opening to skip and the lattice paces to all three of them.
      { upTo: 1, fireEvery: 78, shots: 4, spread: 1.1, patrolScale: 1, stance: { kind: 'volley' }, look: null, shot: null, attack: null },
      { upTo: 0.66, fireEvery: 66, shots: 6, spread: 1.3, patrolScale: 1.3, stance: { kind: 'volley' }, look: null, shot: null, attack: null },
      { upTo: 0.33, fireEvery: 54, shots: 7, spread: 1.5, patrolScale: 1.7, stance: { kind: 'volley' }, look: null, shot: null, attack: null },
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
    points: 7000,
    move: { kind: 'bob', amplitude: 26, wavelength: 150, rear: 0 },
    // A wall since 0258: a mid-boss fires a pattern, and `bob/spray` is the harrow's pair. Its
    // phases widen the wall from one pair of lances either side of it to five, the hole in front.
    attack: { kind: 'wall', gap: 12 },
    uncoil: null,
    fall: null,
    chill: null,
    // Its nose — 0452: the wall is laid level with the snout it is spat from, not beside its gills.
    muzzle: { along: -13.4, across: 0 },
    chain: null,
    face: null,
    entrance: null,
    tail: null,
    room: null,
    burn: null,
    wreck: null,
    shed: null,
    sprite: SPRITE.boss4,
    spriteHit: SPRITE.boss4Hit,
    radius: 13,
    // The saurian belt's mid-boss since 0247, moved from the labyrinth's end; 0247 halved 780 to 390
    // and 0269 solved it to its level's seconds.
    // 50 from 61 — re-solved after 0364's zoom (`scripts/solve-mid-health.mjs`).
    // 229 from 50 — 0406: solved at the loadout the run carries in (`carriedAt`), which is the cap.
    // 132 from 229 — 0472: solved at the tuned tier, where 229 fought for 30 s; two passes.
    health: 132,
    damage: 3,
    station: 163,
    drift: 18,
    driftWavelength: 120,
    patrol: 0.62,
    // The pterodactyl's quill, as its place's raiders throw — 0473, from the lance every place shared.
    // Not the teeth its raiders also throw: a spine at 0.95 against the lance's 1.6 left this fight half
    // as busy again by the count on the screen.
    shot: 'quill',
    phases: [
      // Three phases, not four — 0247: twelve seconds at max weapons at half its health.
      // Three phases on the pterodactyl's tempo — 0269: quetzal has four rows, so its last three are
      // what the shoal mother paces to. Its own fan, opened a third of the way up its ramp.
      { upTo: 1, fireEvery: 60, shots: 2, spread: 0.3, patrolScale: 1.5, stance: { kind: 'volley' }, look: null, shot: null, attack: null },
      { upTo: 0.66, fireEvery: 54, shots: 4, spread: 0.6, patrolScale: 2, stance: { kind: 'volley' }, look: null, shot: null, attack: null },
      { upTo: 0.33, fireEvery: 48, shots: 5, spread: 0.9, patrolScale: 2.4, stance: { kind: 'volley' }, look: null, shot: null, attack: null },
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
    points: 9000,
    move: { kind: 'patrol' },
    attack: { kind: 'ring' },
    uncoil: null,
    fall: null,
    chill: null,
    muzzle: null,
    chain: null,
    face: null,
    entrance: null,
    tail: null,
    room: null,
    burn: null,
    wreck: null,
    shed: null,
    sprite: SPRITE.boss5,
    spriteHit: SPRITE.boss5Hit,
    radius: 14,
    // A mid-boss since 0247, which halved 880 to 440; solved to its level's seconds since 0269.
    // ⚠️ **It keeps the most of any mid-boss, by six times the lattice's** — the redoubt patrols at
    // 0.16, so nearly everything fired at it lands and the health is the whole of the fight.
    // 158 from 210 — re-solved after 0364's zoom (`scripts/solve-mid-health.mjs`).
    // 541 from 158 — 0406: solved at the loadout the run carries in (`carriedAt`), which is the cap.
    // 329 from 541 — 0472: solved at the tuned tier, where 541 fought for 35 s; two passes.
    // 359 from 329 — 0502: no waves are put down over the fight now, so none soak up its fire.
    health: 359,
    damage: 3,
    station: 170,
    drift: 8,
    driftWavelength: 300,
    patrol: 0.16,
    // Hail, as its place's raiders throw — 0473, from the slab every place shared.
    shot: 'hail',
    phases: [
      // Three phases, not four — 0247: fourteen seconds at max weapons at half its health.
      // Three phases on the frost ship's tempo — 0269: hoarfrost has four rows, so its last three.
      // ⚠️ **The redoubt SLOWS DOWN here** — it fired every 54 steps and now opens at 72, because it
      // patrols at 0.16 and nearly everything the player throws at it lands. It was already the
      // shortest fight of the seven and its tempo was the hardest; the pacing it borrows is the
      // correction.
      { upTo: 1, fireEvery: 72, shots: 4, spread: 1, patrolScale: 1.2, stance: { kind: 'volley' }, look: null, shot: null, attack: null },
      { upTo: 0.66, fireEvery: 60, shots: 6, spread: 1.3, patrolScale: 1.5, stance: { kind: 'volley' }, look: null, shot: null, attack: null },
      { upTo: 0.33, fireEvery: 54, shots: 7, spread: 1.6, patrolScale: 1.9, stance: { kind: 'volley' }, look: null, shot: null, attack: null },
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
    points: 10000,
    move: { kind: 'bob', amplitude: 22, wavelength: 110, rear: 0 },
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
    // ⚠️ **NO FLOOR, AND THAT IS A MEASUREMENT** — 0333. Driven over every gun at every tier, the
    // chorus's four walls arrive whole with none; a floor of two seconds costs it three of them
    // against a fast gun and buys nothing. `scripts/weigh-walls.mjs` is where that is read.
    // `at` 26 → 31 with 0364's zoom, so the hole is where it was on the screen; `hole` is a ship's room and stays.
    uncoil: { from: 0.7, every: 0.1, gap: 4.5, at: 31, atBy: null, hole: 14, spin: false, quicken: null, apart: 0 },
    fall: null,
    chill: null,
    // Its middle eye, the one on the player's side of the middle lobe — 0452. The rake used to leave
    // the spine; the curtain is a line across the whole lane and leaves nothing.
    muzzle: { along: -5.8, across: 0 },
    chain: null,
    face: null,
    entrance: null,
    tail: null,
    room: null,
    burn: null,
    wreck: null,
    shed: null,
    sprite: SPRITE.boss6,
    spriteHit: SPRITE.boss6Hit,
    radius: 12.5,
    // A mid-boss since 0247, which halved 980 to 490; solved to its level's seconds since 0269.
    // 97 from 94 — re-solved after 0364's zoom (`scripts/solve-mid-health.mjs`).
    // 419 from 97 — 0406: solved at the loadout the run carries in (`carriedAt`), which is the cap.
    // 237 from 419 — 0472: solved at the tuned tier, where 419 fought for 34 s; two passes.
    // 284 from 237 — 0502: no waves are put down over the fight now, so none soak up its fire.
    health: 284,
    damage: 3,
    station: 166,
    drift: 15,
    driftWavelength: 180,
    patrol: 0.45,
    // The hydra's droplets, as its place's raiders throw — 0473, from the spit: *"very small and hard
    // to see."*
    shot: 'droplet',
    phases: [
      // Three fans and the eye, not five and the eye — 0247: fifteen seconds at max weapons at half
      // its health, and a phase under three of them is not a phase.
      // Three phases on the hydra's tempo — 0269: hydra is a five-row ladder, so its 2nd, 4th and 5th.
      { upTo: 1, fireEvery: 66, shots: 4, spread: 0.85, patrolScale: 1.2, stance: { kind: 'volley' }, look: null, shot: null, attack: null },
      { upTo: 0.66, fireEvery: 54, shots: 6, spread: 1.2, patrolScale: 1.6, stance: { kind: 'volley' }, look: null, shot: null, attack: null },
      /*
        ⚠️ **THE EYE.** It has thrown everything it had and it stops: no fan, no rake, a hull still
        crossing the lane at a rung under its opening speed, and three times the damage from every
        pulse that lands. About 1.8 seconds at max weapons, which is a beat longer than the death it
        runs into — `tests/level.test.ts` holds that floor against `BOSS_DEATH_STEPS`. At half the
        health that is a third of the bar rather than a fifth (0247).

        ⚠️ **The fan it is still carrying is written out and never thrown**, which is the stance
        saying so rather than the row — see `BossStance`.
      */
      // ⚠️ **A THIRD OF THE HEALTH NOW, FROM 0.36** — 0150 asks that a bare window outlast the death
      // it runs into, and at the old share a shorter fight measured 0.38s of window against a 1.60s
      // death: the player met the window inside its own explosion.
      { upTo: 0.33, fireEvery: 48, shots: 7, spread: 1.6, patrolScale: 1.8, stance: { kind: 'bare', damageScale: 3 }, look: null, shot: null, attack: null },
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
    points: 12000,
    // A bob since 0258: a mid-boss flies a pattern. It stalked at 0.2 from 0111.
    move: { kind: 'bob', amplitude: 20, wavelength: 180, rear: 0 },
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
    // No floor, on the chorus's own measurement — 0333. Two walls, both whole, under every gun.
    // `at` 58 → 70 with 0364's zoom: at 58 of a 120 lane the hole had crossed to the chorus's side.
    /*
      ⚠️ **A FIFTH WIDER, AND THE SPACING MOVED SO THAT A FIFTH IS WHAT IT IS — 0497.** *"Needs about a
      20% bigger increase in the bullet wall gap, at the moment it needs perfection to fit."* On a
      spacing of 4 the hole could only be 12 or 16 between the clots that bound it, so `gap` 4.85 lays
      the wall at 4.8 and the clots either side stand at 62.4 and 76.8: 14.4 apart, which is 12 × 1.2,
      and 12.1 of clear air where there was 9.7. `hole` 14 is the cut, a fraction inside both of them.
    */
    uncoil: { from: 0.5, every: 0.1, gap: 4.85, at: 70, atBy: null, hole: 14, spin: false, quicken: null, apart: 0 },
    fall: null,
    chill: null,
    muzzle: null,
    chain: null,
    face: null,
    entrance: null,
    tail: null,
    room: null,
    burn: null,
    wreck: null,
    shed: null,
    sprite: SPRITE.boss7,
    spriteHit: SPRITE.boss7Hit,
    radius: 16,
    // The black heart's mid-boss since 0247, which halved 1140 to 570; solved to its level's seconds
    // since 0269, and the toughest of the seven in both.
    // 164 from 208 — re-solved after 0364's zoom (`scripts/solve-mid-health.mjs`).
    // 699 from 164 — 0406: solved at the loadout the run carries in (`carriedAt`), which is the cap.
    // 414 from 699 — 0472: solved at the tuned tier, where 699 fought for 34 s; two passes.
    // 507 from 414 — 0502: no waves are put down over the fight now, so none soak up its fire.
    health: 507,
    damage: 3,
    // The closest station in the game. `95 + 14 + 16` is 125 against 150 — the hull fills a fifth of
    // the narrowest view, which is what a last boss should cost the player in room.
    station: 161,
    drift: 14,
    driftWavelength: 200,
    patrol: 0.4,
    // Clots, as its place's raiders throw — 0473, from the lance: the smallest bullet there is, in the
    // tightest curtain in the game, at the last level, was *"very small and hard to see."*
    shot: 'clot',
    phases: [
      // Three rings and the eye, not five and the eye — 0247: seventeen seconds at max weapons at
      // half its health.
      // Three phases on the jellyfish's tempo — 0269: medusa is a five-row ladder, so its 2nd, 4th
      // and 5th. ⚠️ **Its SPREAD is not borrowed** — medusa fires at a spread of zero because it
      // throws rings, and ten bullets on one line is not a fan. The axis keeps its own.
      // ⚠️ 66 and 48, from 54 and 42 — 0473: its clots stay on the screen 1.6/1.3 as long as the lances
      // did, and at the old cadence its fight measured a quarter busier by the count on the screen.
      { upTo: 1, fireEvery: 66, shots: 4, spread: 1, patrolScale: 1.3, stance: { kind: 'volley' }, look: null, shot: null, attack: null },
      { upTo: 0.66, fireEvery: 48, shots: 6, spread: 1.4, patrolScale: 2, stance: { kind: 'volley' }, look: null, shot: null, attack: null },
      /*
        ⚠️ **THE EYE, AND IT WAS THE LAST THING THE AUTHORED RUN ASKED FOR.** The ring stops, the
        stalk slows to half what it was chasing at, and the fight ends on a window the player has to
        be in front of rather than on a health bar reaching zero — which is the word *interactive*
        in `reports/the-boss-vocabulary-is-one-fan-2026-08-14.md` answered at its own end. Since
        0247 the run's last eye is the jellyfish's; this is the black heart's mid-boss, and its eye
        opens at a third of the bar so it still outlasts the death it runs into.
      */
      // A third of the health, on the chorus's terms — 0269, so the window outlasts the death (0150).
      { upTo: 0.33, fireEvery: 36, shots: 7, spread: 1.8, patrolScale: 1.2, stance: { kind: 'bare', damageScale: 3 }, look: null, shot: null, attack: null },
    ],
  },

  /*
    ── THE REAL BOSSES — 0247 ──────────────────────────────────────────────────────────────────────

    ⚠️ **SEVEN END BOSSES, ONE PER PLACE, AND EVERY ONE OF THEM A FIRST ITERATION.** Asked for in the
    seventh play-test, each by name with its own attacks — a serpent with acid, void and lightning
    from the sky; a demon eagle with whips of fire and summoned hordes (a flying fish since 0312, and
    the name is left as it was asked because this paragraph is the ask); a pterodactyl with lasers on
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
    ⚠️ **THREE PHASES, THREE WEAPONS — 0248, THROWN TOGETHER SINCE 0261.** *"Acid blast attacks,
    void blast attacks and then a space lightning bolt attack that rains down from the top of the
    screen."* 0248 gave each phase one weapon — a wall of acid, a spray of void, the lightning —
    and the alpha play called that three separate fire fields. The phases are cumulative now: five
    acid globes straight ahead while it is whole (0304); the acid spray and void in turn once hurt;
    and, at the last third, the spray, void and the lightning in turn — three columns a strike inside the box the ship flies in,
    each with a three-quarter-second warning line, each hurting a ship within four units on the
    step it lands. The row's `shot` and `attack` are the first phase's; the phases say what changes.
  */
  jormungandr: {
    points: 20000,
    move: { kind: 'bob', amplitude: 24, wavelength: 200, rear: 14 },
    /*
      ── THE ACID IS A SPRAY THAT RAKES, AND THE THREE WEAPONS ARE THROWN TOGETHER — 0261 ──────────

      `docs/decisions/0261-the-serpent-throws-together.md`. *"The serpent should be firing the acid
      blasts and void blasts together with the lightning, not have it as three separate fire fields.
      Acid blasts need to be a spray fire attack not the wall pattern attack."* The wall is gone: the
      serpent opens with a fan of acid that rakes across the lane a little each volley — a spray
      that sweeps, and `bob/rake` is its own pair among the real bosses (`bob/spray` is the hydra's).
      Once hurt it throws acid and void in turn, and at the last third acid, void and the lightning
      in turn — the hydra's heads (0254), which is the one mechanism the game has for *together*
      that is not one burst wearing three inks. The lightning itself is untouched: *"superb, don't
      change it."*
    */
    /*
      ⚠️ **A RAKING FAN OF THREE BECAME A RAKING WAVE OF NINE — 0290 — AND IS FIVE STRAIGHT AHEAD NOW
      — 0304.** Asked for: *"for phase 1 can we have it shoot a forward arc of 5 globes."* A fan
      centred down the lane that does not turn: the opening phase is the simple one, so that the spray
      the later phases throw reads as the animal escalating. The count is the phase's own `shots`.

      ⚠️ **IT IS NOW THE HYDRA'S PAIR — a bob and a spray — AND THAT WAS ACCEPTED RATHER THAN DODGED.**
      `tests/level.test.ts` held the pair unique over the real bosses and this is the correct change
      that reddened it, so that half is a taste in `tests/authored.ts` now (0192). What tells the two
      apart is everything a pair cannot see: a chain that rears, five globes to three, and a fight
      that becomes a spray and then the lightning.
    */
    attack: { kind: 'spray' },
    uncoil: null,
    fall: null,
    chill: null,
    sprite: SPRITE.boss8,
    spriteHit: SPRITE.boss8Hit,
    /*
      ⚠️ **16 → 22, BECAUSE THE HULL GREW AND A HURTBOX THAT DID NOT WOULD BE 0036 BACKWARDS.** The
      sprite went 40 → 56; a disc left at 16 would let a shot pass through forty per cent of the drawn
      animal and register nothing, which is *an event the picture mentions and the model does not* —
      the same fault as 0036's, with the two sides swapped. Scaled with the hull: 16 × 56/40 = 22.4.

      ⚠️ **22 → 7, BECAUSE THE HULL IS A SKULL NOW — 0283.** `radius` is the HEAD's hurtbox; the rest
      of the animal is the chain below, and every node of it is a hurt node of its own. A disc of 22
      round a skull eleven units tall would be a hitbox with nothing in most of it, which is 0036 with
      its two sides swapped — the same fault the 16 → 22 change was fixing when the hull was the whole
      animal.
    */
    /*
      ⚠️ **7 → 8.4, WITH THE SKULL, AND NOT BECAUSE ANYTHING ASKED FOR A BIGGER HURTBOX — 0288.** A
      radius that stayed at 7 under a head drawn twenty per cent larger is a head with edges the
      player can shoot through, which is 0036's *an event the model resolves and the picture never
      mentions* pointed the other way round: the picture says HIT and the model says miss.

      ⚠️ **AND WHAT IT COSTS THE FIGHT WAS MEASURED RATHER THAN ASSUMED.** 0260's forty-second floor
      computes time-to-kill as `health × toughness / FASTEST` and has no hurtbox in it at all, so it
      would have stayed green through any amount of this. Driven at max weapons, the fight is **66.0s
      before and 59.0s after** — a bigger target catches more of the fan — so the resize costs 11% of
      the fight, and it lands 19 seconds above 0260's floor rather than under it. The decision has the
      rig and the numbers.
    */
    radius: 8.4,
    /*
      ⚠️ **NULL, AND IT WAS THE ONE ROW IN THE GAME THAT NEEDED A MUZZLE — 0283.** 0277 put one here
      because the skull sat twenty-four units down-lane of the centre of a fifty-six-unit sprite, so a
      shot from `(boss.along, boss.across)` read as *the body coughing*. The hull IS the skull now:
      its centre is the mouth, and a muzzle offset would move the shot off the face it belongs to.

      ⚠️ **So this is 0277's rule holding rather than being reversed.** A boss row says where its shots
      leave the hull; on this hull that place is the middle, exactly as it is for a gyre.

      ⚠️ **AND THE PICTURE SAID OTHERWISE — 0452.** The skull's centre is two units behind the jaw's hinge
      and level with the eye: photographed, the acid fan left the cheek under the eye while the jaw gaped
      empty in front of it. The mouth is the opening between the lips with the jaw dropped to `gape`,
      which is the face worn while a volley leaves — `serpentMouth` in `src/render/bake.ts`, held to
      this by `tests/muzzles.test.ts`. It turns with the head when it rears.
    */
    muzzle: { along: -8.6, across: 2.2 },
    /*
      ── THE BODY, AND IT IS THE ANATOMY OF A SNAKE — 0283 ──────────────────────────────────────────

      *"The body needs to be longer… the creature should have the functional body shape of a
      creature."* Twenty-six nodes since 0286, in world units of diameter, head-end first.

      ⚠️ **IT RISES FROM THE NECK BEFORE IT FALLS, WHICH IS THE WHOLE OF *not a worm*.** 0277 measured
      this and fixed it in a baked profile; it is the same shape here, authored where the animal is
      rather than where the drawing is. The neck at 7 is narrower than the skull at 11, so the
      head-neck junction is a step the eye reads as *snake* before any paint is on it; the midriff at
      15.5 is where the girth lives; the last three nodes are the whip.

      ── ⚠️ AND EVERY NUMBER IN THE PARAGRAPHS THIS REPLACES HAD ROTTED — 0290 ─────────────────────

      They described fourteen nodes at a `step` of 0.37 reaching 54.5 units, a station of 114, and a
      cap of *"about sixty units"* on the animal's length that *"a longer serpent than this needs its
      tail allowed off the leading edge, which is… not this one."* **0286 is that decision**, and it
      changed all six of those numbers without touching the prose beside them. `docs/state-of-play.md`
      names this exact failure — *a citation rots as silently as a summary drifts* — and it is worth
      more here than the paragraph it cost: the comment read as current and was not.

      **What is true now**: twenty-six nodes at a `step` of 0.53, reaching **133.6 units** up-lane of
      the skull. With `station` 130 and the drift and the rear, the tail is at **283 against 240 on
      the widest screen the clamp allows** — off the leading edge on every device, which is the ask
      0286 answered and the reason `tests/level.test.ts` measures the HULL there and holds the body's
      length as a claim of its own.
    */
    /*
      ⚠️ **SEVEN FACES AND FOUR SILHOUETTES — 0285, and the snap made it four.** `up` and `down` move the pupil and nothing else,
      so they wear `restHit`: a hurt twin is the silhouette with no paint on it (0035), and three
      identical white shapes would be three identical bakes.
    */
    face: {
      rest: SPRITE.boss8,
      restHit: SPRITE.boss8Hit,
      up: SPRITE.boss8Up,
      down: SPRITE.boss8Down,
      gape: SPRITE.boss8Gape,
      gapeHit: SPRITE.boss8GapeHit,
      shut: SPRITE.boss8Shut,
      shutHit: SPRITE.boss8ShutHit,
    },
    /*
      ⚠️ **IN, ROUND AND OFF THE BOTTOM — 0306.** *"Fly onto screen, do a coil, fly off and then enter
      where it is now"*, with *"a gap in the center of the screen."* A ring of 24 round a point 95 units
      in — the middle of a 16:9 screen, the narrowest the game draws — so the hole is 24 less the
      thickest girth's half, about 37 units across, with the ship's own start 25 units clear of the
      ring's near edge. A turn and a quarter: the body is 134 units against a ring of 151, so after one
      turn the animal is a nearly-closed coil, and the quarter more takes the head round to the side
      nearest the player, where it peels away straight down and off the bottom.

      ⚠️ **1.5 UNITS A STEP, THREE TIMES THE ARRIVAL'S RATE**, because this is the animal flying rather
      than closing on a station: about six and a half seconds in, round and off, and then the arrival
      every boss has.
    */
    // The middle of the screen after 0364's zoom — 107 of a 16:9 view of 213, and half the lane across.
    entrance: { kind: 'coil', centre: { along: 107, across: ACROSS_SPAN / 2 }, radius: 24, turns: 1.25, speed: 1.5 },
    tail: null,
    /*
      ⚠️ **IN THE WORLD TREE'S ROOTS — 0459.** *"We need the world tree's roots framing that side of
      the screen around to indicate it's lurking in the world tree's roots — the background needs to
      stop scrolling there as well."* The gyre's room, with the camera at rest on the same numbers, and
      walled in roots instead of stone: along the top and bottom from a hundred units in, and down the
      far side, where the body runs off the screen into them. `mouth` is in front of the camera rather
      than behind it, which is what keeps the near half of the screen open sky. Nothing falls out of
      them, so the far side parts on the death itself and the level carries on through it.

      ⚠️ **AND THE ROOTS ARE ROOTS — 0488.** The strip of one tile became five pieces: a trunk lying along
      each lane edge and a tip curling at the bottom, a fork and a trunk down the far side — which withdraw
      off the screen when it parts — and the knot at the coil's centre that the serpent arrives wrapped
      round, sinking into the dark once it has arrived. Every one is outside the ship's box
      (`tests/serpent.test.ts`), so the picture of the bound is still the bound.
    */
    room: {
      stand: 60,
      settle: 150,
      mouth: -100,
      wall: null,
      pieces: [
        { sprite: SPRITE.rootTrunk, along: 150, across: -3.5, turn: 0, far: false, entrance: false },
        { sprite: SPRITE.rootTip, along: 118, across: 128, turn: Math.PI, far: false, entrance: false },
        { sprite: SPRITE.rootTrunk, along: 185, across: 123.5, turn: Math.PI, far: false, entrance: false },
        { sprite: SPRITE.rootFork, along: 232, across: 58, turn: Math.PI, far: true, entrance: false },
        { sprite: SPRITE.rootTrunk, along: 216, across: 98, turn: Math.PI / 2, far: true, entrance: false },
        { sprite: SPRITE.rootKnot, along: 107, across: ACROSS_SPAN / 2, turn: 0.4, far: false, entrance: true },
      ],
      opens: 90,
    },
    burn: null,
    wreck: null,
    shed: { sprite: SPRITE.shedScale, from: 'facing' },
    chain: {
      sprite: SPRITE.serpentBody,
      spriteHit: SPRITE.serpentBodyHit,
      /*
        ⚠️ **THINNER THAN THE FIRST DRAFT, BECAUSE A SHORT FAT TUBE IS A CATERPILLAR.** Photographed
        at the shipped camera, the first pass was fifteen and a half units thick over fifty-five long
        — under four to one, and it read as a grub however it was painted. This is eleven over
        fifty-five, which is five to one for the body and about six for the whole animal.

        ⚠️ **AND FIVE TO ONE IS THE THINNEST ELEVEN NODES CAN DRAW.** The body is overlapping discs
        and the screen caps its length at about sixty units (see the station above), so the spacing is
        fixed at roughly `length / nodes`; a girth much under this and the discs stop overlapping and
        the tube becomes a string of beads. **A longer, thinner serpent is more nodes**, and more
        nodes is pool the game does not have — `src/app/mount.ts` has that arithmetic.
      */
      /*
        ⚠️ **TWENTY-SIX NODES, AND EVERY ONE OF THEM IS THE SAME SIZE AS BEFORE — 0286.** Reported on
        the second play: *"the body is short and squat, it should be long enough to stretch off the
        screen for a serpent → I mean add more segements, not stretch out the segments that are
        there."* So the girths below are 0284's, unchanged, and `step` is unchanged; what is longer is
        the RUN of them. Fifteen more discs at full girth, spliced into the middle where an animal's
        body is the same thickness for most of its length — the head-end swell and the tail's taper
        are both exactly as they were.

        ⚠️ **AND IT IS 133 UNITS NOW AGAINST 46**, which puts the tail at 253 from the camera's
        trailing edge on a screen that is 178 units wide at its narrowest and 240 at its widest. The
        animal runs off the leading edge on every device, which is the ask: what made it read short
        was not its length in units but that the player could see it END, tapered tail and all, with
        room to spare. **The taper is still authored and is simply never on screen.**

        ⚠️ **THE PARAGRAPH ABOVE IS WHAT THIS ANSWERS**, and it named the cost correctly: *more nodes
        is pool the game does not have.* 0286 is the reopening of that ceiling rather than a way round
        it — `src/app/mount.ts` and `tests/budget.test.ts` carry the arithmetic.
      */
      /*
        ⚠️ **AND THE LAST THREE FALL AWAY HARDER, BECAUSE A TAIL ENDS IN A POINT — 0284.** Reported on
        the first play of the chain: *"tip of the tail needs to be more pointed if we can."* It did
        not: the profile fell to two units and stopped, so the animal finished on a disc two units
        across, which is a full stop rather than a point. Falling 4 → 2 → 0.8 converges instead, and
        the nodes are spaced by their own girth so the last two sit almost on top of each other.
      */
      // head-end swell ─┐  ┌─ seventeen at full girth, which is the length ─┐  ┌─ 0284's tail ─┐
      girth: [6, 8.5, 10.5, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 10.5, 9.5, 8, 6, 3, 1],
      /*
        ⚠️ **3 AND NOT 6.5, AND THE GAP IS WHY — 0284.** Reported on the first play of the chain:
        *"slight gap between head and body."* Measured: the drawn skull's back edge is **6.95** units
        behind the head's centre, and the first node sat at 6.5 with a radius of 3 — so the node that
        should have filled the neck was a small disc hiding *inside* the skull, and the first one the
        player could see began at **6.09**, nine tenths of a unit short of where the head ends. A
        notch, not a join.

        ⚠️ **IT IS WHERE THE BODY STARTS AND NOT WHERE THE SKULL ENDS**, which is the thing that made
        it easy to get wrong: the first node belongs *under* the head, and what has to meet the
        skull's back is the second or third.
      */
      /*
        ⚠️ **3 → 3.6, BECAUSE THE SKULL GREW AND THIS WAS MEASURED AGAINST ITS BACK EDGE — 0288.** The
        note above is the whole argument: the first node belongs UNDER the head and what has to meet
        the skull's back is the second or third. That back edge is 0.9 of the drawing radius behind
        the head's centre, so it moved with `SPRITE_EXTENT.boss8` from 20 to 24 — and left where it
        was, this would have re-opened the *"slight gap between head and body"* 0284 closed.
      */
      neck: 3.6,
      step: 0.53,
      /*
        ⚠️ **THE SWAY IS THE TAIL'S AND THE HEAD BARELY MOVES, WHICH IS HOW A SNAKE SWIMS.** An animal
        whose whole body swings by the same amount is a rope being shaken; one whose head holds a line
        while the wave grows down the body is swimming. `src/app/frame.ts` ramps it from nothing at
        the skull to this at the tip.
      */
      /*
        ⚠️ **SEVEN AND EIGHTY, AND THE BEND RULE IS WHAT SET BOTH.** 0277 measured this geometry once
        for a sprite box and it is the same arithmetic on a chain: the tightest radius of a body
        waving with along-wavelength `L` and amplitude `A` is about `L² / 4π²A`, and the animal's own
        spine may not turn inside 1.5 of its local girth. Driven, at the worst moment of the bob:

        | sway | wavelength | tightest bend, over its own girth |
        |---|---|---|
        | 6 | 55 | **1.25** — a kink through the midriff |
        | 6 | 70 | 1.87 |
        | 7 | 80 | **2.02** — this |

        ⚠️ **THE THICK PART IS WHAT BINDS, WHICH IS THE OPPOSITE OF WHERE THE EYE LOOKS FOR A KINK.**
        Every failing measurement on the way here was at the tail — right up until the tail was
        fixed, and then the worst place in the animal became node 8, the midriff, because a bend
        radius is measured against the girth and the midriff has the most of it.

        ⚠️ **EIGHTY IS LONGER THAN THE ANIMAL, AND THAT IS THE POINT.** Fifty-five units of serpent
        under an eighty-unit wave is about three quarters of one — a single broad S with a crest and
        most of a trough, rather than a full cycle squeezed into a body too short to carry it
        gently. Room for a second undulation is room for a longer animal, and that is the screen's.
      */
      sway: 7,
      wavelength: 80,
      // A shade over three seconds a cycle — slower than the bob, so the two do not beat.
      rate: 0.034,
      lag: 0.25,
      /*
        ⚠️ **ARMOUR, AND THE SKULL IS THE ONLY PLACE IT DIES — 0307.** Reported: *"the shurikens kill
        the serpent boss in a reasonable time length, but the lightning gun and auto-fire gun only hit
        the head so they take forever."* Measured in the flown fight: the body trails straight up the
        lane behind the head, so a shot that stops on its first arrival meets the skull and never the
        flank, while a blade rides up the whole 133 units landing every flash — the body was up to
        half of what the shuriken did. Asked for: *"reduce the body damage taken overall so shurikens
        only damage the head."*

        ⚠️ **AND SOFT AGAIN SINCE 0391**, because the reason for the armour went with it: a target takes
        blades only thirty times a second now, however long its flank. *"We can have the serpent boss on
        level one have hits count on body as well which make that fight feel a bit faster and more
        intuitive."* Flown with the ceiling at 700, the whole body counting: the shuriken's best fight
        25 s, the arc's 26, the pulse's 51 — where armour at 770 had them at 44, 29 and 68.
      */
      hurt: 1,
    },
    // Doubled by 0260, from 700 — *"need a lot more health, I think I only saw about 50% of their
    // attacks before they died."* Every real boss is twice what 0247 authored; the mid-bosses stay.
    /*
      ⚠️ **1400 → 1000, AND IT IS THE ARMOUR'S PRICE RATHER THAN A SOFTER BOSS — 0307.** The body was
      three fifths of what a shuriken did to this animal, so armouring it took the shuriken's fight on
      the tuned tier from 43 seconds to 112, flown, and the void rule the same decision changed made
      the lightning the quickest gun here. 540 would have put the shuriken back where it was and the
      lightning at 22 seconds, under 0260's forty; **1000 is where the quickest gun at its best place
      takes forty-one**, so 0260's *"I only saw about 50% of their attacks"* still holds for every
      loadout. Chosen from the table in the decision, measured by `scripts/weigh-boss.mjs` rather
      than divided.
    */
    /*
      ⚠️ **1000 → 1100, AND IT IS THE BALL'S APPETITE BEING PAID FOR BY THE ANIMAL — 0322.** A maw eats the
      player's fire, so thirty points of appetite were thirty points of damage that never reached the
      serpent: cutting it to twelve handed the difference back to the hull and the arc's quickest fight fell
      from **40.0 s to 38.0**, under 0260's forty-second floor. The bullet was tanking for the boss, which
      is exactly the shape 0307 warned about when *"the void rule the same decision changed made the
      lightning the quickest gun here"* — a change to what a bullet does is a change to how long the fight
      takes, every time. Flown at 1100: the arc **43 s** from its best place, three clear of the floor, and
      every phase now gets ten volleys away or more where the floor is eight. Measured by
      `scripts/weigh-boss.mjs`, not divided.
    */
    /*
      ⚠️ **1100 → 770, AND IT IS A TENTH OFF EACH PHASE RATHER THAN A TENTH OFF THE BAR — 0365.** Asked:
      *"reduce its health by about 10% at each phase as they take slightly too long now, especially with
      the void balls eating attacks."* The same change took the three-globe opening out and shared its
      band among the three left, so every band got WIDER — and a tenth off the bar (990) would have made
      each phase longer than it was, 297 points where it had 253. What the sentence asks for is each
      phase's own share: 253, 242 and 363 before, **231, 231 and 308** now, which is 9, 5 and 15 per
      cent off. The last phase gives up the most, and it is the one with the ball eating the fire.
    */
    /*
      ⚠️ **700 → 900 — 0441.** *"Each ship will start with max weapons … we'll need to buff the 1st level
      miniboss and end boss health a bit to account for the upgraded weapons the player has at that
      level."* At 700 the serpent was met at the third weapon rung; at the cap the quickest guns took it
      from 29 s (shuriken) and 33 s (arc) to 25 and 24, under the 28-second floor
      `tests/serpent.test.ts` holds. At 900, flown by `scripts/weigh-boss.mjs` in each gun's own ship:
      the arc 31 s from its best place, the shuriken 33, the ray 53 and the pulse 68 — every gun back
      over the floor, and the pulse still quicker than the 79 s it took at the third rung.
    */
    health: 900,
    damage: 3,
    // The lightning at its own 1, not the arc's 1.5 — 0372: it was already this animal's quickest gun.
    gunWeights: { arc: 1 },
    /*
      ⚠️ **114 → 130, AND IT IS THE PRICE OF THE LUNGE RATHER THAN A TASTE — 0289.** 0101 holds every
      boss out of the player's half at the NEAR end of its swing, measured at `station − drift − rear
      − radius` against 55% of the narrowest screen. At 114 the serpent sat at 57% with no rear at
      all, so **every unit of lunge came straight out of the player's room** — a rear of 14 would have
      put it at 49%, which is under the number the report that wrote 0101 actually observed.

      ⚠️ **SO A HULL THAT LUNGES STANDS FURTHER BACK, WHICH IS ALSO WHAT IT SHOULD LOOK LIKE.** The
      animal now holds off at 130 and closes to 103 when it strikes, instead of sitting at 114 and
      doing nothing. Both ends are further from the player than the one place it used to sit.
    */
    station: 156,
    drift: 5,
    driftWavelength: 240,
    patrol: 0.3,
    shot: 'acid',
    phases: [
      /*
        ── THE OPENING IS TWO PHASES NOW, AND THE ARC FILLS IN — 0322 ────────────────────────────────

        ⚠️ **REPORTED**: *"at the start it needs to fire slightly fewer acid balls, then increase them,
        then it gets to the acid spray and void balls."* So the opening arc is **three globes while it is
        whole and five once it is a sixth down** — the same 0.9 of arc either way, filled in rather than
        widened, which is the escalation `phases[].shots` has been for since 0040 said so.

        ⚠️ **A PHASE AND NOT A RAMP INSIDE ONE, BECAUSE THE TABLE ALREADY SAYS THIS.** A count that grows
        with the health bar inside a single phase is a second escalation mechanism beside the one every
        boss in the game uses, and it would be the serpent's alone —
        [0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md). Two rows say it, and any
        boss can say it the same way tomorrow.

        ⚠️ **AND THE BANDS AND THE CADENCES WERE BOTH RE-DERIVED, BECAUSE TWO GUARDS SQUEEZE FROM
        OPPOSITE ENDS AND A SPLIT PHASE IS WHERE THEY MEET.** `tests/serpent.test.ts` holds that every
        phase gets **eight volleys away** in the quickest fight any gun can fly (0260's *"I only saw
        about 50% of their attacks"*), and `tests/difficulty.test.ts` holds that a later phase is never
        slower than an earlier one. Two phases out of one opening halves each band, so at 84 steps a
        half-band got **6.7** volleys — and answering that by slowing the late phases is the one thing
        the second guard forbids. The whole ladder moved instead: cadences of **78, 72, 66, 60** — one
        notch of the fire grid apart, four phases, each quicker than the last — over bands of **0.22,
        0.23, 0.22, 0.33**, which are **sized by the volley floor rather than by round numbers**. Flown
        at the quickest gun's quickest place, that is 8.8, 8.9, 10 and 17 volleys against a floor of
        eight; the pretty version (fifths of the bar) measured 7.9 in the second phase and is why the
        boundaries are 0.78 and 0.55. Neither guard was touched, and the decision has the table.

        ⚠️ **THE OPENING IS SIX STEPS QUICKER AND THROWS TWO FEWER**, which is a cut in what arrives and
        not a swap: at the tuned tier it was five globes a 1.1 s and is three a second — **4.5 bullets a
        second down to 3.0.** *"Slightly fewer"* is the count; the cadence moved because the band did.

        ── ⚠️ AND 0365 TOOK THE THREE-GLOBE OPENING BACK OUT ────────────────────────────────────────

        Asked: *"remove the first set of attacks, the shorter full health wave, then space the rest of the
        attack waves out to balance out the gap."* So the fight opens on the five-globe arc again, and the
        removed band's 0.22 is shared among the three phases left: **0.3, 0.3 and 0.4** of the bar, where
        they had 0.23, 0.22 and 0.33. The cadences stay 72, 66 and 60, so the ladder
        `tests/difficulty.test.ts` holds is the same ladder with its first rung gone. Everything above is
        why the table read as it did for a while; the three-globe arc it describes is no longer thrown.
      */
      // Whole: five acid globes in an arc straight down the lane — the row's own attack and shot (0304),
      // and the wet burst 0308 gave it in place of the crash every boss shared. The patrol is the
      // opening's own 1 rather than the 1.15 this arc flew at as a second phase — 0365: the arc moved up a
      // rung and the flight did not, so the animal still quickens 1, 1.3, 1.6 across the fight.
      { upTo: 1, fireEvery: 72, shots: 5, spread: 0.9, patrolScale: 1, stance: { kind: 'volley' }, look: null, shot: null, attack: null, cue: 'bossAcid' },
      /*
        Hurt: the acid spray and a fan of three void in turn — heads (0254), one a volley. **Three of
        them since 0324**, the third a second spray, so the void lands on every second round rather than
        on every one; the head list below is where that is said and the paragraph beside it has the ask.

        ⚠️ **THE SPRAY — 0304.** *"Starting from 60 degrees (so it will be shooting down behind it)
        then arcing around and finishing at 30 degrees (so it will be shooting up behind it)."* A
        heading of `π/3` is sixty degrees below straight-behind; `11π/6` is thirty above it.
        Twenty-one globes, one every three steps: the aim goes round 270 degrees in a second, down,
        forward and up, and leaves the quarter behind the animal empty.

        ⚠️ **A SECOND AND NOT LONGER, BECAUSE THE LIGHTNING WAITS FOR IT.** The next head is held until
        the spray has finished (`src/app/boss.ts`), so every step of spray is a step the round is
        longer — and the last third's round is where the lightning lives. At a second, it still falls
        about every two and a quarter seconds where it fell every 1.8; at 1.2 it was 2.4.

        ── ⚠️ AND IT BREATHES NOW, WHICH IS TWO NUMBERS AND NOT ONE — 0322 ───────────────────────────

        ⚠️ **REPORTED**: *"the acid spray and void balls needs a slightly slower fire rate and the void
        balls to be spaced out slightly more between the acid sprays."* **60 → 66** is the first half — one
        notch of the fire grid, which is as far as it can go and stay under the phase above it. The
        second half is the head's own `gap`, because `fireEvery` cannot say it: the spray pushes the
        cadence out to its own sixty steps, so at `savior` and `burn` — where `fireGap` is 0.78 and 0.5 —
        the void landed on the spray's **last globe**, at every value of `fireEvery` this phase may carry.
        The gap is added after the hold rather than competing with it, so the void gets **0.4 s** of clear
        lane at the hardest tier and **0.5** at the easiest, driven; and the round comes round every 2.0 to
        2.6 s against 1.5 to 2.0 before.

        ⚠️ **AND THE OTHER READING OF *spaced out* WAS CONSIDERED AND REFUSED**: the fan's own `spread`,
        widening the three void balls away from each other. It is not what the sentence pairs with *between
        the acid sprays*, and a wider fan is a harder volley — the ask is for room, and room is time here.
      */
      {
        upTo: 0.7,
        fireEvery: 66,
        shots: 3,
        spread: 0.8,
        patrolScale: 1.3,
        stance: { kind: 'volley' },
        /*
          ⚠️ **THE VOID PHASE DARKENS IT — 0305.** *"When the void blast phase starts it needs to look
          more menacing and have a dark aura, kind of like a super saiyan aura, but dark blue and
          purple energy and it's horns grow longer."* The horns are the faces' own drawing, half again
          as long; the aura is six frames of dark blue and violet flame rising off every node and the
          skull, a new frame every three steps and one frame on from node to node.
        */
        look: {
          face: {
            rest: SPRITE.boss8Horn2,
            restHit: SPRITE.boss8Horn2Hit,
            up: SPRITE.boss8Horn2Up,
            down: SPRITE.boss8Horn2Down,
            gape: SPRITE.boss8Horn2Gape,
            gapeHit: SPRITE.boss8Horn2GapeHit,
            shut: SPRITE.boss8Horn2Shut,
            shutHit: SPRITE.boss8Horn2ShutHit,
          },
          aura: {
            frames: [SPRITE.serpentAura0, SPRITE.serpentAura1, SPRITE.serpentAura2, SPRITE.serpentAura3, SPRITE.serpentAura4, SPRITE.serpentAura5],
            hold: 3,
            stride: 1,
            head: 15,
          },
        },
        shot: null,
        attack: {
          kind: 'heads',
          heads: [
            // ⚠️ **24 STEPS OF QUIET AFTER THE ACID STOPS — 0322**, so the void arrives in a lane the spray
            // has left rather than on its last globe. On the acid's head and not on the void's: it is the
            // pause after the spray, and the spray is the thing whose hold was swallowing it.
            { shot: 'acid', attack: { kind: 'sweep', from: Math.PI / 3, to: (11 * Math.PI) / 6, globes: 21, every: 3 }, cue: 'bossAcid', gap: 24 },
            { shot: 'void', attack: { kind: 'spray' }, cue: 'bossVoid' },
            /*
              ⚠️ **A THIRD HEAD, AND IT IS THE SAME SPRAY AGAIN — 0324.** Reported: *"the void blasts
              probably need to be every second firing, not every firing like they are now, they make that
              wave take a bit too long."* Three heads taking turns is **spray, void, spray | spray, void,
              spray**, which the ear hears as alternate rounds: a spray with a void behind it, then a spray
              on its own. The void's own period goes from one round in every one to one in every two, which
              is the ask read literally, and no new mechanism — 0254's heads, one more member.

              ⚠️ **IDENTICAL TO THE FIRST, GAP AND ALL, BECAUSE THE PAUSE BELONGS TO THE SPRAY.** 0322 put
              those 24 steps on the acid's head rather than the void's and said why: *"it is the pause after
              the spray, and the spray is the thing whose hold was swallowing it."* A second spray that did
              not pause would be a different attack wearing the same name.
            */
            { shot: 'acid', attack: { kind: 'sweep', from: Math.PI / 3, to: (11 * Math.PI) / 6, globes: 21, every: 3 }, cue: 'bossAcid', gap: 24 },
          ],
        },
      },
      /*
        The last two fifths since 0365, and the last third before it: the ball and the lightning in turn
        (0311), three columns a strike.

        ⚠️ **THE PARAGRAPH THAT WAS HERE SAID *the cadence is the quickest of the three so the lightning
        still falls about every two seconds*, AND IT HAD BEEN FALSE FOR A COMMIT — 0322.** The round was
        three heads at 36 steps, which is 108 between strikes; 0311 took a head out and left the number,
        so the lightning came every **72** and the player was handed a ball every 72 as well — *"superb,
        don't change it"* changed by arithmetic nobody re-did. **36 → 60** puts the strike back on exactly
        the two seconds that verdict was about, and it is the *"fire rate [that] is too fast"* the report
        names. `docs/decisions/0322-the-ball-is-worth-shooting.md` has the driven table.

        ⚠️ **AND THE BALL GETS ROOM OF ITS OWN ON TOP OF IT — 42 STEPS ON THE LOB'S HEAD.** A ball is a
        thing to **shoot** and a bolt is a thing to **stand away from**; the two asks are opposite, and the
        gap is what stops the player being handed both at once. Driven with a pilot that flies onto the
        ball's lane and the opening gun: **every ball killed at `legendary` and no ring on the screen at
        all**, against twelve of seventeen and a ring up a seventh of the time at 18 steps. The decision
        has the sweep over both numbers, and says plainly what `burn` is still like.

        ⚠️ **THE STRIKE COMES EVERY 2.7 s AT `legendary` NOW, AND THAT IS A COST WORTH NAMING.** It was
        1.8 s when the round had three heads, 1.2 s after 0311 took one out, and the *"superb, don't change
        it"* verdict was given on the attack — the column, the warning line and the strike, all untouched
        since 0248 — rather than on a period that has now moved three times underneath it. A round with a
        thing to shoot in it cannot also strike every two seconds; this is the trade the report asked for.
      */
      {
        upTo: 0.4,
        fireEvery: 60,
        shots: 3,
        spread: 0.9,
        patrolScale: 1.6,
        stance: { kind: 'volley' },
        /*
          ⚠️ **AND IT REARS BACK ONTO ITS OWN NECK — 0309.** *"At the lightning phase, the serpent needs
          to rear back with it's head and upper body, keeping the rest of it's body off screen."*

          ⚠️ **TEN AND A THIRD, AND THE PAIR IS WHAT KEEPS THE HEAD ON THE SCREEN.** Standing ten units
          further back moves both ends of the swing; cutting 0289's lunge to a third moves only the near
          one. Driven, with the ship crossing the lane so the gaze commits both ways: the head's closest
          approach goes **114.3 → 133.1** and its furthest **146.6 → 146.1** — so the player gains nearly
          nineteen units of room in the hardest phase of the fight and the skull's drawn edge still sits
          **165.1 of the narrowest screen's 177.8**, twelve clear. 0101's own quantity goes from 60% of
          the screen to 70%.

          ⚠️ **SIX OVER FORTY-FOUR IS THE BOW, AND THE SPINE CHOSE BOTH NUMBERS.** 0283's bend rule — no
          turn tighter than 1.5 of the local girth — caps a half-sine over `span` at roughly `span² / 163`,
          and the sway is already spending part of that budget. **Six over thirty-four was authored first
          and measured 1.39, which the rule refuses**; the bend goes as `span² / arch`, so the span bought
          it back rather than the amplitude. Driven through the whole reared phase: **1.85**, against 2.50
          in the phases that do not rear — so this posture is the tightest the animal ever gets, which is
          what a rear should be. The turn of the skull is derived from these two numbers
          (`src/app/frame.ts`) and comes out at **23 degrees**, which is what actually reads as reared.
        */
        rear: { stand: 10, lunge: 0.3, arch: 6, span: 44 },
        /*
          ⚠️ **AND THE LIGHTNING PHASE SETS IT CRACKLING — 0305.** *"When the lightning attack phase
          starts it needs to get a super saiyan red lightning flicker through the aura and it's horns
          grow a bit longer again."* The same dark flame with red lightning forking through it on some
          frames and not others, so it flickers rather than glows; the horns twice their first length.
        */
        look: {
          face: {
            rest: SPRITE.boss8Horn3,
            restHit: SPRITE.boss8Horn3Hit,
            up: SPRITE.boss8Horn3Up,
            down: SPRITE.boss8Horn3Down,
            gape: SPRITE.boss8Horn3Gape,
            gapeHit: SPRITE.boss8Horn3GapeHit,
            shut: SPRITE.boss8Horn3Shut,
            shutHit: SPRITE.boss8Horn3ShutHit,
          },
          aura: {
            frames: [SPRITE.serpentStorm0, SPRITE.serpentStorm1, SPRITE.serpentStorm2, SPRITE.serpentStorm3, SPRITE.serpentStorm4, SPRITE.serpentStorm5],
            // A slow glow under the lightning since 0487, six steps a frame where the flames ran at three.
            hold: 6,
            stride: 1,
            head: 15,
            /*
              ⚠️ **AND THE LIGHTNING RUNS ALONG THE ANIMAL — 0487.** Three bolts over two to five nodes each,
              re-rolled every twelve steps and lit for ten of them: 0310's *five frames of six* kept as the
              share of a bolt's life it is alight, and the crackle crawls as each one lands somewhere new.
            */
            storm: { bolts: 3, span: [2, 5], every: 12, lit: 10 },
            /*
              ⚠️ **AND THE CROWN FLARES BEFORE A STRIKE — 0310.** Three frames on the same three-step hold
              the flames run at, so the discharge crackles at the rate the rest of the animal does rather
              than at a rate of its own. Held for the thirty steps before the bolt lands, which is
              `src/app/frame.ts`'s arithmetic off the bolt's own warning clock and not a second timer.
            */
            flare: [SPRITE.serpentFlare0, SPRITE.serpentFlare1, SPRITE.serpentFlare2],
          },
        },
        shot: null,
        /*
          ── AND THE SPRAY AND THE FAN BECOME ONE BALL — 0311 ────────────────────────────────────────

          ⚠️ **REPORTED**: *"the acid splash and void orb attacks need to change at the lightning phase,
          currently they go on for too long and get boring → they need to change to a combined acid/void
          ball."* Both heads went. The sweep threw **twenty-one** globes over a second and the void head
          three more, so two of every three volleys in the last third were twenty-four bullets the player
          could only wait out — and *boring* is a stretch of a fight where nothing they do changes what is
          coming.

          ⚠️ **ONE BALL AND THE LIGHTNING, SO THE ROUND IS TWO HEADS AND NOT THREE.** It alternates:
          something to shoot, then something to dodge. A `ring` of one is how it is thrown as a single
          object — the phase's `shots` is 3, which a `spray` would spend on three balls.
        */
        attack: {
          kind: 'heads',
          heads: [
            /*
              ⚠️ **THE BALL SOUNDS LIKE THE VOID AND ITS BURST LIKE THE ACID — 0308's cues, 0311's
              object.** A heavy dark thing leaving the mouth is the wumms; sixteen acid droplets
              spraying out of it is the sizzle. So one object gets two moments the player can tell
              apart, out of cues that already exist, and `burstMaw` in `src/app/frame.ts` names the
              second.
            */
            { shot: 'maw', attack: { kind: 'lob' }, cue: 'bossVoid', gap: 42 },
            /*
              ⚠️ UNTOUCHED, AND SAID TWICE TWO PLAYS APART: *"don't change the lightning attack it's
              really good."* It is the one attack on this boss with a verdict already in.

              ⚠️ **AND `cue` IS NOT A CHANGE TO IT — 0308.** The strike, the column and the 45-step
              warning are 0248's and are untouched; what this says is that it no longer falls out of
              the sky making the same noise as a mouthful of acid.
            */
            { shot: 'void', attack: { kind: 'rain', warning: 45, halfWidth: 4 }, cue: 'bossBolt' },
          ],
          /*
            ⚠️ **AND AT EVERY TENTH BELOW 0.4, ONE MORE BALL IN THE ROUND — 0365.** *"For the final phase
            with the combined orbs, add additional orb fire at every 10% of health."* Ball, strike above
            0.3; ball, ball, strike under it; three balls under 0.2 and four under 0.1 — the ball's share
            of the volleys goes a half, two thirds, three quarters, four fifths. `Grow` has why it is
            this and not four phases.

            ⚠️ **THE LIGHTNING COMES ROUND LESS OFTEN FOR IT, AND THAT IS THE PRICE OF THE ASK.** Each
            extra ball is one volley and its own 42 steps of room between strikes. The strike itself —
            the column, the warning line, the *"don't change it"* attack — is untouched.
          */
          grow: { every: 0.1, head: 0 },
        },
      },
    ],
  },
  /**
   * The Ember Nebula's end: **the flying fish** — 0249 built it, and
   * `docs/decisions/0312-the-eagle-was-always-a-fish.md` renamed it.
   *
   * ⚠️ **IT WAS `hellkite`, THE HELL-SPAWNED EAGLE, AND THE ART DECIDED OTHERWISE.** Reported: *"I'm
   * changing it from an eagle to a flying fish style boss as the art currently looks more fishy than
   * birdy."* So the fiction moved to the drawing rather than the drawing to the fiction, which is
   * `docs/decisions/0020-the-fiction-transfers-the-code-does-not.md`'s own direction of travel —
   * *rename it, reshape it, improve it.* **The hull is not repainted here**: the player's own
   * observation is that it already reads as a fish, and a repaint nobody asked for would be this
   * decision doing the opposite of what it was told.
   *
   * ⚠️ **`volans` IS THE FLYING FISH — the southern constellation** — which is the naming a place made
   * of stars already uses: Jörmungandr, the quetzal, the hydra, the medusa. The decisions that built
   * this animal keep their filenames, because a decision is the record and renaming one is rewriting
   * history (0029); their prose says *eagle* and is true of what was decided then.
   *
   * ⚠️ **FOUR STAGES SINCE 0380, AND EVERY ONE THROWS AND CALLS.** It opens kindled, raking seven
   * spines with kites out of its mouth; at 72% it is ablaze, dumping kites on the volley while the
   * shoal comes out under them; at 46% the field empties for the breaker, which rises anywhere
   * along the near edge after a half-second tell; and at 22% it is white-hot, leaping out through
   * the edge and back across the screen every six seconds between whips of flame. *"Hordes of flying
   * kites and raptors as adds at various points throughout the fight"* — the points are the stages,
   * and the play of 2026-09-27 chose which two led.
   *
   * ⚠️ **AND IT BREACHES IN — `docs/decisions/0313-the-fish-breaches.md`.** *"Needs a flashy
   * entrance."* Up through the near edge of the lane, three leaps across the whole screen that each go
   * higher than the last, and back down through it — a thing a fish does and a snake cannot, which is
   * the brief's *"the style is what makes the different bosses unique."*
   *
   * ⚠️ **AND IT SPITS ITS ADDS — `docs/decisions/0373-the-fish-spits-its-adds.md`.** *"Adds should
   * fly out of its mouth to attack the player, adds should be firing and way more interactive."* Every
   * horde this row calls is `from: 'mouth'`: the jaw opens, and the minnows or the kites leave the
   * snout in a fan thrown at the player, hunting and firing from the moment they are out. The shoal
   * that swam TO the fish (0314) is gone with the feed it carried — the player was not seeing the
   * trade, and a body coming out of the boss at them is the interaction the ask names.
   *
   * ⚠️ **AND IT SWIMS — `docs/decisions/0374-the-fish-beats-its-tail.md`.** The caudal fin is a body
   * of its own behind the hull, beating about the peduncle, and the hull yaws against it.
   */
  volans: {
    points: 25000,
    // THE ONE END BOSS THAT STALKS — 0258. *"We need less enemies (and bosses) reacting to the
    // player"*: the fish hunts, and every other hull flies a pattern. Its spines are a fan that
    // rakes across the lane — 0262, *"the bullet attacks were boring"* — so what reacts is where
    // it is and not where it points, and the fan is a pattern that sweeps.
    move: { kind: 'stalk', agility: 0.22 },
    // An arc since 0317: the sweep stays within 1.4 radians of the lane instead of walking round the
    // circle, so the fan is pointing at the player's half of the world rather than at the wall.
    attack: { kind: 'rake', turn: 0.5, arc: 1.4 },
    uncoil: null,
    fall: null,
    chill: null,
    /*
      ⚠️ **ITS MOUTH, WHICH ITS ADDS ALREADY LEFT — 0452.** 0373 put the kites and minnows in the jaw at
      0.92 of the drawing's radius, a shade inside the lip; the spines and the whip went on leaving the
      belly, nineteen units back, while the face gaped for them. One mouth now, and `mouthAlongOf` in
      `src/app/frame.ts` reads it here.
    */
    muzzle: { along: -19.3, across: 0 },
    chain: null,
    /*
      ⚠️ **THE SECOND CREATURE TO WEAR ONE — 0319, and `Face` was written for exactly this.** 0285 put
      the type on the ROW rather than on the chain, and said the day a second creature could not wear
      it is the day the type was wrong. It can: `wearFace` runs for every boss and returns early on a
      `null` face, so the fish tracking the ship, gaping before a volley and snapping at one that
      crosses it is six bakes and this literal, with no mechanism added
      ([0282](../../docs/decisions/0282-a-mechanism-for-every-instance-makes-them-one-instance.md)).

      ⚠️ **AND IT MATTERS MOST ON THIS BOSS**, because the fish is the one end boss that stalks onto
      the player's lane ([0258](../../docs/decisions/0258-one-pilot-a-level.md)) — it is the boss the
      player spends the whole fight looking straight at, and until now it looked back with a fixed
      stare. *"It still feels like a non-interactive wall object"* is 0285's own report, and nothing
      about it was specific to a serpent.
    */
    face: VOLANS_FACE,
    /*
      A BREACH — 0313. `from` 176 is inside the leading edge of the NARROWEST view any device gets
      (177.8), so all three crests are on the screen everywhere — 0023, and the guard reads the view
      rather than trusting this sentence. Three spans of 59 carry it a unit past the trailing edge.
      34 rising by 1.4 crests at 34, 47.6 and 66.6 past the edge, so the furthest the hull's top ever
      gets is 18 units short of the far side of the lane — which is the place to be, and
      `tests/volans.test.ts` parks a live ship in it for the whole flight.
    */
    entrance: { kind: 'breach', surface: ACROSS_SPAN, from: 176, leaps: 3, span: 59, height: 34, rise: 1.4, speed: 1.2 },
    /*
      THE TAIL — 0374, re-tuned by 0381. Rooted 16 units aft of the hull's centre, which is 0.76 of the
      drawing radius (`SPRITE_EXTENT.boss9` is 50 across, so the radius the painter draws in is 21):
      the peduncle the caudal fin used to be painted onto. A beat every 32 steps, sweeping 0.34 radians
      each way — under two beats a second, slower and shallower than 0374's, because the play called
      the quicker beat *"funky and weird"* and a flying fish glides more than it swims. **No yaw**: the
      whole animal turning against its fin read as a picture wobbling, not a body flexing.
    */
    tail: { art: VOLANS_TAIL, root: 16, beat: 32, sweep: 0.34, yaw: 0 },
    room: null,
    burn: null,
    wreck: null,
    /*
      ⚠️ **OFF ITS FLANKS, NOT ITS FACE — 0514.** Its face is turned to the ship and is the mouth its
      adds leave by (0373), so 0480's embers off the facing rim came out of the jaw at the player and
      were taken for adds: tiny ones that never fire. Off a side and away from the ship, they read as
      the fins burning, and the mouth is the adds' alone.
    */
    shed: { sprite: SPRITE.shedEmber, from: 'flank' },
    sprite: SPRITE.boss9,
    spriteHit: SPRITE.boss9Hit,
    // Grown with the drawing in 0381 (42 → 50 across): the same share of the tile it always was.
    radius: 18,
    // Doubled by 0260, from 760. 1400 from 1300 — 0441: flown at the true cap in each gun's own ship
    // (`scripts/weigh-boss.mjs`), the arc and the ray took it in 38 s, under 0260's forty.
    // ⚠️ 1450 FROM 1400 — 0478: the leap is back on the screen and on station in two and a half seconds,
    // so every gun reaches it for longer, and all four took it under forty (39.3, 38.4, 39.1, 40.0).
    // Health is the one lever that moves all four; the pterodactyl goes to 1460 to stay the tougher.
    health: 1450,
    /*
      ⚠️ **THE ARC AT 1.3, THE SHURIKEN AND THE RAY AT 0.95 — 0477, the arc moved by 0478.** Its leap is
      a target, so the four seconds a leap used to be free are a fight: the arc took it in 35.5 s, the
      shuriken in 38.9 and the ray in 39.2 against 0260's forty, with the pulse at 41.1. The guns that
      fell furthest are weighted, on the pterodactyl's pattern (0441).
    */
    gunWeights: { arc: 1.3, shuriken: 0.95, ray: 0.95 },
    damage: 3,
    station: 155,
    drift: 5,
    driftWavelength: 180,
    patrol: 0.4,
    // Its own bullet since 0262 — *"the bullets need to be feathered quills"* — where it threw the
    // lancer's lance; a barbed fin-spine since 0316, point first, in the enemy's ink. The place on the
    // ladder, the speed and the hurtbox are 0262's; what changed is that the animal is not a bird.
    shot: 'spine',
    phases: [
      /*
        ── FOUR STAGES — `docs/decisions/0380-the-fish-has-four-stages.md` ──────────────────────────

        Played: *"last stage is great, it should be stage 2, the stage before it should be stage 1 and
        we need a new stage 3 and four."* So the two stages the play liked are the first two, in that
        order, and the fight opens ALREADY KINDLED and throwing and calling from its first second —
        0317's opening and 0320's cold first half are gone with the three stages that held them. The
        breaker and the whip come back as the two new stages' bones, each with a thing it did not have.

        ⚠️ **STAGE ONE — a fan of seven and the kites, kindled.** 0262's rake on 0314's clock, out of
        the mouth (0373). It goes on burning from the first frame: a look that switched on between two
        stages would read as the fire catching, which this fish has already done by the time it arrives.
      */
      { upTo: 1, fireEvery: 54, shots: 7, spread: 1.1, patrolScale: 1.3, stance: { kind: 'volley' }, look: KINDLED, shot: null, attack: null, escort: { enemy: 'kite', count: 3, formation: 'vee', from: 'mouth', standing: 5, every: 150 } },
      /*
        ⚠️ **STAGE TWO — BOTH MECHANISMS AT ONCE, ABLAZE, WHICH IS THE ONE THE PLAY CALLED GREAT.** The
        volley dumps a wave of kites — the attack, all at once, on the fire grid — while the escort
        keeps the shoal coming out of the mouth underneath it on its own faster clock. The fins have
        risen (0320): eight faces on a second body, and the ember behind it half again as big.
      */
      { upTo: 0.69, fireEvery: 48, shots: 7, spread: 1.1, patrolScale: 1.8, stance: { kind: 'volley' }, look: ABLAZE, shot: null, attack: { kind: 'summon', enemy: 'kite', count: 3, formation: 'line', from: 'mouth', standing: 6 }, escort: { enemy: 'minnow', count: 3, formation: 'line', from: 'mouth', standing: 4, every: 108 } },
      /*
        ⚠️ **STAGE THREE — THE BREAKER, ANYWHERE, WITH A TELL — and the field empties.** 0315's wave up
        off the near edge, which rose where the fish was (the far half of the screen, on a boss that
        stalks the player's lane) and was answered by standing still; it `roams` now — its centre drawn
        on the breaker's own stream anywhere the narrowest screen shows the whole span — and it
        `warning`s: the five spines stand in the edge with their tips showing for half a second before
        they rise. A span of 60 against a narrowest view of 213, so there is always lane to stand on;
        a wave every 42 steps with the tell's thirty on top of that, because a later stage fires
        STRICTLY faster than the one before it (`tests/difficulty.test.ts`) and the stage before is
        at 48; five to a wave rather than seven so two waves in the air is a field and not a wall.
        No horde under it, on 0317's own finding: a stage with nothing on the field but the wave and the
        fish is what makes the wave readable and the kites read when they come back.
      */
      { upTo: 0.44, fireEvery: 42, shots: 5, spread: 0.8, patrolScale: 2, stance: { kind: 'volley' }, look: ABLAZE, shot: null, attack: { kind: 'breaker', span: 60, rise: 1.5, ends: 0.66, roams: true, warning: 30 }, cue: 'bossBreach' },
      /*
        ⚠️ **STAGE FOUR — IT LEAPS, WHITE-HOT, WHIPPING FLAME.** Every six seconds it dives into the
        near edge and leaps out through it twice and back onto its station (0478), a target the whole
        way (0477) — the one thing a flying fish does that no other boss can — and goes back to the whip
        of flame (0249's lash, the tip quicker than the root: half as quick again since 0479, where it
        was nearly twice) with a pair of kites out of its mouth between leaps. The look is `BLAZING`: the same fire in the ember's own
        core inks, the crown bigger and the flicker quicker — one fire at a higher temperature, which
        is what a fourth stage after *ablaze* has left to be.
      */
      { upTo: 0.15, fireEvery: 36, shots: 5, spread: 1.1, patrolScale: 2.2, stance: { kind: 'volley' }, look: BLAZING, shot: 'flame', attack: { kind: 'whip', sweep: 1.3, reach: 0.5 }, escort: { enemy: 'kite', count: 2, formation: 'vee', from: 'mouth', standing: 4, every: 120 }, leap: { first: 150, every: 360, dive: 36, arcs: [28, 40], span: 36, speed: 1.2, depth: 8, back: 54 } },
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
   *
   * ⚠️ **FEATHERED, BEATING ITS WINGS, AND ARMED WHERE THE PLAYER CAN SEE IT — 0398.** *"It needs
   * feathers, lazer cannon when it opens it's mouth to fire, shoulder mounted lazers for when it fires
   * two and three … the initial bullet firing needs to be shooting feathered quills from it's wings."*
   * The quills leave the wings, two a wing; the wing beams leave cannons on its shoulders, eleven units
   * out where they were eighteen, because that is where a shoulder is; and the mouth's beam leaves a
   * cannon in its throat that the beak opens on. Each stage's face lights the thing about to fire.
   */
  quetzal: {
    points: 30000,
    // Eased into every turn and brace — 0483: a bird that stops dead and reverses dead does not fly.
    move: { kind: 'patrol', ease: 24 },
    attack: { kind: 'spray', from: WINGS },
    uncoil: null,
    // The volcanoes — 0251: two rocks every second and a half, from the top of the screen, through
    // the whole fight.
    fall: { kind: 'shot', shot: 'rock', every: 90, count: 2, from: 1 },
    chill: null,
    muzzle: null,
    chain: null,
    face: QUETZAL_FACE,
    entrance: null,
    tail: null,
    room: null,
    burn: null,
    wreck: null,
    shed: { sprite: SPRITE.shedFeather, from: 'facing' },
    sprite: SPRITE.boss10,
    spriteHit: SPRITE.boss10Hit,
    radius: 15,
    // Doubled by 0260, from 820. 1410 from 1390 — 0441: over the fish's new 1400, because a later boss
    // is a tougher one (`tests/level.test.ts`); its quickest gun is held by the arc's weight below.
    // 1460 from 1410 — 0478, over the fish's 1450 for the same reason; a fight a few percent longer.
    health: 1460,
    /*
      ⚠️ **THE LIGHTNING AT 1.1 HERE, NOT ITS 1.5 — 0441, on the serpent's own pattern (0372).** Flown
      at the true cap, the arc took this animal in 30 s against 0260's forty, while the pulse took 99:
      the bird patrols the lane at 150 out, where the pulse's four-barrel fan is wider than its body and
      the ray's one ring is off its line half the time, and the arc cannot miss. Health would have fixed
      the arc and made every other ship's fight a third longer, so the player chose the arc's weight.

      ⚠️ **AND THE RAY AT 0.82 — 0483.** Eased, the bird hangs at every turn and slows to a hover before
      each beam, and the ray's pursuit (`weigh-boss`, on its lane at 45) took it in 35 s from 46. Every
      held lane got slower — a leaning, easing hull is harder to sit under — so health would have
      lengthened the fights that already grew, and the weight is the gyre's own answer (0475).
    */
    gunWeights: { arc: 1.1, ray: 0.82 },
    damage: 3,
    station: 154,
    drift: 6,
    driftWavelength: 160,
    patrol: 0.55,
    // Leaning a sixth of a right angle into the slide at full speed — 0483, level at every brace.
    bank: 0.26,
    // A feathered quill since 0398, where it threw the lancer's lance.
    shot: 'quill',
    phases: [
      // Four quills, two off each wing — 0398: three shared between two wings would throw lopsided.
      { upTo: 1, fireEvery: 72, shots: 4, spread: 0.5, patrolScale: 1, stance: { kind: 'volley' }, look: { face: QUETZAL_FACE, aura: beating(6) }, shot: null, attack: null },
      // The shoulder cannons: 0.3 s of warning, 0.4 s of beam, three units wide each.
      { upTo: 0.75, fireEvery: 60, shots: 3, spread: 0.5, patrolScale: 1.5, stance: { kind: 'volley' }, look: { face: QUETZAL_SHOULDERS, aura: beating(5) }, shot: null, attack: { kind: 'beam', warning: 18, hold: 24, halfWidth: 1.5, from: [LEFT_CANNON, RIGHT_CANNON], jag: QUETZAL_PAIR } },
      // The throat cannon: half a second of warning, half a second of beam, twelve units wide.
      { upTo: 0.5, fireEvery: 54, shots: 5, spread: 0.9, patrolScale: 2, stance: { kind: 'volley' }, look: { face: QUETZAL_MOUTH, aura: beating(5) }, shot: null, attack: { kind: 'beam', warning: 30, hold: 30, halfWidth: 6, from: [THROAT], jag: QUETZAL_ONE } },
      /*
        Everything: the throat and both shoulders, on the mouth's timing, each five units wide. 0398
        brought the shoulders in from eighteen to eleven, so what the three leave between them is two
        gaps of six units rather than two of thirteen — a thing a player can thread and not be sure of,
        with open lane either side of the brace for the player who would rather go round.
      */
      { upTo: 0.25, fireEvery: 48, shots: 7, spread: 1.3, patrolScale: 2.4, stance: { kind: 'volley' }, look: { face: QUETZAL_EVERYTHING, aura: beating(4) }, shot: null, attack: { kind: 'beam', warning: 30, hold: 30, halfWidth: 2.5, from: [LEFT_CANNON, THROAT, RIGHT_CANNON], jag: QUETZAL_FAN } },
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
    points: 35000,
    /*
      ⚠️ **SET INTO THE PLACE SINCE 0332** — *"when it appears on screen I want it 'locked' into the
      background like a cog set into an image."* It closes on the lane's centre and stops there, and
      its `drift` below is zero to match: a cog in a wall does not slide along the wall either.

      ⚠️ **AND THE FIGHT IS THE WALLS NOW, WHICH IS THE TRADE THIS TAKES.** A hull that holds still
      is a hull the player can always hit, so what makes this fight is the eight walls and the rate
      they quicken at — which is what the brief asked to see in the first place. The rake still
      sweeps its fan across the lane over the top of them.
    */
    move: { kind: 'socket', at: ACROSS_SPAN / 2, seat: SPRITE.boss11Seat },
    attack: { kind: 'rake', turn: 0.4 },
    /*
      An eighth of a turn a throw — 0252, and eight stances since 0332: the cog's spike is aimed at
      the edge the next wall comes in over, and it ticks round one point every time it throws.

      From nine tenths since 0260 — *"the walls were really good but started too late in the
      sequence, they need to start sooner"* — so the first wall is the first notch of the fight
      rather than its second half.

      ⚠️ **AND THEY QUICKEN — 0332**: *"the walls and turns come faster as it gets more hurt."* A
      tenth of the bar between the first two, 0.88 of that between the next two, and so on down to a
      floor of a twenty-fifth. Over the nine tenths this row spends that is **seventeen walls** where
      0260's flat tenth gave nine, and the last of them stand two and a half times closer together
      than the first — so the cog goes round twice and finishes faster than it started.

      ⚠️ **THE FLOOR IS SIZED AGAINST THE WALL, NOT PICKED.** 0.04 of 1760 health at the gyre's own
      damage rate is about four seconds between walls, and a wall across the lane takes two and a
      half to reach a ship at the back of its box — so the tightest pair the ladder can produce still
      clears the screen before the next one is thrown.
    */
    /*
      ⚠️ **AND TWO AND A HALF SECONDS BETWEEN WALLS, WHICH IS THE ONLY ROW THAT NEEDS ONE — 0333.**
      0332's ladder bills the walls in health, and a shuriken at four rungs crosses four notches a
      second: seventeen walls tried to stand in a ten-second fight and **thirteen of them arrived
      broken**, because `enemyShots` holds 150 and this row's longest wall is 45. 150 steps is the
      value that comes back with **zero walls short in all ten gun-by-tier cells**
      (`scripts/weigh-walls.mjs`); 120 leaves one and 90 leaves three. What a fast gun sees now is
      fewer walls and all of them whole, which is the trade 0040 already makes about a short fight.
    */
    // `at` 26 → 31 with 0364's zoom, on the chorus's terms.
    // Its hole per stance, `GYRE_HOLES` — 0501.
    uncoil: { from: 0.9, every: 0.1, gap: 3, at: 31, atBy: GYRE_HOLES, hole: 14, spin: true, quicken: { by: 0.88, least: 0.04 }, apart: 150 },
    fall: null,
    chill: null,
    muzzle: null,
    chain: null,
    face: null,
    entrance: null,
    tail: null,
    /*
      ⚠️ **THE ONE ROOM IN THE GAME — 0335.** *"The cog is part of the wall and stationary on arrival
      … the background map stops moving — you've found the boss and are fighting it in a specific
      room."* The camera comes to rest sixty units short of the fight's authored distance, which puts
      the cog on its station and stops it there with everything else; the mouth is forty behind the
      resting camera, so the room's open side — the way the player came in — is just off the trailing
      edge and the two side walls run the whole screen.

      ⚠️ **AND IT IS THE END BOSS'S AND NOT THE LATTICE'S**, which shares this level: stopping the
      level at its halfway point is a different decision and nobody has asked for one. 0282 — a row
      says whether it is fought in a room, and twelve of the fourteen say no.
    */
    room: { stand: 60, settle: 150, mouth: 40, wall: SPRITE.roomWall, opens: 90 },
    /*
      ⚠️ **IT CATCHES AT THREE QUARTERS AND IS AN INFERNO BY THE END — 0336.** *"Updated damage
      graphics for it as it gets hurt and set on fire."* Two flames when the first phase turns over
      and seven when the bar is empty, so the fire is something the player watches take hold. They
      stand at 22 units, which is the cog's own tooth circle, in the layer behind it — what shows is
      the licking past its rim.
    */
    burn: { from: 0.75, frames: [SPRITE.gyreFire0, SPRITE.gyreFire1, SPRITE.gyreFire2, SPRITE.gyreFire3], hold: 5, least: 2, most: 7, radius: 22 },
    /*
      ⚠️ **IT FALLS OUT OF THE WALL RATHER THAN EXPLODING — 0337.** *"When it dies, instead of
      exploding, have it fall out of the wall and crash down into the floor."*

      ⚠️ **THE GRAVITY IS SIZED AGAINST THE DROP AND NOT PICKED.** Its seat is at the lane's middle
      and the floor is 44 units below the hull's rim; at 0.022 a step that is **about two seconds**
      of falling, which is long enough to watch and short enough not to be a wait. It tumbles a
      fifteenth of a radian a step — half a turn on the way down, so it is visibly out of control
      rather than sliding.

      ⚠️ **AND A SECOND LYING THERE BEFORE THE WALL MOVES**, because the crash and the way out are two
      beats and running them together makes the first one a transition.
    */
    /*
      ⚠️ **AND IT CAN BE KILLED — 0475**, at the share `scripts/weigh-wreck.mjs` measured to the
      player's line: one bomb, the first missile tube and the gun at full autofire kill it inside its
      window at Savior; the gun and the tube alone do not.
    */
    wreck: { gravity: 0.022, tumble: 0.065, wreckage: SPRITE.boss11Wreck, wreckageHit: SPRITE.boss11WreckHit, settle: 60, health: 0.22 },
    shed: { sprite: SPRITE.shedTooth, from: 'facing' },
    sprite: SPRITE.boss11,
    spriteHit: SPRITE.boss11Hit,
    // 14 until 0332, on an extent that went 36 → 52. `src/content/sprites.ts` has both numbers and
    // what 0101 says about the near end of a swing that no longer swings.
    radius: 20,
    // Doubled by 0260, from 880.
    health: 1500,
    /*
      ⚠️ **THE LIGHTNING AT 1.2 AND THE RAY AT 0.82 — 0475, on the pterodactyl's pattern (0441).** Every
      gun's fight with this animal was read eight and a half seconds long, because the instrument ended
      it when the pool emptied and the wreck lies in the pool after the death. Read at the death, the
      arc killed it in 32.5 s and the ray in 35.8 against 0260's forty, while the pulse and the shuriken
      took 40.2. The weights put both at 40.6–40.7 and leave the other two where they were.
    */
    gunWeights: { arc: 1.2, ray: 0.82 },
    damage: 3,
    station: 156,
    // ⚠️ **ZERO SINCE 0332**, and it is the `socket` move's other half: a hull that holds one place
    // across the lane and slides along it is not set into anything. 0061's *a boss keeps flying* is
    // answered here by the walls rather than by the hull — there are seventeen of them.
    drift: 0,
    driftWavelength: 220,
    // What it closes on its seat at, and nothing after that: the `socket` arm stops at `at`.
    patrol: 0.45,
    // Its own, since 0494: it threw the raiders' slab.
    shot: 'tooth',
    /*
      ⚠️ **AND EACH PHASE WEARS ITS OWN DAMAGE — 0332**: *"have it change as it gets more damaged."*
      Whole, then chipped, then broken, then burnt — the same rungs the fan escalates on, so the body
      says what the volley is about to do.

      ⚠️ **AND THE RUNGS ARE 0.75, 0.5 AND 0.25 BECAUSE THE PINWHEEL ASKED FOR THOSE NUMBERS — 0336.**
      *"At 75%, 50%, 25% health the cog pops out and spins."* Three health shares and three phase
      boundaries are one ladder or they are two that drift, so the phases moved to meet the ask and
      **the wheel is what a phase turning over LOOKS like**: the cog rises out of its seat, sprays a
      turning spoke of fire, sinks back — and comes back a body more broken and more alight. The old
      0.7 and 0.4 were never argued for beyond *three phases*; these three are.
    */
    phases: [
      { upTo: 1, fireEvery: 78, shots: 3, spread: 0.7, patrolScale: 1, stance: { kind: 'volley' }, look: null, shot: null, attack: null },
      /*
        ⚠️ **THE WHEEL, AND EVERY NUMBER ON IT IS ARGUED FROM THE SCREEN — 0295.** Three tenths of a
        second up, **a second of spray and then a second and three quarters at the last one**
        (*"for a second or two"*), three tenths back down. It grows by a quarter, which reads as
        coming at the player and keeps `station − radius` at 105 against 0101's floor of 98. It spins
        at 0.16 a step — two and a half turns while it is up — so the wheel is visibly a wheel.

        ⚠️ **AND THE LENGTH IS SIZED AGAINST THE WALLS RATHER THAN AGAINST THE PICTURE, WHICH A
        MEASUREMENT DECIDED.** No wall may be thrown while the hull is free-spinning (0336), so every
        step of a wheel is a step of the fight the walls do not get. At two and a half seconds each,
        three wheels filled **eight of the nine seconds** a shuriken at four rungs takes, and the
        gyre threw ONE wall in its whole fight; `scripts/weigh-walls.mjs` is where that is read. At
        these lengths it throws four. **A nine-second fight still cannot hold both** — see the
        decision — but it is a fight rather than a cutscene.
      */
      { upTo: 0.75, fireEvery: 66, shots: 5, spread: 1, patrolScale: 1.3, stance: { kind: 'volley' }, look: null, shot: null, attack: null, hull: { rest: SPRITE.boss11Chipped, hit: SPRITE.boss11ChippedHit }, wheel: { rise: 18, spray: 66, sink: 18, swell: 1.25, spin: 0.16, arms: 2, every: 4, turns: 1.5, shot: 'flame' } },
      { upTo: 0.5, fireEvery: 60, shots: 7, spread: 1.3, patrolScale: 1.7, stance: { kind: 'volley' }, look: null, shot: null, attack: null, hull: { rest: SPRITE.boss11Broken, hit: SPRITE.boss11BrokenHit }, wheel: { rise: 18, spray: 84, sink: 18, swell: 1.3, spin: 0.18, arms: 3, every: 5, turns: 1.75, shot: 'flame' } },
      /*
        ⚠️ **THE FAN HERE IS THE THIRD PHASE'S AND NOT A HARDER ONE, AND `tests/crowd.test.ts` IS
        WHY.** A fourth phase wanted a fourth rung of fan, so this row first carried 48 steps, seven
        shots and a spread of 1.6 — and at `savior` there was **a step with nowhere on the lane both
        safe and reachable** (0270's fairness floor, which is not a taste and not a tier's business).

        ⚠️ **AND THE WHEEL WAS NOT THE CULPRIT, WHICH TAKING IT APART IS THE ONLY WAY TO KNOW.** The
        spokes were thinned from three to two first and the floor stayed broken; the fan put back to
        54/7/1.4 cleared it with three spokes intact. **What escalates over these three wheels is the
        spray's length, the spin and how far it comes out of the wall** — the fan had run out of room
        two phases ago and nobody had measured it.

        ⚠️ **SO THE THIRD PHASE'S FAN EASED BACK TO MAKE ROOM FOR THIS ONE**, because the ladder still
        has to escalate: `tests/level.test.ts` holds that every phase fires faster than the last, and
        with both of these at 54 it does not. 78, 66, 60, 54 is the ladder, and the fourth rung is the
        fastest fan this fight has ever had rather than a new one on top of it.
      */
      { upTo: 0.25, fireEvery: 54, shots: 7, spread: 1.4, patrolScale: 2, stance: { kind: 'volley' }, look: null, shot: null, attack: null, hull: { rest: SPRITE.boss11Burnt, hit: SPRITE.boss11BurntHit }, wheel: { rise: 18, spray: 102, sink: 18, swell: 1.35, spin: 0.2, arms: 3, every: 5, turns: 2, shot: 'flame' } },
    ],
  },
  /**
   * The Rime Shelf's end: the frost ship.
   *
   * It tracks the player's lane and lays a wall across it. Owed: frost bolts and frost blasts, the
   * cold that slows and freezes a ship that comes too close, and its adds.
   *
   * ⚠️ **A CLUSTER OF ICE SINCE 0399** — *"a large crystalline structure … high tier graphics to match
   * the other bosses that we've uplifted."* A keel of ice with spires grown off it, a red heart frozen
   * in its core, and its cold drawn round it.
   */
  hoarfrost: {
    points: 40000,
    // A patrol since 0258: the cold is on the row and the hull flies a pattern through it, so the
    // fight is to be where the ship is not going rather than to get out from in front of it.
    // `patrol/wall` rather than `bob/wall`, which is the serpent's pair among the real bosses.
    move: { kind: 'patrol' },
    attack: { kind: 'wall', gap: 10 },
    uncoil: null,
    fall: null,
    /*
      The cold — 0253: half speed inside it, frozen for half a second after three quarters of one
      inside.

      ⚠️ **THIRTY-EIGHT SINCE 0399, AND WHAT IS KEPT IS THE SEVENTEEN.** The hull grew from a 13-unit
      hurtbox to 21, and the cold that reached 17 units past the old one would have reached 9 past the
      new — a ring the crystal's own spires would cover. What the player flies in is the band between
      the cold's edge and the hull, so the band is what stays.

      ⚠️ **AND IT IS SEEN** — 0399: a haze, and three rings of flakes twirling at different rates, the
      inner quickest. Every layer's edge is `radius`.

      ⚠️ **38 → 46, AND IT PULSES OUT TO 108 EVERY TEN SECONDS — 0459.** *"Pretty at the moment but has
      no game effect at all as it's too small"*: a fifth larger at rest, then swelling over nine and a
      fifth seconds until it covers the lane from top to bottom and everything down-lane of 44 at the
      nearest of its drift — three quarters of a 16:9 screen and more — then lit, dark, lit and dark a
      fifth of a second each, and out.

      ⚠️ **130, OVER WHERE THE SHIP STARTS, AND THE CORNERS ARE THE ANSWER — 0484.** 0459 held it at 108
      so the start at 40 stayed clear, and that kept the whole left of the screen clear with it: a cold
      the player never had to move for. Played: *"as long as the player has safe space at the top left
      and bottom left of the screen, it can overlap the 'starting' space."* The cold is a circle, so the
      back corners are where it is furthest; 130 is solved for a pocket a fifteenth of the lane in from
      each, with the hull at the top of its patrol crowding the top one. *Fall back to a corner*, and
      never *there is nowhere*.

      ⚠️ **OUT IN SIX AND A HALF SECONDS, BACK IN TWO AND A HALF, ONE AT REST — 0471.** *"It should
      pulse out, retract and pulse again like a proper pulse."* 0459's strobe and its one-step jump
      back to 46 are gone; the cold now draws back across the screen as visibly as it came. A ship
      80 from the hull — most of the way down the lane — is inside it for 4.2 s of each pulse, against
      0459's 4.7, because the retract keeps it there on the way back.
    */
    chill: {
      radius: 46,
      reach: 130,
      pulse: 600,
      swell: 390,
      retract: 150,
      slow: 0.5,
      freezeAfter: 45,
      frozenFor: 30,
      // The mist, swelled to the radius: a gradient enlarging is what a mist spreading looks like — 0481.
      field: [{ sprite: SPRITE.chillHaze, spin: -0.0025 }],
      // And the flakes riding out on it at their own size, ten on the rim and six inside — 0481.
      rings: [
        { sprite: SPRITE.chillPatch, at: 0.9, count: 10, spin: -0.006 },
        { sprite: SPRITE.chillPatch, at: 0.45, count: 6, spin: -0.013 },
      ],
    },
    muzzle: null,
    chain: null,
    face: null,
    entrance: null,
    tail: null,
    room: null,
    burn: null,
    wreck: null,
    shed: { sprite: SPRITE.shedIce, from: 'facing' },
    sprite: SPRITE.boss12,
    spriteHit: SPRITE.boss12Hit,
    // 21 since 0399, from 13: the same share of a drawing grown from 33 to 54.
    radius: 21,
    // Doubled by 0260, from 940. 1800 from 1600 — 0441: the arc at the true cap took it in 36 s.
    health: 1800,
    damage: 3,
    station: 157,
    drift: 5,
    driftWavelength: 260,
    patrol: 0.3,
    shot: 'frost',
    /*
      ⚠️ **FOUR PHASES, AND THE COLD RUNS THROUGH ALL OF THEM — 0253.** *"Frost bolts and frost
      blasts … it needs some adds as well."* A wall of frost across the lane while whole — the
      bolts; a spray of them once hurt; at the lower half, shards called in pairs — the adds, the
      Rime Shelf's own enemy; and at the last fifth a wider, quicker spray.

      ⚠️ **THE BLASTS ARE WHAT EVERY SHARD BECOMES — 0263.** *"The frost attacks should explode
      into directional frost bullets, which explode into snowflake patterns."* A shard is two bolts
      and then twelve flakes (`src/content/shots.ts`), so the volleys here are counted in shards
      and small: the wall is one either side of the hull, the sprays two and then three, and the
      ring 0253 threw at the last fifth is gone — six shards that each open into twelve is a screen
      nobody can read. The adds come in from the sides on 0262's flank, and shatter where they die.

      ⚠️ **SLOWER, AS FAR AS 0260'S EIGHT VOLLEYS ALLOW — 0471.** *"The hydra level boss and rime
      shelf level boss and jellyfish level boss fire a bit too fast."* 84, 66, 60 became 90, 84, 72:
      at the tuned tier 66 and 54 steps became 72 and 66. The wall stays at 96 because the arc's
      forty-second fight ends its first phase at 7.99 volleys at 102. The last phase's volleys are
      held apart by the shard's own stagger, as they were.
    */
    phases: [
      { upTo: 1, fireEvery: 96, shots: 1, spread: 0, patrolScale: 1, stance: { kind: 'volley' }, look: null, shot: null, attack: null },
      { upTo: 0.74, fireEvery: 90, shots: 2, spread: 0.8, patrolScale: 1.2, stance: { kind: 'volley' }, look: null, shot: null, attack: { kind: 'spray' } },
      { upTo: 0.49, fireEvery: 84, shots: 2, spread: 0.8, patrolScale: 1.5, stance: { kind: 'volley' }, look: null, shot: null, attack: { kind: 'summon', enemy: 'shard', count: 2, formation: 'vee', from: 'sides', standing: 6 } },
      { upTo: 0.25, fireEvery: 72, shots: 3, spread: 1.2, patrolScale: 1.9, stance: { kind: 'volley' }, look: null, shot: null, attack: { kind: 'spray' } },
    ],
  },
  /**
   * The Toxic Mire's end: the hydra.
   *
   * ⚠️ **A head at every fifth of its health — 80, 60, 40 and 20 per cent — and every head is a
   * phase.** The ask gives each head its own attack: acid, then flame, then laser bolts, then
   * frost, then void — and since 0254 each is a `Head`, taking its turn a volley.
   *
   * ⚠️ **AND SINCE 0384 EVERY HEAD IS ON THE SCREEN, GROWN WITH ITS PHASE.** *"It's supposed to be a
   * hydra that grows extra heads and currently it looks like a weird mouldy enokki mushroom."* It
   * stands in the Mire's acid with its tail above it, and each phase a neck rises out of the acid in
   * the colours of the head on it: the serpent's own, then a fish after Ember Nebula's, a pterodactyl
   * after Saurian Belt's, an ice crystal after Rime Shelf's at 40% — and last, at 20%, a clockwork
   * head after the Labyrinth's cog, with a mouth and eyes and a dark aura. The player swapped the
   * heads rather than the attacks, so the frost is the ice's and the void the clockwork's.
   */
  hydra: {
    points: 45000,
    move: { kind: 'wade', sink: 2.5, heave: 2, wavelength: 240, pool: 34 },
    attack: { kind: 'spray' },
    uncoil: null,
    fall: null,
    chill: null,
    muzzle: null,
    chain: null,
    face: null,
    entrance: null,
    // Curling up out of the acid behind the body, and swinging slowly — on the fish's terms (0374).
    tail: { art: { sprite: SPRITE.hydraTail, spriteHit: SPRITE.hydraTailHit }, root: 21, beat: 200, sweep: 0.1, yaw: 0 },
    /*
      ── FIVE NECKS, A HEAD ON EACH — 0384 ─────────────────────────────────────────────────────────

      ⚠️ **ROOTED ALONG THE SHOULDERS AND FANNED UP AND FORWARD**, so the heads stand across the middle
      of the lane — lanes 35 to 85 with the body on a shore at 110 — where the player meets them and
      shoots them. Alternate reaches, long and short, so five heads on one body stand in two ranks
      rather than one row of skulls touching. Every head a hurtbox of 11.5, the anatomy's size (0283),
      and every hit on one reaches the hull whole: the heads are what the player fights.

      ⚠️ **EVERY LENGTH HERE, THE HULL'S AND THE TAIL'S, AND THE EXTENTS IN `sprites.ts` ARE 1.3 TIMES
      WHAT 0384 DREW** — *"can we make the hydra bigger?"* —
      `docs/decisions/0385-the-hydra-is-bigger-and-sprays-harder.md`. Scaled together, because a neck
      is drawn from its reach over its extent, and a head grown alone would stand off its own neck.
    */
    necks: {
      necks: [
        { root: { along: -9, across: -19.5 }, angle: -0.78 * Math.PI, reach: 44, art: SPRITE.hydraNeck0, artHit: SPRITE.hydraNeck0Hit, collar: SPRITE.hydraCollar0, collarHit: SPRITE.hydraCollar0Hit, head: SPRITE.hydraHead0, headHit: SPRITE.hydraHead0Hit, radius: 11.5, mouth: 12.5, livery: 'mire' },
        { root: { along: -17, across: -11.5 }, angle: -0.93 * Math.PI, reach: 41.5, art: SPRITE.hydraNeck1, artHit: SPRITE.hydraNeck1Hit, collar: SPRITE.hydraCollar1, collarHit: SPRITE.hydraCollar1Hit, head: SPRITE.hydraHead1, headHit: SPRITE.hydraHead1Hit, radius: 11.5, mouth: 12.5, livery: 'nebula' },
        { root: { along: 1.5, across: -20 }, angle: -0.55 * Math.PI, reach: 47, art: SPRITE.hydraNeck2, artHit: SPRITE.hydraNeck2Hit, collar: SPRITE.hydraCollar2, collarHit: SPRITE.hydraCollar2Hit, head: SPRITE.hydraHead2, headHit: SPRITE.hydraHead2Hit, radius: 11.5, mouth: 12.5, livery: 'saurian' },
        // The ice's: 36 from 28.5 — 0486, *"the ice head needs more neck"* — and turned into the gap between
        // the serpent's head above and the fish's below, a neck's length from each, where 28.5 had sat it.
        { root: { along: -13.5, across: -15.5 }, angle: -0.835 * Math.PI, reach: 36, art: SPRITE.hydraNeck3, artHit: SPRITE.hydraNeck3Hit, collar: SPRITE.hydraCollar3, collarHit: SPRITE.hydraCollar3Hit, head: SPRITE.hydraHead3, headHit: SPRITE.hydraHead3Hit, radius: 11.5, mouth: 12.5, livery: 'rime' },
        {
          root: { along: -4, across: -20 },
          angle: -0.66 * Math.PI,
          reach: 47,
          art: SPRITE.hydraNeck4,
          artHit: SPRITE.hydraNeck4Hit,
          collar: SPRITE.hydraCollar4,
          collarHit: SPRITE.hydraCollar4Hit,
          head: SPRITE.hydraHead4,
          headHit: SPRITE.hydraHead4Hit,
          radius: 11.5,
          mouth: 12.5,
          livery: 'labyrinth',
          /*
            ⚠️ **THE SERPENT'S DARK AURA, AND ASKED FOR AS A PROPER ONE** — *"has a dark aura (a proper
            aura, not just a basic circle)."* The frames 0305 drew for *"a super saiyan aura, but dark
            blue and purple energy"*: tongues licking off the head and up its neck, flickering down it.
          */
          aura: {
            frames: [SPRITE.serpentAura0, SPRITE.serpentAura1, SPRITE.serpentAura2, SPRITE.serpentAura3, SPRITE.serpentAura4, SPRITE.serpentAura5],
            hold: 3,
            stride: 1,
            head: 28.5,
          },
        },
      ],
      sway: 0.08,
      beat: 170,
      rise: 70,
      hurt: 1,
      look: 0.6,
      // Twice the look, and a little over two thirds of a right angle at the knuckle — 0486.
      bend: 1.2,
      /*
        ⚠️ **THE CLOCKWORK'S FIRE TAKES THE WHOLE ANIMAL — 0389.** When it has risen, every head burns with
        its aura; the fire runs down the necks over a second; then the body lights where the necks meet it
        and spreads out across the mound and up the tail, one place every eight steps. Six places, which
        with three flames a neck is the aura pool's twenty-seven to the slot — the budget is what says six.
      */
      blaze: {
        from: 4,
        travel: 60,
        gap: 8,
        spots: [
          { along: -2, across: -17, size: 40 },
          { along: -20, across: -9, size: 34 },
          { along: 16, across: -10, size: 34 },
          { along: -2, across: -3, size: 38 },
          { along: 28, across: -12, size: 26 },
          { along: 34, across: -26, size: 24 },
        ],
      },
    },
    /*
      ⚠️ **THE BLACK HEART'S ROOM WITH NO WALLS — 0459.** *"Background also needs to stop scrolling for
      this boss fight."* The jellyfish's numbers: the camera settles over two and a half seconds sixty
      units short of the fight and holds. The Mire's bank has no end (0383), so the shore under the
      hull stops with it and the acid pool, which is laid round the hull every step, stays under it.
    */
    room: { stand: 60, settle: 150, mouth: 40, wall: null, opens: 0 },
    burn: null,
    wreck: null,
    shed: { sprite: SPRITE.shedFlesh, from: 'facing' },
    sprite: SPRITE.boss13,
    spriteHit: SPRITE.boss13Hit,
    radius: 21,
    // Doubled by 0260, from 1000. 1860 from 1700 — 0441: the arc at the true cap took it in 37 s.
    health: 1860,
    damage: 3,
    /*
      ⚠️ **154 → 178 — 0459.** *"Hydra needs to be closer to the right edge of the screen, it's too far
      in."* The heads reach back down the lane from the shoulders, so moving the body forward leaves
      them in the fight and puts the mound and the tail against the leading edge. The hull's own front
      is 178 + 5 + 21 = 204 against the narrowest screen's 213, which `tests/level.test.ts` holds.

      ⚠️ **178 AND NOT FURTHER, AND THE MUSIC IS WHY.** The aura is the boss's own sound and fades
      with the gap (0092); at 182 a player backed into the rear of the box heard 0.086 of it, under the
      tenth `tests/music.test.ts` holds as *attenuated, not muted*. 178 leaves it at 0.104, which is
      as far as the hull can come without the aura's range being retuned for every boss.
    */
    station: 178,
    drift: 5,
    driftWavelength: 240,
    patrol: 0.3,
    shot: 'acid',
    /*
      ⚠️ **A HEAD A FIFTH, AND EVERY HEAD STAYS — 0254.** The row's attack is the first head alone:
      acid, sprayed. Each phase's is the round so far with one more: flame sprayed at 80%, a laser
      from a side head at 60%, a wall of frost at 40%, a ring of void at 20%. The phase's `shots`
      and `spread` are every head's fan; the laser and the ring read them their own way.

      ⚠️ **DENSER, WIDER AND FASTER SINCE 0385** — *"have the attacks spray more to make it harder"* —
      until `tests/crowd.test.ts`'s pilot found the narrowest place in every phase, on every tier,
      at or under what the hydra left before 0384 moved it into the acid. The decision has the table.

      ⚠️ **AND SIX A FAN FROM SIXTY PERCENT DOWN SINCE 0387** — *"about 1-2 less orbs at 60% and less
      health - gets really hard to dodge."* A play outranks the measured target 0385 set, so the last
      three phases are roomier than it left them. `docs/decisions/0387-the-hydra-throws-fewer-from-sixty.md`.

      ⚠️ **SLOWER, AS FAR AS 0260'S EIGHT VOLLEYS ALLOW — 0471.** *"The hydra level boss … fire[s] a
      bit too fast."* 72, 60, 54, 48 and 42 became 78, 72, 66, 60 and 54: at the tuned tier 54, 48,
      42, 36, 30 steps became 60, 54, 54, 48, 42, before each head's own gap, which is unchanged. The
      arc's forty-second fight holds the first phase there.
    */
    phases: [
      { upTo: 1, fireEvery: 78, shots: 5, spread: 1.0, patrolScale: 1, stance: { kind: 'volley' }, look: null, shot: null, attack: null },
      {
        upTo: 0.8,
        fireEvery: 72,
        shots: 6,
        spread: 1.2,
        patrolScale: 1.2,
        stance: { kind: 'volley' },
        look: null,
        shot: null,
        attack: { kind: 'heads', heads: [{ shot: 'acid', attack: { kind: 'spray' }, gap: 24 }, { shot: 'flame', attack: { kind: 'spray' }, gap: 24 }] },
      },
      {
        upTo: 0.6,
        fireEvery: 66,
        shots: 6,
        spread: 1.3,
        patrolScale: 1.4,
        stance: { kind: 'volley' },
        look: null,
        shot: null,
        attack: {
          kind: 'heads',
          heads: [
            { shot: 'acid', attack: { kind: 'spray' }, gap: 24 },
            { shot: 'flame', attack: { kind: 'spray' }, gap: 24 },
            { shot: 'lance', attack: { kind: 'beam', warning: 24, hold: 24, halfWidth: 3, from: [[0, 0]], jag: HYDRA_LANCE }, gap: 24 },
          ],
        },
      },
      {
        upTo: 0.4,
        fireEvery: 60,
        shots: 6,
        spread: 1.4,
        patrolScale: 1.6,
        stance: { kind: 'volley' },
        look: null,
        shot: null,
        attack: {
          kind: 'heads',
          heads: [
            { shot: 'acid', attack: { kind: 'spray' }, gap: 24 },
            { shot: 'flame', attack: { kind: 'spray' }, gap: 24 },
            { shot: 'lance', attack: { kind: 'beam', warning: 24, hold: 24, halfWidth: 3, from: [[0, 0]], jag: HYDRA_LANCE }, gap: 24 },
            { shot: 'frost', attack: { kind: 'wall', gap: 12 }, gap: 24 },
          ],
        },
      },
      {
        upTo: 0.2,
        fireEvery: 54,
        shots: 6,
        spread: 1.5,
        patrolScale: 1.8,
        stance: { kind: 'volley' },
        look: null,
        shot: null,
        attack: {
          kind: 'heads',
          heads: [
            { shot: 'acid', attack: { kind: 'spray' }, gap: 24 },
            { shot: 'flame', attack: { kind: 'spray' }, gap: 24 },
            { shot: 'lance', attack: { kind: 'beam', warning: 24, hold: 24, halfWidth: 3, from: [[0, 0]], jag: HYDRA_LANCE }, gap: 24 },
            { shot: 'frost', attack: { kind: 'wall', gap: 12 }, gap: 24 },
            { shot: 'void', attack: { kind: 'ring' }, gap: 24 },
          ],
        },
      },
    ],
  },
  /**
   * The Black Heart's end: a jellyfish of glass hung over the heart, in a room with no walls.
   *
   * ⚠️ **WHAT IT WAS, AND WHY NONE OF IT STAYED** — 0400 to 0404, one play-report's thirteen items. It
   * bobbed across a level that scrolled on while the heart went past a long way off; its hull was a bell
   * to the front with snakes trailing off the back and a gold eye in it (*"it's not a medusa head"*); its
   * tendrils were five straight beams from its middle; its moon jellies fell sideways in its own red; and
   * its last fifth took twice the damage and looked exactly as the four before it.
   */
  medusa: {
    points: 60000,
    /*
      ⚠️ **HUNG OVER THE HEART, AND THE HEART IS SET INTO THE PLACE — 0400.** *"The black heart needs to be
      set into the screen like the cog boss at the end of the 4th"*, and *"the jellyfish boss is positioned
      over the heart."* The gyre's move: it closes on the lane's middle and holds there, with the heart as
      its seat, beating to the heart the music plays.
    */
    move: { kind: 'socket', at: ACROSS_SPAN / 2, seat: SPRITE.heart, throb: 0.07 },
    attack: { kind: 'ring' },
    // No curtain since 0255: it was the tendrils' stand-in, and the tendrils are here.
    uncoil: null,
    /*
      The moon jellies — 0255: from three quarters of its health, two a volley from the top edge. And a
      jelly that drifts into it or any tentacle of it feeds it — 0404.

      ⚠️ **A FIFTIETH AT SAVIOR, NOT A TWENTIETH — 0476.** At a twentieth the fight did not finish from
      most places a player can stand: 0386 had measured the player's damage the day before the feeding
      existed, and a third of the rain lands on a body that spans 52 units across. *"The jellyfish never
      opens"* was the report. Tentacles still feed it, as 0404 was asked; the rate was the defect.

      ⚠️ **AND A SHARE OF THE AUTHORED HEALTH, NOT THE TIER'S** — `feedBoss` — so a jelly gives back the
      same number of shots at every tier. A share of the tier's full health made Burn's fight, two and a
      half times as long, land two and a half times the feeds: it finished from nowhere, with any gun.
      0.032 of the authored 1890 is a fiftieth of Savior's.
    */
    fall: { kind: 'body', enemy: 'moonJelly', every: 75, count: 2, from: 0.75, feeds: 0.032 },
    chill: null,
    muzzle: null,
    chain: null,
    face: null,
    entrance: null,
    tail: null,
    /*
      ⚠️ **FIVE TENTACLES, ONE A LASER — 0403**, rooted along the bell's margin where the frill is and
      hanging down the lane to `MEDUSA_TIPS`. Eight lengths of 4.1 units: a wave along them bends as a
      tentacle does rather than as a chain of rods. **All of a hit on one reaches the hull**: they hang
      between the ship and the bell, so nearly every frontal shot meets a tentacle first, and a half
      share doubled the fight that 0386 banded — the first draft had it, and CI's proof is what made the
      arithmetic visible. They are the animal, and a hit on the animal is a hit.
    */
    tendrils: {
      roots: [
        [MEDUSA_RIM, -13.9],
        [MEDUSA_RIM, -7.7],
        [MEDUSA_RIM, 0],
        [MEDUSA_RIM, 7.7],
        [MEDUSA_RIM, 13.9],
      ],
      tips: MEDUSA_TIPS,
      reach: -MEDUSA_REACH,
      /*
        ⚠️ **EIGHT STILL, AND 0490 ASKED FOR TWELVE.** Twenty more lengths is twenty more entities against
        0022's worst case, already full; the share 0022 names as sheddable is the particles', and
        `tests/flares.test.ts` prices their fullest moment at 148.9 of the 149 they have — so twelve would be
        bought with a boss's explosion. The curve is the wave's (`waves`), and eight draws it.
      */
      nodes: 8,
      sprite: SPRITE.tendril,
      spriteHit: SPRITE.tendrilHit,
      // The drawn tentacle's own half-thickness and a little over, so what stings is what is seen.
      radius: 1.4,
      taper: 0.5,
      sway: 5,
      beat: 150,
      draw: 90,
      brace: 18,
      hurt: 1,
      // The last three lengths alight for the twenty steps before a laser leaves the tip — 0490.
      lit: { sprite: SPRITE.tendrilLit, charge: 20, lengths: 3 },
      // An S and a half down the arm: as much wave as eight lengths can bend through without a kink.
      waves: 1.5,
      // Four frilled oral arms between the tentacles' roots, swaying slower than the tentacles wave — 0490.
      frills: {
        sprite: SPRITE.oralArm,
        roots: [
          [MEDUSA_RIM + 2, -10.8],
          [MEDUSA_RIM + 2, -3.9],
          [MEDUSA_RIM + 2, 3.9],
          [MEDUSA_RIM + 2, 10.8],
        ],
        sway: 0.18,
        beat: 230,
      },
    },
    /*
      ⚠️ **THE LABYRINTH'S ROOM WITH NO WALLS — 0400.** *"The boss fight needs to be similar to the
      labyrinth in that it's a stationary screen, no walls."* The gyre's numbers: the camera settles over
      two and a half seconds sixty units short of the fight, which puts the heart on its station and
      stops it there with everything else.
    */
    room: { stand: 60, settle: 150, mouth: 40, wall: null, opens: 0 },
    burn: null,
    wreck: null,
    shed: { sprite: SPRITE.shedGlass, from: 'facing' },
    sprite: SPRITE.boss14,
    spriteHit: SPRITE.boss14Hit,
    radius: 17,
    // Doubled by 0260, from 1100. 1890 from 1870 — 0441: the arc at the true cap sat on the forty.
    health: 1890,
    /*
      ⚠️ **THE LIGHTNING AT 1.4, NOT ITS 1.5 — 0476**, on the gyre's and the pterodactyl's pattern.
      Re-banded for the feeding, the open bell's doubled damage runs over a wider band, and the arc took
      the fight in 38.5 s against 0260's forty; the other three guns were 49–64 s.
    */
    gunWeights: { arc: 1.4 },
    damage: 3,
    /*
      ⚠️ **190, FROM 152 — 0476.** *"It should be set a bit further back in the screen for the fight, you
      shouldn't be able to fly around it."* At 152 the bell covered 135–169 and left 33 units behind it in
      a box that runs to 202.7; at 190 its front is at 207, past the box, so nothing flies behind it — the
      hydra's answer at 0459. Beside it stays possible, and the tentacles still hang to 150.
    */
    station: 190,
    // Zero, on the gyre's terms (0332): a thing hung over a heart set into the place does not drift along it.
    drift: 0,
    driftWavelength: 300,
    patrol: 0.24,
    shot: 'spit',
    phases: [
      /*
        ⚠️ **FIVE PHASES, AND THE LAST ONE OPENS AND KEEPS THROWING — 0255, DRAWN SINCE 0402.** A ring
        while whole; at four fifths the tentacles fire; a denser ring at three fifths; the tentacles held
        longer at two; and at the last fifth the bell opens on the heart: twice the damage taken, and a
        ring of void out of it.

        ⚠️ **THE LASERS ARE ONE JAGGED FORMATION NOW — 0403.** From the five tips, with 0388's zigzag
        and one seed a volley (`together`), so the four gaps between them are open all the way down the
        lane; warned for 0.4 s rather than 0.2, because a zigzag has to be read before it is dodged —
        the pterodactyl's and the hydra's are warned for 0.3 and 0.4.

        ⚠️ **AND EIGHT VOID A RING RATHER THAN TEN — 0402.** *"It needs slightly less void balls
        firing."* A fifth fewer, on the same cadence.

        ⚠️ **SLOWER, AS FAR AS 0260'S EIGHT VOLLEYS ALLOW — 0471.** *"The … jellyfish level boss
        fire[s] a bit too fast."* 66, 54, 48, 42 and 36 became 72, 66, 60, 54 and 48: at the tuned
        tier 54, 42, 36, 30, 30 steps became 54, 54, 48, 42, 36, and the lasers' warning and hold are
        unchanged. The first ring stays at 54 there because the arc's forty-second fight is over
        before an eighth volley at anything slower.

        ⚠️ **RE-SOLVED BY 0476, ON THE FEEDING 0386 NEVER SAW.** 0386 solved these lines the day before
        the rain fed the bell, so the phases under it — where the jellies fall — ran twice the others.
        `scripts/solve-phase-bands.mjs medusa`, flown with a fiftieth a feed from 190: the lines move
        to 0.82, 0.63, 0.47 and 0.31, and the open bell has the widest band because a feed closes it.
      */
      { upTo: 1, fireEvery: 72, shots: 4, spread: 0, patrolScale: 1, stance: { kind: 'volley' }, look: null, shot: null, attack: null },
      { upTo: 0.82, fireEvery: 66, shots: 6, spread: 0, patrolScale: 1.3, stance: { kind: 'volley' }, look: null, shot: null, attack: { kind: 'beam', warning: 24, hold: 18, halfWidth: 1.5, from: MEDUSA_LASERS, jag: MEDUSA_FAN, together: true }, hull: { rest: SPRITE.boss14Lime, hit: SPRITE.boss14LimeHit } },
      { upTo: 0.63, fireEvery: 60, shots: 8, spread: 0, patrolScale: 1.6, stance: { kind: 'volley' }, look: null, shot: null, attack: null, hull: { rest: SPRITE.boss14Yellow, hit: SPRITE.boss14YellowHit } },
      { upTo: 0.47, fireEvery: 54, shots: 8, spread: 0, patrolScale: 2, stance: { kind: 'volley' }, look: null, shot: null, attack: { kind: 'beam', warning: 24, hold: 24, halfWidth: 1.8, from: MEDUSA_LASERS, jag: MEDUSA_WIDE_FAN, together: true }, hull: { rest: SPRITE.boss14Amber, hit: SPRITE.boss14AmberHit } },
      // A fifth at twice the damage is 3.4 s at max weapons — over 0124's three, and past the death it
      // runs into (0150's floor). The bell parted — 0402: *"actually 'open and expose the heart'"*.
      { upTo: 0.31, fireEvery: 48, shots: 8, spread: 0, patrolScale: 1.2, stance: { kind: 'open', damageScale: 2 }, look: null, shot: 'void', attack: { kind: 'ring' }, hull: { rest: SPRITE.boss14Open, hit: SPRITE.boss14OpenHit } },
    ],
  },
};
