import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import {
  ShieldCheck, Clock, CheckCircle2, XCircle, ChevronDown,
  ChevronUp, Loader2, AlertTriangle, User, MapPin, Ruler,
  Mountain, Image as ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { getPendingEntries, approveEntry, rejectEntry } from "@/lib/adminApi";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

function EntryCard({ entry, onApprove, onReject, approving, rejecting }) {
  const [expanded, setExpanded] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [reason, setReason] = useState("");

  const authorName =
    entry.profiles?.full_name ||
    entry.profiles?.username ||
    "Unbekannter Nutzer";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -40 }}
      className="bg-white rounded-2xl border border-stone-200/60 shadow-sm overflow-hidden"
    >
      {/* Header row */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200">
                ⏳ Wartet auf Prüfung
              </span>
              <span className="text-xs text-stone-400">
                {format(new Date(entry.created_at), "d. MMM yyyy, HH:mm", { locale: de })}
              </span>
            </div>

            <h3 className="text-lg font-semibold text-stone-800 truncate">{entry.title}</h3>

            <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-stone-500">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> {authorName}
              </span>
              {entry.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {entry.location}
                </span>
              )}
              {entry.date && (
                <span>📅 {format(new Date(entry.date), "d. MMM yyyy", { locale: de })}</span>
              )}
            </div>

            {/* Quick stats */}
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-stone-500">
              {entry.distance_km && <span className="flex items-center gap-1"><Ruler className="w-3 h-3" />{entry.distance_km} km</span>}
              {entry.elevation_m && <span className="flex items-center gap-1"><Mountain className="w-3 h-3" />{entry.elevation_m} Hm</span>}
              {entry.photos?.length > 0 && <span className="flex items-center gap-1"><ImageIcon className="w-3 h-3" />{entry.photos.length} Foto{entry.photos.length !== 1 ? "s" : ""}</span>}
              {entry.dog_suitable && <span>🐕 Hundefreundlich</span>}
            </div>
          </div>
        </div>

        {/* Toggle detail */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600 transition-colors"
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {expanded ? "Weniger anzeigen" : "Details anzeigen"}
        </button>
      </div>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 space-y-4 border-t border-stone-100 pt-4">
              {/* Description */}
              {entry.description && (
                <div>
                  <Label className="text-xs text-stone-500 uppercase tracking-wide">Beschreibung</Label>
                  <p className="text-sm text-stone-700 mt-1 whitespace-pre-wrap">{entry.description}</p>
                </div>
              )}

              {/* Hazard notes */}
              {entry.hazard_notes && (
                <div className="flex gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-amber-700">Gefahrenhinweise</p>
                    <p className="text-sm text-amber-700 mt-0.5">{entry.hazard_notes}</p>
                  </div>
                </div>
              )}

              {/* Photos */}
              {entry.photos?.length > 0 && (
                <div>
                  <Label className="text-xs text-stone-500 uppercase tracking-wide">Fotos</Label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
                    {entry.photos.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                        <img
                          src={url}
                          alt={`Foto ${i + 1}`}
                          className="w-full aspect-square object-cover rounded-lg hover:opacity-90 transition-opacity"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* GPX link */}
              {entry.gpx_url && (
                <div>
                  <Label className="text-xs text-stone-500 uppercase tracking-wide">GPX-Datei</Label>
                  <a href={entry.gpx_url} target="_blank" rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline mt-1 block">
                    GPX herunterladen
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action bar */}
      <div className="px-5 pb-5">
        {!showRejectForm ? (
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => onApprove(entry.id)}
              disabled={approving || rejecting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              size="sm"
            >
              {approving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-1.5" />}
              Genehmigen
            </Button>
            <Button
              onClick={() => setShowRejectForm(true)}
              disabled={approving || rejecting}
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50"
              size="sm"
            >
              <XCircle className="w-4 h-4 mr-1.5" />
              Ablehnen
            </Button>
          </div>
        ) : (
          <div className="space-y-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <Label className="text-sm font-medium text-red-700">Ablehnungsgrund (optional)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="z.B. Inhalt nicht relevant, Fotos fehlen, unzureichende Beschreibung..."
              rows={2}
              className="text-sm bg-white"
            />
            <div className="flex gap-2">
              <Button
                onClick={() => onReject(entry.id, reason)}
                disabled={rejecting}
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {rejecting ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <XCircle className="w-4 h-4 mr-1.5" />}
                Ablehnen bestätigen
              </Button>
              <Button
                onClick={() => { setShowRejectForm(false); setReason(""); }}
                variant="outline" size="sm"
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

export default function AdminDashboard() {
  const { isAuthenticated, isAdmin, isLoadingAuth } = useAuth();
  const queryClient = useQueryClient();
  const [processingId, setProcessingId] = useState(null);
  const [processingType, setProcessingType] = useState(null);

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["admin_pending"],
    queryFn: getPendingEntries,
    enabled: isAdmin,
    refetchInterval: 60_000, // refresh every minute
  });

  const approveMutation = useMutation({
    mutationFn: (id) => approveEntry(id),
    onMutate: (id) => { setProcessingId(id); setProcessingType("approve"); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_pending"] });
      toast.success("Eintrag genehmigt ✅");
    },
    onError: (e) => toast.error("Fehler: " + e.message),
    onSettled: () => { setProcessingId(null); setProcessingType(null); },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => rejectEntry(id, reason),
    onMutate: ({ id }) => { setProcessingId(id); setProcessingType("reject"); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_pending"] });
      toast.success("Eintrag abgelehnt ❌");
    },
    onError: (e) => toast.error("Fehler: " + e.message),
    onSettled: () => { setProcessingId(null); setProcessingType(null); },
  });

  // Loading auth
  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-stone-400 animate-spin" />
      </div>
    );
  }

  // Not logged in
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <ShieldCheck className="w-12 h-12 text-stone-300 mx-auto mb-4" />
          <p className="text-stone-600 font-medium">Bitte zuerst anmelden.</p>
          <Link to={createPageUrl("Login")}>
            <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700">Anmelden</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <ShieldCheck className="w-12 h-12 text-red-300 mx-auto mb-4" />
          <p className="text-stone-700 font-semibold text-lg">Kein Zugriff</p>
          <p className="text-stone-500 text-sm mt-1">Diese Seite ist nur für Administratoren.</p>
          <Link to="/">
            <Button variant="outline" className="mt-4">Zurück zur Startseite</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-slate-50/30 pb-24 md:pb-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 md:py-10">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="bg-slate-800 rounded-xl p-2">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800">Admin Dashboard</h1>
          </div>
          <p className="text-stone-500 text-sm mt-1 ml-12">
            Öffentliche Wandertagebuch-Einträge prüfen und freigeben
          </p>
        </motion.div>

        {/* Stats bar */}
        <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm p-4 mb-6 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-yellow-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-stone-800 leading-none">{entries.length}</p>
              <p className="text-xs text-stone-500">Wartet auf Prüfung</p>
            </div>
          </div>
          {entries.length === 0 && (
            <p className="text-sm text-emerald-600 font-medium ml-auto">
              ✅ Alles erledigt!
            </p>
          )}
        </div>

        {/* Entries */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-stone-400 animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-20 bg-white rounded-2xl border border-stone-200/50"
          >
            <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-stone-700 mb-2">Keine offenen Einträge</h3>
            <p className="text-stone-500 text-sm">Alle Einträge wurden geprüft.</p>
          </motion.div>
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
      </div>
    </div>
  );
}
