# 0192 — A guard holds an invariant, a budget says what it costs, and a taste is advisory

**Accepted 2026-08-25.** The rule [0191](0191-a-place-sits-somewhere.md) is owed and does not state.

> *"How do we change the guard writing rule so it's effective and not limiting? The project is
> writing its own guards and rules which is part of the issue I've been having — a guard will get
> written and then I'll be fighting it for ages instead of benefitting from good safe guards that
> prevent regressions."*

## ⚠️ The failure this closes, and it is a third one

[0019](0019-a-probe-must-be-seen-to-apply.md) catches a guard that never fires.
[0027](0027-measure-the-picture-not-the-model.md) catches a guard that fires on the wrong quantity.
**Neither catches a guard that fires correctly, on the quantity it names, about something nobody
wants held.** That is a different defect and it has now cost a shipped track.

[0191](0191-a-place-sits-somewhere.md), in its own words:

> *"It removed the exact thing that had just been identified as the difference, while quoting the
> correction in its own text… **And it did it to keep a guard green.**"*

That is not a slip. It is what a correct guard over an authored quantity does: it is cheaper to bend
the artefact than to argue with the suite, so the artefact gets bent. **A guard over a taste is a
specification, and it is one nobody wrote down as a specification.**

## The rule

**Before a guard is written it says which of three it is, and the test is one question: *name a
change to the content that would redden this guard and be CORRECT.***

| | the answer | what it is | what it does when red |
|---|---|---|---|
| **invariant** | there is no such change | a property of the system | **fails hard.** This is a defect |
| **budget** | one exists and costs a measured resource | a limit somebody owns | **fails hard**, and the message names what raising it costs and who decides |
| **taste** | one exists and costs only an opinion | a design goal | **never fails.** It is measured, printed, and blocks nothing |

**And the second half, which is the one that would have saved the level:**

⚠️ **A RED GUARD IS NEVER ANSWERED BY CHANGING THE ARTEFACT TO SUIT IT.** There are three legal
answers — fix the defect, change the guard and say why, delete the guard. **Bending the work to green
a guard is refused by name**, and *"the only way to keep this suite green was to move the sound"* is
the sentence that describes it happening.

**And the third, which is the one that stops accumulation:**

⚠️ **ANY GUARD MAY BE DEMOTED TO ADVISORY BY THE AUTHOR, IN ONE EDIT, WITH A REASON. PROMOTING ONE
NEEDS A DECISION.** Today the asymmetry runs the other way — adding a guard is free and removing one
is an argument — and that asymmetry is the whole reason there are so many. **Inverting it is the
change.** A guard the author is fighting is demoted the same afternoon, and the record of it is the
`correctly` field it has to fill in.

## What is not permitted

⚠️ **THIS IS NOT A LICENCE, AND THE LIST OF WHAT STAYS HARD IS LONGER THAN THE LIST THAT MOVED.**
Every one of these is an invariant by the test above — no correct authoring reddens them:

- **clipping.** *"No theme at any rung drives the bus past full scale."* There is no correct mix that
  clips.
- **every ink legible against every backdrop in every palette**
  ([0024](0024-the-accessibility-floor-is-settings.md)). An accessibility floor is not a taste.
- **a typo in a place's ladder**, a layer named twice, a promotion that promotes nothing, an override
  naming a rung that does not exist. Dead or contradictory data.
- **exactly one `part` per rung** ([0154](0154-the-mix-is-authored-as-intent.md)). Two is arithmetic
  with no answer; the solver converges to a plausible lie.
- **the re-based mix is additive** ([0167](0167-a-build-does-not-duck.md)'s other guard). That is a
  property of the re-basing arithmetic — the constant must not become rung-dependent — and not an
  opinion about boundaries.
- **the layer ladder, the closed unions, the frame budget, determinism, the save schema.** All
  invariants or budgets.

⚠️ **AND THE 56 MB RESIDENT CEILING IS A BUDGET AND IS RESTATED AS ONE**, not demoted.
[0188](0188-a-place-owns-four-slots.md) gives a place four slots and not five because of it, which is
a memory number deciding a musical structure — that is a real decision and it should read like one,
so the message names the boundary-baking mechanism
([0133](0133-the-place-is-baked-at-the-boundary.md)) as what a change wanting more should buy.

## What moved, and all four are one family

| claim | was | why it is a taste |
|---|---|---|
| `0167-duck` — nothing sounding gets quieter when a section opens | `tests/themes.test.ts` | **a breakdown before a drop IS a duck.** Refused twice already — [0185](0185-the-belt-gets-its-bottom.md) and [0189](0189-a-place-is-what-it-does-not-play.md) both hit it, on the same level, for the same genre |
| `0155-lead` — no two places follow the same instrument at every rung | `tests/arrangement.test.ts` | a place written as a reprise of another is a legal thing to author |
| `0148-notes` — no two places play the same notes | `tests/themes.test.ts` | two places as halves of one region may share a mode |
| `0172-four` — no two places open on the same four | `tests/themes.test.ts` | two places that open alike and diverge later is a legal shape |

⚠️ **THREE OF THE FOUR ARE *THE LEVELS MUST DIFFER*, WHICH IS THE OLDEST REPORT IN THE REPOSITORY
STATED AS LAW.** It is a goal, and a good one. Guarding a goal turned it into a constraint that bent
the work toward it — which is exactly the mechanism 0191 describes, running three more times where
nobody was looking.

⚠️ **AND `0148-notes` IS THE CASE THAT PAYS FOR THE MECHANISM RATHER THAN MERELY COSTING LESS.** The
hard version could only be written over the two places that opted in, because *"a bound the shipped
design fails is not a bound"* — its own comment said so, citing
[0044](0044-an-intermittent-guard-is-measuring-the-wrong-thing.md). **An advisory has no such
problem.** It states the whole claim over all seven, and its first run names the fifteen pairs still
sharing the default scale. That is a to-do list where there was a vacuous assertion.

## ⚠️ What it costs, stated because it is a real cost

**Nothing that was red goes green here** — all four claims are met today except `0148-notes`, and
that one was only ever met because the hard version did not ask. **So this ships no sound change and
no regression.** What it costs is real anyway:

- **Five probes are retired.** Four decisions lose a break each; `0167`'s file goes entirely and takes
  a `WITHOUT_PROBES` exemption, the first one a demotion has produced.
- **A demoted claim can now drift and nothing stops it.** That is the trade and it is the point. What
  replaces *stops it* is *prints it, every run, met and unmet together* — because an advisory nobody
  counts becomes wallpaper, which `.github/workflows/hotspots.yml` already names about a weekly
  report.
- **The register could become a bin.** The `correctly` field is what stands against that: an entry
  that cannot name a correct change that would redden it is an invariant somebody did not want to
  fix, and `tests/authored.test.ts` refuses it.

## The mechanism

`tests/authored.ts` — a closed register, `observe`, and a printout. **Nothing in it can throw**, and
that is asserted rather than described. `tests/authored.test.ts` measures the four claims and guards
the plumbing: every registered claim measured exactly once, every entry naming its `correctly`, and
the report naming what it found rather than only how many.

**The claims are advisory. The mechanism is an invariant and fails hard.**

## ⚠️ 0178 fired on this decision's own first probe run, which is worth writing down

The mechanism measured its four claims in a `beforeAll`. **The probe that makes `observe` throw
therefore killed the hook**, no test was collected, and the harness reported `NO SUCH GUARD` — *the
test was renamed and the probe was not* — about a guard sitting exactly where it said it was.

⚠️ **THAT IS [0178](0178-a-break-has-to-be-able-to-run.md)'s CLASS, ARRIVING IN THE ONE PLACE IT IS
HARDEST TO SEE**: the break was correct, the guard was correct, and the harness's message was about
neither. **A file whose whole subject is *this cannot throw* must not do the thing under test in a
hook**, because a hook is the one place a throw is invisible. The measuring moved into the tests, and
the test that proves `observe` cannot throw is now the one test that never measures.

## ⚠️ And 0044 fired on it too, which is the second rule this decision's own build tripped

The register's measuring test went **red once in a full-suite run and green on its own.** That is the
exact shape [0044](0044-an-intermittent-guard-is-measuring-the-wrong-thing.md) forbids calling flaky,
so it was measured rather than rerun: the cold bake of seven places' loops is **28.3 s alone and
61.3 s under `npx vitest run`** — a load factor of 2.2, against an allowance of 60 s that was **1.2%
under the observed figure.**

⚠️ **AND THE ANSWER IS THIS DECISION'S OWN MIDDLE CATEGORY.** The bake is deterministic, so nothing
about the code is intermittent and only machine load varies. **A timeout over it is a budget on a
measurement, not a guard on the work** — it fails hard, and the number belongs to somebody. Sized at
180 s against the heavier load, because `npm run prove` runs 149 copies in parallel and is heavier
again than the suite that produced the 61.3.

## ⚠️ A debt found on the way past

**`0167`'s additive guard has never had a probe.** Both of that decision's probes broke the duck
guard, which is the one being demoted — so the assertion that survives is the one nothing has ever
seen go red. It is not fixed here, because fixing it is a break against the re-basing arithmetic and
belongs beside a change to that arithmetic rather than beside this one.

## What was rejected

**Deleting the four outright.** Three of them describe the thing the project is most trying to
achieve. Losing the measurement to escape the veto would be paying twice.

**A `skip` or an `it.todo`.** Both read as *not written yet* rather than *deliberately not a law*, and
neither prints what it found.

**Tagging guards in place with a naming convention.** A `describe('advisory')` block still fails when
its `expect` fails; the whole property wanted here is that the failure path does not exist.

## Confirmed, not assumed

| broken on purpose | went red |
|---|---|
| an unmet claim throwing, so a taste can fail a build again | `THE ONE THAT CANNOT BE RECOVERED FROM: an unmet claim does not throw and does not fail` |
| a registered claim dropped out of the measuring pass | `every registered claim is measured exactly once, so the register cannot hold a dead entry` |
| a claim admitted without naming the correct change that would break it | `and every claim names the change that would break it and be correct, which is the admission test` |
| the report printing a claim unmet without printing what it found | `and the report names every unmet claim and what it found, or it is a number nobody can act on` |

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). Tests, probes and documents. No
storage key, no save field, no cache prefix, and `src/` is untouched: `dist/` is byte-identical.
