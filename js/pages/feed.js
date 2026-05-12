// pages/feed.js

let feedPosts = [];
let feedFilter = "all";
let feedSearchTerm = "";

function renderFeed() {
  return `
    <div class="page feed-page">
      <header class="page-header">
        <h2 class="page-title">${t("nav.feed")}</h2>
        <div class="feed-search">
          <input class="input feed-search-input" id="feed-search" placeholder="${t("feed.search_placeholder")}">
        </div>
        <div class="feed-filters" id="feed-filters">
          <button class="filter-btn filter-btn--active" data-filter="all">${t("filter.all")}</button>
          <button class="filter-btn" data-filter="sell">${t("post.type.sell")}</button>
          <button class="filter-btn" data-filter="buy">${t("post.type.buy")}</button>
          <button class="filter-btn" data-filter="lend">${t("post.type.lend")}</button>
          <button class="filter-btn" data-filter="borrow">${t("post.type.borrow")}</button>
        </div>
      </header>
      <div id="feed-list" class="post-list">
        <div class="loading-state"><div class="loading-spinner"></div></div>
      </div>
      <div class="modal" id="msg-modal" style="display:none">
        <div class="modal-backdrop" id="msg-backdrop"></div>
        <div class="modal-card">
          <h3 class="modal-title" id="msg-modal-title"></h3>
          <textarea class="input modal-textarea" id="msg-text" placeholder="${t("post.message_placeholder")}"></textarea>
          <div id="msg-error" class="error-msg"></div>
          <div class="modal-actions">
            <button class="btn btn--ghost" id="msg-cancel">${t("action.cancel")}</button>
            <button class="btn btn--primary" id="msg-send">${t("action.send")}</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function initFeed() {
  await loadFeed();
  document.getElementById("feed-search")?.addEventListener("input", (e) => { feedSearchTerm = e.target.value.trim(); loadFeed(); });
  document.getElementById("feed-filters")?.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-btn");
    if (!btn) return;
    feedFilter = btn.dataset.filter;
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("filter-btn--active"));
    btn.classList.add("filter-btn--active");
    loadFeed();
  });
  document.getElementById("feed-list")?.addEventListener("click", async (e) => {
    const msgBtn = e.target.closest(".post-msg-btn");
    if (msgBtn) { openMessageModal(msgBtn.dataset.postId, msgBtn.dataset.author); return; }
    const actionBtn = e.target.closest("[data-action]");
    if (!actionBtn) return;
    const { action, postId } = actionBtn.dataset;
    if (action === "delete") {
      if (!confirm(t("post.delete") + "?")) return;
      actionBtn.disabled = true;
      const res = await API.deletePost(postId);
      if (res && res.status === 204) actionBtn.closest(".post-card").remove();
      else actionBtn.disabled = false;
    }
    if (action === "reactivate") {
      const days = parseInt(prompt("Nouveau délai (jours):", "1"), 10);
      const hours = parseInt(prompt("Nouveau délai (heures):", "1"), 10);
      if (!Number.isInteger(days) || days < 1 || !Number.isInteger(hours) || hours < 1) return;
      actionBtn.disabled = true;
      const res = await API.patchPost(postId, { expires_in: `${days} ${String(hours).padStart(2,"0")}:00:00` });
      if (res && res.ok) {
        const updated = await res.json();
        const d = document.createElement("div"); d.innerHTML = postCard(updated, { isOwn: true });
        actionBtn.closest(".post-card").replaceWith(d.firstElementChild);
      } else actionBtn.disabled = false;
    }
  });
  document.getElementById("msg-cancel")?.addEventListener("click", closeMessageModal);
  document.getElementById("msg-backdrop")?.addEventListener("click", closeMessageModal);
  document.getElementById("msg-send")?.addEventListener("click", sendMessage);
}

async function loadFeed() {
  const res = await API.getPosts({ type: feedFilter, q: feedSearchTerm });
  if (!res || !res.ok) { document.getElementById("feed-list").innerHTML = `<p class="empty-state">${t("error.generic")}</p>`; return; }
  feedPosts = await res.json();
  renderFeedList();
}

function renderFeedList() {
  const list = document.getElementById("feed-list");
  if (!list) return;
  if (feedPosts.length === 0) { list.innerHTML = `<p class="empty-state">Aucune annonce dans votre rayon.</p>`; return; }
  list.innerHTML = feedPosts.map(post => postCard(post, { showActions: true, isOwn: post.author_username === window.APP.me?.username })).join("");
}

let currentMsgPostId = null;
function openMessageModal(postId, author) {
  currentMsgPostId = postId;
  document.getElementById("msg-modal-title").textContent = `→ @${author}`;
  document.getElementById("msg-text").value = "";
  document.getElementById("msg-error").textContent = "";
  document.getElementById("msg-modal").style.display = "flex";
  document.getElementById("msg-text").focus();
}
function closeMessageModal() { document.getElementById("msg-modal").style.display = "none"; currentMsgPostId = null; }

async function sendMessage() {
  const text = document.getElementById("msg-text").value.trim();
  if (!text || !currentMsgPostId) return;
  const post = feedPosts.find(p => p.id == currentMsgPostId);
  if (!post) return;
  const btn = document.getElementById("msg-send");
  btn.disabled = true;
  const res = await API.createChat(post.author_username, text, { byUsername: true });
  btn.disabled = false;
  if (!res || !res.ok) { document.getElementById("msg-error").textContent = await parseError(res); return; }
  const conv = await res.json();
  closeMessageModal();
  location.hash = `#/chat/${conv.id}`;
}
