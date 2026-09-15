# 0327 — A shot has a path

**Accepted 2026-09-15**, the third item of
[`the-first-three-levels-asked`](../../reports/the-first-three-levels-asked-2026-09-14.md):

> *"almost all the shooting is straight patterns as well, there's no curving bullets, no patterns, no
> waves etc."*

And the answer given the same day, which is half of this decision: *"patterns only"*, and *"make sure
that we still have some straight firing bullets an enemies — if everything curves or weaves we've
over corrected."*

**Amends [0263](0263-the-frost-ship-shatters.md)**: a shot's life after the muzzle is not only what it
bursts into but how it flies. **Amends [0110](0110-an-attack-is-a-pattern.md)** by adding nothing to
the attack union: a path is the bullet's, and an attack says where it points. **Amends
[0098](0098-a-wave-plays-a-figure.md)** in two rows: the picket's spit and the spinner's flak are
their own rows now.

## What was true

Every hostile bullet in the game flew a straight line at constant speed. `spray`, `wall`, `spiral`
and `aimed` differ in where the straight lines point; the frost is the one shot with a life after the
muzzle, and it bursts into more straight lines. The report was exact, and the
[report](../../reports/the-first-three-levels-asked-2026-09-14.md) measured it as a gap in the
vocabulary rather than in the tables: nothing an author could write on a row made a bullet bend.

## The rules

**A shot row may carry a `path`, and absent is straight.** `ShotPath` in `src/content/shots.ts`, two
arms over a closed list: `arc` — a constant `turn` a step for `sweep` radians, then straight — and
`wave` — a swing of ±`amplitude` across, one wave every `wavelength` units along, the weaver's own arm
([0073](0073-an-enemy-is-a-pilot.md)) applied to a bullet. Optional on
[0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md)'s default shape: the common
case is straight on purpose.

**A path reads nothing about the ship.** *Patterns only, never homing.* An arc is a rotation of the
shot's camera-frame velocity ([0023](0023-the-long-axis-is-the-scroll-axis.md): the scroll is taken
off, the vector turned, the scroll put back — turning the world velocity bends the scroll into the
shot); a wave is a function of `along`, so two shots fired a second apart trace one curve through one
piece of world and the pattern can be drawn on a map. `bendShots` in `src/app/frame.ts`, before the
shots move, allocating nothing.

**An arc is bounded by its sweep, or it never leaves.** A constant turn is a circle, and a circle
inside the view is a bullet that orbits for ever and holds its pool slot for ever. `firePhase` on
the shot carries how far it has turned — zeroed by `reset`, read by nothing else on a shot.

**A wave replaces the across component the muzzle gave the shot**, as a weaver's weave replaces its
roam. A fan of waves would lose its fan; the picket's pair is a spray of spread zero, and what tells
its two shots apart is `spin`, the handedness the attack arm deals — a spray alternates, a wall
mirrors about its hole, a spiral curls one way. Which way a bullet bends is the volley's shape and
not a second number on the row.

**A curving bullet is its own row, never a field on a row that also flies straight** —
[0258](0258-one-pilot-a-level.md)'s rejection: a kind that does one thing in one level and another in
the next is two kinds with one name. Two rows:

| row | from | path | who throws it | why there |
|---|---|---|---|---|
| `ripple` | the spit | wave, ±6 by 40 | the picket, level one's own, a pair in opposite phase | the serpent's place throws a braid; the first bullet in the run that does not fly straight is on the body that hunts |
| `curl` | the flak | arc, 0.05 a step for π | the spinner, ring of three | 0110 made it *the first body whose threat is a shape*; the shape is in the air now |

Each keeps its parent's speed and 0.9 hurtbox, so the path is the whole of what changed. Both wear
the place's ink ([0296](0296-a-bullet-belongs-to-its-place.md)); a lozenge across the lane and a
crescent open the way it bends, told from the square and the slab on the sheet.

**Most of what the levels send still flies straight**, held as a majority in
`tests/shot-path.test.ts` — the over-correction the answer named is a guard, not a hope. The levels
send five kinds of bullet and two of them bend; the probe that gives the lance a wave makes it three
of five and the guard goes red.

## The figures

Driven through the real frame, the ship parked and its guns off:

| | authored | measured |
|---|---|---|
| a ripple's swing across the lane | ±6 | 12.0 units side to side, a tenth of the lane |
| its lateral peak | — | 0.75 units a step, under half the ship's 1.7 |
| the pair, apart at most | 4 × 6 | 23.2 units, a quarter of the lane — see below |
| a curl's turn | π | 3.10 rad, then a heading constant to the step |
| a curl's circle | 40 across | `speed / turn` = 20 radius, under half the lane |
| a curl's time on the field | — | 2.5 to 4.4 s, then gone |

⚠️ **The pair reaches four amplitudes and not two, and the guard's first draft said two.** The path
is `across₀ + A·(sin k·along − sin k·along₀)`: a swing of ±A about a centre the spawn phase displaces
by up to another A — the algebra the weaver's row already carries and the lane check in
`tests/level.test.ts` already pays for. Two shots in opposite phase are up to 4A apart, the drive
measured 23.2 against a bound of 13, and the bound moved to the picture rather than the picture to
the bound. The row's comment had made the same claim and says the true number now.

`scripts/weigh-bullets.mjs` is unchanged to the point in every level: two rows moved and neither
throws more, later or faster. **Consider the screen**, asked of each: a braid reaches a quarter of a
hundred-unit lane at its widest and each strand moves slower than the ship, so it is a thing to stand
beside; a curl's ring is a forty-unit disc round a body that holds station, and the spinner is three
bodies in level two and a dozen in level five.

## ⚠️ What was rejected

**A homing hostile bullet.** An aimed shot that keeps aiming; 0258 says where aiming lives.

**A path on the moth's aimed lance.** The nebula's pilot aims; a dart that is aimed and then bends
inverts 0110's lesson — *move* stops being the answer — and reads as unfair rather than as a pattern.
Level two's curve is the queue's sixth item, on a body of its own.

**A wave that adds to the fan rather than replacing it.** It needs the base across velocity kept on
the entity, a field for one row's sake; and a fan of snakes is a wall with a wobble. The braid is the
better picture and costs nothing.

**A shorter or a longer sweep.** Longer and the ring's arms cross their own tails; shorter and a
curl reads as a kink. Half a turn, and the play owns it.

## What is owed

- **A play.** Whether a braid reads as a braid at the spit's size; whether the spinner's pinwheel
  reads as a pattern to time or as noise; whether a crescent reads as *this one bends*.
- **The curl in levels five to seven**, which the report called good: a dozen spinners in the
  batteries now throw rings that curl. Nothing else there moves.
- **The queue's fourth item**, a body that flies an arc, is the same rotation on a hull.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). Rows, two sprites, one function
in the frame; nothing persisted.

## ⚠️ The proof found two in the guard, and both are kept in it

**The bend removed reddened the guard for the wrong reason.** The picket fires down the ship's lane,
and a shot that flies straight down it hits the parked ship and is spent; the first red said *never
got a pair away* about a picket that had. The fixture parks the ship at the back of its box now, so a
straight shot has the whole view to be measured in, and the red says *swung 0.0 units*.

**A map keyed by the pooled entity lost the first volley.** The pool reuses its slots, so the second
pair's shots ARE the first pair's entities, and the map overwrote their flights the step the second
was born. Finished flights are a list now — the same mistake `scripts/weigh-presence.mjs` avoided by
construction, made again in the guard beside it.

**And the full proof found a third, in 0098's file.** Its probe put the lancer on the spit, which
used to collide with the picket's `spit/spray`; the picket sends the ripple now, so a lancer on the
spit collides with nobody and the probe applied and stayed green. Re-aimed at the ripple — the same
break, two shooting kinds on one bullet in one pattern — with the reason in the file.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0327`, and `0098` and `0258` re-anchored beside it:

| broken on purpose | went red |
|---|---|
| the bend step removed from the frame, so a path on a row moves nothing | `THE PICTURE: a ripple swings across the lane on the screen` |
| the spray arm dealing one handedness, so the pair snakes in step | `THE PICTURE: a ripple swings across the lane on the screen` |
| the arc's sweep ignored, so a curl never straightens and never leaves | `THE OTHER PICTURE: a curl turns through its sweep, then flies straight, then is gone` |
| the arc rotating the world velocity, so the scroll is bent into the shot | `THE OTHER PICTURE: a curl turns through its sweep, then flies straight, then is gone` |
| the picket put back on the spit, so no level sends a shot that swings | `every path arm is on a row some level sends` |
| the curl's turn cut to a hundredth, so its circle is wider than the lane | `a row that bends bends inside the lane` |
| the lance given a wave, so more of what is sent bends than flies straight | `and most of what is sent still flies straight` |
