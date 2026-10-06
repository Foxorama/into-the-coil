# 0557 — The Marmot crackles

**Accepted 2026-10-06.** A play of the Thunderbolt after [0546](0546-the-marmot-rides.md). Amends
[0527](0527-the-wheels-turn.md)'s turning wheels, [0492](0492-the-shields-wear-the-ship.md)'s one orbit for
every shell, and 0546's drawing of the bike.

## The ask

> *"are the Marmot's lightning spokes supposed to do anything? the mothership wheels are spinning but the
> Lightning Spokes aren't spinning and they look like they should be spinning or doing something other
> than not looking great"*
>
> *"make them crackle like lightning - at the moment they just look like a teal bar, they don't even look
> like lightning"*
>
> *"we also need to tilt the handlebars closer to the marmot because he's got super long arms now"*
>
> *"the lightning shield cosmetic needs to be positioned slightly further away from the spaceship because
> it overwhelms the ship itself"*

## What was measured first

Off `rig/sheet.html` (`scripts/shot-sheet.mjs`) on `main` at zoom 4, and the pad at three times device scale:

- **The wheels.** The bike's rim was one slash of cyan, half a radius thick, across a dark dish. 0527 had it
  baked still into the hull, so it never moved.
- **The bars.** The grip stood at nine units along, out over the front wheel, with the arm reaching to it
  from his shoulder behind the helmet.
- **The shield.** The storm's arc sweeps 80°, the widest of the five looks, at 5.6 units: the same distance
  as every other shell, on a hull longer than any of them.

## The rule

| | |
|---|---|
| **how a rim's wheels move** | `RimRow.turn` is now `RimRow.wheel`. It holds the pictures shown in turn (with each one's hurt twin), how long each is held, a roll (seconds a turn, front and back), and how far each new picture jumps round from the last. `null` is a rim baked still, as before. `wheelFrame` and `wheelTurn` read a row, and they are the only shared code: the fight (`stepWheels`), the pad (`paintStand`) and the pilot card all call them |
| **the spinners** | one picture, rolled at 0.7 s and 0.8 s a turn, exactly as 0527 had them |
| **the lightning** | three cracks (`CRACKS` in `src/render/bake.ts`): three, two and four bolts out of a chrome hub, some forked and some dying short of the rim, each with a spark where it lands. A crack holds a sixteenth of a second, then the next strikes 2.4 radians round, and nothing rolls. The back wheel runs one crack behind the front. The hull bakes the first crack still under them, for anywhere no overlay is drawn |
| **a strike is not interpolated** | the renderer lerps every turn between steps. On a strike the frame sets `prevTurn` to the new turn, so the crack is there at once rather than swept round from the last one |
| **the pad** | three wheel pictures (`blueWheel0`–`2`, one per crack of the longest rim) baked off the fitted rim with the rest of the pilot's ship. The pad strikes them on its own clock |
| **the card** | turns a rim that rolls, as before. A rim that only strikes shows its baked crack still, because the stylesheet can turn one picture but cannot strike between three |
| **a shell's orbit** | `ShieldShell.orbit`, optional. `shellOrbit` returns it or `SHIELD_ORBIT`, and both the frame that places the plates and the bake that curves them read it. The Thunderbolt's storm stands at 7.1, and every other shell where it was |
| **the storm's arc** | keeps the length it had at 5.6, so it stands further off without growing |
| **the bars** | swept back: the riser rakes back off the fork crown, and the bar runs back to a grip at six units along, three nearer him. The arm, the gap under it, the paw and the chrome seam move with it |

## Why it is built the way it is

**On the rim's row, not a second mechanism beside the spinner.** 0527 wrote the turning rim as one
picture and two rates. A second moving rim was always going to need its own pictures, so the row says
which ones and how they move, and the three painters read the row. Per 0282, nothing about the spinner
became the lightning's by default. Each row authors its own.

**Light, not body.** At the fight's camera a wheel is about five pixels across, and 0546 drew the bolt as a
fat slash because a zigzag at that size is under 0106's floor. The cracks are drawn as light (under 0.9
alpha) over a solid dish and hub. 0227 lets light be finer than the floor, and what reads at that size is
the flicker from crack to crack, which a solid mark cannot give. On the pad the forks and the jags read as
drawn. The first draft had the core at 0.95 and the sparks at 0.9; the accents guard counted them as body
and refused them, and it was right to.

**The orbit is on the row; the places are not.** 0492 put one orbit on every shell "so a shield is a
shield". What a shield does (where its plates stand round the ship, and which go first) is still one rule.
How far out it stands is now each shell's, defaulting to the shared one, because a long bike and a round
saucer are not the same size.

**The arc keeps its length.** The same 80° at 7.1 would be a cage a quarter bigger, which is the opposite
of the ask.

## What holds it

- `tests/wheels.test.ts`: in a second of the fight, each wheel shows every crack, strikes at least fifteen
  times, and never sweeps to a strike. Every moving rim names pictures the atlas has, and the lightning
  wears its hurt twin on a hit.
- `tests/stand.test.ts`: a step at a time through a second on the pad, each wheel either holds its crack
  or strikes a new one at least half a radian away. Both wheels never show one crack at one angle, and
  each shows all three. The pad bakes at least as many wheel pictures as a rim shows.
- `tests/shields.test.ts`: every ship's plates stand at its own shell's orbit in the frame, and every mark
  of its plates is within a unit of it in the bake. The storm is further out than `SHIELD_ORBIT`, and every
  other shell is at it.

Each is broken by a probe in `scripts/probes/0557-the-marmot-crackles.mjs`, five of them, all seen red.
0527's and 0540's probes that anchored on the old rates are re-pointed at the new lines, and all eleven
still go red.

**A sixth probe was written and deleted.** It made the bake curve the storm round the shared orbit. It
stayed green, and the guard is right not to see it. A plate is centred in its tile whatever orbit it is
curved round, so that break only bends the arc about half a unit at its ends, inside the drawn guard's
one-unit band for the strip's own thickness. The visible failure, a plate standing somewhere other than
where it was drawn to stand, is the frame's half, and that one is probed.

**No guard on the bars.** How long the Marmot's arm reads is the picture's question. The accents guards
still hold the moved arm, paw and seam on the hull and over the floor, and they caught all three on the
first draft.

## What is owed

A play of all three on the pad and in the fight. The sixteenth of a second and the 2.4-radian jump are
first guesses, and 7.1 is a unit and a half further out. All three are numbers on rows.
