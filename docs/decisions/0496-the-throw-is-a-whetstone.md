# 0496 — The throw is a whetstone

**Accepted 2026-10-04.** The first listen of [0495](0495-the-throw-is-a-listening-set.md)'s set: *"for the shuriken
noise, I can't hear a thrum, can we do a knife on a whetstone, but a deeper beat?"*

## The rule

**The thrum leaves the desk and the whetstone takes its place** in `rig/throws.ts`. A voice that does not read as what
it is called is not a candidate. Nothing the game ships changes; this is still a question on the dash.

- **The stroke**: gritty noise through a narrow resonant band (1.2 to 2 kHz up to 3.4 to 4.6 kHz, q 3.2) that swells
  in over 18 ms rather than clicking, rising as the edge slides along the stone. A darker, rougher grain sits under
  it, panned the other way, and one quiet steel partial says *blade*.
- **The deeper beat**: the launcher starts a fourth lower and falls further. It is longer (0.15 s) and driven
  harder, so it lands as a thud and not a tap.

## Measured before it was offered

`weigh-cue --loud --from=rig/throws.ts`: the whetstone is **−48.9 dB** A-weighted at the bus, inside the guns' own
−48.2 to −50.4. Its first draft was −46.9, too loud for 0495's ceiling, and was eased down and darkened before it
was offered. Its sub band is **0.23** of its loudest band against the shipped throw's 0.035, which is the deeper
beat in numbers.

`weigh-fit --rung=run`: furthest from the bed by 5.7 dB on the Approach and the Labyrinth and 11.2 on the Black Heart,
against the shipped throw's 7.9, 9.0 and 14.5, all in the top bands.

## Guards

0495's three re-run as they are. *THE SET SITS WHERE A GUN SITS* now asks it of the whetstone, and it was the guard
that would have refused the first draft. No new guard: the voice is a candidate, and what it sounds like is the ear's.

## Owed

- **The listen**, on `npm run dash`: the whetstone beside the other four.

## Rollback

⚠️ **None owed**: [0001](0001-revertability-not-risk-rating.md). The rig only.
