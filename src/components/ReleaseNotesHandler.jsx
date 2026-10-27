import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import ReleaseNoteModal from './ReleaseNoteModal';
import { LATEST_SYSTEM_RELEASE, SYSTEM_RELEASE_NOTES } from '../config/systemReleaseNotes';

const STORAGE_KEY = 'last_seen_release_version';

/**
 * Global Handler untuk memeriksa rilis baru dan memicu modal pop-up otomatis.
 * Juga mendengarkan custom event 'open-release-notes' saat tombol Megaphone diklik.
 */
const ReleaseNotesHandler = () => {
  const { token, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [currentNote, setCurrentNote] = useState(null);
  const [allNotes, setAllNotes] = useState(SYSTEM_RELEASE_NOTES);
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
          return;
        }
      }
    } catch (err) {
      console.warn('API release-notes/latest unreachable, using local release notes fallback:', err);
    }

    // Fallback ke konfigurasi build jika database kosong atau belum di-seed
    const lastSeenVersion = localStorage.getItem(STORAGE_KEY);
    if (LATEST_SYSTEM_RELEASE && lastSeenVersion !== LATEST_SYSTEM_RELEASE.version) {
      setCurrentNote(LATEST_SYSTEM_RELEASE);
      setAllNotes(SYSTEM_RELEASE_NOTES);
      setIsHistoryMode(false);
      setIsOpen(true);
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
        if (json.success && json.data && json.data.length > 0) {
          setAllNotes(json.data);
          if (!currentNote) {
            setCurrentNote(json.data[0]);
          }
          return;
        }
      }
    } catch (err) {
      console.warn('Error fetching all release notes, using fallback:', err);
    }
    setAllNotes(SYSTEM_RELEASE_NOTES);
    if (!currentNote) {
      setCurrentNote(LATEST_SYSTEM_RELEASE);
    }
  }, [token, currentNote]);

  useEffect(() => {
    checkLatestRelease();
  }, [checkLatestRelease]);

  // 3. Listener untuk Event Manual (misal klik ikon Megaphone di Header)
  useEffect(() => {
    const handleOpenManual = async (e) => {
      setIsHistoryMode(true);
      let foundNotes = SYSTEM_RELEASE_NOTES;
      if (token) {
        try {
          const res = await fetch(`${window.API_URL || ''}/api/release-notes?published=true`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const json = await res.json();
            if (json.success && json.data && json.data.length > 0) {
              foundNotes = json.data;
            }
          }
        } catch (err) {
          console.warn('Error loading release notes for manual view, using fallback:', err);
        }
      }

      setAllNotes(foundNotes);
      const target = e?.detail?.targetNote || foundNotes[0] || LATEST_SYSTEM_RELEASE;
      setCurrentNote(target);
      setIsOpen(true);
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
