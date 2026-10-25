/* HABITS Lab — animated network for the home page hero.
   A small graph with community structure, laid out with a gentle force
   simulation. Every few seconds a "behaviour" spreads from one node to its
   neighbours, like a simple contagion. Respects reduced-motion settings. */
(function () {
  'use strict';
  var canvas = document.getElementById('hero-network');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  if (!ctx) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var W = 0, H = 0, DPR = 1;
  var nodes = [], edges = [], adj = [];
  var colors = {};
  var mouse = { x: -9999, y: -9999, active: false };
  var running = false, visible = true, raf = 0, lastSpread = 0;

  function readColors() {
    var s = getComputedStyle(document.documentElement);
    colors = {
      nodes: ['--node-1', '--node-2', '--node-3', '--node-4'].map(function (v) { return s.getPropertyValue(v).trim(); }),
      edge: s.getPropertyValue('--edge').trim(),
      bg: s.getPropertyValue('--bg').trim()
    };
  }

  function rand(a, b) { return a + Math.random() * (b - a); }

  function build() {
    var rect = canvas.getBoundingClientRect();
    W = rect.width; H = rect.height;
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    var wide = W > 820;
    var N = Math.round(Math.min(110, Math.max(36, (W * H) / 9000)));
    var K = 4;
    // community centres: on wide screens keep them right of the headline
    var centres = [];
    for (var c = 0; c < K; c++) {
      centres.push({
        x: wide ? W * (0.58 + 0.34 * ((c % 2) ? 0.85 : 0.2)) + rand(-30, 30) : W * (0.2 + 0.6 * (c / (K - 1))),
        y: wide ? H * (c < 2 ? 0.3 : 0.72) + rand(-30, 30) : H * (c % 2 ? 0.25 : 0.8)
      });
    }
    nodes = [];
    for (var i = 0; i < N; i++) {
      var k = i % K, ce = centres[k];
      nodes.push({ x: ce.x + rand(-80, 80), y: ce.y + rand(-80, 80), vx: 0, vy: 0, c: k, deg: 0, heat: 0 });
    }
    edges = []; adj = nodes.map(function () { return []; });
    var pIn = Math.min(0.35, 7 / (N / K)), pOut = 0.9 / N;
    for (var a = 0; a < N; a++) {
      for (var b = a + 1; b < N; b++) {
        var p = nodes[a].c === nodes[b].c ? pIn : pOut;
        if (Math.random() < p) addEdge(a, b);
      }
      if (nodes[a].deg === 0) { // no isolated nodes
        var t = (a + K * (1 + Math.floor(Math.random() * 3))) % N;
        if (t !== a) addEdge(a, t);
      }
    }
    nodes.forEach(function (n) { n.r = 2 + Math.sqrt(n.deg) * 1.15; });
    // let the layout settle before the first frame
    for (var s = 0; s < 220; s++) step(centres, 1);
    nodes.centres = centres;
  }

  function addEdge(a, b) {
    edges.push([a, b]); adj[a].push(b); adj[b].push(a);
    nodes[a].deg++; nodes[b].deg++;
  }

  function step(centres, settle) {
    var n = nodes.length, i, j, A, B, dx, dy, d2, d, f;
    for (i = 0; i < n; i++) {
      A = nodes[i];
      for (j = i + 1; j < n; j++) {
        B = nodes[j];
        dx = A.x - B.x; dy = A.y - B.y; d2 = dx * dx + dy * dy + 0.01;
        if (d2 > 22000) continue;
        f = 260 / d2;
        A.vx += dx * f; A.vy += dy * f; B.vx -= dx * f; B.vy -= dy * f;
      }
      var ce = centres[A.c];
      A.vx += (ce.x - A.x) * 0.0028; A.vy += (ce.y - A.y) * 0.0028;
      if (!settle) { A.vx += rand(-0.05, 0.05); A.vy += rand(-0.05, 0.05); }
    }
    for (i = 0; i < edges.length; i++) {
      A = nodes[edges[i][0]]; B = nodes[edges[i][1]];
      dx = B.x - A.x; dy = B.y - A.y; d = Math.sqrt(dx * dx + dy * dy) || 1;
      f = (d - 58) * 0.0035;
      A.vx += dx / d * f; A.vy += dy / d * f; B.vx -= dx / d * f; B.vy -= dy / d * f;
    }
    if (mouse.active) {
      for (i = 0; i < n; i++) {
        A = nodes[i]; dx = A.x - mouse.x; dy = A.y - mouse.y; d2 = dx * dx + dy * dy;
        if (d2 < 14000) { f = 0.9 / Math.sqrt(d2 + 1); A.vx += dx * f * 0.4; A.vy += dy * f * 0.4; }
      }
    }
    for (i = 0; i < n; i++) {
      A = nodes[i];
      A.vx *= 0.86; A.vy *= 0.86;
      A.x += A.vx; A.y += A.vy;
      A.x = Math.max(8, Math.min(W - 8, A.x)); A.y = Math.max(8, Math.min(H - 8, A.y));
      A.heat *= 0.985;
    }
  }

  // simple contagion: each active node passes the behaviour on with prob. 0.45
  function spread() {
    var seed = Math.floor(Math.random() * nodes.length);
    var frontier = [seed], seen = {}; seen[seed] = 1;
    var wave = 0;
    (function next() {
      if (!frontier.length || wave > 5) return;
      var nf = [];
      frontier.forEach(function (i) {
        nodes[i].heat = 1;
        adj[i].forEach(function (j) { if (!seen[j] && Math.random() < 0.45) { seen[j] = 1; nf.push(j); } });
      });
      frontier = nf; wave++;
      setTimeout(next, 260);
    })();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.lineWidth = 1;
    for (var i = 0; i < edges.length; i++) {
      var A = nodes[edges[i][0]], B = nodes[edges[i][1]];
      var h = Math.max(A.heat, B.heat);
      ctx.strokeStyle = colors.edge;
      ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
      if (h > 0.05 && A.heat > 0.05 && B.heat > 0.05) {
        ctx.strokeStyle = colors.nodes[A.c];
        ctx.globalAlpha = Math.min(A.heat, B.heat) * 0.7;
        ctx.stroke();
      }
    }
    if (mouse.active) {
      ctx.strokeStyle = colors.edge;
      for (var m = 0; m < nodes.length; m++) {
        var N = nodes[m], dx = N.x - mouse.x, dy = N.y - mouse.y, d2 = dx * dx + dy * dy;
        if (d2 < 16000) {
          ctx.globalAlpha = 1 - d2 / 16000;
          ctx.beginPath(); ctx.moveTo(mouse.x, mouse.y); ctx.lineTo(N.x, N.y); ctx.stroke();
        }
      }
    }
    for (var k = 0; k < nodes.length; k++) {
      var n = nodes[k], col = colors.nodes[n.c];
      if (n.heat > 0.05) {
        ctx.globalAlpha = n.heat * 0.25; ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r + 7 * n.heat, 0, 6.2832); ctx.fill();
      }
      ctx.globalAlpha = 0.55 + 0.45 * Math.min(1, n.heat + n.deg / 12);
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, 6.2832); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function loop(t) {
    if (!running) return;
    step(nodes.centres, 0);
    if (t - lastSpread > 2600) { spread(); lastSpread = t; }
    draw();
    raf = requestAnimationFrame(loop);
  }
  function start() { if (running || reduce || !visible || document.hidden) return; running = true; raf = requestAnimationFrame(loop); }
  function stop() { running = false; cancelAnimationFrame(raf); }

  readColors(); build(); draw(); start();

  document.addEventListener('themechange', function () { readColors(); draw(); });
  document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; visible ? start() : stop(); }).observe(canvas);
  }
  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { var was = running; stop(); build(); draw(); if (was || !reduce) start(); }, 200);
  });
  var hero = canvas.parentElement;
  hero.addEventListener('pointermove', function (e) {
    var r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.active = e.pointerType === 'mouse';
  });
  hero.addEventListener('pointerleave', function () { mouse.active = false; });
})();
