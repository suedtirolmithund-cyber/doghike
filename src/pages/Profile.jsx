import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit, Trash2, Bookmark, MapPin, LogIn, UserPlus } from "lucide-react";
import { format, differenceInYears, differenceInMonths } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import DogForm from "@/components/forms/DogForm";
import HikeCard from "@/components/hikes/HikeCard";

export default function Profile() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDog, setEditingDog] = useState(null);
  const queryClient = useQueryClient();

  const { data: isAuthenticated } = useQuery({
    queryKey: ["isAuthenticated"],
    queryFn: () => base44.auth.isAuthenticated()
  });

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me(),
    enabled: isAuthenticated
  });

  const { data: dogs = [], isLoading: dogsLoading } = useQuery({
    queryKey: ["dogs"],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.Dog.filter({ created_by: currentUser.email });
    },
    enabled: isAuthenticated
  });

  const { data: myHikes = [] } = useQuery({
    queryKey: ["myHikes"],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.Hike.filter({ created_by: currentUser.email }, "-date");
    },
    enabled: isAuthenticated
  });

  const { data: savedHikeIds = [] } = useQuery({
    queryKey: ["savedHikes"],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      const saved = await base44.entities.SavedHike.filter({ user_email: currentUser.email });
      return saved.map(s => s.hike_id);
    },
    enabled: isAuthenticated
  });

  const { data: savedHikes = [] } = useQuery({
    queryKey: ["savedHikesData", savedHikeIds],
    queryFn: async () => {
      if (savedHikeIds.length === 0) return [];
      const hikes = await base44.entities.Hike.list();
      return hikes.filter(h => savedHikeIds.includes(h.id));
    },
    enabled: isAuthenticated && savedHikeIds.length > 0
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Dog.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dogs"] });
      setDialogOpen(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Dog.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dogs"] });
      setDialogOpen(false);
      setEditingDog(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Dog.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dogs"] });
    }
  });

  const getDogStats = (dogId) => {
    const dogHikes = myHikes.filter(h => h.dogs?.includes(dogId));
    const totalDistance = dogHikes.reduce((sum, h) => sum + (h.distance_km || 0), 0);
    const totalElevation = dogHikes.reduce((sum, h) => sum + (h.elevation_gain_m || 0), 0);
    return { hikeCount: dogHikes.length, totalDistance, totalElevation };
  };

  const getAge = (birthDate) => {
    if (!birthDate) return null;
    const years = differenceInYears(new Date(), new Date(birthDate));
    if (years > 0) return `${years} Jahr${years > 1 ? 'e' : ''}`;
    const months = differenceInMonths(new Date(), new Date(birthDate));
    return `${months} Monat${months > 1 ? 'e' : ''}`;
  };

  const handleSave = (data) => {
    if (editingDog) {
      updateMutation.mutate({ id: editingDog.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEditDialog = (dog) => {
    setEditingDog(dog);
    setDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditingDog(null);
    setDialogOpen(true);
  };

  const handleLogin = () => {
    base44.auth.redirectToLogin(window.location.pathname);
  };

  // Not authenticated view
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-slate-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full mx-4"
        >
          <div className="bg-white rounded-2xl p-8 border border-stone-200/50 shadow-lg text-center">
            <div className="text-6xl mb-4">🐕</div>
            <h2 className="text-2xl font-light text-stone-800 mb-2">Willkommen!</h2>
            <p className="text-stone-500 mb-6">
              Melde dich an, um deine Hunde zu verwalten, Touren zu speichern und dein persönliches Wandertagebuch zu führen.
            </p>
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleLogin}
                className="bg-slate-800 hover:bg-slate-700 w-full"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Anmelden
              </Button>
              <Button
                onClick={handleLogin}
                variant="outline"
                className="w-full"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Registrieren
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const privateHikes = myHikes.filter(h => h.status === "draft");
  const submittedHikes = myHikes.filter(h => h.status !== "draft");

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-light text-stone-800">Mein Profil</h1>
          <p className="text-stone-500 mt-1">Deine Hunde, Touren und Erinnerungen</p>
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue="dogs" className="space-y-6">
          <TabsList className="bg-white border border-stone-200/50">
            <TabsTrigger value="dogs">Meine Hunde</TabsTrigger>
            <TabsTrigger value="saved">Gespeicherte Touren</TabsTrigger>
            <TabsTrigger value="private">Meine privaten Touren</TabsTrigger>
            <TabsTrigger value="submitted">Veröffentlichte Touren</TabsTrigger>
          </TabsList>

          {/* Dogs Tab */}
          <TabsContent value="dogs">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-medium text-stone-800">Meine Hunde</h2>
              <Button
                onClick={openAddDialog}
                className="bg-slate-800 hover:bg-slate-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Hund hinzufügen
              </Button>
            </div>

            {dogs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimatePresence>
                  {dogs.map((dog, index) => {
                    const stats = getDogStats(dog.id);
                    const age = getAge(dog.birth_date);
                    
                    return (
                      <motion.div
                        key={dog.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white rounded-2xl overflow-hidden border border-stone-200/50 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="relative h-48 bg-gradient-to-br from-slate-100 to-stone-100">
                          <img
                            src={dog.photo_url || `https://api.dicebear.com/7.x/thumbs/svg?seed=${dog.name}&backgroundColor=f5f5f4`}
                            alt={dog.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-4 right-4 flex gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => openEditDialog(dog)}
                              className="bg-white/80 backdrop-blur-sm hover:bg-white"
                            >
                              <Edit className="w-4 h-4 text-stone-600" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="bg-white/80 backdrop-blur-sm hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>{dog.name} entfernen?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Dies wird {dog.name} aus deiner Hundeliste entfernen.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteMutation.mutate(dog.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Entfernen
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                        
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-3">
                            <h2 className="text-2xl font-medium text-stone-800">{dog.name}</h2>
                            {dog.breed && (
                              <span className="text-sm text-stone-500 bg-stone-100 px-3 py-1 rounded-full">
                                {dog.breed}
                              </span>
                            )}
                          </div>
                          
                          {age && (
                            <p className="text-stone-500 text-sm mb-4">{age}</p>
                          )}
                          
                          {dog.notes && (
                            <p className="text-stone-600 text-sm mb-4 line-clamp-2">{dog.notes}</p>
                          )}
                          
                          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-stone-100">
                            <div className="text-center">
                              <p className="text-xl font-semibold text-stone-800">{stats.hikeCount}</p>
                              <p className="text-xs text-stone-500">Touren</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xl font-semibold text-stone-800">{stats.totalDistance.toFixed(1)}</p>
                              <p className="text-xs text-stone-500">km</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xl font-semibold text-stone-800">{Math.round(stats.totalElevation).toLocaleString()}</p>
                              <p className="text-xs text-stone-500">Hm</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-2xl border border-stone-200/50">
                <div className="text-6xl mb-4">🐕</div>
                <h3 className="text-xl font-medium text-stone-700 mb-2">Noch keine Hunde</h3>
                <p className="text-stone-500 mb-6">Füge deinen ersten Wanderbegleiter hinzu!</p>
                <Button
                  onClick={openAddDialog}
                  className="bg-slate-800 hover:bg-slate-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Hund hinzufügen
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Saved Hikes Tab */}
          <TabsContent value="saved">
            <div className="mb-6">
              <h2 className="text-xl font-medium text-stone-800 mb-2">Gespeicherte Touren</h2>
              <p className="text-stone-500 text-sm">Touren, die du für später gespeichert hast</p>
            </div>

            {savedHikes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedHikes.map((hike, index) => (
                  <HikeCard key={hike.id} hike={hike} dogs={dogs} index={index} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-2xl border border-stone-200/50">
                <Bookmark className="w-16 h-16 text-stone-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-stone-700 mb-2">Keine gespeicherten Touren</h3>
                <p className="text-stone-500 mb-6">Speichere Touren, die du später machen möchtest</p>
                <Link to={createPageUrl("Hikes")}>
                  <Button className="bg-slate-800 hover:bg-slate-700">
                    <MapPin className="w-4 h-4 mr-2" />
                    Touren entdecken
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>

          {/* Private Hikes Tab */}
          <TabsContent value="private">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-medium text-stone-800 mb-2">Meine privaten Touren</h2>
                <p className="text-stone-500 text-sm">Dein persönliches Wandertagebuch - nur für dich</p>
              </div>
              <Link to={createPageUrl("AddHike")}>
                <Button className="bg-slate-800 hover:bg-slate-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Neue Tour
                </Button>
              </Link>
            </div>

            {privateHikes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {privateHikes.map((hike, index) => (
                  <HikeCard key={hike.id} hike={hike} dogs={dogs} index={index} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-2xl border border-stone-200/50">
                <MapPin className="w-16 h-16 text-stone-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-stone-700 mb-2">Keine privaten Touren</h3>
                <p className="text-stone-500 mb-6">Erstelle dein erstes Wandertagebuch</p>
                <Link to={createPageUrl("AddHike")}>
                  <Button className="bg-slate-800 hover:bg-slate-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Erste Tour hinzufügen
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>

          {/* Submitted Hikes Tab */}
          <TabsContent value="submitted">
            <div className="mb-6">
              <h2 className="text-xl font-medium text-stone-800 mb-2">Veröffentlichte Touren</h2>
              <p className="text-stone-500 text-sm">Touren, die du mit der Community geteilt hast</p>
            </div>

            {submittedHikes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {submittedHikes.map((hike, index) => (
                  <HikeCard key={hike.id} hike={hike} dogs={dogs} index={index} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-2xl border border-stone-200/50">
                <MapPin className="w-16 h-16 text-stone-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-stone-700 mb-2">Keine veröffentlichten Touren</h3>
                <p className="text-stone-500 mb-6">Teile deine Touren mit der Community</p>
                <Link to={createPageUrl("SubmitHike")}>
                  <Button className="bg-slate-800 hover:bg-slate-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Tour einreichen
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Add/Edit Dog Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
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