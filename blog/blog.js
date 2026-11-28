(function () {
  var root = document.documentElement;
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

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

  // Submenus (About, Apps): click or keyboard opens one (hover does too on desktop, in CSS)
  document.querySelectorAll(".sub-toggle").forEach(function (toggle, _, all) {
    var item = toggle.closest(".has-sub");
    function set(open) {
      item.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", open);
    }
    toggle.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = !item.classList.contains("open");
      all.forEach(function (t) { if (t !== toggle) t.closest(".has-sub").classList.remove("open"), t.setAttribute("aria-expanded", false); });
      set(open);
    });
    document.addEventListener("click", function (e) { if (!item.contains(e.target)) set(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") set(false); });
  });

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

  // Blog home: topic filter + search over one grid. The featured block shows only for "All" with no search.
  var filters = document.querySelectorAll("#postFilters button");
  var grid = document.getElementById("postGrid");
  if (filters.length && grid) {
    var cards = Array.prototype.slice.call(grid.querySelectorAll(".post-card"));
    var feat = document.getElementById("blFeat"), count = document.getElementById("blCount"), empty = document.getElementById("blEmpty");
    var box = document.getElementById("blSearch");
    var cat = "all", q = "", opened = false, KEEP = 8, moreBtn = null;
    var names = {};
    filters.forEach(function (f) { names[f.dataset.c] = f.firstChild.textContent; });
    function apply() {
      var browsing = cat === "all" && !q, shown = 0;
      if (feat) feat.hidden = !browsing;
      cards.forEach(function (card) {
        var ok = (cat === "all" || card.dataset.cat === cat) && (!q || card.dataset.q.indexOf(q) > -1) && !(browsing && card.hasAttribute("data-feat"));
        card.hidden = !ok;
        card.classList.remove("m-extra");
        if (ok) { shown++; if (browsing && !opened && shown > KEEP) card.classList.add("m-extra"); }
      });
      var over = browsing && !opened && shown > KEEP;
      if (moreBtn) { moreBtn.hidden = !over; moreBtn.textContent = "Show " + (shown - KEEP) + " more posts"; }
      empty.hidden = shown > 0;
      count.textContent = q ? shown + (shown === 1 ? " result for “" : " results for “") + box.value.trim() + "”"
        : cat === "all" ? "Latest articles" : names[cat] + " · " + shown + (shown === 1 ? " article" : " articles");
    }
    filters.forEach(function (button) {
      button.addEventListener("click", function () {
        cat = button.dataset.c;
        filters.forEach(function (f) { f.setAttribute("aria-pressed", f === button); });
        apply();
      });
    });
    if (box) box.addEventListener("input", function () { q = box.value.trim().toLowerCase(); apply(); });
    moreBtn = document.createElement("button");
    moreBtn.type = "button"; moreBtn.className = "btn-more";
    moreBtn.addEventListener("click", function () { opened = true; apply(); });
    grid.insertAdjacentElement("afterend", moreBtn);
    apply();
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

/* App pages (/apps/<repo>/): the app's own page sits under this site's menu.
   Its own top bar is hidden, links that leave the app open at the top level,
   and the title and address follow the page shown inside. */
(function () {
  var frame = document.querySelector(".app-frame iframe");
  if (!frame) return;
  var base = frame.getAttribute("data-app");          // "/<repo>/"
  var wrapper = location.pathname;                     // "/apps/<repo>/"
  var top = document.querySelector("header.top");

  // Fill the screen below the site header
  function fit() { document.documentElement.style.setProperty("--top-h", Math.round(top.getBoundingClientRect().bottom) + "px"); }
  fit();
  addEventListener("resize", fit);

  // Open the sub page asked for in ?p= (e.g. /apps/taka-releases/?p=privacy.html)
  var q = new URLSearchParams(location.search);
  var sub = (q.get("p") || "").replace(/^\/+/, "");
  if (sub && !/^[a-z]+:|\.\./i.test(sub)) frame.src = base + sub + location.hash;
  else if (location.hash) frame.src = base + location.hash;

  function inApp(u) { return u.origin === location.origin && u.pathname.indexOf(base) === 0; }

  // The frame stays invisible until the page inside has lost its own top bar,
  // so that bar never flashes on screen
  var box = frame.parentNode, watching = null;
  function reveal() { box.classList.add("ready"); }
  function hideBars(w, d) {
    var hid = false;
    Array.prototype.slice.call(d.body.children, 0, 6).forEach(function (el) {
      if (!/^(NAV|HEADER)$/.test(el.tagName)) return;
      if (el.getAttribute("data-site-hidden")) { hid = true; return; }
      var pos = w.getComputedStyle(el).position;
      if (pos === "sticky" || pos === "fixed") {
        el.style.setProperty("display", "none", "important");
        el.setAttribute("data-site-hidden", "1");
        hid = true;
      }
    });
    return hid;
  }
  function current() {
    try { return { w: frame.contentWindow, d: frame.contentDocument }; } catch (e) { return null; }
  }
  function watch(prev) {
    clearInterval(watching);
    box.classList.remove("ready");
    var t0 = Date.now();
    watching = setInterval(function () {
      var c = current();
      if (!c) { clearInterval(watching); reveal(); return; }
      var d = c.d;
      if (!d || d === prev || !d.body || d.URL === "about:blank") { if (Date.now() - t0 > 5000) reveal(); return; }
      if (hideBars(c.w, d) || d.readyState === "complete" || Date.now() - t0 > 3000) reveal();
      if (d.readyState === "complete") { clearInterval(watching); setup(c.w, d); }
    }, 25);
  }
  watch(null);
  frame.addEventListener("load", function () {
    var c = current();
    if (c && c.d && c.d.body) { hideBars(c.w, c.d); setup(c.w, c.d); }
    reveal();
  });

  function setup(w, d) {
    if (d.__siteReady) return;
    d.__siteReady = true;

    // The app page went somewhere outside the app: follow it at the top level
    if (!inApp(new URL(w.location.href))) { location.href = w.location.href; return; }

    var css = d.createElement("style");
    css.textContent = ".skip,.skip-link{display:none!important}html{scroll-padding-top:16px!important}";
    d.head.appendChild(css);
    hideBars(w, d);
    if (window.__ptrAttach) window.__ptrAttach(d, w);   // pull to refresh inside the app page

    // The next page opened inside starts hidden again until its top bar is gone
    w.addEventListener("pagehide", function () { watch(d); });

    // Title and address follow the page inside
    if (d.title) document.title = d.title;
    var u = new URL(w.location.href);
    var rest = u.pathname.slice(base.length);
    history.replaceState(null, "", wrapper + (rest ? "?p=" + encodeURIComponent(rest).replace(/%2F/g, "/") : "") + u.hash);

    // Links that leave the app open at the top level (this site) or in a new tab (other sites)
    d.addEventListener("click", function (e) {
      // A click in the app closes any open site menu
      document.dispatchEvent(new MouseEvent("click"));
      var links = document.getElementById("links"), menu = document.querySelector(".menu");
      if (links && links.classList.contains("open") && menu) menu.click();
      var a = e.target.closest && e.target.closest("a[href]");
      if (!a || e.defaultPrevented || e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey) return;
      var href = a.getAttribute("href");
      if (!href || href.charAt(0) === "#" || /^(javascript|mailto|tel):/i.test(href)) return;
      var t = new URL(a.href, d.baseURI);
      if (inApp(t) && a.target !== "_blank") return;
      e.preventDefault();
      if (t.origin === location.origin) location.href = t.href;
      else if (a.hasAttribute("download") || /\/releases\/(latest\/)?download\/|\.(apk|aab|zip|exe|dmg)$/i.test(t.pathname)) location.href = t.href;
      else window.open(t.href, "_blank", "noopener");
    });

    // Keep the address in step with in-page anchors
    w.addEventListener("hashchange", function () {
      history.replaceState(null, "", location.pathname + location.search + w.location.hash);
    });
  }
})();

/* Back to top button */
(function () {
  if (document.querySelector(".to-top") || document.querySelector(".app-frame")) return;
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
