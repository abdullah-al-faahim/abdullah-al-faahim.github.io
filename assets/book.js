// Book a call: Cal.com inline embed in the site's theme. It starts loading once the page is
// idle (or at once when someone heads for #book), so it's usually ready before they get there.
// Each call length gets its own frame, kept after first load, so switching is instant.
(function () {
  var box = document.getElementById("calInline");
  if (!box) return;
  var root = document.documentElement, started = false, panes = {};
  var link = box.getAttribute("data-cal-link");
  var dark = matchMedia("(prefers-color-scheme: dark)");
  var links = [].map.call(document.querySelectorAll(".book-types button"), function (b) { return b.getAttribute("data-cal"); });
  function theme() { return root.getAttribute("data-theme") || (dark.matches ? "dark" : "light"); }
  function ns(l) { return "book" + l.replace(/\W/g, ""); }
  function draw(l) {
    var name = ns(l), el = panes[l];
    if (!el) {
      el = panes[l] = document.createElement("div");
      el.className = "cal-pane";
      el.id = "cal-" + name;
      box.appendChild(el);
      window.Cal("init", name, { origin: "https://app.cal.com" });
    }
    el.innerHTML = "";
    window.Cal.ns[name]("inline", { elementOrSelector: "#" + el.id, calLink: l, config: { layout: "month_view", theme: theme() } });
    window.Cal.ns[name]("ui", {
      theme: theme(), layout: "month_view", hideEventTypeDetails: false,
      cssVarsPerTheme: { light: { "cal-brand": "#3A10AD", "cal-brand-text": "#ffffff" },
                         dark: { "cal-brand": "#D4FF24", "cal-brand-text": "#1E066F", "cal-bg": "#171334", "cal-bg-muted": "#1f1a44", "cal-bg-emphasis": "#2a2550", "cal-border": "#2a2550", "cal-border-subtle": "#2a2550" } }
    });
    el.drawn = theme();
  }
  function show(l) {
    link = l;
    if (!started) return start();
    if (!panes[l] || panes[l].drawn !== theme()) draw(l);
    for (var k in panes) panes[k].classList.toggle("on", k === l);
    box.classList.add("ready");
  }
  function start() {
    if (started) return;
    started = true;
    (function (C, A, L) {
      var p = function (a, ar) { a.q.push(ar); }, d = C.document;
      C.Cal = C.Cal || function () {
        var cal = C.Cal, ar = arguments;
        if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement("script")).src = A; cal.loaded = true; }
        if (ar[0] === L) {
          var api = function () { p(api, arguments); }, n = ar[1];
          api.q = api.q || [];
          if (typeof n === "string") { cal.ns[n] = cal.ns[n] || api; p(cal.ns[n], ar); p(cal, ["initNamespace", n]); } else p(cal, ar);
          return;
        }
        p(cal, ar);
      };
    })(window, "https://app.cal.com/embed/embed.js", "init");
    show(link);
    // Warm up the other call length a little later, so switching doesn't wait
    setTimeout(function () { links.forEach(function (l) { if (!panes[l]) { draw(l); panes[l].classList.remove("on"); } }); }, 6000);
    function retheme() {
      if (panes[link].drawn === theme()) return;
      show(link);
      setTimeout(function () { for (var k in panes) if (k !== link && panes[k].drawn !== theme()) draw(k); }, 1500);
    }
    new MutationObserver(retheme).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    if (dark.addEventListener) dark.addEventListener("change", retheme);
  }
  document.querySelectorAll(".book-types button").forEach(function (b) {
    b.addEventListener("click", function () {
      document.querySelectorAll(".book-types button").forEach(function (o) { o.setAttribute("aria-pressed", String(o === b)); });
      show(b.getAttribute("data-cal"));
    });
  });
  // Start right away when someone heads for the booking section
  document.querySelectorAll('a[href="#book"]').forEach(function (a) { a.addEventListener("click", start); });
  if (location.hash === "#book") start();
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (e) { if (e.some(function (x) { return x.isIntersecting; })) { io.disconnect(); start(); } }, { rootMargin: "1200px 0px" });
    io.observe(box);
  }
  // Otherwise load it in the background once the page has settled, unless data is precious
  var c = navigator.connection || {};
  if (!c.saveData && !/2g/.test(c.effectiveType || "")) {
    var idle = window.requestIdleCallback || function (f) { setTimeout(f, 1500); };
    var later = function () { setTimeout(function () { idle(start, { timeout: 4000 }); }, 2500); };
    if (document.readyState === "complete") later(); else addEventListener("load", later);
  }
})();
