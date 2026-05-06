import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";

const BG_IMAGE = "/log_in.jpg";

const BROWN = "#d94a3a";
const BROWN_DARK = "#102f4a";

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

  return "Das hat gerade nicht geklappt. Bitte versuche es noch einmal.";
}

export default function Login() {
  const {
    loginWithEmail,
    signUpWithEmail,
    loginWithGoogle,
    resetPasswordForEmail,
    updatePassword,
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
    } else {
      navigate("/");
    }
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
    <div className="min-h-screen relative flex items-end justify-center overflow-hidden">
      <div className="absolute inset-0">
        <img src={BG_IMAGE} alt="" className="w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative w-full max-w-sm mx-4 mb-8 rounded-3xl overflow-hidden"
        style={{ background: "rgba(255,255,255,0.10)", backdropFilter: "blur(2px)" }}
      >
        <div className="px-6 pt-8 pb-6">
          <h1
            className="text-4xl font-semibold mb-6"
            style={{
              color: mode === "reset" || mode === "update-password" ? "white" : BROWN_DARK,
              fontFamily: "Roboto, sans-serif",
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
                  background: mode === "register" ? BROWN : "rgba(255,255,255,0.15)",
                  color: "white",
                  fontFamily: "Roboto, sans-serif",
                }}
              >
                Registrieren
              </button>
              <button
                onClick={() => switchMode("login")}
                className="flex-1 py-2.5 rounded-xl text-base font-medium transition-all"
                style={{
                  background: mode === "login" ? BROWN : "rgba(255,255,255,0.15)",
                  color: "white",
                  fontFamily: "Roboto, sans-serif",
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
                className="w-full h-14 px-4 rounded-2xl text-base outline-none border-0"
                style={{ background: "#f0f0f0", color: "#222", fontFamily: "Roboto, sans-serif" }}
                autoComplete="email"
                required
              />
              <Feedback error={error} success={successMsg} />
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl text-white font-medium flex items-center justify-center gap-2"
                style={{ background: BROWN, fontFamily: "Roboto, sans-serif" }}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Link senden
              </button>
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="w-full text-center text-sm text-white/60 hover:text-white/90 mt-1"
              >
                ← Zurück zur Anmeldung
              </button>
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
                  className="w-full h-14 px-4 pr-12 rounded-2xl text-base outline-none border-0"
                  style={{ background: "#f0f0f0", color: "#222", fontFamily: "Roboto, sans-serif" }}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
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
                className="w-full h-14 px-4 rounded-2xl text-base outline-none border-0"
                style={{ background: "#f0f0f0", color: "#222", fontFamily: "Roboto, sans-serif" }}
                autoComplete="new-password"
                required
              />
              <Feedback error={error} success={successMsg} />
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl text-white font-medium flex items-center justify-center gap-2"
                style={{ background: BROWN, fontFamily: "Roboto, sans-serif" }}
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
                  className="w-full h-14 px-4 rounded-2xl text-base outline-none border-0"
                  style={{ background: "#f0f0f0", color: "#222", fontFamily: "Roboto, sans-serif" }}
                  autoComplete="email"
                  required
                />

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Passwort"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-14 px-4 pr-12 rounded-2xl text-base outline-none border-0"
                    style={{ background: "#f0f0f0", color: "#222", fontFamily: "Roboto, sans-serif" }}
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                <AnimatePresence>
                  {mode === "register" && (
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
                        className="w-full h-14 px-4 rounded-2xl text-base outline-none border-0"
                        style={{ background: "#f0f0f0", color: "#222", fontFamily: "Roboto, sans-serif" }}
                        autoComplete="new-password"
                      />
                      <div className="flex items-start gap-3 px-1">
                        <Checkbox
                          id="privacy"
                          checked={privacyAccepted}
                          onCheckedChange={setPrivacyAccepted}
                          className="mt-0.5 border-white/60 data-[state=checked]:bg-[#d94a3a] data-[state=checked]:border-[#d94a3a]"
                        />
                        <label htmlFor="privacy" className="text-xs text-white/80 cursor-pointer leading-relaxed">
                          Ich akzeptiere die{" "}
                          <Link to={createPageUrl("Datenschutz")} className="underline text-white" target="_blank">
                            Datenschutzerklärung
                          </Link>{" "}
                          gemäß DSGVO. <span className="text-red-400">*</span>
                        </label>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Feedback error={error} success={successMsg} />

                <button
                  type="submit"
                  disabled={loading || googleLoading}
                  className="w-full h-11 rounded-xl text-white font-medium flex items-center justify-center gap-2"
                  style={{ background: BROWN, fontFamily: "Roboto, sans-serif" }}
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
                className="w-full h-11 rounded-xl font-medium flex items-center justify-center gap-2 text-sm"
                style={{ background: "rgba(255,255,255,0.15)", color: "white", fontFamily: "Roboto, sans-serif" }}
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
                  className="w-full text-center text-sm text-white/60 hover:text-white/90 mt-2"
                  style={{ fontFamily: "Roboto, sans-serif" }}
                >
                  Passwort oder E-Mail vergessen?
                </button>
              )}
            </>
          )}
        </div>

        <div className="text-center pb-4 px-4">
          <p className="text-xs text-white/50" style={{ fontFamily: "Roboto, sans-serif" }}>
            <Link to={createPageUrl("Datenschutz")} className="hover:text-white/80">Datenschutz</Link>
            {" · "}
            <Link to={createPageUrl("Legal")} className="hover:text-white/80">Nutzungsbedingungen</Link>
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
          style={{ background: "rgba(239,68,68,0.15)", color: "#fca5a5" }}
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
          style={{ background: "rgba(52,211,153,0.15)", color: "#6ee7b7" }}
        >
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{success}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
