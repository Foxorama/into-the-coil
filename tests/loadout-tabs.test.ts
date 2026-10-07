import { describe, expect, it } from 'vitest';
import { SCREENS, SCREEN_KINDS, SLOT_NAMES } from '../src/state/screens.ts';

/**
 * THE LOADOUT HAS TABS — `docs/decisions/0579-the-loadout-has-tabs.md`.
 *
 * *"they should be purchasable in Cosmo's and equipable in Hangin' Out. If we need to scroll or something on
 * hanging out, then we need better menu's there. There's going to be shield cosmetics and other cosmetics as
 * well so we need to have that section capable of handling more."* Answered as sub-tabs: Loadout (gun,
 * special, tubes) and Cockpit (dash, hanging), one in view at a time. What is held here is the table — the
 * tabs are the stand's own groups, and every slot the hangar fits is under exactly one of them.
 */

describe('a tabbed stand', () => {
  it('offers a section band whose tabs are its groups, in order, and an untabbed stand offers none', () => {
    for (const screen of SCREEN_KINDS) {
      const row = SCREENS[screen];
      const section = row.choices.find((c) => c.name === 'section');
      if (row.stand?.tabbed === true) {
        expect(section?.options.map((o) => o.label), `${screen}'s sub-tabs are not its groups`).toEqual(row.stand.groups.map((g) => g.label));
        expect(section?.press, `${screen}'s sub-tabs do not step`).toBe('steps');
      } else expect(section, `${screen} has sub-tabs and shows every group`).toBeUndefined();
    }
  });

  it('THE ASK: Hangin’ Out is tabbed — Loadout is the gun, the special and the tubes, Cockpit the dash and what hangs', () => {
    const stand = SCREENS.hangar.stand;
    expect(stand?.tabbed).toBe(true);
    expect(stand?.groups.map((g) => [g.label, [...g.bands]])).toEqual([
      ['Loadout', ['gun', 'special', 'rack']],
      ['Cockpit', ['plate', 'dangle']],
    ]);
  });

  it('puts every slot band on a tabbed stand under exactly one tab, so none is unreachable and none is drawn twice', () => {
    for (const screen of SCREEN_KINDS) {
      const stand = SCREENS[screen].stand;
      if (stand === null || !stand.tabbed) continue;
      for (const choice of SCREENS[screen].choices) {
        if (!SLOT_NAMES.some((slot) => slot === choice.name)) continue;
        const holding = stand.groups.filter((g) => g.bands.includes(choice.name));
        expect(holding.length, `${choice.name} on ${screen} is under ${holding.length} tabs`).toBe(1);
      }
    }
  });
});
