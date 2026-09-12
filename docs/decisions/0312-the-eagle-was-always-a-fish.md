# 0312 — The eagle was always a fish

**The Ember Nebula's end boss is `volans`, the flying fish.** The name, the fiction and every comment
that calls it a bird change; **the drawing does not.**

## What was asked

> *"one important thing is that I'm changing it from an eagle to a flying fish style boss as the art
> currently looks more fishy than birdy."*

## The fiction moves to the art, which is the direction of travel this project already has

[0020](0020-the-fiction-transfers-the-code-does-not.md) says the predecessor's fiction crosses **as
raw material and not as scripture** — *rename it, reshape it, improve it.* This is that rule applied to
one of this game's own animals: the drawing came out looking like a fish, and the cheapest true thing
to do is agree with it.

⚠️ **AND THE HULL IS DELIBERATELY NOT REPAINTED.** The report's own reason for the change is that the
art *already reads as a fish*, so a repaint is the one thing it does not ask for — and a boss hull is a
long authored path that wants eyes rather than a confident hour at two in the morning
([0027](0027-measure-the-picture-not-the-model.md)). `EAGLE_HULL` is `VOLANS_HULL` and its points are
byte-identical.

## `volans` is the flying fish, and it is a constellation

The southern sky's — which is the naming a game set in a nebula already uses: Jörmungandr, the quetzal,
the hydra, the medusa. The row key is not a surface the player ever sees; what they see is the drawing
and `docs/game.md`, and both now say fish.

## What does NOT change, and why that is not laziness

⚠️ **THE DECISIONS KEEP THEIR FILENAMES.** `0249-the-eagle-summons.md` and
`0262-the-eagle-throws-quills.md` stay exactly as they are, and every citation of them stays too. A
decision is the record ([0029](0029-the-tracked-record-is-the-record.md)) and renaming one is rewriting
history: their prose says *eagle* and is **true of what was decided then**. What is stale is prose in
`src/` that describes the animal as it is today, and that is what moved.

### Three tests separate the prose that moved from the prose that stayed

The first draft of this change renamed the row and **left two dozen sentences calling the animal an
eagle** — a pass that did less than the ask and would have read as done, which is
[0280](0280-a-cheap-mechanism-does-not-rename-the-ask.md)'s subject wearing the one disguise that rule
does not name: not a substitution under the old name, but the old name left behind under the
substitution. What settled each line is which of three things it is:

| | |
|---|---|
| **a quote of what was said** | stays verbatim, every time — *"I want to see the eagle nebula"*, *"some hell-spawned demon space eagle thing"*, the seventh play-test's own roster. A record that edits its sources is not one |
| **an account of what was decided then** | stays, and 0249's and 0262's filenames with it. `src/content/sprites.ts`'s bullet-ladder paragraph says in its own text that **the wording is kept** because what it cost is the point |
| **a description of the animal today** | moves. What summons the kite, whose flame and whose quill, which hull the painter is tracing, which two bosses summon, why exactly one end boss stalks, and what five probes are breaking when they break it |

⚠️ **AND THE HULL PAINTER IS THE ONE WORTH READING.** Its comment said *"a hooked beak, two wings
thrown wide with the primaries notched along their trailing edges"* — a true description of a path that
is **not being redrawn**, attached to an animal that is no longer a bird. Deleting it would lose what
the points mean; leaving it would leave the file arguing with the row. It now says what the shape is
(a snout, pectoral fins with notched rays, a fanned caudal fin), says every point is byte-identical to
the eagle's, and says why: *the report's reason for the rename is that this drawing already reads as a
fish.*

⚠️ **THE EAGLE NEBULA IS NOT THE EAGLE.** Three sentences — in `src/app/music.ts`,
`src/content/themes.ts` and `src/render/bake.ts` — and the ask they all come from name a real object in
the sky that the Ember Nebula's backdrop is drawn from (0203). A blind rename takes those, and a blind
rename is the thing this section exists to have not done.

**Nineteen files**: nine in `src/` — the row and its table, the sprite keys, the shot rows, the enemy
rows, the level, the palette, the theme's ink, the mote comment and two painter comments — five tests,
seven probes, and `docs/game.md`. One of the five is the test file renamed (`tests/eagle.test.ts` →
`tests/volans.test.ts`). **No behaviour, no number and no path point.**

## Renaming a test file stranded ten probes, and the class is repaired rather than the instance

⚠️ **THE RENAME OF `tests/eagle.test.ts` LEFT TEN PROBES NAMING A FILE THAT DOES NOT EXIST** — five of
0249's and five of 0262's. Every one of their anchors still resolved, so the live *can this break still
be made* check ([0019](0019-a-probe-must-be-seen-to-apply.md)) stayed green, and what each of them
reported was `NOTHING WAS PROVEN` — at the **end** of `npm run prove`, after the baseline suites, six
tree copies and a thousand vitest runs. Two of them named a test whose title this pass had also changed.

⚠️ **THE INSTANCE IS THE TEN PATHS; THE CLASS IS THAT NOTHING ASKED WHETHER A PROBE'S TEST EXISTS.**
`anchorFailures` has asked *can the break be made* since 0019, in a second, over the whole probe set.
The other half of being stranded — *is there still a test by that name to watch it* — was only ever
answered by running vitest a thousand times. `tests/prove-guard.test.ts` now asks it beside the anchor
check, over the same probe set, in three seconds:

| | |
|---|---|
| the suite file is gone | named, with the probe that names it |
| no test in the suite holds the `guard` as a substring | named the same way |
| a title written `'the run\'s camera'` | backslashes dropped before comparing, or every probe with an apostrophe is a false positive |
| a title built as a template — `` it(`…${kind}`) `` | that file is SKIPPED rather than guessed at. Four of 0016's probes and two of 0033's watch exactly those, and the text is not in the source at all |

⚠️ **IT DOES NOT REPLACE `npm run prove`, AND THE LAST ROW IS WHY.** The runner asks vitest, which is
the answer with no gaps in it. This is the fast one that catches a rename, which is the thing that
actually happens — and 0192's question has no answer here: renaming a test and its probe together moves
both, so no correct change reddens it.

`node scripts/prove-guard.mjs 0312`:

| broken on purpose | went red |
|---|---|
| a real probe's guard named a test that does not exist, exactly as renaming a test does | `every probe still names a test that exists` |
| a real probe's suite pointed at a test file that is not there, which is what a rename leaves | `every probe still names a test that exists` |

⚠️ **AND THE OTHER HALF OF HOW IT WAS MISSED IS NOT IN THE CODE AT ALL.** The run that should have
caught it was `npm run prove | tail -25`, whose exit code is `tail`'s.
[0199](0199-a-verdict-is-an-exit-code.md) is that defect, written about tracked shell steps; it is just
as true of a command typed once.

⚠️ **AND THE ADDS ARE LEFT ALONE, WHICH IS THE SAME JUDGEMENT.** `kite` and `raptor` are bird names on
bodies the report describes as *"a boring line of fish and a boring line of space shrimp"* — so they
already read as sea creatures too. But the same sentence asks for **new art and new behaviour** for
them, and renaming a thing in the PR before the one that rebuilds it is churn that makes the rebuild's
diff unreadable.

## What this leaves owed, all of it from the same brief

[`the-fish-asked`](../../reports/the-fish-asked-2026-09-12.md) is the record. Six items, none of them
touched here:

| | |
|---|---|
| a flashy entrance | 0306's `Entrance` is the machinery and the serpent's coil is the pattern — **a fish's must not be a coil** |
| quality art on the attacks | quills and flames today |
| multiple attack styles | it has two and two summons; the serpent has four and a round |
| **attacking while the adds come in** | the one item that needs a mechanism the game does not have: a volley IS an arm of `BossAttack`, so `summon` throws adds *instead of* a fan |
| quality art on the adds | `kite` and `raptor` |
| adds worth reacting to | the formation is `vee` and `line`; a reason to interact is a property of what an add DOES |

⚠️ **AND THE ASK NAMES ITS OWN LIMIT**: *"Don't make the serpent boss a hard rule, the pattern is what
we want, the style is what makes the different bosses unique."*
[0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md) is the rule that keeps the
second from collapsing into the first.
