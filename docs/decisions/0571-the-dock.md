# 0571 — The dock

**Accepted 2026-10-07.** A play of [0568](0568-the-hangar-opens-out.md) and 0569. Replaces the room
the hangar's tabs stood in. That was the intro's hangar, [0540](0540-the-hangar-is-the-port.md); the
intro keeps it.

## The ask

> *"it still looks pretty bad overall … let's just redesign the whole background and make the menu and
> buttons fit into it. the menu buttons also look pretty terrible with the preview, especially when
> they're highlighted. the spaceship hangar itself just looks bad, the ship and tradie stalls don't fit
> it at all … The cockpit dash is still just ... 'there' and doesn't have it's own proper space that
> makes sense.*
>
> *what I'm after - ignoring everything that exists currently - is a good menu system that works and
> looks good, a fun spaceship hangar set against a space backdrop, space for the tradie/merchant stalls
> to show, the spaceship to show the changes. the focus selector also disappears when you move focus
> over the 'selected item'."*

A concept was drawn and answered before any of it was built. The direction was yes, *"definitely closer
to what I'm picturing"*. All three shops show, and the open tab's lights up. The dash goes on a cockpit
monitor. The cursor is corner brackets. And on the menu on the left: *"we can keep it, but if we're
doing it because I said it and not because it's good UX then we shouldn't do that."*

## The menu stays on the left, and why

It is kept on its merits, not because it was asked for. A garage menu is read top to bottom: the
pilot, then each slot in turn. A column holds that order at a size of its own, and it leaves the rest
of a wide screen to the picture. A strip along the bottom would show more options side by side, but
each band would be a horizontal scroll inside a horizontal strip. It would also put the menu between
the ship and the deck it stands on, and stack worse on a phone. On a phone held upright the column
becomes the bottom half of the screen (0566). That is the same order, read the same way.

## The rule

| | |
|---|---|
| **the dock** | `paintStand` draws a room of its own (`DOCK` in `src/content/port.ts`): space with a planet in the open bay; a back wall ending at the bay under a truss that reaches out over it; lamps; the deck. The intro's bar, door and pads are not in it |
| **the shops** | a mezzanine along the back wall carries every keeper's shopfront, in the tabs' order: Unity, MMXXVI, Cosmo. Each counter stands in a lit alcove. The open tab's shop is lit, and the others have the night drawn over them at half. Every keeper is in their own place this visit (0569): at the counter, at the ship, or out |
| **the ship** | on a cradle on the deck under the shops, with clamps and a field glowing up into it, half again its intro size and baked as much sharper. It is the picture of every change |
| **the cockpit** | the dash has a place of its own: a framed screen titled *Cockpit* on the deck in the stand's near corner, with the dash plate on it and whatever hangs swinging below. On a phone held sideways it is a strip on the deck under the ship, set by the screen's width. **That is under 0566's floor**: about 9 px at 667×375, where 0566 set 14. At twelve the strip was wider than the stand, and in two rows it stood over the ship. Owed the player's word |
| **the cursor** | four white corner brackets round the option the cursor is on: the one tried on, or the fitted one when nothing is. They breathe unless motion is reduced. The fill says what is fitted and the brackets say where the player is, so the cursor no longer vanishes on the fitted option |

## What it cost, and the guards it moved

- `tests/stand.test.ts`. The ship's pad is a cradle. 0550's keeper test is now *lights each tab's own
  keeper's shop and dims the others*: every keeper is drawn once, with a shutter over every shop but
  the tab's. The open bay's reach on a 4:3 is two units, where 0568's was ten. The three shops are kept
  whole on the left and the room fills the column's height, so a 1024×768 shows the bay's edge and a
  strip of stars, not an open view. **Owed a look.**
- Probes of 0542, 0550, 0554, 0567, 0568 and 0569 were moved to the dock's lines and each decision
  proved again. 0550's probe now dims the open tab's shop with the rest.
- The browser suites were run in Verdana, which is harsher than CI's font. Four timed out while another
  session ran its browser tests on this machine, and all four passed alone.

## What CI found, and was fixed

- **A click landed on the wrong chip.** The chip rows scrolled smoothly, so a chip being scrolled into
  view slid under a pointer that had already aimed. On CI's load a press on the estate's dash tried on
  the Firebird's beside it. A player would have met this too. The rows now jump. **That found the cause
  underneath it:** a mouse over a chip tries it on, and a try scrolled its chip into view, so the row moved
  under the pointer. The pointer was then over another chip, which was tried on and scrolled to in turn,
  and the row never stood still for the click. Only a step of the cursor scrolls a row now. A hover never
  does, and the fitted chip is scrolled to only when it changes.
- **Two rules that never held, found by the proof (0019).** 0563's cap on the ship's share of its column
  never decided the zoom once the dock held the camera to the room's height, so it went. 0563's probe now
  draws the ship small on its cradle, which its guard sees. 0539's guard asked only that the readout stay
  in the stand, so the monitor's wrap could break and nothing failed. It now asks that the readout stay
  inside its cockpit monitor's frame, which is what the player sees.

## What is owed

A look at 1920×1080, 1280×720 and a 4:3. Whether the planet, the shopfronts' shutters and the monitor's
corner read as the place asked for. The cradle's clamps against each ship's shape, the saucer especially.
