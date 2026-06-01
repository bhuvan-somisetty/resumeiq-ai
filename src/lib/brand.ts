/**
 * Single source of truth for the ResumeIQ AI brand mark.
 *
 * Concept: a clean résumé document (text lines) paired with an AI "sparkle"
 * badge, on the app's indigo→violet gradient tile. Used by the in-app logo,
 * the favicon (icon.svg), the Apple touch icon, and the OpenGraph image so the
 * brand stays consistent everywhere.
 */

export const BRAND = {
  name: "ResumeIQ",
  suffix: "AI",
  tagline: "AI resume analysis — instant ATS score & fixes",
  primary: "#4F46E5", // indigo (theme --primary)
  accent: "#7C3AED", // violet (theme --accent)
  ogBackground: "#0A0E1A", // dark theme --background
} as const;

/** Returns the standalone SVG markup for the brand mark. */
export function logoSvg(opts?: { size?: number; idSuffix?: string }): string {
  const dim = opts?.size
    ? `width="${opts.size}" height="${opts.size}"`
    : `width="100%" height="100%"`;
  const gid = `riq-grad-${opts?.idSuffix ?? "1"}`;
  return `<svg ${dim} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="ResumeIQ AI">
  <defs>
    <linearGradient id="${gid}" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
      <stop stop-color="${BRAND.primary}"/>
      <stop offset="1" stop-color="${BRAND.accent}"/>
    </linearGradient>
  </defs>
  <rect width="40" height="40" rx="10" fill="url(#${gid})"/>
  <rect x="11.5" y="8" width="15" height="24" rx="3" fill="#ffffff"/>
  <rect x="14.5" y="19" width="9" height="2" rx="1" fill="${BRAND.primary}"/>
  <rect x="14.5" y="23" width="9" height="2" rx="1" fill="${BRAND.accent}"/>
  <rect x="14.5" y="27" width="5.5" height="2" rx="1" fill="${BRAND.primary}" fill-opacity="0.75"/>
  <circle cx="28" cy="12" r="5.75" fill="url(#${gid})" stroke="#ffffff" stroke-width="1.6"/>
  <path d="M28 8.4c.34 1.84.82 2.32 2.66 2.66-1.84.34-2.32.82-2.66 2.66-.34-1.84-.82-2.32-2.66-2.66 1.84-.34 2.32-.82 2.66-2.66Z" fill="#ffffff"/>
</svg>`;
}

/** Base64 data URI of the mark, for <img> use inside next/og ImageResponse. */
export function logoDataUri(size?: number): string {
  const svg = logoSvg(size ? { size } : undefined);
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}
