# 0595 — The Aqua Duck paints

**Accepted 2026-10-11.** Item 3 of [`the-secret-pilots-planned`](../../reports/the-secret-pilots-planned-2026-10-11.md).
A seventh pilot and a seventh ship beside [0593](0593-the-hamster-ball-rolls.md)'s, locked on
[0592](0592-the-crashes-are-counted.md)'s count of things bought.

## The ask

From the handwritten page:

> *"Aqua duck for Space duck → bubble jets / water guns? → x customisations to unlock? → paint ball gun weapon"*

Answered while it was planned: *"hints for unlocks is good"*.

## The rule

**MMXXVI, the space duck who paints the ships on Paint & Parts, flies the Aqua Duck: a little submarine
shaped like a bath duck, drawn from the side. Its gun is a paintball marker under its chin that fires a
scattered string of paint in four colours; each ball splats in its own colour where it lands, and the splat
lands on what is beside it. Its special is the Water Cannon: a jet of water swept across the lane for two
seconds. Its engines blow Bubble Jets. MMXXVI opens after five things bought at Cosmo's, and the band counts
them down. The bomb pickup offers the Water Cannon once MMXXVI is open, as it offers the War Dance once Unity
is.**

| | |
|---|---|
| **the pilot** | `mmxxvi` on `src/content/golfers.ts`, they/them, from Paint & Parts, `figure: 'duck'`; `opens` asks five things bought. Five lines each way (0426's rule), and in the Viper's pool from the first run, as the Marmot and Unity are. A runner and a portrait of their own (`paintDuckRunner`, `paintDuckPortrait`) |
| **the ship** | `duck` on `src/content/ships.ts`, side-on in the predecessor's frame as the cars are: the hull on its keel, the tail up, a periscope, the head and bill, the marker under the chin and its pods on its back (`drawDuck`). Four looks of its own (`bathYellow`, `paintSplats`, `polkaDots`, `gildedDuck`), a shell of paint drips (`drips`), and a dance: the head down to dabble, then the tail up and the head back |
| **the gun** | `paintball` on `src/content/weapons.ts`, flight `splat`, one ball a quarter of a beat. `Paint` on its row: how far a ball may leave off straight ahead, and its colours, each with its ball, its splat and its dried splat. Both the angle and the colour are drawn from the gun's own stream (`paintRng`, 0021) |
| **the splat** | `splat` on `src/content/shots.ts`, a blast on the ring burst's terms (0442): where a ball lands (`splatPaint`), on the same pairing, at the ball's own colour — the colour rides the shot's `kind` into the landing log, which now keeps it (`collideInto`). Wet, then dried flat, for two thirds of a second |
| **the Water Cannon** | `waterCannon` on `src/content/specials.ts`, `jet` on its row: two seconds, swung half a radian and more either side of the nose once a second, seventy-two units long. It lands along its line as the Catherine wheel's tether does (`landJet`, through `tetherInto`), on the blades' clock at its own `landGap`, and on a boss at the window a bomb lands at. Laid each step as a bolt link (`JET_BOLT_KIND`) and painted as a held column of water in a fourth bolt tone (`BOLT_WATER`) |
| **Bubble Jets** | `bubbleJets` on `src/content/flames.ts`, with a `look` — a flame is a tongue of fire or a stream of bubbles (`paintBubbles`) — and a `from`: the ship it comes on. The duck burns it as it comes (`flame` on every ship row); another ship may once both are won in, on the shells' and the rims' rule (`flameOpen`) |
| **the gun's glyph** | `glyph` on every gun row — the picture the hangar's gun band shows. It was the shot's own sprite, which is right for every gun whose shot is one picture; the paintball's is four |
| **seven a row** | the hangar's ship grids read the ship table's length since 0593, so seven is a row. On a phone the plates' pilot faces are narrower: at 667x375 the seventh put their column 14 px past the plate, so a face is 4.2 of the screen's width down to the title's floor of 1.7rem, and its card no wider than its ring. From 812 wide up the height still decides |
| **sounds** | `paintball` (a marker's pneumatic pop, a gun's stream, dry — 0145) and `waterCannon` (a valve's knock and the rush of a hose), each with its picture twin |
| **on a boss** | `bossWeight: 1.1` on the row, and 1.6 on the jellyfish's own |

## Why it is built the way it is

**A splat is the ring burst's mechanism, because it is the ring burst's job.** A ball spent where it lands
and going off there as a small blast is what 0442 built for the ray; the only things new are where its
colour comes from and that it stays a while. So the paintball is a flight of its own — its volley is not the
pulse's fan and its landing is not the ring's picture — and everything after the landing is the blast pool's.

**The colour rides the shot's kind into the landing log.** The log already had a kind column for deaths and
nothing wrote it for hits. Writing the shot's kind there is one line; a second log of colours would be a
second description of the same landing.

**A splat takes its colour on the step it lands.** It is laid after the step's pictures are set, so it wore
the row's own picture — the first colour's — for one frame whatever the ball was. `tests/duck.test.ts`
found it with one ball in the air; 0036's *the picture mentions what the model resolves*.

**The Water Cannon is the tether's line, swept.** A jet that lands on what crosses it is the Catherine wheel's
tether from the muzzle to a point that swings, so it lands through `tetherInto`, on the stone's terms and the
blades' clock. Drawn as the tether is, one link laid each step, and as a beam is — held and as wide as it
lands (0250) — because the player stands beside it for two seconds.

**Bubble Jets come on the duck and are borrowed, not bought.** The plan read them as on sale at Cosmo's once
the duck had flown. Every look a ship comes with — its shell (0584), its wheels (0527) — is its own from the
start and another ship's once both are won in, and a flame that came on a ship is one of those. So it follows
that rule, and nothing new is sold. The plan's reading is replaced, and can be put back: a price on the row
and the shop's own gate.

**The duck's dance moves its head and its tail and nothing the frame lays on it** (0594's rule): the marker the
balls leave, the pods the tubes sit in, the periscope and the stern its bubbles blow from stay where they are.
The head turns from above the cheek — turned from the neck's root, the cheek came down through the hopper and
the outline folded over itself there, which `tests/accents.test.ts` read as a hole.

**A boss weight of 1.1, and 1.6 on the jellyfish.** One ball a volley is slower on a boss than a fan: flown
from every held place at one (`scripts/weigh-boss.mjs`, Savior), its best fights were 48–66 s on six end
bosses where the pulse's are 40–54, and 90 s on the jellyfish, whose jellies get in front of a single string.
At 1.1 the six are 45.4–62.6 s; at 1.6 the jellyfish is 48.7 s.

**The colours are paint and not meaning inks** — 0295's question, raised and not ruled. A hostile bullet takes
its place's colour, and a paintball in that colour could be read as fire; none of the four is the enemy's red,
a ball leaves the player's own gun, and a splat is what no hostile shot does. Each place is looked at for it,
owed below.

## Rollback

⚠️ **None owed** — [0001](0001-revertability-not-risk-rating.md). `itc_hangar` reads per ship and per pilot, and a
ship it has never heard of reads as not won (0546's note); an older build ignores the duck's entries and drops
them the next time it writes. A flame the save names that an older build does not know is read as the
standard.

## What guards it

`tests/duck.test.ts`; the duck's places in `tests/mounts.test.ts`, `tests/dance.test.ts`,
`tests/accents.test.ts` and the suites that walk every ship, gun and special. Probes in
`scripts/probes/0595-the-aqua-duck-paints.mjs`.

## Owed

- **A play** — of the paintball's scatter and cadence, the splat's reach, and the jet's sweep and length; every one
  a play number.
- **The art at the shipped camera**, photographed on the sheet once: the duck reads as a bath duck, the marker
  under its chin as a gun, the dance's dabble and tail.
- **Paintballs looked at in every place**, for 0295's question.
- **The ear** on the two cues.
