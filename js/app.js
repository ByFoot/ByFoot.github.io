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
  { pattern: /^\/board$/,           page: "board"       },
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
      case "board":       main.innerHTML = renderBoard();            initBoard();            break;
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

// ── Boot ──────────────────────────────────────────────────────────────────────
async function boot() {
  await I18N.init();

  if (window.APP.jwt) {
    try {
      const res = await API.getMe();
      if (res && res.ok) {
        window.APP.me = await res.json();
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

  // Listen for hash changes
  window.addEventListener("hashchange", () => {
    ROUTER.navigate(location.hash.slice(1) || "/feed");
  });
}

document.addEventListener("DOMContentLoaded", boot);
