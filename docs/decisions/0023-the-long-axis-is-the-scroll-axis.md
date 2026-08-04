# 0023 — The long axis is the scroll axis: one authored world, two orientations, a clamped view

**Accepted 2026-08-04**, before the first frame is drawn, as `docs/game.md` said it had to be. Lands
`src/sim/camera.ts` and changes a shipped surface — the manifest's `orientation`.

## The rule

**The long axis of the screen is always the scroll axis.** Landscape scrolls horizontally, portrait
scrolls vertically, and neither is a fallback.

Levels are authored once, in `along` × `across` world units:

| | |
|---|---|
| `along` | the direction of travel. Starts at 0, increases forever, unbounded |
| `across` | **exactly 100 units, always fully visible, on every device, in both orientations**. Centreline 50 |
| the handedness | `across` increases 90° clockwise from `along`. Landscape: `along` is screen +x, `across` is +y. Portrait: `along` is screen −y, `across` is +x |

That one handedness rule is what makes portrait a **rotation** of the authored level rather than a
mirror of it. Without it, a hazard authored on one side of the lane changes sides when the player
turns the phone, and no amount of care in the content tables would find it.

**Nothing is authored in screen space.** Attacks, spawns and terrain are world-space or they break on
rotation. The HUD is the exception and is confined to the gutter (below).

**The camera never follows the player.** It advances `along` at a rate authored per level. A camera
that followed would make the scroll rate a player input, which un-authors every wave's timing and
takes the authored assist path in the accessibility floor with it.

## Why rotation is free, which is the load-bearing part

Aspect ratio is defined as **long ÷ short**, and that is invariant under rotation: a 1080×2400 phone
has an aspect of 2.22 held either way. So `docs/game.md`'s promise that both orientations "show the
same span of world and play at the same difficulty" is not an approximation to be tuned — it is
**exactly true, by construction**, and `tests/camera.test.ts` asserts it as an equality.

The consequences are larger than they look:

- **Turning the device mid-run is legal and free.** The spans do not change; only which physical axis
  is which. The simulation never learns that it happened, and there is nothing to pause for.
- **Orientation is not a setting, a code path, or a variant.** `viewOf` takes two dimensions and
  works out which axis is which, so no caller is in a position to get it wrong.
- **The variable that remains is aspect ratio, not orientation.** Everything below is about devices
  differing in shape, and none of it is about landscape versus portrait.

## What varies between devices, and by how much

`across` is fixed, so the **dodge lane is identical everywhere**. That is the difficulty axis of a
shooter and nothing is permitted to move it.

`along` varies, because a longer screen legitimately shows more of the world:

    alongSpan = 100 × clamp(aspect, 1.5, 2.4)   →   150 to 240 units

Lookahead is difficulty too — it is reaction time — so it is clamped at **both** ends. Outside the
clamp the excess becomes gutter, never extra world.

**The clamp is chosen against device classes, not for roundness.** Every phone and every ordinary
laptop or monitor is inside it and gets no bars: 3:2 (1.50), 16:10 (1.60), 16:9 (1.78), 19.5:9
(2.17), 20:9 (2.22), 21:9 (2.39). Bars appear on 4:3 and 5:4 tablets, on true ultrawide, and on a
desktop window someone has dragged into a letterbox shape.

That the tablet is one of the two barred classes is the right way round: it is a large screen where
the bars cost little, and it is not the device the frame budget in
[0022](0022-frame-rate-is-a-feature.md) is written for.

⚠️ **The honest statement of parity.** Between orientations it is exact. Between devices, the dodge
lane is identical and lookahead varies by a factor of 1.6 — that ratio is the whole of the residual
variance, and it is stated here so that it can be argued with rather than discovered. **If play shows
the widest screens are measurably easier, lower `MAX_ASPECT`.** It is one constant with a test on it.

## Where the bars go, and what lives in them

The fit is `min(long ÷ alongSpan, short ÷ acrossSpan)` — one uniform scale, so a circle is a circle
and a hitbox radius means the same thing everywhere. A squarer screen gets bars on the `across`
edges; a longer one gets them on the `along` edges.

**The HUD is screen-space, lives in the gutter where there is one, and never carries information by
position alone** — a rule it needs anyway, because the gutter is absent on most devices and its edges
swap with orientation. The accessibility floor owns the rest of that; this decision only fixes where
the room is.

## Spawning is authored against the widest view that exists

A wave placed just past the leading edge of the authoring device is a wave that **materialises in
plain sight** on a longer one. So the spawn line is `camera + MAX_ALONG_SPAN + EDGE_MARGIN` — 280
units ahead — computed from the widest view any device may have, never from the current one.

Culling is not symmetric with it, and the asymmetry is worth naming: the **trailing** edge sits at the
camera on every device, so it does not vary with aspect. Only the leading edge does.

`EDGE_MARGIN` is 40 units, and it is simultaneously **the largest half-extent any entity may be
authored at** — a margin only hides a thing that fits inside it. That caps a boss at 80 units across,
four fifths of the dodge lane; anything larger is a wall, and a wall is terrain.

## Rejected: fixing the `along` span and letting `across` vary

The other way to hold "the same span of world". Rejected because it inverts the cost onto the axis
that cannot take it: with `along` fixed, `across = along ÷ aspect`, so the **phone gets the narrowest
dodge lane** — the longest screens would be the hardest, and the hardest device would be the one with
the smallest screen and the tightest frame budget. Fixing `across` puts the whole of the variance
into lookahead, which is the gentler of the two.

## Rejected: letterboxing to a single authored aspect

Pick 16:9, bar everything else, and parity is perfect on every device. Rejected because it is perfect
parity paid for by every phone in existence: a 20:9 phone would play in a 16:9 box with 20% of its
screen black, in the orientation the whole rotation design exists to make first-class. The clamp buys
most of the parity for none of that, and it names what it did not buy.

## Rejected: a `landscape` orientation lock, which is what was already shipped

`public/manifest.webmanifest` has said `"orientation": "landscape"` since the shell landed. It went in
as scaffold configuration and was never argued — the case
[milestone 0003](../milestones/0003-the-line-before-the-game.md) uses as its example of a design
decision taken as a setting. It is now `"any"`.

⚠️ **This is an irreversible surface, and here is the precise reason.** An installed PWA holds its own
copy of the manifest. Changing `orientation` on the server does not re-shape an app that is already on
a home screen, and on some platforms it will not until the app is removed and re-installed. So the
players affected by getting this wrong are exactly the ones who liked the game enough to install it,
and no deploy reaches them. Held by `tests/shell.test.ts` and by `scripts/verify-deploy.mjs`, which
now check the built manifest and the live one respectively.

## Rejected: giving the camera its own layer, and putting it in `render/`

`src/sim/camera.ts` sits in the model because **what is visible decides what spawns**. The
pop-in rule above is a number the model needs before a painter exists, and putting it in `render/`
would leave `sim/` unable to say where a wave goes — or force it to keep a second, quietly
disagreeing copy. It is the stage contract, so it lives with the stage contract, and
[0015](0015-the-layer-ladder.md)'s table needed no change to accommodate it.

What is left for `render/` is applying the result: a translate, a rotate, and 0022's DPR cap. This
file computes in CSS pixels and touches no canvas.

## Rejected: throwing on a zero-sized viewport

A hidden tab and the first layout pass both produce `0 × 0`, so it is a real state and not a bug.
Throwing puts an exception in the frame loop for a normal event; returning `NaN` is worse, because a
`NaN` transform blanks the canvas with nothing to grep for — the predecessor's white screen, rebuilt.
It returns a fully-formed reference view at `scale: 0`. Nothing draws, visibly and on purpose.

## Confirmed, not assumed

Per [0005](0005-a-guard-must-be-seen-to-fail.md) and [0019](0019-a-probe-must-be-seen-to-apply.md),
declared in `scripts/probes/0023-camera.mjs` and re-run by `npm run prove` on every PR.

| broken on purpose | went red |
|---|---|
| the dodge lane scaled with aspect, so a longer screen gets more room to dodge | `shows the same dodge room on every screen` |
| aspect taken as width ÷ height, which is not invariant under rotation | `shows the identical view rotated` |
| the upper clamp dropped, so an ultrawide sees half a level ahead | `clamps lookahead at both ends` |
| the fit taken as the LARGER ratio, which crops the world instead of letterboxing it | `never crops, and never stretches` |
| spawns placed against the REFERENCE view rather than the widest one — the pop-in bug | `puts the spawn line beyond the widest view any device can have` |
| the zero-size guard removed, so a hidden tab hands the renderer a NaN transform | `returns a drawable view for a viewport with no size` |

⚠️ Four of the six are the same mistake wearing different clothes: **treating the device in front of
you as the only device.** That is the failure mode this decision exists for, and it is invisible on
the machine the code was written on.

## What this deliberately does not decide

The scroll **rate**, which is tuning and belongs to content; the chart between levels, which is not a
scrolling view at all; and the art's two views per entity, which
[0022](0022-frame-rate-is-a-feature.md) already routes through `(kind, variant, palette, view)` and
`docs/game.md` already names as the single largest art cost in the project.

---

## Retired 2026-08-04: the manifest half of this decision

[0031](0031-landscape-is-the-shipped-orientation.md) moves `orientation` back to `landscape` and says
why. Two things here were written against `any` and stop being true with it:

- **"Rejected: a `landscape` orientation lock"** above, and its closing *"It is now `"any"`."* The
  paragraph under it stands on its own terms — an installed PWA holds its own copy of the manifest,
  so no deploy reaches the players who liked the game enough to install it. That is the reason
  [0031](0031-landscape-is-the-shipped-orientation.md) carries a rollback note, and it is why the
  value moved once more rather than twice.
- **A seventh probe row**, `the manifest locked back to landscape` / `installs unlocked, because both
  orientations are the game`. Its break is now the shipped state and its guard is a test that no
  longer exists, so the entry is deleted from `scripts/probes/0023-camera.mjs` rather than flipped —
  the surface is probed from the other direction by
  [0031](0031-landscape-is-the-shipped-orientation.md)'s own manifest entry.

⚠️ **The seventh row's own footnote earns keeping, because it is now twice true.** That assertion had
sat in `tests/shell.test.ts` since the shell landed and had never been probed in either direction; it
was cheap to prove the moment something finally changed the value, which is also the last moment
anyone would have thought to. What the change then exposed is that *three* places described that one
value — this file, `tests/shell.test.ts`, and `scripts/verify-deploy.mjs` — and only the one the
suite runs moved with it. `npm run prove` caught this copy on the first CI run after 0031; the
verifier's copy is not run by anything but a real deploy, and was caught by hand.
