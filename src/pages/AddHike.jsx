import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import HikeForm from "@/components/forms/HikeForm";

export default function AddHike() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: dogs = [] } = useQuery({
    queryKey: ["dogs"],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.Dog.filter({ created_by: currentUser.email });
    }
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Hike.create({ ...data, status: "draft" }),
    onSuccess: (newHike) => {
      queryClient.invalidateQueries({ queryKey: ["hikes"] });
      queryClient.invalidateQueries({ queryKey: ["myHikes"] });
      navigate(createPageUrl("HikeDetail") + `?id=${newHike.id}`);
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link to={createPageUrl("Hikes")}>
            <Button variant="ghost" className="mb-4 text-stone-600">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zurück zu Touren
            </Button>
          </Link>
          <h1 className="text-3xl font-light text-stone-800">Neue Tour hinzufügen</h1>
          <p className="text-stone-500 mt-1">Deine Wanderung dokumentieren</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-8 border border-stone-200/50 shadow-sm"
        >
          <HikeForm
            dogs={dogs}
            onSave={(data) => createMutation.mutate(data)}
            onCancel={() => navigate(createPageUrl("Hikes"))}
          />
        </motion.div>
      </div>
    </div>
  );
}