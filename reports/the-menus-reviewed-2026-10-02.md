# The menus, reviewed — 2026-10-02

**A design-and-quality pass over the title, its sub-screens and the missing pause**, asked for as:

> *"the three difficulty buttons could be a single toggable band; the pilots could be smaller with
> profile pics and be toggleable (although it's going to be an expanded roster so who knows); the
> menu navigation with game pad is atrocious; music, retro, brief/long nav vids could be in settings;
> the display for the pickups and bombs isn't actually helpful anymore, it could be a tab in settings
> of 'How to Play' and explain what each item does and when/how to pick it up; the high scores scroll
> too fast and are hard to read and the flashing in and out is awkward, could just be the top 5 …
> ensure that mobile has its own menu options as well configured properly for mobile. We also need to
> add a pause/settings button in game as well so that people can pause, change settings or quit
> mid-game if they want."*

Looked at on `main` at `5391d51`, from the built page, at 1280×720 and an 844×390 touch context
(`deviceScaleFactor` 2), with a seeded ten-row table, and with a **stubbed standard gamepad driven
through the title** so the navigation finding is a recorded walk rather than an impression. A queue,
highest value first; this file holds the plan and the answers, and each change's decision holds what
it decided once it lands.

## What is wrong, measured

### The pad walk — the report is right, and it is worse than jerky

D-pad presses from the first control, recorded off `document.activeElement`:

| shape | presses | where the focus went |
|---|---|---|
| 1280×720 | down ×7 | Legendary → Savior → Burn → **Off** → Legendary → Savior → Burn → Off |
| 1280×720 | right ×5 from Off | Scene → Brief → **Retro** → Modern → On |
| 1280×720 | up ×3, left ×2 | Music → Burn → Savior → **Music** → Modern |
| 844×390 touch | down ×7 | Legendary → **Retro** → Legendary → Retro → … |
| either | B on the music room | nothing — the title does not come back |

- **Music and Pilot cannot be reached by pressing down** on the desktop: the walk goes from the last
  tier straight to the *middle settings chip* and wraps. `spatially` in `src/app/chrome.ts` scores
  `step + drift × 2` between box centres, and on a layout with five box sizes the half-width pair
  under the tiers loses to a chip further away that happens to be centred.
- **Left from a tier lands on Music, and left again on a settings chip** — the geometry has no
  opinion and the fallback list walk supplies one.
- **On the phone, down only ever toggles between the first tier and the first chip**; the second and
  third tiers are reachable by left/right alone.
- **Every two-option setting is two stops**, so the title has eleven focus stops for five decisions.
- **There is no back button.** B, and Escape, do nothing on the music room or the pilot screen; the
  only way out is walking to a *Back* tile.
- **The focus returns to the first control on every screen**, so leaving the music room puts the
  cursor on *Legendary Pilot* rather than on *Music*.

**The class, not the instance:** a geometric guess at what the player meant, over a layout the art
pass is free to rearrange. 0214 was right that a grid is not a list; the answer that holds is that
**a menu is authored rows** — up and down move between rows, left and right move within one — and the
layout is drawn from the rows rather than the rows recovered from the layout.

### The title

- **Three tier buttons are three of the five largest things on the screen** and they are one choice.
  Each is also a *start* button, so choosing a tier and starting are one press — which is why there is
  nowhere to put a pilot choice except a second screen.
- **The pilot is a screen away**, behind a button whose only content is the current name, and the
  card it opens is the boot screen's full-size portrait card — four of them fill a 1280 screen, so a
  larger roster has nowhere to go.
- **The pickup key rolls four faces through four rows** (0432). It says what a face *is* and never
  how to get it, or that the bubble cycles and you take the face that is showing — the one thing a
  new player needs and cannot see on the field. On the title it competes with the table for the same
  column and they take turns.
- **The table rolls ten rows at two seconds a row and duplicates itself to loop**, so at any moment
  rows 8–10 sit above row 1 (*"8. 388139 … 10. 241893 … 1. 900000"* in the same frame), and the whole
  column cross-fades with the key every nine seconds.
- **Look, Sound and Travel are a strip of six chips** under the menu — the settings a player sets
  once, given the same screen as the choice they make every run.
- **Nothing persists except the table.** `itc_scores` is the only `itc_*` key; the look, the sound,
  the travel and the pilot reset on every visit. A settings screen that forgets is not a settings
  screen.

### In the run

- **There is no pause.** No key, no pad button, no tap target. A run can only be left by dying.
- **A hidden tab stops the sim and not the music.** rAF stops; the music free-runs on
  `AudioContext.currentTime` (0160), so a player who switches tab and back returns to a run whose
  beat-authored volleys and its score have come apart by however long they were away.

## The design

**One rule underneath it: every menu screen is a short list of rows, each row is either a band (a
value you move along with left/right) or a button (a thing you press), and the pad, the keyboard,
the mouse and a thumb all read that one model.**

### The title — four rows

```
              [badge]  Into the Coil

  HIGH SCORES          ‹  Legendary · SAVIOR · Burn  ›      ← difficulty band
  1. 900000 Feather    Be the hero you want to be
  2. 826877 Huang-Woo
  3. 753754 Longshot   ‹ (●)(●)(◉)(●) ›                     ← pilot band, round portraits
  4. 680631 Backspin   Backspin Bo — The Firebird · Shuriken
  5. 607508 Feather
                       [        LAUNCH        ]             ← primary
                       [ Settings ]
```

- **Difficulty is a band**: one row, three segments, the chosen one filled, its hint under it.
  Left/right moves along it; a click or tap on a segment chooses it. Choosing no longer starts.
- **The pilot is a band of round portraits** — the same `paintPortrait` art, at a thumbnail — with
  the chosen pilot's name, ship and gun on one line under it. It is a band, so a larger roster is the
  same row: past what fits, it scrolls with the chosen portrait kept in view, and nothing else on the
  screen moves. The title's *Pilot* button and the pilot sub-screen go. **The boot screen's large
  cards stay** — that screen is the first meeting and the sound's press (0415), and it is not this
  ask.
- **Launch is the one primary button**, and the focus starts on it, so a returning player's first
  press starts a run with what they chose last time. A on either band launches too.
- **The table is the top five, still.** No roll, no loop, no cross-fade; the score in the gold
  display digits, the pilot, how far. An empty table says nothing rather than a placeholder.
- **The key leaves the title** for *How to play*.

### Settings — a screen, reached from the title and from the pause

Tabs along the top (LB/RB on a pad, left/right on the tab row):

- **Options** — *Look* (Retro/Modern), *Sound* (On/Off), *Travel* (Scene/Brief), each a band; on a
  touch screen, a *Touch* section (below). *Music room* is a button here, and *Back* returns to
  whichever screen opened Settings.
- **How to play** — one row per pickup, its real sprite turning through its faces as the field does:
  **what it does, and how to get it** — *a bubble drifts in and turns through its faces; fly into it
  and you take the face showing.* Then each special with its button on the device in hand (keyboard,
  pad or touch — the one detected, the others a tap away), and the controls. Copy comes from the
  content rows (`PICKUPS`, `SPECIALS`, the bindings) so it cannot drift from the game.
- **Settings persist** under a new `itc_settings` key, versioned from 1 and read defensively the way
  `itc_scores` is. **This is an irreversible surface** and its PR carries the rollback note (0001).

`docs/game.md` says *the title screen carries a key* and *no coaching; hints are added where play
proves they are needed*. The first is superseded by this ask. The second holds: How to play is a
reference the player opens, not a hint pushed at them — and *play proved it is needed* is exactly
what the ask is.

### The pause

- **A pause button in the top strip**, on every device — on a touch screen a thumb-sized one clear of
  the trigger discs. **Escape and P** on a keyboard, **Start** on a pad (button 9 is free in play;
  0–3 are the specials).
- **A hidden tab pauses the run** — the fix for the clock coming apart, and the behaviour a player
  expects.
- **The pause screen**: *Resume* (focused), *Settings*, *How to play*, *Quit to title* — Quit asks
  once (*Quit this run?*), because one stray press throwing away a run is worse than one extra press.
- **The world stops, the music stops with it.** The sim stops stepping (`steps: false`), and the
  `AudioContext` is suspended, which freezes `currentTime` — so the music and the beat-authored
  volleys resume exactly where they were, rather than a re-phase (0160 removed that machinery for a
  reason). Resume carries a short count-in, so the player has their thumb back before the bullets
  move.
- **Settings from the pause** changes Look, Sound and Travel mid-run. Nothing on that screen touches
  the sim (0024).

### The pad, the keyboard, the thumb

- **Rows, authored on the screen's row**, replace `spatially`'s guess on every menu: up/down between
  rows, left/right along a band, wrap at the ends of the list.
- **B and Escape go back** on every screen that has a way back; on the title they do nothing.
- **A held direction repeats** after a pause, so a long band or the music grid does not need a flick
  per step.
- **The focus is remembered per screen**, so coming back from Settings lands on Settings.
- **One cursor**: the pad and keyboard move it, the mouse hovers without stealing it.

### The phone

Every screen above is laid out for the 844×390 landscape case first and photographed at 740×360,
not shrunk from the desktop: the table and the bands side by side, every target at least 44 px tall,
Launch within a thumb's reach. The pause button sits in the top strip where no trigger disc is.

**A *Touch* section, on touch screens only** — both items asked for, in the table below:

- **Trigger side** — the trigger discs up the right edge (today) or the left, for a left thumb.
- **Steering sensitivity** — the touch gain (`reports/touch-gain-2026-08-05.md`) as a three-stop band;
  a comfort knob over input, not over the sim (0024).

## The queue

One PR at a time, each from `main`, each played on its branch preview before the next.

1. **The title is rows** — the difficulty band, the pilot band, Launch, Settings, the top-five table;
   the row model for focus, back, repeat and remembered focus on every menu screen; the pilot
   sub-screen and the title's key removed. *Settings* opens the existing strip in a panel until
   item 2 replaces it, so nothing is lost in between.
2. **Settings is a screen** — Options and How to play; the music room moved under it; `itc_settings`
   with its rollback note.
3. **The run can be paused** — the button, the keys, the hidden tab, the suspended audio and the
   count-in, the pause screen with Settings, How to play and Quit.
4. **The touch section** — trigger side and steering sensitivity.

A senior-design pass is owed on each before it is handed over: photographed at the camera the game
ships, at 1280×720 and 844×390, and the pad walk re-run and recorded like the one above.

## The answers

| question | answer |
|---|---|
| does *Quit to title* put the run on the table? | **yes** — a quit is kept like a run-over, if it makes the ten |
| the touch section — trigger side, sensitivity, both, neither? | **both** |
