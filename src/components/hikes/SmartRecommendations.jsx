import { useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import HikeCard from "./HikeCard";

export default function SmartRecommendations({ allHikes = [], dogs = [] }) {
  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me().catch(() => null)
  });

  const { data: myHikes = [] } = useQuery({
    queryKey: ["myHikes"],
    queryFn: async () => {
      const u = await base44.auth.me();
      const r = await base44.entities.Hike.filter({ created_by: u.email }, "-date");
      return Array.isArray(r) ? r : [];
    },
    enabled: !!user
  });

  const recommendations = useMemo(() => {
    if (allHikes.length === 0) return [];

    if (!user || myHikes.length === 0) {
      // No history: show hikes with photos (curated look)
      return allHikes.filter((h) => h.photos?.length > 0).slice(0, 3);
    }

    const myHikeIds = new Set(myHikes.map((h) => h.id));

    // Analyze preferences
    const avgDistance =
    myHikes.reduce((sum, h) => sum + (h.distance_km || 0), 0) / myHikes.length;

    const diffCounts = {};
    myHikes.forEach((h) => {
      if (h.difficulty) diffCounts[h.difficulty] = (diffCounts[h.difficulty] || 0) + 1;
    });
    const preferredDiff = Object.entries(diffCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

    const seasonCounts = {};
    myHikes.forEach((h) => {
      if (h.season) seasonCounts[h.season] = (seasonCounts[h.season] || 0) + 1;
    });
    const preferredSeason = Object.entries(seasonCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

    return allHikes.
    filter((h) => !myHikeIds.has(h.id)).
    map((h) => {
      let score = 0;
      if (preferredDiff && h.difficulty === preferredDiff) score += 3;
      const distDiff = Math.abs((h.distance_km || 0) - avgDistance);
      if (distDiff < 2) score += 3;else
      if (distDiff < 5) score += 1;
      if (preferredSeason && h.season === preferredSeason) score += 2;
      if (h.photos?.length > 0) score += 1;
      return { ...h, _score: score };
    }).
    sort((a, b) => b._score - a._score).
    slice(0, 3);
  }, [allHikes, myHikes, user]);

  if (recommendations.length === 0) return null;

  const isPersonalized = user && myHikes.length > 0;

  return (
    <div className="mb-12">
      <div className="flex items-center gap-2 mb-6">
        <h2 className="text-2xl font-light text-stone-800">
          {isPersonalized ? "Empfohlen für dich" : "Ausgewählte Touren"}
        </h2>
        
        {isPersonalized &&
        <span className="text-xs text-stone-500 bg-stone-100 px-2 py-1 rounded-full ml-1">
            basierend auf deinen Touren
          </span>
        }
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {recommendations.map((hike, index) =>
        <HikeCard key={hike.id} hike={hike} dogs={dogs} index={index} />
        )}
      </div>
    </div>);

}