# 0340 — The Coil is a route, and the ship burns along it

**Accepted 2026-09-20.** **Answers [0042](0042-a-run-is-a-sequence-of-levels.md)**'s deferred chart
and `SCREENS.cleared`'s six-week-old note *"this is where the chart will eventually go"*. **Extends
[0063](0063-a-level-break-is-a-respite.md)**, which is untouched: the respite is still three seconds of
a world that never stopped, and the crossing comes after it **on 0063's own terms**. **Extends
[0331](0331-the-heart-beats-under-it.md)** — the bake it starts is the thing the burn holds for.
**Third entry under [0070](0070-a-style-is-a-setting-and-the-first-one.md)**'s settings mechanism.
**Fixes a defect in [0107](0107-a-level-is-a-place.md)**'s backdrop that had been reported without
being located.

## The ask, and then the ask again

> *"We'll need loading screens anyway for transitions and to represent moving through the galaxy."*

Built first as **a full-screen chart**: the world stopped, the Coil drawn over the whole canvas in
place of it, the ship as a marker on the route, the next place's name, and an *Onward* button. It
passed thirteen assertions and ten probes, was photographed, and was played:

> *"Alright we have a level transition screen, but it takes the player out of the game. We need a much
> smoother transition where the player's engines do a full jet burn and the ship hyper-speeds through
> galaxy for the loading screen and then the hyper burn trails off as they arrive at the new level.
> The built loading screen is fine, but it's completely out of place when the fight goes → boss death
> → starfield → animation → button click required to move onward."*

And of the button, which auto-forwarded and did not need pressing: *"it felt like a button click was
needed, which is the same thing."*

## What that first build got wrong, and it was written down before it was built

⚠️ **THIS DECISION'S FIRST DRAFT NAMED THE TENSION AND THEN ARGUED ITS WAY PAST IT.** It said, in as
many words, that [0063](0063-a-level-break-is-a-respite.md) exists because a screen between two levels
that stops the world *"interrupts the flow"*, and [0076](0076-a-level-has-an-origin.md) because one
that resets the scene is *"disjointing"* — and then answered both with *it is a curtain, not a reset*:
`steps: false`, so nothing behind it moves and the ship is where the player left it when it lifts.

That was true and was not an answer. **0063 was never about where the ship ended up. It was about the
player being taken out of the game**, and a curtain is that by construction. The play-test said so in
the same words the original report used, eleven weeks apart.

⚠️ **THE TRANSFERABLE HALF: A TENSION WITH A LANDED PLAY REPORT IS NOT DISCHARGED BY AN ARGUMENT.** An
argument shows the new thing differs from the old thing in some respect; the report was about a
different respect. What discharges it is the design having the property the report asked for — here,
that the world keeps running and the player keeps the ship — and the row now states exactly that.

## What is built

**The crossing is a thing the ship does, in the world it was already flying in.** `travel` is
`steps: true`, `dims: false` and has no actions: it is `cleared`'s pair, the game with words over it.

| | |
|---|---|
| the burn | one number, `World.warp`, nought to one and back: a second to build, held, a second and a half to trail off |
| what reads it | the camera's scroll rate (×12 at full), the engine's flame (×2.8, root held on the tail), the streaks in the sky |
| how long | 2.5 s before it may trail off **and** until the next place's material is in the mixer's hands — 4 s in all when nothing is waited for |
| the ceiling | twenty seconds, after which the ship arrives and the music does when it does |
| the place | swapped at full burn, under the streaks |
| the level | entered on **arrival**, not at the start |
| the words | a banner at the top: the chart as an inset, the place, its own line; fades in with the burn and out with it; takes no pointer |
| the knob | *Travel: Scene / Brief* — one number, the floor |

## One number, read three times

`warpAt(steps, landingAt)` in `src/content/travel.ts` is the whole of the burn, and everything the
player sees is it being read by something that already existed. So the three cannot disagree about
whether the ship is at speed — which is
[0036](0036-an-event-the-model-knows-about-the-picture-mentions.md) prevented by there being nothing
to keep in step.

⚠️ **AND THE FRAME IS HANDED THE NUMBER AND NEVER LEARNS WHERE IT CAME FROM.** How long the burn lasts
is a row with a comfort setting on it, which `src/app/frame.ts` may never see
([0024](0024-the-accessibility-floor-is-settings.md)). What the engine DOES at full burn is no
setting, so `WARP_SCROLL` and `WARP_FLAME` live in `src/content/exhaust.ts`, which the frame already
reads. `tests/travel.test.ts` holds the ban over the import graph, with `src/render/scene.ts` on the
list — the painter draws the streaks and the frame imports the painter, and a transitive route to a
setting is a route.

## A streak is a bolt

[0233](0233-a-weapon-is-a-kind-and-a-pickup-cycles.md) put `bolt` on the surface for *"a shape not
known until the frame it is drawn on, which is the one thing a bake cannot hold"* — and a streak's
length IS the ship's speed on this frame. Baked, it would be a tile of lines at one length, arriving
and leaving as a swap; stroked, it grows out of a point as the engines build and shrinks back into one
as they trail off, which is the whole of what *trails off* means.

It costs nothing on any frame of any level: `warp` is nought outside a crossing and `paintWarp`
returns on its first line. Inside one the field is empty by construction.

⚠️ **THE FIRST WIDTH WAS LOOKED AT AND WAS WRONG.** A bolt is four strokes and its widest — the flash,
[0238](0238-the-picture-answers-the-second-play-test.md) — is fourteen times its core, so a two-pixel
core is a capsule twenty-eight pixels fat and the sky at speed was a screen of pills. Under a pixel of
core, the flash is a soft edge to a line.

## The flame swells, and its root stays on the tail

A `warp` row in `THRUST` would be six more bitmaps differing from `burn`'s only in length, arriving
and leaving as a switch. `Entity.swell` is the painter's one size channel
([0283](0283-the-serpent-is-a-chain.md)) and is continuous, so the flame builds with the burn and trails
off with it.

⚠️ **THE OFFSET IS NOT A MULTIPLE OF ITSELF.** `trail` is to the sprite's centre and the flame's root
is at its forward edge. A blit scales about the centre, so a swollen flame on the old offset starts
inside the hull, and one on `trail × swell` opens a gap that widens as the burn builds. What is held
still is the root: the centre goes back by half the extent times how much it grew.

## The ship was being left behind by its own camera, and a guard found it

⚠️ **AT FULL BURN THE SHIP SLID TWENTY-SIX UNITS DOWN THE SCREEN, TO THE REAR WALL OF ITS BOX, AND
LURCHED THE SAME DISTANCE FORWARD ON ARRIVAL.** Measured by `tests/travel.test.ts` at 13.6 against 40,
in the one assertion in the file written in screen units — *where the ship is on the screen must not
care how fast the camera is going* ([0027](0027-measure-the-picture-not-the-model.md)).

`flyShip` lags the ship's velocity towards `scroll + ask` with its mass
([0037](0037-the-ship-has-mass.md)), and its own note says lagging only the departure is
*"algebraically the same expression… written and reverted."* **That is true of a constant scroll, and
was written when the scroll was one.** A scroll that accelerates is a camera leaving the ship behind by
the change in rate times the lag — `(1 − r) / r` is four steps, and a burn is 6.6 units a step of
change.

**The camera's acceleration belongs to everything in its frame**, which is the whole of *every speed
is in the camera's frame* ([0023](0023-the-long-axis-is-the-scroll-axis.md),
[0034](0034-a-threat-is-absolute-and-a-pool-is-the-pairing.md)). The frame hands the ship the change in
rate on the step it happens, so the mass acts on the one thing it was ever about: the player's ask.
⚠️ A room closing ([0335](0335-the-fight-happens-in-a-room.md)) is the other changing scroll and
drifted the ship a couple of units for the same reason; that goes too.

## The level is entered on arrival

`lifecycle.onward` used to enter the next level and end on the playing screen. It raises the burn and
touches nothing now, and `arrive` enters the level — because a script entered at the START of several
seconds at twelve times the scroll rate has its opening waves, which `src/content/levels.ts` places
inside the spawn horizon on purpose, flown past before anybody could see them.

⚠️ **NEITHER VERB ADVANCES THE RUN'S LEVEL** — the boss's death did that — so a crossing cannot skip
one, which is [0339](0339-a-level-is-cleared-once.md), fixed one screen away four commits before this.
`tests/travel.test.ts` asserts it through the real verbs rather than assuming it from there.

## The place swaps at full burn, and the *starfield* was a bug

A place change re-bakes the atlas — fifty-eight bitmaps — and repaints the void. At the start of a
level that is a hitch the player sits through with nothing moving; at twelve times the scroll rate,
under forty-four bright lines, it is a change of colour behind a sky nobody can follow. So
`placeOnScreen` returns the old place until `warp` first reaches one, and the new one after — which is
the place `arrive` is about to enter, so nothing changes on the step the ship lands.

⚠️ **AND THAT FUNCTION HAD BEEN WRONG FOR SIX WEEKS.** It returned the place only on the `playing`
screen. The level break keeps the world running and does not paint over it (0063) — so on the step a
boss died, the backdrop went to the title's void and the atlas re-baked to The Approach's sky, for
exactly the three seconds the break exists to let the player look at where they are, and then both
changed again. **It was reported without being located, as one beat of a list: *"boss death →
starfield → animation."*** [0076](0076-a-level-has-an-origin.md) says a level boundary keeps the scene;
this was the scene being swapped twice at every one. `cleared` keeps its place now.

## What the burn holds for, and why it is not `bakingTheme`

0331 left three ways the next place's material can arrive: held in `ahead` and handed over on the step
the run gets there, landing from a bake still in flight, or baked from scratch because the run outran
its lookahead. `bakingTheme` and `aheadTheme` say what has been **asked for**, which is true several
seconds too early. ⚠️ **So `handOverPlace` takes the theme and writes `loadedTheme`** — the one line
all three routes pass through.

⚠️ **AND *READY* IS TRUE WHEN NOBODY IS LISTENING.** `applyMusicLevel` returns immediately with no
`AudioContext`, so no bake is ever started for a player who has not pressed anything — waiting on it
would hold the burn twenty seconds for exactly the players who cannot be told why. The sound setting
counts as nobody too: *Off* keeps the context and mutes the speaker, so the bake runs and nothing they
can hear is arriving.

## There is no press

The first build's *Onward* took the floor away and left the wait. There is no control now: the player
is flying, so every input they have already means something, and a loading screen that can be skipped
by firing the guns is one that is skipped by accident. *Brief* is the answer for a player who wants
less of it.

## The chart is an inset, and it stopped being a sprite

*"The built loading screen is fine"* — so the chart stays, as a small canvas in the banner beside the
place's name, drawn by `src/render/bake.ts`'s `drawChart` into a canvas of the chrome's own exactly as
the title screen's pickup key is. That took a sprite kind, a re-bake with a staleness memo, a second
painter, a frame wrapper and a shared-geometry argument back out of the game — all of which existed to
serve a picture that was in the wrong place.

`docs/game.md`, under *Open*: *"The chart's shape. It must read as descent toward the centre, and must
not be a copy of the star map."* The route is **a spiral that loses radius as it goes and ends at the
exact centre**, where The Black Heart is. A leg behind the run is drawn in the colour of the place it
leads to, and a leg ahead in no place's colour, which is the whole of how the picture says *these are
behind you*.

⚠️ **A STRAIGHT-LINE RADIUS WAS TRIED FIRST AND WAS WRONG.** With the angle advancing at a constant
rate the inner legs die out: the last two places came out **exactly one disc apart** — tangent, with
the destination's ring cutting through the one before it. `CHART_TIGHTEN` is 0.6.

## A row that says its words are pushed

`src/app/chrome.ts` built a panel for any row with a heading or an action, which described every screen
until one had neither: the crossing's heading is a place not known until it starts, and it has no
button on purpose. `ScreenRow.pushed` is the row saying so — a fact about the row, not a switch on its
name ([0016](0016-a-hub-enumerates-kinds.md)).

⚠️ **AND THE GUARD'S OWN COPY OF THAT CONDITION HID THE SCREEN FROM THE GUARD.** `tests/menu.test.ts`
lists which rows may show the scene through them, with a reason per entry; its predicate for *what
chrome is* did not know about `pushed`, skipped the row, and the file went green over a screen it had
not looked at. Found only because a test that should have gone red did not. It now holds a second
list, `FLIES_ON`, for the rows that keep the simulation running under words — which had been
`if (screen === 'cleared') continue`, the list with one entry and no way to read it.

## Confirmed, not assumed

Probes in `scripts/probes/0340-the-coil-is-a-route.mjs` — **sixteen, all seen red.**

⚠️ **ONE CAME BACK STILL GREEN AND WAS RIGHT TO.** It removed a `margin-top: auto` from the banner's
rule, which the shared panel rule already implies on every side — so the break broke nothing, and the
line that actually moves the panel was untouched. The redundant line was deleted and the probe
re-pointed. `src/app/mount.ts`'s screen gate states the general form: *one guarantee, one mechanism; a
redundant safety net makes the original mechanism untestable.*

⚠️ **AND ADDING `pushed` STRANDED TWO OTHER DECISIONS' PROBES** — 0063's and 0212's — whose anchors
ended on a row's last field. The harness refused to run anything until they were re-anchored, which is
what it is for.

⚠️ **THE PICTURE WAS LOOKED AT, AND A STILL CANNOT SEE A CUT.** `rig/bench.ts` takes `?cross=N` and
`scripts/shot-travel.mjs` photographs four moments of a burn read off the rule. That instrument passed
the first build. What it is good for is what a still CAN see — is the flame on the tail, do the streaks
read as depth, did the place change under them, is the banner clear of the ship — and it found the
streaks were pills. Whether the crossing feels like flying is the play-test's, and only the
play-test's.

## What this leaves owed

**None of the numbers have been played**: four seconds, *Brief*'s three, twelve times the scroll, the
flame at 2.8. 0063 says the same of its own three seconds in the same words.

**The burn is silent.** Everything outside a run plays `calm`, so what is heard is the next place's own
bed arriving under it, which is right by construction and has not been listened to. An engine cue for
the burn is the obvious missing half, and belongs to the channel the user's ear is already owed on.

**`gameOver` still returns no place**, so the atlas re-bakes to The Approach's sky behind a dim nobody
can see through and re-bakes back on *Continue*. It is the same line as the *starfield* defect and
costs a hitch rather than a picture; it was left because nothing here was looking at it.

**A branching chart is still not built**, and `docs/game.md` still describes one.
