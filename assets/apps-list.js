// Apps listing (/apps/, built by tools/build_apps.py): platform tabs and a search box.
(function () {
  var cards = document.querySelectorAll(".al-card"), tabs = document.querySelectorAll(".al-tabs [data-f]");
  var box = document.getElementById("alSearch"), empty = document.getElementById("alEmpty");
  if (!cards.length) return;
  var filter = "all";
  function apply() {
    var q = (box.value || "").trim().toLowerCase(), any = false;
    cards.forEach(function (c) {
      var on = (filter === "all" || c.dataset.plat === filter) && (!q || c.dataset.name.indexOf(q) !== -1);
      c.hidden = !on; any = any || on;
    });
    empty.hidden = any;
  }
  tabs.forEach(function (t) {
    t.addEventListener("click", function () {
      filter = t.dataset.f;
      tabs.forEach(function (o) { o.setAttribute("aria-selected", o === t); });
      apply();
    });
  });
  box.addEventListener("input", apply);
  var h = (location.hash || "").replace("#", "");
  if (h) { var t = document.querySelector('.al-tabs [data-f="' + h + '"]'); if (t) t.click(); }
})();
