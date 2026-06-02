import { getAllHikes } from "@/api/sheetsClient";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";
import { Map, MapPin } from "lucide-react";
import BackButton from "@/components/ui/BackButton";
import HikeMap from "@/components/map/HikeMap";

export default function MapView() {
  const { data: hikes = [], isLoading } = useQuery({
    queryKey: ["allHikes"],
    queryFn: getAllHikes,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const hikesWithCoords = hikes.filter(h => h.latitude && h.longitude);

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-50/20 pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 md:py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-4 md:mb-6"
        >
          <div>
            <BackButton to={createPageUrl("Dashboard")} className="mb-2 text-slate-600" />
            <div className="doghike-page-header mb-0">
              <div className="doghike-page-icon">
                <Map className="h-5 w-5" />
              </div>
              <div>
                <h1 className="doghike-page-title">Übersichtskarte</h1>
                <p className="doghike-page-subtitle flex items-center gap-2">
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
            <div className="doghike-empty-state">
              <MapPin className="doghike-empty-icon" />
              <h3 className="doghike-empty-title">Noch keine Wanderungen auf der Karte</h3>
              <p className="mx-auto max-w-xs text-sm text-slate-500">Aktuell sind noch keine Wanderungen mit Karte verfügbar.</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
