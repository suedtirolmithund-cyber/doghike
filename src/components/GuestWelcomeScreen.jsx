import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
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
    return <OnboardingScreen onContinue={() => setShowAuth(true)} />;
  }

  return (
    <div className="min-h-screen bg-black md:grid md:place-items-center">
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
        className="relative mx-auto h-[812px] max-h-[100dvh] w-full max-w-[375px] overflow-hidden rounded-[23px] bg-[#F8F8F8]"
      >
        <img
          src="/onboarding/A739195-2.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: "center center" }}
        />

        <p className="absolute left-[22px] top-[129px] h-[33px] w-[340px] text-center font-['Roboto',sans-serif] text-[20px] font-extrabold leading-[23px] text-white">
          WILLKOMMEN BEI DOGHIKE
        </p>
        <p className="absolute left-[21px] top-[215px] h-[33px] w-[340px] text-center font-['Roboto',sans-serif] text-[20px] font-medium leading-[23px] text-white">
          Plane hundefreundliche Touren, speichere deine Lieblingswege und entdecke neue Ziele
        </p>

        <form onSubmit={handleSubmit}>
          <h1 className="absolute left-[22px] top-[442px] h-[47px] w-[140px] font-['Roboto',sans-serif] text-[40px] font-medium leading-[47px] text-[#8C6B4A]">
            {mode === "register" ? "Register" : "Login"}
          </h1>

          <input
            type="email"
            aria-label="Username or Email"
            placeholder="Username or Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="absolute left-[22px] top-[508px] h-[54px] w-[316px] rounded-[14px] border-0 bg-[#F0F0F0] px-4 font-['Roboto',sans-serif] text-[20px] font-normal leading-[23px] text-black outline-none placeholder:text-black/25"
            autoComplete="email"
            required
          />

          <input
            type={showPassword ? "text" : "password"}
            aria-label="Password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="absolute left-[22px] top-[584px] h-[54px] w-[316px] rounded-[14px] border-0 bg-[#F0F0F0] px-4 pr-12 font-['Roboto',sans-serif] text-[20px] font-normal leading-[23px] text-black outline-none placeholder:text-black/25"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute left-[300px] top-[600px] text-black/25"
            tabIndex={-1}
            aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>

          {mode === "register" && (
            <div className="absolute left-[22px] top-[626px] flex w-[316px] items-center gap-2">
              <Checkbox
                id="guest-privacy"
                checked={privacyAccepted}
                onCheckedChange={setPrivacyAccepted}
                className="border-white/70 data-[state=checked]:bg-[#B88C73] data-[state=checked]:border-[#B88C73]"
              />
              <label htmlFor="guest-privacy" className="font-['Roboto',sans-serif] text-[11px] leading-[13px] text-white">
                Datenschutz akzeptieren
              </label>
            </div>
          )}

          <button
            type="button"
            onClick={() => switchMode("register")}
            className="absolute left-[22px] top-[660px] h-[41px] w-[149px] rounded-[10px] bg-[#B88C73] font-['Roboto',sans-serif] text-[20px] font-medium leading-[23px] text-white shadow-[0px_100px_80px_rgba(185,62,62,0.07),0px_64.8148px_46.8519px_rgba(185,62,62,0.0531481),0px_38.5185px_25.4815px_rgba(185,62,62,0.0425185),0px_20px_13px_rgba(185,62,62,0.035),0px_8.14815px_6.51852px_rgba(185,62,62,0.0274815),0px_1.85185px_3.14815px_rgba(185,62,62,0.0168519)]"
          >
            Register
          </button>

          <button
            type={mode === "login" ? "submit" : "button"}
            onClick={mode === "register" ? handleSubmit : undefined}
            disabled={loading || googleLoading}
            className="absolute left-[187px] top-[660px] h-[41px] w-[151px] rounded-[10px] bg-[#B88C73] font-['Roboto',sans-serif] text-[20px] font-normal leading-[23px] text-white shadow-[0px_100px_80px_rgba(185,62,62,0.07),0px_64.8148px_46.8519px_rgba(185,62,62,0.0531481),0px_38.5185px_25.4815px_rgba(185,62,62,0.0425185),0px_20px_13px_rgba(185,62,62,0.035),0px_8.14815px_6.51852px_rgba(185,62,62,0.0274815),0px_1.85185px_3.14815px_rgba(185,62,62,0.0168519)] disabled:opacity-70"
          >
            {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Login"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setLocalError("Bitte nutze die Passwort-zurücksetzen-Funktion auf der klassischen Login-Seite.")}
          className="absolute left-[171px] top-[714px] h-[16px] w-[167px] text-left font-['Roboto',sans-serif] text-[14px] font-normal leading-[16px] text-white"
        >
          Forgot Password or Email?
        </button>

        <p className="absolute left-[87px] top-[764px] h-[32px] w-[187px] text-center font-['Roboto',sans-serif] text-[14px] font-medium leading-[16px] text-white">
          Privacy Policy - Terms of Use DogHike App
        </p>

        <div className="absolute left-[22px] top-[716px] w-[145px]">
          <Feedback error={error} success={successMsg} />
        </div>
      </motion.section>
    </div>
  );
}

function OnboardingScreen({ onContinue }) {
  return (
    <div className="min-h-screen bg-black md:grid md:place-items-center">
      <section className="relative mx-auto h-[812px] max-h-[100dvh] w-full max-w-[375px] overflow-hidden rounded-[23px] bg-black">
        <img
          src="/onboarding/A739105.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: "center center" }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,#000000_-31.83%,rgba(0,0,0,0)_43.72%)]" />

        <div className="absolute left-4 top-[524px] h-[216px] w-[343px] opacity-80">
          <h1 className="absolute left-0 top-0 h-[113px] w-[343px] text-center font-['Roboto',sans-serif] text-[40px] font-normal leading-[47px] text-white">
            Hundefreundliche Wanderungen
          </h1>
          <p className="absolute left-0 top-[131px] h-[85px] w-[343px] text-center font-['Roboto',sans-serif] text-[25px] font-medium leading-[29px] text-white">
            Entdecke die perfekte Wanderung für dich und deinen Hund
          </p>
        </div>

        <button
          type="button"
          onClick={onContinue}
          aria-label="Weiter"
          className="absolute left-[161px] top-[751px] grid h-[54px] w-[52px] place-items-center rounded-full bg-[#BE8C70]/80 text-white"
          style={{ mixBlendMode: "plus-lighter" }}
        >
          <ArrowRight className="h-[31px] w-[31px] stroke-[2.4]" />
        </button>
      </section>
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
