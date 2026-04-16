import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Users, Mountain, Clock, Ruler, TrendingUp, LogIn, BookOpen, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/AuthContext";
import { getFriendIds, getFriendFeedEntries } from "@/lib/friendsApi";

function FeedCard({ entry }) {
  const profile = entry.profile;
  const authorName = profile?.full_name || profile?.username || "Jemand";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-stone-200/60 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
    >
      {entry.photos?.[0] && (
        <img
          src={entry.photos[0]}
          alt={entry.title}
          className="w-full h-44 object-cover"
        />
      )}
      <div className="p-4">
        {/* Author */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-full overflow-hidden bg-stone-100 shrink-0">
            <img
              src={profile?.avatar_url || `https://api.dicebear.com/7.x/thumbs/svg?seed=${entry.user_id}`}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-sm text-stone-600">
            <span className="font-medium text-stone-800">{authorName}</span>
            {" "}war wandern
          </span>
          <span className="ml-auto text-xs text-stone-400">
            {format(new Date(entry.date || entry.created_at), "d. MMM", { locale: de })}
          </span>
        </div>

        <h3 className="font-semibold text-stone-800 mb-1">{entry.title}</h3>
        {entry.location && (
          <p className="text-xs text-stone-500 mb-2">📍 {entry.location}</p>
        )}

        {/* Stats */}
        <div className="flex flex-wrap gap-3 text-xs text-stone-500 mb-3">
          {entry.distance_km && (
            <span className="flex items-center gap-1"><Ruler className="w-3 h-3" />{entry.distance_km} km</span>
          )}
          {entry.elevation_m && (
            <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />{entry.elevation_m} Hm</span>
          )}
          {entry.duration_minutes && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />{(entry.duration_minutes / 60).toFixed(1)} Std
            </span>
          )}
          {entry.rating > 0 && (
            <span className="flex items-center gap-1 text-yellow-500">
              <Star className="w-3 h-3 fill-yellow-400" />{entry.rating}/5
            </span>
          )}
        </div>

        {entry.description && (
          <p className="text-sm text-stone-500 line-clamp-2">{entry.description}</p>
        )}

        {entry.dog_suitable && (
          <Badge variant="secondary" className="mt-2 text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
            🐕 Hundefreundlich
          </Badge>
        )}
      </div>
    </motion.div>
  );
}

export default function Feed() {
  const { user, isAuthenticated } = useAuth();

  const { data: friendIds = [] } = useQuery({
    queryKey: ["friendIds", user?.id],
    queryFn: () => getFriendIds(user.id),
    enabled: !!user?.id,
  });

  const { data: feedEntries = [], isLoading } = useQuery({
    queryKey: ["friendFeed", friendIds.join(",")],
    queryFn: () => getFriendFeedEntries(friendIds),
    enabled: friendIds.length > 0,
    refetchInterval: 5 * 60_000,
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <Users className="w-12 h-12 text-stone-300 mx-auto mb-4" />
          <p className="text-stone-700 font-medium mb-4">Melde dich an um den Freundes-Feed zu sehen</p>
          <Link to={createPageUrl("Login")}>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <LogIn className="w-4 h-4 mr-2" /> Anmelden
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-emerald-50/10 pb-24 md:pb-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 md:py-10">

        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
            <Users className="w-7 h-7 text-emerald-600" />
            Freundes-Feed
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Wanderungen deiner {friendIds.length} Freund{friendIds.length !== 1 ? "e" : ""}
          </p>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-stone-200 border-t-emerald-600 rounded-full animate-spin" />
          </div>
        ) : friendIds.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-stone-200/50">
            <Users className="w-14 h-14 text-stone-200 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-stone-700 mb-2">Noch keine Freunde</h3>
            <p className="text-stone-500 text-sm mb-6 max-w-xs mx-auto">
              Füge Freunde hinzu um ihre Wanderungen hier zu sehen.
            </p>
            <Link to={createPageUrl("Friends")}>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Users className="w-4 h-4 mr-2" /> Freunde finden
              </Button>
            </Link>
          </div>
        ) : feedEntries.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-stone-200/50">
            <BookOpen className="w-14 h-14 text-stone-200 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-stone-700 mb-2">Noch nichts im Feed</h3>
            <p className="text-stone-500 text-sm max-w-xs mx-auto">
              Deine Freunde haben noch keine Wanderungen geteilt.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {feedEntries.map((entry, i) => (
              <FeedCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
