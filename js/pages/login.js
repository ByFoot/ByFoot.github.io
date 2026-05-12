// pages/login.js

const GOOGLE_CLIENT_ID = "571570955047-jonv2fck6vnr8cksg0famtfpoj61p1d0.apps.googleusercontent.com";

function renderLogin() {
  document.getElementById("app-nav").style.display = "none";
  const theme = document.documentElement.dataset.theme || "dark";
  const moonIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
  const sunIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;

  return `
    <style>
      .login-page {
        min-height: 100dvh;
        display: flex;
        flex-direction: column;
        background: var(--bg);
        position: relative;
        overflow: hidden;
      }

      .login-page::before {
        content: '';
        position: absolute;
        top: -80px;
        left: 50%;
        transform: translateX(-50%);
        width: 480px;
        height: 480px;
        background: radial-gradient(ellipse at center, rgba(232,130,12,0.10) 0%, transparent 70%);
        pointer-events: none;
        z-index: 0;
      }

      .login-theme-btn {
        position: absolute;
        top: calc(16px + var(--safe-t));
        right: 16px;
        width: 34px;
        height: 34px;
        border-radius: var(--r-m);
        background: var(--surface);
        border: 1px solid var(--border2);
        color: var(--muted);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 10;
        transition: color 0.14s, background 0.14s;
      }
      .login-theme-btn:hover { color: var(--text); background: var(--surface2); }

      .login-brand {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: calc(72px + var(--safe-t)) 24px 0;
        position: relative;
        z-index: 1;
        animation: lgnFadeUp 0.45s ease both;
      }

      .login-favicon {
        width: 72px;
        height: 72px;
        border-radius: 18px;
        object-fit: cover;
        box-shadow: 0 0 0 1px var(--border2), 0 8px 32px rgba(0,0,0,0.35);
        margin-bottom: 20px;
      }

      .login-wordmark {
        font-size: 2rem;
        font-weight: 700;
        letter-spacing: -0.03em;
        color: var(--text);
        margin-bottom: 6px;
      }

      .login-tagline {
        font-size: 0.93rem;
        color: var(--muted);
        font-family: var(--fm);
        letter-spacing: 0.02em;
      }

      .login-features {
        display: flex;
        flex-direction: column;
        gap: 11px;
        padding: 36px 24px 0;
        max-width: 360px;
        margin: 0 auto;
        width: 100%;
        position: relative;
        z-index: 1;
        animation: lgnFadeUp 0.45s 0.08s ease both;
      }

      .login-feature {
        display: flex;
        align-items: center;
        gap: 13px;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--r-l);
        padding: 13px 16px;
        transition: border-color 0.14s;
      }
      .login-feature:hover { border-color: var(--border2); }

      .login-feature__icon {
        width: 34px;
        height: 34px;
        border-radius: var(--r-m);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        font-size: 1.1rem;
      }
      .login-feature__icon--orange { background: rgba(232,130,12,0.14); }
      .login-feature__icon--blue   { background: rgba(59,130,246,0.13); }
      .login-feature__icon--green  { background: rgba(34,197,94,0.12); }
      .login-feature__icon--purple { background: rgba(168,85,247,0.12); }

      .login-feature__text { flex: 1; min-width: 0; }
      .login-feature__title {
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--text);
        margin-bottom: 1px;
      }
      .login-feature__desc {
        font-size: 0.77rem;
        color: var(--muted);
        line-height: 1.4;
        font-family: var(--fm);
      }

      .login-auth {
        padding: 28px 24px calc(32px + var(--safe-b));
        max-width: 360px;
        margin: 0 auto;
        width: 100%;
        position: relative;
        z-index: 1;
        animation: lgnFadeUp 0.45s 0.16s ease both;
      }

      .login-divider {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 20px;
      }
      .login-divider__line { flex: 1; height: 1px; background: var(--border); }
      .login-divider__text {
        font-size: 0.72rem;
        font-family: var(--fm);
        color: var(--dim);
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .btn-social {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: 13px 20px;
        border-radius: var(--r-m);
        font-size: 0.9rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.14s;
        border: 1px solid var(--border2);
        background: var(--surface);
        color: var(--text);
        font-family: var(--ff);
      }
      .btn-social:hover {
        background: var(--surface2);
        border-color: var(--muted);
        transform: translateY(-1px);
        box-shadow: 0 4px 16px rgba(0,0,0,0.18);
      }
      .btn-social:active { transform: translateY(0); box-shadow: none; }
      .social-icon { width: 18px; height: 18px; flex-shrink: 0; }

      .login-fine-print {
        margin-top: 16px;
        text-align: center;
        font-size: 0.72rem;
        color: var(--dim);
        font-family: var(--fm);
        line-height: 1.5;
      }

      @keyframes lgnFadeUp {
        from { opacity: 0; transform: translateY(14px); }
        to   { opacity: 1; transform: translateY(0); }
      }
    </style>

    <div class="login-page">
      <button class="login-theme-btn" id="login-theme-toggle" aria-label="Toggle theme">
        ${theme === "light" ? moonIcon : sunIcon}
      </button>

      <div class="login-brand">
        <img class="login-favicon" src="assets/favicon.png" alt="ByFoot" />
        <div class="login-wordmark">ByFoot</div>
        <div class="login-tagline">Your building's marketplace</div>
      </div>

      <div class="login-features">
        <div class="login-feature">
          <div class="login-feature__icon login-feature__icon--orange">🏘️</div>
          <div class="login-feature__text">
            <div class="login-feature__title">Neighbours only</div>
            <div class="login-feature__desc">See posts from people in your building or a short walk away — not strangers across the city.</div>
          </div>
        </div>
        <div class="login-feature">
          <div class="login-feature__icon login-feature__icon--blue">🔄</div>
          <div class="login-feature__text">
            <div class="login-feature__title">Sell, buy, lend, borrow</div>
            <div class="login-feature__desc">Declutter, find a deal, or lend your drill — everything within walking distance.</div>
          </div>
        </div>
        <div class="login-feature">
          <div class="login-feature__icon login-feature__icon--green">🔒</div>
          <div class="login-feature__text">
            <div class="login-feature__title">Private by design</div>
            <div class="login-feature__desc">Your exact address is never shared. Connect only with verified neighbours.</div>
          </div>
        </div>
        <div class="login-feature">
          <div class="login-feature__icon login-feature__icon--purple">⭐</div>
          <div class="login-feature__text">
            <div class="login-feature__title">Community reputation</div>
            <div class="login-feature__desc">A trust score built by your neighbours — know who you're dealing with before you meet.</div>
          </div>
        </div>
      </div>

      <div class="login-auth">
        <div class="login-divider">
          <div class="login-divider__line"></div>
          <div class="login-divider__text">Get started</div>
          <div class="login-divider__line"></div>
        </div>

        <div class="login-actions">
          <button class="btn-social btn-social--google" id="login-google">
            <svg viewBox="0 0 24 24" class="social-icon">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            ${t("login.google")}
          </button>
        </div>

        <p class="login-fine-print">
          By continuing you agree to our terms.<br>
          Your exact address is never shared with other users.
        </p>
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
