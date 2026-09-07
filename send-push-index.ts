// Supabase Edge Function: send-push
//
// Triggered by a Database Webhook on `insert` into `public.notifications`
// (configured from the Supabase Dashboard, see the setup instructions —
// this file only contains the code, wiring it up is a dashboard step).
//
// What it does:
//   1. Reads the new notification row's id from the webhook payload.
//   2. Looks up that notification and every push subscription the
//      customer has (could be more than one device).
//   3. Sends a real Web Push message to each one using the site's VAPID
//      keys.
//   4. If a subscription has gone stale (customer uninstalled the PWA,
//      cleared site data, revoked the permission...), the push service
//      replies 404/410 and this deletes that subscription row so the
//      admin dashboard doesn't keep silently failing to reach it.
//
// Required secrets (set with `supabase secrets set`, see setup guide):
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically
// by the Supabase Edge Functions runtime — you don't set those yourself.

import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

webpush.setVapidDetails(
  Deno.env.get('VAPID_SUBJECT') ?? 'mailto:info@johnsonsmartfilm.com',
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!
);

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    // Supabase's database-webhook payload shape is { type, table, record, ... }
    const notificationId = payload?.record?.id ?? payload?.notification_id;
    if (!notificationId) {
      return new Response(JSON.stringify({ error: 'missing notification id' }), { status: 400 });
    }

    const { data: notification, error: notifErr } = await supabase
      .from('notifications')
      .select('id, customer_id, title, message')
      .eq('id', notificationId)
      .single();

    if (notifErr || !notification) {
      return new Response(JSON.stringify({ error: 'notification not found' }), { status: 404 });
    }

    const { data: subs, error: subsErr } = await supabase
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth')
      .eq('customer_id', notification.customer_id);

    if (subsErr) {
      return new Response(JSON.stringify({ error: subsErr.message }), { status: 500 });
    }
    if (!subs || subs.length === 0) {
      // Customer has no device subscribed to push yet — not an error, just nothing to do.
      return new Response(JSON.stringify({ sent: 0, reason: 'no subscriptions' }), { status: 200 });
    }

    const payloadStr = JSON.stringify({
      id: notification.id,
      title: notification.title,
      body: notification.message,
      url: '/dashboard/'
    });

    let sent = 0;
    const staleIds: string[] = [];

    await Promise.all(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payloadStr
          );
          sent++;
        } catch (err) {
          const statusCode = err?.statusCode;
          if (statusCode === 404 || statusCode === 410) {
            staleIds.push(sub.id); // subscription is dead — clean it up below
          } else {
            console.error('[send-push] failed for subscription', sub.id, err);
          }
        }
      })
    );

    if (staleIds.length > 0) {
      await supabase.from('push_subscriptions').delete().in('id', staleIds);
    }

    return new Response(JSON.stringify({ sent, cleaned_up: staleIds.length }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('[send-push] unexpected error', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
