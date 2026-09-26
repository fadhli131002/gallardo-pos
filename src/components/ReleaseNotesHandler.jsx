import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import ReleaseNoteModal from './ReleaseNoteModal';

const STORAGE_KEY = 'last_seen_release_version';

/**
 * Global Handler untuk memeriksa rilis baru dan memicu modal pop-up otomatis.
 * Juga mendengarkan custom event 'open-release-notes' saat tombol Megaphone diklik.
 */
const ReleaseNotesHandler = () => {
  const { token, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [currentNote, setCurrentNote] = useState(null);
  const [allNotes, setAllNotes] = useState([]);
  const [isHistoryMode, setIsHistoryMode] = useState(false);

  // 1. Periksa rilis terbaru saat user terautentikasi
  const checkLatestRelease = useCallback(async () => {
    if (!token || !user) return;
    try {
      const res = await fetch(`${window.API_URL || ''}/api/release-notes/latest`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const latest = json.data;
          const lastSeenVersion = localStorage.getItem(STORAGE_KEY);

          // Jika versi rilis terbaru belum pernah dilihat oleh user di browser ini
          if (lastSeenVersion !== latest.version) {
            setCurrentNote(latest);
            setIsHistoryMode(false);
            setIsOpen(true);
          }
        }
      }
    } catch (err) {
      console.error('Error checking latest release note:', err);
    }
  }, [token, user]);

  // 2. Ambil seluruh rilis untuk riwayat jika dibuka manual lewat Megaphone
  const fetchAllNotes = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${window.API_URL || ''}/api/release-notes?published=true`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setAllNotes(json.data);
          if (json.data.length > 0 && !currentNote) {
            setCurrentNote(json.data[0]);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching all release notes:', err);
    }
  }, [token, currentNote]);

  useEffect(() => {
    checkLatestRelease();
  }, [checkLatestRelease]);

  // 3. Listener untuk Event Manual (misal klik ikon Megaphone di Header)
  useEffect(() => {
    const handleOpenManual = async (e) => {
      setIsHistoryMode(true);
      if (token) {
        try {
          const res = await fetch(`${window.API_URL || ''}/api/release-notes?published=true`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const json = await res.json();
            if (json.success && json.data && json.data.length > 0) {
              setAllNotes(json.data);
              // Jika event membawa target note, gunakan target note
              const target = e?.detail?.targetNote || json.data[0];
              setCurrentNote(target);
              setIsOpen(true);
              return;
            }
          }
        } catch (err) {
          console.error('Error loading release notes for manual view:', err);
        }
      }
    };

    window.addEventListener('open-release-notes', handleOpenManual);
    return () => window.removeEventListener('open-release-notes', handleOpenManual);
  }, [token]);

  const handleAcknowledge = (version) => {
    if (version) {
      localStorage.setItem(STORAGE_KEY, version);
      // Notifikasi window event agar unread badge di Megaphone otomatis hilang
      window.dispatchEvent(new CustomEvent('release-note-acknowledged', { detail: { version } }));
    }
  };

  if (!isOpen || !currentNote) return null;

  return (
    <ReleaseNoteModal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      releaseNote={currentNote}
      onAcknowledge={handleAcknowledge}
      isHistoryMode={isHistoryMode}
      allNotes={allNotes}
      onSelectNote={(note) => setCurrentNote(note)}
    />
  );
};

export default ReleaseNotesHandler;
