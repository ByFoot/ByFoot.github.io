// pages/profile.js — render + load helpers

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
      <span class="profile-stat__value">${Math.round(me.radius_minutes)} ${t("settings.minutes")}</span>
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
  if (!res || !res.ok) {
    const isNotFound = res && res.status === 404;
    document.getElementById("profile-card").innerHTML = `<p class="empty-state">${
      isNotFound
        ? t("error.user_not_found")
        : t("error.generic")
    }</p>`;
    if (isNotFound && username) {
      document.getElementById("profile-username").textContent = `@${username}`;
    }
    return;
  }
  const rep = await res.json();
  const displayUsername = username || `user_${id}`;
  document.getElementById("profile-username").textContent = `@${displayUsername}`;
  document.getElementById("profile-rep-badge").innerHTML = reputationBadge(rep.score);
  const positives = rep.positives ?? 0;
  const negatives = rep.negatives ?? 0;
  document.getElementById("profile-card").innerHTML = `
    <div class="profile-stat">
      <span class="profile-stat__label">${t("profile.reputation")}</span>
      <span class="profile-stat__value">${reputationBadge(rep.score)}</span>
    </div>
    <div class="profile-rep-tabs">
      <div class="rep-tab rep-tab--pos">
        <span class="rep-tab__count">+${positives}</span>
        <span class="rep-tab__label">👍</span>
      </div>
      <div class="rep-tab rep-tab--neg">
        <span class="rep-tab__count">−${negatives}</span>
        <span class="rep-tab__label">👎</span>
      </div>
    </div>
  `;
  initProfileVoteActions(id, displayUsername);
}
