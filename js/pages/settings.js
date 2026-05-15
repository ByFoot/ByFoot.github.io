// pages/settings.js — render only (full rewrite)

function renderSettings() {
  const me        = window.APP.me;
  const isStaff   = !!me?.is_staff;
  const isDark    = getCurrentTheme() === "dark";

  const moonIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  const sunIcon  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
  const logIcon  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>';

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
              <input class="input input--sm" type="text" id="settings-username" placeholder="username" autocomplete="off" autocapitalize="none">
              <button class="btn btn--ghost btn--sm" id="settings-username-save">${t("action.save")}</button>
            </div>
            <div id="settings-username-error" class="error-msg"></div>
          </div>
        </section>

        <!-- Location -->
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

        <!-- Notifications -->
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

        <!-- Appearance -->
        <section class="settings-section">
          <h3 class="settings-section-title">${t("settings.appearance") || "Appearance"}</h3>
          <div class="settings-toggle-row">
            <span class="settings-toggle-label">
              ${isDark ? moonIcon : sunIcon}
            </span>
            <label class="toggle" id="theme-toggle-label">
              <input type="checkbox" id="theme-toggle" ${isDark ? "checked" : ""}>
              <span class="toggle-track"></span>
            </label>
          </div>
        </section>

        <!-- Chat expiry -->
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

        <!-- Language -->
        <section class="settings-section">
          <h3 class="settings-section-title">Langue / Language</h3>
          <div class="settings-toggle-row">
            <button class="btn btn--ghost btn--sm" data-lang="fr">Français</button>
            <button class="btn btn--ghost btn--sm" data-lang="en">English</button>
          </div>
        </section>

        <!-- Pro -->
        <section class="settings-section settings-section--pro">
          <h3 class="settings-section-title">${t("settings.pro")}</h3>
          <div id="pro-status"></div>
        </section>

        <!-- Staff tools (only visible to is_staff users) -->
        ${isStaff ? `
        <section class="settings-section">
          <h3 class="settings-section-title" style="color:var(--accent)">Staff</h3>
          <button class="btn btn--ghost btn--full" id="staff-logs-btn">
            ${logIcon}
            View debug logs
          </button>
        </section>
        ` : ""}

        <!-- Source / Contact -->
        <section class="settings-section">
          <a href="https://github.com/ByFoot/ByFoot.github.io" target="_blank" rel="noopener" class="settings-text-link">Code source / Contact</a>
        </section>

        <!-- Logout -->
        <section class="settings-section">
          <button class="btn btn--danger btn--full" id="logout-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            ${t("action.logout")}
          </button>
        </section>

      </div>
    </div>
  `;
}