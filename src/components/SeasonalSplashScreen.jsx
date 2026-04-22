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
    </div>
  );
}
