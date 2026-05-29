export default function DogTrailsLogoMark({ className = "", ariaHidden = true }) {
  return (
    <svg
      viewBox="132 96 248 292"
      aria-hidden={ariaHidden ? "true" : undefined}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g transform="translate(98 82) scale(0.62)">
        <path fill="#A8003C" d="M256 34C157.7 34 78 113.7 78 212c0 129.5 157.5 248.4 178 264.1C276.5 460.4 434 341.5 434 212 434 113.7 354.3 34 256 34Z" />
        <circle cx="256" cy="204" r="124" fill="#FFF8F0" />
        <ellipse cx="190" cy="186" rx="22" ry="34" fill="#A8003C" transform="rotate(-15 190 186)" />
        <ellipse cx="234" cy="150" rx="21" ry="33" fill="#A8003C" transform="rotate(-5 234 150)" />
        <ellipse cx="278" cy="150" rx="21" ry="33" fill="#A8003C" transform="rotate(5 278 150)" />
        <ellipse cx="322" cy="186" rx="22" ry="34" fill="#A8003C" transform="rotate(15 322 186)" />
        <path fill="#A8003C" d="M256 205c-39 0-71 28.8-71 64.3 0 23.9 14.1 37.9 33.3 32.1 12.1-3.7 23.2-8 37.7-8s25.6 4.3 37.7 8c19.2 5.8 33.3-8.2 33.3-32.1 0-35.5-32-64.3-71-64.3Z" />
        <path fill="none" stroke="#FFF8F0" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round" d="M279 224c-45 18-58 42-15 64 42 22 33 54-22 83" />
        <path fill="none" stroke="#FFF8F0" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" d="M252 392c27-14 48-31 61-55" />
      </g>
    </svg>
  );
}
