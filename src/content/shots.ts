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
import { SPRITE } from './sprites.ts';

/** Every shot in the game. Closed. */
export type ShotKind =
  | 'pulse'
  | 'arc'
  | 'shuriken'
  | 'spit'
  | 'lance'
  | 'flak'
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
}

/** Written out rather than derived, so the table below cannot quietly lose a row. */
export const SHOT_KINDS: readonly ShotKind[] = [
  'pulse',
  'arc',
  'shuriken',
  'spit',
  'lance',
  'flak',
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
  pulse: { sprite: SPRITE.bullet, spriteHit: SPRITE.bullet, radius: 0.9, health: 1, damage: 1, speed: 2.6 },
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
  arc: { sprite: SPRITE.arcNode, spriteHit: SPRITE.arcNode, radius: 1, health: 1, damage: 1, speed: 0 },
  /**
   * A blade that circles the ship — `docs/decisions/0234-a-blade-circles-the-ship.md`.
   *
   * ⚠️ **`health` IS HOW MANY BODIES IT CAN LAND ON BEFORE IT IS BLUNT, and it is the first shot
   * with more than one.** `src/sim/collide.ts` spends a shot one health per arrival; a pulse has one
   * and is gone, and this has `BLADE_EDGE` and goes on. Its own clock (`orbit`, on the weapon row)
   * is what usually ends it — twelve is more bodies than a spiral crosses — so the number is a
   * ceiling on what one blade may be worth against a wall of drifters, not a life.
   *
   * ⚠️ **`speed` is how fast the LOOP'S CENTRE goes up the lane, in the camera's frame** — 0242.
   * The blade itself circles that centre at the weapon row's `coil` radius and `turn`, so its own
   * speed is this plus the loop's, which at the cap is five units a step at the top of the loop.
   * Well under the pulse's: a coil sweeps, it does not fly, and at this speed a loop advances about
   * twenty-two units on the last — the overlap the drawing had. (0237 to 0240 had it at zero, when
   * the blade circled the ship and had no speed of its own.)
   *
   * ⚠️ **`radius` 4.8 — a star bigger than the ship, since 0238.** Played at 1.4: *"shuriken stars
   * need to be a lot bigger"*; at 3.5: *"bigger and steel coloured."* The hurtbox is the sweep, so a
   * bigger blade is a wider sweep too, and the balance of that is a hand's.
   *
   * ⚠️ **`spriteHit` IS THE OTHER TURN OF THE STAR, AND THAT IS NOT A FLASH.** A blade never
   * flashes — what it survives is arriving, not being hit, and nothing in the game shoots it — so
   * the slot 0035 gives every body for its hurt twin is free, and `steerBlades` in
   * `src/app/frame.ts` swaps the two every few steps to spin it. `blit` cannot rotate; two bitmaps
   * an eighth of a turn apart are what a spinning shuriken is.
   */
  shuriken: { sprite: SPRITE.shuriken, spriteHit: SPRITE.shurikenTurn, radius: 4.8, health: BLADE_EDGE, damage: 1, speed: 0.8 },
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
  spit: { sprite: SPRITE.spit, spriteHit: SPRITE.spit, radius: 0.9, health: 1, damage: 1, speed: 1.4 },
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
  lance: { sprite: SPRITE.lance, spriteHit: SPRITE.lance, radius: 0.9, health: 1, damage: 1, speed: 1.6 },
  /**
   * The turret's. Slow and fat — a shot the player is meant to see coming and choose to be elsewhere
   * for.
   *
   * ⚠️ **A turret holds station and is on screen for a known length of time** (`src/content/enemies.ts`),
   * which is what a formation is authored around, and it fires faster than anything else. A quick
   * bullet on that cadence is a wall; a slow one is a pattern to move through, and the pattern is
   * what 0098's other half is about.
   */
  flak: { sprite: SPRITE.flak, spriteHit: SPRITE.flak, radius: 0.9, health: 1, damage: 1, speed: 1 },
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
  missile: { sprite: SPRITE.missile, spriteHit: SPRITE.missile, radius: 1.3, health: 1, damage: 3, speed: 1.5 },
  /**
   * The homing missile — `docs/decisions/0235-a-seeker-hunts-the-nearest-body.md`.
   *
   * ⚠️ **TWO PULSES, between the pulse's one and the missile's three, and `tests/seekers.test.ts`
   * holds it as the order rather than the number.** *"A bit less damage than regular missiles"* is
   * the ask, and what pays for the guidance is the third pulse. Slower than the straight missile
   * too, so a body it has to come about for is reached a beat later than one it was pointed at.
   */
  seeker: { sprite: SPRITE.seeker, spriteHit: SPRITE.seeker, radius: 1.4, health: 1, damage: 2, speed: 1.4 },
  /**
   * The bomb itself, which hurts nothing at all.
   *
   * ⚠️ **`damage` is 0 and that is not an oversight.** A bomb is spent by its FUSE rather than by
   * arriving — it is in no collision pairing, exactly like debris, so it passes through whatever it
   * is aimed at and goes off where the player aimed it. A bomb that detonated on contact would be a
   * missile with a bigger number, and the thing that makes it a skill is choosing the PLACE.
   */
  bomb: { sprite: SPRITE.bomb, spriteHit: SPRITE.bomb, radius: 2, health: 1, damage: 0, speed: 2.2 },
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
  blast: { sprite: SPRITE.blast, spriteHit: SPRITE.blast, radius: BLAST_RADIUS, health: 1, damage: 6, speed: 0 },
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
  },
  blastWide: {
    sprite: SPRITE.blastWide,
    spriteHit: SPRITE.blastWide,
    radius: BLAST_RADIUS * 1.5,
    health: 1,
    damage: 6,
    speed: 0,
  },
  blastWidest: {
    sprite: SPRITE.blastWidest,
    spriteHit: SPRITE.blastWidest,
    radius: BLAST_RADIUS * 2,
    health: 1,
    damage: 6,
    speed: 0,
  },
};
