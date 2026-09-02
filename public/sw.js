const APP_URL = self.registration?.scope || "/";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  event.waitUntil(
    (async () => {
      let payload;

      try {
        payload = event.data?.json() ?? {};
      } catch {
        payload = { body: event.data?.text() ?? "" };
      }

      const title = payload.title || "VRAM Schedule";
      const options = {
        body: payload.body || "You have a schedule notification.",
        tag: payload.tag || undefined,
        icon: new URL("icons/icon-192.png", self.registration.scope).toString(),
        badge: new URL("icons/icon-192.png", self.registration.scope).toString(),
        data: { url: payload.url || APP_URL },
      };

      await self.registration.showNotification(title, options);
    })()
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || APP_URL;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          return client.focus();
        }
      }

      return self.clients.openWindow(url);
    })
  );
});
