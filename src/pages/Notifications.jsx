import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
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
import { loadNotifications, markNotificationsSeen } from "@/lib/notificationsApi";
import {
  disableWebPushSubscription,
  ensureWebPushSubscription,
  getExistingPushSubscription,
  hasWebPushConfig,
  notificationPermission,
  requestNotificationPermission,
  webPushSupported,
} from "@/lib/browserNotifications";

const NOTIFICATION_META = {
  friend_request: {
    icon: UserPlus,
    color: "text-brand-700 bg-brand-50 border-brand-200",
  },
  pending: {
    icon: Clock3,
    color: "text-brand-300 bg-brand-50 border-brand-100",
  },
  approved: {
    icon: CheckCircle2,
    color: "text-brand-400 bg-brand-50 border-brand-200",
  },
  rejected: {
    icon: XCircle,
    color: "text-brand-400 bg-brand-50 border-brand-100",
  },
  friend_entry: {
    icon: BookOpen,
    color: "text-slate-600 bg-brand-50/70 border-brand-100",
  },
};

export default function Notifications() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
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

      try {
        const subscription = await getExistingPushSubscription();
        if (!cancelled) setSubscriptionEnabled(Boolean(subscription));
      } catch (error) {
        console.error("[Notifications] Subscription-Status fehlgeschlagen:", error);
        if (!cancelled) setSubscriptionEnabled(false);
      }
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
        toast.error("Melde dich an, dann können Hinweise ankommen.");
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

  const {
    data: notifications = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: () => loadNotifications(user.id),
    enabled: !!user?.id,
    staleTime: 2 * 60_000,
    refetchOnWindowFocus: false,
    refetchInterval: 10 * 60_000,
    retry: 1,
  });

  useEffect(() => {
    if (!user?.id || isLoading || isError) return;
    markNotificationsSeen(user.id);
    queryClient.invalidateQueries({ queryKey: ["notificationsUnread", user.id] });
  }, [user?.id, isLoading, isError, notifications, queryClient]);

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-white to-brand-50/20 px-4">
        <div className="doghike-glass-card p-8 text-center">
          <Bell className="mx-auto mb-3 h-12 w-12 text-slate-300" />
          <p className="mb-4 font-medium text-slate-600">Bitte anmelden</p>
          <Link to={createPageUrl("Login")} className="text-sm text-brand-400 underline">
            Zur Anmeldung
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-50/20 pb-24 md:pb-8">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 md:py-10">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="doghike-page-header"
        >
          <div className="doghike-page-icon">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h1 className="doghike-page-title">Benachrichtigungen</h1>
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
            <Bell className="h-5 w-5 shrink-0 text-brand-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-brand-700">Web-Push aktivieren</p>
              <p className="text-xs text-brand-400">
                Erhalte Hinweise auch dann, wenn DogTrails gerade nicht geöffnet ist.
              </p>
            </div>
            <Button
              size="sm"
              onClick={handleActivate}
              disabled={subscriptionLoading}
              className="shrink-0 bg-brand-400 text-white hover:bg-brand-600"
            >
              {subscriptionLoading ? "Aktiviert..." : "Aktivieren"}
            </Button>
          </motion.div>
        )}

        {webPushSupported() && hasWebPushConfig() && permission === "granted" && subscriptionEnabled && (
          <div className="doghike-glass-card mb-5 flex items-center gap-3 p-4">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-500" />
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-700">Web-Push ist aktiv</p>
              <p className="text-xs text-slate-500">
                Freundschaftsanfragen und Bestätigungen können jetzt auch bei geschlossener App ankommen.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={subscriptionLoading}
              onClick={handleDeactivate}
              className="shrink-0"
            >
              Deaktivieren
            </Button>
          </div>
        )}

        {webPushSupported() && hasWebPushConfig() && permission === "denied" && (
          <div className="doghike-glass-card mb-5 flex items-center gap-3 p-4">
            <BellOff className="h-5 w-5 shrink-0 text-slate-400" />
            <p className="text-xs text-slate-500">
              Benachrichtigungen sind blockiert. Erlaube sie in den Browser-Einstellungen, wenn du Hinweise zu Anfragen und Freigaben erhalten möchtest.
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : isError ? (
          <div className="doghike-glass-card p-5 text-center">
            <BellOff className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <h3 className="doghike-card-title mb-1">Benachrichtigungen laden gerade nicht</h3>
            <p className="text-sm text-slate-500">
              Versuch es kurz nochmal. Deine Hinweise bleiben erhalten und kommen später wieder rein.
            </p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="doghike-empty-state">
            <Bell className="doghike-empty-icon" />
            <h3 className="doghike-empty-title mb-1">Alles auf dem neuesten Stand</h3>
            <p className="text-sm text-slate-400">Sobald etwas Neues passiert, erscheint es hier.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {notifications.map((notification, index) => {
                const presentation = NOTIFICATION_META[notification.type] || NOTIFICATION_META.friend_entry;
                const Icon = presentation.icon;
                const content = (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="doghike-glass-card-hover flex items-start gap-4 p-4"
                  >
                    <div className={`shrink-0 rounded-xl p-2 ${presentation.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-snug text-slate-900">{notification.title}</p>
                      <p className="mt-1 text-xs text-slate-400">
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
