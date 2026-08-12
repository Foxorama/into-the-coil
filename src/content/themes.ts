/**
 * The themes: what makes one level a different PLACE from the next.
 *
 * `docs/decisions/0107-a-level-is-a-place.md`.
 *
 * ── WHY THIS EXISTS AND WHY IT IS NOT A SECOND PALETTE ──────────────────────────────────────────
 *
 * Reported from play: *"the same music and boss music repeats level after level after level… the
 * music for the next level needs to be different so it doesn't feel like just one level over and over
 * again"*, and *"I think we're close to the part where we need to introduce the biomes and level
 * themes now to start differentiating levels."* `docs/game.md` has said *"no level is themed yet"*
 * since the levels existed.
 *
 * ⚠️ **A THEME MAY NOT TOUCH AN INK THAT CARRIES MEANING, AND THAT IS THE WHOLE SHAPE OF IT.**
 * `docs/decisions/0024-the-accessibility-floor-is-settings.md` makes the palette a SETTING — a player
 * on high contrast must get the same game — so a theme that recoloured `enemy` or `pickup` would be
 * either an accessibility setting the player did not choose or a difficulty change, and 0024 bans
 * both. What a theme changes is the two roles that exist precisely to carry no meaning: the backdrop
 * everything is found against, and nothing else.
 *
 * ⚠️ **So it composes with the palette rather than replacing it**, which is why `space` below is a
 * value per `PaletteName` rather than one colour. `tests/palette.test.ts` drives every ink of every
 * palette against every theme's backdrop, so a theme cannot be authored that makes a bullet hard to
 * see on high contrast.
 *
 * ── AND WHY THE MUSIC HALF IS A MIX AND NOT A SECOND PIECE ──────────────────────────────────────
 *
 * ⚠️ **MEASURED BEFORE IT WAS DESIGNED.** The eleven loops cost **862 ms and 11.3 MB** to bake, of
 * which the pitched layers are 858 ms and 10.2 MB. Seven themes each with their own transposed set is
 * **6 seconds and 72 MB** — which is not a thing to hold in memory on the mid-range Android
 * `docs/decisions/0022-frame-rate-is-a-feature.md` sizes for, and not a thing to synthesise at a
 * level boundary either.
 *
 * ⚠️ **What is free is the MIX.** A theme carries a gain multiplier per layer, applied over
 * `MUSIC_LADDER`'s own rung, so each level is a different arrangement of one set of material: the
 * same eleven loops, emphasised differently. Nothing is re-baked, nothing is allocated, and a level
 * that leans on the arp and the hook does not sound like one built on the drone and the groove.
 *
 * ⚠️ **THE NEXT LEVER IS DIFFERENT MATERIAL AND ITS COST IS ALREADY MEASURED**, so a later session
 * does not have to find it again: a second and third `chords` progression is 427 ms and 2.15 MB each
 * at the prewarm, and that buys real melodic variety across seven levels shared three ways. It is not
 * done here because this decision already changes the backdrop, the mix and the aura, and a fourth
 * axis would make a play-test unable to say which of them worked.
 *
 * ── AND THAT LEVER HAS NOW BEEN PULLED, ONCE ────────────────────────────────────────────────────
 *
 * ⚠️ **`docs/decisions/0128-a-place-plays-its-own-material.md`.** A theme may state `voices` for the
 * layers it plays differently and shares every layer it does not, so the cost is proportional to how
 * much of a place is new rather than to how many places there are. **Ember Nebula is the first and it
 * re-voices two of twenty-three.**
 *
 * ⚠️ **The paragraph above priced seven whole transposed sets and was right to refuse them** —
 * [`what-seven-compositions-would-cost`](../../reports/what-seven-compositions-would-cost-2026-08-12.md)
 * put 0113's storage model at 672 MB resident. What it did not price is a diff, which is what this is.
 */

import { MUSIC, type MusicLayer, type MusicVoice } from './music.ts';
import type { PaletteName } from './palette.ts';

/**
 * Every theme, in the order the run meets them. Closed —
 * `docs/decisions/0016-a-hub-enumerates-kinds.md`.
 *
 * ⚠️ **These are places rather than the fourteen *Far Carry* biomes, and that is a deliberate
 * deferral rather than an oversight.** `docs/game.md` themes the levels on the predecessor's biomes;
 * `CLAUDE.md` allows opening the predecessor only for a named file and a named reason, and the reason
 * to open it is the FICTION, which is downstream of whether theming works at all. A biome name drops
 * onto a row here without touching anything else.
 */
export const THEME_KINDS = ['approach', 'nebula', 'debris', 'rime', 'forge', 'bloom', 'core'] as const;

/** Derived from the list, so a theme cannot exist in the union and be missing from the table. */
export type ThemeKind = (typeof THEME_KINDS)[number];

export interface ThemeRow {
  /**
   * What the level break calls it — `docs/game.md`'s voice rule: what it is, never why it is good.
   *
   * ⚠️ **On the row rather than in `src/app/chrome.ts`**, for the reason `src/content/styles.ts`
   * gives: a second list of names goes on saying the old thing the day one of them changes.
   */
  title: string;
  /**
   * The backdrop everything is found against, per palette.
   *
   * ⚠️ **PER PALETTE, and that is what keeps 0024 whole.** High contrast is a setting a player chose
   * for a reason; a theme that handed it a purple void would be overriding that choice with a
   * cosmetic one. Each palette states its own version of the place, and
   * `tests/palette.test.ts` holds every ink against every one of them.
   *
   * ⚠️ **It costs nothing at runtime.** `src/render/canvas.ts` holds the clear colour as a field, so
   * a theme change is one property write and no re-bake — which is what makes this affordable at a
   * level boundary that `docs/decisions/0076-a-level-has-an-origin.md` says keeps the scene.
   */
  space: Record<PaletteName, string>;
  /**
   * The colour of the weather hanging in it, per palette.
   *
   * ⚠️ **`docs/decisions/0112-the-sky-has-weather.md`.** Reported: *"needs to be more than streaks and
   * some weird colouration per level. Needs an actual space skyscape with nebulous clouds and such
   * like."* The backdrop above is a flat hue and this is the thing IN it.
   *
   * ⚠️ **PER PALETTE, on exactly `space`'s terms, and 0024 is why.** High contrast is a setting a
   * player chose; a theme that hung a purple cloud in it would be overriding that choice with a
   * cosmetic one. `tests/palette.test.ts` holds every ink against every backdrop, and
   * `tests/budget.test.ts` holds the cloud faint enough that what it sits on is still what everything
   * is found against.
   *
   * ⚠️ **It costs ONE BITMAP at a level boundary rather than a seventh atlas** —
   * `src/render/bake.ts`'s `bakeNebula`, and 0107's own argument about seven transposed pieces of
   * music arriving in the other channel.
   */
  nebula: Record<PaletteName, string>;
  /**
   * How this place mixes the music, as a multiplier over `MUSIC_LADDER`'s own rung.
   *
   * ⚠️ **A MULTIPLIER rather than a ladder, so a theme cannot break the ladder's shape.** 0090's rule
   * is that the ladder only ever opens layers and 0102's is that every rung adds something; a theme
   * that could set gains outright would be able to violate both from a table nobody reads as being
   * about structure. Scaling what the rung already decided keeps the build intact and changes what
   * the build is made of.
   *
   * ⚠️ **Absent means 1**, so a theme states only what it leans on and a reader sees the difference
   * rather than the whole table twice.
   *
   * ⚠️ **Bounded either side by `tests/music.test.ts`** — a multiplier of zero would close a layer the
   * ladder opened, which is 0090's seam arriving through a side door, and one much above 1 would
   * spend the mix's measured headroom.
   *
   * ── AND A THEME CAN NOW SAY SOMETHING ABOUT A BOSS WITHOUT A SECOND TABLE ───────────────────────
   *
   * ⚠️ **`docs/decisions/0108-the-bed-is-felt-and-the-boss-arrives.md`.** Reported: *"how much can we
   * mix it up for the bosses?"* — and the obvious build is a second `bossMix` field, which is a
   * second table to keep in step with this one.
   *
   * ⚠️ **It is not needed, because four layers are now ZERO everywhere except the fight.** `toll`
   * opens at `approach`, and `lead`, `stomp` and the aura only at `boss` — so a multiplier stated
   * against any of them is a statement about the boss and about nothing else, and it costs no field
   * and no guard. Every theme below states at least one, which is what stops seven bosses sharing an
   * arrangement the way they share a behaviour.
   */
  mix: Partial<Record<MusicLayer, number>>;
  /**
   * The layers this place plays DIFFERENTLY, as a replacement for their voices.
   *
   * ── A THEME MAY REPLACE MATERIAL, AND ONLY WHAT IT REPLACES IS BAKED ────────────────────────────
   *
   * ⚠️ **`docs/decisions/0128-a-place-plays-its-own-material.md`.**
   * [0113](0113-there-is-one-composition-and-seven-levels.md) says a theme is a composition and
   * [`what-seven-compositions-would-cost`](../../reports/what-seven-compositions-would-cost-2026-08-12.md)
   * priced its storage model at **672 MB resident** and ruled it out. What that report did not price
   * is the shape below: a theme states the layers it changes and shares every other one, so the cost
   * is proportional to how much of a place is actually new rather than to how many places there are.
   *
   * ⚠️ **Absent means the base composition, and a theme that states nothing has no music of its own**
   * — which is exactly 0113's floor, written as a type rather than as a sentence.
   *
   * ⚠️ **IT REPLACES A LAYER'S WHOLE VOICE ARRAY AND NOT ONE VOICE OF IT.** Indexing into an array by
   * position would make a theme depend on the ORDER of the base's voices, so re-ordering
   * `src/content/music.ts` would silently re-point every override — the class of coupling
   * `docs/decisions/0016-a-hub-enumerates-kinds.md` exists to refuse. A theme may also state FEWER
   * voices than the base, which is how a place gets sparser.
   *
   * ⚠️ **The mix above still applies over the top**, so a place can lean on a layer it has also
   * re-voiced. The two are independent and both are multipliers over the same rung.
   */
  voices?: Partial<Record<MusicLayer, readonly MusicVoice[]>>;
}

/**
 * The lowest a theme may scale a layer to, and the highest.
 *
 * ⚠️ **The floor is not zero.** A theme that silenced a layer the rung had opened would break both
 * *the ladder only opens layers* (0090) and *every rung adds something* (0102) from a table whose
 * subject is colour and mix — and it would do it invisibly, because the ladder's own guards read
 * `MUSIC_LADDER` and never see this. Half is a lean, not a removal.
 *
 * ⚠️ **The ceiling is what the mix's headroom can pay for.** `MUSIC_GAIN` sits under a measured peak
 * (0092, 0104) and a theme is a multiplier on top of it, so `tests/music.test.ts` drives every theme
 * at every rung through the shaper and refuses one that clips.
 */
export const MIX_FLOOR = 0.5;
export const MIX_CEILING = 1.45;

/**
 * Every theme. One per level, in order.
 *
 * ⚠️ **The backdrops are a HAND, on `docs/decisions/0037-the-ship-has-mass.md`'s terms**, and the one
 * thing they are not free to be is bright: every one of them is a near-black, because
 * `src/content/palette.ts` says the void is the thing eight other inks have to be legible against and
 * `tests/palette.test.ts` holds that as a contrast floor per ink per palette. What a theme moves is
 * the HUE of the dark, which is enough to say *somewhere else* and cannot cost a bullet its edge.
 */
/** A rest, written out so a pattern reads as a rhythm rather than as a list of nulls. */
const _ = null;

/**
 * EMBER NEBULA'S TUNE — the notes both of its `call` voices play, an octave apart.
 *
 * ⚠️ **Hoisted because the two voices share it, exactly as the base's two do.** They are one line
 * doubled, and two copies of sixty-four numbers is the second description this repository keeps
 * finding in its own tables.
 *
 * ⚠️ **IT DESCENDS WHERE THE BASE CLIMBS, and that is the whole of what makes it another place.**
 * Level one's `call` walks up to its top note and sits there; this falls from the twelfth to the root
 * twice, turning at the eighth bar. Same key, same progression underneath, opposite shape.
 *
 * ⚠️ **Every value is a tone of A natural minor** (`SCALE` in `src/content/cues.ts`) — the harmony
 * under it is still the base's `chords`, and a theme that re-voiced the tune without re-voicing the
 * progression can only ever be right if it stays in the key. 0128 has why the progression itself is
 * deliberately NOT changed here.
 */
const EMBER_CALL: readonly (number | null)[] = [
  12, _, 10, _, 8, _, 7, _,
  5, _, 7, _, 8, _, 10, _,
  7, _, 5, _, 3, _, 2, _,
  0, _, 2, _, 3, _, _, _,
  8, _, 7, _, 5, _, 3, _,
  5, _, 7, _, 8, _, 12, _,
  10, _, 8, _, 7, _, 5, _,
  3, _, 2, _, 0, _, _, _,
];

/**
 * What Ember Nebula plays instead — 0128.
 *
 * ⚠️ **THE TIMBRES ARE THE BASE'S AND ONLY THE PATTERNS MOVE, WHICH IS A DELIBERATE FIRST STEP.**
 * Every `note` below is copied from `src/content/music.ts` unchanged. The spectrum of this piece is
 * held by a dozen guards — the shed, the band weights, the mix peak, the bus ceiling — and all of
 * them are about what a voice SOUNDS like rather than about what it plays. Changing both at once
 * would mean the first theme in the project could not be judged against anything.
 */
const EMBER_VOICES: Partial<Record<MusicLayer, readonly MusicVoice[]>> = {
  /*
    ⚠️ **THREE VOICES WHERE THE BASE HAS FIVE, WHICH IS HOW A PLACE GETS SPARSER.** Level one's engine
    is a four-on-the-floor with a clap, a shaker and a sixteenth hat over it. This is half-time and
    open: the kick leaves the third beat alone, and the two top voices are gone entirely. *"Warm and
    close"* is as much about what is not playing as about what is.
  */
  engine: [
    {
      steps: [1, _, 0.8, 0.5, 1, _, 0.86, _, 1, _, 0.8, 0.55, 1, 0.62, _, 0.9],
      pitched: false,
      perBeat: 1,
      octave: 0,
      note: { wave: 'sine', from: 150, to: 45, seconds: 0.46, gain: 0.6, attack: 0.001, curve: 3.4, lowFrom: 260, lowTo: 90 },
    },
    {
      steps: [1, _, 0.62, 0.4, 1, _, 0.68, _, 1, _, 0.62, 0.45, 1, 0.5, _, 0.7],
      pitched: false,
      perBeat: 1,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.015, gain: 0.15, attack: 0.0004, curve: 9, highFrom: 1800 },
    },
    {
      steps: [_, _, 1, _, _, _, 0.95, _, _, _, 1, _, _, 0.9, _, 1],
      pitched: false,
      perBeat: 1,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.13, gain: 0.27, attack: 0.002, curve: 4, lowFrom: 3600, lowTo: 1400, highFrom: 400 },
    },
  ],
  call: [
    {
      steps: EMBER_CALL,
      pitched: true,
      perBeat: 1,
      octave: 2,
      // Heavier on the turn than on the downbeat, which is the other half of falling rather than rising.
      accents: [0.86, 1, 0.78, 0.94],
      note: { wave: 'tri', from: 0, to: 0, seconds: 0.344, gain: 0.115, attack: 0.012, curve: 2.2, lowFrom: 2600, lowTo: 900, q: 0.9 },
    },
    {
      steps: EMBER_CALL,
      pitched: true,
      perBeat: 1,
      octave: 1,
      accents: [0.86, 1, 0.78, 0.94],
      note: { wave: 'sine', from: 0, to: 0, seconds: 0.36, gain: 0.042, attack: 0.02, curve: 2, lowFrom: 1400, lowTo: 600 },
    },
  ],
};

export const THEMES: Record<ThemeKind, ThemeRow> = {
  /**
   * Level one. The void as it has always been — this is the theme that changes nothing, so that the
   * six below are read against something rather than against each other.
   */
  approach: {
    title: 'The Approach',
    space: { vivid: '#0b0b14', 'high-contrast': '#000000' },
    nebula: { vivid: '#2b3352', 'high-contrast': '#1c1c28' },
    mix: {},
  },
  /** Level two. Warm and close: the drone and the floor come up, the top end comes down. */
  nebula: {
    title: 'Ember Nebula',
    space: { vivid: '#140b16', 'high-contrast': '#050008' },
    nebula: { vivid: '#5c2a4a', 'high-contrast': '#2a1626' },
    mix: { drone: 1.35, sub: 1.02, chords: 1.15, arp: 0.72, hook: 0.85, perc: 0.7, toll: 1.25 },
    /*
      ⚠️ **THE FIRST PLACE WITH MUSIC OF ITS OWN** — 0128. A half-time engine with two of its five
      voices gone, and a `call` that falls where level one's climbs. The progression underneath is
      still the base's, which is a limit rather than an omission and the decision has why.
    */
    voices: EMBER_VOICES,
  },
  /** Level three. Hard and percussive: the hands lead and the pads get out of the way. */
  debris: {
    title: 'The Debris Line',
    space: { vivid: '#0d1016', 'high-contrast': '#000305' },
    nebula: { vivid: '#2a3a4c', 'high-contrast': '#16222c' },
    mix: { perc: 1.12, engine: 1.04, groove: 1.15, drone: 0.6, chords: 0.78, stomp: 1.08 },
  },
  /**
   * Level four. Thin, bright and fast.
   *
   * ⚠️ **ITS OLD MIX IS NOW THE NEUTRAL ONE, WHICH IS THE WHOLE OF 0108's PACE ITEM.** *"The pace of
   * the music sounded good around level 4, that should be our starting point"* — so what this row
   * used to say lives in `MUSIC_LADDER` and level one starts there. What is left here is what makes
   * it *this* place rather than the floor: the same brightness taken further, and the low end pulled
   * out from under it.
   */
  rime: {
    title: 'Rime Shelf',
    space: { vivid: '#08131a', 'high-contrast': '#000408' },
    nebula: { vivid: '#1e4a5c', 'high-contrast': '#0e2e3a' },
    mix: { arp: 1.3, hook: 1.28, drone: 0.55, sub: 0.62, groove: 0.75, lead: 1.25 },
  },
  /** Level five. Heavy and low: turrets, and a mix that sits underneath them. */
  forge: {
    title: 'The Forge',
    space: { vivid: '#170d08', 'high-contrast': '#080200' },
    nebula: { vivid: '#63321a', 'high-contrast': '#301608' },
    /*
      ⚠️ **`sub` is 1.22 rather than the 1.4 the band allows, and the guard is what said so.** It is
      the layer that decides the bus's peak — `MUSIC_GAIN` has the measurement — so the heaviest place
      in the game is the one row where the ceiling in `MIX_CEILING` is not the real limit. What makes
      this The Forge is that the low end leads *and* the top gets out of its way, which is two
      multipliers rather than one large one.
    */
    mix: { sub: 1.04, groove: 1.3, drone: 1.15, arp: 0.6, hook: 0.7, stomp: 1.15, drive: 0.8 },
  },
  /** Level six. Everything at once, which is what the level is. */
  bloom: {
    title: 'Spore Bloom',
    space: { vivid: '#0f1408', 'high-contrast': '#020600' },
    nebula: { vivid: '#2f4a1c', 'high-contrast': '#18280c' },
    mix: { hook: 1.3, chords: 1.2, perc: 1.2, arp: 1.15, toll: 1.2, drone: 0.7 },
  },
  /** Level seven. The centre: the drone returns and the tune sits on top of it. */
  core: {
    title: 'The Core',
    space: { vivid: '#16080f', 'high-contrast': '#060003' },
    nebula: { vivid: '#5a1e3c', 'high-contrast': '#2c0c1c' },
    mix: { drone: 1.35, lead: 1.3, drive: 1.2, stomp: 1.3, perc: 0.8, hook: 1.1 },
  },
};

/**
 * What `layer` is scaled by in `theme`. The single description of *a theme's mix is a multiplier*.
 *
 * ⚠️ **Clamped rather than trusted**, so a hand that authors 3 gets the ceiling instead of a mix that
 * clips — and `tests/themes.test.ts` refuses the row outright, which is the half that tells somebody.
 */

/**
 * What `layer` is made of in `theme` — its own voices if it states any, the base composition if not.
 *
 * ⚠️ **THE SINGLE DESCRIPTION OF *WHAT DOES THIS PLACE PLAY*.** `src/app/music.ts` bakes through it
 * and `tests/themes.test.ts` measures through it, so a theme that states nothing is provably the same
 * audio rather than merely intended to be — which is what makes sharing a buffer safe.
 *
 * ⚠️ **`undefined` is *no place yet*** — the title screen, a fixture, anything before a level has
 * been entered — and it is the base composition rather than level one's, because level one is a place
 * like any other and may one day state material of its own.
 */
export function voicesOf(theme: ThemeKind | undefined, layer: MusicLayer): readonly MusicVoice[] {
  if (theme === undefined) return MUSIC[layer];
  return THEMES[theme].voices?.[layer] ?? MUSIC[layer];
}

/** Which layers `theme` plays differently from the base. Empty for a place with no music of its own. */
export function revoicedBy(theme: ThemeKind): MusicLayer[] {
  const own = THEMES[theme].voices;
  if (own === undefined) return [];
  return (Object.keys(own) as MusicLayer[]).filter((layer) => own[layer] !== undefined);
}

export function mixOf(theme: ThemeKind, layer: MusicLayer): number {
  const want = THEMES[theme].mix[layer] ?? 1;
  return want < MIX_FLOOR ? MIX_FLOOR : want > MIX_CEILING ? MIX_CEILING : want;
}
