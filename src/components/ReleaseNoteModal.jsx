import React from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, X, Check, Megaphone, Calendar, Tag, ShieldCheck, ArrowRight } from 'lucide-react';

/**
 * Modal modern untuk menampilkan pengumuman What's New / Release Notes
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
    const lines = rawText.split('\n');

    return lines.map((line, idx) => {
      const trimmed = line.trim();

      // Heading 3 atau 2 (### atau ##)
      if (trimmed.startsWith('### ') || trimmed.startsWith('## ')) {
        const headingText = trimmed.replace(/^#{2,3}\s+/, '');
        return (
          <h4 key={idx} style={{
            fontSize: '0.98rem',
            fontWeight: '800',
            color: '#1e1b4b',
            margin: '14px 0 6px 0',
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
        const bulletText = trimmed.replace(/^[-*]\s+/, '');
        // Parse bold **text**
        const parts = bulletText.split(/(\*\*.*?\*\*)/g);
        return (
          <div key={idx} style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            fontSize: '0.84rem',
            color: '#334155',
            lineHeight: 1.55,
            marginBottom: '6px',
            paddingLeft: '4px'
          }}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#6366f1',
              marginTop: '7px',
              flexShrink: 0
            }} />
            <div>
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
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={idx} style={{ fontSize: '0.84rem', color: '#475569', lineHeight: 1.55, margin: '4px 0' }}>
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

  return createPortal(
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(15, 23, 42, 0.7)',
      backdropFilter: 'blur(6px)',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '560px',
        maxHeight: '88vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
        overflow: 'hidden',
        position: 'relative',
        border: '1px solid #e0e7ff'
      }}>
        {/* Banner Header dengan Gradien Modern */}
        <div style={{
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #9333ea 100%)',
          padding: '24px 24px 20px',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Decorative background glow */}
          <div style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.15)',
            filter: 'blur(10px)'
          }} />

          {/* Close button */}
          <button
            type="button"
            onClick={handleGotIt}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.35)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
          >
            <X size={18} />
          </button>

          {/* Tag & Icon */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              backgroundColor: 'rgba(255, 255, 255, 0.22)',
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
            margin: '0 0 6px 0',
            fontSize: '1.25rem',
            fontWeight: '800',
            lineHeight: 1.35,
            color: '#ffffff',
            textShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            {releaseNote.title}
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.76rem', color: 'rgba(255, 255, 255, 0.85)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={13} />
              {new Date(releaseNote.created_at || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            {releaseNote.author_name && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={13} />
                Oleh {releaseNote.author_name}
              </span>
            )}
          </div>
        </div>

        {/* Jika dalam History Mode: Selector Versi Lain */}
        {allNotes && allNotes.length > 1 && (
          <div style={{
            padding: '10px 20px',
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto'
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

        {/* Konten Rincian Update */}
        <div style={{
          padding: '20px 24px',
          overflowY: 'auto',
          flex: 1,
          backgroundColor: '#ffffff'
        }}>
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
            <div style={{ fontSize: '0.78rem', color: '#6b21a8', lineHeight: 1.45 }}>
              Sistem telah diperbarui secara otomatis. Berikut adalah rincian fitur baru, perbaikan alur operasional, dan peningkatan performa sistem.
            </div>
          </div>

          {/* Formatted Content */}
          <div style={{ padding: '0 4px' }}>
            {renderFormattedContent(releaseNote.content)}
          </div>
        </div>

        {/* Footer Aksi */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
            POS Gallardo Enterprise System
          </span>
          <button
            type="button"
            onClick={handleGotIt}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 20px',
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
