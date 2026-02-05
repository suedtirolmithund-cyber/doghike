import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Cloud, CloudRain, CloudSnow, Sun, Wind, Droplets, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const weatherIcons = {
  sunny: Sun,
  cloudy: Cloud,
  rainy: CloudRain,
  snowy: CloudSnow,
};

export default function WeatherWidget({ location, latitude, longitude }) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchWeather = async () => {
      if (!latitude || !longitude) return;
      
      setLoading(true);
      setError(false);
      
      try {
        const response = await base44.integrations.Core.InvokeLLM({
          prompt: `Get current weather and 3-day forecast for coordinates ${latitude}, ${longitude}. Return weather data with temperature, conditions, wind speed, and humidity.`,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              current: {
                type: "object",
                properties: {
                  temp: { type: "number" },
                  condition: { type: "string" },
                  wind_speed: { type: "number" },
                  humidity: { type: "number" }
                }
              },
              forecast: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    day: { type: "string" },
                    temp_high: { type: "number" },
                    temp_low: { type: "number" },
                    condition: { type: "string" }
                  }
                }
              }
            }
          }
        });
        
        setWeather(response);
      } catch (err) {
        console.error("Weather fetch error:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [latitude, longitude]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-stone-200/50">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-stone-400 animate-spin" />
          <span className="ml-2 text-stone-500">Wetter wird geladen...</span>
        </div>
      </div>
    );
  }

  if (error || !weather) {
    return null;
  }

  const getWeatherIcon = (condition) => {
    const conditionLower = condition?.toLowerCase() || "";
    if (conditionLower.includes("rain") || conditionLower.includes("regen")) return CloudRain;
    if (conditionLower.includes("snow") || conditionLower.includes("schnee")) return CloudSnow;
    if (conditionLower.includes("cloud") || conditionLower.includes("wolke")) return Cloud;
    return Sun;
  };

  const CurrentIcon = getWeatherIcon(weather.current?.condition);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-200/50"
    >
      <h2 className="text-lg font-medium text-stone-800 mb-4 flex items-center gap-2">
        ☀️ Wetter {location && `in ${location}`}
      </h2>

      {/* Current Weather */}
      {weather.current && (
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CurrentIcon className="w-12 h-12 text-blue-600" />
              <div>
                <div className="text-3xl font-light text-stone-800">
                  {Math.round(weather.current.temp)}°C
                </div>
                <div className="text-sm text-stone-600">{weather.current.condition}</div>
              </div>
            </div>
            
            <div className="text-right space-y-1">
              {weather.current.wind_speed && (
                <div className="flex items-center gap-1 text-sm text-stone-600">
                  <Wind className="w-4 h-4" />
                  <span>{Math.round(weather.current.wind_speed)} km/h</span>
                </div>
              )}
              {weather.current.humidity && (
                <div className="flex items-center gap-1 text-sm text-stone-600">
                  <Droplets className="w-4 h-4" />
                  <span>{Math.round(weather.current.humidity)}%</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Forecast */}
      {weather.forecast && weather.forecast.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-stone-700 mb-3">3-Tage-Vorhersage</h3>
          <div className="grid grid-cols-3 gap-3">
            {weather.forecast.slice(0, 3).map((day, index) => {
              const DayIcon = getWeatherIcon(day.condition);
              return (
                <div
                  key={index}
                  className="bg-white/70 backdrop-blur-sm rounded-lg p-3 text-center"
                >
                  <div className="text-xs text-stone-600 mb-2">{day.day}</div>
                  <DayIcon className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <div className="text-sm font-medium text-stone-800">
                    {Math.round(day.temp_high)}° / {Math.round(day.temp_low)}°
                  </div>
                  <div className="text-xs text-stone-500 mt-1 truncate">
                    {day.condition}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}