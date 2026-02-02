import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
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
    queryFn: () => base44.entities.Dog.list()
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Hike.update(hikeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hikes"] });
      queryClient.invalidateQueries({ queryKey: ["hike", hikeId] });
      navigate(createPageUrl("HikeDetail") + `?id=${hikeId}`);
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-pulse text-stone-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-slate-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link to={createPageUrl("HikeDetail") + `?id=${hikeId}`}>
            <Button variant="ghost" className="mb-4 text-stone-600">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Hike
            </Button>
          </Link>
          <h1 className="text-3xl font-light text-stone-800">Edit Hike</h1>
          <p className="text-stone-500 mt-1">Update your adventure details</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-8 border border-stone-200/50 shadow-sm"
        >
          <HikeForm
            hike={hike}
            dogs={dogs}
            onSave={(data) => updateMutation.mutate(data)}
            onCancel={() => navigate(createPageUrl("HikeDetail") + `?id=${hikeId}`)}
          />
        </motion.div>
      </div>
    </div>
  );
}