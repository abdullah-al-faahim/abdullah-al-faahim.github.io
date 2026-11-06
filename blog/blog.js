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
