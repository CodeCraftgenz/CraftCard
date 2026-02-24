// Push notification event handlers for CraftCard PWA
// Imported by the Workbox-generated service worker via importScripts

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: 'CraftCard', body: event.data.text() };
  }

  const options = {
    body: data.body || '',
    icon: data.icon || '/pwa-192x192.png',
    badge: data.badge || '/favicon-32x32.png',
    data: { url: data.url || '/' },
    vibrate: [100, 50, 100],
    tag: data.tag || 'craftcard-notification',
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(data.title || 'CraftCard', options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus existing window if open
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Open new window
      return clients.openWindow(url);
    }),
  );
});
