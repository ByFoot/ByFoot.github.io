// pages/settings-init.js - init/event logic

async function initSettings() {
  const me = window.APP.me;
  if (!me) return;

  document.getElementById("settings-username").value = me.username;

  const slider = document.getElementById("radius-slider");
  const radiusLabel = document.getElementById("radius-value");
  slider.max = me.is_pro ? 10 : 5;
  slider.value = me.radius_minutes;
  radiusLabel.textContent = Math.round(me.radius_minutes);
  slider.addEventListener("input", () => { radiusLabel.textContent = slider.value; });
  slider.addEventListener("change", async () => {
    const val = parseInt(slider.value);
    const res = await API.patchRadius(val);
    const errEl = document.getElementById("settings-radius-error");
    if (!res || !res.ok) { errEl.textContent = await parseError(res); }
    else { window.APP.me.radius_minutes = val; errEl.textContent = ""; }
  });

  ["notif_new_post","notif_new_chat"].forEach(key => {
    const el = document.getElementById(`toggle-${key}`);
    if (el) el.checked = !!me[key];
  });
  document.querySelectorAll(".notif-toggle").forEach(toggle => {
    toggle.addEventListener("change", async () => {
      await API.patchNotifPrefs({ [toggle.dataset.key]: toggle.checked });
    });
  });

  const chatExpiryInput = document.getElementById("chat-expiry");
  chatExpiryInput.value = me.chat_expiry_days ?? 1;
  document.getElementById("chat-expiry-save")?.addEventListener("click", async () => {
    const errEl = document.getElementById("chat-expiry-error");
    errEl.textContent = "";
    const val = parseInt(chatExpiryInput.value, 10);
    if (!val || val < 1) return;
    const res = await API.patchChatExpiry(val);
    if (!res || !res.ok) { errEl.textContent = await parseError(res); }
    else { window.APP.me.chat_expiry_days = val; }
  });

  document.getElementById("settings-username-save")?.addEventListener("click", async () => {
    const username = document.getElementById("settings-username").value.trim();
    const errEl = document.getElementById("settings-username-error");
    errEl.textContent = "";
    if (!username) return;
    const res = await API.patchUsername(username);
    if (!res || !res.ok) { errEl.textContent = await parseError(res); }
    else { const data = await res.json(); window.APP.me.username = data.username; }
  });

  document.getElementById("location-update-btn")?.addEventListener("click", () => {
    const msgEl = document.getElementById("settings-location-msg");
    msgEl.textContent = "…"; msgEl.className = "success-msg";
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const res = await API.patchLocation(pos.coords.latitude, pos.coords.longitude);
        msgEl.textContent = (res && res.ok) ? t("settings.location_update") : t("settings.location_error");
        if (!res || !res.ok) msgEl.className = "error-msg";
        else { window.APP.me.lat = pos.coords.latitude; window.APP.me.lng = pos.coords.longitude; localStorage.setItem("has_location","1"); }
      },
      () => { msgEl.textContent = t("settings.location_error"); msgEl.className = "error-msg"; }
    );
  });

  const proEl = document.getElementById("pro-status");
  proEl.innerHTML = me.is_pro
    ? `<span class="pro-badge">${t("profile.pro_badge")}</span>`
    : `<ul class="pro-perks">
         <li> ${t("settings.pro_perk_radius")}</li>
         <li>⭐ ${t("settings.pro_perk_priority")}</li>
         <li> ${t("settings.pro_perk_username")}</li>
       </ul>
       <div class="pro-buy-wrap">
         <stripe-buy-button
           buy-button-id="buy_btn_1TWEySGTv1SoWf9cNt7zuEbz"
           publishable-key="pk_live_51SnY0EGTv1SoWf9cTiBdEXYvE8XHGuzbAdXgx2R4vfdo6vYMOryV2IJVqpOWmGkePkX70oVLIGxUl7RaGVqFO8s900K6OsUHSU"
         ></stripe-buy-button>
       </div>`;

  document.querySelectorAll("[data-lang]").forEach(btn => {
    btn.addEventListener("click", async () => {
      await I18N.load(btn.dataset.lang);
      ROUTER.navigate(location.hash.slice(1) || "/feed");
    });
  });

  document.getElementById("logout-btn")?.addEventListener("click", () => {
    localStorage.removeItem("jwt");
    localStorage.removeItem("refresh");
    window.APP.jwt = null;
    window.APP.refresh = null;
    window.APP.me = null;
    location.hash = "#/login";
  });
}