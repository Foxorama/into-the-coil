# 0017 — The state is slices, and a slice does not know its siblings

**Accepted 2026-08-04**, the last of the three code conventions the constitution was holding open.
Sits inside [0015](0015-the-layer-ladder.md) and shares its enforcement style with
[0016](0016-a-hub-enumerates-kinds.md).

## The rule

`src/state/` holds a pure `(State, Action) => State` and nothing else:

```
src/state/slices/<name>.ts   one slice: its state type, its initial value, its actions, its reducer
src/state/root.ts            State as a Record<SliceName, …>, and a reducer that ROUTES
src/state/screens.ts         the Screen union
```

- **An action names the slice it belongs to.** `{ slice: 'run', … }`, a discriminated union per
  slice, so the root dispatches by lookup — `SLICES[action.slice]` — and never by a `switch`.
- **The root reducer holds no `case` arms.** It composes and routes; deciding is the slice's job.
- **A slice never imports a sibling.** When two must agree, the agreement goes in the root, or the
  shared *type* moves up to `src/state/`.
- **State is plain data.** Objects, arrays, primitives. No `Map`, `Set`, `Symbol` or class instance,
  anywhere the save will serialise or a seeded test will compare.
- **Adding a screen** is: a member on the `Screen` union, a row in the router registry, and an arm
  in the back-intent switch. All three are compile-forced by 0016's rules — the union member fails
  to build until the other two exist.

The enforcement is `tests/state-shape.test.ts`. Purity is not restated there; it is already held by
`layering.test.ts`, which grants `state` no capabilities at all.

## Why slicing, and why the sibling ban is the whole of it

The predecessor's reducer is 2,818 lines holding one `switch` of **127 cases**, and it appears in
**17.0%** of all 822 commits — second only to the shell. Nothing in it was written badly. It grew
one perfectly reasonable case at a time, and every case could see every other, so the cheapest place
to put anything new was always inside it. That is an affordance, not a discipline failure, and the
strongest tier of the ladder in `docs/scaffold-plan.md` says the same thing: **remove the
affordance.**

Splitting files does not remove it — three modules that can import each other are one module with
extra imports. What removes it is that a slice **cannot reach a sibling**, so coordination between
two of them has nowhere to happen except the root, where it is one visible line rather than a case
in the middle of a hundred and twenty-six others. Everything else in this decision is downstream of
that one rule.

## Why plain data, given the alternative is more convenient

A `Map` is the better lookup and it is the wrong choice here, for one reason that is worth writing
down because it is silent: `JSON.parse(JSON.stringify({ seen: new Map(…) }))` returns `{ seen: {} }`.
No throw, no warning, an empty object where the state used to be. The state is the thing the save
layer serialises and the thing a seeded test compares for equality, so both of those failures land
far from the line that caused them. A `Record<Key, …>` is the lookup, and it is also 0016's shape.

The ban is on the **containers**, not on the `class` keyword. A seeded generator wrapped in a class
is the first thing `src/sim/` will hold, it is a tool rather than state, and a guard that flags a
correct file on day one is a guard everyone learns to edit around. That absence is asserted, so it
stays a decision rather than becoming a gap.

## Rejected: a ceiling on the number of slices

The attractors note says "root composes ~6 slices forever". It is a good expectation and it is not a
guard, for the third time in three decisions: 0015 rejected a line ceiling because the predecessor's
4,588-line attractor and its 2,628-line healthy file are the same size, 0016 rejected a `case`
ceiling because its 127-case reducer and its 38-case exemplar sit two places apart in one ranking,
and a slice ceiling fails the same way — nine well-separated slices are healthier than five that
reach across each other, and no count can tell those apart.

**What all three have in common is worth stating once:** every counting guard proposed here was
measured before being set, and every one of them flagged the healthy file as loudly as the sick one.
The property that separated them each time was the shape of the dependencies, which is what these
three decisions hold and what a number never sees.

## Deferred, with the trigger named: the CSS prefix rule

Every screen's chrome should own a class prefix — `itc-<screen>-` — because CSS classes and DOM ids
are global while the modules that write them cannot see each other. The predecessor took a real
regression from `.gs-hud` being shared between two different HUDs, and its own constitution cites
that incident twice.

It is **not** landed here, and the reason is specific rather than an oversight: a scan for class
names has to know how the code writes them — an attribute, a `classList` call, a helper — and
guessing that shape now produces a guard proved only against its own fixture, which is the failure
0005 describes. It lands **in the same commit as the first screen's chrome**, when there is real
usage to prove the extraction against.

## Confirmed, not assumed

Per [0005](0005-a-guard-must-be-seen-to-fail.md). `src/state/` does not exist yet, so each break was
a planted file, removed afterwards.

| broken on purpose | went red |
|---|---|
| `src/state/slices/run.ts` importing `./meta.ts` | `no slice imports a sibling slice` |
| `src/state/root.ts` given a two-case `switch` | `the root reducer routes and does not decide` |
| `new Map<string, number>()` in a slice | `state is plain data — nothing that a save cannot round-trip` |
| `\bclass\s` added to the plain-data pattern | `the plain-data pattern … and nothing else` |
| the self-exclusion removed from `isSiblingSlice` | `the sibling rule tells a sibling from the slice itself` |

⚠️ The last row exists because of a mistake made while writing this file. The first draft stated the
sibling rule twice — once in the scan, once in the fixture that proves the scan — so the proof was
testing a copy and would have gone on passing after the real predicate broke. That is precisely what
`tests/one-description.test.ts` is for, committed inside a test file that cites it. There is now one
function, called by both.
