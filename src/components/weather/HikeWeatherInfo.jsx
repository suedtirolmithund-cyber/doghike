import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Cloud, Droplets, Wind, Thermometer, Loader2, CloudRain, Sun, CloudSnow } from "lucide-react";
import { motion } from "framer-motion";

export default function HikeWeatherInfo({ location, date, latitude, longitude }) {
  const { data: weatherData, isLoading } = useQuery({
    queryKey: ["weather", latitude, longitude],
    queryFn: async () => {
      if (!latitude || !longitude) return null;
      
      // Nutze OpenWeatherMap API über LLM-Integration
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Gib mir das aktuelle Wetter für diese Koordinaten: ${latitude}, ${longitude}. 
        Antworte nur mit einem JSON-Objekt mit diesen Feldern:
        - temperature (Zahl in Celsius)
        - description (kurze Beschreibung auf Deutsch)
        - humidity (Luftfeuchtigkeit in Prozent)
        - wind_speed (Windgeschwindigkeit in km/h)
        - condition (eines von: sunny, cloudy, rainy, snowy)`,
        response_json_schema: {
          type: "object",
          properties: {
            temperature: { type: "number" },
            description: { type: "string" },
            humidity: { type: "number" },
            wind_speed: { type: "number" },
            condition: { type: "string" }
          }
        }
      });
      
      return response;
    },
    enabled: !!latitude && !!longitude,
    staleTime: 1000 * 60 * 30 // 30 Minuten
  });

  if (!latitude || !longitude) {
    return null;
  }

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

  if (!weatherData) {
    return null;
  }

  const getWeatherIcon = (condition) => {
    switch (condition?.toLowerCase()) {
      case "sunny":
        return <Sun className="w-12 h-12 text-yellow-500" />;
      case "rainy":
        return <CloudRain className="w-12 h-12 text-blue-500" />;
      case "snowy":
        return <CloudSnow className="w-12 h-12 text-slate-400" />;
      default:
        return <Cloud className="w-12 h-12 text-slate-500" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-2xl p-6 border border-blue-200"
    >
      <h3 className="text-lg font-semibold text-stone-800 mb-4 flex items-center gap-2">
        <Cloud className="w-5 h-5" />
        Aktuelle Wetterbedingungen
      </h3>
      
      <div className="flex items-start gap-6">
        <div className="flex flex-col items-center">
          {getWeatherIcon(weatherData.condition)}
          <p className="text-3xl font-bold text-stone-800 mt-2">
            {Math.round(weatherData.temperature)}°C
          </p>
          <p className="text-sm text-stone-600 mt-1">{weatherData.description}</p>
        </div>
        
        <div className="flex-1 grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Droplets className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-xs text-stone-500">Luftfeuchtigkeit</p>
              <p className="font-semibold text-stone-800">{weatherData.humidity}%</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Wind className="w-5 h-5 text-slate-600" />
            <div>
              <p className="text-xs text-stone-500">Wind</p>
              <p className="font-semibold text-stone-800">{Math.round(weatherData.wind_speed)} km/h</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-white/50 rounded-lg">
        <p className="text-xs text-stone-600">
          ⚠️ Hinweis: Wetterbedingungen können sich schnell ändern. Prüfe die aktuellen Vorhersagen vor deiner Wanderung!
        </p>
      </div>
    </motion.div>
  );
}