// The crossing reads as a nav plate — docs/decisions/0341-the-crossing-reads-as-a-nav-plate.md
//
// Every guard 0341 adds, broken on purpose. `node scripts/prove-guard.mjs 0341`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0341',
    suite: 'tests/travel.browser.test.ts',
    /*
      ⚠️ THE FRAME BACK IN THE PLAYER'S INK, WHICH IS A PLATE THAT IS CYAN ON EVERY CROSSING. Every rule
      on the plate reads the accent with the ink as its fallback, so this is what a typo in the
      property's name looks like too: nothing errors, the plate is handsome, and a screenshot of any ONE
      crossing is fine. It is six crossings that are wrong, by being the same.
    */
    broke: 'the plate’s frame is drawn in the player’s ink whatever place it names',
    guard: 'is framed and lit in the colour it is handed, and says what its parts are',
    edit: {
      path: 'src/app/chrome.ts',
      find: '  --itc-edge: color-mix(in srgb, var(--itc-accent, var(--itc-ink)) 72%, transparent);',
      replace: '  --itc-edge: color-mix(in srgb, var(--itc-ink) 72%, transparent);',
    },
  },
  {
    decision: '0341',
    suite: 'tests/travel.test.ts',
    /*
      ⚠️ THE NAME SET IN THE RAW ACCENT, WHICH IS THE EDIT SOMEBODY MAKES BECAUSE IT LOOKS RICHER. On
      Rime Shelf's teal it does. The Approach's accent is a dim teal and the high-contrast column's are
      dimmer still, and set in them raw the name is dark type on a dark plate — on the one palette that
      exists for a player who needs it not to be (0024).
    */
    broke: 'the place’s name is set in its raw accent, so the dim places cannot be read on their own plate',
    guard: 'for all seven places, in both palettes, against the plate it is actually on',
    edit: {
      path: 'src/app/chrome.ts',
      find: '  color: color-mix(in srgb, var(--itc-accent, var(--itc-ink)) 45%, white);',
      replace: '  color: color-mix(in srgb, var(--itc-accent, var(--itc-ink)) 100%, white);',
    },
  },
  {
    decision: '0341',
    suite: 'tests/travel.test.ts',
    /*
      ⚠️ THE SECOND TAKEN BACK. *"If anything could be slightly longer"* is a play report, and the floor
      is one number in a table — the kind that a conflict resolved by taking the older side reverts
      without anything failing to compile.
    */
    broke: 'the burn is four seconds again, which was played and asked to be longer',
    guard: 'and the whole of it is stated in seconds a player would recognise',
    edit: {
      path: 'src/content/travel.ts',
      find: "hint: 'The full burn between places.', floorSteps: 210 },",
      replace: "hint: 'The full burn between places.', floorSteps: 150 },",
    },
  },
];
