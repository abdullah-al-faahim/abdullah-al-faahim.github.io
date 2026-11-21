/* Shared leaderboard for the games on /games/.
   Each player gets a unique key (like P-K7F3QX) the first time they play, kept on this device.
   With a leaderboard server set (window.GAMES_LB, the Apps Script in tools/leaderboard) results
   are ranked for everyone; without one, the board shows this device's own results. */
(function () {
  "use strict";
  var KEY = "games-player", LOCAL = "games-local-results";
  var ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  var PENALTY = { mistake: 15, hint: 60 };
  var endpoint = (window.GAMES_LB || "").trim();

  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  function newKey() {
    var a = new Uint8Array(6), s = "P-";
    (window.crypto || window.msCrypto).getRandomValues(a);
    for (var i = 0; i < 6; i++) s += ALPHA[a[i] % ALPHA.length];
    return s;
  }
  var player = store(KEY);
  if (!/^P-[A-Z2-9]{6}$/.test(player || "")) { player = newKey(); store(KEY, player); }

  function post(body) {
    return fetch(endpoint, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(body) })
      .then(function (r) { return r.json(); });
  }
  function score(r) { return r.time + r.mistakes * PENALTY.mistake + r.hints * PENALTY.hint; }
  function sortRows(rows) { return rows.sort(function (a, b) { return a.score - b.score || a.time - b.time || (a.date < b.date ? -1 : 1); }); }
  function today() { var d = new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }

  function localAll() { try { return JSON.parse(store(LOCAL) || "[]"); } catch (e) { return []; } }
  function localSave(game, level, r) {
    var all = localAll();
    all.push({ game: game, level: level, player: player, time: r.time, mistakes: r.mistakes, hints: r.hints, score: score(r), date: today() });
    store(LOCAL, JSON.stringify(all.slice(-300)));
  }
  function localTop(game, level) {
    var rows = sortRows(localAll().filter(function (r) { return r.game === game && r.level === level; }));
    return { ok: true, local: true, total: rows.length, rows: rows.slice(0, 20), me: rows[0] ? Object.assign({ rank: 1 }, rows[0]) : null };
  }

  window.GameBoard = {
    player: player,
    online: !!endpoint,
    penalty: PENALTY,
    /** Ask the server for a token when a game starts. Resolves to the token, or null. */
    start: function (game, level, puzzle) {
      if (!endpoint) return Promise.resolve(null);
      return post({ action: "start", game: game, level: level, player: player, puzzle: puzzle })
        .then(function (r) { return r.ok ? r.token : null; })
        .catch(function () { return null; });
    },
    /** Record a finished game. result: {time, mistakes, hints, proof}. Resolves to {ok, rank, total, error, local}. */
    finish: function (game, level, token, result) {
      localSave(game, level, result);
      if (!endpoint) return Promise.resolve({ ok: true, local: true });
      if (!token) return Promise.resolve({ ok: false, error: "This game was not connected to the leaderboard when it started." });
      return post({ action: "finish", token: token, time: result.time, mistakes: result.mistakes, hints: result.hints, proof: result.proof })
        .catch(function () { return { ok: false, error: "Could not reach the leaderboard." }; });
    },
    /** Top results for a level, plus this player's own rank (me). */
    top: function (game, level) {
      if (!endpoint) return Promise.resolve(localTop(game, level));
      return fetch(endpoint + "?game=" + encodeURIComponent(game) + "&level=" + encodeURIComponent(level) + "&player=" + player)
        .then(function (r) { return r.json(); })
        .then(function (r) { if (r && r.ok) return r; var l = localTop(game, level); l.offline = true; return l; })   // e.g. server not updated for this game yet
        .catch(function () { var l = localTop(game, level); l.offline = true; return l; });
    }
  };
})();
