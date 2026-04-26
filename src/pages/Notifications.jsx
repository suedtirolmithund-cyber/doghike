import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  UserPlus,
  CheckCircle2,
  XCircle,
  BookOpen,
  Loader2,
  BellOff,
  Clock3,
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  notificationsSupported,
  notificationPermission,
  requestNotificationPermission,
} from "@/lib/browserNotifications";

async function loadNotifications(userId) {
  const results = [];

  const { data: incoming } = await supabase
    .from("friendships")
    .select("id, requester_id, created_at")
    .eq("receiver_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (incoming?.length) {
    const requesterIds = incoming.map((friendship) => friendship.requester_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, username, avatar_url")
      .in("user_id", requesterIds);

    const profileMap = Object.fromEntries((profiles ?? []).map((profile) => [profile.user_id, profile]));

    incoming.forEach((friendship) => {
      const profile = profileMap[friendship.requester_id];

      results.push({
        id: `fr-${friendship.id}`,
        type: "friend_request",
        icon: UserPlus,
        color: "text-blue-600 bg-blue-50 border-blue-200",
        title: `${profile?.full_name || profile?.username || "Jemand"} möchte dein Freund sein`,
        time: friendship.created_at,
        link: createPageUrl("Friends"),
      });
    });
  }

  const { data: myEntries } = await supabase
    .from("journal_entries")
    .select("id, title, status, visibility, updated_at, created_at, rejection_reason")
    .eq("user_id", userId)
    .eq("visibility", "public")
    .in("status", ["pending", "approved", "rejected"])
    .order("updated_at", { ascending: false })
    .limit(10);

  (myEntries ?? []).forEach((entry) => {
    const pending = entry.status === "pending";
    const approved = entry.status === "approved";

    results.push({
      id: `je-${entry.id}`,
      type: pending ? "pending" : approved ? "approved" : "rejected",
      icon: pending ? Clock3 : approved ? CheckCircle2 : XCircle,
      color: pending
        ? "text-amber-600 bg-amber-50 border-amber-200"
        : approved
          ? "text-brand-400 bg-brand-50 border-brand-200"
          : "text-red-600 bg-red-50 border-red-200",
      title: pending
        ? `"${entry.title}" wartet auf die Admin-Prüfung`
        : approved
          ? `"${entry.title}" wurde genehmigt und ist jetzt öffentlich sichtbar`
          : entry.rejection_reason?.trim()
            ? `"${entry.title}" wurde abgelehnt: ${entry.rejection_reason.trim()}`
            : `"${entry.title}" wurde abgelehnt`,
      time: pending ? (entry.created_at || entry.updated_at) : entry.updated_at,
      link: createPageUrl("Journal"),
    });
  });

  const { data: acceptedFriendships } = await supabase
    .from("friendships")
    .select("requester_id, receiver_id")
    .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
    .eq("status", "accepted");

  const friendIds = (acceptedFriendships ?? []).map((friendship) =>
    friendship.requester_id === userId ? friendship.receiver_id : friendship.requester_id
  );

  if (friendIds.length > 0) {
    const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const { data: friendEntries } = await supabase
      .from("journal_entries")
      .select("id, title, user_id, created_at")
      .in("user_id", friendIds)
      .or("and(visibility.eq.friends,status.in.(approved,draft)),and(visibility.eq.public,status.eq.approved)")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(5);

    if (friendEntries?.length) {
      const profileIds = [...new Set(friendEntries.map((entry) => entry.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, username")
        .in("user_id", profileIds);

      const profileMap = Object.fromEntries((profiles ?? []).map((profile) => [profile.user_id, profile]));

      friendEntries.forEach((entry) => {
        const profile = profileMap[entry.user_id];

        results.push({
          id: `fe-${entry.id}`,
          type: "friend_entry",
          icon: BookOpen,
          color: "text-stone-600 bg-stone-50 border-stone-200",
          title: `${profile?.full_name || profile?.username || "Freund"} hat "${entry.title}" geteilt`,
          time: entry.created_at,
          link: createPageUrl("Friends"),
        });
      });
    }
  }

  return results.sort((a, b) => new Date(b.time) - new Date(a.time));
}

export default function Notifications() {
  const { user, isAuthenticated } = useAuth();
  const [permission, setPermission] = useState(() => notificationPermission());

  const handleActivate = async () => {
    try {
      const granted = await requestNotificationPermission();
      setPermission(granted ? "granted" : "denied");
    } catch {
      toast.error("Benachrichtigungen konnten gerade nicht aktiviert werden. Bitte versuche es noch einmal.");
    }
  };

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: () => loadNotifications(user.id),
    enabled: !!user?.id,
    staleTime: 2 * 60_000,
    refetchInterval: 5 * 60_000,
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-slate-50 flex items-center justify-center px-4">
        <div className="text-center">
          <Bell className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <p className="text-stone-600 font-medium mb-4">Bitte anmelden</p>
          <Link to={createPageUrl("Login")} className="text-brand-400 underline text-sm">
            Zur Anmeldung
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-slate-50 pb-24 md:pb-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 md:py-10">
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-3">
            <Bell className="w-7 h-7" />
            Benachrichtigungen
          </h1>
          {notifications.length > 0 && (
            <p className="text-stone-500 text-sm mt-1">
              {notifications.length} Benachrichtigung{notifications.length !== 1 ? "en" : ""}
            </p>
          )}
        </motion.div>

        {notificationsSupported() && permission !== "granted" && permission !== "denied" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-brand-50 border border-brand-200 rounded-2xl p-4 mb-5 flex items-center gap-3"
          >
            <Bell className="w-5 h-5 text-brand-400 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-brand-700">Push-Benachrichtigungen aktivieren</p>
              <p className="text-xs text-brand-400">Erhalte Benachrichtigungen bei neuen Freundschaftsanfragen.</p>
            </div>
            <Button
              size="sm"
              onClick={handleActivate}
              className="bg-brand-400 hover:bg-brand-600 text-white shrink-0"
            >
              Aktivieren
            </Button>
          </motion.div>
        )}

        {notificationsSupported() && permission === "denied" && (
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 mb-5 flex items-center gap-3">
            <BellOff className="w-5 h-5 text-stone-400 shrink-0" />
            <p className="text-xs text-stone-500">
              Benachrichtigungen sind blockiert. Bitte in den Browser-Einstellungen erlauben.
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-stone-400 animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-stone-200/50">
            <Bell className="w-14 h-14 text-stone-200 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-stone-700 mb-1">Alles auf dem neuesten Stand</h3>
            <p className="text-stone-400 text-sm">Keine neuen Benachrichtigungen</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {notifications.map((notification, index) => {
                const Icon = notification.icon;
                const content = (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className={`bg-white rounded-2xl border p-4 flex items-start gap-4 shadow-sm ${notification.color}`}
                  >
                    <div className={`rounded-xl p-2 shrink-0 ${notification.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-800 leading-snug">{notification.title}</p>
                      <p className="text-xs text-stone-400 mt-1">
                        {format(new Date(notification.time), "d. MMM, HH:mm", { locale: de })}
                      </p>
                    </div>
                  </motion.div>
                );

                return notification.link ? (
                  <Link key={notification.id} to={notification.link}>
                    {content}
                  </Link>
                ) : (
                  content
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
