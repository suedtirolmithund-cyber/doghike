import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Users, Mountain, MessageCircle, Star, Calendar, TrendingUp, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export default function Feed() {
  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me(),
  });

  const { data: following = [] } = useQuery({
    queryKey: ["following"],
    queryFn: () => base44.entities.UserFollow.filter({ follower_email: user?.email }),
    enabled: !!user?.email
  });

  const followingEmails = following.map(f => f.following_email);

  const { data: followingHikes = [] } = useQuery({
    queryKey: ["followingHikes", followingEmails],
    queryFn: async () => {
      if (followingEmails.length === 0) return [];
      const allHikes = await base44.entities.Hike.list("-created_date", 100);
      return allHikes.filter(h => followingEmails.includes(h.created_by));
    },
    enabled: followingEmails.length > 0
  });

  const { data: followingRoutes = [] } = useQuery({
    queryKey: ["followingRoutes", followingEmails],
    queryFn: async () => {
      if (followingEmails.length === 0) return [];
      const allRoutes = await base44.entities.UserRoute.filter({ is_public: true }, "-created_date", 100);
      return allRoutes.filter(r => followingEmails.includes(r.created_by));
    },
    enabled: followingEmails.length > 0
  });

  const { data: followingComments = [] } = useQuery({
    queryKey: ["followingComments", followingEmails],
    queryFn: async () => {
      if (followingEmails.length === 0) return [];
      const allComments = await base44.entities.Comment.list("-created_date", 100);
      return allComments.filter(c => followingEmails.includes(c.user_email));
    },
    enabled: followingEmails.length > 0
  });

  const { data: followingRatings = [] } = useQuery({
    queryKey: ["followingRatings", followingEmails],
    queryFn: async () => {
      if (followingEmails.length === 0) return [];
      const allRatings = await base44.entities.Rating.list("-created_date", 100);
      return allRatings.filter(r => followingEmails.includes(r.user_email));
    },
    enabled: followingEmails.length > 0
  });

  const { data: allHikes = [] } = useQuery({
    queryKey: ["hikes"],
    queryFn: () => base44.entities.Hike.list()
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-slate-50 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-xl text-stone-700 mb-4">Bitte melde dich an</p>
          <Button onClick={() => base44.auth.redirectToLogin()}>Anmelden</Button>
        </div>
      </div>
    );
  }

  // Combine all activities
  const activities = [
    ...followingHikes.map(h => ({
      type: 'hike',
      data: h,
      date: new Date(h.created_date),
      user: following.find(f => f.following_email === h.created_by)?.following_name || h.created_by
    })),
    ...followingRoutes.map(r => ({
      type: 'route',
      data: r,
      date: new Date(r.created_date),
      user: following.find(f => f.following_email === r.created_by)?.following_name || r.created_by
    })),
    ...followingComments.map(c => ({
      type: 'comment',
      data: c,
      date: new Date(c.created_date),
      user: c.user_name,
      hike: allHikes.find(h => h.id === c.hike_id)
    })),
    ...followingRatings.map(r => ({
      type: 'rating',
      data: r,
      date: new Date(r.created_date),
      user: following.find(f => f.following_email === r.user_email)?.following_name || r.user_email,
      hike: allHikes.find(h => h.id === r.hike_id)
    }))
  ].sort((a, b) => b.date - a.date);

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-slate-50 pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 md:mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">🐾🐾</span>
            <h1 className="text-2xl md:text-3xl font-light text-stone-800">Community Feed</h1>
          </div>
          <p className="text-stone-500 text-sm md:text-base">Aktivitäten von Nutzern, denen du folgst</p>
        </motion.div>

        {following.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-8 md:p-12 border border-stone-200/50 text-center"
          >
            <Users className="w-16 h-16 text-stone-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-stone-700 mb-2">Noch keine Follower</h3>
            <p className="text-stone-500 mb-6">Folge anderen Nutzern, um ihre Aktivitäten hier zu sehen</p>
            <Link to={createPageUrl("Profile")}>
              <Button className="bg-slate-800 hover:bg-slate-900">
                <UserPlus className="w-4 h-4 mr-2" />
                Nutzern folgen
              </Button>
            </Link>
          </motion.div>
        ) : activities.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-8 border border-stone-200/50 text-center"
          >
            <TrendingUp className="w-16 h-16 text-stone-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-stone-700 mb-2">Noch keine Aktivitäten</h3>
            <p className="text-stone-500">Die Nutzer, denen du folgst, haben noch nichts gepostet</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <motion.div
                key={`${activity.type}-${activity.data.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl p-4 md:p-6 border border-stone-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {activity.type === 'hike' && (
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Mountain className="w-5 h-5 text-green-600" />
                      </div>
                    )}
                    {activity.type === 'route' && (
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Mountain className="w-5 h-5 text-blue-600" />
                      </div>
                    )}
                    {activity.type === 'comment' && (
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <MessageCircle className="w-5 h-5 text-purple-600" />
                      </div>
                    )}
                    {activity.type === 'rating' && (
                      <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                        <Star className="w-5 h-5 text-yellow-600" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-stone-600 mb-1">
                      <span className="font-semibold text-stone-800">{activity.user}</span>
                      {activity.type === 'hike' && ' hat eine neue Tour erstellt'}
                      {activity.type === 'route' && ' hat eine neue Route geplant'}
                      {activity.type === 'comment' && ' hat kommentiert'}
                      {activity.type === 'rating' && ' hat bewertet'}
                    </p>

                    {activity.type === 'hike' && (
                      <Link to={createPageUrl(`HikeDetail?id=${activity.data.id}`)}>
                        <h3 className="text-lg font-semibold text-stone-800 hover:text-slate-700 mb-1">
                          {activity.data.trail_name}
                        </h3>
                        <p className="text-sm text-stone-500">
                          📍 {activity.data.location} • {activity.data.distance_km} km
                        </p>
                      </Link>
                    )}

                    {activity.type === 'route' && (
                      <Link to={createPageUrl(`RouteDetail?id=${activity.data.id}`)}>
                        <h3 className="text-lg font-semibold text-stone-800 hover:text-slate-700 mb-1">
                          {activity.data.name}
                        </h3>
                        <p className="text-sm text-stone-500">
                          📏 {activity.data.distance_km} km
                        </p>
                      </Link>
                    )}

                    {activity.type === 'comment' && activity.hike && (
                      <div>
                        <Link to={createPageUrl(`HikeDetail?id=${activity.data.hike_id}`)}>
                          <p className="text-sm text-stone-600 hover:text-slate-700 mb-1">
                            zu <span className="font-medium">{activity.hike.trail_name}</span>
                          </p>
                        </Link>
                        <p className="text-sm text-stone-700 bg-stone-50 rounded-lg p-3 mt-2 line-clamp-3">
                          {activity.data.text}
                        </p>
                      </div>
                    )}

                    {activity.type === 'rating' && activity.hike && (
                      <Link to={createPageUrl(`HikeDetail?id=${activity.data.hike_id}`)}>
                        <p className="text-sm text-stone-600 hover:text-slate-700">
                          <span className="font-medium">{activity.hike.trail_name}</span>
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < activity.data.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-stone-300"
                              }`}
                            />
                          ))}
                        </div>
                      </Link>
                    )}

                    <p className="text-xs text-stone-400 mt-2 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(activity.date, "d. MMMM yyyy, HH:mm", { locale: de })}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}