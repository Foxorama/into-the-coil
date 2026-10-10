# 0589 — More looks

**Accepted 2026-10-10.** From the play-test of 2026-10-10. Every table it adds to is
[0542](0542-cosmos-counter.md)'s *built to grow*: a row each, and the shop, the hangar and the save follow.

## The ask

> *"And overall we need more cosmetics of every shape and style."*

## The rule

**Every kind of look has more of itself.** Fourteen new things across five tables, each its own picture:

| table | new | where it comes from | price, asked → charged ([0585](0585-the-prices-rise.md)) |
|---|---|---|---|
| **dangles** | rubber duck, lucky horseshoe, mini mirror ball, alien bobblehead | Cosmo's | 250 → 288, 250 → 288, 300 → 345, 300 → 345 |
| **flames** | Nebula Burn, Plasma Drive, Afterburner | Cosmo's | 450 → 518, 450 → 518, 550 → 633 |
| **rims** | neon rings, chrome wires — baked still into the hull, as the snowflakes are | Cosmo's | 600 → 690, 500 → 575 |
| **shells** | Aurora, Alien runes, Disco ball — [0584](0584-the-shields-are-worn.md) | Cosmo's | 750, 600, 900 |
| **arts** | a fourth for every ship: the fighter's gold bolt, the caddie's rainbow dome, the Firebird's tiger stripes, the estate's surfboard, the Thunderbolt's gold stars | the ship's own win, as its second and third ([0528](0528-the-noses-are-painted.md)) | — |

Every price is a first answer and the player's to move.

## How each is drawn

- **Dangles** are the readout's CSS, hung on the one swing (0523). Which drawing each hangs as is now a
  `Record` over the dangle kinds (`DANGLE_PARTS` in `src/app/chrome.ts`), so a dangle added without a drawing
  fails to compile — it was a list, which would have hung nothing.
- **Flames** are two inks each, burned by the exhaust's own painter (0530).
- **Rims** are `paintRim` cases. A rim baked still had no picture of its own on Cosmo's shelf — every rim sold
  until now turned, and the shelf showed the spinner for any other — so `bakeRim` draws one in its tyre.
- **Arts** are a case in each ship's painter, and the side-on saucer on the pad (`paintSaucer`) draws the
  rainbow dome as four upright bands.

## The plate, on a phone

Seven dangles on one shelf ran three rows deep in rows of three on a 667x375, past its foot, and five aisle
tabs wrapped to a second row. On a landscape phone the shelf is now one row of three with the rest a scroll
away, as a taller screen's already was, and the aisle one row of tabs cut short. Measured with
`tests/layout.browser.test.ts`'s six sizes.

## The screen, considered

[0295](0295-a-ranking-guard-is-a-content-limiter.md), per thing:

- **The flames trail the ship, where nothing hostile is ahead of it but everything it is dodging passes.**
  The nebula is a deep violet below the serpent's void on lightness and bluer than it. The plasma is a green in
  the one window between the acid's lime and the frost's aquamarine, more than 25° from each; **its first ink
  was a jade five degrees off the frost**, and the guard written for it refused it. The afterburner is white-hot,
  the one ink no hostile shot is.
- **Every mark of every look and rim is on its hull and over 0106's floor** — `tests/accents.test.ts`
  measured them, and the surfboard's stripe was made deeper for it.
- **The dangles are on the dash**, under the readout, nowhere near the lane.

## What guards it

`tests/more-looks.test.ts`: a fourth look on every ship and no two of a ship's looks one picture, colours and
all; no two rims one picture; every new ware sold on its own table's shelf. `tests/flames.test.ts`: each new
flame held off the shot it was weighed against. `tests/accents.test.ts` holds every new mark to its hull and
the floor, unchanged. Probes in `scripts/probes/0589-more-looks.mjs`.

## Rollback

The new kinds are new keys in `itc_hangar` version 1's `owned`, `hung`, `rim`, `flame` and `art`. Reverting
leaves them unread: a ship fitted with one goes back to what that field reads as by default, and what was bought
is kept, unread, until it returns.
