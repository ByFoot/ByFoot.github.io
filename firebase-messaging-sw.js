/* firebase-messaging-sw.js — full rewrite
 *
 * Firebase config is forwarded as URL query params by app.js when it registers
 * this SW. No keys are hardcoded here; they all come from the backend via
 * /push/config/ and are passed through by initPushNotifications().
 *
 * iPhone / Safari notes:
 *  - importScripts() must complete synchronously at the top level.
 *  - firebase.messaging() must be called synchronously at the top level.
 *  - skipWaiting() + clients.claim() ensure the SW activates immediately
 *    without requiring the user to close all tabs.
 */

importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js");

// Parse config from query string (set by app.js at registration time)
const _p = new URLSearchParams(self.location.search);
const _apiKey            = _p.get("apiKey");
const _projectId         = _p.get("projectId");
const _messagingSenderId = _p.get("messagingSenderId");
const _appId             = _p.get("appId");

if (!_apiKey || !_projectId || !_messagingSenderId || !_appId) {
  // Log to SW devtools; app.js logs will also capture this path via the token error
  console.error("[SW] Missing Firebase config params — push will not work.",
    "apiKey:", !!_apiKey, "projectId:", !!_projectId,
    "senderId:", !!_messagingSenderId, "appId:", !!_appId);
}

firebase.initializeApp({
  apiKey:            _apiKey,
  projectId:         _projectId,
  messagingSenderId: _messagingSenderId,
  appId:             _appId,
});

// Must be called synchronously at top level — browser / Firebase requirement
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload?.notification?.title || "ByFoot";
  const body  = payload?.notification?.body  || "";
  self.registration.showNotification(title, {
    body,
    icon:  "/assets/favicon.png",
    badge: "/assets/favicon.png",
  });
});

// Take control immediately so the newly registered SW handles requests
// without forcing a page reload
self.addEventListener("install",  ()  => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(clients.claim()));
