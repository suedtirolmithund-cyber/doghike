import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Bell, Check, Trash2, UserPlus, Users, MessageCircle, Star, Heart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export default function Notifications() {
  const [filter, setFilter] = useState("all");
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me(),
  });

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => { const r = await base44.entities.Notification.filter({ recipient_email: user?.email }, "-created_date", 100); return Array.isArray(r) ? r : []; },
    enabled: !!user?.email
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const unreadNotifications = notifications.filter(n => !n.is_read);
      await Promise.all(
        unreadNotifications.map(n => base44.entities.Notification.update(n.id, { is_read: true }))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  });

  const getNotificationIcon = (type) => {
    switch (type) {
      case "follow_request":
        return <UserPlus className="w-5 h-5 text-blue-600" />;
      case "follow_accepted":
        return <Users className="w-5 h-5 text-green-600" />;
      case "hike_comment":
      case "route_comment":
        return <MessageCircle className="w-5 h-5 text-purple-600" />;
      case "hike_rating":
        return <Star className="w-5 h-5 text-amber-600" />;
      case "route_like":
        return <Heart className="w-5 h-5 text-red-600" />;
      default:
        return <Bell className="w-5 h-5 text-stone-600" />;
    }
  };

  const getNotificationLink = (notification) => {
    if (notification.type === "follow_request" || notification.type === "follow_accepted") {
      return createPageUrl("Feed");
    }
    if (notification.type === "hike_comment" || notification.type === "hike_rating") {
      return createPageUrl("HikeDetail") + `?id=${notification.related_id}`;
    }
    if (notification.type === "route_comment" || notification.type === "route_like") {
      return createPageUrl("RouteDetail") + `?id=${notification.related_id}`;
    }
    return null;
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === "unread") return !n.is_read;
    if (filter === "read") return n.is_read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-800" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-3">
                <Bell className="w-7 h-7 md:w-8 md:h-8" />
                Benachrichtigungen
              </h1>
              {unreadCount > 0 && (
                <p className="text-sm text-stone-600 mt-1">{unreadCount} ungelesene Benachrichtigungen</p>
              )}
            </div>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
              >
                {markAllAsReadMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4 md:mr-2" />
                    <span className="hidden md:inline">Alle als gelesen markieren</span>
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Filter */}
          <div className="flex gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
              className={filter === "all" ? "bg-slate-800" : ""}
            >
              Alle ({notifications.length})
            </Button>
            <Button
              variant={filter === "unread" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("unread")}
              className={filter === "unread" ? "bg-slate-800" : ""}
            >
              Ungelesen ({unreadCount})
            </Button>
            <Button
              variant={filter === "read" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("read")}
              className={filter === "read" ? "bg-slate-800" : ""}
            >
              Gelesen ({notifications.length - unreadCount})
            </Button>
          </div>
        </div>

        {/* Notifications List */}
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-20">
            <Bell className="w-16 h-16 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-500 text-lg">
              {filter === "unread" ? "Keine ungelesenen Benachrichtigungen" : "Keine Benachrichtigungen"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredNotifications.map((notification, index) => {
              const link = getNotificationLink(notification);
              const NotificationContent = (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    notification.is_read
                      ? "bg-white border-stone-200"
                      : "bg-blue-50 border-blue-200 shadow-sm"
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm md:text-base ${notification.is_read ? "text-stone-700" : "text-stone-900 font-medium"}`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-stone-500 mt-1">
                        {format(new Date(notification.created_date), "d. MMM yyyy, HH:mm", { locale: de })} Uhr
                      </p>
                    </div>
                    <div className="flex gap-1 ml-2">
                      {!notification.is_read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            markAsReadMutation.mutate(notification.id);
                          }}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          deleteMutation.mutate(notification.id);
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );

              return link ? (
                <Link key={notification.id} to={link}>
                  {NotificationContent}
                </Link>
              ) : (
                <div key={notification.id}>{NotificationContent}</div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}