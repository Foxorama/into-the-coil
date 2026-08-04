# 0021 — One RNG stream per concern, and the save stores state rather than a recipe

**Accepted 2026-08-04**, with the first game file. Sits inside the capability bans of
[0015](0015-the-layer-ladder.md), which already forbid `Math.random` below the shell.

## The rule

**A seeded `Rng` is threaded as an argument, and every concern takes its own named stream.**

```ts
const level  = run.stream('level:3');
const drops  = run.stream('drops:3');
const cosmet = run.stream('cosmetic');
```

`stream()` derives by **name**, consumes nothing from its parent, and yields a sequence independent
of every other stream. One shared generator is banned.

**And the save stores state, never a recipe.** Anything a player would notice being different after a
resume is written down as a resolved fact, not as a seed to re-derive it from.

## Why a shared generator breaks, in the form it actually arrives

A seeded generator is not random, it is a fixed sequence. Seed `12345` yields
`0.412, 0.887, 0.203, 0.556, …` on every machine, forever. A run consumes it in order:

| draws | consumer |
|---|---|
| `0.412 0.887` | level layout |
| `0.203 0.556` | which enemies |
| `0.741` | what drops |

Now add a cosmetic sparkle that draws **once**, early. Everything shifts one place: the level is now
built from `0.887 0.203`, the enemies from `0.556 0.741`. **Same seed, different game.** A saved run
resumes into a world it was never in, and every fixture asserting "seed 12345 makes this level"
fails.

The diff that caused it is a sparkle. Nothing looks wrong at the call site, nothing looks wrong in
review, and the failures surface a layer away from the change — which is the signature of the
capability bans in 0015 generally, and the reason this is a rule rather than a habit.

Named streams remove the coupling outright: the sparkle draws from `cosmetic`, `level:3` never moves.

## Why `fork()` was not ported

The predecessor's `Rng` carries `fork()`, which derives a child from the parent's **next value** —
so taking a fork is itself a draw, and adding one shifts everything after it. It is the bug this
decision exists to prevent, wearing the API of the fix.

`stream(name)` replaces it and consumes nothing. The old method is **deleted rather than deprecated**,
which is tier 1 of the instruction ladder — *remove the affordance* — and the only tier that has ever
reliably worked in this project's history. A `fork()` left in place with a comment saying not to use
it is tier 3, and the predecessor's Flux rule is what tier 3 looks like after six weeks.

## What streams do NOT fix, stated plainly

**Adding a row to a table changes what an existing seed means.** A seventh enemy turns `int(0, 5)`
into `int(0, 6)`: same draw, different answer. No stream design prevents this, and claiming otherwise
would be the kind of guard that is green because it checks nothing.

So the answer is not technical, it is where state lives:

- **Resume stores the player's state, not a replay.** Character, upgrades, level index, chart
  position. It never says "seed X, replay forward to level 4", so regenerating cannot drift.
- **A run's drafted pool is state.** Drawing ten weapon families from a hundred is saved as resolved
  ids, not as the seed that drew them. A run already in flight is then immune to every later content
  addition.
- **Upgrade tier is computed from the loadout at pickup time** — no rockets yields Rocket I, holding
  Rocket I yields Rocket II — so a tier can never be missed by a resume, because it was never
  scheduled.
- **Fixtures assert properties, not byte sequences.** "Every wave type appears", "the spread is not
  degenerate", "no unreachable gap". `docs/scaffold-plan.md` reached this from the other side: at max
  wildness the predecessor drew ~92% of holes from three shapes and ~0% from another — every row
  reachable, distribution degenerate. A property assertion survives a new row; a byte-exact one does
  not.

Between them: streams make **adding mechanics** free, and state-based resume makes **adding content**
free.

## Confirmed, not assumed

Probes in `scripts/probes/`, re-run by `npm run prove` in CI per
[0019](0019-a-probe-must-be-seen-to-apply.md).

| what was broken | which test went red |
|---|---|
| `hashSeed` returns a constant | *hashes a string seed to a stable 32-bit value* |
| `stream()` derived from `next01()` instead of the name — the ported `fork()` | *derives a stream from its NAME, not from a draw* |
| `stream()` ignores the name, so every concern shares one sequence | *gives distinct names distinct sequences* |
| `int()` made exclusive of `max` | *makes int() inclusive at BOTH ends* |
| `gaussian()` reduced to a single draw | *always draws twice for a gaussian, whatever the arguments* |
| `fork()` restored to the class | *has no fork affordance at all* |
