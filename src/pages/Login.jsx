import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Mail, Lock, Eye, EyeOff, PawPrint, AlertCircle, CheckCircle2 } from "lucide-react";

export default function Login() {
  const { loginWithEmail, signUpWithEmail, loginWithGoogle, resetPasswordForEmail, authError } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState("login"); // "login" | "register" | "reset"
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
        setLocalError(err.message);
      } else {
        setSuccessMsg(
          "Registrierung erfolgreich! Bitte prüfe deine E-Mails und bestätige dein Konto."
        );
        setEmail("");
        setPassword("");
        setConfirmPassword("");
      }
      return;
    }

    // Login
    setLoading(true);
    const { error: err } = await loginWithEmail(email, password);
    setLoading(false);
    if (err) {
      setLocalError(err.message);
    } else {
      navigate("/");
    }
  };

  const handleGoogle = async () => {
    setLocalError(null);
    setGoogleLoading(true);
    const result = await loginWithGoogle();
    // If there's an error (no redirect happened), reset loading
    if (result?.error) {
      setGoogleLoading(false);
    }
    // Otherwise the browser redirects to Google — no need to reset
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
    if (!email) { setLocalError("Bitte E-Mail-Adresse eingeben."); return; }
    setLoading(true);
    const { error: err } = await resetPasswordForEmail(email);
    setLoading(false);
    if (err) {
      setLocalError(err.message);
    } else {
      setSuccessMsg("E-Mail gesendet! Prüfe dein Postfach und klicke auf den Link zum Zurücksetzen.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-green-50/30 to-emerald-50/20 flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-600 rounded-2xl shadow-lg mb-4">
            <PawPrint className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-stone-800">DogHike Südtirol</h1>
          <p className="text-stone-500 text-sm mt-1">Wandern mit Hund in den Dolomiten</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200/70 p-8">
          {/* Tab switcher */}
          {mode !== "reset" ? (
            <div className="flex rounded-xl bg-stone-100 p-1 mb-6">
              <button onClick={() => switchMode("login")}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${mode === "login" ? "bg-white text-stone-800 shadow-sm" : "text-stone-500 hover:text-stone-700"}`}>
                Anmelden
              </button>
              <button onClick={() => switchMode("register")}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${mode === "register" ? "bg-white text-stone-800 shadow-sm" : "text-stone-500 hover:text-stone-700"}`}>
                Registrieren
              </button>
            </div>
          ) : (
            <h2 className="text-base font-semibold text-stone-800 mb-6">Passwort zurücksetzen</h2>
          )}

          {/* ── Passwort-Reset-Formular ── */}
          {mode === "reset" && (
            <form onSubmit={handleReset} className="space-y-4">
              <p className="text-sm text-stone-500 mb-2">
                Gib deine E-Mail-Adresse ein. Wir senden dir einen Link zum Zurücksetzen.
              </p>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <Input type="email" placeholder="E-Mail Adresse" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 border-stone-200" autoComplete="email" required />
              </div>
              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><span>{error}</span>
                  </motion.div>
                )}
                {successMsg && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /><span>{successMsg}</span>
                  </motion.div>
                )}
              </AnimatePresence>
              <Button type="submit" disabled={loading}
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl">
                {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Link senden
              </Button>
              <button type="button" onClick={() => switchMode("login")}
                className="w-full text-center text-xs text-stone-400 hover:text-stone-600 mt-1">
                ← Zurück zur Anmeldung
              </button>
            </form>
          )}

          {mode !== "reset" && <>
          <Button
            type="button"
            variant="outline"
            className="w-full flex items-center justify-center gap-3 h-11 border-stone-200 hover:bg-stone-50 text-stone-700 font-medium mb-4"
            onClick={handleGoogle}
            disabled={googleLoading || loading}
          >
            {googleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            Mit Google {mode === "login" ? "anmelden" : "registrieren"}
          </Button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 border-t border-stone-200" />
            <span className="text-xs text-stone-400 font-medium">oder per E-Mail</span>
            <div className="flex-1 border-t border-stone-200" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <Input
                type="email"
                placeholder="E-Mail Adresse"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-11 border-stone-200 focus:border-emerald-400 focus:ring-emerald-400/20"
                autoComplete="email"
                required
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Passwort"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 h-11 border-stone-200 focus:border-emerald-400 focus:ring-emerald-400/20"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Confirm password (register only) */}
            <AnimatePresence>
              {mode === "register" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="relative overflow-hidden"
                >
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Passwort bestätigen"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 h-11 border-stone-200 focus:border-emerald-400 focus:ring-emerald-400/20"
                    autoComplete="new-password"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Privacy consent (register only) */}
            <AnimatePresence>
              {mode === "register" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-start gap-3 p-3 bg-stone-50 border border-stone-200 rounded-lg">
                    <Checkbox
                      id="privacy-consent"
                      checked={privacyAccepted}
                      onCheckedChange={setPrivacyAccepted}
                      className="mt-0.5"
                    />
                    <label htmlFor="privacy-consent" className="text-xs text-stone-600 cursor-pointer leading-relaxed">
                      Ich habe die{" "}
                      <Link
                        to={createPageUrl("Datenschutz")}
                        className="text-emerald-600 hover:underline font-medium"
                        target="_blank"
                      >
                        Datenschutzerklärung
                      </Link>{" "}
                      gelesen und akzeptiere die Verarbeitung meiner Daten gemäß DSGVO.{" "}
                      <span className="text-red-500">*</span>
                    </label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700"
                >
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success message */}
            <AnimatePresence>
              {successMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700"
                >
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{successMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {mode === "login" ? "Anmelden" : "Konto erstellen"}
            </Button>

            {/* Passwort vergessen — nur bei Login */}
            {mode === "login" && (
              <button type="button" onClick={() => switchMode("reset")}
                className="w-full text-center text-xs text-stone-400 hover:text-emerald-600 transition-colors mt-1">
                Passwort vergessen?
              </button>
            )}
          </form>
          </>}

          {/* Footer hint */}
          {mode === "login" && (
            <p className="text-center text-xs text-stone-400 mt-5">
              Noch kein Konto?{" "}
              <button onClick={() => switchMode("register")}
                className="text-emerald-600 hover:text-emerald-700 font-medium underline-offset-2 hover:underline">
                Jetzt registrieren
              </button>
            </p>
          )}
          {mode === "register" && (
            <p className="text-center text-xs text-stone-400 mt-5">
              Bereits registriert?{" "}
              <button onClick={() => switchMode("login")}
                className="text-emerald-600 hover:text-emerald-700 font-medium underline-offset-2 hover:underline">
                Jetzt anmelden
              </button>
            </p>
          )}
        </div>

        {/* Back to app */}
        <p className="text-center text-xs text-stone-400 mt-6">
          <a
            href={createPageUrl("Dashboard")}
            className="hover:text-stone-600 underline-offset-2 hover:underline"
          >
            ← Zurück zur App
          </a>
        </p>
      </motion.div>
    </div>
  );
}
