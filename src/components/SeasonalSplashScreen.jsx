import { useEffect, useState } from "react";

const SPLASH_IMAGE_BY_SEASON = {
  spring: "/splash/spring-hero.jpg",
  summer: "/splash/summer-hero.jpg",
  autumn: "/splash/autumn-hero.jpg",
  winter: "/splash/winter-hero.jpg",
};

const FALLBACK_SPLASH_IMAGE = "/splash/autumn-hero.jpg";

function getCurrentSeason(date = new Date()) {
  const month = date.getMonth();

  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "autumn";
  return "winter";
}

export default function SeasonalSplashScreen() {
  const season = getCurrentSeason();
  const [imageSrc, setImageSrc] = useState(SPLASH_IMAGE_BY_SEASON[season] ?? FALLBACK_SPLASH_IMAGE);

  useEffect(() => {
    setImageSrc(SPLASH_IMAGE_BY_SEASON[season] ?? FALLBACK_SPLASH_IMAGE);
  }, [season]);

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden bg-slate-950">
      <img
        src={imageSrc}
        alt="DogHike Suedtirol Startbild"
        className="h-full w-full object-cover object-center"
        onError={() => setImageSrc(FALLBACK_SPLASH_IMAGE)}
      />

      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-slate-900/10" />

      <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 md:p-10">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-xl rounded-3xl border border-white/20 bg-white/10 p-5 text-white shadow-2xl backdrop-blur-md sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/75">
              DogHike Suedtirol
            </p>
            <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
              Wandern mit Hund in den Dolomiten
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-white/80 sm:text-base">
              Die App wird gerade geladen.
            </p>

            <div className="mt-5 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              <span className="text-sm font-medium text-white/90">
                Inhalte werden vorbereitet
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
