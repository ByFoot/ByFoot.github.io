// app.js - SPA router + global state

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
  { pattern: /^\/profile\/u\/([^/]+)$/, page: "profile-username" },
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
    const isChat = match.page === "chat-detail";
    main.style.overflow = isChat ? "hidden" : "";
    main.style.paddingBottom = isChat ? "0" : "";
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
        main.innerHTML = renderProfile(id);        initProfile({ id, isSelf: true });        break;
      case "profile-username": {
        const username = decodeURIComponent(id || "");
        main.innerHTML = renderProfile(username);        initProfile({ username });        break;
      }
      case "profile":     main.innerHTML = renderProfile(id);        initProfile({ id });        break;
      case "settings":    main.innerHTML = renderSettings();         initSettings();         break;
    }

    // Update nav active state after render
    if (path !== "/login") renderNav();
  }
};

window.ROUTER = ROUTER;

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

const SHARE_ICON_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" style="display:inline-block;vertical-align:middle;margin:0 2px"><path d="M12 3v13"/><polyline points="7 8 12 3 17 8"/><path d="M5 13v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6"/></svg>`;

function showInstallTip() {
  if (!shouldShowInstallTip()) return;
  if (localStorage.getItem("install_tip_dismissed") === "1") return;

  let banner = document.getElementById("install-tip");
  if (banner) return;

  banner = document.createElement("div");
  banner.id = "install-tip";
  banner.className = "install-tip";
  banner.innerHTML = `
    <div class="install-tip__inner">
      <div class="install-tip__text">
        <strong class="install-tip__title">Open in Safari</strong>
        <span class="install-tip__body">Tap ${SHARE_ICON_SVG} Share &rarr; <strong>Add to Home Screen</strong> to install ByFoot</span>
      </div>
      <button class="install-tip__close" id="install-tip-dismiss" aria-label="Dismiss">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" width="16" height="16"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  `;
  document.body.prepend(banner);

  document.getElementById("install-tip-dismiss")?.addEventListener("click", () => {
    localStorage.setItem("install_tip_dismissed", "1");
    banner.remove();
  });
}

// Request location from the OS (triggers native prompt if needed),
// patch the server if we got a new/moved fix, store coords in APP.me.
function requestAndStoreLocation({ force = false, onSuccess = null } = {}) {
  if (!window.APP.jwt || !navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude, longitude } = pos.coords;
      const me = window.APP.me;
      const needsPatch = force || me?.lat == null || me?.lng == null ||
        Math.abs(latitude - me.lat) > 0.002 || Math.abs(longitude - me.lng) > 0.002;
      if (needsPatch) {
        const res = await API.patchLocation(latitude, longitude);
        if (!res || !res.ok) return;
      }
      window.APP.me = me || {};
      window.APP.me.lat = latitude;
      window.APP.me.lng = longitude;
      hideLocationGate();
      if (onSuccess) onSuccess(latitude, longitude);
    },
    (err) => {
      // code 1 = user denied in OS — show the in-app gate
      if (err?.code === 1) showLocationGate();
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 600000 }
  );
}

function showLocationGate() {
  if (!window.APP.jwt) return;
  if (document.getElementById("location-gate")) return;
  const gate = document.createElement("div");
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
  if (navigator.permissions) {
    navigator.permissions.query({ name: "geolocation" }).then(status => {
      status.addEventListener("change", () => {
        if (status.state === "granted") requestAndStoreLocation();
      });
    }).catch(() => {});
  }
  document.getElementById("location-enable-btn")
    ?.addEventListener("click", () => requestAndStoreLocation(), { once: true });
}

function hideLocationGate() {
  const gate = document.getElementById("location-gate");
  if (gate) gate.remove();
}



async function initPushNotifications({ promptPermission = false } = {}) {
  if (!window.APP.jwt) return;
  if (typeof firebase === 'undefined') return;
  if (!navigator.serviceWorker) return;
  if (!window.Notification) return;
  if (Notification.permission === "denied") return;
  if (Notification.permission !== "granted") {
    if (!promptPermission) return;
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;
  }

  const configRes = await API.getPushConfig();
  if (!configRes.ok) return;
  const config = await configRes.json();

  // Delete any stale Firebase app (e.g. initialized without config on a
  // previous boot) then always reinitialize with the fresh config from the API.
  if (firebase.apps.length) {
    await Promise.all(firebase.apps.map(a => a.delete()));
  }
  firebase.initializeApp({
    apiKey: config.api_key,
    projectId: config.project_id,
    messagingSenderId: config.messaging_sender_id,
    appId: config.app_id,
  });

  try {
    // Pass Firebase config as query params so the SW can initialize
    // synchronously (required by the browser for push/notificationclick handlers).
    // Config still lives server-side — fetched above from /push/config/.
    const swParams = new URLSearchParams({
      apiKey:            config.api_key,
      projectId:         config.project_id,
      messagingSenderId: config.messaging_sender_id,
      appId:             config.app_id,
    });
    const registration = await navigator.serviceWorker.register(
      `/firebase-messaging-sw.js?${swParams}`
    );
    await navigator.serviceWorker.ready;

    const messaging = firebase.messaging();

    // Show notification when tab is foregrounded
    messaging.onMessage((payload) => {
      const title = payload?.notification?.title || "ByFoot";
      const body = payload?.notification?.body || "";
      if (Notification.permission === "granted") {
        new Notification(title, { body, icon: "/assets/favicon.png" });
      }
    });

    const token = await messaging.getToken({
      vapidKey: config.vapid_key,
      serviceWorkerRegistration: registration, // already registered with correct config
    });

    if (!token) {
      console.warn("[Push] getToken returned empty — check VAPID key and SW scope");
      return;
    }

    window.APP.pushToken = token;
    localStorage.setItem("push_token", token);

    const res = await API.patchPushToken(token);
    if (res && res.ok) {
    } else {
      console.error("[Push] patchPushToken failed:", res?.status);
    }
  } catch (err) {
    console.error("[Push] initPushNotifications error:", err);
  }
}

// ── Boot ──────────────────────────────────────────────────────────────────────
async function boot() {
  await I18N.init();

  if (window.APP.jwt) {
    try {
      const res = await API.getMe();
      if (res && res.ok) {
        window.APP.me = await res.json();
        initPushNotifications({ promptPermission: false });
      } else {
        logout();
        return;
      }
    } catch {
      // API unreachable - still allow boot for dev
    }
  }

  // Handle initial hash
  const hash = location.hash.slice(1) || "/feed";
  ROUTER.navigate(hash);
  showInstallTip();

  // Request location once on boot if server doesn't have it yet.
  // getCurrentPosition triggers the OS prompt naturally — no probing needed.
  if (window.APP.jwt && window.APP.me?.lat == null) {
    requestAndStoreLocation();
  }

  // Listen for hash changes
  window.addEventListener("hashchange", () => {
    ROUTER.navigate(location.hash.slice(1) || "/feed");
    showInstallTip();
    // Request location if not yet set — fires naturally after login/navigation
    if (window.APP.jwt && window.APP.me?.lat == null) {
      requestAndStoreLocation();
    }
    // Register push listener on first navigation after login
    if (window.APP.jwt && window.Notification && Notification.permission === "default") {
      document.addEventListener("click", function askPush() {
        document.removeEventListener("click", askPush);
        initPushNotifications({ promptPermission: true });
      }, { once: true });
    }
  });

  // Request push permission on the next user tap after login.
  // iOS requires Notification.requestPermission() inside a direct gesture —
  // a once-only document listener is the least intrusive way to catch one.
  if (window.APP.jwt && window.Notification && Notification.permission === "default") {
    document.addEventListener("click", function askPush() {
      document.removeEventListener("click", askPush);
      initPushNotifications({ promptPermission: true });
    }, { once: true });
  }
}

document.addEventListener("DOMContentLoaded", boot);