# 0528 — The noses are painted

**Accepted 2026-10-05.** Item 8 of [`the-hangar-planned`](../../reports/the-hangar-planned-2026-10-05.md).
On [0527](0527-the-wheels-turn.md)'s *Paint & Parts* tab; the unlock is the one answered while the plan was
made — a win opens *"ship + parts + its gun"*.

## The ask

> *"Hood / nose art"*, planned as *"each ship authors its own: the Firebird's phoenix and its
> alternatives, a nose art for the fighter, a crest on the estate's bonnet and the saucer's dome."*

## The rule

**Every ship authors three looks of its own and wears one of them: the one it always wore, and the other
two once it has been won in. No ship wears another's.**

| ship | its own | and, with its win |
|---|---|---|
| the fighter, on its nose | the violet chevron (0461) | a shark mouth — a white jaw, its throat dark, two white eyes; a racing stripe, one white stripe tapering to the tip |
| the saucer, in its dome | clear glass (0461) | its pilot under the glass, green with two dark eyes; a gold visor, the dome mirrored |
| the Firebird, on its flank | the gold phoenix (0468) | hot-rod flames, three gold licks running back from the front fender with a paler tongue; a rally stripe, one broad gold band nose to tail |
| the estate, on its burl | bare, as it left the showroom | a family crest on the front door, a gilt shield on a cyan field; flower power, two white daisies on the back panel |

| | |
|---|---|
| **the looks** | `src/content/art.ts`: each with its name, its line, and the one ship it is drawn for. Each ship's row lists its three, its own first |
| **the slot** | `art` on the hangar slice, each ship on its first; `artOpen` refuses another ship's look and a ship's others before its win |
| **the band** | *Art*, on *Paint & Parts* under the wheels: three places, because every ship has three and none the same. The chrome names them for whichever ship is on the stand — a new verb, `setLabels`, beside `setOpen` |
| **the drawing** | each ship's own painter draws its own look where its own art always was: the fighter's nose (`jazzFighter`), the saucer's dome, the Firebird's door, the estate's panels |
| **the fit** | the look joins 0527's `Fit`, so the re-bake, the card, the readout's icon and the intro all carry it; the shell hands the chrome the fit it means rather than the chrome reading it off the row |
| **kept** | a new field on `itc_hangar` version 1, per ship, refused unless it is that ship's and open to it |

## Why it is built the way it is

**Three places on a band, not twelve.** Every look is one ship's, so a band of all twelve would show nine
shut on every ship. The band holds the positions and the shell names them; the chrome gained the one verb
that does it.

**Bold, because the ship is forty-seven pixels across.** The fighter's nose is 0.14 of its hull's radius
either side of the spine near the tip and 0106's floor is 0.142, so a nose is one or two shapes. Two thin
racing stripes could not be drawn there and became one; the shark's throat, in the void's ink so close to
the tip, read as a hole and is the hull's own deep shade.

**Held where every body is held.** `tests/accents.test.ts` bakes each sprite as it comes, which is each
ship's own look, so the eight others would have been held by nothing. Its new case draws every look under
`withFit` and asks what every body is asked — every solid mark on the hull and over the floor — and on its
first run it found the shark's throat.

**A bug the first build had.** The card's pictures were kept per gun and rim, so a look chosen redrew
nothing; they are kept per fit, and the browser guard compares the card's picture before and after.

## Rollback

`art` is a new field on `itc_hangar` version 1. Reverting leaves it unread and every ship wears its own.

## What guards it

`tests/art.test.ts`: every ship's three, its own first and each look one ship's; the rule open and shut;
no ship in another's; the band three places named per ship; the look in the fit; the key, old and new.
`tests/art.browser.test.ts`: the band named for the Firebird and then the fighter, the flames fitted, kept,
and drawn on the card, and the fighter's others shut before its win. `tests/accents.test.ts`'s `0528` case.
Probes in `scripts/probes/0528-the-noses-are-painted.mjs`.

## Owed

- A play, and the eye on each look at the shipped camera on every place's colours — the shark's eyes sit
  close to the canopy, and the flames share the Firebird's gold with its beltline.
