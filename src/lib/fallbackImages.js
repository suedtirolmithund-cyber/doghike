export const APP_ICON = "/dogtrails-app-icon.png";

function svgToDataUrl(svg) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export const HIKE_PLACEHOLDER_IMAGE = svgToDataUrl(`
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="760" viewBox="0 0 1200 760">
    <defs>
      <linearGradient id="sky" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stop-color="#FFF8F0"/>
        <stop offset="0.42" stop-color="#FDF0E8"/>
        <stop offset="1" stop-color="#F9C030"/>
      </linearGradient>
      <linearGradient id="ridgeA" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stop-color="#F07030"/>
        <stop offset="1" stop-color="#A8003C"/>
      </linearGradient>
      <linearGradient id="ridgeB" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stop-color="#D4547A"/>
        <stop offset="1" stop-color="#7C3020"/>
      </linearGradient>
      <filter id="soft" x="-10%" y="-10%" width="120%" height="120%">
        <feGaussianBlur stdDeviation="2"/>
      </filter>
    </defs>
    <rect width="1200" height="760" fill="url(#sky)"/>
    <circle cx="928" cy="170" r="62" fill="#F9C030" opacity="0.92"/>
    <path d="M0 430c130-76 237-92 370-45 116 41 208 14 326-44 160-79 290-70 504 38v381H0z" fill="#FFF8F0" opacity="0.66" filter="url(#soft)"/>
    <path d="M0 535 150 382l92 93 86-126 132 151 93-82 119 130 72-58 101 94 88-170 267 218v128H0z" fill="url(#ridgeA)" opacity="0.92"/>
    <path d="M0 612c102-68 197-89 303-62 124 31 216 74 337 45 144-34 271-109 560-37v202H0z" fill="url(#ridgeB)" opacity="0.88"/>
    <path d="M0 676c167-29 283-20 405 2 157 29 292 38 450 8 119-23 226-24 345-3v77H0z" fill="#A8003C" opacity="0.9"/>
    <path d="M545 630c44-62 81-99 123-129 16-12 36 4 28 22-21 46-54 96-98 151" fill="none" stroke="#FFF8F0" stroke-width="18" stroke-linecap="round" opacity="0.74"/>
    <g transform="translate(848 520)" fill="#FFF8F0" opacity="0.86">
      <ellipse cx="72" cy="46" rx="54" ry="33"/>
      <circle cx="27" cy="24" r="22"/>
      <path d="M103 33c33 4 53 19 61 44-24 5-50-4-68-25z"/>
      <path d="M38 72h20v52H38zM93 72h20v52H93z"/>
      <path d="M4 19c-27-20-47-8-42 19 24 2 41-3 42-19z"/>
    </g>
  </svg>
`);

export function getAvatarDataUrl(seed = "DogTrails") {
  const text = String(seed || "DT")
    .trim()
    .slice(0, 2)
    .toUpperCase() || "DT";

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
      <rect width="128" height="128" rx="32" fill="#fdf0e8"/>
      <circle cx="64" cy="58" r="34" fill="#a8003c" opacity="0.14"/>
      <text x="64" y="76" text-anchor="middle" font-family="Nunito, sans-serif" font-size="34" font-weight="700" fill="#7c3020">${text}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
