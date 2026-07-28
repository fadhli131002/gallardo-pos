import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, title = "Hapus Data?", message = "Data yang dihapus tidak dapat dikembalikan." }) => {
  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '380px', position: 'relative', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', textAlign: 'center' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
          <X size={20} />
        </button>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626', marginBottom: '16px' }}>
            <AlertTriangle size={28} />
          </div>
          
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111', marginBottom: '8px' }}>
            {title}
          </h3>
          <p style={{ color: '#4b5563', fontSize: '0.875rem', marginBottom: '24px', lineHeight: '1.5' }}>
            {message}
          </p>
          
          <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
            <button 
              onClick={onClose}
              style={{ flex: 1, padding: '10px 16px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#fff', color: '#374151', fontWeight: '600', cursor: 'pointer' }}
            >
              Batal
            </button>
            <button 
              onClick={() => {
                onConfirm();
              }}
              style={{ flex: 1, padding: '10px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#dc2626', color: '#fff', fontWeight: '600', cursor: 'pointer' }}
            >
              Hapus
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
