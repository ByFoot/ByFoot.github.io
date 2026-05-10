// pages/board.js

let boardMessages = [];

function renderBoard() {
  return `
    <div class="page board-page">
      <header class="page-header">
        <h2 class="page-title">${t("nav.board")}</h2>
      </header>

      <div class="board-new">
        <textarea class="input board-new-input" id="board-new-text" placeholder="${t("board.new_placeholder")}"></textarea>
        <button class="btn btn--primary btn--sm" id="board-post-btn">${t("board.post")}</button>
      </div>

      <div id="board-list" class="board-list">
        <div class="loading-state"><div class="loading-spinner"></div></div>
      </div>
    </div>
  `;
}

async function initBoard() {
  await loadBoard();

  document.getElementById("board-post-btn")?.addEventListener("click", postBoardMessage);

  document.getElementById("board-list")?.addEventListener("click", async (e) => {
    // Toggle reply form
    if (e.target.closest(".board-reply-toggle")) {
      const btn = e.target.closest(".board-reply-toggle");
      const id = btn.dataset.msgId;
      const repliesEl = document.getElementById(`replies-${id}`);
      const formEl = document.getElementById(`reply-form-${id}`);

      if (repliesEl.style.display === "none") {
        repliesEl.style.display = "block";
        formEl.style.display = "flex";
        await loadReplies(id);
      } else {
        repliesEl.style.display = "none";
        formEl.style.display = "none";
      }
    }

    // Submit reply
    if (e.target.closest(".board-reply-submit")) {
      const btn = e.target.closest(".board-reply-submit");
      const parentId = btn.dataset.parentId;
      const form = document.getElementById(`reply-form-${parentId}`);
      const textarea = form.querySelector(".board-reply-input");
      const text = textarea.value.trim();
      if (!text) return;

      btn.disabled = true;
      const res = await API.replyBoardMessage(parentId, text);
      btn.disabled = false;

      if (res && res.ok) {
        const msg = await res.json();
        textarea.value = "";
        const repliesEl = document.getElementById(`replies-${parentId}`);
        const canDelete = msg.author_username_snapshot === window.APP.me?.username;
        repliesEl.insertAdjacentHTML("afterbegin", boardMessage(msg, { isReply: true, canDelete }));

        // Update reply count
        const toggle = document.querySelector(`.board-reply-toggle[data-msg-id="${parentId}"] .reply-count`);
        if (toggle) {
          const count = repliesEl.querySelectorAll(".board-msg--reply").length;
          toggle.textContent = `(${count})`;
        }
      }
    }

    // Delete message
    if (e.target.closest(".board-delete-btn")) {
      const btn = e.target.closest(".board-delete-btn");
      const id = btn.dataset.msgId;
      if (!confirm(t("action.delete") + "?")) return;

      btn.disabled = true;
      const res = await API.deleteBoardMessage(id);
      if (res && res.status === 204) {
        btn.closest(".board-msg").remove();
      } else {
        btn.disabled = false;
      }
    }
  });
}

async function loadBoard() {
  const res = await API.getBoard();
  if (!res || !res.ok) {
    document.getElementById("board-list").innerHTML = `<p class="empty-state">${t("error.generic")}</p>`;
    return;
  }
  boardMessages = await res.json();
  renderBoardList();
}

function renderBoardList() {
  const list = document.getElementById("board-list");
  if (!list) return;

  const roots = boardMessages.filter(m => !m.parent);
  if (roots.length === 0) {
    list.innerHTML = `<p class="empty-state">Aucun message dans votre quartier.</p>`;
    return;
  }

  list.innerHTML = roots.map(msg => {
    const canDelete = msg.author_username_snapshot === window.APP.me?.username;
    return boardMessage(msg, { isReply: false, canDelete });
  }).join("");
}

async function loadReplies(parentId) {
  const replies = boardMessages.filter(m => m.parent == parentId);
  const el = document.getElementById(`replies-${parentId}`);
  if (!el) return;

  if (replies.length > 0) {
    el.innerHTML = replies.map(r => {
      const canDelete = r.author_username_snapshot === window.APP.me?.username;
      return boardMessage(r, { isReply: true, canDelete });
    }).join("");
  } else {
    el.innerHTML = `<p class="empty-sub">Aucune réponse encore.</p>`;
  }
}

async function postBoardMessage() {
  const textarea = document.getElementById("board-new-text");
  const text = textarea.value.trim();
  if (!text) return;

  const btn = document.getElementById("board-post-btn");
  btn.disabled = true;

  const res = await API.postBoardMessage(text);
  btn.disabled = false;

  if (res && res.ok) {
    const msg = await res.json();
    textarea.value = "";
    boardMessages.unshift(msg);
    const list = document.getElementById("board-list");
    const canDelete = true; // it's ours
    list.insertAdjacentHTML("afterbegin", boardMessage(msg, { isReply: false, canDelete }));
  }
}
