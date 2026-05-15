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
import RouteMapCanvas from "./src/components/RouteMapCanvas";

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

function formatDistance(distanceKm) {
  if (!Number.isFinite(Number(distanceKm))) return "–";
  return `${Number(distanceKm).toFixed(1)} km`;
}

function getRouteDogName(route) {
  return route?.notes?.match(/Hund:\s(.+)/)?.[1]?.split("\n")?.[0] ?? null;
}

function normalizeRoutePoints(points) {
  if (!Array.isArray(points)) return [];

  return points
    .map((point) => {
      if (Array.isArray(point) && point.length >= 2) {
        return {
          latitude: Number(point[0]),
          longitude: Number(point[1]),
        };
      }

      if (
        point &&
        Number.isFinite(Number(point.latitude)) &&
        Number.isFinite(Number(point.longitude))
      ) {
        return {
          latitude: Number(point.latitude),
          longitude: Number(point.longitude),
        };
      }

      return null;
    })
    .filter(
      (point) =>
        point &&
        Number.isFinite(point.latitude) &&
        Number.isFinite(point.longitude)
    );
}

function getRouteRegion(points) {
  if (!points.length) return null;

  const latitudes = points.map((point) => point.latitude);
  const longitudes = points.map((point) => point.longitude);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);

  return {
    latitude: (minLatitude + maxLatitude) / 2,
    longitude: (minLongitude + maxLongitude) / 2,
    latitudeDelta: Math.max((maxLatitude - minLatitude) * 1.5, 0.012),
    longitudeDelta: Math.max((maxLongitude - minLongitude) * 1.5, 0.012),
  };
}

function StatCard({ label, value }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function MiniRoutePreview({ points, accent = COLORS.accent }) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  const normalizedSegments = useMemo(() => {
    if (!Array.isArray(points) || points.length < 2 || !size.width || !size.height) {
      return [];
    }

    const normalizedPoints = points.map((point) => ({
      x: Array.isArray(point) ? point[1] : point.longitude,
      y: Array.isArray(point) ? point[0] : point.latitude,
    }));

    const xs = normalizedPoints.map((point) => point.x);
    const ys = normalizedPoints.map((point) => point.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const xRange = maxX - minX || 1;
    const yRange = maxY - minY || 1;
    const padding = 12;
    const usableWidth = Math.max(size.width - padding * 2, 1);
    const usableHeight = Math.max(size.height - padding * 2, 1);

    const projectedPoints = normalizedPoints.map((point) => ({
      x: padding + ((point.x - minX) / xRange) * usableWidth,
      y: padding + (1 - (point.y - minY) / yRange) * usableHeight,
    }));

    return projectedPoints.slice(1).map((point, index) => {
      const previousPoint = projectedPoints[index];
      const deltaX = point.x - previousPoint.x;
      const deltaY = point.y - previousPoint.y;
      return {
        x: previousPoint.x,
        y: previousPoint.y,
        width: Math.max(Math.sqrt(deltaX ** 2 + deltaY ** 2), 2),
        angle: `${(Math.atan2(deltaY, deltaX) * 180) / Math.PI}deg`,
      };
    });
  }, [points, size.height, size.width]);

  const onLayout = useCallback((event) => {
    const { width, height } = event.nativeEvent.layout;
    setSize({ width, height });
  }, []);

  return (
    <View style={styles.previewCard}>
      <View style={styles.previewHeader}>
        <Text style={styles.previewTitle}>Streckenvorschau</Text>
        <Text style={styles.previewHint}>
          {Array.isArray(points) ? `${points.length} Punkte` : "Noch keine Punkte"}
        </Text>
      </View>
      <View onLayout={onLayout} style={styles.previewMap}>
        {normalizedSegments.length > 0 ? (
          normalizedSegments.map((segment, index) => (
            <View
              key={`${segment.x}-${segment.y}-${index}`}
              style={[
                styles.previewSegment,
                {
                  left: segment.x,
                  top: segment.y,
                  width: segment.width,
                  backgroundColor: accent,
                  transform: [{ rotate: segment.angle }],
                },
              ]}
            />
          ))
        ) : (
          <View style={styles.previewEmptyWrap}>
            <Text style={styles.previewEmptyText}>Die Kartenlinie erscheint, sobald genug Punkte da sind.</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function RouteMapCard({ points, accent = COLORS.accent, title = "Streckenvorschau" }) {
  const normalizedPoints = useMemo(() => normalizeRoutePoints(points), [points]);
  const region = useMemo(() => getRouteRegion(normalizedPoints), [normalizedPoints]);

  if (normalizedPoints.length < 2 || !region) {
    return <MiniRoutePreview points={points} accent={accent} />;
  }

  return (
    <View style={styles.previewCard}>
      <View style={styles.previewHeader}>
        <Text style={styles.previewTitle}>{title}</Text>
        <Text style={styles.previewHint}>{normalizedPoints.length} Punkte</Text>
      </View>
      <RouteMapCanvas
        points={normalizedPoints}
        region={region}
        accent={accent}
        fallback={<MiniRoutePreview points={points} accent={accent} />}
      />
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

function RouteInfoChip({ label, value }) {
  return (
    <View style={styles.routeInfoChip}>
      <Text style={styles.routeInfoValue}>{value}</Text>
      <Text style={styles.routeInfoLabel}>{label}</Text>
    </View>
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
  const [routes, setRoutes] = useState([]);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState(null);

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

  const selectedRoute = useMemo(
    () => routes.find((route) => route.id === selectedRouteId) ?? null,
    [routes, selectedRouteId]
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

  const loadRoutes = useCallback(async () => {
    if (!user?.id) {
      setRoutes([]);
      setSelectedRouteId(null);
      return;
    }

    setRoutesLoading(true);
    const { data, error } = await supabase
      .from("user_routes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(8);

    if (error) {
      console.error("[native-app] loadRoutes failed:", error);
      setRoutes([]);
      setSelectedRouteId(null);
    } else {
      setRoutes(data ?? []);
      setSelectedRouteId((currentRouteId) => {
        if (currentRouteId && (data ?? []).some((route) => route.id === currentRouteId)) {
          return currentRouteId;
        }
        return data?.[0]?.id ?? null;
      });
    }

    setRoutesLoading(false);
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
    loadRoutes();
  }, [loadDogs, loadRoutes, loadTrackerState, user?.id]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        loadTrackerState();
        loadRoutes();
      }
    });

    return () => subscription.remove();
  }, [loadRoutes, loadTrackerState]);

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
    await loadRoutes();
    setRouteName("");
    setSaveLoading(false);
    Alert.alert("Gespeichert", "Die Route ist jetzt in deinen DogTrails-Routen.");
  }, [
    loadRoutes,
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
            <>
              <View style={styles.selectedDogCard}>
                <Text style={styles.selectedDogEyebrow}>Aktive Auswahl</Text>
                <Text style={styles.selectedDogTitle}>
                  {selectedDog ? selectedDog.name : "Ohne Hund"}
                </Text>
                <Text style={styles.selectedDogSubtitle}>
                  {selectedDog
                    ? selectedDog.breed || "Wird fuer die Route mitgespeichert"
                    : "Praktisch zum Testen, wenn noch kein Hund mit soll"}
                </Text>
              </View>

              <View style={styles.dogsWrap}>
                <Pressable
                  onPress={() => setSelectedDogId(null)}
                  style={[
                    styles.dogChip,
                    styles.dogChipCompact,
                    selectedDogId == null && styles.dogChipActive,
                  ]}
                >
                  <Text style={styles.dogChipEmoji}>🦮</Text>
                  <View style={styles.dogChipTextWrap}>
                    <Text style={[styles.dogChipTitle, selectedDogId == null && styles.dogChipTitleActive]}>
                      Ohne Hund
                    </Text>
                    <Text
                      style={[
                        styles.dogChipSubtitle,
                        selectedDogId == null && styles.dogChipSubtitleActive,
                      ]}
                    >
                      Nur Route testen
                    </Text>
                  </View>
                </Pressable>

                {dogs.map((dog) => (
                  <DogChip
                    key={dog.id}
                    dog={dog}
                    selected={selectedDogId === dog.id}
                    onPress={() => setSelectedDogId(dog.id)}
                  />
                ))}
              </View>
            </>
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

            <RouteMapCard points={trackerData?.samples ?? []} title="Live-Strecke" />

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

            <View style={styles.card}>
              <View style={styles.routesHeader}>
                <View style={styles.flexGrow}>
                  <Text style={styles.cardTitle}>4. Gespeicherte Routen</Text>
                  <Text style={styles.paragraph}>
                    Deine neuesten Routen direkt in der nativen App.
                  </Text>
                </View>
                <PrimaryButton
                  title="Neu laden"
                  onPress={loadRoutes}
                  variant="outline"
                  disabled={routesLoading}
                />
              </View>

              {routesLoading ? (
                <ActivityIndicator color={COLORS.accent} />
              ) : routes.length > 0 ? (
                <View style={styles.routesList}>
                  {selectedRoute ? (
                    <View style={styles.routeFocusCard}>
                      <View style={styles.routeFocusHeader}>
                        <View style={styles.flexGrow}>
                          <Text style={styles.routeFocusEyebrow}>Route im Fokus</Text>
                          <Text style={styles.routeFocusTitle}>{selectedRoute.name}</Text>
                          <Text style={styles.routeFocusMeta}>
                            {selectedRoute.route_type === "recorded" ? "Aufgezeichnet" : "Geplant"} ·{" "}
                            {selectedRoute.completed ? "Erledigt" : "Offen"}
                          </Text>
                        </View>
                        <Pressable onPress={() => setSelectedRouteId(null)} style={styles.routeFocusClose}>
                          <Text style={styles.routeFocusCloseText}>Schliessen</Text>
                        </Pressable>
                      </View>

                        <RouteMapCard
                          points={selectedRoute.waypoints ?? []}
                          accent={COLORS.accentDark}
                          title="Routenkarte"
                        />

                      <View style={styles.routeInfoGrid}>
                        <RouteInfoChip label="Distanz" value={formatDistance(selectedRoute.distance_km)} />
                        <RouteInfoChip
                          label="Dauer"
                          value={formatDuration(
                            selectedRoute.completed_duration_minutes ??
                              selectedRoute.duration_minutes ??
                              0
                          )}
                        />
                        <RouteInfoChip
                          label="Hoehenmeter"
                          value={
                            selectedRoute.elevation_gain_m
                              ? `+${selectedRoute.elevation_gain_m} m`
                              : "Kein Hm"
                          }
                        />
                        <RouteInfoChip
                          label="Hund"
                          value={getRouteDogName(selectedRoute) ?? "Ohne Hund"}
                        />
                      </View>

                      <View style={styles.routeDetailStack}>
                        <View style={styles.routeDetailRow}>
                          <Text style={styles.routeDetailLabel}>Startpunkt</Text>
                          <Text style={styles.routeDetailValue}>
                            {selectedRoute.start_location || "Noch nicht gesetzt"}
                          </Text>
                        </View>
                        <View style={styles.routeDetailRow}>
                          <Text style={styles.routeDetailLabel}>Erstellt</Text>
                          <Text style={styles.routeDetailValue}>
                            {selectedRoute.created_at
                              ? new Date(selectedRoute.created_at).toLocaleDateString("de-DE")
                              : "–"}
                          </Text>
                        </View>
                        {selectedRoute.notes ? (
                          <View style={styles.routeDetailRow}>
                            <Text style={styles.routeDetailLabel}>Notizen</Text>
                            <Text style={styles.routeDetailValue}>{selectedRoute.notes}</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  ) : null}

                  {routes.map((route) => {
                    const routeDogName = getRouteDogName(route);
                    const isActive = selectedRouteId === route.id;
                    return (
                      <Pressable
                        key={route.id}
                        onPress={() => setSelectedRouteId(route.id)}
                        style={[styles.routeCard, isActive && styles.routeCardActive]}
                      >
                        <View style={styles.routeCardTop}>
                          <View style={styles.routeCardTextWrap}>
                            <Text style={styles.routeCardTitle}>{route.name}</Text>
                            <Text style={styles.routeCardMeta}>
                              {route.route_type === "recorded" ? "Aufgezeichnet" : "Geplant"} ·{" "}
                              {route.completed ? "Erledigt" : "Offen"}
                            </Text>
                          </View>
                          <Text style={styles.routeCardDistance}>
                            {formatDistance(route.distance_km)}
                          </Text>
                        </View>

                        <RouteMapCard
                          points={route.waypoints ?? []}
                          accent={COLORS.accentDark}
                          title="Route"
                        />

                        <View style={styles.routeMetrics}>
                          <Text style={styles.routeMetricText}>
                            {route.elevation_gain_m ? `+${route.elevation_gain_m} m` : "Kein Hm"}
                          </Text>
                          <Text style={styles.routeMetricText}>
                            {formatDuration(route.completed_duration_minutes ?? route.duration_minutes ?? 0)}
                          </Text>
                          <Text style={styles.routeMetricText}>
                            {routeDogName ? `🐾 ${routeDogName}` : "Ohne Hund"}
                          </Text>
                          <Text style={styles.routeMetricText}>
                            {isActive ? "Im Fokus" : "Antippen fuer Details"}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              ) : (
                <Text style={styles.helper}>
                  Noch keine gespeicherte Route. Sobald du einen Track speicherst, erscheint er hier.
                </Text>
              )}
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
  dogChipCompact: {
    minHeight: 72,
  },
  selectedDogCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.accentSoft,
    padding: 14,
  },
  selectedDogEyebrow: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: COLORS.accent,
    marginBottom: 4,
  },
  selectedDogTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
  },
  selectedDogSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: COLORS.muted,
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
  previewCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.card,
    padding: 16,
    gap: 12,
  },
  previewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },
  previewHint: {
    fontSize: 13,
    color: COLORS.muted,
  },
  previewMap: {
    height: 150,
    borderRadius: 18,
    backgroundColor: COLORS.accentSoft,
    overflow: "hidden",
    position: "relative",
  },
  previewSegment: {
    position: "absolute",
    height: 4,
    borderRadius: 999,
    transformOrigin: "left center",
  },
  previewEmptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  previewEmptyText: {
    textAlign: "center",
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  flexGrow: {
    flex: 1,
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
  routesHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  routesList: {
    gap: 12,
  },
  routeFocusCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.card,
    padding: 16,
    gap: 12,
  },
  routeFocusHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  routeFocusEyebrow: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: COLORS.accent,
    marginBottom: 4,
  },
  routeFocusTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: COLORS.text,
  },
  routeFocusMeta: {
    marginTop: 4,
    fontSize: 13,
    color: COLORS.muted,
  },
  routeFocusClose: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.accentSoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  routeFocusCloseText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.accentDark,
  },
  routeInfoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  routeInfoChip: {
    minWidth: "47%",
    flexGrow: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.accentSoft,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  routeInfoValue: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.text,
  },
  routeInfoLabel: {
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: "600",
  },
  routeDetailStack: {
    gap: 10,
  },
  routeDetailRow: {
    gap: 4,
  },
  routeDetailLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: COLORS.accent,
  },
  routeDetailValue: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.text,
  },
  routeCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.accentSoft,
    padding: 14,
    gap: 10,
  },
  routeCardActive: {
    borderColor: COLORS.accent,
    backgroundColor: "#fff1ee",
  },
  routeCardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  routeCardTextWrap: {
    flex: 1,
  },
  routeCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },
  routeCardMeta: {
    marginTop: 3,
    fontSize: 12,
    color: COLORS.muted,
  },
  routeCardDistance: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.accentDark,
  },
  routeMetrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  routeMetricText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.muted,
    backgroundColor: COLORS.card,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.line,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
});
