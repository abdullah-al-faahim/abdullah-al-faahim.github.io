/* Oxford 3000: learn a few words every day.
   Flashcards (English + Bangla + real-life sentences), spaced review, practice quizzes and a weekly 20-word exam.
   Progress is kept on this device and, with a free account, saved on the server too (see tools/apps-script/Code.gs). */
(function () {
  "use strict";
  const KEY = "oxford3000-v1", BASE = "/games/oxford-3000/data/";
  const GOAL = 10, EXAM_SIZE = 20, PASS = 14, INTERVALS = [0, 1, 2, 4, 8, 16, 32];
  const LEVELS = ["Beginner", "Explorer", "Word Collector", "Word Wizard", "Vocab Hero", "Language Master", "Oxford Legend"];
  const root = document.getElementById("ox"), stage = document.getElementById("oxStage");
  if (!root) return;
  const $ = (s, r) => (r || root).querySelector(s), $$ = (s, r) => [...(r || root).querySelectorAll(s)];

  /* ---------- Small helpers ---------- */
  const ICONS = {
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    eyeoff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4M6.5 6.6A17 17 0 0 0 2 12s3.6 7 10 7a9.7 9.7 0 0 0 4-.9M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>',
    speaker: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>',
    chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
    gamepad: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="7" width="20" height="11" rx="5"/><path d="M7 10.5v4M5 12.5h4"/><circle cx="16" cy="11.5" r="1" fill="currentColor"/><circle cx="18.5" cy="14" r="1" fill="currentColor"/></svg>',
    sparkles: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7z"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/></svg>',
    flame: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3.2 2-4 .2 1.3.8 2 1.6 2.3C10.4 8 10.5 5.5 12 3z"/></svg>',
    trophy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4"/><path d="M12 13v4M8 20h8M10 17h4"/></svg>',
    thumb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 11v9H4v-9zM7 11l4-7c1.5 0 2.5 1 2.2 2.6L12.7 10H19a2 2 0 0 1 2 2.4l-1.3 6a2 2 0 0 1-2 1.6H7"/></svg>',
    sprout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21v-9"/><path d="M12 12C12 8 9 6 5 6c0 4 2.5 6 7 6zM12 14c0-3 2-5 6-5 0 3.5-2 5-6 5z"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/></svg>',
    refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 11a8 8 0 0 0-14-4L4 9M4 4v5h5M4 13a8 8 0 0 0 14 4l2-2M20 20v-5h-5"/></svg>',
    dice: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1" fill="currentColor"/><circle cx="15" cy="9" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="9" cy="15" r="1" fill="currentColor"/><circle cx="15" cy="15" r="1" fill="currentColor"/></svg>',
    text: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19l5-14 5 14M6 14h6M16 19v-8M16 11c2-2 4-1.5 4 1v7"/></svg>',
    translate: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6h9M8.5 4v2M6 6c0 4 3 7 6 8M11 6c0 3-3 7-7 9M13 20l4-9 4 9M14.5 17h5"/></svg>',
    pen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20l1-4L16.5 4.5a2 2 0 0 1 3 3L8 19z"/><path d="M14 7l3 3"/></svg>',
    headphones: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/></svg>',
    keyboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h.01M11 10h.01M15 10h.01M7 14h10"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
    note: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 3h8l4 4v14H7z"/><path d="M14 3v5h5M10 12h6M10 16h6"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h10"/></svg>',
    zap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 3L5 13h6l-1 8 8-10h-6z"/></svg>',
    rocket: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3c3.5 2 5 6 4 11l-4 3-4-3c-1-5 .5-9 4-11z"/><circle cx="12" cy="10" r="1.5"/><path d="M8 14l-3 2 1 3 3-1M16 14l3 2-1 3-3-1"/></svg>',
    target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg>',
    gem: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 4h12l3 5-9 11L3 9z"/><path d="M3 9h18M9 4l-1 5 4 11 4-11-1-5"/></svg>'
  };
  const ic = n => `<span class="ox-ic">${ICONS[n]}</span>`;
  $$("[data-ic]").forEach(el => { el.innerHTML = ic(el.dataset.ic); });
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pad = n => (n < 10 ? "0" : "") + n;
  const dstr = (d = new Date()) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  const dnum = s => { const p = s.split("-"); return Math.round(Date.UTC(+p[0], +p[1] - 1, +p[2]) / 864e5); };
  const today = () => dnum(dstr());
  const dayStr = n => new Date(n * 864e5).toISOString().slice(0, 10);
  const weekStart = n => n - ((n + 4) % 7);               // weeks run Sunday to Saturday
  const fmtDay = n => new Date(n * 864e5).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function shuffle(a, r = Math.random) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  const plural = (n, w) => n + " " + w + (n === 1 ? "" : "s");

  /* ---------- Data ---------- */
  const D = { words: [], det: {}, play: [] };    // words: [word, pos, level]; det: id -> [bangla, meaning, example1, example2]
  const base = id => D.words[id][0].replace(/\(.*\)/, "").trim();
  const baseWord = id => base(id).split(",")[0].trim();
  const lvlOf = id => D.words[id][2];

  /* ---------- Progress ---------- */
  // w: id -> [box, due(day), seen, right, firstLearned(day), last(day)]   d: date -> [new, review, xp, quizAnswers, correct]
  // ex: weekly exams [{wk, date, score, total, miss}]   t: today's new words {day, ids}   xq: this week's exam words {wk, ids}
  let P = blank();
  function blank() { return { v: 1, w: {}, d: {}, ex: [], t: null, xq: null, ts: 0 }; }
  let ACC = { user: "", token: "", state: "local" };   // state: local | syncing | saved | error
  function loadLocal() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || "null");
      if (s && s.p && s.p.v === 1) { P = s.p; ACC.user = s.user || ""; ACC.token = s.token || ""; if (ACC.token) ACC.state = "saved"; }
    } catch (e) {}
  }
  function saveLocal() { try { localStorage.setItem(KEY, JSON.stringify({ p: P, user: ACC.user, token: ACC.token })); } catch (e) {} }
  function day(date = dstr()) { return P.d[date] || (P.d[date] = [0, 0, 0, 0, 0]); }
  const xpTotal = () => Object.keys(P.d).reduce((s, k) => s + (P.d[k][2] || 0), 0);
  const levelInfo = () => { const x = xpTotal(), n = Math.floor(Math.sqrt(x / 40)), cur = n * n * 40, nxt = (n + 1) * (n + 1) * 40; return { n, name: LEVELS[Math.min(n, LEVELS.length - 1)], pct: Math.round((x - cur) / (nxt - cur) * 100), x, nxt }; };
  function addXP(n) { day()[2] += n; return n; }
  function touch() { P.ts = Date.now(); saveLocal(); scheduleSync(); chrome(); }
  const learnedIds = () => Object.keys(P.w).map(Number).filter(id => P.w[id][4]);
  const dueIds = () => learnedIds().filter(id => P.w[id][1] <= today());
  const mastered = () => learnedIds().filter(id => P.w[id][0] >= 5).length;
  function streak() {
    let n = today(), c = 0;
    const active = k => { const r = P.d[dayStr(k)]; return r && (r[0] + r[1] + r[3] > 0); };
    if (!active(n)) n--;
    while (active(n)) { c++; n--; }
    return c;
  }
  function rateWord(id, ok, forgot) {
    const t = today(), w = P.w[id] || (P.w[id] = [0, t, 0, 0, 0, t]);
    w[2]++; w[5] = t;
    if (ok) { w[3]++; w[0] = forgot ? 1 : Math.min(6, w[0] + 1); if (!w[4]) w[4] = t; w[1] = t + INTERVALS[w[0]]; }
    else { w[0] = 0; w[1] = t; }
  }

  /* ---------- Merging progress from two devices ---------- */
  function merge(a, b) {
    const m = blank();
    [a, b].forEach(src => Object.keys(src.w || {}).forEach(id => {
      const x = src.w[id], y = m.w[id];
      if (!y || x[5] > y[5] || (x[5] === y[5] && x[2] > y[2])) m.w[id] = x.slice();
    }));
    [a, b].forEach(src => Object.keys(src.d || {}).forEach(k => {
      const x = src.d[k], y = m.d[k] || (m.d[k] = [0, 0, 0, 0, 0]);
      for (let i = 0; i < 5; i++) y[i] = Math.max(y[i], x[i] || 0);
    }));
    const seen = {};
    [...(a.ex || []), ...(b.ex || [])].forEach(e => { if (!seen[e.wk] || e.date < seen[e.wk].date) seen[e.wk] = e; });
    m.ex = Object.keys(seen).map(k => seen[k]).sort((p, q) => p.wk - q.wk);
    const pick = (x, y, key) => (x && y ? (x[key] >= y[key] ? x : y) : x || y) || null;
    m.t = pick(a.t, b.t, "day"); m.xq = pick(a.xq, b.xq, "wk");
    m.ts = Math.max(a.ts || 0, b.ts || 0);
    return m;
  }

  /* ---------- Account and sync ---------- */
  const SERVER = (window.GAMES_LB || "").trim();
  async function post(body) {
    if (!SERVER) throw new Error("offline");
    const r = await fetch(SERVER, { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify(body) });
    return r.json();
  }
  let syncTimer = null, syncing = false, again = false;
  function scheduleSync() { if (!ACC.token) return; clearTimeout(syncTimer); syncTimer = setTimeout(sync, 2500); }
  async function sync() {
    if (!ACC.token) return;
    if (syncing) { again = true; return; }
    syncing = true; ACC.state = "syncing"; chrome();
    try {
      const r = await post({ action: "ox_save", token: ACC.token, data: JSON.stringify(P) });
      if (r.ok) ACC.state = "saved";
      else if (/sign in again/i.test(r.error || "")) { ACC.state = "error"; ACC.expired = true; }
      else ACC.state = "error";
    } catch (e) { ACC.state = "error"; }
    syncing = false; saveLocal(); chrome();
    if (again) { again = false; scheduleSync(); }
  }
  document.addEventListener("visibilitychange", () => { if (document.hidden && ACC.token && ACC.state !== "saved") sync(); });
  function adopt(r) {
    ACC.user = r.user; ACC.token = r.token; ACC.expired = false;
    let remote = null;
    try { remote = r.data ? JSON.parse(r.data) : null; } catch (e) {}
    if (remote && remote.v === 1) P = merge(P, remote);
    touch(); sync(); render();
  }

  /* ---------- Speech ---------- */
  const canSpeak = "speechSynthesis" in window;
  function speak(text) {
    if (!canSpeak) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "en-US"; u.rate = 0.9;
      const v = speechSynthesis.getVoices().find(x => /^en[-_](US|GB)/i.test(x.lang));
      if (v) u.voice = v;
      speechSynthesis.speak(u);
    } catch (e) {}
  }
  const speakBtn = (text, label = "Listen") => canSpeak ? `<button type="button" class="ox-speak" data-say="${esc(text)}" aria-label="${label}">${ic("speaker")}</button>` : "";

  /* ---------- Sentences ---------- */
  function stemRe(id) {
    const w = baseWord(id).toLowerCase();
    const parts = w.split(/\s+/).map(p => (p.length > 4 ? escRe(p.slice(0, -1)) + "\\w*" : escRe(p) + (p.length <= 3 ? "(?:s|ed|ing)?" : "\\w*")));
    return new RegExp("\\b(" + parts.join("\\s+") + ")\\b", "i");
  }
  const hl = (s, id) => esc(s).replace(stemRe(id), "<mark>$1</mark>");
  function blankSentence(id) {   // an example where the word appears in its plain form, with the word hidden
    const w = baseWord(id).toLowerCase();
    for (const s of [D.det[id][2], D.det[id][3]]) {
      const m = s.match(stemRe(id));
      if (m && (m[1].toLowerCase() === w || m[1].toLowerCase() === w + "s")) return s.replace(stemRe(id), "_____");
    }
    return "";
  }

  /* ---------- Quiz questions ---------- */
  const optionsFor = (id, key) => {
    const pos = D.words[id][1].split(/[.,/]/)[0], right = key(id), seen = { [right]: 1 };
    let pool = shuffle(D.play).filter(o => o !== id && D.words[o][1].split(/[.,/]/)[0] === pos);
    pool = pool.concat(shuffle(D.play).filter(o => o !== id && !pool.includes(o)));
    const out = [id];
    for (const o of pool) { const k = key(o); if (!seen[k]) { seen[k] = 1; out.push(o); } if (out.length === 4) break; }
    return shuffle(out);
  };
  function makeQuestion(id, type) {
    const det = D.det[id], bn = det[0];
    if (type === "blank" && !blankSentence(id)) type = "mean";
    if (type === "listen" && !canSpeak) type = "word";
    if (type === "mean") return { id, type, opts: optionsFor(id, o => D.det[o][0]), show: "bn", key: o => D.det[o][0] };
    if (type === "word" || type === "listen" || type === "blank") return { id, type, opts: optionsFor(id, o => baseWord(o)), show: "word", key: o => baseWord(o) };
    return { id, type: "spell", bn };
  }
  const checkTyped = (id, txt) => {
    const t = txt.trim().toLowerCase().replace(/\s+/g, " ");
    return D.words[id][0].replace(/\(.*\)/, "").toLowerCase().split(/[,/]/).map(x => x.trim()).filter(Boolean).includes(t);
  };
  const answerText = id => base(id);

  /* ---------- Rendering shell ---------- */
  let tab = "today";
  function chrome() {
    $("[data-streak]").textContent = streak();
    $("[data-xp]").textContent = xpTotal();
    const L = levelInfo();
    $("[data-levelname]").textContent = "Level " + (L.n + 1) + " · " + L.name;
    $("[data-levelbar]").style.width = L.pct + "%";
    $("[data-acct-label]").textContent = ACC.user ? ACC.user : "Sign up / Sign in";
    const labels = { local: "Saved on this device", syncing: "Saving…", saved: "Saved to your account", error: ACC.expired ? "Sign in again to sync" : "Couldn't sync, will retry" };
    $("[data-sync]").textContent = ACC.user ? labels[ACC.state] : labels.local;
    const due = dueIds().length, b = $("[data-due-badge]");
    b.hidden = !due; b.textContent = due > 99 ? "99+" : due;
    const sl = $("[data-sync-long]"); if (sl) sl.textContent = ACC.user ? labels[ACC.state] + "." : "";
  }
  function setTab(t) {
    tab = t;
    $$(".ox-tabs [role=tab]").forEach(b => b.setAttribute("aria-selected", b.dataset.tab === t));
    render();
  }
  function render() {
    chrome();
    stopSession();
    ({ today: viewToday, review: viewReview, practice: viewPractice, exam: viewExam, progress: viewProgress }[tab])();
    stage.scrollTop = 0;
  }
  const html = h => { stage.innerHTML = h; };

  /* ---------- Today ---------- */
  function todayPlan() {
    const t = today();
    if (!P.t || P.t.day !== t) {
      const ids = D.play.filter(id => !P.w[id] || !P.w[id][4]).slice(0, GOAL);
      P.t = { day: t, ids }; saveLocal();
    }
    return P.t;
  }
  function newToLearn() { return todayPlan().ids.filter(id => !(P.w[id] && P.w[id][4])); }
  function viewToday() {
    const plan = todayPlan(), left = newToLearn(), done = plan.ids.length - left.length;
    const goal = Math.max(plan.ids.length, 1), pct = Math.round(done / goal * 100);
    const due = dueIds().length, learned = learnedIds().length, all = D.play.length;
    const finishedAll = learned >= all;
    const ring = `<svg class="ox-ring" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52" class="bg"/><circle cx="60" cy="60" r="52" class="fg" stroke-dasharray="${(pct / 100 * 326.7).toFixed(1)} 326.7"/></svg>`;
    const ex = examState();
    const wod = D.play[(today() * 7) % D.play.length], det = D.det[wod];
    const hero = finishedAll
      ? `<h2>You learned every word in this course!</h2><p>More words are on the way. Keep reviewing so nothing slips away.</p>`
      : left.length
        ? `<h2>Today's words</h2><p>Learn <b>${left.length}</b> new ${left.length === 1 ? "word" : "words"} with flashcards, then a quick quiz. It takes about 5 minutes.</p><button class="ox-primary" data-go="learn">${done ? "Continue learning" : "Start learning"}</button>`
        : `<h2>Goal complete! ${ic("sparkles")}</h2><p>You learned ${plural(plan.ids.length, "new word")} today. Come back tomorrow, or learn a few more now.</p><button class="ox-primary" data-go="more">Learn 5 more words</button>`;
    html(`<div class="ox-hero"><div class="ox-ringwrap">${ring}<div class="ox-ringtxt"><b>${done}</b><span>of ${plan.ids.length || GOAL}</span></div></div><div class="ox-herotxt">${hero}</div></div>
      <div class="ox-cards">
        <article class="ox-mini"><h3>Review</h3><p>${due ? `<b>${due}</b> ${due === 1 ? "word is" : "words are"} ready to review. Short, spaced reviews make words stick.` : "Nothing due right now. New reviews appear as your words come due."}</p>${due ? '<button class="ox-ghost" data-go="review">Review now</button>' : ""}</article>
        <article class="ox-mini"><h3>Weekly exam</h3><p>${ex.text}</p>${ex.btn ? `<button class="ox-ghost" data-go="exam">${ex.btn}</button>` : ""}</article>
        <article class="ox-mini wod"><h3>Word of the day</h3><p class="w">${esc(base(wod))} ${speakBtn(baseWord(wod))}</p><p class="bn">${esc(det[0])}</p><p class="ex">“${hl(det[2], wod)}”</p></article>
      </div>`);
  }

  /* ---------- Sessions: flashcards ---------- */
  let session = null;
  function stopSession() { session = null; document.onkeydown = null; }
  function startCards(ids, mode) {
    session = { type: "cards", queue: ids.slice(), total: ids.length, mode, flipped: false, forgot: {}, learned: [], again: 0 };
    cardView();
    document.onkeydown = e => {
      if (!session || session.type !== "cards" || e.target.closest("input,textarea,dialog")) return;
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); flipCard(); }
      else if (e.key === "ArrowRight" && session.flipped) rateCard(true);
      else if (e.key === "ArrowLeft" && session.flipped) rateCard(false);
    };
  }
  function cardView() {
    const s = session, id = s.queue[0];
    if (id === undefined) return cardsDone();
    const w = D.words[id], det = D.det[id], doneN = s.total - s.queue.length;
    s.flipped = false;
    html(`<div class="ox-session">
      <div class="ox-prog"><button class="ox-link" data-go="exit">&#8592; Exit</button><div class="ox-bar big"><i style="width:${Math.round(doneN / s.total * 100)}%"></i></div><span>${doneN} / ${s.total}</span></div>
      <div class="ox-card" id="oxCard" tabindex="0" role="button" aria-label="Flip card" data-flip="false">
        <div class="ox-face front"><span class="ox-lvl">${w[2]}</span><h2>${esc(base(id))}</h2><p class="ox-pos">${esc(w[1])}</p>${speakBtn(baseWord(id), "Hear the word")}<p class="ox-tap">Tap the card to see the meaning</p></div>
        <div class="ox-face back">
          <p class="ox-wordsm">${esc(base(id))} <span>${esc(w[1])}</span>${speakBtn(baseWord(id), "Hear the word")}</p>
          <p class="ox-bn" lang="bn">${esc(det[0])}</p>
          <p class="ox-def">${esc(det[1])}</p>
          <ul class="ox-ex"><li>${hl(det[2], id)}${speakBtn(det[2], "Hear the sentence")}</li><li>${hl(det[3], id)}${speakBtn(det[3], "Hear the sentence")}</li></ul>
        </div>
      </div>
      <div class="ox-rate" data-rate hidden>
        <button class="ox-again" data-rate-no>&#8592; Again<small>show me later</small></button>
        <button class="ox-got" data-rate-yes>Got it &#8594;<small>I know this</small></button>
      </div>
      <button class="ox-ghost ox-flipbtn" data-flipbtn>Flip card <small>(Space)</small></button>
    </div>`);
  }
  function flipCard() {
    const c = $("#oxCard"); if (!c || !session) return;
    session.flipped = !session.flipped;
    c.dataset.flip = session.flipped;
    $("[data-rate]").hidden = !session.flipped;
    $("[data-flipbtn]").hidden = session.flipped;
    if (session.flipped) { const id = session.queue[0]; if (!session.said) { session.said = true; } speak(baseWord(id)); }
  }
  function rateCard(ok) {
    const s = session, id = s.queue.shift();
    if (ok) {
      const first = !(P.w[id] && P.w[id][4]);
      rateWord(id, true, s.forgot[id]);
      const d = day();
      if (s.mode === "learn" && first) { d[0]++; addXP(5); } else { d[1]++; addXP(3); }
      s.learned.push(id);
    } else {
      s.again++; s.forgot[id] = true;
      s.queue.splice(Math.min(3, s.queue.length), 0, id);
    }
    touch();
    cardView();
  }
  function cardsDone() {
    const s = session, ids = s.learned.slice();
    const xp = ids.length * (s.mode === "learn" ? 5 : 3);
    const quiz = s.mode === "learn" && ids.length >= 1;
    confetti(40);
    html(`<div class="ox-result"><div class="ox-emoji">${ic("star")}</div><h2>${s.mode === "learn" ? "New words learned!" : "Review done!"}</h2>
      <p>${plural(ids.length, "word")} ${s.mode === "learn" ? "added to your memory" : "reviewed"} · <b>+${xp} XP</b>${s.again ? ` · ${plural(s.again, "retry")}` : ""}</p>
      <div class="ox-chiplist">${ids.map(id => `<span>${esc(base(id))}</span>`).join("")}</div>
      <div class="ox-actions">${quiz ? '<button class="ox-primary" data-go="quizlearned">Take the quick quiz (+XP)</button>' : ""}<button class="ox-ghost" data-go="home">Back to Today</button></div></div>`);
    s.finished = ids;
  }

  /* ---------- Sessions: quizzes ---------- */
  function startQuiz(ids, types, opts = {}) {
    const qs = ids.map((id, i) => makeQuestion(id, types[i % types.length]));
    session = { type: "quiz", qs, i: 0, right: [], wrong: [], combo: 0, best: 0, xp: 0, opts, locked: false, answers: [] };
    quizView();
    document.onkeydown = e => {
      if (!session || session.type !== "quiz" || e.target.closest("input,textarea,dialog")) return;
      const n = +e.key;
      if (n >= 1 && n <= 4 && !session.locked) { const b = $$("[data-opt]")[n - 1]; if (b) b.click(); }
      else if ((e.key === "Enter" || e.key === " ") && session.locked && $("[data-next]")) { e.preventDefault(); $("[data-next]").click(); }
    };
  }
  function quizView() {
    const s = session, q = s.qs[s.i];
    if (!q) return quizDone();
    s.locked = false;
    const det = D.det[q.id], total = s.qs.length, prog = Math.round(s.i / total * 100);
    let body = "";
    if (q.type === "mean") body = `<p class="ox-qlabel">What does this word mean?</p><h2 class="ox-qword">${esc(base(q.id))} ${speakBtn(baseWord(q.id))}</h2><p class="ox-pos">${esc(D.words[q.id][1])}</p>`;
    else if (q.type === "word") body = `<p class="ox-qlabel">Which English word matches?</p><h2 class="ox-qbn" lang="bn">${esc(det[0])}</h2><p class="ox-def">${esc(det[1])}</p>`;
    else if (q.type === "blank") body = `<p class="ox-qlabel">Fill in the blank</p><p class="ox-qsent">${esc(blankSentence(q.id))}</p><p class="ox-hintline" lang="bn">${esc(det[0])}</p>`;
    else if (q.type === "listen") body = `<p class="ox-qlabel">Listen, then choose the word you hear</p><button class="ox-bigspeak" data-say="${esc(baseWord(q.id))}">${ic("speaker")} Play word</button>`;
    else body = `<p class="ox-qlabel">Type the English word</p><h2 class="ox-qbn" lang="bn">${esc(det[0])}</h2><p class="ox-hintline">${esc(D.words[q.id][1])} · starts with <b>${esc(baseWord(q.id)[0].toUpperCase())}</b> · ${baseWord(q.id).length} letters</p>
      <form class="ox-type" data-type><input autocomplete="off" autocapitalize="none" spellcheck="false" aria-label="Your answer" /><button class="ox-primary" type="submit">Check</button></form>`;
    let opts = "";
    if (q.opts) opts = `<div class="ox-opts">${q.opts.map((o, i) => `<button class="ox-opt" data-opt="${o}"><kbd>${i + 1}</kbd><span${q.show === "bn" ? ' lang="bn"' : ""}>${esc(q.key(o))}</span></button>`).join("")}</div>`;
    html(`<div class="ox-session">
      <div class="ox-prog"><button class="ox-link" data-go="exit">&#8592; Exit</button><div class="ox-bar big"><i style="width:${prog}%"></i></div><span>${s.i + 1} / ${total}</span></div>
      ${s.opts.exam ? '<p class="ox-examtag">Weekly exam · no hints</p>' : s.combo >= 2 ? `<p class="ox-combo">${ic("flame")} ${s.combo} in a row!</p>` : ""}
      <div class="ox-q">${body}${opts}<div class="ox-fb" data-fb></div></div></div>`);
    const inp = $(".ox-type input"); if (inp) inp.focus();
    if (q.type === "listen") setTimeout(() => speak(baseWord(q.id)), 250);
  }
  function answer(q, ok, picked) {
    const s = session; if (s.locked) return; s.locked = true;
    const id = q.id, det = D.det[id], exam = s.opts.exam;
    s.answers.push({ id, ok });
    if (ok) { s.right.push(id); s.combo++; s.best = Math.max(s.best, s.combo); } else { s.wrong.push(id); s.combo = 0; }
    if (!exam) {
      const gain = ok ? 10 + Math.min(s.combo, 5) * 2 : 0; s.xp += gain; addXP(gain);
      const d = day(); d[3]++; if (ok) d[4]++;
      if (s.opts.rate && !ok) rateWord(id, false);   // a miss in practice brings the word back to review; right answers don't skip the schedule
      touch();
    }
    if (exam) { s.i++; setTimeout(quizView, 160); return; }
    $$("[data-opt]").forEach(b => {
      b.disabled = true;
      if (+b.dataset.opt === id) b.classList.add("right");
      else if (picked !== undefined && +b.dataset.opt === picked) b.classList.add("wrong");
    });
    const inp = $(".ox-type input"); if (inp) { inp.disabled = true; inp.classList.add(ok ? "right" : "wrong"); $(".ox-type button").hidden = true; }
    $("[data-fb]").innerHTML = `<div class="ox-fbbox ${ok ? "ok" : "no"}"><p class="t">${ok ? ["Correct!", "Nice one!", "Great!", "Perfect!"][s.i % 4] : "Not quite"}${ok && s.combo > 2 ? ` · ${ic("flame")} ${s.combo}` : ""}</p>
      <p><b>${esc(answerText(id))}</b> ${speakBtn(baseWord(id))} <span lang="bn">${esc(det[0])}</span></p><p class="ox-exline">${hl(det[2], id)}</p></div>
      <button class="ox-primary" data-next>${s.i === s.qs.length - 1 ? "See results" : "Next"} <small>(Enter)</small></button>`;
    const nb = $("[data-next]"); if (nb) nb.focus();
  }
  function quizDone() {
    const s = session, n = s.qs.length, r = s.right.length, o = s.opts;
    document.onkeydown = null;
    if (o.exam) return examDone();
    const pct = Math.round(r / n * 100), stars = pct >= 90 ? 3 : pct >= 70 ? 2 : pct >= 40 ? 1 : 0;
    if (pct >= 70) confetti(70);
    html(`<div class="ox-result"><div class="ox-emoji">${ic(stars === 3 ? "trophy" : stars === 2 ? "sparkles" : "thumb")}</div><h2>${r} / ${n} correct</h2>
      <div class="ox-stars" aria-label="${stars} of 3 stars">${[1, 2, 3].map(i => `<i class="${i <= stars ? "on" : ""}">&#9733;</i>`).join("")}</div>
      <p><b>+${s.xp} XP</b> · best streak ${s.best}</p>
      ${s.wrong.length ? `<h3 class="ox-sub">Words to look at again</h3><div class="ox-review">${[...new Set(s.wrong)].map(id => miniWord(id)).join("")}</div>` : '<p class="ox-perfect">Perfect round! Every answer was right.</p>'}
      <div class="ox-actions"><button class="ox-primary" data-go="again">Play again</button><button class="ox-ghost" data-go="home">Back to Today</button></div></div>`);
  }
  const miniWord = id => { const d = D.det[id]; return `<div class="ox-mw"><b>${esc(base(id))}</b> ${speakBtn(baseWord(id))}<span lang="bn">${esc(d[0])}</span><em>${hl(d[2], id)}</em></div>`; };

  /* ---------- Review ---------- */
  function viewReview() {
    const due = dueIds().sort((a, b) => P.w[a][0] - P.w[b][0]), learned = learnedIds().length;
    if (!learned) return html(`<div class="ox-empty"><div class="ox-emoji">${ic("sprout")}</div><h2>Nothing to review yet</h2><p>Learn your first words on the Today tab. They will show up here when it is time to review them.</p><button class="ox-primary" data-go="home">Go to Today</button></div>`);
    if (!due.length) {
      const next = Math.min(...learnedIds().map(id => P.w[id][1])), when = next <= today() + 1 ? "tomorrow" : fmtDay(next);
      return html(`<div class="ox-empty"><div class="ox-emoji">${ic("check")}</div><h2>All caught up!</h2><p>No words are due right now. Your next review is ${when}.</p><div class="ox-actions"><button class="ox-primary" data-go="practice">Play a practice round</button></div></div>`);
    }
    const batch = Math.min(due.length, 15);
    html(`<div class="ox-empty"><div class="ox-emoji">${ic("refresh")}</div><h2>${plural(due.length, "word")} to review</h2><p>See each word and tell me if you remember it. Words you forget come back sooner. We'll do ${batch} now.</p>
      <div class="ox-chiplist">${due.slice(0, batch).map(id => `<span>${esc(base(id))}</span>`).join("")}</div>
      <button class="ox-primary" data-go="doreview">Start review</button></div>`);
  }

  /* ---------- Practice ---------- */
  const MODES = [
    ["mix", "dice", "Mix it up", "All question types, 10 words", ["mean", "blank", "word", "listen", "spell"]],
    ["mean", "text", "Meaning match", "See the word, pick the Bangla meaning", ["mean"]],
    ["word", "translate", "Bangla to English", "See the meaning, pick the word", ["word"]],
    ["blank", "pen", "Fill the blank", "Finish a real-life sentence", ["blank"]],
    ["listen", "headphones", "Listen and choose", "Hear a word, pick it", ["listen"]],
    ["spell", "keyboard", "Spelling", "Type the word from its meaning", ["spell"]]];
  function practicePool() {
    const learned = learnedIds();
    const pool = learned.length >= 4 ? learned.sort((a, b) => P.w[a][0] - P.w[b][0] || P.w[a][5] - P.w[b][5]) : D.play.slice(0, 12);
    return { ids: pool, sample: learned.length < 4 };
  }
  function viewPractice() {
    const { sample } = practicePool();
    html(`<div class="ox-practice"><h2>Practice</h2><p class="ox-lead">${sample ? "Learn a few words first and your practice will use them. For now, here are some starter words." : "Ten quick questions from the words you've learned. Weaker words come up first."}</p>
      <div class="ox-modes">${MODES.map(m => `<button class="ox-mode" data-mode="${m[0]}"><i>${ic(m[1])}</i><b>${m[2]}</b><span>${m[3]}</span></button>`).join("")}</div></div>`);
  }
  function startPractice(modeKey) {
    const m = MODES.find(x => x[0] === modeKey), { ids, sample } = practicePool();
    const pick = shuffle(ids.slice(0, Math.max(10, Math.floor(ids.length / 2)))).slice(0, 10);
    session = null;
    startQuiz(pick, m[4].length > 1 ? shuffle(m[4]) : m[4], { rate: !sample, mode: modeKey });
  }

  /* ---------- Weekly exam ---------- */
  function examState() {
    const t = today(), wk = weekStart(t), done = P.ex.find(e => e.wk === wk), learned = learnedIds().length;
    if (done) return { done, text: `This week's exam: <b>${done.score} / ${done.total}</b>. The next one opens on Sunday, ${fmtDay(wk + 7)}.`, btn: "See result", locked: false };
    if (learned < EXAM_SIZE) return { locked: true, text: `Learn <b>${EXAM_SIZE - learned}</b> more ${EXAM_SIZE - learned === 1 ? "word" : "words"} to unlock your first weekly exam of ${EXAM_SIZE} words.`, btn: "" };
    return { ready: true, text: `Your weekly exam is ready: ${EXAM_SIZE} words from your recent learning. One scored try each week.`, btn: "Open exam" };
  }
  function examWords() {
    const wk = weekStart(today());
    if (P.xq && P.xq.wk === wk && P.xq.ids.length === EXAM_SIZE) return P.xq.ids;
    const t = today(), r = rng(hashStr(wk + ":" + (ACC.user || "guest")));
    const all = learnedIds(), recent = all.filter(id => P.w[id][4] >= t - 6), older = all.filter(id => P.w[id][4] < t - 6);
    const ids = shuffle(recent, r).concat(shuffle(older, r)).slice(0, EXAM_SIZE);
    P.xq = { wk, ids: shuffle(ids, r) }; saveLocal();
    return P.xq.ids;
  }
  function viewExam() {
    const st = examState(), t = today(), wk = weekStart(t);
    if (st.done) return examResultView(st.done, false);
    if (st.locked) {
      const learned = learnedIds().length, pct = Math.round(learned / EXAM_SIZE * 100);
      return html(`<div class="ox-empty"><div class="ox-emoji">${ic("lock")}</div><h2>Weekly exam</h2><p>${st.text}</p><div class="ox-bar big"><i style="width:${pct}%"></i></div><p class="ox-small">${learned} of ${EXAM_SIZE} words learned</p><button class="ox-primary" data-go="home">Learn words</button></div>`);
    }
    const ids = examWords();
    html(`<div class="ox-empty"><div class="ox-emoji">${ic("note")}</div><h2>Weekly exam</h2><p>${EXAM_SIZE} questions, one for each word. A mix of meanings, sentences and spelling. You won't see answers until the end, and you can score once per week. Pass mark: ${PASS} of ${EXAM_SIZE}.</p>
      <div class="ox-chiplist">${ids.map(id => `<span>${esc(base(id))}</span>`).join("")}</div>
      <p class="ox-small">These are your exam words. Have a look, then start when you're ready.</p>
      <button class="ox-primary" data-go="startexam">Start the exam</button></div>`);
  }
  function startExam(scored = true) {
    const ids = examWords(), types = shuffle(["mean", "word", "blank", "spell", "mean", "word", "blank", "spell", "mean", "word", "blank", "spell", "mean", "word", "blank", "spell", "listen", "listen", "mean", "spell"]);
    startQuiz(ids, types, { exam: true, scored });
  }
  function examDone() {
    const s = session, score = s.right.length, scored = s.opts.scored !== false;
    let rec = null;
    if (scored) {
      const wk = weekStart(today());
      s.answers.forEach(a => rateWord(a.id, a.ok));
      const bonus = score * 5 + (score >= PASS ? 50 : 0) + (score === EXAM_SIZE ? 50 : 0);
      addXP(bonus);
      rec = { wk, date: dstr(), score, total: s.qs.length, miss: [...new Set(s.wrong)], xp: bonus };
      P.ex.push(rec); day()[3] += s.qs.length; day()[4] += score; touch();
    } else rec = { wk: weekStart(today()), date: dstr(), score, total: s.qs.length, miss: [...new Set(s.wrong)], xp: 0 };
    if (score >= PASS) confetti(120);
    examResultView(rec, true, scored);
  }
  function examResultView(r, fresh, scored = true) {
    const pct = Math.round(r.score / r.total * 100), pass = r.score >= PASS;
    const grade = pct === 100 ? "Perfect score!" : pct >= 90 ? "Excellent!" : pass ? "Well done, you passed!" : "Keep going, you'll get there!";
    html(`<div class="ox-result exam"><div class="ox-emoji">${ic(pct >= 90 ? "trophy" : pass ? "sparkles" : "thumb")}</div><h2>${r.score} / ${r.total}</h2><p class="ox-grade ${pass ? "pass" : "fail"}">${grade}</p>
      <div class="ox-bar big"><i style="width:${pct}%"></i></div>
      <p>${scored ? "Weekly exam" : "Practice exam"} · ${fmtDay(dnum(r.date))}${r.xp ? ` · <b>+${r.xp} XP</b>` : ""}</p>
      ${r.miss.length ? `<h3 class="ox-sub">Words to study (${r.miss.length})</h3><div class="ox-review">${r.miss.map(miniWord).join("")}</div><p class="ox-small">${scored ? "These words will come back in your daily reviews." : ""}</p>` : '<p class="ox-perfect">You got every word right. Fantastic memory!</p>'}
      <div class="ox-actions">${r.miss.length ? '<button class="ox-primary" data-go="studymiss">Study the missed words</button>' : ""}<button class="ox-ghost" data-go="practiceexam">Try a practice exam (not scored)</button><button class="ox-ghost" data-go="home">Back to Today</button></div>
      <p class="ox-small">Next weekly exam: Sunday, ${fmtDay(r.wk + 7)}.</p></div>`);
    session = { type: "view", missed: r.miss };
  }

  /* ---------- Progress ---------- */
  const BADGES = [
    ["first", "sprout", "First word", () => learnedIds().length >= 1], ["w10", "book", "10 words", () => learnedIds().length >= 10],
    ["w50", "book", "50 words", () => learnedIds().length >= 50], ["w100", "book", "100 words", () => learnedIds().length >= 100],
    ["w300", "book", "300 words", () => learnedIds().length >= 300], ["s3", "flame", "3-day streak", () => bestStreak() >= 3],
    ["s7", "zap", "7-day streak", () => bestStreak() >= 7], ["s30", "rocket", "30-day streak", () => bestStreak() >= 30],
    ["ex", "note", "First exam", () => P.ex.length >= 1], ["ex90", "trophy", "Exam 90%+", () => P.ex.some(e => e.score / e.total >= .9)],
    ["q100", "target", "100 right answers", () => Object.keys(P.d).reduce((s, k) => s + (P.d[k][4] || 0), 0) >= 100], ["m10", "gem", "10 mastered", () => mastered() >= 10]];
  function bestStreak() {
    const keys = Object.keys(P.d).filter(k => P.d[k][0] + P.d[k][1] + P.d[k][3] > 0).map(dnum).sort((a, b) => a - b);
    let best = 0, run = 0, prev = -9;
    keys.forEach(k => { run = k === prev + 1 ? run + 1 : 1; prev = k; best = Math.max(best, run); });
    return best;
  }
  function viewProgress() {
    const learned = learnedIds(), L = levelInfo(), t = today();
    const per = ["A1", "A2", "B1", "B2"].map(l => ({ l, total: D.words.filter(w => w[2] === l).length, avail: D.play.filter(id => lvlOf(id) === l).length, got: learned.filter(id => lvlOf(id) === l).length }));
    const cells = [];
    for (let i = 34; i >= 0; i--) { const r = P.d[dayStr(t - i)], n = r ? r[0] + r[1] + r[3] : 0; cells.push(`<i class="h${n === 0 ? 0 : n < 8 ? 1 : n < 20 ? 2 : 3}" title="${fmtDay(t - i)}: ${n} activities"></i>`); }
    const hard = learned.filter(id => P.w[id][2] - P.w[id][3] >= 2).sort((a, b) => (P.w[b][2] - P.w[b][3]) - (P.w[a][2] - P.w[a][3])).slice(0, 6);
    html(`<div class="ox-progress">
      <div class="ox-stats">
        <div><b>${learned.length}</b><span>words learned</span></div><div><b>${mastered()}</b><span>mastered</span></div>
        <div><b>${streak()}</b><span>day streak</span></div><div><b>${xpTotal()}</b><span>XP · level ${L.n + 1}</span></div></div>
      <h3 class="ox-sub">Your course</h3>
      <div class="ox-levels">${per.map(p => `<div class="ox-lv"><div><b>${p.l}</b><span>${p.got} / ${p.avail || 0} words</span></div><div class="ox-bar"><i style="width:${p.avail ? Math.round(p.got / p.avail * 100) : 0}%"></i></div></div>`).join("")}</div>
      <p class="ox-small">Every word in the Oxford 3000&#8482; has a full lesson.</p>
      <h3 class="ox-sub">Last 5 weeks</h3><div class="ox-heat">${cells.join("")}</div>
      <h3 class="ox-sub">Exam history</h3>${P.ex.length ? `<div class="ox-hist">${P.ex.slice(-8).map(e => `<div><span>${fmtDay(dnum(e.date))}</span><div class="ox-bar"><i style="width:${Math.round(e.score / e.total * 100)}%"></i></div><b>${e.score}/${e.total}</b></div>`).join("")}</div>` : '<p class="ox-small">No exams yet. Learn 20 words to unlock your first.</p>'}
      ${hard.length ? `<h3 class="ox-sub">Tricky words</h3><div class="ox-review">${hard.map(miniWord).join("")}</div>` : ""}
      <h3 class="ox-sub">Badges</h3><div class="ox-badges">${BADGES.map(b => `<div class="${b[3]() ? "on" : ""}"><i>${ic(b[1])}</i><span>${b[2]}</span></div>`).join("")}</div></div>`);
  }

  /* ---------- Confetti ---------- */
  function confetti(n) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const c = document.createElement("canvas"); c.className = "ox-confetti"; c.width = innerWidth; c.height = innerHeight; document.body.appendChild(c);
    const g = c.getContext("2d"), cols = ["#8f7eff", "#6b4aff", "#ff9ec1", "#7cc4ff", "#ffd34d", "#79d68f"];
    const ps = Array.from({ length: n }, () => ({ x: c.width / 2 + (Math.random() - .5) * 200, y: c.height * .35, vx: (Math.random() - .5) * 12, vy: -Math.random() * 11 - 3, s: 5 + Math.random() * 6, r: Math.random() * 6, c: cols[Math.floor(Math.random() * cols.length)] }));
    let f = 0;
    (function tick() {
      g.clearRect(0, 0, c.width, c.height);
      ps.forEach(p => { p.vy += .35; p.x += p.vx; p.y += p.vy; p.r += .2; g.fillStyle = p.c; g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * .6); g.restore(); });
      if (++f < 110) requestAnimationFrame(tick); else c.remove();
    })();
  }

  /* ---------- Events ---------- */
  stage.addEventListener("click", e => {
    const say = e.target.closest("[data-say]");
    if (say) { e.stopPropagation(); speak(say.dataset.say); return; }
    if (e.target.closest("[data-flipbtn]") || (e.target.closest("#oxCard") && session && session.type === "cards")) return flipCard();
    if (e.target.closest("[data-rate-yes]")) return rateCard(true);
    if (e.target.closest("[data-rate-no]")) return rateCard(false);
    const opt = e.target.closest("[data-opt]");
    if (opt && session && session.type === "quiz") { const q = session.qs[session.i], id = +opt.dataset.opt; return answer(q, id === q.id, id); }
    if (e.target.closest("[data-next]")) { session.i++; return quizView(); }
    const mode = e.target.closest("[data-mode]");
    if (mode) return startPractice(mode.dataset.mode);
    const go = e.target.closest("[data-go]");
    if (!go) return;
    const g = go.dataset.go, s = session;
    if (g === "learn") startCards(newToLearn(), "learn");
    else if (g === "more") { const more = D.play.filter(id => !P.w[id] && !P.t.ids.includes(id)).slice(0, 5); P.t.ids = P.t.ids.concat(more); saveLocal(); startCards(more, "learn"); }
    else if (g === "review") setTab("review");
    else if (g === "doreview") startCards(dueIds().sort((a, b) => P.w[a][0] - P.w[b][0]).slice(0, 15), "review");
    else if (g === "exam") setTab("exam");
    else if (g === "startexam") startExam(true);
    else if (g === "practiceexam") startExam(false);
    else if (g === "studymiss") startCards((s && s.missed) || [], "review");
    else if (g === "quizlearned") startQuiz(shuffle(s.finished), ["mean", "blank", "word", "spell"], { rate: false });
    else if (g === "again") startPractice(s.opts.mode || "mix");
    else if (g === "home") setTab("today");
    else if (g === "practice") setTab("practice");
    else if (g === "exit") { if (!s || s.type === "view" || confirmExit(s)) render(); }
  });
  function confirmExit(s) { return s.type === "quiz" && s.opts.exam ? confirm("Leave the exam? Your answers so far will be lost.") : true; }
  stage.addEventListener("submit", e => {
    const f = e.target.closest("[data-type]"); if (!f) return;
    e.preventDefault();
    const q = session.qs[session.i], v = f.querySelector("input").value;
    if (!v.trim()) return;
    answer(q, checkTyped(q.id, v));
  });
  $(".ox-tabs").addEventListener("click", e => { const b = e.target.closest("[data-tab]"); if (b) { if (session && session.type !== "view" && !confirmExit(session)) return; setTab(b.dataset.tab); } });

  /* ---------- Account dialog ---------- */
  const dlg = $("#oxAcct") || document.getElementById("oxAcct"), form = document.getElementById("oxAcctForm"), signed = document.getElementById("oxSigned");
  let mode = "register", codeSent = "";
  function dlgView() {
    const on = !!ACC.user;
    form.hidden = on; signed.hidden = !on;
    if (on) { signed.querySelector("[data-name]").textContent = ACC.user; chrome(); }
    else setMode(mode);
  }
  function setMode(m) {
    mode = m;
    form.querySelectorAll("[data-mode]").forEach(b => b.setAttribute("aria-selected", b.dataset.mode === m));
    form.querySelector("[data-go]").textContent = m === "register" ? "Sign up" : "Sign in";
    form.querySelector("[data-note]").hidden = m !== "register";
    form.pass.autocomplete = m === "register" ? "new-password" : "current-password";
    form.querySelector("[data-err]").textContent = "";
    form.querySelector("[data-emailrow]").hidden = m !== "register";
    form.email.required = m === "register";
    form.querySelector("[data-coderow]").hidden = m !== "register" || !codeSent;
    form.code.required = m === "register";
    eyeSet(false);
    if (m === "register") checkName(); else { hint("", ""); suggest([]); }
  }
  /* Live username check and suggestions while signing up */
  const hintEl = form.querySelector("[data-userhint]"), suggEl = form.querySelector("[data-sugg]");
  let chkTimer = null, chkSeq = 0;
  function hint(text, kind) { hintEl.hidden = !text; hintEl.textContent = text; hintEl.dataset.kind = kind || ""; }
  function suggest(list) {
    suggEl.querySelectorAll("button").forEach(b => b.remove());
    suggEl.hidden = !list.length;
    list.forEach(n => { const b = document.createElement("button"); b.type = "button"; b.dataset.pick = n; b.textContent = n; suggEl.appendChild(b); });
  }
  function checkName() {
    clearTimeout(chkTimer);
    if (mode !== "register") return;
    const user = form.user.value.trim(), email = form.email.value.trim();
    if (!user && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { hint("", ""); suggest([]); return; }
    if (user && !/^[A-Za-z0-9_]{3,20}$/.test(user)) { hint("Use 3 to 20 letters, numbers or _", "bad"); }
    else if (user) hint("Checking…", "wait");
    chkTimer = setTimeout(async () => {
      const seq = ++chkSeq;
      try {
        const r = await post({ action: "ox_check", user, email });
        if (seq !== chkSeq || !r.ok) return;
        if (!user) hint("Pick a username, or tap one below.", "");
        else if (!r.valid) hint("Use 3 to 20 letters, numbers or _", "bad");
        else if (r.available) hint("✓ " + user + " is available", "ok");
        else hint("✗ " + user + " is already taken. Try one of these:", "bad");
        suggest(r.suggestions || []);
      } catch (x) { if (seq === chkSeq) { hint("", ""); suggest([]); } }
    }, 400);
  }
  /* Show / hide password */
  const eyeBtn = form.querySelector("[data-eye]");
  function eyeSet(on) {
    form.pass.type = on ? "text" : "password";
    eyeBtn.innerHTML = ic(on ? "eyeoff" : "eye");
    eyeBtn.setAttribute("aria-pressed", on); eyeBtn.setAttribute("aria-label", on ? "Hide password" : "Show password");
  }
  eyeBtn.addEventListener("click", () => eyeSet(form.pass.type === "password"));
  /* Email verification code */
  const sendBtn = form.querySelector("[data-sendcode]"), codeRow = form.querySelector("[data-coderow]"), codeHint = form.querySelector("[data-codehint]");
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  let cool = 0, coolTimer = null;
  function coolDown(n) {
    cool = n; clearInterval(coolTimer);
    const tick = () => { sendBtn.disabled = cool > 0; sendBtn.textContent = cool > 0 ? "Resend in " + cool + "s" : (codeSent ? "Resend code" : "Send code"); if (cool-- <= 0) clearInterval(coolTimer); };
    tick(); coolTimer = setInterval(tick, 1000);
  }
  sendBtn.addEventListener("click", async () => {
    const email = form.email.value.trim(), err = form.querySelector("[data-err]");
    err.textContent = "";
    if (!EMAIL_RE.test(email)) { err.textContent = "Enter a valid email first"; form.email.focus(); return; }
    sendBtn.disabled = true; sendBtn.textContent = "Sending…";
    try {
      const r = await post({ action: "ox_sendcode", email });
      if (r.ok) { codeSent = email; codeRow.hidden = false; codeHint.dataset.kind = "ok"; codeHint.textContent = "We sent a code to " + email + ". Check spam too. It works for 10 minutes."; form.code.focus(); coolDown(30); }
      else { err.textContent = /Unknown action/.test(r.error || "") ? "Email verification is not switched on yet." : (r.error || "Could not send the code"); coolDown(0); }
    } catch (x) { err.textContent = "Can't reach the server right now."; coolDown(0); }
  });
  form.email.addEventListener("input", () => {
    if (codeSent && form.email.value.trim().toLowerCase() !== codeSent.toLowerCase()) { codeSent = ""; form.code.value = ""; codeRow.hidden = true; coolDown(0); }
  });
  form.code.addEventListener("input", () => { form.code.value = form.code.value.replace(/\D/g, "").slice(0, 6); });
  form.user.addEventListener("input", checkName);
  form.email.addEventListener("input", () => { if (!form.user.value.trim() || suggEl.querySelector("button")) checkName(); });
  suggEl.addEventListener("click", e => { const b = e.target.closest("[data-pick]"); if (b) { form.user.value = b.dataset.pick; checkName(); form.email.focus(); } });
  document.addEventListener("click", e => {
    if (e.target.closest("[data-act=account]")) { dlgView(); if (dlg.showModal) dlg.showModal(); }
    const seg = e.target.closest("#oxAcctForm [data-mode]"); if (seg) setMode(seg.dataset.mode);
    if (e.target.closest("#oxSigned [data-close]")) dlg.close();
    if (e.target.closest("#oxSigned [data-now]")) { sync(); }
    if (e.target.closest("#oxSigned [data-logout]")) { ACC = { user: "", token: "", state: "local" }; saveLocal(); dlg.close(); chrome(); }
  });
  form.addEventListener("submit", async e => {
    if (e.submitter && e.submitter.value === "close") return;
    e.preventDefault();
    const err = form.querySelector("[data-err]"), go = form.querySelector("[data-go]");
    err.textContent = ""; go.disabled = true; go.textContent = "Please wait…";
    try {
      const r = await post({ action: mode === "register" ? "ox_register" : "ox_login", user: form.user.value.trim(), email: form.email.value.trim(), code: form.code.value.trim(), pass: form.pass.value });
      if (r.ok) { form.pass.value = ""; adopt(r); dlg.close(); }
      else { if (r.suggestions) { suggest(r.suggestions); hint("✗ That username is taken. Try one of these:", "bad"); }
        err.textContent = /Unknown action/.test(r.error || "") ? "Accounts are not switched on yet. Your progress is saved on this device." : (r.error || "Something went wrong"); }
    } catch (x) { err.textContent = "Can't reach the server right now. Your progress is still saved on this device."; }
    go.disabled = false; go.textContent = mode === "register" ? "Sign up" : "Sign in";
  });
  dlg.addEventListener("click", e => { if (e.target === dlg) dlg.close(); });

  /* ---------- Start ---------- */
  async function init() {
    loadLocal();
    try {
      const m = await (await fetch(BASE + "words.json")).json();
      D.words = m.w;
      const parts = await Promise.all(m.chunks.map(c => fetch(BASE + c).then(r => r.json())));
      parts.forEach(p => Object.assign(D.det, p));
      const order = { A1: 0, A2: 1, B1: 2, B2: 3 };
      D.play = Object.keys(D.det).map(Number).sort((a, b) => order[lvlOf(a)] - order[lvlOf(b)] || a - b);
    } catch (e) {
      stage.innerHTML = '<p class="ox-loading">Could not load the words. Please check your connection and reload.</p>'; return;
    }
    root.dataset.ready = "true";
    if (ACC.token) post({ action: "ox_load", token: ACC.token }).then(r => {
      if (r.ok) { try { const rem = r.data ? JSON.parse(r.data) : null; if (rem && rem.v === 1) { P = merge(P, rem); touch(); render(); } } catch (e) {} ACC.state = "saved"; chrome(); }
      else if (/sign in again/i.test(r.error || "")) { ACC.state = "error"; ACC.expired = true; chrome(); }
    }).catch(() => {});
    render();
  }
  init();
  window.__ox = { get P() { return P; }, D, get ACC() { return ACC; }, setTab, today, dueIds };   // handy for debugging
})();
