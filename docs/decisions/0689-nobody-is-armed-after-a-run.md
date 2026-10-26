# 0689 — Nobody is armed after a run

**Accepted 2026-10-26.** From the play of 2026-10-26. Answers what [0668](0668-the-band-arms.md) owed —
*"whether a returning player wants the pilot flown last armed after a run"* — and amends it and
[0513](0513-the-pilot-flies.md)'s *after a run the pilot flown last is armed*.

## The ask

> *"when you die and go back to the menu screen, it has a big READY next to the character name that doesn't show
> at other times."*

## The rule

**Back on the title after a run, no pilot is armed.** *Ready* is a press's answer (0668: the first A arms, the
second flies), and nothing has been pressed yet. The shell stands the pilot down as it leaves the run
(`leaveRun`), the same place it refits the pilot and moves the keepers.

0513's reason — a returning player's first A on the band flew at once — was a convenience for a player who
had just flown; the pill it now draws is read as a state they did not set. A press arms as before.

## What guards it

`tests/run-ends.browser.test.ts`: after the game over's countdown returns the title, the *Ready* pill is
hidden. Probed in `scripts/probes/0689-nobody-is-armed-after-a-run.mjs`.

## Rollback

None owed ([0001](0001-revertability-not-risk-rating.md)).
