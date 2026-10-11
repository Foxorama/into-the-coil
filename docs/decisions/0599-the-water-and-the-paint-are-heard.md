# 0599 — The water and the paint are heard

**Accepted 2026-10-11.** Asked after the secret pilots landed: *"Did we get proper sounds for all the new
things? And did that get reviewed as well?"* — and then *"yes fix the sound gaps."*

## What was missing

Read off the code, not remembered:

| | was | measured |
|---|---|---|
| **the Water Cannon's jet** | heard only by the cannon's own cue, 0.6 s long, for a jet that plays 2 s | 1.38 s of the jet's 2 s in silence (the guard below, with the spray taken out) |
| **what the jet lands on** | heard only on the two ships whose guns log their landings as blades (the Firebird and the estate), and then as the gun's `hit` | the duck, the fighter and the rest landed it in silence |
| **a paintball's splat** | no sound of its own; the ball's arrival is the generic `hit`, and the splat landing on what is beside it nothing | — |

The review of the secret pilots (0598) was told to look for missing cues and reported none, and nothing in the
sound guards could see either gap. Those guards hold each cue's construction: its body, its level against the
gun, its hold, its room and its picture twin. They never ask whether a thing that plays for two seconds is heard
for two seconds.

## The rule

**The water and the paint are heard as the Catherine wheel is: something while it plays, and something where
it lands.**

| | cue | how |
|---|---|---|
| **while the jet plays** | `spray` | struck from `stepJet` every `SPRAY_EVERY` steps (`VOLLEY_CYCLE`, the crackle's own), panned to where the jet's end is; 0.48 s, so each runs into the next |
| **where the jet lands** | `douse` | from `landJet`, at the first landing's place, as `sizzle` is the tether's; on every ship |
| **where a ball bursts** | `splat` | from `splatPaint`, at the first splat's place; dry, at the marker's rate |

**The jet's landings are no longer counted as the gun's `hit`.** On a ship whose gun logs blades they were,
so the same jet sounded as a gun hit on two ships and as nothing on five. They are `douse` now on every ship
(`doused` comes off `bites`, as the ram's landings already do).

## Why these numbers

- **The levels are the table's own rules.**
  - Every event sounds over the auto-weapon (0145): `spray` and `douse` are at 0.26, the tether's `sizzle`.
  - `splat` is also at 0.26, over the marker's 0.22 and under the `hit` (0.283) that sounds beside it for the
    body it struck.
- **`spray` never ducks the music.** Its picture is a thing appearing, the drops (`spray-appears`), struck on a
  cadence, so it rings over the bed as the cannon's own cue does (0308).
- **`douse` and `splat` are dry.** They land at a gun's rate, and a tail cannot outlast its own repeat (the
  STREAMS rule in `tests/sound.test.ts`).

## Rollback

Nothing irreversible.

## What guards it

`tests/duck.test.ts`:
- **The jet is heard from the press to its last step.** Its two seconds are walked in hundredths, each inside a
  cue it played, and nothing is struck after it ends.
- **Every body it lands on is heard as `douse`, and never as `hit`.** Asked on the duck, the Firebird, the estate
  and the fighter, with their guns held.
- **A splat is heard where it lands.**

The sound table's own guards hold the new rows. Probes are in `scripts/probes/0599-the-water-and-the-paint-are-heard.mjs`.

## Owed

**The ear on all three**, on the built game: whether the spray reads as one jet rather than four strikes,
whether the splat and the `hit` beside it are one sound or two, and the levels. No tool here plays audio, so
none of this has been heard.
