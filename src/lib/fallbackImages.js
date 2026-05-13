export const APP_ICON = "/icon.svg";

export function getAvatarDataUrl(seed = "DogTrails") {
  const text = String(seed || "DT")
    .trim()
    .slice(0, 2)
    .toUpperCase() || "DT";

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
      <rect width="128" height="128" rx="32" fill="#fdf0e8"/>
      <circle cx="64" cy="58" r="34" fill="#a8003c" opacity="0.14"/>
      <text x="64" y="76" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#7c3020">${text}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
