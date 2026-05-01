import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Edit,
  Trash2,
  Heart,
  LogIn,
  LogOut,
  Loader2,
  Camera,
  Check,
  X,
  Mountain,
  Navigation,
  BookOpen,
  Route,
} from "lucide-react";
import { differenceInYears, differenceInMonths } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useAuth } from "@/lib/AuthContext";
import {
  getProfile,
  upsertProfile,
  getDogs,
  createDog,
  updateDog,
  deleteDog,
  uploadFile,
  deleteStoredFile,
} from "@/lib/profilesApi";
import { getSavedHikes } from "@/lib/communityApi";
import { getAllHikes } from "@/api/sheetsClient";
import { getUserRoutes } from "@/lib/routesApi";
import DogForm from "@/components/forms/DogForm";
import HikeCard from "@/components/hikes/HikeCard";
import AccountSettings from "@/components/profile/AccountSettings";

export default function Profile() {
  const { user, isAuthenticated, logout } = useAuth();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDog, setEditingDog] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileDraft, setProfileDraft] = useState({ full_name: "", username: "" });
  const [avatarUploading, setAvatarUploading] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => getProfile(user.id),
    enabled: !!user?.id,
  });

  const { data: dogs = [], isLoading: dogsLoading } = useQuery({
    queryKey: ["dogs", user?.id],
    queryFn: () => getDogs(user.id),
    enabled: !!user?.id,
  });

  const { data: savedHikes = [], isLoading: savedLoading } = useQuery({
    queryKey: ["savedHikes", user?.id],
    queryFn: () => getSavedHikes(user.id),
    enabled: !!user?.id,
  });

  const { data: allHikes = [], isLoading: allHikesLoading } = useQuery({
    queryKey: ["allHikes"],
    queryFn: getAllHikes,
    enabled: savedHikes.length > 0,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const { data: userRoutes = [], isLoading: routesLoading } = useQuery({
    queryKey: ["userRoutes", user?.id],
    queryFn: () => getUserRoutes(user.id),
    enabled: !!user?.id,
  });

  const savedHikeObjects = savedHikes
    .map((saved) =>
      allHikes.find(
        (hike) => String(hike.id) === String(saved.hike_id) && (hike._source ?? "sheets") === (saved.hike_source ?? "sheets")
      )
    )
    .filter(Boolean);

  const upsertProfileMutation = useMutation({
    mutationFn: (updates) => upsertProfile(user.id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["friendProfiles"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["comments"] });
      setEditingProfile(false);
      toast.success("Profil gespeichert");
    },
    onError: () => toast.error("Dein Profil konnte gerade nicht gespeichert werden. Bitte versuche es noch einmal."),
  });

  const createDogMutation = useMutation({
    mutationFn: (data) => createDog(user.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dogs", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["dogStats", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["dog"] });
      queryClient.invalidateQueries({ queryKey: ["topDogs"] });
      setDialogOpen(false);
      toast.success("Hund hinzugefügt");
    },
    onError: () => toast.error("Dein Hund konnte gerade nicht gespeichert werden. Bitte versuche es noch einmal."),
  });

  const updateDogMutation = useMutation({
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

  const deleteDogMutation = useMutation({
    mutationFn: (id) => deleteDog(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dogs", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["dogStats", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["dog"] });
      queryClient.invalidateQueries({ queryKey: ["topDogs"] });
      toast.success("Hund entfernt");
    },
    onError: () => toast.error("Der Hund konnte gerade nicht gelöscht werden. Bitte versuche es noch einmal."),
  });

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !user) return;

    setAvatarUploading(true);
    let uploadedAvatarUrl = null;

    try {
      const previousAvatarUrl = profile?.avatar_url || null;
      const url = await uploadFile("avatars", user.id, file);
      uploadedAvatarUrl = url;
      await upsertProfile(user.id, { avatar_url: url });

      if (previousAvatarUrl && previousAvatarUrl !== url) {
        try {
          await deleteStoredFile(previousAvatarUrl, "avatars");
        } catch (cleanupError) {
          console.error("Avatar cleanup failed:", cleanupError);
        }
      }

      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["friendProfiles"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["comments"] });
      toast.success("Profilbild aktualisiert");
    } catch {
      if (uploadedAvatarUrl) {
        try {
          await deleteStoredFile(uploadedAvatarUrl, "avatars");
        } catch (cleanupError) {
          console.error("Temporary avatar cleanup failed:", cleanupError);
        }
      }
      toast.error("Dein Profilbild konnte gerade nicht hochgeladen werden. Bitte versuche es noch einmal.");
    } finally {
      setAvatarUploading(false);
    }
  };

  const startEditProfile = () => {
    setProfileDraft({
      full_name: profile?.full_name || user?.user_metadata?.full_name || "",
      username: profile?.username || "",
    });
    setEditingProfile(true);
  };

  const handleSaveDog = async (data) => {
    if (editingDog) {
      await updateDogMutation.mutateAsync({ id: editingDog.id, data });
    } else {
      await createDogMutation.mutateAsync(data);
    }
  };

  const getAge = (birthDate) => {
    if (!birthDate) return null;
    const years = differenceInYears(new Date(), new Date(birthDate));
    if (years > 0) return `${years} Jahr${years !== 1 ? "e" : ""}`;
    const months = differenceInMonths(new Date(), new Date(birthDate));
    return `${months} Monat${months !== 1 ? "e" : ""}`;
  };

  const fallbackAvatarUrl = `https://api.dicebear.com/7.x/thumbs/svg?seed=${user?.id}&backgroundColor=f5f5f4`;
  const hasResolvedProfile = !user?.id || profile !== undefined;

  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Unbekannt";

  const avatarUrl =
    profile?.avatar_url ||
    (hasResolvedProfile ? user?.user_metadata?.avatar_url : null) ||
    fallbackAvatarUrl;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-slate-50 flex items-center justify-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl p-8 border border-stone-200/50 shadow-lg text-center">
            <div className="text-6xl mb-4">Hund</div>
            <h2 className="text-2xl font-light text-stone-800 mb-2">Willkommen!</h2>
            <p className="text-stone-500 mb-6">
              Melde dich an, um deine Hunde zu verwalten und dein Profil zu pflegen.
            </p>
            <Link to={createPageUrl("Login")}>
              <Button className="bg-brand-400 hover:bg-brand-600 w-full mb-3">
                <LogIn className="w-4 h-4 mr-2" />
                Anmelden / Registrieren
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-slate-50 pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-stone-200/50 shadow-sm p-6 mb-6 md:mb-8"
        >
          <div className="flex items-start gap-5">
            <div className="relative shrink-0">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-4 border-white shadow-md bg-stone-100">
                {avatarUploading ? (
                  <div className="w-full h-full flex items-center justify-center bg-stone-100">
                    <Loader2 className="w-6 h-6 text-stone-400 animate-spin" />
                  </div>
                ) : (
                  <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 p-1.5 bg-brand-400 text-white rounded-full cursor-pointer hover:bg-brand-600 shadow">
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" disabled={avatarUploading} />
                <Camera className="w-3.5 h-3.5" />
              </label>
            </div>

            <div className="flex-1 min-w-0">
              {editingProfile ? (
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs text-stone-500">Anzeigename</Label>
                    <Input
                      value={profileDraft.full_name}
                      onChange={(event) => setProfileDraft((draft) => ({ ...draft, full_name: event.target.value }))}
                      placeholder="Dein Name"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-stone-500">Username</Label>
                    <Input
                      value={profileDraft.username}
                      onChange={(event) => setProfileDraft((draft) => ({ ...draft, username: event.target.value }))}
                      placeholder="@username"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      className="h-7 bg-brand-400 hover:bg-brand-600"
                      onClick={() => upsertProfileMutation.mutate(profileDraft)}
                      disabled={upsertProfileMutation.isPending}
                    >
                      {upsertProfileMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                      <span className="ml-1">Speichern</span>
                    </Button>
                    <Button size="sm" variant="outline" className="h-7" onClick={() => setEditingProfile(false)}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-stone-800 truncate">{displayName}</h1>
                  {profile?.username && (
                    <p className="text-sm text-stone-400">@{profile.username}</p>
                  )}
                  <p className="text-xs text-stone-400 mt-0.5 truncate">{user?.email}</p>
                  <Button size="sm" variant="outline" className="mt-2 h-7 text-xs" onClick={startEditProfile}>
                    <Edit className="w-3 h-3 mr-1" /> Profil bearbeiten
                  </Button>
                </div>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="shrink-0 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
            >
              <LogOut className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Abmelden</span>
            </Button>
          </div>
        </motion.div>

        <Tabs defaultValue="dogs" className="space-y-4 md:space-y-6">
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <TabsList className="bg-white border border-stone-200/50 gap-1 inline-flex min-w-full justify-start md:justify-center">
              <TabsTrigger value="dogs" className="text-xs md:text-sm whitespace-nowrap flex-shrink-0">Hunde</TabsTrigger>
              <TabsTrigger value="routes" className="text-xs md:text-sm whitespace-nowrap flex-shrink-0 flex items-center gap-1">
                <Navigation className="w-3.5 h-3.5" />
                Routen
                {userRoutes.length > 0 && (
                  <span className="bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
                    {userRoutes.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="saved" className="text-xs md:text-sm whitespace-nowrap flex-shrink-0 flex items-center gap-1">
                <Heart className="w-3.5 h-3.5" />
                Gespeichert
                {savedHikes.length > 0 && (
                  <span className="bg-brand-100 text-brand-600 text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
                    {savedHikes.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="settings" className="text-xs md:text-sm whitespace-nowrap flex-shrink-0">Konto</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="dogs">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h2 className="text-lg md:text-xl font-medium text-stone-800">Meine Hunde</h2>
              <Button
                onClick={() => {
                  setEditingDog(null);
                  setDialogOpen(true);
                }}
                className="bg-slate-800 hover:bg-slate-700 text-sm"
                size="sm"
              >
                <Plus className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline ml-1">Hund hinzufügen</span>
              </Button>
            </div>

            {dogsLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 text-stone-400 animate-spin" />
              </div>
            ) : dogs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimatePresence>
                  {dogs.map((dog, index) => (
                    <motion.div
                      key={dog.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white rounded-2xl overflow-hidden border border-stone-200/50 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="relative h-44 bg-gradient-to-br from-slate-100 to-stone-100">
                        <img
                          src={dog.photo_url || `https://api.dicebear.com/7.x/thumbs/svg?seed=${dog.name}&backgroundColor=f5f5f4`}
                          alt={dog.name}
                          className="w-full h-full object-cover"
                          onError={(event) => {
                            event.target.onerror = null;
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
                            <Edit className="w-3.5 h-3.5 text-stone-600" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="icon" variant="ghost" className="bg-white/80 backdrop-blur-sm hover:bg-red-50 w-8 h-8">
                                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{dog.name} entfernen?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Dies entfernt {dog.name} dauerhaft aus deiner Hundeliste.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteDogMutation.mutate(dog.id)} className="bg-red-600 hover:bg-red-700">
                                  Entfernen
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>

                      <div className="p-5">
                        <div className="flex items-center justify-between mb-1">
                          <h2 className="text-xl font-semibold text-stone-800">{dog.name}</h2>
                          {dog.breed && (
                            <span className="text-xs text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">{dog.breed}</span>
                          )}
                        </div>
                        {getAge(dog.birth_date) && (
                          <p className="text-sm text-stone-500 mb-2">{getAge(dog.birth_date)}</p>
                        )}
                        {dog.character && (
                          <p className="text-sm text-stone-500 mb-1">{dog.character}</p>
                        )}
                        {dog.notes && (
                          <p className="text-xs text-stone-400 line-clamp-2">{dog.notes}</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-2xl border border-stone-200/50">
                <div className="text-6xl mb-4">Hund</div>
                <h3 className="text-xl font-medium text-stone-700 mb-2">Noch keine Hunde</h3>
                  <p className="text-stone-500 mb-6">Füge deinen ersten Wanderbegleiter hinzu!</p>
                <Button
                  onClick={() => {
                    setEditingDog(null);
                    setDialogOpen(true);
                  }}
                  className="bg-slate-800 hover:bg-slate-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Hund hinzufügen
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="routes">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div>
                <h2 className="text-lg md:text-xl font-medium text-stone-800 mb-1 flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-brand-600" />
                  Meine Routen
                </h2>
                <p className="text-stone-500 text-sm">Geplante und aufgezeichnete Wanderrouten</p>
              </div>
              <Link to={createPageUrl("RoutePlanner")}>
                <Button className="bg-slate-800 hover:bg-slate-700" size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  <span className="hidden md:inline">Neue Route</span>
                </Button>
              </Link>
            </div>

            {routesLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 text-stone-400 animate-spin" />
              </div>
            ) : userRoutes.length > 0 ? (
              <div className="space-y-3">
                {userRoutes.map((route) => {
                  const statusLabel = route.completed
                    ? "Erledigt"
                    : route.route_type === "gpx"
                      ? "Importiert"
                      : "Geplant";

                  return (
                    <div key={route.id} className="flex items-center gap-4 rounded-2xl border border-stone-200/70 bg-white/70 p-4 shadow-sm backdrop-blur-sm">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                        {route.completed
                          ? <Route className="w-5 h-5" />
                          : <Navigation className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-stone-800 truncate">{route.name}</p>
                          <span
                            className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                              "bg-brand-100 text-brand-600"
                            }`}
                          >
                            {statusLabel}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-stone-400 flex-wrap">
                          {route.distance_km && <span>{route.distance_km} km</span>}
                          {route.elevation_gain_m && <span>+{route.elevation_gain_m} Hm</span>}
                          {route.start_location && <span>{route.start_location}</span>}
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Link to={`${createPageUrl("RouteDetail")}?id=${route.id}`}>
                          <Button size="sm" variant="outline" className="h-8 text-xs">Details</Button>
                        </Link>
                        {route.completed && (
                          <Link to={`${createPageUrl("RouteDetail")}?id=${route.id}`}>
                            <Button size="sm" className="h-8 text-xs bg-brand-400 hover:bg-brand-600">
                              <BookOpen className="w-3.5 h-3.5 mr-1" />
                              Eintragen
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-2xl border border-stone-200/50">
                <Navigation className="w-14 h-14 text-stone-200 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-stone-700 mb-2">Noch keine Routen</h3>
                <p className="text-stone-500 text-sm mb-6">Plane deine erste Tour oder zeichne eine Wanderung auf</p>
                <Link to={createPageUrl("RoutePlanner")}>
                  <Button className="bg-slate-800 hover:bg-slate-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Route erstellen
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>

          <TabsContent value="saved">
            <div className="mb-4 md:mb-6">
              <h2 className="text-lg md:text-xl font-medium text-stone-800 mb-1 flex items-center gap-2">
                <Heart className="w-5 h-5 text-brand-400" />
                Gespeicherte Touren
              </h2>
              <p className="text-stone-500 text-sm">Touren die du mit dem Herz-Button markiert hast</p>
            </div>

            {(savedLoading || (savedHikes.length > 0 && allHikesLoading)) ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 text-stone-400 animate-spin" />
              </div>
            ) : savedHikeObjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {savedHikeObjects.map((hike, index) => (
                  <HikeCard key={`${hike._source ?? "sheets"}-${hike.id}`} hike={hike} dogs={dogs} index={index} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-2xl border border-stone-200/50">
                <Heart className="w-14 h-14 text-stone-200 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-stone-700 mb-2">Noch keine Touren gespeichert</h3>
                <p className="text-stone-500 text-sm mb-6 max-w-xs mx-auto">
                  Tippe das Herz bei einer Tour an, um sie hier zu speichern!
                </p>
                <Link to={createPageUrl("Hikes")}>
                  <Button className="bg-brand-400 hover:bg-brand-600">
                    <Mountain className="w-4 h-4 mr-2" />
                    Touren entdecken
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings">
            <div className="mb-4 md:mb-6">
              <h2 className="text-lg md:text-xl font-medium text-stone-800 mb-1">Kontoeinstellungen</h2>
              <p className="text-stone-500 text-sm">Datenschutz und Konto löschen</p>
            </div>
            <AccountSettings user={user} />
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingDog ? "Hund bearbeiten" : "Hund hinzufügen"}</DialogTitle>
          </DialogHeader>
          <DogForm
            dog={editingDog}
            onSave={handleSaveDog}
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


