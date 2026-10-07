import { describe, expect, it } from 'vitest';

import { GameFrame, wearHull } from '../src/app/frame.ts';
import { INK_OF } from '../src/render/bake.ts';
import {
  MAX_LAUNCHERS,
  weaponFor,
} from '../src/content/pickups.ts';
import { MISSILE_KINDS, type MissileKind } from '../src/content/missiles.ts';
import { SHIPS, SHIP_KINDS, hullFor } from '../src/content/ships.ts';
import { SHOTS, SHOT_KINDS, type ShotKind } from '../src/content/shots.ts';
import { ENEMIES, ENEMY_KINDS } from '../src/content/enemies.ts';
import { ROWS_OF } from '../src/content/arms.ts';
import { THEME_KINDS } from '../src/content/themes.ts';
import { BOSSES, BOSS_KINDS } from '../src/content/bosses.ts';
import { SPRITE_EXTENT, SPRITE_KINDS } from '../src/content/sprites.ts';
import { viewOf } from '../src/sim/camera.ts';
import type { Surface } from '../src/render/surface.ts';
import { NO_LEVEL, playableWorld } from './world.ts';

/**
 * WHAT THE PLAYER MUST TELL APART IS TOLD APART BY MORE THAN INK.
 *
 * `docs/decisions/0081-what-the-player-must-tell-apart-is-told-apart-by-more-than-ink.md`. Reported
 * from play: *"currently we've gone too hard on the visual accessibility requirement and it's now
 * very hard for sighted users to differentiate between power ups, player/enemy fire, different types
 * of enemies. When they're all the same colour and essentially the same size, they're all the same."*
 *
 * ⚠️ **The confirmed defect is `player/enemy fire`, and it was literal**: `SHOTS.spit` named
 * `SPRITE.bullet`, so a threat and the player's own shot were the SAME BITMAP — one disc, one ink,
 * one size. No channel separated them at all.
 *
 * ⚠️ **This does not weaken [0024](../docs/decisions/0024-the-accessibility-floor-is-settings.md).**
 * Its rule is *colour never carries meaning alone*, and every assertion here is about adding
 * channels: what these hold is that two things a player must not confuse differ in **shape and
 * size**, with ink as the third rather than the only one.
 */

/** The view the report was made on, so a pixel here is a pixel the player was looking at. */
const DESKTOP = viewOf(1280, 720);

/** How big a kind is drawn on that screen, in CSS pixels across. */
const drawnPx = (sprite: number): number => SPRITE_EXTENT[SPRITE_KINDS[sprite]!] * DESKTOP.scale;

/** A surface that records what it was asked to draw. */
class Recorder implements Surface {
  readonly blits: { sprite: number; x: number; y: number }[] = [];
  clear(): void {
    this.blits.length = 0;
  }
  blit(sprite: number, x: number, y: number): void {
    this.blits.push({ sprite, x, y });
  }
  bolt(): void {}
}

describe('the shot that kills you is not the shot you kill with', () => {
  it('THE REPORTED ONE: they differ in shape, in size and in ink — and shared all three', () => {
    const pulse = SHOTS.pulse;
    const spit = SHOTS.spit;
    expect(spit.sprite, 'the player’s shot and what shoots back are one bitmap').not.toBe(pulse.sprite);
    expect(
      INK_OF[SPRITE_KINDS[spit.sprite]!],
      'the two are drawn in one ink, so colour separates nothing',
    ).not.toBe(INK_OF[SPRITE_KINDS[pulse.sprite]!]);
    /*
      ⚠️ **In PIXELS of the screen the report was made on**, per
      `docs/decisions/0027-measure-the-picture-not-the-model.md`. *Essentially the same size* is a
      claim about the glass, and world units cannot answer it. Five pixels is about a third of a
      pulse — the smallest difference that survives a screen full of them.
    */
    const gap = drawnPx(spit.sprite) - drawnPx(pulse.sprite);
    expect(
      gap,
      `what shoots back is drawn ${gap.toFixed(1)}px wider than what the player fires, on a 1280×720 screen`,
    ).toBeGreaterThan(5);
  });

  it('and the bigger of the two is the one the player must not touch', () => {
    // Size is the cue that needs no learning at all. If either of these is to be the larger, it is
    // the one that ends a life — the same argument `src/content/sprites.ts` makes for enemy hulls.
    expect(drawnPx(SHOTS.spit.sprite)).toBeGreaterThan(drawnPx(SHOTS.pulse.sprite));
  });

  it('no two shots in the game share a silhouette at all', () => {
    /*
      ⚠️ **The general form, and it is what would have caught the defect on the day it was written.**
      Every kind naming its own sprite is a structural property; *these two happen to differ* is a
      fact about today's table. `src/content/pickups.ts` already holds the same rule for pickups, and
      it is that guard's absence over `SHOTS` that let a threat wear the player's bitmap for months.
    */
    const sprites = new Set(SHOT_KINDS.map((k) => SHOTS[k].sprite));
    expect(
      sprites.size,
      'two shot kinds share a silhouette and can only be told apart by their ink and their speed',
    ).toBe(SHOT_KINDS.length);
  });

  it('0098 — THE REPORTED ONE: what shoots back is not all one bullet', () => {
    /*
      ⚠️ **Reported from play** — *"all the enemy bullets are exactly the same"* —
      `docs/decisions/0098-a-wave-plays-a-figure.md`, and it was literally true: three shooting enemy
      kinds and all seven bosses named `spit`, so every threat in the game was one bitmap at one
      speed.

      ⚠️ **Held over what the CONTENT actually sends rather than over the table's length**, which is
      the difference between *three rows exist* and *three rows are used*. A fourth bullet added and
      never assigned would pass a count of `SHOT_KINDS`; it cannot pass this.

      ⚠️ **THE ENEMIES AND THE BOSSES ARE COUNTED SEPARATELY, AND A PROBE IS WHY.** Counted together
      this reported STILL GREEN for the break it exists to catch: the two live in different files, so
      putting every shooting ENEMY back on one row still leaves three kinds in circulation because
      the bosses are untouched — a guard that a one-file regression cannot reach is a guard over a
      total rather than over a rule. **Every shooting enemy kind sends a different bullet** is the
      rule, and there are exactly three of each so it is checkable as an equality.
    */
    /*
      ── AND THE EQUALITY STOPPED BEING SATISFIABLE, WHICH IS 0110 RATHER THAN A RELAXATION ─────────

      ⚠️ **It read `fromEnemies.size === shooters.length`** — every shooting kind sends a different
      bullet — which was exactly right while there were three shooters and three bullets, and is
      **arithmetically impossible** now that `docs/decisions/0110-an-attack-is-a-pattern.md` has added
      two more. A guard that cannot be satisfied is not a strict guard, it is a stopped one.

      ⚠️ **THE RULE UNDERNEATH IT IS *WHAT SHOOTS BACK IS TOLD APART*, AND IT IS RESTATED RATHER THAN
      WEAKENED.** Two claims, and each catches something the other cannot:

      1. **Every bullet that shoots at the player is one an ENEMY sends** — nothing in the threat
         vocabulary is introduced first by a boss, and a fourth row added and never sent still fails,
         which is what the equality was for.
      2. **No two shooting kinds share BOTH a bullet and an attack.** That is stronger than the
         equality ever was on the axis that matters — a threat now differs in what it looks like or
         in what it asks of the player, and putting every enemy back on one bullet breaks it the
         moment two of them also share a pattern.
    */
    /*
      ── AND A BOSS MAY NOW INTRODUCE A SHOT OF ITS OWN — 0248 ─────────────────────────────────────

      ⚠️ **Claim 1 held *nothing is introduced first by a boss*, and the brief overturned it by
      name**: the serpent's acid and void, the hydra's flame and frost, the pterodactyl's laser are
      a boss's own and nobody else's (`docs/decisions/0248-the-serpent-strikes.md`). What the claim
      was FOR — a row added and never sent — is kept as itself: every hostile bullet in `SHOTS` is
      sent by an enemy, or by a boss's row, or by one of its phases. The enemies still send at
      least three kinds, which is 0098's own floor.
    */
    const shooters = ENEMY_KINDS.filter((k) => ENEMIES[k].fireEvery > 0);
    // Every place's raiders, since 0473 armed each place's own — a bullet only a place sends is sent.
    const fromEnemies = new Set(THEME_KINDS.flatMap((theme) => ROWS_OF[theme].filter((row) => row.fireEvery > 0).map((row) => row.shot)));
    // A boss's fall sends its rock — 0251: a fall is a volley from the sky, and the rock is nobody else's.
    // And a head sends its own shot — 0254: the hydra's phases name five through their heads.
    const fromBosses = new Set(
      BOSS_KINDS.flatMap((k) => [
        BOSSES[k].shot,
        ...BOSSES[k].phases.map((p) => p.shot ?? BOSSES[k].shot),
        ...BOSSES[k].phases.flatMap((p) => (p.attack?.kind === 'heads' ? p.attack.heads.map((h) => h.shot) : [])),
        ...(BOSSES[k].fall?.kind === 'shot' ? [BOSSES[k].fall.shot] : []),
      ]),
    );
    expect(fromBosses.size, `all ${BOSS_KINDS.length} bosses send ${fromBosses.size} kind(s) of bullet`).toBeGreaterThan(
      2,
    );
    expect(fromEnemies.size, 'the enemies send fewer than three kinds of bullet').toBeGreaterThanOrEqual(3);
    /*
      ⚠️ **AND A BULLET THAT ANOTHER BULLET BURSTS INTO IS SENT — 0311.** *"An outward circular blast of
      acid and void droplets"*: a head throws the ball and the ball throws the droplets, so nothing in the
      enemy or boss tables names them and this guard read them as dead weight. `fission`'s children never
      showed the hole because they are the same kind as their parent; a `swallow` bursts into kinds of its
      OWN naming. A row that names a bullet sends it, however many objects away it is.
    */
    const fromBursts = new Set<string>(SHOT_KINDS.flatMap((k) => [...(SHOTS[k].swallow?.into ?? [])]));
    const sent = new Set<string>([...fromEnemies, ...fromBosses, ...fromBursts]);
    const hostile = SHOT_KINDS.filter((k) => ['enemy', 'acid', 'void', 'fire', 'frost'].includes(INK_OF[SPRITE_KINDS[SHOTS[k].sprite]!]));
    expect(
      hostile.filter((k) => !sent.has(k)),
      'a hostile bullet exists in the table and nothing — enemy, boss or phase — sends it',
    ).toEqual([]);
    // In every place, over that place's own rows — 0473.
    for (const theme of THEME_KINDS) {
      const rows = ROWS_OF[theme].filter((row) => row.fireEvery > 0);
      const signatures = new Set(rows.map((row) => `${row.shot}/${row.attack.kind}`));
      expect(
        signatures.size,
        `two enemy kinds send the same bullet in the same pattern at ${theme} (${[...signatures].join(', ')})`,
      ).toBe(rows.length);
    }
    expect(shooters.length, 'nothing shoots').toBeGreaterThan(0);

    /*
      ⚠️ **AND NO TWO OF THEM ARE THE SAME BITMAP.** A uniqueness rule limits no single design — it
      forbids two rows being literally one picture, which is the defect 0081 and 0098 were both
      written from. It is the one claim in this block that survived 0295.
    */
    const bullets = [...sent];
    const sprites = new Set(bullets.map((k) => SHOTS[k as ShotKind].sprite));
    expect(sprites.size, 'two of the bullets that shoot at the player share a silhouette').toBe(bullets.length);

    /*
      ── THREE MORE ASSERTIONS WERE HERE AND 0295 DELETED THEM ──────────────────────────────────────

      `docs/decisions/0295-a-ranking-guard-is-a-content-limiter.md`. They were, in order:

      1. **Every hostile bullet drawn more than five pixels from every other.** Reported from play as
         the rule that *"explains so much about what has been frustrating with the enemy fire
         mechanics"*, and the report was right about the mechanism as well as the feel. The ladder
         was packed at that minimum, so the eagle's quill could not be added without shoving the four
         rungs above it up 0.8 units each — the ring, the drop, the shard and the rock got bigger
         because a spacing rule said so, and that is how the bullets climbed into the hull range.
         Eight of the thirteen enemy hulls are drawn smaller than the biggest bullet in the game;
         `scripts/weigh-sizes.mjs` prints it.

      2. **The faster bullet is the smaller one**, over all nine. It made the worst case mandatory:
         the flame is the quickest thing fired at the player and was therefore the smallest thing on
         the screen, at 8.6 px — the *"incredibly small and hard to see"* half of the same report.

      3. **Every enemy-sent bullet shares one hurtbox.** Three bullets drawn at 1.9, 2.6 and 3.4 with
         one 0.9 radius is a picture that lies about its hitbox by nearly 2× across a set the player
         was being told to read by size.

      ⚠️ **AND NOTHING REPLACED THEM, WHICH IS THE DECISION RATHER THAN AN OVERSIGHT.** Two successor
      guards were drafted — *no bullet as large as the smallest hull*, and *a floor under the smallest
      bullet* — and both were refused for reasons the decision records: the first is the same rule in
      other words, and the second is a fight with the suite on the day a small hard-to-see bullet is
      the right answer. What holds this ground now is two considerations in `CLAUDE.md`, raised per
      case, and `scripts/weigh-sizes.mjs` to raise them against.
    */
  });

  it('and the ship’s own fire is never in the ink of the things trying to kill it', () => {
    // One rule for the player to learn — *this colour will hurt you* — rather than one per body.
    const threat = INK_OF[SPRITE_KINDS[SHOTS.spit.sprite]!];
    for (const kind of ['pulse', 'missile', 'bomb'] as const) {
      expect(INK_OF[SPRITE_KINDS[SHOTS[kind].sprite]!], `the player’s ${kind} is drawn as a threat`).not.toBe(threat);
    }
    // The blast is the exception and it is the honest one: it hurts the player too (0053).
    expect(INK_OF.blast, 'the blast stopped being drawn as the hazard it is').toBe('hazard');
  });
});

/**
 * A HURT BODY IS DRAWN DIFFERENTLY FROM AN UNHURT ONE — EVERY BODY, NOT MOST OF THEM.
 *
 * ⚠️ **Reported from play, 2026-08-10: *"bosses 3+ don't show any hit interaction at all."*** It was
 * literal and it was five of the seven. `src/render/bake.ts`'s `INK_OF` carried `boss3Hit` through
 * `boss7Hit` in the `enemy` ink — authored on the line under each boss's own hull rather than in the
 * HURT SILHOUETTES block with the other eleven — and `drawKind` gives a boss and its hurt sprite ONE
 * `case` arm. Same geometry, same ink, same bitmap: `IMPACT_FLASH_STEPS` swapped the picture for the
 * picture.
 *
 * ⚠️ **THE INK IS THE WHOLE OF THE DIFFERENCE, WHICH IS WHY ASSERTING ON IT IS NOT ASSERTING ON
 * NOTHING.** `src/render/bake.ts` states the rule as *"the SAME shape in a different ink"* — sharing
 * the arm is deliberate, so that a flash reads as *that thing being hurt* rather than as a second
 * object appearing. `drawKind` reads exactly two things about a kind: which `case` it lands in, and
 * `INK_OF[kind]`. With the shape held equal on purpose, a guard over the ink is a guard over every
 * channel there is.
 *
 * ⚠️ **It compares two INDEPENDENTLY AUTHORED table entries rather than a constant against itself**,
 * which is the distinction `docs/decisions/0027-measure-the-picture-not-the-model.md` draws: nothing
 * here re-derives what `bake.ts` computes, and the failing case above is the one it was written from.
 *
 * ⚠️ **The pairs are WALKED off the content rows rather than listed.** A hand-kept list of hurt
 * sprites beside a hand-kept table of them is the second description `src/content/sprites.ts` records
 * the cost of, and it is how five entries came to be in the wrong block in the first place. An eighth
 * boss is covered on the day its row exists.
 */
describe('every body that can be hurt is drawn as hurt', () => {
  /** Every (body, hurt) pair in the game, off the rows that declare them. */
  const pairs: { what: string; base: number; hit: number }[] = [
    ...ENEMY_KINDS.map((kind) => ({ what: kind, base: ENEMIES[kind].sprite, hit: ENEMIES[kind].spriteHit })),
    ...BOSS_KINDS.map((kind) => ({ what: `the ${kind} boss`, base: BOSSES[kind].sprite, hit: BOSSES[kind].spriteHit })),
    ...SHIP_KINDS.map((kind) => ({
      what: `the ${kind} ship`,
      base: SHIPS[kind].sprite,
      hit: SHIPS[kind].spriteHit,
    })),
    // Every ship's hulls, which are three more pairs each that nothing else here reaches — 0081, 0441.
    ...SHIP_KINDS.flatMap((kind) =>
      SHIPS[kind].hulls.map((hull, stage) => ({ what: `the ${kind} hull at stage ${stage}`, base: hull.base, hit: hull.hit })),
    ),
  ];

  it('THE REPORTED ONE: no body flashes into a bitmap identical to itself', () => {
    for (const { what, base, hit } of pairs) {
      const baseKind = SPRITE_KINDS[base]!;
      const hitKind = SPRITE_KINDS[hit]!;
      /*
        Two ways to be the same picture, and bosses 3 to 7 were the second: the row can name one
        sprite twice, or it can name two sprites that bake identically. The first is a content typo
        and the second is what actually happened.
      */
      expect(hitKind, `${what} names one sprite for hurt and unhurt`).not.toBe(baseKind);
      expect(
        INK_OF[hitKind],
        `${what} flashes to the same ink it already wears (${INK_OF[baseKind]}), so nothing on screen changes`,
      ).not.toBe(INK_OF[baseKind]);
    }
  });

  it('and an enemy that has just been hit is never wearing the ship’s own hurt ink', () => {
    /*
      ⚠️ **The two mean OPPOSITE things and `src/render/bake.ts` says so**: the ship's blink is *you
      cannot be hurt right now* and an enemy's flash is *this just was*. One ink for both would be one
      channel carrying two meanings, which is 0024's own failure mode. It held by hand across eleven
      entries and five of them were in the wrong block, so it is held here instead.
    */
    // Every ship's hurt ink, at every stage — 0441: four ships, and each authors its own blink.
    const safe = new Set(SHIP_KINDS.flatMap((kind) => SHIPS[kind].hulls.map((hull) => INK_OF[SPRITE_KINDS[hull.hit]!])));
    for (const kind of SHIP_KINDS) safe.add(INK_OF[SPRITE_KINDS[SHIPS[kind].spriteHit]!]);
    for (const { what, hit } of pairs) {
      if (what.endsWith(' ship') || what.includes(' hull at stage ')) continue;
      expect(safe.has(INK_OF[SPRITE_KINDS[hit]!]), `a hurt ${what} is drawn in the ink that means *you are safe*`).toBe(false);
    }
  });
});

describe('the ship wears what it is carrying', () => {
  it('THE REPORTED ONE: a hull that has taken upgrades is not the hull that has not', () => {
    /*
      ⚠️ Reported from play: *"additional autofire and missile upgrades don't change the look of the
      player's ship."* `docs/game.md` states it as a rule — *"every upgrade changes how the ship looks
      on screen"* — and the ship had one silhouette from the first pickup to the last.
    */
    // ⚠️ Every ship, at no tubes, one and two — 0441: the gun's tiers are gone, so the tubes are what
    // changes the picture, and each ship authors its own three.
    for (const kind of SHIP_KINDS) {
      const bases = new Set(SHIPS[kind].hulls.map((hull) => hull.base));
      expect(bases.size, `two of the ${kind}'s hull stages are drawn as the same ship`).toBe(SHIPS[kind].hulls.length);
    }
  });

  // *0229 — a hull tier is a wider sprite than the one before it* stood here. Every stage of every
  // ship is drawn in the one `SHIP_BOX` since `docs/decisions/0441-a-pilot-flies-their-own-ship.md`
  // (*"the same overall space"*), so a stage's room no longer grows with it.

  it('and every stage has its own hit silhouette, so a flash never changes the shape', () => {
    // `stepEntities` derives `sprite` from `spriteBase` AND `spriteHit`, so a stage without its own
    // twin flashes back to the bare hull — a silhouette changing at the worst possible moment.
    for (const kind of SHIP_KINDS) {
      SHIPS[kind].hulls.forEach((hull, stage) => {
        expect(hull.hit, `the ${kind} at stage ${stage} flashes as itself, so a hit is invisible`).not.toBe(hull.base);
        expect(SPRITE_EXTENT[SPRITE_KINDS[hull.hit]!], `the ${kind} at stage ${stage} changes size when it is hit`).toBe(
          SPRITE_EXTENT[SPRITE_KINDS[hull.base]!],
        );
      });
    }
  });

  it('climbs with the upgrade list whatever the upgrades were spent on', () => {
    /*
      ⚠️ **Over the LIST rather than over barrels.** A player who spends four upgrades on missiles has
      upgraded exactly as much as one who spent them on the pulse, and a hull keyed to barrels alone
      would tell the first of them nothing.

      ── AND THE WAY THIS WAS WRITTEN STOPPED WORKING WHEN 0082 MERGED THE KINDS ────────────────────

      ⚠️ **It varied the upgrade KIND, and there is only one kind now.** *"Whatever the upgrades were
      spent on"* used to mean *a list of twelve `missileRate`s against a list of twelve `spread`s*, and
      a hull keyed to barrels told the first of them nothing.
      `docs/decisions/0082-a-pickup-is-rare-and-says-what-it-is.md` made every upgrade the same
      `weapon` — which spends its rungs on launchers AND barrels — so a tier keyed to barrels climbed
      too, and 0081's probe for this went **STILL GREEN**.

      ⚠️ **What varies now is the RUNG, and it is a sharper test than the old one.** `weaponFor`'s
      ladder is launcher, barrel, barrel, launcher, barrel: at four upgrades a ship has three barrels
      and two launchers, so a tier keyed to barrels reads 1 where the list says 2. That single rung is
      the whole difference and it is asserted directly, because a property written loosely enough to
      survive the merge is what let the probe go green in the first place.
    */
    /*
      ── SINCE 0441 THERE IS ONE LADDER, AND THE HULL IS ITS TUBES ─────────────────────────────────

      `docs/decisions/0441-a-pilot-flies-their-own-ship.md` took the gun's ladder away, so the barrels
      never move and *the hull is not a function of the barrel count* has no rival left to separate
      it from: the property that stood here, and the scan over both ladders it was written for, went
      with the gun's tiers. What survives is the half a run can still break — the stage the ship is
      drawn at climbs with the tubes it carries, never goes backwards, and stops at the last hull.
    */
    /*
      ⚠️ **The scan over the tubes' ladder was here; 0577 took the ladder**, so the list is the kinds
      fitted and its length is the count. Walked past the cap, over every kind in turn, so a list longer
      than the rack, or a mixed one, cannot draw a hull the count does not name.
    */
    for (const kind of SHIP_KINDS) {
      const row = SHIPS[kind];
      const stageOf = (carried: readonly MissileKind[]): number => row.hulls.indexOf(hullFor(row, weaponFor(row, carried).launchers));
      expect(stageOf([]), `the ${kind} opens on a hull with tubes it has not taken`).toBe(0);
      for (const first of MISSILE_KINDS.keys()) {
        let last = -1;
        for (let n = 0; n <= MAX_LAUNCHERS + 2; n++) {
          const carried: MissileKind[] = [];
          for (let i = 0; i < n; i++) carried.push(MISSILE_KINDS[(first + i) % MISSILE_KINDS.length]!);
          const launchers = weaponFor(row, carried).launchers;
          // ⚠️ The resolved count against the hulls there are, BEFORE `hullFor`'s clamp hides it.
          expect(launchers, `the ${kind} resolved more tubes than it has hulls for`).toBeLessThanOrEqual(row.hulls.length - 1);
          const stage = stageOf(carried);
          expect(stage, `the ${kind}'s hull went backwards as it took ${carried.join(', ')}`).toBeGreaterThanOrEqual(last);
          last = stage;
        }
        expect(last, `a fully fitted ${kind} never reaches its last hull`).toBe(MAX_LAUNCHERS);
      }
    }
  });

  it('is the hull the painter actually blits, and a death puts it back', () => {
    /*
      ⚠️ **Driven through the real frame and the real painter**, because the failure this replaces was
      a resolved number nobody drew: `weaponFor` could have carried a tier for months with the ship
      still blitting `SPRITE.ship` every frame, and every assertion above would have been green.
    */
    // Every ship, each flown as a run flies it: its row on the world and its bare hull worn — 0441.
    for (const kind of SHIP_KINDS) {
      const row = SHIPS[kind];
      const built = playableWorld(NO_LEVEL);
      const recorder = new Recorder();
      built.world.surface = recorder;
      built.world.shipRow = row;
      built.world.weapon = weaponFor(row, []);
      wearHull(built.world);
      const frame = new GameFrame(built.world);
      frame.draw(0);
      const bare = row.hulls[0].base;
      expect(recorder.blits.some((b) => b.sprite === bare), `the bare ${kind} was not drawn, so this measures nothing`).toBe(true);

      built.world.weapon = weaponFor(row, ['straight', 'straight']);
      wearHull(built.world);
      frame.draw(0);
      expect(
        recorder.blits.some((b) => b.sprite === bare),
        `the ${kind} is still drawn as a bare hull after two upgrades`,
      ).toBe(false);
      expect(
        recorder.blits.some((b) => b.sprite === hullFor(row, built.world.weapon.launchers).base),
        `the upgraded ${kind} hull was never drawn`,
      ).toBe(true);

      // An empty upgrade list puts the hull back with the weapon.
      built.world.weapon = weaponFor(row, []);
      wearHull(built.world);
      frame.draw(0);
      expect(
        recorder.blits.some((b) => b.sprite === bare),
        `the ${kind} lost its upgrades and kept wearing them`,
      ).toBe(true);
    }
  });
});
