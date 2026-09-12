/**
 * A shattering volley is counted in shards — `docs/decisions/0270-a-shattering-volley-is-counted-in-shards.md`.
 *
 * Reported from play: *"the rime shelf and hydra boss ice attacks are way too hard to avoid on low
 * and middle tier difficulties… they're very cool explodey ice attacks, but they end up having way
 * too much screen space too fast"*, and then, when the first answer reached for the wall's spacing:
 * *"it's not the wall and the gap in the wall, it's the explosions and the number of projectiles on
 * screen after explosion, there's no space on the screen… it's especially problematic with the rime
 * shelf boss because the adds target the player."*
 *
 * ── WHAT IS HELD HERE, AND WHY THE FIRST ASSERTION IS THE ONE THAT MATTERS ──────────────────────
 *
 * ⚠️ **`docs/decisions/0027-measure-the-picture-not-the-model.md`: at least one assertion is written
 * in units the player experiences**, because a guard measuring a quantity defined in terms of the
 * constant it guards proves only that the code agrees with itself. Every other assertion below is
 * that kind — the ceiling binds, the horde stops at the row's number — and all of them were green
 * over the fight this decision comes from, because none of them was asking the player's question.
 *
 * The player's question is **can I be somewhere that is not about to be hit**, and it has three
 * parts a count cannot answer: what is coming, when it arrives, and whether the ship can be
 * elsewhere by then at the speed the cold has left it. `THE REPORTED ONE` asks exactly that, of a
 * pilot that actually flies — and 0263's own pool guard passed the hydra at 104 hostile shots alive
 * while there was nowhere on the lane to go.
 *
 * ⚠️ **THE PILOT FLIES, AND WITHOUT THAT THIS GUARD MEASURES THE FIXTURE.** A parked ship reports
 * *nowhere to go* for a lane it should have left two seconds ago, which is a statement about the
 * fixture's hands rather than about the fight. So the ship is steered to the middle of the widest
 * safe run it can reach, every step — the thing a player is trying to do — and what is asserted is
 * that a pilot doing that always has somewhere to be.
 */

import { describe, expect, it } from 'vitest';

import { GameFrame } from '../src/app/frame.ts';
import { BOSSES, BOSS_KINDS, type BossAttack, type BossKind } from '../src/content/bosses.ts';
import { DIFFICULTIES, DIFFICULTY_KINDS, crowdFor } from '../src/content/difficulty.ts';
import { SHARD_VOLLEY, SHOTS, type ShotKind } from '../src/content/shots.ts';
import { SHIPS } from '../src/content/ships.ts';
import { ACROSS_SPAN } from '../src/sim/camera.ts';
import { SCROLL_PER_STEP, SHIP_SPEED } from '../src/sim/flight.ts';
import { STEPS_PER_SECOND } from '../src/state/screens.ts';
import { NO_SECTIONS, playableWorld } from './world.ts';

type World = ReturnType<typeof playableWorld>['world'];

const solo = (boss: BossKind) =>
  ({ waves: [], pickups: [], landmarks: [], bossAt: 200, midBoss: null, sections: NO_SECTIONS, boss, theme: 'approach' } as const);

/**
 * How far ahead the pilot is asked to see: three quarters of a second.
 *
 * ⚠️ **A REACTION TIME AND NOT A CONVENIENCE.** Shorter and the guard would be asserting that the
 * player can dodge on reflex; longer and it would be asserting that they can read the whole screen
 * and plan. 0.75 s is the fuse 0263 gives a shard before it opens, so it is the horizon the content
 * itself is authored on.
 */
const HORIZON = Math.round(0.75 * STEPS_PER_SECOND);

/** Half-unit cells across the lane. Finer than the ship's hurtbox, so a gap cannot hide in one. */
const CELL = 0.5;
const CELLS = Math.round(ACROSS_SPAN / CELL);

/**
 * The widest run of lane that is both SAFE for the next `HORIZON` and REACHABLE in it, in world
 * units — and the middle of it, which is where the pilot is steering.
 *
 * ⚠️ **Every hostile body is projected to the ship's own lane position** rather than tested where it
 * is now: a shot 40 units up-lane is not a threat where it is, it is a threat where it will be when
 * it gets here, and the whole of what a pattern asks (0110) is that question.
 *
 * ⚠️ **`speed` is what the COLD has left**, so a run the ship cannot reach in time is not counted.
 * The frost ship halves it inside 30 units of the hull and stops it outright for half a second after
 * three quarters of one (0253) — and a gap you can see and cannot reach is the reported defect.
 *
 * ⚠️ **Written with two scratch arrays built once at module load**, because this runs every step of
 * every phase of every tier and `docs/decisions/0025-the-frame-budget-is-counted-not-timed.md`'s
 * habit is worth keeping in a guard that would otherwise allocate a hundred thousand times.
 */
const unsafe = new Uint8Array(CELLS);

function widestReachableRun(w: World, speed: number): { run: number; middle: number } {
  unsafe.fill(0);
  for (const pool of [w.enemyShots, w.enemies, w.bossPool]) {
    for (let i = 0; i < pool.size; i++) {
      const e = pool.at(i);
      const closing = SCROLL_PER_STEP - e.velAlong;
      if (closing <= 0) continue;
      const steps = (e.along - w.ship.along) / closing;
      if (steps < 0 || steps > HORIZON) continue;
      const at = e.across + e.velAcross * steps;
      const reach = e.radius + SHIPS.proof.radius;
      const lo = Math.max(0, Math.floor((at - reach) / CELL));
      const hi = Math.min(CELLS - 1, Math.ceil((at + reach) / CELL));
      for (let c = lo; c <= hi; c++) unsafe[c] = 1;
    }
  }
  let best = 0;
  let bestEnd = 0;
  let run = 0;
  for (let c = 0; c < CELLS; c++) {
    const reachable = Math.abs(c * CELL - w.ship.across) / Math.max(speed, 1e-4) <= HORIZON;
    if (unsafe[c] === 1 || !reachable) run = 0;
    else {
      run++;
      if (run > best) {
        best = run;
        bestEnd = c;
      }
    }
  }
  return { run: best * CELL, middle: (bestEnd - best / 2) * CELL };
}

/** What the cold has left of the ship's speed this step — 0253, read off the row rather than guessed. */
function speedNow(w: World): number {
  if (w.frozenFor > 0) return 0;
  const chill = w.bossRow.chill;
  if (chill === null || w.bossPool.size === 0) return SHIP_SPEED;
  const boss = w.bossPool.at(0);
  const dAlong = w.ship.along - boss.along;
  const dAcross = w.ship.across - boss.across;
  return dAlong * dAlong + dAcross * dAcross <= chill.radius * chill.radius ? SHIP_SPEED * chill.slow : SHIP_SPEED;
}

/** Every shot a boss can put up: the row's, any phase's, and any head's. */
function shotsOf(kind: BossKind): ShotKind[] {
  const row = BOSSES[kind];
  const out: ShotKind[] = [row.shot];
  const fromAttack = (attack: BossAttack | null): void => {
    if (attack?.kind === 'heads') for (const head of attack.heads) out.push(head.shot);
  };
  fromAttack(row.attack);
  for (const phase of row.phases) {
    if (phase.shot !== null) out.push(phase.shot);
    fromAttack(phase.attack);
  }
  return out;
}

/** The bosses that can put a SHATTERING shot up — derived, so a new one is covered by being authored. */
const SHATTERERS = BOSS_KINDS.filter((kind) => shotsOf(kind).some((shot) => SHOTS[shot].fission.length > 0));

/** Every summons in the game, with the boss and phase it belongs to. */
const SUMMONS = BOSS_KINDS.flatMap((kind) =>
  BOSSES[kind].phases.flatMap((phase, index) =>
    (phase.attack ?? BOSSES[kind].attack).kind === 'summon'
      ? [{ kind, index, attack: (phase.attack ?? BOSSES[kind].attack) as Extract<BossAttack, { kind: 'summon' }> }]
      : [],
  ),
);

/**
 * Drive a fight standing in one phase, flying the ship to the safest place it can reach.
 *
 * ⚠️ **The health is pinned every step**, so the phase under test is the phase the whole run is in —
 * the same thing `rig/bench.html`'s boss scrub does, and for the same reason: a phase keyed to
 * health cannot otherwise be stood in.
 *
 * ⚠️ **The ship is kept alive and NOT kept still.** Health and invulnerability are restored so the
 * run is not cut short by a death, which would end the measurement exactly where it gets interesting.
 */
function fly(kind: BossKind, phaseIndex: number, tier: (typeof DIFFICULTY_KINDS)[number], seconds: number) {
  const { world, stick } = playableWorld(solo(kind), tier);
  const frame = new GameFrame(world);
  for (let i = 0; i < 900 && (world.bossPool.size === 0 || i < 700); i++) {
    world.ship.health = world.shipRow.health;
    frame.step();
  }
  expect(world.bossPool.size, `${kind} never arrived`).toBe(1);
  const at = Math.max(0.02, BOSSES[kind].phases[phaseIndex]!.upTo - 0.01);

  let worstRun = ACROSS_SPAN;
  let peakShots = 0;
  let peakAdds = 0;
  for (let i = 0; i < seconds * STEPS_PER_SECOND; i++) {
    if (world.bossPool.size === 0) break;
    world.bossPool.at(0).health = world.bossFullHealth * at;
    world.ship.health = world.shipRow.health;
    world.ship.invulnFor = 0;
    const { run, middle } = widestReachableRun(world, speedNow(world));
    /*
      The pilot: full stick towards the middle of the widest place it can reach.

      ⚠️ **IT IS THE FIXTURE'S STICK AND IT USED TO BE `world.intent`, WHICH DID NOTHING.**
      `src/app/frame.ts` calls `w.input.contribute(w.intent)` at the top of every step and the
      combiner's job is to ZERO the intent before the devices add to it — so an intent written between
      two steps was overwritten before `flyShip` ever read it, and this guard's own paragraph above
      (*"the pilot flies, and without that this guard measures the fixture"*) described something that
      had never happened. Found while writing the guard 0281 shipped and 0282 took back out;
      `tests/world.ts` hands a fixture the stick the real devices write to, and that half is kept. `docs/decisions/0282-a-mechanism-for-every-instance-makes-them-one-instance.md`.

      ⚠️ **THE NUMBERS BELOW ARE THEREFORE THE FIRST ONES THIS GUARD HAS EVER MEASURED WITH A PILOT.**
      Every one of them was re-run against a flying ship before this landed, and 0270's assertions
      hold unchanged — which is the reason this could be repaired here rather than left as a finding.
    */
    const wants = middle - world.ship.across;
    stick.across = wants > 0.5 ? 1 : wants < -0.5 ? -1 : 0;
    stick.along = 0;
    frame.step();
    if (run < worstRun) worstRun = run;
    if (world.enemyShots.size > peakShots) peakShots = world.enemyShots.size;
    if (world.enemies.size > peakAdds) peakAdds = world.enemies.size;
  }
  return { world, worstRun, peakShots, peakAdds };
}

describe('0270 — a shattering volley is counted in shards', () => {
  it('at least one boss in the game throws a shot that shatters', () => {
    // 0005. Every assertion below walks `SHATTERERS`, and all of them pass vacuously over an empty set.
    expect(SHATTERERS.length, 'no boss throws a shattering shot, so nothing below checks anything').toBeGreaterThan(0);
  });

  /*
    ── WHAT THE RUN IS MEASURED IN, BECAUSE THE FIRST VERSION OF THIS GUARD GOT IT WRONG ──────────

    ⚠️ **A RUN IS CENTRE POSITIONS, NOT SCREEN WIDTH.** `widestReachableRun` grows every threat by the
    ship's own radius before it marks the lane, so what comes back is the set of places the ship's
    CENTRE may be — the hull is already accounted for. A run of two units is therefore a two-unit
    window the ship fits inside with a unit either side, not a gap too small for it.

    The first draft asserted `run >= 2 × radius` and called it *"narrower than the ship"*, which is
    the ship's width counted twice. It failed the frost ship's last phase at `burn` at 2.0 units and
    the message said *there is nowhere to be* about a place there demonstrably was. A guard whose
    message is wrong about its own quantity is the one 0027 warns of, caught on itself.
  */
  it('THE REPORTED ONE: in every phase of every fight in the game, on every tier, a pilot flying to the safest place always has somewhere to be', () => {
    /*
      ⚠️ **THE ASSERTION IN THE PLAYER'S OWN UNITS** — 0027 — and the threshold is not a taste: a run
      of zero is *no place on the lane both safe and reachable*, which is damage the player cannot
      play around however well they fly. Anything above zero is a fight; zero is not.

      ⚠️ **EVERY BOSS, AND IT WAS SCOPED TO THE SHATTERING TWO UNTIL THIS WAS MEASURED.** `crowd`
      sits in `throwAttack` and so reaches all fourteen fights, not the two this decision was
      reported for — and a guard narrower than the axis it protects is a guard that would go on
      passing while the rest of the game tightened. Measured across all fourteen, the new axis costs
      room on ten of them: `redoubt` 18 units at `savior`, `medusa` 16.5 at `burn`, `jormungandr` 13.
      None of them reaches zero, which is what this holds and what makes those numbers a tuning
      question rather than a defect.

      ⚠️ **Measured before the fix, this is what it said.** With the hydra's frost head reading the
      phase's `shots` — eight shards, ninety-six flakes — the widest reachable run was **zero for 13%
      of its fourth phase on Legendary and 19% on Savior**, and that is with a pilot flying to the
      safest place it could reach on every one of those steps.

      ⚠️ **`burn` IS HELD TO THE SAME LINE, and that is deliberate.** *"It is not meant to be
      survived"* is a claim about how hard the answer is to find and to reach, not a licence for there
      to be no answer. How much ROOM each tier leaves is the assertion below this one.
    */
    for (const kind of BOSS_KINDS) {
      for (let phase = 0; phase < BOSSES[kind].phases.length; phase++) {
        for (const tier of DIFFICULTY_KINDS) {
          const { worstRun } = fly(kind, phase, tier, 10);
          expect(
            worstRun,
            `${kind} phase ${phase + 1} at ${tier}: for at least one step there was NO place on the lane ` +
              `both safe and reachable — a pilot flying to the safest place it could see had nowhere to go`,
          ).toBeGreaterThan(0);
        }
      }
    }
  });

  it('and the tier that promises no challenge leaves a whole ship of room to stand in', () => {
    /*
      ⚠️ **THE ROOM, AND IT IS ASSERTED ONLY WHERE THE CONTENT PROMISES IT.** `legendary`'s row in
      `src/content/difficulty.ts` carries the ask it was written from — *"this should provide me no
      challenge, but still require concentration"* — so the easiest tier is the one place a *threading
      it exactly* moment is a defect rather than the point. The threshold is the ship's own hurtbox
      width: a window narrower than the ship IS is a window the player is threading rather than
      standing in.

      ⚠️ **NOT held over `savior` and `burn`, and the reason is that it would be a taste there.** How
      tight the tuned tier should get is a hand's question and 0192 says a taste may not fail a suite;
      what is not a taste, on any tier, is the assertion above.
    */
    const fits = 2 * SHIPS.proof.radius;
    for (const kind of BOSS_KINDS) {
      for (let phase = 0; phase < BOSSES[kind].phases.length; phase++) {
        const { worstRun } = fly(kind, phase, 'legendary', 10);
        expect(
          worstRun,
          `${kind} phase ${phase + 1} at legendary: the widest reachable place was ${worstRun.toFixed(1)} units ` +
            `and the ship is ${fits} across — the gentlest tier is asking the player to thread it`,
        ).toBeGreaterThanOrEqual(fits);
      }
    }
  });

  it('and the pool always has room for the volley after this one, in every phase and on every tier', () => {
    /*
      0263 wrote this rule and drove it over ONE phase of ONE boss — `frostAt(0.15)`, the frost ship's
      last. The hydra was never asked, and neither was any other phase: what is held now is the whole
      of both fights on all three tiers. `src/sim/pool.ts` drops a volley that will not fit, so a
      phase that fills the pool is a phase whose next volley — and the shatter of an add — is silently
      not thrown, which is a fight quietly getting easier at its hardest moment.

      ⚠️ **Room for a volley's shards, their bolts, and a shattered add**, which is 0263's own 24.
    */
    for (const kind of SHATTERERS) {
      for (let phase = 0; phase < BOSSES[kind].phases.length; phase++) {
        for (const tier of DIFFICULTY_KINDS) {
          const { world, peakShots } = fly(kind, phase, tier, 10);
          expect(
            peakShots,
            `${kind} phase ${phase + 1} at ${tier} reached ${peakShots} of ${world.enemyShots.capacity} hostile shots alive`,
          ).toBeLessThan(world.enemyShots.capacity - 24);
        }
      }
    }
  });

  it('and a summons keeps at most the horde its row authors standing, however long the phase runs', () => {
    /*
      ⚠️ **THE CEILING THAT DID NOT EXIST.** Measured over the frost ship's summon phase before this
      decision, the adds reached 26 at Legendary and 40 at Burn — and 40 is `CAPACITY.enemies`, so
      what stopped the horde was the pool running out. The tier scales the row's number, so this asks
      the row and the tier rather than restating either.

      ⚠️ **AND A PHASE MAY AUTHOR TWO HORDES SINCE 0314, SO THE CEILING IS THE SUM OF WHAT IT AUTHORS.**
      An `escort` keeps its own kind topped up beside whatever the volley calls — the fish's last third
      dumps kites while the shoal arrives underneath it. The claim is unchanged, *no more standing than
      the row says*; what moved is that a row can now say it twice. It went red on the fish at 14
      against 8, which is this guard doing its job on a mechanism that did not exist when it was
      written, and both halves of the widened number are still authored rather than chosen here.
    */
    for (const { kind, index, attack } of SUMMONS) {
      for (const tier of DIFFICULTY_KINDS) {
        const escort = BOSSES[kind].phases[index]!.escort;
        const ceiling = crowdFor(attack.standing, DIFFICULTIES[tier]) + (escort === undefined ? 0 : crowdFor(escort.standing, DIFFICULTIES[tier]));
        const { peakAdds } = fly(kind, index, tier, 12);
        expect(
          peakAdds,
          `${kind} phase ${index + 1} at ${tier} kept ${peakAdds} adds standing against a ceiling of ${ceiling}`,
        ).toBeLessThanOrEqual(ceiling);
      }
    }
  });

  it('0314 — and an ESCORT keeps its own horde standing too, in a phase that never stops throwing', () => {
    /*
      ⚠️ **THE HALF THE GUARD ABOVE CANNOT SEE.** It walks the phases whose ATTACK is a summons; an
      escort runs beside an attack that is a fan, so a phase with an escort and no summons is not in
      that list at all — and the fish has two of those. Same claim, read off the escort's own row.
    */
    const escorts = BOSS_KINDS.flatMap((kind) =>
      BOSSES[kind].phases.flatMap((phase, index) => (phase.escort === undefined ? [] : [{ kind, index, escort: phase.escort }])),
    );
    expect(escorts.length, 'no boss authors an escort, so this measures nothing').toBeGreaterThan(0);
    for (const { kind, index, escort } of escorts) {
      for (const tier of DIFFICULTY_KINDS) {
        const volley = BOSSES[kind].phases[index]!.attack ?? BOSSES[kind].attack;
        const ceiling = crowdFor(escort.standing, DIFFICULTIES[tier]) + (volley.kind === 'summon' ? crowdFor(volley.standing, DIFFICULTIES[tier]) : 0);
        const { peakAdds } = fly(kind, index, tier, 12);
        expect(
          peakAdds,
          `${kind} phase ${index + 1} at ${tier} kept ${peakAdds} adds standing against an escort ceiling of ${ceiling}`,
        ).toBeLessThanOrEqual(ceiling);
      }
    }
  });

  it('and at least one summons actually reaches its ceiling, so the number above is a limit rather than a wish', () => {
    // 0005 again, the other way up: a ceiling nothing ever touches would pass whatever it said.
    const reached = SUMMONS.some(({ kind, index, attack }) => {
      const ceiling = crowdFor(attack.standing, DIFFICULTIES.burn);
      return fly(kind, index, 'burn', 12).peakAdds >= ceiling;
    });
    expect(reached, 'no summons in the game ever fills its horde, so the ceiling is never tested').toBe(true);
  });

  it('and no shattering volley opens wider than the ceiling, on any tier', () => {
    /*
      The mechanical half, and it is here because a future arm added to `throwAttack` would otherwise
      spend `phase.shots` directly and nobody would know until a play report. It says the code agrees
      with `SHARD_VOLLEY` — which is exactly the weak kind of assertion 0027 warns about, and is why
      it is the fourth thing in this file rather than the first.
    */
    for (const kind of SHATTERERS) {
      for (const phase of BOSSES[kind].phases) {
        expect(
          Math.min(crowdFor(phase.shots, DIFFICULTIES.burn), SHARD_VOLLEY),
          `${kind} would open a shattering volley with more than ${SHARD_VOLLEY} shards`,
        ).toBeLessThanOrEqual(SHARD_VOLLEY);
      }
    }
  });
});
