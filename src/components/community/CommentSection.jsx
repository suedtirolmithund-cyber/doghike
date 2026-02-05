import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Send, Trash2, Loader2, X } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
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

export default function CommentSection({ hikeId }) {
  const [commentText, setCommentText] = useState("");
  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteCommentId, setDeleteCommentId] = useState(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me(),
  });

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["comments", hikeId],
    queryFn: () => base44.entities.Comment.filter({ hike_id: hikeId }, "-created_date", 100),
  });

  const createCommentMutation = useMutation({
    mutationFn: (data) => base44.entities.Comment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", hikeId] });
      setCommentText("");
      setUploadedPhotos([]);
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (id) => base44.entities.Comment.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", hikeId] });
      setDeleteCommentId(null);
    },
  });

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadPromises = files.map((file) =>
        base44.integrations.Core.UploadFile({ file })
      );
      const results = await Promise.all(uploadPromises);
      const urls = results.map((r) => r.file_url);
      setUploadedPhotos([...uploadedPhotos, ...urls]);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!commentText.trim()) return;

    await createCommentMutation.mutateAsync({
      hike_id: hikeId,
      user_name: user?.full_name || "Anonym",
      user_email: user?.email,
      text: commentText,
      photos: uploadedPhotos,
    });
  };

  return (
    <div className="space-y-6">
      {/* Comment Form */}
      {user && (
        <div className="bg-white rounded-xl p-6 border border-stone-200">
          <h3 className="font-semibold text-stone-800 mb-4">Kommentar hinzufügen</h3>
          <Textarea
            placeholder="Teile deine Erfahrungen mit dieser Wanderung..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="mb-3"
            rows={4}
          />

          {/* Photo Preview */}
          {uploadedPhotos.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {uploadedPhotos.map((url, idx) => (
                <div key={idx} className="relative">
                  <img src={url} alt="" className="w-20 h-20 object-cover rounded-lg" />
                  <button
                    onClick={() => setUploadedPhotos(uploadedPhotos.filter((_, i) => i !== idx))}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoUpload}
              className="hidden"
              id="comment-photo-upload"
            />
            <label htmlFor="comment-photo-upload">
              <Button
                type="button"
                variant="outline"
                disabled={isUploading}
                asChild
              >
                <span>
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4 mr-2" />
                  )}
                  Fotos
                </span>
              </Button>
            </label>
            <Button
              onClick={handleSubmit}
              disabled={!commentText.trim() || createCommentMutation.isPending}
              className="bg-slate-800 hover:bg-slate-900"
            >
              {createCommentMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Senden
            </Button>
          </div>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        <h3 className="font-semibold text-stone-800">
          Kommentare ({comments.length})
        </h3>
        
        <AnimatePresence>
          {comments.map((comment) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="bg-white rounded-xl p-6 border border-stone-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-stone-800">{comment.user_name}</p>
                  <p className="text-sm text-stone-500">
                    {format(new Date(comment.created_date), "dd.MM.yyyy 'um' HH:mm")}
                  </p>
                </div>
                {user?.email === comment.created_by && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteCommentId(comment.id)}
                    className="text-stone-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
              
              <p className="text-stone-700 mb-3">{comment.text}</p>

              {comment.photos?.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {comment.photos.map((photo, idx) => (
                    <img
                      key={idx}
                      src={photo}
                      alt=""
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {comments.length === 0 && (
          <p className="text-center text-stone-500 py-8">
            Noch keine Kommentare. Sei der Erste!
          </p>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteCommentId} onOpenChange={() => setDeleteCommentId(null)}>
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
              onClick={() => deleteCommentMutation.mutate(deleteCommentId)}
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