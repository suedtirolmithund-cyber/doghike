import { useEffect, useState } from "react";
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
  disableWebPushSubscription,
  ensureWebPushSubscription,
  getExistingPushSubscription,
  hasWebPushConfig,
  notificationPermission,
  requestNotificationPermission,
  webPushSupported,
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
        color: "text-brand-700 bg-brand-50 border-brand-200",
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
        ? "text-brand-300 bg-brand-50 border-brand-100"
        : approved
          ? "text-brand-400 bg-brand-50 border-brand-200"
          : "text-brand-400 bg-brand-50 border-brand-100",
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
          color: "text-slate-600 bg-brand-50/70 border-brand-100",
          title: `${profile?.full_name || profile?.username || "Freund"} hat "${entry.title}" geteilt`,
          time: entry.created_at,
          link: `${createPageUrl("JournalDetail")}?id=${entry.id}`,
        });
      });
    }
  }

  return results.sort((a, b) => new Date(b.time) - new Date(a.time));
}

export default function Notifications() {
  const { user, isAuthenticated } = useAuth();
  const [permission, setPermission] = useState(() => notificationPermission());
  const [subscriptionEnabled, setSubscriptionEnabled] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function syncSubscriptionState() {
      if (!user?.id || !webPushSupported()) {
        if (!cancelled) setSubscriptionEnabled(false);
        return;
      }

      const subscription = await getExistingPushSubscription();
      if (!cancelled) setSubscriptionEnabled(Boolean(subscription));
    }

    syncSubscriptionState();

    return () => {
      cancelled = true;
    };
  }, [user?.id, permission]);

  const handleActivate = async () => {
    try {
      setSubscriptionLoading(true);
      const granted = await requestNotificationPermission();
      setPermission(granted ? "granted" : "denied");
      if (!granted) return;

      if (!user?.id) {
        toast.error("Melde dich an, dann k?nnen Hinweise ankommen.");
        return;
      }

      await ensureWebPushSubscription(user.id);
      setSubscriptionEnabled(true);
      toast.success("Hinweise sind jetzt an.");
    } catch {
      toast.error("Hinweise lassen sich gerade nicht aktivieren.");
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const handleDeactivate = async () => {
    try {
      setSubscriptionLoading(true);
      await disableWebPushSubscription();
      setSubscriptionEnabled(false);
      toast.success("Hinweise sind jetzt aus.");
    } catch {
      toast.error("Hinweise lassen sich gerade nicht deaktivieren.");
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: () => loadNotifications(user.id),
    enabled: !!user?.id,
    staleTime: 2 * 60_000,
    refetchOnWindowFocus: false,
    refetchInterval: 10 * 60_000,
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-50/20 flex items-center justify-center px-4">
        <div className="doghike-glass-card p-8 text-center">
          <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium mb-4">Bitte anmelden</p>
          <Link to={createPageUrl("Login")} className="text-brand-400 underline text-sm">
            Zur Anmeldung
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-50/20 pb-24 md:pb-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 md:py-10">
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="doghike-page-header">
          <div className="doghike-page-icon">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h1 className="doghike-page-title">
              Benachrichtigungen
            </h1>
            {notifications.length > 0 && (
              <p className="doghike-page-subtitle">
                {notifications.length} Benachrichtigung{notifications.length !== 1 ? "en" : ""}
              </p>
            )}
          </div>
        </motion.div>

        {webPushSupported() && hasWebPushConfig() && permission !== "granted" && permission !== "denied" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="doghike-glass-card mb-5 flex items-center gap-3 p-4"
          >
            <Bell className="w-5 h-5 text-brand-400 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-brand-700">Web-Push aktivieren</p>
              <p className="text-xs text-brand-400">Erhalte Hinweise auch dann, wenn DogTrails gerade nicht geöffnet ist.</p>
            </div>
            <Button
              size="sm"
              onClick={handleActivate}
              disabled={subscriptionLoading}
              className="bg-brand-400 hover:bg-brand-600 text-white shrink-0"
            >
              {subscriptionLoading ? "Aktiviert..." : "Aktivieren"}
            </Button>
          </motion.div>
        )}

        {webPushSupported() && hasWebPushConfig() && permission === "granted" && subscriptionEnabled && (
          <div className="doghike-glass-card mb-5 flex items-center gap-3 p-4">
            <CheckCircle2 className="w-5 h-5 text-brand-500 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-700">Web-Push ist aktiv</p>
              <p className="text-xs text-slate-500">Freundschaftsanfragen und Bestätigungen können jetzt auch bei geschlossener App ankommen.</p>
            </div>
            <Button size="sm" variant="outline" disabled={subscriptionLoading} onClick={handleDeactivate} className="shrink-0">
              Deaktivieren
            </Button>
          </div>
        )}

        {webPushSupported() && hasWebPushConfig() && permission === "denied" && (
          <div className="doghike-glass-card mb-5 flex items-center gap-3 p-4">
            <BellOff className="w-5 h-5 text-slate-400 shrink-0" />
            <p className="text-xs text-slate-500">
              Benachrichtigungen sind blockiert. Erlaube sie in den Browser-Einstellungen, wenn du Hinweise zu Anfragen und Freigaben erhalten möchtest.
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="doghike-empty-state">
            <Bell className="doghike-empty-icon" />
            <h3 className="text-lg font-medium text-slate-700 mb-1">Alles auf dem neuesten Stand</h3>
            <p className="text-slate-400 text-sm">Sobald etwas Neues passiert, erscheint es hier.</p>
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
                    className="doghike-glass-card-hover flex items-start gap-4 p-4"
                  >
                    <div className={`rounded-xl p-2 shrink-0 ${notification.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 leading-snug">{notification.title}</p>
                      <p className="text-xs text-slate-400 mt-1">
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
