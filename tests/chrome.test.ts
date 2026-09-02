import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

import { STYLE, prefixFor } from '../src/app/chrome.ts';
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
/*
  ⚠️ **IT TAKES THE STYLESHEET, NOT THE SOURCE — 0210.** This used to regex `const STYLE = \`…\`` out
  of the file, which worked while every selector was spelled out. The moment one was interpolated, a
  source scan started reading the template hole instead of the classes, and **this guard would have
  gone on passing over a stylesheet it could no longer see** — weaker, silently, with nothing red.

  `chrome.ts` exports the evaluated string for exactly this. A guard that reads source cannot follow
  a template.
*/
function classesInStyle(style: string): string[] {
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

/**
 * Every way the stylesheet's comments fail to be comments, described.
 *
 * ⚠️ **A walk rather than two counts**, because equal numbers of openers and closers is not the same
 * claim — a closer followed by an opener balances and is entirely broken. The walk answers the
 * question the CSS parser actually asks, which is *am I inside a comment right now*.
 */
function commentFaults(style: string): string[] {
  const out: string[] = [];
  let at = 0;
  let open = -1;
  while (at < style.length) {
    if (open < 0) {
      const next = style.indexOf('/*', at);
      const stray = style.indexOf('*/', at);
      if (stray >= 0 && (next < 0 || stray < next)) {
        out.push(`a comment closes at index ${stray} that nothing opened`);
        at = stray + 2;
        continue;
      }
      if (next < 0) break;
      open = next;
      at = next + 2;
    } else {
      const close = style.indexOf('*/', at);
      if (close < 0) {
        out.push(`a comment opens at index ${open} and never closes`);
        break;
      }
      open = -1;
      at = close + 2;
    }
  }
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
    const strays = [...classesInStyle(STYLE), ...literalClasses(source)].filter((c) => !isNamespaced(c));
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
    const styled = classesInStyle(STYLE);
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
    expect(classesInStyle(STYLE).length, 'the stylesheet scan found no classes — the pattern is broken').toBeGreaterThan(
      4,
    );
    expect(classesInStyle('\n.hud { color: red; }\n.itc-title-heading { margin: 0; }\n')).toEqual([
      'hud',
      'itc-title-heading',
    ]);
    expect(literalClasses("el.className = 'hud';")).toEqual(['hud']);
    expect(literalClasses("el.classList.toggle('itc-title-shown', true);")).toEqual(['itc-title-shown']);
    expect(literalClasses('el.className = prefix + "heading";'), 'a built name is not a literal').toEqual([]);
  });

  /**
   * ⚠️ THE ONE THAT TYPECHECKS, LINTS, BUILDS AND IS STILL BROKEN.
   *
   * The stylesheet is a template literal, so a mangled comment inside it is not a syntax error in
   * TypeScript — it is a valid string with rubbish in it, and the CSS parser silently discards from
   * the rubbish to the next thing it can recover at. **The rules it eats on the way are gone.**
   *
   * Twice now at the same spot, both times while resolving a conflict where two branches appended to
   * the end of `STYLE`: once the whole tap-strip block was dropped, and once its opening `/*` was,
   * which fed seventeen lines of prose to the parser and took `.itc-playing-strip`'s `display: none`
   * and `pointer-events: none` down with it — a strip drawn on every desktop, swallowing the taps it
   * exists to advertise. `docs/decisions/0063-a-level-break-is-a-respite.md` has the incident.
   *
   * Three browser tests caught it, at seconds apiece and only because they happened to exist. This
   * catches the whole class in a string scan, which is what it deserves.
   */
  it('every comment in the stylesheet is opened and closed, so no rule can be eaten by prose', () => {
    expect(commentFaults(STYLE), 'the stylesheet has a comment the CSS parser will not survive').toEqual([]);
  });

  it('the comment scan finds the two ways a stylesheet comment breaks', () => {
    // Decision 0005, aimed at the guard: run it over the exact damage rather than trusting the shape.
    const wrap = (css: string): string => 'const STYLE = `\n' + css + '\n`;';
    expect(commentFaults(wrap('/* fine */\n.a { color: red; }')), 'a healthy sheet was called broken').toEqual([]);
    expect(commentFaults(wrap('/* opened\n.a { color: red; }')).length, 'an unclosed comment passed').toBe(1);
    expect(commentFaults(wrap('.a { color: red; }\nprose */\n.b { color: red; }')).length, 'a lost opener passed').toBe(
      1,
    );
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

  it('0210 — every screen with a panel is styled, or it mounts INVISIBLE and nothing fails', () => {
    /*
      ⚠️ **THIS IS THE DEFECT 0210 HIT, AND IT REPORTED SUCCESS THE WHOLE TIME.** The stylesheet named
      its four screens explicitly, in eight separate selector lists. Adding a fifth produced a screen
      that routed correctly, mounted correctly, set its own `-shown` class, and **drew nothing** —
      because `display: none` is the default and the rule that lifts it did not name it. The console
      was clean, the DOM said the screen was shown, and the player saw an empty page.

      ⚠️ **NO TEST COULD HAVE CAUGHT IT AND NONE DID.** `tests/chrome.test.ts` held the prefix rule,
      which was satisfied; the browser tests drive the screens that existed. What was missing is the
      only thing that matters here: **is there a rule that makes this screen visible.**

      `docs/decisions/0192-a-guard-holds-an-invariant.md`: a panelled screen with no `-shown` rule is
      never correct, at any styling.
    */
    const styled = STYLE;
    for (const screen of SCREEN_KINDS) {
      const row = SCREENS[screen];
      if (row.heading === '' && row.actions.length === 0) continue; // `playing` IS the game.
      expect(
        styled.includes(`.${prefixFor(screen)}shown`),
        `${screen} draws a panel and the stylesheet has no .${prefixFor(screen)}shown rule — it will ` +
          'mount, report itself shown, and be invisible, which is exactly what 0210 shipped into',
      ).toBe(true);
    }
  });
});
