import { Bell } from "lucide-react";

export default function Notifications() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-slate-50 flex items-center justify-center px-4">
      <div className="text-center max-w-xs">
        <Bell className="w-14 h-14 text-stone-200 mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-stone-700 mb-2">Benachrichtigungen</h1>
        <p className="text-stone-400 text-sm">Benachrichtigungen sind noch nicht verfügbar. Diese Funktion kommt bald.</p>
      </div>
    </div>
  );
}
