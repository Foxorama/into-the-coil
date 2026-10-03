# 0477 — The leap is a target

**Accepted 2026-10-04.** Item 3 of [`the-bosses-look-planned`](../../reports/the-bosses-look-planned-2026-10-04.md)
(its 2.3), from the play of the same day:

> *"at end of health, the jumpy animation can't be interrupted, you should be able to damage it fast
> enough to skip the jumpy animation and not be forced through a none-interactable action."*

## What it was

**A leap is the entrance replayed** ([0380](0380-the-fish-has-four-stages.md), reusing
[0313](0313-the-fish-breaches.md)), so it set `bossEntering`, and every damage path refused a boss that
was entering. The arrival's *"untouchable"* was the player's ask for an **entrance**
([0306](0306-the-serpent-coils-in.md)); the leap inherited it by reuse, not by a decision. A fish on its
last point of health leapt, nothing landing on it counted, and the bar hid for it.

## The rule

**A leap is not an entrance.** `bossLeaping` on the world is raised when a leap fires and lowered when
the arrival hands the fish back to its station, and when any boss is spawned.

- **`bossTargetable`** ([0475](0475-the-wreck-can-be-killed.md)) refuses an entering boss only when it is
  not leaping, so every damage path — shots, missiles, whirlpool, blast, rift, storm, nova, the arc's and
  the seekers' targets — reaches a leaping fish. The opening breach still refuses every hit.
- **The bar stays up through a leap.**
- **A fish killed in the air dies there**: the death log puts the burst where it was, the pool empties,
  the clear is armed as for any death ([0062](0062-a-boss-dies-loudly.md)), and the death lowers the
  leap so nothing reads the boss as still flying in.
- **No health threshold skips a leap.** The player asked for agency: being fast enough is the reward,
  and a fish that dies first never gets its leap off.

## What it costs the fight, and the weights that pay it back

A leap used to be about four seconds the fish could not be hurt in, and every fight had at least one.
With them gone the fish died under [0260](0260-a-boss-is-fought-to-the-end.md)'s forty seconds for three
guns. Quickest held place, Savior, `scripts/weigh-boss.mjs`:

| gun | untouchable leap | a target | with the weights |
|---|---|---|---|
| pulse | 42.4 | 41.1 | 41.1 |
| arc | 40.3 | **35.5** | 43.0 (at 1.3; written 1.35) |
| shuriken | 41.5 | **38.9** | 40.9 |
| ray | 40.1 | **39.2** | 40.7 |

**Health could not pay it**: `tests/level.test.ts` holds each real boss's health over the one before, and
the fish at 1400 sits under the pterodactyl's 1410. So the three guns are weighted on the fish —
`gunWeights: { arc: 1.35, shuriken: 0.95, ray: 0.95 }` — on the pterodactyl's pattern
([0441](0441-a-pilot-flies-their-own-ship.md)). The last stage is shorter than the others now — 5.6 to
8.6 s against 0386's ten — and that is the ask: a player fast enough skips the leap.

`tests/boss-share.test.ts` patched a gun's row and flew the fish as *a boss with no entry of its own*,
which it no longer is; it flies the frost ship, which authors none.

## Not in this change

The plan's 2.2 (a leap that starts and ends on station, on its own path) and 2.1 (the bite's
refractory) are the next change. The leap still dives to the near edge and hands over to the arrival.

## Guards

`tests/volans.test.ts`, a shot parked on the hull every step:

- **THE ASK**: a shot that meets the fish in its leap is spent on it, its health falls, and the bar is
  never taken down during it.
- **A fish killed in its leap dies there**: the pool empties, `bossEntering` and `bossLeaping` are down,
  and the clear is armed.
- **The arrival is still untouchable** — 0306: no shot on the fish as it first breaches lands.

Re-anchored: 0360's probe on the bar's condition.

## Seen to fail

[0005](0005-a-guard-must-be-seen-to-fail.md). `node scripts/prove-guard.mjs 0477`:

| broken on purpose | went red |
|---|---|
| a leap that refuses every hit, as the entrance does | `THE ASK` |
| the bar hidden for the leap | `THE ASK` |
| a fish killed in its leap left flying in | `and a fish killed in its leap dies there` |
| the opening breach as much a target as the leap | `and the arrival is still untouchable` |
| the fish without its weights on the arc, the shuriken and the ray | `0260 — … the arc` |

## What it costs

One boolean on the world. In the frame: one more condition in the gate and in the bar.

## Owed

- **A play of the fish's last stage**: a leap shot down in the air, and whether a phase line crossed
  mid-leap reads right — its burst and cue come when the fish is back on station, because `driveBoss`
  turns phases only once the entrance is over.
- **The weights are the player's to veto**, as every boss's are.

## Rollback

⚠️ **None owed** — [0001](0001-revertability-not-risk-rating.md). Sim and content; nothing persisted.
