// "Book a Meeting" buttons that open Cal.com in a popup over the page, in the site's theme.
// Mark a link with data-book-popup="<cal link>"; its href is the plain Cal.com page, used
// only if the script can't run. Cal's script loads when someone hovers or focuses the
// button (or once the page is idle), so the popup opens at once on click.
(function () {
  var btns = document.querySelectorAll("[data-book-popup]");
  if (!btns.length) return;
  var root = document.documentElement, NS = "bookPopup", loaded = false;
  var dark = matchMedia("(prefers-color-scheme: dark)");
  function theme() { return root.getAttribute("data-theme") || (dark.matches ? "dark" : "light"); }
  function load() {
    if (loaded) return;
    loaded = true;
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
    window.Cal("init", NS, { origin: "https://app.cal.com" });
  }
  function open(link) {
    load();
    var api = window.Cal.ns[NS];
    api("ui", {
      theme: theme(), layout: "month_view", hideEventTypeDetails: false,
      cssVarsPerTheme: { light: { "cal-brand": "#3A10AD", "cal-brand-text": "#ffffff" },
                         dark: { "cal-brand": "#D4FF24", "cal-brand-text": "#1E066F", "cal-bg": "#171334", "cal-bg-muted": "#1f1a44", "cal-bg-emphasis": "#2a2550", "cal-border": "#2a2550", "cal-border-subtle": "#2a2550" } }
    });
    api("modal", { calLink: link, config: { layout: "month_view", theme: theme() } });
  }
  btns.forEach(function (b) {
    b.addEventListener("pointerenter", load, { once: true });
    b.addEventListener("focus", load, { once: true });
    b.addEventListener("click", function (e) { e.preventDefault(); open(b.getAttribute("data-book-popup")); });
  });
  var c = navigator.connection || {};
  if (!c.saveData && !/2g/.test(c.effectiveType || "")) {
    var later = function () { setTimeout(function () { (window.requestIdleCallback || setTimeout)(load); }, 4000); };
    if (document.readyState === "complete") later(); else addEventListener("load", later);
  }
})();
