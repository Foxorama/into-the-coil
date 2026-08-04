// The breaks behind docs/decisions/0031-landscape-is-the-shipped-orientation.md.
//
// The pair worth understanding: the manifest and the gate look like the same guarantee and are not.
// The manifest break leaves the gate holding, and the gate break leaves the manifest holding — and
// the manifest holds NOTHING in a browser tab or the itch iframe, which is where most players
// arrive. Probing only one would read as coverage of both.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0031',
    suite: 'tests/orientation.browser.test.ts',
    broke: 'the gate condition removed, so portrait draws side-profile art moving the wrong way',
    guard: 'refuses to play in portrait, and says why',
    edit: {
      path: 'src/app/mount.ts',
      find: '  setPlayable(view.alongAxis === \'x\');',
      replace: '  setPlayable(true);',
    },
  },
  {
    // THE one. An overlay ABOVE a running game is the cheap version of this feature, it looks
    // identical in a screenshot, and it loses the player's run to something they cannot see.
    decision: '0031',
    suite: 'tests/orientation.browser.test.ts',
    broke: 'the gate covering the game instead of stopping it, so the run continues unseen',
    guard: 'THE ONE THAT MATTERS: the world does not advance behind the prompt',
    edit: {
      path: 'src/app/mount.ts',
      find: '    } else if (!playable && stopLoop !== null) {',
      replace: '    } else if (false && stopLoop !== null) {',
    },
  },
  {
    decision: '0031',
    suite: 'tests/orientation.browser.test.ts',
    broke: 'the prompt reduced to a bare glyph, on the one screen that exists to explain itself',
    guard: 'the prompt is text, so it does not rely on reading a pictogram',
    edit: {
      path: 'src/app/mount.ts',
      find: "  gate.textContent = 'Turn your device sideways to play.';",
      replace: "  gate.textContent = '⟳';",
    },
  },
  {
    decision: '0031',
    suite: 'tests/orientation.browser.test.ts',
    broke: 'the prompt no longer announced, so a screen-reader player rotates into silence',
    guard: 'announces itself, because it appears in response to something the player just did',
    edit: {
      path: 'src/app/mount.ts',
      find: "  gate.setAttribute('role', 'alert');",
      replace: "  gate.setAttribute('role', 'presentation');",
    },
  },
  {
    decision: '0031',
    suite: 'tests/orientation.browser.test.ts',
    broke: 'the resize path left ungated, so rotating MID-RUN reaches the view a fresh load cannot',
    guard: 'gates on a rotation INTO portrait, mid-run — the way a player actually meets this',
    edit: {
      path: 'src/app/mount.ts',
      find: "    if (next.alongAxis !== 'x') {\n      setPlayable(false);\n      return;\n    }",
      replace: "    if (false) {\n      setPlayable(false);\n      return;\n    }",
    },
  },
  {
    decision: '0031',
    suite: 'tests/shell.test.ts',
    broke: 'the manifest unlocked again, so an installed PWA offers the orientation with no art',
    guard: 'installs locked to the one orientation whose art exists',
    edit: {
      path: 'public/manifest.webmanifest',
      find: '"orientation": "landscape",',
      replace: '"orientation": "any",',
    },
  },
];
