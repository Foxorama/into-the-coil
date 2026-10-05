# 0534 — The frost reaches across

**Accepted 2026-10-05.** Two play reports on the Rime Shelf's fight, one change each. The colour is a
change to the `frost` ink — every place it is drawn — and **neither an amendment to
[0295](0295-a-ranking-guard-is-a-content-limiter.md) nor to the Rime Shelf's row**; the reach puts a
place at the far end of a bolt's fuse, which [0371](0371-the-ice-is-staggered.md) made a range in steps.
Keeps [0482](0482-the-frost-is-a-cloud.md)'s second between bursts and 0371's *never two at once*.

## The ask

> *"the blue of the bullets is hard to distinguish from the background on all the frost projectiles they
> probably need some teal or other contrasting colours"*

> *"the boss shattering frost attacks don't go far enough now that we've changed the zoom levels on the
> display of the screen - the frost attacks need to account for different resolutions and travel and
> explode randomly from just in front of the boss to the far side of the screen -> the intent is to give
> the player room to dodge and move, but to make the player have to dodge and move and make the player
> have to fly into the slowing aura."*

## 1. The colour

### Whose colour it is

0295 has two sentences about colour, and they are about different things. *A hostile bullet takes its
place's colour* is the raiders' shot — on the Rime Shelf that is `foe.shot` in `src/content/themes.ts`,
an ember, and nobody reported it. *A flame is the same red everywhere* is a **meaning** ink, hard
because of what it means rather than where it is: fire is fire in every place. `frost` is the same kind
of ink — `src/content/palette.ts` calls it *this will slow you*, the hailstone is drawn in it *wherever
it is* (0473), and the hydra's frost head throws the frost ship's own shard in the Mire. So the answer
is not a Rime colour for the frost, which would make the Mire's frost a different colour from the Rime
Shelf's and teach the player something untrue. It is a different value for the one frost ink, which is
0295's own worked example with the word *fire* replaced. Nothing in 0295 changes.

### What was wrong, on the picture

Every hex floor was green: `#5ef0ff` clears 3:1 against every place's backdrop with the sky counted
(`tests/sky.test.ts`), and against the Rime Shelf's void it is about 8:1. The picture is another
matter. Measured with a scratch instrument that bakes the real sprite with `drawKind`, lays it
source-over — the way a blit lays it — on 700 patches of a photograph of the fight at 1280×720, and
reads the pixels: luminance ratio of the sprite's body against its ground, and CIEDE2000 between them,
at the worst twentieth of patches and the median.

| sprite | before: ratio p5 · ΔE p5 · ΔE median | after: ratio p5 · ΔE p5 · ΔE median |
|---|---|---|
| the shard that bursts | 3.29 · 30.2 · 36.8 | 3.47 · 34.9 · 42.2 |
| the icicle that melts | **2.69** · 27.3 · 33.5 | 3.13 · 34.3 · 41.7 |
| the raider's hailstone | 3.85 · 35.1 · 44.4 | 4.06 · 40.3 · 49.5 |

The Rime Shelf is steel-blue sky over aqua ice, and the cyan sat **four degrees of hue** from the ice
and nineteen from the sky: only lightness told it apart, and the icicle — six of every snowflake, the
most numerous frost on the screen — has a shadowed belly that took it **under the game's own 3:1 floor**
at its worst twentieth. The cyan was also ten ΔE from the player's own hull ink (`#7ae7ff`, five degrees
of hue): the threat and the ship were nearly one colour.

### What changed

**`frost` is `#40ffd0`**, a teal at hue 165: 25° off the ice, 39° off the sky, and 44 ΔE from the
player's hull. **The icicle's belly is a fifth down rather than a third** — at a third it was the half
of the icicle the ground swallowed; ink alone took it to 2.80, the lift to 3.13. Teal was the play's
word and the instrument agreed with it: a sea-green (`#4dffb0`) scored a little higher on ΔE and a
little lower on ratio, and the brighter pales gained ratio by losing hue, which is the channel that was
missing.

**The cold follows the ink, as 0399 wrote it**: every mark in the aura is the frost's ink taken most of
the way to white, at under three tenths, so the aura is now a pale mint-white haze over the same field
of flakes, apart from the bullets by saturation and opacity exactly as it was. The player's shots are
amber and the Rime Shelf's raiders throw embers, neither near teal.

**What it moved elsewhere.** On the Toxic Mire, where the hydra throws the same shard, the instrument
reads the same within noise (ratio up from 6.4 to 6.7 at the worst twentieth, ΔE down 1.4). Teal is
nearer `pickup`'s pale mint than the cyan was by three ΔE (41 → 38); a pickup is a large glyph and a
frost shard a small star, and this is named rather than guarded. The high-contrast palette keeps its
pure cyan on its near-black ground, where the report does not apply.

## 2. The reach

### Why it fell short, and why it was the zoom

A shard bursts into three bolts just in front of the hull; each bolt burned a fuse of **60 to 72
steps** and opened into a snowflake. A fuse in steps is a distance **from the thrower**. 0364 moved
every boss station a fifth further from the player — the frost ship from about 131 to 157 — and moved no
fuse, so every snowflake moved 26 units further from where the player stands. Measured, driving both
frost fights through the real frame for thirty seconds a phase, in shares of a 16:9 screen from its
trailing edge (the player's end):

| | snowflakes open, before | after |
|---|---|---|
| frost ship, Legendary | 39% – 60%, a tenth nearer than 40–42% | 5% – 60%, a tenth nearer than 12–14% |
| frost ship, Savior | 29% – 55%, a tenth nearer than 31–35% | 5% – 56%, a tenth nearer than 10–14% |
| frost ship, Burn | 18% – 50%, a tenth nearer than 23–25% | 5% – 51%, a tenth nearer than 9–12% |
| hydra's frost head, Savior | 20% – 30% | 5% – 28% |

Ranges over the three phases that throw shards; the split itself stays where it was, 53–69% of the
screen over every tier, against a hull at 74%.

The ship's box begins at 5%. Before, a ship parked in the back three tenths of the screen at Savior was
never asked anything by the frost; the cold's 0484 corners and the back of the screen were one safe
place.

### The rule

**A bolt's fuse rolls from a second to the far side of the screen.** `Fuse.most` may be `'far'`: the
steps this shot takes, on its own heading, to reach the near edge of the ship's box or to leave the
lane, whichever is sooner — worked out on the step the fuse is lit (`stepsToFar` in `src/app/frame.ts`).
The roll is between the row's `least` and that, so the snowflakes are strewn evenly along each bolt's
path from 0482's one second out to the player's end, and a shard's three bolts roll three different
lengths: one shard is three clouds from the middle of the screen to its back.

In player units at Savior: a bolt flies at 0.86 units a step, so the far ring opens up to 2.3 s after
the split, 2.8 s after the shard leaves the hull — time on the screen, and so time to read it.

### Every device, and why neither view is the answer

The ask says *account for different resolutions*, and [0023](0023-the-long-axis-is-the-scroll-axis.md)
asks whether a place is set against the widest view or the current one. **Here it is neither, because
the far side is the trailing edge.** Lookahead varies only at the leading edge, where things enter; the
camera's trailing edge, where the player stands, is the same world position on a phone, a 16:9 monitor
and a 21:9 one, and so is the station the hull keeps from it. Both ends of the roll are fixed against
that edge — the hull's front and the ship's box — so the fight is identical on every device without
reading the device at all. The fuse was never wrong because of a resolution; it was wrong because it was
anchored to the thrower, and it is now anchored to the place it was always meant to reach.

### Why the bolt and not the shard

The ask reads as *the shard travels a random distance and explodes*, and that was costed first. It
breaks 0371: the shard's first fuse is held narrower than the stagger precisely so that two shards of a
volley never open on one step, and a shard that may fly anywhere opens beside one thrown half a second
later. Putting the reach on the bolt keeps the burst *just in front of the boss* — the shard's split,
unchanged — keeps 0371's moment, keeps 0482's second, and still strews the snowflakes to the far side.

### The stream

The roll is on the frame's fuse stream, which 0371 gave the fuse alone; the far side only changes the
top of a range the stream was already rolling, one draw a stage as before, so no other stream moves
(0021). It is not a boss's stream because `fissionShots` does not know, and should not, which hull threw
a shard — the hydra's head throws the same one.

### What shares the screen — 0295's *consider*

- **The cold.** It pulses to 130 units every ten seconds; 0484 left the back corners as the escape.
  Snowflakes now reach those corners, so the escape is sometimes taken away and the way out is forward —
  which is the *fly into the slowing aura* the play asked for.
- **The route.** The flakes are the same in number and twice as spread: the band they fell in was a
  quarter of the screen and is now half of it, so the density at any place is roughly halved. Each cloud
  is still a fifth of the lane at most (0482's guard). What is lost is the one place with none.
- **The adds.** The third phase calls shards from the sides; its own volleys throw no frost, and an add's
  shatter is where it dies, untouched.
- **The pool.** A bolt now lives up to twice as long. `the frost never fills the pool` was driven through
  the widest spray at the capped fan and passed.
- **The hydra.** Its frost moves from a fifth-to-three-tenths band to the back quarter. It throws the same
  shard by design (0371: *on the bullet and not on the boss*), so this is the ask applied where the shard
  is; it is named so it can be vetoed, and the knob for that would be a fuse on a boss, which is a
  decision of its own.

## Guards

**Added — `THE REACH, DRIVEN`** in `tests/frost.test.ts`, in units the player experiences: both frost
fights, every phase that throws a shard, every tier, thirty seconds each — at least a tenth of the
snowflakes open in the back fifth of the narrowest screen, and none behind the ship's box. Read red on
the old fuse: *0 of 89 snowflakes opened in the back fifth* at the frost ship's first phase. Three
probes in `scripts/probes/0534-the-frost-reaches-across.mjs`: the old fuse, the far side read as the
trailing edge, and the lane forgotten.

**Changed, and why — 0192.** `THE FISSION, DRIVEN` held the snowflake in the near half of the screen at
both ends of the fuse; that was 0263's *the second fuse puts the snowflake in the player's half*, and
the play has now asked for the far side. It holds the near half at the shortest fuse, and at the longest
holds that a ring opens at the far side, on the lane and not behind the box. Its pin and 0482's are
resolved against each bolt's own far side. Seven probe anchors in 0263, 0371 and 0482 followed the
row's literal and `fuseFor`'s signature; each says so where it is.

**No pixel guard for the colour.** The hex floor is `tests/sky.test.ts`'s and still holds; the pixel
measure above is a photograph instrument, not a test. If the frost is reported hard to see again, the
owed guard is a browser test that bakes the frost sprites and reads them over a photographed Rime
Shelf, on 0470's model.

## What this leaves owed

**A play of the Rime Shelf's fight**, at Savior and at Burn: whether the back of the screen now asks
enough without asking too much, and whether the teal reads as frost. **A look at the hydra's frost
head**, which moved with it. The aura's shift to a mint-white is the one picture change not asked for.

No irreversible surface is touched.
