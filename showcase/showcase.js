(function () {
  var root = document.documentElement;
  var now = new Date();

  document.querySelectorAll("[data-years]").forEach(function (el) {
    el.textContent = now.getFullYear() - 2018;
  });
  document.getElementById("year").textContent = now.getFullYear();

  // Theme toggle, shared with the main site through localStorage "theme"
  var toggle = document.querySelector(".theme");
  function label() {
    var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    toggle.setAttribute("aria-label", "Switch to " + next + " theme");
  }
  label();
  toggle.addEventListener("click", function () {
    var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch (e) {}
    label();
  });

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

  // Header shadow once scrolled
  var top = document.querySelector(".top");
  function onScroll() { top.classList.toggle("scrolled", window.scrollY > 8); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Work grid: filters and "show more"
  var FIRST = 12;
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

  // Clients strip: built-in logos plus any image uploaded to the site's clients/ folder.
  // GitHub Pages can't list a folder, so the list comes from the GitHub API (cached per visit).
  (function () {
    var strip = document.getElementById("logoStrip");
    if (!strip) return;
    var row = strip.querySelector(".logo-row");
    var key = function (s) { return s.toLowerCase().replace(/\.[a-z0-9]+$/, "").replace(/[^a-z0-9]+/g, ""); };
    var logos = Array.prototype.map.call(row.children, function (el) {
      return { name: el.title, src: el.querySelector("img").getAttribute("src") };
    });

    function tile(l) {
      var span = document.createElement("span");
      span.className = "client";
      span.title = l.name;
      var img = document.createElement("img");
      img.src = l.src;
      img.alt = l.name;
      img.decoding = "async";
      span.appendChild(img);
      return span;
    }
    function render() {
      row.textContent = "";
      logos.forEach(function (l) { row.appendChild(tile(l)); });
      // Repeat the set until one half is wider than the screen, then double it so the loop is seamless
      var one = row.scrollWidth || 1;
      var copies = Math.max(1, Math.ceil((window.innerWidth * 1.2) / one));
      var half = [];
      for (var c = 0; c < copies; c++) logos.forEach(function (l) { half.push(l); });
      row.textContent = "";
      half.concat(half).forEach(function (l) { row.appendChild(tile(l)); });
      row.style.animationDuration = Math.max(20, (one * copies) / 45) + "s";
    }
    function merge(files) {
      files.forEach(function (f) {
        if (f.type !== "file" || !/\.(png|jpe?g|webp|svg|gif|avif)$/i.test(f.name)) return;
        var name = f.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
        var src = strip.dataset.folder + "/" + encodeURIComponent(f.name);
        var match = logos.filter(function (l) { return key(l.name) === key(f.name); })[0];
        if (match) match.src = src;
        else logos.push({ name: name, src: src });
      });
      render();
    }

    render();
    var cacheKey = "clients:" + strip.dataset.folder;
    try {
      var cached = sessionStorage.getItem(cacheKey);
      if (cached) { merge(JSON.parse(cached)); return; }
    } catch (e) {}
    if (!window.fetch) return;
    fetch("https://api.github.com/repos/" + strip.dataset.repo + "/contents/" + strip.dataset.folder)
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (files) {
        if (!Array.isArray(files)) return;
        var slim = files.map(function (f) { return { type: f.type, name: f.name }; });
        try { sessionStorage.setItem(cacheKey, JSON.stringify(slim)); } catch (e) {}
        merge(slim);
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
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    document.querySelectorAll("main section[id]").forEach(function (s) { spy.observe(s); });
  } else {
    document.querySelectorAll(".rv").forEach(function (el) { el.classList.add("in"); });
  }
})();
