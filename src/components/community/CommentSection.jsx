import { useState } from "react";
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

export default function CommentSection({ hikeId, hikeSource = "sheets", canComment = true }) {
  const { user, isAuthenticated } = useAuth();
  const [text, setText] = useState("");
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [consentPublic, setConsentPublic] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["comments", hikeSource, hikeId],
    queryFn: () => getComments(hikeId, hikeSource),
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
          hikeId,
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
      queryClient.invalidateQueries({ queryKey: ["comments", hikeSource, hikeId] });
      setText("");
      if (photoPreviewUrl) {
        URL.revokeObjectURL(photoPreviewUrl);
      }
      setPhotoPreviewUrl(null);
      setPhotoFile(null);
      setConsentPublic(false);
      toast.success(
        needsReview
          ? "Kommentar gespeichert und zur Freigabe an den Admin gesendet."
          : "Kommentar veröffentlicht."
      );
    },
    onError: () => {
      toast.error("Der Kommentar konnte gerade nicht gespeichert werden. Bitte versuche es noch einmal.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteComment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", hikeSource, hikeId] });
      setDeleteId(null);
      toast.success("Kommentar gelöscht.");
    },
    onError: () => {
      toast.error("Der Kommentar konnte gerade nicht gelöscht werden. Bitte versuche es noch einmal.");
    },
  });

  const handlePhotoUpload = (event) => {
    const file = event.target.files[0];
    if (!file || !user) return;

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
        <div className="bg-white rounded-xl p-4 md:p-6 border border-stone-200">
          <h3 className="font-semibold text-stone-800 mb-3 md:mb-4 text-sm md:text-base">
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
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
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
                className="bg-slate-800 hover:bg-slate-900 flex-1 sm:flex-initial"
              >
                {createMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Senden
              </Button>
            </div>

            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <Checkbox
                id="comment-consent"
                checked={consentPublic}
                onCheckedChange={setConsentPublic}
              />
              <label htmlFor="comment-consent" className="text-sm text-stone-700 cursor-pointer flex-1">
                Ich akzeptiere, dass mein Kommentar und meine Fotos öffentlich sichtbar sein können.
              </label>
            </div>
          </div>
        </div>
      )}

      {isAuthenticated && !canComment && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          Kommentare sind nur bei öffentlichen Wanderungen möglich.
        </div>
      )}

      <div className="space-y-3 md:space-y-4">
        <h3 className="font-semibold text-stone-800 text-sm md:text-base">
          Kommentare ({comments.length})
        </h3>

        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-stone-400 animate-spin" />
          </div>
        )}

        <AnimatePresence>
          {comments.map((comment) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="bg-white rounded-xl p-4 md:p-6 border border-stone-200"
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
                    <p className="font-semibold text-stone-800 text-sm md:text-base">
                      {authorName(comment)}
                    </p>
                    <p className="text-xs md:text-sm text-stone-500">
                      {format(new Date(comment.created_at), "dd.MM.yyyy 'um' HH:mm", { locale: de })}
                    </p>
                    {comment.reported && user?.id === comment.user_id && (
                      <p className="text-xs text-amber-600 mt-1">
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
                    className="text-stone-400 hover:text-red-600 w-7 h-7"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>

              <p className="text-stone-700 mb-3 text-sm md:text-base">{comment.text}</p>

              {comment.photo_url && !comment.photo_url.startsWith("pending://") && (
                <img
                  src={comment.photo_url}
                  alt=""
                  className="w-full max-w-sm h-48 object-cover rounded-lg"
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {!isLoading && comments.length === 0 && (
          <p className="text-center text-stone-500 py-8">
            Noch keine Kommentare vorhanden.
          </p>
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
              className="bg-red-600 hover:bg-red-700"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
