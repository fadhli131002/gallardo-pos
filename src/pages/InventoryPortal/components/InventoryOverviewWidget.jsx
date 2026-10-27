import React from 'react';
import { Package, AlertTriangle, ArrowUpDown, MessageSquareWarning, ArrowUpRight, ArrowDownRight, Layers } from 'lucide-react';

const InventoryOverviewWidget = ({
  inventory = [],
  inventoryLogs = [],
  openDiscrepancies = 0,
  isLowStockOnly,
  onToggleLowStockFilter,
  onSwitchTab
}) => {
  // Total master items
  const totalItems = inventory.length;

  // Items with low stock (stokUtama <= minStok, default 2)
  const lowStockItems = inventory.filter(item => {
    const min = item.minStok !== undefined ? item.minStok : 2;
    return Number(item.stokUtama || 0) <= min;
  });
  const lowStockCount = lowStockItems.length;

  // Calculate today's mutations from logs
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayLogs = inventoryLogs.filter(log => {
    const logDate = new Date(log.date || log.created_at || Date.now());
    return logDate >= todayStart;
  });

  const restockTodayCount = todayLogs.filter(l => l.jenis === 'RESTOCK').length;
  const deductTodayCount = todayLogs.filter(l => l.jenis === 'DEDUCT' || !l.jenis).length;
  const adjustTodayCount = todayLogs.filter(l => l.jenis === 'ADJUST').length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Total Master SKU Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500">
            Total Master Item
          </span>
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 transition-colors">
            <Package size={18} />
          </div>
        </div>

        <div className="my-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold font-mono tracking-tight text-slate-900">
            {totalItems}
          </span>
          <span className="text-xs text-slate-500 font-medium">
            SKU Aktif
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-2 border-t border-slate-100">
          <Layers size={13} className="text-indigo-500 flex-shrink-0" />
          <span className="truncate">Kaca Film, Coating, PPF & Tools</span>
        </div>
        <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500/80"></div>
      </div>

      {/* 2. Low Stock Warning Card (Soft Bento Styling - No glaring harsh red) */}
      <div
        onClick={onToggleLowStockFilter}
        className={`cursor-pointer rounded-2xl p-5 transition-all duration-200 flex flex-col justify-between relative overflow-hidden group border ${
          isLowStockOnly
            ? 'bg-amber-50/60 border-amber-300 ring-2 ring-amber-400/40 shadow-sm'
            : lowStockCount > 0
            ? 'bg-white border-slate-200/90 hover:border-amber-300 hover:shadow-md shadow-[0_1px_3px_rgba(0,0,0,0.04)]'
            : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-[0_1px_3px_rgba(0,0,0,0.04)]'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500">
            Peringatan Stok Menipis
          </span>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-colors ${
            lowStockCount > 0
              ? 'bg-amber-50 text-amber-600 border-amber-200/80'
              : 'bg-emerald-50 text-emerald-600 border-emerald-200/80'
          }`}>
            <AlertTriangle size={18} />
          </div>
        </div>

        <div className="my-3 flex items-baseline gap-2">
          <span className={`text-3xl font-extrabold font-mono tracking-tight ${
            lowStockCount > 0 ? 'text-amber-600' : 'text-slate-900'
          }`}>
            {lowStockCount}
          </span>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80">
            Batas &le; 2 Unit
          </span>
        </div>

        <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
          <span className="text-slate-500 truncate">
            {isLowStockOnly ? 'Filter Aktif (Menipis)' : 'Klik untuk filter tabel'}
          </span>
          <span className="font-semibold text-amber-700 hover:text-amber-800 underline underline-offset-4 flex-shrink-0">
            {isLowStockOnly ? 'Reset' : 'Lihat Item'}
          </span>
        </div>
        <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500/80"></div>
      </div>

      {/* 3. Mutations Today Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500">
            Mutasi Stok Hari Ini
          </span>
          <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 transition-colors">
            <ArrowUpDown size={18} />
          </div>
        </div>

        <div className="my-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold font-mono tracking-tight text-slate-900">
            {todayLogs.length}
          </span>
          <span className="text-xs text-slate-500 font-medium">
            Aktivitas
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs pt-2 border-t border-slate-100">
          <span className="inline-flex items-center text-emerald-700 font-mono font-medium bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100/80 text-[11px]">
            <ArrowDownRight size={13} className="mr-0.5" /> +{restockTodayCount} Masuk
          </span>
          <span className="inline-flex items-center text-rose-700 font-mono font-medium bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100/80 text-[11px]">
            <ArrowUpRight size={13} className="mr-0.5" /> -{deductTodayCount} Terpakai
          </span>
        </div>
        <div className="absolute top-0 left-0 right-0 h-1 bg-sky-500/80"></div>
      </div>

      {/* 4. Stock Discrepancy Comms Card */}
      <div
        onClick={() => onSwitchTab && onSwitchTab('comms')}
        className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-md hover:border-orange-300 transition-all duration-200 flex flex-col justify-between relative overflow-hidden cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500">
            Isu Selisih Stok
          </span>
          <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 transition-colors">
            <MessageSquareWarning size={18} />
          </div>
        </div>

        <div className="my-3 flex items-baseline gap-2">
          <span className={`text-3xl font-extrabold font-mono tracking-tight ${
            openDiscrepancies > 0 ? 'text-orange-600' : 'text-slate-900'
          }`}>
            {openDiscrepancies}
          </span>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200/80">
            Tiket Terbuka
          </span>
        </div>

        <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
          <span className="text-slate-500 truncate">
            Diskusi Gudang & Admin
          </span>
          <span className="font-semibold text-orange-600 group-hover:translate-x-0.5 transition-transform flex-shrink-0">
            Buka Chat &rarr;
          </span>
        </div>
        <div className="absolute top-0 left-0 right-0 h-1 bg-orange-500/80"></div>
      </div>
    </div>
  );
};

export default InventoryOverviewWidget;
