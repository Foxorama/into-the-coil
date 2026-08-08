import { describe, expect, it } from 'vitest';

import { GameFrame, wearHull } from '../src/app/frame.ts';
import { INK_OF } from '../src/render/bake.ts';
import { MAX_HULL_TIER, UPGRADE_KINDS, weaponFor } from '../src/content/pickups.ts';
import { SHIPS, hullFor } from '../src/content/ships.ts';
import { SHOTS, SHOT_KINDS } from '../src/content/shots.ts';
import { SPRITE, SPRITE_EXTENT, SPRITE_KINDS } from '../src/content/sprites.ts';
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

describe('the ship wears what it is carrying', () => {
  it('THE REPORTED ONE: a hull that has taken upgrades is not the hull that has not', () => {
    /*
      ⚠️ Reported from play: *"additional autofire and missile upgrades don't change the look of the
      player's ship."* `docs/game.md` states it as a rule — *"every upgrade changes how the ship looks
      on screen"* — and the ship had one silhouette from the first pickup to the last.
    */
    const bases = new Set<number>();
    for (let tier = 0; tier <= MAX_HULL_TIER; tier++) bases.add(hullFor(tier).base);
    expect(bases.size, 'two hull tiers are drawn as the same ship').toBe(MAX_HULL_TIER + 1);
  });

  it('and every tier has its own hit silhouette, so a flash never changes the shape', () => {
    // `stepEntities` derives `sprite` from `spriteBase` AND `spriteHit`, so a tier without its own
    // twin flashes back to the tier-0 hull — a silhouette changing at the worst possible moment.
    for (let tier = 0; tier <= MAX_HULL_TIER; tier++) {
      const hull = hullFor(tier);
      expect(hull.hit, `hull tier ${tier} flashes as itself, so a hit is invisible`).not.toBe(hull.base);
      expect(SPRITE_EXTENT[SPRITE_KINDS[hull.hit]!], `hull tier ${tier} changes size when it is hit`).toBe(
        SPRITE_EXTENT[SPRITE_KINDS[hull.base]!],
      );
    }
  });

  it('climbs with the upgrade list whatever the upgrades were spent on', () => {
    /*
      ⚠️ **Over the LIST rather than over barrels.** A player who spends four upgrades on missiles has
      upgraded exactly as much as one who spent them on the pulse, and a hull keyed to barrels alone
      would tell the first of them nothing.
    */
    expect(weaponFor(SHIPS.proof, []).tier, 'a run opens on an upgraded hull').toBe(0);
    for (const only of UPGRADE_KINDS) {
      const many = Array.from({ length: 12 }, () => only);
      expect(weaponFor(SHIPS.proof, many).tier, `a ship carrying twelve ${only}s is drawn as a bare hull`).toBe(
        MAX_HULL_TIER,
      );
    }
    // Monotone, and it stops. An unbounded list may not run off the end of the hulls.
    let last = -1;
    for (let n = 0; n <= 20; n++) {
      const tier = weaponFor(SHIPS.proof, Array.from({ length: n }, () => UPGRADE_KINDS[0]!)).tier;
      expect(tier, 'the hull went backwards as the ship upgraded').toBeGreaterThanOrEqual(last);
      expect(tier, 'the hull ran off the end of the hulls there are').toBeLessThanOrEqual(MAX_HULL_TIER);
      last = tier;
    }
  });

  it('is the hull the painter actually blits, and a death puts it back', () => {
    /*
      ⚠️ **Driven through the real frame and the real painter**, because the failure this replaces was
      a resolved number nobody drew: `weaponFor` could have carried a tier for months with the ship
      still blitting `SPRITE.ship` every frame, and every assertion above would have been green.
    */
    const built = playableWorld(NO_LEVEL);
    const recorder = new Recorder();
    built.world.surface = recorder;
    const frame = new GameFrame(built.world);
    frame.draw(0);
    const bare = recorder.blits.find((b) => b.sprite === SPRITE.ship);
    expect(bare, 'the bare ship was not drawn, so this measures nothing').toBeDefined();

    built.world.weapon = weaponFor(built.world.shipRow, [UPGRADE_KINDS[0]!, UPGRADE_KINDS[0]!]);
    wearHull(built.world);
    frame.draw(0);
    expect(
      recorder.blits.some((b) => b.sprite === SPRITE.ship),
      'the ship is still drawn as a bare hull after two upgrades',
    ).toBe(false);
    expect(recorder.blits.some((b) => b.sprite === hullFor(1).base), 'the upgraded hull was never drawn').toBe(true);

    // A death empties the upgrade list (0039), so the hull goes back with the weapon.
    built.world.weapon = weaponFor(built.world.shipRow, []);
    wearHull(built.world);
    frame.draw(0);
    expect(
      recorder.blits.some((b) => b.sprite === SPRITE.ship),
      'a death took the upgrades and left the ship wearing them',
    ).toBe(true);
  });
});
