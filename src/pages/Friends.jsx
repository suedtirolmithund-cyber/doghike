import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Users, Search, UserPlus, UserMinus, Check, X,
  Loader2, LogIn, Clock, Ruler, TrendingUp, Star, BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { useAuth } from "@/lib/AuthContext";
import {
  getFriendships, getFriendIds, getFriendFeedEntries,
  sendFriendRequest, acceptFriendRequest,
  rejectFriendRequest, removeFriend, searchProfiles,
} from "@/lib/friendsApi";

function FeedCard({ entry }) {
  const profile = entry.profile;
  const authorName = profile?.full_name || profile?.username || "Jemand";
  return (
    <Link to={createPageUrl("JournalDetail") + `?id=${entry.id}`}>
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-stone-200/60 shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
    >
      {entry.photos?.[0] && (
        <img src={entry.photos[0]} alt={entry.title} className="w-full h-44 object-cover" />
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-full overflow-hidden bg-stone-100 shrink-0">
            <img src={profile?.avatar_url || `https://api.dicebear.com/7.x/thumbs/svg?seed=${entry.user_id}`}
              alt="" className="w-full h-full object-cover" />
          </div>
          <span className="text-sm text-stone-600">
            <span className="font-medium text-stone-800">{authorName}</span>{" "}war wandern
          </span>
          <span className="ml-auto text-xs text-stone-400">
            {format(new Date(entry.date || entry.created_at), "d. MMM", { locale: de })}
          </span>
        </div>
        <h3 className="font-semibold text-stone-800 mb-1">{entry.title}</h3>
        {entry.location && <p className="text-xs text-stone-500 mb-2">📍 {entry.location}</p>}
        <div className="flex flex-wrap gap-3 text-xs text-stone-500 mb-2">
          {entry.distance_km && <span className="flex items-center gap-1"><Ruler className="w-3 h-3" />{entry.distance_km} km</span>}
          {entry.elevation_m && <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />{entry.elevation_m} Hm</span>}
          {entry.rating > 0 && <span className="flex items-center gap-1 text-yellow-500"><Star className="w-3 h-3 fill-yellow-400" />{entry.rating}/5</span>}
        </div>
        {entry.description && <p className="text-sm text-stone-500 line-clamp-2">{entry.description}</p>}
        {entry.dog_suitable && (
          <Badge variant="secondary" className="mt-2 text-xs bg-brand-50 text-brand-600 border-brand-200">
            🐕 Hundefreundlich
          </Badge>
        )}
      </div>
    </motion.div>
    </Link>
  );
}

function Avatar({ profile, size = "md" }) {
  const s = size === "sm" ? "w-8 h-8" : "w-11 h-11";
  const src = profile?.avatar_url ||
    `https://api.dicebear.com/7.x/thumbs/svg?seed=${profile?.user_id}&backgroundColor=f5f5f4`;
  return (
    <div className={`${s} rounded-full overflow-hidden bg-stone-100 shrink-0`}>
      <img src={src} alt="" className="w-full h-full object-cover" />
    </div>
  );
}

function ProfileName({ profile }) {
  return (
    <div>
      <p className="font-semibold text-stone-800 text-sm">
        {profile?.full_name || profile?.username || "Unbekannt"}
      </p>
      {profile?.username && (
        <p className="text-xs text-stone-400">@{profile.username}</p>
      )}
    </div>
  );
}

export default function Friends() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const [feedVisible, setFeedVisible] = useState(10);

  const { data: friendships = [], isLoading } = useQuery({
    queryKey: ["friendships", user?.id],
    queryFn: () => getFriendships(user.id),
    enabled: !!user?.id,
    refetchInterval: 30_000,
  });

  const { data: friendIds = [] } = useQuery({
    queryKey: ["friendIds", user?.id],
    queryFn: () => getFriendIds(user.id),
    enabled: !!user?.id,
  });

  const { data: feedEntries = [], isLoading: feedLoading } = useQuery({
    queryKey: ["friendFeed", friendIds.join(",")],
    queryFn: () => getFriendFeedEntries(friendIds),
    enabled: friendIds.length > 0,
    refetchInterval: 5 * 60_000,
  });

  // Categorise
  const accepted = friendships.filter((f) => f.status === "accepted");
  const incoming = friendships.filter(
    (f) => f.status === "pending" && f.receiver_id === user?.id
  );
  const outgoing = friendships.filter(
    (f) => f.status === "pending" && f.requester_id === user?.id
  );

  // Fetch profiles for all involved user IDs
  const allIds = [...new Set(friendships.flatMap((f) => [f.requester_id, f.receiver_id]))];
  const { data: profileMap = {} } = useQuery({
    queryKey: ["friendProfiles", allIds.join(",")],
    queryFn: async () => {
      if (!allIds.length) return {};
      const { supabase } = await import("@/lib/supabaseClient");
      const { data } = await supabase
        .from("profiles")
        .select("user_id, username, full_name, avatar_url")
        .in("user_id", allIds);
      return Object.fromEntries((data ?? []).map((p) => [p.user_id, p]));
    },
    enabled: allIds.length > 0,
  });

  const friendOf = (f) =>
    profileMap[f.requester_id === user?.id ? f.receiver_id : f.requester_id];

  const refreshFriendData = () => {
    queryClient.invalidateQueries({ queryKey: ["friendships", user?.id] });
    queryClient.invalidateQueries({ queryKey: ["friendIds", user?.id] });
    queryClient.invalidateQueries({ queryKey: ["friendFeed"] });
    queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
  };

  // Mutations
  const sendMutation = useMutation({
    mutationFn: (receiverId) => sendFriendRequest(user.id, receiverId),
    onSuccess: () => {
      refreshFriendData();
      toast.success("Freundschaftsanfrage gesendet");
    },
    onError: () => toast.error("Die Freundschaftsanfrage konnte gerade nicht gesendet werden. Bitte versuche es noch einmal."),
  });

  const acceptMutation = useMutation({
    mutationFn: acceptFriendRequest,
    onSuccess: () => {
      refreshFriendData();
      toast.success("Freundschaft bestätigt");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: rejectFriendRequest,
    onSuccess: () => {
      refreshFriendData();
      toast.success("Anfrage abgelehnt");
    },
  });

  const removeMutation = useMutation({
    mutationFn: removeFriend,
    onSuccess: () => {
      refreshFriendData();
      toast.success("Freund entfernt");
    },
  });

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const results = await searchProfiles(searchQuery, user.id);
      setSearchResults(results);
      if (results.length === 0) {
        toast.info("Keine Nutzer gefunden. Falls die Person neu registriert ist, muss sie sich einmal ab- und wieder anmelden.");
      }
    } catch {
      toast.error("Die Suche konnte gerade nicht ausgeführt werden. Bitte versuche es noch einmal.");
    } finally {
      setSearching(false);
    }
  };

  const existingFriendship = (targetId) =>
    friendships.find(
      (f) =>
        (f.requester_id === user?.id && f.receiver_id === targetId) ||
        (f.receiver_id === user?.id && f.requester_id === targetId)
    );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <Users className="w-12 h-12 text-stone-300 mx-auto mb-4" />
          <p className="text-stone-600 font-medium mb-4">Bitte melde dich an.</p>
          <Link to={createPageUrl("Login")}>
            <Button className="bg-brand-400 hover:bg-brand-600">
              <LogIn className="w-4 h-4 mr-2" /> Anmelden
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-brand-50/10 pb-24 md:pb-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 md:py-10">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
            <Users className="w-7 h-7 text-brand-400" />
            Freunde
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            {accepted.length} Freund{accepted.length !== 1 ? "e" : ""}
            {incoming.length > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-amber-600 font-medium">
                · {incoming.length} offene Anfrage{incoming.length !== 1 ? "n" : ""}
              </span>
            )}
          </p>
        </motion.div>

        {/* Search */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-stone-200/60 shadow-sm p-4 mb-6"
        >
          <h2 className="text-sm font-semibold text-stone-700 mb-3 flex items-center gap-2">
            <Search className="w-4 h-4" /> Freunde suchen
          </h2>
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Username oder Name suchen..."
              className="flex-1"
            />
            <Button type="submit" disabled={searching} className="bg-brand-400 hover:bg-brand-600 shrink-0">
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
          </form>

          <AnimatePresence>
            {searchResults.length > 0 && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="mt-3 space-y-2"
              >
                {searchResults.map((profile) => {
                  const existing = existingFriendship(profile.user_id);
                  const isIncomingPending =
                    existing?.status === "pending" &&
                    existing?.requester_id === profile.user_id &&
                    existing?.receiver_id === user?.id;

                  const isOutgoingPending =
                    existing?.status === "pending" &&
                    existing?.requester_id === user?.id &&
                    existing?.receiver_id === profile.user_id;

                  return (
                    <div key={profile.user_id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-stone-50">
                      <Avatar profile={profile} />
                      <ProfileName profile={profile} />
                      <div className="ml-auto shrink-0">
                        {!existing ? (
                          <Button size="sm" onClick={() => sendMutation.mutate(profile.user_id)}
                            disabled={sendMutation.isPending}
                            className="bg-brand-400 hover:bg-brand-600 h-8"
                          >
                            <UserPlus className="w-3.5 h-3.5 mr-1" /> Anfrage senden
                          </Button>
                        ) : isIncomingPending ? (
                          <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> Offene Anfrage
                          </span>
                        ) : isOutgoingPending ? (
                          <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> Gesendet
                          </span>
                        ) : (
                          <span className="text-xs text-brand-400 font-medium flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Freund
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}
            {searchResults.length === 0 && searchQuery && !searching && (
              <p className="text-xs text-stone-400 mt-2 text-center">Keine Nutzer gefunden für „{searchQuery}“</p>
            )}
          </AnimatePresence>
        </motion.div>

        <Tabs defaultValue={incoming.length > 0 ? "requests" : "friends"}>
          <TabsList className="bg-white border border-stone-200/60 w-full mb-4">
            <TabsTrigger value="friends" className="flex-1">
              Freunde ({accepted.length})
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex-1 relative">
              Offene Anfragen
              {incoming.length > 0 && (
                <span className="ml-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
                  {incoming.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent" className="flex-1">
              Gesendet ({outgoing.length})
            </TabsTrigger>
            <TabsTrigger value="feed" className="flex-1">
              Touren von Freunden
            </TabsTrigger>
          </TabsList>

          {/* Friends list */}
          <TabsContent value="friends">
            {isLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-stone-400 animate-spin" /></div>
            ) : accepted.length > 0 ? (
              <div className="space-y-2">
                {accepted.map((f) => {
                  const profile = friendOf(f);
                  return (
                    <motion.div key={f.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="bg-white rounded-xl border border-stone-200/60 shadow-sm p-3 flex items-center gap-3"
                    >
                      <Avatar profile={profile} />
                      <ProfileName profile={profile} />
                      <Button size="sm" variant="ghost"
                        onClick={() => removeMutation.mutate(f.id)}
                        disabled={removeMutation.isPending}
                        className="ml-auto text-stone-400 hover:text-red-500 hover:bg-red-50 h-8"
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                      </Button>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl border border-stone-200/50">
                <Users className="w-12 h-12 text-stone-200 mx-auto mb-3" />
                <p className="text-stone-600 font-medium mb-1">Noch keine Freunde</p>
                <p className="text-stone-400 text-sm">Suche nach Nutzern und schick eine Anfrage!</p>
              </div>
            )}
          </TabsContent>

          {/* Incoming requests */}
          <TabsContent value="requests">
            {incoming.length > 0 ? (
              <div className="space-y-2">
                {incoming.map((f) => {
                  const profile = profileMap[f.requester_id] ?? { user_id: f.requester_id, full_name: "Nutzer", username: null, avatar_url: null };
                  return (
                    <motion.div key={f.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="bg-white rounded-xl border border-amber-200 shadow-sm p-3 flex items-center gap-3"
                    >
                      <Avatar profile={profile} />
                      <div className="flex-1 min-w-0">
                        <ProfileName profile={profile} />
                        <p className="text-xs text-amber-600">Möchte dein Freund sein</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button size="sm" onClick={() => acceptMutation.mutate(f.id)}
                          disabled={acceptMutation.isPending}
                          className="bg-brand-400 hover:bg-brand-600 h-8"
                        >
                          <Check className="w-3.5 h-3.5 mr-1" /> Annehmen
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => rejectMutation.mutate(f.id)}
                          disabled={rejectMutation.isPending}
                          className="border-red-200 text-red-500 hover:bg-red-50 h-8"
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl border border-stone-200/50">
                <Clock className="w-12 h-12 text-stone-200 mx-auto mb-3" />
                <p className="text-stone-500 text-sm">Keine offenen Anfragen</p>
              </div>
            )}
          </TabsContent>

          {/* Sent requests */}
          <TabsContent value="sent">
            {outgoing.length > 0 ? (
              <div className="space-y-2">
                {outgoing.map((f) => {
                  const profile = profileMap[f.receiver_id];
                  return (
                    <motion.div key={f.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="bg-white rounded-xl border border-stone-200/60 shadow-sm p-3 flex items-center gap-3"
                    >
                      <Avatar profile={profile} />
                      <div className="flex-1 min-w-0">
                        <ProfileName profile={profile} />
                        <p className="text-xs text-stone-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Anfrage gesendet
                        </p>
                      </div>
                      <Button size="sm" variant="ghost"
                        onClick={() => removeMutation.mutate(f.id)}
                        className="text-stone-400 hover:text-red-500 h-8 ml-auto"
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl border border-stone-200/50">
                <p className="text-stone-500 text-sm">Keine gesendeten Anfragen</p>
              </div>
            )}
          </TabsContent>
          {/* Feed */}
          <TabsContent value="feed">
            {feedLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-stone-400 animate-spin" /></div>
            ) : friendIds.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-stone-200/50">
                <Users className="w-12 h-12 text-stone-200 mx-auto mb-3" />
                <p className="text-stone-600 font-medium mb-1">Noch keine Freunde</p>
                <p className="text-stone-400 text-sm">Füge Freunde hinzu, um ihre Wanderungen zu sehen.</p>
              </div>
            ) : feedEntries.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-stone-200/50">
                <BookOpen className="w-12 h-12 text-stone-200 mx-auto mb-3" />
                <p className="text-stone-600 font-medium mb-1">Noch keine Touren von Freunden</p>
                <p className="text-stone-400 text-sm">Deine Freunde haben noch keine Wanderungen geteilt.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {feedEntries.slice(0, feedVisible).map((entry) => (
                  <FeedCard key={entry.id} entry={entry} />
                ))}
                {feedVisible < feedEntries.length && (
                  <div className="text-center pt-2">
                    <button onClick={() => setFeedVisible((v) => v + 10)}
                      className="text-sm text-brand-400 hover:text-brand-600 font-medium px-4 py-2 rounded-xl hover:bg-brand-50 transition-colors"
                    >
                      {feedEntries.length - feedVisible} weitere laden ↓
                    </button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
