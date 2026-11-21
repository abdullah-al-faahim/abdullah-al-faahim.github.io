// Utopia SoftTech "Get a quote" form, in a popup on the Utopia page.
// Any element with [data-quote] opens it; a package button's data-plan ("Group: Package")
// preselects the service. Requests are sent straight from the page: to the Apps Script web
// app in data-endpoint (branded email + private copy in the repo) when it is connected, else
// (or if it can't be reached) to FormSubmit in data-backup, which emails them to the inbox.
(function () {
  var dlg = document.getElementById("quoteForm");
  if (!dlg) return;
  var form = dlg.querySelector("form"), service = form.elements.service, budget = form.elements.budget;
  var custom = dlg.querySelector(".qf-custom"), status = dlg.querySelector(".qf-status"), send = dlg.querySelector(".qf-send");
  var opener = null, opened = 0;

  function open(plan, from) {
    opener = from || null;
    if (plan) {
      for (var i = 0; i < service.options.length; i++) if (service.options[i].value === plan) { service.selectedIndex = i; break; }
    }
    dlg.classList.remove("done");
    status.textContent = "";
    opened = Date.now();
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
    document.documentElement.classList.add("qf-lock");
    setTimeout(function () { (plan ? form.elements.name : service).focus(); }, 60);
  }
  function close() {
    if (dlg.close) dlg.close(); else dlg.removeAttribute("open");
  }
  dlg.addEventListener("close", function () {
    document.documentElement.classList.remove("qf-lock");
    if (opener) opener.focus();
  });
  dlg.querySelectorAll("[data-qf-close]").forEach(function (b) { b.addEventListener("click", close); });
  // Click on the dimmed backdrop closes it
  dlg.addEventListener("click", function (e) { if (e.target === dlg) close(); });

  document.querySelectorAll("[data-quote]").forEach(function (a) {
    a.addEventListener("click", function (e) { e.preventDefault(); open(a.getAttribute("data-plan"), a); });
  });
  if (location.hash === "#quote") open();

  budget.addEventListener("change", function () {
    var on = budget.value === "custom";
    custom.hidden = !on;
    form.elements.budget_custom.required = on;
    if (on) form.elements.budget_custom.focus();
  });

  function values() {
    var f = form.elements;
    return {
      service: f.service.value, name: f.name.value.trim(), phone: f.phone.value.trim(), email: f.email.value.trim(),
      website: f.website.value.trim(),
      budget: f.budget.value === "custom" ? f.budget_custom.value.trim() : f.budget.value,
      description: f.description.value.trim(), company_url: f.company_url.value, page: location.href
    };
  }
  // Direct send through FormSubmit (formsubmit.co): emails the request to the Utopia inbox.
  // Used when the Apps Script receiver isn't connected yet, or can't be reached.
  function viaFormSubmit(d) {
    var url = dlg.getAttribute("data-backup");
    if (!url) return Promise.reject(new Error("no backup"));
    return fetch(url, {
      method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        _subject: "Quote request: " + d.service + " · " + d.name, _template: "table", _captcha: "false", _replyto: d.email,
        "Service": d.service, "Name": d.name, "WhatsApp": d.phone, "email": d.email, "Website": d.website || "-",
        "Budget": d.budget, "Project description": d.description, "Sent from": d.page
      })
    }).then(function (r) { return r.json(); }).then(function (res) {
      if (!res || String(res.success) !== "true") throw new Error((res && res.message) || "not sent");
      return res;
    });
  }
  // The Apps Script receiver (branded email + private copy in the repo)
  function viaReceiver(d) {
    var url = dlg.getAttribute("data-endpoint");
    if (!url) return Promise.reject(new Error("no endpoint"));
    return fetch(url, { method: "POST", body: JSON.stringify(d) })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (res && res.ok) return res;
        var err = new Error((res && res.error) || "not sent"); err.shown = !!(res && res.error); throw err;
      });
  }
  function finish() {
    dlg.classList.add("done");
    dlg.querySelector(".qf-done p").textContent = "Thanks! We have your request and will reply on WhatsApp or email within one working day.";
    dlg.querySelector(".qf-done button").focus();
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!form.reportValidity()) return;
    var d = values();
    if (d.company_url || Date.now() - opened < 2500) { finish(); return; }   // bots: hidden field filled, or instant submit
    send.disabled = true; send.classList.add("busy"); status.textContent = "Sending…";
    viaReceiver(d)
      .catch(function (err) {
        if (err.shown) throw err;              // the receiver answered with a message for the visitor (for example, a typo)
        return viaFormSubmit(d);               // not connected or unreachable: send directly instead
      })
      .then(function () { form.reset(); custom.hidden = true; status.textContent = ""; finish(); })
      .catch(function (err) {
        status.textContent = err.shown ? err.message
          : "Sorry, the request could not be sent. Please try again in a moment, or message us on WhatsApp.";
      })
      .then(function () { send.disabled = false; send.classList.remove("busy"); });
  });
})();
