// The breaks behind docs/decisions/0045-the-player-can-see-what-they-are-carrying.md.
//
// ⚠️ Every one of these is a change that looks completely correct in a screenshot. A HUD is the
// purest case of docs/decisions/0036-an-event-the-model-knows-about-the-picture-mentions.md: it is
// right on the frame it is drawn and wrong for every frame after, and a still image cannot tell the
// two apart.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0045',
    suite: 'tests/hud.browser.test.ts',
    // A hand-kept legend is what the key exists to not be. Filtering one kind out is the shape of a
    // list that has gone stale — and the table is still complete, so nothing else notices.
    broke: 'a pickup dropped from the key while the table still carries it',
    guard: 'lists every pickup, with its name and what it does',
    edit: {
      path: 'src/app/chrome.ts',
      find: '      for (const pickup of PICKUP_KINDS) {',
      replace: "      for (const pickup of PICKUP_KINDS.filter((k) => k !== 'spread')) {",
    },
  },
  {
    decision: '0045',
    suite: 'tests/hud.browser.test.ts',
    // ⚠️ THE ONE A SCREENSHOT CANNOT SEE. The readout is drawn correctly once and then never again;
    // every still image of the game looks exactly right.
    broke: 'the readout rendered once and never updated',
    guard: 'follows the ship down as it takes hits',
    edit: {
      path: 'src/app/frame.ts',
      find: '    if (w.ship.health !== w.shownHealth) {',
      replace: '    if (false) {',
    },
  },
  {
    decision: '0045',
    suite: 'tests/hud.browser.test.ts',
    // Colour carrying the meaning by itself, which is what every other shooter does and what 0024
    // puts in the unconditional tier against.
    broke: 'spent shield shown as a colour change rather than a hollow pip',
    guard: 'draws one pip per point of the ship’s health, spent ones hollow',
    edit: {
      path: 'src/app/chrome.ts',
      find: '        pips[i]!.classList.toggle',
      replace: '        pips[i]!.style.opacity = i >= health ? "0.3" : "1";\n        void pips[i]!.classList.toggle',
    },
  },
  {
    decision: '0045',
    suite: 'tests/hud.browser.test.ts',
    // The readout left up over the title and the game-over screens. Harmless-looking, and it puts a
    // live shield count over a run that has already ended.
    broke: 'the readout left up over every screen instead of only the one being played',
    guard: 'is hidden until a run starts, and shows while playing',
    edit: {
      path: 'src/app/chrome.ts',
      find: "      hud.classList.toggle('itc-playing-hud-shown', screen === 'playing');",
      replace: "      hud.classList.toggle('itc-playing-hud-shown', true);",
    },
  },
  {
    decision: '0045',
    suite: 'tests/hud.browser.test.ts',
    // The pips stay, the meaning goes. A row of discs with no label is invisible to a screen reader,
    // and looks completely finished to everybody else.
    broke: 'the shield readout stripped of its label, leaving a row of unreadable discs',
    guard: 'reports the run in words as well as in pictures',
    edit: {
      path: 'src/app/chrome.ts',
      find: "      shieldGroup.setAttribute('aria-label', 'Shield ' + String(Math.max(0, health)) + ' of ' + String(maxHealth));",
      replace: '      void maxHealth;',
    },
  },
];
