/* firebase-messaging-sw.js */

importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js");

const API_BASE = "https://byfoot.up.railway.app";
let messagingInitialized = false;

async function initMessaging() {
  if (messagingInitialized) return firebase.messaging();

  const res = await fetch(`${API_BASE}/push/config/`);
  if (!res.ok) return null;
  const config = await res.json();

  if (!firebase.apps.length) {
    firebase.initializeApp({
      apiKey: config.api_key,
      projectId: config.project_id,
      messagingSenderId: config.messaging_sender_id,
      appId: config.app_id,
    });
  }

  messagingInitialized = true;
  return firebase.messaging();
}

initMessaging().then((messaging) => {
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
