# 0024 — The accessibility floor is settings over one vibrant default

**Accepted 2026-08-04**, before the first game screen, as `docs/game.md` said it had to be. Lands
`src/sim/assist.ts`. **Supersedes one clause of [0022](0022-frame-rate-is-a-feature.md)** and one
paragraph of `docs/game.md`, both named below.

## The rule

**There is one game, and it is the loud one.** Fast, bright, full of audio cues and warnings. Nothing
in this decision restrains it. Accessibility is reached by **turning knobs over that default**, and
`DEFAULT_ASSISTS` is literally the game as designed — every knob at its least-assisted position.

Everything in the floor sits in exactly one of three tiers.

### Unconditional — true of the default, cannot be switched off

These cost nothing *now* and are unaffordable later, which is the entire reason this decision lands
before the first screen rather than before launch.

| | what it means | why it is free today |
|---|---|---|
| **Colour never carries meaning alone** | anything colour distinguishes is also distinguished by shape, icon, position or motion | there is no art yet, so a second channel is a design constraint rather than a rework |
| **No information by audio alone** | every cue that tells the player something has a visual twin. Audio stays loud and additive — it is the *only* channel that is banned, not the sound | the cue table does not exist, so the twin can be a required field on the row |
| **A flash-intensity cap** | no more than three general flashes per second, and a bounded luminance delta between frames. This is safety, not preference, so it is not a setting | the renderer does not exist |
| **Controls are remappable** | the input layer maps *actions*, never keys. A key literal in a handler is the bug | the input layer does not exist |
| **The first stage is interactive** | no unskippable non-interactive opening | nothing is authored yet |

⚠️ **The flash cap is deliberately not a setting.** Photosensitive epilepsy is a safety matter and a
default that has to be found in a menu has already failed the player it exists for. A *stricter*
setting sits above the cap; there is nothing below it.

### Settings — opt-in, and they change nothing until chosen

**Presentation** (owned by `render/`): high-contrast and colour-blind palettes, reduced motion, a
stricter flash setting. These are free because [0022](0022-frame-rate-is-a-feature.md) already bakes
art as a pure function of `(kind, variant, palette, view)` — an alternate palette is a re-bake, not a
second art pass.

**Assists** (owned by `src/sim/assist.ts`): pace, resilience, hurtbox, terrain, auto-specials, and
flight assist. A closed set of small ladders, each ordered least-assisted first.

### Refused, and named so nobody re-proposes them by accident

**Blind-friendly play.** For a positional shooter that is a different game, not a setting.

**Textless.** The same. `docs/game.md`'s terse-text rule gets most of the benefit at none of the cost.

**An authored assist path per level** — and this one was previously *confirmed*. It is dropped. See
below.

## The admission rule, which is what the three tiers are actually for

> **An accessibility item is accepted if it is a property of the architecture, or a knob over it. It
> is refused if it constrains what a level may contain.**

This exists because the expensive failure here is not omitting an item. It is admitting one that
quietly taxes every piece of content forever, and is enforced by nothing but memory — so it gets
half-remembered, argued with at the worst moment, and eventually either strangles the game or is
abandoned along with the players it was for.

Every item in the first two tiers passes the rule. One confirmed item does not, and dropping it is
the rule doing its job rather than a change of heart.

## Dropped: the authored horizontal assist path, and the law it required

`docs/game.md` said one-button play requires *"an **authored** horizontal assist path per level"* and
that *"anything demanding cross-axis evasion is scripted, not reactive."*

**Both are dropped.** Four reasons, in order of weight:

1. **The law bans the genre.** Cross-axis evasion *is* a scrolling shooter. A rule that every moment
   demanding it must be scripted rather than reactive rules out aimed shots, homing shots and
   anything that responds to where the player is — which is most of the Jörmungandr arsenal
   `docs/game.md` names as the model for every boss in the game.
2. **The path is a per-level tax with no end.** It must be authored once and then *re-validated every
   time the level changes*, and the only honest guard for it is a headless clearability proof per
   level. That is real infrastructure serving one setting.
3. **What it delivers is not the goal.** A ship following an authored path with auto-fire on is a game
   playing itself. "Completable" is not "enjoyable by anyone".
4. **It is enforced by memory.** Nothing can check it. It is precisely the class of half-recorded
   constraint that shows up two years later to block work nobody can connect it to.

**What replaces it is better, and cheaper.** The thing that makes this genre hard is not the number
of buttons — it is continuous, accurate, fast movement under time pressure. One-button play does not
fix that; it substitutes an autopilot. The assist ladder attacks it directly and *continuously*, which
also serves the much larger group of players who want some help rather than all of it.

**One-button survives as an input mapping, not as a content constraint.** A rail scheme — hold to
travel one way across the lane, release to travel back — is reactive, needs no authored path, and
lives entirely in the input layer. It costs one row in a table that does not exist yet, and **if it
plays badly it is deleted with no level rework**, which is the whole point of moving it out of
content.

⚠️ **It needs `specials: auto`, and that is not the default.** Auto-fire covers the base weapon and
its upgrades only — every special, shield, bomb and heavy is manual, because `docs/game.md` puts the
skill in a well-timed special rather than in holding a trigger, and firing the arsenal for the player
would remove the thing the fight is made of. So the input floor of the *default* game is movement
plus one trigger per owned weapon. A rail scheme spends its single button on movement and has nothing
left, which means one-button play is the rail mapping **and** the auto-specials assist together —
two opt-in settings, neither of which touches how the default game plays.

⚠️ **The tag is not claimed until it has been played.** itch's *"One button"* is a promise that the
game can be cleared that way, and nothing in this repo can currently know whether that is true. The
architecture reserves the possibility; the store page waits for evidence.

### What this supersedes

- **[0022](0022-frame-rate-is-a-feature.md)** lists *"the one-button clearability proof"* among the
  things the fixed timestep rests on. That proof is no longer owed. Everything else in that sentence
  — the seeded run, the resume, the replays — still stands, and the fixed timestep is unaffected.
- **`docs/game.md`**'s accessibility paragraph is amended in the same commit.

Per this folder's rule, neither file is edited into agreement with a story it did not tell. 0022 is
left as written; this file is where the change is recorded.

## Assists travel with the run, not with the device

An assist changes the model — `timeRate`, `playerDamage`, `hurtbox`, `terrainDamage` are all inputs
to `step`. So a replay taken with assists on and played back with them off diverges on the first
contact, and the assists are part of what a seeded run reproduces. They are plain data
([0017](0017-the-state-is-slices.md)) and they belong in the save beside the drafted pool and the
level reached ([0021](0021-one-stream-per-concern.md)).

## A cosmetic setting can never touch the sim

Palette, reduced motion and flash intensity may not appear in `Assists`, in either direction. A
player who turns the flashing down must not thereby be playing an easier game, and one who turns it
up must not be playing a harder one — otherwise seeing the game comfortably and playing it at
everyone else's difficulty become the same choice.

This is [0022](0022-frame-rate-is-a-feature.md)'s device-scaling rule pointed at a second axis:
**anything that varies for comfort must be incapable of changing the outcome.** `tests/assist.test.ts`
holds the ban list.

## Every assist is monotone, and it is proved exhaustively

**No combination of assists is harder than a less-assisted one.** Checked over all 144 states and all
2,916 comparable pairs, not sampled — the failures that matter are interactions between two knobs
nobody thought to try together, and at this size exhaustive costs nothing.

This is what makes the set safe to *grow*. A knob added in a year is checked against every existing
combination automatically, so nobody has to re-reason about the interactions, and the "invulnerable
except to scenery" hole cannot be reintroduced quietly.

Two orientations make the proof a single comparison rather than a per-field argument, and a new field
must be phrased to fit them: in `Tuning`, **lower is never harder** (so `playerDamage`, never
`playerToughness`); in `Granted`, **true is never harder**.

⚠️ **An exhaustive proof over a partial order is worth exactly what its comparator is worth.** A
comparator broken in the restrictive direction leaves every assertion passing having compared
nothing, while looking like the most thorough file in the repo. The number of pairs found is
therefore asserted exactly, and the last probe below breaks the comparator to prove that number
means something.

## Reopening this, on purpose

The named triggers, because a floor that cannot be revised is the thing this decision is most at risk
of becoming:

- **A knob is missing** → add it to the ladder. Monotonicity is re-proved automatically; nothing else
  needs re-reasoning.
- **The rail scheme plays badly** → delete it. It is an input mapping. No content changes.
- **An item is wanted that constrains level content** → that is a decision, and it needs a file in
  this folder saying what it bought and what it costs per level, forever.
- **Blind-friendly or textless is wanted** → also a decision, and a large one. They are refused here,
  not forbidden.

## Confirmed, not assumed

Per [0005](0005-a-guard-must-be-seen-to-fail.md) and [0019](0019-a-probe-must-be-seen-to-apply.md),
declared in `scripts/probes/0024-assist.mjs` and re-run by `npm run prove` on every PR.

| broken on purpose | went red |
|---|---|
| an assist that makes the game harder — a "forgiving" hurtbox that is larger | `never makes the game harder, in any combination of knobs` |
| invulnerability that scenery ignores — the classic hole in an assist mode | `resilience at its end stops every source of damage, terrain included` |
| a knob wired to nothing — a placebo setting, which satisfies monotonicity perfectly | `every knob actually does something` |
| a comfort setting admitted as a difficulty knob | `no presentation setting has appeared among the knobs` |
| the shipped default quietly assisted, so nobody ever plays the game as designed | `the default is the vibrant game` |
| a ladder written most-assisted-first, so "more assist" points the wrong way | `the default is the vibrant game` |
| the ordering comparing nothing, which passes every monotonicity assertion vacuously | `never makes the game harder, in any combination of knobs` |

## Not guarded yet, and the triggers are named

The unconditional tier has no code to assert against. Each lands with the surface it constrains, the
same move [0014](0014-the-privacy-guard-lands-before-the-first-key.md) made for the storage keys:

| | lands with |
|---|---|
| every cue has a visual twin | the cue table — a required field on the row, so the compiler asks |
| colour never alone | the palette table and the first baked sprite |
| the flash cap | the painter, counted like 0022's draw calls rather than watched |
| actions, not keys | the input layer |
