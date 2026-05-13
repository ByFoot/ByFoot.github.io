// components/nav.js

function renderNav() {
  if (!window.APP.jwt) return;

  const hash = location.hash;
  const items = [
    { href: "#/feed",     icon: "feed",    key: "nav.feed"    },
    { href: "#/new-post", icon: "plus",    key: "nav.new_post", accent: true },
    { href: "#/chat",     icon: "chat",    key: "nav.chat"    },
    { href: "#/profile",  icon: "user",    key: "nav.profile" },
    { href: "#/settings", icon: "settings",key: "nav.settings"},
  ];

  const nav = document.getElementById("app-nav");
  if (!nav) return;

  nav.innerHTML = items.map(item => {
    const active = hash.startsWith(item.href) && item.href !== "#/new-post";
    return `
      <a href="${item.href}" class="nav-item${active ? " nav-item--active" : ""}${item.accent ? " nav-item--accent" : ""}">
        ${item.accent ? `<span class="nav-icon-wrap">${navIcon(item.icon)}</span>` : navIcon(item.icon)}
        <span class="nav-label">${t(item.key)}</span>
      </a>
    `;
  }).join("");

}

function navIcon(name) {
  const icons = {
    feed: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
    plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
    chat: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 0 1-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>`,
    user: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  };
  return `<span class="nav-icon">${icons[name] || ""}</span>`;
}
