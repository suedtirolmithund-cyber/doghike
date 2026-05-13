import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { Sparkles } from "lucide-react";
import HikeCard from "./HikeCard";

export default function SmartRecommendations({ allHikes = [] }) {
  const { user } = useAuth();

  // User's own journal entries for preference analysis
  const { data: myEntries = [] } = useQuery({
    queryKey: ["myJournalEntries", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("journal_entries")
        .select("distance_km, elevation_m, difficulty")
        .eq("user_id", user.id)
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user?.id,
  });

  const recommendations = useMemo(() => {
    if (!allHikes.length) return [];

    if (!user || !myEntries.length) {
      return allHikes.filter((h) => h.photos?.length > 0).slice(0, 3);
    }

    const avgDistance =
      myEntries.reduce((s, e) => s + (e.distance_km || 0), 0) / myEntries.length;

    const diffCounts = {};
    myEntries.forEach((e) => {
      if (e.difficulty) diffCounts[e.difficulty] = (diffCounts[e.difficulty] || 0) + 1;
    });
    const preferredDiff = Object.entries(diffCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

    return allHikes
      .map((h) => {
        let score = 0;
        if (preferredDiff && String(h.difficulty) === String(preferredDiff)) score += 3;
        const distDiff = Math.abs((h.distance_km || 0) - avgDistance);
        if (distDiff < 2) score += 3;
        else if (distDiff < 5) score += 1;
        if (h.photos?.length > 0) score += 1;
        return { ...h, _score: score };
      })
      .sort((a, b) => b._score - a._score)
      .slice(0, 3);
  }, [allHikes, myEntries, user]);

  if (!recommendations.length) return null;

  const isPersonalized = !!user && myEntries.length > 0;

  return (
    <div className="mb-12">
      <div className="flex items-center gap-2 mb-6">
        <h2 className="text-2xl font-light text-slate-900">
          {isPersonalized ? "Empfohlen für dich" : "Ausgewählte Touren"}
        </h2>
        {isPersonalized && (
          <span className="text-xs text-slate-500 bg-brand-100/80 px-2 py-1 rounded-full flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> basierend auf deinen Touren
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {recommendations.map((hike, i) => (
          <HikeCard key={`${hike._source ?? "sheets"}-${hike.id}`} hike={hike} index={i} />
        ))}
      </div>
    </div>
  );
}
