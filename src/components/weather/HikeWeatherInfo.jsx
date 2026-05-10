import { useQuery } from "@tanstack/react-query";
import { Cloud, Droplets, Wind, Sun, CloudRain, CloudSnow, CloudDrizzle, CloudLightning, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

function wmoToWeather(code) {
  if (code === 0) return { label: "Sonnig", Icon: Sun };
  if (code <= 3) return { label: "Teils bewölkt", Icon: Cloud };
  if (code <= 48) return { label: "Nebel", Icon: Cloud };
  if (code <= 57) return { label: "Nieselregen", Icon: CloudDrizzle };
  if (code <= 67) return { label: "Regen", Icon: CloudRain };
  if (code <= 77) return { label: "Schnee", Icon: CloudSnow };
  if (code <= 82) return { label: "Regenschauer", Icon: CloudRain };
  if (code <= 86) return { label: "Schneeschauer", Icon: CloudSnow };
  if (code >= 95) return { label: "Gewitter", Icon: CloudLightning };
  return { label: "Bewölkt", Icon: Cloud };
}

export default function HikeWeatherInfo({ location, latitude, longitude }) {
  const { data, isLoading } = useQuery({
    queryKey: ["hikeWeather", latitude, longitude],
    queryFn: async () => {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast` +
        `?latitude=${latitude}&longitude=${longitude}` +
        `&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m` +
        `&forecast_days=1&timezone=auto`
      );
      if (!res.ok) throw new Error("Wetter nicht verfügbar");
      return res.json();
    },
    enabled: !!latitude && !!longitude,
    staleTime: 30 * 60 * 1000,
  });

  if (!latitude || !longitude) return null;

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-yellow-100/70 bg-white/70 p-4 shadow-sm backdrop-blur-sm">
        <div className="flex items-center justify-center gap-2 text-brand-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-xs">Wetterdaten werden geladen...</span>
        </div>
      </div>
    );
  }

  if (!data?.current) return null;

  const cur = data.current;
  const { label, Icon: WeatherIcon } = wmoToWeather(cur.weather_code);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-yellow-100/70 bg-white/70 p-4 shadow-[0_12px_28px_rgba(95,36,29,0.08)] backdrop-blur-sm"
    >
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 sm:text-base">
        <Cloud className="h-4 w-4" />
        Aktuelles Wetter{location ? ` in ${location}` : ""}
      </h3>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
        <div className="flex items-center gap-3 sm:min-w-[150px]">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
            <WeatherIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold leading-none text-slate-900">
              {Math.round(cur.temperature_2m)}°C
            </p>
            <p className="mt-1 text-xs text-slate-600">{label}</p>
          </div>
        </div>

        <div className="grid flex-1 grid-cols-2 gap-2">
          {cur.relative_humidity_2m != null && (
            <div className="flex items-center gap-2 rounded-xl bg-white/45 px-3 py-2">
              <Droplets className="h-4 w-4 text-brand-600" />
              <div>
                <p className="text-xs text-slate-500">Luftfeuchtigkeit</p>
                <p className="text-sm font-semibold text-slate-900">
                  {Math.round(cur.relative_humidity_2m)}%
                </p>
              </div>
            </div>
          )}
          {cur.wind_speed_10m != null && (
            <div className="flex items-center gap-2 rounded-xl bg-white/45 px-3 py-2">
              <Wind className="h-4 w-4 text-slate-600" />
              <div>
                <p className="text-xs text-slate-500">Wind</p>
                <p className="text-sm font-semibold text-slate-900">
                  {Math.round(cur.wind_speed_10m)} km/h
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 rounded-lg bg-white/50 px-3 py-2">
        <p className="text-xs text-slate-500">
          Wetterbedingungen können sich schnell ändern. Prüfe die Vorhersagen vor deiner Wanderung! ·{" "}
          <a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer" className="underline">Open-Meteo</a>
        </p>
      </div>
    </motion.div>
  );
}
