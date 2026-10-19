import { memo } from 'react';
import { motion, useReducedMotion } from 'motion/react';
export const BlueprintGlyph = memo(function BlueprintGlyph({
  solid = false,
  assembly = false,
}: {
  solid?: boolean;
  assembly?: boolean;
}) {
  const reduce = useReducedMotion();
  return (
    <svg
      viewBox="0 0 240 144"
      aria-hidden="true"
      className={`blueprint-glyph ${solid ? 'realized' : ''}`}
    >
      <g className="draft-guides">
        <path d="M8 38h224M8 112h224M56 8v128M184 8v128" />
        <path d="M24 32v86m-4-86h8m-8 86h8M56 130h128m-128-4v8m128-8v8" />
        <circle cx="56" cy="38" r="3" />
        <circle cx="184" cy="112" r="3" />
      </g>
      <motion.path
        d={assembly ? 'M56 38h76v74H56zM92 22h76v74H92zM128 6h76v74h-76z' : 'M56 38h128v74H56z'}
        initial={{ pathLength: reduce ? 1 : 0, fillOpacity: 0 }}
        animate={{ pathLength: 1, fillOpacity: solid ? 1 : 0 }}
        transition={{ duration: reduce ? 0 : 0.75 }}
        className="object-path"
      />
      <path
        className="inner-path"
        d={
          assembly
            ? 'M144 28h42m-42 14h27M108 48h24M72 64h20m-20 12h32'
            : 'M76 60h88M76 74h42M76 88h62'
        }
      />
      <path className="corner-mark" d="M44 38H32m24-12V14m140 98h12m-24 12v12" />
    </svg>
  );
});
