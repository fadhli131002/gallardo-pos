import React from 'react';
import { Package, AlertTriangle, ArrowUpDown, MessageSquareWarning, ChevronRight } from '@/icons/itshover';
import '../../Dashboard/Dashboard.css';

const cardBaseStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  border: '1px solid #e5e7eb',
  padding: '18px 20px',
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '12px',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
  transition: 'all 0.18s ease'
};

const iconBoxBaseStyle = {
  width: '40px',
  height: '40px',
  borderRadius: '10px',
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

  const lowStockItems = inventory.filter(item => {
    const min = item.minStok !== undefined ? item.minStok : 2;
    return Number(item.stokUtama || 0) <= min;
  });
  const lowStockCount = lowStockItems.length;

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
            borderRadius: '10px',
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
              borderRadius: '8px',
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

      {/* 4 Kartu Statistik Gudang */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '16px'
        }}
      >
        {/* 1. Total Master Item */}
        <div style={cardBaseStyle}>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#6b7280', marginBottom: '8px' }}>
              Total Master Item
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '28px', fontWeight: 800, color: '#111827', lineHeight: 1 }}>
                {totalItems}
              </span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>
                SKU Aktif
              </span>
            </div>
            <span style={{ fontSize: '12px', color: '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Kaca Film, Coating, PPF &amp; Tools
            </span>
          </div>
          <div
            style={{
              ...iconBoxBaseStyle,
              backgroundColor: '#eef2ff',
              color: '#4f46e5'
            }}
          >
            <Package size={20} />
          </div>
        </div>

        {/* 2. Stok Menipis */}
        <div
          onClick={onToggleLowStockFilter}
          style={{
            ...cardBaseStyle,
            cursor: 'pointer',
            borderColor: isLowStockOnly ? '#ef4444' : '#e5e7eb',
            backgroundColor: isLowStockOnly ? '#fff5f5' : '#ffffff'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#6b7280', marginBottom: '8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              Stok Menipis (&le; 2)
              <ChevronRight size={14} />
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
              <span
                style={{
                  fontSize: '28px',
                  fontWeight: 800,
                  color: lowStockCount > 0 ? '#dc2626' : '#111827',
                  lineHeight: 1
                }}
              >
                {lowStockCount}
              </span>
              <span
                style={{
                  fontSize: '11.5px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  backgroundColor: lowStockCount > 0 ? '#fef2f2' : '#ecfdf5',
                  color: lowStockCount > 0 ? '#dc2626' : '#059669'
                }}
              >
                {lowStockCount > 0 ? 'Perlu Restock' : 'Stok Aman'}
              </span>
            </div>
            <span style={{ fontSize: '12px', color: isLowStockOnly ? '#dc2626' : '#6b7280', fontWeight: isLowStockOnly ? 600 : 400 }}>
              {isLowStockOnly ? 'Filter aktif (Klik untuk reset)' : 'Klik untuk filter tabel'}
            </span>
          </div>
          <div
            style={{
              ...iconBoxBaseStyle,
              backgroundColor: lowStockCount > 0 ? '#fef2f2' : '#ecfdf5',
              color: lowStockCount > 0 ? '#dc2626' : '#10b981'
            }}
          >
            <AlertTriangle size={20} />
          </div>
        </div>

        {/* 3. Mutasi Stok Hari Ini */}
        <div
          onClick={() => onSwitchTab && onSwitchTab('logs')}
          style={{
            ...cardBaseStyle,
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#6b7280', marginBottom: '8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              Mutasi Stok Hari Ini
              <ChevronRight size={14} />
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '28px', fontWeight: 800, color: '#111827', lineHeight: 1 }}>
                {todayLogs.length}
              </span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>
                Aktivitas
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
              <span style={{ color: '#059669', fontWeight: 600 }}>+{restockTodayCount} Masuk</span>
              <span style={{ color: '#d1d5db' }}>&bull;</span>
              <span style={{ color: '#dc2626', fontWeight: 600 }}>-{deductTodayCount} Terpakai</span>
            </div>
          </div>
          <div
            style={{
              ...iconBoxBaseStyle,
              backgroundColor: '#eff6ff',
              color: '#2563eb'
            }}
          >
            <ArrowUpDown size={20} />
          </div>
        </div>

        {/* 4. Tiket Selisih Stok */}
        <div
          onClick={() => onSwitchTab && onSwitchTab('comms')}
          style={{
            ...cardBaseStyle,
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#6b7280', marginBottom: '8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              Tiket Selisih Stok
              <ChevronRight size={14} />
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
              <span
                style={{
                  fontSize: '28px',
                  fontWeight: 800,
                  color: openDiscrepancies > 0 ? '#d97706' : '#111827',
                  lineHeight: 1
                }}
              >
                {openDiscrepancies}
              </span>
              <span
                style={{
                  fontSize: '11.5px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  backgroundColor: openDiscrepancies > 0 ? '#fef3c7' : '#f3f4f6',
                  color: openDiscrepancies > 0 ? '#b45309' : '#6b7280'
                }}
              >
                {openDiscrepancies > 0 ? 'Tiket Terbuka' : 'Clear'}
              </span>
            </div>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>
              Diskusi Gudang &amp; Admin
            </span>
          </div>
          <div
            style={{
              ...iconBoxBaseStyle,
              backgroundColor: openDiscrepancies > 0 ? '#fef3c7' : '#f3f4f6',
              color: openDiscrepancies > 0 ? '#d97706' : '#6b7280'
            }}
          >
            <MessageSquareWarning size={20} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryOverviewWidget;
