# A sweep that served two rules, and the probes of one of them

**2026-08-07.** Post-mortem of the regression repaired by
[0067](../docs/decisions/0067-a-new-run-opens-on-an-empty-field.md). The finding is about the proof
harness rather than about the game, which is why it is here and not in the decision.

## What happened

[0057](../docs/decisions/0057-a-death-does-not-rewind-the-level.md) merged on 2026-08-06 as
[#77](https://github.com/Foxorama/into-the-coil/pull/77). It removed two lines from `respawn`:

```
-  w.enemies.clear();
-  w.enemyShots.clear();
```

That is the whole of the fix the player asked for, it is correct, and it has five probes behind it.

`resetScene` ends with `respawn(w)`. It had never cleared the enemies itself, because it did not have
to. From that commit, **nothing in the repository cleared the enemies at all** — so a new run, and a
new level, opened on whatever the last one had left flying.

Reported the next day, in the player's words:

> *"If you die and end the game, when you restart at level 1, the run is the same run as you were up
> to previously, so you can start middle of level 2."*

One day live. 616 tests and 41 probes green throughout.

## Why nothing saw it

**The two lines served two rules, and only one of them had a name.**

| the rule | where it was written down | had a guard |
|---|---|---|
| a death does not sweep the field | [0057](../docs/decisions/0057-a-death-does-not-rewind-the-level.md), `tests/level.test.ts` | yes — five probes |
| a level starts on an empty field | [0043](../docs/decisions/0043-a-weapon-is-a-budget-and-a-level-opens-empty.md), in words | **no** |

0043 says a level opens on an empty screen so the player can find the controls before anything finds
them, and `tests/level.test.ts` guards it — as **`LEVELS[kind].waves[0].at > MAX_ALONG_SPAN`**, which
is a statement about what the level *authors* into its opening. Nothing asserted what was actually on
the field when the level began. The two readings of *empty* are different sentences, and only the one
about the table had a test.

⚠️ **0057's first probe restores exactly the deleted lines** and watches `leaves the enemies where
they were, so the screen does not empty` go red. It is a correct probe and it passed for the right
reason. **A probe proves the rule it was written for and is silent about every other rule the same
line served** — which is the finding, and it is not something
[0019](../docs/decisions/0019-a-probe-must-be-seen-to-apply.md) or
[0005](../docs/decisions/0005-a-guard-must-be-seen-to-fail.md) claims to catch. 0019 catches a probe
that does not apply; 0005 catches a guard that never fires;
[0027](../docs/decisions/0027-measure-the-picture-not-the-model.md) catches a guard measuring the
wrong quantity. This is a fourth thing: a guard that was never written, over a rule that was only
ever true by side effect.

## What would have caught it

Not a bigger probe set for 0057. The break it needed was not *"put the sweep back"* but *"take the
sweep away from the OTHER caller"*, and there was no assertion for that break to redden.

The repair is one test, and it is the shape that matters rather than the file:

> **assert a function's own contract against that function, not through what it happens to call.**

`tests/continue.test.ts` now flies a level, starts a run, and looks at the field —
`resetScene`'s contract, asked of `resetScene`. Given that test, 0057's change goes red on the day it
is made, and 0057 is still right.

## The cheap generalisation, and why it is refused

*"Every rule that is true by side effect should be asserted directly"* is unfalsifiable advice: it
names no way to find the rules that are true by side effect, which is the entire difficulty. What is
worth carrying forward is narrower and checkable by a human at review time:

> **When a change deletes a line, ask what else that line was doing.** The deletion is where this
> class lives — every one of 0057's probes was about behaviour it ADDED or KEPT.

[0027](../docs/decisions/0027-measure-the-picture-not-the-model.md) already says the same thing in
the language of pictures — *"when a fix removes a bug, ask what that bug was also doing"* — and this
is that rule one level down, in the language of code. It did not stop this, because the sentence
lives in a decision about tuning what the player watches move, and this was a two-line deletion in a
function nobody was looking at.

**No new rule in `CLAUDE.md`.** *Ask what a deleted line was also doing* cannot be mechanically
checked, and the constitution's own warning about counting guards applies to advisory rules too: it
would flag every healthy deletion as loudly as this one. The guard is worth having and it now exists.
