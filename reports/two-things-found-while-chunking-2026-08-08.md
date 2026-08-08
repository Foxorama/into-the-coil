# Two things found while chunking — 2026-08-08

**Read out of the code while breaking
[`the-third-play-test`](the-third-play-test-2026-08-08.md) into chunks, and acted on in neither.**
Both are about chunk 5 (the pickup taxonomy and its rarity), both would have been discovered the
expensive way, and both change what that chunk costs.

At [d772e7e](https://github.com/Foxorama/into-the-coil/commit/d772e7e).

---

## 1. Merging two pickups into one breaks the cycle, and the cycle is a proved involution

The ask:

> *"rapid fire/rapid missiles rapid whatever else we add need to be combined into one power up -
> which is the weapon change power up… There's just too many power ups for these to be separate
> things."*

`src/content/pickups.ts` has six kinds and a `CYCLE` table over them —
[0052](../docs/decisions/0052-a-pickup-is-two-things-and-the-camera-says-which.md), *a pickup is two
things and the camera says which*:

```
rapid ↔ missileRate      spread ↔ missileSpread      extraLife ↔ shield
```

⚠️ **It is an INVOLUTION over the whole table, and `tests/cycling.test.ts` holds both halves** — every
kind maps to exactly one other, and the map is its own inverse. The file says why in its own words:
*"no kind can be left out — and the second is what stops a seventh pickup being added with nowhere to
go."*

⚠️ **An involution with no fixed point needs an EVEN number of members.** Folding `rapid` and
`missileRate` into one weapon pickup takes the table from six to five, and there is then no pairing
at all: one kind has to map to itself, which is a pickup whose two faces are the same picture, or the
guard has to permit a kind with no partner — which is exactly the property 0052 added it for.

**So chunk 5 is not "delete a row".** It is a decision about what the three pairs become, and the
options visible from here are:

- **five kinds and a fixed point**, permitting `CYCLE[k] === k` for the weapon pickup — cheapest, and
  it puts a hole in the one guarantee 0052 bought
- **four kinds, two pairs** — fold the missile launcher in as well, so *weapon ↔ ?* and
  *extraLife ↔ shield*. It needs a fourth thing to pair the weapon against and the ask does not name
  one
- **six kinds again**, with the freed slot spent on something the arsenal wants — the rear-firing
  upgrade [`medium-played`](medium-played-2026-08-07.md) still has open is the obvious candidate, and
  it keeps the involution intact for nothing

⚠️ **The third is the only one that costs no guarantee**, and it is also the only one that makes the
field *more* complicated — which is the opposite of what the ask is for. Not settled here.

## 2. An upgrade past the cap adds damage, and nothing caps the damage

The ask, stated as an absolute:

> *"max speed auto-fire is way too strong for the current game - when you get max speed nothing is a
> challenge, bosses die in less a second and they are supposed to be tough."*

`weaponFor` in `src/content/pickups.ts` walks the whole upgrade list and spends each one *on the first
thing it still can*:

```
if (upgrade === 'rapid') { const faster = …; if (faster < FASTEST_FIRE) damage++; else fireEvery = faster; }
…
} else if (shots >= MAX_BARRELS) damage++;
else shots++;
```

`fireEvery` has a floor (`FASTEST_FIRE`, 4), `shots` has a ceiling (`MAX_BARRELS`, 4), `launchers` has
a ceiling — **and `damage` has neither.** Every upgrade past every cap is `damage++`, for ever, with
no bound in the function and none anywhere downstream.

⚠️ **That is very likely the whole of the finding, and it is not a tuning number.** At the cap the
ship fires four barrels every four steps; each additional pickup of any kind then adds a point of
damage to every one of them, so the twentieth pickup is worth as much as the fifth and the curve
never flattens. *"Bosses die in less than a second"* has been reported twice —
[`medium-played`](medium-played-2026-08-07.md) is the first — and both times it was filed under the
upgrade curve rather than against this line.

⚠️ **The overflow is DELIBERATE and its reasoning is sound**, which is why it is worth reading before
changing: `docs/game.md`'s *"an upgrade that cannot change the outcome is worse than none"*, quoted in
the source. The bug is not that overflow exists; it is that **the two ends of that sentence were not
both built.** The file's own comment on `RAPID_FACTOR` states the other end explicitly —
*"the other end of that sentence is that the fifth one must not end the game"* — and then the
mechanism that guarantees it for the fire rate has no counterpart for the damage.

**Both halves are available without inventing anything:** a multiplicative approach to a ceiling is
what `RAPID_FACTOR` already does for the rate, and it is the same shape — *always worth taking, never
a win button.*

⚠️ **It interacts with chunk 5's rarity pass and must not be tuned before it.** Making pickups rarer
reduces how far past the caps a player gets, so the two are the same system seen from either end, and
a fix to one measured before the other lands is measured against a build nobody will play.

## What this does not settle

**Nothing here is a decision**, and neither item has been acted on. `docs/state-of-play.md` has the
chunk order; this is the part of chunk 5 that was already known before it starts.
