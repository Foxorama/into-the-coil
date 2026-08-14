import { describe, expect, it } from 'vitest';

import {
  MIX_CEILING,
  MIX_FLOOR,
  THEMES,
  THEME_KINDS,
  mixOf,
  airOf,
  bakedBy,
  revoicedBy,
  scaleOf,
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
import { LAYER_PAN } from '../src/content/music.ts';
import { addRoom, bakeLayer } from '../src/app/music.ts';
import { BANDS, bandEnergy } from './spectrum.ts';
import {
  AUDIBLE_FLOOR_DB,
  apartBy,
  layerLevels,
  profileOf,
  quietestThird,
  rungShape,
  underTheLoudest,
} from './pace.ts';
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
    /*
      ── AND `approach` IS NO LONGER THE EXCEPTION, BECAUSE ITS REASON WENT ────────────────────────

      ⚠️ **`docs/decisions/0147-a-place-is-a-balance.md`.** This required level one's row to be
      *exactly* neutral so that the other six were *"read against something"* — a sound argument while
      the only comparison this file could make was against the base. 0147 compares places **to each
      other**, so the ruler is no longer one row and level one does not have to be it.

      ⚠️ **AND HOLDING IT NEUTRAL HAD A COST NOBODY HAD NOTICED**: it is the one place that could not
      answer *"there are still some gain and some overlap issues for level 1 and 2 to sort out"* with
      the lever every other place has. Its quietest third measured **−18 dB** and the table it would
      have been fixed in was the table it was forbidden to use.
    */
    for (const theme of THEME_KINDS) {
      const moved = MUSIC_LAYERS.filter((layer) => Math.abs(mixOf(theme, layer) - 1) >= 0.1);
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

  /*
    ⚠️ **ONE BAKE PER PLACE FOR THE WHOLE FILE, AND IT USED TO BE ONE PER (PLACE, LAYER, GUARD)** —
    `docs/decisions/0146-three-more-places-and-two-after-them.md`. `loopsAt` hands back fresh arrays
    on every call — deliberately, so no test can move another's subject — and that copy is about
    forty milliseconds against a bake's two and a half seconds. Asking for them inside a loop over
    themes is one bake each time.

    ⚠️ **IT WENT RED ON CI THE FIRST TIME SIX PLACES STATED MATERIAL, AND GREEN LOCALLY.** Two places
    meant about forty bakes; six means two hundred and fifty, and the sixty-second ceiling below is
    the *shed test*'s number rather than this file's. That is
    `docs/decisions/0044-an-intermittent-guard-is-measuring-the-wrong-thing.md`'s shape without the
    intermittency — the work genuinely tripled, and a rerun would have proved nothing.

    ⚠️ **NOTHING ABOUT WHAT IS MEASURED CHANGES.** `bakeLoops` is `bakeLayer` over every layer
    (`src/app/music.ts`), so a layer read out of this map is byte for byte what a direct bake
    returns — the same samples, the same assertions. A guard made faster by measuring less would be
    `docs/decisions/0027-measure-the-picture-not-the-model.md` arriving inside the guard.
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
      const baseLoops = placeLoops();
      for (const theme of THEME_KINDS) {
        const own = revoicedBy(theme);
        const here = placeLoops(theme);
        for (const layer of own) {
          const base = baseLoops[layer];
          const mine = here[layer];
          expect(mine.length, `${theme}/${layer} changed the LENGTH of a layer, which breaks the phrase`).toBe(
            base.length,
          );
          let moved = 0;
          for (let i = 0; i < base.length; i++) if (Math.abs(base[i]! - mine[i]!) > 1e-6) moved++;
          expect(
            moved,
            `${theme} claims to re-voice ${layer} and bakes the identical audio — the override says nothing`,
          ).toBeGreaterThan(0);
        }
        // And a layer it did not claim is byte-identical, which is what sharing MEANS.
        const untouched = MUSIC_LAYERS.filter((l) => !own.includes(l))[0]!;
        expect(here[untouched]).toEqual(baseLoops[untouched]);
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

  it('0148 — A RE-VOICED TUNE STAYS IN THE NOTES ITS OWN PLACE STATES', () => {
    /*
      ⚠️ **THE LIMIT THAT MADE THE FIRST PLACE SAFE, AND IT IS THE FINDING OF 0128.** A theme may
      replace its melodies without replacing `chords`, and then the harmony under them is the base's.
      Every note therefore has to be a tone of the scale that bed is in, or the place is simply wrong
      over it for three bars in four — `docs/decisions/0095-the-level-has-its-own-music.md`'s argument
      for closing the title's bass.

      ── AND THE BOUND WAS `SCALE` FOR EVERY PLACE, WHICH IS WHY THEY ALL SOUNDED ALIKE ─────────────

      ⚠️ **`docs/decisions/0148-a-place-has-its-own-notes.md`.** Six authored places, one pitch-class
      set between them: A B C D E F G. This guard is why. Its two stated reasons — *wrong over the
      shared bed* and *the gun goes out of tune* — are both arguments about the TONIC, and it was
      enforcing the whole SCALE.

      ⚠️ **AND `src/content/music.ts` HAS ALWAYS BROKEN IT.** The base composition sounds a G# in
      `chords`, `groove` and `arp` and a b2 and a tritone right through the fight — ninety-three notes
      this guard would have refused — over the same cues, for longer than the guard has existed, with
      nothing ever reported out of tune. **The exemption was an accident of ordering: the base is not
      re-voiced by anybody, so it was never in the loop.** A guard the shipped design fails is
      measuring the wrong quantity (`docs/decisions/0044-an-intermittent-guard-is-measuring-the-wrong-thing.md`)
      — and this one was failed by the design in the file it is written about.

      ⚠️ **WHAT IS GUARDED NOW IS THAT A PLACE MEANT ITS NOTES.** The typo this has always genuinely
      caught is still caught; what a place may DECLARE is now its own.
    */
    for (const theme of THEME_KINDS) {
      const scale = scaleOf(theme);
      for (const layer of revoicedBy(theme)) {
        for (const voice of voicesOf(theme, layer)) {
          if (!voice.pitched) continue;
          for (const step of voice.steps) {
            if (step === null || step === undefined) continue;
            const degree = ((step % 12) + 12) % 12;
            expect(
              scale.includes(degree),
              `${theme}/${layer} plays ${step}, which is not one of the notes ${theme} states`,
            ).toBe(true);
          }
        }
      }
    }
  });

  it('0148 — A PLACE IS ROOTED ON A, whatever mode it states over it', () => {
    /*
      ⚠️ **THIS IS THE HALF OF THE OLD GUARD THAT WAS ALWAYS RIGHT** —
      `docs/decisions/0099-the-cues-are-in-the-key.md`. The player's gun, every explosion and every
      pickup chime are baked once at the first press and are in A; a place that moved its tonic would
      put them out of tune with the level for three minutes. A place may choose a MODE and may not
      choose a KEY, and 0148 is only sound because those are different things.

      ⚠️ **The root and the fifth are what a mode cannot move**, so requiring both is requiring the
      tonic without saying anything about the five notes between them.
    */
    for (const theme of THEME_KINDS) {
      const scale = scaleOf(theme);
      expect(scale.includes(0), `${theme} does not sound its own root`).toBe(true);
      expect(scale.includes(7), `${theme} does not sound the fifth the cues glide to`).toBe(true);
    }
  });

  it('0148 — NO TWO PLACES THAT CHOSE THEIR NOTES CHOSE THE SAME ONES', () => {
    /*
      ⚠️ **THE DEFECT 0148 IS NAMED FOR, AS FAR AS IT CAN HONESTLY BE STATED TODAY.** `weigh-notes`
      measured two distinct pitch-class sets across seven places and the report called them
      interchangeable. The guard this wants to be — *no two places share a mode* — **is one the
      shipped design fails**, because five of the seven still state none and default to `SCALE`.

      ⚠️ **SO IT IS WRITTEN OVER THE PLACES THAT OPTED IN, AND IT IS VACUOUS UNTIL A SECOND ONE
      DOES.** `docs/decisions/0044-an-intermittent-guard-is-measuring-the-wrong-thing.md` and
      `docs/decisions/0147-a-place-is-a-balance.md`'s own deleted guard are why: a bound the design
      fails is not a bound, and asserting the version this wants would mean either five stated modes
      no material plays — a declaration that is a lie — or a red suite.

      ⚠️ **WHAT IT GENUINELY CATCHES IS THE NEXT PLACE COPYING THIS ONE'S**, which is the exact shape
      of the failure 0148 exists to answer. `docs/decisions/0148-a-place-has-its-own-notes.md` records
      levels 4 to 7 as owed, and this goes red rather than quiet if two of them arrive as twins.
    */
    const chose = THEME_KINDS.filter((theme) => THEMES[theme].scale !== undefined);
    const seen = new Map<string, ThemeKind>();
    for (const theme of chose) {
      const key = [...scaleOf(theme)].sort((a, b) => a - b).join(',');
      const twin = seen.get(key);
      expect(twin, `${theme} chose the same notes as ${twin} — neither is anywhere the other is not`).toBe(
        undefined,
      );
      seen.set(key, theme);
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
        const here = placeLoops(theme);
        for (const layer of revoicedBy(theme)) {
          const bands = bandEnergy(here[layer], SAMPLE_RATE);
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
  /** The band a place's bottom lives in — 0147 turned 0134's ratio-to-the-base into an absolute. */
  const LOW_FLOOR = 0.28;
  const LOW_CEILING = 0.55;
  /** One bake map across both guards below — the second asks the same forty-four questions. */
  const paceBakes = new Map<string, number[]>();
  /*
    ⚠️ **THE LOOPS ARE FETCHED ONCE PER PLACE AND NOT ONCE PER RUNG.** `loopsAt` hands back fresh
    arrays on every call — deliberately, so that no test can move another's subject — and that is
    48 MB of copying. Asking for them inside the rung loop is forty-nine of those. `placeLoops` is
    declared at the head of this `describe` and is now shared with the guard that measures whether a
    place's material differs at all — 0146 has why that one could not go on baking its own.
  */

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

  it('and every place has a bottom AND a top, which is a band and used to be a race to the floor', () => {
    /*
      ⚠️ **THE SHARE UNDER 300 Hz, AS AN ABSOLUTE BAND — AND IT WAS A RATIO AGAINST THE BASE** —
      `docs/decisions/0147-a-place-is-a-balance.md`. 0134 wrote it as *at least 90% of the base's own
      share at the same rung*, against a place that measured 28.6% where the base put 40. That caught
      the defect it was written for and then did something nobody intended: **it made the base's
      balance a target that every later place was tuned down to.**

      ⚠️ **FOUR OF THE FIVE PLACES 0146 ADDED HIT THIS FLOOR AND WERE ANSWERED THE SAME WAY** — raise
      the sub, raise the kick, raise the groove — so all five ended up bass-led, which is most of what
      *"it didn't feel like I'd travelled somewhere else"* is a description of. A floor everything is
      tuned down to is a target, and a target is a sameness. `CLAUDE.md`'s *no counting guard* is the
      same shape one axis over.

      ⚠️ **A BAND FIXES BOTH ENDS AND COUPLES NOTHING TO ANYTHING.** The bottom stops a place being
      the treble wash 0134 caught; **the top stops *more bass* being the answer to every question**,
      which is the half that did not exist and is what let seven places converge. The base itself sits
      at 36–44%, comfortably inside.

      ⚠️ **The numbers are a hand's guess bracketing today's measured spread**, on 0140's terms: the
      shipped defect was 28.6%, and the place that answered the old floor hardest reached 50.7%.
    */
    const bakes = paceBakes;
    for (const rung of MUSIC_LEVELS) {
      for (const theme of THEME_KINDS) {
        const here = rungShape(theme, rung, placeLoops(theme), bakes).low;
        if (here <= 0) continue;
        expect(
          here,
          `${theme} puts ${(here * 100).toFixed(1)}% of its energy under 300Hz at ${rung} — a place that ` +
            `thin at the bottom reads as treble whatever it plays`,
        ).toBeGreaterThanOrEqual(LOW_FLOOR);
        expect(
          here,
          `${theme} puts ${(here * 100).toFixed(1)}% of its energy under 300Hz at ${rung} — a place that ` +
            `bottom-heavy has answered every question with the same sub, which is what makes seven of them one`,
        ).toBeLessThanOrEqual(LOW_CEILING);
      }
    }
  }, DSP_MS);

  it('0136 — A ROOM ADDS ENERGY AND NOT PEAK, which is what makes it a room', () => {
    /*
      `docs/decisions/0136-the-place-has-a-room-and-an-arc.md`. Reported: *"it still needs more
      reverb… suitably awe inspiring to match the Pillars of Creation."*

      ⚠️ **EVERY LEVER THIS PROJECT HAD REACHED FOR BEFORE WAS SUSTAIN** — a longer note, a slower
      attack, a lower decay constant — and a held note is a held note. The property that separates a
      room from a louder pad is that it fills the gaps BETWEEN notes without making the loud moments
      louder: energy up, peak flat.

      ⚠️ **Driven over a real layer rather than an impulse**, because the thing that could go wrong is
      a feedback path that grows instead of decays, and a single click does not excite one.
    */
    const dry = bakeLayer('chords', SAMPLE_RATE);
    const wet = Float32Array.from(dry);
    addRoom(wet, SAMPLE_RATE, 0.9);
    const rms = (b: Float32Array): number => Math.sqrt(b.reduce((sum, v) => sum + v * v, 0) / b.length);
    const peak = (b: Float32Array): number => b.reduce((most, v) => Math.max(most, Math.abs(v)), 0);
    /*
      ⚠️ **THE ROOM'S OWN SIGNAL AND NOT THE TOTAL, AND THE DIFFERENCE IS A REAL ONE.** A first draft
      asserted that the summed RMS rose, which sounds equivalent and is not: a reverb fills the gaps
      between notes, so on a SUSTAINED layer — which is what a choir is — it can be plainly audible
      while the total moves one percent. Measuring `wet − dry` asks *is there a room* instead of *did
      the layer get louder*, and only the first is the subject.
    */
    const room = Float32Array.from(wet).map((v, i) => v - dry[i]!);
    expect(rms(room) / rms(dry), 'the room is inaudible against the layer it is a room for').toBeGreaterThan(0.25);
    /*
      ⚠️ **THE PEAK IS THE HALF THAT COULD RUIN THE MIX.** Every gain in every theme is tuned under a
      clipping guard; a reverb that raised peaks would silently spend that headroom and the failure
      would land on whichever layer happened to be loudest.
    */
    expect(peak(wet) / peak(dry), 'the room raised the peak, which spends the mix’s headroom').toBeLessThan(1.15);
    // And it decays: the tail cannot still be running a whole loop later, or the feedback is unstable.
    expect(peak(wet), 'the room did not decay — the feedback path grows').toBeLessThan(1);
  }, DSP_MS);

  it('0136 — a place BAKES every layer it changes, and a room is a change', () => {
    /*
      ⚠️ **`revoicedBy` AND `bakedBy` WERE THE SAME SET UNTIL THIS DECISION, AND EVERYTHING THAT BAKES
      A PLACE WAS ASKING THE FIRST.** A place can now state `air` for a layer it does not re-voice —
      the notes are the base's and the buffer is not, because the room is baked in. `bakePlace` at a
      level boundary (0133) and the dashboard's cache would both have shared the DRY array and the
      room would never have arrived: silently, with every guard green, because nothing asserts about
      a layer a place did not claim.

      ⚠️ **Ember Nebula gives air only to layers it also re-voices, so nothing is wrong today.** This
      is the trap closed before the first place walks into it, which is the cheapest moment there is —
      and it is set arithmetic, so it costs nothing to keep.
    */
    for (const theme of THEME_KINDS) {
      const baked = bakedBy(theme);
      for (const layer of MUSIC_LAYERS) {
        if (airOf(theme, layer) > 0) {
          expect(baked, `${theme} gives ${layer} a room and would not bake it`).toContain(layer);
        }
      }
      for (const layer of revoicedBy(theme)) {
        expect(baked, `${theme} re-voices ${layer} and would not bake it`).toContain(layer);
      }
    }
  });

  it('0136 — EMBER NEBULA CLIMBS INTO THE SURGE AND DROPS INTO THE FIGHT', () => {
    /*
      Asked for: *"so like Up, Up, Up, drop, sharp Down for the boss."*

      ⚠️ **HELD OVER WHERE THE NOTES ARE AND NOT OVER THE SPECTRUM.** The spectral centroid was tried
      first and is the wrong instrument twice over: it moved five hertz while an octave of material
      moved, and it reads the same report's *sharp percussive beat* — broadband noise — as the music
      going UP at the fight. `pitchOf` is content arithmetic and sees what was actually written.

      ⚠️ **A SHAPE AND NOT A VALUE, WHICH IS WHY THIS DOES NOT BREAK
      `docs/decisions/0034-a-threat-is-absolute-and-a-pool-is-the-pairing.md`.** Nothing here asserts
      a pitch; what is asserted is that each rung sits where the report says relative to its
      neighbour. It is the same shape of claim as *every rung is louder than the one below*.

      ⚠️ **It is named for one place on purpose.** Six others are unwritten and may want other arcs —
      what this protects is that a later tuning pass cannot flatten THIS one without saying so.
    */
    const bakes = paceBakes;
    const at = (rung: (typeof MUSIC_LEVELS)[number]): number => rungShape('nebula', rung, placeLoops('nebula'), bakes).pitch;
    const run = at('run');
    const push = at('push');
    const surge = at('surge');
    const approach = at('approach');
    const boss = at('boss');
    const say = `run ${run.toFixed(0)} · push ${push.toFixed(0)} · surge ${surge.toFixed(0)} · approach ${approach.toFixed(0)} · boss ${boss.toFixed(0)} Hz`;
    expect(push / run, `UP into the push — ${say}`).toBeGreaterThan(1.15);
    expect(surge / push, `UP into the surge — ${say}`).toBeGreaterThan(1.05);
    /*
      ⚠️ **THE DROP HAS A SIZE ON IT BECAUSE THE PROBE SAID SO.** This was `approach < surge` with no
      magnitude, and pulling the organ's top rank down to a third still left a one-percent fall — the
      guard passed on an arc that had flattened. [0019](0019-a-probe-must-be-seen-to-apply.md) doing
      the more valuable half of its job, for the second decision running. Today's fall is 5%.
    */
    expect(approach / surge, `and DOWN into the approach — ${say}`).toBeLessThan(0.97);
    /*
      ⚠️ **The fight's drop is the one with a size on it**, because *sharp* is the word in the report
      and a boss one hertz below the approach would satisfy an ordering and none of the ask.
    */
    expect(boss / approach, `and SHARPLY down into the fight — ${say}`).toBeLessThan(0.92);
  }, DSP_MS);

  it('0140 — NO LAYER A RUNG OPENS IS INAUDIBLE UNDER THE REST OF ITS OWN PLACE', () => {
    /*
      `docs/decisions/0140-no-layer-is-inaudible.md`. Reported of the dashboard's layer buttons:
      *"is it on purpose that we've got such varied volume levels on the effects? Hook and Drive for
      example, hook I can barely hear and drive is quite loud and clear by comparison."*

      ⚠️ **A GAIN IS NOT A LOUDNESS, AND NOTHING HERE MEASURED THE SECOND ONE UNTIL NOW.** The faders
      a hand sets span about 7 dB across a place; what comes out of them spans 38 dB and more. So
      every mix number in this project was chosen against a quantity nobody could see — including the
      ones in the guards above, which is why this sits beside them rather than replacing any.

      ⚠️ **BOTH MEASURES HAVE TO CONDEMN A LAYER, and that is what keeps it off the healthy ones.**
      RMS counts the silence between notes, so `crash` — four strikes in twelve seconds — reads 38 dB
      down while being the most conspicuous sound in the approach. Peak counts one sample, so a
      continuous pad reads like a click. `crash` fails RMS and passes peak, and stays.

      ⚠️ **AND `AUDIBLE_FLOOR_DB` IS A HAND'S GUESS WITH A GAP UNDER IT.** Ranked across all seven
      places, one layer sat at −38.1 dB, then a **10 dB hole**, then the population from −28.1 up.
      The floor is in the hole. If a later mix pass closes that gap this number stops being
      defensible and should GO rather than be widened — CLAUDE.md's *no counting guard*.
    */
    const offenders: string[] = [];
    for (const theme of THEME_KINDS) {
      const levels = layerLevels(theme, placeLoops(theme));
      for (const layer of MUSIC_LAYERS) {
        // A layer no rung ever opens is a different claim, held by the ladder's own guards.
        if (levels.find((l) => l.layer === layer)!.gain <= 0) continue;
        const under = underTheLoudest(levels, layer);
        if (under.rms < AUDIBLE_FLOOR_DB && under.peak < AUDIBLE_FLOOR_DB) {
          offenders.push(`${theme}/${layer} (rms ${under.rms.toFixed(1)} dB, peak ${under.peak.toFixed(1)} dB)`);
        }
      }
    }
    expect(
      offenders,
      `these are opened by a rung and cannot be heard against the rest of the place: ${offenders.join(', ')}`,
    ).toEqual([]);
  }, DSP_MS);

  /*
    ── 0147: A PLACE IS A BALANCE, AND THESE ARE WHAT REPLACED THE ±3 dB BAND ─────────────────────

    Reported, having heard all five of 0146's places: *"level 3 sounds incredibly similar to level 2…
    level 4, 5, 6 were pretty bland and very similar to the other levels, it didn't feel like I'd
    travelled somewhere else in the galaxy."*

    ⚠️ **`MIX_FLOOR` AND `MIX_CEILING` WERE WHAT KEPT THE MIX SAFE AND THEY ARE NOW ±8 dB.** What a
    narrow band bought was *no theme can break the ladder*; what it cost was *no theme can state a
    balance*. The three guards below hold the first without buying the second, which is the trade
    `docs/decisions/0120-a-rung-may-close-a-layer.md` made when it took 0090's additive rule away:
    more structure, not less.
  */
  const PLACES_APART_DB = 3;
  const QUIETEST_THIRD_DB = -15;

  it('0147 — NO TWO PLACES ARE THE SAME MIX, which is the reported defect stated as a number', () => {
    /*
      ⚠️ **THE REPORTED ONE, AND IT IS THE FIRST GUARD HERE THAT COMPARES TWO PLACES.** Everything
      else in this file asks *is this place inside a bound* — a question seven identical arrangements
      pass. `apartBy` asks the question the report asks.

      ⚠️ **THE THRESHOLD IS A HAND'S GUESS AGAINST A MEASURED SPREAD**, on
      `docs/decisions/0140-no-layer-is-inaudible.md`'s terms. Before 0147 the seven sat at 1.9–6.0 dB
      apart and the player called the closest three interchangeable and the furthest one *"really
      nice"*. 3 dB is above the pairs that were reported as the same and below the ones that were not.
      **If a later round finds two places at 3.1 dB that still sound alike, this number is wrong and
      should MOVE rather than be worked around.**
    */
    const profiles = new Map(THEME_KINDS.map((theme) => [theme, profileOf(theme, placeLoops(theme))]));
    const tooClose: string[] = [];
    for (let i = 0; i < THEME_KINDS.length; i++) {
      for (let j = i + 1; j < THEME_KINDS.length; j++) {
        const a = THEME_KINDS[i]!;
        const b = THEME_KINDS[j]!;
        const apart = apartBy(profiles.get(a)!, profiles.get(b)!);
        if (apart < PLACES_APART_DB) tooClose.push(`${a}/${b} ${apart.toFixed(1)} dB`);
      }
    }
    expect(
      tooClose,
      `these places are the same mix with different notes in them: ${tooClose.join(', ')}`,
    ).toEqual([]);
  }, DSP_MS);

  it('0147 — AND NO PLACE KEEPS ITS CHARACTER IN A WHISPER', () => {
    /*
      ⚠️ **0140's FLOOR IS −33 dB AND EVERY LAYER THAT CARRIES A BRIEF WAS AT −15 TO −30.** *"No
      lasers and roar at the boss"* was reported about a place whose lasers measured 21 dB under its
      own kick — comfortably inside the audible floor, and comfortably inaudible. A layer can clear
      *can this be heard at all* and still never be what anybody hears.

      ⚠️ **HELD OVER THE QUIETEST THIRD RATHER THAN OVER NAMED LAYERS**, because which layers carry a
      place is the place's own business — `docs/decisions/0108-the-bed-is-felt-and-the-boss-arrives.md`
      says a guard about a layer is written over the property and never over the name. What is
      asserted is that **a third of a place is not a whisper**, which is true of any mix a listener
      would call characterful and false of every mix that reads as a bed.
    */
    const offenders: string[] = [];
    for (const theme of THEME_KINDS) {
      const down = quietestThird(profileOf(theme, placeLoops(theme)));
      if (down < QUIETEST_THIRD_DB) offenders.push(`${theme} ${down.toFixed(1)} dB`);
    }
    expect(
      offenders,
      `these places keep their bottom third too far down to be part of the picture: ${offenders.join(', ')}`,
    ).toEqual([]);
  }, DSP_MS);

  it('0147 — AND A WIDER BAND STILL CANNOT FLATTEN THE LADDER, at any place', () => {
    /*
      ⚠️ **THE PROPERTY THE ±3 dB BAND WAS PROTECTING, HELD DIRECTLY.** 0102 bought four climbs and a
      theme with ±8 dB of authority could sell one back — by leaning on a layer `run` opens and away
      from one `surge` does, which no existing guard reads. `tests/music.test.ts` holds this over the
      LADDER; this holds it over the ladder as each place actually plays it.

      ⚠️ **Summed over the layers rather than measured off the audio**, because the claim is about the
      arrangement and not about the samples: a rung that opens more gain than the one below it is a
      rung that arrives, whatever the material under it happens to be.
    */
    /*
      ⚠️ **THE ARC IS `run < push < surge`, A DROP, AND THEN THE FIGHT — AND THE FIRST DRAFT OF THIS
      GUARD ASSERTED A STRAIGHT CLIMB THAT THE BASE LADDER ITSELF DOES NOT HAVE.** `approach` closes
      `groove` and `hook` (`RUNG_CLOSES`) and opens a bell and a tritone; it sums BELOW `surge` in
      `MUSIC_LADDER` by design, and `docs/decisions/0136-the-place-has-a-room-and-an-arc.md` calls
      that drop by name — *"Up, Up, Up, drop, sharp Down for the boss."*

      ⚠️ **A guard that the shipped design fails is a guard measuring the wrong quantity**, which is
      `docs/decisions/0044-an-intermittent-guard-is-measuring-the-wrong-thing.md` arriving at the
      moment of writing rather than three weeks later. What is held is the shape the ladder actually
      has: the three climbs, and a fight that is bigger than the hush before it.
    */
    const at = (theme: ThemeKind, rung: (typeof MUSIC_LEVELS)[number]): number =>
      MUSIC_LAYERS.reduce((sum, layer) => sum + MUSIC_LADDER[rung][layer] * mixOf(theme, layer), 0);
    const climbs: [(typeof MUSIC_LEVELS)[number], (typeof MUSIC_LEVELS)[number]][] = [
      ['run', 'push'],
      ['push', 'surge'],
      ['approach', 'boss'],
    ];
    for (const theme of THEME_KINDS) {
      for (const [below, here] of climbs) {
        expect(
          at(theme, here),
          `${theme} opens ${at(theme, here).toFixed(2)} at ${here} against ${at(theme, below).toFixed(2)} at ${below} — a rung that does not arrive`,
        ).toBeGreaterThan(at(theme, below));
      }
    }
    /*
      ⚠️ **AND THE DROP INTO `approach` IS DELIBERATELY NOT ASSERTED HERE, HAVING BEEN WRITTEN AND
      DELETED.** A gain sum that falls at `approach` looks like
      `docs/decisions/0136-the-place-has-a-room-and-an-arc.md`'s *drop* and is not it: 0136's arc is
      about **where the notes sit**, which `pitchOf` measures and a sum of gains cannot see. The base
      ladder clears a gain-sum version by 1.3%, which is a knife-edge nobody chose — so asserting it
      would have been fitting a bound to an accident and then tuning five places against it.

      ⚠️ **What the hush before the fight actually IS, is `RUNG_CLOSES` taking `groove` and `hook`
      away** — an arrangement change, held by `tests/music.test.ts` over the ladder itself.
    */
  });

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
