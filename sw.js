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
    <script>
  // تحويل مفتاح VAPID العام إلى الصيغة المناسبة للمتصفح
  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  async function registerPushNotifications() {
    // التأكد من دعم المتصفح للإشعارات والـ Service Worker
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications are not supported in this browser.');
      return;
    }

    try {
      // 1. تسجيل ملف sw.js الموجود في مسار الموقع الرئيسي
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // 2. طلب إذن المستخدم (ستظهر نافذة Allow / Block للمستخدم هنا)
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('Notification permission was not granted.');
        return;
      }

      // 3. التحقق مما إذا كان الجهاز مشتركاً مسبقاً
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        const vapidPublicKey = 'BIe1EtwVTKPP44ZCPQk7mxucAjijqkPqtn3SCXLa2vje9Wtb-n5YFto1pnHAKEPZejUbjpmdcAuQeivvV_C9Af0';
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        });
      }

      const subData = subscription.toJSON();

      // 4. حفظ بيانات الاشتراك في Supabase
      // تأكد أن كائن supabase متاح في الواجهة لديك
      if (window.supabase) {
        const { error } = await window.supabase
          .from('push_subscriptions')
          .upsert({
            endpoint: subData.endpoint,
            p256dh: subData.keys.p256dh,
            auth: subData.keys.auth,
            user_agent: navigator.userAgent
          }, { onConflict: 'endpoint' });

        if (error) {
          console.error('Error saving subscription to Supabase:', error);
        } else {
          console.log('Device successfully registered for notifications!');
        }
      }
    } catch (err) {
      console.error('Push notification registration failed:', err);
    }
  }

  // تشغيل الكود بمجرد تحميل الصفحة
  window.addEventListener('load', () => {
    registerPushNotifications();
  });
</script>
  );
});
