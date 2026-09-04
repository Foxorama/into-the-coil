# 0223 — A place has a palette, not a colour

**Accepted 2026-09-04.**

> *"we need a brighter mix of colours and constraints, the backgrounds are looking good, but they're
> still a solo colour.*
>
> *saurian is green, nebula is purple.*
>
> *give me vibrant living levels, not static basic backdrops"*

## The rule

**A place has two gas colours: `nebula` is its body and `glow` is its accent.** Every *lit* mark in a
place is drawn in the accent; a third of its clouds take it too.

## ⚠️ It was a description of the code, not an impression

Every cloud, crest, rim, wall face and lit edge in a place came out of `THEMES[theme].nebula` — **one
hex**. So a place could be thicker or thinner, busier or emptier, denser or sparser, and never
**varied**. [0220](0220-a-place-is-somewhere-you-are.md), [0221](0221-a-planet-is-not-a-space.md) and
[0222](0222-the-background-is-not-black.md) each added structure to places that were monochrome by
construction, which is why three passes of *more detail* never once answered *more colour*.

## ⚠️ A different hue, not a lighter shade — and that distinction is the whole report

A tint of the body reads as *the same place, brighter*, which is what every place already was: a cloud
at 0.2 alpha and one at 0.4 are one hue at two weights. Two hues read as **two things happening at
once**. `tests/places.test.ts` holds the separation as an **angle**, because *a bit different* is not a
claim.

| place | body | accent | apart |
|---|---|---|---|
| The Approach | slate blue | teal | 37° |
| Ember Nebula | maroon | ember orange | 65° |
| Saurian Belt | dusty blue-grey | gold | 172° |
| The Labyrinth | violet | magenta | 45° |
| Rime Shelf | steel | aurora green | 41° |
| The Toxic Mire | olive | acid green | 38° |
| The Black Heart | deep red | cold accretion blue | 127° |

⚠️ **AND *"saurian is green"* WAS FIXED BY MOVING THE BODY, NOT THE ACCENT.** Its haze was olive and its
natural accent is a gold sunset — 24° apart, which the guard refused and which is correct: **olive and
gold are the same colour at two weights.** The haze is a dusty blue-grey now, so the place is a blue
sky, a grey haze and a gold light on every ridge.

⚠️ **THE VIVID PALETTE ONLY.** High contrast is *"maximum separation on the luminance channel, which is
the one that survives every kind of colour blindness"* — it is desaturated **by design**, and its hue
angles are numerically unstable near grey. Demanding hue variety there demands the one thing that
palette exists to give up. It is held on **luminance** instead, which is the same claim on the channel
that palette actually uses.

## ⚠️ Per cloud, because that is the only version that mixes

Two colours split by *layer* gives two flat sheets. Split per cloud they **overlap**, and where a body
cloud crosses an accent one the gradient between them is a third colour neither table contains. That is
what a real nebula is, and it costs one boolean.

⚠️ **AND WALKED RATHER THAN ROLLED, BECAUSE A ROLL CAN COME UP EMPTY.** The first version was
`rng.range(0, 1) < 0.34` and **Saurian Belt drew none at all** — it carries five clouds, and a third of
five is a coin that can miss five times. Every third cloud takes it now, so a field of two has one and
a field of twenty has seven, and no place can be unlucky. `makeMotes` walks its index for the same
reason.

## ⚠️ Most of the colour lands on the edges, and that is one line

`paintStructure` draws a lit mark in the accent. Every lit thing in a place is an **edge** — a crest on
a skyline, a rim on a hulk, the inner face of a corridor wall — so one line puts the second colour on
the outline of everything the place is made of. A cloud in the accent is a patch of hue *somewhere*; an
edge in it is hue **wherever the eye is already looking**.

⚠️ **AND THE GROUND'S CRESTS MOVED WITH IT.** They were lit in the place's `sky`, which is true — a
skyline is the sky showing over the edge of the rock — and is also **one colour touching itself**: the
bench showed a blue range under a blue sky with a blue rim. Lit in the accent, a ridge is the *sun* on
it and three colours are on screen at once.

## ⚠️ The floor is measured against whichever of the two is louder

Every lit mark is now drawn in the accent, which is the brighter one by design. Blending the backdrop
against the body alone measures the half of the sky that is cheaper — **0222's own finding about
`cloudCover` arriving one field later**, and a measurement that understates is invisible to everything
built on it.

Three accents were authored too bright and pulled back by that measurement before anything was drawn:

| | first choice | shipped | why |
|---|---|---|---|
| Saurian Belt | `#d8a04a` | `#a87c2e` | 2.78:1 |
| The Labyrinth | `#48c8d8` | `#b45ac0` | 2.06:1, and it matched The Approach's |
| Rime Shelf | `#7ce8c0` | `#3d8f78` | 2.30:1 |

Every place clears the floor; the tightest is Rime Shelf at **3.29:1**, 1.10×.

## What is held

| claim | how |
|---|---|
| a place's accent is a different hue from its body | `tests/places.test.ts`, as an angle |
| high contrast still has two tones | same, on luminance |
| the clouds actually mix | same, off `nebulaField` |
| no two places share an accent | same |
| the floor is measured against the louder colour | `tests/sky.test.ts` |

## What is owed

- **The landmark still takes the place's body colour.** The Pillars are gas, so that is right for them;
  a volcano is not, and Saurian's is the next piece of work. `bakeLandmark` is handed `clouds`, and
  whether it should be handed the accent is a question that volcano will answer.
- **`skyRush` and the two star fields are still palette-coloured, not place-coloured.** They are the
  one part of the sky that has never belonged to a place — 0195 gave places their own *fields*, not
  their own *inks* — and a starfield tinted by its place is a further step in exactly this direction.
- **The Approach's accent is the narrowest step of the seven at 37°**, on purpose: it is the baseline
  every other place deviates from and 0211's *"a busy sky here would spend the contrast between
  ordinary space and everywhere after it"* applies to colour as much as to marks.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0223` — four breaks, four guards red. Two probes belonging to other
decisions were re-anchored: 0196, whose gradient anchor now names which of the two colours sits at stop
zero — **how many stops there are is untouched, which is the whole of that break** — and 0221, by
`drawShelf` taking the accent.

⚠️ **AND ONE OF THIS DECISION'S OWN PROBES CAME BACK STILL GREEN.** It brightened The Black Heart's
accent to near-white: that place sits at 1.61× the floor and carries 0.24 cover, so it can afford
almost any colour. Rime Shelf at 1.10× is the one an accent can actually overspend — **the break has to
be aimed at the place with the least room, not at the one whose colour changed most.**
