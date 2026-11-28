(function () {
  var root = document.documentElement;
  var now = new Date();

  document.querySelectorAll("[data-years]").forEach(function (el) {
    el.textContent = now.getFullYear() - 2018;
  });
  document.getElementById("year").textContent = now.getFullYear();

  // Mobile menu
  var menu = document.querySelector(".menu");
  var links = document.getElementById("links");
  function setMenu(open) {
    links.classList.toggle("open", open);
    menu.setAttribute("aria-expanded", open);
    menu.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
  menu.addEventListener("click", function () { setMenu(!links.classList.contains("open")); });
  links.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });

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
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") { set(false); } });
    item.querySelectorAll(".sub a").forEach(function (a) {
      a.addEventListener("click", function () { set(false); a.blur(); });
    });
  });

  // Header shadow once scrolled
  var top = document.querySelector(".top");
  function onScroll() { top.classList.toggle("scrolled", window.scrollY > 8); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Work grid: filters and "show more"
  var FIRST = window.matchMedia("(max-width: 720px)").matches ? 6 : 12;
  var cards = Array.prototype.slice.call(document.querySelectorAll("#grid .card"));
  var filters = document.querySelectorAll("#filters button");
  var more = document.getElementById("more");
  var expanded = false;
  var current = "all";

  function apply() {
    var shown = 0;
    cards.forEach(function (card) {
      var match = current === "all" || card.dataset.c === current;
      var visible = match && (expanded || current !== "all" || shown < FIRST);
      card.hidden = !visible;
      if (visible) { shown++; card.classList.add("in"); }
    });
    more.hidden = expanded || current !== "all";
  }
  filters.forEach(function (button) {
    button.addEventListener("click", function () {
      current = button.dataset.c;
      filters.forEach(function (b) { b.setAttribute("aria-pressed", b === button); });
      apply();
    });
  });
  more.addEventListener("click", function () {
    expanded = true;
    apply();
    var next = cards[FIRST];
    if (next) next.focus();
  });
  apply();

  // Lightbox
  var lb = document.getElementById("lb");
  var lbImg = document.getElementById("lbImg");
  var lbTitle = document.getElementById("lbTitle");
  var lbCat = document.getElementById("lbCat");
  var lbLink = document.getElementById("lbLink");
  var index = 0;
  var opener = null;

  function visibleCards() { return cards.filter(function (c) { return !c.hidden; }); }
  function show(card) {
    var list = visibleCards();
    index = list.indexOf(card);
    lbImg.src = card.dataset.full;
    lbImg.alt = card.dataset.title;
    lbTitle.textContent = card.dataset.title;
    lbCat.textContent = card.dataset.cat + " · " + card.dataset.src;
    lbLink.href = card.dataset.url;
    lbLink.lastChild.textContent = "View on " + card.dataset.src;
  }
  function step(d) {
    var list = visibleCards();
    show(list[(index + d + list.length) % list.length]);
  }
  cards.forEach(function (card) {
    card.addEventListener("click", function () {
      opener = card;
      show(card);
      if (typeof lb.showModal === "function") lb.showModal();
      else window.open(card.dataset.url, "_blank", "noopener");
    });
  });
  document.getElementById("lbClose").addEventListener("click", function () { lb.close(); });
  document.getElementById("lbPrev").addEventListener("click", function () { step(-1); });
  document.getElementById("lbNext").addEventListener("click", function () { step(1); });
  lb.addEventListener("click", function (e) { if (e.target === lb) lb.close(); });
  lb.addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
  });
  lb.addEventListener("close", function () { if (opener) opener.focus(); });

  // Swipe between projects on touch screens
  var x0 = null;
  lb.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
    x0 = null;
  });

  // Apps whose page isn't published yet: switch the card to it as soon as the address answers
  document.querySelectorAll(".app[data-live]").forEach(function (card) {
    if (!window.fetch) return;
    var url = card.dataset.live;
    fetch(url, { method: "HEAD", cache: "no-store" }).then(function (r) {
      if (!r.ok) return;
      var btns = card.querySelectorAll(".acts .btn");
      var primary = btns[0], secondary = btns[1];
      var arrow = primary.querySelector("svg");
      // The page is live: open it under the site menu at /apps/<repo>/
      url = card.dataset.open || url;
      primary.href = url;
      primary.textContent = "Open app page ";
      if (arrow) primary.appendChild(arrow);
      if (secondary) { secondary.href = card.dataset.apk; secondary.textContent = "Download APK"; }
      card.querySelector(".url").textContent = location.host + url;
    }).catch(function () {});
  });

  // Viewer dialog: app live pages open in a frame; Behance and Dribbble open a
  // profile preview (those sites refuse to be framed, so the preview is built from my own work)
  (function () {
    var box = document.getElementById("viewBox");
    if (!box || typeof box.showModal !== "function") return;
    var frame = document.getElementById("vbFrame");
    var title = document.getElementById("vbTitle");
    var sub = document.getElementById("vbSub");
    var openLink = document.getElementById("vbOpen");
    var panels = box.querySelectorAll(".pf-panel");
    var opener = null;

    function show(t, s, url, label) {
      title.textContent = t;
      sub.textContent = s;
      openLink.href = url;
      openLink.lastChild.textContent = label;
      box.showModal();
    }
    function hideAll() {
      panels.forEach(function (p) { p.hidden = true; });
      frame.hidden = true;
      frame.removeAttribute("src");
      box.classList.remove("framed");
    }
    function openFrame(url, name) {
      hideAll();
      frame.hidden = false;
      frame.title = name + " live page";
      frame.src = url;
      box.classList.add("framed");
      // "Open" leads to the app page under the site menu (/apps/<repo>/) when it is one of the app pages
      var full = /^\/[^\/]+\/$/.test(url) && document.querySelector('#appsSub a[href="/apps' + url + '"]') ? "/apps" + url : url;
      show(name, location.host + url, full, "Open in new tab");
    }
    function openProfile(kind) {
      hideAll();
      var panel = box.querySelector('.pf-panel[data-panel="' + kind + '"]');
      if (!panel) return false;
      panel.hidden = false;
      panel.querySelectorAll("img").forEach(function (img) { img.loading = "eager"; });
      box.querySelector(".vb-body").scrollTop = 0;
      show(panel.dataset.title, panel.dataset.sub, panel.dataset.url, panel.dataset.label);
      return true;
    }

    document.addEventListener("click", function (e) {
      var a = e.target.closest("[data-frame], [data-profile]");
      if (!a || e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      opener = a;
      if (a.hasAttribute("data-frame")) openFrame(a.getAttribute("href"), a.dataset.title || a.textContent.trim());
      else if (!openProfile(a.dataset.profile)) window.open(a.href, "_blank", "noopener");
    });
    document.getElementById("vbClose").addEventListener("click", function () { box.close(); });
    box.addEventListener("click", function (e) { if (e.target === box) box.close(); });
    box.addEventListener("close", function () {
      frame.removeAttribute("src");
      if (opener) opener.focus();
    });
  })();

  // CV preview: every [data-cv] link opens the pages in a dialog; without JS the link opens the PDF.
  // The dialog has its own address, /#cv, so the "Copy link" button gives a link that opens it directly.
  (function () {
    var box = document.getElementById("cvBox");
    if (!box || typeof box.showModal !== "function") return;
    var opener = null;
    var plain = function () { return location.pathname + location.search; };
    function openCv(from) {
      opener = from || null;
      box.querySelectorAll("img").forEach(function (img) { img.loading = "eager"; });
      if (!box.open) box.showModal();
      box.querySelector(".cv-pages").scrollTop = 0;
      if (location.hash !== "#cv") history.replaceState(null, "", plain() + "#cv");
    }
    document.querySelectorAll("[data-cv]").forEach(function (link) {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        openCv(link);
      });
    });
    document.getElementById("cvClose").addEventListener("click", function () { box.close(); });
    box.addEventListener("click", function (e) { if (e.target === box) box.close(); });
    box.addEventListener("close", function () {
      if (location.hash === "#cv") history.replaceState(null, "", plain());
      if (opener) opener.focus();
    });

    // Copy the direct link to this dialog
    var copy = document.getElementById("cvCopy");
    if (copy) {
      var label = copy.querySelector("span");
      copy.addEventListener("click", function () {
        var url = location.origin + location.pathname + "#cv";
        var done = function () {
          label.textContent = "Link copied";
          copy.classList.add("copied");
          setTimeout(function () { label.textContent = "Copy link"; copy.classList.remove("copied"); }, 2200);
        };
        if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(url).then(done, function () { window.prompt("Copy this link", url); });
        else window.prompt("Copy this link", url);
      });
    }

    // Opening the site at /#cv (or switching to it) shows the CV straight away
    if (location.hash === "#cv") openCv();
    window.addEventListener("hashchange", function () { if (location.hash === "#cv") openCv(); });
  })();

  // Clients strip: the page ships with every logo, sized by tools/process_clients.py. The deploy
  // rewrites clients/clients.json from the clients/ folder, so a fresh list replaces the built one.
  (function () {
    var strip = document.getElementById("logoStrip");
    if (!strip) return;
    var row = strip.querySelector(".logo-row");
    var logos = Array.prototype.map.call(row.children, function (el) {
      var img = el.querySelector("img");
      return { name: el.title, src: img.getAttribute("src"), w: +img.getAttribute("width") || 0, h: +img.getAttribute("height") || 0, dark: el.classList.contains("dark") };
    });

    function tile(l) {
      var span = document.createElement("span");
      span.className = l.dark ? "client dark" : "client";
      span.title = l.name;
      var img = document.createElement("img");
      img.src = l.src;
      img.alt = l.name;
      img.decoding = "async";
      if (l.w && l.h) {
        img.width = l.w; img.height = l.h;
        img.style.setProperty("--w", l.w + "px");
        img.style.setProperty("--h", l.h + "px");
      }
      span.appendChild(img);
      return span;
    }
    // A second row, scrolling the other way
    var row2 = document.createElement("div");
    row2.className = "logo-row rev";
    strip.appendChild(row2);

    function fill(r, set) {
      r.textContent = "";
      set.forEach(function (l) { r.appendChild(tile(l)); });
      // Repeat the set until one half is wider than the screen, then double it so the loop is seamless
      var one = r.scrollWidth || 1;
      var copies = Math.max(1, Math.ceil((window.innerWidth * 1.2) / one));
      var half = [];
      for (var c = 0; c < copies; c++) set.forEach(function (l) { half.push(l); });
      r.textContent = "";
      half.concat(half).forEach(function (l) { r.appendChild(tile(l)); });
      r.style.animationDuration = Math.max(20, (one * copies) / 40) + "s";
    }
    function render() {
      // Alternate logos between the two rows; with only a few, both rows show them all
      var a = logos.filter(function (_, i) { return i % 2 === 0; });
      var b = logos.filter(function (_, i) { return i % 2 === 1; });
      if (logos.length < 8) { a = logos; b = logos.slice().reverse(); }
      fill(row, a);
      fill(row2, b);
    }

    render();
    if (!window.fetch) return;
    fetch(strip.dataset.folder + "/clients.json", { cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw r; return r.json(); })
      .then(function (list) {
        if (!Array.isArray(list) || !list.length || typeof list[0] !== "object") return;
        var same = list.length === logos.length && list.every(function (l, i) { return l.src === logos[i].src; });
        if (!same) { logos = list; render(); }
      })
      .catch(function () {});
  })();

  // Reveal on scroll and highlight the current section in the nav
  if ("IntersectionObserver" in window) {
    var reveal = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          reveal.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    document.querySelectorAll(".rv").forEach(function (el) { reveal.observe(el); });

    var navLinks = links.querySelectorAll("a");
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) {
          if (a.getAttribute("href") === "#" + entry.target.id) a.setAttribute("aria-current", "true");
          else a.removeAttribute("aria-current");
        });
        document.querySelectorAll(".has-sub").forEach(function (h) {
          h.classList.toggle("child-current", !!h.querySelector(".sub a[aria-current]"));
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    document.querySelectorAll("main section[id]").forEach(function (s) { spy.observe(s); });
  } else {
    document.querySelectorAll(".rv").forEach(function (el) { el.classList.add("in"); });
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
