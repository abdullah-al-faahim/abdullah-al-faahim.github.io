/* Pull to refresh on phones and tablets: at the top of the page, pull down and let go to reload.
   Used on every page (home, blog, app pages). The browser's own pull-to-refresh is turned off
   on touch screens so the two never fire together, and this one works the same everywhere,
   including inside the app pages' frame. */
(function () {
  if (!window.matchMedia || !matchMedia("(pointer: coarse)").matches || !("ontouchstart" in window)) return;

  var LIMIT = 72;          // pull this far (after damping) to reload
  var MAX = 120;
  var css = document.createElement("style");
  css.textContent =
    "html,body{overscroll-behavior-y:contain}" +
    ".ptr{position:fixed;left:50%;z-index:60;width:40px;height:40px;margin-left:-20px;border-radius:50%;" +
    "display:grid;place-items:center;background:#fff;color:#6b4aff;box-shadow:0 6px 18px rgb(20 10 60/.28);" +
    "opacity:0;transform:translateY(-60px);pointer-events:none}" +
    ".ptr svg{width:22px;height:22px}" +
    ".ptr.back{transition:transform .25s ease,opacity .25s ease}" +
    ".ptr.spin svg{animation:ptr-spin .8s linear infinite}" +
    "@keyframes ptr-spin{to{transform:rotate(360deg)}}" +
    "@media (prefers-reduced-motion:reduce){.ptr.spin svg{animation-duration:2s}}";
  document.head.appendChild(css);

  var ind = document.createElement("div");
  ind.className = "ptr";
  ind.setAttribute("aria-hidden", "true");
  ind.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 4v5h-5"/></svg>';
  document.body.appendChild(ind);

  function topEdge() {
    var h = document.querySelector("header.top");
    return h ? Math.max(0, h.getBoundingClientRect().bottom) : 0;
  }
  function busy() {
    // Not while a menu, dialog or lightbox is open
    return document.querySelector("dialog[open], #links.open, .has-sub.open, .lightbox.open, [aria-modal='true']:not([hidden])");
  }

  var reloading = false;
  function attach(doc, win) {
    var startY = null, startX = 0, pull = 0;
    function show(p) {
      var y = topEdge() + Math.min(p, MAX) - 44;
      ind.style.transform = "translateY(" + y + "px) rotate(" + Math.round(p * 3) + "deg)";
      ind.style.opacity = Math.min(1, p / LIMIT);
    }
    doc.addEventListener("touchstart", function (e) {
      if (reloading || e.touches.length !== 1 || win.scrollY > 0 || busy()) { startY = null; return; }
      startY = e.touches[0].clientY;
      startX = e.touches[0].clientX;
      pull = 0;
      ind.classList.remove("back");
    }, { passive: true });
    doc.addEventListener("touchmove", function (e) {
      if (startY === null) return;
      var dy = e.touches[0].clientY - startY, dx = Math.abs(e.touches[0].clientX - startX);
      if (win.scrollY > 0 || dy <= 0 || dx > dy) { if (pull) { pull = 0; reset(); } return; }
      pull = dy * 0.5;
      show(pull);
    }, { passive: true });
    function end() {
      if (startY === null) return;
      startY = null;
      if (pull >= LIMIT && !reloading) {
        reloading = true;
        ind.classList.add("back", "spin");
        ind.style.transform = "translateY(" + (topEdge() + 20) + "px)";
        ind.style.opacity = 1;
        setTimeout(function () { location.reload(); }, 250);
      } else reset();
      pull = 0;
    }
    doc.addEventListener("touchend", end, { passive: true });
    doc.addEventListener("touchcancel", end, { passive: true });
  }
  function reset() {
    ind.classList.add("back");
    ind.style.transform = "translateY(-60px)";
    ind.style.opacity = 0;
  }

  attach(document, window);
  // App pages: the page inside the frame scrolls, so listen there too (same site, so allowed)
  window.__ptrAttach = function (doc, win) {
    var s = doc.createElement("style");
    s.textContent = "html,body{overscroll-behavior-y:contain}";
    doc.head.appendChild(s);
    attach(doc, win);
  };
})();
