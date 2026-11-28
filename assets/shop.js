// The shop (/shop/ and /shop/<product>/, built by tools/build_shop.py): category tabs, product page buy box, cart and the order form.
// The cart lives in this browser (localStorage). An order is sent to the Apps Script web app (action "order").
(function () {
  var dataEl = document.getElementById("shopData");
  if (!dataEl) return;
  var D = JSON.parse(dataEl.textContent), KEY = "shop-cart-v1";
  var $ = function (id) { return document.getElementById(id); };
  var cart = [];
  try { cart = JSON.parse(localStorage.getItem(KEY) || "[]").filter(function (l) { return D.products[l.id]; }); } catch (e) { cart = []; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) {} }

  function money(n) {
    var s = String(Math.round(n)), head = s.slice(0, -3), tail = s.slice(-3);
    if (s.length <= 3) return D.currency + s;
    return D.currency + head.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + tail;
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function art(p) { return p.isImage ? '<img src="' + esc(p.art) + '" alt="" />' : p.art; }
  function count() { return cart.reduce(function (n, l) { return n + l.qty; }, 0); }
  function hasPhysical() { return cart.some(function (l) { return D.products[l.id].physical; }); }
  function chosenDelivery() {
    var f = $("spForm"); if (!f || !f.delivery || !hasPhysical()) return null;
    return (D.delivery || []).filter(function (d) { return d.id === f.delivery.value; })[0] || null;
  }
  function total() { return cart.reduce(function (n, l) { return n + l.qty * D.products[l.id].price; }, 0); }
  function grand() { var d = chosenDelivery(); return total() + (d ? d.fee : 0); }
  function openDlg(d) { if (d.showModal) d.showModal(); else d.setAttribute("open", ""); }
  function closeDlg(d) { if (d.close) d.close(); else d.removeAttribute("open"); }

  /* ---------- Category tabs ---------- */
  var tabs = document.querySelectorAll(".sp-tabs [data-f]"), cards = document.querySelectorAll("#spGrid .sp-card");
  if (tabs.length) tabs.forEach(function (t) {
    t.addEventListener("click", function () {
      tabs.forEach(function (o) { o.setAttribute("aria-selected", o === t); });
      var any = false;
      cards.forEach(function (c) { var on = t.dataset.f === "all" || c.dataset.cat === t.dataset.f; c.hidden = !on; any = any || on; });
      $("spEmpty").hidden = any;
    });
  });
  // Category tiles and "View all" links pick the matching tab
  document.querySelectorAll("[data-go]").forEach(function (a) {
    a.addEventListener("click", function () {
      var t = document.querySelector('.sp-tabs [data-f="' + a.dataset.go + '"]'); if (t) t.click();
    });
  });
  var hash = (location.hash || "").replace("#", "");
  if (hash && tabs.length) { var ht = document.querySelector('.sp-tabs [data-f="' + hash + '"]'); if (ht) ht.click(); }

  /* ---------- Cart ---------- */
  var btn = $("spCartBtn");
  function bump() { btn.classList.remove("bump"); void btn.offsetWidth; btn.classList.add("bump"); }
  function add(id, opt, qty) {
    var found = cart.filter(function (l) { return l.id === id && (l.opt || "") === (opt || ""); })[0];
    if (found) found.qty = Math.min(20, found.qty + (qty || 1)); else cart.push({ id: id, opt: opt || "", qty: qty || 1 });
    save(); renderCart(); bump();
  }
  function renderCart() {
    $("spCount").textContent = count();
    document.querySelectorAll("[data-cartcount]").forEach(function (n) { n.textContent = count(); });
    var ul = $("spLines");
    ul.innerHTML = cart.map(function (l, i) {
      var p = D.products[l.id];
      return '<li class="sp-line"><span class="th">' + art(p) + '</span><div><b><a href="' + esc(p.url) + '">' + esc(p.title) + '</a></b><small>' + (l.opt ? esc(l.opt) + " &middot; " : "") + money(p.price) + '</small></div>' +
        '<div class="r"><span>' + money(p.price * l.qty) + '</span><span class="sp-qty"><button type="button" data-dec="' + i + '" aria-label="Fewer">&minus;</button><i>' + l.qty + '</i><button type="button" data-inc="' + i + '" aria-label="More">+</button></span><button type="button" class="sp-rm" data-rm="' + i + '">Remove</button></div></li>';
    }).join("");
    var empty = !cart.length;
    $("spCartEmpty").hidden = !empty; $("spTotalRow").hidden = empty; $("spCheckout").hidden = empty;
    $("spTotal").textContent = money(total());
    $("spDelHint").hidden = empty || !hasPhysical() || !(D.delivery || []).length;
  }
  $("spLines").addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    var i = b.dataset.inc != null ? +b.dataset.inc : b.dataset.dec != null ? +b.dataset.dec : +b.dataset.rm;
    if (b.dataset.inc != null) cart[i].qty = Math.min(20, cart[i].qty + 1);
    else if (b.dataset.dec != null) { cart[i].qty -= 1; if (cart[i].qty < 1) cart.splice(i, 1); }
    else cart.splice(i, 1);
    save(); renderCart();
  });
  function showCart() { $("spCartView").hidden = false; $("spForm").hidden = true; $("spDone").hidden = true; renderCart(); openDlg($("spCart")); }
  btn.addEventListener("click", showCart);
  document.querySelectorAll("[data-opencart]").forEach(function (b) { b.addEventListener("click", showCart); });
  document.querySelectorAll("dialog [data-close]").forEach(function (b) { b.addEventListener("click", function () { closeDlg(b.closest("dialog")); }); });
  document.querySelectorAll(".sp-dlg").forEach(function (d) { d.addEventListener("click", function (e) { if (e.target === d) closeDlg(d); }); });

  /* ---------- Add buttons (cards) ---------- */
  function needsOption(p) { return p.options && p.options.values && p.options.values.length; }
  var grid = document.querySelector(".shop");
  if (grid) grid.addEventListener("click", function (e) {
    var a = e.target.closest("[data-add]"); if (!a) return;
    var p = D.products[a.dataset.add];
    if (needsOption(p)) { location.href = p.url; return; }   // sizes and licences are chosen on the product page
    add(p.id, "", 1);
    var old = a.textContent; a.textContent = "Added ✓"; a.classList.add("added");
    setTimeout(function () { a.textContent = old; a.classList.remove("added"); }, 1400);
  });

  /* ---------- Product page buy box ---------- */
  var pd = document.querySelector(".pd-top");
  if (pd) {
    var pid = pd.dataset.pid, qty = 1, qEl = $("pdQty");
    document.querySelectorAll("[data-pdq]").forEach(function (b) {
      b.addEventListener("click", function () { qty = Math.max(1, Math.min(20, qty + +b.dataset.pdq)); qEl.textContent = qty; });
    });
    document.querySelectorAll("[data-pdadd]").forEach(function (b) {
      b.addEventListener("click", function () {
        var c = document.querySelector('input[name="pdopt"]:checked');
        add(pid, c ? c.value : "", qty);
        if (b.dataset.pdadd === "now") { showCart(); return; }
        var old = b.textContent; b.textContent = "Added ✓"; b.classList.add("added");
        setTimeout(function () { b.textContent = old; b.classList.remove("added"); }, 1400);
      });
    });
    document.querySelectorAll(".pd-thumb").forEach(function (t) {
      t.addEventListener("click", function () {
        var m = document.querySelector("#pdMain img"); if (m) m.src = t.dataset.shot;
        document.querySelectorAll(".pd-thumb").forEach(function (o) { o.removeAttribute("aria-current"); });
        t.setAttribute("aria-current", "true");
      });
    });
  }

  /* ---------- Order form ---------- */
  var form = $("spForm"), loadedAt = Date.now();
  form.payment.innerHTML = '<option value="" disabled selected>Choose how you will pay</option>' + D.methods.map(function (m) { return "<option>" + esc(m) + "</option>"; }).join("");
  if (form.delivery) form.delivery.innerHTML = (D.delivery || []).map(function (d, i) { return '<option value="' + esc(d.id) + '"' + (i ? "" : " selected") + ">" + esc(d.label) + " (" + money(d.fee) + ")</option>"; }).join("");
  function summary() {
    var d = chosenDelivery(), lines = cart.map(function (l) { var p = D.products[l.id]; return l.qty + " &times; " + esc(p.title) + (l.opt ? " (" + esc(l.opt) + ")" : "") + (p.preorder ? " <em>(pre-order)</em>" : ""); });
    if (d) lines.push("Delivery: " + esc(d.label) + " " + money(d.fee));
    $("spSummary").innerHTML = lines.join("<br>") + "<br><b>Total " + money(grand()) + "</b>";
    var note = $("spDelNote");
    note.hidden = !d; if (d) note.textContent = d.via + ".";
    $("spAddrLbl").textContent = d && /office/.test(d.id) ? "Office or branch where you will collect" : "Delivery address";
    form.address.placeholder = d && /office/.test(d.id) ? "Courier office or post office branch, area, district" : "House, road, area, district";
  }
  if (form.delivery) form.delivery.addEventListener("change", summary);
  $("spCheckout").addEventListener("click", function () {
    var physical = hasPhysical();
    $("spAddrRow").hidden = !physical; form.address.required = physical;
    $("spDelRow").hidden = !physical || !(D.delivery || []).length; form.delivery.required = !$("spDelRow").hidden;
    summary();
    $("spErr").textContent = "";
    $("spCartView").hidden = true; form.hidden = false;
  });
  $("spBack").addEventListener("click", function () { form.hidden = true; $("spCartView").hidden = false; });
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var err = $("spErr"), send = $("spSend");
    err.textContent = "";
    if (!form.checkValidity()) { form.reportValidity(); return; }
    if (form.company_url.value) { finish("bot"); return; }                   // hidden field: bots fill it in
    if (Date.now() - loadedAt < 2500) { err.textContent = "One moment, then send again."; return; }
    if (!D.endpoint) { err.textContent = "Ordering is not switched on yet. Please email or message us."; return; }
    var dl = chosenDelivery();
    var body = {
      action: "order", name: form.name.value.trim(), phone: form.phone.value.trim(), email: form.email.value.trim(),
      address: form.address.value.trim(), payment: form.payment.value, company_url: "",
      note: ((dl ? "DELIVERY: " + dl.label + " (BDT " + dl.fee + ", " + dl.via + "). " : "") + (cart.some(function (l) { return D.products[l.id].preorder; }) ? "PRE-ORDER. " : "") + form.note.value.trim()).slice(0, 300),
      delivery: dl ? dl.label : "", delivery_fee: dl ? dl.fee : 0, page: location.href,
      items: cart.map(function (l) { var p = D.products[l.id]; return { id: l.id, title: p.title, option: l.opt, qty: l.qty, price: p.price }; })
    };
    send.disabled = true; send.textContent = "Sending…";
    fetch(D.endpoint, { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify(body) })
      .then(function (r) { return r.json(); })
      .then(function (r) {
        if (r && r.ok) finish(r.id, body.email);
        else err.textContent = (r && r.error && !/Unknown action/.test(r.error)) ? r.error : "Ordering is not switched on yet. Please email or message us.";
      })
      .catch(function () { err.textContent = "Could not reach the server. Check your connection and try again."; })
      .then(function () { send.disabled = false; send.textContent = "Send order"; });
  });
  function finish(id, email) {
    form.hidden = true; $("spDone").hidden = false;
    $("spDoneText").innerHTML = (id && id !== "bot" ? "Your order number is <b>" + esc(id) + "</b>. " : "") +
      "We will email " + (email ? "<b>" + esc(email) + "</b>" : "you") + " with payment details shortly. Check your spam folder if you do not see it.";
    cart = []; save(); renderCart(); form.reset();
  }

  /* ---------- Look inside: read the first pages of a book ---------- */
  var reader = $("pdReader");
  if (reader && pd) {
    var pv = D.products[pd.dataset.pid].preview, cur = 1;
    var img = $("pdrImg"), no = $("pdrNo"), endBar = $("pdrEnd");
    var go = function (n) {
      cur = Math.max(1, Math.min(pv.count, n));
      img.src = pv.dir + "p" + ("0" + cur).slice(-2) + "." + (pv.ext || "webp");
      img.alt = "Page " + cur + " of " + pv.count;
      no.textContent = "Page " + cur + " of " + pv.count;
      endBar.hidden = cur !== pv.count;
      reader.querySelector('[data-pgnav="-1"]').disabled = cur === 1;
      reader.querySelector('[data-pgnav="1"]').disabled = cur === pv.count;
      var nx = new Image(); if (cur < pv.count) nx.src = pv.dir + "p" + ("0" + (cur + 1)).slice(-2) + "." + (pv.ext || "webp");
    };
    document.querySelectorAll("[data-read]").forEach(function (b) { b.addEventListener("click", function () { go(1); openDlg(reader); }); });
    document.querySelectorAll(".pd-pg").forEach(function (b) { b.addEventListener("click", function () { go(+b.dataset.pg); openDlg(reader); }); });
    reader.querySelectorAll("[data-pgnav]").forEach(function (b) { b.addEventListener("click", function () { go(cur + +b.dataset.pgnav); }); });
    reader.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { go(cur + 1); e.preventDefault(); } else if (e.key === "ArrowLeft") { go(cur - 1); e.preventDefault(); }
    });
    var sx = null;
    reader.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
    reader.addEventListener("touchend", function (e) { if (sx == null) return; var dx = e.changedTouches[0].clientX - sx; sx = null; if (Math.abs(dx) > 50) go(cur + (dx < 0 ? 1 : -1)); }, { passive: true });
    reader.querySelectorAll("[data-pdadd]").forEach(function (b) { b.addEventListener("click", function () { closeDlg(reader); }); });
    if (location.hash === "#read") { go(1); openDlg(reader); }
  }

  /* ---------- Pre-order poster, once a day when the shop opens ---------- */
  var pop = $("spPop");
  if (pop) {
    var pk = "shop-popup-" + pop.dataset.key, today = new Date().toISOString().slice(0, 10), seen = "";
    try { seen = localStorage.getItem(pk) || ""; } catch (e) {}
    if (seen !== today) setTimeout(function () {
      if (document.querySelector("dialog[open]")) return;
      openDlg(pop); try { localStorage.setItem(pk, today); } catch (e) {}
    }, 900);
  }

  renderCart();
})();
