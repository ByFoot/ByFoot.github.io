/* firebase-messaging-sw.js */

importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js");

const API_BASE = "https://byfoot.up.railway.app";

// Use waitUntil on install to ensure config is fetched before SW activates
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

async function getMessaging() {
  if (firebase.apps.length) return firebase.messaging();
  const res = await fetch(`${API_BASE}/push/config/`);
  if (!res.ok) return null;
  const config = await res.json();
  firebase.initializeApp({
    apiKey: config.api_key,
    projectId: config.project_id,
    messagingSenderId: config.messaging_sender_id,
    appId: config.app_id,
  });
  return firebase.messaging();
}

// Background messages (tab not focused)
getMessaging().then((messaging) => {
  if (!messaging) return;
  messaging.onBackgroundMessage((payload) => {
    const title = payload?.notification?.title || "ByFoot";
    const options = {
      body: payload?.notification?.body || "",
      icon: "/assets/favicon.png",
    };
    self.registration.showNotification(title, options);
  });
});