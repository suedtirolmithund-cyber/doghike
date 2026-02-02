import { motion } from "framer-motion";
import { format } from "date-fns";
import { MapPin, Mountain, Clock, Star, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const difficultyColors = {
  easy: "bg-emerald-100 text-emerald-700 border-emerald-200",
  moderate: "bg-amber-100 text-amber-700 border-amber-200",
  challenging: "bg-orange-100 text-orange-700 border-orange-200",
  difficult: "bg-red-100 text-red-700 border-red-200"
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
  const hikeDogs = dogs.filter(d => hike.dogs?.includes(d.id));
  const coverPhoto = hike.photos?.[0] || "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
    >
      <Link to={createPageUrl("HikeDetail") + `?id=${hike.id}`}>
        <div className="group bg-white rounded-2xl overflow-hidden border border-stone-200/50 shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer">
          <div className="relative h-52 overflow-hidden">
            <img
              src={coverPhoto}
              alt={hike.trail_name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            {hike.weather && (
              <span className="absolute top-4 right-4 text-2xl">
                {weatherIcons[hike.weather]}
              </span>
            )}
            
            <div className="absolute bottom-4 left-4 right-4">
              <h3 className="text-xl font-semibold text-white mb-1">{hike.trail_name}</h3>
              <div className="flex items-center gap-1.5 text-white/80 text-sm">
                <MapPin className="w-3.5 h-3.5" />
                <span>{hike.location || "Dolomites"}</span>
              </div>
            </div>
          </div>
          
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-stone-500">
                {hike.date && format(new Date(hike.date), "MMM d, yyyy")}
              </span>
              {hike.difficulty && (
                <Badge className={`${difficultyColors[hike.difficulty]} border font-medium`}>
                  {hike.difficulty}
                </Badge>
              )}
            </div>
            
            <div className="grid grid-cols-3 gap-3 mb-4">
              {hike.distance_km && (
                <div className="text-center p-2 bg-stone-50 rounded-xl">
                  <p className="text-lg font-semibold text-stone-800">{hike.distance_km}</p>
                  <p className="text-xs text-stone-500">km</p>
                </div>
              )}
              {hike.elevation_gain_m && (
                <div className="text-center p-2 bg-stone-50 rounded-xl">
                  <p className="text-lg font-semibold text-stone-800">{hike.elevation_gain_m}</p>
                  <p className="text-xs text-stone-500">m elev.</p>
                </div>
              )}
              {hike.duration_minutes && (
                <div className="text-center p-2 bg-stone-50 rounded-xl">
                  <p className="text-lg font-semibold text-stone-800">
                    {Math.floor(hike.duration_minutes / 60)}:{String(hike.duration_minutes % 60).padStart(2, '0')}
                  </p>
                  <p className="text-xs text-stone-500">hours</p>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {hikeDogs.slice(0, 3).map((dog, i) => (
                  <div
                    key={dog.id}
                    className="w-8 h-8 rounded-full border-2 border-white shadow-sm overflow-hidden"
                    style={{ marginLeft: i > 0 ? "-8px" : 0 }}
                  >
                    <img
                      src={dog.photo_url || `https://api.dicebear.com/7.x/thumbs/svg?seed=${dog.name}`}
                      alt={dog.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
                {hikeDogs.length > 0 && (
                  <span className="text-sm text-stone-500 ml-1">
                    {hikeDogs.map(d => d.name).join(", ")}
                  </span>
                )}
              </div>
              
              {hike.rating && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="text-sm font-medium text-stone-700">{hike.rating}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}