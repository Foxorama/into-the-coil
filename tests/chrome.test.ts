import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

import { prefixFor } from '../src/app/chrome.ts';
import { SCREENS, SCREEN_KINDS, type Screen } from '../src/state/screens.ts';

/**
 * EVERY SCREEN'S CHROME OWNS ITS CLASS PREFIX.
 *
 * `docs/decisions/0017-the-state-is-slices.md` deferred this rule and named the trigger precisely:
 * it lands *"in the same commit as the first screen's chrome, when there is real usage to prove the
 * extraction against"*. `src/app/chrome.ts` is that first chrome, and this is the rule.
 *
 * ── WHY THE RULE ────────────────────────────────────────────────────────────────────────────────
 *
 * CSS class names and DOM ids are GLOBAL, and the modules that write them cannot see each other. The
 * predecessor took a real regression from `.gs-hud` being shared between two different HUDs — one
 * screen restyled the other by existing — and its own constitution cites the incident twice. Nothing
 * in the type system has an opinion about a string that ends up in a `class` attribute.
 *
 * On this project it is worse than it was there, for a reason
 * `docs/decisions/0003-single-file-build.md` creates: the build emits ONE page, so every stylesheet
 * in the game is concatenated into one document. There is no file boundary left to hide behind.
 *
 * ── AND WHY IT WAS HELD BACK UNTIL THERE WAS CHROME TO SCAN ─────────────────────────────────────
 *
 * A scan for class names has to know how the code writes them — an attribute, a `classList` call, a
 * helper — and guessing that shape before any existed would have produced a guard proved only
 * against its own fixture, which is the failure `docs/decisions/0005-a-guard-must-be-seen-to-fail.md`
 * describes. Both extractors below run over the real file and find real classes.
 */

const root = fileURLToPath(new URL('..', import.meta.url));
const CHROME = 'src/app/chrome.ts';
const source = readFileSync(resolve(root, CHROME), 'utf8');

/**
 * Every class named by a selector in the stylesheet.
 *
 * This is the half that matters most: CSS is where a name becomes global. A selector is `.name`, and
 * the pattern deliberately does not try to parse CSS — it looks for the one token that makes a class
 * a class.
 */
function classesInStyle(src: string): string[] {
  const style = /const STYLE = `([\s\S]*?)`;/.exec(src)?.[1] ?? '';
  return [...new Set([...style.matchAll(/\.([A-Za-z][\w-]*)/g)].map((m) => m[1]!))];
}

/**
 * Every class name written as a bare string literal into a `class` attribute.
 *
 * ⚠️ **Finds nothing in `chrome.ts` today, and that is the intended state rather than a vacuous
 * scan.** Every class there is built from `prefixFor`, so there is no literal to find — the guard
 * exists to catch the next one, written the obvious way by someone who has not read this file. It is
 * proved against a sample below for exactly that reason.
 */
function literalClasses(src: string): string[] {
  const out: string[] = [];
  for (const m of src.matchAll(/\bclassName\s*=\s*['"]([^'"]*)['"]/g)) out.push(m[1]!);
  for (const m of src.matchAll(/\bclassList\s*\.\s*(?:add|toggle|remove)\s*\(\s*['"]([^'"]*)['"]/g)) out.push(m[1]!);
  return out;
}

/** Whether a class belongs to some screen — its prefix, or the prefix without its trailing dash. */
function isNamespaced(name: string): boolean {
  // The real function, not a restatement of it. `docs/decisions/0017-…` records what it cost to
  // write a rule out twice: the proof tested a copy and would have passed after the original broke.
  return SCREEN_KINDS.some((screen) => name === prefixFor(screen).slice(0, -1) || name.startsWith(prefixFor(screen)));
}

describe('every screen owns its class prefix', () => {
  it("every screen's chrome namespaces its classes", () => {
    const strays = [...classesInStyle(source), ...literalClasses(source)].filter((c) => !isNamespaced(c));
    expect(
      strays,
      `these class names are not namespaced to a screen: ${strays.join(', ')}\n` +
        'A class name is global and the build puts every stylesheet in one document (0003), so an ' +
        'unprefixed name is a collision waiting for the second screen that likes the same word. ' +
        'Build it from `prefixFor(screen)` — never as a literal.',
    ).toEqual([]);
  });

  it('every screen that has chrome to draw has styles for it', () => {
    // The failure this catches: a screen added to `SCREENS` with a heading and no stylesheet, which
    // renders as unstyled text in the top-left corner and looks like a broken build rather than a
    // missing rule.
    const styled = classesInStyle(source);
    const missing = SCREEN_KINDS.filter((screen) => {
      const row = SCREENS[screen];
      if (row.heading.length === 0 && row.actions.length === 0) return false;
      return !styled.some((c) => c.startsWith(prefixFor(screen).slice(0, -1)));
    });
    expect(missing, `these screens draw chrome that nothing styles: ${missing.join(', ')}`).toEqual([]);
  });

  it('a screen with nothing to say draws no chrome, so the two lists cannot drift', () => {
    // `playing` is the case: the game IS the screen. If it ever gained a heading this would stop
    // being true, and the row above would then require styles for it — which is the correct chain.
    expect(SCREENS.playing.heading, 'the playing screen has chrome over the game').toBe('');
    expect(SCREENS.playing.actions, 'the playing screen has a control over the game').toEqual([]);
  });

  /**
   * ⚠️ THE ASSERTIONS THAT KEEP THE SCANS ABOVE FROM BEING DECORATIVE.
   *
   * Decision 0005, aimed at the guard rather than at the code. The file is written to pass, so both
   * extractors run over prose that agrees with them; these run them over the thing they exist to
   * catch, so a typo'd pattern fails HERE rather than in six months.
   */
  it('the extractors find what they claim to find', () => {
    expect(classesInStyle(source).length, 'the stylesheet scan found no classes — the pattern is broken').toBeGreaterThan(
      4,
    );
    expect(classesInStyle('const STYLE = `\n.hud { color: red; }\n.itc-title-heading { margin: 0; }\n`;')).toEqual([
      'hud',
      'itc-title-heading',
    ]);
    expect(literalClasses("el.className = 'hud';")).toEqual(['hud']);
    expect(literalClasses("el.classList.toggle('itc-title-shown', true);")).toEqual(['itc-title-shown']);
    expect(literalClasses('el.className = prefix + "heading";'), 'a built name is not a literal').toEqual([]);
  });

  it('the namespace rule accepts a screen prefix and refuses everything else', () => {
    expect(isNamespaced('itc-title')).toBe(true);
    expect(isNamespaced('itc-title-heading')).toBe(true);
    expect(isNamespaced('itc-gameover-action')).toBe(true);
    expect(isNamespaced('hud'), 'an unprefixed class passed the rule').toBe(false);
    // The near-miss that matters: the project's own prefix without a screen behind it. Two screens
    // both reaching for `itc-heading` is the exact collision this rule exists to prevent.
    expect(isNamespaced('itc-heading'), 'a project-prefixed class with no screen passed').toBe(false);
  });

  it('a prefix is lowercase, so a camelCase screen name does not reach the stylesheet', () => {
    const gameOver: Screen = 'gameOver';
    expect(prefixFor(gameOver)).toBe('itc-gameover-');
    expect(prefixFor('title')).toBe('itc-title-');
  });
});
