import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { ArrowLeft, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import HikeForm from "@/components/forms/HikeForm";

export default function EditHike() {
  const urlParams = new URLSearchParams(window.location.search);
  const hikeId = urlParams.get("id");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: hike, isLoading } = useQuery({
    queryKey: ["hike", hikeId],
    queryFn: async () => {
      const hikes = await base44.entities.Hike.filter({ id: hikeId });
      return hikes[0];
    },
    enabled: !!hikeId
  });

  const { data: dogs = [] } = useQuery({
    queryKey: ["dogs"],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.Dog.filter({ created_by: currentUser.email });
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Hike.update(hikeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hikes"] });
      queryClient.invalidateQueries({ queryKey: ["hike", hikeId] });
      queryClient.invalidateQueries({ queryKey: ["myHikes"] });
      navigate(createPageUrl("HikeDetail") + `?id=${hikeId}`);
    }
  });

  // For approved/public hikes: submit changes for admin review instead of direct update
  const submitChangesMutation = useMutation({
    mutationFn: (data) => base44.entities.Hike.update(hikeId, {
      pending_changes: data,
      pending_changes_status: "pending"
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hike", hikeId] });
      queryClient.invalidateQueries({ queryKey: ["myHikes"] });
      navigate(createPageUrl("HikeDetail") + `?id=${hikeId}`);
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-pulse text-stone-400">Lädt...</div>
      </div>
    );
  }

  const isPublished = hike?.status === "approved" || hike?.visibility === "friends";
  const hasPendingChanges = hike?.pending_changes_status === "pending";

  const handleSave = (data) => {
    if (isPublished) {
      // Submit for admin review
      submitChangesMutation.mutate(data);
    } else {
      // Direct save for private/draft hikes
      updateMutation.mutate(data);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link to={createPageUrl("HikeDetail") + `?id=${hikeId}`}>
            <Button variant="ghost" className="mb-4 text-stone-600">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zurück zur Tour
            </Button>
          </Link>
          <h1 className="text-3xl font-light text-stone-800">Tour bearbeiten</h1>
          <p className="text-stone-500 mt-1">Wanderdetails aktualisieren</p>
        </motion.div>

        {hasPendingChanges && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-amber-800">Änderung bereits eingereicht</p>
              <p className="text-sm text-amber-700 mt-1">
                Du hast bereits eine Änderung eingereicht, die noch auf Admin-Genehmigung wartet. 
                Eine neue Einreichung ersetzt die ausstehende.
              </p>
            </div>
          </div>
        )}

        {isPublished && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-blue-800">Änderungen benötigen Admin-Genehmigung</p>
              <p className="text-sm text-blue-700 mt-1">
                Da diese Tour {hike?.status === "approved" ? "öffentlich freigegeben" : "für Freunde sichtbar"} ist, 
                werden deine Änderungen zur Prüfung eingereicht und erst nach Admin-Freigabe übernommen.
              </p>
            </div>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-10 border border-stone-200/50 shadow-sm"
        >
          <HikeForm
            hike={hike}
            dogs={dogs}
            onSave={handleSave}
            onCancel={() => navigate(createPageUrl("HikeDetail") + `?id=${hikeId}`)}
            submitLabel={isPublished ? "Änderung zur Prüfung einreichen" : undefined}
          />
        </motion.div>
      </div>
    </div>
  );
}