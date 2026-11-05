(function () {
  var root = document.documentElement;
  var now = new Date();

  // Years of brand design since 2018, and the footer year
  document.querySelectorAll("[data-years]").forEach(function (el) {
    el.textContent = now.getFullYear() - 2018;
  });
  document.getElementById("year").textContent = now.getFullYear();

  // Theme toggle, remembered per visitor
  var toggle = document.querySelector(".theme-toggle");
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
  var menu = document.querySelector(".menu-toggle");
  var links = document.getElementById("nav-links");
  function setMenu(open) {
    links.classList.toggle("open", open);
    menu.setAttribute("aria-expanded", open);
    menu.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
  menu.addEventListener("click", function () { setMenu(!links.classList.contains("open")); });
  links.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });

  // Header border once scrolled
  var header = document.querySelector(".site-header");
  function onScroll() { header.classList.toggle("scrolled", window.scrollY > 8); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Project filters
  var filters = document.querySelectorAll(".filter");
  var projects = document.querySelectorAll(".project");
  filters.forEach(function (button) {
    button.addEventListener("click", function () {
      var cat = button.dataset.filter;
      filters.forEach(function (b) { b.setAttribute("aria-pressed", b === button); });
      projects.forEach(function (p) {
        p.hidden = cat !== "all" && p.dataset.cats.split(" ").indexOf(cat) === -1;
        if (!p.hidden) p.classList.add("in");
      });
    });
  });

  // Reveal on scroll, and highlight the current section in the nav
  if ("IntersectionObserver" in window) {
    var reveal = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          reveal.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    document.querySelectorAll(".reveal").forEach(function (el) { reveal.observe(el); });

    var navLinks = document.querySelectorAll(".nav-links a");
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.toggleAttribute("aria-current", a.getAttribute("href") === "#" + entry.target.id);
          if (a.hasAttribute("aria-current")) a.setAttribute("aria-current", "true");
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    document.querySelectorAll("main section[id]").forEach(function (s) { spy.observe(s); });
  } else {
    document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("in"); });
  }
})();
