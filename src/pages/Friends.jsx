import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Users,
  Search,
  UserPlus,
  UserMinus,
  Check,
  X,
  Loader2,
  LogIn,
  Clock,
  Star,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { showFriendFeedback, showSavedFeedback, showSentFeedback } from "@/lib/feedbackToast";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { useAuth } from "@/lib/AuthContext";
import { TOUR_ICONS } from "@/lib/difficultyConfig";
import {
  getFriendships,
  getFriendIds,
  getFriendFeedEntries,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  searchProfiles,
} from "@/lib/friendsApi";

const DOG_AVATAR_EMOJIS = ["🐕", "🐩", "🦮", "🐕‍🦺", "🐶"];

function getDogAvatarEmoji(seed) {
  const value = String(seed || "dogtrails");
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return DOG_AVATAR_EMOJIS[hash % DOG_AVATAR_EMOJIS.length];
}

function DogAvatarFallback({ seed, size = "md" }) {
  const isSmall = size === "sm";
  return (
    <div
      className={`flex h-full w-full items-center justify-center rounded-full border border-brand-100 bg-brand-50 text-center shadow-inner ${
        isSmall ? "text-lg" : "text-2xl"
      }`}
      aria-hidden="true"
    >
      {getDogAvatarEmoji(seed)}
    </div>
  );
}

function FeedCard({ entry }) {
  const profile = entry.profile;
  const authorName = profile?.full_name || profile?.username || "Jemand";

  return (
    <Link to={`${createPageUrl("JournalDetail")}?id=${entry.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="doghike-glass-card-hover cursor-pointer overflow-hidden"
      >
        {entry.photos?.[0] && (
          <img src={entry.photos[0]} alt={entry.title} className="h-44 w-full object-cover" />
        )}

        <div className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-brand-100/80">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <DogAvatarFallback
                  seed={profile?.user_id || entry.user_id || authorName}
                  size="sm"
                />
              )}
            </div>

            <span className="text-sm text-slate-600">
              <span className="font-medium text-slate-900">{authorName}</span> war wandern
            </span>

            <span className="ml-auto text-xs text-slate-400">
              {format(new Date(entry.date || entry.created_at), "d. MMM", { locale: de })}
            </span>
          </div>

          <h3 className="mb-1 font-semibold text-slate-900">{entry.title}</h3>
          {entry.location && <p className="mb-2 text-xs text-slate-500">Ort: {entry.location}</p>}

          <div className="mb-2 flex flex-wrap gap-3 text-xs text-slate-500">
            {entry.distance_km && (
              <span className="flex items-center gap-1">
                <span className="text-sm leading-none">{TOUR_ICONS.distance}</span>
                {entry.distance_km} km
              </span>
            )}
            {entry.elevation_m && (
              <span className="flex items-center gap-1">
                <span className="text-sm leading-none">{TOUR_ICONS.elevation}</span>
                {entry.elevation_m} Hm
              </span>
            )}
            {entry.rating > 0 && (
              <span className="flex items-center gap-1 text-brand-500">
                <Star className="h-3 w-3 fill-brand-100" />
                {entry.rating}/5
              </span>
            )}
          </div>

          {entry.description && (
            <p className="line-clamp-2 text-sm text-slate-500">{entry.description}</p>
          )}

          {entry.dog_suitable && (
            <Badge
              variant="secondary"
              className="mt-2 border-brand-200 bg-brand-50 text-xs text-brand-600"
            >
              Hundefreundlich
            </Badge>
          )}
        </div>
      </motion.div>
    </Link>
  );
}

function Avatar({ profile, size = "md" }) {
  const classes = size === "sm" ? "h-8 w-8" : "h-11 w-11";
  const seed = profile?.user_id || profile?.username || profile?.full_name;

  return (
    <div className={`${classes} shrink-0 overflow-hidden rounded-full bg-brand-100/80`}>
      {profile?.avatar_url ? (
        <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
      ) : (
        <DogAvatarFallback seed={seed} size={size} />
      )}
    </div>
  );
}

function ProfileName({ profile }) {
  return (
    <div>
      <p className="text-sm font-semibold text-slate-900">
        {profile?.full_name || profile?.username || "Unbekannt"}
      </p>
      {profile?.username && <p className="text-xs text-slate-400">@{profile.username}</p>}
    </div>
  );
}

export default function Friends() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
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

  const accepted = friendships.filter((friendship) => friendship.status === "accepted");
  const incoming = friendships.filter(
    (friendship) => friendship.status === "pending" && friendship.receiver_id === user?.id,
  );
  const outgoing = friendships.filter(
    (friendship) => friendship.status === "pending" && friendship.requester_id === user?.id,
  );

  const defaultTab = incoming.length > 0 ? "requests" : "friends";
  const activeTab = searchParams.get("tab") || defaultTab;
  const selectedFriendId = searchParams.get("friend") || "";

  const allIds = [...new Set(friendships.flatMap((friendship) => [friendship.requester_id, friendship.receiver_id]))];
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

      return Object.fromEntries((data ?? []).map((profile) => [profile.user_id, profile]));
    },
    enabled: stableAllIds.length > 0,
  });

  const friendOf = (friendship) =>
    profileMap[friendship.requester_id === user?.id ? friendship.receiver_id : friendship.requester_id];

  const selectedFriendProfile = selectedFriendId ? profileMap[selectedFriendId] : null;

  const filteredFeedEntries = useMemo(() => {
    if (!selectedFriendId) return feedEntries;
    return feedEntries.filter((entry) => entry.user_id === selectedFriendId);
  }, [feedEntries, selectedFriendId]);

  const updatePageState = (nextTab, nextFriendId = "") => {
    const nextParams = new URLSearchParams(searchParams);

    if (nextTab && nextTab !== defaultTab) {
      nextParams.set("tab", nextTab);
    } else {
      nextParams.delete("tab");
    }

    if (nextFriendId) {
      nextParams.set("friend", nextFriendId);
    } else {
      nextParams.delete("friend");
    }

    setSearchParams(nextParams, { replace: true });
  };

  const openFriendFeed = (friendId) => {
    if (!friendId) return;
    updatePageState("feed", friendId);
    setFeedVisible(10);
  };

  const clearFriendFeedFilter = () => {
    updatePageState("feed");
    setFeedVisible(10);
  };

  const refreshFriendData = () => {
    queryClient.invalidateQueries({ queryKey: ["friendships", user?.id] });
    queryClient.invalidateQueries({ queryKey: ["friendIds", user?.id] });
    queryClient.invalidateQueries({ queryKey: ["friendFeed"] });
    queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
  };

  const sendMutation = useMutation({
    mutationFn: (receiverId) => sendFriendRequest(user.id, receiverId),
    onSuccess: () => {
      refreshFriendData();
      showSentFeedback("Anfrage gesendet", "Die Freundschaftsanfrage ist jetzt raus.");
    },
    onError: () => toast.error("Die Anfrage wollte gerade nicht raus."),
  });

  const acceptMutation = useMutation({
    mutationFn: acceptFriendRequest,
    onSuccess: () => {
      refreshFriendData();
      showFriendFeedback("Freund hinzugefügt", "Ihr könnt jetzt Touren teilen.");
    },
    onError: () => toast.error("Das Annehmen hat gerade nicht geklappt."),
  });

  const rejectMutation = useMutation({
    mutationFn: rejectFriendRequest,
    onSuccess: () => {
      refreshFriendData();
      showSavedFeedback("Anfrage abgelehnt", "Die Anfrage wurde sauber abgelehnt.");
    },
    onError: () => toast.error("Das Ablehnen hat gerade nicht geklappt."),
  });

  const removeMutation = useMutation({
    mutationFn: removeFriend,
    onSuccess: () => {
      refreshFriendData();
      showSavedFeedback("Kontakt entfernt", "Die Verbindung wurde gelöst.");
    },
    onError: () => toast.error("Das Entfernen hat gerade nicht geklappt."),
  });

  const handleSearch = async (event) => {
    event?.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const results = await searchProfiles(searchQuery, user.id);
      setSearchResults(results);
      if (results.length === 0) {
        toast.info("Niemand gefunden. Prüfe den Namen noch einmal.");
      }
    } catch {
      toast.error("Die Suche hängt gerade. Versuch es gleich noch einmal.");
    } finally {
      setSearching(false);
    }
  };

  const existingFriendship = (targetId) =>
    friendships.find(
      (friendship) =>
        (friendship.requester_id === user?.id && friendship.receiver_id === targetId) ||
        (friendship.receiver_id === user?.id && friendship.requester_id === targetId),
    );

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <Users className="mx-auto mb-4 h-12 w-12 text-slate-300" />
          <p className="mb-4 font-medium text-slate-600">Bitte melde dich an.</p>
          <Link to={createPageUrl("Login")}>
            <Button className="bg-brand-400 hover:bg-brand-600">
              <LogIn className="mr-2 h-4 w-4" /> Anmelden
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-50/10 pb-24 md:pb-8">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 md:py-10">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="doghike-page-header"
        >
          <div className="doghike-page-icon">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="doghike-page-title">Freunde</h1>
            <p className="doghike-page-subtitle">
              {accepted.length} Freund{accepted.length !== 1 ? "e" : ""}
              {incoming.length > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 font-medium text-brand-300">
                  · {incoming.length} offene Anfrage{incoming.length !== 1 ? "n" : ""}
                </span>
              )}
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="doghike-glass-card mb-5 p-3.5 sm:p-4"
        >
          <h2 className="mb-2.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Search className="h-4 w-4" /> Freunde suchen
          </h2>

          <form onSubmit={handleSearch} className="grid grid-cols-[1fr_auto] gap-2">
            <Input
              value={searchQuery}
              onChange={(event) => {
                const value = event.target.value;
                setSearchQuery(value);
                if (!value.trim()) {
                  setSearchResults([]);
                }
              }}
              placeholder="Username oder Name suchen..."
              className="h-11 rounded-xl text-sm"
            />

            <Button
              type="submit"
              disabled={searching}
              className="h-11 w-12 shrink-0 rounded-xl bg-brand-400 px-0 hover:bg-brand-600"
            >
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </form>

          <AnimatePresence>
            {searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
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
                    <div
                      key={profile.user_id}
                      className="flex items-center gap-3 rounded-xl p-2 hover:bg-brand-50/50"
                    >
                      <Avatar profile={profile} />
                      <ProfileName profile={profile} />

                      <div className="ml-auto shrink-0">
                        {!existing || existing?.status === "rejected" ? (
                          <Button
                            size="sm"
                            onClick={() => sendMutation.mutate(profile.user_id)}
                            disabled={sendMutation.isPending}
                            className="bg-brand-400 hover:bg-brand-600"
                          >
                            <UserPlus className="mr-1 h-3.5 w-3.5" /> Anfrage senden
                          </Button>
                        ) : isIncomingPending ? (
                          <span className="flex items-center gap-1 text-xs font-medium text-brand-300">
                            <Clock className="h-3.5 w-3.5" /> Offene Anfrage
                          </span>
                        ) : isOutgoingPending ? (
                          <span className="flex items-center gap-1 text-xs font-medium text-brand-300">
                            <Clock className="h-3.5 w-3.5" /> Gesendet
                          </span>
                        ) : isAccepted ? (
                          <span className="flex items-center gap-1 text-xs font-medium text-brand-400">
                            <Check className="h-3.5 w-3.5" /> Freund
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => sendMutation.mutate(profile.user_id)}
                            disabled={sendMutation.isPending}
                            className="bg-brand-400 hover:bg-brand-600"
                          >
                            <UserPlus className="mr-1 h-3.5 w-3.5" /> Anfrage senden
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}

            {searchResults.length === 0 && searchQuery && !searching && (
              <p className="mt-2 text-center text-xs text-slate-400">
                Keine Nutzer gefunden für „{searchQuery}“
              </p>
            )}
          </AnimatePresence>
        </motion.div>

        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            updatePageState(value, value === "feed" ? selectedFriendId : "");
            if (value !== "feed") {
              setFeedVisible(10);
            }
          }}
        >
          <TabsList className="mb-4 grid h-auto w-full grid-cols-2 gap-1 border border-white/70 bg-white/65 p-1 backdrop-blur-xl sm:grid-cols-4">
            <TabsTrigger value="friends" className="h-11 px-2 text-sm">
              <span className="sm:hidden">Freunde</span>
              <span className="hidden sm:inline">Freunde ({accepted.length})</span>
            </TabsTrigger>

            <TabsTrigger value="requests" className="relative h-11 px-2 text-sm">
              <span className="sm:hidden">Anfragen</span>
              <span className="hidden sm:inline">Offene Anfragen</span>
              {incoming.length > 0 && (
                <span className="ml-1.5 rounded-full bg-brand-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {incoming.length}
                </span>
              )}
            </TabsTrigger>

            <TabsTrigger value="sent" className="h-11 px-2 text-sm">
              <span className="sm:hidden">Gesendet</span>
              <span className="hidden sm:inline">Gesendet ({outgoing.length})</span>
            </TabsTrigger>

            <TabsTrigger value="feed" className="h-11 px-2 text-sm">
              <span className="sm:hidden">Touren</span>
              <span className="hidden sm:inline">Touren von Freunden</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="friends">
            {isLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : accepted.length > 0 ? (
              <div className="space-y-2">
                {accepted.map((friendship) => {
                  const profile = friendOf(friendship);

                  return (
                    <motion.div
                      key={friendship.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      role="button"
                      tabIndex={0}
                      onClick={() => openFriendFeed(profile?.user_id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          openFriendFeed(profile?.user_id);
                        }
                      }}
                      className="doghike-glass-card flex cursor-pointer items-center gap-3 rounded-2xl px-3.5 py-3.5 transition hover:border-brand-200 hover:bg-brand-50/40"
                    >
                      <Avatar profile={profile} />

                      <div className="min-w-0 flex-1">
                        <ProfileName profile={profile} />
                      </div>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(event) => {
                          event.stopPropagation();
                          removeMutation.mutate(friendship.id);
                        }}
                        disabled={removeMutation.isPending}
                        className="ml-auto h-10 w-10 rounded-xl p-0 text-slate-400 hover:bg-brand-50 hover:text-brand-500 md:h-9 md:w-9"
                      >
                        <UserMinus className="h-3.5 w-3.5" />
                      </Button>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="doghike-empty-state">
                <Users className="doghike-empty-icon" />
                <p className="mb-1 font-medium text-slate-600">Noch niemand auf deiner Liste</p>
                <p className="text-sm text-slate-400">
                  Such nach Menschen, mit denen du Touren teilen willst.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="requests">
            {incoming.length > 0 ? (
              <div className="space-y-2">
                {incoming.map((friendship) => {
                  const profile =
                    profileMap[friendship.requester_id] ?? {
                      user_id: friendship.requester_id,
                      full_name: "Nutzer",
                      username: null,
                      avatar_url: null,
                    };

                  return (
                    <motion.div
                      key={friendship.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-3 rounded-xl border border-brand-100 bg-brand-50/70 p-3 shadow-sm backdrop-blur-xl"
                    >
                      <Avatar profile={profile} />
                      <div className="min-w-0 flex-1">
                        <ProfileName profile={profile} />
                        <p className="text-xs text-brand-300">Möchte dein Freund sein</p>
                      </div>

                      <div className="flex shrink-0 gap-2">
                        <Button
                          size="sm"
                          onClick={() => acceptMutation.mutate(friendship.id)}
                          disabled={acceptMutation.isPending}
                          className="bg-brand-400 hover:bg-brand-600"
                        >
                          <Check className="mr-1 h-3.5 w-3.5" /> Annehmen
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => rejectMutation.mutate(friendship.id)}
                          disabled={rejectMutation.isPending}
                          className="border-brand-100 text-brand-500 hover:bg-brand-50"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="doghike-empty-state">
                <Clock className="doghike-empty-icon" />
                <p className="mb-1 font-medium text-slate-600">Gerade wartet niemand</p>
                <p className="text-sm text-slate-400">
                  Wenn jemand anklopft, siehst du es hier.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="sent">
            {outgoing.length > 0 ? (
              <div className="space-y-2">
                {outgoing.map((friendship) => {
                  const profile = profileMap[friendship.receiver_id];

                  return (
                    <motion.div
                      key={friendship.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="doghike-glass-card flex items-center gap-3 rounded-2xl px-3.5 py-3.5"
                    >
                      <Avatar profile={profile} />

                      <div className="min-w-0 flex-1">
                        <ProfileName profile={profile} />
                        <p className="flex items-center gap-1 text-xs text-slate-400">
                          <Clock className="h-3 w-3" /> Gesendet
                        </p>
                      </div>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeMutation.mutate(friendship.id)}
                        className="ml-auto h-10 w-10 rounded-xl p-0 text-slate-400 hover:text-brand-500 md:h-9 md:w-9"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="doghike-empty-state">
                <Clock className="doghike-empty-icon" />
                <p className="mb-1 font-medium text-slate-600">Keine Anfrage unterwegs</p>
                <p className="text-sm text-slate-400">
                  Such nach einem Namen. Dann geht die Anfrage raus.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="feed">
            {feedLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : friendIds.length === 0 ? (
              <div className="doghike-empty-state">
                <Users className="doghike-empty-icon" />
                <p className="mb-1 font-medium text-slate-600">Noch niemand auf deiner Liste</p>
                <p className="text-sm text-slate-400">
                  Füge Freunde hinzu, um ihre Wanderungen zu sehen.
                </p>
              </div>
            ) : feedEntries.length === 0 ? (
              <div className="doghike-empty-state">
                <BookOpen className="doghike-empty-icon" />
                <p className="mb-1 font-medium text-slate-600">Noch keine geteilten Wege</p>
                <p className="text-sm text-slate-400">
                  Wenn deine Freunde losziehen und teilen, erscheint es hier.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedFriendProfile && (
                  <div className="doghike-glass-card flex flex-col gap-3 rounded-2xl px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar profile={selectedFriendProfile} />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          Touren von {selectedFriendProfile.full_name || selectedFriendProfile.username || "deinem Freund"}
                        </p>
                        <p className="text-xs text-slate-500">
                          Hier siehst du nur die geteilten Einträge dieses Profils.
                        </p>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={clearFriendFeedFilter}
                      className="rounded-xl border-brand-100 text-brand-500 hover:bg-brand-50"
                    >
                      Alle Freundes-Touren
                    </Button>
                  </div>
                )}

                {filteredFeedEntries.length === 0 ? (
                  <div className="doghike-empty-state">
                    <BookOpen className="doghike-empty-icon" />
                    <p className="mb-1 font-medium text-slate-600">
                      Noch keine geteilten Wege von diesem Freund
                    </p>
                    <p className="text-sm text-slate-400">
                      Sobald etwas geteilt wird, erscheint es genau hier.
                    </p>
                  </div>
                ) : (
                  filteredFeedEntries.slice(0, feedVisible).map((entry) => (
                    <FeedCard key={entry.id} entry={entry} />
                  ))
                )}

                {feedVisible < filteredFeedEntries.length && (
                  <div className="pt-2 text-center">
                    <button
                      onClick={() => setFeedVisible((value) => value + 10)}
                      className="rounded-xl px-4 py-2 text-sm font-medium text-brand-400 transition-colors hover:bg-brand-50 hover:text-brand-600"
                    >
                      {filteredFeedEntries.length - feedVisible} weitere laden ↓
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
