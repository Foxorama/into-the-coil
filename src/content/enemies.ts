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

/** Every enemy in the game. Closed. */
export type EnemyKind = 'drifter' | 'lancer' | 'weaver' | 'turret' | 'charger' | 'warden';

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
  closing: number;
  /** Steps between shots. `0` never fires, which is what makes a pure obstacle a row rather than a type. */
  fireEvery: number;
  /** What it fires. Ignored when `fireEvery` is `0`. */
  shot: ShotKind;
  /** How it moves. One arm of the union above, and the arm carries its own parameters. */
  motion: Motion;
}

/** Written out rather than derived, so the table below cannot quietly lose a row. */
export const ENEMY_KINDS: readonly EnemyKind[] = ['drifter', 'lancer', 'weaver', 'turret', 'charger', 'warden'];

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
    closing: 0.35,
    fireEvery: 78,
    shot: 'spit',
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
    closing: 0.5,
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
    fireEvery: 48,
    shot: 'spit',
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
    closing: 1.1,
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
    closing: 0.3,
    fireEvery: 66,
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
    motion: { kind: 'circle', agility: 0.55, radius: 30 },
  },
};
