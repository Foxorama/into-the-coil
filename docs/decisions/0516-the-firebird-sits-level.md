# 0516 — The Firebird sits level

**Accepted 2026-10-05.** A look at the Firebird's side view, which [0441](0441-a-pilot-flies-their-own-ship.md)
made and [0468](0468-the-firebird-is-black-and-gold.md) took back to the black and gold Trans Am.

## The ask

> *"the rear end of the firebird is a little low, it should be based on the trans-am and it doesn't currently fit
> that profile at the rear of the car"*

## The rule

**The Firebird's rear is the Trans Am's: a tall, square tail panel, a deck level with the beltline, and a ducktail
lip kicked up off the deck's end.** Before this, the back glass ran down past the beltline to a deck that sat
lower than the hood, with a wing on a post above it. That is a fastback's tail with a race wing on it. The Trans
Am's quarter panels and deck lid stay high and flat all the way to the tail, and its spoiler is a lip that is
part of the deck.

What moved, all in `firebirdOutline` and `drawFirebird` in `src/render/bake.ts`:

- **The outline**: the tail panel now rises from the bumper to the beltline, then a ducktail lip, then a level
  deck to the foot of the back glass. The back glass is shorter and steeper.
- **The spoiler**: 0461's wing on a post is gone and the lip replaces it. 0463's gold edge stays, now on the lip.
- **The beltline pinstripe**: runs level to the tail. It used to dip with the deck.
- **The tail lamp**: same size, moved up to the top of the tail panel under the deck, where the Trans Am's wraps
  the corner. Lower down it would be a lamp in the bumper.
- **The roof sheen**: starts at the new foot of the back glass.

### Played again, the same day

> *"It's better but the front is a little high and the back is a little flat - it needs a bit of a curve"*
>
> *"can we give it the golden spikes for the wheels as well?, it's also 2door"*

The reference was a photo of a 1976 Trans Am Limited Edition, front three-quarter view.

- **The back curves**: the back glass rolls into the deck over five points instead of meeting it at one angle.
  The deck rises toward the lip, and the beltline pinstripe kicks up a little over the rear wheel.
- **The front is lower**: the hood falls from the scoop to a rounded nose about a unit and a half lower than
  it was. The headlamp and the nose's pinstripe moved down with it.
- **Snowflake wheels**: each dish is a dark recess with one gold ten-spike star over it (`snowflake`, beside
  `steelStar`). It is one polygon a wheel for the same reason the launcher's star is: a single spoke at this
  size would be under 0106's floor.
- **Two doors**: there was a body-coloured pillar in the middle of the side glass, and it read as a front
  door and a back door. Now there is a small quarter window under the sail, then the B-pillar carrying the
  player's cyan, then one long door window, then the A-pillar down to the cowl. A faint shut line runs down
  from the B-pillar to the rocker.

The bird, the launcher and the turrets are unchanged. So are the muzzle,
the tubes, the nozzle and the cockpit on the ship's row, because none of them sit on the rear deck. The pipe is
still low on the tail.

## Consider the screen

The silhouette is a little bigger at the back and a little smaller at the nose, and nothing else changes. The ship's box, its radius and every
mount are as they were. The lip stays inside the bitmap's reach, which `tests/accents.test.ts` holds.

## Guards

None added. `tests/accents.test.ts` already holds the paint to the hull, to the bitmap and to the 2.5 px floor
from [0106](0106-a-mark-thinner-than-a-pixel-is-not-drawn.md), and caught two things on the way. The tail lamp,
when it was narrowed, went under the floor. The lip's shading, at 1.6 units tall, did too, so it now reaches
down onto the tail panel. On the second pass, the stroke-containment check caught three pinstripes: the nose's,
the B-pillar's cyan and the lip's. A stripe is about 1.9 px wide at the shipped camera, so it needs about
0.7 units of clearance from the edge. Each one was pulled in. `tests/mounts.test.ts` still holds the launcher and turrets to the drawing.

## Seen to fail

[0005](0005-a-guard-must-be-seen-to-fail.md). This adds no guard, so it owes no probe.

## Owed

- **A look in play**: does the car read as the Trans Am from behind now, and is the lip enough spoiler?

## Rollback

⚠️ **None owed** — [0001](0001-revertability-not-risk-rating.md). Art only; nothing persisted.
