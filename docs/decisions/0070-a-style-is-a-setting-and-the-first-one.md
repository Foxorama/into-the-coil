# 0070 — A style is a setting, and the first one

**Accepted 2026-08-07.** Adds the third slice, the first thing on `SCREENS` that is chosen rather
than pressed, and the axis every later art pass hangs off. Sits under
[0024](0024-the-accessibility-floor-is-settings.md), which already said cosmetic settings exist and
where they may not go.

## The rule

**A style says what the game LOOKS like and may never say anything else.** It is a row in
`src/content/styles.ts`, it lives on a `settings` slice that no run can touch, and **nothing that
decides an outcome may import it** — held by a scan over `src/sim/` and `src/app/frame.ts` rather
than by anybody's intention.

**Retro is the game before the sky**, exactly: `World.sky` is the empty list, and the chrome wears a
monospaced face. **Modern is the default**, because 0024 says the default is the game as it is.

## What was asked for

> *"The pre-sky game was a really fun retro-sprite style game, can we add that in as our first
> setting? Retro UI / Modern UI — and then start updating the graphics across the board."*

## A choice is not an action, and that is the whole shape of it

`SCREENS` had one kind of control: an **action**, which *does* something and is usually the last
thing that happens on that screen. A tier button starts a run.

A **choice** is the opposite. It *is* something: it has a current value, the player can see which one
is on, and pressing it leaves them exactly where they were. Folded into `actions`, the title screen
would have five buttons of which three start a run and two do not, told apart by an index — and
[0046](0046-a-pad-is-a-first-class-way-to-press-a-button.md)'s focus ring would walk them as if they
were the same thing.

So `ScreenRow` gains `choices`, and the shape is deliberately the one the queue needs:
`docs/state-of-play.md` has palette, reduced motion and flash intensity waiting, and every one of
them is a named setting with a list of options.

⚠️ **An option carries NO VALUE, only a position.** The difficulty buttons already work this way —
`DIFFICULTY_KINDS` IS the order, so a control's index reads straight off it. A `value: string` on the
row would arrive at the reducer as a string needing a narrow to a `StyleKind`, and
[0016](0016-a-hub-enumerates-kinds.md) bans exactly the escape hatches that would take.

⚠️ **`SettingName` lives in `src/state/screens.ts` and `SettingsState` is a mapped type over it.** A
screen offering a setting the state cannot hold fails to BUILD, and a setting added to the state
without a name fails too — so *what can be chosen* and *what can be stored* cannot drift apart, which
is the thing a settings menu gets wrong first.

## Why a slice of its own, and not a field on the run

**Lifetime.** A run is begun, spent and ended;
[0039](0039-a-run-is-lives-and-a-death-costs-the-arsenal.md) puts the difficulty tier ON the run for
exactly that reason. A setting outlives every run after it, and a field on the run slice would be
reset by `begin` — the player's choice eaten every time they pressed a difficulty. There is a probe
for it, because it is the mistake that looks tidiest.

⚠️ **The settings slice takes part in NO cross-slice agreement**, and `src/state/root.ts` says so.
What a run is doing and what the game looks like are independent by construction.

## The ban, and why it is a scan

`src/sim/assist.ts` already states the rule: *"a player who turns the flashing down must not thereby
be playing an easier game, and one who turns it up must not be playing a harder one."* Assists are
kept safe by being **monotone**, asserted exhaustively over all 144 states. A cosmetic setting cannot
be monotone — there is no ordering in which *retro* is easier or harder than *modern* — so it has to
be kept safe a different way: **by not being reachable from the code that decides anything.**

`tests/style.test.ts` scans `src/sim/**` and `src/app/frame.ts` for the string. It is a fact about
the import graph rather than a claim about intentions, and it is the kind of guard that goes on
working after everybody who remembers the reason has gone.

⚠️ **`src/app/frame.ts` is the interesting entry on that list.** `sim/` obviously must not know; the
frame is where somebody would actually reach, because it is the file that already knows about
sprites — and it is also the file that decides what hits what.

⚠️ **The sky is a LIST SWAP, not a flag the painter branches on.** `src/render/scene.ts` walks
`World.sky`, so retro is that list being empty: no branch, no cost, and nothing below the shell ever
learns that a style exists. That is what makes the ban true by construction rather than by
discipline, and there is a test that the painter cannot see the table either.

## What was rejected

**A settings screen.** It is real and it is queued — `docs/state-of-play.md` has had one open for
weeks — and inventing it to hold a single two-option row would put the one thing a player might want
before their first run behind a door they have to find. The title screen is already where a run is
configured; 0047 put the tier there for the same reason.

**A style that also changes the sprites, in this decision.** The ask continues *"and then start
updating the graphics across the board"*, which is a programme rather than a change. What lands here
is the axis; the art is what goes into it, and `bakeAtlas` gains a style argument on the day there is
a second drawing to give it.

**Cycling on one button.** *Look: [Retro]* that toggles reads as a button whose label is a lie about
what pressing it does — and with three styles it becomes a lottery. A row of options with the live
one filled says what the choices are before anything is pressed.

## The layout, which the guard found before a phone did

The settings row went under the tier buttons, and `tests/layout.browser.test.ts` reported the title
screen **nine pixels into needing a scrollbar** on the smallest landscape phone. It now rides with
the pickup key, in the left column, which has the headroom — the buttons column is the taller of the
two. [0049](0049-the-chrome-is-authored-against-the-short-axis.md) is the rule; the interesting part
is that a row added at a comfortable desktop size is exactly how a phone gets pushed over an edge
nobody is looking at.

## Confirmed, not assumed

Probes in `scripts/probes/0070-style.mjs`. **6 red, and every tree back to what it was copied as.**

| broken on purpose | went red |
|---|---|
| the step given sight of the style table, so a look becomes a difficulty | `THE BAN: nothing that decides an outcome may import the style table` |
| the settings thrown away by a run action, which is what living on the run means | `is untouched by a run, which is the whole reason it is not on one` |
| the slice rebuilt on a press that changed nothing, so the chooser repaints for free | `preserves identity when nothing moved, which is what stops a re-paint per press` |
| the style never reaching the world, so retro dispatches perfectly and draws the sky anyway | `THE REPORTED ONE: retro is the game before the sky, and the sky actually goes` |
| the chrome left on one face, so only the background changes | `and the UI half of it lands too, which is what "Retro UI" means` |
| the live option told apart by opacity rather than by fill | `and the chooser says which one is on, in fill rather than in colour alone` |

⚠️ **Three of the six can only be seen in a browser, and the fourth row is why.** A style that
dispatches perfectly, moves the slice and marks the right button — and changes nothing on screen —
passes every unit test there is. `tests/style.browser.test.ts` counts the ink on the canvas: retro
takes the starfield off it, and the assertion is a FRACTION rather than a pixel count, because a
threshold in pixels would be tied to a viewport, a DPI and a star count at once.
[0027](0027-measure-the-picture-not-the-model.md).

## What this leaves owed

**The graphics, which is the rest of the ask.** Retro and modern currently differ by a starfield and
a typeface. The sprites are the same placeholder shapes in both, and
[0069](0069-the-sky-is-behind-the-game.md) already recorded that dimming the sky buys separation
without adding detail. `bakeAtlas` is where a style becomes a drawing, and it does not take one yet.

**Nothing persists.** A player who reloads gets `DEFAULT_STYLE` again. That is `save/`'s job and
`docs/state-of-play.md` has it queued with the first `itc_*` key — and this slice is the reason to do
it: a setting is the one piece of state a save should hold *without* a run attached, which
`docs/game.md`'s interruption-hedge framing does not currently cover.
