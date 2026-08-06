/**
 * The palettes — the first table in `content/`, and the thing that makes
 * `docs/decisions/0024-the-accessibility-floor-is-settings.md`'s alternate palettes free.
 *
 * `docs/decisions/0022-frame-rate-is-a-feature.md` bakes every sprite from
 * `(kind, variant, palette, view)`, so a palette is an ARGUMENT to the art rather than a filter over
 * it. Switching to high contrast is a re-bake at load, not a second art pass and not a shader.
 *
 * ⚠️ **An ink is a ROLE, never a colour name.** `enemy`, not `red`. The moment a table says `red`
 * the high-contrast palette has to lie about its own name, and the code that reads it starts
 * meaning "the red one" — which is precisely how colour ends up carrying meaning by itself.
 *
 * `tests/palette.test.ts` holds the contrast floors. Every ink is legible against `space`, and the
 * pairs a player must never confuse are separated by luminance rather than by hue, because hue is
 * the channel colour-blind players do not have.
 */

/** Which palette is in use. A setting, per 0024 — never a difficulty knob. */
export type PaletteName = 'vivid' | 'high-contrast';

/**
 * What a colour is FOR. Closed, so a new role fails to build until every palette answers it.
 *
 * ⚠️ **`impact` is not `hazard`, and it is a separate role rather than a shade of one.** The ship's
 * hit flash borrowed `hazard` when it was the only thing that flashed. Hazards are environmental and
 * are coming — `docs/game.md` has asteroids in the vocabulary — and sharing one colour between *this
 * just took damage* and *this will hurt you* is the confusion
 * `docs/decisions/0024-the-accessibility-floor-is-settings.md` exists to prevent, arriving by the
 * back door. See [0035](../../docs/decisions/0035-damage-is-legible-on-the-body-that-took-it.md).
 */
/**
 * ⚠️ **`sky` is the one ink that must NOT stand out, and it is the only exception in the table.**
 * Every other role here is something the player has to be able to find; the sky is the thing they all
 * have to be findable AGAINST. `tests/palette.test.ts` holds the contrast floor for every ink and
 * holds the OPPOSITE for this one — it has to sit nearer `space` than anything that carries meaning,
 * or a starfield becomes a field of things that look like pickups.
 * `docs/decisions/0065-the-sky-is-baked-and-blitted.md`.
 */
export type Ink =
  | 'space'
  | 'sky'
  | 'player'
  | 'ally'
  | 'enemy'
  | 'bullet'
  | 'hazard'
  | 'pickup'
  | 'impact';

export type Palette = Record<Ink, string>;

export const PALETTES: Record<PaletteName, Palette> = {
  /** The default game, per 0024: there is one game and it is the loud one. */
  vivid: {
    space: '#0b0b14',
    // A dim blue-grey: visibly not the void, and nowhere near anything the player has to find.
    sky: '#2a2c44',
    player: '#7ae7ff',
    ally: '#c9a7ff',
    enemy: '#ff4d6d',
    bullet: '#ff9f1c',
    hazard: '#ffd23f',
    pickup: '#d9ffd0',
    // Near-white and deliberately the brightest thing in the palette: a flash reads as an impact
    // because it is momentarily louder than everything around it, not because of its hue.
    impact: '#fff4e6',
  },
  /**
   * Maximum separation on the luminance channel, which is the one that survives every kind of
   * colour blindness. Not simply "brighter" — `bullet` is deliberately held DOWN so that it cannot
   * be mistaken for `pickup`, which is the confusion that costs a life.
   */
  'high-contrast': {
    space: '#000000',
    /*
      ⚠️ **Darker here than in the vivid palette, not brighter.** A high-contrast palette maximises the
      separation between the things that MATTER and the background; a louder sky would spend exactly
      that separation on scenery. It is still above the void, so the parallax is still readable as
      motion — which is the whole of what the sky is for.
    */
    sky: '#1a1a1a',
    player: '#00ffff',
    ally: '#8080ff',
    enemy: '#ff0000',
    bullet: '#ff8000',
    hazard: '#ff00ff',
    pickup: '#ffffff',
    impact: '#ffffff',
  },
};

/** The default. Named here rather than in `state/` so the bake has one without a reducer. */
export const DEFAULT_PALETTE: PaletteName = 'vivid';
