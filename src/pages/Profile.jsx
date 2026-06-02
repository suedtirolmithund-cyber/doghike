import { useEffect, useMemo, useState } from "react";
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
import { loadUnreadNotificationCount, subscribeToNotificationStorage } from "@/lib/notificationsApi";
import { getImageUploadErrorMessage } from "@/lib/uploadValidation";
import { getAllHikes } from "@/api/sheetsClient";
import { getUserRoutes } from "@/lib/routesApi";
import DogForm from "@/components/forms/DogForm";
import HikeCard from "@/components/hikes/HikeCard";
import AccountSettings from "@/components/profile/AccountSettings";
import ImagePositionEditorDialog from "@/components/images/ImagePositionEditorDialog";
import { getAvatarDataUrl } from "@/lib/fallbackImages";
import { BADGE_DEFS, getBadges, loadLeaderboard } from "@/lib/topDogs";
import { showDogFeedback, showSavedFeedback, showUploadedFeedback } from "@/lib/feedbackToast";
import { createSquareCropFile } from "@/lib/imageCropping";
import { getDisplayImageUrl } from "@/lib/imageProxy";

function normalizeHikeSource(value) {
  return value ?? "sheets";
}

const ROUTES_SEEN_KEY = "doghike:profile-routes-seen";
const mobileProfileActionClass =
  "h-12 w-full min-w-0 flex-col gap-1 overflow-hidden rounded-xl px-1 text-center text-[11px] font-bold leading-none";
const profileTabTriggerClass =
  "min-h-10 min-w-0 gap-1 px-2 py-2 text-xs leading-tight sm:min-h-11 sm:px-3 sm:text-sm md:px-5 md:text-base";
const profileTabBadgeClass =
  "inline-flex min-w-4 shrink-0 items-center justify-center rounded-full bg-brand-100 px-1 py-0.5 text-[10px] font-bold leading-none text-brand-700 md:min-w-5 md:px-2 md:text-xs";
const dogBreedPillClass =
  "inline-flex max-w-full min-w-0 items-center justify-center rounded-full border border-brand-100 bg-brand-50 px-2 py-0.5 text-center text-[11px] font-semibold leading-tight text-brand-700 break-words sm:text-xs";

function getRoutesSeenStorageKey(userId) {
  return `${ROUTES_SEEN_KEY}:${userId}`;
}

function readRoutesSeenAt(userId) {
  if (!userId || typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(getRoutesSeenStorageKey(userId));
  } catch {
    return null;
  }
}

function writeRoutesSeenAt(userId, value) {
  if (!userId || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(getRoutesSeenStorageKey(userId), value);
  } catch {
    // Ignore localStorage issues and keep the profile usable.
  }
}

export default function Profile() {
  const { user, isAuthenticated, logout } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("dogs");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDog, setEditingDog] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileDraft, setProfileDraft] = useState({ full_name: "", username: "" });
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarEditorOpen, setAvatarEditorOpen] = useState(false);
  const [avatarEditorSource, setAvatarEditorSource] = useState(null);
  const [avatarEditorSourceName, setAvatarEditorSourceName] = useState("profilbild.jpg");
  const [routesSeenAt, setRoutesSeenAt] = useState(null);

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

  const { data: notificationCount = 0 } = useQuery({
    queryKey: ["notificationsUnread", user?.id],
    queryFn: () => loadUnreadNotificationCount(user.id),
    enabled: !!user?.id,
    staleTime: 2 * 60_000,
    refetchOnWindowFocus: false,
    refetchInterval: 10 * 60_000,
  });

  useEffect(() => {
    if (!user?.id) return undefined;

    return subscribeToNotificationStorage(user.id, () => {
      queryClient.invalidateQueries({ queryKey: ["notificationsUnread", user.id] });
      queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
    });
  }, [queryClient, user?.id]);

  useEffect(() => {
    setRoutesSeenAt(readRoutesSeenAt(user?.id));
  }, [user?.id]);

  const unseenRouteCount = useMemo(() => {
    if (!userRoutes.length) return 0;
    if (!routesSeenAt) return userRoutes.length;

    const seenTimestamp = new Date(routesSeenAt).getTime();
    if (!Number.isFinite(seenTimestamp)) return userRoutes.length;

    return userRoutes.filter((route) => {
      const routeTimestamp = new Date(route.updated_at || route.created_at || 0).getTime();
      return Number.isFinite(routeTimestamp) && routeTimestamp > seenTimestamp;
    }).length;
  }, [routesSeenAt, userRoutes]);

  useEffect(() => {
    if (activeTab !== "routes" || unseenRouteCount === 0 || !user?.id) return;
    const seenAt = new Date().toISOString();
    writeRoutesSeenAt(user.id, seenAt);
    setRoutesSeenAt(seenAt);
  }, [activeTab, unseenRouteCount, user?.id]);

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
    .map((saved) => {
      const savedSource = normalizeHikeSource(saved.hike_source);
      const savedId = String(saved.hike_id);

      return allHikes.find((hike) => {
        const hikeSource = normalizeHikeSource(hike._source);
        if (hikeSource !== savedSource) return false;

        const candidateIds = [hike.id, hike._public_hike_id, hike.route_id]
          .filter(Boolean)
          .map((value) => String(value));

        return candidateIds.includes(savedId);
      });
    })
    .filter(Boolean);
  const isSavedHikesResolving =
    savedLoading ||
    (savedHikes.length > 0 && (allHikesLoading || allHikes.length === 0) && savedHikeObjects.length === 0);

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
    onError: (error) => {
      console.error("Profile dog create failed:", error);
      toast.error(
        error?.code === "42501"
          ? "Dein Konto durfte den Hund gerade nicht speichern. Bitte melde dich einmal neu an."
          : "Der Hund konnte gerade nicht gespeichert werden. Versuch es gleich noch einmal."
      );
    },
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
    const objectUrl = URL.createObjectURL(file);
    setAvatarEditorSource(objectUrl);
    setAvatarEditorSourceName(file.name || "profilbild.jpg");
    setAvatarEditorOpen(true);
    event.target.value = "";
  };

  const closeAvatarEditor = () => {
    if (avatarEditorSource?.startsWith("blob:")) {
      URL.revokeObjectURL(avatarEditorSource);
    }
    setAvatarEditorOpen(false);
    setAvatarEditorSource(null);
    setAvatarEditorSourceName("profilbild.jpg");
  };

  const saveAvatarCrop = async ({ focusX, focusY, zoom }) => {
    if (!avatarEditorSource || !user) return;

    setAvatarUploading(true);
    let uploadedAvatarUrl = null;

    try {
      const previousAvatarUrl = profile?.avatar_url || null;
      const croppedFile = await createSquareCropFile(avatarEditorSource, {
        focusX,
        focusY,
        zoom,
        fileName: avatarEditorSourceName.replace(/\.[^.]+$/, "") + ".jpg",
      });

      const url = await uploadFile("avatars", user.id, croppedFile);
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
      showUploadedFeedback("Profilbild gespeichert", "Der Bildausschnitt sitzt jetzt besser.");
      closeAvatarEditor();
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
          "Der Bildausschnitt wollte gerade nicht gespeichert werden. Versuch es gleich noch einmal."
        )
      );
    } finally {
      setAvatarUploading(false);
    }
  };

  const openExistingAvatarEditor = () => {
    if (!avatarUrl) return;
    setAvatarEditorSource(avatarUrl);
    setAvatarEditorSourceName("profilbild.jpg");
    setAvatarEditorOpen(true);
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
  const avatarPreviewUrl = getDisplayImageUrl(avatarUrl, { width: 192, quality: 72 }) || fallbackAvatarUrl;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-50/20 flex items-center justify-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full mx-4">
          <div className="doghike-glass-card p-8 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-brand-100 bg-white/78 text-brand-400 shadow-[0_14px_35px_rgba(168,0,60,0.09)]">
              <Dog className="h-9 w-9" />
            </div>
            <h2 className="doghike-page-title mb-2">Willkommen!</h2>
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
          className="doghike-glass-card mb-6 p-4 md:mb-8 md:p-6"
        >
          <div className="flex items-start gap-4 md:gap-5">
            <div className="relative shrink-0">
              <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-brand-100/80 shadow-md md:h-24 md:w-24">
                {avatarUploading ? (
                  <div className="w-full h-full flex items-center justify-center bg-brand-100/80">
                    <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
                  </div>
                ) : (
                  <img src={avatarPreviewUrl} alt={displayName} className="w-full h-full object-cover" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 p-1.5 bg-brand-400 text-white rounded-full cursor-pointer hover:bg-brand-600 shadow">
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" disabled={avatarUploading} />
                <Camera className="w-3.5 h-3.5" />
              </label>
            </div>

            <div className="min-w-0 flex-1 text-left">
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
                  <h1 className="truncate text-2xl font-bold leading-tight text-[#7C3020]">{displayName}</h1>
                  {profile?.username && (
                    <p className="truncate text-sm font-semibold text-[#C07820] md:text-base">@{profile.username}</p>
                  )}
                  <p className="mt-0.5 break-all text-xs leading-tight text-slate-500 md:text-sm">{user?.email}</p>
                  <div className="mt-3 hidden flex-wrap gap-2 md:flex">
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={startEditProfile}>
                      <Edit className="w-3 h-3 mr-1" /> Profil bearbeiten
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={openExistingAvatarEditor} disabled={avatarUploading || !avatarUrl}>
                      <Camera className="w-3 h-3 mr-1" /> Bildausschnitt
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

            <div className="hidden justify-center md:flex md:justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="min-h-10 shrink-0 rounded-xl border-[#A8003C] bg-[#A8003C] px-3 py-2 text-white shadow-[0_10px_22px_rgba(168,0,60,0.18)] hover:border-[#7C3020] hover:bg-[#7C3020] hover:text-white"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Abmelden</span>
              </Button>
            </div>
          </div>

          {!editingProfile && (
            <div className="mt-4 grid grid-cols-4 gap-2 md:hidden">
              <Button size="sm" variant="outline" className={mobileProfileActionClass} onClick={startEditProfile}>
                <Edit className="h-4 w-4" />
                <span>Profil</span>
              </Button>
              <Button size="sm" variant="outline" className={mobileProfileActionClass} onClick={openExistingAvatarEditor} disabled={avatarUploading || !avatarUrl}>
                <Camera className="h-4 w-4" />
                <span>Bild</span>
              </Button>
              <Link to={createPageUrl("Notifications")} className="min-w-0">
                <Button
                  size="sm"
                  variant="outline"
                  className={`relative w-full ${mobileProfileActionClass} ${
                    notificationCount > 0
                      ? "border-brand-300 bg-brand-50 text-brand-700 hover:bg-brand-100"
                      : ""
                  }`}
                >
                  <Bell className="h-4 w-4" />
                  <span>Meldungen</span>
                  {notificationCount > 0 && (
                    <span className="absolute right-1 top-1 inline-flex min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 py-0.5 text-[9px] font-semibold leading-none text-white">
                      {notificationCount > 99 ? "99+" : notificationCount}
                    </span>
                  )}
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className={`${mobileProfileActionClass} border-[#A8003C] bg-[#A8003C] text-white shadow-[0_10px_22px_rgba(168,0,60,0.18)] hover:border-[#7C3020] hover:bg-[#7C3020] hover:text-white`}
              >
                <LogOut className="h-4 w-4" />
                <span>Abmelden</span>
              </Button>
            </div>
          )}
        </motion.div>

        <ImagePositionEditorDialog
          open={avatarEditorOpen}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) {
              closeAvatarEditor();
              return;
            }
            setAvatarEditorOpen(nextOpen);
          }}
          sourceUrl={avatarEditorSource}
          title="Profilbild ausrichten"
          description="Passe den Ausschnitt so an, dass dein Gesicht im Kreis gut sitzt."
          previewShape="circle"
          confirmLabel="Profilbild speichern"
          isSaving={avatarUploading}
          onConfirm={saveAvatarCrop}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 md:space-y-6">
          <div className="pb-1">
            <TabsList className="!grid h-auto w-full grid-cols-2 gap-1 rounded-2xl border border-white/70 bg-white/65 p-1 backdrop-blur-xl sm:grid-cols-4 md:gap-1.5">
              <TabsTrigger value="dogs" className={profileTabTriggerClass}>Hunde</TabsTrigger>
              <TabsTrigger value="routes" className={`flex items-center ${profileTabTriggerClass}`}>
                <Navigation className="h-4 w-4" />
                <span>Routen</span>
                {unseenRouteCount > 0 && (
                  <span className={profileTabBadgeClass}>
                    {unseenRouteCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="saved" className={`flex items-center ${profileTabTriggerClass}`}>
                <Heart className="h-4 w-4" />
                <span className="min-w-0">Gespeichert</span>
                {savedHikes.length > 0 && (
                  <span className={profileTabBadgeClass}>
                    {savedHikes.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="settings" className={profileTabTriggerClass}>Konto</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="dogs">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h2 className="doghike-section-title">Meine Hunde</h2>
              <Button
                onClick={() => {
                  setEditingDog(null);
                  setDialogOpen(true);
                }}
                className="bg-brand-400 text-sm font-bold hover:bg-brand-600 md:min-h-11 md:px-5 md:py-2 md:text-base"
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
                      <div className="relative h-40 bg-gradient-to-br from-[#FDF0E8] via-white to-[#F9C030]/30 md:h-44">
                        <img
                          src={getDisplayImageUrl(dog.photo_url, { width: 720, quality: 76 }) || getAvatarDataUrl(dog.name)}
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
                            className="h-10 w-10 bg-white/80 backdrop-blur-sm hover:bg-white md:h-9 md:w-9"
                          >
                            <Edit className="w-3.5 h-3.5 text-slate-600" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-10 w-10 bg-white/80 backdrop-blur-sm hover:bg-brand-50 md:h-9 md:w-9">
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
                        <div className="mb-1 flex min-w-0 flex-wrap items-center gap-2">
                          <h2 className="doghike-card-title min-w-0 flex-1 truncate">{dog.name}</h2>
                          {dog.breed && (
                          <span className={dogBreedPillClass}>{dog.breed}</span>
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
                <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full border border-white/80 bg-gradient-to-br from-[#FDF0E8] via-white to-[#F9C030]/30 text-5xl shadow-[0_16px_34px_rgba(120,90,66,0.14)]">
                  🐕
                </div>
                <h3 className="doghike-empty-title">Wer läuft mit dir?</h3>
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
                <h2 className="doghike-section-title mb-1 flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-brand-600" />
                  Meine Routen
                </h2>
                <p className="doghike-section-subtitle">Geplante und aufgezeichnete Wanderrouten</p>
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
                <h3 className="doghike-empty-title">Noch kein Weg geplant</h3>
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
              <h2 className="doghike-section-title mb-1 flex items-center gap-2">
                <Heart className="w-5 h-5 text-brand-400" />
                Gespeicherte Touren
              </h2>
              <p className="doghike-section-subtitle">Touren die du mit dem Herz-Button markiert hast</p>
            </div>

            {isSavedHikesResolving ? (
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
                <h3 className="doghike-empty-title">Noch keine Lieblingstouren</h3>
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
              <h2 className="doghike-section-title mb-1">Kontoeinstellungen</h2>
              <p className="doghike-section-subtitle">Datenschutz und Konto löschen</p>
            </div>
            <AccountSettings user={user} profile={profile} />
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


