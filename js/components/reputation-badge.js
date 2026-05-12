// components/reputation-badge.js

function reputationBadge(score) {
  const MAX = 5;
  const clamped = Math.max(0, Math.min(MAX, score));
  const pct = (clamped / MAX) * 100;

  // Color thresholds
  let color;
  if (clamped >= 4)      color = "#22c55e"; // green
  else if (clamped >= 3) color = "#84cc16"; // lime
  else if (clamped >= 2) color = "#f59e0b"; // amber
  else if (clamped >= 1) color = "#f97316"; // orange
  else                   color = "#ef4444"; // red

  // SVG circle math (r=10, circumference ≈ 62.83)
  const r = 10;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const gap  = circ - dash;

  return `<span class="rep-circle" title="${clamped}/${MAX}">
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="18" cy="18" r="${r}" stroke="var(--border2,#e5e7eb)" stroke-width="3" fill="none"/>
        <circle cx="18" cy="18" r="${r}"
          stroke="${color}" stroke-width="3" fill="none"
          stroke-linecap="round"
          stroke-dasharray="${dash.toFixed(2)} ${gap.toFixed(2)}"
          transform="rotate(-90 18 18)"/>
        <text x="18" y="22" text-anchor="middle"
          font-size="9" font-family="var(--fm,sans-serif)"
          font-weight="600" fill="${color}">${clamped}/${MAX}</text>
      </svg>
    </span>`;
}
