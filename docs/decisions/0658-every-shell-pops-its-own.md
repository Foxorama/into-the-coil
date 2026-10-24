# 0658 — Every shell pops its own

**Accepted 2026-10-24.** From [`the-notebook-pages`](../../reports/the-notebook-pages-2026-10-24.md), item 9. Amends
the `shield` cue, which every shell played.

## The ask

> *"Shield pop noise is bad + should be specific per shield."*

## The rule

**A shell names the sound of it taking a hit on its own row** — `pop: CueKind` on `ShieldShell` in
`src/content/shells.ts`. The frame plays the worn shell's `pop` where it played `shield`, on the same step and with
the same rule: a hit the shell takes and the hull survives.

- **The field is required, not defaulted.** Ten shells, ten rows; a shell added without a voice fails `tsc`, which is
  the 0282 shape — every instance authors its own, and shared code holds no character.
- **No two shells share one.** That is what *"specific per shield"* asks, and it is held by a test rather than by
  convention.
- **`shield` stays the honeycomb's, and is redesigned**: it was octaves rising through a square and two bands of
  noise, a buzz more than a pop. It is a struck cell of glass now — a high tink rising a fourth onto the root, a glint
  over it, the body and the same low lean into the root under it.
- **Every pop still rises**, for the reason written above `shield` in `src/content/cues.ts`: a hit the shell takes is
  the player gaining by surviving, and the death below it falls. Each of the nine others is its shell's material —
  the bubble's film, the plumes' feathers, the lattice's struck bars, the storm's crackle, the seeds' rattle, the
  drips' plinks, the aurora's shimmer, the runes' chime and the disco ball's glitter — on the shell's own twin,
  `shell-mark`, inside a beat, so none of them needs a duck.

## Rejected

- **One pop pitched per shell.** One shape transposed is the same sound to the ear, and the ask is for each shield's
  own; it would also be a mechanism whose output differs only by a number on the row.

## What guards it

`tests/shells.test.ts`, *0658*: every shell names a real cue and no two share one; and a hit a shield takes, through
the real frame, plays the worn shell's pop and not the honeycomb's. The probes in
`scripts/probes/0658-every-shell-pops-its-own.mjs` play `shield` for every shell, and give the bubble the honeycomb's.
`tests/sound.test.ts` reads `src/content/shells.ts` among the sources a cue may be named in, so the nine new cues are
not dead weight.

## Not held by any guard

Whether each sounds like its shell. That is the player's ear, and the play is owed it.

## Rollback

None owed ([0001](0001-revertability-not-risk-rating.md)).
