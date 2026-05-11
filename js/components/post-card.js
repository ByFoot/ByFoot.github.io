// components/post-card.js

function isToday(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

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

function formatExpiry(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(I18N.lang, { day: "numeric", month: "short" });
}

const TYPE_COLORS = {
  sell:   "type--sell",
  buy:    "type--buy",
  lend:   "type--lend",
  borrow: "type--borrow",
};

function postCard(post, { showActions = true, isOwn = false, onMessage, onDelete, onBoost, onReactivate } = {}) {
  const boostedToday = isToday(post.last_boosted_at);
  const typeClass = TYPE_COLORS[post.type] || "";

  return `
    <article class="post-card" data-post-id="${post.id}">
      <header class="post-card__header">
        <span class="post-type ${typeClass}">${t("post.type." + post.type)}</span>
        ${boostedToday ? `<span class="post-boosted">${t("post.boosted")}</span>` : ""}
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
        <span class="post-expiry">${t("post.expires")} ${escapeHtml(post.expires_in ?? "")}</span>

        ${showActions && !isOwn ? `
          <button class="btn btn--ghost btn--sm post-msg-btn" data-post-id="${post.id}" data-author="${escapeHtml(post.author_username)}">
            ${t("post.message")}
          </button>
        ` : ""}

        ${isOwn ? `
          <div class="post-owner-actions">
            <button class="btn btn--ghost btn--sm" data-action="reactivate" data-post-id="${post.id}">${t("post.reactivate")}</button>
            <button class="btn btn--ghost btn--sm${boostedToday ? " btn--disabled" : ""}" data-action="boost" data-post-id="${post.id}" ${boostedToday ? "disabled" : ""}>${boostedToday ? t("post.boost.done") : t("post.boost")}</button>
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
