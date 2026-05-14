import { useMemo, useState } from "react";
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
  Bell,
  Mountain,
  Navigation,
  BookOpen,
  Route,
  Dog,
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
import { loadNotifications } from "@/lib/notificationsApi";
import { getImageUploadErrorMessage } from "@/lib/uploadValidation";
import { getAllHikes } from "@/api/sheetsClient";
import { getUserRoutes } from "@/lib/routesApi";
import DogForm from "@/components/forms/DogForm";
import HikeCard from "@/components/hikes/HikeCard";
import AccountSettings from "@/components/profile/AccountSettings";
import { getAvatarDataUrl } from "@/lib/fallbackImages";
import { BADGE_DEFS, getBadges, loadLeaderboard } from "@/lib/topDogs";
import { showDogFeedback, showSavedFeedback, showUploadedFeedback } from "@/lib/feedbackToast";

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
    staleTime: 5 * 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const { data: dogs = [], isLoading: dogsLoading } = useQuery({
    queryKey: ["dogs", user?.id],
    queryFn: () => getDogs(user.id),
    enabled: !!user?.id,
    staleTime: 5 * 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const { data: topDogs = [] } = useQuery({
    queryKey: ["topDogs"],
    queryFn: loadLeaderboard,
    enabled: dogs.length > 0,
    staleTime: 5 * 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const { data: savedHikes = [], isLoading: savedLoading } = useQuery({
    queryKey: ["savedHikes", user?.id],
    queryFn: () => getSavedHikes(user.id),
    enabled: !!user?.id,
    staleTime: 5 * 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const { data: allHikes = [], isLoading: allHikesLoading } = useQuery({
    queryKey: ["allHikes"],
    queryFn: getAllHikes,
    enabled: savedHikes.length > 0,
    staleTime: 5 * 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const { data: userRoutes = [], isLoading: routesLoading } = useQuery({
    queryKey: ["userRoutes", user?.id],
    queryFn: () => getUserRoutes(user.id),
    enabled: !!user?.id,
    staleTime: 5 * 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: () => loadNotifications(user.id),
    enabled: !!user?.id,
    staleTime: 2 * 60_000,
    refetchOnWindowFocus: false,
    refetchInterval: 10 * 60_000,
  });

  const notificationCount = notifications.length;

  const dogBadgeMeta = useMemo(() => {
    const tourRanking = [...topDogs].sort((a, b) => b.tourCount - a.tourCount);
    const distanceRanking = [...topDogs].sort((a, b) => b.totalDistance - a.totalDistance);
    const elevationRanking = [...topDogs].sort((a, b) => b.totalElevation - a.totalElevation);
    const championIds = new Set(
      [tourRanking[0]?.dog?.id, distanceRanking[0]?.dog?.id, elevationRanking[0]?.dog?.id].filter(Boolean)
    );

    return Object.fromEntries(
      topDogs.map((entry) => [
        entry.dog.id,
        {
          badges: getBadges(entry, championIds.has(entry.dog.id)),
        },
      ])
    );
  }, [topDogs]);

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
      showSavedFeedback("Profil gespeichert", "Deine Änderungen sind jetzt sichtbar.");
    },
    onError: (error) => {
      if (
        error?.code === "USERNAME_TAKEN" ||
        error?.message === "username_taken" ||
        error?.code === "23505" ||
        error?.message?.includes("profiles_username_normalized_unique")
      ) {
        toast.error("Diesen Namen gibt es schon. Bitte wähle einen anderen.");
        return;
      }

      toast.error("Dein Profil wollte gerade nicht mit. Versuch es gleich noch einmal.");
    },
  });

  const createDogMutation = useMutation({
    mutationFn: (data) => createDog(user.id, data),
    onSuccess: (dog) => {
      queryClient.invalidateQueries({ queryKey: ["dogs", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["dogStats", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["dog"] });
      queryClient.invalidateQueries({ queryKey: ["topDogs"] });
      setDialogOpen(false);
      showDogFeedback(`${dog?.name || "Dein Hund"} ist jetzt dabei`, "Dein Wanderbuddy wurde gespeichert.");
    },
    onError: () => toast.error("Das hat gerade nicht geklappt. Dein Hund bleibt bei dir, wir versuchen es gleich noch einmal."),
  });

  const updateDogMutation = useMutation({
    mutationFn: ({ id, data }) => updateDog(id, data),
    onSuccess: (dog) => {
      queryClient.invalidateQueries({ queryKey: ["dogs", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["dogStats", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["dog"] });
      queryClient.invalidateQueries({ queryKey: ["topDogs"] });
      setDialogOpen(false);
      setEditingDog(null);
      showSavedFeedback(`${dog?.name || "Dein Hund"} ist aktualisiert`, "Die Hundedaten sind wieder auf dem neuesten Stand.");
    },
    onError: () => toast.error("Die Änderung ist noch nicht angekommen. Versuch es gleich noch einmal."),
  });

  const deleteDogMutation = useMutation({
    mutationFn: (id) => deleteDog(id),
    onSuccess: (_, dogId) => {
      queryClient.invalidateQueries({ queryKey: ["dogs", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["dogStats", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["dog"] });
      queryClient.invalidateQueries({ queryKey: ["topDogs"] });
      const removedDog = dogs.find((dog) => dog.id === dogId);
      showSavedFeedback(`${removedDog?.name || "Der Hund"} entfernt`, "Der Wanderbuddy ist aus deiner Liste raus.");
    },
    onError: () => toast.error("Das Entfernen hat gerade nicht geklappt."),
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
      showUploadedFeedback("Profilbild hochgeladen", "Dein neues Profilbild ist jetzt sichtbar.");
    } catch (error) {
      if (uploadedAvatarUrl) {
        try {
          await deleteStoredFile(uploadedAvatarUrl, "avatars");
        } catch (cleanupError) {
          console.error("Temporary avatar cleanup failed:", cleanupError);
        }
      }
      toast.error(
        getImageUploadErrorMessage(
          error,
          "Das Foto wollte gerade nicht hochladen. Versuch es gleich noch einmal."
        )
      );
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

  const fallbackAvatarUrl = getAvatarDataUrl(user?.id);
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
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-50/20 flex items-center justify-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full mx-4">
          <div className="doghike-glass-card p-8 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-brand-100 bg-white/78 text-brand-400 shadow-[0_14px_35px_rgba(168,0,60,0.09)]">
              <Dog className="h-9 w-9" />
            </div>
            <h2 className="text-2xl font-light text-slate-900 mb-2">Willkommen!</h2>
            <p className="text-slate-500 mb-6">
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
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-50/20 pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="doghike-glass-card p-6 mb-6 md:mb-8"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
            <div className="relative mx-auto shrink-0 sm:mx-0">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-4 border-white shadow-md bg-brand-100/80">
                {avatarUploading ? (
                  <div className="w-full h-full flex items-center justify-center bg-brand-100/80">
                    <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
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

            <div className="min-w-0 flex-1 text-center sm:text-left">
              {editingProfile ? (
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs text-slate-500">Anzeigename</Label>
                    <Input
                      value={profileDraft.full_name}
                      onChange={(event) => setProfileDraft((draft) => ({ ...draft, full_name: event.target.value }))}
                      placeholder="Dein Name"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Username</Label>
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
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-900 truncate">{displayName}</h1>
                  {profile?.username && (
                    <p className="text-sm text-slate-400">@{profile.username}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{user?.email}</p>
                  <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={startEditProfile}>
                      <Edit className="w-3 h-3 mr-1" /> Profil bearbeiten
                    </Button>
                    <Link to={createPageUrl("Notifications")}>
                      <Button
                        size="sm"
                        variant="outline"
                        className={`relative h-7 text-xs ${
                          notificationCount > 0
                            ? "border-brand-300 bg-brand-50 text-brand-700 hover:bg-brand-100"
                            : ""
                        }`}
                      >
                        <Bell className="w-3 h-3 mr-1" /> Benachrichtigungen
                        {notificationCount > 0 && (
                          <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-brand-500 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
                            {notificationCount > 99 ? "99+" : notificationCount}
                          </span>
                        )}
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-center sm:justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="h-10 shrink-0 rounded-xl border-brand-100 bg-white/70 px-3 text-brand-600 shadow-sm hover:border-brand-100 hover:bg-brand-50 hover:text-brand-400"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Abmelden</span>
              </Button>
            </div>
          </div>
        </motion.div>

        <Tabs defaultValue="dogs" className="space-y-4 md:space-y-6">
          <div>
            <TabsList className="grid h-auto w-full grid-cols-2 gap-1 border border-white/70 bg-white/65 p-1 backdrop-blur-xl sm:grid-cols-4 md:gap-1.5">
              <TabsTrigger value="dogs" className="h-11 min-w-0 whitespace-nowrap px-2 text-sm md:px-4 md:text-base">Hunde</TabsTrigger>
              <TabsTrigger value="routes" className="flex h-11 min-w-0 items-center gap-1.5 whitespace-nowrap px-2 text-sm md:px-4 md:text-base">
                <Navigation className="h-4 w-4" />
                Routen
                {userRoutes.length > 0 && (
                  <span className="rounded-full bg-brand-100 px-1.5 py-0.5 text-xs font-bold leading-none text-brand-700 md:px-2">
                    {userRoutes.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="saved" className="flex h-11 min-w-0 items-center gap-1.5 whitespace-nowrap px-2 text-sm md:px-4 md:text-base">
                <Heart className="h-4 w-4" />
                Gespeichert
                {savedHikes.length > 0 && (
                  <span className="rounded-full bg-brand-100 px-1.5 py-0.5 text-xs font-bold leading-none text-brand-600 md:px-2">
                    {savedHikes.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="settings" className="h-11 min-w-0 whitespace-nowrap px-2 text-sm md:px-4 md:text-base">Konto</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="dogs">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h2 className="text-lg md:text-xl font-medium text-slate-900">Meine Hunde</h2>
              <Button
                onClick={() => {
                  setEditingDog(null);
                  setDialogOpen(true);
                }}
                className="bg-brand-400 hover:bg-brand-600 text-sm"
                size="sm"
              >
                <Plus className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline ml-1">Hund hinzufügen</span>
              </Button>
            </div>

            {dogsLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
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
                      className="doghike-glass-card-hover overflow-hidden"
                    >
                      <div className="relative h-40 bg-gradient-to-br from-brand-50 via-white to-stone-100 md:h-44">
                        <img
                          src={dog.photo_url || getAvatarDataUrl(dog.name)}
                          alt={dog.name}
                          className="w-full h-full object-cover"
                          onError={(event) => {
                            event.target.onerror = null;
                            event.target.src = getAvatarDataUrl(dog.name);
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
                              <Button size="icon" variant="ghost" className="bg-white/80 backdrop-blur-sm hover:bg-brand-50 w-8 h-8">
                                <Trash2 className="w-3.5 h-3.5 text-brand-500" />
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
                                <AlertDialogAction onClick={() => deleteDogMutation.mutate(dog.id)} className="bg-brand-400 hover:bg-brand-500">
                                  Entfernen
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>

                      <div className="p-4 md:p-5">
                        <div className="flex items-center justify-between mb-1">
                          <h2 className="text-xl font-semibold text-slate-900">{dog.name}</h2>
                          {dog.breed && (
                          <span className="text-xs text-brand-700 bg-brand-50 border border-brand-100 px-2 py-0.5 rounded-full">{dog.breed}</span>
                          )}
                        </div>
                        {dogBadgeMeta[dog.id]?.badges?.length > 0 && (
                          <div className="mb-2 flex flex-wrap gap-1.5">
                            {dogBadgeMeta[dog.id].badges.map((badgeKey) => (
                              <span
                                key={badgeKey}
                                title={`${BADGE_DEFS[badgeKey].label}: ${BADGE_DEFS[badgeKey].desc}`}
                                className="inline-flex items-center justify-center rounded-full border border-brand-100 bg-brand-50 px-2 py-1 text-sm leading-none"
                              >
                                {BADGE_DEFS[badgeKey].emoji}
                              </span>
                            ))}
                          </div>
                        )}
                        {getAge(dog.birth_date) && (
                          <p className="text-sm text-slate-500 mb-2">{getAge(dog.birth_date)}</p>
                        )}
                        {dog.character && (
                          <p className="text-sm text-slate-500 mb-1">{dog.character}</p>
                        )}
                        {dog.notes && (
                          <p className="text-xs text-slate-400 line-clamp-2">{dog.notes}</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="doghike-empty-state">
                <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full border border-white/80 bg-gradient-to-br from-brand-50 via-white to-stone-100 text-5xl shadow-[0_16px_34px_rgba(120,90,66,0.14)]">
                  🐕
                </div>
                <h3 className="text-xl font-medium text-slate-700 mb-2">Wer läuft mit dir?</h3>
                <p className="text-slate-500 mb-6">Lege deinen ersten Hund an, damit du gemeinsame Touren später leichter zuordnen kannst.</p>
                <Button
                  onClick={() => {
                    setEditingDog(null);
                    setDialogOpen(true);
                  }}
                  className="doghike-primary-action"
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
                <h2 className="text-lg md:text-xl font-medium text-slate-900 mb-1 flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-brand-600" />
                  Meine Routen
                </h2>
                <p className="text-slate-500 text-sm">Geplante und aufgezeichnete Wanderrouten</p>
              </div>
              <Link to={createPageUrl("RoutePlanner")}>
                <Button className="bg-brand-400 hover:bg-brand-600" size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  <span className="hidden md:inline">Neue Route</span>
                </Button>
              </Link>
            </div>

            {routesLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
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
                    <div key={route.id} className="doghike-glass-card-hover flex items-center gap-4 p-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                        {route.completed
                          ? <Route className="w-5 h-5" />
                          : <Navigation className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-slate-900 truncate">{route.name}</p>
                          <span
                            className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                              "bg-brand-100 text-brand-600"
                            }`}
                          >
                            {statusLabel}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400 flex-wrap">
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
              <div className="doghike-empty-state">
                <Navigation className="doghike-empty-icon" />
                <h3 className="text-xl font-medium text-slate-700 mb-2">Noch kein Weg geplant</h3>
                <p className="text-slate-500 text-sm mb-6">Plane den ersten Weg. Dein Hund kommt später im Tagebuch dazu.</p>
                <Link to={createPageUrl("RoutePlanner")}>
                  <Button className="doghike-primary-action">
                    <Plus className="w-4 h-4 mr-2" />
                    Route erstellen
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>

          <TabsContent value="saved">
            <div className="mb-4 md:mb-6">
              <h2 className="text-lg md:text-xl font-medium text-slate-900 mb-1 flex items-center gap-2">
                <Heart className="w-5 h-5 text-brand-400" />
                Gespeicherte Touren
              </h2>
              <p className="text-slate-500 text-sm">Touren die du mit dem Herz-Button markiert hast</p>
            </div>

            {(savedLoading || (savedHikes.length > 0 && allHikesLoading)) ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
              </div>
            ) : savedHikeObjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {savedHikeObjects.map((hike, index) => (
                  <HikeCard key={`${hike._source ?? "sheets"}-${hike.id}`} hike={hike} dogs={dogs} index={index} />
                ))}
              </div>
            ) : (
              <div className="doghike-empty-state">
                <Heart className="doghike-empty-icon" />
                <h3 className="text-xl font-medium text-slate-700 mb-2">Noch keine Lieblingstouren</h3>
                <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">
                  Tippe bei einer Tour aufs Herz. Dann wartet sie hier auf dich.
                </p>
                <Link to={createPageUrl("Hikes")}>
                  <Button className="doghike-primary-action">
                    <Mountain className="w-4 h-4 mr-2" />
                    Touren entdecken
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings">
            <div className="mb-4 md:mb-6">
              <h2 className="text-lg md:text-xl font-medium text-slate-900 mb-1">Kontoeinstellungen</h2>
              <p className="text-slate-500 text-sm">Datenschutz und Konto löschen</p>
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


