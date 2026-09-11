# 0307 — The serpent is armoured

**Status:** accepted
**Amends:** [0283](0283-the-serpent-is-a-chain.md) on what a hit on the body is worth; [0292](0292-the-void-eats-everything.md) on which bolt a void takes; [0260](0260-a-boss-is-fought-to-the-end.md) on where an armoured boss's forty seconds are measured
**Builds on:** [0027](0027-measure-the-picture-not-the-model.md), [0288](0288-the-skull-is-longer.md), [0298](0298-a-blade-hits-harder.md), [0306](0306-the-serpent-coils-in.md)

## The report

> *"the shurikens kill the serpent boss in a reasonable time length, but the lightning gun and
> auto-fire gun only hit the head so they take forever to kill the boss. unsure on best solution to
> this problem aside from the answer being - use the shurikens if you want to kill the boss."*

## Nothing could answer it, so the fight was flown first

0288 drove this animal's fight with a scratch script and named the tracked one it owed; 0298 said a
boss figure *"needs a fixture that stands the boss on station and flies the fight."* That is
`scripts/weigh-boss.mjs`, and it lands here: the real frame, each gun at the cap, the ship unhittable
and the missiles silenced, flown from fifteen held places — five lanes, at rest and held 60 and 45
units short of the hull — and on the boss's own lane at the same three distances. Seconds, on
`savior`, the tier the game is tuned for.

**`main`, health 1400:**

| gun | held places: median / best | on its lane, at rest / 60 / 45 |
|---|---|---|
| pulse | 158 / 113 | 141 / 107 / 81 |
| arc | never / 416 | never / never / never |
| shuriken | 43 / 32 | 134 / 157 / 95 |

**The report was right about one gun of the two it named, and for three different reasons:**

- **The pulse — the head.** The body trails straight up the lane behind the skull, which is the
  pulse's own line of fire, so a bullet meets the head and is spent there; about an eighth of what it
  did reached the flank. And the head is an 8.4-unit skull that bobs away in the half-second a bullet
  takes to cross eighty units, which is why the same gun is 81 seconds from 45 units and 141 from rest.
- **The arc — not the head at all.** It took the first third in 18 seconds, quicker than anything, and
  then **264 seconds** over the second. From the void phase on the serpent throws a fan of three
  voids every other volley and each comes apart into seven shards; 0292 let any of them within reach
  take the link from any direction, and there was nearly always one. With that pull switched off in
  the rig the arc killed the serpent in about half a minute. **More than nine volleys in
  ten were going into voids the bolt was not aimed through.** And from rest the head is out of reach
  altogether, which is 0302's range shown honestly rather than a defect.
- **The shuriken — the body.** A blade is not spent by arriving, so it rides up a flank 133 units long
  landing every flash. Flown with the body unable to take anything, it is 112 seconds rather than 43:
  **the body was three fifths of what the shuriken did to this boss.**

⚠️ **AND THE FIRST ESTIMATE OF THAT SHARE WAS WRONG, WHICH IS WORTH KEEPING.** The rig first made the
body unhittable by setting each node's radius to nothing, and reported 69 seconds, not 112. A blade is
2.24 units across, so a point still lies inside it: the "head-only" fight was still landing on the
flank. The health first put to the player was derived from that number, and was a third too high.

## What was asked for, and what was refused

> *"can we reduce the body damage taken overall so shuriken's only damage the head? or change
> shuriken's so that they explode on impact and don't transfer through bodies like they do now? and
> then reduce serpent health or something?"*

**Blades that burst on impact — refused, with the measurement.** It is the gun, not the boss:
against an ordinary body the shuriken's near-field damage at the cap goes from 25.1 a second to 13.5,
the weakest gun in the game and 0298's buff undone, and against the serpent it becomes a 146-second
fight. It answers one boss by breaking the weapon everywhere.

**The armoured body — built.** And the void rule, which the report's other gun needed and was put back
with the numbers: *"Yes, same PR."*

## The rules

**A chain's `hurt` is the share of a hit on its body that is spent on the head, and the serpent's is
nothing.** It is on the row because whether a flank is soft is the creature — [0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md) — and
0283's drain is untouched for a row that authors a share; a guard holds it on the serpent's own row
wearing half of one.

**Armour is not a hole.** A shot still stops on the flank and a blade still spends its edge there. What
it does not do is flash hurt: a hurt twin on a body that took nothing is the picture saying HIT over a
model that says miss, [0036](0036-an-event-the-model-knows-about-the-picture-mentions.md) turned
round. So `drainChain` clears the flash, and a glance sparks through the log a missile's landing and a
blade's already use ([0227](0227-a-sprite-is-painted-not-filled.md)) — otherwise a pulse would
vanish into the animal with no mark, which is the collision bug play reports keep filing.

**A void takes the bolt it is in the way of.** A link's target is chosen first — an enemy, the boss,
or nothing, dry — and a void whose drawn ball the line to it crosses takes it, nearest the muzzle
first; a void beside the line does not. 0292's reason for the pull was *"what makes a void blast a
thing to fly around"*, and **a pull that ignores direction cannot be flown around**. The chain still
ends in the void.

**The serpent is 1000.** Asked to keep the shuriken's fight where it felt reasonable, the rig said
that number was 540 — and at 540 the lightning, which the void rule made the quickest gun here, kills
it in 22 seconds from its best place. The table went back:

| health | shuriken: median / best | pulse, on its lane | arc, in reach |
|---|---|---|---|
| 1400 | 112 / 81 | 81–141 | 56–63 |
| **1000** | **79 / 53** | **58–99** | **41–47** |
| 760 | 61 / 47 | 43–75 | 31–34 |
| 540 | 44 / 33 | 31–53 | 22–26 |

**1000 was chosen**: every gun at forty seconds or more from its best place, so 0260's *"I only saw
about 50% of their attacks"* holds for every loadout. The shuriken's fight is longer than it was, 43
to 79 at the median; the pulse's comes from 158 to 129 there and from 81 to 58 on the head's lane; the
arc's from never finishing to 45.

## Why a guard changed rather than the number

0260's floor computes a fight as `health × toughness / FASTEST`, where `FASTEST` is every shot of the
fullest loadout counting in full. At 1000 it reads 30.8 seconds, and the flown fight's quickest is
41. **Armour is an arrival that counts for nothing, so the premise is false by construction** — and it
was already wrong before this change, green over a shuriken that killed the serpent in 32. The line
now skips a boss whose chain passes less than it takes, and `tests/serpent.test.ts` holds the same
forty seconds and eight volleys in the fight itself, through `scripts/weigh-boss.mjs`, over the
quickest of every gun from every place. [0192](0192-a-guard-holds-an-invariant.md): changed, and this
is why.

## What the instrument found elsewhere, and did not act on

The other six real bosses, flown on this branch at their own health on `savior`: seconds, median /
best over the held places.

| boss | pulse | arc | shuriken |
|---|---|---|---|
| hellkite | 42 / 41 | 60 / 59 | **17 / 16** |
| quetzal | 103 / 91 | 68 / 60 | 36 / 35 |
| gyre | 122 / 110 | 75 / 64 | 45 / 43 |
| hoarfrost | 147 / 135 | 90 / 75 | 54 / 52 |
| hydra | 104 / 80 | 75 / 73 | 37 / 30 |
| medusa | 121 / 76 | 100 / 81 | **429 / 228** |

⚠️ **0260's line reads every one of them as forty seconds or more, and three of them are not, flown**
— the hellkite, the quetzal and the hydra, each to the shuriken. The shuriken spans sixteen seconds to
four minutes across the roster. That is a finding about the
whole game and a question for the person holding the controller, not a change this report asked for —
[0280](0280-a-cheap-mechanism-does-not-rename-the-ask.md). It is recorded here and pointed at from
`docs/state-of-play.md`; nothing is tuned.

## What is held, and where

| claim | where |
|---|---|
| a shot on the serpent's flank stops, sparks, takes nothing off the head, and the flank does not flash | `tests/serpent.test.ts`, driven |
| a body that authors a share spends that share on the head | `tests/serpent.test.ts`, on the serpent's row wearing half of one |
| a void beside the bolt's line leaves it alone, and its target is struck | `tests/serpent.test.ts`, driven |
| a void on the line still takes the bolt, and the thing behind it is left whole | `tests/serpent.test.ts`, 0292's guard with the drifter moved behind the blast |
| flown at the cap on `savior`, no gun from any place kills the serpent inside forty seconds, and every phase gets eight volleys away | `tests/serpent.test.ts`, through `scripts/weigh-boss.mjs` |

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0307`:

| broken on purpose | went red |
|---|---|
| the body's share ignored, so every hit on the flank is spent on the head in full again | `0307 — and the body is armour` |
| the armoured flank left flashing hurt for shots that took nothing | `0307 — and the body is armour` |
| the pulse's pairing with armour left without the hit log, so a glance leaves no mark | `0307 — and the body is armour` |
| a void anywhere within the bolt's length taking it again, whether or not it is in the way | `a void BESIDE the bolt's line does not take it` |
| the serpent at 540, where the lightning kills it in twenty-two seconds from its best place | `flown at the cap on the tuned tier` |

Six probes re-anchored and re-run: 0124's and 0236's onto the lines this moved, 0260's onto the
hellkite because its line no longer reads the serpent, 0283's onto the share guard because its break
is now the serpent's intended state, and 0292's onto the search along the line.

⚠️ **AND 0072's, WHICH `npm run prove` FOUND STILL GREEN — AND WHICH HAD SAID IT WOULD BE.** Its guard
hears the serpent's death through a real speaker, and 0283 had moved its break onto the body's sweep
because the sweep landed the killing blow; its own note said a boss the body did not get to first
would need the head's half probed. Armour is that boss. The break is on the skull's collision again,
and went red.

**Not photographed.** The bench fits the base gun whatever it is asked for, and its parked ship is
dead before the serpent's entrance is over, so a picture of armour at the shipped camera would have
meant building bench features first. The spark is 0227's own flare and the flash is the one every body
wears; what is new is only which of them this flank shows. The play on the branch preview is the check.

## What is owed

- **A play.** Whether the three guns read as even at 1000 is a hand's; every number above is the
  frame's.
- **The other six**, above.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). A row field, a number, a search and
two tests; nothing persisted.
