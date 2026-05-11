// pages/settings.js

function renderSettings() {
  return `
    <div class="page settings-page">
      <header class="page-header">
        <h2 class="page-title">${t("nav.settings")}</h2>
      </header>

      <div class="settings-body">
        <!-- Account -->
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

        <!-- Location -->
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

        <!-- Notifications -->
        <section class="settings-section">
          <h3 class="settings-section-title">${t("settings.notifications")}</h3>
          ${[
            ["notif_new_post",       "settings.notif_new_post"],
            ["notif_new_chat",       "settings.notif_new_chat"],
          ].map(([key, label]) => `
            <div class="settings-toggle-row">
              <span class="settings-toggle-label">${t(label)}</span>
              <label class="toggle">
                <input type="checkbox" class="notif-toggle" data-key="${key}" id="toggle-${key}">
                <span class="toggle-track"></span>
              </label>
            </div>
          `).join("")}
        </section>

        <!-- Chat expiry -->
        <section class="settings-section">
          <h3 class="settings-section-title">${t("settings.chat_expiry")}</h3>
          <div class="settings-row">
            <label class="form-label" for="chat-expiry">${t("settings.chat_expiry")}</label>
            <div class="settings-inline">
              <input class="input input--sm" type="number" id="chat-expiry" min="1" max="30">
              <button class="btn btn--ghost btn--sm" id="chat-expiry-save">${t("action.save")}</button>
            </div>
            <div id="chat-expiry-error" class="error-msg"></div>
          </div>
        </section>

        <!-- Language -->
        <section class="settings-section">
          <h3 class="settings-section-title">Langue / Language</h3>
          <div class="settings-toggle-row">
            <button class="btn btn--ghost${I18N.lang === "fr" ? " btn--active" : ""}" data-lang="fr">Français</button>
            <button class="btn btn--ghost${I18N.lang === "en" ? " btn--active" : ""}" data-lang="en">English</button>
          </div>
        </section>

        <!-- Pro -->
        <section class="settings-section settings-section--pro">
          <h3 class="settings-section-title">${t("settings.pro")}</h3>
          <div id="pro-status"></div>
        </section>
      </div>
    </div>
  `;
}

async function initSettings() {
  const me = window.APP.me;
  if (!me) return;

  // Pre-fill username
  document.getElementById("settings-username").value = me.username;

  // Radius slider
  const slider = document.getElementById("radius-slider");
  const radiusLabel = document.getElementById("radius-value");
  slider.max = me.is_pro ? 10 : 5;
  slider.value = me.radius_minutes;
  radiusLabel.textContent = me.radius_minutes;

  slider.addEventListener("input", () => {
    radiusLabel.textContent = slider.value;
  });
  slider.addEventListener("change", async () => {
    const val = parseInt(slider.value);
    const res = await API.patchRadius(val);
    if (!res || !res.ok) {
      const msg = await parseError(res);
      document.getElementById("settings-radius-error").textContent = msg;
    } else {
      window.APP.me.radius_minutes = val;
      document.getElementById("settings-radius-error").textContent = "";
    }
  });

  // Notification toggles — prefill
  ["notif_new_post", "notif_new_chat"].forEach(key => {
    const el = document.getElementById(`toggle-${key}`);
    if (el) el.checked = !!me[key];
  });

  document.querySelectorAll(".notif-toggle").forEach(toggle => {
    toggle.addEventListener("change", async () => {
      const key = toggle.dataset.key;
      const val = toggle.checked;
      await API.patchNotifPrefs({ [key]: val });
    });
  });

  // Chat expiry
  const chatExpiryInput = document.getElementById("chat-expiry");
  chatExpiryInput.value = me.chat_expiry_days ?? 1;
  document.getElementById("chat-expiry-save")?.addEventListener("click", async () => {
    const errEl = document.getElementById("chat-expiry-error");
    errEl.textContent = "";
    const val = parseInt(chatExpiryInput.value, 10);
    if (!val || val < 1) return;
    const res = await API.patchChatExpiry(val);
    if (!res || !res.ok) {
      const msg = await parseError(res);
      errEl.textContent = msg;
    } else {
      window.APP.me.chat_expiry_days = val;
    }
  });

  // Username save
  document.getElementById("settings-username-save")?.addEventListener("click", async () => {
    const username = document.getElementById("settings-username").value.trim();
    const errEl = document.getElementById("settings-username-error");
    errEl.textContent = "";

    if (!username) return;
    const res = await API.patchUsername(username);
    if (!res || !res.ok) {
      const msg = await parseError(res);
      errEl.textContent = msg;
    } else {
      const data = await res.json();
      window.APP.me.username = data.username;
    }
  });

  // GPS location
  document.getElementById("location-update-btn")?.addEventListener("click", () => {
    const msgEl = document.getElementById("settings-location-msg");
    msgEl.textContent = "…";
    msgEl.className = "success-msg";

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const res = await API.patchLocation(pos.coords.latitude, pos.coords.longitude);
        msgEl.textContent = (res && res.ok) ? t("settings.location_update") : t("settings.location_error");
        if (!res || !res.ok) msgEl.className = "error-msg";
      },
      () => {
        msgEl.textContent = t("settings.location_error");
        msgEl.className = "error-msg";
      }
    );
  });

  // Pro status
  const proEl = document.getElementById("pro-status");
  if (me.is_pro) {
    proEl.innerHTML = `<span class="pro-badge">${t("profile.pro_badge")}</span>`;
  } else {
    proEl.innerHTML = `
      <p class="pro-desc">${t("settings.pro_desc")}</p>
      <a href="https://stripe.com/checkout" class="btn btn--primary btn--full" target="_blank">${t("settings.go_pro")}</a>
    `;
  }

  // Language toggle
  document.querySelectorAll("[data-lang]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const lang = btn.dataset.lang;
      await I18N.load(lang);
      // Re-render current page
      ROUTER.navigate(location.hash.slice(1) || "/feed");
    });
  });
}
