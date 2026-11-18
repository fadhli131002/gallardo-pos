import React, { useState, useMemo } from 'react';
import {
  Search,
  RotateCcw,
  Package
} from '@/icons/itshover';

const InventoryLogsTable = ({ logs = [] }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'WORKSHOP' | 'RETAIL' | 'RESTOCK' | 'ADJUST'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (filterType !== 'ALL') {
        const jenis = log.jenis || (log.keterangan?.toLowerCase().includes('restock') ? 'RESTOCK' : 'DEDUCT');
        const isRetail = log.type === 'Retail (Grosir)' || (log.orderId && String(log.orderId).startsWith('RTL'));

        if (filterType === 'RESTOCK' && jenis !== 'RESTOCK') return false;
        if (filterType === 'ADJUST' && jenis !== 'ADJUST') return false;
        if (filterType === 'RETAIL' && (!isRetail || jenis !== 'DEDUCT')) return false;
        if (filterType === 'WORKSHOP' && (isRetail || jenis !== 'DEDUCT')) return false;
      }

      if (startDate || endDate) {
        const logDate = new Date(log.date || log.created_at || Date.now());
        logDate.setHours(0, 0, 0, 0);

        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (logDate < start) return false;
        }

        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (logDate > end) return false;
        }
      }

      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const itemMatch = (log.itemName || '').toLowerCase().includes(q);
        const orderMatch = (log.orderId || '').toLowerCase().includes(q);
        const srvMatch = (log.serviceName || '').toLowerCase().includes(q);
        const ketMatch = (log.keterangan || '').toLowerCase().includes(q);
        const custMatch = (log.customerName || '').toLowerCase().includes(q);
        return itemMatch || orderMatch || srvMatch || ketMatch || custMatch;
      }

      return true;
    });
  }, [logs, filterType, startDate, endDate, searchQuery]);

  const resetFilters = () => {
    setSearchQuery('');
    setFilterType('ALL');
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilter = searchQuery || filterType !== 'ALL' || startDate || endDate;

  return (
    <div className="premium-card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Filter Bar identik dengan AdminInventory.jsx */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.25rem',
          backgroundColor: '#f9fafb',
          borderBottom: '1px solid #e5e7eb'
        }}
      >
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', minWidth: '240px' }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9ca3af'
              }}
            />
            <input
              type="text"
              placeholder="Cari item, Order ID, layanan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 12px 7px 34px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '13px',
                backgroundColor: '#ffffff',
                color: '#111827',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#4b5563' }}>Mulai:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                padding: '6px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '13px',
                backgroundColor: '#ffffff',
                color: '#111827'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#4b5563' }}>Sampai:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                padding: '6px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '13px',
                backgroundColor: '#ffffff',
                color: '#111827'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#4b5563' }}>Tipe:</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{
                padding: '6px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '13px',
                backgroundColor: '#ffffff',
                color: '#111827'
              }}
            >
              <option value="ALL">Semua Transaksi</option>
              <option value="WORKSHOP">Workshop (Pemasangan)</option>
              <option value="RETAIL">Retail (Grosir)</option>
              <option value="RESTOCK">Restock Masuk</option>
              <option value="ADJUST">Stok Opname (Adjust)</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {hasActiveFilter && (
            <button
              type="button"
              onClick={resetFilters}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                backgroundColor: '#ffffff',
                color: '#dc2626',
                border: '1px solid #fca5a5',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '13px'
              }}
            >
              <RotateCcw size={14} />
              <span>Reset Filter</span>
            </button>
          )}
          <span style={{ fontSize: '13px', color: '#6b7280' }}>
            Total: <strong style={{ color: '#111827' }}>{filteredLogs.length}</strong> catatan
          </span>
        </div>
      </div>

      {/* Main Table dengan Scrollbar Horizontal Standby & Sticky Header */}
      <div style={{ maxHeight: 'calc(100vh - 280px)', overflow: 'auto', position: 'relative' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, textAlign: 'left' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 20, backgroundColor: '#f5f5f5' }}>
            <tr>
              <th style={{ position: 'sticky', top: 0, zIndex: 20, backgroundColor: '#f5f5f5', boxShadow: 'inset 0 -2px 0 #e5e5e5', padding: '0.85rem 1rem', color: 'var(--color-secondary)', fontSize: '0.75rem', letterSpacing: '0.05em', fontWeight: 600, whiteSpace: 'nowrap' }}>TANGGAL</th>
              <th style={{ position: 'sticky', top: 0, zIndex: 20, backgroundColor: '#f5f5f5', boxShadow: 'inset 0 -2px 0 #e5e5e5', padding: '0.85rem 1rem', color: 'var(--color-secondary)', fontSize: '0.75rem', letterSpacing: '0.05em', fontWeight: 600, whiteSpace: 'nowrap' }}>ORDER ID</th>
              <th style={{ position: 'sticky', top: 0, zIndex: 20, backgroundColor: '#f5f5f5', boxShadow: 'inset 0 -2px 0 #e5e5e5', padding: '0.85rem 1rem', color: 'var(--color-secondary)', fontSize: '0.75rem', letterSpacing: '0.05em', fontWeight: 600, whiteSpace: 'nowrap' }}>LAYANAN</th>
              <th style={{ position: 'sticky', top: 0, zIndex: 20, backgroundColor: '#f5f5f5', boxShadow: 'inset 0 -2px 0 #e5e5e5', padding: '0.85rem 1rem', color: 'var(--color-secondary)', fontSize: '0.75rem', letterSpacing: '0.05em', fontWeight: 600, whiteSpace: 'nowrap' }}>ITEM BAHAN</th>
              <th style={{ position: 'sticky', top: 0, zIndex: 20, backgroundColor: '#f5f5f5', boxShadow: 'inset 0 -2px 0 #e5e5e5', padding: '0.85rem 1rem', color: 'var(--color-secondary)', fontSize: '0.75rem', letterSpacing: '0.05em', fontWeight: 600, whiteSpace: 'nowrap' }}>DIPOTONG / MUTASI</th>
              <th style={{ position: 'sticky', top: 0, zIndex: 20, backgroundColor: '#f5f5f5', boxShadow: 'inset 0 -2px 0 #e5e5e5', padding: '0.85rem 1rem', color: 'var(--color-secondary)', fontSize: '0.75rem', letterSpacing: '0.05em', fontWeight: 600, whiteSpace: 'nowrap' }}>SISA STOK</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
                  <Package size={48} style={{ margin: '0 auto', opacity: 0.2, marginBottom: '1rem' }} />
                  <p style={{ fontSize: '14px' }}>Data tidak ditemukan pada periode ini.</p>
                </td>
              </tr>
            ) : (
              filteredLogs.map((log, index) => {
                const jenis = log.jenis || (log.keterangan?.toLowerCase().includes('restock') ? 'RESTOCK' : 'DEDUCT');
                const isRestock = jenis === 'RESTOCK';
                const isAdjust = jenis === 'ADJUST';

                return (
                  <tr
                    key={log.id || index}
                    style={{ borderBottom: '1px solid var(--border-light)' }}
                    className="hover:bg-gray-50"
                  >
                    <td style={{ padding: '1rem', fontSize: '13px', color: '#111827', whiteSpace: 'nowrap' }}>
                      {new Date(log.date || log.created_at || Date.now()).toLocaleString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '13px', fontWeight: 'bold', color: '#111827' }}>
                      {log.orderId || '-'}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '13px', color: '#111827' }}>
                      <div>{log.serviceName || '-'}</div>
                      {log.customerName && log.customerName !== 'Pelanggan Umum' && (
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          Pelanggan: {log.customerName}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '13px', color: '#4b5563', fontWeight: 500 }}>
                      {log.itemName}
                    </td>
                    <td
                      style={{
                        padding: '1rem',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        color: isRestock ? '#059669' : isAdjust ? '#d97706' : '#ef4444'
                      }}
                    >
                      {isRestock ? `+${log.deducted}` : isAdjust ? `~${log.deducted}` : `-${log.deducted}`}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '13px', color: '#059669', fontWeight: 'bold' }}>
                      {log.remaining || '-'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventoryLogsTable;
