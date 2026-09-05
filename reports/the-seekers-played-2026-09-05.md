# The seekers played — 2026-09-05

The first play of [0235](../docs/decisions/0235-a-seeker-hunts-the-nearest-body.md)'s homing
missiles across a run, on the staging build after the sixth play-test of the blades. Answered in
[0246](../docs/decisions/0246-a-seeker-hunts-on-the-screen.md); this file is the record of what
was said.

## What was said

> *"we need to reduce the homing missiles effectiveness, they're way too strong, limit them to
> screen space only and give them a shorter lifespan, I had 15-20 on screen at a time and they were
> killing everything super fast."*

## What was played, that this is a verdict on

A seeker hunted the nearest body within a reach of the widest view plus the lane — a circle about
the missile, which from anywhere near the leading edge covered bodies a whole screen beyond it —
and lived until it hit something or left the view. A seeker turning after a body it could not
catch was spent by nothing, so at a pair every half-second the screen filled with them.

## What the items are

- **Screen space only**: a seeker may hunt only what the player can see.
- **A shorter lifespan**: a seeker goes out on its own.
- **The count**: fifteen to twenty on the screen is the symptom both are for.
