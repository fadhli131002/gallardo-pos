import React, { useState, useMemo } from 'react';
import {
  Search,
  PackagePlus,
  SlidersHorizontal,
  Flag,
  AlertTriangle,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  XCircle,
  Package
} from 'lucide-react';

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
  const [sortBy, setSortBy] = useState('id'); // 'id' | 'brand' | 'stokUtama'
  const [sortAsc, setSortAsc] = useState(true);

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    return inventory
      .filter((item) => {
        // Category filter
        if (selectedCategory !== 'Semua' && item.kategori !== selectedCategory) {
          return false;
        }

        // Low stock filter (stokUtama <= minStok, default 2)
        if (isLowStockOnly) {
          const min = item.minStok !== undefined ? item.minStok : 2;
          if (Number(item.stokUtama || 0) > min) {
            return false;
          }
        }

        // Search filter (id, brand, varian, kegelapan)
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
        let valA = a[sortBy];
        let valB = b[sortBy];

        if (sortBy === 'stokUtama') {
          valA = Number(valA || 0);
          valB = Number(valB || 0);
          return sortAsc ? valA - valB : valB - valA;
        }

        valA = String(valA || '').toLowerCase();
        valB = String(valB || '').toLowerCase();
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

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden transition-colors">
      {/* Table Toolbar - High-End Bento SaaS Single Row */}
      <div
        className="px-6 py-4 border-b border-slate-100 flex flex-row items-center justify-between gap-4 bg-slate-50/50 w-full"
        style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
      >
        {/* Left: Search Input */}
        <div className="relative w-72 sm:w-80 flex-shrink-0">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari ID SKU, Brand, Varian..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-8 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 focus:outline-none transition-all placeholder:text-slate-400 text-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
            >
              &times;
            </button>
          )}
        </div>

        {/* Right: Category Filter Pills + Low Stock Toggle */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          {/* Bento Category Segmented Control */}
          <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`h-8 px-3 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Soft Amber Low Stock Filter Toggle */}
          <button
            onClick={onToggleLowStockFilter}
            className={`h-10 px-3.5 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all border ${
              isLowStockOnly
                ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50 shadow-sm'
            }`}
          >
            <AlertTriangle size={14} className={isLowStockOnly ? 'text-white' : 'text-amber-600'} />
            <span>Stok &le; 2 {isLowStockOnly && '✓'}</span>
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/75 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
            <tr>
              <th
                onClick={() => handleSort('id')}
                className="py-3.5 px-4 cursor-pointer hover:text-slate-900 select-none whitespace-nowrap"
              >
                <div className="flex items-center gap-1">
                  <span>ID SKU</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th className="py-3.5 px-4 whitespace-nowrap">Kategori</th>
              <th
                onClick={() => handleSort('brand')}
                className="py-3.5 px-4 cursor-pointer hover:text-slate-900 select-none whitespace-nowrap"
              >
                <div className="flex items-center gap-1">
                  <span>Brand & Varian</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th
                onClick={() => handleSort('stokUtama')}
                className="py-3.5 px-4 cursor-pointer hover:text-slate-900 select-none text-right whitespace-nowrap"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Stok Utama</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th className="py-3.5 px-4 text-right whitespace-nowrap">Pecahan</th>
              <th className="py-3.5 px-4 text-center whitespace-nowrap">Status</th>
              <th className="py-3.5 px-4 text-center whitespace-nowrap">Aksi Cepat Gudang</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center">
                    <Filter size={32} className="mb-2 text-slate-300" />
                    <p className="font-semibold text-xs text-slate-700">Tidak ada item inventaris yang cocok</p>
                    <p className="text-[11px] mt-0.5 text-slate-400">Coba ubah kata kunci pencarian atau reset filter kategori.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const min = item.minStok !== undefined ? item.minStok : 2;
                const isOutOfStock = Number(item.stokUtama || 0) === 0 && Number(item.stokPecahan || 0) === 0;
                const isLowStock = Number(item.stokUtama || 0) <= min;

                return (
                  <tr
                    key={item.id}
                    className={`transition-colors hover:bg-slate-50/70 ${
                      isOutOfStock
                        ? 'bg-rose-50/20'
                        : isLowStock
                        ? 'bg-amber-50/20'
                        : ''
                    }`}
                  >
                    {/* SKU ID */}
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-700 whitespace-nowrap">
                      {item.id}
                    </td>

                    {/* Kategori */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                        item.kategori === 'Kaca Film'
                          ? 'bg-blue-50 text-blue-700 border-blue-200/80'
                          : item.kategori === 'Coating'
                          ? 'bg-purple-50 text-purple-700 border-purple-200/80'
                          : item.kategori === 'PPF'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                          : 'bg-slate-100 text-slate-700 border-slate-200/80'
                      }`}>
                        {item.kategori}
                      </span>
                    </td>

                    {/* Brand & Varian */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 text-xs">
                        {item.brand} {item.varian}
                      </div>
                      {item.kegelapan && (
                        <span className="text-[10px] text-slate-500 font-mono">
                          Kegelapan: {item.kegelapan}
                        </span>
                      )}
                    </td>

                    {/* Stok Utama */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5 font-mono">
                        <span className={`text-sm font-bold ${
                          isOutOfStock
                            ? 'text-rose-600'
                            : isLowStock
                            ? 'text-amber-600'
                            : 'text-slate-900'
                        }`}>
                          {item.stokUtama}
                        </span>
                        <span className="text-slate-500 text-xs">
                          {item.satuan}
                        </span>
                      </div>
                    </td>

                    {/* Pecahan */}
                    <td className="py-3.5 px-4 text-right font-mono text-slate-600 whitespace-nowrap">
                      {item.stokPecahan > 0 ? (
                        <span className="font-semibold text-slate-800">
                          {item.stokPecahan} {item.kategori === 'Coating' ? 'ml' : 'm'}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {isOutOfStock ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle size={12} />
                          HABIS (0)
                        </span>
                      ) : isLowStock ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <AlertTriangle size={12} />
                          MENIPIS (&le;2)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 size={12} />
                          AMAN
                        </span>
                      )}
                    </td>

                    {/* Quick Action Buttons (Uniform height & crisp spacing) */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* 1. Restock */}
                        <button
                          onClick={() => onOpenRestock(item)}
                          title="Restock Barang Masuk"
                          className="h-7 px-2.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/80 rounded-lg flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                        >
                          <PackagePlus size={13} />
                          <span>Restock</span>
                        </button>

                        {/* 2. Adjust (Stok Opname) */}
                        <button
                          onClick={() => onOpenAdjust(item)}
                          title="Stok Opname / Penyesuaian Fisik"
                          className="h-7 px-2.5 text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100/80 border border-amber-200/80 rounded-lg flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                        >
                          <SlidersHorizontal size={13} />
                          <span>Adjust</span>
                        </button>

                        {/* 3. Flag Discrepancy Comms */}
                        <button
                          onClick={() => onOpenDiscrepancy(item)}
                          title="Laporkan Selisih ke Admin"
                          className="h-7 px-2.5 text-[11px] font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
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

      {/* Table Footer info */}
      <div className="p-3.5 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>Menampilkan <strong>{filteredItems.length}</strong> dari {inventory.length} SKU total</span>
        <span className="text-[11px] text-slate-400">Sistem POS otomatis memotong stok saat order selesai</span>
      </div>
    </div>
  );
};

export default MasterStockTable;
