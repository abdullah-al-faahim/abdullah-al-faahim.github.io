/* Sudoku: every puzzle is generated in the browser and has exactly one solution.
   Levels: easy, medium, hard (fewer clues). Progress is kept on this device. */
(function () {
  "use strict";
  var LEVELS = { easy: 40, medium: 32, hard: 25 };
  var KEY = "sudoku-v1";
  var root = document.getElementById("sudoku");
  if (!root) return;
  var boardEl = root.querySelector(".sd-board");
  var padEl = root.querySelector(".sd-pad");
  var timeEl = root.querySelector("[data-time]");
  var mistakeEl = root.querySelector("[data-mistakes]");
  var levelEl = root.querySelector("[data-level]");
  var notesBtn = root.querySelector("[data-act=notes]");
  var doneDlg = document.getElementById("sdDone");
  var newDlg = document.getElementById("sdNew");

  var GB = window.GameBoard || null;   // shared leaderboard (assets/games/leaderboard.js)
  var S = null;            // game state
  var sel = -1;            // selected cell
  var notesMode = false;
  var tick = null;

  // ---------- Solver and generator ----------
  function row(i) { return (i / 9) | 0; }
  function col(i) { return i % 9; }
  function box(i) { return ((row(i) / 3) | 0) * 3 + ((col(i) / 3) | 0); }
  function bits(m) { var n = 0; while (m) { m &= m - 1; n++; } return n; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  // Counts solutions up to `limit`; with random=true it fills `grid` with the first one found.
  function solve(grid, limit, random) {
    var g = grid.slice(), R = [0, 0, 0, 0, 0, 0, 0, 0, 0], C = R.slice(), B = R.slice(), n = 0, first = null;
    for (var i = 0; i < 81; i++) if (g[i]) { var m = 1 << g[i]; R[row(i)] |= m; C[col(i)] |= m; B[box(i)] |= m; }
    var digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    (function rec() {
      if (n >= limit) return;
      var best = -1, bestM = 0, bestC = 10;
      for (var i = 0; i < 81; i++) {
        if (g[i]) continue;
        var m = ~(R[row(i)] | C[col(i)] | B[box(i)]) & 0x3fe, c = bits(m);
        if (c === 0) return;
        if (c < bestC) { bestC = c; best = i; bestM = m; if (c === 1) break; }
      }
      if (best < 0) { n++; if (!first) first = g.slice(); return; }
      var order = random ? shuffle(digits.slice()) : digits;
      var r = row(best), c2 = col(best), b = box(best);
      for (var k = 0; k < 9; k++) {
        var d = order[k], bit = 1 << d;
        if (!(bestM & bit)) continue;
        g[best] = d; R[r] |= bit; C[c2] |= bit; B[b] |= bit;
        rec();
        g[best] = 0; R[r] &= ~bit; C[c2] &= ~bit; B[b] &= ~bit;
        if (n >= limit) return;
      }
    })();
    return { count: n, grid: first };
  }

  function generate(level) {
    var full = solve(new Array(81).fill(0), 1, true).grid;
    var puzzle = full.slice(), clues = 81, target = LEVELS[level];
    var cells = shuffle(Array.from({ length: 81 }, function (_, i) { return i; }));
    for (var k = 0; k < cells.length && clues > target; k++) {
      var i = cells[k], j = 80 - i;              // remove in symmetric pairs for a tidier pattern
      var a = puzzle[i], b = puzzle[j];
      if (!a) continue;
      puzzle[i] = 0; puzzle[j] = 0;
      if (solve(puzzle, 2, false).count !== 1) { puzzle[i] = a; puzzle[j] = b; continue; }
      clues -= i === j ? 1 : (b ? 2 : 1);
    }
    // Second pass, one cell at a time, for when the symmetric pass could not get low enough
    cells = shuffle(cells);
    for (k = 0; k < cells.length && clues > target; k++) {
      var c = cells[k], v = puzzle[c];
      if (!v) continue;
      puzzle[c] = 0;
      if (solve(puzzle, 2, false).count !== 1) puzzle[c] = v; else clues--;
    }
    return { puzzle: puzzle, solution: full };
  }

  // ---------- State ----------
  function fresh(level) {
    var p = generate(level);
    var s = { level: level, given: p.puzzle, solution: p.solution, values: p.puzzle.slice(),
              notes: new Array(81).fill(0), mistakes: 0, hints: 0, time: 0, done: false, history: [], token: null };
    if (GB) GB.start("sudoku", level, p.puzzle.join("")).then(function (t) { if (S === s) { s.token = t; save(); } });
    return s;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(Object.assign({}, S, { history: S.history.slice(-200) }))); } catch (e) {} }
  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY) || "null");
      if (s && s.given && s.given.length === 81 && LEVELS[s.level]) return s;
    } catch (e) {}
    return null;
  }

  function peers(i) {
    var out = [];
    for (var j = 0; j < 81; j++) if (j !== i && (row(j) === row(i) || col(j) === col(i) || box(j) === box(i))) out.push(j);
    return out;
  }

  function snapshot(i) { S.history.push({ i: i, v: S.values[i], n: S.notes[i], peers: peers(i).map(function (j) { return [j, S.notes[j]]; }) }); }

  function enter(d) {
    if (S.done || sel < 0 || S.given[sel]) return;
    if (S.values[sel] && S.values[sel] === S.solution[sel]) return;   // a correct number stays
    snapshot(sel);
    if (notesMode) {
      if (S.values[sel]) return;
      S.notes[sel] ^= 1 << d;
    } else {
      S.values[sel] = d; S.notes[sel] = 0;
      if (d !== S.solution[sel]) { S.mistakes++; bump(sel); }
      else peers(sel).forEach(function (j) { S.notes[j] &= ~(1 << d); });
    }
    after();
  }
  function erase() {
    if (S.done || sel < 0 || S.given[sel]) return;
    if (S.values[sel] === S.solution[sel]) return;
    if (!S.values[sel] && !S.notes[sel]) return;
    snapshot(sel); S.values[sel] = 0; S.notes[sel] = 0; after();
  }
  function undo() {
    var h = S.history.pop();
    if (!h || S.done) return;
    S.values[h.i] = h.v; S.notes[h.i] = h.n;
    h.peers.forEach(function (p) { S.notes[p[0]] = p[1]; });
    sel = h.i; after();
  }
  function hint() {
    if (S.done) return;
    var i = sel >= 0 && !S.given[sel] && S.values[sel] !== S.solution[sel] ? sel : -1;
    if (i < 0) {
      var open = [];
      for (var k = 0; k < 81; k++) if (S.values[k] !== S.solution[k]) open.push(k);
      if (!open.length) return;
      i = open[Math.floor(Math.random() * open.length)];
    }
    snapshot(i);
    S.values[i] = S.solution[i]; S.notes[i] = 0; S.hints++;
    peers(i).forEach(function (j) { S.notes[j] &= ~(1 << S.solution[i]); });
    sel = i; after();
  }

  function after() {
    if (S.values.every(function (v, i) { return v === S.solution[i]; })) {
      S.done = true; stop();
      render(); save(); win(); return;
    }
    render(); save();
  }

  // ---------- Timer ----------
  function fmt(t) { var m = Math.floor(t / 60), s = t % 60; return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s; }
  function start() { stop(); if (S.done) return; tick = setInterval(function () { S.time++; timeEl.textContent = fmt(S.time); if (S.time % 5 === 0) save(); }, 1000); }
  function stop() { if (tick) clearInterval(tick); tick = null; }
  document.addEventListener("visibilitychange", function () { if (document.hidden) { stop(); if (S) save(); } else if (S) start(); });

  // ---------- Drawing ----------
  var cells = [];
  function build() {
    boardEl.innerHTML = "";
    for (var i = 0; i < 81; i++) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "sd-cell"; b.dataset.i = i;
      b.setAttribute("role", "gridcell");
      if (col(i) % 3 === 2 && col(i) < 8) b.classList.add("br");
      if (row(i) % 3 === 2 && row(i) < 8) b.classList.add("bb");
      boardEl.appendChild(b); cells.push(b);
    }
    padEl.innerHTML = "";
    for (var d = 1; d <= 9; d++) {
      var p = document.createElement("button");
      p.type = "button"; p.className = "sd-num"; p.dataset.d = d;
      p.innerHTML = "<b>" + d + "</b><small></small>";
      padEl.appendChild(p);
    }
  }
  function render() {
    var sv = sel >= 0 ? S.values[sel] : 0, left = [0, 9, 9, 9, 9, 9, 9, 9, 9, 9];
    for (var i = 0; i < 81; i++) {
      var c = cells[i], v = S.values[i], cls = "sd-cell";
      if (col(i) % 3 === 2 && col(i) < 8) cls += " br";
      if (row(i) % 3 === 2 && row(i) < 8) cls += " bb";
      if (S.given[i]) cls += " given";
      else if (v && v !== S.solution[i]) cls += " wrong";
      else if (v) cls += " mine";
      if (sel >= 0) {
        if (i === sel) cls += " sel";
        else if (row(i) === row(sel) || col(i) === col(sel) || box(i) === box(sel)) cls += " zone";
        if (sv && v === sv && i !== sel) cls += " same";
      }
      if (v && v === S.solution[i]) left[v]--;
      c.className = cls;
      if (v) {
        c.textContent = v;
      } else if (S.notes[i]) {
        var h = '<span class="sd-notes">';
        for (var d = 1; d <= 9; d++) h += "<i" + (sv === d ? ' class="on"' : "") + ">" + (S.notes[i] & (1 << d) ? d : "") + "</i>";
        c.innerHTML = h + "</span>";
      } else c.textContent = "";
      c.setAttribute("aria-label", "Row " + (row(i) + 1) + ", column " + (col(i) + 1) + ", " + (v ? v + (S.given[i] ? " (given)" : "") : "empty"));
    }
    padEl.querySelectorAll(".sd-num").forEach(function (p) {
      var d = +p.dataset.d;
      p.querySelector("small").textContent = left[d] || "";
      p.disabled = left[d] === 0;
    });
    mistakeEl.textContent = S.mistakes;
    levelEl.textContent = S.level[0].toUpperCase() + S.level.slice(1);
    timeEl.textContent = fmt(S.time);
    notesBtn.setAttribute("aria-pressed", notesMode);
    notesBtn.querySelector("em").textContent = notesMode ? "On" : "Off";
    root.querySelectorAll("[data-pick]").forEach(function (b) { b.setAttribute("aria-checked", b.dataset.pick === S.level); });
    root.classList.toggle("is-done", !!S.done);
  }
  function bump(i) { var c = cells[i]; c.classList.remove("shake"); void c.offsetWidth; c.classList.add("shake"); }

  function win() {
    doneDlg.querySelector("[data-sum]").textContent =
      S.level[0].toUpperCase() + S.level.slice(1) + " solved in " + fmt(S.time) + " with " +
      (S.mistakes ? S.mistakes + " mistake" + (S.mistakes > 1 ? "s" : "") : "no mistakes") +
      (S.hints ? " and " + S.hints + " hint" + (S.hints > 1 ? "s" : "") : "") + ".";
    try {
      var best = JSON.parse(localStorage.getItem(KEY + "-best") || "{}");
      var rec = !best[S.level] || S.time < best[S.level];
      if (rec) { best[S.level] = S.time; localStorage.setItem(KEY + "-best", JSON.stringify(best)); }
      doneDlg.querySelector("[data-best]").textContent = rec ? "New best time for this level!" : "Best time: " + fmt(best[S.level]);
    } catch (e) { doneDlg.querySelector("[data-best]").textContent = ""; }
    var rankEl = doneDlg.querySelector("[data-rank]");
    rankEl.textContent = "";
    if (GB) {
      rankEl.textContent = "Adding you to the leaderboard…";
      var level = S.level;
      GB.finish("sudoku", level, S.token, { time: S.time, mistakes: S.mistakes, hints: S.hints,
                                            proof: { given: S.given.join(""), values: S.values.join("") } })
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
      myRank = root.querySelector("[data-myrank]"), lbLevel = "easy", lbReq = 0;
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function showBoard(level) {
    if (!GB || !lbRows) return;
    lbLevel = level;
    root.querySelectorAll("[data-lb]").forEach(function (b) { b.setAttribute("aria-selected", b.dataset.lb === level); });
    var req = ++lbReq;
    GB.top("sudoku", level).then(function (r) {
      if (req !== lbReq) return;
      var rows = (r && r.rows) || [];
      lbNote.textContent = r.local ? (r.offline ? "Can't reach the leaderboard right now. These are your results on this device."
                                                : "Your results on this device. The shared leaderboard opens soon.")
                                   : r.total + " player" + (r.total === 1 ? "" : "s") + " on " + level;
      lbRows.innerHTML = rows.length ? rows.map(function (x, i) {
        var mine = x.player === GB.player;
        return '<tr' + (mine ? ' class="me"' : "") + "><td>" + (i + 1) + "</td><td>" + esc(x.player) + (mine ? " <em>You</em>" : "") +
               "</td><td><b>" + fmt(x.score) + "</b></td><td>" + fmt(x.time) + '</td><td class="opt">' + x.mistakes +
               '</td><td class="opt">' + x.hints + '</td><td class="opt">' + esc(x.date) + "</td></tr>";
      }).join("") : '<tr><td colspan="7" class="sd-lb-empty">No results yet on ' + level + ". Solve one to be first!</td></tr>";
      var me = r.me;
      myRank.textContent = me && !r.local ? " · your best on " + level + ": #" + me.rank + " (" + fmt(me.score) + ")" : "";
    });
  }
  root.addEventListener("click", function (e) { var b = e.target.closest("[data-lb]"); if (b) showBoard(b.dataset.lb); });
  if (GB) root.querySelector("[data-player]").textContent = GB.player;
  else { var lb = root.querySelector(".sd-lb"); if (lb) lb.hidden = true; }

  function newGame(level) {
    root.classList.add("is-busy");
    setTimeout(function () {
      S = fresh(level); sel = -1; notesMode = false;
      root.classList.remove("is-busy");
      render(); save(); start();
    }, 30);
  }
  function askNew(level) {
    var playing = S && !S.done && S.values.some(function (v, i) { return v && !S.given[i]; });
    if (!playing || !newDlg.showModal) return newGame(level);
    newDlg.dataset.level = level;
    newDlg.querySelector("[data-lvl]").textContent = level;
    newDlg.showModal();
  }

  // ---------- Input ----------
  boardEl.addEventListener("click", function (e) {
    var c = e.target.closest(".sd-cell");
    if (!c) return;
    sel = +c.dataset.i; render();
  });
  padEl.addEventListener("click", function (e) {
    var p = e.target.closest(".sd-num");
    if (p && !p.disabled) enter(+p.dataset.d);
  });
  root.addEventListener("click", function (e) {
    var a = e.target.closest("[data-act]"), pick = e.target.closest("[data-pick]");
    if (pick) return askNew(pick.dataset.pick);
    if (!a) return;
    var act = a.dataset.act;
    if (act === "undo") undo();
    else if (act === "erase") erase();
    else if (act === "hint") hint();
    else if (act === "notes") { notesMode = !notesMode; render(); }
    else if (act === "new") askNew(S.level);
  });
  newDlg.addEventListener("close", function () { if (newDlg.returnValue === "yes") newGame(newDlg.dataset.level); });
  doneDlg.addEventListener("close", function () { if (doneDlg.returnValue === "again") newGame(S.level); });

  document.addEventListener("keydown", function (e) {
    if (!S || e.ctrlKey && e.key.toLowerCase() !== "z" || e.metaKey || e.altKey) return;
    if (document.querySelector("dialog[open]")) return;
    var t = e.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
    var k = e.key;
    if (e.ctrlKey && k.toLowerCase() === "z") { undo(); e.preventDefault(); return; }
    if (/^[1-9]$/.test(k)) { enter(+k); e.preventDefault(); return; }
    if (k === "Backspace" || k === "Delete" || k === "0") { erase(); e.preventDefault(); return; }
    if (k.toLowerCase() === "n") { notesMode = !notesMode; render(); return; }
    var moves = { ArrowUp: -9, ArrowDown: 9, ArrowLeft: -1, ArrowRight: 1 };
    if (moves[k] !== undefined) {
      if (sel < 0) sel = 0;
      else {
        var r = row(sel), c = col(sel);
        if (k === "ArrowUp") r = (r + 8) % 9; if (k === "ArrowDown") r = (r + 1) % 9;
        if (k === "ArrowLeft") c = (c + 8) % 9; if (k === "ArrowRight") c = (c + 1) % 9;
        sel = r * 9 + c;
      }
      cells[sel].focus({ preventScroll: true });
      render(); e.preventDefault();
    }
  });

  build();
  S = load();
  if (S) { render(); start(); }
  else newGame("easy");
  showBoard(S ? S.level : "easy");
})();
