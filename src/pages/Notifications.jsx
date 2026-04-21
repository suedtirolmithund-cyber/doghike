import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, UserPlus, CheckCircle2, XCircle, BookOpen, Users, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

async function loadNotifications(userId) {
  const results = [];

  // 1. Eingehende Freundschaftsanfragen (pending)
  const { data: incoming } = await supabase
    .from("friendships")
    .select("id, requester_id, created_at")
    .eq("receiver_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (incoming?.length) {
    const requesterIds = incoming.map((f) => f.requester_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, username, avatar_url")
      .in("user_id", requesterIds);
    const pm = Object.fromEntries((profiles ?? []).map((p) => [p.user_id, p]));

    incoming.forEach((f) => {
      const p = pm[f.requester_id];
      results.push({
        id: `fr-${f.id}`,
        type: "friend_request",
        icon: UserPlus,
        color: "text-blue-600 bg-blue-50 border-blue-200",
        title: `${p?.full_name || p?.username || "Jemand"} möchte dein Freund sein`,
        time: f.created_at,
        link: createPageUrl("Friends"),
        avatar: p?.avatar_url,
      });
    });
  }

  // 2. Eigene Einträge: genehmigt oder abgelehnt
  const { data: myEntries } = await supabase
    .from("journal_entries")
    .select("id, title, status, updated_at")
    .eq("user_id", userId)
    .in("status", ["approved", "rejected"])
    .order("updated_at", { ascending: false })
    .limit(10);

  (myEntries ?? []).forEach((e) => {
    const approved = e.status === "approved";
    results.push({
      id: `je-${e.id}`,
      type: approved ? "approved" : "rejected",
      icon: approved ? CheckCircle2 : XCircle,
      color: approved
        ? "text-emerald-600 bg-emerald-50 border-emerald-200"
        : "text-red-600 bg-red-50 border-red-200",
      title: approved
        ? `"${e.title}" wurde genehmigt und ist jetzt öffentlich sichtbar ✅`
        : `"${e.title}" wurde abgelehnt ❌`,
      time: e.updated_at,
      link: createPageUrl("Journal"),
    });
  });

  // 3. Freundes-Aktivität: neue Einträge von Freunden (letzte 7 Tage)
  const { data: acceptedFs } = await supabase
    .from("friendships")
    .select("requester_id, receiver_id")
    .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
    .eq("status", "accepted");

  const friendIds = (acceptedFs ?? []).map((f) =>
    f.requester_id === userId ? f.receiver_id : f.requester_id
  );

  if (friendIds.length > 0) {
    const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const { data: friendEntries } = await supabase
      .from("journal_entries")
      .select("id, title, user_id, created_at")
      .in("user_id", friendIds)
      .in("visibility", ["friends", "public"])
      .in("status", ["approved", "draft"])
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(5);

    if (friendEntries?.length) {
      const fIds = [...new Set(friendEntries.map((e) => e.user_id))];
      const { data: fps } = await supabase
        .from("profiles")
        .select("user_id, full_name, username")
        .in("user_id", fIds);
      const fpm = Object.fromEntries((fps ?? []).map((p) => [p.user_id, p]));

      friendEntries.forEach((e) => {
        const p = fpm[e.user_id];
        results.push({
          id: `fe-${e.id}`,
          type: "friend_entry",
          icon: BookOpen,
          color: "text-stone-600 bg-stone-50 border-stone-200",
          title: `${p?.full_name || p?.username || "Freund"} hat "${e.title}" geteilt`,
          time: e.created_at,
          link: createPageUrl("Feed"),
        });
      });
    }
  }

  // Sort by time, newest first
  return results.sort((a, b) => new Date(b.time) - new Date(a.time));
}

export default function Notifications() {
  const { user, isAuthenticated } = useAuth();

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
          <Link to={createPageUrl("Login")} className="text-emerald-600 underline text-sm">Zur Anmeldung</Link>
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
            <p className="text-stone-500 text-sm mt-1">{notifications.length} Benachrichtigung{notifications.length !== 1 ? "en" : ""}</p>
          )}
        </motion.div>

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
              {notifications.map((n, i) => {
                const Icon = n.icon;
                const content = (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`bg-white rounded-2xl border p-4 flex items-start gap-4 shadow-sm ${n.color}`}
                  >
                    <div className={`rounded-xl p-2 shrink-0 ${n.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-800 leading-snug">{n.title}</p>
                      <p className="text-xs text-stone-400 mt-1">
                        {format(new Date(n.time), "d. MMM, HH:mm", { locale: de })}
                      </p>
                    </div>
                  </motion.div>
                );
                return n.link ? <Link key={n.id} to={n.link}>{content}</Link> : content;
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
