# 0424 — A bake is kept for its source

**Accepted 2026-09-30.** What the user chose after [0423](0423-the-pool-is-taken-out-and-a-page-boot-is-sized-under-the-suite.md)
took [0422](0422-a-place-is-baked-on-every-core.md)'s pool back out, asking instead to *"redo that whole
section in a different better way"*. The pool made each bake faster by competing with the suite; the
waste was never that a bake was serial, it was that **the same bake was done again and again**.

## The rule

**A test that needs a layer of the music asks `tests/bake-store.ts`'s `layerAt`, and each (layer, place,
rate) is baked once for a source tree** — kept in `node_modules/.cache/itc-bakes/<key>/`, read by every
file, every process and every later run that stands in the same tree. `loopsAt`, `tests/clean.ts` and
`tests/arc.ts` all read through it. What a bake returns is unchanged: `layerAt` hands back exactly the
bytes `bakeLayer` does, and `tests/bake-store.test.ts` holds that.

## Where the repetition was

Every suite runs in its own process with its own in-memory cache. So `tests/themes.test.ts` baked the
seven places at 44.1 kHz for the clip guard and again at 22.05 kHz for the loudness guard;
`tests/authored.test.ts` baked the seven at 44.1 kHz again; `tests/arc.ts` again for whatever asked it.
And every run did it all again whether `src/` had changed or not — every `npm test`, every proof.

## Why it cannot hand back the wrong music

⚠️ **THE KEY IS EVERY BYTE OF `src/`, AND THE NODE THAT RAN IT.** A bake is a function of the synth, the
content tables and the maths library. A key over all of `src/` is a superset of what a bake reads, so
the only error it can make is a miss; a key over less would be a guard measuring last week's music,
green — [0027](0027-measure-the-picture-not-the-model.md). The Node version is in it because `Math.pow`
and `Math.sin` are the maths library. **Only the key a run stands in is ever read.**

⚠️ **A WRITE IS A RENAME, AND A FILE OF THE WRONG LENGTH IS A MISS.** A reader sees a whole layer or
none of it; a truncated file is re-baked, never read as silence.

⚠️ **ONE PROCESS BAKES A LAYER AND THE REST WAIT FOR IT.** Suites start together and miss together;
the first takes a lock file and bakes, the others poll for the file. **No threads** — 0423 is why.

⚠️ **A PROOF ONLY READS.** Most music probes break `src/`, and a broken `src/` is a new key — writing
would keep a whole set of bakes per probe, sixteen hundred of them at up to 720 MB. So `npm run prove`
sets `ITC_BAKE_STORE=read`: a probe of an untouched `src/` reads the tree's bakes, and one that breaks
it bakes in its own process exactly as before.

## What it cost, measured

The whole suite on the development box, the store emptied first, then run again:

| | empty store | kept |
|---|---|---|
| the clip guard | 303.6 s | **27.6 s** |
| `tests/authored.test.ts`'s one long test | 126.2 s | **9.2 s** |
| `tests/themes.test.ts` | 378 s | **195 s** |
| `tests/authored.test.ts` | 128 s | **12 s** |
| the whole suite | 415 s | 386 s |

**A tree's bakes are 720 MB** — 545 layers. Two trees are kept, 1.4 GB in `node_modules/.cache`.

⚠️ **WHAT IT DOES NOT DO, SAID PLAINLY: IT DOES NOT SHORTEN CI's LONGEST FILE.** A CI job starts with an
empty `node_modules`, so every shard's store starts empty, and `tests/themes.test.ts` already baked each
layer once inside its own file. CI gains only where two music suites share a shard. The value here is
the development box and the proof — every `npm test`, `npm run check` and `npm run prove` on an
unchanged `src/`, each of which baked the same music again.
[0280](0280-a-cheap-mechanism-does-not-rename-the-ask.md): a mechanism for CI time that works on the
desk is a different mechanism, and this is named for what it does. CI's poles after 0423 —
`tests/themes.test.ts` 287 s, `tests/sound.test.ts` 239 s, `tests/hud.browser.test.ts` 190 s — are the
next work, and are not claimed here.

## What was rejected

**Baking in `globalSetup` on every core before the workers start.** The one moment parallelism is
free — and every suite shard pays it, whether or not it holds a music suite, and a proof's warm
instances have no `globalSetup` at all.

**A key over the files the bake imports rather than all of `src/`.** Exact, and it needs the module
graph, which is a second description of what a bake reads and the kind that rots. A superset only
costs misses.

**Caching the store across CI runs.** A PR that touches `src/` — most of them — is a new key and a miss,
and a hit costs a download of 720 MB per job.

## Confirmed, not assumed

Probes in `scripts/probes/0424-a-bake-is-kept-for-its-source.mjs`.

| broken on purpose | went red |
|---|---|
| the key blind to the Node that baked it, so another maths library reads this one’s samples | `THE KEY IS EVERY BYTE` |
| the key taken over the names of src/ alone, so an edited file keeps the bake of the file it was | `THE KEY IS EVERY BYTE` |
| a file of any length read as a layer, so a truncated one is silence where the music was | `A PART OF A LAYER IS NOT A LAYER` |
| the proof telling its vitests to write, so every probe that breaks src/ keeps a whole set of bakes | `A PROOF ONLY READS` |
| a read-only store keeping its bakes anyway, which under a proof is a set of them per probe | `A PROOF ONLY READS` |
| a layer kept under the base’s name whatever place it belongs to | `THE ONE IT IS FOR: a layer from the store is the layer baked here` |

⚠️ **Not probed: the lock**, a second process waiting for the first's file rather than baking its own.
A lost lock costs a duplicate bake and never a wrong sample — both writes are whole and identical — so
it is a cost and not a verdict, and 0115 says a probe cannot see a cost.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). `tests/`, `scripts/` and documents. The
store is in `node_modules/.cache` and a fresh `npm ci` starts it empty.
