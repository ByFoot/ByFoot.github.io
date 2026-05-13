// pages/settings.js - render only

function renderSettings() {
  return `
    <div class="page settings-page">
      <header class="page-header">
        <h2 class="page-title">${t("nav.settings")}</h2>
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
            <label class="form-label">${t("settings.radius")}: <span id="radius-value">…</span> ${t("settings.minutes")}</label>
            <input type="range" id="radius-slider" class="slider" min="0" max="5" step="1" value="3">
            <div id="settings-radius-error" class="error-msg"></div>
          </div>
          <div class="settings-row">
            <button class="btn btn--ghost btn--full" id="location-update-btn">${t("settings.location")}</button>
            <div id="settings-location-display" class="settings-location-display"></div>
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
            <p class="settings-hint">${t("settings.chat_expiry_hint")}</p>
            <div class="settings-inline">
              <input class="input input--sm" type="number" id="chat-expiry" min="1" max="30">
              <span class="settings-unit">${t("settings.days")}</span>
              <button class="btn btn--ghost btn--sm" id="chat-expiry-save">${t("action.save")}</button>
            </div>
            <div id="chat-expiry-error" class="error-msg"></div>
          </div>
        </section>
        <section class="settings-section">
          <h3 class="settings-section-title">Langue / Language</h3>
          <div class="settings-toggle-row">
            <button class="btn btn--ghost btn--sm" data-lang="fr">Français</button>
            <button class="btn btn--ghost btn--sm" data-lang="en">English</button>
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
            ${t("action.logout")}
          </button>
        </section>
      </div>
    </div>
  `;
}