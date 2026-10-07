# 0574 — Nothing of mine hurts me, and the strip stands as the pad does

**Accepted 2026-10-07.** Item 1 of [`the-arms-planned`](../../reports/the-arms-planned-2026-10-07.md).
**Reverses [0053](0053-the-bomb-is-the-first-thing-the-player-spends.md)'s *the blast hurts the
player***, and with it the same pairing's reach to [0537](0537-the-candle-is-lit.md)'s fireworks and
[0442](0442-the-ray-gun.md)'s bursts. **Amends [0376](0376-a-trigger-for-the-gun-and-one-for-the-tubes.md)
and [0447](0447-the-ward-is-a-third-trigger.md)** on where the strip stands each trigger; the binding
is unchanged.

## The ask

> *"the Cockpit has special, missile, guard -> but the gamepad buttons are guard, special, missile ->
> it's weird and awkward that the display in game doesn't match the 3 buttons on the gamepad"*

> *"no special hurts the player - lets make them all consistent"*

Asked whether the ray gun's burst — a gun, not a special, in the same pool — should go the same way:
*"Yes, nothing of mine hurts me."*

## What was true

- **The player's blasts were paired with the ship** in `src/app/frame.ts`, one `collideIntoOne` over
  `w.blasts`. Of the eight specials, the **bomb**'s blast and the **candle**'s fireworks land there
  with damage and so could cost the ship a hit; the storm, whirlpool, hunt, overdrive, void and nova
  never could. The **ray**'s burst, the one gun with an area, landed there too.
- **The strip stood the triggers in the binding order**: `SIDES` is gun, tubes, ward, which is
  `special1`–`special3`, and the pad binds them to A, B and X. On the pad X is left, A bottom-centre and
  B right, so the thumb reads ward, gun, tubes while the strip read gun, tubes, ward.

## The rule

**Nothing the player fires hurts the player.** The ship is paired with no body in `w.blasts`, which
holds only the player's: a bomb's blast, a candle's firework, a ray's burst, a rift, a pyre. They
still land on everything else exactly as before, once.

**The strip stands its triggers where the pad's face buttons stand, left to right** — guard, special,
missile. `PAD_FACE_ACROSS` in `src/app/pad.ts` says where each standard face button stands, and
`slotsLeftToRight` sorts the triggers' slots by their buttons; the strip appends its groups in that
order. `setHud` still writes by slot. The hangar's cockpit monitor is the same element, so it moves too.

## Why it is built the way it is

**The pairing is deleted rather than given a flag.** Every body in the pool is the player's, so a
per-row *hurts its own ship* field would be a field every row says `false` to — a constant wearing a
column. If a hostile blast is ever wanted it is a pool of its own, as every other threat has.

**The order is derived from the pad, not written down a second time.** A literal `['ward', 'gun',
'tubes']` would be a second description of the binding table, and would go wrong silently the day a
button moved. The keyboard (Space, Shift, E) and the touch discs have no left and right to agree with,
so the pad is the only hand with an answer; the touch discs keep their order up the leading edge.

**What 0053 called the skill in it goes.** Chasing your own bomb was the one way to be hurt by it, and
the ask is the consistency. The bomb's reach, its share of a boss and its one landing are untouched.

## Rollback

None needed — no storage key, save field or shipped surface is touched.

## What guards it

`tests/bombs.test.ts`, *0574 — nothing of the player's hurts the player*: a ship that chases its own
bomb into the blast keeps every shield, and a blast, a firework and a ray burst each planted on the
ship cost it nothing. `tests/hud.browser.test.ts`: the strip's stacks read left to right in pixels are
ward, gun, tubes. `tests/stand.browser.test.ts` counts the cockpit monitor in the strip's order.
Probes in `scripts/probes/0574-nothing-of-mine-hurts-me.mjs`; 0053's own probe of the pairing went
with it.

## Owed

- A play: the bomb and the candle thrown close, which a player may now do on purpose.
