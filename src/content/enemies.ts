/**
 * What is coming the other way.
 *
 * A `Record` over a closed union, per `docs/decisions/0016-a-hub-enumerates-kinds.md`. Two kinds,
 * which is enough to make the table's shape real without authoring a level's worth of content in a
 * PR whose subject is whether the ship can be killed at all — `docs/game.md` owns the roster, and
 * adding to it stays a table edit.
 *
 * ⚠️ **Speeds are absolute, never a multiple of `SHIP_SPEED`** — the rule and its reasoning are in
 * `src/content/shots.ts`, and the guard is in `tests/combat.test.ts`. Not repeated here beyond the
 * pointer, per `docs/decisions/0029-the-tracked-record-is-the-record.md`.
 */

import type { Body } from '../sim/entity.ts';
import type { ShotKind } from './shots.ts';
import { SPRITE } from './sprites.ts';
import type { ThemeKind } from './themes.ts';

/** Every enemy in the game. Closed. */
export type EnemyKind =
  | 'drifter'
  | 'lancer'
  | 'weaver'
  | 'turret'
  | 'charger'
  | 'warden'
  | 'spinner'
  | 'sower'
  // The seven signatures, one per place — 0232. `SIGNATURE_OF` below says whose is whose.
  | 'picket'
  | 'moth'
  | 'raptor'
  | 'sentry'
  | 'shard'
  | 'spore'
  | 'gaze';

/**
 * Every way a body can SHOOT. Closed.
 *
 * ── EVERY SHOT IN THE GAME WAS AIMED AT THE SHIP, AND ALWAYS HAD BEEN ───────────────────────────
 *
 * ⚠️ **`docs/decisions/0110-an-attack-is-a-pattern.md`.** Reported from play: *"need more variety and
 * more attacks that are pattern attacks and less target player attacks."*
 *
 * ⚠️ **IT IS AN ACCURATE READING OF THE CODE.** `fireEnemies` in `src/app/frame.ts` computed
 * `atan2(ship − enemy)` for every body that fired, with no alternative anywhere in the model.
 * `docs/decisions/0073-an-enemy-is-a-pilot.md` gave MOTION a closed union and left firing a single
 * behaviour; this is that omission arriving.
 *
 * ⚠️ **THE DIFFERENCE IS WHAT THE PLAYER IS ASKED TO DO.** An aimed shot asks *are you where it is
 * pointing* — the answer is always *move*, and it is the same answer every time. A pattern asks
 * *where is the gap*, which is a different question with a different answer per pattern, and it is a
 * question the player can get better at. That is the whole of what *"variety"* is asking for here.
 *
 * ⚠️ **AIMED IS NOT DEPRECATED AND MUST NOT BE.** 0073's argument for keeping `drift` when three
 * reactive motions arrived is exactly the argument for keeping this: *"a field where everything
 * converges reads as one threat rather than six."* A field where nothing is aimed at the player is
 * the same failure the other way up — it becomes weather. `tests/pilots.test.ts` holds that both are
 * on the field.
 */
export const ATTACK_KINDS = ['aimed', 'spray', 'wall', 'spiral'] as const;

/** Derived from the list, so an attack cannot exist in the union and be missing from the switch. */
export type AttackKind = (typeof ATTACK_KINDS)[number];

export type Attack =
  /**
   * One shot, at wherever the ship is. What every enemy in the game did until 0110.
   *
   * ⚠️ **It stays on the two bodies whose identity is built on it.** A lancer *"steers into the
   * player's lane before it fires"* and a warden *"flies in and stays with you"* — an unaimed shot
   * from either would be a body that closes on the player in order to miss.
   */
  | { kind: 'aimed' }
  /**
   * A fan, centred on the lane rather than on the ship.
   *
   * ⚠️ **DOWN THE LANE AND NOT AT ANYBODY**, so where the gaps are is a fact about the pattern and
   * not about where the player happened to be standing. `spread` is the total angle across the fan
   * and `shots` divides it, exactly as a boss's phase does — one description of *what a fan is*.
   */
  | { kind: 'spray'; shots: number; spread: number }
  /**
   * A row of shots across the lane, all travelling down it, **with a hole where the body is**.
   *
   * ⚠️ **THE GAP IS THE POINT AND IT IS AUTHORED BY SUBTRACTION.** Shots are placed at ±`gap`,
   * ±2·`gap` and so on, and the centre slot is deliberately empty — so the safe place is directly in
   * front of the thing that fired, which is the one piece of information a player can read off the
   * picture before the shots arrive. A wall with the gap somewhere else would be a wall the player
   * has to be told about.
   *
   * ⚠️ **`shots` is the number either side, so a wall is `2 × shots` bullets.** Written that way
   * because the shape is symmetrical and an odd count with a hole in it is a number nobody can check
   * by looking.
   */
  | { kind: 'wall'; shots: number; gap: number }
  /**
   * A ring of shots whose whole set turns a little every volley.
   *
   * ⚠️ **The one attack that needs STATE, and it is one number set at spawn.** `firePhase` on the
   * entity carries where in the turn a body has got to — the same shape `spin` and `bobPhase`
   * already have, and for the same reason `src/sim/entity.ts` gives: everything else in the game
   * leaves it at zero and nothing reads it.
   *
   * ⚠️ **IT COULD NOT BE A FUNCTION OF POSITION, WHICH IS THIS PROJECT'S USUAL ANSWER.** A weave is
   * authored against `along` so that a shape can be drawn on a map (0073); a spinner holds station,
   * so its `along` never changes and an angle derived from it would never turn. Deriving it from the
   * CAMERA instead would put every spinner on the field at the same angle, which is 0098's *"they
   * all fire at exactly the same time"* wearing a different hat.
   *
   * `turn` is radians added per volley.
   */
  | { kind: 'spiral'; shots: number; turn: number };

/**
 * How many bullets one volley of `attack` puts on the field.
 *
 * ⚠️ **THE ONE DESCRIPTION, and three guards were about to hand-derive it.** `tests/pilots.test.ts`
 * bounds how many shots a body gets away while it is on screen, `tests/spawns.test.ts` counts bullets
 * on a step to tell a figure from a volley, and `tests/level.test.ts` reads how much a wave sends —
 * all three used to be able to assume *one body, one bullet*, and none of them can now.
 *
 * ⚠️ **A `wall` is `2 × shots` because `shots` is the number EITHER SIDE**, which is the one place
 * that convention could be got wrong twice. It is stated once here and nowhere else.
 *
 * ⚠️ **It is an upper bound rather than a promise**, because a volley that will not fit in the pool
 * is dropped rather than grown — `src/sim/pool.ts` — and a `wall` slot outside the lane is skipped.
 */
export function shotsPerVolley(attack: Attack): number {
  switch (attack.kind) {
    case 'aimed':
      return 1;
    case 'spray':
      return attack.shots;
    case 'wall':
      return attack.shots * 2;
    case 'spiral':
      return attack.shots;
    default: {
      // `docs/decisions/0016-a-hub-enumerates-kinds.md`: the arm that makes the union closed.
      const never: never = attack;
      return never;
    }
  }
}

/**
 * Every way a body can move. Closed.
 *
 * ── THE UNION THIS FILE PREDICTED, ARRIVING ON ITS OWN TRIGGER ──────────────────────────────────
 *
 * The fields below used to be `weaveAmplitude`, `weaveWavelength` and `roam`, and this file argued
 * against a union in so many words: *"a straight line is a weave of amplitude zero. A union would
 * enumerate two members that are one member with a parameter."* It then named exactly what would
 * change its mind:
 *
 * > *"The union earns its place the moment a motion arrives that is **not** a parameterisation of
 * > this one — something that turns towards the player, or stops."*
 *
 * Three have arrived at once, and they turn towards the player. Reported from play:
 *
 * > *"We need to make the enemies actually enemies, currently basically every wave is just a wall
 * > that you pass by. They need to circle, double back etc and be actively dog-fighting with the
 * > player… the game is just not a game, it has actually become what we tried to avoid, a one-button
 * > autopilot stick where you just move around a bit."*
 *
 * `docs/decisions/0073-an-enemy-is-a-pilot.md`.
 *
 * ⚠️ **`drift` and `weave` are the two that already existed, unchanged in behaviour.** Nothing about
 * how the drifter, the turret, the weaver or the warden's swing moves has been re-tuned here; they
 * have been given the name they always had. What is new is that a row can now say something the old
 * three fields could not express at all.
 *
 * ⚠️ **A DISCRIMINATED union rather than a flag plus every parameter**, which is what makes
 * `tests/spawns.test.ts`'s old guard — *no row carries both a weave and a roam* — structurally
 * impossible rather than merely checked. `docs/scaffold-plan.md`'s instruction ladder puts *remove
 * the affordance* at the top and calls it the only tier that reliably works; that guard is deleted
 * with this change, and its reason is recorded rather than its assertion.
 */
export const MOTION_KINDS = ['drift', 'weave', 'hunt', 'circle', 'loop'] as const;

/** Derived from the list, so a motion cannot exist in the union and be missing from the switch. */
export type MotionKind = (typeof MOTION_KINDS)[number];

export type Motion =
  /**
   * Holds its lane, or wanders across it and turns round outside it.
   *
   * ⚠️ **The one motion that is not about the player at all**, and it stays because not everything
   * should hunt. A field where every body converges is as readable as one where none does — 0034's
   * *a threat is absolute* is what keeps the kinds distinguishable, and something a player can safely
   * ignore is what makes the things they cannot ignore mean anything.
   *
   * `roam` is world units per step across; `0` holds the lane. It turns round at `ROAM_MIN`/`ROAM_MAX`
   * in `src/sim/camera.ts`, so a body carrying one leaves the lane and comes back —
   * `docs/decisions/0059-the-lane-is-the-players-box.md`.
   */
  | { kind: 'drift'; roam: number }
  /**
   * Swings either side of the line it was spawned on.
   *
   * ⚠️ **The path is a function of `along`, not of elapsed time.** Two of these spawned four seconds
   * apart trace the same shape through the same piece of world, which is what makes a level
   * authorable — a formation is a picture, not a coincidence of when it happened to be created. A
   * weaver with `closing: 0` therefore does not weave at all, because it never moves along.
   *
   * ⚠️ **This is the last motion with that property, and the three below deliberately break it.**
   * See the note on `hunt`.
   */
  | { kind: 'weave'; amplitude: number; wavelength: number }
  /**
   * Steers across the lane towards wherever the ship is, while it closes.
   *
   * ── THE PROPERTY THE THREE REACTIVE MOTIONS GIVE UP, STATED ONCE ────────────────────────────────
   *
   * ⚠️ **A reactive path is not a function of `along`, so it cannot be authored as a picture.** That
   * is the cost of this whole change and it is worth naming plainly: a designer can no longer look at
   * a wave table and know where its members will be. What is NOT given up is reproducibility — the
   * step is fixed (0022), the ship's position is a function of the player's input, and nothing here
   * draws from a generator, so a seeded replay is identical. What is given up is *predictability from
   * the map*, which is the thing the play-test called a wall.
   *
   * `agility` is world units per step of its own steering, before the tier's aggression multiplies it.
   */
  | { kind: 'hunt'; agility: number }
  /**
   * Flies in, then orbits the ship rather than passing it.
   *
   * ⚠️ **It closes normally until it is inside `radius × ENGAGE`, and only then engages** — otherwise
   * a body spawned 246 units out would try to orbit a ship it has not reached, and the tangential
   * component would carry it sideways off the lane before it ever arrived.
   *
   * ⚠️ **The orbit is clipped against the camera's trailing edge rather than allowed to leave.** An
   * orbit centred on a ship the player has flown to the very back of the box would otherwise dip
   * behind the camera and be culled — which would make retreating to the back edge a way of deleting
   * the toughest thing in the game for free.
   */
  | { kind: 'circle'; agility: number; radius: number }
  /**
   * Chases the ship's position ALONG the lane, turning round each time it overshoots.
   *
   * ⚠️ **This is the direct answer to the play report that a passed wave is unanswerable** — *"we
   * have no way currently to deal with enemies that fly past the player."* A body that comes back
   * re-enters the player's firing arc, so the fix is that the threat returns to where the guns point
   * rather than that the guns learn to point backwards. The rear weapon is still coming; this is what
   * makes it an option rather than a requirement.
   *
   * ⚠️ **`turns` is how many times it may cross the ship before it gives up and leaves.** Unbounded,
   * a level would accumulate every charger it ever spawned until the pool filled — enemies leaving is
   * what makes a wave table a pace rather than a total.
   *
   * ⚠️ **It does NOT steer across, and that is the charger's identity kept intact.**
   * `src/content/enemies.ts` says a charger is fair *"because its line is readable the instant it
   * appears"*; one that also tracked sideways would be a homing missile at a speed nothing can be
   * read twice at. It comes back along the same line, and moving out of it is the answer.
   *
   * ⚠️ **IT CARRIES NO SPEED OF ITS OWN, and the absence is the design.** A body that came back at a
   * rate authored here would be two numbers describing one speed — its `closing` on the way in and
   * an `agility` on the way out — and the first time either moved they would disagree. It returns at
   * exactly the speed it arrived at, measured in the camera's frame, so the turn is a change of
   * direction and never a change of pace. That also means the motion needs no engagement range: the
   * velocity it computes while the body is still approaching is the one the spawner already gave it,
   * to the unit.
   */
  | { kind: 'loop'; turns: number };

export interface EnemyRow extends Body {
  /**
   * World units per step it closes on the player, ON TOP of the camera's own advance.
   *
   * ⚠️ Positive means *towards* the trailing edge, which is towards the player. It is not the
   * entity's velocity — the spawner negates it — because a table that stored a negative number for
   * "approaching" is a table where a typo produces an enemy that flees and nothing looks wrong.
   *
   * ⚠️ **`circle` and `loop` take it over once they engage**, because both of them decide their own
   * `along` velocity. It is still what gets them there.
   */
  /*
    ── WHAT THIS NUMBER ACTUALLY DECIDES IS HOW LONG THE BODY IS ON SCREEN ─────────────────────────

    ⚠️ **`docs/decisions/0105-a-body-is-on-screen-long-enough-to-answer.md`.** Reported from play:
    *"enemies overall fly too fast and shoot too fast"* — and asked about directly, the answer was
    that it *"has to do with their time onscreen and the player's time to interaction with them"*.

    ⚠️ **A body's speed in the camera's frame is `SCROLL_PER_STEP + closing`** (0023: every speed is
    in the camera's frame), so a 16:9 view of 178 units gives it `178 / (0.6 + closing) / 60` seconds
    on screen. That is the quantity the player is describing, and no row in this table was written
    against it. Driven over the old values, the charger had **1.74 seconds** at the easiest tier and
    **1.38** at the hardest.

    ⚠️ **AND THE TIME TO REACH THE PLAYER IS SHORTER THAN ANYBODY WOULD GUESS.** The player's box
    runs to 167 units ahead of the camera and the view is 178, so a body appears **eleven units** from
    the front wall — a tenth of a second for a charger. A player who flies forward, which is the
    natural way to play, is met by things that materialise on top of them. `tests/pilots.test.ts`
    holds the window in seconds now.
  */
  closing: number;
  /** Steps between shots. `0` never fires, which is what makes a pure obstacle a row rather than a type. */
  fireEvery: number;
  /** What it fires. Ignored when `fireEvery` is `0`. */
  shot: ShotKind;
  /** How it moves. One arm of the union above, and the arm carries its own parameters. */
  motion: Motion;
  /**
   * How it shoots. One arm of `Attack`, and the arm carries its own parameters.
   *
   * ⚠️ **Required rather than defaulted to `aimed`**, so that adding a row is a decision about what
   * the body ASKS of the player rather than a field somebody forgot. `docs/decisions/0016-a-hub-enumerates-kinds.md`
   * — behaviour rides the row, and a default is a behaviour nobody wrote down.
   *
   * ⚠️ **A row that never fires still states one**, because `fireEvery: 0` is what makes a body a
   * pure obstacle and the two facts are separate: the day a drifter starts shooting, what it shoots
   * is already a decision on the page.
   */
  attack: Attack;
}

/** Written out rather than derived, so the table below cannot quietly lose a row. */
export const ENEMY_KINDS: readonly EnemyKind[] = [
  'drifter',
  'lancer',
  'weaver',
  'turret',
  'charger',
  'warden',
  'spinner',
  'sower',
  'picket',
  'moth',
  'raptor',
  'sentry',
  'shard',
  'spore',
  'gaze',
];

/**
 * Which enemy kind is a place's own — `docs/decisions/0232-each-place-has-its-own-enemy.md`.
 *
 * ⚠️ **ONE PER PLACE, SENT BY THAT PLACE'S LEVEL AND BY NO OTHER.** *"Each level needs its own brand
 * of unique enemy to flavour that world."* The eight kinds above are the game's vocabulary and every
 * level draws on most of it; a signature is a body the player meets in one place and nowhere else.
 * `tests/signature.test.ts` holds the pairing both ways, over the levels' own wave lists.
 */
export const SIGNATURE_OF: Record<ThemeKind, EnemyKind> = {
  approach: 'picket',
  nebula: 'moth',
  saurian: 'raptor',
  labyrinth: 'sentry',
  rime: 'shard',
  mire: 'spore',
  core: 'gaze',
};

export const ENEMIES: Record<EnemyKind, EnemyRow> = {
  /**
   * Holds its line and never fires. The thing you shoot while you are learning where the lane is —
   * and the case that proves `fireEvery: 0` is a row rather than a second entity type.
   *
   * ⚠️ **One health, so the harmless one dies to one shot.** It shipped at two, which meant the
   * FIRST hit on every enemy in the game changed nothing visible and read as a bug. The flash fixes
   * the reading; this makes the common case not need one, and buys the two kinds a difference the
   * player feels rather than only sees.
   */
  drifter: {
    sprite: SPRITE.drifter,
    spriteHit: SPRITE.drifterHit,
    radius: 2.6,
    health: 1,
    damage: 2,
    closing: 0,
    fireEvery: 0,
    shot: 'spit',
    /*
      ⚠️ **The stillest thing in the game, and now the widest-ranging.** `closing: 0` means it holds
      station in the world and lets the camera reach it, so it has no motion of its own at all —
      which is what made it the middle of the reported *narrow tunnel*. It cannot weave, because a
      weave is a function of `along` and this has no `along` of its own, so a roam is the only
      lateral motion available to it. It gets the fastest one: it is harmless, so a player who has to
      lead it is being taught rather than punished.

      ⚠️ **It is deliberately one of the two that did NOT become a dog-fighter** — 0073. The play
      report is that every wave is a wall; the answer is not that every body hunts, because a field
      where everything converges reads as one threat rather than six. This is the one the player is
      safe to ignore, which is what makes the rest mean something.
    */
    attack: { kind: 'aimed' },
    motion: { kind: 'drift', roam: 0.3 },
  },
  /**
   * Closes, and shoots where the ship is. Aimed rather than sprayed, because the quantity this whole
   * build exists to make measurable is *whether the player can get out of the way* — and a shot that
   * was never coming at them measures nothing.
   *
   * Two health, and it is the only thing in the game that takes two — so "it did not die" is now a
   * fact about the lancer specifically, told by a silhouette the player can read before firing.
   */
  lancer: {
    sprite: SPRITE.lancer,
    spriteHit: SPRITE.lancerHit,
    // Bigger on screen, so bigger to hit. A drawn size and a hurtbox that disagree is the complaint
    // `tests/combat.test.ts` holds a band against, in both directions.
    radius: 3.2,
    health: 2,
    damage: 2,
    closing: 0.22,
    fireEvery: 102,
    /*
      ⚠️ **ITS OWN BULLET SINCE 0098, and it is the fast thin one.** *"All the enemy bullets are
      exactly the same"* was literally true — three shooting kinds and seven bosses named one row.
      A lancer steers into the player's lane before it fires, so its shot is the one most likely to
      be on target already; least travel time makes it the enemy answered first rather than
      out-flown. Same 0.9 hurtbox as every other threat.
    */
    shot: 'lance',
    /*
      ⚠️ **IT NOW COMES TO YOU, and this is the row where the play report bites hardest.** A lancer
      was a body on a fixed lane that happened to shoot along it, so a player who was not in that lane
      was never in the fight — *"just a wall that you pass by."* Tracking the ship's `across` makes
      the same enemy, the same speed and the same gun into something the player has to answer.

      ⚠️ **0.35, AND IT WAS 0.18 UNTIL A GUARD MEASURED WHAT THAT ACTUALLY BOUGHT.** The first number
      was picked to read as *leaning towards the player rather than latching onto them*, which sounds
      like restraint and was a body that could never arrive: a lancer is only in front of the player
      for about three seconds before the trailing cull retires it, and at 0.18 that is thirty units of
      steering against a hundred-unit lane. It crossed a third of the gap and left — which is the
      wall the play-test was complaining about, wearing a chase.

      `tests/pilots.test.ts` asserts the thing that matters instead: **it reaches the ship's lane
      before it passes them.** At 0.35 it crosses the whole lane in about five seconds and closes a
      full-width gap inside its own approach, which is what makes it a hunter rather than a lean.
    */
    attack: { kind: 'aimed' },
    motion: { kind: 'hunt', agility: 0.35 },
  },
  /**
   * Crosses the lane while it closes, and never fires.
   *
   * The one enemy whose threat is **where it will be** rather than what it sends. A drifter is a
   * target and a lancer is a shot to dodge; this is neither, and it is the first thing in the game
   * that makes the player lead a moving object with the auto-fire they otherwise never think about.
   *
   * ⚠️ **Amplitude 9, which is a bound of 18 and not of 9.** The path is `across₀ + A·(sin k·along −
   * sin k·along₀)`: every weaver traces a full swing of ±A, but where that swing is CENTRED depends
   * on the phase it happened to spawn at, and that shifts it by up to another A. So the lane a wave
   * is authored on has to leave `2A` clear on both sides, not `A` — `tests/level.test.ts` checks
   * every authored wave against that bound rather than trusting the author to have done the algebra.
   */
  weaver: {
    sprite: SPRITE.weaver,
    spriteHit: SPRITE.weaverHit,
    radius: 2.2,
    health: 1,
    damage: 2,
    closing: 0.31,
    fireEvery: 0,
    shot: 'spit',
    /*
      ⚠️ **16, and it was 7.** The bound is `2A` — 32 either side of the member's own start — which
      takes a weaver spawned on lane 45 out to 13 and 77, and the acrossMinus member of a wave on lane
      40 clear off the edge of the screen and back. That is the reported *narrow tunnel* answered in
      the one row that already had the mechanism for it.

      ⚠️ **It is the widest the authored script leaves room for, and it was found by the guard rather
      than by choosing it.** `tests/level.test.ts` checks every member of every wave against the ROAM
      band, and 18 put the outermost weaver of two waves past it —
      `docs/decisions/0059-the-lane-is-the-players-box.md`.
    */
    /*
      130 units is about 3.6 seconds of camera at the current scroll — one full swing per crossing of
      the screen, so the shape is legible rather than a vibration.

      ⚠️ **Lengthened WITH the amplitude, and that is not tidiness.** The lateral rate is `A·k·closing`,
      so widening the swing at the old wavelength would have taken it from 0.20 to 0.46 units a step —
      and what a weaver is for is making the player LEAD it, which stops being a decision once it
      crosses the lane faster than they can react. At 130 it peaks at 0.39.

      ⚠️ **Unchanged by 0073, and the union is what makes that visible.** A weaver's threat is *where
      it will be*, which is a promise the player can learn; making it react would delete the one enemy
      whose path is a shape rather than a chase.
    */
    attack: { kind: 'aimed' },
    motion: { kind: 'weave', amplitude: 16, wavelength: 130 },
  },
  /**
   * Holds its ground and fires faster than anything else.
   *
   * ⚠️ **Three health, so it is the first thing that cannot be cleared in passing.** The player has
   * to choose between spending time on it and living with it, which is the choice a level is made
   * of. `closing: 0` means it arrives with the world rather than coming to meet you — so it is
   * always on screen for a known amount of time, and a formation can be authored around that.
   */
  turret: {
    sprite: SPRITE.turret,
    spriteHit: SPRITE.turretHit,
    radius: 3.7,
    health: 3,
    damage: 2,
    closing: 0,
    // Faster than the lancer's 75 and it is the whole of what this enemy is. `docs/state-of-play.md`
    // says no enemy shot has ever landed on an attentive player; this is the row that tests that.
    fireEvery: 72,
    /*
      ⚠️ **ITS OWN BULLET SINCE 0098, and it is the slow fat one.** A turret holds station, is on
      screen for a known length of time and fires faster than anything else in the game; a quick
      bullet on that cadence is a wall, and a slow wide one is a pattern to move through. Which is
      what the other half of 0098 is about — the wave now plays a figure rather than a volley, and a
      figure is only readable if the shots are slow enough to be seen arriving.
    */
    shot: 'flak',
    /*
      ⚠️ **The slowest roam there is, and it still has one.** `closing: 0` is the whole of what a
      turret is — it arrives with the world and is on screen for a known length of time, which is what
      a formation is authored around — and that is exactly the property a fast roam would spend. Slow
      enough that the emplacement still reads as an emplacement; fast enough that it is not a post.

      ⚠️ **The second of the two that did not become a dog-fighter**, and for a different reason from
      the drifter's: an emplacement that chased would not be an emplacement. What a turret is FOR is
      being a fixed problem in a known place that the player chooses whether to spend time on — 0073
      does not get to delete the one enemy a formation can be authored around.
    */
    attack: { kind: 'spray', shots: 3, spread: 0.85 },
    motion: { kind: 'drift', roam: 0.16 },
  },
  /**
   * Comes straight at you, fast, and dies to one shot.
   *
   * A pure contact threat: no weapon, one health, and roughly three times the lancer's closing
   * speed. It punishes a player who is looking at the wrong part of the lane, and it rewards the
   * auto-fire they already have — which is the right shape for the first fast thing in a game whose
   * skill is *surviving the onslaught, not mashing a fire button*.
   */
  charger: {
    sprite: SPRITE.charger,
    spriteHit: SPRITE.chargerHit,
    radius: 2.4,
    health: 1,
    damage: 2,
    closing: 0.68,
    fireEvery: 0,
    shot: 'spit',
    /*
      ⚠️ **IT COMES BACK, TWICE, AND THAT IS THE ANSWER TO THE UNANSWERABLE WAVE.** Reported: *"we
      have no way currently to deal with enemies that fly past the player."* A charger was the worst
      offender — the fastest thing in the game, so the one most often behind you — and this turns it
      from a body that is gone into a body that returns to where the guns already point.

      ⚠️ **It still does not steer across, and that is this enemy's identity kept whole.** What makes
      a charger fair at this speed is that its line is readable the instant it appears; one that
      tracked sideways as well would be a homing missile at a speed nothing can be read twice at. It
      comes back along the same line, and the answer is to not be on it.

      ⚠️ **Two turns rather than unbounded.** Three passes in total, then it leaves — a level whose
      chargers never departed would fill the pool with the first minute's worth, and enemies leaving
      is what makes a wave table a pace rather than a total.
    */
    attack: { kind: 'aimed' },
    motion: { kind: 'loop', turns: 2 },
  },
  /**
   * Weaves **and** fires. Level two's enemy.
   *
   * ⚠️ **Not a sixth behaviour — the two that already exist, on one row.** Every other enemy does
   * exactly one thing: hold, close, weave, or shoot. This is the first that makes the player solve
   * two problems with one answer, and it needed no new code at all, which is
   * `docs/decisions/0016-a-hub-enumerates-kinds.md`'s whole promise about behaviour riding the row.
   *
   * ⚠️ **Four health, so it is the toughest thing in the game that is not a boss** — and therefore
   * the biggest, because size carries toughness and `tests/combat.test.ts` holds that ordering. It
   * fires slower than a turret to pay for the rest: something this hard to kill, that also moves and
   * also shoots, at a turret's rate would be a wall rather than an enemy.
   */
  warden: {
    sprite: SPRITE.warden,
    spriteHit: SPRITE.wardenHit,
    radius: 4,
    health: 4,
    damage: 2,
    closing: 0.19,
    fireEvery: 84,
    shot: 'spit',
    /*
      ⚠️ **THE ONE THAT ACTUALLY DOG-FIGHTS.** It used to weave and fire — *"not a sixth behaviour,
      the two that already exist on one row"* — which made the toughest body in the game a wide,
      predictable swing that a player could simply be elsewhere for. It now flies in and stays with
      you: the fight is the fight, rather than a window while it passes.

      ⚠️ **Radius 30 against a ship that sits about 40 ahead of the camera**, so a normal orbit spans
      roughly the camera's trailing edge to 70 ahead of it — on screen on every device, and clipped
      rather than culled when the player retreats to the very back of the box.

      ⚠️ **Slower than the lancer's hunt in absolute terms and far more dangerous in effect**, which
      is why it fires slower than a turret: something this hard to kill that also stays on you would
      be a wall rather than an enemy at a turret's rate. Every number here is a play-test number.
    */
    attack: { kind: 'aimed' },
    motion: { kind: 'circle', agility: 0.55, radius: 30 },
  },
  /**
   * Holds station and turns a ring of fire round itself. The first body in the game whose threat is
   * a SHAPE rather than a line to you.
   *
   * ⚠️ **`docs/decisions/0110-an-attack-is-a-pattern.md`.** Reported: *"more attacks that are pattern
   * attacks and less target player attacks."* Every other shooting kind in this table answered *are
   * you where I am pointing*; this one asks *where is the gap*, and the gap moves on a schedule the
   * player can learn and the ship's position cannot change.
   *
   * ⚠️ **Three health, so it is a fixed problem the player chooses whether to spend time on** — the
   * turret's own argument, and it is the row this one is closest to. What separates them is what
   * comes out: a turret throws a fan down the lane and this throws it in every direction, so a
   * turret is answered by leaving its arc and a spinner is answered by timing.
   *
   * ⚠️ **`closing: 0`, which is what makes a rotating pattern legible at all.** A body that both
   * closes and turns its fire is two rates the player has to integrate at once; holding station makes
   * the ring the only moving part. It is the third row with the property `tests/pilots.test.ts` calls
   * *arrives with the world*.
   */
  spinner: {
    sprite: SPRITE.spinner,
    spriteHit: SPRITE.spinnerHit,
    radius: 3.4,
    health: 3,
    damage: 2,
    closing: 0,
    /*
      ⚠️ **84 steps, and the floor is a guard rather than a taste.** `closing: 0` means it is on
      screen for the whole five seconds a 16:9 view takes to pass it, and `tests/pilots.test.ts` bounds
      how many SHOTS one body may get away in that window. Three a volley at 84 steps is 25 shots at
      the hardest tier; a cadence of 72 would be 29 and past the bound.
    */
    fireEvery: 84,
    /*
      ⚠️ **The slow fat one, for the turret's own reason and more so.** 0098: *"a slow wide one is a
      pattern to move through… a figure is only readable if the shots are slow enough to be seen
      arriving."* A ring of fast darts is a hit or a miss decided before the player can read it.
    */
    shot: 'flak',
    /*
      ⚠️ **Three shots and a fifth of a turn, so the ring closes over about ten volleys.** Any two
      consecutive volleys leave a gap wide enough to sit in, and the gap walks — which is the whole
      behaviour. A `turn` that divided `2π/shots` exactly would put every volley on one of three
      angles for ever, which is a strobing triangle rather than a spiral.
    */
    attack: { kind: 'spiral', shots: 3, turn: 0.42 },
    // The slowest roam there is, on the turret's terms: an emplacement that still is not a post.
    motion: { kind: 'drift', roam: 0.12 },
  },
  /**
   * Lays a wall across the lane with a hole in it, and the hole is directly in front of it.
   *
   * ⚠️ **THE ONE ATTACK THE PLAYER CAN READ BEFORE IT HAPPENS.** Everything else in the game is
   * answered after the shots exist; this one announces where the safe place is by being there. That
   * is what makes it a pattern rather than a spread — a spread asks the player to react, and this asks
   * them to have already moved.
   *
   * ⚠️ **It closes slowly and it is the only wall-layer**, so the player has time to line up on it —
   * and the wall it lays is what stops that being free, because the lane it clears is the lane the
   * body itself is in and something else is usually there.
   *
   * ⚠️ **Two health.** It is a body the player wants gone before it fires rather than one they have
   * to survive, which is the opposite reading from the spinner's three.
   */
  sower: {
    sprite: SPRITE.sower,
    spriteHit: SPRITE.sowerHit,
    radius: 3.1,
    health: 2,
    damage: 2,
    /*
      ⚠️ **0.24, which is between the warden's 0.19 and the lancer's 0.22 and is on screen for 3.2
      seconds at the hardest tier** — over `tests/pilots.test.ts`'s 1.8-second floor with room, and
      slow enough that a player who sees it arrive can decide where to be.
    */
    closing: 0.24,
    // Four shots a volley and about three volleys on screen: twelve bullets, which is why the cadence
    // is the slowest of any shooter in the table.
    fireEvery: 96,
    // The fast thin one. A wall is read by where its hole is rather than by watching each bullet, so
    // the shots may be quick — and quick is what makes the hole worth having found early.
    shot: 'lance',
    /*
      ⚠️ **Two either side at 13 units, so the wall spans 52 of the lane's 100 with a 26-unit hole in
      the middle.** The hole is wider than any hurtbox in the game by a factor of six, which is what
      keeps it a place to be rather than a needle to thread; the span is narrow enough that flying
      round the outside is a real alternative to taking the gap.
    */
    attack: { kind: 'wall', shots: 2, gap: 13 },
    // It goes where the wall will be. A weave means the hole travels across the lane between volleys,
    // so *the gap is in front of it* stays true and stops being a place the player can just park.
    motion: { kind: 'weave', amplitude: 12, wavelength: 150 },
  },
  /*
    ── THE SIGNATURE ENEMIES: ONE PER PLACE — 0232 ──────────────────────────────────────────────

    *"Each level needs its own brand of unique enemy to flavour that world."* The eight kinds above
    are the game's vocabulary and every level draws on most of it; each of these seven is sent by ONE
    place and no other, so a level has a body the player meets nowhere else. Every one is a new
    silhouette against the eight, on `reports/enemy-silhouettes-2026-08-05.md`'s terms — a primitive
    and an axis that survive twenty pixels — and every one that fires has a bullet-and-pattern
    signature no other kind sends (`tests/legibility.test.ts`).
  */
  picket: {
    sprite: SPRITE.picket,
    spriteHit: SPRITE.picketHit,
    radius: 3.0,
    health: 2,
    damage: 2,
    closing: 0.2,
    fireEvery: 108,
    shot: 'spit',
    /*
      THE APPROACH'S OWN: a three-bladed picket that holds its line and throws a two-shot spread.
      The first thing in the run that fires more than one bullet at once, at the slowest rate any
      shooter has — a lesson in reading a spread before Ember Nebula's moths throw three.
    */
    attack: { kind: 'spray', shots: 2, spread: 0.55 },
    motion: { kind: 'drift', roam: 0.2 },
  },
  moth: {
    sprite: SPRITE.moth,
    spriteHit: SPRITE.mothHit,
    radius: 3.4,
    health: 2,
    damage: 2,
    closing: 0.26,
    fireEvery: 96,
    shot: 'lance',
    // EMBER NEBULA'S OWN: wide wings, a deep slow weave, and a fan of three darts — embers off a moth.
    attack: { kind: 'spray', shots: 3, spread: 0.7 },
    motion: { kind: 'weave', amplitude: 22, wavelength: 170 },
  },
  raptor: {
    sprite: SPRITE.raptor,
    spriteHit: SPRITE.raptorHit,
    radius: 3.0,
    health: 2,
    damage: 2,
    closing: 0.34,
    fireEvery: 0,
    shot: 'spit',
    attack: { kind: 'aimed' },
    // SAURIAN BELT'S OWN: a crescent of jaw that hunts harder than a lancer and never fires — it bites.
    // The one two-hit body in the game with no gun, so what it costs is being caught.
    motion: { kind: 'hunt', agility: 0.5 },
  },
  sentry: {
    sprite: SPRITE.sentry,
    spriteHit: SPRITE.sentryHit,
    radius: 3.6,
    health: 3,
    damage: 2,
    closing: 0,
    fireEvery: 90,
    shot: 'flak',
    // THE LABYRINTH'S OWN: a block that holds station in the corridor and throws two slabs abreast —
    // a wall of the heavy shot, which only a sower's darts had made before.
    attack: { kind: 'wall', shots: 2, gap: 15 },
    motion: { kind: 'drift', roam: 0.1 },
  },
  shard: {
    sprite: SPRITE.shard,
    spriteHit: SPRITE.shardHit,
    radius: 3.2,
    health: 3,
    damage: 2,
    closing: 0.18,
    fireEvery: 78,
    shot: 'spit',
    // RIME SHELF'S OWN: a crystal that circles close and sheds three squares in a turning spiral.
    attack: { kind: 'spiral', shots: 3, turn: 0.3 },
    motion: { kind: 'circle', agility: 0.4, radius: 22 },
  },
  spore: {
    sprite: SPRITE.spore,
    spriteHit: SPRITE.sporeHit,
    radius: 4.0,
    health: 3,
    damage: 2,
    closing: 0.12,
    fireEvery: 0,
    shot: 'spit',
    attack: { kind: 'aimed' },
    // THE TOXIC MIRE'S OWN: a sac that drifts in slow and loops once — a mine the size of a warden,
    // that takes three hits and never fires. What it asks of the player is room.
    motion: { kind: 'loop', turns: 1 },
  },
  gaze: {
    sprite: SPRITE.gaze,
    spriteHit: SPRITE.gazeHit,
    radius: 3.6,
    health: 4,
    damage: 2,
    closing: 0.16,
    fireEvery: 90,
    shot: 'flak',
    // THE BLACK HEART'S OWN: an eye that hunts slowly and throws the heavy slab straight at you. The
    // only aimed flak in the game, from the only body that looks back.
    attack: { kind: 'aimed' },
    motion: { kind: 'hunt', agility: 0.28 },
  },
};
