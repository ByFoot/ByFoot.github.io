// pages/chat-detail.js

let chatPollInterval = null;
let currentChatId = null;
let currentChatConv = null;

function renderChatDetail(id) {
  currentChatId = id;
  return `
    <div class="page chat-detail-page">
      <header class="page-header chat-detail-header">
        <button class="btn-back" onclick="stopChatPoll(); history.back()">←</button>
        <h2 class="page-title" id="chat-other-user">…</h2>
      </header>

      <div id="chat-messages" class="chat-messages">
        <div class="loading-state"><div class="loading-spinner"></div></div>
      </div>

      <div class="chat-composer">
        <textarea class="input chat-input" id="chat-input" placeholder="${t("chat.placeholder")}" rows="1"></textarea>
        <button class="btn btn--primary chat-send-btn" id="chat-send">${t("chat.send")}</button>
      </div>
    </div>
  `;
}

async function initChatDetail(id) {
  currentChatId = id;

  // Load conversation metadata
  const convRes = await API.getChats();
  if (convRes && convRes.ok) {
    const convs = await convRes.json();
    currentChatConv = convs.find(c => c.id == id);
    if (currentChatConv) {
      document.getElementById("chat-other-user").textContent = `@${currentChatConv.other_username}`;
    }
  }

  await loadMessages(id);
  chatPollInterval = setInterval(() => loadMessages(id), 5000);

  document.getElementById("chat-send")?.addEventListener("click", sendChatMessage);
  document.getElementById("chat-input")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  });

}

async function loadMessages(id) {
  const res = await API.getChatMessages(id);
  if (!res || !res.ok) return;
  const messages = await res.json();

  const container = document.getElementById("chat-messages");
  if (!container) return;

  const me = window.APP.me?.username;
  const wasScrolledToBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 60;

  container.innerHTML = messages.map(msg => {
    const isMine = msg.sender_username === me;
    return `
      <div class="chat-bubble-wrap${isMine ? " chat-bubble-wrap--mine" : ""}">
        <div class="chat-bubble${isMine ? " chat-bubble--mine" : " chat-bubble--theirs"}">
          <p class="chat-bubble__text">${escapeHtml(msg.text)}</p>
          <span class="chat-bubble__time">${formatRelative(msg.created_at)}</span>
        </div>
      </div>
    `;
  }).join("");

  if (wasScrolledToBottom || messages.length === 0) {
    container.scrollTop = container.scrollHeight;
  }
}

async function sendChatMessage() {
  const input = document.getElementById("chat-input");
  const text = input?.value.trim();
  if (!text || !currentChatId) return;

  const btn = document.getElementById("chat-send");
  btn.disabled = true;

  const res = await API.sendMessage(currentChatId, text);
  btn.disabled = false;

  if (res && res.ok) {
    input.value = "";
    await loadMessages(currentChatId);
  } else if (res) {
    const msg = await parseError(res);
    showError(document.querySelector(".chat-composer"), msg);
  }
}

function stopChatPoll() {
  if (chatPollInterval) {
    clearInterval(chatPollInterval);
    chatPollInterval = null;
  }
}
