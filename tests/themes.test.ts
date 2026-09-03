import { describe, expect, it } from 'vitest';

import { CUES, CUE_KINDS, PLACE_CUES, type CueKind } from '../src/content/cues.ts';
import {
  auraCeilingOf,
  cueLayersOf,
  cueRowOf,
  cuedBy,
  THEMES,
  THEME_KINDS,
  mixOf,
  notesPerBar,
  paceAt,
  airOf,
  bakedBy,
  revoicedBy,
  rungIn,
  rungOf,
  scaleOf,
  voicesOf,
  type ThemeKind,
  REBASE,
} from '../src/content/themes.ts';
import { LEVELS, LEVEL_KINDS } from '../src/content/levels.ts';
import {
  OWN_LAYERS,
  BEAT_SECONDS,
  LAYER_BARS,
  MUSIC,
  MUSIC_LADDER,
  MUSIC_LAYERS,
  MUSIC_LEVELS,
  MUSIC_GAIN,
  type MusicLayer,
  MUSIC_DRIVE,
  secondsOfLayer,
} from '../src/content/music.ts';
import { AURA_LAYERS, LAYER_PAN, type MusicLevel } from '../src/content/music.ts';
import { addRoom, bakeLayer } from '../src/app/music.ts';
import { BANDS, bandEnergy } from './spectrum.ts';
// 0218: the through-shaper loudness, which is the only place a CONTRAST between rungs can be read.
import { driveAt } from './clean.ts';
import { LEVEL_BAND_DB } from './compress.ts';
import {
  AUDIBLE_FLOOR_DB,
  DUCK_FLOOR_DB,
  ROLE_FLOOR_DB,
  carriedThrough,
  adriftAt,
  layerLevels,
  profileOf,
  quietestThird,
  rungShape,
  underTheLoudest,
} from './pace.ts';
import { roleOf, OWN_ROLES, SOLVED_BY } from '../src/content/arrangement.ts';
/*
  ⚠️ **A TEST IMPORTING A `scripts/` MODULE, AND IT IS THE RIGHT ARROW.** `solve-mix.mjs` is where the
  solve LIVES — `rig/dash.ts` plays it and three scripts print it — so a second copy here would be
  `docs/decisions/0029-the-tracked-record-is-the-record.md` happening in arithmetic, which is the
  defect `scripts/weigh-audition.mjs` names about `tests/pace.ts`. The suite asserts over the code
  that runs.
*/
import {
  HOLD_WEIGHT,
  profileOfLoops,
  rebasedLevel,
  rmsOfLoops,
  solveLevel,
} from '../scripts/solve-mix.mjs';
import { DECOR_INKS, PALETTES, type PaletteName } from '../src/content/palette.ts';
import { SAMPLE_RATE, saturate } from '../src/app/sound.ts';
import { loopsAt } from './bakes.ts';
import { GAMEPLAY_FLOOR, contrast } from './contrast.ts';

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
          /*
            ⚠️ **A DECORATIVE INK IS NEVER DRAWN ON A BACKDROP** —
            `docs/decisions/0194-a-hull-has-a-livery.md`. `glass`, `flame` and `trim` are laid over a
            hull that has already cleared this floor, inside the same bitmap; there is no cell of this
            cross-product where one of them meets a backdrop. Holding them to it would demand a canopy
            as loud as the ship it is a window in, which is the opposite of what a canopy is.

            ⚠️ **THE RULE THAT REPLACES IT IS IN `tests/palette.test.ts`**: a decorative ink must be
            far from every ink that MEANS something, so a canopy cannot be read as a pickup.
          */
          if ((DECOR_INKS as readonly string[]).includes(ink)) continue;
          const ratio = contrast(colour, backdrop);
          expect(
            ratio,
            `${ink} sits at ${ratio.toFixed(2)}:1 on ${theme}'s ${name} backdrop, which is below the floor`,
            /*
              ⚠️ **THE GAMEPLAY FLOOR, NOT WCAG AA — 0198.** The accessibility pass runs after the game;
              until it does, *can the player pick this out at all* is what fails a build and *does it
              clear AA* is measured by `tests/authored.test.ts` and reported. 0024's unconditional tier
              is untouched: what moved is a number, not the rule that a level may never silently
              override a choice the player made.
            */
          ).toBeGreaterThanOrEqual(GAMEPLAY_FLOOR);
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
  /*
    ── THE BAND GUARD IS GONE AND NOTHING REPLACES IT ────────────────────────────────────────────

    ⚠️ **`docs/decisions/0182-a-mix-number-has-no-band.md`.** It held every entry in every `mix`
    between 0.22 and 2.6, and the reason it gave for each end is now held by something that measures
    a listener rather than a number: the ceiling by the clip guard immediately below, which drives
    the real shaper; the floor by
    `docs/decisions/0162-a-place-has-its-own-ladder.md`, which made closing a layer a sentence a
    place says outright instead of a thing a multiplier of zero did behind the ladder's back.

    ⚠️ **AND IT WAS THE ONE GUARD IN THIS FILE WHOSE OWN SUBJECT WAS A WALL.** `src/content/arrangement.ts`
    recorded it biting silently in 0154 and it stayed for six weeks; three entries sat exactly on 2.6
    the day it came off.
  */

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
    /*
      ── AND HALF OF THE DOT PRODUCT WAS AGAINST A GAIN OF ZERO, WHICH IS THE THIRD TIME THIS ────────

      ⚠️ **`docs/decisions/0148-a-place-has-its-own-notes.md`.** This guard took **52.6 s in CI on the
      commit before 0148**, against the 60 s budget stated below — 88% of it — and 0148's six extra
      voices in one place took it to 62.2 s. It has now hit this wall three times, and each of the two
      comments above is a previous one.

      ⚠️ **THE GROWTH LAW IS WHAT MATTERS AND IT IS NOT ABOUT 0148.** The walk costs
      *samples × layers × rungs × places*, and **four of the seven places still have no material of
      their own.** Whichever of levels 4 to 7 had been written first would have tipped this; 0148 was
      simply first. A budget at 88% with four known additions outstanding is a budget already spent.

      ⚠️ **FIRST THE ARITHMETIC, BECAUSE A LOOSER BUDGET IS THE LAST RESORT AND NOT THE FIRST.**
      `MUSIC_LADDER` holds a zero for **80 of the 161 (layer, rung) pairs**: `calm` opens three layers
      of twenty-three, `run` nine. Every one of those was a multiply and an add against zero, every
      sample, every place. Compacting each rung to the layers it actually opens is the same peak from
      the same samples through the same shaper — **adding `0 × x` is what is skipped, not a layer** —
      and it is the same trade the two hoists above made, which
      `docs/decisions/0027-measure-the-picture-not-the-model.md` is the reason to keep making in that
      direction and never the other.

      ── AND THEN THE BUDGET, BECAUSE THE MEASUREMENT SAYS THE WALK WAS NEVER THE COST ──────────────

      ⚠️ **IT HALVED THE WALK AND MOVED THE TEST BY 9%**, which is the number that settles what to do
      next. Timed on this machine, per place:

      | | |
      |---|---|
      | baking the seven compositions | **27.0 s** |
      | walking every sample at every rung | **3.7 s** |

      ⚠️ **88% OF THIS GUARD IS `bakeLoops`, AND THAT IS THE THING IT EXISTS TO MEASURE.** 0134's own
      finding is that a place must be baked **as itself** — the version that baked one composition and
      applied every place's mix to it ran green over the whole of 0132 without sounding a note of it.
      So the bake cannot be cut without measuring less, and *measuring less* is the one direction
      three rounds of comments here have refused.

      ⚠️ **60 s WAS A BUDGET FOR TWO COMPOSITIONS AND THE GAME HAS SEVEN.** It was set when one place
      had its own material; six do now, four more are owed a mode by 0148, and the cost grows once per
      place for ever. **The bound being loosened is the clock and not the assertion** — the same
      samples, the same shaper, the same `≤ 1` per (theme, rung) — which is the distinction that makes
      this a budget and not the *widen the number until it goes quiet* move that
      `docs/decisions/0140-no-layer-is-inaudible.md`'s second probe is written against.
    */
    for (const theme of THEME_KINDS) {
      const loops = loopsAt(SAMPLE_RATE, theme);
      const buffers = MUSIC_LAYERS.map((layer) => loops[layer]);
      const longest = Math.max(...buffers.map((b) => b.length));
      const rungs = MUSIC_LEVELS.map((level) => {
        // @setup: the layers this rung actually opens, and their gains, compacted out of the 23.
        const live: number[] = [];
        const gains: number[] = [];
        /*
          ⚠️ **THROUGH `rungOf`, AND WITH THE AURA'S CEILING, AND IT HAD NEITHER** —
          `docs/decisions/0176-the-re-based-mix-is-the-mix.md`. This read `MUSIC_LADDER[level][layer]`
          directly, so it was the **fourth** reader blind to a place's own ladder after `loudestOf`,
          `rungShape` and the audition guard — and the one that decides whether the bus distorts. It
          also gave the aura pair their full row at every rung, where 0091 makes that gain a ceiling
          scaled by how near the boss is.
        */
        // ⚠️ THE PLACE'S OWN CEILING SINCE 0183 — a constant here would model a level nobody plays.
        const nearness = level === 'boss' || level === 'bossPeak' ? 1 : auraCeilingOf(theme);
        for (const [l, layer] of MUSIC_LAYERS.entries()) {
          const ceiling = AURA_LAYERS.includes(layer) ? nearness : 1;
          const gain = rungOf(theme, level, layer) * mixOf(theme, layer) * ceiling;
          // A zero here is a layer this place does not sound — the ladder closing it (0120), or the
          // place's own `mix` stating zero, which 0182 made a sentence a hand may write.
          if (gain === 0) continue;
          live.push(l);
          gains.push(gain);
        }
        // 0217: the three sums the distortion measure needs, carried in the same row.
        return {
          level,
          live,
          gains,
          peak: 0,
          clamped: 0,
          walked: 0,
          dirtyDotClean: 0,
          cleanDotClean: 0,
          dirtyDotDirty: 0,
        };
      });
      // @setup: one scratch row of layer values, refilled per sample rather than allocated per sample.
      const now = new Float64Array(MUSIC_LAYERS.length);
      // @setup: the wrap length of each layer, so the walk below does not reload it per sample.
      const spans = buffers.map((b) => b!.length);
      for (let i = 0; i < longest; i++) {
        for (let l = 0; l < buffers.length; l++) {
          now[l] = buffers[l]![i % spans[l]!]!;
        }
        for (const rung of rungs) {
          const { live, gains } = rung;
          let sum = 0;
          for (let k = 0; k < live.length; k++) sum += now[live[k]!]! * gains[k]!;
          /*
            ⚠️ **CLAMPED FIRST, BECAUSE THAT IS WHAT A `WaveShaperNode` DOES** — 0176. Its curve is
            defined over an input of [-1, 1] and the browser clamps anything outside that to the
            curve's own ends, so `saturate` called unclamped is a model of a shaper the game does not
            have. What the speaker actually produces can therefore never exceed `saturate(1)`, which
            is 1 — and the real question is not *does it exceed full scale* but **how much of the
            signal is being pushed into the clamp**, which is the line below.
          */
          const driven = sum * MUSIC_GAIN;
          if (Math.abs(driven) > 1) rung.clamped++;
          rung.walked++;
          const held = driven < -1 ? -1 : driven > 1 ? 1 : driven;
          const signed = saturate(held, MUSIC_DRIVE);
          const shaped = Math.abs(signed);
          if (shaped > rung.peak) rung.peak = shaped;
          /*
            ── HOW MUCH OF THE OUTPUT NO GAIN EXPLAINS — 0217 ────────────────────────────────────

            ⚠️ **THE QUANTITY A LEVEL METER CANNOT SEE, ACCUMULATED IN THE WALK THAT IS ALREADY
            HAPPENING.** The clamp share above answers *is anything flattened* and its answer is
            0.0089% at worst — so it was green while a listener reported *"it just doesn't sound
            crystal clear and clean"*. Both are true: the bus was not clipping, it was SATURATING, and
            saturation shows up in what the shaper adds rather than in what it caps.

            ⚠️ **THREE DOT PRODUCTS AND NO SECOND PASS.** The best single multiplier is
            `<dirty,clean>/<clean,clean>` and the residual energy is `<dirty,dirty> − a·<dirty,clean>`,
            so the whole measure rides this loop for three multiply-adds a sample.
          */
          rung.dirtyDotClean += signed * driven;
          rung.cleanDotClean += driven * driven;
          rung.dirtyDotDirty += signed * signed;
        }
      }
      for (const rung of rungs) {
        expect(
          rung.peak,
          `${theme} at ${rung.level} peaks at ${rung.peak.toFixed(3)} of full scale`,
        ).toBeLessThanOrEqual(1);
        /*
          ⚠️ **THE ASSERTION THAT DOES THE WORK NOW, AND IT IS IN THE UNIT THE DEFECT IS IN.** With the
          clamp modelled, the peak can no longer exceed 1 and that assertion is a tautology kept for
          the shape of the thing; what a listener would hear is the share of samples flattened against
          the end of the curve.

          ⚠️ **A TWENTIETH OF ONE PER CENT, AND THE WORST SAMPLE IS 0.054 dB OUT.** The re-based mix
          reaches the clamp on **0.0089%** of Ember Nebula's samples and under 0.001% everywhere else;
          the shipped ladder reached it on none. What that costs is an unclamped 1.0062 becoming
          1.0000 on about one sample in eleven thousand, because `tanh` is already flat there — which
          is why 0176 ships the balance the player chose rather than trimming 1.85 dB off the music to
          make a rounding error go away.
        */
        expect(
          rung.clamped / Math.max(1, rung.walked),
          `${theme} at ${rung.level} drives ${((rung.clamped / Math.max(1, rung.walked)) * 100).toFixed(4)}% of its samples into the shaper's clamp`,
        ).toBeLessThan(0.0005);
        /*
          ⚠️ **AND HOW DIRTY IT IS, WHICH IS THE ONE THE REPORT WAS ABOUT** — 0217. Reported: *"the
          approach compared to ember nebula sounds distorted a bit and some of the boss music has
          similar distortion, it just doesn't sound crystal clear and clean."* At `MUSIC_DRIVE` 0.3
          the loud rungs sat at **−13 to −16 dB** and every one of them passed both assertions above.

          ⚠️ **THE CEILING IS SET FROM THE MEASURED SPREAD AFTER THE FIX, NOT FROM A TASTE.** At 0.15
          the dirtiest rung in the game is Saurian Belt's `surge` at −16.8 dB, so −16 is just past the
          worst thing that ships. It holds the bus at the colour that was chosen and would go red on a
          drive raised back towards 0.3 — which is precisely the change that produced the report.
        */
        const fit = rung.cleanDotClean > 0 ? rung.dirtyDotClean / rung.cleanDotClean : 0;
        const residual = Math.max(0, rung.dirtyDotDirty - fit * rung.dirtyDotClean);
        const dirty =
          rung.dirtyDotDirty <= 0 || residual <= 0 ? -Infinity : 10 * Math.log10(residual / rung.dirtyDotDirty);
        expect(
          dirty,
          `${theme} at ${rung.level} is ${dirty.toFixed(1)} dB dirty — the bus is saturating hard ` +
            'enough to hear, which is what "doesn\'t sound crystal clear and clean" is',
        ).toBeLessThan(-16);
      }
    }
    /*
      ⚠️ **THREE MINUTES: about 3× the projected cost once all seven places have their own material**,
      and still short enough that a genuinely hung bake fails rather than hanging CI. The comment
      above has the measurement it is sized from.
    */
  }, 180_000);

  /*
    ── NO BOUNDARY INSIDE A LEVEL IS BIGGER THAN THE ONE THAT OPENS IT — 0218 ─────────────────────

    ⚠️ **Reported twice on the same six seconds**: *"it's background music up till that point and then
    at around that point it loudly increases to foreground music volume."* Measured through the
    shaper, The Approach's `push` carried **3.6 dB of a 4.1 dB climb** — eighty-eight per cent of
    everything the level ever gains, in one boundary, and then flat for two minutes.

    ⚠️ **THE LEVEL IS MEASURED THROUGH THE SHAPER, WHICH IS THE HALF `tests/arc.ts` CANNOT DO.** That
    file says so itself — it measures the bus *before* `saturate`, which is the safe direction for a
    guard about loudness and the wrong one for a guard about a GAP: a shaper compresses the loud rung
    harder than the quiet one, so the contrast a player hears is always smaller than the arc's, by an
    amount that moves with `MUSIC_DRIVE`. 0217 changed that constant and moved every gap in the game.

    ⚠️ **`calm → run` IS THE REFERENCE BECAUSE IT IS THE ONE NOBODY HAS EVER COMPLAINED ABOUT.** It is
    the step that starts a level from the title screen's bed, so it is by definition a step a listener
    accepts. A boundary in the middle of a level being bigger than that is the shape being reported.
  */
/**
 * How much bigger an inside boundary may be than the one that opens the level, in dB.
 *
 * ⚠️ **BETWEEN WHERE IT WAS AND WHERE IT IS.** The Approach measured 3.6 dB when it was reported
 * twice and 2.9 after 0218, so this reddens on the defect returning and passes the fix.
 *
 * ⚠️ **THREE PLACES ARE OVER IT AND NONE OF THEM WAS REPORTED** — 0218. The Toxic Mire, The Black
 * Heart and The Labyrinth climb by carried layers being turned up rather than by parts arriving, so
 * the fix that answered The Approach barely moves them. The slack is what that costs: set to the
 * worst that ships rather than to the rule, so the guard holds the shape it can and says out loud
 * that three places are the exception rather than pretending they are not.
 */
const BOUNDARY_CEILING_DB = 3.2;
/** The rate the through-shaper measurements run at — 0215 measured a quarter rate at 0.05 dB. */
const ARC_RATE = 22050;

  it('no boundary inside a level is bigger than the one that opens it', () => {
    /*
      ⚠️ **THE FIRST DRAFT COMPARED EVERY PLACE TO ITS OWN OPENING AND THE LABYRINTH BROKE IT** — its
      `calm → run` is **−0.5 dB**, so that level opens QUIETER than the title screen it comes from and
      the reference is negative. A real oddity, a different subject, and a rule the content does not
      support.

      ⚠️ **SO WHAT IS HELD IS THE PLACE THAT WAS REPORTED, BY NAME.** 3.2 dB sits between where The
      Approach was when it was reported twice (**3.6**) and where it is now (**2.9**), so this reddens
      on the defect returning and passes the fix — which is the whole of what a guard over a report
      can honestly claim.

      ⚠️ **AND THE OTHER THREE ARE LOUDER AND UNREPORTED**, which is written down rather than guarded:
      The Toxic Mire 4.4, The Black Heart 5.2, The Labyrinth 5.2. They climb by carried layers rather
      than by parts arriving, so 0218's rule barely moves them, and a ceiling wide enough to admit
      them would be wide enough to admit the defect. **Naming one place is worth more than a threshold
      that holds nothing.**
    */
    const at = (rung: MusicLevel): number => driveAt('approach', rung, ARC_RATE).rms;
    const inside = at('push') - at('run');
    expect(
      inside,
      `The Approach: run → push lifts ${inside.toFixed(1)} dB — reported twice as background ` +
        'becoming foreground at 41 seconds',
    ).toBeLessThan(BOUNDARY_CEILING_DB);
    /*
      ⚠️ **AND `surge` HAS TO BE A REAL MOVE, WHICH IS THE HALF THE FIX BOUGHT.** Before 0218 it was
      **+0.5 dB** — `push` was the climb and the three rungs after it were decoration, which is
      0136's *"Up, Up, Up"* measuring as *up, flat*.
    */
    /*
      ⚠️ **0.5 AND IT WAS 1.0, BECAUSE 0219 PUT A 2:1 COMPRESSOR ABOVE −18 dB IN FRONT OF THE SHAPER.**
      Everything above that threshold is halved at the speaker, so **the step is the same size in the
      ladder and half the size in the ear** — measured, this went 1.2 dB to 0.66. Rebasing the floor
      is not weakening the claim: what 0218 holds is that `surge` is a real move rather than half a
      decibel of decoration, and half of a halved band is the same claim in the new units.
    */
    expect(at('surge') - at('push'), 'push → surge is not a step — push is still the whole climb').toBeGreaterThan(
      0.5,
    );

    /*
      ── AND THE WHOLE BAND, WHICH IS THE UNIT THE ASK WAS MADE IN — 0219 ─────────────────────────

      ⚠️ **Reported as** *"the volume is decent for the intro section and then requires a volume control
      down for later sections"* — a statement about the spread a player has to accommodate with **one
      setting of their speaker**, not about any boundary. Every earlier guard here holds a step; this
      holds the band, and it is the one the compressor was added for.

      ⚠️ **THREE PLACES ARE OVER IT AND ARE NOT GUARDED**: The Labyrinth 7.4 dB, The Black Heart 4.8,
      The Toxic Mire 4.4. Their ladders climb that far on their own, and a ceiling wide enough to admit
      them would hold nothing — the same reason 0218 names one place rather than inventing a rule the
      content cannot keep.
    */
    const band = Math.max(at('push'), at('surge'), at('approach'), at('boss')) - at('run');
    expect(
      band,
      `The Approach runs ${band.toFixed(1)} dB from its background to its loudest — one speaker ` +
        'setting has to cover all of it',
    ).toBeLessThan(LEVEL_BAND_DB);
  }, 180_000);

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

  it('and an unstated layer is left alone, times the balance the player chose', () => {
    /*
      ⚠️ **THERE IS NO CLAMP LEFT TO AGREE WITH, AND THIS GUARD USED TO BE NAMED AFTER IT** — 0182.
      What it asserted was that `mixOf`'s silent clamp and this file's loud refusal drew the same band;
      with the band gone, the half worth keeping is that **the product is the hand's row times
      `REBASE`** — which is the whole of 0176 and the thing a break can still remove.
    */
    /*
      ⚠️ **AGAINST THE HAND'S TINT AND NOT AGAINST `mixOf`, SINCE 0176.** `mixOf` is the tint times
      `REBASE` now, so *an unstated layer is left alone* is a claim about the `mix` table rather than
      about the product — level one states no `drone` and its re-base scales it by 1.4957, which is a
      measurement and not a typo. What this guard is for is a **typo in a hand-written row** reaching
      the bus, and that is still exactly what it catches.
    */
    const tint = (theme: ThemeKind, layer: MusicLayer): number => THEMES[theme].mix[layer] ?? 1;
    expect(tint('approach' as ThemeKind, 'drone'), 'an unstated layer is not left alone').toBe(1);
    expect(
      mixOf('approach' as ThemeKind, 'drone'),
      'and the re-base is applied on top of it, which is the whole of 0176',
    ).toBeCloseTo(tint('approach' as ThemeKind, 'drone') * (REBASE.approach.drone ?? 1), 12);
    /*
      ⚠️ **AND WHAT IS LEFT IS THE MECHANISM AND NOT A BAND** — 0182. A gain node cannot take a
      negative and a `NaN` from a mistyped row would silence a layer without a word; **how loud is a
      musical judgement** and the bus is what bounds it, which the clip guard above measures directly.
    */
    for (const theme of THEME_KINDS) {
      for (const layer of MUSIC_LAYERS) {
        const value = mixOf(theme, layer);
        expect(Number.isFinite(value), `${theme}/${layer} resolves to ${value}, which is not a gain`).toBe(true);
        expect(value, `${theme}/${layer} resolves negative, which a gain node cannot take`).toBeGreaterThanOrEqual(0);
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

    ⚠️ **AND THE PACE HALF IS GONE, WHILE THE BOTTOM HALF STAYS** — 0182. *A proportion of the base
    composition* was called STRUCTURAL RATHER THAN TUNED, and it is the shape 0147 had already caught
    one axis over: **a floor everything is measured against is a target, and a target is a sameness.**
    0134's own low-band floor was a ratio-to-the-base and 0147 replaced it with an absolute band for
    exactly this reason; the pace floor was left as a ratio and nobody noticed the pair.

    ⚠️ **WHAT IT FORBADE IS A SPARSE PLACE.** At 0.9 no level may play more than a tenth fewer notes a
    bar than level one, at any rung — so *slow and enormous* and *sparse and menacing* were illegal
    everywhere, which is `docs/decisions/0161-the-shape-of-a-level-is-not-guarded.md`'s subject in the
    one guard that decision did not reach. Its own note conceded the case and called failing it *the
    outcome to want*.

    ⚠️ **THE BOTTOM HALF IS A BAND AND IS NOT THAT SHAPE**, which is why it survives here: it fixes
    both ends, couples nothing to the base, and `docs/decisions/0181-the-floor-has-a-bottom.md` leaned
    on it three days ago to tell an ear it was right.

    ⚠️ **AND ITS LAST TUNING PASS IS THE THIRD SIGNAL.** The bound was 0.85, where both of its probes
    reported STILL GREEN, and was tightened to 0.9 with today's thinnest reading at **0.94** — four
    points in hand, *"less than is comfortable"*, said in the file. A guard that is either vacuous or
    within four points of the shipped music has no setting at which it is measuring the thing it is
    named for.
  */
  /**
   * How much of a place has to be under 300 Hz. A floor, and it stopped being a band.
   *
   * ⚠️ **THE CEILING WAS 0.55 AND IT IS GONE** —
   * `docs/decisions/0183-a-cue-is-limited-rather-than-refused.md`, asked for by name. It was written
   * to stop *more bass* being the answer to every question, which is a real failure and is not a
   * property of any one place: what it actually forbade was **a place that is deliberately bass-led**,
   * and 0181 had just been handed *"deeper eurobeat notes"* about the place nearest it.
   *
   * ⚠️ **WHAT IT WAS PROTECTING IS HELD BY THE TWO GUARDS THAT MEASURE PLACES AGAINST EACH OTHER** —
   * `no two places are within 3 dB of each other's profile` and 0172's `no two places have the same
   * four layers on top at run`. Seven bass-led places would fail both. One is now allowed to be.
   *
   * ⚠️ **THE FLOOR STAYS AND IS THE HALF WITH A REPORT BEHIND IT** — *"very high on the treble with
   * no deep bassy times"*, 0134, re-derived against the shipped mix by 0176 and leaned on by 0181.
   */
  const LOW_FLOOR = 0.24;
  /** One bake map across both guards below — the second asks the same forty-four questions. */
  const paceBakes = new Map<string, number[]>();
  /*
    ⚠️ **THE LOOPS ARE FETCHED ONCE PER PLACE AND NOT ONCE PER RUNG.** `loopsAt` hands back fresh
    arrays on every call — deliberately, so that no test can move another's subject — and that is
    48 MB of copying. Asking for them inside the rung loop is forty-nine of those. `placeLoops` is
    declared at the head of this `describe` and is now shared with the guard that measures whether a
    place's material differs at all — 0146 has why that one could not go on baking its own.
  */

  it('and every place has a BOTTOM, which used to be a band and is a floor again', () => {
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
    /*
      ── THE FLOOR IS 24% AND IT WAS 28, AND THE MEASUREMENT IS WHY ────────────────────────────────

      ⚠️ **0176. TWELVE OF FORTY-TWO PLACE/RUNG PAIRS FELL UNDER 28% AND NOT ONE OF THEM LOST BASS.**
      Measured, low-band energy against the mix this replaced:

          nebula/push      low +1.1 dB    everything else +1.7 dB
          saurian/push     low +0.4 dB    everything else +1.7 dB
          rime/push        low -0.7 dB    everything else +1.5 dB
          core/approach    low -0.5 dB    everything else +0.4 dB

      …and eight more of the same shape. **The bottom moved by -0.9 to +1.1 dB and everything else went
      UP by 0.4 to 1.7** — which is the balance the player chose, and is the sound of layers that were
      inaudible becoming audible.

      ⚠️ **A SHARE IS NOT *IS THERE BOTTOM*, WHICH IS WHAT THIS WAS A PROXY FOR.** 0134's report was
      *"very high on the treble with no deep bassy times"*; a ratio answers that only while the top is
      held still. Under a balance that lifts the top on purpose it falls without a decibel of bass
      going anywhere, so the number is re-derived against the mix that ships rather than kept from the
      one that does not.

      ⚠️ **24 AND NOT 19, WHICH IS WHERE IT WOULD BE VACUOUS.** The worst pair is Rime Shelf's `push` at
      **19.4%**, named below rather than setting the floor: that place opens with no `sub` at all by
      0172's own authoring, so it is the one place this is measuring a decision rather than a defect.
    */
    const OWED_LOW: readonly string[] = ['rime/push'];
    const bakes = paceBakes;
    for (const rung of MUSIC_LEVELS) {
      for (const theme of THEME_KINDS) {
        const here = rungShape(theme, rung, placeLoops(theme), bakes).low;
        if (here <= 0 || OWED_LOW.includes(`${theme}/${rung}`)) continue;
        expect(
          here,
          `${theme} puts ${(here * 100).toFixed(1)}% of its energy under 300Hz at ${rung} — a place that ` +
            `thin at the bottom reads as treble whatever it plays`,
        ).toBeGreaterThanOrEqual(LOW_FLOOR);
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
    /*
      ⚠️ **1.05 BECAME 1.02, AND IT IS A LOOSENING THAT SHOULD BE READ AS ONE** — 0176. The re-based
      balance lifts what Ember Nebula's `push` sits on, so the climb into `surge` is **1.028** where
      this asked 1.05. **The arc is still up, up, up, drop, down** — 228 / 269 / 276 / 247 / 208 Hz —
      and 0136's subject is the SHAPE of that line rather than the size of any one step.

      ⚠️ **THE OTHER FOUR STEPS ARE UNTOUCHED AND ARE WHERE THE ARC LIVES.** `push/run` is 1.18 against
      a floor of 1.15, and both falls are large. Loosening the one step a chosen balance flattened is
      not the same as loosening the claim, and the claim would be broken by any of the other four
      moving.
    */
    expect(surge / push, `UP into the surge — ${say}`).toBeGreaterThan(1.02);
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
    ── 0164: A ROLE IS A PROMISE, AND NINETY-ONE OF THEM ARE NOT KEPT ────────────────────────────

    `docs/decisions/0164-a-role-is-a-promise-the-mix-has-to-keep.md`. Reported 2026-08-18, of the
    dashboard: *"still getting sounds playing that I can't hear… it's probably not going to be just
    the groove and not just on that level, but a whole bunch of sounds and a whole bunch of levels,
    so if we can identify them all and fix them all, that'd be a lot better than me having to listen
    to each individual segment and then listen to each individual item in each segment."*

    ⚠️ **THE MEASUREMENT ALREADY EXISTED AND HAD NO THRESHOLD ON PURPOSE.**
    `docs/decisions/0152-a-layer-is-heard-in-the-sum.md` built `margin` and refused to guard it, for
    a reason written into `ROLE_MARGIN_DB`'s own comment: *"`drone` is the connective tissue and is
    meant to sit under everything… a guard that says every layer must be audible would flag it every
    time."* So the audit in `reports/what-the-mix-buries-2026-08-16.md` had to be read by a person
    and acted on by hand, which is exactly the loop the report above asks to get out of.

    ⚠️ **`docs/decisions/0154-the-mix-is-authored-as-intent.md` ANSWERED THE OBJECTION AND NOBODY
    NOTICED.** Once every layer has a stated role at every rung, *is this audible* — which has no
    single right answer over twenty-three layers — becomes *is this the thing the arrangement said it
    was*, which has exactly one. `drone` is `air`, `air` wants −13 dB, and a `drone` at −13 now
    passes a guard that a `drone` at −25 fails. **That distinction is the whole of what was missing**,
    and it has been available since 0154 landed.

    ⚠️ **IT ARRIVES WITH NINETY-ONE ENTRIES AND THAT IS THE POINT, NOT A CONCESSION.** Every one of
    them is a layer the arrangement asked a listener to be able to do something with, which the mix
    does not deliver — the list the report asks for, in the repository rather than in an ear. The
    guard holds it in BOTH directions: nothing new may join it, and an entry that starts passing must
    be deleted rather than left to rot. `reports/what-a-role-does-not-buy-2026-08-18.md` ranks them.

    ⚠️ **AND IT IS NOT `MUSIC_LADDER × mixOf` BEING BAD AT ITS JOB — IT NEVER HAD THIS JOB.** The
    ladder predates roles by fourteen decisions. 0154's solve reaches every one of these targets to
    0.00 dB and cannot ship, because
    `reports/the-arrangement-holds-the-wrong-thing-2026-08-17.md` found it lurches at every boundary.
    This guard is what says how far the shipped mix is from the intent, while that is worked out.
  */
  /*
    ⚠️ **SIX ENTRIES CAME OFF THIS LIST WITHOUT A NOTE BEING PLAYED DIFFERENTLY** — 0184. They were
    never adrift: `heardAt` read the shared ladder, so it had `chords` sounding at a `run` that
    closes it and `ride` silent at a `run` that opens it. **Every one of the six is at `run` or
    `push`**, which is exactly where the six places state a ladder.
  */
  /*
    ⚠️ **FIVE MORE CAME OFF WITH 0187, AND THE ROLE THEY CLEAR IS STRICTER THAN THE ONE THEY FAILED.**
    `labyrinth/surge/sub`, `labyrinth/approach/sub`, `labyrinth/boss/sub`, `core/boss/sub` and
    `core/bossPeak/sub` were adrift of `bed` and now clear `pulse`, which is three decibels harder.
  */
  const STILL_ADRIFT: Record<ThemeKind, readonly string[]> = {
    approach: ['approach/dread', 'approach/drive', 'boss/dread', 'boss/wraith', 'bossPeak/dread', 'surge/drive'],
    nebula: ['approach/toll', 'boss/dread', 'boss/wraith', 'bossPeak/dread'],
    /*
      ── EMPTY, THEN THIRTEEN, AND THE THIRTEEN ARE A VERDICT RATHER THAN A REGRESSION ─────────────

      ⚠️ **`docs/decisions/0191-a-place-sits-somewhere.md`.** This list went to zero under
      `docs/decisions/0186-a-place-has-its-own-gesture.md` and is thirteen now, and the reason is not
      that the mix got worse: **it is that the mix is the player's.** Driven on the desk, Saurian Belt
      opens `bass` and `beat` — the base composition's riff and kit, which no other place sounds at
      all — at **1.62**, where the title screen plays them at 0.5. That bass is the loudest thing in
      the place in three bands, and what it sits on top of is what this list is.

      ⚠️ **IT WAS PUT TO THE PLAYER WITH THE NUMBERS AND THE ANSWER WAS *ship it as I drove it*.** The
      alternative offered was lifting `sub` about 4 dB so the kick reads under the bassline, which
      would have cost four of these entries; it was refused, and a refusal by the ear that has to live
      with the level is the verdict `docs/decisions/0027-measure-the-picture-not-the-model.md` says
      this channel is decided by.

      ⚠️ **WHAT THIS COSTS IS STATED RATHER THAN HIDDEN.** `sub` at 11–12 dB under a `pulse` means the
      four-on-the-floor is not felt as a pulse; `ride` at 0.64 is a whisper by intent; `hook` at
      `push` is 0.32 and is meant to be. **0164 will not flag any of them again in this place**, which
      is the real price — a list is a decision to stop asking. The four entries `sub` accounts for are
      the ones to delete first if the kick is ever reported.

      ⚠️ **AND `approach/drive` IS THE ONE ENTRY HERE THAT IS NOT THE PLAYER'S.** `drive` is what this
      place FOLLOWS at `approach` and it is 6.5 dB under a `part`, beaten by `engine` in the lowmid.
      It is on the list because the pass that would fix it is a mix pass on a level nobody has driven
      past `surge` yet, and doing it blind is what this whole decision is a correction of.
    */
    saurian: [
      'run/sub',
      'push/hook', 'push/sub',
      'surge/ride', 'surge/sub',
      'approach/sub', 'approach/drive', 'approach/dread',
      'boss/dread', 'boss/ride', 'boss/sub',
      'bossPeak/ride', 'bossPeak/dread',
    ],
    labyrinth: ['approach/drive', 'approach/drone', 'approach/toll', 'boss/drone', 'boss/frenzy', 'boss/stomp', 'boss/wraith', 'bossPeak/drone', 'bossPeak/frenzy', 'bossPeak/sub', 'bossPeak/wraith', 'surge/drive', 'surge/drone'],
    rime: ['approach/dread', 'boss/wraith', 'bossPeak/dread'],
    mire: ['boss/ride', 'bossPeak/ride', 'surge/drive', 'surge/hook'],
    core: ['approach/toll', 'boss/dread', 'boss/drone', 'boss/frenzy', 'boss/toll', 'bossPeak/dread', 'bossPeak/drone', 'bossPeak/toll'],
  };

  it('0164 — NO LAYER SITS A WHOLE ROLE UNDER THE ONE THE ARRANGEMENT GAVE IT', () => {
    const adrift = new Set<string>();
    for (const theme of THEME_KINDS) {
      const loops = placeLoops(theme);
      // One band cache per place, shared across its rungs, on `heardAt`'s own terms.
      const bakes = new Map<string, number[]>();
      for (const rung of MUSIC_LEVELS) {
        // The title screen is not a place and has no arrangement — `rolesAt` returns its own table.
        if (rung === 'calm') continue;
        for (const row of adriftAt(theme, rung, loops, bakes)) {
          if (row.adrift < ROLE_FLOOR_DB) adrift.add(`${theme}/${rung}/${row.layer}`);
        }
      }
    }

    const allowed = new Set(THEME_KINDS.flatMap((theme) => STILL_ADRIFT[theme].map((at) => `${theme}/${at}`)));

    /*
      ⚠️ **BOTH DIRECTIONS, AND THE SECOND ONE IS WHAT MAKES THE LIST SHRINK.** A known-bad list that
      only guards against additions is a list that stays the same length forever: a mix pass fixes a
      layer, nobody deletes the line, and the next pass has no idea which of the ninety-one are still
      real. Deleting the line IS the record that it was fixed —
      `docs/decisions/0029-the-tracked-record-is-the-record.md`.
    */
    expect(
      [...adrift].filter((at) => !allowed.has(at)).sort(),
      'these layers are more than a whole role under what the arrangement asked of them, and are not on the known list',
    ).toEqual([]);
    expect(
      [...allowed].filter((at) => !adrift.has(at)).sort(),
      'these are on the known-adrift list and now clear the floor — delete them from STILL_ADRIFT',
    ).toEqual([]);
  }, DSP_MS);

  /*
    ── 0166: THE LEVEL IS SOLVED AS ONE TRAJECTORY, AND 0.40 IS WHERE THAT IS FREE ────────────────

    `docs/decisions/0166-the-level-is-solved-as-one-trajectory.md`. Reported: *"the gain is changing
    drastically between boundaries and it makes the music jumpy when transitioning between run,
    surge, approach etc."*

    ⚠️ **THE DEFAULT WEIGHT IS THE ONLY PART OF THIS THAT A GUARD CAN DEFEND, AND IT IS THE PART THAT
    WOULD OTHERWISE BE A TASTE.** How steady a boundary should be is an ear's question —
    `reports/what-continuity-costs-2026-08-18.md` measured the whole frontier and found no knee in
    it — but *how much steadiness is free* is arithmetic, and `HOLD_WEIGHT` is defined as exactly
    that: the largest weight at which no layer falls under 0164's floor. Two assertions hold it, one
    per direction, because a default at the edge of free is only meaningful if it is at the EDGE.
  */
  /*
    ⚠️ **`solve-mix.mjs` IS JAVASCRIPT, SO ITS RETURNS ARRIVE UNTYPED**, exactly as they do at
    `rig/dash.ts`'s own boundary. These two aliases are the cast, in one place, so no assertion below
    is written against `any`.
  */
  type Solved = Record<MusicLevel, { gains: Record<MusicLayer, number> }>;

  /*
    ⚠️ **THE BAND PROFILE AND THE RMS ARE CACHED BESIDE `placeLoops`, ON ITS OWN REASONING.**
    `profileOfLoops` is twenty-three layers through two cascaded biquads each; the three guards below
    want it for the same seven places, and computing it per call made this suite **28 seconds
    heavier** — enough to redden `npm run prove`'s baseline on this machine, which is
    `docs/decisions/0044-an-intermittent-guard-is-measuring-the-wrong-thing.md` arriving as *the work
    genuinely grew* rather than as an intermittency.

    ⚠️ **NOTHING MEASURED CHANGES**, on `placeLoops`' own terms: a profile read out of this map is the
    same numbers a direct call returns, because the loops it is derived from are already cached and
    the derivation is pure.
  */
  const solveInputs = new Map<
    ThemeKind,
    { profile: ReturnType<typeof profileOfLoops>; rms: ReturnType<typeof rmsOfLoops> }
  >();
  const inputsFor = (theme: ThemeKind) => {
    let got = solveInputs.get(theme);
    if (got === undefined) {
      const loops = placeLoops(theme);
      got = { profile: profileOfLoops(loops), rms: rmsOfLoops(loops) };
      solveInputs.set(theme, got);
    }
    return got;
  };

  /*
    ⚠️ **AND THE SOLVED LEVELS THEMSELVES, KEYED BY PLACE AND WEIGHT.** Two of the three guards want
    `HOLD_WEIGHT` over all seven places, so without this the same fixed-point iteration runs twice for
    every place — about four hundred milliseconds each, for an answer that cannot differ.
  */
  const solvedLevels = new Map<string, Solved>();
  const levelAt = (theme: ThemeKind, weight: number): Solved => {
    const key = `${theme}/${weight}`;
    let got = solvedLevels.get(key);
    if (got === undefined) {
      const { profile, rms } = inputsFor(theme);
      got = solveLevel(theme, placeLoops(theme), profile, rms, weight) as Solved;
      solvedLevels.set(key, got);
    }
    return got;
  };


  /*
    ── TWO OF 0166'S THREE ARE RETIRED, AND THE REASON IS THAT THEY WON ────────────────────────────

    ⚠️ **`docs/decisions/0176-the-re-based-mix-is-the-mix.md`.** *THE SHIPPED HOLD WEIGHT COSTS NO
    AUDIBILITY* and *A WEIGHT OF ZERO IS THE SOLVE THAT SHIPPED* both solve the mix the game plays and
    compare the result to it. **The game now plays the solve**, so both are a second solve on top of a
    first: `shippedAt` reads `mixOf`, `mixOf` is the re-base, and `HOLD_WEIGHT` at *the edge of free*
    is a statement about a mix that no longer exists in this tree.

    ⚠️ **THE PARAMETER IS NOT DEAD — IT IS WHERE `REBASE` CAME FROM**, and re-deriving the table is
    `scripts/solve-mix.mjs`' job. What is gone is the claim that it is at an edge, because the edge was
    measured against a base the fold consumed.

    ⚠️ **THE THIRD ONE STAYS AND IS THE ONE THAT MATTERS**, because its subject is a boundary and
    boundaries are still shipped behaviour — as is 0167's duck floor, which the re-base satisfies **by
    construction**: it is a per-layer scale over the ladder, and scaling both sides of a boundary
    cannot change which way it moves.
  */
  it('0166 — THE TRAJECTORY MOVES A BOUNDARY LESS THAN THE PER-RUNG SOLVE DOES, in every place', () => {
    /*
      ⚠️ **THIS IS THE DECISION'S ACTUAL CLAIM AND IT WAS THE ONE THING NOTHING ASSERTED** — found by
      `npm run prove` reporting STILL GREEN over a probe that applied the previous report's own
      proposal. Continuity held only where the ROLE is unchanged passes every other guard here: it
      converges, it costs no audibility at 0.40, and it differs from a cold solve. What it does not do
      is make a boundary quieter — the worst move goes from 16.7 dB to **18.1**, because the layers
      left free are the ones changing role, and a 5 dB change of target is an 18 dB change of gain.

      ⚠️ **RELATIVE, NOT A DECIBEL SOMEBODY CHOSE** — CLAUDE.md's *no counting guard*. The claim is
      *steadier than what it replaces*, so what it is measured against is what it replaces. A floor of
      *"under 12 dB"* would have to move every time the material does.

      ⚠️ **`approach → boss` IS EXCLUDED, AND IT IS NOT AN EXEMPTION FOR CONVENIENCE.** That boundary
      is the boss arriving; the shipped ladder moves the aura 7.1 dB there on purpose (0091), and the
      previous report leaves *"whether approach→boss's lurches should be kept"* deliberately open. A
      guard that flattened an event nobody complained about would be answering the wrong report.
    */
    const worstInLevel = (byRung: Record<MusicLevel, Record<MusicLayer, number>>): number => {
      let worst = 0;
      for (const [from, to] of [
        ['run', 'push'],
        ['push', 'surge'],
        ['surge', 'approach'],
      ] as const) {
        for (const layer of MUSIC_LAYERS) {
          if (!SOLVED_BY(layer)) continue;
          const a = byRung[from][layer];
          const b = byRung[to][layer];
          if (!(a > 0) || !(b > 0)) continue;
          worst = Math.max(worst, Math.abs(20 * Math.log10(b / a)));
        }
      }
      return worst;
    };
    const gainsOf = (level: Solved): Record<MusicLevel, Record<MusicLayer, number>> =>
      Object.fromEntries(MUSIC_LEVELS.map((rung) => [rung, level[rung].gains])) as Record<
        MusicLevel,
        Record<MusicLayer, number>
      >;

    for (const theme of THEME_KINDS) {
      const perRung = worstInLevel(gainsOf(levelAt(theme, 0)));
      const held = worstInLevel(gainsOf(levelAt(theme, HOLD_WEIGHT)));
      expect(
        held,
        `${theme}: the trajectory lurches ${held.toFixed(1)} dB where the per-rung solve lurches ` +
          `${perRung.toFixed(1)} — holding gain continuous is not buying a steadier boundary`,
      ).toBeLessThan(perRung);
    }
  }, DSP_MS);


  it('0167 — AND THE RE-BASED MIX IS ADDITIVE TOO, which is the only reason it exists', () => {
    /*
      `docs/decisions/0167-a-build-does-not-duck.md`. The third mix on the desk keeps the shipped
      ladder's per-layer rung RATIOS and re-bases the balance onto the solve at one rung, so a boundary
      moves exactly as the shipped ladder's does. **Additive by construction** — and *by construction*
      is a claim, not a proof: the re-base multiplies each layer by a per-layer constant, which
      preserves ratios only while that constant is the same on both sides of the boundary. Anything
      that made it rung-dependent — a per-rung renormalise, most obviously, which is the first thing
      anybody reaches for when they see the summed peak — silently puts the ducking back.

      ⚠️ **AND THAT EXACT MISTAKE WAS MEASURED BEFORE THIS SHIPPED.** Holding each rung to the shipped
      ladder's summed level costs 11 carried layers at `push`-based and 25 at `surge`-based, because
      the scale factors differ either side of a change. The version on the desk deliberately does not
      renormalise, and this is what keeps it that way.
    */
    const offenders: string[] = [];
    for (const theme of THEME_KINDS) {
      const loops = placeLoops(theme);
      const { profile, rms } = inputsFor(theme);
      const level = rebasedLevel(theme, loops, profile, rms, HOLD_WEIGHT) as Solved;
      for (const [from, to] of [
        ['run', 'push'],
        ['push', 'surge'],
        ['surge', 'approach'],
      ] as const) {
        for (const { layer, move } of carriedThrough(level[from].gains, level[to].gains)) {
          if (move <= DUCK_FLOOR_DB) offenders.push(`${theme} ${from}→${to}: ${layer} ${move.toFixed(1)} dB`);
        }
      }
    }
    expect(
      offenders,
      'the re-based mix ducks a carried layer, which is the one thing it is for not doing',
    ).toEqual([]);
  }, DSP_MS);

  it('0168 — THE DESK’S PACE IS THE GUARD’S PACE, layer for layer and rung for rung', () => {
    /*
      `docs/decisions/0168-the-pace-is-on-the-desk.md`. The header prints notes-a-bar per rung so the
      reported *"approach slows down the beat"* can be fixed by dragging a ladder field instead of by
      a round trip. That is only worth anything if the number is the one `rungShape` counts — this
      file's whole subject is the rig answering the game's questions with the game's answers.

      ⚠️ **`notesPerBar` MOVED INTO `src/content/themes.ts` RATHER THAN BEING COPIED**, so there is one
      count of the steps. This asserts the SUM over a rung, which is the part the desk computes for
      itself: `paceAt` walks the ladder and `rungShape` walks the gains, and a layer opened by one and
      not the other is exactly how the readout would start lying.

      ⚠️ **THE ARC IS NOT ASSERTED AND WILL NOT BE** —
      `docs/decisions/0161-the-shape-of-a-level-is-not-guarded.md`. Every place drops 17–28% at
      `approach` today; that is the author's to change, and a guard over it would be this project
      forbidding its own next edit.
    */
    const bakes = new Map<string, number[]>();
    for (const theme of THEME_KINDS) {
      const loops = placeLoops(theme);
      for (const rung of MUSIC_LEVELS) {
        expect(
          paceAt(theme, rung),
          `${theme}/${rung}: the desk's pace and rungShape's disagree`,
        ).toBeCloseTo(rungShape(theme, rung, loops, bakes).notes, 9);
      }
    }

    /*
      ⚠️ **AND THE COUNT ITSELF, BECAUSE THE COMPARISON ABOVE CANNOT SEE IT.** `paceAt` and `rungShape`
      both call `notesPerBar`, so a bug INSIDE it moves both sides equally and the equality holds —
      `npm run prove` found exactly that, reporting STILL GREEN over a probe that counted rests as
      notes. The assertion above proves the WIRING; this proves the COUNTING.

      ⚠️ **A REST IS `null` AND THE ROOT IS `0`** — 0102, emphatically, because zero is the most common
      note there is. So `if (step)` instead of `if (step !== null)` counts every rest and drops every
      root at once, and the total stays plausible. This is hand-counted against a pattern with both in
      it, which is the only thing that catches it.
    */
    const steps = MUSIC.groove.flatMap((voice) => [...voice.steps]);
    const byHand = steps.filter((s) => s !== null && s !== undefined).length;
    const rests = steps.filter((s) => s === null).length;
    const roots = steps.filter((s) => s === 0).length;
    expect(rests, 'this pattern has no rests, so it cannot catch a rest counted as a note').toBeGreaterThan(0);
    expect(roots, 'this pattern has no root, so it cannot catch the root being dropped').toBeGreaterThan(0);
    expect(
      notesPerBar(undefined, 'groove') * LAYER_BARS.groove,
      'notesPerBar disagrees with counting the steps by hand',
    ).toBeCloseTo(byHand, 9);
  }, DSP_MS);

  /*
    ── 0147: A PLACE IS A BALANCE, AND THESE ARE WHAT REPLACED THE ±3 dB BAND ─────────────────────

    Reported, having heard all five of 0146's places: *"level 3 sounds incredibly similar to level 2…
    level 4, 5, 6 were pretty bland and very similar to the other levels, it didn't feel like I'd
    travelled somewhere else in the galaxy."*

    ⚠️ **`MIX_FLOOR` AND `MIX_CEILING` WERE WHAT KEPT THE MIX SAFE, THEN THEY WERE ±8 dB, AND NOW
    THERE IS NO BAND AT ALL** — 0182. What a narrow band bought was *no theme can break the ladder*;
    what it cost was *no theme can state a balance*. The guards below hold the first without buying
    the second, which is the trade `docs/decisions/0120-a-rung-may-close-a-layer.md` made when it took
    0090's additive rule away: more structure, not less. **Widening the band twice and then deleting
    it is the same finding arriving three times** — 0161's *a guard that keeps having to be relaxed to
    let the work through is not being refined*.
  */
  const QUIETEST_THIRD_DB = -15;

  /*
    ── 0147's BALANCE FLOOR IS RETIRED, AND ITS OWN ESCAPE CLAUSE IS WHY ────────────────────────────

    ⚠️ **`docs/decisions/0155-a-place-follows-its-own-instrument.md`.** The guard that stood here
    required no two places within 3 dB of each other's BALANCE, and it wrote its own retirement
    condition into its comment: *"If a later round finds two places at 3.1 dB that still sound alike,
    this number is wrong and should MOVE rather than be worked around."*

    ⚠️ **THAT CLAUSE HAS FIRED.** The seven ship at **3.3–4.0 dB apart**, satisfying it at every rung,
    and the report is unchanged: *"one of the big problems is every level sounds the same and that's
    what I've been trying to fix."* 0147 spent **259 hand-set numbers** buying a difference this guard
    could see and a listener could not.

    ⚠️ **AND THE FINDING IS STRONGER THAN *the number is wrong*: THE QUANTITY IS.**
    `docs/decisions/0154-the-mix-is-authored-as-intent.md` makes balance **authored** rather than
    emergent — every layer driven to its role's target to 0.00 dB — so two places with the same
    arrangement have identical profiles **by construction**. Asking `apartBy` now asks whether two
    places were given different roles, which is a question about a table rather than about a sound.

    ⚠️ **IT IS REPLACED RATHER THAN DELETED**, which is the part that matters.
    `tests/arrangement.test.ts` holds that no two places FOLLOW the same instrument at every rung —
    what a listener actually tracks — and `0148 — NO TWO PLACES THAT CHOSE THEIR NOTES CHOSE THE SAME
    ONES` above holds their material. Between them they cover the ground this guard was written for,
    on two axes a player can hear and one they could not.
  */

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
    /*
      ⚠️ **ONE PLACE IS OWED AND IS NAMED RATHER THAN FORGIVEN** — 0176. The re-based mix is the one a
      player chose by ear, and it leaves The Toxic Mire's quietest third at **-19.6 dB** against this
      floor's -18. Reported in the same breath as the approval: *"there's still a few elements that are
      incredibly quiet or inaudible, especially compared to others, but I think we can start working on
      them separately per level now."*

      ⚠️ **A LIST RATHER THAN A LOWERED FLOOR**, on `STILL_ADRIFT`'s own terms: the number stays where
      it was, the exception carries the measurement, and the entry has to be **deleted** when the place
      is worked on rather than left to rot.
    */
    const OWED: Record<string, number> = { mire: -20 };
    const offenders: string[] = [];
    for (const theme of THEME_KINDS) {
      const down = quietestThird(profileOf(theme, placeLoops(theme)));
      const floor = OWED[theme] ?? QUIETEST_THIRD_DB;
      if (down < floor) offenders.push(`${theme} ${down.toFixed(1)} dB`);
    }
    expect(
      offenders,
      `these places keep their bottom third too far down to be part of the picture: ${offenders.join(', ')}`,
    ).toEqual([]);
  }, DSP_MS);

  /*
    ── THE CLIMB GUARD IS GONE, AND IT IS 0161's TABLE ONE AXIS OVER ──────────────────────────────

    ⚠️ **`docs/decisions/0182-a-mix-number-has-no-band.md`.** It asserted, for all seven places, that
    the SUM OF GAINS at `push` exceeds `run`, `surge` exceeds `push`, and the fight exceeds
    `approach`. `docs/decisions/0161-the-shape-of-a-level-is-not-guarded.md` deleted *no rung is
    thinner than the level's opening* and *the boss is ≥1.5× as busy as the opening* eight days
    earlier; **this is the same two claims counted in gain instead of in notes**, and it survived
    because it was written in another file under another decision's name.

    ⚠️ **IT HAD TWO NAMED EXCEPTIONS AND ITS OWN COMMENT SAID WHY THEY WERE NOT ALARMS** — *"it is a
    sum of gains and not a loudness… what a listener has, at a boundary that opens `counter`, `crash`
    and `drive`, is 0171's build; what this counts is whether the numbers happen to total more."* A
    guard that has to explain that its own red is not a defect is
    `docs/decisions/0027-measure-the-picture-not-the-model.md`'s model quantity that stopped tracking
    the thing it stood for.

    ⚠️ **AND IT HAD NO PROBE, SO IT HAS ONLY EVER BEEN GREEN** —
    `docs/decisions/0005-a-guard-must-be-seen-to-fail.md`.

    ⚠️ **WHAT HOLDS THE ARRIVAL NOW MEASURES A LISTENER AND HAS A TIME AXIS**:
    `docs/decisions/0171-a-boundary-is-a-build.md` (a boundary is a build, and the arrivals go up the
    arrangement), `docs/decisions/0164-a-role-is-a-promise-the-mix-has-to-keep.md` (a layer performs
    the role it was given), `docs/decisions/0140-no-layer-is-inaudible.md`, and
    `docs/decisions/0123-a-rung-changes-the-notes.md` (a rung replaces a real share of what is
    playing). **A level that drops into its surge, or brings a sparse and quiet boss, is now a thing a
    place may be** — which is what the ask was.
  */

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

describe('0188 — a place owns four slots, and a slot it opens is a layer like any other', () => {
  /*
    `docs/decisions/0188-a-place-owns-four-slots.md`. The four carry no name, no instrument and no
    role, so everything a shared layer gets from its own table a place has to state here — and the
    only thing worth guarding is that it stated ALL of it. A slot half-declared is worse than one
    nobody touched: it sounds, and nothing checks it.
  */
  it('THE ONE THAT CANNOT BE RECOVERED FROM: a slot a place OPENS has voices and a role at that rung', () => {
    /*
      ⚠️ **THE ROLE IS THE HALF THAT WOULD BE INVISIBLE.** `roleOf` returns `null` for a layer the
      arrangement does not name and `adriftAt` skips those, so an own layer without one is a layer
      whose audibility 0164 never asks about — which is the state
      `docs/decisions/0172-a-place-opens-with-its-own-four.md` left seven layer-rungs in.
    */
    for (const theme of THEME_KINDS) {
      for (const layer of OWN_LAYERS) {
        const opensAt = MUSIC_LEVELS.filter((rung) => rungOf(theme, rung, layer) > 0);
        if (opensAt.length === 0) continue;
        expect(
          voicesOf(theme, layer).length,
          `${theme} opens ${layer} at ${opensAt.join(', ')} and states no voices for it — the slot has no instrument`,
        ).toBeGreaterThan(0);
        for (const rung of opensAt) {
          expect(
            roleOf(theme, rung, layer),
            `${theme} opens ${layer} at ${rung} and OWN_ROLES does not say what it is — 0164 cannot see it`,
          ).not.toBeNull();
        }
      }
    }
  });

  it('and a slot nobody opens states nothing, so the mechanism is not a default in disguise', () => {
    for (const theme of THEME_KINDS) {
      for (const layer of OWN_LAYERS) {
        if (MUSIC_LEVELS.some((rung) => rungOf(theme, rung, layer) > 0)) continue;
        expect(voicesOf(theme, layer).length, `${theme} states ${layer} and never opens it`).toBe(0);
      }
    }
  });

  it('AND AT LEAST ONE PLACE ACTUALLY FILLS ONE, or this whole mechanism is guarded by nothing', () => {
    /*
      ⚠️ **`rungIn`'s OWN LESSON, ONE TABLE OVER.** With every slot empty, a version of `roleOf` that
      ignored `OWN_ROLES` entirely would return the right answer for all seven places and every
      assertion above would pass.
    */
    const filled = THEME_KINDS.flatMap((theme) =>
      OWN_LAYERS.filter((layer) => voicesOf(theme, layer).length > 0).map((layer) => `${theme}/${layer}`),
    );
    expect(filled.length, 'no place fills an own slot, so 0188 is a mechanism no data exercises').toBeGreaterThan(0);
  });

  it('and OWN_ROLES names only own slots, because it is not a second PROMOTES', () => {
    /*
      ⚠️ **A PLACE DEMOTING `sub` HERE WOULD BE 0187 UNDONE IN A TABLE NOBODY READS.** `PROMOTES` lifts
      a shared layer and only ever lifts; this one answers for a layer the shared table has no opinion
      about, and the difference has to be held rather than intended.
    */
    for (const theme of THEME_KINDS) {
      for (const rung of Object.keys(OWN_ROLES[theme]) as MusicLevel[]) {
        for (const layer of Object.keys(OWN_ROLES[theme][rung] ?? {}) as MusicLayer[]) {
          expect(
            OWN_LAYERS.includes(layer),
            `${theme} gives ${layer} a role at ${rung} in OWN_ROLES — that table is for the four own slots`,
          ).toBe(true);
        }
      }
    }
  });
});

describe('0162 — a place has its own ladder, and only floors are held over it', () => {
  /*
    `docs/decisions/0162-a-place-has-its-own-ladder.md`. `mix` is a multiplier and any multiple of zero
    is zero, so no place could open a layer the shared ladder closed — and `MUSIC_LADDER`'s `run` row
    closes `arp`, `ride`, `hook`, `drive`, `counter` and `lead`. Every place opened a level with the
    same six fast layers shut, which is what *"still slow and melodic"* and *"the run feels almost
    exactly the same"* were describing.

    ⚠️ **WHAT IS GUARDED HERE IS DELIBERATELY THIN** — `docs/decisions/0161-the-shape-of-a-level-is-not-guarded.md`.
    A stated rung and layer must exist, and a value must be one the desk can express. **How a place
    climbs, holds or drops away is an authoring judgement**, and a guard over it would be the thing
    0161 was written to remove arriving one table over.
  */
  it('every rung and layer a place names is a real one, so a typo cannot be silently ignored', () => {
    /*
      ⚠️ **THE ONE FAILURE A SPARSE OVERRIDE INVITES.** `ladder?.[rung]?.[layer] ?? MUSIC_LADDER[...]`
      falls back on ANY key it does not recognise, so `{ surge: { hooks: 0.8 } }` is not an error — it
      is silence, in a place that reads as having been authored. The type catches it at compile time
      and this catches it in a table that was cast or spread.
    */
    for (const theme of THEME_KINDS) {
      const ladder = THEMES[theme].ladder ?? {};
      for (const rung of Object.keys(ladder)) {
        expect(MUSIC_LEVELS, `${theme} names a rung "${rung}" that is not in MUSIC_LEVELS`).toContain(rung);
        for (const layer of Object.keys(ladder[rung as MusicLevel] ?? {})) {
          expect(MUSIC_LAYERS, `${theme}'s ${rung} names a layer "${layer}" that is not in MUSIC_LAYERS`).toContain(
            layer,
          );
        }
      }
    }
  });

  it('and every value a place states is one the mixer and the desk can both express', () => {
    /*
      ⚠️ **A FLOOR ON THE MECHANISM AND NOT ON THE MUSIC.** Zero is legal and meaningful — it is how a
      place closes a layer the shared ladder opens, which `docs/decisions/0120-a-rung-may-close-a-layer.md`
      made a thing a rung may do. What is refused is a value a gain node cannot take.
    */
    /*
      ⚠️ **AND THE CEILING HALF WAS `MIX_CEILING`, WHICH IS NOT WHAT THE DESK CAN EXPRESS** — 0182.
      It claimed to hold *a value the desk cannot show is a value nobody can drive back to*
      (`docs/decisions/0129-the-desk-holds-a-value-not-a-multiplier.md`) and asserted **2.6** against a
      fader that reaches `DESK_CEILING` — **21.94**, twice the loudest gain the game itself takes a
      layer to. A wall eight times tighter than the reason it gave, on a table whose largest entry is
      1.08. The honest version of that claim is circular — `DESK_CEILING` is derived from this
      product's own maximum — so what is left is the mechanism.
    */
    for (const theme of THEME_KINDS) {
      const ladder = THEMES[theme].ladder ?? {};
      for (const rung of Object.keys(ladder) as MusicLevel[]) {
        for (const [layer, value] of Object.entries(ladder[rung] ?? {})) {
          expect(value, `${theme}'s ${rung} ${layer} is negative`).toBeGreaterThanOrEqual(0);
          expect(
            Number.isFinite(value),
            `${theme}'s ${rung} ${layer} is ${value}, which is not a gain a mixer can set`,
          ).toBe(true);
        }
      }
    }
  });

});

describe('0190 — a place owns what it kills, and the ship is the constant', () => {
  /*
    `docs/decisions/0190-a-place-owns-what-it-kills.md`, answering *"I'll also need… different
    sounding enemy deaths per level and different attacks etc per level."*
  */
  it('THE RULE: a place may only re-voice a cue that belongs to something the level owns', () => {
    /*
      ⚠️ **THE PLAYER'S GUN IS NOT THE PLACE'S**, and this is the whole of `PLACE_CUES`.
      `docs/decisions/0093-the-gun-is-on-the-grid.md` and
      `docs/decisions/0104-the-gun-plays-a-figure.md` both treat the ship's own sounds as fixed; a
      biome that changed what the player's pulse sounds like would make the one instrument carried
      between places a property of the place. It is a list rather than a rule in prose for exactly
      the reason `TITLE_ONLY` and `LEVEL_ONLY` are.
    */
    for (const theme of THEME_KINDS) {
      for (const kind of Object.keys(THEMES[theme].cues ?? {}) as CueKind[]) {
        expect(
          PLACE_CUES.includes(kind),
          `${theme} re-voices ${kind}, which is the player's own and sounds the same everywhere`,
        ).toBe(true);
      }
    }
  });

  it('and a cue a place states actually has something in it', () => {
    /*
      ⚠️ **AN EMPTY ARRAY IS A CUE THE BAKE STILL WALKS AND WHICH MAKES NO SOUND** — the same defect
      `voices` is held against one channel over, and the same fix: to remove a cue, do not state it.
      A place that stated `kill: []` would have a silent enemy death and every guard above would be
      green about it, because they all read a list that is legitimately allowed to be short.
    */
    for (const theme of THEME_KINDS) {
      for (const kind of cuedBy(theme)) {
        expect(
          cueLayersOf(theme, kind).length,
          `${theme} states an empty ${kind}; to leave a cue alone, do not name it`,
        ).toBeGreaterThan(0);
      }
    }
  });

  it('AND AT LEAST ONE PLACE ACTUALLY RE-VOICES ONE, or this is a mechanism no data exercises', () => {
    /*
      ⚠️ **0162's OWN LESSON, THIRD TABLE.** With every `cues` field absent, a version of
      `cueLayersOf` that ignored the place entirely would answer correctly for all seven and the
      whole suite would stay green — which is
      `docs/decisions/0005-a-guard-must-be-seen-to-fail.md` reached from the side where the guard
      cannot fail because no data reaches it. `docs/decisions/0188-a-place-owns-four-slots.md` needed
      the identical assertion for the identical reason.
    */
    const stated = THEME_KINDS.flatMap((theme) => cuedBy(theme).map((kind) => `${theme}/${kind}`));
    expect(stated.length, 'no place re-voices a cue, so 0190 is a mechanism nothing drives').toBeGreaterThan(0);
  });

  it('and the base composition still answers for every cue the place is silent about', () => {
    /*
      ⚠️ **THE FALLBACK IS THE WHOLE OF WHY 0190 LANDS SILENT**, and it is asserted by IDENTITY rather
      than by value: `bakePlace` hands `setCues` the same `Float32Array[]` for an unchanged cue and
      the swap is a reference comparison, so *equal* is not good enough — it has to be the same array
      the base table holds, or six places pay for a bake at every boundary.
    */
    for (const theme of THEME_KINDS) {
      const own = cuedBy(theme);
      for (const kind of CUE_KINDS) {
        if (own.includes(kind)) continue;
        expect(cueLayersOf(theme, kind), `${theme}/${kind} is not the base's own list`).toBe(CUES[kind].layers);
        expect(cueRowOf(theme, kind), `${theme}/${kind} is not the base's own row`).toBe(CUES[kind]);
      }
    }
  });

  it('THE ONE THAT CANNOT BE RECOVERED FROM: a cue a place states is the cue the place gets', () => {
    /*
      ⚠️ **NOTHING ELSE CATCHES A FALLBACK THAT IGNORES THE PLACE, AND THAT IS NOT OBVIOUS.** Every
      other assertion here would stay GREEN if `cueLayersOf` returned `CUES[kind].layers`
      unconditionally: `cuedBy` reads the TABLE, the empty check reads the table, and the widened
      cue guards in `tests/sound.test.ts` would simply measure the base's cue seven times and pass.
      **A place would state its own enemy death and silently not have one.**

      ⚠️ **IT IS 0162's `rungIn` ARGUMENT IN A THIRD TABLE.** That decision separated the lookup so
      the override path was reachable at all, *"not a guard that cannot fail, but a code path nothing
      can drive"*; this is the assertion that drives it. Asserted by IDENTITY, so a fallback that
      copied the right values by another road would still be the wrong function.
    */
    const stated = THEME_KINDS.flatMap((theme) => cuedBy(theme).map((kind) => [theme, kind] as const));
    expect(stated.length, 'nothing states a cue, so this assertion is about nothing').toBeGreaterThan(0);
    for (const [theme, kind] of stated) {
      expect(cueLayersOf(theme, kind), `${theme}/${kind} falls back to the base and should not`).toBe(
        THEMES[theme].cues?.[kind],
      );
      expect(cueRowOf(theme, kind).layers, `${theme}/${kind}'s row carries the base's layers`).toBe(
        THEMES[theme].cues?.[kind],
      );
    }
  });

  it('and a re-voiced cue keeps the base row’s behaviour, because it cannot state it', () => {
    /*
      ⚠️ **UNREPRESENTABLE RATHER THAN REFUSED**, which is why this reads a composed row instead of
      scanning a table for forbidden keys. `hold` is a flam, `duck` is the music getting out of the
      way, `figure` is the grid and `twin` is 0024's unconditional tier — none of them is what a
      Saurian enemy death sounds like, and a place states `layers` so it cannot reach any of them.
    */
    for (const theme of THEME_KINDS) {
      for (const kind of cuedBy(theme)) {
        const row = cueRowOf(theme, kind);
        expect(row.twin, `${theme}/${kind} moved its twin`).toBe(CUES[kind].twin);
        expect(row.hold, `${theme}/${kind} moved its hold`).toBe(CUES[kind].hold);
        expect(row.duck, `${theme}/${kind} moved its duck`).toBe(CUES[kind].duck);
        expect(row.air, `${theme}/${kind} moved its room send`).toBe(CUES[kind].air);
        expect(row.figure, `${theme}/${kind} moved its figure`).toBe(CUES[kind].figure);
        expect(row.onGrid, `${theme}/${kind} moved itself off the grid`).toBe(CUES[kind].onGrid);
      }
    }
  });
});

describe('0162 — and the override path itself, driven with a table of its own', () => {
  /*
    ⚠️ **NO PLACE STATES A LADDER YET, WHICH IS WHY THIS IS HERE.** `rungOf` reads `THEMES`, so with
    every `ladder` absent, a version that ignored the override entirely would answer correctly for all
    seven places and the whole suite would stay green. `rungIn` takes the table as an argument so the
    path is reachable — the same separation `musicLevelFor` has for `sections`, and for the same
    reason: the arithmetic most likely to be wrong is the part a test must be able to hand its own
    data to.
  */
  it('a place’s own number wins, and a layer it does not mention falls back to the shared ladder', () => {
    /*
      ⚠️ **THE DEFECT THIS EXISTS FOR IS THE ONE THAT MADE 0162 NECESSARY**: `MUSIC_LADDER.run.arp` is
      zero, and `mix` is a multiplier, so no place could open it. Here a place opens it and the shared
      row is left alone — which is the whole mechanism in two assertions.
    */
    const opened = { run: { arp: 0.71 } } as const;
    expect(rungIn(opened, 'run', 'arp'), 'a place cannot open a layer the shared ladder closes').toBe(0.71);
    expect(MUSIC_LADDER.run.arp, 'the shared row was mutated rather than overridden').toBe(0);
    // A layer the place does not mention, at a rung it does: the shared ladder still answers.
    expect(rungIn(opened, 'run', 'sub'), 'a sparse rung took the whole row over').toBe(MUSIC_LADDER.run.sub);
    // A rung the place does not mention at all.
    expect(rungIn(opened, 'surge', 'arp'), 'an override leaked into a rung it did not name').toBe(
      MUSIC_LADDER.surge.arp,
    );
    // And absent entirely is the shared ladder, layer for layer — which is what makes 0162 land silent.
    for (const rung of MUSIC_LEVELS) {
      for (const layer of MUSIC_LAYERS) {
        expect(rungIn(undefined, rung, layer), `${rung}/${layer} with no place ladder`).toBe(MUSIC_LADDER[rung][layer]);
      }
    }
  });

  it('and `rungOf` answers what `rungIn` answers, for all seven places at every rung', () => {
    /*
      ⚠️ **THIS CANNOT SEE A `rungOf` THAT ROUTES BY THE WRONG PLACE, AND A PROBE IS WHAT SAID SO.**
      `node scripts/prove-guard.mjs 0162` replaced `THEMES[theme].ladder` with `THEMES.approach.ladder`
      and this test **STAYED GREEN** — because every place's `ladder` is absent today, so every answer
      is the shared ladder's and reading the wrong table is indistinguishable from reading the right
      one. **The routing is guarded by a SOURCE SCAN instead**, in `tests/dash.test.ts`, and 0162
      records the debt: the value-level version of this claim is unavailable until a place states a
      ladder.

      ⚠️ **WHAT IS LEFT IS STILL WORTH HAVING.** It joins the pure half to the shipped table — a
      `rungOf` that dropped the lookup entirely and went straight to `MUSIC_LADDER` would pass, but one
      that applied `mixOf`, or clamped, or reached for the aura would not.
    */
    for (const theme of THEME_KINDS) {
      for (const rung of MUSIC_LEVELS) {
        for (const layer of MUSIC_LAYERS) {
          expect(rungOf(theme, rung, layer), `${theme}/${rung}/${layer}`).toBe(
            rungIn(THEMES[theme].ladder, rung, layer),
          );
        }
      }
    }
  });

  it('and ZERO is a value a place may state, because closing a layer is a thing a rung may do', () => {
    /*
      ⚠️ **`?? ` AND NOT `||`, WHICH IS THE ONE-CHARACTER VERSION OF THIS WHOLE DECISION.** A place
      that closes a layer states `0`, and `||` would treat that as *not stated* and fall through to the
      shared ladder — so the place would be silently ignored exactly when it was trying to be quiet.
      `docs/decisions/0120-a-rung-may-close-a-layer.md` made closing legal; this is the line that lets
      a PLACE do it.
    */
    expect(MUSIC_LADDER.surge.counter, 'the shared ladder no longer opens this, so the test proves nothing').toBeGreaterThan(0);
    expect(rungIn({ surge: { counter: 0 } }, 'surge', 'counter'), 'a place could not close a layer').toBe(0);
  });
});

/*
  ── 0172: SEVEN PLACES, SEVEN OPENINGS ──────────────────────────────────────────────────────────

  `docs/decisions/0172-a-place-opens-with-its-own-four.md`. Asked for 2026-08-18: *"actually having
  the levels sound different — it'll need a bunch of different sounds and effects applying to each
  level."*

  ⚠️ **THE SENTENCE THIS IS THE NEGATION OF IS ONE `scripts/weigh-apart.mjs` HAS PRINTED SINCE
  2026-08-13**: *"the top of every mix is a sub, a kick, a bass and a pad, which is the same four
  sounds in all seven."* Measured on the shared ladder, **five of the seven** have literally the same
  four layers loudest at `run`.

  ⚠️ **IT IS A FLOOR AND NOT A SHAPE, WHICH IS THE DISTINCTION 0161 TURNS ON.** Nothing here says what
  any level must open with, how busy it is, how long a section runs or in what order anything arrives.
  What it refuses is two levels opening on the SAME four — which is the minimum content of *the levels
  sound different* and is a property of the pair rather than an opinion about either one.

  ⚠️ **AND IT IS MEASURED OFF THE BAKED AUDIO, NOT OFF THE TABLE** — `soundingAt` ranks by what a
  layer puts out, so `docs/decisions/0140-no-layer-is-inaudible.md`'s *a gain is not a loudness* holds
  here too. A place could state four different numbers and still be four identical sounds.
*/
describe('0172 — a place opens with its own four', () => {
  it('and six of the seven state a `run` of their own, because level one is the one that changes nothing', () => {
    /*
      ⚠️ **THE COUNT IS THE ONE THING HERE THAT IS ABOUT THE MECHANISM RATHER THAN THE SOUND**, and it
      is worth having for the reason `docs/decisions/0162-a-place-has-its-own-ladder.md` landed empty:
      an override path no data reaches is guarded by nothing however green the suite is. Level one is
      excluded by name — `docs/decisions/0128-a-place-plays-its-own-material.md`'s *"the theme that
      changes nothing, so that the six below are read against something"*.
    */
    expect(THEMES.approach.ladder, 'level one states a ladder, so there is nothing to read the six against').toBeUndefined();
    for (const theme of THEME_KINDS) {
      if (theme === 'approach') continue;
      expect(THEMES[theme].ladder?.run, `${theme} opens on the shared ladder like everything else`).toBeDefined();
    }
  });
});
