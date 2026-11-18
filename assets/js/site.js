/* HABITS Lab — shared behaviour: theme toggle, mobile menu, people GIFs */
(function () {
  'use strict';

  var root = document.documentElement;
  var KEY = 'habits-theme';
  var media = window.matchMedia('(prefers-color-scheme: dark)');

  function saved() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function resolved() {
    var t = saved();
    if (t === 'light' || t === 'dark') return t;
    return media.matches ? 'dark' : 'light';
  }
  function apply() {
    var r = resolved();
    root.setAttribute('data-theme-resolved', r);
    var btn = document.querySelector('[data-theme-toggle]');
    if (btn) btn.setAttribute('aria-label', r === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    document.dispatchEvent(new CustomEvent('themechange', { detail: r }));
  }

  // ---- theme toggle (light <-> dark, remembers the choice) ----
  var toggle = document.querySelector('[data-theme-toggle]');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var next = resolved() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem(KEY, next); } catch (e) {}
      apply();
    });
  }
  // follow the system while the visitor hasn't picked a theme
  var onSystem = function () { if (!saved()) apply(); };
  if (media.addEventListener) media.addEventListener('change', onSystem);
  else if (media.addListener) media.addListener(onSystem);
  apply();

  // ---- mobile menu ----
  var menuBtn = document.querySelector('.menu-toggle');
  var nav = document.getElementById('site-nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) { menuBtn.click(); menuBtn.focus(); }
    });
  }

  // ---- People: static photo, GIF on hover (Larremore-lab style) ----
  var container = document.querySelector('[data-gif-mode]');
  var mode = container ? container.getAttribute('data-gif-mode') : 'hover';
  var noHover = window.matchMedia('(hover: none)').matches;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var autoplay = (mode === 'always' || noHover) && !reduceMotion;

  document.querySelectorAll('.person-photo img[data-gif]').forEach(function (img) {
    var box = img.parentElement;
    var card = img.closest('.person');
    var play = function () { img.src = img.dataset.gif; box.classList.add('is-playing'); };
    var stop = function () { img.src = img.dataset.static; box.classList.remove('is-playing'); };

    if (autoplay) {
      // phones/tablets: start the GIF when the card scrolls into view
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries, obs) {
          entries.forEach(function (en) { if (en.isIntersecting) { play(); obs.unobserve(img); } });
        }, { rootMargin: '100px' }).observe(img);
      } else { play(); }
      return;
    }
    // preload the GIF the first time the pointer gets close, so hover feels instant
    card.addEventListener('pointerenter', play);
    card.addEventListener('pointerleave', stop);
    card.addEventListener('focusin', play);
    card.addEventListener('focusout', stop);
  });
})();
