/*
 * Service worker for Johnson Smart Film — Web Push notifications.
 *
 * This file has to live at the SITE ROOT (/sw.js), not inside /js/. A
 * service worker can only control pages under the folder it's served
 * from, so putting it in /js/sw.js would mean it could never receive
 * push events for /dashboard/ or any other top-level page.
 *
 * This does NOT do offline caching or anything else — it only exists to
 * receive push events (even while the site/tab is closed) and show a
 * real OS-level notification.
 */

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'Johnson Smart Film', body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'Johnson Smart Film';
  const options = {
    body: data.body || '',
    icon: '/android-chrome-192x192.png',
    badge: '/android-chrome-192x192.png',
    // Distinct notifications should stack, not replace each other — a
    // fixed tag would make a second notification silently swallow the
    // first one before the customer ever saw it.
    tag: data.id || undefined,
    data: { url: data.url || '/dashboard/' }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Clicking the notification focuses an already-open dashboard tab if
// there is one, instead of always opening a brand new tab.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/dashboard/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/dashboard/') && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// If the browser itself renews the push subscription (this happens
// occasionally — it's normal, not an error), re-save the new one so
// notifications don't silently stop working.
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    self.registration.pushManager
      .subscribe(event.oldSubscription ? event.oldSubscription.options : { userVisibleOnly: true })
      .then((subscription) => {
        return self.clients.matchAll().then((clientList) => {
          clientList.forEach((client) => {
            client.postMessage({ type: 'PUSH_SUBSCRIPTION_RENEWED', subscription: subscription.toJSON() });
          });
        });
      })
  );
});
