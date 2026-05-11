// app.js — SPA router + global state

window.APP = {
  jwt:     localStorage.getItem("jwt"),
  refresh: localStorage.getItem("refresh"),
  me:      null,
};

const ROUTES = [
  { pattern: /^\/login$/,           page: "login"       },
  { pattern: /^\/feed$/,            page: "feed"        },
  { pattern: /^\/new-post$/,        page: "post-form"   },
  { pattern: /^\/chat$/,            page: "chat-list"   },
  { pattern: /^\/chat\/(\d+)$/,     page: "chat-detail" },
  { pattern: /^\/profile$/,         page: "profile-self" },
  { pattern: /^\/profile\/(\d+)$/,  page: "profile"     },
  { pattern: /^\/settings$/,        page: "settings"    },
];

const ROUTER = {
  navigate(hash) {
    const path = hash.startsWith("/") ? hash : "/" + hash;

    // Cleanup poll if leaving chat
    if (typeof stopChatPoll === "function") stopChatPoll();

    // Auth guard
    if (!window.APP.jwt && path !== "/login") {
      location.hash = "#/login";
      return;
    }

    const match = ROUTES.find(r => r.pattern.test(path));
    if (!match) {
      location.hash = "#/feed";
      return;
    }

    const params = path.match(match.pattern);
    let id = params ? params[1] : null;

    const main = document.getElementById("app-main");
    const nav  = document.getElementById("app-nav");

    // Show/hide nav
    if (path === "/login") {
      nav.style.display = "none";
    } else {
      nav.style.display = "flex";
      renderNav();
    }

    // Render page
    switch (match.page) {
      case "login":       main.innerHTML = renderLogin();            initLogin();            break;
      case "feed":        main.innerHTML = renderFeed();             initFeed();             break;
      case "post-form":   main.innerHTML = renderPostForm();         initPostForm();         break;
      case "chat-list":   main.innerHTML = renderChatList();         initChatList();         break;
      case "chat-detail": main.innerHTML = renderChatDetail(id);    initChatDetail(id);     break;
      case "profile-self":
        if (!window.APP.me?.id) {
          location.hash = "#/login";
          break;
        }
        id = window.APP.me.id;
        main.innerHTML = renderProfile(id);        initProfile(id);        break;
      case "profile":     main.innerHTML = renderProfile(id);        initProfile(id);        break;
      case "settings":    main.innerHTML = renderSettings();         initSettings();         break;
    }

    // Update nav active state after render
    if (path !== "/login") renderNav();
  }
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function showError(containerEl, msg) {
  if (!containerEl) return;
  let el = containerEl.querySelector(".error-msg");
  if (!el) {
    el = document.createElement("div");
    el.className = "error-msg";
    containerEl.appendChild(el);
  }
  el.textContent = msg;
}

function isStandalonePwa() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function shouldShowInstallTip() {
  if (isStandalonePwa()) return false;
  if (!/iphone|ipad|ipod/i.test(navigator.userAgent)) return false;
  return true;
}

function showInstallTip() {
  if (!shouldShowInstallTip()) return;
  if (localStorage.getItem("install_tip_dismissed") === "1") return;

  let banner = document.getElementById("install-tip");
  if (banner) return;

  banner = document.createElement("div");
  banner.id = "install-tip";
  banner.className = "install-tip";
  banner.innerHTML = `
    <div class="install-tip__content">
      <div class="install-tip__text">
        <strong>${t("install.tip_title")}</strong>
        <span>${t("install.tip_body")}</span>
      </div>
      <button class="btn btn--ghost btn--sm" id="install-tip-dismiss">${t("install.tip_dismiss")}</button>
    </div>
  `;
  document.body.appendChild(banner);

  document.getElementById("install-tip-dismiss")?.addEventListener("click", () => {
    localStorage.setItem("install_tip_dismissed", "1");
    banner.remove();
  });
}

function hasLocation() {
  const me = window.APP.me;
  if (me?.lat != null && me?.lng != null) return true;
  return localStorage.getItem("has_location") === "1";
}

function ensureLocationGate() {
  if (!window.APP.jwt) {
    hideLocationGate();
    return;
  }

  if (hasLocation()) {
    hideLocationGate();
    return;
  }

  let gate = document.getElementById("location-gate");
  if (!gate) {
    gate = document.createElement("div");
    gate.id = "location-gate";
    gate.className = "location-gate";
    gate.innerHTML = `
      <div class="location-gate__card">
        <h3 class="location-gate__title">${t("location.required_title")}</h3>
        <p class="location-gate__text">${t("location.required_body")}</p>
        <div class="location-gate__actions">
          <button class="btn btn--primary btn--full" id="location-enable-btn">${t("location.enable")}</button>
        </div>
        <div class="error-msg" id="location-gate-error"></div>
      </div>
    `;
    document.body.appendChild(gate);
  }

  document.getElementById("location-enable-btn")?.addEventListener("click", requestLocationOnce, { once: true });
}

function hideLocationGate() {
  const gate = document.getElementById("location-gate");
  if (gate) gate.remove();
}

function requestLocationOnce() {
  const errorEl = document.getElementById("location-gate-error");
  if (errorEl) errorEl.textContent = "";

  if (!navigator.geolocation) {
    if (errorEl) errorEl.textContent = t("location.error");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const res = await API.patchLocation(pos.coords.latitude, pos.coords.longitude);
      if (res && res.ok) {
        window.APP.me = window.APP.me || {};
        window.APP.me.lat = pos.coords.latitude;
        window.APP.me.lng = pos.coords.longitude;
        localStorage.setItem("has_location", "1");
        hideLocationGate();
      } else if (errorEl) {
        const msg = res ? await parseError(res) : t("error.generic");
        errorEl.textContent = msg;
        document.getElementById("location-enable-btn")?.addEventListener("click", requestLocationOnce, { once: true });
      }
    },
    (err) => {
      if (!errorEl) return;
      if (err?.code === 1) {
        errorEl.textContent = t("location.denied");
      } else {
        errorEl.textContent = t("location.error");
      }
      document.getElementById("location-enable-btn")?.addEventListener("click", requestLocationOnce, { once: true });
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

async function initPushNotifications({ promptPermission = false } = {}) {
  if (!window.APP.jwt) return;
  if (!window.firebase?.messaging || !navigator.serviceWorker || !window.Notification) return;

  if (Notification.permission === "denied") return;
  if (Notification.permission !== "granted") {
    if (!promptPermission) return;
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;
  }

  const configRes = await API.getPushConfig();
  if (!configRes.ok) return;
  const config = await configRes.json();

  if (!firebase.apps.length) {
    firebase.initializeApp({
      apiKey: config.api_key,
      projectId: config.project_id,
      messagingSenderId: config.messaging_sender_id,
      appId: config.app_id,
    });
  }

  const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
  const messaging = firebase.messaging();
  const token = await messaging.getToken({
    vapidKey: config.vapid_key,
    serviceWorkerRegistration: registration,
  });

  if (!token) return;
  window.APP.pushToken = token;
  localStorage.setItem("push_token", token);
  await API.patchPushToken(token);
}

// ── Boot ──────────────────────────────────────────────────────────────────────
async function boot() {
  await I18N.init();

  if (window.APP.jwt) {
    try {
      const res = await API.getMe();
      if (res && res.ok) {
        window.APP.me = await res.json();
        if (window.APP.me?.lat != null && window.APP.me?.lng != null) {
          localStorage.setItem("has_location", "1");
        }
        initPushNotifications({ promptPermission: false });
      } else {
        logout();
        return;
      }
    } catch {
      // API unreachable — still allow boot for dev
    }
  }

  // Handle initial hash
  const hash = location.hash.slice(1) || "/feed";
  ROUTER.navigate(hash);
  showInstallTip();
  ensureLocationGate();

  // Listen for hash changes
  window.addEventListener("hashchange", () => {
    ROUTER.navigate(location.hash.slice(1) || "/feed");
    showInstallTip();
    ensureLocationGate();
  });
}

document.addEventListener("DOMContentLoaded", boot);
