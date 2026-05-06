import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { createPageUrl } from "@/utils";
import { useAuth } from "@/lib/AuthContext";

const ONBOARDING_IMAGE = "/onboarding/A739105-desktop.webp";
const ONBOARDING_IMAGE_MOBILE = "/onboarding/A739105-mobile.webp";
const LOGIN_IMAGE = "/onboarding/A739195-2.jpg";

function preloadImage(src) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = resolve;
    image.onerror = resolve;
    image.src = src;
    if (image.complete) resolve();
  });
}

function mapAuthError(message) {
  const msg = String(message || "").toLowerCase();
  if (msg.includes("invalid login credentials")) return "E-Mail oder Passwort stimmen nicht.";
  if (msg.includes("email not confirmed")) return "Bitte bestätige zuerst deine E-Mail-Adresse.";
  if (msg.includes("user already registered")) return "Für diese E-Mail gibt es schon ein Konto.";
  if (msg.includes("password should be at least")) return "Das Passwort ist zu kurz.";
  if (msg.includes("unable to validate email address")) return "Bitte gib eine gültige E-Mail-Adresse ein.";
  if (msg.includes("signup is disabled")) return "Registrierungen sind gerade nicht möglich.";
  if (msg.includes("same password")) return "Bitte wähle ein anderes Passwort als bisher.";
  if (msg.includes("for security purposes")) return "Bitte warte einen Moment und versuche es dann noch einmal.";
  return "Das hat gerade nicht geklappt. Bitte versuche es noch einmal.";
}

export default function GuestWelcomeScreen() {
  const {
    loginWithEmail,
    signUpWithEmail,
    loginWithGoogle,
    resetPasswordForEmail,
    updatePassword,
    authError,
  } = useAuth();
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = useState(false);
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [loginImageReady, setLoginImageReady] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const error = localError || authError;

  useEffect(() => {
    let active = true;
    preloadImage(LOGIN_IMAGE).then(() => {
      if (active) setLoginImageReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const hash = window.location.hash || "";
    const search = window.location.search || "";
    const recoveryDetected =
      hash.includes("type=recovery") ||
      search.includes("type=recovery") ||
      (hash.includes("access_token=") && hash.includes("refresh_token="));

    if (recoveryDetected) {
      setShowAuth(true);
      setMode("update-password");
      setLocalError(null);
      setSuccessMsg("Lege jetzt dein neues Passwort fest.");
    }
  }, []);

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
      const { data, error: err } = await signUpWithEmail(email, password);
      setLoading(false);
      if (err) {
        setLocalError(mapAuthError(err.message));
      } else if (data?.session || data?.user) {
        navigate(createPageUrl("Profile"), { replace: true });
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
    if (err) {
      setLocalError(mapAuthError(err.message));
    }
  };

  const handleOnboardingContinue = useCallback(async () => {
    if (!loginImageReady) {
      await preloadImage(LOGIN_IMAGE);
      setLoginImageReady(true);
    }
    setShowAuth(true);
  }, [loginImageReady]);

  const handleReset = async (event) => {
    event.preventDefault();
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

  const handleUpdatePassword = async (event) => {
    event.preventDefault();
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

  const handleGoogle = async () => {
    setLocalError(null);
    setSuccessMsg(null);
    if (mode === "register" && !privacyAccepted) {
      setLocalError("Bitte akzeptiere die Datenschutzerklärung.");
      return;
    }
    setGoogleLoading(true);
    const result = await loginWithGoogle(mode === "register" ? createPageUrl("Profile") : "/");
    if (result?.error) {
      setGoogleLoading(false);
      setLocalError(mapAuthError(result.error.message));
    }
  };

  if (!showAuth) {
    return <OnboardingScreen onContinue={handleOnboardingContinue} />;
  }

  return (
    <div className="grid min-h-[100dvh] place-items-center overflow-hidden bg-black md:relative">
      <img
        src={LOGIN_IMAGE}
        alt=""
        className="hidden md:block md:absolute md:inset-0 md:h-full md:w-full md:object-contain"
      />
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
        className="relative mx-auto h-[100dvh] w-full max-w-[375px] overflow-hidden rounded-[23px] bg-[#F8F8F8] md:h-[812px] md:bg-transparent"
      >
        <img
          src={LOGIN_IMAGE}
          alt=""
          className="absolute inset-0 h-full w-full object-cover md:hidden"
          style={{ objectPosition: "center center" }}
        />

        <p className="absolute left-[22px] top-[129px] h-[33px] w-[340px] text-center text-[20px] font-extrabold leading-[23px] text-white">
          WILLKOMMEN BEI DOGHIKE
        </p>
        <p className="absolute left-[21px] top-[215px] h-[33px] w-[340px] text-center text-[20px] font-medium leading-[23px] text-white">
          Plane hundefreundliche Touren, speichere deine Lieblingswege und entdecke neue Ziele
        </p>

        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute bottom-4 left-4 right-4 max-h-[476px] overflow-y-auto rounded-[24px] bg-white/10 px-5 py-5 shadow-2xl ring-1 ring-white/20 backdrop-blur-[2px]"
        >
          <h1
            className="mb-4 text-[36px] font-semibold leading-none"
            style={{ color: mode === "reset" || mode === "update-password" ? "white" : "#102f4a" }}
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
            <div className="mb-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => switchMode("register")}
                className={`h-10 rounded-[10px] text-[16px] font-medium text-white ${
                  mode === "register" ? "bg-[#d94a3a]" : "bg-white/15"
                }`}
              >
                Registrieren
              </button>
              <button
                type="button"
                onClick={() => switchMode("login")}
                className={`h-10 rounded-[10px] text-[16px] font-medium text-white ${
                  mode === "login" ? "bg-[#d94a3a]" : "bg-white/15"
                }`}
              >
                Login
              </button>
            </div>
          )}

          {mode === "reset" && (
            <form onSubmit={handleReset} className="space-y-3">
              <p className="text-sm leading-relaxed text-white/80">
                Gib deine E-Mail-Adresse ein. Wir senden dir einen Link zum Zurücksetzen.
              </p>
              <input
                type="email"
                placeholder="E-Mail Adresse"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-[54px] w-full rounded-[14px] border-0 bg-[#F0F0F0] px-4 text-base text-slate-950 outline-none placeholder:text-slate-500"
                autoComplete="email"
                required
              />
              <Feedback error={error} success={successMsg} />
              <button
                type="submit"
                disabled={loading}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-[#d94a3a] font-medium text-white disabled:opacity-70"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Link senden
              </button>
              <button type="button" onClick={() => switchMode("login")} className="w-full text-center text-sm text-white/70">
                Zurück zur Anmeldung
              </button>
            </form>
          )}

          {mode === "update-password" && (
            <form onSubmit={handleUpdatePassword} className="space-y-3">
              <p className="text-sm leading-relaxed text-white/80">
                Gib jetzt dein neues Passwort ein und bestätige es.
              </p>
              <PasswordField
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                value={password}
                onChange={setPassword}
                placeholder="Neues Passwort"
                autoComplete="new-password"
              />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Neues Passwort bestätigen"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="h-[54px] w-full rounded-[14px] border-0 bg-[#F0F0F0] px-4 text-base text-slate-950 outline-none placeholder:text-slate-500"
                autoComplete="new-password"
                required
              />
              <Feedback error={error} success={successMsg} />
              <button
                type="submit"
                disabled={loading}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-[#d94a3a] font-medium text-white disabled:opacity-70"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
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
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-[54px] w-full rounded-[14px] border-0 bg-[#F0F0F0] px-4 text-base text-slate-950 outline-none placeholder:text-slate-500"
                  autoComplete="email"
                  required
                />
                <PasswordField
                  showPassword={showPassword}
                  setShowPassword={setShowPassword}
                  value={password}
                  onChange={setPassword}
                  placeholder="Passwort"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />

                <AnimatePresence>
                  {mode === "register" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-3 overflow-hidden"
                    >
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Passwort bestätigen"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        className="h-[54px] w-full rounded-[14px] border-0 bg-[#F0F0F0] px-4 text-base text-slate-950 outline-none placeholder:text-slate-500"
                        autoComplete="new-password"
                      />
                      <div className="flex items-start gap-3 px-1">
                        <Checkbox
                          id="guest-privacy"
                          checked={privacyAccepted}
                          onCheckedChange={setPrivacyAccepted}
                          className="mt-0.5 border-white/70 data-[state=checked]:border-[#d94a3a] data-[state=checked]:bg-[#d94a3a]"
                        />
                        <label htmlFor="guest-privacy" className="text-xs leading-relaxed text-white/80">
                          Ich akzeptiere die{" "}
                          <Link to={createPageUrl("Datenschutz")} className="text-white underline" target="_blank">
                            Datenschutzerklärung
                          </Link>
                          .
                        </label>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Feedback error={error} success={successMsg} />

                <button
                  type="submit"
                  disabled={loading || googleLoading}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-[#d94a3a] font-medium text-white disabled:opacity-70"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {mode === "login" ? "Anmelden" : "Konto erstellen"}
                </button>
              </form>

              <div className="my-3 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/20" />
                <span className="text-xs text-white/60">oder</span>
                <div className="h-px flex-1 bg-white/20" />
              </div>

              <button
                type="button"
                onClick={handleGoogle}
                disabled={googleLoading || loading}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-white/15 text-sm font-medium text-white disabled:opacity-70"
              >
                {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
                Mit Google {mode === "login" ? "anmelden" : "registrieren"}
              </button>

              {mode === "login" && (
                <button
                  type="button"
                  onClick={() => switchMode("reset")}
                  className="mt-3 w-full text-center text-sm text-white/75"
                >
                  Passwort oder E-Mail vergessen?
                </button>
              )}
            </>
          )}

          <p className="mt-4 text-center text-xs text-white/55">
            <Link to={createPageUrl("Datenschutz")} className="hover:text-white">
              Datenschutz
            </Link>
            {" · "}
            <Link to={createPageUrl("Legal")} className="hover:text-white">
              Nutzungsbedingungen
            </Link>
          </p>
        </motion.div>
      </motion.section>
    </div>
  );
}

function OnboardingScreen({ onContinue }) {
  useEffect(() => {
    const timer = window.setTimeout(onContinue, 3000);
    return () => window.clearTimeout(timer);
  }, [onContinue]);

  return (
    <div className="min-h-screen bg-black">
      <section className="relative mx-auto h-[100dvh] w-full max-w-[375px] overflow-hidden rounded-[23px] bg-black md:max-w-none md:rounded-none">
        <picture>
          <source media="(max-width: 767px)" srcSet={ONBOARDING_IMAGE_MOBILE} />
          <img
            src={ONBOARDING_IMAGE}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
        </picture>
        <div className="absolute inset-0 bg-[linear-gradient(0deg,#000000_-31.83%,rgba(0,0,0,0)_43.72%)]" />

        <div className="absolute bottom-[72px] left-4 h-[216px] w-[343px] opacity-80 md:left-1/2 md:-translate-x-1/2">
          <h1 className="absolute left-0 top-0 h-[113px] w-[343px] text-center font-['Roboto',sans-serif] text-[40px] font-normal leading-[47px] text-white">
            Hundefreundliche Wanderungen
          </h1>
          <p className="absolute left-0 top-[131px] h-[85px] w-[343px] text-center text-[25px] font-medium leading-[29px] text-white">
            Entdecke die perfekte Wanderung für dich und deinen Hund
          </p>
        </div>

        <button
          type="button"
          onClick={onContinue}
          aria-label="Weiter"
          className="absolute bottom-[7px] left-[161px] z-30 grid h-[54px] w-[52px] place-items-center rounded-full bg-[#d94a3a]/80 text-white shadow-[0_10px_28px_rgba(0,0,0,0.28)] ring-1 ring-white/30 md:left-1/2 md:-translate-x-1/2"
        >
          <FourToePaw className="h-[38px] w-[38px] text-white" />
        </button>
      </section>
    </div>
  );
}

function FourToePaw({ className = "" }) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={className}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="16" cy="23" r="7.6" />
      <circle cx="27" cy="14" r="7.8" />
      <circle cx="39" cy="14" r="7.8" />
      <circle cx="50" cy="23" r="7.6" />
      <path d="M17.3 48.7c0-10.5 7.3-18.4 15.7-18.4s15.7 7.9 15.7 18.4c0 6.1-3.6 8.8-8.1 7.4-2.6-.8-4.8-1.7-7.6-1.7s-5 0.9-7.6 1.7c-4.5 1.4-8.1-1.3-8.1-7.4Z" />
    </svg>
  );
}

function PasswordField({ showPassword, setShowPassword, value, onChange, placeholder, autoComplete }) {
  return (
    <div className="relative">
      <input
        type={showPassword ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-[54px] w-full rounded-[14px] border-0 bg-[#F0F0F0] px-4 pr-12 text-base text-slate-950 outline-none placeholder:text-slate-500"
        autoComplete={autoComplete}
        required
      />
      <button
        type="button"
        onClick={() => setShowPassword((value) => !value)}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
        tabIndex={-1}
        aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
      >
        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </button>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
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
          className="flex items-start gap-2 rounded-xl bg-red-500/15 p-3 text-sm text-red-100"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </motion.div>
      )}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="flex items-start gap-2 rounded-xl bg-emerald-500/15 p-3 text-sm text-emerald-100"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{success}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
