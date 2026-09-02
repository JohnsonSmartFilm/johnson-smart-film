/* ============================================================
   JOHNSON SMART FILM — Shared realistic-data validation
   Used by: js/booking.js (public form), js/dashboard.js (customer
   profile), js/admin.js (customer/vehicle forms).

   This is a FORMAT check, not proof of identity. It rejects obvious
   junk ("asdasd" as a name, "123" as a phone, "9999" as a car year)
   but cannot confirm a phone is reachable or an email inbox is real —
   that needs an OTP/confirmation step, which is a separate feature.
   The matching database-level constraints live in supabase/schema.sql
   and supabase/migration_realistic_data.sql; those are what actually
   stop bad data if someone bypasses this JS and calls the API directly.
   ============================================================ */
(function () {
  const currentYear = new Date().getFullYear();
  const isRepeatedChar = (s) => /^(.)\1+$/.test(s);

  window.JSFValidate = {
    fullName(raw) {
      const v = (raw || '').trim().replace(/\s+/g, ' ');
      if (!v) return 'Please enter a full name.';
      if (!/^[A-Za-z\u0600-\u06FF' -]{3,80}$/.test(v)) return 'Name can only contain letters, spaces, - and \'.';
      if (!/[ ]/.test(v)) return 'Please enter a first and last name.';
      if (v.split(' ').some(w => w.length < 2)) return 'Each part of the name should be at least 2 letters.';
      if (isRepeatedChar(v.replace(/\s/g, ''))) return 'Please enter a real name.';
      return '';
    },
    // `required` lets callers reuse this for optional phone fields (e.g.
    // a dashboard profile where phone isn't mandatory) vs required ones
    // (e.g. the public booking form) without duplicating the regex.
    phone(raw, required = true) {
      const v = (raw || '').trim().replace(/[\s-]/g, '');
      if (!v) return required ? 'Please enter a phone number.' : '';
      if (!/^01[0125][0-9]{8}$/.test(v)) return 'Enter a valid 11-digit Egyptian mobile number (e.g. 010xxxxxxxx).';
      if (isRepeatedChar(v)) return 'Please enter a real phone number.';
      return '';
    },
    email(raw) {
      const v = (raw || '').trim();
      if (!v) return 'Please enter an email address.';
      if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(v)) return 'Enter a valid email address.';
      return '';
    },
    make(raw) {
      const v = (raw || '').trim();
      if (!v) return 'Please enter the car make.';
      if (!/^[A-Za-z\u0600-\u06FF -]{2,40}$/.test(v)) return 'Car make can only contain letters.';
      if (isRepeatedChar(v.replace(/\s/g, ''))) return 'Please enter a real car make.';
      return '';
    },
    model(raw) {
      const v = (raw || '').trim();
      if (!v) return '';
      if (!/^[A-Za-z0-9\u0600-\u06FF -]{1,40}$/.test(v)) return 'Model can only contain letters and numbers.';
      return '';
    },
    year(raw) {
      const v = (raw || '').trim();
      if (!v) return '';
      if (!/^[0-9]{4}$/.test(v) || Number(v) < 1980 || Number(v) > currentYear + 1) {
        return `Enter a real model year (1980–${currentYear + 1}).`;
      }
      return '';
    },
    color(raw) {
      const v = (raw || '').trim();
      if (!v) return '';
      if (!/^[A-Za-z\u0600-\u06FF -]{2,30}$/.test(v)) return 'Color can only contain letters.';
      return '';
    },
    // Plate numbers legitimately mix Arabic/English letters and digits in
    // several valid layouts, so this only rejects empty junk / wildly
    // wrong lengths rather than enforcing one exact pattern.
    plate(raw) {
      const v = (raw || '').trim();
      if (!v) return '';
      if (!/^[A-Za-z0-9\u0600-\u06FF -]{2,15}$/.test(v)) return 'Enter a valid plate number.';
      return '';
    },
    // 8+ chars, at least one letter and one number — a real minimum bar
    // without being so strict it locks out the admin typing a quick
    // temporary password for a new customer.
    password(raw) {
      const v = raw || '';
      if (v.length < 8) return 'Password must be at least 8 characters.';
      if (!/[A-Za-z]/.test(v) || !/[0-9]/.test(v)) return 'Password must include at least one letter and one number.';
      return '';
    }
  };
})();
