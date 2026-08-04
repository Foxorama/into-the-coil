# 0032 — Touch is relative drag, not a stick

**Accepted 2026-08-04.** Lands `src/app/touch.ts` and `src/app/pad.ts` — the first control schemes for
the device [0022](0022-frame-rate-is-a-feature.md) writes its frame budget against. Both are devices
under [0030](0030-input-is-actions-and-needs-no-new-layer.md) and neither changes anything below the
shell.

⚠️ **Written because the game could not be played on a phone at all.** `src/app/input.ts` binds
`keydown`, `keyup` and `blur` and nothing else. Every destination this project ships to — an
installed PWA, itch, a 2021 mid-range Android — is a device with no keyboard, and a play-test on one
found a ship that could not move. The gap was in `docs/game.md` first: it never says how the game is
controlled by a hand that has no keys.

## The rule

**Touch fills the same `Intent` a key does.** The sim never learns a finger was involved.

**The finger's *movement* is the ask, not its position and not its displacement from an anchor.**

| | |
|---|---|
| the ask | **`Intent` ← the distance the finger moved since the last step**, ÷ gain, saturating at 1 |
| the residue | delta beyond full deflection is **kept and delivered over the following steps**, never dropped |
| a still finger | asks for **nothing**. The ship holds position |
| lifting | moves the ship **not at all** — so the thumb can re-grip, like picking up a mouse |
| the gain | a **physical** distance, CSS pixels per full-speed ask. Greater than 1:1 |
| the specials | **one tap zone per binding, generated from the budget**, never enumerated |
| release | lift, `pointercancel` and blur all clear it, exactly as 0030 clears held keys |

## Why not a virtual stick, which is what the first draft of this decision said

A stick was proposed here and rejected on play experience: *"all the previous games I've played with
touch sticks have felt pretty awkward."* That is a report about the picture, which
[0027](0027-measure-the-picture-not-the-model.md) says is data and not an opinion. Taking it
seriously turns up four separate mechanisms, and relative drag is immune to all four:

| what makes a glass stick awkward | why drag does not have it |
|---|---|
| **no tactile centre.** A real stick springs back and your thumb feels the gate; glass does not, so your thumb drifts off the anchor and your deflection stops meaning what you think | there is no anchor to drift from. Every step is a fresh delta |
| **saturation.** Past full deflection, more thumb travel does nothing — the control goes dead in exactly the direction you are pushing | asking for more always costs more movement, with the residue banked rather than discarded |
| **re-centring.** Reversing means dragging back across the anchor before anything happens | reversing is immediate: move back, the ship moves back |
| **two integrations.** Thumb position → velocity → ship position. Your hand and the thing you are watching are two derivatives apart | one. Thumb delta *is* ship delta, scaled — the same mapping as scrolling a page, which is the most over-learned gesture on a phone |

**The first draft rejected "the ship under the finger" and stopped there**, which conflated two
different schemes. *Absolute* follow — the ship teleports to the touch point — really is bad, and for
the reason given: the thumb permanently covers the one object the player has to watch. *Relative*
drag has nothing to do with where the thumb is. The thumb can sit in a bottom corner while the ship
flies in the middle of the screen, which is what the mobile shooters that got this right actually do.

## The two objections the stick was chosen over, and how drag answers them

**"It makes position the ask, and `flyShip` takes velocity."** It does not have to. The delta since
last step, divided by a gain and clamped to 1, *is* an `Intent` — a direction with a magnitude,
exactly the shape [intent.ts](../../src/sim/intent.ts) already has. `flyShip` still writes velocity,
so [0022](0022-frame-rate-is-a-feature.md)'s interpolation contract is untouched. **No file under
`src/sim/` changes.** That is the test of whether 0030 was right, and it passes.

**"A finger can outrun `SHIP_SPEED`, making the input device a difficulty setting."** The ask
saturates at 1, so touch has the identical top speed a key does — that is what the clamp is. The
residue is what makes saturation honest rather than lossy: a fast flick delivers in full, over three
or four steps instead of one, rather than silently dropping the distance the ship could not travel.
Touch ends up *more precise* than a keyboard and never faster, and 0024 forbids making the game
easier, not making a control analog.

⚠️ **The gain is a starting point and nothing may assert on its value**, on the same terms
`src/sim/flight.ts` sets for `SHIP_SPEED`. It must be **greater than 1:1** or crossing the lane costs
several re-grips — the ship's 100 units span about 6cm of a phone held in landscape, and a thumb that
had to sweep 6cm to cross would be useless. What settles it is a thumb on a phone and
`scripts/trace-frame.mjs`.

## Rejected: tap a spot, fly to it

Not invented here — **The Far Carry shipped it for its end fight and it worked**, which makes it the
only scheme in this decision backed by a real player rather than by reasoning. It is rejected anyway,
and the reason is the one its own author named: it does not scale to harder bosses.

The mechanism behind that instinct: tap-to-destination is a **discrete command with travel time**,
and it is excellent when threats are sparse, telegraphed, and separated by more time than the flight
takes. `docs/game.md` describes the opposite — surviving an onslaught, where dodging is *continuous
micro-correction* and the correct position changes several times during any flight the tap
commanded. The scheme does not degrade at high density; it inverts, because every tap commits you to
a path you can no longer amend.

It stays worth remembering for a sparse beat if this game ever has one.

## Rejected: a drawn stick in a fixed corner

Everything above, plus it puts the control where the hand is not — thumb reach differs by hand and by
grip — and spends permanent screen in a game whose difficulty axis is how much of the lane you can
see.

## The specials must scale with the budget, or 0030 was decoration

0030's claim is that adding a third special is **one row in a table** and changes no type and no
save. A touch layer with two hand-placed buttons silently retracts it: the row lands, the keyboard
grows a trigger, and the phone does not. So the tap zones are derived from `SPECIAL_BINDINGS`, which
is itself derived from `ACTIONS`. Same one-description rule `tests/one-description.test.ts` already
holds for the budget.

## The gamepad rides the same seam, and lands with this

Cheap, and it is the third independent device — which is what turns 0030's *"input is actions"* from
a claim into a demonstration. Its one non-obvious piece is a **deadzone**: a stick at rest reports
small non-zero values, so a ship left alone drifts. Radial, not per-axis — a per-axis deadzone
squares off the corners and makes a diagonal reachable while a shallow angle is not.

It is polled rather than evented, which suits a fixed step: `navigator.getGamepads()` is read once
per step in the sampler, like a held key.

## Three devices compose by summing, not by winning

`src/app/devices.ts` zeroes the intent once and asks every attached source to **add**. The rule
sounds like plumbing and is not: a source that *assigns* wins by being attached last, so which
control scheme the player is actually using becomes a property of the order `mount.ts` happened to
call things in — invisible in every unit test, and it changes the first time someone tidies the
imports.

Summing is order-independent, which is the property worth having. It also gets two cases right for
free: a device asking for nothing contributes zero and cannot dilute one that is asking, and two
devices pushing opposite ways cancel — the same answer `src/app/input.ts` already gives two opposed
keys.

⚠️ **The clamp is what stops a second device being a speed-up.** Two hands on two devices both
pushing forward is still 1, so `SHIP_SPEED` remains the ceiling however many things are plugged in.

## Telling the browser this is a game, and only where it is one

Found by playing, not by reading: on a phone, a long press on the playfield opened the iOS callout
and a second finger zoomed the page — on a build with *no touch handling at all*, because nothing
had ever said otherwise. Four separate defaults, each of which brings back exactly one symptom:
`touch-action` (pan, pinch, double-tap zoom), `-webkit-touch-callout` (the long press), `user-select`
(long-press selection), `overscroll-behavior` (pull-to-refresh).

⚠️ **On the canvas, never on the document.** Suppressing zoom page-wide is an accessibility
anti-pattern, and [0024](0024-the-accessibility-floor-is-settings.md) makes that this project's
problem specifically. The playfield refuses gestures; everything around it stays pinch-zoomable, and
that is asserted in both directions — one probe removes the suppression, another applies it to the
whole document.

⚠️ **One of the four cannot be tested here, and it is written down rather than quietly dropped.**
Chromium does not implement `-webkit-touch-callout`: it refuses the property on `setProperty` and
reports nothing computed or inline, so this suite cannot tell a correct line from a missing one. iOS,
where the callout actually opened, is the one engine the suite cannot run. It gets the second half of
a two-halves guard per [0025](0025-the-frame-budget-is-counted-not-timed.md) — a source scan, which
sees the line the browser cannot, and is blind to exactly what the browser half sees.

## What this deliberately does not decide

**The gain and the deadzone numbers**, above. **Whether anything is drawn** for either control — a
picture question, and 0027's instrument owns it. **Where the tap zones sit**, beyond how many there
are. And **whether a phone is better served by a gamepad**, which is the question this cannot settle
by argument: both ship on the same branch, both reach a phone at the same preview URL, and the phone
answers it.

## What has no guard

**Whether it feels good.** Everything testable here is structure — that the ask saturates, that the
residue is delivered and not dropped, that a still finger asks for nothing, that the zone count
tracks the budget, that a deadzone is radial. None of it can see a control that fights the player.
That is 0027's territory and it needs the phone.
