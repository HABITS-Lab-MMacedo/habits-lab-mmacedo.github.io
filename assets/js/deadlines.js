/* HABITS Lab — conference deadline tracker with live countdowns.
   Data comes from _data/deadlines.yml (embedded in the page as JSON). */
(function () {
  'use strict';
  var dataEl = document.getElementById('deadline-data');
  var list = document.getElementById('deadline-list');
  if (!dataEl || !list) return;

  var confs = [];
  try { confs = JSON.parse(dataEl.textContent) || []; } catch (e) { list.innerHTML = '<li>Could not read deadline data.</li>'; return; }

  var AREA_COLORS = {
    'Network Science': 'var(--node-1)',
    'Computational Social Science': 'var(--node-3)',
    'Web & Social Media': 'var(--node-2)',
    'HCI & Society': 'var(--node-4)',
    'AI & Fairness': 'var(--warm)'
  };
  var state = { area: 'all', past: false };
  var DAY = 864e5;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function tzOffset(tz) {
    if (tz === undefined || tz === null || tz === '' || /^aoe$/i.test(String(tz))) return -12;
    if (/^utc$|^gmt$/i.test(String(tz))) return 0;
    var n = parseFloat(String(tz).replace(/^(utc|gmt)/i, ''));
    return isNaN(n) ? -12 : n;
  }
  function toDate(step) {
    var p = String(step.date).split('-').map(Number);
    var t = String(step.time || '23:59').split(':').map(Number);
    var utc = Date.UTC(p[0], p[1] - 1, p[2], t[0] || 0, t[1] || 0, 59);
    return new Date(utc - tzOffset(step.tz) * 36e5);
  }
  var fmt = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  var fmtShort = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  var tzName = Intl.DateTimeFormat().resolvedOptions().timeZone;
  var tzEl = document.getElementById('local-tz');
  if (tzEl && tzName) tzEl.textContent = tzName.replace(/_/g, ' ');

  // prepare data
  var withDates = [], tba = [];
  confs.forEach(function (c) {
    var steps = (c.deadlines || []).map(function (s) { return { label: s.label, at: toDate(s), tz: s.tz }; })
      .sort(function (a, b) { return a.at - b.at; });
    if (!steps.length) { tba.push(c); return; }
    withDates.push({ c: c, steps: steps });
  });

  // area filter chips
  var areas = [];
  confs.forEach(function (c) { if (c.area && areas.indexOf(c.area) < 0) areas.push(c.area); });
  var chipBox = document.getElementById('area-filter');
  areas.forEach(function (a) {
    var b = document.createElement('button');
    b.className = 'chip'; b.type = 'button'; b.dataset.area = a; b.setAttribute('aria-pressed', 'false');
    b.textContent = a; chipBox.appendChild(b);
  });
  chipBox.addEventListener('click', function (e) {
    var b = e.target.closest('.chip'); if (!b) return;
    state.area = b.dataset.area;
    chipBox.querySelectorAll('.chip').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
    render();
  });
  var pastBox = document.getElementById('show-past');
  pastBox.addEventListener('change', function () { state.past = pastBox.checked; render(); });

  function gcal(c, step) {
    var d = step.at.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    var end = new Date(step.at.getTime() + 36e5).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    return 'https://www.google.com/calendar/render?action=TEMPLATE&text=' +
      encodeURIComponent(c.name + ' — ' + step.label + ' deadline') +
      '&dates=' + d + '/' + end + '&details=' + encodeURIComponent('Call for papers: ' + (c.url || ''));
  }

  function render() {
    var now = Date.now();
    var items = withDates.map(function (x) {
      var next = null;
      for (var i = 0; i < x.steps.length; i++) if (x.steps[i].at > now) { next = x.steps[i]; break; }
      return { c: x.c, steps: x.steps, next: next, last: x.steps[x.steps.length - 1] };
    }).filter(function (x) {
      return (state.area === 'all' || x.c.area === state.area) && (state.past || x.next);
    });
    items.sort(function (a, b) {
      if (a.next && b.next) return a.next.at - b.next.at;
      if (a.next) return -1; if (b.next) return 1;
      return b.last.at - a.last.at;
    });

    if (!items.length) {
      list.innerHTML = '<li class="empty">No upcoming deadlines in this area. Tick “Show past deadlines” to see earlier ones.</li>';
    } else {
      list.innerHTML = items.map(function (x) {
        var c = x.c, color = AREA_COLORS[c.area] || 'var(--accent)';
        var soon = x.next && (x.next.at - now) < 7 * DAY;
        var where = [c.location, c.conference].filter(Boolean).map(esc).join(' · ');
        var steps = x.steps.map(function (s) {
          var cls = s.at <= now ? 'done' : (s === x.next ? 'next' : '');
          return '<li class="' + cls + '"><span>' + esc(s.label) + '</span><time datetime="' + s.at.toISOString() + '">' + fmt.format(s.at) + '</time></li>';
        }).join('');
        var right = x.next
          ? '<div class="countdown-clock" data-at="' + x.next.at.getTime() + '"></div>' +
            '<p class="countdown-label">until ' + esc(x.next.label.toLowerCase()) + '</p>' +
            '<a class="cal-link" href="' + gcal(c, x.next) + '" target="_blank" rel="noopener">+ Add to calendar</a>'
          : '<div class="countdown-clock">Closed</div><p class="countdown-label">last deadline ' + fmtShort.format(x.last.at) + '</p>';
        return '<li class="deadline' + (x.next ? '' : ' is-past') + (soon ? ' is-soon' : '') + '" style="--area-color:' + color + '">' +
          '<div><p class="deadline-name"><a href="' + esc(c.url) + '" target="_blank" rel="noopener">' + esc(c.name) + '</a>' +
          (c.area ? '<span class="area-tag">' + esc(c.area) + '</span>' : '') + '</p>' +
          '<p class="deadline-full">' + esc(c.full) + '</p>' + (where ? '<p class="deadline-where">' + where + '</p>' : '') + '</div>' +
          '<ul class="deadline-steps">' + steps + '</ul>' +
          '<div class="countdown">' + right + '</div></li>';
      }).join('');
    }

    var tbaEl = document.getElementById('tba-list');
    tbaEl.innerHTML = tba.filter(function (c) { return state.area === 'all' || c.area === state.area; }).map(function (c) {
      return '<li><a href="' + esc(c.url) + '" target="_blank" rel="noopener">' + esc(c.name) + '</a> — ' + esc(c.full) +
        '<span>' + esc(c.note || c.conference || 'Dates to be announced') + (c.location ? ' · ' + esc(c.location) : '') + '</span></li>';
    }).join('') || '<li>Nothing pending in this area.</li>';
    tick();
  }

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function tick() {
    var now = Date.now();
    list.querySelectorAll('.countdown-clock[data-at]').forEach(function (el) {
      var ms = Number(el.dataset.at) - now;
      if (ms <= 0) { render(); return; }
      var d = Math.floor(ms / DAY), h = Math.floor(ms / 36e5) % 24, m = Math.floor(ms / 6e4) % 60, s = Math.floor(ms / 1e3) % 60;
      el.innerHTML = d + '<small>d</small>' + pad(h) + '<small>h</small>' + pad(m) + '<small>m</small>' + pad(s) + '<small>s</small>';
    });
  }

  render();
  setInterval(tick, 1000);
})();
