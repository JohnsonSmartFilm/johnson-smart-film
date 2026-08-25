/* ============================================================
   JOHNSON SMART FILM — Supabase Client & Auth Helpers
   ------------------------------------------------------------
   Fill in your project URL + anon key below (Supabase Dashboard
   → Project Settings → API). These are PUBLIC and safe to ship
   in frontend code — security is enforced by Row Level Security
   policies in supabase/schema.sql.
   ============================================================ */

window.SUPABASE_URL = 'YOUR_SUPABASE_URL';
window.SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

(function () {
  if (!window.supabase) {
    console.error('[Johnson] Supabase SDK not loaded — check the <script> tag order.');
    return;
  }

  // Main client — this is the session that stays logged in as the
  // current user (admin OR customer) across the whole site.
  window.sb = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, storageKey: 'jsf-auth' }
  });

  /* A throwaway client used ONLY when the admin creates a new
     customer account. It never touches localStorage, so creating
     a customer never logs the admin out of their own session. */
  window.getTempClient = function () {
    return window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  };

  /* Returns { user, profile } or null if not logged in */
  window.getSession = async function () {
    const { data: { session } } = await window.sb.auth.getSession();
    if (!session) return null;
    const { data: profile, error } = await window.sb
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    if (error) return { user: session.user, profile: null };
    return { user: session.user, profile };
  };

  /* Call at the top of a protected page.
     role: 'admin' | 'customer' | null (any logged-in role) */
  window.requireAuth = async function (role) {
    const session = await window.getSession();
    if (!session || !session.profile) {
      window.location.href = '/login.html';
      return null;
    }
    if (role && session.profile.role !== role) {
      window.location.href = session.profile.role === 'admin' ? '/admin.html' : '/dashboard.html';
      return null;
    }
    return session;
  };

  window.logout = async function () {
    await window.sb.auth.signOut();
    window.location.href = '/login.html';
  };

  /* Small helper: format a Postgres date/timestamp nicely */
  window.fmtDate = function (d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  /* Small toast notification helper, shared by dashboard.js & admin.js */
  window.toast = function (msg, type) {
    const host = document.getElementById('toastHost');
    if (!host) { console.log('[toast]', msg); return; }
    const el = document.createElement('div');
    el.className = 'toast' + (type ? ` toast--${type}` : '');
    el.textContent = msg;
    host.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; setTimeout(() => el.remove(), 300); }, 3800);
  };

  window.escapeHtml = function (str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  };
})();
