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

import { DEFAULT_SOUND, type SoundKind } from '../../content/sound.ts';
import { DEFAULT_STYLE, type StyleKind } from '../../content/styles.ts';
import { DEFAULT_TRAVEL, type TravelKind } from '../../content/travel.ts';
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
  /**
   * Whether the game makes any noise. `src/content/sound.ts` is the table.
   *
   * ⚠️ **It reaches `src/app/sound.ts` and nothing else, and that is the whole of its ban.** A cue is
   * emitted by `src/app/frame.ts`, which cannot see this field or the table behind it — so switching
   * sound off silences the speaker and changes nothing the step does.
   * `docs/decisions/0072-a-cue-is-baked-and-played.md`.
   */
  sound: SoundKind;
  /**
   * How much of the crossing between two places the player sits through.
   * `src/content/travel.ts` is the table.
   *
   * ⚠️ **It reaches `src/app/mount.ts` and nothing else, on the field above's exact terms** — 0024,
   * and `docs/decisions/0340-the-coil-is-a-route.md`. What it changes is one number: the shortest
   * the chart is up for. The screen it shortens does not step the world, so there is no arithmetic
   * behind it for a comfort setting to move — and `tests/travel.test.ts` holds that
   * `src/app/frame.ts` cannot see the table, which is the same ban `sound` carries and the same way
   * of holding it.
   */
  travel: TravelKind;
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
export type SettingsAction =
  | { slice: 'settings'; type: 'style'; style: StyleKind }
  | { slice: 'settings'; type: 'sound'; sound: SoundKind }
  | { slice: 'settings'; type: 'travel'; travel: TravelKind };

/** What a player who has chosen nothing has. The default IS the game — 0024. */
export const initialSettings: SettingsState = { style: DEFAULT_STYLE, sound: DEFAULT_SOUND, travel: DEFAULT_TRAVEL };

export function reduceSettings(state: SettingsState, action: SettingsAction): SettingsState {
  switch (action.type) {
    case 'style':
      // Identity preserved when nothing moved, so the shell can tell a real change from a repeated
      // dispatch without comparing fields — which is what stops a re-bake per press.
      return state.style === action.style ? state : { ...state, style: action.style };
    // Same shape, and the identity rule matters here for a second reason: `applySound` sounds the
    // chime, so a rebuilt slice would blip on every unrelated press of the option already chosen.
    case 'sound':
      return state.sound === action.sound ? state : { ...state, sound: action.sound };
    // Same shape again. The identity rule buys nothing here — nothing re-bakes or sounds on a
    // travel change — and it is kept because a slice where one arm answers a repeat differently
    // from its neighbours is a slice somebody has to read three times.
    case 'travel':
      return state.travel === action.travel ? state : { ...state, travel: action.travel };
    default: {
      /*
        Adding a member to `SettingsAction` fails to compile HERE, per
        `docs/decisions/0016-a-hub-enumerates-kinds.md`'s fifth defeat.

        ⚠️ **The ACTION rather than its `type`, now that there is more than one.** With a single
        member the union was one object type and `action.type` narrowed to `never` on its own; with
        two, `action` itself is what TypeScript exhausts, and reading a property off a `never` widens
        to `any` — which is the check silently passing rather than the check.
      */
      const unhandled: never = action;
      return unhandled;
    }
  }
}
