# 0016 — A hub enumerates kinds, never instances; the table is the guard

**Accepted 2026-08-04**, the second of the three code conventions. Sits inside the layers of
[0015](0015-the-layer-ladder.md).

## The rule

**A content type is a row.** Every enemy, wave, weapon, upgrade and stage is a row in a
`Record<Kind, Row>` over a closed union, in `src/content/`. Every subsystem with an opinion about
that content declares its own `Record` over the same union — so a new kind **fails to compile** until
the spawner, the painter and the drop table have each said what they think, and the compiler hands
you the list of what is owed.

**Behaviour rides the data.** A row carries its own `tick`/`onHit`. The loop calls what the row
brought; it does not branch on which row it is.

**A hub may enumerate KINDS — a small closed set. It must never enumerate INSTANCES that carry
behaviour.** The named exception, since every exception here names its reason: *an enumeration that
can only list is fine; one that can accrete logic is not.* An import line and a `Record` row cannot
grow a branch. A `case` can, and does.

**A registry is an explicit list of imports.** Never directory auto-discovery.

The type system enforces the first three and needs no test. `tests/registry.test.ts` holds the five
ordinary-looking moves that switch the type system off:

| the move | why it is not smaller than it looks |
|---|---|
| auto-discovery | the set stops being closed, and stops being greppable |
| `Record<string, …>` | satisfied by `{}` — every kind is present, so none is ever missing |
| `any` | the row stops having a shape |
| `@ts-ignore` | the guard, deleted, at the one line that had something to say |
| a `switch` with no `never` arm | a new kind falls through to the default, silently |

`@ts-expect-error` is deliberately not banned: it fails when the error goes away, so it cannot rot.

## Why this is the highest-value habit for this game specifically

Because the shape of the game is a catalogue. Enemies, weapons, upgrades, waves, stages, pilots —
all of it is rows, and all of it grows. The predecessor's own numbers say what the payoff is: across
822 commits its content tables took **0.4%** (`clubs.ts`), 0.6%, 1.3%, 1.9% of commits, while the
four hub files took 35.2%, 17.0%, 10.2% and 8.2%. **The hottest table sat below the coldest hub.**

And the two hottest tables — `biomes.ts` at 4.5% and `economy.ts` at 6.2% — are the two that held
logic as well as rows. That is the actual rule and it is why `content/` is a layer with an entry
condition rather than a naming convention: *a file that is only rows is touched only when a row
changes.*

## Rejected: a ceiling on `case` counts per switch, and the measurement that rejected it

A cap — the thirteenth `case` must become a table row — was proposed as the direct expression of
"a hub must not enumerate instances". It was measured against the predecessor's `src/` before being
set, per the rule that an unvalidated threshold is itself a failure. All 66 switches, by case count:

```
min 1   p50 5   p75 11   p90 14   p95 20   p99 41   max 127
```

The ranking is what kills it:

| cases | file | verdict |
|---|---|---|
| 127 | `ui/game.ts` — the reducer | the disease. 17.0% of all commits |
| 41 | `app.ts` | the disease. 35.2% of all commits |
| **38** | **`ui/back.ts` — the back/Escape decision** | **the audit calls this exemplary** |
| 28 | `render/restArt.ts` | a cold painter nobody edits |

The two worst files in the repository are first and second, which looks like the cap working — and
then third is a 38-case switch the architecture audit singles out as one of the five things most
worth taking, with an exhaustiveness arm, in a file whose whole job is that one decision. Any
threshold that separates 41 from 38 is fitted to two points; any threshold below it flags a cold
painter as though it were the reducer.

So the measurement says the same thing about `case` counts that 0015's says about line counts:
**count does not predict pain.** What separates `game.ts` from `back.ts` is not size, it is that one
of them returns an answer and the other one *is* the program — and the guard for that is 0017's
slicing, not a number.

The one thing the measurement did support is the exhaustiveness arm: **2 of 66 switches had one.**
That is not a discipline problem either, it is what a convention with no enforcement looks like after
822 commits, and it is free to adopt on day one when the count is zero.

## Rejected: `Record` everywhere, including decisions

The predecessor's `back.ts` explicitly refuses a `Record<Screen, …>` for its back-intent walk, and
gives the reason: a `Record` is satisfied by a wrong-but-present entry, and several screens need to
read state as well as their own identity. So the two guards divide by what is being enumerated —
**`Record` for content, an exhaustive `switch` for a decision** — and both fail the build when a kind
is added. This is why the rule above bans a `switch` without a `never` arm rather than banning
`switch`.

## Confirmed, not assumed

Per [0005](0005-a-guard-must-be-seen-to-fail.md). `src/content/` does not exist yet, so each break
was a planted file under it, removed afterwards.

| broken on purpose | went red |
|---|---|
| `import.meta.glob('./enemies/*.ts')` | `nothing in src/ defeats it by auto-discovery` |
| `Record<string, number>` | `nothing in src/ defeats it by open-key` |
| `(e: any)` | `nothing in src/ defeats it by any` |
| a `// @ts-ignore` line | `nothing in src/ defeats it by silenced-compiler` |
| a `switch` with a plain `default:` | `every switch in src/ ends in an exhaustiveness arm` |
| the `any` pattern loosened to `\bany\b` | `no pattern fires on a line it must leave alone` |
| the `any` pattern typo'd to `anyy` | `every pattern matches the move it bans` |
| exhaustiveness re-defined as `default` rather than `never` | `the switch parser finds a switch, its body, and whether it decides` |
| `silenced-compiler` switched from a raw scan to a stripped one | `the raw/code split is the right way round for each row` |

The last two are the ones worth having. `@ts-ignore` is a comment, so a row scanning stripped source
would be searching for the one thing the stripper had just removed — a guard that could never fire,
looking exactly like a guard that never needed to.
