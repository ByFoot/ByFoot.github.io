// pages/login.js

const GOOGLE_CLIENT_ID = "571570955047-jonv2fck6vnr8cksg0famtfpoj61p1d0.apps.googleusercontent.com";

function renderLogin() {
  document.getElementById("app-nav").style.display = "none";
  const theme = document.documentElement.dataset.theme || "dark";
  return `
    <div class="login-page">
      <button class="btn btn--icon btn--ghost" id="login-theme-toggle" style="position:absolute;top:calc(16px + var(--safe-t));right:16px" aria-label="Toggle theme">
        ${theme === "light"
          ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`
          : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`
        }
      </button>
      <div class="login-card">
        <div class="login-logo"><span class="login-logo__mark">BF</span></div>
        <h1 class="login-title">${t("login.title")}</h1>
        <p class="login-subtitle">${t("login.subtitle")}</p>
        <div class="login-actions">
          <button class="btn-social btn-social--google" id="login-google">
            <svg viewBox="0 0 24 24" class="social-icon"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            ${t("login.google")}
          </button>
        </div>
      </div>
    </div>
  `;
}

function initLogin() {
  document.getElementById("login-theme-toggle")?.addEventListener("click", () => {
    const current = document.documentElement.dataset.theme || "dark";
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("theme", next);
    ROUTER.navigate("/login");
  });
  initGoogleSignIn();
}

function initGoogleSignIn() {
  const buttonEl = document.getElementById("login-google");
  if (!buttonEl) return;
  if (!window.google?.accounts?.id) {
    loadGoogleIdentityScript().then(initGoogleSignIn).catch(() => showError(document.querySelector(".login-actions"), t("error.generic")));
    return;
  }
  const tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID, scope: "openid email profile", callback: handleGoogleTokenResponse,
  });
  buttonEl.addEventListener("click", () => { tokenClient.requestAccessToken({ prompt: "consent" }); });
}

function loadGoogleIdentityScript() {
  return new Promise((resolve, reject) => {
    const existing = document.getElementById("google-identity-script");
    if (existing) { existing.addEventListener("load", resolve, { once: true }); existing.addEventListener("error", reject, { once: true }); if (window.google?.accounts?.id) resolve(); return; }
    const script = document.createElement("script");
    script.id = "google-identity-script"; script.src = "https://accounts.google.com/gsi/client"; script.async = true; script.defer = true; script.onload = resolve; script.onerror = reject;
    document.head.appendChild(script);
  });
}

function handleGoogleTokenResponse(response) {
  if (!response?.access_token) { showError(document.querySelector(".login-actions"), t("error.generic")); return; }
  handleSocialLogin(() => API.loginGoogle(response.access_token));
}

async function handleSocialLogin(apiFn) {
  try {
    const res = await apiFn();
    if (!res.ok) { const msg = await parseError(res); showError(document.querySelector(".login-actions"), msg); return; }
    const data = await res.json();
    window.APP.jwt = data.access; window.APP.refresh = data.refresh;
    localStorage.setItem("jwt", data.access); localStorage.setItem("refresh", data.refresh);
    syncPushToken(); initPushNotifications({ promptPermission: true });
    const meRes = await API.getMe();
    if (meRes && meRes.ok) window.APP.me = await meRes.json();
    location.hash = "#/feed";
  } catch (e) { showError(document.querySelector(".login-actions"), t("error.generic")); }
}
