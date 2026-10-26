# 0684 — A shut pilot is unnamed

**Accepted 2026-10-26.** From the play of 2026-10-26. Amends [0546](0546-the-marmot-rides.md)'s card
and [0592](0592-the-crashes-are-counted.md)'s hint.

## The ask

> *"secret characters should show ????? instead of their name until they're unlocked."*

## What was there

0546 made a shut pilot's face a silhouette, *"so the player sees someone is there and not who"* — and
left the name under it. The title said *Marmot*, *Unity* and *MMXXVI* under three dark shapes, the
hover tooltip and the reader's label said the full name, and the band's line said *… to fly The Marmot*.
The silhouette hid nothing the line beside it did not say.

## The rule

**Until their lock is met, a shut pilot is called `?????`** — `HIDDEN_NAME` in `src/content/golfers.ts`
— wherever their name would be:

| | |
|---|---|
| **under the card** | the name they go by, on the title's band |
| **the tooltip and the reader's label** | the full name, on every pilot band (the title's, the hangar's, Paint & Parts', Cosmo's) |
| **the lock's hint** | *Beat the jellyfish with … to fly ?????*, *Lose 10 more lives to a crash to fly ?????* — `pilotWhy` and the per-card `lockHint`s |

The chrome writes the name with the lock, in `setOpen`, because the lock moves while the page is open:
a tier finished or a tenth crash opens a pilot without a reload, and the name comes with it.

**Kept by name:** the Marmot's teaser lines in the Viper (0546 asked for them), and Unity's and MMXXVI's
shops in the hangar (0550) — they are keepers there, with signs over their counters, and the hangar does
not pretend otherwise. The player who connects the keeper with the silhouette has been given a hint, not
the answer.

## What guards it

- `tests/marmot.test.ts`: the band's sentence names the four who have to clear the game and never who it
  opens. Probed in `scripts/probes/0546-the-marmot-rides.mjs`.
- `tests/hidden.browser.test.ts`: on a fresh store the three shut cards say `?????` under the face, in the
  tooltip and to the reader, and the four open ones say their names; a hangar with the crashes counted
  opens Unity's name without a reload. Probed in `scripts/probes/0684-a-shut-pilot-is-unnamed.mjs`.
