# 0429 — The table is kept

**Accepted 2026-09-30.** The first thing the game keeps between visits, and so the first `itc_*`
key, the first file in `src/save/`, and the first row in `PRIVACY.md`'s table that is not the offline
cache. Companion to [0428](0428-the-score-is-kept.md), whose finished runs are what it keeps.

## The ask

> *"rolling high score table on the game menu screen."*

## The rule

**The best ten runs are kept in `localStorage` under `itc_scores`, best first. A run that beats the
tenth pushes it off, and one that does not is not kept. The title shows the table in the pickup key's
cell, taking turns with the key, and its rows roll up through a window in a loop.**

| | |
|---|---|
| **a row** | score, bonus, pilot, tier, levels cleared, whether the coil was cleared, continues, when it ended |
| **when a run is kept** | at the victory, and when a run over's continue runs out onto the title. Once per run, however it ended |
| **order** | score, highest first. A tie goes to the run that got there first |
| **shape** | `{ v: 1, entries: [...] }`, versioned from the first write ([`docs/game.md`](../game.md)'s storage rule) |
| **a row it cannot trust** | dropped: a golfer or a tier the game does not have, a count that is not a count. A table that does not parse is an empty table. None of these is ever an error on the title |
| **a store that refuses** | private windows, blocked site data, a full quota. The run is still placed for the visit and nothing else changes |

## Why it rolls, and why in the key's box

*Rolling* is what a cabinet's title does, in both of its senses: the screen takes turns between the
key and the table, and the table's rows scroll up through a window in a loop. It is also the answer
to the one constraint the title has. `tests/layout.browser.test.ts` holds that no screen scrolls, at
six viewports down to a 480×320 landscape phone. The title's left column was measured there at
[0072](0072-a-cue-is-baked-and-played.md) with 23 pixels to spare, and on a short screen the key
folds into a single strip. **Laid out under the key, the table put the title 128 pixels past that
display**. The guard found that, not an argument.

So the table is placed absolutely over the key's cell and adds no height of its own. The key decides
how tall the cell is, and the table rolls through whatever that height is: two rows at a time on the
smallest phone, all ten on a tall screen. On a tall screen the cell is given the table's height,
because there it stands beside five tall buttons with room to spare. The two cross-fade every nine
seconds. Under reduced motion they swap without the fade and the rows stand still. With an empty
table nothing rolls, and the title is exactly what it was.

[0153](0153-desktop-is-the-target.md) says the phone is not a reason to make anything smaller. The
desktop's table is the whole table; the phone's rolls it through the space it has.

**The layout guard learned one thing to see this.** It measured every leaf box in a panel, so the
rows clipped out of sight in the rolling window counted as boxes off the screen. It now measures the
part of a box that its clipping ancestors let through. **A control is still measured whole**,
because a button hidden by a clip is a button the player cannot press, which is what that guard is
for. It also seeds a full table of the widest rows before every page it loads, so every title it
measures is a returning player's.

## Why the pilot and not a name

A cabinet asks for three letters. This game has a golfer who flew the run, and the golfer is on the
select screen, so the row says who flew. It asks the player to type nothing, stores nothing that names
them, and the table still tells runs apart. A name entry is a real feature and not this one. It would
also be a second thing `PRIVACY.md` has to describe.

## Why the tier is kept and not scored

The tier changes what the level sends, not what a kill is worth
([0428](0428-the-score-is-kept.md)'s *considered, not done*). The row keeps it so the table can say
it once the title has room for a fifth column. It does not say it yet: four columns fit the phone
cell, and the tier's names are the longest words in the game.

## Irreversible, and what a rollback is

The key ships the moment this merges, and a player's table outlives any later build. **Rolling this
back** means removing the writes and leaving the key alone. A later build that stops writing still
reads a table it can trust, or ignores one it cannot, and `parseScores` is what guarantees that. A
change of shape bumps `SCORES_VERSION`, and an old table then reads as empty rather than as garbage.
Deleting a player's key is never part of a rollback.

## Confirmed, not assumed

`tests/scores.test.ts` holds the roll (ten kept, the lowest pushed off, a miss not kept), the tie
rule, a round trip under the key `PRIVACY.md` names, the defensive read row by row, and a store that
throws on write. `tests/privacy.test.ts` already held that every `itc_*` key in `src/` is in the
policy's table and the reverse, and it now has a key to hold.
`scripts/probes/0429-the-table-is-kept.mjs` breaks the roll and the defensive read.
