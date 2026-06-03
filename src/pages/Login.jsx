import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import DogTrailsLogoMark from "@/components/brand/DogTrailsLogoMark";
import BackButton from "@/components/ui/BackButton";

const BROWN = "#A8003C";
const BROWN_DARK = "#7C3020";

function FourToePaw({ className = "" }) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={className}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="11.5" cy="25" r="6.5" />
      <circle cx="24" cy="13.5" r="6.8" />
      <circle cx="40" cy="13.5" r="6.8" />
      <circle cx="52.5" cy="25" r="6.5" />
      <path d="M17.3 48.7c0-10.5 7.3-18.4 15.7-18.4s15.7 7.9 15.7 18.4c0 6.1-3.6 8.8-8.1 7.4-2.6-.8-4.8-1.7-7.6-1.7s-5 0.9-7.6 1.7c-4.5 1.4-8.1-1.3-8.1-7.4Z" />
    </svg>
  );
}

function LoginBrandIntro() {
  return (
    <div className="relative z-10 w-full max-w-sm px-4 text-center" style={{ fontFamily: "Nunito, sans-serif" }}>
      <DogTrailsLogoMark className="mx-auto mb-2 h-16 w-16 drop-shadow-[0_10px_22px_rgba(116,28,59,0.28)] sm:h-[74px] sm:w-[74px]" />
      <p className="text-[28px] font-extrabold uppercase leading-[30px] tracking-[0.01em] text-white drop-shadow-[0_4px_14px_rgba(116,28,59,0.34)] sm:text-[32px] sm:leading-[34px]">
        WILLKOMMEN BEI DOGTRAILS
      </p>
      <div className="mt-3 flex items-center justify-center gap-3 text-white drop-shadow-[0_3px_10px_rgba(116,28,59,0.28)] sm:mt-4">
        <FourToePaw className="h-5 w-5 sm:h-6 sm:w-6" />
        <FourToePaw className="h-5 w-5 sm:h-6 sm:w-6" />
        <FourToePaw className="h-5 w-5 sm:h-6 sm:w-6" />
      </div>
      <p className="mx-auto mt-4 max-w-[320px] text-[18px] font-semibold leading-[22px] text-white drop-shadow-[0_3px_10px_rgba(116,28,59,0.3)] sm:text-[20px] sm:leading-[24px]">
        Plane hundefreundliche Wanderungen, speichere deine Lieblingswanderungen und entdecke neue Ziele
      </p>
    </div>
  );
}

function mapAuthError(message) {
  const msg = String(message || "").toLowerCase();

  if (msg.includes("invalid login credentials")) {
    return "E-Mail oder Passwort stimmen nicht.";
  }
  if (msg.includes("email not confirmed")) {
    return "Bitte bestätige zuerst deine E-Mail-Adresse.";
  }
  if (msg.includes("user already registered")) {
    return "Für diese E-Mail gibt es schon ein Konto.";
  }
  if (msg.includes("password should be at least")) {
    return "Das Passwort ist zu kurz.";
  }
  if (msg.includes("unable to validate email address")) {
    return "Bitte gib eine gültige E-Mail-Adresse ein.";
  }
  if (msg.includes("signup is disabled")) {
    return "Registrierungen sind gerade nicht möglich.";
  }
  if (msg.includes("same password")) {
    return "Bitte wähle ein anderes Passwort als bisher.";
  }
  if (msg.includes("for security purposes")) {
    return "Bitte warte einen Moment und versuche es dann noch einmal.";
  }

  return "Das hat gerade nicht geklappt. Versuch es gleich noch einmal.";
}

export default function Login() {
  const {
    loginWithEmail,
    signUpWithEmail,
    loginWithGoogle,
    resetPasswordForEmail,
    updatePassword,
    resendConfirmationEmail,
    authError,
  } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [showResend, setShowResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const error = localError || authError;

  useEffect(() => {
    const hash = window.location.hash || "";
    const search = window.location.search || "";
    const recoveryDetected =
      hash.includes("type=recovery") ||
      search.includes("type=recovery") ||
      (hash.includes("access_token=") && hash.includes("refresh_token="));

    if (recoveryDetected) {
      setMode("update-password");
      setLocalError(null);
      setSuccessMsg("Lege jetzt dein neues Passwort fest.");
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessMsg(null);

    if (!email || !password) {
      setLocalError("E-Mail und Passwort fehlen noch.");
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
        setLocalError("Bitte akzeptiere die Datenschutzerklärung und Nutzungsbedingungen.");
        return;
      }

      setLoading(true);
      const { error: err } = await signUpWithEmail(email, password, "email_registration");
      setLoading(false);

      if (err) {
        setLocalError(mapAuthError(err.message));
      } else {
        setSuccessMsg("Registrierung erfolgreich. Bitte prüfe deine E-Mails und bestätige dein Konto.");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
      }
      return;
    }

    setLoading(true);
    const { error: err } = await loginWithEmail(email, password);
    setLoading(false);

    if (err) {
      setLocalError(mapAuthError(err.message));
      setShowResend(String(err.message).toLowerCase().includes("email not confirmed"));
    } else {
      navigate(createPageUrl("Dashboard"));
    }
  };

  const handleGoogle = async () => {
    setLocalError(null);
    setSuccessMsg(null);

    if (!privacyAccepted) {
      setLocalError("Bitte akzeptiere die Datenschutzerklärung und Nutzungsbedingungen.");
      return;
    }

    setGoogleLoading(true);
    try {
      const result = await loginWithGoogle("/", mode === "register" ? "google_registration" : null);
      if (result?.error) {
        setGoogleLoading(false);
        setLocalError(mapAuthError(result.error.message));
      }
    } catch {
      setGoogleLoading(false);
      setLocalError("Anmeldung fehlgeschlagen. Bitte versuche es noch einmal.");
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setLocalError(null);
    setSuccessMsg(null);
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setPrivacyAccepted(false);
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessMsg(null);

    if (!email) {
      setLocalError("Bitte E-Mail-Adresse eingeben.");
      return;
    }

    setLoading(true);
    const { error: err } = await resetPasswordForEmail(email);
    setLoading(false);

    if (err) {
      setLocalError(mapAuthError(err.message));
    } else {
      setSuccessMsg("E-Mail gesendet. Prüfe dein Postfach.");
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessMsg(null);

    if (!password) {
      setLocalError("Bitte neues Passwort eingeben.");
      return;
    }
    if (password.length < 6) {
      setLocalError("Das Passwort muss mindestens 6 Zeichen lang sein.");
      return;
    }
    if (password !== confirmPassword) {
      setLocalError("Die Passwörter stimmen nicht überein.");
      return;
    }

    setLoading(true);
    const { error: err } = await updatePassword(password);
    setLoading(false);

    if (err) {
      setLocalError(mapAuthError(err.message));
      return;
    }

    window.history.replaceState({}, document.title, createPageUrl("Login"));
    setSuccessMsg("Passwort erfolgreich geändert. Du kannst dich jetzt anmelden.");
    setPassword("");
    setConfirmPassword("");
    setMode("login");
  };

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-start gap-4 overflow-x-hidden overflow-y-auto px-4 py-5 sm:justify-center sm:gap-5 sm:py-8">
      <div className="absolute inset-0 overflow-hidden bg-[#FDF0E8]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(249,192,48,0.92)_0,rgba(249,192,48,0.45)_20%,transparent_46%),radial-gradient(circle_at_82%_8%,rgba(240,112,48,0.82)_0,rgba(240,112,48,0.34)_22%,transparent_49%),radial-gradient(circle_at_50%_96%,rgba(168,0,60,0.58)_0,rgba(240,112,48,0.3)_32%,transparent_62%),linear-gradient(145deg,#FDF0E8_0%,#ffe6bf_47%,#F07030_100%)]" />
        <div className="absolute -left-20 top-16 h-72 w-72 rounded-full bg-[#F9C030]/45 blur-3xl md:h-[34rem] md:w-[34rem]" />
        <div className="absolute -right-24 top-28 h-80 w-80 rounded-full bg-[#F07030]/35 blur-3xl md:h-[36rem] md:w-[36rem]" />
        <div className="absolute bottom-[-8rem] left-1/2 h-96 w-[34rem] -translate-x-1/2 rounded-[50%] bg-[#A8003C]/30 blur-3xl md:w-[54rem]" />
        <svg
          className="absolute inset-x-[-8%] bottom-0 h-[43%] w-[116%] opacity-75"
          viewBox="0 0 430 170"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M0 96 L34 82 L70 92 L112 64 L152 88 L198 50 L239 90 L286 60 L329 92 L375 70 L430 88 L430 170 L0 170 Z" fill="#FFD8BD" opacity="0.78" />
          <path d="M0 121 L43 108 L83 126 L126 94 L169 119 L215 84 L259 123 L311 98 L355 126 L430 107 L430 170 L0 170 Z" fill="#F6865E" opacity="0.8" />
          <path d="M0 142 L47 131 L93 142 L141 116 L188 144 L234 111 L281 144 L334 123 L386 143 L430 134 L430 170 L0 170 Z" fill="#D4547A" opacity="0.76" />
          <path d="M0 158 L54 150 L108 158 L160 141 L215 160 L270 138 L331 158 L430 148 L430 170 L0 170 Z" fill="#A8003C" opacity="0.82" />
          <path d="M18 107 L68 95 L113 114 L159 87 L204 111 L247 80 L292 112 L343 94 L409 109" fill="none" stroke="#FFFFFF" strokeOpacity="0.28" strokeWidth="1.3" />
          <path d="M28 136 L79 127 L128 139 L178 117 L226 139 L277 115 L326 138 L391 127" fill="none" stroke="#7C3020" strokeOpacity="0.1" strokeWidth="1.1" />
        </svg>
        <div className="absolute inset-x-[-8%] bottom-[12%] h-40 rotate-[-5deg] rounded-[50%] border-t border-white/35 bg-white/12 backdrop-blur-[2px]" />
        <div className="absolute inset-x-[-10%] bottom-[20%] h-28 rotate-[4deg] rounded-[50%] border-t border-[#7C3020]/10" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.45)_0%,rgba(255,248,240,0.12)_42%,rgba(116,28,59,0.18)_100%)]" />
      </div>

      {mode !== "reset" && mode !== "update-password" && (
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <LoginBrandIntro />
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative z-10 w-full max-w-sm rounded-3xl overflow-hidden sm:mb-0"
        style={{ background: "rgba(255,255,255,0.10)", backdropFilter: "blur(2px)" }}
      >
        <div className="px-6 pt-8 pb-6">
          <h1
            className="text-4xl font-semibold mb-6"
            style={{
              color: mode === "reset" || mode === "update-password" ? "white" : BROWN_DARK,
              fontFamily: "Nunito, sans-serif",
            }}
          >
            {mode === "reset"
              ? "Passwort"
              : mode === "update-password"
                ? "Neues Passwort"
                : mode === "register"
                  ? "Registrieren"
                  : "Login"}
          </h1>

          {mode !== "reset" && mode !== "update-password" && (
            <div className="flex gap-3 mb-5">
              <button
                onClick={() => switchMode("register")}
                className="flex-1 py-2.5 rounded-xl text-base font-medium transition-all"
                style={{
                  background: mode === "register" ? BROWN : "#FDF0E8",
                  color: mode === "register" ? "white" : BROWN_DARK,
                  fontFamily: "Nunito, sans-serif",
                }}
              >
                Registrieren
              </button>
              <button
                onClick={() => switchMode("login")}
                className="flex-1 py-2.5 rounded-xl text-base font-medium transition-all"
                style={{
                  background: mode === "login" ? BROWN : "#FDF0E8",
                  color: mode === "login" ? "white" : BROWN_DARK,
                  fontFamily: "Nunito, sans-serif",
                }}
              >
                Login
              </button>
            </div>
          )}

          {mode === "reset" && (
            <form onSubmit={handleReset} className="space-y-3">
              <p className="text-sm text-white/80 mb-1">
                Gib deine E-Mail-Adresse ein. Wir senden dir einen Link zum Zurücksetzen.
              </p>
              <input
                type="email"
                placeholder="E-Mail Adresse"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-14 px-4 rounded-2xl border border-[#F9C030]/45 text-base outline-none placeholder:text-[#C07820]"
                style={{ background: "#FFFFFF", color: BROWN_DARK, fontFamily: "Nunito, sans-serif" }}
                autoComplete="email"
                required
              />
              <Feedback error={error} success={successMsg} />
              <button
                type="submit"
                disabled={loading}
                className="flex min-h-11 w-full flex-wrap items-center justify-center gap-2 rounded-xl px-3 py-2 text-center font-medium leading-tight text-white"
                style={{ background: BROWN, fontFamily: "Nunito, sans-serif" }}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Link senden
              </button>
              <BackButton
                onClick={() => switchMode("login")}
                label="Zurück zur Anmeldung"
                className="mt-1 w-full border-transparent bg-transparent text-sm text-white/70 shadow-none hover:bg-white/10 hover:text-white"
              />
            </form>
          )}

          {mode === "update-password" && (
            <form onSubmit={handleUpdatePassword} className="space-y-3">
              <p className="text-sm text-white/80 mb-1">
                Gib jetzt dein neues Passwort ein und bestätige es.
              </p>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Neues Passwort"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-14 px-4 pr-12 rounded-2xl border border-[#F9C030]/45 text-base outline-none placeholder:text-[#C07820]"
                  style={{ background: "#FFFFFF", color: BROWN_DARK, fontFamily: "Nunito, sans-serif" }}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#C07820] hover:text-[#A8003C]"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Neues Passwort bestätigen"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full h-14 px-4 rounded-2xl border border-[#F9C030]/45 text-base outline-none placeholder:text-[#C07820]"
                style={{ background: "#FFFFFF", color: BROWN_DARK, fontFamily: "Nunito, sans-serif" }}
                autoComplete="new-password"
                required
              />
              <Feedback error={error} success={successMsg} />
              <button
                type="submit"
                disabled={loading}
                className="flex min-h-11 w-full flex-wrap items-center justify-center gap-2 rounded-xl px-3 py-2 text-center font-medium leading-tight text-white"
                style={{ background: BROWN, fontFamily: "Nunito, sans-serif" }}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Passwort speichern
              </button>
            </form>
          )}

          {mode !== "reset" && mode !== "update-password" && (
            <>
              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="email"
                  placeholder="E-Mail Adresse"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-14 px-4 rounded-2xl border border-[#F9C030]/45 text-base outline-none placeholder:text-[#C07820]"
                  style={{ background: "#FFFFFF", color: BROWN_DARK, fontFamily: "Nunito, sans-serif" }}
                  autoComplete="email"
                  required
                />

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Passwort"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-14 px-4 pr-12 rounded-2xl border border-[#F9C030]/45 text-base outline-none placeholder:text-[#C07820]"
                    style={{ background: "#FFFFFF", color: BROWN_DARK, fontFamily: "Nunito, sans-serif" }}
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#C07820] hover:text-[#A8003C]"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                <AnimatePresence>
                  {(mode === "register" || mode === "login") && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden space-y-3"
                    >
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Passwort bestätigen"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full h-14 px-4 rounded-2xl border border-[#F9C030]/45 text-base outline-none placeholder:text-[#C07820]"
                        style={{ background: "#FFFFFF", color: BROWN_DARK, fontFamily: "Nunito, sans-serif" }}
                        autoComplete="new-password"
                      />
                      <div className="flex items-start gap-3 px-1">
                        <Checkbox
                          id="privacy"
                          checked={privacyAccepted}
                          onCheckedChange={setPrivacyAccepted}
                          className="mt-0.5 border-white/60 data-[state=checked]:bg-[#A8003C] data-[state=checked]:border-[#A8003C]"
                        />
                        <label htmlFor="privacy" className="text-xs text-white/80 cursor-pointer leading-relaxed">
                          Ich akzeptiere die{" "}
                          <Link to={createPageUrl("Datenschutz")} className="underline text-white" target="_blank">
                            Datenschutzerklärung
                          </Link>{" "}
                          und die{" "}
                          <Link to={createPageUrl("AGB")} className="underline text-white" target="_blank">
                            Nutzungsbedingungen
                          </Link>
                          {mode === "login"
                            ? " für die Anmeldung oder Registrierung mit Google."
                            : "."}{" "}
                          <span className="text-brand-300">*</span>
                        </label>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Feedback error={error} success={successMsg} />

                {showResend && email && (
                  <button
                    type="button"
                    disabled={resendLoading}
                    onClick={async () => {
                      setResendLoading(true);
                      const { error: err } = await resendConfirmationEmail(email);
                      setResendLoading(false);
                      if (err) {
                        setLocalError("E-Mail konnte nicht gesendet werden.");
                      } else {
                        setShowResend(false);
                        setSuccessMsg("Bestätigungsmail gesendet. Bitte prüfe deinen Posteingang.");
                      }
                    }}
                    className="flex min-h-10 w-full flex-wrap items-center justify-center gap-1 px-2 py-2 text-center text-sm leading-tight text-white/80 underline underline-offset-2 hover:text-white"
                  >
                    {resendLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                    Bestätigungsmail erneut senden
                  </button>
                )}

                <button
                  type="submit"
                  disabled={loading || googleLoading}
                  className="flex min-h-11 w-full flex-wrap items-center justify-center gap-2 rounded-xl px-3 py-2 text-center font-medium leading-tight text-white"
                  style={{ background: BROWN, fontFamily: "Nunito, sans-serif" }}
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {mode === "login" ? "Anmelden" : "Konto erstellen"}
                </button>
              </form>

              <div className="flex items-center gap-3 my-3">
                <div className="flex-1 border-t border-white/20" />
                <span className="text-xs text-white/50">oder</span>
                <div className="flex-1 border-t border-white/20" />
              </div>

              <button
                type="button"
                onClick={handleGoogle}
                disabled={googleLoading || loading}
                className="flex min-h-11 w-full flex-wrap items-center justify-center gap-2 rounded-xl px-3 py-2 text-center text-sm font-medium leading-tight"
                style={{ background: "rgba(255,255,255,0.15)", color: "white", fontFamily: "Nunito, sans-serif" }}
              >
                {googleLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                )}
                Mit Google {mode === "login" ? "anmelden" : "registrieren"}
              </button>

              {mode === "login" && (
                <button
                  type="button"
                  onClick={() => switchMode("reset")}
                  className="mt-2 min-h-10 w-full px-2 py-2 text-center text-sm leading-tight text-white/60 hover:text-white/90"
                  style={{ fontFamily: "Nunito, sans-serif" }}
                >
                  Passwort oder E-Mail vergessen?
                </button>
              )}
            </>
          )}
        </div>

        <div className="text-center pb-4 px-4">
          <p className="text-xs text-white/50" style={{ fontFamily: "Nunito, sans-serif" }}>
            <Link to={createPageUrl("Datenschutz")} className="hover:text-white/80">Datenschutz</Link>
            {" · "}
            <Link to={createPageUrl("AGB")} className="hover:text-white/80">Nutzungsbedingungen</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function Feedback({ error, success }) {
  return (
    <AnimatePresence>
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="flex items-start gap-2 p-3 rounded-xl text-sm"
          style={{ background: "rgba(168,0,60,0.16)", color: "#F9C030" }}
        >
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </motion.div>
      )}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="flex items-start gap-2 p-3 rounded-xl text-sm"
          style={{ background: "rgba(249,192,48,0.18)", color: "#FDF0E8" }}
        >
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{success}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
