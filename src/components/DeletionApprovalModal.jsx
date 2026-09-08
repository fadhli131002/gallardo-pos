import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ShieldCheck, ShieldAlert, X, Check, Trash2, XCircle, Search, Clock, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrderContext';

/**
 * Modal untuk Superadmin / Owner mereview & menyetujui / menolak permohonan hapus data customer
 */
const DeletionApprovalModal = ({ isOpen, onClose, onRefreshData }) => {
  const { token, user } = useAuth();
  const { deleteOrder, refreshOrdersFromApi } = useOrders();

  const [requests, setRequests] = useState([]);
  const [counts, setCounts] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [statusFilter, setStatusFilter] = useState('PENDING'); // 'PENDING' | 'ALL' | 'APPROVED' | 'REJECTED'
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  // State untuk modal input alasan penolakan
  const [rejectingRequest, setRejectingRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // State untuk konfirmasi Approve
  const [approvingRequest, setApprovingRequest] = useState(null);

  const fetchRequests = useCallback(async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      const res = await fetch(`${window.API_URL || ''}/api/deletion-requests?status=ALL`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setRequests(json.data || []);
          if (json.counts) setCounts(json.counts);
        }
      }
    } catch (err) {
      console.error('Error fetching deletion requests:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isOpen) {
      fetchRequests();
    }
  }, [isOpen, fetchRequests]);

  const filteredRequests = useMemo(() => {
    let list = [...requests];
    if (statusFilter !== 'ALL') {
      list = list.filter(r => r.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(r =>
        (r.customer_name || '').toLowerCase().includes(q) ||
        (r.plate_number || '').toLowerCase().includes(q) ||
        (r.car_brand || '').toLowerCase().includes(q) ||
        (r.cashier_name || '').toLowerCase().includes(q) ||
        (r.reason || '').toLowerCase().includes(q) ||
        String(r.id).includes(q)
      );
    }
    return list;
  }, [requests, statusFilter, searchQuery]);

  const handleApprove = async () => {
    if (!approvingRequest) return;
    try {
      setProcessingId(approvingRequest.id);
      const res = await fetch(`${window.API_URL || ''}/api/deletion-requests/${approvingRequest.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          actionReason: 'Disetujui oleh Superadmin / Owner'
        })
      });

      const json = await res.json();
      if (json.success) {
        toast.success(json.message || 'Data customer berhasil dihapus permanen.');
        
        // Hapus juga dari local OrderContext jika transaksi terkait terdaftar
        if (approvingRequest.transaction_id && deleteOrder) {
          deleteOrder(approvingRequest.transaction_id);
        }
        if (refreshOrdersFromApi) refreshOrdersFromApi();
        if (onRefreshData) onRefreshData();

        fetchRequests();
        setApprovingRequest(null);
      } else {
        toast.error(json.message || 'Gagal menyetujui penghapusan.');
      }
    } catch (err) {
      console.error('Error approving deletion request:', err);
      toast.error('Gagal menghubungi server: ' + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (e) => {
    if (e) e.preventDefault();
    if (!rejectingRequest) return;

    try {
      setProcessingId(rejectingRequest.id);
      const res = await fetch(`${window.API_URL || ''}/api/deletion-requests/${rejectingRequest.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          rejectionReason: rejectionReason.trim() || 'Permintaan ditolak oleh Superadmin.'
        })
      });

      const json = await res.json();
      if (json.success) {
        toast.success(json.message || 'Pengajuan hapus berhasil ditolak.');
        fetchRequests();
        setRejectingRequest(null);
        setRejectionReason('');
      } else {
        toast.error(json.message || 'Gagal menolak pengajuan.');
      }
    } catch (err) {
      console.error('Error rejecting deletion request:', err);
      toast.error('Gagal menghubungi server: ' + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  if (!isOpen) return null;

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
        maxWidth: '1100px',
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
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #fecdd3'
            }}>
              <ShieldCheck size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '700', color: '#1e293b' }}>
                  Pusat Persetujuan Hapus Data Customer (Superadmin)
                </h3>
                {counts.pending > 0 && (
                  <span style={{
                    backgroundColor: '#dc2626',
                    color: '#ffffff',
                    fontSize: '0.72rem',
                    fontWeight: '700',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    animation: 'pulse 2s infinite'
                  }}>
                    {counts.pending} Perlu Tindakan
                  </span>
                )}
              </div>
              <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                Tinjau, setujui (eksekusi hapus permanen), atau tolak pengajuan hapus data customer dari kasir/sales
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Toolbar & Filter Tabs */}
        <div style={{
          padding: '12px 24px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          {/* Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              onClick={() => setStatusFilter('PENDING')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: '600',
                cursor: 'pointer',
                border: statusFilter === 'PENDING' ? '1.5px solid #d97706' : '1px solid #e2e8f0',
                backgroundColor: statusFilter === 'PENDING' ? '#fef3c7' : '#ffffff',
                color: statusFilter === 'PENDING' ? '#b45309' : '#64748b'
              }}
            >
              Menunggu Approval ({counts.pending})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: '600',
                cursor: 'pointer',
                border: statusFilter === 'ALL' ? '1.5px solid #4338ca' : '1px solid #e2e8f0',
                backgroundColor: statusFilter === 'ALL' ? '#e0e7ff' : '#ffffff',
                color: statusFilter === 'ALL' ? '#3730a3' : '#64748b'
              }}
            >
              Semua Riwayat ({counts.total})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('APPROVED')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: '600',
                cursor: 'pointer',
                border: statusFilter === 'APPROVED' ? '1.5px solid #16a34a' : '1px solid #e2e8f0',
                backgroundColor: statusFilter === 'APPROVED' ? '#dcfce7' : '#ffffff',
                color: statusFilter === 'APPROVED' ? '#15803d' : '#64748b'
              }}
            >
              Disetujui ({counts.approved})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('REJECTED')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: '600',
                cursor: 'pointer',
                border: statusFilter === 'REJECTED' ? '1.5px solid #dc2626' : '1px solid #e2e8f0',
                backgroundColor: statusFilter === 'REJECTED' ? '#fee2e2' : '#ffffff',
                color: statusFilter === 'REJECTED' ? '#b91c1c' : '#64748b'
              }}
            >
              Ditolak ({counts.rejected})
            </button>
          </div>

          {/* Search Box & Refresh */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ position: 'relative', width: '260px' }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Cari customer, plat, kasir..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 12px 7px 34px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '0.84rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <button
              type="button"
              onClick={fetchRequests}
              disabled={isLoading}
              title="Perbarui data"
              style={{
                padding: '7px 10px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#475569',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div style={{ padding: '0', overflowY: 'auto', flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0', color: '#475569', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px', fontWeight: '700', width: '80px' }}>Req ID</th>
                <th style={{ padding: '12px 16px', fontWeight: '700' }}>Waktu & Kasir</th>
                <th style={{ padding: '12px 16px', fontWeight: '700' }}>Customer & Kontak</th>
                <th style={{ padding: '12px 16px', fontWeight: '700' }}>Kendaraan & Plat</th>
                <th style={{ padding: '12px 16px', fontWeight: '700', minWidth: '180px' }}>Alasan Penghapusan</th>
                <th style={{ padding: '12px 16px', fontWeight: '700', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '12px 16px', fontWeight: '700', textAlign: 'right', minWidth: '170px' }}>Aksi Superadmin</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
                    {isLoading ? 'Memuat daftar pengajuan...' : 'Tidak ada data pengajuan yang sesuai filter'}
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => {
                  const isPending = req.status === 'PENDING';
                  const isApproved = req.status === 'APPROVED';
                  const isRejected = req.status === 'REJECTED';
                  const isCurrentProcessing = processingId === req.id;

                  return (
                    <tr key={req.id} style={{ borderBottom: '1px solid #f1f5f9' }} className="hover:bg-slate-50">
                      <td style={{ padding: '12px 16px', fontWeight: '700', color: '#0f172a' }}>
                        #{req.id}
                        {req.customer_id && (
                          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '400' }}>
                            {req.customer_id}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: '600', color: '#0f172a' }}>{req.cashier_name}</div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                          {new Date(req.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: '700', color: '#0f172a' }}>{req.customer_name}</div>
                        <div style={{ fontSize: '0.76rem', color: '#64748b' }}>{req.customer_phone || '-'}</div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: '600', color: '#334155' }}>{req.car_brand || '-'}</div>
                        <span style={{
                          display: 'inline-block',
                          fontSize: '0.72rem',
                          fontWeight: '700',
                          backgroundColor: '#fee2e2',
                          color: '#b91c1c',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          marginTop: '2px'
                        }}>
                          {req.plate_number || '-'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ color: '#1e293b', lineHeight: 1.4, fontSize: '0.82rem' }}>
                          "{req.reason}"
                        </div>
                        {req.action_reason && (
                          <div style={{ marginTop: '4px', fontSize: '0.74rem', color: isApproved ? '#15803d' : '#b91c1c', fontStyle: 'italic' }}>
                            Catatan ({req.action_by_name}): {req.action_reason}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        {isPending && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            backgroundColor: '#fef3c7',
                            color: '#b45309',
                            fontSize: '0.74rem',
                            fontWeight: '700',
                            padding: '4px 8px',
                            borderRadius: '6px'
                          }}>
                            <Clock size={12} />
                            <span>Menunggu</span>
                          </span>
                        )}
                        {isApproved && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            backgroundColor: '#dcfce7',
                            color: '#15803d',
                            fontSize: '0.74rem',
                            fontWeight: '700',
                            padding: '4px 8px',
                            borderRadius: '6px'
                          }}>
                            <CheckCircle2 size={12} />
                            <span>Disetujui</span>
                          </span>
                        )}
                        {isRejected && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            backgroundColor: '#fee2e2',
                            color: '#b91c1c',
                            fontSize: '0.74rem',
                            fontWeight: '700',
                            padding: '4px 8px',
                            borderRadius: '6px'
                          }}>
                            <XCircle size={12} />
                            <span>Ditolak</span>
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        {isPending ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              disabled={isCurrentProcessing}
                              onClick={() => setApprovingRequest(req)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                backgroundColor: '#16a34a',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '5px 10px',
                                fontSize: '0.78rem',
                                fontWeight: '600',
                                cursor: isCurrentProcessing ? 'not-allowed' : 'pointer'
                              }}
                              title="Setujui dan hapus data secara permanen"
                            >
                              <Check size={13} />
                              <span>Approve</span>
                            </button>
                            <button
                              type="button"
                              disabled={isCurrentProcessing}
                              onClick={() => {
                                setRejectingRequest(req);
                                setRejectionReason('');
                              }}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                backgroundColor: '#ef4444',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '5px 10px',
                                fontSize: '0.78rem',
                                fontWeight: '600',
                                cursor: isCurrentProcessing ? 'not-allowed' : 'pointer'
                              }}
                              title="Tolak permintaan hapus"
                            >
                              <X size={13} />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
                            Selesai diproses
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Hak akses persetujuan penghapusan data berada di bawah wewenang Superadmin / Owner
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: '#4338ca',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 20px',
              fontSize: '0.84rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Sub-modal: Konfirmasi Approve */}
      {approvingRequest && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          zIndex: 100000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            width: '100%',
            maxWidth: '460px',
            padding: '24px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <Trash2 size={28} />
            </div>
            <h4 style={{ margin: '0 0 8px', fontSize: '1.1rem', fontWeight: '700', color: '#111827' }}>
              Setujui & Hapus Permanen?
            </h4>
            <p style={{ margin: '0 0 16px', fontSize: '0.84rem', color: '#4b5563', lineHeight: 1.5 }}>
              Anda akan menyetujui pengajuan hapus dari <strong>{approvingRequest.cashier_name}</strong> untuk customer <strong>{approvingRequest.customer_name}</strong> (Plat: {approvingRequest.plate_number || '-'}). Data transaksi akan dihapus permanen dari database.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setApprovingRequest(null)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  backgroundColor: '#ffffff',
                  color: '#374151',
                  fontWeight: '600',
                  fontSize: '0.84rem',
                  cursor: 'pointer'
                }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleApprove}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  fontWeight: '600',
                  fontSize: '0.84rem',
                  cursor: 'pointer'
                }}
              >
                Ya, Setujui & Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-modal: Input Alasan Tolak (Reject) */}
      {rejectingRequest && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          zIndex: 100000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            width: '100%',
            maxWidth: '480px',
            padding: '24px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)'
          }}>
            <h4 style={{ margin: '0 0 8px', fontSize: '1.08rem', fontWeight: '700', color: '#991b1b' }}>
              Tolak Pengajuan Hapus Data Customer
            </h4>
            <p style={{ margin: '0 0 14px', fontSize: '0.82rem', color: '#64748b' }}>
              Berikan catatan penolakan untuk kasir <strong>{rejectingRequest.cashier_name}</strong> terkait customer <strong>{rejectingRequest.customer_name}</strong>:
            </p>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Contoh: Transaksi ini valid dan telah tercatat pembayarannya..."
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.85rem',
                outline: 'none',
                boxSizing: 'border-box',
                marginBottom: '16px',
                fontFamily: 'inherit'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setRejectingRequest(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  backgroundColor: '#ffffff',
                  color: '#374151',
                  fontWeight: '600',
                  fontSize: '0.84rem',
                  cursor: 'pointer'
                }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleReject}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  fontWeight: '600',
                  fontSize: '0.84rem',
                  cursor: 'pointer'
                }}
              >
                Tolak Pengajuan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};

export default DeletionApprovalModal;
