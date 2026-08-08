# The third play-test — 2026-08-08

**The largest single batch of feedback the project has received, and the first one that is about what
the game IS rather than about what it does wrong.** Played on `main` at
[a32bcef](https://github.com/Foxorama/into-the-coil/commit/a32bcef) — the build carrying
[0072](../docs/decisions/0072-a-cue-is-baked-and-played.md),
[0073](../docs/decisions/0073-an-enemy-is-a-pilot.md),
[0074](../docs/decisions/0074-the-box-is-drawn.md) and
[0076](../docs/decisions/0076-a-level-has-an-origin.md), which
`docs/state-of-play.md` had been holding as *five changes landed and not one of them flown*.

The player's words are kept **verbatim**, because they are the findings and a status document cannot
hold one ([0029](../docs/decisions/0029-the-tracked-record-is-the-record.md)). The section headings
and the grouping are editorial; nothing inside a quote is.

⚠️ **It arrives with an explicit priority instruction**, which is why it outranks the queued work:

> *"there are a bunch of queued up changes about new weapons and designs etc, however the below
> feedback is regarding the recent playtest and takes the most priority."*

⚠️ **And with an explicit process instruction**, which is why this file exists before any code moved:

> *"It's a lot, so go slowly and carefully and record it and break it up into manageable chunks. If
> it's too much for this context session, which it almost definitely is - then make sure the next
> session is able to pick up and run with it as well."*

---

## The headline, and it is a thesis about the genre rather than a bug

> *"Essentially, everything is still just a canvas the player is flying past - it needs to feel like
> the player is flying from point A to B (start to end of level) and encountering enemies on the way
> from that mission objective should be hurdles to overcome, not just things to dodge. The 'navigate
> through a labyrinth where the walls are lava' is a very different style of game."*

> *"The style of game we're making is objective focused:*
>
> 1. *Primary objective -> beat the level by surviving*
> 2. *and that means -> get to the objective at the end of the level*
> 3. *by -> overcoming the obstacles on the way to that objective that are actively working to stop
>    the player from reaching the objective. this one of the key differences we need to completely
>    change or improve, the waves and enemies we have just 'exist', they aren't actively trying to
>    interact or stop the player.*
> 4. *There should be progression of mission and difficulty from one level to the next. Level 2 starts
>    harder than level one and increases difficulty etc. It's a dial that starts at 1 and should be at
>    11 when the player is dealing with the last boss at the end of the last level.*
> 5. *Level 1 -> dial starts at 1, increases to 2 when the player gets their first weapon power up,
>    increases again when they get their next, until they get to the boss which should be difficulty 4
>    or so on the dial.*
> 6. *Level 2 starts by dialing it back 2 notches to give the player a breathing space and then dials
>    it up per power up spawn so it should be around 5 at the end of the level.*
> 7. *That pattern then repeats.*
> 8. *Balance comes from making sure that the player can reasonably be expected to deal with the
>    difficulty dial"*

⚠️ **Item 3 is a re-statement of the finding [0073](../docs/decisions/0073-an-enemy-is-a-pilot.md)
was written to answer, made against the build where 0073 had already landed.** That is the single
most important thing in this report. 0073 gave three of six enemy kinds a reason to react to the
player, it shipped, it was flown, and the verdict is still *"they aren't actively trying to interact
or stop the player."* So either the reactive tier is too timid to read as reactive, or reacting is
not what *actively working to stop the player* means — and the difference between those two readings
is the difference between a tuning pass and a design change.

⚠️ **Items 4–7 are a mechanism the project does not have.** Difficulty today is a **tier** chosen
before a run ([0047](../docs/decisions/0047-difficulty-is-a-tier-and-the-easy-one-is-the-content.md))
multiplied over content authored per level. What is asked for is a **dial that moves during a level,
keyed to the player's own upgrades**, with a documented sawtooth across the run: 1→4 in level one,
back to 2 and up to 5 in level two, repeating to 11 at the last boss. Nothing in `src/` currently
reads the arsenal to decide what to spawn.

⚠️ **Item 8 is the acceptance test for the whole thing** and it is a play-test, not a guard.

---

## Balance — one thing, and it is stated as an absolute

> *"max speed auto-fire is way too strong for the current game - when you get max speed nothing is a
> challenge, bosses die in less a second and they are supposed to be tough."*

⚠️ **This is [`medium-played`](medium-played-2026-08-07.md)'s *bosses die in under a second*
un-fixed and now named at its cause.** That report grouped it with the upgrade curve; this one says
which upgrade.

---

## The view — three separate complaints that all resolve against the camera

### The near starfield reads as foreground

> *"On desktop, the closer starfield layer is still too close to play view, needs to be a bit more
> background. I think it's actually the perspective zoom level is wrong."*

⚠️ **[0069](../docs/decisions/0069-the-sky-is-behind-the-game.md) is the decision that already
answered this once** — *nothing the sky draws is as big as a bullet* — and the complaint has come
back naming a different cause: not the size of a star but the **zoom**, i.e. how many world units the
viewport shows.

### The player's box is the wrong shape, and desktop is now the target

> *"I've attached screenshots for desktop and for mobile and you can see the dividing lines for where
> the player can reach on each format - from what I can see we should be able to extend the desktop
> one, but change the player 'box' proportions to correctly be a rectangle, maybe that doesn't work on
> mobile though, in which case - let's optimise for desktop and we'll add a different viewport for
> mobile."*

⚠️ **That last clause settles a trade `docs/state-of-play.md` has been deferring twice over.**
[0074](../docs/decisions/0074-the-box-is-drawn.md) measured the forward room available at the current
device support as **six world units**, and named raising `MIN_ASPECT` to 16:9 as the way to buy ~28
more — refusing it because it letterboxes 16:10 laptops and 3:2 tablets. The player has now chosen:
**optimise for desktop, and mobile gets its own viewport.** That is a change to
[0023](../docs/decisions/0023-the-long-axis-is-the-scroll-axis.md)'s core promise that only lookahead
varies by device, and it needs writing as a decision rather than as a constant.

### The barrier line solved the reported problem and not the real one

> *"the barrier line is just super bad - it solved the problem I was having, but it did not solve the
> problem the game has in that almost a quarter of the screen space is not playable by the player"*

⚠️ **This is a verdict on [0074](../docs/decisions/0074-the-box-is-drawn.md) three commits after it
landed, and it is the exact failure mode 0074 wrote down about itself.** 0074 says *"what is missing
is that it is invisible, and the fix is a picture, not a number"* — the picture landed, and the
number was the problem all along. The dashes are now a **visible measure of how much screen the
player does not own.**

### The sky is too slow

> *"the background starfield layers both still need to be scrolling past about 1/3 faster - currently
> feels like i'm on a casual stroll and not a super fast spaceflight combat battle."*

**Both layers, +33%.** A number, and the only unambiguous one in the report.

---

## Power-ups — the longest section, and it is called the lynchpin

> *"power ups are too common still and these are premium game pieces that are the lynchpin of whether
> this game is actually good or not"*

> *"too many varieties and it's overwhelming and weak, too few and the player doesn't feel powerful
> enough"*

> *"these are a key driver of the players feeling of power growth and they're currently a steady
> stream of non-earned upgrades that make the game trivial"*

> *"shields/lives should be kept to 1-2 per level. Shields in particular are so much more stronger
> than I had anticipated."*

> *"missile upgrades need to be 2-3 per level"*

> *"rapid fire/rapid missiles rapid whatever else we add need to be combined into one power up - which
> is the weapon change power up, we haven't implemented other weapons yet, but picking up a second of
> the same weapon needs to increase it's tier and rate of fire together. There's just too many power
> ups for these to be separate things."*

> *"when a player dies let's change it to 50% chance of each power up they have collected spawning
> from their death, current implementation means there's not really a cost to dying at all"*

⚠️ **The taxonomy pass [`medium-played`](medium-played-2026-08-07.md) called *a precondition, not a
follow-up* has now been specified rather than merely required.** The merge of rapid-fire and
rapid-missile into a single **weapon** pickup whose repeat picks up raise *tier and rate together* is
a structural change to `src/content/pickups.ts`, not a rate change.

⚠️ **`non-earned` is the operative word**, and it links this section to the enemy one: see *the
power-ups need to spawn after beating a tougher enemy or a mid-round boss* below. Rarity alone does
not make a pickup earned.

⚠️ **The 50% scatter rule amends
[0066](../docs/decisions/0066-a-death-scatters-what-it-took.md)**, which scatters everything the
death took.

---

## Enemies

> *"in general they fly too fast across the screen"*

> *"it doesn't feel like I'm fighting them, they need to be slower, have more of a patterned
> interesting flight path"*

> *"they need different shots/attacks etc to make things more interesting, enemy bullets need to be
> slightly slower, but more of them need to be shooting"*

> *"the bosses are far too weak, don't show damage, and move towards the player till they had the
> midscreen and then just float up and down."*

> *"each boss does the same thing"*

> *"the current bosses are closer to mid-level minibosses rather than end of level bosses."*

> *"the power ups need to spawn after beating a tougher enemy or a mid-round boss, not an end boss to
> get the sense of worth"*

> *"at the start of the game there should be no multiple hit enemies until after the 2nd upgrade has
> been spawned - the difficulty curve currently has a massive spike at the start, then it also
> immediately scales out and then drops off to super easy based on buffs the player has"*

> *"visual sprite differentiation. currently we've gone too hard on the visual accessibility
> requirement and it's now very hard for sighted users to differentiate between power ups,
> player/enemy fire, different types of enemies. When they're all the same colour and essentially the
> same size, they're all the same."*

⚠️ **"don't show damage" is a report against
[0035](../docs/decisions/0035-damage-is-legible-on-the-body-that-took-it.md), which is the decision
that says damage IS legible on the body that took it.** Either it does not apply to bosses or it does
not read at boss scale. This is exactly
[0027](../docs/decisions/0027-measure-the-picture-not-the-model.md)'s subject and wants eyes on the
picture before a line is changed.

⚠️ **"no multiple hit enemies until after the 2nd upgrade"** is items 4–7 of the thesis in concrete
form — a spawn rule that reads the player's arsenal. It is the smallest possible version of the dial
and is a good first proof that the mechanism works.

⚠️ **The legibility complaint reverses the direction of three previous reports.**
[`combat-legibility`](combat-legibility-2026-08-05.md),
[`enemy-legibility`](enemy-legibility-2026-08-05.md) and
[`enemy-silhouettes`](enemy-silhouettes-2026-08-05.md) all pushed toward a unified, colour-blind-safe
palette. [0024](../docs/decisions/0024-the-accessibility-floor-is-settings.md) says accessibility is
**knobs over a loud default** — this finding says the default stopped being loud. **The floor is not
being removed**; what is asked for is differentiation *in addition to* it: shape and size, which are
the two channels a palette does not spend.

---

## Bugs — the player's own caveat is kept

> *"bugs - these are probably by design, but classing them as bugs because they look/feel like bugs"*

1. > *"power ups hit a wall when they get to the center of the screen and slide up/down it before
   > continuing on."*
2. > *"when a player dies the powerups spawn straight up/down the screen, they don't spread out in a
   > random pattern and bounce around the screen."*
3. > *"after a player's first death, the player can then have 3 missile tubes instead of being capped
   > at two"*
4. > *"when a player dies, they instantly respawn, there needs to be the player ship explosion, a
   > pause, then a respawn. This also needs to happen before the 'continue' screen shows up as well."*
5. > *"Additional autofire and missile upgrades don't change the look of the player's ship"*

⚠️ **Bug 3 is a real defect and not a design choice** — 0051 caps launchers at three and the *second*
tube is the first upgrade, so *three tubes after a death* means a cap is being compared against the
wrong baseline or a death is not clearing what it should. It wants confirming in the code before it
is answered.

⚠️ **Bug 1 is very likely the pickup drift meeting the player's box edge**, i.e. a second symptom of
the barrier-line complaint above, seen from the pickup's side.

---

## How this was broken up

**Eight chunks, ordered so that nothing is tuned before the thing it depends on moves.** The order is
in `docs/state-of-play.md` under *What is next*; it is repeated nowhere else, because a second copy
drifts ([0029](../docs/decisions/0029-the-tracked-record-is-the-record.md)).

⚠️ **The chunking is editorial and the ORDER is a proposal**, unlike everything above it. The
player's stated ordering preference on the previous two lists was *the player's own*, and it was not
given for this one.

## What this does not settle

**Nothing here is a decision.** Every item is a finding; where each belongs is a file in
`docs/decisions/`.

⚠️ **And the verdict on all of it is one play-test after the last chunk lands**, on the same stated
reason that governed the previous two lists: *"something might feel right by itself in isolation and
then completely fail when you mix something else in."*
