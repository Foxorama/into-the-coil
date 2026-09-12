# 0309 — The serpent rears back

**At its lightning phase the animal stands off, stops lunging, and bows its neck — and the skull turns
with it.** A phase may carry a `Rear`; nothing else in the game does.

## What was asked

> *"2. at the lightning phase, the serpent needs to rear back with it's head and upper body, keeping
> the rest of it's body off screen"*

## The second half of that sentence is already true, and it is what decided the first

⚠️ **MEASURED BEFORE ANYTHING WAS BUILT.** On the narrowest view the clamp allows (16:9, 177.8 world
units), at the far end of the bob:

| | |
|---|---|
| the head sits | 111.0 – 149.0 from the camera's trailing edge |
| the body reaches | 134.2 behind the head |
| the tail is at | 245.2 – 283.2 — off the leading edge on **every** device |
| nodes on the narrowest screen | the head plus **5 of 26** |
| body visible, worst case | **25.2 world units** of 134 |

So *keeping the rest of its body off screen* is not a thing to arrange. It is a constraint, and it says
the rear happens **in the neck**, because the neck is all there is to look at. A posture spanning the
36 units the first sketch assumed would have been half off-screen on a 16:9 panel.

## What it is

`Rear` on the phase: `{ stand, lunge, arch, span }`, and the serpent's last third authors
`{ stand: 10, lunge: 0.3, arch: 6, span: 44 }`.

### The withdrawal is two terms, and one alone is not a rear

`stand` moves the station; `lunge` scales 0289's strike. Both are terms of **the station**, in
`stepBoss`, because that file's own rule is that the station is the one place a hull's lane position is
decided — 0061's and 0101's six assertions only mean what they say while that holds.

**Why both**: 0101 measures a boss at the NEAR end of its swing (`station − drift − rear − radius`) and
the leading edge measures it at the far end. Standing back moves both; not lunging moves only the near
one. Driven, with the ship crossing the lane so the gaze commits each way:

| | phase two | the lightning phase |
|---|---|---|
| closest approach | 114.3 | **133.1** |
| furthest | 146.6 | 146.1 |
| 0101's quantity | 60% of the screen | **70%** |
| drawn skull's leading edge | 164.1 | 165.1 of 177.8 |

Nearly **nineteen units of room** bought in the hardest phase of the fight, with the head no further
toward the leading edge than it already was.

### The bow is bounded by the animal's own spine, and the first numbers were refused

0283's bend rule — *no turn tighter than 1.5 of the local girth* — caps a half-sine of `span` at about
`span² / 163` world units of `arch`, and the sway is already spending part of that budget.

⚠️ **`{ arch: 6, span: 34 }` WAS AUTHORED FIRST AND MEASURED 1.39**, which the rule refuses. The bend
goes as `span² / arch`, so **the span bought it back rather than the amplitude** — the bow is the same
six units and runs over forty-four. Driven through the whole reared phase: **1.85**, against **2.50** in
the phases that do not rear. So this posture is the tightest the animal ever gets, which is what a rear
should be, and `tests/serpent.test.ts` now drives the bend guard through the reared phase as well as the
whole one. It would have caught the 1.39.

### Which way it bows is the gaze, and the gaze is already smoothed

The neck bows **away from the side the head is looking**: the animal cocks its head toward the ship and
coils the other way. `bossGazeSide` is 0285's committed gaze — it changes only once the ship is a head's
width clear of the head's own centreline, expressly so that a jaw armed off it does not chatter — so the
posture turns when the player has actually gone somewhere rather than several times a second.

⚠️ **AND IT EASES, WHICH IS THE ONE PIECE OF STATE THIS DECISION ADDS.** The side is a discrete ±1 that
flips in one step; the crest is six units off the spine, so a body following it directly would cross
twelve units in a sixtieth of a second — through its own middle, carrying twenty-six hurtboxes and
twenty-seven aura flames. `bossBow` walks at 0.05 a step, about a third of a second to come over.

### The skull turns, and the turn is derived

⚠️ **THIS IS WHAT ACTUALLY MAKES IT READ AS REARED.** Six units of bow is half a body-width on a
hundred-unit lane — real, and quiet. The skull is the widest sprite in the game and the thing the player
watches; at **23 degrees** it is unmistakable.

⚠️ **AND IT IS ARITHMETIC RATHER THAN A FIELD, FOR A REASON 0284 PAID FOR.** The bow is a half-sine, so
its slope at the skull is `arch × π / span`; the head's heading is down-lane tilted by the arctangent of
that. 0284 closed a *"slight gap between head and body"* by measuring the first node against the skull's
back edge — and a head turned by a hand while its body left it straight would re-open exactly that on one
side, by `10.8 × sin(turn)` units. **A head that turns with its own neck cannot.** The guard asserts the
agreement, not the number.

## Why `rear` is optional where `look`, `shot` and `attack` are required

Those three are required with an explicit `null` because a phase without one is a decision somebody did
not make. This is
[0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md)'s default shape instead — *"no
row can forget it" is an argument for a DEFAULT, never for a CONSTANT* — and the reason is measured
rather than aesthetic: adding a field to every phase line in `src/content/bosses.ts` would re-anchor the
probes of 0040, 0124, 0248, 0254, 0261 and 0304, every one of which `find`s a whole phase line. A
required field reading `null` forty-odd times buys nothing and spends six probes.

The guard that covers the cost is the last one in the block: **nothing about the phases that do not rear
has changed** — no turn, no bow, and the unreared swing is still the row's own station to within the
station tracker's 2.4-unit lag.

## What is owed

- **The picture.** [0027](0027-measure-the-picture-not-the-model.md): every number above is a model
  quantity. `scripts/shot-sheet.mjs` photographs sprites and not postures, so the reared animal wants
  the bench treatment — a Playwright shot at the shipped camera, at 20% health, with the ship on each
  side.
- **A play-test.** Whether 23 degrees and six units read as *reared* or as *slightly bent* is an eye's
  question. The two numbers are one line of content and the bend guard says how much room is left above
  them: at this span, `arch` may reach about 7.4 before 1.5 is met.
