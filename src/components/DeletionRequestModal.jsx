import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ShieldAlert, X, Send, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

/**
 * Modal untuk Kasir/Sales mengajukan permohonan hapus data customer ke Superadmin
 */
const DeletionRequestModal = ({ isOpen, onClose, order, onSuccess }) => {
  const { token, user } = useAuth();
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !order) return null;

  // Ekstraksi ID Transaksi numerik murni jika ada (misal dari order.dbId, "WRK/26-09-003-0312" -> 312, atau "RTL-DB-12" -> 12)
  let numericTrxId = null;
  if (order.dbId && !isNaN(Number(order.dbId))) {
    numericTrxId = Number(order.dbId);
  } else if (order.rawId && !isNaN(Number(order.rawId))) {
    numericTrxId = Number(order.rawId);
  } else if (order.transactionId && !isNaN(Number(order.transactionId))) {
    numericTrxId = Number(order.transactionId);
  } else if (typeof order.id === 'number') {
    numericTrxId = order.id;
  } else if (typeof order.id === 'string') {
    const parts = order.id.split(/[-/]/);
    const lastPart = parts[parts.length - 1];
    const match = lastPart.match(/\d+/);
    if (match) {
      numericTrxId = parseInt(match[0], 10);
    } else {
      const endMatch = order.id.match(/(\d+)$/);
      if (endMatch) numericTrxId = parseInt(endMatch[1], 10);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error('Harap masukkan alasan pengajuan penghapusan.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch(`${window.API_URL || ''}/api/deletion-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          transactionId: numericTrxId,
          customerId: order.formattedId || String(order.id),
          customerName: order.customerName || 'Pelanggan',
          customerPhone: order.customerHp || order.phone || '',
          plateNumber: order.plateNumber || '',
          carBrand: `${order.carBrand || ''} ${order.carModel || ''}`.trim(),
          totalAmount: order.totalPrice || order.totalAmount || 0,
          reason: reason.trim(),
          cashierName: user?.name || 'Kasir'
        })
      });

      const json = await res.json();
      if (json.success) {
        toast.success(json.message || 'Pengajuan hapus berhasil dikirim ke Superadmin.');
        setReason('');
        if (onSuccess) onSuccess();
        onClose();
      } else {
        toast.error(json.message || 'Gagal mengajukan penghapusan.');
      }
    } catch (err) {
      console.error('Error submitting deletion request:', err);
      toast.error('Gagal menghubungi server: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(5px)',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      boxSizing: 'border-box'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '520px',
        maxHeight: '88vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid #fee2e2',
          backgroundColor: '#fef2f2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #fecdd3'
            }}>
              <ShieldAlert size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.08rem', fontWeight: '700', color: '#991b1b' }}>
                Pengajuan Hapus Data Customer
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#b91c1c' }}>
                Permintaan akan diteruskan ke Superadmin untuk persetujuan
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              background: 'none',
              border: 'none',
              color: '#991b1b',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Info Box Data yang akan dihapus */}
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '14px 16px'
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>
                Detail Data Customer
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.84rem' }}>
                <div>
                  <span style={{ color: '#64748b' }}>Customer: </span>
                  <strong style={{ color: '#0f172a' }}>{order.customerName}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Plat: </span>
                  <strong style={{ color: '#0f172a' }}>{order.plateNumber || '-'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Kendaraan: </span>
                  <span style={{ color: '#334155' }}>{order.carBrand} {order.carModel}</span>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Nominal: </span>
                  <strong style={{ color: '#16a34a' }}>Rp {Number(order.totalPrice || order.totalAmount || 0).toLocaleString('id-ID')}</strong>
                </div>
              </div>
            </div>

            {/* Input Alasan */}
            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                Alasan Penghapusan <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <textarea
                rows={3}
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Contoh: Terjadi salah input dobel transaksi, customer membatalkan order sebelum pengerjaan, dll..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              backgroundColor: '#fffbeb',
              border: '1px solid #fef3c7',
              borderRadius: '8px',
              padding: '10px 12px',
              fontSize: '0.78rem',
              color: '#92400e'
            }}>
              <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#d97706' }} />
              <div>
                Sebagai Kasir / Sales, Anda tidak memiliki akses untuk menghapus data secara langsung. Permintaan ini akan masuk ke daftar review Superadmin.
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div style={{
            padding: '14px 24px',
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px'
          }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#475569',
                fontSize: '0.84rem',
                fontWeight: '600',
                cursor: isSubmitting ? 'not-allowed' : 'pointer'
              }}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reason.trim()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 18px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: isSubmitting || !reason.trim() ? '#94a3b8' : '#dc2626',
                color: '#ffffff',
                fontSize: '0.84rem',
                fontWeight: '600',
                cursor: isSubmitting || !reason.trim() ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 4px rgba(220, 38, 38, 0.25)',
                transition: 'all 0.15s ease'
              }}
            >
              <Send size={14} />
              <span>{isSubmitting ? 'Mengirim...' : 'Kirim Pengajuan Hapus'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default DeletionRequestModal;
