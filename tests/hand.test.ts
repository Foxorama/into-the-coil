import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

import { DEFAULT_HAND, HANDS, HAND_KINDS } from '../src/content/touch.ts';
import { SPECIAL_BINDINGS } from '../src/content/actions.ts';
import { makeIntent, type Intent } from '../src/sim/intent.ts';
import { combineDevices } from '../src/app/devices.ts';
import { attachInput, type InputSource } from '../src/app/input.ts';

/**
 * THE GAME HAS A LEFT HAND — `docs/decisions/0590-the-settings-are-tidied-and-the-game-has-a-left-hand.md`.
 *
 * Asked for as *"a setting to play left handed … basically mirror mode so instead of flying to the
 * right, you fly to the left and everything is correctly mirrored for that, buttons bosses, attacks
 * etc."*
 *
 * ⚠️ **WHAT IS HELD HERE IS WHAT A UNIT CAN SEE**: that the world cannot learn the hand, and that a push
 * is read back through the mirror on every device and on the one axis the mirror turns. That the
 * PICTURE is mirrored — the canvas flipped on the field and not in the port, the discs on the left — is
 * a fact about a page, and `tests/hand.browser.test.ts` holds it there.
 */

const root = fileURLToPath(new URL('..', import.meta.url));

/** Every `.ts` under a directory, recursively. An explicit walk, not a glob. */
function filesUnder(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(resolve(root, dir), { withFileTypes: true })) {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) out.push(...filesUnder(path));
    else if (entry.name.endsWith('.ts')) out.push(path);
  }
  return out;
}

const read = (file: string): string => readFileSync(resolve(root, file), 'utf8');

/** Comments out, so a ban cannot fire on the sentence explaining it — `tests/travel.test.ts`'s terms. */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

describe('the hand cannot reach the game', () => {
  /**
   * ⚠️ **THE PAINTERS ARE ON IT, AND THAT IS THE DIFFERENCE FROM THE TRAVEL BAN.** The mirror is a
   * transform on the canvas element, applied by the shell; a painter that learned the hand would be a
   * second place the flip could happen, and the two together are the picture flipped back.
   */
  const FORBIDDEN = [...filesUnder('src/sim'), ...filesUnder('src/render'), 'src/app/frame.ts', 'src/app/boss.ts'];

  it('finds the files it is scanning, so it cannot pass by scanning nothing', () => {
    expect(FORBIDDEN.length, 'the scan found no simulation files — the walk is broken').toBeGreaterThan(10);
    for (const file of FORBIDDEN) expect(read(file).length, `${file} is empty or missing`).toBeGreaterThan(0);
  });

  it('THE BAN: nothing that decides an outcome or paints the field may import the hand', () => {
    /*
      `docs/decisions/0024-the-accessibility-floor-is-settings.md`: no comfort setting may touch the sim.
      A left-handed player flies the identical game, seen in a mirror — a step that could read the hand
      could put a spawn on the other side, and the game would be a different one in each hand.
    */
    const offenders = FORBIDDEN.filter((file) => stripComments(read(file)).includes('content/touch'));
    expect(offenders, `these can see the hand: ${offenders.join(', ')}`).toEqual([]);
  });
});

describe('the table', () => {
  it('right is the game as it is drawn, and left is that game mirrored', () => {
    // 0024: there is one game and it is the loud one — the default is the picture every art pass was made in.
    expect(DEFAULT_HAND).toBe('right');
    expect(HANDS[DEFAULT_HAND].mirrored, 'the default hand is a mirror').toBe(false);
    expect(HAND_KINDS.filter((kind) => HANDS[kind].mirrored), 'there is no left hand').toEqual(['left']);
  });
});

/** A source that pushes a fixed ask, as a device would. */
function pushing(along: number, across: number, aim: number): InputSource {
  return {
    contribute(intent: Intent): void {
      intent.along += along;
      intent.across += across;
      intent.aim += aim;
    },
    spend(): void {},
    release(): void {},
  };
}

describe('a push is read back through the mirror', () => {
  it('turns along and only along, after every device has added', () => {
    let mirrored = false;
    const devices = combineDevices([pushing(0.6, 0.3, -0.4), pushing(0.7, 0, 0)], () => mirrored);
    const intent = makeIntent(SPECIAL_BINDINGS);
    devices.contribute(intent);
    expect([intent.along, intent.across, intent.aim]).toEqual([1, 0.3, -0.4]);
    /*
      ⚠️ **AFTER THE CLAMP, WHICH IS WHY THE SUM IS 1.3 AND THE ANSWER −1.** Turned per device it would
      be the same here; turned before the clamp it would be too, since the clamp is symmetric — the
      order is stated because the one place it happens is the claim, and the frame never sees the hand.
    */
    mirrored = true;
    devices.contribute(intent);
    expect([intent.along, intent.across, intent.aim], 'the mirror turned an axis it does not cross').toEqual([-1, 0.3, -0.4]);
  });

  it('and a keyboard pressed toward the screen’s left flies the ship forward, which is left', () => {
    /*
      ⚠️ **UNITS THE PLAYER HAS, NOT ONES THE CODE HAS — 0027.** *Left arrow* is a key on the player's
      desk and *forward* is the direction the level comes from; mirrored, the level comes from the left,
      so the key that points there is the one that flies into it.
    */
    const keys = new EventTarget();
    const devices = combineDevices([attachInput(keys)], () => true);
    const intent = makeIntent(SPECIAL_BINDINGS);
    keys.dispatchEvent(Object.assign(new Event('keydown'), { code: 'ArrowLeft' }));
    devices.contribute(intent);
    expect(intent.along, 'the left arrow did not fly the mirrored ship forward').toBe(1);
    keys.dispatchEvent(Object.assign(new Event('keyup'), { code: 'ArrowLeft' }));
    keys.dispatchEvent(Object.assign(new Event('keydown'), { code: 'ArrowUp' }));
    devices.contribute(intent);
    // `Math.abs`: a mirrored nought is −0, which is nought to everything the ship does with it.
    expect([Math.abs(intent.along), intent.across], 'up is still up in a mirror').toEqual([0, -1]);
  });
});
