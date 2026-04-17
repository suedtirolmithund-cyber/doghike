import { useQuery } from "@tanstack/react-query";
import { Cloud, Droplets, Wind, Sun, CloudRain, CloudSnow, CloudDrizzle, CloudLightning, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

function wmoToWeather(code) {
  if (code === 0)   return { label: "Sonnig",       Icon: Sun };
  if (code <= 3)    return { label: "Teils bewölkt", Icon: Cloud };
  if (code <= 48)   return { label: "Nebel",         Icon: Cloud };
  if (code <= 57)   return { label: "Nieselregen",   Icon: CloudDrizzle };
  if (code <= 67)   return { label: "Regen",         Icon: CloudRain };
  if (code <= 77)   return { label: "Schnee",        Icon: CloudSnow };
  if (code <= 82)   return { label: "Regenschauer",  Icon: CloudRain };
  if (code <= 86)   return { label: "Schneeschauer", Icon: CloudSnow };
  if (code >= 95)   return { label: "Gewitter",      Icon: CloudLightning };
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
      <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-2xl p-6 border border-blue-200">
        <div className="flex items-center justify-center gap-2 text-blue-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Wetterdaten werden geladen...</span>
        </div>
      </div>
    );
  }

  if (!data?.current) return null;

  const cur = data.current;
  const { label, Icon: WeatherIcon } = wmoToWeather(cur.weather_code);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-2xl p-6 border border-blue-200">

      <h3 className="text-lg font-semibold text-stone-800 mb-4 flex items-center gap-2">
        <Cloud className="w-5 h-5" />
        Aktuelles Wetter{location ? ` in ${location}` : ""}
      </h3>

      <div className="flex items-start gap-6">
        <div className="flex flex-col items-center">
          <WeatherIcon className="w-12 h-12 text-blue-600" />
          <p className="text-3xl font-bold text-stone-800 mt-2">{Math.round(cur.temperature_2m)}°C</p>
          <p className="text-sm text-stone-600 mt-1">{label}</p>
        </div>

        <div className="flex-1 grid grid-cols-2 gap-4">
          {cur.relative_humidity_2m != null && (
            <div className="flex items-center gap-2">
              <Droplets className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-xs text-stone-500">Luftfeuchtigkeit</p>
                <p className="font-semibold text-stone-800">{Math.round(cur.relative_humidity_2m)}%</p>
              </div>
            </div>
          )}
          {cur.wind_speed_10m != null && (
            <div className="flex items-center gap-2">
              <Wind className="w-5 h-5 text-slate-600" />
              <div>
                <p className="text-xs text-stone-500">Wind</p>
                <p className="font-semibold text-stone-800">{Math.round(cur.wind_speed_10m)} km/h</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 p-3 bg-white/50 rounded-lg">
        <p className="text-xs text-stone-500">
          ⚠️ Wetterbedingungen können sich schnell ändern. Prüfe die Vorhersagen vor deiner Wanderung! ·{" "}
          <a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer" className="underline">Open-Meteo</a>
        </p>
      </div>
    </motion.div>
  );
}
