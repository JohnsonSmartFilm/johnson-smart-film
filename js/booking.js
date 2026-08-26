/* ============================================================
   JOHNSON SMART FILM — Live Booking Form
   ============================================================ */
(function () {
  // ⚠️ Change this to your business WhatsApp number (country code, no +, no spaces)
  const BUSINESS_WHATSAPP = '201114171416';

  const form = document.getElementById('bookingForm');
  if (!form) return;

  const steps = Array.from(form.querySelectorAll('.booking-step'));
  const progressSteps = Array.from(document.querySelectorAll('#bookingProgress .booking-progress__step'));
  const errorBox = document.getElementById('bookingFormError');
  const successBox = document.getElementById('bookingSuccess');
  const waLink = document.getElementById('bookingWaLink');
  const submitBtn = document.getElementById('bookingSubmitBtn');

  // ── Preferred Date: open the native calendar on click/focus instead of
  // making the person type mm/dd/yyyy by hand. Typing still works too (for
  // keyboard-only and screen-reader users), this just makes clicking
  // anywhere on the field pop the calendar open immediately.
  const dateInput = document.getElementById('bk_date');
  if (dateInput) {
    dateInput.min = new Date().toISOString().slice(0, 10); // no booking a service in the past
  }
  if (dateInput && typeof dateInput.showPicker === 'function') {
    dateInput.addEventListener('click', () => {
      try { dateInput.showPicker(); } catch (err) { /* ignore */ }
    });
    dateInput.addEventListener('focus', () => {
      try { dateInput.showPicker(); } catch (err) { /* ignore */ }
    });
  }

  let current = 1;

  function showStep(n) {
    current = n;
    steps.forEach(s => s.classList.toggle('is-active', Number(s.dataset.step) === n));
    progressSteps.forEach(p => {
      const num = Number(p.dataset.step);
      p.classList.toggle('is-active', num === n);
      p.classList.toggle('is-done', num < n);
    });
  }

  function validateStep(n) {
    const stepEl = steps.find(s => Number(s.dataset.step) === n);
    let ok = true;
    stepEl.querySelectorAll('[required]').forEach(input => {
      const group = input.closest('.form-group');
      const valid = input.type === 'email'
        ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())
        : input.value.trim().length > 0;
      group.classList.toggle('invalid', !valid);
      if (!valid) ok = false;
    });
    return ok;
  }

  form.querySelectorAll('.booking-next').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!validateStep(current)) return;
      showStep(Number(btn.dataset.goto));
    });
  });
  form.querySelectorAll('.booking-back').forEach(btn => {
    btn.addEventListener('click', () => showStep(Number(btn.dataset.goto)));
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateStep(3) || !validateStep(2)) {
      errorBox.style.display = 'flex';
      showStep(!validateStep(2) ? 2 : 3);
      return;
    }
    errorBox.style.display = 'none';

    const data = Object.fromEntries(new FormData(form).entries());
    const vehicleInfo = [data.make, data.model, data.year, data.color]
      .filter(Boolean).join(' · ');

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

    // 1) Save to database (if Supabase is configured)
    try {
      if (window.sb) {
        await window.sb.from('bookings').insert({
          full_name: data.full_name,
          email: data.email,
          phone: data.phone,
          service_type: data.service_type,
          package: data.package,
          vehicle_info: vehicleInfo,
          preferred_date: data.preferred_date || null,
          message: data.message || null
        });
      }
    } catch (err) {
      console.warn('[Johnson] Could not save booking to database:', err);
    }

    // 2) Build the WhatsApp message with every detail
    const lines = [
      '🚗 *New Booking Request — Johnson Smart Film*',
      '',
      `*Name:* ${data.full_name}`,
      `*Email:* ${data.email}`,
      `*Phone:* ${data.phone}`,
      '',
      `*Service:* ${data.service_type}`,
      `*Package:* ${data.package}`,
      '',
      `*Vehicle:* ${vehicleInfo || '—'}`,
      `*Preferred Date:* ${data.preferred_date || 'Flexible'}`,
      data.message ? `*Notes:* ${data.message}` : null
    ].filter(Boolean).join('\n');

    const url = `https://wa.me/${BUSINESS_WHATSAPP}?text=${encodeURIComponent(lines)}`;
    waLink.href = url;

    // 3) Show success state and open WhatsApp automatically
    form.style.display = 'none';
    document.getElementById('bookingProgress').style.display = 'none';
    successBox.classList.add('is-active');
    window.open(url, '_blank', 'noopener');

    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fab fa-whatsapp"></i> Confirm Booking';
  });
})();
