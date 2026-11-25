/**
 * Deterministic, brand-coloured botanical illustration used wherever a real
 * photograph isn't available yet. Pure SVG (no network), so it's instant and
 * looks intentional rather than "missing image".
 */

function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

function rng(seed: number) {
  let s = seed || 1;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const BACKDROPS = [
  ['#F4F1EA', '#E9E3D5'], // warm sand
  ['#EEF3EC', '#DDE8DA'], // sage mist
  ['#F6EFE6', '#ECDFCE'], // linen
  ['#F1F4F1', '#E1E8E2'], // stone
];
const LEAF_TONES = ['#3F863F', '#4D964D', '#2A5D2C', '#69A965', '#347235', '#7EB775'];

export function BotanicalArt({ seed = 'fyne', variant = 'plant' }: { seed?: string; variant?: 'plant' | 'hero' }) {
  const r = rng(hash(seed));
  const [bgA, bgB] = BACKDROPS[Math.floor(r() * BACKDROPS.length)];
  const gid = `g${hash(seed + variant).toString(36)}`;
  const isHero = variant === 'hero';

  // Fan of leaves rising from a pot
  const leafCount = isHero ? 26 : 14 + Math.floor(r() * 6);
  const leaves = Array.from({ length: leafCount }, (_, i) => {
    const t = i / (leafCount - 1);
    const angle = -70 + t * 140 + (r() - 0.5) * 18;
    const len = (isHero ? 170 : 120) + r() * (isHero ? 120 : 70) - Math.abs(angle) * 0.6;
    const width = 16 + r() * 14;
    const tone = LEAF_TONES[Math.floor(r() * LEAF_TONES.length)];
    return { angle, len, width, tone, opacity: 0.75 + r() * 0.25 };
  });

  return (
    <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden>
      <defs>
        <linearGradient id={`${gid}-bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={bgA} />
          <stop offset="100%" stopColor={bgB} />
        </linearGradient>
        <radialGradient id={`${gid}-glow`} cx="50%" cy="38%" r="55%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${gid}-pot`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#D9D3C7" />
          <stop offset="50%" stopColor="#F2EEE7" />
          <stop offset="100%" stopColor="#CFC8BB" />
        </linearGradient>
      </defs>
      <rect width="400" height="500" fill={`url(#${gid}-bg)`} />
      <rect width="400" height="500" fill={`url(#${gid}-glow)`} />
      {/* floor shadow */}
      <ellipse cx="200" cy="432" rx="96" ry="12" fill="#0F1A12" opacity="0.08" />
      <g transform="translate(200 352)">
        {leaves.map((l, i) => (
          <g key={i} transform={`rotate(${l.angle})`} opacity={l.opacity}>
            <path d={`M0 0 Q ${l.width * 0.15} ${-l.len * 0.45} 0 ${-l.len}`} stroke="#2B5E2E" strokeWidth="1.6" fill="none" opacity="0.55" />
            <path
              d={`M0 ${-l.len * 0.25} C ${l.width} ${-l.len * 0.45}, ${l.width * 0.8} ${-l.len * 0.85}, 0 ${-l.len} C ${-l.width * 0.8} ${-l.len * 0.85}, ${-l.width} ${-l.len * 0.45}, 0 ${-l.len * 0.25} Z`}
              fill={l.tone}
            />
            <path d={`M0 ${-l.len * 0.28} L 0 ${-l.len * 0.97}`} stroke="#FFFFFF" strokeOpacity="0.22" strokeWidth="1" />
          </g>
        ))}
      </g>
      {/* planter */}
      <path d="M140 350 H260 L246 432 Q200 440 154 432 Z" fill={`url(#${gid}-pot)`} />
      <rect x="134" y="342" width="132" height="14" rx="4" fill="#E7E1D6" />
    </svg>
  );
}
