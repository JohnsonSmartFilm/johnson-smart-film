/* ============================================================
   JOHNSON SMART FILM — Header auth-aware nav
   ============================================================ */
document.addEventListener('DOMContentLoaded', async () => {
  if (!window.getSession) return;
  try {
    const session = await window.getSession();
    if (!session || !session.profile) return;

    const dest = session.profile.role === 'admin' ? '/admin.html' : '/dashboard.html';
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
});
