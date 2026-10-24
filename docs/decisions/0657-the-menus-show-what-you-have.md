# 0657 — The menus show what you have

**Accepted 2026-10-24.** From [`the-notebook-pages`](../../reports/the-notebook-pages-2026-10-24.md), items 14, 15, 18
and 19, and the player's answers. Amends [0561](0561-the-cursor-tries-on.md) (a shut option the cursor stands on),
[0458](0458-the-title-is-rows.md) and [0607](0607-the-menus-come-round.md) (an arrow drawn dim at an end),
[0513](0513-the-pilot-flies.md)'s presses, and [0542](0542-cosmos-counter.md)'s shelves.

## The asks

> *"Side arrows show on menus even when nothing to nav to."*
>
> *"A button on game console goes to next item in stores, it should confirm just like it does on main menu."*
>
> *"'Owned' menus should only show unlocked items & not everything with a lock."* Answered: *"Locked items should be
> hidden on every equippable screen, they should be visible in cosmos and in cosmos owned items should be hidden
> unless you tick to show them."*
>
> *"Bubble jets has wrong icon + kept disappearing from menu."* Answered: *"The bubble jet missing was unity shop."*
>
> *"Changes apply to everywhere. The menus suck pretty hard on desktop as well as mobile."*

## The rules

- **A band may hide options** — `setHidden` in `src/app/chrome.ts`, by position: a hidden option is not drawn, a key,
  a pad or an arrow never steps onto it, and an arrow does not count it. Nothing moves index: every button stays, so
  every position the shell reads (`slotAction`, `setChoice`, the thumbs) is the one it was.
- **On every band that fits, what is shut is hidden** — `fitSlot` in `src/app/mount.ts`, for all eleven slots on
  Hangin' Out and Paint & Parts. The band's `why` still says there is more and where, with nothing tried on. A band
  with nothing it may wear — the wheels of a ship with none — goes altogether. The pilots are not equipment and keep
  0546's locked cards, which are how a secret pilot is found.
- **On Cosmo's, everything for sale is shown, and what is owned is not until *Show owned* is ticked** — a third
  action, a box the shell writes (☐/☑), for the session; nothing is stored. The ware just bought or fitted stays in
  the window while Cosmo says so. A shelf of nothing but owned wares says *"Everything here is yours — tick Show owned
  to see it"*, and Buy is off the screen while the window is empty.
- **An arrow is there only when it goes somewhere** — `disabled` exactly where it was, and a disabled arrow is now
  `visibility: hidden`, keeping its room so the options do not move. Somewhere is an option a step may land on:
  shown, and, on a band that does not fit, open. A ladder at its end (the tier) loses that arrow; a band of one loses
  both.
- **A press on a Cosmo's shelf presses Buy** — a fourth `press`, `acts`, on the shelf rows in
  `src/state/screens.ts`: the screen's first action, clicked, so Buy's own sheet asks (0564) and *Fit it now* fits.
  A on a pilot flies them on the title; A on a shelf now buys, where it stepped to the next ware.
- **Bubble Jets is pictured as bubbles** — `wareArt` reads the flame's `look` (0595) and draws three hollow rings,
  where every flame's tile was a tongue of fire.

## Bubble Jets and Unity

Bubble Jets is the Aqua Duck's own flame (`from: 'duck'`). On another ship it opens on the dash's rule
(`plateOpen`): once both that ship and the Duck have beaten the jellyfish. On Unity's Hamster Ball before then it is
shut, and since this decision a shut flame is hidden: it appears on Unity's flame band once both are won. Cosmo's
never shelved it, because it has no price. Whether the play that reported it had both won is not known; the rule it
ran is the one above, and nothing in the code distinguished the ball.

## What guards it

- `tests/tries.browser.test.ts`: a shut gun is not drawn, and a lap of the band lands only on drawn guns.
- `tests/menus-round.browser.test.ts`: a lap of the gun band (every ship won) comes round the drawn guns; an arrow on
  a band of one and at the tier's end is `visibility: hidden`; Bubble Jets' tile is bubbles and a jet flame's is not;
  a thumb's tap test ignores an arrow that is not drawn.
- `tests/cosmo.browser.test.ts`: an owned ware is off the shelf until ticked, back when ticked, off again when not; a
  press on the shelf, reached with the keys, opens Buy's sheet and buys nothing by itself.
- `tests/hangar.browser.test.ts`, `tests/swatches.browser.test.ts`, `tests/dressed.browser.test.ts` and
  `tests/foot.browser.test.ts` now read the options a band draws, and the last two open on every ship won, since a
  step on a fresh save has nothing to try on.

The probes in `scripts/probes/0657-the-menus-show-what-you-have.mjs` draw a shut option, step onto a hidden one, draw
a dim arrow, leave owned wares on the shelves, make a shelf's press step, and picture Bubble Jets as a jet. 0561's
probe of a shut option the cursor cannot stand on is retired; its other is re-anchored.

## Not held by any guard, and owed

- **"The menus suck on gamepad overall."** These are the concrete pieces the pages named. Which other moves feel wrong
  on a pad, a keyboard or a thumb is owed a play that names them.
- **Show owned is not kept between visits.** A setting the player wants kept is an `itc_*` key and a rollback note.

## Rollback

None owed ([0001](0001-revertability-not-risk-rating.md)): nothing stored changes.
