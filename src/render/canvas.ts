/**
 * The Canvas2D backend — the only file in the game that knows what a canvas is.
 *
 * `docs/decisions/0022-frame-rate-is-a-feature.md` starts on Canvas2D and keeps a WebGL backend a
 * swap rather than a rewrite. That is true exactly as long as this file stays the only implementation
 * of `Surface` and `Surface` stays three verbs wide — a clear, a blit and a bolt (0233). A blit may
 * be turned since 0306, and it is still a blit.
 *
 * ⚠️ **This file IS on the hot list.** `blit` runs five hundred times a frame; every line below runs
 * with it.
 */

import type { Atlas } from './bake.ts';
import type { Surface } from './surface.ts';

/**
 * The device-pixel-ratio ceiling, per 0022.
 *
 * At DPR 3 a 1080p phone renders ~2.6M pixels a frame; the cap drops it to ~1.15M for a difference
 * invisible on baked bitmaps. It is the largest single lever on the target device and costs desktop
 * nothing — DPR 2 *is* full quality on a Retina display, and an ordinary monitor never reaches it.
 */
export const MAX_DPR = 2;

/** The device pixel ratio to actually render at. */
export function renderScale(devicePixelRatio: number): number {
  if (!Number.isFinite(devicePixelRatio) || devicePixelRatio <= 0) return 1;
  return Math.min(devicePixelRatio, MAX_DPR);
}

/** The bar's ink — 0500: a letterbox is black, and the HUD's plates were made to stand on the void. */
const BAR_INK = '#000000';

export class CanvasSurface implements Surface {
  private atlas: Atlas;
  private width = 0;
  private height = 0;
  private space = '#000000';
  private bar = 0;
  private boltInk = UNSET;
  // The enemy's lightning — 0248. Its own inks; the dark halo is the same space.
  private hostileInk = UNSET;
  private boltDark = '#000000';

  constructor(private readonly ctx: CanvasRenderingContext2D, atlas: Atlas) {
    this.atlas = atlas;
  }

  /** Swap in a re-baked atlas — on rotation, or on a palette change. Never during a frame. */
  setAtlas(atlas: Atlas): void {
    this.atlas = atlas;
  }

  /**
   * The drawing surface's size in CSS pixels, the colour behind everything, and how much of its top
   * is the chrome's bar rather than the field — 0500, `View.barAcross`.
   */
  setSize(width: number, height: number, space: string, bar = 0): void {
    this.width = width;
    this.height = height;
    this.space = space;
    this.bar = bar;
  }

  /**
   * Change the backdrop without touching the size — what a level's THEME does.
   *
   * ⚠️ **`docs/decisions/0107-a-level-is-a-place.md`, and it costs one property write.** The clear
   * colour is a field rather than baked into anything, so a place is the cheapest visual change the
   * engine has: no re-bake, no allocation, and nothing that could hitch at a level boundary
   * `docs/decisions/0076-a-level-has-an-origin.md` says keeps the scene.
   *
   * ⚠️ **NOT on the `Surface` interface**, which is deliberately *clear, blit and bolt* and nothing
   * else — `src/render/surface.ts` has the argument. This is the canvas backend's own, exactly as
   * `setSize` and `setAtlas` are.
   */
  setSpace(space: string): void {
    this.space = space;
  }

  /**
   * The inks a bolt is stroked in — set with the palette rather than passed per call, on `setSpace`'s
   * terms: a colour is a property of the palette the page is showing, and a string per stroke per
   * frame would be a hash lookup on the hot path. Solved once per palette by `boltInks` — 0520.
   */
  setBolt(inks: BoltInks): void {
    this.boltInk = inks.player;
    this.hostileInk = inks.hostile;
    this.boltDark = inks.dark;
  }

  clear(): void {
    const ctx = this.ctx;
    if (this.bar <= 0) {
      ctx.fillStyle = this.space;
      ctx.fillRect(0, 0, this.width, this.height);
      return;
    }
    /*
      ⚠️ **THE BAR IS THE CHROME'S, SO NOTHING OF THE WORLD IS DRAWN IN IT — 0500.** A flanker enters
      from past the lane's edge and a big hull reaches over it; with no bar both were off the canvas,
      and with one they would be drawn behind the HUD. So the frame is clipped to the field: the last
      frame's clip is put back, the bar filled black, and the field clipped again. `restore` with
      nothing saved does nothing, which is the first frame after a fit — a resized canvas has dropped
      its whole state stack. Calls on the context's own stack; nothing allocates.
    */
    ctx.restore();
    ctx.save();
    ctx.fillStyle = BAR_INK;
    ctx.fillRect(0, 0, this.width, this.bar);
    ctx.fillStyle = this.space;
    ctx.fillRect(0, this.bar, this.width, this.height - this.bar);
    ctx.beginPath();
    ctx.rect(0, this.bar, this.width, this.height - this.bar);
    ctx.clip();
  }

  blit(sprite: number, x: number, y: number, scale: number, turn = 0, alpha = 1): void {
    const bitmap = this.atlas.bitmaps[sprite];
    if (bitmap === undefined || alpha <= 0) return;
    const size = this.atlas.extents[sprite]! * scale;
    const half = size / 2;
    /*
      ⚠️ **A LIGHT IS ADDED, NOT LAID OVER — 0520.** The same one draw with the context's composite set
      round it and put back, on 0401's terms for alpha: what the kind is decides it (`LIGHT_KINDS`), the
      atlas carries it, and nothing here allocates.
    */
    const light = this.atlas.light !== undefined && this.atlas.light[sprite] === true;
    if (light) this.ctx.globalCompositeOperation = 'lighter';
    // 0401: a faded blit is the same one draw with the context's alpha set round it, and put back.
    if (alpha < 1) this.ctx.globalAlpha = alpha;
    if (turn === 0) {
      this.ctx.drawImage(bitmap, x - half, y - half, size, size);
      if (alpha < 1) this.ctx.globalAlpha = 1;
      if (light) this.ctx.globalCompositeOperation = 'source-over';
      return;
    }
    /*
      ⚠️ **TURNED ABOUT ITS OWN CENTRE, AND THE TRANSFORM IS PUT BACK EXACTLY — 0306.** `save` and
      `restore` rather than a rotate and an un-rotate, because the second leaves float error in the
      context's matrix a few hundred times a second and the whole frame would creep. Nothing here
      allocates: both are calls on the context's own state stack.
    */
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(turn);
    ctx.drawImage(bitmap, -half, -half, size, size);
    ctx.restore();
    if (alpha < 1) ctx.globalAlpha = 1;
    if (light) ctx.globalCompositeOperation = 'source-over';
  }

  /**
   * One bolt: the same polyline stroked once per layer of its look — a flash's six, a beam's six, a
   * dot's three — and the light layers are ADDED to the frame rather than laid over it. A single
   * point is a dot: the round cap does the drawing.
   *
   * ⚠️ **STROKES AND NO `shadowBlur`.** A canvas shadow is a per-draw Gaussian over the path's
   * bounding box, which is the one Canvas2D call that is genuinely expensive and the one this
   * backend must never make sixty times a second. Translucent wide strokes under a thin opaque one
   * are what a glow looks like at the size a bolt is drawn, and they cost one path stroke each.
   *
   * ⚠️ **THE LIGHT IS ADDITIVE — 0470.** *"Lightning needs to be brighter and flashier … lasers need
   * more depth and layers … the jellyfish's laser still looks terrible against the background."* Every
   * glow here was laid `source-over`: a yellow at four tenths over the Black Heart's plum is a
   * mustard band, and a pink at four tenths over the Saurian night is a flat road with a white line
   * down it — a translucent paint, which is what `source-over` IS. Light does not mix with what is
   * behind it; it adds to it. So the wash, the glow and the core are stroked `lighter`, which adds the
   * ink's channels to the frame's: the same yellow over the same plum is yellow light falling off into
   * the dark, and over the vessels it is brighter than they are, which is the whole of the third
   * complaint. The rim stays `source-over`, because an added black is nothing — its job is to darken.
   * A compositing mode is one property write on the context's own state and costs no draw.
   *
   * ⚠️ **THE DARK RIM IS THE FIRST PLAY-TEST'S — 0236.** *"It needs some bright points and a bit of
   * a darker glow around it."* A bolt over a busy sky had nothing to stand against; the rim is the
   * space colour at half alpha, half as wide again as the glow, and it is what gives the glow an
   * edge — in the Black Heart it is what parts a laser from an artery it crosses.
   *
   * ⚠️ **THE FLASH IS THE SECOND'S — 0238.** *"Lightning needs more glow around the edges, not
   * specific details but more like the lightning flash."* The widest stroke, first and under the
   * others: the glow ink, faint, fourteen times the core's width — a wash of light round the whole
   * bolt that fades with it, which is what a flash is. Two since 0520, a bloom and a wash, capped.
   *
   * ⚠️ **A BEAM HAS ITS OWN STACK — 0470.** A flash is a filament in a wash; a beam is a column of
   * light the player stands beside for half a second, and drawn as a flash it was the road above.
   * `BEAM_LAYERS` is five deep: the wash, the rim, the body at exactly the width the beam hurts, an
   * inner glow at half of it and a hot core at a fifth — each narrower one brighter, which is what
   * gives a column of light its depth. The caller says which with `beam`.
   *
   * ⚠️ **Nothing here allocates**: `beginPath`, `moveTo`, `lineTo` and `stroke` write into the
   * context's own path, the layers are module constants, and the points are the caller's buffer.
   * **And the context is put back** — `source-over`, alpha one — before this returns, because every
   * blit after it would otherwise be added to the frame too.
   */
  bolt(points: Float32Array, count: number, width: number, alpha: number, hostile: boolean, beam = false): void {
    if (count < 1) return;
    const ctx = this.ctx;
    const ink = hostile ? this.hostileInk : this.boltInk;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(points[0]!, points[1]!);
    if (count === 1) ctx.lineTo(points[0]!, points[1]!);
    for (let i = 1; i < count; i++) ctx.lineTo(points[i * 2]!, points[i * 2 + 1]!);
    // The flash and the dark rim wrap the bolt and not its dots: a dot with its own wash is a
    // bead, a dot with its own rim is a dark disc punched in the flash, and the eye reads either as
    // a string of lights rather than as one flash. A dot is its glow and its core — 0238.
    const layers = count === 1 ? DOT_LAYERS : beam ? BEAM_LAYERS : FLASH_LAYERS;
    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i]!;
      ctx.globalCompositeOperation = layer.additive ? 'lighter' : 'source-over';
      // A capped layer keeps only the share of its alpha this ink may lift the space by — 0520.
      ctx.globalAlpha = alpha * layer.alpha * (layer.capped ? ink.wide : 1);
      ctx.strokeStyle = layer.ink === 'dark' ? this.boltDark : layer.ink === 'core' ? ink.core : layer.ink === 'hot' ? ink.hot : ink.glow;
      ctx.lineWidth = width * layer.width;
      ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }
}

/**
 * One stroke of a bolt's stack — 0470: how wide, as a multiple of the width the caller asked for; how
 * loud, as a share of the alpha it asked for; which of the three inks; and whether it is added to the
 * frame (`lighter`) or laid over it (`source-over`).
 *
 * Module constants and not a parameter, on `setBolt`'s terms: a look is a property of what a bolt is,
 * not of the call, and a table per stroke per frame would be an allocation on the hot path.
 * `tests/bolt.browser.test.ts` strokes each table on a real canvas and reads the pixels back.
 */
export interface BoltLayer {
  readonly width: number;
  readonly alpha: number;
  /** `hot` is the glow taken halfway to white — 0520. */
  readonly ink: 'glow' | 'dark' | 'core' | 'hot';
  readonly additive: boolean;
  /**
   * A layer wide enough to be an AREA, held under a flash by the ink's `wide` share — 0520. Every
   * capped layer of a stack is summed when that share is solved, so the table says what is capped and
   * `src/render/bolt-inks.ts` says by how much.
   */
  readonly capped?: true;
}

/** What a bolt is stroked in: a glow, its hot inner shade, a core, and the share of the capped layers it may keep. */
export interface BoltInk {
  readonly glow: string;
  readonly hot: string;
  readonly core: string;
  /** The share of a capped layer's alpha this ink may keep — `wideScale` in `bolt-inks.ts`. */
  readonly wide: number;
}

/** The player's bolt and the enemy's, and the dark rim they share. */
export interface BoltInks {
  readonly player: BoltInk;
  readonly hostile: BoltInk;
  readonly dark: string;
}

// Before a palette is set, a bolt is white and keeps none of its wide light.
const UNSET: BoltInk = { glow: '#ffffff', hot: '#ffffff', core: '#ffffff', wide: 0 };

/**
 * A flash — chain lightning, the storm, the serpent's strike. In order, under to over: the bloom and
 * the wash, the rim (0236), the glow, the hot glow and the core. The glow is ADDED (0470), so it is
 * light rather than paint.
 *
 * ⚠️ **THE BLOOM AND THE WASH ARE CAPPED — 0520.** *"Can we make the game flashy and vibrant? In
 * particular for lightning."* They are the only strokes wide enough to be an area, and a flash is a
 * change of brightness over an area (0457). So they are louder and wider than 0238's single wash was,
 * and each palette keeps only the share of them that cannot lift its space by a flash's worth: the
 * light is as loud as the cap allows, and no louder, whatever ink the palette gives the bolt.
 *
 * ⚠️ **THE HOT GLOW IS THE BOLT'S WHITE HEART — 0520**: the glow's ink taken halfway to white, under
 * the core and nearly twice as wide, so a bolt runs white at its heart, ink at its edge and ink-coloured
 * light round that.
 */
export const FLASH_LAYERS: readonly BoltLayer[] = [
  { width: 22, alpha: 0.5, ink: 'glow', additive: true, capped: true },
  { width: 9, alpha: 0.7, ink: 'glow', additive: true, capped: true },
  { width: 6, alpha: 0.5, ink: 'dark', additive: false },
  { width: 4, alpha: 0.55, ink: 'glow', additive: true },
  { width: 1.8, alpha: 1, ink: 'hot', additive: true },
  { width: 1, alpha: 1, ink: 'core', additive: true },
];

/** A bright point on a flash — 0236, 0239: its glow, its hot heart (0520) and its core, nothing round them (0238). */
export const DOT_LAYERS: readonly BoltLayer[] = [
  { width: 4, alpha: 0.55, ink: 'glow', additive: true },
  { width: 1.8, alpha: 1, ink: 'hot', additive: true },
  { width: 1, alpha: 1, ink: 'core', additive: true },
];

/**
 * A beam — a boss's laser, held. Six deep, under to over: a wash near twice the hurt width, the rim a
 * third wider than the hurt, the BODY at exactly the hurt width (0250: *the picture is as wide as the
 * hurt* — `src/render/scene.ts` passes a quarter of it, and four is this row), an inner glow at
 * three fifths of it, a hot glow at a third, and a white core at a fifth. Each narrower layer is
 * louder than the one under it, so the column is brightest down its middle and falls off to its edge
 * in steps too close to read as steps, which is what a beam of light looks like and what a single
 * band at one alpha does not.
 */
export const BEAM_LAYERS: readonly BoltLayer[] = [
  { width: 7, alpha: 0.16, ink: 'glow', additive: true },
  { width: 5.2, alpha: 0.6, ink: 'dark', additive: false },
  { width: 4, alpha: 0.28, ink: 'glow', additive: true },
  { width: 2.4, alpha: 0.4, ink: 'glow', additive: true },
  { width: 1.4, alpha: 0.6, ink: 'glow', additive: true },
  { width: 0.8, alpha: 1, ink: 'core', additive: true },
];
