import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Users, ShoppingBag, Wrench, Award, Phone, ExternalLink, Calendar, Car, ArrowUpDown, CheckCircle, Clock, Filter, Sparkles } from 'lucide-react';

/**
 * 1. CustomerDetailModal (Drilldown Total Customer)
 * Sorted by Top Spender (Belanja Terbesar ke Terkecil) by default!
 */
export const CustomerDetailModal = ({ isOpen, onClose, customers = [], selectedMonth = '' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' (Top Spender) or 'asc'

  const filteredCustomers = useMemo(() => {
    let list = [...customers];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(c => 
        (c.name || '').toLowerCase().includes(q) ||
        (c.phone || '').includes(q) ||
        (c.plates || '').toLowerCase().includes(q) ||
        (c.vehicles || '').toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      const valA = a.totalSpent || 0;
      const valB = b.totalSpent || 0;
      return sortOrder === 'desc' ? valB - valA : valA - valB;
    });

    return list;
  }, [customers, searchQuery, sortOrder]);

  const totalAccumulatedSpent = useMemo(() => {
    return customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
  }, [customers]);

  const avgSpentPerCustomer = customers.length > 0 
    ? Math.round(totalAccumulatedSpent / customers.length) 
    : 0;

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
        maxWidth: '1050px',
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
              backgroundColor: '#e0e7ff',
              color: '#4338ca',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Users size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '700', color: '#1e293b' }}>
                  Rincian Total Pelanggan (Top Spenders)
                </h3>
                <span style={{
                  backgroundColor: '#e0e7ff',
                  color: '#4338ca',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  padding: '2px 8px',
                  borderRadius: '6px'
                }}>
                  Periode: {selectedMonth}
                </span>
              </div>
              <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                Daftar pelanggan aktif diurutkan berdasarkan akumulasi belanja tertinggi (Top Spender)
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

        {/* Metric Cards Summary */}
        <div style={{
          padding: '16px 24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #f1f5f9'
        }}>
          <div style={{ padding: '12px 16px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>Total Pelanggan Unik</div>
            <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>
              {customers.length} Pelanggan
            </div>
          </div>
          <div style={{ padding: '12px 16px', backgroundColor: '#eff6ff', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
            <div style={{ fontSize: '0.75rem', color: '#1d4ed8', fontWeight: '600' }}>Total Belanja Akumulatif</div>
            <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#1e40af', marginTop: '2px' }}>
              Rp {totalAccumulatedSpent.toLocaleString('id-ID')}
            </div>
          </div>
          <div style={{ padding: '12px 16px', backgroundColor: '#f0fdf4', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
            <div style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: '600' }}>Rata-rata Belanja / Pelanggan</div>
            <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#166534', marginTop: '2px' }}>
              Rp {avgSpentPerCustomer.toLocaleString('id-ID')}
            </div>
          </div>
        </div>

        {/* Toolbar: Search & Sort */}
        <div style={{
          padding: '12px 24px',
          backgroundColor: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Cari nama, HP, plat, kendaraan..."
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
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '7px 14px',
              fontSize: '0.82rem',
              fontWeight: '600',
              color: '#334155',
              cursor: 'pointer'
            }}
          >
            <ArrowUpDown size={14} />
            <span>Urutan: {sortOrder === 'desc' ? 'Top Spender (Tertinggi)' : 'Belanja Terendah'}</span>
          </button>
        </div>

        {/* Table Content */}
        <div style={{ padding: '0', overflowY: 'auto', flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0', color: '#475569', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px', fontWeight: '700', width: '70px' }}>Rank</th>
                <th style={{ padding: '12px 16px', fontWeight: '700' }}>Nama Pelanggan</th>
                <th style={{ padding: '12px 16px', fontWeight: '700' }}>Kontak HP</th>
                <th style={{ padding: '12px 16px', fontWeight: '700' }}>Kendaraan & Plat</th>
                <th style={{ padding: '12px 16px', fontWeight: '700', textAlign: 'right' }}>Total Belanja Bulan Ini</th>
                <th style={{ padding: '12px 16px', fontWeight: '700', textAlign: 'center', width: '90px' }}>Order</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
                    Tidak ada data pelanggan yang sesuai dengan pencarian
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust, idx) => {
                  const rank = idx + 1;
                  const isTop3 = rank <= 3 && sortOrder === 'desc';

                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }} className="hover:bg-indigo-50/30">
                      <td style={{ padding: '12px 16px', fontWeight: '700' }}>
                        {isTop3 ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            backgroundColor: rank === 1 ? '#fef3c7' : (rank === 2 ? '#e2e8f0' : '#ffedd5'),
                            color: rank === 1 ? '#b45309' : (rank === 2 ? '#475569' : '#c2410c'),
                            fontSize: '0.82rem',
                            fontWeight: '800'
                          }}>
                            {rank === 1 ? '👑 1' : (rank === 2 ? '🥈 2' : '🥉 3')}
                          </span>
                        ) : (
                          <span style={{ color: '#64748b' }}>#{rank}</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{cust.name}</span>
                          {rank === 1 && sortOrder === 'desc' && (
                            <span style={{
                              fontSize: '0.68rem',
                              backgroundColor: '#fef3c7',
                              color: '#92400e',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              fontWeight: '700'
                            }}>
                              TOP SPENDER
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {cust.phone && cust.phone !== '-' ? (
                          <a 
                            href={`https://wa.me/${cust.phone.replace(/[^0-9]/g, '')}`} 
                            target="_blank" 
                            rel="noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              color: '#2563eb',
                              textDecoration: 'none',
                              fontWeight: '600'
                            }}
                          >
                            <Phone size={13} />
                            <span>{cust.phone}</span>
                          </a>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: '600', color: '#334155' }}>{cust.vehicles || '-'}</div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '1px' }}>
                          Plat: <span style={{ fontWeight: '700' }}>{cust.plates || '-'}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '800', color: '#0f172a', whiteSpace: 'nowrap' }}>
                        Rp {Number(cust.totalSpent || 0).toLocaleString('id-ID')}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          backgroundColor: '#f1f5f9',
                          color: '#334155',
                          fontWeight: '700',
                          fontSize: '0.78rem',
                          padding: '3px 8px',
                          borderRadius: '6px'
                        }}>
                          {cust.orderCount || 1}x
                        </span>
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
            Menampilkan {filteredCustomers.length} dari total {customers.length} pelanggan pada bulan ini
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
    </div>,
    document.body
  );
};

/**
 * 2. OrderDetailModal (Drilldown Total Order)
 */
export const OrderDetailModal = ({ isOpen, onClose, orders = [], selectedMonth = '' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusTab, setStatusTab] = useState('ALL'); // 'ALL' | 'SELESAI' | 'PROSES'

  const filteredOrders = useMemo(() => {
    let list = [...orders];

    if (statusTab === 'SELESAI') {
      list = list.filter(o => (o.statusPembayaran || '').toUpperCase() === 'LUNAS' || o.sisaTagihan <= 0);
    } else if (statusTab === 'PROSES') {
      list = list.filter(o => (o.statusPembayaran || '').toUpperCase() !== 'LUNAS' && o.sisaTagihan > 0);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(o => 
        (o.formattedId || '').toLowerCase().includes(q) ||
        String(o.id || '').includes(q) ||
        (o.customerName || '').toLowerCase().includes(q) ||
        (o.plateNumber || '').toLowerCase().includes(q) ||
        (o.carBrand || '').toLowerCase().includes(q) ||
        (o.salesName || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [orders, searchQuery, statusTab]);

  const statsBreakdown = useMemo(() => {
    const total = orders.length;
    const selesai = orders.filter(o => (o.statusPembayaran || '').toUpperCase() === 'LUNAS' || o.sisaTagihan <= 0).length;
    const proses = total - selesai;
    const totalOmzet = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    return { total, selesai, proses, totalOmzet };
  }, [orders]);

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
        maxWidth: '1080px',
        maxHeight: '88vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden'
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
              backgroundColor: '#e0e7ff',
              color: '#4338ca',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShoppingBag size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '700', color: '#1e293b' }}>
                  Rincian Total Order Transaksi
                </h3>
                <span style={{
                  backgroundColor: '#e0e7ff',
                  color: '#4338ca',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  padding: '2px 8px',
                  borderRadius: '6px'
                }}>
                  Periode: {selectedMonth}
                </span>
              </div>
              <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                Seluruh transaksi yang terdaftar pada bulan ini beserta status pengerjaan & pelunasan
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
              onClick={() => setStatusTab('ALL')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: '600',
                cursor: 'pointer',
                border: statusTab === 'ALL' ? '1.5px solid #4338ca' : '1px solid #e2e8f0',
                backgroundColor: statusTab === 'ALL' ? '#e0e7ff' : '#ffffff',
                color: statusTab === 'ALL' ? '#3730a3' : '#64748b'
              }}
            >
              Semua ({statsBreakdown.total})
            </button>
            <button
              type="button"
              onClick={() => setStatusTab('SELESAI')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: '600',
                cursor: 'pointer',
                border: statusTab === 'SELESAI' ? '1.5px solid #16a34a' : '1px solid #e2e8f0',
                backgroundColor: statusTab === 'SELESAI' ? '#dcfce7' : '#ffffff',
                color: statusTab === 'SELESAI' ? '#15803d' : '#64748b'
              }}
            >
              Selesai / Lunas ({statsBreakdown.selesai})
            </button>
            <button
              type="button"
              onClick={() => setStatusTab('PROSES')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: '600',
                cursor: 'pointer',
                border: statusTab === 'PROSES' ? '1.5px solid #ea580c' : '1px solid #e2e8f0',
                backgroundColor: statusTab === 'PROSES' ? '#ffedd5' : '#ffffff',
                color: statusTab === 'PROSES' ? '#c2410c' : '#64748b'
              }}
            >
              Pending / Proses ({statsBreakdown.proses})
            </button>
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Cari ID, nama, plat, sales..."
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
        </div>

        {/* Table Content */}
        <div style={{ padding: '0', overflowY: 'auto', flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0', color: '#475569', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px', fontWeight: '700' }}>ID Transaksi</th>
                <th style={{ padding: '12px 16px', fontWeight: '700' }}>Tanggal</th>
                <th style={{ padding: '12px 16px', fontWeight: '700' }}>Pelanggan</th>
                <th style={{ padding: '12px 16px', fontWeight: '700' }}>Kendaraan & Plat</th>
                <th style={{ padding: '12px 16px', fontWeight: '700' }}>Layanan</th>
                <th style={{ padding: '12px 16px', fontWeight: '700', textAlign: 'right' }}>Total (Rp)</th>
                <th style={{ padding: '12px 16px', fontWeight: '700', textAlign: 'center' }}>Pelunasan</th>
                <th style={{ padding: '12px 16px', fontWeight: '700' }}>PIC Sales</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
                    Tidak ada transaksi yang cocok dengan filter
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o, idx) => {
                  const isLunas = (o.statusPembayaran || '').toUpperCase() === 'LUNAS' || o.sisaTagihan <= 0;
                  const dateStr = o.date ? new Date(o.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }} className="hover:bg-slate-50">
                      <td style={{ padding: '12px 16px', fontWeight: '700', color: '#0f172a' }}>
                        #{o.id}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#475569', whiteSpace: 'nowrap' }}>
                        {dateStr}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: '600', color: '#1e293b' }}>{o.customerName}</div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{o.customerPhone}</div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: '600', color: '#1e293b' }}>{o.carBrand} {o.carModel}</div>
                        <span style={{
                          display: 'inline-block',
                          fontSize: '0.72rem',
                          fontWeight: '700',
                          backgroundColor: '#f1f5f9',
                          color: '#334155',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          marginTop: '2px'
                        }}>
                          {o.plateNumber || '-'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', maxWidth: '180px', color: '#334155' }}>
                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {o.services || o.serviceType}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '800', color: '#0f172a', whiteSpace: 'nowrap' }}>
                        Rp {Number(o.totalAmount || 0).toLocaleString('id-ID')}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        {isLunas ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            backgroundColor: '#dcfce7',
                            color: '#15803d',
                            fontSize: '0.74rem',
                            fontWeight: '700',
                            padding: '3px 8px',
                            borderRadius: '6px'
                          }}>
                            <CheckCircle size={12} />
                            <span>Lunas</span>
                          </span>
                        ) : (
                          <div>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              backgroundColor: '#ffedd5',
                              color: '#c2410c',
                              fontSize: '0.74rem',
                              fontWeight: '700',
                              padding: '3px 8px',
                              borderRadius: '6px'
                            }}>
                              <Clock size={12} />
                              <span>Sisa Rp {Number(o.sisaTagihan || 0).toLocaleString('id-ID')}</span>
                            </span>
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          display: 'inline-block',
                          backgroundColor: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          color: '#475569',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          padding: '3px 8px',
                          borderRadius: '6px'
                        }}>
                          {o.salesName || 'Sales'}
                        </span>
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
            Total Omzet Periode Ini: <strong style={{ color: '#0f172a' }}>Rp {statsBreakdown.totalOmzet.toLocaleString('id-ID')}</strong> ({filteredOrders.length} order ditampilkan)
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
    </div>,
    document.body
  );
};

/**
 * 3. WorkingBayDetailModal (Drilldown Working Bay)
 */
export const WorkingBayDetailModal = ({ isOpen, onClose, orders = [], activeBayCount = 0 }) => {
  // 5 Working Bays
  const baySlots = [1, 2, 3, 4, 5];

  // Active units currently in bays
  const activeOrders = useMemo(() => {
    return orders.filter(o => o.status === 'Aktif' || o.status === 'In Progress' || o.status === 'OPEN');
  }, [orders]);

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
        maxWidth: '1000px',
        maxHeight: '88vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden'
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
              backgroundColor: '#e0e7ff',
              color: '#4338ca',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Wrench size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '700', color: '#1e293b' }}>
                  Status Working Bay & Pengerjaan Unit
                </h3>
                <span style={{
                  backgroundColor: activeBayCount >= 4 ? '#fee2e2' : '#dcfce7',
                  color: activeBayCount >= 4 ? '#b91c1c' : '#15803d',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  padding: '2px 8px',
                  borderRadius: '6px'
                }}>
                  Kapasitas Terpakai: {activeBayCount} / 5 Slot
                </span>
              </div>
              <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                Monitoring unit kendaraan yang saat ini sedang aktif dikerjakan di workshop
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

        {/* 5 Bay Visual Layout */}
        <div style={{
          padding: '18px 24px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #f1f5f9'
        }}>
          <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '10px' }}>
            LAYOUT WORKING BAY WORKSHOP
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '12px'
          }}>
            {baySlots.map((bayNum) => {
              const assignedOrder = activeOrders[bayNum - 1];
              const isOccupied = !!assignedOrder;

              return (
                <div
                  key={bayNum}
                  style={{
                    backgroundColor: isOccupied ? '#f0fdf4' : '#f8fafc',
                    border: isOccupied ? '1.5px solid #86efac' : '1.5px dashed #cbd5e1',
                    borderRadius: '10px',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '110px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{
                      fontWeight: '800',
                      fontSize: '0.85rem',
                      color: isOccupied ? '#166534' : '#64748b'
                    }}>
                      BAY {bayNum}
                    </span>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: '700',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: isOccupied ? '#bbf7d0' : '#e2e8f0',
                      color: isOccupied ? '#14532d' : '#64748b'
                    }}>
                      {isOccupied ? 'TERISI' : 'KOSONG'}
                    </span>
                  </div>

                  {isOccupied ? (
                    <div style={{ marginTop: '8px' }}>
                      <div style={{ fontWeight: '700', fontSize: '0.84rem', color: '#0f172a' }}>
                        {assignedOrder.plateNumber || '-'}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#475569', marginTop: '2px' }}>
                        {assignedOrder.carBrand} {assignedOrder.carModel}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: '600', marginTop: '2px' }}>
                        {assignedOrder.serviceType || 'Pengerjaan'}
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.75rem', marginTop: '16px' }}>
                      Slot Tersedia
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Table of Active Units */}
        <div style={{ padding: '0', overflowY: 'auto', flex: 1 }}>
          <div style={{ padding: '12px 24px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: '700', fontSize: '0.84rem', color: '#334155' }}>
            Daftar Unit Sedang Dikerjakan (In Progress)
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0', color: '#475569', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px', fontWeight: '700', width: '80px' }}>Bay #</th>
                <th style={{ padding: '12px 16px', fontWeight: '700' }}>ID Order</th>
                <th style={{ padding: '12px 16px', fontWeight: '700' }}>Plat & Kendaraan</th>
                <th style={{ padding: '12px 16px', fontWeight: '700' }}>Layanan</th>
                <th style={{ padding: '12px 16px', fontWeight: '700' }}>PIC / SPG</th>
                <th style={{ padding: '12px 16px', fontWeight: '700' }}>Waktu Masuk</th>
                <th style={{ padding: '12px 16px', fontWeight: '700' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {activeOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
                    Saat ini seluruh slot working bay kosong / tidak ada unit yang sedang dikerjakan
                  </td>
                </tr>
              ) : (
                activeOrders.map((o, idx) => {
                  const bayNum = idx + 1;
                  const startDateStr = o.installationDate || o.date;

                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }} className="hover:bg-indigo-50/20">
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          display: 'inline-block',
                          backgroundColor: '#e0e7ff',
                          color: '#4338ca',
                          fontWeight: '800',
                          fontSize: '0.78rem',
                          padding: '3px 8px',
                          borderRadius: '6px'
                        }}>
                          BAY {bayNum}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: '700', color: '#0f172a' }}>
                        {o.id}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: '700', color: '#0f172a' }}>{o.plateNumber || '-'}</div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{o.carBrand} {o.carModel} ({o.carColor || '-'})</div>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#334155' }}>
                        <div style={{ fontWeight: '600' }}>{o.serviceType}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{o.service}</div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          display: 'inline-block',
                          backgroundColor: '#f1f5f9',
                          color: '#334155',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          padding: '3px 8px',
                          borderRadius: '6px'
                        }}>
                          {o.spgName || 'Teknisi Gallardo'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#475569', fontSize: '0.8rem' }}>
                        {startDateStr ? new Date(startDateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          backgroundColor: '#dbeafe',
                          color: '#1e40af',
                          fontSize: '0.74rem',
                          fontWeight: '700',
                          padding: '3px 8px',
                          borderRadius: '6px'
                        }}>
                          <Wrench size={12} />
                          <span>Sedang Dikerjakan</span>
                        </span>
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
            Sistem operasional working bay terhubung dengan jadwal pengerjaan teknisi
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
    </div>,
    document.body
  );
};
