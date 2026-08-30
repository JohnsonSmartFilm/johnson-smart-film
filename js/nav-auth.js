/* ============================================================
   JOHNSON SMART FILM — Header auth-aware nav
   ------------------------------------------------------------
   Runs the readiness check itself instead of assuming
   DOMContentLoaded hasn't fired yet: this file is injected
   dynamically (after idle/first interaction on the homepage) so
   by the time it runs, the DOM is already guaranteed to be ready
   and that event has already happened and will never fire again.
   ============================================================ */
function __navAuthInit() {
  (async () => {
    if (!window.getSession) return;
    try {
      const session = await window.getSession();
      if (!session || !session.profile) return;

      const dest = session.profile.role === 'admin' ? '/admin/' : '/dashboard/';
      const label = session.profile.role === 'admin' ? 'Admin Panel' : 'My Dashboard';

      [document.getElementById('navLoginLink'), document.getElementById('navLoginLinkMobile')]
        .forEach(el => {
          if (!el) return;
          el.href = dest;
          el.innerHTML = `<i class="fas fa-gauge" style="margin-right:6px;"></i>${label}`;
        });
    } catch (err) {
      console.warn('[Johnson] nav-auth check failed:', err);
    }
  })();
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', __navAuthInit);
} else {
  __navAuthInit();
}
