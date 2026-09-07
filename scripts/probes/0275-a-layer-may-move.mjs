// The breaks behind docs/decisions/0275-a-layer-may-move.md.
//
// ⚠️ A POSITION WAS A CONSTANT AND THE TWO GUARDS OVER IT READ THE CONSTANT. A track is a second
// table saying the same kind of thing, and `LAYER_PAN`'s own history is what a second table costs:
// its ceiling was right when written and silently wrong from the moment `mix` multiplied it, guarded
// by nothing. These break the new guard the two ways the old ones can be broken.
/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0275',
    suite: 'tests/music.test.ts',
    /*
      ⚠️ ONE VALUE OF THE TRACK PAST THE LIMIT, which is the defect `PAN_LIMIT` exists to refuse: a
      layer at ±1 is a layer somebody with one earbud simply does not have. The constant is clamped
      nowhere — the guard IS the clamp — so a hand authoring a wider swing for one gesture is exactly
      how this arrives.
    */
    broke: 'the swing widened past the limit, so one earbud loses the note entirely',
    guard: '0275 — AND A LAYER THAT MOVES OBEYS EVERY RULE A LAYER THAT SITS STILL DOES',
    edit: {
      path: 'src/content/nebula.ts',
      find: '  bar % 4 === 3 ? [0.55, -0.55, 0.55, null] : [_, _, _, _],',
      replace: '  bar % 4 === 3 ? [0.95, -0.55, 0.55, null] : [_, _, _, _],',
    },
  },
  {
    decision: '0275',
    suite: 'tests/music.test.ts',
    /*
      ⚠️ THE TRACK NO LONGER FITS THE LOOP IT IS WRITTEN OVER. Three entries a bar against a four-beat
      bar walks the gesture one beat further round every pass — 0090's *layers that drift apart*
      arriving through a panner rather than through a buffer length, and inaudible as a cause: what a
      listener would report is that the bounce stopped landing on the notes.
    */
    broke: 'the track no longer divides the loop, so the swing walks around the bar',
    guard: '0275 — AND A LAYER THAT MOVES OBEYS EVERY RULE A LAYER THAT SITS STILL DOES',
    edit: {
      path: 'src/content/nebula.ts',
      find: '  bar % 4 === 3 ? [0.55, -0.55, 0.55, null] : [_, _, _, _],',
      replace: '  bar % 4 === 3 ? [0.55, -0.55, 0.55] : [_, _, _],',
    },
  },
];
