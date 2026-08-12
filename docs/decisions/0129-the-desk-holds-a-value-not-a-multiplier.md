# 0129 — The desk holds a value, not a multiplier

**Accepted 2026-08-12.** [0126](0126-the-dashboard-is-the-instrument.md)'s desk could push a layer
that was already playing and could not reach one that was not. Reported the same day:

> *"I need to be able to either have a new bit or use the 'what is sounding' section to also turn on
> sounds that aren't playing at the moment to see what they would sound like if played and adjust the
> doing etc individually. Basically need a lot more individual control so it's a full dashboard and
> not just a testing dashboard for what we currently have."*

## ⚠️ The defect is one multiplication

The first desk held a **trim over the mixer's own target**, and `trim × 0` is 0. At `run` the ladder
has **fourteen of the twenty-three layers closed**, so the entire arrangement the level has not
reached yet — `drive`, `crash`, `dread`, `toll`, `counter`, `stomp`, `frenzy`, `wraith` and the rest
— was **unreachable from the panel built to audition layers.** The one question a mixing desk exists
to answer is *what would this sound like here*, and it could only answer it for things already
audible.

## The rules

**A hold is an absolute value.** `null` follows the mixer; a number is what that layer sits at,
whatever the rung says. A layer `run` closes can be dragged to 0.9 and heard over `run`.

**Touching a fader takes the layer; `follow` gives it back.** There is no separate arm control — a
checkbox between wanting a thing and hearing it is a step this panel exists to remove.

**A layer's PLACE is a fader too.** `MusicOut.panOf` is `gainOf`'s twin. 0118 fixed sixteen off-centre
values at construction and the game never moves one, so **those sixteen numbers have never been heard
moved.** The fader runs to ±1.0 while the game's own limit is 0.65 — past the limit is a question, not
a setting.

**Nothing under `src/` may call either accessor**, and `tests/dash.test.ts` scans for both. The
argument is stronger for `panOf` than for `gainOf`: a call site in the shell would not be a second
opinion about the field, it would be **the only one**, and `tests/music.test.ts`'s guard that a
low-heavy layer is centred would be measuring a table nobody obeys.

**The copy button prints the desk as something pasteable.** A mix found by dragging faders is worth
nothing if turning it into `MUSIC_LADDER` or a theme's `mix` means reading numbers off a screenshot.

## What the three bulk buttons are for

| | |
|---|---|
| **open everything** | every layer held at 0.7, *including what the rung has closed* — the answer to *what is even in here* |
| **silence everything** | every layer at 0, so one fader at a time is a solo you build up |
| **hand it all back** | the mixer's, untouched, which is the only state a transition may be judged in |

⚠️ **SOLO HOLDS THE CHOSEN LAYER AT WHAT THE LADDER SAYS, NOT AT A FIXED LOUD VALUE.** Soloing a
layer the current rung closes therefore gives **silence**, which is the honest answer and is exactly
what the gain fader is then for. A solo that quietly forced the layer audible would be answering a
different question from the one the row is showing.

## Confirmed, not assumed

| broken on purpose | went red |
|---|---|
| the shell reaching into a music layer's place, so `LAYER_PAN` stops being the field | `NOTHING UNDER src/ CALLS gainOf OR panOf — the mix and the field are decided in one place` |

⚠️ **AND THE DESK ITSELF IS DRIVEN RATHER THAN GUARDED, WHICH IS STATED AND NOT HIDDEN.** Its logic
is in `rig/dash.ts`, which needs an `AudioContext` and a DOM; the arithmetic that *could* be lifted
into `rig/transport.ts` already is, and what is left is fader-to-`AudioParam`. It was verified by
driving it: at `run`, `frenzy` reads **target 0.00, live 0.90** with the fader up — the exact thing
the old desk could not do — its pan moved to L0.80, *open everything* made all 23 audible, *hand it
all back* returned to `run`'s own seven, and a soloed `chords` pushed to 1.20 came back to 0.87 on
`follow`.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). One read-only accessor and a
dev-only panel. `dist/` is byte-identical.
