// components/reputation-badge.js

function reputationBadge(score) {
  const cls = score > 0 ? "positive" : score < 0 ? "negative" : "neutral";
  return `<span class="rep-badge rep-badge--${cls}">${score > 0 ? "+" : ""}${score}</span>`;
}
