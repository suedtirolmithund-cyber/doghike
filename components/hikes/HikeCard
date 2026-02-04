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
          
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex gap-1.5">
                {hike.difficulty &&
                <Badge className="bg-blue-500 text-primary-foreground px-2.5 py-0.5 text-xs font-medium rounded-md inline-flex items-center transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent shadow hover:bg-primary/80 undefined border">
                    👤 Stufe {hike.difficulty}
                  </Badge>
                }
                {hike.dog_difficulty &&
                <Badge className={`${difficultyColors[hike.dog_difficulty]} border font-medium text-xs`}>
                    🐕 Stufe {hike.dog_difficulty}
                  </Badge>
                }
              </div>
            </div>
            
            {hike.water_availability &&
            <div className={`text-xs mb-3 flex items-center gap-1 ${waterColors[hike.water_availability]}`}>
                💧 {waterLabels[hike.water_availability]}
              </div>
            }
            
            <div className="grid grid-cols-3 gap-3 mb-4">
              {hike.distance_km &&
              <div className="text-center p-2 bg-stone-50 rounded-xl">
                  <p className="text-lg font-semibold text-stone-800">{hike.distance_km}</p>
                  <p className="text-xs text-stone-500">km</p>
                </div>
              }
              {hike.elevation_gain_m &&
              <div className="text-center p-2 bg-stone-50 rounded-xl">
                  <p className="text-lg font-semibold text-stone-800">{hike.elevation_gain_m}</p>
                  <p className="text-xs text-stone-500">Hm</p>
                </div>
              }
              {hike.duration_minutes &&
              <div className="text-center p-2 bg-stone-50 rounded-xl">
                  <p className="text-lg font-semibold text-stone-800">
                    {(hike.duration_minutes / 60).toFixed(1)}
                  </p>
                  <p className="text-xs text-stone-500">Std</p>
                </div>
              }
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {hikeDogs.slice(0, 3).map((dog, i) =>
                <div
                  key={dog.id}
                  className="w-8 h-8 rounded-full border-2 border-white shadow-sm overflow-hidden"
                  style={{ marginLeft: i > 0 ? "-8px" : 0 }}>

                    <img
                    src={dog.photo_url || `https://api.dicebear.com/7.x/thumbs/svg?seed=${dog.name}`}
                    alt={dog.name}
                    className="w-full h-full object-cover" />

                  </div>
                )}
                {hikeDogs.length > 0 &&
                <span className="text-sm text-stone-500 ml-1">
                    {hikeDogs.map((d) => d.name).join(", ")}
                  </span>
                }
              </div>
              
              {hike.rating &&
              <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="text-sm font-medium text-stone-700">{hike.rating}</span>
                </div>
              }
            </div>
          </div>
        </div>
      </Link>
    </motion.div>);

}