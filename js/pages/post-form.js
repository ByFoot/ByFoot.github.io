// pages/post-form.js

function renderPostForm() {
  const tomorrow = new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 16);
  return `
    <div class="page post-form-page">
      <header class="page-header">
        <button class="btn-back" onclick="history.back()">←</button>
        <h2 class="page-title">${t("post.new")}</h2>
      </header>

      <form class="form" id="post-form" onsubmit="return false">
        <div class="form-group">
          <label class="form-label">${t("post.type")}</label>
          <div class="type-selector" id="type-selector">
            ${["sell","buy","lend","borrow"].map(type => `
              <button type="button" class="type-btn type-btn--${type}${type === "sell" ? " type-btn--active" : ""}" data-type="${type}">
                ${t("post.type." + type)}
              </button>
            `).join("")}
          </div>
          <input type="hidden" id="post-type" value="sell">
        </div>

        <div class="form-group">
          <label class="form-label" for="post-text">${t("post.text")}</label>
          <textarea class="input" id="post-text" rows="4" placeholder="Décrivez votre annonce..." required></textarea>
        </div>

        <div class="form-group">
          <label class="form-label" for="post-price">${t("post.price")}</label>
          <input class="input" type="text" id="post-price" placeholder="ex: 50€, gratuit, à discuter">
        </div>

        <div class="form-group">
          <label class="form-label" for="post-expires">${t("post.expires_at")}</label>
          <input class="input" type="datetime-local" id="post-expires" value="${tomorrow}" required>
        </div>

        <div id="post-error" class="error-msg"></div>

        <button class="btn btn--primary btn--full" id="post-submit" type="submit">
          ${t("action.save")}
        </button>
      </form>
    </div>
  `;
}

function initPostForm() {
  // Type selector
  document.getElementById("type-selector")?.addEventListener("click", (e) => {
    const btn = e.target.closest(".type-btn");
    if (!btn) return;
    document.querySelectorAll(".type-btn").forEach(b => b.classList.remove("type-btn--active"));
    btn.classList.add("type-btn--active");
    document.getElementById("post-type").value = btn.dataset.type;
  });

  document.getElementById("post-form")?.addEventListener("submit", submitPost);
  document.getElementById("post-submit")?.addEventListener("click", submitPost);
}

async function submitPost() {
  const type = document.getElementById("post-type").value;
  const text = document.getElementById("post-text").value.trim();
  const price = document.getElementById("post-price").value.trim();
  const expires_at = document.getElementById("post-expires").value;

  const errorEl = document.getElementById("post-error");
  errorEl.textContent = "";

  if (!text || !expires_at) return;

  const btn = document.getElementById("post-submit");
  btn.disabled = true;
  btn.textContent = "…";

  const res = await API.createPost({
    type,
    text,
    price,
    expires_at: new Date(expires_at).toISOString(),
  });

  btn.disabled = false;
  btn.textContent = t("action.save");

  if (!res || !res.ok) {
    const msg = await parseError(res);
    errorEl.textContent = msg;
    return;
  }

  location.hash = "#/feed";
}
