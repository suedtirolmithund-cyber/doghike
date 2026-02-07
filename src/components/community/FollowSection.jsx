import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, UserMinus, Users, Search, Loader2, Check, X, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

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

  const { data: sentRequests = [] } = useQuery({
    queryKey: ["sentRequests"],
    queryFn: () => base44.entities.FollowRequest.filter({ from_email: user?.email }),
    enabled: !!user?.email
  });

  const { data: receivedRequests = [] } = useQuery({
    queryKey: ["receivedRequests"],
    queryFn: () => base44.entities.FollowRequest.filter({ to_email: user?.email, status: "pending" }),
    enabled: !!user?.email
  });

  const sendRequestMutation = useMutation({
    mutationFn: async (targetEmail) => {
      const targetUser = allUsers.find(u => u.email === targetEmail);
      return base44.entities.FollowRequest.create({
        from_email: user.email,
        from_name: user.full_name || user.email,
        to_email: targetEmail,
        to_name: targetUser?.full_name || targetEmail,
        status: "pending"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sentRequests"] });
      setSearchEmail("");
    }
  });

  const acceptRequestMutation = useMutation({
    mutationFn: async (request) => {
      await base44.entities.FollowRequest.update(request.id, { status: "accepted" });
      await base44.entities.UserFollow.create({
        follower_email: request.from_email,
        following_email: request.to_email,
        following_name: request.to_name
      });
      await base44.entities.UserFollow.create({
        follower_email: request.to_email,
        following_email: request.from_email,
        following_name: request.from_name
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receivedRequests"] });
      queryClient.invalidateQueries({ queryKey: ["following"] });
      queryClient.invalidateQueries({ queryKey: ["followers"] });
    }
  });

  const rejectRequestMutation = useMutation({
    mutationFn: async (requestId) => {
      return base44.entities.FollowRequest.update(requestId, { status: "rejected" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receivedRequests"] });
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

  const handleSendRequest = () => {
    if (!searchEmail || searchEmail === user?.email) return;
    const alreadyFollowing = following.some(f => f.following_email === searchEmail);
    const alreadySent = sentRequests.some(r => r.to_email === searchEmail && r.status === "pending");
    if (alreadyFollowing || alreadySent) return;
    sendRequestMutation.mutate(searchEmail);
  };

  const isFollowing = (email) => following.some(f => f.following_email === email);
  const hasPendingRequest = (email) => sentRequests.some(r => r.to_email === email && r.status === "pending");

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-stone-200 text-center">
          <p className="text-2xl font-bold text-stone-800">{following.length}</p>
          <p className="text-sm text-stone-500">Freunde</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-stone-200 text-center">
          <p className="text-2xl font-bold text-stone-800">{sentRequests.filter(r => r.status === "pending").length}</p>
          <p className="text-sm text-stone-500">Gesendet</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-stone-200 text-center">
          <p className="text-2xl font-bold text-green-600">{receivedRequests.length}</p>
          <p className="text-sm text-stone-500">Anfragen</p>
        </div>
      </div>

      {/* Received Requests */}
      {receivedRequests.length > 0 && (
        <div className="bg-white rounded-xl p-4 md:p-6 border border-green-200 shadow-sm">
          <h3 className="font-semibold text-stone-800 mb-3 md:mb-4 flex items-center gap-2 text-sm md:text-base">
            <UserPlus className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
            Freundschaftsanfragen ({receivedRequests.length})
          </h3>
          <div className="space-y-2">
            {receivedRequests.map((request, index) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-100"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-stone-800 text-sm md:text-base truncate">{request.from_name}</p>
                  <p className="text-xs md:text-sm text-stone-500 truncate">{request.from_email}</p>
                </div>
                <div className="flex gap-2 ml-2">
                  <Button
                    size="sm"
                    onClick={() => acceptRequestMutation.mutate(request)}
                    disabled={acceptRequestMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => rejectRequestMutation.mutate(request.id)}
                    disabled={rejectRequestMutation.isPending}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Send Request */}
      <div className="bg-white rounded-xl p-4 md:p-6 border border-stone-200">
        <h3 className="font-semibold text-stone-800 mb-3 md:mb-4 flex items-center gap-2 text-sm md:text-base">
          <UserPlus className="w-4 h-4 md:w-5 md:h-5" />
          Freundschaftsanfrage senden
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
            onClick={handleSendRequest}
            disabled={!searchEmail || sendRequestMutation.isPending}
            className="bg-slate-800 hover:bg-slate-900 sm:w-auto w-full"
          >
            {sendRequestMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <UserPlus className="w-4 h-4 sm:mr-0 mr-2" />
                <span className="sm:hidden">Anfrage senden</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Friends List */}
      {following.length > 0 && (
        <div className="bg-white rounded-xl p-4 md:p-6 border border-stone-200">
          <h3 className="font-semibold text-stone-800 mb-3 md:mb-4 flex items-center gap-2 text-sm md:text-base">
            <Users className="w-4 h-4 md:w-5 md:h-5" />
            Meine Freunde ({following.length})
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

      {/* Sent Requests */}
      {sentRequests.filter(r => r.status === "pending").length > 0 && (
        <div className="bg-white rounded-xl p-4 md:p-6 border border-stone-200">
          <h3 className="font-semibold text-stone-800 mb-3 md:mb-4 flex items-center gap-2 text-sm md:text-base">
            <Clock className="w-4 h-4 md:w-5 md:h-5 text-amber-600" />
            Gesendete Anfragen ({sentRequests.filter(r => r.status === "pending").length})
          </h3>
          <div className="space-y-2">
            {sentRequests.filter(r => r.status === "pending").map((request, index) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-100"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-stone-800 text-sm md:text-base truncate">{request.to_name}</p>
                  <p className="text-xs md:text-sm text-stone-500 truncate">{request.to_email}</p>
                </div>
                <Badge variant="outline" className="text-amber-600 border-amber-300">
                  Ausstehend
                </Badge>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}