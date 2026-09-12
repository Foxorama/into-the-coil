/**
 * The things that fly and hurt — the player's auto-fire, and what shoots back.
 *
 * A `Record` over a closed union, per `docs/decisions/0016-a-hub-enumerates-kinds.md`. Behaviour
 * rides the row: nothing downstream switches on a shot's name, it reads the numbers off the entity
 * that was spawned from the row.
 *
 * ── EVERY SPEED HERE IS ABSOLUTE, AND THAT IS A RULE RATHER THAN A HABIT ────────────────────────
 *
 * ⚠️ **Never a multiple of `SHIP_SPEED`.** `reports/drag-feel-2026-08-05.md` says bullet speed and
 * enemy approach are *"relative to how fast the player can get out of the way"* — which is a
 * statement about the ORDER these get tuned in, and reads exactly like an instruction to write them
 * as ratios. Written as ratios, the dodge margin becomes invariant under `SHIP_SPEED` and the first
 * tuning pass measures a knob that no longer does the thing it is being turned for.
 *
 * `tests/combat.test.ts` holds it the only way it can be held: nothing under `src/content/` may
 * import the ship's constants, so a ratio cannot be spelled without the guard seeing it.
 * `docs/decisions/0034-a-threat-is-absolute-and-a-pool-is-the-pairing.md`.
 *
 * ⚠️ **Nothing may assert on the VALUES below**, on the same terms `src/sim/flight.ts` sets for
 * `SHIP_SPEED`: they are starting points, and what settles them is a hand and
 * `scripts/trace-frame.mjs` — `docs/decisions/0027-measure-the-picture-not-the-model.md`. What the
 * tests hold are the relationships that must be true at *any* value.
 */

import type { Body } from '../sim/entity.ts';
import type { DebrisKind } from './debris.ts';
import { SPRITE } from './sprites.ts';

/** Every shot in the game. Closed. */
export type ShotKind =
  | 'pulse'
  | 'arc'
  | 'shuriken'
  | 'spit'
  | 'lance'
  | 'flak'
  | 'acid'
  | 'void'
  | 'maw'
  | 'droplet'
  | 'flame'
  | 'rock'
  | 'frost'
  | 'quill'
  | 'missile'
  | 'seeker'
  | 'bomb'
  | 'blast'
  | 'blastHalf'
  | 'blastWide'
  | 'blastWidest';

export interface ShotRow extends Body {
  /**
   * World units travelled per fixed step, always positive. Which way it points is the spawner's
   * business — the same row fired backwards is the same shot.
   *
   * ⚠️ **Relative to the CAMERA, not to the world**, which is the frame `src/sim/flight.ts` already
   * flies the ship in and therefore the frame the player sees. `src/app/frame.ts` adds the scroll
   * rate when it spawns the shot, and the reason it has to is written there: a shot aimed in world
   * coordinates arrives where the ship *was*, because the ship drifts up-lane for every step the
   * shot is in the air.
   *
   * ⚠️ **No upper bound, and that is bought rather than assumed.** `src/sim/collide.ts` sweeps the
   * step instead of testing two current positions, so a shot cannot step over its target however
   * fast it goes. Without that there would be a ceiling here of roughly `radius + target radius`
   * minus the ship's own top speed — a hard limit sitting directly in front of the constant the next
   * tuning pass is supposed to raise.
   */
  speed: number;
  /**
   * What the shot becomes, stage by stage — `docs/decisions/0263-the-frost-ship-shatters.md`.
   *
   * Empty for a shot that is spent by arriving and nothing else, which is every shot but one. A
   * stage is a fuse and what the shot turns into when it burns down: a fan of the same shot about
   * its own heading, a ring of it, or nothing — a melt. The children are the same kind one stage
   * on, so a row's stages read top to bottom as the life of one bullet, and the last stage is the
   * only thing that ends one that has not hit anything or left the world.
   *
   * ⚠️ **Required, never defaulted**, on `EnemyRow.attack`'s argument in `src/content/enemies.ts`:
   * a shot that does not burst says so on the page, so adding a row is a decision about what the
   * bullet asks of the player over its whole life and not only at the muzzle.
   *
   * ⚠️ **The children are the SAME kind**, and it is the fuse on the entity and not a second row
   * that tells a bolt from the shard it came from. A shard that became a smaller, quicker bolt
   * would want a rung on the hostile ladder for every stage, and `tests/legibility.test.ts` holds
   * that ladder at more than five pixels a rung — 0262 spent the last easy room on it.
   */
  fission: readonly Fission[];
  /**
   * How much of the player's fire this bullet SWALLOWS before it bursts — 0291. Absent is none, and
   * none is *the player cannot touch it*, which is every shot in the game but one.
   *
   * ⚠️ **REPORTED**: *"the void blasts should be bigger and a bit random and should eat x amount of
   * damage and then explode in a void blast."* Nothing in this game had ever let a player's shot
   * reach an enemy's: hostile bullets collide with the ship and with nothing else. So an appetite is
   * not a tuning number, it is the switch that puts a bullet in front of the guns at all.
   *
   * ⚠️ **OPTIONAL, WHERE `fission` BESIDE IT IS REQUIRED, AND THE TWO ARE NOT THE SAME KIND OF
   * QUESTION.** 0263 makes `fission` mandatory because *"a shot that does not burst says so on the
   * page"* — what a bullet does over its whole life is a thing every author has to decide. Whether
   * the player may shoot it down is a rare exception to a rule the whole game rests on, and
   * `docs/decisions/0282-a-mechanism-for-every-instance-makes-them-one-instance.md` is explicit that
   * *no row can forget it* argues for a DEFAULT and never for a constant: the row still says what its
   * version is, and shared code holds the fallback.
   *
   * ⚠️ **A FLAG AND NOT AN AMOUNT, BECAUSE THE AMOUNT IS ALREADY `health` — AND IT WAS BOTH FOR ONE
   * COMMIT.** Written as a number it was a second answer to *how much does this swallow*, and the two
   * disagreed on the first driven test: `reset` gives a shot its ROW's health, so a void authored
   * with `appetite: 6` and `health: 1` was popped by a single pulse while the field that was supposed
   * to say six sat there being read by nobody. One number, and it is the one every other body in the
   * game already uses for *how much it takes*.
   */
  swallows?: boolean;
  /**
   * What this shot drops behind it as it flies, or absent for the thirteen that drop nothing — 0301.
   *
   * ⚠️ **OPTIONAL, WHICH IS 0282's DEFAULT SHAPE.** *"No row can forget it" is an argument for a
   * DEFAULT, never for a CONSTANT* — a row says what its version is and shared code holds the
   * fallback, and the fallback here is *no trail*, which is what every shot in the game had.
   *
   * ⚠️ **A `DebrisKind` RATHER THAN A FLAG, BECAUSE *fire* IS A TYPE AND NOT AN ATTACK.** Asked for
   * in those words: *"fire, frost, void, acid all are generic types as well and we can have different
   * 'fire' attacks, but one 'fireball' attack."* A frost shot that wants to shed ice, or a void that
   * wants to shed dark, names its own debris kind on its own row and nothing in the frame changes —
   * the two lightnings are the model, one base with the style on the instance.
   */
  trail?: DebrisKind;
  /**
   * What this bullet does if it gets close enough to the player without being killed — 0311, or absent.
   *
   * ⚠️ **REPORTED**: *"it eats damage and gets bigger and if the player does not kill it, it explodes when
   * it gets to 20% away from the left screen and the explosion size is based on how much health left, the
   * explosion is an outward circular blast of acid and void droplets."*
   *
   * ⚠️ **A FUSE ON A PLACE, WHERE `fission` IS A FUSE ON A CLOCK.** 0263's stages burn down in steps, which
   * is the right shape for a thing that comes apart on its own; this comes apart **where the player let it
   * get to**, and the two are different questions about the same bullet. A `fission` timed to arrive at the
   * right distance would be a quantity that is only correct at one speed and one station.
   *
   * ⚠️ **AND IT IS A DISTANCE FROM THE CAMERA'S TRAILING EDGE**, not a share of the view — 0023. *"20% away
   * from the left screen"* is a fraction of a screen that is 178 world units wide at its narrowest and 240
   * at its widest, so a share would put the blast twelve units further from the player on a wide monitor.
   * The number is read off the narrowest view once, and every device gets the same fight.
   */
  swallow?: Swallow;
}

/**
 * What a swallowing bullet does when it arrives — 0311.
 *
 * ⚠️ **EVERY FIELD IS A PROPERTY OF THE BULLET RATHER THAN OF THE BOSS THAT THREW IT**, on
 * [0282](../../docs/decisions/0282-a-mechanism-for-every-instance-makes-them-one-instance.md)'s terms: a
 * second animal that throws one of these gets to say how far in it bursts and how big.
 */
export interface Swallow {
  /** How far from the camera's trailing edge it bursts, in world units. */
  at: number;
  /** What it bursts into, alternating — 0311's *"acid and void droplets"*. */
  into: readonly ShotKind[];
  /**
   * The most droplets a burst at FULL health throws; a hurt one throws its share of them.
   *
   * ⚠️ **THE COUNT IS THE SIZE, AND THAT IS THE ASK READ LITERALLY.** *"The explosion size is based on how
   * much health left"* — so a ball the player never touched fills the lane and one they nearly killed puts
   * out a handful. What scales is how much of the circle is covered, which is what a player has to move
   * through; scaling the droplets' own size instead would make a weak blast a small target rather than an
   * easy one.
   */
  droplets: number;
  /** How fast the droplets leave, in world units a step, before the tier's own scale. */
  speed: number;
}

/**
 * One stage of a shot's life after the muzzle — 0263. `after` is the fuse in steps; the arm says
 * what it bursts into. A `fan` is `shots` about the heading the shot was flying on, `spread` wide in
 * total on the same arithmetic as an enemy's `spray`; a `ring` is `shots` evenly round, the first
 * on the heading; `nothing` is the melt.
 */
export type Fission =
  | { after: number; into: 'fan'; shots: number; spread: number }
  | { after: number; into: 'ring'; shots: number }
  | { after: number; into: 'nothing' };

/** A shot that is spent by arriving and by nothing else — every shot but the frost. */
const SPENT_BY_ARRIVING: readonly Fission[] = [];

/**
 * The most shards of a SHATTERING shot one volley may open with, before the tier's `crowd`.
 *
 * ── WHY A CEILING RATHER THAN A COUNT ON EVERY ROW THAT THROWS ONE ──────────────────────────────
 *
 * ⚠️ **`docs/decisions/0263-the-frost-ship-shatters.md` STATED THIS RULE AND WROTE IT INTO ONE BOSS.**
 * *"The volleys are counted in shards"* — the frost ship's phases went to 1, 2, 2 and 3, because one
 * shard is two bolts and then twelve flakes. The hydra's frost head was left reading the phase's own
 * `shots`, which is shared with four heads that throw bullets that do not shatter and is authored at
 * 4 and 6 — so its frost volley was **eight shards, ninety-six flakes**, and the count of hostile
 * shots alive stepped from 14 to 104 at one phase boundary.
 * `docs/decisions/0270-a-shattering-volley-is-counted-in-shards.md`.
 *
 * ⚠️ **SO THE RULE LIVES WHERE THE FISSION DOES, AND NOT IN A ROW.** A per-row count would have to
 * be authored correctly by every future boss that picks up a shattering shot — which is exactly the
 * thing that did not happen once already, in the decision that invented the shattering. A ceiling in
 * `src/app/boss.ts` cannot be forgotten by a row that does not mention it.
 *
 * ⚠️ **THREE, AND IT IS READ OFF THE CONTENT RATHER THAN PICKED.** It is the widest volley the frost
 * ship itself throws — 0263's last phase, settled by playing — so the ceiling says *no boss opens a
 * shattering volley wider than the ship the shattering was designed for*. A `wall` is symmetric about
 * the hull and so spends it a pair at a time; `src/app/boss.ts` has that arithmetic.
 *
 * ⚠️ **THE TIER DOES NOT SCALE IT, AND THAT IS MEASURED RATHER THAN ASSUMED.** `src/app/boss.ts` has
 * the argument: a harder tier already halves the gap between volleys, and a wider volley on top of
 * that filled the hostile pool outright — at which point the volley after it is silently not thrown.
 * What a tier does to a shattering shot is send it twice as often.
 */
export const SHARD_VOLLEY = 3;

/** Written out rather than derived, so the table below cannot quietly lose a row. */
export const SHOT_KINDS: readonly ShotKind[] = [
  'pulse',
  'arc',
  'shuriken',
  'spit',
  'lance',
  'flak',
  'acid',
  'void',
  'maw',
  'droplet',
  'flame',
  'rock',
  'frost',
  'quill',
  'missile',
  'seeker',
  'bomb',
  'blast',
  'blastHalf',
  'blastWide',
  'blastWidest',
];

/**
 * How far a bomb's blast reaches, in world units — and the unit the other three are counted in.
 *
 * ⚠️ **Hoisted so the ladder below is arithmetic rather than four numbers that have to agree.** The
 * ask that produced the wide ones states them as multiples of this one — *"0 bombs = half current
 * bomb explosion size, 1 bomb = bomb explosion, 2 bombs = increased explosion size, 3 increased
 * further"* — so writing 17, 51 and 68 here would be three hand-computed copies of a relationship the
 * player stated, and the day this number moves they would each go on saying the old thing.
 * `docs/decisions/0079-a-death-is-a-beat-and-the-arsenal-goes-up-with-the-ship.md`.
 */
const BLAST_RADIUS = 34;

/**
 * How many arrivals a shuriken survives — 0234. Named, because it is the one `health` in this
 * table that is not a one, and `tests/combat.test.ts` reads the rule off the row rather than off
 * this number: a shot with one health is spent by arriving, and a shot with more is spent by its
 * own clock and lands once per impact flash on whatever it crosses.
 */
export const BLADE_EDGE = 12;

export const SHOTS: Record<ShotKind, ShotRow> = {
  /**
   * The player's auto-fire. Fast, small, and cheap to survive being wrong about — it is the shot
   * `docs/game.md` says the player never thinks about.
   */
  // ⚠️ `spriteHit` is the same bitmap, and that is honest rather than lazy: a shot has one health,
  // so it never survives a hit and never flashes. There is no second silhouette to draw.
  pulse: { sprite: SPRITE.bullet, spriteHit: SPRITE.bullet, radius: 0.9, health: 1, damage: 1, speed: 2.6, fission: SPENT_BY_ARRIVING },
  /**
   * One link of chain lightning — `docs/decisions/0233-a-weapon-is-a-kind-and-a-pickup-cycles.md`.
   *
   * ⚠️ **`speed` is 0 because a bolt does not travel: it is resolved on the step it fires.** The row
   * is what a link is WORTH and what its landing looks like — `sprite` is the spark blitted where the
   * bolt lands, and the bolt itself is stroked between two points by `src/render/scene.ts`, which is
   * the one thing in the game that is not a bitmap. `radius` is the spark's hurtbox band and nothing
   * else: a link is in no collision pairing, because `src/app/frame.ts` lands it by hand.
   *
   * ⚠️ **`damage` is one link at weight one.** What a bolt is worth at a tier is this times the
   * weapon's `weight` ladder (`src/content/weapons.ts`), so it stays a relationship to the pulse —
   * one link is one pulse — rather than a number tuned beside it.
   */
  arc: { sprite: SPRITE.arcNode, spriteHit: SPRITE.arcNode, radius: 1, health: 1, damage: 1, speed: 0, fission: SPENT_BY_ARRIVING },
  /**
   * A blade that circles the ship — `docs/decisions/0234-a-blade-circles-the-ship.md`.
   *
   * ⚠️ **`health` IS HOW MANY BODIES IT CAN LAND ON BEFORE IT IS BLUNT, and it is the first shot
   * with more than one.** `src/sim/collide.ts` spends a shot one health per arrival; a pulse has one
   * and is gone, and this has `BLADE_EDGE` and goes on. Its own clock (`orbit`, on the weapon row)
   * is what usually ends it — twelve is more bodies than a spiral crosses — so the number is a
   * ceiling on what one blade may be worth against a wall of drifters, not a life.
   *
   * ⚠️ **`speed` is how fast the blade goes UP THE LANE, in the camera's frame** — 0244. The blade
   * swings across the lane about that line at the weapon row's `coil` half-width and `turn`, so
   * what it covers in a step is this along plus up to three across at the cap. Well under the
   * pulse's: a helix sweeps, it does not fly. Played at 0.8 (0242): *"the shurikens need to be
   * slightly faster than they are now"* — a quarter faster, and `THE PACE` in
   * `tests/blades.test.ts` holds the crossing of the screen in seconds. (0237 to 0240 had it at
   * zero, when the blade circled the ship and had no speed of its own.)
   *
   * ⚠️ **`radius` 3.2 — a star smaller than the ship, since 0244.** Played at 1.4: *"shuriken stars
   * need to be a lot bigger"*; at 3.5: *"bigger and steel coloured"*; at 4.8: *"a bit smaller, they
   * take up a lot of visual screenspace and make it hard to see enemies and enemy fire"*; at 4:
   * *"slightly smaller"* again. The hurtbox is the sweep, so a smaller blade is a narrower sweep
   * too, and the balance of that is a hand's.
   *
   * ⚠️ **`spriteHit` IS THE OTHER TURN OF THE STAR, AND THAT IS NOT A FLASH.** A blade never
   * flashes — what it survives is arriving, not being hit, and nothing in the game shoots it — so
   * the slot 0035 gives every body for its hurt twin is free, and `steerBlades` in
   * `src/app/frame.ts` swaps the two every few steps to spin it. `blit` cannot rotate; two bitmaps
   * an eighth of a turn apart are what a spinning shuriken is.
   */
  /*
    ⚠️ **3.2 → 2.24, WHICH IS THE DRAWING'S OWN 0.4 KEPT — 0294.** The blade is drawn smaller now
    (*"the shurikens also need to be smaller and neater"*), and a hurtbox left where it was is a blade
    that cuts things it visibly missed. `tests/combat.test.ts` caught it at 0.57 against a 0.55
    ceiling; the ratio it had before was exactly 0.4, so the collision follows the picture down rather
    than being re-tuned beside it — 0036, in the direction nobody reports.
  */
  /*
    ⚠️ **`damage` 1 → 2 — 0298, AND THE REPORT'S OWN PREMISE WAS FALSE.** Played: *"did the damage
    decrease, feels like they need a slightly higher damage."* It never decreased: `git log -S` finds
    exactly one commit on this line, its own. What changed was 0294 taking the drawing from 8 to 5.6
    for legibility, and a smaller blade lands less.

    ⚠️ **WHAT `scripts/time-to-kill.mjs` FOUND INSTEAD IS THE LADDER, AND IT IS NOT WHAT THIS FIXES.**
    Mean damage a second over the near field, bare ship to full ship:

      pulse       3.5 → 28.1   ×8.1
      arc         5.0 → 14.6   ×2.9
      blade       8.3 → 12.5   ×1.5

    The blade OPENS as the strongest gun in the game and finishes as the weakest, because its `weight`
    ladder is flat ones and its only climb is a doubled cadence, while the pulse buys barrels and rate
    together. So the honest fix is a `weight` ladder on the weapon row, and this is not that.

    ⚠️ **THIS IS THE FLAT DOUBLE, CHOSEN WITH THAT SAID OUT LOUD** — *"let's do +1 damage on
    shurikens, it's the easiest to roll back and change and I don't care about tier 0 really because
    the player will basically only ever be at that level at the moment for the first 20 secs of level
    1."* One row, one number, revertible in a line, and the rung it over-pays is one a run spends
    twenty seconds on. The ladder stays on the table as the thing to do if this reads too strong
    early.
  */
  shuriken: { sprite: SPRITE.shuriken, spriteHit: SPRITE.shurikenTurn, radius: 2.24, health: BLADE_EDGE, damage: 2, speed: 1, fission: SPENT_BY_ARRIVING },
  /**
   * What an enemy sends back. **Slower than the ship**, which is the whole of what makes it
   * dodgeable rather than a coin flip: a player who reacts can always leave the line it is on.
   */
  /*
    ⚠️ **Its own silhouette and its own ink since 0081, and it had NEITHER.** It was `SPRITE.bullet`
    at `SPRITE.bullet`'s size in `SPRITE.bullet`'s colour — the same bitmap as the player's own pulse,
    which is the *"player/enemy fire"* half of the legibility report with no channel separating them
    at all. The radius is untouched, so nothing about dodging one has changed.
  */
  spit: { sprite: SPRITE.spit, spriteHit: SPRITE.spit, radius: 0.9, health: 1, damage: 1, speed: 1.4, fission: SPENT_BY_ARRIVING },
  /*
    ── THREE ENEMY BULLETS AND THERE WAS ONE, WHICH IS THE OTHER HALF OF A PLAY REPORT ─────────────

    `docs/decisions/0098-a-wave-plays-a-figure.md`. Reported from play: *"the enemies all fire at
    exactly the same time when they appear, all the enemy bullets are exactly the same."* The second
    clause was literally true: three shooting enemy kinds and seven bosses all named `spit`, so every
    threat in the game was one bitmap at one speed.

    ⚠️ **EVERY HURTBOX IS STILL 0.9, AND THAT IS 0081's OWN PRECEDENT.** When the spit got its own
    silhouette its radius was deliberately left alone — *"this is a legibility change and not a
    difficulty one"* — and the same rule governs here. What varies is what the player SEES and how
    long they have; what they have to dodge is one circle, the same as it has always been.

    ⚠️ **AND EVERY SPEED IS STILL UNDER THE SHIP'S**, which is the property that makes an aimed shot
    dodgeable rather than a coin flip (0034). The spread is 1.0 to 1.6 around the spit's 1.4, so the
    mean threat is roughly where it was and the variety is in the extremes.

    ⚠️ **The fast one is SMALL and the slow one is BIG**, which is the trade that keeps this fair
    rather than a stealth difficulty change: the shot that gives the player least time is the one
    that occupies least of the lane, and the one that fills the lane is the one they can walk away
    from. `tests/legibility.test.ts` holds both halves.
  */
  /**
   * The lancer's. Quick and thin — the shot that says *this one is aiming at you*.
   *
   * ⚠️ **1.6 against the ship's own speed, which is the closest anything in the game comes.** A
   * lancer steers into the player's lane before it fires (0073), so its shot is the one already most
   * likely to be on target; giving it the least travel time is what makes the lancer the enemy the
   * player answers first rather than the one they out-run.
   */
  lance: { sprite: SPRITE.lance, spriteHit: SPRITE.lance, radius: 0.9, health: 1, damage: 1, speed: 1.6, fission: SPENT_BY_ARRIVING },
  /**
   * The turret's. Slow and fat — a shot the player is meant to see coming and choose to be elsewhere
   * for.
   *
   * ⚠️ **A turret holds station and is on screen for a known length of time** (`src/content/enemies.ts`),
   * which is what a formation is authored around, and it fires faster than anything else. A quick
   * bullet on that cadence is a wall; a slow one is a pattern to move through, and the pattern is
   * what 0098's other half is about.
   */
  flak: { sprite: SPRITE.flak, spriteHit: SPRITE.flak, radius: 0.9, health: 1, damage: 1, speed: 1, fission: SPENT_BY_ARRIVING },
  /**
   * The serpent's acid blast — `docs/decisions/0248-the-serpent-strikes.md`. The fattest and
   * slowest bullet in the game: a wall of these across the lane is a thing to walk through, and
   * each is nearly twice a flak slab's hurtbox. Its own ink (`acid`), on 0098's terms — and on
   * 0098's other rule, that the bigger a bullet is drawn the slower it goes, it sits below `flak`.
   */
  acid: { sprite: SPRITE.acid, spriteHit: SPRITE.acid, radius: 1.5, health: 1, damage: 1, speed: 0.8, fission: SPENT_BY_ARRIVING },
  /**
   * The serpent's void blast — 0248, and the hydra's last head's. Quicker than acid, worth two
   * hits, and in the `void` ink; the black heart's rain is made of these.
   */
  // 1.3 since 0262 — the ring is drawn a size bigger to make room for the quill on the ladder, and the
  // hurtbox keeps to the band `tests/combat.test.ts` holds.
  /*
    ⚠️ **1.3 → 2.2, AND IT EATS — 0291.** *"The void blasts should be bigger and a bit random and
    should eat x amount of damage and then explode in a void blast."* The radius is the hurtbox and
    the drawing follows it (`SPRITE_EXTENT.void`); the appetite is six, which is six pulses of the
    opening gun or one and a half of the arc's, so it is a thing to shoot at rather than a thing to
    shoot through.

    ⚠️ **AND *A BIT RANDOM* IS THE BLAST'S OWN SIZE, ROLLED PER BLAST**, on its own named stream —
    `docs/decisions/0021-one-stream-per-concern.md` refuses a shared generator, because a cosmetic
    roll added anywhere would rebuild every level.
  */
  void: { sprite: SPRITE.void, spriteHit: SPRITE.void, radius: 2.2, health: 6, damage: 2, speed: 0.9, fission: SPENT_BY_ARRIVING, swallows: true },
  /**
   * The serpent's last mouthful: acid and void thrown as one ball — `docs/decisions/0311-the-acid-and-the-void-come-as-one-ball.md`.
   *
   * ⚠️ **REPORTED**: *"the acid splash and void orb attacks need to change at the lightning phase, currently
   * they go on for too long and get boring → they need to change to a combined acid/void ball → it eats
   * damage and gets bigger and if the player does not kill it, it explodes when it gets to 20% away from the
   * left screen and the explosion size is based on how much health left."*
   *
   * ⚠️ **IT IS ONE OBJECT WHERE THE PHASE THREW TWENTY-FOUR.** The sweep is twenty-one globes over a second
   * and the void head three more; what the report calls *boring* is a stretch of the fight where nothing the
   * player does changes what is coming. This is the opposite shape — **one thing, and what happens to it is
   * entirely theirs.** Kill it and nothing arrives; leave it and the lane fills.
   *
   * ⚠️ **A BIG APPETITE, AND IT IS THE WHOLE DIFFICULTY DIAL.** Thirty is about five of the arc's links or a
   * second and a half of the opening gun held on it — enough that ignoring it is a decision rather than an
   * oversight, and little enough that a loadout with any reach at all can take it down before it arrives.
   * Slow, because a thing you are meant to shoot has to be shootable: at 0.55 it takes about three and a half
   * seconds to cross from the mouth to where it bursts.
   */
  maw: {
    sprite: SPRITE.maw,
    spriteHit: SPRITE.mawHit,
    radius: 3.6,
    health: 30,
    damage: 3,
    speed: 0.55,
    fission: SPENT_BY_ARRIVING,
    swallows: true,
    /*
      ⚠️ **35.6 IS *20% AWAY FROM THE LEFT SCREEN*, MEASURED ONCE ON THE NARROWEST VIEW** — a fifth of
      `ACROSS_SPAN × MIN_ASPECT`. 0023 says a spawn is placed against a view the device cannot change, and a
      literal share of the CURRENT view would put the burst twelve units further from the player on a 2.4:1
      monitor than on a 16:9 one. The ship's own box runs from 10.7 to 167, so this bursts inside the room the
      player flies in — which is what makes it a thing to deal with rather than a thing to watch.
    */
    swallow: { at: 35.6, into: ['droplet', 'void'], droplets: 16, speed: 0.85 },
  },
  /**
   * One drop of what a maw was carrying — 0311. The acid half of the burst; the void half is `void` itself.
   *
   * ⚠️ **ITS OWN ROW RATHER THAN `acid`, AND THE DIFFERENCE IS THE LIFE.** An acid globe is thrown at a ship
   * from a mouth and is spent by arriving; sixteen of these leave one point in every direction at once, and a
   * ring that is still crossing the lane when the next ball arrives is a fight that silts up. Smaller, quicker
   * and worth one hit, which is a thing to fly between rather than a wall.
   */
  droplet: { sprite: SPRITE.droplet, spriteHit: SPRITE.droplet, radius: 1.1, health: 1, damage: 1, speed: 1, fission: SPENT_BY_ARRIVING },
  /**
   * The fish's quill — `docs/decisions/0262-the-eagle-throws-quills.md`: *"the bullets need to be
   * feathered quills."* A feather, shaft first, in the enemy's ink — the fish's own bullet where
   * it threw the lancer's lance. On the ladder between the slab and the void ring: bigger than the
   * flak and slower, smaller than the ring and quicker, which is 0098's rule for what a new bullet
   * costs. The hurtbox is 0.26 of the drawing.
   */
  quill: { sprite: SPRITE.quill, spriteHit: SPRITE.quill, radius: 1.1, health: 1, damage: 1, speed: 0.95, fission: SPENT_BY_ARRIVING },
  /**
   * The fish's flame — `docs/decisions/0249-the-eagle-summons.md`, and the hydra's second head's.
   * The smallest and quickest bullet in the game, on 0098's rule the other way round from the
   * blasts: a whip is a lash of these, thrown along an arc with the tip faster than the root, so
   * what the player reads is a curve of fire cracking across the lane. In the `fire` ink.
   */
  // ⚠️ 0.66 is the most a 1.2-unit drawing may carry (`tests/combat.test.ts`'s band) and the least
  // that keeps the sky's far stars under the smallest thing that can kill you (`tests/sky.test.ts`).
  /*
    ⚠️ **0.66 → 1.4, AND THE CEILING ON IT WAS MEASURED RATHER THAN CHOSEN — 0301.** The drawing went
    from 1.2 units to the void's 5 so the thing could be seen at all (`src/content/sprites.ts`), and
    `tests/combat.test.ts` holds every hurtbox between 0.25 and 0.55 of its drawing. The flame already
    sat at **0.55, exactly the ceiling** — so there is no version of a void-sized fireball that keeps
    the old hitbox. Something had to go up.

    ⚠️ **AND *KEEP THE RATIO* TURNED OUT TO BE UNSURVIVABLE, WHICH A GUARD SAID AND NOBODY GUESSED.**
    Holding 0.55 gives 2.75, and `tests/crowd.test.ts` — *for at least one step there was NO place on
    the lane both safe and reachable* — went red on **the hydra's fifth phase at `burn`**. Not the
    fish's, which is what the arithmetic had been done on: the hydra grows a flame head too (0254),
    and nobody had added the two attacks together. Measured across the whole range:

      2.75  (0.55, the old ratio)   unsurvivable
      2.2   (the void's ratio)      unsurvivable
      1.9                           unsurvivable
      1.75                          survivable
      1.4                           survivable
      1.25  (the band's floor)      survivable

    ⚠️ **AND THE HURTBOX TURNS OUT NOT TO BE WHAT MAKES THAT PHASE HARD, WHICH WAS MEASURED AFTER
    BEING CHALLENGED ON IT.** A first pass took this to 1.4 for margin. Flying the guard's own pilot
    with the ship's health left alone and counting what lands, over twenty seconds of the hydra's
    fifth phase at `burn`:

      radius 1.4    32 hits
      radius 1.9    33 hits
      radius 2.75   29 hits

    Across a **two-fold** range of hurtbox the damage taken does not move — that phase is saturated by
    everything else the hydra throws, and the flame is not what is hitting the player. So *margin*
    bought nothing and cost the thing that was actually asked for.

    ⚠️ **WHAT THE GUARD IS ACTUALLY CATCHING IS THE CHILL, NOT THE FIREBALL.** `widestReachableRun`
    sizes *reachable* off `speedNow`, and the hydra slows the ship (0253) — so the cells the pilot can
    get to shrink, and a wider bullet then closes the last of them. Real, and about the interaction
    rather than about this number.

    ⚠️ **SO IT IS 1.75: THE MOST THE STANDING INVARIANT ALLOWS.** *"Take it"* was the ask; the only
    thing standing between it and 2.75 is a guard, and that is a conversation about the guard rather
    than about balance — `docs/decisions/0301-the-whip-throws-fireballs.md` has the numbers to have it
    with.
  */
  flame: { sprite: SPRITE.flame, spriteHit: SPRITE.flame, radius: 1.75, health: 1, damage: 1, speed: 1.8, fission: SPENT_BY_ARRIVING, trail: 'ember' },
  /*
    ⚠️ **THE BIGGEST AND THE SLOWEST HOSTILE BULLET, WHICH IS 0098'S TRADE AT ITS FAR END** — 0251.
    A chunk of volcanic rock falling on the lane: a fifteenth of the lane across, at under half the
    ship's speed, so it is the thing the player walks away from. `speed` is how fast it FALLS —
    across the lane, not down it — because a fall is the one shot in the game that travels the
    short axis. Its hurtbox is a third of its drawing, inside `tests/combat.test.ts`'s band, and it
    hits for two: a rock is not a bullet.
  */
  rock: { sprite: SPRITE.rock, spriteHit: SPRITE.rock, radius: 2.2, health: 1, damage: 2, speed: 0.7, fission: SPENT_BY_ARRIVING },
  /*
    ⚠️ **BETWEEN THE ACID AND THE ROCK, WHICH WAS THE ONE SLOT THE LADDER HAD LEFT** — 0253. Every
    hostile bullet had to be drawn more than five pixels from every other, and the quick one had to
    be the small one; from the flame's 1.2 to the acid's 5 the rungs were 0.7 and 0.8 apart, and the
    only room was the 1.5 between the acid and the rock.

    ⚠️ **THAT LADDER IS GONE — 0295**, and this row is the clearest record of what it was costing: a
    frost shot's size was picked by asking where a sorted list had a gap, not by asking what a shard
    of frost should look like. `docs/decisions/0295-a-ranking-guard-is-a-content-limiter.md`. The
    number has not moved and is now free to. A shard of frost sits there: 5.75 drawn, at 0.75 a
    step, a hair slower than the acid and quicker than the rock. The
    hurtbox is 0.3 of it. It hits for one: what the frost ship does to you is slow you, and that is
    the hull's, not the shot's.
  */
  /*
    ⚠️ **AND IT IS THE ONE SHOT WITH A LIFE AFTER THE MUZZLE — 0263.** *"The frost attacks should
    explode into directional frost bullets, which explode into snowflake patterns."* Three quarters
    of a second out, a shard bursts into two along its own heading, a lane's tenth apart; two
    thirds of a second on, each of those bursts into a snowflake — six evenly round, one on the
    heading — and a flake melts a second and a half after that. So one shard is two bolts and then
    twelve flakes, and where the player was when it left the hull is the wrong place to be when it
    opens: the snowflake is thrown where the bolt is, not where the ship is.

    The fuses are in steps because the frame counts in steps; in seconds, 0.75, 0.67 and 1.5. The
    first is what puts the split on the screen and not at the hull; the second is what puts the
    snowflake in the player's half of the lane; the third is what keeps a screen of flakes from
    outliving the volley after it — `tests/frost.test.ts` counts what is alive.
  */
  frost: {
    sprite: SPRITE.frost,
    spriteHit: SPRITE.frost,
    radius: 1.7,
    health: 1,
    damage: 1,
    speed: 0.75,
    fission: [
      { after: 45, into: 'fan', shots: 2, spread: 0.6 },
      { after: 40, into: 'ring', shots: 6 },
      { after: 90, into: 'nothing' },
    ],
  },
  /**
   * The player's second auto-weapon: slower than the pulse, and worth three of it.
   *
   * Asked for after playing the two-level build: *"missiles — a second auto-weapon, slower than the
   * pulse, 3x its damage, fired from launchers on the ship."*
   *
   * ⚠️ **The DAMAGE is a ratio and the SPEED is not, and that asymmetry is the rule this file opens
   * with.** *Three times the pulse* is what was asked for and it is a relationship between two of the
   * player's own weapons — `tests/combat.test.ts` holds it as a ratio, so tuning the pulse moves the
   * missile with it. A speed written as a ratio would be the banned kind: what makes a threat
   * dodgeable is measured against the ship, and 0034 keeps every speed absolute for exactly that
   * reason. 1.5 is slower than the pulse's 2.6 and that is the whole of what the ask says about it.
   *
   * ⚠️ **Bigger radius than the pulse**, because a heavier shot that misses by the same margin as a
   * light one is a shot the player cannot aim differently. It stays well under the smallest enemy.
   */
  missile: { sprite: SPRITE.missile, spriteHit: SPRITE.missile, radius: 1.3, health: 1, damage: 3, speed: 1.5, fission: SPENT_BY_ARRIVING },
  /**
   * The homing missile — `docs/decisions/0235-a-seeker-hunts-the-nearest-body.md`.
   *
   * ⚠️ **TWO PULSES, between the pulse's one and the missile's three, and `tests/seekers.test.ts`
   * holds it as the order rather than the number.** *"A bit less damage than regular missiles"* is
   * the ask, and what pays for the guidance is the third pulse. Slower than the straight missile
   * too, so a body it has to come about for is reached a beat later than one it was pointed at.
   */
  seeker: { sprite: SPRITE.seeker, spriteHit: SPRITE.seeker, radius: 1.4, health: 1, damage: 2, speed: 1.4, fission: SPENT_BY_ARRIVING },
  /**
   * The bomb itself, which hurts nothing at all.
   *
   * ⚠️ **`damage` is 0 and that is not an oversight.** A bomb is spent by its FUSE rather than by
   * arriving — it is in no collision pairing, exactly like debris, so it passes through whatever it
   * is aimed at and goes off where the player aimed it. A bomb that detonated on contact would be a
   * missile with a bigger number, and the thing that makes it a skill is choosing the PLACE.
   */
  bomb: { sprite: SPRITE.bomb, spriteHit: SPRITE.bomb, radius: 2, health: 1, damage: 0, speed: 2.2, fission: SPENT_BY_ARRIVING },
  /**
   * What a bomb becomes: six pulses of damage, everywhere inside a third of the lane.
   *
   * ⚠️ **The damage is a RATIO of the pulse's, like the missile's is** — *"6× a pulse's damage"* is
   * what was asked for, and it is a relationship between two of the player's own weapons.
   *
   * ⚠️ **`radius` is the reach of the damage AND the size it is drawn at**, and the two are held to
   * each other by `tests/bombs.test.ts` because they live in different files. Everywhere else in
   * this project the hurtbox is deliberately smaller than the art
   * (`src/content/sprites.ts`) — a blast is the one body where that would be a lie, because the
   * player is inside it too and is being asked to judge the edge.
   *
   * ⚠️ **`speed` is 0: it does not travel.** It appears where the bomb was and stays there while the
   * world moves past it, which is what a shockwave in a scrolling world looks like.
   */
  blast: { sprite: SPRITE.blast, spriteHit: SPRITE.blast, radius: BLAST_RADIUS, health: 1, damage: 6, speed: 0, fission: SPENT_BY_ARRIVING },
  /*
    ── THE THREE OTHER RUNGS OF THE PYRE, AND THE MIDDLE ONE IS `blast` ITSELF ─────────────────────

    Asked for in play: *"the player's ship (and only the player's ship) exploding on death should fire
    all unspent bombs at the player ship's location with an expanding ring based on number of bombs —
    0 bombs = half current bomb explosion size, 1 bomb = bomb explosion, 2 bombs = increased explosion
    size, 3 increased further."*
    `docs/decisions/0079-a-death-is-a-beat-and-the-arsenal-goes-up-with-the-ship.md`.

    ⚠️ **Four rungs and only three rows, because the ask names the second one as a thing that already
    exists**: *"1 bomb = bomb explosion"* is the bomb's own blast, so `PYRES` in
    `src/content/specials.ts` lists `blast` at that rung rather than a fourth row saying 34 again.

    ⚠️ **A SIZE ladder and not a DAMAGE one.** Every rung takes exactly what a bomb takes, because
    what the player is being given is room rather than a stronger weapon — and a rung that also hit
    harder would make dying with a full arsenal the best way to kill a boss.

    ⚠️ **Each is a separate row because each is a separate BITMAP.** `src/render/surface.ts` blits at
    the extent the atlas baked, so *the same ring, larger* is not something a caller can ask for — the
    picture and the reach are one number (`src/content/sprites.ts`), and `tests/death.test.ts` holds
    all four pairs to each other the way `tests/bombs.test.ts` already held the first.
  */
  blastHalf: {
    sprite: SPRITE.blastHalf,
    spriteHit: SPRITE.blastHalf,
    radius: BLAST_RADIUS * 0.5,
    health: 1,
    damage: 6,
    speed: 0,
    fission: SPENT_BY_ARRIVING,
  },
  blastWide: {
    sprite: SPRITE.blastWide,
    spriteHit: SPRITE.blastWide,
    radius: BLAST_RADIUS * 1.5,
    health: 1,
    damage: 6,
    speed: 0,
    fission: SPENT_BY_ARRIVING,
  },
  blastWidest: {
    sprite: SPRITE.blastWidest,
    spriteHit: SPRITE.blastWidest,
    radius: BLAST_RADIUS * 2,
    health: 1,
    damage: 6,
    speed: 0,
    fission: SPENT_BY_ARRIVING,
  },
};

/**
 * The rows in `SHOT_KINDS` order, and each kind's index in it — 0263. An enemy shot carries its
 * kind as this index, exactly as an enemy carries its row's index into `enemyRows` in
 * `src/app/frame.ts`, so the frame can read a shot's stages off the row it was spawned from with an
 * array index rather than a string key. Built from the one list so neither can disagree with it.
 */
export const SHOT_ROWS: readonly ShotRow[] = SHOT_KINDS.map((k) => SHOTS[k]);
export const SHOT_INDEX: Record<ShotKind, number> = {} as Record<ShotKind, number>;
SHOT_KINDS.forEach((k, index) => {
  SHOT_INDEX[k] = index;
});
