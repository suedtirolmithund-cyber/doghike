const ICON = 'https://api.dicebear.com/7.x/thumbs/svg?seed=doghike&backgroundColor=1c1917';

export function notificationsSupported() {
  return 'Notification' in window;
}

export function notificationPermission() {
  if (!notificationsSupported()) return 'denied';
  return Notification.permission;
}

export async function requestNotificationPermission() {
  if (!notificationsSupported()) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  } catch (err) {
    console.error('[SW] Registrierung fehlgeschlagen:', err);
    return null;
  }
}

export async function showBrowserNotification(title, body, url = '/') {
  if (!notificationsSupported() || Notification.permission !== 'granted') return;
  const options = { body, icon: ICON, badge: ICON, data: { url }, vibrate: [200, 100, 200] };
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, options);
    } else {
      new Notification(title, options);
    }
  } catch {
    try { new Notification(title, { body }); } catch {}
  }
}
