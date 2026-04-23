import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Star, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { getRatings, upsertRating } from "@/lib/communityApi";
import { toast } from "sonner";

export default function RatingSection({ hikeId }) {
  const { user, isAuthenticated } = useAuth();
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [consentPublic, setConsentPublic] = useState(false);
  const queryClient = useQueryClient();

  const { data: ratings = [] } = useQuery({
    queryKey: ["ratings", hikeId],
    queryFn: () => getRatings(hikeId),
  });

  const averageRating =
    ratings.length > 0
      ? (ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length).toFixed(1)
      : 0;

  const userRating = user ? ratings.find((rating) => rating.user_id === user.id) : null;

  const ratingMutation = useMutation({
    mutationFn: () => upsertRating(user.id, hikeId, selectedRating),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ratings", hikeId] });
      setSelectedRating(0);
      setConsentPublic(false);
      toast.success("Bewertung gespeichert");
    },
    onError: () => {
      toast.error("Die Bewertung konnte gerade nicht gespeichert werden. Bitte versuche es noch einmal.");
    },
  });

  return (
    <div className="bg-white rounded-xl p-4 md:p-6 border border-stone-200">
      <div className="mb-4 md:mb-6">
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-3xl md:text-4xl font-bold text-stone-800">{averageRating}</span>
          <span className="text-stone-500 text-sm md:text-base">/ 5</span>
        </div>
        <div className="flex items-center gap-1 mb-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-5 h-5 ${
                star <= Math.round(averageRating)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-stone-300"
              }`}
            />
          ))}
        </div>
        <p className="text-sm text-stone-500">
          {ratings.length} Bewertung{ratings.length !== 1 ? "en" : ""}
        </p>
      </div>

      {isAuthenticated && (
        <div className="border-t border-stone-200 pt-4 md:pt-6">
          <p className="font-semibold text-stone-800 mb-3 text-sm md:text-base">
            {userRating ? "Deine Bewertung aendern" : "Wanderung bewerten"}
          </p>
          <div className="flex items-center justify-center gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <motion.button
                key={star}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSelectedRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="focus:outline-none touch-manipulation"
              >
                <Star
                  className={`w-10 h-10 md:w-8 md:h-8 transition-colors ${
                    star <= (hoverRating || selectedRating || userRating?.rating || 0)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-stone-300 hover:text-yellow-200"
                  }`}
                />
              </motion.button>
            ))}
          </div>

          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200 mb-4">
            <Checkbox
              id="rating-consent"
              checked={consentPublic}
              onCheckedChange={setConsentPublic}
            />
            <label htmlFor="rating-consent" className="text-sm text-stone-700 cursor-pointer flex-1">
              Ich akzeptiere, dass meine Bewertung oeffentlich sichtbar ist.
            </label>
          </div>

          <Button
            onClick={() => ratingMutation.mutate()}
            disabled={selectedRating === 0 || ratingMutation.isPending || !consentPublic}
            className="w-full bg-slate-800 hover:bg-slate-900"
          >
            {ratingMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {userRating ? "Bewertung aktualisieren" : "Bewertung abgeben"}
          </Button>
        </div>
      )}
    </div>
  );
}
