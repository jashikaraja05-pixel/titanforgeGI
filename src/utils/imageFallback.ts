// High-tech, offline-resilient SVG fallbacks for civic grievance images
// Prevents broken image icons and network 404 errors across citizen and government portals

export const FALLBACK_CIVIC_BEFORE_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%">
  <defs>
    <linearGradient id="bgBefore" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="50%" stop-color="#18181b" />
      <stop offset="100%" stop-color="#090a0f" />
    </linearGradient>
    <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(239, 68, 68, 0.08)" stroke-width="1" />
    </pattern>
  </defs>
  <rect width="800" height="500" fill="url(#bgBefore)" />
  <rect width="800" height="500" fill="url(#gridPattern)" />
  
  <!-- Subtle border accent -->
  <rect x="20" y="20" width="760" height="460" rx="16" fill="none" stroke="rgba(239, 68, 68, 0.3)" stroke-width="2" stroke-dasharray="8 4" />
  
  <!-- Center Icon Graphic -->
  <g transform="translate(400, 210)">
    <circle r="56" fill="rgba(239, 68, 68, 0.12)" stroke="rgba(239, 68, 68, 0.4)" stroke-width="2" />
    <!-- Camera with hazard marker -->
    <path d="M -26 -10 L -18 -22 L 18 -22 L 26 -10 L 32 -10 C 36 -10 38 -7 38 -3 L 38 24 C 38 28 36 31 32 31 L -32 31 C -36 31 -38 28 -38 24 L -38 -3 C -38 -7 -36 -10 -32 -10 Z" fill="none" stroke="#ef4444" stroke-width="3" stroke-linejoin="round" />
    <circle cx="0" cy="10" r="14" fill="none" stroke="#ef4444" stroke-width="3" />
    <circle cx="24" cy="-2" r="3" fill="#ef4444" />
  </g>
  
  <!-- Badge & Labels -->
  <g transform="translate(400, 310)">
    <rect x="-140" y="0" width="280" height="32" rx="16" fill="rgba(239, 68, 68, 0.2)" stroke="#ef4444" stroke-width="1" />
    <text x="0" y="21" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="700" fill="#fca5a5" text-anchor="middle" letter-spacing="1">
      CIVIC GRIEVANCE EVIDENCE
    </text>
  </g>
  
  <text x="400" y="370" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="600" fill="#ffffff" text-anchor="middle">
    Field Inspection Record Attached
  </text>
  <text x="400" y="396" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#94a3b8" text-anchor="middle">
    Verified Municipal Issue Coordinates &amp; AI Analysis Logged
  </text>
</svg>
`)}`;

export const FALLBACK_CIVIC_AFTER_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%">
  <defs>
    <linearGradient id="bgAfter" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#022c22" />
      <stop offset="50%" stop-color="#064e3b" />
      <stop offset="100%" stop-color="#022c22" />
    </linearGradient>
    <pattern id="gridPatternAfter" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(16, 185, 129, 0.1)" stroke-width="1" />
    </pattern>
  </defs>
  <rect width="800" height="500" fill="url(#bgAfter)" />
  <rect width="800" height="500" fill="url(#gridPatternAfter)" />
  
  <!-- Border accent -->
  <rect x="20" y="20" width="760" height="460" rx="16" fill="none" stroke="rgba(16, 185, 129, 0.35)" stroke-width="2" />
  
  <!-- Center Checkmark Graphic -->
  <g transform="translate(400, 210)">
    <circle r="56" fill="rgba(16, 185, 129, 0.2)" stroke="#10b981" stroke-width="3" />
    <path d="M -22 0 L -8 16 L 24 -16" fill="none" stroke="#34d399" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />
  </g>
  
  <!-- Badge & Labels -->
  <g transform="translate(400, 310)">
    <rect x="-150" y="0" width="300" height="32" rx="16" fill="rgba(16, 185, 129, 0.25)" stroke="#10b981" stroke-width="1" />
    <text x="0" y="21" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="700" fill="#a7f3d0" text-anchor="middle" letter-spacing="1">
      ✓ DEFECT CLEARED &amp; RESOLVED
    </text>
  </g>
  
  <text x="400" y="370" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="600" fill="#ffffff" text-anchor="middle">
    Government Resolution Work Verified
  </text>
  <text x="400" y="396" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#6ee7b7" text-anchor="middle">
    Site Restored • Official Work Completion Signed Off
  </text>
</svg>
`)}`;

export const FALLBACK_HERO_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 600" width="100%" height="100%">
  <defs>
    <linearGradient id="bgHero" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#05070a" />
      <stop offset="50%" stop-color="#111827" />
      <stop offset="100%" stop-color="#030712" />
    </linearGradient>
    <radialGradient id="glowRed" cx="50%" cy="40%" r="50%">
      <stop offset="0%" stop-color="rgba(239, 68, 68, 0.25)" />
      <stop offset="100%" stop-color="rgba(0, 0, 0, 0)" />
    </radialGradient>
  </defs>
  <rect width="1200" height="600" fill="url(#bgHero)" />
  <circle cx="600" cy="240" r="400" fill="url(#glowRed)" />
  <path d="M 0 500 Q 300 450 600 490 T 1200 470 L 1200 600 L 0 600 Z" fill="rgba(239, 68, 68, 0.05)" />
  <path d="M 0 540 Q 400 510 800 535 T 1200 520 L 1200 600 L 0 600 Z" fill="rgba(239, 68, 68, 0.08)" />
</svg>
`)}`;

/**
 * Handles img error gracefully without loop by setting dataset fallback and assigning guaranteed offline SVG.
 */
export function handleCivicImageError(
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  type: 'before' | 'after' | 'hero' = 'before'
): void {
  const target = event.currentTarget;
  if (target.dataset.hasFailed) return;
  target.dataset.hasFailed = 'true';

  if (type === 'after') {
    target.src = FALLBACK_CIVIC_AFTER_IMAGE;
  } else if (type === 'hero') {
    target.src = FALLBACK_HERO_IMAGE;
  } else {
    target.src = FALLBACK_CIVIC_BEFORE_IMAGE;
  }
}
