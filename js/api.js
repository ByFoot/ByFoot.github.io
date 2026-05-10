// api.js — All API calls, JWT injection, token refresh

const API_BASE = "https://api.byfoot.up.railway.app"; // backend URL

async function apiFetch(path, options = {}) {
  const res = await fetch(API_BASE + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${window.APP.jwt}`,
      ...(options.headers || {}),
    },
  });

  if (res.status === 401) {
    // Attempt token refresh
    const r = await fetch(API_BASE + "/auth/token/refresh/", {
      method: "POST",
      body: JSON.stringify({ refresh: window.APP.refresh }),
      headers: { "Content-Type": "application/json" },
    });
    if (!r.ok) {
      logout();
      return null;
    }
    const data = await r.json();
    window.APP.jwt = data.access;
    localStorage.setItem("jwt", data.access);
    return apiFetch(path, options); // retry
  }

  return res;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
const API = {
  async loginGoogle(access_token) {
    return fetch(API_BASE + "/auth/social/google/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ access_token }),
    });
  },

  async loginApple(access_token, id_token) {
    return fetch(API_BASE + "/auth/social/apple/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ access_token, id_token }),
    });
  },

  // ── User ───────────────────────────────────────────────────────────────────
  async getMe() {
    return apiFetch("/me/");
  },

  async patchUsername(username) {
    return apiFetch("/me/username/", {
      method: "PATCH",
      body: JSON.stringify({ username }),
    });
  },

  async patchRadius(radius_minutes) {
    return apiFetch("/me/radius/", {
      method: "PATCH",
      body: JSON.stringify({ radius_minutes }),
    });
  },

  async patchLocation(lat, lng) {
    return apiFetch("/me/location/", {
      method: "PATCH",
      body: JSON.stringify({ lat, lng }),
    });
  },

  async patchNotifPrefs(prefs) {
    return apiFetch("/me/notification-prefs/", {
      method: "PATCH",
      body: JSON.stringify(prefs),
    });
  },

  // ── Posts ──────────────────────────────────────────────────────────────────
  async getPosts() {
    return apiFetch("/posts/");
  },

  async createPost(data) {
    return apiFetch("/posts/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async patchPost(id, data) {
    return apiFetch(`/posts/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async deletePost(id) {
    return apiFetch(`/posts/${id}/`, { method: "DELETE" });
  },

  async boostPost(id) {
    return apiFetch(`/posts/${id}/boost/`, { method: "POST" });
  },

  // ── Board ──────────────────────────────────────────────────────────────────
  async getBoard() {
    return apiFetch("/board/");
  },

  async postBoardMessage(text) {
    return apiFetch("/board/post/", {
      method: "POST",
      body: JSON.stringify({ text }),
    });
  },

  async replyBoardMessage(id, text) {
    return apiFetch(`/board/${id}/reply/`, {
      method: "POST",
      body: JSON.stringify({ text }),
    });
  },

  async deleteBoardMessage(id) {
    return apiFetch(`/board/${id}/`, { method: "DELETE" });
  },

  // ── Chat ───────────────────────────────────────────────────────────────────
  async getChats() {
    return apiFetch("/chats/");
  },

  async createChat(recipient_id, text) {
    return apiFetch("/chats/", {
      method: "POST",
      body: JSON.stringify({ recipient_id, text }),
    });
  },

  async getChatMessages(id) {
    return apiFetch(`/chats/${id}/messages/`);
  },

  async sendMessage(id, text) {
    return apiFetch(`/chats/${id}/messages/`, {
      method: "POST",
      body: JSON.stringify({ text }),
    });
  },

  async requestChatDelete(id) {
    return apiFetch(`/chats/${id}/delete-request/`, { method: "POST" });
  },

  // ── Reputation ─────────────────────────────────────────────────────────────
  async getUserReputation(id) {
    return apiFetch(`/users/${id}/reputation/`);
  },

  async voteUser(id, kind) {
    return apiFetch(`/users/${id}/vote/`, {
      method: "POST",
      body: JSON.stringify({ kind }),
    });
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function logout() {
  localStorage.removeItem("jwt");
  localStorage.removeItem("refresh");
  window.APP.jwt = null;
  window.APP.refresh = null;
  window.APP.me = null;
  location.hash = "#/login";
}

async function parseError(res) {
  try {
    const data = await res.json();
    if (data.detail) return data.detail;
    return Object.entries(data)
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
      .join(" · ");
  } catch {
    return t("error.generic");
  }
}
