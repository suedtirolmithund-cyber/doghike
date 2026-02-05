import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, UserMinus, Users, Search, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function FollowSection() {
  const [searchEmail, setSearchEmail] = useState("");
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me(),
  });

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

  const { data: allUsers = [] } = useQuery({
    queryKey: ["allUsers"],
    queryFn: () => base44.entities.User.list()
  });

  const followMutation = useMutation({
    mutationFn: async (targetEmail) => {
      const targetUser = allUsers.find(u => u.email === targetEmail);
      return base44.entities.UserFollow.create({
        follower_email: user.email,
        following_email: targetEmail,
        following_name: targetUser?.full_name || targetEmail
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["following"] });
      setSearchEmail("");
    }
  });

  const unfollowMutation = useMutation({
    mutationFn: async (targetEmail) => {
      const followRecord = following.find(f => f.following_email === targetEmail);
      if (followRecord) {
        return base44.entities.UserFollow.delete(followRecord.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["following"] });
    }
  });

  const handleFollow = () => {
    if (!searchEmail || searchEmail === user?.email) return;
    followMutation.mutate(searchEmail);
  };

  const isFollowing = (email) => following.some(f => f.following_email === email);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 border border-stone-200 text-center">
          <p className="text-2xl font-bold text-stone-800">{following.length}</p>
          <p className="text-sm text-stone-500">Folge ich</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-stone-200 text-center">
          <p className="text-2xl font-bold text-stone-800">{followers.length}</p>
          <p className="text-sm text-stone-500">Follower</p>
        </div>
      </div>

      {/* Follow someone */}
      <div className="bg-white rounded-xl p-4 md:p-6 border border-stone-200">
        <h3 className="font-semibold text-stone-800 mb-3 md:mb-4 flex items-center gap-2 text-sm md:text-base">
          <UserPlus className="w-4 h-4 md:w-5 md:h-5" />
          Nutzer folgen
        </h3>
        <div className="flex gap-2 flex-col sm:flex-row">
          <Input
            placeholder="E-Mail-Adresse eingeben"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            type="email"
            className="text-sm md:text-base"
          />
          <Button
            onClick={handleFollow}
            disabled={!searchEmail || followMutation.isPending}
            className="bg-slate-800 hover:bg-slate-900 sm:w-auto w-full"
          >
            {followMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <UserPlus className="w-4 h-4 sm:mr-0 mr-2" />
                <span className="sm:hidden">Folgen</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Following List */}
      {following.length > 0 && (
        <div className="bg-white rounded-xl p-4 md:p-6 border border-stone-200">
          <h3 className="font-semibold text-stone-800 mb-3 md:mb-4 flex items-center gap-2 text-sm md:text-base">
            <Users className="w-4 h-4 md:w-5 md:h-5" />
            Ich folge ({following.length})
          </h3>
          <div className="space-y-2">
            {following.map((follow, index) => (
              <motion.div
                key={follow.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-3 rounded-lg bg-stone-50"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-stone-800 text-sm md:text-base truncate">{follow.following_name}</p>
                  <p className="text-xs md:text-sm text-stone-500 truncate">{follow.following_email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => unfollowMutation.mutate(follow.following_email)}
                  disabled={unfollowMutation.isPending}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  {unfollowMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserMinus className="w-4 h-4" />
                  )}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Followers List */}
      {followers.length > 0 && (
        <div className="bg-white rounded-xl p-4 md:p-6 border border-stone-200">
          <h3 className="font-semibold text-stone-800 mb-3 md:mb-4 flex items-center gap-2 text-sm md:text-base">
            <Users className="w-4 h-4 md:w-5 md:h-5" />
            Meine Follower ({followers.length})
          </h3>
          <div className="space-y-2">
            {followers.map((follower, index) => (
              <motion.div
                key={follower.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-3 rounded-lg bg-stone-50"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-stone-800 text-sm md:text-base truncate">
                    {allUsers.find(u => u.email === follower.follower_email)?.full_name || follower.follower_email}
                  </p>
                  <p className="text-xs md:text-sm text-stone-500 truncate">{follower.follower_email}</p>
                </div>
                {!isFollowing(follower.follower_email) && follower.follower_email !== user?.email && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => followMutation.mutate(follower.follower_email)}
                    disabled={followMutation.isPending}
                    className="text-slate-700"
                  >
                    Zurückfolgen
                  </Button>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}