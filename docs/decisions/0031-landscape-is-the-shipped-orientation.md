# 0031 — Landscape is the shipped orientation, and a gate is what makes that true

**Accepted 2026-08-04.** Amends [0023](0023-the-long-axis-is-the-scroll-axis.md), which stands in
every other respect. 0023 decided how a viewport of any shape becomes a window onto the world; this
decides which of those shapes is shipped, and why the camera that computes both stays.

⚠️ **Touches a shipped surface** — `manifest.webmanifest`'s `orientation`. Rollback note below.

## The rule

**One authored view — side profile. Landscape is the only orientation shipped.**

**The game does not render play below a landscape aspect.** Where the scroll axis would be the
viewport's `y`, the page shows a rotate prompt and **the simulation does not step**. Not a warning
over a running game: a gate.

**Everything else in 0023 is retained** — `src/sim/camera.ts`, world-space authoring, `ACROSS_SPAN`
fixed at 100, the 1.5–2.4 lookahead clamp, and spawns placed against `MAX_ALONG_SPAN` rather than the
current view.

## Why the art, and not the geometry

The cost being reclaimed is the one `docs/game.md` names as the largest in the project: *every ship,
enemy and boss needs two views — side profile and top-down.* Halving that concentrates the same
effort on one view, which is a quality increase rather than a reduction in scope.

**The evidence is the predecessor's, and it is first-hand.** *The Far Carry*'s end-boss fight drew
landscape art in a portrait game, and the report is unambiguous: it looked *"really bad to the point
of being unplayable."* The failure was not that the geometry was wrong — the geometry was fine. It
was that ships and assets appeared to move the wrong way, and that **disassociation takes the player
out of the game entirely**. A shooter asks the eye to read a small fast arc against a scrolling
field; an eye arguing with the direction of travel cannot.

That is a *picture* failure measured in nobody's model units, which is
[0027](0027-measure-the-picture-not-the-model.md)'s whole subject, and it is the reason this decision
is about what is drawn rather than about what is computed.

## Why the camera stays

**It is not portrait scaffolding.** A level is far longer than a screen, so a scrolling shooter
authors in world units whichever orientation it ships; deleting the projection would mean authoring
in screen pixels, which is a different and worse architecture in landscape alone.

**And two thirds of 0023 is a landscape fairness property.** `ACROSS_SPAN` fixed at 100 is why the
dodge lane is identical on every monitor. The 1.5–2.4 clamp is why lookahead — which is reaction time,
which is difficulty — does not grow on a 21:9 ultrawide and shrink on a 16:10 laptop. Authoring in
screen space to be rid of portrait would reintroduce that unfairness **across desktop alone**, which
is the platform being prioritised.

So what is dropped is a *destination* the projection can already reach, not the projection. Portrait
stays a re-enable — one art view and one gate condition — rather than a rewrite.

⚠️ **It is retained, not promoted.** Nothing in the product claims portrait, the itch listing will
not, and `viewOf`'s `y` branch is code kept warm by a test rather than a feature.

## Why the manifest is not enough, and the gate is the mechanism

`orientation: landscape` binds an **installed PWA only**. It does nothing in a mobile browser tab,
and nothing inside the itch iframe — which serves from a shared CDN origin and is where most players
will meet the game first. Relying on it would mean the exact failure above stays reachable for
everyone who has not installed the app.

So the manifest becomes a hint and **the gate is the guarantee**. A rotate prompt is a fine
experience; a game whose art argues with its scroll direction is not, and the whole point is that the
second one cannot be reached.

## What this supersedes in 0023

0023 lists as a consequence:

> **Turning the device mid-run is legal and free.** The spans do not change; only which physical axis
> is which. The simulation never learns that it happened, and there is nothing to pause for.

**That is no longer true and is superseded here.** Rotating into portrait now gates and pauses; the
simulation stops rather than continuing unseen. The *reason* it was true — rotation does not change
the spans — still holds, which is why coming back is seamless and costs no re-measure of difficulty.

Every other consequence in 0023 stands, including the one that matters most: aspect is long ÷ short
and therefore invariant, so `viewOf` cannot be handed an orientation to get wrong.

## Rollback note

`manifest.webmanifest`'s `orientation` moves `any` → `landscape`. It is read at install time, so an
already-installed PWA keeps whatever it was installed with until the manifest is re-fetched; there is
no stored value to migrate and no key to version.

**Undoing it is the one-word edit back**, plus removing the gate — and the gate is what would
actually need removing, because a player on the old manifest who rotates would otherwise meet a
prompt their build has no way to explain. Nothing persists, nothing is versioned, and no save is
touched.

## Rejected: a warning overlay above a running game

Cheaper, and wrong. The simulation would keep stepping behind it, so a player who rotates mid-run
loses the run to something they cannot see — and the overlay would have to be dismissible to be
honest about that, at which point it permits the exact view this decision exists to prevent.

## Rejected: locking with the Screen Orientation API

`screen.orientation.lock('landscape')` works on Android Chrome in fullscreen and is unavailable on
iOS Safari, so it would cover some of the gap some of the time while reading as a solution. The gate
covers all of it everywhere, and is the thing that would still be needed afterwards.

## Confirmed, not assumed

Per [0005](0005-a-guard-must-be-seen-to-fail.md) and [0019](0019-a-probe-must-be-seen-to-apply.md),
declared in `scripts/probes/0031-orientation.mjs`.

| broken on purpose | went red |
|---|---|
| the gate condition removed, so portrait draws side-profile art moving the wrong way | `refuses to play in portrait, and says why` |
| the gate covering the game instead of stopping it, so the run continues unseen | `THE ONE THAT MATTERS: the world does not advance behind the prompt` |
| the prompt reduced to a bare glyph, on the one screen that exists to explain itself | `the prompt is text, so it does not rely on reading a pictogram` |
| the prompt no longer announced, so a screen-reader player rotates into silence | `announces itself, because it appears in response to something the player just did` |
| the resize path left ungated, so rotating MID-RUN reaches the view a fresh load cannot | `gates on a rotation INTO portrait, mid-run — the way a player actually meets this` |
| the manifest unlocked again, so an installed PWA offers the orientation with no art | `installs locked to the one orientation whose art exists` |

⚠️ **The first and fifth are the pair**, and the reason both exist: a fresh load in portrait and a
rotation mid-run take different code paths. Guarding only the first leaves the case a player actually
produces — playing, then turning the device — reachable.

⚠️ **The second probe caught this decision's most important assertion being decoration.** It opened
straight into portrait, where the loop is never started at all, so breaking the branch that stops it
left the suite green: *a loop that was never running cannot be observed failing to stop.* It now
starts in landscape, rotates, and compares two samples of the canvas 400ms apart — measuring the
picture, per [0027](0027-measure-the-picture-not-the-model.md), rather than a counter in the model's
own units.

## What has no guard

The choice to author one view rather than two is a content decision and nothing can hold it — a
top-down sprite added later would simply be unused. What *is* guarded is the gate: a browser test at
a portrait viewport asserting the prompt is shown, the canvas is not, and the simulation is not
stepping.

⚠️ **Not verified: no phone has been held.** The gate is asserted at a portrait viewport in headless
Chromium, which is the same shape and not the same thing — a real device adds an on-screen keyboard,
a rotation lock the player may have set, and a browser chrome that changes the viewport mid-rotation.
What would settle it is opening the staging URL on a phone and turning it, and that is owed.
