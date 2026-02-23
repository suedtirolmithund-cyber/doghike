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
  Mail, User, ChevronDown, ChevronUp, Star, Edit2, Save, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

export default function AdminReview() {
  const [expandedId, setExpandedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [confirmDialog, setConfirmDialog] = useState({ open: false, type: null, hike: null });
  const queryClient = useQueryClient();

  const { data: pendingHikes = [], isLoading } = useQuery({
    queryKey: ["pending-hikes"],
    queryFn: () => base44.entities.Hike.filter({ status: "pending" }, "-created_date")
  });

  const { data: pendingChangesHikes = [] } = useQuery({
    queryKey: ["pending-changes-hikes"],
    queryFn: () => base44.entities.Hike.filter({ pending_changes_status: "pending" }, "-updated_date")
  });

  const { data: allHikes = [] } = useQuery({
    queryKey: ["all-admin-hikes"],
    queryFn: () => base44.entities.Hike.filter({ status: "approved" }, "-created_date", 200)
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Hike.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-hikes"] });
      queryClient.invalidateQueries({ queryKey: ["all-admin-hikes"] });
      queryClient.invalidateQueries({ queryKey: ["hikes"] });
      setConfirmDialog({ open: false, type: null, hike: null });
      setEditingId(null);
    }
  });

  const handleAction = (type) => {
    if (confirmDialog.hike) {
      updateMutation.mutate({
        id: confirmDialog.hike.id,
        data: { status: type === "approve" ? "approved" : "rejected" }
      });
    }
  };

  const startEdit = (hike) => {
    setEditingId(hike.id);
    setEditData({ ...hike });
  };

  const saveEdit = (id) => {
    const dataToSave = {
      ...editData,
      distance_km: editData.distance_km ? Number(editData.distance_km) : null,
      elevation_gain_m: editData.elevation_gain_m ? Number(editData.elevation_gain_m) : null,
      duration_minutes: editData.duration_minutes ? Number(editData.duration_minutes) : null,
      rating: editData.rating ? Number(editData.rating) : null,
    };
    updateMutation.mutate({ id, data: dataToSave });
  };

  const approvePendingChangesMutation = useMutation({
    mutationFn: ({ id, changes }) => base44.entities.Hike.update(id, {
      ...changes,
      pending_changes: null,
      pending_changes_status: "approved",
      pending_changes_rejection_reason: null
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-changes-hikes"] });
      queryClient.invalidateQueries({ queryKey: ["all-admin-hikes"] });
      queryClient.invalidateQueries({ queryKey: ["hikes"] });
    }
  });

  const rejectPendingChangesMutation = useMutation({
    mutationFn: ({ id, reason }) => base44.entities.Hike.update(id, {
      pending_changes: null,
      pending_changes_status: "rejected",
      pending_changes_rejection_reason: reason || "Änderung abgelehnt"
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-changes-hikes"] });
    }
  });

  const [activeTab, setActiveTab] = useState("pending");
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectChangesDialog, setRejectChangesDialog] = useState({ open: false, hike: null });

  const hikesToShow = activeTab === "pending" ? pendingHikes : activeTab === "changes" ? pendingChangesHikes : allHikes;

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
          <h1 className="text-3xl font-light text-stone-800">Admin – Touren verwalten</h1>
          <p className="text-stone-500 mt-1">
            {pendingHikes.length} {pendingHikes.length === 1 ? "Tour wartet" : "Touren warten"} auf Freigabe
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === "pending" ? "default" : "outline"}
            onClick={() => setActiveTab("pending")}
            className={activeTab === "pending" ? "bg-slate-800" : ""}
          >
            Ausstehend ({pendingHikes.length})
          </Button>
          <Button
            variant={activeTab === "approved" ? "default" : "outline"}
            onClick={() => setActiveTab("approved")}
            className={activeTab === "approved" ? "bg-slate-800" : ""}
          >
            Veröffentlicht ({allHikes.length})
          </Button>
        </div>

        {hikesToShow.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 bg-white rounded-2xl border border-stone-200/50"
          >
            <Check className="w-16 h-16 text-emerald-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-stone-700 mb-2">
              {activeTab === "pending" ? "Alles erledigt!" : "Keine Touren"}
            </h3>
            <p className="text-stone-500">
              {activeTab === "pending" ? "Keine neuen Einreichungen." : "Noch keine veröffentlichten Touren."}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {hikesToShow.map((hike, index) => (
                <motion.div
                  key={hike.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.03 }}
                  className="bg-white rounded-2xl border border-stone-200/50 shadow-sm overflow-hidden"
                >
                  {/* Header */}
                  <div
                    className="p-5 cursor-pointer hover:bg-stone-50 transition-colors"
                    onClick={() => setExpandedId(expandedId === hike.id ? null : hike.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="text-lg font-medium text-stone-800">{hike.trail_name}</h3>
                          <Badge className={
                            hike.status === "approved" ? "bg-emerald-100 text-emerald-700" :
                            hike.status === "pending" ? "bg-amber-100 text-amber-700" :
                            "bg-red-100 text-red-700"
                          }>
                            {hike.status === "approved" ? "Freigegeben" : hike.status === "pending" ? "Ausstehend" : "Abgelehnt"}
                          </Badge>
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
                            {hike.submitted_by_name || hike.created_by || "Unbekannt"}
                          </span>
                          {hike.distance_km && <span>📏 {hike.distance_km} km</span>}
                          {hike.created_date && (
                            <span>{format(new Date(hike.created_date), "dd.MM.yyyy", { locale: de })}</span>
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
                          {editingId === hike.id ? (
                            /* ── EDIT MODE ── */
                            <div className="space-y-5">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <Label>Name der Tour *</Label>
                                  <Input
                                    value={editData.trail_name || ""}
                                    onChange={(e) => setEditData({ ...editData, trail_name: e.target.value })}
                                    className="text-base h-11"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label>Ort / Region</Label>
                                  <Input
                                    value={editData.location || ""}
                                    onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                                    className="text-base h-11"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label>Distanz (km)</Label>
                                  <Input
                                    type="number" step="0.1"
                                    value={editData.distance_km || ""}
                                    onChange={(e) => setEditData({ ...editData, distance_km: e.target.value })}
                                    className="text-base h-11"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label>Höhenmeter (m)</Label>
                                  <Input
                                    type="number"
                                    value={editData.elevation_gain_m || ""}
                                    onChange={(e) => setEditData({ ...editData, elevation_gain_m: e.target.value })}
                                    className="text-base h-11"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label>Gehzeit (Minuten)</Label>
                                  <Input
                                    type="number"
                                    value={editData.duration_minutes || ""}
                                    onChange={(e) => setEditData({ ...editData, duration_minutes: e.target.value })}
                                    className="text-base h-11"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label>Datum</Label>
                                  <Input
                                    type="date"
                                    value={editData.date || ""}
                                    onChange={(e) => setEditData({ ...editData, date: e.target.value })}
                                    className="text-base h-11"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label>Schwierigkeit (Mensch) 👤</Label>
                                  <Select value={editData.difficulty || ""} onValueChange={(v) => setEditData({ ...editData, difficulty: v })}>
                                    <SelectTrigger className="h-11 text-base"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      {["1","2","3","4","5"].map(v => <SelectItem key={v} value={v}>Stufe {v}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-1">
                                  <Label>Schwierigkeit (Hund) 🐕</Label>
                                  <Select value={editData.dog_difficulty || ""} onValueChange={(v) => setEditData({ ...editData, dog_difficulty: v })}>
                                    <SelectTrigger className="h-11 text-base"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      {["1","2","3","4","5"].map(v => <SelectItem key={v} value={v}>Stufe {v}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-1">
                                  <Label>Beste Jahreszeit</Label>
                                  <Select value={editData.season || ""} onValueChange={(v) => setEditData({ ...editData, season: v })}>
                                    <SelectTrigger className="h-11 text-base"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="spring">🌸 Frühling</SelectItem>
                                      <SelectItem value="summer">☀️ Sommer</SelectItem>
                                      <SelectItem value="autumn">🍂 Herbst</SelectItem>
                                      <SelectItem value="winter">❄️ Winter</SelectItem>
                                      <SelectItem value="all_year">🍃 Ganzjährig</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-1">
                                  <Label>Wasser unterwegs 💧</Label>
                                  <Select value={editData.water_availability || ""} onValueChange={(v) => setEditData({ ...editData, water_availability: v })}>
                                    <SelectTrigger className="h-11 text-base"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none">🚫 Kein Wasser</SelectItem>
                                      <SelectItem value="little">💧 Wenig</SelectItem>
                                      <SelectItem value="moderate">💧💧 Etwas</SelectItem>
                                      <SelectItem value="plenty">💧💧💧 Viel</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-1">
                                  <Label>Status</Label>
                                  <Select value={editData.status || ""} onValueChange={(v) => setEditData({ ...editData, status: v })}>
                                    <SelectTrigger className="h-11 text-base"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="draft">Entwurf</SelectItem>
                                      <SelectItem value="pending">Ausstehend</SelectItem>
                                      <SelectItem value="approved">Freigegeben</SelectItem>
                                      <SelectItem value="rejected">Abgelehnt</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-1">
                                  <Label>Sichtbarkeit</Label>
                                  <Select value={editData.visibility || ""} onValueChange={(v) => setEditData({ ...editData, visibility: v })}>
                                    <SelectTrigger className="h-11 text-base"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="private">🔒 Privat</SelectItem>
                                      <SelectItem value="friends">👥 Freunde</SelectItem>
                                      <SelectItem value="public">🌍 Öffentlich</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              <div className="space-y-1">
                                <Label>Beschreibung & Tipps</Label>
                                <Textarea
                                  value={editData.notes || ""}
                                  onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                                  rows={5}
                                  className="text-base resize-y"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label>⚠️ Gefahrenstellen</Label>
                                <Textarea
                                  value={editData.hazard_notes || ""}
                                  onChange={(e) => setEditData({ ...editData, hazard_notes: e.target.value })}
                                  rows={3}
                                  className="text-base resize-y"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label>🅿️ Parken & Ausgangspunkt</Label>
                                <Textarea
                                  value={editData.parking_info || ""}
                                  onChange={(e) => setEditData({ ...editData, parking_info: e.target.value })}
                                  rows={3}
                                  className="text-base resize-y"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label>🍽️ Einkehrmöglichkeiten</Label>
                                <Textarea
                                  value={editData.restaurant_info || ""}
                                  onChange={(e) => setEditData({ ...editData, restaurant_info: e.target.value })}
                                  rows={3}
                                  className="text-base resize-y"
                                />
                              </div>

                              {/* Bewertung */}
                              <div className="space-y-1">
                                <Label>Bewertung</Label>
                                <div className="flex gap-2">
                                  {[1,2,3,4,5].map(s => (
                                    <button
                                      key={s}
                                      type="button"
                                      onClick={() => setEditData({ ...editData, rating: s })}
                                      className="p-1 transition-transform hover:scale-110"
                                    >
                                      <Star className={`w-8 h-8 ${s <= (editData.rating || 0) ? "fill-amber-400 text-amber-400" : "text-stone-300"}`} />
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div className="flex gap-3 pt-2">
                                <Button
                                  onClick={() => saveEdit(hike.id)}
                                  disabled={updateMutation.isPending}
                                  className="bg-emerald-600 hover:bg-emerald-700 flex-1"
                                >
                                  {updateMutation.isPending ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  ) : (
                                    <Save className="w-4 h-4 mr-2" />
                                  )}
                                  Speichern
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => setEditingId(null)}
                                  className="flex-1"
                                >
                                  <X className="w-4 h-4 mr-2" />
                                  Abbrechen
                                </Button>
                              </div>
                            </div>
                          ) : (
                            /* ── VIEW MODE ── */
                            <div>
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

                              {hike.submitted_by_email && (
                                <div className="bg-blue-50 rounded-xl p-3 mb-4 flex items-center gap-2">
                                  <Mail className="w-4 h-4 text-blue-600" />
                                  <a href={`mailto:${hike.submitted_by_email}`} className="text-blue-600 hover:underline">
                                    {hike.submitted_by_email}
                                  </a>
                                </div>
                              )}

                              {hike.notes && (
                                <div className="mb-4">
                                  <h4 className="text-sm font-medium text-stone-700 mb-2">Beschreibung:</h4>
                                  <p className="text-stone-600 text-sm whitespace-pre-wrap bg-stone-50 p-3 rounded-xl">
                                    {hike.notes}
                                  </p>
                                </div>
                              )}

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
                              <div className="flex gap-2 pt-4 border-t border-stone-100 flex-wrap">
                                <Button
                                  onClick={() => startEdit(hike)}
                                  variant="outline"
                                  className="flex-1"
                                >
                                  <Edit2 className="w-4 h-4 mr-2" />
                                  Bearbeiten
                                </Button>
                                {hike.status === "pending" && (
                                  <>
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
                                  </>
                                )}
                                <Link to={createPageUrl("HikeDetail") + `?id=${hike.id}`}>
                                  <Button variant="outline">
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          )}
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