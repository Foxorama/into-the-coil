# 0620 — The weasel keeps its overalls

**Accepted 2026-10-18.** From the play-test of 2026-10-18 —
[`the-play-test-of-2026-10-18`](../../reports/the-play-test-of-2026-10-18.md), item 7. Amends
[0612](0612-the-riders-get-off.md)'s drawing of Unity in the ball.

## The ask

> *"why does the weasel take off its pants when it gets into the hamster ball"*

## What was true

Standing, Unity wears navy overalls — the bib, the seat and both legs — at the bench, about the dock and on the bust
(`unityInks` in `src/render/keeper-art.ts`, `navy`), and the intro's runner wears them too. In the ball
(`paintUnityAbove` in `src/render/bake.ts`) 0612 had redrawn them as a least weasel from above and kept only a short
hi-vis vest: the haunches, the hind legs and the belly were bare fur. Nothing said why; the drawing was answering
*"looks like a platypus"*, and the trousers went with the platypus.

## The rule

**Unity in the ball wears the overalls they wear standing, seen from above**, in the same navy: the seat over the
haunches, wrapped round the flanks as trousers are and lit along the top where the cloth stretches; a waistband
across the small of the back; the two straps up the back to the shoulders, under the vest; and the hind legs in navy
to the paws. The tail comes out through the seat. The forelegs and the head stay fur, as they are standing. It is
every pose of the war dance, because every mark is laid through the pose's own turn.

## The screen, considered

[0295](0295-a-ranking-guard-is-a-content-limiter.md): inside the ball's own outline, nothing else shares it. The navy
is a dark blue-grey through the ball's tinted plastic and reads as a garment against the brown head and the hi-vis.

## What guards it

`tests/riders.test.ts`, *0620*: traced at the fight's size, in CSS pixels of a 1280×720 screen, solid paint in the
overalls' navy covers more than 12 px² behind the middle of the drawing and under a quarter of that in front of it,
where the vest and the head are. Probes in `scripts/probes/0620-the-weasel-keeps-its-overalls.mjs`: the seat gone,
and the navy not the standing figure's; both seen red.

**Not held:** the straps and the legs, which are strokes the guard does not weigh; seen on the sprite sheet at eight
times.

## Owed

A look in the fight, at speed and in a dance.
