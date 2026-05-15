// app.js — SPA router + global state
// Full rewrite: hardened push flow, iPhone-safe logging, theme toggle, staff log page

// ── Log buffer — wraps console before any script runs ──────────────────────────
window.__LOGS = [];
(function () {
  const _log   = console.log.bind(console);
  const _warn  = console.warn.bind(console);
  const _error = console.error.bind(console);

  function capture(level, args) {
    const ts   = new Date().toISOString().slice(11, 23);
    const text = Array.from(args).map(a => {
      try { return typeof a === "object" ? JSON.stringify(a) : String(a); }
      catch { return "[unserializable]"; }
    }).join(" ");
    const line = "[" + ts + "] [" + level + "] " + text;
    window.__LOGS.push(line);
    if (window.__LOGS.length > 800) window.__LOGS.shift();
  }

  console.log   = function () { capture("LOG",   arguments); _log(...arguments);   };
  console.warn  = function () { capture("WARN",  arguments); _warn(...arguments);  };
  console.error = function () { capture("ERROR", arguments); _error(...arguments); };

  window.addEventListener("error", (e) => {
    capture("ERROR", ["[Uncaught] " + e.message + " @ " + e.filename + ":" + e.lineno]);
  });
  window.addEventListener("unhandledrejection", (e) => {
    capture("ERROR", ["[UnhandledPromise] " + String(e.reason)]);
  });
})();

// ── Global app state ───────────────────────────────────────────────────────────
window.APP = {
  jwt:     localStorage.getItem("jwt"),
  refresh: localStorage.getItem("refresh"),
  me:      null,
};

// ── Theme ──────────────────────────────────────────────────────────────────────
function toggleTheme() {
  const current = document.documentElement.dataset.theme || "dark";
  const next    = current === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  localStorage.setItem("theme", next);
  console.log("[Theme] switched to", next);
}
window.toggleTheme = toggleTheme;

function getCurrentTheme() {
  return document.documentElement.dataset.theme || "dark";
}
window.getCurrentTheme = getCurrentTheme;

// ── Routes ─────────────────────────────────────────────────────────────────────
const ROUTES = [
  { pattern: /^\/login$/,               page: "login"            },
  { pattern: /^\/feed$/,                page: "feed"             },
  { pattern: /^\/new-post$/,            page: "post-form"        },
  { pattern: /^\/chat$/,                page: "chat-list"        },
  { pattern: /^\/chat\/(\d+)$/,         page: "chat-detail"      },
  { pattern: /^\/profile$/,             page: "profile-self"     },
  { pattern: /^\/profile\/u\/([^/]+)$/, page: "profile-username" },
  { pattern: /^\/profile\/(\d+)$/,      page: "profile"          },
  { pattern: /^\/settings$/,            page: "settings"         },
];

// ── Router ─────────────────────────────────────────────────────────────────────
const ROUTER = {
  navigate(hash) {
    const path = hash.startsWith("/") ? hash : "/" + hash;
    console.log("[Router] navigate →", path, "| jwt:", !!window.APP.jwt);

    if (typeof stopChatPoll === "function") stopChatPoll();

    if (!window.APP.jwt && path !== "/login") {
      console.log("[Router] no jwt, redirecting to /login");
      location.hash = "#/login";
      return;
    }

    const match = ROUTES.find(r => r.pattern.test(path));
    if (!match) {
      console.log("[Router] unknown path, redirecting to /feed");
      location.hash = "#/feed";
      return;
    }

    const params  = path.match(match.pattern);
    let   id      = params ? params[1] : null;
    const main    = document.getElementById("app-main");
    const nav     = document.getElementById("app-nav");

    if (path === "/login") {
      nav.style.display = "none";
    } else {
      nav.style.display = "flex";
      renderNav();
    }

    const isChat = match.page === "chat-detail";
    main.style.overflow      = isChat ? "hidden" : "";
    main.style.paddingBottom = isChat ? "0"      : "";

    switch (match.page) {
      case "login":            main.innerHTML = renderLogin();          initLogin();            break;
      case "feed":             main.innerHTML = renderFeed();           initFeed();             break;
      case "post-form":        main.innerHTML = renderPostForm();       initPostForm();         break;
      case "chat-list":        main.innerHTML = renderChatList();       initChatList();         break;
      case "chat-detail":      main.innerHTML = renderChatDetail(id);  initChatDetail(id);     break;
      case "profile-self":
        if (!window.APP.me?.id) { location.hash = "#/login"; break; }
        id = window.APP.me.id;
        main.innerHTML = renderProfile(id);
        initProfile({ id, isSelf: true });
        break;
      case "profile-username": {
        const username = decodeURIComponent(id || "");
        main.innerHTML = renderProfile(username);
        initProfile({ username });
        break;
      }
      case "profile":          main.innerHTML = renderProfile(id);     initProfile({ id });    break;
      case "settings":         main.innerHTML = renderSettings();      initSettings();         break;
    }

    if (path !== "/login") renderNav();
  }
};
window.ROUTER = ROUTER;

// ── Utility helpers ────────────────────────────────────────────────────────────
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
  return window.matchMedia("(display-mode: standalone)").matches ||
         window.navigator.standalone === true;
}

function shouldShowInstallTip() {
  if (isStandalonePwa()) return false;
  if (!/iphone|ipad|ipod/i.test(navigator.userAgent)) return false;
  return true;
}

const SHARE_ICON_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" style="display:inline-block;vertical-align:middle;margin:0 2px"><path d="M12 3v13"/><polyline points="7 8 12 3 17 8"/><path d="M5 13v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6"/></svg>';

function showInstallTip() {
  if (!shouldShowInstallTip()) return;
  if (localStorage.getItem("install_tip_dismissed") === "1") return;
  if (document.getElementById("install-tip")) return;

  const banner = document.createElement("div");
  banner.id        = "install-tip";
  banner.className = "install-tip";
  banner.innerHTML =
    '<div class="install-tip__inner">' +
      '<div class="install-tip__text">' +
        '<strong class="install-tip__title">Open in Safari</strong>' +
        '<span class="install-tip__body">Tap ' + SHARE_ICON_SVG + ' Share &rarr; <strong>Add to Home Screen</strong> to install ByFoot</span>' +
      '</div>' +
      '<button class="install-tip__close" id="install-tip-dismiss" aria-label="Dismiss">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" width="16" height="16"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
      '</button>' +
    '</div>';
  document.body.prepend(banner);
  document.getElementById("install-tip-dismiss")?.addEventListener("click", () => {
    localStorage.setItem("install_tip_dismissed", "1");
    banner.remove();
  });
}

// ── Location ───────────────────────────────────────────────────────────────────
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
    (err) => { if (err?.code === 1) showLocationGate(); },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 600000 }
  );
}

function showLocationGate() {
  if (!window.APP.jwt) return;
  if (document.getElementById("location-gate")) return;
  const gate = document.createElement("div");
  gate.id        = "location-gate";
  gate.className = "location-gate";
  gate.innerHTML =
    '<div class="location-gate__card">' +
      '<h3 class="location-gate__title">' + t("location.required_title") + '</h3>' +
      '<p class="location-gate__text">'   + t("location.required_body")  + '</p>' +
      '<div class="location-gate__actions">' +
        '<button class="btn btn--primary btn--full" id="location-enable-btn">' + t("location.enable") + '</button>' +
      '</div>' +
      '<div class="error-msg" id="location-gate-error"></div>' +
    '</div>';
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
  document.getElementById("location-gate")?.remove();
}

// ── Staff logs panel ──────────────────────────────────────────────────────────
function showStaffLogs() {
  const existing = document.getElementById("staff-logs-panel");
  if (existing) { existing.remove(); return; }

  const panel = document.createElement("div");
  panel.id = "staff-logs-panel";
  panel.style.cssText =
    "position:fixed;inset:0;z-index:9999;background:#000;color:#0f0;" +
    "font-family:monospace;font-size:11px;overflow:auto;padding:16px;" +
    "white-space:pre-wrap;word-break:break-all";

  function buildContent() {
    return window.__LOGS.length ? window.__LOGS.join("\n") : "No logs yet.";
  }

  panel.innerHTML =
    '<div style="margin-bottom:10px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">' +
      '<span style="color:#fff;font-size:14px;font-weight:bold">Staff Logs</span>' +
      '<button id="slogs-copy"    style="padding:4px 12px;font-size:12px">Copy all</button>' +
      '<button id="slogs-clear"   style="padding:4px 12px;font-size:12px">Clear</button>' +
      '<button id="slogs-refresh" style="padding:4px 12px;font-size:12px">Refresh</button>' +
      '<button id="slogs-close"   style="padding:4px 12px;font-size:12px;margin-left:auto">✕ Close</button>' +
    '</div>' +
    '<div id="slogs-body">' + buildContent() + '</div>';

  document.body.appendChild(panel);

  document.getElementById("slogs-close").onclick   = () => panel.remove();
  document.getElementById("slogs-refresh").onclick = () => {
    document.getElementById("slogs-body").textContent = buildContent();
  };
  document.getElementById("slogs-clear").onclick   = () => {
    window.__LOGS = [];
    document.getElementById("slogs-body").textContent = "Cleared.";
  };
  document.getElementById("slogs-copy").onclick    = () => {
    const text = window.__LOGS.join("\n");
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => alert("Copied " + window.__LOGS.length + " lines."))
        .catch(() => alert("Clipboard write failed — try the fallback."));
    } else {
      // Fallback for iOS Safari in-app / non-HTTPS contexts
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.cssText = "position:fixed;top:0;left:0;opacity:0.01;width:1px;height:1px";
      document.body.appendChild(ta);
      ta.focus(); ta.select();
      try { document.execCommand("copy"); alert("Copied (fallback)."); }
      catch (e) { alert("Could not copy automatically. Select all and copy manually."); }
      ta.remove();
    }
  };
}
window.showStaffLogs = showStaffLogs;

// ── Push notifications (iPhone-hardened) ──────────────────────────────────────
//
// Key iPhone/Safari rules:
//  1. Notification.requestPermission() MUST be called from a direct user gesture.
//     → Only pass promptPermission:true when called from a button click handler.
//     → Never call with promptPermission:true from boot(), setTimeout, or async chains
//        that have broken away from the original gesture event loop turn.
//  2. getToken() needs a registered SW whose scope covers the page root ("/").
//  3. Every decision point is logged so staff can diagnose failures.
//
async function initPushNotifications({ promptPermission = false } = {}) {
  const tag = "[Push]";
  console.log(tag, "start",
    "| jwt:", !!window.APP.jwt,
    "| firebase:", typeof firebase !== "undefined",
    "| Notification:", typeof Notification !== "undefined" ? Notification.permission : "unavailable",
    "| serviceWorker:", "serviceWorker" in navigator,
    "| promptPermission:", promptPermission
  );

  if (!window.APP.jwt)                      { console.log(tag, "bail — no jwt");                               return; }
  if (typeof firebase === "undefined")       { console.error(tag, "bail — firebase SDK not loaded");            return; }
  if (!("serviceWorker" in navigator))       { console.warn(tag, "bail — serviceWorker not supported");         return; }
  if (typeof Notification === "undefined")   { console.warn(tag, "bail — Notification API unavailable");        return; }

  const perm = Notification.permission;
  console.log(tag, "Notification.permission:", perm);

  if (perm === "denied") {
    console.warn(tag, "bail — denied; user must reset in iOS Settings > Safari > Notifications");
    return;
  }

  if (perm !== "granted") {
    if (!promptPermission) {
      console.log(tag, "bail — not granted and promptPermission=false");
      return;
    }
    console.log(tag, "requesting permission (user-gesture context)…");
    let result;
    try {
      result = await Notification.requestPermission();
    } catch (err) {
      console.error(tag, "requestPermission() threw:", String(err));
      return;
    }
    console.log(tag, "requestPermission() →", result);
    if (result !== "granted") { console.log(tag, "bail — user did not grant"); return; }
  }

  // Fetch config from backend
  let config;
  try {
    console.log(tag, "fetching /push/config/…");
    const configRes = await API.getPushConfig();
    console.log(tag, "getPushConfig HTTP:", configRes.status);
    if (!configRes.ok) { console.error(tag, "bail — config fetch failed:", configRes.status); return; }
    config = await configRes.json();
    console.log(tag, "config ok — project:", config.project_id, "sender:", config.messaging_sender_id);
  } catch (err) {
    console.error(tag, "bail — config fetch threw:", String(err));
    return;
  }

  // Re-initialize Firebase clean
  try {
    if (firebase.apps.length) {
      console.log(tag, "deleting", firebase.apps.length, "existing Firebase app(s)…");
      await Promise.all(firebase.apps.map(a => a.delete()));
    }
    firebase.initializeApp({
      apiKey:            config.api_key,
      projectId:         config.project_id,
      messagingSenderId: config.messaging_sender_id,
      appId:             config.app_id,
    });
    console.log(tag, "Firebase app initialized");
  } catch (err) {
    console.error(tag, "bail — Firebase.initializeApp threw:", String(err));
    return;
  }

  // Register Service Worker
  let registration;
  try {
    const swParams = new URLSearchParams({
      apiKey:            config.api_key,
      projectId:         config.project_id,
      messagingSenderId: config.messaging_sender_id,
      appId:             config.app_id,
    });
    const swUrl = "/firebase-messaging-sw.js?" + swParams.toString();
    console.log(tag, "registering SW:", swUrl.slice(0, 80) + "…");
    registration = await navigator.serviceWorker.register(swUrl, { scope: "/" });
    console.log(tag, "SW registered, awaiting ready…");
    await navigator.serviceWorker.ready;
    console.log(tag, "SW ready — active state:", registration.active?.state);
  } catch (err) {
    // Common iPhone failure: content blocker prevents SW
    // err.code: "messaging/failed-service-worker-registration"
    console.error(tag, "bail — SW registration threw:", err?.code || String(err));
    return;
  }

  // Get FCM token
  let token;
  try {
    const messaging = firebase.messaging();

    messaging.onMessage((payload) => {
      console.log(tag, "foreground message:", payload?.notification?.title);
      const title = payload?.notification?.title || "ByFoot";
      const body  = payload?.notification?.body  || "";
      if (Notification.permission === "granted") {
        new Notification(title, { body, icon: "/assets/favicon.png" });
      }
    });

    console.log(tag, "calling getToken — vapidKey present:", !!config.vapid_key,
      "| vapidKey prefix:", config.vapid_key ? config.vapid_key.slice(0, 8) + "…" : "MISSING");
    token = await messaging.getToken({
      vapidKey:                  config.vapid_key,
      serviceWorkerRegistration: registration,
    });

    if (!token) {
      console.warn(tag, "getToken returned empty.",
        "Likely causes: VAPID key mismatch, SW scope issue, or browser blocking FCM.");
      return;
    }
    console.log(tag, "token:", token.slice(0, 20) + "…");
  } catch (err) {
    console.error(tag, "getToken threw:", err?.code || err?.message || String(err));
    return;
  }

  // Save token
  window.APP.pushToken = token;
  localStorage.setItem("push_token", token);

  try {
    const res = await API.patchPushToken(token);
    if (res && res.ok) {
      console.log(tag, "token saved to server ✓");
    } else {
      console.error(tag, "patchPushToken failed — HTTP", res?.status);
    }
  } catch (err) {
    console.error(tag, "patchPushToken threw:", String(err));
  }
}

// ── Boot ──────────────────────────────────────────────────────────────────────
async function boot() {
  console.log("[Boot] start — jwt present:", !!window.APP.jwt, "| UA:", navigator.userAgent.slice(0, 80));
  await I18N.init();

  if (window.APP.jwt) {
    try {
      const res = await API.getMe();
      if (res && res.ok) {
        window.APP.me = await res.json();
        console.log("[Boot] /me/ ok — username:", window.APP.me?.username,
          "| is_staff:", window.APP.me?.is_staff,
          "| has_location:", window.APP.me?.lat != null);
        // No promptPermission at boot — Safari requires a real user gesture
        initPushNotifications({ promptPermission: false });
        if (window.APP.me?.lat == null) requestAndStoreLocation();
      } else {
        console.warn("[Boot] /me/ returned", res?.status, "— logging out");
        logout();
        return;
      }
    } catch (err) {
      console.warn("[Boot] /me/ threw (offline?):", String(err));
    }
  }

  const hash = location.hash.slice(1) || "/feed";
  console.log("[Boot] routing to", hash);
  ROUTER.navigate(hash);
  showInstallTip();

  window.addEventListener("hashchange", () => {
    ROUTER.navigate(location.hash.slice(1) || "/feed");
    showInstallTip();
  });

  console.log("[Boot] done");
}

document.addEventListener("DOMContentLoaded", boot);
