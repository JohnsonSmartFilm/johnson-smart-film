/* ============================================================
   JOHNSON SMART FILM — Supabase Client & Auth Helpers
   ------------------------------------------------------------
   Fill in your project URL + anon key below (Supabase Dashboard
   → Project Settings → API). These are PUBLIC and safe to ship
   in frontend code — security is enforced by Row Level Security
   policies in supabase/schema.sql.
   ============================================================ */

window.SUPABASE_URL = 'https://btitpahyiyhdkyqndfnn.supabase.co';
window.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0aXRwYWh5aXloZGt5cW5kZm5uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2Njc3MTYsImV4cCI6MjEwMzI0MzcxNn0.DdMR-MG7vbofn2yb72_BEZl5ADkcFvJEkpC0EQiYwDY';

(function () {
  /* Fail-safe UI: if something stops the page from ever getting past its
     "Loading…" screen — a blocked script, a dead network, a Supabase
     outage — show a clear message with a Retry button instead of leaving
     the visitor stuck looking at a spinner forever with no explanation. */
  function showFatalError(msg) {
    var loading = document.getElementById('loading');
    if (!loading) return; // page has no loading screen (e.g. /login/) — nothing to replace
    loading.innerHTML =
      '<div class="dash-load-error">' +
        '<i class="fas fa-triangle-exclamation" style="font-size:28px;color:var(--red,#ff4060);"></i>' +
        '<p style="max-width:320px;text-align:center;">' + msg + '</p>' +
        '<button type="button" id="dashRetryBtn" class="btn btn--primary btn--sm">Retry</button>' +
      '</div>';
    var btn = document.getElementById('dashRetryBtn');
    if (btn) btn.addEventListener('click', function () { window.location.reload(); });
  }
  window.__dashShowFatalError = showFatalError;

  var supabaseMissing = !window.supabase;

  // This script normally runs in <head>, before <body> (and #loading)
  // exist yet, so any UI it shows has to wait for DOMContentLoaded. But on
  // the homepage this file is now injected dynamically after idle/first
  // interaction — by then DOMContentLoaded has already fired once and
  // never fires again, so a plain addEventListener here would silently
  // never run. Check readyState first so this works either way.
  function armWatchdog() {
    if (supabaseMissing) {
      showFatalError('Could not load required files. Please check your internet connection and try again.');
      return;
    }
    setTimeout(function () {
      var loading = document.getElementById('loading');
      if (loading && getComputedStyle(loading).display !== 'none' && !document.getElementById('dashRetryBtn')) {
        showFatalError('This is taking longer than it should. Check your internet connection and try again.');
      }
    }, 10000);
  }
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', armWatchdog);
  } else {
    armWatchdog();
  }

  if (!window.supabase) {
    console.error('[Johnson] Supabase SDK not loaded — check the <script> tag order.');
    // Safe fallbacks so any code that calls these doesn't crash with
    // "is not a function" and instead fails in a visible, understandable way.
    window.getSession = async function () { return null; };
    window.requireAuth = async function () { return null; };
    window.logout = async function () { window.location.href = '/login/'; };
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
      window.location.href = '/login/';
      return null;
    }
    if (role && session.profile.role !== role) {
      window.location.href = session.profile.role === 'admin' ? '/admin/' : '/dashboard/';
      return null;
    }
    return session;
  };

  window.logout = async function () {
    await window.sb.auth.signOut();
    window.location.href = '/login/';
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
