# 0536 — The splash counts frames

**Accepted 2026-10-05.** A guard repair under [0044](0044-an-intermittent-guard-is-measuring-the-wrong-thing.md),
on [0415](0415-the-golfer-is-chosen.md)'s splash guard as [0513](0513-the-pilot-flies.md) carried it.

## What happened

On [PR #548](https://github.com/Foxorama/into-the-coil/pull/548)'s first CI run, the 0415 probe *"the
press asked for on the next step, before anything behind it has loaded"* reported **went red, but on the
wrong test**. In the filtered run, the guard it names (*"puts up Press to begin only after it"*) passed
over the break. The same probe was red on the PR before it, red on the run after it, and red twice
locally on the same tree. Under 0044 a rerun is not evidence, so the question was what the guard was
measuring.

## What it was measuring

**Wall clock, from the splash appearing to the prompt appearing.** The splash element is shown before
the loop takes its first step, and the page's boot runs in between. On a loaded runner that boot alone
came to about 1.4 s. So a prompt put up on the very first step — the break — read as the name's whole
1.5 s on screen, and the guard passed. Seconds were read where steps were meant, which is 0044's class
exactly.

## The repair

**The guard also counts the page's frames** between the two being shown. The loop takes at most
`MAX_STEPS` steps per frame ([0022](0022-frame-rate-is-a-feature.md)'s catch-up ceiling), so the
`SPLASH_STEPS` the name is owed cannot pass in fewer than `SPLASH_STEPS / MAX_STEPS` frames, however
slow the machine. The break puts the prompt up within a frame or two.

The seconds assertion stays beside it. It is the claim in the player's units
([0027](0027-measure-the-picture-not-the-model.md)), and it was never wrong in the direction that
fails a correct build. It could only miss the break, and now the frame count catches that.

Proven: `npm run prove 0415` went red on the frame assertion, on the named test.
