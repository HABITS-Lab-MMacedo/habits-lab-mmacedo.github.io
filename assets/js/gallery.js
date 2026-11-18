/* HABITS Lab — Gallery: album filter, photo viewer, Drive image fallback */
(function () {
  'use strict';

  var list = document.getElementById('gallery');
  if (!list) return;
  var items = Array.prototype.slice.call(list.querySelectorAll('.gallery-item'));

  // If Drive's thumbnail service refuses an image, try Google's image CDN instead
  function fallback(img, id, size) {
    img.addEventListener('error', function onErr() {
      img.removeEventListener('error', onErr);
      img.src = 'https://lh3.googleusercontent.com/d/' + id + '=w' + size;
    });
  }
  items.forEach(function (li) {
    var btn = li.querySelector('.gallery-frame');
    var img = li.querySelector('img');
    fallback(img, btn.dataset.id, 900);
    img.addEventListener('load', function () { li.classList.add('is-loaded'); });
    if (img.complete && img.naturalWidth) li.classList.add('is-loaded');
  });

  // ---- album filter ----
  var chips = document.querySelectorAll('.chip[data-album]');
  Array.prototype.forEach.call(chips, function (chip) {
    chip.addEventListener('click', function () {
      var album = chip.dataset.album;
      Array.prototype.forEach.call(chips, function (c) { c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
      items.forEach(function (li) { li.hidden = album !== 'all' && li.dataset.album !== album; });
    });
  });

  // ---- viewer ----
  var dialog = document.getElementById('gallery-lightbox');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  var big = document.getElementById('gallery-img');
  var caption = document.getElementById('gallery-caption');
  var count = document.getElementById('gallery-count');
  var current = 0, opener = null;

  function frames() {
    return items.filter(function (li) { return !li.hidden; })
                .map(function (li) { return li.querySelector('.gallery-frame'); });
  }

  function show(frame) {
    var all = frames();
    current = all.indexOf(frame);
    var thumb = frame.querySelector('img');
    big.src = thumb.currentSrc || thumb.src; // show the loaded thumbnail instantly…
    var hi = new Image();                    // …then swap in the large version
    hi.referrerPolicy = 'no-referrer';
    hi.onload = function () { if (all[current] === frame) big.src = hi.src; };
    hi.onerror = function () {
      var alt = 'https://lh3.googleusercontent.com/d/' + frame.dataset.id + '=w2000';
      if (hi.src !== alt) hi.src = alt;
    };
    hi.src = frame.dataset.large;
    big.alt = thumb.alt;
    caption.textContent = frame.dataset.caption || '';
    count.textContent = (current + 1) + ' / ' + all.length;
    var single = all.length < 2;
    dialog.querySelector('[data-prev]').hidden = single;
    dialog.querySelector('[data-next]').hidden = single;
  }

  function step(d) {
    var all = frames();
    if (all.length > 1) show(all[(current + d + all.length) % all.length]);
  }

  list.addEventListener('click', function (e) {
    var frame = e.target.closest('.gallery-frame');
    if (!frame) return;
    opener = frame;
    show(frame);
    dialog.showModal();
    document.body.classList.add('has-lightbox');
  });
  dialog.querySelector('[data-close]').addEventListener('click', function () { dialog.close(); });
  dialog.querySelector('[data-prev]').addEventListener('click', function () { step(-1); });
  dialog.querySelector('[data-next]').addEventListener('click', function () { step(1); });
  dialog.addEventListener('click', function (e) {
    if (e.target === dialog || e.target.classList.contains('lightbox-stage')) dialog.close();
  });
  dialog.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
  });

  // swipe on phones
  var x0 = null;
  dialog.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  dialog.addEventListener('touchend', function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
    x0 = null;
  });

  dialog.addEventListener('close', function () {
    document.body.classList.remove('has-lightbox');
    if (opener) opener.focus();
  });
})();
