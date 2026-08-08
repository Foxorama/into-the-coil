# The death beat, mapped — 2026-08-08

**An investigation with a result and no code.** Chunk 2 of
[`the-third-play-test`](the-third-play-test-2026-08-08.md) — *"when a player dies, they instantly
respawn, there needs to be the player ship explosion, a pause, then a respawn. This also needs to
happen before the 'continue' screen shows up as well."*

⚠️ **It is written down because the work was scoped, understood and then NOT started**, and the
reason is worth as much as the map: it is a change to the order of the step, not an addition to it,
and starting one of those with a third of a session left is how a half-gated player section ships. The
constitution's own words — *"implement properly or stop: 'this cannot be done cleanly because X, here
is what I would do instead' is a result."*

**Everything below was read out of the code on 2026-08-08, at
[d772e7e](https://github.com/Foxorama/into-the-coil/commit/d772e7e).** Line numbers are not given;
the names are, because names survive an edit and numbers do not.

---

## What happens today, in order

`GameFrame.step` in `src/app/frame.ts`, at the end of its collision section:

```
if (w.ship.health <= 0) {
  burst(w, w.ship.along, w.ship.across, BURST.ship);
  w.onCue('death');
  w.onDeath();
}
```

and `world.onDeath` in `src/app/mount.ts`:

```
scatterUpgrades(world, state.run.upgrades);
dispatch({ slice: 'run', type: 'lifeLost' });
if (state.run.lives > 0) respawn(world);
```

**So the explosion, the scatter, the lost life and the new ship all happen on one step.** There is
one burst — a single `BURST.ship` — and then a ship at `SHIP_START_ALONG` with
`RESPAWN_INVULN_STEPS` on it. That is the whole of the report: the player never sees the death,
because the replacement is already there on the next frame the screen is drawn.

⚠️ **The continue screen is the same step again, one layer down.** `src/state/root.ts` holds the
cross-slice rule *a run with no lives left is over, and the screen has to say so*:

```
if (state.run.lives <= 0 && state.screen.current === 'playing') …
```

It fires on the `lifeLost` dispatch, so on the last life the overlay is up before the burst has drawn
a single frame. **Both halves of the report are one cause.**

## The shape the answer wants

⚠️ **[0062](../docs/decisions/0062-a-boss-dies-loudly.md) already built this exact mechanism for the
boss and it is the model to copy.** `stepBossDeath` is a counter (`clearedIn`), a pulse of bursts
every `BOSS_PULSE` steps at a remembered place, and **one report at the end**:

```
if (w.clearedIn === 0) w.onCleared();
```

The player's death wants the same three parts — `dyingIn`, a pulse, and `w.onDeath()` moved to the
end of it — plus one thing the boss did not need.

⚠️ **The place must be remembered as a CAMERA OFFSET, not a world position**, which is the mistake
0062 documents having made: `bossOffset` exists because over 1.6 seconds the camera covers 54 world
units, so a world position puts the explosion visibly behind where the player watched it happen. A
death beat needs `deathOffset` and `deathAcross` for the same reason — **and `scatterUpgrades` must
read them too**, or the pickups appear a beat's worth of scroll behind the wreck.

## Why it is not a small change: the ship has to stop existing

`w.ship` is a single entity spawned once at mount (`CAPACITY.ship` is **1**) and never released. It
is in `w.shipPool`, which is in the `layers` array the painter walks. So for the beat to show a
*destroyed* ship rather than a stationary one, the ship has to leave the pool — and **everything in
the step that touches `w.ship` then has to be gated on its absence.**

The sites, in step order:

| | what breaks if it is not gated |
|---|---|
| `flyShip(w.ship, …)` | the player flies a ship that is not drawn |
| `askSpecials` → shell → `launchSpecial` | a bomb thrown from a dead ship's muzzle |
| `fireShip`, `fireMissiles` | a wreck keeps shooting |
| `stepShields` | the shell rebuilds around nothing |
| the four `collideIntoOne(…, w.ship, …)` calls | **the worst one** — a dead ship keeps taking hits, health goes further negative, and `w.ship.health <= 0` fires again every step: repeated bursts, repeated `onDeath`, repeated lives lost |
| `collectInto(w.pickups, w.ship, …)` | a wreck collects the scatter it just threw |
| the `w.shownHealth` / `onHealth` report | the HUD flickers against a ship that is not there |
| the `w.ship.health <= 0` check itself | as above |

⚠️ **The honest gate is `w.shipPool.size === 0`, not a boolean flag.** *There is no ship* is a fact
the pool already holds, and a second field saying the same thing is the shape of drift this project
keeps paying for — `src/sim/entity.ts` makes the identical argument three times over (`steerAcross`,
`holdFor`, `turnsLeft`: *no sentinel is needed and none is defined*).

⚠️ **`respawn` then has to re-spawn into the pool**, and it is safe to assume it gets the same object
back **only because the capacity is 1** — that assumption is worth a line of comment and a guard, not
a shrug.

## The numbers nobody has chosen

Neither of these has a hand behind it and both want one, on
[0037](../docs/decisions/0037-the-ship-has-mass.md)'s terms:

- **How long the beat is.** The boss gets 96 steps (1.6s), sized for *a thing coming apart*. A death
  is a smaller event and the player is waiting through it, so it is probably shorter — but a beat
  short enough not to annoy may be too short to read as a pause at all, and that is a play-test
  question rather than an arithmetic one.
- **Whether the scatter throws at the START of the beat or at the end.** Throwing at the start means
  the pickups fly out of the explosion, which is the picture the words describe. Throwing at the end
  means `onDeath` stays one indivisible thing and the ordering constraint 0066 documents — *the
  scatter must run before the reducer that empties the list* — needs no second statement. **The first
  is the better picture and the second is the safer code**, and the choice has not been made.

## What must not be broken on the way

- **[0057](../docs/decisions/0057-a-death-does-not-rewind-the-level.md): the field survives a death.**
  The beat must not freeze or sweep anything. 0062's own words for the boss version — *"the simulation
  keeps running through it, so the beat is a beat rather than a freeze"* — are the requirement here
  too: the scroll continues, the waves keep arriving, and whatever killed the player is still there
  when the new ship appears.
- **`RESPAWN_INVULN_STEPS` is sized against that.** `src/app/frame.ts` records that a respawn
  invulnerability is not a hit's, *because the field survives a death* — a ship the player is not yet
  holding arrives in a lane still full of what killed them. A beat that delays the respawn by a second
  moves where in the wave that arrival lands, so the number is worth re-reading rather than assumed.
- **[0067](../docs/decisions/0067-a-new-run-opens-on-an-empty-field.md)**: `dyingIn` has to be reset
  by `resetScene`, or a new run opens mid-beat. That decision exists because exactly this kind of
  field was missed once already, and the suite could not see it —
  [`the-sweep-that-served-two-rules`](the-sweep-that-served-two-rules-2026-08-07.md) is the
  post-mortem.

## What a guard for it has to measure

⚠️ **In the player's units, per
[0027](../docs/decisions/0027-measure-the-picture-not-the-model.md)** — and there is a specific trap
here, because the obvious assertion is a step count and a step count is the constant being guarded.
The claims that are about the picture:

- **the ship is not drawn for at least N frames after the hit lands** — `w.shipPool.size` over time,
  in seconds
- **the continue screen does not appear on the step the last life is lost** — driven through the
  shell, because the rule lives in `src/state/root.ts` and not in the frame
- **the explosion is where the player watched the ship die**, in world units ahead of the camera —
  the assertion 0062 needed and the one a world position silently fails
- **nothing fires, collects or is hit while there is no ship** — one guard per gate above, and the
  collision one is the one that matters

⚠️ **And a probe per gate.** Six of the eight sites in the table produce a game that looks completely
normal in a screenshot, which is the condition
[0019](../docs/decisions/0019-a-probe-must-be-seen-to-apply.md) exists for.

## What this report does not settle

**Nothing here is a decision.** The two open numbers above are the player's or a play-test's, and the
gate design is a proposal that has not been written against the code.
