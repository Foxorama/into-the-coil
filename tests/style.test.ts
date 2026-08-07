import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

import { DEFAULT_STYLE, STYLES, STYLE_KINDS } from '../src/content/styles.ts';
import { SCREENS } from '../src/state/screens.ts';
import { initialState, reduce, type Action } from '../src/state/root.ts';

/**
 * A STYLE IS A SETTING, AND IT MAY NOT REACH THE GAME.
 *
 * `docs/decisions/0070-a-style-is-a-setting-and-the-first-one.md`. Asked for after the sky landed:
 * *"the pre-sky game was a really fun retro-sprite style game, can we add that in as our first
 * setting? Retro UI / Modern UI."*
 *
 * ⚠️ **The load-bearing test here is the first one, and it is a scan rather than an assertion about
 * values.** `src/sim/assist.ts` states the rule — *"a player who turns the flashing down must not
 * thereby be playing an easier game"* — and the only way a cosmetic setting breaks it is by being
 * READ somewhere it should not be. So the guard is over the import graph, which is a fact, rather
 * than over anybody's intention, which is not.
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

describe('a style cannot change the game, only what it looks like', () => {
  /**
   * ⚠️ **`src/app/frame.ts` is on this list and it is the interesting one.** `sim/` obviously must
   * not know about a style; the frame is where somebody would actually reach for one, because it is
   * the file that already knows about sprites — and it is also the file that decides what hits what.
   */
  const FORBIDDEN = [...filesUnder('src/sim'), 'src/app/frame.ts', 'src/app/boss.ts'];

  it('finds the files it is scanning, so it cannot pass by scanning nothing', () => {
    expect(FORBIDDEN.length, 'the scan found no simulation files — the walk is broken').toBeGreaterThan(5);
    for (const file of FORBIDDEN) {
      expect(readFileSync(resolve(root, file), 'utf8').length, `${file} is empty or missing`).toBeGreaterThan(0);
    }
  });

  it('THE BAN: nothing that decides an outcome may import the style table', () => {
    /*
      The failure this rules out is not a bug, it is a design drift: a style with a `hitboxes: 'fat'`
      or a `warnings: 'off'` field, read by the step, and a player who picked a look finding they
      picked a difficulty. `docs/decisions/0024-the-accessibility-floor-is-settings.md` closes that
      door for assists by making every knob monotone; a cosmetic setting cannot be monotone, so the
      door has to be closed by keeping it out of the room.
    */
    const offenders = FORBIDDEN.filter((file) => readFileSync(resolve(root, file), 'utf8').includes('styles.ts'));
    expect(
      offenders,
      `these decide what happens and can see the style table: ${offenders.join(', ')}\n` +
        'A style is presentation. The moment the simulation can read one, choosing a look is ' +
        'choosing a difficulty, and no test can tell the two apart afterwards.',
    ).toEqual([]);
  });

  it('and the sky is a list the painter walks, not a flag it branches on', () => {
    /*
      ⚠️ **This is what makes the ban above true by construction rather than by discipline.** Retro
      is `World.sky` set to the empty list, so `src/render/scene.ts` needs no branch and nothing
      below the shell learns that a style exists. A painter that asked *which style is this* would be
      a second place the answer lives.
    */
    const painter = readFileSync(resolve(root, 'src/render/scene.ts'), 'utf8');
    expect(painter.includes('styles.ts'), 'the painter reads the style table').toBe(false);
    expect(painter.includes('STYLES'), 'the painter branches on a style').toBe(false);
  });
});

describe('the chooser is the table', () => {
  it('offers exactly the styles that exist, in the table’s order', () => {
    /*
      Walked rather than listed, so a style added to `src/content/styles.ts` appears on the title
      screen without anybody remembering to come and add it — the same argument the difficulty tiers
      and the pickup key both make.
    */
    const choice = SCREENS.title.choices.find((c) => c.name === 'style');
    expect(choice, 'the title screen offers no style at all').toBeDefined();
    expect(choice!.options.map((o) => o.label)).toEqual(STYLE_KINDS.map((kind) => STYLES[kind].title));
  });

  it('and every style says what it is, because nothing else on the screen will', () => {
    // `docs/game.md`'s voice rule cuts both ways: no commentary, and no unexplained switch either.
    for (const kind of STYLE_KINDS) {
      expect(STYLES[kind].title.length, `${kind} has no name`).toBeGreaterThan(0);
      expect(STYLES[kind].hint.length, `${kind} does not say what it does`).toBeGreaterThan(0);
    }
  });

  it('no other screen offers a setting, so the title is the one place to look', () => {
    for (const [name, row] of Object.entries(SCREENS)) {
      if (name === 'title') continue;
      expect(row.choices, `${name} grew a setting without a decision`).toEqual([]);
    }
  });
});

describe('the settings slice', () => {
  const styleOf = (state: ReturnType<typeof reduce>): string => state.settings.style;
  const pick = (style: (typeof STYLE_KINDS)[number]): Action => ({ slice: 'settings', type: 'style', style });

  it('starts on the default, which is the game as it currently is', () => {
    // 0024: there is one game and it is the loud one. A default that quietly shipped the older look
    // would make every later art pass invisible until somebody found a menu.
    expect(styleOf(initialState)).toBe(DEFAULT_STYLE);
  });

  it('changes to any style in the table', () => {
    for (const kind of STYLE_KINDS) expect(styleOf(reduce(initialState, pick(kind)))).toBe(kind);
  });

  it('preserves identity when nothing moved, which is what stops a re-paint per press', () => {
    // `src/app/mount.ts` compares slices by reference to decide whether to touch the DOM. A reducer
    // that rebuilt the slice on every dispatch would repaint the chooser on every unrelated action.
    const state = reduce(initialState, pick(DEFAULT_STYLE));
    expect(state, 'choosing the style that was already on rebuilt the state').toBe(initialState);
  });

  it('is untouched by a run, which is the whole reason it is not on one', () => {
    /*
      ⚠️ **A setting outlives a run and `begin` is what would eat it.**
      `docs/decisions/0039-a-run-is-lives-and-a-death-costs-the-arsenal.md` puts the TIER on the run
      because a tier belongs to it; a style does not, and a field on the run slice would be reset
      every time somebody pressed a difficulty.
    */
    const chosen = reduce(initialState, pick(STYLE_KINDS[0]!));
    const played = reduce(
      reduce(chosen, { slice: 'run', type: 'begin', difficulty: 'savior' }),
      { slice: 'screen', type: 'show', screen: 'playing' },
    );
    expect(styleOf(played), 'starting a run reset the style').toBe(STYLE_KINDS[0]);
    expect(played.settings, 'a run rebuilt the settings slice').toBe(chosen.settings);
  });
});
