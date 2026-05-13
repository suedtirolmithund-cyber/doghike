import { supabase } from "@/lib/supabaseClient";
import { APP_ICON } from "@/lib/fallbackImages";

const ICON = APP_ICON;
const VAPID_PUBLIC_KEY = import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY || "";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; ++index) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

function serializeSubscription(subscription) {
  const json = subscription?.toJSON?.() ?? {};
  return {
    endpoint: subscription?.endpoint ?? json.endpoint ?? null,
    p256dh: json.keys?.p256dh ?? null,
    auth: json.keys?.auth ?? null,
  };
}

export function notificationsSupported() {
  return typeof window !== "undefined" && "Notification" in window;
}

export function webPushSupported() {
  return (
    notificationsSupported()
    && typeof navigator !== "undefined"
    && "serviceWorker" in navigator
    && "PushManager" in window
  );
}

export function notificationPermission() {
  if (!notificationsSupported()) return "denied";
  return Notification.permission;
}

export function hasWebPushConfig() {
  return Boolean(VAPID_PUBLIC_KEY);
}

export async function requestNotificationPermission() {
  if (!notificationsSupported()) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  } catch (err) {
    console.error("[SW] Registrierung fehlgeschlagen:", err);
    return null;
  }
}

export async function getExistingPushSubscription() {
  if (!webPushSupported()) return null;
  const registration = await registerServiceWorker();
  if (!registration) return null;
  return registration.pushManager.getSubscription();
}

async function upsertPushSubscription(userId, subscription) {
  const serialized = serializeSubscription(subscription);

  if (!serialized.endpoint || !serialized.p256dh || !serialized.auth) {
    throw new Error("push_subscription_invalid");
  }

  const payload = {
    user_id: userId,
    endpoint: serialized.endpoint,
    p256dh_key: serialized.p256dh,
    auth_key: serialized.auth,
    user_agent: navigator.userAgent,
    last_seen_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("push_subscriptions")
    .upsert(payload, { onConflict: "endpoint" });

  if (error) throw error;
}

export async function ensureWebPushSubscription(userId) {
  if (!userId || !webPushSupported() || !hasWebPushConfig()) return false;
  if (notificationPermission() !== "granted") return false;

  const registration = await registerServiceWorker();
  if (!registration) return false;

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  await upsertPushSubscription(userId, subscription);
  return true;
}

export async function disableWebPushSubscription() {
  if (!webPushSupported()) return false;

  const subscription = await getExistingPushSubscription();
  if (!subscription) return true;

  const endpoint = subscription.endpoint;
  const unsubscribed = await subscription.unsubscribe();

  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint);

  if (error) throw error;
  return unsubscribed;
}

export async function showBrowserNotification(title, body, url = "/") {
  if (!notificationsSupported() || Notification.permission !== "granted") return;
  const options = {
    body,
    icon: ICON,
    badge: ICON,
    data: { url },
    vibrate: [200, 100, 200],
  };

  try {
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, options);
    } else {
      new Notification(title, options);
    }
  } catch {
    try {
      new Notification(title, { body });
    } catch {}
  }
}
