import { describe, expect, it } from 'vitest';
import { PICKUPS, PICKUP_KINDS, faceOf } from '../src/content/pickups.ts';
import { MISSILES, MISSILE_KINDS } from '../src/content/missiles.ts';
import { SHOTS } from '../src/content/shots.ts';
import { SPECIALS, SPECIAL_KINDS } from '../src/content/specials.ts';
import { STEPS_PER_SECOND, faceCard } from '../src/state/screens.ts';

/**
 * THE KEY OPENS — `docs/decisions/0580-the-key-opens.md`.
 *
 * *"have the icons and have a tap on them pop up a window with their stats"* — answered *"tap icons"*. What
 * is held here is what each face's sheet says: every face has one, under the name and the line the key
 * already gives it, and its numbers are its rows' in the player's units.
 */

describe('a face’s sheet', () => {
  it('exists for every face of every pickup, under the name and the line the key gives it', () => {
    for (const kind of PICKUP_KINDS) {
      PICKUPS[kind].faces.forEach((_, face) => {
        const card = faceCard(kind, face);
        expect(card.title, `${kind} face ${face}`).toBe(faceOf(kind, face).label);
        expect(card.said, `${kind} face ${face}`).toBe(faceOf(kind, face).hint);
        expect(card.lines.length, `${kind} face ${face} has nothing to say`).toBeGreaterThan(1);
        expect(card.lines[0]!.value, `${kind} face ${face} does not say which pickup it is on`).toContain(PICKUPS[kind].label);
      });
    }
  });

  it('puts a special on its own trigger, and says how far a thrown one goes off', () => {
    for (const kind of PICKUP_KINDS) {
      PICKUPS[kind].faces.forEach((_, face) => {
        const card = faceCard(kind, face);
        const special = SPECIAL_KINDS.find((k) => SPECIALS[k].label === card.title);
        if (special === undefined) {
          expect(card.side, `${kind} face ${face} names a trigger and is no special`).toBe(null);
          return;
        }
        expect(card.side, `${card.title} is put on another trigger`).toBe(SPECIALS[special].side);
        const thrown = SPECIALS[special].shot !== null && SPECIALS[special].reach > 0;
        expect(card.lines.some((l) => l.label === 'Goes off'), `${card.title}: a reach said ${thrown ? 'nowhere' : 'for a special that is not thrown'}`).toBe(thrown);
      });
    }
  });

  it('says a missile’s hit in pulses and a seeker’s life in seconds, off their rows', () => {
    MISSILE_KINDS.forEach((missile, face) => {
      const card = faceCard('missile', face);
      const row = MISSILES[missile];
      expect(card.title).toBe(row.label);
      expect(card.lines.find((l) => l.label === 'Each hit')?.value).toBe(String(SHOTS[row.shot].damage / SHOTS.pulse.damage) + ' pulses');
      const flies = card.lines.find((l) => l.label === 'Flies')?.value ?? '';
      if (row.guidance === 'homing') expect(flies, `${missile}'s life`).toContain((row.fuse / STEPS_PER_SECOND).toFixed(1) + ' s');
      else expect(flies, `${missile} is said to hunt`).not.toContain('Hunts');
      expect(card.lines.find((l) => l.label === 'Both tubes full')?.value, `${missile}'s surge`).toContain(SPECIALS[row.special].label);
    });
  });
});
