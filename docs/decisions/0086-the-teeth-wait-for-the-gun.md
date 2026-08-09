# 0086 — The teeth wait for the gun

**Accepted 2026-08-09.** A play-test finding against the build carrying
[0084](0084-the-dial-is-the-level-and-the-guns.md) — **the decision that had already answered it.**

**Completes [0084](0084-the-dial-is-the-level-and-the-guns.md)** rather than amending it: the clamp is
unchanged, and what changes is the level it was protecting.

## The rule

**Level one waits `MULTI_HIT_RUNUP` — 600 world units, sixteen and a half seconds — after the pickup
that lifts the single-hit clamp before it authors anything that takes more than one shot.**

## What was asked for

> *"We need to remove the enemies that take multiple shots to kill from the 1st level, they can't start
> appearing till after the second weapon pickup — they're too difficult to kill with the default fire
> mode. Note that once the player gets the 2nd primary weapon power up, they're then pretty easy."*

⚠️ **This is the same sentence 0084 was built from, said again about the build that shipped it.** 0084
took *"at the start of the game there should be no multiple hit enemies until after the 2nd upgrade has
been spawned"* and made it true. Ten hours later the same complaint came back.

## What 0084 got right, and the ten units it did not

The clamp works. It fires, it holds every enemy to one hit, and it lifts at exactly the pickup it names.
What it cannot do is put a gun in the player's hands.

| level one authored | at |
|---|---|
| the second `weapon` pickup — the one that lifts the clamp | **2,300** |
| a column of four turrets, three health each | **2,310** |

⚠️ **Ten world units is a third of a second at `SCROLL_PER_STEP`.** The clamp lifts when a weapon pickup
**spawns** — which is the only version of it that can sawtooth, and 0084 spends a section on why — so
the turret it exists to hold back arrived alongside the pickup rather than after it. The player met a
three-health turret with the base gun, having had no time at all to cross the lane for the thing that
answers it. **Every guard in the repository was green**, and correctly: the clamp did precisely what it
says.

⚠️ **So this is not a tuning miss, it is a missing half.** *The level has offered you a gun* and *you
are flying one* are separated by a crossing of the lane and a decision. 0084 owns the first; the run-up
owns the second.

## Why the clamp is left alone

The obvious fix is to key the clamp to what the player **holds** rather than to what the level has
**offered**, and the ask's own words point that way — *"once the player gets the 2nd primary weapon
power up"*. It was put to the hand that reported it, against re-authoring the level, and the level won.

⚠️ **Keying it to held would have made a player who ignores both pickups immune to the whole of level
one**, which is a difficulty curve the player does not steer into deliberately — and it would have put a
second reader on the dial with the opposite semantics to the first, three days after
[0084](0084-the-dial-is-the-level-and-the-guns.md) argued that only *offered* can sawtooth. The run-up
costs one band of a level table and no new mechanism.

## What the band is

`src/content/levels.ts`, 2,310 → 2,940. Four waves changed kind and nothing moved:

| at | was | is |
|---|---|---|
| 2,310 | turret ×4 | weaver ×5 |
| 2,580 | turret ×4 | drifter ×6 |
| 2,670 | lancer ×5 | weaver ×5 |
| 2,850 | turret ×4 | drifter ×6 |

⚠️ **The lancer goes too, and it is the wave that says what this rule is really about.** A lancer has
two health, which is *more than one shot* — the ask's own unit. Everything in the band is now a
one-health kind, so the band is a band **by authoring** rather than by clamp: past 2,300 the clamp is
off and every health in the table is real.

⚠️ **The level is not longer and the boss has not moved.** The band carries 43 bodies where it carried
38, which is deliberate: a respite made of fewer enemies is a respite the player spends waiting, and
what the new gun buys should be something they watch it do.

⚠️ **The teeth then arrive as two events rather than one.** The lancer at 3,030 is the first thing that
takes two shots; the turret at 3,210 is the first that takes three. Level one used to introduce both in
the same wave.

## Six hundred, and it is chosen against the pickup rather than against the turret

⚠️ **The floor is the pickup's own linger.** A pickup waits 420 steps — seven seconds — to be taken
([0064](0064-a-pickup-waits-to-be-taken.md)), so a run-up shorter than that could put a multi-hit wave
in front of a player who is still legitimately flying towards the thing that would answer it.
`PICKUP_LINGER_STEPS` is exported for the guard to name, on
[0083](0083-two-ladders-of-four.md)'s terms: naming a bound is legitimate when it is a **separate**
constant with its own reason, and two independent constants agreeing is the only honest way to say
*long enough*.

⚠️ **600 is more than double it, and the content sits above 600.** Level one's gap is 730. The guard is
a **floor**, so retuning either number is a content change rather than a broken promise — and the day
the content drops under it, the failure names the wave and the pickup rather than a diff.

⚠️ **Level one only, because the clamp is.** Every other level opens past `MULTI_HIT_DIAL` and is meant
to: 0084's whole argument for the `levelIndex === 0` term is that a game whose every opening had no
teeth would be a game with teeth nowhere.

## Confirmed, not assumed

Per [0005](0005-a-guard-must-be-seen-to-fail.md) and [0019](0019-a-probe-must-be-seen-to-apply.md),
declared in `scripts/probes/0086-runup.mjs`.

| broken on purpose | went red |
|---|---|
| the turret put back ten units behind the pickup that lifts the clamp | `THE REPORTED ONE: level one authors nothing tough until the run-up is over` |
| the run-up cut to nothing, so the clamp lifting is the whole of the promise again | `and the run-up outlasts the wait the pickup itself gets` |
| the pickup that lifts the clamp moved past the wave it was buying the player a gun for | `and it reaches the FIELD: the two events are that far apart in the real frame` |

⚠️ **All three are CONTENT edits and that is the subject rather than a shortcut.** There is no
expression here to break — the code was right — so the probes are a wave moved and a pickup moved,
which is exactly the change somebody retuning level one would make without ever seeing the connection.
The first is the shipped table of every build up to 0084, byte for byte.

⚠️ **The third break is the one the table cannot catch and it is why the field guard is driven.** The
waves are untouched in it; the pickup moves past them. The clamp then holds ON through the lancer, so
the tough wave arrives at one health, the player gets the gun afterwards, and the level's teeth land in
the wrong order with nothing in the table looking wrong.

⚠️ **One probe belonging to 0040 was re-anchored** — its thin-the-waves break spanned the turret line at
2,580 — and `anchorFailures` reported it in a second rather than after six tree copies.

## What this does not settle

**Whether a player who ignores the pickups should meet the turrets.** They do, and 0084's own note
about the cost of *offered* is the place that argues it: the dial rises whether or not anybody collects
anything. This decision moves the wave; it does not change who the wave is measured against.

**The other six levels.** None of them has a run-up and none of them should — they open past the clamp
on purpose. If a play-test says level two's opening is the same spike one level along, the thing to
question is the sawtooth's depth, not this.
