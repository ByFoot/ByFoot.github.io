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

async function initProfile(id) {
  const me = window.APP.me;
  const isMe = String(id) === String(me?.id);

  if (isMe) {
    await loadMyProfile();
  } else {
    await loadOtherProfile(id);
  }
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
      <span class="profile-stat__label">Rayon</span>
      <span class="profile-stat__value">${me.radius_minutes} min</span>
    </div>
    ${me.is_pro ? `<span class="pro-badge">${t("profile.pro_badge")}</span>` : ""}
  `;

  // Load own posts from feed, filter by username
  const res = await API.getPosts();
  if (res && res.ok) {
    const allPosts = await res.json();
    const myPosts = allPosts.filter(p => p.author_username === me.username);
    renderProfilePosts(myPosts, true);
  }
}

async function loadOtherProfile(id) {
  const res = await API.getUserReputation(id);
  if (!res || !res.ok) {
    document.getElementById("profile-card").innerHTML = `<p class="empty-state">${t("error.generic")}</p>`;
    return;
  }
  const rep = await res.json();

  document.getElementById("profile-username").textContent = `@user_${id}`;
  document.getElementById("profile-rep-badge").innerHTML = reputationBadge(rep.score);

  document.getElementById("profile-card").innerHTML = `
    <div class="profile-stat">
      <span class="profile-stat__label">${t("profile.reputation")}</span>
      <span class="profile-stat__value">${reputationBadge(rep.score)}</span>
    </div>
  `;

  document.getElementById("profile-vote-actions").style.display = "flex";
  document.getElementById("profile-vote-actions").innerHTML = `
    <button class="btn btn--ghost vote-btn" data-kind="like" data-user-id="${id}">
      👍 ${t("profile.vote_like")}
    </button>
    <button class="btn btn--ghost vote-btn" data-kind="dislike" data-user-id="${id}">
      👎 ${t("profile.vote_dislike")}
    </button>
  `;

  document.getElementById("profile-vote-actions").addEventListener("click", async (e) => {
    const btn = e.target.closest(".vote-btn");
    if (!btn) return;
    const kind = btn.dataset.kind;
    const userId = btn.dataset.userId;

    btn.disabled = true;
    const res = await API.voteUser(userId, kind);
    if (res && res.ok) {
      const data = await res.json();
      document.getElementById("profile-rep-badge").innerHTML = reputationBadge(data.score);
      document.getElementById("profile-vote-actions").querySelectorAll(".vote-btn").forEach(b => b.disabled = true);
    } else {
      btn.disabled = false;
    }
  });
}

function renderProfilePosts(posts, isOwn) {
  const container = document.getElementById("profile-posts");
  if (!container) return;

  if (posts.length === 0) {
    container.innerHTML = `<p class="empty-state">Aucune annonce.</p>`;
    return;
  }

  container.innerHTML = posts.map(post => postCard(post, { isOwn, showActions: true })).join("");

  // Bind owner actions
  container.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;
    const postId = btn.dataset.postId;

    if (action === "delete") {
      if (!confirm(t("post.delete") + "?")) return;
      btn.disabled = true;
      const res = await API.deletePost(postId);
      if (res && res.status === 204) {
        btn.closest(".post-card").remove();
      } else {
        btn.disabled = false;
      }
    }

    if (action === "boost") {
      btn.disabled = true;
      const res = await API.boostPost(postId);
      if (res && res.status === 204) {
        btn.textContent = t("post.boost.done");
      } else if (res) {
        const msg = await parseError(res);
        showError(btn.closest(".post-card"), msg);
        btn.disabled = false;
      }
    }

    if (action === "reactivate") {
      const newExpiryDays = prompt("Nouveau delai d'expiration (jours):", "7");
      if (!newExpiryDays) return;
      btn.disabled = true;
      const res = await API.patchPost(postId, { expires_in: `${newExpiryDays} 00:00:00` });
      if (res && res.ok) {
        const updated = await res.json();
        btn.closest(".post-card").replaceWith(
          (() => { const d = document.createElement("div"); d.innerHTML = postCard(updated, { isOwn: true }); return d.firstElementChild; })()
        );
      } else {
        btn.disabled = false;
      }
    }
  });
}
