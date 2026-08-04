/**
 * A pre-allocated, packed entity pool — where every per-frame object in the game lives.
 *
 * See `docs/decisions/0022-frame-rate-is-a-feature.md`: nothing allocates in the frame loop. GC
 * pauses are the main source of jank in a browser game, and a shooter allocates hardest exactly when
 * it can least afford to — five hundred bullets arriving at once is also the moment a collection
 * costs the most.
 *
 * ⚠️ **A pool is MUTABLE and is not reducer state.** `docs/decisions/0017-the-state-is-slices.md`
 * says state is immutable plain data, and it still does — of screens, run and settings. These arrays
 * are neither, and 0022 qualifies 0017 in exactly this one place. Two different things wearing the
 * same word.
 *
 * ── PACKED, WHICH IS THE PART THAT MATTERS FOR THE FRAME ────────────────────────────────────────
 *
 * Live items occupy `[0, size)` with no holes, so iterating them is a plain indexed `for` — no
 * liveness flag to branch on, no sparse array, and nothing to filter. Releasing an item swaps the
 * last live one into its place, which is O(1) and allocates nothing.
 *
 * **The cost, named:** release REORDERS. Draw order and iteration order are therefore not stable
 * across a release, so nothing may depend on them — not draw layering (that is the sprite's job),
 * not tie-breaking in collision. It stays deterministic for a given sequence of operations, which is
 * what a seeded replay needs.
 */

export class Pool<T> {
  private readonly slots: T[];
  private live = 0;

  /**
   * Build every slot up front. `make` is called exactly `capacity` times, here and never again.
   *
   * @param capacity the hard ceiling. A pool does not grow — see `spawn`.
   */
  constructor(capacity: number, make: (index: number) => T) {
    if (!Number.isInteger(capacity) || capacity < 1) {
      // @setup: validated once when the pool is constructed, and unreachable during a frame.
      throw new Error(`Pool: capacity must be a positive integer, got ${String(capacity)}`);
    }
    // @setup: every slot in the pool is built once, at construction, and reused forever after.
    this.slots = new Array<T>(capacity);
    for (let i = 0; i < capacity; i++) this.slots[i] = make(i);
  }

  /** How many slots exist. Fixed for the pool's lifetime. */
  get capacity(): number {
    return this.slots.length;
  }

  /** How many are live right now. Live items are `at(0)` through `at(size - 1)`. */
  get size(): number {
    return this.live;
  }

  /**
   * Take the next free slot, or `null` when the pool is full.
   *
   * ⚠️ **Full returns `null`; it does not grow and it does not throw.** Growing would allocate at the
   * densest moment of the game, which is the one thing this class exists to prevent, and throwing
   * would end a run over a bullet. The caller drops the spawn — a wave one bullet short is
   * invisible, and the capacity is the budget in 0022 rather than a guess.
   *
   * The returned object is the PREVIOUS occupant of that slot, with its old field values still on
   * it. Callers initialise every field they read.
   */
  spawn(): T | null {
    if (this.live >= this.slots.length) return null;
    return this.slots[this.live++]!;
  }

  /** The live item at `index`. Only `[0, size)` is meaningful. */
  at(index: number): T {
    return this.slots[index]!;
  }

  /**
   * Retire the live item at `index`, swapping the last live item into its place.
   *
   * ⚠️ Iterating forwards while releasing therefore SKIPS an item unless the loop counter is held
   * back. Iterate backwards, or do not advance `i` after a release.
   */
  releaseAt(index: number): void {
    if (index < 0 || index >= this.live) return;
    const last = this.live - 1;
    if (index !== last) {
      const held = this.slots[index]!;
      this.slots[index] = this.slots[last]!;
      this.slots[last] = held;
    }
    this.live = last;
  }

  /** Retire everything. Keeps every object; only the live count moves. */
  clear(): void {
    this.live = 0;
  }
}
