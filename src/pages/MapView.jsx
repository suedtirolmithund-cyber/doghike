import { getHikes } from "@/api/sheetsClient";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import HikeMap from "@/components/map/HikeMap";

export default function MapView() {
  const { data: hikes = [], isLoading } = useQuery({
    queryKey: ["hikes"],
    queryFn: getHikes
  });

  const hikesWithCoords = hikes.filter(h => h.latitude && h.longitude);

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-slate-50 pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 md:py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-4 md:mb-6"
        >
          <div>
            <Link to={createPageUrl("Dashboard")}>
              <Button variant="ghost" className="mb-2 text-stone-600" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Zurück</span>
                <span className="sm:hidden">Back</span>
              </Button>
            </Link>
            <h1 className="text-2xl md:text-3xl font-light text-stone-800">Übersichtskarte</h1>
            <p className="text-stone-500 mt-1 flex items-center gap-2 text-sm md:text-base">
              <MapPin className="w-3 h-3 md:w-4 md:h-4" />
              {hikesWithCoords.length} Ausgangspunkte
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {hikesWithCoords.length > 0 ? (
            <HikeMap hikes={hikesWithCoords} height="calc(100vh - 220px)" zoom={9} />
          ) : (
            <div className="text-center py-20 bg-white rounded-2xl border border-stone-200/50">
              <MapPin className="w-16 h-16 text-stone-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-stone-700 mb-2">Noch keine Standorte</h3>
              <p className="text-stone-500">Bald findest du hier alle Ausgangspunkte</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}