/* Leaderboard section on /games/: pick a game and a level, see the top 10 (via assets/games/leaderboard.js). */
(function () {
  "use strict";
  var root = document.getElementById("leaderboard"), GB = window.GameBoard;
  if (!root || !GB) { if (root) root.hidden = true; return; }
  var rowsEl = root.querySelector("[data-lb-rows]"), note = root.querySelector("[data-lb-note]"),
      myRank = root.querySelector("[data-myrank]"), levelsEl = root.querySelector("[data-levels]"),
      play = root.querySelector("[data-lb-play]");
  var gameBtn = root.querySelector("[data-game][aria-selected=true]") || root.querySelector("[data-game]");
  var game = gameBtn.dataset.game, level = gameBtn.dataset.lvls.split(",")[0], req = 0;
  root.querySelector("[data-player]").textContent = GB.player;

  function fmt(t) { t = Math.round(t); var m = Math.floor(t / 60), s = t % 60; return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function title(s) { return s[0].toUpperCase() + s.slice(1); }

  function levelButtons(levels) {
    levelsEl.innerHTML = levels.map(function (l) {
      return '<button type="button" role="tab" aria-selected="' + (l === level) + '" data-level="' + l + '">' + title(l) + "</button>";
    }).join("");
  }

  function load() {
    var r0 = ++req;
    root.querySelectorAll("[data-level]").forEach(function (b) { b.setAttribute("aria-selected", b.dataset.level === level); });
    root.querySelectorAll("[data-game]").forEach(function (b) { b.setAttribute("aria-selected", b.dataset.game === game); });
    rowsEl.setAttribute("aria-busy", "true");
    GB.top(game, level).then(function (r) {
      if (r0 !== req) return;
      rowsEl.removeAttribute("aria-busy");
      var rows = ((r && r.rows) || []).slice(0, 10), gname = gameBtn.dataset.title;
      note.textContent = r.local ? (r.offline ? "Can't reach the leaderboard right now. These are your results on this device." : "Your results on this device.")
                                 : r.total + " player" + (r.total === 1 ? "" : "s") + " on " + gname + " " + title(level);
      rowsEl.innerHTML = rows.length ? rows.map(function (x, i) {
        var mine = x.player === GB.player;
        return "<tr" + (mine ? ' class="me"' : "") + "><td>" + (i + 1) + "</td><td>" + esc(x.player) + (mine ? " <em>You</em>" : "") +
               "</td><td><b>" + fmt(x.score) + "</b></td><td>" + fmt(x.time) + '</td><td class="opt">' + x.mistakes +
               '</td><td class="opt">' + x.hints + '</td><td class="opt">' + esc(x.date) + "</td></tr>";
      }).join("") : '<tr><td colspan="7" class="gm-lb-empty">No results yet on ' + title(level) + ". Be the first!</td></tr>";
      var me = r.me;
      myRank.textContent = me && !r.local ? " · your best here: #" + me.rank + " (" + fmt(me.score) + ")" : "";
    });
  }

  root.addEventListener("click", function (e) {
    var g = e.target.closest("[data-game]"), l = e.target.closest("[data-level]");
    if (g && g.dataset.game !== game) {
      gameBtn = g; game = g.dataset.game;
      var levels = g.dataset.lvls.split(",");
      if (levels.indexOf(level) < 0) level = levels[0];
      levelButtons(levels);
      play.href = g.dataset.url;
      play.firstChild.textContent = "Play " + g.dataset.title + " ";
      load();
    } else if (l && l.dataset.level !== level) {
      level = l.dataset.level; load();
    }
  });
  load();
})();
