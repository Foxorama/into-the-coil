# A hit that changes nothing on screen reads as a collision bug

**2026-08-05.** Second play-test verdict, on the combat slice
([0034](../docs/decisions/0034-a-threat-is-absolute-and-a-pool-is-the-pairing.md)), played at the
branch preview. First verdict on anything with threats in it.

## The verdict

- *"That's really good."*
- *"Definitely need to use a different icon for the different types of ships — I legit thought it
  was a bug for a bit that bullets hit an enemy and the enemy didn't get destroyed."*
- *"All the enemies and enemy projectiles are spawning from the right side of the screen, nothing is
  coming in from the top of the screen or coming up from the bottom."* Raised as a later question.
- *"That question aside and the different icons for different enemy types, it feels really good."*

## The report names one cause and there are two

The ask is **different icons**, and it is right on its own terms. But it is not what made a hit look
like a bug, and shipping only the icons would have left the reading intact.

**Every enemy in the game had two health, and nothing showed a survived hit.** So the first shot to
land on anything removed a bullet and changed nothing else on screen — which is pixel-for-pixel what
a shot passing straight through looks like. Not *some* enemies, not an edge case: the first hit on
every enemy, every time, for the whole session.

⚠️ **The ship already flashed and enemies did not**, and that asymmetry is the whole defect. It was
written as *"the hit flash is a second baked sprite selected by the sim"* and then applied to exactly
one body, because at the time the ship was the only thing that could be hurt without dying. The rule
was general; the implementation was not, and nothing noticed because the ship's own feedback was
perfect.

## Both halves, and what each one fixes

| | fixes |
|---|---|
| **a hit flash on any body that survives damage** | *"the bullet did nothing"* — the actual misreading |
| **a silhouette per enemy kind** | *"which of these shoots back?"* — the thing that was asked for |
| **`drifter` down to one health** | the common case now needs no flash at all: the harmless one dies to one shot |

The third is the cheapest of the three and probably does the most work. With `drifter` at one health
and `lancer` at two, *"it did not die"* becomes a fact about one enemy — the one that now looks
different, closes on you, and shoots.

⚠️ **`hazard` was the wrong ink to flash in and it was already in use.** Hazards are environmental
and are coming; sharing a colour between *this just took damage* and *this will hurt you* is the
confusion [0024](../docs/decisions/0024-the-accessibility-floor-is-settings.md) exists to prevent,
reached by the back door. `impact` is now its own role.

## The question held for later: everything arrives from one edge

Correct, and it is **content rather than architecture** — worth stating precisely, because the two
have very different prices.

The proof scene has exactly one spawn rule: *one enemy, at the leading edge, every 42 steps.* There
is no wave table yet. Nothing in
[0023](../docs/decisions/0023-the-long-axis-is-the-scroll-axis.md) prevents an entry from the
`across` edges — and that entry is in fact **cheaper** to author than a leading-edge one, because
`across` is a fixed 100 units fully visible on every device in every orientation. An entity parked
just outside it is off-screen identically everywhere, where the `along` span varies from 150 to 240
and every spawn has to be placed against the widest view any device can have.

So it lands with waves, and it is a table edit rather than a change of shape.

⚠️ **One real gap to close when it does.** There is no `across` cull — `cullAlong` and
`cullLeadingAlong` both act on the scroll axis only. An entity that dives off the top or bottom of
the lane and keeps going is invisible but still live until it happens to fall behind the camera,
which at the current scroll rate is several seconds of a pool slot doing nothing. Not a leak, and
not worth fixing before something can actually leave that way.

## What is still unjudged

**Whether the ship's flash should be solid or a blink.** It is currently lit for the whole
invulnerable window, which says *that hurt* and *you are briefly safe* with one signal. The version
before this blinked. Neither has been played against the other, and this is a picture question that
belongs to a hand — [0027](../docs/decisions/0027-measure-the-picture-not-the-model.md). Named here
rather than decided quietly.

**Whether the lancer's nose reads at speed.** It points back down the lane, at the player, which is
the genre's own convention for *this end is the dangerous end*. On a 5.5-unit sprite at phone scale
that is about 21 pixels of silhouette to carry the distinction, and no instrument here can tell
whether that is enough.

---

## What this does not re-open

**Nothing in the tuning ladder.** `SHIP_SPEED` and the scroll rate are still step 1 and are still
untouched, and `reports/drag-feel-2026-08-05.md` still has the order. *"It feels really good"* is a
verdict on the slice, not a measurement of the dodge — the measurement is the next session's job and
it wants the player deliberately trying to survive rather than trying it out.
