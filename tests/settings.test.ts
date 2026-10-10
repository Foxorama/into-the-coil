import { describe, expect, it } from 'vitest';

import { SCREENS } from '../src/state/screens.ts';
import { initialState, reduce } from '../src/state/root.ts';
import { SHELF_KINDS } from '../src/content/wares.ts';
import { SOUND_KINDS } from '../src/content/sound.ts';
import { TRAVEL_KINDS } from '../src/content/travel.ts';
import { HAND_KINDS, STEER_KINDS } from '../src/content/touch.ts';
import { SETTINGS_VERSION, settingsFrom } from '../src/save/settings.ts';
import { initialSettings } from '../src/state/slices/settings.ts';

/**
 * THE SETTINGS SCREEN, AND THE SLICE BEHIND IT.
 *
 * Moved here from `tests/style.test.ts` by
 * `docs/decisions/0590-the-settings-are-tidied-and-the-game-has-a-left-hand.md`, which took the look
 * away: what that file held about the look went with it, and what it held about EVERY setting — one
 * screen each, the slice outliving a run — is this file's.
 */

describe('the settings screen is its tables', () => {
  /*
    ⚠️ **WHAT IS OFFERED, IN ORDER, AND ON WHICH DEVICES — 0590.** The sound and the crossing, then the
    hand on every device, then the steering where there is glass to steer on. Two columns of two on a
    touch screen (`src/app/chrome.ts`), so a fifth band is a decision about that layout, and it is red
    here first.
  */
  it('offers the sound, the crossing, the hand and the steering, and the look no longer', () => {
    const offered = SCREENS.settings.choices.map((c) => [c.name, c.on]);
    expect(offered).toEqual([
      ['sound', 'all'],
      ['travel', 'all'],
      ['hand', 'all'],
      ['steer', 'touch'],
    ]);
  });

  it('and each band is walked off its kind table, so an option added is an option shown', () => {
    const kinds = { sound: SOUND_KINDS, travel: TRAVEL_KINDS, hand: HAND_KINDS, steer: STEER_KINDS } as const;
    for (const choice of SCREENS.settings.choices) {
      const table = kinds[choice.name as keyof typeof kinds];
      expect(choice.options, `${choice.name} offers other than its table`).toHaveLength(table.length);
      for (const option of choice.options) {
        // `docs/game.md`'s voice rule cuts both ways: no commentary, and no unexplained switch either.
        expect(option.label.length, `an option of ${choice.name} has no name`).toBeGreaterThan(0);
        expect(option.hint.length, `${option.label} does not say what it does`).toBeGreaterThan(0);
      }
    }
  });

  /*
    ⚠️ **IT WAS *NO OTHER SCREEN OFFERS A SETTING*, AND WHAT IT HELD WAS ONE PLACE TO LOOK — 0458.** Two
    screens offer settings now, the title its tier and pilot and Settings the rest, so the claim moves
    from the screen to the setting: each is offered on exactly one screen, or a player changing it in one
    place would find it set differently in the other's memory of where to look.
  */
  it('every setting is offered on exactly one screen, so there is one place to look for it', () => {
    const where = new Map<string, string[]>();
    for (const [name, row] of Object.entries(SCREENS)) {
      for (const choice of row.choices) where.set(choice.name, [...(where.get(choice.name) ?? []), name]);
    }
    /*
      ⚠️ **EXCEPT THE PILOT, ON THE TITLE AND IN THE HANGAR — 0521.** Asked for: the hangar *"allows you to
      select your pilot, then …"*, because what it fits is that pilot's ship. It is one value in one slice,
      so the two bands cannot disagree, and the title is still where a pilot is flown from. Named here
      rather than loosened to *at most two*, so a third screen offering it is red.

      0527: and on *Paint & Parts*, the hangar's second tab, for the same reason — what it dresses is that
      pilot's ship. Named, as the hangar was.

      0548: and on *Cosmo's*, the third tab — what it tries a ware on is that pilot's ship, and changing
      which ship meant leaving the shop. Named, as the other two were.
    */
    for (const [setting, screens] of where) {
      if (setting === 'pilot') expect(screens.sort(), 'the pilot is offered somewhere other than the title and the hangar’s tabs').toEqual(['hangar', 'parts', 'shop', 'title']);
      // 0584: a stand's sub-tabs are its own, not a setting: each tabbed stand steps the group in view on its own screen.
      else if (setting === 'section') expect(screens.sort(), 'sub-tabs are on a screen whose stand is not tabbed').toEqual(['hangar', 'parts']);
      else expect(screens, `${setting} is offered on more than one screen`).toHaveLength(1);
    }
    // 0512: and the touch section's two, on Settings with the rest.
    // 0517: and the continues band, on the title beside the tier.
    // 0521: and the hangar's dash, a slot of the ship on its stand rather than a setting.
    // 0523: and what hangs from it, and Cosmo's shelf.
    // 0524: and the special a run opens with; 0526: and the gun it flies; 0527: and what its wheels wear.
    // 0528: and its art; 0529: and its paint, a colour and a tone; 0530: and its flame.
    // 0542: and Cosmo's shelf is a shelf a table and the aisle that steps them, every one read off the table.
    // 0578: and the rack of tubes a ship carries in, beside its gun and its special.
    // 0579: and Hangin' Out's sub-tabs, which step the group in view.
    // 0584: and the shell a ship's shields wear.
    // 0590: and no longer the look.
    expect([...where.keys()].sort()).toEqual(
      ['art', 'credits', 'dangle', 'difficulty', 'flame', 'gun', 'hand', 'livery', 'pilot', 'plate', 'rack', 'rim', 'shell', 'sound', 'special', 'steer', 'tone', 'travel', 'aisle', 'section', ...SHELF_KINDS].sort(),
    );
  });
});

describe('the settings slice', () => {
  it('preserves identity when nothing moved, which is what stops a re-apply per press', () => {
    // `src/app/mount.ts` compares fields by reference to decide whether to touch the DOM or the speaker.
    const state = reduce(initialState, { slice: 'settings', type: 'hand', hand: initialState.settings.hand });
    expect(state, 'choosing the hand that was already on rebuilt the state').toBe(initialState);
  });

  it('is untouched by a run, which is the whole reason it is not on one', () => {
    /*
      ⚠️ **A setting outlives a run and `begin` is what would eat it.**
      `docs/decisions/0039-a-run-is-lives-and-a-death-costs-the-arsenal.md` puts the TIER on the run
      because a tier belongs to it; a hand does not, and a field on the run slice would be reset every
      time somebody pressed a difficulty.
    */
    const chosen = reduce(initialState, { slice: 'settings', type: 'hand', hand: 'left' });
    const played = reduce(
      reduce(chosen, { slice: 'run', type: 'begin', difficulty: 'savior', ship: initialState.run.ship, credits: 'free' }),
      { slice: 'screen', type: 'show', screen: 'playing' },
    );
    expect(played.settings.hand, 'starting a run reset the hand').toBe('left');
    expect(played.settings, 'a run rebuilt the settings slice').toBe(chosen.settings);
  });

  it('a kept document that still names the look reads every other setting as it was — 0590', () => {
    /*
      ⚠️ **THE LOOK IS GONE FROM THE KEY, NOT FROM EVERY PLAYER'S BROWSER.** A document written before
      0590 carries `style`, and 0510's per-field read is what makes it harmless: a field the game no longer
      has is that field ignored, and its neighbours are read.
    */
    const old = JSON.stringify({ v: SETTINGS_VERSION, style: 'retro', sound: 'off', travel: 'brief', hand: 'left' });
    const back = settingsFrom(old, initialSettings);
    expect(back.sound).toBe('off');
    expect(back.travel).toBe('brief');
    expect(back.hand).toBe('left');
    expect(Object.keys(back), 'the look came back in through an old document').not.toContain('style');
  });
});
