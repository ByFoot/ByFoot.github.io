// components/post-card.js

function formatRelative(dateStr) {
  const d = new Date(dateStr);
  const diffMs = Date.now() - d;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return t("time.just_now");
  if (diffMin < 60) return t("time.minutes_ago", { n: diffMin });
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return t("time.hours_ago", { n: diffH });
  return t("time.days_ago", { n: Math.floor(diffH / 24) });
}

function parseDurationToMs(duration) {
  if (!duration) return null;
  const match = String(duration).trim().match(/^(\d+)\s+(\d{1,2}):(\d{2}):(\d{2})$/);
  if (!match) return null;
  const days = parseInt(match[1], 10);
  const hours = parseInt(match[2], 10);
  const minutes = parseInt(match[3], 10);
  const seconds = parseInt(match[4], 10);
  return (((days * 24 + hours) * 60 + minutes) * 60 + seconds) * 1000;
}

function formatExpiry(post) {
  const base = post.created_at ? new Date(post.created_at) : new Date();
  const durationMs = parseDurationToMs(post.expires_in);
  if (!durationMs || isNaN(base.getTime())) return "";
  const expiry = new Date(base.getTime() + durationMs);
  return expiry.toLocaleString(I18N.lang, { dateStyle: "medium", timeStyle: "short" });
}

const TYPE_COLORS = {
  sell:   "type--sell",
  buy:    "type--buy",
  lend:   "type--lend",
  borrow: "type--borrow",
};

function postCard(post, { showActions = true, isOwn = false, onMessage, onDelete, onReactivate } = {}) {
  const typeClass = TYPE_COLORS[post.type] || "";
  const expiryText = formatExpiry(post);

  return `
    <article class="post-card" data-post-id="${post.id}">
      <header class="post-card__header">
        <span class="post-type ${typeClass}">${t("post.type." + post.type)}</span>
        <span class="post-distance">${post.distance_minutes != null ? `${post.distance_minutes} ${t("post.min_walk")}` : ""}</span>
        ${reputationBadge(post.reputation_score)}
      </header>

      <div class="post-card__body">
        ${post.image_url ? `<img class="post-image" src="${escapeHtml(post.image_url)}" alt="">` : ""}
        <p class="post-text">${escapeHtml(post.title)}</p>
        ${post.price ? `<p class="post-price">${escapeHtml(post.price)}</p>` : ""}
      </div>

      <footer class="post-card__footer">
        <span class="post-author">@${escapeHtml(post.author_username)}</span>
        ${expiryText ? `<span class="post-expiry">${t("post.expires")} ${escapeHtml(expiryText)}</span>` : ""}

        ${showActions && !isOwn ? `
          <button class="btn btn--ghost btn--sm post-msg-btn" data-post-id="${post.id}" data-author="${escapeHtml(post.author_username)}">
            ${t("post.message")}
          </button>
        ` : ""}

        ${isOwn ? `
          <div class="post-owner-actions">
            <button class="btn btn--ghost btn--sm" data-action="reactivate" data-post-id="${post.id}">${t("post.reactivate")}</button>
            <button class="btn btn--danger btn--sm" data-action="delete" data-post-id="${post.id}">${t("post.delete")}</button>
          </div>
        ` : ""}
      </footer>
    </article>
  `;
}

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
