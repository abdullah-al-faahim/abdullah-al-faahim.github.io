(function () {
  var root = document.documentElement;
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  // Theme toggle, shared with the home page through localStorage "theme"
  var toggle = document.querySelector(".theme");
  function label() {
    var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    toggle.setAttribute("aria-label", "Switch to " + next + " theme");
  }
  if (toggle) {
    label();
    toggle.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) {}
      label();
    });
  }

  // Mobile menu
  var menu = document.querySelector(".menu");
  var links = document.getElementById("links");
  if (menu && links) {
    var setMenu = function (open) {
      links.classList.toggle("open", open);
      menu.setAttribute("aria-expanded", open);
      menu.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    };
    menu.addEventListener("click", function () { setMenu(!links.classList.contains("open")); });
    links.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
  }

  // Header shadow, reading progress and the active heading in the contents list
  var top = document.querySelector(".top");
  var bar = document.querySelector(".read-bar i");
  var prose = document.querySelector(".prose");
  var tocLinks = Array.prototype.slice.call(document.querySelectorAll(".post-toc a"));
  var heads = tocLinks.map(function (a) { return document.getElementById(a.getAttribute("href").slice(1)); });
  function onScroll() {
    if (top) top.classList.toggle("scrolled", window.scrollY > 8);
    if (bar && prose) {
      var r = prose.getBoundingClientRect();
      var total = r.height - window.innerHeight * 0.6;
      var done = Math.min(1, Math.max(0, (-r.top + window.innerHeight * 0.2) / Math.max(total, 1)));
      bar.style.width = (done * 100).toFixed(1) + "%";
    }
    if (heads.length) {
      var current = 0;
      heads.forEach(function (h, i) { if (h && h.getBoundingClientRect().top < 140) current = i; });
      tocLinks.forEach(function (a, i) { a.classList.toggle("on", i === current); });
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Copy link
  document.querySelectorAll(".copy-link").forEach(function (b) {
    b.addEventListener("click", function () {
      var url = b.dataset.url;
      var done = function () { b.textContent = "Link copied"; setTimeout(function () { b.textContent = "Copy link"; }, 2000); };
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, function () { window.prompt("Copy this link", url); });
      else window.prompt("Copy this link", url);
    });
  });

  // Topic filters on the blog home
  var filters = document.querySelectorAll("#postFilters button");
  if (filters.length) {
    var cards = document.querySelectorAll(".blog-list .post-card");
    filters.forEach(function (button) {
      button.addEventListener("click", function () {
        var c = button.dataset.c;
        filters.forEach(function (f) { f.setAttribute("aria-pressed", f === button); });
        cards.forEach(function (card) { card.hidden = c !== "all" && card.dataset.cat !== c; });
      });
    });
  }
})();

// Readers count from GoatCounter (fahim.goatcounter.com), filled in after the page settles.
// Hidden until a number arrives, so nothing shows if the counter is off or unreachable.
(function () {
  var els = document.querySelectorAll("[data-reads]");
  if (!els.length || !window.fetch) return;
  function put(path, n) {
    document.querySelectorAll('[data-reads="' + path + '"]').forEach(function (el) {
      el.textContent = " · " + n + (n === "1" ? " reader" : " readers");
      el.hidden = false;
    });
  }
  function load() {
    var seen = {};
    els.forEach(function (el) {
      var path = el.getAttribute("data-reads");
      if (seen[path]) return;
      seen[path] = true;
      var key = "reads2:" + path, hit = null;
      try { hit = JSON.parse(sessionStorage.getItem(key) || "null"); } catch (e) {}
      if (hit && Date.now() - hit.t < 600000) return hit.n && put(path, hit.n);
      // "start" = the day counting began: it also skips a stale cached 0 that the plain URL kept serving
      fetch("https://fahim.goatcounter.com/counter/" + encodeURIComponent(path) + ".json?start=2026-11-09")
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) {
          var n = d && String(d.count || "").trim();
          if (n && n !== "0") put(path, n);
          try { sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), n: n || "" })); } catch (e) {}
        })
        .catch(function () {});
    });
  }
  var idle = window.requestIdleCallback || function (f) { setTimeout(f, 800); };
  if (document.readyState === "complete") idle(load); else addEventListener("load", function () { idle(load); });
})();

/* Back to top button */
(function () {
  if (document.querySelector(".to-top")) return;
  var b = document.createElement("button");
  b.type = "button";
  b.className = "to-top";
  b.setAttribute("aria-label", "Back to top");
  b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7" /></svg>';
  document.body.appendChild(b);
  var calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  b.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: calm ? "auto" : "smooth" });
    // Move keyboard focus to the top of the page without showing the hidden "Skip to content" link
    var m = document.querySelector("header") || document.body;
    if (!m.hasAttribute("tabindex")) m.setAttribute("tabindex", "-1");
    m.style.outline = "none";
    m.focus({ preventScroll: true });
  });
  var on = false;
  function check() {
    var s = window.scrollY > window.innerHeight * 1.5;
    if (s !== on) { on = s; b.classList.toggle("show", s); }
  }
  addEventListener("scroll", check, { passive: true });
  check();
})();
