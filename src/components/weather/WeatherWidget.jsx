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
      <div className="bg-white rounded-2xl p-6 border border-brand-100/50">
        <div className="flex items-center justify-center py-8 gap-2">
          <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
          <span className="text-slate-500 text-sm">Wetter wird geladen...</span>
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
      className="rounded-2xl border border-brand-100/70 bg-white/70 p-4 shadow-[0_12px_28px_rgba(192,48,96,0.08)] backdrop-blur-sm md:p-5"
    >
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 md:text-base">
        <Cloud className="h-4 w-4" />
        Wetter{location ? ` in ${location}` : ""}
      </h2>

      {/* Aktuell */}
      <div className="mb-3 rounded-xl border border-brand-100/60 bg-white/58 p-3 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
              <CurIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold leading-none text-slate-900">
                {Math.round(cur.temperature_2m)}°C
              </div>
              <div className="text-sm text-slate-600">{curLabel}</div>
            </div>
          </div>
          <div className="shrink-0 space-y-1 text-right">
            {cur.wind_speed_10m != null && (
              <div className="flex items-center justify-end gap-1 text-xs text-slate-600">
                <Wind className="h-3.5 w-3.5 text-brand-600" />
                <span>{Math.round(cur.wind_speed_10m)} km/h</span>
              </div>
            )}
            {cur.relative_humidity_2m != null && (
              <div className="flex items-center justify-end gap-1 text-xs text-slate-600">
                <Droplets className="h-3.5 w-3.5 text-brand-600" />
                <span>{Math.round(cur.relative_humidity_2m)}%</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3-Tage-Vorhersage */}
      {weather.daily?.time?.length >= 3 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold text-slate-700">3-Tage-Vorhersage</h3>
          <div className="grid grid-cols-3 gap-2">
            {weather.daily.time.slice(0, 3).map((dateStr, i) => {
              const { label, Icon: DayIcon } = wmoToWeather(weather.daily.weather_code[i]);
              const dayName = i === 0
                ? "Heute"
                : format(parseISO(dateStr), "EEE", { locale: de });
              return (
                <div key={dateStr} className="rounded-xl border border-brand-100/60 bg-white/55 p-2 text-center backdrop-blur-sm">
                  <div className="text-xs text-slate-600 mb-2 capitalize">{dayName}</div>
                  <DayIcon className="mx-auto mb-2 h-5 w-5 text-brand-600" />
                  <div className="text-sm font-medium text-slate-900">
                    {Math.round(weather.daily.temperature_2m_max[i])}° / {Math.round(weather.daily.temperature_2m_min[i])}°
                  </div>
                  <div className="text-xs text-slate-500 mt-1 truncate">{label}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="mt-3 text-right text-[10px] text-slate-400">
        Quelle: <a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer" className="underline">Open-Meteo</a>
      </p>
    </motion.div>
  );
}
