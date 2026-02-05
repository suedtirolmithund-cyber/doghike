import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function SaveButton({ hikeId, className }) {
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: isAuthenticated } = useQuery({
    queryKey: ["isAuthenticated"],
    queryFn: () => base44.auth.isAuthenticated()
  });

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me(),
    enabled: isAuthenticated
  });

  const { data: savedHikes = [] } = useQuery({
    queryKey: ["savedHikes"],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.SavedHike.filter({ user_email: currentUser.email });
    },
    enabled: isAuthenticated
  });

  const isSaved = savedHikes.some(s => s.hike_id === hikeId);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.SavedHike.create({
        hike_id: hikeId,
        user_email: currentUser.email
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedHikes"] });
      setIsProcessing(false);
    }
  });

  const unsaveMutation = useMutation({
    mutationFn: async () => {
      const saved = savedHikes.find(s => s.hike_id === hikeId);
      if (saved) {
        return base44.entities.SavedHike.delete(saved.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedHikes"] });
      setIsProcessing(false);
    }
  });

  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      base44.auth.redirectToLogin(window.location.pathname);
      return;
    }

    setIsProcessing(true);
    if (isSaved) {
      unsaveMutation.mutate();
    } else {
      saveMutation.mutate();
    }
  };

  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={handleClick}
      disabled={isProcessing}
      className={cn(
        "bg-white/80 backdrop-blur-sm hover:bg-white",
        isSaved && "text-amber-500",
        className
      )}
    >
      <Bookmark
        className={cn(
          "w-4 h-4 transition-all",
          isSaved && "fill-amber-500"
        )}
      />
    </Button>
  );
}