import React, { useState, useEffect, useCallback } from 'react';
import { Megaphone, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { LATEST_SYSTEM_RELEASE } from '../config/systemReleaseNotes';

const STORAGE_KEY = 'last_seen_release_version';

/**
 * Komponen Tombol Megaphone untuk ditaruh di Header / Top Bar / Sidebar.
 * Menampilkan badge titik merah berdenyut jika ada update baru yang belum dibaca.
 */
const MegaphoneButton = ({ className = '', style = {}, showLabel = false }) => {
  const { token, user } = useAuth();
  const [hasUnread, setHasUnread] = useState(false);
  const [latestVersion, setLatestVersion] = useState(LATEST_SYSTEM_RELEASE?.version || 'v2.6.0');

  const checkUnread = useCallback(async () => {
    if (!token || !user) return;
    try {
      const res = await fetch(`${window.API_URL || ''}/api/release-notes/latest`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setLatestVersion(json.data.version);
          const lastSeen = localStorage.getItem(STORAGE_KEY);
          setHasUnread(lastSeen !== json.data.version);
          return;
        }
      }
    } catch (e) {
      // Graceful error
    }

    // Fallback ke local manifest
    if (LATEST_SYSTEM_RELEASE) {
      setLatestVersion(LATEST_SYSTEM_RELEASE.version);
      const lastSeen = localStorage.getItem(STORAGE_KEY);
      setHasUnread(lastSeen !== LATEST_SYSTEM_RELEASE.version);
    }
  }, [token, user]);

  useEffect(() => {
    checkUnread();
  }, [checkUnread]);

  useEffect(() => {
    const handleAck = (e) => {
      setHasUnread(false);
    };
    window.addEventListener('release-note-acknowledged', handleAck);
    return () => window.removeEventListener('release-note-acknowledged', handleAck);
  }, []);

  const handleClick = () => {
    window.dispatchEvent(new CustomEvent('open-release-notes'));
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title={hasUnread ? `Ada update sistem baru (${latestVersion})!` : 'Lihat Catatan Rilis & Fitur Baru (What\'s New)'}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        padding: showLabel ? '7px 14px' : '8px',
        borderRadius: '10px',
        border: hasUnread ? '1px solid #c7d2fe' : '1px solid #e2e8f0',
        backgroundColor: hasUnread ? '#eef2ff' : '#ffffff',
        color: hasUnread ? '#4338ca' : '#475569',
        cursor: 'pointer',
        fontSize: '0.82rem',
        fontWeight: '600',
        transition: 'all 0.2s ease',
        ...style
      }}
      className={`hover:bg-indigo-50 hover:text-indigo-600 transition-colors ${className}`}
    >
      <Megaphone size={18} className={hasUnread ? 'text-indigo-600 animate-bounce' : 'text-slate-600'} />
      {showLabel && <span>What's New</span>}

      {/* Unread indicator badge */}
      {hasUnread && (
        <span style={{
          position: 'absolute',
          top: '-3px',
          right: '-3px',
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          backgroundColor: '#ef4444',
          border: '2px solid #ffffff',
          boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)'
        }} />
      )}
    </button>
  );
};

export default MegaphoneButton;
