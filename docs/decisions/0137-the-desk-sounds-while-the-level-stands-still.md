# 0137 — The desk sounds while the level stands still

**Accepted 2026-08-13.** The third amendment to
[0126](0126-the-dashboard-is-the-instrument.md)'s panel found by driving it, after
[0129](0129-the-desk-holds-a-value-not-a-multiplier.md) and
[0130](0130-a-layer-can-be-heard-on-its-own.md) — and like both of those, it is a gesture that
existed and cost the wrong number of moves.

> *"I need to be able to pause the music and then play a particular sound to be able to identify
> what's playing/not playing in the soundtrack. So I need the ability to play sounds without
> affecting the current run of the melody itself so I can click on drive, sub or whatever, listen to
> that sound and then identify what I need to adjust before I keep playing the melody track
> itself."*

## The rule

**Stopping the transport stops the level walking. It does not stop the desk.** With the page
stopped, one click on a layer button puts that layer on the air alone — the level clock does not
move, the rung does not change, the guns do not fire, and clicking it again returns to silence at
exactly the second you stopped at.

⚠️ **THE PIECE HOLDING STILL IS THE FEATURE AND NOT A SIDE EFFECT.** The old audition called
`togglePlay`, so a listen taken while stopped set the level moving underneath it: by the time you had
heard `drive`, the ladder had walked on and the rung you were asking about was not the rung you were
listening to. *"Without affecting the current run of the melody itself"* is a sentence about the
level clock as much as about the other twenty-two layers.

## ⚠️ It was one flag called `playing` and it was two questions

`rig/dash.ts` had a single boolean deciding **both** whether the level walked **and** whether the
loops were on the air. Every symptom follows from that:

| | |
|---|---|
| an audition could not sound without starting the walk | there was no way to say *on the air, not moving* |
| stopping silenced a desk that was deliberately holding something | the same flag, from the other side |
| the *live* column greyed out on a pause and un-greyed on an audition | the dimming followed the walk, and it is about the air |

**They are genuinely two things.** The level clock is what the scrub bar, the rung readout and the
strip are about; the loops being on the air is what [0119](0119-off-stops-the-loops.md) turns on.
0126 warned against inventing *"a fifth state"* when it fixed the pause — this is not a fifth state,
it is the two that were already there being named.

## ⚠️ The condition is *the desk is alone*, and it is not *something is held*

`deskAlone` is true when **every** layer is held and at least one is above zero. The obvious version
— *is anything held above zero* — is one line shorter and wrong in the case the report is about:

⚠️ **A LAYER WITH NO HOLD FOLLOWS THE MIXER.** So a transport put back on the air because one fader
was dragged would start the whole piece playing, which is precisely what was asked for the opposite
of. `scripts/probes/0137-desk-sounds-while-stopped.mjs` plants that version and the guard is what
refuses it.

⚠️ **The reported gesture satisfies it in one click**, because an audition holds all twenty-three
(0130). Reaching the same state from the faders is **silence everything**, then drag — two clicks,
said on the page rather than left to be discovered.

⚠️ **AND IT IS DERIVED FROM THE DESK RATHER THAN REMEMBERED**, on 0130's own terms: a remembered *I
am listening* flag goes stale the instant a fader moves, and the page would then be making a sound it
had stopped describing.

## ⚠️ Pause still silences a held desk, and the ordering is the rule

The one thing a pause is pressed for is to stop — 0126's amendment is titled after *"it stops the
timer bar, but the music is still running in the browser"* — so pressing it takes the loops off the
air whatever the desk is holding. A desk gesture **after** that pause puts them back. The last
gesture wins, and `onAir` is a variable rather than a derivation because no rule over the desk alone
can distinguish those two orderings.

**The page says which of the three states it is in**: walking, stopped, or **stopped · the desk is
sounding**. The dimming of the *live* column now follows the air and the word *stopped* follows the
walk, which is the whole reason they are two CSS classes.

## What is guarded, and what is deliberately not

| | |
|---|---|
| every one-click audition is audible with the transport stopped — 23 layers × 7 places | ✅ `tests/dash.test.ts`, built the way `auditionOnly` builds it |
| **one fader on its own does not put the piece on the air** | ✅ and it is the guard the obvious implementation fails |
| a desk holding nothing, or holding everything at zero, is silence | ✅ |
| the click, the `setOn`, the CSS | ❌ needs a browser — driven, and the run is below |

⚠️ **`Held` AND `deskAlone` MOVED TO `rig/transport.ts` TO MAKE THAT POSSIBLE**, which is 0126's own
rule: `rig/dash.ts` needs a DOM and an `AudioContext` to be imported at all, so anything a guard has
to reach lives in the module that needs neither. `aloneOn` stays in `dash.ts` and stays driven, as
0130 recorded.

## What was rejected

**Restoring the desk when a listen ends.** A snapshot of the faders taken at the start of an audition
and put back at the end is a real convenience and it is [0130](0130-a-layer-can-be-heard-on-its-own.md)'s
own warning wearing a different hat: the snapshot goes stale the moment a fader is dragged mid-listen,
and putting it back would silently discard a change the player had just made. **Hand it all back**
already exists for the case where the desk should be forgotten.

**Letting a single fader put the loops on the air.** See above — it is the broken version, and it is
planted as the probe.

**A separate *monitor* output for auditions.** 0130 refused a second `BufferSourceNode` for the
reasons that still hold: it would bypass `MUSIC_GAIN`, the bus shaper and the duck, and it would be a
second description of what a layer sounds like inside the one tool whose central claim is that it has
none.

## What was driven, since a browser is what the untested half needs

`npm run dash`, level one, from a cold unlock, paused at **0:26**:

| | read back |
|---|---|
| clicked `frenzy` with the transport stopped | `frenzy` **live 0.92** with **target 0.00** beside it, all twenty-two others at zero, and the header reading **stopped · the desk is sounding** |
| left it there six seconds | clock `0:26`, rung `run`, camera 941 units — every one of them unmoved. **The walk really is stopped** |
| clicked `frenzy` again | back to **stopped**, clock still `0:26` |
| pressed play from there | resumed at `0:27`, from where it had been left |
| **open everything** held (23 layers), then pause | silence — a pause still silences a held desk |
| one fader dragged up while stopped, nothing else held | silence, as the panel says: the rest of the piece would have come with it |
| **silence everything**, then that same fader | `drive` **live 0.90** with **target 0.00**, every other layer at zero, clock still stopped — the two-click route |

⚠️ **`target 0.00` BESIDE `live 0.92` WITH THE LEVEL STOPPED IS THE WHOLE FEATURE IN ONE ROW**, and
it is 0130's own row with the transport taken out from under it.

⚠️ **AND NINE LAYERS READ A NON-ZERO `live` THE INSTANT THE LISTEN ENDED**, which is correct and is
what the greying is for: `setOn` fades the master and stops the sources, and each layer's own gain is
upstream of both, so the mixer's restated targets sit there in silence. A page that did not grey them
would be 0126's opening complaint exactly.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). A dev-only page, a guarded module,
guards and a probe. No storage key, no save field, no cache prefix, and `dist/` is byte-identical:
`vite.config.ts` has one entry and it never sees `rig/`.
