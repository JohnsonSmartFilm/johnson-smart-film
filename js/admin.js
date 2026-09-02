/* ============================================================
   JOHNSON SMART FILM — Admin Panel
   ============================================================ */
(function () {
  let session = null;
  let customers = [];   // profiles (role=customer) + counts
  let bookings = [];
  let allServices = [];
  let activeCustomerId = null;

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  async function init() {
    session = await window.requireAuth('admin');
    if (!session) return;

    $('#loading').style.display = 'none';
    $('#app').style.display = 'grid';
    $('#userName').textContent = session.profile.full_name || 'Admin';
    $('#userAvatar').textContent = (session.profile.full_name || 'A').trim()[0].toUpperCase();

    await loadAll();
    bindNav();
    bindModals();
    bindCustomerForm();
    bindVehicleForm();
    bindServiceForm();
    bindCustomerDetailModal();
    subscribeRealtime();
  }

  async function loadAll() {
    const [{ data: profiles }, { data: vehicles }, { data: services }, { data: bk }] = await Promise.all([
      window.sb.from('profiles').select('*').eq('role', 'customer').order('created_at', { ascending: false }),
      window.sb.from('vehicles').select('*'),
      window.sb.from('services').select('*, profiles(full_name, code), vehicles(make, model)').order('created_at', { ascending: false }),
      window.sb.from('bookings').select('*').order('created_at', { ascending: false })
    ]);

    allServices = services || [];
    bookings = bk || [];
    customers = (profiles || []).map(p => ({
      ...p,
      vehicleCount: (vehicles || []).filter(v => v.customer_id === p.id).length,
      serviceCount: allServices.filter(s => s.customer_id === p.id).length
    }));

    renderOverview();
    renderCustomers();
    renderBookings();
    renderServices();
  }

  function renderOverview() {
    $('#statCustomers').textContent = customers.length;
    $('#statServices').textContent = allServices.length;
    const newBk = bookings.filter(b => b.status === 'new').length;
    $('#statNewBookings').textContent = newBk;
    $('#statPending').textContent = allServices.filter(s => s.status === 'pending').length;
    const badge = $('#bookingBadge');
    badge.style.display = newBk ? 'inline-block' : 'none';
    badge.textContent = newBk;

    const tbody = $('#overviewBookingsTable tbody');
    const list = bookings.slice(0, 6);
    tbody.innerHTML = list.length ? list.map(b => `
      <tr>
        <td><strong>${window.escapeHtml(b.full_name)}</strong></td>
        <td>${window.escapeHtml(b.service_type || '—')}</td>
        <td>${window.escapeHtml(b.phone)}</td>
        <td>${window.fmtDate(b.created_at)}</td>
        <td><span class="badge badge--${b.status}">${b.status}</span></td>
      </tr>`).join('') : `<tr><td colspan="5"><div class="empty-state"><i class="fas fa-inbox"></i><p>No booking requests yet.</p></div></td></tr>`;
  }

  function renderCustomers() {
    $('#customersCount').textContent = `(${customers.length})`;
    const tbody = $('#customersTable tbody');
    tbody.innerHTML = customers.length ? customers.map(c => `
      <tr>
        <td><span class="svc-code">${c.code || '—'}</span></td>
        <td><strong>${window.escapeHtml(c.full_name)}</strong></td>
        <td>${window.escapeHtml(c.email || '')}<br><span style="font-size:12px;">${window.escapeHtml(c.phone || '')}</span></td>
        <td>${c.vehicleCount}</td>
        <td>${c.serviceCount}</td>
        <td>${window.fmtDate(c.created_at)}</td>
        <td><div class="dtable-actions"><button class="icon-btn" data-open-customer="${c.id}" title="View"><i class="fas fa-eye"></i></button><button class="icon-btn icon-btn--danger" data-delete-customer="${c.id}" title="Delete customer"><i class="fas fa-trash"></i></button></div></td>
      </tr>`).join('') : `<tr><td colspan="7"><div class="empty-state"><i class="fas fa-users"></i><p>No customers yet. Add your first one!</p></div></td></tr>`;

    $$('[data-open-customer]', tbody).forEach(btn => btn.addEventListener('click', () => openCustomerDetail(btn.dataset.openCustomer)));
    $$('[data-delete-customer]', tbody).forEach(btn => btn.addEventListener('click', () => deleteCustomer(btn.dataset.deleteCustomer)));
  }

  function renderBookings() {
    const tbody = $('#bookingsTable tbody');
    tbody.innerHTML = bookings.length ? bookings.map(b => `
      <tr>
        <td><strong>${window.escapeHtml(b.full_name)}</strong></td>
        <td>${window.escapeHtml(b.email)}<br><span style="font-size:12px;">${window.escapeHtml(b.phone)}</span></td>
        <td>${window.escapeHtml(b.service_type || '—')}<br><span style="font-size:12px;">${window.escapeHtml(b.package || '')}</span></td>
        <td>${window.escapeHtml(b.vehicle_info || '—')}</td>
        <td>${window.fmtDate(b.preferred_date || b.created_at)}</td>
        <td><span class="badge badge--${b.status}">${b.status}</span></td>
        <td><div class="dtable-actions">
          <a class="icon-btn" href="https://wa.me/${(b.phone||'').replace(/\D/g,'')}" target="_blank" title="WhatsApp"><i class="fab fa-whatsapp"></i></a>
          ${b.status !== 'converted' ? `<button class="icon-btn" data-contact="${b.id}" title="Mark contacted"><i class="fas fa-phone"></i></button>
          <button class="icon-btn" data-convert="${b.id}" title="Convert to customer"><i class="fas fa-user-plus"></i></button>` : ''}
        </div></td>
      </tr>`).join('') : `<tr><td colspan="7"><div class="empty-state"><i class="fas fa-inbox"></i><p>No booking requests yet.</p></div></td></tr>`;

    $$('[data-contact]', tbody).forEach(btn => btn.addEventListener('click', () => updateBookingStatus(btn.dataset.contact, 'contacted')));
    $$('[data-convert]', tbody).forEach(btn => btn.addEventListener('click', () => convertBookingToCustomer(btn.dataset.convert)));
  }

  function renderServices() {
    const tbody = $('#servicesTable tbody');
    tbody.innerHTML = allServices.length ? allServices.map(s => `
      <tr>
        <td><span class="svc-code">${s.code}</span></td>
        <td>${window.escapeHtml(s.profiles ? s.profiles.full_name : '—')}</td>
        <td>${window.escapeHtml(s.service_type)}<br><span style="font-size:12px;">${window.escapeHtml(s.package||'')}</span></td>
        <td>${s.vehicles ? window.escapeHtml((s.vehicles.make||'')+' '+(s.vehicles.model||'')) : '—'}</td>
        <td>${s.price ? Number(s.price).toLocaleString()+' EGP' : '—'}</td>
        <td>
          <select class="dtable-status-select" data-service-status="${s.id}" style="background:var(--bg-2);color:var(--text);border:1px solid var(--border-2);border-radius:6px;padding:5px 8px;font-size:12.5px;">
            ${['pending','in_progress','completed','cancelled'].map(st => `<option value="${st}" ${s.status===st?'selected':''}>${st.replace('_',' ')}</option>`).join('')}
          </select>
        </td>
        <td>${warrantyCountdownLabel(s)}</td>
        <td><div class="dtable-actions"><button class="icon-btn icon-btn--danger" data-delete-service="${s.id}" title="Delete service"><i class="fas fa-trash"></i></button></div></td>
      </tr>`).join('') : `<tr><td colspan="8"><div class="empty-state"><i class="fas fa-shield-halved"></i><p>No services yet.</p></div></td></tr>`;

    $$('[data-service-status]', tbody).forEach(sel => sel.addEventListener('change', async () => {
      const { error } = await window.sb.from('services').update({ status: sel.value }).eq('id', sel.dataset.serviceStatus);
      window.toast(error ? 'Could not update status' : 'Service status updated — customer notified', error ? 'error' : 'success');
      if (!error) await loadAll();
    }));
    $$('[data-delete-service]', tbody).forEach(btn => btn.addEventListener('click', () => deleteServiceFromMainTable(btn.dataset.deleteService)));
  }

  async function deleteServiceFromMainTable(id) {
    if (!confirm('Delete this service? This cannot be undone.')) return;
    const { error } = await window.sb.from('services').delete().eq('id', id);
    window.toast(error ? 'Could not delete service' : 'Service deleted', error ? 'error' : 'success');
    if (!error) await loadAll();
  }

  async function updateBookingStatus(id, status) {
    const { error } = await window.sb.from('bookings').update({ status }).eq('id', id);
    if (!error) { window.toast('Booking marked as ' + status, 'success'); await loadAll(); }
  }

  // ── Convert booking → customer (+ initial vehicle & service) ──
  async function convertBookingToCustomer(id) {
    const b = bookings.find(x => x.id === id);
    if (!b) return;
    openCustomerModal();
    $('#c_name').value = b.full_name;
    $('#c_email').value = b.email;
    $('#c_phone').value = b.phone;
    generatePassword();
    $('#customerForm').dataset.fromBooking = id;
  }

  // ── Add Customer ──
  function generatePassword() {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    let out = '';
    for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
    $('#c_password').value = out;
  }

  function bindCustomerForm() {
    $('#genPassBtn').addEventListener('click', generatePassword);
    $('#customerForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const errBox = $('#customerFormError');
      errBox.style.display = 'none';

      const name = $('#c_name').value.trim();
      const email = $('#c_email').value.trim();
      const phone = $('#c_phone').value.trim();
      const password = $('#c_password').value;
      const joinedRaw = $('#c_joined').value; // yyyy-mm-dd or empty

      const V = window.JSFValidate;
      const validationError = V.fullName(name) || V.email(email) || V.phone(phone, false) || V.password(password);
      if (validationError) {
        errBox.textContent = validationError;
        errBox.style.display = 'block';
        return;
      }

      const submitBtn = $('#customerFormSubmit');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';

      try {
        const temp = window.getTempClient();
        const { data: signUpData, error: signUpErr } = await temp.auth.signUp({ email, password });
        if (signUpErr) throw signUpErr;
        const newId = signUpData.user.id;

        const profileRow = { id: newId, role: 'customer', full_name: name, phone, email };
        // Admin can backdate a customer they're adding manually (one who
        // already existed before this dashboard) — warranty periods on any
        // service added for them are computed from the service's own start
        // date, not this join date, but this keeps "Member Since" honest.
        if (joinedRaw) profileRow.created_at = new Date(joinedRaw + 'T12:00:00').toISOString();

        const { error: insertErr } = await window.sb.from('profiles').insert(profileRow);
        if (insertErr) throw insertErr;

        // If converting from a booking, auto-create the initial vehicle + service
        const bookingId = $('#customerForm').dataset.fromBooking;
        if (bookingId) {
          const b = bookings.find(x => x.id === bookingId);
          if (b) {
            let vehicleId = null;
            if (b.vehicle_info) {
              const parts = b.vehicle_info.split('·').map(s => s.trim());
              const { data: newVeh } = await window.sb.from('vehicles').insert({
                customer_id: newId, make: parts[0] || 'Unknown', model: parts[1] || null, year: parts[2] || null, color: parts[3] || null
              }).select().single();
              vehicleId = newVeh ? newVeh.id : null;
            }
            if (b.service_type) {
              await window.sb.from('services').insert({
                customer_id: newId, vehicle_id: vehicleId, service_type: b.service_type,
                package: b.package, status: 'pending', notes: b.message
              });
            }
            await window.sb.from('bookings').update({ status: 'converted' }).eq('id', bookingId);
          }
          delete $('#customerForm').dataset.fromBooking;
        }

        window.toast(`Customer created — send them: ${email} / ${password}`, 'success');
        closeModal('modalCustomer');
        $('#customerForm').reset();
        await loadAll();
      } catch (err) {
        errBox.textContent = err.message || 'Could not create customer.';
        errBox.style.display = 'block';
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Create Customer';
      }
    });
  }

  // ── Customer Detail Modal ──
  async function openCustomerDetail(id) {
    activeCustomerId = id;
    const c = customers.find(x => x.id === id);
    if (!c) return;
    $('#detailName').textContent = c.full_name;
    $('#detailCode').innerHTML = `<i class="fas fa-hashtag"></i> ${c.code}`;
    $('#detailEmail').innerHTML = `<i class="fas fa-envelope"></i> ${window.escapeHtml(c.email||'')}`;
    $('#detailPhone').innerHTML = `<i class="fas fa-phone"></i> ${window.escapeHtml(c.phone||'')}`;
    await refreshCustomerDetail();
    openModal('modalDetail');
  }

  function bindCustomerDetailModal() {
    $('#deleteCustomerBtn').addEventListener('click', () => deleteCustomer(activeCustomerId));
  }

  async function refreshCustomerDetail() {
    const [{ data: v }, { data: s }] = await Promise.all([
      window.sb.from('vehicles').select('*').eq('customer_id', activeCustomerId).order('created_at', { ascending: false }),
      window.sb.from('services').select('*, vehicles(make,model)').eq('customer_id', activeCustomerId).order('created_at', { ascending: false })
    ]);
    const vehicles = v || [];
    const services = s || [];

    $('#detailVehiclesTable tbody').innerHTML = vehicles.length ? vehicles.map(v => `
      <tr><td><span class="svc-code">${v.code}</span></td><td>${window.escapeHtml(v.make)} ${window.escapeHtml(v.model||'')} ${v.year?('('+v.year+')'):''}</td><td>${window.escapeHtml(v.plate||'—')}</td><td><button class="icon-btn icon-btn--danger" data-delete-vehicle="${v.id}" title="Delete vehicle"><i class="fas fa-trash"></i></button></td></tr>
    `).join('') : `<tr><td colspan="4" style="color:var(--text-3);">No vehicles yet.</td></tr>`;

    $('#detailServicesTable tbody').innerHTML = services.length ? services.map(s => `
      <tr><td><span class="svc-code">${s.code}</span></td><td>${window.escapeHtml(s.service_type)}<br><span style="font-size:12px;color:var(--text-3);">${window.escapeHtml(s.package||'')}</span></td><td><span class="badge badge--${s.status}">${s.status.replace('_',' ')}</span></td><td>${warrantyCountdownLabel(s)}</td><td><button class="icon-btn icon-btn--danger" data-delete-service="${s.id}" title="Delete service"><i class="fas fa-trash"></i></button></td></tr>
    `).join('') : `<tr><td colspan="5" style="color:var(--text-3);">No services yet.</td></tr>`;

    $$('[data-delete-vehicle]', $('#detailVehiclesTable')).forEach(btn => btn.addEventListener('click', () => deleteVehicle(btn.dataset.deleteVehicle)));
    $$('[data-delete-service]', $('#detailServicesTable')).forEach(btn => btn.addEventListener('click', () => deleteService(btn.dataset.deleteService)));

    const sel = $('#s_vehicle');
    sel.innerHTML = '<option value="">— No specific vehicle —</option>' + vehicles.map(v => `<option value="${v.id}">${window.escapeHtml(v.make)} ${window.escapeHtml(v.model||'')}</option>`).join('');
  }

  function bindVehicleForm() {
    $('#addVehicleBtn').addEventListener('click', () => openModal('modalVehicle'));
    $('#vehicleForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const V = window.JSFValidate;
      const validationError = V.make($('#v_make').value) || V.model($('#v_model').value)
        || V.year($('#v_year').value) || V.color($('#v_color').value) || V.plate($('#v_plate').value);
      if (validationError) { window.toast(validationError, 'error'); return; }

      const { error } = await window.sb.from('vehicles').insert({
        customer_id: activeCustomerId,
        make: $('#v_make').value.trim(),
        model: $('#v_model').value.trim() || null,
        year: $('#v_year').value.trim() || null,
        color: $('#v_color').value.trim() || null,
        plate: $('#v_plate').value.trim() || null
      });
      window.toast(error ? 'Could not add vehicle' : 'Vehicle added — customer notified', error ? 'error' : 'success');
      if (!error) { $('#vehicleForm').reset(); closeModal('modalVehicle'); await refreshCustomerDetail(); await loadAll(); }
    });
  }

  function bindServiceForm() {
    $('#addServiceBtn').addEventListener('click', () => {
      $('#serviceForm').reset();
      openModal('modalService');
    });
    $('#serviceForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const months = Number($('#s_warranty').value) || 0;
      const startRaw = $('#s_start_date').value; // yyyy-mm-dd, empty = today
      // Warranty always counts from the service's own start date, so a
      // service the admin backdates (e.g. one done last year, entered
      // today) gets a warranty_until that reflects when it *actually*
      // started, not the moment it was typed into the dashboard.
      const startDate = startRaw ? new Date(startRaw + 'T12:00:00') : new Date();
      const warrantyUntil = months ? new Date(startDate.getTime() + months * 30 * 86400000).toISOString().slice(0, 10) : null;

      const row = {
        customer_id: activeCustomerId,
        vehicle_id: $('#s_vehicle').value || null,
        service_type: $('#s_type').value,
        package: $('#s_package').value,
        price: $('#s_price').value || null,
        status: $('#s_status').value,
        warranty_months: months || null,
        warranty_until: warrantyUntil,
        notes: $('#s_notes').value.trim() || null
      };
      if (startRaw) row.created_at = startDate.toISOString();

      const { error } = await window.sb.from('services').insert(row);
      window.toast(error ? 'Could not add service' : 'Service added — customer notified', error ? 'error' : 'success');
      if (!error) { $('#serviceForm').reset(); closeModal('modalService'); await refreshCustomerDetail(); await loadAll(); }
    });
  }

  function warrantyCountdownLabel(s) {
    if (!s.warranty_until) return '—';
    const days = Math.ceil((new Date(s.warranty_until) - new Date()) / 86400000);
    if (days <= 0) return `<span style="color:var(--red);">${window.fmtDate(s.warranty_until)} · expired</span>`;
    return `${window.fmtDate(s.warranty_until)} <span style="color:var(--text-3);">· ${days}d left</span>`;
  }

  async function deleteService(id) {
    if (!confirm('Delete this service? This cannot be undone.')) return;
    const { error } = await window.sb.from('services').delete().eq('id', id);
    window.toast(error ? 'Could not delete service' : 'Service deleted', error ? 'error' : 'success');
    if (!error) { await refreshCustomerDetail(); await loadAll(); }
  }

  async function deleteVehicle(id) {
    if (!confirm('Delete this vehicle? Its services will stay on record but lose the vehicle link.')) return;
    const { error } = await window.sb.from('vehicles').delete().eq('id', id);
    window.toast(error ? 'Could not delete vehicle' : 'Vehicle deleted', error ? 'error' : 'success');
    if (!error) { await refreshCustomerDetail(); await loadAll(); }
  }

  // ── Delete Customer ──
  // Deletes the customer's profile row. The database cascades that delete
  // down to their vehicles, services, and notifications automatically
  // (see supabase/schema.sql), so nothing is left orphaned in the app.
  // Note: this removes the customer's *access* completely — their profile
  // is gone, so requireAuth() will no longer recognize them and they're
  // signed out for good. The raw sign-in record technically still exists
  // in Supabase Auth (harmless, grants no access with the profile gone);
  // if you want it fully erased, remove it once from Supabase dashboard →
  // Authentication → Users. That step can't be done from the browser with
  // the public anon key for security reasons.
  async function deleteCustomer(id) {
    const c = customers.find(x => x.id === id);
    const name = c ? c.full_name : 'this customer';
    if (!confirm(`Delete ${name}? This permanently removes their account, vehicles, services, and history. This cannot be undone.`)) return;
    const { error } = await window.sb.from('profiles').delete().eq('id', id);
    window.toast(error ? 'Could not delete customer' : `${name} deleted`, error ? 'error' : 'success');
    if (!error) {
      if (activeCustomerId === id) closeModal('modalDetail');
      await loadAll();
    }
  }

  // ── Modal helpers ──
  function openModal(id) { $('#' + id).classList.add('open'); }
  function closeModal(id) { $('#' + id).classList.remove('open'); }
  function openCustomerModal() { $('#customerForm').reset(); $('#customerFormError').style.display = 'none'; openModal('modalCustomer'); }

  function bindModals() {
    $('#addCustomerBtn').addEventListener('click', openCustomerModal);
    $$('[data-close-modal]').forEach(btn => btn.addEventListener('click', () => btn.closest('.modal-overlay').classList.remove('open')));
    $$('.modal-overlay').forEach(ov => ov.addEventListener('click', (e) => { if (e.target === ov) ov.classList.remove('open'); }));
  }

  function bindNav() {
    $$('.dash__nav-item[data-view]').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.dash__nav-item[data-view]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const view = btn.dataset.view;
        $$('.view').forEach(v => v.style.display = v.dataset.view === view ? 'block' : 'none');
        const titles = {
          overview: ['Overview', 'Your business at a glance'],
          customers: ['Customers', 'Every customer account and their vehicles'],
          bookings: ['Booking Requests', 'Leads from the website booking form'],
          services: ['All Services', 'Every service across every customer']
        };
        $('#viewTitle').textContent = titles[view][0];
        $('#viewSubtitle').textContent = titles[view][1];
        $('#sidebar').classList.remove('open');
        $('#sidebarBackdrop').classList.remove('open');
      });
    });
    $('#logoutBtn').addEventListener('click', window.logout);
    $('#mobileToggle').addEventListener('click', () => { $('#sidebar').classList.toggle('open'); $('#sidebarBackdrop').classList.toggle('open'); });
    $('#sidebarBackdrop').addEventListener('click', () => { $('#sidebar').classList.remove('open'); $('#sidebarBackdrop').classList.remove('open'); });
  }

  function subscribeRealtime() {
    window.sb.channel('admin-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bookings' }, async () => {
        await loadAll(); window.toast('New booking request received!', 'success');
      })
      .subscribe();
  }

  init();
})();
