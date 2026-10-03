# 0483 — The pterodactyl flies

**Accepted 2026-10-04.** Item 7 of [`the-bosses-look-planned`](../../reports/the-bosses-look-planned-2026-10-04.md),
its 3.2. The plan's diagnosis: the bird slid across the lane at one speed, **reversed in one step** at
the edges, and the brace before every beam ([0250](0250-the-quetzal-screams.md)) stopped it dead and
started it again. Nothing banked, and the flap ignored the motion. A bird that slides at one speed, stops dead
and reverses dead does not read as flying.

## The rule

Three row fields. Each is optional, and absent on every other boss, which moves exactly as before
([0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md)):

| field | what | the pterodactyl's |
|---|---|---|
| `move.ease` on `patrol` | the hull gains or loses at most `top / ease` a step; it turns where its stopping distance meets the edge, and starts slowing for a beam `ease` steps before the volley that throws one | 24 steps |
| `bank` on the row | `turn = −bank × velAcross / top`: the nose points where it is going, and the hull is level at a brace | 0.26 rad |
| `climb` on the aura | the wing beat runs `1 + climb × share` of its rate, where `share` is the climb's share of top speed. Climb is toward `across` zero, the top of the desktop screen ([0153](0153-desktop-is-the-target.md)). The beat is a phase carried on the world (`bossBeat`), because `steps / hold` at a changing rate jumps frames | 0.5 |

**A beam thrown sooner than the ease can stop the hull levels it as it throws.** A stage that opens with a beam
part-way through the last stage's cadence is the one case where this happens. The beam is fixed where its root is on that step,
so a root turned by the lean would be a beam leaving from where no gun is drawn.

## Consider the screen

**The bird flies less far between beams.** At the later stages the gap between beams (48–60 steps) is
not much longer than the ease in and out, so the bird rarely reaches top speed. Measured on the tuned tier
over a minute at each stage:

| stage | distance flown between one beam and the next, mean | share of the time the hull is still |
|---|---|---|
| 0.7 | 36.1 → **28.0** units | 41% → 45% |
| 0.45 | 39.7 → **29.5** | 53% → 58% |
| 0.2 | 42.4 → **28.2** | 55% → 59% |

So the beams land closer together and the hull hangs at each brace. **This is the play question.** If
it reads as a bird that dawdles, the knob is `ease`, one number on the row. At 16 the corner is still under
the guard's three lanes a second squared, and most of the distance comes back.

**A pursuing gun got quicker, so the ray is weighted.** `weigh-boss quetzal`, on its lane at 45: the ray
took 35 s, from 46, under [0260](0260-a-boss-is-fought-to-the-end.md)'s forty. Every held lane got
slower (pulse 115 → 128 s median, ray 93 → 104, shuriken 71 → 78), because a leaning, easing hull is harder to
sit under. So health was not the lever, and the ray's weight is 0.82 here, which is the gyre's own answer
([0475](0475-the-wreck-can-be-killed.md)).

## Guards

`tests/quetzal.test.ts`, each flown at every stage for twenty seconds on the bird's own cadence:

- **THE REPORTED ONE, IN LANES AND SECONDS** — the slide never gains or loses more than three lanes a second,
  a second, between two steps. The hard corner was about ninety-five at the last stage, and the ease spends two.
  The hull's edge never leaves the lane. It turns at least once at every stage, and is braced by a beam at every stage that throws one, so the corner and the stop are both
  flown.
- **THE NOSE POINTS WHERE IT IS GOING** — moving at more than a tenth of top speed, the turn leans
  toward the side it slides to. It is level whenever it braces. At full slide the lean is at least 0.15 rad.
- **THE FLAP FOLLOWS THE STROKE** — at speed, the wings change frame at least 1.8 times as often
  climbing as diving.

[0250](0250-the-quetzal-screams.md)'s *THE WINGS AND THE MOUTH, DRIVEN* already holds the roots, and it is what
went red when the lean was not levelled at the throw.

## Seen to fail

[0005](0005-a-guard-must-be-seen-to-fail.md). `node scripts/prove-guard.mjs 0483`:

| broken on purpose | went red |
|---|---|
| the patrol with no ease | `THE REPORTED ONE, IN LANES AND SECONDS` |
| no slowing before a beam | `THE REPORTED ONE, IN LANES AND SECONDS` |
| the turn started at the edge rather than at the stopping distance | `THE REPORTED ONE, IN LANES AND SECONDS` |
| the bank with the velocity's sign | `THE NOSE POINTS WHERE IT IS GOING` |
| the climb read toward the bottom of the screen | `THE FLAP FOLLOWS THE STROKE` |
| the hull not levelled as it throws | `THE WINGS AND THE MOUTH, DRIVEN` |

## Owed

- **A play of the Saurian Belt's boss** — whether it flies, and whether the shorter legs between beams read as
  a bird or as a dawdle (the table above).
- **The feathers** (the plan's 3.1) are next. They carry the slower, twelve-frame beat and the heave, and
  re-anchor the *six frames a second* floor.

## Rollback

⚠️ **None owed** — [0001](0001-revertability-not-risk-rating.md). Content, the frame and a world field that
is reset with the boss; nothing persisted.
