/* Word Search: a new puzzle every game, from themed word lists.
   Easy 8x8 with 6 words (across and down), medium 11x11 with 9 words (adds diagonals),
   hard 14x14 with 12 words (all eight directions, backwards too).
   Drag across the letters, or tap the first and last letter. Progress is kept on this device. */
(function () {
  "use strict";
  var ALL8 = [[0, 1], [1, 0], [1, 1], [-1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1]];
  var LEVELS = {
    easy:   { n: 8,  words: 6,  min: 4, max: 6,  dirs: ALL8.slice(0, 2) },
    medium: { n: 11, words: 9,  min: 5, max: 8,  dirs: ALL8.slice(0, 4) },
    hard:   { n: 14, words: 12, min: 6, max: 10, dirs: ALL8 }
  };
  var THEMES = {
    "Animals": "ELEPHANT GIRAFFE DOLPHIN PENGUIN KANGAROO LEOPARD BUFFALO CHEETAH GORILLA HAMSTER OSTRICH PARROT RABBIT TIGER ZEBRA PANDA EAGLE SHARK WHALE TURTLE FALCON CAMEL OTTER LION CROCODILE SQUIRREL",
    "Space": "PLANET GALAXY COMET ORBIT ROCKET METEOR NEBULA ECLIPSE SATURN JUPITER NEPTUNE MERCURY VENUS MARS EARTH ASTEROID TELESCOPE GRAVITY COSMOS LUNAR SOLAR PULSAR QUASAR STARDUST UNIVERSE",
    "Food": "BIRIYANI KHICHURI MANGO LYCHEE JACKFRUIT HILSA PARATHA SAMOSA FUCHKA BANANA ORANGE COCONUT PINEAPPLE CHICKEN LENTILS POTATO TOMATO CUCUMBER SPINACH PUDDING NOODLES PANCAKE CHOCOLATE YOGURT MUSHROOM",
    "Design": "TYPOGRAPHY LOGO BRAND COLOR LAYOUT GRID VECTOR PIXEL PALETTE CONTRAST POSTER ICON SKETCH CANVAS GRADIENT SPACING HIERARCHY BALANCE MOCKUP PROTOTYPE FONT SERIF KERNING BLEED PRINT",
    "Broadcast": "STUDIO CAMERA SIGNAL ANTENNA LIVE RUNDOWN TIMECODE SWITCHER CHYRON TALLY FEED UPLINK SATELLITE MONITOR AUDIO VIDEO MASTER CONTROL PLAYOUT BANDWIDTH ENCODER ROUTER GENLOCK FRAMERATE NEWSROOM",
    "Nature": "RIVER FOREST MOUNTAIN OCEAN DESERT VALLEY WATERFALL SUNRISE SUNSET RAINBOW THUNDER LIGHTNING BREEZE GLACIER ISLAND MEADOW CANYON VOLCANO JUNGLE MONSOON SUNDARBANS HORIZON BLOSSOM PEBBLE"
  };
  var KEY = "wordsearch-v1";
  var GB = window.GameBoard || null;
  var root = document.getElementById("wordsearch");
  if (!root) return;
  var boardEl = root.querySelector(".ws-board"), listEl = root.querySelector(".ws-words");
  var timeEl = root.querySelector("[data-time]"), mistakeEl = root.querySelector("[data-mistakes]"),
      levelEl = root.querySelector("[data-level]"), themeEl = root.querySelector("[data-theme]"),
      leftEl = root.querySelector("[data-left]");
  var doneDlg = document.getElementById("wsDone"), newDlg = document.getElementById("wsNew");
  var S = null, cells = [], tick = null, drag = null, anchor = null, hintCell = -1, hintTimer = null;

  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function fmt(t) { t = Math.round(t); var m = Math.floor(t / 60), s = t % 60; return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s; }
  function title(s) { return s[0].toUpperCase() + s.slice(1); }

  // ---------- Generator ----------
  function generate(level) {
    var L = LEVELS[level], n = L.n;
    for (var attempt = 0; attempt < 40; attempt++) {
      var name = pick(Object.keys(THEMES));
      var pool = THEMES[name].split(" ").filter(function (w) { return w.length >= L.min && w.length <= L.max; });
      var words = shuffle(pool).slice(0, L.words).sort(function (a, b) { return b.length - a.length; });
      if (words.length < L.words - 1) continue;
      var grid = new Array(n * n).fill(""), placed = [], ok = true;
      for (var k = 0; k < words.length && ok; k++) {
        var w = words[k], done = false;
        for (var t = 0; t < 300 && !done; t++) {
          var d = pick(L.dirs), r = Math.floor(Math.random() * n), c = Math.floor(Math.random() * n);
          var er = r + d[0] * (w.length - 1), ec = c + d[1] * (w.length - 1);
          if (er < 0 || er >= n || ec < 0 || ec >= n) continue;
          var fits = true;
          for (var i = 0; i < w.length; i++) {
            var g = grid[(r + d[0] * i) * n + c + d[1] * i];
            if (g && g !== w[i]) { fits = false; break; }
          }
          if (!fits) continue;
          for (i = 0; i < w.length; i++) grid[(r + d[0] * i) * n + c + d[1] * i] = w[i];
          placed.push({ w: w, r: r, c: c, dr: d[0], dc: d[1], found: false });
          done = true;
        }
        if (!done) ok = false;
      }
      if (!ok) continue;
      var letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      for (var x = 0; x < grid.length; x++) if (!grid[x]) grid[x] = letters[Math.floor(Math.random() * 26)];
      return { theme: name, grid: grid, words: shuffle(placed).sort(function (a, b) { return a.w < b.w ? -1 : 1; }) };
    }
    return generate(level);
  }

  function puzzleText() { return S.grid.join("") + "|" + S.words.map(function (w) { return w.w; }).join(","); }

  // ---------- State ----------
  function fresh(level) {
    var p = generate(level);
    var s = { level: level, n: LEVELS[level].n, theme: p.theme, grid: p.grid, words: p.words, found: [],
              mistakes: 0, hints: 0, time: 0, done: false, token: null };
    if (GB) GB.start("wordsearch", level, p.grid.join("") + "|" + p.words.map(function (w) { return w.w; }).join(","))
      .then(function (t) { if (S === s) { s.token = t; save(); } });
    return s;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY) || "null");
      if (s && LEVELS[s.level] && s.grid && s.grid.length === s.n * s.n && s.words && s.words.length) return s;
    } catch (e) {}
    return null;
  }

  // ---------- Timer ----------
  function start() { stop(); if (S.done) return; tick = setInterval(function () { S.time++; timeEl.textContent = fmt(S.time); if (S.time % 5 === 0) save(); }, 1000); }
  function stop() { if (tick) clearInterval(tick); tick = null; }
  document.addEventListener("visibilitychange", function () { if (document.hidden) { stop(); if (S) save(); } else if (S && !S.done) start(); });

  // ---------- Drawing ----------
  function build() {
    boardEl.innerHTML = ""; cells = [];
    boardEl.style.setProperty("--n", S.n);
    for (var i = 0; i < S.n * S.n; i++) {
      var d = document.createElement("div");
      d.className = "ws-cell"; d.dataset.i = i; d.textContent = S.grid[i];
      boardEl.appendChild(d); cells.push(d);
    }
  }
  function line(a, b) {   // cell indexes on the straight line a -> b, or null when it is not straight
    var n = S.n, r0 = Math.floor(a / n), c0 = a % n, r1 = Math.floor(b / n), c1 = b % n, dr = r1 - r0, dc = c1 - c0;
    if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return null;
    var len = Math.max(Math.abs(dr), Math.abs(dc)) + 1, sr = Math.sign(dr), sc = Math.sign(dc), out = [];
    for (var i = 0; i < len; i++) out.push((r0 + sr * i) * n + c0 + sc * i);
    return out;
  }
  function render(preview) {
    var owner = {};
    S.words.forEach(function (w, wi) {
      if (!w.found) return;
      for (var i = 0; i < w.w.length; i++) owner[(w.r + w.dr * i) * S.n + w.c + w.dc * i] = wi % 6;
    });
    var on = {}; (preview || []).forEach(function (i) { on[i] = 1; });
    for (var i = 0; i < cells.length; i++) {
      var cls = "ws-cell";
      if (owner[i] !== undefined) cls += " f f" + owner[i];
      if (on[i]) cls += " sel";
      if (i === hintCell) cls += " hint";
      cells[i].className = cls;
    }
    listEl.innerHTML = S.words.map(function (w, wi) {
      return '<li class="' + (w.found ? "got f" + (wi % 6) : "") + '">' + w.w + "</li>";
    }).join("");
    var left = S.words.filter(function (w) { return !w.found; }).length;
    leftEl.textContent = left + " of " + S.words.length + " left";
    mistakeEl.textContent = S.mistakes;
    levelEl.textContent = title(S.level);
    themeEl.textContent = S.theme;
    timeEl.textContent = fmt(S.time);
    root.querySelectorAll("[data-pick]").forEach(function (b) { b.setAttribute("aria-checked", b.dataset.pick === S.level); });
    root.classList.toggle("is-done", !!S.done);
  }

  // ---------- Selecting ----------
  function cellAt(e) {
    var el = document.elementFromPoint(e.clientX, e.clientY);
    var c = el && el.closest ? el.closest(".ws-cell") : null;
    return c && boardEl.contains(c) ? +c.dataset.i : -1;
  }
  function complete(a, b) {
    var idx = line(a, b);
    if (!idx || idx.length < 2) return render();
    var str = idx.map(function (i) { return S.grid[i]; }).join(""), rev = str.split("").reverse().join("");
    var hit = null, forward = true;
    S.words.forEach(function (w) {
      if (hit || w.found) return;
      if (w.w === str) hit = w; else if (w.w === rev) { hit = w; forward = false; }
    });
    if (hit) {
      var from = forward ? idx[0] : idx[idx.length - 1], to = forward ? idx[idx.length - 1] : idx[0];
      var n = S.n, dr = Math.sign(Math.floor(to / n) - Math.floor(from / n)), dc = Math.sign(to % n - from % n);
      hit.found = true; hit.r = Math.floor(from / n); hit.c = from % n; hit.dr = dr; hit.dc = dc;   // where the player found it
      S.found.push([hit.w, hit.r, hit.c, hit.dr, hit.dc]);
      hintCell = -1; render(); save();
      if (S.words.every(function (w) { return w.found; })) { S.done = true; stop(); render(); save(); win(); }
    } else {
      if (idx.length >= 3) { S.mistakes++; save(); }
      idx.forEach(function (i) { cells[i].classList.add("bad"); });
      setTimeout(function () { render(); }, 260);
      mistakeEl.textContent = S.mistakes;
    }
  }
  boardEl.addEventListener("pointerdown", function (e) {
    if (!S || S.done) return;
    var c = cellAt(e); if (c < 0) return;
    e.preventDefault();
    try { boardEl.setPointerCapture(e.pointerId); } catch (x) {}
    drag = { a: c, b: c };
    render(line(anchor !== null ? anchor : c, c) || [c]);
  });
  boardEl.addEventListener("pointermove", function (e) {
    if (!drag) return;
    var c = cellAt(e); if (c < 0 || c === drag.b) return;
    if (!line(drag.a, c)) return;
    drag.b = c; render(line(drag.a, c));
  });
  function release() {
    if (!drag) return;
    var a = drag.a, b = drag.b; drag = null;
    if (a !== b) { anchor = null; return complete(a, b); }
    if (anchor === null) { anchor = a; return render([a]); }       // first tap
    var from = anchor; anchor = null;
    if (from === a) return render();
    if (!line(from, a)) { anchor = a; return render([a]); }        // not a straight line: start again here
    complete(from, a);
  }
  boardEl.addEventListener("pointerup", release);
  boardEl.addEventListener("pointercancel", function () { drag = null; render(); });
  boardEl.addEventListener("contextmenu", function (e) { e.preventDefault(); });

  function hint() {
    if (!S || S.done) return;
    var open = S.words.filter(function (w) { return !w.found; });
    if (!open.length) return;
    var w = pick(open);
    S.hints++; hintCell = w.r * S.n + w.c; anchor = null;
    clearTimeout(hintTimer); hintTimer = setTimeout(function () { hintCell = -1; render(); }, 4000);
    save(); render();
    var h = root.querySelector("[data-hint-note]"); h.textContent = "Look for " + w.w + ", it starts at the glowing letter.";
  }

  // ---------- Finish ----------
  function win() {
    doneDlg.querySelector("[data-sum]").textContent =
      title(S.level) + " solved in " + fmt(S.time) + " with " +
      (S.mistakes ? S.mistakes + " wrong guess" + (S.mistakes > 1 ? "es" : "") : "no wrong guesses") +
      (S.hints ? " and " + S.hints + " hint" + (S.hints > 1 ? "s" : "") : "") + ".";
    try {
      var best = JSON.parse(localStorage.getItem(KEY + "-best") || "{}");
      var rec = !best[S.level] || S.time < best[S.level];
      if (rec) { best[S.level] = S.time; localStorage.setItem(KEY + "-best", JSON.stringify(best)); }
      doneDlg.querySelector("[data-best]").textContent = rec ? "New best time for this level!" : "Best time: " + fmt(best[S.level]);
    } catch (e) { doneDlg.querySelector("[data-best]").textContent = ""; }
    var rankEl = doneDlg.querySelector("[data-rank]"); rankEl.textContent = "";
    if (GB) {
      rankEl.textContent = "Adding you to the leaderboard…";
      var level = S.level;
      GB.finish("wordsearch", level, S.token, { time: S.time, mistakes: S.mistakes, hints: S.hints,
                                                proof: { given: puzzleText(), found: S.found } })
        .then(function (r) {
          if (r.local) rankEl.textContent = "Saved to your results on this device as " + GB.player + ".";
          else if (r.ok) rankEl.textContent = "You are #" + r.rank + " of " + r.total + " on " + level + " as " + GB.player + ".";
          else rankEl.textContent = "Not ranked: " + String(r.error || "something went wrong").replace(/\.$/, "") + ".";
          showBoard(level);
        });
    }
    if (doneDlg.showModal) doneDlg.showModal();
  }

  // ---------- Leaderboard panel ----------
  var lbRows = root.querySelector("[data-lb-rows]"), lbNote = root.querySelector("[data-lb-note]"),
      myRank = root.querySelector("[data-myrank]"), lbReq = 0;
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function showBoard(level) {
    if (!GB || !lbRows) return;
    root.querySelectorAll("[data-lb]").forEach(function (b) { b.setAttribute("aria-selected", b.dataset.lb === level); });
    var req = ++lbReq;
    GB.top("wordsearch", level).then(function (r) {
      if (req !== lbReq) return;
      var rows = (r && r.rows) || [];
      lbNote.textContent = r.local ? (r.offline ? "Can't reach the leaderboard right now. These are your results on this device."
                                                : "Your results on this device. The shared leaderboard opens soon.")
                                   : r.total + " player" + (r.total === 1 ? "" : "s") + " on " + level;
      lbRows.innerHTML = rows.length ? rows.map(function (x, i) {
        var mine = x.player === GB.player;
        return "<tr" + (mine ? ' class="me"' : "") + "><td>" + (i + 1) + "</td><td>" + esc(x.player) + (mine ? " <em>You</em>" : "") +
               "</td><td><b>" + fmt(x.score) + "</b></td><td>" + fmt(x.time) + '</td><td class="opt">' + x.mistakes +
               '</td><td class="opt">' + x.hints + '</td><td class="opt">' + esc(x.date) + "</td></tr>";
      }).join("") : '<tr><td colspan="7" class="ws-lb-empty">No results yet on ' + level + ". Solve one to be first!</td></tr>";
      var me = r.me;
      myRank.textContent = me && !r.local ? " · your best on " + level + ": #" + me.rank + " (" + fmt(me.score) + ")" : "";
    });
  }
  root.addEventListener("click", function (e) { var b = e.target.closest("[data-lb]"); if (b) showBoard(b.dataset.lb); });
  if (GB) root.querySelector("[data-player]").textContent = GB.player;
  else { var lb = root.querySelector(".ws-lb"); if (lb) lb.hidden = true; }

  // ---------- Controls ----------
  function newGame(level) {
    root.classList.add("is-busy");
    setTimeout(function () {
      S = fresh(level); anchor = null; drag = null; hintCell = -1;
      root.querySelector("[data-hint-note]").textContent = "";
      build(); root.classList.remove("is-busy"); render(); save(); start();
    }, 30);
  }
  function askNew(level) {
    var playing = S && !S.done && (S.words.some(function (w) { return w.found; }) || S.time > 20);
    if (!playing || !newDlg.showModal) return newGame(level);
    newDlg.dataset.level = level;
    newDlg.querySelector("[data-lvl]").textContent = level;
    newDlg.showModal();
  }
  root.addEventListener("click", function (e) {
    var a = e.target.closest("[data-act]"), p = e.target.closest("[data-pick]");
    if (p) return askNew(p.dataset.pick);
    if (!a) return;
    if (a.dataset.act === "hint") hint();
    else if (a.dataset.act === "new") askNew(S.level);
  });
  newDlg.addEventListener("close", function () { if (newDlg.returnValue === "yes") newGame(newDlg.dataset.level); });
  doneDlg.addEventListener("close", function () { if (doneDlg.returnValue === "again") newGame(S.level); });

  S = load();
  if (S) { build(); render(); start(); } else newGame("easy");
  showBoard(S ? S.level : "easy");
})();
