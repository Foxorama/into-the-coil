/**
 * The actions the player can ask for, and what they are bound to by default.
 *
 * See `docs/decisions/0030-input-is-actions-and-needs-no-new-layer.md`.
 * `docs/decisions/0024-the-accessibility-floor-is-settings.md` puts **actions, not keys** in the
 * unconditional floor: nothing in the game reads a key, so rebinding is a table edit rather than a
 * hunt through the shell.
 *
 * ── WHY THIS IS IN `content/` AND NOT IN `app/` ─────────────────────────────────────────────────
 *
 * Because bindings are SAVED. `save` may import `content`; it may not import `app`. A binding table
 * in the shell is one that cannot be persisted without widening the layer arrow, and
 * `docs/decisions/0015-the-layer-ladder.md` says the fix for that is never to widen the row. The
 * shell keeps the listeners; the vocabulary lives here, where the reducer and the save can both see
 * it.
 *
 * ── THE ARSENAL IS A LIST; THIS TABLE IS A BUDGET ───────────────────────────────────────────────
 *
 * `docs/game.md`: *the arsenal is a LIST, never a slot*. The two are different numbers. A ship
 * carries `Special[]` of any length; this table says how many of them currently have a trigger.
 * **`special1` and `special2` are positions in the arsenal, not weapon kinds** — a bomb picked up
 * into slot 2 uses `special2`, and so does a shield. Naming them by kind would put content in the
 * binding table and give every future pickup a migration.
 *
 * Adding a third trigger is one row here plus one row in `DEFAULT_BINDINGS`. It changes no type, no
 * save, and nothing in `sim/`. That is the whole point.
 *
 * ⚠️ **There is no `fire` action and there must never be one.** The base weapon and every upgrade to
 * it fire themselves unconditionally — see `src/sim/assist.ts`, where auto-fire is deliberately kept
 * off the assist ladder. An action named `fire` is the first step back toward a game about holding a
 * button, which is the one thing `docs/game.md` says this game is not.
 */

/** Every action, closed. A new one fails the tables below to BUILD until it is given a row. */
export type Action = 'alongMinus' | 'alongPlus' | 'acrossMinus' | 'acrossPlus' | 'special1' | 'special2';

/**
 * How an action is read.
 *
 * `axis` is a level — held down, sampled every step. `edge` is an event — counted on the press and
 * consumed once, per `src/sim/intent.ts`.
 */
export type ActionKind = 'axis' | 'edge';

export interface ActionRow {
  kind: ActionKind;
  /** For an `axis` action: which way it pushes, −1 or 1. `null` for an edge. */
  sign: -1 | 1 | null;
  /** For an `edge` action: which special binding it pulls, 0-based. `null` for an axis. */
  slot: number | null;
  /** What the player would call it. Terse, per `docs/game.md`'s voice rule. */
  label: string;
}

/**
 * The table. A `Record` over the closed union, per
 * `docs/decisions/0016-a-hub-enumerates-kinds.md` — behaviour rides the row, so nothing downstream
 * needs a `switch` over action names.
 */
export const ACTIONS: Record<Action, ActionRow> = {
  // ⚠️ Labels describe the LANDSCAPE screen, which is the only orientation shipped. `across`
  // increases 90° clockwise from `along` (0023), so in landscape it runs down the screen.
  alongMinus: { kind: 'axis', sign: -1, slot: null, label: 'Back' },
  alongPlus: { kind: 'axis', sign: 1, slot: null, label: 'Forward' },
  acrossMinus: { kind: 'axis', sign: -1, slot: null, label: 'Up' },
  acrossPlus: { kind: 'axis', sign: 1, slot: null, label: 'Down' },
  special1: { kind: 'edge', sign: null, slot: 0, label: 'Special 1' },
  special2: { kind: 'edge', sign: null, slot: 1, label: 'Special 2' },
};

/** Written out rather than derived, so the table above cannot quietly lose a row. */
export const ACTION_NAMES: readonly Action[] = [
  'alongMinus',
  'alongPlus',
  'acrossMinus',
  'acrossPlus',
  'special1',
  'special2',
];

/**
 * The world axes an action can push along — `docs/decisions/0023-the-long-axis-is-the-scroll-axis.md`'s
 * two, and there is no third.
 */
export type Axis = 'along' | 'across';

/** Which action pushes which way on each axis. Read by the shell when it samples. */
export const AXES = {
  along: { minus: 'alongMinus', plus: 'alongPlus' },
  across: { minus: 'acrossMinus', plus: 'acrossPlus' },
} as const satisfies Record<Axis, { minus: Action; plus: Action }>;

/**
 * How many specials currently have a trigger.
 *
 * ⚠️ **Derived from the table, never written as a literal.** A hand-kept `2` beside a table of two
 * is the second description of one fact — the failure `tests/one-description.test.ts` exists for.
 */
export const SPECIAL_BINDINGS: number = ACTION_NAMES.filter((a) => ACTIONS[a].kind === 'edge').length;

/**
 * Default bindings, as `KeyboardEvent.code` — physical position, not the letter printed on the key.
 *
 * ⚠️ **`code` rather than `key` is the accessibility-floor answer, not a preference.** On an AZERTY
 * or Dvorak layout `key` moves WASD somewhere unreachable while `code` keeps the same three-under-one
 * shape everybody's hand already knows. It also means a binding table is layout-independent, so a
 * saved binding travels between machines.
 *
 * More than one key per action, because arrows and WASD both being "the obvious one" is not a
 * conflict to resolve — it is two players.
 */
export const DEFAULT_BINDINGS: Record<Action, readonly string[]> = {
  alongPlus: ['KeyD', 'ArrowRight'],
  alongMinus: ['KeyA', 'ArrowLeft'],
  acrossMinus: ['KeyW', 'ArrowUp'],
  acrossPlus: ['KeyS', 'ArrowDown'],
  special1: ['Space'],
  special2: ['ShiftLeft', 'ShiftRight'],
};
