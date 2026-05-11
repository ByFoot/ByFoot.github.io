// pages/login.js

const GOOGLE_CLIENT_ID = "571570955047-jonv2fck6vnr8cksg0famtfpoj61p1d0.apps.googleusercontent.com";

function renderLogin() {
  document.getElementById("app-nav").style.display = "none";
  return `
    <div class="login-page">
      <div class="login-card">
        <div class="login-logo">
          <span class="login-logo__mark">BF</span>
        </div>
        <h1 class="login-title">${t("login.title")}</h1>
        <p class="login-subtitle">${t("login.subtitle")}</p>

        <div class="login-actions">
          <div id="login-google-button"></div>
          <!--
          <button class="btn-social btn-social--apple" id="login-apple">
            <svg viewBox="0 0 24 24" class="social-icon" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
            ${t("login.apple")}
          </button>
          -->
        </div>
      </div>
    </div>
  `;
}

function initLogin() {
  initGoogleSignIn();

  /*
  document.getElementById("login-apple")?.addEventListener("click", () => {
    // POC: replace with real Sign in with Apple to get code or id_token.
    const code = prompt("Apple code (POC):");
    const idToken = code ? "" : prompt("Apple id_token (POC):");
    if (!code && !idToken) return;
    handleSocialLogin(() => API.loginApple({ code, id_token: idToken }));
  });
  */
}

function initGoogleSignIn() {
  const buttonEl = document.getElementById("login-google-button");
  if (!buttonEl) return;

  if (!window.google?.accounts?.id) {
    loadGoogleIdentityScript()
      .then(initGoogleSignIn)
      .catch(() => showError(document.querySelector(".login-actions"), t("error.generic")));
    return;
  }

  window.google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleGoogleCredential,
  });

  buttonEl.innerHTML = "";
  window.google.accounts.id.renderButton(buttonEl, {
    theme: "filled_blue",
    size: "large",
    shape: "pill",
    text: "continue_with",
    width: 280,
  });
}

function loadGoogleIdentityScript() {
  return new Promise((resolve, reject) => {
    const existing = document.getElementById("google-identity-script");
    if (existing) {
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", reject, { once: true });
      if (window.google?.accounts?.id) resolve();
      return;
    }

    const script = document.createElement("script");
    script.id = "google-identity-script";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function handleGoogleCredential(response) {
  if (!response?.credential) {
    showError(document.querySelector(".login-actions"), t("error.generic"));
    return;
  }
  handleSocialLogin(() => API.loginGoogle(response.credential));
}

async function handleSocialLogin(apiFn) {
  try {
    const res = await apiFn();
    if (!res.ok) {
      const msg = await parseError(res);
      showError(document.querySelector(".login-actions"), msg);
      return;
    }
    const data = await res.json();
    window.APP.jwt = data.access;
    window.APP.refresh = data.refresh;
    localStorage.setItem("jwt", data.access);
    localStorage.setItem("refresh", data.refresh);

    const meRes = await API.getMe();
    if (meRes && meRes.ok) {
      window.APP.me = await meRes.json();
    }
    location.hash = "#/feed";
  } catch (e) {
    showError(document.querySelector(".login-actions"), t("error.generic"));
  }
}

