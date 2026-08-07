// The breaks behind docs/decisions/0070-a-style-is-a-setting-and-the-first-one.md.
//
// ⚠️ Two of these are about the SETTING and two are about the PICTURE, and the split is the point: a
// style that dispatches perfectly and changes nothing on screen passes every unit test there is.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0070',
    suite: 'tests/style.test.ts',
    /*
      ⚠️ THE BAN, and the break is the one that would actually happen: a style field read by the
      thing that decides what hits what. Nothing about it looks wrong at the call site — the frame
      already knows about sprites — and after it lands, choosing a look is choosing a difficulty and
      no later test can tell the two apart.
    */
    broke: 'the step given sight of the style table, so a look becomes a difficulty',
    guard: 'THE BAN: nothing that decides an outcome may import the style table',
    edit: {
      path: 'src/app/frame.ts',
      find: "import { SHOTS } from '../content/shots.ts';",
      replace: "import { SHOTS } from '../content/shots.ts';\nimport { STYLES } from '../content/styles.ts';\nvoid STYLES;",
    },
  },
  {
    decision: '0070',
    suite: 'tests/style.test.ts',
    // The identity guard the shell leans on. Rebuild the slice on every dispatch and `applyStyle`
    // runs on presses that changed nothing — which touches the DOM, and which nothing on screen
    // would ever show.
    broke: 'the slice rebuilt on a press that changed nothing, so the chooser repaints for free',
    guard: 'preserves identity when nothing moved, which is what stops a re-paint per press',
    edit: {
      path: 'src/state/slices/settings.ts',
      // ⚠️ Re-anchored when the slice gained a second field — decision 0072. The identity rule is
      // unchanged; what moved is that preserving the OTHER setting now needs a spread.
      find: '      return state.style === action.style ? state : { ...state, style: action.style };',
      replace: '      return { ...state, style: action.style };',
    },
  },
  {
    decision: '0070',
    suite: 'tests/style.test.ts',
    /*
      ⚠️ THE LIFETIME, which is the whole reason this is a slice of its own. A setting folded into
      the run slice reads as tidy — the difficulty tier is there — and then `begin` eats the
      player's choice every time they press a difficulty. This is that, by the shortest route.
    */
    broke: 'the settings thrown away by a run action, which is what living on the run means',
    guard: 'is untouched by a run, which is the whole reason it is not on one',
    edit: {
      path: 'src/state/root.ts',
      find: '  return agree(run === state.run ? state : { screen: state.screen, run, settings: state.settings });',
      replace: '  return agree(run === state.run ? state : { screen: state.screen, run, settings: initialSettings });',
    },
  },
  {
    decision: '0070',
    suite: 'tests/style.browser.test.ts',
    /*
      ⚠️ THE REPORTED ONE, and it is the half no unit test can reach. The setting dispatches, the
      slice moves, the chooser marks the right button — and the sky stays on the screen, because the
      one line that turns it into a picture is missing. Five things have to happen and this breaks
      the last of them.
    */
    broke: 'the style never reaching the world, so retro dispatches perfectly and draws the sky anyway',
    guard: 'THE REPORTED ONE: retro is the game before the sky, and the sky actually goes',
    edit: {
      path: 'src/app/mount.ts',
      find: '    world.sky = row.sky ? SKY : NO_SKY;',
      replace: '    world.sky = SKY;',
    },
  },
  {
    decision: '0070',
    suite: 'tests/style.browser.test.ts',
    // The UI half. The ask names it — *"Retro UI / Modern UI"* — and a style that moved only the
    // background would be a sky toggle with a misleading name.
    broke: 'the chrome left on one face, so only the background changes',
    guard: 'and the UI half of it lands too, which is what "Retro UI" means',
    edit: { path: 'src/app/mount.ts', find: '    chrome.setFace(row.face);', replace: "    chrome.setFace('clean');" },
  },
  {
    decision: '0070',
    suite: 'tests/style.browser.test.ts',
    // Which option is on, said in colour alone. 0024 puts that in the unconditional tier, and a
    // chooser is where it is most tempting: an opacity change looks like enough on a bright monitor.
    broke: 'the live option told apart by opacity rather than by fill',
    guard: 'and the chooser says which one is on, in fill rather than in colour alone',
    edit: {
      path: 'src/app/chrome.ts',
      find: '.itc-title-option-on {\n  background: var(--itc-ink);\n  color: var(--itc-void);\n  opacity: 1;\n}',
      replace: '.itc-title-option-on {\n  opacity: 1;\n}',
    },
  },
];
