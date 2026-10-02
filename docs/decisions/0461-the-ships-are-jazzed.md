# 0461 — The ships are jazzed

**Accepted 2026-10-02.** A play report on the four ships of
[0441](0441-a-pilot-flies-their-own-ship.md), in five asks:

> the little caddies ray gun is just a purple blob and it doesn't look cool at all, also can we have the
> missile turrets sticking out from the sides instead of weirdly placed on it? the ship space will need
> to be smaller so that the tubes on the sides don't give it too large a profile.
>
> can we make the missile tubes thematically appropriate as well?
>
> for the station wagon, can we make the hanging fuzzy dice a bit bigger and clearer and hanging from
> the center of the dashboard instead of right on the edge, and have them sway when the ship
> accelerates or stops hard.
>
> in the intro movie the player's ships seem large again, they should be about 20% smaller, if it makes
> them too much smaller than the viper ship it can be a bit smaller as well.
>
> and overall can we make the player ship's jazzed up and cooler looking, they look fine now, but they
> could be way cooler.

## The rule

| | was | is |
|---|---|---|
| **the saucer's disc** | the whole box's radius | `CADDIE_DISC`, 0.72 of it, so a pod on each side reaches no further across than the old rim |
| **its gun** | a lavender dot on a slate stub | a ray gun: a chrome barrel through two lavender rings — the rings it fires — to a white-hot emitter; the shot leaves the emitter |
| **its tubes** | two slate bars lying across its face | pearl seed-pods hung off its sides on pylons, a cyan drive ring round each and the warhead's orange in the mouth; the missiles leave the pods |
| **the cars' tubes** | slate boxes on both roofs | pods in each car's own livery: the Firebird's black lacquer banded in its phoenix's gold, the estate's burl banded in gilt |
| **the dice** | two blank squares off the plate's far end, half the size of a count | a pair on two strings from the middle of the plate's lower edge, each as big as a count and showing its pips |
| **when they move** | a four-second drift, always | the drift, and a swing back on a hard push and forward on a hard stop, settling over 1.8 s |
| **the intro's ships** | a 30-unit box (`HANGAR_SCALE`) | 24 — a fifth smaller — and the Viper 36 where she was 40 |
| **the look** | flat inks | each hull lit from above (a gradient under its livery), and each its own dressing — below |

**The dressing, per ship** ([0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md):
each authors its own, and nothing is shared but the gradient helper):

- **The fighter** — the studio's violet as a chevron down the nose (the banner runs violet into cyan,
  [0440](0440-every-screen-speaks-with-the-titles-voice.md)), a line of light down each leading edge, and its
  engines and pod muzzles glowing.
- **The saucer** — a lit rim, six dark vents with acid glowing in them, its running lights haloed, and
  a shaded dome ringed in light.
- **The Firebird** — the lacquer's sheen and a highlight down the roofline, a gold spoiler on the
  ducktail (in the outline), a chrome side pipe, deep-dish rims with chrome caps, glowing lamps, and the
  player's cyan as neon under it.
- **The estate** — burnished gilt, the flank below the glass panelled in burl with grain and a gilt
  frame (a woody, as a gilded estate should be), whitewalls, chrome bumpers, glare on the glass, a
  chrome coil on the lightning rod, and the same neon.

## Why each is the shape it is

**The disc shrank because the ask said the profile must not grow.** The pods stand off the disc on
pylons and their outer edge is 1.02 of the box's radius where the rim was 1.0; the hurtbox is the row's
`radius`, 2 units for every ship, and did not move.

**The tubes take the ship's own livery because at 56 pixels a theme is a colour.** A golf bag on the
estate's rack was drawn in the head and refused before a line was written: the turret is five pixels by
four at the shipped camera, and a bag is a violet blob there. What reads at that size is the car's own
materials on the pod, so each pod is visibly the car's — and the missile's orange stays at every
pod's front, which is the one mark that says *missile* on all four.

**The dice swing on an event, not on a per-frame transform.** The readout is written on a change and
never per frame ([0430](0430-the-readout-counts-ships-and-shields.md)'s argument), so the frame raises
`onJolt` on the step the ship's speed along the lane, in the camera's frame, changes by 0.2 a step —
a full push from rest or letting go from full speed is 0.34 — and not again that way until it has
eased below 0.06. The chrome runs a damped swing as a CSS animation, two classes a way swapped as
[0433](0433-the-readout-is-one-voice.md)'s kicks are. The burn between two places is the hardest push
the ship makes, so its lighting is one too. The idle drift is on the outer element and the swing on the
inner, so a lurch adds to the drift rather than cutting it off; a player who asked the system for less
motion gets neither.

**The saucer's intro size is over its disc.** At the box's old factors the shrunken disc came out a
third under the fifth asked for, so its row divides by `CADDIE_DISC` and the disc stands where the box
did; the intro guard measures what fills the box — the disc, on the saucer — rather than the box.

**The Viper lost a tenth because the ask allowed it and the hangar wanted it.** At 24 the fighter beside
her 40 read as a toy; at 36 she still stands a head taller than any pilot's ship, which is now held.

## What guards it

- [`tests/dice.test.ts`](../../tests/dice.test.ts), driven through the real frame with a hand on the
  stick: a hard push is one jolt back, the stop after it one forward, and a stick eased over or held is
  none.
- [`tests/mounts.test.ts`](../../tests/mounts.test.ts): the saucer's gun is the emitter drawn and its
  tubes the warheads drawn (`caddieMounts`, on `carMounts`' terms), off its sides, one each side.
- [`tests/intro.test.ts`](../../tests/intro.test.ts): every ship a fifth under
  [0450](0450-the-intro-ships-are-their-size.md)'s ceiling, the saucer's own two reductions on top,
  and every pilot's ship smaller than the Viper.
- [`tests/accents.test.ts`](../../tests/accents.test.ts) unchanged, and it found three of the first
  drafts' marks too thin or too far out — the pods' mouths, a chrome cap, and every lamp's glow past
  the bitmap's edge. Each was resized, not exempted.

Each new guard was seen red by [its probe](../../scripts/probes/0461-the-ships-are-jazzed.mjs):

| broken on purpose | went red |
|---|---|
| the jolt read and never raised | `THE ASK: a hard push swings them back once` |
| the jolt raised on any change at all | `and a stick eased over or held moves nothing` |
| the caddie's tubes put back on its disc | `AND THE SAUCER’S` |
| the hangar's box put back at 30 | `draws every pilot’s ship no bigger than the fighter was` |
| the caddie's intro left at the box's factors | the same |

**Photographed**, off the sheet at four times and in the intro at 1600×900 for the saucer, the fighter,
the estate and the Firebird; and the estate's readout at 1280×720 at rest, a quarter-second into a held
push (swung back), and a quarter-second after letting go (swung forward).

## What it does not do, and what the player may veto

- **Every dressing above is a taste**, built as far as 56 pixels lets it read. The neon under the cars
  and the Firebird's spoiler are the two loudest; either comes off in one edit.
- **The hangar's saucer carries its gun at the hangar's scale**, so beside the bar door the ray gun is
  big. That is the gun the fight draws, at the size the disc asked for.
- **The dice swing on the lane's axis only.** A climb or a dive is not a lurch the dice answer; the ask
  was accelerating and stopping.
