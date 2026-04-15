import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { UserPlus, UserMinus, Loader2 } from "lucide-react";

export default function FollowButton({ targetEmail, targetName, variant = "default", size = "default" }) {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me(),
  });

  const { data: following = [] } = useQuery({
    queryKey: ["following"],
    queryFn: async () => { const r = await base44.entities.UserFollow.filter({ follower_email: user?.email }); return Array.isArray(r) ? r : []; },
    enabled: !!user?.email
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      return base44.entities.UserFollow.create({
        follower_email: user.email,
        following_email: targetEmail,
        following_name: targetName || targetEmail
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["following"] });
    }
  });

  const unfollowMutation = useMutation({
    mutationFn: async () => {
      const followRecord = following.find(f => f.following_email === targetEmail);
      if (followRecord) {
        return base44.entities.UserFollow.delete(followRecord.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["following"] });
    }
  });

  if (!user || user.email === targetEmail) return null;

  const isFollowing = following.some(f => f.following_email === targetEmail);
  const isPending = followMutation.isPending || unfollowMutation.isPending;

  return (
    <Button
      variant={isFollowing ? "outline" : variant}
      size={size}
      onClick={() => isFollowing ? unfollowMutation.mutate() : followMutation.mutate()}
      disabled={isPending}
      className={isFollowing ? "text-stone-700" : ""}
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : isFollowing ? (
        <UserMinus className="w-4 h-4 mr-2" />
      ) : (
        <UserPlus className="w-4 h-4 mr-2" />
      )}
      {isFollowing ? "Entfolgen" : "Folgen"}
    </Button>
  );
}