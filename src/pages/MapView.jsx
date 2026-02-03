import { base44 } from "@/api/base44Client";
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
    queryFn: () => base44.entities.Hike.filter({ status: "approved" })
  });

  const hikesWithCoords = hikes.filter(h => h.latitude && h.longitude);

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div>
            <Link to={createPageUrl("Dashboard")}>
              <Button variant="ghost" className="mb-2 text-stone-600">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-3xl font-light text-stone-800">Übersichtskarte</h1>
            <p className="text-stone-500 mt-1 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
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
            <HikeMap hikes={hikesWithCoords} height="calc(100vh - 200px)" zoom={9} />
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