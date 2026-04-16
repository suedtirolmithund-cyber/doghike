import { useAuth } from "@/lib/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getSavedHikes, saveHike, unsaveHike } from "@/lib/communityApi";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";

export default function SaveButton({ hikeId, hikeSource = "sheets", className }) {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: savedHikes = [] } = useQuery({
    queryKey: ["savedHikes", user?.id],
    queryFn: () => getSavedHikes(user.id),
    enabled: !!user?.id,
  });

  const isSaved = savedHikes.some((s) => s.hike_id === hikeId);

  const saveMutation = useMutation({
    mutationFn: () => saveHike(user.id, hikeId, hikeSource),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedHikes", user?.id] });
      toast.success("Tour gespeichert");
    },
    onError: (e) => toast.error("Fehler: " + e.message),
  });

  const unsaveMutation = useMutation({
    mutationFn: () => unsaveHike(user.id, hikeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedHikes", user?.id] });
      toast.success("Tour entfernt");
    },
    onError: (e) => toast.error("Fehler: " + e.message),
  });

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate(createPageUrl("Login"));
      return;
    }
    if (isSaved) {
      unsaveMutation.mutate();
    } else {
      saveMutation.mutate();
    }
  };

  const isPending = saveMutation.isPending || unsaveMutation.isPending;

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      title={isSaved ? "Aus Merkliste entfernen" : "Tour speichern"}
      className={cn(
        "flex items-center gap-1.5 px-2 py-1 rounded-full transition-all",
        isSaved
          ? "text-emerald-400 hover:text-emerald-300"
          : "text-white/70 hover:text-white",
        isPending && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <Heart
        className={cn(
          "w-5 h-5 transition-all",
          isSaved && "fill-emerald-400 text-emerald-400"
        )}
      />
    </button>
  );
}
