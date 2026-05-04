import { getAllHikes } from "@/api/sheetsClient";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Map, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import HikeMap from "@/components/map/HikeMap";

export default function MapView() {
  const { data: hikes = [], isLoading } = useQuery({
    queryKey: ["allHikes"],
    queryFn: getAllHikes,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const hikesWithCoords = hikes.filter(h => h.latitude && h.longitude);

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-brand-50/20 pb-24 md:pb-8">
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
                Zurück
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                <Map className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-stone-800">Übersichtskarte</h1>
                <p className="mt-1 flex items-center gap-2 text-sm text-stone-500 md:text-base">
                  <MapPin className="h-3 w-3 md:h-4 md:w-4" />
                  {hikesWithCoords.length} Ausgangspunkte
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {hikesWithCoords.length > 0 ? (
            <HikeMap hikes={hikesWithCoords} height="calc(100svh - 200px)" zoom={9} />
          ) : (
            <div className="doghike-glass-card text-center py-20">
              <MapPin className="w-16 h-16 text-stone-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-stone-700 mb-2">Noch keine Standorte</h3>
              <p className="text-stone-500">Aktuell sind noch keine Touren mit Karte verfügbar.</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
