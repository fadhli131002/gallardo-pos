import React from 'react';
import { usePWA } from '../context/PWAContext';
import { Download } from '@/icons/itshover';

export default function PWAInstallNavItem({ isExpanded = false, NavText }) {
  const { isInstallable, isInstalled, promptInstall } = usePWA();

  // Only show if installable and not already running installed
  if (!isInstallable || isInstalled) {
    return null;
  }

  const handleClick = (e) => {
    e.preventDefault();
    promptInstall();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="nav-item pwa-install-nav-btn text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50/80 transition-colors"
      title="Pasang Gallardo POS ke Perangkat (PWA)"
      aria-label="Pasang aplikasi Gallardo POS ke layar utama perangkat"
      style={{
        background: 'none',
        border: 'none',
        width: '100%',
        cursor: 'pointer',
        justifyContent: isExpanded ? 'flex-start' : 'center',
        padding: isExpanded ? '1rem 1.25rem' : '1rem 0'
      }}
    >
      <Download size={22} style={{ flexShrink: 0 }} aria-hidden="true" />
      {NavText ? (
        <NavText className="font-sans font-semibold text-emerald-600">
          Pasang Aplikasi
        </NavText>
      ) : isExpanded ? (
        <span className="font-sans font-semibold text-emerald-600 text-sm ml-4 whitespace-nowrap">
          Pasang Aplikasi
        </span>
      ) : null}
    </button>
  );
}
