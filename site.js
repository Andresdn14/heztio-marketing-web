/* Heztio marketing site — progressive enhancement only (page works without it).
   Nav state, mobile menu, scroll reveals, and pausing off-screen loops. */
(function () {
  var d = document;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Sticky nav shadow */
  var nav = d.querySelector('.nav');
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      nav.classList.toggle('is-scrolled', window.scrollY > 8);
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Mobile menu */
  var toggle = d.querySelector('.nav-toggle');
  var menu = d.getElementById('mobile-menu');
  function setOpen(open) {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  }
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
