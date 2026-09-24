# 0337 — The gyre falls out of the wall

**Accepted 2026-09-18.** **Amends [0062](0062-a-boss-dies-loudly.md)** — a boss's death is still a
beat with a burst and a cue, and the gyre spends both on a landing rather than on the step its health
ran out. **Amends [0335](0335-the-fight-happens-in-a-room.md)** — the room the fight happens in now
has a way out of it, and the camera comes back up on the number the wall parts on. **Builds on
[0332](0332-the-gyre-is-set-into-the-wall.md)** — a thing set into a wall is a thing that can come out
of one, and that is the whole of this.

## The ask

> *"When it dies, instead of exploding, have it fall out of the wall and crash down into the floor,
> and then the far right wall opens so the player can fly onwards."*

## The rules

**A boss may author a wreck instead of a clear.** `BossRow.wreck`: `gravity`, `tumble`, the
`wreckage` it wears on the floor, and the `settle` it lies there for before anything else happens.
Thirteen rows say `null` and go the way they went — [0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md)
is the reason this is a row and not a rule, and the reason the death is a *feature of the gyre* rather
than a new way every boss ends.

**The wreck is the same hull, in the same pool, wearing what it died in.** Not a prop spawned where
the boss vanished: the thing coming out of the wall has to be the cog they were just fighting, so it
keeps the pool, the bitmap the last phase put on it, the turn it was pointing, and the fire it caught
under [0336](0336-the-wheel-comes-off-its-post.md). Everything that would otherwise still be true of a
boss in that pool is gated on `bossBeaten`: it is not driven, and **nothing may shoot it**.

**The floor is the far wall's own face, taken at the rim.** The same number
[0335](0335-the-fight-happens-in-a-room.md) stands the room's walls on, less the hull's radius. A
wreck resting on that face *by its centre* is half inside the masonry, and a wreck resting anywhere
else is lying in the air — both are visible, which is why the guard measures the rim and the probe
breaks it by exactly one radius.

**The crash gets its own beat, and the way out comes after it.** Land, burst, cue, lie there for
`settle`, then the far wall parts from the middle outward over `Room.opens`, and only then is the
level cleared. A wall that began parting on the step the hull touched down would make the landing and
the exit one event, and neither would be read.

**The world holds still until the wall begins to part.** `scrollFor` holds the room shut on
`roomOpen`, so the camera coming back up and the way out opening are one gesture rather than two that
nearly agree — the fight's own `beaten` test is `bossBeaten && (wreck === null || roomOpen > 0)`.

⚠️ **The room opening is the invariant; the fall is the decoration on it.** `stepWreck` used to need a
body in the pool to reach the opening, which made *any* path that emptied that pool a sealed room: a
finished fight, nothing alive in it, no wall that would ever part, and no way to lose either. An empty
pool now skips to the opening. The one path that was real is closed as well, but a run that can
neither be won nor lost is not a thing to hold off with a single gate —
[0192](0192-a-guard-holds-an-invariant.md) on which of the two belongs in a guard.

## What the photograph found

[0027](0027-measure-the-picture-not-the-model.md), again, and this time on the third shot of three.
The model said the wreck fell, landed and opened the room; every guard agreed; the picture taken two
seconds after the crash had **no wreck in it and a far wall still solid top to bottom.**

`playerShots` × `bossPool` was still paired over a beaten boss. In the shipped game that is 42 of the
next 47 shots swallowed by a corpse, each one flashing it white and cueing `hit` — untidy, and enough
on its own. On the bench, where the scrub pins the boss's health, it was the whole sequence: the wreck
was killed a second time on the way down, left the pool, and took the room's only opening with it.

Two things were wrong and the photograph showed one shape. **The gate is the fix and the skipped
opening is the repair of the class** — the bench found this because the bench could get the pool into
a state the game could not, and the next thing that can do that will not be a bench.

⚠️ **And the bench could not photograph a death at all until this PR**: `#bosshp`'s floor was 5, so
the scrub could take a boss to the edge of dying and no further. The instrument that
[0205](0205-the-bench-jumps-to-where-the-thing-is.md) exists to be had a hole in it exactly where the
thing being built lives, which is worth more than the one-character change that closed it.

## The figures

| | | why |
|---|---|---|
| `gravity` | 0.022 | ≈ 55 steps from the seat to the floor — under a second, and slow enough at the top that the hull is seen leaving its mounting |
| `tumble` | 0.065 | ≈ 3.6 rad over the fall: more than half a turn, so it is out of control rather than being lowered |
| `settle` | 60 | a second on the floor before the wall moves — the crash's own beat |
| `opens` | 90 | a second and a half for the far wall to part, which is `BOSS_DEATH_STEPS` and change |

## Cost

Nine probes, all seen red. Two new guards in `tests/gyre.test.ts` — *nothing may shoot a wreck*,
driven by parking a shot on it every step of the fall, and *the room opens even if the wreck is gone*,
driven by taking the wreck away on the step it appears.

Three probes elsewhere re-anchored (0247, 0306, 0335) — [0019](0019-a-probe-must-be-seen-to-apply.md)
caught all three before the suite ran.

## What is not held

**Whether the fall reads as a fall.** It is photographed, and a photograph is not a play. The tumble
rate and the gravity are the two numbers most likely to move on a verdict.

**Whether the pause is the right length.** A second on the floor and a second and a half of wall is
two and a half seconds between the last shot of a fight and flying again. That is an ear-and-eye call,
not a measured one.

## Amended 2026-09-25 — the wreck does nothing back

Played: *"the 4th floor boss will kill you with its corpse."* `layWreck` said the wreck does nothing
back, and the player's fire at it was gated on `bossBeaten`; the ship's contact with `bossPool` was
not. The wreck kept its hull's damage, killed on touch where it landed on the edge of the box, and
killed again as the room opened and it slid back through the box.

**The ship × `bossPool` pairing is gated on `bossBeaten`**, like every pairing that shoots at it. The
wreck is the only boss left in the pool after its death, so the gate touches nothing else. Held by
`tests/gyre.test.ts` — *a wreck does nothing back*, which parks the ship on the wreck every step from
the death until the room is open. Probe: *the ship left colliding with the wreck*.
