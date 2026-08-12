import { describe, expect, it } from 'vitest';

import {
  MIX_CEILING,
  MIX_FLOOR,
  THEMES,
  THEME_KINDS,
  mixOf,
  revoicedBy,
  voicesOf,
  type ThemeKind,
} from '../src/content/themes.ts';
import { LEVELS, LEVEL_KINDS } from '../src/content/levels.ts';
import {
  BEAT_SECONDS,
  MUSIC,
  MUSIC_LADDER,
  MUSIC_LAYERS,
  MUSIC_LEVELS,
  MUSIC_GAIN,
  type MusicLayer,
  MUSIC_DRIVE,
  secondsOfLayer,
} from '../src/content/music.ts';
import { SCALE } from '../src/content/cues.ts';
import { LAYER_PAN } from '../src/content/music.ts';
import { bakeLayer } from '../src/app/music.ts';
import { BANDS, bandEnergy } from './spectrum.ts';
import { rungShape } from './pace.ts';
import { PALETTES, type PaletteName } from '../src/content/palette.ts';
import { SAMPLE_RATE, saturate } from '../src/app/sound.ts';
import { loopsAt } from './bakes.ts';
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
    /*
      ⚠️ **EACH PLACE IS BAKED AS ITSELF, AND IT WAS NOT** — 0134. This took one bake with no theme in
      it and applied every theme's multipliers to **level one's samples**, so the only thing it exists
      to catch — a place whose own material clips — was the one thing it could not see. It ran green
      over the whole of 0132's composition without baking a note of it.

      ⚠️ **Six of the seven cost nothing**, because a place that states no voices bakes byte-identical
      audio and `loopsAt` caches on the name.
    */
    /*
      ⚠️ **THE GAINS ARE RESOLVED ONCE PER (THEME, RUNG) AND WERE RESOLVED ONCE PER SAMPLE** —
      `docs/decisions/0113-there-is-one-composition-and-seven-levels.md`. `mixOf` does a table lookup
      and a clamp; multiplied by seventeen layers, 1.2 million samples, seven themes and six rungs,
      that is about 878 million calls to compute 714 numbers. It ran inside the 60s budget while the
      phrase was eight bars and timed out the moment it became sixteen.

      ⚠️ **NOTHING ABOUT WHAT IS MEASURED CHANGES**, which is the only reason this is a hoist rather
      than a smaller assertion: the same samples, the same shaper, the same peak. A test made faster
      by measuring less would be the thing
      `docs/decisions/0027-measure-the-picture-not-the-model.md` is about, arriving in the guard.
    */
    /*
      ── AND THE SAMPLE IS READ ONCE FOR ALL SEVEN RUNGS, WHICH IS 0044 RATHER THAN A SAVING ────────

      ⚠️ **THIS GUARD PASSED ALONE AND TIMED OUT UNDER THE FULL SUITE**, which is
      `docs/decisions/0044-an-intermittent-guard-is-measuring-the-wrong-thing.md`'s own shape: a
      rerun is not evidence, and a guard that only fails when the machine is busy is a guard nobody
      can trust the green from. Baking a second composition (0134) is what pushed it over 60 s; the
      walk had been near the edge since the phrase doubled.

      ⚠️ **The buffers do not change between rungs and only the GAINS do.** Reading them per rung was
      seven passes of a modulo and a bounds-checked load over 1.2 million samples; reading them once
      and taking seven dot products is the same arithmetic with a seventh of the indexing.

      ⚠️ **NOTHING ABOUT WHAT IS MEASURED CHANGES** — the same samples, the same shaper, the same
      peak, and the same assertion per (theme, rung). A test made faster by measuring less would be
      `docs/decisions/0027-measure-the-picture-not-the-model.md` arriving inside the guard, which is
      the trap the hoist above already had to avoid once.
    */
    for (const theme of THEME_KINDS) {
      const loops = loopsAt(SAMPLE_RATE, theme);
      const buffers = MUSIC_LAYERS.map((layer) => loops[layer]);
      const longest = Math.max(...buffers.map((b) => b.length));
      const rungs = MUSIC_LEVELS.map((level) => ({
        level,
        gains: MUSIC_LAYERS.map((layer) => MUSIC_LADDER[level][layer] * mixOf(theme, layer)),
        peak: 0,
      }));
      // @setup: one scratch row of layer values, refilled per sample rather than allocated per sample.
      const now = new Float64Array(MUSIC_LAYERS.length);
      for (let i = 0; i < longest; i++) {
        for (let l = 0; l < buffers.length; l++) {
          const buffer = buffers[l]!;
          now[l] = buffer[i % buffer.length]!;
        }
        for (const rung of rungs) {
          let sum = 0;
          for (let l = 0; l < now.length; l++) sum += now[l]! * rung.gains[l]!;
          const shaped = Math.abs(saturate(sum * MUSIC_GAIN, MUSIC_DRIVE));
          if (shaped > rung.peak) rung.peak = shaped;
        }
      }
      for (const rung of rungs) {
        expect(
          rung.peak,
          `${theme} at ${rung.level} peaks at ${rung.peak.toFixed(3)} of full scale`,
        ).toBeLessThanOrEqual(1);
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

describe('0128 — a place plays its own material, and shares everything it does not', () => {
  /** Baking layers is real DSP, on the terms the shed test states. */
  const DSP_MS = 60_000;

  it('A PLACE THAT STATES NOTHING IS THE BASE COMPOSITION, and `voicesOf` hands back the same array', () => {
    /*
      ⚠️ **THE CLAIM THE WHOLE COST MODEL RESTS ON.** 0113's storage model was priced at 672 MB
      resident and ruled out; what makes seven places affordable is that a shared layer is the SAME
      array rather than an identical-looking one — `setLoops` compares by identity and does not even
      build an `AudioBuffer` for a layer that did not move. Identity, not deep equality, is therefore
      the thing to assert.
    */
    for (const theme of THEME_KINDS) {
      const own = revoicedBy(theme);
      for (const layer of MUSIC_LAYERS) {
        if (own.includes(layer)) continue;
        expect(voicesOf(theme, layer), `${theme} rebuilt ${layer} instead of sharing it`).toBe(MUSIC[layer]);
      }
    }
    for (const layer of MUSIC_LAYERS) {
      expect(voicesOf(undefined, layer), `no place at all should be the base composition`).toBe(MUSIC[layer]);
    }
  });

  it('AT LEAST ONE PLACE HAS MUSIC OF ITS OWN, or this whole mechanism is measuring nothing', () => {
    // 0113's floor, as a test rather than a sentence: a theme that shares every array has no music of
    // its own. If this ever goes red the seven levels are back to being one composition.
    const speaking = THEME_KINDS.filter((theme) => revoicedBy(theme).length > 0);
    expect(speaking.length, 'every place shares every layer — no theme states any material').toBeGreaterThan(0);
  });

  it(
    'AND WHAT IT STATES ACTUALLY SOUNDS DIFFERENT, while everything else is untouched',
    () => {
      /*
        ⚠️ **Driven off the BAKED audio rather than off the tables**, because the tables can differ in
        ways that produce identical samples — a re-ordered voice array, a re-typed accent of 1. What a
        place has to be is *audibly* another place, and the only honest test of that is the buffer.
      */
      for (const theme of THEME_KINDS) {
        const own = revoicedBy(theme);
        for (const layer of own) {
          const base = bakeLayer(layer, SAMPLE_RATE);
          const here = bakeLayer(layer, SAMPLE_RATE, theme);
          expect(here.length, `${theme}/${layer} changed the LENGTH of a layer, which breaks the phrase`).toBe(
            base.length,
          );
          let moved = 0;
          for (let i = 0; i < base.length; i++) if (Math.abs(base[i]! - here[i]!) > 1e-6) moved++;
          expect(
            moved,
            `${theme} claims to re-voice ${layer} and bakes the identical audio — the override says nothing`,
          ).toBeGreaterThan(0);
        }
        // And a layer it did not claim is byte-identical, which is what sharing MEANS.
        const untouched = MUSIC_LAYERS.filter((l) => !own.includes(l))[0]!;
        expect(bakeLayer(untouched, SAMPLE_RATE, theme)).toEqual(bakeLayer(untouched, SAMPLE_RATE));
      }
    },
    DSP_MS,
  );

  it('0095 STILL HOLDS OVER AN OVERRIDE: every pattern spans EXACTLY its own layer', () => {
    /*
      ⚠️ **The rule a theme is most likely to break, because it is authoring patterns by hand.** A
      pattern shorter than its layer is silence at the end of every loop; one longer has its tail
      silently dropped. `tests/music.test.ts` holds this over the base composition and an override is
      a second place the same mistake can be made.
    */
    for (const theme of THEME_KINDS) {
      for (const layer of revoicedBy(theme)) {
        for (const [i, voice] of voicesOf(theme, layer).entries()) {
          const spans = voice.steps.length * (BEAT_SECONDS / voice.perBeat);
          expect(
            spans,
            `${theme}/${layer} voice ${i} spans ${spans.toFixed(2)}s inside a ${secondsOfLayer(layer)}s layer — ` +
              (spans > secondsOfLayer(layer) ? 'its tail is silently dropped' : 'the rest of the layer is silence'),
          ).toBeCloseTo(secondsOfLayer(layer), 6);
        }
      }
    }
  });

  it('A RE-VOICED TUNE STAYS IN THE KEY, because the progression under it is still shared', () => {
    /*
      ⚠️ **THE LIMIT THAT MAKES THIS FIRST PLACE SAFE, AND IT IS THE FINDING OF 0128.** A theme may
      replace its melodies without replacing `chords`, and then the harmony under them is the base's.
      Every note therefore has to be a tone of A natural minor — `SCALE` — or the place is simply
      wrong over its own bed for three bars in four, which is
      `docs/decisions/0095-the-level-has-its-own-music.md`'s argument for closing the title's bass.

      ⚠️ **THE BOUND IS UNCHANGED AND THE REASON ABOVE NO LONGER COVERS EVERY PLACE** —
      `docs/decisions/0132-a-place-may-be-another-piece-entirely.md`. Ember Nebula re-voices `chords`
      as well, so nothing shared is underneath it and 0128's argument does not reach it. It stays in
      the key anyway, for a reason that reaches FURTHER: **the cues are in the key too**
      (`docs/decisions/0099-the-cues-are-in-the-key.md`), so a place in another key would put the
      player's own gun out of tune with the level for three minutes. A guard whose reason has been
      outgrown and whose bound is still right is worth saying so on rather than deleting.
    */
    for (const theme of THEME_KINDS) {
      for (const layer of revoicedBy(theme)) {
        for (const voice of voicesOf(theme, layer)) {
          if (!voice.pitched) continue;
          for (const step of voice.steps) {
            if (step === null || step === undefined) continue;
            const degree = ((step % 12) + 12) % 12;
            expect(
              SCALE.includes(degree),
              `${theme}/${layer} plays ${step}, which is not a tone of the key the shared chords are in`,
            ).toBe(true);
          }
        }
      }
    }
  });

  it(
    '0132 — A PLACE’S OWN MATERIAL IS HELD TO THE SAME BAND RULE AS THE BASE',
    () => {
      /*
        ⚠️ **A HOLE THAT WAS FOUND BY FALLING INTO IT.** `tests/music.test.ts` refuses a layer whose
        weight is under 130 Hz and which is placed off centre — a panned low end spends headroom on
        one side and arrives in a room as the same non-directional thump anyway (0118). That guard
        bakes `MUSIC` and only `MUSIC`, so it says nothing at all about a place's own voices, and
        `LAYER_PAN` is a property of the LAYER: a place cannot move a layer's position, only what it
        plays there.

        ⚠️ **Ember Nebula's first cathedral bell was 49% below 130 Hz at a pan of −0.5**, and every
        guard in the repository was green. `scripts/weigh-place.mjs` printed it, which is
        `docs/decisions/0027-measure-the-picture-not-the-model.md`'s instrument doing the job — and
        this is that measurement made permanent, because the next six places will each be authored by
        somebody who has not read this paragraph.
      */
      const SUB = BANDS.findIndex((b) => b[2] === 'sub');
      const LOW = BANDS.findIndex((b) => b[2] === 'low');
      let measured = 0;
      for (const theme of THEME_KINDS) {
        for (const layer of revoicedBy(theme)) {
          const bands = bandEnergy(bakeLayer(layer, SAMPLE_RATE, theme), SAMPLE_RATE);
          const total = bands.reduce((a, b) => a + b, 0);
          if (total <= 0) continue;
          measured++;
          const bottom = (bands[SUB]! + bands[LOW]!) / total;
          if (bottom < 0.4) continue;
          expect(
            Math.abs(LAYER_PAN[layer]),
            `${theme} re-voices ${layer} with ${(bottom * 100).toFixed(0)}% of its energy below 130Hz, ` +
              `and the layer sits at ${LAYER_PAN[layer]} — a place may change what a layer plays and not where it is`,
          ).toBe(0);
        }
      }
      expect(measured, 'no place states any material, so this asserted nothing').toBeGreaterThan(0);
    },
    DSP_MS,
  );

  it('and to the same LONGEST NOTE rule, which is the job the prewarm cannot split', () => {
    /*
      ⚠️ **`tests/sound.test.ts` holds this over `MUSIC` and a place is a second place to break it.**
      0102 splits the prewarm one NOTE at a time because `chords` measured 428 ms as a single job; a
      note is the atom, so a three-second one is three seconds nobody can spread. A choir is exactly
      the kind of material that reaches for a long note, and Ember Nebula's longest is 2.40 s.
    */
    for (const theme of THEME_KINDS) {
      for (const layer of revoicedBy(theme)) {
        for (const [i, voice] of voicesOf(theme, layer).entries()) {
          expect(
            voice.note.seconds,
            `${theme}/${layer} voice ${i} is ${voice.note.seconds.toFixed(2)}s of synthesis in one job`,
          ).toBeLessThan(3);
        }
      }
    }
  });

  /*
    ── 0134: A PLACE MAY BE ANOTHER PIECE AND MAY NOT BE A SLOWER ONE ─────────────────────────────

    Reported of Ember Nebula's first version: *"it's pretty cool, but it doesn't fit the high paced
    gameplay we want yet… it's very high on the treble with no deep bassy times."*

    ⚠️ **BOTH HALVES WERE A NUMBER AND NOTHING HERE MEASURED EITHER.** The place opened at **61 notes
    a bar against level one's 118** and ran **31.5% of its energy under 300 Hz at `surge` against
    40.0%** — a piece half the speed of the game it plays under, and every guard in the repository
    green. `docs/decisions/0102-the-music-goes-somewhere.md` had already settled that the rate of
    events IS what a listener calls pace, so this was measurable the whole time.

    ⚠️ **THE FLOORS ARE PROPORTIONS OF THE BASE COMPOSITION, WHICH IS WHAT MAKES THEM STRUCTURAL
    RATHER THAN TUNED.** `docs/decisions/0034-a-threat-is-absolute-and-a-pool-is-the-pairing.md` says
    nothing asserts on a tuned value, and neither of these does: what is asserted is that a place is
    not substantially thinner or brighter than the piece every other level plays, which is
    `docs/decisions/0104-the-gun-plays-a-figure.md`'s *the title is the minimum base level we build
    upon* pointed at places instead of at rungs.

    ⚠️ **THE BOUND WAS 0.85 AND THE PROBE IS WHY IT IS NOT** —
    `docs/decisions/0019-a-probe-must-be-seen-to-apply.md` doing the more valuable half of its job.
    At 0.85 both breaks below reported **STILL GREEN**: holding the undercurrent still leaves 88% of
    the pace, and pulling the whole floor out of the mix still leaves 88% of the bottom. A bound that
    only fires on a catastrophe is a bound nobody is near, which is the shape of guard this project
    keeps finding in itself.

    ⚠️ **0.9 IS TIGHT AND THE MARGIN IS STATED RATHER THAN GLOSSED.** Today's thinnest readings are
    **0.94** for pace (at `boss`) and **0.93** for the bottom (at `approach`), so there are three or
    four points in hand — less than is comfortable, and the alternative was a guard that did not
    fire. The shipped defect this exists for was at **0.52** and **0.79**. A place that genuinely
    wants to be a tenth thinner than level one at some rung will fail here and the argument for it
    gets made, which is the outcome to want.
  */
  const PACE_FLOOR = 0.9;
  /** One bake map across both guards below — the second asks the same forty-four questions. */
  const paceBakes = new Map<string, number[]>();
  /*
    ⚠️ **THE LOOPS ARE FETCHED ONCE PER PLACE AND NOT ONCE PER RUNG.** `loopsAt` hands back fresh
    arrays on every call — deliberately, so that no test can move another's subject — and that is
    48 MB of copying. Asking for them inside the rung loop is forty-nine of those.
  */
  const loopsFor = new Map<string, Record<MusicLayer, Float32Array>>();
  const placeLoops = (theme?: ThemeKind): Record<MusicLayer, Float32Array> => {
    const key = theme ?? '';
    let got = loopsFor.get(key);
    if (got === undefined) {
      got = loopsAt(SAMPLE_RATE, theme);
      loopsFor.set(key, got);
    }
    return got;
  };

  it('0134 — NO PLACE IS SUBSTANTIALLY SLOWER THAN THE BASE COMPOSITION, at any rung', () => {
    const bakes = paceBakes;
    for (const rung of MUSIC_LEVELS) {
      const base = rungShape(undefined, rung, placeLoops(), bakes).notes;
      if (base <= 0) continue;
      for (const theme of THEME_KINDS) {
        const here = rungShape(theme, rung, placeLoops(theme), bakes).notes;
        expect(
          here / base,
          `${theme} plays ${here.toFixed(0)} notes a bar at ${rung} where the base plays ${base.toFixed(0)} — ` +
            `${((here / base) * 100).toFixed(0)}% of the pace the game is played at`,
        ).toBeGreaterThanOrEqual(PACE_FLOOR);
      }
    }
  }, DSP_MS);

  it('and none is substantially BRIGHTER, which is the other half of the same report', () => {
    /*
      ⚠️ **The share under 300 Hz, against the base's own at the same rung.** *No deep bassy times* is
      a claim about a ratio and about nothing else — and it is the half that a note count cannot see,
      because a place can be dense and still be dense entirely above the organ.
    */
    const bakes = paceBakes;
    for (const rung of MUSIC_LEVELS) {
      const base = rungShape(undefined, rung, placeLoops(), bakes).low;
      if (base <= 0) continue;
      for (const theme of THEME_KINDS) {
        const here = rungShape(theme, rung, placeLoops(theme), bakes).low;
        expect(
          here / base,
          `${theme} puts ${(here * 100).toFixed(1)}% of its energy under 300Hz at ${rung} where the base puts ` +
            `${(base * 100).toFixed(1)}% — a place that thin at the bottom reads as treble whatever it plays`,
        ).toBeGreaterThanOrEqual(PACE_FLOOR);
      }
    }
  }, DSP_MS);

  it('AND AN OVERRIDE MAY NOT SILENCE A LAYER THE LADDER OPENS', () => {
    // An empty voice array is a layer the ladder still raises a gain on and which makes no sound —
    // 0090's seam arriving through a side door, exactly as a mix multiplier of zero would be.
    for (const theme of THEME_KINDS) {
      for (const layer of revoicedBy(theme)) {
        expect(
          voicesOf(theme, layer).length,
          `${theme} states an empty ${layer}; to remove a layer, close it in the ladder`,
        ).toBeGreaterThan(0);
      }
    }
  });
});
