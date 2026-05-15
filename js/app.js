// app.js - SPA router + global state

// ── Log buffer — captures everything from first line, before any UI exists ────
window.__LOGS = [];
(function () {
  const _log   = console.log.bind(console);
  const _warn  = console.warn.bind(console);
  const _error = console.error.bind(console);
  function capture(level, args) {
    const ts   = new Date().toISOString().slice(11, 23);
    const text = Array.from(args).map(a => {
      try { return typeof a === "object" ? JSON.stringify(a) : String(a); } catch (e) { return String(a); }
    }).join(" ");
    window.__LOGS.push("[" + ts + "] [" + level + "] " + text);
    if (window.__LOGS.length > 500) window.__LOGS.shift();
  }
  console.log   = function () { capture("LOG",   arguments); _log(...arguments);   };
  console.warn  = function () { capture("WARN",  arguments); _warn(...arguments);  };
  console.error = function () { capture("ERROR", arguments); _error(...arguments); };
})();

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

    if (typeof stopChatPoll === "function") stopChatPoll();

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

    if (path === "/login") {
      nav.style.display = "none";
    } else {
      nav.style.display = "flex";
      renderNav();
    }

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
        if (!window.APP.me?.id) { location.hash = "#/login"; break; }
        id = window.APP.me.id;
        main.innerHTML = renderProfile(id); initProfile({ id, isSelf: true }); break;
      case "profile-username": {
        const username = decodeURIComponent(id || "");
        main.innerHTML = renderProfile(username); initProfile({ username }); break;
      }
      case "profile":   main.innerHTML = renderProfile(id);   initProfile({ id });   break;
      case "settings":  main.innerHTML = renderSettings();    initSettings();        break;
    }

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

// ── Staff logs panel (call window.showStaffLogs() or wire to a button) ────────
function showStaffLogs() {
  const existing = document.getElementById("staff-logs-panel");
  if (existing) { existing.remove(); return; }
  const panel = document.createElement("div");
  panel.id = "staff-logs-panel";
  panel.style.cssText = "position:fixed;inset:0;z-index:9999;background:#000;color:#0f0;font-family:monospace;font-size:11px;overflow:auto;padding:16px;white-space:pre-wrap;word-break:break-all";
  panel.innerHTML =
    '<div style="margin-bottom:10px;display:flex;gap:8px;align-items:center">' +
    '<span style="color:#fff;font-size:14px;font-weight:bold">Logs</span>' +
    '<button id="slogs-copy"  style="padding:3px 10px;font-size:12px">Copy</button>' +
    '<button id="slogs-clear" style="padding:3px 10px;font-size:12px">Clear</button>' +
    '<button id="slogs-close" style="padding:3px 10px;font-size:12px;margin-left:auto">Close</button>' +
    '</div>' +
    '<div id="slogs-body">' + (window.__LOGS.join("\n") || "No logs yet.") + "</div>";
  document.body.appendChild(panel);
  document.getElementById("slogs-close").onclick = () => panel.remove();
  document.getElementById("slogs-clear").onclick = () => { window.__LOGS = []; document.getElementById("slogs-body").textContent = "Cleared."; };
  document.getElementById("slogs-copy").onclick  = () => navigator.clipboard?.writeText(window.__LOGS.join("\n")).then(() => alert("Copied!"));
}
window.showStaffLogs = showStaffLogs;

// ── Push notifications ────────────────────────────────────────────────────────
async function initPushNotifications({ promptPermission = false } = {}) {
  console.log("[Push] start — jwt:", !!window.APP.jwt, "firebase:", typeof firebase !== "undefined", "permission:", window.Notification ? Notification.permission : "unavailable", "promptPermission:", promptPermission);
  if (!window.APP.jwt) { console.log("[Push] bail: no jwt"); return; }
  if (typeof firebase === "undefined" || !navigator.serviceWorker || !window.Notification) { console.log("[Push] bail: firebase/sw/Notification unavailable"); return; }
  if (Notification.permission === "denied") { console.log("[Push] bail: permission denied"); return; }
  if (Notification.permission !== "granted") {
    if (!promptPermission) { console.log("[Push] bail: not granted and promptPermission=false"); return; }
    console.log("[Push] requesting permission...");
    const permission = await Notification.requestPermission();
    console.log("[Push] permission result:", permission);
    if (permission !== "granted") return;
  }
  console.log("[Push] permission ok, fetching config...");
  const configRes = await API.getPushConfig();
  console.log("[Push] getPushConfig status:", configRes.status);
  if (!configRes.ok) { console.log("[Push] bail: config fetch failed"); return; }
  const config = await configRes.json();
  console.log("[Push] config ok, initializing Firebase...");

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
    const swParams = new URLSearchParams({
      apiKey:            config.api_key,
      projectId:         config.project_id,
      messagingSenderId: config.messaging_sender_id,
      appId:             config.app_id,
    });
    console.log("[Push] registering SW...");
    const registration = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?${swParams}`);
    await navigator.serviceWorker.ready;
    console.log("[Push] SW ready, calling getToken...");

    const messaging = firebase.messaging();

    messaging.onMessage((payload) => {
      const title = payload?.notification?.title || "ByFoot";
      const body = payload?.notification?.body || "";
      if (Notification.permission === "granted") {
        new Notification(title, { body, icon: "/assets/favicon.png" });
      }
    });

    const token = await messaging.getToken({
      vapidKey: config.vapid_key,
      serviceWorkerRegistration: registration,
    });

    console.log("[Push] token:", token ? token.slice(0, 20) + "..." : "EMPTY");
    if (!token) { console.warn("[Push] getToken returned empty — check VAPID key and SW scope"); return; }

    window.APP.pushToken = token;
    localStorage.setItem("push_token", token);

    const res = await API.patchPushToken(token);
    if (res && res.ok) {
      console.log("[Push] token saved to server ✓");
    } else {
      console.error("[Push] patchPushToken failed:", res?.status);
    }
  } catch (err) {
    console.error("[Push] error:", err);
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
        // Location for returning users — only if not already set on server
        if (window.APP.me?.lat == null) {
          requestAndStoreLocation();
        }
      } else {
        logout();
        return;
      }
    } catch {
      // API unreachable - still allow boot for dev
    }
  }

  const hash = location.hash.slice(1) || "/feed";
  ROUTER.navigate(hash);
  showInstallTip();

  window.addEventListener("hashchange", () => {
    ROUTER.navigate(location.hash.slice(1) || "/feed");
    showInstallTip();
  });
}

document.addEventListener("DOMContentLoaded", boot);