# 0430 — The readout counts ships and shields

**Accepted 2026-10-01.** Three pictures that told the player the right number in the wrong
vocabulary. It amends [0050](0050-the-ship-is-one-hit-and-the-shield-is-what-stands-in-front-of-it.md)'s
shell — rings orbiting the hull, turning with the camera — and retires the plus that
[0082](0082-a-pickup-is-rare-and-says-what-it-is.md) left behind as the lives icon. It is the first
item of [the screens review](../../reports/the-screens-reviewed-2026-10-01.md), which queues the rest.

## The ask

> *"in particular the top left row of 'life' should be the ship with an x and the number of lives,
> the shields should look like shields - the shields around the ship also need to be upgraded to be
> ship thematic appropriate shields that look like shields a starfighter spaceship would have"*

## The rule

**A life is counted in ships, a shield is drawn as a shield, and the shell round the ship is a
deflector.**

| | was | is |
|---|---|---|
| **lives** | a green plus, then `×N` | the ship being flown, then `×N` — `chrome.setShip(shipRow.sprite)` in `src/app/mount.ts` |
| **shields in the readout** | a filled disc against a hollow one | a filled shield against a hollow one: rim always in the ink, core filled only while held |
| **the shell on the ship** | a ring per shield, orbiting at 5.6, turning with the camera | a plate per shield: a curved strip of energy honeycomb at 5.6 with a bright outer rim, standing still, with a light running through its cells as the camera travels |

## Why each one

**The plus said *health*.** It was the extra-life pickup's glyph until 0082 took that pickup off the
field, and it stayed as the counter's icon because nothing replaced it. A plus is the genre's word for
healing — the one thing this counter is not — and the ship in reserve is the arcade's own picture of
a life. The counter shows the ROW's sprite, not a constant in the chrome
([0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md)): a second ship brings its own
face with it.

**The disc was the bullet.** The rings' own note refused a small disc on the field because a disc is
the bullet's shape; the readout had been drawing exactly that. The pip keeps
[0024](0024-the-accessibility-floor-is-settings.md)'s *differ by fill, not by colour*: both states
share the outline, and only a held shield is filled. A border cannot follow a shield's outline, so the
outline is a masked pseudo-element and `tests/hud.browser.test.ts` reads its colour where it read the
border's.

**Rings read as beads.** Three small hoops circling a fighter are a formation of three things, not a
shield. What a starfighter's shield looks like on screen is an energy barrier round the hull, and the
honeycomb is the shorthand every player already owns for one. It is drawn as plates rather than one
bubble for the reason the rings were three: **the shell is a picture of a number**, and the player has
to be able to count it without looking away from the lane.

## What it costs and what it chose

**The shell stopped turning, and that is a bitmap's limit rather than a taste.** A plate is baked
curving round the ship from one place; a turning plate would need a picture per angle it passed
through, and a tick between them would jitter a thing the player watches every second. So there are
four places (`SHIELD_PLACES` in `src/content/ships.ts`) and a layout per count (`SHIELD_LAYOUT`):
one plate on the nose; fore and aft; and three with the gaps at the quarters and straight behind,
where the exhaust burns through. **The nose is always covered**, because that is where the fire comes
from, and the plate a hit releases is the one furthest back. What moves instead is a shimmer — three
frames a place, twelve sprites — stepped by the distance the camera travels, on the rings' own
argument that a shape in the world beats a wobble in time.

**Evenly round the ship still holds** — the rings' reason, that a lone mark at an odd angle reads as a
piece fallen off, is kept. When a hit takes a shell of three to two, the survivor moves from a back
quarter to straight aft in one step; that is the shell re-forming, beside the burst where the lost
plate was.

**It is not a bubble, and 0379 is why.** *"The ship aura is a basic circle now as well, it looks
terrible"*, and *"nothing round the ship, so nothing hides a bullet beside it."* The middle is open,
the cells are nearly clear, and the only solid mark is a hairline rim — a bullet crossing the strip is
seen through it. The strip is 1.3 units thick at the radius the rings orbited, so it takes no room the
rings did not.

**The shell's pool keeps its name.** `shieldOrbs` names slots, not a picture, and renaming it would
move anchors in three probe files and six test files for a word.

## Held by

`tests/shields.test.ts`: each plate wears the picture baked for the angle it actually stands at; the
nose is covered at every count; the plates hold still while the world moves and shimmer only while the
camera does. The two new properties have probes in `scripts/probes/0050-shields.mjs`, and 0050's
spacing and clock probes are re-anchored onto the layout and the shimmer.

## Rollback

Nothing irreversible: no storage key, no save field, no cache prefix. Reverting the PR restores the
rings and the plus.
