import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Users, Mountain, MessageCircle, Star, Calendar, TrendingUp, Bell, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import FollowSection from "@/components/community/FollowSection";
import HikeCard from "@/components/hikes/HikeCard";

export default function Feed() {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me(),
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => base44.entities.Notification.filter({ recipient_email: user?.email }, "-created_date", 100),
    enabled: !!user?.email
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.is_read);
      await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const { data: following = [] } = useQuery({
    queryKey: ["following"],
    queryFn: () => base44.entities.UserFollow.filter({ follower_email: user?.email }),
    enabled: !!user?.email
  });

  const { data: followers = [] } = useQuery({
    queryKey: ["followers"],
    queryFn: () => base44.entities.UserFollow.filter({ following_email: user?.email }),
    enabled: !!user?.email
  });

  // Get mutual friends (users who follow me AND I follow them)
  const followingEmails = following.map(f => f.following_email);
  const followerEmails = followers.map(f => f.follower_email);
  const mutualFriendEmails = followingEmails.filter(email => followerEmails.includes(email));

  const { data: followingHikes = [] } = useQuery({
    queryKey: ["followingHikes", mutualFriendEmails],
    queryFn: async () => {
      if (mutualFriendEmails.length === 0) return [];
      const allHikes = await base44.entities.Hike.list("-created_date", 100);
      return allHikes.filter(h => 
        mutualFriendEmails.includes(h.created_by) && 
        (h.visibility === "friends" || h.visibility === "public")
      );
    },
    enabled: mutualFriendEmails.length > 0
  });

  const { data: followingRoutes = [] } = useQuery({
    queryKey: ["followingRoutes", mutualFriendEmails],
    queryFn: async () => {
      if (mutualFriendEmails.length === 0) return [];
      const allRoutes = await base44.entities.UserRoute.filter({ is_public: true }, "-created_date", 100);
      return allRoutes.filter(r => mutualFriendEmails.includes(r.created_by));
    },
    enabled: mutualFriendEmails.length > 0
  });

  const { data: followingComments = [] } = useQuery({
    queryKey: ["followingComments", mutualFriendEmails],
    queryFn: async () => {
      if (mutualFriendEmails.length === 0) return [];
      const allComments = await base44.entities.Comment.list("-created_date", 100);
      return allComments.filter(c => mutualFriendEmails.includes(c.user_email));
    },
    enabled: mutualFriendEmails.length > 0
  });

  const { data: followingRatings = [] } = useQuery({
    queryKey: ["followingRatings", mutualFriendEmails],
    queryFn: async () => {
      if (mutualFriendEmails.length === 0) return [];
      const allRatings = await base44.entities.Rating.list("-created_date", 100);
      return allRatings.filter(r => mutualFriendEmails.includes(r.user_email));
    },
    enabled: mutualFriendEmails.length > 0
  });

  const { data: allHikes = [] } = useQuery({
    queryKey: ["hikes"],
    queryFn: () => base44.entities.Hike.list()
  });

  const { data: dogs = [] } = useQuery({
    queryKey: ["dogs"],
    queryFn: () => base44.entities.Dog.list()
  });

  const { data: bannerSetting, refetch: refetchBanner } = useQuery({
    queryKey: ["feed_banner"],
    queryFn: async () => {
      const settings = await base44.entities.SiteSettings.filter({ key: "feed_banner_image" });
      return settings[0] || null;
    }
  });

  const [generatingBanner, setGeneratingBanner] = useState(false);

  const generateAndSaveBanner = async () => {
    setGeneratingBanner(true);
    const { url } = await base44.integrations.Core.GenerateImage({
      prompt: "Two happy Border Collie dogs hiking in the Dolomites mountains of South Tyrol, golden hour light, scenic alpine meadow, wide cinematic landscape photography"
    });
    if (bannerSetting?.id) {
      await base44.entities.SiteSettings.update(bannerSetting.id, { value: url });
    }
    refetchBanner();
    setGeneratingBanner(false);
  };

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
          <img src="https://images.unsplash.com/photo-1633722715463-d30628ccbf40?w=800&h=200&fit=crop" alt="Dogs banner" className="w-full h-32 rounded-xl object-cover shadow-md mb-4" />
          <h1 className="text-2xl md:text-3xl font-light text-stone-800 mb-1">Freunde & Benachrichtigungen</h1>
          <p className="text-stone-500 text-sm md:text-base">Verwalte deine Freundschaften, Aktivitäten und Benachrichtigungen</p>
        </motion.div>

        <Tabs defaultValue="friends" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="friends">
              <Users className="w-4 h-4 mr-2" />
              Freunde
            </TabsTrigger>
            <TabsTrigger value="notifications" className="relative">
              <Bell className="w-4 h-4 mr-2" />
              Benachrichtigungen
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="friends">
            <FollowSection />

            {/* Hikes Section */}
            {followingHikes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 mb-8"
          >
            <h2 className="text-xl font-semibold text-stone-800 mb-4">Touren deiner Freunde</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {followingHikes.map((hike, index) => (
                <HikeCard key={hike.id} hike={hike} dogs={dogs} index={index} />
              ))}
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <h2 className="text-xl font-semibold text-stone-800 mb-4">Aktivitäten deiner Freunde</h2>
        </motion.div>

        {activities.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-8 border border-stone-200/50 text-center"
              >
                <TrendingUp className="w-16 h-16 text-stone-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-stone-700 mb-2">Noch keine Aktivitäten</h3>
                <p className="text-stone-500">Deine Freunde haben noch nichts gepostet</p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {activities.map((activity, index) => (
                  <motion.div
                    key={`${activity.type}-${activity.data.id}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-xl p-3 md:p-6 border border-stone-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        {activity.type === 'hike' && (
                          <div className="w-8 h-8 md:w-10 md:h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <Mountain className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                          </div>
                        )}
                        {activity.type === 'route' && (
                          <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Mountain className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                          </div>
                        )}
                        {activity.type === 'comment' && (
                          <div className="w-8 h-8 md:w-10 md:h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <MessageCircle className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
                          </div>
                        )}
                        {activity.type === 'rating' && (
                          <div className="w-8 h-8 md:w-10 md:h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                            <Star className="w-4 h-4 md:w-5 md:h-5 text-yellow-600" />
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
                            <h3 className="text-base md:text-lg font-semibold text-stone-800 hover:text-slate-700 mb-1">
                              {activity.data.trail_name}
                            </h3>
                            <p className="text-xs md:text-sm text-stone-500">
                              📍 {activity.data.location} • {activity.data.distance_km} km
                            </p>
                          </Link>
                        )}

                        {activity.type === 'route' && (
                          <Link to={createPageUrl(`RouteDetail?id=${activity.data.id}`)}>
                            <h3 className="text-base md:text-lg font-semibold text-stone-800 hover:text-slate-700 mb-1">
                              {activity.data.name}
                            </h3>
                            <p className="text-xs md:text-sm text-stone-500">
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
          </TabsContent>

          <TabsContent value="notifications">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-stone-800">Deine Benachrichtigungen</h2>
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => markAllAsReadMutation.mutate()}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Alle als gelesen
                </Button>
              )}
            </div>

            {notifications.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-8 border border-stone-200/50 text-center"
              >
                <Bell className="w-16 h-16 text-stone-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-stone-700 mb-2">Keine Benachrichtigungen</h3>
                <p className="text-stone-500">Du hast noch keine Benachrichtigungen erhalten</p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => !notification.is_read && markAsReadMutation.mutate(notification.id)}
                    className={`bg-white rounded-xl p-4 border transition-all cursor-pointer ${
                      notification.is_read 
                        ? "border-stone-200 hover:shadow-sm" 
                        : "border-slate-300 shadow-sm hover:shadow-md bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                        notification.type === 'follow_request' ? 'bg-blue-100' :
                        notification.type === 'follow_accepted' ? 'bg-green-100' :
                        notification.type === 'hike_comment' ? 'bg-purple-100' :
                        notification.type === 'hike_rating' ? 'bg-yellow-100' :
                        notification.type === 'route_comment' ? 'bg-purple-100' :
                        notification.type === 'route_like' ? 'bg-pink-100' :
                        'bg-stone-100'
                      }`}>
                        {notification.type === 'follow_request' && <Users className="w-5 h-5 text-blue-600" />}
                        {notification.type === 'follow_accepted' && <Users className="w-5 h-5 text-green-600" />}
                        {notification.type === 'hike_comment' && <MessageCircle className="w-5 h-5 text-purple-600" />}
                        {notification.type === 'hike_rating' && <Star className="w-5 h-5 text-yellow-600" />}
                        {notification.type === 'route_comment' && <MessageCircle className="w-5 h-5 text-purple-600" />}
                        {notification.type === 'route_like' && <Star className="w-5 h-5 text-pink-600" />}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-stone-800 mb-1">
                          {notification.sender_name && (
                            <span className="font-semibold">{notification.sender_name} </span>
                          )}
                          {notification.message}
                        </p>
                        {notification.related_title && (
                          <p className="text-sm text-stone-600 font-medium mt-1">
                            {notification.related_title}
                          </p>
                        )}
                        <p className="text-xs text-stone-400 mt-2">
                          {format(new Date(notification.created_date), "d. MMM yyyy, HH:mm", { locale: de })}
                        </p>
                      </div>

                      {!notification.is_read && (
                        <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2" />
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}