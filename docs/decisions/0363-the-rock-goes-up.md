# 0363 — The rock goes up

**Accepted 2026-09-23.** **Amends [0347](0347-the-belt-is-a-jungle-under-a-live-volcano.md)**: a
volcano still throws rock, and a throw is now only the climb. Background only. No rule of play moves,
and neither does the quetzal's `fall` ([0251](0251-the-volcanoes-belch.md)).

## The ask

> *"need to change the saurian belt background volcanos so that that background rocks fire up into
> the air and off the screen, but they don't fall down as it's distracting. the symbolism is that when
> you get to the boss is when they all start falling - so no gameplay changes, but background changes
> instead"*

## The rule

**Nothing a Saurian Belt volcano throws comes down on the screen.** A flight in `paintEruption`
(`src/render/scene.ts`) is the rising half of a throw: out of the crater, slowing as it climbs, and
wholly past the top of the screen by the end of it, still climbing towards an apex that is never in
sight. **The first rock that falls in the level is the quetzal's**, on the lane. That is the symbolism
the ask names, and it already existed as play. This decision adds nothing to it.

**The apex is solved per rock, never stated.** Each rock's climb is from its own crater to half its
cooled size past lane 0, which is the top of the screen on every device because the view shows
`across` 0 to 100 exactly. The row gives how far past the edge the hardest throw would still climb
(`Eruption.overshoot`, which replaces `rise`), and the parabola is solved to cover the climb in the
flight. So no row can author a throw that turns over in sight. A higher overshoot is a rock still
going fast when it leaves, so the three volcanoes still escalate with `push`, `surge` and `approach`.

**It has to be gone by the last whole step, not by t = 1.** The clock is steps, so a rock is last
drawn one step short of the end of its flight. The first cut was solved for t = 1. Its last picture
sat 3px on the screen before the rock jumped back to the crater, which is the fall again in a smaller
form. The guard caught it on its first run.

**Each volcano keeps about the throws a second it had**: 2/72, 3/62 and 4/52 against 0347's 5/170,
8/150 and 11/135. So fewer rocks are in the air at once, because a flight is now only the climb. Their
sideways drift (`reach`) is halved, so a rock leaves at about the angle it used to climb at. Worked
from the rows, for the first volcano: about 0.4 units across per unit of climb before, about 0.36 now.

## What was refused

- **Falling rock in the background during the fight.** The ask says the falling IS the fight. The
  quetzal's rock already comes over the top edge on a burst of embers
  ([0036](0036-an-event-the-model-knows-about-the-picture-mentions.md)). A background fall behind it
  would be the distraction the ask removes, in the one place with the most on screen.
- **Fading or shrinking a rock out before it turns over.** A rock that vanishes in mid-air is a
  different distraction. *Off the screen* is the ask.
- **Keeping `count` and raising the throw rate to match.** That would be two and a half times the
  throws a second. It is a lever for the play, not part of the ask.

## What holds it

`tests/jungle.test.ts`, in screen pixels at 1080p: every volcano's rocks are followed step by step
across three flights. A rock may only go down the screen by being thrown again. It has to leave from
its crater, and only once the previous throw is wholly above the top edge, measured from the blit's
own scale and the sprite's extent and never from the painter's constant. `scripts/probes/0363-*.mjs`
puts the apex back inside the flight and puts back the first cut's t = 1. Both were seen red. 0347's
probes that anchored on the old lines are re-anchored on only what they break.

## What it costs

Fewer blits. The worst frame of the level's landmarks is **12** (three volcanoes and nine rocks),
down from 27, at camera 3630 on the same three views. `ERUPTION_BUDGET` stays 40.

## Owed

**A play**, on the branch preview: whether two rocks at a time reads as a live volcano on the first
mountain, and whether the rock leaving over the top reads as going somewhere. The levers are `count`
and `overshoot` on each row.

No rollback note: no storage key, save schema, cache prefix or origin is touched.
