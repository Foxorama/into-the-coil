/**
 * The settings: what the player has chosen about how the game LOOKS, not about how it plays.
 *
 * `docs/decisions/0070-a-style-is-a-setting-and-the-first-one.md`. The third slice, and the first one
 * whose contents outlive a run.
 *
 * ⚠️ **A slice of its own rather than a field on the run, and the difference is lifetime.** A run is
 * begun, spent and ended; a setting is chosen once and survives every run after it —
 * `docs/decisions/0039-a-run-is-lives-and-a-death-costs-the-arsenal.md` puts the tier ON the run for
 * exactly the opposite reason. Putting a setting there would mean `begin` resets it, which is the
 * bug rather than the design.
 *
 * ⚠️ **It does not import a sibling** — `docs/decisions/0017-the-state-is-slices.md`. It knows
 * nothing about screens or runs, which is what lets the style be read by the shell without the
 * reducer growing an opinion about what a re-bake costs.
 *
 * ⚠️ **Plain data, because this is the FIRST thing `save/` will persist** and the one most likely to
 * be persisted separately from a run: `docs/game.md` calls the save an interruption hedge for a run,
 * and a setting is not one. `tests/state-shape.test.ts` holds the shape.
 */

import { DEFAULT_STYLE, type StyleKind } from '../../content/styles.ts';
import { type SettingName } from '../screens.ts';

/**
 * What each setting holds.
 *
 * ⚠️ **It may never reach the simulation.** The whole reason a style is a `content` row rather than
 * an `Assists` knob is that `src/sim/assist.ts` bans a cosmetic setting from changing the outcome —
 * and this interface is where that ban would be broken first. `tests/style.test.ts` holds it.
 */
interface SettingValue {
  /** What the game looks like. `src/content/styles.ts` is the table. */
  style: StyleKind;
}

/**
 * The settings, as a `Record` over `SettingName` — the same mapped-type trick `src/state/root.ts`
 * uses for slices, and for the same reason.
 *
 * ⚠️ **`SettingName` lives in `src/state/screens.ts`, and this is what ties the two together.** A
 * screen row offering a setting the state cannot hold fails to BUILD, and a setting added to the
 * state without a name fails here — so *what can be chosen* and *what can be stored* cannot drift
 * apart, which is the thing a settings menu gets wrong first.
 */
export type SettingsState = { readonly [K in SettingName]: SettingValue[K] };

/**
 * ⚠️ **Every action names its slice**, per 0017, so the root dispatches by looking the slice up
 * rather than by switching over action names.
 */
export type SettingsAction = { slice: 'settings'; type: 'style'; style: StyleKind };

/** What a player who has chosen nothing has. The default IS the game — 0024. */
export const initialSettings: SettingsState = { style: DEFAULT_STYLE };

export function reduceSettings(state: SettingsState, action: SettingsAction): SettingsState {
  switch (action.type) {
    case 'style':
      // Identity preserved when nothing moved, so the shell can tell a real change from a repeated
      // dispatch without comparing fields — which is what stops a re-bake per press.
      return state.style === action.style ? state : { style: action.style };
    default: {
      // Adding a member to `SettingsAction` fails to compile HERE, per
      // `docs/decisions/0016-a-hub-enumerates-kinds.md`'s fifth defeat.
      const unhandled: never = action.type;
      return unhandled;
    }
  }
}
