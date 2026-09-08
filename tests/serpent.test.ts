/**
 * The serpent strikes — `docs/decisions/0248-the-serpent-strikes.md`.
 *
 * The Approach's real boss, from the brief: *"Jormungandr … with acid blast attacks, void blast
 * attacks and then a space lightning bolt attack that rains down from the top of the screen, it'll
 * need warning lines."* Three phases, three weapons: what is held here is that a phase can change
 * what a boss throws, that the two new shots are their own things, and that the lightning warns
 * before it lands. What a boss IS — the roster, the fights — is `tests/bosses.test.ts`'s and
 * `tests/level.test.ts`'s.
 */

import { describe, expect, it } from 'vitest';
import { GameFrame } from '../src/app/frame.ts';
import { phaseFor } from '../src/app/boss.ts';
import { BOSSES, RAIN_BOLT_KIND } from '../src/content/bosses.ts';
import { LEVELS, type LevelRow } from '../src/content/levels.ts';
import { SHOTS } from '../src/content/shots.ts';
import { SPRITE_KINDS } from '../src/content/sprites.ts';
import { INK_OF } from '../src/render/bake.ts';
import { BOLT_STEPS } from '../src/render/scene.ts';
import type { Surface } from '../src/render/surface.ts';
import { ACROSS_SPAN } from '../src/sim/camera.ts';
import { reset } from '../src/sim/entity.ts';
import { PLAYER_ALONG_MARGIN, PLAYER_LEAD } from '../src/sim/flight.ts';
import { STEPS_PER_SECOND } from '../src/state/screens.ts';
import { NO_SECTIONS, playableWorld } from './world.ts';

/** The serpent alone, a short way in, with no mid-boss in front of it. */
const SERPENT_ONLY: LevelRow = {
  waves: [],
  pickups: [],
  landmarks: [],
  bossAt: 200,
  midBoss: null,
  sections: NO_SECTIONS,
  boss: 'jormungandr',
  theme: 'approach',
};

/** A serpent on station at `fraction` of its health, its fan silenced until the test says, and an immortal ship. */
function serpentAt(fraction: number): { world: ReturnType<typeof playableWorld>['world']; frame: GameFrame } {
  const { world } = playableWorld(SERPENT_ONLY);
  const frame = new GameFrame(world);
  for (let i = 0; i < 900 && (world.bossPool.size === 0 || i < 700); i++) {
    world.ship.health = world.shipRow.health;
    if (world.bossPool.size > 0) world.bossPool.at(0).fireIn = 999;
    frame.step();
  }
  expect(world.bossPool.size, 'the serpent never arrived').toBe(1);
  world.bossPool.at(0).health = world.bossFullHealth * fraction;
  return { world, frame };
}

/**
 * Turn the serpent's round to the lightning — 0261. At the last third its heads take turns, and the
 * rain is the third; `headAt` is the round's count, read off the row rather than typed.
 *
 * ⚠️ **IT WAS `firePhase` AND THAT IS THE BUG THIS BRANCH FOUND.** The serpent rakes in its opening
 * phase, and a rake advances `firePhase` by an ANGLE — so the count the heads indexed by was 5.4 by
 * the time the fight reached its second phase, and `heads[1.4]` is `undefined`. `src/sim/entity.ts`
 * carries the argument for the second field.
 */
function armRain(boss: { headAt: number }): void {
  const last = BOSSES.jormungandr.phases[BOSSES.jormungandr.phases.length - 1]!.attack;
  const heads = last !== null && last.kind === 'heads' ? last.heads : [];
  const index = heads.findIndex((h) => h.attack.kind === 'rain');
  expect(index, 'the serpent’s last third has no lightning head').toBeGreaterThanOrEqual(0);
  boss.headAt = index;
}

/** A surface that keeps every bolt stroke's hostility, so the picture can be asked whose lightning it drew. */
class Recorder implements Surface {
  readonly strokes: { count: number; alpha: number; hostile: boolean }[] = [];
  clear(): void {}
  blit(): void {}
  bolt(_points: Float32Array, count: number, _width: number, alpha: number, hostile: boolean): void {
    this.strokes.push({ count, alpha, hostile });
  }
}

describe('0248 — the serpent strikes', () => {
  it('THE THREE WEAPONS: a raking fan of acid while whole, acid and void in turn once hurt, acid, void and lightning in turn at the last third', () => {
    /*
      ⚠️ **0261 — `docs/decisions/0261-the-serpent-throws-together.md`.** 0248 gave the serpent one
      weapon a phase and the alpha play called that *"three separate fire fields"*; the phases are
      cumulative now, the hydra's heads taking turns, and the acid is a fan that rakes rather than a
      wall. The lightning is the same lightning.
    */
    const row = BOSSES.jormungandr;
    const whole = phaseFor(row, row.health);
    const hurt = phaseFor(row, row.health * 0.6);
    const last = phaseFor(row, row.health * 0.3);
    expect(whole.shot ?? row.shot, 'the serpent does not open with acid').toBe('acid');
    expect((whole.attack ?? row.attack).kind, 'the acid is not a spray that rakes — the wall is back').toBe('rake');
    const hurtHeads = (hurt.attack ?? row.attack).kind === 'heads' ? (hurt.attack as { heads: readonly { shot: string; attack: { kind: string } }[] }).heads : [];
    expect(hurtHeads.map((h) => `${h.shot}/${h.attack.kind}`), 'once hurt the serpent does not throw acid and void in turn').toEqual(['acid/spray', 'void/spray']);
    const lastHeads = (last.attack ?? row.attack).kind === 'heads' ? (last.attack as { heads: readonly { shot: string; attack: { kind: string } }[] }).heads : [];
    expect(lastHeads.map((h) => h.attack.kind), 'the last third does not throw acid, void and the lightning in turn').toEqual(['spray', 'spray', 'rain']);
    expect(lastHeads.map((h) => h.shot).slice(0, 2)).toEqual(['acid', 'void']);
    // And it is the Approach's real boss.
    expect(LEVELS.approach.boss).toBe('jormungandr');
    /*
      ⚠️ **AND DRIVEN, because the table is not the fight.** At the last third, three volleys in a
      row: acid in the air, then void, then lightning in the bolt pool and nothing in the air — the
      round the heads take, in the frame.
    */
    const { world, frame } = serpentAt(0.3);
    const boss = world.bossPool.at(0);
    const seen: string[] = [];
    for (let volley = 0; volley < 3; volley++) {
      world.enemyShots.clear();
      world.bolts.clear();
      boss.fireIn = 1;
      frame.step();
      const bolts = world.bolts.size > 0;
      const sprite = world.enemyShots.size > 0 ? world.enemyShots.at(0).sprite : -1;
      seen.push(bolts ? 'lightning' : sprite === SHOTS.acid.sprite ? 'acid' : sprite === SHOTS.void.sprite ? 'void' : 'nothing');
    }
    expect(seen, 'three volleys at the last third are not acid, void and lightning in turn').toEqual(['acid', 'void', 'lightning']);
    // And whole, the fan of acid turns a little each volley: two volleys, two centres.
    const opening = serpentAt(1);
    const centres: number[] = [];
    for (let volley = 0; volley < 2; volley++) {
      opening.world.enemyShots.clear();
      opening.world.bossPool.at(0).fireIn = 1;
      opening.frame.step();
      let sum = 0;
      for (let i = 0; i < opening.world.enemyShots.size; i++) {
        const s = opening.world.enemyShots.at(i);
        expect(s.sprite, 'the opening fan is not acid').toBe(SHOTS.acid.sprite);
        sum += Math.atan2(s.velAcross, s.velAlong - opening.world.scrollPerStep);
      }
      centres.push(sum / opening.world.enemyShots.size);
    }
    expect(Math.abs(centres[1]! - centres[0]!), 'the acid fan does not rake — two volleys point the same way').toBeGreaterThan(0.1);
  });

  it('THE MOUTH: the acid and the void leave the serpent’s SKULL, and not the middle of its body', () => {
    /*
      ⚠️ **0277.** Reported from play against the deployed preview: *"the acid blasts and voids
      currently originate from the back half of the body."* They did — every arm of `throwAttack`
      spawned at `(boss.along, boss.across)`, and a serpent's skull is at the far down-lane end of the
      widest sprite in the game.

      ⚠️ **AND SINCE 0283 THE SAME CLAIM IS MEASURED AGAINST THE BODY RATHER THAN AGAINST A BOX.**
      0277 asserted how far down-lane of the hull's centre a shot appeared, as a share of the sprite's
      half-extent, because the sprite was the whole animal and its centre was the midriff. The hull IS
      the skull now, so that arithmetic would be asking whether the mouth is in front of the mouth.

      What the report was actually about is *the shot comes out of the face and not out of the
      body* — so what is asserted is exactly that: every shot appears **down-lane of every node of the
      body**, by a clear margin. A serpent that threw from its flank fails it, a serpent that threw
      from its centre before the head became the hull fails it, and no arrangement of the table can
      satisfy it without the shot leaving the head.
    */
    for (const [name, fraction] of [
      ['the opening rake of acid', 1],
      ['the heads, once hurt', 0.6],
    ] as const) {
      const { world, frame } = serpentAt(fraction);
      const boss = world.bossPool.at(0);
      world.enemyShots.clear();
      boss.fireIn = 1;
      frame.step();
      expect(world.enemyShots.size, `${name} threw nothing`).toBeGreaterThan(0);
      expect(world.bossBody.size, `${name} was thrown by a serpent with no body`).toBeGreaterThan(0);
      // The nearest the body comes to the player: everything the shot must be in front of.
      let nearest = Number.POSITIVE_INFINITY;
      for (let i = 0; i < world.bossBody.size; i++) nearest = Math.min(nearest, world.bossBody.at(i).along);
      for (let i = 0; i < world.enemyShots.size; i++) {
        const shot = world.enemyShots.at(i);
        expect(
          nearest - shot.along,
          `${name} left the animal ${(nearest - shot.along).toFixed(1)} units down-lane of the nearest node of its ` +
            'body — a shot from anywhere but the skull reads as the body coughing',
        ).toBeGreaterThan(1);
      }
    }
  });

  it('THE ACID AND THE VOID: two shots of their own, in inks of their own, that are not the enemy’s bullet', () => {
    /*
      0098: a boss with three kinds of shot in one colour is one bullet wearing three shapes. The
      silhouettes being distinct from every other shot's is `tests/legibility.test.ts`'s; what is
      held here is the ink, and that an acid blast is fatter and slower than a void one.
    */
    const acid = INK_OF[SPRITE_KINDS[SHOTS.acid.sprite]!];
    const voidInk = INK_OF[SPRITE_KINDS[SHOTS.void.sprite]!];
    expect(acid, 'acid wears the enemy’s bullet ink').not.toBe('enemy');
    expect(voidInk, 'void wears the enemy’s bullet ink').not.toBe('enemy');
    expect(acid, 'acid and void are one ink').not.toBe(voidInk);
    expect(voidInk, 'void wears the player’s ally ink, which is the seeker’s').not.toBe('ally');
    expect(SHOTS.acid.radius, 'an acid blast is no fatter than a void one').toBeGreaterThan(SHOTS.void.radius);
    expect(SHOTS.acid.speed, 'an acid blast is no slower than a void one').toBeLessThan(SHOTS.void.speed);
    expect(SHOTS.void.damage, 'a void blast is worth no more than an acid one').toBeGreaterThan(SHOTS.acid.damage);
  });

  it('and a boss that rakes AND grows heads keeps the two counts apart, so the round survives the raking', () => {
    /*
      ⚠️ **THE CRASH THIS BRANCH SHIPPED WITH, HELD SO IT CANNOT COME BACK.** The serpent's opening
      phase rakes — the row's own attack — and its other two grow heads. A rake advances its count by
      an ANGLE, `turn` of a radian a volley; the heads index by it. On one shared field the count was
      about 5.4 by the second phase and `heads[5.4 % 2]` is `heads[1.4]`, which is `undefined` — a
      TypeError out of `throwAttack`, every serpent fight, at its first phase change.

      ⚠️ **NOTHING IN THE SUITE SAW IT.** 0261 was proven green: every guard about the serpent set the
      phase it wanted and measured that phase. What found it was
      `docs/decisions/0268-the-bob-keeps-its-centre.md`'s guard, which flies every BOBBING boss
      through all of its phases in order and was written about a hull leaving the lane — an accident,
      and one this assertion exists so as not to depend on twice.

      Driven rather than reasoned: rake the opening phase for real, then drop the health and take a
      volley from every head of the round.
    */
    const { world, frame } = serpentAt(1);
    const boss = world.bossPool.at(0);
    /*
      Long enough for the opening rake to throw several volleys and turn its angle well past the
      number of heads the later phases have. The health is held at full so the phase does not move,
      and the ship holds its fire so the subject survives being measured.
    */
    boss.fireIn = 0;
    for (let i = 0; i < 60 * 12; i++) {
      world.fireIn = Number.MAX_SAFE_INTEGER;
      boss.health = world.bossFullHealth;
      frame.step();
    }
    expect(boss.firePhase, 'the opening phase never raked, so this measures nothing').toBeGreaterThan(1);
    expect(boss.headAt, 'a rake advanced the heads’ own count').toBe(0);

    const last = BOSSES.jormungandr.phases[BOSSES.jormungandr.phases.length - 1]!.attack;
    const heads = last !== null && last.kind === 'heads' ? last.heads : [];
    expect(heads.length, 'the serpent’s last third has no heads').toBeGreaterThan(1);
    const thrown = new Set<number>();
    for (let volley = 0; volley < heads.length * 3; volley++) {
      world.fireIn = Number.MAX_SAFE_INTEGER;
      boss.health = world.bossFullHealth * 0.2;
      boss.fireIn = 0;
      const at = boss.headAt % heads.length;
      const before = world.enemyShots.size;
      // One step to fire; the round must land on a real head every time rather than on `undefined`.
      frame.step();
      if (world.enemyShots.size > before || world.bolts.size > 0) thrown.add(at);
    }
    expect(thrown.size, 'the round did not reach every head, so a rake is still steering it').toBe(heads.length);
  });

  it('THE RAIN: a volley draws its warning lines first, inside the box the ship flies in, and nothing hurts until they have run', () => {
    /*
      *"it'll need warning lines."* Driven: the serpent at its last third throws one volley; every
      column is a bolt in the arc's pool carrying `RAIN_BOLT_KIND`, its along inside the player's
      box, its life the warning plus the strike. The ship is parked in the first column and is not
      hurt for as long as the row's warning says — in seconds, at least half a one — and IS hurt on
      the step the line becomes lightning.
    */
    const { world, frame } = serpentAt(0.3);
    const boss = world.bossPool.at(0);
    armRain(boss);
    boss.fireIn = 1;
    world.ship.health = world.shipRow.health;
    frame.step();
    const columns: number[] = [];
    for (let i = 0; i < world.bolts.size; i++) {
      const b = world.bolts.at(i);
      if (b.kind === RAIN_BOLT_KIND) columns.push(b.along);
    }
    expect(columns.length, 'the volley threw no lightning').toBeGreaterThanOrEqual(2);
    for (const along of columns) {
      const inView = along - world.cameraAlong;
      expect(inView, `a column fell ${inView.toFixed(1)} into the view, behind the ship’s box`).toBeGreaterThanOrEqual(PLAYER_ALONG_MARGIN - 1);
      expect(inView, `a column fell ${inView.toFixed(1)} into the view, past the ship’s box`).toBeLessThanOrEqual(PLAYER_LEAD + 1);
    }
    // Park the ship in the first column and hold it there: every step, no other fire.
    const column = world.bolts.at(0);
    const before = world.ship.health;
    let hurtAt = -1;
    boss.fireIn = 999;
    for (let step = 1; step <= 200 && hurtAt < 0; step++) {
      world.ship.along = column.along;
      world.ship.velAlong = world.scrollPerStep;
      // Not still lit from an acid blast in the approach: the strike is the only thing that may hurt.
      world.ship.invulnFor = 0;
      world.enemyShots.clear();
      boss.fireIn = 999;
      frame.step();
      if (world.ship.health < before) hurtAt = step;
    }
    expect(hurtAt, 'the lightning never landed on a ship parked under it').toBeGreaterThan(0);
    expect(hurtAt / STEPS_PER_SECOND, `the strike landed ${(hurtAt / STEPS_PER_SECOND).toFixed(2)} s after its line was drawn`).toBeGreaterThanOrEqual(0.5);
    expect(hurtAt / STEPS_PER_SECOND, 'the warning outlasts the patience anyone has for one').toBeLessThan(2);
  });

  it('and a ship elsewhere on the lane is not touched by it, however close across', () => {
    const { world, frame } = serpentAt(0.3);
    const boss = world.bossPool.at(0);
    armRain(boss);
    boss.fireIn = 1;
    world.ship.health = world.shipRow.health;
    frame.step();
    expect(world.bolts.at(0).kind).toBe(RAIN_BOLT_KIND);
    // Somewhere in the ship's box that is clear of EVERY column by a column's width and a hull —
    // a volley is three, and a spot beside the first is under the second often enough.
    const clear = (offset: number): boolean => {
      for (let i = 0; i < world.bolts.size; i++) {
        const b = world.bolts.at(i);
        if (Math.abs(world.cameraAlong + offset - b.along) <= b.radius + world.ship.radius + 3) return false;
      }
      return true;
    };
    let offset = -1;
    for (let o = PLAYER_ALONG_MARGIN; o <= PLAYER_LEAD && offset < 0; o += 1) if (clear(o)) offset = o;
    expect(offset, 'the volley left nowhere in the box clear of a column, which is a wall and not a rain').toBeGreaterThan(0);
    const before = world.ship.health;
    let struck = false;
    for (let step = 1; step <= 200; step++) {
      // Held at that spot in the camera's frame — the columns ride the camera too.
      world.ship.along = world.cameraAlong + offset;
      world.ship.velAlong = world.scrollPerStep;
      world.ship.across = ACROSS_SPAN / 2;
      world.ship.invulnFor = 0;
      world.enemyShots.clear();
      boss.fireIn = 999;
      frame.step();
      // Watched every step: a ship of one health that is struck dies and is put back whole by the
      // end of the beat, so the health at the end of the loop says nothing.
      if (world.ship.health < before || world.dyingIn > 0) struck = true;
    }
    expect(struck, 'a ship beside the column was struck').toBe(false);
  });

  it('THE PICTURE: the warning is drawn dim and the strike bright, both in the enemy’s hand', () => {
    /*
      0036: the model resolves a strike, and the picture must mention both halves of it — the line,
      then the bolt. The surface is asked whose ink it stroked in and how loud.
    */
    const { world, frame } = serpentAt(0.3);
    const recorder = new Recorder();
    world.surface = recorder;
    armRain(world.bossPool.at(0));
    world.bossPool.at(0).fireIn = 1;
    frame.step();
    frame.draw(0);
    const warnings = recorder.strokes.filter((s) => s.hostile);
    expect(warnings.length, 'no hostile line was drawn on the step the volley was thrown').toBeGreaterThan(0);
    const dim = Math.max(...warnings.map((s) => s.alpha));
    expect(dim, 'the warning line is drawn as loud as a strike').toBeLessThan(0.7);
    // Let the warning run out, then look again.
    for (let i = 0; i < 60 && !world.bolts.size; i++) frame.step();
    const column = world.bolts.at(0);
    while (column.lifeFor > BOLT_STEPS) {
      world.bossPool.at(0).fireIn = 999;
      frame.step();
    }
    recorder.strokes.length = 0;
    frame.draw(0);
    const strikes = recorder.strokes.filter((s) => s.hostile);
    expect(strikes.length, 'the strike was not drawn').toBeGreaterThan(warnings.length);
    expect(Math.max(...strikes.map((s) => s.alpha)), 'the strike is no brighter than its warning').toBeGreaterThan(dim);
    expect(recorder.strokes.some((s) => !s.hostile), 'the serpent’s lightning was drawn in the player’s hand').toBe(false);
  });
});

/**
 * Where the animal's body is held — `docs/decisions/0283-the-serpent-is-a-chain.md`.
 *
 * ⚠️ **EVERY ASSERTION HERE IS DRIVEN AND IN WORLD UNITS**, which is the whole reason they moved out
 * of `tests/accents.test.ts`. That file measures a baked bitmap, and until 0283 the serpent WAS one —
 * so *no bend tighter than the animal's own spine allows* was checked against a path in a drawing
 * rather than against the creature on the screen. The body is laid out every step now, so the shape
 * the player watches is a thing a fixture can ask about.
 */
describe('0283 — the serpent is a chain', () => {
  /** The laid-out spine this step: every node's place, head-end first, in world units. */
  function spine(world: ReturnType<typeof playableWorld>['world']): { along: number; across: number; girth: number }[] {
    const out: { along: number; across: number; girth: number }[] = [];
    const head = world.bossPool.at(0);
    out.push({ along: head.along, across: head.across, girth: head.radius * 2 });
    // The pool is spawned tail-first so the neck draws over the tail, so read it backwards.
    for (let i = world.bossBody.size - 1; i >= 0; i--) {
      const node = world.bossBody.at(i);
      out.push({ along: node.along, across: node.across, girth: node.radius * 2 });
    }
    return out;
  }

  it('THE REPORTED ONE: the body moves, and it moves differently from the head', () => {
    /*
      ⚠️ **REPORTED TWICE, THREE PRs APART**: *"it needs to actually move/undulate, it's a static
      image that bounces up and down"*, and *"there's no movement to the sprite itself, it's a flat
      static image that isn't alive."*

      ⚠️ **THE SECOND HALF IS THE ASSERTION.** A body that only slid about with the head would satisfy
      *the body moves* and would be exactly what was reported: a rigid picture being carried around.
      What is measured is the SHAPE — each node's offset across the lane from the head — and that the
      shape itself changes. A baked bitmap cannot pass this at any amount of art.
    */
    const { world, frame } = serpentAt(1);
    const shapes: number[][] = [];
    for (let i = 0; i < 240; i++) {
      world.bossPool.at(0).fireIn = 999;
      frame.step();
      if (i % 20 === 0 && world.bossBody.size > 0) {
        const s = spine(world);
        shapes.push(s.map((n) => n.across - s[0]!.across));
      }
    }
    expect(shapes.length, 'the serpent never laid a body').toBeGreaterThan(6);
    let widest = 0;
    for (const shape of shapes) {
      for (let k = 0; k < shape.length; k++) {
        for (const other of shapes) widest = Math.max(widest, Math.abs(shape[k]! - other[k]!));
      }
    }
    expect(
      widest,
      `the body held the same shape relative to its head for four seconds — the widest any node moved ` +
        `against the head was ${widest.toFixed(2)} units, which is a picture being carried rather than an animal`,
    ).toBeGreaterThan(4);
  });

  it('and no bend is tighter than the animal’s own spine allows, on the body that is actually on the screen', () => {
    /*
      ── NO BEND TIGHTER THAN THE ANIMAL'S OWN SPINE ALLOWS — 0277, MEASURED ON THE CHAIN — 0283 ──

      ⚠️ **A WORM HAS NO SPINE AND CAN KINK; A VERTEBRATE CANNOT.** Reported of the serpent: *"the
      tail uplift is really really sharp and a snake/serpent would be more curved because of the
      spine, where a worm with no spine can sharp twist."*

      ⚠️ **AND THAT WAS A NOTE ABOUT THE BODY'S SHAPE RATHER THAN ABOUT ITS DESIGN**, said again when
      this was picked back up: *"previous instructions about sharp angles were only related to body
      shape not aesthetic design."* So it holds here, on the anatomy, and it says nothing whatever
      about how sharp the creature is allowed to LOOK.

      ⚠️ **A RATIO AND NOT AN ABSOLUTE, BECAUSE FLEXIBILITY SCALES WITH THICKNESS.** A whip-thin tail
      has more vertebrae per unit length than a thick midriff and really does bend tighter. An
      absolute floor would either forbid a tail tip from curling at all or wave a hairpin through the
      midriff — the two failures this sits between.

      ⚠️ **DRIVEN OVER A WHOLE WAVE, because the shape is different every step now.** A body checked
      at one moment is a body checked in one pose, and the tightest bend an undulating animal ever
      reaches is the thing the rule is about.
    */
    const { world, frame } = serpentAt(1);
    let tightest = Infinity;
    let at = -1;
    for (let i = 0; i < 300; i++) {
      world.bossPool.at(0).fireIn = 999;
      frame.step();
      if (world.bossBody.size === 0) continue;
      const s = spine(world);
      for (let k = 1; k < s.length - 1; k++) {
        const a = s[k - 1]!;
        const b = s[k]!;
        const c = s[k + 1]!;
        let turn = Math.atan2(c.across - b.across, c.along - b.along) - Math.atan2(b.across - a.across, b.along - a.along);
        while (turn > Math.PI) turn -= Math.PI * 2;
        while (turn < -Math.PI) turn += Math.PI * 2;
        if (turn === 0) continue;
        const arc = (Math.hypot(b.along - a.along, b.across - a.across) + Math.hypot(c.along - b.along, c.across - b.across)) / 2;
        const overGirth = arc / Math.abs(turn) / b.girth;
        if (overGirth < tightest) {
          tightest = overGirth;
          at = k;
        }
      }
    }
    expect(
      tightest,
      `the serpent kinks at node ${at}: its bend radius there is ${tightest.toFixed(2)} of its own girth, and a ` +
        'body that turns inside its own width has no spine in it',
    ).toBeGreaterThan(1.5);
  });

  it('and the body is one animal: a hit anywhere on it is a hit on the serpent', () => {
    /*
      ⚠️ **THE HURT SHAPE IS THE ANATOMY NOW**, which is the request 0277 could not answer: *"we need
      to update the boss collision to no longer be a disc if we can."* A node is as wide as the animal
      is where it stands, and what lands on it is spent on the head — so the tail is worth what the
      neck is, and neither is worth anything the drawing does not cover.
    */
    const { world, frame } = serpentAt(1);
    for (let i = 0; i < 60 && world.bossBody.size === 0; i++) frame.step();
    expect(world.bossBody.size, 'the serpent laid no body at all').toBe(BOSSES.jormungandr.chain?.girth.length);
    const before = world.bossPool.at(0).health;
    // The tail: the node furthest up-lane of the skull, which is the one a disc round the head misses.
    const s = spine(world);
    const tail = s[s.length - 1]!;
    const shot = world.playerShots.spawn()!;
    reset(shot, tail.along, tail.across, SHOTS.pulse);
    world.bossPool.at(0).fireIn = 999;
    frame.step();
    expect(
      world.bossPool.at(0).health,
      'a shot on the serpent’s tail took nothing off the serpent — the body is decoration rather than the animal',
    ).toBeLessThan(before);
  });
});
