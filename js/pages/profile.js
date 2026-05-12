// pages/profile.js

function renderProfile(id) {
  return `
    <div class="page profile-page">
      <header class="page-header">
        <button class="btn-back" onclick="history.back()">←</button>
        <h2 class="page-title" id="profile-username">…</h2>
        <div id="profile-rep-badge"></div>
      </header>
      <div class="profile-card" id="profile-card">
        <div class="loading-state"><div class="loading-spinner"></div></div>
      </div>
      <div id="profile-vote-actions" style="display:none" class="vote-actions"></div>
      <section class="profile-posts-section">
        <h3 class="section-title">${t("profile.posts")}</h3>
        <div id="profile-posts" class="post-list"></div>
      </section>
    </div>
  `;
}

async function initProfile({ id, username, isSelf } = {}) {
  const me = window.APP.me;
  const isMe = isSelf || (id && String(id) === String(me?.id)) || (username && username === me?.username);
  if (isMe) await loadMyProfile();
  else await loadOtherProfile({ id, username });
}

async function loadMyProfile() {
  const me = window.APP.me;
  document.getElementById("profile-username").textContent = `@${me.username}`;
  document.getElementById("profile-rep-badge").innerHTML = reputationBadge(me.reputation_score);
  document.getElementById("profile-card").innerHTML = `
    <div class="profile-stat">
      <span class="profile-stat__label">${t("profile.reputation")}</span>
      <span class="profile-stat__value">${reputationBadge(me.reputation_score)}</span>
    </div>
    <div class="profile-stat">
      <span class="profile-stat__label">${t("settings.radius")}</span>
      <span class="profile-stat__value">${me.radius_minutes} ${t("settings.minutes")}</span>
    </div>
    ${me.is_pro ? `<span class="pro-badge">${t("profile.pro_badge")}</span>` : ""}
  `;
  const res = await API.getPosts();
  if (res && res.ok) {
    const all = await res.json();
    renderProfilePosts(all.filter(p => p.author_username === me.username), true);
  }
}

async function loadOtherProfile({ id, username }) {
  const res = username ? await API.getUserReputationByUsername(username) : await API.getUserReputation(id);
  if (!res || !res.ok) { document.getElementById("profile-card").innerHTML = `<p class="empty-state">${t("error.generic")}</p>`; return; }
  const rep = await res.json();
  const displayUsername = username || `user_${id}`;
  document.getElementById("profile-username").textContent = `@${displayUsername}`;
  document.getElementById("profile-rep-badge").innerHTML = reputationBadge(rep.score);
  document.getElementById("profile-card").innerHTML = `
    <div class="profile-stat">
      <span class="profile-stat__label">${t("profile.reputation")}</span>
      <span class="profile-stat__value">${reputationBadge(rep.score)}</span>
    </div>
  `;
  const voteEl = document.getElementById("profile-vote-actions");
  voteEl.style.display = "flex";
  voteEl.innerHTML = `
    <button class="btn btn--ghost vote-btn" data-kind="like" data-user-id="${id || ""}" data-username="${escapeHtml(displayUsername)}">👍 ${t("profile.vote_like")}</button>
    <button class="btn btn--ghost vote-btn" data-kind="dislike" data-user-id="${id || ""}" data-username="${escapeHtml(displayUsername)}">👎 ${t("profile.vote_dislike")}</button>
  `;
  voteEl.addEventListener("click", async (e) => {
    const btn = e.target.closest(".vote-btn");
    if (!btn) return;
    btn.disabled = true;
    const res = btn.dataset.username
      ? await API.voteUserByUsername(btn.dataset.username, btn.dataset.kind)
      : await API.voteUser(btn.dataset.userId, btn.dataset.kind);
    if (res && res.ok) {
      const data = await res.json();
      document.getElementById("profile-rep-badge").innerHTML = reputationBadge(data.score);
      voteEl.querySelectorAll(".vote-btn").forEach(b => b.disabled = true);
    } else { btn.disabled = false; }
  });
}

function renderProfilePosts(posts, isOwn) {
  const container = document.getElementById("profile-posts");
  if (!container) return;
  if (posts.length === 0) { container.innerHTML = `<p class="empty-state">Aucune annonce.</p>`; return; }
  container.innerHTML = posts.map(post => postCard(post, { isOwn, showActions: true })).join("");
  container.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const { action, postId } = btn.dataset;
    if (action === "delete") {
      if (!confirm(t("post.delete") + "?")) return;
      btn.disabled = true;
      const res = await API.deletePost(postId);
      if (res && res.status === 204) btn.closest(".post-card").remove();
      else btn.disabled = false;
    }
    if (action === "reactivate") {
      const days = parseInt(prompt("Nouveau délai (jours):", "1"), 10);
      const hours = parseInt(prompt("Nouveau délai (heures):", "1"), 10);
      if (!Number.isInteger(days) || days < 1 || !Number.isInteger(hours) || hours < 1) return;
      btn.disabled = true;
      const res = await API.patchPost(postId, { expires_in: `${days} ${String(hours).padStart(2,"0")}:00:00` });
      if (res && res.ok) {
        const updated = await res.json();
        const d = document.createElement("div"); d.innerHTML = postCard(updated, { isOwn: true });
        btn.closest(".post-card").replaceWith(d.firstElementChild);
      } else btn.disabled = false;
    }
  });
}
