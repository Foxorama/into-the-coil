/**
 * The golfers, drawn — `docs/decisions/0415-the-golfer-is-chosen.md`.
 *
 * Two pictures of each of the four: the figure that runs out of the bar in the intro (0411, 0412), and
 * the portrait the select screen offers. Both are drawn from the golfer's row in
 * `src/content/golfers.ts` — cap, polo, skin, hair and its cut, stubble, build — so a fifth golfer is a
 * row and not a drawing.
 *
 * ⚠️ **COLD, LIKE `bake.ts` AND `port-bake.ts`**: this runs when the port is baked and when the chrome
 * builds the select screen, never in a frame. `tests/budget.test.ts` lists it.
 */

import { KIT, type GolferRow } from '../content/golfers.ts';
import { shade, type Pt } from './bake.ts';

/** The five poses the intro's pilot is drawn in: the run's four and the leap for the cockpit. */
export type RunnerPose = 'pilotRun0' | 'pilotRun1' | 'pilotRun2' | 'pilotRun3' | 'pilotLeap';

/**
 * A golfer running, side on and facing forward (+x), feet at +5 before `scale` and `build` —
 * 0412's figure, dressed from the row. The run is four frames, legs and arms swinging opposite; the
 * leap is tucked, arms up and reaching for the cockpit. The context is in world units about the
 * sprite's centre.
 */
export function paintRunner(ctx: CanvasRenderingContext2D, golfer: GolferRow, pose: RunnerPose, scale: number): void {
  // Built about the feet, so a taller golfer is taller and still stands on the deck.
  ctx.translate(0, 5 * scale);
  ctx.scale(scale * golfer.build, scale * golfer.build);
  ctx.translate(0, -5);
  const deg = Math.PI / 180;
  const leap = pose === 'pilotLeap';
  const stride: Record<RunnerPose, readonly [number, number, number, number]> = {
    // front thigh, front shin, back thigh, back shin — degrees forward of straight down.
    pilotRun0: [42, -8, -32, -85],
    pilotRun1: [14, -4, -12, -40],
    pilotRun2: [-32, -85, 42, -8],
    pilotRun3: [-12, -40, 14, -4],
    pilotLeap: [70, -70, 55, -95],
  };
  const [ft, fs, bt, bs] = stride[pose];
  const lean = leap ? 5 * deg : 14 * deg;
  const hip: Pt = [0, 0.4];
  const shoulder: Pt = [hip[0] + Math.sin(lean) * 3, hip[1] - Math.cos(lean) * 3];
  const limb = (from: Pt, a1: number, l1: number, a2: number, l2: number): [Pt, Pt] => {
    const knee: Pt = [from[0] + Math.sin(a1 * deg) * l1, from[1] + Math.cos(a1 * deg) * l1];
    const foot: Pt = [knee[0] + Math.sin((a1 + a2) * deg) * l2, knee[1] + Math.cos((a1 + a2) * deg) * l2];
    return [knee, foot];
  };
  const line = (points: readonly Pt[], colour: string, width: number): void => {
    ctx.strokeStyle = colour;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    points.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
    ctx.stroke();
  };
  const disc = (x: number, y: number, r: number, colour: string): void => {
    ctx.fillStyle = colour;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  };
  const part = (a: Pt, b: Pt, share: number): Pt => [a[0] + (b[0] - a[0]) * share, a[1] + (b[1] - a[1]) * share];
  // The arms swing against the legs.
  const armFront = leap ? 150 : -ft * 0.9;
  const armBack = leap ? 130 : -bt * 0.9;
  // Back limbs first, in shadow: trouser leg and shoe, then a short sleeve and a bare forearm.
  const [bk, bf] = limb(hip, bt, 2.3, bs, 2.4);
  line([hip, bk, bf], shade(KIT.pants, -0.3), 1.05);
  line([bf, [bf[0] + 0.8, bf[1]]], KIT.shoes, 0.9);
  const [be, bh] = limb(shoulder, armBack, 1.7, leap ? -20 : 70, 1.5);
  line([shoulder, part(shoulder, be, 0.55)], shade(golfer.shirt, -0.3), 0.95);
  line([part(shoulder, be, 0.5), be, bh], shade(golfer.skin, -0.25), 0.6);
  // The carry bag on the back, with the shafts and heads of the clubs out of the top.
  const back: Pt = [-Math.cos(lean) * 0.95, -Math.sin(lean) * 0.95];
  const bagLow: Pt = [hip[0] + back[0], hip[1] + back[1] - 0.4];
  const bagHigh: Pt = [shoulder[0] + back[0] - 0.3, shoulder[1] + back[1] - 0.6];
  for (const tip of [[bagHigh[0] - 0.5, bagHigh[1] - 1.5], [bagHigh[0] + 0.1, bagHigh[1] - 1.8], [bagHigh[0] + 0.6, bagHigh[1] - 1.4]] as const) {
    line([bagHigh, tip], KIT.shaft, 0.2);
    disc(tip[0], tip[1], 0.28, KIT.shaft);
  }
  line([bagLow, bagHigh], KIT.bag, 1.25);
  line([[bagLow[0] + 0.1, bagLow[1] - 0.3], [bagHigh[0] + 0.1, bagHigh[1] + 0.4]], shade(KIT.bag, 0.3), 0.25);
  // The body: the polo, with its collar lit, and a belt at the waist.
  line([hip, shoulder], golfer.shirt, 2);
  line([[shoulder[0] - 0.5, shoulder[1] + 0.1], [shoulder[0] + 0.5, shoulder[1] - 0.05]], shade(golfer.shirt, 0.35), 0.35);
  line([[hip[0] - 0.8, hip[1] - 0.35], [hip[0] + 0.85, hip[1] - 0.5]], KIT.shoes, 0.35);
  // The front leg and arm.
  const [fk, ff] = limb(hip, ft, 2.3, fs, 2.4);
  line([hip, fk, ff], KIT.pants, 1.1);
  line([ff, [ff[0] + 0.9, ff[1]]], KIT.shoes, 0.95);
  const [fe, fh] = limb(shoulder, armFront, 1.7, leap ? -20 : 75, 1.5);
  line([part(shoulder, fe, 0.5), fe, fh], golfer.skin, 0.65);
  line([shoulder, part(shoulder, fe, 0.55)], golfer.shirt, 1);
  disc(fh[0], fh[1], 0.4, golfer.skin);
  // The head, in profile: the hair's back mass by its cut, the face, the cap and its brim forward.
  const head: Pt = [shoulder[0] + Math.sin(lean) * 1.55, shoulder[1] - Math.cos(lean) * 1.55];
  const [hx, hy] = head;
  ctx.fillStyle = golfer.hair;
  switch (golfer.cut) {
    case 'coils':
      // Big natural coils: a full mass behind and below the ear, down past the jaw, and textured.
      ctx.beginPath();
      ctx.ellipse(hx - 0.55, hy + 0.35, 1.45, 1.6, -0.15, 0, Math.PI * 2);
      ctx.fill();
      for (const [dx, dy] of [[-1.6, -0.2], [-1.3, 1.1], [-0.4, 1.6], [-1.7, 0.6]] as const) disc(hx + dx, hy + dy, 0.45, golfer.hair);
      break;
    case 'sweep':
      ctx.beginPath();
      ctx.ellipse(hx - 0.6, hy + 0.1, 0.85, 0.95, -0.2, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'crop':
      // Short, hugging the skull: no mass below the cap at all.
      break;
    case 'tousled':
      ctx.beginPath();
      ctx.ellipse(hx - 0.55, hy + 0.25, 0.95, 1.15, -0.2, 0, Math.PI * 2);
      ctx.fill();
      break;
    default: {
      const never: never = golfer.cut;
      throw new Error(`unpainted cut ${String(never)}`);
    }
  }
  disc(hx, hy, 1.2, golfer.skin);
  ctx.fillStyle = golfer.skin;
  ctx.beginPath();
  ctx.moveTo(hx + 1.05, hy - 0.2);
  ctx.lineTo(hx + 1.55, hy + 0.25);
  ctx.lineTo(hx + 1.05, hy + 0.4);
  ctx.closePath();
  ctx.fill();
  if (golfer.stubble) {
    ctx.globalAlpha = 0.3;
    disc(hx + 0.35, hy + 0.65, 0.7, golfer.hair);
    ctx.globalAlpha = 1;
  }
  disc(hx + 0.6, hy - 0.15, 0.16, '#1a1410');
  // What shows in front of the ear and under the brim, by the cut.
  ctx.fillStyle = golfer.hair;
  ctx.beginPath();
  if (golfer.cut === 'tousled') {
    ctx.moveTo(hx - 0.2, hy - 0.9);
    ctx.lineTo(hx + 0.15, hy + 0.5);
    ctx.lineTo(hx - 0.35, hy + 0.2);
    ctx.lineTo(hx - 0.65, hy - 0.6);
    ctx.closePath();
    ctx.moveTo(hx - 0.2, hy - 0.75);
    ctx.lineTo(hx + 0.35, hy - 0.35);
    ctx.lineTo(hx + 0.55, hy - 0.75);
    ctx.lineTo(hx + 0.85, hy - 0.4);
    ctx.lineTo(hx + 1.0, hy - 0.8);
    ctx.closePath();
  } else if (golfer.cut === 'sweep') {
    // The fringe swept forward and down across the brow.
    ctx.moveTo(hx - 0.4, hy - 0.8);
    ctx.lineTo(hx + 1.1, hy - 0.55);
    ctx.lineTo(hx + 0.95, hy - 0.2);
    ctx.lineTo(hx + 0.1, hy - 0.45);
    ctx.lineTo(hx - 0.3, hy + 0.1);
    ctx.closePath();
  } else if (golfer.cut === 'crop') {
    ctx.moveTo(hx - 0.9, hy - 0.8);
    ctx.lineTo(hx + 0.2, hy - 0.8);
    ctx.lineTo(hx - 0.1, hy - 0.2);
    ctx.lineTo(hx - 0.9, hy - 0.3);
    ctx.closePath();
  } else {
    ctx.moveTo(hx - 0.3, hy - 0.8);
    ctx.lineTo(hx + 0.8, hy - 0.6);
    ctx.lineTo(hx + 0.2, hy - 0.2);
    ctx.lineTo(hx - 0.4, hy + 0.4);
    ctx.closePath();
  }
  ctx.fill();
  ctx.fillStyle = golfer.cap;
  ctx.beginPath();
  ctx.arc(hx, hy - 0.45, 1.25, Math.PI, Math.PI * 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = shade(golfer.cap, -0.25);
  ctx.beginPath();
  ctx.moveTo(hx + 0.6, hy - 0.55);
  ctx.lineTo(hx + 2.1, hy - 0.35);
  ctx.lineTo(hx + 2.0, hy - 0.1);
  ctx.lineTo(hx + 0.6, hy - 0.25);
  ctx.closePath();
  ctx.fill();
  disc(hx - 0.1, hy - 1.65, 0.18, shade(golfer.cap, 0.3));
}

/**
 * A golfer's portrait for the select screen: head and shoulders, front on, on a transparent square
 * `size` pixels across — the polo and its collar, the face, the hair by its cut, and the cap with its
 * brim. Drawn in twentieths of the square.
 */
export function paintPortrait(ctx: CanvasRenderingContext2D, golfer: GolferRow, size: number): void {
  const u = size / 20;
  ctx.save();
  ctx.scale(u, u);
  const disc = (x: number, y: number, r: number, colour: string): void => {
    ctx.fillStyle = colour;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  };
  // The hair behind the head: the back mass, which is the whole silhouette for coils.
  ctx.fillStyle = golfer.hair;
  if (golfer.cut === 'coils') {
    for (const [x, y, r] of [[10, 9.5, 6.2], [5.2, 11, 2.4], [14.8, 11, 2.4], [5.6, 13.6, 2], [14.4, 13.6, 2], [7.5, 5.2, 2.2], [12.5, 5.2, 2.2]] as const) {
      disc(x, y, r, golfer.hair);
    }
  } else if (golfer.cut === 'tousled') {
    ctx.beginPath();
    ctx.ellipse(10, 10, 5.4, 5.6, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (golfer.cut === 'sweep') {
    ctx.beginPath();
    ctx.ellipse(10, 9.6, 5.1, 5.1, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Shoulders and polo, with the collar lit in a V.
  ctx.fillStyle = golfer.shirt;
  ctx.beginPath();
  ctx.moveTo(2, 20);
  ctx.quadraticCurveTo(2.2, 15.4, 6.5, 14.6);
  ctx.lineTo(13.5, 14.6);
  ctx.quadraticCurveTo(17.8, 15.4, 18, 20);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = golfer.skin;
  ctx.fillRect(8.4, 12.4, 3.2, 2.8);
  ctx.fillStyle = shade(golfer.shirt, 0.35);
  ctx.beginPath();
  ctx.moveTo(7.6, 14.6);
  ctx.lineTo(10, 17.2);
  ctx.lineTo(12.4, 14.6);
  ctx.lineTo(11.4, 14.6);
  ctx.lineTo(10, 16.1);
  ctx.lineTo(8.6, 14.6);
  ctx.closePath();
  ctx.fill();
  // The face, its ears, and the features.
  disc(5.6, 10, 0.9, shade(golfer.skin, -0.1));
  disc(14.4, 10, 0.9, shade(golfer.skin, -0.1));
  ctx.fillStyle = golfer.skin;
  ctx.beginPath();
  ctx.ellipse(10, 9.8, 4.4, 4.9, 0, 0, Math.PI * 2);
  ctx.fill();
  if (golfer.stubble) {
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = golfer.hair;
    ctx.beginPath();
    ctx.ellipse(10, 12.4, 3.6, 2.2, 0, 0, Math.PI);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  disc(8.3, 9.6, 0.45, '#1a1410');
  disc(11.7, 9.6, 0.45, '#1a1410');
  ctx.strokeStyle = shade(golfer.hair, 0.1);
  ctx.lineWidth = 0.35;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(7.4, 8.3);
  ctx.lineTo(9, 8.1);
  ctx.moveTo(11, 8.1);
  ctx.lineTo(12.6, 8.3);
  ctx.stroke();
  ctx.strokeStyle = shade(golfer.skin, -0.35);
  ctx.lineWidth = 0.4;
  ctx.beginPath();
  ctx.arc(10, 11.2, 1.5, 0.2 * Math.PI, 0.8 * Math.PI);
  ctx.stroke();
  // The hair in front: what shows under the brim, by the cut.
  ctx.fillStyle = golfer.hair;
  ctx.beginPath();
  switch (golfer.cut) {
    case 'coils':
      for (let i = 0; i < 5; i++) {
        ctx.moveTo(6.2 + i * 1.9 + 1, 6.6);
        ctx.arc(6.2 + i * 1.9, 6.6, 1, 0, Math.PI * 2);
      }
      break;
    case 'sweep':
      ctx.moveTo(5.6, 7.9);
      ctx.quadraticCurveTo(9, 5.6, 14.4, 6.4);
      ctx.lineTo(14.2, 8.4);
      ctx.quadraticCurveTo(10, 7, 5.8, 9.4);
      ctx.closePath();
      break;
    case 'crop':
      ctx.moveTo(5.8, 7.8);
      ctx.lineTo(14.2, 7.8);
      ctx.lineTo(13.8, 6.6);
      ctx.lineTo(6.2, 6.6);
      ctx.closePath();
      break;
    case 'tousled':
      ctx.moveTo(5.4, 8.8);
      for (const [x, y] of [[6.6, 7.1], [7.6, 8.2], [8.7, 6.9], [9.9, 8.1], [11.1, 6.9], [12.3, 8.2], [13.4, 7.1], [14.6, 8.8]] as const) ctx.lineTo(x, y);
      ctx.lineTo(14.4, 6);
      ctx.lineTo(5.6, 6);
      ctx.closePath();
      break;
    default: {
      const never: never = golfer.cut;
      throw new Error(`unpainted cut ${String(never)}`);
    }
  }
  ctx.fill();
  /*
    The cap: a low crown with its button and a front seam, and the bill — which, front on, is a wide
    shallow crescent under the crown's front edge, darker underneath. ⚠️ A full ring of brim round the
    crown reads as a hard hat, and the first photograph did.
  */
  ctx.fillStyle = golfer.cap;
  ctx.beginPath();
  ctx.moveTo(5.1, 7.2);
  ctx.bezierCurveTo(5.1, 2.4, 14.9, 2.4, 14.9, 7.2);
  ctx.closePath();
  ctx.fill();
  disc(10, 3.35, 0.42, shade(golfer.cap, 0.3));
  ctx.strokeStyle = shade(golfer.cap, -0.2);
  ctx.lineWidth = 0.3;
  ctx.beginPath();
  ctx.moveTo(10, 3.7);
  ctx.lineTo(10, 7);
  ctx.stroke();
  // The bill: its underside in shadow, then its top face lit.
  ctx.fillStyle = shade(golfer.cap, -0.35);
  ctx.beginPath();
  ctx.moveTo(4.6, 7.1);
  ctx.quadraticCurveTo(10, 10.2, 15.4, 7.1);
  ctx.quadraticCurveTo(10, 8.3, 4.6, 7.1);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = shade(golfer.cap, 0.1);
  ctx.beginPath();
  ctx.moveTo(4.8, 7);
  ctx.quadraticCurveTo(10, 9.2, 15.2, 7);
  ctx.quadraticCurveTo(10, 7.6, 4.8, 7);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
