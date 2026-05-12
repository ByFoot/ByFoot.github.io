// pages/profile-actions.js — vote + post management

function initProfileVoteActions(id, displayUsername) {
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
