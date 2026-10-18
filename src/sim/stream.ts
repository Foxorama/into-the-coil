/**
 * Where a stream of water is — `docs/decisions/0616-the-water-flows.md`.
 *
 * Played: *"with the aqua duck's waterspray, it also needs more liquid physics on it to make it resemble water,
 * it's currently static and stiff and so doesn't feel like a water spray at all."* 0595 laid the jet as one
 * straight line from the nozzle at the angle the nozzle pointed THIS step, so the whole spray swung round its
 * root as a stick does. Water from a swinging hose does not: every drop leaves on the heading the nozzle had
 * when it left, and keeps it. So the stream is a line of parcels, the one `age` steps old fired `age` steps ago
 * at that step's angle and flown `age × speed` out from the nozzle since — and the spray curves as it sweeps,
 * its tip trailing the nozzle round, its front travels out when it opens, and what is already in the air flies
 * on when the nozzle stops.
 *
 * ⚠️ **FROM THE NOZZLE WHERE IT IS NOW, AND THAT IS NOT AN APPROXIMATION.** A parcel leaves with the ship's
 * velocity as well as its own, so the ship's flight since the parcel left is in both the nozzle and the parcel,
 * and cancels: what the ship did is in neither where the stream is drawn nor where it lands, only how the
 * nozzle swung. So the whole stream is a pure function of the root, the jet's clock and its row, which is what
 * lets the frame land it and the painter draw it from one description (0233), with nothing stored per parcel.
 *
 * Here and not in `content/` because the frame AND the painter call it every step, and it is arithmetic over
 * numbers, which is all `sim/` may hold (0015).
 */

/** Where the nozzle points at `clock` steps into its sweep, in radians off straight ahead: `sweep` either way and back once a `period`. */
export function streamAngle(clock: number, sweep: number, period: number): number {
  return sweep * Math.sin((Math.PI * 2 * clock) / period);
}

/**
 * The youngest and oldest ages of the stream at `clock` — 0616: water is fired for `steps` steps from clock 0,
 * and each parcel lives `flight` steps, the time it takes to reach the end of the stream's `length`. Before
 * the stream has reached its length its front is the first parcel fired; after the nozzle stops its back is
 * the last. The stream is there while `streamYoungest <= streamOldest`.
 */
export function streamYoungest(clock: number, steps: number): number {
  return clock > steps - 1 ? clock - (steps - 1) : 0;
}

export function streamOldest(clock: number, flight: number): number {
  return clock < flight ? clock : flight;
}

/** How far the parcel `age` steps old is from the nozzle along the lane, at `clock`. */
export function streamAlong(clock: number, age: number, sweep: number, period: number, speed: number): number {
  return Math.cos(streamAngle(clock - age, sweep, period)) * speed * age;
}

/** And across it. */
export function streamAcross(clock: number, age: number, sweep: number, period: number, speed: number): number {
  return Math.sin(streamAngle(clock - age, sweep, period)) * speed * age;
}

/**
 * The half-width of the stream at `age`, opening from `width` at the nozzle to `tipWidth` at `flight` — 0610's
 * cone. 0622: opening as `flare` says — one is 0610's straight cone, and more holds the stream narrow along its
 * run and throws it open at its end, as spray off a hose bells out where it breaks up.
 */
export function streamWidth(age: number, flight: number, width: number, tipWidth: number, flare: number): number {
  return width + (tipWidth - width) * (age / flight) ** flare;
}
