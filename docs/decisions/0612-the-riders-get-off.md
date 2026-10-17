# 0612 — The riders get off

**Accepted 2026-10-17.** Amends [0546](0546-the-marmot-rides.md) (the Thunderbolt's rider was its
outline) and [0593](0593-the-hamster-ball-rolls.md) (Unity was drawn into the ball). The fit is
[0526](0526-the-gun-is-fitted.md)'s, the intro's boarding is [0444](0444-the-intro-is-the-pilots.md)'s,
and the pad is [0540](0540-the-hangar-is-the-port.md)'s.

## The ask

> *"the marmot and least weasel are drawn as part of the vehicles, the vehicles aren't separate from the
> pilot, which affects the intro movies as well as hanging out - and the hamster ball for the least weasel
> looks more like it has a pudgy platypus inside driving it than the least weasel."*

## The rule

**The Thunderbolt and the Hamster Ball are vehicles, and whoever is aboard is drawn on them from their own
figure. With nobody aboard they are the vehicle alone. That is how the pad shows them, and how the intro
shows them until the pilot's leap lands. In the fight, and in the intro once the pilot has boarded, the
pilot rides. Unity in the ball is redrawn as a least weasel.**

| | |
|---|---|
| **the seat** | `seat` on every ship row: `astride` on the Thunderbolt, `inside` on the ball, `null` on the five whose pilot is out of sight under a canopy, a roof or a hull |
| **who is aboard** | `rider` on the fit, a `Figure` (`person`, `marmot`, `weasel`, `duck`; `figureOf` on `src/content/golfers.ts`) or `null` for nobody. `ownFit` puts the ship's own pilot (`pilotOf`) on a ship with a seat. `sameFit` compares it, because it is part of the picture |
| **the bike** | its top from the seat's back to the grip is the bike's own (`THUNDERBOLT_BARE`): the seat, the tank, the back of the bars' riser and the underside of the bars. With a rider, the hull takes in the rider's outline in its place, with the gap under the arm as a hole. That is 0546's sealed outline, so every mark on the rider is still paint on the hull. The rider is painted last, over the seat, a leg over the engine and a paw on the grip |
| **the riders** | `THUNDERBOLT_RIDERS` and `BALL_RIDERS` in `src/render/bake.ts`, a row per figure. The Marmot astride the bike and the least weasel inside the ball are drawn; every other row is `null` |
| **the pad** | the port's ship pieces (`blue`, `blueSide` and the tilt) are baked with nobody aboard (`nobodyAboard`), on every tab |
| **the intro** | a new port piece, `blueRider`: whoever is aboard, alone, in the ship's box. It is laid over the ship from the moment the leaping figure starts to fade into it (`LANDS`, the leap's last two fifths), and outside on every frame of the tilt. Only for a ship with a seat |
| **the weasel** | a long slim body three times as long as it is wide. The white of the belly shows along the chest's flanks and round the muzzle, the brown back covers the haunches, and the head is small and flat with two little round ears. Four short legs, a thin tail, and a short hi-vis vest over the shoulders. The bush hat is off |

## Why

**Every other ship already hides its pilot.** The fighter's canopy, the cars' glass and the duck's
porthole draw nobody. The intro's pilot runs out of the bar and fades into the cockpit (0444). The two
ships that drew their pilot drew them always. So the Marmot ran out of the bar and leapt onto a bike that
already had a Marmot on it, and the pad on Hangin' Out showed Unity in the ball beside Unity at their bench.
A vehicle with nobody aboard is the fix for both. A rider on top of it once the pilot has boarded keeps
what made these two ships themselves.

**Pushed back: other pilots cannot ride them, and none are drawn.** The brief said *"when another pilot
flies those ships"*. No pilot can: picking a pilot picks their ship ([0441](0441-a-pilot-flies-their-own-ship.md)),
and the run keeps the ship and not the pilot. A golfer, a duck or a weasel astride the bike, or a person or
a marmot in the ball, would be eight drawings, each with two dance poses and a broken-ball pose, for a
picture the game cannot show. So the rider is keyed on the figure, and those rows are written out as `null`.
If a pairing ever opens, the bake refuses it by name and `tests/riders.test.ts` goes red for that pilot.
That is the cost of the real thing, and it falls due only if someone asks for it.

**Baked into the fight's hull, laid on in the port.** In the fight the rider is part of the hull bake: the
fit already re-bakes a ship's six hulls and its dances, and `rider` is one more field of it. So the frame
draws nothing new and allocates nothing (0022, 0025). The port draws the ship empty on the pad. In the
intro that empty ship gets a rider, so there the rider is one more piece and one more blit, and only after
boarding.

**Measured** (the dev server, Chromium, the default palette, the pad's camera):

| | |
|---|---|
| the port's ship pieces baked again (`bakePortShip`), Marmot / Unity / Bo | 3.3 / 2.6 / 3.0 ms |
| of which the `blueRider` piece | 0.085 / 0.080 / 0 ms |
| the fight's frame | no new blit, no new sprite |
| the intro's frame | one more blit, from the leap's landing on, on a ship with a seat |

**The ball's plastic lies under the rider in the port and over them in the fight.** The layer is laid on
the finished ball. The difference is the plastic's tint at 0.12 alpha, and the speed stripes or sunflower
where they cross the weasel. It was accepted rather than splitting the ball into two pieces.

**The weasel was a platypus because of three things.** The bush hat seen from above is a round brim out in
front of the head, which is a bill. The body was a fat oval with a hi-vis band across all of it. The feet
were round and splayed. A least weasel from above is the tube it is from the side.

## Rollback

⚠️ **None owed** — [0001](0001-revertability-not-risk-rating.md). Nothing saved changes. `rider` is
worked out from the ship every time and never stored. A new port piece is baked on every load.

## What guards it

`tests/riders.test.ts`, in CSS pixels of a 1280×720 screen where it is a picture:

- every pilot whose ship shows them has a drawing aboard it, and `ownFit` carries the ship's own pilot
- the Thunderbolt with nobody aboard shows no rider: the Marmot is at least 15% of the ridden bike's
  square pixels, less than 2 px² of the bare bike lie outside the ridden one, and the port's layer is
  within 10% of the space he takes on the hull
- the empty ball has no solid paint in its middle, and with Unity aboard it has more than 20 px²
- the pad lays no rider on any ship
- the intro lays no rider before the leap, and lays one after it on a ship with a seat and never on one
  without

Each has a break in `scripts/probes/0612-the-riders-get-off.mjs`. `tests/intro.test.ts`'s *every piece of
the port is drawn* now flies every ship's intro, so `blueRider` is seen. `tests/accents.test.ts` holds the
new weasel and the split bike to the hull and the floor as before. It refused the weasel's first paws at
2.46 px, so they were made bigger.

The port's bitmaps themselves, with nobody aboard on the pad, are photographed and not guarded. Baking
needs a canvas, and the node suites have none.

## Owed

- **A look on the deployed build**, at the shipped camera: the empty bike and ball on Hangin' Out, and the
  Marmot and Unity boarding in the intro.
- **Two vetoes for the player.** Whether the pad should show the pilot sitting on their bike or in their
  ball after all. And whether Unity's bush hat should come back in the ball, perhaps hung on their back.
- **The pilot card and the hangar's look thumbnails** still show each ship with its own pilot aboard,
  since that card is the pilot's own. Say if those should be empty too.
