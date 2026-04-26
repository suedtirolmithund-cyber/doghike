import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, Mountain } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { createPageUrl } from "@/utils";
import { useAuth } from "@/lib/AuthContext";

function mapAuthError(message) {
  const msg = String(message || "").toLowerCase();
  if (msg.includes("invalid login credentials")) return "E-Mail oder Passwort stimmen nicht.";
  if (msg.includes("email not confirmed")) return "Bitte bestätige zuerst deine E-Mail-Adresse.";
  if (msg.includes("user already registered")) return "Für diese E-Mail gibt es schon ein Konto.";
  if (msg.includes("password should be at least")) return "Das Passwort ist zu kurz.";
  if (msg.includes("unable to validate email address")) return "Bitte gib eine gültige E-Mail-Adresse ein.";
  if (msg.includes("signup is disabled")) return "Registrierungen sind gerade nicht möglich.";
  return "Das hat gerade nicht geklappt. Bitte versuche es noch einmal.";
}

export default function GuestWelcomeScreen() {
  const { loginWithEmail, signUpWithEmail, loginWithGoogle, authError } = useAuth();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const error = localError || authError;

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setLocalError(null);
    setSuccessMsg(null);
    setPassword("");
    setConfirmPassword("");
    setPrivacyAccepted(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLocalError(null);
    setSuccessMsg(null);

    if (!email || !password) {
      setLocalError("Bitte E-Mail und Passwort eingeben.");
      return;
    }

    if (mode === "register") {
      if (password.length < 6) {
        setLocalError("Das Passwort muss mindestens 6 Zeichen lang sein.");
        return;
      }
      if (password !== confirmPassword) {
        setLocalError("Die Passwörter stimmen nicht überein.");
        return;
      }
      if (!privacyAccepted) {
        setLocalError("Bitte akzeptiere die Datenschutzerklärung.");
        return;
      }

      setLoading(true);
      const { error: err } = await signUpWithEmail(email, password);
      setLoading(false);
      if (err) {
        setLocalError(mapAuthError(err.message));
      } else {
        setSuccessMsg("Registrierung erfolgreich. Bitte bestätige dein Konto per E-Mail.");
        setPassword("");
        setConfirmPassword("");
      }
      return;
    }

    setLoading(true);
    const { error: err } = await loginWithEmail(email, password);
    setLoading(false);
    if (err) setLocalError(mapAuthError(err.message));
  };

  const handleGoogle = async () => {
    setLocalError(null);
    setSuccessMsg(null);
    if (mode === "register" && !privacyAccepted) {
      setLocalError("Bitte akzeptiere die Datenschutzerklärung.");
      return;
    }
    setGoogleLoading(true);
    const result = await loginWithGoogle();
    if (result?.error) {
      setGoogleLoading(false);
      setLocalError(mapAuthError(result.error.message));
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <img
        src="/splash/autumn-hero.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: "center 38%" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/50 via-slate-950/35 to-slate-950/70" />

      <main className="relative mx-auto grid min-h-screen w-full max-w-6xl items-center gap-10 px-5 py-10 md:grid-cols-[1fr_390px] md:px-8">
        <section className="pt-8 text-center md:text-left">
          <div className="mx-auto mb-7 grid h-14 w-14 place-items-center rounded-2xl bg-white/15 backdrop-blur-sm ring-1 ring-white/20 md:mx-0">
            <Mountain className="h-7 w-7" />
          </div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-white/70">
            Willkommen bei DogHike
          </p>
          <h1 className="max-w-2xl text-5xl font-light leading-[1.05] tracking-tight md:text-7xl">
            Wandern mit Hund wird einfacher.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/75">
            Plane hundefreundliche Touren, speichere deine Lieblingswege und entdecke passende
            Wanderungen in Südtirol.
          </p>
        </section>

        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-[28px] bg-white/14 p-5 shadow-2xl ring-1 ring-white/20 backdrop-blur-md"
        >
          <h2 className="mb-5 text-4xl font-semibold text-white">
            {mode === "register" ? "Registrieren" : "Login"}
          </h2>
          <div className="mb-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => switchMode("register")}
              className={`h-11 rounded-2xl text-sm font-semibold transition ${
                mode === "register" ? "bg-brand-400 text-white" : "bg-white/15 text-white"
              }`}
            >
              Registrieren
            </button>
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`h-11 rounded-2xl text-sm font-semibold transition ${
                mode === "login" ? "bg-brand-400 text-white" : "bg-white/15 text-white"
              }`}
            >
              Login
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              placeholder="E-Mail Adresse"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-14 w-full rounded-2xl border-0 bg-white/90 px-4 text-base text-stone-900 outline-none placeholder:text-stone-500"
              autoComplete="email"
              required
            />
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Passwort"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-14 w-full rounded-2xl border-0 bg-white/90 px-4 pr-12 text-base text-stone-900 outline-none placeholder:text-stone-500"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            {mode === "register" && (
              <>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Passwort bestätigen"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="h-14 w-full rounded-2xl border-0 bg-white/90 px-4 text-base text-stone-900 outline-none placeholder:text-stone-500"
                  autoComplete="new-password"
                />
                <div className="flex items-start gap-3 px-1">
                  <Checkbox
                    id="guest-privacy"
                    checked={privacyAccepted}
                    onCheckedChange={setPrivacyAccepted}
                    className="mt-0.5 border-white/70 data-[state=checked]:bg-brand-400 data-[state=checked]:border-brand-400"
                  />
                  <label htmlFor="guest-privacy" className="text-xs leading-relaxed text-white/80">
                    Ich akzeptiere die{" "}
                    <Link to={createPageUrl("Datenschutz")} className="underline" target="_blank">
                      Datenschutzerklärung
                    </Link>
                    .
                  </label>
                </div>
              </>
            )}

            <Feedback error={error} success={successMsg} />

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand-400 font-semibold text-white transition hover:bg-brand-500 disabled:opacity-70"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "login" ? "Anmelden" : "Konto erstellen"}
            </button>
          </form>

          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/20" />
            <span className="text-xs text-white/60">oder</span>
            <div className="h-px flex-1 bg-white/20" />
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading || googleLoading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white/15 text-sm font-semibold text-white transition hover:bg-white/20 disabled:opacity-70"
          >
            {googleLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Mit Google {mode === "login" ? "anmelden" : "registrieren"}
          </button>

          <p className="mt-4 text-center text-xs text-white/55">
            <Link to={createPageUrl("Datenschutz")} className="hover:text-white">Datenschutz</Link>
            {" · "}
            <Link to={createPageUrl("Legal")} className="hover:text-white">Nutzungsbedingungen</Link>
          </p>
        </motion.section>
      </main>
    </div>
  );
}

function Feedback({ error, success }) {
  if (!error && !success) return null;
  return (
    <div
      className={`flex items-start gap-2 rounded-2xl p-3 text-sm ${
        error ? "bg-red-500/15 text-red-100" : "bg-emerald-500/15 text-emerald-100"
      }`}
    >
      {error ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
      <span>{error || success}</span>
    </div>
  );
}
