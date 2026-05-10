import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Users, Search, UserPlus, UserMinus, Check, X,
  Loader2, LogIn, Clock, Star, BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { useAuth } from "@/lib/AuthContext";
import { TOUR_ICONS } from "@/lib/difficultyConfig";
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
      className="doghike-glass-card-hover overflow-hidden cursor-pointer"
    >
      {entry.photos?.[0] && (
        <img src={entry.photos[0]} alt={entry.title} className="w-full h-44 object-cover" />
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-full overflow-hidden bg-yellow-100/80 shrink-0">
            <img src={profile?.avatar_url || `https://api.dicebear.com/7.x/thumbs/svg?seed=${entry.user_id}`}
              alt="" className="w-full h-full object-cover" />
          </div>
          <span className="text-sm text-slate-600">
            <span className="font-medium text-slate-900">{authorName}</span>{" "}war wandern
          </span>
          <span className="ml-auto text-xs text-slate-400">
            {format(new Date(entry.date || entry.created_at), "d. MMM", { locale: de })}
          </span>
        </div>
        <h3 className="font-semibold text-slate-900 mb-1">{entry.title}</h3>
        {entry.location && <p className="text-xs text-slate-500 mb-2">Ort: {entry.location}</p>}
        <div className="flex flex-wrap gap-3 text-xs text-slate-500 mb-2">
          {entry.distance_km && <span className="flex items-center gap-1"><span className="text-sm leading-none">{TOUR_ICONS.distance}</span>{entry.distance_km} km</span>}
          {entry.elevation_m && <span className="flex items-center gap-1"><span className="text-sm leading-none">{TOUR_ICONS.elevation}</span>{entry.elevation_m} Hm</span>}
          {entry.rating > 0 && <span className="flex items-center gap-1 text-yellow-500"><Star className="w-3 h-3 fill-yellow-400" />{entry.rating}/5</span>}
        </div>
        {entry.description && <p className="text-sm text-slate-500 line-clamp-2">{entry.description}</p>}
        {entry.dog_suitable && (
          <Badge variant="secondary" className="mt-2 text-xs bg-brand-50 text-brand-600 border-brand-200">
            Hundefreundlich
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
    <div className={`${s} rounded-full overflow-hidden bg-yellow-100/80 shrink-0`}>
      <img src={src} alt="" className="w-full h-full object-cover" />
    </div>
  );
}

function ProfileName({ profile }) {
  return (
    <div>
      <p className="font-semibold text-slate-900 text-sm">
        {profile?.full_name || profile?.username || "Unbekannt"}
      </p>
      {profile?.username && (
        <p className="text-xs text-slate-400">@{profile.username}</p>
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

  const stableFriendIds = [...friendIds].sort();

  const { data: feedEntries = [], isLoading: feedLoading } = useQuery({
    queryKey: ["friendFeed", user?.id, stableFriendIds.join(",")],
    queryFn: () => getFriendFeedEntries(stableFriendIds),
    enabled: stableFriendIds.length > 0,
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
  const stableAllIds = [...allIds].sort();
  const { data: profileMap = {} } = useQuery({
    queryKey: ["friendProfiles", user?.id, stableAllIds.join(",")],
    queryFn: async () => {
      if (!stableAllIds.length) return {};
      const { supabase } = await import("@/lib/supabaseClient");
      const { data } = await supabase
        .from("profiles")
        .select("user_id, username, full_name, avatar_url")
        .in("user_id", stableAllIds);
      return Object.fromEntries((data ?? []).map((p) => [p.user_id, p]));
    },
    enabled: stableAllIds.length > 0,
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
    onError: () => toast.error("Die Anfrage konnte gerade nicht angenommen werden. Bitte versuche es noch einmal."),
  });

  const rejectMutation = useMutation({
    mutationFn: rejectFriendRequest,
    onSuccess: () => {
      refreshFriendData();
      toast.success("Anfrage abgelehnt");
    },
    onError: () => toast.error("Die Anfrage konnte gerade nicht abgelehnt werden. Bitte versuche es noch einmal."),
  });

  const removeMutation = useMutation({
    mutationFn: removeFriend,
    onSuccess: () => {
      refreshFriendData();
      toast.success("Freund entfernt");
    },
    onError: () => toast.error("Der Kontakt konnte gerade nicht entfernt werden. Bitte versuche es noch einmal."),
  });

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const results = await searchProfiles(searchQuery, user.id);
      setSearchResults(results);
      if (results.length === 0) {
        toast.info("Kein passender Nutzer gefunden. Prüfe den Namen oder versuche es später noch einmal.");
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
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 font-medium mb-4">Bitte melde dich an.</p>
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
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-brand-50/10 pb-24 md:pb-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 md:py-10">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="doghike-page-header">
          <div className="doghike-page-icon">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="doghike-page-title">
              Freunde
            </h1>
            <p className="doghike-page-subtitle">
            {accepted.length} Freund{accepted.length !== 1 ? "e" : ""}
            {incoming.length > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 font-medium text-yellow-600">
                · {incoming.length} offene Anfrage{incoming.length !== 1 ? "n" : ""}
              </span>
            )}
            </p>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="doghike-glass-card mb-5 p-3.5 sm:p-4"
        >
          <h2 className="mb-2.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Search className="w-4 h-4" /> Freunde suchen
          </h2>
          <form onSubmit={handleSearch} className="grid grid-cols-[1fr_auto] gap-2">
            <Input
              value={searchQuery}
              onChange={(e) => {
                const value = e.target.value;
                setSearchQuery(value);
                if (!value.trim()) {
                  setSearchResults([]);
                }
              }}
              placeholder="Username oder Name suchen..."
              className="h-11 rounded-xl text-sm"
            />
            <Button type="submit" disabled={searching} className="h-11 w-12 shrink-0 rounded-xl bg-brand-400 px-0 hover:bg-brand-600">
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
                  const isAccepted = existing?.status === "accepted";
                  const isIncomingPending =
                    existing?.status === "pending" &&
                    existing?.requester_id === profile.user_id &&
                    existing?.receiver_id === user?.id;

                  const isOutgoingPending =
                    existing?.status === "pending" &&
                    existing?.requester_id === user?.id &&
                    existing?.receiver_id === profile.user_id;

                  return (
                    <div key={profile.user_id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-brand-50/50">
                      <Avatar profile={profile} />
                      <ProfileName profile={profile} />
                      <div className="ml-auto shrink-0">
                        {!existing || existing?.status === "rejected" ? (
                          <Button size="sm" onClick={() => sendMutation.mutate(profile.user_id)}
                            disabled={sendMutation.isPending}
                            className="bg-brand-400 hover:bg-brand-600 h-8"
                          >
                            <UserPlus className="w-3.5 h-3.5 mr-1" /> Anfrage senden
                          </Button>
                        ) : isIncomingPending ? (
                          <span className="text-xs text-yellow-600 font-medium flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> Offene Anfrage
                          </span>
                        ) : isOutgoingPending ? (
                          <span className="text-xs text-yellow-600 font-medium flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> Gesendet
                          </span>
                        ) : isAccepted ? (
                          <span className="text-xs text-brand-400 font-medium flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Freund
                          </span>
                        ) : (
                          <Button size="sm" onClick={() => sendMutation.mutate(profile.user_id)}
                            disabled={sendMutation.isPending}
                            className="bg-brand-400 hover:bg-brand-600 h-8"
                          >
                            <UserPlus className="w-3.5 h-3.5 mr-1" /> Anfrage senden
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}
            {searchResults.length === 0 && searchQuery && !searching && (
              <p className="text-xs text-slate-400 mt-2 text-center">Keine Nutzer gefunden für „{searchQuery}“</p>
            )}
          </AnimatePresence>
        </motion.div>

        <Tabs defaultValue={incoming.length > 0 ? "requests" : "friends"}>
          <TabsList className="grid w-full grid-cols-4 border border-white/70 bg-white/65 backdrop-blur-xl mb-4">
            <TabsTrigger value="friends" className="px-1 text-[11px] sm:text-sm">
              <span className="sm:hidden">Freunde</span>
              <span className="hidden sm:inline">Freunde ({accepted.length})</span>
            </TabsTrigger>
            <TabsTrigger value="requests" className="relative px-1 text-[11px] sm:text-sm">
              <span className="sm:hidden">Anfragen</span>
              <span className="hidden sm:inline">Offene Anfragen</span>
              {incoming.length > 0 && (
                <span className="ml-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
                  {incoming.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent" className="px-1 text-[11px] sm:text-sm">
              <span className="sm:hidden">Gesendet</span>
              <span className="hidden sm:inline">Gesendet ({outgoing.length})</span>
            </TabsTrigger>
            <TabsTrigger value="feed" className="px-1 text-[11px] sm:text-sm">
              <span className="sm:hidden">Touren</span>
              <span className="hidden sm:inline">Touren von Freunden</span>
            </TabsTrigger>
          </TabsList>

          {/* Friends list */}
          <TabsContent value="friends">
            {isLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-slate-400 animate-spin" /></div>
            ) : accepted.length > 0 ? (
              <div className="space-y-2">
                {accepted.map((f) => {
                  const profile = friendOf(f);
                  return (
                    <motion.div key={f.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="doghike-glass-card flex items-center gap-3 rounded-2xl px-3.5 py-3.5"
                    >
                      <Avatar profile={profile} />
                      <div className="min-w-0 flex-1">
                        <ProfileName profile={profile} />
                      </div>
                      <Button size="sm" variant="ghost"
                        onClick={() => removeMutation.mutate(f.id)}
                        disabled={removeMutation.isPending}
                        className="ml-auto h-9 w-9 rounded-xl p-0 text-slate-400 hover:bg-red-50 hover:text-red-500"
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                      </Button>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="doghike-empty-state">
                <Users className="doghike-empty-icon" />
                <p className="text-slate-600 font-medium mb-1">Noch keine Freunde</p>
                <p className="text-slate-400 text-sm">Suche nach anderen Nutzern und schicke deine erste Anfrage.</p>
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
                      className="rounded-xl border border-yellow-200 bg-yellow-50/70 p-3 flex items-center gap-3 shadow-sm backdrop-blur-xl"
                    >
                      <Avatar profile={profile} />
                      <div className="flex-1 min-w-0">
                        <ProfileName profile={profile} />
                        <p className="text-xs text-yellow-600">Möchte dein Freund sein</p>
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
              <div className="doghike-empty-state">
                <Clock className="doghike-empty-icon" />
                <p className="text-slate-600 font-medium mb-1">Keine offenen Anfragen</p>
                <p className="text-slate-400 text-sm">Sobald dir jemand schreibt, erscheint es hier.</p>
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
                      className="doghike-glass-card flex items-center gap-3 rounded-2xl px-3.5 py-3.5"
                    >
                      <Avatar profile={profile} />
                      <div className="flex-1 min-w-0">
                        <ProfileName profile={profile} />
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Gesendet
                        </p>
                      </div>
                      <Button size="sm" variant="ghost"
                        onClick={() => removeMutation.mutate(f.id)}
                        className="ml-auto h-9 w-9 rounded-xl p-0 text-slate-400 hover:text-red-500"
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="doghike-empty-state">
                <Clock className="doghike-empty-icon" />
                <p className="text-slate-600 font-medium mb-1">Keine gesendeten Anfragen</p>
                <p className="text-slate-400 text-sm">Suche nach einem Nutzer und sende deine erste Anfrage.</p>
              </div>
            )}
          </TabsContent>
          {/* Feed */}
          <TabsContent value="feed">
            {feedLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-slate-400 animate-spin" /></div>
            ) : friendIds.length === 0 ? (
              <div className="doghike-empty-state">
                <Users className="doghike-empty-icon" />
                <p className="text-slate-600 font-medium mb-1">Noch keine Freunde</p>
                <p className="text-slate-400 text-sm">Füge Freunde hinzu, um ihre Wanderungen zu sehen.</p>
              </div>
            ) : feedEntries.length === 0 ? (
              <div className="doghike-empty-state">
                <BookOpen className="doghike-empty-icon" />
                <p className="text-slate-600 font-medium mb-1">Noch keine Touren von Freunden</p>
                <p className="text-slate-400 text-sm">Deine Freunde haben noch keine Wanderungen geteilt.</p>
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
