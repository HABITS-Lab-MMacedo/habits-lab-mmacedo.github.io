/* HABITS Lab — Posters page: topic filter + full-size viewer */
(function () {
  'use strict';

  var list = document.getElementById('poster-list');
  if (!list) return;
  var items = Array.prototype.slice.call(list.querySelectorAll('.poster'));

  // ---- topic filter ----
  var chips = document.querySelectorAll('.chip[data-topic]');
  Array.prototype.forEach.call(chips, function (chip) {
    chip.addEventListener('click', function () {
      var topic = chip.getAttribute('data-topic');
      Array.prototype.forEach.call(chips, function (c) { c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
      items.forEach(function (li) {
        li.hidden = topic !== 'all' && li.getAttribute('data-topic') !== topic;
      });
    });
  });

  // ---- viewer ----
  var dialog = document.getElementById('poster-lightbox');
  if (!dialog || typeof dialog.showModal !== 'function') return; // old browsers: buttons do nothing, PDF links still work
  var img = document.getElementById('lightbox-img');
  var title = document.getElementById('lightbox-title');
  var pdf = document.getElementById('lightbox-pdf');
  var current = 0;
  var opener = null;

  function visibleFrames() {
    return items.filter(function (li) { return !li.hidden; })
                .map(function (li) { return li.querySelector('.poster-frame'); });
  }

  function show(frame) {
    var frames = visibleFrames();
    current = frames.indexOf(frame);
    img.classList.remove('is-zoomed');
    img.src = frame.getAttribute('data-large');
    img.alt = 'Poster: ' + frame.getAttribute('data-title');
    title.textContent = frame.getAttribute('data-title');
    pdf.href = frame.getAttribute('data-pdf');
    var single = frames.length < 2;
    dialog.querySelector('[data-prev]').hidden = single;
    dialog.querySelector('[data-next]').hidden = single;
  }

  function step(delta) {
    var frames = visibleFrames();
    if (frames.length < 2) return;
    show(frames[(current + delta + frames.length) % frames.length]);
  }

  list.addEventListener('click', function (e) {
    var frame = e.target.closest('.poster-frame');
    if (!frame) return;
    opener = frame;
    show(frame);
    dialog.showModal();
    document.body.classList.add('has-lightbox');
  });

  dialog.querySelector('[data-close]').addEventListener('click', function () { dialog.close(); });
  dialog.querySelector('[data-prev]').addEventListener('click', function () { step(-1); });
  dialog.querySelector('[data-next]').addEventListener('click', function () { step(1); });

  // click on the dark backdrop closes; click on the image toggles zoom
  dialog.addEventListener('click', function (e) {
    if (e.target === img) { img.classList.toggle('is-zoomed'); return; }
    if (e.target === dialog || e.target.classList.contains('lightbox-stage')) dialog.close();
  });

  dialog.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
  });

  dialog.addEventListener('close', function () {
    document.body.classList.remove('has-lightbox');
    img.classList.remove('is-zoomed');
    if (opener) opener.focus();
  });
})();
