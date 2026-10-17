# 0614 — The shields come down a tier

**Accepted 2026-10-17.** Amends [0355](0355-a-tier-opens-on-a-shell.md): Savior and Burn's two counts.
Leaves [0447](0447-the-ward-is-a-third-trigger.md)'s ward as the default for a shell of zero, which no tier
has now.

## The ask

> *"I want to change the shielding around as the game is quite hard. Leave Legend difficulty as is; change
> Saviour difficulty to start each level with 1 shield; change Burn to start with 0 shields, but have the
> capacity for each ship to gain up to 3 shields (the behaviour that saviour has now)."*

## The rule

| tier | `shellOpen` | `shellCap` | was (0355) |
|---|---|---|---|
| Legendary Pilot | 3 | 3 | 3 and 3 — unchanged |
| Savior of the Galaxy | **1** | 3 | 0 and 3 |
| Let the Galaxy Burn | 0 | **3** | 0 and 0 |

Two numbers on two rows of `src/content/difficulty.ts`. Every reader was already there: `respawn` opens a life
on `hull + shellOpen`, `advanceLevel` raises the ship to it at a boundary and never lowers it, `takeShield`
stops at `hull + shellCap`, the readout shows `shellCap` sockets, and the mid-boss throws the shield wherever
the cap is above zero.

## What it means in play

- **Savior** starts every level with at least one shield, as asked. A level boundary tops a ship carrying none
  up to one and leaves one carrying two or three alone (0058's carry-forward, 0355's *never lower*).
- **Burn** plays as Savior did: a life opens on the hull, and the mid-boss's shield is thrown again, up to
  three carried. Its opening void (0447) is unchanged — it was asked separately and is not the shield's
  replacement.

## The reading taken, and the one to veto

**A life after a death or a continue opens on one shield on Savior too**, not only a level. `shellOpen` is one
count for all three, which is 0355's own design (*"start with full"* of a death, for Legend), and splitting it
would be a third field for a difference nobody asked for. If a death on Savior should open on the hull, that
is the third field, and it is a small change.

## What happens to the ward

0447's ward pickup — the void or the nova, thrown by Burn's mid-boss in the shield's place — is now thrown by
no tier. The rule that throws it (`offeredAs` in `src/app/frame.ts`) is kept, because it is the default for
any shell of zero and a ship row may say its own count (`shellCapFor`, [0609](0609-the-ball-takes-its-knocks.md)).
The ward's two charges are still reached the other way 0447 built: a shield taken at a full shell.

Kept rather than deleted is the cheaper call and the reversible one; if the player wants the ward pickup
gone, that is its own change.

## What guards it

- `tests/tier-shell.test.ts` **THE ASK** names the five counts the player gave, and is probed in
  `scripts/probes/0614-the-shields-come-down-a-tier.mjs`.
- The mid-boss drop guard there drove the withholding on Burn; with no tier at zero it now also drives a
  `SHELLESS` row — Burn's numbers at 0355's old cap — so the rule is still run and 0355's probe of it still
  goes red.
- The cap guard (*a shield never raises health past the tier's full shell*) drives `SHELLESS` too: with every
  tier at `MAX_SHIELDS`, 0355's probe of a cap read off the ceiling went STILL GREEN until it did.
- **One 0355 probe is retired**: the readout sized by `MAX_SHIELDS` rather than by the tier. No tier or ship
  has another cap, so a browser cannot tell the two apart; the guard stays and the probe file says why.
- Every other shell guard reads the rows and needed nothing: `tests/difficulty.test.ts` still holds that a
  harder tier opens on no more and carries no more (3 ≥ 1 ≥ 0, and 3 = 3 = 3).

**Owed: a play of Savior and of Burn.**
