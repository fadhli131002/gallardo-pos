import React from 'react';
import { usePWA } from '../context/PWAContext';
import { AlertTriangle, RefreshCw } from '@/icons/itshover';

export default function PWABanner() {
  const { isOnline, showUpdatePrompt, updateApp } = usePWA();

  // If online and no update is waiting, render nothing
  if (isOnline && !showUpdatePrompt) {
    return null;
  }

  return (
    <aside aria-label="Notifikasi Status Aplikasi" className="pwa-banner-container">
      {/* 1. Offline Notification Bar */}
      {!isOnline && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center justify-between gap-3 px-4 py-2.5 text-xs sm:text-sm font-medium bg-amber-500 text-slate-950 border-b border-amber-600 shadow-sm"
        >
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={18} className="shrink-0 text-slate-950" aria-hidden="true" />
            <span>
              <strong>Mode Offline:</strong> Koneksi internet terputus. Data tersimpan tetap dapat diakses, namun transaksi kasir dan mutasi stok memerlukan sambungan online.
            </span>
          </div>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-amber-600/30 text-slate-950">
            Offline
          </span>
        </div>
      )}

      {/* 2. New Version Update Prompt */}
      {showUpdatePrompt && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 px-4 py-2 text-xs sm:text-sm font-medium bg-slate-900 text-white border-b border-indigo-500/40 shadow-md"
        >
          <div className="flex items-center gap-2.5">
            <RefreshCw size={16} className="shrink-0 text-indigo-400 animate-spin" aria-hidden="true" />
            <span>
              <strong>Pembaruan Tersedia:</strong> Versi terbaru Gallardo POS telah siap dipasang.
            </span>
          </div>
          <button
            type="button"
            onClick={updateApp}
            className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shrink-0 cursor-pointer shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            Perbarui Sekarang
          </button>
        </div>
      )}
    </aside>
  );
}
