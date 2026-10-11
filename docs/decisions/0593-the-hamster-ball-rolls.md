# 0593 — The Hamster Ball rolls

**Accepted 2026-10-11.** Item 2 of [`the-secret-pilots-planned`](../../reports/the-secret-pilots-planned-2026-10-11.md).
A sixth pilot and a sixth ship beside [0546](0546-the-marmot-rides.md)'s, locked on
[0592](0592-the-crashes-are-counted.md)'s count.

## The ask

From the handwritten page:

> *"Least Weasel Pilot — Hamster ball — flies into things to kill them — how to die? / challenge — Unlock – 10
> non-bullet deaths — "overheat" → need to let shields recharge. Hamster ball break + recharge."*

Answered while it was planned:

> *"No weapon change for hamster ball, other ships can pick up the special once the hamster ball is unlocked tho
> so we'll need animations for all ships for that special"* — and — *"hints for unlocks is good"*.

## The rule

**Unity, the least weasel who keeps Hangin' Out, flies the Hamster Ball: a clear ball they run in. Its gun is
the ram — the ball itself, flown into things. A landing heats it; a full gauge breaks it, and it comes back
whole and cool after three seconds. While it is whole, nothing it flies into hurts it; enemy fire always
does. Its special is the War Dance: for three seconds the ship bounces round its box on its own, ramming
everything and heating nothing, and nothing hurts it. Unity opens after ten crashes, and the band counts them
down. The ram goes on no other ship and the ball flies no other gun. No other ship gets the War Dance yet.**

| | |
|---|---|
| **the pilot** | `unity` on `src/content/golfers.ts`, they/them, from Hangin' Out, `figure: 'weasel'`; `opens` asks ten crashes. Five lines each way, the Aussie in the words (0426's rule), and in the Viper's pool from the first run as the Marmot is |
| **the ship** | `ball` on `src/content/ships.ts`, from above: the ball (`BALL_RADIUS`, 3 units), Unity running in it, a thruster pack behind, a cradle on a stub of axle for each tube. `bare` on every row, `null` but the ball's: Unity on their harness while it is broken |
| **the gun** | `ram` on `src/content/weapons.ts`, flight `ram`: nothing is fired. `Ram` on its row — reach, heat a landing, scrape a step on stone, cool, drain, recharge — and `lends: false` on it, `true` on every other gun |
| **the ram in the frame** | one body in `playerShots` (`RAM_KIND`), laid on the ship and given its velocity every step (`steerRam`) so the swept pairings that already exist ram every enemy, the boss and the serpent's flank; landing as a blade does, on 0391's clock (`landGap`). What it lands is read off what its body lost (`ramLanded`), and `settleRam` heats, cools, breaks and mends |
| **the heat, drawn** | the ram body's picture is the gauge's stage (`ramHeat0`–`3`), under the ball inside its outline. Broken, the ship wears `bare` and the body is gone. 0036 |
| **what hurts it** | whole, the ship skips the body pairings and the stone only scrapes it hot; fire lands as on every ship. Broken, everything lands, after the window a hit gives — a ball breaks inside what it was ramming |
| **the War Dance** | `warDance` on `src/content/specials.ts`, `dance` on its row; `danceShip` flies the ship off the box's edges and the stone, `untouchable` skips every pairing, and the ram body rides any ship while it dances. A press while it dances is refused |
| **not yet shared** | `shared` on every special, `false` on the War Dance: it is no face on the bomb pickup (`BOMB_KINDS`) and no other ship may open with it (`specialOpen`) until every ship has a dance drawn — the plan's item 3 |
| **the hangar** | `gunOpen` asks both guns lend; `gunWhy` and `optionWhy` say why not. The ship grids are as many a row as there are ships. Each shut pilot card says its own hint (`lockHint`, through the band's `whys`) |
| **sounds** | `ram` (a rubber ball's thump), `ballBreak`, `ballMend`, `warDance`, each with its picture twin |

## Why it is built the way it is

**The ram is a gun because the game holds every ship to one.** `shipCarrying` maps each gun to its ship and
`tests/wheel.test.ts` holds that the ships' guns are the guns; a ship with no gun would break the boss
floors, the cue per flight and the hangar. A gun that fires nothing and whose ship is its shot is a row,
and the frame switches on its flight as on every other.

**The ram is one body pinned to the hull, so nothing new collides.** The Catherine wheel already put a body
in `playerShots` that is not spent by arriving. Pinned to the ball each step, the same body is rammed into
everything the pairings already pair it with, under the same per-target clock — and counting its landings
is reading what it lost.

**The heat is under the ball, inside its outline.** A halo round the ball would sit over the bullets beside
it, which 0373 took the surge's aura out from under. The ball's plastic is translucent, so the heat shows
through it and covers nothing the ball does not.

**Fire always lands.** The page's *how to die?* is the right question: if a whole ball could not be hurt by
anything, the ship could not die. So the ball turns bodies from a hazard into the weapon, and fire is the
danger every ship has. Overheating is the second danger, and the one the player makes for themself.

**The dance cannot be hurt.** A ship flying itself is one the player cannot dodge with.

**Breaking gives the window a hit gives.** Played in a test before any hand: a ball pressed into a body broke,
and the body landed on the same step — a death with no step to see it coming.

**The ram's guards that measure reach exclude it by its row, not its name.** The floors that ask a gun to
finish a boss from forty-five units short, and the pairings drawn for every borrowed gun, read `lends` and
the flight; a gun that reaches nothing is held where it can reach, against the hull.

## Rollback

⚠️ **None owed** — [0001](0001-revertability-not-risk-rating.md). `itc_hangar` reads per ship and per pilot, and
a ship it has never heard of reads as not won (0546's note); an older build ignores the ball's entries and
drops them the next time it writes.

## What guards it

`tests/ball.test.ts`; the ram's and the dance's places in the suites that walk every ship and gun. Probes in
`scripts/probes/0593-the-hamster-ball-rolls.mjs`.

## Owed

- **A play** — of the ram's numbers above all: the heat a landing, the recharge, the dance's speed, every one
  a play number.
- **The art at the shipped camera**, photographed on the sheet once: the ball reads, Unity reads as a small
  animal; the hat from above is a dark disc.
- **The ear** on the four cues.
- **Item 3**: a dance drawn for every ship, and the War Dance shared once Unity is open.
