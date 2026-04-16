import { useEffect, useState } from "react";
import { Cloud, CloudRain, CloudSnow, Sun, Wind, Droplets, Loader2, CloudLightning, CloudDrizzle } from "lucide-react";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";

// WMO weather code → label + icon
function wmoToWeather(code) {
  if (code === 0)              return { label: "Sonnig",       Icon: Sun };
  if (code <= 3)               return { label: "Teils bewölkt", Icon: Cloud };
  if (code <= 48)              return { label: "Nebel",         Icon: Cloud };
  if (code <= 57)              return { label: "Nieselregen",   Icon: CloudDrizzle };
  if (code <= 67)              return { label: "Regen",         Icon: CloudRain };
  if (code <= 77)              return { label: "Schnee",        Icon: CloudSnow };
  if (code <= 82)              return { label: "Regenschauer",  Icon: CloudRain };
  if (code <= 86)              return { label: "Schneeschauer", Icon: CloudSnow };
  if (code >= 95)              return { label: "Gewitter",      Icon: CloudLightning };
  return { label: "Bewölkt", Icon: Cloud };
}

export default function WeatherWidget({ location, latitude, longitude }) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  useEffect(() => {
    if (!latitude || !longitude) { setLoading(false); return; }
    setLoading(true);
    setError(false);

    fetch(
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${latitude}&longitude=${longitude}` +
      `&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m` +
      `&daily=temperature_2m_max,temperature_2m_min,weather_code` +
      `&forecast_days=3&timezone=auto`
    )
      .then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then((data) => setWeather(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [latitude, longitude]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-stone-200/50">
        <div className="flex items-center justify-center py-8 gap-2">
          <Loader2 className="w-5 h-5 text-stone-400 animate-spin" />
          <span className="text-stone-500 text-sm">Wetter wird geladen...</span>
        </div>
      </div>
    );
  }

  if (error || !weather?.current) return null;

  const cur = weather.current;
  const { label: curLabel, Icon: CurIcon } = wmoToWeather(cur.weather_code);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-200/50"
    >
      <h2 className="text-lg font-medium text-stone-800 mb-4 flex items-center gap-2">
        ☀️ Wetter{location ? ` in ${location}` : ""}
      </h2>

      {/* Aktuell */}
      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CurIcon className="w-12 h-12 text-blue-600" />
            <div>
              <div className="text-3xl font-light text-stone-800">
                {Math.round(cur.temperature_2m)}°C
              </div>
              <div className="text-sm text-stone-600">{curLabel}</div>
            </div>
          </div>
          <div className="text-right space-y-1">
            {cur.wind_speed_10m != null && (
              <div className="flex items-center gap-1 text-sm text-stone-600">
                <Wind className="w-4 h-4" />
                <span>{Math.round(cur.wind_speed_10m)} km/h</span>
              </div>
            )}
            {cur.relative_humidity_2m != null && (
              <div className="flex items-center gap-1 text-sm text-stone-600">
                <Droplets className="w-4 h-4" />
                <span>{Math.round(cur.relative_humidity_2m)}%</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3-Tage-Vorhersage */}
      {weather.daily?.time?.length >= 3 && (
        <div>
          <h3 className="text-sm font-medium text-stone-700 mb-3">3-Tage-Vorhersage</h3>
          <div className="grid grid-cols-3 gap-3">
            {weather.daily.time.slice(0, 3).map((dateStr, i) => {
              const { label, Icon: DayIcon } = wmoToWeather(weather.daily.weather_code[i]);
              const dayName = i === 0
                ? "Heute"
                : format(parseISO(dateStr), "EEE", { locale: de });
              return (
                <div key={dateStr} className="bg-white/70 backdrop-blur-sm rounded-lg p-3 text-center">
                  <div className="text-xs text-stone-600 mb-2 capitalize">{dayName}</div>
                  <DayIcon className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <div className="text-sm font-medium text-stone-800">
                    {Math.round(weather.daily.temperature_2m_max[i])}° / {Math.round(weather.daily.temperature_2m_min[i])}°
                  </div>
                  <div className="text-xs text-stone-500 mt-1 truncate">{label}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-[10px] text-stone-400 mt-3 text-right">
        Quelle: <a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer" className="underline">Open-Meteo</a>
      </p>
    </motion.div>
  );
}
