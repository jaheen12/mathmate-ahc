// src/serviceWorkerRegistration.js

// This is optional: basic registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(err => {
        console.error('SW registration failed: ', err);
      });
  });
}