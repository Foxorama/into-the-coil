# 0548 — The hangar holds still

**Accepted 2026-10-06.** A play of the hangar's three tabs after
[0540](0540-the-hangar-is-the-port.md)–[0542](0542-cosmos-counter.md) merged.

## The ask

> *"the different tabs are all different size backgrounds and different zoom levels and navigating from
> Cosmo's back to Hangin' out is really awkward with the gamepad, have to do it in a super specific way.
> and we have a preview option in Cosmo's - but no way to change the pilot to preview on a different ship
> so you have to go back a menu"*

## What was measured first

Off `scripts/shot-menus.mjs` at 1280x720: the plate's top stood at 44, 62 and 100 pixels on the three
tabs, because it was centred on its own height and each tab's bands are another height. The cameras
were three (0540's 1.5 on the pad, 2.3 on the pad, 0542's 1.4 between the stall and the pad).

A pad stubbed on the built page, walked from Cosmo's: up from the first band landed on the tab standing
nearest above it — *Paint & Parts* from Hangin' Out's pilots — not on the one open; and pressing a tab
opened it with the cursor on its first band, so crossing two tabs was up, along, press, up again.
LB and RB have stepped the tabs since [0458](0458-the-title-is-rows.md), and nothing on the screen said so.

## The rule

| | |
|---|---|
| **the plate** | the panel's height on every tab, the strip at its head and Back at its foot (`src/app/chrome.ts`). It was its content's height, centred |
| **the camera** | one, `PORT_CAMERA` in `src/state/screens.ts`, which each tab's row names. A tab that wants another writes its own — [0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md): the row still says what its camera is |
| **the stall** | drawn on every tab. 0542 kept it to Cosmo's because the hangar's camera cut it in half; the camera is Cosmo's now, and 0542 offered this as a veto |
| **the strip, on a pad** | a tab opened from the strip keeps the cursor on the strip, on the tab now open; the cursor entering a strip by any way stands on the open tab; LB and RB are drawn at the strip's two ends while the device in hand is a pad — on Settings' strip too, which steps the same way |
| **the pilots on Cosmo's** | the pilot band, first on the plate under Cosmo, with the line card *Paint & Parts* has. One setting on three bands, as 0527 put it on two |

## What it costs

**Paint & Parts loses its close-up.** At 2.3 the wheels, the nose art and the flame were large on the
pad; at 1.4 the ship is about three fifths that size. The ask was one zoom, and the zoom that holds the
stall and the ship at every size is Cosmo's. `rig/looks.html` still shows the looks close. If the close-up
is missed on play, the answer is a tab whose camera is its own, which 0548 leaves room for.

**On a phone Cosmo is a face and one line.** The pilots under him put Buy and Back four pixels under a
667x375's fold on CI's wider letters. His name goes there — his stall is beside the plate — and his line
is cut short where it must be; the shelf's own line still says what the balance is short by. Reproduced
locally with every letter spaced 0.05em wider, which gave CI's exact numbers before the fix.

**Cosmo's opens on the pilots**, not the aisle: the walk starts at the first band, as the other two tabs'
does.

## What guards it

`tests/still.browser.test.ts`: the plate's box and the strip's top within a pixel on every tab, at a
desktop and a phone; a pad walking from Cosmo's to Hangin' Out, the ring on the open tab, LB and RB drawn;
a pilot chosen on Cosmo's and found on the hangar. `tests/stand.test.ts`: the ship on its pad and Cosmo's
stall in the stand's part of the screen on every tab at the six sizes. Probes in
`scripts/probes/0548-the-hangar-holds-still.mjs`; 0542's stall probe is turned round, since its guard now
says the opposite.

## Owed

- A play on the branch preview, with a pad.
- The Paint & Parts close-up, for a veto.
