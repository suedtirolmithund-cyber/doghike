import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertTriangle,
  User,
  MapPin,
  Image as ImageIcon,
  MessageSquare,
  Trash2,
  Search,
  Users,
  Map,
  Crown,
  Pencil,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { createPageUrl } from "@/utils";
import { TOUR_ICONS } from "@/lib/difficultyConfig";
import { matchesTextSearch } from "@/lib/hikeSearch";
import {
  getPendingEntries,
  approveEntry,
  rejectEntry,
  getAllComments,
  approveComment,
  adminDeleteComment,
  getAdminPublicHikes,
  getAdminUsers,
  adminDeleteUserAccount,
} from "@/lib/adminApi";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

function formatAdminDate(value) {
  if (!value) return "Unbekannt";
  return format(new Date(value), "d. MMM yyyy, HH:mm", { locale: de });
}

function FilterButton({ active, children, onClick }) {
  return (
    <Button
      type="button"
      variant={active ? "default" : "outline"}
      size="sm"
      onClick={onClick}
      className={
        active
          ? "bg-brand-400 text-white hover:bg-brand-600"
          : "border-sky-200 text-slate-600 hover:bg-sky-50"
      }
    >
      {children}
    </Button>
  );
}

function StatusBadge({ status }) {
  const normalized = (status ?? "").toLowerCase();
  const config = {
    approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    draft: "bg-yellow-50 text-yellow-700 border-yellow-200",
    archived: "bg-sky-100 text-slate-600 border-sky-200",
  };

  return (
    <Badge
      variant="outline"
      className={config[normalized] ?? "bg-sky-100 text-slate-600 border-sky-200"}
    >
      {normalized === "approved"
        ? "Freigegeben"
        : normalized === "draft"
          ? "Entwurf"
          : normalized === "archived"
            ? "Archiviert"
            : status || "Unbekannt"}
    </Badge>
  );
}

function EntryCard({ entry, onApprove, onReject, approving, rejecting }) {
  const [expanded, setExpanded] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [reason, setReason] = useState("");

  const authorName =
    entry.profiles?.full_name || entry.profiles?.username || "Unbekannter Nutzer";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -40 }}
      className="doghike-glass-card-hover overflow-hidden"
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-yellow-200 bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                Wartet auf Prüfung
              </span>
              <span className="text-xs text-slate-400">
                {formatAdminDate(entry.created_at)}
              </span>
            </div>
            <h3 className="truncate text-lg font-semibold text-slate-900">{entry.title}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" /> {authorName}
              </span>
              {entry.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {entry.location}
                </span>
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
              {entry.distance_km && (
                <span className="flex items-center gap-1">
                  <span className="text-sm leading-none">{TOUR_ICONS.distance}</span>
                  {entry.distance_km} km
                </span>
              )}
              {entry.elevation_m && (
                <span className="flex items-center gap-1">
                  <span className="text-sm leading-none">{TOUR_ICONS.elevation}</span>
                  {entry.elevation_m} Hm
                </span>
              )}
              {entry.photos?.length > 0 && (
                <span className="flex items-center gap-1">
                  <ImageIcon className="h-3 w-3" />
                  {entry.photos.length} Foto{entry.photos.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-3 flex items-center gap-1 text-xs text-slate-400 transition-colors hover:text-slate-600"
        >
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          {expanded ? "Weniger" : "Details"}
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-4 border-t border-sky-100 px-5 pb-4 pt-4">
              {entry.description && (
                <div>
                  <Label className="text-xs uppercase tracking-wide text-slate-500">
                    Beschreibung
                  </Label>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                    {entry.description}
                  </p>
                </div>
              )}
              {entry.hazard_notes && (
                <div className="flex gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600" />
                  <p className="text-sm text-yellow-700">{entry.hazard_notes}</p>
                </div>
              )}
              {entry.photos?.length > 0 && (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {entry.photos.map((url, index) => (
                    <a key={index} href={url} target="_blank" rel="noopener noreferrer">
                      <img
                        src={url}
                        alt=""
                        className="aspect-square w-full rounded-lg object-cover hover:opacity-90"
                      />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-5 pb-5">
        {!showRejectForm ? (
          <div className="flex flex-wrap gap-2">
            <Link to={`${createPageUrl("AddJournalEntry")}?id=${entry.id}`}>
              <Button variant="outline" disabled={approving || rejecting} size="sm">
                Eintrag bearbeiten
              </Button>
            </Link>
            <Button
              onClick={() => onApprove(entry.id)}
              disabled={approving || rejecting}
              className="bg-brand-400 text-white hover:bg-brand-600"
              size="sm"
            >
              {approving ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-1.5 h-4 w-4" />
              )}
              Genehmigen
            </Button>
            <Button
              onClick={() => setShowRejectForm(true)}
              disabled={approving || rejecting}
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50"
              size="sm"
            >
              <XCircle className="mr-1.5 h-4 w-4" />
              Ablehnen
            </Button>
          </div>
        ) : (
          <div className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <Label className="text-sm font-medium text-red-700">
              Ablehnungsgrund (optional)
            </Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="z.B. Inhalt nicht relevant, Fotos fehlen..."
              rows={2}
              className="bg-white text-sm"
            />
            <div className="flex gap-2">
              <Button
                onClick={() => onReject(entry.id, reason)}
                disabled={rejecting}
                size="sm"
                className="bg-red-600 text-white hover:bg-red-700"
              >
                {rejecting ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="mr-1.5 h-4 w-4" />
                )}
                Ablehnen bestätigen
              </Button>
              <Button
                onClick={() => {
                  setShowRejectForm(false);
                  setReason("");
                }}
                variant="outline"
                size="sm"
              >
                Abbrechen
              </Button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function CommentCard({ comment, onApprove, onDelete, approving, deleting }) {
  const authorName = comment.profiles?.full_name || comment.profiles?.username || "Anonym";
  const needsApproval = comment.reported;
  const hikeDetailUrl =
    createPageUrl("HikeDetail") +
    `?id=${encodeURIComponent(comment.hike_id)}&source=${encodeURIComponent(comment.hike_source ?? "sheets")}`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -40 }}
      className="doghike-glass-card p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex items-center gap-3">
          {comment.profiles?.avatar_url && (
            <img
              src={comment.profiles.avatar_url}
              alt=""
              className="h-8 w-8 shrink-0 rounded-full object-cover"
            />
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-slate-900">{authorName}</span>
              {needsApproval && (
                <span className="inline-flex items-center gap-1 rounded-full border border-yellow-200 bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                  Freigabe nötig
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              {formatAdminDate(comment.created_at)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {comment.hike_title || `Tour-ID: ${comment.hike_id}`}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          {needsApproval && (
            <Button
              size="sm"
              onClick={() => onApprove(comment.id)}
              disabled={approving || deleting}
              className="bg-brand-400 text-white hover:bg-brand-600"
            >
              {approving ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-1.5 h-4 w-4" />
              )}
              Freigeben
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(comment.id)}
            disabled={deleting || approving}
            className="h-8 w-8 text-slate-400 hover:text-red-600"
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{comment.text}</p>

      {comment.photo_preview_url && (
        <a href={comment.photo_preview_url} target="_blank" rel="noopener noreferrer">
          <img
            src={comment.photo_preview_url}
            alt=""
            className="mt-2 h-32 rounded-lg object-cover hover:opacity-90"
          />
        </a>
      )}

      <div className="mt-3 flex justify-end">
        <Link to={hikeDetailUrl}>
          <Button variant="outline" size="sm">
            Zur Tour
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}

function PublicHikeCard({ hike }) {
  const detailId = hike.route_id ?? hike.id;
  const hikeDetailUrl =
    createPageUrl("HikeDetail") +
    `?id=${encodeURIComponent(detailId)}&source=${encodeURIComponent(hike._source ?? "sheets")}`;
  const editUrl =
    createPageUrl("EditPublicHike") + `?id=${encodeURIComponent(hike._public_hike_id ?? hike.id)}`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -40 }}
      className="doghike-glass-card overflow-hidden"
    >
      <div className="flex flex-col gap-4 p-4 md:flex-row">
        <div className="h-28 w-full shrink-0 overflow-hidden rounded-2xl bg-sky-100 md:w-44">
          {hike.cover_photo ? (
            <img src={hike.cover_photo} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200 text-slate-400">
              <ImageIcon className="h-6 w-6" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <StatusBadge status={hike.status} />
                {hike.is_premium && (
                  <Badge
                    variant="outline"
                    className="border-[#e5c595] bg-[#fff4e2] text-[#a96b20]"
                  >
                    <Crown className="mr-1 h-3 w-3" />
                    Premium
                  </Badge>
                )}
              </div>
              <h3 className="truncate text-lg font-semibold text-slate-900">
                {hike.trail_name || hike.title || "Ohne Titel"}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {[hike.location, hike.country].filter(Boolean).join(", ") || "Ohne Ortsangabe"}
              </p>
            </div>
            <div className="shrink-0 text-right text-xs text-slate-400">
              <p>Zuletzt aktualisiert</p>
              <p className="mt-1 font-medium text-slate-500">{formatAdminDate(hike.updated_at || hike.created_at)}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link to={editUrl}>
              <Button size="sm" className="bg-brand-400 text-white hover:bg-brand-600">
                <Pencil className="mr-1.5 h-4 w-4" />
                Bearbeiten
              </Button>
            </Link>
            <Link to={hikeDetailUrl}>
              <Button variant="outline" size="sm">
                Zur Tour
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function UserCard({ profile, deleting, onDelete }) {
  const displayName = profile.full_name || profile.username || "Unbenannter Nutzer";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -40 }}
      className="doghike-glass-card p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt=""
              className="h-11 w-11 shrink-0 rounded-2xl object-cover"
            />
          ) : (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-slate-400">
              <User className="h-5 w-5" />
            </div>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-semibold text-slate-900">{displayName}</p>
              {profile.role === "admin" && (
                <Badge variant="outline" className="border-brand-200 bg-brand-50 text-brand-700">
                  Admin
                </Badge>
              )}
              {profile.is_premium && (
                <Badge
                  variant="outline"
                  className="border-[#e5c595] bg-[#fff4e2] text-[#a96b20]"
                >
                  <Crown className="mr-1 h-3 w-3" />
                  Premium
                </Badge>
              )}
            </div>
            {profile.username && (
              <p className="mt-1 text-xs text-slate-500">@{profile.username}</p>
            )}
            <p className="mt-1 text-xs text-slate-400">
              Registriert: {formatAdminDate(profile.created_at)}
            </p>
          </div>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              disabled={deleting}
              className="h-8 w-8 text-slate-400 hover:text-red-600"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Nutzerkonto wirklich löschen?</AlertDialogTitle>
              <AlertDialogDescription>
                Dabei werden Profil, Hunde, Kommentare, Bewertungen, Fotos und weitere Nutzerdaten endgültig entfernt.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(profile.user_id)}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                Endgültig löschen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </motion.div>
  );
}

export default function AdminDashboard() {
  const { isAuthenticated, isAdmin, isLoadingAuth } = useAuth();
  const queryClient = useQueryClient();
  const [processingId, setProcessingId] = useState(null);
  const [processingType, setProcessingType] = useState(null);
  const [commentSearch, setCommentSearch] = useState("");
  const [commentFilter, setCommentFilter] = useState("all");
  const [publicHikeSearch, setPublicHikeSearch] = useState("");
  const [publicHikeStatusFilter, setPublicHikeStatusFilter] = useState("all");
  const [publicHikePremiumFilter, setPublicHikePremiumFilter] = useState("all");
  const [userSearch, setUserSearch] = useState("");

  const { data: entries = [], isLoading: entriesLoading } = useQuery({
    queryKey: ["admin_pending"],
    queryFn: getPendingEntries,
    enabled: isAdmin,
    refetchInterval: 60_000,
  });

  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ["admin_comments"],
    queryFn: getAllComments,
    enabled: isAdmin,
    refetchInterval: 60_000,
  });

  const { data: publicHikes = [], isLoading: publicHikesLoading } = useQuery({
    queryKey: ["admin_public_hikes"],
    queryFn: getAdminPublicHikes,
    enabled: isAdmin,
    refetchInterval: 60_000,
  });

  const { data: adminUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ["admin_users"],
    queryFn: getAdminUsers,
    enabled: isAdmin,
    refetchInterval: 60_000,
  });

  const pendingCommentsCount = comments.filter((comment) => comment.reported).length;
  const approvedPublicHikesCount = publicHikes.filter((hike) => hike.status === "approved").length;
  const draftPublicHikesCount = publicHikes.filter((hike) => hike.status === "draft").length;
  const premiumPublicHikesCount = publicHikes.filter((hike) => hike.is_premium).length;

  const filteredComments = useMemo(() => {
    return comments.filter((comment) => {
      if (commentFilter === "pending" && !comment.reported) return false;
      return matchesTextSearch(
        [
          comment.text,
          comment.profiles?.full_name,
          comment.profiles?.username,
          comment.hike_title,
          comment.hike_id,
        ],
        commentSearch
      );
    });
  }, [commentFilter, commentSearch, comments]);

  const filteredPublicHikes = useMemo(() => {
    return publicHikes.filter((hike) => {
      if (publicHikeStatusFilter !== "all" && hike.status !== publicHikeStatusFilter) {
        return false;
      }

        if (publicHikePremiumFilter === "premium" && !hike.is_premium) return false;
        if (publicHikePremiumFilter === "free" && hike.is_premium) return false;

        return matchesTextSearch(
          [hike.title, hike.trail_name, hike.location, hike.country],
          publicHikeSearch
        );
      });
  }, [publicHikePremiumFilter, publicHikeSearch, publicHikeStatusFilter, publicHikes]);

  const filteredUsers = useMemo(() => {
    return adminUsers.filter((profile) => {
        return matchesTextSearch(
          [profile.full_name, profile.username, profile.role],
          userSearch
        );
      });
  }, [adminUsers, userSearch]);

  const approveMutation = useMutation({
    mutationFn: (id) => approveEntry(id),
    onMutate: (id) => {
      setProcessingId(id);
      setProcessingType("approve");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_pending"] });
      queryClient.invalidateQueries({ queryKey: ["allHikes"] });
      queryClient.invalidateQueries({ queryKey: ["journal"] });
      queryClient.invalidateQueries({ queryKey: ["journalEntry"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Eintrag genehmigt");
    },
    onError: () =>
      toast.error("Der Eintrag konnte gerade nicht freigegeben werden. Bitte versuche es noch einmal."),
    onSettled: () => {
      setProcessingId(null);
      setProcessingType(null);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => rejectEntry(id, reason),
    onMutate: ({ id }) => {
      setProcessingId(id);
      setProcessingType("reject");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_pending"] });
      queryClient.invalidateQueries({ queryKey: ["allHikes"] });
      queryClient.invalidateQueries({ queryKey: ["journal"] });
      queryClient.invalidateQueries({ queryKey: ["journalEntry"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Eintrag abgelehnt");
    },
    onError: () =>
      toast.error("Der Eintrag konnte gerade nicht abgelehnt werden. Bitte versuche es noch einmal."),
    onSettled: () => {
      setProcessingId(null);
      setProcessingType(null);
    },
  });

  const approveCommentMutation = useMutation({
    mutationFn: (id) => approveComment(id),
    onMutate: (id) => {
      setProcessingId(id);
      setProcessingType("approveComment");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_comments"] });
      queryClient.invalidateQueries({ queryKey: ["comments"] });
      toast.success("Kommentar freigegeben");
    },
    onError: () =>
      toast.error("Der Kommentar konnte gerade nicht freigegeben werden. Bitte versuche es noch einmal."),
    onSettled: () => {
      setProcessingId(null);
      setProcessingType(null);
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (id) => adminDeleteComment(id),
    onMutate: (id) => {
      setProcessingId(id);
      setProcessingType("deleteComment");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_comments"] });
      queryClient.invalidateQueries({ queryKey: ["comments"] });
      toast.success("Kommentar gelöscht");
    },
    onError: () =>
      toast.error("Der Kommentar konnte gerade nicht gelöscht werden. Bitte versuche es noch einmal."),
    onSettled: () => {
      setProcessingId(null);
      setProcessingType(null);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId) => adminDeleteUserAccount(userId),
    onMutate: (userId) => {
      setProcessingId(userId);
      setProcessingType("deleteUser");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_users"] });
      toast.success("Nutzerkonto gelöscht");
    },
    onError: () =>
      toast.error("Das Nutzerkonto konnte gerade nicht gelöscht werden. Bitte versuche es noch einmal."),
    onSettled: () => {
      setProcessingId(null);
      setProcessingType(null);
    },
  });

  if (isLoadingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <ShieldCheck className="mx-auto mb-4 h-12 w-12 text-slate-300" />
          <p className="font-medium text-slate-600">Bitte zuerst anmelden.</p>
          <Link to={createPageUrl("Login")}>
            <Button className="mt-4 bg-brand-400 hover:bg-brand-600">Anmelden</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <ShieldCheck className="mx-auto mb-4 h-12 w-12 text-red-300" />
          <p className="text-lg font-semibold text-slate-700">Kein Zugriff</p>
          <p className="mt-1 text-sm text-slate-500">Diese Seite ist nur für Administratoren.</p>
          <Link to="/">
            <Button variant="outline" className="mt-4">
              Zurück
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-brand-50/20 pb-24 md:pb-8">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 md:py-10">
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="doghike-page-header">
          <div className="doghike-page-icon bg-gradient-to-br from-[#5f241d] to-[#d94a3a] text-white shadow-[0_12px_24px_rgba(95,36,29,0.14)]">
              <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="doghike-page-title">Admin Dashboard</h1>
            <p className="doghike-page-subtitle">
              Touren prüfen, Kommentare moderieren, öffentliche Touren pflegen und Nutzer verwalten.
            </p>
          </div>
        </motion.div>

        <Tabs defaultValue="entries">
          <TabsList className="mb-6 grid h-auto w-full grid-cols-2 gap-2 border border-white/70 bg-white/65 p-2 backdrop-blur-xl md:grid-cols-4">
            <TabsTrigger value="entries" className="relative flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Touren prüfen
              {entries.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-500 text-[10px] font-bold text-white">
                  {entries.length > 9 ? "9+" : entries.length}
                </span>
              )}
            </TabsTrigger>

            <TabsTrigger value="comments" className="relative flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Kommentare
              {pendingCommentsCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {pendingCommentsCount > 9 ? "9+" : pendingCommentsCount}
                </span>
              )}
            </TabsTrigger>

            <TabsTrigger value="public-hikes" className="flex items-center gap-2">
              <Map className="h-4 w-4" />
              Öffentliche Touren
            </TabsTrigger>

            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Nutzer
            </TabsTrigger>
          </TabsList>

          <TabsContent value="entries">
            <div className="mb-6 flex items-center gap-4 rounded-3xl border border-white/70 bg-white/68 p-4 shadow-sm backdrop-blur-xl">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-100">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold leading-none text-slate-900">{entries.length}</p>
                  <p className="text-xs text-slate-500">Wartet auf Prüfung</p>
                </div>
              </div>
              {entries.length === 0 && (
                <p className="ml-auto text-sm font-medium text-brand-400">Alles erledigt</p>
              )}
            </div>

            {entriesLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              </div>
            ) : entries.length === 0 ? (
              <div className="doghike-empty-state">
                <CheckCircle2 className="doghike-empty-icon text-brand-400" />
                <h3 className="mb-2 text-xl font-medium text-slate-700">Keine offenen Einträge</h3>
                <p className="text-sm text-slate-500">Alle Einträge wurden geprüft.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {entries.map((entry) => (
                    <EntryCard
                      key={entry.id}
                      entry={entry}
                      onApprove={(id) => approveMutation.mutate(id)}
                      onReject={(id, reason) => rejectMutation.mutate({ id, reason })}
                      approving={processingId === entry.id && processingType === "approve"}
                      rejecting={processingId === entry.id && processingType === "reject"}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>

          <TabsContent value="comments">
            <div className="mb-4 grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-3xl border border-white/70 bg-white/68 p-4 shadow-sm backdrop-blur-xl">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100">
                      <MessageSquare className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold leading-none text-slate-900">{comments.length}</p>
                      <p className="text-xs text-slate-500">Kommentare gesamt</p>
                    </div>
                  </div>
                  <div className="border-l border-sky-200 pl-4">
                    <p className="text-2xl font-bold leading-none text-yellow-700">{pendingCommentsCount}</p>
                    <p className="text-xs text-slate-500">Freigaben nötig</p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/70 bg-white/68 p-4 shadow-sm backdrop-blur-xl">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={commentSearch}
                    onChange={(event) => setCommentSearch(event.target.value)}
                    placeholder="Nach Text, Nutzer oder Tour suchen"
                    className="pl-10"
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <FilterButton active={commentFilter === "all"} onClick={() => setCommentFilter("all")}>
                    Alle
                  </FilterButton>
                  <FilterButton active={commentFilter === "pending"} onClick={() => setCommentFilter("pending")}>
                    Nur Freigaben
                  </FilterButton>
                </div>
              </div>
            </div>

            {commentsLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              </div>
            ) : filteredComments.length === 0 ? (
              <div className="doghike-empty-state">
                <CheckCircle2 className="doghike-empty-icon text-brand-400" />
                <h3 className="mb-2 text-xl font-medium text-slate-700">Keine passenden Kommentare</h3>
                <p className="text-sm text-slate-500">Mit den aktuellen Filtern wurde nichts gefunden.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {filteredComments.map((comment) => (
                    <CommentCard
                      key={comment.id}
                      comment={comment}
                      onApprove={(id) => approveCommentMutation.mutate(id)}
                      onDelete={(id) => deleteCommentMutation.mutate(id)}
                      approving={processingId === comment.id && processingType === "approveComment"}
                      deleting={processingId === comment.id && processingType === "deleteComment"}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>

          <TabsContent value="public-hikes">
            <div className="mb-4 grid gap-4 md:grid-cols-[1.05fr_0.95fr]">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-3xl border border-white/70 bg-white/68 p-4 shadow-sm backdrop-blur-xl">
                  <p className="text-2xl font-bold text-slate-900">{approvedPublicHikesCount}</p>
                  <p className="mt-1 text-xs text-slate-500">Freigegeben</p>
                </div>
                <div className="rounded-3xl border border-white/70 bg-white/68 p-4 shadow-sm backdrop-blur-xl">
                  <p className="text-2xl font-bold text-slate-900">{draftPublicHikesCount}</p>
                  <p className="mt-1 text-xs text-slate-500">Entwürfe</p>
                </div>
                <div className="rounded-3xl border border-white/70 bg-white/68 p-4 shadow-sm backdrop-blur-xl">
                  <p className="text-2xl font-bold text-slate-900">{premiumPublicHikesCount}</p>
                  <p className="mt-1 text-xs text-slate-500">Premium</p>
                </div>
              </div>

              <div className="rounded-3xl border border-white/70 bg-white/68 p-4 shadow-sm backdrop-blur-xl">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={publicHikeSearch}
                    onChange={(event) => setPublicHikeSearch(event.target.value)}
                    placeholder="Nach Titel oder Ort suchen"
                    className="pl-10"
                  />
                </div>
                <div className="mt-3 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <FilterButton active={publicHikeStatusFilter === "all"} onClick={() => setPublicHikeStatusFilter("all")}>
                      Alle Status
                    </FilterButton>
                    <FilterButton active={publicHikeStatusFilter === "approved"} onClick={() => setPublicHikeStatusFilter("approved")}>
                      Freigegeben
                    </FilterButton>
                    <FilterButton active={publicHikeStatusFilter === "draft"} onClick={() => setPublicHikeStatusFilter("draft")}>
                      Entwurf
                    </FilterButton>
                    <FilterButton active={publicHikeStatusFilter === "archived"} onClick={() => setPublicHikeStatusFilter("archived")}>
                      Archiv
                    </FilterButton>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <FilterButton active={publicHikePremiumFilter === "all"} onClick={() => setPublicHikePremiumFilter("all")}>
                      Alle
                    </FilterButton>
                    <FilterButton active={publicHikePremiumFilter === "premium"} onClick={() => setPublicHikePremiumFilter("premium")}>
                      Premium
                    </FilterButton>
                    <FilterButton active={publicHikePremiumFilter === "free"} onClick={() => setPublicHikePremiumFilter("free")}>
                      Frei
                    </FilterButton>
                  </div>
                </div>
              </div>
            </div>

            {publicHikesLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              </div>
            ) : filteredPublicHikes.length === 0 ? (
              <div className="doghike-empty-state">
                <CheckCircle2 className="doghike-empty-icon text-brand-400" />
                <h3 className="mb-2 text-xl font-medium text-slate-700">Keine passenden Touren</h3>
                <p className="text-sm text-slate-500">Mit den aktuellen Filtern wurde nichts gefunden.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {filteredPublicHikes.map((hike) => (
                    <PublicHikeCard key={hike.id} hike={hike} />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>

          <TabsContent value="users">
            <div className="mb-4 grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-3xl border border-white/70 bg-white/68 p-4 shadow-sm backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100">
                    <Users className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{adminUsers.length}</p>
                    <p className="mt-1 text-xs text-slate-500">Profile gesamt</p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/70 bg-white/68 p-4 shadow-sm backdrop-blur-xl">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={userSearch}
                    onChange={(event) => setUserSearch(event.target.value)}
                    placeholder="Nach Name oder Nutzername suchen"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {usersLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="doghike-empty-state">
                <CheckCircle2 className="doghike-empty-icon text-brand-400" />
                <h3 className="mb-2 text-xl font-medium text-slate-700">Keine passenden Nutzer</h3>
                <p className="text-sm text-slate-500">Mit der aktuellen Suche wurde nichts gefunden.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {filteredUsers.map((profile) => (
                    <UserCard
                      key={profile.user_id}
                      profile={profile}
                      deleting={processingId === profile.user_id && processingType === "deleteUser"}
                      onDelete={(userId) => deleteUserMutation.mutate(userId)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
