# 0577 — The tubes are full

**Accepted 2026-10-07.** Item 3a of [`the-arms-planned`](../../reports/the-arms-planned-2026-10-07.md):
the run's half of the tubes. **Supersedes [0083](0083-two-ladders-of-four.md)'s tubes ladder** and
[0233](0233-a-weapon-is-a-kind-and-a-pickup-cycles.md)'s one tube kind for every tube with the switch
that re-fitted them. **Keeps [0373](0373-a-special-is-the-guns-own.md)**: a missile pickup with nowhere
to go is a charge of its face's surge. Cosmo's selling tubes and the hangar fitting them is item 3b.

## The ask

> *"let's remove the missile upgrades, you either have full tier missiles or you don't."*

> *"you can buy 1-2 of both homing and regular missiles and equip them how you want on a ship -> 1
> homing, 1 regular, 2 homing, 2 regular etc"*

> *"if a player hasn't bought the missile tubes, then they need to collect the missile powerups in game
> - the first two missile powerups lock in their tubes. any following missile powerups give them the
> supercharge missile ability (the current in game one that already works)"*

## The rule

**A ship carries a list of tube kinds, top tube first, two at most. A fitted tube fires at the full rate
from the moment it is fitted.**

| | |
|---|---|
| **the run** | `tubes: MissileKind[]` where it held `upgrades` (a ladder of four rungs) and `missile` (one kind for every tube). `begin` opens on the tubes it is handed — none, today, until 3b — clamped at two |
| **a missile pickup** | while a tube is empty, `upgraded` fits the kind its face shows into the next one and leaves the others alone (`tubeRoom`); with both fitted it is a charge of its face's surge, overdrive or hunt (`effectOf`, `specialOf`) |
| **the weapon** | `weaponFor(ship, tubes)`: `launchers` is the list's length, `tubes` the kinds, and every tube fires on one clock, `MISSILE_BEAT_RATIO` times the slower fitted row's note value — the old ladder's top rung, 4, so a volley every twenty steps |
| **a volley** | one cue and one clock, and each tube its own kind's missile — its shot, its damage, its hunt and its fuse (`fireMissiles`) |
| **a death, a continue, a clear** | keep the tubes, as they kept the ladder (0372) |

## Why it is built the way it is

**A list of kinds and not a count and a kind.** *"1 homing, 1 regular"* is two kinds on one ship, which
one `missile` field cannot say; the length of the list is the count, so there is one fact and not two
that could disagree. The hull is drawn by the count as it always was (`hullFor`), and the top tube is
the first because 0097 put the first tube on top.

**The rate is the old top rung, from the first tube.** *"Full tier"* is what the ladder's last rung was:
a volley every twenty steps. A first tube used to fire every forty and a second tube every forty until
two more pickups stepped the rate; now both fire every twenty. That is a stronger early ship by design,
and every boss fight was re-checked at it — see below.

**The surge is the face's, not the fitted tube's.** 0373 spent a full ladder's pickup on the fitted
kind's special because a switch could only happen on a different face; with no switch, a full rack's
pickup is the face it shows: *"any following missile powerups give them the supercharge."*

**No ship carries a tube of its own any more.** `ShipRow.missile` said which kind a run's ladder opened
on; a run opens on what it is handed, and a pickup fits the kind it shows.

## What it costs

- **The early tubes are twice as fast.** The fights are solved at the loadout a run carries in
  (`carriedAt`, 0406, 0575): a drawn place is a third of a tube, a mid-boss's drop a tube, floored and
  capped at two. Every mid-boss is still inside 0269's three seconds and every end boss's floors hold.
- **The desk's *tier* slider is the number of tubes**, nought to two (`rig/transport.ts`); `hear.mjs`'s
  middle take is one tube, renamed with it.
- **Twenty-two probes** anchored on the ladder: re-anchored where the rule survives, retired with a note
  where it was the ladder's — 0083's rate ladder flattened, 0159's slower rung.

## Rollback

None needed — the run is not saved, and no storage key or save field is touched. 3b adds the save.

## What guards it

`tests/run.test.ts`: a pickup fits the next empty tube and a full rack takes no third; a run carries in
the tubes it is begun with, two at most; a death, a continue and a clear keep a mixed rack in order.
`tests/missiles.test.ts`: a tube is full from the moment it is fitted; two tubes of two kinds fire their
own missiles in one volley; a full rack lands on the floors. `tests/shields.test.ts`: two tubes and then
a surge, on every face, and the changeover exactly where the tubes stop changing the ship. Probes in
`scripts/probes/0577-the-tubes-are-full.mjs`.

## Owed

- A play: whether a first tube at the full rate makes the opening of a run too easy.
- Item 3b: Cosmo's sells the tubes, and the hangar fits them.
