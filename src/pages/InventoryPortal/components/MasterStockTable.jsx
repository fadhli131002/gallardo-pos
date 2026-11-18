import React, { useState, useMemo } from 'react';
import {
  Search,
  PackagePlus,
  SlidersHorizontal,
  Flag,
  AlertTriangle,
  ArrowUpDown,
  Package,
  ArrowLeftRight,
  Check
} from '@/icons/itshover';
import { getConversionDetails, formatThousand } from '../utils/unitConversion';

const CATEGORIES = ['Semua', 'Kaca Film', 'Coating', 'PPF', 'Tools & Equipment'];

const MasterStockTable = ({
  inventory = [],
  isLowStockOnly,
  onToggleLowStockFilter,
  onOpenRestock,
  onOpenAdjust,
  onOpenDiscrepancy
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [sortBy, setSortBy] = useState('id'); // 'id' | 'brand' | 'stokUtama' | 'totalKonversi'
  const [sortAsc, setSortAsc] = useState(true);
  const [unitMode, setUnitMode] = useState('default'); // 'default' | 'converted'

  const filteredItems = useMemo(() => {
    return inventory
      .filter((item) => {
        if (selectedCategory !== 'Semua' && item.kategori !== selectedCategory) {
          return false;
        }

        if (isLowStockOnly) {
          const min = item.minStok !== undefined ? item.minStok : 2;
          if (Number(item.stokUtama || 0) > min) {
            return false;
          }
        }

        if (searchQuery.trim() !== '') {
          const q = searchQuery.toLowerCase().trim();
          const matchId = (item.id || '').toLowerCase().includes(q);
          const matchBrand = (item.brand || '').toLowerCase().includes(q);
          const matchVarian = (item.varian || '').toLowerCase().includes(q);
          const matchDark = (item.kegelapan || '').toLowerCase().includes(q);
          return matchId || matchBrand || matchVarian || matchDark;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'stokUtama') {
          const valA = Number(a.stokUtama || 0);
          const valB = Number(b.stokUtama || 0);
          return sortAsc ? valA - valB : valB - valA;
        }

        if (sortBy === 'totalKonversi') {
          const convA = getConversionDetails(a);
          const convB = getConversionDetails(b);
          const valA = convA.type === 'FILM_PPF' ? convA.totalCM : convA.type === 'COATING' ? convA.totalML : convA.utama;
          const valB = convB.type === 'FILM_PPF' ? convB.totalCM : convB.type === 'COATING' ? convB.totalML : convB.utama;
          return sortAsc ? valA - valB : valB - valA;
        }

        const valA = String(a[sortBy] || '').toLowerCase();
        const valB = String(b[sortBy] || '').toLowerCase();
        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
      });
  }, [inventory, selectedCategory, isLowStockOnly, searchQuery, sortBy, sortAsc]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(field);
      setSortAsc(true);
    }
  };

  const isConvertedMode = unitMode === 'converted';

  const stickyThStyle = {
    position: 'sticky',
    top: 0,
    zIndex: 20,
    backgroundColor: '#f5f5f5',
    boxShadow: 'inset 0 -2px 0 #e5e5e5',
    padding: '0.85rem 0.9rem',
    color: 'var(--color-secondary)',
    fontSize: '0.75rem',
    letterSpacing: '0.05em',
    fontWeight: 600,
    whiteSpace: 'nowrap'
  };

  return (
    <div className="premium-card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Toolbar Filter & Mode Satuan */}
      <div
        style={{
          padding: '0.9rem 1.25rem',
          backgroundColor: '#f9fafb',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}
      >
        {/* Left: Search Input */}
        <div style={{ position: 'relative', minWidth: '240px', flex: '1 1 240px', maxWidth: '320px' }}>
          <Search
            size={16}
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
            placeholder="Cari ID Barang, Brand, Varian..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 32px 8px 36px',
              fontSize: '14px',
              backgroundColor: '#ffffff',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              color: '#111827',
              outline: 'none'
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#6b7280',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              &times;
            </button>
          )}
        </div>

        {/* Right: Category Segmented Pills + Mode Satuan Segmented Pills + Stok Menipis */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
          {/* Filter Kategori */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px',
              backgroundColor: '#e5e7eb',
              borderRadius: '10px'
            }}
          >
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '13px',
                    fontWeight: active ? 600 : 500,
                    borderRadius: '7px',
                    border: 'none',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    backgroundColor: active ? '#111827' : 'transparent',
                    color: active ? '#ffffff' : '#374151',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Segmented Control Mode Satuan: Roll / Botol ⇄ CM / Unit */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px',
              backgroundColor: '#e5e7eb',
              borderRadius: '10px'
            }}
            title="Mode Satuan: Roll/Botol ⇄ CM/Unit"
          >
            <span
              style={{
                padding: '0 8px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#4b5563',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                whiteSpace: 'nowrap'
              }}
            >
              <ArrowLeftRight size={13} />
              <span>Mode Satuan:</span>
            </span>
            <button
              type="button"
              onClick={() => setUnitMode('default')}
              style={{
                padding: '6px 12px',
                fontSize: '13px',
                fontWeight: !isConvertedMode ? 600 : 500,
                borderRadius: '7px',
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                backgroundColor: !isConvertedMode ? '#111827' : 'transparent',
                color: !isConvertedMode ? '#ffffff' : '#374151',
                transition: 'all 0.15s ease'
              }}
            >
              Roll / Botol
            </button>
            <button
              type="button"
              onClick={() => setUnitMode('converted')}
              style={{
                padding: '6px 12px',
                fontSize: '13px',
                fontWeight: isConvertedMode ? 600 : 500,
                borderRadius: '7px',
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                backgroundColor: isConvertedMode ? '#111827' : 'transparent',
                color: isConvertedMode ? '#ffffff' : '#374151',
                transition: 'all 0.15s ease'
              }}
            >
              CM / Unit
            </button>
          </div>

          {/* Filter Stok Menipis */}
          <button
            type="button"
            onClick={onToggleLowStockFilter}
            style={{
              padding: '8px 14px',
              fontSize: '13px',
              fontWeight: 600,
              borderRadius: '8px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              backgroundColor: isLowStockOnly ? '#dc2626' : '#ffffff',
              color: isLowStockOnly ? '#ffffff' : '#dc2626',
              border: '1px solid #fca5a5',
              transition: 'all 0.15s ease'
            }}
          >
            <AlertTriangle size={14} />
            <span>Stok &le; 2</span>
            {isLowStockOnly && <Check size={13} />}
          </button>
        </div>
      </div>

      {/* Info Bar Standar Konversi */}
      <div
        style={{
          padding: '8px 20px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          fontSize: '13px',
          color: '#4b5563'
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
          <strong style={{ color: '#111827' }}>Standar Konversi Gudang:</strong>
          <span>
            <strong>PPF:</strong> 1 Roll = 1.500 CM (15 m)
          </span>
          <span>&bull;</span>
          <span>
            <strong>Kaca Film:</strong> 1 Roll = 3.000 CM (30 m)
          </span>
          <span>&bull;</span>
          <span>
            <strong>Coating:</strong> 1 Botol = 50 ML (3 UNIT) | 1 LITER = 1.000 ML (60 UNIT)
          </span>
        </div>
        <span
          style={{
            padding: '2px 8px',
            backgroundColor: '#f3f4f6',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 600,
            color: '#111827'
          }}
        >
          {isConvertedMode ? 'Prioritas: CM / UNIT / ML' : 'Prioritas: Roll / Botol + Sub-Konversi'}
        </span>
      </div>

      {/* Scrollable Table Container with Standby Horizontal Scrollbar & Sticky Header */}
      <div
        style={{
          maxHeight: 'calc(100vh - 280px)',
          overflow: 'auto',
          position: 'relative',
          width: '100%'
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, textAlign: 'left' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 20, backgroundColor: '#f5f5f5' }}>
            <tr>
              <th
                onClick={() => handleSort('id')}
                style={{ ...stickyThStyle, cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>ID BARANG</span>
                  <ArrowUpDown size={13} />
                </div>
              </th>
              <th style={stickyThStyle}>JENIS LAYANAN</th>
              <th
                onClick={() => handleSort('brand')}
                style={{ ...stickyThStyle, cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>BRAND &amp; SERIES</span>
                  <ArrowUpDown size={13} />
                </div>
              </th>
              <th style={stickyThStyle}>VARIAN / KEGELAPAN</th>
              <th
                onClick={() => handleSort('stokUtama')}
                style={{ ...stickyThStyle, cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>{isConvertedMode ? 'STOK UTAMA (CM/UNIT)' : 'STOK UTAMA'}</span>
                  <ArrowUpDown size={13} />
                </div>
              </th>
              <th style={stickyThStyle}>
                {isConvertedMode ? 'PECAHAN (CM/ML)' : 'PECAHAN'}
              </th>
              <th
                onClick={() => handleSort('totalKonversi')}
                style={{ ...stickyThStyle, cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>TOTAL KONVERSI</span>
                  <ArrowUpDown size={13} />
                </div>
              </th>
              <th
                style={{
                  ...stickyThStyle,
                  position: 'sticky',
                  right: 0,
                  zIndex: 30,
                  textAlign: 'center',
                  borderLeft: '1px solid #e5e7eb',
                  boxShadow: 'inset 0 -2px 0 #e5e5e5, -2px 0 6px rgba(0, 0, 0, 0.04)'
                }}
              >
                AKSI GUDANG
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-secondary)' }}>
                  <Package size={48} style={{ margin: '0 auto', opacity: 0.2, marginBottom: '1rem' }} />
                  <p style={{ fontSize: '14px', fontWeight: 500 }}>Tidak ada data inventaris yang cocok.</p>
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const min = item.minStok !== undefined ? item.minStok : 2;
                const isLowStock =
                  (item.kategori === 'Tools & Equipment' && Number(item.stokUtama || 0) <= min) ||
                  (item.kategori !== 'Tools & Equipment' && Number(item.stokUtama || 0) <= min);
                const conv = getConversionDetails(item);
                const cellBaseStyle = {
                  padding: '0.85rem 0.9rem',
                  borderBottom: '1px solid var(--border-light)'
                };

                return (
                  <tr
                    key={item.id}
                    style={{ transition: 'background-color 0.15s ease', backgroundColor: '#ffffff' }}
                    className="hover:bg-gray-50 group"
                  >
                    {/* 1. ID BARANG */}
                    <td style={{ ...cellBaseStyle, fontWeight: 500, color: 'var(--color-black)', fontSize: '14px', whiteSpace: 'nowrap' }}>
                      {item.id}
                    </td>

                    {/* 2. JENIS LAYANAN */}
                    <td style={{ ...cellBaseStyle, whiteSpace: 'nowrap' }}>
                      <span
                        style={{
                          padding: '4px 8px',
                          backgroundColor: 'var(--color-gray-100)',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: 'var(--color-black)'
                        }}
                      >
                        {item.kategori}
                      </span>
                    </td>

                    {/* 3. BRAND & SERIES */}
                    <td style={{ ...cellBaseStyle, fontWeight: 600, color: 'var(--color-black)', fontSize: '14px' }}>
                      {item.brand || '-'}
                    </td>

                    {/* 4. VARIAN / KEGELAPAN */}
                    <td style={{ ...cellBaseStyle, fontWeight: 600, color: 'var(--color-black)', fontSize: '14px' }}>
                      <div>
                        {item.varian || '-'}
                        {item.kategori === 'Kaca Film' && item.kegelapan ? ` (Kegelapan ${item.kegelapan})` : ''}
                      </div>
                    </td>

                    {/* 5. STOK UTAMA */}
                    <td style={{ ...cellBaseStyle, whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {!isConvertedMode ? (
                            <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-black)' }}>
                              {formatThousand(item.stokUtama)} {item.satuan}
                            </span>
                          ) : (
                            <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-black)' }}>
                              {conv.type === 'FILM_PPF'
                                ? `${formatThousand(conv.utamaCM)} CM`
                                : conv.type === 'COATING'
                                ? `${formatThousand(conv.utamaUnit)} UNIT`
                                : `${formatThousand(conv.utama)} ${item.satuan}`}
                            </span>
                          )}

                          {isLowStock && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                color: '#ef4444',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                backgroundColor: '#fef2f2',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                border: '1px solid #fca5a5'
                              }}
                            >
                              <AlertTriangle size={12} />
                              [Stok Menipis]
                            </span>
                          )}
                        </div>

                        {conv.isConvertible && (
                          <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 500 }}>
                            {!isConvertedMode
                              ? conv.type === 'FILM_PPF'
                                ? `(${formatThousand(conv.utamaCM)} CM)`
                                : `(${formatThousand(conv.utamaUnit)} UNIT / ${formatThousand(conv.utamaML)} ML)`
                              : conv.type === 'FILM_PPF'
                              ? `(${formatThousand(conv.utama)} Roll)`
                              : `(${formatThousand(conv.utama)} ${conv.satuan} / ${formatThousand(conv.utamaML)} ML)`}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 6. PECAHAN */}
                    <td style={{ ...cellBaseStyle, whiteSpace: 'nowrap' }}>
                      {!conv.isConvertible ? (
                        <span style={{ color: '#9ca3af', fontSize: '14px' }}>-</span>
                      ) : conv.type === 'FILM_PPF' ? (
                        !isConvertedMode ? (
                          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-black)' }}>
                            {formatThousand(conv.pecahan, 2)} m{' '}
                            <span style={{ color: '#4b5563', fontSize: '13px' }}>
                              ({formatThousand(conv.pecahanCM)} CM)
                            </span>
                          </span>
                        ) : (
                          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-black)' }}>
                            {formatThousand(conv.pecahanCM)} CM{' '}
                            <span style={{ color: '#4b5563', fontSize: '13px' }}>
                              ({formatThousand(conv.pecahan, 2)} m)
                            </span>
                          </span>
                        )
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-black)' }}>
                            {formatThousand(conv.pecahanML, 2)} ml
                          </span>
                          {conv.pecahanUnit > 0 && (
                            <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 500 }}>
                              (≈ {formatThousand(conv.pecahanUnit)} UNIT)
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* 7. TOTAL KONVERSI */}
                    <td style={{ ...cellBaseStyle, whiteSpace: 'nowrap' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '5px 10px',
                          backgroundColor: 'var(--color-gray-100)',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          fontSize: '0.9rem',
                          fontWeight: 700,
                          color: 'var(--color-black)'
                        }}
                      >
                        {conv.totalKonversiDisplay}
                      </span>
                    </td>

                    {/* 8. AKSI GUDANG (Sticky Right agar tidak pernah terpotong di layar laptop) */}
                    <td
                      style={{
                        ...cellBaseStyle,
                        position: 'sticky',
                        right: 0,
                        zIndex: 10,
                        backgroundColor: '#ffffff',
                        borderLeft: '1px solid #e5e7eb',
                        boxShadow: '-2px 0 6px rgba(0, 0, 0, 0.04)',
                        textAlign: 'center',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => onOpenRestock(item)}
                          title="Restock Barang Masuk"
                          style={{
                            padding: '6px 10px',
                            fontSize: '12.5px',
                            fontWeight: 600,
                            backgroundColor: '#111827',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            cursor: 'pointer'
                          }}
                        >
                          <PackagePlus size={13} />
                          <span>Restock</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpenAdjust(item)}
                          title="Penyesuaian Stok / Potong CM / Unit"
                          style={{
                            padding: '6px 10px',
                            fontSize: '12.5px',
                            fontWeight: 600,
                            backgroundColor: '#ffffff',
                            color: '#111827',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            cursor: 'pointer'
                          }}
                        >
                          <SlidersHorizontal size={13} />
                          <span>Adjust</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpenDiscrepancy(item)}
                          title="Laporkan Selisih ke Admin"
                          style={{
                            padding: '6px 10px',
                            fontSize: '12.5px',
                            fontWeight: 600,
                            backgroundColor: '#f9fafb',
                            color: '#4b5563',
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            cursor: 'pointer'
                          }}
                        >
                          <Flag size={13} />
                          <span>Lapor</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div
        style={{
          padding: '12px 20px',
          backgroundColor: '#f9fafb',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '13px',
          color: '#6b7280'
        }}
      >
        <span>
          Menampilkan <strong style={{ color: '#111827' }}>{filteredItems.length}</strong> dari{' '}
          <strong style={{ color: '#111827' }}>{inventory.length}</strong> barang
        </span>
        <span>Sistem POS otomatis memotong stok saat order selesai</span>
      </div>
    </div>
  );
};

export default MasterStockTable;
