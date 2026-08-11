# 0120 — A rung may close a layer, and 0090's additive rule is gone

**Accepted 2026-08-11.** Asked for outright: *"get rid of 0090's additive rule."*

**It supersedes the last standing half of [0090](0090-the-music-is-four-loops.md)'s
*"intensity is nothing but their four gains"*.** 0090's loop architecture — sample-locked whole
multiples started on one timestamp — is untouched and is still the thing everything rests on.
[0114](0114-the-fight-is-a-different-piece.md) took the fight out of the additive rule; this takes the
level out of it.

## The rules

**A rung may close a layer, and only one it has declared.** `RUNG_CLOSES` is a table over
`MusicLevel`, on exactly `TITLE_ONLY`'s and `LEVEL_ONLY`'s terms.

**Every declared closure must actually happen** — open below, zero here, member by member.

**A rung that closes must open more than it closes.** The level goes somewhere on the way up; a
section boundary made by subtraction is a piece thinning out.

## Why the rule had to go, and it is arithmetic

Reported from play, of the build carrying [0117](0117-a-section-change-lands-on-the-beat.md):

> *"The push is a noticeable change in musical variation, the surge and then the approach are less
> noticeable because the ongoing beat and melody is strong and the additions are subtle."*

⚠️ **THAT IS NOT A MIXING FAILURE, IT IS THE ONLY THING AN ADDITIVE LADDER CAN DO.** By construction
it produces *the same thing with more on top* — so once eleven layers are playing, whatever the
twelfth is, it is subtle. `push` is noticeable because it opens four layers onto a piece that has
six; `surge` opens three onto a piece that has eleven.

⚠️ **AND [0114](0114-the-fight-is-a-different-piece.md) NAMED THE ANSWER AND DID NOT HAVE THE RULE TO
SPEND IT**: *"a rung that closes a layer as it opens two is a change of arrangement rather than a
thicker one, and it is the only mechanism here that has ever read as a section boundary."* It also
recorded the player calling the rule itself: *"so there's a problem in 0090 — if it's restricting the
music, it's a problem and not a good rule."*

⚠️ **Four rounds of one session were spent adding layers to make the boss louder, and every one made
the report more true.** That is the cost of the rule, already paid once.

## The one consumer, and it is a replacement rather than a removal

⚠️ **`surge` CLOSES `call` AS IT OPENS `counter`.** The tune that has been running since `run` stops,
and a counter-melody takes its place. **The ear is handed a different tune rather than another one on
top** — which is what a section boundary is.

⚠️ **`call` LEAVES `LEVEL_ONLY` BECAUSE IT IS NO LONGER THE FIGHT THAT CLOSES IT.** The list is what
the boss takes away; `call` is gone two rungs earlier now, and a name left in that list would be a
rule that has stopped describing the music — the exact class
[0113](0113-there-is-one-composition-and-seven-levels.md) found seven decisions of.

⚠️ **It also gives back the thing the player already liked.** *"The tune kickin around 52 secs is
great"* was said about `call`; it now has a span rather than playing under everything for the rest of
the level.

## What replaces the rule is more structure, not less

| was | is |
|---|---|
| a layer open below is open here, always | …unless `RUNG_CLOSES` names it |
| — | a declared closure must be open below and silent here |
| — | a rung that closes must open strictly more than it closes |
| each rung strikes more notes a bar than the one below | unchanged, and it is what stops a closure thinning the piece |

⚠️ **The note-density guard is the one that carries the weight now**, and it already existed. A sum of
gains was retired as a loudness proxy by 0114 for the fight; for the level, *"how much is happening"*
is a count and it survives a rung swapping material rather than stacking it.

## What was rejected

**Letting a rung close anything, with the density guard as the only check.** It is a hole: a layer
would go silent because somebody typed a zero in a row of twenty-three numbers, and nothing would say
so. `TITLE_ONLY` and `LEVEL_ONLY` are lists for that reason and this is the third.

**Closing `arp` at `approach` as well.** It is the obvious second consumer and it is a taste call about
material nobody has heard yet. **One mechanism, one consumer** —
[0084](0084-the-dial-is-the-level-and-the-guns.md)'s shape — so the next verdict is attributable.

**Answering the report with another gain.** 0114 said in as many words that the next attempt must not
be one, and this is the second decision in a row that is not
([0117](0117-a-section-change-lands-on-the-beat.md) was the first).

## Confirmed, not assumed

| broken on purpose | went red |
|---|---|
| the closure undeclared, so a layer can go silent because somebody typed a zero | `opens a layer at every step and never opens one twice` |
| a rung declared to close something it plays, so the list has stopped describing the piece | `opens a layer at every step and never opens one twice` |
| a rung that closes a layer and opens nothing, so the level gets thinner on the way up | `opens a layer at every step and never opens one twice` |

⚠️ **AND TWO OLDER PROBES WERE STRANDED BY THE `surge` ROW CHANGING**, in 0090's and 0104's files.
`prove` refused the whole run before copying a tree — [0019](0019-a-probe-must-be-seen-to-apply.md)
working, and the second time in two days that an anchor sat inside something that grows. Both
re-anchored.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). A table, a guard and one gain set to
zero. No storage key, no save schema, no cache prefix, no origin.
