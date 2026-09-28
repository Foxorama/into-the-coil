# 0406 — A mid-boss is met armed

**Accepted 2026-09-28.** A mid-boss's health is solved at the loadout the run has handed a player by
the time they reach it — read off the level scripts, which from the second level on is the cap — and
not at one rung of each. Every mid-boss is two to four times the health it was, and the fights are the
seventeen to twenty-three seconds [0269](0269-a-mid-boss-is-fought-for-as-long-as-its-level-says.md)
asked for, at the ship that actually flies them. **Amends 0269**, which solved at one rung and held
*"a speed bump at a full loadout"*, and **[0247](0247-a-level-has-a-mid-boss-and-a-real-one.md)**,
whose ordering of every mid-boss under every end boss is deleted.

## The ask

> overall the bosses were dying a bit fast, fish boss on level 2 seemed to have a decent pass with full
> shurikens, but other bosses were very quick, inc minibosses

## What was measured

`scripts/weigh-fight.mjs`, each level walked through the real frame to its mid-boss and the fight flown
out, the ship immortal and holding the boss's lane:

| level | mid-boss | asks | at one rung (0269) | at the cap, pulse | at the cap, shuriken |
|---|---|---|---|---|---|
| Approach | sentinel | 17 s | 14 s | 7 s (two rungs) | 9 s |
| Descent | harrow | 18 | 18 | 7 | 6 |
| Coilward | shoal mother | 19 | 20 | 7 | 5 |
| Shoal | lattice | 20 | 19 | 6 | 5 |
| Batteries | redoubt | 21 | 22 | 9 | 10 |
| Gauntlet | chorus | 22 | 21 | 8 | 5 |
| Eye | axis | 23 | 23 | 7 | 7 |

**The report was right, and the cause is not the numbers — it is the loadout they were solved at.**
0269 solved every mid-boss at one weapon rung and one missile, on *"a level authors one weapon near its
start"*. But a clear carries the ladders into the next level
([0039](0039-a-run-is-lives-and-a-death-costs-the-arsenal.md)), and since
[0372](0372-a-death-keeps-the-ladders.md) a death does not take them either. Walking the run's pickups
in order, a player who takes them meets the first mid-boss at two weapon rungs and one missile and every
later one at four and four. So every mid-boss from the second level on was fought by a ship about three
times as strong as the one its health was solved for, and ran six to nine seconds against the twenty
the play asked for.

## What changed

**`carriedAt(level)` in `scripts/weigh-fight.mjs`** is the loadout: every earlier level's pickups and
its mid-boss's drop, then this level's up to its mid-boss, clamped at the ladder. It is read off the
scripts rather than written down, so a pickup moved in any level moves the loadout every guard is asked
at. `scripts/solve-mid-health.mjs` solves at it, and `tests/midboss.test.ts` measures at it.

**The healths**, four passes of the solver — the map is far from proportional at two to four times the
health, so the first pass landed at 11 to 17 seconds — and a fifth read back, each inside a second:

| mid-boss | was | now | measured |
|---|---|---|---|
| sentinel | 42 | **120** | 17 s of 17 |
| harrow | 66 | **277** | 18 of 18 |
| shoal mother | 50 | **229** | 18 of 19 |
| lattice | 32 | **187** | 20 of 20 |
| redoubt | 158 | **541** | 21 of 21 |
| chorus | 97 | **419** | 21 of 22 |
| axis | 164 | **699** | 23 of 23 |

**Solved on the ship's own gun, the pulse, as before — and the shuriken does not follow it.** At the
old healths the two agreed to within a few seconds; at the new ones, flown the same way:

| mid-boss | pulse (solved) | shuriken |
|---|---|---|
| sentinel | 17 s | 27 s |
| harrow | 18 | 11 |
| shoal mother | 18 | 11 |
| lattice | 20 | **35** |
| redoubt | 21 | 17 |
| chorus | 21 | 14 |
| axis | 23 | 20 |

The spread is the finding. A fight that runs nine seconds is mostly the blades' first burst; one that
runs twenty is the ceiling ([0391](0391-a-target-takes-a-blade-so-often.md)) and how much of the hull
the blades cross as it patrols — the lattice's wide patrol most of all. **Solving per gun is refused
here**: a mid-boss has one health, and which gun it is tuned for is the play's call, not the solver's.
This table is what that call is made from. **The arc** reads worse still, and is below.

**`weighFight` takes a `gun`**, and throws if the loadout changes mid-walk — a pickup on the field is
the shell's to fit, so the loadout asked for is the one flown, and that is now held rather than assumed.

## ⚠️ What was deleted, and why

- **"At a full loadout it is still a speed bump" — three to twelve seconds at the cap.** It held 0247's
  *"a mid-boss over in seven seconds at max weapons IS the miniboss"*, a sentence about a fight met at
  one rung that got easy as the ladders filled. From the second level the fight is MET at the cap, so
  that guard and 0269's own were asking for seven seconds and twenty of the same fight, and the play
  answered which. Its floor — never deleted on contact — is the phase floor, now asked at the loadout
  that deletes fastest. 0269's probe for it goes with it.
- **"Every mid-boss under every end boss"** in `tests/bosses.test.ts`. It ranked the toughest mid-boss
  against the weakest end boss across levels: the axis, met at the cap on the last level, against the
  serpent, met on the first. Solved honestly the axis is 699 and the serpent 700, so it passed by one,
  and a pass by one is the next re-solve reddening a correct table. Health across two different fights
  is not a quantity a player compares, and a guard ranking every instance against every other on one
  channel is the content limiter [0295](0295-a-ranking-guard-is-a-content-limiter.md) names. **A
  mid-boss under its own level's end boss** stays, in THE ROSTER, and 0247's probe now breaks that.
- **`tests/fight.test.ts` keeps one rung**, with the half of its argument that was false taken out: one
  rung is no longer *what the fight is met with*, and it is still *the slowest kill*, which is the case
  that decision's report was about.

## The guards, and that each was seen to fail

`THE REPORTED ONE` in `tests/midboss.test.ts`, now at `carriedAt`, and two breaks in
`scripts/probes/0406-a-mid-boss-is-met-armed.mjs`:

| broken on purpose | went red |
|---|---|
| the mid-boss measured at one rung of each again, rather than the loadout the run carries in | `THE REPORTED ONE: a mid-boss fight lasts what its level asks` |
| the loadout forgetting every earlier level, as though a clear reset the ladders | `THE REPORTED ONE: a mid-boss fight lasts what its level asks` |

**Re-anchored**, on only what they break: 0269's sentinel and redoubt healths, 0247's axis.

## Not held by any guard

**The arc against a mid-boss.** Flown through the same walk at the cap, the arc took 16 to 103 seconds
where the pulse and the shuriken took 5 to 10, and against an end boss in `weigh-boss` it reads with
the others. One gun reading wildly against the rest is a question about the instrument before it is a
finding about the gun: the arc chains to the nearest bodies, and in the level walk there are waves
around the mid-boss that the end-boss arena does not have. **Not measured further, and owed** — if the
arc really spends its bolts on the adds, a mid-boss on the arc is now a long fight.

**The end bosses are unchanged.** Flown in `weigh-boss` with the missiles silenced, every one runs 25 to
150 seconds on each gun at the cap, and the fish the report liked runs 39. The report's *"other bosses
were very quick"* is answered by 0405 — the surge's second pod — and by this, and the play after both is
the check. If the end bosses are still quick after it, the next instrument is `weigh-boss` with the
missiles and a surge flying.

**The mid-boss healths themselves**, which are the solver's output and play numbers
([0192](0192-a-guard-holds-an-invariant.md)); the seconds are what is held.

No rollback note: no storage key, save schema, cache prefix or origin is touched.
