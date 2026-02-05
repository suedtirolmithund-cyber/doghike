import { motion } from "framer-motion";
import { format } from "date-fns";
import { MapPin, Mountain, Clock, Star, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const difficultyColors = {
  "1": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "2": "bg-lime-100 text-lime-700 border-lime-200",
  "3": "bg-amber-100 text-amber-700 border-amber-200",
  "4": "bg-orange-100 text-orange-700 border-orange-200",
  "5": "bg-red-100 text-red-700 border-red-200"
};

const seasonEmojis = {
  spring: "🌸",
  summer: "☀️",
  autumn: "🍂",
  winter: "❄️",
  all_year: "🍃"
};

const waterLabels = {
  none: "Kein Wasser",
  little: "Wenig Wasser",
  moderate: "Etwas Wasser",
  plenty: "Viel Wasser"
};

const waterColors = {
  none: "text-red-500",
  little: "text-orange-500",
  moderate: "text-blue-400",
  plenty: "text-blue-600"
};

const weatherIcons = {
  sunny: "☀️",
  cloudy: "☁️",
  partly_cloudy: "⛅",
  rainy: "🌧️",
  snowy: "❄️",
  foggy: "🌫️"
};

export default function HikeCard({ hike, dogs = [], index = 0 }) {
  const hikeDogs = dogs.filter((d) => hike.dogs?.includes(d.id));
  const coverPhoto = hike.photos?.[0] || "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}>

      <Link to={createPageUrl("HikeDetail") + `?id=${hike.id}`}>
        <div className="group bg-white rounded-2xl overflow-hidden border border-stone-200/50 shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer">
          <div className="relative h-52 overflow-hidden">
            <img
              src={coverPhoto}
              alt={hike.trail_name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />

            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            {hike.season &&
            <span className="absolute top-4 right-4 text-2xl bg-white/80 backdrop-blur-sm rounded-full w-10 h-10 flex items-center justify-center">
                {seasonEmojis[hike.season]}
              </span>
            }
            
            <div className="absolute bottom-4 left-4 right-4">
              <h3 className="text-xl font-semibold text-white mb-1">{hike.trail_name}</h3>
              <div className="flex items-center gap-1.5 text-white/80 text-sm">
                <MapPin className="w-3.5 h-3.5" />
                <span>{hike.location || "Dolomites"}</span>
              </div>
            </div>
          </div>
          
          <div className="p-4 space-y-4">
            {/* Schwierigkeitsgrad */}
            <div className="flex gap-2">
              {hike.difficulty &&
              <Badge className="bg-blue-500 text-white px-2.5 py-0.5 text-xs font-medium">
                  👤 {hike.difficulty}
                </Badge>
              }
              {hike.dog_difficulty &&
              <Badge className={`${difficultyColors[hike.dog_difficulty]} border font-medium text-xs`}>
                  🐕 {hike.dog_difficulty}
                </Badge>
              }
            </div>

            {/* Wichtige Stats */}
            <div className="grid grid-cols-3 gap-2">
              {hike.distance_km && (
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-2 border border-slate-200/50">
                  <p className="text-xs text-slate-600 font-medium">Distance</p>
                  <p className="text-lg font-bold text-slate-800">{hike.distance_km}<span className="text-xs font-normal"> km</span></p>
                </div>
              )}
              {hike.elevation_gain_m && (
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-2 border border-slate-200/50">
                  <p className="text-xs text-slate-600 font-medium">Höhenmeter</p>
                  <p className="text-lg font-bold text-slate-800">{hike.elevation_gain_m}<span className="text-xs font-normal"> m</span></p>
                </div>
              )}
              {hike.duration_minutes && (
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-2 border border-slate-200/50">
                  <p className="text-xs text-slate-600 font-medium">Dauer</p>
                  <p className="text-lg font-bold text-slate-800">{(hike.duration_minutes / 60).toFixed(1)}<span className="text-xs font-normal"> Std</span></p>
                </div>
              )}
            </div>

            {/* Wasser & Saisonalität */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                {hike.water_availability && (
                  <span className={waterColors[hike.water_availability]}>
                    💧 {waterLabels[hike.water_availability]}
                  </span>
                )}
              </div>
              {hike.rating && (
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-medium text-slate-700">{hike.rating}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>);

}