// The Designs gallery on pages other than the home page (built by tools/site_designs.py):
// category filters, "show all" and the full-size viewer. Same behaviour as the home page's gallery.
(function () {
  var grid = document.getElementById("grid"), lb = document.getElementById("lb");
  if (!grid || !lb) return;
  var FIRST = window.matchMedia("(max-width: 720px)").matches ? 6 : 12, expanded = false, current = "all", index = 0, opener = null, x0 = null;
  var cards = Array.prototype.slice.call(grid.querySelectorAll(".card"));
  var filters = document.querySelectorAll("#filters button"), more = document.getElementById("more");
  var img = document.getElementById("lbImg"), title = document.getElementById("lbTitle"), cat = document.getElementById("lbCat"), link = document.getElementById("lbLink");

  function apply() {
    var shown = 0;
    cards.forEach(function (c) {
      var match = current === "all" || c.dataset.c === current;
      var visible = match && (expanded || current !== "all" || shown < FIRST);
      c.hidden = !visible;
      if (visible) shown++;
    });
    if (more) more.hidden = expanded || current !== "all";
  }
  filters.forEach(function (b) {
    b.addEventListener("click", function () {
      current = b.dataset.c;
      filters.forEach(function (o) { o.setAttribute("aria-pressed", o === b); });
      apply();
    });
  });
  if (more) more.addEventListener("click", function () {
    expanded = true; apply();
    if (cards[FIRST]) cards[FIRST].focus();
  });
  apply();

  function visibleCards() { return cards.filter(function (c) { return !c.hidden; }); }
  function show(card) {
    index = visibleCards().indexOf(card);
    img.src = card.dataset.full; img.alt = card.dataset.title;
    title.textContent = card.dataset.title;
    cat.textContent = card.dataset.cat + " · " + card.dataset.src;
    link.href = card.dataset.url;
    link.lastChild.textContent = "View on " + card.dataset.src;
  }
  function step(d) { var l = visibleCards(); show(l[(index + d + l.length) % l.length]); }
  cards.forEach(function (c) {
    c.addEventListener("click", function () {
      opener = c; show(c);
      if (typeof lb.showModal === "function") lb.showModal(); else window.open(c.dataset.url, "_blank", "noopener");
    });
  });
  document.getElementById("lbClose").addEventListener("click", function () { lb.close(); });
  document.getElementById("lbPrev").addEventListener("click", function () { step(-1); });
  document.getElementById("lbNext").addEventListener("click", function () { step(1); });
  lb.addEventListener("click", function (e) { if (e.target === lb) lb.close(); });
  lb.addEventListener("keydown", function (e) { if (e.key === "ArrowLeft") step(-1); if (e.key === "ArrowRight") step(1); });
  lb.addEventListener("close", function () { if (opener) opener.focus(); });
  lb.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
    x0 = null;
  });
})();
