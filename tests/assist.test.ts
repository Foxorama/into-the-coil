/**
 * The assist knobs, and the one property that makes them safe to add to later.
 *
 * See `docs/decisions/0024-the-accessibility-floor-is-settings.md`. The claim being checked is
 * **monotonicity**: no combination of assists is harder than a less-assisted one. It is checked
 * exhaustively over all 144 states rather than sampled, because the failures that matter are
 * interactions between two knobs nobody thought to try together.
 *
 * ⚠️ An exhaustive proof over a partial order is only as good as the comparator that defines the
 * order. A comparator that answered `false` to everything would make the whole thing pass while
 * comparing nothing — the `NEXT-TIME.md` #9 failure in its most expensive disguise, because this
 * suite would look like the most thorough file in the repo. So the comparator is proved against
 * pairs it must accept and pairs it must reject, and the number of pairs it actually found is
 * asserted.
 */

import { describe, expect, it } from 'vitest';
import {
  ASSIST_KNOBS,
  ASSIST_LADDER,
  type Assists,
  DEFAULT_ASSISTS,
  grantedBy,
  type Granted,
  type Tuning,
  tuningFor,
} from '../src/sim/assist.ts';

/** Every reachable combination of knobs. 3 × 3 × 2 × 2 × 2 × 2. */
const ALL: Assists[] = ASSIST_LADDER.pace.flatMap((pace) =>
  ASSIST_LADDER.resilience.flatMap((resilience) =>
    ASSIST_LADDER.hurtbox.flatMap((hurtbox) =>
      ASSIST_LADDER.terrain.flatMap((terrain) =>
        ASSIST_LADDER.specials.flatMap((specials) =>
          ASSIST_LADDER.flight.map((flight) => ({ pace, resilience, hurtbox, terrain, specials, flight })),
        ),
      ),
    ),
  ),
);

/** Where a setting sits on its own ladder. Higher is more assisted. */
function rank(knob: keyof Assists, a: Assists): number {
  return (ASSIST_LADDER[knob] as readonly string[]).indexOf(a[knob]);
}

/** The partial order: `a` asks no more of the player than `b` does, on every knob at once. */
function atMostAsAssisted(a: Assists, b: Assists): boolean {
  return ASSIST_KNOBS.every((knob) => rank(knob, a) <= rank(knob, b));
}

const TUNING_FIELDS: readonly (keyof Tuning)[] = ['timeRate', 'playerDamage', 'hurtbox', 'terrainDamage'];
const GRANTED_FIELDS: readonly (keyof Granted)[] = ['autoSpecial', 'holdsAlong'];

const describeAssists = (a: Assists): string => ASSIST_KNOBS.map((k) => `${k}=${a[k]}`).join(' ');

describe('an assist never makes the game harder', () => {
  it('never makes the game harder, in any combination of knobs', () => {
    let compared = 0;
    for (const less of ALL) {
      for (const more of ALL) {
        if (!atMostAsAssisted(less, more)) continue;
        compared++;
        const [lt, mt] = [tuningFor(less), tuningFor(more)];
        for (const field of TUNING_FIELDS) {
          expect(
            mt[field],
            `${field} got HARDER when assists went up:\n  ${describeAssists(less)}\n  ${describeAssists(more)}`,
          ).toBeLessThanOrEqual(lt[field]);
        }
        const [lg, mg] = [grantedBy(less), grantedBy(more)];
        for (const field of GRANTED_FIELDS) {
          if (lg[field]) {
            expect(mg[field], `${field} was taken AWAY when assists went up`).toBe(true);
          }
        }
      }
    }
    // The anti-vacuity number. A comparator that found nothing would pass every assertion above.
    expect(compared, 'the ordering compared almost nothing — suspect the comparator, not the code').toBe(2916);
  });

  it('the default is the vibrant game, and it is the bottom of the ladder', () => {
    // Nothing is restrained by default. Every assist is opt-in, and the shipped game is the loud one.
    expect(tuningFor(DEFAULT_ASSISTS)).toEqual({
      timeRate: 1,
      playerDamage: 1,
      hurtbox: 1,
      terrainDamage: 1,
    });
    expect(grantedBy(DEFAULT_ASSISTS)).toEqual({ autoSpecial: false, holdsAlong: false });
    for (const a of ALL) {
      expect(atMostAsAssisted(DEFAULT_ASSISTS, a), `${describeAssists(a)} is not above the default`).toBe(true);
    }
  });

  it('every knob actually does something, so none of them is a placebo', () => {
    // A knob wired to nothing satisfies monotonicity perfectly. This is what catches it.
    for (const knob of ASSIST_KNOBS) {
      const ladder = ASSIST_LADDER[knob] as readonly string[];
      const most = { ...DEFAULT_ASSISTS, [knob]: ladder[ladder.length - 1] } as Assists;
      const changed =
        JSON.stringify(tuningFor(most)) !== JSON.stringify(tuningFor(DEFAULT_ASSISTS)) ||
        JSON.stringify(grantedBy(most)) !== JSON.stringify(grantedBy(DEFAULT_ASSISTS));
      expect(changed, `turning ${knob} all the way up changes nothing the model reads`).toBe(true);
    }
  });

  it('resilience at its end stops every source of damage, terrain included', () => {
    const proof = { ...DEFAULT_ASSISTS, resilience: 'proof' } as Assists;
    expect(tuningFor(proof).playerDamage).toBe(0);
    expect(tuningFor(proof).terrainDamage, 'invulnerable, except to scenery — the classic hole').toBe(0);
  });
});

/**
 * ⚠️ THE BAN LIST.
 *
 * A comfort setting that changed the model would make the player choose between seeing the game
 * comfortably and playing it at the difficulty everyone else does — which is the whole failure the
 * split exists to prevent. It is the same rule 0022 puts on device scaling.
 */
describe('a cosmetic setting can never be an assist', () => {
  const PRESENTATION_ONLY = [
    'palette',
    'contrast',
    'motion',
    'reducedMotion',
    'flash',
    'screenShake',
    'parallax',
    'particles',
    'subtitles',
    'colourBlind',
  ];

  it('no presentation setting has appeared among the knobs', () => {
    for (const name of PRESENTATION_ONLY) {
      expect(ASSIST_KNOBS, `${name} is presentation and must not change the model`).not.toContain(name);
    }
  });

  it('nothing the model reads is named for a comfort setting either', () => {
    const fields = [...TUNING_FIELDS, ...GRANTED_FIELDS].map(String);
    for (const name of PRESENTATION_ONLY) {
      expect(fields, `${name} reached the model through the back door`).not.toContain(name);
    }
  });
});

describe('the knobs are a closed, plain-data set', () => {
  it('the ladder and the written-out knob list agree', () => {
    expect([...ASSIST_KNOBS].sort()).toEqual(Object.keys(ASSIST_LADDER).sort());
    expect([...ASSIST_KNOBS].sort()).toEqual(Object.keys(DEFAULT_ASSISTS).sort());
  });

  it('every ladder has at least two distinct positions', () => {
    for (const knob of ASSIST_KNOBS) {
      const ladder = ASSIST_LADDER[knob] as readonly string[];
      expect(ladder.length, `${knob} is a ladder with nowhere to go`).toBeGreaterThan(1);
      expect(new Set(ladder).size, `${knob} repeats a position`).toBe(ladder.length);
    }
  });

  it('survives the round trip a save will put it through', () => {
    // 0017: state is plain data. Assists travel WITH the run, because they change what `step` does.
    for (const a of ALL) {
      expect(JSON.parse(JSON.stringify(a))).toEqual(a);
    }
  });
});

/**
 * ⚠️ THE ASSERTIONS THAT KEEP THE EXHAUSTIVE PROOF FROM BEING DECORATIVE.
 *
 * Everything above hangs off `atMostAsAssisted`. If it is wrong in the permissive direction the
 * proof fails loudly; if it is wrong in the restrictive direction the proof passes having compared
 * nothing at all, and looks thorough while doing it.
 */
describe('the ordering is known to work, not merely green', () => {
  it('accepts a pair that really is more assisted', () => {
    expect(atMostAsAssisted(DEFAULT_ASSISTS, { ...DEFAULT_ASSISTS, pace: 'gentle' })).toBe(true);
    expect(atMostAsAssisted(DEFAULT_ASSISTS, DEFAULT_ASSISTS)).toBe(true);
  });

  it('rejects a pair that is more assisted on one knob and less on another', () => {
    // The case the whole partial order exists for: these two are NOT comparable, and claiming they
    // are would assert an ordering between them that the design does not promise.
    const a: Assists = { ...DEFAULT_ASSISTS, pace: 'gentle' };
    const b: Assists = { ...DEFAULT_ASSISTS, terrain: 'solid' };
    expect(atMostAsAssisted(a, b)).toBe(false);
    expect(atMostAsAssisted(b, a)).toBe(false);
  });

  it('rejects a strictly less assisted pair, in the wrong direction', () => {
    expect(atMostAsAssisted({ ...DEFAULT_ASSISTS, pace: 'gentle' }, DEFAULT_ASSISTS)).toBe(false);
  });

  it('ranks every position on every ladder, so no knob silently compares as equal', () => {
    for (const knob of ASSIST_KNOBS) {
      const ladder = ASSIST_LADDER[knob] as readonly string[];
      const ranks = ladder.map((value) => rank(knob, { ...DEFAULT_ASSISTS, [knob]: value } as Assists));
      expect(ranks, `${knob} does not rank its own positions in order`).toEqual(ladder.map((_, i) => i));
    }
  });

  it('enumerates every combination exactly once', () => {
    expect(ALL.length).toBe(3 * 3 * 2 * 2 * 2 * 2);
    expect(new Set(ALL.map((a) => JSON.stringify(a))).size).toBe(ALL.length);
  });
});
