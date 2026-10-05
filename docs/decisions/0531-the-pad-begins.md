# 0531 — The pad begins

**Accepted 2026-10-05.** Amends [0513](0513-the-pilot-flies.md)'s splash, which refused a pad's press.

## The ask

> *"gamepad appears to be not working at all now"*

## What it was

**A player holding only a pad could not leave the splash.** [0513](0513-the-pilot-flies.md) made the
splash wait for a press, and refused a pad's — *"A pad's press does not go on: it grants the page no
sound"* — so that the pilot screen would never open silent. With a pad and nothing else, *Press to begin*
stayed up for ever, and nothing past it could be reached: the game did not start, which is what *"not
working at all"* is.

Measured on the build of `main` before this change, with a stubbed pad and no other input from the boot:
the splash stayed up through four presses of A and one of Start. With one click on the page first, the
same pad walked the title, flew, steered and paused — so the pad itself was sound, and the splash was the
whole of the defect.

## The rule

**On the splash a pad's confirm is a press like a key's.** Made while the game loads, it is remembered and
the splash goes on the step it may (`onTick`, as for a key); made once it is ready, the splash goes on at
once. It asks for the sound as every other pad press does
([0412](0412-the-port-is-heard.md)'s attempt), which arrives wherever the page already has a gesture to
give it.

## What this costs, and why it is paid

**A pad-only player may now play in silence**, which is the outcome 0513 refused. The Gamepad API is
polled and makes no DOM event, so a browser has nothing to grant activation for; a page that has never
been clicked, tapped or typed at cannot start its audio, and no code here can change that. Any later key,
click or tap brings the sound in, as it always has.

The choice was between a game that may be silent and a game that does not start, and the second is not a
choice. 0513's reason was a good one for the splash's *timing* — wait for the load and the read, so the
first press on the pilot screen is instant — and all of that is kept; only the refusal goes.

## Why the suite did not see it

**Every pad test began past the splash.** `tests/menu.browser.test.ts` opens through `pastIntro`, which
presses Escape — deliberately, because Escape grants no activation and so leaves the page a pad-only
player has. But Escape is also a press the splash takes, so the one screen a pad could not leave was the
one screen none of those tests stood on. And the test that did stand there held the refusal as correct.

The guard now flies the whole way in with nothing but the pad: a press on the splash while it loads, Fly
on the pilot screen, the intro's skip, and the run's HUD
(`tests/intro.browser.test.ts`, *"0531 — goes on for a pad…"*). Its probe takes the press back out of the
splash. 0513's probe for the refusal is deleted with it, because the thing it broke is now the rule.
