# 0313 — The fish breaches

**Status:** accepted
**Builds on:** [0306](0306-the-serpent-coils-in.md), [0312](0312-the-eagle-was-always-a-fish.md)
**Amends:** [0306](0306-the-serpent-coils-in.md) — an `Entrance` is a closed union of kinds now, not one coil
**The brief:** [`the-fish-asked`](../../reports/the-fish-asked-2026-09-12.md)

## The ask

> *"use the 'pattern' of the serpent boss to improve the level 2 end boss. Don't make the serpent boss
> a hard rule, the pattern is what we want, the style is what makes the different bosses unique*
>
> *fish (level 2) boss — needs a flashy entrance"*

## What it is

`volans` bursts up through the near edge of the lane, skips across the whole screen in **three leaps
that each go higher than the last**, and plunges back out of sight — then arrives on station exactly as
every boss does. Four times it goes through the edge — out, a skip at each junction, and the dive — and
every crossing throws a spray of embers there and cracks.

An `Entrance` is a **closed union** now ([0016](0016-a-hub-enumerates-kinds.md)). `coil` is the
serpent's, with its path maths untouched. `breach` is the fish's:

| | |
|---|---|
| `surface` | the across it breaks through — the near edge of the lane, 100 |
| `from` | the along the first leap starts at, so the whole skip happens inside the narrowest view |
| `leaps` | how many times it comes out |
| `span` | the along one leap covers |
| `height` | how far past the edge the FIRST leap crests |
| `rise` | what each leap multiplies the last one's height by |
| `speed` | along units a step — see *why the arcs are parabolas* |

## Why a leap and not a loop

⚠️ **THE ASK NAMES ITS OWN LIMIT AND THIS IS THE FIRST PLACE IT BITES.** *"The pattern is what we want,
the style is what makes the different bosses unique."* The pattern is: an authored flight onto the
field, not-shootable and fully live, with a learnable place to be, handed over to the arrival every
boss has. The style is what a flying fish is and a snake is not — and the one thing a fish does that
nothing else in this game does is **leave one medium for another and fall back into it.** A serpent
coils because a serpent is a line with no ends; a fish breaches because a fish has a surface to break.

⚠️ **AND THERE IS NO SURFACE DRAWN IN THIS PLACE, WHICH WAS CHECKED BEFORE IT WAS RELIED ON.** The first
draft of this decision had the fish breaking the Ember Nebula's ember cloud. `src/content/themes.ts`
says `ground: null` — *"In space, and the Pillars are the proof: they are a thing you fly PAST."* The
place has maroon gas, an ember glow and the Pillars going by, and **no line along the lane at all.** So
what the fish breaks is the **near edge of the lane and nothing else**: it goes out of sight below the
screen between leaps and comes back up out of it, which is what the player watches either way, and the
embers at each crossing are the tell that it went through something. That is 0251's own picture — a rock
arriving over the far edge gets embers AT that edge, and the volcano that vented it is a landmark
behind, not a thing the rock touches.

⚠️ **WHETHER THE PLACE SHOULD GROW AN EMBER BANK ALONG THAT EDGE IS A DIFFERENT DECISION, AND THIS ONE
DOES NOT NEED IT.** A drawn bank is a backdrop field with its own art pass and its own argument against
`ground: null`. Writing *the fish leaps out of the cloud* in a decision while the screen shows it
leaping out of nothing is exactly the gap [0027](0027-measure-the-picture-not-the-model.md) exists for.

## Why the arcs are parabolas parametrised by along, which is not an approximation

Each leap is the parabola through `(0, surface)`, `(½, surface − h)`, `(1, surface)` over one `span` of
along, and `s` — the entrance's distance along its own path — **is along distance for a breach**, where
it is true path length for a coil.

⚠️ **THAT IS A BALLISTIC ARC AND NOT A SHORTCUT.** A thrown body has constant horizontal speed and a
parabola for a path; parametrising by the horizontal axis is what makes it one. What falls out for free
is the thing that makes a leap read as a leap: the animal is **fastest where it leaves and re-enters and
slowest at the top of its arc.** Measured on the third leap, the steepest — 4.6 across units for every
along unit at the edge, so about **4.7 world units a step breaking out against 1.0 at the crest**: an
explosive break and a hang.

⚠️ **A SINE WAS THE FIRST DRAFT AND IS WRONG FOR ONE READABLE REASON.** `surface − h·sin(πt)` leaves the
edge with zero across speed, so the fish **slides out** instead of bursting out. The shape is prettier
and the event is gone.

⚠️ **AND CONSTANT PATH SPEED WAS THE SECOND.** Arc length along a parabola has a closed form that cannot
be inverted, so a constant-speed breach needs an iteration per read — inside the function `layChain`
calls twenty-seven times a step. What it buys is a fish that crosses its own arc at one rate, which is
the property a leap must not have.

## The place to be is the top of the lane, and it is measured rather than asserted

0306's guard is *park a live ship in the middle of the coil for the whole entrance and see whether it is
hit*, because *"players can learn the pattern to avoid the damage"* is a claim about a ship and not
about a geometry. The same guard, with the fish's own answer to *where*:

⚠️ **THE TALLEST CREST IS AUTHORED TO LEAVE A BAND OF THE LANE THE FISH NEVER REACHES.** `height` 34
rising by 1.4 gives crests 34, 47.6 and 66.6 past the edge, so the furthest the hull's top ever gets is
`100 − 66.6 − 15`: a band of about **18 units at the far side of the lane**, against a ship whose
hurtbox is 2. That is learnable in one viewing — *it comes up from below, so be high* — and it is a
fixed place rather than a window in time, which is what the serpent's hole is too.

⚠️ **AND IT IS LIVE, WHICH THE SAME MEASUREMENT HAS TO SHOW.** A safe band is worth nothing unless the
rest is not safe: the guard also holds that the hull sweeps **past the middle of the lane**, so a player
who stays where they were is clipped. An entrance that is dodged by standing still is scenery.

⚠️ **EACH COLUMN OF THE LANE IS CROSSED ONCE, WHICH IS WHY THIS IS FAIR AT ALL.** The fish's along falls
monotonically, so it is in front of any one column for about thirty of its three-hundred-odd steps and
the player has the rest to be elsewhere. The coil crosses its own columns twice and is the harder
pattern of the two on purpose: this is the second level.

## What the picture says, which the model would otherwise resolve silently

⚠️ **[0036](0036-an-event-the-model-knows-about-the-picture-mentions.md).** A leap ENDS where the next
begins, so three arcs cross the edge four times and not six: out, a skip at each junction, and the dive.
Each throws `BURST.breach` at the edge under the hull and plays `bossBreach` panned where it happened —
so the edge is a thing being broken rather than a line the fish happens to cross.

⚠️ **COUNTED OFF THE PATH RATHER THAN REMEMBERED, AND A SIGN TEST CANNOT DO IT.** How many crossings
have happened by `s` is a function of `s`, so comparing it with the same function one step back needs no
field on the world and nothing to reset when a fight restarts. The obvious alternative — *did `across`
cross `surface` since last step* — is wrong twice over: the run-in sits exactly ON the surface, so the
first break never changes sign; and at a junction the sampling never lands on the instant the parabola
touches, so it dips to within half a unit of the edge and goes back up without crossing anything.

⚠️ **AND THE HULL NOSES INTO ITS ARC**, on 0306's own mechanism: `turn` is the path's heading and the
renderer interpolates it the short way round. **This is the first whole hull in the game to use it** —
the serpent turns a head and its nodes, and every other boss flies level, baked facing down-lane.

## `bossBreach` is the fish's own sound and not the rock's

The fall already plays `threat` when a rock comes in over the other edge (0251), and reusing it here is
the shape [0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md) is named for: *a
mechanism for every instance makes them one instance.* A breach is five layers, and the ember is what
makes them not a splash — the spray crackles rather than patters:

| | |
|---|---|
| **the whoomph** | a sine low in the key, over fast: something big displacing what it came through |
| **the sheet** | white noise whose lowpass OPENS upward, 2.6 kHz to 9.5 — spray thrown up, and the one filter in the table that widens |
| **the embers** | sample-and-hold at 900 Hz falling to 180, ringing at `q` 2.3 — a grain coarse enough to hear as separate sparks |
| **the fall-back** | a finer grain, short, darkening fast: the spray coming down |
| **the wake** | a resonant lowpass sweep, 1.8 kHz to 300 — the body going past |

⚠️ **IT IS NOT THE ACID'S SIZZLE WITH A NEW NAME.** 0308's `bossAcid` is a fine grain *thinning upward
over most of a second* while its highpass rises; this is a broadband front *opening* over a third of a
second with a coarse crackle under it. The grain rates are an octave and a half apart, and
`scripts/hear.mjs` plays them back to back.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0313`:

| broken on purpose | went red |
|---|---|
| every leap the same height, so the flight repeats rather than escalating | `THE ASKED-FOR ONE: it comes up through the near edge` |
| the last leap clearing the whole lane, so there is no band left to learn | `the far side of the lane is the place to be` |
| the leaps barely clearing the edge, so the entrance never crosses the lane at all | `the far side of the lane is the place to be` |
| the first leap started past the narrowest screen's leading edge | `the whole skip happens on the NARROWEST screen` |
| the hull never turned to its arc, so it flies the leap sideways | `the hull noses into its arc` |
| the entrance handed over while the fish is still on the screen | `THE ASKED-FOR ONE: it comes up through the near edge` |
| the spray and the crack dropped, so the fish slides through an invisible line four times | `every time it goes through the edge the screen says so` |
| the first break out of the edge uncounted, so it is the one crossing with no spray | `every time it goes through the edge the screen says so` |

⚠️ **THE PAINTER'S HALF IS 0306's PROBE AND IS DELIBERATELY NOT COPIED HERE.** *The model turns and the
picture does not* is one line in `src/render/scene.ts`, and 0306 already breaks it. A second probe on
the same line would be a second description of one defect; what this change adds is a second **hull**
that depends on it, which is what makes that probe worth more than it was.

**And photographed** — the shipped page at 1280×720, on a scratch build with the fish stood at the
start of level one. It comes in along the edge with its back showing, bursts up nose-first, crests
about two thirds of the way across the lane, and goes back down tail-first and out of sight. The hull
faces its path the whole way, and a ship that stayed where it was lost a life to it.

⚠️ **AND THE FIRST TEN PHOTOGRAPHS ALL MISSED THE CRESTS, WHICH IS WORTH RECORDING.** The three leaps
are 0.82 s apart and the shots were taken on round fractions of a second, so every one of them caught
the same phase of the pattern — and the conclusion off them, *it never leaves the edge at all*, was
both wrong and completely convincing. Three runs offset by 0.3 s is what showed the arc. A photograph
of a periodic thing is a sample of it, and a sampling grid that shares a period with its subject is the
oldest way there is to measure nothing.

## The guard asked for the DRAWN size and got the hurtbox, which is the bug this change nearly shipped

⚠️ **`thickest` RETURNED `0` FOR A HULL WITH NO CHAIN.** It is 0306's, and it had never been wrong,
because the serpent is the only boss that had an entrance and it has a body. The fish is the first hull
with an entrance and no chain, so *how much of the animal has to be past the edge before the arrival
takes over* resolved to nothing at all — and then to `radius` 15, which is the **hurtbox** and is
deliberately smaller than the drawing (`src/content/sprites.ts`: the picture is 42 units across). Both
hand over with the fish still on the screen; the first by half a hull, the second by six units.

⚠️ **AND THE THING THAT CAUGHT IT WAS THE GUARD MEASURING IN THE UNITS THE PLAYER SEES** — 0027: it
asks whether the LAST POSE DRAWN is clear of the widest screen, with the sprite's own extent, rather
than whether the code agrees with `entranceLength`. It also found the second half of the same bug: the
hand-over fires on the first step at or past the length, and on that step the hull is already on
station — so the last pose anybody sees is one whole step short of it.

## What this deliberately does not do

- **It does not draw the surface.** See above: the place is `ground: null` and stays that way in this
  change. What sells the edge is the spray at the crossing and the hull vanishing below it.
- **No change to the arrival.** *"Then enter where it is now"* was 0306's reading and it holds here: the
  breach ends with the fish below the edge and off the screen, and the fight starts from station.
- **It is not in the mix dashboard's cue list.** `rig/transport.ts` models a cue as a RATE, and a breach
  is four events at the top of one fight and none after — a line there would have to state a per-second
  figure that is true of no part of the fight. `scripts/hear.mjs` plays it, first, in the nebula's boss
  take, which is the tool the question *can I hear it over the bed* is actually asked with.
- **The run-in is not a held breath, and the first draft of this decision said it was.** The fish's
  centre is ON the edge for the second before its first leap, so its far half is off the screen and its
  near half is a back cutting along the bottom of the lane. That is a better tell than an empty second
  and it cost nothing, but it is what the code does rather than what was designed — the two alternatives
  (a straight line at an authored depth, and the first parabola run backwards) are costed in
  `src/app/frame.ts` beside it.
