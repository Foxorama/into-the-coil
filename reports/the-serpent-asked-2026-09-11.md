# The serpent asked for — 2026-09-11

A brief rather than a play-test: four changes to the Approach's end boss, asked for at once. The
attacks are answered in [0304](../docs/decisions/0304-the-serpent-sprays.md); the look and the
entrance are owed, each its own decision, in that order. This file is the record of what was said.

## What was said

> *"let's make the serpent boss at the end of level one more interactive*
>
> *can we make it fly onto screen, do a coil, fly off and then enter where it is now?*
>
> *for the acid splash attacks*
>
> *for phase 1 can we have it shoot a forward arc of 5 globes*
> *then phase2 it does a spray starting from 60degrees (so it will be shooting down behind it) then
> arcing around and finishing at 30 degress (so it will be shooting up behind it)*
>
> *then when the void blast phase starts it needs to look more menacing and have a dark aura, kind
> of like a super saiyan aura, but dark blue and purple energy and it's horns grow longer*
>
> *and then when the lightning attack phase starts it needs to get a super saiyan red lightning
> flicker through the aura and it's horns grow a bit longer again"*

## What was asked back, and answered

A plan went back before anything was built, with four questions. The answers, as given:

| asked | answered |
|---|---|
| which way the phase-two spray turns | sixty degrees below straight-behind, round through the front, to thirty above straight-behind — 270 degrees, the gap behind the animal |
| what the last third's acid is, since it repeated the second phase's | the new spray, carried on as every head there is |
| whether the entrance is part of the fight | *"Not-shootable, fully live - there's needs to be a gap in the center of the screen. Players can learn the pattern to avoid the damage from being hit by it and there's a music tone to alert of it's arrival."* |
| one change or three | three, each playable as it lands: the attacks, then the aura and the horns, then the entrance |

The plan also named the one thing in the brief the engine cannot do today — **turn a sprite** — and
that the entrance's coil needs it, because a head baked facing down the lane cannot fly round a
circle without flying backwards into its own neck for half of it.

## What the items are

- **The attacks** — [0304](../docs/decisions/0304-the-serpent-sprays.md).
- **The look** — [0305](../docs/decisions/0305-the-serpent-darkens.md).
- **The entrance** — owed: in from the leading edge, a coil round the middle of the screen with the
  centre left open, off the bottom, then the arrival the fight has now. Untouchable by the player's
  fire and hurting on contact.
