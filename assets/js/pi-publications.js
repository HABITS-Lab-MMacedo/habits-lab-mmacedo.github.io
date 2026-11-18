/* HABITS Lab — PI page: full publication list, loaded live from OpenAlex.
   New papers appear automatically once OpenAlex indexes them.
   If OpenAlex can't be reached, the static "selected publications" stay visible. */
(function () {
  'use strict';

  var list = document.getElementById('pi-pub-list');
  if (!list || !list.dataset.openalex) return;

  var AUTHOR = list.dataset.openalex.replace(/^https?:\/\/openalex\.org\//, '');
  var NAME = list.dataset.name;
  var CACHE_KEY = 'habits-pubs-' + AUTHOR;
  var CACHE_HOURS = 12;
  var PAGE = 15; // items shown before "Show all"
  var API = 'https://api.openalex.org/works?filter=author.id:' + AUTHOR +
    '&sort=publication_year:desc&per-page=200' +
    '&select=id,doi,display_name,publication_year,type,primary_location,authorships,cited_by_count';

  var status = document.getElementById('pi-pub-status');
  var tools = document.getElementById('pi-pub-tools');
  var search = document.getElementById('pi-pub-search');
  var chipsBox = document.getElementById('pi-pub-chips');
  var empty = document.getElementById('pi-pub-empty');
  var more = document.getElementById('pi-pub-more');

  var CATS = { journal: 'Journal', conference: 'Conference', book: 'Book', preprint: 'Preprint', data: 'Data' };
  var works = [];
  var activeCat = 'all';
  var expanded = false;

  function category(w) {
    var t = w.type;
    var srcType = (((w.primary_location || {}).source) || {}).type;
    if (t === 'dataset') return 'data';
    if (t === 'preprint') return 'preprint';
    var srcName = (((w.primary_location || {}).source) || {}).display_name || '';
    if (t === 'book-chapter' && /proceedings|lecture notes/i.test(srcName)) return 'conference';
    if (t === 'book' || t === 'book-chapter') return srcType === 'conference' ? 'conference' : 'book';
    if (t === 'conference' || t === 'proceedings-article' || srcType === 'conference') return 'conference';
    if (srcType === 'book series' && /lecture notes|proceedings/i.test(((w.primary_location || {}).source || {}).display_name || '')) return 'conference';
    return 'journal';
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function normalise(raw) {
    var seen = {};
    return raw.map(function (w) {
      var loc = w.primary_location || {};
      var authors = (w.authorships || []).map(function (a) {
        return { name: (a.author || {}).display_name || '', me: ((a.author || {}).id || '').indexOf(AUTHOR) !== -1 };
      });
      return {
        title: (w.display_name || '').replace(/<[^>]+>/g, ''),
        year: w.publication_year,
        venue: (loc.source || {}).display_name || '',
        url: w.doi || loc.landing_page_url || w.id,
        cites: w.cited_by_count || 0,
        cat: category(w),
        authors: authors
      };
    }).filter(function (w) {
      var key = w.title.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!key || seen[key]) return false;
      seen[key] = true;
      return true;
    });
  }

  function authorsHtml(authors) {
    var shown = authors.slice(0, 10);
    var meIndex = authors.findIndex(function (a) { return a.me; });
    if (meIndex >= 10) shown = shown.slice(0, 9).concat([authors[meIndex]]);
    var html = shown.map(function (a) { return a.me ? '<mark>' + esc(NAME) + '</mark>' : esc(a.name); }).join(', ');
    if (authors.length > shown.length) html += ', et al.';
    return html;
  }

  function matches(w, q) {
    if (activeCat !== 'all' && w.cat !== activeCat) return false;
    if (!q) return true;
    var hay = (w.title + ' ' + w.venue + ' ' + w.year + ' ' + w.authors.map(function (a) { return a.name; }).join(' ')).toLowerCase();
    return q.split(/\s+/).every(function (t) { return hay.indexOf(t) !== -1; });
  }

  function render() {
    var q = search.value.trim().toLowerCase();
    var filtered = works.filter(function (w) { return matches(w, q); });
    var limit = (expanded || q || activeCat !== 'all') ? filtered.length : PAGE;
    var visible = filtered.slice(0, limit);

    var html = '';
    var year = null;
    visible.forEach(function (w) {
      if (w.year !== year) {
        if (year !== null) html += '</ul></section>';
        year = w.year;
        html += '<section class="pub-year"><h2>' + esc(year || 'Undated') + '</h2><ul class="pubs">';
      }
      html += '<li class="pub">' +
        '<p class="pub-title"><a href="' + esc(w.url) + '" target="_blank" rel="noopener">' + esc(w.title) + '</a></p>' +
        '<p class="pub-authors">' + authorsHtml(w.authors) + '</p>' +
        '<p class="pub-meta">' + (w.venue ? '<em>' + esc(w.venue) + '</em>' : '') +
        ' <span class="tag tag--' + w.cat + '">' + CATS[w.cat] + '</span>' +
        (w.cites ? ' <span class="pub-cites">' + w.cites + ' citation' + (w.cites === 1 ? '' : 's') + '</span>' : '') +
        '</p></li>';
    });
    if (year !== null) html += '</ul></section>';
    list.innerHTML = html;

    empty.hidden = filtered.length > 0;
    more.hidden = filtered.length <= limit;
    more.textContent = 'Show all ' + filtered.length + ' publications';
  }

  function buildChips() {
    var counts = {};
    works.forEach(function (w) { counts[w.cat] = (counts[w.cat] || 0) + 1; });
    var html = '<button class="chip" type="button" data-cat="all" aria-pressed="true">All <span class="chip-count">' + works.length + '</span></button>';
    Object.keys(CATS).forEach(function (c) {
      if (counts[c]) html += '<button class="chip" type="button" data-cat="' + c + '" aria-pressed="false">' + CATS[c] + ' <span class="chip-count">' + counts[c] + '</span></button>';
    });
    chipsBox.innerHTML = html;
    chipsBox.addEventListener('click', function (e) {
      var chip = e.target.closest('.chip');
      if (!chip) return;
      activeCat = chip.dataset.cat;
      chipsBox.querySelectorAll('.chip').forEach(function (c) { c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
      render();
    });
  }

  function show(raw) {
    works = normalise(raw);
    if (!works.length) { status.textContent = ''; return; }
    var cites = works.reduce(function (s, w) { return s + w.cites; }, 0);
    status.innerHTML = works.length + ' publications · ' + cites.toLocaleString('en') + ' citations · ' +
      'updated automatically from <a href="https://openalex.org/' + esc(AUTHOR) + '" target="_blank" rel="noopener">OpenAlex</a>';
    tools.hidden = false;
    buildChips();
    render();
  }

  search.addEventListener('input', render);
  more.addEventListener('click', function () { expanded = true; render(); });

  // cached copy first (fast, and works if OpenAlex is briefly down)
  var cached = null;
  try { cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); } catch (e) { cached = null; }
  var fresh = cached && (Date.now() - cached.t) < CACHE_HOURS * 3600 * 1000;
  if (cached && cached.results) show(cached.results);
  if (fresh) return;

  fetch(API)
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (data) {
      try { localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), results: data.results })); } catch (e) {}
      show(data.results);
    })
    .catch(function () {
      if (!cached) status.innerHTML = 'Showing selected publications — the full list could not be loaded right now.';
    });
})();
