/**
 * PWA Service Worker Registration & Lifecycle Controller
 */

export const registerSW = (callbacks = {}) => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        if (callbacks.onSuccess) callbacks.onSuccess(registration);

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;

          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // New update available
                console.log('[PWA] New version ready.');
                if (callbacks.onUpdate) callbacks.onUpdate(registration);
              } else {
                // Content cached for the first time
                console.log('[PWA] Content cached for offline use.');
                if (callbacks.onInstalled) callbacks.onInstalled(registration);
              }
            }
          });
        });
      })
      .catch((error) => {
        console.error('[PWA] Service Worker registration failed:', error);
      });

    // Handle controller change (when SKIP_WAITING is called)
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  });
};
