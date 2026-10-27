import React from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, X, Check, Megaphone, Calendar, Tag, ShieldCheck } from 'lucide-react';

/**
 * Utility untuk menghapus karakter emoji unicode dari teks (menjaga format newline tetap utuh)
 */
const stripEmojis = (text) => {
  if (!text) return '';
  return text
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1FA00}-\u{1FAFF}\u{200D}\u{FE0F}]/gu, '');
};

/**
 * Modal modern untuk menampilkan pengumuman What's New / Release Notes
 * Didesain tanpa emoji dengan layout responsif anti-terpotong (flex-shrink protection)
 */
const ReleaseNoteModal = ({
  isOpen,
  onClose,
  releaseNote,
  onAcknowledge,
  isHistoryMode = false,
  allNotes = [],
  onSelectNote
}) => {
  if (!isOpen || !releaseNote) return null;

  const handleGotIt = () => {
    if (onAcknowledge) {
      onAcknowledge(releaseNote.version);
    }
    onClose();
  };

  // Helper untuk memformat teks markdown sederhana (bullet points, bold, headings)
  const renderFormattedContent = (rawText) => {
    if (!rawText) return null;
    const lines = rawText.split(/\r?\n/);

    return lines.map((line, idx) => {
      const cleanLine = stripEmojis(line);
      const trimmed = cleanLine.trim();

      // Heading 3 atau 2 (### atau ##)
      if (trimmed.startsWith('### ') || trimmed.startsWith('## ')) {
        const headingText = trimmed.replace(/^#{2,3}\s+/, '').trim();
        return (
          <h4 key={idx} style={{
            fontSize: '0.98rem',
            fontWeight: '800',
            color: '#1e1b4b',
            margin: '20px 0 8px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            {headingText}
          </h4>
        );
      }

      // Bullet point (- atau *)
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const bulletText = stripEmojis(trimmed.replace(/^[-*]\s+/, ''));
        // Parse bold **text**
        const parts = bulletText.split(/(\*\*.*?\*\*)/g);
        return (
          <div key={idx} style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            fontSize: '0.86rem',
            color: '#334155',
            lineHeight: 1.6,
            marginBottom: '6px',
            paddingLeft: '2px'
          }}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#6366f1',
              marginTop: '8px',
              flexShrink: 0
            }} />
            <div style={{ flex: 1 }}>
              {parts.map((part, pIdx) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return <strong key={pIdx} style={{ color: '#0f172a', fontWeight: '700' }}>{part.slice(2, -2)}</strong>;
                }
                return <span key={pIdx}>{part}</span>;
              })}
            </div>
          </div>
        );
      }

      // Baris kosong
      if (!trimmed) {
        return <div key={idx} style={{ height: '6px' }} />;
      }

      // Paragraf biasa dengan parsing bold
      const parts = stripEmojis(line).split(/(\*\*.*?\*\*)/g);
      return (
        <p key={idx} style={{ fontSize: '0.86rem', color: '#475569', lineHeight: 1.6, margin: '6px 0' }}>
          {parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={pIdx} style={{ color: '#0f172a', fontWeight: '700' }}>{part.slice(2, -2)}</strong>;
            }
            return <span key={pIdx}>{part}</span>;
          })}
        </p>
      );
    });
  };

  const displayTitle = stripEmojis(releaseNote.title);

  return createPortal(
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(15, 23, 42, 0.72)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      boxSizing: 'border-box'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '640px',
        maxHeight: '88vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        overflow: 'hidden',
        position: 'relative',
        border: '1px solid #e0e7ff'
      }}>
        {/* Banner Header dengan Gradien Modern (flexShrink: 0 agar tidak terpotong flexbox) */}
        <div style={{
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #9333ea 100%)',
          padding: '24px 28px 20px',
          color: '#ffffff',
          position: 'relative',
          flexShrink: 0,
          boxSizing: 'border-box'
        }}>
          {/* Decorative background glow */}
          <div style={{
            position: 'absolute',
            top: '-25px',
            right: '-25px',
            width: '130px',
            height: '130px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.15)',
            filter: 'blur(12px)',
            pointerEvents: 'none'
          }} />

          {/* Close button */}
          <button
            type="button"
            onClick={handleGotIt}
            aria-label="Tutup Pemberitahuan"
            style={{
              position: 'absolute',
              top: '18px',
              right: '18px',
              background: 'rgba(255, 255, 255, 0.22)',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              padding: '7px',
              borderRadius: '9px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              zIndex: 10
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.38)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.22)'}
          >
            <X size={18} />
          </button>

          {/* Tag & Version */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(4px)',
              padding: '4px 10px',
              borderRadius: '9999px',
              fontSize: '0.72rem',
              fontWeight: '800',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: '#ffffff'
            }}>
              <Sparkles size={13} color="#fef08a" />
              What's New in POS Gallardo
            </span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: '#fef08a',
              color: '#713f12',
              padding: '3px 10px',
              borderRadius: '9999px',
              fontSize: '0.74rem',
              fontWeight: '800'
            }}>
              <Tag size={12} />
              {releaseNote.version}
            </span>
          </div>

          {/* Judul Rilis */}
          <h2 style={{
            margin: '0 0 10px 0',
            fontSize: '1.25rem',
            fontWeight: '800',
            lineHeight: 1.4,
            color: '#ffffff',
            textShadow: '0 1px 2px rgba(0,0,0,0.15)',
            paddingRight: '36px'
          }}>
            {displayTitle}
          </h2>

          {/* Meta Info (Tanggal & Pembuat) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            fontSize: '0.78rem',
            color: 'rgba(255, 255, 255, 0.9)',
            fontWeight: '500'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Calendar size={14} />
              {new Date(releaseNote.created_at || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            {releaseNote.author_name && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <ShieldCheck size={14} />
                Oleh {releaseNote.author_name}
              </span>
            )}
          </div>
        </div>

        {/* Jika dalam History Mode: Selector Versi Lain */}
        {allNotes && allNotes.length > 1 && (
          <div style={{
            padding: '10px 24px',
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto',
            flexShrink: 0
          }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', whiteSpace: 'nowrap' }}>
              Riwayat Versi:
            </span>
            {allNotes.map((n) => {
              const isSelected = n.id === releaseNote.id;
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => onSelectNote && onSelectNote(n)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.74rem',
                    fontWeight: isSelected ? '700' : '500',
                    border: isSelected ? '1px solid #6366f1' : '1px solid #cbd5e1',
                    backgroundColor: isSelected ? '#e0e7ff' : '#ffffff',
                    color: isSelected ? '#4338ca' : '#475569',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {n.version}
                </button>
              );
            })}
          </div>
        )}

        {/* Konten Rincian Update (minHeight: 0 dan flex: 1 1 auto agar scroll bekerja sempurna) */}
        <div style={{
          padding: '22px 28px',
          overflowY: 'auto',
          flex: '1 1 auto',
          minHeight: 0,
          backgroundColor: '#ffffff'
        }}>
          {/* Info Banner tanpa emoji */}
          <div style={{
            backgroundColor: '#faf5ff',
            border: '1px solid #f3e8ff',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px'
          }}>
            <Megaphone size={18} style={{ color: '#9333ea', marginTop: '2px', flexShrink: 0 }} />
            <div style={{ fontSize: '0.82rem', color: '#6b21a8', lineHeight: 1.5, fontWeight: '500' }}>
              Sistem telah diperbarui secara otomatis. Berikut adalah rincian fitur baru, perbaikan alur operasional, dan peningkatan performa sistem.
            </div>
          </div>

          {/* Formatted Content */}
          <div style={{ padding: '0 2px' }}>
            {renderFormattedContent(releaseNote.content)}
          </div>
        </div>

        {/* Footer Aksi (flexShrink: 0 agar tidak terkompresi) */}
        <div style={{
          padding: '16px 28px',
          borderTop: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: '500' }}>
            POS Gallardo Enterprise System
          </span>
          <button
            type="button"
            onClick={handleGotIt}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 24px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              color: '#ffffff',
              fontSize: '0.84rem',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)',
              transition: 'all 0.15s ease'
            }}
          >
            <Check size={16} />
            <span>Saya Mengerti</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ReleaseNoteModal;
