// pages/login.js

const GOOGLE_CLIENT_ID = "571570955047-jonv2fck6vnr8cksg0famtfpoj61p1d0.apps.googleusercontent.com";

function renderLogin() {
  document.getElementById("app-nav").style.display = "none";
  const neighborIcon = `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" width="16" height="16"><path d="M2 16c0-3.3 3.6-6 8-6s8 2.7 8 6"/><circle cx="10" cy="6" r="3.5"/></svg>`;
  const tradeIcon    = `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" width="16" height="16"><path d="M3 7h14M3 13h14M7 3l-4 4 4 4M13 9l4 4-4 4"/></svg>`;
  const lockIcon     = `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" width="16" height="16"><rect x="4" y="9" width="12" height="9" rx="2"/><path d="M7 9V6a3 3 0 1 1 6 0v3"/></svg>`;
  const starIcon     = `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" width="16" height="16"><polygon points="10,2 12.5,7.5 18,8.2 14,12 15.3,17.5 10,14.5 4.7,17.5 6,12 2,8.2 7.5,7.5"/></svg>`;

  return `
    <style>
      .login-page {
        min-height: 100dvh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: var(--bg);
        position: relative;
        overflow: hidden;
        padding: calc(20px + var(--safe-t)) 20px calc(20px + var(--safe-b));
      }

      .login-page::before {
        content: '';
        position: fixed;
        top: -160px;
        left: 50%;
        transform: translateX(-50%);
        width: 600px;
        height: 400px;
        background: radial-gradient(ellipse at center, rgba(232,130,12,0.07) 0%, transparent 65%);
        pointer-events: none;
      }

      .login-card {
        width: 100%;
        max-width: 400px;
        display: flex;
        flex-direction: column;
        gap: 0;
        animation: lgnUp 0.4s ease both;
      }

      .login-brand {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 28px;
      }

      .login-favicon {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        object-fit: cover;
        box-shadow: 0 0 0 1px var(--border2);
      }

      .login-wordmark {
        font-size: 1.2rem;
        font-weight: 700;
        letter-spacing: -0.03em;
        color: var(--text);
        line-height: 1.1;
      }
      .login-tagline {
        font-size: 0.78rem;
        color: var(--muted);
        font-family: var(--fm);
        margin-top: 2px;
      }

      .login-auth {
        background: var(--surface);
        border: 1px solid var(--border2);
        border-radius: var(--r-xl);
        padding: 28px 24px 22px;
        margin-bottom: 16px;
      }

      .login-auth-heading {
        font-size: 1.35rem;
        font-weight: 700;
        letter-spacing: -0.025em;
        color: var(--text);
        margin-bottom: 6px;
      }

      .login-auth-sub {
        font-size: 0.83rem;
        color: var(--muted);
        font-family: var(--fm);
        margin-bottom: 22px;
        line-height: 1.5;
      }

      .btn-google {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: 14px 20px;
        border-radius: var(--r-m);
        font-size: 0.92rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s;
        border: 1px solid var(--border2);
        background: var(--surface2);
        color: var(--text);
        font-family: var(--ff);
        letter-spacing: -0.01em;
      }
      .btn-google:hover {
        background: var(--bg);
        border-color: var(--muted);
        transform: translateY(-1px);
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
      }
      .btn-google:active { transform: translateY(0); box-shadow: none; }
      .social-icon { width: 18px; height: 18px; flex-shrink: 0; }

      .login-fine-print {
        margin-top: 14px;
        text-align: center;
        font-size: 0.72rem;
        color: var(--dim);
        font-family: var(--fm);
        line-height: 1.6;
      }

      .login-features {
        display: flex;
        flex-direction: column;
        gap: 2px;
        animation: lgnUp 0.4s 0.08s ease both;
      }

      .login-feature {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 14px;
        border-radius: var(--r-m);
        transition: background 0.12s;
      }
      .login-feature:hover { background: var(--surface); }

      .login-feature__icon {
        width: 28px;
        height: 28px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .fi--orange { background: rgba(232,130,12,0.12); color: var(--accent); }
      .fi--blue   { background: rgba(59,130,246,0.12);  color: var(--buy); }
      .fi--green  { background: rgba(34,197,94,0.10);   color: var(--lend); }
      .fi--purple { background: rgba(168,85,247,0.10);  color: var(--borrow); }

      .login-feature__title {
        font-size: 0.83rem;
        font-weight: 600;
        color: var(--text);
        line-height: 1.2;
      }
      .login-feature__desc {
        font-size: 0.74rem;
        color: var(--muted);
        font-family: var(--fm);
        line-height: 1.4;
        margin-top: 1px;
      }

      @keyframes lgnUp {
        from { opacity: 0; transform: translateY(12px); }
        to   { opacity: 1; transform: translateY(0); }
      }
    </style>

    <div class="login-page">
      <div class="login-card">

        <div class="login-brand">
          <img class="login-favicon" src="assets/favicon.png" alt="ByFoot" />
          <div>
            <div class="login-wordmark">ByFoot</div>
            <div class="login-tagline">Your building's marketplace</div>
          </div>
        </div>

        <div class="login-auth">
          <div class="login-auth-heading">Get started</div>
          <div class="login-auth-sub">Sign in to buy, sell, lend and borrow with your neighbours.</div>

          <div class="login-actions">
            <button class="btn-google" id="login-google">
              <svg viewBox="0 0 24 24" class="social-icon">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          </div>

          <p class="login-fine-print">
            By continuing you agree to our terms.<br>
            Your exact address is never shared with other users.
          </p>
        </div>

        <div class="login-features">
          <div class="login-feature">
            <div class="login-feature__icon fi--orange">${neighborIcon}</div>
            <div>
              <div class="login-feature__title">Neighbours only</div>
              <div class="login-feature__desc">See posts from people in your building or a short walk away.</div>
            </div>
          </div>
          <div class="login-feature">
            <div class="login-feature__icon fi--blue">${tradeIcon}</div>
            <div>
              <div class="login-feature__title">Sell, buy, lend, borrow</div>
              <div class="login-feature__desc">Declutter, find a deal, or share your drill with someone nearby.</div>
            </div>
          </div>
          <div class="login-feature">
            <div class="login-feature__icon fi--green">${lockIcon}</div>
            <div>
              <div class="login-feature__title">Private by design</div>
              <div class="login-feature__desc">Connect only with verified neighbours. Your address stays private.</div>
            </div>
          </div>
          <div class="login-feature">
            <div class="login-feature__icon fi--purple">${starIcon}</div>
            <div>
              <div class="login-feature__title">Community reputation</div>
              <div class="login-feature__desc">A trust score built by your neighbours so you know who you are dealing with.</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `;
}

function initLogin() {
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
    if (window.APP.me?.lat == null) {
      requestAndStoreLocation(); // triggers OS prompt once; shows gate if denied
    }
    location.hash = "#/feed";
  } catch (e) { showError(document.querySelector(".login-actions"), t("error.generic")); }
}