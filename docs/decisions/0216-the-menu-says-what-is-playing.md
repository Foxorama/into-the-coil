# 0216 — The menu says what is playing, and a working feature was reported as broken

**Accepted 2026-09-03.**

> *"the 'play all' button on the music settings page either never worked properly, or it regressed.
> it now just repeats the same track and the focused level never changes with regards to the menu to
> indicate which track is playing — I know the play bar works properly, but it looks buggy if the menu
> doesn't change the focus along with the level track."*

## The rule

**The music room marks the place it is playing**, on the button, with the same fill a chosen setting
takes.

**The focus ring is lent to the walk, not taken by it.** Pressing a control hands it over; the first
deliberate move takes it back, and the mark goes on following either way.

## ⚠️ Play all was working, and that is the finding

Driven on the real page before anything was changed: seeking to the end of the first walk handed over
to `Ember Nebula`, the readout said so, `next:` advanced to `Saurian Belt`, and **the backdrop changed
colour with it** — which means `applyPlace` followed, which means `applyMusicLevel` got the new theme
off the same variable. `tests/room.browser.test.ts` had been asserting that handover since
[0212](0212-the-room-walks-the-level.md) and was green throughout.

**What never moved was the nine buttons.** They are the biggest thing on the screen, they are what a
player looks at, and they said the same thing for seven places in a row.

⚠️ **A SCREEN WHOSE LARGEST ELEMENT CONTRADICTS ITS SMALLEST READS AS BROKEN, AND THE REPORT IS WHAT
THAT LOOKS LIKE FROM THE OUTSIDE.** *"It just repeats the same track"* is a correct description of
what the menu was showing. The instinct to defend the mechanism — *the handover is fine, look at the
test* — would have been answering a question nobody asked.

⚠️ **AND THE REPORT CONTAINED ITS OWN DIAGNOSIS.** *"I know the play bar works properly, but it looks
buggy if the menu doesn't change the focus"* — the second half says exactly which surface is wrong.
The first half was worth checking anyway, because *either never worked properly, or it regressed* is
a claim about behaviour and only a run of the thing can answer it.

## Why the ring is lent rather than taken

Moving a cursor under somebody's hands is the one way this could be worse than doing nothing.
`chrome.activate` presses **whatever the ring is on** — so a jump between a press being decided and it
landing starts a place the player did not choose, on a screen where every button starts something.

So there are two fields rather than one:

| | |
|---|---|
| `control` | which button is playing. **Always right**, always drawn, no interaction hazard. |
| `follow` | whether the ring should move with it. **Lent** on a press, given back on the first deliberate move. |

That split is what makes following safe to do at all: the guarantee the player has is the *mark*, and
the ring is a courtesy that gets out of the way the moment they want it.

⚠️ **`THEME_KINDS` IS THE INDEX, NOT A COUNT.** `src/state/screens.ts` walks that table to build the
row and `onMusicRoom` already reads it back the other way, so the index of a place **is** the index of
its control. A place added to `src/content/themes.ts` gets marked without anybody remembering, and
nothing counts buttons.

## ⚠️ The fill did not appear, for the reason this file has now hit three times

`.itc-music-action-playing` was written next to the room's other rules — **before** `${each('-action')}`,
which sets `background: transparent` at the same specificity. Later wins, so the button did not fill
and the change was **visibly nothing**.

[0210](0210-the-title-plays-the-music.md) recorded this twice while fitting the title screen: *"twice
the fix did nothing at all because the override sat BEFORE the base rule — equal specificity, later
wins."* The rule now sits beside `.itc-title-option-on`, after the shared action rule, and the comment
says why it lives there rather than with its neighbours.

**Caught by looking at the screen.** No guard could have: the class was applied, the element had it,
and every query about it answered correctly.

## Two test bugs, both racing the same contract

1. **A mark asserted after the handover it was meant to precede** — it read `Ember Nebula` and
   expected `The Approach`, which looks like the fix failing and was an assertion in the wrong place.
2. **A count read straight after a press.** The readout is pushed **on a tick**, which is the contract
   every `chrome.set*` keeps, so the clear had not happened yet. ⚠️ **And the `isVisible` check above
   it had been passing for the wrong reason all along**: by then the whole screen is hidden, so it
   would have read false whether or not anything had been cleared. A guard can be green because the
   thing it names is true for a reason that has nothing to do with the subject.

## ⚠️ And a budget that had never been measured gave way

Adding one browser test took the suite from **806 s of test CPU to about 1,050 s**, and
`tests/music.test.ts`'s spectral guard started **timing out at 30 s**. The obvious readings were both
wrong, and each cost a measurement to rule out:

- **Not the new unit file.** Running the suite with `tests/transition.test.ts` excluded produced the
  same failure and the same CPU.
- **Not the dev server**, which had been left running — stopping it changed nothing. (Worth checking:
  a second server is a known cause here.)

**It was that guard's own budget.** It runs in **8.4 s alone against a 30 s limit** on a tree
[0169](0169-a-browser-budget-is-measured.md) measured at *713 s of test CPU inside 251 s of wall
clock*. Three and a half times the solo cost is not a budget four workers deep; it is a coin toss that
had been coming up heads.

⚠️ **THE BLOCK DIRECTLY ABOVE IT IN THE SAME FILE IS ALREADY AT 60 s, WITH THE ARGUMENT WRITTEN OUT** —
*"no part of this claim is about time… the only thing that varied is how long four workers took to get
here"* — and `tests/sound.test.ts` made the same move going 60 → 120. **This one had simply never been
revisited.** So it is now 60 s, seven times its measured cost, which is 0169's own ratio; and its note
says that if it ever approaches 60 s something has genuinely slowed down and the number must not move
again to hide it.

⚠️ **AND THE BROWSER TEST WAS FOLDED RATHER THAN ADDED.** The ring-lending assertions ride the page
0214's grid test already opens, because a second `open()` is a second context, a second load and a
second audio prewarm. The subjects are adjacent — both are the focus ring on this one screen — and
saying so in the test is cheaper than paying for it twice.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0216`.

| broken on purpose | went red |
|---|---|
| the menu no longer marking which place is playing, which is the report exactly | `says which place is playing, where in it, and what Play all moves to next` |
| the ring never lent to the walk, so it sits on Play all while seven places go past | `says which place is playing, where in it, and what Play all moves to next` |
| the focus ring never given back, so the walk moves the cursor under the player's hands | `gives the focus ring back the moment the player moves it themselves` |
| the mark left on after leaving the room, so a place claims to be playing when none is | `leaves the run's camera where it found it` |

⚠️ **THE SECOND AND THIRD ARE OPPOSITE MISTAKES AND BOTH ARE GUARDED**, which is the point of writing
them as a pair: never lending the ring leaves the menu pointing at *Play all* for the whole run, and
never giving it back takes the menu off the player. The rule is only correct between them.

## What is owed

**Nothing measurable.** Whether a filled button reads as *this is sounding* rather than as *this is
selected* is an eye's call, and it is the same fill the title screen's settings already use — so if it
reads wrong here it probably reads wrong there too, and that is one change rather than two.
