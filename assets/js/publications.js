/* HABITS Lab — publications: search, type filter, highlight lab members */
(function () {
  'use strict';
  var wrap = document.getElementById('pub-list');
  if (!wrap) return;

  // bold the names of lab members (taken from _data/people.yml)
  var members = (wrap.dataset.members || '').split('|').map(function (s) { return s.trim(); }).filter(Boolean);
  wrap.querySelectorAll('.pub-authors').forEach(function (el) {
    var html = el.innerHTML;
    members.forEach(function (name) {
      var safe = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      html = html.replace(new RegExp('(^|,\\s*|and\\s+)(' + safe + ')(?=\\s*(,|$|and))', 'g'), '$1<mark>$2</mark>');
    });
    el.innerHTML = html;
  });

  var input = document.getElementById('pub-search');
  var empty = document.getElementById('pub-empty');
  var type = 'all';

  function apply() {
    var q = (input.value || '').toLowerCase().trim();
    var shown = 0;
    wrap.querySelectorAll('.pub-year').forEach(function (sec) {
      var any = false;
      sec.querySelectorAll('.pub').forEach(function (p) {
        var ok = (type === 'all' || p.dataset.type === type) && (!q || p.textContent.toLowerCase().indexOf(q) >= 0);
        p.hidden = !ok; if (ok) { any = true; shown++; }
      });
      sec.hidden = !any;
    });
    empty.hidden = shown > 0;
  }
  input.addEventListener('input', apply);
  document.querySelectorAll('.chip[data-type]').forEach(function (b) {
    b.addEventListener('click', function () {
      type = b.dataset.type;
      document.querySelectorAll('.chip[data-type]').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      apply();
    });
  });
})();
