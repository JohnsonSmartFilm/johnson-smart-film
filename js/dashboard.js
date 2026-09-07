/* ============================================================
   JOHNSON SMART FILM — Customer Dashboard
   ============================================================ */
(function () {
  let session = null;
  let vehicles = [];
  let services = [];
  let notifications = [];

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  async function init() {
    session = await window.requireAuth('customer');
    if (!session) return;

    $('#loading').style.display = 'none';
    $('#app').style.display = 'grid';

    const p = session.profile;
    $('#userName').textContent = p.full_name || 'Customer';
    $('#userCode').textContent = p.code || '';
    $('#userAvatar').textContent = (p.full_name || 'C').trim()[0].toUpperCase();
    $('#viewTitle').textContent = `Welcome back, ${(p.full_name || '').split(' ')[0]}`;

    $('#pf_code').value = p.code || '';
    $('#pf_name').value = p.full_name || '';
    $('#pf_phone').value = p.phone || '';
    $('#pf_email').value = p.email || session.user.email || '';

    await loadAll();
    bindNav();
    bindForms();
    subscribeRealtime();
    initPush();
  }

  async function loadAll() {
    const uid = session.user.id;
    const [{ data: v }, { data: s }, { data: n }] = await Promise.all([
      window.sb.from('vehicles').select('*').eq('customer_id', uid).order('created_at', { ascending: false }),
      window.sb.from('services').select('*, vehicles(make, model)').eq('customer_id', uid).order('created_at', { ascending: false }),
      window.sb.from('notifications').select('*').eq('customer_id', uid).order('created_at', { ascending: false }).limit(50)
    ]);
    vehicles = v || [];
    services = s || [];
    notifications = n || [];
    renderAll();
  }

  function renderAll() {
    renderStats();
    renderServices('#recentServices', services.slice(0, 3));
    renderServices('#allServices', services);
    renderVehicles('#allVehicles', vehicles);
    renderNotifs('#recentNotifs', notifications.slice(0, 5));
    renderNotifs('#allNotifs', notifications);
    updateNotifBadge();
  }

  function renderStats() {
    $('#statServices').textContent = services.length;
    const today = new Date();
    $('#statActive').textContent = services.filter(s => s.warranty_until && new Date(s.warranty_until) >= today).length;
    $('#statVehicles').textContent = vehicles.length;
    $('#statSince').textContent = session.profile.created_at
      ? new Date(session.profile.created_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
      : '—';
  }

  function warrantyDaysLeft(svc) {
    if (!svc.warranty_until) return null;
    const end = new Date(svc.warranty_until);
    const now = new Date();
    return Math.ceil((end - now) / 86400000);
  }

  function warrantyRing(svc) {
    if (!svc.warranty_until) return '';
    const total = svc.warranty_months || 12;
    const end = new Date(svc.warranty_until);
    const start = new Date(end); start.setMonth(start.getMonth() - total);
    const now = new Date();
    let pct = Math.round(((now - start) / (end - start)) * 100);
    pct = Math.max(0, Math.min(100, pct));
    const remaining = 100 - pct;
    const r = 18, c = 2 * Math.PI * r;
    const offset = c - (remaining / 100) * c;
    const expired = remaining <= 0;
    return `
      <div class="ring-wrap ${expired ? 'ring-wrap--expired' : ''}" title="${expired ? 'Warranty expired' : remaining + '% warranty remaining'}">
        <svg width="46" height="46"><circle class="ring-bg" cx="23" cy="23" r="${r}"></circle>
        <circle class="ring-fg" cx="23" cy="23" r="${r}" stroke-dasharray="${c}" stroke-dashoffset="${offset}"></circle></svg>
        <div class="ring-label">${expired ? '0%' : remaining + '%'}</div>
      </div>`;
  }

  function warrantyCountdownText(svc) {
    const days = warrantyDaysLeft(svc);
    if (days === null) return '';
    if (days <= 0) return `<div class="warranty-countdown warranty-countdown--expired"><i class="fas fa-shield-halved"></i>Warranty expired</div>`;
    if (days === 1) return `<div class="warranty-countdown warranty-countdown--soon"><i class="fas fa-hourglass-half"></i>1 day left on warranty</div>`;
    if (days <= 30) return `<div class="warranty-countdown warranty-countdown--soon"><i class="fas fa-hourglass-half"></i>${days} days left on warranty</div>`;
    return `<div class="warranty-countdown"><i class="fas fa-shield-halved"></i>${days} days left on warranty</div>`;
  }

  function renderServices(sel, list) {
    const host = $(sel);
    if (!host) return;
    if (!list.length) {
      host.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><i class="fas fa-shield-halved"></i><p>No services yet. Book your first service from the homepage!</p></div>`;
      return;
    }
    host.innerHTML = list.map(s => `
      <div class="svc-card">
        <div class="svc-card__top">
          <div>
            <div class="svc-card__type">${window.escapeHtml(s.service_type)}</div>
            <div class="svc-card__pkg">${window.escapeHtml(s.package || '')}</div>
          </div>
          ${warrantyRing(s)}
        </div>
        <div class="svc-card__meta">
          <div><i class="fas fa-hashtag"></i><span class="svc-code">${s.code}</span></div>
          ${s.vehicles ? `<div><i class="fas fa-car"></i>${window.escapeHtml((s.vehicles.make||'') + ' ' + (s.vehicles.model||''))}</div>` : ''}
          ${s.price ? `<div><i class="fas fa-tag"></i>${Number(s.price).toLocaleString()} EGP</div>` : ''}
          <div><i class="fas fa-calendar"></i>${window.fmtDate(s.created_at)}</div>
          ${s.warranty_until ? `<div><i class="fas fa-shield"></i>Warranty until ${window.fmtDate(s.warranty_until)}</div>` : ''}
        </div>
        ${warrantyCountdownText(s)}
        <div class="svc-card__foot">
          <span class="badge badge--${s.status}">${s.status.replace('_',' ')}</span>
        </div>
      </div>
    `).join('');
  }

  function renderVehicles(sel, list) {
    const host = $(sel);
    if (!host) return;
    if (!list.length) {
      host.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><i class="fas fa-car"></i><p>No vehicles registered yet.</p></div>`;
      return;
    }
    host.innerHTML = list.map(v => `
      <div class="svc-card">
        <div class="svc-card__top">
          <div>
            <div class="svc-card__type">${window.escapeHtml(v.make)} ${window.escapeHtml(v.model||'')}</div>
            <div class="svc-card__pkg">${window.escapeHtml(v.year || '')}</div>
          </div>
        </div>
        <div class="svc-card__meta">
          <div><i class="fas fa-hashtag"></i><span class="svc-code">${v.code}</span></div>
          ${v.color ? `<div><i class="fas fa-palette"></i>${window.escapeHtml(v.color)}</div>` : ''}
          ${v.plate ? `<div><i class="fas fa-id-card"></i>${window.escapeHtml(v.plate)}</div>` : ''}
          <div><i class="fas fa-calendar"></i>Added ${window.fmtDate(v.created_at)}</div>
        </div>
      </div>
    `).join('');
  }

  function renderNotifs(sel, list) {
    const host = $(sel);
    if (!host) return;
    if (!list.length) {
      host.innerHTML = `<div class="empty-state"><i class="fas fa-bell"></i><p>No notifications yet.</p></div>`;
      return;
    }
    const icons = { info: 'fa-circle-info', success: 'fa-check', warning: 'fa-triangle-exclamation' };
    host.innerHTML = list.map(n => `
      <div class="notif-item notif-item--${n.type} ${n.is_read ? '' : 'unread'}" data-id="${n.id}">
        <div class="notif-item__icon"><i class="fas ${icons[n.type] || 'fa-circle-info'}"></i></div>
        <div class="notif-item__body">
          <b>${window.escapeHtml(n.title)}</b>
          <p>${window.escapeHtml(n.message)}</p>
          <time>${new Date(n.created_at).toLocaleString('en-GB')}</time>
        </div>
      </div>
    `).join('');
    $$('.notif-item', host).forEach(el => el.addEventListener('click', () => markRead(el.dataset.id)));
  }

  function updateNotifBadge() {
    const unread = notifications.filter(n => !n.is_read).length;
    const badge = $('#notifBadge');
    badge.style.display = unread ? 'inline-block' : 'none';
    badge.textContent = unread;
  }

  async function markRead(id) {
    await window.sb.from('notifications').update({ is_read: true }).eq('id', id);
    const n = notifications.find(x => x.id === id);
    if (n) n.is_read = true;
    renderNotifs('#recentNotifs', notifications.slice(0, 5));
    renderNotifs('#allNotifs', notifications);
    updateNotifBadge();
  }

  $('#markAllReadBtn')?.addEventListener('click', async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (!unreadIds.length) return;
    await window.sb.from('notifications').update({ is_read: true }).in('id', unreadIds);
    notifications.forEach(n => n.is_read = true);
    renderNotifs('#allNotifs', notifications);
    renderNotifs('#recentNotifs', notifications.slice(0, 5));
    updateNotifBadge();
    window.toast('All notifications marked as read', 'success');
  });

  function bindNav() {
    $$('.dash__nav-item[data-view]').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.dash__nav-item[data-view]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const view = btn.dataset.view;
        $$('.view').forEach(v => v.style.display = v.dataset.view === view ? 'block' : 'none');
        const titles = {
          overview: ['Welcome back', "Here's what's happening with your account"],
          services: ['My Services', 'All services performed on your vehicles'],
          vehicles: ['My Vehicles', 'Vehicles registered to your account'],
          notifications: ['Notifications', 'Live updates from our team'],
          profile: ['Profile', 'Manage your account details']
        };
        $('#viewTitle').textContent = titles[view][0];
        $('#viewSubtitle').textContent = titles[view][1];
        $('#sidebar').classList.remove('open');
        $('#sidebarBackdrop').classList.remove('open');
        $('#mobileToggle').setAttribute('aria-expanded', 'false');
      });
    });

    $('#logoutBtn').addEventListener('click', window.logout);
    $('#mobileToggle').addEventListener('click', () => {
      const isOpen = $('#sidebar').classList.toggle('open');
      $('#sidebarBackdrop').classList.toggle('open', isOpen);
      $('#mobileToggle').setAttribute('aria-expanded', String(isOpen));
    });
    $('#sidebarBackdrop').addEventListener('click', () => {
      $('#sidebar').classList.remove('open');
      $('#sidebarBackdrop').classList.remove('open');
      $('#mobileToggle').setAttribute('aria-expanded', 'false');
    });
  }

  function bindForms() {
    $('#profileForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const nameErr = window.JSFValidate.fullName($('#pf_name').value);
      const phoneErr = window.JSFValidate.phone($('#pf_phone').value, false); // phone optional here
      if (nameErr || phoneErr) {
        window.toast(nameErr || phoneErr, 'error');
        return;
      }
      const { error } = await window.sb.from('profiles').update({
        full_name: $('#pf_name').value.trim(),
        phone: $('#pf_phone').value.trim()
      }).eq('id', session.user.id);
      window.toast(error ? 'Could not save changes' : 'Profile updated', error ? 'error' : 'success');
      if (!error) {
        $('#userName').textContent = $('#pf_name').value.trim();
        $('#userAvatar').textContent = $('#pf_name').value.trim()[0].toUpperCase();
      }
    });

    $('#passwordForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const pass = $('#pf_newpass').value;
      const passErr = window.JSFValidate.password(pass);
      if (passErr) {
        window.toast(passErr, 'error');
        return;
      }
      const { error } = await window.sb.auth.updateUser({ password: pass });
      window.toast(error ? error.message : 'Password updated successfully', error ? 'error' : 'success');
      if (!error) $('#pf_newpass').value = '';
    });
  }

  function subscribeRealtime() {
    const uid = session.user.id;
    window.sb.channel('customer-live-' + uid)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'services', filter: `customer_id=eq.${uid}` }, async () => {
        await loadAll(); window.toast('A service on your account was updated', 'success');
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles', filter: `customer_id=eq.${uid}` }, async () => {
        await loadAll(); window.toast('A vehicle was added to your account', 'success');
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `customer_id=eq.${uid}` }, async () => {
        await loadAll();
      })
      .subscribe();
  }

  // ── Web Push notifications ──────────────────────────────────────────
  // IMPORTANT: this is the VAPID *public* key only — it's meant to be
  // public and safe to ship in client-side code, the same way a site's
  // domain name is public. The matching *private* key never appears
  // anywhere in this repo; it only lives as a secret on the Supabase
  // Edge Function that actually sends the pushes.
  const VAPID_PUBLIC_KEY = 'BIe1EtwVTKPP44ZCPQk7mxucAjijqkPqtn3SCXLa2vje9Wtb-n5YFto1pnHAKEPZejUbjpmdcAuQeivvV_C9Af0';

  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
  }

  async function initPush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return; // unsupported browser — fail silently, nothing else on the page depends on this

    let registration;
    try {
      registration = await navigator.serviceWorker.register('/sw.js');
    } catch (err) {
      console.warn('[Push] service worker registration failed:', err);
      return;
    }

    // Re-save automatically if the browser renews the subscription on its own.
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'PUSH_SUBSCRIPTION_RENEWED') {
        savePushSubscription(event.data.subscription);
      }
    });

    const existing = await registration.pushManager.getSubscription();
    if (existing) return; // already subscribed on this device — nothing to prompt

    if (Notification.permission === 'denied') return; // they said no before; don't nag

    // Not subscribed yet on this device — show the opt-in card instead of
    // auto-requesting permission, since an unprompted permission popup on
    // page load is exactly the kind of thing browsers penalize and people
    // reflexively dismiss.
    const prompt = $('#pushPrompt');
    if (prompt) prompt.style.display = 'flex';

    const enableBtn = $('#enablePushBtn');
    if (enableBtn) {
      enableBtn.addEventListener('click', () => enablePush(registration), { once: true });
    }
  }

  async function enablePush(registration) {
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        window.toast('Notifications permission was not granted', 'error');
        return;
      }
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
      await savePushSubscription(subscription);
      const prompt = $('#pushPrompt');
      if (prompt) prompt.style.display = 'none';
      window.toast('Push notifications enabled', 'success');
    } catch (err) {
      console.warn('[Push] could not subscribe:', err);
      window.toast('Could not enable notifications on this device', 'error');
    }
  }

  async function savePushSubscription(subscription) {
    const json = typeof subscription.toJSON === 'function' ? subscription.toJSON() : subscription;
    const { error } = await window.sb.from('push_subscriptions').upsert({
      customer_id: session.user.id,
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
      user_agent: navigator.userAgent.slice(0, 255)
    }, { onConflict: 'endpoint' });
    if (error) console.warn('[Push] could not save subscription:', error);
  }
initPushNotifications(user.id);
  init();
})();
