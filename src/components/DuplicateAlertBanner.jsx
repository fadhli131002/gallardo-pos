import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, ChevronRight, X, Bell, CheckCircle, ExternalLink, ShieldAlert, User, Car, Calendar, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

const DuplicateAlertBanner = ({ onRefreshData }) => {
  const { user, token } = useAuth();
  const [duplicateData, setDuplicateData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [warningInProgress, setWarningInProgress] = useState({});

  const userRole = String(user?.role || '').toLowerCase().trim();
  const isAdminOrSuper = ['admin', 'superadmin', 'owner', 'super administrator'].includes(userRole);

  const fetchDuplicates = async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      const res = await fetch(`${window.API_URL || ''}/api/transactions/duplicates`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setDuplicateData(json);
        }
      }
    } catch (err) {
      console.error('Error fetching duplicates:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDuplicates();
  }, [token]);

  const handleWarnSales = async (trx, reason) => {
    if (!isAdminOrSuper) {
      toast.error('Hanya Admin dan Superadmin yang memiliki wewenang untuk menegur sales.');
      return;
    }

    try {
      setWarningInProgress(prev => ({ ...prev, [trx.id]: true }));
      const res = await fetch(`${window.API_URL || ''}/api/notifications/warn-sales`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          transactionId: trx.id,
          salesId: trx.salesId,
          salesName: trx.salesName,
          customerName: trx.customerName,
          plateNumber: trx.plateNumber,
          reason: reason
        })
      });

      const json = await res.json();
      if (json.success) {
        toast.success(json.message || `Peringatan berhasil dikirim ke Sales ${trx.salesName}`);
        // Refresh local duplicate list to reflect warningSent
        fetchDuplicates();
        if (onRefreshData) onRefreshData();
      } else {
        toast.error(json.message || 'Gagal mengirim peringatan');
      }
    } catch (err) {
      toast.error('Gagal menghubungi server: ' + err.message);
    } finally {
      setWarningInProgress(prev => ({ ...prev, [trx.id]: false }));
    }
  };

  if (!duplicateData || !duplicateData.hasDuplicates || duplicateData.totalDuplicates === 0) {
    return null;
  }

  return (
    <>
      <div 
        style={{
          backgroundColor: '#fff1f2',
          border: '1.5px solid #fecdd3',
          borderRadius: '12px',
          padding: '14px 20px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: '0 2px 8px rgba(225, 29, 72, 0.08)',
          animation: 'fadeIn 0.3s ease-in-out'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            backgroundColor: '#ffe4e6',
            color: '#e11d48',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: '700', fontSize: '0.92rem', color: '#9f1239' }}>
                PERINGATAN SISTEM: Terdeteksi {duplicateData.totalDuplicates} Transaksi Berindikasi Ganda
              </span>
              <span style={{
                backgroundColor: '#e11d48',
                color: '#ffffff',
                fontSize: '0.72rem',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '9999px'
              }}>
                {duplicateData.duplicateGroups.length} Kluster
              </span>
            </div>
            <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: '#be123c', lineHeight: 1.4 }}>
              Terdapat input transaksi dengan Plat Nomor atau (Nama & No HP) yang sama pada hari yang sama. Harap periksa untuk menghindari tagihan ganda atau kekeliruan pengerjaan.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#e11d48',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '0.83rem',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(225, 29, 72, 0.25)',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#be123c'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#e11d48'}
        >
          <span>Lihat Rincian Data Ganda</span>
          <ChevronRight size={15} />
        </button>
      </div>

      {/* Modal Detail Data Ganda */}
      {isModalOpen && createPortal(
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
            maxWidth: '960px',
            maxHeight: '88vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
            overflow: 'hidden',
            position: 'relative'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #ffe4e6',
              backgroundColor: '#fff1f2',
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
                  justifyContent: 'center'
                }}>
                  <ShieldAlert size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.12rem', fontWeight: '700', color: '#881337' }}>
                    Pusat Penanganan Indikasi Data Ganda
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#9f1239' }}>
                    Menampilkan seluruh kluster transaksi yang teridentifikasi duplikat pada tanggal yang sama
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#9f1239',
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

            {/* Modal Body */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, backgroundColor: '#f8fafc' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {duplicateData.duplicateGroups.map((group, groupIdx) => (
                  <div 
                    key={groupIdx} 
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1.5px solid #fecdd3',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Kluster Header */}
                    <div style={{
                      padding: '12px 18px',
                      backgroundColor: '#fff1f2',
                      borderBottom: '1px solid #fecdd3',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          backgroundColor: '#e11d48',
                          color: '#ffffff',
                          fontSize: '0.72rem',
                          fontWeight: '700',
                          padding: '2px 8px',
                          borderRadius: '6px'
                        }}>
                          Kluster #{groupIdx + 1}
                        </span>
                        <span style={{ fontWeight: '700', fontSize: '0.88rem', color: '#9f1239' }}>
                          {group.reason}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.78rem', color: '#be123c', fontWeight: '500' }}>
                        {group.transactions.length} Transaksi Terkait
                      </span>
                    </div>

                    {/* Table of Transactions in this group */}
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                            <th style={{ padding: '10px 14px', fontWeight: '600' }}>ID Transaksi</th>
                            <th style={{ padding: '10px 14px', fontWeight: '600' }}>Pelanggan & HP</th>
                            <th style={{ padding: '10px 14px', fontWeight: '600' }}>Kendaraan & Plat</th>
                            <th style={{ padding: '10px 14px', fontWeight: '600' }}>Layanan</th>
                            <th style={{ padding: '10px 14px', fontWeight: '600' }}>Total (Rp)</th>
                            <th style={{ padding: '10px 14px', fontWeight: '600' }}>PIC Sales</th>
                            <th style={{ padding: '10px 14px', fontWeight: '600', textAlign: 'right' }}>Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.transactions.map((trx) => {
                            const isWarningLoading = !!warningInProgress[trx.id];
                            return (
                              <tr key={trx.id} style={{ borderBottom: '1px solid #f1f5f9' }} className="hover:bg-rose-50/40">
                                <td style={{ padding: '12px 14px', fontWeight: '700', color: '#0f172a' }}>
                                  #{trx.id}
                                  <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: '400' }}>
                                    {new Date(trx.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                </td>
                                <td style={{ padding: '12px 14px' }}>
                                  <div style={{ fontWeight: '600', color: '#1e293b' }}>{trx.customerName}</div>
                                  <div style={{ fontSize: '0.76rem', color: '#64748b' }}>{trx.customerPhone}</div>
                                </td>
                                <td style={{ padding: '12px 14px' }}>
                                  <div style={{ fontWeight: '600', color: '#1e293b' }}>{trx.carBrand} {trx.carModel}</div>
                                  <div style={{
                                    display: 'inline-block',
                                    fontSize: '0.72rem',
                                    fontWeight: '700',
                                    backgroundColor: '#fee2e2',
                                    color: '#b91c1c',
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    marginTop: '2px'
                                  }}>
                                    {trx.plateNumber || '-'}
                                  </div>
                                </td>
                                <td style={{ padding: '12px 14px', color: '#334155', maxWidth: '160px' }}>
                                  <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {trx.items || trx.serviceType}
                                  </div>
                                </td>
                                <td style={{ padding: '12px 14px', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap' }}>
                                  Rp {Number(trx.totalAmount || 0).toLocaleString('id-ID')}
                                </td>
                                <td style={{ padding: '12px 14px' }}>
                                  <span style={{
                                    display: 'inline-block',
                                    backgroundColor: '#f1f5f9',
                                    color: '#334155',
                                    fontSize: '0.75rem',
                                    fontWeight: '600',
                                    padding: '3px 8px',
                                    borderRadius: '6px'
                                  }}>
                                    {trx.salesName}
                                  </span>
                                </td>
                                <td style={{ padding: '12px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                  {isAdminOrSuper ? (
                                    trx.warningSent ? (
                                      <span style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        color: '#15803d',
                                        backgroundColor: '#dcfce7',
                                        padding: '5px 10px',
                                        borderRadius: '6px'
                                      }}>
                                        <CheckCircle size={13} />
                                        <span>Telah Ditegur</span>
                                      </span>
                                    ) : (
                                      <button
                                        type="button"
                                        disabled={isWarningLoading}
                                        onClick={() => handleWarnSales(trx, group.reason)}
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '6px',
                                          backgroundColor: '#f59e0b',
                                          color: '#ffffff',
                                          border: 'none',
                                          borderRadius: '6px',
                                          padding: '5px 12px',
                                          fontSize: '0.78rem',
                                          fontWeight: '600',
                                          cursor: isWarningLoading ? 'not-allowed' : 'pointer',
                                          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                          transition: 'all 0.15s ease'
                                        }}
                                        onMouseEnter={(e) => { if (!isWarningLoading) e.currentTarget.style.backgroundColor = '#d97706'; }}
                                        onMouseLeave={(e) => { if (!isWarningLoading) e.currentTarget.style.backgroundColor = '#f59e0b'; }}
                                        title={`Kirim peringatan in-app ke Sales ${trx.salesName}`}
                                      >
                                        <Bell size={13} />
                                        <span>{isWarningLoading ? 'Mengirim...' : 'Tegur Sales'}</span>
                                      </button>
                                    )
                                  ) : (
                                    <span style={{
                                      fontSize: '0.75rem',
                                      color: '#94a3b8',
                                      fontStyle: 'italic'
                                    }}>
                                      Hanya Pantau
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '14px 24px',
              borderTop: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                {isAdminOrSuper 
                  ? '💡 Tekan tombol "Tegur Sales" untuk mengirimkan notifikasi in-app ke akun PIC Sales terkait.' 
                  : '💡 Anda sedang dalam mode pantau sebagai Sales Team.'}
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  backgroundColor: '#f1f5f9',
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '7px 18px',
                  fontSize: '0.84rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default DuplicateAlertBanner;
