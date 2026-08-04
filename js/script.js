/* K.M. Entrümpelung & Transport — Script
   Each feature is wrapped in its own try/catch so a problem
   in one block (e.g. a missing element) can never stop the
   rest of the page's interactivity from working.*/

function safeRun(label, fn) {
  try { fn(); } catch (err) { console.error(`[script.js] "${label}" failed:`, err); }
}

document.addEventListener('DOMContentLoaded', () => {

  /* footer year */
  safeRun('footer year', () => {
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  });

  /* sticky header + back-to-top visibility on scroll */
  safeRun('sticky header / back-to-top', () => {
    const header = document.getElementById('siteHeader');
    const backToTop = document.getElementById('backToTop');

    const onScroll = () => {
      if (window.scrollY > 40) header.classList.add('scrolled');
      else header.classList.remove('scrolled');

      if (window.scrollY > 600) backToTop.classList.add('visible');
      else backToTop.classList.remove('visible');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  /* mobile nav toggle */
  safeRun('mobile nav toggle', () => {
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');
    navToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('mobile-open');
      navToggle.setAttribute('aria-expanded', isOpen);
    });
    navLinks.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        navLinks.classList.remove('mobile-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  });

  /* scroll reveal animation */
  safeRun('scroll reveal', () => {
    const revealEls = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
      revealEls.forEach(el => el.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(el => io.observe(el));
  });

  /* FAQ accordion */
  safeRun('FAQ accordion', () => {
    document.querySelectorAll('.faq-item').forEach(item => {
      const q = item.querySelector('.faq-q');
      q.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');
        document.querySelectorAll('.faq-item.open').forEach(open => open.classList.remove('open'));
        if (!isOpen) item.classList.add('open');
      });
    });
  });

  /* before / after gallery sliders */
  safeRun('before/after slider', () => {
    document.querySelectorAll('[data-ba]').forEach(slider => {
      const afterPanel = slider.querySelector('.ba-after');
      const handle = slider.querySelector('.ba-handle');

      const setPosition = (percent) => {
        percent = Math.max(0, Math.min(100, percent));
        afterPanel.style.clipPath = `inset(0 0 0 ${percent}%)`;
        handle.style.left = percent + '%';
      };

      setPosition(50);

      let dragging = false;
      const moveTo = (clientX) => {
        const rect = slider.getBoundingClientRect();
        const percent = ((clientX - rect.left) / rect.width) * 100;
        setPosition(percent);
      };

      slider.addEventListener('mousedown', (e) => { dragging = true; moveTo(e.clientX); });
      window.addEventListener('mousemove', (e) => { if (dragging) moveTo(e.clientX); });
      window.addEventListener('mouseup', () => { dragging = false; });

      slider.addEventListener('touchstart', (e) => { dragging = true; moveTo(e.touches[0].clientX); }, { passive: true });
      slider.addEventListener('touchmove', (e) => { if (dragging) moveTo(e.touches[0].clientX); }, { passive: true });
      slider.addEventListener('touchend', () => { dragging = false; });

      slider.addEventListener('click', (e) => moveTo(e.clientX));
    });
  });

  /* file upload chips (contact form) */
  const MAX_FILE_MB = 5;
  safeRun('file upload chips', () => {
    const input = document.getElementById('attachment');
    const list = document.getElementById('fileList');
    if (!input || !list) return;

    const render = () => {
      list.innerHTML = '';
      Array.from(input.files).forEach((file, idx) => {
        const chip = document.createElement('div');
        const oversize = file.size > MAX_FILE_MB * 1024 * 1024;
        chip.className = 'file-chip' + (oversize ? ' oversize' : '');
        const label = document.createElement('span');
        label.textContent = `${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`;
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.setAttribute('aria-label', `${file.name} entfernen`);
        removeBtn.textContent = '✕';
        removeBtn.addEventListener('click', () => {
          // FileList is read-only, so rebuild it via DataTransfer minus this item
          const dt = new DataTransfer();
          Array.from(input.files).forEach((f, i) => { if (i !== idx) dt.items.add(f); });
          input.files = dt.files;
          render();
        });
        chip.appendChild(label);
        chip.appendChild(removeBtn);
        list.appendChild(chip);
      });
    };

    input.addEventListener('change', render);
  });

  /* CONTACT FORM — EmailJS integration*/
  safeRun('contact form / EmailJS', () => {
    const EMAILJS_PUBLIC_KEY           = '6kRdY9kdSkDABAxEE';
    const EMAILJS_SERVICE_ID           = 'service_pwlblzs';
    const EMAILJS_TEMPLATE_ID_NOTIFY   = 'template_ynxzz8m';
    const EMAILJS_TEMPLATE_ID_AUTOREPLY = 'template_yekf4kb';

    if (window.emailjs) {
      emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
    }

    const form = document.getElementById('contactForm');
    const status = document.getElementById('formStatus');
    const attachmentInput = document.getElementById('attachment');

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      // client-side guard against oversized files before sending
      if (attachmentInput && attachmentInput.files.length) {
        const tooBig = Array.from(attachmentInput.files).some(f => f.size > MAX_FILE_MB * 1024 * 1024);
        if (tooBig) {
          status.textContent = `Mindestens eine Datei ist größer als ${MAX_FILE_MB} MB. Bitte entfernen oder verkleinern.`;
          status.className = 'form-status error';
          return;
        }
      }

      status.textContent = 'Wird gesendet ...';
      status.className = 'form-status';

      const notice = {
        name: form.name.value,
        phone: form.phone.value,
        email: form.email.value,
        service: form.service.value,
        message: form.message.value
      };

      if (!window.emailjs || EMAILJS_PUBLIC_KEY === 'YOUR_PUBLIC_KEY') {
        status.textContent = 'EmailJS ist noch nicht konfiguriert. Bitte Zugangsdaten in js/script.js eintragen.';
        status.className = 'form-status error';
        return;
      }

      // sendForm reads every field directly from the DOM, which is
      // required so file inputs are picked up and attached.
      emailjs.sendForm(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID_NOTIFY, form)
        .then(() => emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID_AUTOREPLY, notice))
        .then(() => {
          status.textContent = 'Vielen Dank! Ihre Anfrage wurde erfolgreich gesendet. Wir melden uns schnellstmöglich bei Ihnen.';
          status.className = 'form-status success';
          form.reset();
          const list = document.getElementById('fileList');
          if (list) list.innerHTML = '';
        })
        .catch((err) => {
          console.error('EmailJS error:', err);
          status.textContent = 'Leider ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut oder rufen Sie uns direkt an.';
          status.className = 'form-status error';
        });
    });
  });

});
