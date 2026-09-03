// The breaks behind docs/decisions/0216-the-menu-says-what-is-playing.md.
//
// ⚠️ THE REPORTED DEFECT WAS NOT A DEFECT, AND THAT IS WHY THIS DECISION EXISTS. Reported: "the play
// all button either never worked properly, or it regressed. it now just repeats the same track."
// Play all was advancing correctly — the readout named the new place, the backdrop changed with it,
// and the mixer got the new theme. What never moved was the NINE BUTTONS, which are the biggest thing
// on the screen. A screen whose largest element contradicts its smallest reads as broken, and the
// report is what that looks like from the outside.
//
// ⚠️ SO EVERY BREAK HERE IS ABOUT THE BUTTON, not about the walk. tests/room.browser.test.ts already
// held the handover and was green throughout.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0216',
    suite: 'tests/room.browser.test.ts',
    /*
      ⚠️ THE STATE AS IT SHIPPED, PUT BACK. Nothing about the room's own code looked wrong: the
      readout had the place, the bar had the position, and the menu was a menu. The missing thing is
      only visible if you ask what the SCREEN says rather than what the code knows.
    */
    broke: 'the menu no longer marking which place is playing, which is the report exactly',
    guard: 'says which place is playing, where in it, and what Play all moves to next',
    edit: {
      path: 'src/app/mount.ts',
      find: '      control: THEME_KINDS.indexOf(place),',
      replace: '      control: null,',
    },
  },
  {
    decision: '0216',
    suite: 'tests/room.browser.test.ts',
    /*
      ⚠️ A MARK LEFT ON IS A LIE ABOUT A ROOM NOBODY IS IN. It survives leaving the screen, so the
      next visit opens with a place already claiming to sound — and the clear is three lines in a
      branch that already returns early, which is exactly the kind of thing a tidy-up removes.
    */
    broke: 'the mark left on after leaving the room, so a place claims to be playing when none is',
    guard: "leaves the run's camera where it found it",
    edit: {
      path: 'src/app/chrome.ts',
      find:
        '        for (const control of panels.music?.controls ?? []) {\n' +
        "          control.classList.remove(prefixFor('music') + 'action-playing');\n" +
        '        }',
      replace: '',
    },
  },
  {
    decision: '0216',
    suite: 'tests/menu.browser.test.ts',
    /*
      ⚠️ ALWAYS FOLLOWING IS THE OBVIOUS READING OF THE ASK, and it is the one that takes the menu
      away from a player mid-press: `activate` presses whatever the ring is on. The ring is LENT, and
      the line that gives it back is one assignment in the one place a deliberate move is heard.
    */
    broke: 'the focus ring never given back, so the walk moves the cursor under the player’s hands',
    guard: 'moves DOWN a column and RIGHT along a row',
    edit: {
      path: 'src/app/mount.ts',
      find: '    if (menuAsk.move !== 0) {\n      focusFollowsWalk = false;',
      replace: '    if (menuAsk.move !== 0) {',
    },
  },
  {
    decision: '0216',
    suite: 'tests/room.browser.test.ts',
    /*
      ⚠️ AND THE OPPOSITE MISTAKE: never lending it at all. The ring sits on `Play all` for the whole
      run, which is a button that is not a place — so the menu still never points at what is sounding,
      which is half the report surviving the fix for it.
    */
    broke: 'the ring never lent to the walk, so it sits on Play all while seven places go past',
    guard: 'says which place is playing, where in it, and what Play all moves to next',
    edit: {
      path: 'src/app/mount.ts',
      find: '      focusFollowsWalk = true;\n      beginAudition(THEME_KINDS[0]!);',
      replace: '      beginAudition(THEME_KINDS[0]!);',
    },
  },
];
