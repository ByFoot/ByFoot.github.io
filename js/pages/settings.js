// pages/settings.js

function renderSettings() {
  const theme = document.documentElement.dataset.theme || "dark";
  return `
    <div class="page settings-page">
      <header class="page-header">
        <h2 class="page-title">${t("nav.settings")}</h2>
        <button class="btn btn--icon btn--ghost" id="theme-toggle" title="Toggle theme" aria-label="Toggle theme">
          ${theme === "light"
            ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`
            : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`
          }
        </button>
      </header>

      <div class="settings-body">
        <section class="settings-section">
          <h3 class="settings-section-title">${t("settings.account")}</h3>
          <div class="settings-row">
            <label class="form-label">${t("settings.username")}</label>
            <div class="settings-inline">
              <input class="input input--sm" type="text" id="settings-username" placeholder="username">
              <button class="btn btn--ghost btn--sm" id="settings-username-save">${t("action.save")}</button>
            </div>
            <div id="settings-username-error" class="error-msg"></div>
          </div>
        </section>

        <section class="settings-section">
          <h3 class="settings-section-title">${t("settings.location")}</h3>
          <div class="settings-row">
            <label class="form-label">${t("settings.radius")} — <span id="radius-value">…</span> ${t("settings.minutes")}</label>
            <input type="range" id="radius-slider" class="slider" min="0" max="5" step="1" value="3">
            <div id="settings-radius-error" class="error-msg"></div>
          </div>
          <div class="settings-row">
            <button class="btn btn--ghost btn--full" id="location-update-btn">${t("settings.location")}</button>
            <div id="settings-location-msg" class="success-msg"></div>
          </div>
        </section>

        <section class="settings-section">
          <h3 class="settings-section-title">${t("settings.notifications")}</h3>
          ${[["notif_new_post","settings.notif_new_post"],["notif_new_chat","settings.notif_new_chat"]].map(([key, label]) => `
            <div class="settings-toggle-row">
              <span class="settings-toggle-label">${t(label)}</span>
              <label class="toggle">
                <input type="checkbox" class="notif-toggle" data-key="${key}" id="toggle-${key}">
                <span class="toggle-track"></span>
              </label>
            </div>
          `).join("")}
        </section>

        <section class="settings-section">
          <h3 class="settings-section-title">${t("settings.chat_expiry")}</h3>
          <div class="settings-row">
            <div class="settings-inline">
              <input class="input input--sm" type="number" id="chat-expiry" min="1" max="30">
              <button class="btn btn--ghost btn--sm" id="chat-expiry-save">${t("action.save")}</button>
            </div>
            <div id="chat-expiry-error" class="error-msg"></div>
          </div>
        </section>

        <section class="settings-section">
          <h3 class="settings-section-title">Langue / Language</h3>
          <div class="settings-toggle-row">
            <button class="btn btn--ghost btn--sm${I18N.lang === "fr" ? " btn--active" : ""}" data-lang="fr">Français</button>
            <button class="btn btn--ghost btn--sm${I18N.lang === "en" ? " btn--active" : ""}" data-lang="en">English</button>
          </div>
        </section>

        <section class="settings-section settings-section--pro">
          <h3 class="settings-section-title">${t("settings.pro")}</h3>
          <div id="pro-status"></div>
        </section>

        <section class="settings-section">
          <h3 class="settings-section-title">${t("settings.account")}</h3>
          <button class="btn btn--danger btn--full" id="logout-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            ${t("action.logout") || "Déconnexion"}
          </button>
        </section>
      </div>
    </div>
  `;
}

async function initSettings() {
  const me = window.APP.me;
  if (!me) return;

  document.getElementById("settings-username").value = me.username;

  const slider = document.getElementById("radius-slider");
  const radiusLabel = document.getElementById("radius-value");
  slider.max = me.is_pro ? 10 : 5;
  slider.value = me.radius_minutes;
  radiusLabel.textContent = me.radius_minutes;
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
    : `<p class="pro-desc">${t("settings.pro_desc")}</p>
       <p class="pro-desc">${t("settings.pro_unavailable")}</p>
       <button class="btn btn--ghost btn--full" disabled>${t("settings.pro_soon")}</button>`;

  document.querySelectorAll("[data-lang]").forEach(btn => {
    btn.addEventListener("click", async () => {
      await I18N.load(btn.dataset.lang);
      ROUTER.navigate(location.hash.slice(1) || "/feed");
    });
  });

  // Theme toggle
  document.getElementById("theme-toggle")?.addEventListener("click", () => {
    const current = document.documentElement.dataset.theme || "dark";
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("theme", next);
    ROUTER.navigate(location.hash.slice(1) || "/settings");
  });

  // Logout
  document.getElementById("logout-btn")?.addEventListener("click", () => {
    localStorage.removeItem("jwt");
    localStorage.removeItem("refresh");
    window.APP.jwt = null;
    window.APP.refresh = null;
    window.APP.me = null;
    location.hash = "#/login";
  });
}
