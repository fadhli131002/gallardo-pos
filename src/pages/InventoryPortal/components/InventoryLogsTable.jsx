import React, { useState, useMemo } from 'react';
import {
  Search,
  ArrowDownRight,
  ArrowUpRight,
  RotateCcw,
  Calendar,
  Layers,
  ShoppingBag,
  Wrench,
  PackageCheck,
  SlidersHorizontal,
  X
} from 'lucide-react';

const InventoryLogsTable = ({ logs = [] }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'WORKSHOP' | 'RETAIL' | 'RESTOCK' | 'ADJUST'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // 1. Filter by transaction type
      if (filterType !== 'ALL') {
        const jenis = log.jenis || (log.keterangan?.toLowerCase().includes('restock') ? 'RESTOCK' : 'DEDUCT');
        const isRetail = log.type === 'Retail (Grosir)' || (log.orderId && String(log.orderId).startsWith('RTL'));

        if (filterType === 'RESTOCK' && jenis !== 'RESTOCK') return false;
        if (filterType === 'ADJUST' && jenis !== 'ADJUST') return false;
        if (filterType === 'RETAIL' && (!isRetail || jenis !== 'DEDUCT')) return false;
        if (filterType === 'WORKSHOP' && (isRetail || jenis !== 'DEDUCT')) return false;
      }

      // 2. Filter by date range
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

      // 3. Search query
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
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden transition-colors">
      {/* Top Filter Bar - Bento Primary Row */}
      <div
        className="px-6 py-4 border-b border-slate-100 flex flex-row items-center justify-between gap-4 bg-slate-50/50 w-full"
        style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
      >
        {/* Left: Search box */}
        <div className="relative w-72 sm:w-80 flex-shrink-0">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari item, Order ID, layanan, customer..."
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

        {/* Right: Date range filters & Reset */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 h-10 shadow-[0_1px_2px_rgba(0,0,0,0.04)] text-xs">
            <Calendar size={14} className="text-slate-400 flex-shrink-0" />
            <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">Periode:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-slate-700 text-xs focus:outline-none cursor-pointer font-medium"
            />
            <span className="text-slate-300 font-bold">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-slate-700 text-xs focus:outline-none cursor-pointer font-medium"
            />
            {(startDate || endDate) && (
              <button
                onClick={() => { setStartDate(''); setEndDate(''); }}
                className="text-slate-400 hover:text-slate-600 font-bold ml-1 text-xs"
                title="Clear rentang tanggal"
              >
                &times;
              </button>
            )}
          </div>

          {hasActiveFilter && (
            <button
              onClick={resetFilters}
              className="h-10 px-3.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
              title="Reset semua filter"
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-toolbar: Bento Segmented Category Pills & Record Counter */}
      <div
        className="px-6 py-3 bg-white border-b border-slate-100 flex flex-row items-center justify-between gap-4 w-full overflow-x-auto"
        style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
      >
        {/* Quick Type Tabs */}
        <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/80 flex-shrink-0">
          {[
            { id: 'ALL', label: 'Semua Transaksi', icon: Layers },
            { id: 'WORKSHOP', label: 'Workshop (Pemasangan)', icon: Wrench },
            { id: 'RETAIL', label: 'Retail (Grosir)', icon: ShoppingBag },
            { id: 'RESTOCK', label: 'Restock Masuk', icon: PackageCheck },
            { id: 'ADJUST', label: 'Stok Opname (Adjust)', icon: SlidersHorizontal }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setFilterType(id)}
              className={`h-8 px-3 text-xs font-semibold rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-all ${
                filterType === id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Icon size={13} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Counter Info */}
        <div className="text-xs text-slate-500 font-medium whitespace-nowrap flex-shrink-0">
          Menampilkan <span className="font-bold text-slate-900">{filteredLogs.length}</span> dari <span className="font-bold text-slate-900">{logs.length}</span> catatan
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/75 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
            <tr>
              <th className="py-3.5 px-4 whitespace-nowrap">Tanggal & Waktu</th>
              <th className="py-3.5 px-4 whitespace-nowrap">Order ID</th>
              <th className="py-3.5 px-4 whitespace-nowrap">Layanan / SPK</th>
              <th className="py-3.5 px-4 whitespace-nowrap">Item Bahan</th>
              <th className="py-3.5 px-4 whitespace-nowrap">Dipotong / Mutasi</th>
              <th className="py-3.5 px-4 whitespace-nowrap">Sisa Stok</th>
              <th className="py-3.5 px-4 whitespace-nowrap text-center">Jenis</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-16 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Calendar size={36} className="text-slate-300 stroke-[1.5]" />
                    <p className="font-semibold text-xs text-slate-700">Belum ada catatan log mutasi yang sesuai filter.</p>
                    <p className="text-[11px] text-slate-400">Pastikan filter tanggal atau kata kunci pencarian sudah tepat.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredLogs.map((log, index) => {
                const jenis = log.jenis || (log.keterangan?.toLowerCase().includes('restock') ? 'RESTOCK' : 'DEDUCT');
                const isRestock = jenis === 'RESTOCK';
                const isDeduct = jenis === 'DEDUCT';
                const isAdjust = jenis === 'ADJUST';

                return (
                  <tr key={log.id || index} className="hover:bg-slate-50/60 transition-colors">
                    {/* 1. Tanggal */}
                    <td className="py-3.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {new Date(log.date || log.created_at || Date.now()).toLocaleString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>

                    {/* 2. Order ID */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] border border-slate-200/60">
                        {log.orderId || '-'}
                      </span>
                    </td>

                    {/* 3. Layanan */}
                    <td className="py-3.5 px-4 max-w-xs text-slate-900">
                      <div className="font-semibold line-clamp-1" title={log.serviceName}>
                        {log.serviceName || '-'}
                      </div>
                      {log.customerName && log.customerName !== 'Pelanggan Umum' && (
                        <div className="text-[11px] text-slate-500 truncate">
                          Pelanggan: {log.customerName}
                        </div>
                      )}
                    </td>

                    {/* 4. Item Bahan */}
                    <td className="py-3.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      {log.itemName}
                    </td>

                    {/* 5. Dipotong / Mutasi */}
                    <td className="py-3.5 px-4 font-mono font-bold whitespace-nowrap">
                      {isRestock ? (
                        <span className="text-emerald-600">
                          +{log.deducted || '1'}
                        </span>
                      ) : isAdjust ? (
                        <span className="text-amber-600">
                          ~{log.deducted || '1'}
                        </span>
                      ) : (
                        <span className="text-rose-600">
                          -{log.deducted || '1'}
                        </span>
                      )}
                    </td>

                    {/* 6. Sisa Stok */}
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-600 whitespace-nowrap">
                      {log.remaining || '-'}
                    </td>

                    {/* 7. Jenis Badge */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isRestock
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                          : isDeduct
                          ? 'bg-rose-50 text-rose-700 border border-rose-200/80'
                          : 'bg-amber-50 text-amber-700 border border-amber-200/80'
                      }`}>
                        {isRestock && <ArrowDownRight size={11} />}
                        {isDeduct && <ArrowUpRight size={11} />}
                        {isAdjust && <RotateCcw size={11} />}
                        <span>{isRestock ? 'Masuk (Restock)' : isDeduct ? 'Keluar (Deduct)' : 'Opname (Adjust)'}</span>
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer info */}
      <div
        className="px-6 py-3.5 bg-slate-50/50 border-t border-slate-100 flex flex-row items-center justify-between text-xs text-slate-500 w-full"
        style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <span>Menampilkan <strong>{filteredLogs.length}</strong> riwayat mutasi stok</span>
        <span className="text-[11px] text-slate-400">Terintegrasi real-time dengan transaksi POS Kasir & Dashboard Admin</span>
      </div>
    </div>
  );
};

export default InventoryLogsTable;
