# 0680 — Depth and life

**Accepted 2026-10-25.** Item 5 of [`the-port-planned`](../../reports/the-port-planned-2026-10-24.md), from
[`the-port-is-a-cutout`](../../reports/the-port-is-a-cutout-2026-10-24.md). It amends
[0548](0548-the-hangar-holds-still.md): what idles on the stand.

## The ask

After items 1–4 the port was lit, formed and staged, and still one plane deep. Past the bay there was only sky, and
nothing stood nearer the player than the deck. Nothing in the room moved unless the story moved it.

## The rule

| | where | what |
|---|---|---|
| **The spar** (`spar`) | past the bay, in both rooms | the station's own structure: a lit module on an arm reaching in from the right. A plane at half the room's depth (`planeAlong`): the dolly (0678) slides it half as far as the room, and the intro's push-in (0679) half as far |
| **The shuttle** (`shuttle`) | past the bay | a far ship crossing it, once a minute on the stand and once in the intro's held shot, fading in and out |
| **The rail** (`rail`) | along the dock's foot | a safety rail on posts, the nearest thing to the player, drawn last at 1.1 times the room's scale and depth |
| **A lamp's fault** | the room's first lamp, in both rooms | its lamp and its pool dim for a step now and then, on a pattern from an inline hash of the step (`hash`, no allocation) that repeats every bob |
| **Steam** (`steam`) | the first vent in the wall's upper rows past the lift (the dock) or past the bar (the intro) | a puff rising and thinning off it, once in three bobs. The vent is read off the wall's own overlays (`ventOn`), so the steam is always at a vent |
| **Sparks** (`sparks`, light) | Unity's bench | a grinder's sparks flaring for the first 45 steps of each bob, while Unity is at the counter |
| **The neon** (`neonDark`) | the bar | the parrot sign dark at half alpha for one step in sixty. The sign is one painter, `paintNeon`, lit on the bar and unlit for this |
| **The string lights** (`twinkle`, light) | the bar's awning | one of its fifteen bulbs flaring every eight steps, a different one each time by the hash |
| **A fan** (`fan0`–`fan2`) | the upper wall | its blades three frames apart, five steps each. Baked turned, so the stand never turns the canvas (0558) |
| **The beacon's cone** (`beaconCone`, light) | the intro's alarm | a cone of red off each beacon while it faces the room, turned to where its wash (0679) falls |
| **A drone** (`drone`) | along the truss | working from the room's left to the bay, once a minute on the stand and once in the intro's held shot |

**On the stand, everything that moves by itself repeats every bob, or is drawn where the stand's guards never read.**
Those guards read two pictures a bob apart (`samePhase`, `tests/stand.ts`), in a band from 30 units behind the ship
to short of the bay and from a third of the way down the stand:

- **Off the bob's clock and outside the band.** The shuttle and the spar are past the bay. The drone, the fan and the
  steam are above the band. The flickering lamp and Unity's sparks are left of it.
- **On the bob's clock anyway.** The flicker, the sparks, the steam (three bobs) and the fan (seven turns of its frames
  a bob) all repeat every bob.
- **The rail** is in the band and stands still.

## Done differently from the plan, and not done

- **The spar does not drift with the sky.** It is the station's own structure, and the room does not drift either.
  It moves only with the camera, as a plane at its depth.
- **The rail is not drawn where it would meet the cockpit readout.** On a phone the readout stands at the stand's
  foot, over the deck, and the rail ran behind its lower edge:
  - At 844×390 the rail's top stood at 359 px and the readout's foot at 379.
  - At 480×320 they were 298 and 313.

  The shell reads the readout's box on every framing (`dashBox`) against the rail's top (`railTop`) and tells the
  painter (`World.standRail`). On a desktop the rail is clear and drawn. On the phone sizes it is drawn only where it
  clears, which is Paint & Parts at 480×320.
- **The fan is three baked frames, not a turned blit.** 0558's guard counts the stand's canvas turns, and it must
  read none.

**What the rail covers**, measured on the built page off a shopfront door as a ruler:

| size | tab | rail | readout's foot |
|---|---|---|---|
| 1280×720 | Hangin' Out | the lowest 54 px, from 666 | 516 |
| 1280×720 | Paint & Parts, Cosmo's | nothing: below the screen | — |
| 844×390 | every tab | not drawn | 379 |
| 480×320 | Hangin' Out, Cosmo's | not drawn | 313 and 310 |
| 480×320 | Paint & Parts | the lowest 2 px, from 318 | 313 |

## What it cost and the guards it moved

- **The port's atlas**, measured in the browser with the pilot at the default:
  - The twelve new kinds are 1.36 MB of the intro's 27.13 MB and 1.16 MB of the stand's 32.52 MB at 1280×720.
  - They are 3.23 MB of 64.31 MB at 1920×1080 doubled, for either.
  - The bakes took 112 ms and 66 ms at 720p, and 90 ms and 68 ms at 1080p doubled.
- **Blits a frame**, every one a blit of a baked bitmap:
  - On the stand, up to 13 more: the spar, the fan, the rail's seven spans, and when they are on, the shuttle, the
    drone, the steam and the sparks.
  - In the intro, up to 8 more: the spar, the fan, a twinkle, and when they are on, the shuttle, the drone, the
    steam, the neon and the cone of the one beacon facing the room.
  - `tests/budget.test.ts` is green. The vents are found once at module load, each line under its `// @setup:`.
- **`tests/stand.test.ts`**, *0680*, new: on every tab at 1280×720 and five steps, the blits in the guards' band at a
  step and a bob later are one set. The sky past it is the game's and is left out.
  - Its recording surface records alpha now, which a flicker changes and a position does not.
  - Probed in `scripts/probes/0680-depth-and-life.mjs` with the cradle's rings rising on a period nine steps off
    three bobs: red at step 0, the band 49 blits either way, and not the same 49.
- The stand's sampling suites (art, livery, pad-tubes, pad, wheels), the dolly, the stand, the workshop, the dressed
  stand, 0558's run-ends and 0679's staging pass.
  - Run together, eleven browser suites at once, run-ends' *0674 — on First flight…* ran out its 120 s.
  - Alone it took 74.4 s here, and 74.8 s on `main`'s source before this decision. This decision did not slow it.

**Not held by any guard:** every new piece's drawing, where each stands, every timing, and that the rail clears the
readout. That last is a rule the shell applies, measured above, and not asserted by a test. They are the picture's.

**Photographed** with `scripts/shot-menus.mjs` at the pair, the guard's six, 1920×1080 and 2560×1080, and the intro
at 1.2 s and 6 s:

- The first build's fan and steam were under the plate on a desktop, and are on the upper wall now.
- The first vent the steam was looked for at was behind the truss, and the search starts below it now.
- The shuttle, the drone and the steam are each on for seconds in a minute or in three bobs. Shots taken on the wall
  clock caught the drone in the intro and Unity's sparks on Cosmo's tab, not the shuttle or the steam.

## What is owed

- A clip of the stand in motion, which the plan asked for and this did not take, and a play: whether the life reads
  as a working dock or as noise, and whether the rail reads as nearer than the room.
