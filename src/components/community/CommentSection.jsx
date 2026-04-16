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
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getComments, createComment, deleteComment, uploadCommentPhoto } from "@/lib/communityApi";

export default function CommentSection({ hikeId }) {
  const { user, isAuthenticated } = useAuth();
  const [text, setText] = useState("");
  const [photoUrl, setPhotoUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [consentPublic, setConsentPublic] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["comments", hikeId],
    queryFn: () => getComments(hikeId),
  });

  const createMutation = useMutation({
    mutationFn: () => createComment(user.id, hikeId, text, photoUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", hikeId] });
      setText("");
      setPhotoUrl(null);
      setConsentPublic(false);
      toast.success("Kommentar veröffentlicht");
    },
    onError: (e) => toast.error("Fehler: " + e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteComment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", hikeId] });
      setDeleteId(null);
      toast.success("Kommentar gelöscht");
    },
    onError: (e) => toast.error("Fehler: " + e.message),
  });

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const url = await uploadCommentPhoto(user.id, file);
      setPhotoUrl(url);
    } catch {
      toast.error("Foto-Upload fehlgeschlagen. Bitte 'comments' Bucket in Supabase anlegen.");
    } finally {
      setUploading(false);
    }
  };

  const authorName = (comment) =>
    comment.profiles?.full_name ||
    comment.profiles?.username ||
    "Anonym";

  return (
    <div className="space-y-6">
      {/* Comment Form */}
      {isAuthenticated && (
        <div className="bg-white rounded-xl p-4 md:p-6 border border-stone-200">
          <h3 className="font-semibold text-stone-800 mb-3 md:mb-4 text-sm md:text-base">
            Kommentar hinzufügen
          </h3>
          <Textarea
            placeholder="Teile deine Erfahrungen mit dieser Wanderung..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="mb-3 text-sm md:text-base"
            rows={4}
          />

          {/* Photo preview */}
          {photoUrl && (
            <div className="relative w-24 mb-3">
              <img src={photoUrl} alt="" className="w-24 h-24 object-cover rounded-lg" />
              <button
                onClick={() => setPhotoUrl(null)}
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
                  disabled={uploading}
                />
                <Button type="button" variant="outline" disabled={uploading} asChild>
                  <span className="cursor-pointer">
                    {uploading
                      ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      : <Camera className="w-4 h-4 mr-2" />}
                    Foto
                  </span>
                </Button>
              </label>
              <Button
                onClick={() => createMutation.mutate()}
                disabled={!text.trim() || createMutation.isPending || !consentPublic}
                className="bg-slate-800 hover:bg-slate-900 flex-1 sm:flex-initial"
              >
                {createMutation.isPending
                  ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  : <Send className="w-4 h-4 mr-2" />}
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
                Ich akzeptiere, dass mein Kommentar öffentlich sichtbar ist
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Comments List */}
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
                  </div>
                </div>
                {user?.id === comment.user_id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteId(comment.id)}
                    className="text-stone-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <p className="text-stone-700 mb-3 text-sm md:text-base">{comment.text}</p>

              {comment.photo_url && (
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
            Noch keine Kommentare. Sei der Erste!
          </p>
        )}
      </div>

      {/* Delete confirmation */}
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
