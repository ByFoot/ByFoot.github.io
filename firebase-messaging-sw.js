/* firebase-messaging-sw.js */

importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js");

// Config is passed as query params by app.js when registering the SW.
// This keeps all Firebase config server-side — app.js fetches /push/config/
// and forwards the values here. No hardcoding needed.
const _p = new URLSearchParams(self.location.search);
firebase.initializeApp({
  apiKey:            _p.get("apiKey"),
  projectId:         _p.get("projectId"),
  messagingSenderId: _p.get("messagingSenderId"),
  appId:             _p.get("appId"),
});

// Must be registered synchronously at top level — browser requirement.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload?.notification?.title || "ByFoot";
  const options = {
    body: payload?.notification?.body || "",
    icon: "/assets/favicon.png",
  };
  self.registration.showNotification(title, options);
});

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(clients.claim()));