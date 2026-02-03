import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  ArrowLeft, Check, X, Eye, MapPin, Clock, Mountain, Route,
  Mail, User, ChevronDown, ChevronUp, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/alert-dialog";

const difficultyLabels = {
  easy: "Leicht",
  moderate: "Mittel",
  challenging: "Anspruchsvoll",
  difficult: "Schwer"
};

const difficultyColors = {
  easy: "bg-emerald-100 text-emerald-700",
  moderate: "bg-amber-100 text-amber-700",
  challenging: "bg-orange-100 text-orange-700",
  difficult: "bg-red-100 text-red-700"
};

export default function AdminReview() {
  const [expandedId, setExpandedId] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, type: null, hike: null });
  const queryClient = useQueryClient();

  const { data: pendingHikes = [], isLoading } = useQuery({
    queryKey: ["pending-hikes"],
    queryFn: () => base44.entities.Hike.filter({ status: "pending" }, "-created_date")
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Hike.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-hikes"] });
      setConfirmDialog({ open: false, type: null, hike: null });
    }
  });

  const handleAction = (type) => {
    if (confirmDialog.hike) {
      updateMutation.mutate({
        id: confirmDialog.hike.id,
        status: type === "approve" ? "approved" : "rejected"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link to={createPageUrl("Dashboard")}>
            <Button variant="ghost" className="mb-4 text-stone-600">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zurück
            </Button>
          </Link>
          <h1 className="text-3xl font-light text-stone-800">Einreichungen prüfen</h1>
          <p className="text-stone-500 mt-1">
            {pendingHikes.length} {pendingHikes.length === 1 ? "Tour wartet" : "Touren warten"} auf Freigabe
          </p>
        </motion.div>

        {pendingHikes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 bg-white rounded-2xl border border-stone-200/50"
          >
            <Check className="w-16 h-16 text-emerald-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-stone-700 mb-2">Alles erledigt!</h3>
            <p className="text-stone-500">Keine neuen Einreichungen zum Prüfen.</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {pendingHikes.map((hike, index) => (
                <motion.div
                  key={hike.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-2xl border border-stone-200/50 shadow-sm overflow-hidden"
                >
                  {/* Header */}
                  <div
                    className="p-5 cursor-pointer hover:bg-stone-50 transition-colors"
                    onClick={() => setExpandedId(expandedId === hike.id ? null : hike.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-medium text-stone-800">{hike.trail_name}</h3>
                          {hike.difficulty && (
                            <Badge className={difficultyColors[hike.difficulty]}>
                              {difficultyLabels[hike.difficulty]}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-stone-500">
                          {hike.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {hike.location}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5" />
                            {hike.submitted_by_name || "Unbekannt"}
                          </span>
                          {hike.created_date && (
                            <span>
                              Eingereicht am {format(new Date(hike.created_date), "dd.MM.yyyy", { locale: de })}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {expandedId === hike.id ? (
                          <ChevronUp className="w-5 h-5 text-stone-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-stone-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {expandedId === hike.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 border-t border-stone-100 pt-4">
                          {/* Stats */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                            {hike.distance_km && (
                              <div className="bg-stone-50 rounded-xl p-3 text-center">
                                <Route className="w-4 h-4 text-stone-400 mx-auto mb-1" />
                                <p className="font-medium text-stone-800">{hike.distance_km} km</p>
                              </div>
                            )}
                            {hike.elevation_gain_m && (
                              <div className="bg-stone-50 rounded-xl p-3 text-center">
                                <Mountain className="w-4 h-4 text-stone-400 mx-auto mb-1" />
                                <p className="font-medium text-stone-800">{hike.elevation_gain_m} Hm</p>
                              </div>
                            )}
                            {hike.duration_minutes && (
                              <div className="bg-stone-50 rounded-xl p-3 text-center">
                                <Clock className="w-4 h-4 text-stone-400 mx-auto mb-1" />
                                <p className="font-medium text-stone-800">
                                  {Math.floor(hike.duration_minutes / 60)}h {hike.duration_minutes % 60}min
                                </p>
                              </div>
                            )}
                            {hike.rating && (
                              <div className="bg-stone-50 rounded-xl p-3 text-center">
                                <div className="flex justify-center gap-0.5 mb-1">
                                  {[1,2,3,4,5].map(s => (
                                    <Star key={s} className={`w-3 h-3 ${s <= hike.rating ? "fill-amber-400 text-amber-400" : "text-stone-300"}`} />
                                  ))}
                                </div>
                                <p className="font-medium text-stone-800">{hike.rating}/5</p>
                              </div>
                            )}
                          </div>

                          {/* Contact */}
                          {hike.submitted_by_email && (
                            <div className="bg-blue-50 rounded-xl p-3 mb-4 flex items-center gap-2">
                              <Mail className="w-4 h-4 text-blue-600" />
                              <a href={`mailto:${hike.submitted_by_email}`} className="text-blue-600 hover:underline">
                                {hike.submitted_by_email}
                              </a>
                            </div>
                          )}

                          {/* Notes */}
                          {hike.notes && (
                            <div className="mb-4">
                              <h4 className="text-sm font-medium text-stone-700 mb-2">Beschreibung:</h4>
                              <p className="text-stone-600 text-sm whitespace-pre-wrap bg-stone-50 p-3 rounded-xl">
                                {hike.notes}
                              </p>
                            </div>
                          )}

                          {/* Photos */}
                          {hike.photos?.length > 0 && (
                            <div className="mb-4">
                              <h4 className="text-sm font-medium text-stone-700 mb-2">Fotos:</h4>
                              <div className="flex flex-wrap gap-2">
                                {hike.photos.map((photo, i) => (
                                  <a key={i} href={photo} target="_blank" rel="noopener noreferrer">
                                    <img
                                      src={photo}
                                      alt={`Foto ${i + 1}`}
                                      className="w-20 h-20 object-cover rounded-lg hover:ring-2 ring-slate-400"
                                    />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex gap-3 pt-4 border-t border-stone-100">
                            <Button
                              onClick={() => setConfirmDialog({ open: true, type: "approve", hike })}
                              className="bg-emerald-600 hover:bg-emerald-700 flex-1"
                            >
                              <Check className="w-4 h-4 mr-2" />
                              Freigeben
                            </Button>
                            <Button
                              onClick={() => setConfirmDialog({ open: true, type: "reject", hike })}
                              variant="outline"
                              className="border-red-200 text-red-600 hover:bg-red-50 flex-1"
                            >
                              <X className="w-4 h-4 mr-2" />
                              Ablehnen
                            </Button>
                            <Link to={createPageUrl("HikeDetail") + `?id=${hike.id}`}>
                              <Button variant="outline">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.type === "approve" ? "Tour freigeben?" : "Tour ablehnen?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.type === "approve"
                ? `"${confirmDialog.hike?.trail_name}" wird für alle Besucher sichtbar.`
                : `"${confirmDialog.hike?.trail_name}" wird nicht veröffentlicht.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleAction(confirmDialog.type)}
              className={confirmDialog.type === "approve" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}
            >
              {confirmDialog.type === "approve" ? "Freigeben" : "Ablehnen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}