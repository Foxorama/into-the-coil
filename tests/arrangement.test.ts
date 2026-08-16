/**
 * The arrangement is complete, and exactly one thing is followed at a time.
 *
 * `docs/decisions/0154-the-mix-is-authored-as-intent.md`.
 *
 * ⚠️ **THESE ARE THE INVARIANTS THE SOLVE CANNOT DISCOVER FOR ITSELF.** A damped fixed point over an
 * over-determined system does not throw — it converges to something wrong and reports a small error,
 * which is exactly what happened when two layers were both `part`: four hundred iterations and a set
 * of margins that looked like a rounding problem. **The contradiction has to be refused in the table,
 * not in the solver.**
 */

import { describe, expect, it } from 'vitest';

import {
  ARRANGEMENT,
  MUSIC_ROLES,
  PROMOTES,
  ROLE_MARGIN_DB,
  TITLE_ARRANGEMENT,
  roleOf,
  SOLVED_BY,
} from '../src/content/arrangement.ts';
import { MUSIC_LADDER, MUSIC_LAYERS, MUSIC_LEVELS, type MusicLevel } from '../src/content/music.ts';
import { THEME_KINDS } from '../src/content/themes.ts';

describe('0154 — the mix is authored as intent', () => {
  it('THE ONE THAT CANNOT BE RECOVERED FROM: exactly one layer is followed at a rung', () => {
    /*
      ⚠️ **`part` MEANS *louder than everything else together*, AND TWO OF THOSE IS ARITHMETIC THAT HAS
      NO ANSWER.** The solver will not say so — it converges to a compromise and reports a plausible
      error — so the first version of this table shipped three parts at one rung and looked like a
      tuning problem for an hour.
    */
    for (const [rung, roles] of Object.entries(ARRANGEMENT)) {
      expect(roles.part.length, `${rung} names ${roles.part.length} layers as the part`).toBe(1);
    }
    expect(TITLE_ARRANGEMENT.part.length, 'the title names no single part').toBe(1);
  });

  it('names every layer the rung actually sounds, exactly once', () => {
    /*
      ⚠️ **A LAYER LEFT OUT IS A LAYER WITH NO INTENTION**, which the solve then leaves at whatever
      gain it started from — silently, and looking like a mix decision. The ladder is the authority on
      what sounds; this table is the authority on what it is for; and the two have to agree or one of
      them is lying.
    */
    for (const rung of MUSIC_LEVELS) {
      const roles = rung === 'calm' ? TITLE_ARRANGEMENT : ARRANGEMENT[rung === 'bossPeak' ? 'boss' : rung];
      if (roles === undefined) continue;
      const named = MUSIC_ROLES.flatMap((r) => roles[r]);
      expect(new Set(named).size, `${rung} names a layer twice`).toBe(named.length);

      const sounds = MUSIC_LAYERS.filter((l) => MUSIC_LADDER[rung][l] > 0 && SOLVED_BY(l));
      for (const layer of sounds) {
        expect(named, `${rung} sounds ${layer} and the arrangement does not say what it is for`).toContain(layer);
      }
      for (const layer of named) {
        expect(
          MUSIC_LADDER[rung][layer],
          `the arrangement gives ${layer} a role at ${rung} and the ladder never opens it there`,
        ).toBeGreaterThan(0);
      }
    }
  });

  it('and the aura is not in it, because its gain is a distance', () => {
    /*
      ⚠️ **0091 and 0107.** A target margin for the aura would be a claim about a quantity the mix does
      not own — the player steers it by how far in they push. The solve written without this exclusion
      spent its whole iteration ceiling failing to out-shout a boss that was not on the field yet.
    */
    for (const rung of MUSIC_LEVELS) {
      const roles = rung === 'calm' ? TITLE_ARRANGEMENT : ARRANGEMENT[rung === 'bossPeak' ? 'boss' : rung];
      if (roles === undefined) continue;
      const named = MUSIC_ROLES.flatMap((r) => roles[r]);
      expect(named, `${rung} gives auraSlow a role`).not.toContain('auraSlow');
      expect(named, `${rung} gives auraFast a role`).not.toContain('auraFast');
    }
  });

  it('THE PLACES DIFFER, and none of them appoints a second part', () => {
    for (const theme of THEME_KINDS) {
      for (const [layer, role] of Object.entries(PROMOTES[theme])) {
        expect(role, `${theme} promotes ${layer} to part, and a rung has only one`).not.toBe('part');
      }
    }
    /*
      ⚠️ **AND A PROMOTION HAS TO ACTUALLY LIFT SOMETHING**, or it is a line of documentation
      pretending to be a mix decision. Every entry must raise the layer at some rung it sounds at.
    */
    for (const theme of THEME_KINDS) {
      for (const layer of Object.keys(PROMOTES[theme]) as (keyof typeof PROMOTES[typeof theme])[]) {
        const lifts = MUSIC_LEVELS.some((rung: MusicLevel) => {
          const base = roleOf(undefined, rung, layer);
          const with_ = roleOf(theme, rung, layer);
          return base !== null && with_ !== null && MUSIC_ROLES.indexOf(with_) > MUSIC_ROLES.indexOf(base);
        });
        expect(lifts, `${theme} promotes ${layer} and it changes nothing at any rung`).toBe(true);
      }
    }
  });

  it('and the targets are ordered, because a role that is not above the one below it is not a role', () => {
    /*
      ⚠️ **THE SPACING IS WHAT THE SOLVE HOLDS** — an anchor shifts the whole set when the aura is loud,
      and `solve-mix.mjs` has why that is correct rather than a failure. What must be true is the
      ORDER: a part over a counter-line over a pulse over a bed over air.
    */
    const ordered = [...MUSIC_ROLES];
    for (let i = 1; i < ordered.length; i++) {
      expect(
        ROLE_MARGIN_DB[ordered[i]!],
        `${ordered[i]} does not sit above ${ordered[i - 1]}, so the ladder has a flat step`,
      ).toBeGreaterThan(ROLE_MARGIN_DB[ordered[i - 1]!]);
    }
  });
});
