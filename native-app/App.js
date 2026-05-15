import "react-native-url-polyfill/auto";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { supabase, isSupabaseConfigured } from "./src/lib/supabase";
import {
  ensureLocationPermissions,
  hasActiveBackgroundTracking,
  startBackgroundTracking,
  stopBackgroundTracking,
} from "./src/lib/backgroundTracking";
import {
  clearStoredTrack,
  getStoredTrack,
  getTrackSummary,
} from "./src/lib/trackingStorage";

const COLORS = {
  bg: "#fff7f3",
  card: "#ffffff",
  text: "#2c1c18",
  muted: "#7d5d53",
  line: "#f2c78f",
  accent: "#a8003c",
  accentDark: "#7c3020",
  accentSoft: "#fdf0e8",
  success: "#2f855a",
};

function formatDuration(minutes) {
  if (!Number.isFinite(minutes) || minutes <= 0) return "0 Min";
  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;
  if (hours <= 0) return `${restMinutes} Min`;
  if (restMinutes <= 0) return `${hours} Std`;
  return `${hours} Std ${restMinutes} Min`;
}

function StatCard({ label, value }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function DogChip({ dog, selected, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.dogChip, selected && styles.dogChipActive]}
    >
      <Text style={styles.dogChipEmoji}>🐾</Text>
      <View style={styles.dogChipTextWrap}>
        <Text style={[styles.dogChipTitle, selected && styles.dogChipTitleActive]}>
          {dog.name}
        </Text>
        {dog.breed ? (
          <Text style={[styles.dogChipSubtitle, selected && styles.dogChipSubtitleActive]}>
            {dog.breed}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

function PrimaryButton({ title, onPress, loading, disabled, variant = "solid" }) {
  const isOutline = variant === "outline";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        isOutline ? styles.buttonOutline : styles.buttonSolid,
        (disabled || loading) && styles.buttonDisabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isOutline ? COLORS.accentDark : "#ffffff"} />
      ) : (
        <Text style={[styles.buttonText, isOutline && styles.buttonTextOutline]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const [dogs, setDogs] = useState([]);
  const [dogsLoading, setDogsLoading] = useState(false);
  const [selectedDogId, setSelectedDogId] = useState(null);
  const [allowWithoutDog, setAllowWithoutDog] = useState(false);

  const [routeName, setRouteName] = useState("");
  const [trackerData, setTrackerData] = useState(null);
  const [trackingActive, setTrackingActive] = useState(false);
  const [trackerLoading, setTrackerLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const user = session?.user ?? null;

  const selectedDog = useMemo(
    () => dogs.find((dog) => dog.id === selectedDogId) ?? null,
    [dogs, selectedDogId]
  );

  const trackerSummary = useMemo(
    () => getTrackSummary(trackerData),
    [trackerData]
  );

  const loadDogs = useCallback(async () => {
    if (!user?.id) {
      setDogs([]);
      return;
    }

    setDogsLoading(true);
    const { data, error } = await supabase
      .from("dogs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[native-app] loadDogs failed:", error);
      setDogs([]);
    } else {
      setDogs(data ?? []);
      setSelectedDogId((currentDogId) => {
        if (currentDogId && (data ?? []).some((dog) => dog.id === currentDogId)) {
          return currentDogId;
        }
        return data?.[0]?.id ?? null;
      });
    }

    setDogsLoading(false);
  }, [user?.id]);

  const loadTrackerState = useCallback(async () => {
    setTrackerLoading(true);
    const [storedTrack, active] = await Promise.all([
      getStoredTrack(),
      hasActiveBackgroundTracking(),
    ]);
    setTrackerData(storedTrack);
    setTrackingActive(active);
    setRouteName((currentName) => currentName || storedTrack?.name || "");
    if (storedTrack?.dogId) {
      setSelectedDogId((currentDogId) => currentDogId || storedTrack.dogId);
    }
    setTrackerLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setDogs([]);
      setAllowWithoutDog(false);
      return;
    }

    loadDogs();
    loadTrackerState();
  }, [loadDogs, loadTrackerState, user?.id]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        loadTrackerState();
      }
    });

    return () => subscription.remove();
  }, [loadTrackerState]);

  const handleAuthSubmit = useCallback(async () => {
    if (!email.trim() || !password.trim()) {
      setAuthError("Bitte E-Mail und Passwort ausfuellen.");
      return;
    }

    setAuthSubmitting(true);
    setAuthError("");

    const action =
      mode === "signup"
        ? supabase.auth.signUp({ email: email.trim(), password })
        : supabase.auth.signInWithPassword({ email: email.trim(), password });

    const { error } = await action;
    if (error) {
      setAuthError(error.message || "Anmeldung fehlgeschlagen.");
    }

    setAuthSubmitting(false);
  }, [email, mode, password]);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    setAllowWithoutDog(false);
    setRouteName("");
  }, []);

  const handleStartTracking = useCallback(async () => {
    if (!user?.id) return;
    if (!routeName.trim()) {
      Alert.alert("Name fehlt", "Gib deiner Route zuerst einen Namen.");
      return;
    }

    const permissionsGranted = await ensureLocationPermissions();
    if (!permissionsGranted) {
      Alert.alert(
        "Standort fehlt",
        "Bitte erlaube Standortzugriff fuer Vordergrund und Hintergrund."
      );
      return;
    }

    setTrackerLoading(true);
    await startBackgroundTracking({
      name: routeName.trim(),
      dogId: selectedDogId ?? null,
      userId: user.id,
    });
    await loadTrackerState();
  }, [loadTrackerState, routeName, selectedDogId, user?.id]);

  const handleStopTracking = useCallback(async () => {
    setTrackerLoading(true);
    await stopBackgroundTracking();
    await loadTrackerState();
  }, [loadTrackerState]);

  const handleDiscardTrack = useCallback(async () => {
    await stopBackgroundTracking();
    await clearStoredTrack();
    await loadTrackerState();
  }, [loadTrackerState]);

  const handleSaveTrack = useCallback(async () => {
    if (!user?.id || !trackerData) return;

    if (trackingActive) {
      Alert.alert("Aufzeichnung laeuft noch", "Bitte stoppe die Aufzeichnung zuerst.");
      return;
    }

    if ((trackerSummary.pointCount ?? 0) < 2) {
      Alert.alert("Zu kurz", "Es sind noch nicht genug Trackpunkte da.");
      return;
    }

    setSaveLoading(true);

    const waypoints = trackerData.samples.map((sample) => [
      sample.latitude,
      sample.longitude,
    ]);

    const startLocation =
      trackerData.samples.length > 0
        ? `${trackerData.samples[0].latitude.toFixed(5)}, ${trackerData.samples[0].longitude.toFixed(5)}`
        : null;

    const notes = [
      trackerData.dogId && selectedDog ? `Hund: ${selectedDog.name}` : null,
      "Aufzeichnung aus der nativen DogTrails-Tracking-App.",
    ]
      .filter(Boolean)
      .join("\n");

    const { error } = await supabase.from("user_routes").insert({
      user_id: user.id,
      name: trackerData.name || routeName.trim(),
      start_location: startLocation,
      notes,
      waypoints,
      distance_km: trackerSummary.distanceKm,
      elevation_gain_m: trackerSummary.elevationGainM,
      duration_minutes: trackerSummary.durationMinutes,
      avg_speed_kmh: trackerSummary.avgSpeedKmh,
      route_type: "recorded",
      completed: true,
      completed_date: new Date().toISOString().slice(0, 10),
      completed_duration_minutes: trackerSummary.durationMinutes,
    });

    if (error) {
      console.error("[native-app] save route failed:", error);
      Alert.alert("Speichern fehlgeschlagen", error.message || "Bitte spaeter nochmal versuchen.");
      setSaveLoading(false);
      return;
    }

    await clearStoredTrack();
    await loadTrackerState();
    setRouteName("");
    setSaveLoading(false);
    Alert.alert("Gespeichert", "Die Route ist jetzt in deinen DogTrails-Routen.");
  }, [
    loadTrackerState,
    routeName,
    selectedDog,
    trackerData,
    trackerSummary.avgSpeedKmh,
    trackerSummary.distanceKm,
    trackerSummary.durationMinutes,
    trackerSummary.elevationGainM,
    trackerSummary.pointCount,
    trackingActive,
    user?.id,
  ]);

  if (!isSupabaseConfigured) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerWrap}>
          <Text style={styles.title}>DogTrails Native</Text>
          <Text style={styles.paragraph}>
            Setze zuerst EXPO_PUBLIC_SUPABASE_URL und EXPO_PUBLIC_SUPABASE_ANON_KEY
            in einer .env Datei in native-app.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (authLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.helper}>Session wird geladen ...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView contentContainerStyle={styles.authWrap}>
            <View style={styles.brandCard}>
              <Text style={styles.eyebrow}>DogTrails Native Starter</Text>
              <Text style={styles.title}>Tracking fuer unterwegs</Text>
              <Text style={styles.paragraph}>
                Erstmal bauen wir die native Basis fuer echtes Hintergrund-GPS:
                Login, Hundewahl, Aufzeichnung und Speichern.
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                {mode === "signup" ? "Neu registrieren" : "Anmelden"}
              </Text>
              <TextInput
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="E-Mail"
                placeholderTextColor="#9a857b"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
              />
              <TextInput
                secureTextEntry
                placeholder="Passwort"
                placeholderTextColor="#9a857b"
                value={password}
                onChangeText={setPassword}
                style={styles.input}
              />
              {authError ? <Text style={styles.errorText}>{authError}</Text> : null}
              <PrimaryButton
                title={mode === "signup" ? "Konto anlegen" : "Einloggen"}
                onPress={handleAuthSubmit}
                loading={authSubmitting}
              />
              <Pressable onPress={() => setMode((currentMode) => (currentMode === "login" ? "signup" : "login"))}>
                <Text style={styles.switchText}>
                  {mode === "signup"
                    ? "Schon ein Konto? Zur Anmeldung"
                    : "Noch kein Konto? Neu registrieren"}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
        <StatusBar style="dark" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.screen}>
        <View style={styles.headerRow}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.eyebrow}>DogTrails Native</Text>
            <Text style={styles.title}>Tracking Starter</Text>
            <Text style={styles.helper}>{user.email}</Text>
          </View>
          <PrimaryButton title="Logout" onPress={handleLogout} variant="outline" />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>1. Wanderbuddy waehlen</Text>
          <Text style={styles.paragraph}>
            Der erste native Stand konzentriert sich auf Tracking. Deinen Hund
            kannst du hier fuer die Route mitgeben.
          </Text>

          {dogsLoading ? (
            <ActivityIndicator color={COLORS.accent} />
          ) : dogs.length > 0 ? (
            <View style={styles.dogsWrap}>
              {dogs.map((dog) => (
                <DogChip
                  key={dog.id}
                  dog={dog}
                  selected={selectedDogId === dog.id}
                  onPress={() =>
                    setSelectedDogId((currentDogId) =>
                      currentDogId === dog.id ? null : dog.id
                    )
                  }
                />
              ))}
            </View>
          ) : allowWithoutDog ? (
            <Text style={styles.helper}>
              Noch kein Hund angelegt. Du kannst die Tracking-Basis trotzdem testen.
            </Text>
          ) : (
            <>
              <Text style={styles.warningText}>
                In diesem Konto gibt es noch kein Hundeprofil.
              </Text>
              <Text style={styles.paragraph}>
                Fuer den richtigen DogTrails-Flow solltest du zuerst in der Web-App
                einen Hund anlegen. Wenn du nur die Native-Basis testen willst,
                kannst du auch ohne Hund weitermachen.
              </Text>
              <PrimaryButton
                title="Ohne Hund weitermachen"
                onPress={() => setAllowWithoutDog(true)}
                variant="outline"
              />
            </>
          )}
        </View>

        {(dogs.length > 0 || allowWithoutDog) && (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>2. Route aufzeichnen</Text>
              <TextInput
                placeholder="Name der Tour"
                placeholderTextColor="#9a857b"
                value={routeName}
                onChangeText={setRouteName}
                style={styles.input}
              />
              <Text style={styles.helper}>
                {selectedDog
                  ? `Aktiver Hund: ${selectedDog.name}`
                  : "Aktiver Hund: keiner ausgewaehlt"}
              </Text>

              <View style={styles.buttonStack}>
                {!trackingActive ? (
                  <PrimaryButton
                    title="Aufzeichnung starten"
                    onPress={handleStartTracking}
                    loading={trackerLoading}
                  />
                ) : (
                  <PrimaryButton
                    title="Aufzeichnung stoppen"
                    onPress={handleStopTracking}
                    loading={trackerLoading}
                  />
                )}
                <PrimaryButton
                  title="Track verwerfen"
                  onPress={handleDiscardTrack}
                  variant="outline"
                  disabled={!trackerData}
                />
              </View>
            </View>

            <View style={styles.statsRow}>
              <StatCard label="Punkte" value={String(trackerSummary.pointCount)} />
              <StatCard label="Distanz" value={`${trackerSummary.distanceKm.toFixed(2)} km`} />
              <StatCard label="Dauer" value={formatDuration(trackerSummary.durationMinutes)} />
            </View>

            <View style={styles.statsRow}>
              <StatCard label="Hoehenmeter" value={`+${trackerSummary.elevationGainM} m`} />
              <StatCard label="Tempo" value={`${trackerSummary.avgSpeedKmh.toFixed(1)} km/h`} />
              <StatCard
                label="Status"
                value={trackingActive ? "Aktiv" : trackerData ? "Bereit" : "Leer"}
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>3. In DogTrails speichern</Text>
              <Text style={styles.paragraph}>
                Wenn die Aufzeichnung gestoppt ist, speichern wir sie direkt in
                `user_routes` deiner bestehenden DogTrails-Datenbank.
              </Text>
              <PrimaryButton
                title="Route speichern"
                onPress={handleSaveTrack}
                loading={saveLoading}
                disabled={!trackerData || trackingActive}
              />
            </View>
          </>
        )}
      </ScrollView>
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  flex: {
    flex: 1,
  },
  authWrap: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
    gap: 16,
  },
  screen: {
    padding: 20,
    gap: 16,
  },
  centerWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  headerTextWrap: {
    flex: 1,
  },
  brandCard: {
    borderRadius: 24,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 20,
    shadowColor: "#7c3020",
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  card: {
    borderRadius: 24,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 20,
    gap: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.7,
    textTransform: "uppercase",
    color: COLORS.accent,
    marginBottom: 4,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: COLORS.text,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.muted,
  },
  helper: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.muted,
  },
  warningText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.accentDark,
  },
  errorText: {
    color: "#b8323f",
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.accentSoft,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.text,
    fontSize: 16,
  },
  button: {
    minHeight: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  buttonSolid: {
    backgroundColor: COLORS.accent,
  },
  buttonOutline: {
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  buttonTextOutline: {
    color: COLORS.accentDark,
  },
  switchText: {
    textAlign: "center",
    color: COLORS.accentDark,
    fontSize: 14,
    fontWeight: "600",
  },
  dogsWrap: {
    gap: 10,
  },
  dogChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.accentSoft,
    padding: 14,
  },
  dogChipActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  dogChipEmoji: {
    fontSize: 20,
  },
  dogChipTextWrap: {
    flex: 1,
  },
  dogChipTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },
  dogChipTitleActive: {
    color: "#ffffff",
  },
  dogChipSubtitle: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 2,
  },
  dogChipSubtitleActive: {
    color: "#fde7df",
  },
  buttonStack: {
    gap: 10,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.card,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 92,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
    textAlign: "center",
  },
  statLabel: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.muted,
    textAlign: "center",
  },
});
