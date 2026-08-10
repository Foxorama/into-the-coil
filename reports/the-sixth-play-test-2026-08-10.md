# The sixth play-test — 2026-08-10

**Five items, given after playing the build carrying 0097, 0098 and 0099** — the first three of the
four the fifth play-test asked for. Written down because
[0029](../docs/decisions/0029-the-tracked-record-is-the-record.md) says a report is a committed file.

⚠️ **ONE OF THEM IS A DEFECT AND IT IS THE MOST SERIOUS THING THIS PROJECT HAS SHIPPED** — levels two
through seven have had no pickups in them at all, and the difficulty dial has been climbing as though
they did. [0100](../docs/decisions/0100-a-level-places-its-pickups-too.md) has the measurement.

⚠️ **AND THE REPORT ASKED THE RIGHT QUESTION ABOUT THE GUARDS**, which is the more valuable half:
*"our tests and guards seem to not be doing a great job."* They were all green. 0100 has why, and it
is not carelessness — it is that every pickup guard in the repository runs level one, where the
missing term is arithmetically invisible.

---

## The five, in the player's own words

**1 — The sky is faster and still not fast enough.**

> *"OK well, the sky moves a bit faster, but it still needs to move much more faster."*

⚠️ **A partial pass on [0097](../docs/decisions/0097-the-sky-has-layers-and-the-tubes-have-sides.md)**,
which predicted this exact outcome in its own *What this does not settle*: *"the streak layer is the
first thing in the sky that has never been flown at all… if still too slow comes back, there is one
notch left and then the answer is the camera rather than the sky."*

**2 — The bosses hold half the screen.**

> *"The bosses come too far into the screen, they come into 50% and then basically float at that
> level and it doesn't give the player enough space to respond."*

⚠️ **A boss's `station` is 110–120 units and has not moved since it was sized against a 150-unit
view.** [0080](../docs/decisions/0080-the-box-is-the-screen-and-the-screen-is-16-9.md) widened the
narrowest view to 177.8 and the stations were never re-sized, so what was *far enough forward* is now
the middle of the screen. Same shape as items 5 and 6 of the previous play-test: a previous fix left
something standing.

**3 — The music is still flat.**

> *"The background music is still flat and lifeless, has no depth, no pace, no increased tempo."*

⚠️ **Not a repeat report.** Item 2 of the fifth play-test is the same subject and has not been built
yet — it is the fourth of that list's four, and the first three are what this build carries.

**4 — The player's own guns are too thin.**

> *"Guns and rockets for the player need a deeper bassy tone still as they're too tinny and don't mesh
> with the background music well."*

⚠️ **A partial pass on [0099](../docs/decisions/0099-the-cues-are-in-the-key.md), and it moves the
subject.** 0099 put the pulse and the missile on notes of the key; the report says the notes are right
and the BODY is not, which is
[0089](../docs/decisions/0089-a-cue-has-a-body.md)'s subject arriving at the two cues 0089 spent least
on. *"Too tinny"* is 0089's own word for what it fixed everywhere else.

**5 — No power-ups after level one, and a scatter the player cannot reach.**

> *"Also our tests and guards seem to not be doing a great job because I didn't get a single power up
> after level 1."*

> *"And on player death the powerups can go to section on the left side of the screen, where they are
> visible but the player cannot get to them."*

⚠️ **Both confirmed in the code before anything was built**, and the first was measured by driving a
real level boundary:

```
at the boundary: camera 1800, levelOrigin 1800
  pickup 1: along=260,  camera=1801, inView=-1541
pickups spawned in level two: 9 — steps any were on screen: 0
```

## What the guards were doing, since the report asks

⚠️ **Three things at once, and none of them is inattention:**

1. **Every pickup guard runs level one**, where `levelOrigin` is zero and the missing term is
   invisible.
2. **The level boundary is driven by the shell**, so a `GameFrame` fixture never crosses one.
   `advanceLevel` is exported and no test had ever called it.
3. **The guards that exist are about the TABLE** — that waves ascend, that nothing leaves the roam
   band, that the boss comes last. All true of the content and all blind to where the content is put.

⚠️ **The same three would have hidden the same mistake in any future spawner**, which is why 0100's
guard drives all seven levels at a non-zero origin rather than fixing the one that was reported.

## What this round has cost, and it is worth stating

⚠️ **Levels two to seven have never been played as authored.** No pickups, and a dial that climbed for
weapons that were never shown. Every impression anyone has of those levels — pacing, difficulty,
whether the curve works — is an impression of a different game.

## What is not in this report

**No verdict on 0098.** The enemy figure and the three bullets went unmentioned, which
[the-batch-flown](the-batch-flown-2026-08-08.md) records is not the same as *seen*.
