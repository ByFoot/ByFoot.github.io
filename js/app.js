// app.js — SPA router + global state
// Full rewrite: hardened push flow, iPhone-safe logging, theme toggle, staff log drawer

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
    window.__LOGS.push({ ts, level, text });
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
      location.hash = "#/login";
      return;
    }

    const match = ROUTES.find(r => r.pattern.test(path));
    if (!match) { location.hash = "#/feed"; return; }

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
      case "profile":    main.innerHTML = renderProfile(id);   initProfile({ id });  break;
      case "settings":   main.innerHTML = renderSettings();    initSettings();       break;
    }

    if (path !== "/login") renderNav();
  }
};
window.ROUTER = ROUTER;

// ── Utility ────────────────────────────────────────────────────────────────────
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

// ── Push permission banner (like install-tip, shown once after login) ──────────
// Shows a dismissible banner asking to enable notifications for chats.
// Tapping "Enable" triggers the actual permission request (user-gesture safe).
function showPushBanner() {
  if (typeof Notification === "undefined") return;
  if (Notification.permission !== "default") return;          // already granted or denied
  if (localStorage.getItem("push_banner_dismissed") === "1") return;
  if (document.getElementById("push-banner")) return;

  const BELL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" style="display:inline-block;vertical-align:middle;flex-shrink:0"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>';

  const banner = document.createElement("div");
  banner.id        = "push-banner";
  banner.className = "install-tip"; // reuse the same slide-in style
  banner.innerHTML =
    '<div class="install-tip__inner">' +
      '<div class="install-tip__text">' +
        '<strong class="install-tip__title">' + BELL + ' Chat notifications</strong>' +
        '<span class="install-tip__body">Get notified when neighbours message you.</span>' +
      '</div>' +
      '<button class="btn btn--primary btn--sm" id="push-banner-enable" style="flex-shrink:0">Enable</button>' +
      '<button class="install-tip__close" id="push-banner-dismiss" aria-label="Dismiss">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" width="16" height="16"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
      '</button>' +
    '</div>';

  document.body.prepend(banner);

  document.getElementById("push-banner-dismiss")?.addEventListener("click", () => {
    localStorage.setItem("push_banner_dismissed", "1");
    banner.remove();
  });

  // This click IS the user gesture — safe to call requestPermission here
  document.getElementById("push-banner-enable")?.addEventListener("click", async () => {
    console.log("[PushBanner] Enable tapped — calling initPushNotifications(promptPermission:true)");
    localStorage.setItem("push_banner_dismissed", "1");
    banner.remove();
    await initPushNotifications({ promptPermission: true });
  });
}
window.showPushBanner = showPushBanner;

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
function hideLocationGate() { document.getElementById("location-gate")?.remove(); }

// ── Staff logs — bottom drawer ─────────────────────────────────────────────────
function showStaffLogs() {
  // Toggle: if already open, close it
  const existing = document.getElementById("staff-logs-drawer");
  if (existing) { existing.remove(); return; }

  const LEVEL_COLOR = { LOG: "#0f0", WARN: "#fa0", ERROR: "#f55" };

  function buildRows() {
    if (!window.__LOGS.length) return '<div style="color:#666;padding:8px">No logs yet.</div>';
    return window.__LOGS.map((entry, i) => {
      const color = LEVEL_COLOR[entry.level] || "#0f0";
      return '<div class="slog-row" style="border-bottom:1px solid #111;padding:5px 0">' +
        '<span style="color:#555;font-size:10px;user-select:none">' + (i + 1) + ' </span>' +
        '<span style="color:#666">[' + entry.ts + '] </span>' +
        '<span style="color:' + color + ';font-weight:bold">[' + entry.level + '] </span>' +
        '<span style="color:#ddd">' + entry.text.replace(/</g, "&lt;") + '</span>' +
      '</div>';
    }).join("");
  }

  const drawer = document.createElement("div");
  drawer.id = "staff-logs-drawer";
  drawer.style.cssText =
    "position:fixed;bottom:0;left:0;right:0;z-index:9999;" +
    "height:65dvh;" +
    "background:#0a0a0a;border-top:2px solid #e8820c;" +
    "display:flex;flex-direction:column;" +
    "font-family:monospace;font-size:11px;" +
    "border-radius:16px 16px 0 0;" +
    "box-shadow:0 -8px 40px rgba(0,0,0,.8);" +
    "animation:logsSlideUp 0.22s ease";

  // Inject keyframe once
  if (!document.getElementById("staff-logs-kf")) {
    const st = document.createElement("style");
    st.id = "staff-logs-kf";
    st.textContent = "@keyframes logsSlideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}";
    document.head.appendChild(st);
  }

  drawer.innerHTML =
    '<div style="padding:10px 14px;display:flex;align-items:center;gap:8px;border-bottom:1px solid #222;flex-shrink:0">' +
      '<span style="color:#e8820c;font-size:13px;font-weight:bold">Staff Logs</span>' +
      '<span id="slog-count" style="color:#555;font-size:11px">' + window.__LOGS.length + ' entries</span>' +
      '<button id="slogs-refresh" style="margin-left:auto;padding:3px 10px;font-size:11px;background:#1a1a1a;color:#aaa;border:1px solid #333;border-radius:6px;cursor:pointer">Refresh</button>' +
      '<button id="slogs-copy"    style="padding:3px 10px;font-size:11px;background:#1a1a1a;color:#aaa;border:1px solid #333;border-radius:6px;cursor:pointer">Copy</button>' +
      '<button id="slogs-clear"   style="padding:3px 10px;font-size:11px;background:#1a1a1a;color:#aaa;border:1px solid #333;border-radius:6px;cursor:pointer">Clear</button>' +
      '<button id="slogs-close"   style="padding:3px 10px;font-size:11px;background:#333;color:#fff;border:1px solid #555;border-radius:6px;cursor:pointer;font-weight:bold">✕</button>' +
    '</div>' +
    '<div id="slogs-body" style="flex:1;overflow-y:auto;padding:8px 14px;word-break:break-all">' +
      buildRows() +
    '</div>';

  document.body.appendChild(drawer);

  function refresh() {
    document.getElementById("slogs-body").innerHTML = buildRows();
    document.getElementById("slog-count").textContent = window.__LOGS.length + " entries";
    // Scroll to bottom
    const body = document.getElementById("slogs-body");
    body.scrollTop = body.scrollHeight;
  }

  document.getElementById("slogs-close").onclick   = () => drawer.remove();
  document.getElementById("slogs-refresh").onclick = refresh;
  document.getElementById("slogs-clear").onclick   = () => {
    window.__LOGS = [];
    refresh();
  };
  document.getElementById("slogs-copy").onclick    = () => {
    const text = window.__LOGS.map(e => "[" + e.ts + "] [" + e.level + "] " + e.text).join("\n");
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => alert("Copied " + window.__LOGS.length + " lines."))
        .catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
  };

  // Auto-scroll to bottom on open
  setTimeout(() => {
    const body = document.getElementById("slogs-body");
    if (body) body.scrollTop = body.scrollHeight;
  }, 50);
}
window.showStaffLogs = showStaffLogs;

function fallbackCopy(text) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.cssText = "position:fixed;top:0;left:0;opacity:0.01;width:1px;height:1px";
  document.body.appendChild(ta);
  ta.focus(); ta.select();
  try { document.execCommand("copy"); alert("Copied (fallback)."); }
  catch { alert("Auto-copy failed — select all text manually."); }
  ta.remove();
}

// ── Push notifications (iPhone-hardened) ──────────────────────────────────────
async function initPushNotifications({ promptPermission = false } = {}) {
  const tag = "[Push]";
  console.log(tag, "start | jwt:", !!window.APP.jwt,
    "| firebase:", typeof firebase !== "undefined",
    "| Notification:", typeof Notification !== "undefined" ? Notification.permission : "unavailable",
    "| serviceWorker:", "serviceWorker" in navigator,
    "| promptPermission:", promptPermission);

  if (!window.APP.jwt)                    { console.log(tag, "bail — no jwt");                      return; }
  if (typeof firebase === "undefined")     { console.error(tag, "bail — firebase SDK not loaded");   return; }
  if (!("serviceWorker" in navigator))     { console.warn(tag, "bail — serviceWorker unsupported");  return; }
  if (typeof Notification === "undefined") { console.warn(tag, "bail — Notification unavailable");   return; }

  const perm = Notification.permission;
  if (perm === "denied") { console.warn(tag, "bail — denied; reset in iOS Settings > Safari"); return; }

  if (perm !== "granted") {
    if (!promptPermission) { console.log(tag, "bail — not granted and promptPermission=false"); return; }
    console.log(tag, "requesting permission…");
    let result;
    try { result = await Notification.requestPermission(); }
    catch (err) { console.error(tag, "requestPermission threw:", String(err)); return; }
    console.log(tag, "permission result:", result);
    if (result !== "granted") return;
  }

  let config;
  try {
    console.log(tag, "fetching /push/config/…");
    const configRes = await API.getPushConfig();
    console.log(tag, "getPushConfig HTTP:", configRes.status);
    if (!configRes.ok) { console.error(tag, "bail — config HTTP", configRes.status); return; }
    config = await configRes.json();
    console.log(tag, "config ok — project:", config.project_id);
  } catch (err) { console.error(tag, "bail — config threw:", String(err)); return; }

  try {
    if (firebase.apps.length) {
      console.log(tag, "deleting", firebase.apps.length, "existing Firebase app(s)…");
      await Promise.all(firebase.apps.map(a => a.delete()));
    }
    firebase.initializeApp({
      apiKey: config.api_key, projectId: config.project_id,
      messagingSenderId: config.messaging_sender_id, appId: config.app_id,
    });
    console.log(tag, "Firebase initialized");
  } catch (err) { console.error(tag, "bail — Firebase init threw:", String(err)); return; }

  let registration;
  try {
    const swParams = new URLSearchParams({
      apiKey: config.api_key, projectId: config.project_id,
      messagingSenderId: config.messaging_sender_id, appId: config.app_id,
    });
    const swUrl = "/firebase-messaging-sw.js?" + swParams;
    console.log(tag, "registering SW…");
    registration = await navigator.serviceWorker.register(swUrl, { scope: "/" });
    await navigator.serviceWorker.ready;
    console.log(tag, "SW ready — state:", registration.active?.state);
  } catch (err) { console.error(tag, "bail — SW threw:", err?.code || String(err)); return; }

  let token;
  try {
    const messaging = firebase.messaging();
    messaging.onMessage((payload) => {
      console.log(tag, "foreground message:", payload?.notification?.title);
      if (Notification.permission === "granted") {
        new Notification(payload?.notification?.title || "ByFoot", {
          body: payload?.notification?.body || "", icon: "/assets/favicon.png",
        });
      }
    });
    console.log(tag, "calling getToken — vapidKey present:", !!config.vapid_key);
    token = await messaging.getToken({ vapidKey: config.vapid_key, serviceWorkerRegistration: registration });
    if (!token) { console.warn(tag, "getToken returned empty — VAPID mismatch or SW blocked"); return; }
    console.log(tag, "token:", token.slice(0, 20) + "…");
  } catch (err) { console.error(tag, "getToken threw:", err?.code || err?.message || String(err)); return; }

  window.APP.pushToken = token;
  localStorage.setItem("push_token", token);
  try {
    const res = await API.patchPushToken(token);
    if (res && res.ok) { console.log(tag, "token saved ✓"); }
    else { console.error(tag, "patchPushToken failed — HTTP", res?.status); }
  } catch (err) { console.error(tag, "patchPushToken threw:", String(err)); }
}

// ── Boot ──────────────────────────────────────────────────────────────────────
async function boot() {
  console.log("[Boot] start | jwt:", !!window.APP.jwt);
  await I18N.init();

  if (window.APP.jwt) {
    try {
      const res = await API.getMe();
      if (res && res.ok) {
        window.APP.me = await res.json();
        console.log("[Boot] /me/ ok — user:", window.APP.me?.username,
          "| is_staff:", window.APP.me?.is_staff);
        initPushNotifications({ promptPermission: false });
        if (window.APP.me?.lat == null) requestAndStoreLocation();
      } else {
        console.warn("[Boot] /me/ →", res?.status, "— logging out");
        logout();
        return;
      }
    } catch (err) {
      console.warn("[Boot] /me/ threw (offline?):", String(err));
    }
  }

  const hash = location.hash.slice(1) || "/feed";
  ROUTER.navigate(hash);
  showInstallTip();

  window.addEventListener("hashchange", () => {
    ROUTER.navigate(location.hash.slice(1) || "/feed");
    showInstallTip();
  });

  console.log("[Boot] done");
}

document.addEventListener("DOMContentLoaded", boot);
