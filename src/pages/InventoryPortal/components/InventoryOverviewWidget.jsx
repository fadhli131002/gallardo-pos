import React from 'react';
import { Package, AlertTriangle, ArrowUpDown, MessageSquareWarning, ChevronRight } from '@/icons/itshover';
import '../../Dashboard/Dashboard.css';

const bentoCardStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '14px',
  border: '1px solid #e5e7eb',
  padding: '14px 16px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  gap: '10px',
  boxShadow: '0 1px 4px rgba(15, 23, 42, 0.03)',
  transition: 'all 0.18s ease'
};

const iconBoxBaseStyle = {
  width: '32px',
  height: '32px',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0
};

const InventoryOverviewWidget = ({
  inventory = [],
  inventoryLogs = [],
  openDiscrepancies = 0,
  isLowStockOnly,
  onToggleLowStockFilter,
  onSwitchTab
}) => {
  const totalItems = inventory.length;

  const ppfCount = inventory.filter(i => i.kategori === 'PPF').length;
  const kacaFilmCount = inventory.filter(i => i.kategori === 'Kaca Film').length;
  const coatingCount = inventory.filter(i => i.kategori === 'Coating').length;

  const lowStockItems = inventory.filter(item => {
    const min = item.minStok !== undefined ? item.minStok : 2;
    return Number(item.stokUtama || 0) <= min;
  });
  const lowStockCount = lowStockItems.length;
  const healthyPct = totalItems > 0 ? Math.max(0, Math.round(((totalItems - lowStockCount) / totalItems) * 100)) : 100;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayLogs = inventoryLogs.filter(log => {
    const logDate = new Date(log.date || log.created_at || Date.now());
    return logDate >= todayStart;
  });

  const restockTodayCount = todayLogs.filter(l => l.jenis === 'RESTOCK').length;
  const deductTodayCount = todayLogs.filter(l => l.jenis === 'DEDUCT' || !l.jenis).length;

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      {/* Banner Peringatan Stok Menipis */}
      {lowStockCount > 0 && (
        <div
          style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #f87171',
            borderRadius: '14px',
            padding: '14px 20px',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            color: '#991b1b'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle size={22} style={{ color: '#dc2626', flexShrink: 0 }} />
            <div>
              <h4 style={{ fontWeight: 700, fontSize: '0.92rem', margin: '0 0 2px 0', color: '#991b1b' }}>
                Peringatan: Stok Menipis!
              </h4>
              <p style={{ fontSize: '0.82rem', margin: 0, color: '#b91c1c' }}>
                Ada {lowStockCount} barang yang stoknya di bawah batas minimum. Segera lakukan restock.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onToggleLowStockFilter}
            style={{
              padding: '7px 14px',
              borderRadius: '999px',
              fontSize: '12.5px',
              fontWeight: 600,
              backgroundColor: isLowStockOnly ? '#dc2626' : '#ffffff',
              color: isLowStockOnly ? '#ffffff' : '#991b1b',
              border: '1px solid #fca5a5',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {isLowStockOnly ? 'Tampilkan Semua' : 'Filter Barang Menipis'}
          </button>
        </div>
      )}

      {/* 4 Kartu Bento Gudang (Gaya Finnova / Finexy Reference) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Master Item */}
        <div style={bentoCardStyle}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#6b7280' }}>
                Total Master Item
              </span>
              <div style={{ ...iconBoxBaseStyle, backgroundColor: '#eef2ff', color: '#4f46e5' }}>
                <Package size={18} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '24px', fontWeight: 800, color: '#111827', lineHeight: 1 }}>
                {totalItems}
              </span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>
                SKU Aktif
              </span>
            </div>
          </div>

          {/* Bottom Bento Mini-Cards (Category Breakdown) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '10px', padding: '7px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#111827', lineHeight: 1.1 }}>{kacaFilmCount}</div>
              <div style={{ fontSize: '10px', fontWeight: 600, color: '#6b7280', marginTop: '2px' }}>Kaca Film</div>
            </div>
            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '10px', padding: '7px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#111827', lineHeight: 1.1 }}>{coatingCount}</div>
              <div style={{ fontSize: '10px', fontWeight: 600, color: '#6b7280', marginTop: '2px' }}>Coating</div>
            </div>
            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '10px', padding: '7px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#111827', lineHeight: 1.1 }}>{ppfCount}</div>
              <div style={{ fontSize: '10px', fontWeight: 600, color: '#6b7280', marginTop: '2px' }}>PPF</div>
            </div>
          </div>
        </div>

        {/* 2. Stok Menipis */}
        <div
          onClick={onToggleLowStockFilter}
          style={{
            ...bentoCardStyle,
            cursor: 'pointer',
            borderColor: isLowStockOnly ? '#ef4444' : '#e5e7eb',
            backgroundColor: isLowStockOnly ? '#fff5f5' : '#ffffff'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#6b7280' }}>
                Stok Menipis (&le; 2)
              </span>
              <div
                style={{
                  ...iconBoxBaseStyle,
                  backgroundColor: lowStockCount > 0 ? '#fef2f2' : '#ecfdf5',
                  color: lowStockCount > 0 ? '#dc2626' : '#10b981'
                }}
              >
                <AlertTriangle size={18} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '24px',
                  fontWeight: 800,
                  color: lowStockCount > 0 ? '#dc2626' : '#111827',
                  lineHeight: 1
                }}
              >
                {lowStockCount}
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  backgroundColor: lowStockCount > 0 ? '#fef2f2' : '#ecfdf5',
                  color: lowStockCount > 0 ? '#dc2626' : '#059669'
                }}
              >
                {lowStockCount > 0 ? 'Perlu Restock' : 'Stok Aman'}
              </span>
            </div>
          </div>

          {/* Bottom Bento Health Progress Bar */}
          <div style={{ backgroundColor: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '10px', padding: '9px 10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', marginBottom: '5px' }}>
              <span style={{ color: '#6b7280', fontWeight: 600 }}>
                {isLowStockOnly ? 'Filter Aktif (Reset)' : 'Klik untuk filter tabel'}
              </span>
              <span style={{ fontWeight: 700, color: '#111827' }}>{healthyPct}% Aman</span>
            </div>
            <div style={{ width: '100%', height: '6px', backgroundColor: '#fee2e2', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{ width: `${healthyPct}%`, height: '100%', backgroundColor: '#10b981', borderRadius: '999px' }} />
            </div>
          </div>
        </div>

        {/* 3. Mutasi Stok Hari Ini */}
        <div
          onClick={() => onSwitchTab && onSwitchTab('logs')}
          style={{
            ...bentoCardStyle,
            cursor: 'pointer'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#6b7280' }}>
                Mutasi Stok Hari Ini
              </span>
              <div style={{ ...iconBoxBaseStyle, backgroundColor: '#eff6ff', color: '#2563eb' }}>
                <ArrowUpDown size={18} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '24px', fontWeight: 800, color: '#111827', lineHeight: 1 }}>
                {todayLogs.length}
              </span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>
                Aktivitas
              </span>
            </div>
          </div>

          {/* Bottom Bento Split Pills (+Masuk / -Terpakai) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #d1fae5', borderRadius: '10px', padding: '7px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#047857' }}>Masuk</span>
              <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#059669' }}>+{restockTodayCount}</span>
            </div>
            <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '10px', padding: '7px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#b91c1c' }}>Terpakai</span>
              <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#dc2626' }}>-{deductTodayCount}</span>
            </div>
          </div>
        </div>

        {/* 4. Tiket Selisih Stok */}
        <div
          onClick={() => onSwitchTab && onSwitchTab('comms')}
          style={{
            ...bentoCardStyle,
            cursor: 'pointer'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#6b7280' }}>
                Tiket Selisih Stok
              </span>
              <div
                style={{
                  ...iconBoxBaseStyle,
                  backgroundColor: openDiscrepancies > 0 ? '#fef3c7' : '#f3f4f6',
                  color: openDiscrepancies > 0 ? '#d97706' : '#6b7280'
                }}
              >
                <MessageSquareWarning size={18} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '24px',
                  fontWeight: 800,
                  color: openDiscrepancies > 0 ? '#d97706' : '#111827',
                  lineHeight: 1
                }}
              >
                {openDiscrepancies}
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  backgroundColor: openDiscrepancies > 0 ? '#fef3c7' : '#f3f4f6',
                  color: openDiscrepancies > 0 ? '#b45309' : '#6b7280'
                }}
              >
                {openDiscrepancies > 0 ? 'Tiket Terbuka' : 'Clear'}
              </span>
            </div>
          </div>

          {/* Bottom Bento Action Box */}
          <div style={{ backgroundColor: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '10px', padding: '9px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#6b7280' }}>
              Diskusi Gudang &amp; Admin
            </span>
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#111827', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
              Buka Chat <ChevronRight size={13} />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryOverviewWidget;
