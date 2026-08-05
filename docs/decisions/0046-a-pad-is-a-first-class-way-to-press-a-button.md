# 0046 — A pad is a first-class way to press a button

**Accepted 2026-08-06.** Reported from play: *"gamepad controls on title screens — currently not
working."* The countdown on the run-over screen was asked for in the same list and lands here because
it needs the same thing: **a step that happens on a screen the simulation is stopped on.**

## The rule

| | |
|---|---|
| **the frame** | a step on a non-stepping screen calls `onIdle` and returns. It is not a no-op |
| **the pad** | `src/app/menu.ts` — a second reader of the same hardware, reading EDGES not levels |
| **keyboard and touch** | unchanged. The DOM already activates a focused `<button>` for both |
| **the focus ring** | the chrome's own class, not `:focus-visible` |
| **a screen's controls** | a LIST on the row, and the ring wraps |
| **a screen that expires** | `timeout: { steps, then }` on the row, counted in fixed steps |

## Why the pad needed a second reader and the other two devices did not

**Because the DOM cannot see a gamepad.** The Gamepad API emits no events at all —
`navigator.getGamepads()` is a snapshot and nothing else — so no `click` listener anywhere can hear a
pad, however it is bound. Keyboard and touch work on these screens today precisely because
[0024](0024-the-accessibility-floor-is-settings.md)'s floor made the controls real `<button>`
elements, and the platform activates a focused button from Space, Enter and a tap by its own
conventions.

So there is exactly one device missing, and adding it must not disturb the two that work.

⚠️ **Routing all three through `Intent` would fire every control twice** — once from the browser, once
from the shell reading the same press back out of `src/sim/intent.ts`. `Space` is bound to `special1`
in `DEFAULT_BINDINGS`, so that is not a hypothetical: it is the first key a player presses on the
title screen.

⚠️ **A menu wants edges; flying wants levels.** `src/app/pad.ts` reads the stick as a level held down,
which is right for a ship and unusable for a list — one nudge would travel the whole thing. Neither
reader is a special case of the other, and the two never run on the same step: `src/app/frame.ts`
samples the combiner while the simulation steps and the menu reader while it does not. A step still
costs exactly one snapshot, which matters because that call is the one thing in the input layer that
genuinely allocates.

## Why this does not contradict 0030

[0030](0030-input-is-actions-and-needs-no-new-layer.md) says input is actions and needs no new layer,
and `docs/state-of-play.md` named this bug as *"the case that tests the claim."* It survives, with a
distinction it did not previously have to make:

**0030 is about what the SHIP does.** Its binding table is the vocabulary of the game — move, and
spend a special — and it is saved, rebindable and reachable from `save/`. A menu is not the game. The
confirm button here is the bottom face button and Start, written down in `src/app/menu.ts`, and
deliberately **not** whatever `special1` currently maps to: a player who rebinds their arsenal must
not thereby be unable to leave the title screen.

No new layer was added. `src/app/menu.ts` is `app/`, beside the other three device readers, and
nothing below the shell learned that a menu exists.

## Why the focus ring is the chrome's own class

⚠️ **Because `:focus-visible` is a heuristic about how focus ARRIVED, and script does not qualify.**
Focus moved by `element.focus()` is classified as not-visible by most engines, so a player navigating
with a stick would watch a menu with no cursor in it — [0024](0024-the-accessibility-floor-is-settings.md)'s
*every cue has a visual twin* failing on the one device that cannot see the default.

The class is set by the chrome whenever it moves focus, draws the same outline in the same ink, and
sits alongside `:focus-visible` rather than replacing it. The element is still focused for real, so
the keyboard, the screen reader and the pad all agree about where the player is.

## Why a screen's controls became a list

Every screen has exactly one control today, and a focus ring over one control is still the thing a pad
needs. But a ring is only *meaningful* over a list, and the next two screens the roadmap has —
choosing a difficulty, choosing a destination on the chart — are both choices.

This is `docs/game.md`'s own argument for the arsenal being a list rather than a slot, applied to
chrome: *a shape that decides how many there can be is a rewrite instead of an addition.* `actions:
readonly string[]` costs one `forEach` and closes the question.

## Why the countdown is on the run-over screen and on no other

Asked for: *"this screen should have a 7 second countdown; when it expires, the player is returned to
the title screen."* It is the right screen and it is the only one.

- **`cleared` and `victory`** both sit on top of something the player earned. Timing either out throws
  a run away while its owner is reading about it.
- **`playing`** timing out would end a run nobody lost.
- **`title`** has nowhere to go.

`tests/menu.test.ts` holds the absence as well as the presence — a screen that grows a timeout has to
argue with that test rather than slip past it.

⚠️ **Counted in fixed STEPS, not in milliseconds.** The screen is not stepping the *simulation*, but
the loop is still stepping it at 60Hz ([0022](0022-frame-rate-is-a-feature.md)), so a step is the unit
already available and it is exact. A wall-clock timer here would be the one thing on these screens
running at display rate, and it would run fast on a 144Hz display and stall on a throttled tab.

⚠️ **`STEPS_PER_SECOND` is exported from `src/state/screens.ts` and not imported from
`src/app/loop.ts`**, because [0015](0015-the-layer-ladder.md)'s arrow runs the other way. Two
spellings of "sixty" is the second description `tests/one-description.test.ts` exists for.

## Why the timeout re-arms rather than pausing

`src/app/mount.ts` re-arms the countdown whenever the screen is applied, including when the
orientation gate lets the game become playable again. The gate stops the loop outright
([0031](0031-landscape-is-the-shipped-orientation.md)), so `onIdle` does not run and the timer would
otherwise resume mid-count on a screen nobody has seen since. *How long has the run-over screen been
up while it was invisible* has no honest answer other than "it has not".

⚠️ This is **not** a second mechanism for a guarantee that already has one — the rule
`src/app/mount.ts` learned the hard way over `stepping`. Nothing else re-arms a timer; there is one
mechanism, and it is this one.

## Confirmed, not assumed

`npm run prove 0046` — every guard broken on purpose and seen to fail.

| broken | what went red |
|---|---|
| the stick read as a level, so a held push moved the focus every step | `reports one move for a push and holds silent until it comes back` |
| confirm read as a hold, so one press activated every screen it passed through | `fires once for a button held down across many steps` |
| the edge held as a boolean, so reversing without releasing was never heard | `hears the opposite direction without a trip through the centre` |
| the frame stepped nothing on a menu screen, so the pad was never read at all | `starts a run from the title screen with nothing but the pad` |
| the countdown reached zero and changed nothing | `counts down and returns to the title with no input at all` |

⚠️ **The fourth is the reported bug, restored exactly.** It is the one that could not have been fixed
by any binding, because before this decision no device was sampled at all on a screen that does not
step.

## What this does not do

- **No pause screen and no settings screen.** Both remain where `docs/state-of-play.md` has them, and
  whichever lands first still carries the back-intent switch [0017](0017-the-state-is-slices.md)
  defers.
- **No back or cancel action.** Nothing on any current screen is a thing to back out of. Adding one is
  a row in `MENU_CONFIRM_BUTTONS`'s neighbourhood, not a shape change.
- **No rumble, no pad glyphs, no "press any button".** All three are real and none is asked for.
