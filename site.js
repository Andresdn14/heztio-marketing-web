/* Heztio marketing site — progressive enhancement only (page works without it).
   Nav state, mobile menu, scroll reveals, and pausing off-screen loops. */
(function () {
  var d = document;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Site config — the one place to set the public price signal.
     Leave PRICE empty until there is a confirmed number, e.g. 'Desde $X por unidad al mes'. */
  var PRICE = '';
  if (PRICE) d.querySelectorAll('[data-price]').forEach(function (el) { el.textContent = PRICE; });

  /* Conversion events. Sent to whichever analytics is loaded (Plausible, Vercel, GA/GTM);
     a no-op when none is. WhatsApp links also carry a [ref: …] tag in the prefilled text. */
  function track(name, data) {
    try {
      if (typeof window.plausible === 'function') window.plausible(name, { props: data });
      if (typeof window.va === 'function') window.va('event', { name: name, data: data });
      if (typeof window.gtag === 'function') window.gtag('event', name, data);
      else if (window.dataLayer) window.dataLayer.push(Object.assign({ event: name }, data));
    } catch (err) { /* never block navigation */ }
  }
  var page = location.pathname.replace(/^\/|\.html$/g, '') || 'home';
  var lastSrc = (/[?&]src=([\w-]+)/.exec(location.search) || [0, page])[1];
  d.addEventListener('click', function (e) {
    var a = e.target.closest('a[href*="wa.me/"], [data-demo]');
    if (!a) return;
    var src = (a.getAttribute('data-src') || 'link') + (page === 'home' ? '' : '-' + page);
    if (a.hasAttribute('data-demo')) { lastSrc = src; track('demo_open', { src: src }); }
    else track('whatsapp_click', { src: src });
  });

  /* Sticky nav shadow */
  var nav = d.querySelector('.nav');
  var toggle = d.querySelector('.nav-toggle');
  var menu = d.getElementById('mobile-menu');
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      nav.classList.toggle('is-scrolled', window.scrollY > 8);
      ticking = false;
    });
  }
  if (nav) { window.addEventListener('scroll', onScroll, { passive: true }); onScroll(); }

  /* Mobile menu */
  function setOpen(open) {
    if (!toggle) return;
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  }
  if (toggle && menu) {
  toggle.addEventListener('click', function () {
    setOpen(!nav.classList.contains('is-open'));
  });
  menu.addEventListener('click', function (e) {
    if (e.target.closest('a')) setOpen(false);
  });
  d.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) { setOpen(false); toggle.focus(); }
  });
  d.addEventListener('click', function (e) {
    if (nav.classList.contains('is-open') && !nav.contains(e.target)) setOpen(false);
  });
  window.matchMedia('(min-width: 981px)').addEventListener('change', function (m) {
    if (m.matches) setOpen(false);
  });
  }

  /* Scroll reveals */
  var targets = d.querySelectorAll('.reveal, .stagger, [data-inview]');
  if (reduce || !('IntersectionObserver' in window)) {
    targets.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          el.classList.add('in');
          if (el.classList.contains('lift')) {
            el.addEventListener('transitionend', function done(ev) {
              if (ev.target !== el || ev.propertyName !== 'opacity') return;
              el.classList.remove('reveal');
              el.removeEventListener('transitionend', done);
            });
          }
          io.unobserve(el);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    targets.forEach(function (el) { io.observe(el); });
  }

  /* Demo request modal */
  var dlg = d.getElementById('demo');
  var form = d.getElementById('demo-form');
  if (dlg && form && typeof dlg.showModal === 'function') {
    var API = 'https://api.heztio.com/demo-requests';
    var WA = 'https://wa.me/573145951905?text=Hola%2C%20quiero%20agendar%20una%20demo%20de%20Heztio';
    var formView = dlg.querySelector('.demo-form-view');
    var okView = dlg.querySelector('.demo-success');
    var alertBox = form.querySelector('.form-alert');
    var submit = form.querySelector('.demo-submit');
    var lastFocus = null;
    var tried = false;
    var rules = {
      name: function (v) { return v.length >= 2 || 'Escribe tu nombre.'; },
      phone: function (v) { return /^\+?[\d\s().-]{7,20}$/.test(v) || (v ? 'Revisa el número; parece incompleto.' : 'Escribe tu WhatsApp.'); },
      building: function (v) { return v.length >= 2 || 'Escribe el nombre del conjunto.'; },
      city: function (v) { return !!v || 'Selecciona la ciudad.'; },
      email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) || (v ? 'Revisa tu correo; parece incompleto.' : 'Escribe tu correo.'); },
      units: function (v) { return !v || (/^\d{1,6}$/.test(v) && +v > 0) || 'Escribe solo números, por ejemplo 120.'; }
    };

    function check(name) {
      var el = form.elements[name];
      var res = rules[name](el.value.trim());
      var err = d.getElementById(el.id + '-err');
      var bad = res !== true;
      el.setAttribute('aria-invalid', String(bad));
      err.textContent = bad ? res : '';
      return !bad;
    }
    function validate() {
      var first = null;
      Object.keys(rules).forEach(function (n) {
        if (!check(n) && !first) first = form.elements[n];
      });
      if (first) {
        var more = first.closest('details');
        if (more) more.open = true;
        first.focus();
      }
      return !first;
    }
    form.addEventListener('input', function (e) {
      if (tried && rules[e.target.name]) check(e.target.name);
    });

    function showAlert(html) {
      alertBox.innerHTML = html;
      alertBox.hidden = !html;
    }
    function setLoading(on) {
      submit.disabled = on;
      submit.classList.toggle('is-loading', on);
      submit.querySelector('.lbl').textContent = on ? 'Enviando…' : 'Enviar solicitud';
      form.setAttribute('aria-busy', String(on));
    }
    function reset() {
      form.reset();
      tried = false;
      showAlert('');
      Object.keys(rules).forEach(function (n) {
        form.elements[n].removeAttribute('aria-invalid');
        d.getElementById(form.elements[n].id + '-err').textContent = '';
      });
      formView.hidden = false;
      okView.hidden = true;
      dlg.setAttribute('aria-labelledby', 'demo-title');
    }

    function open(e) {
      if (e) e.preventDefault();
      if (nav && nav.classList.contains('is-open')) setOpen(false);
      lastFocus = d.activeElement;
      if (!okView.hidden) reset();
      dlg.showModal();
      d.documentElement.classList.add('modal-open');
      form.elements.name.focus();
    }
    function close() { if (dlg.open) dlg.close(); }

    d.addEventListener('click', function (e) {
      var t = e.target.closest('[data-demo]');
      if (t) open(e);
    });
    dlg.addEventListener('click', function (e) {
      if (e.target === dlg || e.target.closest('[data-demo-close]')) close();
    });
    dlg.addEventListener('close', function () {
      d.documentElement.classList.remove('modal-open');
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    });
    /* keep Tab inside the dialog */
    dlg.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var f = Array.prototype.filter.call(
        dlg.querySelectorAll('a[href], button:not([disabled]), input:not([tabindex="-1"]), select, textarea, [tabindex="0"]'),
        function (el) { return el.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && d.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && d.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      tried = true;
      showAlert('');
      if (!validate()) return;
      var v = function (n) { return form.elements[n].value.trim(); };
      var body = { name: v('name'), email: v('email'), phone: v('phone'), building: v('building'), company_website: form.elements.company_website.value };
      if (v('role')) body.role = v('role');
      if (v('units')) body.units = parseInt(v('units'), 10);
      /* The API has no city/source fields; they travel at the top of the message. */
      body.message = 'Ciudad: ' + v('city') + '\nOrigen: web-' + lastSrc + (v('message') ? '\n\n' + v('message') : '');
      setLoading(true);
      fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body)
      }).then(function (r) {
        setLoading(false);
        if (r.ok) {
          track('demo_submit', { src: lastSrc, city: v('city') });
          formView.hidden = true;
          okView.hidden = false;
          dlg.setAttribute('aria-labelledby', 'demo-success-title');
          okView.focus();
        } else if (r.status === 429) {
          showAlert('Recibimos varias solicitudes seguidas desde tu conexión. Intenta de nuevo en unos minutos o <a href="' + WA + '" rel="noopener">escríbenos por WhatsApp</a>.');
        } else if (r.status === 400) {
          showAlert('Revisa los datos del formulario e intenta de nuevo. Si el problema sigue, escríbenos a <a href="mailto:info@heztio.com">info@heztio.com</a>.');
        } else {
          throw new Error(String(r.status));
        }
      }).catch(function () {
        setLoading(false);
        showAlert('No pudimos enviar tu solicitud. Escríbenos por <a href="' + WA + '" rel="noopener">WhatsApp</a> o a <a href="mailto:info@heztio.com?subject=Solicitud%20de%20demo%20Heztio">info@heztio.com</a> y te respondemos.');
      });
    });

    if (location.hash === '#demo') open();
  }

  /* Pause decorative loops while off-screen */
  if ('IntersectionObserver' in window) {
    var loopIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        entry.target.classList.toggle('is-paused', !entry.isIntersecting);
      });
    });
    d.querySelectorAll('[data-loop]').forEach(function (el) { loopIo.observe(el); });
  }
})();
