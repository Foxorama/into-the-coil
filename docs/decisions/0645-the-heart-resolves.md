# 0645 — The heart resolves

**Accepted 2026-10-20.** Builds what [0418](0418-the-heart-lets-go.md) owed: *"the victory piece."*

## The ask

[`the-road-to-v1`](../../reports/the-road-to-v1-2026-10-19.md) question 2 was answered *"Victory music, yes."*
Three ways to make it were offered, and the answer was ***"Black Heart resolves into the triumphant title
theme."***

## What was there

The finale played The Black Heart's music on, and the victory screen played the menu's title track from its
quiet opening ([0597](0597-the-title-track-plays-in-the-menu.md)), a drone and a pad waking up. Every place has a
coda, its last bar, and the album strikes it ([0331](0331-the-heart-beats-under-it.md),
`src/content/codas.ts`). The game never had: *"the album renders it today; the game is owed it."*

## The rule

**When the jellyfish dies, The Black Heart's coda is struck, and the title's theme comes in under its held
chord. It plays over the finale and on into the victory screen.**

- **The coda.** It is baked when the last boss arrives and held through the fight. It is struck at the bar
  after the finale begins, and the place's bed lets go over a third of a second, as on the album. The coda
  uses the album's notes and its levels: each part at the loudest its layer is anywhere in the level, trimmed
  by `GAME_CODA_TRIM_DB`. The game cannot measure its own mix, so the album's rule (the coda 1.5 dB under
  what it follows) was measured once on the ending's render.
- **The theme.** `VICTORY_SCORE` is a second score on the title track's own seven parts. It enters on the
  theme with everything under it, brings back the pad that only the menu's opening had, and puts the flute
  over the climb. Its breath is the menu's own breakdown. **It never goes back to the drone-and-pad floor.**
- **When.** `VICTORY_ENTERS_BARS`, five bars after the strike. The coda's lead walks down onto its long A over
  its fourth and fifth bars, and the theme rises over two, so one becomes the other. In the finale's own time
  that is about eleven seconds after the death, as the two ships turn to leave.
- **After.** The victory screen goes on with the same piece. Back to the menu, the menu's score takes over at
  the end of the pass on the air. A new run hands the bed back as the menu always has. If no title ever
  followed the coda (the sound turned off under the ending), the bed is still handed back for the next run.

## Measured

On `ending-0645.wav`, a render of eight bars of the fight at its peak, the coda, and the theme, on the game's
own samples, gains and shaper. Integrated loudness over each stretch:

| | LUFS |
|---|---|
| the fight, at its peak | −22.4 |
| the coda, struck | −23.7 |
| the coda, ringing | −24.6 |
| the theme, entering | −28.0 |
| the theme, full | −25.9 |
| the breath | −26.9 |

**The fight's own peak levels were tried first, and struck the coda at −37.1**, fifteen decibels under the
fight. The fight's bed is its drums, and the coda's pad, lead and drone sit low in it. At the album's levels
untrimmed it was −19.8, 2.6 over: the ballad's piano and flute are the loudest those layers ever are. The trim
is the album's correction for the same thing.

Memory: the last place (88.6 MB), the title (16.9 MB) and the coda (2.1 MB) are held together over the finale,
under the 145 MB line. The title bakes in 0.64 s single-threaded and enters eight seconds after the strike, so it
is baked when the finale starts. The coda is 215 ms of synthesis and is baked when the boss arrives, so none of
it lands on the death.

## What guards it

`tests/title-menu.test.ts`, *0645 — the heart resolves into the title theme*:

- **The ask:** the ending opens on the theme and no section drops back to the floor.
- **The coda is struck at a bar over the bed letting go, the theme waits five bars**, and the bed is not raised
  again under it. A run after it gets its bed back.
- **With no title after the coda**, the next run still gets its bed.
- **Which screens:** the ending plays from the finale to the victory screen. The coda is held from the last
  boss's arrival to the finale, and neither happens with the sound off.
- **The coda bakes whole, in jobs, to the same samples straight through.**
- **Budget:** the place, the title and the coda held together are under 145 MB.

The probes in `scripts/probes/0645-the-heart-resolves.mjs` break the first three.

## Not held by any guard

- **Whether it sounds triumphant.** It is the title's own theme at its own levels, arranged fuller, and in A
  minor. If it wants to be brighter, that is a key change or a lifted lead, and a composition question.
- **The levels.** −4.1 is a measurement on one render, not a rule the game re-measures.
- **The music room** does not have the ending. It auditions places, and this is not one. Adding it is a new
  kind of room entry.

## Owed

- **The ear, on the built game**: a whole finale, from the death to the victory screen. `ending-0645.wav` is a
  first listen.

## Rollback

None owed ([0001](0001-revertability-not-risk-rating.md)): nothing stored. Reverting puts back the Black Heart
playing on through the finale and the menu's opening on the victory screen.
