import { describe, it } from 'vitest';
import { LEVELS, LEVEL_KINDS } from '../src/content/levels.ts';
import { BOSSES } from '../src/content/bosses.ts';
import { SHIPS, SHIP_KINDS } from '../src/content/ships.ts';
import { WEAPON_KINDS } from '../src/content/weapons.ts';
import { expectBossFloor, expectSerpentFloor } from './boss-floor.ts';

/**
 * THE BOSS FLOOR IN ALL SIXTEEN — `docs/decisions/0526-the-gun-is-fitted.md`.
 *
 * ⚠️ **A QUANTITY IS CHECKED IN THE CASE IT IS APPLIED TO.** 0260's forty seconds and the serpent's
 * twenty-eight were measured with every gun in its own ship, and since 0526 a gun flies from any won
 * ship's hardpoint — a different muzzle, so a different place the shots leave from. These are the twelve
 * pairings the hangar opened; the four own ones stay where they were held, in `tests/level.test.ts` and
 * `tests/serpent.test.ts`, and all of them call `tests/boss-floor.ts`.
 *
 * ⚠️ **A FILE OF ITS OWN, ONE CASE PER GUN.** About two and a half minutes of flying, which in
 * `tests/level.test.ts` would have landed on one CI shard; a file is what the shards deal (0420), and a
 * case per gun is 0447's split.
 */

describe('0526 — a borrowed gun meets the boss floor its own ship meets', () => {
  for (const gun of WEAPON_KINDS) {
    it(`every won ship that can borrow the ${gun}, against every boss`, () => {
      for (const ship of SHIP_KINDS) {
        if (SHIPS[ship].weapon === gun) continue;
        for (const level of LEVEL_KINDS) {
          const kind = LEVELS[level].boss;
          if (BOSSES[kind].chain === null) expectBossFloor(kind, gun, ship);
          else if (kind === 'jormungandr') expectSerpentFloor(gun, ship);
          // A second chained boss has a floor of its own to be written, and this must not pass over it.
          else throw new Error(`${kind} is chained and has no floor here`);
        }
      }
    }, 600_000);
  }
});
