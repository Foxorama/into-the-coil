# 0517 — No quarters given

**Accepted 2026-10-05.** Asked for: *"a new toggle setting on the main title screen. Default is No
quarters given, other option is Freeplay. Freeplay works exactly like the game works now. No quarters
given removes the continue button from the continue screen; it changes into a game over screen that
gives the score summary and stats about that run and has a 'Main Menu' button."* And, while it was being
built: *"the setting needs to be remembered locally as well — if a player chooses freeplay, it's always
freeplay"* until their site data is cleared.

## The rule

**A run is one credit unless the player chose Freeplay.** The title carries a continues chip, *No
quarters given* until it is pressed. A run that runs out on no quarters ends on the **game-over screen**
(`ended`): its account and *Main Menu*, no continue, no countdown. On Freeplay it ends on the run-over
screen and its *Continue*, exactly as [0068](0068-a-run-over-is-a-continue.md) built it.

| | |
|---|---|
| **the table** | `src/content/credits.ts`: `none` (the default) and `free`, each row saying whether a run that ran out `continues` |
| **where it is chosen** | the title, as a chip beside *Fly* and *Settings* — see below |
| **where it is decided** | `src/state/root.ts`'s agreement, which reads the **run**'s credits: `begin` copies the band onto the run as it copies the tier ([0047](0047-difficulty-is-a-tier-and-the-easy-one-is-the-content.md)), so the settings slice still takes part in no agreement, and a chip pressed between runs cannot reach a run already flying |
| **kept** | in `itc_settings` beside the other kept settings ([0510](0510-the-settings-are-kept.md)), as a new field on version 1: a document from before it reads as no quarters, on 0512's per-field terms |
| **the game-over screen** | heading *Game over*; one action, *Main Menu*, to the title; no timeout and no Back, on `victory`'s terms; `inRun: true`, so the place's music goes on under the account as it does under the run-over screen |
| **its account** | the level reached, each cleared level's rank, kills, the share shot down, hits taken, points, bonuses, the final score and where it landed on the table. The run is put on the table as the screen arrives — there is no offer to wait for |

## Why a screen of its own

`gameOver` with its button hidden would be a row whose actions change with a setting, and the label is
the promise ([0068](0068-a-run-over-is-a-continue.md)): *Continue* on a screen that cannot continue is
the screen lying about what its button does. A second row says what it is, and the agreement picks one.

## Why a chip and not a band

A third band was built first. On a 1280x720 laptop it put *Fly* fifteen pixels under the fold, and on a
phone the title's grid gives every band but the pilots' the one cell the tier stands in, so it would have
drawn over the tier. `tests/layout.browser.test.ts` caught both. Three ways out went to the player —
compact chip, full band with the pilot card cut down, or a band on Settings — and the chip was chosen.

So `ScreenChoice.faces` gains `'chip'`: one button among the actions, showing the option that is on,
whose press steps it round, with its hint as the tooltip. The chrome reads that fact about the row,
never the setting's name. It is **drawn left of Fly and walked after it**: the cursor still opens on
*Fly*, and a push down from the tier still lands on *Fly*, which with the chip on the right it did not
(the landing is the button nearest across, and that became *Settings*).

## What the tally keeps now

`LevelTally` keeps the kills, bodies sent and hits each rank was read from, because the game-over screen
adds them over the run and a letter cannot be added. The level the run died on was never cleared, so it
has no tally; its numbers are the frame's and are added in. Not saved anywhere, so not a schema change.

## What it changes about the default game, said plainly

`src/state/slices/run.ts` and [`docs/game.md`](../game.md) both record that nothing grants a life
([0082](0082-a-pickup-is-rare-and-says-what-it-is.md)), and that *what makes it survivable today is
0068's free continue*. On the default, that continue is gone: a run is the tier's lives and nothing
else. That is the ask, and it is the first time the question 0082 left open is asked by play rather than
by a comment. **Owed: a play** of the default on each tier, to say whether one credit reaches the later
places often enough.

## What guards it

- `tests/credits.test.ts`: a run on no quarters ends on the game over and nothing on it continues; a run
  on Freeplay is offered the continue; a run keeps the credits it began on when the chip moves; Freeplay
  is kept and a document from before it reads as no quarters; the account adds every cleared level and
  the one being flown. Probed in `scripts/probes/0517-no-quarters-given.mjs`.
- `tests/credits.browser.test.ts`: the default ends a real run on the shown game-over screen with its
  account, on the table, and *Main Menu* goes to the title; a Freeplay chosen survives a reload.
- `tests/menu.browser.test.ts`: the pad reaches the chip left of *Fly*, A steps it and leaves the ring on
  it. `tests/layout.browser.test.ts` measures the title with the chip and the game over at its longest.
- The run-over browser tests choose Freeplay first, since the screen they are about is Freeplay's now.

## Rollback

**Irreversible surface: the save schema** — a `credits` field in `itc_settings`. Reverting the code
leaves the field in players' storage, unread and harmless: `settingsFrom` reads named fields only.
Re-landing later reads it again as it was left.
