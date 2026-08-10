import { describe, expect, it } from 'vitest';

import { MIX_CEILING, MIX_FLOOR, THEMES, THEME_KINDS, mixOf, type ThemeKind } from '../src/content/themes.ts';
import { LEVELS, LEVEL_KINDS } from '../src/content/levels.ts';
import { MUSIC_LADDER, MUSIC_LAYERS, MUSIC_LEVELS, MUSIC_GAIN, MUSIC_DRIVE } from '../src/content/music.ts';
import { PALETTES, type PaletteName } from '../src/content/palette.ts';
import { bakeLoops } from '../src/app/music.ts';
import { SAMPLE_RATE, saturate } from '../src/app/sound.ts';
import { contrast } from './contrast.ts';

/**
 * A LEVEL IS A PLACE — `docs/decisions/0107-a-level-is-a-place.md`.
 *
 * Reported from play: *"the same music and boss music repeats level after level after level… I think
 * we're close to the part where we need to introduce the biomes and level themes now to start
 * differentiating levels."*
 *
 * ⚠️ **The two things a theme could break are the accessibility floor and the mix**, and both are
 * held here rather than trusted to a hand: a backdrop is a colour eight other inks have to be legible
 * against, and a mix multiplier spends headroom `tests/music.test.ts` measures.
 */

describe('every level is somewhere, and no two of the seven are the same place', () => {
  it('THE REPORTED ONE: every level names a theme, and the run does not repeat one', () => {
    /*
      ⚠️ **The report is that the levels are indistinguishable, so the thing to hold is that they
      DIFFER** — a table where six levels named the same theme would satisfy every other assertion
      here and be the reported defect with a new field on it.

      ⚠️ **Seven levels and seven themes is not required for ever.** What is required is that a run
      does not play one place twice, which is what a player would notice; the day an eighth level
      shares level three's theme, this fails and the decision to allow it gets made rather than
      happening.
    */
    const used = LEVEL_KINDS.map((kind) => LEVELS[kind].theme);
    expect(new Set(used).size, `the run visits ${new Set(used).size} places across ${used.length} levels`).toBe(
      used.length,
    );
    // And nothing in the table is dead weight — a theme nobody visits is content that cannot be judged.
    for (const theme of THEME_KINDS) {
      expect(used, `the ${theme} theme is authored and no level uses it`).toContain(theme);
    }
  });

  it('and every backdrop keeps every ink legible, in every palette', () => {
    /*
      ⚠️ **THE ACCESSIBILITY FLOOR, AND IT IS THE ONE THING A THEME COULD QUIETLY DESTROY** —
      `docs/decisions/0024-the-accessibility-floor-is-settings.md`. The palette is a SETTING a player
      chose; a theme is a cosmetic the level chose. If a theme's backdrop can make a bullet hard to
      see, then a level has silently overridden an accessibility choice — which 0024 bans outright.

      ⚠️ **Every ink, every palette, every theme**, which is the whole cross-product because the
      failure is a single cell of it. `tests/palette.test.ts` holds the same floors against each
      palette's own `space`; this holds them against every backdrop a level can put underneath.

      ⚠️ **`sky` is exempt and is exempt in the other file too**, because it is the one ink that must
      NOT stand out — `src/content/palette.ts` has the argument.
    */
    for (const theme of THEME_KINDS) {
      for (const name of Object.keys(PALETTES) as PaletteName[]) {
        const backdrop = THEMES[theme].space[name];
        for (const [ink, colour] of Object.entries(PALETTES[name])) {
          if (ink === 'space' || ink === 'sky') continue;
          const ratio = contrast(colour, backdrop);
          expect(
            ratio,
            `${ink} sits at ${ratio.toFixed(2)}:1 on ${theme}'s ${name} backdrop, which is below the floor`,
          ).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  });

  it('and a backdrop is a dark, because the void is what everything is found against', () => {
    /*
      ⚠️ **The contrast floor above is necessary and not sufficient.** A bright backdrop could clear it
      by luminance and still be a level played on a wall of colour — the sky ink would vanish into it,
      and `docs/decisions/0065-the-sky-is-baked-and-blitted.md`'s starfield is drawn to sit just above
      the void rather than to be legible on anything.

      ⚠️ **Held against the palette's OWN space rather than an absolute**, so a palette that chose a
      lighter void is not fought by this — what a theme may do is move the HUE of the dark, not the
      dark itself.
    */
    for (const theme of THEME_KINDS) {
      for (const name of Object.keys(PALETTES) as PaletteName[]) {
        const backdrop = THEMES[theme].space[name];
        const own = PALETTES[name].space;
        const ratio = contrast(backdrop, own);
        expect(
          ratio,
          `${theme}'s ${name} backdrop is ${ratio.toFixed(2)}:1 against the palette's own void, which is a different room`,
        ).toBeLessThan(2);
      }
    }
  });
});

describe('a theme mixes the music and cannot break it', () => {
  it('keeps every multiplier inside the band the mix can pay for', () => {
    /*
      ⚠️ **A floor as well as a ceiling, and the floor is the one that is easy to miss.** A multiplier
      of zero would CLOSE a layer the ladder had opened — which breaks 0090's *the ladder only ever
      opens layers* and 0102's *every rung adds something* from a table whose subject is colour, and
      neither of those guards reads this file.
    */
    for (const theme of THEME_KINDS) {
      for (const [layer, value] of Object.entries(THEMES[theme].mix)) {
        expect(value, `${theme} scales ${layer} to ${value}, which is outside the band`).toBeGreaterThanOrEqual(
          MIX_FLOOR,
        );
        expect(value, `${theme} scales ${layer} to ${value}, which is outside the band`).toBeLessThanOrEqual(
          MIX_CEILING,
        );
      }
    }
  });

  it('and no theme at any rung drives the bus past full scale', () => {
    /*
      ⚠️ **THE ONE A THEME COULD ACTUALLY BREAK.** `MUSIC_GAIN` sits under a peak measured over the
      LADDER (0092, 0104); a theme is a multiplier on top of that, so a place that leaned on four
      layers at once could clip a mix every existing guard says is fine. Driven through the same
      shaper the bus runs, at every theme and every rung.
    */
    const loops = bakeLoops(SAMPLE_RATE);
    const longest = Math.max(...MUSIC_LAYERS.map((l) => loops[l].length));
    for (const theme of THEME_KINDS) {
      for (const level of MUSIC_LEVELS) {
        let peak = 0;
        for (let i = 0; i < longest; i++) {
          let sum = 0;
          for (const layer of MUSIC_LAYERS) {
            const gain = MUSIC_LADDER[level][layer] * mixOf(theme, layer);
            if (gain !== 0) sum += loops[layer][i % loops[layer].length]! * gain;
          }
          peak = Math.max(peak, Math.abs(saturate(sum * MUSIC_GAIN, MUSIC_DRIVE)));
        }
        expect(peak, `${theme} at ${level} peaks at ${peak.toFixed(3)} of full scale`).toBeLessThanOrEqual(1);
      }
    }
  }, 60_000);

  it('and every theme actually sounds different from the one that changes nothing', () => {
    /*
      ⚠️ **A table of empty mixes would pass everything above it**, and would be the reported defect
      with a new file in front of it. `approach` is the deliberate identity — it is what the game
      sounded like before this decision, so that the six below are read against something — and every
      other theme has to move at least two layers by an amount an ear can find.

      ⚠️ **Two layers rather than one, and a tenth rather than any change at all.** One layer nudged
      by a percent is a table that technically differs; what makes a place a place is that the balance
      of the piece has moved.
    */
    for (const theme of THEME_KINDS) {
      const moved = MUSIC_LAYERS.filter((layer) => Math.abs(mixOf(theme, layer) - 1) >= 0.1);
      if (theme === 'approach') {
        expect(moved.length, 'the neutral theme stopped being neutral, so nothing is read against it').toBe(0);
        continue;
      }
      expect(moved.length, `${theme} moves ${moved.length} layers, which is not a different place`).toBeGreaterThan(1);
    }
  });

  it('and the clamp agrees with the guard, so a bad row cannot merely be quietly fixed', () => {
    /*
      ⚠️ **`mixOf` clamps and this file refuses**, and the pair is deliberate: the clamp is what stops
      a typo clipping the bus in a build, and the assertion is what tells somebody. A clamp alone would
      make a wrong number invisible for ever, which is the shape
      `docs/decisions/0019-a-probe-must-be-seen-to-apply.md` is about.
    */
    expect(mixOf('approach' as ThemeKind, 'drone'), 'an unstated layer is not left alone').toBe(1);
    for (const theme of THEME_KINDS) {
      for (const layer of MUSIC_LAYERS) {
        const value = mixOf(theme, layer);
        expect(value, `${theme}/${layer} resolved outside the band the clamp promises`).toBeGreaterThanOrEqual(
          MIX_FLOOR,
        );
        expect(value, `${theme}/${layer} resolved outside the band the clamp promises`).toBeLessThanOrEqual(
          MIX_CEILING,
        );
      }
    }
  });
});
