import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Camera, Send, Trash2, Loader2, X } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  getComments,
  createComment,
  deleteComment,
  uploadCommentPhoto,
  commentNeedsReview,
  deleteUploadedCommentPhoto,
} from "@/lib/communityApi";
import { getImageUploadErrorMessage, validateImageUpload } from "@/lib/uploadValidation";

export default function CommentSection({ hikeId, hikeAliases = [], hikeSource = "sheets", canComment = true }) {
  const { user, isAuthenticated } = useAuth();
  const normalizedHikeId = String(hikeId);
  const [text, setText] = useState("");
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [consentPublic, setConsentPublic] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    return () => {
      if (photoPreviewUrl) {
        URL.revokeObjectURL(photoPreviewUrl);
      }
    };
  }, [photoPreviewUrl]);

  const { data: comments = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["comments", hikeSource, normalizedHikeId, ...hikeAliases],
    queryFn: () => getComments(normalizedHikeId, hikeSource, hikeAliases),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const needsReview = commentNeedsReview(text);
      let uploadedPhotoReference = null;

      try {
        if (photoFile) {
          uploadedPhotoReference = await uploadCommentPhoto(user.id, photoFile, { needsReview });
        }

        return await createComment(
          user.id,
          normalizedHikeId,
          hikeSource,
          text,
          uploadedPhotoReference,
          needsReview
        );
      } catch (error) {
        if (uploadedPhotoReference) {
          await deleteUploadedCommentPhoto(uploadedPhotoReference);
        }
        throw error;
      }
    },
    onSuccess: () => {
      const needsReview = commentNeedsReview(text);
      queryClient.invalidateQueries({ queryKey: ["comments"] });
      setText("");
      if (photoPreviewUrl) {
        URL.revokeObjectURL(photoPreviewUrl);
      }
      setPhotoPreviewUrl(null);
      setPhotoFile(null);
      setConsentPublic(false);
      toast.success(
        needsReview
          ? "Danke. Dein Tipp wird kurz geprüft."
          : "Dein Tipp ist online."
      );
    },
    onError: () => {
      toast.error("Dein Tipp ist noch nicht angekommen. Versuch es gleich noch einmal.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteComment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments"] });
      setDeleteId(null);
      toast.success("Der Tipp ist weg.");
    },
    onError: () => {
      toast.error("Das Löschen hat gerade nicht geklappt.");
    },
  });

  const handlePhotoUpload = (event) => {
    const file = event.target.files[0];
    if (!file || !user) return;

    try {
      validateImageUpload(file);
    } catch (error) {
      toast.error(getImageUploadErrorMessage(error));
      event.target.value = "";
      return;
    }

    if (photoPreviewUrl) {
      URL.revokeObjectURL(photoPreviewUrl);
    }

    setPhotoFile(file);
    setPhotoPreviewUrl(URL.createObjectURL(file));
  };

  const clearSelectedPhoto = () => {
    if (photoPreviewUrl) {
      URL.revokeObjectURL(photoPreviewUrl);
    }
    setPhotoPreviewUrl(null);
    setPhotoFile(null);
  };

  const authorName = (comment) =>
    comment.profiles?.full_name || comment.profiles?.username || "Anonym";

  return (
    <div className="space-y-6">
      {isAuthenticated && canComment && (
        <div className="doghike-glass-card p-4 md:p-6">
          <h3 className="mb-3 text-sm font-semibold text-[#7C3020] md:mb-4 md:text-base">
            Kommentar hinzufügen
          </h3>
          <Textarea
            placeholder="Teile deine Erfahrungen mit dieser Wanderung..."
            value={text}
            onChange={(event) => setText(event.target.value)}
            className="mb-3 text-sm md:text-base"
            rows={4}
          />

          {photoPreviewUrl && (
            <div className="relative w-24 mb-3">
              <img src={photoPreviewUrl} alt="" className="w-24 h-24 object-cover rounded-lg" />
              <button
                onClick={clearSelectedPhoto}
                className="absolute -top-2 -right-2 bg-brand-500 text-white rounded-full p-1 hover:bg-brand-400"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex gap-2 flex-wrap">
              <label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={createMutation.isPending}
                />
                <Button type="button" variant="outline" disabled={createMutation.isPending} asChild>
                  <span className="cursor-pointer">
                    {createMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4 mr-2" />
                    )}
                    Foto
                  </span>
                </Button>
              </label>
              <Button
                onClick={() => createMutation.mutate()}
                disabled={!text.trim() || createMutation.isPending || !consentPublic}
                className="bg-brand-400 hover:bg-brand-600 flex-1 sm:flex-initial"
              >
                {createMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Senden
              </Button>
            </div>

            <div className="doghike-soft-panel flex items-center gap-3 p-3">
              <Checkbox
                id="comment-consent"
                checked={consentPublic}
                onCheckedChange={setConsentPublic}
              />
              <label htmlFor="comment-consent" className="flex-1 cursor-pointer text-sm text-[#7C3020]">
                Ich akzeptiere, dass mein Kommentar und meine Fotos öffentlich sichtbar sein können.
              </label>
            </div>
          </div>
        </div>
      )}

      {isAuthenticated && !canComment && (
        <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 text-sm text-brand-700">
          Kommentare sind nur bei öffentlichen Wanderungen möglich.
        </div>
      )}

      <div className="space-y-3 md:space-y-4">
        <h3 className="text-sm font-semibold text-[#7C3020] md:text-base">
          Kommentare ({comments.length})
        </h3>

        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-brand-400" />
          </div>
        )}

        {!isLoading && isError && (
          <div className="doghike-soft-panel py-6 px-4 text-center">
            <p className="font-medium text-[#7C3020]">Kommentare konnten gerade nicht geladen werden.</p>
            <p className="mt-1 text-sm text-[#C07820]">Bitte versuche es gleich noch einmal.</p>
            <Button type="button" variant="outline" className="mt-4" onClick={() => refetch()}>
              Neu laden
            </Button>
          </div>
        )}

        <AnimatePresence>
          {!isError && comments.map((comment) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="doghike-glass-card p-4 md:p-6"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {comment.profiles?.avatar_url && (
                    <img
                      src={comment.profiles.avatar_url}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <p className="text-sm font-semibold text-[#7C3020] md:text-base">
                      {authorName(comment)}
                    </p>
                    <p className="text-xs text-[#C07820] md:text-sm">
                      {format(new Date(comment.created_at), "dd.MM.yyyy 'um' HH:mm", { locale: de })}
                    </p>
                    {comment.reported && user?.id === comment.user_id && (
                      <p className="text-xs text-brand-300 mt-1">
                        Wartet auf Freigabe durch den Admin.
                      </p>
                    )}
                  </div>
                </div>
                {user?.id === comment.user_id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteId(comment.id)}
                    className="h-10 w-10 text-[#C07820] hover:text-brand-400 md:h-9 md:w-9"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>

              <p className="mb-3 text-sm text-[#7C3020] md:text-base">{comment.text}</p>

              {(comment.photo_preview_url || (comment.photo_url && !comment.photo_url.startsWith("pending://") ? comment.photo_url : null)) && (
                <img
                  src={comment.photo_preview_url || comment.photo_url}
                  alt=""
                  className="w-full max-w-sm h-48 object-cover rounded-lg"
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {!isLoading && !isError && comments.length === 0 && (
          <div className="py-8 text-center">
            <p className="font-medium text-[#7C3020]">Noch keine Tipps</p>
            <p className="mt-1 text-sm text-[#C07820]">Teile den ersten Eindruck zu dieser Tour.</p>
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kommentar löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deleteId)}
              className="bg-brand-400 hover:bg-brand-500"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
