import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { registerSW } from '../pwa/registerServiceWorker';
import { toast } from 'sonner';

const PWAContext = createContext(null);

export const PWAProvider = ({ children }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [waitingWorker, setWaitingWorker] = useState(null);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);

  // Check if currently running in standalone display mode
  useEffect(() => {
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://');

    setIsInstalled(isStandalone);

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e) => {
      setIsInstalled(e.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleDisplayModeChange);
    } else {
      mediaQuery.addListener(handleDisplayModeChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleDisplayModeChange);
      } else {
        mediaQuery.removeListener(handleDisplayModeChange);
      }
    };
  }, []);

  // Listen for beforeinstallprompt event (Anti-Slop: Save event quietly without spamming popups)
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent automatic browser mini-infobar on mobile
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstallable(false);
      setIsInstalled(true);
      toast.success('Gallardo POS berhasil dipasang di perangkat Anda.');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Monitor network online / offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Koneksi internet terhubung kembali.');
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('Mode Offline aktif: Anda tetap dapat melihat data cache, namun transaksi baru memerlukan internet.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Register Service Worker and listen for updates
  useEffect(() => {
    registerSW({
      onUpdate: (registration) => {
        if (registration && registration.waiting) {
          setWaitingWorker(registration.waiting);
          setShowUpdatePrompt(true);
        }
      },
      onInstalled: () => {
        // App shell is ready for offline use
      }
    });
  }, []);

  // Trigger installation via user-initiated click
  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return false;

    try {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstallable(false);
        setDeferredPrompt(null);
        return true;
      }
      return false;
    } catch (err) {
      console.error('[PWA] Error launching install prompt:', err);
      return false;
    }
  }, [deferredPrompt]);

  // Apply update by skipping waiting and refreshing
  const updateApp = useCallback(() => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
  }, [waitingWorker]);

  return (
    <PWAContext.Provider
      value={{
        isInstallable,
        isInstalled,
        isOnline,
        showUpdatePrompt,
        promptInstall,
        updateApp
      }}
    >
      {children}
    </PWAContext.Provider>
  );
};

export const usePWA = () => {
  const context = useContext(PWAContext);
  if (!context) {
    return {
      isInstallable: false,
      isInstalled: false,
      isOnline: true,
      showUpdatePrompt: false,
      promptInstall: async () => false,
      updateApp: () => {}
    };
  }
  return context;
};
