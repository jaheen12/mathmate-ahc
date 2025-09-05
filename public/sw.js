/**
 * Welcome to your Workbox-powered service worker!
 *
 * This file is a starting point for your service worker logic. It uses Workbox
 * to handle precaching of your app's files and provides routing for runtime
 * caching of assets like images and fonts.
 */

// Make sure Workbox is loaded.
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

// This is a placeholder that will be replaced by the Vite PWA plugin
// with a list of all your app's files (JS, CSS, HTML, etc.) during the build process.
// This is the core of precaching your app shell.
workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || []);

// Clean up old caches that are no longer in use.
workbox.precaching.cleanupOutdatedCaches();

// --- Runtime Caching Strategies ---

// Strategy 1: Cache pages (HTML) with a Network First approach.
// This ensures users always get the latest page if they are online,
// but can still access the app from the cache if they are offline.
workbox.routing.registerRoute(
  ({ request }) => request.mode === 'navigate',
  new workbox.strategies.NetworkFirst({
    cacheName: 'pages',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
      }),
    ],
  })
);

// Strategy 2: Cache CSS, JavaScript, and Web Worker files with a Stale While Revalidate strategy.
// This serves files from the cache for speed, but fetches an update in the background for the next visit.
workbox.routing.registerRoute(
  ({ request }) =>
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'worker',
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'assets',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
      }),
    ],
  })
);

// Strategy 3: Cache images with a Cache First strategy.
// Once an image is in the cache, it will be served from there, which is very fast.
// The network is only used if the image is not already in the cache.
workbox.routing.registerRoute(
  ({ request }) => request.destination === 'image',
  new workbox.strategies.CacheFirst({
    cacheName: 'images',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 100, // Maximum number of images to cache
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
      }),
    ],
  })
);

// Strategy 4: Caching Google Fonts
// Special handling for Google Fonts to ensure they work offline.
workbox.routing.registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com',
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'google-fonts-stylesheets',
  })
);
workbox.routing.registerRoute(
  ({ url }) => url.origin === 'https://fonts.gstatic.com',
  new workbox.strategies.CacheFirst({
    cacheName: 'google-fonts-webfonts',
    plugins: [
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new workbox.expiration.ExpirationPlugin({
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 Year
        maxEntries: 30,
      }),
    ],
  })
);

// --- Handle Updates and Take Control ---

// This event listener ensures that the new service worker activates
// as soon as it's installed, instead of waiting for the user to close all tabs.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});