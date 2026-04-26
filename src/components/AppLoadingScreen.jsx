import { Loader2, Mountain } from "lucide-react";

export default function AppLoadingScreen({ extended = false }) {
  return (
    <div className="fixed inset-0 z-[100] overflow-hidden bg-slate-950 text-white">
      <img
        src="/splash/autumn-hero.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: "center 38%" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/65 via-slate-950/45 to-slate-950/70" />

      <div className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <div className="mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-white/15 backdrop-blur-sm ring-1 ring-white/20">
          {extended ? (
            <Loader2 className="h-8 w-8 animate-spin" />
          ) : (
            <Mountain className="h-8 w-8" />
          )}
        </div>
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-white/70">
          DogHike
        </p>
        <h1 className="max-w-xl text-4xl font-light leading-tight tracking-tight md:text-6xl">
          {extended ? "Wir bereiten deine Touren vor" : "Hundefreundliche Wanderungen"}
        </h1>
        <p className="mt-5 max-w-md text-base leading-relaxed text-white/75 md:text-lg">
          {extended
            ? "Die App lädt gerade Daten, Karten und deine Einstellungen."
            : "Entdecke schöne Wege in Südtirol zusammen mit deinem Vierbeiner."}
        </p>
      </div>
    </div>
  );
}
