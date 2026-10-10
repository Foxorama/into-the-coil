# 0584 — The shields are worn

**Accepted 2026-10-10.** From the play-test of 2026-10-10. Fitted on [0527](0527-the-wheels-turn.md)'s
*Paint & Parts*; sold at [0523](0523-cosmo-opens.md)'s Cosmo's, on [0542](0542-cosmos-counter.md)'s shelves.

## The ask

> *"Shields need to be swappable cosmetics like the other ship items. Need a couple of different cosmetic
> shields to buy."*

## The rule

**A ship's shell is a slot. Every ship opens in its own (0492, 0545); another ship's shell is open on the
dash's rule (0521) — both won in; a shell Cosmo's sells is open on any ship from the moment it is bought.
Cosmo's sells three: the Aurora, the Alien runes and the Disco ball.**

| | |
|---|---|
| **the table** | `src/content/shells.ts`: every shell, its name, where it comes from, its price and its four places' shimmer frames. A ship's row names its own (`shield: SHELLS.storm.shell`), so what a ship opens in is still on its row |
| **the slot** | `shell` on the hangar slice, each ship's own to begin with; `shellOpen` is the wheels' rule (`rimOpen`) over a shell's `from` |
| **the run** | `shelled` lays the fitted shell on the ship's row, on `fitted`'s terms — the frame reads `shield` off the row it is handed, and never learns that shells move. `begin` takes the shell after the tubes |
| **the band** | *Shield*, on *Paint & Parts* under *Parts*, after the flame; each option a picture of the shell as three shields wear it (`bakeShell`) |
| **the plate** | *Paint & Parts* shows one group at a time since this, on [0579](0579-the-loadout-has-tabs.md)'s terms: with the shield, *Parts* was three bands tall, and on a 480x320 its *Back* ran off the screen. 0579 named the shields as what would make this owed. Its sub-tabs are a section band read off its stand (`PARTS_STAND`), and the tabbed CSS is Hangin' Out's, widened to both |
| **the shelf** | *Shields*, before the tubes, so the tubes stay the last shelf and the one the sim reads stays at the end of the aisle |
| **the pad** | the shell round the ship on its pad while it is the one being chosen — its band tried on or last fitted, or a shell in Cosmo's window. Three port pictures, one per shimmer frame, baked off the fit (`blueShell0`…`2`) at one span for every shell (`SHELL_SPAN`), so each stands at its own orbit |
| **kept** | a new field on `itc_hangar` version 1, per ship, refused unless the document's own wins or what it owns open it; `owned` gains the shells |

## The three it sells

Each is drawn in `src/render/bake.ts` in the frame every plate shares (`plateAt`) and fades toward its
ends as the honeycomb does, so four plates still close into one shell.

- **Aurora** — three ribbons of northern lights waving across the strip, banded cyan into lavender into
  mint, rays hanging off the bright one toward the ship. The shimmer frames move the waves.
- **Alien runes** — seven glyphs from a vocabulary of five between two thin rails; a third lit, which the
  shimmer moves.
- **Disco ball** — two rows of mirror tiles, nearly clear, and coloured glints off a few of them that the
  shimmer throws about.

## The screen, considered

[0295](0295-a-ranking-guard-is-a-content-limiter.md): what else shares the space. A shell stands round the
player's ship, where every hostile bullet the player is dodging arrives, so:

- **nothing is solid** (0379): every mark is a stroke or a fill at an eighth or less, and a bullet crossing a
  plate is seen through it;
- **no meaning ink is a band.** The aurora and the runes are in the player's own cyan and lavender and the
  pickup's mint — no red (the enemy), no orange (the fire), no acid or violet (the serpent's shots). The
  disco ball's gold is a fleck a pixel or two across, as light off glass is, never a ring that could read as
  the bonus.

Owed: a play of each against the place whose shots are nearest its colours — the aurora's mint on the
Saurian Belt, the runes against the frost ship's cyan.

## Prices

Set here, on the shop's own scale and [0585](0585-the-prices-rise.md)'s rise: the runes 600, the aurora
750, the disco ball 900, before the rise — above a flame and a tube, below the spinners. A shield is worn
round the whole ship; a dangle only on the dash. These are a first answer and the player's to move.

## Rollback

`shell` and the shells in `owned` are new fields on `itc_hangar` version 1. Reverting leaves them unread;
every ship wears its own shell again, and shells bought are kept, unread, until it returns.

## What guards it

`tests/shells.test.ts`: the ask, the slot's rule, the run wearing the shell fitted, the save refusing what
its own list did not win or buy, every shell drawn at every place. Probes in
`scripts/probes/0584-the-shields-are-worn.mjs`.
