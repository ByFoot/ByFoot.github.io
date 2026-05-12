// pages/chat-list.js

function renderChatList() {
  return `
    <div class="page chat-list-page">
      <header class="page-header">
        <h2 class="page-title">${t("nav.chat")}</h2>
      </header>
      <div id="chat-list" class="chat-list">
        <div class="loading-state"><div class="loading-spinner"></div></div>
      </div>
    </div>
  `;
}

async function initChatList() {
  const res = await API.getChats();
  const list = document.getElementById("chat-list");
  if (!res || !res.ok) { list.innerHTML = `<p class="empty-state">${t("error.generic")}</p>`; return; }
  const convs = await res.json();
  if (convs.length === 0) { list.innerHTML = `<p class="empty-state">Aucune conversation.</p>`; return; }
  list.innerHTML = convs.map(conv => `
    <div class="chat-item" data-chat-id="${conv.id}">
      <div class="chat-item__avatar">@</div>
      <div class="chat-item__body">
        <div class="chat-item__header">
          <button type="button" class="chat-item__name chat-profile-link" data-username="${encodeURIComponent(conv.other_username)}">@${escapeHtml(conv.other_username)}</button>
          ${conv.other_reputation != null ? reputationBadge(conv.other_reputation) : ""}
          <span class="chat-item__time">${formatRelative(conv.last_message_at)}</span>
        </div>
        <p class="chat-item__preview">${escapeHtml(conv.last_message ?? "")}</p>
      </div>
    </div>
  `).join("");
  list.addEventListener("click", (e) => {
    const profileBtn = e.target.closest(".chat-profile-link");
    if (profileBtn) { location.hash = `#/profile/u/${profileBtn.dataset.username}`; return; }
    const item = e.target.closest(".chat-item");
    if (item) location.hash = `#/chat/${item.dataset.chatId}`;
  });
}
