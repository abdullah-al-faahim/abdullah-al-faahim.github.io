/* Footer newsletter sign-up. Sends the address to the Apps Script server (tools/apps-script/Code.gs),
   which saves it in a Google Sheet. The form works without this script only as a plain page. */
(function () {
  "use strict";
  var form = document.querySelector(".sf-news");
  if (!form) return;
  var email = form.elements.email, msg = form.querySelector(".sf-msg"), btn = form.querySelector("button");
  var label = btn.querySelector("span"), opened = Date.now(), KEY = "sf-subscribed";

  function say(text, kind) { msg.textContent = text; msg.className = "sf-msg" + (kind ? " " + kind : ""); }
  function done(text) { form.classList.add("is-done"); say(text, "ok"); email.value = ""; }

  try { if (localStorage.getItem(KEY)) done("You are on the list. Thank you!"); } catch (e) { /* private mode: ignore */ }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var addr = email.value.trim();
    if (!addr || !email.checkValidity()) { say("Please enter a valid email address.", "err"); email.focus(); return; }
    // Bots: the hidden field is filled or the form was sent instantly. Look successful, send nothing.
    if (form.elements.company_url.value || Date.now() - opened < 1500) { done("You are on the list. Thank you!"); return; }
    var url = form.getAttribute("data-endpoint");
    if (!url) { say("Sign-up is not available right now. Please try again later.", "err"); return; }
    btn.disabled = true; label.textContent = "Sending…"; say("");
    fetch(url, {
      method: "POST",
      body: JSON.stringify({ action: "newsletter", email: addr, page: location.pathname, company_url: "" })
    })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (res && res.ok) {
          try { localStorage.setItem(KEY, "1"); } catch (e) { /* ignore */ }
          done(res.already ? "You are already on the list. Thank you!" : "You are on the list. Check your inbox for a welcome email.");
        } else {
          var known = res && res.error && /email|many/i.test(res.error);
          say(known ? res.error : "Could not sign you up right now. Please try again later.", "err");
        }
      })
      .catch(function () { say("Could not sign you up right now. Please try again later.", "err"); })
      .then(function () { btn.disabled = false; label.textContent = "Subscribe"; });
  });
})();
