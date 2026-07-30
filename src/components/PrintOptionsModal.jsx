import React from 'react';
import { X, Printer, Download, MessageCircle, Loader2 } from 'lucide-react';

const PrintOptionsModal = ({
  isOpen,
  onClose,
  title,
  transaction,
  isDownloading,
  onPrint,
  onDownload,
  onWhatsApp
}) => {
  if (!isOpen || !transaction) return null;

  return (
    <div className="modal-overlay animate-fade-in" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="modal-content" style={{ width: '400px', maxWidth: '100%', position: 'relative', backgroundColor: '#ffffff', borderRadius: '16px', padding: '32px 24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
        
        <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', cursor: 'pointer', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = '#4b5563'} onMouseOut={e => e.currentTarget.style.color = '#9ca3af'}>
          <X size={20} />
        </button>

        <div className="text-center mb-6 mt-2">
          <h2 className="text-[20px] font-bold text-gray-900 m-0 tracking-tight">{title}</h2>
        </div>
        
        {/* Context Badge */}
        <div style={{ backgroundColor: '#f8fafc', borderRadius: '12px', padding: '16px', marginBottom: '24px', border: '1px solid #e2e8f0', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ fontSize: '13px', color: '#64748b' }}>ID Transaksi: <span style={{ fontFamily: 'monospace', color: '#334155', fontWeight: '600' }}>{transaction.id || transaction.invoice_number || ''}</span></div>
          <div style={{ fontSize: '13px', color: '#64748b' }}>Pelanggan: <span style={{ color: '#0f172a', fontWeight: '700' }}>{transaction.customerName || transaction.supplierName || transaction.customer_name || 'Tanpa Nama'}</span></div>
        </div>
        
        <div className="flex flex-col gap-3">
          <button onClick={onPrint} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: 'transparent', color: '#1e293b', fontSize: '15px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s ease' }} onMouseOver={e => { e.currentTarget.style.backgroundColor = '#2563eb'; e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.color = '#ffffff'; }} onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#1e293b'; }}>
            <Printer size={20} />
            Langsung Print
          </button>
          
          <button onClick={onDownload} disabled={isDownloading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: 'transparent', color: '#1e293b', fontSize: '15px', fontWeight: '600', cursor: isDownloading ? 'not-allowed' : 'pointer', transition: 'all 0.2s ease', opacity: isDownloading ? 0.7 : 1 }} onMouseOver={e => { if(!isDownloading){ e.currentTarget.style.backgroundColor = '#2563eb'; e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.color = '#ffffff'; } }} onMouseOut={e => { if(!isDownloading){ e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#1e293b'; } }}>
            {isDownloading ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
            {isDownloading ? 'Sedang Menyiapkan PDF...' : 'Download PDF'}
          </button>
          
          <button onClick={onWhatsApp} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: 'transparent', color: '#1e293b', fontSize: '15px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s ease' }} onMouseOver={e => { e.currentTarget.style.backgroundColor = '#2563eb'; e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.color = '#ffffff'; }} onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#1e293b'; }}>
            <MessageCircle size={20} />
            Kirim ke WhatsApp
          </button>
        </div>

        {/* Modal Footer */}
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = '#2563eb'} onMouseOut={e => e.currentTarget.style.color = '#94a3b8'}>
            Batal
          </button>
        </div>

      </div>
    </div>
  );
};

export default PrintOptionsModal;
