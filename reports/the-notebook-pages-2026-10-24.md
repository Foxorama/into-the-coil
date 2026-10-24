# The notebook pages — 2026-10-24

**Asked:** four handwritten pages of feedback, photographed, with *"make sure main is all good but start
working on the next set of feedback in the meantime."* Transcribed here because chat evaporates —
[0029](../docs/decisions/0029-the-tracked-record-is-the-record.md). Words in quotes are the page's; a word
I could not read with certainty is marked *(read as)*.

**What checked `main`:** at `0ceba48` (#645), `npm run typecheck` on a fresh `npm ci`, green. The whole
`npx vitest run` beside it was stopped by the container's thirty-minute limit before it finished, so it
reported nothing, and the verdict below is CI's. #646 (0648) merged during the work; it was opened
on `0ceba48`, and its run 40077265945 passed every suite shard, every proof shard and the joined `test` job
before the merge, so `f3e8355` is the tree CI tested. It is merged into this branch; the one conflict was
`docs/state-of-play.md`, both entries kept.

⚠️ **Pointers, not findings, where a decision holds the finding.** Each item names its status and, for the
ones not built, the cause found in the code (with where) or what would establish one.

---

## The items

| # | the page | status |
|---|---|---|
| 1 | *"Venoma secret ship — unlocked if beat all diffs with any character. Has the serpent boss attacks → acid spray; missile turrets are the void blasts from serpent boss + special is red lightning called down from the sky."* | **Not built — a feature, owed a plan.** A ship, a pilot lock (`src/content/golfers.ts` holds the locks), a gun, a tube and a special, each a new row |
| 2 | *"Snake died to lightning gun and roots *(read as; the page says 'rooks')* didn't disappear, no idea why."* | **Built — [0651](../docs/decisions/0651-the-arc-lets-the-serpent-fall.md)** |
| 3 | *"Fighter → tubes + gun should be under + not over ship."* | **Not built — cause found.** The fighter's gun is painted last in its bake (`drawPlayerShip`, `src/render/bake.ts`, `mounted`), and every ship's loaded tubes are the last layer drawn (`loaded`, after `shipPool`, in `src/app/mount.ts`). Under the hull is a per-ship order and a new decision against [0581](../docs/decisions/0581-the-weapons-sit-right.md) |
| 4 | *"Missile tubes need to look way cooler."* | **Not built — a look, owed the player's direction.** [0629](../docs/decisions/0629-a-launcher-and-not-a-box.md) is the last pass |
| 5 | *"Grav ball special needs to roll forward, not stay in one spot; roll forward off screen then disappear."* | **Built — [0656](../docs/decisions/0656-the-void-rolls.md).** Answered: *"Grav ball is the void special."* |
| 6 | *"Points on time was added to L'il Caddie instead of hamster ball."* | **Built — [0653](../docs/decisions/0653-the-clock-is-the-balls.md).** Answered: *"the lil caddie's score multiplier kept resetting to 1 and that score multiplier reset should only apply to the hamster ball."* |
| 7 | *"Point decay should be 3 sec, + then it ticks down per sec till a hit happens."* | **Built — [0649](../docs/decisions/0649-the-streak-ticks-down.md)** |
| 8 | *"Confirm noise on menus."* | **Not built** |
| 9 | *"Shield pop noise is bad + should be specific per shield."* | **Not built** |
| 10 | *"Missile tubes should be individual and have a left/right slot, not have a '2nd tube'. You can buy up to two of each tube & equip them however you like. The two tubes + one of each is way overengineering it."* | **Not built — a redesign of [0577](../docs/decisions/0577-the-tubes-are-full.md) and [0578](../docs/decisions/0578-the-tubes-are-sold.md)**, and the save holds what is owned and fitted, so it carries a rollback note ([0001](../docs/decisions/0001-revertability-not-risk-rating.md)) |
| 11 | *"Savior → spawn w/ shield after death."* | **Built — [0650](../docs/decisions/0650-a-savior-death-opens-on-a-shield.md)**, taking back [0614](../docs/decisions/0614-the-shields-come-down-a-tier.md)'s *"don't give saviour a shield on death"* |
| 12 | *"Pterodactyl lazer noise."* | **Not built** |
| 13 | *"Level descriptions."* | **Not built — where they are shown is the player's** |
| 14 | *"Side arrows show on menus even when nothing to nav to."* | **Not built — cause found.** A shut arrow is only `disabled`, drawn at 0.2 opacity (`-band-step:disabled`, `src/app/chrome.ts`), and on a band that tries every slot band is `ends: 'round'`, so a band whose others are all shut keeps both lit (`sayBand`). [0458](../docs/decisions/0458-the-title-is-rows.md) asked for an end to be *drawn dim*, so hiding it amends 0458 and [0607](../docs/decisions/0607-the-menus-come-round.md) |
| 15 | *"A button on game console goes to next item in stores, it should confirm just like it does on main menu."* | **Not built — cause found.** A pad's A is the band's `press` (`activate`, `src/app/chrome.ts`): the title's pilot band `takes`, every Cosmo's shelf `steps` (`src/state/screens.ts`), and buying is only the Buy button |
| 16 | *"Controls config for keyboard + gamepad in settings. Need to make sure it saves properly."* | **Not built — a feature**; a new `itc_*` setting, so a rollback note |
| 17 | *"Menu nav just sucks on gamepad overall."* | **Not built — owed a play** naming where. 14 and 15 are two of it |
| 18 | *"'Owned' menus should only show unlocked items & not everything with a lock."* | **Not built — a reversal.** [0561](../docs/decisions/0561-the-cursor-tries-on.md) keeps a shut option standing so it can be tried on, and [0521](../docs/decisions/0521-the-hangar-opens.md), [0523](../docs/decisions/0523-cosmo-opens.md) and [0527](../docs/decisions/0527-the-wheels-turn.md) show what is locked on purpose. Hiding is `hidden` on the button by index, so no index moves |
| 19 | *"Bubble jets *(read as; the page says 'dets')* has wrong icon + kept disappearing from menu."* | **Not built — causes found.** The icon: every flame's picture is a jet tongue whatever its `look` (`wareArt`, `src/app/chrome.ts`). Disappearing: it is the duck's own flame, shut on any other ship until both are won (`flameOpen`, `src/state/slices/hangar.ts`), and a phone shows a band's fitted chip only; Cosmo's never shelves it, having no price. Which of the two was seen is unknown |
| 20 | *(asked after the pages)* *"The missile supercharge item should have a 50% chance of being a shield instead of missiles. Game can be hard on saviour and burn."* | **Built — [0652](../docs/decisions/0652-a-full-rack-throws-a-shield.md)**, and Legend keeps its supercharges — [0655](../docs/decisions/0655-legend-keeps-the-supercharge.md) |
| 21 | *(asked with the answers)* *"The hamster ball special charge just for the hamster ball needs to be 20% slower as it now stores the specials and then keeps charging."* | **Built — [0654](../docs/decisions/0654-the-dance-charges-slower.md)** |

---

## Built first, and why

2, 7, 11 and 20 in #647: each is a change whose rule the page states whole, and which the code could be shown to
break and then not to. 5, 6 and 21, and 20's Legend half, once the player answered. The rest is a design call the
page leaves open (1, 4, 10, 13, 16), a reversal of a decision now answered (3, 14, 15, 18, 19 — the menus), or sound
work (8, 9, 12).

## The player's answers, 2026-10-24

- **5**: *"Grav ball is the void special."*
- **6**: *"The lil caddie's score multiplier kept resetting to 1 and that score multiplier reset should only apply to
  the hamster ball."*
- **18**: *"Locked items should be hidden on every equippable screen, they should be visible in cosmos and in cosmos
  owned items should be hidden unless you tick to show them."*
- **19**: *"The bubble jet missing was unity shop."*
- **The menus**: *"Changes apply to everywhere. The menus suck pretty hard on desktop as well as mobile."*
- **0652 on Legend**: *"Legend should keep the missile supercharge."*
