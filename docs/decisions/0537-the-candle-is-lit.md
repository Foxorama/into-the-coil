# 0537 — The candle is lit

**Accepted 2026-10-05.** Item 1 of [`the-thunderbolt-planned`](../../reports/the-thunderbolt-planned-2026-10-05.md):
the special of the Firebird's Catherine wheel, landed ahead of its gun. A new shape of special beside
[0374](0374-the-storm-and-the-whirlpool.md)'s, [0377](0377-the-void.md)'s and
[0447](0447-the-ward-is-a-third-trigger.md)'s.

## The ask

> *"the special for the new weapon will be a roman candle of fireworks blasting out and filling a good
> chunk of the screen with fireworks."*

## The rule

**The roman candle is a gun special. A press fires a star at once, and seven more follow on the half
beat's grid, each from wherever the ship is when it leaves, fanned from one side of the nose to the
other. Each star flies to its turn of four reaches and goes off as a firework: a burst twenty-two units
across that lands six on everything inside it once, and a hundredth of a boss's health. It holds the
throw gap for as long as it fires.**

| | |
|---|---|
| **the row** | `candle` in `src/content/specials.ts`, a seventh shape (`Candle`): eight stars, twelve steps apart, a fan of 0.55 radians either side, reaches 72, 112, 92 and 128 in turn, a star and a burst row in `SHOTS`, and a boss share per burst |
| **a star** | `candleStar`: thrown as a bomb is, in the bomb pool, hurting nothing, at 3.5 a step in the camera's frame; turned along its flight, so its tail of glitter trails behind it. One flying off the side of the lane goes off at the edge |
| **a burst** | `firework`: radius 22, damage 6, in the blast pool, on the ship on its one step as every blast is. Three pictures — the burst, the bloom, the fall to glitter — in three colours taken in turn: gold, cyan, lavender |
| **the trigger** | the gun's. The bomb pickup offers it as a fourth face, so every ship can take it from this change on; the Firebird opens on two once its wheel lands |
| **the sound** | `candle`: the fuse catching and the first star's pop; `candleStar`: each star after it, a hollow pop and a whistle, figured on the beat; `firework`: a crack, a boom on the root and its glitter falling, on the grid |
| **the pools** | the blasts 9 → 13, the enemy shots 200 → 196; the total is unchanged |

## Why it is built the way it is

**Stars are bombs and fireworks are blasts, and nothing else is new.** A star in flight is in no
pairing and goes off where it was aimed, as a bomb does; a firework lands through the blast pairings,
on bodies, on the boss and on the ship's first step. A lost life clears both pools and puts the candle
out. The new code is the clock that fires the stars and the edge rule for one that flies across.

**A candle held on a moving ship sprays.** Each star leaves from where the ship is, so a candle lit
while flying sideways lays its fireworks along the way the ship went, and one lit standing still fans
them evenly. The reaches alternate near and far so the bursts tile the screen in depth rather than
standing on one arc. Fired from the middle of the lane on the reference view, the eight burst between
100 and 170 units ahead of the camera's back edge and across the lane's whole width.

**The first star answers the press; the rest are on the grid.** A press must be immediate ([0104](0104-the-gun-plays-a-figure.md));
what follows is on a clock the player no longer holds, so it waits for the half beat as the guns'
volleys do, and the eight pops are a figure in the music.

**Fire in the player's inks, never `fire`.** `fire` is the hostile meaning ink — *this will burn you*
— and `src/content/palette.ts` keeps the ship's own fire out of it. The fireworks are gold, cyan and
lavender: the hazard gold, the ship's own cyan, and the ally lavender. The gold is the one blast ink, and
the other two follow the ray's burst, which has landed on the ship in the ally ink since
[0442](0442-the-ray-gun.md): a firework a hundred units ahead of the ship is fireworks, not a ring the
player is asked to stay out of.

**Under the bullets.** The blast pool is the first layer the scene paints (`src/app/mount.ts`), so every
firework is drawn under every hostile shot, every body and the ship. The screen fills with light and
nothing the player has to read is behind it.

**Sparks and not a filled flash, so eight in two seconds stay under the cap** —
[0024](0024-the-accessibility-floor-is-settings.md), [0457](0457-the-flash-cap-is-measured.md). A bomb's
blast is a filled disc paced by the throw gap; a firework's hull is only its heart, and its light is
twenty streaks with the dark between them. `scripts/weigh-flashes.mjs --only=candle`, lit again the
moment each gap allows for eight seconds: **no general flashes, peak changing area 6.0%** against the
cap's 11.1% (4.5% at the first photograph's radius of 16).

**Twenty-two, and it was sixteen.** The first photograph had three or four fireworks open at once, each
about a quarter of the lane's height across and most of it dark: a few fireworks rather than *a good
chunk of the screen*. At twenty-two each is over a third of the lane's height, and the eight together
light at least a quarter of the screen ahead of the ship on the narrowest view, which
`tests/candle.test.ts` holds in the player's units.

**The boss share was measured, not asked for.** What one candle takes off each boss at Savior, fired
from 60 and 100 units short of the hull on its axis, beside the bomb fired the same way:

| boss | bomb 60 | bomb 100 | candle 60 | candle 100 |
|---|---|---|---|---|
| jormungandr | 5.0% | 5.0% | 3.0% | 3.0% |
| volans | 5.0% | 5.0% | 3.0% | 5.0% |
| quetzal | 5.0% | 5.0% | 2.0% | 2.0% |
| gyre | 5.0% | 5.0% | 3.0% | 6.0% |
| hoarfrost | 5.0% | 5.0% | 3.0% | 4.0% |
| hydra | 5.0% | 5.0% | 6.0% | 5.0% |
| medusa | 5.0% | 5.0% | 6.0% | 6.0% |

Two to six per cent, where the bomb is five and [0374](0374-the-storm-and-the-whirlpool.md)'s whirlpool
2.8 to 10.1: the candle is the bomb's size on a boss, a little under it aimed badly, and what it has that
the bomb does not is the rest of the screen.

**The pools.** Three stars are aloft at most, so a bomb thrown just before the candle still has the
bomb pool's fourth slot. Four fireworks are open at most, and a candle lit the moment the gap after
[0377](0377-the-void.md)'s salvo of eight voids opens finds six rifts open and more opening: it needed
more than the nine the blast pool held, and dropped a firework at nine. Thirteen leaves the pyre its
slot. The four came from the enemy shots, whose worst measured (the gyre at Legend, 174) is still
twenty-two under 196, so `CAPACITY`'s total and the frame's worst case are unchanged.

**It is called "Candle", and was "Roman candle" until CI read it.** How to play stacks each pickup's
face labels in one column as wide as the widest ([0432](0432-the-key-cycles.md)); the longer name widened
the column for every row, and on CI's fonts the words beside it wrapped until the guide's Back button sat
off the smallest landscape phone (`tests/layout.browser.test.ts`, green on this machine's fonts). The
face shows a roman candle and the hint says fireworks; the name is the word that fits.

**`canThrow` learned that a candle is a throw.** It let anything with no `shot` through at any time,
which was right while that meant a surge or a whirlpool. A candle has no `shot` and throws eight things,
so it waits for the gap and holds it until its last star plus the gap: a bomb under a candle would be a
ninth burst inside its two seconds.

## Rollback

⚠️ **None owed** — [0001](0001-revertability-not-risk-rating.md). No storage key, save field or shipped
surface moves: the arsenal is run state, and the run is not saved. The hangar's special slot offers a
ship its own gun's special, and no ship's gun is the wheel yet.

## What guards it

`tests/candle.test.ts`: it is a gun special and the bomb pickup offers it; every star fires, the first
on the press and the rest a grid slot apart; the fan sweeps from one side to the other with every star
turned along its flight at its row's speed; every star bursts in turn through the three colours inside
the view; **the fireworks light at least a quarter of the screen ahead of the ship on the narrowest
view**; a firework lands on what is inside it; the throw gap is held while it fires; it goes out with
the ship; a star fanned off either edge goes off at the edge and not past it; and the pools fit, beside
the void salvo too. `tests/bombs.test.ts`'s two enumerations of a special's shapes learned the seventh.
Probes in `scripts/probes/0537-the-candle-is-lit.mjs`, all twelve seen red on their own guard; the
probes of 0375, 0377, 0378 and 0479 were re-anchored where this moved their lines, and each still
proves.

## Owed

- **A play on the preview**: whether eight stars on the half beat read as a roman candle, whether the
  bursts read as fireworks at speed, and whether *a good chunk of the screen* is this much.
- **The ear** on all three cues, over the music.
- **Whether a firework landing on the ship reads as fair.** It is 0053's blast rule and the ray's
  burst has it; a star goes off seventy units ahead at the nearest, so the ship has to fly into one in
  the step it opens.
- **Whether four faces on the bomb pickup is too many to wait through** before the one wanted comes
  round. It was three.
