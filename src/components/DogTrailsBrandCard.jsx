function BrandPinLogo({ className = "" }) {
  return (
    <svg
      viewBox="130 82 252 320"
      aria-hidden="true"
      className={className}
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

export default function DogTrailsBrandCard({ className = "", compact = false }) {
  const heightClass = compact ? "h-[258px] sm:h-[278px]" : "h-[270px] sm:h-[360px]";
  const logoClass = compact ? "h-20 w-20 sm:h-24 sm:w-24" : "h-24 w-24 sm:h-32 sm:w-32";
  const titleClass = compact ? "text-[31px] sm:text-[36px]" : "text-[34px] sm:text-[44px]";

  return (
    <div
      className={`relative mx-auto ${heightClass} w-full max-w-sm overflow-hidden rounded-[34px] border border-[#F9C030]/45 bg-[#FFF8F0] shadow-[0_24px_58px_rgba(124,48,32,0.18)] ${className}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_12%,rgba(255,255,255,0.96)_0,rgba(255,248,240,0.82)_38%,rgba(253,240,232,0.56)_72%,rgba(249,192,48,0.18)_100%)]" />
      <div className="absolute inset-0 opacity-[0.16] [background-image:url('/brand-pattern.svg')]" />

      <div className="relative z-10 flex h-[62%] flex-col items-center justify-center px-8 text-center sm:h-[64%]">
        <BrandPinLogo className={`${logoClass} drop-shadow-[0_10px_18px_rgba(124,48,32,0.16)]`} />
        <div className={`mt-1 ${titleClass} font-extrabold leading-none text-[#7C3020]`}>
          DogTrails
        </div>
        <div className="mt-3 text-[10px] font-extrabold uppercase text-[#F07030] sm:text-xs">
          Entdecke. Wandere. Verbinde.
        </div>
      </div>

      <svg
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-[42%] w-full"
        viewBox="0 0 390 180"
        preserveAspectRatio="none"
      >
        <circle cx="302" cy="58" r="18" fill="#F9C030" />
        <path d="M0 76 C41 49 61 55 92 78 C128 106 154 56 198 82 C240 107 264 62 308 82 C344 99 365 95 390 76 L390 180 L0 180 Z" fill="#FFD8BD" />
        <path d="M0 103 C42 80 76 82 116 105 C154 128 178 76 219 103 C258 130 287 88 330 105 C356 116 372 114 390 101 L390 180 L0 180 Z" fill="#F6865E" />
        <path d="M0 125 C48 105 82 113 126 130 C166 147 191 101 236 124 C279 147 306 110 350 125 C369 132 381 132 390 124 L390 180 L0 180 Z" fill="#D4547A" />
        <path d="M0 145 C47 131 83 131 126 145 C166 161 202 126 246 145 C287 164 322 136 390 146 L390 180 L0 180 Z" fill="#A8003C" />
      </svg>
    </div>
  );
}
