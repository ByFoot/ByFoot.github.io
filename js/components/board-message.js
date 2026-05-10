// components/board-message.js

function boardMessage(msg, { isReply = false, canDelete = false } = {}) {
  return `
    <div class="board-msg${isReply ? " board-msg--reply" : ""}${msg.is_admin_post ? " board-msg--admin" : ""}" data-msg-id="${msg.id}">
      <div class="board-msg__meta">
        <span class="board-msg__author">@${escapeHtml(msg.author_username_snapshot)}</span>
        ${msg.is_admin_post ? `<span class="board-admin-badge">${t("board.admin_badge")}</span>` : ""}
        ${reputationBadge(msg.reputation_score)}
        <span class="board-msg__time">${formatRelative(msg.created_at)}</span>
      </div>
      <p class="board-msg__text">${escapeHtml(msg.text)}</p>
      <div class="board-msg__actions">
        ${!isReply ? `
          <button class="btn btn--ghost btn--xs board-reply-toggle" data-msg-id="${msg.id}">
            ${t("board.reply")} ${msg.reply_count > 0 ? `<span class="reply-count">(${msg.reply_count})</span>` : ""}
          </button>
        ` : ""}
        ${canDelete ? `
          <button class="btn btn--danger btn--xs board-delete-btn" data-msg-id="${msg.id}">${t("action.delete")}</button>
        ` : ""}
      </div>
      ${!isReply ? `
        <div class="board-replies" id="replies-${msg.id}" style="display:none"></div>
        <div class="board-reply-form" id="reply-form-${msg.id}" style="display:none">
          <textarea class="input board-reply-input" placeholder="${t("board.reply_placeholder")}"></textarea>
          <button class="btn btn--primary btn--sm board-reply-submit" data-parent-id="${msg.id}">${t("action.reply")}</button>
        </div>
      ` : ""}
    </div>
  `;
}
