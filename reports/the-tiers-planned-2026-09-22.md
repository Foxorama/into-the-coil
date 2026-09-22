# The tiers, planned — 2026-09-22

A plan for the three difficulty tiers, written to be picked up cold. It holds the ask of 2026-09-22
verbatim, what the tiers are today against the code, the one decision the ask reverses and how, the
mechanism that stops every later change to Savior needing a rejig of the other two, the shell rules
per tier, the guards and probes each PR owes, and the plays owed after. Under the standing
instruction of 2026-09-10 — *"when it comes to bullets and enemies, stop assuming, present a plan"* —
this is the plan, and nothing in it is built. Every number below that is not read off a file is a
first guess, and says so.

## Before anything

Read, in this order: `docs/machine.md` (node is not on PATH), `CLAUDE.md`, `docs/game.md`,
`docs/state-of-play.md`. Every change lands through `/ship` (`.claude/skills/ship/SKILL.md`): one PR
at a time, a branch off a fresh `main`, a decision record, probes under `scripts/probes/` that break
each new guard on purpose, `npm run check` then `npm run prove`, the exit codes read and never the
output.

## What was said, 2026-09-22

> *"Legend difficulty should be playable by anyone and they should be able to have fun.*
>
> *Saviour difficulty should be the difficulty saviour is now and that's the optimised difficulty.*
>
> *Burn difficulty should be way harder than saviour by about the same margin that legend is easier
> than saviour.*
>
> *The difficulty plan needs to encompass future difficulty increases/changes as well so that I don't
> have to go through and rejig it with every change I make to saviour difficulty.*
>
> *Core baseline for difficulty is shields: saviour — no change to behaviour; burn — no shields;
> legend — start with 3 shields and you start each level with 3 shields fully renewed.*
>
> *But we also need to make the bullets, enemies etc easier on legend on top of the shield changes."*

And the two questions the first draft of this plan put back, answered the same day:

> *"1. start with full*
> *2. remove the shield pickups from burn, no replacement pickups, just remove them"*

## What the tiers are today

`src/content/difficulty.ts`, read 2026-09-22. Every value is a play-test number
([0047](../docs/decisions/0047-difficulty-is-a-tier-and-the-easy-one-is-the-content.md)), and
`tests/difficulty.test.ts` holds the ordering and holds no value.

| axis | Legendary Pilot | Savior of the Galaxy | Let the Galaxy Burn | Savior ÷ Legend | Burn ÷ Savior |
|---|---|---|---|---|---|
| `lives` | 5 | 3 | 2 | — | — |
| `toughness` | 1 | 1.6 | 2.2 | 1.60 | 1.38 |
| `fireGap` (lower is faster) | 1 | 0.78 | 0.5 | 1.28 | 1.56 |
| `closing` | 1 | 1.2 | 1.4 | 1.20 | 1.17 |
| `shotSpeed` | 1 | 1.15 | 1.3 | 1.15 | 1.13 |
| `aggression` | 1 | 1.3 | 1.7 | 1.30 | 1.31 |
| `crowd` | 1 | 1.15 | 1.2 | 1.15 | 1.04 |
| shields a life opens with | 0 | 0 | 0 | | |
| shield cap | 3 | 3 | 3 | | |

Three things the table says that the ask has to be read against:

- **Legend is the content.** Every multiplier is exactly 1, and 0047 makes that a rule: the level
  author, every play report and every authored number are read against one baseline, and the two
  harder tiers are stated as departures from it. `tests/difficulty.test.ts` holds it twice (*"the
  easiest tier is the content, exactly as authored"*), and `tests/world.ts`'s `playableWorld` defaults
  every guard in the suite to `DIFFICULTY_KINDS[0]` — which is why a softer Legend, done naively,
  silently moves the baseline of the whole proof.
- **The ladder is not symmetric and never was.** The last two columns are the margins the ask names,
  and they disagree on every axis, in both directions: Burn is closer to Savior than Legend is on
  toughness and crowd, and further on fire gap. There is no number in the file today that could be
  moved once to fix that, which is the rejig the ask wants never to do again.
- **A tier has no reach into the shell.** `MAX_SHIELDS = 3` is a module constant in
  `src/content/ships.ts`; a life opens on the hull in `respawn` (`src/app/frame.ts`); a level boundary
  carries whatever shell the ship has ([0058](../docs/decisions/0058-a-level-boundary-keeps-the-shell.md),
  by construction — `advanceLevel` never resets the ship); and a shield pickup at the cap is **wasted**,
  clamped by `Math.min` in `src/app/mount.ts` rather than turned into anything.

## The one decision this reverses, and how

0047 says the easy one is the content. The ask says Savior is the optimised tier and Legend is easier
than it on bullets and enemies. Both cannot hold, and the plan resolves it the narrow way:

**The content stays authored at one. Savior's row stays exactly as it is. Savior is declared the
tuned tier — its own hint already says *"What the game is tuned for"* — and Legend and Burn are
derived from it by a margin.** What 0047 was protecting survives: there is still one baseline
(the authored content), every tier is still a stated departure from it, and the guard that proves the
frame adds no constant keeps running — against an exported identity row rather than against a
button. What changes is that the identity row is no longer a tier anyone plays.

**Rejected: re-basing the content so that Savior is all ones.** Folding `toughness: 1.6` into every
authored health re-rounds every small body (a one-health drifter cannot become 1.6), and folding
`fireGap: 0.78` into every authored cadence takes all of it off the 100 ms grid that
[0096](../docs/decisions/0096-the-enemies-play-along.md) protects — `fireGapFor` exists precisely so
that the one multiplier in the game is snapped once, at spawn. The instruments already answer at
Savior (`scripts/weigh-boss.mjs` and `weigh-threat.mjs` default `--difficulty=savior`), so the content
is already tuned there without being rewritten there.

## The mechanism: one tuned row, one margin per axis, the outer tiers derived

```
legend[axis] = savior[axis] ÷ margin[axis]        (fireGap: × — it is a gap)
burn[axis]   = savior[axis] × margin[axis]        (fireGap: ÷)
```

- **`SAVIOR` is the only multiplier row anyone edits.** Change it and both outer tiers move with it.
  Change the content and all three move, as they do today. That is the whole of *"no rejig."*
- **`MARGIN` is `Record<MultiplierAxis, number>`**, with `MultiplierAxis` derived from the numeric
  multiplier keys of `DifficultyRow`. A fourth axis added to the row without a margin is a compile
  error, not a tier that quietly forgot to scale.
- **A pin is a stated literal on the outer row**, per [0282](../docs/decisions/0282-a-mechanism-for-every-instance-makes-them-one-instance.md)
  (*"an argument for a DEFAULT, never for a CONSTANT"*): the derivation is the fallback and the row
  may override an axis, with the measurement beside it. There is one today — see `crowd` below.
- **Lives and the shell are counts on the run, not multipliers**, and stay per-row literals. The ask
  states them per tier anyway.
- **`AUTHORED`** (every multiplier 1, no lives) is exported beside the table and becomes
  `playableWorld`'s default and the instruments' `--difficulty=authored`, so no guard's baseline moves.
  It is not in `DIFFICULTY_KINDS` and gets no button.

### Opening numbers — a hand's first guess, and what checks each

Setting every margin to Savior's own departure from one reproduces today's Legend exactly (every
multiplier 1) and puts Burn at Savior squared. The ask says Legend must also be easier on bullets
and enemies **on top of** the shells, so the guess below sits Legend a notch under the content on the
axes the player feels as time, and leaves the two that would do nothing there.

| axis | Savior (as is) | margin | Legend | Burn | today's Burn | what checks it |
|---|---|---|---|---|---|---|
| `toughness` | 1.6 | **1.6** | 1.00 | 2.56 | 2.2 | `scripts/weigh-boss.mjs --difficulty=burn`; [0260](../docs/decisions/0260-a-boss-is-fought-to-the-end.md)'s eight volleys a phase |
| `fireGap` | 0.78 | **1.4** | 1.09 → grid | 0.56 → grid | 0.5 | `tests/difficulty.test.ts` grid guards; `weigh-bullets.mjs --tier=` |
| `closing` | 1.2 | **1.3** | 0.92 | 1.56 | 1.4 | `weigh-presence.mjs --tier=` |
| `shotSpeed` | 1.15 | **1.25** | 0.92 | 1.44 | 1.3 | the spit check below |
| `aggression` | 1.3 | **1.5** | 0.87 | 1.95 | 1.7 | [0073](../docs/decisions/0073-an-enemy-is-a-pilot.md)'s lane-crossing seconds |
| `crowd` | 1.15 | **1.15** | 1.00 | 1.32 → **pinned 1.2** | 1.2 | `tests/crowd.test.ts`, every fight, every tier |

- **`toughness` stays at Savior's own departure**, so Legend is 1. Below one, `Math.ceil` leaves every
  body of one, two or three health exactly where it is — a margin that moves nothing but boss length
  is not the margin the ask means, and *"length is not difficulty"* is the file's own words on Burn.
- **`crowd` is pinned at 1.2 on Burn, and the pin is the measurement in the file**: 1.3 took room
  from ten of fourteen fights and 1.5 left the frost ship's opening phase with no answer for 2% of it.
  This is exactly the shape 0282 allows — the derivation says 1.32, the row says 1.2 and why.
- **The spit check, Burn.** `SHOTS.spit.speed` is 1.4 and `SHIP_SPEED` is 1.7. At Savior the spit
  flies at 1.61 and is outrun; at today's Burn it already flies at 1.82 and is not; at 1.44 it would
  fly at 2.02. `src/content/shots.ts` says the whole of what makes spit dodgeable is being slower than
  the ship, so Burn has been a coin flip on this shot since 0047 and the margin makes it more of one.
  The ask wants Burn *"way harder"*; whether *a shot you cannot outrun* is unfair or learnable is the
  one question `docs/game.md` manages difficulty by, and it is the player's, on a play.
- **Every number in the margin column is a play-test number** on the same terms as the row it
  multiplies. Nothing asserts on any of them.

## The shell: what each tier opens on, and what it may carry

Two fields join `DifficultyRow`, both counts, both per-row literals:

| | `shellOpen` — shields a life opens with | `shellCap` — the most it may carry |
|---|---|---|
| **Legend** | 3 | 3 |
| **Savior** | 0 | 3 |
| **Burn** | 0 | 0 |

`MAX_SHIELDS` stays in `src/content/ships.ts` as the **ceiling** — the shell pool's capacity in
`src/app/mount.ts` and the most pips the HUD can draw — and a guard holds `shellCap ≤ MAX_SHIELDS`
and `shellOpen ≤ shellCap` as a budget whose owner is the pool. The ceiling belongs in shared code
and the character on the row, which is 0282's line.

**Where the row is read — four sites, and the picture follows the number at every one, because
[0050](../docs/decisions/0050-the-ship-is-one-hit-and-the-shield-is-what-stands-in-front-of-it.md)
made the shell a function of `ship.health`:**

1. **`respawn`** (`src/app/frame.ts`) — a life opens at `hull + shellOpen` rather than at the hull.
   This is one site for three events: the run's start, a continue, and the ship handed back after a
   death. **Answered: *"start with full"*** — every life on Legend opens on three, a death included.
   [0266](../docs/decisions/0266-a-death-throws-the-ladders-back.md) already throws the ladders back
   on a death, and a shieldless respawn on the tier meant for anyone is where *anyone* stops. 0058's
   *"a death takes the shell"* still holds — a death takes what was carried; what a life opens with
   is the tier's.
2. **`advanceLevel`** — the boundary keeps the shell (0058) **and tops it up**:
   `health = max(health, hull + shellOpen)`. Never down. On Savior and Burn that line is a no-op
   (`shellOpen` 0), so *"no change to behaviour"* holds by arithmetic rather than by a branch. It runs
   at `arrive`, where the level begins ([0076](../docs/decisions/0076-a-level-has-an-origin.md)),
   so the renewed orbs appear as the burn ends.
3. **The mid-boss's drop** (`dropPickups`, `src/app/frame.ts`) throws no piece whose kind the tier
   cannot carry: a shield is skipped when `shellCap` is 0, and the other pieces are thrown as the
   number that remain. **Answered: *"remove the shield pickups from burn, no replacement pickups,
   just remove them."*** This is the only place a shield enters the field — no level authors one
   (`MID_BOSS_DROP` in `src/content/levels.ts` is `weapon, shield, bomb`, and `kind: 'shield'` appears
   in no wave table) and a death never throws one back (`docs/game.md`). The list stays authored as
   three; the filter reads the row, so a fourth tier with a cap of zero gets the same without a name
   being switched on. The dial is untouched, because `weaponsOffered` counts weapons only. **The
   shield pickup** (`src/app/mount.ts`) still clamps at `hull + shellCap` rather than
   `fullHealthFor(shipRow)`, so a shield that somehow reached a Burn ship would add nothing — the belt
   beside the braces, on `SHIELD_MARK`'s own argument.
4. **The HUD** draws `shellCap` pips rather than `MAX_SHIELDS`: none on Burn, three on Legend — and
   on Legend a life opens with all three **full**, which amends 0050's *"a life opens with three
   empty"* per tier.

**What the drop rule costs 0047, said plainly rather than renamed.** 0047 holds *"it does not
touch the SCRIPT"*, and withholding a piece of the mid-boss's drop is the tier reaching what a level
sends. The first draft of this plan offered the overflow-to-charge rule to avoid that, and the
player chose removal instead — so PR 1's decision **amends 0047 by one sentence**: a tier may
withhold a pickup the ship cannot carry, and nothing else. What 0047 was protecting is checked
rather than assumed: `tests/level.test.ts`'s lane, ordering and pacing guards read the wave tables
and never the drop; `weaponsOfferedBy` counts the weapon beside the list, so the top of the dial is
unmoved; and a fourth shield on Savior goes on doing nothing, exactly as today. **Savior's behaviour
does not change at all**, which is the ask's word.

**Nothing else moves.** `lives` stay 5 / 3 / 2 — the ask did not name them, and a Legend that opens
every life on three shields may want fewer; that is a play question, listed below. Nothing of the
player's ([0037](../docs/decisions/0037-the-ship-has-mass.md)), nothing in the wave tables, no
per-level tier, no mid-run change. The save does not exist yet — `tests/privacy.test.ts` says there
are no `itc_*` keys — and the tier already rides the run slice, so neither PR touches an irreversible
surface and neither carries a rollback note ([0001](../docs/decisions/0001-revertability-not-risk-rating.md)).

## The queue — two PRs, then three plays, then the margins

Both PRs edit `src/content/difficulty.ts` and `tests/difficulty.test.ts`, so they are sequential.
The shells go first because the ask names them as the core and they do not depend on the margin.

### PR 1 — a tier opens on a shell

Decision: *a tier opens on a shell* (the next free number; amends 0058, 0050's cap, and 0047's
script line by the one sentence above; keeps 0050's one-number rule). Row fields `shellOpen` and
`shellCap`; the four sites above; `docs/game.md`'s pickup table (*"capped at 3"* → capped by the
tier, and the mid-boss's shield *"not on Burn"*) and its tier paragraph.

Guards, each with a probe that breaks it and is seen to apply ([0005](../docs/decisions/0005-a-guard-must-be-seen-to-fail.md),
[0019](../docs/decisions/0019-a-probe-must-be-seen-to-apply.md)) — and one assertion in units the
player sees, per [0027](../docs/decisions/0027-measure-the-picture-not-the-model.md):

| guard | kind | the break its probe makes |
|---|---|---|
| a life on every tier opens on exactly its row's shell, through the real frame, at begin, after a death and after a continue | invariant | `respawn` opens on the hull, as today |
| a level boundary never lowers the shell and raises it to the row's opening shell | invariant | `advanceLevel` keeps without topping up |
| on a tier whose cap is zero the mid-boss's death throws no shield and still throws every other piece; on every other tier it throws all three, through the real frame | invariant | `dropPickups` ignores the cap, as today |
| a shield pickup never raises health past the row's cap, on any tier | invariant | the pickup clamps at `fullHealthFor`, as today |
| `shellOpen ≤ shellCap ≤ MAX_SHIELDS` on every row | budget — owner: the shell pool in `mount.ts` | a row with a cap of four |
| the HUD shows the row's cap in pips and a Legend life opens with them all lit | picture — a browser test, counting drawn pips | the HUD passes `MAX_SHIELDS` |

`tests/continue.browser.test.ts` and `tests/continue.test.ts` name tiers and open lives; both are
read before the guards are written, because *"the file being changed is read before a mechanism is
invented for it"* ([0280](../docs/decisions/0280-a-cheap-mechanism-does-not-rename-the-ask.md)).

### PR 2 — the tuned tier is Savior, and the outer tiers are a margin from it

Decision: supersedes 0047's *"why the easiest tier multiplies nothing"* and leaves the rest of 0047
standing, with a pointer in the old file per `docs/decisions/README.md`. `SAVIOR`, `MARGIN`, the
derivation, `AUTHORED`, the `crowd` pin with its measurement; `playableWorld` and the instruments
default to `AUTHORED`; `docs/game.md`'s tier sentence.

| guard | change |
|---|---|
| *"the easiest tier is the content, exactly as authored"* — `multiplies nothing at all` | **deleted**, with the decision as the reason ([0192](../docs/decisions/0192-a-guard-holds-an-invariant.md): one edit and a reason) |
| *"and leaves every body it touches at the numbers its own row states"* and *"the easiest tier puts exactly the authored row on the field"* | **re-pointed at `AUTHORED`** — they keep proving the frame adds no constant |
| **new:** on every axis not pinned, Legend × margin = Savior and Savior × margin = Burn, within rounding, and every pin is a literal on the row | invariant; probe: derive Burn from Legend rather than Savior |
| **new:** a multiplier axis on the row has a margin | held by the type; probe: a fourth axis with no margin fails `npm run check` |
| *"every tier is harder than the one before it"* — all of it | unchanged, and it now has teeth on both sides of Savior |
| *"makes everything that can be shot take strictly more hits on a tougher tier"* | unchanged; holds for any Legend toughness ≤ 1 by the ceiling argument in 0047 |
| `tests/crowd.test.ts` *"the tier that promises no challenge leaves a whole ship of room"* | unchanged; stronger with `crowd` ≤ 1 on Legend |
| `scripts/probes/0047-difficulty.mjs` — the *multiplies nothing* probe | **re-anchored** to the new decision, checked with a script before the proof rather than by the proof — 39 anchors were once stranded by one gain none of them broke |

Then `npm run prove` in full, because a change to a shared quantity wants the whole proof
(`docs/state-of-play.md`) and only the full run finds a `STILL GREEN` left in another decision's
probe file.

### The instruments, before any number is trusted

Every quantity that rejects an option is checked in the case it is applied to
([0280](../docs/decisions/0280-a-cheap-mechanism-does-not-rename-the-ask.md)), so before PR 2's
numbers are called anything but a guess:

| run | answers |
|---|---|
| `scripts/weigh-boss.mjs --difficulty=burn` and `--difficulty=legendary`, every boss | seconds to kill at each outer tier; whether Burn at 2.56 still meets 0260's eight volleys a phase, and whether Legend's fights are short enough to be fun |
| `scripts/weigh-threat.mjs --difficulty=burn` | hits a second on a parked ship — the number *"way harder"* is measured in |
| `scripts/weigh-bullets.mjs --tier=legendary` and `--tier=burn`, every level | bullet on screen per level at each end; [0259](../docs/decisions/0259-the-bullets-stay-on-the-screen.md)'s eight-second ceiling at Burn's fire gap |
| `tests/crowd.test.ts` | the widest reachable run of lane, every phase, every tier — the `crowd` pin's own check |
| `scripts/weigh-walls.mjs` | already flies the first and last tier; the uncoil's holes at the new Burn |

All run as `node --experimental-transform-types --import ./scripts/ts.mjs scripts/<name>.mjs`. Each
drives the real frame at the tier it names. A verdict about the picture is still a play on a
deployed URL, read off the check run of the PR (`docs/machine.md`).

### The plays — three runs, one per tier, and the questions each answers

Nothing in this plan is settled until it has been played, and the tuned tier's own numbers were
placed the same way. Per tier, the question the play is for:

- **Legend** — *could anyone have fun here?* Is three shields a life, renewed at every level, too
  much with five lives, so that nothing is felt? Does a death that opens on a full shell read as
  generous or as nothing lost? Are the slowed bullets visible, or is the shell doing all the work?
- **Savior** — *is it the same game?* It must be, to the number. A play that finds anything else
  has found a defect in PR 1 or PR 2.
- **Burn** — *is it unfair, or is it learnable?* The spit at 2.02 against a ship at 1.7 is the
  first place to look; the frost ship's summons and the serpent's third phase at the pinned crowd
  are the second. And is *no shields plus two lives* the shape of hard the name promises, or does it
  need the third life back to be played at all? And does the mid-boss's two-piece drop read as a
  drop, or as something missing?

### Then the margins move, and nothing else

After the plays, tuning is one column: a margin per axis, in `src/content/difficulty.ts`, with the
play beside it. **If a play says Savior itself is wrong, Savior's row moves and the outer tiers
follow** — that is the property the ask paid for, and the guard in PR 2 is what proves it still
holds after every such edit.

## What this plan does not do

- **It does not make the margin one number.** A single scalar in log space across six axes is
  tidier and was considered; it fails on `toughness` (where a margin below one moves only bosses)
  and on `crowd` (where the ceiling is measured). Per-axis, with a pin allowed, is the shape the
  content already has.
- **It does not change what a level sends.** Density is authored; toughness is a tier — 0047's line,
  kept.
- **It does not add a fourth tier**, a per-level tier, or a mid-run change. The dial
  ([0084](../docs/decisions/0084-the-dial-is-the-level-and-the-guns.md)) is still the axis that
  moves during a run, and it multiplies with the tier as before.
- **It does not touch the assist ladder.** A tier is deliberately harder and lives on the run;
  [0024](../docs/decisions/0024-the-accessibility-floor-is-settings.md) is unchanged, and
  `tests/difficulty.test.ts` still fails if a tier's name reaches `src/sim/assist.ts`.
- **It does not settle the numbers.** Every value in the margin column and both shell columns is a
  play-test number, placed by a hand against a stated target. The plan's value is that the next
  change to Savior costs one row and no rejig.
