import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { getDogs, createDog, updateDog, deleteDog } from "@/lib/profilesApi";
import { supabase } from "@/lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import { Dog, Plus, Edit, Trash2, Loader2, LogIn, Mountain, Home } from "lucide-react";
import { differenceInYears, differenceInMonths } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import DogForm from "@/components/forms/DogForm";

function getAge(birthDate) {
  if (!birthDate) return null;

  const years = differenceInYears(new Date(), new Date(birthDate));
  if (years > 0) return `${years} Jahr${years !== 1 ? "e" : ""}`;

  const months = differenceInMonths(new Date(), new Date(birthDate));
  return `${months} Monat${months !== 1 ? "e" : ""}`;
}

export default function Dogs() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDog, setEditingDog] = useState(null);

  const { data: dogs = [], isLoading } = useQuery({
    queryKey: ["dogs", user?.id],
    queryFn: () => getDogs(user.id),
    enabled: !!user?.id,
  });

  const { data: statsMap = {} } = useQuery({
    queryKey: ["dogStats", user?.id, dogs.map((dog) => dog.id).join(",")],
    queryFn: async () => {
      if (!dogs.length) return {};

      const dogIds = dogs.map((dog) => dog.id);
      const { data, error } = await supabase
        .from("journal_entries")
        .select("dog_id, distance_km, elevation_m")
        .eq("user_id", user.id)
        .in("dog_id", dogIds);

      if (error) return {};

      const map = {};
      for (const entry of data ?? []) {
        if (!map[entry.dog_id]) {
          map[entry.dog_id] = { tourCount: 0, totalDistance: 0, totalElevation: 0 };
        }
        map[entry.dog_id].tourCount += 1;
        map[entry.dog_id].totalDistance += entry.distance_km ?? 0;
        map[entry.dog_id].totalElevation += entry.elevation_m ?? 0;
      }

      return map;
    },
    enabled: !!user?.id && dogs.length > 0,
  });

  const createMutation = useMutation({
    mutationFn: (data) => createDog(user.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dogs", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["dogStats", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["dog"] });
      queryClient.invalidateQueries({ queryKey: ["topDogs"] });
      setDialogOpen(false);
      toast.success("Hund hinzugefügt");
    },
    onError: () => toast.error("Der Hund konnte gerade nicht gespeichert werden. Bitte versuche es noch einmal."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateDog(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dogs", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["dogStats", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["dog"] });
      queryClient.invalidateQueries({ queryKey: ["topDogs"] });
      setDialogOpen(false);
      setEditingDog(null);
      toast.success("Hund aktualisiert");
    },
    onError: () => toast.error("Die Änderungen am Hund konnten gerade nicht gespeichert werden. Bitte versuche es noch einmal."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteDog(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dogs", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["dogStats", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["dog"] });
      queryClient.invalidateQueries({ queryKey: ["topDogs"] });
      toast.success("Hund entfernt");
    },
    onError: () => toast.error("Der Hund konnte gerade nicht entfernt werden. Bitte versuche es noch einmal."),
  });

  const handleSave = async (data) => {
    if (editingDog) {
      await updateMutation.mutateAsync({ id: editingDog.id, data });
      return;
    }

    await createMutation.mutateAsync(data);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-50/20 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-brand-100 bg-white/78 text-brand-400 shadow-[0_14px_35px_rgba(192,48,96,0.09)]">
            <Dog className="h-9 w-9" />
          </div>
          <p className="text-slate-600 mb-4">Bitte melde dich an, um deine Hunde zu verwalten.</p>
          <Link to={createPageUrl("Login")}>
            <Button className="doghike-primary-action">
              <LogIn className="w-4 h-4 mr-2" /> Anmelden
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-50/20 pb-24 md:pb-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="doghike-page-header mb-0">
            <div className="doghike-page-icon">
              <Dog className="h-5 w-5" />
            </div>
            <div>
              <h1 className="doghike-page-title">Meine Hunde</h1>
              <p className="doghike-page-subtitle">Deine Wanderbegleiter</p>
            </div>
          </div>
          {dogs.length > 0 && (
            <Button
              onClick={() => {
                setEditingDog(null);
                setDialogOpen(true);
              }}
              className="bg-brand-400 hover:bg-brand-600"
            >
              <Plus className="w-4 h-4 mr-2" /> Hund hinzufügen
            </Button>
          )}
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
          </div>
        ) : dogs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence>
              {dogs.map((dog, index) => {
                const stats = statsMap[dog.id] ?? { tourCount: 0, totalDistance: 0, totalElevation: 0 };

                return (
                  <motion.div
                    key={dog.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.06 }}
                    className="doghike-glass-card-hover overflow-hidden"
                  >
                    <div className="relative h-48 bg-gradient-to-br from-brand-50 via-white to-stone-100">
                      <img
                        src={dog.photo_url || `https://api.dicebear.com/7.x/thumbs/svg?seed=${dog.name}&backgroundColor=f5f5f4`}
                        alt={dog.name}
                        className="w-full h-full object-cover"
                        onError={(event) => {
                          event.target.src = `https://api.dicebear.com/7.x/thumbs/svg?seed=${dog.name}&backgroundColor=f5f5f4`;
                        }}
                      />
                      <div className="absolute top-3 right-3 flex gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setEditingDog(dog);
                            setDialogOpen(true);
                          }}
                          className="bg-white/80 backdrop-blur-sm hover:bg-white w-8 h-8"
                        >
                          <Edit className="w-3.5 h-3.5 text-slate-600" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="bg-white/80 backdrop-blur-sm hover:bg-brand-50 w-8 h-8"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-brand-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{dog.name} entfernen?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Entfernt {dog.name} dauerhaft aus deiner Hundeliste.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate(dog.id)}
                                className="bg-brand-400 hover:bg-brand-500"
                              >
                                Entfernen
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>

                    <div className="p-5">
                      <div className="flex items-center justify-between mb-2">
                        <h2 className="text-xl font-semibold text-slate-900">{dog.name}</h2>
                        {dog.breed && (
                          <span className="text-xs text-brand-700 bg-brand-50 border border-brand-100 px-2.5 py-1 rounded-full">
                            {dog.breed}
                          </span>
                        )}
                      </div>
                      {getAge(dog.birth_date) && (
                        <p className="text-slate-500 text-sm mb-1">{getAge(dog.birth_date)}</p>
                      )}
                      {dog.character && (
                        <p className="text-slate-500 text-sm mb-3">{dog.character}</p>
                      )}
                      {dog.notes && (
                        <p className="text-slate-400 text-xs mb-3 line-clamp-2">{dog.notes}</p>
                      )}

                      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-brand-100">
                        <div className="text-center">
                          <p className="text-lg font-bold text-slate-900">{stats.tourCount}</p>
                          <p className="text-xs text-slate-400">Touren</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-slate-900">{stats.totalDistance.toFixed(1)}</p>
                          <p className="text-xs text-slate-400">km</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-slate-900">{Math.round(stats.totalElevation).toLocaleString()}</p>
                          <p className="text-xs text-slate-400">Hm</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-[28px] border border-white/65 bg-white/72 shadow-[0_24px_60px_rgba(192,48,96,0.14)] backdrop-blur-xl"
          >
            <div className="relative overflow-hidden bg-gradient-to-br from-[#56152d] via-[#c03060] to-[#fada6a] px-6 py-12 text-center">
              <div
                className="absolute inset-0 bg-cover bg-center opacity-70"
                style={{ backgroundImage: "url('/splash/autumn-hero.jpg')" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
              <div className="relative z-10">
                <h2 className="text-3xl font-light tracking-[-0.03em] text-white md:text-4xl">
                  Willkommen zurück
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/85 md:text-base">
                  Lege deinen Hund an und mache DogHike persönlicher. So kannst du deine gemeinsamen Wanderungen später viel schöner festhalten.
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-b from-brand-50/70 via-white to-brand-50/80 px-5 py-6 md:px-8 md:py-8">
              <div className="rounded-[24px] border border-brand-100/80 bg-white/78 p-5 shadow-[0_18px_34px_rgba(192,48,96,0.10)] backdrop-blur-sm md:p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#c03060]">Dein nächster Schritt</p>
                <button
                  type="button"
                  onClick={() => {
                    setEditingDog(null);
                    setDialogOpen(true);
                  }}
                  className="mt-4 flex w-full items-center justify-between rounded-[22px] border border-brand-100 bg-gradient-to-r from-white via-brand-50/70 to-brand-50 px-5 py-5 text-left shadow-[0_14px_26px_rgba(192,48,96,0.10)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_30px_rgba(232,88,32,0.13)]"
                >
                  <div className="min-w-0">
                    <p className="text-xl font-semibold text-slate-900">Hund anlegen</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">Füge deinen ersten Wanderbegleiter hinzu.</p>
                  </div>
                  <div className="ml-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#c03060] text-white shadow-[0_10px_22px_rgba(232,88,32,0.28)]">
                    <Dog className="h-5 w-5" />
                  </div>
                </button>
              </div>

              <div className="mt-5 rounded-[24px] border border-brand-100/80 bg-white/70 p-5 shadow-[0_16px_32px_rgba(192,48,96,0.08)] backdrop-blur-sm md:p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Danach</p>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <Link to={createPageUrl("Dashboard")} className="block">
                    <Button
                      variant="outline"
                      className="h-auto w-full justify-start gap-3 rounded-[20px] border-brand-100 bg-white/85 px-4 py-4 text-left text-slate-700 shadow-sm hover:bg-brand-50/50"
                    >
                      <Home className="h-4 w-4 shrink-0 text-brand-400" />
                      <span className="text-sm font-medium">Zum Dashboard</span>
                    </Button>
                  </Link>
                  <Link to={createPageUrl("Hikes")} className="block">
                    <Button
                      variant="outline"
                      className="h-auto w-full justify-start gap-3 rounded-[20px] border-brand-100 bg-white/85 px-4 py-4 text-left text-slate-700 shadow-sm hover:bg-brand-50/50"
                    >
                      <Mountain className="h-4 w-4 shrink-0 text-brand-400" />
                      <span className="text-sm font-medium">Touren entdecken</span>
                    </Button>
                  </Link>
                  <Link to={createPageUrl("AddJournalEntry")} className="block">
                    <Button
                      variant="outline"
                      className="h-auto w-full justify-start gap-3 rounded-[20px] border-brand-100 bg-white/85 px-4 py-4 text-left text-slate-700 shadow-sm hover:bg-brand-50/50"
                    >
                      <Plus className="h-4 w-4 shrink-0 text-brand-400" />
                      <span className="text-sm font-medium">Wanderung eintragen</span>
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingDog ? "Hund bearbeiten" : "Hund hinzufügen"}</DialogTitle>
          </DialogHeader>
          <DogForm
            dog={editingDog}
            onSave={handleSave}
            onCancel={() => {
              setDialogOpen(false);
              setEditingDog(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
