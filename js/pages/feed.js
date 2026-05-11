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
        <div class="loading-state">
          <div class="loading-spinner"></div>
        </div>
      </div>

      <!-- Message modal -->
      <div class="modal" id="msg-modal" style="display:none">
        <div class="modal-backdrop" id="msg-backdrop"></div>
        <div class="modal-card">
          <h3 class="modal-title" id="msg-modal-title"></h3>
          <textarea class="input modal-textarea" id="msg-text" placeholder="${t("post.message_placeholder")}"></textarea>
          <div class="modal-actions">
            <button class="btn btn--ghost" id="msg-cancel">${t("action.cancel")}</button>
            <button class="btn btn--primary" id="msg-send">${t("action.send")}</button>
          </div>
          <div id="msg-error" class="error-msg"></div>
        </div>
      </div>
    </div>
  `;
}

async function initFeed() {
  await loadFeed();

  document.getElementById("feed-search")?.addEventListener("input", (e) => {
    feedSearchTerm = e.target.value.trim();
    loadFeed();
  });

  // Filter buttons
  document.getElementById("feed-filters")?.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-btn");
    if (!btn) return;
    feedFilter = btn.dataset.filter;
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("filter-btn--active"));
    btn.classList.add("filter-btn--active");
    loadFeed();
  });

  // Message modal triggers (delegated)
  document.getElementById("feed-list")?.addEventListener("click", (e) => {
    const msgBtn = e.target.closest(".post-msg-btn");
    if (msgBtn) {
      openMessageModal(msgBtn.dataset.postId, msgBtn.dataset.author);
    }
  });

  document.getElementById("msg-cancel")?.addEventListener("click", closeMessageModal);
  document.getElementById("msg-backdrop")?.addEventListener("click", closeMessageModal);
  document.getElementById("msg-send")?.addEventListener("click", sendMessage);
}

async function loadFeed() {
  const res = await API.getPosts({ type: feedFilter, q: feedSearchTerm });
  if (!res || !res.ok) {
    document.getElementById("feed-list").innerHTML = `<p class="empty-state">${t("error.generic")}</p>`;
    return;
  }
  feedPosts = await res.json();
  renderFeedList();
}

function renderFeedList() {
  const list = document.getElementById("feed-list");
  if (!list) return;

  if (feedPosts.length === 0) {
    list.innerHTML = `<p class="empty-state">Aucune annonce dans votre rayon.</p>`;
    return;
  }

  const isOwnFilter = (p) => p.author_username === window.APP.me?.username;

  list.innerHTML = feedPosts.map(post =>
    postCard(post, {
      showActions: true,
      isOwn: isOwnFilter(post),
    })
  ).join("");
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

function closeMessageModal() {
  document.getElementById("msg-modal").style.display = "none";
  currentMsgPostId = null;
}

async function sendMessage() {
  const text = document.getElementById("msg-text").value.trim();
  if (!text || !currentMsgPostId) return;

  const post = feedPosts.find(p => p.id == currentMsgPostId);
  if (!post) return;

  const btn = document.getElementById("msg-send");
  btn.disabled = true;

  const recipient_id = post.author_id;
  if (!recipient_id) {
    document.getElementById("msg-error").textContent = t("error.generic");
    btn.disabled = false;
    return;
  }

  const res = await API.createChat(recipient_id, text);
  btn.disabled = false;

  if (!res || !res.ok) {
    const msg = await parseError(res);
    document.getElementById("msg-error").textContent = msg;
    return;
  }
  const conv = await res.json();
  closeMessageModal();
  location.hash = `#/chat/${conv.id}`;
}
