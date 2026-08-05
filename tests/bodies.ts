/**
 * Bodies for tests that do not care about combat.
 *
 * `reset` takes a `Body` rather than a sprite index because an entity now carries the numbers a
 * collision needs — see `src/sim/entity.ts`. Most of the suite predates that and is about position,
 * culling and projection, so it wants "an entity that is drawn as sprite N" and nothing else.
 *
 * ⚠️ **A function rather than a shared constant.** A `Body` is copied by `reset`, so sharing one
 * object between tests would be safe today and would stop being safe the moment something mutated it
 * — and that failure would look like a flaky test rather than like aliasing.
 */

import type { Body } from '../src/sim/entity.ts';

/** A body that is drawn as `index` and is otherwise inert: no reach, no health worth taking. */
export function sprite(index: number): Body {
  return { sprite: index, radius: 0, health: 1, damage: 0 };
}

/** A body with a hurtbox, for the tests that are about contact. */
export function bodyOf(index: number, radius: number, health: number, damage: number): Body {
  return { sprite: index, radius, health, damage };
}
