self.addEventListener("push", (event) => {
  let payload = {
    title: "DogHike",
    body: "Es gibt eine neue Benachrichtigung.",
    url: "/Notifications",
  };

  try {
    const data = event.data?.json?.();
    if (data && typeof data === "object") {
      payload = {
        title: data.title || payload.title,
        body: data.body || payload.body,
        url: data.url || payload.url,
        icon: data.icon,
        badge: data.badge,
      };
    }
  } catch {}

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon,
      badge: payload.badge,
      data: { url: payload.url },
      vibrate: [200, 100, 200],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) {
          return client.focus().then((focusedClient) => {
            if ('navigate' in focusedClient) {
              return focusedClient.navigate(url);
            }
            return focusedClient;
          });
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
