// pages/post-form.js

function renderPostForm() {
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
          <label class="form-label" for="post-title">${t("post.title")}</label>
          <input class="input" type="text" id="post-title" placeholder="${t("post.title")}" required>
        </div>
        <div class="form-group">
          <label class="form-label" for="post-price">${t("post.price")}</label>
          <input class="input" type="text" id="post-price" placeholder="ex: 50€, gratuit, à discuter">
        </div>
        <div class="form-group">
          <label class="form-label">${t("post.expires_in")}</label>
          <div class="settings-inline">
            <input class="input input--sm" type="number" id="post-expires-days" min="1" step="1" inputmode="numeric" pattern="[0-9]*" value="1" required>
            <span class="form-label">${t("post.expires_days")}</span>
            <input class="input input--sm" type="number" id="post-expires-hours" min="1" step="1" inputmode="numeric" pattern="[0-9]*" value="1" required>
            <span class="form-label">${t("post.expires_hours")}</span>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="post-image">${t("post.image")}</label>
          <input class="input" type="file" id="post-image" accept="image/*">
        </div>
        <div id="post-error" class="error-msg"></div>
        <button class="btn btn--primary btn--full" id="post-submit" type="submit">${t("action.save")}</button>
      </form>
    </div>
  `;
}

function initPostForm() {
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
  const title = document.getElementById("post-title").value.trim();
  const price = document.getElementById("post-price").value.trim();
  const expiresDays = parseInt(document.getElementById("post-expires-days").value, 10);
  const expiresHours = parseInt(document.getElementById("post-expires-hours").value, 10);
  const imageFile = document.getElementById("post-image").files[0] || null;
  const errorEl = document.getElementById("post-error");
  errorEl.textContent = "";
  if (!title || !Number.isInteger(expiresDays) || expiresDays < 1 || !Number.isInteger(expiresHours) || expiresHours < 1) return;
  if ((type === "buy" || type === "lend") && !imageFile) { errorEl.textContent = t("error.generic"); return; }

  const btn = document.getElementById("post-submit");
  btn.disabled = true; btn.textContent = "…";

  let image_url = "";
  if (imageFile) {
    const uploadRes = await API.uploadPostImage(imageFile);
    if (!uploadRes || !uploadRes.ok) {
      btn.disabled = false; btn.textContent = t("action.save");
      errorEl.textContent = uploadRes ? await parseError(uploadRes) : t("error.generic");
      return;
    }
    image_url = (await uploadRes.json()).image_url || "";
  }

  const res = await API.createPost({ type, title, price, image_url, expires_in: `${expiresDays} ${String(expiresHours).padStart(2,"0")}:00:00` });
  btn.disabled = false; btn.textContent = t("action.save");
  if (!res || !res.ok) { errorEl.textContent = await parseError(res); return; }
  location.hash = "#/feed";
}
