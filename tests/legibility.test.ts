import { describe, expect, it } from 'vitest';

import { GameFrame, wearHull } from '../src/app/frame.ts';
import { INK_OF } from '../src/render/bake.ts';
import {
  MAX_HULL_TIER,
  UPGRADE_KINDS,
  UPGRADE_TIERS,
  type UpgradeKind,
  weaponFor,
} from '../src/content/pickups.ts';
import { SHIPS, hullFor } from '../src/content/ships.ts';
import { SHOTS, SHOT_KINDS, type ShotKind } from '../src/content/shots.ts';
import { ENEMIES, ENEMY_KINDS } from '../src/content/enemies.ts';
import { BOSSES, BOSS_KINDS } from '../src/content/bosses.ts';
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
    const fromEnemies = new Set(shooters.map((k) => ENEMIES[k].shot));
    // A boss's fall sends its rock — 0251: a fall is a volley from the sky, and the rock is nobody else's.
    // And a head sends its own shot — 0254: the hydra's phases name five through their heads.
    const fromBosses = new Set(
      BOSS_KINDS.flatMap((k) => [
        BOSSES[k].shot,
        ...BOSSES[k].phases.map((p) => p.shot ?? BOSSES[k].shot),
        ...BOSSES[k].phases.flatMap((p) => (p.attack?.kind === 'heads' ? p.attack.heads.map((h) => h.shot) : [])),
        ...(BOSSES[k].fall === null ? [] : [BOSSES[k].fall.shot]),
      ]),
    );
    expect(fromBosses.size, `all ${BOSS_KINDS.length} bosses send ${fromBosses.size} kind(s) of bullet`).toBeGreaterThan(
      2,
    );
    expect(fromEnemies.size, 'the enemies send fewer than three kinds of bullet').toBeGreaterThanOrEqual(3);
    const sent = new Set<string>([...fromEnemies, ...fromBosses]);
    const hostile = SHOT_KINDS.filter((k) => ['enemy', 'acid', 'void', 'fire', 'frost'].includes(INK_OF[SPRITE_KINDS[SHOTS[k].sprite]!]));
    expect(
      hostile.filter((k) => !sent.has(k)),
      'a hostile bullet exists in the table and nothing — enemy, boss or phase — sends it',
    ).toEqual([]);
    const signatures = new Set(shooters.map((k) => `${ENEMIES[k].shot}/${ENEMIES[k].attack.kind}`));
    expect(
      signatures.size,
      `two enemy kinds send the same bullet in the same pattern (${[...signatures].join(', ')})`,
    ).toBe(shooters.length);

    /*
      ⚠️ **AND THEY DIFFER IN THE TWO CHANNELS 0081 NAMES, on the screen the report was made on.**
      Ink is deliberately NOT one of them — every threat is one colour so the player learns one rule
      about colour — so shape and size are carrying the whole load and both have to be real.
    */
    const bullets = [...sent];
    const sprites = new Set(bullets.map((k) => SHOTS[k as ShotKind].sprite));
    expect(sprites.size, 'two of the bullets that shoot at the player share a silhouette').toBe(bullets.length);
    const sizes = bullets.map((k) => drawnPx(SHOTS[k as ShotKind].sprite)).sort((a, b) => a - b);
    for (let i = 1; i < sizes.length; i++) {
      const gap = sizes[i]! - sizes[i - 1]!;
      expect(
        gap,
        `two enemy bullets are drawn ${gap.toFixed(1)}px apart on a 1280×720 screen, which is the same size`,
      ).toBeGreaterThan(5);
    }

    /*
      ⚠️ **AND THE FAST ONE IS THE SMALL ONE, which is what keeps this a legibility change.** The shot
      that gives the player least time to move is the one that takes least of the lane, and the one
      that fills the lane is the one they can walk away from. Reversed, the same three rows would be a
      difficulty increase wearing a variety change — and every hurtbox is identical, so nothing else
      in the suite could tell the difference.
    */
    const bySpeed = [...bullets].sort((a, b) => SHOTS[a as ShotKind].speed - SHOTS[b as ShotKind].speed);
    const drawn = bySpeed.map((k) => drawnPx(SHOTS[k as ShotKind].sprite));
    for (let i = 1; i < drawn.length; i++) {
      expect(
        drawn[i],
        `${bySpeed[i]} is faster than ${bySpeed[i - 1]} and is drawn no smaller — the quick shot is also the big one`,
      ).toBeLessThan(drawn[i - 1]!);
    }
    // And nothing an ENEMY shoots at the player got a bigger hurtbox out of it — 0081's own rule.
    // ⚠️ The enemies' bullets and not the bosses' — 0248: a boss's own blast is bigger to hit as
    // well as to see, on purpose, and `tests/combat.test.ts` holds its hurtbox inside its drawing.
    const radii = new Set([...fromEnemies].map((k) => SHOTS[k].radius));
    expect(radii.size, 'the enemy bullets no longer share one hurtbox, so this was a difficulty change').toBe(1);
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
    ...Object.keys(SHIPS).map((kind) => ({
      what: `the ${kind} ship`,
      base: SHIPS[kind as keyof typeof SHIPS].sprite,
      hit: SHIPS[kind as keyof typeof SHIPS].spriteHit,
    })),
    // The hull ladder, which is three more pairs nothing else here reaches — 0081.
    ...Array.from({ length: MAX_HULL_TIER + 1 }, (_unused, tier) => ({
      what: `hull tier ${tier}`,
      base: hullFor('pulse', tier).base,
      hit: hullFor('pulse', tier).hit,
    })),
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
    const ship = INK_OF[SPRITE_KINDS[SHIPS.proof.spriteHit]!];
    for (const { what, hit } of pairs) {
      if (what.endsWith('ship') || what.startsWith('hull tier')) continue;
      expect(INK_OF[SPRITE_KINDS[hit]!], `a hurt ${what} is drawn in the ink that means *you are safe*`).not.toBe(ship);
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
    const bases = new Set<number>();
    for (let tier = 0; tier <= MAX_HULL_TIER; tier++) bases.add(hullFor('pulse', tier).base);
    expect(bases.size, 'two hull tiers are drawn as the same ship').toBe(MAX_HULL_TIER + 1);
  });

  it('0229 — a hull tier is a wider sprite than the one before it', () => {
    /*
      ⚠️ **"WE LOST THE SHIP UPGRADE GRAPHICS IN THE GRAPHICS UPGRADE."** 0227's pods and canards
      were authored inside the bare hull's own 7-unit box and came out four pixels tall. A tier's
      parts are drawn in the hull's radius, so the room they have is the extent — a number here, not
      a fraction in a drawing. Each tier's box is wider than the last; the hurtbox does not move.
    */
    for (let tier = 1; tier <= MAX_HULL_TIER; tier++) {
      const wider = SPRITE_EXTENT[SPRITE_KINDS[hullFor('pulse', tier).base]!];
      const narrower = SPRITE_EXTENT[SPRITE_KINDS[hullFor('pulse', tier - 1).base]!];
      expect(wider, `hull tier ${tier} has no more room than tier ${tier - 1}, so its parts have nowhere to be seen`).toBeGreaterThan(
        narrower,
      );
    }
  });

  it('and every tier has its own hit silhouette, so a flash never changes the shape', () => {
    // `stepEntities` derives `sprite` from `spriteBase` AND `spriteHit`, so a tier without its own
    // twin flashes back to the tier-0 hull — a silhouette changing at the worst possible moment.
    for (let tier = 0; tier <= MAX_HULL_TIER; tier++) {
      const hull = hullFor('pulse', tier);
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
    expect(weaponFor(SHIPS.proof, []).tier, 'a run opens on an upgraded hull').toBe(0);
    for (const only of UPGRADE_KINDS) {
      const many = Array.from({ length: 12 }, () => only);
      expect(weaponFor(SHIPS.proof, many).tier, `a ship carrying twelve ${only}s is drawn as a bare hull`).toBe(
        MAX_HULL_TIER,
      );
    }

    /*
      THE PROPERTY THAT SEPARATES *counted over the list* FROM *counted over barrels*, and it is an
      existence rather than a number.

      ⚠️ **Stated as *the tier is not a function of the barrel count*.** A first attempt asserted the
      tier at four upgrades against `floor(shots / 2)`, which is one rival formula out of many — the
      probe uses `shots - 1`, so the guard passed while the hull was keyed to barrels and 0081's probe
      went STILL GREEN a second time. Naming the rival is guessing; naming the property is not.

      The ladder spends rung four on a launcher, so a ship with three upgrades and a ship with four
      have **the same three barrels and different tiers**. Any rule computed from `shots` alone must
      draw them identically, and this is what notices.
    */
    const byBarrelCount = new Map<number, Set<number>>();
    for (let guns = 0; guns <= 6; guns++) {
      for (let tubes = 0; tubes <= 6; tubes++) {
        /*
          ⚠️ **BOTH LADDERS, and scanning one of them is what let this pass while broken.** 0083 split
          the missiles back out, and a loadout of nothing but weapons moves the barrels on almost every
          tier — so over that axis alone the barrel count and the hull climb together and a hull keyed
          to barrels is indistinguishable. The whole point is the ship that spent its upgrades on
          MISSILES: same one barrel as a bare ship, and it has upgraded four times.
        */
        const carried: UpgradeKind[] = [];
        for (let i = 0; i < guns; i++) carried.push('weapon');
        for (let i = 0; i < tubes; i++) carried.push('missile');
        const resolved = weaponFor(SHIPS.proof, carried);
        const seen = byBarrelCount.get(resolved.shots) ?? new Set<number>();
        seen.add(resolved.tier);
        byBarrelCount.set(resolved.shots, seen);
      }
    }
    const splits = [...byBarrelCount.values()].filter((tiers) => tiers.size > 1);
    expect(
      splits.length,
      'every barrel count maps to exactly one hull, so the hull is a function of the barrels rather ' +
        'than of the upgrade list — a ship that spent a rung on a launcher is drawn as one that spent nothing',
    ).toBeGreaterThan(0);
    /*
      Monotone, and it stops. An unbounded list may not run off the end of the hulls.

      ⚠️ **WALKED OVER BOTH LADDERS, AND ONE LADDER COULD NOT REACH THE CLAMP.** This used to add
      `UPGRADE_KINDS[0]` twenty times, and since 0083 a single ladder caps at `UPGRADE_TIERS` — so the
      most tiers one kind can contribute is four, the hull reads two, and the clamp is never tested.
      `npm run prove` removed the clamp entirely and this stayed **STILL GREEN**.

      Both ladders full is eight tiers, which is four hulls' worth against the three that exist. That
      is the only loadout in the game that can reach the ceiling, and it is one a real run can build.
    */
    let last = -1;
    for (let n = 0; n <= UPGRADE_TIERS * UPGRADE_KINDS.length + 6; n++) {
      const carried: UpgradeKind[] = [];
      for (let i = 0; i < n; i++) carried.push(UPGRADE_KINDS[i % UPGRADE_KINDS.length]!);
      const tier = weaponFor(SHIPS.proof, carried).tier;
      expect(tier, 'the hull went backwards as the ship upgraded').toBeGreaterThanOrEqual(last);
      expect(tier, 'the hull ran off the end of the hulls there are').toBeLessThanOrEqual(MAX_HULL_TIER);
      last = tier;
    }
    expect(last, 'a fully upgraded ship never reaches the last hull, so the clamp is untested').toBe(MAX_HULL_TIER);
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
    expect(recorder.blits.some((b) => b.sprite === hullFor('pulse', 1).base), 'the upgraded hull was never drawn').toBe(true);

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
