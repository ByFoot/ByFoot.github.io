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

  // Show current location with reverse geocode if coords exist
  async function renderLocationDisplay(lat, lng) {
    const displayEl = document.getElementById("settings-location-display");
    if (!displayEl) return;
    if (lat == null || lng == null) {
      displayEl.textContent = t("settings.location_not_set");
      return;
    }
    displayEl.textContent = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { "Accept-Language": I18N.current || "en", "User-Agent": "ByFoot/1.0" } }
      );
      if (!r.ok) return;
      const data = await r.json();
      const addr = data.address || {};
      const label = [
        addr.road || addr.pedestrian,
        addr.neighbourhood || addr.suburb,
        addr.city || addr.town || addr.village
      ].filter(Boolean).join(", ");
      if (label) displayEl.textContent = label;
    } catch { /* silently ignore — coords already shown */ }
  }

  renderLocationDisplay(me?.lat, me?.lng);

  document.getElementById("location-update-btn")?.addEventListener("click", async () => {
    const msgEl = document.getElementById("settings-location-msg");
    msgEl.textContent = "…"; msgEl.className = "success-msg";

    // Check permission state first; request it if not yet granted
    if (navigator.permissions) {
      try {
        const status = await navigator.permissions.query({ name: "geolocation" });
        if (status.state === "denied") {
          msgEl.textContent = t("settings.location_error");
          msgEl.className = "error-msg";
          return;
        }
      } catch { /* old browser — fall through to getCurrentPosition which prompts itself */ }
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const res = await API.patchLocation(latitude, longitude);
        if (res && res.ok) {
          window.APP.me.lat = latitude;
          window.APP.me.lng = longitude;
          hideLocationGate();
          msgEl.textContent = t("settings.location_update");
          renderLocationDisplay(latitude, longitude);
        } else {
          msgEl.textContent = t("settings.location_error");
          msgEl.className = "error-msg";
        }
      },
      () => { msgEl.textContent = t("settings.location_error"); msgEl.className = "error-msg"; },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });

  const proEl = document.getElementById("pro-status");
  proEl.innerHTML = me.is_pro
    ? `<span class="pro-badge">${t("profile.pro_badge")}</span>`
    : `<ul class="pro-perks">
         <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" style="color:#e8820c;flex-shrink:0"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="3" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="21"/><line x1="3" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="21" y2="12"/></svg> ${t("settings.pro_perk_radius")}</li>
         <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" style="color:#e8820c;flex-shrink:0"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> ${t("settings.pro_perk_priority")}</li>
         <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" style="color:#e8820c;flex-shrink:0"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> ${t("settings.pro_perk_username")}</li>
         <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" style="color:#e8820c;flex-shrink:0"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg> ${t("settings.pro_perk_mobile")}</li>
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