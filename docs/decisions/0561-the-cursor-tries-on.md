# 0561 — The cursor tries on

**Accepted 2026-10-07.** Item 2 of the queue in
[the hangar family, reviewed](../../reports/the-hangar-family-reviewed-2026-10-07.md). Amends 0521's
*a step skips what is shut*, and the press of every slot band on Hangin' Out and Paint & Parts.

## The ask

The review's §1.3 and §1.4, and the player's answer to the first question:

> *"fit-on-move made safe, seeing how it immediately looks is good, but it shouldn't auto-equip when
> scrolling menus"*

And to the last: the group holding the dash and what hangs from it is called **Cockpit**.

## The rule

**A slot's band tries on. A step puts the option on the ship and fits nothing; a press fits it;
leaving the band, or the screen, puts the fitted one back.** It is a third `press` on the row,
`'tries'`, beside 0513's `'steps'` and `'takes'`. The chrome reads it and never the band's name.

| | |
|---|---|
| **a step** | left or right, a pad's d-pad, a ‹ › arrow, or a mouse over an option. The option is worn on the ship on its pad, on the readout, and on the dash, and ringed on the band. The band's line says what it is and how to fit it, in the hand's words: *Enter or a click fits it*, *A fits it*, *tap it to fit it* |
| **a press** | Enter, A, a click or a tap on the option. It fits the option, and the reducer writes it, as before. A pointer's press fits at once, because a pointer chose it |
| **leaving** | up or down off the band, the mouse leaving its options, a tab, Back. What is fitted is worn again. Nothing is written |
| **a shut option** | the cursor can stand on it and try it on, so the player sees what they are chasing. The band's line says what opens that one (`optionWhy`): *Beat the jellyfish in the Thunderbolt to borrow its gun*, *Sold at Cosmo's, the next tab*. A press on it is refused, and the band shakes once. It is `aria-disabled` rather than `disabled`, so it stays pressable |
| **with nothing tried on** | the band says 0521's sentence, why some are shut, as it did |

**How each state is drawn, by shape and not by hue alone**
([0024](0024-the-accessibility-floor-is-settings.md)):

| state | form |
|---|---|
| fitted | filled, with a tick in its corner |
| tried on | a ring on the option itself, with a glow. It was a faint glass on the whole row |
| shut | dashed and padlocked. The dash alone read as an empty slot |
| refused | the band shakes once. `prefers-reduced-motion` stills it |
| the cursor on the open tab | the ink ring every other control wears. It was the text's colour, and on the filled tab that is the void, so it was drawn black |

**And three smaller things the review named:**

- **Cockpit.** The group holding *Dash* and *Hanging* was also called *Dash*.
- **The empty hook.** *Nothing* is *Empty hook*, so it does not stand among the wares as though it were one.
- **Paint & Parts and Cosmo's open on their own first band**, below the line of faces that says whose
  ship it is ([0539](0539-the-readout-stands-down.md)'s `'line'` card). On arriving at Cosmo's the
  cursor stood on the tab strip, and the first press of down changed the pilot. A band of faces with
  the whole card under it, Hangin' Out's, is still where the hangar opens.

## Why the shell holds the try

What is fitted is the reducer's, and a try must never reach it, so the try is the shell's, like
Cosmo's window ([0542](0542-cosmos-counter.md)). `seen` in `src/app/mount.ts` is the hangar as the
stand shows it: the fitted one with the option tried on applied. It is computed by the reducer itself,
over a copy in which every ship is won and every ware owned, and the real `won`, `owned` and `shards`
are then put back, so a try wears a shut option without a second copy of what each slot means. Every
reader of the fitted ship outside a run (the pad, the readout, the dash, the opening counts) reads
`seen`. A screen change lets go of it.

## What the guards say

`tests/tries.browser.test.ts` presses the keys and reads what the game wrote. A step writes nothing, a
press writes the one tried on, leaving writes nothing, the cursor can stand on a shut gun and the band
names the ship that opens it, and a press there writes nothing. Its two probes put back each half of
the old behaviour. Four tests read a shut slot as `disabled` or walked into Cosmo's from the strip, and
were changed to read `aria-disabled` and to walk two rows up.

`tests/pad.browser.test.ts`'s flame test fails on this machine on `main` as well, at the same reading
(0.0015 of the stand moved against a floor of 0.0021). It is not this change's. The whole proof on CI
says whether it is the machine's.

## What is owed

A play with each hand: the keyboard, a pad and a phone.
