/* Each feature is wrapped in its own try/catch so a problem
   in one block (e.g. a missing element) can never stop the
   rest of the page's interactivity from working. */

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

  /*CONTACT FORM — EmailJS integration */
  safeRun('contact form / EmailJS', () => {
    const EMAILJS_PUBLIC_KEY            = 'YOUR_PUBLIC_KEY';
    const EMAILJS_SERVICE_ID            = 'YOUR_SERVICE_ID';
    const EMAILJS_TEMPLATE_ID_NOTIFY    = 'YOUR_NOTIFY_TEMPLATE_ID';
    const EMAILJS_TEMPLATE_ID_AUTOREPLY = 'YOUR_AUTOREPLY_TEMPLATE_ID';

    if (window.emailjs) {
      emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
    }

    const form = document.getElementById('contactForm');
    const status = document.getElementById('formStatus');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      status.textContent = 'Wird gesendet ...';
      status.className = 'form-status';

      const params = {
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

      emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID_NOTIFY, params)
        .then(() => emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID_AUTOREPLY, params))
        .then(() => {
          status.textContent = 'Vielen Dank! Ihre Anfrage wurde erfolgreich gesendet. Wir melden uns schnellstmöglich bei Ihnen.';
          status.className = 'form-status success';
          form.reset();
        })
        .catch((err) => {
          console.error('EmailJS error:', err);
          status.textContent = 'Leider ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut oder rufen Sie uns direkt an.';
          status.className = 'form-status error';
        });
    });
  });

});
