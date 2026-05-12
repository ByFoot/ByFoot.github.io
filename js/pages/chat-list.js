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

  if (!res || !res.ok) {
    list.innerHTML = `<p class="empty-state">${t("error.generic")}</p>`;
    return;
  }

  const convs = await res.json();

  if (convs.length === 0) {
    list.innerHTML = `<p class="empty-state">Aucune conversation.</p>`;
    return;
  }

  list.innerHTML = convs.map(conv => {
    const encodedUser = encodeURIComponent(conv.other_username);
    return `
      <div class="chat-item" data-chat-id="${conv.id}">
        <div class="chat-item__avatar">@</div>
        <div class="chat-item__body">
          <div class="chat-item__header">
            <button type="button" class="chat-item__name chat-profile-link" data-username="${encodedUser}">@${escapeHtml(conv.other_username)}</button>
            <span class="chat-item__time">${formatRelative(conv.last_message_at)}</span>
          </div>
          <p class="chat-item__preview">${escapeHtml(conv.last_message ?? "")}</p>
        </div>
      </div>
    `;
  }).join("");

  list.addEventListener("click", (e) => {
    const profileBtn = e.target.closest(".chat-profile-link");
    if (profileBtn) {
      const username = profileBtn.dataset.username;
      if (username) location.hash = `#/profile/u/${username}`;
      return;
    }
    const item = e.target.closest(".chat-item");
    if (!item) return;
    const nextHash = `#/chat/${item.dataset.chatId}`;
    location.hash = nextHash;
    if (window.ROUTER) {
      window.ROUTER.navigate(nextHash.slice(1));
    }
  });
}
