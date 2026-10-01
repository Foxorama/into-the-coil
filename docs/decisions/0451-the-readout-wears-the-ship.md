# 0451 — The readout wears the ship

**Accepted 2026-10-02.** Amends [0439](0439-the-top-is-one-strip.md)'s readout plate and
[0430](0430-the-readout-counts-ships-and-shields.md)'s `setShip`.

## The ask

> *"we also need to do the hud theme on the top left row of icons in game. Golf-Stars has hud theming
> for all the spaceships already so we can use that as inspiration."*

## The rule

Each ship row carries `hud`: an ink, a trim and a motif. The readout in the top left takes the ink
for its counts, its shield pips and its glow. Its rim runs from the trim into the ink. Its plate wears
the motif as a class (`src/app/chrome.ts`). The boss bar and the score keep the studio's rim.

| ship | ink | trim | motif, from the predecessor's bridge |
|---|---|---|---|
| fighter | `player` | `ally` | **bracket**: lit gunsight corners just outside the rim. The studio's own readout |
| caddie | `player` toward `acid`, lifted | `ally` | **orbit**: a rounder plate, a dashed orbit about it, and a bloom that breathes (*the probe deck*) |
| Firebird | `hazard` | `bullet` | **checker**: a sharper plate on dark glass, a chequered flag fading off its leading end, a carbon weave (*the racer's dash*) |
| estate | `hazard`, lifted | `hazard`, shaded | **walnut**: walnut grain, a chrome lip, and fuzzy dice hanging under the end (*the woody dash*) |

## Why it is built the way it is

**Every colour is a role moved.** Golf-Stars set hex colours per ship. A hex here is a colour the
high-contrast palette cannot answer, which is 0441's reason the hulls are drawn in roles. So the
readout's inks are `HudInk` recipes over the palette, resolved by the chrome with the bake's own `mix`
and `shade`. The flag's light squares are `impact` and its dark ones the void.

**It reaches the readout only.** The ask is the top-left row. The bar is the enemy's and the score is
the credit's, and the strip's one-height rule ([0439](0439-the-top-is-one-strip.md)) is untouched.

**The dressing is painted under the counts.** Every motif is a pseudo-element behind the plate's
contents, so it can never cover a number. Its motion stops when the system asks for less motion.

## Guards

**None, and that is the rule's answer.** [0192](0192-a-guard-holds-an-invariant.md): a different
ink or motif for a ship would be correct, so this is a taste. The types hold that every ink is a
palette role and every motif is one of four.

## Seen

Photographed on the bench for all four ships, before and after one correction. The Firebird's plate
first read olive, not gold on black, so its glass was darkened and its weave thinned.

## Rollback

⚠️ **None owed** — [0001](0001-revertability-not-risk-rating.md).

## Owed

- **A look at all four plates in play**, the dice above all, and whether the gold readout beside the
  gold score reads as two things.
